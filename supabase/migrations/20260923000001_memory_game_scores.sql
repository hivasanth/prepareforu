-- ============================================================================
-- 20260923000001_memory_game_scores.sql
--
-- Memory Games — Number Memory Rush: session + score persistence, RLS, realtime
-- publication and the authoritative SECURITY DEFINER RPC surface.
--
-- SECURITY MODEL (see also: 20260820000001_attempt_mutation_rpcs.sql)
--   * The client NEVER writes the tables directly: there are no INSERT/UPDATE/
--     DELETE policies. Every mutation goes through a SECURITY DEFINER RPC with
--     an auth.uid() ownership guard and least-privilege EXECUTE grants.
--   * `submit_memory_game_score` recomputes every bound server-side (score is
--     bounded by the deterministic level table below) and is idempotent per
--     session — a replayed submission returns the already-stored result.
--   * Leaderboard reads return only leaderboard-safe fields (display name,
--     score, level, number, stages, accuracy, completed_at) via a guarded RPC.
--   * `memory_game_scores` is added to the realtime publication so clients can
--     live-refresh the leaderboard; the client only uses the change as an
--     invalidation signal and re-reads through the RPC.
--
-- SERVER PARITY: the four constants below mirror src/config/memoryGames.ts.
-- Keep them in lockstep when progression changes.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.memory_game_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id      TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'started'
                           CHECK (status IN ('started', 'finalized', 'expired')),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.memory_game_scores (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID         NOT NULL UNIQUE
                                     REFERENCES public.memory_game_sessions(id) ON DELETE CASCADE,
  user_id               UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_id               TEXT         NOT NULL DEFAULT 'number_memory_rush',
  score                 INTEGER      NOT NULL CHECK (score >= 0),
  highest_level         INTEGER      NOT NULL CHECK (highest_level >= 1),
  highest_number        INTEGER      NOT NULL CHECK (highest_number >= 3),
  stages_completed      INTEGER      NOT NULL CHECK (stages_completed >= 0),
  stages_failed         INTEGER      NOT NULL DEFAULT 0 CHECK (stages_failed >= 0),
  mistakes              INTEGER      NOT NULL DEFAULT 0 CHECK (mistakes >= 0),
  accuracy              NUMERIC(5,2) NOT NULL DEFAULT 100
                                     CHECK (accuracy >= 0 AND accuracy <= 100),
  average_reaction_time NUMERIC(10,2) NOT NULL DEFAULT 0
                                     CHECK (average_reaction_time >= 0),
  completed_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_game_sessions_owner
  ON public.memory_game_sessions(user_id, game_id, status);

CREATE INDEX IF NOT EXISTS idx_memory_game_scores_game_rank
  ON public.memory_game_scores(game_id, score DESC, completed_at ASC);

CREATE INDEX IF NOT EXISTS idx_memory_game_scores_user
  ON public.memory_game_scores(user_id, game_id, score DESC);

-- ---------------------------------------------------------------------------
-- 2. RLS — deny direct writes, allow authenticated leaderboard reads only.
--    (The SELECT policy is what makes realtime change delivery possible; the
--    stored data is by definition public leaderboard data.)
-- ---------------------------------------------------------------------------

ALTER TABLE public.memory_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_game_scores   ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'memory_game_scores_read'
                 AND polrelid = 'public.memory_game_scores'::regclass) THEN
    CREATE POLICY "memory_game_scores_read"
      ON public.memory_game_scores FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 3. RPC: start_memory_game_session
--    Resumes the caller's open session if one exists (idempotent), otherwise
--    creates one. Stale open sessions are expired first so a long-abandoned run
--    can never be silently resumed.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.start_memory_game_session(
  p_game_id TEXT DEFAULT 'number_memory_rush'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_session_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_game_id IS DISTINCT FROM 'number_memory_rush' THEN
    RAISE EXCEPTION 'Unsupported game';
  END IF;

  -- Expire abandoned sessions (older than 30 minutes) for this user + game.
  UPDATE public.memory_game_sessions
     SET status = 'expired'
   WHERE user_id = v_uid
     AND game_id = p_game_id
     AND status = 'started'
     AND started_at < now() - INTERVAL '30 minutes';

  SELECT id INTO v_session_id
    FROM public.memory_game_sessions
   WHERE user_id = v_uid
     AND game_id = p_game_id
     AND status = 'started'
   ORDER BY started_at DESC
   LIMIT 1;

  IF v_session_id IS NULL THEN
    INSERT INTO public.memory_game_sessions(user_id, game_id)
    VALUES (v_uid, p_game_id)
    RETURNING id INTO v_session_id;
  END IF;

  RETURN jsonb_build_object('session_id', v_session_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.start_memory_game_session(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.start_memory_game_session(TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.start_memory_game_session(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. RPC: submit_memory_game_score
--    The ONLY accepted write path. Re-validates ownership, session state,
--    elapsed time and every score bound (mirroring the client level table).
--    Idempotent: a replay of an already-finalized session returns the stored
--    result instead of inserting a second row.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_memory_game_score(
  p_session_id            UUID,
  p_game_id               TEXT,
  p_score                 INTEGER,
  p_highest_level         INTEGER,
  p_highest_number        INTEGER,
  p_stages_completed      INTEGER,
  p_stages_failed         INTEGER,
  p_mistakes              INTEGER,
  p_accuracy              NUMERIC,
  p_average_reaction_time NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  -- SERVER PARITY CONSTANTS (src/config/memoryGames.ts).
  c_stage_score       CONSTANT INTEGER := 5;
  c_level_bonus       CONSTANT INTEGER := 10;
  c_stages_per_level  CONSTANT INTEGER := 4;
  c_starting_numbers  CONSTANT INTEGER := 3;
  c_max_levels        CONSTANT INTEGER := 12;

  v_uid           UUID := auth.uid();
  v_session       public.memory_game_sessions%ROWTYPE;
  v_existing      public.memory_game_scores%ROWTYPE;
  v_elapsed_ms    NUMERIC;
  v_max_score     INTEGER;
  v_min_stages    INTEGER;
  v_max_stages    INTEGER;
  v_bonus_points  INTEGER;
  v_levels_done   INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_game_id IS DISTINCT FROM 'number_memory_rush' THEN
    RAISE EXCEPTION 'Unsupported game';
  END IF;
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'Missing session';
  END IF;

  SELECT * INTO v_session
    FROM public.memory_game_sessions
   WHERE id = p_session_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;
  IF v_session.user_id <> v_uid THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF v_session.game_id <> p_game_id THEN
    RAISE EXCEPTION 'Game mismatch';
  END IF;

  -- Idempotency: a finalized session returns the stored result unchanged.
  IF v_session.status = 'finalized' THEN
    SELECT * INTO v_existing
      FROM public.memory_game_scores
     WHERE session_id = p_session_id;
    RETURN jsonb_build_object(
      'accepted', true, 'duplicate', true, 'score', COALESCE(v_existing.score, 0));
  END IF;
  IF v_session.status <> 'started' THEN
    RAISE EXCEPTION 'Session is no longer valid';
  END IF;

  -- Plausible session duration (anti-instant / anti-replay).
  v_elapsed_ms := EXTRACT(EPOCH FROM (now() - v_session.started_at)) * 1000;
  IF v_elapsed_ms < 1000 THEN
    RAISE EXCEPTION 'Session too short to be valid';
  END IF;
  IF v_elapsed_ms > 10800000 THEN  -- 3 hours
    RAISE EXCEPTION 'Session expired';
  END IF;

  IF p_highest_level IS NULL OR p_highest_level < 1 OR p_highest_level > c_max_levels THEN
    RAISE EXCEPTION 'Invalid level';
  END IF;
  IF p_highest_number IS NULL
     OR p_highest_number <> c_starting_numbers + (p_highest_level - 1) THEN
    RAISE EXCEPTION 'Number count does not match the level';
  END IF;

  v_min_stages := (p_highest_level - 1) * c_stages_per_level;
  v_max_stages := p_highest_level * c_stages_per_level;
  IF p_stages_completed IS NULL
     OR p_stages_completed < v_min_stages
     OR p_stages_completed > v_max_stages THEN
    RAISE EXCEPTION 'Impossible stage count';
  END IF;

  v_max_score := p_highest_level * (c_stages_per_level * c_stage_score + c_level_bonus);
  IF p_score IS NULL OR p_score < 0 OR p_score > v_max_score THEN
    RAISE EXCEPTION 'Score exceeds the maximum for this level';
  END IF;
  IF p_score < p_stages_completed * c_stage_score THEN
    RAISE EXCEPTION 'Score is lower than the completed stages';
  END IF;

  v_bonus_points := p_score - p_stages_completed * c_stage_score;
  IF v_bonus_points < 0 OR v_bonus_points % c_level_bonus <> 0 THEN
    RAISE EXCEPTION 'Score is not a valid multiple';
  END IF;
  v_levels_done := v_bonus_points / c_level_bonus;
  IF v_levels_done > p_highest_level THEN
    RAISE EXCEPTION 'Impossible completed-level count';
  END IF;

  IF p_accuracy IS NULL OR p_accuracy < 0 OR p_accuracy > 100 THEN
    RAISE EXCEPTION 'Invalid accuracy';
  END IF;
  IF p_mistakes IS NULL OR p_mistakes < 0 OR p_mistakes > 100000 THEN
    RAISE EXCEPTION 'Invalid mistake count';
  END IF;
  IF p_stages_failed IS NULL OR p_stages_failed < 0 OR p_stages_failed > p_mistakes THEN
    RAISE EXCEPTION 'Invalid failed-stage count';
  END IF;
  IF p_average_reaction_time IS NULL
     OR p_average_reaction_time < 0
     OR p_average_reaction_time > 600000 THEN
    RAISE EXCEPTION 'Invalid reaction time';
  END IF;

  INSERT INTO public.memory_game_scores(
    session_id, user_id, game_id, score, highest_level, highest_number,
    stages_completed, stages_failed, mistakes, accuracy, average_reaction_time
  ) VALUES (
    p_session_id, v_uid, p_game_id, p_score, p_highest_level, p_highest_number,
    p_stages_completed, p_stages_failed, p_mistakes, p_accuracy, p_average_reaction_time
  );

  UPDATE public.memory_game_sessions
     SET status = 'finalized', finalized_at = now()
   WHERE id = p_session_id;

  RETURN jsonb_build_object('accepted', true, 'duplicate', false, 'score', p_score);

EXCEPTION
  WHEN unique_violation THEN
    -- Concurrent replay lost the race — return the stored result.
    SELECT * INTO v_existing
      FROM public.memory_game_scores
     WHERE session_id = p_session_id;
    RETURN jsonb_build_object(
      'accepted', true, 'duplicate', true, 'score', COALESCE(v_existing.score, 0));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_memory_game_score(
  UUID, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_memory_game_score(
  UUID, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC
) FROM anon;
GRANT  EXECUTE ON FUNCTION public.submit_memory_game_score(
  UUID, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC
) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. RPC: get_memory_game_leaderboard
--    Best run per user, globally ranked server-side. Returns only safe fields.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_memory_game_leaderboard(
  p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_limit INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);

  RETURN (
    WITH best AS (
      SELECT DISTINCT ON (s.user_id)
             s.user_id, s.score, s.highest_level, s.highest_number,
             s.stages_completed, s.accuracy, s.completed_at
        FROM public.memory_game_scores s
       WHERE s.game_id = 'number_memory_rush'
       ORDER BY s.user_id, s.score DESC, s.completed_at ASC, s.id ASC
    ),
    ranked AS (
      SELECT ROW_NUMBER() OVER (
               ORDER BY b.score DESC, b.completed_at ASC, b.user_id ASC
             ) AS rank,
             COALESCE(u.full_name, 'Anonymous Student') AS user_name,
             b.score, b.highest_level, b.highest_number,
             b.stages_completed, b.accuracy, b.completed_at
        FROM best b
        JOIN public.users u ON u.id = b.user_id
       ORDER BY b.score DESC, b.completed_at ASC, b.user_id ASC
       LIMIT v_limit
    )
    SELECT COALESCE(jsonb_agg(row_to_json(ranked)), '[]'::jsonb) FROM ranked
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_memory_game_leaderboard(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_memory_game_leaderboard(INTEGER) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_memory_game_leaderboard(INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. RPC: get_memory_game_personal_best
--    The caller's own best run (never accepts a user id — auth.uid() only).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_memory_game_personal_best(
  p_game_id TEXT DEFAULT 'number_memory_rush'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row public.memory_game_scores%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_row
    FROM public.memory_game_scores
   WHERE user_id = v_uid
     AND game_id = p_game_id
   ORDER BY score DESC, completed_at ASC, id ASC
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'score', v_row.score,
    'highest_level', v_row.highest_level,
    'highest_number', v_row.highest_number,
    'stages_completed', v_row.stages_completed,
    'accuracy', v_row.accuracy,
    'completed_at', v_row.completed_at
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_memory_game_personal_best(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_memory_game_personal_best(TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_memory_game_personal_best(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Realtime — publish score inserts so leaderboards live-refresh.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'memory_game_scores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.memory_game_scores;
  END IF;
END
$$;

COMMIT;

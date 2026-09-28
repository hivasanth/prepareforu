-- ============================================================================
-- 20260925000001_memory_games_multi_game.sql
--
-- Memory Games — enable the SECOND title (Visual Memory Matrix) on the SAME
-- shared score model introduced in 20260923000001, plus the daily refinement in
-- 20260924000001.
--
-- WHAT CHANGES
--   1. `start_memory_game_session` accepts both shipped game ids.
--   2. `submit_memory_game_score` accepts both shipped game ids and applies the
--      correct per-game maximum level (Rush 12, Matrix 15). The highest-number
--      parity check is UNCHANGED because both games grow their primary metric
--      by one per level from the same starting value (3).
--   3. `get_memory_game_leaderboard` gains a `p_game_id` parameter (default
--      'number_memory_rush') so each title has its own daily board. PostgREST
--      binds arguments by name, so the default keeps any legacy `{p_limit}`
--      caller working; the old 1-arg function is dropped to avoid an ambiguous
--      overload.
--   4. A data-layer CHECK pins `game_id` to the shipped titles on both tables.
--
-- NO new tables, NO new realtime publication (memory_game_scores is already
-- published). `get_memory_game_personal_best(p_game_id)` already supported any
-- game id and is unchanged.
--
-- SERVER PARITY (src/config/memoryGames.ts): c_stage_score=5, c_level_bonus=10,
-- c_stages_per_level=4, c_starting_numbers=3, Rush c_max_levels=12,
-- Matrix c_max_levels=15. Keep in lockstep when progression changes.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Data-layer guard: only shipped games may be persisted.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'memory_game_sessions_game_id_known'
       AND conrelid = 'public.memory_game_sessions'::regclass
  ) THEN
    ALTER TABLE public.memory_game_sessions
      ADD CONSTRAINT memory_game_sessions_game_id_known
      CHECK (game_id IN ('number_memory_rush', 'visual_memory_matrix'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'memory_game_scores_game_id_known'
       AND conrelid = 'public.memory_game_scores'::regclass
  ) THEN
    ALTER TABLE public.memory_game_scores
      ADD CONSTRAINT memory_game_scores_game_id_known
      CHECK (game_id IN ('number_memory_rush', 'visual_memory_matrix'));
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. RPC: start_memory_game_session — accept both titles.
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
  IF p_game_id IS NULL
     OR p_game_id NOT IN ('number_memory_rush', 'visual_memory_matrix') THEN
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
-- 3. RPC: submit_memory_game_score — accept both titles, per-game max level.
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

  v_uid           UUID := auth.uid();
  v_max_levels    INTEGER;
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
  IF p_game_id IS NULL
     OR p_game_id NOT IN ('number_memory_rush', 'visual_memory_matrix') THEN
    RAISE EXCEPTION 'Unsupported game';
  END IF;
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'Missing session';
  END IF;

  -- Per-game maximum level (Rush 12, Matrix 15).
  v_max_levels := CASE
    WHEN p_game_id = 'visual_memory_matrix' THEN 15
    ELSE 12
  END;

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

  IF p_highest_level IS NULL OR p_highest_level < 1 OR p_highest_level > v_max_levels THEN
    RAISE EXCEPTION 'Invalid level';
  END IF;
  -- Both games grow their primary metric (numbers / pattern targets) by one per
  -- level from the same starting value, so this parity check is game-agnostic.
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
-- 4. RPC: get_memory_game_leaderboard — per-game daily board.
--    Drop the old 1-arg overload first: adding a parameter creates a NEW
--    signature, and keeping both would leave an ambiguous defaulted overload.
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_memory_game_leaderboard(INTEGER);

CREATE OR REPLACE FUNCTION public.get_memory_game_leaderboard(
  p_game_id TEXT    DEFAULT 'number_memory_rush',
  p_limit   INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_limit      INTEGER;
  v_game_id    TEXT;
  v_day_start  TIMESTAMPTZ := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_day_end    TIMESTAMPTZ := v_day_start + INTERVAL '1 day';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_game_id := CASE
    WHEN p_game_id = 'visual_memory_matrix' THEN 'visual_memory_matrix'
    ELSE 'number_memory_rush'
  END;

  RETURN (
    WITH today AS (
      SELECT *
        FROM public.memory_game_scores s
       WHERE s.game_id = v_game_id
         AND s.completed_at >= v_day_start
         AND s.completed_at <  v_day_end
    ),
    best AS (
      SELECT DISTINCT ON (t.user_id)
             t.user_id, t.score, t.highest_level, t.highest_number,
             t.stages_completed, t.accuracy, t.completed_at
        FROM today t
       ORDER BY t.user_id, t.score DESC, t.completed_at ASC, t.id ASC
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

REVOKE EXECUTE ON FUNCTION public.get_memory_game_leaderboard(TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_memory_game_leaderboard(TEXT, INTEGER) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_memory_game_leaderboard(TEXT, INTEGER) TO authenticated;

COMMIT;

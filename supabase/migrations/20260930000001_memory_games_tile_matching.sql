-- ============================================================================
-- 20260930000001_memory_games_tile_matching.sql
--
-- Memory Games — replace the THIRD title (Color Reflex) with Tile Matching on
-- the SAME shared score model introduced in 20260923000001 (parity per-game via
-- 20260926000001, Schulte Trail via 20260929000001).
--
-- Tile Matching progression: the GRID is the difficulty axis. Levels 1→5 grow
-- the board 4×3 → 4×4 → 5×4 → 6×4 → 6×5 (6/8/10/12/15 pairs), then it caps at
-- 6×6 (18 pairs, the mobile-safe cap). highest_number is therefore the LEVEL
-- TABLE's pair count (6 → 8 → 10 → 12 → 15 → 18), NOT the linear
-- `starting + (level - 1)` rule — so the submit parity check branches per
-- game:
--   * Rush / Matrix keep  `v_starting_numbers + (level - 1)` (Matrix starts
--     at 4, Rush at 3).
--   * Tile Matching maps the level to its pair count via an exhaustive CASE
--     (1→6, 2→8, 3→10, 4→12, 5→15, 6+→18).
--   * Schulte Trail keeps its own tile-count CASE (unchanged).
--
-- COLOR REFLEX: the Color Reflex title is retired from the application. The
-- DATA-LAYER CHECKs must keep accepting color_reflex, because 3 historical
-- Color Reflex sessions already exist in this project and `ADD CONSTRAINT`
-- validates EVERY existing row — removing the value would fail the migration.
-- The WRITE RPCs (start / submit) reject color_reflex so no NEW Color Reflex
-- rows can ever be created; the read RPC keeps a read-only scope so historical
-- Color Reflex scores remain visible on its (empty) board for anyone who links
-- to them. No rows are deleted.
--
-- WHAT CHANGES
--   1. Data-layer CHECK on BOTH tables now allows tile_matching (and keeps
--      color_reflex for the historical rows).
--   2. `start_memory_game_session` accepts tile_matching, rejects color_reflex.
--   3. `submit_memory_game_score` accepts tile_matching, applies the pair-count
--      parity branch, and rejects color_reflex.
--   4. `get_memory_game_leaderboard` scopes its daily board for tile_matching
--      while keeping the read-only color_reflex scope.
--
-- NO new tables, NO new realtime publication (memory_game_scores is already
-- published). `get_memory_game_personal_best(p_game_id)` is unchanged.
--
-- SERVER PARITY (src/config/memoryGames.ts): c_stage_score=5, c_level_bonus=10,
-- c_stages_per_level=4, Rush/Matrix start parity (3/4), Tile Matching
-- highest_number = the level-table pairs (6/8/10/12/15/18), Schulte highest
-- number = the level-table tiles (16/25/36), Rush/Tile Matching/Schulte max 12,
-- Matrix max 15. Keep in lockstep when progression changes.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Data-layer guard: tile_matching joins the shipped titles on both tables.
--    color_reflex is KEPT in this guard (historical rows — ADD CONSTRAINT
--    validates the 3 existing Color Reflex sessions). The RPC guards below are
--    the enforcement point that blocks NEW color_reflex rows.
-- ---------------------------------------------------------------------------

ALTER TABLE public.memory_game_sessions
  DROP CONSTRAINT IF EXISTS memory_game_sessions_game_id_known;

ALTER TABLE public.memory_game_sessions
  ADD CONSTRAINT memory_game_sessions_game_id_known
  CHECK (game_id IN ('number_memory_rush', 'visual_memory_matrix', 'color_reflex', 'schulte_trail', 'tile_matching'));

ALTER TABLE public.memory_game_scores
  DROP CONSTRAINT IF EXISTS memory_game_scores_game_id_known;

ALTER TABLE public.memory_game_scores
  ADD CONSTRAINT memory_game_scores_game_id_known
  CHECK (game_id IN ('number_memory_rush', 'visual_memory_matrix', 'color_reflex', 'schulte_trail', 'tile_matching'));

-- ---------------------------------------------------------------------------
-- 2. RPC: start_memory_game_session — accept tile_matching, reject
--    color_reflex. Color Reflex sessions are no longer creatable through the
--    only write path (authenticated/anon have no direct DML).
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
     OR p_game_id NOT IN ('number_memory_rush', 'visual_memory_matrix', 'tile_matching', 'schulte_trail') THEN
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
-- 3. RPC: submit_memory_game_score — accept tile_matching, reject
--    color_reflex. Tile Matching breaks the linear parity: its primary metric
--    jumps with the GRID (pairs), so the check branches into a per-game CASE
--    for that title (Schulte keeps its own CASE unchanged).
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

  v_uid               UUID := auth.uid();
  v_max_levels        INTEGER;
  v_starting_numbers  INTEGER;
  v_session           public.memory_game_sessions%ROWTYPE;
  v_existing          public.memory_game_scores%ROWTYPE;
  v_elapsed_ms        NUMERIC;
  v_max_score         INTEGER;
  v_min_stages        INTEGER;
  v_max_stages        INTEGER;
  v_bonus_points      INTEGER;
  v_levels_done       INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_game_id IS NULL
     OR p_game_id NOT IN ('number_memory_rush', 'visual_memory_matrix', 'tile_matching', 'schulte_trail') THEN
    RAISE EXCEPTION 'Unsupported game';
  END IF;
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'Missing session';
  END IF;

  -- Per-game maximum level (Rush 12, Matrix 15, Tile Matching 12, Schulte 12)
  -- and per-game STARTING primary metric for the LINEAR games (Rush 3 digits,
  -- Matrix 4 pattern targets). Tile Matching and Schulte Trail ignore the
  -- linear rule entirely — see the pair/tile-count parity branches below.
  v_max_levels := CASE
    WHEN p_game_id = 'visual_memory_matrix' THEN 15
    ELSE 12
  END;
  v_starting_numbers := CASE
    WHEN p_game_id = 'visual_memory_matrix' THEN 4
    ELSE 3
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
  -- Tile Matching highest_number is its level-table PAIRS (6 → 8 → 10 → 12 →
  -- 15 → 18); Schulte Trail is its level-table TILES (16 → 25 → 36). Players
  -- that keep their own grid table break the linear rule. Every other game
  -- keeps `starting + (level - 1)`.
  IF p_game_id = 'tile_matching' THEN
    IF p_highest_number IS NULL
       OR p_highest_number <> (CASE p_highest_level
         WHEN 1 THEN 6
         WHEN 2 THEN 8
         WHEN 3 THEN 10
         WHEN 4 THEN 12
         WHEN 5 THEN 15
         ELSE 18 END)
    THEN
      RAISE EXCEPTION 'Number count does not match the level';
    END IF;
  ELSIF p_game_id = 'schulte_trail' THEN
    IF p_highest_number IS NULL
       OR p_highest_number <> (CASE p_highest_level
         WHEN 1 THEN 16
         WHEN 2 THEN 16
         WHEN 3 THEN 25
         WHEN 4 THEN 25
         ELSE 36 END)
    THEN
      RAISE EXCEPTION 'Number count does not match the level';
    END IF;
  ELSE
    IF p_highest_number IS NULL
       OR p_highest_number <> v_starting_numbers + (p_highest_level - 1) THEN
      RAISE EXCEPTION 'Number count does not match the level';
    END IF;
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
-- 4. RPC: get_memory_game_leaderboard — include the Tile Matching daily board.
--    color_reflex keeps a READ-ONLY scope so the 0 historical Color Reflex
--    scores remain reachable; since no write path accepts color_reflex anymore,
--    that board can never grow.
-- ---------------------------------------------------------------------------

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
    WHEN p_game_id = 'color_reflex' THEN 'color_reflex'
    WHEN p_game_id = 'tile_matching' THEN 'tile_matching'
    WHEN p_game_id = 'schulte_trail' THEN 'schulte_trail'
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
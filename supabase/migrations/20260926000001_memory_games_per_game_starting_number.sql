-- ============================================================================
-- 20260926000001_memory_games_per_game_starting_number.sql
--
-- Memory Games — per-game STARTING primary metric for the score parity check.
--
-- The shipped progression (20260925000001) assumed BOTH games grow the primary
-- metric (Rush digits / Matrix pattern targets) by one per level from 3. The
-- Matrix refinement changes its Level-1 opening to a 4×4 board with 4 targets,
-- so its parity base becomes 4 (VMM_STARTING_TARGETS in src/config/memoryGames
-- .ts) while Rush keeps 3. Without this migration every valid Matrix score
-- would be rejected by "Number count does not match the level".
--
-- SCOPE: recreate `submit_memory_game_score` only. Nothing else changes —
-- session start, leaderboards, CHECK constraints and grants stay exactly as
-- deployed. The parity base derives from p_game_id, mirroring the existing
-- per-game maximum-level CASE.
--
-- SERVER PARITY (src/config/memoryGames.ts): c_stage_score=5, c_level_bonus=10,
-- c_stages_per_level=4, Rush start=3 (STARTING_NUMBERS), Matrix start=4
-- (VMM_STARTING_TARGETS), Rush c_max_levels=12, Matrix c_max_levels=15.
-- Keep in lockstep when progression changes.
-- ============================================================================

BEGIN;

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
     OR p_game_id NOT IN ('number_memory_rush', 'visual_memory_matrix') THEN
    RAISE EXCEPTION 'Unsupported game';
  END IF;
  IF p_session_id IS NULL THEN
    RAISE EXCEPTION 'Missing session';
  END IF;

  -- Per-game maximum level (Rush 12, Matrix 15) and per-game STARTING primary
  -- metric (Rush 3 digits, Matrix 4 pattern targets). Both games grow their
  -- primary metric by exactly one per level, so the parity check below is
  -- `v_starting_numbers + (level - 1)`.
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
  -- The per-game starting value makes Matrix Level 1 (=4 targets) and every
  -- Matrix level (4 + level − 1, max 18 on the 6×6 board at Level 15) valid.
  IF p_highest_number IS NULL
     OR p_highest_number <> v_starting_numbers + (p_highest_level - 1) THEN
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

COMMIT;
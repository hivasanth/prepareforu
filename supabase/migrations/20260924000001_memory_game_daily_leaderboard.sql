-- ============================================================================
-- 20260924000001_memory_game_daily_leaderboard.sql
--
-- Number Memory Rush — refine the leaderboard to a DAILY scope.
--
-- `get_memory_game_leaderboard` now ranks only the scores completed within the
-- current UTC day (server-authoritative boundary), still best-run-per-user, so
-- the ranking always shows "Today's" top students without any client-side
-- windowing. The function signature (p_limit) is unchanged — the client keeps
-- calling the same RPC.
--
-- DAY BOUNDARY CONTRACT:
--   * Explicit UTC day-truncation (independent of the session timezone):
--       date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
--   * The client mirrors this exact UTC boundary in src/utils/timeUtils.ts
--     (getTodayBoundsUtc / isWithinToday) so the realtime filter and the
--     dialog's "Today" label can never drift from the server.
-- ============================================================================

BEGIN;

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
  v_uid        UUID := auth.uid();
  v_limit      INTEGER;
  v_day_start  TIMESTAMPTZ := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_day_end    TIMESTAMPTZ := v_day_start + INTERVAL '1 day';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  v_limit := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);

  RETURN (
    WITH today AS (
      SELECT *
        FROM public.memory_game_scores s
       WHERE s.game_id = 'number_memory_rush'
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

REVOKE EXECUTE ON FUNCTION public.get_memory_game_leaderboard(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_memory_game_leaderboard(INTEGER) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_memory_game_leaderboard(INTEGER) TO authenticated;

COMMIT;
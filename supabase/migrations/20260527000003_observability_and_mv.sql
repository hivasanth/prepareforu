-- ─── 1. UNIQUE INDEXES ON MATERIALIZED VIEWS ─────────────────────────────────
-- Materialized views MUST have unique indexes for REFRESH MATERIALIZED VIEW CONCURRENTLY to work.
-- This prevents locking the view during background refreshes at scale.

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_attempts_stats_unique 
  ON public.daily_attempts_stats (date, exam_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_exam_distribution_unique 
  ON public.exam_distribution (exam_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_admin_leaderboard_view_unique 
  ON public.admin_leaderboard_view (user_id, exam_id);

-- ─── 2. REFRESH CRON JOB SCHEDULING ──────────────────────────────────────────
-- Remove old schedule if it exists to avoid duplicates
SELECT cron.unschedule('refresh-materialized-views')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'refresh-materialized-views'
);

-- Schedule background concurrently-refreshed materialized views every 10 minutes
SELECT cron.schedule(
    'refresh-materialized-views',
    '*/10 * * * *',
    $$
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.daily_attempts_stats;
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.exam_distribution;
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_leaderboard_view;
    $$
);

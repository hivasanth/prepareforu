-- ─── ADD PAPER_ID TO ADMIN LEADERBOARD VIEW ────────────────────────────────────
-- Each user now appears once per paper (best score) instead of once per exam.
-- This enables paper-level filtering on the admin leaderboard.

-- Drop the old unique index first (required before DROP MATERIALIZED VIEW)
DROP INDEX IF EXISTS public.idx_mv_admin_leaderboard_view_unique;

-- Drop the old materialized view
DROP MATERIALIZED VIEW IF EXISTS public.admin_leaderboard_view;

-- Recreate with paper_id in SELECT and GROUP BY
CREATE MATERIALIZED VIEW public.admin_leaderboard_view AS
 SELECT a.user_id,
    u.full_name AS user_name,
    a.exam_id,
    ec.exam_selection,
    a.paper_id,
    max(a.score) AS best_score,
    max(a.accuracy) AS best_accuracy,
    min(a.duration_seconds) AS best_time_secs,
    max(a.submitted_at) AS last_attempt_date,
    count(a.id) AS total_attempts
   FROM ((public.attempts a
     JOIN public.users u ON ((a.user_id = u.id)))
     JOIN public.exam_configs ec ON ((a.exam_id = ec.exam_id)))
  WHERE ((a.source = 'exam_tab'::public.attempt_source) AND (a.status = 'completed'::public.attempt_status))
  GROUP BY a.user_id, u.full_name, a.exam_id, ec.exam_selection, a.paper_id;

-- New unique index: now per (user_id, exam_id, paper_id) instead of (user_id, exam_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_admin_leaderboard_view_unique
  ON public.admin_leaderboard_view (user_id, exam_id, paper_id);

-- Initial population
REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_leaderboard_view;

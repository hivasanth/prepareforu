-- ─── ADMIN LEADERBOARD VIEW (canonical: no paper_id) ──────────────────────────
-- One row per (user_id, exam_id) = each user's best across ALL papers of an exam.
-- Paper-level admin filtering is served by the precomputed `leaderboard` table
-- (fetchLeaderboardByPaperPaginated), not this materialized view. Do NOT add
-- paper_id here: it would split the "all papers" admin aggregate per paper.

DROP INDEX IF EXISTS public.idx_mv_admin_leaderboard_view_unique;

DROP MATERIALIZED VIEW IF EXISTS public.admin_leaderboard_view;

CREATE MATERIALIZED VIEW public.admin_leaderboard_view AS
 SELECT a.user_id,
    u.full_name AS user_name,
    a.exam_id,
    ec.exam_selection,
    max(a.score) AS best_score,
    max(a.accuracy) AS best_accuracy,
    min(a.duration_seconds) AS best_time_secs,
    max(a.submitted_at) AS last_attempt_date,
    count(a.id) AS total_attempts
   FROM ((public.attempts a
     JOIN public.users u ON ((a.user_id = u.id)))
     JOIN public.exam_configs ec ON ((a.exam_id = ec.exam_id)))
  WHERE ((a.source = 'exam_tab'::public.attempt_source) AND (a.status = 'completed'::public.attempt_status))
  GROUP BY a.user_id, u.full_name, a.exam_id, ec.exam_selection;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_admin_leaderboard_view_unique
  ON public.admin_leaderboard_view (user_id, exam_id);

REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_leaderboard_view;

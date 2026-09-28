-- ─── ADMIN LEADERBOARD — SECURITY BOUNDARY + AUTHORITATIVE RANK ──────────────
-- Remediation targets (admin leaderboard audit):
--   S-1  admin_leaderboard_view is a MATERIALIZED VIEW — RLS does not apply.
--        Direct SELECT is revoked from anon/authenticated/PUBLIC; admins read
--        through the admin-guarded RPC below (get_admin_leaderboard).
--   S-2  refresh_leaderboard_view() now verifies is_admin() internally.
--        Routine MV refresh already runs server-side via pg_cron
--        ('refresh-materialized-views', every 10 min) — browsers never need
--        to trigger it; the RPC remains only as an admin maintenance tool.
--   B-1/B-2  get_admin_leaderboard returns the GLOBAL rank computed with the
--        SAME deterministic ordering used for pagination, including the
--        best_submitted_at / user_id final tiebreakers, so ranks are stable
--        across pages, refreshes, and equal-score ties.

-- ─── S-1: lock direct materialized-view access ───────────────────────────────
REVOKE SELECT ON public.admin_leaderboard_view FROM PUBLIC;
REVOKE SELECT ON public.admin_leaderboard_view FROM anon;
REVOKE SELECT ON public.admin_leaderboard_view FROM authenticated;

-- ─── S-2: admin-guarded MV refresh ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'refresh_leaderboard_view: admin role required'
      USING ERRCODE = '42501';
  END IF;
  REFRESH MATERIALIZED VIEW public.admin_leaderboard_view;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.refresh_leaderboard_view()
  FROM PUBLIC, anon, authenticated;
-- Admins are authenticated users; the function itself enforces is_admin().
GRANT EXECUTE ON FUNCTION public.refresh_leaderboard_view() TO authenticated;

-- ─── B-1/B-2/S-1: ONE authoritative ranked, paginated admin read ─────────────
-- Paper-scoped reads hit the precomputed leaderboard table (rank maintained by
-- pg_cron 'refresh-leaderboard-ranks'); exam-aggregate reads hit the MV.
-- Both branches return the SAME row shape with a global ROW_NUMBER rank over
-- the full filtered set (window functions evaluate before LIMIT/OFFSET) and a
-- total count, so page 2 continues at rank N+1 deterministically.
CREATE OR REPLACE FUNCTION public.get_admin_leaderboard(
  p_exam_ids text[] DEFAULT NULL,
  p_paper_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'get_admin_leaderboard: admin role required'
      USING ERRCODE = '42501';
  END IF;

  IF p_paper_id IS NOT NULL THEN
    RETURN (
      SELECT jsonb_build_object(
        'entries', COALESCE(jsonb_agg(page.entry), '[]'::jsonb),
        'count', MAX(page.total_count)
      )
      FROM (
        SELECT to_jsonb(r) AS entry, r.total_count
        FROM (
          SELECT
            l.user_id,
            COALESCE(NULLIF(trim(u.full_name), ''), 'Unknown') AS user_name,
            l.exam_id,
            l.paper_id,
            ec.exam_selection,
            l.best_score,
            l.best_accuracy,
            l.best_time_secs,
            l.attempt_count AS total_attempts,
            l.best_submitted_at AS last_attempt_date,
            ROW_NUMBER() OVER (
              ORDER BY l.best_score DESC, l.best_accuracy DESC,
                       l.best_time_secs ASC, l.best_submitted_at ASC,
                       l.user_id ASC
            ) AS rank,
            COUNT(*) OVER () AS total_count
          FROM public.leaderboard l
          LEFT JOIN public.users u ON u.id = l.user_id
          LEFT JOIN public.exam_configs ec ON ec.exam_id = l.exam_id
          WHERE l.paper_id = p_paper_id
            AND (p_exam_ids IS NULL OR l.exam_id = ANY (p_exam_ids))
          ORDER BY l.best_score DESC, l.best_accuracy DESC,
                   l.best_time_secs ASC, l.best_submitted_at ASC,
                   l.user_id ASC
          LIMIT p_limit OFFSET p_offset
        ) r
      ) page
    );
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'entries', COALESCE(jsonb_agg(page.entry), '[]'::jsonb),
      'count', MAX(page.total_count)
    )
    FROM (
      SELECT to_jsonb(r) AS entry, r.total_count
      FROM (
        SELECT
          v.user_id,
          COALESCE(NULLIF(trim(v.user_name), ''), 'Unknown') AS user_name,
          v.exam_id,
          NULL::uuid AS paper_id,
          v.exam_selection,
          v.best_score,
          v.best_accuracy,
          v.best_time_secs,
          v.total_attempts,
          v.last_attempt_date,
          ROW_NUMBER() OVER (
            ORDER BY v.best_score DESC, v.best_accuracy DESC,
                     v.best_time_secs ASC, v.last_attempt_date ASC,
                     v.user_id ASC
          ) AS rank,
          COUNT(*) OVER () AS total_count
        FROM public.admin_leaderboard_view v
        WHERE p_exam_ids IS NULL OR v.exam_id = ANY (p_exam_ids)
        ORDER BY v.best_score DESC, v.best_accuracy DESC,
                 v.best_time_secs ASC, v.last_attempt_date ASC,
                 v.user_id ASC
        LIMIT p_limit OFFSET p_offset
      ) r
    ) page
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_admin_leaderboard(text[], uuid, integer, integer)
  FROM PUBLIC, anon;
-- Admins are authenticated users; the function itself enforces is_admin().
GRANT EXECUTE ON FUNCTION public.get_admin_leaderboard(text[], uuid, integer, integer)
  TO authenticated;

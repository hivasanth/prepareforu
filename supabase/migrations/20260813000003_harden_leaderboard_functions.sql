-- Harden SECURITY DEFINER functions: explicit empty search_path (objects are fully qualified)

CREATE OR REPLACE FUNCTION public.refresh_leaderboard_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW public.admin_leaderboard_view;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_leaderboard_ranks(p_exam_id text, p_paper_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.leaderboard l
  SET rank = ranked.rank
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY exam_id, paper_id
        ORDER BY
          best_score DESC,
          best_accuracy DESC,
          best_time_secs ASC,
          best_submitted_at ASC
      ) AS rank
    FROM public.leaderboard
    WHERE exam_id = p_exam_id AND paper_id = p_paper_id
  ) ranked
  WHERE l.id = ranked.id;
END;
$function$;

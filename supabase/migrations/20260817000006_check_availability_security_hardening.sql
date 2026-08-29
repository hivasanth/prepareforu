-- =============================================================================
-- MIGRATION 6: check_availability security hardening
-- Date: 2026-08-17
--
-- H-1: Remove postgres/CLI authorization bypass from check_availability.
--      Production function requires auth.uid() — no exceptions.
-- H-9: Revoke EXECUTE from anon and PUBLIC on both RPCs.
--      Only authenticated + service_role + owner retain EXECUTE.
--
-- This migration uses a SQL file (not inline) to preserve PL/pgSQL $$ delimiters.
-- =============================================================================

-- ─── H-1: Replace check_availability — remove postgres bypass ────────────────

CREATE OR REPLACE FUNCTION public.check_availability(
  p_exam_id text,
  p_paper_id uuid,
  p_mode text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_subjects jsonb := '[]'::jsonb;
  v_subject_record record;
  v_topics jsonb;
  v_topic_record record;
  v_threshold integer;
  v_topic_count integer;
  v_paper_eligible boolean := true;
  v_subject_eligible boolean;
  v_paper_total integer;
  v_paper_available integer;
  v_subject_available integer;
BEGIN
  -- H-1: Reject if not authenticated. No postgres bypass.
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required';
  END IF;

  -- Authorize via trusted role checks
  IF NOT (public.is_admin() OR public.is_sub_admin() OR public.is_exam_allowed_for_user(p_exam_id)) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: No access to exam %', p_exam_id;
  END IF;

  -- Validate mode parameter
  IF p_mode IS NOT NULL AND p_mode NOT IN ('10', '30', '50') THEN
    RAISE EXCEPTION 'INVALID_MODE: Expected NULL, 10, 30, or 50, got %', p_mode;
  END IF;

  -- Validate paper belongs to exam
  SELECT total_questions INTO v_paper_total
  FROM public.exam_papers
  WHERE id = p_paper_id AND exam_id = p_exam_id;

  IF v_paper_total IS NULL THEN
    RAISE EXCEPTION 'PAPER_NOT_FOUND: Paper % not found for exam %', p_paper_id, p_exam_id;
  END IF;

  v_paper_available := 0;

  FOR v_subject_record IN
    SELECT es.id, es.subject_name, es.question_count,
           es.min_questions_per_topic, es.min_for_10, es.min_for_30, es.min_for_50
    FROM public.exam_subjects es
    WHERE es.paper_id = p_paper_id AND es.exam_id = p_exam_id
    ORDER BY es.display_order
  LOOP
    -- Select threshold based on mode
    v_threshold := CASE p_mode
      WHEN '10' THEN v_subject_record.min_for_10
      WHEN '30' THEN v_subject_record.min_for_30
      WHEN '50' THEN v_subject_record.min_for_50
      ELSE v_subject_record.min_questions_per_topic
    END;

    v_topics := '[]'::jsonb;
    v_subject_eligible := true;
    v_subject_available := 0;

    FOR v_topic_record IN
      SELECT et.topic_en, et.topic_te,
             COALESCE(tc.count, 0)::integer AS active_count
      FROM public.exam_topics et
      LEFT JOIN public.topic_counts tc
        ON tc.exam_id = et.exam_id
       AND tc.paper_id = et.paper_id
       AND tc.subject_name = et.subject_name
       AND tc.topic_en = et.topic_en
      WHERE et.exam_id = p_exam_id
        AND et.paper_id = p_paper_id
        AND et.subject_name = v_subject_record.subject_name
      ORDER BY et.display_order
    LOOP
      v_topic_count := v_topic_record.active_count;
      v_subject_available := v_subject_available + v_topic_count;

      v_topics := v_topics || jsonb_build_object(
        'topic_en', v_topic_record.topic_en,
        'topic_te', v_topic_record.topic_te,
        'available', v_topic_count,
        'required', v_threshold,
        'eligible', (v_topic_count >= v_threshold)
      );

      IF v_topic_count < v_threshold THEN
        v_subject_eligible := false;
      END IF;
    END LOOP;

    v_paper_available := v_paper_available + v_subject_available;

    v_subjects := v_subjects || jsonb_build_object(
      'subject_name', v_subject_record.subject_name,
      'required', v_subject_record.question_count,
      'available', v_subject_available,
      'eligible', v_subject_eligible,
      'threshold', v_threshold,
      'topics', v_topics
    );

    IF NOT v_subject_eligible THEN
      v_paper_eligible := false;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'paper_eligible', v_paper_eligible,
    'paper_total_questions', v_paper_total,
    'paper_available_questions', v_paper_available,
    'mode', p_mode,
    'subjects', v_subjects
  );
END;
$function$;

-- ─── H-9: Revoke EXECUTE from anon and PUBLIC ────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.check_availability(text, uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_exam_subjects_batch(jsonb) FROM anon, PUBLIC;

-- Ensure authenticated and service_role retain EXECUTE
GRANT EXECUTE ON FUNCTION public.check_availability(text, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_exam_subjects_batch(jsonb) TO authenticated, service_role;

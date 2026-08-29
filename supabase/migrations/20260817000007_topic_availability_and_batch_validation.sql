-- =============================================================================
-- MIGRATION 7: H-6 — Topic Exam availability contract + H-8 batch validation
-- Date: 2026-08-17
--
-- H-6: Add check_topic_availability() for /topic-exams contract.
--      Lightweight RPC: single topic count via topic_counts view.
--
-- H-8: Harden update_exam_subjects_batch with threshold validation.
--      Rejects null/zero/negative thresholds.
--      Verifies subject IDs belong to the database.
--
-- =============================================================================

-- ─── H-6: check_topic_availability ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_topic_availability(
  p_exam_id text,
  p_paper_id uuid,
  p_subject_name text,
  p_topic_en text,
  p_requested_count integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_available integer;
  v_topic_record record;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required';
  END IF;

  -- Authorize
  IF NOT (public.is_admin() OR public.is_sub_admin() OR public.is_exam_allowed_for_user(p_exam_id)) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: No access to exam %', p_exam_id;
  END IF;

  -- Validate requested count
  IF p_requested_count < 1 THEN
    RAISE EXCEPTION 'INVALID_REQUEST: requested_count must be >= 1, got %', p_requested_count;
  END IF;

  -- Verify topic exists
  SELECT et.topic_en, et.topic_te INTO v_topic_record
  FROM public.exam_topics et
  WHERE et.exam_id = p_exam_id
    AND et.paper_id = p_paper_id
    AND et.subject_name = p_subject_name
    AND et.topic_en = p_topic_en;

  IF v_topic_record IS NULL THEN
    RAISE EXCEPTION 'TOPIC_NOT_FOUND: Topic % not found in subject % for paper %',
      p_topic_en, p_subject_name, p_paper_id;
  END IF;

  -- Get count from topic_counts (single query, no loop)
  SELECT COALESCE(tc.count, 0) INTO v_available
  FROM public.topic_counts tc
  WHERE tc.exam_id = p_exam_id
    AND tc.paper_id = p_paper_id
    AND tc.subject_name = p_subject_name
    AND tc.topic_en = p_topic_en;

  -- If no row in topic_counts, count is 0
  IF v_available IS NULL THEN
    v_available := 0;
  END IF;

  RETURN jsonb_build_object(
    'exam_id', p_exam_id,
    'paper_id', p_paper_id,
    'subject_name', p_subject_name,
    'topic_en', p_topic_en,
    'available', v_available,
    'requested', p_requested_count,
    'eligible', (v_available >= p_requested_count)
  );
END;
$function$;

-- ─── H-8: Harden update_exam_subjects_batch ──────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_exam_subjects_batch(p_subjects jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sub jsonb;
  v_subject_id uuid;
  v_min_per_topic integer;
  v_min_10 integer;
  v_min_30 integer;
  v_min_50 integer;
  v_subject_exists boolean;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: Admin role required';
  END IF;

  FOR v_sub IN SELECT * FROM jsonb_array_elements(p_subjects) LOOP
    v_subject_id := (v_sub->>'id')::uuid;

    -- H-8: Verify subject ID exists
    SELECT EXISTS(SELECT 1 FROM public.exam_subjects WHERE id = v_subject_id) INTO v_subject_exists;
    IF NOT v_subject_exists THEN
      RAISE EXCEPTION 'INVALID_SUBJECT: Subject % does not exist', v_subject_id;
    END IF;

    -- H-8: Validate threshold values when provided
    IF v_sub ? 'min_questions_per_topic' THEN
      v_min_per_topic := (v_sub->>'min_questions_per_topic')::integer;
      IF v_min_per_topic IS NULL OR v_min_per_topic < 1 THEN
        RAISE EXCEPTION 'INVALID_THRESHOLD: min_questions_per_topic must be >= 1, got %', v_min_per_topic;
      END IF;
    END IF;

    IF v_sub ? 'min_for_10' THEN
      v_min_10 := (v_sub->>'min_for_10')::integer;
      IF v_min_10 IS NULL OR v_min_10 < 1 THEN
        RAISE EXCEPTION 'INVALID_THRESHOLD: min_for_10 must be >= 1, got %', v_min_10;
      END IF;
    END IF;

    IF v_sub ? 'min_for_30' THEN
      v_min_30 := (v_sub->>'min_for_30')::integer;
      IF v_min_30 IS NULL OR v_min_30 < 1 THEN
        RAISE EXCEPTION 'INVALID_THRESHOLD: min_for_30 must be >= 1, got %', v_min_30;
      END IF;
    END IF;

    IF v_sub ? 'min_for_50' THEN
      v_min_50 := (v_sub->>'min_for_50')::integer;
      IF v_min_50 IS NULL OR v_min_50 < 1 THEN
        RAISE EXCEPTION 'INVALID_THRESHOLD: min_for_50 must be >= 1, got %', v_min_50;
      END IF;
    END IF;

    -- Perform update
    UPDATE public.exam_subjects
    SET
      question_count = CASE
        WHEN v_sub ? 'question_count' THEN (v_sub->>'question_count')::integer
        ELSE question_count
      END,
      marks_per_question = CASE
        WHEN v_sub ? 'marks_per_question' THEN (v_sub->>'marks_per_question')::numeric
        ELSE marks_per_question
      END,
      min_questions_per_topic = CASE
        WHEN v_sub ? 'min_questions_per_topic' THEN v_min_per_topic
        ELSE min_questions_per_topic
      END,
      min_for_10 = CASE
        WHEN v_sub ? 'min_for_10' THEN v_min_10
        ELSE min_for_10
      END,
      min_for_30 = CASE
        WHEN v_sub ? 'min_for_30' THEN v_min_30
        ELSE min_for_30
      END,
      min_for_50 = CASE
        WHEN v_sub ? 'min_for_50' THEN v_min_50
        ELSE min_for_50
      END
    WHERE id = v_subject_id;
  END LOOP;
END;
$function$;

-- ─── Grant/Revoke EXECUTE ────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.check_topic_availability(text, uuid, text, text, integer) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.check_topic_availability(text, uuid, text, text, integer) FROM anon, PUBLIC;

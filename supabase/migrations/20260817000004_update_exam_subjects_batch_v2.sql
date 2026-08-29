-- =============================================================================
-- MIGRATION: update_exam_subjects_batch — extend to support threshold columns
-- Date: 2026-08-17
--
-- Extends the existing Admin batch-update RPC to atomically update:
--   question_count, marks_per_question (existing)
--   min_questions_per_topic, min_for_10, min_for_30, min_for_50 (new)
--
-- New columns are OPTIONAL in the JSON payload.
-- If a key is absent, the existing value is preserved.
--
-- idempotent: CREATE OR REPLACE
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_exam_subjects_batch(p_subjects jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sub jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: Admin role required';
  END IF;

  FOR v_sub IN SELECT * FROM jsonb_array_elements(p_subjects) LOOP
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
        WHEN v_sub ? 'min_questions_per_topic' THEN (v_sub->>'min_questions_per_topic')::integer
        ELSE min_questions_per_topic
      END,
      min_for_10 = CASE
        WHEN v_sub ? 'min_for_10' THEN (v_sub->>'min_for_10')::integer
        ELSE min_for_10
      END,
      min_for_30 = CASE
        WHEN v_sub ? 'min_for_30' THEN (v_sub->>'min_for_30')::integer
        ELSE min_for_30
      END,
      min_for_50 = CASE
        WHEN v_sub ? 'min_for_50' THEN (v_sub->>'min_for_50')::integer
        ELSE min_for_50
      END
    WHERE id = (v_sub->>'id')::uuid;
  END LOOP;
END;
$function$;

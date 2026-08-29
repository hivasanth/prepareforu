-- ============================================================
-- MIGRATION 10: Remove old threshold columns from exam_subjects
-- REPLACE: old subject-level thresholds (now replaced by per-topic config)
-- ============================================================

-- 1. Update update_exam_subjects_batch to stop writing old threshold columns
-- Keep question_count + marks_per_question (still needed for subject allocation)
CREATE OR REPLACE FUNCTION public.update_exam_subjects_batch(p_subjects jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sub jsonb;
  v_subject_id uuid;
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

    -- Verify subject ID exists
    SELECT EXISTS(SELECT 1 FROM public.exam_subjects WHERE id = v_subject_id) INTO v_subject_exists;
    IF NOT v_subject_exists THEN
      RAISE EXCEPTION 'INVALID_SUBJECT: Subject % does not exist', v_subject_id;
    END IF;

    -- Perform update (only question_count + marks_per_question remain)
    UPDATE public.exam_subjects
    SET
      question_count = CASE
        WHEN v_sub ? 'question_count' THEN (v_sub->>'question_count')::integer
        ELSE question_count
      END,
      marks_per_question = CASE
        WHEN v_sub ? 'marks_per_question' THEN (v_sub->>'marks_per_question')::numeric
        ELSE marks_per_question
      END
    WHERE id = v_subject_id;
  END LOOP;
END;
$function$;

-- 2. Drop old threshold columns
ALTER TABLE public.exam_subjects DROP COLUMN IF EXISTS min_questions_per_topic;
ALTER TABLE public.exam_subjects DROP COLUMN IF EXISTS min_for_10;
ALTER TABLE public.exam_subjects DROP COLUMN IF EXISTS min_for_30;
ALTER TABLE public.exam_subjects DROP COLUMN IF EXISTS min_for_50;

-- 3. Revoke + Grant
REVOKE ALL ON FUNCTION public.update_exam_subjects_batch(jsonb) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_exam_subjects_batch(jsonb) TO authenticated, service_role;

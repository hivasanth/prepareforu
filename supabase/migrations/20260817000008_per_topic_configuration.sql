-- ============================================================
-- MIGRATION 8: Per-Topic Question Configuration
-- Adds per-topic required_questions for Exam/Prepare-Write mode
-- and Subject Test mode (20/30/50) distributions.
-- ============================================================

-- 1. Add per-topic exam configuration columns to exam_topics
ALTER TABLE public.exam_topics
  ADD COLUMN IF NOT EXISTS required_questions integer NOT NULL DEFAULT 1;

ALTER TABLE public.exam_topics
  ADD CONSTRAINT exam_topics_required_questions_check
  CHECK (required_questions >= 1);

-- 2. Add per-topic Subject Test mode columns
-- Each represents the required questions for that topic in the given mode.
ALTER TABLE public.exam_topics
  ADD COLUMN IF NOT EXISTS test_20_required integer NOT NULL DEFAULT 1;

ALTER TABLE public.exam_topics
  ADD CONSTRAINT exam_topics_test_20_required_check
  CHECK (test_20_required >= 1);

ALTER TABLE public.exam_topics
  ADD COLUMN IF NOT EXISTS test_30_required integer NOT NULL DEFAULT 1;

ALTER TABLE public.exam_topics
  ADD CONSTRAINT exam_topics_test_30_required_check
  CHECK (test_30_required >= 1);

ALTER TABLE public.exam_topics
  ADD COLUMN IF NOT EXISTS test_50_required integer NOT NULL DEFAULT 1;

ALTER TABLE public.exam_topics
  ADD CONSTRAINT exam_topics_test_50_required_check
  CHECK (test_50_required >= 1);

-- 3. Backfill from old subject-level thresholds
-- Distribute evenly: required_questions = CEIL(subject.question_count / topic_count)
UPDATE public.exam_topics et
SET required_questions = GREATEST(1, CEIL(
  es.question_count::numeric / (
    SELECT COUNT(*) FROM public.exam_topics et2
    WHERE et2.exam_id = et.exam_id AND et2.paper_id = et.paper_id AND et2.subject_name = et.subject_name
  )
))
FROM public.exam_subjects es
WHERE es.exam_id = et.exam_id
  AND es.paper_id = et.paper_id
  AND es.subject_name = et.subject_name;

-- 4. Backfill Subject Test modes from old subject-level thresholds
-- test_20 = GREATEST(1, CEIL(20 * min_for_10 / question_count))
-- test_30 = GREATEST(1, CEIL(30 * min_for_30 / question_count))
-- test_50 = GREATEST(1, CEIL(50 * min_for_50 / question_count))
UPDATE public.exam_topics et
SET
  test_20_required = GREATEST(1, CEIL(
    (20.0 * es.min_for_10 / es.question_count)
  )),
  test_30_required = GREATEST(1, CEIL(
    (30.0 * es.min_for_30 / es.question_count)
  )),
  test_50_required = GREATEST(1, CEIL(
    (50.0 * es.min_for_50 / es.question_count)
  ))
FROM public.exam_subjects es
WHERE es.exam_id = et.exam_id
  AND es.paper_id = et.paper_id
  AND es.subject_name = et.subject_name;

-- ============================================================
-- RPC: save_exam_topic_configuration
-- Saves per-topic required_questions for Exam/Prepare-Write mode.
-- Accepts an array of { topic_id, required_questions } objects.
-- Validates: SUM(required_questions) == subject.question_count
-- Validates: topic belongs to the given paper/subject.
-- ============================================================
CREATE OR REPLACE FUNCTION public.save_exam_topic_configuration(
  p_exam_id text,
  p_paper_id uuid,
  p_subject_name text,
  p_topics jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sub jsonb;
  v_topic_id uuid;
  v_required integer;
  v_total_required integer := 0;
  v_subject_total integer;
  v_topic_exists boolean;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: Admin role required';
  END IF;

  -- Get the subject's question_count for validation
  SELECT question_count INTO v_subject_total
  FROM public.exam_subjects
  WHERE exam_id = p_exam_id AND paper_id = p_paper_id AND subject_name = p_subject_name;

  IF v_subject_total IS NULL THEN
    RAISE EXCEPTION 'SUBJECT_NOT_FOUND: Subject % not found for paper %', p_subject_name, p_paper_id;
  END IF;

  -- Validate each topic and compute total
  FOR v_sub IN SELECT * FROM jsonb_array_elements(p_topics) LOOP
    v_topic_id := (v_sub->>'topic_id')::uuid;
    v_required := (v_sub->>'required_questions')::integer;

    -- Validate threshold
    IF v_required IS NULL OR v_required < 1 THEN
      RAISE EXCEPTION 'INVALID_THRESHOLD: required_questions must be >= 1, got %', v_required;
    END IF;

    -- Verify topic belongs to this exam/paper/subject
    SELECT EXISTS(
      SELECT 1 FROM public.exam_topics
      WHERE id = v_topic_id AND exam_id = p_exam_id AND paper_id = p_paper_id AND subject_name = p_subject_name
    ) INTO v_topic_exists;

    IF NOT v_topic_exists THEN
      RAISE EXCEPTION 'INVALID_TOPIC: Topic % does not belong to subject % in paper %', v_topic_id, p_subject_name, p_paper_id;
    END IF;

    v_total_required := v_total_required + v_required;
  END LOOP;

  -- Validate sum equals subject total
  IF v_total_required != v_subject_total THEN
    RAISE EXCEPTION 'SUM_MISMATCH: Topic requirements sum (%) must equal subject total (%)', v_total_required, v_subject_total;
  END IF;

  -- Apply updates
  FOR v_sub IN SELECT * FROM jsonb_array_elements(p_topics) LOOP
    v_topic_id := (v_sub->>'topic_id')::uuid;
    v_required := (v_sub->>'required_questions')::integer;

    UPDATE public.exam_topics
    SET required_questions = v_required
    WHERE id = v_topic_id;
  END LOOP;
END;
$function$;

-- ============================================================
-- RPC: save_subject_test_configuration
-- Saves per-topic required_questions for Subject Test mode (20/30/50).
-- Accepts { mode: '20'|'30'|'50', topics: [{ topic_id, required_questions }] }
-- Validates: SUM(required_questions) == mode total
-- ============================================================
CREATE OR REPLACE FUNCTION public.save_subject_test_configuration(
  p_exam_id text,
  p_paper_id uuid,
  p_subject_name text,
  p_mode text,
  p_topics jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sub jsonb;
  v_topic_id uuid;
  v_required integer;
  v_total_required integer := 0;
  v_mode_total integer;
  v_column_name text;
  v_topic_exists boolean;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: Admin role required';
  END IF;

  -- Validate mode
  IF p_mode NOT IN ('20', '30', '50') THEN
    RAISE EXCEPTION 'INVALID_MODE: Expected 20, 30, or 50, got %', p_mode;
  END IF;

  -- Determine mode total and target column
  v_mode_total := p_mode::integer;
  v_column_name := 'test_' || p_mode || '_required';

  -- Validate each topic and compute total
  FOR v_sub IN SELECT * FROM jsonb_array_elements(p_topics) LOOP
    v_topic_id := (v_sub->>'topic_id')::uuid;
    v_required := (v_sub->>'required_questions')::integer;

    IF v_required IS NULL OR v_required < 1 THEN
      RAISE EXCEPTION 'INVALID_THRESHOLD: required_questions must be >= 1, got %', v_required;
    END IF;

    -- Verify topic belongs to this exam/paper/subject
    SELECT EXISTS(
      SELECT 1 FROM public.exam_topics
      WHERE id = v_topic_id AND exam_id = p_exam_id AND paper_id = p_paper_id AND subject_name = p_subject_name
    ) INTO v_topic_exists;

    IF NOT v_topic_exists THEN
      RAISE EXCEPTION 'INVALID_TOPIC: Topic % does not belong to subject % in paper %', v_topic_id, p_subject_name, p_paper_id;
    END IF;

    v_total_required := v_total_required + v_required;
  END LOOP;

  -- Validate sum equals mode total
  IF v_total_required != v_mode_total THEN
    RAISE EXCEPTION 'SUM_MISMATCH: Topic requirements sum (%) must equal % questions', v_total_required, v_mode_total;
  END IF;

  -- Apply updates using dynamic column
  FOR v_sub IN SELECT * FROM jsonb_array_elements(p_topics) LOOP
    v_topic_id := (v_sub->>'topic_id')::uuid;
    v_required := (v_sub->>'required_questions')::integer;

    EXECUTE format(
      'UPDATE public.exam_topics SET %I = $1 WHERE id = $2',
      v_column_name
    ) USING v_required, v_topic_id;
  END LOOP;
END;
$function$;

-- ============================================================
-- RPC: fetch_topic_configuration
-- Returns all topics with their current per-topic configuration
-- for a given exam/paper/subject.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fetch_topic_configuration(
  p_exam_id text,
  p_paper_id uuid,
  p_subject_name text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', et.id,
      'topic_en', et.topic_en,
      'topic_te', et.topic_te,
      'display_order', et.display_order,
      'required_questions', et.required_questions,
      'test_20_required', et.test_20_required,
      'test_30_required', et.test_30_required,
      'test_50_required', et.test_50_required,
      'actual_count', COALESCE(tc.count, 0)
    ) ORDER BY et.display_order
  ) INTO v_result
  FROM public.exam_topics et
  LEFT JOIN public.topic_counts tc
    ON tc.exam_id = et.exam_id
    AND tc.paper_id = et.paper_id
    AND tc.subject_name = et.subject_name
    AND tc.topic_en = et.topic_en
  WHERE et.exam_id = p_exam_id
    AND et.paper_id = p_paper_id
    AND et.subject_name = p_subject_name;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$function$;

-- ============================================================
-- GRANTs: Only authenticated + service_role + postgres
-- ============================================================
REVOKE ALL ON FUNCTION public.save_exam_topic_configuration(text, uuid, text, jsonb) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_exam_topic_configuration(text, uuid, text, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.save_subject_test_configuration(text, uuid, text, text, jsonb) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_subject_test_configuration(text, uuid, text, text, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.fetch_topic_configuration(text, uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_topic_configuration(text, uuid, text) TO authenticated, service_role;

-- =============================================================================
-- MIGRATION: Add server-side input validation to exam creation RPC
-- Date: 2026-07-21
--
-- Problem:
--   create_new_exam_rpc accepts any JSON payload without field validation.
--   Invalid data (empty IDs, negative numbers, mismatched sums) could corrupt
--   the database.
--
-- Fix:
--   Replace the RPC with a version that validates all inputs BEFORE database
--   mutation. Validation rules mirror examCreationSchema from securitySchemas.ts.
--
-- Validation rules (from examCreationSchema):
--   - exam_id: required, max 50 chars, ^[A-Z0-9_]+$
--   - name: required, max 200 chars
--   - exam_selection: required
--   - total_questions: 1..1000, integer
--   - total_marks: >= 1
--   - duration_minutes: 1..1440, integer
--   - negative_mark_value: >= 0
--   - subjects: 1..20 items, each with name (required), question_count (>= 1), marks_per_question (>= 0.1)
--   - subject question_count sum must equal total_questions
--   - negative_mark_value must be <= marks_per_question when negative marking enabled
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_new_exam_rpc(p_exam jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_id text;
  v_name text;
  v_exam_selection text;
  v_total_questions integer;
  v_total_marks integer;
  v_duration_minutes integer;
  v_negative_marking boolean;
  v_negative_mark_value numeric;
  v_is_published boolean;
  v_papers jsonb;
  v_subjects jsonb;
  v_paper jsonb;
  v_subject jsonb;
  v_paper_id uuid;
  v_paper_idx integer := 1;
  v_subject_idx integer := 1;
  v_user_id uuid;
  v_subjects_sum integer := 0;
  v_marks_per_question numeric;
BEGIN
  -- ─── AUTHORIZATION ─────────────────────────────────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: Admin role required';
  END IF;

  v_user_id := auth.uid();

  -- ─── EXTRACT FIELDS ────────────────────────────────────────────────────────
  v_exam_id := p_exam->>'exam_id';
  v_name := p_exam->>'name';
  v_exam_selection := p_exam->>'exam_selection';
  v_total_questions := (p_exam->>'total_questions')::integer;
  v_total_marks := (p_exam->>'total_marks')::integer;
  v_duration_minutes := (p_exam->>'duration_minutes')::integer;
  v_negative_marking := (p_exam->>'negative_marking')::boolean;
  v_negative_mark_value := (p_exam->>'negative_mark_value')::numeric;
  v_is_published := (p_exam->>'is_published')::boolean;
  v_papers := p_exam->'papers';
  v_subjects := p_exam->'subjects';

  -- ─── INPUT VALIDATION (mirrors examCreationSchema) ─────────────────────────
  -- Exam ID: required, max 50 chars, uppercase alphanumeric + underscore only
  IF v_exam_id IS NULL OR length(trim(v_exam_id)) = 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Exam ID is required';
  END IF;
  IF length(v_exam_id) > 50 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Exam ID must be 50 characters or less';
  END IF;
  IF v_exam_id !~ '^[A-Z0-9_]+$' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Exam ID must contain only uppercase letters, numbers, and underscores';
  END IF;

  -- Name: required, max 200 chars
  IF v_name IS NULL OR length(trim(v_name)) = 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Display name is required';
  END IF;
  IF length(v_name) > 200 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Name must be 200 characters or less';
  END IF;

  -- Exam selection: required
  IF v_exam_selection IS NULL OR length(trim(v_exam_selection)) = 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Selection category is required';
  END IF;

  -- Numeric bounds
  IF v_total_questions IS NULL OR v_total_questions < 1 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Must have at least 1 question';
  END IF;
  IF v_total_questions > 1000 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Cannot exceed 1000 questions';
  END IF;
  IF v_total_marks IS NULL OR v_total_marks < 1 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Total marks must be at least 1';
  END IF;
  IF v_duration_minutes IS NULL OR v_duration_minutes < 1 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Duration must be at least 1 minute';
  END IF;
  IF v_duration_minutes > 1440 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Cannot exceed 1440 minutes (24 hours)';
  END IF;
  IF v_negative_mark_value IS NULL OR v_negative_mark_value < 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Negative mark cannot be negative';
  END IF;

  -- Papers array validation
  IF v_papers IS NULL OR jsonb_array_length(v_papers) = 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: At least one paper is required';
  END IF;

  -- Subjects array validation
  IF v_subjects IS NULL OR jsonb_array_length(v_subjects) = 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: At least one subject is required';
  END IF;
  IF jsonb_array_length(v_subjects) > 20 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Cannot have more than 20 subjects';
  END IF;

  -- Validate each subject and compute sum
  FOR v_subject IN SELECT * FROM jsonb_array_elements(v_subjects) LOOP
    IF v_subject->>'subject_name' IS NULL OR length(trim(v_subject->>'subject_name')) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Subject name is required';
    END IF;
    IF (v_subject->>'question_count')::integer < 1 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Must have at least 1 question per subject';
    END IF;
    IF (v_subject->>'marks_per_question')::numeric < 0.1 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Marks must be at least 0.1 per question';
    END IF;
    v_subjects_sum := v_subjects_sum + (v_subject->>'question_count')::integer;
  END LOOP;

  -- Subject sum must equal total questions
  IF v_subjects_sum != v_total_questions THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Subject question counts (%) must equal total questions (%)', v_subjects_sum, v_total_questions;
  END IF;

  -- Negative mark bounds check
  IF v_negative_marking AND v_negative_mark_value > 0 THEN
    v_marks_per_question := v_total_marks::numeric / v_total_questions;
    IF v_negative_mark_value > v_marks_per_question THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Negative mark value must be between 0 and marks per question (%)', v_marks_per_question;
    END IF;
  END IF;
  -- ─── END INPUT VALIDATION ──────────────────────────────────────────────────

  -- ─── DATABASE MUTATIONS ────────────────────────────────────────────────────
  INSERT INTO public.exams (exam_id, exam_type) VALUES (v_exam_id, 'main');

  INSERT INTO public.exam_configs (
    exam_id, name, exam_selection, total_questions, total_marks,
    duration_minutes, negative_marking, negative_mark_value, is_published, created_by
  ) VALUES (
    v_exam_id, v_name, v_exam_selection, v_total_questions, v_total_marks,
    v_duration_minutes, v_negative_marking, v_negative_mark_value, v_is_published, v_user_id
  );

  FOR v_paper IN SELECT * FROM jsonb_array_elements(v_papers) LOOP
    INSERT INTO public.exam_papers (
      exam_id, paper_name, stage, total_questions, total_marks,
      duration_minutes, negative_marking, negative_mark_value, display_order
    ) VALUES (
      v_exam_id, v_paper->>'paper_name',
      COALESCE(v_paper->>'stage', 'SINGLE')::public.stage_type,
      (v_paper->>'total_questions')::integer,
      (v_paper->>'total_marks')::integer,
      (v_paper->>'duration_minutes')::integer,
      (v_paper->>'negative_marking')::boolean,
      (v_paper->>'negative_mark_value')::numeric,
      v_paper_idx
    ) RETURNING id INTO v_paper_id;

    v_paper_idx := v_paper_idx + 1;
    v_subject_idx := 1;
    FOR v_subject IN SELECT * FROM jsonb_array_elements(v_subjects) LOOP
      INSERT INTO public.exam_subjects (
        exam_id, paper_id, subject_name, question_count, marks_per_question, display_order
      ) VALUES (
        v_exam_id, v_paper_id,
        v_subject->>'subject_name',
        (v_subject->>'question_count')::integer,
        (v_subject->>'marks_per_question')::numeric,
        v_subject_idx
      );
      v_subject_idx := v_subject_idx + 1;
    END LOOP;
  END LOOP;
END;
$$;

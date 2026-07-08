-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Fix Teacher Exam Creation RPC
-- Purpose:   Align the create_teacher_exam_atomic RPC function with the bilingual
--            schema (renamed columns) in teacher_exam_questions table.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Drop existing overloaded functions to prevent conflicts
DROP FUNCTION IF EXISTS public.create_teacher_exam_atomic(text, uuid, timestamp with time zone, timestamp with time zone, integer, numeric, numeric, text, jsonb);
DROP FUNCTION IF EXISTS public.create_teacher_exam_atomic(text, uuid, timestamp with time zone, timestamp with time zone, integer, numeric, numeric, jsonb, text);

-- 2. Create the unified, bilingual-compliant atomic exam creation function
CREATE OR REPLACE FUNCTION public.create_teacher_exam_atomic(
  p_title text,
  p_sub_admin_id uuid,
  p_start_time timestamp with time zone,
  p_end_time timestamp with time zone,
  p_duration_minutes integer,
  p_marks_per_question numeric,
  p_negative_mark_value numeric,
  p_questions jsonb,
  p_source_type text DEFAULT 'text'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_id UUID;
  v_q       JSONB;
  v_count   INTEGER;
BEGIN
  -- Validate inputs
  IF p_title IS NULL OR length(trim(p_title)) < 3 THEN
    RAISE EXCEPTION 'Exam title must be at least 3 characters';
  END IF;

  IF p_questions IS NULL OR jsonb_array_length(p_questions) = 0 THEN
    RAISE EXCEPTION 'At least one question is required';
  END IF;

  IF p_start_time IS NULL OR p_end_time IS NULL THEN
    RAISE EXCEPTION 'Start time and end time are required';
  END IF;

  IF p_end_time <= p_start_time THEN
    RAISE EXCEPTION 'End time must be after start time';
  END IF;

  -- Calculate question count
  v_count := jsonb_array_length(p_questions);

  -- 1. Insert the Exam header
  INSERT INTO teacher_exams (
    title,
    sub_admin_id,
    start_time,
    end_time,
    duration_minutes,
    marks_per_question,
    negative_marking,
    negative_mark_value,
    total_questions,
    total_marks,
    status,
    source_type
  ) VALUES (
    trim(p_title),
    p_sub_admin_id,
    p_start_time,
    p_end_time,
    p_duration_minutes,
    p_marks_per_question,
    (p_negative_mark_value > 0),
    p_negative_mark_value,
    v_count,
    (v_count * p_marks_per_question),
    'published',
    p_source_type
  ) RETURNING id INTO v_exam_id;

  -- 2. Bulk insert the questions mapping bilingual fields properly
  FOR v_q IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    -- Fix: Allow both 'object' and JSON 'null' for diagram
    IF v_q->'diagram' IS NOT NULL AND jsonb_typeof(v_q->'diagram') NOT IN ('object', 'null') THEN
      RAISE EXCEPTION 'Invalid diagram format for question: %', COALESCE(v_q->>'question_text_en', 'unknown');
    END IF;

    INSERT INTO teacher_exam_questions (
      teacher_exam_id,
      question_text_en,
      question_text_te,
      option_a_en,
      option_a_te,
      option_b_en,
      option_b_te,
      option_c_en,
      option_c_te,
      option_d_en,
      option_d_te,
      correct_option,
      explanation_en,
      explanation_te,
      display_order,
      diagram
    ) VALUES (
      v_exam_id,
      v_q->>'question_text_en',
      v_q->>'question_text_te',
      v_q->>'option_a_en',
      v_q->>'option_a_te',
      v_q->>'option_b_en',
      v_q->>'option_b_te',
      v_q->>'option_c_en',
      v_q->>'option_c_te',
      v_q->>'option_d_en',
      v_q->>'option_d_te',
      v_q->>'correct_option',
      v_q->>'explanation_en',
      v_q->>'explanation_te',
      (v_q->>'display_order')::INTEGER,
      v_q->'diagram'
    );
  END LOOP;

  RETURN v_exam_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Exam creation failed: %', SQLERRM;
END;
$$;

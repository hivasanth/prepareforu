-- ─── 1. OPTIMIZE is_admin() FOR INLINING ────────────────────────────
-- Redefining as a standard SQL language function enables the PostgreSQL query planner
-- to inline the function call directly in RLS statements, avoiding per-row PL/pgSQL context switches.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─── 2. USER ROLE ESCALATION PREVENTION TRIGGER ─────────────────────────
-- Intercept updates BEFORE they are committed to guarantee users cannot change their role or educator.
CREATE OR REPLACE FUNCTION public.prevent_user_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow changes if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- Revert unauthorized changes
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      NEW.role := OLD.role;
    END IF;
    IF NEW.educator_id IS DISTINCT FROM OLD.educator_id THEN
      NEW.educator_id := OLD.educator_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_user_role_escalation ON public.users;
CREATE TRIGGER trigger_prevent_user_role_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_user_role_escalation();

-- ─── 3. ATOMIC EXAM CREATION TRANSACTION RPC ────────────────────────────
-- Performs atomic insert across exams, exam_configs, exam_papers, and exam_subjects in one transaction.
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
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: Admin role required';
  END IF;

  v_user_id := auth.uid();

  -- Extract top-level exam fields
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

  -- 1. Insert into exams
  INSERT INTO public.exams (exam_id, exam_type)
  VALUES (v_exam_id, 'main');

  -- 2. Insert into exam_configs
  INSERT INTO public.exam_configs (
    exam_id, name, exam_selection, total_questions, total_marks,
    duration_minutes, negative_marking, negative_mark_value, is_published, created_by
  ) VALUES (
    v_exam_id, v_name, v_exam_selection, v_total_questions, v_total_marks,
    v_duration_minutes, v_negative_marking, v_negative_mark_value, v_is_published, v_user_id
  );

  -- 3. Loop through papers and insert them
  FOR v_paper IN SELECT * FROM jsonb_array_elements(v_papers) LOOP
    INSERT INTO public.exam_papers (
      exam_id, paper_name, stage, total_questions, total_marks,
      duration_minutes, negative_marking, negative_mark_value, display_order
    ) VALUES (
      v_exam_id,
      v_paper->>'paper_name',
      COALESCE(v_paper->>'stage', 'SINGLE')::public.stage_type,
      (v_paper->>'total_questions')::integer,
      (v_paper->>'total_marks')::integer,
      (v_paper->>'duration_minutes')::integer,
      (v_paper->>'negative_marking')::boolean,
      (v_paper->>'negative_mark_value')::numeric,
      v_paper_idx
    ) RETURNING id INTO v_paper_id;

    v_paper_idx := v_paper_idx + 1;

    -- 4. Loop through subjects for this paper
    v_subject_idx := 1;
    FOR v_subject IN SELECT * FROM jsonb_array_elements(v_subjects) LOOP
      INSERT INTO public.exam_subjects (
        exam_id, paper_id, subject_name, question_count, marks_per_question, display_order
      ) VALUES (
        v_exam_id,
        v_paper_id,
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

-- ─── 4. BATCH SUBJECT UPDATE RPC ───────────────────────────────────────
-- Updates multiple subjects inside a single high-performance database transaction.
CREATE OR REPLACE FUNCTION public.update_exam_subjects_batch(p_subjects jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub jsonb;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: Admin role required';
  END IF;

  FOR v_sub IN SELECT * FROM jsonb_array_elements(p_subjects) LOOP
    UPDATE public.exam_subjects
    SET question_count = (v_sub->>'question_count')::integer,
        marks_per_question = (v_sub->>'marks_per_question')::numeric
    WHERE id = (v_sub->>'id')::uuid;
  END LOOP;
END;
$$;

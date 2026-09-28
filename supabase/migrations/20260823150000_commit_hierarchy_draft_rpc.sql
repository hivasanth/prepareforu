-- ============================================================================
-- MIGRATION: commit_hierarchy_draft_rpc
-- Date: 2026-08-23
--
-- PURPOSE
--   Atomic persistence for the Admin Hierarchy Management page local draft.
--   The admin builds exams/papers/subjects/topics locally; this single RPC is
--   the ONLY write path, committing the whole draft in ONE transaction.
--   Any failure raises -> automatic full ROLLBACK (no half-saved hierarchy).
--
-- DRAFT PAYLOAD (p_draft jsonb):
-- {
--   exams:    [ { exam_id, name, exam_selection, total_questions, total_marks,
--                 duration_minutes, negative_marking, negative_mark_value,
--                 is_published, has_papers } ],
--   papers:   [ { temp_id, exam_id, paper_name, stage,
--                 total_questions, total_marks, duration_minutes } ],
--   subjects: [ { exam_id, paper_ref, subject_name, question_count,
--                 marks_per_question } ],
--   topics:   [ { exam_id, paper_ref, subject_name, topic_en, topic_te,
--                 required_questions } ]
-- }
--
-- TEMP-ID RULE: draft rows reference draft parents by "T:<temp_id>" tokens
--   (exams carry temp_id; papers/subjects/topics point at parents through
--   T:-tokens in their parent-ref fields). Tokens MUST start with "T:" so
--   they can never collide with real uuids/exam ids. The RPC resolves every
--   token against its in-transaction insertion maps, in strict insertion
--   order (exams -> papers -> subjects -> topics).
--
-- AUTHORIZATION (mirrors hierarchy RLS):
--   admin       -> full draft commit
--   sub_admin   -> ONLY when the payload contains exclusively topics
--   user/anon   -> always rejected
--
-- BUSINESS RULES (mirror live create_new_exam_rpc + CHECK constraints):
--   exam_id ^[A-Z0-9_]+$ <=50; name <=200; questions 1..1000; marks >=1;
--   duration 1..1440; negative_mark_value >=0 and, when enabled,
--   <= total_marks/total_questions.
--   NEW exam WITH papers: sum(subject.question_count per new paper)
--     == exam.total_questions  (mirrors create_new_exam_rpc subject-sum rule).
--   Papers >=1 per exam: has_papers=false synthesizes one SINGLE-stage paper
--     named after the exam display name (mirrors AddExamModal behaviour).
--   Subjects: question_count >=1, marks_per_question >=0.1 (DB CHECK parity).
--   Topics: required_questions >=1 (DB CHECK parity). No sum enforcement at
--     insert time - identical to every existing topic-insertion path; the
--     exact-sum rule belongs to save_exam_topic_configuration rebalancing.
--
-- DUPLICATES: explicit pre-checks produce friendly errors naming the record;
--   existing UNIQUE constraints remain the race-safe final authority and map
--   to the same friendly wording via the unique_violation handler.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.commit_hierarchy_draft_rpc(p_draft jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_exams    jsonb;
  v_papers   jsonb;
  v_subjects jsonb;
  v_topics   jsonb;
  v_row      jsonb;

  v_is_admin boolean;
  v_is_sub   boolean;

  -- exam scratch
  v_exam_id      text;
  v_total_q      integer;

  -- paper scratch
  v_temp_id    text;
  v_paper_id   uuid;
  v_order      integer;
  v_pid_text   text;

  -- subject/topic scratch
  v_paper_ref     text;
  v_sub_name      text;
  v_canon_subject text;
  v_topic_exam_id text;
  v_exists        boolean;

  -- in-transaction resolution state
  v_paper_map    jsonb := '{}'::jsonb;  -- temp token -> inserted paper uuid
  v_exam_map     jsonb := '{}'::jsonb;  -- exam temp token -> final exam id
  v_sum_by_paper jsonb := '{}'::jsonb;  -- paper uuid text -> running subject sum
  v_parent_exam  text;

  v_created_exams  integer := 0;
  v_created_papers integer := 0;
  v_created_subs   integer := 0;
  v_created_topics integer := 0;
BEGIN
  -- --- AUTHORIZATION ---------------------------------------------------------
  SELECT COALESCE(EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ), FALSE) INTO v_is_admin;
  SELECT COALESCE(EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'sub_admin'
  ), FALSE) INTO v_is_sub;

  v_exams    := COALESCE(p_draft->'exams',    '[]'::jsonb);
  v_papers   := COALESCE(p_draft->'papers',   '[]'::jsonb);
  v_subjects := COALESCE(p_draft->'subjects', '[]'::jsonb);
  v_topics   := COALESCE(p_draft->'topics',   '[]'::jsonb);

  IF jsonb_array_length(v_exams) = 0 AND jsonb_array_length(v_papers) = 0
     AND jsonb_array_length(v_subjects) = 0 AND jsonb_array_length(v_topics) = 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: The draft is empty - nothing to save';
  END IF;

  IF NOT v_is_admin THEN
    -- sub_admin may commit ONLY pure-topic drafts (mirrors exam_topics RLS)
    IF NOT (v_is_sub AND jsonb_array_length(v_exams) = 0
            AND jsonb_array_length(v_papers) = 0
            AND jsonb_array_length(v_subjects) = 0) THEN
      RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: Admin role required';
    END IF;
  END IF;
  -- === PHASE 1: EXAMS ========================================================
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_exams) LOOP
    v_exam_id := COALESCE(v_row->>'exam_id', '');
    v_total_q := (v_row->>'total_questions')::integer;

    IF length(btrim(v_exam_id)) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Exam ID is required';
    END IF;
    IF length(v_exam_id) > 50 OR v_exam_id !~ '^[A-Z0-9_]+$' THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Exam ID must be uppercase letters, numbers and underscores only (max 50)';
    END IF;
    IF v_row->>'name' IS NULL OR length(btrim(COALESCE(v_row->>'name',''))) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Display name is required';
    END IF;
    IF length(v_row->>'name') > 200 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Display name must be 200 characters or less';
    END IF;
    IF v_row->>'exam_selection' IS NULL OR length(btrim(COALESCE(v_row->>'exam_selection',''))) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Selection category is required for exam %', v_exam_id;
    END IF;
    IF v_total_q IS NULL OR v_total_q < 1 OR v_total_q > 1000 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Exam % must have between 1 and 1000 questions', v_exam_id;
    END IF;
    IF (v_row->>'total_marks')::integer IS NULL OR (v_row->>'total_marks')::integer < 1 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Exam % must have at least 1 mark', v_exam_id;
    END IF;
    IF (v_row->>'duration_minutes')::integer IS NULL
       OR (v_row->>'duration_minutes')::integer < 1
       OR (v_row->>'duration_minutes')::integer > 1440 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Exam % duration must be between 1 and 1440 minutes', v_exam_id;
    END IF;
    IF COALESCE((v_row->>'negative_mark_value')::numeric, 0) < 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Negative mark value cannot be negative';
    END IF;
    IF COALESCE((v_row->'negative_marking')::boolean, FALSE)
       AND COALESCE((v_row->>'negative_mark_value')::numeric, 0) > 0
       AND (v_row->>'negative_mark_value')::numeric
             > ((v_row->>'total_marks')::numeric / v_total_q) THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Negative mark value must not exceed marks per question (%)',
        ROUND(((v_row->>'total_marks')::numeric / v_total_q), 2);
    END IF;

    -- friendly duplicate pre-check (UNIQUE constraint remains race backstop)
    SELECT EXISTS (SELECT 1 FROM public.exams WHERE exam_id = v_exam_id) INTO v_exists;
    IF v_exists THEN
      RAISE EXCEPTION 'DUPLICATE: An exam with ID "%" already exists', v_exam_id;
    END IF;

    INSERT INTO public.exams (exam_id, exam_type) VALUES (v_exam_id, 'main');
    INSERT INTO public.exam_configs (
      exam_id, name, exam_selection, total_questions, total_marks,
      duration_minutes, negative_marking, negative_mark_value,
      is_published, created_by
    ) VALUES (
      v_exam_id,
      btrim(v_row->>'name'),
      btrim(v_row->>'exam_selection'),
      v_total_q,
      (v_row->>'total_marks')::integer,
      (v_row->>'duration_minutes')::integer,
      COALESCE((v_row->'negative_marking')::boolean, FALSE),
      COALESCE((v_row->>'negative_mark_value')::numeric, 0),
      COALESCE((v_row->'is_published')::boolean, FALSE),
      auth.uid()
    );
    v_created_exams := v_created_exams + 1;

    -- Backend requires >=1 paper per exam: synthesize one for paper-less exams
    IF NOT COALESCE((v_row->'has_papers')::boolean, TRUE) THEN
      INSERT INTO public.exam_papers (
        exam_id, paper_name, stage, total_questions, total_marks,
        duration_minutes, negative_marking, negative_mark_value, display_order
      ) VALUES (
        v_exam_id,
        btrim(v_row->>'name'),
        'SINGLE'::public.stage_type,
        v_total_q,
        (v_row->>'total_marks')::integer,
        (v_row->>'duration_minutes')::integer,
        COALESCE((v_row->'negative_marking')::boolean, FALSE),
        COALESCE((v_row->>'negative_mark_value')::numeric, 0),
        1
      );
      v_created_papers := v_created_papers + 1;
    END IF;

    -- register the NEW exam under its draft token for downstream resolution
    v_exam_map := v_exam_map || jsonb_build_object(
      COALESCE(v_row->>'temp_id', ''), v_exam_id
    );
  END LOOP;

  -- === PHASE 2: PAPERS (insert + temp-token map) =============================
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_papers) LOOP
    v_temp_id := COALESCE(v_row->>'temp_id', '');
    v_paper_ref := COALESCE(v_row->>'exam_id', '');

    IF v_temp_id !~ '^T:[A-Za-z0-9_-]+$' THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper draft is missing a valid temporary ID';
    END IF;
    IF length(btrim(v_paper_ref)) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Every paper needs a parent exam';
    END IF;

    -- Resolve parent exam: T: token -> exam inserted earlier THIS txn, else LIVE id.
    IF left(v_paper_ref, 2) = 'T:' THEN
      v_parent_exam := v_exam_map ->> v_paper_ref;
      IF v_parent_exam IS NULL THEN
        RAISE EXCEPTION 'HIERARCHY: Parent exam for paper "%" not found in this draft', btrim(COALESCE(v_row->>'paper_name',''));
      END IF;
    ELSE
      v_parent_exam := v_paper_ref;
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.exam_configs WHERE exam_id = v_parent_exam) INTO v_exists;
    IF NOT v_exists THEN
      RAISE EXCEPTION 'HIERARCHY: Parent exam "%" does not exist', v_parent_exam;
    END IF;

    IF v_row->>'paper_name' IS NULL OR length(btrim(COALESCE(v_row->>'paper_name',''))) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper name is required';
    END IF;
    IF length(v_row->>'paper_name') > 150 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper name must be 150 characters or less';
    END IF;
    IF COALESCE(v_row->>'stage', 'SINGLE') NOT IN ('SINGLE','PRELIMS','MAINS') THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper stage must be SINGLE, PRELIMS or MAINS';
    END IF;
    IF (v_row->>'total_questions')::integer IS NULL
       OR (v_row->>'total_questions')::integer < 1
       OR (v_row->>'total_questions')::integer > 1000 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper % must have between 1 and 1000 questions', btrim(v_row->>'paper_name');
    END IF;
    IF (v_row->>'total_marks')::integer IS NULL OR (v_row->>'total_marks')::integer < 1 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper % must have at least 1 mark', btrim(v_row->>'paper_name');
    END IF;
    IF (v_row->>'duration_minutes')::integer IS NULL
       OR (v_row->>'duration_minutes')::integer < 1
       OR (v_row->>'duration_minutes')::integer > 1440 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper % duration must be between 1 and 1440 minutes', btrim(v_row->>'paper_name');
    END IF;

    SELECT count(*) INTO v_order FROM public.exam_papers WHERE exam_id = v_parent_exam;

    INSERT INTO public.exam_papers (
      exam_id, paper_name, stage, total_questions, total_marks,
      duration_minutes, display_order
    ) VALUES (
      v_parent_exam,
      btrim(v_row->>'paper_name'),
      COALESCE(v_row->>'stage', 'SINGLE')::public.stage_type,
      (v_row->>'total_questions')::integer,
      (v_row->>'total_marks')::integer,
      (v_row->>'duration_minutes')::integer,
      v_order + 1
    ) RETURNING id INTO v_paper_id;

    v_paper_map := v_paper_map || jsonb_build_object(v_temp_id, v_paper_id);
    v_created_papers := v_created_papers + 1;
  END LOOP;

  -- === PHASE 3: SUBJECTS (+ running per-paper question sums) =================
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_subjects) LOOP
    v_paper_ref := COALESCE(v_row->>'paper_ref', '');
    v_sub_name  := COALESCE(v_row->>'subject_name', '');

    IF length(btrim(v_sub_name)) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Subject name is required';
    END IF;
    IF length(v_sub_name) > 150 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Subject name must be 150 characters or less';
    END IF;
    IF (v_row->>'question_count')::integer IS NULL
       OR (v_row->>'question_count')::integer < 1
       OR (v_row->>'question_count')::integer > 1000 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Subject % must have between 1 and 1000 questions', btrim(v_sub_name);
    END IF;
    IF (v_row->>'marks_per_question')::numeric IS NULL
       OR (v_row->>'marks_per_question')::numeric < 0.1 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Subject % must have at least 0.1 marks per question', btrim(v_sub_name);
    END IF;

    -- Resolve parent paper: "T:<temp>" token from this txn, or LIVE uuid.
    IF length(btrim(v_paper_ref)) = 0 THEN
      RAISE EXCEPTION 'HIERARCHY: A parent paper reference is required for subject %', btrim(v_sub_name);
    ELSIF left(v_paper_ref, 2) = 'T:' THEN
      v_paper_id := v_paper_map ->> v_paper_ref;
      IF v_paper_id IS NULL THEN
        RAISE EXCEPTION 'HIERARCHY: Parent paper for subject "%" not found in this draft', btrim(v_sub_name);
      END IF;
    ELSE
      BEGIN
        v_paper_id := v_paper_ref::uuid;
      EXCEPTION WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'HIERARCHY: Invalid parent paper reference for subject %', btrim(v_sub_name);
      END;
      SELECT EXISTS (
        SELECT 1 FROM public.exam_papers WHERE id = v_paper_id
      ) INTO v_exists;
      IF NOT v_exists THEN
        RAISE EXCEPTION 'HIERARCHY: The selected paper for subject "%" does not exist', btrim(v_sub_name);
      END IF;
    END IF;

    SELECT count(*) INTO v_order FROM public.exam_subjects WHERE paper_id = v_paper_id;

    INSERT INTO public.exam_subjects (
      exam_id, paper_id, subject_name, question_count,
      marks_per_question, display_order
    ) VALUES (
      (SELECT exam_id FROM public.exam_papers WHERE id = v_paper_id),
      v_paper_id,
      btrim(v_sub_name),
      (v_row->>'question_count')::integer,
      (v_row->>'marks_per_question')::numeric,
      v_order + 1
    );

    -- accumulate per-paper sum keyed by paper uuid text
    v_sum_by_paper := jsonb_set(
      v_sum_by_paper,
      ARRAY[v_paper_id::text],
      to_jsonb(COALESCE((v_sum_by_paper ->> v_paper_id::text)::integer, 0)
               + (v_row->>'question_count')::integer)
    );
    v_created_subs := v_created_subs + 1;
  END LOOP;

  -- === PHASE 3b: NEW-exam per-paper subject-sum rule =========================
  -- Mirrors create_new_exam_rpc: every NEW paper of a NEW exam must distribute
  -- exactly exam.total_questions across its draft subjects. Exams declared
  -- has_papers=false have no draft subjects and skip this check.
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_exams) LOOP
    CONTINUE WHEN NOT COALESCE((v_row->'has_papers')::boolean, TRUE);

    FOR v_pid_text IN
      SELECT d->>'temp_id' FROM jsonb_array_elements(v_papers) d
      WHERE COALESCE(v_exam_map ->> (d->>'exam_id'), d->>'exam_id') = v_row->>'exam_id'
    LOOP
      v_paper_id := v_paper_map ->> v_pid_text;
      IF COALESCE((v_sum_by_paper ->> v_paper_id::text)::integer, 0)
         != (v_row->>'total_questions')::integer THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Subject question counts must total % for each paper of exam %',
          (v_row->>'total_questions')::integer, v_row->>'exam_id';
      END IF;
    END LOOP;
  END LOOP;

  -- === PHASE 4: TOPICS =======================================================
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_topics) LOOP
    v_paper_ref := COALESCE(v_row->>'paper_ref', '');
    v_sub_name  := COALESCE(v_row->>'subject_name', '');
    v_paper_id  := NULL;

    IF length(btrim(v_sub_name)) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Topics need a parent subject';
    END IF;
    IF v_row->>'topic_en' IS NULL OR length(btrim(COALESCE(v_row->>'topic_en',''))) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: English topic name is required';
    END IF;
    IF length(v_row->>'topic_en') > 300 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: English topic name must be 300 characters or less';
    END IF;
    IF COALESCE((v_row->>'required_questions')::integer, 1) < 1 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Topic % requires at least 1 question', btrim(v_row->>'topic_en');
    END IF;

    -- Resolve parent paper: optional. Empty ref = paper-less (NULL paper_id).
    IF length(btrim(v_paper_ref)) > 0 THEN
      IF left(v_paper_ref, 2) = 'T:' THEN
        v_paper_id := v_paper_map ->> v_paper_ref;
        IF v_paper_id IS NULL THEN
          RAISE EXCEPTION 'HIERARCHY: Parent paper for topic "%" not found in this draft', btrim(v_row->>'topic_en');
        END IF;
      ELSE
        BEGIN
          v_paper_id := v_paper_ref::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
          RAISE EXCEPTION 'HIERARCHY: Invalid parent paper reference for topic %', btrim(v_row->>'topic_en');
        END;
        SELECT EXISTS (
          SELECT 1 FROM public.exam_papers WHERE id = v_paper_id
        ) INTO v_exists;
        IF NOT v_exists THEN
          RAISE EXCEPTION 'HIERARCHY: The selected paper for topic "%" does not exist', btrim(v_row->>'topic_en');
        END IF;
      END IF;
    END IF;

    -- Parent subject must exist in this exact segment (draft or LIVE).
    -- Case-insensitive match; canonical stored casing wins on insert.
    SELECT subject_name, exam_id
      INTO v_canon_subject, v_topic_exam_id
    FROM public.exam_subjects
    WHERE lower(subject_name) = lower(btrim(v_sub_name))
      AND paper_id IS NOT DISTINCT FROM v_paper_id
    LIMIT 1;

    IF v_canon_subject IS NULL THEN
      RAISE EXCEPTION 'HIERARCHY: Subject "%" does not exist in the selected segment', btrim(v_sub_name);
    END IF;

    SELECT count(*) INTO v_order FROM public.exam_topics
    WHERE exam_id = v_topic_exam_id
      AND paper_id IS NOT DISTINCT FROM v_paper_id
      AND lower(subject_name) = lower(btrim(v_sub_name));

    INSERT INTO public.exam_topics (
      exam_id, paper_id, subject_name, topic_en, topic_te,
      display_order, required_questions
    ) VALUES (
      v_topic_exam_id,
      v_paper_id,
      v_canon_subject,
      btrim(v_row->>'topic_en'),
      NULLIF(btrim(COALESCE(v_row->>'topic_te', '')), ''),
      v_order + 1,
      COALESCE((v_row->>'required_questions')::integer, 1)
    );

    v_created_topics := v_created_topics + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'exams', v_created_exams,
    'papers', v_created_papers,
    'subjects', v_created_subs,
    'topics', v_created_topics
  );

EXCEPTION
  WHEN unique_violation THEN
    DECLARE
      v_constraint text;
    BEGIN
      GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
      CASE v_constraint
        WHEN 'exam_papers_exam_id_paper_name_stage_key' THEN
          RAISE EXCEPTION 'DUPLICATE: A paper with this name already exists for this exam in that stage';
        WHEN 'exam_subjects_paper_id_subject_name_key' THEN
          RAISE EXCEPTION 'DUPLICATE: A subject with this name already exists in this paper';
        WHEN 'exam_topics_exam_id_paper_id_subject_name_topic_en_key' THEN
          RAISE EXCEPTION 'DUPLICATE: A topic with this name already exists in this subject';
        WHEN 'exams_pkey' THEN
          RAISE EXCEPTION 'DUPLICATE: An exam with this ID already exists';
        ELSE
          RAISE EXCEPTION 'DUPLICATE: This record already exists in the database';
      END CASE;
    END;
END;
$fn$;

-- ─── Hardening ───────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.commit_hierarchy_draft_rpc(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.commit_hierarchy_draft_rpc(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.commit_hierarchy_draft_rpc(jsonb) TO authenticated;

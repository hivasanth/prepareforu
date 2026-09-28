-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Admin Settings atomic save + topic-config read hardening
--
-- 1. NEW RPC save_admin_settings_rpc
--    Root-cause fix for BUG-2: the Admin Settings EXAMS-mode save previously
--    ran paper/config write → subjects batch RPC → per-subject topic RPCs as
--    SEPARATE transactions. A failure mid-sequence left partial persistence.
--    This function performs the ENTIRE save inside ONE plpgsql block (a
--    single implicit transaction): ANY failure rolls back EVERYTHING.
--
--    Validation rules are REPRODUCED 1:1 from the authoritative sources so no
--    conflicting business logic exists:
--      - admin role check ............ same pattern as create_new_exam_rpc /
--                                      update_exam_subjects_batch / save_*_rpc
--      - subject existence/scope ..... hardened beyond update_exam_subjects_batch
--                                      (H-8 verified existence; here rows must
--                                      ALSO belong to the target exam/paper)
--      - topic rules ................. identical to save_exam_topic_configuration
--                                      (INVALID_THRESHOLD / INVALID_TOPIC /
--                                      SUM_MISMATCH vs subject.question_count)
--      - config/paper sync ........... mirrors syncPapersFromConfig semantics:
--                                      exam-level saves propagate parameter
--                                      fields to ALL papers of the exam
--    Subject Test mode is intentionally NOT accepted: its save is ALREADY a
--    single atomic RPC (save_subject_test_configuration).
--
-- 2. HARDENED fetch_topic_configuration (FINDING-7)
--    Adds the internal auth.uid() → users.role='admin' check that every other
--    admin RPC already has. Sole production consumer is the admin-only
--    Admin Settings page (verified repository-wide), so tightening EXECUTE
--    authorization breaks no legitimate caller.
--
-- Security: both functions are SECURITY DEFINER with a pinned search_path.
-- Grants follow the established pattern: revoked from anon + PUBLIC, granted
-- to authenticated + service_role. Database RLS/role checks remain the final
-- authority.
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 2a. FINDING-7: fetch_topic_configuration requires the admin role
-- ────────────────────────────────────────────────────────────────────────────
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
  -- Verify admin role (FINDING-7 hardening — same rule as every other
  -- settings RPC; defense-in-depth behind service-layer ensureRole)
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: Admin role required';
  END IF;

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

REVOKE ALL ON FUNCTION public.fetch_topic_configuration(text, uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_topic_configuration(text, uuid, text) TO authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 2b. BUG-2: atomic full-save RPC for Admin Settings (EXAMS mode)
--
-- Parameters
--   p_mode      'exams' (Subject Test keeps its own atomic RPC)
--   p_exam_id   target exam key
--   p_paper_id  NULL → exam-level save (config row + all papers synced)
--               non-NULL → paper-level save (single paper row updated)
--   p_config    { total_questions, total_marks, duration_minutes,
--                 negative_marking, negative_mark_value,
--                 is_published?, allow_multiple_attempts? }
--   p_subjects  [ { id, question_count, marks_per_question } ]
--   p_topics    [ { paper_id, subject_name,
--                   topics: [ { topic_id, required_questions } ] } ]
--
-- Returns { ok, papers_updated, configs_updated, subjects_updated, topics_updated }
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.save_admin_settings_rpc(
  p_mode text,
  p_exam_id text,
  p_paper_id uuid,
  p_config jsonb,
  p_subjects jsonb,
  p_topics jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_row jsonb;
  v_topic jsonb;
  v_group jsonb;
  v_subject_total integer;
  v_total_required integer := 0;
  v_exists boolean;
  v_papers_updated integer := 0;
  v_configs_updated integer := 0;
  v_subjects_updated integer := 0;
  v_topics_updated integer := 0;
  v_q integer;
  v_m numeric;
  v_group_paper uuid;
BEGIN
  -- 1. Mode guard — Subject Test already persists atomically elsewhere
  IF p_mode IS NULL OR p_mode <> 'exams' THEN
    RAISE EXCEPTION 'INVALID_MODE: Expected "exams", got %', p_mode;
  END IF;

  -- 2. Caller identity + admin role (auth.uid() — NEVER client input)
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: Admin role required';
  END IF;

  IF p_exam_id IS NULL OR length(trim(p_exam_id)) = 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Exam ID is required';
  END IF;
  IF p_config IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Config payload is required';
  END IF;

  -- 3. Scope resolution + parameter writes ---------------------------------
  IF p_paper_id IS NOT NULL THEN
    -- Paper-scoped save: the paper MUST belong to the given exam
    SELECT EXISTS(
      SELECT 1 FROM public.exam_papers
      WHERE id = p_paper_id AND exam_id = p_exam_id
    ) INTO v_exists;
    IF NOT v_exists THEN
      RAISE EXCEPTION 'INVALID_PAPER: Paper % does not belong to exam %', p_paper_id, p_exam_id;
    END IF;

    UPDATE public.exam_papers
    SET total_questions  = (p_config->>'total_questions')::integer,
        total_marks      = (p_config->>'total_marks')::integer,
        duration_minutes = (p_config->>'duration_minutes')::integer,
        negative_marking = (p_config->>'negative_marking')::boolean,
        negative_mark_value = (p_config->>'negative_mark_value')::numeric
    WHERE id = p_paper_id;
    GET DIAGNOSTICS v_papers_updated = ROW_COUNT;
  ELSE
    -- Exam-scoped save: config row must exist…
    IF NOT EXISTS (SELECT 1 FROM public.exam_configs WHERE exam_id = p_exam_id) THEN
      RAISE EXCEPTION 'EXAM_NOT_FOUND: Exam % does not exist', p_exam_id;
    END IF;

    UPDATE public.exam_configs
    SET total_questions  = (p_config->>'total_questions')::integer,
        total_marks      = (p_config->>'total_marks')::integer,
        duration_minutes = (p_config->>'duration_minutes')::integer,
        negative_marking = (p_config->>'negative_marking')::boolean,
        negative_mark_value = (p_config->>'negative_mark_value')::numeric,
        is_published     = COALESCE((p_config->>'is_published')::boolean, is_published),
        allow_multiple_attempts = COALESCE((p_config->>'allow_multiple_attempts')::boolean, allow_multiple_attempts)
    WHERE exam_id = p_exam_id;
    GET DIAGNOSTICS v_configs_updated = ROW_COUNT;

    -- Mirrors legacy syncExamPapersFromConfig: all papers of the exam
    -- inherit the canonical parameter set.
    UPDATE public.exam_papers
    SET total_questions  = (p_config->>'total_questions')::integer,
        total_marks      = (p_config->>'total_marks')::integer,
        duration_minutes = (p_config->>'duration_minutes')::integer,
        negative_marking = (p_config->>'negative_marking')::boolean,
        negative_mark_value = (p_config->>'negative_mark_value')::numeric
    WHERE exam_id = p_exam_id;
    GET DIAGNOSTICS v_papers_updated = ROW_COUNT;
  END IF;

  -- 4. Subjects batch (H-8 rules + STRICTER scope binding) -----------------
  FOR v_row IN SELECT * FROM jsonb_array_elements(COALESCE(p_subjects, '[]'::jsonb)) LOOP
    DECLARE
      v_sid uuid := (v_row->>'id')::uuid;
    BEGIN
      IF v_sid IS NULL THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Subject id is required';
      END IF;

      -- Must exist AND belong to the target exam (and paper when scoped)
      SELECT EXISTS(
        SELECT 1 FROM public.exam_subjects es
        WHERE es.id = v_sid
          AND es.exam_id = p_exam_id
          AND (p_paper_id IS NULL OR es.paper_id = p_paper_id)
      ) INTO v_exists;
      IF NOT v_exists THEN
        RAISE EXCEPTION 'INVALID_SUBJECT: Subject % does not exist under exam %', v_sid, p_exam_id;
      END IF;

      IF v_row ? 'question_count' THEN
        v_q := (v_row->>'question_count')::integer;
        IF v_q IS NULL OR v_q < 1 THEN
          RAISE EXCEPTION 'INVALID_THRESHOLD: question_count must be >= 1, got %', v_q;
        END IF;
      END IF;

      IF v_row ? 'marks_per_question' THEN
        v_m := (v_row->>'marks_per_question')::numeric;
        IF v_m IS NULL OR v_m <= 0 THEN
          RAISE EXCEPTION 'INVALID_THRESHOLD: marks_per_question must be > 0, got %', v_m;
        END IF;
      END IF;

      UPDATE public.exam_subjects
      SET question_count     = CASE WHEN v_row ? 'question_count'     THEN (v_row->>'question_count')::integer  ELSE question_count     END,
          marks_per_question = CASE WHEN v_row ? 'marks_per_question' THEN (v_row->>'marks_per_question')::numeric ELSE marks_per_question END
      WHERE id = v_sid;
      v_subjects_updated := v_subjects_updated + 1;
    END;
  END LOOP;

  -- 5. Per-subject topic requirements (save_exam_topic_configuration rules)
  FOR v_group IN SELECT * FROM jsonb_array_elements(COALESCE(p_topics, '[]'::jsonb)) LOOP
    v_group_paper := (v_group->>'paper_id')::uuid;
    v_total_required := 0;

    SELECT question_count INTO v_subject_total
    FROM public.exam_subjects
    WHERE exam_id = p_exam_id
      AND paper_id = COALESCE(v_group_paper, p_paper_id)
      AND subject_name = (v_group->>'subject_name');

    IF v_subject_total IS NULL THEN
      RAISE EXCEPTION 'SUBJECT_NOT_FOUND: Subject % not found for paper %',
        (v_group->>'subject_name'), COALESCE(v_group_paper, p_paper_id);
    END IF;

    -- Pass 1: validate everything BEFORE any topic write
    FOR v_topic IN SELECT * FROM jsonb_array_elements(COALESCE(v_group->'topics', '[]'::jsonb)) LOOP
      DECLARE
        v_tid uuid := (v_topic->>'topic_id')::uuid;
        v_req integer := (v_topic->>'required_questions')::integer;
      BEGIN
        IF v_req IS NULL OR v_req < 1 THEN
          RAISE EXCEPTION 'INVALID_THRESHOLD: required_questions must be >= 1, got %', v_req;
        END IF;

        SELECT EXISTS(
          SELECT 1 FROM public.exam_topics
          WHERE id = v_tid
            AND exam_id = p_exam_id
            AND paper_id = COALESCE(v_group_paper, p_paper_id)
            AND subject_name = (v_group->>'subject_name')
        ) INTO v_exists;
        IF NOT v_exists THEN
          RAISE EXCEPTION 'INVALID_TOPIC: Topic % does not belong to subject % in paper %',
            v_tid, (v_group->>'subject_name'), COALESCE(v_group_paper, p_paper_id);
        END IF;

        v_total_required := v_total_required + v_req;
      END;
    END LOOP;

    IF v_total_required != v_subject_total THEN
      RAISE EXCEPTION 'SUM_MISMATCH: Topic requirements sum (%) must equal subject total (%)',
        v_total_required, v_subject_total;
    END IF;

    -- Pass 2: apply
    FOR v_topic IN SELECT * FROM jsonb_array_elements(COALESCE(v_group->'topics', '[]'::jsonb)) LOOP
      UPDATE public.exam_topics
      SET required_questions = (v_topic->>'required_questions')::integer
      WHERE id = (v_topic->>'topic_id')::uuid;
      v_topics_updated := v_topics_updated + 1;
    END LOOP;
  END LOOP;

  -- Single-transaction guarantee: reaching this point means EVERY statement
  -- above succeeded; any earlier exception aborted the whole block.
  RETURN jsonb_build_object(
    'ok', true,
    'configs_updated', v_configs_updated,
    'papers_updated', v_papers_updated,
    'subjects_updated', v_subjects_updated,
    'topics_updated', v_topics_updated
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.save_admin_settings_rpc(text, text, uuid, jsonb, jsonb, jsonb) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_admin_settings_rpc(text, text, uuid, jsonb, jsonb, jsonb) TO authenticated, service_role;

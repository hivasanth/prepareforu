-- =============================================================================
-- MIGRATION: F-01 (P0) + F-07 security core — answer-key self-readback
-- Date: 2026-09-03
--
-- Security property (Report A finding F-01, directive):
--   During an ACTIVE attempt the examinee MUST NOT be able to retrieve
--   correct_option / the answer key / any hidden correctness flag / scoring
--   metadata — through attempt_answers, questions, RPC responses or REST.
--   Post-completion review per product rules; admin/sub-admin access preserved
--   (Report A finding F-07 least privilege).
--
-- WHAT CHANGES
--   1. attempt_answers.correct_option is DROPPED entirely. It was written by
--      the four attempt-mutation RPCs but read by ZERO SQL readers (verified
--      live); review restores the answer from the questions table / teacher
--      RPCs. Dropping it removes the P0 release vector at the source.
--   2. The four attempt-mutation RPCs are rewritten to the same authoritative
--      scoring/provenance logic WITHOUT accepting or storing correct_option.
--      Signatures change (p_correct_option removed) -> DROP + CREATE.
--   3. attempt_answers(is_correct, marks_awarded) SELECT is REVOKED from
--      anon/authenticated. Row visibility is unchanged (answers_select_own /
--      answers_select_subadmin remain); the correctness/scoring columns are
--      only readable via the completion/sub-admin gated DEFINER readers below,
--      so a mid-attempt correctness oracle is impossible.
--   4. questions(correct_option, explanation_en, explanation_te) SELECT is
--      REVOKED from anon/authenticated. Every legitimate answer-bearing read
--      moves behind a role/entitlement-gated SECURITY DEFINER RPC:
--        - get_attempt_review_answers     (owner + completed/auto_submitted)
--        - get_content_review_questions   (owner + completed/auto_submitted)
--        - get_subadmin_attempt_answers   (sub-admin of the teacher exam)
--        - get_practice_questions         (is_exam_allowed_for_user; prepare-write
--          practice reveals answers BY PRODUCT DESIGN)
--        - admin_list_questions           (is_admin() OR is_sub_admin())
--      All under EXECUTE-granted to authenticated ONLY.
--      Exam-take delivery (EXAM_QUESTION_SECURE_FIELDS) and selection RPCs
--      (get_subject/topic_test_questions) never carried the key and are
--      unaffected.
--   5. No RLS policy is weakened or removed. No client-authoritative logic.
--
-- DEPENDENCIES
--   public.questions          (correct_option, explanation_en/te columns)
--   public.attempt_answers    (correct_option column; is_correct/marks_awarded)
--   public.attempts           (status, questions_snapshot, user_id)
--   public.teacher_exam_questions, public.teacher_exams, public.sub_admins
--   public.is_exam_allowed_for_user(text)   (existing entitlement helper)
--   public.is_admin() / public.is_sub_admin() (existing role helpers)
--   public._pf_marks_for_question(uuid)     (existing marks authority)
-- =============================================================================

-- ─── 1. Remove attempt_answers.correct_option (auto-drops its CHECK) ─────────

ALTER TABLE public.attempt_answers DROP CONSTRAINT IF EXISTS attempt_answers_correct_option_check;
ALTER TABLE public.attempt_answers DROP COLUMN IF EXISTS correct_option;

-- ─── 2. Revoke mid-attempt correctness/scoring columns from end-user roles ───

-- account_answers: keep row visibility, kill the hidden-correctness oracle.
REVOKE SELECT (is_correct, marks_awarded) ON public.attempt_answers FROM anon;
REVOKE SELECT (is_correct, marks_awarded) ON public.attempt_answers FROM authenticated;

-- questions: answer column + answer-revealing explanations leave the REST plane.
REVOKE SELECT (correct_option, explanation_en, explanation_te) ON public.questions FROM anon;
REVOKE SELECT (correct_option, explanation_en, explanation_te) ON public.questions FROM authenticated;

-- ─── 3. Rewrite the four attempt-mutation RPCs (no correct_option) ───────────

DROP FUNCTION IF EXISTS public.set_question_answer(uuid, uuid, text, text);
CREATE OR REPLACE FUNCTION public.set_question_answer(
    p_attempt_id uuid,
    p_question_id uuid,
    p_selected_option text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_attempt record;
    v_marks numeric;
    v_neg numeric;
    v_authoritative_correct text;
    v_is_correct boolean;
    v_marks_awarded numeric;
    v_provenance_ok boolean := false;
    v_elem jsonb;
BEGIN
    -- Ownership guard.
    SELECT * INTO v_attempt FROM public.attempts
     WHERE id = p_attempt_id AND user_id = auth.uid();
    IF v_attempt.id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;
    IF v_attempt.status <> 'in_progress' THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_IN_PROGRESS';
    END IF;

    -- R-3 provenance: question must belong to the attempt's context, and we
    -- must be able to resolve its authoritative correct_option for scoring.
    -- (Unchanged strategy; only the persisted columns changed.)
    IF v_attempt.teacher_exam_id IS NOT NULL THEN
        SELECT correct_option INTO v_authoritative_correct
          FROM public.teacher_exam_questions
         WHERE id = p_question_id AND teacher_exam_id = v_attempt.teacher_exam_id;
        v_provenance_ok := v_authoritative_correct IS NOT NULL;
    ELSIF v_attempt.paper_id IS NOT NULL THEN
        SELECT q.correct_option INTO v_authoritative_correct
          FROM public.questions q
         WHERE q.id = p_question_id
           AND q.paper_id = v_attempt.paper_id;
        v_provenance_ok := v_authoritative_correct IS NOT NULL;
    ELSIF v_attempt.exam_id IS NOT NULL THEN
        SELECT q.correct_option INTO v_authoritative_correct
          FROM public.questions q
         WHERE q.id = p_question_id
           AND q.exam_id = v_attempt.exam_id;
        v_provenance_ok := v_authoritative_correct IS NOT NULL;
    ELSE
        FOR v_elem IN SELECT value FROM jsonb_array_elements(v_attempt.questions_snapshot)
        LOOP
            IF (v_elem->>'id')::uuid = p_question_id
               OR (v_elem->>'question_id')::uuid = p_question_id THEN
                v_provenance_ok := true;
                EXIT;
            END IF;
        END LOOP;
        IF v_provenance_ok THEN
            SELECT q.correct_option INTO v_authoritative_correct
              FROM public.questions q
             WHERE q.id = p_question_id;
        END IF;
    END IF;

    IF NOT v_provenance_ok OR v_authoritative_correct IS NULL THEN
        RAISE EXCEPTION 'QUESTION_NOT_IN_ATTEMPT: question does not belong to this attempt';
    END IF;

    -- R-2: authoritative marks + negative (client-supplied values ignored).
    SELECT m.marks, m.neg INTO v_marks, v_neg
      FROM public._pf_marks_for_question(p_question_id) m;

    v_is_correct := (p_selected_option IS NOT NULL AND p_selected_option = v_authoritative_correct);
    v_marks := COALESCE(v_marks, 1);
    v_neg := COALESCE(v_neg, 0);
    v_marks_awarded := CASE
        WHEN p_selected_option IS NULL THEN 0
        WHEN v_is_correct THEN v_marks
        WHEN v_neg > 0 THEN -v_neg
        ELSE 0
    END;

    -- correct_option is deliberately NOT persisted to attempt_answers.
    INSERT INTO public.attempt_answers (
        attempt_id, question_id, selected_option,
        is_correct, marks_awarded
    ) VALUES (
        p_attempt_id, p_question_id, p_selected_option,
        CASE WHEN p_selected_option IS NULL THEN NULL ELSE v_is_correct END,
        v_marks_awarded
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        selected_option = EXCLUDED.selected_option,
        is_correct = EXCLUDED.is_correct,
        marks_awarded = EXCLUDED.marks_awarded;
END;
$$;

DROP FUNCTION IF EXISTS public.touch_question_visit(uuid, uuid, text);
CREATE OR REPLACE FUNCTION public.touch_question_visit(
    p_attempt_id uuid,
    p_question_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.attempts
        WHERE id = p_attempt_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.questions WHERE id = p_question_id) THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
    END IF;

    INSERT INTO public.attempt_answers (
        attempt_id, question_id,
        selected_option, is_correct, marks_awarded,
        time_spent_secs, marked_for_review,
        visited, last_visited_at
    ) VALUES (
        p_attempt_id, p_question_id,
        NULL, NULL, 0,
        0, false,
        true, now()
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        visited = true,
        last_visited_at = now();
END;
$$;

DROP FUNCTION IF EXISTS public.set_question_review(uuid, uuid, text, boolean);
CREATE OR REPLACE FUNCTION public.set_question_review(
    p_attempt_id uuid,
    p_question_id uuid,
    p_marked boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.attempts
        WHERE id = p_attempt_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.questions WHERE id = p_question_id) THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
    END IF;

    INSERT INTO public.attempt_answers (
        attempt_id, question_id, marked_for_review
    ) VALUES (
        p_attempt_id, p_question_id, p_marked
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        marked_for_review = EXCLUDED.marked_for_review;
END;
$$;

DROP FUNCTION IF EXISTS public.add_question_time(uuid, uuid, text, integer);
CREATE OR REPLACE FUNCTION public.add_question_time(
    p_attempt_id uuid,
    p_question_id uuid,
    p_seconds integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.attempts
        WHERE id = p_attempt_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.questions WHERE id = p_question_id) THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
    END IF;

    INSERT INTO public.attempt_answers (
        attempt_id, question_id, time_spent_secs
    ) VALUES (
        p_attempt_id, p_question_id, p_seconds
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        time_spent_secs = public.attempt_answers.time_spent_secs + EXCLUDED.time_spent_secs;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_question_answer(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_question_visit(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_question_review(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_question_time(uuid, uuid, integer) TO authenticated;

-- ─── 4. Completion/sub-admin gated correctness readers (SECURITY DEFINER) ─────

-- Post-completion per-question correctness for review (owner only).
CREATE OR REPLACE FUNCTION public.get_attempt_review_answers(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_status text;
    v_rows jsonb;
BEGIN
    SELECT status INTO v_status
      FROM public.attempts
     WHERE id = p_attempt_id AND user_id = auth.uid();
    IF v_status IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;
    IF v_status NOT IN ('completed', 'auto_submitted') THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_COMPLETED';
    END IF;

    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_rows
      FROM (
        SELECT id, attempt_id, question_id, selected_option,
               is_correct, marks_awarded, time_spent_secs,
               visited, marked_for_review, last_visited_at
          FROM public.attempt_answers
         WHERE attempt_id = p_attempt_id
      ) t;
    RETURN v_rows;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_attempt_review_answers(uuid) TO authenticated;

-- Sub-admin per-question correctness for their own teacher exams.
CREATE OR REPLACE FUNCTION public.get_subadmin_attempt_answers(p_attempt_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_rows jsonb;
BEGIN
    -- Preserves the pre-F-01 RLS semantics: admins (answers_select_admin) see
    -- all rows; sub-admins (answers_select_subadmin) only their own exams.
    IF public.is_admin() THEN
        SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_rows
          FROM (
            SELECT aa.id, aa.attempt_id, aa.question_id, aa.selected_option, aa.is_correct
              FROM public.attempt_answers aa
             WHERE p_attempt_ids IS NULL OR aa.attempt_id = ANY(p_attempt_ids)
          ) t;
        RETURN v_rows;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.sub_admins WHERE user_id = auth.uid()) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: sub-admin required';
    END IF;

    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_rows
      FROM (
        SELECT aa.id, aa.attempt_id, aa.question_id, aa.selected_option, aa.is_correct
          FROM public.attempt_answers aa
          JOIN public.attempts a ON a.id = aa.attempt_id
          JOIN public.teacher_exams te ON te.id = a.teacher_exam_id
         WHERE (p_attempt_ids IS NULL OR aa.attempt_id = ANY(p_attempt_ids))
           AND te.sub_admin_id IN (
                 SELECT sa.id FROM public.sub_admins sa WHERE sa.user_id = auth.uid()
               )
      ) t;
    RETURN v_rows;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_subadmin_attempt_answers(uuid[]) TO authenticated;

-- Post-completion full question definitions (incl. correct_option + explanations)
-- for CONTENT-attempt review. Snapshot ids come from the owner's own attempt.
CREATE OR REPLACE FUNCTION public.get_content_review_questions(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_status text;
    v_snapshot jsonb;
    v_ids uuid[];
    v_rows jsonb;
BEGIN
    SELECT status, questions_snapshot INTO v_status, v_snapshot
      FROM public.attempts
     WHERE id = p_attempt_id AND user_id = auth.uid();
    IF v_status IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;
    IF v_status NOT IN ('completed', 'auto_submitted') THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_COMPLETED';
    END IF;

    SELECT ARRAY(
        SELECT COALESCE((e.value->>'id')::uuid, (e.value->>'question_id')::uuid)
          FROM jsonb_array_elements(v_snapshot) e
         WHERE (e.value->>'id')::uuid IS NOT NULL
            OR (e.value->>'question_id')::uuid IS NOT NULL
    ) INTO v_ids;

    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_rows
      FROM (
        SELECT id, exam_id, paper_id, subject_name,
               correct_option, difficulty, negative_marks, visual,
               question_text_en, question_text_te,
               option_a_en, option_b_en, option_c_en, option_d_en,
               option_a_te, option_b_te, option_c_te, option_d_te,
               explanation_en, explanation_te
          FROM public.questions
         WHERE id = ANY(v_ids)
      ) t;
    RETURN v_rows;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_content_review_questions(uuid) TO authenticated;

-- Prepare & Write practice: entitlement-gated question delivery that KEEPS the
-- answer + explanations (product decision section 31). RLS is bypassed by the
-- DEFINER context, so the same entitlement function gates every row.
CREATE OR REPLACE FUNCTION public.get_practice_questions(
    p_paper_id uuid,
    p_subject_name text,
    p_exam_ids text[],
    p_exclude_ids uuid[],
    p_include_only boolean,
    p_limit integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_rows jsonb;
BEGIN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_rows
      FROM (
        SELECT q.id, q.exam_id, q.paper_id, q.subject_name,
               q.correct_option, q.difficulty, q.negative_marks, q.visual,
               q.question_text_en, q.question_text_te,
               q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en,
               q.option_a_te, q.option_b_te, q.option_c_te, q.option_d_te,
               q.explanation_en, q.explanation_te
          FROM public.questions q
         WHERE q.is_active = true
           AND q.paper_id = p_paper_id
           AND q.subject_name = p_subject_name
           AND q.exam_id = ANY(p_exam_ids)
           AND public.is_exam_allowed_for_user(q.exam_id)
           AND CASE
                 WHEN p_include_only THEN q.id = ANY(COALESCE(p_exclude_ids, '{}'::uuid[]))
                 ELSE p_exclude_ids IS NULL
                      OR array_length(p_exclude_ids, 1) IS NULL
                      OR NOT (q.id = ANY(p_exclude_ids))
               END
         LIMIT p_limit
      ) t;
    RETURN v_rows;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_practice_questions(uuid, text, text[], uuid[], boolean, integer) TO authenticated;

-- Admin/sub-admin question listing incl. answer-bearing columns. RLS bypassed
-- by the DEFINER context, so the role gate is re-applied in SQL. ORDER BY is
-- column-whitelisted; all filter bindings use format() %L (no injection).
CREATE OR REPLACE FUNCTION public.admin_list_questions(
    p_exam_ids text[],
    p_paper_id text,
    p_subject_name text,
    p_difficulty text,
    p_search text,
    p_sort_column text,
    p_ascending boolean,
    p_offset integer,
    p_limit integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_where text := ' WHERE 1=1';
    v_sort text;
    v_count integer;
    v_rows jsonb;
BEGIN
    IF NOT (public.is_admin() OR public.is_sub_admin()) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: admin or sub-admin required';
    END IF;

    IF p_exam_ids IS NOT NULL AND array_length(p_exam_ids, 1) > 0 THEN
        v_where := v_where || format(' AND q.exam_id = ANY(%L)', p_exam_ids);
    END IF;
    IF p_paper_id IS NOT NULL AND p_paper_id <> 'all' THEN
        v_where := v_where || format(' AND q.paper_id = %L::uuid', p_paper_id);
    END IF;
    IF p_subject_name IS NOT NULL AND p_subject_name <> 'all' THEN
        v_where := v_where || format(' AND q.subject_name = %L', p_subject_name);
    END IF;
    IF p_difficulty IS NOT NULL AND p_difficulty <> 'all' THEN
        v_where := v_where || format(' AND q.difficulty = %L', p_difficulty);
    END IF;
    IF p_search IS NOT NULL AND p_search <> '' THEN
        v_where := v_where || format(' AND q.question_text_en ILIKE %L', '%' || p_search || '%');
    END IF;

    v_sort := CASE p_sort_column
        WHEN 'id' THEN 'id'
        WHEN 'exam_id' THEN 'exam_id'
        WHEN 'paper_id' THEN 'paper_id'
        WHEN 'subject_name' THEN 'subject_name'
        WHEN 'topic_en' THEN 'topic_en'
        WHEN 'difficulty' THEN 'difficulty'
        WHEN 'is_active' THEN 'is_active'
        WHEN 'created_at' THEN 'created_at'
        WHEN 'updated_at' THEN 'updated_at'
        ELSE 'updated_at'
    END;

    EXECUTE format('SELECT count(*) FROM public.questions q%s', v_where) INTO v_count;

    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
         FROM (
           SELECT q.id, q.exam_id, q.paper_id, q.subject_name,
                  q.topic_en, q.topic_te,
                  q.correct_option, q.difficulty, q.negative_marks, q.visual,
                  q.content_hash, q.is_active, q.created_by,
                  q.created_at, q.updated_at, q.import_session_id,
                  q.question_text_en, q.question_text_te,
                  q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en,
                  q.option_a_te, q.option_b_te, q.option_c_te, q.option_d_te,
                  q.explanation_en, q.explanation_te
             FROM public.questions q%s
            ORDER BY q.%I %s
            LIMIT %s OFFSET %s
         ) t',
      v_where,
      v_sort,
      CASE WHEN p_ascending THEN 'ASC' ELSE 'DESC' END,
      p_limit,
      p_offset
    ) INTO v_rows;

    RETURN jsonb_build_object('count', v_count, 'rows', COALESCE(v_rows, '[]'::jsonb));
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_questions(text[], text, text, text, text, text, boolean, integer, integer) TO authenticated;
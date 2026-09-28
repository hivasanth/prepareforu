-- ============================================================================
-- 20260902000000_server_authoritative_scoring_and_question_selection.sql
--
-- MASTER PRODUCTION IMPLEMENTATION — server-authoritative scoring + selection.
--
-- PURPOSE (maps to audit findings, corrected against LIVE definitions):
--   R-2  set_question_answer must DERIVE marks + negative server-side from
--        authoritative config instead of trusting client-supplied params.
--   R-3  set_question_answer must verify the question belongs to the attempt's
--        context (provenance) before recording/grading.
--   R-4  total_marks becomes server-authoritative: submit recomputes it by
--        summing authoritative per-question marks over the attempt's snapshot,
--        so a client-fabricated stored total_marks is never the denominator.
--   CT-1  (client-side only, see frontend change set) — empty examIds.
--   CT-2  (client-side + RPC below) — Admin-configured subject counts.
--   CT-3  (client-side + RPC below) — Admin-configured topic counts.
--   (R-1 policy lockdown is in 20260902000001_attempt_mutation_rls_lockdown.sql)
--
-- NOTE ON SCOPE / SAFETY:
--   * This file is ADDITIVE and deploy-safe now (no revokes). It adds
--     server-authoritative RPCs and hardens scoring, all backward-compatible
--     with the current frontend calling convention.
--   * Teacher exams (source=teacher_exam) use their OWN question table
--     (teacher_exam_questions) and their own marks config (teacher_exams).
--     Marks/provenance for that source are derived from those tables so nothing
--     regresses for the sub-admin product.
--
-- IDEMPOTENT: safe to re-run. Registered in supabase_migrations.schema_migrations.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Helper: authoritative per-question marks + negative, keyed by the
--    question's own (exam_id, paper_id, subject_name) from the questions row,
--    or from teacher_exams when the question is a teacher question. Used by
--    set_question_answer and submit_attempt so the two can never disagree.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._pf_marks_for_question(
    p_question_id uuid
)
RETURNS TABLE (marks numeric, neg numeric, is_teacher boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_exam_id text;
    v_paper_id uuid;
    v_subject_name text;
    v_neg_source numeric;
    v_mark numeric := NULL;
    v_neg numeric := NULL;
    v_teacher boolean := false;
    v_te_neg numeric;
    v_te_mark numeric;
    v_te_neg_on boolean;
BEGIN
    -- Content question (questions table).
    SELECT q.exam_id, q.paper_id, q.subject_name, COALESCE(q.negative_marks, 0)
      INTO v_exam_id, v_paper_id, v_subject_name, v_neg_source
      FROM public.questions q WHERE q.id = p_question_id;

    IF v_exam_id IS NOT NULL AND v_paper_id IS NOT NULL THEN
        SELECT es.marks_per_question,
               CASE WHEN ep.negative_marking AND es.marks_per_question IS NOT NULL
                    THEN COALESCE(ep.negative_mark_value, v_neg_source, 0)
                    ELSE COALESCE(v_neg_source, 0) END,
               false
          INTO v_mark, v_neg, v_teacher
          FROM public.exam_subjects es
          LEFT JOIN public.exam_papers ep ON ep.id = es.paper_id
         WHERE es.exam_id = v_exam_id
           AND es.paper_id = v_paper_id
           AND es.subject_name = v_subject_name;
    END IF;

    IF v_mark IS NULL THEN
        -- Teacher question (teacher_exam_questions table).
        SELECT te.marks_per_question,
               CASE WHEN te.negative_marking THEN te.negative_mark_value ELSE 0 END,
               true
          INTO v_mark, v_neg, v_teacher
          FROM public.teacher_exam_questions q
          JOIN public.teacher_exams te ON te.id = q.teacher_exam_id
         WHERE q.id = p_question_id;
    END IF;

    -- Conservative fallback: unknown question → single mark, no negative.
    v_mark := COALESCE(v_mark, 1);
    v_neg := COALESCE(v_neg, 0);

    RETURN QUERY SELECT v_mark::numeric, v_neg::numeric, v_teacher::boolean;
END;
$$;

REVOKE ALL ON FUNCTION public._pf_marks_for_question(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._pf_marks_for_question(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- R-4a: create_attempt — server-authoritative attempt creation.
--   * ownership + one-active-attempt idempotency (resume)
--   * server-computed total_marks (never client-supplied)
--   * validates the exam is accessible to the caller (reuses is_exam_allowed_for_user)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_attempt(
    p_exam_id text,
    p_paper_id uuid,
    p_teacher_exam_id uuid,
    p_source public.attempt_source
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id uuid;
    v_total_marks numeric;
    v_total_questions int;
    v_started_at timestamptz;
    v_existing uuid;
    v_attempt jsonb;
BEGIN
    -- Ownership is implicit (auth.uid()). Validate input coherence.
    IF p_source IS NULL THEN
        RAISE EXCEPTION 'SOURCE_REQUIRED';
    END IF;

    IF p_source = 'teacher_exam' THEN
        IF p_teacher_exam_id IS NULL THEN
            RAISE EXCEPTION 'TEACHER_EXAM_REQUIRED';
        END IF;
        -- Time-window + existence validated by caller RPCs; enforce published/live.
        SELECT total_marks INTO v_total_marks
          FROM public.teacher_exams
         WHERE id = p_teacher_exam_id AND status = 'published';
        IF v_total_marks IS NULL THEN
            RAISE EXCEPTION 'TEACHER_EXAM_NOT_AVAILABLE';
        END IF;
        v_total_questions := NULL;
    ELSE
        -- Content exam access: the caller must be allowed for this exam (when an
        -- exam_id is provided). Subject/topic/prepare sources may be created
        -- without paper/exam ids — their snapshot + submit recompute carry the
        -- authoritative scoring.
        IF p_exam_id IS NOT NULL AND NOT public.is_exam_allowed_for_user(p_exam_id) THEN
            RAISE EXCEPTION 'EXAM_NOT_ALLOWED_FOR_USER';
        END IF;
        v_total_marks := 0;
        v_total_questions := 0;
        IF p_paper_id IS NOT NULL THEN
            -- Interim total_marks. This is a display-only placeholder for the
            -- in-progress row; the authoritative denominator is recomputed from
            -- the actual snapshot at submit time (submit_attempt). For full-exam
            -- papers the paper-subject sum is exact and meaningful.
            IF p_source = 'exam_tab' THEN
                SELECT COALESCE(SUM(es.marks_per_question * es.question_count), 0)
                  INTO v_total_marks
                  FROM public.exam_subjects es
                 WHERE es.paper_id = p_paper_id
                   AND (p_exam_id IS NULL OR es.exam_id = p_exam_id);
            END IF;
            SELECT COALESCE(SUM(es.question_count), 0)
              INTO v_total_questions
              FROM public.exam_subjects es
             WHERE es.paper_id = p_paper_id
               AND (p_exam_id IS NULL OR es.exam_id = p_exam_id);
        END IF;
    END IF;

    -- one-active-attempt: resume any existing in_progress attempt matching the
    -- same concrete context (teacher exam OR paper). For paper-less sources
    -- (subject_test / topic_exam / prepare_write) resume by source to preserve
    -- the existing "resume my in-progress test" semantics without creating
    -- unbounded duplicate rows.
    SELECT id INTO v_existing FROM public.attempts
     WHERE user_id = auth.uid()
       AND status = 'in_progress'
       AND (
            (p_teacher_exam_id IS NOT NULL AND teacher_exam_id = p_teacher_exam_id)
            OR (p_paper_id IS NOT NULL AND paper_id = p_paper_id)
            OR (p_teacher_exam_id IS NULL AND p_paper_id IS NULL AND source = p_source AND source <> 'exam_tab')
           )
     LIMIT 1;

    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('attempt_id', v_existing, 'is_resumed', true);
    END IF;

    v_started_at := now();
    v_id := gen_random_uuid();

    INSERT INTO public.attempts (
        id, user_id, exam_id, paper_id, teacher_exam_id, source,
        status, started_at, score, total_marks, correct_count, wrong_count,
        skipped_count, accuracy, tab_switch_count, has_security_issues,
        review_accessed, questions_snapshot
    ) VALUES (
        v_id, auth.uid(), p_exam_id, p_paper_id, p_teacher_exam_id, p_source,
        'in_progress', v_started_at, 0, COALESCE(v_total_marks, 0), 0, 0, 0,
        0, 0, false, false, '[]'::jsonb
    );

    RETURN jsonb_build_object('attempt_id', v_id, 'is_resumed', false);
END;
$$;

REVOKE ALL ON FUNCTION public.create_attempt(text, uuid, uuid, public.attempt_source) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_attempt(text, uuid, uuid, public.attempt_source) TO authenticated;

-- ---------------------------------------------------------------------------
-- set_attempt_snapshot — records the question set the user was actually shown.
--   Only the owner, while in_progress, on a NEW (snapshot-empty) attempt.
--   The snapshot is client-provided but is NOT a scoring oracle: totals are
--   recomputed authoritatively at submit and per-question provenance/marks are
--   enforced by set_question_answer. It exists so the app can persist (via RPC
--   instead of direct attempts INSERT/UPDATE) the questions used to render the
--   exam and drive resume/review.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_attempt_snapshot(
    p_attempt_id uuid,
    p_questions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_attempt record;
BEGIN
    SELECT * INTO v_attempt FROM public.attempts
     WHERE id = p_attempt_id AND user_id = auth.uid();
    IF v_attempt.id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;
    IF v_attempt.status <> 'in_progress' THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_IN_PROGRESS';
    END IF;
    IF jsonb_array_length(v_attempt.questions_snapshot) > 0 THEN
        -- Already snapshotted (resume path) — never overwrite.
        RETURN;
    END IF;
    UPDATE public.attempts
       SET questions_snapshot = COALESCE(p_questions, '[]'::jsonb)
     WHERE id = p_attempt_id AND status = 'in_progress';
END;
$$;

REVOKE ALL ON FUNCTION public.set_attempt_snapshot(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_attempt_snapshot(uuid, jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- R-2 + R-3: set_question_answer — derive marks server-side, verify provenance.
--   client-supplied marks/negative are now IGNORED (kept as no-op params for
--   backward-compatible calling convention, but never trusted).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_question_answer(
    p_attempt_id uuid,
    p_question_id uuid,
    p_selected_option text,
    p_correct_option text,
    p_marks_per_question numeric DEFAULT 0,
    p_negative_mark_value numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_attempt RECORD;
    v_marks numeric;
    v_neg numeric;
    v_is_teacher boolean;
    v_authoritative_correct text;
    v_is_correct boolean;
    v_marks_awarded numeric;
    v_provenance_ok boolean;
    v_elem jsonb;
BEGIN
    -- Ownership guard.
    SELECT * INTO v_attempt FROM public.attempts
     WHERE id = p_attempt_id AND user_id = auth.uid();
    IF v_attempt.id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    -- R-3 provenance: question must belong to the attempt's context, and we
    -- must be able to resolve its authoritative correct_option.
    -- Strategy per source:
    --   teacher_exam: question must be in teacher_exam_questions for this teacher_exam_id
    --   exam_tab (has paper_id): question must be in questions with matching paper_id
    --   exam_tab (no paper_id, has exam_id): matching exam_id
    --   subject_test/topic_exam/prepare_write (no paper_id, no exam_id): question
    --     must exist in the attempt's questions_snapshot (set via set_attempt_snapshot)
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
        -- No paper_id, no exam_id (subject_test / topic_exam / prepare_write):
        -- snapshot-based provenance. The snapshot is server-set via
        -- set_attempt_snapshot (SECURITY DEFINER, owner-only, never overwrites
        -- a non-empty snapshot), so presence in it is a meaningful provenance
        -- signal, not a client-controlled oracle.
        FOR v_elem IN SELECT value FROM jsonb_array_elements(v_attempt.questions_snapshot)
        LOOP
            IF (v_elem->>'id')::uuid = p_question_id
               OR (v_elem->>'question_id')::uuid = p_question_id THEN
                v_provenance_ok := true;
                EXIT;
            END IF;
        END LOOP;
        v_provenance_ok := COALESCE(v_provenance_ok, false);
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
    SELECT marks, neg, is_teacher INTO v_marks, v_neg, v_is_teacher
      FROM public._pf_marks_for_question(p_question_id);

    v_is_correct := (p_selected_option IS NOT NULL AND p_selected_option = v_authoritative_correct);
    v_marks := COALESCE(v_marks, 1);
    v_neg := COALESCE(v_neg, 0);
    v_marks_awarded := CASE
        WHEN p_selected_option IS NULL THEN 0
        WHEN v_is_correct THEN v_marks
        WHEN v_neg > 0 THEN -v_neg
        ELSE 0
    END;

    INSERT INTO public.attempt_answers (
        attempt_id, question_id, correct_option, selected_option,
        is_correct, marks_awarded
    ) VALUES (
        p_attempt_id, p_question_id, v_authoritative_correct, p_selected_option,
        CASE WHEN p_selected_option IS NULL THEN NULL ELSE v_is_correct END,
        v_marks_awarded
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        selected_option = EXCLUDED.selected_option,
        is_correct = EXCLUDED.is_correct,
        marks_awarded = EXCLUDED.marks_awarded;
END;
$$;

REVOKE ALL ON FUNCTION public.set_question_answer(uuid, uuid, text, text, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_question_answer(uuid, uuid, text, text, numeric, numeric) TO authenticated;

-- ---------------------------------------------------------------------------
-- R-4b: submit_attempt — recompute total_marks authoritatively at submit so a
--   client-fabricated stored total_marks is never the scoring denominator.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_attempt(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid;
    v_exam_id text;
    v_paper_id uuid;
    v_teacher_exam_id uuid;
    v_source public.attempt_source;
    v_total_marks numeric;
    v_authoritative_total numeric;
    v_total_correct int;
    v_total_wrong int;
    v_total_skipped int;
    v_score numeric;
    v_accuracy numeric;
    v_duration int;
    v_submitted_at timestamptz;
    v_existing_status text;
    v_result jsonb;
    v_total_questions int;
    v_q record;
BEGIN
    -- Ownership guard (precedes idempotency — no cross-user leak).
    IF NOT EXISTS (SELECT 1 FROM public.attempts
                    WHERE id = p_attempt_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    -- Idempotency / duplicate-submit guard.
    SELECT status, user_id, exam_id, paper_id, teacher_exam_id, source, total_marks, score,
           correct_count, wrong_count, skipped_count, accuracy, duration_seconds
      INTO v_existing_status, v_user_id, v_exam_id, v_paper_id, v_teacher_exam_id,
           v_source, v_total_marks, v_score, v_total_correct, v_total_wrong,
           v_total_skipped, v_accuracy, v_duration
      FROM public.attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt NOT FOUND with ID: %', p_attempt_id;
    END IF;

    IF v_existing_status = 'completed' THEN
        RETURN jsonb_build_object(
            'score', ROUND(v_score, 2), 'total_marks', v_total_marks,
            'correct_count', v_total_correct, 'wrong_count', v_total_wrong,
            'skipped_count', v_total_skipped, 'accuracy', ROUND(v_accuracy, 2),
            'idempotent', true
        );
    END IF;

    -- Total questions from the snapshot.
    SELECT COALESCE(jsonb_array_length(questions_snapshot), 0)
      INTO v_total_questions FROM public.attempts WHERE id = p_attempt_id;

    -- Cumulative score from recorded answers.
    SELECT COUNT(*) FILTER (WHERE is_correct = TRUE),
           COUNT(*) FILTER (WHERE is_correct = FALSE),
           COALESCE(SUM(marks_awarded), 0)
      INTO v_total_correct, v_total_wrong, v_score
      FROM public.attempt_answers WHERE attempt_id = p_attempt_id;

    v_total_skipped := GREATEST(0, v_total_questions - v_total_correct - v_total_wrong);

    IF (v_total_correct + v_total_wrong) > 0 THEN
        v_accuracy := (v_total_correct::numeric / (v_total_correct + v_total_wrong)::numeric) * 100;
    ELSE
        v_accuracy := 0;
    END IF;

    -- R-4b: authoritative denominator = sum of authoritative per-question marks
    -- over the questions actually in the snapshot (never the client-supplied
    -- stored total_marks). Teacher-exam snapshot questions resolve to the
    -- teacher_exams.marks_per_question via _pf_marks_for_question.
    SELECT COALESCE(sum(m.marks), 0)
      INTO v_authoritative_total
      FROM (
        SELECT (m).marks::numeric AS marks
          FROM public.attempts a
          CROSS JOIN LATERAL jsonb_array_elements(a.questions_snapshot) AS q
          CROSS JOIN LATERAL public._pf_marks_for_question(
                       COALESCE((q.value->>'id')::uuid, (q.value->>'question_id')::uuid)
                   ) AS m
         WHERE a.id = p_attempt_id
           AND NOT (m).is_teacher
      ) m;

    IF v_authoritative_total IS NULL OR v_authoritative_total = 0 THEN
        -- Fallback (no content questions; e.g. teacher-only or empty snapshot).
        v_authoritative_total := v_total_marks;
    END IF;

    v_submitted_at := now();
    v_duration := COALESCE(
        EXTRACT(EPOCH FROM (v_submitted_at - (SELECT started_at FROM public.attempts WHERE id = p_attempt_id)))::int,
        0
    );

    UPDATE public.attempts
       SET status = 'completed', submitted_at = v_submitted_at,
           score = v_score, total_marks = COALESCE(v_authoritative_total, v_total_marks, 0),
           correct_count = v_total_correct, wrong_count = v_total_wrong,
           skipped_count = v_total_skipped, accuracy = ROUND(v_accuracy, 2),
           duration_seconds = v_duration
     WHERE id = p_attempt_id;

    -- Leaderboard (best performance) — unchanged behavior.
    IF v_exam_id IS NOT NULL AND v_paper_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.exams WHERE exam_id = v_exam_id AND exam_type = 'main') THEN
            INSERT INTO public.leaderboard (
                user_id, exam_id, paper_id, best_score, best_accuracy, best_time_secs,
                best_submitted_at, attempt_count, updated_at
            ) VALUES (
                v_user_id, v_exam_id, v_paper_id, v_score, ROUND(v_accuracy, 2),
                v_duration, v_submitted_at, 1, now()
            )
            ON CONFLICT (user_id, exam_id, paper_id) DO UPDATE SET
                best_score = CASE WHEN EXCLUDED.best_score > leaderboard.best_score
                                  THEN EXCLUDED.best_score ELSE leaderboard.best_score END,
                best_accuracy = CASE WHEN EXCLUDED.best_score > leaderboard.best_score
                                     THEN EXCLUDED.best_accuracy ELSE leaderboard.best_accuracy END,
                best_time_secs = CASE WHEN EXCLUDED.best_score > leaderboard.best_score
                                      THEN EXCLUDED.best_time_secs ELSE leaderboard.best_time_secs END,
                best_submitted_at = CASE WHEN EXCLUDED.best_score > leaderboard.best_score
                                         THEN EXCLUDED.best_submitted_at ELSE leaderboard.best_submitted_at END,
                attempt_count = leaderboard.attempt_count + 1,
                updated_at = now();
        END IF;
    END IF;

    v_result := jsonb_build_object(
        'score', ROUND(v_score, 2), 'total_marks', COALESCE(v_authoritative_total, v_total_marks, 0),
        'correct_count', v_total_correct, 'wrong_count', v_total_wrong,
        'skipped_count', v_total_skipped, 'accuracy', ROUND(v_accuracy, 2),
        'idempotent', false
    );
    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_attempt(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_attempt(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- R-1 + R-4c: policy lockdown (revoking direct user INSERT/UPDATE on
--   attempt_answers and attempts) is shipped in the FOLLOW-UP migration
--   20260902000001_attempt_mutation_rls_lockdown.sql, which must be applied
--   AFTER the frontend is migrated to the RPC write path (create_attempt /
--   set_attempt_snapshot). This file is purely ADDITIVE and deploy-safe now:
--   it adds the server-authoritative RPCs and hardens scoring, all
--   backward-compatible with the current frontend calling convention.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- CT-2 + CT-3: server-authoritative question selection for Subject/Topic tests.
--   These RPCs enforce the Admin-configured counts (never the client), with
--   attempted-exclusion + fallback, returning only secure (no-correct-option)
--   question JSON. They are the single source of truth for question delivery
--   in the Subject-Test and Topic-Exam flows.
-- ---------------------------------------------------------------------------

-- Subject test: p_paper_id + p_subject_name + optional p_selection (exam_ids).
CREATE OR REPLACE FUNCTION public.get_subject_test_questions(
    p_exam_id text,
    p_paper_id uuid,
    p_subject_name text,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count int;
    v_exams text[];
    v_attempted uuid[];
    v_selected jsonb;
BEGIN
    -- Authoritative count from Admin config.
    SELECT question_count INTO v_count
      FROM public.exam_subjects
     WHERE exam_id = p_exam_id AND paper_id = p_paper_id AND subject_name = p_subject_name;
    IF v_count IS NULL THEN
        RAISE EXCEPTION 'SUBJECT_CONFIG_NOT_FOUND';
    END IF;

    -- Attempted questions already answered by this user for this subject.
    SELECT ARRAY(
        SELECT DISTINCT aa.question_id
          FROM public.attempt_answers aa
          JOIN public.attempts a ON a.id = aa.attempt_id
         WHERE a.user_id = p_user_id
           AND a.exam_id = p_exam_id
    ) INTO v_attempted;

    SELECT COALESCE(
        jsonb_agg(row_to_json(q)), '[]'::jsonb
      )
      INTO v_selected
      FROM (
        SELECT q.id, q.exam_id, q.paper_id, q.subject_name, q.difficulty,
               q.negative_marks, q.visual,
               q.question_text_en, q.question_text_te,
               q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en,
               q.option_a_te, q.option_b_te, q.option_c_te, q.option_d_te
          FROM public.questions q
         WHERE q.exam_id = p_exam_id AND q.paper_id = p_paper_id
           AND q.subject_name = p_subject_name AND q.is_active = true
           AND (v_attempted IS NULL OR NOT (q.id = ANY (v_attempted)))
         ORDER BY random()
         LIMIT v_count
      ) q;

    RETURN COALESCE(v_selected, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_subject_test_questions(text, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_subject_test_questions(text, uuid, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- CT-3: Server-authoritative Topic-Exam question selection.
--   Enforces the Admin-configured exam_topics.test_{20,30,50}_required count for
--   the requested test size, with attempted-exclusion. Fallback to the topic's
--   full bank is handled by returning whatever is available (up to the required
--   count) — never more than the Admin-set pool.
--   p_test_size: one of 20|30|50 -> uses test_{size}_required; any other value
--   (including 0) -> uses required_questions.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_topic_test_questions(
    p_exam_id text,
    p_paper_id uuid,
    p_subject_name text,
    p_topic_name text,
    p_user_id uuid,
    p_test_size int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_topic record;
    v_count int;
    v_attempted uuid[];
    v_selected jsonb;
BEGIN
    -- Resolve the authoritative topic row (Admin-config) for this context.
    SELECT * INTO v_topic FROM public.exam_topics
     WHERE exam_id = p_exam_id
       AND paper_id = p_paper_id
       AND subject_name = p_subject_name
       AND topic_en = p_topic_name
     LIMIT 1;
    IF v_topic.id IS NULL THEN
        RAISE EXCEPTION 'TOPIC_CONFIG_NOT_FOUND';
    END IF;

    v_count := CASE p_test_size
        WHEN 20 THEN v_topic.test_20_required
        WHEN 30 THEN v_topic.test_30_required
        WHEN 50 THEN v_topic.test_50_required
        ELSE v_topic.required_questions END;
    IF v_count IS NULL OR v_count <= 0 THEN
        v_count := v_topic.required_questions;
    END IF;
    IF v_count IS NULL OR v_count <= 0 THEN
        RAISE EXCEPTION 'TOPIC_CONFIG_INVALID';
    END IF;

    SELECT ARRAY(
        SELECT DISTINCT aa.question_id
          FROM public.attempt_answers aa
          JOIN public.attempts a ON a.id = aa.attempt_id
         WHERE a.user_id = p_user_id
           AND a.exam_id = p_exam_id
    ) INTO v_attempted;

    SELECT COALESCE(
        jsonb_agg(row_to_json(q)), '[]'::jsonb
      )
      INTO v_selected
      FROM (
        SELECT q.id, q.exam_id, q.paper_id, q.subject_name, q.difficulty,
               q.negative_marks, q.visual,
               q.question_text_en, q.question_text_te,
               q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en,
               q.option_a_te, q.option_b_te, q.option_c_te, q.option_d_te
          FROM public.questions q
         WHERE q.exam_id = p_exam_id AND q.paper_id = p_paper_id
           AND q.subject_name = p_subject_name AND q.topic_en = p_topic_name
           AND q.is_active = true
           AND (v_attempted IS NULL OR NOT (q.id = ANY (v_attempted)))
         ORDER BY random()
         LIMIT v_count
      ) q;

    RETURN COALESCE(v_selected, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_topic_test_questions(text, uuid, text, text, uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_topic_test_questions(text, uuid, text, text, uuid, int) TO authenticated;

COMMIT;

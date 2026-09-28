-- ============================================================================
-- 20260902120000_educator_exams_publish_ready.sql
--
-- EDUCATOR EXAMS — PUBLISH-READY REMEDIATION
--
-- PURPOSE (maps to audit findings H-1, M-1, M-2):
--   H-1  Teacher-exam answer keys must never cross the student boundary.
--        * Drops the student RLS SELECT policy on teacher_exam_questions, so
--          direct PostgREST reads (any projection / any query params) return
--          zero rows for students. Sub-admin/admin manage policies are
--          untouched, so educator tooling is unaffected.
--        * Student question delivery moves behind the SECURITY DEFINER RPC
--          get_teacher_exam_questions, which returns an explicit SAFE field
--          set (no correct_option / explanation_*). Sub-admin owners/admins
--          receive the full field set (they legitimately author questions).
--        * Post-exam review answers/explanations are restored only through
--          get_teacher_exam_review_questions, gated by attempt ownership AND
--          completion. Scoring is untouched: set_question_answer /
--          submit_attempt re-resolve correct_option server-side from
--          teacher_exam_questions (see 20260902000000).
--   M-1  Leaderboard becomes server-side and authorization-gated: new RPC
--        get_teacher_exam_leaderboard returns ranked rows (no email, no PII)
--        to admitted viewers only, replacing the RLS-truncated client query.
--   M-2  create_attempt now enforces teacher-exam ownership + the scheduled
--        window against server time (now()), raising distinct stable codes
--        (UNAUTHORIZED_ACCESS / TEACHER_EXAM_NOT_AVAILABLE /
--        EXAM_NOT_STARTED / EXAM_WINDOW_CLOSED) that the canonical error
--        classifier maps to friendly UX.
--
-- SECURITY MODEL:
--   * Every RPC below is SECURITY DEFINER with SET search_path = public, pg_temp
--     (search_path injection defense, matching the hardening migrations).
--   * Ownership is resolved through the canonical sub_admins ↔ users linkage
--     used by the existing RLS policies (u.educator_id = sa.user_id) PLUS the
--     user.sub_admin_id = exam.sub_admin_id pattern the service layer already
--     trusts (ensureRole). Admin and the owning sub-admin always pass.
--   * Window comparisons use PostgreSQL now() — never client-supplied time.
--
-- FORWARD-ONLY and NEW ONLY: no historical migration is edited, no privilege
-- (RLS) is weakened. Deployable after the frontend change-set (examService /
-- teacherExamService / useReview / cacheKeys) ships together.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. H-1: close direct student reads of teacher exam questions at the row
--    level (RLS). Column-level role grants cannot separate students from
--    sub-admins here (one shared `authenticated` role), so the policy drop +
--    RPC-only contract is the correct boundary. Zero rows visible == zero
--    answer columns reachable, for any REST projection or query params.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "rls_teacher_exam_questions_student_select"
  ON public.teacher_exam_questions;

-- ---------------------------------------------------------------------------
-- 2. Shared access gate for teacher exams (ownership OR admin OR owning
--    sub-admin). Used by get_teacher_exam_questions, the leaderboard RPC, and
--    create_attempt so a single canonical predicate rules them all.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._pf_teacher_exam_access(p_teacher_exam_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.teacher_exams te
     WHERE te.id = p_teacher_exam_id
       AND (
            public.is_admin()
            OR EXISTS (
                 SELECT 1 FROM public.sub_admins sa
                  WHERE sa.id = te.sub_admin_id AND sa.user_id = auth.uid()
               )
            OR EXISTS (
                 SELECT 1
                   FROM public.sub_admins sa
                   JOIN public.users u ON u.educator_id = sa.user_id
                  WHERE sa.id = te.sub_admin_id AND u.id = auth.uid()
               )
            OR EXISTS (
                 SELECT 1 FROM public.users u
                  WHERE u.id = auth.uid() AND u.sub_admin_id = te.sub_admin_id
               )
           )
  );
$$;

REVOKE ALL ON FUNCTION public._pf_teacher_exam_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._pf_teacher_exam_access(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. H-1: teacher exam question delivery.
--    Students (authorized linked users) receive ONLY the safe field set;
--    the owning sub-admin / admin receive the full field set for authoring.
--    Answer fields are LITERALLY ABSENT from student responses (two explicit
--    projections, never a nullable-included column).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_teacher_exam_questions(p_teacher_exam_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sub_admin_id uuid;
    v_is_owner     boolean;
    v_out          jsonb;
BEGIN
    SELECT te.sub_admin_id INTO v_sub_admin_id
      FROM public.teacher_exams te
     WHERE te.id = p_teacher_exam_id;
    IF v_sub_admin_id IS NULL THEN
        RAISE EXCEPTION 'TEACHER_EXAM_NOT_AVAILABLE';
    END IF;

    IF NOT public._pf_teacher_exam_access(p_teacher_exam_id) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
    END IF;

    v_is_owner := public.is_admin()
        OR EXISTS (
             SELECT 1 FROM public.sub_admins sa
              WHERE sa.id = v_sub_admin_id AND sa.user_id = auth.uid()
           );

    IF v_is_owner THEN
        SELECT COALESCE(jsonb_agg(row_to_json(q)), '[]'::jsonb) INTO v_out
          FROM (
            SELECT q.id,
                   q.question_text_en, q.question_text_te,
                   q.option_a_en, q.option_a_te,
                   q.option_b_en, q.option_b_te,
                   q.option_c_en, q.option_c_te,
                   q.option_d_en, q.option_d_te,
                   q.correct_option,
                   q.explanation_en, q.explanation_te,
                   q.display_order, q.diagram
              FROM public.teacher_exam_questions q
             WHERE q.teacher_exam_id = p_teacher_exam_id
             ORDER BY q.display_order ASC, q.id ASC
          ) q;
    ELSE
        SELECT COALESCE(jsonb_agg(row_to_json(q)), '[]'::jsonb) INTO v_out
          FROM (
            SELECT q.id,
                   q.question_text_en, q.question_text_te,
                   q.option_a_en, q.option_a_te,
                   q.option_b_en, q.option_b_te,
                   q.option_c_en, q.option_c_te,
                   q.option_d_en, q.option_d_te,
                   q.display_order, q.diagram
              FROM public.teacher_exam_questions q
             WHERE q.teacher_exam_id = p_teacher_exam_id
             ORDER BY q.display_order ASC, q.id ASC
          ) q;
    END IF;

    RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.get_teacher_exam_questions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_teacher_exam_questions(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. H-1: post-exam review definitions for teacher attempts. The in-session
--    snapshot is now answer-free, so the review restores the full definition
--    (incl. correct_option + explanations) through this intentionally
--    authorized path: caller must OWN the attempt and it must be submitted.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_teacher_exam_review_questions(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_teacher_exam_id uuid;
    v_status          text;
    v_out             jsonb;
BEGIN
    SELECT a.teacher_exam_id, a.status
      INTO v_teacher_exam_id, v_status
      FROM public.attempts a
     WHERE a.id = p_attempt_id AND a.user_id = auth.uid();

    IF v_teacher_exam_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
    END IF;
    IF v_status NOT IN ('completed', 'auto_submitted') THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_SUBMITTED';
    END IF;

    SELECT COALESCE(jsonb_agg(row_to_json(q)), '[]'::jsonb) INTO v_out
      FROM (
        SELECT q.id,
               q.question_text_en, q.question_text_te,
               q.option_a_en, q.option_a_te,
               q.option_b_en, q.option_b_te,
               q.option_c_en, q.option_c_te,
               q.option_d_en, q.option_d_te,
               q.correct_option,
               q.explanation_en, q.explanation_te,
               q.display_order, q.diagram
          FROM public.teacher_exam_questions q
         WHERE q.teacher_exam_id = v_teacher_exam_id
         ORDER BY q.display_order ASC, q.id ASC
      ) q;

    RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.get_teacher_exam_review_questions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_teacher_exam_review_questions(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. M-1: server-rankable, authorization-gated leaderboard.
--    Rules (explicit + deterministic): higher score first; on a tie, faster
--    duration_seconds; on a further tie, earlier submitted_at. Row numbers
--    give strict 1..N ranks (no shared ranks). Full name only — no email, no
--    PII beyond what the product already shows. Includes every finished
--    attempt (completed + auto_submitted, the same scope the sub-admin detail
--    view uses) capped at 200 rows (parity with the previous client limit).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_teacher_exam_leaderboard(p_teacher_exam_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_exists boolean;
    v_out    jsonb;
BEGIN
    SELECT EXISTS (SELECT 1 FROM public.teacher_exams WHERE id = p_teacher_exam_id)
      INTO v_exists;
    IF NOT v_exists THEN
        RAISE EXCEPTION 'TEACHER_EXAM_NOT_AVAILABLE';
    END IF;

    IF NOT public._pf_teacher_exam_access(p_teacher_exam_id) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
    END IF;

    SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) INTO v_out
      FROM (
        SELECT ROW_NUMBER() OVER (
                 ORDER BY a.score DESC,
                          a.duration_seconds ASC NULLS LAST,
                          a.submitted_at ASC NULLS LAST
               ) AS rank,
               COALESCE(u.full_name, 'Anonymous') AS name,
               a.score,
               a.accuracy,
               a.duration_seconds
          FROM public.attempts a
          JOIN public.users u ON u.id = a.user_id
         WHERE a.teacher_exam_id = p_teacher_exam_id
           AND a.status IN ('completed', 'auto_submitted')
         ORDER BY a.score DESC,
                  a.duration_seconds ASC NULLS LAST,
                  a.submitted_at ASC NULLS LAST
         LIMIT 200
      ) r;

    RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.get_teacher_exam_leaderboard(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_teacher_exam_leaderboard(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. M-2: harden create_attempt for teacher exams — ownership + time window
--    (server now()), with stable, distinct domain codes. Content-exam
--    behavior is unchanged. The client-side is_teacher_exam_active call
--    remains as a UX pre-check only; this RPC is the enforcement boundary.
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
    v_te_status text;
    v_start timestamptz;
    v_end timestamptz;
BEGIN
    -- Ownership is implicit (auth.uid()). Validate input coherence.
    IF p_source IS NULL THEN
        RAISE EXCEPTION 'SOURCE_REQUIRED';
    END IF;

    IF p_source = 'teacher_exam' THEN
        IF p_teacher_exam_id IS NULL THEN
            RAISE EXCEPTION 'TEACHER_EXAM_REQUIRED';
        END IF;
        -- Existence + published + ownership + window. Checked here against
        -- server time so a manipulated client can never start outside the
        -- scheduled window or for an exam it cannot access.
        SELECT total_marks, status, start_time, end_time
          INTO v_total_marks, v_te_status, v_start, v_end
          FROM public.teacher_exams
         WHERE id = p_teacher_exam_id;
        IF v_te_status IS NULL OR v_te_status <> 'published' THEN
            RAISE EXCEPTION 'TEACHER_EXAM_NOT_AVAILABLE';
        END IF;
        IF NOT public._pf_teacher_exam_access(p_teacher_exam_id) THEN
            RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
        END IF;
        IF now() < v_start THEN
            RAISE EXCEPTION 'EXAM_NOT_STARTED';
        END IF;
        IF now() > v_end THEN
            RAISE EXCEPTION 'EXAM_WINDOW_CLOSED';
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

COMMIT;
-- =============================================================================
-- MIGRATION: FIX-20 — teacher-exam answer persistence blocker
-- Date: 2026-09-18
--
-- Defect (found during live multi-sub-admin verification, HTTP-tested):
--   Teacher-exam questions are stored in public.teacher_exam_questions, but
--   attempt_answers.question_id is constrained by
--   attempt_answers_question_id_fkey -> public.questions(id). Every answer to
--   a teacher-exam question therefore failed with HTTP 409 FK violation
--   (and touch_question_visit / set_question_review / add_question_time failed
--   with QUESTION_NOT_FOUND because they only probed public.questions).
--   Production evidence: the "powerbi" teacher attempt (2026-04-22, 30
--   questions, total_marks 30) recorded correct_count=0, wrong_count=0,
--   skipped_count=0, score=0 — no answer ever persisted. Students taking a
--   teacher exam were shown "Failed to save answer" on every interaction.
--
-- FIX (forward-only, non-weak, access-control unchanged):
--   1. DROP attempt_answers_question_id_fkey.
--        Access is NOT weakened: direct INSERT/UPDATE/DELETE on attempt_answers
--        is already blocked by RLS for anon/authenticated
--        (answers_insert_rpc_only WITH CHECK false) — only SECURITY DEFINER
--        RPCs can write, and they enforce R-3 provenance per attempt context.
--   2. Replace the FK with a trigger-based referential-integrity guard that
--        accepts question ids from EITHER public.questions (content exams) OR
--        public.teacher_exam_questions (teacher exams), so integrity is
--        retained for both domains.
--   3. Rewrite touch_question_visit / set_question_review / add_question_time
--        to resolve question existence against the attempt's own context:
--        teacher_exam_questions when the attempt is a teacher exam, otherwise
--        public.questions. Signature, grants, ownership checks unchanged.
-- =============================================================================

BEGIN;

-- ─── 1. Drop the mononorphic FK that blocks teacher-exam answers ────────────

ALTER TABLE public.attempt_answers DROP CONSTRAINT IF EXISTS attempt_answers_question_id_fkey;

-- ─── 2. Referential-integrity trigger (content OR teacher questions) ────────

CREATE OR REPLACE FUNCTION public._pf_ensure_attempt_answer_question()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF NEW.question_id IS NULL THEN
        RETURN NEW;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.questions WHERE id = NEW.question_id)
       AND NOT EXISTS (SELECT 1 FROM public.teacher_exam_questions WHERE id = NEW.question_id) THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', NEW.question_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_attempt_answers_question_integrity ON public.attempt_answers;
CREATE TRIGGER trg_attempt_answers_question_integrity
    BEFORE INSERT OR UPDATE OF question_id ON public.attempt_answers
    FOR EACH ROW
    EXECUTE FUNCTION public._pf_ensure_attempt_answer_question();

-- ─── 3. Context-aware question-existence checks in the session RPCs ─────────

DROP FUNCTION IF EXISTS public.touch_question_visit(uuid, uuid);
CREATE OR REPLACE FUNCTION public.touch_question_visit(
    p_attempt_id uuid,
    p_question_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_attempt record;
BEGIN
    SELECT id, teacher_exam_id INTO v_attempt
      FROM public.attempts
     WHERE id = p_attempt_id AND user_id = auth.uid();
    IF v_attempt.id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    IF v_attempt.teacher_exam_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.teacher_exam_questions q
             WHERE q.id = p_question_id
               AND q.teacher_exam_id = v_attempt.teacher_exam_id
        ) THEN
            RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
        END IF;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM public.questions WHERE id = p_question_id) THEN
            RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
        END IF;
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

DROP FUNCTION IF EXISTS public.set_question_review(uuid, uuid, boolean);
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
DECLARE
    v_attempt record;
BEGIN
    SELECT id, teacher_exam_id INTO v_attempt
      FROM public.attempts
     WHERE id = p_attempt_id AND user_id = auth.uid();
    IF v_attempt.id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    IF v_attempt.teacher_exam_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.teacher_exam_questions q
             WHERE q.id = p_question_id
               AND q.teacher_exam_id = v_attempt.teacher_exam_id
        ) THEN
            RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
        END IF;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM public.questions WHERE id = p_question_id) THEN
            RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
        END IF;
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

DROP FUNCTION IF EXISTS public.add_question_time(uuid, uuid, integer);
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
DECLARE
    v_attempt record;
BEGIN
    SELECT id, teacher_exam_id INTO v_attempt
      FROM public.attempts
     WHERE id = p_attempt_id AND user_id = auth.uid();
    IF v_attempt.id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    IF v_attempt.teacher_exam_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.teacher_exam_questions q
             WHERE q.id = p_question_id
               AND q.teacher_exam_id = v_attempt.teacher_exam_id
        ) THEN
            RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
        END IF;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM public.questions WHERE id = p_question_id) THEN
            RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
        END IF;
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

GRANT EXECUTE ON FUNCTION public.touch_question_visit(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_question_review(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_question_time(uuid, uuid, integer) TO authenticated;

COMMIT;
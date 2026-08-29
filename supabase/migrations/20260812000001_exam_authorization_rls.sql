-- =============================================================================
-- MIGRATION: Exam-path RPC hardening (SAFE SLICE — apply-now portion)
-- Date: 2026-08-12
--
-- SCOPE DECISION (2026-08-12 post-audit):
--   A live-DB read-only audit (policies / pg_proc ACLs / data) concluded that
--   the BE-1/BE-2 *content-isolation policies* must be DECOMMISSIONED from this
--   migration:
--     * exam_papers/exam_subjects/questions currently carry blanket policies
--       (`exam_papers_select_all`/`exam_subjects_select_all`/`questions_sel
--       _authenticated` = `USING true`) that OR over any new scoped policy, so
--       the RLS is neutralised until those legacy policies are dropped.
--     * 8 of 15 live `users` rows have `exam_selection = NULL`; enabling
--       isolation would lock them out until the data is backfilled.
--   Those pieces moved to 20260812000002_content_isolation_rls.sql (deferred).
--
-- THIS FILE only ships the parts the audit marked safe & effective against the
-- live database:
--   1. `is_exam_allowed_for_user` (authz helper consumed by the deferred
--      policies; creating it now is harmless).
--   2. Ownership guards INSIDE the five SECURITY DEFINER exam RPCs — the audit
--      confirmed all five currently grant `anon` EXECUTE (C2-class hole) and
--      that only `attempt.repository.ts` calls them, so the new
--      `attempts.user_id = auth.uid()` requirement cannot break the app. Live
--      data has 0/155 attempts with NULL user_id.
--   3. REVOKE PUBLIC/anon EXECUTE + GRANT authenticated on those RPCs.
--   4. question_counts: flip live view to security_invoker (if plain view) and
--      revoke anon SELECT. DDL not in repo -> idempotent existence checks.
--
-- Idempotent: every statement is DROP IF EXISTS / CREATE OR REPLACE guarded.
-- =============================================================================

-- ─── 1. Helper: per-selection authorization ─────────────────────────────────
-- Mirrors frontend getAllowedExamIds (APPSC/APPSC_GROUPS expand to the four
-- group ids; any other selection must match exactly). SECURITY DEFINER reads
-- only the caller's own users row, pinned search_path.
CREATE OR REPLACE FUNCTION public.is_exam_allowed_for_user(p_exam_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND (
        (u.exam_selection IN ('APPSC', 'APPSC_GROUPS')
         AND p_exam_id IN ('APPSC_GROUP_1', 'APPSC_GROUP_2', 'APPSC_GROUP_3', 'APPSC_GROUP_4'))
        OR
        (COALESCE(u.exam_selection, '') NOT IN ('APPSC', 'APPSC_GROUPS', 'all')
         AND p_exam_id = u.exam_selection)
      )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_exam_allowed_for_user(text) TO authenticated;

-- ─── 2. Ownership checks inside the exam-path SECURITY DEFINER RPCs ─────────
-- These functions bypass RLS (SECURITY DEFINER); without an internal check any
-- caller (audit confirmed: currently even anonymous) could read/write another
-- user's attempt. Each now requires attempts.user_id = auth.uid().
--
-- NOTE: the idempotency guard in submit_attempt runs AFTER this check so the
-- function never leaks attempts belonging to other users.

CREATE OR REPLACE FUNCTION public.touch_question_visit(
    p_attempt_id UUID,
    p_question_id UUID,
    p_correct_option TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.attempts
        WHERE id = p_attempt_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;
    INSERT INTO public.attempt_answers (
        attempt_id, question_id, correct_option,
        visited, last_visited_at,
        selected_option, is_correct, marks_awarded,
        time_spent_secs, marked_for_review
    ) VALUES (
        p_attempt_id, p_question_id, p_correct_option,
        true, now(),
        NULL, NULL, 0,
        0, false
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        visited = true,
        last_visited_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.set_question_answer(
    p_attempt_id UUID,
    p_question_id UUID,
    p_selected_option TEXT,
    p_correct_option TEXT,
    p_marks_per_question NUMERIC,
    p_negative_mark_value NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_correct BOOLEAN;
    v_marks_awarded NUMERIC;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.attempts
        WHERE id = p_attempt_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;
    v_is_correct := (p_selected_option IS NOT NULL AND p_selected_option = p_correct_option);
    v_marks_awarded := CASE
        WHEN p_selected_option IS NULL THEN 0
        WHEN v_is_correct THEN p_marks_per_question
        WHEN p_negative_mark_value > 0 THEN -p_negative_mark_value
        ELSE 0
    END;

    INSERT INTO public.attempt_answers (
        attempt_id, question_id, correct_option,
        selected_option, is_correct, marks_awarded
    ) VALUES (
        p_attempt_id, p_question_id, p_correct_option,
        p_selected_option,
        CASE WHEN p_selected_option IS NULL THEN NULL ELSE v_is_correct END,
        v_marks_awarded
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        selected_option = p_selected_option,
        is_correct = CASE WHEN p_selected_option IS NULL THEN NULL ELSE v_is_correct END,
        marks_awarded = v_marks_awarded;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_question_review(
    p_attempt_id UUID,
    p_question_id UUID,
    p_correct_option TEXT,
    p_marked BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.attempts
        WHERE id = p_attempt_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;
    INSERT INTO public.attempt_answers (
        attempt_id, question_id, correct_option,
        marked_for_review
    ) VALUES (
        p_attempt_id, p_question_id, p_correct_option,
        p_marked
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        marked_for_review = p_marked;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_question_time(
    p_attempt_id UUID,
    p_question_id UUID,
    p_correct_option TEXT,
    p_seconds NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.attempts
        WHERE id = p_attempt_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;
    INSERT INTO public.attempt_answers (
        attempt_id, question_id, correct_option,
        time_spent_secs
    ) VALUES (
        p_attempt_id, p_question_id, p_correct_option,
        p_seconds
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        time_spent_secs = attempt_answers.time_spent_secs + p_seconds;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_attempt(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id        UUID;
    v_exam_id        TEXT;
    v_paper_id       UUID;
    v_source         public.attempt_source;
    v_total_marks    NUMERIC;
    v_total_correct  INT;
    v_total_wrong    INT;
    v_total_skipped  INT;
    v_score          NUMERIC;
    v_accuracy       NUMERIC;
    v_duration       INT;
    v_submitted_at   TIMESTAMPTZ;
    v_existing_status TEXT;
    v_result         JSONB;
    v_total_questions INT;
BEGIN
    -- ── OWNERSHIP GUARD (must precede idempotency so no cross-user leak) ────
    IF NOT EXISTS (
        SELECT 1 FROM public.attempts
        WHERE id = p_attempt_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    -- ── IDEMPOTENCY GUARD ───────────────────────────────────────────────────
    -- If this attempt was already completed (e.g. a network retry hit us twice),
    -- return the existing result immediately without touching any data.
    SELECT status, score, correct_count, wrong_count, skipped_count, accuracy, duration_seconds,
           user_id, exam_id, paper_id, total_marks, source
    INTO   v_existing_status, v_score, v_total_correct, v_total_wrong, v_total_skipped,
           v_accuracy, v_duration,
           v_user_id, v_exam_id, v_paper_id, v_total_marks, v_source
    FROM   public.attempts
    WHERE  id = p_attempt_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt NOT FOUND with ID: %', p_attempt_id;
    END IF;

    IF v_existing_status = 'completed' THEN
        -- Return the previously computed result — safe, idempotent
        RETURN jsonb_build_object(
            'score',         ROUND(v_score, 2),
            'total_marks',   v_total_marks,
            'correct_count', v_total_correct,
            'wrong_count',   v_total_wrong,
            'skipped_count', v_total_skipped,
            'accuracy',      ROUND(v_accuracy, 2),
            'idempotent',    true
        );
    END IF;

    -- Get total questions from snapshot
    SELECT COALESCE(jsonb_array_length(questions_snapshot), 0)
    INTO v_total_questions
    FROM public.attempts
    WHERE id = p_attempt_id;

    -- ── CALCULATE SCORES ────────────────────────────────────────────────────
    SELECT
        COUNT(*) FILTER (WHERE is_correct = TRUE)  AS correct,
        COUNT(*) FILTER (WHERE is_correct = FALSE) AS wrong,
        COALESCE(SUM(marks_awarded), 0)             AS total_earned
    INTO v_total_correct, v_total_wrong, v_score
    FROM public.attempt_answers
    WHERE attempt_id = p_attempt_id;

    v_total_skipped := GREATEST(0, v_total_questions - v_total_correct - v_total_wrong);

    -- ── ACCURACY ─────────────────────────────────────────────────────────────
    IF (v_total_correct + v_total_wrong) > 0 THEN
        v_accuracy := (v_total_correct::NUMERIC / (v_total_correct + v_total_wrong)::NUMERIC) * 100;
    ELSE
        v_accuracy := 0;
    END IF;

    v_submitted_at := NOW();
    v_duration := EXTRACT(EPOCH FROM (
        v_submitted_at - (SELECT started_at FROM public.attempts WHERE id = p_attempt_id)
    ))::INT;

    -- ── UPDATE ATTEMPT RECORD ────────────────────────────────────────────────
    UPDATE public.attempts
    SET
        status          = 'completed',
        submitted_at    = v_submitted_at,
        score           = v_score,
        correct_count   = v_total_correct,
        wrong_count     = v_total_wrong,
        skipped_count   = v_total_skipped,
        accuracy        = ROUND(v_accuracy, 2),
        duration_seconds = v_duration
    WHERE id = p_attempt_id;

    -- ── LEADERBOARD UPSERT (best performance only) ───────────────────────────
    IF v_exam_id IS NOT NULL AND v_paper_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.exams WHERE exam_id = v_exam_id AND exam_type = 'main') THEN
            INSERT INTO public.leaderboard (
                user_id, exam_id, paper_id,
                best_score, best_accuracy, best_time_secs, best_submitted_at,
                attempt_count, updated_at
            )
            VALUES (
                v_user_id, v_exam_id, v_paper_id,
                v_score, ROUND(v_accuracy, 2), v_duration, v_submitted_at,
                1, NOW()
            )
            ON CONFLICT (user_id, exam_id, paper_id) DO UPDATE SET
                best_score = CASE
                    WHEN (EXCLUDED.best_score > leaderboard.best_score)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy > leaderboard.best_accuracy)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs < leaderboard.best_time_secs)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs = leaderboard.best_time_secs AND EXCLUDED.best_submitted_at < leaderboard.best_submitted_at)
                    THEN EXCLUDED.best_score
                    ELSE leaderboard.best_score
                END,
                best_accuracy = CASE
                    WHEN (EXCLUDED.best_score > leaderboard.best_score)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy > leaderboard.best_accuracy)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs < leaderboard.best_time_secs)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs = leaderboard.best_time_secs AND EXCLUDED.best_submitted_at < leaderboard.best_submitted_at)
                    THEN EXCLUDED.best_accuracy
                    ELSE leaderboard.best_accuracy
                END,
                best_time_secs = CASE
                    WHEN (EXCLUDED.best_score > leaderboard.best_score)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy > leaderboard.best_accuracy)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs < leaderboard.best_time_secs)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs = leaderboard.best_time_secs AND EXCLUDED.best_submitted_at < leaderboard.best_submitted_at)
                    THEN EXCLUDED.best_time_secs
                    ELSE leaderboard.best_time_secs
                END,
                best_submitted_at = CASE
                    WHEN (EXCLUDED.best_score > leaderboard.best_score)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy > leaderboard.best_accuracy)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs < leaderboard.best_time_secs)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs = leaderboard.best_time_secs AND EXCLUDED.best_submitted_at < leaderboard.best_submitted_at)
                    THEN EXCLUDED.best_submitted_at
                    ELSE leaderboard.best_submitted_at
                END,
                attempt_count = leaderboard.attempt_count + 1,
                updated_at    = NOW();
        END IF;
    END IF;

    -- ── RETURN RESULT ─────────────────────────────────────────────────────────
    v_result := jsonb_build_object(
        'score',         ROUND(v_score, 2),
        'total_marks',   v_total_marks,
        'correct_count', v_total_correct,
        'wrong_count',   v_total_wrong,
        'skipped_count', v_total_skipped,
        'accuracy',      ROUND(v_accuracy, 2),
        'idempotent',    false
    );

    RETURN v_result;
END;
$$;

-- ─── 3. Close the anonymous EXECUTE hole (audit C2 finding) ─────────────────
REVOKE EXECUTE ON FUNCTION public.touch_question_visit(uuid, uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_question_answer(uuid, uuid, text, text, numeric, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_question_review(uuid, uuid, text, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_question_time(uuid, uuid, text, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_attempt(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.touch_question_visit(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_question_answer(uuid, uuid, text, text, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_question_review(uuid, uuid, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_question_time(uuid, uuid, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_attempt(uuid) TO authenticated;

-- ─── 4. question_counts exposure (BE-4) ──────────────────────────────────────
-- APPLIED LIVE 2026-08-12 (project xbjhlfwqmcyatblsrhxn) and verified.
-- The live view's DDL was not in the repo (migration drift, backend audit M1);
-- pg_get_viewdef showed `SELECT exam_id, paper_id, subject_name,
-- count(*)::integer FROM questions GROUP BY exam_id, paper_id, subject_name`
-- with NO is_active filter and NO security_invoker. Replace with the
-- audit-required shape:
--   * WHERE is_active = true  -> counts only enabled questions (S4)
--   * security_invoker = on   -> counts respect the caller's RLS scope on
--     questions (student sees only their allowed exam counts) (S2)
--   * REVOKE anon SELECT      -> closes the public exposure (S4)
CREATE OR REPLACE VIEW public.question_counts AS
  SELECT exam_id,
         paper_id,
         subject_name,
         count(*)::integer AS count
  FROM public.questions
  WHERE is_active = true
  GROUP BY exam_id, paper_id, subject_name;

ALTER VIEW public.question_counts SET (security_invoker = on);

REVOKE SELECT ON public.question_counts FROM anon;

REVOKE EXECUTE ON FUNCTION public.is_exam_allowed_for_user(text) FROM PUBLIC, anon;
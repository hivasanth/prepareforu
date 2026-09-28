-- =============================================================================
-- MIGRATION: /topic-exams — security hardening, scoring integrity, isolation,
-- grant tightening, and migration-ledger reconciliation.
-- Date: 2026-08-12 (page audit remediation)
--
-- APPLIED LIVE on project xbjhlfwqmcyatblsrhxn.
--
-- Scope (each block is idempotent / DROP IF EXISTS-guarded):
--   A. set_question_answer / touch_question_visit / set_question_review /
--      add_question_time: derive correct_option from public.questions (server-side
--      source of truth). The p_correct_option parameter is preserved for
--      backward compatibility but ignored; the caller can still send it.
--   B. rls_exam_topics_user_select: scope exam_topics SELECT to the user's
--      exam_selection via is_exam_allowed_for_user(exam_id). Mirrors the
--      pattern established by migration 20260812000002 for exam_papers,
--      exam_subjects, questions.
--   C. public.topic_counts view: DB-side aggregate of active questions per
--      (exam_id, paper_id, subject_name, topic_en), security_invoker=on.
--      Replaces the client-side .limit(200) bug in fetchTopicCounts.
--   D. public.is_sub_admin(): pin search_path to 'public', 'pg_temp'.
--   E. Tighten anon DML grants on protected content tables (exam_configs,
--      exam_papers, exam_subjects, exam_topics, questions). SELECT preserved.
--   F. idx_questions_exam_paper_subject_topic composite index.
--   G. Migration ledger reconciliation: re-create live-only policies on
--      questions / exam_papers / exam_subjects / exam_configs that are
--      present on production but missing from local migration files, so a
--      fresh environment can reproduce the live state.
--
-- STOP conditions checked:
--   * Live NULL exam_selection users (8) are gated by AuthGuard before they
--     can reach this page; the same carve-out used by 20260812000002 is
--     preserved (admin/sub_admin arms in every policy).
--   * Backfill of questions.topic_en is NOT attempted here — the audit
--     flagged the lack of an authoritative source (49 rows in one subject,
--     7 candidate topics, no source-of-truth mapping). That is a data task
--     for the content/admin team and is tracked separately.
-- =============================================================================

-- ─── A. Scoring integrity: server-side correct_option lookup ────────────────
-- The previous implementation trusted the client-supplied p_correct_option
-- for both correctness and marks_awarded. The new implementation looks up
-- questions.correct_option inside the SECURITY DEFINER function, ignoring
-- the client-provided value. p_correct_option is retained in the signature
-- for backward compatibility (existing callers still send it).

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
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
    v_authoritative_correct TEXT;
    v_is_correct BOOLEAN;
    v_marks_awarded NUMERIC;
BEGIN
    -- OWNERSHIP GUARD (preserved).
    IF NOT EXISTS (
        SELECT 1 FROM public.attempts
        WHERE id = p_attempt_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    -- AUTHORITATIVE correct_option from the questions table.
    SELECT correct_option
    INTO v_authoritative_correct
    FROM public.questions
    WHERE id = p_question_id;

    IF v_authoritative_correct IS NULL THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
    END IF;

    v_is_correct := (p_selected_option IS NOT NULL AND p_selected_option = v_authoritative_correct);
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
        p_attempt_id, p_question_id, v_authoritative_correct,
        p_selected_option,
        CASE WHEN p_selected_option IS NULL THEN NULL ELSE v_is_correct END,
        v_marks_awarded
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        selected_option = EXCLUDED.selected_option,
        is_correct = EXCLUDED.is_correct,
        marks_awarded = EXCLUDED.marks_awarded;
END;
$$;

-- touch_question_visit: same approach — derive correct_option server-side.
CREATE OR REPLACE FUNCTION public.touch_question_visit(
    p_attempt_id UUID,
    p_question_id UUID,
    p_correct_option TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
    v_authoritative_correct TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.attempts
        WHERE id = p_attempt_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    SELECT correct_option
    INTO v_authoritative_correct
    FROM public.questions
    WHERE id = p_question_id;

    IF v_authoritative_correct IS NULL THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
    END IF;

    INSERT INTO public.attempt_answers (
        attempt_id, question_id, correct_option,
        visited, last_visited_at,
        selected_option, is_correct, marks_awarded,
        time_spent_secs, marked_for_review
    ) VALUES (
        p_attempt_id, p_question_id, v_authoritative_correct,
        true, now(),
        NULL, NULL, 0,
        0, false
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        visited = true,
        last_visited_at = now();
END;
$$;

-- set_question_review: same approach.
CREATE OR REPLACE FUNCTION public.set_question_review(
    p_attempt_id UUID,
    p_question_id UUID,
    p_correct_option TEXT,
    p_marked BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
    v_authoritative_correct TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.attempts
        WHERE id = p_attempt_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    SELECT correct_option
    INTO v_authoritative_correct
    FROM public.questions
    WHERE id = p_question_id;

    IF v_authoritative_correct IS NULL THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
    END IF;

    INSERT INTO public.attempt_answers (
        attempt_id, question_id, correct_option,
        marked_for_review
    ) VALUES (
        p_attempt_id, p_question_id, v_authoritative_correct,
        p_marked
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        marked_for_review = EXCLUDED.marked_for_review;
END;
$$;

-- add_question_time: same approach.
CREATE OR REPLACE FUNCTION public.add_question_time(
    p_attempt_id UUID,
    p_question_id UUID,
    p_correct_option TEXT,
    p_seconds NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
    v_authoritative_correct TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.attempts
        WHERE id = p_attempt_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    SELECT correct_option
    INTO v_authoritative_correct
    FROM public.questions
    WHERE id = p_question_id;

    IF v_authoritative_correct IS NULL THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
    END IF;

    INSERT INTO public.attempt_answers (
        attempt_id, question_id, correct_option,
        time_spent_secs
    ) VALUES (
        p_attempt_id, p_question_id, v_authoritative_correct,
        p_seconds
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        time_spent_secs = public.attempt_answers.time_spent_secs + EXCLUDED.time_spent_secs;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_question_answer(uuid, uuid, text, text, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_question_visit(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_question_review(uuid, uuid, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_question_time(uuid, uuid, text, numeric) TO authenticated;

-- ─── B. exam_topics RLS isolation ────────────────────────────────────────────
-- Replace blanket USING(true) with the same is_exam_allowed_for_user(exam_id)
-- pattern used by exam_papers / exam_subjects / questions.

DROP POLICY IF EXISTS exam_topics_read_authenticated ON public.exam_topics;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'rls_exam_topics_user_select' AND polrelid = 'public.exam_topics'::regclass
  ) THEN
CREATE POLICY rls_exam_topics_user_select
  ON public.exam_topics
  FOR SELECT
  TO authenticated
  USING (
    public.is_exam_allowed_for_user(exam_id)
    OR is_admin()
    OR is_sub_admin()
  );
  END IF;
END
$$;

-- ─── C. topic_counts view (DB-side aggregate, replaces client-side bug) ─────
-- Replaces the .limit(200) + JS-aggregation pattern with a true DB aggregate.
-- security_invoker=on ensures the caller's RLS scope on questions is applied.

CREATE OR REPLACE VIEW public.topic_counts AS
  SELECT exam_id,
         paper_id,
         subject_name,
         topic_en,
         count(*)::integer AS count
  FROM public.questions
  WHERE is_active = true
    AND topic_en IS NOT NULL
  GROUP BY exam_id, paper_id, subject_name, topic_en;

ALTER VIEW public.topic_counts SET (security_invoker = on);

REVOKE SELECT ON public.topic_counts FROM anon;
GRANT SELECT ON public.topic_counts TO authenticated;

-- ─── D. is_sub_admin search_path hardening ──────────────────────────────────
ALTER FUNCTION public.is_sub_admin() SET search_path = 'public', 'pg_temp';

-- ─── E. Tighten anon DML grants on content tables ───────────────────────────
-- anon retains SELECT (published exam_configs require it); INSERT/UPDATE/DELETE/
-- TRUNCATE/REFERENCES/TRIGGER are revoked. RLS already blocks these
-- functionally; this is least-privilege cleanup.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.exam_configs  FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.exam_papers   FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.exam_subjects FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.exam_topics   FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.questions     FROM anon;

-- ─── F. Composite index for topic queries ───────────────────────────────────
-- Query shape: .eq('subject_name').eq('topic_en').in('exam_id')
--              + optional .eq('paper_id'); idx_questions_exam_paper_subject
-- already covers exam_id+paper_id+subject_name; adding topic_en to the key
-- avoids a filter pass.

CREATE INDEX IF NOT EXISTS idx_questions_exam_paper_subject_topic
  ON public.questions (exam_id, paper_id, subject_name, topic_en);

-- ─── G. Migration ledger reconciliation ─────────────────────────────────────
-- The live DB has policies that are not present in any local migration file
-- (admin_full_access_v2, sub_admin_full_access_v2,
-- questions_select_admin_subadmin_v2, exam_configs_select_all,
-- exam_configs_write_admin, exam_papers_write_admin,
-- exam_subjects_write_admin). Each is DROP IF EXISTS + CREATE so this file is
-- replay-safe and authoritative for new environments.

DROP POLICY IF EXISTS admin_full_access_v2 ON public.questions;
DROP POLICY IF EXISTS questions_select_admin_subadmin_v2 ON public.questions;
DROP POLICY IF EXISTS sub_admin_full_access_v2 ON public.questions;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'admin_full_access_v2' AND polrelid = 'public.questions'::regclass
  ) THEN
CREATE POLICY admin_full_access_v2
  ON public.questions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'questions_select_admin_subadmin_v2' AND polrelid = 'public.questions'::regclass
  ) THEN
CREATE POLICY questions_select_admin_subadmin_v2
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.is_sub_admin());
  END IF;
END
$$;

CREATE POLICY sub_admin_full_access_v2
  ON public.questions
  FOR ALL
  TO authenticated
  USING (public.is_sub_admin())
  WITH CHECK (public.is_sub_admin());

DROP POLICY IF EXISTS exam_papers_write_admin ON public.exam_papers;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'exam_papers_write_admin' AND polrelid = 'public.exam_papers'::regclass
  ) THEN
CREATE POLICY exam_papers_write_admin
  ON public.exam_papers
  FOR ALL
  TO public
  USING (public.is_admin());
  END IF;
END
$$;

DROP POLICY IF EXISTS exam_subjects_write_admin ON public.exam_subjects;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'exam_subjects_write_admin' AND polrelid = 'public.exam_subjects'::regclass
  ) THEN
CREATE POLICY exam_subjects_write_admin
  ON public.exam_subjects
  FOR ALL
  TO public
  USING (public.is_admin());
  END IF;
END
$$;

DROP POLICY IF EXISTS exam_configs_select_all ON public.exam_configs;
DROP POLICY IF EXISTS exam_configs_write_admin ON public.exam_configs;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'exam_configs_select_all' AND polrelid = 'public.exam_configs'::regclass
  ) THEN
CREATE POLICY exam_configs_select_all
  ON public.exam_configs
  FOR SELECT
  TO public
  USING (is_published = true OR public.is_admin() OR public.is_sub_admin());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'exam_configs_write_admin' AND polrelid = 'public.exam_configs'::regclass
  ) THEN
CREATE POLICY exam_configs_write_admin
  ON public.exam_configs
  FOR ALL
  TO public
  USING (public.is_admin());
  END IF;
END
$$;
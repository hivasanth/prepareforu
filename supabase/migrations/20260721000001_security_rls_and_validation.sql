-- =============================================================================
-- MIGRATION: Security hardening — RLS for attempt_answers + exams tables
-- Date: 2026-07-21
--
-- Problem:
--   1. `attempt_answers` table has no RLS — any authenticated user can
--      read/write other users' exam answers via the Supabase client.
--   2. `exams` table has no RLS — any authenticated user can query all
--      exam data directly.
--
-- Fix:
--   1. Enable RLS on `attempt_answers` with policies:
--      - Admin: ALL operations
--      - User: SELECT/INSERT/UPDATE own rows (via attempts.user_id join)
--      - Sub-admin: SELECT rows for their students' attempts
--   2. Enable RLS on `exams` with policies:
--      - All authenticated users: SELECT (reference table)
--      - Admin: ALL operations (write via RPC only, but policy defends in depth)
-- =============================================================================


-- ─── 1. attempt_answers RLS ──────────────────────────────────────────────────

ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;

-- Admin: full access to all attempt answers
CREATE POLICY "rls_attempt_answers_admin_all"
ON public.attempt_answers
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL AND is_admin())
WITH CHECK (is_admin());

-- User: can read their own attempt answers (joined through attempts table)
CREATE POLICY "rls_attempt_answers_user_select"
ON public.attempt_answers
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.attempts a
    WHERE a.id = attempt_answers.attempt_id
      AND a.user_id = auth.uid()
  )
);

-- User: can insert/update their own attempt answers (for exam-taking flow)
-- The SECURITY DEFINER functions (touch_question_visit, set_question_answer, etc.)
-- bypass RLS, but this policy allows direct client access as a fallback.
CREATE POLICY "rls_attempt_answers_user_insert"
ON public.attempt_answers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.attempts a
    WHERE a.id = attempt_answers.attempt_id
      AND a.user_id = auth.uid()
  )
);

CREATE POLICY "rls_attempt_answers_user_update"
ON public.attempt_answers
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.attempts a
    WHERE a.id = attempt_answers.attempt_id
      AND a.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.attempts a
    WHERE a.id = attempt_answers.attempt_id
      AND a.user_id = auth.uid()
  )
);

-- Sub-admin: can read attempt answers for their students' attempts
CREATE POLICY "rls_attempt_answers_sub_admin_select"
ON public.attempt_answers
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND current_sub_admin_id() != '00000000-0000-0000-0000-000000000000'
  AND EXISTS (
    SELECT 1 FROM public.attempts a
    JOIN public.users u ON u.id = a.user_id
    JOIN public.sub_admins sa ON sa.id = u.educator_id
    WHERE a.id = attempt_answers.attempt_id
      AND sa.user_id = auth.uid()
  )
);


-- ─── 2. exams RLS ────────────────────────────────────────────────────────────

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- All authenticated users: can read exams (reference table for exam types)
CREATE POLICY "rls_exams_authenticated_select"
ON public.exams
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Admin: full access (write operations go through RPCs, but policy defends in depth)
CREATE POLICY "rls_exams_admin_all"
ON public.exams
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL AND is_admin())
WITH CHECK (is_admin());

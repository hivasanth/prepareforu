-- =============================================================================
-- MIGRATION: Grant sub-admins SELECT on attempt_answers for their own exams
-- Date: 2026-08-26
-- Page: /sub-admin/my-exams (F1 — HIGH, Question Analysis silent zeros)
--
-- CONTEXT:
--   LIVE attempt_answers RLS exposes only:
--     answers_select_own    (student sees own answers)
--     answers_select_admin  (is_admin())
--     answers_insert_own
--   There is NO sub-admin SELECT policy, so a sub-admin reading
--   attempt_answers for their own teacher exams receives ZERO rows with no
--   error. The My Exams evaluation pipeline therefore renders all-zero
--   question statistics as a success state.
--
--   NOTE ON HISTORY:
--   Local migration 20260721000001 defines an
--   rls_attempt_answers_sub_admin_select policy whose join
--   (sub_admins.id = users.educator_id) contradicts the LIVE educator-link
--   convention (users.educator_id stores sub_admins.user_id — see migration
--   20260622100000 comment and LIVE data). That historical migration is NOT
--   modified here. This migration adds the corrective policy using the SAME
--   ownership semantics already proven LIVE on public.attempts
--   ("attempts_select_subadmin": sub_admins.user_id = auth.uid()).
--
-- FIX:
--   Append-only: create "answers_select_subadmin" FOR SELECT TO authenticated.
--   Idempotent. No other policy, grant, or table is touched.
--
-- SECURITY:
--   - anon: still denied (auth.uid() IS NULL → EXISTS false).
--   - Sub-admin A: rows only for attempts on exams where
--     teacher_exams.sub_admin_id belongs to A (sub_admins.user_id = auth.uid()).
--   - Sub-admin B: cannot read A's answer rows.
--   - Admin: unaffected (answers_select_admin remains).
-- =============================================================================

DROP POLICY IF EXISTS "answers_select_subadmin" ON public.attempt_answers;

CREATE POLICY "answers_select_subadmin"
ON public.attempt_answers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.attempts a
    JOIN public.teacher_exams te
      ON te.id = a.teacher_exam_id
    WHERE a.id = attempt_answers.attempt_id
      AND te.sub_admin_id IN (
        SELECT sa.id
        FROM public.sub_admins sa
        WHERE sa.user_id = auth.uid()
      )
  )
);

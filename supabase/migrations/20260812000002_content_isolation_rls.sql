-- =============================================================================
-- MIGRATION: Content isolation for the three content tables (APPLIED LIVE)
-- Date: 2026-08-12
--
-- STATUS: APPLIED LIVE 2026-08-12 (project xbjhlfwqmcyatblsrhxn) and verified
-- via role-simulation matrix (anon denied / student scoped / admin-all /
-- sub-admin-all). Replay-safe: every policy is DROP IF EXISTS'd before its
-- CREATE POLICY.
--
-- SCOPE OF THE LIVE APPLICATION — DEVIATIONS from the original draft:
--   1. DATA GUARD: NOT applied. The draft's hard RAISE requires all users to
--      carry a known exam_selection. On live, 6 of 8 NULL-selection rows are
--      role 'user' (chinnammi, Test User, Test Admin, siva, delip, parvathi)
--      and are ALREADY gated by AuthGuard (redirect to /signup) — content
--      isolation does not newly lock them out. The other 2 NULL rows are
--      admins. No selection is invented for anyone (no data spool).
--   2. exam_configs: NOT applied. Live `exam_configs_select_all` is ALREADY
--      guarded (is_published OR is_admin OR is_sub_admin) — no permissive
--      policy to drop, no reopening needed.
--   3. attempts INSERT/UPDATE scope (BE-1/BE-3): NOT applied. Live attempts
--      carry exam_id = NULL for subject_test (138 rows) and teacher_exam
--      (1 row); the draft's `exam_id IS NOT NULL AND is_exam_allowed_for_user`
--      INSERT policy would break those flows. attempts stays on its existing
--      owner-scoped policies (attempts_insert_own / attempts_update_own /
--      rls_attempts_*), which the live test matrix confirmed still work.
--   4. Dead-capacity gate (§5): NOT applied — pending product classification
--      of how attempts are created.
--
-- What WAS applied (drop legacy permissive policies + scoped SELECT for
-- authenticated, admin/sub-admin override preserved):
--      exam_papers    : drop exam_papers_select_all (public, USING true)
--      exam_subjects  : drop exam_subjects_select_all (public, USING true)
--      questions      : drop questions_select_authenticated (authenticated,
--                       USING true)
--      + new rls_*_user_select policies (helper OR is_admin() OR is_sub_admin()).
-- Admin write paths are untouched (exam_papers_write_admin /
-- exam_subjects_write_admin / admin_full_access_v2 / sub_admin_full_access_v2).
-- =============================================================================

-- ─── 2. DROP legacy permissive policies that neutralise isolation ───────────
-- These are the live findings from the 2026-08-12 policy audit. Admin/sub-admin
-- access is preserved through their existing rls_*_admin_all / v2 policies and
-- via the explicit is_admin()/is_sub_admin() arms in the new policies below.

DROP POLICY IF EXISTS exam_papers_select_all       ON public.exam_papers;
DROP POLICY IF EXISTS exam_subjects_select_all     ON public.exam_subjects;
DROP POLICY IF EXISTS questions_select_authenticated ON public.questions;

-- ─── 3. STUDENT SELECT ISOLATION (BE-2) ─────────────────────────────────────
-- Scope: rows tied to the student's exam_selection, via public.
-- is_exam_allowed_for_user (20260812000001), with admin/sub-admin overrides
-- preserved.

DROP POLICY IF EXISTS rls_exam_papers_user_select   ON public.exam_papers;
DROP POLICY IF EXISTS rls_exam_subjects_user_select ON public.exam_subjects;
DROP POLICY IF EXISTS rls_questions_user_select     ON public.questions;

CREATE POLICY rls_exam_papers_user_select
  ON public.exam_papers
  FOR SELECT
  TO authenticated
  USING (
    public.is_exam_allowed_for_user(exam_id)
    OR is_admin()
    OR is_sub_admin()
  );

CREATE POLICY rls_exam_subjects_user_select
  ON public.exam_subjects
  FOR SELECT
  TO authenticated
  USING (
    public.is_exam_allowed_for_user(exam_id)
    OR is_admin()
    OR is_sub_admin()
  );

CREATE POLICY rls_questions_user_select
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (
    public.is_exam_allowed_for_user(exam_id)
    OR is_admin()
    OR is_sub_admin()
  );
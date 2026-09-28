-- ============================================================================
-- 20260917025937_reconcile_rls_drifts_and_student_visibility.sql
--
-- PURPOSE
--   Drives the LIVE Supabase project (xbjhlfwqmcyatblsrhxn) and the local
--   migration chain to a single canonical RLS/policy architecture for the
--   sub-admin dashboard page dependency set (users, attempts, teacher_exams).
--   This is the terminal post-audit reconciliation layer (LIVE DB + migration
--   sync + production readiness audit, dated 2026-09-17).
--
-- SCOPE (three reconciliation targets, one migration):
--
--   1. DRIFT-2 — users.rls_users_self_update
--      LIVE carries the recursive variant (self-referential scalar subqueries
--      on role/educator_id/is_active, introduced by 20260803000001), which
--      makes ANY direct authenticated self-UPDATE fail with:
--         42P17 infinite recursion detected in policy for relation "users"
--      The canonical terminal policy (20260813200000) is ownership-only.
--      Privilege-layer protection already exists on LIVE
--      (REVOKE UPDATE ON users FROM authenticated; column UPDATE only on
--      full_name/exam_selection/last_activity_date) plus SECURITY DEFINER
--      triggers (prevent_user_role_escalation / prevent_self_demotion /
--      prevent_last_admin_deactivation), so the ownership-only policy is safe.
--
--   2. DRIFT-1 — attempts.attempts_select_own (redundant duplicate)
--      20260902000001 created attempts_select_own (SELECT, user_id=auth.uid())
--      without realising 20260502 already provides rls_attempts_user_select
--      with the SAME predicate (plus the stronger auth.uid() IS NOT NULL).
--      Canonical architecture = ONE owned-select policy: rls_attempts_user_select.
--      attempts_select_own is dropped so LOCAL replay and LIVE converge with
--      zero overlapping ownership policies.
--
--   3. teacher_exams.rls_teacher_exams_student_select — broken authorization
--      The chain policy (20260502) checks sub_admins inside its own predicate,
--      but RLS on sub_admins filters that subquery for students (self-only),
--      so the EXISTS always fails -> linked students see 0 exams (verified
--      LIVE: student probe B5/P2 = 0 while the client fetches by sub_admin_id).
--      Not migration drift (chain == LIVE behavior); it is a design defect.
--      FIX: rewrite to use the canonical SECURITY DEFINER authorization gate
--      public._pf_teacher_exam_access(teacher_exams.id) (created 20260902120000,
--      approved + deployed) AND status = 'published' (the app lifecycle never
--      sets 'completed'; all live exams are published; drafts stay private).
--      No recursion: the helper runs as its definer and only returns a boolean.
--
--   4. Least-privilege (anon EXECUTE) hygiene.
--      current_sub_admin_id() and _pf_teacher_exam_access(uuid) are referenced
--      ONLY by TO authenticated policies (verified LIVE, 2026-09-17), so
--      REVOKE anon EXECUTE. is_admin()/is_sub_admin() KEEP PUBLIC EXECUTE by
--      explicit design (20260917000000): anon-facing content policies
--      (exam_configs_select_all etc.) call them.
--
-- IDEMPOTENT / SAFE: every policy change is DROP IF EXISTS + guarded CREATE;
-- re-running converges instead of erroring.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. DRIFT-2 — rls_users_self_update: ownership-only (canonical 20260813200000)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS rls_users_self_update ON public.users;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'rls_users_self_update' AND polrelid = 'public.users'::regclass
  ) THEN
CREATE POLICY "rls_users_self_update"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND id = auth.uid());
  END IF;
END
$$;

-- Structural guard: the canonical self-update policy must remain non-recursive
-- (no subquery self-reference inside USING/WITH CHECK). Mirrors TEST 8.1 of
-- 20260813200000. On failure, the migration aborts (keeps LIVE safe).
DO $$
DECLARE
  v_wc text;
BEGIN
  SELECT pg_get_expr(polwithcheck, polrelid) INTO v_wc
    FROM pg_policy
   WHERE polname = 'rls_users_self_update' AND polrelid = 'public.users'::regclass;
  IF v_wc IS NULL OR position('SELECT' in v_wc) > 0 OR position('users' in v_wc) > 0 THEN
    RAISE EXCEPTION 'GUARD-FAIL rls_users_self_update must be ownership-only and non-recursive; got: %', v_wc;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. DRIFT-1 — drop redundant attempts_select_own (canonical:
--    rls_attempts_user_select from 20260502, same predicate + uid IS NOT NULL)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS attempts_select_own ON public.attempts;

-- Structural guard: attempts must expose exactly ONE owned-select policy for
-- authenticated users (rls_attempts_user_select).
DO $$
DECLARE
  v_has_canonical int;
  v_has_dupe    int;
BEGIN
  SELECT count(*) INTO v_has_dupe FROM pg_policy
   WHERE polrelid = 'public.attempts'::regclass AND polname = 'attempts_select_own';
  IF v_has_dupe <> 0 THEN
    RAISE EXCEPTION 'GUARD-FAIL redundant attempts_select_own still present';
  END IF;
  SELECT count(*) INTO v_has_canonical FROM pg_policy
   WHERE polrelid = 'public.attempts'::regclass AND polname = 'rls_attempts_user_select';
  IF v_has_canonical <> 1 THEN
    RAISE EXCEPTION 'GUARD-FAIL canonical rls_attempts_user_select missing';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 3. teacher_exams student visibility — canonical authorization gate
--    (published only; drafts remain private)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS rls_teacher_exams_student_select ON public.teacher_exams;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'rls_teacher_exams_student_select' AND polrelid = 'public.teacher_exams'::regclass
  ) THEN
CREATE POLICY "rls_teacher_exams_student_select"
ON public.teacher_exams
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND status = 'published'::teacher_exam_status
  AND public._pf_teacher_exam_access(teacher_exams.id)
);
  END IF;
END
$$;

-- Structural guard: the student policy must be published-gated and route all
-- ownership through the canonical SECURITY DEFINER gate (no sub_admins join).
DO $$
DECLARE
  v_using text;
BEGIN
  SELECT pg_get_expr(polqual, polrelid) INTO v_using
    FROM pg_policy
   WHERE polname = 'rls_teacher_exams_student_select' AND polrelid = 'public.teacher_exams'::regclass;
  IF v_using IS NULL
     OR position('_pf_teacher_exam_access' in v_using) = 0
     OR position('published' in v_using) = 0
     OR position('sub_admins' in v_using) > 0 THEN
    RAISE EXCEPTION 'GUARD-FAIL rls_teacher_exams_student_select must use _pf_teacher_exam_access + status published; got: %', v_using;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 4. Least-privilege — anon EXECUTE hygiene (authenticated-only dependencies)
--    current_sub_admin_id() and _pf_teacher_exam_access(uuid) are referenced
--    ONLY by TO authenticated policies (verified LIVE, 2026-09-17): revoke
--    the default PUBLIC/anon grants. is_admin()/is_sub_admin() KEEP PUBLIC
--    EXECUTE by explicit design (20260917000000) — anon-facing content
--    policies (exam_configs_select_all etc.) call them. current_sub_admin_id()
--    is SECURITY DEFINER STABLE with search_path public,pg_temp and returns
--    only the caller's own sub-admin id (zeros when none), but least privilege
--    still removes PUBLIC (Postgres grants EXECUTE to PUBLIC by default).
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.current_sub_admin_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_sub_admin_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public._pf_teacher_exam_access(uuid) FROM anon;

COMMIT;
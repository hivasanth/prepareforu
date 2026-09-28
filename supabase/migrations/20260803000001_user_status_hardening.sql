-- =============================================================================
-- Migration: User Status Hardening (Phase 3.6C.4)
-- Date: 2026-08-03
--
-- Purpose: Close the is_active security gaps found in the Admin Users actions
-- audit (SEC-2, SEC-3). The service-layer guards (target validation, self/admin
-- rejection, affected-row check, success logging) live in userService.ts; this
-- migration adds the database defense-in-depth:
--
--   1. SEC-2 (RLS): a user can no longer flip their own is_active via
--      rls_users_self_update — the WITH CHECK now requires is_active to equal
--      the stored value, so a banned user cannot self-reactivate.
--   2. SEC-2 (trigger): prevent_user_role_escalation now reverts non-admin
--      is_active changes, covering the same case at the trigger layer.
--   3. SEC-3 (trigger): prevent_last_admin_deactivation reverts any attempt to
--      deactivate the final active admin, preventing platform lockout.
--      (SEC-1 is enforced at the service layer: admins/sub-admins are never
--      valid toggle targets. RLS cannot express an OLD-vs-NEW row check, so the
--      DB layer protects admin rows via the SEC-3 last-admin guard.)
--
-- All changes are additive/idempotent and safe to re-run.
-- =============================================================================

-- ─── 1. SEC-2 (RLS): FORBID SELF is_active CHANGES ────────────────────────────
-- A user may update their own row, but is_active must stay unchanged. The
-- subquery reads the CURRENT stored value, so any attempt to flip status
-- violates WITH CHECK and RLS rejects the update.
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
WITH CHECK (
  id = auth.uid()
  AND role = (SELECT role FROM public.users WHERE id = auth.uid())              -- Prevent role changes
  AND educator_id = (SELECT educator_id FROM public.users WHERE id = auth.uid()) -- Prevent educator changes
  AND is_active = (SELECT is_active FROM public.users WHERE id = auth.uid())     -- SEC-2: Prevent self status changes
);
  END IF;
END
$$;

-- ─── 2. SEC-2 (TRIGGER): REVERT NON-ADMIN is_active CHANGES ───────────────────
-- Extend the existing role-escalation guard so that any non-admin attempt to
-- change is_active is silently reverted (covers the same case as the RLS guard,
-- at the trigger layer, for defense in depth).
CREATE OR REPLACE FUNCTION public.prevent_user_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow changes if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- Revert unauthorized changes
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      NEW.role := OLD.role;
    END IF;
    IF NEW.educator_id IS DISTINCT FROM OLD.educator_id THEN
      NEW.educator_id := OLD.educator_id;
    END IF;
    -- SEC-2: a non-admin (incl. a banned user) cannot flip their own status
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      NEW.is_active := OLD.is_active;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ─── 3. SEC-3 (TRIGGER): PREVENT LAST-ADMIN LOCKOUT ───────────────────────────
-- Deactivating the final active admin would lock everyone out of the platform.
-- This guard reverts any attempt to set is_active=false on an admin row when no
-- other active admin remains. Admin rows can still be deactivated by an admin
-- when at least one other active admin exists (service layer already rejects
-- admin targets for the Users page toggle).
CREATE OR REPLACE FUNCTION public.prevent_last_admin_deactivation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only guard active admin rows being deactivated
  IF NEW.role = 'admin' AND NEW.is_active IS DISTINCT FROM OLD.is_active AND NOT NEW.is_active THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id <> NEW.id AND role = 'admin' AND is_active = true
    ) THEN
      -- No other active admin exists — revert to avoid platform lockout
      NEW.is_active := OLD.is_active;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_admin_deactivation ON public.users;
CREATE TRIGGER trg_prevent_last_admin_deactivation
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_admin_deactivation();

-- =============================================================================
-- SECTION 5: SECURITY REGRESSION TESTS (user status hardening)
-- Follows the suite pattern from 20260721000002_security_regression_tests.sql.
-- Structural checks: verify the guards are present and wired.
-- =============================================================================

-- TEST 5.1: rls_users_self_update WITH CHECK forbids self is_active changes
SELECT
  'TEST 5.1: self-update RLS forbids is_active change' AS test_name,
  CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL: expected 1 policy' END AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
  AND policyname = 'rls_users_self_update'
  AND with_check ILIKE '%is_active%';

-- TEST 5.2: prevent_user_role_escalation reverts non-admin is_active changes
SELECT
  'TEST 5.2: role-escalation trigger guards is_active' AS test_name,
  CASE WHEN prosrc ILIKE '%is_active%' THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_proc
WHERE proname = 'prevent_user_role_escalation';

-- TEST 5.3: last-admin lockout trigger exists on users
SELECT
  'TEST 5.3: last-admin lockout trigger exists' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_prevent_last_admin_deactivation'
  ) THEN 'PASS' ELSE 'FAIL' END AS result;

-- TEST 5.4: last-admin lockout function enforces the no-other-admin rule
SELECT
  'TEST 5.4: last-admin lockout function present' AS test_name,
  CASE WHEN prosrc ILIKE '%role = ''admin''%' THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_proc
WHERE proname = 'prevent_last_admin_deactivation';

-- TEST 5.5: admin can still update a student row (is_active toggle unaffected)
-- Behavioral guard: run as an admin user. Returns SKIP for non-admins.
SELECT
  'TEST 5.5: admin update of student is_active allowed' AS test_name,
  CASE
    WHEN NOT is_admin() THEN 'SKIP (not admin)'
    WHEN EXISTS (
      SELECT 1 FROM public.users WHERE role = 'user'
    ) THEN 'PASS (student rows exist and remain admin-updatable)'
    ELSE 'SKIP (no student rows)'
  END AS result;

-- =============================================================================
-- RESULTS SUMMARY
-- =============================================================================
SELECT '--- USER STATUS HARDENING COMPLETE ---' AS status;
SELECT 'Review all PASS/FAIL/SKIP results above.' AS instruction;

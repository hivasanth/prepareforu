-- ============================================================================
-- 20260917120000_myexams_remove_anon_execute_educator_exam_rpcs.sql
--
-- Scope: Sub-admin "My Exams" page dependency set (LIVE project
--        xbjhlfwqmcyatblsrhxn). Final targeted remediation, 2026-09-17.
--
-- Fix: LOW least-privilege gap found by the LIVE DB & MIGRATION AUDIT.
--
--   Before: anonymous EXECUTE remained on three body-gated educator RPCs
--           (live baseline: anon probe -> function EXECUTEs, body raises
--           400 P0001 UNAUTHORIZED_ACCESS). No data leak was demonstrated,
--           but least privilege requires denial at the EXECUTE layer itself.
--   After:  anon EXECUTE -> 401/42501 "permission denied for function".
--
--   authenticated / service_role behavior is NOT modified.
--   No function body, signature, or authorization logic is changed.
--   No replacement RPC is created (ONE canonical implementation rule).
--
-- validate_coupon(text) is intentionally public (pre-auth coupon flow) and
-- carries an explicit GRANT EXECUTE TO anon from 20260401000000. It is not
-- touched by this migration and remains anon-viable (guarded below).
--
-- Default-privilege hardening (defense-in-depth; aligned with chain
-- precedent 20260826000002 which already uses ALTER DEFAULT PRIVILEGES):
--   Future functions created in public by postgres will NOT automatically
--   inherit EXECUTE to anon. Any future intentionally public function must
--   GRANT EXECUTE ... TO anon transparently in its own migration. Existing
--   explicit grants are unaffected: ALTER DEFAULT PRIVILEGES only governs
--   objects created after the statement. pg_default_acl could not be read
--   offline (no psql/docker), so the behavioral control (anon 400 -> 401)
--   plus the role-scope grant above is the verification evidence.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Remove anonymous EXECUTE from the three educator RPCs (post-audit gap)
-- ---------------------------------------------------------------------------
REVOKE EXECUTE
  ON FUNCTION public.get_teacher_exam_questions(uuid)
  FROM anon;

REVOKE EXECUTE
  ON FUNCTION public.get_teacher_exam_review_questions(uuid)
  FROM anon;

REVOKE EXECUTE
  ON FUNCTION public.get_teacher_exam_leaderboard(uuid)
  FROM anon;

-- ---------------------------------------------------------------------------
-- 2. Structural guards (fail the migration, never silently drift LIVE)
--    - anon must NOT be able to EXECUTE (the actual fix)
--    - authenticated must NOT lose EXECUTE (no behavior regression)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_sigs text[] := ARRAY[
    'get_teacher_exam_questions(uuid)',
    'get_teacher_exam_review_questions(uuid)',
    'get_teacher_exam_leaderboard(uuid)'
  ];
  v_sig  text;
  v_priv boolean;
BEGIN
  FOREACH v_sig IN ARRAY v_sigs LOOP
    SELECT has_function_privilege('anon', 'public.' || v_sig, 'EXECUTE') INTO v_priv;
    IF v_priv THEN
      RAISE EXCEPTION 'GUARD-FAIL anon still has EXECUTE on %', v_sig;
    END IF;
    SELECT has_function_privilege('authenticated', 'public.' || v_sig, 'EXECUTE') INTO v_priv;
    IF NOT v_priv THEN
      RAISE EXCEPTION 'GUARD-FAIL authenticated lost EXECUTE on %', v_sig;
    END IF;
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- 3. Default-privilege hardening: future postgres-created public functions
--    must not silently inherit anon EXECUTE (defense-in-depth).
-- ---------------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- Guard: the intentionally public validate_coupon stays anon-EXECUTABLE.
DO $$
BEGIN
  IF has_function_privilege('anon', 'public.validate_coupon(text)', 'EXECUTE') IS NOT TRUE THEN
    RAISE EXCEPTION 'GUARD-FAIL validate_coupon must remain anon-EXECUTABLE';
  END IF;
END
$$;

COMMIT;
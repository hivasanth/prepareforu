-- =============================================================================
-- Migration: Delete Own Account RPC (backend-secured account deletion)
-- Date: 2026-09-01
--
-- Implements the /profile "Delete Account" action securely:
--
--   * AUTHORIZATION IS SERVER-SIDE ONLY — the function takes NO user-id
--     argument. The identity is resolved inside the function via
--     auth.uid() so a client can never delete a different user's data
--     (no IDOR / BOLA / no client-controlled user IDs).
--   * SECURITY DEFINER with an auth.uid() gate — mirrors the canonical
--     admin RPC pattern (20260813200000_profile_security_remediation.sql:
--     auth.uid() check inside the body). RLS is NOT weakened; the
--     function bypasses RLS only because it is the trusted owner context,
--     and it self-constrains to the invoking identity.
--   * NO service_role key in the frontend — the browser only calls
--     `delete_own_account()` over the public/anonymous-key Data API
--     using the signed-in session's JWT.
--   * Destructive-action semantics are enforced in the UI (confirmation
--     modal, never delete on first click); the backend additionally
--     refuses to run when shirt off / unauthenticated.
--
-- Cleanup scope (ownership-normalised to the invoking identity):
--   * attempts (user_id = auth.uid()) and their attempt_answers (child
--     rows keyed on attempt_id) — these tables are created OUT OF BAND in
--     production (no CREATE TABLE in migration history, verified by audit),
--     so each cleanup is guarded by a to_regclass existence check and run
--     through dynamic SQL. If a table is absent in a given environment the
--     RPC still succeeds — it simply cleans nothing for that table.
--   * leaderboard rows for the user (also out-of-band, guarded).
--   * public.users row (id = auth.uid()); this cascades ai_usage_limits
--     and ai_generation_logs (FK user_id -> public.users(id) ON DELETE
--     CASCADE) and notifications (FK user_id -> auth.users(id) ON DELETE
--     CASCADE).
--   * auth.users row itself — the account is truly terminated, not just
--     the profile row.
--
-- HOW NOT TO FIX (regressions to avoid):
--   * No client-supplied user id (p_user_id) parameter — identity is
--     resolved ONLY from auth.uid() inside the function.
--   * No weakening / wholesale removal of RLS.
--   * No service_role exposure to the frontend.
--   * No permissive TO PUBLIC execute — EXECUTE is revoked from PUBLIC
--     and granted ONLY to authenticated.
--   * No hard failure on absent out-of-band tables (guarded dynamic SQL).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. The SECURITY DEFINER RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_attempts_reg text := to_regclass('public.attempts');
  v_answers_reg  text := to_regclass('public.attempt_answers');
  v_leader_reg   text := to_regclass('public.leaderboard');
BEGIN
  -- Authorization gate: the invoking session must be authenticated. The
  -- identity is derived from auth.uid(), never from a client argument.
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Access denied.';
  END IF;

  -- 1. Child attempt answers before attempts (FK attempt_id -> attempts.id).
  --    Only run if BOTH the parent attempts and child attempt_answers exist.
  IF v_attempts_reg IS NOT NULL AND v_answers_reg IS NOT NULL THEN
    EXECUTE format(
      'DELETE FROM public.attempt_answers WHERE attempt_id IN (SELECT a.id FROM public.attempts a WHERE a.user_id = $1)',
      v_uid
    ) USING v_uid;
  END IF;

  -- 2. Attempts for the user (only if the table exists).
  IF v_attempts_reg IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.attempts WHERE user_id = $1' USING v_uid;
  END IF;

  -- 3. Leaderboard rows for the user (only if the table exists).
  IF v_leader_reg IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.leaderboard WHERE user_id = $1' USING v_uid;
  END IF;

  -- 4. Public profile row (id = users.id = auth.users.id). This cascades
  --    ai_usage_limits / ai_generation_logs / notifications via CASCADE FKs.
  DELETE FROM public.users WHERE id = v_uid;

  -- 5. Terminate the auth account. Under SECURITY DEFINER (owner context)
  --    this removes the auth.users row so the email can be re-registered.
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Least-privilege EXECUTE — authenticated only, never PUBLIC/anon.
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- =============================================================================
-- SECTION 3: STRUCTURAL REGRESSION TESTS
-- (Matches the suite pattern from 20260813200000_profile_security_remediation.sql;
--  behavioral probes must run live after deployment with SET ROLE authenticated.)
-- =============================================================================

-- TEST 3.1: function exists and is SECURITY DEFINER
SELECT
  'TEST 3.1: delete_own_account is SECURITY DEFINER' AS test_name,
  CASE WHEN prosecdef THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_proc
WHERE proname = 'delete_own_account';

-- TEST 3.2: function has NO uuid/any client-supplied argument parameter
SELECT
  'TEST 3.2: delete_own_account takes no parameters (no IDOR surface)' AS test_name,
  CASE WHEN pronargs = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_proc
WHERE proname = 'delete_own_account';

-- TEST 3.3: EXECUTE is granted to authenticated only (revoked from PUBLIC)
SELECT
  'TEST 3.3: EXECUTE granted to authenticated, revoked from PUBLIC' AS test_name,
  CASE WHEN
    (SELECT COUNT(*) FROM information_schema.routine_privileges
     WHERE routine_schema = 'public' AND routine_name = 'delete_own_account'
       AND grantee = 'authenticated' AND privilege_type = 'EXECUTE') = 1
    AND (SELECT COUNT(*) FROM information_schema.routine_privileges
         WHERE routine_schema = 'public' AND routine_name = 'delete_own_account'
           AND grantee = 'PUBLIC' AND privilege_type = 'EXECUTE') = 0
    THEN 'PASS' ELSE 'FAIL' END AS result;

-- TEST 3.4: the function body authorizes via auth.uid() and never trusts a param
SELECT
  'TEST 3.4: delete_own_account body uses auth.uid() gate' AS test_name,
  CASE WHEN prosrc LIKE '%auth.uid()%' AND prosrc NOT LIKE '%p_user_id%'
    THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_proc
WHERE proname = 'delete_own_account';

-- TEST 3.5: search_path is pinned to public (no search-path hijack)
SELECT
  'TEST 3.5: delete_own_account pins search_path to public' AS test_name,
  CASE WHEN proconfig @> ARRAY['search_path=public'] THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_proc
WHERE proname = 'delete_own_account';

-- TEST 3.6: out-of-band table cleanups are guarded with to_regclass (no hard
-- failure if attempts / attempt_answers / leaderboard are absent)
SELECT
  'TEST 3.6: out-of-band table cleanup is guarded (to_regclass)' AS test_name,
  CASE WHEN prosrc LIKE '%to_regclass%' THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_proc
WHERE proname = 'delete_own_account';

-- =============================================================================
-- RESULTS SUMMARY
-- =============================================================================
SELECT '--- DELETE OWN ACCOUNT RPC COMPLETE ---' AS status;
SELECT 'Review all PASS/FAIL results above; run the LIVE behavioral probe' AS instruction;

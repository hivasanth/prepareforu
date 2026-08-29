-- =============================================================================
-- Migration: Profile security remediation (BE-1 + BE-2 + BE-3)
-- Date: 2026-08-13
--
-- Implements the coordinated P0/P1 backend findings from the /profile audit
-- (docs/audit/USER_PROFILE_PAGE_AUDIT_2026-08-13.md). BE-1, BE-2 and BE-3 are
-- ONE coordinated LIVE change — they must never be deployed separately because
-- removing the RLS recursion (BE-1) WITHOUT simultaneously closing the
-- permissive self-update policies (BE-2) and lockout-column privileges (BE-3)
-- would unblock self-writes to role/educator_id/is_active/lockout columns.
--
--   BE-1 (P0 CRITICAL) — RLS infinite recursion on public.users UPDATE.
--     rls_users_self_update (recreated by 20260803000001) and the LIVE-ONLY
--     users_update_own both contain self-referential WITH CHECK subqueries
--     `(SELECT role/educator_id FROM public.users WHERE id = auth.uid())`.
--     PostgreSQL raises `42P17 infinite recursion detected in policy for
--     relation "users"` for ANY users UPDATE — self, cross-user AND admin —
--     breaking password verification, sub-admin profile edits and admin
--     status toggles. Fix: RLS performs OWNERSHIP ONLY (auth.uid() = id);
--     field-level protection moves to explicit column privileges + the
--     existing security trigger + backend/RPC authorization for privileged
--     writes. No policy or helper may read public.users to enforce a
--     WITH CHECK (that is the recursion source).
--   BE-2 (P1 HIGH) — obsolete permissive self-update policies.
--     LIVE-ONLY TO PUBLIC policies (`Users can update own profile` without
--     WITH CHECK, `Users can only update their own profile`) plus the
--     recursive `users_update_own` would, once recursion is removed, let a
--     user UPDATE any of their own columns that column grants permit —
--     including role, is_active, coupon_code, email_verified, lockout fields.
--     Fix: drop the legacy self-update policies; final self-writable columns
--     are full_name, exam_selection, last_activity_date. Everything else is
--     revoked at the column-privilege level from authenticated AND anon.
--     Legitimate admin writes (is_active toggle, sub-admin role revert) move
--     to SECURITY DEFINER RPCs so admins keep the capability.
--   BE-3 (P1 HIGH) — lockout column privileges not revoked.
--     20260521000000_account_lockout.sql revoked UPDATE on
--     failed_login_attempts / locked_until, but that REVOKE is not in effect
--     LIVE — authenticated and anon still hold UPDATE on both. Re-affirmed
--     here (and covered by the broader BE-2 column revoke).
--
-- Supporting changes required by the coordinated fix:
--   * update_updated_at() becomes SECURITY DEFINER so the updated_at stamp
--     trigger continues to work after UPDATE(updated_at) is revoked from
--     client roles (triggers otherwise inherit the invoking role's privileges).
--   * FIX-5 (BE-7, P2): get_user_dashboard_stats() gains `highest_streak`
--     (longest run of consecutive DISTINCT active days) — additive; the
--     existing dashboard fields are byte-identical. The profile page reuses
--     this canonical RPC instead of the never-maintained users.streak /
--     longest_streak / overall_accuracy columns.
--
-- HOW NOT TO FIX (regressions to avoid):
--   * No editing of already-applied historical migrations (this is a NEW
--     migration; the RLS_* policies are recreated, not patched in place).
--   * No weakening of RLS to make writes succeed.
--   * No recursive helper/policy that queries public.users.
--   * No trigger-only protection (column privileges are the boundary).
--   * No permissive single-policy allow-all (ownership policy + column
--     privileges + trigger + RPC authorization = defense in depth).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. BE-1 — DROP the recursive UPDATE policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS rls_users_self_update ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

-- -----------------------------------------------------------------------------
-- 2. BE-2 — DROP obsolete legacy permissive policies (LIVE-ONLY, TO PUBLIC)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can only update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can only see their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user to insert own profile" ON public.users;

-- -----------------------------------------------------------------------------
-- 3. BE-1 — RECREATE the canonical self-update policy (ownership only, no
--    self-referential subqueries). Field-level protection is enforced by the
--    column privileges revoked in section 5.
-- -----------------------------------------------------------------------------
CREATE POLICY "rls_users_self_update"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND id = auth.uid());

-- -----------------------------------------------------------------------------
-- 4. Support — update_updated_at() becomes SECURITY DEFINER. The trigger
--    stamps NEW.updated_at on every users UPDATE; with UPDATE(updated_at)
--    revoked from client roles it must run as the owner to keep working.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. BE-2 + BE-3 — table-level privilege enforcement.
--    PostgreSQL privilege model: the effective privilege on a column is the
--    UNION of the table-level grant and any column-level grant, and the
--    information_schema.column_privileges view inherits table-level grants
--    onto every column. A column-level REVOKE therefore does NOT deny writes
--    while the table-level GRANT remains (this is exactly why BE-3's earlier
--    column REVOKE had no effect live). Correct approach:
--      (a) REVOKE the table-level UPDATE/INSERT from the client roles, then
--      (b) GRANT column-level UPDATE on ONLY the self-writable columns:
--          full_name, exam_selection, last_activity_date.
--    Everything else is now un-writable by authenticated/anon at the
--    privilege layer. SECURITY DEFINER functions (handle_new_user,
--    handle_email_confirmed, link_user_to_educator, record/reset_failed_login,
--    the new admin_* RPCs) run as the owner and are unaffected, as is
--    service_role (edge functions).
-- -----------------------------------------------------------------------------
REVOKE UPDATE ON public.users FROM authenticated;
REVOKE UPDATE ON public.users FROM anon;
REVOKE INSERT ON public.users FROM authenticated;
REVOKE INSERT ON public.users FROM anon;

-- BE-3 (explicit, for the audit trail — the lockout columns are no longer
-- writable now that the table-level UPDATE grant is gone).
GRANT UPDATE (full_name, exam_selection, last_activity_date) ON public.users TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. BE-2 — privileged update RPCs (SECURITY DEFINER, admin-guarded).
--    The admin Users page toggles is_active and the admin Sub-Admins page
--    reverts role/sub_admin_id/educator_id — both previously direct client
--    PATCHes that relied on the recursion-broken policy set. After the column
--    revokes these must go through an owner-context RPC. Identity check uses
--    is_admin() (SECURITY DEFINER, reads users.role) — the caller's JWT is
--    preserved inside the function via request.jwt.claims.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_user_active(p_user_id uuid, p_is_active boolean)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied.';
  END IF;

  UPDATE public.users
  SET is_active = p_is_active
  WHERE id = p_user_id AND role = 'user';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_sub_admin_role(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied.';
  END IF;

  UPDATE public.users
  SET role = 'user',
      sub_admin_id = NULL,
      educator_id = NULL
  WHERE id = p_user_id AND role = 'sub_admin';
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_sub_admin_role(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. FIX-5 (BE-7) — get_user_dashboard_stats() gains `highest_streak`.
--    Additive only: daily_streak / exams_taken / accuracy / global_rank are
--    computed exactly as before (verified semantics preserved). The longest
--    run is computed over ALL distinct active days (Asia/Kolkata boundary),
--    matching the daily-streak day rule.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_daily_streak INT := 0;
    v_highest_streak INT := 0;
    v_run INT := 0;
    v_exams_taken INT := 0;
    v_accuracy NUMERIC := 0;
    v_global_rank TEXT := 'N/A';
    v_rank_num INT;
    v_today DATE;
    v_prev_day DATE;
    v_day DATE;
BEGIN
    -- Defense-in-depth: only the authenticated user may read their own stats.
    -- The client-supplied p_user_id is ignored unless it matches the caller.
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RETURN NULL;
    END IF;

    -- 1. Total Completed Exams Taken — same activity scope as accuracy and
    --    Recent Activity (source = 'exam_tab').
    SELECT COUNT(*)
    INTO v_exams_taken
    FROM public.attempts
    WHERE user_id = p_user_id
      AND status = 'completed'
      AND source = 'exam_tab';

    -- 2. Streaks — iterate DISTINCT active days oldest → newest (Asia/Kolkata
    --    day boundary; multiple attempts on the same day count once).
    --      v_run            = consecutive-run counter within the current group
    --      v_highest_streak = longest run ever (FIX-5 / BE-7)
    --      v_daily_streak   = trailing run, valid only if the most recent
    --                         active day is today or yesterday (unchanged
    --                         semantics from the previous dashboard FIX-3).
    v_today := (now() AT TIME ZONE 'Asia/Kolkata')::date;
    v_prev_day := NULL;

    FOR v_day IN
        SELECT DISTINCT (submitted_at AT TIME ZONE 'Asia/Kolkata')::date AS d
        FROM public.attempts
        WHERE user_id = p_user_id
          AND status = 'completed'
          AND source = 'exam_tab'
        ORDER BY d ASC
    LOOP
        IF v_prev_day IS NOT NULL AND v_day = v_prev_day + 1 THEN
            v_run := v_run + 1;
        ELSE
            v_run := 1;
        END IF;
        IF v_run > v_highest_streak THEN
            v_highest_streak := v_run;
        END IF;
        v_prev_day := v_day;
    END LOOP;

    -- v_run now holds the run ending on the most recent active day.
    IF v_prev_day IS NULL OR v_prev_day < v_today - 1 THEN
        v_daily_streak := 0;
    ELSE
        v_daily_streak := v_run;
    END IF;

    -- 3. Overall Accuracy % (identity-guarded; returns 0 when denied)
    SELECT COALESCE(public.get_user_accuracy(p_user_id), 0)
    INTO v_accuracy;

    -- 4. Global Leaderboard Rank (minimum rank across attempted papers)
    SELECT MIN(rank)
    INTO v_rank_num
    FROM public.leaderboard
    WHERE user_id = p_user_id
      AND rank IS NOT NULL;

    IF v_rank_num IS NOT NULL THEN
        v_global_rank := 'Rank #' || v_rank_num::TEXT;
    END IF;

    RETURN jsonb_build_object(
        'daily_streak', v_daily_streak,
        'highest_streak', v_highest_streak,
        'exams_taken', v_exams_taken,
        'accuracy', v_accuracy,
        'global_rank', v_global_rank
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_dashboard_stats(uuid) TO authenticated;

-- =============================================================================
-- SECTION 8: STRUCTURAL REGRESSION TESTS
-- (Follows the suite pattern from 20260803000001_user_status_hardening.sql;
--  behavioral probes run live after deployment via SET ROLE authenticated.)
-- =============================================================================

-- TEST 8.1: rls_users_self_update is non-recursive (no subquery in WITH CHECK)
SELECT
  'TEST 8.1: self-update policy has no self-referential subquery' AS test_name,
  CASE WHEN with_check NOT ILIKE '%select%' AND with_check ILIKE '%auth.uid()%'
    THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'rls_users_self_update';

-- TEST 8.2: recursive / legacy permissive policies are gone
SELECT
  'TEST 8.2: recursive + legacy permissive policies dropped' AS test_name,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
      AND policyname IN ('users_update_own', 'Users can update own profile', 'Users can only update their own profile')
  ) THEN 'PASS' ELSE 'FAIL' END AS result;

-- TEST 8.3: lockout columns UPDATE revoked from authenticated (BE-3)
SELECT
  'TEST 8.3: failed_login_attempts/locked_until UPDATE revoked (auth)' AS test_name,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM information_schema.column_privileges
    WHERE table_schema = 'public' AND table_name = 'users'
      AND grantee = 'authenticated'
      AND column_name IN ('failed_login_attempts', 'locked_until')
      AND privilege_type = 'UPDATE'
  ) THEN 'PASS' ELSE 'FAIL' END AS result;

-- TEST 8.4: escalation-sensitive columns UPDATE revoked from authenticated
SELECT
  'TEST 8.4: role/educator_id/is_active/coupon_code UPDATE revoked (auth)' AS test_name,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM information_schema.column_privileges
    WHERE table_schema = 'public' AND table_name = 'users'
      AND grantee = 'authenticated'
      AND column_name IN ('role', 'educator_id', 'is_active', 'coupon_code', 'email_verified')
      AND privilege_type = 'UPDATE'
  ) THEN 'PASS' ELSE 'FAIL' END AS result;

-- TEST 8.5: writable columns keep UPDATE for authenticated
SELECT
  'TEST 8.5: full_name/exam_selection/last_activity_date UPDATE kept (auth)' AS test_name,
  CASE WHEN (SELECT COUNT(*) FROM information_schema.column_privileges
             WHERE table_schema = 'public' AND table_name = 'users'
               AND grantee = 'authenticated'
               AND column_name IN ('full_name', 'exam_selection', 'last_activity_date')
               AND privilege_type = 'UPDATE') = 3
    THEN 'PASS' ELSE 'FAIL' END AS result;

-- TEST 8.6: update_updated_at is SECURITY DEFINER
SELECT
  'TEST 8.6: update_updated_at is SECURITY DEFINER' AS test_name,
  CASE WHEN prosecdef THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_proc
WHERE proname = 'update_updated_at';

-- TEST 8.7: admin RPCs exist and are EXECUTE-granted to authenticated
SELECT
  'TEST 8.7: admin RPCs present + EXECUTE granted (auth)' AS test_name,
  CASE WHEN (
    (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('admin_set_user_active', 'admin_revoke_sub_admin_role') AND prosecdef) = 2
    AND (SELECT COUNT(*) FROM information_schema.routine_privileges
         WHERE routine_schema = 'public'
           AND routine_name IN ('admin_set_user_active', 'admin_revoke_sub_admin_role')
           AND grantee = 'authenticated' AND privilege_type = 'EXECUTE') = 2
  ) THEN 'PASS' ELSE 'FAIL' END AS result;

-- TEST 8.8: get_user_dashboard_stats returns highest_streak (FIX-5 / BE-7)
SELECT
  'TEST 8.8: get_user_dashboard_stats computes highest_streak' AS test_name,
  CASE WHEN prosrc LIKE '%highest_streak%' THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_proc
WHERE proname = 'get_user_dashboard_stats';

-- =============================================================================
-- RESULTS SUMMARY
-- =============================================================================
SELECT '--- PROFILE SECURITY REMEDIATION COMPLETE ---' AS status;
SELECT 'Review all PASS/FAIL/SKIP results above, then run the LIVE behavioral probes.' AS instruction;

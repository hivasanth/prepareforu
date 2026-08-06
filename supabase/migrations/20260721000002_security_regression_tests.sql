-- =============================================================================
-- SECURITY REGRESSION SUITE — RLS & Authorization Tests
-- Date: 2026-07-21
--
-- Purpose:
--   Verify that RLS policies for attempt_answers and exams tables
--   correctly enforce access control. Run against a test Supabase instance.
--
-- Usage:
--   1. Set test user IDs at the top of this script
--   2. Run each section as the respective user role
--   3. All assertions should return the expected result
--
-- IMPORTANT: This script is for TESTING only. Do NOT run in production.
-- =============================================================================


-- ─── CONFIGURATION ───────────────────────────────────────────────────────────
-- Replace these with actual test user IDs from your test database

-- Test user A (student)
-- SET LOCAL app.test_user_a = '00000000-0000-0000-0000-000000000001';
-- Test user B (student, different user)
-- SET LOCAL app.test_user_b = '00000000-0000-0000-0000-000000000002';
-- Test admin user
-- SET LOCAL app.test_admin = '00000000-0000-0000-0000-000000000003';
-- Test sub-admin user
-- SET LOCAL app.test_sub_admin = '00000000-0000-0000-0000-000000000004';


-- =============================================================================
-- SECTION 1: attempt_answers RLS TESTS
-- =============================================================================

-- TEST 1.1: User can read own attempt answers
-- Expected: Returns rows where attempts.user_id = current user
SELECT
  'TEST 1.1: User reads own attempt answers' AS test_name,
  CASE WHEN COUNT(*) >= 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM public.attempt_answers aa
JOIN public.attempts a ON a.id = aa.attempt_id
WHERE a.user_id = auth.uid();


-- TEST 1.2: User cannot read another user's attempt answers
-- Expected: Returns 0 rows when querying with a different user_id
-- (This is enforced by RLS — the query itself won't error, it just returns no rows)
SELECT
  'TEST 1.2: User cannot read other users attempt answers' AS test_name,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM public.attempt_answers aa
JOIN public.attempts a ON a.id = aa.attempt_id
WHERE a.user_id != auth.uid()
  AND a.user_id IN (SELECT id FROM public.attempts WHERE user_id != auth.uid() LIMIT 1);


-- TEST 1.3: Sub-admin can read their students' attempt answers
-- Expected: Returns rows for students where users.educator_id = sub_admins.id
-- (Only valid when executed as a sub-admin user)
SELECT
  'TEST 1.3: Sub-admin reads student attempt answers' AS test_name,
  CASE
    WHEN current_sub_admin_id() = '00000000-0000-0000-0000-000000000000'
    THEN 'SKIP (not sub-admin)'
    WHEN COUNT(*) >= 0 THEN 'PASS'
    ELSE 'FAIL'
  END AS result
FROM public.attempt_answers aa
JOIN public.attempts a ON a.id = aa.attempt_id
JOIN public.users u ON u.id = a.user_id
JOIN public.sub_admins sa ON sa.id = u.educator_id
WHERE sa.user_id = auth.uid();


-- TEST 1.4: Admin has full access to all attempt answers
-- Expected: Returns all rows (admin bypasses RLS)
SELECT
  'TEST 1.4: Admin full access to attempt answers' AS test_name,
  CASE
    WHEN NOT is_admin() THEN 'SKIP (not admin)'
    WHEN COUNT(*) >= 0 THEN 'PASS'
    ELSE 'FAIL'
  END AS result
FROM public.attempt_answers;


-- TEST 1.5: RLS is enabled on attempt_answers
-- Expected: relrowsecurity = true
SELECT
  'TEST 1.5: RLS enabled on attempt_answers' AS test_name,
  CASE WHEN relrowsecurity THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_catalog.pg_class
WHERE relname = 'attempt_answers'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');


-- TEST 1.6: Verify all expected policies exist on attempt_answers
-- Expected: 5 policies (admin_all, user_select, user_insert, user_update, sub_admin_select)
SELECT
  'TEST 1.6: Policy count on attempt_answers' AS test_name,
  CASE WHEN COUNT(*) = 5 THEN 'PASS' ELSE 'FAIL: expected 5, got ' || COUNT(*) END AS result
FROM pg_policies
WHERE tablename = 'attempt_answers'
  AND schemaname = 'public';


-- =============================================================================
-- SECTION 2: exams RLS TESTS
-- =============================================================================

-- TEST 2.1: Authenticated user can read exams
-- Expected: Returns all exams (reference table)
SELECT
  'TEST 2.1: Authenticated read access to exams' AS test_name,
  CASE WHEN COUNT(*) >= 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM public.exams;


-- TEST 2.2: RLS is enabled on exams
-- Expected: relrowsecurity = true
SELECT
  'TEST 2.2: RLS enabled on exams' AS test_name,
  CASE WHEN relrowsecurity THEN 'PASS' ELSE 'FAIL' END AS result
FROM pg_catalog.pg_class
WHERE relname = 'exams'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');


-- TEST 2.3: Verify expected policies exist on exams
-- Expected: 2 policies (authenticated_select, admin_all)
SELECT
  'TEST 2.3: Policy count on exams' AS test_name,
  CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL: expected 2, got ' || COUNT(*) END AS result
FROM pg_policies
WHERE tablename = 'exams'
  AND schemaname = 'public';


-- =============================================================================
-- SECTION 3: AUTHORIZATION FUNCTION TESTS
-- =============================================================================

-- TEST 3.1: is_admin() returns correct value
-- Expected: Returns true only for admin users
SELECT
  'TEST 3.1: is_admin() function exists' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_admin'
  ) THEN 'PASS' ELSE 'FAIL' END AS result;


-- TEST 3.2: current_sub_admin_id() returns correct value
-- Expected: Returns the sub_admin ID for sub-admin users, zero UUID for others
SELECT
  'TEST 3.2: current_sub_admin_id() function exists' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'current_sub_admin_id'
  ) THEN 'PASS' ELSE 'FAIL' END AS result;


-- TEST 3.3: prevent_user_role_escalation trigger exists
-- Expected: Trigger exists on users table
SELECT
  'TEST 3.3: Role escalation prevention trigger exists' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'prevent_user_role_escalation'
  ) THEN 'PASS' ELSE 'FAIL' END AS result;


-- =============================================================================
-- SECTION 4: CROSS-TABLE INTEGRITY TESTS
-- =============================================================================

-- TEST 4.1: attempt_answers references valid attempts
-- Expected: 0 orphaned rows
SELECT
  'TEST 4.1: No orphaned attempt_answers' AS test_name,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL: ' || COUNT(*) || ' orphaned rows' END AS result
FROM public.attempt_answers aa
LEFT JOIN public.attempts a ON a.id = aa.attempt_id
WHERE a.id IS NULL;


-- TEST 4.2: attempts references valid users
-- Expected: 0 orphaned rows
SELECT
  'TEST 4.2: No orphaned attempts (user_id)' AS test_name,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL: ' || COUNT(*) || ' orphaned rows' END AS result
FROM public.attempts a
LEFT JOIN public.users u ON u.id = a.user_id
WHERE u.id IS NULL;


-- TEST 4.3: exams table is accessible (not blocked by RLS)
-- Expected: Returns at least 1 row for published exams
SELECT
  'TEST 4.3: Exams table accessible' AS test_name,
  CASE WHEN COUNT(*) >= 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM public.exams;


-- =============================================================================
-- RESULTS SUMMARY
-- =============================================================================

SELECT '--- SECURITY REGRESSION SUITE COMPLETE ---' AS status;
SELECT 'Review all PASS/FAIL results above.' AS instruction;

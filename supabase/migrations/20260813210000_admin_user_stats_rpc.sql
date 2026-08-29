-- =============================================================================
-- MIGRATION: Admin batch user stats RPC + shared canonical streak helper
-- Date:       2026-08-13
-- Context:    /profile final follow-up — streak/longest_streak schema debt.
--
-- Purpose:
--   * Extract the ONE canonical streak computation (the attempts-based
--     algorithm behind get_user_dashboard_stats) into a shared internal helper
--     so /profile, /dashboard, and the Admin Users page share a single
--     business definition. No second streak algorithm is introduced.
--   * Refactor get_user_dashboard_stats to consume the helper. Output contract
--     is byte-identical (daily_streak / highest_streak / exams_taken /
--     accuracy / global_rank); the identity guard stays inside the function.
--   * Add get_admin_user_stats(uuid[]) — a secure batch RPC for the Admin
--     Users page. It returns canonical daily_streak / highest_streak /
--     exams_taken for a page of users in ONE call (no N+1), so the page stops
--     reading the never-maintained users.streak / users.total_exams columns.
--     Server-side authorization: authenticated admin (any student) or
--     authenticated sub_admin (only students linked via users.editor_id =
--     auth.uid(), matching the sub-admin students page scope). Only rows with
--     role='user' are ever returned.
--   * The columns users.streak / users.longest_streak are dropped in a
--     FOLLOW-UP migration once the frontend no longer selects them.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Shared canonical streak computation (SECURITY INVOKER — deliberately NO
--    auth boundary here; callers authorize first). Execute is revoked from
--    PUBLIC / anon / authenticated / service_role so it can never be invoked
--    directly — only from the SECURITY DEFINER admin RPC or the identity-
--    guarded get_user_dashboard_stats (both run as owner).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_streak_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_daily_streak INT := 0;
    v_highest_streak INT := 0;
    v_run INT := 0;
    v_exams_taken INT := 0;
    v_today DATE;
    v_prev_day DATE;
    v_day DATE;
BEGIN
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
    --      v_daily_streak   = trailing run, valid only if the most recent
    --                         active day is today or yesterday
    --      v_highest_streak = longest run ever
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

    RETURN jsonb_build_object(
        'daily_streak', v_daily_streak,
        'highest_streak', v_highest_streak,
        'exams_taken', v_exams_taken
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_streak_stats(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_streak_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_streak_stats(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_streak_stats(uuid) FROM service_role;

-- -----------------------------------------------------------------------------
-- 2. get_user_dashboard_stats — refactored to consume the shared helper.
--    Output contract identical to the previously verified version.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stats jsonb;
    v_accuracy NUMERIC := 0;
    v_global_rank TEXT := 'N/A';
    v_rank_num INT;
BEGIN
    -- Defense-in-depth: only the authenticated user may read their own stats.
    -- The client-supplied p_user_id is ignored unless it matches the caller.
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RETURN NULL;
    END IF;

    v_stats := public.get_user_streak_stats(p_user_id);

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
        'daily_streak', (v_stats->>'daily_streak')::int,
        'highest_streak', (v_stats->>'highest_streak')::int,
        'exams_taken', (v_stats->>'exams_taken')::int,
        'accuracy', v_accuracy,
        'global_rank', v_global_rank
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_dashboard_stats(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. Admin batch stats RPC.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_user_stats(p_user_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_role text;
    v_stats jsonb;
    v_result jsonb := '[]'::jsonb;
    v_row record;
    v_input_len int;
BEGIN
    -- Authorization is server-side only; never trust the client.
    IF auth.uid() IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    SELECT role INTO v_caller_role
    FROM public.users
    WHERE id = auth.uid();

    IF v_caller_role IS DISTINCT FROM 'admin' AND v_caller_role IS DISTINCT FROM 'sub_admin' THEN
        RETURN '[]'::jsonb;
    END IF;

    v_input_len := COALESCE(array_length(p_user_ids, 1), 0);
    IF v_input_len > 200 THEN
        RAISE EXCEPTION 'Too many user ids (max 200)';
    END IF;

    FOR v_row IN
        SELECT u.id AS user_id
        FROM public.users u
        WHERE u.id = ANY(p_user_ids)
          AND u.role = 'user'
          AND (v_caller_role = 'admin' OR u.educator_id = auth.uid())
    LOOP
        v_stats := public.get_user_streak_stats(v_row.user_id);
        v_result := v_result || jsonb_build_array(
            jsonb_build_object(
                'user_id', v_row.user_id,
                'daily_streak', (v_stats->>'daily_streak')::int,
                'highest_streak', (v_stats->>'highest_streak')::int,
                'exams_taken', (v_stats->>'exams_taken')::int
            )
        );
    END LOOP;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_user_stats(uuid[]) TO authenticated;

-- =============================================================================
-- SECTION 4: STRUCTURAL REGRESSION TESTS
-- (Suite pattern from 20260803000001_user_status_hardening.sql; behavioral
--  probes run live after deployment via SET ROLE authenticated.)
-- =============================================================================

-- TEST 4.1: get_user_streak_stats helper exists
SELECT
  'TEST 4.1: get_user_streak_stats helper exists' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_user_streak_stats'
  ) THEN 'PASS' ELSE 'FAIL' END AS result;

-- TEST 4.2: helper is SECURITY INVOKER (no blanket privilege widening)
SELECT
  'TEST 4.2: helper is SECURITY INVOKER' AS test_name,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_user_streak_stats' AND prosecdef
  ) THEN 'PASS' ELSE 'FAIL' END AS result;

-- TEST 4.3: helper execute revoked from public/anon/authenticated
SELECT
  'TEST 4.3: helper not directly executable' AS test_name,
  CASE WHEN NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'get_user_streak_stats'
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) THEN 'PASS' ELSE 'FAIL' END AS result;

-- TEST 4.4: get_admin_user_stats exists, SECURITY DEFINER, guarded search_path
SELECT
  'TEST 4.4: admin stats RPC defined + SECURITY DEFINER' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'get_admin_user_stats'
      AND p.prosecdef
      AND pg_get_functiondef(p.oid) LIKE '%SET search_path TO ''public''%'
  ) THEN 'PASS' ELSE 'FAIL' END AS result;

-- TEST 4.5: admin stats RPC grants to authenticated
SELECT
  'TEST 4.5: admin stats RPC grant to authenticated' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.proname = 'get_admin_user_stats'
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) THEN 'PASS' ELSE 'FAIL' END AS result;

-- TEST 4.6: get_user_dashboard_stats consumes the shared helper (no duplicate
--           streak algorithm / no users.streak dependency)
SELECT
  'TEST 4.6: dashboard RPC uses helper, no users.streak' AS test_name,
  CASE WHEN (
    pg_get_functiondef('public.get_user_dashboard_stats(uuid)'::regprocedure) LIKE '%get_user_streak_stats%'
    AND pg_get_functiondef('public.get_user_dashboard_stats(uuid)'::regprocedure) NOT ILIKE '%users.streak%'
  ) THEN 'PASS' ELSE 'FAIL' END AS result;

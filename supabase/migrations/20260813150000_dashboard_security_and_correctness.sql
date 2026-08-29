-- =============================================================================
-- Migration: Dashboard security & correctness remediation
-- Date: 2026-08-13
--
-- Fixes from the /dashboard full-stack audit:
--
-- FIX-1 (P1 security) — get_user_accuracy(uuid)
--   * SECURITY DEFINER function previously trusted a client-supplied
--     p_user_id with no auth.uid() check and was EXECUTE-granted to PUBLIC
--     and anon → any unauthenticated caller could read any user's aggregate
--     exam accuracy. Now the function enforces identity itself (RLS is
--     bypassed by SECURITY DEFINER and cannot be the boundary), and execution
--     is revoked from PUBLIC / anon / authenticated / service_role. It is
--     backend-internal only — its sole caller is get_user_dashboard_stats(),
--     which is itself SECURITY DEFINER and runs as the owner.
-- FIX-2 (P2 data correctness) — get_user_dashboard_stats exams_taken
--   * The count previously included ALL status='completed' attempts regardless
--     of source (live: 48) while accuracy and Recent Activity are scoped to
--     source='exam_tab' (live: 13) → inconsistent dashboard. The count now
--     uses the same exam_tab scope as accuracy and recent activity.
-- FIX-3 (P2 data correctness) — get_user_dashboard_stats daily_streak
--   * The streak previously read users.streak, which is never maintained
--     anywhere (app or migrations) → permanently 0. It is now computed from
--     the user's completed exam_tab activity: the length of the trailing run
--     of consecutive DISTINCT active days, where the most recent active day
--     must be today or yesterday (otherwise the streak is broken → 0).
--     Multiple attempts on the same day count once. Day boundary: Asia/Kolkata
--     (product audience is India; no per-user timezone is stored; timestamps
--     are stored as timestamptz).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FIX-1 — secure get_user_accuracy(uuid)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_accuracy(p_user_id uuid)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_accuracy NUMERIC;
BEGIN
    -- Identity enforcement inside the SECURITY DEFINER boundary.
    -- RLS is bypassed here, so the function itself must authorize.
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RETURN 0;
    END IF;

    SELECT CASE
        WHEN SUM(correct_count + wrong_count) = 0 THEN 0
        ELSE ROUND(
            SUM(correct_count)::NUMERIC /
            SUM(correct_count + wrong_count)::NUMERIC * 100,
            2
        )
    END
    INTO v_accuracy
    FROM public.attempts
    WHERE user_id = p_user_id
      AND status  = 'completed'
      AND source  = 'exam_tab';

    RETURN v_accuracy;
END;
$$;

-- Backend-internal only: no PostgREST-visible role may execute it.
REVOKE EXECUTE ON FUNCTION public.get_user_accuracy(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_accuracy(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_accuracy(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_accuracy(uuid) FROM service_role;

-- -----------------------------------------------------------------------------
-- 2 & 3. FIX-2 + FIX-3 — corrected get_user_dashboard_stats(uuid)
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

    -- 2. Daily Streak — trailing run of consecutive DISTINCT active days
    --    (Asia/Kolkata day boundary). Most recent active day must be today or
    --    yesterday; multiple attempts on the same day count once.
    v_today := (now() AT TIME ZONE 'Asia/Kolkata')::date;
    v_prev_day := NULL;

    FOR v_day IN
        SELECT DISTINCT (submitted_at AT TIME ZONE 'Asia/Kolkata')::date AS d
        FROM public.attempts
        WHERE user_id = p_user_id
          AND status = 'completed'
          AND source = 'exam_tab'
        ORDER BY d DESC
    LOOP
        IF v_daily_streak = 0 THEN
            IF v_day < v_today - 1 THEN
                EXIT;
            END IF;
            v_daily_streak := 1;
        ELSIF v_day = v_prev_day - 1 THEN
            v_daily_streak := v_daily_streak + 1;
        ELSE
            EXIT;
        END IF;
        v_prev_day := v_day;
    END LOOP;

    -- 3. Overall Accuracy % (now identity-guarded; returns 0 when denied)
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

    -- Return JSON payload structured as expected by dashboardRepo / dashboardService
    RETURN jsonb_build_object(
        'daily_streak', v_daily_streak,
        'exams_taken', v_exams_taken,
        'accuracy', v_accuracy,
        'global_rank', v_global_rank
    );
END;
$$;

-- Explicitly grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_stats(uuid) TO authenticated;

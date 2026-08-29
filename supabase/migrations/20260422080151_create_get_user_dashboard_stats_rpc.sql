-- =============================================================================
-- Migration: Add get_user_dashboard_stats RPC
-- Description: Computes overall user dashboard stats (daily streak, total exams,
--              accuracy, global rank) in a single fast, secure RPC call.
-- =============================================================================

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
BEGIN
    -- Defense-in-depth: only the authenticated user may read their own stats.
    -- The client-supplied p_user_id is ignored unless it matches the caller.
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RETURN NULL;
    END IF;

    -- 1. Total Completed Exams Taken
    SELECT COUNT(*)
    INTO v_exams_taken
    FROM public.attempts
    WHERE user_id = p_user_id
      AND status = 'completed';

    -- 2. Daily Streak (from user profile; column is `streak`)
    SELECT COALESCE(streak, 0)
    INTO v_daily_streak
    FROM public.users
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        v_daily_streak := 0;
    END IF;

    -- 3. Overall Accuracy %
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

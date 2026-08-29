-- Fix get_user_leaderboard_rank:
-- 1. Handle p_paper_id IS NULL as exam-wide (not paper_id = NULL which matches nothing)
-- 2. Harden search_path + qualify objects
-- 3. Add defense-in-depth exam authorization check

CREATE OR REPLACE FUNCTION public.get_user_leaderboard_rank(
    p_exam_id text,
    p_paper_id uuid,
    p_time_range text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_rank INT;
    v_score NUMERIC;
    v_accuracy NUMERIC;
    v_duration INT;
    v_submitted_at TIMESTAMPTZ;
    v_since TIMESTAMPTZ;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    -- Defense-in-depth: only allow exams the caller is authorized for
    IF NOT public.is_exam_allowed_for_user(p_exam_id) THEN
        RETURN jsonb_build_object('rank', null);
    END IF;

    IF p_time_range = 'all' THEN
        -- Get from pre-calculated leaderboard table
        SELECT rank, best_score, best_accuracy, best_time_secs, best_submitted_at
        INTO v_rank, v_score, v_accuracy, v_duration, v_submitted_at
        FROM public.leaderboard
        WHERE user_id = v_user_id
        AND exam_id = p_exam_id
        AND (p_paper_id IS NULL OR paper_id = p_paper_id);
    ELSE
        -- Calculate time threshold
        v_since := CASE
            WHEN p_time_range = 'month' THEN NOW() - INTERVAL '1 month'
            WHEN p_time_range = 'week' THEN NOW() - INTERVAL '7 days'
            WHEN p_time_range = 'today' THEN date_trunc('day', NOW())
            ELSE '-infinity'::TIMESTAMPTZ
        END;

        -- Dynamic calculation for Time Range (paper_id IS NULL = exam-wide)
        WITH best_attempts AS (
            SELECT DISTINCT ON (ba.user_id)
                ba.user_id, ba.score, ba.accuracy, ba.duration_seconds, ba.submitted_at
            FROM public.attempts ba
            WHERE ba.exam_id = p_exam_id
            AND (p_paper_id IS NULL OR ba.paper_id = p_paper_id)
            AND ba.status = 'completed'::public.attempt_status
            AND ba.source = 'exam_tab'::public.attempt_source
            AND ba.submitted_at >= v_since
            ORDER BY ba.user_id, ba.score DESC, ba.accuracy DESC, ba.duration_seconds ASC, ba.submitted_at ASC
        ),
        user_best AS (
            SELECT * FROM best_attempts WHERE user_id = v_user_id
        )
        SELECT
            (SELECT COUNT(*) + 1
             FROM best_attempts ba
             WHERE (ba.score > ub.score)
                OR (ba.score = ub.score AND ba.accuracy > ub.accuracy)
                OR (ba.score = ub.score AND ba.accuracy = ub.accuracy AND ba.duration_seconds < ub.duration_seconds)
                OR (ba.score = ub.score AND ba.accuracy = ub.accuracy AND ba.duration_seconds = ub.duration_seconds AND ba.submitted_at < ub.submitted_at)
            ),
            ub.score, ub.accuracy, ub.duration_seconds, ub.submitted_at
        INTO v_rank, v_score, v_accuracy, v_duration, v_submitted_at
        FROM user_best ub;
    END IF;

    IF v_rank IS NULL THEN
        RETURN jsonb_build_object('rank', null);
    END IF;

    RETURN jsonb_build_object(
        'rank', v_rank,
        'score', v_score,
        'accuracy', v_accuracy,
        'duration', v_duration,
        'submitted_at', v_submitted_at
    );
END;
$function$;

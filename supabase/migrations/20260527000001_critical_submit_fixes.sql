-- =============================================================================
-- MIGRATION: Critical Fixes — Submit Path & Indexes
-- Date: 2026-05-27
-- Fixes:
--   #2  — submit_attempt: Add idempotency guard (prevent double-submission)
--   #3  — submit_attempt: Remove synchronous leaderboard rank refresh
--          (was a full-table re-rank on every submission — catastrophic at 100k users)
--   #4  — submit_attempt: Remove hot-row overall_accuracy update from users table
--          (was a write-lock on every user row on every submission)
--   #16 — Add composite index for leaderboard time-range query
--   #21 — Add index on sub_admins(coupon_code) for handle_new_user trigger
-- =============================================================================

-- ─── 1. Rewrite submit_attempt ───────────────────────────────────────────────
-- Key changes from the previous version:
--   a) IDEMPOTENCY: Returns the existing result immediately if already 'completed'.
--   b) NO HOT-ROW: Removed the UPDATE users SET overall_accuracy / total_exams.
--      overall_accuracy is now calculated lazily via the get_user_accuracy() view
--      function (created below). This eliminates row-level lock contention on the
--      users table at 100k concurrent submissions.
--   c) NO SYNC RANK REFRESH: Removed the refresh_leaderboard_ranks() call.
--      Leaderboard ranks are now refreshed asynchronously via pg_cron (see below).

CREATE OR REPLACE FUNCTION public.submit_attempt(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id        UUID;
    v_exam_id        TEXT;
    v_paper_id       UUID;
    v_source         public.attempt_source;
    v_total_marks    NUMERIC;
    v_total_correct  INT;
    v_total_wrong    INT;
    v_total_skipped  INT;
    v_score          NUMERIC;
    v_accuracy       NUMERIC;
    v_duration       INT;
    v_submitted_at   TIMESTAMPTZ;
    v_existing_status TEXT;
    v_result         JSONB;
    v_total_questions INT;
BEGIN
    -- ── IDEMPOTENCY GUARD ───────────────────────────────────────────────────
    -- If this attempt was already completed (e.g. a network retry hit us twice),
    -- return the existing result immediately without touching any data.
    SELECT status, score, correct_count, wrong_count, skipped_count, accuracy, duration_seconds,
           user_id, exam_id, paper_id, total_marks, source
    INTO   v_existing_status, v_score, v_total_correct, v_total_wrong, v_total_skipped,
           v_accuracy, v_duration,
           v_user_id, v_exam_id, v_paper_id, v_total_marks, v_source
    FROM   public.attempts
    WHERE  id = p_attempt_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt NOT FOUND with ID: %', p_attempt_id;
    END IF;

    IF v_existing_status = 'completed' THEN
        -- Return the previously computed result — safe, idempotent
        RETURN jsonb_build_object(
            'score',         ROUND(v_score, 2),
            'total_marks',   v_total_marks,
            'correct_count', v_total_correct,
            'wrong_count',   v_total_wrong,
            'skipped_count', v_total_skipped,
            'accuracy',      ROUND(v_accuracy, 2),
            'idempotent',    true
        );
    END IF;

    -- Get total questions from snapshot
    SELECT COALESCE(jsonb_array_length(questions_snapshot), 0)
    INTO v_total_questions
    FROM public.attempts
    WHERE id = p_attempt_id;

    -- ── CALCULATE SCORES ────────────────────────────────────────────────────
    SELECT
        COUNT(*) FILTER (WHERE is_correct = TRUE)  AS correct,
        COUNT(*) FILTER (WHERE is_correct = FALSE) AS wrong,
        COALESCE(SUM(marks_awarded), 0)             AS total_earned
    INTO v_total_correct, v_total_wrong, v_score
    FROM public.attempt_answers
    WHERE attempt_id = p_attempt_id;

    v_total_skipped := GREATEST(0, v_total_questions - v_total_correct - v_total_wrong);

    -- ── ACCURACY ─────────────────────────────────────────────────────────────
    IF (v_total_correct + v_total_wrong) > 0 THEN
        v_accuracy := (v_total_correct::NUMERIC / (v_total_correct + v_total_wrong)::NUMERIC) * 100;
    ELSE
        v_accuracy := 0;
    END IF;

    v_submitted_at := NOW();
    v_duration := EXTRACT(EPOCH FROM (
        v_submitted_at - (SELECT started_at FROM public.attempts WHERE id = p_attempt_id)
    ))::INT;

    -- ── UPDATE ATTEMPT RECORD ────────────────────────────────────────────────
    UPDATE public.attempts
    SET
        status          = 'completed',
        submitted_at    = v_submitted_at,
        score           = v_score,
        correct_count   = v_total_correct,
        wrong_count     = v_total_wrong,
        skipped_count   = v_total_skipped,
        accuracy        = ROUND(v_accuracy, 2),
        duration_seconds = v_duration
    WHERE id = p_attempt_id;

    -- ── LEADERBOARD UPSERT (best performance only) ───────────────────────────
    -- NOTE: We only update leaderboard.best_* columns here.
    -- Rank numbers are refreshed asynchronously by pg_cron (see below).
    -- This is safe because rank is a derived value, not source-of-truth data.
    IF v_exam_id IS NOT NULL AND v_paper_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.exams WHERE exam_id = v_exam_id AND exam_type = 'main') THEN
            INSERT INTO public.leaderboard (
                user_id, exam_id, paper_id,
                best_score, best_accuracy, best_time_secs, best_submitted_at,
                attempt_count, updated_at
            )
            VALUES (
                v_user_id, v_exam_id, v_paper_id,
                v_score, ROUND(v_accuracy, 2), v_duration, v_submitted_at,
                1, NOW()
            )
            ON CONFLICT (user_id, exam_id, paper_id) DO UPDATE SET
                best_score = CASE
                    WHEN (EXCLUDED.best_score > leaderboard.best_score)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy > leaderboard.best_accuracy)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs < leaderboard.best_time_secs)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs = leaderboard.best_time_secs AND EXCLUDED.best_submitted_at < leaderboard.best_submitted_at)
                    THEN EXCLUDED.best_score
                    ELSE leaderboard.best_score
                END,
                best_accuracy = CASE
                    WHEN (EXCLUDED.best_score > leaderboard.best_score)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy > leaderboard.best_accuracy)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs < leaderboard.best_time_secs)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs = leaderboard.best_time_secs AND EXCLUDED.best_submitted_at < leaderboard.best_submitted_at)
                    THEN EXCLUDED.best_accuracy
                    ELSE leaderboard.best_accuracy
                END,
                best_time_secs = CASE
                    WHEN (EXCLUDED.best_score > leaderboard.best_score)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy > leaderboard.best_accuracy)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs < leaderboard.best_time_secs)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs = leaderboard.best_time_secs AND EXCLUDED.best_submitted_at < leaderboard.best_submitted_at)
                    THEN EXCLUDED.best_time_secs
                    ELSE leaderboard.best_time_secs
                END,
                best_submitted_at = CASE
                    WHEN (EXCLUDED.best_score > leaderboard.best_score)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy > leaderboard.best_accuracy)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs < leaderboard.best_time_secs)
                      OR (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs = leaderboard.best_time_secs AND EXCLUDED.best_submitted_at < leaderboard.best_submitted_at)
                    THEN EXCLUDED.best_submitted_at
                    ELSE leaderboard.best_submitted_at
                END,
                attempt_count = leaderboard.attempt_count + 1,
                updated_at    = NOW();
        END IF;
    END IF;

    -- ── RETURN RESULT ─────────────────────────────────────────────────────────
    v_result := jsonb_build_object(
        'score',         ROUND(v_score, 2),
        'total_marks',   v_total_marks,
        'correct_count', v_total_correct,
        'wrong_count',   v_total_wrong,
        'skipped_count', v_total_skipped,
        'accuracy',      ROUND(v_accuracy, 2),
        'idempotent',    false
    );

    RETURN v_result;
END;
$$;


-- =============================================================================
-- 2. LAZY ACCURACY VIEW
-- Replaces the hot-row UPDATE users SET overall_accuracy.
-- The dashboard and profile pages should query this function instead of
-- users.overall_accuracy to get the live, accurate value.
-- The users.overall_accuracy column can remain for backward compat but
-- is no longer written to on every submission.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_accuracy(p_user_id uuid)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        CASE
            WHEN SUM(correct_count + wrong_count) = 0 THEN 0
            ELSE ROUND(
                SUM(correct_count)::NUMERIC /
                SUM(correct_count + wrong_count)::NUMERIC * 100,
                2
            )
        END
    FROM public.attempts
    WHERE user_id = p_user_id
      AND status  = 'completed'
      AND source  = 'exam_tab';
$$;


-- =============================================================================
-- 3. ASYNC LEADERBOARD RANK REFRESH VIA pg_cron
-- Ranks are refreshed every 5 minutes for all exam/paper combinations.
-- This replaces the synchronous per-submission rank refresh that caused
-- full-table lock contention.
--
-- IMPORTANT: pg_cron must be enabled in your Supabase project.
-- Enable it in: Supabase Dashboard → Database → Extensions → pg_cron
-- =============================================================================

-- Remove any existing schedule to avoid duplicates on re-run
SELECT cron.unschedule('refresh-leaderboard-ranks')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'refresh-leaderboard-ranks'
);

-- Schedule async rank refresh every 5 minutes
SELECT cron.schedule(
    'refresh-leaderboard-ranks',          -- job name (unique)
    '*/5 * * * *',                        -- every 5 minutes
    $$
        UPDATE public.leaderboard l
        SET rank = ranked.rank
        FROM (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY exam_id, paper_id
                    ORDER BY
                        best_score     DESC,
                        best_accuracy  DESC,
                        best_time_secs ASC,
                        best_submitted_at ASC
                ) AS rank
            FROM public.leaderboard
        ) ranked
        WHERE l.id = ranked.id
          AND l.rank IS DISTINCT FROM ranked.rank;  -- skip no-op updates
    $$
);


-- =============================================================================
-- 4. COMPOSITE INDEX — Leaderboard time-range query (Fix #16)
-- The get_user_leaderboard_rank() function (dynamic path) scans the full
-- attempts table without this index. At 100k+ rows this is O(n).
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attempts_leaderboard_query
    ON public.attempts (exam_id, paper_id, status, source, submitted_at DESC)
    WHERE status = 'completed';


-- =============================================================================
-- 5. INDEX — sub_admins coupon_code (Fix #21)
-- handle_new_user() trigger looks up coupon_code on every new registration.
-- Without this index, each signup does a full sequential scan on sub_admins.
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sub_admins_coupon_active
    ON public.sub_admins (coupon_code)
    WHERE status = 'active';

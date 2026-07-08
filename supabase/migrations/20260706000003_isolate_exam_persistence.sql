-- =============================================================================
-- MIGRATION: Isolate exam persistence — granular column-level operations
-- Date: 2026-07-06
--
-- Problem:
--   The single `saveAnswer` function used a full-row UPSERT, so every call
--   overwrote ALL columns. Navigation (which should only touch visited + 
--   last_visited_at) was overwriting selected_option, marked_for_review, and
--   time_spent_secs with defaults.
--
-- Fix:
--   Replace the monolithic upsert with 4 atomic Postgres functions. Each
--   function only touches its own columns. INSERT ... ON CONFLICT DO UPDATE
--   ensures the row is created on first touch while only updating the
--   specified columns on subsequent calls.
--
-- Functions:
--   1. touch_question_visit   — only visited, last_visited_at
--   2. set_question_answer    — only selected_option, is_correct, marks_awarded
--   3. set_question_review    — only marked_for_review
--   4. add_question_time      — only time_spent_secs (accumulates)
-- =============================================================================

-- ─── 1. Mark question visited (navigation only) ─────────────────────────────
-- Called when the user navigates to any question.
-- Creates a minimal row on first visit; updates only visited + timestamp.
-- NEVER touches: selected_option, is_correct, marks_awarded,
--   time_spent_secs, marked_for_review.
CREATE OR REPLACE FUNCTION public.touch_question_visit(
    p_attempt_id UUID,
    p_question_id UUID,
    p_correct_option TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.attempt_answers (
        attempt_id, question_id, correct_option,
        visited, last_visited_at,
        selected_option, is_correct, marks_awarded,
        time_spent_secs, marked_for_review
    ) VALUES (
        p_attempt_id, p_question_id, p_correct_option,
        true, now(),
        NULL, NULL, 0,
        0, false
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        visited = true,
        last_visited_at = now();
END;
$$;


-- ─── 2. Set answer (answer selection / clear only) ──────────────────────────
-- Called when the user selects an option or clears an answer.
-- Calculates is_correct and marks_awarded from selected_option.
-- NEVER touches: visited, last_visited_at, time_spent_secs, marked_for_review.
CREATE OR REPLACE FUNCTION public.set_question_answer(
    p_attempt_id UUID,
    p_question_id UUID,
    p_selected_option TEXT,
    p_correct_option TEXT,
    p_marks_per_question NUMERIC,
    p_negative_mark_value NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_correct BOOLEAN;
    v_marks_awarded NUMERIC;
BEGIN
    v_is_correct := (p_selected_option IS NOT NULL AND p_selected_option = p_correct_option);
    v_marks_awarded := CASE
        WHEN p_selected_option IS NULL THEN 0
        WHEN v_is_correct THEN p_marks_per_question
        WHEN p_negative_mark_value > 0 THEN -p_negative_mark_value
        ELSE 0
    END;

    INSERT INTO public.attempt_answers (
        attempt_id, question_id, correct_option,
        selected_option, is_correct, marks_awarded
    ) VALUES (
        p_attempt_id, p_question_id, p_correct_option,
        p_selected_option,
        CASE WHEN p_selected_option IS NULL THEN NULL ELSE v_is_correct END,
        v_marks_awarded
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        selected_option = p_selected_option,
        is_correct = CASE WHEN p_selected_option IS NULL THEN NULL ELSE v_is_correct END,
        marks_awarded = v_marks_awarded;
END;
$$;


-- ─── 3. Set review flag (mark for review / unmark only) ─────────────────────
-- Called when the user toggles the marked-for-review flag.
-- NEVER touches: selected_option, is_correct, marks_awarded,
--   visited, last_visited_at, time_spent_secs.
CREATE OR REPLACE FUNCTION public.set_question_review(
    p_attempt_id UUID,
    p_question_id UUID,
    p_correct_option TEXT,
    p_marked BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.attempt_answers (
        attempt_id, question_id, correct_option,
        marked_for_review
    ) VALUES (
        p_attempt_id, p_question_id, p_correct_option,
        p_marked
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        marked_for_review = p_marked;
END;
$$;


-- ─── 4. Accumulate time spent (leaving a question only) ─────────────────────
-- Called when the user navigates away from a question.
-- ADDS the elapsed seconds to the existing time_spent_secs.
-- NEVER touches: selected_option, is_correct, marks_awarded,
--   visited, last_visited_at, marked_for_review.
CREATE OR REPLACE FUNCTION public.add_question_time(
    p_attempt_id UUID,
    p_question_id UUID,
    p_correct_option TEXT,
    p_seconds NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.attempt_answers (
        attempt_id, question_id, correct_option,
        time_spent_secs
    ) VALUES (
        p_attempt_id, p_question_id, p_correct_option,
        p_seconds
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        time_spent_secs = attempt_answers.time_spent_secs + p_seconds;
END;
$$;

-- =============================================================================
-- MIGRATION: Add exam state persistence columns to attempt_answers
-- Date: 2026-07-06
-- 
-- Problem:
--   visited and marked_for_review were only stored in React state, never
--   persisted. On the Review page, un-answered questions appeared as "not
--   visited" because no attempt_answers record existed for them.
--
-- Changes:
--   1. adds visited (boolean) column — set true when question is opened
--   2. adds marked_for_review (boolean) column — set true when toggled
--   3. adds last_visited_at (timestamptz) — for time-spent tracking
-- =============================================================================

ALTER TABLE public.attempt_answers
    ADD COLUMN IF NOT EXISTS visited BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS marked_for_review BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMPTZ;

-- Index for faster review queries filtering by visited status
CREATE INDEX IF NOT EXISTS idx_attempt_answers_visited
    ON public.attempt_answers (attempt_id, visited)
    WHERE visited = true;

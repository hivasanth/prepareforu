-- Migration: Add safe performance-optimizing indexes
-- Rationale: Optimize question retrieval, leaderboard rankings, user dashboard lookups, and key joins without altering table structures or spoiling functions.

-- 1. Index for question generation and paper subject fetching
CREATE INDEX IF NOT EXISTS idx_questions_exam_paper_subject ON public.questions (exam_id, paper_id, subject_name);

-- 2. Index for listing a user's attempts sorted by status and date
CREATE INDEX IF NOT EXISTS idx_attempts_user_status_created ON public.attempts (user_id, status, created_at DESC);

-- 3. Index for calculating attempt scores and retrieving user answers quickly
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_question ON public.attempt_answers (attempt_id, question_id);

-- 4. Index for high-performance ranking calculations on the leaderboard
CREATE INDEX IF NOT EXISTS idx_leaderboard_paper_score_time ON public.leaderboard (paper_id, best_score DESC, best_time_secs ASC);

-- 5. Index for bookmark lookups and duplicates prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_user_question ON public.bookmarks (user_id, question_id);

-- 6. Index for performance logs & tracking prep progress
CREATE INDEX IF NOT EXISTS idx_prepare_sessions_user_paper ON public.prepare_sessions (user_id, paper_id);

-- 7. Index for quick lookup of teacher-hosted exam attempts
CREATE INDEX IF NOT EXISTS idx_attempts_teacher_exam ON public.attempts (teacher_exam_id) WHERE teacher_exam_id IS NOT NULL;

-- =============================================================================
-- MIGRATION: Database hardening — CHECK constraints for data integrity
-- Date: 2026-07-21
--
-- Problem:
--   Direct table writes (bypassing RPCs) have no database-level validation.
--   Invalid data could be inserted via the Supabase client.
--
-- Fix:
--   Add CHECK constraints to protect critical data integrity. These constraints
--   enforce rules that belong in the database layer (not UI rules).
--
-- Philosophy:
--   CHECK constraints protect DATA INTEGRITY (positive numbers, valid ranges).
--   Application validation protects BUSINESS LOGIC (unique IDs, format rules).
--   Both layers work together — they are not redundant.
-- =============================================================================


-- ─── exam_configs ────────────────────────────────────────────────────────────

ALTER TABLE public.exam_configs
  ADD CONSTRAINT chk_exam_configs_total_questions_positive
  CHECK (total_questions > 0);

ALTER TABLE public.exam_configs
  ADD CONSTRAINT chk_exam_configs_total_marks_positive
  CHECK (total_marks > 0);

ALTER TABLE public.exam_configs
  ADD CONSTRAINT chk_exam_configs_duration_positive
  CHECK (duration_minutes > 0 AND duration_minutes <= 1440);

ALTER TABLE public.exam_configs
  ADD CONSTRAINT chk_exam_configs_negative_mark_value_non_negative
  CHECK (negative_mark_value >= 0);


-- ─── exam_papers ─────────────────────────────────────────────────────────────

ALTER TABLE public.exam_papers
  ADD CONSTRAINT chk_exam_papers_total_questions_positive
  CHECK (total_questions > 0);

ALTER TABLE public.exam_papers
  ADD CONSTRAINT chk_exam_papers_total_marks_positive
  CHECK (total_marks > 0);

ALTER TABLE public.exam_papers
  ADD CONSTRAINT chk_exam_papers_duration_positive
  CHECK (duration_minutes > 0 AND duration_minutes <= 1440);

ALTER TABLE public.exam_papers
  ADD CONSTRAINT chk_exam_papers_negative_mark_value_non_negative
  CHECK (negative_mark_value >= 0);


-- ─── exam_subjects ───────────────────────────────────────────────────────────

ALTER TABLE public.exam_subjects
  ADD CONSTRAINT chk_exam_subjects_question_count_positive
  CHECK (question_count > 0);

ALTER TABLE public.exam_subjects
  ADD CONSTRAINT chk_exam_subjects_marks_per_question_positive
  CHECK (marks_per_question >= 0.1);


-- ─── questions ───────────────────────────────────────────────────────────────

ALTER TABLE public.questions
  ADD CONSTRAINT chk_questions_question_text_en_not_empty
  CHECK (length(trim(question_text_en)) > 0);

ALTER TABLE public.questions
  ADD CONSTRAINT chk_questions_option_a_en_not_empty
  CHECK (length(trim(option_a_en)) > 0);

ALTER TABLE public.questions
  ADD CONSTRAINT chk_questions_option_b_en_not_empty
  CHECK (length(trim(option_b_en)) > 0);

ALTER TABLE public.questions
  ADD CONSTRAINT chk_questions_option_c_en_not_empty
  CHECK (length(trim(option_c_en)) > 0);

ALTER TABLE public.questions
  ADD CONSTRAINT chk_questions_option_d_en_not_empty
  CHECK (length(trim(option_d_en)) > 0);

ALTER TABLE public.questions
  ADD CONSTRAINT chk_questions_correct_option_valid
  CHECK (correct_option IN ('A', 'B', 'C', 'D'));

ALTER TABLE public.questions
  ADD CONSTRAINT chk_questions_difficulty_valid
  CHECK (difficulty IN ('easy', 'medium', 'hard'));


-- ─── attempt_answers ─────────────────────────────────────────────────────────

ALTER TABLE public.attempt_answers
  ADD CONSTRAINT chk_attempt_answers_selected_option_valid
  CHECK (selected_option IS NULL OR selected_option IN ('A', 'B', 'C', 'D'));

ALTER TABLE public.attempt_answers
  ADD CONSTRAINT chk_attempt_answers_correct_option_valid
  CHECK (correct_option IN ('A', 'B', 'C', 'D'));

ALTER TABLE public.attempt_answers
  ADD CONSTRAINT chk_attempt_answers_marks_awarded_non_negative
  CHECK (marks_awarded >= 0);

ALTER TABLE public.attempt_answers
  ADD CONSTRAINT chk_attempt_answers_time_spent_non_negative
  CHECK (time_spent_secs >= 0);

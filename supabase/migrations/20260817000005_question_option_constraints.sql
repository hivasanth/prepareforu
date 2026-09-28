-- =============================================================================
-- MIGRATION: questions — add missing option field CHECK constraints
-- Date: 2026-08-17
--
-- Problem:
--   Migration 20260721000004 claimed to add CHECK constraints for option
--   fields, but they drifted from LIVE. Only chk_question_en_not_empty and
--   questions_correct_option_check exist.
--
-- Fix:
--   Add CHECK constraints for option_a_en, option_b_en, option_c_en, option_d_en.
--   difficulty is already a PostgreSQL enum (easy/medium/hard) — no CHECK needed.
--
-- Pre-flight: verified all 49 existing rows have non-empty option fields.
--
-- REPLAYABILITY (N-3 remediation, 2026-09-10): 20260721000004_database_check_
-- constraints.sql (recorded on LIVE as 20260721000004) already creates these
-- four constraints with the SAME names, so on a fresh chain (and on LIVE) this
-- file's un-guarded ADD CONSTRAINT statements fail with SQLSTATE 42710. They
-- are therefore wrapped in EXISTS guards; the resulting schema is identical.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_questions_option_a_en_not_empty'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT chk_questions_option_a_en_not_empty
      CHECK (length(trim(option_a_en)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_questions_option_b_en_not_empty'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT chk_questions_option_b_en_not_empty
      CHECK (length(trim(option_b_en)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_questions_option_c_en_not_empty'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT chk_questions_option_c_en_not_empty
      CHECK (length(trim(option_c_en)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_questions_option_d_en_not_empty'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT chk_questions_option_d_en_not_empty
      CHECK (length(trim(option_d_en)) > 0);
  END IF;
END $$;

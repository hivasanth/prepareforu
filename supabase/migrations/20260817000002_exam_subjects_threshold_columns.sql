-- =============================================================================
-- MIGRATION: exam_subjects — add availability threshold columns
-- Date: 2026-08-17
--
-- Problem:
--   Availability system needs per-subject threshold configuration for
--   topic-level eligibility and mode-specific (10/30/50) subject tests.
--
-- Fix:
--   Add 4 new integer columns to exam_subjects with conservative defaults.
--   Existing question_count continues to represent subject's paper allocation.
--
-- Defaults:
--   1 for all new columns (most permissive — Admin configures proper values).
--   This ensures existing rows remain valid without requiring backfill.
--
-- idempotent: uses IF NOT EXISTS guards
-- =============================================================================

-- ─── New threshold columns ──────────────────────────────────────────────────

ALTER TABLE public.exam_subjects
  ADD COLUMN IF NOT EXISTS min_questions_per_topic integer NOT NULL DEFAULT 1;

ALTER TABLE public.exam_subjects
  ADD COLUMN IF NOT EXISTS min_for_10 integer NOT NULL DEFAULT 1;

ALTER TABLE public.exam_subjects
  ADD COLUMN IF NOT EXISTS min_for_30 integer NOT NULL DEFAULT 1;

ALTER TABLE public.exam_subjects
  ADD COLUMN IF NOT EXISTS min_for_50 integer NOT NULL DEFAULT 1;

-- ─── CHECK constraints (positive integers only) ─────────────────────────────

ALTER TABLE public.exam_subjects
  ADD CONSTRAINT chk_exam_subjects_min_questions_per_topic_positive
  CHECK (min_questions_per_topic > 0);

ALTER TABLE public.exam_subjects
  ADD CONSTRAINT chk_exam_subjects_min_for_10_positive
  CHECK (min_for_10 > 0);

ALTER TABLE public.exam_subjects
  ADD CONSTRAINT chk_exam_subjects_min_for_30_positive
  CHECK (min_for_30 > 0);

ALTER TABLE public.exam_subjects
  ADD CONSTRAINT chk_exam_subjects_min_for_50_positive
  CHECK (min_for_50 > 0);

-- =============================================================================
-- LIVE/RECONCILIATION: Database CHECK constraints parity
-- Date: 2026-09-11 (rev. 2026-09-11 — corrected: skipped bad business constraint)
--
-- Why: 20260721000004_database_check_constraints is recorded in LIVE's
-- supabase_migrations.schema_migrations, but five of its CHECK constraints are
-- missing from LIVE's pg_constraint (removed out-of-band during N-3
-- remediation). A fresh replay of the chain has them; LIVE does not.
--
-- This reconciliation re-adds exactly those five, byte-identical to the chain
-- definitions (validated: LIVE data has zero violating rows, so the ADD will
-- not fail and the constraints are NOT added NOT VALID — full parity with a
-- fresh chain).
--
-- INTENTIONAL DEVIATION (documented, not silent):
--   chk_attempt_answers_marks_awarded_non_negative (marks_awarded >= 0) is the
--   sixth chain constraint and is NOT re-added. Evidence it contradicts live
--   business logic:
--     * Authoritative scoring RPCs (20260812000010, 20260902000000) compute
--       marks_awarded = -negative_mark_value for wrong answers when an exam
--       enables negative marking (exam_configs.negative_marking / negative_mark_value).
--     * LIVE holds 2 legitimate rows with marks_awarded = -0.33.
--     * e2e contract src/security/question-data-contract.test.ts:220 requires a
--       chain REPLACEMENT chk_questions_negative_marks_range, i.e. negative
--       marks are an intended supported rule.
--   Re-adding it would reject real scoring. Root cause hint: the constraint below
--   also means the CHAIN constraint 20260721000004 itself is buggy and the
--   clean-replay DB will still carry it unless a future chain migration
--   supersedes it (flagged in the 2026-09-11 parity report under "known
--   deviations"). Full schema parity for this ONE constraint is therefore NOT
--   achieved by this migration, by design.
--
-- Idempotent: guarded by pg_constraint existence. Fresh replays are no-ops
-- (20260721000004 already created them); LIVE re-creates the missing ones.
-- =============================================================================

-- ─── attempt_answers ─────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_attempt_answers_selected_option_valid'
  ) THEN
    ALTER TABLE public.attempt_answers
      ADD CONSTRAINT chk_attempt_answers_selected_option_valid
      CHECK (selected_option IS NULL OR selected_option IN ('A', 'B', 'C', 'D'));
  END IF;
END
$$;

-- NOTE: chk_attempt_answers_marks_awarded_non_negative intentionally NOT
-- re-added — see header "INTENTIONAL DEVIATION". marks_awarded stays
-- unconstrained to preserve legitimate negative-marking scoring.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_attempt_answers_time_spent_non_negative'
  ) THEN
    ALTER TABLE public.attempt_answers
      ADD CONSTRAINT chk_attempt_answers_time_spent_non_negative
      CHECK (time_spent_secs >= 0);
  END IF;
END
$$;

-- ─── questions ───────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_questions_question_text_en_not_empty'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT chk_questions_question_text_en_not_empty
      CHECK (length(trim(question_text_en)) > 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_questions_correct_option_valid'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT chk_questions_correct_option_valid
      CHECK (correct_option IN ('A', 'B', 'C', 'D'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_questions_difficulty_valid'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT chk_questions_difficulty_valid
      CHECK (difficulty IN ('easy', 'medium', 'hard'));
  END IF;
END
$$;
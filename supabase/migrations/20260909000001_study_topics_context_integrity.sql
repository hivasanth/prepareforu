-- =============================================================================
-- MIGRATION: study_topics cross-context integrity trigger (D-5)
-- Date: 2026-09-09
--
-- ADMIN TOPICS PUBLISH-READY remediation, finding D-5 (MEDIUM): there was no
-- DB-side guarantee that a study_topics row references a (exam_id, paper_id,
-- subject_name) combination that actually exists in exam_subjects. The app
-- enforced this at the service layer only.
--
-- This adds BEFORE INSERT OR UPDATE OF (exam_id, paper_id, subject_name)
-- validation mirroring the questions-table pattern
-- (trg_validate_question_topic / trg_validate_question_subject): the new
-- context must exist in exam_subjects. The trigger fires ONLY when one of the
-- three context columns is written, so unrelated updates to e.g. youtube_url /
-- display_order keep working even if a subject is later removed from
-- exam_subjects (any later context write is then refused, which is the
-- intended cross-context integrity contract).
--
-- Idempotent: CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS + CREATE.
-- Read-only pre-scan on 2026-09-09 (live) showed 0 mismatched rows among 13,
-- so this trigger only protects FUTURE writes.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_study_topic_context()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.exam_subjects
    WHERE exam_id = NEW.exam_id
      AND paper_id = NEW.paper_id
      AND subject_name = NEW.subject_name
  ) THEN
    RAISE EXCEPTION 'Invalid study_topic context (exam_id=% / paper_id=% / subject_name=%) — no matching exam_subjects row',
      NEW.exam_id, NEW.paper_id, NEW.subject_name;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_validate_study_topic_context ON public.study_topics;

CREATE TRIGGER trg_validate_study_topic_context
  BEFORE INSERT OR UPDATE OF exam_id, paper_id, subject_name ON public.study_topics
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_study_topic_context();
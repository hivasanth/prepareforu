-- =============================================================================
-- MIGRATION: Topic Exams data backfill + future import validation
-- Date: 2026-08-12
--
-- This migration has TWO parts:
--
--   A. DATA BACKFILL (deterministic, scoped, audited):
--      Assign the 49 currently-NULL `questions.topic_en` rows for
--      APPSC_GROUP_1 / History and Culture to valid existing topics in
--      exam_topics. Balanced distribution: topic with the lowest
--      (display_order, topic_en) gets floor(49/n)+1 questions, the rest
--      get floor(49/n). This is an administrative/test allocation,
--      documented in the remediation report (NOT authoritative academic
--      classification). idempotent: only touches rows where topic_en IS NULL.
--
--   B. FUTURE IMPORT VALIDATION (trigger):
--      New BEFORE INSERT OR UPDATE trigger `trg_validate_question_topic`
--      on public.questions. When topic_en IS NOT NULL, validates that
--      (exam_id, paper_id, subject_name, topic_en) exists in exam_topics.
--      Mirror of the existing `trg_validate_question_subject` trigger.
--      Silent when topic_en IS NULL (some legacy/upload paths still allow
--      untagged rows; future uploads should be tagged).
-- =============================================================================

-- ─── A. Data backfill ────────────────────────────────────────────────────────
DO $$
DECLARE
  affected_count INT := 0;
BEGIN
  WITH topics AS (
    SELECT topic_en, topic_te,
      ROW_NUMBER() OVER (ORDER BY display_order, topic_en) - 1 AS t_idx,
      COUNT(*) OVER () AS n
    FROM public.exam_topics
    WHERE exam_id = 'APPSC_GROUP_1'
      AND paper_id = '926c7d30-add2-4d03-a040-f011e9282562'
      AND subject_name = 'History and Culture'
  ),
  q_per_topic AS (
    SELECT t.t_idx, t.topic_en, t.topic_te,
      (49 / t.n) + CASE WHEN t.t_idx < (49 % t.n) THEN 1 ELSE 0 END AS q_count
    FROM topics t
  ),
  running AS (
    SELECT t.t_idx, t.topic_en, t.topic_te,
      COALESCE(SUM(t.q_count) OVER (ORDER BY t.t_idx ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0) AS cum_start,
      SUM(t.q_count) OVER (ORDER BY t.t_idx) AS cum_end
    FROM q_per_topic t
  ),
  ranked_q AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) - 1 AS q_idx
    FROM public.questions
    WHERE exam_id = 'APPSC_GROUP_1'
      AND paper_id = '926c7d30-add2-4d03-a040-f011e9282562'
      AND subject_name = 'History and Culture'
      AND topic_en IS NULL
  ),
  plan AS (
    SELECT q.id AS question_id, r.topic_en AS new_topic_en, r.topic_te AS new_topic_te
    FROM ranked_q q
    JOIN running r ON q.q_idx >= r.cum_start AND q.q_idx < r.cum_end
  ),
  upd AS (
    UPDATE public.questions q
    SET topic_en = plan.new_topic_en,
        topic_te = plan.new_topic_te
    FROM plan
    WHERE q.id = plan.question_id
      AND q.topic_en IS NULL
    RETURNING q.id
  )
  SELECT COUNT(*) INTO affected_count FROM upd;

  RAISE NOTICE 'FIX-P0-001: Topic backfill updated % question(s) in APPSC_GROUP_1 / History and Culture', affected_count;
END;
$$;

-- ─── B. Future import validation trigger ────────────────────────────────────
-- Fires BEFORE INSERT OR UPDATE on public.questions. When NEW.topic_en is
-- provided, validates it exists in exam_topics for the same
-- (exam_id, paper_id, subject_name). Silent when topic_en IS NULL (matches
-- the existing validate_question_subject pattern).

CREATE OR REPLACE FUNCTION public.validate_question_topic()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.topic_en IS NOT NULL AND NEW.topic_en <> '' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.exam_topics
      WHERE exam_id = NEW.exam_id
        AND paper_id = NEW.paper_id
        AND subject_name = NEW.subject_name
        AND topic_en = NEW.topic_en
    ) THEN
      RAISE EXCEPTION 'Invalid topic_en "%" for exam/paper/subject (%" / % / %) — topic must exist in exam_topics',
        NEW.topic_en, NEW.exam_id, NEW.paper_id, NEW.subject_name;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_validate_question_topic ON public.questions;

CREATE TRIGGER trg_validate_question_topic
  BEFORE INSERT OR UPDATE OF topic_en ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_question_topic();
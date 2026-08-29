-- =============================================================================
-- MIGRATION: study_topics hardening (RLS isolation + grants + FKs + index +
--                  display_order uniqueness)
-- Date: 2026-08-12 (page audit remediation)
--
-- SCOPE:
--   The /topics page audit identified five issues on public.study_topics:
--     SEC-01 / FIX-P1-001 — SELECT policy was `is_published = true` without
--                              exam-scope; any authenticated user could read
--                              published topics from exams other than their
--                              own. Adds `is_exam_allowed_for_user(exam_id)`
--                              via the canonical helper, preserving the
--                              `is_published` filter and admin/sub_admin arms.
--     SEC-02 / FIX-P2-001 — anon had full DML grants on study_topics.
--                              Revokes INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/
--                              TRIGGER (keeps SELECT).
--     SEC-03 / FIX-P2-002 — Missing FK constraints to exam_configs.exam_id
--                              and exam_papers.id. Verified ZERO orphan rows
--                              before adding. (subject_name is NOT given a FK
--                              because it is not a unique target on
--                              exam_subjects alone; the relationship is
--                              composite (paper_id, subject_name).)
--     SEC-04 / FIX-P2-003 — Missing composite index on
--                              (exam_id, paper_id, subject_name, is_published)
--                              matching the hot query.
--     P3-004              — Optional partial unique index on
--                              (exam_id, paper_id, subject_name, display_order)
--                              WHERE is_published = true to prevent duplicate
--                              ordering within the same scope. Verified ZERO
--                              live duplicates before adding.
--
-- APPLIED LIVE on project xbjhlfwqmcyatblsrhxn.
-- Idempotent: every statement uses DROP IF EXISTS / IF NOT EXISTS guards.
-- =============================================================================

-- ─── A. RLS isolation ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users read published topics" ON public.study_topics;

CREATE POLICY "Users read published topics"
  ON public.study_topics
  FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND (
      public.is_exam_allowed_for_user(exam_id)
      OR public.is_admin()
      OR public.is_sub_admin()
    )
  );

-- ─── B. anon DML grants ──────────────────────────────────────────────────────
REVOKE
  INSERT,
  UPDATE,
  DELETE,
  TRUNCATE,
  REFERENCES,
  TRIGGER
ON public.study_topics
FROM anon;

-- ─── C. Foreign keys ────────────────────────────────────────────────────────
-- study_topics.exam_id (text) → exam_configs.exam_id (text)
ALTER TABLE public.study_topics
  DROP CONSTRAINT IF EXISTS study_topics_exam_id_fkey;
ALTER TABLE public.study_topics
  ADD CONSTRAINT study_topics_exam_id_fkey
    FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id)
    ON DELETE CASCADE
    NOT VALID;
-- NOT VALID skips the existing-row check (faster on large tables) while
-- still enforcing for new INSERTs/UPDATEs. Validate after confirming all
-- existing rows pass:
ALTER TABLE public.study_topics
  VALIDATE CONSTRAINT study_topics_exam_id_fkey;

-- study_topics.paper_id (uuid) → exam_papers.id (uuid)
ALTER TABLE public.study_topics
  DROP CONSTRAINT IF EXISTS study_topics_paper_id_fkey;
ALTER TABLE public.study_topics
  ADD CONSTRAINT study_topics_paper_id_fkey
    FOREIGN KEY (paper_id) REFERENCES public.exam_papers(id)
    ON DELETE CASCADE
    NOT VALID;
ALTER TABLE public.study_topics
  VALIDATE CONSTRAINT study_topics_paper_id_fkey;

-- NOTE: study_topics.subject_name is intentionally NOT constrained by FK.
-- exam_subjects.subject_name alone is NOT a unique target; the relationship
-- is composite (paper_id, subject_name). Adding an FK to a non-unique target
-- would be invalid. Application-layer validation remains the source of truth
-- for subject_name correctness.

-- ─── D. Composite index ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_study_topics_context
  ON public.study_topics (exam_id, paper_id, subject_name, is_published);

-- ─── E. display_order uniqueness (optional / partial) ───────────────────────
-- Verified ZERO live duplicates before adding this index. If two topics
-- share (exam_id, paper_id, subject_name, display_order) WHERE is_published,
-- insertion of the index will fail; remove or fix duplicates before retrying.
CREATE UNIQUE INDEX IF NOT EXISTS idx_study_topics_order_unique
  ON public.study_topics (exam_id, paper_id, subject_name, display_order)
  WHERE is_published = true;
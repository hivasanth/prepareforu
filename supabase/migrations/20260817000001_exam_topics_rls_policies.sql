-- =============================================================================
-- MIGRATION: exam_topics RLS — add INSERT/UPDATE/DELETE for admin & sub_admin
-- Date: 2026-08-17
--
-- Problem:
--   exam_topics only has SELECT policy. Admin topic registration via
--   registerTopicIfNeeded() silently fails for new topics because RLS
--   blocks the INSERT.
--
-- Fix:
--   Add explicit INSERT, UPDATE, DELETE policies matching the existing
--   authorization pattern used by questions, exam_subjects, and exam_papers.
--
-- Authorization model (matches existing pattern):
--   admin:     FULL access (INSERT/UPDATE/DELETE)
--   sub_admin: FULL access (INSERT/UPDATE/DELETE) — they manage topics
--              during question upload
--   user:      SELECT only (existing policy unchanged)
--
-- idempotent: uses IF NOT EXISTS guards
-- =============================================================================

-- ─── Admin: INSERT ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS exam_topics_admin_insert ON public.exam_topics;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'exam_topics_admin_insert' AND polrelid = 'public.exam_topics'::regclass
  ) THEN
CREATE POLICY exam_topics_admin_insert
  ON public.exam_topics
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());
  END IF;
END
$$;

-- ─── Admin: UPDATE ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS exam_topics_admin_update ON public.exam_topics;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'exam_topics_admin_update' AND polrelid = 'public.exam_topics'::regclass
  ) THEN
CREATE POLICY exam_topics_admin_update
  ON public.exam_topics
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
  END IF;
END
$$;

-- ─── Admin: DELETE ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS exam_topics_admin_delete ON public.exam_topics;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'exam_topics_admin_delete' AND polrelid = 'public.exam_topics'::regclass
  ) THEN
CREATE POLICY exam_topics_admin_delete
  ON public.exam_topics
  FOR DELETE
  TO authenticated
  USING (is_admin());
  END IF;
END
$$;

-- ─── Sub-Admin: INSERT ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS exam_topics_sub_admin_insert ON public.exam_topics;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'exam_topics_sub_admin_insert' AND polrelid = 'public.exam_topics'::regclass
  ) THEN
CREATE POLICY exam_topics_sub_admin_insert
  ON public.exam_topics
  FOR INSERT
  TO authenticated
  WITH CHECK (is_sub_admin());
  END IF;
END
$$;

-- ─── Sub-Admin: UPDATE ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS exam_topics_sub_admin_update ON public.exam_topics;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'exam_topics_sub_admin_update' AND polrelid = 'public.exam_topics'::regclass
  ) THEN
CREATE POLICY exam_topics_sub_admin_update
  ON public.exam_topics
  FOR UPDATE
  TO authenticated
  USING (is_sub_admin())
  WITH CHECK (is_sub_admin());
  END IF;
END
$$;

-- ─── Sub-Admin: DELETE ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS exam_topics_sub_admin_delete ON public.exam_topics;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'exam_topics_sub_admin_delete' AND polrelid = 'public.exam_topics'::regclass
  ) THEN
CREATE POLICY exam_topics_sub_admin_delete
  ON public.exam_topics
  FOR DELETE
  TO authenticated
  USING (is_sub_admin());
  END IF;
END
$$;

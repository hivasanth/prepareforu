-- =============================================================================
-- MIGRATION: study_topics reproducibility + unscoped-policy removal (S-C1)
-- Date: 2026-08-16 (page audit remediation)
--
-- SCOPE:
--   S-C1 (HIGH) — 20260701000004 created `rls_study_topics_user_select` with
--     `USING (is_published = true)` — NO exam scope. It is never dropped, so a
--     FRESH environment replaying migrations ends up with BOTH the unscoped
--     policy AND the scoped "Users read published topics" policy; the two OR
--     together and any authenticated user could read published topics from
--     exams they do not belong to. LIVE already has only the two correct
--     policies (verified 2026-08-16), so this is a no-op there — it makes
--     FRESH environments converge to the verified LIVE state.
--   Reproducibility — there was no CREATE TABLE for study_topics in the
--     migration history (out-of-band). A CREATE TABLE IF NOT EXISTS mirroring
--     the verified live DDL is included as an idempotent safety net
--     (20260630000000_create_study_topics.sql handles pristine `db push`
--     ordering; this one covers any env that only applies this file).
--
-- SAFETY: every statement is DROP IF EXISTS / IF NOT EXISTS guarded.
-- Idempotent: applying twice (or on an env that already matches live) is a
-- no-op. No row mutations. Historical migrations untouched.
-- =============================================================================

-- ─── 1. Table safety net (mirrors live DDL exactly) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.study_topics (
  id             uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  exam_id        text NOT NULL,
  paper_id       uuid NOT NULL,
  subject_name   text NOT NULL,
  title_en       text NOT NULL,
  title_te       text DEFAULT ''::text,
  summary_en     text DEFAULT ''::text,
  summary_te     text DEFAULT ''::text,
  content_en     jsonb DEFAULT '[]'::jsonb,
  content_te     jsonb DEFAULT '[]'::jsonb,
  youtube_url    text,
  display_order  integer DEFAULT 1,
  is_published   boolean DEFAULT true,
  created_by     uuid,
  created_at     timestamp with time zone DEFAULT now(),
  updated_at     timestamp with time zone DEFAULT now()
);

-- ─── 2. S-C1: remove the unscoped SELECT policy (never allow it to survive) ─
DROP POLICY IF EXISTS "rls_study_topics_user_select" ON public.study_topics;

-- Legacy granular admin/sub-admin policies from 20260701000004 are replaced by
-- the canonical single "Admins full access" policy (matches live).
DROP POLICY IF EXISTS "rls_study_topics_admin_all" ON public.study_topics;
DROP POLICY IF EXISTS "rls_study_topics_sub_admin_all" ON public.study_topics;

-- ─── 3. Canonical policy set (verified live definitions) ────────────────────
-- Admin + sub-admin full access. Sub-admin scope is intentionally a service-
-- layer concern (documented business model) — identical on every content table.
DROP POLICY IF EXISTS "Admins full access" ON public.study_topics;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Admins full access' AND polrelid = 'public.study_topics'::regclass
  ) THEN
CREATE POLICY "Admins full access"
  ON public.study_topics
  FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_sub_admin())
  WITH CHECK (public.is_admin() OR public.is_sub_admin());
  END IF;
END
$$;

-- Users see ONLY published topics that belong to an exam they are allowed to
-- sit (exam-scoped, canonical helper). Drop+recreate keeps this idempotent and
-- guarantees the old unscoped variant can never linger under another name.
DROP POLICY IF EXISTS "Users read published topics" ON public.study_topics;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Users read published topics' AND polrelid = 'public.study_topics'::regclass
  ) THEN
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
  END IF;
END
$$;

-- ─── 4. Harden grants: anon may SELECT only (never DML) ─────────────────────
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.study_topics FROM anon;

-- ─── 5. RLS enabled (idempotent) ────────────────────────────────────────────
ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY;

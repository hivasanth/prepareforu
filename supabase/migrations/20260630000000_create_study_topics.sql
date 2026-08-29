-- =============================================================================
-- MIGRATION: create public.study_topics (reproducibility bootstrap)
-- Date: 2026-06-30 (retro-dated placement only — NEW file, historical files
--       untouched)
--
-- WHY THIS FILE EXISTS:
--   public.study_topics was created out-of-band (never via a migration), so a
--   pristine `supabase db push` / `db reset` failed at 20260701000004's
--   `ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY` because the
--   table did not exist. This migration is dated EARLIER than that file so a
--   fresh environment boots the table first.
--
-- DDL mirrors LIVE project xbjhlfwqmcyatblsrhxn EXACTLY (verified via
-- information_schema + FK/index inspection on 2026-08-16). Every statement is
-- idempotent (IF NOT EXISTS / DROP IF EXISTS) so this is a no-op on any
-- environment where study_topics already exists.
-- =============================================================================

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

-- ─── Foreign keys (match live) ──────────────────────────────────────────────
ALTER TABLE public.study_topics
  DROP CONSTRAINT IF EXISTS study_topics_exam_id_fkey;
ALTER TABLE public.study_topics
  ADD CONSTRAINT study_topics_exam_id_fkey
    FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id)
    ON DELETE CASCADE;
-- Idempotent fallback: on fresh replays the constraint is added above; the
-- DROP/ADD pair keeps this re-runnable on environments where a NOT VALID
-- variant already exists.

ALTER TABLE public.study_topics
  DROP CONSTRAINT IF EXISTS study_topics_paper_id_fkey;
ALTER TABLE public.study_topics
  ADD CONSTRAINT study_topics_paper_id_fkey
    FOREIGN KEY (paper_id) REFERENCES public.exam_papers(id)
    ON DELETE CASCADE;

-- ─── Indexes (match live hot query + ordering guard) ────────────────────────
CREATE INDEX IF NOT EXISTS idx_study_topics_context
  ON public.study_topics (exam_id, paper_id, subject_name, is_published);

CREATE UNIQUE INDEX IF NOT EXISTS idx_study_topics_order_unique
  ON public.study_topics (exam_id, paper_id, subject_name, display_order)
  WHERE is_published = true;

-- ─── RLS bootstrap (so 20260701000004's ALTER ... ENABLE RLS is valid) ──────
ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- MIGRATION: study_topics constraints + created_by default (D-6, D-7, D-8)
-- Date: 2026-09-09
--
-- ADMIN TOPICS PUBLISH-READY remediation:
--
--   D-6 (MEDIUM) — no CHECK that display_order >= 1 at DB level. The app
--       enforces it via topicMetadataSchema (min 1, max 100000) and the
--       reorder RPC, but the column itself accepted negative/zero values.
--
--   D-7 (LOW)    — youtube_url had no server-side validation. Client-side
--       Zod (`z.string().url()`) remains the primary check; this DB CHECK is
--       the defense-in-depth guard: NULL or '' allowed, otherwise must start
--       http(s)://, contain no whitespace, and stay <= 2048 chars.
--
--   D-8 (LOW)    — created_by had no DEFAULT; service layer set it manually.
--       DEFAULT auth.uid() makes creator attribution a DB guarantee for any
--       future direct insert. Existing valid rows are untouched (a DEFAULT
--       never rewrites data; live scan: 13/13 rows already non-NULL).
--
-- Constraint adds are guard-gated on pg_constraint so the file is idempotent
-- for `supabase db push` re-runs. Read-only pre-scan on 2026-09-09 showed ZERO
-- rows violating D-6/D-7, so adding the checks validates instantly.
-- =============================================================================

-- ─── D-6: display_order >= 1 ─────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_study_topics_display_order_positive'
      AND conrelid = 'public.study_topics'::regclass
  ) THEN
    ALTER TABLE public.study_topics
      ADD CONSTRAINT chk_study_topics_display_order_positive
      CHECK (display_order >= 1);
  END IF;
END;
$$;

-- ─── D-7: youtube_url server-side validation ─────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_study_topics_youtube_url'
      AND conrelid = 'public.study_topics'::regclass
  ) THEN
    ALTER TABLE public.study_topics
      ADD CONSTRAINT chk_study_topics_youtube_url
      CHECK (
        youtube_url IS NULL
        OR youtube_url = ''
        OR (
          youtube_url ~ '^https?://[^[:space:]]+$'
          AND length(youtube_url) <= 2048
        )
      );
  END IF;
END;
$$;

-- ─── D-8: created_by reverts to auth.uid() when omitted ──────────────────────

ALTER TABLE public.study_topics
  ALTER COLUMN created_by SET DEFAULT auth.uid();
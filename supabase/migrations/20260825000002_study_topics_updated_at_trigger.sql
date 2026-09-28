-- =============================================================================
-- MIGRATION: Attach updated_at auto-refresh trigger to study_topics (LOW-1)
-- Date: 2026-08-25 (admin topics remediation)
--
-- WHY THIS FILE EXISTS:
--   The audit identified that the shared `update_updated_at()` function exists
--   as SECURITY DEFINER with `search_path = public`, but no trigger is attached
--   to `study_topics`. This means `updated_at` is never auto-set on row updates.
--   This migration attaches the trigger so every UPDATE automatically refreshes
--   the `updated_at` column.
--
-- SECURITY:
--   Uses the EXISTING `public.update_updated_at()` SECURITY DEFINER function
--   (immutable, no argument injection risk). No new functions created.
--
-- IDEMPOTENT: DROP IF EXISTS + CREATE. Safe to re-apply.
-- =============================================================================

-- ─── 1. Drop existing trigger if present ─────────────────────────────────────
DROP TRIGGER IF EXISTS update_study_topics_updated_at ON public.study_topics;

-- ─── 2. Attach the trigger ───────────────────────────────────────────────────
-- Fires BEFORE every UPDATE, calls the shared SECURITY DEFINER function
-- that sets `updated_at = now()`. The function is SECURITY DEFINER so it
-- works regardless of the caller's search_path.
CREATE TRIGGER update_study_topics_updated_at
  BEFORE UPDATE ON public.study_topics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

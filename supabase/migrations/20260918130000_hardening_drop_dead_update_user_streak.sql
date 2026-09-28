-- =============================================================================
-- MIGRATION: Drop the dead, anon-writable update_user_streak RPC
-- Date: 2026-09-18 (sub-admin panel production hardening — finding 9.2 MEDIUM)
--
-- PURPOSE (maps to master audit finding 9.2):
--   `public.update_user_streak(p_user_id uuid)` is SECURITY DEFINER, granted
--   EXECUTE to PUBLIC + anon + authenticated + postgres + service_role, with NO
--   auth.uid() self-guard — ANY anonymous caller can inflate any user's
--   streak/longest_streak/last_activity_date by uuid. It is an unauthenticated
--   write path on a DEFINER function.
--
--   Dependency map (verified before this migration):
--     * source/frontend: zero consumers in src, supabase/functions, e2e
--     * DB: zero functions/triggers reference it (pg_depend returned none)
--     * only definitions: 20260401000001_reconstruct_missing_baseline_tables.sql
--       + the live snapshot + historical docs
--   It is proven-dead, so it is DROPPED (no grant to revoke, nothing to guard).
--   The streak/longest_streak/last_activity_date columns remain untouched —
--   other paths may maintain them; this removes only the RPC.
--
-- FORWARD-ONLY. One transaction. Safe on LIVE and on a fresh DB.
-- =============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.update_user_streak(p_user_id uuid);

COMMIT;
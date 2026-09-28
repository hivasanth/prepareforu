-- =============================================================================
-- MIGRATION: Remove the legacy client-metadata-driven sub_admin provisioning path
-- Date: 2026-09-18 (sub-admin panel production hardening — finding 9.1 HIGH)
--
-- PURPOSE (maps to master audit finding 9.1):
--   The LIVE trigger `auth.users.on_auth_user_created_sub_admin` →
--   `public.handle_new_sub_admin()` creates an ACTIVE `sub_admins` row whenever
--   signup metadata `raw_user_meta_data->>'role'` is IN ('sub_admin','educator').
--   The public Supabase signup endpoint accepts arbitrary metadata, so a
--   crafted signup can self-provision an active educator profile (a functioning
--   self-tenant) even though `users.role` stays 'user'. It is an unintended,
--   client-influenced provisioning path.
--
--   The application NEVER depends on this trigger: every legitimate privileged
--   account is provisioned server-side after creation via
--   `admin_create_sub_admin_profile` (service_role-EXECUTE only) through the
--   `onboard-sub-admin` Edge Function (admin-gated), or by the
--   handle_user_role_change / create_sub_admin admin paths. This trigger adds
--   no required function (verified in the master audit dependency map), so it
--   is removed outright (dropping, not hardening — a retained SECURITY DEFINER
--   alternative would re-expose an attack surface for no benefit).
--
--   `public.user_creation_logs` was written ONLY by handle_new_sub_admin
--   (error buffer). LIVE evidence before this migration: 0 rows, 0 RLS
--   policies, 0 dependent functions. It is proven-dead with the trigger, so it
--   is removed with it (no writers remain; keeping it would be a stray object).
--   `handle_email_confirmed` + `on_email_confirmed` are UNTOUCHED (they drive
--   the invite-accept flow's email_verified marker and remain required).
--
-- FORWARD-ONLY. One transaction. Safe on a fresh DB (objects come from
-- 20260903110000 / 20260401000001) and on LIVE.
-- =============================================================================

BEGIN;

-- 1. Detach the legacy trigger from auth.users (guarded).
DROP TRIGGER IF EXISTS on_auth_user_created_sub_admin ON auth.users;

-- 2. Drop the trigger function (guarded).
DROP FUNCTION IF EXISTS public.handle_new_sub_admin();

-- 3. Drop the dead companion audit table. Zero rows, zero policies, zero
--    dependent functions (probed LIVE immediately before this migration).
DROP TABLE IF EXISTS public.user_creation_logs;

COMMIT;
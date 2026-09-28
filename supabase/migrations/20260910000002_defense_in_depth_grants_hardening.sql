-- Migration: 20260910000002_defense_in_depth_grants_hardening
-- Purpose: Defense-in-depth privilege hardening for sub_admins and users tables
--   Phase 1: Remove anon/PUBLIC write privileges from sub_admins
--   Phase 2: Remove anon SELECT privilege from users
--   Phase 3: Remove PUBLIC/anon EXECUTE from trigger functions
--
-- Safety: RLS already blocks anon access. This hardens the direct privilege model.
-- No application code queries these tables as anon.
-- Edge Functions use service_role. Frontend uses RPCs. Triggers fire via system.

BEGIN;

-- ============================================================================
-- PHASE 1: sub_admins — Remove anon/PUBLIC write (DML) privileges
-- ============================================================================
-- Current state: anon has INSERT, UPDATE, DELETE, SELECT, TRIGGER, REFERENCES
-- Target state:  anon has no write privileges; service_role/postgres retain full

REVOKE INSERT, UPDATE, DELETE, TRIGGER
ON public.sub_admins
FROM anon, PUBLIC;

-- ============================================================================
-- PHASE 2: users — Remove anon SELECT privilege
-- ============================================================================
-- Current state: anon has SELECT on all 18 columns, plus DELETE, TRIGGER, REFERENCES
-- Target state:  anon has no SELECT; all user data access via RPCs or service_role

REVOKE SELECT, DELETE, TRIGGER
ON public.users
FROM anon, PUBLIC;

-- ============================================================================
-- PHASE 3: Trigger functions — Remove PUBLIC/anon EXECUTE
-- ============================================================================
-- These are trigger-invoked functions, not public API functions.
-- Trigger system invokes them regardless of direct EXECUTE grants.
-- SECURITY DEFINER ensures correct execution context.

REVOKE EXECUTE
ON FUNCTION public.update_updated_at()
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.trg_notify_on_sub_admin_change()
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.sync_sub_admin_coupon_to_users()
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.update_sub_admin_referrals()
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.trg_notify_on_new_student()
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.prevent_self_demotion()
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.prevent_user_role_escalation()
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.handle_new_user()
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.handle_new_sub_admin()
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.handle_user_role_change()
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.handle_email_confirmed()
FROM PUBLIC, anon;

COMMIT;

-- Hardening: remove legacy create_sub_admin RPC (F-18 duplicate provisioning path)
-- Scope: final production sign-off pass, Remaining Issue 1.
--
-- Rationale (dependency audit, 2026-09-18):
--   * Zero callers in src/, supabase/functions/, e2e/, scripts/, tests/ (repo-wide grep).
--   * Zero DB callers: no pg_proc body references it (only comments in handle_new_user
--     and its own CREATE label).
--   * Zero dependent objects: no policies, triggers, views, or pg_depend references.
--   * Superseded by the canonical atomic path:
--       admin UI -> onboardSubAdmin (userService) -> edge function onboard-sub-admin
--       (admin JWT gate) -> public.admin_create_sub_admin_profile (service_role-only).
--   * Removes the MD5(RANDOM()) coupon fallback + verbatim coupon handling from the
--     active provisioning surface. The canonical gen_sub_admin_coupon remains the only
--     coupon generator.
--
-- The function's grants (REVOKE FROM PUBLIC; GRANT TO authenticated, service_role)
-- die with the function object.

DROP FUNCTION IF EXISTS public.create_sub_admin(p_user_id uuid, p_coupon text);

-- Guard: no overload variants exist. If this ever runs again it is idempotent.
-- ─── ADMIN USERS — RPC EXECUTE HARDENING (AU-6) ──────────────────────────────
-- Signatures verified against the LIVE catalog (supabase gen types --linked):
--   public.admin_set_user_active(p_user_id uuid, p_is_active boolean) : integer
--   public.get_admin_user_stats(p_user_ids uuid[])                    : jsonb
--
-- Both SECURITY DEFINER functions already enforce authorization internally
-- (is_admin() / auth.uid() role check), but PostgreSQL grants EXECUTE to
-- PUBLIC on functions by default. Remove the implicit PUBLIC privilege and
-- any explicit anon grant so anonymous callers can no longer reach the
-- function entry point at all.
--
-- Authenticated execution (the admin panel path) is re-asserted, and
-- service_role is granted explicitly so it keeps the effective privilege it
-- previously held through PUBLIC.

REVOKE EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean) FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_admin_user_stats(uuid[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_user_stats(uuid[]) FROM anon;

GRANT EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean) TO service_role;

GRANT EXECUTE ON FUNCTION public.get_admin_user_stats(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_stats(uuid[]) TO service_role;

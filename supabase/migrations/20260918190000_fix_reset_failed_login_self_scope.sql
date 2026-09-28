-- =============================================================================
-- MIGRATION: FIX-21 — reset_failed_login lockout-bypass hardening
-- Date: 2026-09-18
--
-- Defect (proven live over HTTP with the anon key):
--   public.reset_failed_login(p_email text) was SECURITY DEFINER + EXECUTE
--   granted to PUBLIC, anon, authenticated. Any unauthenticated caller could
--      1. force-lock any account: 5x record_failed_login(victim_email) -> locked
--      2. clear any account's lockout: reset_failed_login(victim_email) -> 204
--   i.e. full remote manipulation of another account's lockout state.
--   (Probe results: record #5 returned locked=true, locked_until set; reset then
--    returned 204 and is_account_locked returned locked=false, attempts=0.)
--
-- FIX (forward-only; the legitimate client flow is UNAFFECTED):
--   The client calls reset_failed_login only AFTER a successful
--   supabase.auth.signInWithPassword() / reauthenticate() (authService.ts:372/595),
--   at which point the supabase-js client already holds the fresh session and
--   the REST call therefore runs with the authenticated role + JWT (email claim).
--   So we may safely:
--     1. REVOKE EXECUTE ... FROM PUBLIC, anon
--     2. Enforce caller == target in SQL: the authenticated JWT email claim must
--        equal the normalized p_email (or the caller must be admin / sub_admin /
--        service_role / table owner).
--   The increase-on-failure path (record_failed_login) keeps its anon EXECUTE
--   (it is, by design, called from the pre-auth wrong-password branch where no
--   session exists yet). Its abuse is bounded: lockout is 15 minutes, auto-clears,
--   non-escalating, and does not bypass GoTrue's own captcha/ratelimiting on the
--   real /auth/v1/token call (security-gateway, F-04). Residual is logged as LOW-2.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.reset_failed_login(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_normalized text := LOWER(BTRIM(p_email));
    v_role       text := auth.role();
    v_jwt_email  text := LOWER(BTRIM(auth.jwt() ->> 'email'));
BEGIN
    IF v_normalized IS NULL OR v_normalized = '' THEN
        RETURN;
    END IF;

    -- Caller must be the account owner (JWT email claim match) or a privileged
    -- principal. Table-owner (postgres) / service_role run outside anon/User
    -- claims and are untouched. Admin / sub-admin may reset for their users.
    IF NOT (
        v_role IS NULL
        OR v_role = 'service_role'
        OR v_jwt_email = v_normalized
        OR public.is_admin()
        OR public.is_sub_admin()
    ) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: can only reset your own login lockout';
    END IF;

    UPDATE public.users
    SET    failed_login_attempts = 0,
           locked_until          = NULL
    WHERE  email = v_normalized;
END;
$function$;

REVOKE ALL ON FUNCTION public.reset_failed_login(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_failed_login(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.reset_failed_login(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_failed_login(text) TO service_role;

COMMIT;
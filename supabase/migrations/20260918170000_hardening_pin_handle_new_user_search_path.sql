-- ─────────────────────────────────────────────────────────────────────────────
-- FINAL SIGN-OFF PASS — P6: pin search_path on the last unpinned SECURITY DEFINER
-- ─────────────────────────────────────────────────────────────────────────────
-- Audit (2026-09-18): pg_proc scan of public SECURITY DEFINER functions showed
-- exactly one without proconfig search_path: public.handle_new_user() (redefined
-- by 20260918140000). Every other SECURITY DEFINER function already carries
-- search_path (public / public, pg_temp / "").
--  - SECURITY DEFINER trigger on auth.users INSERT.
--  - Body only references fully-qualified public.users / public.sub_admins /
--    public.user_role, so pinning to 'public' is safe and matches the
--    codebase hardening invariant. Pure metadata change: body (prosrc) is
--    untouched, so body-parity checks remain intact.

ALTER FUNCTION public.handle_new_user() SET search_path = 'public';

COMMIT;
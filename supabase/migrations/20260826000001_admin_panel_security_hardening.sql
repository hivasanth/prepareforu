-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Admin Panel security hardening (audit findings C-1, C-2, M-1)
--
-- 1. security_logs lockdown (C-1)
--    The table carried full DML grants for `anon` (INCLUDING TRUNCATE, which
--    BYPASSES row-level security) and its writer RPC log_security_event was
--    EXECUTE-granted to PUBLIC. Any anonymous caller could poison or destroy
--    the privileged-action audit trail. The only legitimate writers are the
--    service role (Edge Functions) and triggers running as the table owner:
--      - REVOKE all table privileges from anon + authenticated
--      - REVOKE EXECUTE on log_security_event from PUBLIC/anon/authenticated,
--        GRANT EXECUTE to service_role
--
-- 2. Signup role hardening (C-2)
--    handle_new_user trusted raw_user_meta_data->>'role'. The PUBLIC Supabase
--    signup endpoint accepts arbitrary user metadata, so a crafted signup
--    could insert itself as 'admin'. Every legitimate privileged account is
--    provisioned server-side AFTER creation (onboard-sub-admin Edge Function
--    grants sub_admin via service-role UPDATE; admins exist out-of-band), so
--    the trigger now ALWAYS assigns 'user' and ignores client-supplied role
--    metadata. All other metadata handling is preserved verbatim.
--
-- 3. search_path pinning (M-1)
--    SECURITY DEFINER functions without a pinned search_path are exposed to
--    search-path hijacking. Pin the three role-mutation DEFINERs that were
--    missing it. (prevent_self_demotion is SECURITY INVOKER — RLS applies.)
--
-- Append-only: no historical migration is modified.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1a. security_logs table lockdown ────────────────────────────────────────
REVOKE ALL ON TABLE public.security_logs FROM anon;
REVOKE ALL ON TABLE public.security_logs FROM authenticated;

-- ── 1b. log_security_event executable by service_role ONLY ─────────────────
REVOKE ALL ON FUNCTION public.log_security_event(text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, jsonb)
  TO service_role;

-- ── 2. handle_new_user — never trust client-supplied role metadata ─────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_coupon text;
    v_sub_admin_id uuid;
    v_educator_id uuid;
    v_full_name text;
    v_role_str text;
    v_exam_selection text;
BEGIN
    -- 1. Extract and sanitize metadata
    v_coupon := NULLIF(TRIM(new.raw_user_meta_data->>'coupon_code'), '');

    -- Safe UUID extraction for educator_id
    BEGIN
        v_educator_id := NULLIF(TRIM(new.raw_user_meta_data->>'educator_id'), '')::uuid;
    EXCEPTION WHEN others THEN
        v_educator_id := NULL;
    END;

    -- Safe Extract exam_selection as text directly
    v_exam_selection := NULLIF(TRIM(new.raw_user_meta_data->>'exam_selection'), '');

    v_full_name := COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1));

    -- SECURITY HARDENING (audit C-2): role is NEVER taken from client-
    -- controllable signup metadata. The public auth endpoint accepts
    -- arbitrary metadata, so trusting it allowed privilege escalation.
    -- Every new signup is a plain 'user'; privileged roles are granted
    -- exclusively through server-side authority after account creation
    -- (onboard-sub-admin Edge Function / promote_to_admin as admin).
    v_role_str := 'user';

    -- 2. If educator_id is provided, find sub_admin_id
    IF v_educator_id IS NOT NULL THEN
        SELECT id INTO v_sub_admin_id
        FROM public.sub_admins
        WHERE user_id = v_educator_id;
    END IF;

    -- 3. If no educator_id but coupon exists, find via coupon
    IF v_educator_id IS NULL AND v_coupon IS NOT NULL THEN
        SELECT id, user_id INTO v_sub_admin_id, v_educator_id
        FROM public.sub_admins
        WHERE coupon_code = v_coupon AND status = 'active';
    END IF;

    -- 4. Final insertion
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        coupon_code,
        sub_admin_id,
        educator_id,
        coupon_code_used,
        exam_selection,
        created_at
    )
    VALUES (
        new.id,
        new.email,
        v_full_name,
        v_role_str::public.user_role,
        v_coupon,
        v_sub_admin_id,
        v_educator_id,
        (v_coupon IS NOT NULL),
        v_exam_selection,
        now()
    );

    RETURN new;
END;
$function$;

-- ── 3. Pin search_path on unpinned SECURITY DEFINER role-mutation fns ───────
ALTER FUNCTION public.create_sub_admin(uuid, text)      SET search_path = 'public';
ALTER FUNCTION public.demote_from_admin(uuid)           SET search_path = 'public';
ALTER FUNCTION public.promote_to_admin(uuid)            SET search_path = 'public';
ALTER FUNCTION public.log_security_event(text, text, text, jsonb) SET search_path = 'public';

-- =============================================================================
--  Educator Linking RPC: link_user_to_educator
--  Allows an authenticated student user to self-claim an educator coupon code.
--  Security model:
--    * Uses auth.uid() — the authenticated user's UUID — NOT a client-supplied
--      user_id.  A user cannot link someone else's account.
--    * Coupon must exist in sub_admins with status = 'active'.
--    * Already-linked users (coupon_code_used = true AND sub_admin_id IS NOT NULL)
--      are rejected — prevents overwriting an existing educator association.
--    * SECURITY DEFINER so the UPDATE on the users table succeeds even though
--      RLS restricts public access.
--  Migration history: this file was added to match the remote schema; deploy
--  via:  npx supabase db query --linked --project-ref xbjhlfwqmcyatblsrhxn -f migration.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION public.link_user_to_educator(p_coupon_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id       uuid := auth.uid();
    v_coupon        text := NULLIF(TRIM(upper(p_coupon_code)), '');
    v_sub_admin_id  uuid;
    v_educator_id   uuid;
    v_full_name     text;
    v_already_linked boolean;
    v_result        jsonb;
BEGIN
    -- S-1: caller must be an authenticated user
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Not authenticated.'
        );
    END IF;

    -- S-2: coupon must be provided
    IF v_coupon IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Coupon code is required.'
        );
    END IF;

    -- S-3: look up the sub_admin by active coupon code
    SELECT id, user_id, full_name
    INTO   v_sub_admin_id, v_educator_id, v_full_name
    FROM   public.sub_admins
    WHERE  coupon_code = v_coupon
    AND    status = 'active';

    IF v_sub_admin_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired coupon code. Please check with your educator.'
        );
    END IF;

    -- S-4: prevent already-linked users from overwriting their educator
    SELECT true INTO v_already_linked
    FROM   public.users
    WHERE  id = v_user_id
    AND    coupon_code_used = true
    AND    sub_admin_id IS NOT NULL;

    IF v_already_linked THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Your account is already linked to an educator. You cannot change this.'
        );
    END IF;

    -- S-5: atomically update the user record
    UPDATE public.users
    SET    sub_admin_id      = v_sub_admin_id,
           educator_id       = v_educator_id,
           coupon_code       = v_coupon,
           coupon_code_used  = true,
           updated_at        = now()
    WHERE  id = v_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User account not found.'
        );
    END IF;

    RETURN jsonb_build_object(
        'success',         true,
        'educator_name',   v_full_name,
        'educator_id',     v_educator_id,
        'sub_admin_id',    v_sub_admin_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'An unexpected error occurred while linking your account.'
        );
END;
$$;

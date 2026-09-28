-- =============================================================================
-- MIGRATION: admin_remove_sub_admin — atomic educator removal (SA-4)
-- Date: 2026-08-25 (admin sub-admins remediation)
--
-- WHY THIS FILE EXISTS:
--   The service layer previously removed an educator in TWO client-sequenced
--   steps: (1) DELETE the sub_admins row, then (2) call
--   admin_revoke_sub_admin_role to revert users.role. If step 2 failed, the
--   account was left with role='sub_admin' while its profile row was gone —
--   a partial-success authorization state. This RPC performs both mutations
--   in ONE database transaction; any failure rolls back everything.
--
-- SEMANTICS (identical to the previous two-step flow, now atomic):
--   1. Caller must be an admin (auth.uid() + is_admin() — never trusted from
--      parameters).
--   2. Target profile must exist.
--   3. users.role reverted from 'sub_admin' to 'user' (no-op if already
--      demoted — removing a stale profile for a non-sub-admin remains valid).
--   4. sub_admins row deleted. Linked students are detached automatically by
--      the existing fk_users_sub_admin ON DELETE SET NULL constraint.
--
-- SECURITY:
--   SECURITY DEFINER is REQUIRED: the caller is an admin whose RLS profile on
--   sub_admins permits this, but users.role is no longer client-writable at
--   all (BE-2 column revokes) — only an owner-context function may touch it.
--   search_path is pinned to public (fixed-width, no injection surface).
--
-- IDEMPOTENT: CREATE OR REPLACE. Safe to re-apply.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_remove_sub_admin(
  p_sub_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- ── 1. Authorize the CALLER server-side ────────────────────────────────────
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only admins can remove educators.';
  END IF;

  -- ── 2. Resolve and lock the target profile ─────────────────────────────────
  SELECT user_id INTO v_user_id
  FROM public.sub_admins
  WHERE id = p_sub_admin_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Educator record not found.';
  END IF;

  -- ── 3. Revert the role (no-op when already 'user') ─────────────────────────
  UPDATE public.users
  SET role = 'user'
  WHERE id = v_user_id
    AND role = 'sub_admin';

  -- ── 4. Delete the profile row (FK detaches linked students) ────────────────
  DELETE FROM public.sub_admins
  WHERE id = p_sub_admin_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Educator record not found.';
  END IF;
END;
$$;

-- ─── Privileges: authenticated only (Supabase default grants EXECUTE to ──────
-- ─── anon explicitly, so PUBLIC-revoke alone would not deny anon). ───────────
REVOKE EXECUTE ON FUNCTION public.admin_remove_sub_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_remove_sub_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_remove_sub_admin(uuid) TO authenticated;

-- ─── Defense-in-depth: pin search_path on the legacy deactivate-only RPC ─────
-- (zero frontend consumers today; semantics unchanged, hardening only).
ALTER FUNCTION public.remove_sub_admin(uuid) SET search_path = public;

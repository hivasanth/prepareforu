-- =============================================================================
-- MIGRATION: sub-admin commission percentage (canonical single source)
-- Date: 2026-09-01 (master sub-admin commission implementation)
--
-- Implements the commission feature requested in the master production spec:
--   - ONE canonical field on public.sub_admins: commission_percentage
--   - Exact numeric type (numeric(5,2)) — NOT float, so no binary-fp drift.
--   - Business range 0.00 .. 100.00 inclusive, enforced by a DB CHECK
--     constraint (final protection on top of Edge Function + API validation).
--   - The provisioning RPC is extended to accept and persist commission in the
--     SAME atomic transaction as the sub_admins insert + role grant.
--   - A NEW admin-only RPC updates commission post-creation, with server-side
--     authorization (is_admin()) + range validation + optimistic concurrency
--     (the caller passes the updated_at it last saw; a mismatch is rejected so
--     stale Admin UI can never silently overwrite newer data).
--
-- SECURITY / AUTHORIZATION:
--   - create: folded into admin_create_sub_admin_profile (service_role-EXECUTE
--     ONLY — the caller must already be an admin, enforced by the Edge Function
--     JWT+role gate). The RPC still never trusts client-supplied ownership.
--   - update: admin_update_sub_admin_commission is SECURITY DEFINER and
--     self-authorizes via is_admin() — so only a DB-role admin can invoke it.
--     Sub-admins CANNOT modify their own (or anyone's) commission; students and
--     anonymous can neither read nor write it (RLS on sub_admins is unchanged;
--     students never have a sub_admins row to reach).
--   - read (Admin UI + self-select): commission_percentage is exposed to
--     authenticated (admin_all RLS) and to the sub-admin's own self-select row.
--     It is NOT exposed to students/anon (they cannot SELECT sub_admins).
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS + DO-block guarded constraint + CREATE
-- OR REPLACE. Safe to re-apply.
-- =============================================================================

-- ─── 1. Canonical column + CHECK constraint ─────────────────────────────────
-- numeric(5,2): 3 integer digits up to 999 plus 2 decimals; the CHECK narrows
-- the business-valid window to exactly [0.00, 100.00]. NOT NULL DEFAULT 0 keeps
-- pre-existing rows valid without a backfill.
ALTER TABLE public.sub_admins
  ADD COLUMN IF NOT EXISTS commission_percentage numeric(5,2) NOT NULL DEFAULT 0;

-- Guarded CHECK (DO-block) so re-application never errors on an existing
-- constraint name. Rejects negative AND > 100 (never silently clamps).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sub_admins_commission_percentage_range'
      AND conrelid = 'public.sub_admins'::regclass
  ) THEN
    ALTER TABLE public.sub_admins
      ADD CONSTRAINT sub_admins_commission_percentage_range
      CHECK (commission_percentage >= 0 AND commission_percentage <= 100);
  END IF;
END $$;

-- ─── 2. Explicit column privileges ──────────────────────────────────────────
-- Matching the sibling-column grants on sub_admins. RLS remains the row-level
-- gate: admins (admin_all) and the row owner (self_select) are the only roles
-- that can actually reach rows. service_role is the create-path writer.
GRANT SELECT (commission_percentage), INSERT (commission_percentage), UPDATE (commission_percentage)
  ON public.sub_admins TO authenticated, service_role;

-- ─── 3. Atomic create path ──────────────────────────────────────────────────
-- Extend admin_create_sub_admin_profile to accept + validate + persist
-- commission in the SAME transaction. Signature (params order preserved for
-- naming clarity; new param last so existing callers keep named-arg shape):
--   p_user_id, p_full_name, p_email, p_coupon_code, p_created_by,
--   p_request_id, p_commission_percentage
CREATE OR REPLACE FUNCTION public.admin_create_sub_admin_profile(
  p_user_id                 uuid,
  p_full_name               text,
  p_email                   text,
  p_coupon_code             text,
  p_created_by              uuid,
  p_request_id              text,
  p_commission_percentage   numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_admin_id uuid;
BEGIN
  -- 0a. Authoritative caller context (see 20260829000001) — re-establish the
  --     admin caller as the request subject so the role-escalation guard's
  --     intent (only admins may change roles) holds on the service-role path.
  PERFORM set_config('request.jwt.claim.sub', p_created_by::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', p_created_by::text)::text, true);

  -- 0b. Commission range validation — server-side, reject not clamp.
  IF p_commission_percentage IS NULL
     OR p_commission_percentage < 0
     OR p_commission_percentage > 100 THEN
    RAISE EXCEPTION 'INVALID_COMMISSION'
      USING ERRCODE = 'P0001';
  END IF;

  -- 0. Idempotency: replay resolves to the ORIGINAL profile.
  SELECT id INTO v_sub_admin_id
    FROM public.sub_admins
   WHERE provision_request_id = p_request_id
   FOR UPDATE;

  IF v_sub_admin_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.sub_admins WHERE id = v_sub_admin_id AND user_id = p_user_id) THEN
      RETURN v_sub_admin_id;            -- genuine replay -> idempotent success
    END IF;
    RAISE EXCEPTION 'ALREADY_PROVISIONED'
      USING ERRCODE = 'P0001';
  END IF;

  -- 1. The invited auth user MUST exist as a plain 'user' profile.
  SELECT id INTO v_sub_admin_id
    FROM public.users
   WHERE id = p_user_id AND email = p_email AND role = 'user'
   FOR UPDATE;

  IF v_sub_admin_id IS NULL THEN
    RAISE EXCEPTION 'USER_NOT_FOUND'
      USING ERRCODE = 'P0001';
  END IF;

  -- 2. Coupon must not belong to an ACTIVE educator.
  IF EXISTS (
    SELECT 1 FROM public.sub_admins
    WHERE coupon_code = p_coupon_code AND status = 'active'
    FOR UPDATE
  ) THEN
    RAISE EXCEPTION 'COUPON_TAKEN'
      USING ERRCODE = 'P0001';
  END IF;

  -- 3. Insert the profile WITH commission — same transaction as everything else.
  INSERT INTO public.sub_admins (
    user_id, full_name, email, coupon_code, status, created_by,
    provision_request_id, commission_percentage
  )
  VALUES (
    p_user_id, p_full_name, p_email, p_coupon_code, 'active', p_created_by,
    p_request_id, p_commission_percentage
  )
  RETURNING id INTO v_sub_admin_id;

  -- 4. Grant the role + link the profile — SAME transaction as step 3.
  UPDATE public.users
     SET role = 'sub_admin', sub_admin_id = v_sub_admin_id
   WHERE id = p_user_id AND role = 'user';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROLE_GRANT_FAILED'
      USING ERRCODE = 'P0001';
  END IF;

  -- 5. Transactional audit trail (same pattern as create_teacher_exam_atomic).
  PERFORM public.log_security_event(
    'sub_admin_onboarded',
    p_created_by::text,
    'info',
    jsonb_build_object(
      'user_id', p_user_id,
      'sub_admin_id', v_sub_admin_id,
      'request_id', p_request_id,
      'commission_percentage', p_commission_percentage
    )
  );

  RETURN v_sub_admin_id;
END;
$$;

-- EXECUTE: service_role ONLY (the RPC trusts caller-supplied user ids, so it
-- is a privilege-escalation primitive unless locked to the Edge Function's
-- service-role client, which already holds server-side admin authority).
REVOKE ALL ON FUNCTION public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text, numeric) FROM anon;
REVOKE ALL ON FUNCTION public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text, numeric) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text, numeric) TO service_role;

-- ─── 4. Admin-only commission UPDATE RPC (Phase 4/5) ────────────────────────
-- SECURITY DEFINER + self-authorizing via is_admin() (mirrors
-- admin_set_user_active / admin_remove_sub_admin): only a DB-role admin can
-- change ANY commission. Sub-admins are rejected here by is_admin()==false.
-- p_expected_updated_at (optional) implements optimistic concurrency: if the
-- caller last saw an updated_at, and it no longer matches, the row changed
-- under them -> we refuse to clobber the newer value.
CREATE OR REPLACE FUNCTION public.admin_update_sub_admin_commission(
  p_sub_admin_id        uuid,
  p_commission          numeric,
  p_expected_updated_at timestamptz DEFAULT NULL
)
RETURNS public.sub_admins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.sub_admins%ROWTYPE;
  v_updated_at timestamptz;
BEGIN
  -- Authorize: authenticated caller must be an admin (server-side truth).
  IF auth.uid() IS NULL OR NOT is_admin() THEN
    RAISE EXCEPTION 'UNAUTHORIZED'
      USING ERRCODE = 'P0001';
  END IF;

  -- Validate range (reject, never clamp).
  IF p_commission IS NULL OR p_commission < 0 OR p_commission > 100 THEN
    RAISE EXCEPTION 'INVALID_COMMISSION'
      USING ERRCODE = 'P0001';
  END IF;

  -- Lock the row; verify it exists.
  SELECT * INTO v_row
    FROM public.sub_admins
   WHERE id = p_sub_admin_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SUB_ADMIN_NOT_FOUND'
      USING ERRCODE = 'P0001';
  END IF;

  -- Optimistic concurrency: if the caller supplied a stale snapshot, refuse.
  IF p_expected_updated_at IS NOT NULL
     AND v_row.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'CONCURRENT_UPDATE_CONFLICT'
      USING ERRCODE = 'P0001';
  END IF;

  -- Apply + audit in the same transaction.
  UPDATE public.sub_admins
     SET commission_percentage = p_commission,
         updated_at = now()
   WHERE id = p_sub_admin_id
   RETURNING * INTO v_row;

  PERFORM public.log_security_event(
    'sub_admin_commission_updated',
    auth.uid()::text,
    'info',
    jsonb_build_object(
      'sub_admin_id', p_sub_admin_id,
      'previous', v_row.commission_percentage,
      'updated', p_commission,
      'request_time', now()
    )
  );

  RETURN v_row;
END;
$$;

-- EXECUTE: authenticated ONLY (self-authorizes is_admin()). Deny anon + PUBLIC.
REVOKE ALL ON FUNCTION public.admin_update_sub_admin_commission(uuid, numeric, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_sub_admin_commission(uuid, numeric, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.admin_update_sub_admin_commission(uuid, numeric, timestamptz) FROM service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_sub_admin_commission(uuid, numeric, timestamptz) TO authenticated;

-- ─── 5. Remove the orphaned 6-arg overload (pre-commission) ────────────────
-- The commission migration REPLACED the create path with the 7-arg signature;
-- the old 6-arg overload is dead and would be a reproducibility hazard (two
-- canonical create paths). The Edge Function is updated to the 7-arg form in
-- the same release. DROP is guarded (IF EXISTS) and safe to re-run.
DROP FUNCTION IF EXISTS public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text);

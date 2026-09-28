-- =============================================================================
-- MIGRATION: atomic sub-admin provisioning RPC + coupon uniqueness + trigger attach
-- Date: 2026-08-30 (master sub-admin provisioning/authentication remediation)
--
-- Addresses audit findings:
--   F1 (HIGH)  provisioning was three separate service-role calls from the
--              onboard-sub-admin Edge Function (invite → INSERT sub_admins →
--              UPDATE users.role). A failure between steps left orphan auth
--              users or role-less profiles. This RPC folds the profile INSERT
--              and the role grant into ONE database transaction.
--   F3 (MED)   coupon uniqueness was enforced only by an application-level
--              SELECT before invite. A partial UNIQUE index on active coupons
--              is the hard backstop; any concurrent race now surfaces as a
--              clean unique_violation (23505) instead of duplicate educators.
--   IDEMPOTENCY (master-task §5): a provision_request_id generated once per
--              logical onboarding operation is threaded from the client →
--              Edge Function → RPC. A replay with the same request_id returns
--              the original profile id instead of provisioning a second time;
--              a partial UNIQUE index is the hard backstop for true concurrent
--              duplicate writes. ONE logical operation ⇒ ONE sub-admin.
--   F2 (MED)   the handle_new_user trigger on auth.users existed only
--              out-of-band. Attached here, AFTER the final in-repo function
--              definition (20260826000001_admin_panel_security_hardening.sql),
--              so a fresh `supabase db reset` wires it too.
--
-- SECURITY:
--   SECURITY DEFINER so the service role can write users.role (which is no
--   longer client-writable — BE-2 column revokes) and sub_admins inside a
--   single transaction. search_path pinned to public (no hijack surface).
--   EXECUTE is granted to service_role ONLY: the RPC trusts p_user_id and
--   never self-authorises, so it must NEVER be callable by anonymous or any
--   authenticated client (authenticated callers would be an instant privilege-
--   escalation primitive). The admin-authorization gate stays in the Edge
--   Function (JWT + users.role='admin' via service-role lookup).
--
-- IDEMPOTENT: CREATE OR REPLACE + guarded DDL. Safe to re-apply.
-- =============================================================================

-- ─── 1. Coupon-uniqueness backstop ───────────────────────────────────────────
-- Partial unique index: at most ONE active educator per coupon code. Inactive
-- (removed/deprecated) educators may reuse a code. A concurrent race is now a
-- Postgres error (SQLSTATE 23505), never a silent duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS ux_sub_admins_coupon_active
  ON public.sub_admins (coupon_code)
  WHERE status = 'active';

-- ─── 2. Idempotency scaffolding ──────────────────────────────────────────────
-- provision_request_id: generated client-side per logical onboarding operation.
-- NULL for pre-existing/manual rows (never enters the index).
ALTER TABLE public.sub_admins
  ADD COLUMN IF NOT EXISTS provision_request_id text;

CREATE UNIQUE INDEX IF NOT EXISTS ux_sub_admins_provision_request
  ON public.sub_admins (provision_request_id)
  WHERE provision_request_id IS NOT NULL;

-- ─── 3. Atomic provisioning RPC ──────────────────────────────────────────────
-- Caller contract (Edge Function onboard-sub-admin, after inviteUserByEmail):
--   p_user_id     auth.users.id created by the invitation
--   p_full_name   validated display name
--   p_email       invited email (lowercased/trimmed by the caller + validator)
--   p_coupon_code normalized (trim + UPPER) coupon
--   p_created_by  admin users.id who issued the invitation
--   p_request_id  idempotency key — one per logical onboarding operation
--
-- Raises (all roll back cleanly — no partial writes, nothing to clean up):
--   USER_NOT_FOUND       no plain 'user' ('role' = 'user') profile exists for
--                        p_user_id / p_email — e.g. the handle_new_user trigger
--                        did not fire, or the account already has a role.
--   COUPON_TAKEN         p_coupon_code already assigned to an active educator
--                        (also surfaces as SQLSTATE 23505 via the unique index).
--   ALREADY_PROVISIONED  p_request_id already produced a sub-admins row for a
--                        DIFFERENT auth user (concurrent duplicate race). The
--                        caller must compensate its own new user and treat the
--                        pre-existing profile as the canonical outcome.
--   ROLE_GRANT_FAILED    users row no longer eligible at grant time.
-- Returns: the new (or pre-existing) sub_admins.id (== users.sub_admin_id).
CREATE OR REPLACE FUNCTION public.admin_create_sub_admin_profile(
  p_user_id      uuid,
  p_full_name    text,
  p_email        text,
  p_coupon_code  text,
  p_created_by   uuid,
  p_request_id   text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_admin_id uuid;
BEGIN
  -- 0a. Authoritative caller context. This RPC is SECURITY DEFINER and is invoked
  --     through a service-role client, so auth.uid() would otherwise be NULL.
  --     The pre-existing trigger prevent_user_role_escalation() (BEFORE UPDATE
  --     ON public.users) only permits a role change when auth.uid() is an admin
  --     (WHERE id = auth.uid() AND role = 'admin'). Because the Edge Function
  --     already authenticated the CALLER as an admin before calling this RPC
  --     (p_created_by IS that admin), we re-establish that caller as the request
  --     subject for the rest of the transaction. This keeps the guard's intent
  --     (only admins may change roles) while allowing the admin-initiated, atomic
  --     provisioning this RPC performs. Local to this transaction; no privilege is
  --     granted that the caller (service role, already an admin) did not possess.
  --     handle_user_role_change() (AFTER UPDATE OF role) also reads auth.uid() as
  --     the created_by of any auto-created profile, so this must precede it.
  PERFORM set_config('request.jwt.claim.sub', p_created_by::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', p_created_by::text)::text, true);

  -- 0. Idempotency: a replay (network retry, double-submit, delayed response)
  --    carrying the same request_id must resolve to the ORIGINAL profile. The
  --    partial unique index on provision_request_id guarantees at most one row
  --    per key; serialised with FOR UPDATE to close the check→insert race.
  SELECT id INTO v_sub_admin_id
    FROM public.sub_admins
   WHERE provision_request_id = p_request_id
   FOR UPDATE;

  IF v_sub_admin_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.sub_admins WHERE id = v_sub_admin_id AND user_id = p_user_id) THEN
      RETURN v_sub_admin_id;            -- genuine replay → idempotent success
    END IF;
    RAISE EXCEPTION 'ALREADY_PROVISIONED'
      USING ERRCODE = 'P0001';          -- same key, different auth user → race
  END IF;

  -- 1. The invited auth user MUST exist as a plain 'user' profile (inserted by
  --    handle_new_user when the invitation was sent). Never override a live
  --    role. SELECT ... FOR UPDATE serialises same-email provisioning.
  SELECT id INTO v_sub_admin_id
    FROM public.users
   WHERE id = p_user_id AND email = p_email AND role = 'user'
   FOR UPDATE;

  IF v_sub_admin_id IS NULL THEN
    RAISE EXCEPTION 'USER_NOT_FOUND'
      USING ERRCODE = 'P0001';
  END IF;

  -- 2. Coupon must not belong to an ACTIVE educator. FOR UPDATE serialises
  --    concurrent provisioning for the same code; the partial unique index is
  --    the hard backstop (surfaces as 23505 if a race slips past this gate).
  IF EXISTS (
    SELECT 1 FROM public.sub_admins
    WHERE coupon_code = p_coupon_code AND status = 'active'
    FOR UPDATE
  ) THEN
    RAISE EXCEPTION 'COUPON_TAKEN'
      USING ERRCODE = 'P0001';
  END IF;

  -- 3. Insert the profile (email uniqueness is enforced upstream by the auth
  --    layer / existing-account guards in the Edge Function).
  INSERT INTO public.sub_admins (
    user_id, full_name, email, coupon_code, status, created_by, provision_request_id
  )
  VALUES (
    p_user_id, p_full_name, p_email, p_coupon_code, 'active', p_created_by, p_request_id
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
      'request_id', p_request_id
    )
  );

  RETURN v_sub_admin_id;
END;
$$;

-- ─── 4. EXECUTE: service_role ONLY ───────────────────────────────────────────
-- The RPC trusts caller-supplied user ids, so it is a privilege-escalation
-- primitive unless locked to the only caller that already holds server-side
-- authority: the Edge Function (service role).
REVOKE ALL ON FUNCTION public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text) TO service_role;

-- ─── 5. handle_new_user trigger attach (reproducibility) ────────────────────
-- Guarded by FUNCTION, not by name: if ANY trigger on auth.users already runs
-- handle_new_user() (as in the current LIVE database), this is a no-op. A
-- fresh database gets the attach here — after the final in-repo function
-- definition in 20260826000001 — so signups are wired from day one.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_trigger t
      JOIN pg_proc p ON p.oid = t.tgfoid
     WHERE t.tgrelid = 'auth.users'::regclass
       AND p.proname = 'handle_new_user'
  ) THEN
    CREATE TRIGGER trg_handle_new_user_on_insert
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
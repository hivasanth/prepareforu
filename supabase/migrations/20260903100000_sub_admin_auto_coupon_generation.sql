-- =============================================================================
-- MIGRATION: server-authoritative automatic coupon generation
-- Date: 2026-09-03 (sub-admin onboarding — auto-coupon + invite hardening)
--
-- WHAT THIS ADDS
--   The Admin "Onboard New Educator" flow previously REQUIRED the admin to
--   type a coupon code (min 3 chars, validated client + Edge Function + RPC).
--   This migration makes the coupon OPTIONAL by generating one on the DB,
--   server-authoritatively, INSIDE the same atomic transaction as the
--   sub_admins insert + role grant.
--
-- WHY IN THE DATABASE (not the Edge Function / client)
--   * The DB owns the uniqueness contract (the partial unique index
--     ux_sub_admins_coupon_active is the hard backstop). Generating the code in
--     the same transaction as the INSERT removes every EF<->DB race window:
--     there is NO "generate-check-insert" gap for a concurrent request to
--     slip through, because generation + enforcement happen atomically.
--   * Coupons are NEVER derived from user ids / emails / sequential counters,
--     and never from Math.random() in the client. They come from
--     gen_random_bytes (crypto), so they are unpredictable and unguessable.
--   * Format matches the existing app convention (e.g. PPTYHU1Y): 8 uppercase
--     alphanumeric characters, no prefix — validated/consumed by exact match in
--     validate_coupon / link_user_to_educator.
--
-- COLLISION SAFETY
--   * The RPC wraps the INSERT in an implicit subtransaction
--     (BEGIN ... EXCEPTION WHEN unique_violation) and, FOR AN AUTO-GENERATED
--     code ONLY, retries with a fresh code when a unique_violation (23505) is
--     raised against the partial index. Retry count is bounded (MAX 8); on
--     exhaustion the RPC raises COUPON_GENERATION_EXHAUSTED and the whole
--     transaction rolls back (no partial write, no orphan profile).
--     (An explicit SAVEPOINT / ROLLBACK TO SAVEPOINT is deliberately NOT used:
--     PL/pgSQL on this platform cannot parse `ROLLBACK TO` in a function body —
--     verified server `syntax error at or near "TO"` — so the subtransaction
--     form is the deployable equivalent with identical atomicity + retry.)
--   * For an ADMIN-SUPPLIED code the SAVEPOINT retry is NOT used: a collision
--     still raises the canonical COUPON_TAKEN (same contract as before).
--   * gen_sub_admin_coupon uses a 32-char unambiguous alphabet and 8*32=256
--     possible byte values, so get_byte(...) % 32 is unbiased.
--
-- IDEMPOTENT: CREATE OR REPLACE + guarded DDL. Safe to re-apply.
-- =============================================================================

-- ─── 1. Crypto coupon generator ──────────────────────────────────────────────
-- 8 uppercase alphanumeric chars from an unambiguous 32-char set (excludes
-- 0/1/O/I to avoid admin/student transcription mistakes). SECURITY DEFINER with
-- pinned search_path; no args. Uses pgcrypto's gen_random_bytes, called with an
-- EXPLICIT `extensions.` schema qualifier because pgcrypto installs into the
-- `extensions` schema on this platform and the function's pinned search_path
-- (public, pg_temp) does NOT include it — an unqualified call fails at runtime
-- with "function gen_random_bytes(integer) does not exist". Never Math.random/IDs.
CREATE OR REPLACE FUNCTION public.gen_sub_admin_coupon()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_bytes    bytea;
  v_coupon   text := '';
  v_i        int;
  v_charset  constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN
  FOR v_i IN 1..8 LOOP
    v_bytes := extensions.gen_random_bytes(1);
    v_coupon := v_coupon || substr(v_charset, (get_byte(v_bytes, 0) % 32) + 1, 1);
  END LOOP;
  RETURN v_coupon;
END;
$$;

-- gen_random_bytes lives in pgcrypto. Ensure it is installed so the function
-- does not fail at runtime. Guarded (IF NOT EXISTS) — idempotent.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── 2. Extend the atomic create RPC: optional coupon + bounded auto-gen ─────
-- Signature UNCHANGED (7-arg, same param order) so every existing caller and
-- the EXECUTE-grant contract from 20260901000000 remain valid:
--   p_user_id, p_full_name, p_email, p_coupon_code, p_created_by,
--   p_request_id, p_commission_percentage
--
-- Semantics change: p_coupon_code may now be '' or NULL, meaning
-- "auto-generate a unique coupon for me". The INSERT runs inside a SAVEPOINT;
-- on unique_violation the generated code is retried (bounded) BEFORE the role
-- grant, so the whole op stays atomic and collision-safe.
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
  v_coupon       text;
  v_supplied     boolean;
  v_attempt      int := 0;
  v_max_attempts constant int := 8;
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

  -- 2. Coupon contract.
  --    Supplied (non-empty): normalize + pre-check (FOR UPDATE serialises); a
  --    collision raises the canonical COUPON_TAKEN.
  --    Not supplied ('' / NULL): v_coupon is generated below inside the
  --    SAVEPOINT retry loop, with the partial unique index as the hard gate.
  v_supplied := p_coupon_code IS NOT NULL AND btrim(p_coupon_code) <> '';
  IF v_supplied THEN
    v_coupon := upper(btrim(p_coupon_code));
    IF EXISTS (
      SELECT 1 FROM public.sub_admins
      WHERE coupon_code = v_coupon AND status = 'active'
      FOR UPDATE
    ) THEN
      RAISE EXCEPTION 'COUPON_TAKEN'
        USING ERRCODE = 'P0001';
    END IF;
  ELSE
    v_coupon := public.gen_sub_admin_coupon();
  END IF;

--  3. Insert the profile (WITH commission) — SAME transaction. For an
--    auto-generated code, a 23505 against the partial unique index is
--    recovered by retry (bounded) inside an implicit subtransaction
--    (BEGIN ... EXCEPTION WHEN unique_violation), the canonical PL/pgSQL
--    pattern. NOTE: an explicit SAVEPOINT / ROLLBACK TO SAVEPOINT is NOT used
--    here because PL/pgSQL cannot parse `ROLLBACK TO` inside a function body on
--    this platform (verified: server `syntax error at or near "TO"`), so the
--    subtransaction form is required to be deployable. It yields identical
--    atomicity + bounded-retry semantics. For a supplied code we do not retry:
--    a collision is already COUPON_TAKEN via the pre-check index gate.
  LOOP
    v_attempt := v_attempt + 1;
    BEGIN
      -- Implicit subtransaction (no SAVEPOINT keyword needed)
      INSERT INTO public.sub_admins (
        user_id, full_name, email, coupon_code, status, created_by,
        provision_request_id, commission_percentage
      )
      VALUES (
        p_user_id, p_full_name, p_email, v_coupon, 'active', p_created_by,
        p_request_id, p_commission_percentage
      )
      RETURNING id INTO v_sub_admin_id;
      EXIT;                             -- success
    EXCEPTION WHEN unique_violation THEN
      -- Subtransaction rolled back automatically; re-check the retry budget.
      IF v_supplied THEN
        RAISE EXCEPTION 'COUPON_TAKEN'
          USING ERRCODE = 'P0001';
      END IF;
      IF v_attempt >= v_max_attempts THEN
        RAISE EXCEPTION 'COUPON_GENERATION_EXHAUSTED'
          USING ERRCODE = 'P0001';
      END IF;
      v_coupon := public.gen_sub_admin_coupon();
    END;
  END LOOP;

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
      'commission_percentage', p_commission_percentage,
      'coupon_auto_generated', NOT v_supplied
    )
  );

  RETURN v_sub_admin_id;
END;
$$;

-- ─── 3. EXECUTE: service_role ONLY (unchanged contract) ─────────────────────
-- The RPC trusts caller-supplied user ids, so it must NEVER be client-callable.
REVOKE ALL ON FUNCTION public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text, numeric) FROM anon;
REVOKE ALL ON FUNCTION public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text, numeric) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_sub_admin_profile(uuid, text, text, text, uuid, text, numeric) TO service_role;

-- gen_sub_admin_coupon is an internal helper invoked only inside the
-- service_role-EXECUTE RPC. Lock it to service_role too so it is not a public
-- coupon-factory primitive.
REVOKE ALL ON FUNCTION public.gen_sub_admin_coupon() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.gen_sub_admin_coupon() FROM anon;
REVOKE ALL ON FUNCTION public.gen_sub_admin_coupon() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.gen_sub_admin_coupon() TO service_role;

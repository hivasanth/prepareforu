-- ============================================================================
-- P0-03 — SECURE REFERRAL / COMMISSION ATTRIBUTION
--
-- Vulnerability
-- -------------
-- public.handle_new_user() (AFTER INSERT ON auth.users) read
-- raw_user_meta_data->>'educator_id' and used it to create referral
-- attribution:
--
--   * the client-supplied UUID was looked up against public.sub_admins
--     WITHOUT requiring status = 'active', so an inactive educator could
--     receive attribution;
--   * the client-supplied UUID was written straight into
--     public.users.educator_id, so ANY users.id could be asserted as an
--     educator;
--   * when a sub_admins row happened to match, sub_admin_id and
--     coupon_code_used were also written, which fed
--     trg_update_referrals -> public.update_sub_admin_referrals() and
--     inflated sub_admins.total_referrals — the commission-bearing
--     counter — and unlocked the educator RLS SELECT policy and
--     _pf_teacher_exam_access.
--
-- Any anonymous signup could therefore forge referral attribution.
--
-- Fix
-- ---
-- 1. handle_new_user(): metadata educator_id is ignored completely. Attribution
--    is derived server-side, and only from a coupon that matches an ACTIVE
--    sub_admins row. No new tables, columns, functions, or triggers.
-- 2. handle_user_role_change(): minimal pre-existing-bug fix. The demotion
--    branch has no TG_OP guard, so on INSERT with role='user' it ran
--      UPDATE public.users SET sub_admin_id = NULL WHERE id = NEW.id;
--    and erased the sub_admin_id that handle_new_user() had just written
--    (trg_update_referrals fires BEFORE trg_user_role_change, so the counter
--    saw the correct value and the erasure was invisible from the counter).
--    Restricting that branch to TG_OP = 'UPDATE' preserves demotion and
--    promotion behaviour while leaving insert-time attribution intact.
-- 3. admin_remove_sub_admin(): explicitly clear students' educator_id before
--    deleting the profile. sub_admin_id already detaches automatically via
--    ON DELETE SET NULL; educator_id does not, because it references users(id)
--    and the educator's users row survives as deactivated_sub_admin.
-- 4. remove_sub_admin(): clear educator_id and reset coupon_code_used, and
--    retain coupon_code. Retaining the coupon is a deliberate behaviour
--    change: it preserves the referral receipt shown in the sub-admin student
--    detail view, and it is safe because authorisation is decided by
--    coupon_code_used plus the server-side status='active' lookup in
--    link_user_to_educator(), never by the stored coupon string.
-- 5. Least-privilege EXECUTE: revoke direct anon/authenticated EXECUTE on the
--    three trigger/helper functions. PostgreSQL does not require EXECUTE on a
--    trigger function in order to fire the trigger, so this is a
--    privilege-REDUCING change only; it grants nothing.
--    Note on service_role: this migration deliberately does NOT re-grant
--    EXECUTE to service_role. 20260910000002_defense_in_depth_grants_hardening
--    already revoked EXECUTE from PUBLIC on these functions, which removed the
--    default grant for every non-owner role — so in the effective catalog the
--    only role holding EXECUTE is the owner (postgres). This is intentional and
--    correct: these are trigger functions with no runtime RPC caller, and
--    trigger invocation does not require EXECUTE. Adding a service_role grant
--    merely to satisfy documentation would widen the ACL for no benefit.
--
-- Explicitly NOT changed
-- ---------------------
--   public.prevent_user_role_escalation()  — widening its revert list to
--     sub_admin_id / coupon_code / coupon_code_used would silently revert the
--     legitimate server-authorized writes performed by remove_student()
--     and remove_sub_admin(), which are not is_admin() gated. Deferred.
--   public.link_user_to_educator(text)     — already correct.
--   public.validate_coupon(text)           — educator_id removal is a
--     separate follow-up; the anon grant is required for pre-auth signup.
--   public.admin_create_sub_admin_profile(), public.remove_student(),
--   public.admin_revoke_sub_admin_role(), RLS policies, column grants.
--   All subscription / payment / entitlement objects and RPCs.
--
-- This migration contains no data repair and no DML against production rows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Guard: run only if the objects this migration redefines actually exist.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regprocedure('public.handle_new_user()') IS NULL
     OR to_regprocedure('public.handle_user_role_change()') IS NULL
     OR to_regprocedure('public.admin_remove_sub_admin(uuid)') IS NULL
     OR to_regprocedure('public.remove_sub_admin(uuid)') IS NULL THEN
    RAISE EXCEPTION 'P0_03_ABORT: expected public objects missing; refusing to redefine'
      USING ERRCODE = 'P0001';
  END IF;
END $$;

-- ============================================================================
-- 1. handle_new_user() — metadata educator_id has zero authority.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
DECLARE
    v_coupon text;
    v_sub_admin_id uuid;
    v_educator_id uuid;
    v_full_name text;
    v_role_str text;
    v_exam_selection text;
BEGIN
    -- 1. Coupon is normalized server-side to the canonical upper+btrim form so
    --    it matches verbatim against sub_admins.coupon_code, exactly as
    --    validate_coupon() and link_user_to_educator() resolve it.
    --
    --    SECURITY (P0-03): the raw metadata educator id key is deliberately
    --    NOT read. The public signup endpoint accepts arbitrary metadata, so a
    --    client-asserted educator id is not an authority. The only accepted
    --    attribution input is the coupon, and only as a lookup key below.
    v_coupon := NULLIF(upper(btrim(new.raw_user_meta_data->>'coupon_code')), '');

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

    -- 2. Server-authoritative attribution. Resolve the educator ONLY from a
    --    coupon that matches an ACTIVE sub_admins row.
    --
    --    A missing, malformed, unknown, or inactive-owner coupon yields no
    --    match, so all attribution variables stay NULL and the signup simply
    --    completes with no referral attribution.
    IF v_coupon IS NOT NULL THEN
        SELECT id, user_id INTO v_sub_admin_id, v_educator_id
        FROM public.sub_admins
        WHERE coupon_code = v_coupon AND status = 'active';
    END IF;

    -- 3. Final insertion. coupon_code_used reflects whether an ACTIVE coupon
    --    actually resolved, so a rejected code cannot lock a user out of the
    --    post-signup link_user_to_educator() self-service path.
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
        (v_sub_admin_id IS NOT NULL),
        v_exam_selection,
        now()
    );

    RETURN new;
END;
$function$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'P0-03: signup attribution is derived server-side from an ACTIVE coupon only. raw_user_meta_data->>''educator_id'' is ignored.';

-- ============================================================================
-- 2. handle_user_role_change() — minimal INSERT-clobber fix.
--
--    The demotion branch previously had no TG_OP guard, so on INSERT with
--    role='user' it nulled sub_admin_id that handle_new_user() had just
--    written, breaking valid coupon signup and leaving total_referrals stale.
--    Promotion (user -> sub_admin) and demotion (sub_admin -> user) are both
--    UPDATE-driven and are unchanged.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_user_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
DECLARE
  v_sa_id uuid;
  v_caller_id uuid;
BEGIN
  -- For updates, only act when the role actually changes
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role IS NOT DISTINCT FROM NEW.role THEN
      RETURN NEW;
    END IF;
  END IF;

  -- ── Promotion to Sub-Admin / Insertion of Sub-Admin ──────────────────────────
  IF NEW.role = 'sub_admin' THEN
    v_caller_id := COALESCE(
      auth.uid(),
      '833df519-0ac4-4f93-bf8b-d18ca59278a6'::uuid
    );

    -- Check if a sub_admins profile already exists for this user
    SELECT id INTO v_sa_id
    FROM public.sub_admins
    WHERE user_id = NEW.id;

    IF v_sa_id IS NULL THEN
      -- Auto-create a sub_admins profile so the account is immediately functional
      INSERT INTO public.sub_admins (
        user_id,
        full_name,
        email,
        coupon_code,
        created_by,
        status
      )
      VALUES (
        NEW.id,
        NEW.full_name,
        NEW.email,
        'EDU' || upper(left(replace(gen_random_uuid()::text, '-', ''), 6)),
        v_caller_id,
        'active'
      )
      RETURNING id INTO v_sa_id;
    END IF;

    -- Update users table with the sub_admin_id and clear educator_id
    UPDATE public.users
    SET sub_admin_id = v_sa_id,
        educator_id = NULL
    WHERE id = NEW.id;

  -- ── Promotion to Admin / Insertion of Admin ──────────────────────────────────
  ELSIF NEW.role = 'admin' THEN
    UPDATE public.users
    SET sub_admin_id = NULL,
        educator_id = NULL
    WHERE id = NEW.id;

  -- ── Demotion back to User / Insertion of User ────────────────────────────────
  --
  -- P0-03 FIX: this branch must run on UPDATE only. On INSERT it fired for
  -- every new signup and executed
  --   UPDATE public.users SET sub_admin_id = NULL WHERE id = NEW.id;
  -- erasing the coupon-derived sub_admin_id written moments earlier by
  -- handle_new_user(), so valid coupon signup produced educator_id without
  -- sub_admin_id and left total_referrals uncounted. The demotion cleanup is
  -- preserved verbatim for the UPDATE (sub_admin -> user) transition.
  ELSIF NEW.role = 'user' AND TG_OP = 'UPDATE' THEN
    UPDATE public.users
    SET sub_admin_id = NULL
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.handle_user_role_change() IS
  'P0-03: demotion cleanup restricted to UPDATE so INSERT-time coupon attribution is not clobbered.';

-- ============================================================================
-- 3. admin_remove_sub_admin() — attribution consistency on removal.
--
--    fk_users_sub_admin is ON DELETE SET NULL, so students' sub_admin_id
--    already detaches automatically. educator_id does NOT: it references
--    users(id) and the educator's users row survives as
--    deactivated_sub_admin, which would leave students attributed to a
--    removed educator and still satisfy the educator RLS SELECT policy.
--    Clear it explicitly in the same transaction, before the profile DELETE.
--    coupon_code is retained as the historical referral receipt;
--    coupon_code_used is reset so the student can re-link to a new active
--    educator via link_user_to_educator().
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_remove_sub_admin(p_sub_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  -- ── 1. Authorize the CALLER server-side ────────────────────────────────
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only admins can remove educators.';
  END IF;

  -- ── 2. Resolve and lock the target profile ───────────────────────────
  SELECT user_id INTO v_user_id
  FROM public.sub_admins
  WHERE id = p_sub_admin_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Educator record not found.';
  END IF;

  -- ── 3. Archive the role: a removed educator must NEVER return to the
  --      student pool ('user'). The distinct role also disables every login
  --      path (no guard allow-lists it) and excludes them from the Users page.
  UPDATE public.users
  SET role = 'deactivated_sub_admin'
  WHERE id = v_user_id
    AND role = 'sub_admin';

  -- ── 4. Detach student attribution (P0-03) ──────────────────────────────
  --      sub_admin_id is detached automatically by the
  --      fk_users_sub_admin ON DELETE SET NULL clause in step 5. educator_id
  --      is NOT covered by that FK (it targets users(id), and this educator's
  --      users row survives), so it is cleared here to avoid leaving students
  --      attributed to a removed educator. coupon_code is retained as
  --      historical information; coupon_code_used is reset so the student may
  --      legitimately self-link to a new active educator later.
  UPDATE public.users
  SET educator_id = NULL,
      coupon_code_used = false
  WHERE educator_id = v_user_id;

  -- ── 5. Delete the profile row (FK detaches linked students) ────────────
  DELETE FROM public.sub_admins
  WHERE id = p_sub_admin_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Educator record not found.';
  END IF;
END;
$function$;

COMMENT ON FUNCTION public.admin_remove_sub_admin(uuid) IS
  'P0-03: clears educator_id and resets coupon_code_used on detached students; retains coupon_code as history.';

-- ============================================================================
-- 4. remove_sub_admin() — attribution consistency on deactivation.
--
--    Two deliberate behaviour changes, approved in Phase 2 and not
--    security-only:
--      * educator_id is now cleared alongside sub_admin_id;
--      * coupon_code is RETAINED rather than nulled, and coupon_code_used is
--        reset so the student can re-link to a new active educator.
--    The existing is_admin() authorization, role handling, status
--    deactivation and return payload are unchanged.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.remove_sub_admin(p_sub_admin_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
DECLARE
  v_sub_admin public.sub_admins%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can remove sub admins.';
  END IF;

  SELECT * INTO v_sub_admin
  FROM public.sub_admins
  WHERE id = p_sub_admin_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Sub admin not found.');
  END IF;

  -- Demote user role back to user
  UPDATE public.users
  SET role = 'user'
  WHERE id = v_sub_admin.user_id;

  -- Unlink all users from this sub admin
  -- They lose teacher exam access but keep their accounts.
  -- P0-03: educator_id is cleared here too (it was previously left pointing
  -- at a now-inactive educator), coupon_code is retained as the historical
  -- referral receipt, and coupon_code_used is reset so the student can
  -- re-link to a new active educator via link_user_to_educator().
  UPDATE public.users
  SET sub_admin_id = NULL,
      educator_id = NULL,
      coupon_code_used = false
  WHERE sub_admin_id = p_sub_admin_id;

  -- Deactivate sub admin record
  UPDATE public.sub_admins
  SET status = 'inactive'
  WHERE id = p_sub_admin_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Sub admin removed. Linked users unlinked. Past attempts preserved.'
  );
END;
$function$;

COMMENT ON FUNCTION public.remove_sub_admin(uuid) IS
  'P0-03: clears educator_id, resets coupon_code_used, retains coupon_code as history on deactivation.';

-- ============================================================================
-- 5. Least-privilege EXECUTE on trigger/helper functions.
--
--    These are trigger functions with no runtime caller in application
--    source. PostgreSQL does not require EXECUTE on a trigger function for
--    the trigger to fire, so revoking direct client EXECUTE does not affect
--    trigger behaviour; canonical triggering via trg_update_referrals keeps
--    working unchanged.
--
--    Effective ACL after this migration: the ONLY role holding EXECUTE on
--    these three functions is the owner (postgres). anon and authenticated are
--    revoked here; PUBLIC (and therefore service_role) was already revoked by
--    20260910000002_defense_in_depth_grants_hardening. This migration grants
--    nothing and re-grants nothing — least privilege is preserved and the
--    canonical trigger path is unaffected.
--    Re-running the migration is safe: REVOKE is idempotent.
-- ============================================================================
REVOKE ALL ON FUNCTION public.sync_sub_admin_coupon_to_users() FROM anon;
REVOKE ALL ON FUNCTION public.sync_sub_admin_coupon_to_users() FROM authenticated;

REVOKE ALL ON FUNCTION public.update_sub_admin_referrals() FROM anon;
REVOKE ALL ON FUNCTION public.update_sub_admin_referrals() FROM authenticated;

REVOKE ALL ON FUNCTION public.trg_notify_on_new_student() FROM anon;
REVOKE ALL ON FUNCTION public.trg_notify_on_new_student() FROM authenticated;

-- ============================================================================
-- Verification (read-only; produces no rows to insert and mutates nothing).
-- ============================================================================
DO $$
DECLARE
  v_src text;
BEGIN
  -- The trigger must not read the educator id out of signup metadata.
  -- Match the exact JSON access path; a loose 'educator_id%''' pattern would
  -- also match the legitimate v_educator_id variable and the 'active' literal
  -- later in the same body.
  SELECT prosrc INTO v_src FROM pg_proc WHERE oid = to_regprocedure('public.handle_new_user()');
  IF v_src ILIKE '%raw_user_meta_data->>''educator_id''%' THEN
    RAISE EXCEPTION 'P0_03_VERIFY_FAIL: handle_new_user still parses metadata educator_id';
  END IF;

  IF v_src NOT ILIKE '%status = ''active''%' THEN
    RAISE EXCEPTION 'P0_03_VERIFY_FAIL: handle_new_user does not require an active coupon';
  END IF;
END $$;

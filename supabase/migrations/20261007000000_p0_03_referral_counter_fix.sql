-- =============================================================================
-- P0-03-CONC-001 — Referral counter correctness under concurrency + removal
--
-- Defect (both reproduced deterministically against real concurrent
-- PostgreSQL transactions, see PHASE 5 report):
--
--   1) Concurrency: public.update_sub_admin_referrals() recalculated
--      total_referrals with `SET total_referrals = (SELECT COUNT(*) ...)` and
--      nothing serialized those recalculations. Under READ COMMITTED each
--      recount statement reads its own snapshot, so N concurrent attributions
--      each computed a count that excluded the other in-flight, not-yet-
--      committed attributions; the last commit won with an undercount.
--      (Deterministic repro: 2 concurrent signups -> stored 1, actual 2.)
--
--   2) Removal: public.remove_student() unlinked the student (an UPDATE on
--      public.users, which fires trg_update_referrals and correctly recounts
--      the sub_admin) AND THEN also ran a direct
--      `UPDATE sub_admins SET total_referrals = GREATEST(total_referrals - 1, 0)`.
--      The counter was therefore decremented twice per removal — a plain
--      single-transaction undercount, independent of concurrency.
--      (Deterministic repro: 2 attributed users, 1 remove_student call ->
--      stored 1, actual 2.)
--
-- Fix:
--   1) Serialize the canonical recount per sub_admin. The row lock on the
--      sub_admins row is taken in its OWN statement (PERFORM ... FOR NO KEY
--      UPDATE) immediately BEFORE the recount UPDATE, so the recount UPDATE runs
--      in a fresh statement snapshot taken AFTER the lock is acquired — i.e.
--      after every earlier recalculation for that sub_admin has committed. A
--      single authoritative calculation (COUNT(*)) is kept; the counter is
--      never incremented/decremented incrementally.
--   2) remove_student() no longer writes total_referrals directly; the
--      serialized trigger recount is the single canonical mechanism, so no
--      attribution path can bypass or double-apply it.
--
-- Notes:
--   * This mirrors the serialization idiom already used across the codebase
--     (SELECT ... FOR UPDATE on the sub_admins row) instead of introducing a
--     new advisory-lock convention.
--   * Every attribution writer mutates public.users.sub_admin_id, so each is
--     now serialized through this one recount path. The COMPLETE set of
--     writers of public.users.sub_admin_id is:
--       - handle_new_user()             (INSERT; coupon-derived, ACTIVE only)
--       - link_user_to_educator(text)   (own row only, ACTIVE coupon, no overwrite)
--       - handle_user_role_change()     (promotion sets, demotion clears)
--       - remove_student(uuid)          (clears)
--       - remove_sub_admin(uuid)        (clears for all linked students)
--       - admin_create_sub_admin_profile(p_user_id uuid, p_full_name text,
--         p_email text, p_coupon_code text, p_created_by uuid, p_request_id text,
--         p_commission_percentage numeric)  (sets the educator's own row to
--         their own sub_admins profile; returns uuid; service_role-only, no
--         client EXECUTE — this is the origin of the documented "educator's own
--         row counts toward total_referrals" semantic)
--       - admin_revoke_sub_admin_role(uuid)  (clears; is_admin()-gated)
--       - FK fk_users_sub_admin ON DELETE SET NULL (fires on sub_admins DELETE,
--         e.g. admin_remove_sub_admin(); the counter row is gone, so moot)
--     NOTE: admin_create_sub_admin_profile and admin_revoke_sub_admin_role
--     were omitted from the original Phase 5 writer map. That omission was a
--     DOCUMENTATION gap only, not an implementation defect: trg_update_referrals
--     is an AFTER INSERT OR UPDATE trigger on public.users, so ANY assignment to
--     users.sub_admin_id necessarily fires the canonical serialized recount.
--     No attribution writer can bypass it.
--   * Non-writers, verified against the effective catalog: sync_sub_admin_coupon_to_users()
--     updates only users.coupon_code; admin_update_sub_admin_commission() only
--     reads sub_admin_id; trg_notify_on_new_student() and
--     prevent_user_role_escalation() never write total_referrals (the latter
--     reverts role/educator_id/is_active for non-admins, and deliberately does
--     NOT revert sub_admin_id, so it cannot bypass or undo the recount).
--   * update_sub_admin_referrals() is the ONLY writer of sub_admins.total_referrals
--     in the entire effective catalog; no function contains incremental
--     (+/- 1) counter logic.
--   * Lock ordering is unchanged relative to the current code: the recount
--     already acquired the sub_admins row lock implicitly via its UPDATE; the
--     explicit lock is taken in the same position, so no new deadlock class
--     is introduced.
--   * The explicit lock uses FOR NO KEY UPDATE (NOT FOR UPDATE). The
--     sub_admin_id foreign key causes every attributing INSERT to take a KEY
--     SHARE lock on the sub_admins row; FOR UPDATE would conflict with a
--     concurrent transaction's KEY SHARE, so two simultaneous signups (each
--     holding KEY SHARE and each upgrading to FOR UPDATE) would deadlock.
--     FOR NO KEY UPDATE is compatible with KEY SHARE (as is the recount
--     UPDATE's own implicit lock) while still conflicting with any other
--     NO KEY UPDATE holder, so it serializes concurrent recalculations without
--     introducing lock-upgrade deadlocks.
--   * The trigger target (trg_update_referrals) and all other objects are left
--     untouched; only the two function bodies are replaced.
--
-- Fail-fast signature guard
-- -------------------------
--   CREATE OR REPLACE FUNCTION only replaces a function whose full identity
--   (schema + name + input argument types) already exists; if the signature
--   does not match, PostgreSQL silently CREATES A NEW OVERLOAD and the
--   migration "succeeds" while the defective function stays live and
--   reachable. The guard below runs BEFORE either replacement and aborts the
--   transaction (the whole migration rolls back) unless both target functions
--   exist with exactly the intended identity, are the only overloads of their
--   name in schema public, and return the intended types.
--
--   This reuses the established P0-03 guard pattern from
--   20261006000000_p0_03_secure_referral_attribution.sql (a DO block using
--   to_regprocedure() plus RAISE EXCEPTION ... USING ERRCODE), extended with
--   exact overload-count and return-type assertions. All checks are
--   catalog-only and deterministic: no ILIKE/pattern matching, no data
--   modification, no side effects.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) Fail-fast guard: the exact target signatures must already exist.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_ref_oid   oid;
  v_rmv_oid   oid;
  v_overloads integer;
BEGIN
  -- 0a. update_sub_admin_referrals() must exist as () -> trigger.
  v_ref_oid := to_regprocedure('public.update_sub_admin_referrals()');
  IF v_ref_oid IS NULL THEN
    RAISE EXCEPTION
      'P0_03_ABORT: expected public function public.update_sub_admin_referrals() does not exist; refusing to redefine'
      USING ERRCODE = 'P0001';
  END IF;

  IF pg_get_function_identity_arguments(v_ref_oid) <> '' THEN
    RAISE EXCEPTION
      'P0_03_ABORT: public.update_sub_admin_referrals() signature mismatch; expected no arguments, found (%)',
      pg_get_function_identity_arguments(v_ref_oid)
      USING ERRCODE = 'P0001';
  END IF;

  IF pg_get_function_result(v_ref_oid) <> 'trigger' THEN
    RAISE EXCEPTION
      'P0_03_ABORT: public.update_sub_admin_referrals() return type mismatch; expected trigger, found %',
      pg_get_function_result(v_ref_oid)
      USING ERRCODE = 'P0001';
  END IF;

  -- 0b. remove_student(uuid) must exist as (p_user_id uuid) -> jsonb.
  v_rmv_oid := to_regprocedure('public.remove_student(uuid)');
  IF v_rmv_oid IS NULL THEN
    RAISE EXCEPTION
      'P0_03_ABORT: expected public function public.remove_student(uuid) does not exist; refusing to redefine'
      USING ERRCODE = 'P0001';
  END IF;

  IF pg_get_function_identity_arguments(v_rmv_oid) <> 'p_user_id uuid' THEN
    RAISE EXCEPTION
      'P0_03_ABORT: public.remove_student signature mismatch; expected (p_user_id uuid), found (%)',
      pg_get_function_identity_arguments(v_rmv_oid)
      USING ERRCODE = 'P0001';
  END IF;

  IF pg_get_function_result(v_rmv_oid) <> 'jsonb' THEN
    RAISE EXCEPTION
      'P0_03_ABORT: public.remove_student return type mismatch; expected jsonb, found %',
      pg_get_function_result(v_rmv_oid)
      USING ERRCODE = 'P0001';
  END IF;

  -- 0c. No additional overload of either name may exist in schema public;
  --     an extra overload would remain live and could still bypass the fix.
  SELECT count(*) INTO v_overloads
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'update_sub_admin_referrals';
  IF v_overloads <> 1 THEN
    RAISE EXCEPTION
      'P0_03_ABORT: expected exactly 1 public.update_sub_admin_referrals overload, found %',
      v_overloads
      USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_overloads
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'remove_student';
  IF v_overloads <> 1 THEN
    RAISE EXCEPTION
      'P0_03_ABORT: expected exactly 1 public.remove_student overload, found %',
      v_overloads
      USING ERRCODE = 'P0001';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1) update_sub_admin_referrals() — serialize the recalculation per sub_admin.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_sub_admin_referrals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handle INSERT or UPDATE where sub_admin_id is set
  IF NEW.sub_admin_id IS NOT NULL THEN
    -- Only update if it's an INSERT or if the sub_admin_id has changed
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.sub_admin_id IS NULL OR OLD.sub_admin_id IS DISTINCT FROM NEW.sub_admin_id)) THEN
      -- Serialize per sub_admin: acquire the row lock in a SEPARATE statement so
      -- the recount below runs in a fresh READ COMMITTED snapshot taken after
      -- every prior recalculation for this sub_admin has committed. FOR NO KEY
      -- UPDATE (not FOR UPDATE) keeps this compatible with the KEY SHARE lock
      -- the sub_admin_id foreign key takes on the same row.
      PERFORM 1 FROM public.sub_admins WHERE id = NEW.sub_admin_id FOR NO KEY UPDATE;
      UPDATE public.sub_admins
      SET total_referrals = (
        SELECT COUNT(*) FROM public.users WHERE sub_admin_id = NEW.sub_admin_id
      )
      WHERE id = NEW.sub_admin_id;
    END IF;
  END IF;

  -- If it's an UPDATE and sub_admin_id was removed/changed, update the OLD sub_admin as well
  IF TG_OP = 'UPDATE' AND OLD.sub_admin_id IS NOT NULL AND (NEW.sub_admin_id IS NULL OR OLD.sub_admin_id IS DISTINCT FROM NEW.sub_admin_id) THEN
    PERFORM 1 FROM public.sub_admins WHERE id = OLD.sub_admin_id FOR NO KEY UPDATE;
    UPDATE public.sub_admins
    SET total_referrals = (
      SELECT COUNT(*) FROM public.users WHERE sub_admin_id = OLD.sub_admin_id
    )
    WHERE id = OLD.sub_admin_id;
  END IF;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2) remove_student() — remove the direct (double-counting) counter write.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remove_student(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_admin_id UUID;
BEGIN
  IF NOT is_sub_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only sub admins can remove students.';
  END IF;

  -- Get sub admin id
  SELECT id INTO v_sub_admin_id
  FROM public.sub_admins
  WHERE user_id = auth.uid() AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Sub admin record not found.');
  END IF;

  -- Verify student belongs to this sub admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND sub_admin_id = v_sub_admin_id
  ) THEN
    RETURN jsonb_build_object('error', 'Student not found in your referrals.');
  END IF;

  -- Unlink student. The AFTER UPDATE trigger (trg_update_referrals ->
  -- update_sub_admin_referrals) performs the single, serialized recount of this
  -- sub_admin's referral counter. This function intentionally does NOT write
  -- total_referrals directly: a direct `GREATEST(total_referrals - 1, 0)` here
  -- double-counted the removal (the trigger had already recalculated) and
  -- undercounted the counter by one on every call.
  UPDATE public.users
  SET sub_admin_id = NULL,
      coupon_code = NULL
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Student removed. Their past attempts are preserved.'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 3) Guard: the recount trigger must still be wired to the new function body.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'users'
      AND t.tgname = 'trg_update_referrals'
      AND t.tgenabled = 'O'
  ) THEN
    RAISE EXCEPTION 'trg_update_referrals is missing or disabled on public.users';
  END IF;
END $$;

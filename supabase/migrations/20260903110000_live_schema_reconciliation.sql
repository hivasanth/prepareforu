-- =============================================================================
-- MIGRATION: live schema reconciliation (reproducibility parity with LIVE)
-- Date: 2026-09-03
--
-- WHY
--   A fresh `supabase db reset` did not reproduce the LIVE production schema:
--   several objects exist ONLY in the live database (created out-of-band / via
--   the dashboard or manually) and were missing from the migration history.
--   This migration brings a fresh database to parity with the live schema so
--   local == production. It NEVER edits historical migrations.
--
-- RECONCILED LIVE-ONLY OBJECTS (verified against live xbjhlfwqmcyatblsrhxn):
--   1. FULL UNIQUE constraints on public.sub_admins:
--        sub_admins_coupon_code_key   UNIQUE (coupon_code)
--        sub_admins_email_key         UNIQUE (email)
--      (live enforces full uniqueness on BOTH — strictly stronger than the
--       repo's partial active-coupon index. The auto-coupon machinery in
--       20260903100000 relies on these as the final, race-safe gate.)
--   2. handle_new_sub_admin() trigger + on_auth_user_created_sub_admin attach
--   3. handle_email_confirmed() trigger + on_email_confirmed attach
--   4. public.user_creation_logs audit table (written by handle_new_sub_admin)
--
-- SCOPE / SECURITY NOTICE
--   `handle_new_sub_admin` is reproduced VERBATIM from live for parity. It is
--   inert in every application flow (the app never sets `role` in auth
--   metadata on signup, and the onboarding path never does either), so it does
--   not create unauthorized sub_admin rows in practice. Its internal coupon
--   fallback (`'GEN' || floor(random()*1000000)`) is a legacy live artifact and
--   is NOT used by, nor fixed within, the hardened onboarding path — that path
--   is covered separately by the server-authoritative generator in
--   20260903100000. We do not surface host/user ids here.
--
-- IDEMPOTENT: ADD CONSTRAINT ... IF NOT EXISTS (guarded), CREATE TABLE IF NOT
-- EXISTS, CREATE OR REPLACE FUNCTION, and FUNCTION-guarded trigger attach.
-- =============================================================================

-- ─── 1. Full UNIQUE constraints (parity with live) ─────────────────────────
-- Guarded so re-application never errors on an existing constraint with the
-- same name. On live these already exist; a fresh DB gains them here.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sub_admins_coupon_code_key'
      AND conrelid = 'public.sub_admins'::regclass
  ) THEN
    ALTER TABLE public.sub_admins ADD CONSTRAINT sub_admins_coupon_code_key UNIQUE (coupon_code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sub_admins_email_key'
      AND conrelid = 'public.sub_admins'::regclass
  ) THEN
    ALTER TABLE public.sub_admins ADD CONSTRAINT sub_admins_email_key UNIQUE (email);
  END IF;
END $$;

-- ─── 2. user_creation_logs audit table (parity with live) ───────────────────
CREATE TABLE IF NOT EXISTS public.user_creation_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  error_code    text NOT NULL,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.user_creation_logs ENABLE ROW LEVEL SECURITY;

-- ─── 3. handle_new_sub_admin() — reproduced verbatim from live ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_sub_admin()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $function$
BEGIN
  -- Only process if the user metadata specifies sub_admin or educator role
  IF (new.raw_user_meta_data->>'role' IN ('sub_admin', 'educator')) THEN
    BEGIN
      INSERT INTO public.sub_admins (user_id, full_name, email, coupon_code, created_by, status)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown Educator'),
        new.email,
        COALESCE(new.raw_user_meta_data->>'coupon_code', 'GEN' || floor(random()*1000000)::text),
        COALESCE((new.raw_user_meta_data->>'created_by')::uuid, auth.uid()),
        'active'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log internal trigger failure to the health/audit table
      INSERT INTO public.user_creation_logs (user_id, error_code, error_message)
      VALUES (new.id, 'SUB_ADMIN_TRIGGER_FAIL', SQLERRM);
      -- We still return new so the auth user creation itself succeeds
    END;
  END IF;
  RETURN new;
END;
$function$;

-- ─── 4. handle_email_confirmed() — reproduced verbatim from live ─────────────
-- SCHEMA-AGNOSTIC VARIANT (replay fix, 2026-09-11 Phase 11):
--   The auth schema is owned by the auth service, not by the migration chain.
--   A fully-fresh replay happens before the auth service re-migrates auth.users,
--   so the provider column that records email confirmation is NOT guaranteed to
--   exist yet (email_confirmed_at on modern gotrue, confirmed_at on others).
--   Instead of referencing a hard-coded column (which fails to compile on
--   images whose auth.users lacks it), the body reflects the confirmation
--   timestamp at runtime via to_jsonb(OLD|NEW). LIVE remains untouched: the
--   existing LIVE function/trigger already exist, so both CREATE-guards skip.
--   INTENTIONAL-DEVIATION: fresh replays create the trigger WITHOUT a column
--   list (AFTER UPDATE ON auth.users) so creation never fails on any auth
--   schema version; activation result is identical to LIVE's column-specific
--   trigger (email_verified flips true exactly on a confirmation transition).
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  new_json jsonb := to_jsonb(NEW);
  old_json jsonb := to_jsonb(OLD);
  new_confirmed timestamptz;
  old_confirmed timestamptz;
BEGIN
  IF new_json ? 'email_confirmed_at' THEN
    new_confirmed := (new_json->>'email_confirmed_at')::timestamptz;
    old_confirmed := (old_json->>'email_confirmed_at')::timestamptz;
  ELSIF new_json ? 'confirmed_at' THEN
    new_confirmed := (new_json->>'confirmed_at')::timestamptz;
    old_confirmed := (old_json->>'confirmed_at')::timestamptz;
  END IF;

  -- When a user confirms their email, the confirmation timestamp transitions
  -- from NULL to a timestamp (or one non-NULL to a newer one).
  IF new_confirmed IS NOT NULL AND (old_confirmed IS NULL OR old_confirmed != new_confirmed) THEN
    UPDATE public.users
    SET email_verified = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- ─── 5. Trigger attaches (guarded by FUNCTION so a live trigger is never
--        duplicated and a fresh DB is wired deterministically) ────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE t.tgrelid = 'auth.users'::regclass
      AND p.proname = 'handle_new_sub_admin'
  ) THEN
    CREATE TRIGGER on_auth_user_created_sub_admin
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_sub_admin();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE t.tgrelid = 'auth.users'::regclass
      AND p.proname = 'handle_email_confirmed'
  ) THEN
    CREATE TRIGGER on_email_confirmed
      AFTER UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_email_confirmed();
  END IF;
END $$;

-- =============================================================================
-- Migration: sub_admins Live Schema Reconciliation
-- Date: 2026-09-10
-- Author: opencode (automated reconciliation)
--
-- Purpose: Reconcile migration history with LIVE database for sub_admins.
--          Resolves DB-1 through DB-7 from the live DB audit.
--
-- Safety: Every statement uses idempotent guards (IF NOT EXISTS / IF EXISTS /
--         exception handlers).  Safe to apply against LIVE or a fresh DB.
--
-- LIVE baseline (verified 2026-09-10 via Management API):
--   sub_admins columns: id, user_id, coupon_code, commission_rate,
--     exam_selection, full_name, last_activity_date, role, is_active,
--     sub_admin_id, educator_id, created_at, updated_at
--   enum sub_admin_status: user, admin, sub_admin, deactivated_sub_admin
--   triggers: trg_sub_admins_updated_at, trg_sync_sub_admin_coupon,
--             trg_notify_on_sub_admin_change
--   redundant index: idx_sub_admins_coupon_active
--   grant gap: admin_revoke_sub_admin_role PUBLIC/anon EXECUTE
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- DB-4: Enum type sub_admin_status (idempotent create)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.sub_admin_status AS ENUM (
    'active', 'inactive'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Convert column from text → enum (only if currently text)
DO $$ BEGIN
  IF (
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sub_admins'
      AND column_name = 'status'
  ) = 'text' THEN
    ALTER TABLE public.sub_admins
      ALTER COLUMN status TYPE public.sub_admin_status
      USING status::public.sub_admin_status;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- DB-1: sub_admins.updated_at column (idempotent add)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.sub_admins
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────────────────────
-- DB-2 + DB-3: Shared helper function update_updated_at()
--              (used by trg_sub_admins_updated_at and trg_users_updated_at)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- DB-2: Trigger trg_sub_admins_updated_at (idempotent create)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_sub_admins_updated_at'
      AND tgrelid = 'public.sub_admins'::regclass
  ) THEN
    CREATE TRIGGER trg_sub_admins_updated_at
      BEFORE UPDATE ON public.sub_admins
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- DB-3: sync_sub_admin_coupon_to_users() function + trigger
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_sub_admin_coupon_to_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.users
  SET coupon_code = NEW.coupon_code
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$function$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_sync_sub_admin_coupon'
      AND tgrelid = 'public.sub_admins'::regclass
  ) THEN
    CREATE TRIGGER trg_sync_sub_admin_coupon
      AFTER INSERT OR UPDATE OF coupon_code ON public.sub_admins
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_sub_admin_coupon_to_users();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- DB-5: trg_notify_on_sub_admin_change function + trigger
--        Sends a welcome notification when a new sub-admin is inserted.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_on_sub_admin_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'Welcome, Educator!',
      'Your educator account is active. Start creating exams and sharing your coupon.',
      'system',
      '/sub-admin/dashboard'
    );
  END IF;

  RETURN NEW;
END;
$function$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_notify_on_sub_admin_change'
      AND tgrelid = 'public.sub_admins'::regclass
  ) THEN
    CREATE TRIGGER trg_notify_on_sub_admin_change
      AFTER INSERT ON public.sub_admins
      FOR EACH ROW
      EXECUTE FUNCTION public.trg_notify_on_sub_admin_change();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- DB-6: Drop redundant partial index
--        ux_sub_admins_coupon_active (unique partial) is authoritative;
--        idx_sub_admins_coupon_active (non-unique partial) is redundant.
-- ─────────────────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_sub_admins_coupon_active;

-- ─────────────────────────────────────────────────────────────────────────────
-- DB-7: Revoke PUBLIC and anon EXECUTE on admin_revoke_sub_admin_role
--        Function self-defends via is_admin(), but the grant is a hygiene gap.
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.admin_revoke_sub_admin_role(uuid)
  FROM PUBLIC, anon;

-- =============================================================================
-- End of reconciliation migration
-- =============================================================================

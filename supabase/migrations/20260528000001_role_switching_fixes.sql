-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Role Switching Fixes
-- Purpose:  Ensure that when a user's role is changed via the DB or Admin panel,
--           the correct downstream records are created/cleaned automatically.
--
-- Changes:
--   1. Creates handle_user_role_change() trigger function.
--   2. Attaches trigger trg_user_role_change to public.users AFTER UPDATE.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. TRIGGER FUNCTION ─────────────────────────────────────────────────────
-- Fires AFTER an UPDATE on public.users whenever the role column changes.
-- Guarantees that:
--   • sub_admin  → a sub_admins profile exists and users.sub_admin_id points to it.
--                  Any stale student educator link (educator_id) is cleared.
--   • admin      → both sub_admin_id and educator_id are cleared (admins are global).
--   • user       → sub_admin_id is cleared (students should not retain admin flags).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_user_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sa_id uuid;
  v_caller_id uuid;
BEGIN
  -- Only act when the role actually changes
  IF OLD.role IS NOT DISTINCT FROM NEW.role THEN
    RETURN NEW;
  END IF;

  -- ── Promotion to Sub-Admin ──────────────────────────────────────────────────
  IF NEW.role = 'sub_admin' THEN
    -- Resolve the calling admin's UUID for audit trail (falls back gracefully)
    v_caller_id := COALESCE(
      auth.uid(),
      '833df519-0ac4-4f93-bf8b-d18ca59278a6'::uuid  -- Main admin fallback ID
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
        -- Generate a unique, readable coupon code: prefix + 6 random hex chars
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

  -- ── Promotion to Admin ───────────────────────────────────────────────────────
  ELSIF NEW.role = 'admin' THEN
    -- Admins have global scope; no educator or sub-admin linkage applies
    UPDATE public.users
    SET sub_admin_id = NULL,
        educator_id = NULL
    WHERE id = NEW.id;

  -- ── Demotion back to User ────────────────────────────────────────────────────
  ELSIF NEW.role = 'user' THEN
    -- Remove the self-referential sub_admin_id so the user is treated as a student
    UPDATE public.users
    SET sub_admin_id = NULL
    WHERE id = NEW.id;
    -- educator_id is intentionally left intact if re-assigning to their original cohort
  END IF;

  RETURN NEW;
END;
$$;

-- ─── 2. ATTACH TRIGGER ───────────────────────────────────────────────────────
-- Drop first to ensure idempotency (safe to run multiple times)
DROP TRIGGER IF EXISTS trg_user_role_change ON public.users;

CREATE TRIGGER trg_user_role_change
  AFTER UPDATE OF role ON public.users  -- Fires ONLY when role column changes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_role_change();

-- ─── 3. BACKFILL: Fix existing sub_admin rows with missing sub_admin_id ───────
-- Repairs users who were already promoted before this trigger was added.
DO $$
DECLARE
  rec RECORD;
  v_sa_id uuid;
BEGIN
  FOR rec IN
    SELECT u.id, u.full_name, u.email
    FROM public.users u
    WHERE u.role = 'sub_admin'
      AND (u.sub_admin_id IS NULL OR u.sub_admin_id NOT IN (
        SELECT id FROM public.sub_admins WHERE user_id = u.id
      ))
  LOOP
    -- Find or create their sub_admins profile
    SELECT id INTO v_sa_id
    FROM public.sub_admins
    WHERE user_id = rec.id;

    IF v_sa_id IS NULL THEN
      INSERT INTO public.sub_admins (user_id, full_name, email, coupon_code, created_by, status)
      VALUES (
        rec.id,
        rec.full_name,
        rec.email,
        'EDU' || upper(left(replace(gen_random_uuid()::text, '-', ''), 6)),
        '833df519-0ac4-4f93-bf8b-d18ca59278a6'::uuid,
        'active'
      )
      RETURNING id INTO v_sa_id;
    END IF;

    -- Patch the users row directly
    UPDATE public.users
    SET
      sub_admin_id = v_sa_id,
      educator_id  = NULL
    WHERE id = rec.id;

  END LOOP;
END;
$$;

-- ─── 4. BACKFILL: Fix existing admin rows with stale linkages ────────────────
UPDATE public.users
SET
  sub_admin_id = NULL,
  educator_id  = NULL
WHERE role = 'admin'
  AND (sub_admin_id IS NOT NULL OR educator_id IS NOT NULL);

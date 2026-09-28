-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION: users.sub_admin_id → sub_admins FK (reproducibility reconciliation)
-- Date: 2026-05-01 (sorts immediately after 20260501000000 creates sub_admins)
--
-- The live public.users carries a foreign key
--   sub_admin_id REFERENCES public.sub_admins(id) ON DELETE SET NULL
-- but it was created out-of-band (the sub_admin_id column + FK were never
-- declared in any repository migration). 20260401000000 recreates users
-- WITHOUT this FK because public.sub_admins does not exist yet at that point
-- in a fresh reset. This migration adds it the moment sub_admins exists.
--
-- IDEMPOTENT + non-destructive: only adds the constraint if it is missing.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_users_sub_admin'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_sub_admin
      FOREIGN KEY (sub_admin_id) REFERENCES public.sub_admins(id) ON DELETE SET NULL;
  END IF;
END $$;

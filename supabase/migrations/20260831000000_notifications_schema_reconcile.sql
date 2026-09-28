-- =============================================================================
-- MIGRATION: reconcile production notifications schema to canonical repo shape
-- Date: 2026-08-31
--
-- PROBLEM (discovered during sub-admin provisioning remediation deploy):
--   Production `public.notifications` was created OUT-OF-BAND with a DIFFERENT
--   shape than every consumer expects:
--     production:  id, user_id, type, message, is_read, created_at
--     canonical:   id, user_id, title(NOT NULL), body, type, link, is_read, created_at
--   Both the server-side function `create_notification()` (writes
--   `title/body/link`, see 20260622100000_notifications.sql) and the frontend
--   (`src/lib/repositories/notification.repository.ts`, `AppNotification`)
--   SELECT/write `title`/`body`/`link`. Because `trg_notify_on_sub_admin_change`
--   (AFTER INSERT ON sub_admins) calls `create_notification()`, EVERY INSERT into
--   public.sub_admins raised `column "title" of relation "notifications" does
--   not exist` and aborted — blocking sub-admin provisioning entirely (both the
--   legacy onboard path and the atomic RPC), plus all other notification
--   triggers (attempts, new-student).
--
-- FIX:
--   Add the canonical columns (title NOT NULL, body, link), drop the orphaned
--   `message` column (table currently has 0 rows, so no data migration needed),
--   and re-assert RLS to the canonical set. Idempotent / guarded.
--
-- NOTE: production RLS also carried an extra `notifications_insert_admin`
--       (INSERT ... USING is_admin()) policy not in the canonical migration.
--       That policy ORs with `notifications_service_insert` (with_check => true)
--       which still permits any insert; it is retained here to avoid silently
--       changing security posture. (Separately audited in the master task §RLS.)
-- =============================================================================

-- 1. Canonical columns (guarded). title is NOT NULL in the repo shape.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS body  TEXT,
  ADD COLUMN IF NOT EXISTS link  TEXT;

ALTER TABLE public.notifications
  ALTER COLUMN title SET NOT NULL;

-- 2. Drop the orphaned column that matches no consumer. 0 rows in production,
--    so nothing is lost. Guarded so this is a no-op if already reconciled.
ALTER TABLE public.notifications
  DROP COLUMN IF EXISTS message;

-- 3. Canonical names for the own-row policies (guarded add; existing ones kept).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid='public.notifications'::regclass AND polname='notifications_own_select') THEN
    CREATE POLICY "notifications_own_select" ON public.notifications FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid='public.notifications'::regclass AND polname='notifications_own_update') THEN
    CREATE POLICY "notifications_own_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid='public.notifications'::regclass AND polname='notifications_own_delete') THEN
    CREATE POLICY "notifications_own_delete" ON public.notifications FOR DELETE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid='public.notifications'::regclass AND polname='notifications_service_insert') THEN
    CREATE POLICY "notifications_service_insert" ON public.notifications FOR INSERT WITH CHECK (true);
  END IF;
END $$;

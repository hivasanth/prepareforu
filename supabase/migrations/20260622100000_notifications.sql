-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: notifications system
-- Adds: notifications table, RLS, indexes, and event triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. notifications table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT         NOT NULL,
  body        TEXT,
  type        TEXT         NOT NULL DEFAULT 'info',
  -- type values: 'info' | 'success' | 'warning' | 'exam' | 'student' | 'system'
  link        TEXT,
  is_read     BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── 2. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users may only see and manage their own notifications
CREATE POLICY "notifications_own_select"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_own_update"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notifications_own_delete"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- Service role (Edge Functions / DB triggers) can insert for any user
CREATE POLICY "notifications_service_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ── 3. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications(created_at DESC);

-- ── 4. notification_prefs column on sub_admins ────────────────────────────────
-- Stores sub-admin's notification preference toggles as a JSONB object
ALTER TABLE public.sub_admins
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{
    "notify_on_attempt": true,
    "notify_on_exam_closure": true,
    "notify_on_new_student": true
  }'::jsonb;

-- ── 5. Helper: create notification (centralised insert) ───────────────────────
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id  UUID,
  p_title    TEXT,
  p_body     TEXT    DEFAULT NULL,
  p_type     TEXT    DEFAULT 'info',
  p_link     TEXT    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications(user_id, title, body, type, link)
  VALUES (p_user_id, p_title, p_body, p_type, p_link);
END;
$$;

-- ── 6. Trigger: student attempts an exam → notify sub-admin ───────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_on_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sa_user_id   UUID;
  v_exam_title   TEXT;
  v_student_name TEXT;
  v_prefs        JSONB;
BEGIN
  -- Only fire on completed / auto_submitted attempts
  IF NEW.status NOT IN ('completed', 'auto_submitted') THEN
    RETURN NEW;
  END IF;

  -- Only for teacher exams (not system exams)
  IF NEW.teacher_exam_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve sub-admin auth user_id and exam title
  SELECT sa.user_id, te.title, sa.notification_prefs
    INTO v_sa_user_id, v_exam_title, v_prefs
    FROM public.teacher_exams te
    JOIN public.sub_admins sa ON sa.id = te.sub_admin_id
   WHERE te.id = NEW.teacher_exam_id;

  IF v_sa_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check preference
  IF (v_prefs->>'notify_on_attempt')::boolean = false THEN
    RETURN NEW;
  END IF;

  -- Resolve student name
  SELECT full_name INTO v_student_name
    FROM public.users WHERE id = NEW.user_id;

  PERFORM public.create_notification(
    v_sa_user_id,
    'New Exam Attempt',
    COALESCE(v_student_name, 'A student') || ' submitted "' || COALESCE(v_exam_title, 'an exam') || '".',
    'exam',
    '/sub-admin/my-exams'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_attempt ON public.attempts;
CREATE TRIGGER trg_notify_on_attempt
  AFTER INSERT OR UPDATE OF status ON public.attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_on_attempt();

-- ── 7. Trigger: new student signs up with coupon → notify sub-admin ──────────
CREATE OR REPLACE FUNCTION public.trg_notify_on_new_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sa_user_id UUID;
  v_prefs      JSONB;
BEGIN
  -- Only fire when educator_id is set (student linked to a sub-admin)
  IF NEW.educator_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- educator_id stores the auth.users.id of the sub-admin
  -- Resolve the sub-admin record
  SELECT sa.user_id, sa.notification_prefs
    INTO v_sa_user_id, v_prefs
    FROM public.sub_admins sa
   WHERE sa.user_id = NEW.educator_id;

  IF v_sa_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check preference
  IF (v_prefs->>'notify_on_new_student')::boolean = false THEN
    RETURN NEW;
  END IF;

  PERFORM public.create_notification(
    v_sa_user_id,
    'New Student Enrolled',
    COALESCE(NEW.full_name, NEW.email, 'A new student') || ' joined using your coupon.',
    'student',
    '/sub-admin/students'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_new_student ON public.users;
CREATE TRIGGER trg_notify_on_new_student
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_on_new_student();

-- ── 8. Trigger: admin creates / updates a sub-admin → notify them ─────────────
CREATE OR REPLACE FUNCTION public.trg_notify_on_sub_admin_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- New sub-admin created
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
$$;

DROP TRIGGER IF EXISTS trg_notify_on_sub_admin_change ON public.sub_admins;
CREATE TRIGGER trg_notify_on_sub_admin_change
  AFTER INSERT ON public.sub_admins
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_on_sub_admin_change();

-- ── 9. Enable Realtime for notifications table ────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

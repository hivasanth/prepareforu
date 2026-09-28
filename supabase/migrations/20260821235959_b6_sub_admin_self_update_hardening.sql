-- ═══════════════════════════════════════════════════════════════════════════════
-- B6 SUB-ADMIN SELF-UPDATE HARDENING
-- ═══════════════════════════════════════════════════════════════════════════════
-- Context (evidence-based decision, see SUBADMINS_REMAINING_ITEMS_REPORT.md):
--   * The shipped Educator Settings page lets a sub-admin update exactly two
--     things: their display name and their notification preferences
--     (src/components/sub-admin/settings/useSettings.ts).
--   * Live RLS (20260502_rls_hardening.sql) gives sub_admins only
--     rls_sub_admins_admin_all (admin-only) + rls_sub_admins_self_select.
--     There is NO self-update path, so those settings saves fail against RLS.
--
-- Design (least privilege, one purpose per mutation):
--   * Two narrowly-scoped SECURITY DEFINER RPCs replace any broad table UPDATE:
--       - update_sub_admin_name(p_full_name text)
--       - update_sub_admin_notification_prefs(p_prefs jsonb)
--   * Ownership derives server-side from auth.uid() — never from parameters.
--   * Exact-column mutations ONLY. These functions can never touch user_id,
--     role, sub_admin_id, created_by, status, coupon_code, total_referrals,
--     email, or any other row.
--   * No new RLS policy is added (no broad authenticated UPDATE policy).
--   * EXECUTE is revoked from PUBLIC/anon and granted to authenticated only.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Display-name self-update ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_sub_admin_name(p_full_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_name text := btrim(COALESCE(p_full_name, ''));
BEGIN
  IF v_name IS NULL OR length(v_name) < 1 OR length(v_name) > 80 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Display name must be between 1 and 80 characters.';
  END IF;

  UPDATE public.sub_admins
     SET full_name = v_name
   WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FORBIDDEN: No educator profile is linked to this session.';
  END IF;

  -- Keep the auth-linked users row in sync (same identity field, same owner),
  -- preserving the existing product behavior of the Settings save flow.
  UPDATE public.users
     SET full_name = v_name
   WHERE id = auth.uid();
END;
$$;

-- ─── 2. Notification-preferences self-update ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_sub_admin_notification_prefs(p_prefs jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_allowed text[] := ARRAY[
    'notify_on_attempt',
    'notify_on_exam_closure',
    'notify_on_new_student'
  ];
  v_key text;
BEGIN
  IF p_prefs IS NULL OR jsonb_typeof(p_prefs) <> 'object' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Preferences must be a JSON object.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(p_prefs) AS k
    WHERE NOT (k = ANY (v_allowed))
  ) THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Unknown preference key.';
  END IF;

  FOREACH v_key IN ARRAY v_allowed LOOP
    IF (p_prefs -> v_key) IS NULL OR jsonb_typeof(p_prefs -> v_key) <> 'boolean' THEN
      RAISE EXCEPTION 'VALIDATION_FAILED: Preference "%" must be a boolean.', v_key;
    END IF;
  END LOOP;

  UPDATE public.sub_admins
     SET notification_prefs = p_prefs
   WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FORBIDDEN: No educator profile is linked to this session.';
  END IF;
END;
$$;

-- ─── 3. Least-privilege EXECUTE grants ────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.update_sub_admin_name(text)
  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_sub_admin_notification_prefs(jsonb)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.update_sub_admin_name(text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_sub_admin_notification_prefs(jsonb)
  TO authenticated;

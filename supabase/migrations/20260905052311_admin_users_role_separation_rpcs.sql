-- =============================================================================
-- MIGRATION: ADMIN USERS ROLE-SEPARATION — archive-role writers + admin_list_users
-- Date: 2026-09-05
--
-- Root cause (verified live 2026-09-05): admin_remove_sub_admin and the legacy
-- admin_revoke_sub_admin_role reverted a removed educator's users.role to
-- 'user', so every "deactivated" sub-admin immediately appeared on the Admin →
-- Users list. The Users list filtered on role='user', producing the overlap.
--
-- 1. Removed educators now take the distinct 'deactivated_sub_admin' role
--    (20260905052310): excluded from the Users page by construction, and no
--    role guard allow-lists it → no platform access.
-- 2. NEW public.admin_list_users(...) is the single authoritative, admin-only
--    read path for the Users page. It is SECURITY DEFINER + is_admin()-guarded,
--    filters role='user', additionally excludes anyone carrying a sub_admins
--    identity (belt-and-braces), applies exam/status/search under the SAME
--    predicate as the exact count, escapes ILIKE metacharacters server-side,
--    whitelists the sort column, clamps the page size, and paginates stably.
--    The client-side PostgREST .or()/ilike search-grammar surface is removed.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. admin_remove_sub_admin: archive the role instead of reverting to 'user'.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_remove_sub_admin(p_sub_admin_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  -- ── 1. Authorize the CALLER server-side ────────────────────────────────
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: only admins can remove educators.';
  END IF;

  -- ── 2. Resolve and lock the target profile ─────────────────────────────
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

  -- ── 4. Delete the profile row (FK detaches linked students) ────────────
  DELETE FROM public.sub_admins
  WHERE id = p_sub_admin_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Educator record not found.';
  END IF;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Legacy admin_revoke_sub_admin_role: same archive semantics (defense in
--    depth — prevents any future caller of this path from re-creating the
--    overlap).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_revoke_sub_admin_role(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied.';
  END IF;

  UPDATE public.users
  SET role = 'deactivated_sub_admin',
      sub_admin_id = NULL,
      educator_id = NULL
  WHERE id = p_user_id AND role = 'sub_admin';
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. NEW admin_list_users: the single authoritative, admin-only Users-list RPC.
--    Returns { rows, count } under one predicate.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_exam_selection text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_sort_column text DEFAULT 'created_at',
  p_sort_asc boolean DEFAULT false,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 20
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_where  text := '';
  v_col    text;
  v_order  text;
  v_search text;
  v_limit  integer;
  v_rows   json;
  v_count  bigint;
BEGIN
  -- Authorize the caller at the boundary; the function bypasses RLS (DEFINER).
  IF auth.uid() IS NULL OR NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin role required.';
  END IF;

  -- Whitelist the sort column: dynamic identifiers never come from input.
  -- NOTE: `v_col := p_sort_column` is intentionally avoided here because
  -- `NULL NOT IN (...)` evaluates to NULL (not FALSE), which would bypass the
  -- reassignment and let NULL reach %I. Default to 'created_at' and only adopt
  -- a whitelisted non-NULL value.
  v_col := 'created_at';
  IF p_sort_column IS NOT NULL
     AND p_sort_column IN ('full_name', 'email', 'exam_selection', 'is_active', 'created_at')
  THEN
    v_col := p_sort_column;
  END IF;
  v_order := CASE WHEN p_sort_asc THEN 'ASC' ELSE 'DESC' END;

  -- Escape ILIKE metacharacters so user input is DATA, never a pattern.
  v_search := NULLIF(btrim(p_search), '');
  IF v_search IS NOT NULL THEN
    v_search := replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_');
  END IF;

  IF v_search IS NOT NULL THEN
    v_where := v_where || format(
      ' AND (full_name ILIKE ''%%'' || %L || ''%%'' OR email ILIKE ''%%'' || %L || ''%%'')',
      v_search, v_search);
  END IF;

  IF p_exam_selection IS NOT NULL AND btrim(p_exam_selection) <> '' THEN
    v_where := v_where || format(' AND exam_selection = %L', btrim(p_exam_selection));
  END IF;

  IF p_status = 'active' THEN
    v_where := v_where || ' AND is_active = true';
  ELSIF p_status = 'inactive' THEN
    v_where := v_where || ' AND is_active = false';
  END IF;

  -- Keep the per-request page bounded regardless of caller input.
  v_limit := GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);

  -- EXACT count under the SAME predicate as the page rows.
  EXECUTE 'SELECT count(*)'
            ' FROM public.users u'
            ' WHERE u.role = ''user'''
            ' AND NOT EXISTS (SELECT 1 FROM public.sub_admins sa WHERE sa.user_id = u.id)'
            || v_where
     INTO v_count;

  EXECUTE format(
    'SELECT COALESCE(json_agg(row_to_json(t)), ''[]''::json)'
       ' FROM ('
       '   SELECT u.id, u.full_name, u.email, u.exam_selection, u.is_active,'
       '          u.created_at'
       '   FROM public.users u'
       '   WHERE u.role = ''user'''
       '     AND NOT EXISTS (SELECT 1 FROM public.sub_admins sa WHERE sa.user_id = u.id)'
       '   %s'
       '   ORDER BY u.%I %s, u.id %s'
       '   LIMIT %s OFFSET %s'
       ' ) t',
    v_where, v_col, v_order, v_order, v_limit, COALESCE(p_offset, 0))
    INTO v_rows;

  RETURN json_build_object('rows', v_rows, 'count', v_count);
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants: follow the repo's admin-RPC pattern (authenticated + service_role
-- only; revoked from PUBLIC/anon).
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.admin_list_users(
  text, text, text, text, boolean, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_users(
  text, text, text, text, boolean, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(
  text, text, text, text, boolean, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users(
  text, text, text, text, boolean, integer, integer) TO service_role;
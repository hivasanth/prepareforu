-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION: baseline auth/provisioning schema — OOB reconciliation (audit F2)
-- Date: 2026-04-01 (first-applied baseline; authored 2026-08-31 during the
--       sub-admin provisioning/authentication master remediation)
--
-- WHY THIS FILE EXISTS (reproducibility reconciliation, master-task §7/§8):
--   The following objects are required by the sub-admin authentication +
--   provisioning flow but were created OUT-OF-BAND in the production SQL
--   Editor — NO repository migration ever created them:
--       public.user_role            (enum)
--       public.users                (table + constraints + indexes + grants)
--       public.security_logs        (table + PK + grants)
--       public.log_security_event   (SECURITY DEFINER RPC)
--       public.validate_coupon      (SECURITY DEFINER RPC)
--       public.check_user_exists    (SECURITY DEFINER RPC)
--       public.create_sub_admin     (SECURITY DEFINER RPC)
--       public.promote_to_admin     (SECURITY DEFINER RPC)
--       public.demote_from_admin    (SECURITY DEFINER RPC)
--
--   Consequently a fresh `supabase db reset` (which builds the schema purely
--   from repository migrations) could NOT reproduce the auth flow: the first
--   migrated RLS statement (`ALTER TABLE public.users ENABLE ROW LEVEL
--   SECURITY` in 20260502_rls_hardening.sql) would fail because `users` did
--   not exist.
--
--   This file back-fills the canonical definitions for the objects required by
--   THE AUTH/PROVISIONING FLOW, taken verbatim from the live production schema
--   (inspected via the project's approved mechanism, `supabase db query
--   --linked`, per master-task §7 "obtain the actual intended/live schema
--   definition"). It does NOT invent new behaviour; it reproduces exactly what
--   production already runs, so applying it to production is a no-op and
--   applying it to a fresh database produces the flow's prerequisites.
--
-- SCOPE BOUNDARY:
--   This reconciles the objects needed by the sub-admin authentication +
--   provisioning flow (§8). It does NOT attempt to reconcile the entire
--   public schema (pre-existing broader OOB drift, explicitly documented in
--   the final report — see REPRODUCIBILITY LIMITATION). Intentionally legacy
--   or duplicated behaviour is called out inline.
--
-- IDEMPOTENT: CREATE TYPE via guarded DO (Postgres has no
--   `CREATE TYPE IF NOT EXISTS`); CREATE TABLE IF NOT EXISTS / OR REPLACE /
--   IF NOT EXISTS throughout. Safe to re-apply; on LIVE it is a no-op.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. user_role enum ────────────────────────────────────────────────────────
-- Live values (inspected, in sort order): 'user' 'admin' 'sub_admin'
-- 'deactivated_sub_admin'. The fourth label was present on LIVE at
-- inspection time and is used by SEC-2/3 deactivation flows.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'sub_admin', 'deactivated_sub_admin');
  END IF;
END $$;

-- ─── 2. public.users (live schema, verbatim) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id                    uuid PRIMARY KEY,
  email                 text NOT NULL UNIQUE,
  full_name             text NOT NULL,
  role                  public.user_role NOT NULL DEFAULT 'user',
  exam_selection        text,
  coupon_code           text,
  sub_admin_id          uuid,
  last_activity_date    date,
  total_exams           integer NOT NULL DEFAULT 0,
  overall_accuracy      numeric NOT NULL DEFAULT 0,
  is_active             boolean NOT NULL DEFAULT true,
  email_verified        boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  coupon_code_used      boolean DEFAULT false,
  educator_id           uuid,
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until          timestamptz
);

-- users.id is the auth.users id (FK with ON DELETE CASCADE). The id→auth.users
-- FK is defined below; sub_admin_id→sub_admins FK is added in a dedicated
-- migration (20260501000001) AFTER public.sub_admins is created, preserving
-- migration ordering.

-- Foreign keys (verbatim live definitions).
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_educator_id_fkey;
ALTER TABLE public.users
  ADD CONSTRAINT users_educator_id_fkey
  FOREIGN KEY (educator_id) REFERENCES public.users(id);

-- Indexes (verbatim live definitions).
CREATE INDEX IF NOT EXISTS idx_users_admin_only     ON public.users (id) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS idx_users_educator       ON public.users (educator_id);
CREATE INDEX IF NOT EXISTS idx_users_email_lockout  ON public.users (email) WHERE locked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_exam_selection ON public.users (exam_selection);
CREATE INDEX IF NOT EXISTS idx_users_is_active      ON public.users (is_active);
CREATE INDEX IF NOT EXISTS idx_users_role           ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_sub_admin_id   ON public.users (sub_admin_id);

-- RLS is enabled in the app's RLS migrations (20260502_rls_hardening.sql); do
-- not duplicate policies here. Enable is idempotent and safe to pre-enable.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ─── 3. public.security_logs (live schema, verbatim) ─────────────────────────
-- corrected 2026-09-10: LIVE carries severity NOT NULL DEFAULT 'medium',
-- metadata NULL DEFAULT '{}', created_at NULL DEFAULT now(). The previous
-- NOT NULL shape matched the interim OOB hardening, but LIVE is the ground
-- truth for parity. All four columns now match LIVE exactly.
CREATE TABLE IF NOT EXISTS public.security_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text NOT NULL,
  identifier  text NOT NULL,
  severity    text NOT NULL DEFAULT 'medium',
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now()
);

-- ─── 4. SECURITY DEFINER helper/RPC functions (live bodies, verbatim) ────────
-- Each is SECURITY DEFINER with a pinned search_path (matches the live defs
-- and the ALTER search_path pins applied later in
-- 20260826000001_admin_panel_security_hardening.sql).

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_type text,
  p_identifier text,
  p_severity text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.security_logs (event_type, identifier, severity, metadata)
  VALUES (p_type, p_identifier, p_severity, p_metadata);
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_coupon(p_coupon text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_valid boolean;
    v_name text;
    v_user_id uuid;
BEGIN
    SELECT true, full_name, user_id
    INTO v_valid, v_name, v_user_id
    FROM public.sub_admins
    WHERE coupon_code = p_coupon AND status = 'active';

    RETURN jsonb_build_object(
        'valid', coalesce(v_valid, false),
        'sub_admin_name', v_name,
        'educator_id', v_user_id
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_user_exists(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE email = lower(p_email)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_sub_admin(p_user_id uuid, p_coupon text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon TEXT;
  v_sub_admin_id UUID;
  v_user public.users%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create sub admins.';
  END IF;

  -- Fetch target user
  SELECT * INTO v_user
  FROM public.users
  WHERE id = p_user_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found or inactive.');
  END IF;

  IF v_user.role != 'user' THEN
    RETURN jsonb_build_object('error', 'User is already an admin or sub admin.');
  END IF;

  -- Generate coupon if not provided
  v_coupon := COALESCE(
    p_coupon,
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
  );

  -- Ensure coupon is unique
  IF EXISTS (SELECT 1 FROM public.sub_admins WHERE coupon_code = v_coupon) THEN
    v_coupon := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
  END IF;

  -- Promote user role
  UPDATE public.users
  SET role = 'sub_admin'
  WHERE id = p_user_id;

  -- Create sub_admin record
  INSERT INTO public.sub_admins (user_id, full_name, email, coupon_code, created_by)
  VALUES (p_user_id, v_user.full_name, v_user.email, v_coupon, auth.uid())
  RETURNING id INTO v_sub_admin_id;

  RETURN jsonb_build_object(
    'success', true,
    'sub_admin_id', v_sub_admin_id,
    'coupon_code', v_coupon
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.promote_to_admin(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only existing admins can call this
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can promote users.';
  END IF;

  -- Cannot promote yourself (already admin)
  IF p_user_id = auth.uid() THEN
    RETURN jsonb_build_object('error', 'You are already an admin.');
  END IF;

  -- Check target user exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND is_active = true
  ) THEN
    RETURN jsonb_build_object('error', 'User not found or is inactive.');
  END IF;

  -- Promote
  UPDATE public.users
  SET role = 'admin'
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'promoted_user_id', p_user_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.demote_from_admin(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can demote users.';
  END IF;

  IF p_user_id = auth.uid() THEN
    RETURN jsonb_build_object('error', 'You cannot demote yourself.');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object('error', 'User is not an admin.');
  END IF;

  UPDATE public.users
  SET role = 'user'
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'demoted_user_id', p_user_id);
END;
$function$;

-- ─── 5. Grants (mirror LIVE exactly) ──────────────────────────────────────────
-- Verified against production (supabase db query --linked, information_schema.
-- routine_privileges) so a fresh database carries the SAME execute matrix as
-- production. Nothing may be PUBLIC-executable that production restricts, and
-- nothing legitimately PUBLIC in production is omitted here.

-- log_security_event: service_role ONLY (anon/authenticated forbidden).
REVOKE ALL ON FUNCTION public.log_security_event(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, jsonb) TO service_role;

-- Role-mutation RPCs: LIVE grants authenticated + service_role only and does
-- NOT expose PUBLIC. SECURITY DEFINER self-guards via is_admin(), but
-- defense-in-depth: revoke PUBLIC and replicate the exact live matrix.
REVOKE ALL ON FUNCTION public.create_sub_admin(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sub_admin(uuid, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.promote_to_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.demote_from_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.demote_from_admin(uuid) TO authenticated, service_role;

-- Lookup helpers: LIVE exposes validate_coupon / check_user_exists to
-- anon + authenticated + service_role (PUBLIC default remains, as in live).
GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_user_exists(text) TO anon, authenticated, service_role;

-- security_logs: no DML to anon/authenticated (lockdown re-asserted here for
-- fresh reproductions; 20260826000001 also applies it defensively).
REVOKE ALL ON TABLE public.security_logs FROM anon;
REVOKE ALL ON TABLE public.security_logs FROM authenticated;

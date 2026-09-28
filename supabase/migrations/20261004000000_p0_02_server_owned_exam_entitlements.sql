-- =============================================================================
-- P0-02  Server-owned exam entitlements
--
-- Vulnerability
--   public.is_exam_allowed_for_user(text) decided access by reading
--   public.users.exam_selection -- a column the account holder could write
--   directly (GRANT UPDATE (full_name, exam_selection, last_activity_date)
--   from 20260813200000_profile_security_remediation.sql) and which
--   handle_new_user populated verbatim from self-supplied signup metadata.
--   Any authenticated user could therefore grant themselves access to every
--   exam in a category: PATCH exam_selection='APPSC_GROUPS' unlocked
--   APPSC_GROUP_1..4 with no purchase, no admin action and no audit trail.
--
-- Design
--   Authorization moves out of the user row and into a server-owned table.
--   public.users.exam_selection survives as a *preference* only -- it is
--   validated against the caller's entitlements before it can be written, and
--   it no longer grants anything.
--
--   The grant vocabulary is deliberately wider than the current product so
--   that subscriptions, coupons, referrals and a future payment provider are
--   all expressible as data (`source`) rather than as schema changes. No
--   payment code is introduced here.
--
--   is_exam_allowed_for_user keeps its exact signature and volatility, so all
--   5 RLS policies and 9 RPCs that already depend on it migrate atomically
--   with this single rewrite.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. The entitlement table
--
-- exam_id is deliberately NOT foreign-keyed to public.exams: a 'group' grant
-- names a category (e.g. APPSC_GROUPS) that has no row in exams, only in
-- exam_configs.exam_selection. Group membership is therefore resolved through
-- exam_configs at read time, which means publishing a new exam inside a group
-- automatically extends existing group grants to it.
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_exam_entitlements (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_id     text        NOT NULL,
    scope       text        NOT NULL DEFAULT 'exam'
                            CHECK (scope IN ('exam', 'group')),
    valid_from  timestamptz NOT NULL DEFAULT now(),
    valid_until timestamptz,
    source      text        NOT NULL DEFAULT 'admin'
                            CHECK (source IN ('admin', 'migration', 'coupon',
                                              'referral', 'subscription', 'payment')),
    granted_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    revoked_at  timestamptz,
    metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_exam_entitlements_window_ck
        CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- At most one live grant per (user, target, scope); revoked rows are retained
-- as history so a grant/revoke cycle is auditable rather than destructive.
CREATE UNIQUE INDEX user_exam_entitlements_active_uk
    ON public.user_exam_entitlements (user_id, exam_id, scope)
    WHERE revoked_at IS NULL;

CREATE INDEX user_exam_entitlements_user_idx
    ON public.user_exam_entitlements (user_id);
CREATE INDEX user_exam_entitlements_exam_idx
    ON public.user_exam_entitlements (exam_id);

CREATE TRIGGER user_exam_entitlements_updated_at
    BEFORE UPDATE ON public.user_exam_entitlements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.user_exam_entitlements IS
    'Server-owned exam grants. The single source of truth for content access. '
    'exam_selection on public.users is a preference and grants nothing.';

-- Deny by construction: RLS on with no policies, and no table privilege.
-- Every read and write goes through a SECURITY DEFINER function, so the
-- server stays the sole owner of authorization state.
ALTER TABLE public.user_exam_entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_exam_entitlements FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Canonical resolver
--
-- One definition of "is this user entitled to this exam", shared by the RLS
-- policies, the RPCs and the preference validator. Private: revoked from
-- PUBLIC/anon/authenticated so it cannot be used to probe other users.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._pf_entitled_exam(
    p_user_id uuid,
    p_exam_id text
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
    SELECT EXISTS (
        SELECT 1
          FROM public.user_exam_entitlements e
         WHERE e.user_id = p_user_id
           AND e.revoked_at IS NULL
           AND e.valid_from <= now()
           AND (e.valid_until IS NULL OR e.valid_until > now())
           AND (
                 (e.scope = 'exam'  AND e.exam_id = p_exam_id)
              OR (e.scope = 'group' AND EXISTS (
                     SELECT 1 FROM public.exam_configs ec
                      WHERE ec.exam_id = p_exam_id
                        AND ec.exam_selection = e.exam_id))
               )
           )
$$;

REVOKE ALL    ON FUNCTION public._pf_entitled_exam(uuid, text) FROM PUBLIC;
REVOKE ALL    ON FUNCTION public._pf_entitled_exam(uuid, text) FROM anon;
REVOKE ALL    ON FUNCTION public._pf_entitled_exam(uuid, text) FROM authenticated;

-- -----------------------------------------------------------------------------
-- 3. The chokepoint, rewritten in place
--
-- Same name, same single text argument, same STABLE volatility: all 5 RLS
-- policies and 9 RPCs that call it are migrated by this one replacement.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_exam_allowed_for_user(p_exam_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
    SELECT public._pf_entitled_exam(auth.uid(), p_exam_id)
$$;

GRANT EXECUTE ON FUNCTION public.is_exam_allowed_for_user(text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Read side: the effective exam list
--
-- The client needs to render tabs from what the user actually has, so the
-- answer is computed by the server. Only published exams are returned, so the
-- client never has to re-derive the publication rule either.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_entitlements()
RETURNS TABLE (exam_id text, exam_selection text, exam_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
    SELECT DISTINCT ec.exam_id, ec.exam_selection, ec.name
      FROM public.exam_configs ec
     WHERE ec.is_published
       AND public._pf_entitled_exam(auth.uid(), ec.exam_id)
     ORDER BY ec.exam_id
$$;

-- EXECUTE defaults to PUBLIC, so the grant has to be paired with a revoke or
-- anon can still call it. The function is safe for anon (auth.uid() is NULL, so
-- it returns no rows) but a NULL-uid guard is a backstop, not an access policy.
REVOKE ALL ON FUNCTION public.get_my_entitlements() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_entitlements() TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Write side: exam_selection becomes a validated preference
--
-- The only path by which a user may change exam_selection. A value that is not
-- backed by a live entitlement is refused, so the preference can never imply
-- access and can never be used to smuggle a category name into the user row.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_preferred_exam(p_exam_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: no authenticated user';
    END IF;

    IF NOT public._pf_entitled_exam(v_uid, p_exam_id) THEN
        RAISE EXCEPTION
            'UNAUTHORIZED_ACCESS: exam_selection is a preference and cannot grant access to %',
            p_exam_id;
    END IF;

    UPDATE public.users
       SET exam_selection = p_exam_id
     WHERE id = v_uid;

    RETURN jsonb_build_object(
        'ok', true,
        'exam_id', p_exam_id,
        'entitled_exam_ids',
        COALESCE((SELECT jsonb_agg(r.exam_id ORDER BY r.exam_id)
                    FROM public.get_my_entitlements() r), '[]'::jsonb)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.set_preferred_exam(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_preferred_exam(text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. Admin authority over grants
--
-- Without these, revoking exam_selection as a grant would leave the system
-- unoperable: no new user could ever obtain access. Admin authority is over
-- the *grant mechanism*, which is distinct from role-based content access --
-- being an admin does not itself unlock any exam.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_grant_exam_entitlement(
    p_user_id     uuid,
    p_exam_id     text,
    p_scope       text    DEFAULT 'exam',
    p_valid_from  timestamptz DEFAULT now(),
    p_valid_until timestamptz DEFAULT NULL,
    p_source      text    DEFAULT 'admin',
    p_metadata    jsonb   DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: admin privileges required';
    END IF;
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: no authenticated user';
    END IF;

    IF p_scope NOT IN ('exam', 'group') THEN
        RAISE EXCEPTION 'INVALID_SCOPE: % (expected exam or group)', p_scope;
    END IF;
    IF p_source NOT IN ('admin', 'migration', 'coupon', 'referral',
                        'subscription', 'payment') THEN
        RAISE EXCEPTION 'INVALID_SOURCE: %', p_source;
    END IF;
    IF p_valid_until IS NOT NULL AND p_valid_until <= p_valid_from THEN
        RAISE EXCEPTION 'INVALID_WINDOW: valid_until must be after valid_from';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'USER_NOT_FOUND: %', p_user_id;
    END IF;
    IF p_scope = 'exam' AND NOT EXISTS (
        SELECT 1 FROM public.exams WHERE exam_id = p_exam_id) THEN
        RAISE EXCEPTION 'UNKNOWN_EXAM: %', p_exam_id;
    END IF;
    IF p_scope = 'group' AND NOT EXISTS (
        SELECT 1 FROM public.exam_configs WHERE exam_selection = p_exam_id) THEN
        RAISE EXCEPTION 'UNKNOWN_EXAM_GROUP: %', p_exam_id;
    END IF;

    INSERT INTO public.user_exam_entitlements (
        user_id, exam_id, scope, valid_from, valid_until,
        source, granted_by, metadata)
    VALUES (
        p_user_id, p_exam_id, p_scope, p_valid_from, p_valid_until,
        p_source, v_uid, COALESCE(p_metadata, '{}'::jsonb))
    ON CONFLICT (user_id, exam_id, scope) WHERE revoked_at IS NULL
    DO UPDATE SET valid_from   = EXCLUDED.valid_from,
                  valid_until = EXCLUDED.valid_until,
                  source      = EXCLUDED.source,
                  granted_by  = EXCLUDED.granted_by,
                  metadata    = EXCLUDED.metadata;

    RETURN jsonb_build_object('ok', true, 'user_id', p_user_id,
                              'exam_id', p_exam_id, 'scope', p_scope);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_exam_entitlement(
    p_user_id uuid,
    p_exam_id text,
    p_scope   text DEFAULT 'exam'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: admin privileges required';
    END IF;

    UPDATE public.user_exam_entitlements
       SET revoked_at = now()
     WHERE user_id = p_user_id
       AND exam_id = p_exam_id
       AND scope = p_scope
       AND revoked_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ENTITLEMENT_NOT_FOUND: % / % (%s)', p_user_id, p_exam_id, p_scope;
    END IF;

    RETURN jsonb_build_object('ok', true, 'user_id', p_user_id,
                              'exam_id', p_exam_id, 'scope', p_scope);
END;
$$;

-- Callable by authenticated, but the is_admin() guard inside is what actually
-- authorizes; revoking EXECUTE from authenticated would also break the admin
-- session, so the guard is the security boundary and is covered by the suite.
REVOKE ALL    ON FUNCTION public.admin_grant_exam_entitlement(uuid, text, text, timestamptz, timestamptz, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL    ON FUNCTION public.admin_revoke_exam_entitlement(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_grant_exam_entitlement(uuid, text, text, timestamptz, timestamptz, text, jsonb) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_revoke_exam_entitlement(uuid, text, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. Narrow the profile grant
--
-- Only exam_selection is removed. full_name and last_activity_date stay
-- self-writable, because neither can grant access to content, and stripping
-- them would break the profile page and the activity heartbeat for no
-- security benefit. The table-level UPDATE was already revoked in
-- 20260813200000, so this is the only writer that existed.
-- -----------------------------------------------------------------------------
REVOKE UPDATE (exam_selection) ON public.users FROM authenticated;

-- -----------------------------------------------------------------------------
-- 8. Backfill
--
-- The 8 users who currently hold a non-empty exam_selection keep exactly the
-- access they have today, translated into grants. 'APPSC' and 'APPSC_GROUPS'
-- both become a group grant on APPSC_GROUPS, which is what the old function
-- already did for both spellings.
--
-- The literal 'all' is deliberately NOT translated: the old function excluded
-- it explicitly (it appears in its NOT IN list), so granting it now would be a
-- privilege increase disguised as a migration.
--
-- source='migration' marks these rows so the origin of every pre-existing
-- grant stays visible after the fact.
-- -----------------------------------------------------------------------------
INSERT INTO public.user_exam_entitlements (
    user_id, exam_id, scope, source, metadata)
SELECT u.id,
       CASE WHEN u.exam_selection IN ('APPSC', 'APPSC_GROUPS')
            THEN 'APPSC_GROUPS' ELSE u.exam_selection END,
       CASE WHEN u.exam_selection IN ('APPSC', 'APPSC_GROUPS')
            THEN 'group' ELSE 'exam' END,
       'migration',
       jsonb_build_object('migrated_from', 'users.exam_selection',
                          'original_value', u.exam_selection)
  FROM public.users u
 WHERE u.exam_selection IS NOT NULL
   AND NULLIF(btrim(u.exam_selection), '') IS NOT NULL
   AND CASE
         WHEN u.exam_selection IN ('APPSC', 'APPSC_GROUPS') THEN
              EXISTS (SELECT 1 FROM public.exam_configs
                       WHERE exam_selection = 'APPSC_GROUPS')
         WHEN u.exam_selection = 'all' THEN false
         ELSE EXISTS (SELECT 1 FROM public.exams WHERE exam_id = u.exam_selection)
       END
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 9. Retire the orphaned exam_selection enum
--
-- public.exam_selection (the enum) is not the column and never was. It is a
-- leftover type whose labels are a hardcoded exam list. Verified on live before
-- this migration: zero columns, zero casts, zero function arguments or return
-- types, zero column defaults, zero constraints, and zero non-internal entries in
-- pg_depend. No migration in this repository ever created it. It shadows the
-- column name in PostgREST's schema cache and invites the exact confusion this
-- migration exists to remove, so it goes.
--
-- The guard re-verifies at apply time and simply leaves the type alone if any
-- dependency has appeared since. There is deliberately no CASCADE, so a
-- dependency that the check somehow missed would abort the DROP rather than
-- silently taking a dependent object with it.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_oid oid;
BEGIN
    SELECT t.oid INTO v_oid
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public'
       AND t.typname = 'exam_selection'
       AND t.typtype = 'e';

    IF v_oid IS NULL THEN
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_depend d
         WHERE d.refobjid = v_oid
           AND d.deptype <> 'i'
    ) THEN
        EXECUTE 'DROP TYPE public.exam_selection';
        RAISE NOTICE 'P0-02: dropped orphaned enum public.exam_selection';
    ELSE
        RAISE NOTICE
            'P0-02: public.exam_selection has dependents; left in place';
    END IF;
END;
$$;

-- PostgREST schema cache must see the new table and RPCs immediately.
NOTIFY pgrst, 'reload schema';

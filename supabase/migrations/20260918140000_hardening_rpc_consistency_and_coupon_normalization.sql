-- =============================================================================
-- MIGRATION: RPC consistency hardening — exam publish/window guard (9.3),
-- access-predicate parity (9.4), coupon case/trim normalization (9.5)
-- Date: 2026-09-18 (sub-admin panel production hardening)
--
-- PURPOSE (maps to master audit findings 9.3, 9.4, 9.5):
--   9.3 LOW — get_teacher_exam_questions returned draft + out-of-window exam
--       question TEXT to linked students (answers always stripped for
--       non-owners). The attempt layer (create_attempt) already enforces
--       published + window against server now(); this closes the pre-start
--       question-read layer so a linked student can never read question text
--       before publish or outside [start_time, end_time]. Owners (admin /
--       owning sub-admin) still read any status for authoring/preview.
--   9.4 LOW — is_teacher_exam_active only admitted students linked via
--       users.editor_id = sub_admins.user_id, missing the users.sub_admin_id
--       link, owning sub-admin, and admin that _pf_teacher_exam_access already
--       admits. It now delegates its access check to the single canonical
--       predicate _pf_teacher_exam_access (one source of truth).
--   9.5 LOW — coupon case/trim inconsistency: handle_new_user matched stored
--       coupons verbatim from signup metadata (trim only, no uppercase);
--       validate_coupon matched verbatim; link_user_to_educator and
--       admin_create_sub_admin_profile already normalize upper+btrim. Both
--       verbatim matchers now normalize (upper(btrim(...))), so every read
--       path agrees with the canonical stored form. LIVE data was probed and
--       is already normalized (0 non-normalized coupons, 0 post-normalization
--       collisions) — no data migration needed, defensive normalization of the
--       match only.
--
--   NOTE (finding 9.6 INFO): the hardcoded bootstrap admin
--       833df519-0ac4-4f93-bf8b-d18ca59278a6 used as the created_by fallback
--       in handle_user_role_change is a REAL, ACTIVE live admin
--       (role='admin', verified 2026-09-18). No change required — documented.
--
-- FORWARD-ONLY. One transaction. All redefined bodies preserve existing
-- security posture (SECURITY DEFINER, pinned search_path). Grants re-asserted
-- for the redefined RPCs to keep the fresh-DB contract explicit.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 9.4: is_teacher_exam_active — canonical access predicate
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_teacher_exam_active(p_exam_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_start  timestamptz;
    v_end    timestamptz;
    v_exists boolean;
BEGIN
    SELECT te.start_time, te.end_time, TRUE
    INTO   v_start, v_end, v_exists
    FROM   public.teacher_exams te
    WHERE  te.id = p_exam_id;

    IF v_exists IS NOT TRUE THEN
        RAISE EXCEPTION 'Teacher exam not found or access denied';
    END IF;

    -- Access is decided by the SAME canonical predicate used by
    -- get_teacher_exam_questions / get_teacher_exam_leaderboard / create_attempt
    -- (admin, owning sub-admin, linked student via educator_id OR via
    -- users.sub_admin_id). One predicate = no predicate drift.
    IF NOT public._pf_teacher_exam_access(p_exam_id) THEN
        RAISE EXCEPTION 'Teacher exam not found or access denied';
    END IF;

    RETURN now() >= v_start AND now() <= v_end;
EXCEPTION
    WHEN raise_exception THEN
        RAISE;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'is_teacher_exam_active: %', SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.is_teacher_exam_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_teacher_exam_active(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 9.3: get_teacher_exam_questions — published + live-window for non-owners
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_teacher_exam_questions(p_teacher_exam_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sub_admin_id uuid;
    v_status       text;
    v_start        timestamptz;
    v_end          timestamptz;
    v_is_owner     boolean;
    v_out          jsonb;
BEGIN
    SELECT te.sub_admin_id, te.status, te.start_time, te.end_time
      INTO v_sub_admin_id, v_status, v_start, v_end
      FROM public.teacher_exams te
     WHERE te.id = p_teacher_exam_id;
    IF v_sub_admin_id IS NULL THEN
        RAISE EXCEPTION 'TEACHER_EXAM_NOT_AVAILABLE';
    END IF;

    IF NOT public._pf_teacher_exam_access(p_teacher_exam_id) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
    END IF;

    v_is_owner := public.is_admin()
        OR EXISTS (
             SELECT 1 FROM public.sub_admins sa
              WHERE sa.id = v_sub_admin_id AND sa.user_id = auth.uid()
           );

    -- Non-owners (linked students) must never read question text before the
    -- exam is published or outside its scheduled [start_time, end_time]
    -- (server now(), mirroring create_attempt's enforcement). Owners may read
    -- any status for authoring/preview.
    IF NOT v_is_owner THEN
        IF v_status <> 'published' THEN
            RAISE EXCEPTION 'TEACHER_EXAM_NOT_AVAILABLE';
        END IF;
        IF now() < v_start THEN
            RAISE EXCEPTION 'EXAM_NOT_STARTED';
        END IF;
        IF now() > v_end THEN
            RAISE EXCEPTION 'EXAM_WINDOW_CLOSED';
        END IF;
    END IF;

    IF v_is_owner THEN
        SELECT COALESCE(jsonb_agg(row_to_json(q)), '[]'::jsonb) INTO v_out
          FROM (
            SELECT q.id,
                   q.question_text_en, q.question_text_te,
                   q.option_a_en, q.option_a_te,
                   q.option_b_en, q.option_b_te,
                   q.option_c_en, q.option_c_te,
                   q.option_d_en, q.option_d_te,
                   q.correct_option,
                   q.explanation_en, q.explanation_te,
                   q.display_order, q.diagram
              FROM public.teacher_exam_questions q
             WHERE q.teacher_exam_id = p_teacher_exam_id
             ORDER BY q.display_order ASC, q.id ASC
          ) q;
    ELSE
        SELECT COALESCE(jsonb_agg(row_to_json(q)), '[]'::jsonb) INTO v_out
          FROM (
            SELECT q.id,
                   q.question_text_en, q.question_text_te,
                   q.option_a_en, q.option_a_te,
                   q.option_b_en, q.option_b_te,
                   q.option_c_en, q.option_c_te,
                   q.option_d_en, q.option_d_te,
                   q.display_order, q.diagram
              FROM public.teacher_exam_questions q
             WHERE q.teacher_exam_id = p_teacher_exam_id
             ORDER BY q.display_order ASC, q.id ASC
          ) q;
    END IF;

    RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.get_teacher_exam_questions(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_teacher_exam_questions(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_teacher_exam_questions(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 9.5: coupon normalization — match against the canonical upper+btrim form
-- ---------------------------------------------------------------------------
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
    -- Normalize the probe to the canonical stored form (upper + trim) so
    -- "abc123" / " ABC123 " resolve identically to the stored "ABC123".
    SELECT true, full_name, user_id
    INTO v_valid, v_name, v_user_id
    FROM public.sub_admins
    WHERE coupon_code = upper(btrim(p_coupon)) AND status = 'active';

    RETURN jsonb_build_object(
        'valid', coalesce(v_valid, false),
        'sub_admin_name', v_name,
        'educator_id', v_user_id
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.validate_coupon(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_coupon text;
    v_sub_admin_id uuid;
    v_educator_id uuid;
    v_full_name text;
    v_role_str text;
    v_exam_selection text;
BEGIN
    -- 1. Extract and sanitize metadata (coupon normalized to canonical
    --    upper+btrim form so verbatim matching agrees with link_user_to_educator
    --    and admin_create_sub_admin_profile).
    v_coupon := NULLIF(upper(btrim(new.raw_user_meta_data->>'coupon_code')), '');

    -- Safe UUID extraction for educator_id
    BEGIN
        v_educator_id := NULLIF(TRIM(new.raw_user_meta_data->>'educator_id'), '')::uuid;
    EXCEPTION WHEN others THEN
        v_educator_id := NULL;
    END;

    -- Safe Extract exam_selection as text directly
    v_exam_selection := NULLIF(TRIM(new.raw_user_meta_data->>'exam_selection'), '');

    v_full_name := COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1));

    -- SECURITY HARDENING (audit C-2): role is NEVER taken from client-
    -- controllable signup metadata. The public auth endpoint accepts
    -- arbitrary metadata, so trusting it allowed privilege escalation.
    -- Every new signup is a plain 'user'; privileged roles are granted
    -- exclusively through server-side authority after account creation
    -- (onboard-sub-admin Edge Function / promote_to_admin as admin).
    v_role_str := 'user';

    -- 2. If educator_id is provided, find sub_admin_id
    IF v_educator_id IS NOT NULL THEN
        SELECT id INTO v_sub_admin_id
        FROM public.sub_admins
        WHERE user_id = v_educator_id;
    END IF;

    -- 3. If no educator_id but coupon exists, find via coupon
    IF v_educator_id IS NULL AND v_coupon IS NOT NULL THEN
        SELECT id, user_id INTO v_sub_admin_id, v_educator_id
        FROM public.sub_admins
        WHERE coupon_code = v_coupon AND status = 'active';
    END IF;

    -- 4. Final insertion
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        coupon_code,
        sub_admin_id,
        educator_id,
        coupon_code_used,
        exam_selection,
        created_at
    )
    VALUES (
        new.id,
        new.email,
        v_full_name,
        v_role_str::public.user_role,
        v_coupon,
        v_sub_admin_id,
        v_educator_id,
        (v_coupon IS NOT NULL),
        v_exam_selection,
        now()
    );

    RETURN new;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

COMMIT;
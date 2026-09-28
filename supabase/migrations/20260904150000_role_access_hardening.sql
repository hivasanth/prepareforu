-- =============================================================================
-- MIGRATION: ROLE & ACCESS hardening (ROLE-AUDIT v1.0 implementation)
-- Date: 2026-09-04
--
-- Implements the recommendations from ROLE_AND_ACCESS_CONTROL_AUDIT_REPORT.md
-- (P2-03 service least privilege, P2-05 create_new_exam_rpc anon/PUBLIC grant,
--  P2-06 legacy apply_coupon, P3-04 PUBLIC helper RPC grants) plus the audit
--  discovered during implementation:
--    1. `questions` had `sub_admin_full_access_v2` (ALL) letting SUB-ADMINS
--       create/update/delete in the GLOBAL admin question bank. Sub-admins write
--       their own exam questions to `teacher_exam_questions` (RPC-access only);
--       they must NOT mutate the admin bank. Fix: DROP that ALL policy so
--       sub-admins retain SELECT-only via `questions_select_admin_subadmin_v2`.
--    2. Legacy `apply_coupon` (SECURITY DEFINER, EXECUTE auth+svc) lacked the
--       anti-reuse guard that `link_user_to_educator` has, and has ZERO
--       consumers in src/ (client uses `link_user_to_educator`). DROP it.
--    3. anon/PUBLIC EXECUTE on benign/legacy RPCs tightened to authenticated
--       (and service_role for the trigger helper) only.
--
-- Live verification performed: all functions called through the app (create
-- teacher exam, coupon linking, exam creation) are authenticated-only callers
-- already; sub-admin exam ownership is enforced through auth.uid()-derived
-- current_sub_admin_id() (verified in create_teacher_exam_atomic + teacher_exams
-- RLS) — no change needed there.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SUB-ADMIN question-bank over-grant (audit-new, P1-class).
--    DROP the ALL policy so sub-admins can no longer INSERT/UPDATE/DELETE in the
--    global `questions` bank. SELECT is preserved by questions_select_admin_
--    subadmin_v2 (admin OR sub_admin). Admin retains admin_full_access_v2 (ALL).
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS sub_admin_full_access_v2 ON public.questions;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. P2-06: legacy duplicate coupon path (no anti-reuse guard, zero consumers).
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.apply_coupon(text);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. P2-05 / P3-04: EXECUTE least-privilege.
--    - create_new_exam_rpc            : anon/PUBLIC -> authenticated only
--    - get_user_role                  : anon/PUBLIC -> authenticated only
--    - sync_sub_admin_coupon_to_users : anon/PUBLIC -> authenticated + service_role
--    - link_user_to_educator          : anon        -> authenticated only (requires auth.uid())
--    - legacy INVOKER create_teacher_exam_with_questions (teacher_exam_status):
--      anon/PUBLIC -> authenticated only (dead surface kept for safety)
--
--    Published/education question servers are not surfaced here; the active
--    sub-admin writer is create_teacher_exam_atomic (already authenticated-only).
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    r record;
BEGIN
    -- anon/PUBLIC -> authenticated (drop anon + PUBLIC, keep authenticated)
    FOR r IN
        SELECT p.proname, p.oid::regprocedure AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN (
                'create_new_exam_rpc',
                'get_user_role',
                'link_user_to_educator'
              )
    LOOP
        RAISE NOTICE 'revoking anon/public from %', r.sig;
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    END LOOP;

    -- sync_sub_admin_coupon_to_users: authenticated + service_role (trigger helper)
    FOR r IN
        SELECT p.proname, p.oid::regprocedure AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'sync_sub_admin_coupon_to_users'
    LOOP
        RAISE NOTICE 'syncing exec grants for %', r.sig;
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
    END LOOP;

    -- legacy INVOKER create_teacher_exam_with_questions (teacher_exam_status):
    -- drop anon + PUBLIC, keep authenticated
    FOR r IN
        SELECT p.proname, p.oid::regprocedure AS sig
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'create_teacher_exam_with_questions'
          AND p.prosecdef = false
    LOOP
        RAISE NOTICE 'revoking anon/public from invoker %', r.sig;
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    END LOOP;
END;
$$;

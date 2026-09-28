-- =============================================================================
-- Migration: 20260917000000_fix_velocity_guard_and_db_hygiene
-- Date: 2026-09-17 (applied to LIVE project xbjhlfwqmcyatblsrhxn)
--
-- Background (from the LIVE DB + migration sync + production readiness audit of
-- the Admin Questions page):
--   * exam_velocity_logs was created out-of-band and reconstructed by
--     20260401000001 with RLS ENABLED but ZERO policies.
--   * The admin page's delete-guard (findVelocityReferencedQuestionIds ->
--     question.repository.ts:231) reads exam_velocity_logs over REST as role
--     `authenticated`. With zero policies, Postgres default-deny SILENTLY
--     returns no rows (no error) - verified live with an in-transaction marker
--     row. INSERT is denied (42501), SELECT just filters everything out.
--   * Result: referencedIds is always [], the soft-archive branch
--     (deactivateQuestion) never fires, and velocity-referenced questions
--     would be HARD-deleted instead of archived.
--
-- Fixes:
--   1. exam_velocity_logs - add admin ALL + sub_admin SELECT RLS policies
--      (mirrors the questions-table admin pattern) + an index on question_id
--      backing the guard query.
--   2. questions - drop duplicate CHECK constraints observed live:
--      * questions_correct_option_check (identical to chk_questions_correct_option_valid)
--      * chk_question_en_not_empty (looser duplicate of chk_questions_question_text_en_not_empty)
--   3. Least-privilege (defense in depth): revoke ALL anon privileges on
--      exam_velocity_logs and prompt_templates. RLS alone already gates reads
--      to admin/sub_admin/authenticated - direct grants are removed so the
--      privilege model matches the effective model.
--   4. Hygiene: revoke PUBLIC/anon EXECUTE from trigger function
--      check_exam_velocity (same pattern as 20260910000002; triggers fire
--      independent of direct EXECUTE grants).
--
-- INTENTIONAL (DO NOT "fix"): is_admin()/is_sub_admin() keep PUBLIC EXECUTE.
-- They are referenced by public-role RLS policies (e.g. exam_configs_select_all
-- uses is_admin() OR is_sub_admin()); revoking would break anon reads of
-- published exam_configs. They are safe boolean SECURITY DEFINER gates over
-- auth.uid().
--
-- Idempotent: policy drop+create is guarded; all ALTER/REVOKE use IF EXISTS /
-- are restart-safe.
-- =============================================================================

BEGIN;

-- ─── 1. exam_velocity_logs RLS policies (admin ALL, sub_admin SELECT) ────────
DROP POLICY IF EXISTS rls_exam_velocity_logs_admin_all ON public.exam_velocity_logs;
DROP POLICY IF EXISTS rls_exam_velocity_logs_sub_admin_select ON public.exam_velocity_logs;

CREATE POLICY rls_exam_velocity_logs_admin_all
    ON public.exam_velocity_logs
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY rls_exam_velocity_logs_sub_admin_select
    ON public.exam_velocity_logs
    FOR SELECT
    TO authenticated
    USING (public.is_sub_admin());

-- Guard query path: findVelocityReferencedQuestionIds (question_id IN (...)).
CREATE INDEX IF NOT EXISTS idx_exam_velocity_logs_question_id
    ON public.exam_velocity_logs (question_id);

-- ─── 2. questions - drop duplicate CHECK constraints ─────────────────────────
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_correct_option_check;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS chk_question_en_not_empty;

-- ─── 3. Least-privilege (anon) ────────────────────────────────────────────────
REVOKE ALL ON TABLE public.exam_velocity_logs FROM anon;
REVOKE ALL ON TABLE public.prompt_templates FROM anon;

-- ─── 4. Trigger-fn EXECUTE hygiene ────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.check_exam_velocity() FROM PUBLIC, anon;

COMMIT;
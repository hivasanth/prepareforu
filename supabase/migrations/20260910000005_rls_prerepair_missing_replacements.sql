-- ─────────────────────────────────────────────────────────────────────────────
-- 20260910000005_rls_prerepair_missing_replacements.sql
--
-- PURPOSE
--   PREREQUISITE for 20260910000003_rls_policy_reconciliation.sql.
--
--   The reconciliation migration DROPs legacy old-name policies and relies on
--   their `rls_*` replacements being already present (they are, on a fresh chain
--   replay). LIVE, however, was never migrated by 20260701000004 /
--   20260721000001 (both unrecorded remotely — the 44/115 drift), so those
--   replacement policies DO NOT exist on LIVE. A bare apply of 20260910000003
--   would therefore LOCK the following tables (DROP with no replacement):
--     attempt_answers, daily_stats, exam_versions, exams,
--     prepare_sessions, prompt_templates, question_upload_prompts.
--
--   This migration recreates EXACTLY the eight replacement policies that
--   20260910000003's DROPs require (guarded, idempotent — every statement is a
--   no-op on LIVE after this migration and on a fresh replay). Every policy below
--   is EQUIVALENT or STRICTER than the legacy policy it replaces; none widens
--   the current LIVE access set, and NONE touches the answer-key lockdown
--   (attempt_answers INSERT stays RPC-only via answers_insert_rpc_only; the
--   chain's direct-client rls_attempt_answers_user_insert/update are NOT
--   recreated here — that asymmetry is the intended LIVE converge state and is
--   documented in the 2026-09-11 parity report).
--
-- DESIGN RULES (binding, never relaxed — mirrors 20260910000003)
--   * Every CREATE POLICY is wrapped in a DO block guarding on (polname,
--     polrelid) so LIVE reapply and fresh replay are safe no-ops.
--   * Definitions below are transcribed VERBATIM from the chain migrations:
--       20260701000004_rls_content_tables.sql
--       20260721000001_security_rls_and_validation.sql
--   * No policy is added that would WIDEN LIVE access (sub-admin ALL on
--     exam_versions, rls_exam_configs_user_select USING(true), direct-client
--     attempt_answers INSERT, etc. are deliberately NOT included).
--
-- Deployment note (repo-established workflow): LIVE is applied via
-- `supabase db query --linked < this file`; a fresh DB gets it normally via
-- `supabase db push`. After live apply, the version is recorded remotely
-- via `supabase migration repair --status applied`.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. attempt_answers.rls_attempt_answers_admin_all (origin 20260721000001)
--        ALL | authenticated | USING (auth.uid() IS NOT NULL AND is_admin())
--        WITH CHECK (is_admin())
--        Replaces legacy answers_select_admin (SELECT is_admin()).
--        STRICTER: now demands an authenticated uid in addition to is_admin().
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'rls_attempt_answers_admin_all'
      AND polrelid = 'public.attempt_answers'::regclass
  ) THEN
    CREATE POLICY "rls_attempt_answers_admin_all"
      ON public.attempt_answers
      FOR ALL
      TO authenticated
      USING (auth.uid() IS NOT NULL AND is_admin())
      WITH CHECK (is_admin());
  END IF;
END
$$;

-- ─── 2. daily_stats.rls_daily_stats_admin_all (origin 20260701000004)
--        ALL | authenticated | USING (is_admin()) WITH CHECK (is_admin())
--        Replaces legacy daily_stats_admin (SELECT is_admin()).
--        EQUIVALENT for admins; STRICTER (adds WITH CHECK on writes).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'rls_daily_stats_admin_all'
      AND polrelid = 'public.daily_stats'::regclass
  ) THEN
    CREATE POLICY "rls_daily_stats_admin_all"
      ON public.daily_stats
      FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END
$$;

-- ─── 3. exam_versions.rls_exam_versions_admin_all (origin 20260701000004)
--        ALL | authenticated | USING (is_admin()) WITH CHECK (is_admin())
--        Replaces legacy exam_versions_write_admin (ALL, USING+WC is_admin()).
--        EQUIVALENT (also narrower role set: authenticated only).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'rls_exam_versions_admin_all'
      AND polrelid = 'public.exam_versions'::regclass
  ) THEN
    CREATE POLICY "rls_exam_versions_admin_all"
      ON public.exam_versions
      FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END
$$;

-- ─── 4. exams.rls_exams_admin_all (origin 20260721000001)
--        ALL | authenticated | USING (auth.uid() IS NOT NULL AND is_admin())
--        WITH CHECK (is_admin())
--        Replaces legacy "Exams are manageable by admins" (ALL, USING+WC
--        EXISTS users role=admin). EQUIVALENT for admins; STRICTER (demands
--        non-null auth.uid()).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'rls_exams_admin_all'
      AND polrelid = 'public.exams'::regclass
  ) THEN
    CREATE POLICY "rls_exams_admin_all"
      ON public.exams
      FOR ALL
      TO authenticated
      USING (auth.uid() IS NOT NULL AND is_admin())
      WITH CHECK (is_admin());
  END IF;
END
$$;

-- ─── 5. exams.rls_exams_authenticated_select (origin 20260721000001)
--        SELECT | authenticated | USING (auth.uid() IS NOT NULL)
--        Replaces legacy "Exams are viewable by everyone" (SELECT true, PUBLIC).
--        STRICTER: anon no longer reads exams; only authenticated may.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'rls_exams_authenticated_select'
      AND polrelid = 'public.exams'::regclass
  ) THEN
    CREATE POLICY "rls_exams_authenticated_select"
      ON public.exams
      FOR SELECT
      TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
END
$$;

-- ─── 6. prepare_sessions.rls_prepare_sessions_user_all (origin 20260701000004)
--        ALL | authenticated | USING (user_id = auth.uid())
--        WITH CHECK (user_id = auth.uid())
--        Replaces legacy prepare_sessions_own (ALL, USING user_id=auth.uid(),
--        no WITH CHECK). EQUIVALENT/STRICTER.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'rls_prepare_sessions_user_all'
      AND polrelid = 'public.prepare_sessions'::regclass
  ) THEN
    CREATE POLICY "rls_prepare_sessions_user_all"
      ON public.prepare_sessions
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END
$$;

-- ─── 7. prompt_templates.rls_prompt_templates_admin_all (origin 20260701000004)
--        ALL | authenticated | USING (is_admin()) WITH CHECK (is_admin())
--        Replaces legacy "Admins can manage prompt templates" (ALL, USING+WC
--        role IN ('admin','sub_admin')). STRICTER: sub-admins lose prompt
--        template management (chain intent from 20260502 hardening).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'rls_prompt_templates_admin_all'
      AND polrelid = 'public.prompt_templates'::regclass
  ) THEN
    CREATE POLICY "rls_prompt_templates_admin_all"
      ON public.prompt_templates
      FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END
$$;

-- ─── 8. question_upload_prompts.rls_question_upload_prompts_admin_all
--        (origin 20260701000004)
--        ALL | authenticated | USING (is_admin()) WITH CHECK (is_admin())
--        Replaces legacy prompts_select_admin (SELECT is_admin()) +
--        prompts_write_admin (ALL is_admin()). EQUIVALENT/STRICTER (single
--        policy gating READ and WRITE by is_admin()).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'rls_question_upload_prompts_admin_all'
      AND polrelid = 'public.question_upload_prompts'::regclass
  ) THEN
    CREATE POLICY "rls_question_upload_prompts_admin_all"
      ON public.question_upload_prompts
      FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STRUCTURAL REGRESSION TEST (runs on both LIVE and replay)
--   Verify all replacement policies now exist; the reconciliation migration
--   (20260910000003) is ONLY safe to apply after all rows show PASS.
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  'TEST PR1: attempt_answers.rls_attempt_answers_admin_all' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname='rls_attempt_answers_admin_all'
      AND polrelid='public.attempt_answers'::regclass
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT
  'TEST PR2: daily_stats.rls_daily_stats_admin_all' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname='rls_daily_stats_admin_all'
      AND polrelid='public.daily_stats'::regclass
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT
  'TEST PR3: exam_versions.rls_exam_versions_admin_all' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname='rls_exam_versions_admin_all'
      AND polrelid='public.exam_versions'::regclass
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT
  'TEST PR4: exams.rls_exams_admin_all' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname='rls_exams_admin_all'
      AND polrelid='public.exams'::regclass
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT
  'TEST PR5: exams.rls_exams_authenticated_select' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname='rls_exams_authenticated_select'
      AND polrelid='public.exams'::regclass
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT
  'TEST PR6: prepare_sessions.rls_prepare_sessions_user_all' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname='rls_prepare_sessions_user_all'
      AND polrelid='public.prepare_sessions'::regclass
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT
  'TEST PR7: prompt_templates.rls_prompt_templates_admin_all' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname='rls_prompt_templates_admin_all'
      AND polrelid='public.prompt_templates'::regclass
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT
  'TEST PR8: question_upload_prompts.rls_question_upload_prompts_admin_all' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname='rls_question_upload_prompts_admin_all'
      AND polrelid='public.question_upload_prompts'::regclass
  ) THEN 'PASS' ELSE 'FAIL' END;
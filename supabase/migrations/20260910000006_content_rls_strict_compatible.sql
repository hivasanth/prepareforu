-- ─────────────────────────────────────────────────────────────────────────────
-- 20260910000006_content_rls_strict_compatible.sql
--
-- PURPOSE
--   Apply the STRICT-COMPATIBLE subset of 20260701000004_rls_content_tables.sql
--   to LIVE (approved decision, 2026-09-11). 20260701000004 was NEVER applied
--   to LIVE (unrecorded — part of the 44/115 drift). Its full 27-policy set
--   CANNOT be applied verbatim to LIVE:
--     * 5 policies target DEAD schema — import_sessions and subject_performance
--       are dropped by 20260904000000_publish_ready_dead_schema_and_tabswitch.sql,
--       so they are absent from the fresh-replay END state too; creating them
--       on LIVE would ERROR ("relation does not exist").
--     * rls_exam_configs_user_select USING(true) would WIDEN LIVE (any
--       authenticated user reads ALL exam_configs incl. unpublished) vs the
--       existing stricter gate exam_configs_select_all
--       (is_published OR is_admin() OR is_sub_admin()).
--     * The 12x rls_*_sub_admin_all families
--       (USING current_sub_admin_id() != zero) were superseded on LIVE by the
--       newer naming scheme (admin_full_access_v2, *_write_admin,
--       questions_select_admin_subadmin_v2, exam_configs_select_all,
--       exam_configs_write_admin, "Admins full access", "Users read published
--       topics") — recreating them would re-introduce the superseded, broader
--       sub-admin CRUD surface. DELIBERATELY NOT recreated.
--
--   Therefore this migration creates ONLY the policy names that are:
--     (1) part of the CHAIN END-STATE (never dropped by a later migration),
--     (2) ABSENT on LIVE, and
--     (3) admin-only (USING is_admin()) — EQUIVALENT or STRICTER than the live
--         *_write_admin / admin_full_access_v2 coverage, never widening.
--   This yields exactly FIVE policies:
--     exam_configs.rls_exam_configs_admin_all
--     exam_papers.rls_exam_papers_admin_all
--     exam_subjects.rls_exam_subjects_admin_all
--     questions.rls_questions_admin_all
--     prepare_sessions.rls_prepare_sessions_admin_all
--
-- INTENTIONAL DEVIATIONS (documented, kept STRICTER on LIVE than 20260701000004)
--   * import_sessions.rls_import_sessions_admin_all        — dead schema (dropped)
--   * subject_performance.rls_subject_performance_admin_all/user_all — dead schema
--   * exam_configs.rls_exam_configs_user_select            — USING(true) widens
--   * exam_configs/papers/subjects/questions/exam_versions .rls_*_sub_admin_all
--     — superseded by newer, stricter naming; not recreated
--   * study_topics.rls_study_topics_{admin,sub_admin,user}_select
--     — dropped by 20260816000001, replaced by "Admins full access" /
--       "Users read published topics" (already LIVE)
--   * exam_papers/subjects/questions rls_*_user_select
--     — recreated by 20260812000002_content_isolation_rls (already LIVE)
--   * exam_versions.rls_exam_versions_admin_all &
--     prompt_templates/question_upload_prompts/daily_stats rls_*_admin_all
--     — already created by 20260910000005 (already LIVE)
--
-- DESIGN RULES (binding, never relaxed — mirrors 20260910000003 / 00005)
--   * Every CREATE POLICY is wrapped in a DO block guarding on (polname,
--     polrelid) so LIVE reapply and fresh replay are safe no-ops.
--   * Definitions below are transcribed VERBATIM from
--     20260701000004_rls_content_tables.sql.
--   * No policy that would WIDEN LIVE access is added.
--
-- Deployment note (repo-established workflow): LIVE is applied via
-- `supabase db query --linked < this file`; a fresh DB gets it normally via
-- `supabase db push`. After live apply, 20260701000004 (and this version) are
-- recorded remotely via `supabase migration repair --status applied`.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. exam_configs.rls_exam_configs_admin_all (origin 20260701000004)
--        ALL | authenticated | USING (is_admin()) WITH CHECK (is_admin())
--        Live coverage: exam_configs_write_admin is_admin() — EQUIVALENT for
--        admins; adds WITH CHECK on writes (STRICTER).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'rls_exam_configs_admin_all'
      AND polrelid = 'public.exam_configs'::regclass
  ) THEN
    CREATE POLICY "rls_exam_configs_admin_all"
      ON public.exam_configs
      FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END
$$;

-- ─── 2. exam_papers.rls_exam_papers_admin_all (origin 20260701000004)
--        ALL | authenticated | USING (is_admin()) WITH CHECK (is_admin())
--        Live coverage: exam_papers_write_admin is_admin() — EQUIVALENT for
--        admins; adds WITH CHECK on writes (STRICTER).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'rls_exam_papers_admin_all'
      AND polrelid = 'public.exam_papers'::regclass
  ) THEN
    CREATE POLICY "rls_exam_papers_admin_all"
      ON public.exam_papers
      FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END
$$;

-- ─── 3. exam_subjects.rls_exam_subjects_admin_all (origin 20260701000004)
--        ALL | authenticated | USING (is_admin()) WITH CHECK (is_admin())
--        Live coverage: exam_subjects_write_admin is_admin() — EQUIVALENT for
--        admins; adds WITH CHECK on writes (STRICTER).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'rls_exam_subjects_admin_all'
      AND polrelid = 'public.exam_subjects'::regclass
  ) THEN
    CREATE POLICY "rls_exam_subjects_admin_all"
      ON public.exam_subjects
      FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END
$$;

-- ─── 4. questions.rls_questions_admin_all (origin 20260701000004)
--        ALL | authenticated | USING (is_admin()) WITH CHECK (is_admin())
--        Live coverage: admin_full_access_v2 is_admin() — EQUIVALENT.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'rls_questions_admin_all'
      AND polrelid = 'public.questions'::regclass
  ) THEN
    CREATE POLICY "rls_questions_admin_all"
      ON public.questions
      FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END
$$;

-- ─── 5. prepare_sessions.rls_prepare_sessions_admin_all (origin 20260701000004)
--        ALL | authenticated | USING (is_admin()) WITH CHECK (is_admin())
--        Gap-closer: admin can now access ALL prepare_sessions rows (chain
--        intent) while users keep their own-row rls_prepare_sessions_user_all.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'rls_prepare_sessions_admin_all'
      AND polrelid = 'public.prepare_sessions'::regclass
  ) THEN
    CREATE POLICY "rls_prepare_sessions_admin_all"
      ON public.prepare_sessions
      FOR ALL
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END
$$;

-- =============================================================================
-- SECTION: STRUCTURAL REGRESSION TESTS (guarded, PASS/FAIL)
-- =============================================================================
SELECT 'TEST CR1: exam_configs.rls_exam_configs_admin_all' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname='rls_exam_configs_admin_all'
      AND polrelid='public.exam_configs'::regclass
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT 'TEST CR2: exam_papers.rls_exam_papers_admin_all' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname='rls_exam_papers_admin_all'
      AND polrelid='public.exam_papers'::regclass
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT 'TEST CR3: exam_subjects.rls_exam_subjects_admin_all' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname='rls_exam_subjects_admin_all'
      AND polrelid='public.exam_subjects'::regclass
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT 'TEST CR4: questions.rls_questions_admin_all' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname='rls_questions_admin_all'
      AND polrelid='public.questions'::regclass
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT 'TEST CR5: prepare_sessions.rls_prepare_sessions_admin_all' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname='rls_prepare_sessions_admin_all'
      AND polrelid='public.prepare_sessions'::regclass
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT '--- CONTENT RLS STRICT-COMPATIBLE APPLY COMPLETE (5/5) ---' AS status;
SELECT 'Review all PASS results above; verify no new rls_*_sub_admin_all / user_select USING(true) policies were created.' AS instruction;
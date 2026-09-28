-- ─────────────────────────────────────────────────────────────────────────────
-- 20260910000007_index_parity.sql
--
-- PURPOSE
--   Phase 6 (index verification): closes the index gap from the
--   20260910000006 strict-compatible adaptation.
--
--   20260701000004_rls_content_tables.sql ends with a PERFORMANCE INDEXES
--   trailer (lines 209-215). LIVE index verification shows three of those
--   indexes are absent, and inspection of the chain proves they survive to the
--   fresh-replay END state (no later migration drops them):
--     idx_study_topics_published     ON study_topics(is_published) WHERE is_published = true
--     idx_leaderboard_user_id        ON leaderboard(user_id)
--     idx_prepare_sessions_user_id   ON prepare_sessions(user_id)
--
--   (idx_questions_exam_id from the same trailer is ALREADY present on LIVE.
--   idx_subject_performance_user_id is intentionally NOT recreated — its table
--   subject_performance is dead schema dropped by
--   20260904000000_publish_ready_dead_schema_and_tabswitch.sql.)
--
--   This migration recreates exactly those three (guarded, idempotent — no-ops
--   on a fresh replay where 20260701000004 already created them). Additive
--   performance parity only: no RLS, no grants, nothing that widens access.
--
-- DEPLOYMENT NOTE (repo-established workflow): LIVE is applied via
-- `supabase db query --linked < this file`; a fresh DB gets it normally via
-- `supabase db push`. After live apply, the version is recorded remotely via
-- `supabase migration repair --status applied`.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. study_topics.is_published partial index (origin 20260701000004)
CREATE INDEX IF NOT EXISTS idx_study_topics_published
  ON public.study_topics(is_published)
  WHERE is_published = true;

-- ─── 2. leaderboard.user_id (origin 20260701000004)
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id
  ON public.leaderboard(user_id);

-- ─── 3. prepare_sessions.user_id (origin 20260701000004)
CREATE INDEX IF NOT EXISTS idx_prepare_sessions_user_id
  ON public.prepare_sessions(user_id);

-- =============================================================================
-- SECTION: STRUCTURAL REGRESSION TESTS (guarded, PASS/FAIL)
-- =============================================================================
SELECT 'TEST IX1: idx_study_topics_published' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_topics_published'
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT 'TEST IX2: idx_leaderboard_user_id' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_leaderboard_user_id'
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT 'TEST IX3: idx_prepare_sessions_user_id' AS test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_prepare_sessions_user_id'
  ) THEN 'PASS' ELSE 'FAIL' END;
SELECT '--- INDEX PARITY COMPLETE (3/3) ---' AS status;
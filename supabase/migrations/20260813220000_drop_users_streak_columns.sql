-- =============================================================================
-- MIGRATION: Drop users.streak / users.longest_streak
-- Date:       2026-08-13
-- Context:    /profile final follow-up — final step of the streak schema debt.
--
-- Preconditions verified LIVE before this migration:
--   * No views / matviews / triggers / indexes / policies reference the
--     columns (pg_views, pg_matviews, pg_trigger, pg_indexes, pg_policies).
--   * No live function body references users.streak / users.longest_streak
--     (pg_proc.prosrc scan). The canonical statistics source is now the
--     attempts-based computation shared by get_user_dashboard_stats and
--     get_admin_user_stats (see 20260813210000_admin_user_stats_rpc.sql).
--   * The frontend no longer selects or types the columns:
--       - findUserById projection (already narrowed)
--       - admin fetchUsersPaginated select (migrated to get_admin_user_stats)
--       - UserProfile / UserRow / UserListRow types (cleaned)
--   * The only textual references in older migration files are superseded
--     plpgsql bodies (the old get_user_dashboard_stats versions); Postgres
--     does not dependency-track plpgsql bodies, so DROP COLUMN is safe, and
--     the current deployed functions do not reference the columns.
--
-- The columns were never maintained as authoritative statistics (amar's row:
-- streak=0, total_exams=1 while actual completed attempts = 13). All streak
-- and attempt statistics now come from the canonical attempt-based RPCs.
-- =============================================================================

ALTER TABLE public.users
  DROP COLUMN IF EXISTS streak,
  DROP COLUMN IF EXISTS longest_streak;

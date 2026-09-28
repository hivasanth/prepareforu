-- Hardening: drop obsolete per-user stat columns from public.users.
--
-- Context: users.total_exams (integer NOT NULL DEFAULT 0) and
-- users.overall_accuracy (numeric NOT NULL DEFAULT 0) were a legacy
-- denormalized dashboard-stat carrier that has not been maintained since
-- migration 20260527000001 (which removed the hot-row maintenance that used
-- to keep them refreshed). All dashboard/performance/leaderboard metrics are
-- now computed server-side, on demand, from the attempts fact table via:
--   - public.get_user_dashboard_stats(p_user_id)      (dashboard)
--   - public.get_user_streak_stats(p_user_id)          (streaks/exams_taken)
--   - public.get_user_accuracy(p_user_id)              (overall accuracy)
--   - public.leaderboard                                 (global rank)
--
-- Evidence collected against the LIVE database immediately before this
-- migration: zero dependencies on either column across pg_depend, views,
-- materialized views, functions, RLS policies, indexes, triggers, column
-- comments, and column-level grants. No application code (src/) references
-- them. This forward migration is therefore safe.
--
-- DROP COLUMN IF EXISTS keeps the migration idempotent; no historical
-- migration files are modified.

alter table public.users
  drop column if exists total_exams,
  drop column if exists overall_accuracy;
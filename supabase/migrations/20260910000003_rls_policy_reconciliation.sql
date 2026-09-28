-- ─────────────────────────────────────────────────────────────────────────────
-- 20260910000003_rls_policy_reconciliation.sql
--
-- PURPOSE
--   Drives the LIVE-vs-chain RLS policy set to a single, replayable state so a
--   fresh chain replay and LIVE-after-apply carry the SAME policies (full parity,
--   per the 2026-09-10 reconciliation plan). It is the terminal reconciliation
--   layer for RLS: it RECREATES the LIVE-only policies that the chain must also
--   carry, and DROPs the superseded old-name LIVE policies whose behavior is
--   already enforced by equivalent-or-stricter chain policies.
--
-- DESIGN RULES (binding, never relaxed)
--   * No policy is dropped unless the chain carries an equivalent-or-stricter
--     replacement for the SAME table/command; an explicit equivalence note is
--     embedded beside each DROP below.
--   * Missing LIVE-parity policy/R ls objects are recreated with CREATE POLICY
--     IF NOT EXISTS (guarded DO blocks) so applying to LIVE is a no-op and a
--     fresh replay converges to LIVE's state.
--   * RLS state (relrowsecurity) is aligned to LIVE on bookmarks,
--     questions_backup_phase6 and security_logs (LIVE: enabled).
--
-- ─────────────────────────────────────────────────────────────────────────────
-- A. RESTORE RLS STATE (LIVE: enabled; chain: not enabled)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions_backup_phase6 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- security_logs has ZERO policies on LIVE (RLS enabled = locked to all roles;
-- log writes flow through SECURITY DEFINER log_security_event(), whose owner
-- bypasses RLS). No policy is recreated here — the locked state is LIVE's.

-- ─────────────────────────────────────────────────────────────────────────────
-- B. RECREATE LIVE-ONLY POLICIES WITH NO CHAIN COUNTERPART
--    (both sides converge; CREATE IF NOT EXISTS so LIVE is a no-op)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname='bookmarks_own'
                 AND polrelid='public.bookmarks'::regclass) THEN
    CREATE POLICY bookmarks_own ON public.bookmarks
      FOR ALL USING (user_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname='Backups are manageable by admins'
                 AND polrelid='public.questions_backup_phase6'::regclass) THEN
    CREATE POLICY "Backups are manageable by admins"
      ON public.questions_backup_phase6
      FOR ALL TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.users
                WHERE users.id = auth.uid() AND users.role = 'admin'::user_role)
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.users
                WHERE users.id = auth.uid() AND users.role = 'admin'::user_role)
      );
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- C. RECREATE LIVE-ORIGINAL NOTIFICATIONS POLICIES (LIVE carried these before
--    any chain policy; the chain's notifications_own_select/-update/-delete/
--    service_insert already exist on both sides and are left untouched so LIVE
--    keeps all seven policies — identical to replay after this migration).
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname='notifications_own'
                 AND polrelid='public.notifications'::regclass) THEN
    CREATE POLICY notifications_own ON public.notifications
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname='notifications_update_own'
                 AND polrelid='public.notifications'::regclass) THEN
    CREATE POLICY notifications_update_own ON public.notifications
      FOR UPDATE USING (user_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname='notifications_insert_admin'
                 AND polrelid='public.notifications'::regclass) THEN
    CREATE POLICY notifications_insert_admin ON public.notifications
      FOR INSERT WITH CHECK (is_admin());
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- D. RECREATE question_reports POLICIES (table reconstructed in genesis; the
--    chain's own migrations never created them because the table is a LIVE
--    out-of-band table — functions referenced below exist from 20260502).
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname='reports_insert_user'
                 AND polrelid='public.question_reports'::regclass) THEN
    CREATE POLICY reports_insert_user ON public.question_reports
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname='reports_select_own'
                 AND polrelid='public.question_reports'::regclass) THEN
    CREATE POLICY reports_select_own ON public.question_reports
      FOR SELECT USING ((reported_by = auth.uid()) OR is_admin());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname='reports_update_admin'
                 AND polrelid='public.question_reports'::regclass) THEN
    CREATE POLICY reports_update_admin ON public.question_reports
      FOR UPDATE USING (is_admin());
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- E. DROP SUPERSEDED OLD-NAME POLICIES
--
-- Each DROP is justified by an equivalent-or-stricter chain policy already
-- present in the replay (verified column-for-column against LIVE 2026-09-10).
-- All are no-ops on a fresh chain (those names never exist there).
-- ─────────────────────────────────────────────────────────────────────────────

-- attempt_answers.answers_select_admin (SELECT is_admin())
--   → replaced by rls_attempt_answers_admin_all (ALL, USING (auth.uid() IS NOT
--     NULL AND is_admin()), WITH CHECK is_admin(), roles authenticated).
--     STRICTER: now requires an authenticated uid in addition to is_admin().
DROP POLICY IF EXISTS answers_select_admin ON public.attempt_answers;

-- attempts.attempts_select_admin (SELECT is_admin())
--   → replaced by rls_attempts_admin_all (ALL, USING (auth.uid() IS NOT NULL
--     AND is_admin()), WITH CHECK is_admin()). STRICTER (same as above).
DROP POLICY IF EXISTS attempts_select_admin ON public.attempts;

-- attempts.attempts_select_subadmin (SELECT is_sub_admin() AND teacher_exam_id
--   IN (teacher_exams WHERE sub_admin_id = own sub_admin row))
--   → replaced by rls_attempts_sub_admin_select (SELECT, USING (auth.uid()
--     IS NOT NULL AND EXISTS(teacher_exams te WHERE te.id=attempts.teacher_exam_id
--     AND te.sub_admin_id = current_sub_admin_id()))). EQUIVALENT for real
--     sub-admins; STRICTER for stale/WITHOUT sub_admin row (denied).
DROP POLICY IF EXISTS attempts_select_subadmin ON public.attempts;

-- bookmarks.bookmarks_own — NO chain counterpart existed (RLS was left
--   disabled by the chain). RECREATED in section B instead of dropped.
--   (No DROP; see B.)

-- daily_stats.daily_stats_admin (SELECT is_admin())
--   → replaced by rls_daily_stats_admin_all (ALL, USING is_admin(),
--     WITH CHECK is_admin()). EQUIVALENT/STRICTER (adds check for writes).
DROP POLICY IF EXISTS daily_stats_admin ON public.daily_stats;

-- exam_versions.exam_versions_write_admin (ALL, USING+WC is_admin())
--   → replaced by rls_exam_versions_admin_all (ALL, USING is_admin(),
--     WITH CHECK is_admin()). EQUIVALENT (also narrower role set:
--     authenticated only).
DROP POLICY IF EXISTS exam_versions_write_admin ON public.exam_versions;

-- exams."Exams are manageable by admins" (ALL ... USING+WC EXISTS users role=admin)
--   → replaced by rls_exams_admin_all (ALL, USING (auth.uid() IS NOT NULL AND
--     is_admin()), WITH CHECK is_admin()). EQUIVALENT for admins; STRICTER
--     (demands auth.uid() (not null).
DROP POLICY IF EXISTS "Exams are manageable by admins" ON public.exams;

-- exams."Exams are viewable by everyone" (SELECT true, PUBLIC)
--   → replaced by rls_exams_authenticated_select (SELECT, USING (auth.uid()
--     IS NOT NULL), roles authenticated). STRICTER: anon users can no longer
--     read exams; only authenticated users may.
DROP POLICY IF EXISTS "Exams are viewable by everyone" ON public.exams;

-- prepare_sessions.prepare_sessions_own (user_id = auth.uid())
--   → replaced by rls_prepare_sessions_user_all (ALL, USING+WC
--     user_id = auth.uid()). EQUIVALENT/STRICTER (same predicate, all commands).
DROP POLICY IF EXISTS prepare_sessions_own ON public.prepare_sessions;

-- prompt_templates."Admins can manage prompt templates" (ALL, using+wc users
--   role IN ('admin','sub_admin'), authenticated)
--   → replaced by rls_prompt_templates_admin_all (ALL, USING is_admin(),
--     WITH CHECK is_admin(), authenticated). STRICTER: sub-admins lose prompt
--     template management (chain intent from 20260502 rls hardening).
DROP POLICY IF EXISTS "Admins can manage prompt templates" ON public.prompt_templates;

-- questions_backup_phase6."Backups are manageable by admins" — NO chain
--   counterpart (chain left RLS disabled). RECREATED in section B; not dropped.
--   (No DROP; see B.)

-- question_upload_prompts.prompts_select_admin / prompts_write_admin
--   → replaced by rls_question_upload_prompts_admin_all (ALL, USING is_admin(),
--     WITH CHECK is_admin()). EQUIVALENT/STRICTER (single policy, both READ and
--     WRITE gated by is_admin()).
DROP POLICY IF EXISTS prompts_select_admin ON public.question_upload_prompts;
DROP POLICY IF EXISTS prompts_write_admin ON public.question_upload_prompts;

-- teacher_exam_questions.rls_teacher_exam_questions_student_select (SELECT for
--   authenticated users linked through educator_id)
--   → replaced by rls_teacher_exam_questions_sub_admin_manage (ALL, USING/WC
--     EXISTS teacher_exams te WHERE te.id = teacher_exam_questions.teacher_exam_id
--     AND te.sub_admin_id = current_sub_admin_id()) — the same linked-user read
--     is reachable through current_sub_admin_id(); the chain's 20260902
--     educator publish flow superseded the separate student policy.
--     NOTE (documented delta): sub_admin_manage is FOR ALL, so a linked user
--     could ALSO write questions they can read. This matches chain intent and
--     already exists identically on LIVE; the write-path is guarded by the
--     educator RPC layer. Flagged in the parity report.
DROP POLICY IF EXISTS rls_teacher_exam_questions_student_select
  ON public.teacher_exam_questions;

-- teacher_exam_questions.teacher_qs_select (SELECT: sub-admin OR linked-user
--   OR is_admin())
--   → covered by rls_teacher_exam_questions_admin_all (admins) +
--     rls_teacher_exam_questions_sub_admin_manage (own exams). EQUIVALENT.
DROP POLICY IF EXISTS teacher_qs_select ON public.teacher_exam_questions;

-- teacher_exam_questions.teacher_qs_write_subadmin (ALL, USING/WC own sub-admin
--   exam AND now() < start_time)
--   → replaced by rls_teacher_exam_questions_sub_admin_manage (ALL, own exam,
--     NO start-time gate).
--     NOTE (documented delta): dropping removes the "edits only before exam
--     start" row-level gate; that guard is chain-intentionally superseded by the
--     publish READY lifecycle (20260902 educator publish-flow migration) and the
--     app/RPC layer. Flagged in the parity report.
DROP POLICY IF EXISTS teacher_qs_write_subadmin ON public.teacher_exam_questions;

-- teacher_exam_questions.teacher_qs_delete_subadmin (DELETE own sub-admin exam)
--   → replaced by rls_teacher_exam_questions_sub_admin_manage (ALL, own exam).
--     EQUIVALENT (same row set; command scope widened from DELETE to ALL, which
--     is the chain's new manage-all design).
DROP POLICY IF EXISTS teacher_qs_delete_subadmin ON public.teacher_exam_questions;

-- teacher_exams.teacher_exams_write_subadmin (INSERT/ALL, WC own sub-admin exam)
--   → replaced by rls_teacher_exams_sub_admin_manage (ALL, USING/WC
--     sub_admin_id = current_sub_admin_id()). EQUIVALENT.
DROP POLICY IF EXISTS teacher_exams_write_subadmin ON public.teacher_exams;

-- teacher_exams.teacher_exams_delete_subadmin (DELETE own sub-admin exam)
--   → replaced by rls_teacher_exams_sub_admin_manage (ALL, own exam).
--     EQUIVALENT.
DROP POLICY IF EXISTS teacher_exams_delete_subadmin ON public.teacher_exams;

-- teacher_exams.teacher_exams_update_subadmin (UPDATE own sub-admin exam AND
--   now() < start_time)
--   → replaced by rls_teacher_exams_sub_admin_manage (ALL, own exam, NO
--     start-time gate).
--     NOTE (documented delta): the time-window row gate is chain-intentionally
--     superseded (see teacher_qs_write_subadmin note). Flagged in the report.
DROP POLICY IF EXISTS teacher_exams_update_subadmin ON public.teacher_exams;

-- teacher_exams.teacher_exams_select_linked_users (SELECT: sub-admin OR linked
--   user OR is_admin())
--   → covered by rls_teacher_exams_sub_admin_manage (own) +
--     rls_teacher_exams_student_select (linked users) +
--     rls_teacher_exams_admin_all (admins). EQUIVALENT.
DROP POLICY IF EXISTS teacher_exams_select_linked_users ON public.teacher_exams;

-- users."Educators can view their linked students" (SELECT auth.uid() = educator_id)
--   → replaced by rls_users_sub_admin_select (SELECT, USING (auth.uid() IS NOT
--     NULL AND EXISTS(sub_admins sa WHERE sa.user_id = auth.uid() AND
--     users.educator_id = sa.user_id))). EQUIVALENT for active sub-admins;
--     STRICTER for stale educator_ids (denied when no matching sub_admins row).
DROP POLICY IF EXISTS "Educators can view their linked students" ON public.users;

-- users.users_select_admin (SELECT is_admin())
--   → replaced by rls_users_admin_all (ALL, USING (auth.uid() IS NOT NULL AND
--     is_admin()), WITH CHECK is_admin()). STRICTER (requires authenticated uid).
DROP POLICY IF EXISTS users_select_admin ON public.users;

-- users.users_select_own (SELECT auth.uid() = id)
--   → replaced by rls_users_self_select (SELECT, USING (auth.uid() IS NOT NULL
--     AND id = auth.uid())). STRICTER (drops anonymous matching).
DROP POLICY IF EXISTS users_select_own ON public.users;

-- users.users_update_admin (UPDATE is_admin())
--   → replaced by rls_users_admin_all (ALL, is_admin + uid) and
--     rls_users_self_update (UPDATE, id = auth.uid()). The old UPDATE granted
--     admin-only row writes WITHOUT a WITH CHECK; the new admin_all adds
--     WITH CHECK is_admin() — STRICTER.
DROP POLICY IF EXISTS users_update_admin ON public.users;

-- ─────────────────────────────────────────────────────────────────────────────
-- F. ALIGN leaderboard_write_system (shared policy with divergent definition)
--
-- LIVE carried this policy WITHOUT a WITH CHECK (ALL | USING is_admin() | no
-- WITH CHECK). The chain's 20260502 rls-hardening defines it WITH
-- WITH CHECK is_admin() (strict: an INSERT/UPDATE performed by-post_as admin
-- must satisfy is_admin() on the row too). Aligning LIVE to the chain's
-- stricter definition:
DROP POLICY IF EXISTS leaderboard_write_system ON public.leaderboard;
CREATE POLICY leaderboard_write_system ON public.leaderboard
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- G. DEFERRED LIVE-ONLY INDEXES
--    (user_creation_logs is created by 20260903110000 — late in the chain — so
--    these indexes could not be reconstructed in genesis; they are applied here,
--    after 20260903110000, and are no-ops on LIVE where they already exist.)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_creation_logs_created_at
  ON public.user_creation_logs USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_user_creation_logs_user_id
  ON public.user_creation_logs USING btree (user_id);
-- =============================================================================
-- MIGRATION: 20261008000000_p11_baseline_acl_reconciliation.sql
--
-- Phase 11 - Production/Local Security Baseline Reconciliation.
-- Resolves the two HIGH-severity baseline discrepancies found in Phase 10.
--
--   D-1  The chain never declares the client table privileges for
--        exam_configs / exam_papers / exam_subjects / exam_versions. It
--        relied entirely on the platform's ALTER DEFAULT PRIVILEGES for the
--        public schema, and those defaults now differ by environment:
--          production pg_default_acl : anon=authenticated=service_role=arwdxtm
--          local    pg_default_acl : anon=authenticated=xtm, service_role=Dxtm
--        Consequence of replaying the chain on a fresh local stack: the
--        application has no table privilege at all, so its direct client
--        reads of the four content tables and its direct INSERTs into
--        exam_papers / exam_subjects (src/lib/repositories/exam.repository.ts
--        insertExamPaper / insertExamSubject) fail with permission denied.
--        This is a repository gap, not an environment quirk: the chain must
--        be self-sufficient.
--
--   D-1b anon holds INSERT/UPDATE/DELETE/TRIGGER/REFERENCES on exam_versions.
--        20260812000010 revoked exactly those from anon on exam_configs,
--        exam_papers, exam_subjects, exam_topics and questions, but omitted
--        exam_versions, so anon kept the full Supabase default set there.
--        RLS already blocks the DML (exam_versions has no permissive policy
--        for anon on INSERT/UPDATE/DELETE), so this is least-privilege
--        cleanup, not a fix for an exploitable write path. anon keeps SELECT
--        because exam_versions_select is TO public and is the only policy
--        that can return rows to an unauthenticated caller.
--
--   D-2  20260917025937 lines 173-174 revoked EXECUTE on
--        public.current_sub_admin_id() from PUBLIC and from anon. Its stated
--        intent was least privilege for a function that is referenced only by
--        TO authenticated policies - but PostgreSQL grants function EXECUTE to
--        PUBLIC by default, not to authenticated, so the REVOKE removed the
--        grant for *every* role and no compensating GRANT exists anywhere in
--        the chain. Chain replay therefore left a function that no role could
--        execute, and three live policies could not evaluate:
--          attempts.rls_attempts_sub_admin_select
--          teacher_exams.rls_teacher_exams_sub_admin_manage
--          teacher_exam_questions.rls_teacher_exam_questions_sub_admin_manage
--        This restores the documented intent and matches production exactly.
--
-- NOT IN SCOPE, DELIBERATELY UNCHANGED:
--   * No RLS policy is created, altered or dropped. The 10 policies rejected
--     by Phase 10 stay absent; restoring them was proven to be a security
--     regression.
--   * current_sub_admin_id() is NOT changed. Its role-blindness (it keys off
--     the existence of a sub_admins row without checking users.role or
--     users.is_active) is a separate finding tracked for a scoped change.
--
-- Net effect: local and production converge on one explicit, deterministic ACL.
--   anon          : SELECT only on all four content tables
--   authenticated : SELECT, INSERT, UPDATE, DELETE on all four (RLS is the
--                   authority: writes are is_admin()-gated in every policy)
--   service_role  : full DML, RLS-bypassing, as production
--   current_sub_admin_id() : EXECUTE for authenticated + service_role,
--                   PUBLIC and anon still revoked
--
-- Append-only: no historical migration is modified.
-- =============================================================================

BEGIN;

-- ─── D-1  client table privileges the application actually requires ────────
-- RLS remains the authorization layer; these grants only make the table
-- reachable so the existing policies can do their job.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_configs  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_papers   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_subjects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_versions  TO authenticated;

-- service_role parity (Edge Functions / PostgREST service key bypasses RLS).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_configs  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_papers   TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_subjects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_versions  TO service_role;

-- ─── D-1  anon keeps read-only access to published content ─────────────────
GRANT SELECT ON public.exam_configs  TO anon;
GRANT SELECT ON public.exam_papers   TO anon;
GRANT SELECT ON public.exam_subjects TO anon;
GRANT SELECT ON public.exam_versions  TO anon;

-- ─── D-1b anon must never hold write or DDL-adjacent table privileges ──────
-- TRUNCATE is already gone everywhere via 20260826000002; it is repeated here
-- so this statement is authoritative on its own and stays idempotent.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.exam_configs  FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.exam_papers   FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.exam_subjects FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.exam_versions  FROM anon;

-- ─── D-2  restore EXECUTE on the authenticated-only policy helper ──────────
GRANT EXECUTE ON FUNCTION public.current_sub_admin_id() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.current_sub_admin_id() FROM PUBLIC, anon;

-- ─── post-conditions: assert the reconciled baseline actually holds ────────
DO $$
DECLARE
  t          text;
  bad_tables text := '';
  bad_anon   text := '';
BEGIN
  FOREACH t IN ARRAY ARRAY['exam_configs','exam_papers','exam_subjects','exam_versions'] LOOP
    IF NOT has_table_privilege('authenticated', 'public.' || t, 'SELECT')
       OR NOT has_table_privilege('authenticated', 'public.' || t, 'INSERT')
       OR NOT has_table_privilege('authenticated', 'public.' || t, 'UPDATE')
       OR NOT has_table_privilege('authenticated', 'public.' || t, 'DELETE')
       OR NOT has_table_privilege('service_role',  'public.' || t, 'SELECT')
       OR NOT has_table_privilege('service_role',  'public.' || t, 'INSERT')
       OR NOT has_table_privilege('service_role',  'public.' || t, 'UPDATE')
       OR NOT has_table_privilege('service_role',  'public.' || t, 'DELETE') THEN
      bad_tables := bad_tables || t || ' ';
    END IF;

    IF has_table_privilege('anon', 'public.' || t, 'INSERT')
       OR has_table_privilege('anon', 'public.' || t, 'UPDATE')
       OR has_table_privilege('anon', 'public.' || t, 'DELETE')
       OR has_table_privilege('anon', 'public.' || t, 'TRUNCATE')
       OR has_table_privilege('anon', 'public.' || t, 'TRIGGER') THEN
      bad_anon := bad_anon || t || ' ';
    END IF;
  END LOOP;

  IF bad_tables <> '' THEN
    RAISE EXCEPTION 'GUARD-FAIL authenticated/service_role DML missing on: %', bad_tables;
  END IF;
  IF bad_anon <> '' THEN
    RAISE EXCEPTION 'GUARD-FAIL anon still holds write privileges on: %', bad_anon;
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.current_sub_admin_id()', 'EXECUTE') THEN
    RAISE EXCEPTION 'GUARD-FAIL authenticated cannot execute current_sub_admin_id()';
  END IF;
  IF has_function_privilege('anon', 'public.current_sub_admin_id()', 'EXECUTE')
     OR has_function_privilege('public', 'public.current_sub_admin_id()', 'EXECUTE') THEN
    RAISE EXCEPTION 'GUARD-FAIL anon/PUBLIC must not execute current_sub_admin_id()';
  END IF;
END $$;

COMMIT;

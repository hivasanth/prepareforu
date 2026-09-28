-- ============================================================================
-- 20260902000001_attempt_mutation_rls_lockdown.sql
--
-- DEPLOY AFTER the frontend has been migrated to the RPC write path
-- (create_attempt + set_attempt_snapshot + existing mutation RPCs) AND after
-- 20260902000000_server_authoritative_scoring_and_question_selection.sql.
--
-- Closes R-1 (grading-column fabrication) and R-4c (client-written attempts
-- grading/snapshot columns) by revoking direct user INSERT/UPDATE on both
-- attempts and attempt_answers. All legitimate mutations flow through
-- SECURITY DEFINER RPCs (verified live — the app never direct-writes either
-- table outside upsertAttempt, which this change-set replaces).
--
-- READ access is unchanged. Admin / sub-admin analytic SELECT policies are
-- preserved. Idempotent; safe to re-run.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- R-1: attempt_answers — user INSERT becomes a hard no-op; SELECT preserved.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS answers_insert_own ON public.attempt_answers;
DROP POLICY IF EXISTS answers_insert_rpc_only ON public.attempt_answers;
DROP POLICY IF EXISTS answers_select_own ON public.attempt_answers;

ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY answers_insert_rpc_only ON public.attempt_answers
    FOR INSERT
    TO authenticated
    WITH CHECK (false);

CREATE POLICY answers_select_own ON public.attempt_answers
    FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.attempts
                   WHERE attempts.id = attempt_answers.attempt_id
                     AND attempts.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- R-4c: attempts — drop user-writable INSERT/UPDATE policies. Creation now
--   flows through create_attempt(); writes through the SECURITY DEFINER RPCs
--   (submit_attempt, set_attempt_snapshot, update_tab_switch_count,
--   mark_review_accessed, update_attempt_answers_cache). Admin/sub-admin
--   READ policies remain untouched.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS attempts_insert_own ON public.attempts;
DROP POLICY IF EXISTS rls_attempts_user_insert ON public.attempts;
DROP POLICY IF EXISTS attempts_update_own ON public.attempts;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy
        WHERE polrelid = 'public.attempts'::regclass
          AND polname = 'attempts_select_own'
    ) THEN
        CREATE POLICY attempts_select_own ON public.attempts
            FOR SELECT TO authenticated
            USING (user_id = auth.uid());
    END IF;
END$$;

COMMIT;

-- =============================================================================
-- MIGRATION: Cross-Exam RPC privilege hardening (residual from F-01/F-02)
-- Date: 2026-09-03
--
-- Live audit after 20260903020000/03030000/03040000/03050000 found residual
-- EXECUTE grants to `anon` on three cross-exam SECURITY DEFINER RPCs:
--
--   1. create_attempt(p_exam_id, p_paper_id, p_teacher_exam_id, p_source)
--      Attempt creation is an authenticated operation. Today the function
--      denies anon indirectly (user_id NOT NULL + is_exam_allowed_for_user +
--      SOURCE_REQUIRED), but least-privilege per F-01's own note ("their gating
--      is re-audited in F-02") requires anon EXECUTE to be revoked. All other
--      cross-exam mutation RPCs (submit_attempt, set_question_answer) are
--      authenticated-only.
--
--   2. set_attempt_snapshot(p_attempt_id, p_questions)
--      Client-callable SECURITY DEFINER with a hard auth.uid() ownership guard.
--      Must remain callable by `authenticated` (the frontend invokes it), so we
--      only revoke `anon`.
--
--   3. _pf_marks_for_question(p_question_id)
--      Internal scoring helper (only called inside set_question_answer and
--      submit_attempt, both SECURITY DEFINER owned by postgres). It is
--      STABLE SECURITY DEFINER with NO auth.uid()/entitlement gate and returns
--      per-question marking metadata (marks_per_question, negative_marking,
--      teacher flag) for ANY question id. As a REST-callable RPC it leaks
--      scoring metadata for arbitrary questions. Because it is internal-only
--      and executed as the owner (postgres), EXECUTE is revoked from anon,
--      PUBLIC and authenticated without breaking any caller.
--
-- No data is modified. No RLS policy is weakened.
-- =============================================================================

REVOKE ALL ON FUNCTION public.create_attempt(text, uuid, uuid, public.attempt_source) FROM anon;

REVOKE ALL ON FUNCTION public.set_attempt_snapshot(uuid, jsonb) FROM anon;

REVOKE ALL ON FUNCTION public._pf_marks_for_question(uuid) FROM anon;
REVOKE ALL ON FUNCTION public._pf_marks_for_question(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._pf_marks_for_question(uuid) FROM authenticated;

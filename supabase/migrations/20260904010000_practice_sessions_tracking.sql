-- ============================================================================
-- 20260904010000_practice_sessions_tracking.sql
--
-- L-01 fix: add a lightweight server-side audit trail for Prepare & Write
-- practice sessions. Practice is otherwise fully client-side (no attempt row,
-- no attempt_answers), so completed practice activity was previously
-- un-auditable. This adds an insert-only practice_sessions log plus a single
-- ownership-guarded SECURITY DEFINER RPC through which the client records a
-- completion.
--
-- Design notes:
--   * Not a full `attempts` row: practice reveals answers by design and has no
--     authoritative server scoring, so this is an audit log, not scoring.
--   * The RPC is the ONLY write path for `authenticated` (ownership enforced
--     via auth.uid()); direct table writes are blocked by RLS.
--   * Counts are sanity-validated server-side (0 <= correct <= answered <=
--     question_count) so a client cannot log a nonsensical record.
--   * `question_count`/`correct_count` are informational audit fields, not
--     authoritative scores, so they are acceptable from the entitlement-gated
--     practice data that already reveals answers.
--
-- IDEMPOTENT / SAFE: guarded creates. Re-runnable.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Table: practice_sessions (insert-only audit log)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_id          text,
    paper_id         uuid REFERENCES public.exam_papers(id) ON DELETE SET NULL,
    question_count   integer NOT NULL DEFAULT 0 CHECK (question_count >= 0),
    answered_count   integer NOT NULL DEFAULT 0 CHECK (answered_count >= 0 AND answered_count <= question_count),
    correct_count    integer NOT NULL DEFAULT 0 CHECK (correct_count >= 0 AND correct_count <= answered_count),
    started_at       timestamptz NOT NULL DEFAULT now(),
    completed_at     timestamptz NOT NULL DEFAULT now(),
    duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own practice history.
CREATE POLICY "practice_sessions_select_own"
    ON public.practice_sessions
    FOR SELECT
    USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies: writes are owned by the SECURITY DEFINER
-- RPC, and there is no UI yet for deleting history. This keeps the audit log
-- append-only from the client's perspective.

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_completed
    ON public.practice_sessions (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_paper
    ON public.practice_sessions (paper_id);

-- ---------------------------------------------------------------------------
-- RPC: record_practice_session — ownership-guarded, insert-only.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_practice_session(
    p_exam_id text,
    p_paper_id uuid,
    p_question_count integer,
    p_answered_count integer,
    p_correct_count integer,
    p_duration_seconds integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    IF p_question_count < 0 OR p_answered_count < 0 OR p_correct_count < 0 THEN
        RAISE EXCEPTION 'INVALID_COUNTS';
    END IF;
    IF p_correct_count > p_answered_count OR p_answered_count > p_question_count THEN
        RAISE EXCEPTION 'INVALID_COUNTS';
    END IF;
    IF p_duration_seconds IS NOT NULL AND p_duration_seconds < 0 THEN
        RAISE EXCEPTION 'INVALID_DURATION';
    END IF;

    INSERT INTO public.practice_sessions (
        user_id, exam_id, paper_id, question_count,
        answered_count, correct_count, started_at, completed_at, duration_seconds
    ) VALUES (
        auth.uid(),
        p_exam_id,
        p_paper_id,
        p_question_count,
        p_answered_count,
        p_correct_count,
        now() - make_interval(secs => COALESCE(p_duration_seconds, 0)),
        now(),
        p_duration_seconds
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_practice_session(text, uuid, integer, integer, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_practice_session(text, uuid, integer, integer, integer, integer) TO authenticated;

COMMIT;

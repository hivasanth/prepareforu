-- =============================================================================
-- Migration: Teacher Exam Time-Window Validation RPC
-- Purpose:   Provides server-side (now()-based) enforcement that a student
--            cannot create a *new* teacher-exam attempt outside the
--            [start_time, end_time] window.
--
-- Security model:
--   * SECURITY DEFINER + SET search_path = public (defends against search_path
--     injection).
--   * Ownership is verified through the SAME subquery pattern used by the
--     existing teacher_exams RLS policies (sub_admins ↔ users join), so only
--     exams assigned to the authenticated user's educator are visible.
--   * The time comparison uses PostgreSQL now() (server clock), NOT client
--     time.  Client-side Date objects cannot be trusted for authorization.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_teacher_exam_active(p_exam_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start  timestamptz;
    v_end    timestamptz;
    v_exists boolean;
BEGIN
    -- Fetch the exam's time window ONLY if the caller (auth.uid()) is
    -- authorized to see it via the existing RLS join pattern.
    SELECT te.start_time, te.end_time, TRUE
    INTO   v_start, v_end, v_exists
    FROM   public.teacher_exams te
    WHERE  te.id = p_exam_id
      AND  EXISTS (
        SELECT 1
        FROM   public.sub_admins sa
        JOIN   public.users u ON u.educator_id = sa.user_id
        WHERE  u.id = auth.uid()
        AND    te.sub_admin_id = sa.id
      );

    IF v_exists IS NOT TRUE THEN
        RAISE EXCEPTION 'Teacher exam not found or access denied';
    END IF;

    RETURN now() >= v_start AND now() <= v_end;
EXCEPTION
    WHEN raise_exception THEN
        RAISE;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'is_teacher_exam_active: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.is_teacher_exam_active IS
    'Returns true if the authenticated user can currently start a new attempt '
    'for the given teacher exam (now() within [start_time, end_time]). '
    'Does NOT consider existing in_progress attempts — callers must check '
    'that separately.  SECURITY DEFINER so it can read teacher_exams rows '
    'that RLS might otherwise filter for non-owner roles.';

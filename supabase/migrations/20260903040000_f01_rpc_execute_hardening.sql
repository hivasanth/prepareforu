-- =============================================================================
-- MIGRATION: F-01 (P0) hardening — drop stale RPC overloads, EXECUTE lockdown
-- Date: 2026-09-03
--
-- Live verification after 20260903030000 found two residuals:
--   1. The pre-F-01 overloads set_question_answer(uuid,uuid,text,numeric,numeric)
--      and add_question_time(uuid,uuid,text,numeric) still existed with EXECUTE
--      grants, so a client could STILL call the client-supplied-answer API
--      surface. Supabase default privileges had also auto-granted EXECUTE to
--      anon + authenticated + service_role on every new function.
--   2. The SECURITY DEFINER readers/writers from 20260903020000 were EXECUTE-
--      visible to PUBLIC and anon (bodies gate on auth.uid(), but least
--      privilege per F-07 requires authenticated-only callers).
--
-- CHANGES
--   - DROP the two stale overloads.
--   - REVOKE EXECUTE from PUBLIC and anon on the 4 mutation RPCs + 5 DEFINER
--     readers; keep authenticated (positional signatures in a DO loop).
--   - submission/creation RPCs (submit_attempt, create_attempt) and the
--     question-selection RPCs keep their existing surface; their gating is
--     re-audited in F-02.
-- =============================================================================

DROP FUNCTION IF EXISTS public.set_question_answer(uuid, uuid, text, text, numeric, numeric);
DROP FUNCTION IF EXISTS public.add_question_time(uuid, uuid, text, numeric);

-- VACUUM of stale overloads is proven (see F-01 verify): only the 3-arg
-- set_question_answer and 3-arg add_question_time remain.

DO $$
DECLARE
    v_sig text;
BEGIN
    FOREACH v_sig IN ARRAY ARRAY[
        'set_question_answer(uuid,uuid,text)',
        'touch_question_visit(uuid,uuid)',
        'set_question_review(uuid,uuid,boolean)',
        'add_question_time(uuid,uuid,integer)',
        'get_attempt_review_answers(uuid)',
        'get_subadmin_attempt_answers(uuid[])',
        'get_content_review_questions(uuid)',
        'get_practice_questions(uuid,text,text[],uuid[],boolean,integer)',
        'admin_list_questions(text[],text,text,text,text,text,boolean,integer,integer)'
    ] LOOP
        EXECUTE 'REVOKE ALL ON FUNCTION public.' || v_sig || ' FROM PUBLIC';
        EXECUTE 'REVOKE ALL ON FUNCTION public.' || v_sig || ' FROM anon';
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.' || v_sig || ' TO authenticated';
    END LOOP;
END;
$$;
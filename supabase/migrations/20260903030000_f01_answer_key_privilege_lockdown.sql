-- =============================================================================
-- MIGRATION: F-01 (P0) enforcement — answer-key privilege lockdown
-- Date: 2026-09-03
--
-- WHY THIS EXISTS
--   The column-level REVOKEs in 20260903020000 were verified INEFFECTIVE live:
--   both `anon` and `authenticated` hold TABLE-level SELECT on attempt_answers
--   (and `authenticated` on questions), and Postgres grant resolution gives
--   table-level privileges precedence over column grants, so has_column_privilege
--   still returns TRUE for is_correct/marks_awarded/correct_option/explanation_*.
--
--   This migration replaces the REVOKE-only control with a true privilege
--   lockdown: table-level SELECT is revoked and replaced by explicit
--   column-level SELECT grants for ONLY the columns the application reads via
--   REST. PostgREST hides every column the role lacks SELECT on.
--
--   Security property (unchanged): during an ACTIVE attempt the examinee MUST
--   NOT be able to retrieve correct_option / the answer key / hidden
--   correctness / scoring metadata via any REST path. Post-completion review
--   and staff analytics flow through the SECURITY DEFINER RPCs from
--   20260903020000 (get_attempt_review_answers, get_content_review_questions,
--   get_subadmin_attempt_answers, get_practice_questions, admin_list_questions).
--
-- LOCKDOWN
--   attempt_answers: anon + authenticated stripped of ALL table rights; only
--     the exam-state columns (id, attempt_id, question_id, selected_option,
--     time_spent_secs, visited, marked_for_review, last_visited_at,
--     created_at) are SELECT-granted to authenticated. is_correct and
--     marks_awarded are REST-invisible. Row visibility is UNCHANGED (RLS:
--     answers_select_own / answers_select_subadmin / answers_select_admin).
--     The four mutation RPCs run SECURITY DEFINER -> unaffected by revokes.
--   questions: authenticated stripped of table-level SELECT; re-granted
--     column-level SELECT on every NON-answer column. INSERT/UPDATE/DELETE/
--     REFERENCES stay table-level because administration writes question rows
--     (incl. correct_option payloads) over REST and RLS already gates every
--     write to is_admin()/is_sub_admin().
--
-- NO RLS POLICY IS WEAKENED. All answer-bearing reads keep flowing through
-- the 5 DEFINER readers from 20260903020000.
-- =============================================================================

-- ─── 1. attempt_answers: strip all table grants for client roles ──────────────

REVOKE ALL PRIVILEGES ON TABLE public.attempt_answers FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.attempt_answers FROM authenticated;

GRANT SELECT (
    id,
    attempt_id,
    question_id,
    selected_option,
    time_spent_secs,
    visited,
    marked_for_review,
    last_visited_at,
    created_at
) ON public.attempt_answers TO authenticated;

-- ─── 2. questions: drop table-level SELECT; safe-column SELECT + staff DML ────

REVOKE SELECT ON TABLE public.questions FROM authenticated;

GRANT SELECT (
    id,
    exam_id,
    paper_id,
    subject_name,
    difficulty,
    negative_marks,
    tags,
    usage_count,
    is_active,
    import_session_id,
    created_by,
    created_at,
    updated_at,
    visual,
    content_hash,
    question_text_en,
    question_text_te,
    option_a_en,
    option_b_en,
    option_c_en,
    option_d_en,
    option_a_te,
    option_b_te,
    option_c_te,
    option_d_te,
    topic_en,
    topic_te
) ON public.questions TO authenticated;

GRANT INSERT, UPDATE, DELETE, REFERENCES ON public.questions TO authenticated;
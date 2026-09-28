-- =============================================================================
-- MIGRATION: F-02 (P0) — question-selection identity + entitlement lockdown
-- Date: 2026-09-03
--
-- PROBLEM (verified live)
--   get_subject_test_questions / get_topic_test_questions accepted a
--   client-supplied p_user_id and used it to enumerate that user's ATTEMPTED
--   questions. Because both are SECURITY DEFINER (RLS bypassed) AND had NO
--   entitlement check, an authenticated caller could:
--     1. pass ANOTHER user's id and learn which questions that user has
--        attempted (attempted-set disclosure), and
--     2. request question pools for exams the caller is not entitled to.
--
-- FIX
--   - p_user_id is REMOVED from both signatures. Identity is server-authoritative:
--     the RPC resolves the caller through auth.uid() only.
--   - Both RPCs now gate on is_exam_allowed_for_user(p_exam_id) BEFORE doing any
--     work; a caller without entitlement gets EXAM_NOT_ALLOWED_FOR_USER.
--   - auth.uid() IS NULL (anon/no-session) -> UNAUTHORIZED_ACCESS.
--   - EXECUTE restricted to authenticated (+ owner/service_role); anon/PUBLIC
--     revoked. The frontend no longer passes a user id (updated in lockstep).
--
-- Behavior of the SELECTION algorithm (passes 1/2, authoritative counts,
-- attempted-exclusion) is unchanged except that "attempted" now means
-- questions attempted by auth.uid().
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_subject_test_questions(text, uuid, text, uuid);
DROP FUNCTION IF EXISTS public.get_topic_test_questions(text, uuid, text, text, uuid, integer);

CREATE OR REPLACE FUNCTION public.get_subject_test_questions(
    p_exam_id text,
    p_paper_id uuid,
    p_subject_name text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_count int;
    v_attempted uuid[];
    v_selected jsonb;
    v_filled int;
    v_remaining int;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
    END IF;
    IF NOT public.is_exam_allowed_for_user(p_exam_id) THEN
        RAISE EXCEPTION 'EXAM_NOT_ALLOWED_FOR_USER';
    END IF;

    SELECT question_count INTO v_count
      FROM public.exam_subjects
     WHERE exam_id = p_exam_id AND paper_id = p_paper_id AND subject_name = p_subject_name;
    IF v_count IS NULL THEN
        RAISE EXCEPTION 'SUBJECT_CONFIG_NOT_FOUND';
    END IF;

    SELECT ARRAY(
        SELECT DISTINCT aa.question_id
          FROM public.attempt_answers aa
          JOIN public.attempts a ON a.id = aa.attempt_id
         WHERE a.user_id = auth.uid()
    ) INTO v_attempted;

    SELECT COALESCE(jsonb_agg(row_to_json(q)), '[]'::jsonb)
      INTO v_selected
      FROM (
        SELECT q.id, q.exam_id, q.paper_id, q.subject_name, q.difficulty,
               q.negative_marks, q.visual,
               q.question_text_en, q.question_text_te,
               q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en,
               q.option_a_te, q.option_b_te, q.option_c_te, q.option_d_te
          FROM public.questions q
         WHERE q.exam_id = p_exam_id AND q.paper_id = p_paper_id
           AND q.subject_name = p_subject_name AND q.is_active = true
           AND (v_attempted IS NULL OR NOT (q.id = ANY (v_attempted)))
         ORDER BY random()
         LIMIT v_count
      ) q;

    v_filled := COALESCE(jsonb_array_length(v_selected), 0);

    IF v_filled < v_count AND cardinality(v_attempted) > 0 THEN
        v_remaining := v_count - v_filled;
        SELECT COALESCE(jsonb_agg(cj.q), '[]'::jsonb) INTO v_selected
          FROM (
            SELECT row_to_json(q) AS q, q.id
              FROM public.questions q
             WHERE q.exam_id = p_exam_id AND q.paper_id = p_paper_id
               AND q.subject_name = p_subject_name AND q.is_active = true
               AND q.id = ANY (v_attempted)
               AND NOT EXISTS (
                    SELECT 1
                      FROM jsonb_array_elements(v_selected) e
                     WHERE (e->>'id')::uuid = q.id
               )
             ORDER BY random()
             LIMIT v_remaining
          ) cj;
    END IF;

    RETURN COALESCE(v_selected, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_topic_test_questions(
    p_exam_id text,
    p_paper_id uuid,
    p_subject_name text,
    p_topic_name text,
    p_test_size integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_topic record;
    v_count int;
    v_attempted uuid[];
    v_selected jsonb;
    v_filled int;
    v_remaining int;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
    END IF;
    IF NOT public.is_exam_allowed_for_user(p_exam_id) THEN
        RAISE EXCEPTION 'EXAM_NOT_ALLOWED_FOR_USER';
    END IF;

    SELECT * INTO v_topic FROM public.exam_topics
     WHERE exam_id = p_exam_id
       AND paper_id = p_paper_id
       AND subject_name = p_subject_name
       AND topic_en = p_topic_name
     LIMIT 1;
    IF v_topic.id IS NULL THEN
        RAISE EXCEPTION 'TOPIC_CONFIG_NOT_FOUND';
    END IF;

    v_count := CASE p_test_size
        WHEN 20 THEN v_topic.test_20_required
        WHEN 30 THEN v_topic.test_30_required
        WHEN 50 THEN v_topic.test_50_required
        ELSE v_topic.required_questions END;
    IF v_count IS NULL OR v_count <= 0 THEN
        v_count := v_topic.required_questions;
    END IF;
    IF v_count IS NULL OR v_count <= 0 THEN
        RAISE EXCEPTION 'TOPIC_CONFIG_INVALID';
    END IF;

    SELECT ARRAY(
        SELECT DISTINCT aa.question_id
          FROM public.attempt_answers aa
          JOIN public.attempts a ON a.id = aa.attempt_id
         WHERE a.user_id = auth.uid()
    ) INTO v_attempted;

    SELECT COALESCE(jsonb_agg(row_to_json(q)), '[]'::jsonb)
      INTO v_selected
      FROM (
        SELECT q.id, q.exam_id, q.paper_id, q.subject_name, q.difficulty,
               q.negative_marks, q.visual,
               q.question_text_en, q.question_text_te,
               q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en,
               q.option_a_te, q.option_b_te, q.option_c_te, q.option_d_te
          FROM public.questions q
         WHERE q.exam_id = p_exam_id AND q.paper_id = p_paper_id
           AND q.subject_name = p_subject_name AND q.topic_en = p_topic_name
           AND q.is_active = true
           AND (v_attempted IS NULL OR NOT (q.id = ANY (v_attempted)))
         ORDER BY random()
         LIMIT v_count
      ) q;

    v_filled := COALESCE(jsonb_array_length(v_selected), 0);

    IF v_filled < v_count AND cardinality(v_attempted) > 0 THEN
        v_remaining := v_count - v_filled;
        SELECT COALESCE(jsonb_agg(cj.q), '[]'::jsonb) INTO v_selected
          FROM (
            SELECT row_to_json(q) AS q, q.id
              FROM public.questions q
             WHERE q.exam_id = p_exam_id AND q.paper_id = p_paper_id
               AND q.subject_name = p_subject_name AND q.topic_en = p_topic_name
               AND q.is_active = true
               AND q.id = ANY (v_attempted)
               AND NOT EXISTS (
                    SELECT 1
                      FROM jsonb_array_elements(v_selected) e
                     WHERE (e->>'id')::uuid = q.id
               )
             ORDER BY random()
             LIMIT v_remaining
          ) cj;
    END IF;

    RETURN COALESCE(v_selected, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_subject_test_questions(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_topic_test_questions(text, uuid, text, text, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.get_subject_test_questions(text, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.get_topic_test_questions(text, uuid, text, text, integer) FROM anon;
REVOKE ALL ON FUNCTION public.get_subject_test_questions(text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_topic_test_questions(text, uuid, text, text, integer) FROM PUBLIC;
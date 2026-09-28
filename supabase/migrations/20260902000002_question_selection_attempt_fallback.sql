-- ============================================================================
-- 20260902000002_question_selection_attempt_fallback.sql
--
-- CT-3 parity fix for Subject/Topic Test question selection.
--
-- The server-authoritative RPCs shipped in 20260902000000
-- (get_subject_test_questions / get_topic_test_questions) enforce the
-- Admin-configured counts and exclude already-attempted questions, but they
-- do NOT fall back to the attempted pool when a user has practiced the whole
-- subject/topic bank (same-context questions are returned as []).
--
-- The cross-page audit (§7 matrix, §12) requires, for cross-page parity with
-- User Exams and Prepare & Write: select un-attempted questions first, and
-- when the un-attempted pool is short, top up from the attempted pool within
-- the SAME context — so a fully-practiced subject/topic still returns usable
-- questions and never degrades to 0 solely because every question was
-- attempted. The authoritative Admin-configured count remains the ceiling.
--
-- ADDITIVE + IDEMPOTENT (CREATE OR REPLACE). Records in
-- supabase_migrations.schema_migrations. No RLS, schema, or grant changes.
-- correct_option is never shipped to the browser (scoring stays R-2/R-3
-- authoritative in set_question_answer / submit_attempt).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Subject Test: attempted-fallback within the same subject context.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_subject_test_questions(
    p_exam_id text,
    p_paper_id uuid,
    p_subject_name text,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count int;
    v_attempted uuid[];
    v_selected jsonb;
    v_filled int;
    v_remaining int;
BEGIN
    -- Authoritative count from Admin config.
    SELECT question_count INTO v_count
      FROM public.exam_subjects
     WHERE exam_id = p_exam_id AND paper_id = p_paper_id AND subject_name = p_subject_name;
    IF v_count IS NULL THEN
        RAISE EXCEPTION 'SUBJECT_CONFIG_NOT_FOUND';
    END IF;

    -- Attempted questions already answered by this user for this subject.
    -- Collected across ALL the user's attempts (not filtered by a.exam_id):
    -- subject/topic test attempts legitimately store NULL exam_id/paper_id
    -- (source is the discriminator), so an exam_id filter would silently miss
    -- them and repeats would be possible — violating the cross-page parity the
    -- audit requires. Restricting to this subject's question pool happens in
    -- the pass-1/pass-2 WHERE clauses below.
    SELECT ARRAY(
        SELECT DISTINCT aa.question_id
          FROM public.attempt_answers aa
          JOIN public.attempts a ON a.id = aa.attempt_id
         WHERE a.user_id = p_user_id
    ) INTO v_attempted;

    -- Pass 1: un-attempted questions first.
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

    -- Pass 2: when the un-attempted pool could not fill the authoritative
    -- count, top up from the attempted pool (same subject context) without
    -- duplicating already-selected questions. Guard is cardinality-based:
    -- `ARRAY(SELECT ...)` yields {} (NOT NULL) when the user has no attempts,
    -- so an empty array must not trigger a top-up that would discard the
    -- pass-1 selection.
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

REVOKE ALL ON FUNCTION public.get_subject_test_questions(text, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_subject_test_questions(text, uuid, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Topic Test: attempted-fallback within the same topic context.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_topic_test_questions(
    p_exam_id text,
    p_paper_id uuid,
    p_subject_name text,
    p_topic_name text,
    p_user_id uuid,
    p_test_size int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_topic record;
    v_count int;
    v_attempted uuid[];
    v_selected jsonb;
    v_filled int;
    v_remaining int;
BEGIN
    -- Resolve the authoritative topic row (Admin-config) for this context.
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

    -- Attempted questions already answered by this user for this topic.
    -- Collected across ALL the user's attempts (not filtered by a.exam_id):
    -- subject/topic test attempts legitimately store NULL exam_id/paper_id
    -- (source is the discriminator), so an exam_id filter would silently miss
    -- them and repeats would be possible — violating the cross-page parity the
    -- audit requires. Restricting to this topic's question pool happens in the
    -- pass-1/pass-2 WHERE clauses below.
    SELECT ARRAY(
        SELECT DISTINCT aa.question_id
          FROM public.attempt_answers aa
          JOIN public.attempts a ON a.id = aa.attempt_id
         WHERE a.user_id = p_user_id
    ) INTO v_attempted;

    -- Pass 1: un-attempted questions first.
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

    -- Pass 2: when the un-attempted pool could not fill the authoritative
    -- count, top up from the attempted pool (same topic context) without
    -- duplicating already-selected questions. Guard is cardinality-based:
    -- `ARRAY(SELECT ...)` yields {} (NOT NULL) when the user has no attempts,
    -- so an empty array must not trigger a top-up that would discard the
    -- pass-1 selection.
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

REVOKE ALL ON FUNCTION public.get_topic_test_questions(text, uuid, text, text, uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_topic_test_questions(text, uuid, text, text, uuid, int) TO authenticated;

COMMIT;
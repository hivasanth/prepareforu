-- =============================================================================
-- MIGRATION: Admin Questions — live Topic filter
-- Date: 2026-09-23
--
-- Adds a topic-level predicate to the admin question-list RPC so the Admin
-- Questions page can filter the shared question bank by a live exam_topics
-- topic (Exam -> Paper -> Subject -> Topic -> Questions).
--
-- CHANGES
--   - admin_list_questions gains a `p_topic_en text` parameter (DEFAULT NULL —
--     backward compatible with the pre-topic 9-argument callers, so a rolling
--     deploy cannot break the admin list mid-flight). When the caller supplies
--     a non-null, non-'all' value the question rows are constrained to
--     q.topic_en = p_topic_en (the exact same denormalized predicate the
--     question repository uses everywhere else; questions carry topic_en/topic_te
--     as display data — there is no topic_id column).
--   - The count and the rows come from the SAME filtered v_where, so
--     pagination totals always reflect the active topic filter.
--   - REVOKE/GRANT updated to the new 10-parameter signature (same least
--     privilege posture: PUBLIC/anon revoked, authenticated granted).
--   - The pre-topic 9-argument overload is dropped: CREATE OR REPLACE cannot
--     change a function's argument types, so the new signature would otherwise
--     coexist as a second answer-key-bearing entry point. The app always
--     sends p_topic_en (null = every topic), so no caller is orphaned.
-- =============================================================================

DROP FUNCTION IF EXISTS public.admin_list_questions(text[], text, text, text, text, text, boolean, integer, integer);

CREATE OR REPLACE FUNCTION public.admin_list_questions(
    p_exam_ids text[],
    p_paper_id text,
    p_subject_name text,
    p_topic_en text DEFAULT NULL,
    p_difficulty text DEFAULT NULL,
    p_search text DEFAULT NULL,
    p_sort_column text DEFAULT 'updated_at',
    p_ascending boolean DEFAULT false,
    p_offset integer DEFAULT 0,
    p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_where text := ' WHERE 1=1';
    v_sort text;
    v_count integer;
    v_rows jsonb;
    v_limit integer;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: admin role required';
    END IF;

    IF p_exam_ids IS NOT NULL AND array_length(p_exam_ids, 1) > 0 THEN
        v_where := v_where || format(' AND q.exam_id = ANY(%L)', p_exam_ids);
    END IF;
    IF p_paper_id IS NOT NULL AND p_paper_id <> 'all' THEN
        v_where := v_where || format(' AND q.paper_id = %L::uuid', p_paper_id);
    END IF;
    IF p_subject_name IS NOT NULL AND p_subject_name <> 'all' THEN
        v_where := v_where || format(' AND q.subject_name = %L', p_subject_name);
    END IF;
    IF p_topic_en IS NOT NULL AND p_topic_en <> 'all' THEN
        v_where := v_where || format(' AND q.topic_en = %L', p_topic_en);
    END IF;
    IF p_difficulty IS NOT NULL AND p_difficulty <> 'all' THEN
        v_where := v_where || format(' AND q.difficulty = %L', p_difficulty);
    END IF;
    IF p_search IS NOT NULL AND p_search <> '' THEN
        v_where := v_where || format(' AND q.question_text_en ILIKE %L', '%' || p_search || '%');
    END IF;

    v_sort := CASE p_sort_column
        WHEN 'id' THEN 'id'
        WHEN 'exam_id' THEN 'exam_id'
        WHEN 'paper_id' THEN 'paper_id'
        WHEN 'subject_name' THEN 'subject_name'
        WHEN 'topic_en' THEN 'topic_en'
        WHEN 'difficulty' THEN 'difficulty'
        WHEN 'is_active' THEN 'is_active'
        WHEN 'created_at' THEN 'created_at'
        WHEN 'updated_at' THEN 'updated_at'
        ELSE 'updated_at'
    END;

    -- F-15: keep the page bounded regardless of caller input.
    v_limit := GREATEST(LEAST(COALESCE(p_limit, 50), 200), 1);

    EXECUTE format('SELECT count(*) FROM public.questions q%s', v_where) INTO v_count;

    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
         FROM (
           SELECT q.id, q.exam_id, q.paper_id, q.subject_name,
                  q.topic_en, q.topic_te,
                  q.correct_option, q.difficulty, q.negative_marks, q.visual,
                  q.content_hash, q.is_active, q.created_by,
                  q.created_at, q.updated_at,
                  q.question_text_en, q.question_text_te,
                  q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en,
                  q.option_a_te, q.option_b_te, q.option_c_te, q.option_d_te,
                  q.explanation_en, q.explanation_te
             FROM public.questions q%s
            ORDER BY q.%I %s
            LIMIT %s OFFSET %s
         ) t',
      v_where,
      v_sort,
      CASE WHEN p_ascending THEN 'ASC' ELSE 'DESC' END,
      v_limit,
      p_offset
    ) INTO v_rows;

    RETURN jsonb_build_object('count', v_count, 'rows', COALESCE(v_rows, '[]'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_questions(text[], text, text, text, text, text, text, boolean, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_questions(text[], text, text, text, text, text, text, boolean, integer, integer) TO authenticated;
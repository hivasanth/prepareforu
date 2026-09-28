-- ============================================================================
-- 20260904000000_publish_ready_dead_schema_and_tabswitch.sql
--
-- Publish-readiness hardening (from the 32-phase audit fixes).
--
-- CONTENTS:
--   M-03  Add atomic, server-authoritative tab-switch counter RPC and remove
--         the client-settable setter. The counter is now monotonic and owned
--         by the DB, so a caller can no longer spoof/reset it.
--   H-02  Drop the dead `subject_performance` table. Subject performance is
--         derived on-the-fly by get_user_performance_answer_stats; the table
--         has no writer and no reader, so it is pure dead schema.
--   H-03  Remove legacy import tracking: drop `import_session_id` from
--         questions (never populated by the current upload flow), drop the
--         `import_sessions` table, and redefine admin_list_questions so it no
--         longer projects that column.
--   M-05  Harden the question_counts view aggregation with a matching partial
--         index (exam_id, paper_id, subject_name) WHERE is_active, so the
--         view stays an index-only scan at 10K+ rows.
--
-- IDEMPOTENT / SAFE: guarded drops. Re-runnable.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- M-03: atomic tab-switch counter
-- ---------------------------------------------------------------------------

-- Remove the spoofable client-settable setter. Keeping it would let an
-- authenticated caller reset or clamp their own tab_switch_count, defeating
-- the purpose of server-authoritative auto-submit on tab abuse.
DROP FUNCTION IF EXISTS public.update_tab_switch_count(uuid, integer);

-- New monotonic increment: ownership-guarded, atomic, returns the new count.
CREATE OR REPLACE FUNCTION public.bump_tab_switch_count(
    p_attempt_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_owner uuid;
    v_new_count integer;
BEGIN
    SELECT user_id INTO v_owner FROM public.attempts WHERE id = p_attempt_id;
    IF v_owner IS NULL THEN
        RAISE EXCEPTION 'Attempt not found';
    END IF;
    IF v_owner <> auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.attempts
       SET tab_switch_count = tab_switch_count + 1
     WHERE id = p_attempt_id
     RETURNING tab_switch_count INTO v_new_count;

    RETURN COALESCE(v_new_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.bump_tab_switch_count(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bump_tab_switch_count(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.bump_tab_switch_count(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- H-02: drop dead subject_performance table
--   (DROP TABLE removes its RLS policies, indexes, and FK constraints).
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.subject_performance;

-- ---------------------------------------------------------------------------
-- H-03: remove legacy import tracking
-- ---------------------------------------------------------------------------

-- M-05 hardening: the question_counts view aggregates `WHERE is_active = true
-- GROUP BY exam_id, paper_id, subject_name`. A partial index on exactly those
-- columns (filtered to active rows) guarantees an index-only scan for the view
-- at scale, so per-subject/paper/exam counts stay cheap even at 10K+ rows. The
-- broader composite index already exists; this partial index is the precise
-- match for the view's predicate.
CREATE INDEX IF NOT EXISTS idx_questions_counts_view_active
    ON public.questions (exam_id, paper_id, subject_name)
    WHERE is_active = true;

-- Redefine admin_list_questions WITHOUT projecting q.import_session_id, so it
-- continues to work after the column is dropped. The body is otherwise
-- identical to 20260903020000_f01_f07_answer_key_self_readback.sql.
CREATE OR REPLACE FUNCTION public.admin_list_questions(
    p_exam_ids text[],
    p_paper_id text,
    p_subject_name text,
    p_difficulty text,
    p_search text,
    p_sort_column text,
    p_ascending boolean,
    p_offset integer,
    p_limit integer
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
BEGIN
    IF NOT (public.is_admin() OR public.is_sub_admin()) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: admin or sub-admin required';
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
      p_limit,
      p_offset
    ) INTO v_rows;

    RETURN jsonb_build_object('count', v_count, 'rows', COALESCE(v_rows, '[]'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_questions(text[], text, text, text, text, text, boolean, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_questions(text[], text, text, text, text, text, boolean, integer, integer) TO authenticated;

-- Drop the FK (ON DELETE SET NULL), the column, and the empty legacy table.
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_import_session_id_fkey;
ALTER TABLE public.questions DROP COLUMN IF EXISTS import_session_id;
DROP TABLE IF EXISTS public.import_sessions;

COMMIT;

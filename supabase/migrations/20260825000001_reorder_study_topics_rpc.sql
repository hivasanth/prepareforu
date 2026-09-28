-- =============================================================================
-- MIGRATION: reorder_study_topics transactional reorder RPC (MED-3)
-- Date: 2026-08-25 (admin topics remediation)
--
-- WHY THIS FILE EXISTS:
--   The admin topics page previously fired N parallel UPDATE statements to
--   reorder display_order values. This caused race conditions when two admins
--   reordered simultaneously and non-deterministic final order. This RPC
--   performs the entire reorder in a single database transaction, validating
--   scope and rolling back atomically on any failure.
--
-- SECURITY:
--   SECURITY INVOKER — runs with the caller's role (authenticated), so RLS
--   policies on study_topics apply. The function validates that every supplied
--   topic belongs to the supplied (exam_id, paper_id, subject_name) context.
--
--   SECURITY DEFINER was considered but rejected because:
--     1. The caller must be authenticated (RLS enforces admin/sub_admin).
--     2. SECURITY DEFINER would bypass RLS, requiring manual auth checks.
--     3. SECURITY INVOKER is simpler and relies on existing proven RLS.
--
--   NOTE: The function is deliberately VOLATILE (the default) because it
--   performs UPDATEs — declaring STABLE/VOLATILE incorrectly would break
--   correctness guarantees. Default EXECUTE privileges remain in place; even
--   if invoked by anon, RLS + scope validation make the call a no-op at worst.
--
-- IDEMPOTENT: DROP IF EXISTS + CREATE. Safe to re-apply.
-- =============================================================================

-- ─── 1. Drop existing if present ─────────────────────────────────────────────
-- NOTE (N-3 remediation): the CREATE below defines the arguments as
-- (p_exam_id text, p_paper_id uuid, p_subject_name text, p_topic_ids uuid[],
--  p_display_orders integer[]) — i.e. (text, uuid, text, uuid[], int[]). The
-- original DROP/REVOKE/GRANT statements used (text, text, text, uuid[], int[]),
-- which is a different overload and would fail with SQLSTATE 42883. Aligned to
-- the live signature (verified LIVE: same argument list).
DROP FUNCTION IF EXISTS public.reorder_study_topics(
  text, uuid, text, uuid[], integer[]
);

-- ─── 2. Create the RPC ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reorder_study_topics(
  p_exam_id        text,
  p_paper_id       uuid,
  p_subject_name   text,
  p_topic_ids      uuid[],
  p_display_orders integer[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_len   integer;
  v_row   record;
BEGIN
  -- ── Input validation ──────────────────────────────────────────────────────
  v_len := array_length(p_topic_ids, 1);

  IF v_len IS NULL OR v_len = 0 THEN
    RAISE EXCEPTION 'reorder_study_topics: topic_ids array must not be empty';
  END IF;

  IF array_length(p_display_orders, 1) != v_len THEN
    RAISE EXCEPTION 'reorder_study_topics: topic_ids and display_orders must have equal length';
  END IF;

  -- ── Validate every topic belongs to the supplied context ───────────────────
  FOR v_row IN
    SELECT id, exam_id, paper_id, subject_name
    FROM public.study_topics
    WHERE id = ANY(p_topic_ids)
  LOOP
    IF v_row.exam_id != p_exam_id
       OR v_row.paper_id != p_paper_id
       OR v_row.subject_name != p_subject_name THEN
      RAISE EXCEPTION 'reorder_study_topics: topic % does not belong to the supplied context', v_row.id;
    END IF;
  END LOOP;

  -- ── Check all expected topics are present ──────────────────────────────────
  IF (SELECT count(*) FROM public.study_topics
      WHERE exam_id = p_exam_id
        AND paper_id = p_paper_id
        AND subject_name = p_subject_name) != v_len THEN
    RAISE EXCEPTION 'reorder_study_topics: supplied topic count does not match context topic count';
  END IF;

  -- ── Check for duplicate display_orders in the input ────────────────────────
  IF (SELECT count(DISTINCT val) FROM unnest(p_display_orders) AS val) != v_len THEN
    RAISE EXCEPTION 'reorder_study_topics: duplicate display_order values supplied';
  END IF;

  -- ── Perform atomic reorder ────────────────────────────────────────────────
  -- PL/pgSQL function bodies run inside a single implicit transaction: any
  -- unhandled exception aborts the whole reorder with no partial state.
  FOR i IN 1..v_len LOOP
    UPDATE public.study_topics
    SET display_order = p_display_orders[i]
    WHERE id = p_topic_ids[i]
      AND exam_id = p_exam_id
      AND paper_id = p_paper_id
      AND subject_name = p_subject_name;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'reorder_study_topics: failed to update topic %', p_topic_ids[i];
    END IF;
  END LOOP;
END;
$$;

-- ─── 3. Privileges ───────────────────────────────────────────────────────────
-- Supabase default privileges grant EXECUTE to anon EXPLICITLY (not just via
-- PUBLIC), so revoking PUBLIC alone is insufficient to deny anon.
REVOKE EXECUTE ON FUNCTION public.reorder_study_topics(text, uuid, text, uuid[], integer[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reorder_study_topics(text, uuid, text, uuid[], integer[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.reorder_study_topics(text, uuid, text, uuid[], integer[]) TO authenticated;

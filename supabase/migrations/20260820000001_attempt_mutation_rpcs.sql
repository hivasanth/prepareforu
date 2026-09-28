-- FIX-04: Narrowly-scoped SECURITY DEFINER RPCs for attempts mutations.
-- Replaces direct client UPDATE on attempts table (which has no RLS UPDATE policy).
-- Each RPC: one purpose, ownership guard, least privilege.

-- ============================================================================
-- RPC 1: mark_review_accessed
-- PURPOSE: Set review_accessed=true for a single attempt (one-time gate).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_review_accessed(p_attempt_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM public.attempts WHERE id = p_attempt_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  UPDATE public.attempts SET review_accessed = true WHERE id = p_attempt_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_review_accessed(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_review_accessed(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.mark_review_accessed(UUID) TO authenticated;

-- ============================================================================
-- RPC 2: update_attempt_answers_cache
-- PURPOSE: Set answers_json for resume fallback.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_attempt_answers_cache(
  p_attempt_id UUID,
  p_answers_json JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM public.attempts WHERE id = p_attempt_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  UPDATE public.attempts SET answers_json = p_answers_json WHERE id = p_attempt_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_attempt_answers_cache(UUID, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_attempt_answers_cache(UUID, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_attempt_answers_cache(UUID, JSONB) TO authenticated;

-- ============================================================================
-- RPC 3: update_tab_switch_count
-- PURPOSE: Set tab_switch_count for security tracking.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_tab_switch_count(
  p_attempt_id UUID,
  p_count INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM public.attempts WHERE id = p_attempt_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;
  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  UPDATE public.attempts SET tab_switch_count = p_count WHERE id = p_attempt_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_tab_switch_count(UUID, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_tab_switch_count(UUID, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_tab_switch_count(UUID, INTEGER) TO authenticated;

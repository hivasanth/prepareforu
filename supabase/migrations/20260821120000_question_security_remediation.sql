-- QUESTION DATA CONTRACT + SECURITY REMEDIATION
-- Verified against live DB before applying:
--   * zero rows violate the new negative_marks range (min=0, max=0 observed)
--   * anon has no RLS policy on questions/exam_topics (SELECT grant was dead)
--   * no API path can issue TRUNCATE as authenticated
--
-- REPLAYABILITY (N-3 remediation, 2026-09-10): chk_questions_negative_marks_range
-- is also created by 20260401000001 (genesis — it mirrors the live questions
-- table, which carries this constraint). The constraint is therefore added
-- behind an EXISTS guard so this file replays without SQLSTATE 42710; the
-- resulting schema is identical.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_questions_negative_marks_range'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT chk_questions_negative_marks_range
      CHECK (negative_marks >= 0 AND negative_marks <= 99.99);
  END IF;
END $$;

REVOKE SELECT ON public.questions FROM anon;
REVOKE SELECT ON public.exam_topics FROM anon;

REVOKE TRUNCATE ON public.questions FROM authenticated;
REVOKE TRUNCATE ON public.exam_topics FROM authenticated;

-- check_exam_velocity() is reconstructed by 20260401000001 (genesis). Guard the
-- search_path hardening so this file replays if that function is absent.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'check_exam_velocity'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    ALTER FUNCTION public.check_exam_velocity() SET search_path = public, pg_temp;
  END IF;
END $$;

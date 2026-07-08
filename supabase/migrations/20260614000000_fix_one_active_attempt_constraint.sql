-- Fix attempts constraint: replace strict unique constraint with partial unique index
-- This allows multiple completed attempts for the same exam while preventing multiple active attempts.

ALTER TABLE public.attempts DROP CONSTRAINT IF EXISTS one_active_attempt;

DROP INDEX IF EXISTS public.one_active_attempt;

CREATE UNIQUE INDEX one_active_attempt 
ON public.attempts (user_id, exam_id, paper_id) 
WHERE (status = 'in_progress');

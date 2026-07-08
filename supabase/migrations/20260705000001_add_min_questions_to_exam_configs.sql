-- Add configurable minimum question threshold to exam_configs.
-- Default is 30 — the canonical minimum across Subject Tests, Topic Exams, and full Exams.

ALTER TABLE public.exam_configs ADD COLUMN min_questions INTEGER NOT NULL DEFAULT 30;

-- Update existing rows so the explicit value matches the default
UPDATE public.exam_configs SET min_questions = 30 WHERE min_questions IS NULL;

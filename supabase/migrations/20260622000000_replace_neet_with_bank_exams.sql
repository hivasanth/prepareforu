-- Delete all NEET related data
DELETE FROM public.attempts WHERE exam_id = 'NEET';
DELETE FROM public.leaderboard WHERE exam_id = 'NEET';
DELETE FROM public.daily_stats WHERE exam_id = 'NEET';
DELETE FROM public.subject_performance WHERE exam_id = 'NEET';
DELETE FROM public.questions WHERE exam_id = 'NEET';
DELETE FROM public.exam_subjects WHERE exam_id = 'NEET';
DELETE FROM public.exam_papers WHERE exam_id = 'NEET';
DELETE FROM public.exams WHERE exam_id = 'NEET';
DELETE FROM public.exam_configs WHERE exam_id = 'NEET' OR exam_selection = 'NEET';

-- Insert Bank Exams into exams table
INSERT INTO public.exams (exam_id, exam_type) VALUES ('BANK_EXAMS', 'main') ON CONFLICT (exam_id) DO NOTHING;

-- Update users who had NEET to BANK_EXAMS
UPDATE public.users SET exam_selection = 'BANK_EXAMS' WHERE exam_selection = 'NEET';

-- Insert Bank Exams into exam_configs
INSERT INTO public.exam_configs (
    exam_id, name, exam_selection, total_questions, total_marks, duration_minutes, negative_marking, negative_mark_value, is_published
) VALUES (
    'BANK_EXAMS', 'Bank Exams', 'BANK_EXAMS', 100, 100, 60, true, 0.25, true
) ON CONFLICT (exam_id) DO UPDATE SET
    name = EXCLUDED.name,
    total_questions = EXCLUDED.total_questions,
    total_marks = EXCLUDED.total_marks,
    duration_minutes = EXCLUDED.duration_minutes;

-- Insert default paper for Bank Exams
DO $$
DECLARE
    v_paper_id uuid;
BEGIN
    INSERT INTO public.exam_papers (
        exam_id, paper_name, stage, total_questions, total_marks, duration_minutes, negative_marking, negative_mark_value
    ) VALUES (
        'BANK_EXAMS', 'Prelims Paper', 'SINGLE', 100, 100, 60, true, 0.25
    ) RETURNING id INTO v_paper_id;

    -- Insert subjects for Bank Exams
    INSERT INTO public.exam_subjects (
        exam_id, paper_id, subject_name, question_count, marks_per_question
    ) VALUES 
        ('BANK_EXAMS', v_paper_id, 'Quantitative Aptitude & Data Interpretation', 20, 1),
        ('BANK_EXAMS', v_paper_id, 'Reasoning Ability & Computer Aptitude', 20, 1),
        ('BANK_EXAMS', v_paper_id, 'English Language', 20, 1),
        ('BANK_EXAMS', v_paper_id, 'General, Banking & Financial Awareness', 20, 1),
        ('BANK_EXAMS', v_paper_id, 'Computer Knowledge', 20, 1);
END $$;

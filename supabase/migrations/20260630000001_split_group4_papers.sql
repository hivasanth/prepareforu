-- ============================================================
-- Migration: Split APPSC_GROUP_4 merged paper into two papers
--
-- Before: ONE paper "General Studies, Mental Ability, General English and Telugu"
--         with subjects: General Studies (50Q), Mental Ability (50Q),
--                        General English (25Q), General Telugu (25Q)
--
-- After:  TWO papers
--   Paper 1 "General Studies & Mental Ability"   → 150Q | 150M | 150Min
--             subjects: General Studies (75Q/75M), Mental Ability (75Q/75M)
--   Paper 2 "General English and General Telugu" → 150Q | 150M | 150Min
--             subjects: General English (75Q/75M), General Telugu (75Q/75M)
-- ============================================================

DO $$
DECLARE
    v_exam_id          text := 'APPSC_GROUP_4';
    v_paper1_id        uuid := 'd1e80acb-4249-4cd9-9547-53a042c3680a'; -- existing merged paper
    v_paper2_id        uuid;
BEGIN

    -- STEP 1: Rename & update Paper 1 totals
    UPDATE public.exam_papers
    SET paper_name       = 'General Studies & Mental Ability',
        total_questions  = 150,
        total_marks      = 150,
        duration_minutes = 150,
        display_order    = 1
    WHERE id = v_paper1_id;

    -- STEP 2: Update subjects of Paper 1 to correct question counts (75 each)
    UPDATE public.exam_subjects
    SET question_count = 75, display_order = 1
    WHERE paper_id = v_paper1_id AND subject_name = 'General Studies';

    UPDATE public.exam_subjects
    SET question_count = 75, display_order = 2
    WHERE paper_id = v_paper1_id AND subject_name = 'Mental Ability';

    -- STEP 3: Remove English/Telugu subjects from Paper 1 (re-added to Paper 2 below)
    DELETE FROM public.exam_subjects
    WHERE paper_id = v_paper1_id
      AND subject_name IN ('General English', 'General Telugu');

    -- STEP 4: Create Paper 2
    INSERT INTO public.exam_papers (
        exam_id, paper_name, stage,
        total_questions, total_marks, duration_minutes,
        negative_marking, negative_mark_value, display_order
    ) VALUES (
        v_exam_id, 'General English and General Telugu', 'SINGLE',
        150, 150, 150,
        false, 0, 2
    ) RETURNING id INTO v_paper2_id;

    -- STEP 5: Create subjects for Paper 2 (75 questions each)
    INSERT INTO public.exam_subjects (
        exam_id, paper_id, subject_name, question_count, marks_per_question, display_order
    ) VALUES
        (v_exam_id, v_paper2_id, 'General English', 75, 1, 1),
        (v_exam_id, v_paper2_id, 'General Telugu',  75, 1, 2);

    -- STEP 6: Re-assign existing questions to Paper 2 by subject_name
    UPDATE public.questions
    SET paper_id = v_paper2_id
    WHERE exam_id = v_exam_id
      AND subject_name IN ('General English', 'General Telugu');

    -- STEP 7: Update exam_configs combined total (300Q/300M/300Min for both papers)
    UPDATE public.exam_configs
    SET total_questions  = 300,
        total_marks      = 300,
        duration_minutes = 300
    WHERE exam_id = v_exam_id;

    RAISE NOTICE 'APPSC_GROUP_4 successfully split into 2 papers.';
    RAISE NOTICE '  Paper 1: General Studies & Mental Ability';
    RAISE NOTICE '  Paper 2: General English and General Telugu';
END $$;

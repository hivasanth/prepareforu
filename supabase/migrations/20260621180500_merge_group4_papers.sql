-- Migration to merge the two APPSC_GROUP_4 papers into a single paper
-- "General Studies, Mental Ability, General English and Telugu"

DO $$
DECLARE
    v_exam_id text := 'APPSC_GROUP_4';
    v_surviving_paper_id uuid;
    v_deleted_paper_id uuid;
    v_new_total_q int;
    v_new_total_m int;
    v_new_duration int;
BEGIN
    -- 1. Identify the two papers. We keep the first one (based on display_order)
    SELECT id INTO v_surviving_paper_id
    FROM public.exam_papers
    WHERE exam_id = v_exam_id
    ORDER BY display_order ASC
    LIMIT 1;

    -- Find the second paper to delete
    SELECT id INTO v_deleted_paper_id
    FROM public.exam_papers
    WHERE exam_id = v_exam_id AND id != v_surviving_paper_id
    LIMIT 1;

    IF v_surviving_paper_id IS NULL THEN
        RAISE NOTICE 'No papers found for APPSC_GROUP_4. Please ensure the exam exists.';
        RETURN;
    END IF;

    IF v_deleted_paper_id IS NOT NULL THEN
        -- Calculate the sum of totals for the combined paper
        SELECT SUM(total_questions), SUM(total_marks), SUM(duration_minutes)
        INTO v_new_total_q, v_new_total_m, v_new_duration
        FROM public.exam_papers
        WHERE exam_id = v_exam_id;

        -- 2. Rename surviving paper and update totals
        UPDATE public.exam_papers
        SET paper_name = 'General Studies, Mental Ability, General English and Telugu',
            total_questions = v_new_total_q,
            total_marks = v_new_total_m,
            duration_minutes = v_new_duration
        WHERE id = v_surviving_paper_id;

        -- 3. Move all subjects from the deleted paper to the surviving paper
        UPDATE public.exam_subjects
        SET paper_id = v_surviving_paper_id
        WHERE paper_id = v_deleted_paper_id;

        -- Just in case there are any questions, attempts, or leaderboard entries 
        -- (Even if empty, this ensures data integrity)
        UPDATE public.questions
        SET paper_id = v_surviving_paper_id
        WHERE paper_id = v_deleted_paper_id;

        UPDATE public.attempts
        SET paper_id = v_surviving_paper_id
        WHERE paper_id = v_deleted_paper_id;

        UPDATE public.leaderboard
        SET paper_id = v_surviving_paper_id
        WHERE paper_id = v_deleted_paper_id;

        -- 4. Delete the second paper
        DELETE FROM public.exam_papers
        WHERE id = v_deleted_paper_id;
        
        RAISE NOTICE 'Successfully merged APPSC_GROUP_4 papers.';
    ELSE
        -- If there's already only one paper, just rename it
        UPDATE public.exam_papers
        SET paper_name = 'General Studies, Mental Ability, General English and Telugu'
        WHERE id = v_surviving_paper_id;
        
        RAISE NOTICE 'Only one paper found. Renamed it successfully.';
    END IF;

END $$;

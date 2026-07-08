-- Step 1: Drop dependent materialized views
DROP MATERIALIZED VIEW IF EXISTS public.daily_attempts_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.exam_distribution CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.admin_leaderboard_view CASCADE;

-- Step 1.5: Drop dependent RLS policies
DROP POLICY IF EXISTS exam_versions_select ON public.exam_versions;

-- Step 2: Drop foreign key constraints that reference exam_id and exam_selection
ALTER TABLE public.exam_versions DROP CONSTRAINT IF EXISTS exam_versions_exam_id_fkey;
ALTER TABLE public.exam_papers DROP CONSTRAINT IF EXISTS exam_papers_exam_id_fkey;
ALTER TABLE public.exam_subjects DROP CONSTRAINT IF EXISTS exam_subjects_exam_id_fkey;
ALTER TABLE public.import_sessions DROP CONSTRAINT IF EXISTS import_sessions_exam_id_fkey;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_exam_id_fkey;
ALTER TABLE public.question_upload_prompts DROP CONSTRAINT IF EXISTS question_upload_prompts_exam_id_fkey;
ALTER TABLE public.leaderboard DROP CONSTRAINT IF EXISTS leaderboard_exam_id_fkey;
ALTER TABLE public.daily_stats DROP CONSTRAINT IF EXISTS daily_stats_exam_id_fkey;
ALTER TABLE public.subject_performance DROP CONSTRAINT IF EXISTS subject_performance_exam_id_fkey;
ALTER TABLE public.prepare_sessions DROP CONSTRAINT IF EXISTS prepare_sessions_exam_id_fkey;
ALTER TABLE public.attempts DROP CONSTRAINT IF EXISTS fk_attempts_exam;
ALTER TABLE public.leaderboard DROP CONSTRAINT IF EXISTS fk_leaderboard_exam;

-- Step 3: Drop functions that take exam_id or exam_selection as parameter so we can redefine them
DROP FUNCTION IF EXISTS public.get_user_leaderboard_rank(public.exam_id, uuid, text);
DROP FUNCTION IF EXISTS public.refresh_leaderboard_ranks(public.exam_id, uuid);

-- Step 4: Redefine the helper functions with TEXT parameter types
CREATE OR REPLACE FUNCTION public.get_user_leaderboard_rank(p_exam_id text, p_paper_id uuid, p_time_range text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_rank INT;
    v_score NUMERIC;
    v_accuracy NUMERIC;
    v_duration INT;
    v_submitted_at TIMESTAMPTZ;
    v_since TIMESTAMPTZ;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    IF p_time_range = 'all' THEN
        -- Get from pre-calculated leaderboard table
        SELECT rank, best_score, best_accuracy, best_time_secs, best_submitted_at
        INTO v_rank, v_score, v_accuracy, v_duration, v_submitted_at
        FROM public.leaderboard
        WHERE user_id = v_user_id 
        AND exam_id = p_exam_id
        AND paper_id = p_paper_id;
    ELSE
        -- Calculate time threshold
        v_since := CASE 
            WHEN p_time_range = 'month' THEN NOW() - INTERVAL '1 month'
            WHEN p_time_range = 'week' THEN NOW() - INTERVAL '7 days'
            WHEN p_time_range = 'today' THEN date_trunc('day', NOW())
            ELSE '-infinity'::TIMESTAMPTZ
        END;

        -- Dynamic calculation for Time Range
        -- We only need the rank of the specific user
        WITH best_attempts AS (
            SELECT DISTINCT ON (ba.user_id)
                ba.user_id, ba.score, ba.accuracy, ba.duration_seconds, ba.submitted_at
            FROM public.attempts ba
            WHERE ba.exam_id = p_exam_id 
            AND ba.paper_id = p_paper_id 
            AND ba.status = 'completed' 
            AND ba.source = 'exam_tab'
            AND ba.submitted_at >= v_since
            ORDER BY ba.user_id, ba.score DESC, ba.accuracy DESC, ba.duration_seconds ASC, ba.submitted_at ASC
        ),
        user_best AS (
            SELECT * FROM best_attempts WHERE user_id = v_user_id
        )
        SELECT 
            (SELECT COUNT(*) + 1 
             FROM best_attempts ba 
             WHERE (ba.score > ub.score)
                OR (ba.score = ub.score AND ba.accuracy > ub.accuracy)
                OR (ba.score = ub.score AND ba.accuracy = ub.accuracy AND ba.duration_seconds < ub.duration_seconds)
                OR (ba.score = ub.score AND ba.accuracy = ub.accuracy AND ba.duration_seconds = ub.duration_seconds AND ba.submitted_at < ub.submitted_at)
            ),
            ub.score, ub.accuracy, ub.duration_seconds, ub.submitted_at
        INTO v_rank, v_score, v_accuracy, v_duration, v_submitted_at
        FROM user_best ub;
    END IF;

    IF v_rank IS NULL THEN
        RETURN jsonb_build_object('rank', null);
    END IF;

    RETURN jsonb_build_object(
        'rank', v_rank,
        'score', v_score,
        'accuracy', v_accuracy,
        'duration', v_duration,
        'submitted_at', v_submitted_at
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_leaderboard_ranks(p_exam_id text, p_paper_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.leaderboard l
  SET rank = ranked.rank
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY exam_id, paper_id
        ORDER BY 
          best_score DESC, 
          best_accuracy DESC, 
          best_time_secs ASC, 
          best_submitted_at ASC
      ) AS rank
    FROM public.leaderboard
    WHERE exam_id = p_exam_id AND paper_id = p_paper_id
  ) ranked
  WHERE l.id = ranked.id;
END;
$$;

-- Redefine submit_attempt(uuid) replacing v_exam_id type with text
CREATE OR REPLACE FUNCTION public.submit_attempt(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_exam_id text;
    v_paper_id UUID;
    v_source public.attempt_source;
    v_total_correct INT;
    v_total_wrong INT;
    v_total_skipped INT;
    v_score NUMERIC;
    v_accuracy NUMERIC;
    v_total_marks NUMERIC;
    v_duration INT;
    v_submitted_at TIMESTAMPTZ;
    v_result JSONB;
BEGIN
    -- 1. Get attempt info
    SELECT user_id, exam_id, paper_id, total_marks, source, started_at
    INTO v_user_id, v_exam_id, v_paper_id, v_total_marks, v_source, v_submitted_at -- We'll use actual NOW() for submitted_at
    FROM public.attempts 
    WHERE id = p_attempt_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Attempt NOT FOUND with ID: %', p_attempt_id;
    END IF;

    -- 2. Calculate counts
    SELECT 
        COUNT(*) FILTER (WHERE is_correct = TRUE) as correct,
        COUNT(*) FILTER (WHERE is_correct = FALSE) as wrong,
        COUNT(*) FILTER (WHERE is_correct IS NULL) as skipped,
        COALESCE(SUM(marks_awarded), 0) as total_earned
    INTO v_total_correct, v_total_wrong, v_total_skipped, v_score
    FROM public.attempt_answers
    WHERE attempt_id = p_attempt_id;

    -- 3. Calculate accuracy
    IF (v_total_correct + v_total_wrong) > 0 THEN
        v_accuracy := (v_total_correct::NUMERIC / (v_total_correct + v_total_wrong)::NUMERIC) * 100;
    ELSE
        v_accuracy := 0;
    END IF;

    v_submitted_at := NOW();
    v_duration := EXTRACT(EPOCH FROM (v_submitted_at - (SELECT started_at FROM public.attempts WHERE id = p_attempt_id)))::INT;

    -- 4. Update the attempt
    UPDATE public.attempts
    SET 
        status = 'completed',
        submitted_at = v_submitted_at,
        score = v_score,
        correct_count = v_total_correct,
        wrong_count = v_total_wrong,
        skipped_count = v_total_skipped,
        accuracy = ROUND(v_accuracy, 2),
        duration_seconds = v_duration
    WHERE id = p_attempt_id;

    -- 5. Update User Statistics
    IF v_source = 'exam_tab' THEN
        UPDATE public.users
        SET 
            overall_accuracy = CASE 
                WHEN total_exams = 0 THEN ROUND(v_accuracy, 2)
                ELSE ROUND(((overall_accuracy * total_exams + v_accuracy) / (total_exams + 1)), 2)
            END,
            total_exams = total_exams + 1
        WHERE id = v_user_id;
    END IF;

    -- 6. Update Leaderboard (Upsert best performance)
    IF v_exam_id IS NOT NULL AND v_paper_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.exams WHERE exam_id = v_exam_id AND exam_type = 'main') THEN
            INSERT INTO public.leaderboard (
                user_id, exam_id, paper_id, 
                best_score, best_accuracy, best_time_secs, best_submitted_at,
                attempt_count, updated_at
            )
            VALUES (
                v_user_id, v_exam_id, v_paper_id, 
                v_score, ROUND(v_accuracy, 2), v_duration, v_submitted_at,
                1, NOW()
            )
            ON CONFLICT (user_id, exam_id, paper_id) DO UPDATE SET
                -- Logic: Update ONLY if the new attempt is better
                best_score = CASE 
                    WHEN (EXCLUDED.best_score > leaderboard.best_score) OR 
                         (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy > leaderboard.best_accuracy) OR
                         (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs < leaderboard.best_time_secs) OR
                         (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs = leaderboard.best_time_secs AND EXCLUDED.best_submitted_at < leaderboard.best_submitted_at)
                    THEN EXCLUDED.best_score
                    ELSE leaderboard.best_score
                END,
                best_accuracy = CASE 
                    WHEN (EXCLUDED.best_score > leaderboard.best_score) OR 
                         (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy > leaderboard.best_accuracy) OR
                         (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs < leaderboard.best_time_secs) OR
                         (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs = leaderboard.best_time_secs AND EXCLUDED.best_submitted_at < leaderboard.best_submitted_at)
                    THEN EXCLUDED.best_accuracy
                    ELSE leaderboard.best_accuracy
                END,
                best_time_secs = CASE 
                    WHEN (EXCLUDED.best_score > leaderboard.best_score) OR 
                         (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy > leaderboard.best_accuracy) OR
                         (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs < leaderboard.best_time_secs) OR
                         (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs = leaderboard.best_time_secs AND EXCLUDED.best_submitted_at < leaderboard.best_submitted_at)
                    THEN EXCLUDED.best_time_secs
                    ELSE leaderboard.best_time_secs
                END,
                best_submitted_at = CASE 
                    WHEN (EXCLUDED.best_score > leaderboard.best_score) OR 
                         (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy > leaderboard.best_accuracy) OR
                         (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs < leaderboard.best_time_secs) OR
                         (EXCLUDED.best_score = leaderboard.best_score AND EXCLUDED.best_accuracy = leaderboard.best_accuracy AND EXCLUDED.best_time_secs = leaderboard.best_time_secs AND EXCLUDED.best_submitted_at < leaderboard.best_submitted_at)
                    THEN EXCLUDED.best_submitted_at
                    ELSE leaderboard.best_submitted_at
                END,
                attempt_count = leaderboard.attempt_count + 1,
                updated_at = NOW();
        END IF;
    END IF;

    -- 8. Return result
    v_result := jsonb_build_object(
        'score', ROUND(v_score, 2),
        'total_marks', v_total_marks,
        'correct_count', v_total_correct,
        'wrong_count', v_total_wrong,
        'skipped_count', v_total_skipped,
        'accuracy', ROUND(v_accuracy, 2)
    );

    RETURN v_result;
END;
$$;

-- Redefine handle_new_user() trigger function replacing public.exam_selection with text
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coupon text;
    v_sub_admin_id uuid;
    v_educator_id uuid;
    v_full_name text;
    v_role_str text;
    v_exam_selection text;
BEGIN
    -- 1. Extract and sanitize metadata
    v_coupon := NULLIF(TRIM(new.raw_user_meta_data->>'coupon_code'), '');
    
    -- Safe UUID extraction for educator_id
    BEGIN
        v_educator_id := NULLIF(TRIM(new.raw_user_meta_data->>'educator_id'), '')::uuid;
    EXCEPTION WHEN others THEN
        v_educator_id := NULL;
    END;

    -- Safe Extract exam_selection as text directly
    v_exam_selection := NULLIF(TRIM(new.raw_user_meta_data->>'exam_selection'), '');

    v_full_name := COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1));
    v_role_str := COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'role'), ''), 'user');

    -- 2. If educator_id is provided, find sub_admin_id
    IF v_educator_id IS NOT NULL THEN
        SELECT id INTO v_sub_admin_id
        FROM public.sub_admins
        WHERE user_id = v_educator_id;
    END IF;

    -- 3. If no educator_id but coupon exists, find via coupon
    IF v_educator_id IS NULL AND v_coupon IS NOT NULL THEN
        SELECT id, user_id INTO v_sub_admin_id, v_educator_id
        FROM public.sub_admins
        WHERE coupon_code = v_coupon AND status = 'active';
    END IF;

    -- 4. Final insertion
    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        coupon_code,
        sub_admin_id,
        educator_id,
        coupon_code_used,
        exam_selection,
        created_at
    )
    VALUES (
        new.id,
        new.email,
        v_full_name,
        v_role_str::public.user_role,
        v_coupon,
        v_sub_admin_id,
        v_educator_id,
        (v_coupon IS NOT NULL),
        v_exam_selection,
        now()
    );

    RETURN new;
END;
$$;

-- Step 5: Convert all columns using USER-DEFINED enum types to TEXT
ALTER TABLE public.question_upload_prompts ALTER COLUMN exam_id TYPE text;
ALTER TABLE public.import_sessions ALTER COLUMN exam_id TYPE text;
ALTER TABLE public.exam_configs ALTER COLUMN exam_id TYPE text;
ALTER TABLE public.exam_configs ALTER COLUMN exam_selection TYPE text;
ALTER TABLE public.questions ALTER COLUMN exam_id TYPE text;
ALTER TABLE public.leaderboard ALTER COLUMN exam_id TYPE text;
ALTER TABLE public.daily_stats ALTER COLUMN exam_id TYPE text;
ALTER TABLE public.subject_performance ALTER COLUMN exam_id TYPE text;
ALTER TABLE public.exams ALTER COLUMN exam_id TYPE text;
ALTER TABLE public.questions_backup_phase6 ALTER COLUMN exam_id TYPE text;
ALTER TABLE public.attempts ALTER COLUMN exam_id TYPE text;
ALTER TABLE public.exam_papers ALTER COLUMN exam_id TYPE text;
ALTER TABLE public.exam_versions ALTER COLUMN exam_id TYPE text;
ALTER TABLE public.exam_subjects ALTER COLUMN exam_id TYPE text;
ALTER TABLE public.users ALTER COLUMN exam_selection TYPE text;
ALTER TABLE public.prepare_sessions ALTER COLUMN exam_id TYPE text;

-- Step 6: Re-create foreign key constraints
ALTER TABLE public.exam_versions ADD CONSTRAINT exam_versions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
ALTER TABLE public.exam_papers ADD CONSTRAINT exam_papers_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
ALTER TABLE public.exam_subjects ADD CONSTRAINT exam_subjects_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
ALTER TABLE public.import_sessions ADD CONSTRAINT import_sessions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
ALTER TABLE public.questions ADD CONSTRAINT questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
ALTER TABLE public.question_upload_prompts ADD CONSTRAINT question_upload_prompts_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
ALTER TABLE public.leaderboard ADD CONSTRAINT leaderboard_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
ALTER TABLE public.daily_stats ADD CONSTRAINT daily_stats_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
ALTER TABLE public.subject_performance ADD CONSTRAINT subject_performance_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
ALTER TABLE public.prepare_sessions ADD CONSTRAINT prepare_sessions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
ALTER TABLE public.attempts ADD CONSTRAINT fk_attempts_exam FOREIGN KEY (exam_id) REFERENCES public.exams(exam_id);
ALTER TABLE public.leaderboard ADD CONSTRAINT fk_leaderboard_exam FOREIGN KEY (exam_id) REFERENCES public.exams(exam_id);

-- Step 6.5: Re-create RLS policies
CREATE POLICY exam_versions_select ON public.exam_versions FOR SELECT
USING (
  is_admin() 
  OR is_sub_admin() 
  OR EXISTS (
    SELECT 1 FROM public.exam_configs 
    WHERE exam_configs.exam_id = exam_versions.exam_id 
      AND exam_configs.is_published = true
  )
);

-- Step 7: Re-create materialized views
CREATE MATERIALIZED VIEW public.daily_attempts_stats AS
 SELECT (created_at)::date AS date,
    exam_id,
    count(*) AS total_attempts
   FROM public.attempts
  WHERE (source = 'exam_tab'::public.attempt_source)
  GROUP BY ((created_at)::date), exam_id;

CREATE MATERIALIZED VIEW public.exam_distribution AS
 SELECT exam_id,
    count(*) AS total
   FROM public.attempts
  WHERE ((source = 'exam_tab'::public.attempt_source) AND (exam_id IS NOT NULL))
  GROUP BY exam_id;

CREATE MATERIALIZED VIEW public.admin_leaderboard_view AS
 SELECT a.user_id,
    u.full_name AS user_name,
    a.exam_id,
    ec.exam_selection,
    max(a.score) AS best_score,
    max(a.accuracy) AS best_accuracy,
    min(a.duration_seconds) AS best_time_secs,
    max(a.submitted_at) AS last_attempt_date,
    count(a.id) AS total_attempts
   FROM ((public.attempts a
     JOIN public.users u ON ((a.user_id = u.id)))
     JOIN public.exam_configs ec ON ((a.exam_id = ec.exam_id)))
  WHERE ((a.source = 'exam_tab'::public.attempt_source) AND (a.status = 'completed'::public.attempt_status))
  GROUP BY a.user_id, u.full_name, a.exam_id, ec.exam_selection;

-- Step 8: Refresh the newly created materialized views
REFRESH MATERIALIZED VIEW public.daily_attempts_stats;
REFRESH MATERIALIZED VIEW public.exam_distribution;
REFRESH MATERIALIZED VIEW public.admin_leaderboard_view;

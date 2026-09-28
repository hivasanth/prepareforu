-- =============================================================================
-- P0-01b - Attempt answers must be scoped to the served snapshot
--
-- P0-01 made the snapshot server-authored, but it did not close the ANSWER path.
-- set_question_answer validated a question against the whole exam or the whole
-- paper instead of against the attempt's questions_snapshot; the snapshot branch
-- existed only in the final ELSE, which is unreachable because exam_id and/or
-- paper_id is always populated. The same "is this question anywhere in my
-- exam?" pattern was repeated in add_question_time, set_question_review and
-- touch_question_visit.
--
-- Proven live against the P0-01-fixed database: a 2-question subject test
-- accepted 6 answers for questions that were never served (3 from the same
-- subject, 3 from a different subject), and submit_attempt returned
--   score 9.00, total_marks 2.00, correct_count 6, accuracy 100%
-- i.e. a score 4.5x the maximum possible for the set actually served.
--
-- This migration introduces ONE canonical membership predicate and routes every
-- answer/visit/review write and the final grading aggregation through it.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. The canonical predicate: "was this question actually served to this
--    attempt?". One implementation, used by every caller, so the rule cannot
--    drift between entry points again.
--
--    Snapshot identity is COALESCE(id, question_id), matching the projection
--    written by _pf_write_attempt_snapshot and read back by
--    get_content_review_questions. For teacher exams the identity is
--    teacher_exam_questions.id; for content exams it is questions.id. Neither
--    is FK-constrained to the other, and both are uuid v4, so the union is
--    unambiguous.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._pf_attempt_serves_question(
    p_attempt_id uuid,
    p_question_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
          FROM public.attempts a
          CROSS JOIN LATERAL jsonb_array_elements(
                 CASE WHEN jsonb_typeof(a.questions_snapshot) = 'array'
                      THEN a.questions_snapshot
                      ELSE '[]'::jsonb
                 END) AS e(value)
         WHERE a.id = p_attempt_id
           AND COALESCE(NULLIF(e.value->>'id', ''),
                        NULLIF(e.value->>'question_id', ''))::uuid = p_question_id
    );
$$;

REVOKE ALL ON FUNCTION public._pf_attempt_serves_question(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._pf_attempt_serves_question(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public._pf_attempt_serves_question(uuid, uuid) FROM authenticated;

-- -----------------------------------------------------------------------------
-- 2. set_question_answer - the scoring write. Provenance is now the snapshot.
--    Everything else (ownership, in-progress, abandoned, deadline, authoritative
--    marks, negative marking, no persisted answer key) is preserved.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_question_answer(
    p_attempt_id uuid,
    p_question_id uuid,
    p_selected_option text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_attempt record;
    v_marks numeric;
    v_neg numeric;
    v_authoritative_correct text;
    v_is_correct boolean;
    v_marks_awarded numeric;
BEGIN
    -- Ownership guard.
    SELECT * INTO v_attempt FROM public.attempts
     WHERE id = p_attempt_id AND user_id = auth.uid();
    IF v_attempt.id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;
    IF v_attempt.status <> 'in_progress' THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_IN_PROGRESS';
    END IF;
    IF v_attempt.abandoned THEN
        RAISE EXCEPTION 'ATTEMPT_EXPIRED: attempt was closed';
    END IF;

    -- F-04: no answer may be written after the server-side deadline.
    IF public._pf_attempt_deadline(p_attempt_id) IS NOT NULL
       AND now() > public._pf_attempt_deadline(p_attempt_id) THEN
        RAISE EXCEPTION 'ATTEMPT_EXPIRED: the allocated time has elapsed';
    END IF;

    -- THE fix: membership is decided by the server-selected set only. Being
    -- somewhere in the same exam or paper is NOT sufficient.
    IF NOT public._pf_attempt_serves_question(p_attempt_id, p_question_id) THEN
        RAISE EXCEPTION 'QUESTION_NOT_IN_ATTEMPT: question was not served to this attempt';
    END IF;

    -- The answer key is resolved from the authoritative source for this attempt
    -- type and is never persisted to attempt_answers.
    IF v_attempt.teacher_exam_id IS NOT NULL THEN
        SELECT correct_option INTO v_authoritative_correct
          FROM public.teacher_exam_questions
         WHERE id = p_question_id
           AND teacher_exam_id = v_attempt.teacher_exam_id;
    ELSE
        SELECT correct_option INTO v_authoritative_correct
          FROM public.questions
         WHERE id = p_question_id;
    END IF;

    IF v_authoritative_correct IS NULL THEN
        RAISE EXCEPTION 'QUESTION_NOT_IN_ATTEMPT: question is no longer answerable';
    END IF;

    -- R-2: authoritative marks + negative (client-supplied values ignored).
    SELECT m.marks, m.neg INTO v_marks, v_neg
      FROM public._pf_marks_for_question(p_question_id) m;

    v_is_correct := (p_selected_option IS NOT NULL
                     AND p_selected_option = v_authoritative_correct);
    v_marks := COALESCE(v_marks, 1);
    v_neg   := COALESCE(v_neg, 0);
    v_marks_awarded := CASE
        WHEN p_selected_option IS NULL THEN 0
        WHEN v_is_correct THEN v_marks
        WHEN v_neg > 0 THEN -v_neg
        ELSE 0
    END;

    INSERT INTO public.attempt_answers (
        attempt_id, question_id, selected_option,
        is_correct, marks_awarded
    ) VALUES (
        p_attempt_id, p_question_id, p_selected_option,
        CASE WHEN p_selected_option IS NULL THEN NULL ELSE v_is_correct END,
        v_marks_awarded
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        selected_option = EXCLUDED.selected_option,
        is_correct      = EXCLUDED.is_correct,
        marks_awarded   = EXCLUDED.marks_awarded;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Visit / time / review markers - same rule, so no attempt_answers row can
--    ever exist for a question that was not served. These are not scoring
--    columns, but they are the same table and the same unvalidated-entry-point
--    pattern; leaving them open would re-open the hole on the next change.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_question_visit(p_attempt_id uuid, p_question_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_attempt record;
BEGIN
    SELECT id, teacher_exam_id INTO v_attempt
      FROM public.attempts
     WHERE id = p_attempt_id AND user_id = auth.uid();
    IF v_attempt.id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;
    IF NOT public._pf_attempt_serves_question(p_attempt_id, p_question_id) THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
    END IF;

    INSERT INTO public.attempt_answers (
        attempt_id, question_id,
        selected_option, is_correct, marks_awarded,
        time_spent_secs, marked_for_review,
        visited, last_visited_at
    ) VALUES (
        p_attempt_id, p_question_id,
        NULL, NULL, 0,
        0, false,
        true, now()
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        visited = true,
        last_visited_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.add_question_time(
    p_attempt_id uuid, p_question_id uuid, p_seconds integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_attempt record;
BEGIN
    SELECT id, teacher_exam_id INTO v_attempt
      FROM public.attempts
     WHERE id = p_attempt_id AND user_id = auth.uid();
    IF v_attempt.id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;
    IF NOT public._pf_attempt_serves_question(p_attempt_id, p_question_id) THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
    END IF;

    INSERT INTO public.attempt_answers (
        attempt_id, question_id, time_spent_secs
    ) VALUES (
        p_attempt_id, p_question_id, p_seconds
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        time_spent_secs = public.attempt_answers.time_spent_secs + EXCLUDED.time_spent_secs;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_question_review(
    p_attempt_id uuid, p_question_id uuid, p_marked boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_attempt record;
BEGIN
    SELECT id, teacher_exam_id INTO v_attempt
      FROM public.attempts
     WHERE id = p_attempt_id AND user_id = auth.uid();
    IF v_attempt.id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;
    IF NOT public._pf_attempt_serves_question(p_attempt_id, p_question_id) THEN
        RAISE EXCEPTION 'QUESTION_NOT_FOUND: %', p_question_id;
    END IF;

    INSERT INTO public.attempt_answers (
        attempt_id, question_id, marked_for_review
    ) VALUES (
        p_attempt_id, p_question_id, p_marked
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        marked_for_review = EXCLUDED.marked_for_review;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. update_attempt_answers_cache - the resume cache.
--
--    It previously stored the client's JSON verbatim, so a caller could write
--    arbitrary keys (and could keep rewriting them after submission, because
--    there was no status guard at all). Nothing scores off this column, but it
--    is a client-controlled blob on a security-relevant row, so it is now
--    filtered to served questions and frozen once the attempt is closed. The
--    feature itself - restoring selected answers on resume - is unchanged.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_attempt_answers_cache(
    p_attempt_id uuid,
    p_answers_json jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_owner uuid;
    v_status text;
    v_abandoned boolean;
    v_deadline timestamptz;
BEGIN
    SELECT user_id, status, abandoned INTO v_owner, v_status, v_abandoned
      FROM public.attempts WHERE id = p_attempt_id;
    IF v_owner IS NULL THEN
        RAISE EXCEPTION 'Attempt not found';
    END IF;
    IF v_owner <> auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    IF v_status <> 'in_progress' OR v_abandoned THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_IN_PROGRESS';
    END IF;
    v_deadline := public._pf_attempt_deadline(p_attempt_id);
    IF v_deadline IS NOT NULL AND now() > v_deadline THEN
        RAISE EXCEPTION 'ATTEMPT_EXPIRED: the allocated time has elapsed';
    END IF;

    UPDATE public.attempts
       SET answers_json = (
             SELECT COALESCE(jsonb_object_agg(kv.key, kv.value), '{}'::jsonb)
               FROM jsonb_each(CASE WHEN jsonb_typeof(p_answers_json) = 'object'
                                    THEN p_answers_json ELSE '{}'::jsonb END) AS kv(key, value)
              WHERE public._pf_attempt_serves_question(p_attempt_id, kv.key::uuid)
           )
     WHERE id = p_attempt_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. submit_attempt - defence in depth.
--
--    The aggregation now counts only attempt_answers rows whose question was
--    actually served. Even if a future write path reintroduced a stray row, it
--    cannot inflate the score, and the total can no longer exceed the marks
--    available in the served set.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_attempt(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_user_id uuid;
    v_exam_id text;
    v_paper_id uuid;
    v_teacher_exam_id uuid;
    v_source public.attempt_source;
    v_total_marks numeric;
    v_authoritative_total numeric;
    v_total_correct int;
    v_total_wrong int;
    v_total_skipped int;
    v_score numeric;
    v_accuracy numeric;
    v_duration int;
    v_submitted_at timestamptz;
    v_existing_status text;
    v_result jsonb;
    v_total_questions int;
    v_deadline timestamptz;
BEGIN
    -- Ownership guard (precedes idempotency -- no cross-user leak).
    IF NOT EXISTS (SELECT 1 FROM public.attempts
                    WHERE id = p_attempt_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    SELECT status, user_id, exam_id, paper_id, teacher_exam_id, source, total_marks, score,
           correct_count, wrong_count, skipped_count, accuracy, duration_seconds
      INTO v_existing_status, v_user_id, v_exam_id, v_paper_id, v_teacher_exam_id,
            v_source, v_total_marks, v_score, v_total_correct, v_total_wrong,
            v_total_skipped, v_accuracy, v_duration
      FROM public.attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt NOT FOUND with ID: %', p_attempt_id;
    END IF;

    IF v_existing_status = 'completed' THEN
        RETURN jsonb_build_object(
            'score', ROUND(v_score, 2), 'total_marks', v_total_marks,
            'correct_count', v_total_correct, 'wrong_count', v_total_wrong,
            'skipped_count', v_total_skipped, 'accuracy', ROUND(v_accuracy, 2),
            'idempotent', true
        );
    END IF;

    -- Total questions from the snapshot.
    SELECT COALESCE(jsonb_array_length(questions_snapshot), 0)
      INTO v_total_questions FROM public.attempts WHERE id = p_attempt_id;

    -- Cumulative score from recorded answers, restricted to the served set.
    SELECT COUNT(*) FILTER (WHERE aa.is_correct = TRUE),
           COUNT(*) FILTER (WHERE aa.is_correct = FALSE),
           COALESCE(SUM(aa.marks_awarded), 0)
      INTO v_total_correct, v_total_wrong, v_score
      FROM public.attempt_answers aa
     WHERE aa.attempt_id = p_attempt_id
       AND public._pf_attempt_serves_question(p_attempt_id, aa.question_id);

    v_total_skipped := GREATEST(0, v_total_questions - v_total_correct - v_total_wrong);

    -- F-12: graded tests must not be completable with zero recorded answers.
    IF (v_total_correct + v_total_wrong) = 0
       AND v_total_questions > 0
       AND v_source IN ('subject_test'::public.attempt_source,
                        'topic_exam'::public.attempt_source,
                        'prepare_write'::public.attempt_source) THEN
        RAISE EXCEPTION 'NO_ANSWERS_SUBMITTED: empty submissions are not allowed for graded tests';
    END IF;

    IF (v_total_correct + v_total_wrong) > 0 THEN
        v_accuracy := (v_total_correct::numeric / (v_total_correct + v_total_wrong)::numeric) * 100;
    ELSE
        v_accuracy := 0;
    END IF;

    -- R-4b: authoritative denominator = sum of authoritative per-question marks
    -- over the questions actually in the snapshot.
    SELECT COALESCE(sum(m.marks), 0)
      INTO v_authoritative_total
      FROM (
        SELECT (m).marks::numeric AS marks
          FROM public.attempts a
          CROSS JOIN LATERAL jsonb_array_elements(
                 CASE WHEN jsonb_typeof(a.questions_snapshot) = 'array'
                      THEN a.questions_snapshot ELSE '[]'::jsonb END) AS q
          CROSS JOIN LATERAL public._pf_marks_for_question(
                       COALESCE(NULLIF(q.value->>'id',''),
                                NULLIF(q.value->>'question_id',''))::uuid
                   ) AS m
         WHERE a.id = p_attempt_id
           AND NOT (m).is_teacher
      ) m;

    IF v_authoritative_total IS NULL OR v_authoritative_total = 0 THEN
        v_authoritative_total := v_total_marks;
    END IF;

    v_submitted_at := now();
    v_duration := COALESCE(
        EXTRACT(EPOCH FROM (v_submitted_at - (SELECT started_at FROM public.attempts WHERE id = p_attempt_id)))::int,
        0
    );

    -- F-04: a late finalize is allowed, but the recorded duration must never
    -- exceed the allotted window.
    v_deadline := public._pf_attempt_deadline(p_attempt_id);
    IF v_deadline IS NOT NULL THEN
        v_duration := LEAST(v_duration, GREATEST(
            EXTRACT(EPOCH FROM (v_deadline - (SELECT started_at FROM public.attempts WHERE id = p_attempt_id)))::int,
            0
        ));
    END IF;

    UPDATE public.attempts
       SET status = 'completed', submitted_at = v_submitted_at,
           score = v_score, total_marks = COALESCE(v_authoritative_total, v_total_marks, 0),
           correct_count = v_total_correct, wrong_count = v_total_wrong,
           skipped_count = v_total_skipped, accuracy = ROUND(v_accuracy, 2),
           duration_seconds = v_duration
     WHERE id = p_attempt_id;

    -- Leaderboard (best performance) -- unchanged behavior.
    IF v_exam_id IS NOT NULL AND v_paper_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.exams WHERE exam_id = v_exam_id AND exam_type = 'main') THEN
            INSERT INTO public.leaderboard (
                user_id, exam_id, paper_id, best_score, best_accuracy, best_time_secs,
                best_submitted_at, attempt_count, updated_at
            ) VALUES (
                v_user_id, v_exam_id, v_paper_id, v_score, ROUND(v_accuracy, 2),
                v_duration, v_submitted_at, 1, now()
            )
            ON CONFLICT (user_id, exam_id, paper_id) DO UPDATE SET
                best_score = CASE WHEN EXCLUDED.best_score > leaderboard.best_score
                                  THEN EXCLUDED.best_score ELSE leaderboard.best_score END,
                best_accuracy = CASE WHEN EXCLUDED.best_score > leaderboard.best_score
                                     THEN EXCLUDED.best_accuracy ELSE leaderboard.best_accuracy END,
                best_time_secs = CASE WHEN EXCLUDED.best_score > leaderboard.best_score
                                      THEN EXCLUDED.best_time_secs ELSE leaderboard.best_time_secs END,
                best_submitted_at = CASE WHEN EXCLUDED.best_score > leaderboard.best_score
                                         THEN EXCLUDED.best_submitted_at ELSE leaderboard.best_submitted_at END,
                attempt_count = leaderboard.attempt_count + 1,
                updated_at = now();
        END IF;
    END IF;

    v_result := jsonb_build_object(
        'score', ROUND(v_score, 2), 'total_marks', COALESCE(v_authoritative_total, v_total_marks, 0),
        'correct_count', v_total_correct, 'wrong_count', v_total_wrong,
        'skipped_count', v_total_skipped, 'accuracy', ROUND(v_accuracy, 2),
        'idempotent', false
    );
    RETURN v_result;
END;
$$;

-- -----------------------------------------------------------------------------
-- 6. Existing attempts written before this fix may contain stray answers_json
--    keys and stray attempt_answers rows. Purge the unserved answer rows so no
--    historical attempt can report inflated marks, and trim the resume caches.
--    Rows that survive are exactly the served, answerable questions.
-- -----------------------------------------------------------------------------
DELETE FROM public.attempt_answers aa
 WHERE NOT public._pf_attempt_serves_question(aa.attempt_id, aa.question_id);

UPDATE public.attempts a
   SET answers_json = (
         SELECT COALESCE(jsonb_object_agg(kv.key, kv.value), '{}'::jsonb)
           FROM jsonb_each(CASE WHEN jsonb_typeof(a.answers_json) = 'object'
                                THEN a.answers_json ELSE '{}'::jsonb END) AS kv(key, value)
          WHERE public._pf_attempt_serves_question(a.id, kv.key::uuid)
       )
 WHERE jsonb_typeof(a.answers_json) = 'object';

NOTIFY pgrst, 'reload schema';

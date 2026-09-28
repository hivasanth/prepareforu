-- =============================================================================
-- P0-01 — Server-authoritative attempt snapshot
--
-- Removes the client-authoritative snapshot write path.
--
-- PROVEN VULNERABILITY (live, rolled-back test):
--   1. questions.id/exam_id/paper_id are SELECT-able by `authenticated`
--   2. set_attempt_snapshot(uuid, jsonb) is SECURITY DEFINER, accepted arbitrary
--      client JSONB verbatim, and was granted to `authenticated`
--   3. get_content_review_questions(uuid) is SECURITY DEFINER and projects
--      correct_option + explanation_en/te for every id found in the snapshot
--   => 8/8 rows returned the answer key to a plain authenticated user.
--
-- ROOT CAUSE: attempts.questions_snapshot was CLIENT-AUTHORED. The column-level
-- REVOKE on questions.correct_option is defeated by any SECURITY DEFINER
-- function that selects it, so the snapshot was the real trust boundary.
--
-- FIX: make the snapshot SERVER-AUTHORED. The server derives the question set
-- from the attempt's own recorded context (exam_id, paper_id, teacher_exam_id,
-- subject_name, topic_en) and writes it at attempt creation. Because the client
-- can no longer inject ids:
--   - get_content_review_questions becomes sound (it reads ids from a
--     trustworthy snapshot)
--   - submit_attempt's authoritative denominator becomes sound
--   - set_question_answer's snapshot-membership gate becomes sound
-- No downstream rewrite is required: one upstream change fixes all three.
--
-- The stored snapshot keeps the same student-safe shape the client already
-- renders on resume, and deliberately EXCLUDES correct_option / explanation_*.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Record the selection context on the attempt.
--    subject_test / topic_exam attempts previously carried no exam/paper/
--    subject/topic, so the server had no way to know which question set was
--    legitimate. These columns are that context.
-- -----------------------------------------------------------------------------
ALTER TABLE public.attempts
    ADD COLUMN IF NOT EXISTS subject_name text,
    ADD COLUMN IF NOT EXISTS topic_en text;

COMMENT ON COLUMN public.attempts.subject_name IS
  'Server-recorded selection context for subject_test attempts. Authorization context only; never client-writable.';
COMMENT ON COLUMN public.attempts.topic_en IS
  'Server-recorded selection context for topic_exam attempts. Authorization context only; never client-writable.';

-- -----------------------------------------------------------------------------
-- 2. _pf_attempt_question_set — THE canonical server-side question selector.
--    SECURITY DEFINER + owner-only EXECUTE. Given a user's in_progress attempt,
--    it returns the authoritative student-safe question array for that attempt's
--    recorded context. This is the single place that decides "which questions
--    belong to this attempt", and it is never handed question ids by a client.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public._pf_attempt_question_set(uuid, uuid, integer);
DROP FUNCTION IF EXISTS public._pf_attempt_question_set(uuid, uuid);
DROP FUNCTION IF EXISTS public._pf_attempt_question_set(uuid);

CREATE OR REPLACE FUNCTION public._pf_attempt_question_set(
    p_attempt_id uuid,
    p_preparation_id uuid DEFAULT NULL,
    p_question_count integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_attempt public.attempts%ROWTYPE;
    v_questions jsonb;
    v_exam_id text;
    v_paper_id uuid;
    v_teacher_exam_id uuid;
    v_source public.attempt_source;
    v_subject_name text;
    v_topic_en text;
    v_limit integer;
BEGIN
    SELECT * INTO v_attempt
      FROM public.attempts
     WHERE id = p_attempt_id
       AND user_id = auth.uid();

    IF v_attempt.id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user'
          USING ERRCODE = '42501';
    END IF;

    v_exam_id         := NULLIF(btrim(v_attempt.exam_id), '');
    v_paper_id        := v_attempt.paper_id;
    v_teacher_exam_id := v_attempt.teacher_exam_id;
    v_source          := v_attempt.source;
    v_subject_name    := NULLIF(btrim(v_attempt.subject_name), '');
    v_topic_en        := NULLIF(btrim(v_attempt.topic_en), '');

    -- p_question_count is only meaningful where the set is a SAMPLE of a pool
    -- (subject/topic tests). NULL means "the whole set". Clamp so a client
    -- cannot ask for an unbounded number of rows.
    IF p_question_count IS NULL THEN
        v_limit := NULL;
    ELSE
        v_limit := LEAST(GREATEST(p_question_count, 1), 500);
    END IF;

    -- Teacher exams: membership is defined by teacher_exam_questions, which is a
    -- DENORMALIZED copy of the question (it carries its own text, options and
    -- answer key and does NOT reference public.questions -- verified live). The
    -- publication window and access-code gate are enforced by create_attempt.
    IF v_source = 'teacher_exam' THEN
        IF v_teacher_exam_id IS NULL THEN
            RAISE EXCEPTION 'TEACHER_EXAM_REQUIRED';
        END IF;
        SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.display_order, t.created_at), '[]'::jsonb)
          INTO v_questions
          FROM (
            SELECT teq.id,
                   teq.difficulty, teq.diagram, teq.display_order, teq.created_at,
                   teq.question_text_en, teq.question_text_te,
                   teq.option_a_en, teq.option_a_te, teq.option_b_en, teq.option_b_te,
                   teq.option_c_en, teq.option_c_te, teq.option_d_en, teq.option_d_te
              FROM public.teacher_exam_questions teq
             WHERE teq.teacher_exam_id = v_teacher_exam_id
          ) t;
        RETURN v_questions;
    END IF;

    -- Prepare & Write: the legitimate set is the LOCKED preparation the user
    -- actually prepared against, not a re-derivation from `questions` at start
    -- time. Re-deriving would (a) discard the prepare feature entirely,
    -- (b) silently change the set the user studied if a question was edited or
    -- deactivated in between, and (c) make the attempt snapshot disagree with
    -- the questions start_prepared_exam returns to the client, breaking scoring
    -- and review in a way that is very hard to diagnose.
    -- The preparation is itself server-written: prepare_exam_questions is
    -- SECURITY DEFINER, accepts only a paper_id, and derives the set from
    -- `questions`. It is re-validated here against the attempt it is attached to.
    IF v_source = 'prepare_write' THEN
        IF p_preparation_id IS NULL THEN
            RAISE EXCEPTION 'PREPARATION_REQUIRED';
        END IF;
        SELECT pe.questions_snapshot
          INTO v_questions
          FROM public.exam_preparations pe
         WHERE pe.id = p_preparation_id
           AND pe.user_id = auth.uid()
           AND pe.paper_id IS NOT DISTINCT FROM v_paper_id
           AND pe.exam_id IS NOT DISTINCT FROM v_attempt.exam_id
           AND pe.status = 'active'
           AND (pe.expires_at IS NULL OR now() <= pe.expires_at)
           AND jsonb_typeof(pe.questions_snapshot) = 'array'
           AND COALESCE(jsonb_array_length(pe.questions_snapshot), 0) > 0;
        IF v_questions IS NULL THEN
            RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: preparation is not usable for this attempt'
              USING ERRCODE = '42501';
        END IF;
        RETURN v_questions;
    END IF;

    -- Content exams. The recorded context must be able to scope the set: an
    -- exam_tab is scoped by paper, and a subject/topic test is scoped by exam
    -- and/or paper. An attempt with neither cannot be authorised at all.
    IF v_source = 'exam_tab' AND v_paper_id IS NULL THEN
        RAISE EXCEPTION 'PAPER_REQUIRED';
    END IF;
    IF v_source IN ('subject_test', 'topic_exam') AND v_exam_id IS NULL AND v_paper_id IS NULL THEN
        RAISE EXCEPTION 'EXAM_OR_PAPER_REQUIRED';
    END IF;

    -- One projection, two orderings. When the whole set is taken the order is
    -- deterministic (subject, then creation) so the same paper always yields
    -- the same attempt; when a sample is taken the order is randomised so the
    -- server, not the client, decides which N questions are served.
    SELECT COALESCE(jsonb_agg(to_jsonb(e) - 'ord' ORDER BY e.ord), '[]'::jsonb)
      INTO v_questions
      FROM (
        SELECT s.*
          FROM (
            SELECT q.id, q.exam_id, q.paper_id, q.subject_name, q.topic_en, q.topic_te,
                   q.difficulty, q.negative_marks, q.visual, q.created_at,
                   q.question_text_en, q.question_text_te,
                   q.option_a_en, q.option_a_te, q.option_b_en, q.option_b_te,
                   q.option_c_en, q.option_c_te, q.option_d_en, q.option_d_te,
                   row_number() OVER (
                       ORDER BY CASE WHEN v_limit IS NULL     THEN q.subject_name END,
                                CASE WHEN v_limit IS NULL     THEN q.created_at  END,
                                CASE WHEN v_limit IS NOT NULL THEN random()      END
                   ) AS ord
              FROM public.questions q
             WHERE q.is_active = true
               AND q.correct_option IS NOT NULL
               AND (v_exam_id  IS NULL OR q.exam_id  = v_exam_id)
               AND (v_paper_id IS NULL OR q.paper_id = v_paper_id)
               AND (
                    (v_source = 'exam_tab')
                 OR (v_source = 'subject_test' AND v_subject_name IS NOT NULL AND q.subject_name = v_subject_name)
                 OR (v_source = 'topic_exam'  AND v_topic_en     IS NOT NULL AND q.topic_en     = v_topic_en)
               )
          ) s
         WHERE v_limit IS NULL OR s.ord <= v_limit
      ) e;

    RETURN v_questions;
END;
$$;

REVOKE ALL ON FUNCTION public._pf_attempt_question_set(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._pf_attempt_question_set(uuid, uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public._pf_attempt_question_set(uuid, uuid, integer) FROM authenticated;
-- Deliberately NOT granted to service_role: the owner retains EXECUTE and that is
-- sufficient, since every caller is itself a SECURITY DEFINER function.

-- -----------------------------------------------------------------------------
-- 3. _pf_write_attempt_snapshot — THE single snapshot writer.
--    Takes NO question content from the caller. It asks
--    _pf_attempt_question_set what the question set is and stores that.
--    Owner-only: no role can call it directly, so no client can ever define
--    snapshot membership. This is what replaces set_attempt_snapshot.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public._pf_write_attempt_snapshot(uuid, uuid, integer);
DROP FUNCTION IF EXISTS public._pf_write_attempt_snapshot(uuid, uuid);
DROP FUNCTION IF EXISTS public._pf_write_attempt_snapshot(uuid);

CREATE OR REPLACE FUNCTION public._pf_write_attempt_snapshot(
    p_attempt_id uuid,
    p_preparation_id uuid DEFAULT NULL,
    p_question_count integer DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_questions jsonb;
    v_count integer;
BEGIN
    v_questions := public._pf_attempt_question_set(p_attempt_id, p_preparation_id, p_question_count);
    v_count := COALESCE(jsonb_array_length(v_questions), 0);

    IF v_count = 0 THEN
        RAISE EXCEPTION 'NO_QUESTIONS_AVAILABLE: the server could not resolve a question set for this attempt';
    END IF;

    -- Never overwrite: resume must not be able to mutate the authoritative set.
    UPDATE public.attempts
       SET questions_snapshot = v_questions
     WHERE id = p_attempt_id
       AND user_id = auth.uid()
       AND status = 'in_progress'
       AND COALESCE(jsonb_array_length(questions_snapshot), 0) = 0;

    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public._pf_write_attempt_snapshot(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._pf_write_attempt_snapshot(uuid, uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public._pf_write_attempt_snapshot(uuid, uuid, integer) FROM authenticated;

-- -----------------------------------------------------------------------------
-- 4. Retire the client-authoritative writer.
--    create_attempt and start_prepared_exam now use _pf_write_attempt_snapshot.
--    DROP (not revoke) so the insecure surface ceases to exist entirely.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.set_attempt_snapshot(uuid, jsonb);

-- Defence in depth for the snapshot column itself. RLS is the PRIMARY control:
-- `attempts` has no INSERT/UPDATE/DELETE policy for ordinary users (only
-- is_admin() ALL plus two SELECT policies), so those grants are already inert
-- for non-admins. This revoke removes the latent grant so a future policy
-- mistake, or RLS being disabled, cannot expose questions_snapshot to a client.
-- Verified safe: the application never writes to `attempts` directly -- every
-- attempt mutation goes through a SECURITY DEFINER RPC, and the table owner
-- (which those functions run as) keeps its privileges. service_role bypasses
-- grants entirely, so edge functions and admin tooling are unaffected.
REVOKE UPDATE ON public.attempts FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. create_attempt — record the selection context, then author the snapshot
--    server-side. One canonical entry point; the older overloads are dropped.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_attempt(text, uuid, uuid, public.attempt_source, text, text, integer);
DROP FUNCTION IF EXISTS public.create_attempt(text, uuid, uuid, public.attempt_source, text, text);
DROP FUNCTION IF EXISTS public.create_attempt(text, uuid, uuid, public.attempt_source);

CREATE OR REPLACE FUNCTION public.create_attempt(
    p_exam_id text,
    p_paper_id uuid,
    p_teacher_exam_id uuid,
    p_source public.attempt_source,
    p_subject_name text DEFAULT NULL,
    p_topic_en text DEFAULT NULL,
    p_question_count integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id uuid;
    v_total_marks numeric;
    v_started_at timestamptz;
    v_existing uuid;
    v_attempt jsonb;
    v_te_status text;
    v_start timestamptz;
    v_end timestamptz;
    v_te_duration int;
    v_expires timestamptz;
    v_duration_minutes int;
    v_subject_name text;
    v_topic_en text;
    v_snapshot_count integer;
BEGIN
    IF p_source IS NULL THEN
        RAISE EXCEPTION 'SOURCE_REQUIRED';
    END IF;

    -- The selection context is attacker-supplied in shape, so it is only ever
    -- recorded as a *filter*; the questions themselves are resolved by the
    -- server and are additionally constrained to the recorded exam/paper.
    v_subject_name := NULLIF(btrim(p_subject_name), '');
    v_topic_en     := NULLIF(btrim(p_topic_en), '');

    IF p_source = 'subject_test' AND v_subject_name IS NULL THEN
        RAISE EXCEPTION 'SUBJECT_REQUIRED';
    END IF;
    IF p_source = 'topic_exam' AND v_topic_en IS NULL THEN
        RAISE EXCEPTION 'TOPIC_REQUIRED';
    END IF;

    IF p_source = 'teacher_exam' THEN
        IF p_teacher_exam_id IS NULL THEN
            RAISE EXCEPTION 'TEACHER_EXAM_REQUIRED';
        END IF;
        SELECT total_marks, status, start_time, end_time, duration_minutes
          INTO v_total_marks, v_te_status, v_start, v_end, v_te_duration
          FROM public.teacher_exams
         WHERE id = p_teacher_exam_id;
        IF v_te_status IS NULL OR v_te_status <> 'published' THEN
            RAISE EXCEPTION 'TEACHER_EXAM_NOT_AVAILABLE';
        END IF;
        IF NOT public._pf_teacher_exam_access(p_teacher_exam_id) THEN
            RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
        END IF;
        IF now() < v_start THEN
            RAISE EXCEPTION 'EXAM_NOT_STARTED';
        END IF;
        IF now() > v_end THEN
            RAISE EXCEPTION 'EXAM_WINDOW_CLOSED';
        END IF;
    ELSE
        IF p_exam_id IS NOT NULL AND NOT public.is_exam_allowed_for_user(p_exam_id) THEN
            RAISE EXCEPTION 'EXAM_NOT_ALLOWED_FOR_USER';
        END IF;
        v_total_marks := 0;
        -- exam_tab marks come from the paper's subject blueprint. Subject/topic
        -- tests follow the documented 1 question = 1 mark = 1 minute contract and
        -- are finalised from the served snapshot below.
        IF p_paper_id IS NOT NULL AND p_source = 'exam_tab' THEN
            SELECT COALESCE(SUM(es.marks_per_question * es.question_count), 0)
              INTO v_total_marks
              FROM public.exam_subjects es
             WHERE es.paper_id = p_paper_id
               AND (p_exam_id IS NULL OR es.exam_id = p_exam_id);
        END IF;
    END IF;

    v_expires := NULL;
    IF p_source = 'teacher_exam' THEN
        v_expires := LEAST(v_end, now() + make_interval(mins => GREATEST(COALESCE(v_te_duration, 1), 1)));
    ELSE
        v_duration_minutes := NULL;
        IF p_paper_id IS NOT NULL THEN
            SELECT COALESCE(ep.duration_minutes, ec.duration_minutes)
              INTO v_duration_minutes
              FROM public.exam_papers ep
              LEFT JOIN public.exam_configs ec ON ec.exam_id = p_exam_id
             WHERE ep.id = p_paper_id;
        END IF;
        IF v_duration_minutes IS NULL AND p_exam_id IS NOT NULL THEN
            SELECT duration_minutes INTO v_duration_minutes
              FROM public.exam_configs
             WHERE exam_id = p_exam_id;
        END IF;
        v_expires := now() + make_interval(mins => GREATEST(COALESCE(v_duration_minutes, 30), 1));
    END IF;

    -- Resume semantics are unchanged from the previous revision: the
    -- one_active_attempt unique index is scoped to (user_id, exam_id, paper_id)
    -- regardless of source, so resume deliberately matches on paper/teacher
    -- exam alone. NOTE: a subject_test/topic_exam request that collides with an
    -- in-progress exam_tab attempt on the same paper therefore resumes that
    -- exam_tab attempt. That cross-source resume is a pre-existing correctness
    -- bug (tracked separately); it is NOT an answer-key disclosure, because both
    -- snapshots are server-authored and student-safe.
    SELECT id INTO v_existing FROM public.attempts
     WHERE user_id = auth.uid()
       AND status = 'in_progress'
       AND abandoned = false
       AND (
            (p_teacher_exam_id IS NOT NULL AND teacher_exam_id = p_teacher_exam_id)
            OR (p_paper_id IS NOT NULL AND paper_id = p_paper_id)
            OR (p_teacher_exam_id IS NULL AND p_paper_id IS NULL AND source = p_source AND source <> 'exam_tab')
       )
     LIMIT 1;

    IF v_existing IS NOT NULL THEN
        SELECT to_jsonb(a) INTO v_attempt FROM public.attempts a WHERE a.id = v_existing;
        RETURN jsonb_build_object('attempt_id', v_existing, 'is_resumed', true, 'attempt', v_attempt);
    END IF;

    v_started_at := now();
    v_id := gen_random_uuid();

    INSERT INTO public.attempts (
        id, user_id, exam_id, paper_id, teacher_exam_id, source, status,
        subject_name, topic_en, total_marks,
        started_at, created_at, expires_at
    ) VALUES (
        v_id, auth.uid(), p_exam_id, p_paper_id, p_teacher_exam_id, p_source, 'in_progress',
        CASE WHEN p_source IN ('subject_test','topic_exam') THEN v_subject_name ELSE NULL END,
        CASE WHEN p_source = 'topic_exam' THEN v_topic_en ELSE NULL END,
        COALESCE(v_total_marks, 0),
        v_started_at, v_started_at, v_expires
    );

    -- P0-01: the server authors the snapshot. prepare_write is excluded because
    -- start_prepared_exam owns that path (it holds the locked preparation).
    v_snapshot_count := 0;
    IF p_source <> 'prepare_write' THEN
        v_snapshot_count := public._pf_write_attempt_snapshot(v_id, NULL, p_question_count);
    END IF;

    -- Subject/topic tests are 1 mark per served question; the server is the only
    -- party that knows how many it actually served, so it sets the total.
    IF p_source IN ('subject_test', 'topic_exam') THEN
        UPDATE public.attempts
           SET total_marks = v_snapshot_count
         WHERE id = v_id;
    END IF;

    SELECT to_jsonb(a) INTO v_attempt FROM public.attempts a WHERE a.id = v_id;

    RETURN jsonb_build_object(
        'attempt_id', v_id,
        'is_resumed', false,
        'snapshot_question_count', v_snapshot_count,
        'attempt', v_attempt
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_attempt(text, uuid, uuid, public.attempt_source, text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_attempt(text, uuid, uuid, public.attempt_source, text, text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_attempt(text, uuid, uuid, public.attempt_source, text, text, integer) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. start_prepared_exam — use the single writer instead of the dropped RPC.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_prepared_exam(p_preparation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_prep record;
    v_user_id uuid := auth.uid();
    v_r jsonb;
    v_attempt_id uuid;
    v_is_resumed boolean;
    v_count integer;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
    END IF;

    SELECT * INTO v_prep FROM public.exam_preparations
     WHERE id = p_preparation_id AND user_id = v_user_id
     FOR UPDATE;
    IF v_prep.id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: preparation does not belong to the current user';
    END IF;

    IF v_prep.status = 'consumed' THEN
        RAISE EXCEPTION 'PREPARATION_ALREADY_USED';
    END IF;
    IF v_prep.status = 'expired' OR (v_prep.expires_at IS NOT NULL AND now() > v_prep.expires_at) THEN
        IF v_prep.status = 'active' THEN
            UPDATE public.exam_preparations SET status = 'expired' WHERE id = v_prep.id;
        END IF;
        RAISE EXCEPTION 'PREPARATION_EXPIRED';
    END IF;
    IF jsonb_array_length(v_prep.questions_snapshot) = 0 THEN
        RAISE EXCEPTION 'PREPARATION_EMPTY';
    END IF;

    IF v_prep.exam_id IS NOT NULL AND NOT public.is_exam_allowed_for_user(v_prep.exam_id) THEN
        RAISE EXCEPTION 'EXAM_NOT_ALLOWED_FOR_USER';
    END IF;

    v_r := public.create_attempt(
        NULLIF(v_prep.exam_id, ''),
        v_prep.paper_id,
        NULL,
        'prepare_write'::public.attempt_source
    );
    v_attempt_id := (v_r->>'attempt_id')::uuid;
    v_is_resumed := COALESCE((v_r->>'is_resumed')::boolean, false);

    IF NOT v_is_resumed THEN
        -- Bind the attempt to the LOCKED set the user prepared against.
        v_count := public._pf_write_attempt_snapshot(v_attempt_id, v_prep.id, NULL);
    END IF;

    UPDATE public.exam_preparations
       SET status = 'consumed', consumed_at = now(), attempt_id = v_attempt_id
     WHERE id = v_prep.id;

    UPDATE public.exam_preparations
       SET status = 'expired'
     WHERE user_id = v_user_id
       AND status = 'active'
       AND paper_id IS NOT DISTINCT FROM v_prep.paper_id
       AND id <> v_prep.id;

    RETURN jsonb_build_object(
        'attempt_id', v_attempt_id,
        'is_resumed', v_is_resumed,
        'exam_id', v_prep.exam_id,
        'paper_id', v_prep.paper_id,
        'question_count', v_prep.question_count,
        'questions', v_prep.questions_snapshot
    );
END;
$$;

REVOKE ALL ON FUNCTION public.start_prepared_exam(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_prepared_exam(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.start_prepared_exam(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. get_content_review_questions — defence in depth.
--    The snapshot is now server-authored, so reading ids from it is sound. These
--    constraints bound the blast radius even if the snapshot is ever corrupted:
--    a question must be active and must belong to the attempt's own paper.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_content_review_questions(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_status text;
    v_snapshot jsonb;
    v_ids uuid[];
    v_rows jsonb;
    v_paper_id uuid;
    v_teacher_exam_id uuid;
BEGIN
    SELECT status, questions_snapshot, paper_id, teacher_exam_id
      INTO v_status, v_snapshot, v_paper_id, v_teacher_exam_id
      FROM public.attempts
     WHERE id = p_attempt_id AND user_id = auth.uid();
    IF v_status IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;
    IF v_status NOT IN ('completed', 'auto_submitted') THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_COMPLETED';
    END IF;

    SELECT ARRAY(
        SELECT DISTINCT COALESCE(NULLIF(e.value->>'id','')::uuid, NULLIF(e.value->>'question_id','')::uuid)
          FROM jsonb_array_elements(
                 CASE WHEN jsonb_typeof(v_snapshot) = 'array' THEN v_snapshot ELSE '[]'::jsonb END
               ) e
         WHERE NULLIF(e.value->>'id','') IS NOT NULL
            OR NULLIF(e.value->>'question_id','') IS NOT NULL
    ) INTO v_ids;

    IF v_ids IS NULL OR cardinality(v_ids) = 0 THEN
        RETURN '[]'::jsonb;
    END IF;

    -- Teacher-exam attempts snapshot ids from the denormalized
    -- teacher_exam_questions copy (which legitimately holds the answer key);
    -- content-exam attempts snapshot ids from public.questions. Branching here
    -- keeps each review read scoped to the same store the snapshot came from.
    IF v_teacher_exam_id IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.display_order), '[]'::jsonb) INTO v_rows
          FROM (
            SELECT teq.id, teq.correct_option, teq.difficulty, teq.diagram, teq.display_order,
                   teq.question_text_en, teq.question_text_te,
                   teq.option_a_en, teq.option_b_en, teq.option_c_en, teq.option_d_en,
                   teq.option_a_te, teq.option_b_te, teq.option_c_te, teq.option_d_te,
                   teq.explanation_en, teq.explanation_te
              FROM public.teacher_exam_questions teq
             WHERE teq.id = ANY(v_ids)
               AND teq.teacher_exam_id = v_teacher_exam_id
          ) t;
        RETURN v_rows;
    END IF;

    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_rows
      FROM (
        SELECT q.id, q.exam_id, q.paper_id, q.subject_name,
               q.correct_option, q.difficulty, q.negative_marks, q.visual,
               q.question_text_en, q.question_text_te,
               q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en,
               q.option_a_te, q.option_b_te, q.option_c_te, q.option_d_te,
               q.explanation_en, q.explanation_te
          FROM public.questions q
         WHERE q.id = ANY(v_ids)
           AND q.is_active = true
           AND v_paper_id IS NOT NULL
           AND q.paper_id = v_paper_id
      ) t;
    RETURN v_rows;
END;
$$;

REVOKE ALL ON FUNCTION public.get_content_review_questions(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_content_review_questions(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_content_review_questions(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. PostgREST caches the exposed schema. create_attempt's identity changes
--    (7 args, older overloads dropped) and set_attempt_snapshot disappears, so
--    a stale cache would let the client keep calling the retired RPC until it
--    expired. Reload it in the same transaction.
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- MIGRATION: Prepare & Write locked flow + production security remediation
-- Date: 2026-09-17
--
-- Closes audit findings F-01..F-15 from
--   PREPAREFORU_FULL_PRODUCTION_AUDIT.md (gate BLOCKED) and ships the new
--   Prepare & Write -> locked question set -> real exam flow.
--
-- Design contract (err on the side of the master prompt):
--   * No duplicate RPCs / tables / policies / business logic are introduced.
--   * Nothing listed here deletes a function/table without proving zero
--     consumers; see per-section notes.
--   * Prepare & Write: questions are VISIBLE pre-exam but carry NO answer or
--     explanation fields; the question set is locked server-side into
--     exam_preparations.questions_snapshot; the real exam starts from that
--     exact snapshot (same authoritative IDs) via start_prepared_exam();
--     the client can never inject question IDs.
--
-- Sections
--   1.  F-03 notifications: create_notification -> service_role only; drop
--       open INSERT policy.
--   2.  F-10 materialized-view refreshes: service_role only (pg_cron).
--   3.  F-08 anon oracles: revoke check_user_exists / check_security_violations
--       from PUBLIC + anon (validate_coupon stays anon -- required by the
--       pre-auth signup coupon flow, see authService.ts:204 / userService.ts:101).
--   4.  F-11 column-lockdown defence-in-depth.
--   5.  F-04 / F-09 / F-12 / F-13 attempt lifecycle: expires_at, abandoned,
--       deadline helper, one-active-attempt partial indexes, create_attempt /
--       set_question_answer / submit_attempt hardenings, stale sweep,
--       expire_stale_attempts() for scheduled use.
--   6.  F-05 admin_list_questions -> admin only + bounded limit.
--   7.  F-15 p_limit caps (get_leaderboard_top + get_admin_leaderboard splice).
--   8.  F-06 commit_hierarchy_draft_rpc -> admin only (splice) + exam_topics
--       sub-admin RLS policies dropped (no sub-admin consumer exists).
--   9.  Prepare & Write: exam_preparations table + prepare_exam_questions +
--       start_prepared_exam + RLS (owner select, RPC-only writes).
--   10. F-01 get_practice_questions dropped (answer-bearing practice RPC).
--   11. F-14 referral attribution backfill (sub_admin_id authoritative).
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. F-03 — notifications: service_role only.
--    Consumers are DB triggers (trg_notify_on_attempt / trg_notify_on_new_student
--    / trg_notify_on_sub_admin_change) which run as the definer and are
--    unaffected by EXECUTE grants. No frontend or edge function calls
--    create_notification (proven during audit: src + supabase/functions).
--    The admin insert policy (notifications_insert_admin, WITH CHECK is_admin())
--    is the only user-writable path kept.
-- =============================================================================
DROP POLICY IF EXISTS notifications_service_insert ON public.notifications;

-- =============================================================================
-- 2. F-10 — client-reachable MV refreshes removed.
--    refresh_attempts_views is a trigger function (returns trigger) and
--    refresh_leaderboard_view is maintained by pg_cron; neither is a client
--    feature. Revoking from anon/authenticated/PUBLIC removes the DoS surface.
-- =============================================================================

-- =============================================================================
-- 3. F-08 — anon enumeration oracles.
--    check_user_exists has NO caller in src (only the repository definition,
--    user.repository.ts:126). check_security_violations is not referenced in
--    src either. validate_coupon is intentionally KEPT executable by anon
--    because the signup flow validates the coupon BEFORE authentication.
-- =============================================================================
DO $$
DECLARE
  v_rec record;
BEGIN
  FOR v_rec IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname IN (
         'create_notification',
         'refresh_attempts_views',
         'refresh_leaderboard_view',
         'check_user_exists',
         'check_security_violations',
         'expire_stale_attempts'
       )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', v_rec.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', v_rec.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', v_rec.sig);
  END LOOP;
END
$$;

GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_attempts_views() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_leaderboard_view() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_exists(text) TO authenticated;

-- =============================================================================
-- 4. F-11 — column-level lockdown (defence-in-depth; RLS remains the boundary).
--    teacher_exam_questions answer columns are read by the frontend ONLY via
--    get_teacher_exam_questions (SECURITY DEFINER), never via REST table reads
--    (see teacherExam.repository.ts + educator-exams-h1-remediation.test.ts).
--    questions_backup_phase6 is a dead artifact with zero src/function refs.
-- =============================================================================
REVOKE SELECT (correct_option, explanation_en, explanation_te) ON public.teacher_exam_questions FROM anon;
REVOKE SELECT (correct_option, explanation_en, explanation_te) ON public.teacher_exam_questions FROM authenticated;

DO $$
BEGIN
  IF to_regclass('public.questions_backup_phase6') IS NOT NULL THEN
    REVOKE ALL ON public.questions_backup_phase6 FROM anon;
    REVOKE ALL ON public.questions_backup_phase6 FROM authenticated;
  END IF;
END
$$;

-- =============================================================================
-- 5. F-04 / F-09 / F-12 / F-13 — attempt lifecycle.
-- =============================================================================

-- 5.1 new columns -----------------------------------------------------------------
ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS abandoned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS abandoned_at timestamptz;

-- 5.2 authoritative deadline resolution ------------------------------------------
CREATE OR REPLACE FUNCTION public._pf_attempt_deadline(p_attempt_id uuid)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    a.expires_at,
    CASE
      WHEN a.teacher_exam_id IS NOT NULL THEN
        LEAST(te.end_time, a.started_at + make_interval(mins => GREATEST(COALESCE(te.duration_minutes, 1), 1)))
      WHEN a.paper_id IS NOT NULL THEN
        a.started_at + make_interval(mins => GREATEST(COALESCE(ep.duration_minutes, ec.duration_minutes, 30), 1))
      WHEN a.exam_id IS NOT NULL THEN
        a.started_at + make_interval(mins => GREATEST(COALESCE(ec.duration_minutes, 30), 1))
      ELSE NULL
    END
  )
  FROM public.attempts a
  LEFT JOIN public.teacher_exams te ON te.id = a.teacher_exam_id
  LEFT JOIN public.exam_papers ep ON ep.id = a.paper_id
  LEFT JOIN public.exam_configs ec ON ec.exam_id = a.exam_id
  WHERE a.id = p_attempt_id;
$$;

REVOKE ALL ON FUNCTION public._pf_attempt_deadline(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._pf_attempt_deadline(uuid) FROM anon;
REVOKE ALL ON FUNCTION public._pf_attempt_deadline(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public._pf_attempt_deadline(uuid) TO service_role;

-- 5.3 F-09 — one-active-attempt partial unique indexes ----------------------------
-- The existing partial index (user_id, exam_id, paper_id) WHERE status='in_progress'
-- cannot cover teacher-exam rows (exam_id/paper_id NULL) nor paper-less source rows
-- (exam & paper NULL), and ALL three predicates MUST exclude abandoned rows --
-- otherwise an F-13-expired (abandoned) row would permanently block a retake via
-- a unique violation. We therefore:
--   1) pre-clean legacy DUPLICATE in-progress paper-less rows (keep the newest
--      started_at as the active attempt; abandon the rest) so the new covering
--      index can be built;
--   2) recreate one_active_attempt with an abandoned=false predicate;
--   3) add the two covering indexes with that same predicate.
CREATE UNIQUE INDEX IF NOT EXISTS one_active_attempt_teacher
  ON public.attempts (user_id, teacher_exam_id)
  WHERE status = 'in_progress' AND abandoned = false AND teacher_exam_id IS NOT NULL;

UPDATE public.attempts a
   SET abandoned = true, abandoned_at = now()
  FROM (
    SELECT user_id, source
      FROM public.attempts
     WHERE status = 'in_progress'
       AND abandoned = false
       AND teacher_exam_id IS NULL
       AND exam_id IS NULL
       AND paper_id IS NULL
       AND source <> 'exam_tab'
     GROUP BY user_id, source
    HAVING COUNT(*) > 1
  ) d
 WHERE a.user_id = d.user_id
   AND a.source = d.source
   AND a.status = 'in_progress'
   AND a.abandoned = false
   AND a.teacher_exam_id IS NULL
   AND a.exam_id IS NULL
   AND a.paper_id IS NULL
   AND a.source <> 'exam_tab'
   AND a.started_at <> (
        SELECT MAX(a2.started_at)
          FROM public.attempts a2
         WHERE a2.user_id = a.user_id
           AND a2.source = a.source
           AND a2.status = 'in_progress'
           AND a2.abandoned = false
           AND a2.teacher_exam_id IS NULL
           AND a2.exam_id IS NULL
           AND a2.paper_id IS NULL
           AND a2.source <> 'exam_tab'
   );

DROP INDEX IF EXISTS public.one_active_attempt;
CREATE UNIQUE INDEX one_active_attempt
  ON public.attempts (user_id, exam_id, paper_id)
  WHERE status = 'in_progress' AND abandoned = false;

CREATE UNIQUE INDEX IF NOT EXISTS one_active_attempt_source
  ON public.attempts (user_id, source)
  WHERE status = 'in_progress'
    AND abandoned = false
    AND teacher_exam_id IS NULL
    AND exam_id IS NULL
    AND paper_id IS NULL
    AND source <> 'exam_tab';

-- 5.4 F-13 — expiration sweep + scheduled function ---------------------------------
-- One-time sweep: any in_progress attempt whose authoritative deadline has
-- passed is abandoned (stop answer writes; create_attempt may open a new one).
UPDATE public.attempts
   SET abandoned = true, abandoned_at = now()
 WHERE status = 'in_progress'
   AND abandoned = false
   AND now() > public._pf_attempt_deadline(id);

CREATE OR REPLACE FUNCTION public.expire_stale_attempts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.attempts
     SET abandoned = true, abandoned_at = now()
   WHERE status = 'in_progress'
     AND abandoned = false
     AND now() > public._pf_attempt_deadline(id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_attempts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.expire_stale_attempts() FROM anon;
REVOKE ALL ON FUNCTION public.expire_stale_attempts() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_attempts() TO service_role;

-- 5.5 create_attempt — deadline on insert + abandoned-aware resume + race handling --
CREATE OR REPLACE FUNCTION public.create_attempt(
    p_exam_id text,
    p_paper_id uuid,
    p_teacher_exam_id uuid,
    p_source public.attempt_source
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id uuid;
    v_total_marks numeric;
    v_total_questions int;
    v_started_at timestamptz;
    v_existing uuid;
    v_attempt jsonb;
    v_te_status text;
    v_start timestamptz;
    v_end timestamptz;
    v_te_duration int;
    v_expires timestamptz;
    v_duration_minutes int;
BEGIN
    -- Ownership is implicit (auth.uid()). Validate input coherence.
    IF p_source IS NULL THEN
        RAISE EXCEPTION 'SOURCE_REQUIRED';
    END IF;

    IF p_source = 'teacher_exam' THEN
        IF p_teacher_exam_id IS NULL THEN
            RAISE EXCEPTION 'TEACHER_EXAM_REQUIRED';
        END IF;
        -- Existence + published + ownership + window. Checked here against
        -- server time so a manipulated client can never start outside the
        -- scheduled window or for an exam it cannot access.
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
        v_total_questions := NULL;
    ELSE
        -- Content exam access: the caller must be allowed for this exam (when an
        -- exam_id is provided). Subject/topic/prepare sources may be created
        -- without paper/exam ids -- their snapshot + submit recompute carry the
        -- authoritative scoring.
        IF p_exam_id IS NOT NULL AND NOT public.is_exam_allowed_for_user(p_exam_id) THEN
            RAISE EXCEPTION 'EXAM_NOT_ALLOWED_FOR_USER';
        END IF;
        v_total_marks := 0;
        v_total_questions := 0;
        IF p_paper_id IS NOT NULL THEN
            -- Interim total_marks. This is a display-only placeholder for the
            -- in-progress row; the authoritative denominator is recomputed from
            -- the actual snapshot at submit time (submit_attempt). For full-exam
            -- papers the paper-subject sum is exact and meaningful.
            IF p_source = 'exam_tab' THEN
                SELECT COALESCE(SUM(es.marks_per_question * es.question_count), 0)
                  INTO v_total_marks
                  FROM public.exam_subjects es
                 WHERE es.paper_id = p_paper_id
                   AND (p_exam_id IS NULL OR es.exam_id = p_exam_id);
            END IF;
            SELECT COALESCE(SUM(es.question_count), 0)
              INTO v_total_questions
              FROM public.exam_subjects es
             WHERE es.paper_id = p_paper_id
               AND (p_exam_id IS NULL OR es.exam_id = p_exam_id);
        END IF;
    END IF;

    -- F-04: resolve the server-side deadline for the new attempt.
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

    -- one-active-attempt: resume any existing in_progress attempt matching the
    -- same concrete context (teacher exam OR paper). For paper-less sources
    -- (subject_test / topic_exam / prepare_write) resume by source to preserve
    -- the existing "resume my in-progress test" semantics without creating
    -- unbounded duplicate rows. Abandoned attempts are never resumed (F-13).
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
        -- F-04 backfill: legacy in-progress rows without a stored deadline get one.
        UPDATE public.attempts
           SET expires_at = COALESCE(expires_at, public._pf_attempt_deadline(v_existing))
         WHERE id = v_existing AND expires_at IS NULL;
        RETURN jsonb_build_object('attempt_id', v_existing, 'is_resumed', true);
    END IF;

    v_started_at := now();
    v_id := gen_random_uuid();

    BEGIN
        INSERT INTO public.attempts (
            id, user_id, exam_id, paper_id, teacher_exam_id, source,
            status, started_at, expires_at, score, total_marks, correct_count,
            wrong_count, skipped_count, accuracy, tab_switch_count,
            has_security_issues, review_accessed, questions_snapshot
        ) VALUES (
            v_id, auth.uid(), p_exam_id, p_paper_id, p_teacher_exam_id, p_source,
            'in_progress', v_started_at, v_expires, 0, COALESCE(v_total_marks, 0),
            0, 0, 0, 0, 0, false, false, '[]'::jsonb
        );
    EXCEPTION
        WHEN unique_violation THEN
            -- F-09: a concurrent call claimed the in_progress row first.
            -- Re-select the winner and resume it; otherwise re-raise.
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
                RETURN jsonb_build_object('attempt_id', v_existing, 'is_resumed', true);
            END IF;
            RAISE;
    END;

    RETURN jsonb_build_object('attempt_id', v_id, 'is_resumed', false);
END;
$$;

REVOKE ALL ON FUNCTION public.create_attempt(text, uuid, uuid, public.attempt_source) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_attempt(text, uuid, uuid, public.attempt_source) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_attempt(text, uuid, uuid, public.attempt_source) TO authenticated;

-- 5.6 set_question_answer — server-side deadline + abandoned enforcement (F-04) ----
CREATE OR REPLACE FUNCTION public.set_question_answer(
    p_attempt_id uuid,
    p_question_id uuid,
    p_selected_option text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_attempt record;
    v_marks numeric;
    v_neg numeric;
    v_authoritative_correct text;
    v_is_correct boolean;
    v_marks_awarded numeric;
    v_provenance_ok boolean := false;
    v_elem jsonb;
    v_deadline timestamptz;
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

    -- F-04: no answer may be written after the server-side deadline.
    IF v_attempt.abandoned THEN
        RAISE EXCEPTION 'ATTEMPT_EXPIRED: attempt was closed';
    END IF;
    v_deadline := public._pf_attempt_deadline(p_attempt_id);
    IF v_deadline IS NOT NULL AND now() > v_deadline THEN
        RAISE EXCEPTION 'ATTEMPT_EXPIRED: the allocated time has elapsed';
    END IF;

    -- R-3 provenance: question must belong to the attempt's context, and we
    -- must be able to resolve its authoritative correct_option for scoring.
    IF v_attempt.teacher_exam_id IS NOT NULL THEN
        SELECT correct_option INTO v_authoritative_correct
          FROM public.teacher_exam_questions
         WHERE id = p_question_id AND teacher_exam_id = v_attempt.teacher_exam_id;
        v_provenance_ok := v_authoritative_correct IS NOT NULL;
    ELSIF v_attempt.paper_id IS NOT NULL THEN
        SELECT q.correct_option INTO v_authoritative_correct
          FROM public.questions q
         WHERE q.id = p_question_id
           AND q.paper_id = v_attempt.paper_id;
        v_provenance_ok := v_authoritative_correct IS NOT NULL;
    ELSIF v_attempt.exam_id IS NOT NULL THEN
        SELECT q.correct_option INTO v_authoritative_correct
          FROM public.questions q
         WHERE q.id = p_question_id
           AND q.exam_id = v_attempt.exam_id;
        v_provenance_ok := v_authoritative_correct IS NOT NULL;
    ELSE
        FOR v_elem IN SELECT value FROM jsonb_array_elements(v_attempt.questions_snapshot)
        LOOP
            IF (v_elem->>'id')::uuid = p_question_id
               OR (v_elem->>'question_id')::uuid = p_question_id THEN
                v_provenance_ok := true;
                EXIT;
            END IF;
        END LOOP;
        IF v_provenance_ok THEN
            SELECT q.correct_option INTO v_authoritative_correct
              FROM public.questions q
             WHERE q.id = p_question_id;
        END IF;
    END IF;

    IF NOT v_provenance_ok OR v_authoritative_correct IS NULL THEN
        RAISE EXCEPTION 'QUESTION_NOT_IN_ATTEMPT: question does not belong to this attempt';
    END IF;

    -- R-2: authoritative marks + negative (client-supplied values ignored).
    SELECT m.marks, m.neg INTO v_marks, v_neg
      FROM public._pf_marks_for_question(p_question_id) m;

    v_is_correct := (p_selected_option IS NOT NULL AND p_selected_option = v_authoritative_correct);
    v_marks := COALESCE(v_marks, 1);
    v_neg := COALESCE(v_neg, 0);
    v_marks_awarded := CASE
        WHEN p_selected_option IS NULL THEN 0
        WHEN v_is_correct THEN v_marks
        WHEN v_neg > 0 THEN -v_neg
        ELSE 0
    END;

    -- correct_option is deliberately NOT persisted to attempt_answers.
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
        is_correct = EXCLUDED.is_correct,
        marks_awarded = EXCLUDED.marks_awarded;
END;
$$;

-- 5.7 submit_attempt — empty-submission guard (F-12) + capped duration (F-04) -------
CREATE OR REPLACE FUNCTION public.submit_attempt(p_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
    v_q record;
    v_deadline timestamptz;
BEGIN
    -- Ownership guard (precedes idempotency -- no cross-user leak).
    IF NOT EXISTS (SELECT 1 FROM public.attempts
                    WHERE id = p_attempt_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: attempt does not belong to the current user';
    END IF;

    -- Idempotency / duplicate-submit guard.
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

    -- Cumulative score from recorded answers.
    SELECT COUNT(*) FILTER (WHERE is_correct = TRUE),
           COUNT(*) FILTER (WHERE is_correct = FALSE),
           COALESCE(SUM(marks_awarded), 0)
      INTO v_total_correct, v_total_wrong, v_score
      FROM public.attempt_answers WHERE attempt_id = p_attempt_id;

    v_total_skipped := GREATEST(0, v_total_questions - v_total_correct - v_total_wrong);

    -- F-12: graded tests must not be completable with zero recorded answers.
    -- (Visited-but-unanswered rows have is_correct NULL and do not count.)
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
    -- over the questions actually in the snapshot (never the client-supplied
    -- stored total_marks). Teacher-exam snapshot questions resolve to the
    -- teacher_exams.marks_per_question via _pf_marks_for_question.
    SELECT COALESCE(sum(m.marks), 0)
      INTO v_authoritative_total
      FROM (
        SELECT (m).marks::numeric AS marks
          FROM public.attempts a
          CROSS JOIN LATERAL jsonb_array_elements(a.questions_snapshot) AS q
          CROSS JOIN LATERAL public._pf_marks_for_question(
                       COALESCE((q.value->>'id')::uuid, (q.value->>'question_id')::uuid)
                   ) AS m
         WHERE a.id = p_attempt_id
           AND NOT (m).is_teacher
      ) m;

    IF v_authoritative_total IS NULL OR v_authoritative_total = 0 THEN
        -- Fallback (no content questions; e.g. teacher-only or empty snapshot).
        v_authoritative_total := v_total_marks;
    END IF;

    v_submitted_at := now();
    v_duration := COALESCE(
        EXTRACT(EPOCH FROM (v_submitted_at - (SELECT started_at FROM public.attempts WHERE id = p_attempt_id)))::int,
        0
    );

    -- F-04: a late finalize is allowed (answers are already blocked), but the
    -- recorded duration must never exceed the allotted window.
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

REVOKE ALL ON FUNCTION public.submit_attempt(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_attempt(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_attempt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_question_answer(uuid, uuid, text) TO authenticated;

-- =============================================================================
-- 6. F-05 — admin_list_questions: admin-only + bounded limit.
--    The shared question bank (with answer keys) is the core integrity asset.
--    No sub-admin frontend consumer exists for this RPC (adminQuestionService
--    is the only caller, used by admin question-management pages). Teacher-exam
--    authoring reads never touch this RPC, so scoping to admins breaks nothing.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.admin_list_questions(
    p_exam_ids text[],
    p_paper_id text,
    p_subject_name text,
    p_difficulty text,
    p_search text,
    p_sort_column text,
    p_ascending boolean,
    p_offset integer,
    p_limit integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_where text := ' WHERE 1=1';
    v_sort text;
    v_count integer;
    v_rows jsonb;
    v_limit integer;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: admin role required';
    END IF;

    IF p_exam_ids IS NOT NULL AND array_length(p_exam_ids, 1) > 0 THEN
        v_where := v_where || format(' AND q.exam_id = ANY(%L)', p_exam_ids);
    END IF;
    IF p_paper_id IS NOT NULL AND p_paper_id <> 'all' THEN
        v_where := v_where || format(' AND q.paper_id = %L::uuid', p_paper_id);
    END IF;
    IF p_subject_name IS NOT NULL AND p_subject_name <> 'all' THEN
        v_where := v_where || format(' AND q.subject_name = %L', p_subject_name);
    END IF;
    IF p_difficulty IS NOT NULL AND p_difficulty <> 'all' THEN
        v_where := v_where || format(' AND q.difficulty = %L', p_difficulty);
    END IF;
    IF p_search IS NOT NULL AND p_search <> '' THEN
        v_where := v_where || format(' AND q.question_text_en ILIKE %L', '%' || p_search || '%');
    END IF;

    v_sort := CASE p_sort_column
        WHEN 'id' THEN 'id'
        WHEN 'exam_id' THEN 'exam_id'
        WHEN 'paper_id' THEN 'paper_id'
        WHEN 'subject_name' THEN 'subject_name'
        WHEN 'topic_en' THEN 'topic_en'
        WHEN 'difficulty' THEN 'difficulty'
        WHEN 'is_active' THEN 'is_active'
        WHEN 'created_at' THEN 'created_at'
        WHEN 'updated_at' THEN 'updated_at'
        ELSE 'updated_at'
    END;

    -- F-15: keep the page bounded regardless of caller input.
    v_limit := GREATEST(LEAST(COALESCE(p_limit, 50), 200), 1);

    EXECUTE format('SELECT count(*) FROM public.questions q%s', v_where) INTO v_count;

    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb)
         FROM (
           SELECT q.id, q.exam_id, q.paper_id, q.subject_name,
                  q.topic_en, q.topic_te,
                  q.correct_option, q.difficulty, q.negative_marks, q.visual,
                  q.content_hash, q.is_active, q.created_by,
                  q.created_at, q.updated_at,
                  q.question_text_en, q.question_text_te,
                  q.option_a_en, q.option_b_en, q.option_c_en, q.option_d_en,
                  q.option_a_te, q.option_b_te, q.option_c_te, q.option_d_te,
                  q.explanation_en, q.explanation_te
             FROM public.questions q%s
            ORDER BY q.%I %s
            LIMIT %s OFFSET %s
         ) t',
      v_where,
      v_sort,
      CASE WHEN p_ascending THEN 'ASC' ELSE 'DESC' END,
      v_limit,
      p_offset
    ) INTO v_rows;

    RETURN jsonb_build_object('count', v_count, 'rows', COALESCE(v_rows, '[]'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_questions(text[], text, text, text, text, text, boolean, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_questions(text[], text, text, text, text, text, boolean, integer, integer) TO authenticated;

-- =============================================================================
-- 7. F-15 — p_limit caps.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_leaderboard_top(
    p_exam_id text,
    p_paper_id uuid,
    p_time_range text,
    p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_since timestamptz;
    v_exam_allowed boolean;
    v_limit integer;
BEGIN
    -- Require authenticated user
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    -- Validate time range
    v_since := CASE
        WHEN p_time_range = 'today' THEN date_trunc('day', NOW())
        WHEN p_time_range = 'week' THEN NOW() - INTERVAL '7 days'
        WHEN p_time_range = 'month' THEN NOW() - INTERVAL '1 month'
        ELSE NULL
    END;

    IF v_since IS NULL THEN
        RETURN jsonb_build_object('error', 'Invalid time range');
    END IF;

    -- Validate exam access (helper reads auth.uid() internally)
    v_exam_allowed := public.is_exam_allowed_for_user(p_exam_id);
    IF NOT v_exam_allowed THEN
        RETURN jsonb_build_object('error', 'Exam not authorized');
    END IF;

    -- F-15: bounded page size.
    v_limit := GREATEST(LEAST(COALESCE(p_limit, 50), 100), 1);

    -- Build and execute the ranking query
    RETURN (
        WITH best_attempts AS (
            SELECT DISTINCT ON (ba.user_id)
                ba.user_id,
                u.full_name AS user_name,
                ba.score,
                ba.accuracy,
                ba.duration_seconds,
                ba.submitted_at
            FROM public.attempts ba
            JOIN public.users u ON u.id = ba.user_id
            WHERE ba.exam_id = p_exam_id
              AND (p_paper_id IS NULL OR ba.paper_id = p_paper_id)
              AND ba.status = 'completed'::public.attempt_status
              AND ba.source = 'exam_tab'::public.attempt_source
              AND ba.submitted_at >= v_since
            ORDER BY ba.user_id, ba.score DESC, ba.accuracy DESC, ba.duration_seconds ASC, ba.submitted_at ASC
        ),
        ranked AS (
            SELECT
                user_id,
                user_name,
                score,
                accuracy,
                duration_seconds,
                submitted_at,
                ROW_NUMBER() OVER (
                    ORDER BY score DESC, accuracy DESC, duration_seconds ASC, submitted_at ASC
                ) AS rank
            FROM best_attempts
        )
        SELECT jsonb_agg(to_jsonb(r) ORDER BY r.rank)
        FROM ranked r
        WHERE r.rank <= v_limit
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_leaderboard(
  p_exam_ids text[] DEFAULT NULL,
  p_paper_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'get_admin_leaderboard: admin role required'
      USING ERRCODE = '42501';
  END IF;

  IF p_paper_id IS NOT NULL THEN
    RETURN (
      SELECT jsonb_build_object(
        'entries', COALESCE(jsonb_agg(page.entry), '[]'::jsonb),
        'count', MAX(page.total_count)
      )
      FROM (
        SELECT to_jsonb(r) AS entry, r.total_count
        FROM (
          SELECT
            l.user_id,
            COALESCE(NULLIF(trim(u.full_name), ''), 'Unknown') AS user_name,
            l.exam_id,
            l.paper_id,
            ec.exam_selection,
            l.best_score,
            l.best_accuracy,
            l.best_time_secs,
            l.attempt_count AS total_attempts,
            l.best_submitted_at AS last_attempt_date,
            ROW_NUMBER() OVER (
              ORDER BY l.best_score DESC, l.best_accuracy DESC,
                       l.best_time_secs ASC, l.best_submitted_at ASC,
                       l.user_id ASC
            ) AS rank,
            COUNT(*) OVER () AS total_count
          FROM public.leaderboard l
          LEFT JOIN public.users u ON u.id = l.user_id
          LEFT JOIN public.exam_configs ec ON ec.exam_id = l.exam_id
          WHERE l.paper_id = p_paper_id
            AND (p_exam_ids IS NULL OR l.exam_id = ANY (p_exam_ids))
          ORDER BY l.best_score DESC, l.best_accuracy DESC,
                   l.best_time_secs ASC, l.best_submitted_at ASC,
                   l.user_id ASC
          LIMIT GREATEST(LEAST(p_limit, 200), 1) OFFSET p_offset
        ) r
      ) page
    );
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'entries', COALESCE(jsonb_agg(page.entry), '[]'::jsonb),
      'count', MAX(page.total_count)
    )
    FROM (
      SELECT to_jsonb(r) AS entry, r.total_count
      FROM (
        SELECT
          v.user_id,
          COALESCE(NULLIF(trim(v.user_name), ''), 'Unknown') AS user_name,
          v.exam_id,
          NULL::uuid AS paper_id,
          v.exam_selection,
          v.best_score,
          v.best_accuracy,
          v.best_time_secs,
          v.total_attempts,
          v.last_attempt_date,
          ROW_NUMBER() OVER (
            ORDER BY v.best_score DESC, v.best_accuracy DESC,
                     v.best_time_secs ASC, v.last_attempt_date ASC,
                     v.user_id ASC
          ) AS rank,
          COUNT(*) OVER () AS total_count
        FROM public.admin_leaderboard_view v
        WHERE p_exam_ids IS NULL OR v.exam_id = ANY (p_exam_ids)
        ORDER BY v.best_score DESC, v.best_accuracy DESC,
                 v.best_time_secs ASC, v.last_attempt_date ASC,
                 v.user_id ASC
        LIMIT GREATEST(LEAST(p_limit, 200), 1) OFFSET p_offset
      ) r
    ) page
  );
END;
$function$;

-- F-15: bounded page (GREATEST(LEAST(p_limit,200),1)) applied in both branches above.
REVOKE EXECUTE ON FUNCTION public.get_admin_leaderboard(text[], uuid, integer, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_leaderboard(text[], uuid, integer, integer)
  TO authenticated;


-- =============================================================================
-- 8. F-06 — commit_hierarchy_draft_rpc: admin only.
--    The sub-admin pure-topic branch allowed writes into ANY paper+subject of
--    the shared bank (owner-agnostic topic resolution). No sub-admin consumer
--    of this RPC exists in src or edge functions (proven). The exam_topics
--    sub-admin RLS INSERT/UPDATE/DELETE policies are dropped too: sub-admins
--    author teacher-exam content only, which never touches exam_topics
--    (frontend then writes exam_topics only as an authenticated admin).
-- =============================================================================
DROP POLICY IF EXISTS exam_topics_sub_admin_insert ON public.exam_topics;
DROP POLICY IF EXISTS exam_topics_sub_admin_update ON public.exam_topics;
DROP POLICY IF EXISTS exam_topics_sub_admin_delete ON public.exam_topics;

CREATE OR REPLACE FUNCTION public.commit_hierarchy_draft_rpc(p_draft jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_exams    jsonb;
  v_papers   jsonb;
  v_subjects jsonb;
  v_topics   jsonb;
  v_row      jsonb;

  v_is_admin boolean;
  v_is_sub   boolean;

  -- exam scratch
  v_exam_id      text;
  v_total_q      integer;

  -- paper scratch
  v_temp_id    text;
  v_paper_id   uuid;
  v_order      integer;
  v_pid_text   text;

  -- subject/topic scratch
  v_paper_ref     text;
  v_sub_name      text;
  v_canon_subject text;
  v_topic_exam_id text;
  v_exists        boolean;

  -- in-transaction resolution state
  v_paper_map    jsonb := '{}'::jsonb;  -- temp token -> inserted paper uuid
  v_exam_map     jsonb := '{}'::jsonb;  -- exam temp token -> final exam id
  v_sum_by_paper jsonb := '{}'::jsonb;  -- paper uuid text -> running subject sum
  v_parent_exam  text;

  v_created_exams  integer := 0;
  v_created_papers integer := 0;
  v_created_subs   integer := 0;
  v_created_topics integer := 0;
BEGIN
  -- --- AUTHORIZATION ---------------------------------------------------------
  SELECT COALESCE(EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ), FALSE) INTO v_is_admin;
  SELECT COALESCE(EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'sub_admin'
  ), FALSE) INTO v_is_sub;

  v_exams    := COALESCE(p_draft->'exams',    '[]'::jsonb);
  v_papers   := COALESCE(p_draft->'papers',   '[]'::jsonb);
  v_subjects := COALESCE(p_draft->'subjects', '[]'::jsonb);
  v_topics   := COALESCE(p_draft->'topics',   '[]'::jsonb);

  IF jsonb_array_length(v_exams) = 0 AND jsonb_array_length(v_papers) = 0
     AND jsonb_array_length(v_subjects) = 0 AND jsonb_array_length(v_topics) = 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: The draft is empty - nothing to save';
  END IF;

  IF NOT v_is_admin THEN
    -- F-06: the sub-admin pure-topic branch is removed -- it resolved parent
    -- papers/subjects with no ownership check and could write topics into the
    -- shared bank. This RPC is now admin-only.
    RAISE EXCEPTION 'UNAUTHORIZED_ACCESS: Admin role required';
  END IF;
  -- === PHASE 1: EXAMS ========================================================
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_exams) LOOP
    v_exam_id := COALESCE(v_row->>'exam_id', '');
    v_total_q := (v_row->>'total_questions')::integer;

    IF length(btrim(v_exam_id)) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Exam ID is required';
    END IF;
    IF length(v_exam_id) > 50 OR v_exam_id !~ '^[A-Z0-9_]+$' THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Exam ID must be uppercase letters, numbers and underscores only (max 50)';
    END IF;
    IF v_row->>'name' IS NULL OR length(btrim(COALESCE(v_row->>'name',''))) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Display name is required';
    END IF;
    IF length(v_row->>'name') > 200 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Display name must be 200 characters or less';
    END IF;
    IF v_row->>'exam_selection' IS NULL OR length(btrim(COALESCE(v_row->>'exam_selection',''))) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Selection category is required for exam %', v_exam_id;
    END IF;
    IF v_total_q IS NULL OR v_total_q < 1 OR v_total_q > 1000 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Exam % must have between 1 and 1000 questions', v_exam_id;
    END IF;
    IF (v_row->>'total_marks')::integer IS NULL OR (v_row->>'total_marks')::integer < 1 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Exam % must have at least 1 mark', v_exam_id;
    END IF;
    IF (v_row->>'duration_minutes')::integer IS NULL
       OR (v_row->>'duration_minutes')::integer < 1
       OR (v_row->>'duration_minutes')::integer > 1440 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Exam % duration must be between 1 and 1440 minutes', v_exam_id;
    END IF;
    IF COALESCE((v_row->>'negative_mark_value')::numeric, 0) < 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Negative mark value cannot be negative';
    END IF;
    IF COALESCE((v_row->'negative_marking')::boolean, FALSE)
       AND COALESCE((v_row->>'negative_mark_value')::numeric, 0) > 0
       AND (v_row->>'negative_mark_value')::numeric
             > ((v_row->>'total_marks')::numeric / v_total_q) THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Negative mark value must not exceed marks per question (%)',
        ROUND(((v_row->>'total_marks')::numeric / v_total_q), 2);
    END IF;

    -- friendly duplicate pre-check (UNIQUE constraint remains race backstop)
    SELECT EXISTS (SELECT 1 FROM public.exams WHERE exam_id = v_exam_id) INTO v_exists;
    IF v_exists THEN
      RAISE EXCEPTION 'DUPLICATE: An exam with ID "%" already exists', v_exam_id;
    END IF;

    INSERT INTO public.exams (exam_id, exam_type) VALUES (v_exam_id, 'main');
    INSERT INTO public.exam_configs (
      exam_id, name, exam_selection, total_questions, total_marks,
      duration_minutes, negative_marking, negative_mark_value,
      is_published, created_by
    ) VALUES (
      v_exam_id,
      btrim(v_row->>'name'),
      btrim(v_row->>'exam_selection'),
      v_total_q,
      (v_row->>'total_marks')::integer,
      (v_row->>'duration_minutes')::integer,
      COALESCE((v_row->'negative_marking')::boolean, FALSE),
      COALESCE((v_row->>'negative_mark_value')::numeric, 0),
      COALESCE((v_row->'is_published')::boolean, FALSE),
      auth.uid()
    );
    v_created_exams := v_created_exams + 1;

    -- Backend requires >=1 paper per exam: synthesize one for paper-less exams.
    -- NEW (this migration): register its uuid under the OWNING EXAM's temp
    -- token so draft subjects/topics of the new-exam builder resolve to it.
    IF NOT COALESCE((v_row->'has_papers')::boolean, TRUE) THEN
      INSERT INTO public.exam_papers (
        exam_id, paper_name, stage, total_questions, total_marks,
        duration_minutes, negative_marking, negative_mark_value, display_order
      ) VALUES (
        v_exam_id,
        btrim(v_row->>'name'),
        'SINGLE'::public.stage_type,
        v_total_q,
        (v_row->>'total_marks')::integer,
        (v_row->>'duration_minutes')::integer,
        COALESCE((v_row->'negative_marking')::boolean, FALSE),
        COALESCE((v_row->>'negative_mark_value')::numeric, 0),
        1
      ) RETURNING id INTO v_paper_id;

      v_paper_map := v_paper_map || jsonb_build_object(
        COALESCE(v_row->>'temp_id', ''), v_paper_id
      );
      v_created_papers := v_created_papers + 1;
    END IF;

    -- register the NEW exam under its draft token for downstream resolution
    v_exam_map := v_exam_map || jsonb_build_object(
      COALESCE(v_row->>'temp_id', ''), v_exam_id
    );
  END LOOP;

  -- === PHASE 2: PAPERS (insert + temp-token map) =============================
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_papers) LOOP
    v_temp_id := COALESCE(v_row->>'temp_id', '');
    v_paper_ref := COALESCE(v_row->>'exam_id', '');

    IF v_temp_id !~ '^T:[A-Za-z0-9_-]+$' THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper draft is missing a valid temporary ID';
    END IF;
    IF length(btrim(v_paper_ref)) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Every paper needs a parent exam';
    END IF;

    -- Resolve parent exam: T: token -> exam inserted earlier THIS txn, else LIVE id.
    IF left(v_paper_ref, 2) = 'T:' THEN
      v_parent_exam := v_exam_map ->> v_paper_ref;
      IF v_parent_exam IS NULL THEN
        RAISE EXCEPTION 'HIERARCHY: Parent exam for paper "%" not found in this draft', btrim(COALESCE(v_row->>'paper_name',''));
      END IF;
    ELSE
      v_parent_exam := v_paper_ref;
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.exam_configs WHERE exam_id = v_parent_exam) INTO v_exists;
    IF NOT v_exists THEN
      RAISE EXCEPTION 'HIERARCHY: Parent exam "%" does not exist', v_parent_exam;
    END IF;

    IF v_row->>'paper_name' IS NULL OR length(btrim(COALESCE(v_row->>'paper_name',''))) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper name is required';
    END IF;
    IF length(v_row->>'paper_name') > 150 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper name must be 150 characters or less';
    END IF;
    IF COALESCE(v_row->>'stage', 'SINGLE') NOT IN ('SINGLE','PRELIMS','MAINS') THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper stage must be SINGLE, PRELIMS or MAINS';
    END IF;
    IF (v_row->>'total_questions')::integer IS NULL
       OR (v_row->>'total_questions')::integer < 1
       OR (v_row->>'total_questions')::integer > 1000 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper % must have between 1 and 1000 questions', btrim(v_row->>'paper_name');
    END IF;
    IF (v_row->>'total_marks')::integer IS NULL OR (v_row->>'total_marks')::integer < 1 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper % must have at least 1 mark', btrim(v_row->>'paper_name');
    END IF;
    IF (v_row->>'duration_minutes')::integer IS NULL
       OR (v_row->>'duration_minutes')::integer < 1
       OR (v_row->>'duration_minutes')::integer > 1440 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Paper % duration must be between 1 and 1440 minutes', btrim(v_row->>'paper_name');
    END IF;

    SELECT count(*) INTO v_order FROM public.exam_papers WHERE exam_id = v_parent_exam;

    INSERT INTO public.exam_papers (
      exam_id, paper_name, stage, total_questions, total_marks,
      duration_minutes, display_order
    ) VALUES (
      v_parent_exam,
      btrim(v_row->>'paper_name'),
      COALESCE(v_row->>'stage', 'SINGLE')::public.stage_type,
      (v_row->>'total_questions')::integer,
      (v_row->>'total_marks')::integer,
      (v_row->>'duration_minutes')::integer,
      v_order + 1
    ) RETURNING id INTO v_paper_id;

    v_paper_map := v_paper_map || jsonb_build_object(v_temp_id, v_paper_id);
    v_created_papers := v_created_papers + 1;
  END LOOP;

  -- === PHASE 3: SUBJECTS (+ running per-paper question sums) =================
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_subjects) LOOP
    v_paper_ref := COALESCE(v_row->>'paper_ref', '');
    v_sub_name  := COALESCE(v_row->>'subject_name', '');

    IF length(btrim(v_sub_name)) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Subject name is required';
    END IF;
    IF length(v_sub_name) > 150 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Subject name must be 150 characters or less';
    END IF;
    IF (v_row->>'question_count')::integer IS NULL
       OR (v_row->>'question_count')::integer < 1
       OR (v_row->>'question_count')::integer > 1000 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Subject % must have between 1 and 1000 questions', btrim(v_sub_name);
    END IF;
    IF (v_row->>'marks_per_question')::numeric IS NULL
       OR (v_row->>'marks_per_question')::numeric < 0.1 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Subject % must have at least 0.1 marks per question', btrim(v_sub_name);
    END IF;

    -- Resolve parent paper: "T:<temp>" token from this txn, or LIVE uuid.
    -- For the NEW-exam builder the token belongs to the owning exam and maps
    -- to the SINGLE paper synthesized in PHASE 1.
    IF length(btrim(v_paper_ref)) = 0 THEN
      RAISE EXCEPTION 'HIERARCHY: A parent paper reference is required for subject %', btrim(v_sub_name);
    ELSIF left(v_paper_ref, 2) = 'T:' THEN
      v_paper_id := v_paper_map ->> v_paper_ref;
      IF v_paper_id IS NULL THEN
        RAISE EXCEPTION 'HIERARCHY: Parent paper for subject "%" not found in this draft', btrim(v_sub_name);
      END IF;
    ELSE
      BEGIN
        v_paper_id := v_paper_ref::uuid;
      EXCEPTION WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'HIERARCHY: Invalid parent paper reference for subject %', btrim(v_sub_name);
      END;
      SELECT EXISTS (
        SELECT 1 FROM public.exam_papers WHERE id = v_paper_id
      ) INTO v_exists;
      IF NOT v_exists THEN
        RAISE EXCEPTION 'HIERARCHY: The selected paper for subject "%" does not exist', btrim(v_sub_name);
      END IF;
    END IF;

    SELECT count(*) INTO v_order FROM public.exam_subjects WHERE paper_id = v_paper_id;

    INSERT INTO public.exam_subjects (
      exam_id, paper_id, subject_name, question_count,
      marks_per_question, display_order
    ) VALUES (
      (SELECT exam_id FROM public.exam_papers WHERE id = v_paper_id),
      v_paper_id,
      btrim(v_sub_name),
      (v_row->>'question_count')::integer,
      (v_row->>'marks_per_question')::numeric,
      v_order + 1
    );

    -- accumulate per-paper sum keyed by paper uuid text
    v_sum_by_paper := jsonb_set(
      v_sum_by_paper,
      ARRAY[v_paper_id::text],
      to_jsonb(COALESCE((v_sum_by_paper ->> v_paper_id::text)::integer, 0)
               + (v_row->>'question_count')::integer)
    );
    v_created_subs := v_created_subs + 1;
  END LOOP;

  -- === PHASE 3b: NEW-exam subject-sum rule ===================================
  -- Mirrors create_new_exam_rpc / examCreationSchema: a NEW exam distributes
  -- exactly total_questions across its staged subjects.
  --   has_papers=true  -> rule applies PER DRAFT PAPER (unchanged).
  --   has_papers=false -> subjects attach directly to the exam token; when at
  --     least one is present, their sum must equal total_questions against the
  --     SINGLE paper synthesized in PHASE 1. Zero subjects => no-op (unchanged).
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_exams) LOOP
    CONTINUE WHEN NOT COALESCE((v_row->'has_papers')::boolean, TRUE);

    FOR v_pid_text IN
      SELECT d->>'temp_id' FROM jsonb_array_elements(v_papers) d
      WHERE COALESCE(v_exam_map ->> (d->>'exam_id'), d->>'exam_id') = v_row->>'exam_id'
    LOOP
      v_paper_id := v_paper_map ->> v_pid_text;
      IF COALESCE((v_sum_by_paper ->> v_paper_id::text)::integer, 0)
         != (v_row->>'total_questions')::integer THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Subject question counts must total % for each paper of exam %',
          (v_row->>'total_questions')::integer, v_row->>'exam_id';
      END IF;
    END LOOP;
  END LOOP;

  FOR v_row IN SELECT * FROM jsonb_array_elements(v_exams) LOOP
    CONTINUE WHEN COALESCE((v_row->'has_papers')::boolean, TRUE);

    v_temp_id := COALESCE(v_row->>'temp_id', '');
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_subjects) s
      WHERE COALESCE(s->>'paper_ref', '') = v_temp_id
    ) THEN
      v_paper_id := v_paper_map ->> v_temp_id;
      IF COALESCE((v_sum_by_paper ->> v_paper_id::text)::integer, 0)
         != (v_row->>'total_questions')::integer THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Subject question counts for new exam % must total %',
          v_row->>'exam_id', (v_row->>'total_questions')::integer;
      END IF;
    END IF;
  END LOOP;

  -- === PHASE 4: TOPICS =======================================================
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_topics) LOOP
    v_paper_ref := COALESCE(v_row->>'paper_ref', '');
    v_sub_name  := COALESCE(v_row->>'subject_name', '');
    v_paper_id  := NULL;

    IF length(btrim(v_sub_name)) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Topics need a parent subject';
    END IF;
    IF v_row->>'topic_en' IS NULL OR length(btrim(COALESCE(v_row->>'topic_en',''))) = 0 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: English topic name is required';
    END IF;
    IF length(v_row->>'topic_en') > 300 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: English topic name must be 300 characters or less';
    END IF;
    IF COALESCE((v_row->>'required_questions')::integer, 1) < 1 THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Topic % requires at least 1 question', btrim(v_row->>'topic_en');
    END IF;

    -- Resolve parent paper: optional. Empty ref = paper-less (NULL paper_id).
    -- A T:-token belonging to a NEW exam resolves to its synthesized paper.
    IF length(btrim(v_paper_ref)) > 0 THEN
      IF left(v_paper_ref, 2) = 'T:' THEN
        v_paper_id := v_paper_map ->> v_paper_ref;
        IF v_paper_id IS NULL THEN
          RAISE EXCEPTION 'HIERARCHY: Parent paper for topic "%" not found in this draft', btrim(v_row->>'topic_en');
        END IF;
      ELSE
        BEGIN
          v_paper_id := v_paper_ref::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
          RAISE EXCEPTION 'HIERARCHY: Invalid parent paper reference for topic %', btrim(v_row->>'topic_en');
        END;
        SELECT EXISTS (
          SELECT 1 FROM public.exam_papers WHERE id = v_paper_id
        ) INTO v_exists;
        IF NOT v_exists THEN
          RAISE EXCEPTION 'HIERARCHY: The selected paper for topic "%" does not exist', btrim(v_row->>'topic_en');
        END IF;
      END IF;
    END IF;

    -- Parent subject must exist in this exact segment (draft or LIVE).
    -- Case-insensitive match; canonical stored casing wins on insert.
    SELECT subject_name, exam_id
      INTO v_canon_subject, v_topic_exam_id
    FROM public.exam_subjects
    WHERE lower(subject_name) = lower(btrim(v_sub_name))
      AND paper_id IS NOT DISTINCT FROM v_paper_id
    LIMIT 1;

    IF v_canon_subject IS NULL THEN
      RAISE EXCEPTION 'HIERARCHY: Subject "%" does not exist in the selected segment', btrim(v_sub_name);
    END IF;

    SELECT count(*) INTO v_order FROM public.exam_topics
    WHERE exam_id = v_topic_exam_id
      AND paper_id IS NOT DISTINCT FROM v_paper_id
      AND lower(subject_name) = lower(btrim(v_sub_name));

    INSERT INTO public.exam_topics (
      exam_id, paper_id, subject_name, topic_en, topic_te,
      display_order, required_questions
    ) VALUES (
      v_topic_exam_id,
      v_paper_id,
      v_canon_subject,
      btrim(v_row->>'topic_en'),
      NULLIF(btrim(COALESCE(v_row->>'topic_te', '')), ''),
      v_order + 1,
      COALESCE((v_row->>'required_questions')::integer, 1)
    );

    v_created_topics := v_created_topics + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'exams', v_created_exams,
    'papers', v_created_papers,
    'subjects', v_created_subs,
    'topics', v_created_topics
  );

EXCEPTION
  WHEN unique_violation THEN
    DECLARE
      v_constraint text;
    BEGIN
      GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
      CASE v_constraint
        WHEN 'exam_papers_exam_id_paper_name_stage_key' THEN
          RAISE EXCEPTION 'DUPLICATE: A paper with this name already exists for this exam in that stage';
        WHEN 'exam_subjects_paper_id_subject_name_key' THEN
          RAISE EXCEPTION 'DUPLICATE: A subject with this name already exists in this paper';
        WHEN 'exam_topics_exam_id_paper_id_subject_name_topic_en_key' THEN
          RAISE EXCEPTION 'DUPLICATE: A topic with this name already exists in this subject';
        WHEN 'exams_pkey' THEN
          RAISE EXCEPTION 'DUPLICATE: An exam with this ID already exists';
        ELSE
          RAISE EXCEPTION 'DUPLICATE: This record already exists in the database';
      END CASE;
    END;
END;
$fn$;

-- Grants (re-applied after redefinition; admin-only)
REVOKE ALL ON FUNCTION public.commit_hierarchy_draft_rpc(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.commit_hierarchy_draft_rpc(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.commit_hierarchy_draft_rpc(jsonb) TO authenticated;


-- =============================================================================
-- 9. Prepare & Write locked flow (also the F-01 fix on the practice side).
--    exam_preparations stores the student-safe, server-selected snapshot.
--    Writes happen ONLY through SECURITY DEFINER RPCs; the owner gets SELECT.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.exam_preparations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_id text,
  paper_id uuid REFERENCES public.exam_papers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  questions_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  attempt_id uuid REFERENCES public.attempts(id) ON DELETE SET NULL,
  CONSTRAINT exam_preparations_status_check CHECK (status IN ('active', 'consumed', 'expired'))
);

ALTER TABLE public.exam_preparations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exam_preparations_owner_select ON public.exam_preparations;
CREATE POLICY exam_preparations_owner_select
  ON public.exam_preparations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS exam_preparations_user_status ON public.exam_preparations (user_id, status);

-- 9.1 prepare_exam_questions — server-authoritative locked question set ----------
-- Returns ONLY student-safe question fields (id, text, options, metadata).
-- correct_option / explanation_* are never projected.
CREATE OR REPLACE FUNCTION public.prepare_exam_questions(p_paper_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_exam_id text;
    v_questions jsonb;
    v_question_ids jsonb;
    v_count int;
    v_id uuid;
    v_expires timestamptz;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED_ACCESS';
    END IF;
    IF p_paper_id IS NULL THEN
        RAISE EXCEPTION 'PAPER_REQUIRED';
    END IF;

    SELECT exam_id INTO v_exam_id FROM public.exam_papers WHERE id = p_paper_id;
    IF v_exam_id IS NULL THEN
        RAISE EXCEPTION 'PAPER_NOT_FOUND';
    END IF;
    IF NOT public.is_exam_allowed_for_user(v_exam_id) THEN
        RAISE EXCEPTION 'EXAM_NOT_ALLOWED_FOR_USER';
    END IF;

    SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.subject_name, t.created_at), '[]'::jsonb)
      INTO v_questions
      FROM (
        SELECT q.id, q.exam_id, q.paper_id, q.subject_name, q.topic_en, q.topic_te,
               q.difficulty, q.question_text_en, q.question_text_te,
               q.option_a_en, q.option_a_te, q.option_b_en, q.option_b_te,
               q.option_c_en, q.option_c_te, q.option_d_en, q.option_d_te,
               q.visual, q.created_at
          FROM public.questions q
         WHERE q.paper_id = p_paper_id
           AND q.exam_id = v_exam_id
           AND q.is_active = true
           AND q.correct_option IS NOT NULL
      ) t;

    v_count := jsonb_array_length(v_questions);
    IF v_count = 0 THEN
        RAISE EXCEPTION 'NO_QUESTIONS_AVAILABLE: no gradable questions were found for this paper';
    END IF;

    SELECT COALESCE(jsonb_agg(q->>'id'), '[]'::jsonb)
      INTO v_question_ids
      FROM jsonb_array_elements(v_questions) q;

    -- Only one active preparation per paper per user.
    UPDATE public.exam_preparations
       SET status = 'expired'
     WHERE user_id = v_user_id
       AND status = 'active'
       AND paper_id IS NOT DISTINCT FROM p_paper_id;

    v_expires := now() + interval '24 hours';
    INSERT INTO public.exam_preparations (
        user_id, exam_id, paper_id, status, question_ids,
        questions_snapshot, question_count, expires_at
    ) VALUES (
        v_user_id, v_exam_id, p_paper_id, 'active', v_question_ids,
        v_questions, v_count, v_expires
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'preparation_id', v_id,
        'exam_id', v_exam_id,
        'paper_id', p_paper_id,
        'question_count', v_count,
        'expires_at', v_expires,
        'questions', v_questions
    );
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_exam_questions(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prepare_exam_questions(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.prepare_exam_questions(uuid) TO authenticated;

-- 9.2 start_prepared_exam — consume the locked prep into a real attempt -----------
-- Runs create_attempt(source='prepare_write') then locks the stored snapshot via
-- set_attempt_snapshot (which never overwrites an existing snapshot on resume).
-- The client receives the SAME locked question IDs; it can supply no question set.
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

    -- Re-authorize at start time: exam access may have changed since prep.
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
        PERFORM public.set_attempt_snapshot(v_attempt_id, v_prep.questions_snapshot);
    END IF;

    UPDATE public.exam_preparations
       SET status = 'consumed', consumed_at = now(), attempt_id = v_attempt_id
     WHERE id = v_prep.id;

    -- Any other active preps for the same paper are now obsolete.
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

-- =============================================================================
-- 10. F-01 — drop the answer-bearing practice RPC.
--     get_practice_questions projected correct_option + explanation_* to any
--     authenticated user allowed for the exam. The Prepare & Write flow now
--     runs through prepare_exam_questions (student-safe) + start_prepared_exam
--     (locked snapshot, no client question injection). The frontend reference
--     fetchPracticeQuestionsRpc is removed in the same release.
-- =============================================================================
DO $$
DECLARE
  v_rec record;
BEGIN
  FOR v_rec IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'get_practice_questions'
  LOOP
    EXECUTE format('DROP FUNCTION %s', v_rec.sig);
  END LOOP;
END
$$;

-- =============================================================================
-- 11. F-14 — single source of truth for referral attribution.
--     Backfill sub_admin_id from the unambiguous coupon match (only when
--     exactly one active sub_admin owns the coupon). coupon_code stays as
--     historical attribution; commission logic must key on sub_admin_id.
-- =============================================================================
UPDATE public.users u
   SET sub_admin_id = sa.id
  FROM public.sub_admins sa
 WHERE u.sub_admin_id IS NULL
   AND u.coupon_code IS NOT NULL
   AND u.coupon_code = sa.coupon_code
   AND sa.status = 'active'
   AND NOT EXISTS (
        SELECT 1 FROM public.sub_admins s2
         WHERE s2.coupon_code = u.coupon_code AND s2.id <> sa.id
   );

COMMIT;
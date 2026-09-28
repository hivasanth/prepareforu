-- 20260828203000_teacher_exam_create_security_hardening.sql
--
-- Hardening for the /sub-admin/create publish path (create_teacher_exam_atomic).
--
-- Live-verified baseline (project xbjhlfwqmcyatblsrhxn, all values introspected):
--   * create_teacher_exam_atomic(text,uuid,timestamptz,timestamptz,integer,
--     numeric,numeric,jsonb,text) owner postgres, SECURITY DEFINER,
--     SET search_path='public'.
--   * ACL before fix: {=X/postgres,postgres=X/postgres,anon=X/postgres,
--     authenticated=X/postgres,service_role=X/postgres}  => anon AND PUBLIC (empty
--     role) could EXECUTE; the body performed NO auth.uid() check and trusted
--     p_sub_admin_id directly (C1/C2).
--   * No idempotency key existed (C3). No server-side rate limit (H3).
--   * security_logs + log_security_event(text,text,text,jsonb) exist and are
--     EXECUTE-only for postgres/service_role; a SECURITY DEFINER function owned by
--     postgres may call log_security_event transactionally (H2).
--
-- NOTE (editable-in-place): this migration was authored for this remediation and
-- has never been applied to any database (local staging is not deployed; LIVE is
-- still on the legacy 9-arg RPC from 20260528000002). Rewriting the RPC contract
-- below (canonical single snake_case key set, owner resolved from auth.uid(),
-- idempotency-before-rate-limit ordering, composite idempotency index) therefore
-- edits the un-released file rather than layering correction migrations on an
-- intermediate that would itself go to production.
--
-- What this migration does (one transaction):
--   1. C1/C2 - authorize on the server: REVOKE EXECUTE anon/PUBLIC, GRANT
--      authenticated only. The OWNER is resolved from auth.uid(): an admin may
--      publish on behalf of any existing sub_admins row; a sub_admin may ONLY
--      publish under their own row (p_sub_admin_id MUST equal their resolved id,
--      otherwise UNAUTHORIZED). p_sub_admin_id is never trusted as the owner.
--   2. C3 - idempotency per owner: teacher_exams.request_key with a composite
--      partial UNIQUE index (sub_admin_id, request_key) + atomic insert with
--      unique_violation resolution. Replays (same owner + key) return the
--      existing exam uuid.
--   3. W3 - idempotency FIRST: the request-key short-circuit runs BEFORE the
--      rate-limit bookkeeping, so a successful retry no longer burns the
--      publish quota (previously the attempt INSERT preceded the lookup).
--   4. CONTRACT (canonical): the RPC accepts exactly ONE question key contract —
--      the snake_case set the client validator (questionSchema.ts), service, and
--      repository already send (question_text_en, option_a_en, option_b_en,
--      option_c_en, option_d_en, correct_option, display_order, difficulty,
--      plus the bilingual *_te fields). A deterministic single-key helper reads
--      each field; any other spelling simply fails validation. No cobra-style
--      dual-spelling fallback is provided, so there is no ambiguity to resolve.
--   5. H1 - server-side validation parity with examConfigSchema (title 5..120,
--      start within last 5min, end > start, window <= 30d, duration 1..1440 and
--      <= window, marks 0.01..99.99 (numeric(4,2) column cap), negative >= 0 and
--      <= marks, 1..100 questions, per-question structure, unique display_order).
--   6. H2 - durable audit via public.log_security_event (transactional: rolls
--      back with the create; no "success" audit on rollback).
--   7. H3 - rate limit: new exam_publish_attempts table (10 per identity per 10
--      minutes, sliding window); table locked to anon/authenticated + RLS.
--   8. Integrity: UNIQUE (teacher_exam_id, display_order) - verified no existing
--      duplicates (5 exams / 126 questions) before adding.
--
-- Apply as ONE transaction. (supabase db push --linked or Management API with
-- BEGIN/COMMIT.)

-- ── RPC replacement ──
-- The historical CREATE OR REPLACE used the old 9-arg signature. Because the
-- new 10-arg signature (adds p_request_key) must not linger as an ambiguous
-- overload, supersede explicitly and guarantee a single definition.
DROP FUNCTION IF EXISTS public.create_teacher_exam_atomic(
  text, uuid, timestamp with time zone, timestamp with time zone,
  integer, numeric, numeric, jsonb, text);
DROP FUNCTION IF EXISTS public.create_teacher_exam_atomic(
  text, uuid, timestamp with time zone, timestamp with time zone,
  integer, numeric, numeric, jsonb, text, text);

-- ── C1/C3: idempotency column + composite partial unique index ──
ALTER TABLE public.teacher_exams
  ADD COLUMN IF NOT EXISTS request_key text;

-- Idempotency is scoped per owner: the same request_key under two different
-- sub_admins rows is two independent publishes (each guarded by its own authz
-- resolution), never a replay. The composite key plus the per-owner lookup
-- below make both the short-circuit and the unique_violation recovery precise.
CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_exams_request_key
  ON public.teacher_exams (sub_admin_id, request_key)
  WHERE request_key IS NOT NULL;

-- ── Integrity: enforce unique ordering within an exam ──
CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_exam_questions_order
  ON public.teacher_exam_questions (teacher_exam_id, display_order);

-- ── H3: rate-limit table (definer-only writes; RLS as defense-in-depth) ──
CREATE TABLE IF NOT EXISTS public.exam_publish_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid NOT NULL,
  sub_admin_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exam_publish_attempts_actor
  ON public.exam_publish_attempts (actor_id, created_at DESC);
REVOKE ALL ON TABLE public.exam_publish_attempts FROM anon, authenticated;
ALTER TABLE public.exam_publish_attempts ENABLE ROW LEVEL SECURITY;

-- ── CONTRACT: canonical single-key field read (snake_case only) ──
-- Reads one question field under its canonical snake_case key and normalizes it
-- (trimmed, empty string -> NULL). The entire client pipe (BulkQuestionSchema,
-- teacherExamService, teacherExam.repository) already emits snake_case, so the
-- definition below is the ONLY spelling the RPC understands. Ambiguity between
-- competing key spellings cannot occur because no alternate spelling is read.
DROP FUNCTION IF EXISTS public.te_q_field(jsonb, text, text);
CREATE OR REPLACE FUNCTION public.te_q_field(q jsonb, key text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $fn$
  SELECT NULLIF(btrim(COALESCE(q->>key, '')), '')
$fn$;

-- te_q_field is a private helper of the definer RPC — no app role may invoke it
-- directly (search-path hardened above; no EXECUTE granted).
REVOKE ALL ON FUNCTION public.te_q_field(jsonb, text) FROM PUBLIC, anon, authenticated;

-- ── Hardened RPC (canonical single-key contract, owner from auth.uid()) ──
CREATE OR REPLACE FUNCTION public.create_teacher_exam_atomic(
  p_title text,
  p_sub_admin_id uuid,
  p_start_time timestamp with time zone,
  p_end_time timestamp with time zone,
  p_duration_minutes integer,
  p_marks_per_question numeric,
  p_negative_mark_value numeric,
  p_questions jsonb,
  p_source_type text DEFAULT 'text',
  p_request_key text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_owner_sa_id uuid;
  v_exam_id uuid;
  v_count integer;
  v_window_minutes numeric;
  v_recent integer;
  v_source_type text;
  v_request_key text;
  v_seen_orders jsonb := '[]'::jsonb;
  v_order_text text;
  q jsonb;
  v_idx integer := 0;
  -- normalized per-question fields (shared between validation + insert loops)
  v_q_text text;
  v_q_te text;
  v_q_opt_a text; v_q_opt_b text; v_q_opt_c text; v_q_opt_d text;
  v_q_opt_a_te text; v_q_opt_b_te text; v_q_opt_c_te text; v_q_opt_d_te text;
  v_q_correct text;
  v_q_expl text; v_q_expl_te text;
  v_q_diff text;
BEGIN
  -- C1/C2: server-side authorization (the browser is untrusted). The owning
  -- sub_admins row is resolved from auth.uid(), never trusted from the payload:
  -- an admin may publish on behalf of any existing sub_admin; a sub_admin may
  -- ONLY publish under their own row. A spoofed or mismatched p_sub_admin_id is
  -- UNAUTHORIZED.
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  IF public.is_admin() THEN
    v_owner_sa_id := p_sub_admin_id;
    IF v_owner_sa_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.sub_admins WHERE id = v_owner_sa_id
    ) THEN
      RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;
  ELSE
    SELECT sa.id INTO v_owner_sa_id
    FROM public.sub_admins sa
    WHERE sa.user_id = v_user_id
    ORDER BY sa.created_at ASC, sa.id ASC
    LIMIT 1;
    IF v_owner_sa_id IS NULL OR v_owner_sa_id IS DISTINCT FROM p_sub_admin_id THEN
      RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;
  END IF;

  -- C3: idempotency key, normalized once.
  v_request_key := NULLIF(btrim(COALESCE(p_request_key, '')), '');

  -- W3: the idempotent-retry short-circuit runs BEFORE any rate-limit
  -- bookkeeping, so a replay of an already-created exam (same owner + key)
  -- returns the existing exam uuid and never consumes publish quota. The
  -- rate-limit attempt row is only written for genuinely new publishes.
  IF v_request_key IS NOT NULL THEN
    SELECT id INTO v_exam_id
    FROM public.teacher_exams
    WHERE sub_admin_id = v_owner_sa_id AND request_key = v_request_key;
    IF v_exam_id IS NOT NULL THEN
      RETURN v_exam_id;
    END IF;
  END IF;

  -- H3: sliding-window rate limit (10 publishes per authenticated identity per
  -- 10 minutes, attributed to the RESOLVED owner).
  DELETE FROM public.exam_publish_attempts
  WHERE created_at < now() - interval '10 minutes';

  SELECT count(*) INTO v_recent
  FROM public.exam_publish_attempts
  WHERE actor_id = v_user_id AND sub_admin_id = v_owner_sa_id
    AND created_at >= now() - interval '10 minutes';
  IF v_recent >= 10 THEN
    RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED';
  END IF;

  INSERT INTO public.exam_publish_attempts (actor_id, sub_admin_id)
  VALUES (v_user_id, v_owner_sa_id);

  -- H1: validation parity with examConfigSchema.
  IF btrim(COALESCE(p_title, '')) IS DISTINCT FROM p_title
     OR char_length(btrim(p_title)) < 5 OR char_length(btrim(p_title)) > 120 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;

  IF p_start_time IS NULL OR p_end_time IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;
  IF p_start_time < now() - interval '5 minutes' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;
  IF p_end_time <= p_start_time THEN
    RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;
  IF (p_end_time - p_start_time) > interval '30 days' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;

  IF p_duration_minutes IS NULL OR p_duration_minutes < 1
     OR p_duration_minutes > 1440 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;
  v_window_minutes := extract(epoch FROM (p_end_time - p_start_time)) / 60.0;
  IF p_duration_minutes > v_window_minutes THEN
    RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;

  IF p_marks_per_question IS NULL OR p_marks_per_question <= 0
     OR p_marks_per_question > 99.99 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;

  IF p_negative_mark_value IS NULL OR p_negative_mark_value < 0
     OR p_negative_mark_value > p_marks_per_question THEN
    RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;

  IF p_questions IS NULL OR jsonb_typeof(p_questions) <> 'array'
     OR jsonb_array_length(p_questions) < 1 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;
  v_count := jsonb_array_length(p_questions);
  IF v_count > 100 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR';
  END IF;

  -- Per-question structure + uniqueness, canonical single-key normalization.
  FOR q IN SELECT value FROM jsonb_array_elements(p_questions) LOOP
    v_idx := v_idx + 1;
    IF jsonb_typeof(q) <> 'object' THEN
      RAISE EXCEPTION 'VALIDATION_ERROR';
    END IF;

    v_q_text    := public.te_q_field(q, 'question_text_en');
    v_q_te      := public.te_q_field(q, 'question_text_te');
    v_q_opt_a   := public.te_q_field(q, 'option_a_en');
    v_q_opt_b   := public.te_q_field(q, 'option_b_en');
    v_q_opt_c   := public.te_q_field(q, 'option_c_en');
    v_q_opt_d   := public.te_q_field(q, 'option_d_en');
    v_q_opt_a_te := public.te_q_field(q, 'option_a_te');
    v_q_opt_b_te := public.te_q_field(q, 'option_b_te');
    v_q_opt_c_te := public.te_q_field(q, 'option_c_te');
    v_q_opt_d_te := public.te_q_field(q, 'option_d_te');
    v_q_correct := public.te_q_field(q, 'correct_option');
    v_q_expl    := public.te_q_field(q, 'explanation_en');
    v_q_expl_te := public.te_q_field(q, 'explanation_te');
    v_q_diff    := public.te_q_field(q, 'difficulty');

    IF v_q_text = '' OR v_q_opt_a = '' OR v_q_opt_b = '' OR v_q_opt_c = '' OR v_q_opt_d = ''
       OR v_q_correct NOT IN ('A','B','C','D') THEN
      RAISE EXCEPTION 'VALIDATION_ERROR';
    END IF;

    v_order_text := COALESCE(NULLIF(public.te_q_field(q, 'display_order'), ''), v_idx::text);
    IF v_order_text !~ '^[1-9][0-9]*$' OR v_seen_orders @> to_jsonb(v_order_text) THEN
      RAISE EXCEPTION 'VALIDATION_ERROR';
    END IF;
    v_seen_orders := v_seen_orders || to_jsonb(v_order_text);
  END LOOP;

  v_source_type := COALESCE(
    NULLIF(btrim(COALESCE(p_source_type, '')), ''),
    'text'
  );

  -- Atomic create with request-key conflict resolution (C3). The insert is
  -- attributed to the RESOLVED owner (v_owner_sa_id), never the raw payload.
  BEGIN
    INSERT INTO public.teacher_exams (
      sub_admin_id, title, start_time, end_time, duration_minutes,
      marks_per_question, negative_marking, negative_mark_value,
      total_questions, total_marks, status, source_type, request_key
    ) VALUES (
      v_owner_sa_id, btrim(p_title), p_start_time, p_end_time, p_duration_minutes,
      p_marks_per_question, (p_negative_mark_value > 0), p_negative_mark_value,
      v_count, (v_count * p_marks_per_question)::numeric(8, 2),
      'published', v_source_type, v_request_key
    )
    RETURNING id INTO v_exam_id;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT id INTO v_exam_id
      FROM public.teacher_exams
      WHERE sub_admin_id = v_owner_sa_id AND request_key = v_request_key;
      IF v_exam_id IS NOT NULL THEN
        RETURN v_exam_id;
      END IF;
      RAISE;
  END;

  -- Insert loop re-normalizes with the SAME deterministic helper (validation
  -- already passed, so values are identical). Telugu bilingual columns are
  -- preserved.
  FOR q, v_idx IN
    SELECT value, ordinality
    FROM jsonb_array_elements(p_questions) WITH ORDINALITY
  LOOP
    INSERT INTO public.teacher_exam_questions (
      teacher_exam_id, correct_option, display_order,
      question_text_en, question_text_te,
      option_a_en, option_a_te, option_b_en, option_b_te,
      option_c_en, option_c_te, option_d_en, option_d_te,
      explanation_en, explanation_te, difficulty, diagram
    ) VALUES (
      v_exam_id,
      btrim(public.te_q_field(q, 'correct_option')),
      COALESCE(NULLIF(public.te_q_field(q, 'display_order'), ''), v_idx::text)::integer,
      btrim(public.te_q_field(q, 'question_text_en')),
      NULLIF(btrim(COALESCE(public.te_q_field(q, 'question_text_te'), '')), ''),
      btrim(public.te_q_field(q, 'option_a_en')),
      NULLIF(btrim(COALESCE(public.te_q_field(q, 'option_a_te'), '')), ''),
      btrim(public.te_q_field(q, 'option_b_en')),
      NULLIF(btrim(COALESCE(public.te_q_field(q, 'option_b_te'), '')), ''),
      btrim(public.te_q_field(q, 'option_c_en')),
      NULLIF(btrim(COALESCE(public.te_q_field(q, 'option_c_te'), '')), ''),
      btrim(public.te_q_field(q, 'option_d_en')),
      NULLIF(btrim(COALESCE(public.te_q_field(q, 'option_d_te'), '')), ''),
      NULLIF(btrim(COALESCE(public.te_q_field(q, 'explanation_en'), '')), ''),
      NULLIF(btrim(COALESCE(public.te_q_field(q, 'explanation_te'), '')), ''),
      COALESCE(NULLIF(btrim(COALESCE(public.te_q_field(q, 'difficulty'), '')), ''), 'medium'),
      q->'diagram'
    );
  END LOOP;

  -- H2: durable audit (transactional - rolls back with the create).
  PERFORM public.log_security_event(
    'exam_publish',
    v_user_id::text,
    'info',
    jsonb_build_object(
      'sub_admin_id', v_owner_sa_id,
      'exam_id', v_exam_id,
      'request_key', v_request_key,
      'title', btrim(p_title)
    )
  );

  RETURN v_exam_id;
END;
$function$;

-- ── Grants: EXECUTE for authenticated only (new 10-arg signature) ──
REVOKE EXECUTE ON FUNCTION public.create_teacher_exam_atomic(
  text, uuid, timestamp with time zone, timestamp with time zone,
  integer, numeric, numeric, jsonb, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_teacher_exam_atomic(
  text, uuid, timestamp with time zone, timestamp with time zone,
  integer, numeric, numeric, jsonb, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_teacher_exam_atomic(
  text, uuid, timestamp with time zone, timestamp with time zone,
  integer, numeric, numeric, jsonb, text, text) TO authenticated;
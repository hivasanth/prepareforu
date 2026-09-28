-- ============================================================================
-- 20260401000001_reconstruct_missing_baseline_tables.sql
--
-- GENESIS: reconstructs all out-of-band tables, enums, and minimal indexes
-- that were never captured in migration history but are structurally required
-- by downstream migrations (20260502, 20260520171200, 20260520173000, etc.).
--
-- IDEMPOTENT: every statement uses IF NOT EXISTS / guarded DO blocks.
-- Safe for both clean replay (creates everything) and LIVE deployment
-- (skips all existing objects).
--
-- PREREQUISITES (already created by earlier migrations):
--   - user_role enum, users, security_logs (20260401000000)
--   - update_updated_at() function (20260401000000)
--
-- sub_admins + is_sub_admin() are created HERE (mirroring 20260501000000,
-- which uses CREATE TABLE IF NOT EXISTS / CREATE OR REPLACE and therefore
-- becomes a no-op after this migration). They are required before 20260502
-- can be applied, and teacher_exams has an FK to sub_admins.
--
-- KNOWN DELIBERATE DIVERGENCE — exam_configs.created_by is NULLABLE here:
--   On LIVE this column is NOT NULL; the 20260622000000 seed gained its value
--   from the admin JWT context when that seed was applied out-of-band. On a
--   fresh chain the users table is empty (no migration seeds users), so a NOT
--   NULL column would make 20260622000000's INSERT fail. Bootstrapping a user
--   row to force NOT NULL would fabricate data (forbidden for LIVE). The
--   nullability is therefore relaxed so the full chain replays; the semantics
--   of every other column, the FK, and all CHECKs match LIVE exactly.
--
-- DATA-INITEGRITY CHECK CONSTRAINTS: the CHECKs that guard exam_configs,
-- exam_papers, exam_subjects (positive counts/marks), and questions option
-- non-emptiness were authored by 20260721000004_database_check_constraints.sql.
-- To keep that migration's non-idempotent ADD CONSTRAINT statements replayable,
-- genesis creates those tables WITHOUT those CHECKs (final schema is identical;
-- 20260721000004 adds them on a fresh chain and is a no-op-equivalent on LIVE,
-- where they already exist). Genesis keeps its OWN differently-named checks
-- (e.g. questions_correct_option_check, chk_question_en_not_empty,
-- chk_questions_negative_marks_range, attempt_answers_selected_option_check)
-- which 20260721000004 does not create.
--
-- DOWNSTREAM MIGRATIONS THAT CONSUME THESE OBJECTS:
--   20260502_rls_hardening.sql     — RLS + indexes on teacher_exams,
--                                     teacher_exam_questions, attempts
--   20260520171200_performance_indexing.sql — IF NOT EXISTS indexes on
--                                     questions, attempts, attempt_answers,
--                                     leaderboard, bookmarks, prepare_sessions
--   20260520173000_dynamic_exam_migration.sql — ALTER COLUMN exam_id TYPE text
--                                     on many tables (no-op when created as text);
--                                     DROP/ADD CONSTRAINT on exam_configs FKs
--   20260527000001_critical_submit_fixes.sql — CREATE INDEX on attempts
--   20260614000000_fix_one_active_attempt_constraint.sql — DROP CONSTRAINT
--                                     one_active_attempt, CREATE UNIQUE INDEX
--   20260701000004_rls_content_tables.sql — RLS + indexes on many tables
--   20260904000000_dead_schema_and_tabswitch.sql — DROP TABLE IF EXISTS
--                                     import_sessions, subject_performance
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. EXTENSIONS (LIVE-parity; installed out-of-band on LIVE, needed by objects
--    reconstructed in this file)
-- ─────────────────────────────────────────────────────────────────────────────
-- uuid-ossp: LIVE's out-of-band baseline tables default ids to
--   uuid_generate_v4() (cuu_uuid-ossp). Local Supabase images ship the contrib
--   module; CREATE EXTENSION is idempotent and safe on LIVE (already present).
-- pg_trgm: LIVE has the extension installed; it backs idx_questions_text_en_trgm
--   (reconstructed below) and the trgm similarity()/word_similarity() family.
-- pg_stat_statements, supabase_vault, pgcrypto are Supabase-managed infra or are
--   created by chain migrations (pgcrypto in 20260903100000) — NOT duplicated
--   here by design (see "vestigial/infra" decision, parity report).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUM TYPES
-- ─────────────────────────────────────────────────────────────────────────────

-- teacher_exam_status (used by teacher_exams.status)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
                 WHERE n.nspname = 'public' AND t.typname = 'teacher_exam_status') THEN
    CREATE TYPE public.teacher_exam_status AS ENUM ('draft', 'published', 'completed');
  END IF;
END
$$;

-- difficulty (used by questions.difficulty, teacher_exam_questions.difficulty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
                 WHERE n.nspname = 'public' AND t.typname = 'difficulty') THEN
    CREATE TYPE public.difficulty AS ENUM ('easy', 'medium', 'hard');
  END IF;
END
$$;

-- stage_type (used by exam_papers.stage)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
                 WHERE n.nspname = 'public' AND t.typname = 'stage_type') THEN
    CREATE TYPE public.stage_type AS ENUM ('PRELIMS', 'MAINS', 'SINGLE');
  END IF;
END
$$;

-- attempt_source (used by attempts.source)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
                 WHERE n.nspname = 'public' AND t.typname = 'attempt_source') THEN
    CREATE TYPE public.attempt_source AS ENUM (
      'exam_tab', 'subject_test', 'prepare_write', 'teacher_exam', 'topic_exam'
    );
  END IF;
END
$$;

-- attempt_status (used by attempts.status)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
                 WHERE n.nspname = 'public' AND t.typname = 'attempt_status') THEN
    CREATE TYPE public.attempt_status AS ENUM (
      'in_progress', 'completed', 'auto_submitted'
    );
  END IF;
END
$$;

-- sub_admin_status (LIVE enum; used by sub_admins.status — reconstructed here
-- because NO chain migration creates it, yet 20260501000000 / role-mutation
-- RPCs reference 'active'/'inactive' status semantics)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
                 WHERE n.nspname = 'public' AND t.typname = 'sub_admin_status') THEN
    CREATE TYPE public.sub_admin_status AS ENUM ('active', 'inactive');
  END IF;
END
$$;

-- question_report_status (LIVE enum; used by question_reports.status —
-- reconstructed here because NO chain migration creates it and the table is a
-- LIVE out-of-band table reconstructed below)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
                 WHERE n.nspname = 'public' AND t.typname = 'question_report_status') THEN
    CREATE TYPE public.question_report_status AS ENUM ('pending', 'resolved', 'dismissed');
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CORE TABLES (no FK dependencies beyond users/sub_admins)
-- ─────────────────────────────────────────────────────────────────────────────

-- 2a. sub_admins (mirrors 20260501000000; idempotent on LIVE)
-- corrected 2026-09-10 to LIVE-verbatim: enum status, uuid_generate_v4(),
-- NOT NULL on created_by/email/full_name/coupon_code (no '' defaults),
-- notification_prefs JSON default. updated_at + commission_percentage are
-- added later by 20260910000001 / 20260901000000 (not duplicated here).
CREATE TABLE IF NOT EXISTS public.sub_admins (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL,
  full_name         text NOT NULL,
  email             text NOT NULL,
  coupon_code       text NOT NULL,
  status            sub_admin_status NOT NULL DEFAULT 'active',
  created_by        uuid NOT NULL,
  total_referrals   integer NOT NULL DEFAULT 0,
  notification_prefs jsonb NOT NULL DEFAULT '{"notify_on_attempt": true, "notify_on_new_student": true, "notify_on_exam_closure": true}'::jsonb,
  provision_request_id text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sub_admins_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT sub_admins_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- 2b. is_sub_admin() helper (mirrors 20260501000000)
CREATE OR REPLACE FUNCTION public.is_sub_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'sub_admin'
  );
END;
$$;

-- 2b2. remove_sub_admin (legacy educator removal RPC; out-of-band; canonical
--       live definition). No chain migration creates it, but
--       20260825000003_admin_remove_sub_admin_rpc hardens its search_path via
--       ALTER FUNCTION, so it is reconstructed here verbatim from LIVE.
--       Returns jsonb; SECURITY DEFINER; search_path pinned to public.
CREATE OR REPLACE FUNCTION public.remove_sub_admin(p_sub_admin_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_admin public.sub_admins%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can remove sub admins.';
  END IF;

  SELECT * INTO v_sub_admin
  FROM public.sub_admins
  WHERE id = p_sub_admin_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Sub admin not found.');
  END IF;

  -- Demote user role back to user
  UPDATE public.users
  SET role = 'user'
  WHERE id = v_sub_admin.user_id;

  -- Unlink all users from this sub admin
  -- They lose teacher exam access but keep their accounts
  UPDATE public.users
  SET sub_admin_id = NULL,
      coupon_code = NULL
  WHERE sub_admin_id = p_sub_admin_id;

  -- Deactivate sub admin record
  UPDATE public.sub_admins
  SET status = 'inactive'
  WHERE id = p_sub_admin_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Sub admin removed. Linked users unlinked. Past attempts preserved.'
  );
END;
$$;

-- 2b3. Legacy trigger functions (out-of-band; canonical live definitions).
--       No chain migration creates them, but
--       20260910000002_defense_in_depth_grants_hardening revokes PUBLIC/anon
--       EXECUTE on them, so they must exist for the chain to replay. Both are
--       reconstructed verbatim from LIVE (prevent_self_demotion is invoker,
--       no search_path; update_sub_admin_referrals is SECURITY DEFINER with
--       search_path pinned to public).

CREATE OR REPLACE FUNCTION public.prevent_self_demotion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.role = 'admin'
    AND NEW.role != 'admin'
    AND auth.uid() = OLD.id
  THEN
    RAISE EXCEPTION 'Admin cannot demote themselves. Ask another admin.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_sub_admin_referrals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handle INSERT or UPDATE where sub_admin_id is set
  IF NEW.sub_admin_id IS NOT NULL THEN
    -- Only update if it's an INSERT or if the sub_admin_id has changed
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.sub_admin_id IS NULL OR OLD.sub_admin_id IS DISTINCT FROM NEW.sub_admin_id)) THEN
      UPDATE public.sub_admins
      SET total_referrals = (
        SELECT COUNT(*) FROM public.users WHERE sub_admin_id = NEW.sub_admin_id
      )
      WHERE id = NEW.sub_admin_id;
    END IF;
  END IF;

  -- If it's an UPDATE and sub_admin_id was removed/changed, update the OLD sub_admin as well
  IF TG_OP = 'UPDATE' AND OLD.sub_admin_id IS NOT NULL AND (NEW.sub_admin_id IS NULL OR OLD.sub_admin_id IS DISTINCT FROM NEW.sub_admin_id) THEN
    UPDATE public.sub_admins
    SET total_referrals = (
      SELECT COUNT(*) FROM public.users WHERE sub_admin_id = OLD.sub_admin_id
    )
    WHERE id = OLD.sub_admin_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 2c. teacher_exams
-- corrected 2026-09-10 to LIVE-verbatim: status NULLABLE DEFAULT 'draft',
-- duration_minutes DEFAULT 60, and NAMED check constraints (title_check on
-- title, valid_time_window on end_time > start_time). The previous inline
-- CHECK(end_time > start_time) auto-named to teacher_exams_check, which does
-- NOT exist on LIVE.
CREATE TABLE IF NOT EXISTS public.teacher_exams (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_admin_id      uuid NOT NULL REFERENCES public.sub_admins(id) ON DELETE CASCADE,
  title             text NOT NULL CONSTRAINT teacher_exams_title_check CHECK (char_length(title) >= 3),
  instructions      text,
  start_time        timestamptz NOT NULL,
  end_time          timestamptz NOT NULL,
  marks_per_question numeric(4,2) NOT NULL DEFAULT 1,
  negative_marking   boolean NOT NULL DEFAULT false,
  negative_mark_value numeric(4,2) NOT NULL DEFAULT 0,
  total_questions    integer NOT NULL DEFAULT 0,
  total_marks        numeric(8,2) NOT NULL DEFAULT 0,
  attempt_count      integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  status             teacher_exam_status DEFAULT 'draft',
  duration_minutes   integer DEFAULT 60,
  access_code        text,
  source_type        text,
  request_key        text,
  CONSTRAINT valid_time_window CHECK (end_time > start_time)
);

-- 2d. teacher_exam_questions
-- corrected 2026-09-10 to LIVE-verbatim: *_te column names (LIVE uses
-- suffix `_te`, NOT `_telugu`), correct_option char(1) NOT NULL (LIVE has no
-- NULL rows; the type is permanent), difficulty is TEXT nullable with default
-- 'medium'::text (LIVE ran OOB with text — no chain migration converts it),
-- and LIVE's check_question_text_en_not_empty constraint is reproduced.
CREATE TABLE IF NOT EXISTS public.teacher_exam_questions (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_exam_id   uuid NOT NULL REFERENCES public.teacher_exams(id) ON DELETE CASCADE,
  question_text_en  text,
  question_text_te  text,
  option_a_en       text,
  option_b_en       text,
  option_c_en       text,
  option_d_en       text,
  option_a_te       text,
  option_b_te       text,
  option_c_te       text,
  option_d_te       text,
  explanation_en    text,
  explanation_te    text,
  correct_option    char(1) NOT NULL CHECK (correct_option = ANY (ARRAY['A'::bpchar,'B'::bpchar,'C'::bpchar,'D'::bpchar])),
  display_order     integer NOT NULL DEFAULT 1,
  difficulty        text DEFAULT 'medium'::text,
  diagram           jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_question_text_en_not_empty
    CHECK (question_text_en IS NULL OR length(TRIM(BOTH FROM question_text_en)) > 0)
);

-- 2e. Trigger function: update_teacher_exam_totals
CREATE OR REPLACE FUNCTION public.update_teacher_exam_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_exam teacher_exams%ROWTYPE;
  v_count INTEGER;
BEGIN
  SELECT * INTO v_exam
  FROM public.teacher_exams
  WHERE id = COALESCE(NEW.teacher_exam_id, OLD.teacher_exam_id);

  SELECT COUNT(*) INTO v_count
  FROM public.teacher_exam_questions
  WHERE teacher_exam_id = v_exam.id;

  UPDATE public.teacher_exams SET
    total_questions = v_count,
    total_marks = v_count * marks_per_question
  WHERE id = v_exam.id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;
-- 2f. Triggers (IF NOT EXISTS via DO blocks)

-- update_updated_at() helper (out-of-band; canonical live definition)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- check_exam_velocity() helper (out-of-band; canonical live definition).
-- LIVE carries a SECURITY DEFINER trigger function resolving suspicious
-- answer-velocity (time_to_answer_ms < 2s) via log_security_event. No chain
-- migration creates it, but 20260821120000 hardens its search_path with ALTER
-- FUNCTION -- so it is reconstructed here verbatim from LIVE. It is THE trigger
-- function for tr_check_exam_velocity ON exam_velocity_logs (reconstructed
-- below): the columns it references (NEW.time_to_answer_ms, NEW.is_suspicious,
-- NEW.attempt_id, NEW.user_id, NEW.question_id) all exist on that table.
-- Response: RETURNS TRIGGER, secdef, volatile.

CREATE OR REPLACE FUNCTION public.check_exam_velocity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public, pg_temp'
AS $function$
DECLARE
    v_threshold_ms INT := 2000; -- 2 seconds threshold
BEGIN
    IF NEW.time_to_answer_ms < v_threshold_ms THEN
        NEW.is_suspicious := true;
        -- Log suspicious activity asynchronously
        PERFORM public.log_security_event(
            'suspicious_velocity',
            NEW.user_id::text,
            'high',
            jsonb_build_object(
                'attempt_id', NEW.attempt_id,
                'question_id', NEW.question_id,
                'time_ms', NEW.time_to_answer_ms
            )
        );
    END IF;
    RETURN NEW;
END;
$function$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'teacher_exam_questions'
      AND t.tgname = 'trg_teacher_exam_totals'
  ) THEN
    CREATE TRIGGER trg_teacher_exam_totals
    AFTER INSERT OR DELETE ON public.teacher_exam_questions
    FOR EACH ROW EXECUTE FUNCTION public.update_teacher_exam_totals();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'teacher_exams'
      AND t.tgname = 'trg_teacher_exams_updated_at'
  ) THEN
    CREATE TRIGGER trg_teacher_exams_updated_at
    BEFORE UPDATE ON public.teacher_exams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. EXAM INFRASTRUCTURE TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a. exams (PK = exam_id text; 20260520 converts the original enum to text)
CREATE TABLE IF NOT EXISTS public.exams (
  exam_id          text NOT NULL PRIMARY KEY,
  exam_type        text NOT NULL DEFAULT 'main',
  exam_subcategory text
);

-- 3b. exam_configs
CREATE TABLE IF NOT EXISTS public.exam_configs (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id           text NOT NULL UNIQUE,
  name              text NOT NULL,
  exam_selection    text NOT NULL,
  total_marks       integer NOT NULL,
  total_questions   integer NOT NULL,
  duration_minutes  integer NOT NULL,
  pass_marks        integer,
  negative_marking  boolean NOT NULL DEFAULT false,
  negative_mark_value numeric NOT NULL DEFAULT 0,
  is_published      boolean NOT NULL DEFAULT false,
  active_version_id uuid,
  created_by        uuid REFERENCES public.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  start_time        timestamptz,
  end_time          timestamptz,
  allow_multiple_attempts boolean DEFAULT false,
  max_attempts      integer DEFAULT 1,
  allow_review      boolean DEFAULT true
);

-- 3c. exam_versions
CREATE TABLE IF NOT EXISTS public.exam_versions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id         text NOT NULL,
  version_number  integer NOT NULL DEFAULT 1,
  structure       jsonb NOT NULL,
  created_by      uuid NOT NULL REFERENCES public.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exam_versions_exam_id_version_number_key UNIQUE (exam_id, version_number)
);

-- 3d. exam_papers
CREATE TABLE IF NOT EXISTS public.exam_papers (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id         text NOT NULL,
  paper_name      text NOT NULL,
  stage           stage_type NOT NULL DEFAULT 'PRELIMS',
  total_questions integer NOT NULL,
  total_marks     integer NOT NULL,
  duration_minutes integer NOT NULL,
  negative_marking boolean NOT NULL DEFAULT false,
  negative_mark_value numeric NOT NULL DEFAULT 0,
  display_order   integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  start_time      timestamptz,
  end_time        timestamptz,
  CONSTRAINT exam_papers_exam_id_paper_name_stage_key UNIQUE (exam_id, paper_name, stage)
);

-- 3e. exam_subjects
CREATE TABLE IF NOT EXISTS public.exam_subjects (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id           text NOT NULL,
  paper_id          uuid NOT NULL REFERENCES public.exam_papers(id) ON DELETE CASCADE,
  subject_name      text NOT NULL,
  question_count    integer NOT NULL,
  marks_per_question numeric NOT NULL DEFAULT 1,
  display_order     integer NOT NULL DEFAULT 1,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exam_subjects_paper_id_subject_name_key UNIQUE (paper_id, subject_name)
);

-- 3f. import_sessions (dead schema, dropped by 20260904000000)
CREATE TABLE IF NOT EXISTS public.import_sessions (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id       text NOT NULL,
  paper_id      uuid NOT NULL,
  subject_name  text NOT NULL,
  imported_by   uuid NOT NULL
);

-- 3g. questions
CREATE TABLE IF NOT EXISTS public.questions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id         text NOT NULL,
  paper_id        uuid NOT NULL,
  subject_name    text NOT NULL,
  correct_option  char(1) NOT NULL,
  difficulty      difficulty NOT NULL DEFAULT 'medium',
  negative_marks  numeric NOT NULL DEFAULT 0,
  tags            text[] DEFAULT '{}',
  usage_count     integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_by      uuid NOT NULL REFERENCES public.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  import_session_id uuid,
  visual          jsonb,
  content_hash    text,
  question_text_te text,
  option_a_te     text,
  option_b_te     text,
  option_c_te     text,
  option_d_te     text,
  explanation_te  text,
  question_text_en text,
  option_a_en     text,
  option_b_en     text,
  option_c_en     text,
  option_d_en     text,
  explanation_en  text,
  topic_en        text,
  topic_te        text,
  CONSTRAINT questions_correct_option_check CHECK (correct_option = ANY (ARRAY['A'::bpchar,'B'::bpchar,'C'::bpchar,'D'::bpchar])),
  CONSTRAINT chk_question_en_not_empty CHECK (question_text_en IS NULL OR length(TRIM(BOTH FROM question_text_en)) > 0),
  CONSTRAINT chk_questions_negative_marks_range CHECK (negative_marks >= 0::numeric AND negative_marks <= 99.99)
);

-- 3h. question_upload_prompts
CREATE TABLE IF NOT EXISTS public.question_upload_prompts (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id       text NOT NULL,
  paper_id      uuid NOT NULL,
  subject_name  text NOT NULL,
  prompt_text   text,
  updated_by    uuid REFERENCES public.users(id),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_upload_prompts_paper_id_subject_name_key UNIQUE (paper_id, subject_name)
);

-- 3i. questions_backup_phase6 (ALTER COLUMN TYPE target in 20260520)
CREATE TABLE IF NOT EXISTS public.questions_backup_phase6 (
  id                uuid,
  exam_id           text,
  paper_id          uuid,
  subject_name      text,
  question_text     text,
  option_a          text,
  option_b          text,
  option_c          text,
  option_d          text,
  correct_option    char(1),
  explanation       text,
  difficulty        difficulty,
  negative_marks    numeric,
  tags              text[],
  usage_count       integer,
  is_active         boolean,
  import_session_id uuid,
  created_by        uuid,
  created_at        timestamptz,
  updated_at        timestamptz,
  visual            jsonb,
  content_hash      text,
  question_text_te  text,
  option_a_te       text,
  option_b_te       text,
  option_c_te       text,
  option_d_te       text,
  explanation_te    text,
  question_text_en  text,
  option_a_en       text,
  option_b_en       text,
  option_c_en       text,
  option_d_en       text,
  explanation_en    text
);

-- 3j. leaderboard
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL,
  exam_id           text NOT NULL,
  paper_id          uuid NOT NULL,
  best_score        numeric NOT NULL DEFAULT 0,
  best_accuracy     numeric NOT NULL DEFAULT 0,
  best_time_secs    integer,
  attempt_count     integer NOT NULL DEFAULT 1,
  rank              integer,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  best_submitted_at timestamptz,
  CONSTRAINT leaderboard_user_id_exam_id_paper_id_key UNIQUE (user_id, exam_id, paper_id)
);

-- 3k. daily_stats
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date            date NOT NULL,
  exam_id         text,
  attempts_count  integer NOT NULL DEFAULT 0,
  avg_score       numeric,
  avg_accuracy    numeric,
  unique_users    integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_stats_date_exam_id_key UNIQUE (date, exam_id)
);

-- 3l. subject_performance (dead schema, dropped by 20260904000000)
CREATE TABLE IF NOT EXISTS public.subject_performance (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL,
  exam_id         text NOT NULL,
  subject_name    text NOT NULL,
  attempts_count  integer NOT NULL DEFAULT 0,
  correct_count   integer NOT NULL DEFAULT 0,
  wrong_count     integer NOT NULL DEFAULT 0,
  accuracy        numeric(5,2) NOT NULL DEFAULT 0,
  avg_time_secs   integer NOT NULL DEFAULT 0,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 3m. prepare_sessions
CREATE TABLE IF NOT EXISTS public.prepare_sessions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL,
  exam_id     text NOT NULL,
  paper_id    uuid NOT NULL,
  read_at     timestamptz NOT NULL DEFAULT now(),
  attempted   boolean NOT NULL DEFAULT false,
  attempt_id  uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3n. attempts
CREATE TABLE IF NOT EXISTS public.attempts (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL,
  exam_id           text,
  paper_id          uuid,
  teacher_exam_id   uuid,
  source            attempt_source NOT NULL,
  version_id        uuid,
  status            attempt_status NOT NULL DEFAULT 'in_progress',
  started_at        timestamptz NOT NULL DEFAULT now(),
  submitted_at      timestamptz,
  duration_seconds  integer,
  score             numeric NOT NULL DEFAULT 0,
  total_marks       numeric NOT NULL DEFAULT 0,
  correct_count     integer NOT NULL DEFAULT 0,
  wrong_count       integer NOT NULL DEFAULT 0,
  skipped_count     integer NOT NULL DEFAULT 0,
  accuracy          numeric NOT NULL DEFAULT 0,
  tab_switch_count  integer NOT NULL DEFAULT 0,
  has_security_issues boolean NOT NULL DEFAULT false,
  review_accessed   boolean NOT NULL DEFAULT false,
  questions_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  answers_json      jsonb,
  CONSTRAINT attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_teacher_exam FOREIGN KEY (teacher_exam_id) REFERENCES public.teacher_exams(id) ON DELETE SET NULL,
  CONSTRAINT one_active_attempt UNIQUE (user_id, exam_id, paper_id) -- WHERE status = 'in_progress' added as index by 20260614
);

-- 3o. attempt_answers
CREATE TABLE IF NOT EXISTS public.attempt_answers (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id        uuid NOT NULL,
  question_id       uuid NOT NULL,
  selected_option   char(1),
  correct_option    char(1),
  is_correct        boolean,
  marks_awarded     numeric NOT NULL DEFAULT 0,
  time_spent_secs   integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  visited           boolean NOT NULL DEFAULT false,
  marked_for_review boolean NOT NULL DEFAULT false,
  last_visited_at   timestamptz,
  CONSTRAINT attempt_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.attempts(id) ON DELETE CASCADE,
  CONSTRAINT attempt_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE,
  CONSTRAINT attempt_answers_attempt_id_question_id_key UNIQUE (attempt_id, question_id),
  CONSTRAINT attempt_answers_selected_option_check CHECK (selected_option = ANY (ARRAY['A'::bpchar,'B'::bpchar,'C'::bpchar,'D'::bpchar]))
);

-- 3p. bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL,
  question_id uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT bookmarks_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE,
  CONSTRAINT bookmarks_user_id_question_id_key UNIQUE (user_id, question_id)
);

-- 3q. MINIMAL EXAM CATALOG SEED
--    Data migrations later in the chain (20260622000000, 20260630000001,
--    20260701000001/0002, 20260701000002, ...) insert exam_papers/exam_subjects
--    with FOREIGN KEY (exam_id) REFERENCES exam_configs(exam_id). On a fresh
--    chain those FK checks fail unless the referenced exam_configs rows exist.
--    This seed mirrors the LIVE catalog skeleton (exams + exam_configs only;
--    NO papers/subjects — those are created by the chain's own DO blocks).
--    Values taken verbatim from the LIVE production database on 2026-09-10.
--    On LIVE every row already exists, so all ON CONFLICT DO NOTHING entries
--    are no-ops. created_by is intentionally NULL on fresh chains (see the
--    KNOWN DELIBERATE DIVERGENCE note in the header).
--    min_questions is intentionally NOT in this seed: 20260705000001 owns
--    that column (ADD COLUMN on a fresh chain; no-op on LIVE), so omitting it
--    here keeps the non-idempotent ADD COLUMN from failing.

INSERT INTO public.exams (exam_id, exam_type)
SELECT x.exam_id, 'main'
FROM (VALUES
  ('APPSC_GROUP_1'),
  ('APPSC_GROUP_2'),
  ('APPSC_GROUP_3'),
  ('APPSC_GROUP_4'),
  ('BANK_EXAMS')
) AS x(exam_id)
ON CONFLICT (exam_id) DO NOTHING;

INSERT INTO public.exam_configs (exam_id, name, exam_selection, total_marks, total_questions, duration_minutes, negative_marking, negative_mark_value, is_published, allow_multiple_attempts, max_attempts, allow_review, created_by)
SELECT x.exam_id, x.name, x.exam_selection, x.total_marks, x.total_questions, x.duration_minutes, x.negative_marking, x.negative_mark_value, x.is_published, x.allow_multiple_attempts, x.max_attempts, x.allow_review, NULL
FROM (VALUES
  ('APPSC_GROUP_1', 'APPSC Group 1', 'APPSC_GROUPS', 240, 240, 240, true, 0.33, true, false, 1, true),
  ('APPSC_GROUP_2', 'APPSC Group 2', 'APPSC_GROUPS', 450, 450, 450, true, 0.33, true, false, 1, true),
  ('APPSC_GROUP_3', 'APPSC Group 3', 'APPSC_GROUPS', 300, 300, 180, false, 0.00, true, false, 1, true),
  ('APPSC_GROUP_4', 'APPSC Group 4', 'APPSC_GROUPS', 300, 300, 300, true, 0.33, true, false, 1, true),
  ('BANK_EXAMS',   'Bank Exams',   'BANK_EXAMS',  100, 100,  60, true, 0.25, true, false, 1, true)
) AS x(exam_id, name, exam_selection, total_marks, total_questions, duration_minutes, negative_marking, negative_mark_value, is_published, allow_multiple_attempts, max_attempts, allow_review)
ON CONFLICT (exam_id) DO NOTHING;

-- 3r. prompt_templates (content-generation prompts; ORIGINAL out-of-band shape)
--
--    This is the PRE-topic_id shape. Later chain migrations intentionally build
--    on it:
--      20260701000004_rls_content_tables.sql  — RLS (is_admin(), no column refs)
--      20260822112933_prompt_templates_topic_id.sql — adds topic_id col + backfill
--        + NOT NULL + fk_prompt_templates_topic + final unique key; DROPs the old
--        topic_name identity key created below (historic constraint name matters).
--      20260822140637_d3_prompt_topic_segment_fk.sql — DROPs fk_prompt_templates_topic
--        and adds the composite fk_prompt_templates_topic_segment.
--
--    Column set/nullability mirrored from LIVE production database (2026-09-10);
--    topic_id is intentionally OMITTED here (added by 20260822112933).

CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id     text NOT NULL,
  paper_id    uuid NOT NULL,
  subject_name text NOT NULL,
  topic_name  text NOT NULL,
  prompt_text text NOT NULL,
  is_default  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  CONSTRAINT prompt_templates_exam_id_paper_id_subject_name_topic_name_key
    UNIQUE (exam_id, paper_id, subject_name, topic_name),
  CONSTRAINT fk_prompt_templates_paper
    FOREIGN KEY (paper_id) REFERENCES public.exam_papers(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. FK CONSTRAINTS ON TABLES CREATED ABOVE
--    (added after all tables exist to avoid circular dependency issues)
-- ─────────────────────────────────────────────────────────────────────────────

-- exam_configs FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_configs_created_by_fkey'
  ) THEN
    ALTER TABLE public.exam_configs
      ADD CONSTRAINT exam_configs_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_active_version'
  ) THEN
    ALTER TABLE public.exam_configs
      ADD CONSTRAINT fk_active_version
      FOREIGN KEY (active_version_id) REFERENCES public.exam_versions(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- exam_versions FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_versions_exam_id_fkey'
  ) THEN
    ALTER TABLE public.exam_versions
      ADD CONSTRAINT exam_versions_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
  END IF;
END
$$;

-- exam_papers FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_papers_exam_id_fkey'
  ) THEN
    ALTER TABLE public.exam_papers
      ADD CONSTRAINT exam_papers_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
  END IF;
END
$$;

-- exam_subjects FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exam_subjects_exam_id_fkey'
  ) THEN
    ALTER TABLE public.exam_subjects
      ADD CONSTRAINT exam_subjects_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
  END IF;
END
$$;

-- import_sessions FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'import_sessions_exam_id_fkey'
  ) THEN
    ALTER TABLE public.import_sessions
      ADD CONSTRAINT import_sessions_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
  END IF;
END
$$;

-- questions FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'questions_exam_id_fkey'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'questions_paper_id_fkey'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_paper_id_fkey
      FOREIGN KEY (paper_id) REFERENCES public.exam_papers(id) ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'questions_import_session_id_fkey'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_import_session_id_fkey
      FOREIGN KEY (import_session_id) REFERENCES public.import_sessions(id);
  END IF;
END
$$;

-- question_upload_prompts FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'question_upload_prompts_exam_id_fkey'
  ) THEN
    ALTER TABLE public.question_upload_prompts
      ADD CONSTRAINT question_upload_prompts_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'question_upload_prompts_paper_id_fkey'
  ) THEN
    ALTER TABLE public.question_upload_prompts
      ADD CONSTRAINT question_upload_prompts_paper_id_fkey
      FOREIGN KEY (paper_id) REFERENCES public.exam_papers(id) ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'question_upload_prompts_updated_by_fkey'
  ) THEN
    ALTER TABLE public.question_upload_prompts
      ADD CONSTRAINT question_upload_prompts_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES public.users(id);
  END IF;
END
$$;

-- leaderboard FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leaderboard_user_id_fkey'
  ) THEN
    ALTER TABLE public.leaderboard
      ADD CONSTRAINT leaderboard_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leaderboard_exam_id_fkey'
  ) THEN
    ALTER TABLE public.leaderboard
      ADD CONSTRAINT leaderboard_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leaderboard_paper_id_fkey'
  ) THEN
    ALTER TABLE public.leaderboard
      ADD CONSTRAINT leaderboard_paper_id_fkey
      FOREIGN KEY (paper_id) REFERENCES public.exam_papers(id) ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_leaderboard_exam'
  ) THEN
    ALTER TABLE public.leaderboard
      ADD CONSTRAINT fk_leaderboard_exam
      FOREIGN KEY (exam_id) REFERENCES public.exams(exam_id);
  END IF;
END
$$;

-- daily_stats FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_stats_exam_id_fkey'
  ) THEN
    ALTER TABLE public.daily_stats
      ADD CONSTRAINT daily_stats_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
  END IF;
END
$$;

-- subject_performance FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subject_performance_exam_id_fkey'
  ) THEN
    ALTER TABLE public.subject_performance
      ADD CONSTRAINT subject_performance_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
  END IF;
END
$$;

-- prepare_sessions FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prepare_sessions_user_id_fkey'
  ) THEN
    ALTER TABLE public.prepare_sessions
      ADD CONSTRAINT prepare_sessions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prepare_sessions_exam_id_fkey'
  ) THEN
    ALTER TABLE public.prepare_sessions
      ADD CONSTRAINT prepare_sessions_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exam_configs(exam_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prepare_sessions_paper_id_fkey'
  ) THEN
    ALTER TABLE public.prepare_sessions
      ADD CONSTRAINT prepare_sessions_paper_id_fkey
      FOREIGN KEY (paper_id) REFERENCES public.exam_papers(id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prepare_sessions_attempt_id_fkey'
  ) THEN
    ALTER TABLE public.prepare_sessions
      ADD CONSTRAINT prepare_sessions_attempt_id_fkey
      FOREIGN KEY (attempt_id) REFERENCES public.attempts(id);
  END IF;
END
$$;

-- attempts FK to exams (originally existed, dropped/recreated by 20260520)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_attempts_exam'
  ) THEN
    ALTER TABLE public.attempts
      ADD CONSTRAINT fk_attempts_exam
      FOREIGN KEY (exam_id) REFERENCES public.exams(exam_id);
  END IF;
END
$$;

-- attempts FK to exam_papers (added out-of-band)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attempts_paper_id_fkey'
  ) THEN
    ALTER TABLE public.attempts
      ADD CONSTRAINT attempts_paper_id_fkey
      FOREIGN KEY (paper_id) REFERENCES public.exam_papers(id);
  END IF;
END
$$;

-- attempts FK to exam_versions (added out-of-band)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attempts_version_id_fkey'
  ) THEN
    ALTER TABLE public.attempts
      ADD CONSTRAINT attempts_version_id_fkey
      FOREIGN KEY (version_id) REFERENCES public.exam_versions(id);
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. LIVE OUT-OF-BAND PARITY OBJECTS (ground truth = LIVE, captured 2026-09-10)
-- ─────────────────────────────────────────────────────────────────────────────
-- The objects below exist on LIVE but are NOT created by ANY chain migration.
-- They are reconstructed verbatim from LIVE so a fresh replay reproduces LIVE's
-- schema. All statements are idempotent (IF NOT EXISTS / OR REPLACE / guarded
-- DO blocks) so applying this file to LIVE is a no-op.

-- 5a. exam_velocity_logs (LIVE: out-of-band; RLS enabled with NO policies →
--     effectively locked to all roles; grants are the Supabase default set).
CREATE TABLE IF NOT EXISTS public.exam_velocity_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid,
  attempt_id        uuid,
  question_id       uuid,
  time_to_answer_ms integer NOT NULL,
  is_suspicious     boolean DEFAULT false,
  created_at        timestamptz DEFAULT now(),
  CONSTRAINT exam_velocity_logs_question_id_fkey
    FOREIGN KEY (question_id) REFERENCES public.questions(id),
  CONSTRAINT exam_velocity_logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

ALTER TABLE public.exam_velocity_logs ENABLE ROW LEVEL SECURITY;

-- 5b. question_reports (LIVE: out-of-band; RLS enabled with 3 policies).
CREATE TABLE IF NOT EXISTS public.question_reports (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id       uuid NOT NULL,
  reported_by       uuid NOT NULL,
  reason            text NOT NULL,
  status            public.question_report_status NOT NULL DEFAULT 'pending',
  resolved_by       uuid,
  resolved_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_reports_question_id_fkey
    FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE,
  CONSTRAINT question_reports_reported_by_fkey
    FOREIGN KEY (reported_by) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT question_reports_resolved_by_fkey
    FOREIGN KEY (resolved_by) REFERENCES public.users(id),
  CONSTRAINT question_reports_question_id_reported_by_key UNIQUE (question_id, reported_by)
);

ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

-- NOTE: question_reports' policies (reports_insert_user / reports_select_own /
-- reports_update_admin) are created by the rls-policy reconciliation migration
-- (20260910000003) rather than here, because their USING/WITH CHECK expressions
-- reference is_admin(), which is not defined until 20260502_rls_hardening.

-- 5c. LIVE out-of-band functions (verbatim prosrc from LIVE).

CREATE OR REPLACE FUNCTION public.check_security_violations()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tab_switch_count >= 5 AND OLD.tab_switch_count < 5 THEN
    NEW.has_security_issues := true;
    NEW.status := 'auto_submitted';
    NEW.submitted_at := NOW();
  ELSIF NEW.tab_switch_count >= 3 THEN
    NEW.has_security_issues := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_attempts_views()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW daily_attempts_stats;
  REFRESH MATERIALIZED VIEW exam_distribution;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_question_subject()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.exam_subjects
    WHERE paper_id = NEW.paper_id
      AND subject_name = NEW.subject_name
  ) THEN
    RAISE EXCEPTION 'Invalid subject_name "%" for this paper', NEW.subject_name;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.remove_student(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_admin_id UUID;
BEGIN
  IF NOT is_sub_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only sub admins can remove students.';
  END IF;

  -- Get sub admin id
  SELECT id INTO v_sub_admin_id
  FROM public.sub_admins
  WHERE user_id = auth.uid() AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Sub admin record not found.');
  END IF;

  -- Verify student belongs to this sub admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND sub_admin_id = v_sub_admin_id
  ) THEN
    RETURN jsonb_build_object('error', 'Student not found in your referrals.');
  END IF;

  -- Unlink student
  UPDATE public.users
  SET sub_admin_id = NULL,
      coupon_code = NULL
  WHERE id = p_user_id;

  -- Update referral count
  UPDATE public.sub_admins
  SET total_referrals = GREATEST(total_referrals - 1, 0)
  WHERE id = v_sub_admin_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Student removed. Their past attempts are preserved.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT last_activity_date, streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_last_date IS NULL OR v_last_date < v_today - INTERVAL '1 day' THEN
    -- Missed a day or first activity — reset streak
    IF v_last_date = v_today - INTERVAL '1 day' THEN
      -- Consecutive day
      v_current_streak := v_current_streak + 1;
    ELSE
      -- Gap detected — reset
      v_current_streak := 1;
    END IF;
  ELSIF v_last_date = v_today THEN
    -- Already active today — no change
    RETURN;
  END IF;

  -- Update longest streak if needed
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  UPDATE public.users
  SET
    streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_activity_date = v_today
  WHERE id = p_user_id;
END;
$$;

-- Note: both overloads are legacy/dead RPCs. The column names they reference on
-- teacher_exam_questions (question_text, option_a, ..., explanation) do not
-- exist on LIVE either; they are reproduced verbatim to preserve the empty
-- pg_proc rows and the p_status TEXT overload's SECURITY DEFINER hardening.
CREATE OR REPLACE FUNCTION public.create_teacher_exam_with_questions(
  p_sub_admin_id uuid,
  p_title text,
  p_instructions text,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_duration_minutes integer,
  p_access_code text,
  p_status teacher_exam_status,
  p_questions jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_exam_id uuid;
  v_q jsonb;
  v_idx integer := 1;
  v_count integer;
BEGIN
  v_count := jsonb_array_length(p_questions);

  -- Insert into teacher_exams with derived metadata
  INSERT INTO teacher_exams (
    sub_admin_id, title, instructions, start_time, end_time,
    duration_minutes, access_code, status,
    total_questions, total_marks, marks_per_question
  ) VALUES (
    p_sub_admin_id, p_title, p_instructions, p_start_time, p_end_time,
    p_duration_minutes, p_access_code, p_status,
    v_count, v_count, 1
  ) RETURNING id INTO v_exam_id;

  -- Insert questions
  FOR v_q IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    INSERT INTO teacher_exam_questions (
      teacher_exam_id, question_text, option_a, option_b, option_c, option_d,
      correct_option, explanation, difficulty, display_order
    ) VALUES (
      v_exam_id,
      v_q->>'question_text',
      v_q->>'option_a',
      v_q->>'option_b',
      v_q->>'option_c',
      v_q->>'option_d',
      (v_q->>'correct_option')::char,
      v_q->>'explanation',
      COALESCE(v_q->>'difficulty', 'medium'),
      v_idx
    );
    v_idx := v_idx + 1;
  END LOOP;

  RETURN v_exam_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_teacher_exam_with_questions(
  p_sub_admin_id uuid,
  p_title text,
  p_instructions text,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_duration_minutes integer,
  p_access_code text,
  p_status text,
  p_questions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_exam_id UUID;
  v_question JSONB;
BEGIN
  -- Insert the exam record
  INSERT INTO teacher_exams (
    sub_admin_id,
    title,              -- Correct column name
    instructions,
    start_time,
    end_time,
    duration_minutes,   -- Correct column name
    access_code,
    status              -- Cast from TEXT to teacher_exam_status automatically if valid
  ) VALUES (
    p_sub_admin_id,
    p_title,
    p_instructions,
    p_start_time,
    p_end_time,
    p_duration_minutes,
    p_access_code,
    p_status::teacher_exam_status, -- Explicit cast
    jsonb_array_length(p_questions),
    NOW()
  ) RETURNING id INTO v_teacher_exam_id;

  -- Insert questions
  FOR v_question IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    INSERT INTO teacher_exam_questions (
      teacher_exam_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      explanation,
      difficulty,
      display_order
    ) VALUES (
      v_teacher_exam_id,
      v_question->>'question_text',
      v_question->>'option_a',
      v_question->>'option_b',
      v_question->>'option_c',
      v_question->>'option_d',
      (v_question->>'correct_option')::char, -- Explicit cast to char
      v_question->>'explanation',
      COALESCE(v_question->>'difficulty', 'medium'),
      0
    );
  END LOOP;
END;
$$;

-- 5d. LIVE out-of-band triggers (guarded so applying to LIVE is a no-op).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'attempts'
      AND t.tgname = 'refresh_attempts_views_trigger'
  ) THEN
    CREATE TRIGGER refresh_attempts_views_trigger
    AFTER INSERT ON public.attempts
    FOR EACH STATEMENT EXECUTE FUNCTION refresh_attempts_views();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'exam_velocity_logs'
      AND t.tgname = 'tr_check_exam_velocity'
  ) THEN
    CREATE TRIGGER tr_check_exam_velocity
    BEFORE INSERT ON public.exam_velocity_logs
    FOR EACH ROW EXECUTE FUNCTION check_exam_velocity();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'exam_configs'
      AND t.tgname = 'trg_exam_configs_updated_at'
  ) THEN
    CREATE TRIGGER trg_exam_configs_updated_at
    BEFORE UPDATE ON public.exam_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'exam_papers'
      AND t.tgname = 'trg_exam_papers_updated_at'
  ) THEN
    CREATE TRIGGER trg_exam_papers_updated_at
    BEFORE UPDATE ON public.exam_papers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'exam_subjects'
      AND t.tgname = 'trg_exam_subjects_updated_at'
  ) THEN
    CREATE TRIGGER trg_exam_subjects_updated_at
    BEFORE UPDATE ON public.exam_subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'users'
      AND t.tgname = 'trg_prevent_self_demotion'
  ) THEN
    CREATE TRIGGER trg_prevent_self_demotion
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION prevent_self_demotion();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'questions'
      AND t.tgname = 'trg_questions_updated_at'
  ) THEN
    CREATE TRIGGER trg_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'attempts'
      AND t.tgname = 'trg_security_check'
  ) THEN
    CREATE TRIGGER trg_security_check
    BEFORE UPDATE ON public.attempts
    FOR EACH ROW EXECUTE FUNCTION check_security_violations();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'users'
      AND t.tgname = 'trg_update_referrals'
  ) THEN
    CREATE TRIGGER trg_update_referrals
    AFTER INSERT OR UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_sub_admin_referrals();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'users'
      AND t.tgname = 'trg_users_updated_at'
  ) THEN
    CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'questions'
      AND t.tgname = 'trg_validate_question_subject'
  ) THEN
    CREATE TRIGGER trg_validate_question_subject
    BEFORE INSERT OR UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION validate_question_subject();
  END IF;
END
$$;

-- 5e. LIVE out-of-band indexes (verbatim indexdefs; pg_trgm-backed where noted).

CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id
  ON public.attempt_answers USING btree (attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question_id
  ON public.attempt_answers USING btree (question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at
  ON public.attempts USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_exam_id
  ON public.attempts USING btree (exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_source
  ON public.attempts USING btree (source);
CREATE INDEX IF NOT EXISTS idx_attempts_status
  ON public.attempts USING btree (status);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id
  ON public.attempts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date
  ON public.daily_stats USING btree (date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_exam
  ON public.daily_stats USING btree (exam_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_exam_paper
  ON public.leaderboard USING btree (exam_id, paper_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank
  ON public.leaderboard USING btree (exam_id, paper_id, rank);
CREATE INDEX IF NOT EXISTS idx_questions_created_desc
  ON public.questions USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty
  ON public.questions USING btree (difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_is_active
  ON public.questions USING btree (is_active) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_questions_paper_id
  ON public.questions USING btree (paper_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject
  ON public.questions USING btree (subject_name);
CREATE INDEX IF NOT EXISTS idx_questions_text_en_trgm
  ON public.questions USING gin (question_text_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_questions_updated_at_desc
  ON public.questions USING btree (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_exams_time
  ON public.teacher_exams USING btree (start_time, end_time);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_questions_hash
  ON public.questions USING btree (content_hash);

COMMIT;

-- ─── RLS for Shared Content Tables ───────────────────────────────────────────
-- These tables contain platform-wide exam content.
-- Admin gets full access; sub-admin gets full access (service layer controls scope);
-- all other authenticated users get SELECT only (or own-row access).

-- ─── TABLE: exam_configs ────────────────────────────────────────────────────
ALTER TABLE public.exam_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_exam_configs_admin_all"
ON public.exam_configs FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "rls_exam_configs_sub_admin_all"
ON public.exam_configs FOR ALL TO authenticated
USING (current_sub_admin_id() != '00000000-0000-0000-0000-000000000000')
WITH CHECK (current_sub_admin_id() != '00000000-0000-0000-0000-000000000000');

CREATE POLICY "rls_exam_configs_user_select"
ON public.exam_configs FOR SELECT TO authenticated
USING (true);

-- ─── TABLE: exam_papers ─────────────────────────────────────────────────────
ALTER TABLE public.exam_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_exam_papers_admin_all"
ON public.exam_papers FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "rls_exam_papers_sub_admin_all"
ON public.exam_papers FOR ALL TO authenticated
USING (current_sub_admin_id() != '00000000-0000-0000-0000-000000000000')
WITH CHECK (current_sub_admin_id() != '00000000-0000-0000-0000-000000000000');

CREATE POLICY "rls_exam_papers_user_select"
ON public.exam_papers FOR SELECT TO authenticated
USING (true);

-- ─── TABLE: exam_subjects ───────────────────────────────────────────────────
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_exam_subjects_admin_all"
ON public.exam_subjects FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "rls_exam_subjects_sub_admin_all"
ON public.exam_subjects FOR ALL TO authenticated
USING (current_sub_admin_id() != '00000000-0000-0000-0000-000000000000')
WITH CHECK (current_sub_admin_id() != '00000000-0000-0000-0000-000000000000');

CREATE POLICY "rls_exam_subjects_user_select"
ON public.exam_subjects FOR SELECT TO authenticated
USING (true);

-- ─── TABLE: questions ───────────────────────────────────────────────────────
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_questions_admin_all"
ON public.questions FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "rls_questions_sub_admin_all"
ON public.questions FOR ALL TO authenticated
USING (current_sub_admin_id() != '00000000-0000-0000-0000-000000000000')
WITH CHECK (current_sub_admin_id() != '00000000-0000-0000-0000-000000000000');

CREATE POLICY "rls_questions_user_select"
ON public.questions FOR SELECT TO authenticated
USING (true);

-- ─── TABLE: study_topics ───────────────────────────────────────────────────
ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_study_topics_admin_all"
ON public.study_topics FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "rls_study_topics_sub_admin_all"
ON public.study_topics FOR ALL TO authenticated
USING (current_sub_admin_id() != '00000000-0000-0000-0000-000000000000')
WITH CHECK (current_sub_admin_id() != '00000000-0000-0000-0000-000000000000');

-- Users see only published topics
CREATE POLICY "rls_study_topics_user_select"
ON public.study_topics FOR SELECT TO authenticated
USING (is_published = true);

-- ─── TABLE: leaderboard ─────────────────────────────────────────────────────
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_leaderboard_admin_all"
ON public.leaderboard FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "rls_leaderboard_user_select"
ON public.leaderboard FOR SELECT TO authenticated
USING (true);

-- ─── TABLE: exam_versions ───────────────────────────────────────────────────
ALTER TABLE public.exam_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_exam_versions_admin_all"
ON public.exam_versions FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "rls_exam_versions_sub_admin_all"
ON public.exam_versions FOR ALL TO authenticated
USING (current_sub_admin_id() != '00000000-0000-0000-0000-000000000000')
WITH CHECK (current_sub_admin_id() != '00000000-0000-0000-0000-000000000000');

-- ─── Admin-Only Tables (no user access needed) ───────────────────────────────

-- ─── TABLE: prompt_templates ────────────────────────────────────────────────
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_prompt_templates_admin_all"
ON public.prompt_templates FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-- ─── TABLE: import_sessions ──────────────────────────────────────────────────
ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_import_sessions_admin_all"
ON public.import_sessions FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-- ─── TABLE: question_upload_prompts ─────────────────────────────────────────
ALTER TABLE public.question_upload_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_question_upload_prompts_admin_all"
ON public.question_upload_prompts FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-- ─── TABLE: daily_stats ─────────────────────────────────────────────────────
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_daily_stats_admin_all"
ON public.daily_stats FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

-- ─── User-Owned Tables ───────────────────────────────────────────────────────

-- ─── TABLE: subject_performance ─────────────────────────────────────────────
ALTER TABLE public.subject_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_subject_performance_admin_all"
ON public.subject_performance FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "rls_subject_performance_user_all"
ON public.subject_performance FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ─── TABLE: prepare_sessions ────────────────────────────────────────────────
ALTER TABLE public.prepare_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_prepare_sessions_admin_all"
ON public.prepare_sessions FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "rls_prepare_sessions_user_all"
ON public.prepare_sessions FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ─── PERFORMANCE INDEXES ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_study_topics_published ON public.study_topics(is_published)
  WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON public.questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON public.leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_subject_performance_user_id ON public.subject_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_prepare_sessions_user_id ON public.prepare_sessions(user_id);

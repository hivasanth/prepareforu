-- ─── 1. SECURITY HELPER FUNCTIONS (HARDENED) ───────────────────────────────────
-- SECURITY DEFINER functions now include SET search_path for safety.
-- current_sub_admin_id uses COALESCE to prevent silent NULL failures.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.current_sub_admin_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT id FROM public.sub_admins WHERE user_id = auth.uid()),
    '00000000-0000-0000-0000-000000000000'
  );
END;
$$;

-- ─── 2. TABLE: sub_admins ──────────────────────────────────────────────────────
ALTER TABLE public.sub_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_sub_admins_admin_all"
ON public.sub_admins
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL AND is_admin())
WITH CHECK (is_admin());

CREATE POLICY "rls_sub_admins_self_select"
ON public.sub_admins
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- ─── 3. TABLE: users ───────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Admin: Full Access
CREATE POLICY "rls_users_admin_all"
ON public.users
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL AND is_admin())
WITH CHECK (is_admin());

-- User: Self Manage (SELECT)
CREATE POLICY "rls_users_self_select"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND id = auth.uid());

-- User: Self Manage (UPDATE) - Prevents role escalation
CREATE POLICY "rls_users_self_update"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND role = (SELECT role FROM public.users WHERE id = auth.uid()) -- Prevent role changes
  AND educator_id = (SELECT educator_id FROM public.users WHERE id = auth.uid()) -- Prevent educator changes
);

-- Sub-Admin: View Students
CREATE POLICY "rls_users_sub_admin_select"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.sub_admins sa
    WHERE sa.user_id = auth.uid()
    AND users.educator_id = sa.user_id
  )
);

-- ─── 4. TABLE: teacher_exams ───────────────────────────────────────────────────
ALTER TABLE public.teacher_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_teacher_exams_admin_all"
ON public.teacher_exams
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL AND is_admin())
WITH CHECK (is_admin());

CREATE POLICY "rls_teacher_exams_sub_admin_manage"
ON public.teacher_exams
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL AND sub_admin_id = current_sub_admin_id())
WITH CHECK (sub_admin_id = current_sub_admin_id());

CREATE POLICY "rls_teacher_exams_student_select"
ON public.teacher_exams
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM public.sub_admins sa
    JOIN public.users u ON u.educator_id = sa.user_id
    WHERE u.id = auth.uid()
    AND teacher_exams.sub_admin_id = sa.id
  )
);

-- ─── 5. TABLE: teacher_exam_questions ──────────────────────────────────────────
ALTER TABLE public.teacher_exam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_teacher_exam_questions_admin_all"
ON public.teacher_exam_questions
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL AND is_admin())
WITH CHECK (is_admin());

CREATE POLICY "rls_teacher_exam_questions_sub_admin_manage"
ON public.teacher_exam_questions
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.teacher_exams te
    WHERE te.id = teacher_exam_questions.teacher_exam_id
    AND te.sub_admin_id = current_sub_admin_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teacher_exams te
    WHERE te.id = teacher_exam_questions.teacher_exam_id
    AND te.sub_admin_id = current_sub_admin_id()
  )
);

CREATE POLICY "rls_teacher_exam_questions_student_select"
ON public.teacher_exam_questions
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 
    FROM public.teacher_exams te
    JOIN public.sub_admins sa ON te.sub_admin_id = sa.id
    JOIN public.users u ON u.educator_id = sa.user_id
    WHERE u.id = auth.uid()
    AND te.id = teacher_exam_questions.teacher_exam_id
  )
);

-- ─── 6. TABLE: attempts ────────────────────────────────────────────────────────
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_attempts_admin_all"
ON public.attempts
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL AND is_admin())
WITH CHECK (is_admin());

-- User: Manage own attempts (SELECT & INSERT)
CREATE POLICY "rls_attempts_user_select"
ON public.attempts
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "rls_attempts_user_insert"
ON public.attempts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Sub-Admin: View attempts for their exams
CREATE POLICY "rls_attempts_sub_admin_select"
ON public.attempts
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.teacher_exams te
    WHERE te.id = attempts.teacher_exam_id
    AND te.sub_admin_id = current_sub_admin_id()
  )
);

-- ─── 7. PERFORMANCE INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_teacher_exams_sub_admin ON public.teacher_exams(sub_admin_id);
CREATE INDEX IF NOT EXISTS idx_users_educator ON public.users(educator_id);
CREATE INDEX IF NOT EXISTS idx_attempts_teacher_exam ON public.attempts(teacher_exam_id);
CREATE INDEX IF NOT EXISTS idx_teacher_exam_questions_exam ON public.teacher_exam_questions(teacher_exam_id);

-- Optional Optimization: Partial Index for admin lookups
CREATE INDEX IF NOT EXISTS idx_users_admin_only ON public.users(id) WHERE role = 'admin';

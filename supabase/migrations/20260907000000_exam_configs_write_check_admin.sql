-- Admin Overview backend housekeeping (AO-G1/G2), applied LIVE via supabase db query --linked on 2026-09-07.
--
-- G2: exam_configs_write_admin originally declared USING (is_admin()) with WITH CHECK omitted,
-- so Postgres implicitly substituted USING as the row check. Explicit WITH CHECK makes the
-- write guard self-documenting. Semantically IDENTICAL (verified LIVE by role simulation):
--   anon INSERT          -> 42501 privilege denied (no INSERT grant)
--   authenticated user   -> 42501 row-level security policy violation   (denied)
--   admin                -> INSERT allowed, probe row rolled back
ALTER POLICY exam_configs_write_admin ON public.exam_configs
  WITH CHECK (is_admin());

-- G1: DECISION — NO CHANGE. exam_configs_select_all exposing published rows to public is
-- intentional: published exam configs seed user-facing exam lists and signup configuration
-- (src/lib/repositories/exam.repository.ts, src/services/dashboardService.ts), which must work
-- for unauthenticated and regular readers. Admin/sub-admin rows remain gated separately there.
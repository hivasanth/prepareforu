-- =============================================================================
-- MIGRATION: sub_admins RLS policy consolidation + anon TRUNCATE revoke (SA-5)
-- Date: 2026-08-25 (admin sub-admins remediation)
--
-- WHY THIS FILE EXISTS:
--   LIVE carried 7 overlapping RLS policies on public.sub_admins: a modern
--   authenticated-scoped pair (rls_sub_admins_admin_all, ALL +
--   rls_sub_admins_self_select, SELECT) AND five legacy PUBLIC-scoped
--   per-command policies that are fully shadowed by the modern pair. Policies
--   are OR'd per command, so the legacy set adds zero permission — only
--   audit noise and drift risk.
--
-- EQUIVALENCE PROOF (per command, USING / WITH CHECK):
--   SELECT : old = is_admin() ∨ own-row ∨ [admin_all]      → new = same set
--   INSERT : old WITH CHECK = is_admin() ∨ [admin_all]     → new = same
--   UPDATE : old USING = is_admin() ∨ [admin_all];
--            update_admin had NULL WITH CHECK → defaults to its USING,
--            i.e. is_admin() → identical to admin_all's WITH CHECK.
--   DELETE : old USING = is_admin() ∨ [admin_all]          → new = same
--   The dropped policies applied to PUBLIC (roles NULL); anon can never
--   satisfy auth.uid() IS NOT NULL / is_admin(), so effective permissions are
--   unchanged for every role. New set is logically equivalent-or-stricter.
--
-- ALSO:
--   REVOKE TRUNCATE FROM anon (defense-in-depth; RLS does not govern TRUNCATE
--   and no product path requires it). No other grants touched.
--
-- IDEMPOTENT: DROP IF EXISTS + conditional REVOKE. Safe to re-apply.
-- =============================================================================

-- ─── 1. Drop the five legacy PUBLIC-scoped per-command policies ──────────────
DROP POLICY IF EXISTS sub_admins_select_admin ON public.sub_admins;
DROP POLICY IF EXISTS sub_admins_select_own   ON public.sub_admins;
DROP POLICY IF EXISTS sub_admins_insert_admin ON public.sub_admins;
DROP POLICY IF EXISTS sub_admins_update_admin ON public.sub_admins;
DROP POLICY IF EXISTS sub_admins_delete_admin ON public.sub_admins;

-- ─── 2. Revoke TRUNCATE from anon (defense-in-depth) ─────────────────────────
REVOKE TRUNCATE ON public.sub_admins FROM anon;

-- Remaining LIVE state after this migration (unchanged behavior):
--   rls_sub_admins_admin_all    ALL    TO authenticated  USING/WITH CHECK is_admin()
--   rls_sub_admins_self_select  SELECT TO authenticated  USING user_id = auth.uid()

-- =============================================================================
-- MIGRATION: sub_admins provisioning baseline — reproducibility reconciliation
-- Date: 2026-05-01 (back-dated baseline; authored 2026-08-30 during the master
--       sub-admin provisioning/authentication remediation)
--
-- WHY THIS FILE EXISTS (audit finding F2 — out-of-band schema drift):
--   public.sub_admins and the is_sub_admin() helper were created directly in
--   the Supabase SQL Editor; NO migration in this repository creates them.
--   That makes the schema non-reproducible from migrations alone (a fresh
--   `supabase db reset` cannot apply 20260502_rls_hardening.sql, which runs
--   ALTER TABLE public.sub_admins ... and CREATE POLICY on it).
--
--   This file back-fills the missing canonical definition for the objects that
--   ARE part of the product's migrated surface:
--     1. public.sub_admins  — CREATE TABLE IF NOT EXISTS (additive, idempotent;
--        on a LIVE database where the table already exists this is a no-op).
--     2. public.is_sub_admin() — CREATE OR REPLACE with the canonical role
--        semantics used by every RLS policy and RPC in the repo. Superset of
--        guarantees: SECURITY DEFINER, STABLE, pinned search_path (re-matches
--        the ALTER applied later in 20260812000010_topic_exams_remediation.sql).
--
--   It deliberately does NOT define out-of-band sibling functions whose bodies
--   are not in the repository (create_sub_admin/promote_to_admin/
--   demote_from_admin/log_security_event/remove_sub_admin/...) — inventing
--   bodies for objects we have never seen would risk silently overriding a
--   live function with different behavior. Those remain inventoried in the
--   remediation report as reproducibility debt for manual reconciliation.
--
-- IDEMPOTENT: CREATE IF NOT EXISTS / CREATE OR REPLACE / IF NOT EXISTS.
-- Safe to re-apply. On LIVE it is a no-op for the table and upgrades nothing.
-- =============================================================================

-- ─── 1. public.sub_admins ────────────────────────────────────────────────────
-- Column set = the union of every column referenced by migrated code, RLS
-- policies, and Edge Functions:
--   id (PK), user_id, full_name, email, coupon_code, status, created_by,
--   total_referrals, notification_prefs, provision_request_id, created_at.
CREATE TABLE IF NOT EXISTS public.sub_admins (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
  full_name         text NOT NULL DEFAULT '',
  email             text NOT NULL DEFAULT '',
  coupon_code       text NOT NULL DEFAULT '',
  status            text NOT NULL DEFAULT 'active',
  created_by        uuid,
  total_referrals   integer NOT NULL DEFAULT 0,
  notification_prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  provision_request_id text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- RLS is mandatory for this table; enabling repeatedly is a no-op.
ALTER TABLE public.sub_admins ENABLE ROW LEVEL SECURITY;

-- Lookup/perf indexes (IF NOT EXISTS — a live DB may already carry optimised
-- variants, e.g. the historical #21 index from 20260527000001_critical_submit_fixes.sql).
CREATE INDEX IF NOT EXISTS idx_sub_admins_user_id   ON public.sub_admins (user_id);
CREATE INDEX IF NOT EXISTS idx_sub_admins_status    ON public.sub_admins (status);

-- ─── 2. public.is_sub_admin() — canonical reconcile ──────────────────────────
-- Every migrated policy/RPC treats is_sub_admin() as "is the current JWT user
-- a provisioned sub-admin", mirroring is_admin(). Role-first because
-- trg_user_role_change (20260528000001) keeps users.role and the sub_admins
-- profile in lock-step. CREATE OR REPLACE upgrades any existing out-of-band
-- body to this canonical definition; on a fresh DB it creates it so the first
-- in-repo reference (20260520173000) resolves.
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
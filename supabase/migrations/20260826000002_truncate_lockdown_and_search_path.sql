-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Schema-wide TRUNCATE lockdown + DEFINER search_path pinning
--
-- 1. TRUNCATE lockdown
--    Re-audit found `anon` and `authenticated` hold TRUNCATE on nearly every
--    table in the public schema. TRUNCATE is NOT governed by row-level
--    security — an RLS-locked table can still be truncated by any role
--    holding the table-level privilege. PostgREST does not expose TRUNCATE
--    today, but the privilege is pure liability: no application code path
--    ever truncates through the client roles, and any future credential leak
--    would turn this into full-table destruction.
--    → REVOKE TRUNCATE on every current table from both roles, and set
--      default privileges so future tables inherit the same posture.
--
-- 2. search_path pinning (completion of M-1)
--    Pins `SET search_path = 'public'` on EVERY remaining SECURITY DEFINER
--    function in the public schema that still has an unpinned search_path
--    (excluding pg_trgm support functions which live in the extension schema
--    and are not reachable as admin attack surface).
--
-- Append-only: no historical migration is modified.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. TRUNCATE is never an application-role privilege ─────────────────────
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.oid, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  LOOP
    EXECUTE format('REVOKE TRUNCATE ON TABLE %I.%I FROM anon', 'public', r.relname);
    EXECUTE format('REVOKE TRUNCATE ON TABLE %I.%I FROM authenticated', 'public', r.relname);
  END LOOP;
END $$;

-- Future tables inherit the same posture regardless of creator.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE ON TABLES FROM authenticated;

-- ── 2. Pin search_path on every remaining unpinned SECURITY DEFINER fn ─────
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.prosecdef
      AND coalesce((
        SELECT option_value
        FROM pg_options_to_table(p.proconfig)
        WHERE option_name = 'search_path'
      ), '') = ''
      AND p.proname NOT LIKE 'gin\_%'
      AND p.proname NOT LIKE 'gtrgm%'
      AND p.proname NOT IN (
        'set_limit', 'show_limit', 'show_trgm',
        'similarity', 'similarity_dist', 'similarity_op', 'similarity_commutator_op'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = ''public''', r.oid::regprocedure);
  END LOOP;
END $$;

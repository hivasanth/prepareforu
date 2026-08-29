# Ledger reconciliation before any future `supabase db push` / production apply

## Problem
`supabase db push` compares the LOCAL `supabase/migrations/` directory against a
remote `schema_migrations` ledger. The live DB's ledger stops at
`20260706000003` (the last recorded version), but the repo now contains ~10
dated migrations NEWER than that entry that were clearly already applied to
prod out-of-band (e.g. via the Supabase dashboard or a different tool):

- `20260701000004_rls_content_tables.sql` (recorded? — verify)
- `20260705000001_add_min_questions_to_exam_configs.sql`
- `20260706000001_add_exam_state_persistence.sql`
- `20260706000003_isolate_exam_persistence.sql`  ← LAST RECORDED
- `20260721000001_security_rls_and_validation.sql`
- `20260721000002_security_regression_tests.sql`
- `20260721000003_exam_rpc_validation.sql`
- `20260721000004_database_check_constraints.sql`
- `20260803000001_user_status_hardening.sql`
- `20260811000001_user_dashboard_stats.sql` (RENAMED 2026-08-13 → `20260422080151_create_get_user_dashboard_stats_rpc.sql`, matching the live ledger row for the same function — see note below)

If prod objects implied by those files are present (audit already confirmed
`is_admin()`, `rls_attempts_*`, `submit_attempt` owner guards etc. exist live),
then a naive `db push` would try to REPLAY all of them and fail or double-apply.

## Facts established by the 2026-08-12 live audit
- Remote `schema_migrations` last row: `20260706000003`.
- Later objects ARE live (proof of out-of-band apply): `is_admin()`,
  `is_sub_admin()`, `rls_attempts_*` policies, the 5 SECURITY DEFINER RPCs with
  owner guards, `add_admin_settings`, `admin_settings` table, etc.
- Therefore the ledger diverged from reality; a naive push is unsafe.

## Required action (do NOT do this automatically — needs reviewer sign-off)
Before any future apply, mark the already-applied local revisions as applied in
the remote ledger so `db push` only runs the NEW migrations. Two options:

### Option A — record remote rows (preferred, least invasive)
For each revision that is confirmed already live, insert a matching row into
the remote `supabase_migrations.schema_migrations (version, name)` so the
ledger reflects what is actually applied. Only after that does
`supabase db push` become safe to run — it will then only try to apply the
true-next migrations (special cases like the new 20260812_* files). Prefix the
names exactly as they appear on disk.

Confirmed-applied-to-prod candidates to verify BEFORE recording (audit against
the `pg_catalog` + the migration files themselves):
   20260701000004  20260705000001  20260706000001  20260706000003
   20260721000001  20260721000002  20260721000003  20260721000004
   20260803000001

Verification trick: open each file and check for a top-level object that must
exist if it ran (e.g. 20260803000001 → `user_status` column or
`is_status_*`; `user_dashboard_stats` function → recorded live as
`20260422080151`; 260701000004 → `question_counts` view). If present live, record it.

## Dashboard RPC migration — reconciled 2026-08-13
`20260811000001_user_dashboard_stats.sql` was an untracked local reconstruction
of `get_user_dashboard_stats`, whose live ledger row already exists as
`20260422080151 create_get_user_dashboard_stats_rpc` (function body verified
identical at audit time). To keep local history and live history aligned
without touching the remote ledger, the file was renamed to
`20260422080151_create_get_user_dashboard_stats_rpc.sql` so the version matches
the recorded live row and `db push` will not replay it. The corrected function
(FIX-1/2/3) is delivered by the new
`20260813150000_dashboard_security_and_correctness.sql` migration.

### Option B — full re-sync (reset + push)
If QA decides the whole env is fixture-like and reproducible, drop the remote
`schema_migrations` entries and re-run from scratch. NOT recommended: prod has
live data and a reset re-applies ~30 files including content backfills /
merges (20260621180500, 20260622000000) against existing data = dangerous.

## Safe sequence (after recording)
1. Fix the ledger (Option A).
2. Apply ONLY the safe slice: `20260812000001_exam_authorization_rls.sql`
   (ownership guards + ACLs + helper + question_counts). No content policies.
3. Then, ONLY after frontend deploy + data backfill of the 8 NULL
   `exam_selection` users, review `20260812000002_content_isolation_rls.sql`
   and apply if QA signs off on RLS behaviour.

## Notes
- The two new 20260812_* files were intentionally written to be idempotent
  (REVOKE/GRANT + DROP IF EXISTS + DO-block guards) so a mis-ordered push
  fails loudly rather than silently corrupting data.
- Nothing in this bucket has touched prod. Doc for the human reviewer.

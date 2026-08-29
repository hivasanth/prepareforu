# USER_DASHBOARD_SECURITY_AUDIT.md

Phase 6.XA — Page Production Certification Audit · User Dashboard (`/dashboard`)
Read-only security audit.

## S5 — Security

### Access control

- Route is guarded by `AuthGuard` + `RoleGuard allowedRoles={['user']}` and
  `AuthGuard` also redirects `is_active === false` users
  (`Guards.tsx`; `App.tsx:94`).
- The hook receives `user?.id` and `user?.exam_selection` directly from the
  authenticated profile (`UserDashboard.tsx:15,22`).

### Data layer

`fetchDashboardStatsRpc(userId)` passes the caller-supplied `userId` to the RPC
`get_user_dashboard_stats` (`dashboard.repository.ts:9`). The RPC SQL is
**server-side and NOT present in this repository** — no migration in
`supabase/migrations/` defines it.

### Findings

| ID | Severity | Finding | Recommendation | Effort |
| --- | --- | --- | --- | --- |
| USR-SEC-01 | **Verify** | RPC `get_user_dashboard_stats` filters by caller-supplied `p_user_id`; server-side enforcement via `auth.uid()`/RLS is NOT auditable from this repo. Never trust the client id alone. | VERIFY in Supabase that the RPC filters by `auth.uid()`/RLS and returns only the caller's own row. If it trusts `p_user_id`, fix server-side. | 1h verify / 2h fix + test |
| USR-SEC-02 | Info | Recent-attempt list is exam-isolated on the client for cached data via `getAllowedExamIds` (`dashboardService.ts:52-61`) — defense-in-depth on top of server-side auth. | Keep; server query already scoped by user. | — |

### Verdict

**PASS (with one mandatory VERIFY)** — access control is sound on the client;
the RPC enforcement boundary must be confirmed in the database.

## Related sections
S6 (database), S15 (architecture), S17 (implementation readiness).
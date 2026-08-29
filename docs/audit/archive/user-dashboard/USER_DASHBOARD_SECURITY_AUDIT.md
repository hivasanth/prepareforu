# USER DASHBOARD SECURITY AUDIT

> Phase 6.XA — Security review of `/dashboard`. READ-ONLY. Focus: authorization, protected data, role visibility, client exposure.

## 1. Routing & Authorization

- Route: `<Route element={<AuthGuard><UserLayout /></AuthGuard>}>` wraps `/dashboard` (`App.tsx:94-95`).
- `AuthGuard` (`Guards.tsx:29-61`): unauthenticated → `/login`; `is_active === false` → blocked; **admin/sub_admin are allowed through** (`:47-50`).
- **No `RoleGuard` on `/dashboard`.** An authenticated `admin`/`sub_admin` can navigate to the user dashboard (though their primary redirect is their own panel).

**USR-SEC-01 — No role-scoped guard on `/dashboard`.**
- Severity: **Medium** · Confidence: High.
- Evidence: `App.tsx:94` uses only `AuthGuard`; `AuthGuard` explicitly bypasses role checks for privileged roles.
- Impact: Privileged users can view the student-facing dashboard (informational exposure of student UX; not PII of others, but role separation is not enforced).
- Recommendation: FIX — add `RoleGuard allowedRoles={['user']}` to the dashboard route (or gate within `AuthGuard` when `role==='admin'`). Effort 30 min.

## 2. Data Authorization

- `fetchDashboardStatsRpc(userId)` passes the caller-supplied `userId` to RPC `get_user_dashboard_stats` (`dashboard.repository.ts:9`). The hook passes `user?.id` from the authenticated profile (`UserDashboard.tsx:21`).
- **Risk:** client-supplied user id → the RPC **must** re-assert `auth.uid()` inside SQL/RLS. If the RPC trusts the `p_user_id` argument, a user could query another user's stats by swapping the id.

**USR-SEC-02 — Verify RPC enforces `auth.uid()`.**
- Severity: **Medium** · Confidence: Medium (server SQL not in repo).
- Evidence: `dashboard.repository.ts:9` `supabase.rpc('get_user_dashboard_stats', { p_user_id: userId })`; `dashboardService.ts:69`.
- Impact: Potential IDOR (cross-user dashboard stats) if the RPC is `security definer` and does not check `auth.uid() = p_user_id`.
- Recommendation: VERIFY + FIX — confirm `get_user_dashboard_stats` filters by `auth.uid()`/RLS; never trust the client id alone. Effort 1h (verification) / 2h (fix + test).

- Recent-activity path: `attempt.repository.ts:296` `.eq('user_id', userId)` — same pattern; verify RLS on `attempts`.

## 3. Sensitive Exposure / Rendering

- Only the authenticated user's own data is rendered: `full_name`, stats, own attempts.
- No tokens, emails, or admin controls rendered. No role-based conditional UI (e.g. no "admin controls" leak) — clean.
- `global_rank` is displayed as a string from RPC — confirm it never includes a leaderboard-wide PII column.

## 4. Other

- No forms/mutation on the page; no CSRF surface.
- `url('/bg/hero-banner.jpg')` is static public — OK.

## Summary
- **USR-SEC-01** (Medium) — role-scoped guard missing. FIX.
- **USR-SEC-02** (Medium) — verify RPC/RLS enforces `auth.uid()`. VERIFY/FIX.
- No Critical/High issues found on the client surface.
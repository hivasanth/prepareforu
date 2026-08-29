# USER DASHBOARD SECURITY VERIFICATION

> Phase 6.XB — Verification of security findings for `/dashboard`.
> Method: static review of routing guards and client data-access. Server-side SQL verification is out-of-repo.

## Verdict

**PASS** (with a documented server-side verify item).

## USR-SEC-01 — Missing role guard on /dashboard

### Before
The User routes group used `<Route element={<AuthGuard><UserLayout /></AuthGuard>}>`. `AuthGuard` (Guards.tsx:47-51) explicitly lets privileged roles (`admin`, `sub_admin`) through, so an admin account could render the user dashboard layout and its data API.

### After
```tsx
<Route element={<AuthGuard><RoleGuard allowedRoles={['user']}><UserLayout /></RoleGuard></AuthGuard}>
```
`RoleGuard` (Guards.tsx:69-83) checks `allowedRoles.includes(user.role)`; a non-`user` role triggers `logWarn('guard.role.access_denied')` and `<Navigate to="/unauthorized" replace />`. This mirrors the existing `allowedRoles` pattern used by the `/admin` and `/sub-admin` layout guards — no new guard type, no new pattern.

### Behavior
- `user` → unmounted. All user sub-routes (`/dashboard`, `/history`, `/performance`, etc.) inherit the role target.
- `admin` / `sub_admin` → redirected to `/unauthorized` (cannot reach the user data layer).

## USR-SEC-02 — RPC enforces auth.uid() (VERIFY / server-side)

- Scope: `get_dashboard_stats` RPC invoked via `dashboard.repository`. Its SQL is **server-side and not present in this repository**, so no client-side change is possible or appropriate.
- Client side already scopes all queries to `userId = user.id` (the authenticated user), and repository queries filter on `user_id`.
- **Verification outcome (documented, not code-fixed):** the RPC must enforce `auth.uid()` in its `where` clause to prevent cross-user stats. This is a follow-up for a server/`supabase/migrations` owner, not the client. Recorded so it is not lost.

## Data-path checks (client, in-repo)
- `dashboardService` stats/recent attempts are keyed by the current authenticated `userId` (`useUserDashboard` binds `user.id`), with RLS-adjacent `user_id` filters in `dashboard.repository` / `attempt.repository`.
- No secrets, keys, or tokens introduced by this phase.

## Residual
- USR-SEC-02 server RPC confirmation pending server-side access.
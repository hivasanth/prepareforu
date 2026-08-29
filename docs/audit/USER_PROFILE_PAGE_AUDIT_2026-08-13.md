# USER PROFILE PAGE AUDIT — `/profile` (User Panel)

> **Date:** 2026-08-13
> **Scope:** Full engineering + UI/UX + design-system + performance + accessibility + full-stack (service → Supabase → RLS → DB → RPC) audit of the user-panel Profile page (`/profile`).
> **Mode:** AUDIT ONLY — read-only. No source, CSS, tokens, migrations, or RLS were modified. **LIVE Supabase used** (project `xbjhlfwqmcyatblsrhxn`): column/policy/grant/RPC queries plus **auth-simulated RLS probes** (`SET ROLE authenticated` + `request.jwt.claims`). All update probes were no-op (`SET col = col`) or predicate evaluations; the UPDATE probes errored server-side (BE-1) before any row could change. **No row was modified.**
> **Skeleton gold standard:** `/dashboard` — `DashboardStatsGrid` wraps `StatSkeleton decorative` in ONE container `role="status"` live region; `StatSkeleton` mirrors final StatCard geometry (`h-16 sm:h-20 lg:h-24`, icon `w-9 sm:w-11 lg:w-12`, skeleton-surface tokens). Verdict scale: PIXEL-STRUCTURE IDENTICAL / VERY CLOSE / ACCEPTABLE / PARTIAL / POOR / MISSING.

## 1. PAGE IDENTITY

- **Route:** `/profile`
- **Page:** `src/pages/user/UserProfile.tsx` (77 lines, thin composition)
- **Logic hook:** `src/components/profile/useProfile.ts` (197 lines — verify/change-password state machine)
- **Display components:** `ProfileHeader.tsx`, `StatisticsSection.tsx`, `ProfileForm.tsx` (all `src/components/profile/`)
- **Layout wrapper:** `UserLayout` → `SidebarLayout`; nav entry `Profile → /profile` (icon `User`, color `#0891B2`, `src/config/navigation.ts:41`)
- **Guards:** `AuthGuard` (`requireExamSelection=true`) + `RoleGuard(['user'])` (`src/App.tsx:94,105` — `/profile` under the `user` route group)
- **Lazy imported** in `src/App.tsx` (`lazy(() => import('./pages/user/UserProfile'))`)

## 2. ARCHITECTURE — FRONTEND DEPENDENCY MAP

```
Route /profile (lazy) ── AuthGuard + RoleGuard('user')
   └─ UserLayout → SidebarLayout (Nav: Profile, NotificationBell, ThemeToggle)
        └─ UserProfile (page)
             ├─ useProfile()                          (src/components/profile/useProfile.ts)
             │    ├─ useAuth()                        → user (UserProfile), loading, logout
             │    ├─ useToast()                       → showSuccess, ToastContainer
             │    ├─ usePageError()                   → captureServerError (OUTPUT DISCARDED — UX-2)
             │    ├─ useStableFetch()                 → nextId/isStale guard (AR011 pattern)
             │    ├─ authService.reauthenticate()     → supabase.auth.signInWithPassword (BE-5)
             │    ├─ authService.sendPasswordResetWithRedirect()
             │    ├─ authService.updatePassword()     → supabase.auth.updateUser + passwordSchema
             │    └─ setTimeout(logout, 2000) post-change (UX-3)
             ├─ LoadingSkeleton (authLoading || !user)  (plain bars — SKEL-1)
             ├─ ProfileHeader  (premium-neutral Card: avatar, verified dot, name, email, joined)
             ├─ StatisticsSection (Grid cols=4: SELECTED EXAM / ACCURACY / CURRENT STREAK / HIGHEST STREAK)
             └─ ProfileForm    (premium-neutral Card: verify → change-password → logout)
```

- The page itself makes **zero direct data fetches** — all profile values flow from `AuthContext.user` (populated by `getProfile` → `findUserById` at boot/login). This is a deliberate read-only design (`src/components/profile/README.md`) and is a positive.
- Password change goes through Supabase **auth API** (`auth.updateUser`), not the `users` table — so the page is unaffected by the `users`-table write breakage below (BE-1), but `reauthenticate` bypasses all security controls (BE-5).

## 3. ARCHITECTURE — BACKEND / DATA-FLOW DEPENDENCY MAP

```
Profile page (read path — WORKS)
   AuthContext.getProfile(userId) → userRepository.findUserById(userId)
        └─ supabase.from('users').select('*').eq('id', userId).maybeSingle()
              └─ users (RLS SELECT: self-only — VERIFIED: cross-user rows = 0)   [BE-9 ✓]
   AuthContext.user.streak / longest_streak / overall_accuracy / exam_selection
        └─ users columns — streak/longest_streak NEVER maintained; accuracy stale   [BE-7 ✗]

Profile page (write path — auth API)
   reauthenticate()   → supabase.auth.signInWithPassword  (NO gateway/lockout)     [BE-5 ✗]
   updatePassword()   → supabase.auth.updateUser({password})  (passwordSchema)      [OK]
   sendPasswordResetWithRedirect() → auth.resetPasswordForEmail                     [OK]

Downstream direct users-writes that ARE broken live (not on this page, but same table):
   updateUserExamSelection (SignupPage) / updateUser (toggleUserStatus, removeSubAdmin,
   updateSubAdminProfile)  → supabase.from('users').update(...) → 42P17 recursion     [BE-1 ✗]
```

## 4. FRONTEND VERDICTS (summary table)

| ID | Severity | Area | One-line |
|---|---|---|---|
| SKEL-1 | MEDIUM | Skeleton | Loading state = plain `LoadingSkeleton` bars; no `role="status"` live region; does not mirror StatCard/header/form geometry; includes a title bar that doesn't exist in the final layout — verdict **PARTIAL** |
| A11-1 | MEDIUM | Accessibility | Form labels (Current/New/Confirm Password) rendered without `htmlFor` → not associated with the inputs that already carry `id` |
| A11-2 | MEDIUM | Accessibility (shared) | Password show/hide buttons get accessible names `"Eye"`/`"EyeOff"` via `RightIcon.displayName` fallback — not "Show/Hide password" |
| DS-1 | MEDIUM | Design-system | `StatisticsSection` uses legacy `color` prop with arbitrary hex `#F59E0B`/`#6366F1` instead of semantic `status` tokens (StatCard documents `status` as preferred) |
| UX-1 | MEDIUM | UX/error-flow | `authLoading || !user` renders skeleton — no distinct error/empty state; page has no ErrorContainer/Retry path (dashboard does) |
| A11-3 | LOW | Accessibility | Verified badge dot is a plain `<div aria-label="Verified account">` with no `role="img"` |
| A11-4 | LOW | Accessibility (shared) | `Button loading` applies opacity + `pointer-events-none` but no `aria-busy` |
| UX-2 | LOW | Code-quality | `captureServerError` output (`state`/`error`/`retry` from `usePageError`) is never read → dead error-state wiring |
| UX-3 | LOW | UX/code | Post-update logout uses un-cleaned `setTimeout` (mitigated by `isStale` guard) |

## 5. BACKEND / SECURITY VERDICTS

| ID | Severity | Verdict | One-line |
|---|---|---|---|
| BE-1 | CRITICAL | **FAIL** | Direct `public.users` UPDATE errors with **42P17 infinite recursion** for every role (self, cross-user, admin) — the `WITH CHECK` subqueries in `rls_users_self_update` / `users_update_own` reference `users` under RLS |
| BE-2 | HIGH | **PARTIAL/FAIL** | At the RLS layer a user may update ANY column of their own row (incl. `role`, `coupon_code`, `sub_admin_id`, `email_verified`, `email`); only `prevent_user_role_escalation` (trigger) actually stops role/educator/`is_active` — and only because BE-1 errors all updates |
| BE-3 | HIGH | **FAIL (drift)** | Account-lockout columns `failed_login_attempts`/`locked_until` are UPDATE-able by `authenticated` LIVE; the `REVOKE UPDATE(...)` in local migration `20260521000000_account_lockout.sql:139` is not in effect |
| BE-4 | MEDIUM | **PARTIAL** | `users` has 7 SELECT / 6 UPDATE / 2 INSERT / 1 ALL policies; the legacy permissive set (`Users can update own profile`, `Users can only update their own profile`, `Users can only see their own profile`, `Allow user to insert own profile`) plus `users_update_own/users_update_admin/users_select_own/users_select_admin` are **LIVE-ONLY** (absent from all local migrations) |
| BE-5 | MEDIUM | **FAIL** | `reauthenticate` (password re-verification gate) calls `signInWithPassword` directly — no `security-gateway` (rate-limit/Turnstile), no `is_account_locked`, no `record_failed_login` on failure; login/signup enforce all of these |
| BE-6 | MEDIUM | **PARTIAL** | `findUserById` does `select('*')` → `coupon_code`, `sub_admin_id`, `educator_id`, `failed_login_attempts`, `locked_until`, `email_verified` shipped to the browser (own row only; no IDOR) |
| BE-7 | MEDIUM | **FAIL** | Profile stats read never-maintained `users.streak`/`longest_streak` (0 for ALL live users) and stale `users.overall_accuracy` — dashboard computes these live → cross-page inconsistency |
| BE-8 | PASS | OK | Account-lockout RPCs (`is_account_locked`, `record_failed_login`, `reset_failed_login`, `log_security_event`) exist LIVE and EXECUTE is granted to `authenticated`; `get_user_accuracy` correctly restricted (exec NOT granted) |
| BE-9 | PASS | OK | RLS SELECT isolation holds — regular-user probe sees own row only (cross-user count = 0) |
| BE-10 | INFO | OK | Role escalation is not currently exploitable: recursion (BE-1) blocks every update AND the trigger reverts role/educator/`is_active`; **defense by error — must not be relied on** (see fix ordering) |

## 6. FINDINGS — DETAILED (EVIDENCE FORMAT)

### BE-1 — CRITICAL — Direct `public.users` UPDATE is broken for ALL roles (RLS infinite recursion, 42P17)
- **FILE/SYMBOL:** live policy `rls_users_self_update` (source: `supabase/migrations/20260803000001_user_status_hardening.sql:30-40`) — `WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.users WHERE id = auth.uid()) AND ...)`
- **FILE/SYMBOL:** live policy `users_update_own` (LIVE-ONLY, no local migration) — `WITH CHECK ((auth.uid() = id) AND (role = (SELECT users_1.role FROM users users_1 WHERE users_1.id = auth.uid())))`
- **OBSERVATION:** both policies embed a subquery on `public.users` inside their `WITH CHECK`. PostgreSQL applies RLS to that inner query and then re-evaluates the same policies → infinite recursion detected (`42P17`) for **every** UPDATE on `users`, regardless of caller.
- **LIVE PROBES (all `SET ROLE authenticated` + `request.jwt.claims`, all no-op `SET col = col`):**
  1. Self UPDATE (`WHERE id = auth.uid()`) → `ERROR 42P17 infinite recursion detected in policy for relation "users"`.
  2. Cross-user UPDATE → same 42P17.
  3. Admin-simulated (`sub` = `833df519-…` admin) UPDATE on a student row → same 42P17.
- **IMPACT:** any `PATCH/POST` against `/rest/v1/users` fails today. Confirmed broken consumers: `updateUserExamSelection` (`user.repository.ts:16-22`) → SignupPage selection-only onboarding (`SignupPage.tsx:116`); `updateUser` (`user.repository.ts:34-42`) → `toggleUserStatus` (`userService.ts:189`), `removeSubAdmin` role revert (`userService.ts:246-250`), `updateSubAdminProfile` (`userService.ts:312`). The `/profile` page is not on this write path (password changes via auth API) but the same table it reads is write-broken system-wide.
- **SEVERITY:** CRITICAL (latent, currently masked because client write paths that remain are RPC-based; any future direct write fails).

### BE-2 — HIGH — RLS layer permits unrestricted self-write; only the trigger actually guards privileged columns
- **FILE/SYMBOL:** live policies `Users can update own profile` (`WITH CHECK` NULL → USING `auth.uid() = id` used as the new-row check), `Users can only update their own profile` (`WITH CHECK auth.uid() = id`), both TO PUBLIC, LIVE-ONLY.
- **FILE/SYMBOL:** `prevent_user_role_escalation()` trigger (`20260803000001_user_status_hardening.sql:46-72`, live) — reverts `role`/`educator_id`/`is_active` for non-admins; does **not** cover `coupon_code`, `sub_admin_id`, `email_verified`, `email`, `failed_login_attempts`, `locked_until`.
- **OBSERVATION:** because RLS combines policies with OR, the permissive legacy policies make the newer restrictive `WITH CHECK`s (`rls_users_self_update`, `users_update_own`) moot at the RLS layer. Predicate evaluation of a self role-escalation new row: permissive check `auth.uid() = id` → **true**; restrictive `role = (self role)` with `role='admin'` → false; net `escalation_allowed = true`.
- **IMPACT:** currently neutralized by BE-1 (the update errors first). If BE-1 is fixed without first removing the permissive policies, a self `PATCH users {role:'admin'}` is accepted by RLS; `is_admin()` reads `users.role` (`20260502_rls_hardening.sql:5-18`) so this is real admin elevation. Even today, the lockout/linkage fields (`sub_admin_id`, `coupon_code`) are RLS-writable by the account owner. Defense relies on one SECURITY DEFINER trigger (single point of failure, silent revert).
- **SEVERITY:** HIGH (blocked-for-now; must be closed **together with** BE-1).

### BE-3 — HIGH — Account-lockout columns writable by `authenticated` (migration drift)
- **FILE/SYMBOL:** `supabase/migrations/20260521000000_account_lockout.sql:139-141` — `REVOKE UPDATE (failed_login_attempts, locked_until) ON public.users FROM authenticated;`
- **LIVE EVIDENCE:** `information_schema.column_privileges` shows `authenticated` (and `anon`) still hold `UPDATE` on `failed_login_attempts` and `locked_until`.
- **IMPACT:** a locked account could self-clear `locked_until` / reset `failed_login_attempts` via a direct PATCH — the exact bypass the migration was written to prevent. Today it is blocked **only** because BE-1 makes all updates error. If BE-1 is fixed first, this becomes exploitable.
- **SEVERITY:** HIGH (requires fix ordering — remediate before/with BE-1).

### BE-4 — MEDIUM — Policy sprawl + unversioned policies on `users`
- **LIVE EVIDENCE:** `pg_policy` on `public.users` → 16 policies: `rls_users_admin_all`(*), `rls_users_self_select`(r), `rls_users_self_update`(w), `rls_users_sub_admin_select`(r) — versioned (`20260502_rls_hardening.sql`); **LIVE-ONLY** (not in any migration): `Users can only see their own profile`, `Users can only update their own profile`, `Users can update own profile`, `Allow user to insert own profile`, `users_select_admin`, `users_select_own`, `users_update_admin`, `users_update_own`, plus `Educators can view their linked students`. Roles: the legacy set is TO PUBLIC (`{}`), the `rls_*` set is TO `authenticated`.
- **OBSERVATION:** overlapping intent (own-select ×3, own-update ×2, admin-select ×2, admin-update ×2); `users_update_admin` has no `WITH CHECK`; anon holds table-level INSERT/UPDATE/DELETE grants (RLS blocks because all policies require `auth.uid()`, but the grants are over-broad).
- **IMPACT:** hard to reason about/secure; the permissive subset is the root of BE-2; the self-referential subset is the root of BE-1. Unversioned policies are invisible to `supabase db push`.
- **SEVERITY:** MEDIUM.

### BE-5 — MEDIUM — `reauthenticate` bypasses all security controls
- **FILE/SYMBOL:** `src/services/authService.ts:538-540` — `reauthenticate()` = bare `supabase.auth.signInWithPassword({email, password})`.
- **FILE/SYMBOL:** contrast — `loginWithEmail` (`authService.ts:303-368`) runs `checkSecurityGateway` (rate-limit + Turnstile), `is_account_locked`, then `record_failed_login` on wrong password / `reset_failed_login` on success.
- **OBSERVATION:** the profile page's "Verify Access" step (the gate before changing a password — a sensitive operation) sends unlimited `signInWithPassword` attempts with no rate limiting, no Turnstile, no account-lockout awareness, and does not increment `failed_login_attempts`.
- **IMPACT:** an attacker holding a session token can brute-force the account password through the profile page; a locked-out account's password re-verification is not gated by the lockout it is supposed to enforce.
- **SEVERITY:** MEDIUM.

### BE-6 — MEDIUM — `findUserById` selects all `users` columns (over-fetch to client)
- **FILE/SYMBOL:** `src/lib/repositories/user.repository.ts:6-14` — `supabase.from('users').select('*')`.
- **OBSERVATION:** the browser receives `coupon_code`, `sub_admin_id`, `educator_id`, `failed_login_attempts`, `locked_until`, `is_active`, `email_verified` for every logged-in user (via `AuthContext.user`). RLS confines it to the owner's row (BE-9 ✓), so this is data-minimization, not IDOR.
- **IMPACT:** unnecessary exposure of internal fields; lockout state and coupon linkage are developer-visible in DevTools for a self row; also the delivery vehicle for the stale stats in BE-7.
- **SEVERITY:** MEDIUM (minimization); LOW (practical exposure).

### BE-7 — MEDIUM — Profile statistics come from never-maintained `users` columns
- **FILE/SYMBOL:** `src/components/profile/StatisticsSection.tsx:30-32` — `user.overall_accuracy ?? 0`, `user.streak ?? 0`, `user.longest_streak ?? 0`.
- **LIVE EVIDENCE:**
  - `users.streak` / `users.longest_streak`: **0 rows** with non-zero values in the entire DB (`SELECT count(*) WHERE streak<>0 OR longest_streak<>0` → 0). No function writes them (only 1 function references the column = the read-side dashboard RPC).
  - `users.overall_accuracy` / `users.total_exams`: hot-row maintenance removed by `20260527000001_critical_submit_fixes.sql` (accuracy now computed lazily via `get_user_accuracy()`); live rows carry stale pre-fix values (e.g. `overall_accuracy = 30.00` for an active user).
- **IMPACT:** the profile page shows **CURRENT STREAK 0 DAYS / HIGHEST STREAK 0 DAYS forever** and a stale ACCURACY, while `/dashboard` shows the computed values (`get_user_dashboard_stats` — verified LIVE as the FIX-3 version computing streak/accuracy from `attempts`). Cross-page data inconsistency with a misleading "Verified Performance Metrics" label.
- **SEVERITY:** MEDIUM (data correctness).

### BE-8 — PASS — Lockout/auth RPC layer is live and correctly granted
- **LIVE EVIDENCE:** `is_account_locked`, `record_failed_login`, `reset_failed_login`, `log_security_event`, `check_user_exists`, `validate_coupon` all present, SECURITY DEFINER, EXECUTE granted to `authenticated`; `get_user_accuracy` present but EXECUTE NOT granted (backend-internal only).
- **SEVERITY:** N/A (positive).

### BE-9 — PASS — RLS SELECT isolation verified live
- **LIVE PROBE:** as `authenticated` (amar) with claims: own row = 1, cross-user rows = 0. No cross-user read for a regular user.
- **SEVERITY:** N/A (positive).

### BE-10 — INFO — Role escalation currently blocked by error + trigger (defense by error)
- Role escalation via RLS is not exploitable today: every update fails (BE-1) and `prevent_user_role_escalation` reverts role/educator/`is_active`. This is **fragile defense** — it disappears the moment BE-1 is fixed, which is why BE-1/BE-2/BE-3 must be remediated as one batch (see fix plan ordering).

---

### SKEL-1 — MEDIUM — Loading skeleton is PARTIAL (does not meet the dashboard gold standard)
- **FILE/SYMBOL:** `src/pages/user/UserProfile.tsx:17-31` — `LoadingSkeleton height={180}` / `height={40} width={200}` title / `Grid cols={4}` of `height={100}` bars / `height={400}` form bar.
- **FILE/SYMBOL (reference):** `src/components/user/dashboard/DashboardStatsGrid.tsx:17-20` — one `<div role="status" aria-live="polite" aria-label="Loading dashboard stats">` wrapping `StatSkeleton decorative`; `StatSkeleton` (`SharedComponents.tsx:43-63`) mirrors StatCard geometry (`h-16 sm:h-20 lg:h-24`, icon `w-9 sm:w-11 lg:w-12`, skeleton-surface tokens).
- **OBSERVATION / DELTAS:**
  1. **No live region** — the entire loading branch has zero `role="status"`/`aria-live`; the dashboard gold standard mandates ONE container `role="status"` per section.
  2. **Geometry mismatch** — stat bars are `100px` tall vs final StatCard `h-16 sm:h-20 lg:h-24` (64/80/96px) and are plain bars, not StatCard-mirroring `StatSkeleton` (missing icon box + label/value bar structure).
  3. **Phantom title bar** — a `200×40` bar is rendered, but the final layout has no title above the stats grid (the "Academic Statistics" heading sits inside `StatisticsSection`, which the skeleton does not model).
  4. **Header/form approximations** — `180px` vs real `ProfileHeader` (~200-240px card), `400px` vs real `ProfileForm` card (~700px+).
- **VERDICT:** **PARTIAL** (structure present, fidelity absent, no live-region semantics).
- **SEVERITY:** MEDIUM.

### A11-1 — MEDIUM — Form labels are not associated with their inputs
- **FILE/SYMBOL:** `src/components/profile/ProfileForm.tsx:85,167,190` — `<Label className="text-[12px] uppercase tracking-widest">Current Password</Label>` (and New/Confirm) with **no `htmlFor`**; the inputs DO carry `id="currentPass"/"newPass"/"confirmPass"` (`:102,174,197`).
- **FILE/SYMBOL (component supports it):** `Label` renders a native `<label>` with `htmlFor` passthrough (`AntigravityTypography.tsx:58-64`).
- **OBSERVATION:** screen readers cannot associate the visible label text with the field; the placeholder text acts as a de-facto name. Fix is a one-line `htmlFor={inputId}` per field.
- **SEVERITY:** MEDIUM.

### A11-2 — MEDIUM — Password toggle buttons are announced as "Eye"/"EyeOff"
- **FILE/SYMBOL:** `src/components/common/AntigravityForm.tsx:64` — `aria-label={RightIcon.displayName || 'Input action'}`. ProfileForm passes `Eye`/`EyeOff` icons (`ProfileForm.tsx:106,177,197`) → accessible names literally "Eye"/"EyeOff".
- **OBSERVATION:** shared `Input` gap; the three toggles on this page (Current/New/Confirm) get meaningless names; they should be "Show password"/"Hide password" and toggle as state changes.
- **SEVERITY:** MEDIUM (shared component, page impact).

### DS-1 — MEDIUM — StatisticsSection uses legacy `color` prop with arbitrary hex values
- **FILE/SYMBOL:** `src/components/profile/StatisticsSection.tsx:29-32` — `color="var(--primary)"`, `color="var(--success)"`, `color="#F59E0B"`, `color="#6366F1"`.
- **FILE/SYMBOL (contract):** `AntigravityCard.tsx:96-111` — `status` is the preferred semantic prop; `color` is the documented "Legacy escape hatch".
- **OBSERVATION:** arbitrary hexes (`#F59E0B`, `#6366F1`) are not theme status tokens (dashboard uses `status="warning"` = `--color-warning`, `status="secondary"` = `--color-secondary`); `color` bypasses the theme-aware text/icon token so light/dark adaptation of the icon tint is not guaranteed.
- **SEVERITY:** MEDIUM (design-system conformance).

### UX-1 — MEDIUM — No error/empty state on the page (skeleton-only failure mode)
- **FILE/SYMBOL:** `src/pages/user/UserProfile.tsx:17` — `if (profile.authLoading || !profile.user) return skeleton`.
- **OBSERVATION:** "loading" and "no user" are conflated. If profile resolution fails after retries (`getProfile` budget exhausted), `user` is null and the page renders an **infinite skeleton** rather than an error with retry. AuthGuard redirects to `/login` in the common case, masking this, but there is no in-page error surface (compare `DashboardStatsGrid` error branch → `ErrorContainer` + `RetryButton`, `DashboardStatsGrid.tsx:21-26`).
- **SEVERITY:** MEDIUM.

### A11-3 — LOW — Verified badge dot: `aria-label` on a plain div
- **FILE/SYMBOL:** `src/components/profile/ProfileHeader.tsx:26` — `<div className="absolute ... bg-success ..." aria-label="Verified account" />` — no `role="img"` (the avatar div at `:20-22` correctly has `role="img"`).
- **SEVERITY:** LOW.

### A11-4 — LOW — Loading buttons lack `aria-busy`
- **FILE/SYMBOL:** `AntigravityButton.tsx:31-33,107-133` — `loading` adds opacity + `cursor-not-allowed` + `pointer-events-none` and swaps in a spinner, but no `aria-busy`. During "Verify Access"/"Commit Changes", assistive tech gets no state change announcement.
- **SEVERITY:** LOW (shared).

### UX-2 — LOW — `captureServerError` result is discarded (dead error-state wiring)
- **FILE/SYMBOL:** `src/components/profile/useProfile.ts:88,109,146` — `captureServerError(err, { retryFn })`; the returned `state`/`error`/`retry` from `usePageError` (`usePageError.ts:135-236`) are never read; the page uses its own `error` string + toast instead.
- **OBSERVATION:** the retry function is stored but unreachable from the UI; the error-store state machine runs silently. Either surface it or drop the calls.
- **SEVERITY:** LOW.

### UX-3 — LOW — Post-update logout `setTimeout` has no cleanup
- **FILE/SYMBOL:** `src/components/profile/useProfile.ts:138-142` — `setTimeout(async () => { if (!isStale(id)) await logout() }, 2000)`; the timer is not cleared on unmount (the `isStale` guard prevents a late logout after a *later* action, but a navigation within the 2s window still forces a logout).
- **SEVERITY:** LOW.

## 7. ARCHITECTURE / DESIGN-SYSTEM / ACCESSIBILITY POSITIVES

- **Read-only page, single data source:** no direct fetches; profile flows from `AuthContext` — consistent, cached, and the AR011 `useStableFetch` guard pattern is applied to all mutations.
- **Password change is auth-API based** (`auth.updateUser`) with shared `passwordSchema` validation on both client and `updatePassword` (`authService.ts:441-459`).
- **Form a11y already correct in places:** `aria-invalid` + `aria-describedby` wired to error spans with `aria-live="polite"` (`ProfileForm.tsx:104-105,126-130`); password-requirement badges use `role="list"`/`role="listitem"`; auth-conflict panel uses `role="alert"`.
- **State machine discipline:** verify → change → logout flow with `submittedRef`/blur revalidation; success toasts on verify and update.
- **Responsive/design-system:** `PageContainer max-w-[1280px]`, `Stack gap={48}` consistent with dashboard; `Grid cols={4}` = `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`; `StatCard`/`Card premium-neutral`/`PageTransition` all standard primitives; avatar scales `w-24→md:w-32`, `ProfileHeader` stacks on mobile (`flex-col md:flex-row`).
- **RLS read-isolation is sound** (BE-9) and the lockout RPC set is live and properly granted (BE-8).
- **No perf concerns:** page is static after auth load; skeleton is cheap; no N+1, no repeated fetches, no heavy lists.

## 8. RECOMMENDED FIX PLAN

> **Ordering constraint:** BE-1, BE-2, BE-3 are interdependent. Fixing BE-1 (recursion) *without* closing BE-2/BE-3 first un-blocks role escalation and lockout self-clear. Apply as one coordinated DB change, deployed with the RLS test suite.

### P0 (fix first, security / availability)
- **FIX-1 (BE-1):** Replace the self-referential `WITH CHECK` subqueries in `rls_users_self_update` and `users_update_own` (drop/rewrite the LIVE-ONLY `users_update_own`; rewrite `rls_users_self_update` using a non-recursive form — e.g. drop the inline `users` subqueries and rely on the existing `prevent_user_role_escalation` trigger + column-level REVOKEs for `role`/`educator_id`/`is_active`). Validate with a live no-op UPDATE probe as `authenticated` (must return the row, not 42P17).

### P1 (security — must ship in the same batch as FIX-1)
- **FIX-2 (BE-2):** Drop the legacy TO PUBLIC update policies (`Users can update own profile`, `Users can only update their own profile`); keep a single self-update policy restricted to writable columns (`full_name`, `exam_selection`, `last_activity_date`), with `role`/`educator_id`/`is_active`/`is_admin`/`coupon_code`/`sub_admin_id`/`email_verified`/lockout columns excluded or guarded by the trigger.
- **FIX-3 (BE-3):** Re-apply `REVOKE UPDATE (failed_login_attempts, locked_until) ON public.users FROM authenticated` (and `anon`) — confirm live via `column_privileges`.
- **FIX-4 (BE-5):** Route `reauthenticate` through the same controls as login: `checkSecurityGateway('/auth/reauthenticate')` + `is_account_locked` pre-check + `record_failed_login` on wrong password + `reset_failed_login` on success (add `captchaToken` passthrough from `ProfileForm`).

### P2 (data correctness / minimization)
- **FIX-5 (BE-7):** Compute profile stats from the live RPC — reuse `get_user_dashboard_stats` (or a new profile-stats RPC) for CURRENT STREAK / HIGHEST STREAK / ACCURACY instead of the `users` columns; remove or backfill the dead `streak`/`longest_streak` columns afterwards. Fixes the "0 DAYS forever" and stale-accuracy inconsistency.
- **FIX-6 (BE-6):** Narrow `findUserById` to the columns the profile actually needs (create a `profile_view` or explicit column list); stop shipping lockout/coupon/internal fields to the client.

### P3 (frontend polish / conformance)
- **FIX-7 (SKEL-1):** Replace the profile skeleton with `Skeleton`-family placeholders: one container `role="status" aria-live="polite" aria-label="Loading profile"` wrapping a header-shaped `Skeleton type="card"`, a `StatSkeleton` mirroring StatCard geometry, and a form card placeholder; remove the phantom title bar.
- **FIX-8 (A11-1):** Add `htmlFor` on the three password `Label`s (`currentPass`/`newPass`/`confirmPass`).
- **FIX-9 (A11-2, shared):** Accept an explicit accessible name for `Input` right-icon buttons (e.g. `rightIconAriaLabel` or derive from `type`), falling back to current behavior; pass "Show/Hide password" from `ProfileForm`.
- **FIX-10 (DS-1):** Switch `StatisticsSection` to `status` tokens (`status="accent"/"success"/"warning"/"secondary"`), removing `#F59E0B`/`#6366F1`.
- **FIX-11 (UX-1):** Add a distinct error branch (skeleton only while `authLoading`; `ErrorContainer` + retry when `user` is null after init).
- **FIX-12 (A11-3/A11-4):** Add `role="img"` to the verified badge dot; add `aria-busy` to the shared `Button` loading state.
- **FIX-13 (UX-2/UX-3):** Surface or drop the `captureServerError` store; clear the logout `setTimeout` on unmount.

## 9. BACKEND SECURITY VERDICT

**Overall: PARTIAL/FAIL.** The `/profile` page's own write surface (password change via Supabase auth) is sound and its read path is RLS-isolated and correct (BE-8/BE-9 ✓). However this audit surfaced a **system-wide CRITICAL** defect on the very table the page reads: `public.users` cannot be directly updated by any client role (42P17 recursion), the RLS layer is littered with legacy permissive policies that would permit self-role/escalation and lockout self-clear the moment the recursion is fixed, and the account-lockout REVOKE intended to protect those columns is not live. The reauthentication gate also bypasses every login control. These are remediation-ordering-sensitive: FIX-1 → FIX-2/FIX-3 must land together, verified by the existing `20260721000002_security_regression_tests.sql` pattern plus live no-op probes.

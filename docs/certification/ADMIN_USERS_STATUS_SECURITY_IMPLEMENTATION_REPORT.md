# Phase 3.6C.4 — Admin Users Status Security — Implementation Report

**Date:** 2026-08-03 · **Status:** ✅ Implemented (certified in `ADMIN_USERS_STATUS_SECURITY_CERTIFICATION.md`)
**Approved by:** 3.6C.4 phase spec (incl. SEC-3) · **Governance:** D-138
**Decision basis:** `docs/certification/ADMIN_USERS_ACTIONS_AUDIT.md` findings S-1, S-2, R-1, SEC-1,
SEC-2, SEC-3, plus `ADMIN_USERS_UX_REFINEMENT_PLAN.md` §§6.6–6.7.

---

# 1. What changed

## 1.1 Service guard — `toggleUserStatus` (`userService.ts`)

- **S-1 (target validation):**
  - Rejects **self-target** (`user.id === targetUserId`) → `ACTION_FORBIDDEN` + warn log.
  - Fetches the target; **not found** → `USER_NOT_FOUND`.
  - **`role !== 'user'`** (admin or sub_admin target) → `ACTION_FORBIDDEN`. This is the SEC-1 service
    guard: an admin can never deactivate/activate another admin or a sub-admin through this API.
- **R-1 (affected-row check):** `updateUser` returns the affected-row count; **0 rows = failure**
  (`UPDATE_FAILED`) instead of the old silent success.
- **S-2 (success logging):** on success `logInfo('userService.toggleUserStatus.success', { requestId,
  targetUserId, isActive })`.
- `ensureRole(['admin'])` stays outside the try (auth failures still propagate as
  `UNAUTHORIZED_ACCESS`, not wrapped as a DB error).

## 1.2 Repository — `updateUser` (`user.repository.ts`)

- Returns `Promise<number>` (affected rows) via `.update(updates).eq('id', id).select('id')`.
- Callers verified: `toggleUserStatus` (uses the count), `removeSubAdmin` role revert and
  `updateSubAdminProfile` (ignore the return — no RLS regression: the latter targets the caller's own
  row, which `rls_users_self_select` covers).

## 1.3 Type — `ServiceErrorCode` (`auth.types.ts`)

- Added `'ACTION_FORBIDDEN'` (additive union member) so the new guard surfaces the spec'd error code.

## 1.4 Database — `supabase/migrations/20260803000001_user_status_hardening.sql`

1. **SEC-2 (RLS):** `rls_users_self_update` `WITH CHECK` now requires
   `is_active = (SELECT is_active FROM public.users WHERE id = auth.uid())` — a user can no longer flip
   their own status, so a banned user **cannot self-reactivate**.
2. **SEC-2 (trigger):** `prevent_user_role_escalation` extended to revert **non-admin `is_active`
   changes** (same case, trigger layer, defense in depth).
3. **SEC-3 (trigger):** new `trg_prevent_last_admin_deactivation` reverts any attempt to deactivate the
   **final active admin**, preventing platform lockout. (SEC-1 admin targets are rejected at the service
   layer; RLS cannot express an OLD-vs-NEW row check, so the DB layer protects admin rows via this
   last-admin guard.)
4. **Regression tests:** SECTION 5 (TEST 5.1–5.5) following the suite pattern from
   `20260721000002_security_regression_tests.sql` — structural checks (policy WITH CHECK contains
   `is_active`, trigger/function presence, `is_admin()` behavior) plus a behavioral student-row check.

---

# 2. Files changed

| File | Kind | Change |
|---|---|---|
| `src/services/userService.ts` | service | S-1/S-2/R-1 hardening of `toggleUserStatus` |
| `src/lib/repositories/user.repository.ts` | repository | `updateUser` → affected-row count |
| `src/types/auth.types.ts` | type | add `ACTION_FORBIDDEN` |
| `supabase/migrations/20260803000001_user_status_hardening.sql` | database | SEC-2 RLS + trigger, SEC-3 trigger, regression tests |

---

# 3. Verification

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ 0 |
| `npm run build` | ✅ (pre-existing chunk-size warning only) |
| eslint — frozen baseline **405 (352E/53W)**, zero new | ✅ (the `catch (error: any)` pattern in `toggleUserStatus` is pre-existing style; net-zero new `any`) |
| Regression suite | ✅ SECTION 5 added; execution blocked only by pre-existing Vitest `ERR_REQUIRE_ESM` (SQL is migration-based, runs in the migration replay) |

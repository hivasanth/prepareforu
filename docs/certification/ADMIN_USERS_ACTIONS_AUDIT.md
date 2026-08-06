# ADMIN USERS — ACTIONS AUDIT (Phase 3.6C, Parts 3–4)

**Date:** 2026-08-03 · **Status:** ⏸ AWAITING APPROVAL (no code changed)
**Scope:** every administrative action on `/admin/users`, traced UI → Hook → Service → Repository →
Database → Security. Deactivate is audited first and in full (highest priority); all other actions are
covered by the Action Matrix (§6).

---

# Part 3 — Deactivate Action: Full-Chain Audit

## 3.1 UI

| Check | Evidence | Verdict |
|---|---|---|
| Button component | `Button size="xs"` in `UsersTable.tsx:111-119` (`variant={u.is_active ? 'danger' : 'success'}`) | ✅ certified `AntigravityButton` |
| Variant | `danger` for Deactivate (filled danger), `success` for Activate | ✅ destructive affordance present |
| Disabled state | **none** — the row button is never disabled while a toggle is in flight | ⚠ finding A-1 |
| Loading state | **none** — `loading` prop never passed; no per-row in-flight state exists | ⚠ finding A-2 |
| Double-click prevention | row click → `setConfirmToggle({id, currentStatus})` opens modal; a second same-tick row click overwrites the state → still one modal | ✅ acceptable |
| Focus state | global `:focus-visible` outline rule (`index.css:653`) applies to the button | ✅ present |

## 3.2 Confirmation (`ConfirmModal`)

| Check | Evidence | Verdict |
|---|---|---|
| Component | `ConfirmModal` (`SharedComponents.tsx:168`) over certified `AdminModal` | ✅ |
| User identification | **none** — message is "Are you sure you want to deactivate this user account?" with no name/email; the admin cannot verify the target | ⚠ finding C-1 (HIGH) |
| Warning copy | no consequence copy (user loses access; can be re-activated later) | ⚠ finding C-2 |
| Destructive emphasis | `danger={h.confirmToggle?.currentStatus}` → confirm `Button variant="danger"` | ✅ |
| Accessibility | `role="dialog"`, `aria-modal`, focus trap, Escape close, labelled by title (`AdminModal.tsx:76`) | ✅ |
| Focus on open | `initialFocus: false` — nothing is auto-focused; for a destructive confirm the safe default is to land focus on **Cancel** | ⚠ finding C-3 (minor) |

## 3.3 Hook (`useAdminUsers`)

| Check | Evidence | Verdict |
|---|---|---|
| Handler | `handleToggleRequest(id, currentStatus)` → `setConfirmToggle`; `handleConfirmToggle` runs on confirm | ✅ |
| Loading | **none** — no `togglingId`/pending state; UI never reflects in-flight | ⚠ A-1/A-2 |
| Optimistic update | `setOptimisticStatus(prev => ({...prev, [id]: newStatus}))` (`useAdminUsers.ts:109`) | ✅ |
| Rollback | on failure `delete next[id]` restores the server-fetched `data.rows` value (`:123-127`) | ✅ |
| Error handling | sets `actionError` (page `Alert`), logs; **no error toast** | ⚠ finding H-1 |
| Double-submit | `confirmToggle` guard `if (!confirmToggle) return`; `setConfirmToggle(null)` closes modal. Same-tick double confirm (two clicks before re-render) can pass the guard twice → duplicate identical `UPDATE`s + double refetch | ⚠ finding H-2 (low) |
| Refetch | success → `fetchData()`; `fetchIdRef` guards stale fetches | ✅ |

## 3.4 Service (`userService.toggleUserStatus`)

| Check | Evidence | Verdict |
|---|---|---|
| Method | `toggleUserStatus(ctx, targetUserId, isActive)` (`userService.ts:142-163`) | ✅ |
| Payload | `{ is_active: isActive }` via `userRepo.updateUser` | ✅ |
| Authorization | `ensureRole({ allowedRoles: ['admin'], operation: 'toggleUserStatus' })` | ✅ admin-only |
| Target validation | **none** — no existence check, no `role='user'` check, no self/other-admin guard | ⚠ finding S-1 (HIGH) |
| Request id | `requestId: user_toggle_${Date.now()}` passed by the hook | ✅ passed |
| Logging | failure logged (`userService.toggleUserStatus.error`); **success not logged**; requestId not echoed in the success path | ⚠ finding S-2 |
| Idempotency | none — a second identical toggle is a second `UPDATE` (harmless at DB level, duplicate requests only) | ℹ️ documented |

## 3.5 Repository (`user.repository.updateUser`)

| Check | Evidence | Verdict |
|---|---|---|
| Update | `supabase.from('users').update(updates).eq('id', id)` (`user.repository.ts:34-40`) | ✅ single statement |
| Delete | not used — status toggle is an `UPDATE`, never a `DELETE` | ✅ |
| Transaction | not needed (single statement) | ✅ |
| Retry | none at repository layer | ℹ️ tolerated (optimistic UI) |
| Rollback | none at repository layer — rollback is owned by the hook's optimistic state | ✅ documented |
| Affected-row check | none — `updateUser` returns `void`; a non-existent id silently "succeeds" (Supabase returns no error, 0 rows) | ⚠ finding R-1 |

## 3.6 Database — what deactivation actually does

```
UPDATE users SET is_active = FALSE WHERE id = '<target>'
```

- **It is an `UPDATE` of the soft-disable flag `is_active` — NOT a `DELETE`.** No rows are removed; all
  user data, attempts, answers, and associations remain intact.
- **Effect on the target:** `AuthGuard` (`Guards.tsx:42-45`) treats `is_active === false` as a disabled
  account → redirects to `/login?error=disabled`. Because the profile is held in client state, the block
  takes effect on the user's **next load / refresh** (no realtime push / forced sign-out of live sessions).
- **Re-activation:** `UPDATE users SET is_active = TRUE` restores access immediately (Activate button).

## 3.7 Security (full stack)

| Layer | Guard | Verdict |
|---|---|---|
| Route | `AuthGuard` + `RoleGuard allowedRoles={['admin']}` on `/admin` (`App.tsx:109`) | ✅ admin-only page |
| Service | `ensureRole({allowedRoles:['admin']})` (`userService.ts:149-154`) | ✅ admin-only |
| Repository→DB | RLS `rls_users_admin_all` `FOR ALL` `USING/WITH CHECK (is_admin())` (`20260502_rls_hardening.sql:55-60`) | ✅ admin can update any user |
| Sub-admin escalation | sub_admin → `ensureRole` denies (`allowedRoles` is `['admin']` only); direct Supabase write → `is_admin()` false → RLS denies | ✅ no privilege escalation |
| **Self-protection** | **none** — an admin may `updateUser(user.id, {is_active:false})` on their own row or another admin's via the API (the UI hides admins because the list filters `role='user'`, but service+RLS do not) | ⚠ finding SEC-1 (HIGH) |
| **ROOT admin protection** | **none** — no root/super-admin concept in `is_admin()` or the service; the only "root-ish" id (`833df519-…` main-admin fallback in `20260528000001_role_switching_fixes.sql:39`) is not protected | ⚠ finding SEC-1 |
| **Self re-activation by banned user** | `rls_users_self_update` (`20260502_rls_hardening.sql:70-79`) constrains own-row updates only on `role`/`educator_id` equality, **not `is_active`**; the `prevent_user_role_escalation` trigger (`20260527000002_batch_two_fixes.sql:19-41`) also only guards `role`/`educator_id`. A banned user with a valid session can set their own `is_active=true` directly | ⚠ finding SEC-2 (HIGH) |
| Last-admin / platform lockout | **none** — nothing prevents deactivating the final active admin | ⚠ finding SEC-3 |
| Escalation to `role` change | blocked at DB (trigger + `rls_users_self_update`) and no service path changes roles here | ✅ |

## 3.8 Error handling

| Check | Evidence | Verdict |
|---|---|---|
| Rollback | optimistic key removed on failure → UI falls back to server truth | ✅ |
| Toast | success toast shown (`showSuccess`) · **error has no toast** — only the `actionError` `Alert` | ⚠ H-1 |
| Retry | success → automatic refetch; failure → no auto-retry (user re-clicks; button shows original status after rollback) | ✅ documented |
| User-safe message | "Failed to update user status. Please try again." / "User activated/deactivated successfully." | ✅ no internal leakage |

## 3.9 Success flow (as built)

```
Click Deactivate  →  setConfirmToggle({id, currentStatus})
  →  ConfirmModal opens (danger confirm, no user name)
  →  Confirm  →  handleConfirmToggle
       →  optimistic: optimisticStatus[id] = false   (UI flips immediately)
       →  modal closes
       →  service toggleUserStatus(userId, false)
            →  ensureRole(admin) ✓
            →  repo updateUser(id, {is_active:false})
                 →  RLS is_admin() ✓
                 →  UPDATE users SET is_active = FALSE …
       →  success → actionError cleared → success toast → fetchData() re-syncs
```

## 3.10 Failure flow (as built)

```
Click Deactivate → Confirm → optimistic flip
  →  service toggleUserStatus throws / returns success:false
       →  hook catch → optimisticStatus[id] removed  (UI recovers original row)
       →  logError → actionError set → Alert "Action failed" at top of page
       →  (no error toast, no auto-retry)
```

## 3.11 Edge cases

| Edge | Behaviour today | Verdict |
|---|---|---|
| Deactivate yourself | UI impossible (list is `role='user'` only); service/RLS **allow** it | ⚠ SEC-1 (defense-in-depth gap) |
| Deactivate ROOT | no root concept; another admin CAN be deactivated via API | ⚠ SEC-1/SEC-3 |
| Deactivate already-inactive user | button already reads "Activate" (status-driven) | ✅ |
| Network failure | service → `success:false` → rollback + Alert | ✅ |
| Duplicate clicks | row click → single modal (state overwrite); confirm same-tick double-fire possible (identical updates) | ⚠ H-2 (low) |
| Stale state | another admin changes status concurrently → this row's optimistic flip is overwritten by `fetchData()` (server truth); last-write-wins | ✅ acceptable |
| Race conditions | `fetchIdRef` guards fetch races; toggle-vs-refetch resolves on refetch | ✅ acceptable |

---

# Part 4 — Action Matrix

| Action | Present? | Trigger | Authz (service) | RLS | Optimistic | Rollback | Error surfacing | Findings |
|---|---|---|---|---|---|---|---|---|
| **Deactivate** | ✅ | row `Button danger` → ConfirmModal | `ensureRole(['admin'])` | `rls_users_admin_all` | ✅ | ✅ | `Alert` (no toast) | A-1/A-2, C-1/C-2/C-3, H-1/H-2, S-1/S-2, R-1, SEC-1/2/3 |
| **Activate** | ✅ | row `Button success` → ConfirmModal | same as Deactivate (same service) | same | ✅ | ✅ | same | identical chain, severity identical |
| View | ❌ not present | — | — | — | — | — | — | no row-detail/drill-down exists |
| Delete (hard) | ❌ not present | — | — | — | — | — | — | deactivation IS the destructive action; no hard delete in UI or service |
| Edit | ❌ not present | — | — | — | — | — | — | no user-edit surface |
| Reset Password (future) | — | not implemented | would need `ensureRole(['admin'])` + auth-admin RPC | — | — | — | — | not in scope today |
| Assign Exam (future) | — | not implemented | would need admin + RLS check | — | — | — | — | not in scope today |

**Page-level (non-row) actions audited:** Search (`Input`, debounced 300ms, resets page) · Status
filter (`CollectionFilter`, default `active`) · Exam tabs (`?exam=` URL) · Pagination (1-based ↔
0-based map, disabled at bounds) · Retry (`fetchData`, shown in `EmptyState` when `usersError`) ·
Toggle confirm (row). All read-only except the status toggle.

---

# Findings register (all PENDING approval)

| ID | Severity | Layer | Finding | Proposed fix (approval) |
|---|---|---|---|---|
| C-1 | HIGH | ConfirmModal | no user identification in the deactivate confirm | include name + email in title/message |
| S-1 | HIGH | Service | no target validation (self / other-admin / non-user target) | validate target `role='user'`, reject self + admin targets |
| SEC-1 | HIGH | Service+RLS | admin can deactivate self/other admin via API (no defense in depth) | service guard + RLS `WITH CHECK` on `is_active` for admin-role rows |
| SEC-2 | HIGH | RLS | banned user can self-reactivate (`is_active` not constrained) | `rls_users_self_update` `WITH CHECK` + trigger forbid self `is_active` change |
| SEC-3 | MED | DB | no last-admin / platform lockout guard | optional trigger guard (decision needed) |
| C-2 | MED | ConfirmModal | no consequence warning copy | add consequence line |
| A-1/A-2 | MED | Hook+UI | no per-row loading/disabled while in flight | `togglingId` state → `loading` + `disabled` on row button and confirm |
| H-1 | MED | Hook | failure has no error toast (Alert only) | surface error toast too |
| H-2 | LOW | Hook | same-tick double confirm possible | re-entry ref lock + confirm `loading` |
| S-2 | LOW | Service | success path not logged; requestId not echoed | `logInfo` on success incl. target + requestId |
| R-1 | LOW | Repository | `updateUser` returns void; 0-row update silently succeeds | return affected count; service treats 0 rows as failure |
| C-3 | LOW | Modal | nothing auto-focused on destructive open | focus cancel on open (a11y) |

# Phase 3.6C.4 — Admin Users Status Security — Certification

**Status:** ✅ **CERTIFIED** (2026-08-03)
**Governance:** D-138 · **Basis:** `ADMIN_USERS_ACTIONS_AUDIT.md` + 3.6C.4 phase spec
**Scope:** service guard + repository affected-row + RLS/trigger migration + regression tests.

---

# 1. Findings resolved

| ID | Severity | Finding | Fix delivered |
|---|---|---|---|
| S-1 | HIGH | no target validation (self / other-admin / non-user) | ✅ self-target, not-found, and `role !== 'user'` (admin/sub_admin) all rejected → `ACTION_FORBIDDEN` / `USER_NOT_FOUND` |
| SEC-1 | HIGH | admin can deactivate self/other admin via API | ✅ service guard rejects admin/sub_admin targets (defense in depth: DB protects admin rows via SEC-3 last-admin trigger) |
| SEC-2 | HIGH | banned user can self-reactivate (`is_active` unguarded) | ✅ RLS `WITH CHECK` requires `is_active` unchanged + trigger reverts non-admin `is_active` changes |
| SEC-3 | MED | no last-admin / platform lockout guard | ✅ `trg_prevent_last_admin_deactivation` reverts deactivation of the final active admin |
| S-2 | LOW | success not logged; requestId not echoed | ✅ `logInfo` on success with `requestId` + target |
| R-1 | LOW | `updateUser` returns void; 0-row update silently succeeds | ✅ returns affected count; service treats 0 as failure |

---

# 2. Defense-in-depth matrix (post)

| Layer | Toggle a student | Banned user self-reactivate | Deactivate an admin | Deactivate last active admin |
|---|---|---|---|---|
| Route (`AuthGuard`+`RoleGuard`) | ✅ admin only | n/a | ✅ admin only | ✅ admin only |
| Service (`ensureRole` + S-1) | ✅ allowed | n/a | ⛔ rejected | ⛔ rejected |
| RLS `rls_users_self_update` | n/a | ⛔ `is_active` must be unchanged | n/a | n/a |
| Trigger `prevent_user_role_escalation` | ✅ (admin path unaffected) | ⛔ reverts non-admin `is_active` | n/a (caller is admin) | n/a |
| Trigger `prevent_last_admin_deactivation` | ✅ (student rows not guarded) | n/a | allowed only if another active admin remains | ⛔ reverted |

---

# 3. Verification gate

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (pre-existing warnings only) |
| eslint — frozen baseline **405 (352E/53W)**, zero new | ✅ |
| Migration idempotent / additive | ✅ DROP-then-CREATE for the policy + trigger; `CREATE OR REPLACE` for functions |
| Regression tests | ✅ TEST 5.1–5.5 added in the migration (suite pattern preserved) |

---

# 4. Certification statement

All six security findings are closed with layered defense in depth across service, repository, RLS,
and triggers. The Users status toggle is now safe against self/other-admin targeting, self-reactivation
by banned users, and platform lockout. The gate passes at the frozen lint baseline.

**Certified:** ✅ 2026-08-03 · **Governance:** D-138

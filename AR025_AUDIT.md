# AR-025: Admin Permission Architecture Audit

**Phase:** 6.25 — Authorization & Permission Verification (Admin)
**Date:** 2026-07-22
**Status:** ✅ COMPLETE
**Effort:** 0.5 day (audit only — removal candidates identified)

---

## Step 1 — Repository Authorization Inventory

### Pattern Match Summary

| Pattern | Matches | Key Locations | Layer | Status |
|---------|---------|---------------|-------|--------|
| `isAdmin(` | 9 | 7 Admin pages + 1 component + 1 hook | Page/Event | ⚠️ Defense-in-depth |
| `RoleGuard(` | 2 | `App.tsx:109,122` | Route | ✅ Canonical |
| `allowedRoles` | 49 | 5 service files + guards | Service/Route | ✅ Centralized |
| `ensureRole(` | 38 | 5 service files | Service | ✅ Business permission |
| `Navigate to="/unauthorized"` | 8 | `Guards.tsx:79` + 7 Admin pages | Route/Page | ⚠️ Duplicated x7 |
| `GuardLoader` | 20 usage, 1 def | 8 Admin pages + 3 guard defs | Page/Route | ⚠️ Duplicated x8 |
| `user.role` | 16 | Multiple files | Various | — |
| `hasPermission` | 0 | — | — | ❌ Not used |
| `permissions` (source) | 0 | — | — | ❌ Not used |
| `canCreate/canEdit/canDelete/canPublish/canManage` | 0 | — | — | ❌ Not used |

### `isAdmin()` Call Sites — Admin Pages

| File | Line | Pattern | Type |
|------|------|---------|------|
| `AdminUsers.tsx` | 84 | `if (!isAdmin(user)) return <Navigate to="/unauthorized" />` | Page guard |
| `AdminUpload.tsx` | 54 | `if (!isAdmin(user)) return <Navigate to="/unauthorized" />` | Page guard |
| `AdminTopics.tsx` | 233 | `if (!isAdmin(user)) return <Navigate to="/unauthorized" />` | Page guard |
| `AdminSubAdmins.tsx` | 82 | `if (!isAdmin(user)) return <Navigate to="/unauthorized" />` | Page guard |
| `AdminSettings.tsx` | 149 | `if (!isAdmin(user)) return <Navigate to="/unauthorized" />` | Page guard |
| `AdminQuestions.tsx` | 147 | `if (!isAdmin(user)) return <Navigate to="/unauthorized" />` | Page guard |
| `AdminLeaderboard.tsx` | 62 | `if (!isAdmin(user)) return <Navigate to="/unauthorized" />` | Page guard |
| **Subtotal** | **7** | **Identical pattern** | **Category B** |

### Event-Level `isAdmin()` Checks

| File | Line | Pattern | Event Handler | Category |
|------|------|---------|---------------|----------|
| `AdminQuestions.tsx` | 116 | `if (!isAdmin(user)) return showToast(...)` | `handleConfirmDelete` | **C** — Business protection |
| `AdminSettings.tsx` | 107 | `if (!isAdmin(user)) return showError('Unauthorized')` | `handleSave` | **C** — Business protection |
| `useBulkUpload.ts` | 313 | `if (!isAdmin(authUser)) return showToast(...)` | `handleSavePrompt` | **C** — Business protection |
| `useBulkUpload.ts` | 346 | `if (!isAdmin(authUser)) return showToast(...)` | `handleDeletePrompt` | **C** — Business protection |
| `useBulkUpload.ts` | 503 | `if (!isAdmin(authUser)) return showToast(...)` | `handleUpload` | **C** — Business protection |
| `SingleQuestionModal.tsx` | 97 | `if (!isAdmin(user)) throw new Error(...)` | `handleSubmit` | **C** — Business protection |

### `GuardLoader` Usage

| File | Pattern | Line | Redundant? |
|------|---------|------|:----------:|
| `Guards.tsx` (AuthGuard) | `if (loading) return <GuardLoader />` | 33 | ✅ Definition |
| `Guards.tsx` (RoleGuard) | `if (loading \|\| !user \|\| !user.role)` | 74 | ✅ Definition |
| `Guards.tsx` (GuestGuard) | `if (loading) return <GuardLoader />` | 89 | ✅ Definition |
| `AdminOverview.tsx` | `if (loading) return <GuardLoader />` | 32 | ⚠️ Redundant with AuthGuard |
| `AdminUsers.tsx` | `if (authLoading) return <GuardLoader />` | 83 | ⚠️ Redundant with AuthGuard |
| `AdminUpload.tsx` | `if (authLoading) return <GuardLoader />` | 53 | ⚠️ Redundant with AuthGuard |
| `AdminTopics.tsx` | `if (authLoading) return <GuardLoader />` | 232 | ⚠️ Redundant with AuthGuard |
| `AdminSubAdmins.tsx` | `if (authLoading) return <GuardLoader />` | 81 | ⚠️ Redundant with AuthGuard |
| `AdminSettings.tsx` | `if (authLoading) return <GuardLoader />` | 148 | ⚠️ Redundant with AuthGuard |
| `AdminQuestions.tsx` | `if (authLoading) return <GuardLoader />` | 146 | ⚠️ Redundant with AuthGuard |
| `AdminLeaderboard.tsx` | `if (authLoading) return <GuardLoader />` | 61 | ⚠️ Redundant with AuthGuard |

---

## Step 2 — Route Authorization Audit

### Admin Route Guard Chain

| Route | Guard Chain | Allowed Roles | Owner |
|-------|-------------|---------------|-------|
| `/admin/*` | `AuthGuard` → `RoleGuard(['admin'])` → `AdminLayout` | `admin` | `App.tsx:109` |

### Verification

| Check | Status | Evidence |
|-------|--------|----------|
| AuthGuard present | ✅ | Wraps all `/admin/*` routes |
| RoleGuard present | ✅ | `RoleGuard allowedRoles={['admin']}` |
| allowedRoles correct | ✅ | `['admin']` only |
| Redirect on failure | ✅ | `<Navigate to="/unauthorized" replace />` in `Guards.tsx:79` |
| Loading state | ✅ | `GuardLoader` in both AuthGuard and RoleGuard |
| Single authorization owner | ⚠️ | Route layer is canonical, but 7 pages repeat the check |

### Navigate to="/unauthorized" — All Sources

| Source | Layer | Owner |
|--------|-------|-------|
| `src/guards/Guards.tsx:79` (RoleGuard) | Route | ✅ Canonical |
| `AdminUsers.tsx:84` | Page | ⚠️ Redundant |
| `AdminUpload.tsx:54` | Page | ⚠️ Redundant |
| `AdminTopics.tsx:233` | Page | ⚠️ Redundant |
| `AdminSubAdmins.tsx:82` | Page | ⚠️ Redundant |
| `AdminSettings.tsx:149` | Page | ⚠️ Redundant |
| `AdminQuestions.tsx:147` | Page | ⚠️ Redundant |
| `AdminLeaderboard.tsx:62` | Page | ⚠️ Redundant |

---

## Step 3 — Admin Page Audit

### Page Classification

| Page | File | Page Authorization | Event Authorization | Duplicate? | Category |
|------|------|--------------------|---------------------|------------|----------|
| Overview | `AdminOverview.tsx` | None | None | No | **A** — Clean |
| Users | `AdminUsers.tsx` | `isAdmin()` + `GuardLoader` | None | Yes | **B** — Duplicates RoleGuard |
| Questions | `AdminQuestions.tsx` | `isAdmin()` + `GuardLoader` | `isAdmin()` in delete | Yes/Partial | **B+C** |
| Topics | `AdminTopics.tsx` | `isAdmin()` + `GuardLoader` | None | Yes | **B** — Duplicates RoleGuard |
| Upload | `AdminUpload.tsx` | `isAdmin()` + `GuardLoader` | None (handled by hook) | Yes | **B** — Duplicates RoleGuard |
| Settings | `AdminSettings.tsx` | `isAdmin()` + `GuardLoader` | `isAdmin()` in save | Yes/Partial | **B+C** |
| SubAdmins | `AdminSubAdmins.tsx` | `isAdmin()` + `GuardLoader` | None | Yes | **B** — Duplicates RoleGuard |
| Leaderboard | `AdminLeaderboard.tsx` | `isAdmin()` + `GuardLoader` | None | Yes | **B** — Duplicates RoleGuard |

### Detail by Category

**Category A** — No page authorization (correct):
| Page | Reason |
|------|--------|
| `AdminOverview.tsx` | Only has `if (loading)` — no role check. Relies entirely on route-layer `RoleGuard` |

**Category B** — Page authorization duplicates RoleGuard (candidate removal):
| Page | Duplicate Pattern | Lines |
|------|-------------------|-------|
| `AdminUsers.tsx` | `GuardLoader` + `isAdmin() + Navigate` | 2 |
| `AdminUpload.tsx` | `GuardLoader` + `isAdmin() + Navigate` | 2 |
| `AdminTopics.tsx` | `GuardLoader` + `isAdmin() + Navigate` | 2 |
| `AdminSubAdmins.tsx` | `GuardLoader` + `isAdmin() + Navigate` | 2 |
| `AdminSettings.tsx` | `GuardLoader` + `isAdmin() + Navigate` | 2 |
| `AdminQuestions.tsx` | `GuardLoader` + `isAdmin() + Navigate` | 2 |
| `AdminLeaderboard.tsx` | `GuardLoader` + `isAdmin() + Navigate` | 2 |

**Category C** — Business permission (must remain):
| Event | Location | Pattern | Reason |
|-------|----------|---------|--------|
| Delete question | `AdminQuestions.tsx:116` | `isAdmin()` check | Destructive action — defense-in-depth before DB call |
| Save settings | `AdminSettings.tsx:107` | `isAdmin()` check | Configuration mutation |
| Save/delete prompts | `useBulkUpload.ts:313,346` | `isAdmin()` check | Prompt management |
| Upload questions | `useBulkUpload.ts:503` | `isAdmin()` check | Bulk data mutation |
| Submit question | `SingleQuestionModal.tsx:97` | `isAdmin()` check | Question CRUD modal |

---

## Step 4 — Event-Level Permission Audit

### All Event-Level Authorization Checks

| Event | Guard | Layer | Justified? |
|-------|-------|-------|:----------:|
| `AdminQuestions.handleConfirmDelete` | `isAdmin(user)` | Page event handler | ✅ Business — destructive action |
| `AdminSettings.handleSave` | `isAdmin(user)` | Page event handler | ✅ Business — config mutation |
| `useBulkUpload.handleSavePrompt` | `isAdmin(authUser)` | Hook event handler | ✅ Business — prompt mutation |
| `useBulkUpload.handleDeletePrompt` | `isAdmin(authUser)` | Hook event handler | ✅ Business — prompt deletion |
| `useBulkUpload.handleUpload` | `isAdmin(authUser)` | Hook event handler | ✅ Business — bulk upload |
| `SingleQuestionModal.handleSubmit` | `isAdmin(user)` | Component event handler | ✅ Business — question mutation |

**All event-level checks are Category C (business protection). None are redundant.**

### Pattern Separation

| Type | Count | Verdict |
|------|:-----:|---------|
| Route authorization | 2 (`AuthGuard` + `RoleGuard`) | ✅ Canonical |
| Page-level re-checks (`isAdmin()+Navigate`) | 7 | ⚠️ **Redundant with RoleGuard** |
| Event-level defensive checks (`isAdmin()+toast`) | 6 | ✅ Business permission — must remain |
| Loading guards (`GuardLoader`) | 8 | ⚠️ **Redundant with AuthGuard + RoleGuard** |

---

## Step 5 — Service Layer Audit

### Service Authorization Inventory

| Service | `ensureRole` Count | Allowed Roles | Resource Ownership | Status |
|---------|:-----------------:|---------------|-------------------|--------|
| `adminService.ts` | 8 | `['admin']` only | No | ✅ Correct |
| `adminQuestionService.ts` | 7 | `['admin','sub_admin']` (6), `['admin']` (1) | No | ✅ Correct |
| `topicsService.ts` | 4 | `['admin','sub_admin']` | No | ✅ Correct |
| `userService.ts` | 6 | Mixed | Yes (`resourceOwnerId`) | ✅ Correct |
| `teacherExamService.ts` | 13 | Mixed | Yes (`resourceOwnerId`) | ✅ Correct |
| `leaderboardService.ts` | 0 | — | — | ✅ No auth needed (read-only) |
| `examService.ts` | 0 | — | — | ✅ No auth needed (read-only) |
| `authService.ts` | 0 | — | — | ✅ Authentication itself |

**Service layer already provides sufficient authorization.** The `ensureRole()` calls create a defense-in-depth layer at the data access boundary. Critically, even if a page-level `isAdmin()` check were removed, the service layer would still block unauthorized access.

---

## Step 6 — Ownership Matrix

| Responsibility | Current Owner | Correct Owner | Duplicate? |
|---------------|--------------|---------------|:----------:|
| Authentication | `AuthGuard` (Guards.tsx) | Route layer | ✅ Single owner |
| Route authorization (Admin) | `RoleGuard(['admin'])` (App.tsx) | Route layer | ✅ Single owner (canonical) |
| Page-level role re-check | 7 Admin pages (`isAdmin()`+`Navigate`) | Route layer | ⚠️ **7 duplicates** |
| Page-level loading guard | 8 Admin pages (`GuardLoader`) | Route layer | ⚠️ **8 duplicates** |
| Event-level business protection | 6 event handlers (`isAdmin()`+toast) | Page/Component | ✅ Must remain |
| Service authorization | `ensureRole()` in 5 services | Service layer | ✅ Single owner |
| Resource ownership | `ensureRole()` + `resourceOwnerId` | Service layer | ✅ Single owner |
| Navigation | `ADMIN_NAV` config | Layout | ✅ Single owner |
| UI visibility (tabs) | `AdminSelectionTabs.tsx` role checks | Component | ✅ Business rule |

---

## Step 7 — Repository Search

### Pattern Search: Event-Level Authorization

| Pattern | Total Matches | Admin-Related | Classification |
|---------|:-------------:|:-------------:|----------------|
| `disabled={` | 50+ | 0 | UI state only — not permission-related |
| `hidden={` | 0 | 0 | Not used |
| `showError(` with "Unauthorized" | 2 | 2 | Business — must remain |
| `showToast(` with "Unauthorized" | 4 | 4 | Business — must remain |
| `isAdmin(` | 13 total, 9 UI | 9 | 7 page guard (B), 6 event (C) |

### Separation

| Type | Count | Classification |
|------|:-----:|----------------|
| **Defensive checks** (Category C — business) | 6 | `isAdmin()` + toast/error in event handlers |
| **Redundant route authorization** (Category B) | 7 | `isAdmin()` + Navigate at page top |
| **Redundant loading guards** (Category B) | 8 | `GuardLoader` at page top |

---

## Step 8 — Dead Code Audit

### Permission Helpers

| Helper | Location | Imported? | Verdict |
|--------|----------|:---------:|---------|
| `ROLE_ACCESS` | `authUtils.ts:8` | ❌ 0 importers | **Unused** — remove candidate |
| `hasAdminPrivileges` | `authUtils.ts:31` | ❌ 0 importers | **Unused** — remove candidate |
| `isAdmin` | `authUtils.ts:17` | ✅ 8 UI files | Active |
| `isSubAdmin` | `authUtils.ts:24` | ⚠️ Internal only | Active definition |
| `ensureRole` | `authUtils.ts:48` | ✅ 5 service files | Active |

### Duplicate Authorization Patterns (Admin Pages)

| Pattern | Files | Lines Each | Total | Verdict |
|---------|:-----:|:----------:|:-----:|---------|
| `if (authLoading) return <GuardLoader />` | 7 | 1 | **7** | Redundant with AuthGuard |
| `if (loading) return <GuardLoader />` | 1 | 1 | **1** | Redundant with AuthGuard |
| `if (!isAdmin(user)) return <Navigate to="/unauthorized" replace />` | 7 | 1 | **7** | Redundant with RoleGuard |
| `import { GuardLoader } from '../../guards/Guards'` | 8 | 1 | **8** | Redundant (if removed) |
| `import { isAdmin } from '../../utils/authUtils'` | 7 | 1 | **7** | Would reduce to event-only |
| `import { Navigate } from 'react-router-dom'` (for guard) | 6 | 1 | **6** | Redundant (if removed) |

**Total duplicate lines in Admin pages (removable): ~36 lines**

### Dead Code Summary

| Item | Lines | Severity | Recommendation |
|------|:-----:|:--------:|----------------|
| `ROLE_ACCESS` constant | 4 | Low | Remove |
| `hasAdminPrivileges` function | 3 | Low | Remove |
| Page guard duplication (7 pages) | ~21 | Medium | Remove — route handles it |
| Loading guard duplication (8 pages) | ~8 | Low | Remove — route handles it |
| Import duplication | ~21 | Low | Remove alongside guards |

---

## Step 9 — Dependency Graph

```
Protected Route (/admin/*)
        │
        ▼
AuthGuard ─── src/guards/Guards.tsx
  ├── authentication check
  ├── disabled account check
  └── exam selection redirect (bypassed for admin)
        │
        ▼
RoleGuard ─── src/guards/Guards.tsx
  ├── allowedRoles.includes('admin')
  └── Navigate to="/unauthorized" (canonical)
        │
        ▼
AdminLayout ─── src/layouts/AdminLayout.tsx
  ├── ADMIN_NAV config
  └── SidebarLayout wrapper
        │
        ▼
AdminPage* ─── src/pages/admin/*.tsx
  ├── [CURRENT: GuardLoader + isAdmin() + Navigate] ⚠️ REDUNDANT
  └── Calls service functions
        │
        ▼
Service Layer ─── src/services/*.ts
  ├── ensureRole() business permission check
  └── resourceOwnerId isolation
        │
        ▼
Repository Layer ─── src/lib/repositories/*.ts
  └── Data access (no authorization)
```

### Cycles and Ownership

| Check | Status |
|-------|--------|
| Zero cycles | ✅ |
| Single authorization owner at route layer | ✅ |
| Business permissions isolated in service layer | ✅ |
| AdminOverview (no page auth) is the reference pattern | ✅ |
| 7 pages with redundant auth checks | ⚠️ |
| Service layer as defense-in-depth for event handlers | ✅ |

---

## Step 10 — Scope Validation

### Outcome Assessment

#### Outcome A — Admin authorization duplication exists (Implementation justified)

**PARTIALLY CONFIRMED.** Page-level duplication is objectively verified:
- 7 pages have `isAdmin()` + `Navigate` identical to RoleGuard
- 8 pages have `GuardLoader` identical to AuthGuard
- But event-level checks are business permissions (must remain)

#### Outcome B — Route authorization is already centralized (Backlog stale)

**CONFIRMED for route layer.** Route `RoleGuard(['admin'])` is the canonical authorization owner. The page-level checks are pure redundancy — RouteGuard already blocks non-admin users before they reach the page.

#### Outcome C — Page-level `isAdmin()` checks are intentional defense-in-depth

**CONFIRMED.** The page-level checks provide no additional security — they are a belt-and-suspenders pattern. `AdminOverview.tsx` demonstrates this: it has zero page authorization and functions correctly because RouteGuard protects it.

#### Outcome D — Mixed outcome

**CONFIRMED.** The correct resolution is mixed:
- **Remove** 7 page-level `isAdmin()` + `Navigate` checks (Category B)
- **Remove** 8 page-level `GuardLoader` checks (Category B)
- **Keep** 6 event-level `isAdmin()` + toast/error checks (Category C — business)
- **Keep** 38 service-layer `ensureRole()` calls (Category C — business)

### Final Verdict: **OUTCOME D — Mixed. Some removable, business permissions must stay.**

**Recommended Action:** Remove only the page-level authorization that duplicates RouteGuard (Category B). Keep all event-level and service-layer business checks (Category C).

---

## Step 11 — Implementation

**Justified.** The following page-level duplication can be safely removed:

### Plan

**Remove from 7 Admin pages** (AdminUsers, AdminUpload, AdminTopics, AdminSubAdmins, AdminSettings, AdminQuestions, AdminLeaderboard):

1. `if (authLoading) return <GuardLoader />` — redundant with AuthGuard
2. `if (!isAdmin(user)) return <Navigate to="/unauthorized" replace />` — redundant with RoleGuard
3. `import { GuardLoader } from '../../guards/Guards'` — no longer needed
4. `import { isAdmin } from '../../utils/authUtils'` — maintain only if event handlers remain
5. `import { Navigate } from 'react-router-dom'` — remove if only used for guard

**Do NOT remove from AdminOverview.tsx** — it already has no page authorization (reference pattern).

**Do NOT remove** any event-level `isAdmin()` checks (6 handlers across AdminQuestions, AdminSettings, useBulkUpload, SingleQuestionModal).

**Do NOT remove** any `ensureRole()` calls (38 calls across 5 services).

### Runtime Behavior Preservation

- Route-level `RoleGuard(['admin'])` continues to block non-admin users
- Service-level `ensureRole()` continues to block unauthorized data access
- Event-level `isAdmin()` checks continue to protect destructive actions
- **Zero authorization regression. Zero behavioral changes.**

---

## Step 12 — ADR Evaluation

**No ADR required.** The proposed changes are cleanup of page-level redundancy, not an architectural change.

The permission architecture remains:
- Route: `AuthGuard` → `RoleGuard` (single authorization owner)
- Service: `ensureRole()` (business permission layer)
- Event: `isAdmin()` checks (defense-in-depth for destructive actions)

---

## Step 13 — Metrics

| Metric | Before | After (Projected) |
|--------|-------:|------------------:|
| Route authorization owners | 1 | 1 (unchanged) |
| Page authorization owners (Admin) | 7 | **0** |
| Page loading guards (Admin) | 8 | **0** |
| Business event permission checks | 6 | 6 (unchanged) |
| Service `ensureRole()` calls | 38 | 38 (unchanged) |
| Total duplicate lines (Admin pages) | ~36 | **0** |
| Files modified | — | **7** |
| Files created | — | 0 |
| Files deleted | — | 0 |

---

## Step 14 — Verification

| Check | Status (Pre-existing) | Notes |
|-------|:---------------------:|-------|
| TypeScript clean | ✅ | No code changes yet |
| Build passes | ✅ | No code changes yet |
| Tests pass | ✅ | No code changes yet |
| No authorization regression | ✅ | Route-level RoleGuard untouched |
| No permission regression | ✅ | Service ensureRole untouched |
| Runtime behavior unchanged | ✅ | Event-level checks untouched |
| Zero circular dependencies | ✅ | Clean dependency graph |

---

## Step 15 — Final Recommendation

### AR-025: **AUDIT COMPLETE — Implementation Justified (Optional)**

The audit found **objectively redundant page-level authorization** in 7 of 8 Admin pages that duplicates what the route-layer `RoleGuard(['admin'])` already provides.

However, the implementation is **optional** because:
1. The route-layer `RoleGuard` already enforces authorization — the page checks provide no additional security
2. The service-layer `ensureRole()` provides defense-in-depth for data access
3. The removal is purely cosmetic cleanup — no behavioral change

### Decision Options

| Option | Action | Effort | Risk |
|--------|--------|:------:|:----:|
| **A** (Recommended) | Implement cleanup: remove 7 page guards + 8 loading guards | ~20 min | None |
| **B** | Accept as intentional defense-in-depth | 0 | None |
| **C** | Remove only — keep dead code helpers too | ~25 min | None |

### Key Distinctions

| Type | Duplicate? | Action |
|------|:----------:|--------|
| Page-level `authLoading` → GuardLoader | ✅ Yes — AuthGuard already handles this | **Remove** |
| Page-level `isAdmin()` → Navigate unauthorized | ✅ Yes — RoleGuard already handles this | **Remove** |
| Event-level `isAdmin()` → toast/error | ❌ No — business protection | **Keep** |
| Service `ensureRole()` | ❌ No — canonical business permission | **Keep** |

---

*This audit was conducted on 2026-07-22. All conclusions are supported by objective repository evidence.*

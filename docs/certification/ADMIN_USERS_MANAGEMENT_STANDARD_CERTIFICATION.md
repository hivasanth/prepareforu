# Phase 3.6B — Admin Users Management Page Certification

**Status:** ✅ **CERTIFIED** (2026-08-03) — second certified implementation of the Management Page
Standard (D-133), alongside Admin Questions.
**Page:** `/admin/users` · **Standard:** `docs/design-system/MANAGEMENT_PAGE_STANDARD.md`
**Certification gate:** `docs/certification/MANAGEMENT_PAGE_CERTIFICATION_STANDARD.md`
**Approved mapping:** `docs/certification/ADMIN_USERS_LAYOUT_MIGRATION_BLUEPRINT.md`
**Decision:** `docs/design-system/DESIGN_DECISION_LOG.md` (D-134)
**Scope:** structural migration to the Standard skeleton; business logic preserved; **no redesign**.

---

# 1. Mandatory Components (§1)

| Component | Present |
|---|---|
| Management Page Skeleton (`PageContainer` → `Stack` → Selection → Toolbar → Header → List → Pagination → Modal → Toast) | ✅ `AdminUsers.tsx` |
| `CollectionCard` (one per user, `layout="row"`) | ✅ `UsersTable.tsx` |
| `CollectionToolbar` (independent surface) | ✅ `UsersActions.tsx` |
| `CollectionHeader` (select-all + range) | ✅ `UsersTable.tsx` |
| `SelectionContainer` (independent context surface) | ✅ via `AdminSelectionTabs` |
| `Pagination` (independent) | ✅ `UsersTable.tsx` |
| `AdminModal` / `ConfirmModal` (dialogs) | ✅ `ConfirmModal` (toggle) |
| `ToastContainer` | ✅ |
| `EmptyState` / `Alert` / `GridSkeleton` (state layers) | ✅ all three |

---

# 2. Certification Checklist (§2) — 16/16

- [x] Uses the Management Page Skeleton — `AdminUsers.tsx:28-96` (`PageContainer` → `H1 sr-only` → `Stack gap="lg"` → `SectionReveal` selection → `Alert`s → `UsersActions` → `UsersTable`/`EmptyState` → `ConfirmModal` → `ToastContainer`).
- [x] Uses `CollectionCard` — one `CollectionCard` per user (`UsersTable.tsx:77-120`).
- [x] Uses `CollectionToolbar` — `UsersActions.tsx` (search `Input` + status `CollectionFilter`).
- [x] Uses `CollectionHeader` — `UsersTable.tsx:64-70` (select-all + range).
- [x] Uses `SelectionContainer` — `AdminSelectionTabs` with `EXAM_TABS`.
- [x] Uses `Pagination` — `UsersTable.tsx:125-129` (1-based `page` ↔ 0-based component contract).
- [x] Independent surfaces — selection / toolbar / cards / pagination each render in their own `SectionReveal`; none nest.
- [x] **Zero** nested Cards — no outer `Card`; the old `AdminCard` wrapper deleted.
- [x] **Zero** page-owned visuals — grep of the users folder + page shows only blueprint-approved `animate-in` on the list wrapper and certified `AdminText` color tokens; all surfaces resolve through Foundation.
- [x] 24 → 12 → 8 rhythm — `Stack gap="lg"` (24) · `gap-3` (12) between cards · `gap-2` (8) leading group · `gap-6` (24) header/list/pagination.
- [x] Foundation owns every visual — all surfaces are certified Foundation components; no page-authored CSS.
- [x] One `CollectionCard` = one entity; card never knows the entity — `CollectionCard` receives generic `leading`/`metadata`/`trailing`/`actions` slots.
- [x] Selection, Toolbar, Header, Pagination each have exactly one owner — selection: `AdminSelectionTabs` (tabs) + `CollectionHeader` (list selection); toolbar: `CollectionToolbar`; header: `CollectionHeader`; pagination: `Pagination`. No duplicated implementations.
- [x] Loading / Empty / Error replace only the list layer — `GridSkeleton`/`EmptyState`/`Alert`s render inside the list `SectionReveal`; selection + toolbar stay mounted and interactive.
- [x] Selection state lives in the page; `selected` is presentation-only — `selectedIds` in `useAdminUsers`; `CollectionCard` receives `selected`; `SelectionCheckbox` is controlled.
- [x] No new layout pattern, spacing system, or surface introduced — composition only; all spacing on the 24/12/8 ladder.

---

# 3. Forbidden Patterns (§3) — none present

| Anti-pattern | Result |
|---|---|
| Outer `Card` wrapping toolbar + list + pagination | ❌ absent (old `AdminCard` deleted) |
| `DataGrid` table as primary list | ❌ absent (`UsersTable` deleted) |
| Dual desktop/mobile render paths | ❌ absent (`UserMobileCard` deleted; single responsive `CollectionCard`) |
| Page-owned `hover:*`/`shadow-*`/`rounded-*`/`border-*` | ❌ absent (grep-verified) |
| Page-level ad-hoc spacing outside 24/12/8 | ❌ absent |
| Page-local restyling of Foundation components | ❌ absent |
| Page-specific checkbox/badge/button re-implementations | ❌ absent — certified `SelectionCheckbox`, `Badge`, `Button` reused |

---

# 4. Verification Evidence (§4.1)

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ **exit 0** |
| `npm run build` | ✅ **exit 0** (pre-existing chunk-size + CSS token warnings only) |
| Lint — frozen baseline **405 (352E/53W)**, zero new | ✅ changed files: only the pre-existing `no-explicit-any` at `useAdminUsers.ts:68` (stash-confirmed); working-tree count 407 = pre-existing drift in unrelated untracked files |
| Grep of page folder — zero raw visual utilities on page-owned components | ✅ only `animate-in` (blueprint-approved) + certified `AdminText` color tokens (`text-text-primary`/`text-text-muted`) |
| Render proof — surfaces resolve through Foundation tokens | ✅ `CollectionToolbar` premium, `CollectionCard` → `Card` premium-dark-neutral, `Badge` success/danger, `Alert`, `EmptyState`, `GridSkeleton`, `Pagination`, `ConfirmModal`, `ToastContainer` — zero page-authored CSS |

**Gate steps (§4):** Plan → Audit (Golden audit superseded by D-133) → Approve (Blueprint, D-134 deltas)
→ Implement (composition only) → Verify (above) → Certify (this document + register + index).

---

# 5. Adoption Metrics (§5)

| Metric | Value |
|---|---|
| Foundation components consumed | 20+ distinct certified components (PageContainer, Stack, SectionReveal, SelectionContainer, AdminSelectionTabs, Alert, CollectionToolbar, Input, CollectionFilter, CollectionHeader, SelectionCheckbox, CollectionCard, Badge, AdminText, Pagination, GridSkeleton, EmptyState, Button, ConfirmModal, ToastContainer, Avatar via UserIdentity) |
| Raw UI implementations | **0** |
| Page-owned visuals | **0** |
| Page-owned typography | **0** |
| Deleted legacy surface files | `AdminUsersView.tsx`, `UsersToolbar.tsx`, `UserMobileCard.tsx` |

---

# 6. Certification Statement

Admin Users satisfies **all 16** certification checklist items, contains **zero** forbidden patterns,
and passes the full verification gate at the frozen lint baseline. It is certified as the **second
Management Page Standard implementation**. Subsequent management pages shall follow the Standard
skeleton directly — never this page — per D-133 governance.

**Certified:** ✅ 2026-08-03 · **Governance:** D-134 · **Register:** FOUNDATION_FREEZE_REGISTER.md

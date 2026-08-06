# Phase 3.6 — Admin Users Layout Migration Blueprint

**Status:** 🔍 **BLUEPRINT ONLY — NO IMPLEMENTATION** (no code written)
**Source of truth:** Admin Questions — Golden Management Page Audit (`GOLDEN_MANAGEMENT_PAGE_AUDIT.md`, Phase 3.6)
**Target page:** `src/pages/admin/AdminUsers.tsx` + `src/components/admin/users/**`
**Date:** 2026-08-03

This document maps the Admin Users page onto the Golden Management Page structure. It defines **what** the target should look like and **which** components own each zone — nothing here is implemented. All mappings are 1:1 with certified shared primitives from the Questions page.

> **Relation to certified U-series work:** Admin Users is already certified for its primitives (U-1 surfaces, U-3 AdminText, U-4 UserIdentity, U-5 Avatar, U-2 Phase A typography). This blueprint only changes **structure/composition** — it reuses those certified primitives as-is. It does **not** change data contracts, services, `useAdminUsers`, or any certified component's public API.

---

# 1. Target Structure

```
Page (AdminUsers — composition root, matching Golden structure)
│
├─ PageContainer
│   └─ H1 sr-only "Manage Users"
│
├─ Stack gap="lg"                          ← 24px section rhythm
│   │
│   ├─ SectionReveal
│   │   └─ AdminSelectionTabs              ← EXAM context (customExamTabs=EXAM_TABS)
│   │       └─ SelectionContainer          ← own surface
│   │           └─ Tabs bare (exam level only; showPapers=false, showSubjects=false)
│   │
│   ├─ [conditional] SectionReveal
│   │   └─ Alert variant="error"           ← page-level error surface
│   │
│   ├─ SectionReveal
│   │   └─ UsersActions (NEW thin wrapper) ← TOOLBAR
│   │       └─ CollectionToolbar           ← own surface
│   │           ├─ Input (search) + CollectionFilter (status: All / Active Only / Banned Only)
│   │           └─ (no primary action today — slot reserved for future Add User)
│   │
│   ├─ SectionReveal (delay=0.1)
│   │   └─ div aria-live="polite" aria-label="Users list"
│   │       └─ UsersTable (NEW thin wrapper)
│   │           ├─ div.flex.flex-col.gap-6.animate-in
│   │           │   ├─ CollectionHeader     ← select-all + "Showing X–Y of Z"
│   │           │   ├─ div.flex.flex-col.gap-3
│   │           │   │   └─ CollectionCard layout="row" variant="premium" padding={16} × N
│   │           │   │       ├─ leading:   SelectionCheckbox + Avatar
│   │           │   │       ├─ title:     full name (h3, uppercase, truncate)
│   │           │   │       ├─ subtitle:  email
│   │           │   │       ├─ metadata:  Exam badge · Attempts · Joined
│   │           │   │       ├─ trailing:  Status badge (Active / Banned)
│   │           │   │       └─ actions:   Deactivate / Activate Button
│   │           │   └─ Pagination
│   │           └─ [empty] EmptyState "No Students Found"
│   │
│   └─ BulkActionBar                        ← ONLY if multi-select bulk actions are added
│
├─ [future] UserModal                      ← reserved; not in scope today
├─ ConfirmModal (toggle status)
└─ ToastContainer
```

---

# 2. Current → Target Mapping (per surface)

| # | Current (Admin Users) | Target (Golden) | Change type |
|---|---|---|---|
| 1 | `PageContainer` + `Stack gap="lg"` + `H1 sr-only` | unchanged | — |
| 2 | Selection tabs live **inside** `UsersToolbar` (`SectionReveal` + `AdminSelectionTabs`) | Selection moves **out** to page level as the first independent layer (`SectionReveal` → `AdminSelectionTabs`) | **move + decouple** |
| 3 | `UsersToolbar` wraps `AdminSelectionTabs` + `FilterBar` in one fragment | `UsersToolbar` splits into **Selection** (page level) + **Toolbar** (`CollectionToolbar`) | **split** |
| 4 | `FilterBar` (alias of `CollectionToolbar`) | `CollectionToolbar` (same component; rename usage for clarity) | rename only |
| 5 | Status dropdown = `FilterSelect` (`PremiumSelect`) | `CollectionFilter` (finite set: all/active/inactive) | **replace** |
| 6 | `Badge variant="primary"` total-users counter | removed (range text lives in `CollectionHeader`) | **remove** |
| 7 | One outer `Card variant="default" padding={0}` wrapping toolbar + grid + pagination | **No outer card.** Independent surfaces: toolbar / item cards / pagination | **remove (anti-pattern)** |
| 8 | Desktop `DataGrid` table + mobile `UserMobileCard` (dual render path) | One responsive `CollectionCard layout="row"` for all breakpoints | **replace + unify** |
| 9 | Row selection | none today | `CollectionHeader` + `SelectionCheckbox` (add) |
| 10 | `TableSkeleton` | `GridSkeleton count={5} height={56} columns="grid-cols-1"` | replace |
| 11 | `Pagination` inside `p-4 border-t` footer | `Pagination` independent below the list (no border wrapper) | **move + decouple** |
| 12 | `ErrorState` | `Alert variant="error"` at page level (page keeps `actionError` alert) | replace |
| 13 | `ConfirmModal` (toggle) | unchanged | — |
| 14 | `ToastContainer` | unchanged | — |

---

# 3. Row Anatomy — One User per CollectionCard

```
┌ CollectionCard (layout=row, variant=premium, padding=16) ───────────────────┐
│                                                                             │
│  [SelectionCheckbox] [Avatar] │ STUDENT NAME (h3, truncate)                 │
│                               │ student@mail.com                            │
│                               │ [Exam Badge] [12 Attempts] [Joined 12 Jul]  │
│                                                                             │
│                                              [Active/Banned]  [Deactivate] │
│                                                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Zone | Source component | Owner |
|---|---|---|
| Leading — selection | `SelectionCheckbox` | page (state) |
| Leading — identity | `Avatar size="md" shape="circle"` (certified U-5) | page |
| Primary — name | `CollectionCard` `title` slot (`titleAs="h3"`, `uppercase tracking-tight`, `truncate`) | CollectionCard renders; content from `UserIdentity` |
| Secondary — email | `CollectionCard` `subtitle` slot | CollectionCard |
| Metadata — exam / attempts / joined | `CollectionCard` `metadata` slot (`Badge` exam + `AdminText` small for attempts/joined) | page |
| Status | `CollectionCard` `trailing` slot (`Badge` success/danger: Active/Banned) | page |
| Actions | `CollectionCard` `actions` slot (`Button` Deactivate/Activate, `size="xs"`) | page |

**Reuse note:** `UserIdentity` (certified U-4) already produces Avatar + name + email. In the golden structure its content maps onto the `leading`/`title`/`subtitle` slots instead of being rendered as a standalone `<Stack>`. The `UserMobileCard` disappears — one card serves all breakpoints (its `flex-col sm:flex-row` anatomy is already responsive).

---

# 4. Data Flow (unchanged)

| Concern | Stays in |
|---|---|
| Filters / pagination / optimistic status / confirm toggle | `useAdminUsers` (unchanged) |
| URL exam tab (`?exam=`) | `useSearchParams` via `useAdminUsers` (unchanged) |
| Services | `userService` (unchanged) |
| Selection state (new) | `useAdminUsers` gains `selectedIds` + `setSelectedIds` (page passes to `CollectionHeader` / `SelectionCheckbox`) |
| Row handlers | `onToggleRequest` (unchanged) |

---

# 5. Component Build-Out (future implementation)

New thin wrappers (composition-only, same pattern as `QuestionsActions` / `QuestionsTable`):

| Component | Slots / props | Primitives used |
|---|---|---|
| `UsersActions` | `searchQuery`, `setSearchQuery`, `statusFilter`, `setStatusFilter` | `CollectionToolbar`, `Input`, `CollectionFilter` |
| `UsersTable` | `users`, `totalUsers`, `loading`, `page`, `totalPages`, `onPageChange`, `selectedIds`, `onSelect`, `onSelectAll`, `onToggleRequest` | `CollectionHeader`, `SelectionCheckbox`, `CollectionCard`, `Avatar`, `Badge`, `AdminText`, `Pagination`, `GridSkeleton`, `EmptyState` |

Prop/state additions to `useAdminUsers` (selection only — no service change): `selectedIds`, `setSelectedIds`, `allOnPageSelected`, `toggleSelectAll`, plus `page` currently stored 1-based → keep as-is; blueprint maps `page-1` for `Pagination` exactly as today.

---

# 6. Spacing Target (matches Golden ladder 24 → 12 → 8)

| Location | Value |
|---|---|
| Section gap | 24px (`Stack gap="lg"`) |
| Toolbar padding | `p-3 md:p-4` |
| Toolbar group gap | 12px |
| Toolbar ↔ header | 24px |
| Between rows | 12px (`gap-3`) |
| Card padding | 16px |
| Row leading ↔ title | 10/12px |
| Metadata chips | 8px |
| List ↔ pagination | 24px |

---

# 7. Deviations / Decisions Requiring Approval

| # | Decision | Rationale | Default |
|---|---|---|---|
| D-1 | Add row selection (`CollectionHeader` + `SelectionCheckbox`) even though Users has no bulk actions today | Golden structure requires a header; selection is the Questions contract. Adds the checkbox affordance without bulk action | **Add** (selection state only) |
| D-2 | `BulkActionBar` (multi-delete users) | Out of scope — user management has no bulk op; would need new service contract | **Omit** (reserved) |
| D-3 | `UserMobileCard` removal | Unifies to one responsive row card; deletes a component | **Remove** in implementation |
| D-4 | `CollectionFilter` for status (replaces `FilterSelect`) | Status is a finite set matching the golden filter pattern; `PremiumSelect` stays for searchable/large sets | **Replace** |
| D-5 | Total-user `Badge` removal | Range text in `CollectionHeader` supersedes it | **Remove** |
| D-6 | Future `UserModal` (create/edit) | Not required today; slot reserved between `ConfirmModal` and `ToastContainer` | **Defer** |

---

# 8. Verification Plan (for the implementation phase)

1. `npx tsc -b` → exit 0.
2. `npm run build` → exit 0.
3. Lint → frozen baseline **405 (352E/53W)**, zero new.
4. Visual: page renders with independent surfaces (no outer card), one `CollectionCard` per user, 24/12/8 rhythm, `CollectionHeader` + `Pagination` independent.
5. Behavior: selection, exam tab (`?exam=`), status filter, search, pagination, toggle-confirm all preserve current behavior.
6. No service/type/contract changes (`userService`, `UserRow`, `useAdminUsers` public API — only additive `selectedIds`).

---

# 9. Success Criteria (blueprint)

| Criterion | Met |
|---|---|
| Target structure defined (Page → Selection → Toolbar → Header → User list → Pagination → Modal) | ✅ (Section 1) |
| One CollectionCard per user | ✅ (Section 3) |
| Every zone assigned an owner and primitive | ✅ (Section 3) |
| Current → target mapping exhaustive | ✅ (Section 2) |
| No implementation code written | ✅ (this file only) |
| Gated behind golden audit approval | ✅ — implementation must be its own approved phase |

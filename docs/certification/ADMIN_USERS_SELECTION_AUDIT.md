# ADMIN USERS — SELECTION AUDIT (Phase 3.6C, Part 1)

**Date:** 2026-08-03 · **Status:** ⏸ AWAITING APPROVAL (no code changed)
**Scope:** `src/pages/admin/AdminUsers.tsx`, `src/components/admin/users/UsersTable.tsx`,
`src/components/admin/users/useAdminUsers.ts` — the select-all checkbox + per-row selection added in
3.6B (Blueprint D-8) and its `selectedIds` state.

---

# 1. Selection Trace

```
Checkbox
  ├─ CollectionHeader (UsersTable.tsx:64-70)  → select-all SelectionCheckbox, label "Select all on this page"
  │     └─ checked = allOnPageSelected (every user on the current page is in selectedIds)
  │     └─ onToggleSelectAll = toggleSelectAll (add/remove current page ids)
  └─ per-row SelectionCheckbox (UsersTable.tsx:86) inside CollectionCard leading
        └─ checked = selectedIds.includes(u.id)  ·  onChange → onSelect(u.id) (toggle one id)
        └─ CollectionCard selected={isSelected} → visual highlight only (border + tint)
```

## Current consumers of `selectedIds`

| Consumer | File:line | What it does | Business purpose |
|---|---|---|---|
| `UsersTable` | `UsersTable.tsx:39-48` | computes `allOnPageSelected` / `toggleSelectAll` | presentation only |
| `UsersTable` | `UsersTable.tsx:77,86` | per-row checked + card highlight | presentation only |
| `AdminUsers` | `AdminUsers.tsx:79-81` | forwards `selectedIds` + `onSelect`/`onSelectAll` | pass-through only |
| `useAdminUsers` | `useAdminUsers.ts:24,81-83,137` | state + clear-on-query-change effect | state holder only |

**No consumer feeds `selectedIds` into any service, RPC, or repository call.**

## Purpose

None. The selection affordances exist only because the Management Page Standard's `CollectionHeader`
composition couples "select-all + range" together and the Questions page (first implementation) uses
selection for **bulk delete**. Admin Users has **no bulk action of any kind** — the row action is a
single `Activate`/`Deactivate` `Button`, and no bulk control is rendered anywhere on the page.

## Business logic

None. There is no bulk endpoint: `userService` exposes only single-target
`toggleUserStatus(userId, isActive)` (admin-only). The repository exposes
`updateUser(id, updates)` / `fetchUsersPaginated` — no `updateUsers(ids, …)` batch API exists.

---

# 2. Bulk-operation search (evidence)

| Bulk operation | Search scope | Result |
|---|---|---|
| Bulk Activate | users module, `userService`, `user.repository` | ❌ not present |
| Bulk Deactivate | same | ❌ not present |
| Bulk Delete | same | ❌ not present |
| Bulk Assign | same | ❌ not present |
| Bulk Email | same | ❌ not present |
| Bulk Export | same | ❌ not present |
| Any `updateUsers(ids,…)` / `in('ids')` update | `user.repository.ts` | ❌ not present |

Reference comparison — **Admin Questions** selection has a real purpose: `useAdminQuestions.ts:95-100`
feeds `selectedIds` into `adminQuestionService.bulkDeleteQuestions(selectedIds, …)` (bulk delete) and
the bulk-upload flow. Questions → **keep selection**. Users → no such consumer.

## Future need

No planned bulk feature exists for the Users page in the Management Page Standard entity mapping
(actions are single-row Activate/Deactivate) or in any roadmap artifact located during this audit.
Potential future bulk capabilities (bulk ban, bulk CSV export, bulk assign exam, bulk email) are all
currently unplanned; none justifies retaining dead UI today. If a bulk feature is added later, selection
is reintroduced **together with** the action that consumes it (Questions pattern).

---

# 3. Decision

Per the Phase 3.6C decision rules — *"Do not keep UI that has no business purpose"* — and the
Management Page Certification Standard §1's CollectionHeader "select-all" being meaningful only when a
bulk operation exists:

## ✅ REMOVE selection from Admin Users

1. **Remove** the per-row `SelectionCheckbox` from the `CollectionCard` `leading` slot
   (`UsersTable.tsx`).
2. **Remove** the select-all checkbox from the list header.
3. **Remove** `selectedIds` / `setSelectedIds` + the clear-on-query-change effect
   (`useAdminUsers.ts`, `AdminUsers.tsx`).
4. **Retain** the "Showing X–Y of Z" range summary (it is informational, not selection).

## Required Foundation refinement (approval needed)

`CollectionHeader` (certified, `src/components/common/CollectionHeader.tsx`) currently hard-requires a
select-all checkbox. To keep a range-only header for pages without bulk actions, make the select-all
**optional and additive** (render-neutral when not provided):

- `onToggleSelectAll?: () => void` (currently required) — when **undefined**, render the range text only
  (omit the `SelectionCheckbox`).
- `checked?: boolean` becomes optional alongside it; existing consumers (Questions) unchanged.

This is a **Reuse → Refine** of a certified component (additive prop, no rendering change for existing
consumers), consistent with D-134's additive-selection introduction being reversed by this audit.

## Impact on 3.6B certification

Blueprint **D-8** (add select-all, 3.6B) is **superseded** by this decision — the Standard's selection
column applies only where a bulk consumer exists. This phase supersedes that delta under a new D-series
decision (logged with the other 3.6C decisions).

---

# 4. Files affected (pending approval)

| File | Change (pending) |
|---|---|
| `src/components/admin/users/UsersTable.tsx` | remove `SelectionCheckbox` import/usage, `selectedIds`/`onSelect`/`onSelectAll` props, `allOnPageSelected`/`toggleSelectAll` |
| `src/components/admin/users/useAdminUsers.ts` | remove `selectedIds`/`setSelectedIds` + clear effect |
| `src/pages/admin/AdminUsers.tsx` | stop passing selection props; remove inline `onSelect`/`onSelectAll` |
| `src/components/common/CollectionHeader.tsx` | **additive** optional select-all (Foundation refinement) |

No service/repository/database changes required for this part.

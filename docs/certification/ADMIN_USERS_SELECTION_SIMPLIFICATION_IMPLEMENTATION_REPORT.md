# Phase 3.6C.1 — Admin Users Selection Simplification — Implementation Report

**Date:** 2026-08-03 · **Status:** ✅ Implemented (certified in `ADMIN_USERS_SELECTION_SIMPLIFICATION_CERTIFICATION.md`)
**Approved by:** 3.6C.1 phase spec · **Governance:** D-135
**Decision basis:** `docs/certification/ADMIN_USERS_SELECTION_AUDIT.md` — the Users page had no bulk
operation (no bulk activate/deactivate/delete/assign/email/export; `selectedIds` fed nothing), so the
selection affordance was meaningless UI. Removal supersedes 3.6B delta **D-8**.

---

# 1. What changed

## 1.1 Foundation — `CollectionHeader` (sole additive Foundation change)

`src/components/common/CollectionHeader.tsx`:
- `checked` and `onToggleSelectAll` became **optional** (`checked?: boolean`, `onToggleSelectAll?: () => void`).
- The `SelectionCheckbox` renders **only when `onToggleSelectAll` is provided**.
- When omitted, the header renders the **range-only** form: "Showing X–Y of Z" with **no empty space,
  no placeholder, no hidden checkbox** (`justify-between` collapses to the right-aligned range).
- `selectAllLabel` default unchanged; `rangeStart`/`rangeEnd`/`totalCount` unchanged.
- Additive-only: Questions (the other consumer) keeps passing `checked` + `onToggleSelectAll` and is
  pixel-identical.

## 1.2 Page composition — Users

`src/components/admin/users/UsersTable.tsx`:
- Removed props `selectedIds`, `onSelect`, `onSelectAll`; removed `allOnPageSelected` and
  `toggleSelectAll`.
- Removed the row `SelectionCheckbox` and the `CollectionCard selected={isSelected}` prop.
- `CollectionHeader` now receives range props only.
- `SelectionCheckbox` import removed.

`src/components/admin/users/useAdminUsers.ts`:
- Removed `selectedIds`/`setSelectedIds` state and the reset effect
  (`[searchQuery, statusFilter, activeTab, page]`).
- Removed `selectedIds, setSelectedIds` from the hook return.

`src/pages/admin/AdminUsers.tsx`:
- Removed the `selectedIds`/`onSelect`/`onSelectAll` wiring passed to `UsersTable`.

The Users page no longer maintains **any** selection state.

---

# 2. Files changed

| File | Kind | Change |
|---|---|---|
| `src/components/common/CollectionHeader.tsx` | Foundation additive | optional select-all; range-only render |
| `src/components/admin/users/UsersTable.tsx` | page composition | selection removed |
| `src/components/admin/users/useAdminUsers.ts` | hook | selection state removed |
| `src/pages/admin/AdminUsers.tsx` | page composition | selection wiring removed |

No other component was touched (verified by grep: no selection references remain under
`src/components/admin/users` and `src/pages/admin/AdminUsers.tsx`).

---

# 3. Verification

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ 0 |
| `npm run build` | ✅ (pre-existing chunk-size warning only) |
| eslint | ✅ frozen baseline **405 (352E/53W)**, zero new |
| Grep `selectedIds`/`onSelect`/`toggleSelectAll`/`SelectionCheckbox` in users area | ✅ none (Questions/AdminQuestions keeps its own selection) |

---

# 4. Notes

- Questions selection is **unchanged** — `bulkDeleteQuestions` is a real bulk operation and remains
  selectable (verified `AdminQuestions.tsx` still passes selection props).
- The `CollectionHeader` range-only path is exercised by Users; Questions exercises the select-all path.

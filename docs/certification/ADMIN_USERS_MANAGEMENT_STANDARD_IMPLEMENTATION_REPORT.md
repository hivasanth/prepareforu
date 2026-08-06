# Phase 3.6B — Admin Users → Management Page Standard ✅ IMPLEMENTED

**Status:** ✅ **IMPLEMENTED** (2026-08-03) — Admin Users is the **second certified implementation** of the
Management Page Standard (`docs/design-system/MANAGEMENT_PAGE_STANDARD.md`, D-133).
**Page:** `/admin/users` · **Gate:** Management Page Certification Standard (`docs/certification/MANAGEMENT_PAGE_CERTIFICATION_STANDARD.md`)
**Approved mapping:** `docs/certification/ADMIN_USERS_LAYOUT_MIGRATION_BLUEPRINT.md` (Blueprint §3/§5/§6)
**Scope:** Structural migration only — outer wrapper `Card`/`DataGrid`/`UserMobileCard` removed;
Admin Users composed onto the Standard skeleton using only certified Foundation components.
**Business logic untouched:** `useAdminUsers`, `userService`, URL params, optimistic updates,
toggle-confirm flow — all preserved. Only additive selection state added.

---

# 1. Change Ledger

| # | File | Change | Type |
|---|---|---|---|
| 1 | `src/components/admin/users/UsersActions.tsx` | **NEW** thin composition wrapper: `CollectionToolbar` → search `Input` + status `CollectionFilter` (All / Active Only / Banned Only). Search+filter group only (`flex-1 min-w-0`); primary-action slot reserved for future Add User. No URL logic, no surface, no page-owned visuals | add |
| 2 | `src/components/admin/users/UsersTable.tsx` | **NEW** thin composition wrapper: `CollectionHeader` (select-all + range) → `CollectionCard` `layout="row"` `variant="premium"` `padding={16}` list (`gap-3`) → `Pagination` (1-based `page` mapped `page-1`, `onPageChange` maps back `+1`). Loading → `GridSkeleton count={5} height={56} columns="grid-cols-1"`; empty → `null` (page owns `EmptyState`). Selection: `SelectionCheckbox` per row, `allOnPageSelected` + `toggleSelectAll` mirror the Questions pattern | add |
| 3 | `src/pages/admin/AdminUsers.tsx` | **REWRITTEN** to the canonical skeleton: `PageContainer` → `H1 sr-only` → `Stack gap="lg"` → `SectionReveal`(Selection layer: `AdminSelectionTabs` `customExamTabs=EXAM_TABS`, `showPapers=false`, `showSubjects=false`) → error `Alert`s (`actionError` + `usersError`) → `SectionReveal`(toolbar `UsersActions`) → `SectionReveal delay={0.1}`(`aria-live` list wrapper + `UsersTable` + `EmptyState` with retry when error) → `ConfirmModal` → `ToastContainer`. URL `?exam=` update logic moved from the deleted `UsersToolbar` into the page (`setActiveTab` via `useSearchParams`, identical URL semantics) | rewrite |
| 4 | `src/components/admin/users/useAdminUsers.ts` | Additive only: `selectedIds` + `setSelectedIds` + clear-on-query-change effect (`[searchQuery, statusFilter, activeTab, page]`). PAGE_SIZE 20, 1-based `page`, `totalPages`, `statusFilter` default `'active'`, optimistic status, confirm toggle — all unchanged | additive |
| 5 | `src/components/admin/users/index.ts` | Barrel updated: `UsersActions`, `UsersTable`, `useAdminUsers`, `UserIdentity` | update |
| 6 | `src/components/admin/users/AdminUsersView.tsx` | **DELETED** (outer `Card padding={0}` + desktop `DataGrid` + mobile `UserMobileCard` dual path + `TableSkeleton` + in-footer `Pagination`) | remove |
| 7 | `src/components/admin/users/UsersToolbar.tsx` | **DELETED** (tabs-inside-toolbar + `FilterBar` + `FilterSelect` status + total-users `Badge`) | remove |
| 8 | `src/components/admin/users/UserMobileCard.tsx` | **DELETED** (dual mobile render path; one responsive `CollectionCard layout="row"` serves all breakpoints) | remove |
| 9 | `src/components/admin/users/UserIdentity.tsx` | **UNCHANGED** — certified U-4, reused unmodified inside the CollectionCard `leading` slot (single identity render, no duplicate name/email/avatar rendering) | keep |

**Consumer check (Step 11):** grep confirmed `AdminUsersView`/`UsersToolbar`/`UserMobileCard` had no
consumers outside the users folder before deletion; no barrel/index imports of the old files remain.

---

# 2. Row Anatomy — Approved Blueprint §3 → Implemented

| Zone | Blueprint mapping (approved) | Implementation | Owner |
|---|---|---|---|
| Leading | `SelectionCheckbox` + `Avatar` | `SelectionCheckbox` + `UserIdentity` (certified U-4: `Avatar` DS-014 + name + email, `truncate`) | page (state) + certified U-4 |
| Primary (name) | `title` slot | inside `UserIdentity` (AdminText garamond `heading`, single `|| 'Unknown'` fallback) — **title/subtitle slots intentionally empty so identity renders exactly once** | U-4 (certified) |
| Secondary (email) | `subtitle` slot | inside `UserIdentity` (AdminText sans `metadata` + `Mail` icon `aria-hidden`) | U-4 (certified) |
| Metadata | Exam badge · Attempts · Joined | `Badge variant="default"` (exam, `capitalize`, `|| 'None'`) · `AdminText` "`{n}` Attempts" · `AdminText` "Joined {date}" | page (certified primitives) |
| Status | Active / Banned | `Badge` `success`/`danger` + `ShieldCheck`/`ShieldAlert`, `trailing` slot | page (certified) |
| Actions | Activate / Deactivate | `Button` `size="xs"` `danger`/`success`, `actions` slot | page (certified) |

**Identity reconciliation (documented):** the task brief mandates reusing `UserIdentity` (U-4) unmodified
with **no duplicate name/email/avatar rendering**. Blueprint §3's "Reuse note" states UserIdentity's
content maps into the card's identity zone. The implementation therefore places `UserIdentity` in the
`leading` slot (checkbox + identity) rather than re-rendering Avatar + name + email inline into
`title`/`subtitle` — identity renders **exactly once**, through the certified U-4 composition.

---

# 3. Skeleton Compliance (Standard §1.1)

```
PageContainer
├─ H1 sr-only "Manage Users"
└─ Stack gap="lg"                                    ← 24px section rhythm
   ├─ SectionReveal → SelectionContainer (AdminSelectionTabs, EXAM_TABS)   ← Selection layer (surface)
   ├─ [error] Alert variant="error" (actionError / usersError)             ← page-level error
   ├─ SectionReveal → UsersActions → CollectionToolbar                     ← Toolbar layer (surface)
   └─ SectionReveal delay=0.1 → aria-live "Users list"
      ├─ UsersTable
      │  ├─ CollectionHeader (select-all + "Showing X–Y of Z")             ← header (no surface)
      │  ├─ div.flex.flex-col.gap-3                                        ← gap-only list wrapper
      │  │  └─ CollectionCard layout="row" variant="premium" padding={16} × N
      │  └─ Pagination (independent, page-1 → 0-based)                     ← pagination (no surface)
      └─ EmptyState "No Students Found" (+ "Try Again" on error)           ← empty layer
ConfirmModal (toggle) + ToastContainer
```

**Forbidden patterns eliminated:** outer wrapper `Card` — removed; `DataGrid` primary list — removed;
dual desktop/mobile render paths — removed (one responsive `CollectionCard`); page-owned visuals — zero
(see §5); total-users `Badge` — removed (superseded by `CollectionHeader` range, Blueprint D-5);
`FilterSelect` status → `CollectionFilter` (Blueprint D-4).

---

# 4. Business-Logic Preservation

| Concern | Status |
|---|---|
| `useAdminUsers` filters/pagination/optimistic status/confirm toggle | unchanged |
| `activeTab` from `?exam=` search param, `statusFilter` default `'active'`, PAGE_SIZE 20, 1-based `page`, `totalPages` | unchanged |
| URL tab change (`?exam=` set/delete with `replace`) | preserved — moved from `UsersToolbar` to the page composition root (`setActiveTab`) |
| `toggleUserStatus` service + optimistic update + rollback + `actionError` | unchanged |
| Fetch error → retry | preserved — page-level `Alert` + `EmptyState` `Try Again` action (`handleRetry`) |
| Search placeholder/copy (`"Search students by name or email..."`) | preserved |
| Status filter options | `CollectionFilter` now offers **All / Active Only / Banned Only** (Blueprint D-4); default still `'active'` |
| Selection (new) | `selectedIds`/`setSelectedIds` additive; cleared on any query change (search/status/tab/page) |

**No service/type/contract changes:** `userService`, `UserRow`, `useAdminUsers` public API — only the
additive `selectedIds`/`setSelectedIds`.

---

# 5. Verification (Certification Gate §4.1)

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ **exit 0** |
| `npm run build` | ✅ **exit 0** (pre-existing chunk-size + CSS token warnings only) |
| `npm run lint` — changed files | ✅ **zero new findings** (only the pre-existing `no-explicit-any` on `useAdminUsers.ts:68` present in the frozen baseline; confirmed unchanged via stash) |
| Repo-wide lint baseline | frozen **405 (352E/53W)**; the current working-tree count (407) is pre-existing drift in unrelated untracked files (`src/validations/securitySchemas.test.ts`, `supabase/functions/*`) — outside this page's scope, zero new from this phase |
| Page-folder grep (page-owned visuals) | ✅ **zero page-owned visuals** — the only hits are the blueprint-approved `animate-in` on the gap-only list wrapper (Blueprint §1: `div.flex.flex-col.gap-6.animate-in`, same as the certified Questions implementation) and semantic color tokens on the certified `AdminText` primitive (U-3 certified pattern, e.g. `text-text-primary`/`text-text-muted`) |
| 24 → 12 → 8 meter | ✅ `Stack gap="lg"` 24px · `gap-3` 12px between cards · `gap-2` 8px within the row leading group · `gap-6` 24px between header/list/pagination · `CollectionToolbar` `p-3 md:p-4` · `CollectionCard padding={16}` |

**Render proof:** every surface on the page resolves through Foundation tokens (`CollectionToolbar`
premium surface, `CollectionCard` → `Card` `premium-dark-neutral`, `SelectionContainer`, `Badge`,
`Alert`, `EmptyState`, `GridSkeleton`, `Pagination`, `ConfirmModal`, `ToastContainer`). No page-authored CSS.

---

# 6. Accepted Deltas / Notes

| # | Delta | Rationale |
|---|---|---|
| 1 | `CollectionCard` `title`/`subtitle` slots unused — identity (name/email) lives inside the `leading` `UserIdentity` | task brief mandates `UserIdentity` reuse unmodified with no duplicate rendering; U-4 is the single certified identity composition |
| 2 | `animate-in` on the list wrapper | explicitly specified in the approved Blueprint §1; identical to the certified Questions first implementation |
| 3 | Status `CollectionFilter` includes an `All` option | Blueprint D-4 (All / Active Only / Banned Only); default remains `'active'` so initial behavior is unchanged |
| 4 | Retry preserved via `EmptyState` action | Blueprint row 12 (ErrorState → Alert) — `handleRetry` retained through the certified `EmptyState` "Try Again" when `usersError` is set |

---

# 7. Foundation Adoption

| Metric | Value |
|---|---|
| Distinct certified Foundation components consumed | PageContainer, Stack, SectionReveal, SelectionContainer, AdminSelectionTabs, Alert, CollectionToolbar, Input, CollectionFilter, CollectionHeader, SelectionCheckbox, CollectionCard, Badge, AdminText, Pagination, GridSkeleton, EmptyState, Button, ConfirmModal, ToastContainer, Avatar (via UserIdentity) |
| Raw UI implementations | **0** |
| Page-owned visuals | **0** |
| Page-owned typography | **0** (all text via AdminText / certified primitives) |
| Dual render paths | **0** |

---

# 8. Deliverables

- Blueprint (approved mapping): `docs/certification/ADMIN_USERS_LAYOUT_MIGRATION_BLUEPRINT.md`
- Visual comparison: `docs/certification/ADMIN_USERS_MANAGEMENT_STANDARD_VISUAL_COMPARISON.md`
- Certification: `docs/certification/ADMIN_USERS_MANAGEMENT_STANDARD_CERTIFICATION.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-134)
- Page index: `docs/certification/PAGE_CERTIFICATION_INDEX.md`
- Register: `FOUNDATION_FREEZE_REGISTER.md` (Phase 3.6B section)
- Execution log: `PHASE_3_1_EXECUTION_LOG.md` (Phase 3.6B section)

# Admin Users — Page Audit (Phase 3.5 · Page 1 of 11)

**Date:** 2026-08-02
**Status:** 📋 AUDITED — awaiting approval gate (no implementation performed)
**Phase directive:** Phase 3.5 — Page Certification & Foundation Adoption. Work page-by-page;
no implementation begins without an approved audit.
**Page:** `Admin Users` — route `/admin/users`
**Scope boundary:** `src/pages/admin/AdminUsers.tsx` → `src/components/admin/users/*`
(page-owned components only). Shared/admin-wide dependencies are audited as dependencies, not
in scope (AdminSelectionTabs, useToast, Foundation, guards, services, repositories).
**Baseline:** Phase 3.4 P0/P1/P2 certified Foundation (frozen). Lint baseline 405 problems
(352 errors / 53 warnings), all pre-existing.

---

## 1. Architecture

### 1.1 Responsibilities

- **`AdminUsers` (page, `src/pages/admin/AdminUsers.tsx:8-51`)** — thin composition root:
  `PageContainer` → toasts + sr-only `H1` + action-error `Alert` + `AdminUsersView` +
  `ConfirmModal`. No styling, no data access, no business logic of its own.
- **`useAdminUsers` (`src/components/admin/users/useAdminUsers.ts`)** — owns all page state:
  URL-driven `activeTab` (`?exam=`), `searchQuery`, `statusFilter` (default `'active'`),
  `page` (1-based), optimistic `is_active` overlay, confirm-toggle flow, fetch orchestration
  with `fetchIdRef` request deduplication, toasts, action-error.
- **`AdminUsersView` (`AdminUsersView.tsx`)** — presentational container: toolbar + conditional
  error/loading/desktop-table/mobile-cards/empty + pagination footer.
- **`UsersToolbar` (`UsersToolbar.tsx`, `memo`)** — exam tabs + search + status filter + count.
- **`UserMobileCard` (`UserMobileCard.tsx`)** — mobile row card.

### 1.2 Dependencies

```
AdminUsers (page)
├── useAdminUsers
│   ├── useAuth            → current user (for authorization context)
│   ├── useToast           → toasts
│   ├── userService.fetchUsersPaginated  → user.repository.fetchUsersPaginated (Supabase `users` table, RLS)
│   ├── userService.toggleUserStatus     → ensureRole(admin) → user.repository.updateUser
│   └── KNOWN_EXAM_IDS (examUtils) / EXAM_TABS (examPresets)
├── AdminUsersView
│   ├── UsersToolbar
│   │   ├── AdminSelectionTabs (shared admin component, customExamTabs mode — no paper/subject fetch)
│   │   └── Foundation: Input, FilterSelect, Badge, FilterBar(=CollectionToolbar alias)
│   ├── Foundation: Card, DataGrid, Pagination, Badge, Button, Stack, Label
│   ├── SharedComponents: ErrorState, EmptyState, LoadingSkeleton
│   ├── AdminIconWrap (avatar, grid) / AdminText (name, grid)
│   └── UserMobileCard
└── ConfirmModal (SharedComponents → AdminModal)
```

Service/domain boundary is clean: page and components never touch `supabase` directly; all
data access flows through `userService` → `user.repository`.

### 1.3 Business-logic boundaries

- Data fetch, filtering, pagination, optimistic update, and the toggle-confirm state machine
  are all in the hook (testable, presentational components stay pure).
- Two service functions are used: `fetchUsersPaginated` (no service-layer role check) and
  `toggleUserStatus` (service-layer `ensureRole(['admin'])`). See Security §5.

### 1.4 Boundary findings

| # | Finding | Wave |
|---|---|---|
| U-8 | `userService.fetchUsersPaginated` lacks the `ensureRole` service-layer guard that every other admin operation uses (defense-in-depth gap; mitigated by route `RoleGuard` + RLS `rls_users_admin_all`). | P1 |
| U-16 | `AdminUsersView` is not `memo`'d and calls `getColumns(...)` inline each render (new array + closures per render → every keystroke re-renders all rows). | P1 |

---

## 2. UI Structure

Sections (top → bottom):

1. **Page scaffold** — `PageContainer`; `ToastContainer` (top); sr-only `H1` "Manage Users";
   `Stack gap="lg"`.
2. **Action error** — `Alert variant="error" icon={AlertCircle}` rendered only when
   `h.actionError`.
3. **Panel** — `Card variant="subtle" padding={0} className="ancient-card overflow-hidden"
   role="region" aria-label="Users list" aria-live="polite"` containing:
   - **Toolbar** (`UsersToolbar`):
     - `SectionReveal` → `AdminSelectionTabs` (bare `Tabs`, `variant="primary"`,
       `customExamTabs={EXAM_TABS}`, `showPapers/subjects=false`, inside `SelectionContainer`).
     - `FilterBar` → `Input` (search, `leftIcon={Search}`, `aria-label="Search students"`),
       `FilterSelect` (status, `placeholder="Status"`, options Active Only / Banned Only),
       `Badge variant="primary"` (total users, hidden <sm).
   - **Body** (conditional):
     - Error → `ErrorState` (⚠️ `onRetry` is a **no-op**).
     - Loading → module-level `LOADING_SKELETON` (4 × `LoadingSkeleton` height 64).
     - Desktop (`hidden md:block`) → `DataGrid` (6 columns).
     - Mobile (`block md:hidden p-4 space-y-3`) → `UserMobileCard` list.
     - Empty (`users.length === 0 && !loading`) → `EmptyState`.
   - **Pagination footer** (`totalPages > 1`) — `Pagination` (0-based↔1-based shim).
4. **Grid row (desktop)** — avatar (`AdminIconWrap` initials) · name (`AdminText` garamond,
   `text-base`, uppercase) + email (`Mail` icon, `text-xs`) · Exam Type `Badge default` ·
   Attempts (`text-sm font-bold` + `Label text-[8px]` "Completed") · Joined (`text-xs`) ·
   Status `Badge success/danger` + `ShieldCheck/ShieldAlert` · Action `Button xs danger/success`
   "Deactivate"/"Activate".
5. **Mobile card** — hand-rolled avatar (`w-9 h-9 rounded-full bg-primary/10 text-primary`) ·
   name (`font-bold text-sm uppercase`) + email · Status `Badge` · Exam + attempts row · Joined
   + toggle `Button xs`.
6. **ConfirmModal** — activate/deactivate confirmation (danger styling on deactivate).

---

## 3. Foundation Adoption

Golden references = the certified Foundation components (Phase 3.4 P0–P2). Status legend:
✅ certified adoption · ⚠️ partial / non-certified usage · ❌ violation.

| Visible element | Current implementation | Foundation component | Golden ref | Status |
|---|---|---|---|---|
| Page container | `PageContainer` | `PageContainer` | ✅ | ✅ |
| Page heading | `H1 className="sr-only"` | `H1` | ✅ (intentional sr-only admin title) | ✅ |
| Toasts | `ToastContainer` / `useToast` | `ToastContainer` v1.1 | ✅ | ✅ |
| Action error | `Alert variant="error"` | `Alert` | ✅ | ✅ |
| Confirm dialog | `ConfirmModal` (composes `AdminModal`) | `ConfirmModal` | ⚠️ AdminModal is legacy overlay system (O-1 deferred, D-126) | ⚠️ U-20 |
| Exam tabs | `AdminSelectionTabs` → bare `Tabs` | `Tabs` (certified) | ✅ (customExamTabs mode skips fetch) | ✅ |
| Search input | `Input leftIcon aria-label` | `Input` (`--input-*` tokens) | ✅ | ✅ |
| Status filter | `FilterSelect` → `PremiumSelect` | `FilterSelect` | ✅ (combobox + placeholder name) | ✅ |
| User count | `Badge variant="primary"` | `Badge` | ✅ | ✅ |
| Panel surface | `Card variant="subtle"` **+ `ancient-card`** | `Card` | ⚠️ dual-layer: legacy surface class overrides certified recipe in both themes | ⚠️ U-1 |
| Data table | `DataGrid` (raw `<table>`) | `DataGrid` | ✅ (no `--grid-*` tokens exist — Foundation gap, not page defect) | ✅ |
| Desktop avatar | `AdminIconWrap` (initials) | *(no certified Avatar primitive exists)* | ⚠️ parallel primitive (`ancient-icon-badge`/`bg-primary/10`) | ⚠️ U-5 |
| Mobile avatar | hand-rolled `w-9 h-9 rounded-full bg-primary/10` | *(none)* | ❌ duplicate avatar impl on same page | ❌ U-5 |
| Name (desktop) | `AdminText` garamond + raw `text-base` | `AdminText` | ⚠️ parallel typography primitive (T-3/D-2); raw size not `size` prop | ⚠️ U-3 |
| Name (mobile) | raw `<p>` `font-bold text-sm uppercase` | — | ❌ inconsistent w/ desktop | ❌ U-4 |
| Email | raw `<span>` `text-xs` + `Mail` icon | — | ⚠️ raw typography (minor) | ⚠️ U-2 |
| Exam Type | `Badge variant="default"` capitalize | `Badge` | ✅ | ✅ |
| Attempts | raw `<span>` + `Label text-[8px]` | `Label` | ⚠️ raw `text-[8px]` (T-2 category) | ⚠️ U-2 |
| Joined | raw `<span>` `text-xs` `formatDate` | — | ⚠️ raw (minor) | ⚠️ U-2 |
| Status | `Badge success/danger` + icon | `Badge` | ✅ | ✅ |
| Action button | `Button size="xs"` danger/success | `Button` | ✅ | ✅ |
| Loading | inline `LOADING_SKELETON` (4× `LoadingSkeleton`) | `LoadingSkeleton` | ⚠️ page-local table skeleton, not reusable | ⚠️ U-7 |
| Empty | `EmptyState` (UsersIcon) | `EmptyState` | ✅ | ✅ |
| Error | `ErrorState` | `ErrorState` | ⚠️ `onRetry` is a no-op | ❌ U-18 |
| Pagination | `Pagination` (0-based shim) | `Pagination` | ✅ | ✅ |

---

## 4. Visual Language

### 4.1 Containers / Cards

- Panel uses `Card variant="subtle"` but the page layers the legacy **`ancient-card`** class on
  top. Result: in **dark** the base `.ancient-card` (index.css:845-864 — `--surface-primary`,
  `--gradient-surface`, `--elevation-surface`) wins over the `subtle` recipe; in **light** the
  `.light .ancient-card` carved-parchment block (index.css:1127-1178 — `--card-parchment`,
  `--border-gold`, multi-layer inset + hard offset shadow, grain `::before`) wins.
  → **U-1 (P2):** the certified `subtle` recipe is never what the user sees; the visible surface
  is the legacy "ancient" language. Resolution belongs to the Surface family (a certified
  "ancient/premium" variant or removal), not a page-local fix.

### 4.2 Typography

- Desktop name: `AdminText variant="garamond"` + raw `font-bold leading-tight uppercase
  tracking-tight text-base` (AdminUsersView.tsx:42) — uses raw `text-base` instead of a
  `size` prop; the `AdminText` primitive itself is the parallel typography system (T-3/D-2).
- Mobile name: raw `font-bold text-sm uppercase tracking-tight` (UserMobileCard.tsx:19) — a
  second, independent rendering of the same data on the same page.
- `text-[8px]` "Completed" (AdminUsersView.tsx:68), `text-xs` email/joined/mobile meta,
  `text-sm` attempts.
- → **U-2 (P1/P2), U-3 (P1), U-4 (P1).**

### 4.3 List items / avatars

- Desktop avatar: `AdminIconWrap size="md" rounded="full"` (light: `ancient-icon-badge`;
  dark: `bg-primary/10 text-primary`).
- Mobile avatar: hand-rolled `w-9 h-9 rounded-full ... bg-primary/10 text-primary` — duplicate
  implementation with a slightly different size set.
- → **U-5 (P1):** single avatar rendering (a Foundation `Avatar` or one shared primitive).

### 4.4 Buttons / Inputs / Filters / Navigation / Status / Motion / Loading / Empty / Error

- Buttons, Input, FilterSelect, Tabs, Badges, Pagination, Alert, EmptyState, ErrorState,
  LoadingSkeleton: certified Foundation usage (✅ above). Motion: `SectionReveal` (certified),
  `Card` motion (framer), `Tabs` pill spring — all Foundation-owned. Loading: skeleton via
  `LoadingSkeleton` (golden surface recipe). Empty/Error: certified components.
- No hardcoded hex colors, shadows, or gradients in page-owned files; all raw values are
  Tailwind spacing/typography utilities and token alpha modifiers (below).

### 4.5 Raw styling inventory (page-owned files)

| Location | Raw value | Finding |
|---|---|---|
| AdminUsersView.tsx:68 | `text-[8px]` | U-2 |
| AdminUsersView.tsx:42 | `text-base` (on AdminText) | U-3 |
| AdminUsersView.tsx:45,76,67 | `text-xs`, `text-sm`, `font-*`, `uppercase tracking-tight` | U-2 |
| AdminUsersView.tsx:168 | `border-t border-border-subtle/50` | U-6 |
| UserMobileCard.tsx:29 | `border-t border-border-subtle/20` | U-6 |
| UserMobileCard.tsx:15 | `w-9 h-9 rounded-full bg-primary/10 text-primary` | U-5 |
| AdminUsersView.tsx:111,159 / UserMobileCard.tsx:12,28 | `space-y-3`, `space-y-4`, `p-4 pb-0`, `p-4` | U-7 |

---

## 5. Security

### 5.1 Guards (routing)

- `/admin/*` wrapped in `AuthGuard` + `RoleGuard allowedRoles={['admin']}` (App.tsx:109);
  `/admin/users` at App.tsx:112. `AuthGuard` also blocks suspended accounts and, for
  privileged roles, bypasses the exam-selection check. `RoleGuard` redirects non-admin to
  `/unauthorized` and re-checks on stale role. ✅

### 5.2 Service layer

- `toggleUserStatus` → `ensureRole({ allowedRoles: ['admin'], operation, requestId })`
  (userService.ts:149-154); throws sanitized `UNAUTHORIZED_ACCESS` on failure (authUtils.ts).
  ✅
- **`fetchUsersPaginated` has no `ensureRole`** (userService.ts:332-355) — every other admin
  read in the service passes `ctx` through `ensureRole`. The read is protected by the route
  guard and RLS only. → **U-8 (P1):** add the service-layer guard for consistent defense in
  depth.

### 5.3 Repository / RLS

- `user.repository.fetchUsersPaginated` queries `public.users` filtered `role = 'user'` with
  `count: 'exact'`. RLS policies (20260502_rls_hardening.sql:52-93):
  - `rls_users_admin_all` — `FOR ALL` where `is_admin()`, `WITH CHECK is_admin()` → admin full
    access incl. this read + status toggle. ✅
  - `rls_users_self_select` / `rls_users_self_update` — self only; update `WITH CHECK`
    prevents role/educator escalation. ✅
  - `rls_users_sub_admin_select` — sub-admin views students where `educator_id` matches. ✅
- `user.repository.updateUser` (line 34) — writes `{ is_active }`; RLS admin gate enforces. ✅

### 5.4 Sensitive actions

- Activate/deactivate requires a **confirmation dialog** (`ConfirmModal`, danger variant for
  deactivation) before `toggleUserStatus`. ✅
- Optimistic update + revert on failure; success toast on confirm. ✅
- `requestId: user_toggle_${Date.now()}` provided for audit logging. ✅

### 5.5 Error handling / information leakage

- Failure paths are sanitized (`UNAUTHORIZED_ACCESS`, generic user messages). ⚠️
  `toggleUserStatus` returns `{ error: { message: error.message } }` from the catch, and
  `handleConfirmToggle` surfaces `err.message` into `actionError` → **raw Supabase/DB error
  text may reach the UI.** → **U-9 (P1)** — map to user-safe messages (log detail, show
  generic).

---

## 6. Accessibility

### 6.1 Verified present ✅

- sr-only `H1` "Manage Users" (page landmark).
- `Input aria-label="Search students"` (inherits through `...props`).
- `Tabs ariaLabel="Select exam"` (roving tabindex, arrow/Home/End).
- `FilterSelect` → combobox `role="combobox" aria-expanded aria-haspopup` + listbox/option
  roles; accessible name derived from `placeholder` ("Status").
- `Badge`/`Button` text content; icon buttons in `Pagination` carry `aria-label="Previous/
  Next page"`.
- List panel `role="region" aria-label="Users list" aria-live="polite"`; `Alert` role
  `status`/`alert`; `ErrorState` `role="alert"`.
- `ConfirmModal`/`AdminModal`: `role="dialog" aria-modal`, `aria-labelledby`/`aria-describedby`,
  focus trap, Escape (escapeDeactivates false), focus restoration, portal. ✅

### 6.2 Findings

| # | Finding | Wave |
|---|---|---|
| U-10 | `FilterSelect` accessible name comes from `placeholder`, not an explicit `label` (acceptable but fragile). Prefer `label="Status"`. | P1 |
| U-11 | `DataGrid` table itself has no `aria-label` (the wrapping region labels the panel, not the grid). | P0 |
| U-12 | Decorative icons (`Mail`, avatar initials) not `aria-hidden`; initials fallback `?` is exposed to SR. | P1 |
| U-13 | Loading skeleton has no `aria-busy`/`role="status"` announcement; the `aria-live="polite"` region re-renders silently. | P1 |
| U-14 | Optimistic status change re-renders the Status badge inside the `aria-live` region — verify announcement behavior in the visual/functional pass. | P1 (verify) |

---

## 7. Performance

| Check | Result |
|---|---|
| Route lazy-loading | ✅ `React.lazy` in App.tsx:44 |
| Memoized presentational | ✅ `UsersToolbar` (memo); `LoadingSkeleton`/`EmptyState`/`ErrorState` memo'd |
| Request dedup | ✅ `fetchIdRef` ignores stale fetches |
| Module-level skeleton const | ✅ `LOADING_SKELETON` hoisted (not rebuilt per render) |
| Search debounce | ❌ **U-15 (P1)** — every keystroke sets `searchQuery` → full refetch + rerender; no debounce. |
| View re-render | ⚠️ **U-16 (P1)** — `AdminUsersView` not memo'd; `getColumns` rebuilt per render (new closures) → all 20 rows re-render per keystroke. |
| Bundle impact | ✅ no page-specific heavy deps; reuses certified shared components. |
| Suspense | ✅ route-level `Suspense` + `PageLoader`. |

---

## 8. Responsive

| Breakpoint | Behavior | Status |
|---|---|---|
| XS (< 640) | Mobile card list; toolbar stacks (`FilterBar` flex-col); count badge hidden (`hidden sm:flex`); tabs overflow-x auto (`custom-scrollbar`); status filter `min-w-[140px] shrink-0` (⚠️ verify no overflow with search `flex-1 min-w-0`) | ⚠️ U-17 (verify) |
| SM (640–767) | `sm:flex` count badge returns; still mobile cards (cards until `md`) | ✅ |
| MD (768–1023) | `DataGrid` visible (`hidden md:block`); mobile cards hidden | ✅ |
| LG (1024–1279) | Tabs left-aligned (`lg:justify-start`); `PageContainer max-w-[1280px]` | ✅ |
| XL (≥1280) | max-width container; grid full width | ✅ |
| Motion | `motion.div`/`SectionReveal` respect reduced-motion? — ⚠️ verify `prefers-reduced-motion` handling in Foundation (`motion` + `animate-in`), page does not add any itself | U-13b (verify) |

`ancient-card` responsive paddings handled by its own media queries (index.css:1161-1167).

---

## 9. Business Logic

- **Duplicate implementations:** two avatar implementations (desktop vs mobile, U-5); two name
  renderings (U-4); page-local `LOADING_SKELETON` (U-7).
- **Dead / no-op code:** `ErrorState onRetry={() => {}}` — "Try Again" does nothing (U-18,
  functional defect). `handleTabChange` ignores its `val` argument (cosmetic).
- **Flow correctness:** fetch-on-mount + refetch on any filter/search/page change; stale
  responses dropped by `fetchIdRef`; optimistic overlay via `useMemo` merge; revert removes the
  optimistic entry. Confirm flow: request → modal → optimistic set → service → toast/refresh.
- **Service ownership:** all data via `userService` → `user.repository`. ✅
- **Copy:** "Completed" label under the attempts value (AdminUsersView.tsx:68) — `total_exams`
  is a total-count, so "Completed" may mislabel the metric (U-19, P1).
- `PAGE_SIZE = 20` hardcoded in the hook (acceptable; consistent with `pageSize` passed to the
  repository).

---

## 10. Foundation Compliance

| Check | Result |
|---|---|
| Cross-family inheritance | ⚠️ `ancient-card` layering (Surface-family legacy class over a certified Card variant) — U-1; `AdminText`/`AdminIconWrap` are parallel primitives overlapping Typography/Icon families — U-3/U-5 |
| Raw styling | ⚠️ `text-[8px]`, token alpha modifiers `/50`, `/20`, `bg-primary/10` — U-2/U-6/U-5 |
| Duplicate implementations | ❌ avatars ×2, name renderings ×2 — U-4/U-5 |
| Page-level overrides | ⚠️ `ancient-card` is a shared class (used by AdminSubAdminsView, BulkActionBar) — not page-specific, but this page layers it over a certified Card |
| Foundation gaps (not page defects) | no `--grid-*`/`--badge-*`/`--pagination-*`/`--tab-*` role tokens (documented in P2 audits); AdminModal legacy overlay (O-1, D-126); no certified `Avatar` primitive |
| Hardcoded colors/shadows/borders/animations in page files | ✅ none — all via tokens/utilities or the certified Foundation |

---

## 11. Findings register

| # | Area | Finding | Severity | Wave |
|---|---|---|---|---|
| U-1 | Visual/Compliance | `Card subtle` + `ancient-card` dual-layer — certified recipe never visible | High | P2 (Surface family) |
| U-2 | Visual | Raw typography utilities (`text-[8px]`, `text-xs/sm/base`, `font-*`, tracking) in view + mobile card | Med | P1/P2 |
| U-3 | Compliance | `AdminText` parallel typography primitive; raw `text-base` instead of `size` | Med | P1 |
| U-4 | Compliance | Duplicate name rendering (grid `AdminText` vs mobile raw `<p>`) | Med | P1 |
| U-5 | Compliance | Duplicate avatar implementations (desktop vs mobile) + no certified Avatar | Med | P1 |
| U-6 | Visual | Token alpha modifiers `border-subtle/50`, `/20` (raw alphas) | Low | P1 |
| U-7 | Compliance | Page-local `LOADING_SKELETON` composition (not a reusable table skeleton) | Low | P1 |
| U-8 | Security | `fetchUsersPaginated` lacks service-layer `ensureRole` (defense in depth) | Med | P1 |
| U-9 | Security | Raw DB error message surfaced to UI on toggle failure | Low | P1 |
| U-10 | A11y | `FilterSelect` name from placeholder; prefer explicit `label` | Low | P1 |
| U-11 | A11y | `DataGrid` table missing `aria-label` | Low | P0 |
| U-12 | A11y | Decorative icons / `?` fallback exposed to SR | Low | P1 |
| U-13 | A11y | No `aria-busy`/`role="status"` on loading | Low | P1 |
| U-13b | A11y/Motion | Reduced-motion verification for Foundation motion | Low | P1 (verify) |
| U-14 | A11y | Verify live-region announcement of optimistic status change | Low | P1 (verify) |
| U-15 | Perf | No search debounce → refetch per keystroke | Med | P1 |
| U-16 | Perf | `AdminUsersView` re-renders all rows per keystroke (unmemoized, `getColumns` per render) | Med | P1 |
| U-17 | Responsive | Verify XS toolbar overflow (search + `min-w-[140px]` filter) | Low | P1 (verify) |
| U-18 | Business/UX | `ErrorState onRetry` is a no-op ("Try Again" does nothing) | High | P1 |
| U-19 | Business | "Completed" copy mislabels `total_exams` | Low | P1 |
| U-20 | Compliance | `ConfirmModal` rests on legacy `AdminModal` overlay (O-1, D-126 deferred) | Med | P2 (Overlay) |

**Suggested plan gating (for the Implementation Plan step, after approval):**
- **P0 (render-neutral):** U-11.
- **P1 (low-risk):** U-3, U-4, U-5 (rendering dedup, pixel-verify), U-6, U-7, U-8, U-9, U-10,
  U-12, U-13, U-13b, U-14, U-15, U-16, U-17, U-18, U-19.
- **P2 (render-affecting):** U-1 (requires Surface-family decision + approval), U-2 (only where
  a token swap shifts a pixel — component-by-component), U-20 (blocked on O-1 Overlay wave).

---

## 12. Certification readiness & open questions

**Already strong:** clean 3-layer architecture, full RLS + guards + service-level auth on the
sensitive write, certified Foundation coverage for most elements, semantic table, good a11y
foundations (labels, focus trap, live region), responsive split (grid/mobile cards), lazy
loading, request dedup, optimistic updates.

**Blocks full certification (must be resolved or explicitly accepted):**
1. **U-1** — the panel surface is legacy `ancient-card`, not a certified Card variant. Needs a
   decision: adopt as a certified Surface-family variant (frozen), or migrate the panel to a
   certified recipe (render change → approval).
2. **U-18** — no-op retry is a functional defect; "Try Again" must actually refetch.

**Open questions for the approval gate:**
1. Is the current `ancient-card` panel appearance the **Golden Reference** for this page
   (accept U-1 as-is and freeze), or should the Surface family offer a certified variant
   before this page is frozen?
2. Does the admin list's **sr-only H1** satisfy the page-title requirement, or should a visible
   `SectionHeader` (Foundation) be introduced on this page (renders a visible heading — would
   be a render-affecting change)?
3. Approve U-18 retry wiring (UI affordance to re-run `fetchData`)?
4. Approve the P1 scope as proposed (§11) so the Implementation Plan can proceed?

---

## 13. Audit inputs

- Page: `src/pages/admin/AdminUsers.tsx` · `src/components/admin/users/*`
  (`AdminUsersView.tsx`, `UsersToolbar.tsx`, `UserMobileCard.tsx`, `useAdminUsers.ts`,
  `index.ts`, `README.md`).
- Dependencies: `App.tsx` (routes), `guards/Guards.tsx`, `services/userService.ts`,
  `lib/repositories/user.repository.ts`, `utils/authUtils.ts`, `utils/dateUtils.ts`,
  `lib/examUtils.ts`, `components/admin/shared/{AdminSelectionTabs,examPresets}.tsx`,
  Foundation components (`AntigravityUI` barrel → `AntigravityData`, `AntigravityLayout`,
  `AntigravityForm`, `AntigravityCard`, `AntigravityButton`, `AntigravityTypography`, `Alert`,
  `Pagination`, `PremiumSelect`, `AdminModal`, `SharedComponents`, `AdminText`,
  `AdminIconWrap`), `index.css` (`ancient-card`), `supabase/migrations/20260502_rls_hardening.sql`.

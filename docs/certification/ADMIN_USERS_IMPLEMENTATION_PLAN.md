# Admin Users — Implementation Plan (Phase 3.5 · Page 1 of 11)

**Date:** 2026-08-02
**Status:** 📋 PLAN — awaiting approval gate (no implementation performed)
**Input:** `ADMIN_USERS_PAGE_AUDIT.md` (approved 2026-08-02, findings U-1…U-20)
**Phase directive:** Phase 3.5 — Page Certification & Foundation Adoption. Work page-by-page;
no implementation begins without an approved audit. **No P2 (render-affecting) item may be
implemented until explicitly approved at this gate or a follow-up gate.**
**Page:** `Admin Users` — route `/admin/users`
**Scope boundary:** `src/pages/admin/AdminUsers.tsx` → `src/components/admin/users/*`
**Baseline:** Phase 3.4 P0/P1/P2 certified Foundation (frozen). Lint baseline 405 problems
(352 errors / 53 warnings), all pre-existing. `npx tsc -b` exit 0, `npm run build` exit 0.

---

## 1. Binding classification (from the approval gate)

These rules are binding for this and every Phase 3.5 page plan:

- **P0 = render-neutral only.** aria-label, duplicate removal (pixel-identical), documentation,
  token adoption (pixel-identical), defensive guards. No pixel may move in either theme.
- **P1 = low-risk behavioural.** retry wiring, search debounce, rendering optimisation,
  accessibility improvements, skeleton consolidation, `ensureRole` defence-in-depth,
  user-friendly error messages. May not change the certified visual language.
- **P2 = render-affecting.** panel surface, typography, layout, spacing, visual hierarchy.
  **Must return for explicit approval before implementation.**

**Permanent rule (every future visual decision):** before any page-level visual change, ask
*"Can this be solved by improving a certified Foundation component?"* — if yes, improve the
Foundation first; page-specific solutions only when genuinely unique to the page.

**Approval decisions already baked in (from the audit gate):**
- **D1 (U-1 panel surface):** NOT solved inside this page — Surface-family concern. Determine
  if an existing certified surface satisfies the requirement; if yes, migrate to it; if no,
  document the gap and create a Foundation enhancement **before** changing consumers.
- **D2 (visible heading):** keep the sr-only `H1`. No visible `SectionHeader` on this page this
  phase (repository-wide UX decision; would be render-affecting).
- **D3 (U-18 retry):** APPROVED — wire "Try Again" to re-run the page fetch. P1.
- **D4 (P1 scope):** APPROVED — classify every item before implementation (this document).

---

## 2. P0 scope — render-neutral (no per-item approval needed)

All items below are render-neutral: zero pixel movement in both themes, verified by the
pre/post render comparison pass.

| # | Finding | Current | Target | Golden reference | Foundation owner | Risk | Expected impact |
|---|---|---|---|---|---|---|---|
| U-10 | `FilterSelect` name from placeholder | `<FilterSelect placeholder="Status" …/>` (UsersToolbar.tsx:61-64) — a11y name derived from placeholder | Pass explicit `label="Status"`; keep `placeholder` | `Input aria-label="Search students"` (UsersToolbar.tsx:54) — explicit a11y name | Form family (`FilterSelect`/`PremiumSelect`) | None (label feeds `listboxLabel`/`aria-label` only, never visible text) | Stable screen-reader name independent of placeholder copy |
| U-11 | DataGrid table has no `aria-label` | `<DataGrid …/>` renders `<table>` with no accessible name (AntigravityData.tsx:371) | Add optional `aria-label?: string` prop to `DataGrid`, forward to `<table>`; page passes `aria-label="Users table"` | Certified semantic `<table>` (`th scope="col"`, `aria-sort`) | Data family (`DataGrid`) | None (additive, default undefined = no render change) | Table announced with its own name; region `aria-label` remains panel-level |
| U-6 | Token alpha modifiers inline | `border-border-subtle/50` (AdminUsersView.tsx:168), `border-border-subtle/20` (UserMobileCard.tsx:29) | Adopt named alpha tokens **only where pixel-identical** (verify each in both themes); otherwise defer to P2 | Certified token usage (`--border-*`) | Surface/Token family | Low (must pixel-verify each swap; any delta → defer to P2) | Removes inline alpha utilities from page-owned files |
| U-21 | Duplicate-source imports | Two separate `import {…} from '../../common/AntigravityUI'` statements (AdminUsersView.tsx:2-4 and :10) | Merge into a single import statement | Single-source import convention | — (page hygiene) | None | Cleaner page file; no runtime delta |
| U-22 | `handleTabChange` ignores its argument | `handleTabChange = useCallback(() => {…}, [])` (useAdminUsers.ts:78-80) — `val` dropped silently | Rename parameter `_val` to document intent (or accept + ignore) | Callback signature convention | — (page hygiene) | None | Removes a silent-ignore lint smell |

**P0 gate:** all five ship together, then the visual comparison pass proves byte-identical
renders before P1 starts.

---

## 3. P1 scope — low-risk behavioural (approved, non-visual)

Functional / performance / a11y / security work. No certified visual-language change.

| # | Finding | Current | Target | Golden reference | Foundation owner | Risk | Expected impact |
|---|---|---|---|---|---|---|---|
| U-18 | `ErrorState onRetry` is a no-op | `onRetry={() => {}}` (AdminUsersView.tsx:146) — "Try Again" does nothing | Expose `handleRetry = fetchData` from `useAdminUsers`; wire `onRetry={handleRetry}` | ErrorState with functional retry (D3-approved) | Feedback family (ErrorState) | None | Users can recover from transient load failures |
| U-15 | No search debounce | Every keystroke → `setSearchQuery` → full refetch + rerender (useAdminUsers.ts:68-71) | Debounce `searchQuery` (e.g. 300ms) before it feeds `fetchData`; keep optimistic UI responsive | Standard debounce; `fetchIdRef` already drops stale responses | — (page hook; optional shared `useDebouncedValue` util) | Low | Fewer network round-trips + re-renders during typing |
| U-16 | View re-renders all rows per keystroke | `AdminUsersView` unmemoized; `getColumns(onToggleRequest)` rebuilt per render (AdminUsersView.tsx:153) | Wrap `AdminUsersView` in `memo`; hoist `getColumns` via `useMemo`/module-level when deps are stable; memo mobile card | `UsersToolbar` (already `memo`) | — (page view) | Low | Stops 20-row re-render per keystroke |
| U-8 | `fetchUsersPaginated` lacks service-layer guard | No `ensureRole` (userService.ts:332-355); protected by route `RoleGuard` + RLS only | Add `ensureRole({ allowedRoles: ['admin'], operation, requestId })` to `fetchUsersPaginated` | `toggleUserStatus` guard (userService.ts:149-154) | — (service layer) | Low | Consistent defence-in-depth for all admin reads |
| U-9 | Raw DB error may reach UI | `setActionError(err.message)` (useAdminUsers.ts:110) — raw Supabase text on toggle failure | Map to user-safe message; log detail client-side | Sanitized `UNAUTHORIZED_ACCESS` pattern (authUtils.ts) | — (service/hook) | Low | No DB internals leaked to end users |
| U-7 | Page-local table skeleton | Module-level `LOADING_SKELETON` (AdminUsersView.tsx:110-116) — 4× `LoadingSkeleton`, not reusable | Extract to a reusable `TableSkeleton` Foundation composite (see §A) and consume; render-identical | `LoadingSkeleton` certified recipe; `CollectionCard` `role="status"` loading | Feedback/Motion family | Low (render-identical) | One skeleton implementation; page gets thinner |
| U-12 | Decorative icons / initials exposed to SR | `<Mail size={12}/>` (AdminUsersView.tsx:46), initials `?` fallback (AdminUsersView.tsx:39, UserMobileCard.tsx:16) not hidden | `aria-hidden` decorative icons; hide initials fallback from SR when name absent | a11y baseline (AR-021/022/023); avatar with proper SR treatment (see §A Avatar) | Icon family (Avatar, future) | None | Cleaner SR output |
| U-13 | No loading announcement | Skeleton region re-renders silently inside `aria-live="polite"` | Add `aria-busy` / `role="status"` on the loading region | `CollectionCard` loading `role="status"` pattern | Feedback family | None | Loading state announced |
| U-13b | Reduced-motion (verify) | Foundation `motion`/`animate-in` handling needs verification | Verify `prefers-reduced-motion` is respected by Foundation motion on this page; document result | Foundation motion reduced-motion policy | Motion family (verify only) | None | Confirmed accessible motion |
| U-14 | Live-region status change (verify) | Optimistic status badge re-renders inside `aria-live` region (AdminUsersView.tsx:132) | Verify announcement behaviour in the visual/functional pass; adjust region/live granularity if noisy | Region semantics (AR-021) | — (verify only) | None | Confirmed non-noisy announcement |
| U-17 | XS toolbar overflow (verify) | Search `flex-1 min-w-0` + `min-w-[140px]` filter at <640px (UsersToolbar.tsx) | Verify no overflow on smallest viewport; adjust spacing only if broken | Responsive baseline (§8 of audit) | — (verify only) | None | Confirmed XS layout |
| U-19 | "Completed" copy mislabels `total_exams` | `<Label className="text-[8px]">Completed</Label>` (AdminUsersView.tsx:68) | Rename to accurate label (e.g. "Exams" / "Attempts") | Metric-label convention | — (copy only) | None | Accurate metric labelling |

**P1 gate:** all approved items implement together after P0 renders are proven identical; then
`npx tsc -b` + `npm run build` + `npm run lint` (must stay at 405/352/53, zero introduced) and
a functional pass (retry, debounce, toggle failure path) before any P2 work.

---

## 4. P2 scope — render-affecting (⚠️ requires explicit approval)

These change what the user sees in at least one theme. **No code until approved.**

| # | Finding | Current | Target | Golden reference | Foundation owner | Risk | Expected impact |
|---|---|---|---|---|---|---|---|
| U-1 | Panel surface = legacy `ancient-card` | `Card variant="subtle"` + `className="ancient-card overflow-hidden"` (AdminUsersView.tsx:132) — certified `subtle` recipe never visible; legacy class wins in both themes | **D1 path:** (a) determine if a certified Surface variant satisfies the requirement; (b) if yes → migrate panel to it (render change); (c) if no → document gap + create certified Surface-family variant **before** touching this page | Certified `Card` surface language (DS-001); the "ancient/premium" look as a frozen variant | **Surface family** | High (visible) | Page consumes a certified surface; no page-owned surface language |
| U-2 | Raw typography utilities | `text-[8px]` (AdminUsersView.tsx:68), `text-xs/sm/base`, `font-*`, tracking in view + mobile card | Replace with certified Typography primitives/tokens **only where a token exists**; any pixel shift → part of this P2 approval | Certified Typography family (T-3 composite, deferred D-126) | **Typography family** | Med (visible type scale changes) | Consistent typography; page loses raw type utilities |
| U-3 | `AdminText` parallel primitive + raw `text-base` | `AdminText as="span" variant="garamond" className="… text-base"` (AdminUsersView.tsx:42) — parallel primitive overlapping certified Typography; `text-base` (16px) has no matching token | Foundation Typography composite (T-3/D-2): `AdminText` becomes thin wrapper or is replaced; page consumes one primitive | Single Typography owner (D-2 principle) | **Typography family** | Med | One typography system; page becomes thin consumer |
| U-4 | Duplicate name rendering | Grid: `AdminText` garamond 16px (AdminUsersView.tsx:42); mobile: raw `<p> font-bold text-sm` (UserMobileCard.tsx:19) — two independent renders of same data | Single canonical name rendering shared by both breakpoints (visual unification decision) | Typography family after T-3 | Typography family (decision) | Med (mobile name appearance changes) | One implementation; consistent identity |
| U-5 | Duplicate avatar implementations | Desktop: `AdminIconWrap size="md" rounded="full"` (AdminUsersView.tsx:38); mobile: hand-rolled `w-9 h-9 … bg-primary/10` (UserMobileCard.tsx:15) — no certified `Avatar` primitive exists | New certified **`Avatar`** Foundation primitive (initials, size/rounded tokens, light `ancient-icon-badge` + dark `bg-primary/10`); both breakpoints consume it | `AdminIconWrap` visual contract promoted to certified `Avatar` | **Icon/Display family** (new `Avatar`) | Med (light-mode mobile avatar appearance may unify) | One avatar implementation; a certified reusable primitive |
| U-20 | `ConfirmModal` rests on legacy `AdminModal` | `ConfirmModal` → `AdminModal` (O-1 legacy overlay, D-126 deferred) | **Deferred to Overlay wave** — migrate `AdminModal`/`ConfirmModal` to the unified Overlay family when O-1 is approved | Certified `Menu`/overlay surface contract (O-1) | **Overlay family** | Med (modal surface) | Single overlay system |

**P2 reclassification note:** the audit (§11) originally suggested U-3/U-4/U-5 as P1. Under the
binding classification (duplicate removal = P0 only when pixel-identical; typography/visual
hierarchy = P2), all three are reclassified **P2** because unifying mobile vs desktop renderings
changes pixels in at least one theme. This is presented here for the gate rather than assumed.

**P2 execution model (if approved):** one item at a time, each with its own decision entry in
`DESIGN_DECISION_LOG.md`, implementation, visual comparison vs its own before/after, then
re-certification. U-20 additionally remains blocked on the O-1 Overlay wave.

---

## Section A — Foundation Opportunity Register

For every finding that is (or may be) a Foundation problem, record whether the fix belongs in
the Foundation, which family owns it, and which reusable component evolves. **This section is
the permanent rule in action: page-level visual change → improve the Foundation first.**

| Finding | Is it a Foundation problem? | Should the fix live in the Foundation? | Owning family | Reusable component that evolves | Page action |
|---|---|---|---|---|---|
| U-1 | Yes — page layers a legacy surface class over a certified Card; the certified `subtle` recipe is never visible | **Yes** | Surface | `Card` variants — add a certified "ancient/premium" variant (or decide the certified `subtle` render is the golden reference) | None until the Foundation decision lands; then consume the certified variant |
| U-2 | Partial — raw type utilities are page-owned, but the token/primitive set is the gap | **Yes** (token + primitive layer) | Typography | T-3 composite / canonical size tokens (`--text-*`) | Token adoption where pixel-identical (P0); visual swaps only after T-3 |
| U-3 | Yes — `AdminText` is a parallel primitive overlapping certified Typography (T-3/D-2) | **Yes** | Typography | T-3 single Typography composite; `AdminText` becomes thin wrapper or is retired | Consume one primitive after T-3 |
| U-4 | Partial — page owns duplicate renderings, but only one will exist after T-3 | **Yes** (via T-3) | Typography | T-3 composite (canonical name rendering) | Adopt canonical rendering after T-3 |
| U-5 | Yes — no certified `Avatar` exists; two page implementations both re-derive the same contract | **Yes** | Icon/Display | **New `Avatar` primitive** (initials, size `sm/md/lg`, rounded `md/lg/full`, light `ancient-icon-badge` / dark `bg-primary/10`) | Consume `Avatar` on both breakpoints after it is certified |
| U-6 | Partial — alpha modifiers are acceptable Tailwind usage; named tokens would be cleaner | **Optional** | Surface/Token | `--border-*` alpha tokens | Pixel-identical adoption only |
| U-7 | Yes — page-local `LOADING_SKELETON` should be a reusable table skeleton | **Yes** | Feedback/Motion | New `TableSkeleton` composite (render-identical) | Consume it |
| U-8 | No — service-layer auth guard | No | — | — | Fix in `userService.fetchUsersPaginated` |
| U-9 | No — error-message mapping | No | — | — | Fix in hook/service |
| U-10 | No — page usage of `FilterSelect` | No (usage only) | Form (owns `FilterSelect`) | — | Pass `label` prop |
| U-11 | No (small additive prop) | **Yes** (additive, render-neutral) | Data | `DataGrid` gains optional `aria-label` | Pass `aria-label` after prop lands |
| U-12 | Yes (via `Avatar`) | **Yes** | Icon/Display | `Avatar` handles SR treatment | Consume `Avatar` |
| U-13 | Yes (additive, render-neutral) | **Yes** | Feedback | `TableSkeleton`/`LoadingSkeleton` carries `aria-busy`/`role="status"` | Consume it |
| U-13b / U-14 / U-17 | No — verify only | No | — | — | Verify, document |
| U-15 | No — page hook behaviour | No | — | — | Debounce in hook (optional shared util) |
| U-16 | No — page view | No | — | — | `memo` + hoisted columns |
| U-18 | No — page wiring | No | — | — | Expose retry from hook |
| U-19 | No — copy | No | — | — | Rename label |
| U-20 | Yes — legacy overlay | **Yes** | Overlay | O-1 unified modal surface; `AdminModal`/`ConfirmModal` migrate (deferred D-126) | None until O-1 |

**Register summary — Foundation-owned work:** U-1 (Surface), U-2/U-3/U-4 (Typography/T-3),
U-5 (`Avatar`), U-6 (optional), U-7 (`TableSkeleton`), U-11 (DataGrid prop), U-12/U-13 (via
Avatar/TableSkeleton), U-20 (Overlay O-1). Page-owned-only work: U-8, U-9, U-10, U-15, U-16,
U-18, U-19, U-21, U-22 + verifications.

---

## Section B — Consumer Simplification Score

Measures the page becoming a **thin consumer** of the Foundation: duplicated JSX/styling/
rendering/helpers/a11y code removed. Baseline page-owned surface area:

| File | Lines (baseline) |
|---|---|
| `AdminUsersView.tsx` | 180 |
| `UsersToolbar.tsx` | ~76 |
| `UserMobileCard.tsx` | 37 |
| `useAdminUsers.ts` | 124 |
| **Total page-owned** | **~417** |

**Simplification ledger (duplicated / page-owned code that disappears):**

| Item | Duplicate / page-owned code removed | After |
|---|---|---|
| U-5 Avatar | hand-rolled mobile avatar div (UserMobileCard.tsx:15-17) + desktop initials block → one `<Avatar>` | 2 avatar impls → 1 (Foundation) |
| U-4 Name | duplicate mobile `<p>` name (UserMobileCard.tsx:19) → canonical rendering | 2 name impls → 1 (Foundation) |
| U-7 Skeleton | page-local `LOADING_SKELETON` (AdminUsersView.tsx:110-116) → `TableSkeleton` | page-local skeleton → 0 |
| U-3 Typography | raw `text-base` + parallel `AdminText` usage → one Typography primitive | parallel primitive use → 0 (after T-3) |
| U-2 Type utilities | `text-[8px]`, `text-xs/sm/base`, `font-*`, tracking (AdminUsersView/UserMobileCard) → certified primitives/tokens | raw type utilities → 0 |
| U-6 Alphas | inline `border-border-subtle/50`, `/20` → named tokens | inline alpha utilities → 0 |
| U-11/10 a11y | n/a (additive) | DataGrid + FilterSelect carry explicit names |
| U-12 | `?` initials fallback exposed to SR | handled inside `Avatar` |

**Projected post-plan page profile (thin-consumer target):**
- Duplicate implementations: **2 → 0**
- Page-owned raw styling instances: **~10 → 0**
- Page-owned components: **3** (unchanged count, each thinner); hook owns behaviour
- Foundation components consumed: rises with `Avatar`, `TableSkeleton`, Typography composite
- Residual page-owned styling: layout/spacing utilities only (grid/card placement), which is
  the intended thin-consumer split

---

## 5. Foundation Adoption Score (permanent metric — every future page audit)

Block format (must appear in every Phase 3.5 page audit and plan):

```
Foundation Components Used:     15 / 22   (certified inventory; page's distinct certified components in full adoption)
Foundation Opportunities:       5          (U-1 Surface, U-3 Typography, U-5 Avatar, U-7 TableSkeleton, U-20 Overlay)
Page-Owned Components:          3          (AdminUsersView, UsersToolbar, UserMobileCard) + 1 hook (useAdminUsers)
Raw UI Implementations:         2          (mobile avatar, mobile name)
Foundation Adoption:            68%        → Target: 95%+
```

**Definition:** `Foundation Components Used` = distinct certified Foundation components the page
consumes, over the 22-component certified inventory (Phase 3.4 P0–P2). `Raw UI Implementations`
= independent hand-rolled UI constructs that a certified component should own. Target ≥95%
means the page consumes nearly every certified component it could, with zero raw implementations
and minimal page-owned surface.

**Expected trajectory for Admin Users:** 15/22 (68%) at audit → **~20/22 (91%)** after P0+P1
+ `Avatar` + `TableSkeleton` + Typography composite land → **≥21/22 (95%+)** after the Surface
decision (U-1) resolves.

---

## 6. Execution order & verification

1. **P0 gate** — implement U-10, U-11, U-6, U-21, U-22. Visual comparison pass must prove
   byte-identical renders in both themes.
2. **P1 gate** — implement U-18, U-15, U-16, U-8, U-9, U-7, U-12, U-13 (+ U-13b/U-14/U-17
   verifications), U-19. Verify: `npx tsc -b` exit 0, `npm run build` exit 0, `npm run lint`
   exactly 405/352/53 (zero introduced). Functional pass: retry refetches, debounce fires once
   per burst, toggle-failure reverts + user-safe message.
3. **P2 gate** — present each render-affecting item (U-1, U-2, U-3, U-4, U-5, U-20) for explicit
   approval. Implement one at a time; each gets a `DESIGN_DECISION_LOG.md` entry + its own
   before/after visual comparison + re-certification. U-20 additionally waits on O-1.
4. **Certification** — write `ADMIN_USERS_PAGE_CERTIFICATION.md`, update
   `FOUNDATION_FREEZE_REGISTER.md` / `PHASE_3_1_EXECUTION_LOG.md`, then proceed to Page 2
   (Admin Sub-Admins). Never start the next page until the current one is certified.
5. Update `ADMIN_USERS_PAGE_AUDIT.md` §12 as decisions resolve; **retro-add the Foundation
   Adoption Score block** to this audit per the permanent-metric rule.

---

## 7. Approval gate — questions

1. **Approve P0 scope** (U-10, U-11, U-6, U-21, U-22) — render-neutral?
2. **Approve P1 scope** (U-7, U-8, U-9, U-12, U-13, U-13b, U-14, U-15, U-16, U-17, U-18, U-19)
   as classified here?
3. **P2 — explicitly approve which of the following may proceed** (each still needs a per-item
   decision entry before code):
   - U-1 → Surface-family resolution (which certified surface is the golden reference?)
   - U-2 → typography token adoption (accepted visual deltas?)
   - U-3 → Typography composite (T-3) unblock
   - U-4 → canonical name rendering (which look wins?)
   - U-5 → new certified `Avatar` primitive
   - U-20 → remains blocked on O-1 (approve as "deferred this wave")
4. **Confirm the Foundation Adoption Score block** (15/22, 5, 3, 2, 68% → 95%+ target) as the
   permanent metric format.

---

## 8. Inputs

- Audit: `docs/certification/ADMIN_USERS_PAGE_AUDIT.md`
- Page: `src/pages/admin/AdminUsers.tsx` · `src/components/admin/users/*`
- Dependencies: `services/userService.ts`, `lib/repositories/user.repository.ts`,
  `utils/authUtils.ts`, `components/common/AntigravityData.tsx` (DataGrid),
  `AntigravityLayout.tsx` (FilterSelect/FilterBar/Stack), `AntigravityTypography.tsx` (Label),
  `AdminText.tsx`, `AdminIconWrap.tsx`, `SharedComponents.tsx` (ErrorState/LoadingSkeleton),
  `src/styles/themes.css` (`--text-*` tokens)
- Governance: `DESIGN_DECISION_LOG.md` (D-122, D-126), `FOUNDATION_FREEZE_REGISTER.md`,
  `PHASE_3_1_EXECUTION_LOG.md`

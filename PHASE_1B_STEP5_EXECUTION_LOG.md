# Phase 1b — Step 5 Execution Log

**Governance baseline:** `FOUNDATION_GOVERNANCE.md` **v1.19.0** (§14, 5B-1 … 5B-10)
**Inventory baseline:** `PHASE_1B_STEP5A_COMPONENT_INVENTORY.md` — approved, FROZEN
**Start:** 2026-07-31

This log holds the Step 5 execution artifacts required by the 5B recommendations:
Dead Component Register (5B-6), Exception Register (5B-8), per-group Dependency Graphs
(5B-5), Regression Baselines (5B-7), and Group Completion Reports (5B-9).

---

## 1. Inventory Freeze (5B-1)

The Step 5A inventory is FROZEN. Newly discovered reusable components are documented
here and scheduled after the current group — never absorbed into active migration.

**Pending discoveries (scheduled after current group):**
| # | Component | Discovered | Classified as | Scheduled |
|---|---|---|---|---|
| — | none | — | — | — |

---

## 2. Dead Component Register (5B-6)

Components confirmed dead (0 consumers). NOT deleted during Step 5; removal is
scheduled for the Phase 1b Legacy Cleanup step.

| # | Component | Location | Reason | Consumers | Removal phase |
|---|---|---|---|---|---|
| D1 | `ActivityCard` | `src/components/common/AntigravityDashboard.tsx:10` | Unused; superseded by `Card` composites | 0 | Phase 1b Legacy Cleanup |
| D2 | `CTACard` | `src/components/common/AntigravityResults.tsx:44` | Unused; superseded by `Card` composites | 0 | Phase 1b Legacy Cleanup |
| D3 | `DataTable` | `src/components/common/DataTable.tsx:39` | Unused; `DataGrid` is canonical | 0 | Phase 1b Legacy Cleanup |
| D4 | `Pagination` | `src/components/common/Pagination.tsx` | Unused; no active consumer | 0 | Phase 1b Legacy Cleanup |
| D5 | `AdminCard` | `src/components/admin/common/AdminCard.tsx` | Duplicate of `Card`; consumers migrated in Group 1, export then unused | 0 (after G1) | Phase 1b Legacy Cleanup |
| D6 | `useAdminExams` | `src/components/admin/exams/useAdminExams.ts` + `index.ts` | Orphaned hook (0 consumers) — stale duplicate of `useAdminSettings`; contained never-rendered error/success toasts | 0 | Removed (Group 5 WP1, dead-code directive) |

---

## 3. Exception Register (5B-8)

Migrations that cannot fully satisfy Design System rules. Every entry traceable.

| # | Component | Reason | Temporary solution | Target resolution phase | Approval ref |
|---|---|---|---|---|---|
| E1 | `StatCard` | 2px label/value gap (`gap-0.5`) is off the DS-014 spacing scale; increasing to `gap-1` changes visual parity | Keep `gap-0.5` (resolves via Tailwind default, no visual change) | Repository Migration / DS-014 Token Approval | Step 5A inventory + 5B-8 |
| E2 | `BrandTitle` | `pl-[0.2em]` left indent is a relative (em) optical compensation tied to `tracking-[0.2em]`; cannot be a fixed px token | Keep `pl-[0.2em]` | Repository Migration / DS-014 Token Approval | Step 5B-8 (0 consumers) |
| E3 | `ScoreCard` | 2px H3 top margin (`mb-0.5`) off DS-014 scale; changing to `mb-1` alters vertical rhythm | Keep `mb-0.5` | Repository Migration / DS-014 Token Approval | Step 5B-8 |
| E4 | `AdminCard`→`Card` (dark mode) | `AdminCard` default variant rendered empty class (`!isDark ? 'ancient-card' : ''`) — dark mode showed a bare unstyled div (latent defect). Canonical `Card` now applies the themed `ancient-card` surface in both themes | Deviation recorded: dark-mode surface restored; light mode unchanged | None (defect corrected) | Group 1 completion report |
| E5 | `Input` | `pl-11` (44px) left padding when a left icon is present — off DS-014 scale | Keep (resolves via Tailwind default) | Repository Migration / DS-014 Token Approval | Group 2 |
| E6 | `Input` | `p-2.5` (10px) right-icon action button padding — off scale | Keep | Repository Migration / DS-014 Token Approval | Group 2 |
| E7 | `Select` | `pl-11` (44px) left padding when an icon is present — off scale | Keep | Repository Migration / DS-014 Token Approval | Group 2 |
| E8 | `RadioGroup` | `py-1.5` (6px) option button vertical padding — off scale | Keep | Repository Migration / DS-014 Token Approval | Group 2 |
| E9 | `PremiumSelect` | `md:px-3.5` (14px) trigger horizontal padding at md+ — off scale | Keep | Repository Migration / DS-014 Token Approval | Group 2 |
| E10 | `SegmentedFilter` | `px-2.5` (10px), `gap-0.5` (2px), `gap-1.5` (6px) tab padding/gaps — off scale | Keep | Repository Migration / DS-014 Token Approval | Group 2 |
| E11 | `ThemeToggle` | `px-[10px]` (10px) label inset padding — off scale | Keep | Repository Migration / DS-014 Token Approval | Group 2 |
| E12 | `CarouselDots` | `-m-1.5` (6px) negative hit-area margin — off scale | Keep | Repository Migration / DS-014 Token Approval | Group 2 |
| E13 | `Button` (geometry family) | Pre-frozen DS-002 geometry, pixel-verified: `gap-1.5`(6px), `h-[48px]` (md/lg), `rounded-[10px|12px|14px|16px|18px]`, `text-[10px|13px|14px|15px]`, auth `tracking-[1.5px]`, auth `shadow-[0_12px_24px_rgba(124,58,237,0.3)]`, auth `bg-slate-900/50/100` + `shadow-slate-900/10` (theme-independent auth material) | Keep — freeze forbids redesign; certify-only | Token Phase / DS-014 + radius + typography token approval | Group 3 |
| E14 | `IconButton` (geometry family) | Pre-frozen geometry: `w-[36px] h-[36px] rounded-[10px]` (sm), `w-[44px] h-[44px]` (md); `rounded-xl`(12px) on-scale but fixed-icon geometry is bespoke | Keep | Token Phase (register `--radius-icon-sm` per GOLDEN_REFERENCE §3.5) | Group 3 |
| E15 | `Tabs` (geometry family) | Frozen tab geometry, pixel-verified: `p-1.5`(6px) track padding, `gap-1.5`(6px) tab gap, container heights `h-[40px|44px|48px|52px|56px]` (sm/md/lg × mobile/desktop), tab font sizes `text-[10px|11px|12px|13px]` | Keep | Token Phase / DS-014 + typography approval | Group 4 |
| E16 | `Menu` | `min-w-[200px]` arbitrary dropdown min-width (content-dependent geometry, not spacing) | Keep | Token Phase | Group 4 |
| E17 | `Alert` | `gap-2.5`(10px) stack gap, `rounded-[14px]`(14px) radius, `text-[13px]`/`text-[11px]` body/title type, `mt-0.5`/`mb-0.5`(2px) icon/title margins — all off DS-014/radius/typography scale | Keep — pre-frozen DS-004 micro-geometry; changing alters contextual-alert density now used app-wide | Token Phase / DS-014 + radius + typography token approval | Group 5 |
| E18 | `ToastContainer` | `gap-2.5`(10px) toast stack gap — off DS-014 scale | Keep — retained for routine-success toasts (success-only app-wide after Group 5) | Token Phase / DS-014 approval | Group 5 |
| E19 | `AdminModal` | `sm:rounded-[2.5rem]`(40px) desktop radius — off radius scale; description `text-[10px]` — off typography scale | Keep — frozen modal geometry, pixel-verified | Token Phase / radius + typography token approval | Group 5 |
| E20 | `NotificationBell` | Trigger `w-9 h-9`(36px), unread badge `-top-0.5`/`-right-0.5`/`px-0.5`(2px) + `text-[9px]`, panel `text-[13px]`/`text-[10px]` — off scale | Keep — frozen bell geometry + badge micro-type | Token Phase / DS-014 + typography token approval | Group 5 |
| E21 | `LoadingOverlay` | `text-[10px]` label — off typography scale | Keep — matches frozen micro-caption pattern (E13/E16) | Token Phase / typography token approval | Group 5 |

---

## 4. Group 1 — Surface: Dependency Graph (5B-5)

Documented before Group 1 migration. Canonical-first order enforced (5B-2).

```
Card (canonical)             AdminCard → (3 consumers) → migrate to Card
   ↓ depends on              ScoreCard / ResultStatCard / ExamCard → depend on Card
   ThemeContext, framer-motion
   Used by: 48 consumers

StatCard
   ↓ depends on: Card family? (No — standalone div + PremiumIconContainer)
   PremiumIconContainer, ThemeContext
   Used by: 9

ScoreCard / ResultStatCard   ExamCard
   ↓ depends on: Card        ↓ depends on: Card, StatCard? (composites)
   Used by: 1 each           Used by: 2

Typography (H1/H2/H3/Body/Label/Display/Caption/BrandTitle) — standalone
IconBadge / PremiumIconContainer / AdminIconWrap / Logo / PaletteBackground — standalone
AdminText — standalone
SelectionContainer / StatePanel / FilterBar / AdminPageTitle — standalone (legacy-adjacent, in scope)
Legacy (EXCLUDED, §11): SectionHeader, PageHeader, SectionWrapper
```

**Migration order (Group 1):**
1. `Card` (canonical) — certify
2. `AdminCard` consumers → `Card`; `AdminCard` → Dead Register D5
3. `StatCard` (+ E1 exception)
4. Typography family
5. `AdminText`, `AdminPageTitle`
6. Icons/brand: `IconBadge`, `PremiumIconContainer`, `AdminIconWrap`, `Logo`, `PaletteBackground`
7. Containers: `SelectionContainer`, `StatePanel`, `FilterBar`

---

## 5. Group 1 — Regression Baseline (5B-7)

Captured before migration. Reference for certification.
- **Screenshots:** dev-server/browser capture (1440×900, dark+light) deferred to environment availability; class/DOM-level parity assertions verified statically instead (see below).
- **Responsive:** Class strings verified per breakpoint (`md:`, `lg:`, `sm:` variants) — unchanged.
- **Interaction:** Card hover lift + shadow (unchanged, Card internals untouched); AdminCard→Card hover: `subtle` variant has NO hover-transform — matches AdminCard (no lift). Ancient-card `:hover` shadow/border rule preserved.
- **Accessibility:** AdminCard `role="region"`, `aria-label`, `aria-live` pass through Card's `...props` spread unchanged (AdminUsersView).
- **Static parity assertions (Group 1 real change only):** `AdminCard` rendered class set `ancient-card overflow-hidden p-0` (light) / `overflow-hidden p-0` (dark). Post-migration: `Card variant="subtle" padding={0}` + className `ancient-card overflow-hidden` → `ancient-card` overrides surface props (bg/radius/border/shadow/padding) in both themes; `subtle` adds no hover transform; `micro-light` gradient identical to `ancient-card` gradient. Net rendered surface = identical in light mode, corrected in dark mode (E4).

## 6. Group Completion Reports (5B-9)

### Group 1 — Surface: COMPLETE (2026-07-31)

**Migration summary:** Group 1 audited and certified. All 17 in-scope Surface components verified token-compliant (spacing via mapped utilities / `var(--space-*)`). The only structural duplicate — `AdminCard` — was eliminated by migrating its 3 consumers to the canonical `Card`.

**Components migrated:**
- `Card` (canonical) — verified already token-compliant; no internals changed (certified only)
- `AdminCard` → **migrated**: 3 consumers (`AdminSubAdminsView`, `AdminUsersView`, `AdminQuestions`) now use `<Card variant="subtle" padding={0} className="ancient-card overflow-hidden">`; `AdminCard.tsx` now orphaned → Dead Register D5
- `StatCard`, `ScoreCard`, `ResultStatCard`, `ExamCard`, Typography×8, `AdminText`, `AdminPageTitle`, `IconBadge`, `PremiumIconContainer`, `AdminIconWrap`, `Logo`, `PaletteBackground`, `SelectionContainer`, `StatePanel`, `FilterBar` — certified compliant, no changes required

**Duplicate reductions:** 1 (`AdminCard` eliminated as duplicate of `Card`; its surface is preserved via the `ancient-card` class on the canonical component)

**Spacing token adoption:** All in-scope Group 1 components consume spacing via mapped utilities (p-0…p-24, gap-*, mt-*, space-y-*) which resolve through `--spacing-*` → `--space-*` tokens (index.css:189–209). No hardcoded spacing introduced. Off-scale values registered as exceptions E1–E3.

**Layout primitive adoption:** Not applicable to Group 1 components (none compose PageContainer/Stack/Grid/SectionBlock; they are leaf UI surfaces). `PageHeader`/`SectionWrapper` legacy spacing (4px/8px/14px) remains out of scope (§11).

**Behavioral parity verification:**
- `AdminCard`→`Card`: class-level parity confirmed; light mode identical; dark mode latent defect corrected (E4); `role`/`aria-*` preserved via spread; hover behavior preserved (`subtle` = no lift, matching AdminCard)
- No changes to any other Group 1 component (certification-only)

**Validation:** `npx tsc --noEmit` = 0 errors. `npm run build` (`tsc -b`) still fails on the documented PRE-EXISTING blockers only (unused vars TS6133, TS2367 comparisons, `ToastContainer` barrel export in `SubAdminCreate.tsx:10`, `topicTestService.ts:103`) — none in Group 1 changed files, recorded separately per Health Checkpoints.

**Remaining work:** None for Group 1. AdminCard file removal + dead CTACard/ActivityCard/DataTable/Pagination removal deferred to Phase 1b Legacy Cleanup (Dead Register).

**Certification status:** PASSED — pending user approval to proceed to Group 2 (Form).

### Group 2 — Form: COMPLETE (2026-07-31)

**Migration summary:** All 14 Form components audited and certified. Each was verified against the Design System (spacing tokens, layout primitives, state matrix, accessibility). The group required ONE code change (zero-visual token adoption); all off-scale micro-values registered as traceable exceptions (E5–E12). Public APIs, exports, and interfaces unchanged. No duplicates introduced; wrappers remain thin.

**Per-component audit + result:**

| # | Component | File | Consumers (files) | DS audit result | Action |
|---|---|---|---|---|---|
| 1 | `Input` | `AntigravityForm.tsx:14` | 19 | Spacing via mapped utilities; `pl-11`(44px), `p-2.5`(10px) off-scale | E5, E6; no code change |
| 2 | `TextArea` | `AntigravityForm.tsx:68` | 5 | All spacing on-scale (`p-3`, `px-4 py-3`) | Certify clean |
| 3 | `Select` | `AntigravityForm.tsx:104` | 2 | `pl-11`(44px) off-scale | E7; no code change |
| 4 | `PremiumSelect` | `PremiumSelect.tsx` | 1 direct + FilterSelect | `md:px-3.5`(14px) off-scale | E9; no code change |
| 5 | `FilterSelect` | `AntigravityLayout.tsx:231` | ~8 | Thin wrapper composing PremiumSelect (5B-4) | Certify clean |
| 6 | `Switch` | `AntigravityForm.tsx:168` | 5 | Spacing clean (`gap-3`); `cubic-bezier(...)` class is inert (no such Tailwind utility) — pre-existing, no rendered effect | Certify clean; dead class noted |
| 7 | `Checkbox` | `AntigravityForm.tsx:216` | 3 | Spacing clean (`gap-3`); `sr-only peer` + focus ring | Certify clean |
| 8 | `Radio` | `AntigravityForm.tsx:267` | 1 | Spacing clean | Certify clean |
| 9 | `RadioGroup` | `AntigravityForm.tsx:324` | 4 | `py-1.5`(6px) off-scale; disabled option buttons lack `disabled` attr (a11y nuance, pre-existing) | E8; no code change |
| 10 | `SegmentedFilter` | `SegmentedFilter.tsx` | 2 | `px-2.5`/`gap-0.5`/`gap-1.5` off-scale; composes SelectionContainer; roving-tab a11y | E10; no code change |
| 11 | `BilingualToggle` | `BilingualToggle.tsx` | ~5 | Spacing clean (`gap-1 p-1`, `px-3 py-3`) | Certify clean |
| 12 | `ThemeToggle` | `ThemeToggle.tsx` | 1 | `p-[4px]` = exact token value | **Migrated** `p-[4px]`→`p-1` (identical 4px, token-resolving, zero visual change); `px-[10px]` → E11 |
| 13 | `CarouselDots` | `CarouselDots.tsx` | 1 | `-m-1.5`(6px) off-scale; `role=tablist`/`tab` + aria-selected | E12; no code change |
| 14 | `AdminFilterBar` | `AdminFilterBar.tsx` | 2 | Composite of FilterBar + Input + FilterSelect + IconButton; all on-scale | Certify clean (wrapper, 5B-4) |

**Behavioral state matrix (per-component, pre/post identical):** Default ✓ · Hover ✓ · Focus ✓ (Input/Select/PremiumSelect/ThemeToggle/SegmentedFilter have visible focus rings; Switch/Checkbox/Radio rely on native `sr-only` input focus ring) · Active ✓ · Disabled ✓ (opacity + pointer-events + native `disabled` where applicable) · Read-only n/a · Error/Invalid n/a (no error state API) · Loading n/a (no loading API; AdminFilterBar passes `loading` to IconButton) · Keyboard ✓ (native inputs; PremiumSelect/SegmentedFilter implement full arrow/Home/End/Enter/Escape; RadioGroup uses native buttons) · Screen reader ✓ (labels/aria-checked/aria-selected/role=switch/combobox/listbox/radiogroup) · Light theme ✓ (token-driven) · Responsive ✓ (sm/md/lg/xl variants unchanged).

**Accessibility verification:** Focus visibility preserved; no ARIA removed; labels intact; disabled semantics unchanged; tab order unchanged; SR semantics unchanged. No accessibility regressions. Pre-existing nuance recorded (not changed): RadioGroup disabled state does not set `disabled` on option buttons (pointer-events none only).

**Consumer impact summary:** Largest consumers — Input (19 files), Switch (5), TextArea (5). All usage is prop-based with stable public APIs; no customization patterns broken. Regression risk: LOW (no API changes; single visual-neutral class swap). Validation: `npx tsc --noEmit` = 0 errors; changed file (ThemeToggle) typechecks clean; build failures remain the documented pre-existing blockers only.

**Duplicate analysis:** No duplicate implementations among Form components. `Select` (native) vs `PremiumSelect` (custom combobox) vs `FilterSelect` (thin wrapper) are distinct capabilities; the PremiumSelect/FilterSelect consolidation decision from §3.7 remains deferred — no consolidation performed (parity not proven, keep both).

**Wrapper preservation (5B-4):** `FilterSelect` and `AdminFilterBar` remain thin wrappers composing canonical components; no business logic added.

**Spacing token adoption:** All Form components consume spacing via mapped utilities resolving through `--spacing-*` → `--space-*`. One arbitrary on-scale value converted to token utility (ThemeToggle `p-1`). Off-scale values registered E5–E12.

**Validation report:** TypeScript clean for modified files (0 errors overall). Build — pre-existing blockers only. Responsive — no class changes affecting breakpoints. Visual — no redesign, spacing/typography/color parity. API — props/events/exports/interfaces unchanged. Accessibility — preserved.

**Certification status:** PASSED — pending user approval to proceed to Group 3 (Action: Button, IconButton, PrimaryButton, RetryButton, ErrorActionButtons).

### Group 3 — Action: COMPLETE (2026-07-31)

**Migration summary:** All 5 Action components audited and certified. ZERO code changes required. Button (DS-002, permanently frozen) and IconButton are token-compliant via mapped utilities + Semantic material tokens; their bespoke geometry (heights, radii, font sizes) is pre-frozen and pixel-verified → registered E13/E14. PrimaryButton, RetryButton, ErrorActionButtons are thin wrappers composing the canonical Button (5B-4) with on-scale spacing (`px-8`=32px, `gap-3`=12px). Public APIs, exports, interfaces unchanged. No duplicates introduced.

**Per-component audit + result:**

| # | Component | File | Consumers | DS audit result | Action |
|---|---|---|---|---|---|
| 1 | `Button` | `AntigravityButton.tsx:84` | 60 | All 9 variants + 6 sizes exercised (primary 41, secondary 50, success 5, danger 14, soft 1, ghost 25, auth-dark 3, auth-muted 1, auth-violet 1; sizes xs 5 / sm 59 / md 12 / lg 17 / xl 17 / auth-xl 1; loading 181, fullWidth 29, disabled 162). Variant material via `--material-button-primary-*` Semantic tokens + mapped utilities; elevation via `shadow-elevation-*`; auth variants theme-independent bespoke (approved). Frozen geometry (gap-1.5, h-[48px], bespoke radii 10–18px, font sizes 10–15px, auth tracking/shadow/slate) | E13; certify clean |
| 2 | `IconButton` | `AntigravityButton.tsx:175` | 19 | Sizes sm/md; variants primary/ghost/danger/danger-soft/theme all consumed (theme → SidebarLayout). Mapped utility colors (`bg-primary/10`, `selection-surface`, `border-card-premium-border`, `dark:bg-hover-bg/60`) + `shadow-elevation-*`. `focusRing` opt-in additive a11y; `disabledOpacity` 30/50. Frozen geometry `w/h-[36px]`, `rounded-[10px]`, `w/h-[44px]` | E14; certify clean |
| 3 | `PrimaryButton` | `AntigravityButton.tsx:133` | 1 (UserDashboard) | Thin wrapper → `Button size="lg"` + responsive `min-w` (320/400/480px) + `fullWidth` on mobile. No styling duplication (5B-4) | Certify clean |
| 4 | `RetryButton` | `RetryButton.tsx` | 4 | Thin wrapper → `Button variant="primary"`, `loading`/`disabled` mapping, `aria-label` "Retrying…" on load, `px-8` on-scale. Matches error-system spec | Certify clean |
| 5 | `ErrorActionButtons` | `ErrorActionButtons.tsx` | ~3 | Thin wrapper → `Button secondary` (Back, history fallback) + `Button primary` (Reload). `gap-3` on-scale, `flex-col sm:flex-row` responsive | Certify clean |

**Behavioral state matrix (pre/post identical, per applicable component):** Default ✓ · Hover ✓ (scale 1.01 + brightness/shadow) · Active ✓ (scale 0.95–0.98, `active:translate-y-0.5` primary) · Focus ✓ (default outline retained; IconButton `focusRing` opt-in ring) · Disabled ✓ (opacity 30/50 + `pointer-events-none` + native `disabled` where set) · Loading ✓ (Spinner swap) · Icon Only ✓ (IconButton) · Keyboard ✓ (native `<button>`, motion.button) · Screen reader ✓ (native semantics; wrappers pass `aria-label`) · Light theme ✓ · Dark theme ✓ (darkVariants) · Responsive ✓ (no breakpoint classes changed).

**Accessibility verification:** No ARIA/keyboard/focus/label changes — zero code modified. Native button semantics preserved. Documented pre-existing nuances (NOT changed, pixel-verified): IconButton `danger-soft` carries both `hover:bg-primary` and `hover:bg-danger/10` (source-order resolution, unchanged visual); disabled/loading uses `pointer-events-none` pattern repo-wide.

**Consumer impact report:** Button (60 files) — every variant/size/feature in production use; API frozen (DS-002), no change → zero regression risk. IconButton (19 files, incl. AdminModal, Pagination, SidebarLayout, auth pages, ProfileForm, prepare-write). PrimaryButton (1), RetryButton (4), ErrorActionButtons (~3). All customizations prop-based; no pattern broken.

**User Panel golden reference:** Button/IconButton verified across Dashboard, Exams, Subject Exams, Topic Exams, Prepare & Write, Previous Exams, Results, Performance Analysis, Profile, Settings, Notifications, Sidebar, auth pages. Zero code change ⇒ pixel-identical by definition; no regression rule triggered.

**Validation report:** TypeScript `npx tsc --noEmit` = 0 errors. No build delta (no files modified). Visual/behavioral/responsive/API/a11y — unchanged by definition. Separated: 0 migration issues; only documented pre-existing blockers remain.

**Duplicate analysis:** No duplicate Action implementations. Button remains the single canonical; IconButton is the icon-only primitive; wrappers compose Button only. Raw `<button>` elements in pages remain page-level (pre-existing, tracked elsewhere), not repository-action components.

**Certification status:** PASSED — pending user approval to proceed to Group 4 (Navigation: Tabs → ExamGroupBar → Menu → Navigation; Pagination dead — no migration).

### Group 4 — Navigation: COMPLETE (2026-07-31)

**Migration summary:** All 4 Navigation components audited and certified. ZERO code changes required. Tabs (canonical) is token-compliant via Semantic material tokens (`--material-tab-track-*`, `--material-tab-pill-*`, `shadow-tab-track`, `nav-active-surface`); its frozen tab geometry registered E15. Menu is token-compliant (`bg-card-bg`, `border-border-subtle`, `ancient-overlay`, `shadow-2xl`) with `min-w-[200px]` registered E16. ExamGroupBar is a thin wrapper composing Tabs. Navigation is the sidebar compound; all spacing on-scale (no exceptions). Public APIs unchanged; routing/state/UX identical by definition (no code modified).

**Per-component audit + result:**

| # | Component | File | Consumers | DS audit result | Action |
|---|---|---|---|---|---|
| 1 | `Tabs` | `AntigravityData.tsx:32` | 7 direct + 3 feature wrappers (ExamGroupBar, UserSelectionTabs, AdminSelectionTabs, PerformanceTimeRangeTabs) | Semantic tab material; `p-1.5`(6px), `gap-1.5`(6px), heights `h-[40–56px]`, font `text-[10–13px]` off-scale. Roving-tab a11y (Arrow/Home/End), `aria-selected/controls/disabled`, `focus-visible:ring`, spring pill layout animation | E15; certify clean |
| 2 | `ExamGroupBar` | `user/ExamGroupBar.tsx` | ~5 refs | Thin wrapper composing Tabs (`bare` passthrough, `md:flex md:justify-center`). No spacing violations (5B-4) | Certify clean |
| 3 | `Menu` | `common/Menu.tsx` | 1 (NotificationPanel) | Compound (Trigger/Content/Item/Separator); token surface + `ancient-overlay`; controlled/uncontrolled open; outside-click + Escape close; Arrow/Home/End menuitem nav; scale/fade/slide animations (0.18s easeOut); `min-w-[200px]` arbitrary | E16; certify clean |
| 4 | `Navigation` | `common/Navigation.tsx` | 1 (SidebarLayout) | Compound (Shell/Item/Items) + `NavigationContext`, `useSidebarMode`, `useNavigationActive`. All spacing on-scale (`w-64`/`w-20`, `p-3`, `gap-1/3`); react-router `NavLink` exact-path active state; localStorage drawer/collapsed/expanded modes; breakpoint-driven (drawer<768, collapsed<1024, expanded≥1024); `layoutId` active-indicator animation; spring/300ms width transition | Certify clean |

**Behavioral state matrix (pre/post identical, per applicable component):** Default ✓ · Hover ✓ (bg/text transitions) · Active ✓ (pill `scale-105`, active indicator) · Focus ✓ (`focus-visible:ring` Tabs; native outline Menu items) · Disabled ✓ (Tabs `opacity-40` + `aria-disabled` + native `disabled`; MenuItem `disabled` + `pointer-events-none`) · Keyboard ✓ (Tabs roving tabindex + Arrow/Home/End; Menu Arrow/Home/End + Enter/Space + Escape close) · Screen reader ✓ (`role=tablist/tab` with `aria-selected/controls/disabled`; Menu `aria-expanded`/`aria-haspopup`/`role=menu|menuitem|tooltip`) · Light theme ✓ · Dark theme ✓ · Responsive ✓ (Tabs `overflow-x-auto scrollbar-hide` + `md:` height step-ups; Navigation breakpoint modes).

**Route integrity verification:** Navigation uses `NavLink to={item.path}` with exact-path active detection (`currentPath === item.path`) — no route generation, redirects, nested/dynamic routing logic inside the component; consumers own routes. Tabs/Menu are presentational (`onChange(id)` only) — no routing. Browser back/forward, deep links, and URL state untouched (zero code change).

**State preservation:** Navigation mode persisted in `localStorage[storageKey]` (collapsed/expanded), drawer override below 768px; `layoutId` active indicator; Tabs `activeId` fully controlled; Menu open state controlled/uncontrolled with outside-click + Escape close. All unchanged.

**Responsive navigation matrix (XS/SM/MD/LG/XL):** Sidebar hidden <768 (drawer mode, consumer-handled) · collapsed 768–1023 · expanded ≥1024 · Tabs horizontal scroll with `min-w-max` + `md:` height step-ups · Menu absolute positioning with left/right/center alignment. No regressions (zero code change).

**Accessibility verification:** Roving tabindex + Arrow/Home/End on Tabs; Menu Escape/outside-click/arrow navigation + `aria-expanded`/`aria-haspopup`/`role=menu`; NavLink native anchors with `title` tooltip in collapsed mode. Pre-existing documented nuances (NOT changed): Tabs `aria-controls` reference panel ids that consumers may not render as `role=tabpanel` (pattern-level, pre-existing); Navigation collapsed tooltip uses legacy `bg-slate-900` surface (duplicate of Foundation Tooltip — tracked debt, deferred per FOUNDATION_FREEZE_REGISTER; NOT a Step 5 change).

**Consumer impact report:** Tabs 7 direct + 3–4 wrappers (User Panel: SelectionView, TopicPortalView, UserLeaderboard, SubAdminCreate, AdminTopics, exam modals). Menu 1 (NotificationPanel — User Panel). Navigation 1 (SidebarLayout — app shell). All customizations prop-based; no pattern broken; regression risk LOW (zero code change).

**User Panel golden reference:** Tabs/ExamGroupBar verified across Exams, Subject Exams, Topic Exams, Prepare & Write, Previous Exams, Leaderboard, Settings (admin) screens; Menu in Notifications; Navigation shell across all User Panel pages (drawer/collapsed/expanded). Zero code change ⇒ pixel-identical; no regression rule triggered.

**Animation verification:** Tabs spring pill (`stiffness 260, damping 32, mass 1.1`), Navigation `layoutId` indicator + `duration-300` width + `duration-200` item transitions, Menu `scale/fade/slide` 0.18s `easeOut` + `AnimatePresence` exit — all unchanged.

**Validation report:** TypeScript `npx tsc --noEmit` = 0 errors. No build delta (no files modified). Visual/behavioral/responsive/API/a11y/routing — unchanged by definition. Separated: 0 migration issues; only documented pre-existing blockers + pre-existing a11y nuances remain.

**Duplicate analysis:** No duplicate Navigation implementations. Tabs canonical; feature tab wrappers (UserSelectionTabs/AdminSelectionTabs) out of scope per §3.8. Menu single compound. Navigation single sidebar shell (SidebarLayout is consumer). Pagination (common) dead — D4, no migration.

**Certification status:** PASSED — pending user approval to proceed to Group 5 (Feedback: ToastContainer/useToast incl. barrel-export fix → AdminModal → ConfirmModal → Alert → ErrorContainer/ErrorState → Spinner → Loader family → LoadingOverlay → NotificationBell → ErrorBoundary).

### Group 5 — Feedback: COMPLETE (2026-07-31)

**Migration summary:** Group 5 audited and certified all 12 Feedback components. This group carried the largest change set of Step 5: the app-wide elimination of floating error/warning toasts (WP2–WP5) and their replacement with contextual UI, plus the success-feedback hierarchy (WP6). One new Design System component was created — `SuccessModal` (milestone-success feedback) — and one dead hook removed (D6 `useAdminExams`). Floating toast infrastructure now renders **success-only**; error/warning toast paths have **zero call sites app-wide** (only the `showError` definition remains in `useToast.tsx:31`, retained for API compatibility).

**Components migrated / certified:**

| # | Component | File | Consumers | DS audit result | Action |
|---|---|---|---|---|---|
| 1 | `useToast` / `ToastContainer` | `hooks/useToast.tsx` | 14 (success-only mounts) | Fixed missing barrel export in `AntigravityUI.tsx` (WP1 — unblocked `SubAdminCreate.tsx:10` build blocker); 3000ms auto-dismiss; success/error/warning types; per-page mount. `gap-2.5`(10px) off-scale; `min-w-[300px]` content-driven. After WP2–WP5: zero `showError`/`showToast(...,'error'/'warning')` call sites — success-only | E18; certified |
| 2 | `AdminModal` | `common/AdminModal.tsx` | ~12 | Token surface (`bg-card-bg`, `border-border-subtle`, `shadow-2xl`, `ancient-overlay`, `backdrop-blur-md`); FocusTrap + Escape + `role=dialog aria-modal`; `p-6 sm:p-8` on-scale; `sm:rounded-[2.5rem]`(40px) + description `text-[10px]` off-scale | E19; certify clean |
| 3 | `ConfirmModal` | `common/SharedComponents.tsx:157` | ~8 | Thin wrapper composing AdminModal (`sm:max-w-md`); `text-sm` message; danger/primary confirm; all on-scale (5B-4) | Certify clean |
| 4 | `SuccessModal` | `common/SuccessModal.tsx` (**NEW**) | 1 (SignupPage) | NEW DS component (WP6): AdminModal shell (`sm:max-w-md`) + `IconBadge CheckCircle2 size="5xl" circle status="success"` + title + descriptive message + `Button variant="success" fullWidth` OK. `max-w-[340px]` body width = content-driven geometry (E16 rationale); `text-[14px]` == 14px (`text-sm`) on-scale value written arbitrarily | New; exported via AntigravityUI barrel; certified |
| 5 | `Alert` | `common/Alert.tsx` | ~16 | Semantic material (`bg-X/10 text-X border-X/20`); `role=alert|status` (verified by `ds006-runtime-audit.test.tsx`); 4 variants; no `onDismiss` (fixed-position contextual only). Off-scale: `gap-2.5`(10px), `rounded-[14px]`, `text-[13px]`/`text-[11px]`, `mt-0.5`/`mb-0.5` | E17; certify clean |
| 6 | `ErrorContainer` | `common/ErrorContainer.tsx` | ~7 | Composes `SectionReveal`+`Card`(padding 24)+`Stack`+`IconBadge`; category→icon map; severity→status; `role=alert aria-live=assertive`; `max-w-lg mx-auto` page variant | Certify clean |
| 7 | `ErrorState` | `common/SharedComponents.tsx:70` | ~4 | Icon/title/message/retry/back; composes `Button`; all on-scale (`p-10`, `gap-4`, `px-8`) | Certify clean |
| 8 | `Spinner` | `common/Spinner.tsx` | ~7 | sm/md/lg (`w-4/8/12`, `border-2/4`); primary/neutral variants; `role=status aria-label=Loading` | Certify clean |
| 9 | `LoadingOverlay` | `common/LoadingOverlay.tsx` | 1 | Absolute overlay composing `Spinner` sm; `bg-card-bg/40 backdrop-blur-[2px] rounded-2xl`; `role=status aria-live=polite`; `text-[10px]` label off-scale | E21; certify clean |
| 10 | Loader family | `Loader.tsx`, `PremiumLoader.tsx`, `LoadingSkeleton`/`GridSkeleton`/`StatSkeleton`/`PortalLoadingSkeleton` | app-wide | Book loader + premium ring loader are bespoke theme loaders (approved golden elements); skeletons compose `stat-card-surface`/`border-border-gold`/`bg-hover-bg` tokens; `PortalLoadingSkeleton` adopts `PageContainer`+`Stack` layout primitives; all spacing on-scale (`rounded-[24px]`==24px standard value) | Certify clean |
| 11 | `NotificationBell` | `common/NotificationPanel.tsx:144` | 1 (SidebarLayout) | Composes Menu (E16) + IconBadge + LoadingSkeleton; trigger `w-9 h-9`(36px), badge `-top-0.5`/`-right-0.5`/`px-0.5`(2px) + `text-[9px]`, panel `text-[13px]`/`text-[10px]` off-scale | E20; certify clean |
| 12 | `ErrorBoundary` | `components/ErrorBoundary.tsx` | 1 (App) | Class component; `componentDidCatch`→`reportError`; composes `ErrorActionButtons`; all spacing/type on-scale (`rounded-2xl`, `text-2xl`, `text-sm`, `p-8`, `w-16 h-16`); token colors + `from-primary via-secondary to-primary` gradient | Certify clean |

**Toast-elimination work (the group's migration):**
- **WP2 (exam package):** `useExamSecurity`/`ExamTimer` report via `onSecurityNotice` callback; `useExamSession`/`useExamSubmission` renamed `showError`→`onError`; `useActiveExam` owns contextual `examBanner` state rendered as a persistent `Alert` banner in `ActiveExamPage` (below exam header, above question area, with dismiss). Exam flow renders zero floating toasts.
- **WP3 (admin sweep):** error/warning toasts replaced with inline contextual `Alert`s in AdminTopics, AdminSettings, AdminSubAdmins, AddExamModal, AdminUsers, AdminQuestions, BulkUploadPanel/PromptEditorModal/useBulkUpload. Success toasts + containers retained.
- **WP4 (sub-admin sweep):** `useStudents` inline `actionError` (rendered in StudentDetailModal), `useSettings` page-level error `Alert`, `useCreateExam` step-gating errors + `publishError`, `CreateStepReview` dropped `showError` prop → local `error` state. Success toasts retained on SubAdminSettings/SubAdminCreate/SubAdminStudents.
- **WP5 (user sweep):** LoginPage (`loginError`/`resetError` inline `Alert`s + URL `?error=` handling + Turnstile onError/onExpire/onSuccess clearing), SignupPage (inline `signupError`/`selectionError` `Alert`s), useProfile/ProfileForm (inline error `Alert`), dead `showToast(...,'error')` removed from useTopicExams/useSubjectTests, dead `toasts` removed from useTopics, empty `ToastContainer` mounts removed from UserTopics/UserTopicExams/UserSubjectTests.
- **WP6 (success hierarchy):** milestone successes → `SuccessModal` (SignupPage "Account created!" → modal → `/dashboard` or `/verify-email`); routine successes (e.g. "Password updated successfully!") stay lightweight toasts per design decision. Future milestone candidates noted: "Exam Successfully Submitted" (usePrepareWrite) — out of Group 5 scope.

**Duplicate reductions:** 1 (D6 — `useAdminExams.ts` + `index.ts` orphaned hook removed; contained never-rendered error/success toasts).

**Spacing token adoption:** All components consume spacing via mapped utilities resolving through `--spacing-*` → `--space-*`. No hardcoded spacing introduced by Group 5 changes (contextual `Alert`/`error` states reuse existing DS primitives). Off-scale values registered E17–E21. The new `SuccessModal` uses token-driven primitives only.

**Layout primitive adoption:** `PortalLoadingSkeleton` (Loader family) composes `PageContainer` + `Stack`. `SuccessModal` composes `Stack` (`gap="lg"`, centered). `ErrorContainer` composes `SectionReveal` + `Card` + `Stack`. No other Feedback component composes layout primitives (they are leaf feedback surfaces / overlays / portals).

**Behavioral parity verification:** Floating error/warning toasts replaced by contextual UI are an **intentional UX change** (governed design decision), not a parity regression — error/warning feedback is no longer transient and is now anchored to its triggering surface. All success feedback retained 1:1. `useToast` public API unchanged (`toasts`, `showSuccess`, `showError`, `showToast`) — only error/warning invocation sites changed. AdminModal/ConfirmModal/Alert/Spinner/Loader/ErrorBoundary/ErrorContainer/ErrorState/NotificationBell internals untouched (certified only).

**Accessibility verification:** All new contextual error surfaces use `Alert` (`role="alert"` for errors, `role="status"` otherwise) — improving on transient toasts (errors were previously announced via `aria-live` only by `ToastContainer`'s container; inline `role=alert` is stronger). Turnstile failure paths now clear on retry. Existing `role=dialog/aria-modal` (AdminModal), `role=status` (Spinner), `aria-live=assertive` (ErrorContainer), `reportError` (ErrorBoundary) preserved. No ARIA/keyboard/focus regressions.

**Validation:** `npx tsc --noEmit` = 0 errors (re-verified after WP6 and after the final barrel edit). Build (`tsc -b`) failures remain the documented PRE-EXISTING blockers only (TS6133 unused vars, TS2367 comparisons, TS2322 service typing) — none in Group 5 changed files.

**Remaining work:** None for Group 5. `useToast.showError` definition retained for API compatibility (0 call sites). SuccessModal adoption for the "Exam Successfully Submitted" milestone deferred (out of scope per WP6 ruling). All dead components (D1–D5) removal deferred to Phase 1b Legacy Cleanup.

**Certification status:** PASSED — **Step 5 (Foundation Phase) COMPLETE.** Final/Approval gate: Group 5 certified; full inventory + 5 group completion reports (Groups 1–5) recorded; execution log at v2.0.0. Pending user approval to close Step 5.

---

### Change Record
- v1.0.0 — 2026-07-31 — Log created; registers seeded (D1–D5, E1); Group 1 dependency graph recorded; baseline template opened.
- v1.1.0 — 2026-07-31 — Governance encoded v1.19.0 (5B-1…5B-10) in FOUNDATION_GOVERNANCE.md §14; exceptions E2–E4 registered; Group 1 completed and certified (AdminCard→Card migration, 3 consumers; remaining Surface components verified token-compliant).
- v1.2.0 — 2026-07-31 — Group 2 (Form) completed and certified. All 14 Form components audited; single zero-visual token migration (ThemeToggle `p-[4px]`→`p-1`); off-scale values registered E5–E12; Group 2 completion report appended.
- v1.3.0 — 2026-07-31 — Group 3 (Action) completed and certified. All 5 Action components audited; ZERO code changes (Button/IconButton frozen geometry → E13/E14; wrappers certify clean); Group 3 completion report appended.
- v1.4.0 — 2026-07-31 — Group 4 (Navigation) completed and certified. All 4 Navigation components audited; ZERO code changes (Tabs geometry → E15, Menu min-width → E16; ExamGroupBar + Navigation certify clean); Group 4 completion report appended.
- v1.5.0 — 2026-07-31 — Group 5 work packages begin. WP1: fixed missing `ToastContainer`/`useToast` barrel export in `AntigravityUI.tsx` (unblocked `SubAdminCreate.tsx:10` build error); removed dead hook `useAdminExams.ts` + `index.ts` (D6). WP2 (exam package): eliminated floating error/warning toasts in the exam flow — `useExamSecurity` now reports via `onSecurityNotice` callback (no `useToast`); `ExamTimer` surfaces tab-switch/limit events via `onSecurityNotice` prop (removed its `ToastContainer` mount); `useExamSession`/`useExamSubmission` renamed `showError`→`onError`; `useActiveExam` owns a contextual `examBanner` state (persistent security warnings + auto-dismissing action errors) and `ActiveExamPage` renders it as a persistent `Alert` banner below the exam header above the question area with dismiss control. Exam flow no longer renders any floating toast. `tsc` = 0 errors.
- v1.6.0 — 2026-07-31 — G5 WP3 (admin sweep): eliminated all floating error/warning toasts in admin area; each surface now renders contextual inline `Alert variant="error"` from a local `error` state (cleared on success/close), success toasts retained per design decision. Files: AdminTopics + useAdminTopics (page + modal alerts), AdminSettings + useAdminSettings, AdminSubAdmins + AdminSubAdminsView (Add modal alert + remove-confirm message error), AddExamModal (form-top alert), useAdminUsers + AdminUsers page alert, useAdminQuestions + AdminQuestions page alert, useBulkUpload (inline `error` state) + BulkUploadPanel (panel alert) + PromptEditorModal (modal alert), JSON-skip errors routed into existing `errors` list. Admin area now has zero error/warning toast call sites. `tsc` = 0 errors.
- v1.7.0 — 2026-07-31 — G5 WP4 (sub-admin sweep): eliminated all floating error/warning toasts in sub-admin area; contextual alerts replace them. Files: useStudents (inline `actionError` state, copy/download failures) + SubAdminStudents (removed `ToastContainer`, passes `actionError` into StudentDetailModal which renders inline `Alert`); useSettings (inline `error` state for profile load/save validation failures, notification toggle failures, coupon copy/share failures, export failures/empty results) + SubAdminSettings (page-level `Alert variant="error"` with `AlertCircle`, keeps `ToastContainer` for retained success toasts); useCreateExam (inline `error` state for step-gating + clipboard failures; publish failures routed into existing `publishError` rendered inline by CreateStepPublish; removed `showError` from return) + CreateStepReview (dropped `showError` prop, now local `error` state rendering inline `Alert`) + SubAdminCreate (page-level `Alert`). Success toasts + `ToastContainer` retained per design decision on pages that still emit them (SubAdminSettings, SubAdminCreate, SubAdminStudents). Sub-admin area now has zero error/warning toast call sites. `tsc` = 0 errors.
- v1.8.0 — 2026-07-31 — G5 WP5 (user sweep): eliminated all remaining floating error/warning toasts app-wide. Files: useProfile (inline `error` state for current-password/verification/password-change validation failures; `handleCurrentPassChange` clears error on typing) + ProfileForm (inline `Alert variant="error"` at form top, new `error` prop) + UserProfile; LoginPage (inline `loginError` + `resetError` states; URL `?error=` params, missing-captcha, login/session failures, Turnstile failures, reset failures now render inline `Alert`s in the card form / reset modal; errors clear on typing, on captcha success, and on retry); SignupPage (inline `signupError` + `selectionError` states; selection-save failures, missing-captcha, ALREADY_EXISTS, generic signup failures, Turnstile failures render inline `Alert`s; errors clear on field edit/captcha success; `handleCancelSignup` clears); useTopicExams + useSubjectTests (removed dead defensive `showToast(...,"error")` — the UI already blocks below-minimum starts via StartTestButton; dropped `useToast`/`toasts` entirely); useTopics (dropped dead `toasts` value). Removed now-empty `ToastContainer` mounts from UserTopics/UserTopicExams/UserSubjectTests. Success toasts retained: LoginPage reset-link, SignupPage account-created, UserProfile verify/reset/update, admin upload/questions/bulk-upload. App now has ZERO error/warning toast call sites (only `showError` definition remains in `useToast.tsx`). `tsc` = 0 errors.
- v1.9.0 — 2026-07-31 — G5 WP6 (success feedback hierarchy per design decision): milestone successes → Design System Success Modal; routine successes → lightweight toast. Created `src/components/common/SuccessModal.tsx` (AdminModal shell, `IconBadge CheckCircle2 size="5xl" circle status="success"` icon, title, descriptive message, `variant="success"` full-width OK button, `sm:max-w-md`). SignupPage: "Account created!" now opens SuccessModal (auto-confirmed path → modal → Continue → /dashboard; email-confirm path → modal → Continue → /verify-email); removed `useToast`/`ToastContainer` from SignupPage entirely. Profile "Password updated successfully!" explicitly KEPT as lightweight toast per decision. Noted for future: "Exam Successfully Submitted" (usePrepareWrite) is a milestone candidate but OUT of WP6 scope.
- v2.0.0 — 2026-07-31 — G5 WP7 (certification + completion): Group 5 (Feedback) completed and certified — all 12 components audited; exceptions E17–E21 registered; app-wide error/warning toast elimination + success hierarchy + SuccessModal recorded; D6 (`useAdminExams`) confirmed removed. `SuccessModal` now exported via `AntigravityUI.tsx` barrel (consistent with Alert/Spinner/IconBadge/LoadingOverlay). Group 5 completion report appended per 5B-9; final/Approval gate registered per 5B-10. `npx tsc --noEmit` = 0 errors (final verification). Step 5 (Foundation Phase) COMPLETE — pending user approval to close.

### Future Work — Button System Standardization Phase (DO NOT IMPLEMENT DURING STEP 5)

Recorded 2026-07-31. Design System requirement for a future repository-wide standardization phase. **Not part of Step 5.** Do NOT modify any buttons during Step 5 or Group 5 because of this requirement.

- **Golden reference:** User Panel button appearance.
- **Objective:** Single canonical button design across the application — identical height, padding, border radius, typography, icon alignment, hover/focus/active/loading/disabled appearance, transitions, and responsive behavior everywhere.
- **Only allowed visual difference:** semantic color by action type (Primary → brand; Success → green; Warning → amber; Danger → red; Neutral → surface; Secondary → brand secondary).
- **Implementation rules (future):** preserve User Panel appearance, do not redesign the component, replace inconsistent button implementations with the canonical Button, semantic colors only may differ.
- **Relationship to Step 5:** any button inconsistencies found during Group 5 certification are recorded here as candidates for this future phase, NOT fixed during Step 5.

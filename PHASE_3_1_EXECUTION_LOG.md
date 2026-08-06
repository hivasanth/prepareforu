# Phase 3.1 — Execution Log

## Module 1 (Authentication) — ✅ CERTIFIED

**Module:** Authentication (first consumer of the User Panel visual language)
**Status:** ✅ **CERTIFIED** — approval gate cleared
**Audit date:** 2026-08-02 (independent re-verification of the 2026-08-01 certification)

---

## Scope

| # | Surface | File |
|---|---|---|
| 1 | Splash | `src/pages/SplashPage.tsx` |
| 2 | Login | `src/pages/LoginPage.tsx` |
| 3 | Signup | `src/pages/SignupPage.tsx` |
| 4 | Verify Email | `src/pages/VerifyEmailPage.tsx` |
| 5 | Auth Callback | `src/pages/auth/AuthCallbackPage.tsx` |
| 6 | Finish Sign-In | `src/pages/FinishSignInPage.tsx` |
| 7 | Account Disabled | `src/pages/AccountDisabledPage.tsx` |
| 8 | Update Password | `src/pages/auth/UpdatePasswordPage.tsx` |
| 9 | Unauthorized | `src/pages/Unauthorized.tsx` |

---

## Verified items (12/12)

| Criterion | Result | Evidence |
|---|---|---|
| Containers | ✅ PASS | `PageContainer` (`centered` / page default + `Grid cols={2}` split layouts) on all surfaces; `AuthCallbackPage` uses the certified `LoadingScreen`. |
| Cards | ✅ PASS | Only certified `Card` variants (`elevated` / `auth-light`); manual cards removed. |
| Buttons | ✅ PASS | Only `Button`/`IconButton` (`primary`/`secondary`/`danger`/`ghost`); geometry/hover/transition/loading/disabled/focus component-enforced. |
| Inputs | ✅ PASS | Only default `Input` variant; no `compact`/`violet`. |
| Typography | ✅ PASS | `Display`, `BrandTitle gradient`, `H1`, `H3`, `Body`, `Label`; remaining raw tags token-colored (matches `PageHeader`). |
| Colors | ✅ PASS | Zero hardcoded palette colors across `src/pages`; only tokens + `color-mix`; Splash white lighting documented. |
| Hover effects | ✅ PASS | No custom auth hover; component/shared-utility patterns only. |
| Animations | ✅ PASS | User Panel language (framer-motion + Tailwind status utilities + `@keyframes sheen` in `index.css:1166`). |
| Loading | ✅ PASS | Only certified `Spinner` (`sm`/`md`/`lg`) + `LoadingScreen`. |
| Accessibility | ✅ PASS | No regression: `aria-invalid`, `aria-describedby`, `aria-live`, certified `Alert` roles, labeled inputs, focus rings. |
| Responsive | ✅ PASS | Responsive containers/grids/typography tokens; no breakpoint-only auth divergence. |
| No competing visual language | ✅ PASS | Sweep clean (see below). |

---

## Visual parity confirmation

The certification question — *"If this page were opened immediately after the User Panel, would it feel like the same application?"* — returns **YES for all 9 surfaces**.

Remaining auth micro-typography values (`text-[9px]/[8px]/[10px]/[22px]` on Splash/VerifyEmail/Unauthorized, `rounded-[40px]` on Unauthorized, `text-[64px]` decorative emoji on UpdatePassword) were verified as the **same micro-typography scale and certified radii the User Panel itself uses** (`text-[7px]`–`[11px]`, `H3`/`H1` className overrides across `src/components/user/*` and `src/pages/user/*`). They do not introduce a divergent visual language.

---

## Sweep evidence (2026-08-02)

Grep across all of `src/pages`:

- `ThemeContext` / `.light` wrappers → **0 hits** (`AuthThemeProvider` replaces them).
- `auth-dark`, `auth-violet`, `variant="compact"` → **0 hits** (auth module standardized on defaults).
- Manual spinners (`animate-spin`, `border-t-2`) → **0 hits**.
- Inline `<style>` tags → **0 hits**.
- `PaletteBackground` consumers → **0 hits**.
- Hardcoded hex / `rgb()` / `hsl()` palette colors → **1 hit**: Splash white light-sweep `rgba(255,255,255,0.4)` (`SplashPage.tsx:200`) + `bg-white/5` progress track — documented decorative lighting (achromatic, not a palette color).

---

## Build & validation

- `npx tsc -b` → **exit 0**.
- `npm run build` → **exit 0** (only pre-existing chunk-size notices).
- ESLint on all 9 surfaces → **0 migration-introduced problems**; remaining findings are pre-existing business-logic `any`/`refs` (LoginPage react-hook-form + captcha, SignupPage error handling, Splash Web Audio), untouched by the migration.
- Full `vitest` suite remains blocked by the pre-existing `@csstools/css-calc` ESM issue (documented in the migration doc; no page code is unit-covered).

---

## Accepted deviations (non-blocking)

1. **`PaletteBackground` orphaned** — zero consumers after migration; source retained as dead-register candidate D7 (structural, not visual).
2. **`@keyframes sheen` added to `index.css`** — additive consolidation of the Splash inline keyframes; frozen tokens/components untouched.
3. **Splash decorative lighting** — white light-sweep + `bg-white/5` progress track (achromatic lighting, not palette colors).
4. **Token-colored raw semantic tags** on `Unauthorized` + `VerifyEmailPage` footer — match the certified `PageHeader` pattern.
5. **`Card auth-light` for form surfaces** (`FinishSignInPage`/`AccountDisabledPage`/`UpdatePasswordPage`) — certified DS-001 auth material, intentional for form surfaces.

---

## Final certification

**Module 1 (Authentication) = ✅ CERTIFIED.**

Every criterion passes, no competing visual language remains, and the module renders through the same certified components and tokens as the User Panel.

- Comparison report: `docs/certification/PHASE_3_1_AUTH_VISUAL_COMPARISON.md`
- Certification report: `docs/certification/PHASE_3_1_AUTH_CERTIFICATION.md`

The **approval gate is cleared**: Module 2 (Admin) may begin, reusing this certified module as the visual template.

---

## Recommended next step (not a blocker)

Capture the **Visual Baseline** screenshots of Splash · Login · Signup · Verify Email · Update Password · Account Disabled at mobile / tablet / desktop before Module 2, so future modules (Admin, Sub-Admin, Exam) can be compared against both the User Panel and this certified Authentication module.

---

# Module 2 (Admin) — ✅ RE-CERTIFIED (component-reuse revision)

**Module:** Admin (second consumer of the User Panel / Authentication visual language)
**Status:** ✅ **RE-CERTIFIED** to the **component-reuse** standard — approval gate presented to user 2026-08-02 (revised ×2)
**Audit + migration date:** 2026-08-02

## Scope

| # | Surface | File |
|---|---|---|
| 1 | Admin Overview | `src/pages/admin/AdminOverview.tsx` |
| 2 | Admin Questions | `src/pages/admin/AdminQuestions.tsx` |
| 3 | Admin Users | `src/pages/admin/AdminUsers.tsx` |
| 4 | Admin Settings | `src/pages/admin/AdminSettings.tsx` |
| 5 | Admin Leaderboard | `src/pages/admin/AdminLeaderboard.tsx` |
| 6 | Admin Upload | `src/pages/admin/AdminUpload.tsx` |
| 7 | Admin Topics | `src/pages/admin/AdminTopics.tsx` |
| 8 | Admin Sub-Admins | `src/pages/admin/AdminSubAdmins.tsx` |

## Verified items (8/8)

| Criterion | Result | Evidence |
|---|---|---|
| Matches User Panel | ✅ PASS | Certified primitives on all surfaces; Leaderboard table wrapped in the same `Card p-0 border-none shadow-2xl` as the User `LeaderboardTable`. |
| Matches Authentication | ✅ PASS | Same certified component/token language as Module 1. |
| No competing Admin visual language | ✅ PASS | Palette sweep over `src/components/admin/**` + `src/pages/admin/**` → 0 hits (only chart-exempt + `var(--primary-rgb)` token shadow). |
| Certified components reused | ✅ PASS | Raw buttons → `Button`/`IconButton` (6 files), pills → `Badge` (3 files), cards → `Card` (AIToolCards), panels → `Alert` (Json/Preview), Leaderboard wrapper → `Card`. No new abstractions. |
| Build passes | ✅ PASS | `npx tsc -b` exit 0; `npm run build` exit 0 (pre-existing chunk notices only). |
| Accessibility preserved | ✅ PASS | `aria-label`/`title`/`aria-expanded`/`aria-controls`/`aria-live` retained; migrated icon buttons add certified `focusRing`. |
| No visual regression | ✅ PASS | Sizes/spacing/interactions preserved (`!w-8 !h-8` compact icons, chip-look overrides); Leaderboard table structure + micro-typography untouched. |
| Responsive unchanged | ✅ PASS | Grids, breakpoint variants, overflow handling untouched. |

## Files changed (13)

QuestionForm, JsonTab, PreviewTab, InstructionsTab, AIToolCards, QuestionsTable,
QuestionsTableComponents, TopicListItem, AdminTopicPreviewRenderer, LangInputPanel,
RankBadge, LeaderboardView, BulkActionBar — details in `PHASE_3_1_ADMIN_VISUAL_MIGRATION.md` §8.

## Visual-parity revision (post-review)

Initial certification returned by the user; pixel-parity sweep against the certified User Panel
(canonical). Fixed: `AdminSelectionTabs` selection containers → certified `SelectionContainer` +
`bare` `Tabs`; modal overlays `bg-black/*` → `bg-app-bg/60 backdrop-blur-md` and panels →
`rounded-[2.5rem]` (`PromptEditorModal`, `AddExamModal`); Leaderboard top-3 `rounded-[32px]` →
`rounded-[24px]` and row avatar gradient (nonexistent `--primary-dark`) → solid `bg-primary`;
`SubjectCardItem` `isDark`/`bg-white/40`/`ancient-cream` → token-only classes; overlay/wrapper
arbitrary radii → certified values. Retained certified-consistent patterns (`ancient-card`,
`bg-white/5`, `text-white` on fills, `backdrop-blur`, hover-scale, framer-motion). See
`PHASE_3_1_ADMIN_VISUAL_MIGRATION.md` §8.4 and the certification report.

## Component-reuse revision (post-review)

Parity revision also returned by the user; acceptance criterion is now explicit **component reuse** —
Admin instantiates the exact certified User Panel components (never re-created approximations) for
Stat Cards, Selection Containers, Chart Containers, Dashboard Cards, Icon Containers, Header
Containers, Filter Containers. Fixed (8 files): `StatsGrid` → certified `Grid cols={2} lg={4}` +
`StatCard status=`; `AdminOverview` chart card → `Card variant="premium-neutral" padding={24}` +
`LoadingSkeleton`; `DailyAttemptsChart` header → `PerformanceSectionHeader` + certified chart-area
height/animation; `UsersToolbar` + `QuestionsActions` → certified `FilterBar` (overrides removed);
`UserMobileCard`/`SubAdminMobileCard` → certified `Card`; `TopicListItem` → certified `Card` +
`PremiumIconContainer`. Audited retained: Selection Containers (already unified), Icon Containers
(shared frozen composites), Header Containers (shared `AdminPageTitle` + `AdminText` +
`PerformanceSectionHeader`). Charts exempt at library level; containers aligned. See
`PHASE_3_1_ADMIN_VISUAL_MIGRATION.md` §8.5 and the certification report.

## Final certification

**Module 2 (Admin) = ✅ RE-CERTIFIED** to the **component-reuse** standard (User Panel canonical).
Every mandated category instantiates the exact certified User Panel component; only titles, data,
and semantic status colors differ. Approval gate presented to the user; Module 3 (Sub-Admin / Exam)
may begin only after approval, reusing the certified User Panel → Authentication → Admin visual
language.

- Migration + inventory: `PHASE_3_1_ADMIN_VISUAL_MIGRATION.md`
- Comparison: `docs/certification/PHASE_3_1_ADMIN_VISUAL_COMPARISON.md`
- Certification: `docs/certification/PHASE_3_1_ADMIN_CERTIFICATION.md`

---

# Admin Overview — Page Audit + Implementation

**Surface:** `src/pages/admin/AdminOverview.tsx` (first page-level migration under the visual-first,
component-reuse approach)
**Status:** ✅ **AUDITED + IMPLEMENTED** — approval gate presented to user 2026-08-02
**Approach:** This page supersedes the repository-wide migration flow — every page is now migrated
independently: Audit → Identify Sections/Elements/Patterns/Tokens → Map to certified components →
Remove duplicate visual code → Visual comparison → Page certification → Next page.

## Deliverables

| Document | Path |
|---|---|
| Page audit (approved blueprint) | `docs/certification/ADMIN_OVERVIEW_PAGE_AUDIT.md` |
| Implementation report | `docs/certification/ADMIN_OVERVIEW_IMPLEMENTATION_REPORT.md` |
| Visual comparison | `docs/certification/ADMIN_OVERVIEW_VISUAL_COMPARISON.md` |

## Migrated sections (3 files changed)

- **Statistics (`StatsGrid.tsx`)** — error `ErrorState` (⚠️ emoji) → certified `ErrorContainer` +
  `H2` + `Body` + `RetryButton` (golden `DashboardStatsGrid` pattern); dead `div.col-span-full`
  wrapper removed.
- **Chart (`DailyAttemptsChart.tsx`)** — in-flight `LoadingOverlay` spinner → certified
  `LoadingSkeleton height="100%" borderRadius={16}` shimmer (golden `PerformanceAnalyticsSection`);
  error `ErrorState` → certified `ErrorContainer` + `RetryButton`. Recharts internals unchanged
  (chart-exempt).
- **Page (`AdminOverview.tsx`)** — chart wrapper `div.grid.grid-cols-1.gap-8` → `section.grid.gap-6`
  (golden `gap-6` token rhythm).

## Reused certified components

`GuardLoader`, `PageContainer`, `Stack`, `SelectionContainer`, `Tabs bare`, `Grid`, `StatCard status=`,
`StatSkeleton`, `Card premium-neutral`, `PerformanceSectionHeader`, `FilterSelect`, `LoadingSkeleton`,
`Suspense`, `ErrorContainer`, `RetryButton`, `H2`/`Body`.

## Removed duplicate / dead visual code (page-local)

- `ErrorState` usages ×2 (+ imports) — shared component **retained** (8+ other consumers)
- `LoadingOverlay` usage (+ import) — shared component **retained** (barrel export)
- `div.col-span-full` error wrapper
- `gap-8` page-specific spacing → `gap-6` token

## Verification

- `npx tsc -b` → **exit 0**
- ESLint (3 touched files) → **0 problems**
- `npm run build` → **exit 0** (only pre-existing chunk-size notices)
- A11y / responsiveness / functionality — **unchanged** (region/figure/alert roles, breakpoints,
  data + refetch + filter logic untouched)

## Next step

Upon approval, the next page (recommended: Admin Questions or Admin Users) begins with its own page
audit, reusing this audit + implementation report as the template.

---

# Admin Questions — Page Audit + Final Structural Certification

**Surface:** `src/pages/admin/AdminQuestions.tsx` + `src/components/admin/questions/**`
**Status:** ✅ **AUDITED + IMPLEMENTED + CERTIFIED & FROZEN** (2026-08-02)
**Approval:** Plan approved **with enhancements** — 16 mandatory requirements made binding, executed
under the approved 12-step order.

## Deliverables

| Document | Path |
|---|---|
| Page audit (33 findings; 17 in-scope) | `docs/certification/ADMIN_QUESTIONS_PAGE_AUDIT.md` |
| Implementation plan (16 mandates, approved) | `docs/certification/ADMIN_QUESTIONS_IMPLEMENTATION_PLAN.md` |
| Visual baseline (PRE snapshot) | `docs/certification/baselines/ADMIN_QUESTIONS_VISUAL_BASELINE.md` |
| Implementation report (certification + freeze) | `docs/certification/ADMIN_QUESTIONS_IMPLEMENTATION_REPORT.md` |

## Implemented (18/18 issues)

- **List section** — desktop wrapper + mobile rows → `Card`; index chip → `Badge`; Q-monogram →
  `PremiumIconContainer` (`aria-hidden`); SrNumber → `Caption`; `SelectionCheckbox` labeled;
  actions `title=` → `aria-label=`.
- **Bulk wizard** — header pill + JSON chip → `Badge`; stat tiles ×4 + instructions panel → `Card`;
  `UploadProgressOverlay` → `role="progressbar"` + value ARIA + token surface; `PromptEditorModal` →
  certified `AdminModal` (focus trap / ESC / focus restore / dialog ARIA).
- **Business/security** — `questionToDelete` dead export removed; `PAGE_SIZE` single export;
  delete guard protocol unified to throw-style; `isAdmin` gates added to `handleConfirmDelete` +
  `executeDeletePrompt` (B8).
- **Performance** — `React.lazy` + `Suspense` for both modals; `memo` ×5 wizard panels;
  `useCallback` ×7 handlers; `useMemo(currentPrompt)`.

## Verification

- `npx tsc -b` → **exit 0**
- ESLint → **0 migration-introduced problems** (9 reported are pre-existing baseline, verified
  identical via `git stash`; baseline-only `fetchQuestions` warning now gone)
- `npm run build` → **exit 0** (only pre-existing chunk-size notices; lazy modal chunks emitted)
- Coverage: 43 elements ~74% → **~100%**; hardcoded-sweep 0 hits; shared consumer `AdminUpload.tsx`
  unchanged; `adminQuestionService` zero changes (Phase 6 LOCKED).

## Deferred (documented)

B1/B2/B4 (shared-contract), B6 (service LOCKED), C14 (AI tool cards), C17 (BulkActionBar), C4 (Guard
bg infra), R1 (reduced-motion recommendation).

## Freeze

Admin Questions page requires **no further structural cleanup** — future work is feature-only; any
architectural change begins a new certification phase.

---

# Phase 3.2 — Foundation Evolution: CollectionCard (grid + row) + Admin Questions list migration

**Status:** ✅ **CERTIFIED & FROZEN** — `CollectionCard` (new Level 2 Foundation composite) and Admin
Questions page (now premium CollectionCard list) frozen (2026-08-02)
**Approval:** Design approved via question tool (presentation-only CollectionCard; two certified
layouts `grid`/`row`; selection composed via slots; always-visible admin actions)

## Deliverables

| Document | Path |
|---|---|
| CollectionCard certification + freeze | `docs/certification/COLLECTION_CARD_CERTIFICATION.md` |
| Admin Questions Phase 3.2 evolution | `docs/certification/ADMIN_QUESTIONS_IMPLEMENTATION_REPORT.md` §20 |
| Visual baseline (PRE snapshot) | `docs/certification/baselines/ADMIN_QUESTIONS_VISUAL_BASELINE.md` (unchanged reference) |

## Created

- **`src/components/common/CollectionCard.tsx`** — presentation-only Foundation composite.
  API: `layout` (`grid`/`row`), `variant` (`default`/`premium`/`subtle`/`outlined`/`compact`),
  `leading`/`header`/`title`/`subtitle`/`metadata`/`content`/`footer`/`actions`/`trailing`,
  `loading`, `selected`, `disabled`, `onClick`, `titleAs`, `ariaLabel`, `className`.
  Surface/hover/border/radius/shadow delegated entirely to frozen `Card` (`premium` →
  `premium-dark-neutral`); typography via `Caption`; loading via certified `LoadingSkeleton`
  (`role="status"`). No selection/CRUD logic, no new tokens, no duplicated styling between layouts
  (only arrangement differs). Barrel export + types added (`AntigravityUI.tsx:64-66`).
  Reference: `src/components/exam/AttemptCardBase.tsx` clickable-card a11y pattern.

## Migrated (Admin Questions)

- `QuestionsTable.tsx` — **DataGrid dropped** → premium `CollectionCard layout="grid"
  variant="premium"` list (single responsive implementation): select-all header row; per question
  `leading` = `SelectionCheckbox`, `trailing` = sr/difficulty/subject `Badge`s, `title` = line-clamped
  question text (`h3`), `footer` = ID token, `actions` = always-visible `ActionsCell`;
  `Pagination` + `LoadingSkeleton` unchanged.
- `QuestionsTableComponents.tsx` — kept `SelectionCheckbox`/`SubjectBadge`/`ActionsCell`; removed
  dead `SrNumber` + `QuestionCell` (superseded by CollectionCard slots); actions IconButtons hardened
  to `!w-8 !h-8 !bg-app-bg !border !border-border-subtle !rounded-xl hover:!border-primary`.

## Frozen intact

`useAdminQuestions` (selection/pagination/CRUD), `adminQuestionService` (Phase 6 LOCKED),
`AdminQuestions.tsx` page orchestration, `AdminUpload.tsx` co-consumer — **zero changes**. Selection
state lives in the page hook, never in the card.

## Verification

- `npx tsc -b` → **exit 0**
- ESLint (CollectionCard, barrel, QuestionsTable, QuestionsTableComponents) → **0
  migration-introduced problems** (3 barrel `react-refresh` errors pre-existing at HEAD: line 2
  `useTheme`; lines 72/84 Navigation exports)
- `npm run build` → **exit 0** (only pre-existing chunk-size notices)
- Emitted CSS contains `!bg-primary/5`, `!border-primary`, `!shadow-none`, `bg-primary\/5`
  (color-mix) — all token classes compile

## Freeze

- **`CollectionCard` = ✅ CERTIFIED & FROZEN** — single source of truth for premium collection
  surfaces (grid + row). Future consumers (Leaderboard, Students, History, Search Results,
  Notifications, Topics, Exams, Study Cards) must compose it, never re-create collection visuals.
- **Admin Questions page = ✅ CERTIFIED & FROZEN** under the Phase 3.2 baseline (premium CollectionCard
  list is canonical; DataGrid list is superseded).

## Next step

Port remaining row-layout surfaces (`UserMobileCard`, Leaderboard mobile/tablet cards, search/notification
lists) onto `CollectionCard layout="row"` in a later phase — same Foundation component, deferred.

---

# Phase 3.2.1 — Compact Management Layout (Golden Reference) ✅

**Status:** ✅ **CERTIFIED & FROZEN** (2026-08-02) — Admin Questions becomes the golden reference for
the compact premium management row; `CollectionCard layout="row"` is the standard for all future
collection pages.
**Approval:** Phase brief (layout refinement only — no CollectionCard redesign, no consumer API
breakage).

## Refined (CollectionCard — non-breaking, additive)

- **New `padding` prop** (`16 | 20 | 24`) — premium surface + management density (`p-4`).
- **`row` layout → compact two-zone management row**: Zone 1 (flex-1) = `leading` + `title`/
  `subtitle`/`metadata`/`content`; Zone 2 (shrink-0) = `trailing` + `actions`. Desktop/tablet single
  line (`sm:items-center`, question takes most width, actions never shift); mobile wraps to two
  zones. Row title densified to `text-[13px] md:text-[14px]`. Row skeleton made compact
  (`role="status"`). Hover/animation/shadows/tokens all inherited from frozen `Card` premium —
  nothing new.
- **Build-graph fix**: `SharedComponents` imports `Button` from `./AntigravityButton` (same module
  the barrel re-exports) → broke the `AntigravityUI ↔ CollectionCard` circular re-export chain;
  Rollup chunk-circular-dependency warning eliminated.

## Migrated (Admin Questions → golden reference row)

- Row = `CollectionCard layout="row" variant="premium" padding={16}`.
- **Order:** Selection → Question Number → Question → Difficulty → Actions
  (`leading` = `SelectionCheckbox` + `PremiumIconContainer` #medallion [User Panel `TopicCard`
  pattern]; `title` = `line-clamp-2`; `trailing` = `DifficultyBadge`; `actions` = always-visible
  `ActionsCell`).
- Removed: **Subject** (page already filters by it; dead `SubjectBadge` component deleted), **ID
  footer** (height), outer page `Card variant="subtle"` wrapper (CollectionCards are the visual
  grouping; `QuestionsActions` keeps its own `FilterBar` surface).
- `GridSkeleton height={80}` → `height={56}` for loading.
- `useAdminQuestions` / `adminQuestionService` (Phase 6 LOCKED) / `AdminUpload.tsx` — **zero
  changes**.

## Verification

- `npx tsc -b` → **exit 0**
- ESLint (5 touched files) → **0 migration-introduced problems** (4 barrel `react-refresh` errors on
  lines 2/72×2/84 are pre-existing)
- `npm run build` → **exit 0** — circular re-export warning gone; only pre-existing chunk-size
  notices

## Freeze

- **`CollectionCard` = ✅ CERTIFIED & FROZEN** — `layout="row"` is the **mandatory compact management
  layout**; future collection pages (Leaderboard, Students, Topics, Exams, History, Search Results,
  Notifications, Admin/Sub-Admin lists) must compose it, never re-create a management row.
- **Admin Questions page = ✅ CERTIFIED & FROZEN** under the Phase 3.2.1 golden reference.

## Next step

Port remaining list surfaces (`UserMobileCard`, Leaderboard mobile/tablet cards, search/notification
lists) onto `CollectionCard layout="row"` in a later phase — same Foundation row contract, deferred.

---

# Phase 3.2.2 — Collection System Refinement (Foundation First) ✅ CERTIFIED

**Status:** ✅ **IMPLEMENTED & CERTIFIED** (2026-08-02)
**Method:** Foundation-first — every fix was applied to the reusable Foundation block, so all
collection pages (Questions, Users, Sub-Admins, Students, Exams) improve automatically. Admin
Questions was the reference page; its **page-specific visual code is now ~zero**.

## Refinements (reusable components)

1. **`FilterBar` → `CollectionToolbar`** (`AntigravityLayout.tsx`)
   - Surface promoted from translucent `bg-card-bg/50 rounded-[14px] border-border-subtle` to the
     **premium Card surface**: `rounded-2xl bg-card-bg border-[1.8px] border-card-premium-border
     shadow-card-shadow hover:shadow-card-premium light:stat-card-surface light:shadow-premium-card`
     — pixel-identical family with the premium `CollectionCard`.
   - `FilterBar` kept as a **deprecated alias** → zero consumer churn (QuestionsActions,
     UsersToolbar, AdminSubAdminsView, AdminFilterBar ×2 inherit the new surface automatically).
   - Barrel now exports `CollectionToolbar` (and `FilterBar`).

2. **`PremiumSelect` (behind `FilterSelect`) — premium filled trigger**
   - Inactive trigger: `bg-hover-bg/60 … opacity-70 hover:opacity-100` (translucent, faded) →
     **premium filled** `bg-hover-bg border-border-subtle hover:border-primary/50 focus:border-primary`
     — matches the certified `Input`/`Checkbox` focus & hover control language.
   - Dropdown panel: `bg-surface-floating` → **`bg-card-bg`** — every floating panel in the app is
     now one family (`rounded-2xl border border-border-subtle shadow-elevation-4`).

3. **`SelectionCheckbox` promoted to Foundation** (`src/components/common/SelectionCheckbox.tsx`)
   - Page-local wrapper in `QuestionsTableComponents.tsx` **deleted**; single implementation
     barrel-exported from `AntigravityUI`.
   - Certified `Checkbox` (DS-013) already satisfied the brief: square `w-5 h-5 rounded-md`,
     premium border/hover/focus, centered white checkmark (`text-white strokeWidth={3}`).

4. **`CollectionHeader` created** (`src/components/common/CollectionHeader.tsx`)
   - Reusable top row: `SelectionCheckbox` + "Select all on this page" + "Showing X–Y of Z".
   - `QuestionsTable` inline header markup **removed** and replaced with the shared block.

## Requirement → resolution (13-point brief)

| # | Requirement | Resolution |
|---|---|---|
| 1 | Toolbar container | `CollectionToolbar` premium surface |
| 2 | FilterSelect | premium filled trigger, no transparency, Input/Checkbox hover/focus |
| 3 | Bulk Upload | already certified `Button variant="secondary"` — audited, no page styling |
| 4 | SelectionCheckbox | certified square checkbox; promoted to Foundation |
| 5 | Select All | reuses `SelectionCheckbox` (moved into `CollectionHeader`) |
| 6 | CollectionHeader | new reusable block |
| 7 | Toolbar layout family | same radius/border/shadow/elevation as premium cards |
| 8 | One surface language | Header → Toolbar → Cards → Pagination → Dropdown all `bg-card-bg` + premium tokens |
| 9 | Dropdown | PremiumSelect panel aligned to premium menu language (radius/border/shadow/keyboard) |
| 10 | Hover consistency | toolbar `hover:shadow-card-premium` (card family); trigger `hover:border-primary/50` (control family) |
| 11 | Color audit | all translucent/`opacity-70` surfaces removed; tokens only |
| 12 | Reusable audit | recorded in `ADMIN_QUESTIONS_IMPLEMENTATION_REPORT.md` §22 (Current → Consumers → Foundation → Pages → Duplicates) |
| 13 | Re-certify | CollectionCard/CollectionToolbar/FilterSelect/SelectionCheckbox/CollectionHeader ✅; Button & Menu unchanged |

## Verification

- `npx tsc -b` → **exit 0**
- ESLint (7 touched files) → **0 migration-introduced problems** (5 pre-existing baseline errors:
  barrel `react-refresh` lines 2/76×2/88 + `PageHeader` `any` at :74 — only line-shifted)
- `npm run build` → **exit 0** (only pre-existing chunk-size notices)
- Dead code → page-level `SelectionCheckbox` and inline header markup removed

## Freeze

- `CollectionCard` (v1.1), `CollectionToolbar`, `FilterSelect`, `SelectionCheckbox`,
  `CollectionHeader` = ✅ **CERTIFIED**.
- Admin Questions is the **reference implementation**: toolbars/filters/headers/selection/cards all
  compose Foundation blocks — no page-level toolbar/filter/header/checkbox styling allowed on
  future collection pages.

# Phase 3.2.3 — Foundation Refinement (Final Collection System Alignment) ✅ CERTIFIED

**Status:** ✅ **IMPLEMENTED & RE-CERTIFIED** (2026-08-02)
**Method:** Foundation-first — refinements only in reusable components; the Admin Questions page
needed a single presentation-only migration (Difficulty → `CollectionFilter`).

## Refinements (reusable components)

1. **`Checkbox` (DS-013) — premium square refinement** (`AntigravityForm.tsx`)
   - Already square (`w-5 h-5 rounded-md border-2`); visual quality raised to premium collection
     language: unchecked `bg-hover-bg border-border-subtle light:bg-card-bg
     light:border-card-premium-border`; checked `bg-primary border-primary shadow-elevation-2
     shadow-primary/30`; `peer-focus:ring-4 peer-focus:ring-primary/25 peer-focus:border-primary`;
     `peer-hover:border-primary/70`; white check `size={13} strokeWidth={3}` flex-centered.
   - Every consumer (`SelectionCheckbox` rows + `CollectionHeader` select-all, PromptEditorModal)
     inherits automatically.

2. **`Button` secondary — premium collection surface** (`AntigravityButton.tsx`)
   - Light secondary `border border-card-border shadow-elevation-1` → `border-[1.8px]
     border-card-premium-border shadow-card-shadow hover:shadow-card-premium
     hover:-translate-y-0.5` — same family as `primary` and `CollectionCard`.
   - Bulk Upload now reads visually identical to Add Question (same certified `Button`, only
     icon/label/semantic variant differ).

3. **`CollectionFilter` — NEW Foundation component** (`src/components/common/CollectionFilter.tsx`)
   - `SelectionContainer` + `Tabs` (`bare`, `variant="primary"`, `size="sm"`); selected =
     `nav-active-surface` primary pill, unselected = standard pill; no dropdown / no floating
     panel. Keyboard nav + spring motion inherited from certified `Tabs`.
   - Finite option sets (Difficulty, Status, Role, Language, Question Type); large/searchable
     lists keep `PremiumSelect`.
   - Build-graph safe: imports `Tabs`/`SelectionContainer` from source modules, not the barrel.
   - Barrel: `AntigravityUI` exports `CollectionFilter` + `CollectionFilterOption`.

## Requirement → resolution (user brief)

| # | Requirement | Resolution |
|---|---|---|
| 1 | Square premium checkbox | audited → `Checkbox` already square; refined border/hover/focus/elevation/contrast at Foundation level |
| 2 | Bulk Upload = Add Question's Button | verified already-certified; aligned `secondary` surface to premium family |
| 3 | `CollectionFilter` component | new Foundation component (SelectionContainer + Tabs) |
| 4 | No dropdown / no popup | pills only, always visible |
| 5 | Pill language | selected = primary filled pill; unselected = standard pill (certified `Tabs`) |
| 6 | Finite option sets | Difficulty, Status, Role, Language, Question Type, Attempts, Review Status, Topic Status |
| 7 | Large/searchable keep PremiumSelect | `FilterSelect`/`PremiumSelect` retained for those consumers |
| 8 | Responsive | desktop horizontal pills, mobile scrollable — via Tabs `overflow-x-auto` |
| 9 | One selection language | CollectionFilter sits in SelectionContainer family (Exam/Paper/Subject, CollectionToolbar, CollectionCard) |
| 10 | Migrate Difficulty | `QuestionsActions` `FilterSelect` → `CollectionFilter` (All/Easy/Medium/Hard; state values unchanged) |
| 11 | Audit chain | recorded in `ADMIN_QUESTIONS_IMPLEMENTATION_REPORT.md` §23 and `COLLECTION_CARD_CERTIFICATION.md` §10 |
| 12 | Re-certify | `Checkbox`, `Button` (secondary), `CollectionFilter`, `CollectionToolbar` ✅ |

## Verification

- `npx tsc -b` → **exit 0**
- ESLint (4 touched files) → **0 new problems** (baseline barrel `react-refresh` lines 2/80×2/92 +
  `PageHeader` `any` — pre-existing, shifted by the +4 line exports)
- `npm run build` → **exit 0** (only pre-existing chunk-size notices)

## Freeze

- Re-certified: `Checkbox`/`SelectionCheckbox` (premium square), `Button` secondary (premium
  surface), `CollectionFilter` (NEW — finite-set pill filter), `CollectionToolbar`.
- Unchanged & still certified: `CollectionCard` v1.1, `CollectionHeader`, `FilterSelect`.
- Admin Questions remains the golden reference — page-specific visual code ~zero.

# Phase 3.2.4 — CollectionFilter Redesign (Premium Dropdown) ✅ CERTIFIED

**Status:** ✅ **IMPLEMENTED & RE-CERTIFIED** (2026-08-02)
**Method:** Foundation-first — the pill `CollectionFilter` was redesigned in place to a **premium
dropdown** on the `Menu` foundation. Admin Questions needed one additive prop; the control updated
automatically with no page-specific styling.

## Design rule (user-approved variant)

- `SelectionContainer` = **navigation between sections** (Exam/Paper/Subject).
- `CollectionFilter` = **filtering within the current section** (Difficulty/Status/Role/…).
- Same Design System tokens, different UX patterns.

## Refinements (reusable components)

1. **`Menu` v1.1** (`src/components/common/Menu.tsx`)
   - `Menu.Item` gains **`selected`** — primary text + premium background (`bg-primary/20`) +
     focus/hover tint (`hover:bg-primary/25 focus:bg-primary/25`); unselected keeps the standard
     `hover:bg-hover-bg` row. Backward compatible (default `false`).
   - `Menu.Trigger` gains **`disabled`** — native `disabled` + guarded handlers in both the button
     and `asChild` (div) branches.
   - `Menu.Content` panel shadow aligned to the premium elevation token: `shadow-2xl` →
     **`shadow-elevation-4`** (matches `PremiumSelect`).
   - `NotificationPanel` inherits the refined panel shadow; no consumer edits.

2. **`CollectionFilter` v1.1** (`src/components/common/CollectionFilter.tsx`)
   - Redesigned from `SelectionContainer` + `Tabs` pills → **premium dropdown** composing `Menu`.
   - **Trigger:** compact `h-[44px] md:h-[48px] rounded-xl`, `bg-card-bg border-border-subtle`,
     `shadow-card-shadow hover:shadow-card-premium`, `hover:border-primary/50
     focus:border-primary`, uppercase micro-text + rotating `ChevronDown`; active state
     `bg-primary/10 text-primary border-primary/20`; shows `Easy ▼` when a level is picked, else
     the `label` prop (`Difficulty ▼`).
   - **Panel:** `Menu.Content` premium surface; rows = `Menu.Item` — selected row `✓` + primary
     text + premium background, unselected standard.
   - **API:** `CollectionFilterOption` (`id`/`label`/`disabled`) + `value`/`onChange`/`label`/
     `ariaLabel`/`disabled`/`align`. Build-graph safe: imports `./Menu`, never the barrel.

## Requirement → resolution (user brief)

| # | Requirement | Resolution |
|---|---|---|
| 1 | Premium dropdown filter (not pills) | `CollectionFilter` redesigned — compact premium trigger + dropdown panel |
| 2 | Reuse `Menu` foundation | composes `Menu.Trigger`/`Menu.Content`/`Menu.Item`; refined `Menu` v1.1 where needed |
| 3 | Same language as Toolbar/Card/Button/Input | trigger = premium filled surface/border/`shadow-card-shadow`/radius/hover/focus/transition |
| 4 | Selected items `✓ All / ✓ Easy / ✓ Medium / ✓ Hard` | selected row = check icon + primary text + premium background (`Menu.Item selected`) |
| 5 | Compact trigger, same size as search controls | `h-[44px] md:h-[48px] rounded-xl` (matches `Input` / `PremiumSelect`) |
| 6 | Becomes the standard reusable filter | Difficulty/Status/Role/Language/Question Type; large/searchable keep `PremiumSelect` |
| 7 | NOT Exam/Paper/Subject | those keep `SelectionContainer` (navigation); `CollectionFilter` = within-section filtering |
| 8 | Admin Questions auto-update, no page styling | single additive `label="Difficulty"` prop in `QuestionsActions`; state values unchanged |
| 9 | Reuse and refine, never replace components | refined `Menu` in place (selected/disabled/shadow); `CollectionFilter` redesigned in place |
| 10 | Re-certify | `Menu` v1.1, `CollectionFilter` v1.1, Admin Questions ✅ |

## Verification

- `npx tsc -b` → **exit 0**
- ESLint (4 touched files: `Menu.tsx`, `CollectionFilter.tsx`, `AntigravityUI.tsx`,
  `QuestionsActions.tsx`) → **0 new problems** (baseline barrel `react-refresh` lines 2/80×2/92
  pre-existing)
- `npm run build` → **exit 0** (only pre-existing chunk-size notices)

## Freeze

- Re-certified: `Menu` v1.1 (`selected` item / `disabled` trigger / `shadow-elevation-4` panel),
  `CollectionFilter` v1.1 (premium dropdown), Admin Questions (Difficulty → dropdown, one prop).
- Unchanged & still certified: `CollectionCard` v1.1, `CollectionToolbar`, `CollectionHeader`,
  `Checkbox`/`SelectionCheckbox`, `Button`, `FilterSelect`.
- `SelectionContainer` + `Tabs` untouched — reserved for section navigation.
- Admin Questions remains the golden reference — page-specific visual code ~zero.

---

# Phase 3.4 P0 — Control Family Per-Role Semantic Tokens ✅ CERTIFIED

**Status:** ✅ **IMPLEMENTED & CERTIFIED** (2026-08-02)
**Directive:** D-121 (per-role Control namespaces) · D-120 (identical-render gate) ·
D-119 (dropdown panels = Surface floating) · D-122 (G3/G4 deferral)
**Method:** Foundation-first — token changes only; six Control components re-scoped onto their
role namespaces; zero page code changed.

## Scope

| Surface | File | Role tokens |
|---|---|---|
| Button / IconButton | `src/components/common/AntigravityButton.tsx` | `--button-*` (secondary/ghost) |
| Input / TextArea / Select | `src/components/common/AntigravityForm.tsx` | `--input-*` |
| Checkbox / Radio / RadioGroup | `src/components/common/AntigravityForm.tsx` | `--checkbox-*` / `--radio-*` |
| PremiumSelect trigger + panel | `src/components/common/PremiumSelect.tsx` | trigger `--input-*`; panel `--surface-floating` |
| CollectionFilter trigger | `src/components/common/CollectionFilter.tsx` | `--filter-*` |
| Menu panel | `src/components/common/Menu.tsx` | `--surface-floating` |

## Token changes

- `themes.css` dark `:root`: `--input-*-active` set, `--button-*` secondary/ghost, `--checkbox-*`,
  `--radio-*` (+ `--radio-track-surface`), `--filter-*` (+ shadows). Re-anchored `--input-bg`/
  `--input-border` (zero prior consumers → render-neutral).
- `themes.css` `.light`: Secondary #C9A070 fill / #A87828 1.8px gold edge / carved shadows;
  checkbox + filter shadows. All preserve certified light renders.
- `index.css` `@theme`: role-token utilities (`bg-button-*`, `bg-input-*`, `bg-filter-*`,
  `shadow-filter*`, `bg-checkbox-*`, `bg-radio-*`).

## Verified items (12/12)

| Criterion | Result |
|---|---|
| Controls consume ONLY role tokens | ✅ |
| Zero `--card-*` classes in Control components | ✅ (grep clean; only internal hover variants remain, documented) |
| `--control-surface` not introduced | ✅ (D-121 superseded) |
| No new colors/shadows/radii/borders | ✅ (all values re-anchor existing primitives) |
| Panels = `--surface-floating` | ✅ (D-119) |
| Triggers = Control tokens | ✅ (D-118 Filter role) |
| Input re-anchor render-neutral | ✅ (zero prior consumers) |
| `.light` certified renders preserved | ✅ |
| Dark certified renders preserved | ✅ (D-122: frozen Card/Tabs dark untouched) |
| Utilities compile | ✅ (emitted CSS audited) |
| Build / typecheck / lint | ✅ (`tsc -b` 0, `vite build` 0, ESLint 0) |
| Docs updated pre-code | ✅ (ownership/families/map/plan/decision-log) |

## Accepted deviations (approved)

1. Dropdown panels unified on `--surface-floating` — Menu/PremiumSelect dark #1F2937→#374151,
   PremiumSelect light #C9A070→light `--bg-elevated` (user-approved Surface-family rule).
2. Secondary border width theme-branch: light `border-[1.8px]`, dark `border` 1px;
   `--button-border-secondary-width` documented, unused-by-utility.
3. G3/G4 deferred (D-122) — dark `--elevation-carved`/`--border-gold` would redesign frozen
   Card (DS-001) / Tabs (DS-011) dark renders.

## Freeze

- **Controls re-certified on role tokens**; **panels re-certified on Surface floating**.
- **Gap register (3.3A):** G1/G2/G6 CLOSED · G3/G4 DEFERRED (D-122) · G5 unchanged.
- Remaining (documented, non-blocking): Switch generic track (`--switch-*` future), item-hover
  `bg-hover-bg` rows, P1–P4 waves.

## Deliverables

- Report: `docs/certification/PHASE_3_4_P0_IMPLEMENTATION_REPORT.md`
- Certification: `docs/certification/PHASE_3_4_P0_CERTIFICATION.md`
- Register: `FOUNDATION_FREEZE_REGISTER.md` (Phase 3.4 P0 section)
- Decisions: `docs/design-system/DESIGN_DECISION_LOG.md` (D-121, D-122)

---

# Phase 3.4 P1 — Foundation Component Refactoring ✅ CERTIFIED

**Status:** ✅ **IMPLEMENTED & CERTIFIED** (2026-08-02)
**Scope:** Group A (A-1…A-5) + B-1 approved; B-2 rejected (D-125); B-3 deferred.
**Decisions:** D-123 (app theme = sole source of truth), D-124 (family ownership + Amber
Color Policy), D-125 (B-2 rejected / `selection-container-dark` legacy).
**Method:** Foundation-first — reusable components only; zero page-level work.

## Implemented

| # | Change | Files |
|---|---|---|
| A-1 | Navigation shell + CollapseToggle `bg-card-bg` → `bg-sidebar` (own-family; dark render-identical) | `Navigation.tsx` |
| A-2 | `Checkbox` additive `ariaLabel`/`indeterminate`; `DataGrid` selection composes certified `Checkbox` | `AntigravityForm.tsx`, `AntigravityData.tsx` |
| A-3 | Premium surface recipes single-sourced (`PREMIUM_SURFACE*`/`GOLD_SURFACE`) → Card/CollectionToolbar/StatePanel/skeletons/EmptyState | `AntigravityCard.tsx`, `AntigravityLayout.tsx`, `SharedComponents.tsx` |
| A-4 | Toast → token classes + shared `@keyframes slideIn`/`.toast-slide-in` in `index.css`; lucide icons; additive `duration` | `useToast.tsx`, `index.css` |
| A-5 | Shared `getDisabledCls`; `FIELD_SURFACE`/`FIELD_FOCUS`; `renderTab` dedup; L-5 hardcode retained + documented | `AntigravityButton.tsx`, `AntigravityForm.tsx`, `AntigravityData.tsx` |
| B-1 | `dark:` prefixes stripped in React branches; `IconButton` theme + `Tabs` pill branch on `isDark` — app theme = sole source of truth | `AntigravityButton.tsx`, `AntigravityData.tsx` |

## Verification

- `npx tsc -b` → **exit 0**
- `npm run build` → **exit 0** (pre-existing chunk notices only)
- `npm run lint` → **405 pre-existing problems, zero P1-introduced** (type-declaration `any`,
  `Navigation:66` useEffect cascade, `useToast` dual-export — all confirmed pre-existing)
- Repo-wide audit clean: 0 `dark:` in React branches · 0 `#C9A070` in `src/components/common` ·
  premium recipes single-sourced · keyframes unique · D-124 family ownership upheld

## Accepted delta (approved)

1. **`CollapseToggle` light delta (A-1)** — light bg amber `#C9A070` → sidebar green gradient
   (`bg-card-bg` in light resolved to amber via `--bg-surface`; `bg-sidebar` is the
   Navigation family's own surface). D-124-approved amber-leak removal — the only intentional
   visual delta of the phase.

## Freeze

- Re-certified: `Navigation` shell/CollapseToggle, `Checkbox` (indeterminate), `DataGrid`
  selection, `Button`/`IconButton` (B-1), `Tabs` pill, `Card` premium recipes,
  `CollectionToolbar`/`StatePanel`/skeletons/`EmptyState`, `useToast` v1.1.
- B-2 rejected (D-125); B-3 deferred; amber light Control tokens scheduled for migration.

## Deliverables

- Report: `docs/certification/PHASE_3_4_P1_IMPLEMENTATION_REPORT.md`
- Certification: `docs/certification/PHASE_3_4_P1_CERTIFICATION.md`
- Register: `FOUNDATION_FREEZE_REGISTER.md` (Phase 3.4 P1 section)
- Decisions: `docs/design-system/DESIGN_DECISION_LOG.md` (D-123, D-124, D-125)

---

# Phase 3.4 P2 - Foundation Completion (render-neutral) ✅ CERTIFIED

**Status:** ✅ **IMPLEMENTED & CERTIFIED** (2026-08-02)
**Decision:** D-126 (Option 2 - render-neutral work only; render-affecting ⛔ items deferred)
**Scope:** token completion (architecture only) - dead code removal (zero-consumer) -
duplicate consolidation (behavior identical) - foundation cleanup - documentation.
**Method:** render-neutral by construction; zero visual deltas; no consumer migration (Phase 3.5).

## Implemented

| # | Change | Files |
|---|---|---|
| A1 | Nav token completion: `--nav-hover/-active/-shadow/-focus` aliases (certified values); deleted duplicate light `--surface-nav` (grep = 1) | `themes.css` |
| O-2/O-3 | Overlay layer scale `--z-canvas…--z-toast` (certified stack; `--z-dropdown` NOT added - `--dropdown-z` serves dropdowns) | `themes.css` |
| P-2 | `.light .ancient-card` raw hex `#C9A070`/`#A87828` → `--card-parchment`/`--border-gold` - no raw amber left in `index.css`/components | `index.css` |
| D-125/N-4 | Removed dead `selection-container-dark` classes (3 components) + orphaned `.light` rule | `AntigravityLayout.tsx`, `ThemeToggle.tsx`, `AntigravityButton.tsx`, `index.css` |
| S-4/D-123 | Stripped dead `dark:` classes (TagBadge x5, ExamSubComponents:24, paletteColors x2) - 0 `dark:` in src | `TagBadge.tsx`, `ExamSubComponents.tsx`, `paletteColors.ts` |
| M-1/M-5 | 23 sites `animate-in <dead companion>` → `animate-in`; removed `animate-pulse-slow` - 0 dead-animation classes | 19 component files |
| M-3 | `TAB_SPRING` preset single-sourced; consumed by Tabs/SegmentedFilter/ThemeToggle | `AntigravityAnimation.tsx`, `AntigravityData.tsx`, `SegmentedFilter.tsx`, `ThemeToggle.tsx` |
| T-4 | Removed unused `spacing` export (0 importers) | `AntigravityTypography.tsx` |
| Docs | 2 READMEs `animate-in fade-in` → `animate-in`; D-126 + report + certification + register | READMEs, decision log, cert docs |

## Verification

- `npx tsc -b` → **exit 0**
- `npm run build` → **exit 0** (pre-existing chunk notices only)
- `npm run lint` → **405 pre-existing problems (352/53), zero P2-introduced**
- Repo-wide audit: 0 `dark:` - 0 `selection-container-dark` - 0 `animate-pulse-slow` -
  0 `animate-in`+companion combos - 1 `--surface-nav` - `TAB_SPRING` single-sourced -
  0 raw amber in `index.css`/components

## Accepted delta

**None.** Zero intentional visual deltas this wave (render-identical in both themes).

## Freeze

- Added: nav token aliases, `--z-*` layer scale, single `--surface-nav`, `TAB_SPRING`.
- All P1/P0 component renders unchanged (no ⛔ item touched).
- **Deferred (per-item approval required, D-126):** N-2 `.light aside` retirement, N-9 amber
  nav-surface decouple, SelectionContainer nav-selection tokens, S-1 TagBadge mapper, S-3
  status alpha unify, T-1/T-2/T-3 Typography, M-2 IconButton feedback, O-1/O-4 modal+dropdown
  unification, A3 sidebar-shell merge.

## Deliverables

- Report: `docs/certification/PHASE_3_4_P2_IMPLEMENTATION_REPORT.md`
- Certification: `docs/certification/PHASE_3_4_P2_CERTIFICATION.md`
- Register: `FOUNDATION_FREEZE_REGISTER.md` (Phase 3.4 P2 section)
- Decisions: `docs/design-system/DESIGN_DECISION_LOG.md` (D-126)

---

# Phase 3.5 Page 1 — Admin Users P0/P1 ✅ CERTIFIED

**Status:** ✅ **CERTIFIED** (2026-08-02) — page 1 of the page-by-page certification wave.
**Page:** `/admin/users` · **Gate:** plan approved (P0+P1 authorized; P2 gated)
**Scope:** `pages/admin/AdminUsers.tsx` → `components/admin/users/*` + Foundation
(`DataGrid` aria props, `TableSkeleton`) + `userService.ts` (`ensureRole`)
**Method:** render-neutral by construction; inspection-based visual verification
(repo precedent — no headless tooling; auth-guarded route).

## Implemented

| # | Change | Files |
|---|---|---|
| U-10 | `FilterSelect` explicit `label="Status"` (aria-only via `PremiumSelect` `listboxLabel`) | `UsersToolbar.tsx` |
| U-11 | `DataGrid` optional `aria-label`/`aria-labelledby` → `<table>`; page passes `ariaLabel="Users table"` | `AntigravityData.tsx`, `AdminUsersView.tsx` |
| U-21 | Single `AntigravityUI` import | `AdminUsersView.tsx` |
| U-22 | `handleTabChange` param `_val` + `void` intent marker | `useAdminUsers.ts` |
| U-18 | Functional retry — `handleRetry: fetchData` wired through view → `ErrorState` | `useAdminUsers.ts`, `AdminUsersView.tsx`, `AdminUsers.tsx` |
| U-15 | 300ms search debounce (`debouncedSearchQuery` + `fetchIdRef` stale-drop) | `useAdminUsers.ts` |
| U-16 | `memo` view + `useMemo` columns + memo mobile card | `AdminUsersView.tsx`, `UserMobileCard.tsx` |
| U-8 | `ensureRole({ allowedRoles: ['admin'] })` on `fetchUsersPaginated` (ctx signature) | `userService.ts`, `useAdminUsers.ts` |
| U-9 | User-safe error messages + `logError` (fetch + toggle paths) | `useAdminUsers.ts` |
| U-7 | New `TableSkeleton` Foundation composite (render-identical); page-local skeleton removed | `SharedComponents.tsx`, `AdminUsersView.tsx` |
| U-12 | `aria-hidden` on `Mail` icon + initials fallbacks (desktop + mobile) | `AdminUsersView.tsx`, `UserMobileCard.tsx` |
| U-13 | `role="status" aria-busy="true"` on loading region (via `TableSkeleton`) | `SharedComponents.tsx` |
| U-19 | "Completed" → "Exams" metric label | `AdminUsersView.tsx` |
| U-13b/14/17 | Verify-only — reduced-motion (index.css:1110-1117), live-region, XS toolbar (CollectionToolbar flex-col) | docs |

## Verification

- `npx tsc -b` → **exit 0**
- `npm run build` → **exit 0** (pre-existing chunk notices only)
- `npm run lint` → **400 problems (347E/53W)** vs 405 baseline (352E/53W) — warnings unchanged,
  zero introduced (errors −5 from import consolidation)
- DataGrid: 5 other consumers compile/render unchanged (props default `undefined`)
- Foundation ownership upheld: page-owned surface/typography (P2 items) untouched

## Accepted deltas

**None.** Zero intentional visual deltas; approved behavioural-only improvements only (retry,
debounce, memo, `ensureRole`, safe errors, a11y).

## Foundation adoption

68% → **73%** (`TableSkeleton` consumed; U-7 opportunity delivered). Target 95%+ after P2
(Avatar, Typography composite, Surface decision).

## P2 gate

P2 (U-1, U-2, U-3, U-4, U-5, U-20) **not approved / not implemented**. Each opens a
separate approval gate. Page frozen pending P2 visual enhancements. (U-6 resolved as no-change
in P0 — no pixel-identical alpha token exists.)

## Deliverables

- Audit: `docs/certification/ADMIN_USERS_PAGE_AUDIT.md`
- Plan: `docs/certification/ADMIN_USERS_IMPLEMENTATION_PLAN.md`
- Report: `docs/certification/ADMIN_USERS_IMPLEMENTATION_REPORT.md`
- Certification: `docs/certification/ADMIN_USERS_P0_P1_CERTIFICATION.md`
- Page index: `docs/certification/PAGE_CERTIFICATION_INDEX.md`
- Register: `FOUNDATION_FREEZE_REGISTER.md` (Phase 3.5 section)

---

# Phase 3.5 Page 1 — Admin Users U-1 ✅ CERTIFIED (Surface Family)

**Status:** ✅ **CERTIFIED** (2026-08-02) — first approved P2 item (per-item gate U-1).
**Page:** `/admin/users` · **Change:** panel surface only — `AdminUsersView.tsx:127`.
**Method:** Foundation-first audit (D-127) → reuse certified `Card` (no new variant) → migrate page.

## Implemented

| # | Change | Files |
|---|---|---|
| U-1 | Retired page-owned `ancient-card` surface; panel adopts `Card variant="default"` (golden reference) | `AdminUsersView.tsx` (1 line) |

**Foundation changes:** none. `Card` unchanged (frozen v1.0). Legacy `.ancient-card` CSS retained
for `AdminSubAdminsView.tsx:146` / `BulkActionBar.tsx:20` (P3 retirement later).

## Verification

- `npx tsc -b` → **exit 0**
- `npm run build` → **exit 0** (pre-existing chunk notices only)
- `npm run lint` → **405 problems (352E/53W)** = frozen baseline; zero new findings
- `npx eslint src/components/admin/users/AdminUsersView.tsx` → **0 findings**
- Light/dark/desktop/tablet/XS → 6-scenario matrix (visual comparison)

## Accepted deltas (golden-reference-aligned)

Light: parchment → certified `--surface-stat` gold gradient; border 1.8px→1px; radius 18px→16px;
grain sheen removed. Dark: `#1F2937` unchanged; border/radius/shadow within the certified family.

## Foundation adoption

73% → **76%** (page-owned surface recipe eliminated; `Card` golden-reference variant). Target 95%+
after U-2..U-5, U-20.

## Remaining P2 gates

U-2, U-3, U-4, U-5, U-20 — each opens a separate approval gate. **U-20 gate may open now**
(after U-1 certification).

## Deliverables

- Implementation report: `docs/certification/ADMIN_USERS_U1_SURFACE_IMPLEMENTATION_REPORT.md`
- Visual comparison: `docs/certification/ADMIN_USERS_U1_VISUAL_COMPARISON.md`
- Certification: `docs/certification/ADMIN_USERS_U1_CERTIFICATION.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-127)
- Page index: `docs/certification/PAGE_CERTIFICATION_INDEX.md`
- Register: `FOUNDATION_FREEZE_REGISTER.md` (Phase 3.5 U-1 section)

---

# Phase 3.5 Page 1 — Admin Users U-20 ✅ CERTIFIED (Overlay Family — no change)

**Status:** ✅ **CERTIFIED** (2026-08-02) — no Foundation evolution required.
**Page:** `/admin/users` · **Gate:** U-20 (Overlay Family).
**Method:** implementation-evidence audit (D-128) → Reuse satisfied → **zero code changes**.

## Audit result

| Overlay on page | Foundation component | Status |
|---|---|---|
| ConfirmModal (activate/deactivate) | `AdminModal` (frozen 2A.8/DS-007) | ✅ certified overlay |
| Status filter dropdown | `PremiumSelect`/`Menu` (DS-008A) | ✅ certified dropdown |
| Toast (`useToast`) | none — L13 global gap | ⚠ global gap (P1-4), page owns nothing |

All 8 overlay owner categories (surface/motion/focus/keyboard/a11y/z-index/backdrop/restore)
are `AdminModal`-owned (`AdminModal.tsx:42-80`). Zero page-owned overlay attributes. Consumers:
`AdminModal` ×13, `ConfirmModal` ×11 — repository-wide modal family.

## Decision (D-128)

Implementation rule condition (a) "violates Foundation ownership" = **false** ⇒ no evolution.
Known ⚠ (`rounded-[2.5rem]`/`shadow-2xl` tokenization = L11/P1-2; optional body-scroll lock) are
Foundation-internal, already tracked, require their own approval gate — NOT triggered by U-20.

## Verification

`tsc -b` 0 · `build` 0 · lint **405 (352E/53W)** = baseline, zero new. No code changed →
behavior/keyboard/focus/a11y unchanged by definition; DS-007 contract retained.
(DS-007 runner currently fails to load in this environment — `ERR_REQUIRE_ESM` from
`@asamuzakjp/css-color`, pre-existing toolchain issue.)

## Remaining P2 gates

U-2 (typography), U-3 (`AdminText`), U-4 (name), U-5 (`Avatar`) — each opens a separate approval gate.

## Deliverables

- Audit: `docs/certification/ADMIN_USERS_U20_OVERLAY_AUDIT.md`
- Visual comparison: `docs/certification/ADMIN_USERS_U20_VISUAL_COMPARISON.md`
- Certification: `docs/certification/ADMIN_USERS_U20_CERTIFICATION.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-128)
- Page index: `docs/certification/PAGE_CERTIFICATION_INDEX.md`
- Register: `FOUNDATION_FREEZE_REGISTER.md` (Phase 3.5 U-20 section)

---

# Phase 3.5 Page 1 — Admin Users U-5 ✅ CERTIFIED (Avatar Foundation)

**Status:** ✅ **CERTIFIED** (2026-08-02) — new Icon/Display-family Foundation primitive delivered.
**Page:** `/admin/users` · **Gate:** U-5 (Avatar).
**Method:** Foundation-first audit (D-129) → compose frozen `AdminIconWrap` → new `Avatar` primitive
(DS-014) → migrate both breakpoints.
**Label note:** this gate is **U-5** (plan + page index). Prior-session transcription labelled the
Avatar work "U-3"; U-3 = `AdminText` (Typography family, T-3/D-126-blocked) and remains closed. All
Avatar deliverables recorded as U-5 / D-129 / DS-014.

## Implemented

| # | Change | Files |
|---|---|---|
| U-5 | New `Avatar` primitive (DS-014): monogram `name→email→fallback`, `sm/md/lg`, `circle/square`, light `ancient-icon-badge` / dark `bg-primary/10 text-primary` (delegated to frozen `AdminIconWrap`), `decorative`/`role="img"` SR contract, `status` slot | `Avatar.tsx` (new), `AntigravityUI.tsx` (barrel export) |
| U-5 | Both breakpoints consume `Avatar` via barrel; page-local avatar blocks removed | `AdminUsersView.tsx`, `UserMobileCard.tsx` |
| U-5 | Runtime audit — 17 tests (monogram / certified surface / a11y / status slot) | `ds014-runtime-audit.test.tsx` (renamed from `ds008` — DS-008 is DataTable) |

**Foundation changes:** new `Avatar` (DS-014), composing the unchanged frozen `AdminIconWrap`
(DS-004 companion). Zero material invented.

## Verification

- `npx tsc -b` → **exit 0**
- `npm run build` → **exit 0** (pre-existing chunk notices only)
- `npm run lint` → **405 problems (352E/53W)** = frozen baseline; zero new findings
- DS-014 runtime audit present + code-reviewed; vitest runner blocked by pre-existing
  `ERR_REQUIRE_ESM` toolchain issue (documented in U-20 audit) — unrelated to U-5

## Accepted deltas (golden-reference-aligned)

Light · mobile avatar: raw `bg-primary/10` div → certified `ancient-icon-badge` medallion (accepted
U-5 "mobile light avatar may unify" delta). Dark · mobile: `bg-primary/10` → `bg-primary/10
text-primary` (adds certified monogram colour, same value as desktop). Desktop unchanged.

## Foundation adoption

76% → **77%** (17/22 — `Avatar` consumed on both breakpoints; avatar duplication resolved; Raw UI
Implementations 2 → 1). Target 95%+ after U-2..U-4.

## Remaining P2 gates

U-2 (typography), U-3 (`AdminText`), U-4 (name) — each opens a separate approval gate.

## Deliverables

- Audit: `docs/certification/ADMIN_USERS_U5_AVATAR_AUDIT.md`
- Visual comparison: `docs/certification/ADMIN_USERS_U5_AVATAR_VISUAL_COMPARISON.md`
- Certification: `docs/certification/ADMIN_USERS_U5_AVATAR_CERTIFICATION.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-129)
- Page index: `docs/certification/PAGE_CERTIFICATION_INDEX.md`
- Register: `FOUNDATION_FREEZE_REGISTER.md` (DS-014 + Phase 3.5 U-5 section)

---

# Phase 3.5 Page 1 — Admin Users U-4 ✅ CERTIFIED (Identity Rendering)

**Status:** ✅ **CERTIFIED** (2026-08-03) — identity rendering canonicalized into one page-scoped
composition over the frozen `Avatar` primitive.
**Page:** `/admin/users` · **Gate:** U-4 (Identity Rendering).
**Method:** Identity audit (D-130) — inventory → ownership → duplicate-render scan → consumer + a11y
audit → one `UserIdentity` composition consumed by both breakpoints. **Identity audit, not a
Typography audit**: U-2 (Typography) / U-3 (`AdminText`) / U-6 remain closed.

## Implemented

| # | Change | Files |
|---|---|---|
| U-4 | New page-scoped `UserIdentity` composition: composes `Avatar` (DS-014, decorative) + canonical name (`AdminText` garamond, single `\|\| 'Unknown'` fallback) + canonical email (Mail icon `aria-hidden` + `text-secondary`, inner truncate span). Owns arrangement/spacing only; `truncate?: boolean` layout hint | `UserIdentity.tsx` (new), `index.ts` (page barrel) |
| U-4 | Desktop name column → `<UserIdentity user={u} />`; inline `Stack`/`AdminText`/`Mail`/`Avatar` block removed | `AdminUsersView.tsx` |
| U-4 | Mobile identity block → `<UserIdentity user={user} truncate />`; raw `<p>` name/email removed | `UserMobileCard.tsx` |

**Foundation changes:** none. `Avatar` (DS-014) frozen and unchanged — the only identity renderer.
`AdminText` used as-is (not frozen early; U-3/T-3 owns consolidation).

## Verification

- `npx tsc -b` → **exit 0**
- `npm run build` → **exit 0** (pre-existing chunk notices only)
- `npm run lint` → **405 problems (352E/53W)** = frozen baseline; zero new findings
- Duplicate-render scan: exactly one `Avatar` usage + one `'Unknown'` fallback in the page folder;
  zero `charAt`/`initials` logic

## Accepted deltas (visual-unification)

Mobile identity joins the desktop look (plan's "which look wins?" — desktop wins): gap 12px →
certified `Stack` `gap-sm` (8px); name sans `text-sm` → `AdminText` garamond `text-base` (16px,
light = serif italic); email gains the certified Mail-icon line (truncation preserved). Desktop
pixel-identical. No colours or typography implementations introduced.

## Foundation adoption

77% (17/22) — **unchanged metric** (D-130: `UserIdentity` is page composition; composition
ownership does not affect the metric). What moved: **Raw UI Implementations 1 → 0**; duplicate
identity logic removed; identity family 100% Foundation-owned. Target 95%+ set by U-2/U-3
Typography composite.

## Remaining P2 gates

U-2 (typography), U-3 (`AdminText`), U-6 (alpha tokens) — each opens a separate approval gate.

## Deliverables

- Audit: `docs/certification/ADMIN_USERS_U4_IDENTITY_AUDIT.md`
- Implementation report: `docs/certification/ADMIN_USERS_U4_IMPLEMENTATION_REPORT.md`
- Visual comparison: `docs/certification/ADMIN_USERS_U4_VISUAL_COMPARISON.md`
- Certification: `docs/certification/ADMIN_USERS_U4_CERTIFICATION.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-130)
- Page index: `docs/certification/PAGE_CERTIFICATION_INDEX.md`
- Register: `FOUNDATION_FREEZE_REGISTER.md` (Phase 3.5 U-4 section)

---

# Phase 3.5 Page 1 — Admin Users U-3 ✅ CERTIFIED (AdminText Consolidation)

**Status:** ✅ **CERTIFIED** (2026-08-03) — `AdminText` certified as the Admin module's typography
entry point (Layer 2 Module Typography) with a new render-neutral `sans` variant.
**Page:** `/admin/users` · **Gate:** U-3 (`AdminText`). Foundation ownership consolidation, **not** a
typography redesign. U-2 (Typography Scale) and U-6 (alpha tokens) remain closed.
**Method:** Repository + consumer + raw-typography audit (Reuse → Refine → Create) → two-layer
ownership model (D-131) → additive `sans` refinement → migrate the page's 7 page-owned raw
typography nodes → verify render-neutral.

## Implemented

| # | Change | Files |
|---|---|---|
| U-3 | `AdminText` v1.1: `variant="sans"` added (`classes['sans'] = ''` — no font forcing; sizes/weights/colours stay className-driven; no scale/spacing/colour change) | `src/components/common/AdminText.tsx` |
| U-3 | Barrel entry point for Layer 2 Module Typography | `src/components/common/AntigravityUI.tsx` |
| U-3 | Email text node → `AdminText sans` (layout `span` + `Mail` icon stay page-owned) | `UserIdentity.tsx` |
| U-3 | Attempts value + joined date → `AdminText sans` | `AdminUsersView.tsx` |
| U-3 | Mobile exam/attempts/joined rows → `AdminText sans` (nested spans reproduce the prior structure) | `UserMobileCard.tsx` |
| U-3 | Retained (D-131): `H1` sr-only page title + `Label` "Exams" caption — certified Layer 1, consumed directly | `AdminUsers.tsx`, `AdminUsersView.tsx` |

**Foundation changes:** `AdminText` refined additively (new `sans` variant) and certified as Layer 2
Module Typography — **no DS number** (Layer 1 systems carry DS numbers). Layer 1 Repository
Typography (`H1`–`Caption`) unchanged, authoritative. Permanent rule: module typography may extend
Layer 1, never replace it.

## Verification

- `npx tsc -b` → **exit 0**
- `npm run build` → **exit 0** (pre-existing chunk notices only)
- `npm run lint` → **405 problems (352E/53W)** = frozen baseline; zero new findings (the 4
  `react-refresh` errors on `AntigravityUI.tsx` are pre-existing non-component exports)
- Page-folder grep: every remaining `text-*`/`font-*`/`tracking-*` hit is on an `AdminText` element
  or a certified component — **0 page-owned typography** (was 7)

## Accepted deltas

**None.** Render-neutral by design — `sans` contributes no font-family; every migrated node carries
its pre-migration `className` verbatim.

## Foundation adoption

**17/22 → 18/22 (77% → 82%)** — `AdminText` joins the certified inventory as Layer 2 Module
Typography. Raw page-owned typography 7 → 0. Target 95%+ set by U-2 (Typography Scale).

## Remaining P2 gates

U-2 (typography scale — next), U-6 (alpha tokens) — each opens a separate approval gate.

## Deliverables

- Audit: `docs/certification/ADMIN_USERS_U3_ADMINTEXT_AUDIT.md`
- Implementation report: `docs/certification/ADMIN_USERS_U3_IMPLEMENTATION_REPORT.md`
- Visual comparison: `docs/certification/ADMIN_USERS_U3_VISUAL_COMPARISON.md`
- Certification: `docs/certification/ADMIN_USERS_U3_CERTIFICATION.md`
- Decision: `docs/design-system/DESIGN_DECISION_LOG.md` (D-131)
- Page index: `docs/certification/PAGE_CERTIFICATION_INDEX.md`
- Register: `FOUNDATION_FREEZE_REGISTER.md` (Phase 3.5 U-3 section)

---

# Phase 3.5 - Page 1 (Admin Users) U-2 Phase A ✅ CERTIFIED (Typography Foundation - canonical tokens)

**Date:** 2026-08-03 · **Gate:** U-2 (Typography Scale) Phase A · **Decision:** D-132
**Scope:** src/styles/themes.css, src/index.css, src/components/common/AdminText.tsx, page-1
consumers (AdminUsersView.tsx, UserIdentity.tsx, UserMobileCard.tsx).

## Change ledger

| Gate | Change | File(s) |
|---|---|---|
| T-3 | NEW canonical token --text-metadata: 0.75rem (12px) + --lh-metadata: calc(1 / 0.75) + --fw-metadata: 500 | 	hemes.css canonical scale |
| T-4 | NEW canonical token --text-small: 0.875rem (14px) + --lh-small: calc(1.25 / 0.875) + --fw-small: 500 | 	hemes.css canonical scale |
| T-5 | NEW canonical token --text-heading: 1rem (16px) + --lh-heading: 1.5 + --fw-heading: 700 (renamed from --text-title: color-token collision) | 	hemes.css canonical scale |
| T-3/4/5 | Register utilities in @theme (additive) | index.css @theme |
| T-1 | RETIRE phantom Layer-1 size primitives --text-3xs…10xl + dead --font-size-caption/--font-weight-caption (zero consumers) | 	hemes.css |
| T-2 | RETIRE legacy utilities 	ext-overline/sub-1/sub-2/body-1/body-2/button + @theme h4/h5/h6 registrations (zero consumers); :root --text-h4/h5/h6 vars kept for global element rules | index.css @theme, :root, media queries |
| U-2 | AdminText size map + union extended with metadata/small/heading; applies --lh-* for metadata/small (heading consumers keep leading-* verbatim) | AdminText.tsx |
| U-2 | 7 raw size nodes → size props; inert 	ext-[8px] on Label removed; weight/tracking/transform/leading verbatim | AdminUsersView.tsx, UserIdentity.tsx, UserMobileCard.tsx |

## Verification

- 
px tsc -b **exit 0**
- 
pm run build **exit 0** (pre-existing chunk notices only)
- 
pm run lint **405 problems (352E/53W)** = frozen baseline; zero new findings
- Page-folder grep: **0** raw 	ext-xs/sm/base/[Npx] utilities
- Built-CSS diff: --text-metadata: .75rem, --text-small: .875rem, --text-heading: 1rem +
  exact --lh-* present; retired defs absent; --text-title = colors only (no font-size collision)

## Accepted deltas

**None.** Phase A is render-neutral by construction - token values and line-heights equal the
current rendered Tailwind values; every migrated node carries weight/tracking/transform/leading
className verbatim.

## Foundation adoption

Page typography **100% token/primitive** (0 arbitrary raw sizes). Adoption metric unchanged at
**18/22 (82%)** - tokens/primitives were already consumed. Token set = one canonical semantic scale.

## Remaining P2 gates

**U-2 Phase B** - T-6 (micro 8px, separate approval), T-7 (repo-wide @theme wiring, deferred).
U-6 (alpha tokens). Each opens a separate approval gate.

## Deliverables

- Plan: docs/certification/ADMIN_USERS_U2_IMPLEMENTATION_PLAN.md
- Audit: docs/certification/TYPOGRAPHY_FOUNDATION_AUDIT.md
- Scale specification: docs/certification/TYPOGRAPHY_SCALE_SPECIFICATION.md
- Certification: docs/certification/ADMIN_USERS_U2_CERTIFICATION.md
- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-132)
- Page index: docs/certification/PAGE_CERTIFICATION_INDEX.md
- Register: FOUNDATION_FREEZE_REGISTER.md (Phase 3.5 U-2 Phase A section)

---

# Phase 3.6B — Admin Users → Management Page Standard ✅ CERTIFIED (second Standard implementation)

**Status:** ✅ **CERTIFIED** (2026-08-03) — Admin Users certified as the **second implementation** of the
Management Page Standard (D-133), alongside Admin Questions (first). Structural migration to the Standard
skeleton — **not a redesign**; business logic preserved. Decision **D-134** (blueprint deltas).
**Method:** approved Blueprint mapping (`ADMIN_USERS_LAYOUT_MIGRATION_BLUEPRINT.md`) → composition-only
implementation over the certified collection family → verification gate (tsc/build/lint/grep) →
governance updates.

## Implemented

| # | Change | Files |
|---|---|---|
| 1 | **NEW** `UsersActions` — `CollectionToolbar` wrapper: search `Input` + status `CollectionFilter` (All / Active Only / Banned Only) | `src/components/admin/users/UsersActions.tsx` |
| 2 | **NEW** `UsersTable` — `CollectionHeader` (select-all + range) → one `CollectionCard layout="row" variant="premium" padding={16}` per user (leading: `SelectionCheckbox` + `UserIdentity`; metadata: exam `Badge` + "`{n}` Attempts" + "Joined {date}"; trailing: Active/Banned `Badge`; actions: Activate/Deactivate `Button`); `Pagination` 1-based ↔ 0-based internal; `GridSkeleton` loading | `src/components/admin/users/UsersTable.tsx` |
| 3 | **REWRITTEN** `AdminUsers` — Standard skeleton: `PageContainer` → `H1 sr-only` → `Stack gap="lg"` → selection `SectionReveal` (`AdminSelectionTabs` `EXAM_TABS`) → error `Alert`s → `UsersActions` → list `SectionReveal` (`aria-live` + `UsersTable` + `EmptyState` retry) → `ConfirmModal` → `ToastContainer`; `?exam=` URL logic moved from deleted `UsersToolbar` | `src/pages/admin/AdminUsers.tsx` |
| 4 | **ADDITIVE** `selectedIds`/`setSelectedIds` + clear-on-query-change effect (`[searchQuery, statusFilter, activeTab, page]`); PAGE_SIZE 20, 1-based `page`, `totalPages`, optimistic status, confirm toggle, retry unchanged | `src/components/admin/users/useAdminUsers.ts` |
| 5 | Barrel updated (`useAdminUsers`, `UsersActions`, `UsersTable`, `UserIdentity`) | `src/components/admin/users/index.ts` |
| 6 | **DELETED** `AdminUsersView.tsx` (outer `AdminCard` + `DataGrid` + `TableSkeleton` + footer pagination), `UsersToolbar.tsx` (tabs + `FilterBar`/`FilterSelect` + total `Badge`), `UserMobileCard.tsx` (mobile dual path) — zero consumers | — |

**Foundation changes:** none — composition only. All target components already certified (Collection
family, `SelectionCheckbox`, `Pagination`, `GridSkeleton`, `EmptyState`, `Alert`, `AdminSelectionTabs`,
`Badge`, `Button`, `AdminText`). `UserIdentity` (U-4) reused unmodified in the `leading` slot so
identity renders exactly once.

## Verification

- `npx tsc -b` → **exit 0**
- `npm run build` → **exit 0** (pre-existing chunk-size + CSS token warnings only)
- `npm run lint` — changed files → **zero new findings** (only the pre-existing `no-explicit-any` at
  `useAdminUsers.ts:68`, stash-confirmed); repo baseline frozen **405 (352E/53W)** — working-tree count
  407 = pre-existing drift in unrelated untracked files (`src/validations/securitySchemas.test.ts`,
  `supabase/functions/*`)
- Page-folder grep → **0 page-owned visuals** — only blueprint-approved `animate-in` on the list wrapper
  (identical to the certified Questions implementation) + certified `AdminText` color tokens
  (`text-text-primary`/`text-text-muted`)

## Accepted deltas

Blueprint D-series deltas (D-134): outer `AdminCard` removed (D-1) · status → `CollectionFilter` with
All option, default `'active'` (D-4) · total-users `Badge` removed → `CollectionHeader` range (D-5) ·
"Completed" micro-label folded into metadata (D-7) · select-all added (D-8) · error → `Alert` +
`EmptyState` retry (D-12). Identity renders once through U-4 (`title`/`subtitle` slots empty).

## Certification standard compliance

**16/16 checklist** (skeleton, CollectionCard, CollectionToolbar, CollectionHeader, SelectionContainer,
Pagination, independent surfaces, zero nested cards, zero page-owned visuals, 24→12→8 rhythm, Foundation
owns every visual, one-card-one-entity, one owner per surface, loading/empty/error replace only the list
layer, selection state page-owned, no new layout pattern). **Forbidden patterns:** 0 (no outer Card, no
DataGrid, no dual paths, no page-owned visuals/spacing).

## Foundation adoption

**Admin Users = second certified Standard implementation.** Raw UI **0** · page-owned visuals **0** ·
page-owned typography **0** · dual render paths **0** · 20+ distinct certified Foundation components.
(Standard-wide metric: Questions = 1st, Users = 2nd; Students/Exams/Sub Admins/History/etc. pending.)

## Remaining gates

U-6 (alpha tokens), T-6/T-7 (Phase B typography) — unchanged, each opens its own approval gate.

## Deliverables

- Blueprint: docs/certification/ADMIN_USERS_LAYOUT_MIGRATION_BLUEPRINT.md
- Implementation report: docs/certification/ADMIN_USERS_MANAGEMENT_STANDARD_IMPLEMENTATION_REPORT.md
- Visual comparison: docs/certification/ADMIN_USERS_MANAGEMENT_STANDARD_VISUAL_COMPARISON.md
- Certification: docs/certification/ADMIN_USERS_MANAGEMENT_STANDARD_CERTIFICATION.md
- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-134 + rejected alternatives)
- Page index: docs/certification/PAGE_CERTIFICATION_INDEX.md (Phase 3.6 section)
- Register: FOUNDATION_FREEZE_REGISTER.md (Phase 3.6B section)

# Phase 3.6C — Admin Users UX & Business Logic Refinement ✅ CERTIFIED (4 sub-phases, D-135…D-138)

**Status:** ✅ **CERTIFIED** (2026-08-03) — four approved refinement sub-phases executed over the certified
3.6B page: **3.6C.1** selection simplification, **3.6C.2** structured metadata, **3.6C.3** action hardening
(presentation/hook only), **3.6C.4** status security (service/repo/DB).
**Method:** user-supplied specs per sub-phase → approved UX refinement plan → implementation → verification
gate (tsc/build/lint/grep) → 3 docs per sub-phase → governance updates (D-135…D-138).

## Implemented

| # | Sub-phase | Change | Files |
|---|---|---|---|
| 1 | 3.6C.1 | `CollectionHeader` select-all made **optional** (range-only render when omitted — no placeholder/hidden checkbox); Users selection fully removed (row checkbox, `selectedIds`/`setSelectedIds`, clear effect, `toggleSelectAll`/`allOnPageSelected`); Questions unchanged/pixel-identical | `src/components/common/CollectionHeader.tsx`, `UsersTable.tsx`, `useAdminUsers.ts`, `AdminUsers.tsx` |
| 2 | 3.6C.2 | metadata slot → `flex gap-6` with three `flex-1 min-w-0` labelled columns **EXAM** (`Label`+`Badge`) / **ATTEMPTS** (`Label`+`AdminText`) / **JOINED** (`Label`+`AdminText`); values `truncate`; 3-across at all widths; resolves M-1…M-6 | `UsersTable.tsx` |
| 3 | 3.6C.3 | `ConfirmModal` `busy` lock (Confirm `loading`, ESC/backdrop no-op while busy, Cancel escape hatch) + focus-Cancel-on-open (`useId`) + `p`→`div` message; hook `confirmToggle: UserRow`, `togglingId`, synchronous `toggleInFlightRef`, modal open until settled, errors→`Alert` never toast; row button per-row `loading`; rich confirm message (Name/Email/Status + action + consequence) | `SharedComponents.tsx`, `useAdminUsers.ts`, `UsersTable.tsx`, `AdminUsers.tsx` |
| 4 | 3.6C.4 | `toggleUserStatus` S-1 (self/admin/sub_admin → `ACTION_FORBIDDEN`; not-found → `USER_NOT_FOUND`), R-1 (0 rows → `UPDATE_FAILED`), S-2 (success `logInfo`); `updateUser` → `Promise<number>`; `ACTION_FORBIDDEN` in `ServiceErrorCode`; **migration** SEC-2 RLS `is_active` self-guard + trigger revert, SEC-3 last-admin-deactivation trigger, TEST 5.1–5.5 | `userService.ts`, `user.repository.ts`, `auth.types.ts`, `supabase/migrations/20260803000001_user_status_hardening.sql` |

**Foundation changes:** one additive change — `CollectionHeader` optional select-all (D-135); no behavior
change for Questions. `AdminModal.tsx` and `AntigravityButton.tsx` were NOT modified. 3.6C.3 deliberately
scoped to UI/UX/hook only; 3.6C.4 is the sole service/repo/DB change.

## Verification

- `npx tsc -b` → **exit 0**
- `npm run build` → **exit 0** (pre-existing chunk-size + CSS token warnings only)
- `npm run lint` — full-repo frozen baseline **405 (352E/53W), zero new**; per-file findings only
  pre-existing `no-explicit-any` patterns (`useAdminUsers.ts:69` shifted from :68 by +2 hook lines;
  `userService.ts` catch style; `ServiceResult<T = any>`)
- Page-folder grep → selection identifiers absent (3.6C.1 clean); structural classes only — **zero
  page-owned visuals**
- Migration → idempotent DROP-then-CREATE; TEST 5.1–5.5 structural + behavioral; not executed against a
  live DB this session (Vitest `ERR_REQUIRE_ESM` pre-existing/unrelated)

## Defense-in-depth matrix (3.6C.4)

route role guards → service (self/admin/sub_admin rejected) → RLS (self `is_active` unchanged) →
trigger (non-admin `is_active` revert + last-admin lockout) → row affected-count + success logging.

## Remaining gates

U-6 (alpha tokens), T-6/T-7 (Phase B typography) — unchanged, each opens its own approval gate.

## Deliverables

- Audit basis: docs/certification/ADMIN_USERS_SELECTION_AUDIT.md, ADMIN_USERS_METADATA_LAYOUT_AUDIT.md,
  ADMIN_USERS_ACTIONS_AUDIT.md, ADMIN_USERS_UX_REFINEMENT_PLAN.md
- Phase docs (3 each): ADMIN_USERS_{SELECTION_SIMPLIFICATION,METADATA_COLUMNS,ACTION_HARDENING,STATUS_SECURITY}_{IMPLEMENTATION_REPORT,VISUAL_COMPARISON,CERTIFICATION}.md
- Migration: supabase/migrations/20260803000001_user_status_hardening.sql
- Decisions: docs/design-system/DESIGN_DECISION_LOG.md (D-135…D-138 + rejected alternatives)
- Page index: docs/certification/PAGE_CERTIFICATION_INDEX.md (Phase 3.6C section)
- Register: FOUNDATION_FREEZE_REGISTER.md (Phase 3.6C section)

# Phase 3.6D — Admin Users Column Alignment ✅ CERTIFIED (fixed data columns, D-139)

**Status:** ✅ **CERTIFIED** (2026-08-03) — per-row metadata headings removed; the Users list now renders
six shared fixed-width data columns inside each `CollectionCard`. Scope: `src/components/admin/users/**`
only (one file). No Foundation redesign, no business logic, no services, no hooks, no database.
**Method:** user-supplied 3.6D spec → fixed-column composition over the certified slots → verification
gate (tsc/build/lint/grep/compiled-CSS) → 3 docs → governance updates (D-139).

## Implemented

| # | Change | Files |
|---|---|---|
| 1 | Removed the per-row `Label`s `Exam`/`Attempts`/`Joined` (the 3.6C.2 headings) — values remain, left-aligned in fixed columns | `src/components/admin/users/UsersTable.tsx` |
| 2 | Shared fixed-width column constants: Identity `170→300px` (largest, `min-w-0` truncate), Exam `150→160px`, Attempts `100px`, Joined `130→140px`, Status `110→130px`, Actions button `104px` | same |
| 3 | `metadata` slot → `flex flex-wrap gap-x-6 gap-y-2` fixed strip (24px column rhythm; wrap = controlled compression, order preserved); status `Badge` in `STATUS_COL`; exam `Badge` text in a `truncate` span (`max-w-full`); `Label` import dropped | same |

**Foundation changes:** none. `CollectionCard` row anatomy untouched (slots re-composed only);
`UserIdentity`/`Badge`/`Button`/`AdminText` unchanged.

## Verification

- `npx tsc -b` → **exit 0**
- `npm run build` → **exit 0** (pre-existing chunk-size + CSS token warnings only)
- `npx eslint src/components/admin/users/UsersTable.tsx` → **0 findings**
- `npx eslint .` → frozen baseline **405 (352E/53W), zero new**
- Grep page-owned visuals → **0** (structural classes + certified `text-text-primary` only)
- Compiled CSS → new width utilities present in `dist`

## Alignment proof

All six X origins are content-independent (identity fixed width, trailing button fixed width), so every
row shares identical grid lines — verified analytically and against the compiled CSS.

## Remaining gates

U-6 (alpha tokens), T-6/T-7 (Phase B typography) — unchanged, each opens its own approval gate.

## Deliverables

- Implementation report: docs/certification/ADMIN_USERS_COLUMN_ALIGNMENT_IMPLEMENTATION_REPORT.md
- Visual comparison: docs/certification/ADMIN_USERS_COLUMN_ALIGNMENT_VISUAL_COMPARISON.md
- Certification: docs/certification/ADMIN_USERS_COLUMN_ALIGNMENT_CERTIFICATION.md
- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-139 + rejected alternatives)
- Page index: docs/certification/PAGE_CERTIFICATION_INDEX.md (Phase 3.6D section)
- Register: FOUNDATION_FREEZE_REGISTER.md (Phase 3.6D section)

# Phase 3.7 — Admin Users Visual Language Audit 📝 DISCOVERY ONLY (Management Surface Family direction approved, D-140)

**Status:** 📝 DOCUMENTATION ONLY (2026-08-03) — **zero code, token, variant, or Foundation changes.**
**Scope:** `src/pages/admin/AdminUsers.tsx` + `src/components/admin/users/**` + every rendered Foundation component.
**Method:** user-supplied Phase 3.7 spec (Steps 1–11) → evidence-based reads/greps of the render tree + `themes.css`/`index.css` light values → 5 deliverables → governance updates (D-140). **No implementation.**

## Deliverables (5 docs)

| Doc | Covers |
|---|---|
| `docs/design-system/ADMIN_USERS_SURFACE_AUDIT.md` | Step 1 complete surface inventory (16 surfaces; light+dark; owners; render tree) + Step 6/7/8 surface aspects |
| `docs/design-system/ADMIN_USERS_COLOR_AUDIT.md` | Step 2 amber/parchment usage ledger (Component/File/Line/Token/Purpose/Owner/Consumer) + Step 9 Color→Token→Owner→Consumers |
| `docs/design-system/ADMIN_USERS_VISUAL_AUDIT.md` | Steps 3–8 family classification, CollectionCard/Card/Toolbar/Button/Badge audits + Step 10 scoring (Critical/High/Medium/Low) |
| `docs/design-system/ADMIN_USERS_MANAGEMENT_SURFACE_PROPOSAL.md` | Step 10 conceptual neutral Management Surface Family (Current vs Future; NOT implemented) |
| `docs/design-system/ADMIN_USERS_VISUAL_MIGRATION_PLAN.md` | Step 11 roadmap P0→P4 (Users→Questions→Students→Exams→Sub Admins→Leaderboard→future→certification) |

## Headline findings

- **Light mode = the amber language.** `--bg-app` `#E2CFA6` (cream), `--bg-surface` `#C9A070` (parchment),
  `--border-subtle` gold-tint `rgba(168,120,22,.30)`, card borders gold `#A87828`, carved gold shadows,
  gold stat/button materials (`themes.css:692,693,724,806,805,1224,1229,757,817,824,1232-1237`).
  Dark mode is fully neutral.
- **It is mandated, not accidental.** Management Page Standard rule 12 ("certified premium family") + frozen
  `Card` `PREMIUM_LIGHT_OVERRIDES` (`AntigravityCard.tsx:25,30,33-34`) make every management surface amber in light.
- **Corrected:** Users rows are parchment/gold, NOT dark forest — `CollectionCard` maps `premium→premium-dark-neutral`
  (`CollectionCard.tsx:64`); forest `--material-card-premium-surface` only affects raw `Card variant="premium"`
  Exam-family consumers.
- **Zero page-owned amber.** The page uses only structural + typography classes; all amber arrives transitively.
- **Ownership is clean.** One owner per surface/color; Status/Control/Typography families correct; row
  Activate/Deactivate buttons already status-hued (amber-free). Amber buttons = modal Cancel/Confirm + Try Again.
- **No Card variant is neutral in light** except `premium` (forest) and `auth-light`.

## Verification

- `git diff --stat` → only `docs/design-system/*` + governance docs changed; **zero `src/` changes** (see gate report).

## Remaining gates

- U-6 (alpha tokens), T-6/T-7 (Phase B typography) — unchanged, each opens its own approval gate.
- **New:** neutral Management Surface Family remains a **proposal** until a D-series decision at the P1 gate;
  implementation (P2+ additive Foundation evolution) begins only after explicit approval.

## Governance

- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-140 + rejected alternatives)
- Execution log: this entry (Phase 3.7)

# Phase 3.8 — Management Surface Foundation Architecture 📝 ARCHITECTURE & DECISION ONLY (Foundation Before Migration, D-141)

**Status:** 📝 DOCUMENTATION ONLY (2026-08-03) — **zero code, token, variant, component, Foundation, Standard, or page changes.**
**Scope:** repository-wide architectural review — Foundation → Card → CollectionCard → Theme Tokens → Management Page Standard.
**Method:** user-supplied Phase 3.8 spec (Steps 1–10) → evidence-based reads of `AntigravityCard.tsx`, `CollectionCard.tsx`, `themes.css`, `FOUNDATION_GOVERNANCE.md`, freeze register, and the Phase 3.7 audit set → 5 deliverables → governance updates (D-141). **No implementation.**

## Deliverables (5 docs)

| Doc | Covers |
|---|---|
| `docs/design-system/MANAGEMENT_SURFACE_FOUNDATION_ARCHITECTURE.md` | Step 1 Foundation ownership audit (Current→Desired→Risk) + Step 2 Management Surface decision (YES) + Step 3 visual-language separation + Step 5 Card architecture + Step 6 token strategy + Step 10 repository rules |
| `docs/design-system/MANAGEMENT_SURFACE_DECISION_MATRIX.md` | Step 9 decision matrix (A keep amber / B variant / C token-only / D redesign / E hybrid) → recommend E |
| `docs/design-system/MANAGEMENT_SURFACE_FOUNDATION_PROPOSAL.md` | Step 4 Foundation evolution strategy (additive variants + new token family) + conceptual `--management-*` namespace + `management` variants + rule 12 amendment |
| `docs/design-system/MANAGEMENT_SURFACE_MIGRATION_STRATEGY.md` | Step 7 permanent migration order (Foundation→Users→Questions→Students→Exams→Sub Admins→Leaderboard→future→certification) + gates + per-page checklist |
| `docs/design-system/MANAGEMENT_SURFACE_RISK_ASSESSMENT.md` | Step 8 risk register (R-1…R-10) + dependency graph + freeze-impact summary + certification-impact |

## Headline findings

- **Foundation ownership is already correct** — one owner per surface; the decision is *which* language the Foundation expresses for management consumers, not who owns it.
- **The owner of the amber language is the Foundation** (`Card` `PREMIUM_LIGHT_OVERRIDES`, `AntigravityCard.tsx:25,30,33-34`) + light theme tokens (`--bg-surface` `#C9A070`, `--border-subtle` gold-tint, gold card borders/shadows) — never the pages (Phase 3.7 proof).
- **YES — management pages use a neutral Management Surface** instead of Ancient/Amber; gold confined to accents; Exam/premium gold family (TopicCard/ExamCard/AttemptCard) untouched.
- **Evolution strategy = additive variants on a new `--management-*` token family** (new `Card` `management` variant + `CollectionCard` mapping); new component / alias-only / inheritance-only rejected. Verified `--management-*` has **zero occurrences** in `themes.css` today.
- **Card architecture: both** — `Card` owns the management surface (new additive variant), `CollectionCard` owns the mapping (never hand-rolls a surface).
- **Token strategy** — `--management-*` is the only new namespace; existing tokens remain / become Exam-Ancient-only for the management path / management-path deprecation candidates; D-122 dark gaps stay deferred.
- **Permanent migration order** — Foundation first; **Users is the first validation page**; Questions + all remaining management pages migrate only after Foundation certification.
- **Decision matrix** — Option E (Hybrid) recommended; keep-amber / token-only / full-redesign rejected.
- **Freeze impact LOW** — the whole direction is additive by construction; `PREMIUM_LIGHT_OVERRIDES` never touched (R-8 Navigation selection = highest-touch item).

## Verification

- `git diff --stat` → only `docs/design-system/*` + governance docs changed; **zero `src/` changes** (see gate report).

## Remaining gates

- **Approval gate (this phase):** Foundation proposal + rule 12 amendment need a new D-series decision before any P2 Foundation evolution.
- U-6 (alpha tokens), T-6/T-7 (Phase B typography) — unchanged, each opens its own approval gate.
- No page migration (P3/P4) until Foundation certification.

## Governance

- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-141 + rejected alternatives)
- Execution log: this entry (Phase 3.8)

# Phase 3.8 — Management Surface Foundation Architecture ✅ APPROVED (architectural direction only; D-142)

**Status:** ✅ **APPROVED** (2026-08-03) — repository long-term visual direction confirmed. **Zero code, token, variant, component, Foundation, Standard, or page changes.**
**Approval scope:** the Management Surface Foundation Architecture is approved as the permanent architecture and long-term visual target (`Foundation → Management Surface Family → Management Components → Management Pages`).
**Approved principles:** (1) one Management Language — never two permanently; (2) Ancient/Amber becomes a separate visual family; gold becomes an accent, not the primary surface; (3) Foundation Ownership unchanged (Foundation owns surfaces/colors/borders/shadows/elevation/hover/animation; pages own composition/layout/business logic/state); (4) Additive Evolution only (new variants/token namespaces/mappings; forbidden: changing certified variants, modifying frozen renders, breaking existing consumers); (5) Migration Order approved — Foundation → Users (validation) → Questions → Students → Exams → Sub Admins → Leaderboard → future management pages → Repository Certification; **no page migrates before Foundation certification**.
**Repository rule:** every future Management page inherits from the certified Management Surface Family; no page may introduce its own management material language.
**Explicitly NOT approved:** new tokens, new variants, theme changes, Card changes, CollectionCard changes, page migrations, color changes, Foundation implementation — each requires its own implementation phase and approval gate. **No implementation begins during this approval.**

## Next phase (planning only, no code)

1. Audit every affected Foundation component.
2. Define the exact additive implementation.
3. Assess compatibility with frozen components.
4. Produce an implementation plan.
5. Stop for approval before any code changes.

## Governance

- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-142 — architectural approval; D-141 + rejected alternatives from the phase)
- Execution log: this entry (Phase 3.8 approval)

# Phase 3.8.1 — Foundation Management Surface Implementation Plan 📝 PLANNING ONLY (audit + additive implementation blueprint; D-143)

**Status:** 📝 **PLANNING ONLY** (2026-08-03) — the D-142 next-phase planning scope (audit affected Foundation components → define exact additive implementation → assess frozen compatibility → produce implementation plan → stop before any code) is complete. **Zero code, token, variant, component, theme, Standard, or page changes.**

**Deliverables (docs only):**
- `docs/design-system/FOUNDATION_MANAGEMENT_SURFACE_IMPLEMENTATION_PLAN.md` — the additive implementation blueprint: (1) `--management-*` token namespace (neutral light; dark reuses certified neutrals `#1F2937`/`#374151`/`--elevation-2`-style shadows, pixel-unchanged; zero existing-token mutation); (2) additive `Card` `management` variant (no `PREMIUM_LIGHT_OVERRIDES`); (3) additive `CollectionCard` `management` mapping; (4) consumer re-anchoring via default-preserving additive props/branches (`CollectionToolbar`, `CollectionFilter`, `Input`, `Button`, `LoadingSkeleton`/`EmptyState`, `AdminModal`, `useToast`, `Menu`); (5) management-scoped selection (R-8, gold → accent only); (6) per-component verification gate + zero-diff freeze re-audit + grep gate (no `stat-card-surface`/`card-premium-border`/`border-gold`/`shadow-premium-*`/`--card-3d-shadow` in management recipes); sequence F1–F9.
- `docs/design-system/FOUNDATION_MANAGEMENT_SURFACE_COMPONENT_AUDIT.md` — 18-touchpoint audit (A-1…A-18) of every affected Foundation component (amber source File:Line + additive hook) and the frozen-component compatibility matrix.

**Key audit findings:**
- Amber reaches management surfaces through 18 audited Foundation touchpoints; all resolvable by an additive hook (new token, new variant, or default-preserving prop branch).
- **Zero frozen renders require modification** (DS-001 Card, DS-002 Button, DS-003 Input, DS-009 Menu, DS-011 Tabs, DS-012 SelectionContainer, CollectionCard v1.1, CollectionToolbar 3.2.2, CollectionFilter 3.2.4, AdminModal 2A.8).
- Highest-touch item: Navigation-family `SelectionContainer` (R-8) — mitigated by management-scoped neutral branch; Navigation-family consumers unchanged.
- Exam/premium gold family, Auth family, and legacy Ancient materials remain untouched (D-142).

## Next gate (approval)

The implementation plan is presented at the **approval gate for the Foundation implementation phase (F1–F9)**. Approval authorizes **Foundation implementation only**; no page migrates before Foundation certification (D-142 migration order: Foundation → Users → Questions → Students → Exams → Sub Admins → Leaderboard → future → repository certification).

## Governance

- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-143 — planning phase; records the implementation shape, implementation still gated; D-142/D-141 from the phase)
- Execution log: this entry (Phase 3.8.1 planning)

# Phase 3.9 — Foundation Management Surface Implementation ✅ CERTIFIED (additive Foundation evolution, F1–F9, D-144)

**Status:** ✅ **CERTIFIED** (2026-08-03) — the approved F1–F9 additive blueprint is implemented **Foundation-only**. **Zero page migrations; no page consumes the management API yet.** Amber is removed only from the new management recipes.

**Implemented (11 Foundation files, zero pages):**
- **F1** — `themes.css`: `--management-*` namespace (dark = aliases to certified neutrals, pixel-identical; light = neutral family `#FFFFFF`/`#F8FAFC`/`#F1F5F9`, `#E2E8F0`/`#CBD5E1`/`#94A3B8`, neutral shadows, accent `--color-accent`). Zero existing tokens mutated.
- **F2** — `AntigravityCard.tsx`: `Card` `'management'` variant + `MANAGEMENT_SURFACE`/`MANAGEMENT_SURFACE_HOVER` exports; NO `PREMIUM_LIGHT_OVERRIDES`.
- **F3** — `CollectionCard.tsx`: `'management'` mapping → `Card variant="management"`.
- **F4** — `AntigravityLayout.tsx`: `CollectionToolbar` + `SelectionContainer` `variant?: 'premium' | 'management'` (default `premium`; gold → accent in the management branch only).
- **F5** — `AntigravityButton.tsx`: `management?: boolean` prop + neutral primary/secondary.
- **F6** — `AntigravityForm.tsx` (`Input` `'management'` variant, excludes `ancient-input`) + `CollectionFilter.tsx` `variant?: 'premium' | 'management'` (trigger + `Menu` wiring).
- **F7** — `SharedComponents.tsx`: `LoadingSkeleton`/`GridSkeleton`/`EmptyState` `variant?: 'premium' | 'management'` (`GOLD_SURFACE` retained).
- **F8** — `AdminModal.tsx`, `useToast.tsx`, `Menu.tsx`: `variant?: 'premium' | 'management'` / `'default' | 'management'` (management panels drop `ancient-overlay`).
- **F9** — verification + certification.

**Verification:**
- `tsc -b` ✅ exit 0 · `npm run build` ✅ exit 0 (5591 modules; pre-existing warnings only) · eslint frozen baseline **405 (352E/53W), zero new from Phase 3.9**.
- Grep gates ✅: zero amber in management recipes; zero page consumers; tokens owned by `themes.css` only; zero existing tokens mutated.
- Compiled CSS ✅: management utilities present in `dist`.
- Zero-diff freeze re-audit ✅: no certified render changed; each change additive/revertible.
- 16-point Certification Standard ✅ ALL PASS (Foundation evolution only — **no page certified**).

## Next gate (page migration approval)

Per D-142 migration order (**Foundation → Users → Questions → Students → Exams → Sub Admins → Leaderboard → future → repository certification**), the next phase is **Admin Users page migration** onto the certified Management Surface Family. It may begin only when the user approves this certification. The Rule 12 Standard amendment (premium family → Management Surface Family) remains a separate D-series decision.

## Governance

- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-144 — implementation, F1–F9 certified + rejected alternatives)
- Certification: docs/certification/FOUNDATION_MANAGEMENT_SURFACE_CERTIFICATION.md (16-point, Foundation-only)
- Implementation report: docs/certification/FOUNDATION_MANAGEMENT_SURFACE_IMPLEMENTATION_REPORT.md
- Visual verification: docs/certification/FOUNDATION_MANAGEMENT_SURFACE_VISUAL_VERIFICATION.md
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 3.9 entry)

# Phase 3.9 — Foundation Management Surface Certification ✅ APPROVED (D-145, 2026-08-03)

**Status:** ✅ **APPROVED** — the user accepted the Phase 3.9 certification. The Foundation Management
Surface Family is now the **certified, frozen repository baseline**, considered capable of supporting
management pages. **No page has migrated — intentional.**

**Accepted as baseline:** `--management-*` token family · `Card` `management` · `CollectionCard`
`management` · management control hooks · management loading components · management modal hooks ·
management toast hooks · management selection/menu hooks.

**Verification accepted:** TypeScript build · production build · frozen lint baseline · freeze
compatibility · backward compatibility · zero consumer migration · zero page regressions · zero existing
variant mutations.

**Frozen rules (D-145):**
- Foundation evolution and page migration must never occur in the same phase.
- Every future page migration consumes the certified Foundation exactly as it exists; **no additional
  Foundation evolution during a page migration** — if a Foundation gap is discovered, stop and open a new
  Foundation evolution gate instead of patching during migration.
- **Admin Users is the next validation page**; no other page may migrate before Admin Users certification.
  Migration order (unchanged, no skipping): Foundation → Admin Users → Admin Questions → Students → Exams
  → Sub Admins → Leaderboard → Future Management Pages.
- Admin Users migration responsibilities are limited to: replacing page surface usage, adopting Management
  Card / Management CollectionCard / Management Toolbar / Management controls, and **preserving** business
  logic, accessibility, and responsive behaviour.

## Next gate (Admin Users — NOT authorized yet)

**Admin Users migration** requires a **separate, dedicated approval gate for that page**; it is not
authorized by this certification approval. Await that approval before any Admin Users change.

## Governance

- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-145 — certification approved + rejected alternatives)
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 3.9 certification-accepted note)
- Execution log: this entry (Phase 3.9 approval)

# Phase 4.0 — Admin Users Management Surface Migration ✅ CERTIFIED (validation implementation, D-146)

**Status:** ✅ **CERTIFIED** (2026-08-03) — Admin Users is the first (validation) page consuming the
certified Management Surface Family. Consumer migration only. **Zero Foundation changes, zero new APIs,
zero business-logic changes.**

**Migrated (3 files, 7 page-owned surfaces, variant-selector-only):**
- `UsersActions.tsx`: `CollectionToolbar variant="management"` · `Input variant="management"` ·
  `CollectionFilter variant="management"`
- `UsersTable.tsx`: `GridSkeleton variant="management"` · `CollectionCard variant="management"` (from
  `premium`)
- `AdminUsers.tsx`: `EmptyState variant="management"` · `ToastContainer variant="management"`

**Preserved (Rules 1–5):** no Foundation component modified; no new tokens/variants/hooks/utilities/
colors/shadows/borders; `useAdminUsers.ts` + services/hooks/state/permissions/API 0-line diff;
accessibility attributes unchanged; responsive layout/spacing/breakpoints unchanged. Status-family
surfaces (`Alert`, danger/success `Button`, `Badge`) correctly retained (Status family independent of
Management family, D-141).

**Documented out-of-file-scope shared composites (G1–G3):** selection layer (`AdminSelectionTabs`,
used by 7+ admin pages), confirmation dialog (`ConfirmModal`), EmptyState internal action button — each
requires a separate shared-component gate.

**Verification:** `tsc -b` ✅ 0 · `npm run build` ✅ 0 · eslint frozen baseline **405 (352E/53W), zero
new** · grep gates ✅ (zero amber tokens in scope; zero `variant="premium"` in scope) · management
utilities in `dist`.

## Next gate (Admin Questions — NOT authorized yet)

Per D-142/D-145 order (**Foundation → Admin Users → Admin Questions → Students → Exams → Sub Admins →
Leaderboard → Future Management Pages**), **Admin Questions** receives its own dedicated migration phase
**only after the user approves this Admin Users certification.** It is not started.

## Governance

- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-146 — migration implemented + certified + rejected alternatives)
- Certification: docs/certification/ADMIN_USERS_MANAGEMENT_SURFACE_CERTIFICATION.md
- Implementation report: docs/certification/ADMIN_USERS_MANAGEMENT_SURFACE_IMPLEMENTATION_REPORT.md
- Visual comparison: docs/certification/ADMIN_USERS_MANAGEMENT_SURFACE_VISUAL_COMPARISON.md
- Page index: docs/certification/PAGE_CERTIFICATION_INDEX.md (Phase 4.0 section)
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 4.0 entry)

# Phase 4.0 — Admin Users Management Surface Certification ✅ APPROVED (First Certified Consumer, D-147)

**Status:** ✅ **APPROVED** (2026-08-03) — the user accepted the Phase 4.0 certification. **Admin Users =
First Certified Management Surface Consumer** and the repository's **reference implementation** for
future Management page migrations.

**Certified surfaces (7):** Management Toolbar · Management Search · Management Filter · Management
CollectionCard · Management Loading Skeleton · Management Empty State · Management Toast.

**Verification accepted:** TypeScript build · production build · ESLint baseline preserved · responsive
layouts preserved · accessibility preserved · business logic unchanged · Foundation unchanged · zero new
visual ownership added to the page.

**Gaps G1–G3 accepted and deferred** (AdminSelectionTabs · ConfirmModal · EmptyState internal action
button) — each gets its own dedicated shared-component evolution phase; never solved during consumer
migrations; do not block this certification.

**Rules reaffirmed (user):** 1 — Foundation evolution and consumer migration never in the same phase;
2 — consumers consume only certified Foundation APIs; 3 — a Foundation gap found during a page migration
stops the migration, is documented, and opens a separate Foundation evolution phase (never patched during
migration); 4 — shared reusable components are never modified inside a page migration.

**Migration order unchanged:** Foundation → ✅ Admin Users → Admin Questions → Students → Exams → Sub
Admins → Leaderboard → Future Management Pages (no skipping).

## Next phase (Phase 4.1 — NOT authorized yet)

**Do not begin Admin Questions automatically.** The next phase is a **dedicated Phase 4.1 planning and
audit phase** for Admin Questions — **read-only, no implementation** — that: audits the current Admin
Questions page; compares it with the certified Management Surface Foundation; identifies reusable
shared-component gaps; produces an implementation checklist; and **stops for approval before any
migration**. Phase 4.1 opens only on a **separate approval dedicated to the Admin Questions planning and
migration phase** (D-147).

## Governance

- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-147 — certification approved + rejected alternatives)
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 4.0 certification-accepted note)
- Execution log: this entry (Phase 4.0 approval)
- Page index: docs/certification/PAGE_CERTIFICATION_INDEX.md (Admin Users = APPROVED, First Certified Consumer)

# Phase 4.1 — Admin Questions Management Surface Planning & Audit ✅ COMPLETE (read-only, D-148)

**Status:** ✅ **COMPLETE** (2026-08-03) — read-only planning and audit. **Zero source-code changes · zero
Foundation changes · zero shared-component changes.** Migration is gated on a separate dedicated approval.

**Audited scope:** `src/pages/admin/AdminQuestions.tsx` + `src/components/admin/questions/**` (15 source
files + 3 docs). Baseline: `tsc -b` exit 0; in-scope snapshot (18 files, SHA-256) unchanged at phase end.

**Readiness summary:**
- ✅ **24 ready swap points (M1–M13) across 10 certified Management APIs** — CollectionToolbar, Input,
  CollectionFilter, Button `management` (~12 buttons), CollectionCard (premium→management), GridSkeleton,
  EmptyState (no action button → Phase-4.0 G3 n/a), ToastContainer, AdminModal ×3, Card ×4.
- ✅ **Retained families (independent, D-141):** Alert, Badge/DifficultyBadge, Pagination,
  CollectionHeader, Tabs (wizard), RadioGroup, Checkbox, Label, IconBadge, SelectionCheckbox, plus
  content (QuestionVisualizer, preview rows, status hues).
- ❌ **Shared-component gates G1/G2/G4:** AdminSelectionTabs · ConfirmModal · **BulkActionBar** (new for
  this page — amber `admin/common` bar).
- ⚠ **Page-specific gaps G5–G10:** G5 serial `PremiumIconContainer` (no management variant); G6 `IconButton`
  ghost (no management prop); **G7 `TextArea` — no `management` variant** (blocks fully-management
  QuestionForm/JsonTab/PromptEditor — needs its own Foundation evolution gate); G8 `Input compact`
  density; G9 brand-colour AI tool cards + `!bg-primary/5` overrides; G10 upload progress overlay.

**Business logic:** verified 0-line-diff — `useAdminQuestions.ts` (138 lines), `useBulkUpload.ts` (622
lines), services, permissions, API, state, loading, progress all untouched by a surface-only migration.

**Responsive & a11y:** parity with Admin Users verified — identical toolbar/row/skeleton/modal classes;
FocusTrap, Esc, focus-restore, aria-live, aria-invalid/describedby, progressbar all retained.

**Deliverables:** docs/certification/ADMIN_QUESTIONS_MANAGEMENT_SURFACE_{AUDIT,FOUNDATION_COMPARISON,IMPLEMENTATION_PLAN}.md

## Next gate (Admin Questions migration — NOT authorized yet)

**Do not migrate Admin Questions.** The migration phase opens only on a **separate, dedicated approval
for the Admin Questions migration phase** (D-148). Before it opens, four decisions are required:
(1) **G7 `TextArea`** — open a dedicated Foundation evolution gate for `TextArea variant="management"`
   (Rule 1/3 forbids doing it inside the migration), or migrate with `TextArea` retained premium;
(2) **G5** serial badge — retain premium accent or a Foundation gate for a neutral serial material;
(3) **G4 `BulkActionBar`** — shared-component gate (amber bar);
(4) **G8/G9/G10** — small decisions (compact input, brand tiles, overlay).

## Governance

- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-148 — planning complete + rejected alternatives)
- Execution log: this entry (Phase 4.1 planning)
- Page index: docs/certification/PAGE_CERTIFICATION_INDEX.md (Phase 4.1 planning row)

# Phase 4.1A — TextArea Foundation Evolution (dedicated, D-149) ⏳ OPEN (TextArea-only)

**Status:** ⏳ **OPEN** (2026-08-03) — **Phase 4.1 planning & audit APPROVED by user (D-149).** The user then
authorized a **dedicated Foundation evolution phase for `TextArea` only** to close the G7 gap before any
Admin Questions migration. This is **Foundation evolution** — no consumer migration here.

**Approved scope (D-149), five steps:**
1. **Audit** `TextArea` — component + every consumer.
2. **Design** the additive `variant="management"` (mirror the certified `Input` management recipe).
3. **Verify backward compatibility** — `tsc`, build, frozen lint baseline, ds003 runtime audit.
4. **Certify** the component.
5. **Stop for approval.** No Admin Questions migration begins until this phase is certified.

**Deferred exactly as documented (NOT part of this phase):** G1 `AdminSelectionTabs`, G2 `ConfirmModal`,
G4 `BulkActionBar`, G5 `PremiumIconContainer` serial badge, G8, G9, G10.

**Migration order (unchanged, no skipping):** Foundation (**TextArea**) → Admin Questions Migration → Students
→ Exams → Sub Admins → Leaderboard.

## Governance

- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-149 — Phase 4.1 approval + TextArea phase opened + rejected alternatives)
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 4.1A TextArea phase entry, additive-only rules)
- Execution log: this entry (Phase 4.1A)
- Page index: docs/certification/PAGE_CERTIFICATION_INDEX.md (Phase 4.1 APPROVED row + Phase 4.1A section)

# Phase 4.1A — TextArea Foundation Evolution ✅ IMPLEMENTED (D-149) — certification pending

**Status:** ✅ **IMPLEMENTED** (2026-08-03) — steps 1–3 complete; certification pending user approval.

**Step 1 — Audit:** `TextArea` (`AntigravityForm.tsx`) has variant `'default' | 'compact'`; the gold `.ancient-textarea`
material is MATERIAL FAMILY C (`index.css:884-922`). All 10 consumers (QuestionForm ×7, JsonTab, PromptEditorModal,
LangInputPanel, ds003 test) pass no variant → `default`. **G7 confirmed**: no `management` variant.

**Step 2 — Design:** additive `variant="management"` mirroring the certified `Input` recipe
(`--management-surface` / `--management-border` / `--management-accent`; `management ? '' : 'ancient-textarea'`).
No new tokens, no amber, no new utilities (Input management classes already compiled).

**Step 3 — Verify:** `tsc -b` exit 0 · `npm run build` exit 0 · lint baseline **405 unchanged, zero new** ·
5 pure-TS suites / 165 tests PASS · default/compact render byte-identical. Regression test added to
`ds003-runtime-audit.test.tsx` (line 100). **Environmental caveat (pre-existing):** React/jsdom suites
(`ds003`-`ds014`) cannot run here (`@csstools/css-calc` ESM at worker startup; proven by untouched `ds007`
failing identically) — not caused by this phase.

**Step 4 — Certify:** `TEXTAREA_MANAGEMENT_SURFACE_IMPLEMENTATION_REPORT.md` + `TEXTAREA_MANAGEMENT_SURFACE_CERTIFICATION.md` written.

**Step 5 — STOP.** Certification pending user approval (D-150). **Admin Questions migration is NOT authorized.**

## Governance

- Implementation report: docs/certification/TEXTAREA_MANAGEMENT_SURFACE_IMPLEMENTATION_REPORT.md
- Certification: docs/certification/TEXTAREA_MANAGEMENT_SURFACE_CERTIFICATION.md
- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-149)
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 4.1A — IMPLEMENTED)
- Execution log: this entry (Phase 4.1A implementation)
- Page index: docs/certification/PAGE_CERTIFICATION_INDEX.md (Phase 4.1A row)

# Phase 4.2 — Parchment / Ancient Surface Family Retirement ✅ IMPLEMENTED (D-150) — certification pending

**Status:** ✅ **IMPLEMENTED** (2026-08-04) — repository surface-language retirement; reuse-only (certified neutral Management Surface family); **premium gold accent family preserved** (user-confirmed Option 1).

## Scope

Retire the parchment/ancient surface family and its 12 hexes (`#FFF8E7 #FDF5E2 #F4E5C4 #EFD9AF #E8D5B0 #E2CFA6 #DFC096 #D5B486 #C9A070 #C4A882 #A87828 #8B5A10`) plus parchment-adjacent warm values; reuse only already-certified neutral Management Surface tokens. **No new palette, no redesign, no page-owned colors.**

## Change summary

- `themes.css`: removed `--brown-*` scale, parchment canvas family, `--pie-amber`/`--pie-bronze`/`--pie-brown`, `--border-gold`, `--surface-stat-overlay`, `--card-parchment`, `--table-row-hover-light`; neutralized all light semantic tokens; remapped `--ancient-*` aliases → neutral tokens; deleted `.light` ancient alias block; preserved light-only premium gold material.
- `index.css`: added `--color-border-default`/`--color-gold-300` @theme mappings; neutral `--ancient-*` remap; neutralized `.light .ancient-card` → `--management-surface` and `.light .ancient-input/-select/-textarea/-otp` gold borders → neutral borders + focus rings; `.ancient-*` class names preserved.
- Components: `TopicReader`, `TopicSectionRenderer`, `BulkActionBar`, `AdminSubAdminsView`, `SubjectPieChart` (parchment surfaces → neutral); `CarouselDots`, `SplashPage`, `AntigravityCard` (gold accent preserved).
- Unchanged consumers resolved via neutralized aliases: `PremiumIconContainer`, `AdminIconWrap`, `AntigravityForm`, `Menu`, `Navigation`, `TopicInfoButton`, `SubjectCardItem`, `AdminModal`.

## Verification

- `npx tsc -b` → exit 0 · `npm run build` → exit 0 (pre-existing warnings only)
- ds007 smoke suite → **18/18 PASS** (audit config) — the migration's own lock
- Retired-hex / token scan → clean; gold accent preserved; `.ancient-*` classes intact
- 5 pure-TS suites / 165 tests PASS (`npm run test`); component suites blocked at worker startup by the **pre-existing** `@csstools/css-calc` ESM/`ERR_REQUIRE_ESM` environment issue (proven unrelated — ds007 fails identically on the untouched baseline)
- **Pre-existing test drift accepted + deferred (not Phase 4.2 blockers):** ds003 (21, AntigravityForm), ds005 (10, Badge), ds014 (2, Avatar/AdminIconWrap) — documented in the implementation report §5; deferred-work register DW-1…DW-4 §6

## Governance

- Implementation report: docs/certification/PHASE_4_2_PARCHMENT_RETIREMENT_IMPLEMENTATION_REPORT.md
- Certification: docs/certification/PHASE_4_2_PARCHMENT_RETIREMENT_CERTIFICATION.md
- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-150)
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 4.2 — IMPLEMENTED)
- Execution log: this entry (Phase 4.2 implementation)
- Page index: docs/certification/PAGE_CERTIFICATION_INDEX.md (Phase 4.2 row)

## Next gate

**Certification.** The user accepts the Phase 4.2 implementation report + certification. **No regressions introduced by Phase 4.2.** Admin Questions migration (next page in the D-142 order) stays gated behind its own dedicated approval.

---

# Phase 5.2 — Foundation Dead Code Cleanup ✅ IMPLEMENTED (D-151) — certification pending

**Status:** ✅ **IMPLEMENTED** (2026-08-04) — deletion-only cleanup of the SAFE DELETE subset of FOUNDATION_DEAD_CODE_AUDIT.md. **Zero runtime, visual, Foundation, token, or page behavior changes.**

## Scope

Only **SAFE DELETE** items, each independently grep-verified before removal. Excluded: NEEDS VERIFICATION, MERGE, CONFLICT, FREEZE-GATED (FG-1..FG-12, `--btn-*`, ~220+ dead `themes.css` Layer 3 tokens — Phase 5.3), token consolidation, hardcoded-styling replacement, component extraction, Foundation refactoring. **No `themes.css` edit.**

## Change summary

- **Files deleted (11):** `PaletteBackground.tsx`, admin barrels (`overview`/`questions`/`topics`/`upload`/`users`), user barrels (`subject-tests`/`topic-exams`/`topics`), `common/DataTable.tsx`, `common/LoadingOverlay.tsx`. `admin/settings/index.ts` **retained** (live — `AdminSettings.tsx:6`).
- **Dead definitions removed (9):** SectionBlock, StatePanel, SectionWrapper, CTACard, ActivityCard, StaggerContainer/StaggerItem + stagger variants, QuestionInfoHeader, TableSkeleton, useNavigationActive.
- **Dead exports un-exported (9):** ButtonSize, AlertProps, PREMIUM_SURFACE_IMAGE, ICON_BADGE_SIZES, IconBadgeStatus, MonthOption, WelcomeBannerVariant, getGreeting, TopicFieldErrors (internal usage retained).
- **Dead variants pruned (8):** Button auth-dark/auth-muted/auth-violet/auth-xl; Input violet; ResultStatCard → success/danger/default; Spinner neutral; Menu fade/slide → scale; AdminText sizeTokens → body/metadata/heading; ErrorContainer → page/inline; error.types ErrorContainerVariant → page/inline.
- **`index.css` dead `@theme` registrations removed:** radii (button-xs/md/auth, badge-md, alert, icon-sm, empty-state, filter), elevation-5/6/7, card-auth-light duplicate block merged, button-primary material (4), material-input self-refs (7), text-* utilities. **`--text-stat-value` retained** (live LoginPage consumer).
- **Audit refutations KEPT (12+):** Display, PrimaryButton, ScoreCard, ResultStatCard, darkClassName, showShadow, TAB_SPRING, AdminText cinzel/garamond/sans + sizes, management variants, bg-sidebar, text-stat-value-text, ghost button family, rounded-stat-card-radius, text-stat-value utility, admin/settings barrel.

## Verification

- `npx tsc -b` → exit 0 · `npm run build` → exit 0 (50.34s, 5589 modules; 2 pre-existing arbitrary-value CSS warnings only)
- `npm run lint` → 344 pre-existing errors, **0 introduced**
- audit suite (`vitest.audit.config.ts`) → **baseline match**: 33 failed / 301 passed (ds003 21, ds005 10, ds014 2 = documented DW-1..DW-4); ds007 smoke **18/18 PASS**; no new failures, no regressions
- Every deleted symbol / CSS registration grep-confirmed zero-consumer; every KEPT item grep-confirmed live
- **Pre-existing test drift unchanged and independent of Phase 5.2** (DW-1..DW-4, deferred)

## Governance

- Implementation report: docs/design-system/PHASE_5_2_IMPLEMENTATION_REPORT.md
- Certification: docs/design-system/PHASE_5_2_CERTIFICATION.md
- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-151)
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 5.2 — IMPLEMENTED)
- Execution log: this entry (Phase 5.2 implementation)

## Next gate

**Certification.** The user accepts the Phase 5.2 implementation report + certification. **No regressions introduced by Phase 5.2.** **Phase 5.3 (freeze-gated list FG-1..FG-12, `--btn-*` namespace, ~220+ dead `themes.css` tokens) requires separate approval and is NOT started.**

---

# Phase 5.3A - Token Consolidation Batch A (D-152) IMPLEMENTED - certification pending

**Status:** 🔶 **IMPLEMENTED** (2026-08-04) - deletion of the 220 approved SAFE REMOVE tokens in the low-risk dead namespaces. **Zero runtime, visual, Foundation, token-value, or page behavior changes.**

## Scope

Only SAFE REMOVE tokens from the named 5.3A families in the Phase 5.2A verified inventory (FOUNDATION_TOKEN_VERIFICATION.md / DELETE_LIST.md). Deferred `elevation-popover` → 5.3C (dead `dropdown-shadow` dependency at themes.css:972). Excluded: `--btn-*` (5.3B), radius/shadow/dropdown (5.3C), MERGE (5.3D), freeze-gated (5.3E), remaining 198 dead SAFE REMOVE (future batches). **No mixing of SAFE REMOVE / MERGE / FREEZE PROTECTED.**

## Change summary

- **`themes.css`** (-234 lines, 1272→1038): removed dead definitions for 143 primitive color-scale stops (gray/slate/blue/green/red/amber/purple/emerald/teal/cyan/rose/orange/indigo), 22 opacity (`opacity-0..100`, `opacity-disabled`), 16 dead nav tokens, 12 chart palette, 5 gradient tokens, 8 dead elevations (`elevation-5/6/7`, canvas/interactive/floating/modal/overlay), in both dark and light blocks.
- **`index.css`** (-11 lines, 1158→1147): removed 11 `ancient-*` alias definitions from `:root`. **`ancient-gold-bright` RETAINED** (live consumer PremiumIconContainer).
- Total: **220 tokens / 245 lines**, all `no-refs` or `refsByDead` per the verified inventory.
- No other file modified. CRLF preserved.

## Verification

- `npx tsc -b` → exit 0 · `npm run build` → exit 0 (48.25s, 5589 modules; only pre-existing chunk-size + 2 logical arbitrary-value CSS warnings, unchanged)
- `npm run lint` → 397 problems (344 errors + 53 warnings) = exact pre-existing baseline, **0 introduced**
- audit suite (`vitest.audit.config.ts`) → **baseline match**: 33 failed / 301 passed (ds003 21, ds005 10, ds014 2 = documented DW-1..DW-4); ds007 smoke **18/18 PASS**; no new failures
- Post-edit: 0 remaining definitions of removed tokens; 0 dangling `var()` refs; 313/313 LIVE + 222/222 FREEZE PROTECTED intact; repo token scan 0 source refs (stale Android Capacitor bundle artifacts only)
- **Pre-existing test drift unchanged and independent of Phase 5.3A** (DW-1..DW-4, deferred)

## Governance

- Implementation report: docs/design-system/PHASE_5_3A_IMPLEMENTATION_REPORT.md
- Certification: docs/design-system/PHASE_5_3A_CERTIFICATION.md
- Verification summary: docs/design-system/PHASE_5_3A_VERIFICATION_SUMMARY.md
- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-152)
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 5.3A — IMPLEMENTED)
- Execution log: this entry (Phase 5.3A implementation)

## Next gate

**Certification.** The user accepts the Phase 5.3A implementation report + certification. **No regressions introduced by Phase 5.3A.** **Phase 5.3B (`--btn-*` namespace) must NOT start until then.** 5.3C (radius/shadow/dropdown + deferred `elevation-popover`), 5.3D (16 MERGE), 5.3E (freeze-gated) each require their own gate.

---

# Phase 5.3B - Token Consolidation Batch B (D-153) IMPLEMENTED - certification pending

**Status:** 🔶 **IMPLEMENTED** (2026-08-04) - deletion of the 39 approved SAFE REMOVE dead Button-namespace tokens. **Zero runtime, visual, Foundation, token-value, or page behavior changes.**

## Scope

Only SAFE REMOVE Button-namespace tokens from the Phase 5.2A verified inventory (FOUNDATION_TOKEN_VERIFICATION.md / DELETE_LIST.md): 38 dead `--btn-*` compatibility aliases (primary 9, secondary 7, success 6, danger 6, ghost 5, outline 5) + `--button-border-secondary-width`. All `reason=no-refs`. Excluded (protected/frozen): `--button-*` x11, `--material-button-*` x4, `@theme` button registrations x11, AntigravityButton, Control/Management/Premium namespaces. **No mixing of SAFE REMOVE / MERGE / FREEZE PROTECTED.**

## Change summary

- **`themes.css`** (-41 lines, 1038→997): removed 39 tokens' definition lines in both dark and light blocks (`btn-primary-active-shadow` dark:893 + light:986; `button-border-secondary-width` dark:696 + light:999; the other 37 defined once in the dark block :887-924).
- **`index.css`** unchanged (0 definition lines in the set). No other file modified. CRLF preserved.
- Total: **39 tokens / 41 lines**, all `no-refs` per the verified inventory.

## Verification

- `npx tsc -b` → exit 0 · `npm run build` → exit 0 (37.76s; only pre-existing chunk-size + CSS warnings, unchanged)
- `npm run lint` → 397 problems (344 errors + 53 warnings) = exact pre-existing baseline, **0 introduced**
- audit suite (`vitest.audit.config.ts`) → **baseline match**: 33 failed / 301 passed (ds003 21, ds005 10, ds014 2 = documented DW-1..DW-4); ds007 smoke **18/18 PASS**; no new failures
- Post-edit: 0 remaining definitions of removed tokens; 0 dangling `var()` refs introduced; 313/313 LIVE + 222/222 FREEZE PROTECTED intact; repo token scan 0 source refs to `--btn-*` / `button-border-secondary-width`
- **Pre-existing test drift unchanged and independent of Phase 5.3B** (DW-1..DW-4, deferred)
- **Pre-existing `--fw-h*`/`--lh-h*` refs at index.css:500-505** noted (present at HEAD, absent from the verified inventory, out of scope; require their own decision)

## Cleanup dashboard (technical-debt burn-down)

| Metric | Before | After |
|--------|-------:|------:|
| Repository Tokens | 511 | **472** |
| SAFE REMOVE Remaining | 198 | **159** |
| FREEZE PROTECTED | 222 | 222 |
| LIVE Tokens | 313 | 313 |
| MERGE Pending | 16 | 16 |

## Governance

- Implementation report: docs/design-system/PHASE_5_3B_IMPLEMENTATION_REPORT.md
- Certification: docs/design-system/PHASE_5_3B_CERTIFICATION.md
- Verification summary: docs/design-system/PHASE_5_3B_VERIFICATION_SUMMARY.md
- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-153)
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 5.3B — IMPLEMENTED)
- Execution log: this entry (Phase 5.3B implementation)

## Next gate

**Certification.** The user accepts the Phase 5.3B implementation report + certification. **No regressions introduced by Phase 5.3B.** **Phase 5.3C (radius/shadow/dropdown + deferred `elevation-popover`) must NOT start until then.** 5.3D (16 MERGE), 5.3E (freeze-gated) each require their own gate.

---

# Phase 5.3C - Token Consolidation Batch C (D-154) IMPLEMENTED - certification pending

**Status:** 🔶 **IMPLEMENTED** (2026-08-04) - deletion of the 37 approved SAFE REMOVE dead radius/shadow/elevation/dropdown tokens. **Zero runtime, visual, Foundation, token-value, or page behavior changes.**

## Scope

Only SAFE REMOVE radius/shadow/elevation/dropdown tokens from the Phase 5.2A verified inventory (FOUNDATION_TOKEN_VERIFICATION.md / DELETE_LIST.md): radius 18 (none/xs/sm/lg/4xl/button-xs/md/auth/badge-md/icon-sm/alert/empty-state/filter/card-inner/surface/pill/tooltip/full), shadow 10 (focus/hover/modal/offset-none/xs/sm/md/lg/xl/2xl), dropdown 8 (bg/border/shadow/radius/item-hover/item-radius/offset/z), elevation 1 (**`elevation-popover`** - 5.3A deferral executed). Cleanup phase. **No mixing of SAFE REMOVE / MERGE / FREEZE PROTECTED.**

## Deferred (2, chain with input-shadow)

- `shadow-pressed` - only consumer is `input-shadow` (themes.css:890, `input-*` family, SAFE REMOVE, future batch)
- `shadow-xs` - only consumer is the deferred `shadow-pressed`; chain `input-shadow -> shadow-pressed -> shadow-xs`

## Change summary

- **`themes.css`** (-41 net, 997→956): removed 37 tokens' definition lines in both dark and light blocks.
- **`index.css`** net content unchanged (-1 cosmetic trailing-line normalization). No other file modified. CRLF preserved.
- Total: **37 tokens**, all `no-refs` or `refsByDead` with chains resolved in-batch or documented.

## Verification

- `npx tsc -b` → exit 0 · `npm run build` → exit 0 (52.30s; only pre-existing chunk-size + CSS warnings, unchanged)
- `npm run lint` → 397 problems (344 errors + 53 warnings) = exact pre-existing baseline, **0 introduced**
- audit suite (`vitest.audit.config.ts`) → **baseline match**: 33 failed / 301 passed (ds003 21, ds005 10, ds014 2 = documented DW-1..DW-4); ds007 smoke **18/18 PASS**; no new failures
- Post-edit: 0 remaining definitions of removed tokens; 0 dangling `var()` refs (only pre-existing comment text); 313/313 LIVE + 222/222 FREEZE PROTECTED intact; repo token scan 0 source refs; dead-chain scan PASS
- **Pre-existing test drift unchanged and independent of Phase 5.3C** (DW-1..DW-4, deferred)

## Cleanup dashboard (technical-debt burn-down)

| Metric | Before | After |
|--------|-------:|------:|
| Repository Tokens | 472 | **435** |
| SAFE REMOVE Remaining | 159 | **122** |
| FREEZE PROTECTED | 222 | 222 |
| LIVE Tokens | 313 | 313 |
| MERGE Pending | 16 | 16 |

## Governance

- Implementation report: docs/design-system/PHASE_5_3C_IMPLEMENTATION_REPORT.md
- Certification: docs/design-system/PHASE_5_3C_CERTIFICATION.md
- Verification summary: docs/design-system/PHASE_5_3C_VERIFICATION_SUMMARY.md
- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-154)
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 5.3C — IMPLEMENTED)
- Execution log: this entry (Phase 5.3C implementation)

## Next gate

**Certification.** The user accepts the Phase 5.3C implementation report + certification. **No regressions introduced by Phase 5.3C.** **Phase 5.3D (duplicate token merges, 16 MERGE items) must NOT start until then.** Deferred chain `input-shadow -> shadow-pressed -> shadow-xs` documented for the future input-family SAFE REMOVE batch. 5.3E (freeze-gated) requires its own gate.

# Phase 5.3D - Token Consolidation Batch D (D-155, D-156) IMPLEMENTED AND CERTIFIED 2026-08-04

**Status:** 🔶 **IMPLEMENTED AND CERTIFIED** (2026-08-04) - user accepted the implementation report + certification. Render-neutral merge of the two byte-identical duplicate pairs approved for 5.3D (Group C premium shadow, Group D typography registrations). **Zero runtime, visual, Foundation, token-value, or page behavior changes.** Certification recorded the `radius-xl`/`radius-2xl` MERGE -> CONFLICT reclassification governance: original inventory classified them MERGE, implementation review reclassified CONFLICT, 5.3D intentionally excluded them, 5.3E is the authoritative resolution phase.

## Scope (D-155)

Render-neutral merges only. Group A color aliases (`secondary`/`success`/`danger`/`warning`/`info`) moved to
5.3E (canonical light values differ). `radius-xl`/`radius-2xl` reclassified MERGE -> CONFLICT, excluded ->
5.3E. Group B carved recipes proceed only if byte-identical; Group E only removes a duplicated registration.

## Completed merges

1. **Group C - `shadow-premium-carved` -> `shadow-premium-icon`** (byte-identical
   `var(--elevation-carved), inset 0 1px 0 rgba(255, 248, 210, 0.5)`):
   - `index.css` line 185 (`--shadow-premium-carved`) deleted.
   - `SharedComponents.tsx` lines 26, 44 repointed to `shadow-premium-icon`.
2. **Group D - `text-h1` / `text-h2` / `text-h3`** (identical values to themes.css:317-321):
   - `index.css` `:root` lines 248-250 deleted (duplicate registrations).
   - themes.css canonical + all responsive blocks kept.

## Deferred to Phase 5.3E (documented, not executed)

- Group A: `secondary`, `success`, `danger`, `warning`, `info`
- Group B: `card-3d-shadow`, `stat-card-3d-shadow`, `elevation-carved` (recipes NOT byte-identical)
- `text-stat-value` (index.css:192 `@theme` registration is load-bearing for the live utility)
- `radius-xl`, `radius-2xl` (value conflicts)

## Change summary

- **`index.css`** (-4 lines): deleted `--shadow-premium-carved` (line 185) + `:root` `--text-h1/h2/h3` (lines 248-250).
- **`SharedComponents.tsx`**: repointed 2 class refs (lines 26, 44). No other file modified. CRLF preserved.

## Verification

- `npm run build` (`tsc -b && vite build`) → exit 0 (1m 38s; only pre-existing chunk-size + 3 pre-existing arbitrary-value CSS warnings, unchanged)
- Post-edit scans: 0 residual `shadow-premium-carved` refs in src; 0 in compiled dist CSS; `shadow-premium-icon` present; `text-h1/h2/h3` still defined (themes.css); 0 dangling `var()` refs
- 313/313 LIVE + 222/222 FREEZE PROTECTED intact; **Pre-existing test drift unchanged** (DW-1..DW-4, deferred)

## Cleanup dashboard (technical-debt burn-down)

| Metric | Before | After |
|--------|-------:|------:|
| Repository Tokens | 435 | **434** |
| SAFE REMOVE Remaining | 122 | 122 |
| FREEZE PROTECTED | 222 | 222 |
| LIVE Tokens | 313 | 313 |
| MERGE Pending | 16 | **12** |

## Governance

- Implementation report: docs/design-system/PHASE_5_3D_IMPLEMENTATION_REPORT.md
- Certification: docs/design-system/PHASE_5_3D_CERTIFICATION.md
- Verification summary: docs/design-system/PHASE_5_3D_VERIFICATION_SUMMARY.md
- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-155, D-156)
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 5.3D — IMPLEMENTED)
- Execution log: this entry (Phase 5.3D implementation)

## Next gate

**Certification.** The user accepts the Phase 5.3D implementation report + certification. **No regressions introduced by Phase 5.3D.** **Phase 5.3E (render-affecting corrections) requires a completely separate approval** - it contains Group A color aliases, `radius-xl`/`radius-2xl`, `--input-border`, Group B carved recipes, and `text-stat-value`. Deferred chain `input-shadow -> shadow-pressed -> shadow-xs` remains for the future input-family SAFE REMOVE batch. Pre-existing drift DW-1..DW-4 unchanged.

# Phase 5.3E - Render-Affecting Token Corrections (D-158, D-159) IMPLEMENTED AND CERTIFIED 2026-08-04

**Status:** 🔶 **IMPLEMENTED AND CERTIFIED** (2026-08-04) - user accepted the implementation report + certification + visual verification. T1-T4 + Group B verification approved; cleanup dashboard accepted as the new certified Foundation baseline; Foundation cleanup program declared COMPLETE. Phase 6.0 (Repository Foundation Certification Audit) is the recommended next phase - separate approval required.

## Approved scope (D-158/D-159)

T1 `--input-border` → `--border-subtle` (D-121 restore). T2 Radius Option A (runtime 20px/24px canonical; conflicting `@theme` duplicates removed; 12px/16px NOT adopted). T3 Group A aliases repointed to `--color-*` + `@theme` loop elimination. T4 dead `--text-stat-value` registration removed (render-neutral). Group B verify-only (false positive). Explicitly excluded: Radius Option B, premium/management/shadow/typography redesign.

## Completed corrections

1. **T1 - `--input-border`** (index.css:274): `var(--border-input)` → `var(--border-subtle)`. dark `#4B5563`→`#374151`, light `#CBD5E1`→`#E2E8F0`. Affects AntigravityForm + PremiumSelect only; `.light select`/`.ancient-otp` unchanged (consume `--border-input` directly).
2. **T2 - Radius Option A**: `@theme` radius → 20px/24px (index.css:84-85) matching unlayered themes.css winner. Rendered radius byte-identical.
3. **T3 - Group A aliases** (index.css:282-288): repointed to `var(--color-*)`; `@theme` namespace (index.css:43-49) → canonical self-refs (loop eliminated). Dark byte-identical; light corrected for six documented consumers.
4. **T4 - `text-stat-value`**: removed dead registration + 3 dead responsive overrides - render-neutral (compiled class remains color-only).
5. **Group B**: false positive (single definition site each); verify-only.

## Change summary

- **`index.css`** (+7 net lines): T1 line 274; T2 lines 84-85; T3 lines 43-49 + 282-288; T4 removed `--text-stat-value` registration + 3 responsive overrides. No other file modified. CRLF preserved.

## Verification

- `npm run build` (`tsc -b && vite build`) → exit 0 (49s; only pre-existing chunk-size + CSS warnings, unchanged)
- `npm run lint` → 397 problems (344 errors + 53 warnings) = exact pre-existing baseline, 0 introduced
- `npx vitest run --config vitest.audit.config.ts` → 33 failed / 301 passed = exact pre-existing baseline (ds003 21, ds005 10, ds014 2, DW-1..DW-4; ds007 smoke 18/18), 0 introduced
- Compiled CSS: `--input-border:var(--border-subtle)`; `@theme` 20px/24px; aliases → `var(--color-*)`; `.text-stat-value{color:...}` color-only; all dark/light canonical hexes present; 0 dangling `var()` refs
- 313/313 LIVE + 222/222 FREEZE PROTECTED intact; dark mode byte-identical (only approved T1 input-border gray shade); **Pre-existing test drift unchanged** (DW-1..DW-4, deferred)

## Cleanup dashboard (technical-debt burn-down)

| Metric | Before | After |
|--------|-------:|------:|
| Repository Tokens | 434 | **434** |
| SAFE REMOVE Remaining | 122 | 122 |
| FREEZE PROTECTED | 222 | 222 |
| LIVE Tokens | 313 | 313 |
| MERGE Pending | 12 | **0** |

## Governance

- Implementation report: docs/design-system/PHASE_5_3E_IMPLEMENTATION_REPORT.md
- Certification: docs/design-system/PHASE_5_3E_CERTIFICATION.md
- Visual verification: docs/design-system/PHASE_5_3E_VISUAL_VERIFICATION.md
- Planning: docs/design-system/PHASE_5_3E_{IMPACT_ANALYSIS,CONSUMER_MATRIX,VISUAL_DELTA_REPORT,IMPLEMENTATION_PLAN}.md
- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-158, D-159)
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 5.3E — IMPLEMENTED)
- Execution log: this entry (Phase 5.3E implementation)

## Next gate

**Phase 5.3E is CLOSED (certified 2026-08-04). The Foundation cleanup and correction program is COMPLETE.** **No further Foundation work begins without a new approval.** The recommended next phase is **Phase 6.0 - Repository Foundation Certification Audit** (re-audit the entire Foundation after all cleanup phases; produce updated health metrics; compare against the original Phase 5.1 findings; verify no dead code/token regressions; generate the new certified architectural baseline) - requires a separate approval. Radius Option B remains rejected as a Foundation redesign; if ever adopted it requires its own screenshot-baselined evolution phase. Deferred chain `input-shadow -> shadow-pressed -> shadow-xs` remains for the future input-family SAFE REMOVE batch. Pre-existing drift DW-1..DW-4 unchanged.

---

# Phase 5.4A - Surface Language & Elevation (D-161, D-162, D-163) IMPLEMENTED AND CERTIFIED 2026-08-06

**Status:** ✅ **IMPLEMENTED AND CERTIFIED** (2026-08-06) - user accepted the implementation report + certification + visual verification. WS-1/WS-2/WS-3 approved; `--elevation-0` accepted as canonical flat elevation; Foundation now officially owns the surface hierarchy, elevation hierarchy, and management relight. Phase 5.4A CLOSED. Phase 5.4B (Button) planning authorized; implementation requires a separate approval.

## Approved scope (D-161/D-162)

WS-1 canonicalize the 7-level surface ladder (L0-L6) onto existing tokens (all levels pre-existed). WS-2 relight the three `.light` management values (`#FFFFFF`→`#FCFCFD`, `#F8FAFC`→`#F6F8FA`, `#F1F5F9`→`#EDF1F5`); dark block var()-mapped → byte-identical. WS-3 formalize the EXACTLY-4 elevation ladder (E0 flat/E1 card/E2 hover/E3 modal) with additive `--elevation-0: none` + `@theme` registration. Rules A-H: no component-defined elevation/surface/shadows; hover→5.4E, typography→5.4C, buttons→5.4B, skeleton→5.4F, pills→5.4D. Explicitly deferred (5.4B-5.4G): all consumer issues S-2…S-9, E-2/E-3, H-*/T-*/P-*/SK-*/B-*/M-*.

## Completed workstreams

1. **WS-2 - Management relight** (themes.css `.light` block 944-946): three value lines changed; dark `:root` block (864-867) untouched (var()-mapped). Comment expanded with relight rationale (D-162).
2. **WS-3 - Elevation ladder** (additive): `--elevation-0: none` at themes.css:261 (dark :root) + 499 (.light); `--shadow-elevation-0: var(--elevation-0)` at index.css:97. Zero consumers - render-neutral.
3. **WS-1 - Surface hierarchy** (documentation): L0-L6 certified ladder recorded in `SURFACE_LANGUAGE_SPECIFICATION.md` §3; E0-E3 certified in §4.3.

## Governance

- `FOUNDATION_GOVERNANCE.md` v1.18.0 → **v1.21.0**: §4 PERMANENT Surface Hierarchy L0-L6 + Elevation Hierarchy E0-E3 sections; v1.20.0 heading formatting bug fixed; changelog added.
- `SURFACE_LANGUAGE_SPECIFICATION.md` §3/§4 ✅ CERTIFIED (Phase 5.4A).
- Frozen premium materials exempt from elevation rules (StatCard D-141 carved 3D, Button `--material-button-*`, `.ancient-*`, `--elevation-carved`, `--card-3d-shadow`).

## Change summary

- **`src/styles/themes.css`**: WS-2 lines 944-946 + comment 941-943; WS-3 additive lines 261, 499. No other token changed. CRLF preserved.
- **`src/index.css`**: WS-3 additive line 97.
- **Docs**: `SURFACE_LANGUAGE_SPECIFICATION.md`, `FOUNDATION_GOVERNANCE.md`, `docs/design-system/PHASE_5_4A_{IMPLEMENTATION_REPORT,VISUAL_VERIFICATION,CERTIFICATION}.md`, `DESIGN_DECISION_LOG.md` (D-161, D-162), `FOUNDATION_FREEZE_REGISTER.md` (Phase 5.4A entry), this entry.
- **No component/page/service/schema/data files.**

## Verification

- `npm run build` (`tsc -b && vite build`) → exit 0 (only pre-existing chunk-size + 3 benign arbitrary-value CSS warnings, unchanged)
- `npx eslint .` → 397 problems (344 errors + 53 warnings) = exact pre-existing baseline, **0 introduced**
- Compiled CSS: relight values `#fcfcfd`/`#f6f8fa`/`#edf1f5` present; dark scope byte-identical (var-mapped, backing `#1f2937`/`#374151`/`#374151` unchanged); `--elevation-0:none` + `--shadow-elevation-0:var(--elevation-0)` present in both scopes
- Foundation-only scope: new hex values ONLY in themes.css:944-946; `elevation-0` ONLY in themes.css:261/499 + index.css:97
- Contrast ≥ AA on every relight pair (19.6:1 / 7.4:1 / 4.6:1 / 16.5:1); 0 dangling `var()` refs introduced

## Governance

- Implementation report: docs/design-system/PHASE_5_4A_IMPLEMENTATION_REPORT.md
- Certification: docs/design-system/PHASE_5_4A_CERTIFICATION.md
- Visual verification: docs/design-system/PHASE_5_4A_VISUAL_VERIFICATION.md
- Planning: docs/design-system/PHASE_5_4A_IMPLEMENTATION_PLAN.md
- Decision: docs/design-system/DESIGN_DECISION_LOG.md (D-161, D-162)
- Freeze register: FOUNDATION_FREEZE_REGISTER.md (Phase 5.4A — IMPLEMENTED)
- Execution log: this entry (Phase 5.4A implementation)

## Next gate

**Phase 5.4A is CLOSED (certified 2026-08-06).** **Phase 5.4B (Button Language) planning is authorized; implementation requires a separate dedicated approval.** Approved 5.4B scope: semantic button roles, color system, elevation usage, hover behavior, focus, disabled, loading, button consistency. No typography, no hover language outside buttons, no pills, no motion, no skeletons, no page migrations - Foundation evolution only. Success criteria: after 5.4B every button shares one material, one elevation model, one spacing model, one typography model, and one interaction model; only semantic color distinguishes button purpose. Subsequent gates: 5.4C (Typography), 5.4D (Pills & Badges), 5.4E (Hover & Motion), 5.4F (Skeleton), 5.4G (Repository Migration + final certification) - each requires its own separate approval. Pre-existing drift DW-1..DW-4 and the runtime-audit baseline (ds003/ds005/ds014) unchanged and deferred. Working-tree caveat (branch `phase-3.5` large uncommitted working tree) remains a precondition for isolated-diff verification, not a 5.4 task.

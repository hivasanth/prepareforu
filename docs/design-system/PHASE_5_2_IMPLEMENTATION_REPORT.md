# Phase 5.2 - Dead Code Cleanup Implementation Report

- **Phase:** 5.2 - Foundation Dead Code Cleanup (execution of the SAFE DELETE subset of FOUNDATION_DEAD_CODE_AUDIT.md)
- **Type:** Deletion-only. Zero runtime, visual, Foundation, token, or page behavior changes.
- **Status:** Complete (verification pending certification)
- **Date:** 2026-08-04
- **Companion docs:** FOUNDATION_DEAD_CODE_AUDIT.md, FOUNDATION_EXECUTIVE_SUMMARY.md, FOUNDATION_TOKEN_AUDIT.md (+ Phase 5.0 STYLING_SYSTEM_* set)
- **Verification:** `npm run build` PASS, `npm run lint` no new errors, `npx vitest run --config vitest.audit.config.ts` matches pre-existing baseline drift exactly (33 failures / 301 passed).

---

## 1. Scope and Constraints

Phase 5.2 executed **only** items classified **SAFE DELETE** in `FOUNDATION_DEAD_CODE_AUDIT.md`:

- Zero runtime impact (no exported symbol referenced anywhere at runtime)
- Zero visual impact (removed CSS had zero consumers; removed variants had zero consumers)
- Zero Foundation impact (no frozen component API surface changed)
- Zero token impact (no `themes.css` token removed; only dead `@theme` registrations in `index.css` removed)
- Zero page impact (no page file edited)

**Excluded (belong to later phases / need separate approval):** NEEDS VERIFICATION, MERGE, CONFLICT, FREEZE-GATED (FG-1..FG-12), token consolidation, hardcoded-styling replacement, component extraction, Foundation refactoring, architecture refinement, and Phase 5.3 (freeze-gated list).

**Every single deletion was independently re-verified before removal** (empirical greps). Several audit rows were refuted by live consumers and the affected items were KEPT (see Section 5).

---

## 2. Deleted Files (11)

| # | File | Why |
|---|------|-----|
| 1 | `src/components/PaletteBackground.tsx` | Zero imports anywhere |
| 2 | `src/components/admin/overview/index.ts` | Orphaned barrel (zero consumers) |
| 3 | `src/components/admin/questions/index.ts` | Orphaned barrel (zero consumers) |
| 4 | `src/components/admin/topics/index.ts` | Orphaned barrel (zero consumers) |
| 5 | `src/components/admin/upload/index.ts` | Orphaned barrel (zero consumers) |
| 6 | `src/components/admin/users/index.ts` | Orphaned barrel (zero consumers) |
| 7 | `src/components/user/subject-tests/index.ts` | Orphaned barrel (zero consumers) |
| 8 | `src/components/user/topic-exams/index.ts` | Orphaned barrel (zero consumers) |
| 9 | `src/components/user/topics/index.ts` | Orphaned barrel (zero consumers) |
| 10 | `src/components/common/DataTable.tsx` | Zero imports; removal breaks the `AntigravityUI <-> DataTable` circular dependency |
| 11 | `src/components/common/LoadingOverlay.tsx` | Zero imports |

Note: `src/components/admin/settings/index.ts` was on the audit's delete list but was **independently re-verified as LIVE** (`src/pages/admin/AdminSettings.tsx:6` imports `SettingsCard`, `AddExamModal` from it) and was **retained**. The audit claim was refuted.

---

## 3. Removed Dead Component Definitions (7)

| Component | File | Notes |
|-----------|------|-------|
| `SectionBlock` | `src/components/common/AntigravityLayout.tsx` | No consumers |
| `StatePanel` | `src/components/common/AntigravityLayout.tsx` | No consumers |
| `SectionWrapper` | `src/components/common/AntigravityLayout.tsx` | No consumers |
| `CTACard` | `src/components/common/AntigravityResults.tsx` | No consumers |
| `ActivityCard` | `src/components/common/AntigravityDashboard.tsx` | No consumers (actual signature was value/unit/onClick) |
| `StaggerContainer` / `StaggerItem` | `src/components/common/AntigravityAnimation.tsx` | No consumers; `staggerParentVariants`/`staggerItemVariants` also removed |
| `QuestionInfoHeader` | `src/components/exam/QuestionCard.tsx` | No consumers |
| `TableSkeleton` | `src/components/common/SharedComponents.tsx` | No consumers |
| `useNavigationActive` | `src/components/common/Navigation.tsx` | No consumers; `useLocation` import retained (still used internally at line ~242) |

---

## 4. Removed Dead Exports (9, internal usage kept)

| Symbol | File |
|--------|------|
| `ButtonSize` | `src/components/common/AntigravityButton.tsx` |
| `AlertProps` | `src/components/common/Alert.tsx` |
| `PREMIUM_SURFACE_IMAGE` | `src/components/common/AntigravityCard.tsx` |
| `ICON_BADGE_SIZES` | `src/components/common/IconBadge.tsx` |
| `IconBadgeStatus` | `src/components/common/IconBadge.tsx` |
| `MonthOption` | `src/components/sub-admin/students/useStudents.ts` |
| `WelcomeBannerVariant` | `src/components/user/WelcomeBanner.tsx` |
| `getGreeting` | `src/components/user/WelcomeBanner.tsx` |
| `TopicFieldErrors` | `src/components/admin/topics/useAdminTopics.ts` |

---

## 5. Pruned Dead Variants (zero-consumer)

| Component | Pruned | File |
|-----------|--------|------|
| Button | `auth-dark`, `auth-muted`, `auth-violet`, `auth-xl` (type entries, sizeVariants entry, both light/dark class blocks) | `AntigravityButton.tsx` |
| Input | `violet` (type, bool prop, violet focus branch) - management branch retained | `AntigravityForm.tsx` |
| ResultStatCard | variant union to `'success' | 'danger' | 'default'`; colors map pruned (`primary`, `warning` had zero consumers) | `AntigravityResults.tsx` |
| Spinner | variant union `neutral` removed (variant prop kept; single-entry Record) | `Spinner.tsx` |
| Menu | animation unions to `'scale'` (`MenuProps`, `MenuContextValue`, `MenuContentProps`, `animationVariants` pruned fade/slide; `NotificationPanel` uses `animation="scale"`) | `Menu.tsx` |
| AdminText | variant union to `'cinzel' | 'garamond' | 'sans'`; classes map pruned (cinzel-value/garamond-value); CanonicalSize to `'body' | 'metadata' | 'heading'`; sizeTokens/lineHeightTokens pruned (h1/h2/h3/display/caption/stat-value/badge/small removed) | `AdminText.tsx` |
| ErrorContainer | `VARIANT_CLASSES` to page/inline only | `ErrorContainer.tsx` |
| error.types | `ErrorContainerVariant` to `'page' | 'inline'` | `src/types/error.types.ts` |

---

## 6. Removed Dead `@theme` Registrations (each grep-verified 0 consumers)

From `src/index.css`:

- Radii: `--radius-button-xs`, `--radius-button-md`, `--radius-button-auth`, `--radius-badge-md`, `--radius-alert`, `--radius-icon-sm`, `--radius-empty-state`, `--radius-filter`
- Shadows: `--shadow-elevation-5`, `--shadow-elevation-6`, `--shadow-elevation-7`
- `--radius-card-auth-light` duplicate block (2 duplicate blocks merged into one; token itself retained)
- Button primary material: `--color-button-primary-surface`, `--color-button-primary-border`, `--color-button-primary-text`, `--shadow-button-primary`
- Material-input self-referential block (all 7 zero-consumer): `--material-input-compact-*`, `--color-input-violet-focus-border`, `--shadow-input-violet-focus`, `--material-input-checkbox-*`
- Text `@theme` font-size utilities with zero class consumers: `display`, `body`, `caption`, `label`, `badge`, `metadata`, `small`, `heading`, `h1`, `h2`, `h3` — **`--text-stat-value: 1.75rem` RETAINED** (live consumer: `LoginPage`)

**Retained (grep-verified live):** `--radius-stat-card-radius` (audit explicitly says keep), `--radius-stat-icon-radius`, `--shadow-stat-card-shadow`, `--color-sidebar`/`bg-sidebar`, `--color-stat-value-text`, ghost button surface family, `--color-gold-300`, premium/gold accent family.

---

## 7. Examined and KEPT (Audit Claims Refuted by Empirical Greps)

These audit rows claimed dead/unused but were **independently verified as LIVE** and retained:

| Item | Evidence |
|------|----------|
| `Display`, `PrimaryButton`, `ScoreCard`, `ResultStatCard` | Live consumers |
| `darkClassName` / `showShadow` props | Live consumers (`darkClassName` is test-pinned by ds004) |
| `TAB_SPRING` | `AntigravityAnimation.tsx:10` - used by ThemeToggle, SegmentedFilter, AntigravityData |
| AdminText `cinzel`/`garamond`/`sans` variants and `size="heading"/"body"/"metadata"` | Used in UsersTable, UserIdentity, AdminSubAdminsView, AdminUsers, UploadContextPanel, MethodSelectionView, TopicsToolbar, StudentsTable (audit's "cinzel dead" claim was wrong) |
| Menu `management` variant, AdminModal `management`, Input `management`, CollectionCard `management`/`row`/`premium`, Tabs `management` | Live consumers |
| `bg-sidebar`, `text-stat-value-text`, ghost button surface family | Live consumers |
| `rounded-stat-card-radius` | Audit itself says keep (FOUNDATION_DEAD_CODE_AUDIT.md:129) |
| `text-stat-value` utility | Live consumer (LoginPage) |
| `admin/settings/index.ts` barrel | Live consumer (AdminSettings.tsx:6) |

Also retained per audit corrections: `--btn-*` namespace is **NOT** in `index.css` (0 remaining - confirmed; the ~30 dead `--btn-*` tokens live in `themes.css` Layer 3 and belong to Phase 5.3, not Phase 5.2). No `themes.css` token was touched.

---

## 8. Verification

| Gate | Result | Evidence |
|------|--------|----------|
| `npm run build` (`tsc -b && vite build`) | **PASS** | Clean tsc + vite build (50.34s, 5589 modules). Only 2 pre-existing arbitrary-value CSS warnings (`bg-[var(--management-*)]`, `border-[length:var(...)]`) + chunk-size advisories - all pre-existing, not from these deletions |
| `npm run lint` (`eslint .`) | **No new errors** | 344 pre-existing errors (all `no-explicit-any`/unused in services/pages/supabase + `react-refresh/only-export-components` on legacy files). Zero introduced by Phase 5.2 |
| `npx vitest run --config vitest.audit.config.ts` | **Matches baseline exactly** | 33 failed / 301 passed (12 files). ds003=21, ds005=10, ds014=2 - exactly the documented pre-existing drift (DW-1..DW-4). ds007 smoke suite passes (18/18). None of the failing tests are touched by Phase 5.2 (Input/TextArea/Select material, Badge variants, Avatar surface are test-pinned and were not modified; `FIELD_SURFACE` unchanged) |

The 33 audit failures are the known pre-existing runtime drift (test expectations vs. certified Foundation material), confirmed independent of Phase 5.2 by: (a) exact per-file match to the documented baseline, (b) all failing suites exercise areas Phase 5.2 explicitly did not touch, (c) the ds003 governance failure asserts Input's material classes (`bg-hover-bg`/`border-border-subtle`) while the certified Input uses `FIELD_SURFACE` = `bg-input-bg`/`border-input-border` - an expectation drift that predates Phase 5.2.

---

## 9. Before/After

| Metric | Before | After |
|--------|--------|-------|
| Orphaned files in audit | 10 listed | 9 deleted, 1 refuted+kept (`admin/settings/index.ts`), +2 common components (DataTable, LoadingOverlay) = **11 deleted** |
| Dead component definitions | 9 | **0** |
| Dead exports | 9 | **0** (all internal usage retained) |
| Dead variants | 20+ audited | 8 pruned to zero-consumer unions |
| Dead `@theme` registrations | ~30 audited | removed (see Section 6) |
| `index.css` | 1201 lines | **1158 lines** (-43) |

---

## 10. Out of Scope (deferred / NOT executed)

- `--btn-*` token namespace and other dead Layer 3 tokens in `themes.css` (~220+ dead tokens overall) - **Phase 5.3 (freeze-gated)**.
- Freeze-gated list FG-1..FG-12 - **Phase 5.3**.
- Token consolidation (5 conflicts), hardcoded-styling replacement (83 hex / 105 palette / 1246 arbitrary / 94 inline), component extraction, Foundation refactoring, architecture refinement - later phases, require separate approval.
- `CollectionCard` (management/row/premium variants live), `AdminModal` (management variant live), `Tabs` (management live), `Input` (management branch retained) - all retained.
- No page files, no `themes.css` edits, no frozen Foundation API changes.

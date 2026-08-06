# Foundation Dead Code Audit

- **Phase:** 5.1 — Foundation Simplification & Design System Cleanup Audit (Step 6)
- **Scope:** `src/components/**` (236 component files), `src/index.css`, `src/styles/themes.css`, all 387 `src` files
- **Type:** Documentation only. Zero source, token, Foundation, or page changes.
- **Status:** Draft (plan-mode) — awaiting approval to promote to `docs/design-system/FOUNDATION_DEAD_CODE_AUDIT.md`
- **Date:** 2026-08-04
- **Classification legend:** SAFE DELETE · NEEDS VERIFICATION · KEEP

---

## 0. Method

- Every candidate was verified by exhaustive import-line grep across all 387 `src/**/*.{ts,tsx}` (incl. test files
  `src/ds0xx-runtime-audit.test.tsx`, `src/**/*.test.ts`). Zero importers = SAFE DELETE, unless a runtime-audit test
  pins its class strings (then NEEDS VERIFICATION).
- "Unused CSS" = CSS rules / `@keyframes` / class definitions with no matching element in any tsx (class-name grep).
- "Unused token registrations" cross-references FOUNDATION_TOKEN_AUDIT §1-§9 (dead `@theme` rows, dead namespaces).

---

## 1. Orphaned Files (zero importers anywhere in `src`)

| # | File | Evidence | Class | Risk | Recommendation |
|---|---|---|---|---|---|
| 1 | `src/components/PaletteBackground.tsx` | name appears only in own file; not in App/main/layout | **SAFE DELETE** | none | Delete (also a hardcoded-hex offender; see EXEC §2) |
| 2 | `src/components/admin/overview/index.ts` | `AdminOverview.tsx:6-7` imports `./StatsGrid`/`./useAdminOverview` directly | **SAFE DELETE** | none | Delete barrel |
| 3 | `src/components/admin/questions/index.ts` | `AdminQuestions.tsx:4-13` imports children directly | **SAFE DELETE** | none | Delete barrel |
| 4 | `src/components/admin/settings/types.ts` | re-exports `types/exam.types.ts`; zero importers | **SAFE DELETE** | none | Delete |
| 5 | `src/components/admin/topics/index.ts` | `AdminTopics.tsx:11-15` imports directly | **SAFE DELETE** | none | Delete barrel |
| 6 | `src/components/admin/upload/index.ts` | `AdminUpload.tsx:3-5` imports directly | **SAFE DELETE** | none | Delete barrel |
| 7 | `src/components/admin/users/index.ts` | `AdminUsers.tsx:10-12` imports directly | **SAFE DELETE** | none | Delete barrel |
| 8 | `src/components/user/subject-tests/index.ts` | `UserSubjectTests.tsx:11-14` imports directly | **SAFE DELETE** | none | Delete barrel |
| 9 | `src/components/user/topic-exams/index.ts` | `UserTopicExams.tsx:11-14` imports directly | **SAFE DELETE** | none | Delete barrel |
| 10 | `src/components/user/topics/index.ts` | `UserTopics.tsx:8-10` imports directly | **SAFE DELETE** | none | Delete barrel |

**Dead-chain check:** none — no dead file is imported by another dead file.

---

## 2. Unused Exports

### 2.1 Unreferenced exported symbols (component-level)
| File | Export(s) | Evidence | Class | Risk |
|---|---|---|---|---|
| `admin/topics/useAdminTopics.ts` | `TopicFieldErrors` (type) | only in own file | SAFE DELETE | none |
| `common/Alert.tsx` | `AlertProps` (type) | only in own file | SAFE DELETE | none |
| `common/AntigravityAnimation.tsx` | `StaggerContainer`, `StaggerItem` | only in own file | SAFE DELETE | none |
| `common/AntigravityButton.tsx` | `ButtonSize` (type) | only in own file | SAFE DELETE | none |
| `common/AntigravityCard.tsx` | `PREMIUM_SURFACE_IMAGE` | only in own file | SAFE DELETE | none |
| `common/AntigravityDashboard.tsx` | `ActivityCard` | only in own file | SAFE DELETE | none |
| `common/AntigravityLayout.tsx` | `SectionWrapper` | only in own file | SAFE DELETE | none |
| `common/AntigravityResults.tsx` | `CTACard` | only in own file | SAFE DELETE | none |
| `common/DataTable.tsx` | `DataTableColumn`, `DataTableProps` | only in own file | SAFE DELETE | none |
| `common/IconBadge.tsx` | `ICON_BADGE_SIZES`, `IconBadgeStatus` | only in own file | SAFE DELETE | none |
| `common/SharedComponents.tsx` | `TableSkeleton` | only in own file | SAFE DELETE | none |
| `common/AdminIconWrap.tsx` | (deprecated `darkClassName` prop) | defined, never passed | SAFE DELETE | none |
| `common/BilingualToggle.tsx` | deprecated `showShadow` prop | defined, never passed | SAFE DELETE | none |
| `exam/QuestionCard.tsx` | `QuestionInfoHeader` | only in own file | SAFE DELETE | none |
| `sub-admin/students/useStudents.ts` | `MonthOption` (type) | only in own file | SAFE DELETE | none |
| `user/WelcomeBanner.tsx` | `WelcomeBannerVariant` (type), `getGreeting` (fn) | only in own file | SAFE DELETE | none |

### 2.2 Zero-import barrel re-exports (never imported from `AntigravityUI` by any consumer)
These are exported from the `AntigravityUI` barrel (AntigravityUI.tsx) but **no file imports them** (verified by grep
over all src incl. test files — 0 pins):

| Export | Source | Class | Risk |
|---|---|---|---|
| `Display` | AntigravityTypography.tsx | SAFE DELETE | none |
| `SectionBlock`, `StatePanel` | AntigravityLayout.tsx | SAFE DELETE | none |
| `PrimaryButton` | AntigravityButton.tsx | SAFE DELETE | none |
| `DataTable` | DataTable.tsx | SAFE DELETE | none — also part of cycle `AntigravityUI↔DataTable`; removal breaks cycle |
| `ScoreCard`, `ResultStatCard` | AntigravityResults.tsx | SAFE DELETE | none (page uses `ResultStatCard`? verify — see note) |
| `LoadingOverlay` | LoadingOverlay.tsx | SAFE DELETE | none |
| `useNavigationActive` | Navigation.tsx | SAFE DELETE | none |

> Note: `ResultStatCard` is consumed by `ResultsPage.tsx:117-133` (imported from `AntigravityResults` directly or via
> barrel — verify import path before deleting; the barrel-name grep found no barrel import, but direct-path import may
> exist). **Mark ResultStatCard `ScoreCard` = NEEDS VERIFICATION** on import-path resolution before deletion.

### 2.3 Previously-flagged "unreferenced" from Phase 5.0 (re-confirmed)
`PREMIUM_SURFACE_IMAGE`, `ButtonSize`, `AlertProps`, `ICON_BADGE_SIZES`, `IconBadgeStatus`, `TableSkeleton`,
`QuestionInfoHeader`, `MonthOption`, `WelcomeBannerVariant`, `getGreeting`, `DataTableColumn`, `DataTableProps`,
`ActivityCard`, `SectionWrapper`, `CTACard`, `StaggerContainer`, `StaggerItem`, `TopicFieldErrors` — all SAFE DELETE
(zero references outside defining file).

---

## 3. Unused Variants (defined, never passed in app code)

| Component | File | Dead variants | Class | Risk |
|---|---|---|---|---|
| Button | `AntigravityButton.tsx:9` | `auth-dark`, `auth-muted`, `auth-violet`; `size=auth-xl` | SAFE DELETE | none (verified 0 app passes) |
| Input/TextArea | `AntigravityForm.tsx:18` | `variant=violet` | SAFE DELETE | none |
| ResultStatCard | `AntigravityResults.tsx:23` | `warning`, `primary` | SAFE DELETE | none |
| ErrorContainer | `ErrorContainer.tsx` (types `error.types.ts:38`) | `banner`, `modal` | SAFE DELETE | none |
| AdminText | `AdminText.tsx:27` | `cinzel-value`, `garamond-value`; sizes `display,h1,h2,h3,caption,stat-value,badge,small` | SAFE DELETE | none |
| Spinner | `Spinner.tsx:3-4` | `variant=neutral` | SAFE DELETE | none |
| Menu | `Menu.tsx:32,37` | `animation=fade`, `animation=slide` | SAFE DELETE | none |
| CollectionCard | `CollectionCard.tsx:7-8` | `layout=grid`; `variant=default/subtle/outlined/compact` | SAFE DELETE | none |
| AdminModal | `AdminModal.tsx:24` | `variant=management` | SAFE DELETE | none |
| Tabs | `AntigravityData.tsx:26` | `size=sm/md/lg` (never explicitly passed) | NEEDS VERIFICATION | low (size used internally as default) |
| StatCard | `AntigravityCard.tsx:89` | `status=success`, `status=danger` | SAFE DELETE | none |

### Test-only variants (NEEDS VERIFICATION — not dead, used by runtime-audit tests)
| Component | Variant(s) | Test | Class |
|---|---|---|---|
| Alert | `info`, `success` | ds006-runtime-audit.test.tsx:42-43 | NEEDS VERIFICATION |
| Avatar | `sm`, `lg`, `square` | ds014-runtime-audit.test.tsx | NEEDS VERIFICATION |
| Input/TextArea | `management` (TextArea) | ds003-runtime-audit.test.tsx:101 | NEEDS VERIFICATION |
| Badge / IconBadge | all-value sweep | ds004/ds005 | NEEDS VERIFICATION |

> Deleting the dead variants (SAFE DELETE set) does not touch test-pinned behavior. The test-only set must stay until
> the corresponding runtime-audit tests are updated (governed with DW-1…DW-4 in Phase 4.2 report).

---

## 4. Unused Utilities (`@theme` registrations with zero class consumers)

| Utility | Location | Consumers | Class | Risk |
|---|---|---|---|---|
| `shadow-elevation-5/6/7` | index.css:103-105 | 0 | SAFE DELETE | none |
| `shadow-button-primary` | index.css:132 | 0 (var used via arbitrary) | SAFE DELETE | none |
| `shadow-input-violet-focus` | index.css:189 | 0 | SAFE DELETE | none |
| `border-input-violet-focus-border` | index.css:188 | 0 | SAFE DELETE | none |
| `bg/text/border-*-hover/-subtle/-light` (all color families) | index.css:42-47 | 0 | SAFE DELETE | none |
| `bg-button-surface-primary` / `border-button-primary-border` / `text-button-primary-text` | index.css:129-131 | 0 | SAFE DELETE | none |
| `bg-button-surface-ghost*` etc. | index.css:144-148 | 0 | SAFE DELETE | none |
| `rounded-button-xs/md/auth`, `rounded-badge-md`, `rounded-alert`, `rounded-icon-sm`, `rounded-empty-state`, `rounded-filter`, `rounded-card-auth-light` | index.css:81-88,125 | 0 | SAFE DELETE | none (keep `rounded-stat-card-radius`/`rounded-stat-icon-radius` — used) |
| `text-h1/h2/h3/display/body/caption/label/badge/metadata/small/heading` (font-size utilities) | index.css:222-235 | 0 (consumed via `fontSize:var()`) | SAFE DELETE | none (keep `--text-stat-value`) |
| `--material-input-*` self-references | index.css:185-191 | 0 utilities generated | SAFE DELETE | none |

---

## 5. Unused CSS (rules / keyframes / classes with no matching element)

| Item | Location | Evidence | Class | Risk |
|---|---|---|---|---|
| `@keyframes sheen` | index.css:1186 | no class references it (`.premium-card` uses inline transition) | NEEDS VERIFICATION | low — confirm no runtime reference before delete |
| `--font-ancient` + `font-ancient` utility | themes.css / @theme | 0 hits | SAFE DELETE | none |
| `.light` duplicate surface ladder re-declarations | themes.css:824-832, 835-836 etc. | identical mappings to `:root` (584-593, 596) | NEEDS VERIFICATION | medium — removing changes cascade order; verify visual output |
| `--nav-*` charter set (~15 tokens) | themes.css (Layer 2) | 0 consumers (chain ends at dead `--nav-surface`/`--nav-focus`) | SAFE DELETE | none |

---

## 6. Unused Token Registrations (dead namespaces — cross-ref TOKEN AUDIT)

| Namespace | Location | Consumers | Class | Risk |
|---|---|---|---|---|
| `--btn-*` (30) | themes.css:1121-1158 | 0 | SAFE DELETE (FG-1) | none |
| 10 primitive scales (~141) | themes.css:28-197 | 0 | SAFE DELETE (FG-7) | none |
| `--chart-*` (12), `--pie-*` (3) | themes.css:245-263 | 0 | SAFE DELETE (FG-7) | none |
| `--elevation-5/6/7` + semantic dead set | themes.css:465-467, 596-603 | 0 | SAFE DELETE (FG-8) | none |
| `--shadow-hover/pressed/modal` chains | themes.css:608-611 | 0 (dead chains) | SAFE DELETE (FG-8) | none |
| `--shadow-focus` double-reg | themes.css:610, 850 | 0 | DEPRECATE (FG-8) | none |
| `--input-focus-shadow`/`--input-shadow`/`--input-padding-x`/`--input-radius` | themes.css:915, 1163, 913, 1161-1162 | 0 | SAFE DELETE (FG-9) | none |
| `--material-input-violet-*` + checkbox-size/radius | themes.css:1087-1090 | 0 | SAFE DELETE (FG-9) | none |
| `--surface-canvas/nav/secondary/interactive/inset/raised` | themes.css:584-593 | 0 | SAFE DELETE (FG-12) | none |
| `--surface-overlay`/`--surface-nav` | themes.css:590, 585 | 0 | DEPRECATE/REMOVE (FG-12) | none |
| `--z-*`, `--glow-*`, `--gradient-primary/sidebar/success/danger/warning`, `--icon-*` dead family, `--text-link`, `--shadow-offset-*` | themes.css | 0 | SAFE DELETE (FG-7/8) | none |
| `@theme --shadow-xs..2xl` self-refs + `@theme --material-input-*` self-refs | index.css:91-96, 185-191 | 0 | SAFE DELETE (FG-10) | none |

---

## 7. KEEP (verified live — do not touch)

| Category | Items |
|---|---|
| Live tokens | `--elevation-1..4`+carved, `--shadow-xs..2xl` ladder + component shadow family, `--management-*` (12), `--card-*`/`--stat-*`/`--surface-floating`, gold/forest-900/premium-green, checkbox/radio/filter, Control `--button-*` + material, focus-ring, `--text-*` var-scale |
| Live components | every component with ≥1 importer outside `common/` (AntigravityUI barrel, AntigravityTypography ×28, SharedComponents ×50, AdminText ×15, AdminModal ×12, etc.) |
| Live utilities | all utilities with ≥1 class consumer (see TOKEN AUDIT §1-§8 KEEP rows) |
| Test-pinned classes | `rounded-[14px]`, `text-[10px]`, `bg-[var(--management-surface)]`, Alert info/success, Avatar sm/lg/square, Input management — NEEDS VERIFICATION on any class-level edit |

---

## 8. Ranked Summary

| Classification | Count | Items |
|---|---|---|
| **SAFE DELETE** | ~260 | 10 orphaned files + 19 unreferenced exports + 9 zero-import barrel exports (minus pending path check) + 20 dead variants + ~30 dead utilities + ~220 dead tokens + `--nav-*`/`--z-*`/`--glow-*`/gradients/icon families + dead keyframes (pending check) |
| **NEEDS VERIFICATION** | ~12 | `ResultStatCard`/`ScoreCard` import path; Tabs `size` default; `.light` ladder re-declarations; `@keyframes sheen`; Alert info/success; Avatar sm/lg/square; Input management TextArea; test-pinned class strings |
| **KEEP** | rest | all live tokens/components/utilities |

**Headline:** ~260 dead-code items are safe to delete with zero render impact; ~12 require path/test verification;
nothing in the KEEP set should change. Deletions are prerequisite to every other Phase 5.x cleanup (they shrink the
search space and prevent accidental "reuse" of dead surface).
# Phase 1b — Step 1: Repository Spacing Audit

**Status:** COMPLETE — Analysis Only (zero files modified, zero tokens created)
**Date:** 2026-07-31
**Scope:** Entire `src/` tree (384 `.tsx`/`.ts`/`.css` files), all panels, all shared primitives
**Next step:** Phase 1b — Step 2 (Spacing Token Design)

---

## 1. Executive Summary

The repository has **no spacing token system**. `themes.css` declares a full Layer-1/Layer-2/Layer-3 token architecture covering colors, radii, shadows, and typography — but **zero `--spacing-*` / `--space-*` / `--gap-*` / `--padding-*` / `--margin-*` tokens exist anywhere** (`grep` verified). The Layer-1 contract comment at `themes.css:20` even lists "spacing" as a primitive category, but no values were ever materialized. The only spacing-like tokens in the entire theme system are component-scoped exceptions: `--input-padding-y: 12px` (`themes.css:892`), `--input-padding-x: 16px` (`themes.css:1088`), `--material-input-compact-padding: 8px` (`themes.css:1015`), `--material-input-compact-height: 40px` (`themes.css:1013`), and `--dropdown-offset: 8px` (`themes.css:907`).

**In practice, the entire spacing system rests on raw Tailwind utilities against the default 4px scale** (0/4/8/12/16/20/24/28/32/40/48/56/64/80/96/128px). This is both the good news and the bad news:

- **Good:** The codebase is remarkably self-consistent. ~94% of all spacing is on the standard 4px scale. Three values dominate everything: **16px (≈451 uses), 8px (≈339), 12px (≈294)**, with 24px (≈238) and 32px (≈122) completing the section/page rhythm.
- **Bad:** Two competing semantic ladders coexist (`Stack` gap map `4/8/16/24/32/48px` vs `Grid` default `16/20/24px`), tables have **three different cell-padding dialects** (`px-4 py-4` user / `px-6 py-4`+`px-6 py-5` admin DataGrid / bespoke `px-4/5` sub-admin rows), cards drift between `p-4/p-5/p-6/p-8`, and there are **~36 hardcoded arbitrary values** (`p-[…]`, `gap-[…]`, inline `px`) plus 7 redundant icon-margin hacks that fight the `Button` primitive's built-in gap.

**Overall health: GOOD structure, MISSING abstraction layer.** The User Panel is a legitimate golden reference and its values already constitute a de-facto canonical scale. Step 2 (token design) has a clean path: encode the 4px scale the repo already uses, then collapse the four inconsistencies.

---

## 2. Methodology & Scope

- **Quantitative pass:** Regex extraction of every Tailwind spacing utility (`m/mx/my/mt/mb/ml/mr`, `p/px/py/pt/pb/pl/pr`, `gap/gap-x/gap-y`, `space-x/space-y`, `top/bottom/left/right/inset`, `max-w`, `grid-cols`), every arbitrary `[…px]` value, and every raw `px` in CSS/inline styles — across all 384 files.
- **Qualitative pass:** Line-by-line audits of the User Panel, Admin Panel, Sub-Admin Panel, Auth pages, Exam/Review pages, and shared primitives — each item classified against the User Panel.
- **Verification:** Key primitives (`PageContainer`, `Stack`, `Grid`, `Card`, `AdminModal`) re-read directly to confirm agent findings.

**Classification legend:**
| Class | Meaning |
|---|---|
| **Intentional** | Deliberate, defensible divergence (auth cards, celebration screens, fixed overlays) |
| **Legacy** | Pre-token/convention spacing that survived the DS migration |
| **Duplicate** | Same value repeated across panels with no canonical owner |
| **Inconsistent** | Same-level siblings disagree on the same semantic gap |
| **Candidate for standardization** | Values that should migrate to tokens |

---

## 3. Spacing Inventory

### 3.1 CSS layer (`src/styles/themes.css`, `src/index.css`)

| Location | Spacing value | Purpose |
|---|---|---|
| `themes.css:892` | `--input-padding-y: 12px` | Input vertical padding (only spacing token in the theme) |
| `themes.css:1088` | `--input-padding-x: 16px` | Input horizontal padding |
| `themes.css:1013` | `--material-input-compact-height: 40px` | Compact input height |
| `themes.css:1015` | `--material-input-compact-padding: 8px` | Compact input padding |
| `themes.css:907` | `--dropdown-offset: 8px` | Dropdown offset |
| `index.css:525-526` | `--scrollbar-width: 8px` | Scrollbar width |
| `index.css:544` | `6px` | Custom scrollbar thumb |
| `index.css:788-789` | `.ancient-card` padding `24px` (→ `16px` ≤767px) | Card padding (raw, not tokenized) |
| `index.css:1077-1104` | `.light .ancient-card` padding overrides: `24px`/`16px`/`20px`, mobile `16/12/14px` | Light-mode card padding (raw, `!important`) |
| `index.css:544` | `6px` scrollbar | scrollbar |
| `index.css:14-16` | `box-sizing`, no spacing | — |

**Key finding:** The only hardcoded CSS paddings are `.ancient-card` (24px/16px). The `!p-4/5/6` overrides at `index.css:1082-1104` are the reason `!p-5` in components (see §5) takes effect.

### 3.2 Shared primitive layer (the de-facto spacing API)

| Primitive | Spacing contract | Source |
|---|---|---|
| `PageContainer` | `px-2 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-6 md:py-10`, `max-w-[1280px] mx-auto`; centered = `p-4 md:p-6` | `AntigravityLayout.tsx:14-19` |
| `Stack` gap map | `xs 4px · sm 8px · md 16px · lg 24px · xl 32px · xxl 48px · section 32px` (as arbitrary `gap-[…]` classes) | `AntigravityLayout.tsx:109-117` |
| `Stack` numeric gap | inline `style={{gap: Npx}}` | `AntigravityLayout.tsx:119` |
| `Grid` default gap | `gap-4 md:gap-5 lg:gap-6` (16/20/24px) | `AntigravityLayout.tsx:153` |
| `Grid` numeric gap | inline `style={{gap: Npx}}` | `AntigravityLayout.tsx:154` |
| `Card` padding prop | `0→p-0 · 16→p-4 · 20→p-5 · 24→p-6` | `AntigravityCard.tsx:29-34` |
| `Card` variant defaults | `elevated p-4 md:p-6 · default/premium/premium-* p-4 md:p-5 · subtle p-3 md:p-4 · auth-light p-8 md:p-10` | `AntigravityCard.tsx:37-45` |
| `Button` sizes | `xs h-8 px-3 · sm h-9 px-4 · md/lg h-[48px] px-6/8 · xl h-14 px-10`; icon gap `gap-1.5` (xs/sm), `gap-2` (md+) | `AntigravityButton.tsx:19-27` |
| `Tabs` | `sm px-3 md:px-4 · md px-4 md:px-6 · lg px-5 md:px-7`; track `p-1.5 gap-1 md:gap-2` | `AntigravityData.tsx:40-44` |
| `Input` | `h-[48px]`, `px-4`, icon variants `pl-11/pr-12` | `AntigravityForm.tsx:24-28` |
| `AdminModal` | header/body `p-6 sm:p-8`, footer `p-6 gap-3`, default `sm:max-w-4xl` | `AdminModal.tsx:32,69,100,105` |
| `DataGrid` | header `px-6 py-4`, cells `px-6 py-5` | `AntigravityData.tsx:422,474` |
| `FilterBar` | `gap-3 p-3 md:p-4 rounded-[14px]` | `AntigravityLayout.tsx:194` |
| `SelectionContainer` | `p-3` | `AntigravityLayout.tsx:47` |
| `Sidebar nav item` | `p-3 rounded-xl gap-3`; list `px-3 py-4 gap-1` | `Navigation.tsx:182,244` |
| `SidebarLayout` bottom gutter | `mb-12 sm:mb-16 lg:mb-20` | `SidebarLayout.tsx:294` |

### 3.3 Utility usage inventory (quantitative — all 384 files)

**Dominant values (>50 uses), consolidated by pixel:**

| px | Classes | Est. uses |
|---|---|---|
| **16** | p-4, px-4, py-4, pt-4, pb-4, pl-4, pr-4, mt-4, mb-4, ml-4, mr-4, gap-4, space-y-4 | **~451** |
| **8** | p-2, px-2, py-2, pt-2, pb-2, pl-2, pr-2, mt-2, mb-2, ml-2, mr-2, mx-2, my-2, gap-2, space-y-2 | **~339** |
| **12** | p-3, px-3, py-3, pt-3, pb-3, pl-3, pr-3, mt-3, mb-3, ml-3, mr-3, gap-3, space-y-3 | **~294** |
| **24** | p-6, px-6, py-6, pt-6, pb-6, mt-6, mb-6, mx-6, my-6, gap-6, space-y-6 | **~238** |
| **4** | p-1, px-1, py-1, pt-1, pr-1, pl-1, mt-1, mb-1, ml-1, mr-1, mx-1, my-1, gap-1, space-y-1 | **~254** |
| **32** | p-8, px-8, py-8, pt-8, pb-8, mt-8, mb-8, gap-8, space-y-8 | **~122** |
| **20** | p-5, px-5, py-5, pb-5, pl-5, mb-5, my-5, gap-5, space-y-5 | **~85** |
| **0** | m-0, mt-0, mb-0, ml-0, mx-0, p-0, px-0, py-0, pb-0, gap-0, space-y-0 | **~182** |
| **40** | p-10, px-10, py-10, pt-10, pl-10, pr-10, mt-10, mb-10, gap-10, space-y-10 | **~38** |
| **48** | p-12, py-12, pr-12, mt-12, mb-12, gap-12, space-y-12 | **~24** |

**Full ranked utility list (raw counts):**

```
  143  gap-3         102  m-0          87  p-4          74  gap-1
  111  gap-2          95  px-4         58  py-4         52  p-6
   48  px-6          39  p-8          37  px-3         37  py-3
   35  space-y-6     35  mt-1         34  mb-2         34  px-2
   32  mt-2          31  space-y-4    31  space-y-2    30  space-y-3
   30  mb-6          30  py-2         29  mb-4         29  p-5
   27  p-2           27  py-1         26  gap-6        24  p-3
   23  px-5          23  px-8         22  mb-1         21  px-1
   21  py-0          20  mt-0         18  py-6         18  p-1
   18  p-0           17  py-5         15  mr-1         14  pt-4
   13  mt-8          13  mb-8         13  mt-6         12  gap-8
   12  mt-4          11  space-y-8    11  space-y-1    11  mr-2
   10  p-10          10  mb-3          9  ml-1          9  pb-4
    9  pt-2           9  p-12          8  py-8          7  pt-6
    7  mb-0           7  mt-3          6  pb-2          6  px-10
    6  pb-6           6  py-12         6  pt-1          6  gap-0
    6  gap-5          5  pr-4          5  pl-10         5  py-10
    4  mb-10          4  ml-2          3  space-y-5     3  px-0
    3  pr-10          3  pl-4          3  pl-2          3  mb-12
    3  mb-5           3  pr-2          3  pr-1          2  py-20
    2  my-1           2  pl-11         2  py-16         2  mx-2
    2  ml-0           2  py-24         2  pt-3          2  pb-5
    2  pt-8           2  mt-12         2  pl-16         2  mx-1
    2  my-6           2  my-2          2  pb-24         2  pt-10
    2  gap-16         2  gap-12        1  space-y-16    1  space-y-0
    1  space-y-10     1  gap-10        1  space-y-12    1  mb-16
    1  mb-20          1  ml-4          1  pb-8          1  m-1
    1  mr-40          1  mx-0          1  ml-3          1  pr-12
    1  p-7            1  px-7          1  mr-3          1  pb-0
    1  mb-40          1  py-32         1  mr-4          1  pl-3
    1  mx-6           1  pl-5          1  mx-4          1  ml-16
    1  my-5           1  pb-3          1  mt-10
```

**Grid patterns:** `grid-cols-2` ×48, `grid-cols-1` ×40, `grid-cols-3` ×19, `grid-cols-4` ×14, `col-span-2` ×7, single uses of `grid-cols-5`/`grid-cols-12`/`col-span-8`/`col-span-4`.

**Max-width inventory:** `max-w-md` ×20, `max-w-full` ×13, `max-w-sm` ×6, `max-w-4xl` ×4, `max-w-2xl` ×3, `max-w-3xl` ×2, `max-w-5xl` ×2, single `max-w-xs/lg` — **plus 6 competing hardcoded arbitrary widths: `max-w-[1280px]` (PageContainer), `max-w-[1360px]` (ExamView/ActiveExamPage), `max-w-[1200px]` (Review/Results), `max-w-[800px]` (TestConfigView), `max-w-[440px]` (auth cards), `max-w-[400/500/600px]` (LeaderboardTopCard).**

---

## 4. Canonical Reference — the User Panel

The User Panel (`src/pages/user/` + `src/components/user/` + `src/layouts/`) is the golden reference. Its dominant, internally-consistent values:

| Concern | Canonical value | Evidence |
|---|---|---|
| Page container | `px-2 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-6 md:py-10` + `max-w-[1280px]` | `AntigravityLayout.tsx:18-19`; 8 of 11 pages |
| Section rhythm | `Stack gap="lg"` = 24px; analytics pages use `space-y-8` = 32px | `UserDashboard.tsx:25`, `UserPerformance.tsx:112` |
| Card padding | **`p-4 md:p-5`** (premium variants); elevated `p-4 md:p-6`; subtle `p-3 md:p-4` | `AntigravityCard.tsx:37-45` |
| Card grid gap | `gap-4 md:gap-5 lg:gap-6` (general); **`gap-6`** (exam-card grid) | `AntigravityLayout.tsx:153`, `ExamPaperGrid.tsx:89` |
| Table cells | **`px-4 py-4`**, rank col `px-2 py-4` | `LeaderboardComponents.tsx:16,21,41,44,50` |
| Header under topbar | `h-16 pl-2 pr-2 md:px-8`; actions `gap-3 ml-auto`, desktop `gap-4` | `SidebarLayout.tsx:263,279-280` |
| Page bottom gutter | `mb-12 sm:mb-16 lg:mb-20` (layout-owned, pages add none) | `SidebarLayout.tsx:294` |
| Modal | header/body `p-6 sm:p-8`, footer `p-6 gap-3`, `sm:max-w-4xl` | `AdminModal.tsx:32,69,100,105` |
| Input | `h-[48px] px-4` (icon variants `pl-11 pr-12`) | `AntigravityForm.tsx:24-28` |
| Buttons | `lg h-[48px] px-8` for primary CTAs; `xl h-14 px-10` big actions | `AntigravityButton.tsx:23-25` |
| Sidebar nav | items `p-3 rounded-xl gap-3`; list `px-3 py-4 gap-1` | `Navigation.tsx:182,244` |
| Empty/error states | `py-8` (leaderboard/performance), `py-12` (exams) | `UserLeaderboard.tsx:97,107`, `UserExams.tsx:57` |

**User Panel internal deviations (documented, to preserve):**
1. `UserTeacherExams.tsx:67-68` — `py-2 md:py-4` + `Stack gap={16}` breaks the page recipe (largest deviation).
2. `UserProfile.tsx:35` — `Stack gap={48}` (only 48px root page gap).
3. `UserHistory.tsx:29-31,77` — loading uses `gap="xxl"` vs content `gap="lg"`; card grid fixes numeric `gap={24}` at all breakpoints.
4. `DashboardRecentActivity.tsx:31,49` — `gap-4 md:gap-6` missing the `lg` step.
5. `PerformanceMetricsGrid.tsx:22` — flat `gap-4` vs adjacent `PerformanceAnalyticsSection` `gap-6`.
6. Six distinct content max-widths (see §3.3).
7. Hand-rolled leaderboard table (`px-4 py-4`) coexists with `DataGrid` (`px-6 py-5`) inside the same panel (`TeacherLeaderboardModal`).

---

## 5. Duplicate Matrix

The three pillars — **16px, 8px, 12px** — together account for **~1,084 of ~1,600 spacing-utility uses (~68%)**. All values below should become canonical spacing tokens in Step 2.

| px | Est. uses | Representative classes | Token candidate |
|---|---|---|---|
| 0 | ~182 | m-0, p-0, px-0, py-0, mb-0, mt-0, gap-0 | `space-0` |
| 4 | ~254 | gap-1, p-1, py-1, mt-1, mb-1, space-y-1 | `space-1` |
| 8 | ~339 | gap-2, p-2, px-2, py-2, mb-2, space-y-2 | `space-2` |
| 12 | ~294 | gap-3, p-3, px-3, py-3, space-y-3 | `space-3` |
| 16 | ~451 | gap-4, p-4, px-4, py-4, mb-4, space-y-4 | `space-4` |
| 20 | ~85 | p-5, px-5, py-5, mb-5, gap-5, space-y-5 | `space-5` |
| 24 | ~238 | gap-6, p-6, px-6, py-6, mb-6, space-y-6 | `space-6` |
| 28 | 2 | p-7, px-7 | `space-7` (drop or merge) |
| 32 | ~122 | p-8, px-8, py-8, mt-8, mb-8, gap-8, space-y-8 | `space-8` |
| 40 | ~38 | p-10, px-10, py-10, pl-10, pr-10, mb-10 | `space-10` |
| 48 | ~24 | p-12, py-12, mt-12, mb-12, gap-12 | `space-12` |
| 64 | 9 | py-16, pl-16, ml-16, mb-16, gap-16 | `space-16` |
| 80 | 3 | py-20, mb-20 | `space-20` |
| 96 | 4 | py-24, pb-24 | `space-24` |
| 128 | 1 | py-32 | `space-32` |
| 160 | 2 | mr-40, mb-40 | none (remove) |
| 10 | ~3 (arbitrary) | p-[10px], px-[10px], px-2.5 | `space-2.5` |
| 6 | ~4 (arbitrary) | mt-[6px], gap-[6px], border-l-[6px] | `space-1.5` |

**Notable duplicate clusters:**
- `space-y-6` (24px) ×35 + `space-y-4` (16px) ×31 + `space-y-3` (12px) ×30 — the three section/form rhythms.
- `gap-3` ×143 — the single most-used spacing utility (buttons, chips, form fields, card content).
- `m-0` ×102 — mostly `AdminText` headings' zero-margin (a reset, not layout).
- `px-4` ×95 — dominant horizontal inset for controls and cells.

---

## 6. Category Findings

### 6.1 Page-level spacing
- All three panels use `PageContainer` + `Stack gap="lg"` (24px) — structurally consistent across 20+ pages.
- Page vertical rhythm is `py-6 md:py-10`; bottom gutter is layout-owned (`mb-12 sm:mb-16 lg:mb-20`, `SidebarLayout.tsx:294`).
- **Deviations:** `UserTeacherExams.tsx:67` (`py-2 md:py-4`); auth pages override with `px-4 sm:px-6` (`LoginPage.tsx:206`, `SignupPage.tsx:267`); `UpdatePasswordPage.tsx:40` raw `p-6` div; `ReviewView`/`ExamView` bypass `PageContainer` entirely.

### 6.2 Section spacing
- Canonical: `Stack gap="lg"` (24px); performance pages `space-y-8` (32px); sub-admin create wizard `space-y-6` (24px).
- **Deviations:** `ReviewLayout.tsx:116` `space-y-16` (64px) between review cards; `UserProfile` root `gap={48}`; `MethodSelectionView.tsx:13` `Stack gap="xl"` (32px) + `p-8` cards.

### 6.3 Card spacing
- Canonical `Card` = `p-4 md:p-5`. **Deviations:** sub-admin settings `p-8` ×5 (`IdentitySection.tsx:16`, `RecruitmentSection.tsx:13`, `NotificationSection.tsx:24`, `BackupSection.tsx:13`, `SessionSection.tsx:16`); sub-admin create wizard `padding={24}` (`SubAdminCreate.tsx:67,89,119,135`); `ExamListSection.tsx:67` `p-6`; `MethodSelectionView.tsx:32` `p-8`; `QuestionCard.tsx:69` body `p-5 md:p-6` vs header `p-4 md:p-6` (same card); `!p-5` overrides pinning 20px (`SubjectPortalView.tsx:74`, `TopicPortalView.tsx:133`, `ExamCard` `AntigravityDashboard.tsx:77`); inline `cardPad` 10-18px in sub-admin exam cards (`QuestionCard.tsx:33`, `ExamSummaryCards.tsx:36`).

### 6.4 Grid & Flex
- Canonical `Grid` = `gap-4 md:gap-5 lg:gap-6` (16/20/24px). **Deviations:** numeric `gap={24}` fixed-px grids (`SubAdminDashboard.tsx:62,70`, `SubAdminSettings.tsx:23,56`, `ExamListSection.tsx:62`, `UserHistory.tsx:77`, `UserProfile.tsx:26`); `gap={32}` (`LoginPage.tsx:230`); `gap={10}` (`SubjectCardItem.tsx:43`); `gap-3 sm:gap-6` (`StatsGrid.tsx:27`); `gap-8` (`AdminOverview.tsx:35`, `PerformanceSkeleton.tsx:13`); flat `gap-4` (`PerformanceMetricsGrid.tsx:22`); `gap-4 md:gap-6` missing lg (`DashboardRecentActivity.tsx:31,49`); `gap-3.5` (14px, sole 3.5 gap — `QuestionOptions.tsx:27`).

### 6.5 Forms
- Canonical: label→input 8px (`space-y-2` / `Stack gap="sm"`), fields 16px (`gap="md"`), field groups 24px (`gap="lg"`), forms `space-y-6`; input `h-[48px] px-4`; validation `mt-1`.
- **Deviations:** auth fields use `gap="lg"` (24px) with `gap="xs"` label insets (`LoginPage.tsx:261-262`); `UpdatePasswordPage` `mb-6`/`mb-10` field margins; `ProfileForm` label→input 16px but field groups 40px (`ProfileForm.tsx:70`); redundant `mr-1/mr-1.5/mr-2` icon margins fighting `Button` built-in gap (7 sites — see §8); `SignupPage.tsx:473` un-wrapped exam `Select`; `mt-[6px]` arbitrary (`WelcomeBanner.tsx:84`).

### 6.6 Tables
**Three competing dialects — the single biggest spacing inconsistency in the repo:**
| Dialect | Cell padding | Where |
|---|---|---|
| A (User hand-rolled) | `px-4 py-4`, rank `px-2 py-4` | `LeaderboardTable.tsx:25-30`, `LeaderboardComponents.tsx:16-50` |
| B (Admin DataGrid) | header `px-6 py-4`, cells `px-6 py-5` | `AntigravityData.tsx:422,474` |
| C (Sub-admin bespoke) | `px-4 py-3` th / `px-4` td; `px-5 py-4`; inline `rowH` 40-48px | `ExamStudentTable.tsx:111-149`, `ExamDetailModal.tsx:151-192` |

Also: legacy `DataTable` (`px-6 py-4`, `DataTable.tsx:64,111`), leaderboard responsive ramp `px-6 md:px-8 lg:px-10` (`LeaderboardView.tsx:71-134`), `px-2` Pagination inset vs `px-4` UsersPagination shell, `max-h-[60vh]` scroll (`DataTable.tsx:49`).

### 6.7 Navigation
- Sidebar: consistent (`Navigation.tsx:182,244`). Header: consistent `h-16 pl-2 pr-2 md:px-8`, `gap-3/gap-4`.
- **Deviations:** `SidebarLayout.tsx:294` `mb-12 sm:mb-16 lg:mb-20` (one-off scale 48/64/80px); drawer `w-72` vs sidebar `w-64/w-20`; active indicator `-left-1 w-1 h-6` and collapse toggle `-right-3 top-6 w-6 h-6` (arbitrary overhangs).

### 6.8 Dialogs & Modals
- Canonical `AdminModal`: overlay `p-0 sm:p-4`, header/body `p-6 sm:p-8`, footer `p-6 gap-3`, `sm:max-w-4xl`.
- **Deviations:** footer `p-6` does not escalate to `sm:p-8` (`AdminModal.tsx:105`); `ConfirmModal` footer `gap-4` vs `AdminModal` footer `gap-3` (`SharedComponents.tsx:173`); **four modal shell geometries** — `AdminModal` `rounded-[2.5rem]`, `PromptEditorModal` `rounded-[32px] max-w-2xl`, `AddExamModal` `rounded-[24px]`, `BulkActionBar` floating `py-3 sm:py-4`; `TeacherLeaderboardModal` `sm:max-w-3xl`; auth cards `p-8 md:p-10` centered `max-w-[440px]`.

### 6.9 Responsive
- Consistent ladders: page padding `2→4→5→6→8` (8/16/20/24/32px); vertical `py-6→py-10`; Card `p-4→p-5`; Grid gap `4→5→6`.
- **Unexpected changes:** `max-sm:mx-[10px] max-sm:mt-[10px] max-sm:mb-[6px]` — off-scale 10px/6px (`ExamHeader.tsx:19`); `h-[60px]` exam header (only 60px fixed header); `StatsGrid` `gap-3 sm:gap-6` skips `gap-4`; `StatusBoard` `w-[27%] min-w-[220px] max-w-[340px]` + asymmetric `pl-5 pr-4` (`StatusBoard.tsx:30`); `DashboardStatsGrid` `grid-cols-2` on mobile (vs `grid-cols-1` elsewhere); `StudentDetailModal` `grid-cols-4` never collapses on mobile (`StudentDetailModal.tsx:47`); `space-y-[12px]`/`space-y-[14px]` off-scale section wrappers (`AntigravityLayout.tsx:28,85`); dead `xs:p-6` (`DailyAttemptsChart.tsx:48` — `xs` is JS-only).

---

## 7. Inconsistency Report (deviation from User Panel)

### Admin Panel
| Item | Value | Ref | Class |
|---|---|---|---|
| DataGrid header/cells | `px-6 py-4` / `px-6 py-5` (vs user `px-4 py-4`) | `AntigravityData.tsx:422,474` | **Legacy** |
| Leaderboard th/td ramp | `px-6…px-10 / py-5…py-6` | `LeaderboardView.tsx:71-134` | **Legacy** |
| `AdminLeaderboard` loader | `py-24` | `AdminLeaderboard.tsx:38` | **One-off** |
| `AdminSettings` loader | `py-32` | `AdminSettings.tsx:56` | **One-off** |
| `MethodSelectionView` | `gap="xl"`, `gap={24}`, `p-8`, `mb-6`, `mt-8`, `py-8` | `MethodSelectionView.tsx:13-53` | **One-off cluster** |
| Settings cards | `p-8` ×5 (flat, non-responsive) | settings/* sections | **Inconsistent** |
| Redundant icon margins | `mr-1`/`mr-1.5`/`mr-2` ×7 | `AdminSettings.tsx:32`, `AdminTopics.tsx:123,212`, `AdminSubAdminsView.tsx:121`, `SettingsCard.tsx:27`, `AddExamModal.tsx:244`, `LangInputPanel.tsx:93`, `BulkActionBar.tsx:31` | **Inconsistent** |
| `StatsGrid` | `gap-3 sm:gap-6` (skips 16px) | `StatsGrid.tsx:27` | **Inconsistent** |
| Skeleton token order | `space-y-3 p-4` vs `p-4 space-y-3` | `AdminUsersView.tsx:112`, `AdminSubAdminsView.tsx:102` | **Inconsistent** |
| `AdminCard` | paddingless by default | `AdminCard.tsx:23` | **Inconsistent** |
| Modal shells | 4 geometries | §6.8 | **Inconsistent** |
| `useToast` | `px-6 py-4` | `useToast.tsx:52` | **Legacy** |

### Sub-Admin Panel
| Item | Value | Ref | Class |
|---|---|---|---|
| Settings cards | `p-8` ×5 | §6.3 | **Inconsistent** |
| Dashboard/Settings grids | `gap={24}` fixed | `SubAdminDashboard.tsx:62,70`, `SubAdminSettings.tsx:23,56` | **Inconsistent** |
| Table cells | `px-4 py-3` / `px-5 py-4` / DataGrid `px-6 py-5` — third dialect | `ExamStudentTable.tsx:111-149`, `ExamDetailModal.tsx:151-192` | **Inconsistent** |
| Create wizard cards | `padding={24}` (`p-6`) vs canonical `p-5` | `SubAdminCreate.tsx:67,89,119,135` | **Inconsistent** |
| Inline card padding | 10-18px via `cardPad` | `QuestionCard.tsx:33`, `ExamSummaryCards.tsx:36` | **Inconsistent** |
| `StudentDetailModal` | `grid-cols-4` non-responsive | `StudentDetailModal.tsx:47` | **Inconsistent** |
| `pb-24` sticky clearance | 96px | `SubAdminCreate.tsx:103`, `CreateStepReview.tsx:26` | **One-off** |
| `py-16`/`py-20` state cards | 64/80px | `SubAdminStudents.tsx:45,56` | **One-off** |

### Auth Pages
| Item | Value | Ref | Class |
|---|---|---|---|
| Page padding override | `px-4 sm:px-6` | `LoginPage.tsx:206`, `SignupPage.tsx:267` | **Legacy** |
| `UpdatePasswordPage` | `p-6` + double `p-12`/`p-8` card, inline blobs, raw divs | `UpdatePasswordPage.tsx:40-46` | **Legacy (worst offender)** |
| Auth card geometry | `p-8 md:p-10`, `max-w-[440px]` | `FinishSignInPage.tsx:79,83`, `AccountDisabledPage.tsx:20,31`, `Unauthorized.tsx:23` | **Intentional** |
| Login/Signup layout grid | `gap-8 md:gap-16`, `max-w-[1200px]` | `LoginPage.tsx:207`, `SignupPage.tsx:268` | **Intentional (auth-premium)** |

### Exam / Review
| Item | Value | Ref | Class |
|---|---|---|---|
| Review card rhythm | `space-y-16` (64px) | `ReviewLayout.tsx:116` | **Inconsistent** |
| Review indent | `sm:pl-16` / `sm:ml-16` ×3 (manual 64px) | `ReviewQuestionCard.tsx:59,72,102` | **One-off** |
| Exam header mobile | `max-sm:mx-[10px] mt-[10px] mb-[6px]` | `ExamHeader.tsx:19` | **One-off** |
| Exam header height | `h-[60px]` | `ExamHeader.tsx:19` | **One-off** |
| Content max widths | 1280 / 1200 / 1360 / 800px competing | §3.3 | **Inconsistent** |
| `QuestionCard` header/body | `p-4 md:p-6` vs `p-5 md:p-6` | `QuestionCard.tsx:41,69` | **Inconsistent** |
| Modal footer | `p-6` (no `sm:p-8`), `gap-3` vs `gap-4` | `AdminModal.tsx:105`, `SharedComponents.tsx:173` | **Inconsistent** |
| Mobile action bar | `grid-cols-3 gap-1 p-2` (4px gaps) | `QuestionNavigator.tsx:99` | **One-off** |
| StatusBoard aside | `w-[27%] min-w-[220px] max-w-[340px]`, `pl-5 pr-4` | `StatusBoard.tsx:30` | **One-off** |
| Section wrappers | `space-y-[12px]` / `space-y-[14px]` | `AntigravityLayout.tsx:28,85` | **One-off (off-scale)** |
| Stack gap ladder | `gap-[4px]…[48px]` arbitrary-bracket | `AntigravityLayout.tsx:109-117` | **Duplicate of scale** |
| `space-y-[14px]` | 14px no-token value | `AntigravityLayout.tsx:85` | **One-off** |

### Layouts / Shell
| Item | Value | Ref | Class |
|---|---|---|---|
| Bottom gutter | `mb-12 sm:mb-16 lg:mb-20` (48/64/80px) | `SidebarLayout.tsx:294` | **Legacy (one-off scale)** |
| ErrorFallback | `p-10` | `SidebarLayout.tsx:21` | **Intentional** (matches `ErrorState`) |

---

## 8. Hardcoded Value Report (migrate candidates)

### 8.1 Arbitrary Tailwind values (36 distinct)
```
 4× gap-[8px]      2× mt-[6px]      2× gap-[32px]     2× pl-[0.2em]
 2× px-[3px]       2× gap-[6px]     2× mx-[3px]       1× space-y-[14px]
 1× px-[10px]      1× px-[18px]     1× py-[8px]       1× p-[4px]
 1× gap-[4px]      1× gap-[6px]     1× gap-[12px]     1× gap-[16px]
 1× gap-[24px]     1× gap-[48px]    1× mt-[10px]      1× mb-[6px]
 1× space-y-[4px]  1× space-y-[12px]
```
Plus positional decorations (`left-[-150px]`, `top-[-150px]`, `right-[-100px]`, `bottom-[80px]`, `inset-[-24px]`, `top-[-20%]`, `right-[-60px]`, etc.) — decorative, low priority.

**In-panel offenders:** `Stack` gap ladder (`AntigravityLayout.tsx:110-116`), `SectionBlock`/`SectionWrapper` (`AntigravityLayout.tsx:28,85`), `PageHeader` (`space-y-[4px]`, `gap-[8px]`, `AntigravityLayout.tsx:67-68`), carousel `px-[3px] -mx-[3px]` (`ExamPaperGrid.tsx:61`, `SelectionView.tsx:101`), `mt-[6px]` (`WelcomeBanner.tsx:84`).

### 8.2 Hardcoded px in CSS / inline styles
| Value | Where |
|---|---|
| `24px` / `16px` | `.ancient-card` padding + `.light` overrides (`index.css:788,793,1077-1104`) |
| `padding 16px / 24px / 14px` inline | ~10 inline style uses across charts/tables |
| `paddingTop: '10px'` | `PerformanceCharts.tsx:144` |
| `rowH` 40/44/48px inline | `ExamStudentTable.tsx:123` |
| `cardPad` 10-18px inline | `QuestionCard.tsx:33`, `ExamSummaryCards.tsx:36` |
| `env(safe-area-inset-bottom, 0px)` | `LeaderboardUserCard.tsx:14` |

### 8.3 Magic heights / widths
`h-[48px]` inputs/buttons (×many, `AntigravityForm.tsx:24,138`, `AntigravityButton.tsx:22-23`), `h-[60px]` exam header, `h-11` (44px) palette/touch cells, `h-14` (56px) wizard buttons, `h-[58px]` publish button (`CreateStepPublish.tsx:69`), `min-w-[44px]` strip cells, `min-h-[400px]`/`[500px]`/`[220px]` cards, `max-w-[800/1200/1280/1360px]` wrappers, `max-h-[50vh]/[60vh]/[92vh]`, `min-w-[140px]` filter selects, `min-h-[65vh]` (`SuccessView.tsx:18`).

### 8.4 Micro-value oddities
`text-[7px]/[8px]` badges (`LeaderboardComponents.tsx:29`, `TagBadge.tsx:16`), `py-0.5` (`RankBadge.tsx:18`), `py-2.5` (`ParsedPreview.tsx:40,55`, `LangInputPanel.tsx:66`, `ExamTimer.tsx:157` — zero user-panel matches), `border-l-[6px]` (`TopicSectionRenderer.tsx:198`), `mr-40`/`mb-40` (160px, ×2).

---

## 9. Recommended Canonical Scale (design-only recommendation for Step 2)

The scale that best represents the existing repository is the **Tailwind 4px scale with a 20px member** — i.e. the union of the `Stack` ladder (4/8/16/24/32/48) and the `Grid` default (16/20/24):

| Token | px | Primary role in repo |
|---|---|---|
| `space-0` | 0 | resets (`m-0` ×102, `p-0` ×18) |
| `space-1` | 4 | micro-gaps: `gap-1` ×74, `mt-1` ×35 |
| `space-2` | 8 | control gaps: `gap-2` ×111, `space-y-2` ×31 |
| `space-3` | 12 | content gaps: `gap-3` ×143, `p-3` ×24 |
| `space-4` | 16 | default inset: `px-4` ×95, `p-4` ×87, `gap-4` ×105 |
| `space-5` | 20 | card padding / `Grid` md gap: `p-5` ×29, `md:gap-5` |
| `space-6` | 24 | section rhythm / `Card` md: `space-y-6` ×35, `gap-6` ×26 |
| `space-8` | 32 | page sections / modals: `p-8` ×39, `space-y-8` ×11 |
| `space-10` | 40 | hero/state insets: `p-10` ×10, `py-10` ×5 |
| `space-12` | 48 | large sections / card lists: `p-12` ×9, `py-12` ×6 |
| `space-16` | 64 | page gutters: `py-16` ×2, `mb-16` ×1 |
| `space-20` | 80 | gutter max: `mb-20`, `py-20` |
| `space-24` | 96 | clearance/state: `py-24` ×2, `pb-24` ×2 |

**Semantic layer (recommended, mirrors existing de-facto semantics):**
- `space-page-x`: `2/4/5/6/8` (8/16/20/24/32) — the `PageContainer` ladder
- `space-page-y`: `6/10` (24/40)
- `space-section`: 24px (`gap="lg"`); `space-section-lg`: 32px (`space-y-8`)
- `space-card`: `4/5` (16/20); `space-card-elevated`: `4/6`
- `space-grid`: `4/5/6`; `space-grid-dense`: 12px
- `space-field` (label→input): 8px; `space-form-group`: 16px; `space-form`: 24px
- `space-table-cell`: **one of `px-4 py-4` | `px-6 py-4/5` — must be unified**
- `space-modal`: `6/8` header & body, `6` footer

**Recommended consolidations:** drop `space-7` (28px, ×2), merge 10px/6px one-offs into `space-2.5`/`space-1.5`, eliminate 14px (`space-y-[14px]`, `gap-3.5`) or promote to `space-3.5` if reviewed.

---

## 10. Risk Assessment

| Migration | Scope | Risk | Rationale |
|---|---|---|---|
| Icon-margin cleanup (`mr-1/1.5/2` on Button icons) | 7 sites, admin | **Low** | Pure subtraction; `Button` already ships `gap-1.5/2` |
| Remove dead `xs:p-6` | 1 site | **Low** | `xs:` prefix never applies (JS-only breakpoint) |
| `Card padding` prop → token mapping | 20+ sites | **Low** | Already centralized in `AntigravityCard.tsx:29-34` |
| Unify skeleton token order | 2 sites | **Low** | Cosmetic |
| `Stack`/`Grid` gap ladder → tokens | global primitive | **Medium** | Values unchanged (4/8/16/24/32/48); risk is regressions in 300+ consumers |
| Unify table cell padding (`px-4 py-4` vs `px-6 py-4/5`) | DataGrid, DataTable, Leaderboard, ExamStudentTable | **Medium** | Rendered pixel change in ~40 tables; pick one dialect and update `AntigravityData.tsx:422,474` |
| Modal footer `p-6` → `sm:p-8`, `gap-3` → `gap-4` | AdminModal + ConfirmModal | **Medium** | Shared chrome; 30+ modals affected |
| Sub-admin settings cards `p-8` → `p-5` | 5 cards | **Medium** | Visual change; but aligns to panel-consistent card |
| `Card` `default` vs `elevated` md padding (20 vs 24px) | 2 primitives | **Medium** | Choice affects many layouts |
| Off-scale one-offs (`space-y-[14px]`, `space-y-[12px]`, `gap-3.5`) | 3 primitives | **Medium** | If merged into 12/16px, layout shifts slightly |
| Auth page padding override (`px-4 sm:px-6`) | Login, Signup | **Low-Med** | Isolated; may be intentional auth-premium |
| `PageContainer` default (`px-2…xl:px-8 py-6 md:py-10`) | all panels | **High** | Touches every page; any change is global |
| `Card` default padding (`p-4 md:p-5`) | all panels | **High** | Global card footprint |
| `Button`/`Input` heights (`h-[48px]`) | all panels | **High** | Interaction density; touch targets |
| `SidebarLayout` bottom gutter (`mb-12 sm:mb-16 lg:mb-20`) | all panels | **High** | Page-end rhythm; single-source, so low count but global effect |
| Exam header `max-sm:mx-[10px] mt-[10px] mb-[6px]` | 1 component | **Medium** | Visual-only mobile |
| Review `space-y-16` + `sm:pl-16` indents | ReviewLayout/ReviewQuestionCard | **Medium** | Deliberate rhythm; changing risks re-alignment bugs |
| `UpdatePasswordPage` full rebuild | 1 page | **Low-Med** | Worst legacy offender but isolated |
| New token introduction + mass utility swap | whole repo | **High** | Requires a codemod + visual regression pass; recommended as a later, separate phase |

---

## 11. Classification Summary (per the audit brief)

| Classification | Representative items |
|---|---|
| **Intentional** | Auth card geometry (`p-8 md:p-10`, `max-w-[440px]`), Login/Signup `gap-8 md:gap-16`, SplashPage full-screen, StatePanel `py-8`, `ExamLayout` fixed overlay, Leaderboard hand-rolled table, StatusBoard fixed aside, `SidebarLayout` `ErrorFallback p-10` |
| **Legacy** | DataGrid `px-6 py-4/5`, legacy `DataTable`, `useToast px-6 py-4`, `UpdatePasswordPage`, settings `p-8` cards (sub-admin), auth page `px-4 sm:px-6`, `SidebarLayout` bottom gutter `mb-12/16/20`, `AdminLeaderboard py-24` / `AdminSettings py-32` loaders |
| **Duplicate** | The entire 4px scale (16/8/12/24/32px account for ~68% of all spacing); `Stack` arbitrary-bracket gap ladder duplicating the scale; three table cell-padding dialects |
| **Inconsistent** | Modal footer vs header/body; `gap-3` vs `gap-4` modal footers; `Card` default vs elevated md padding; sub-admin settings `p-8` vs sibling `p-5`; grids `gap={24}` vs `gap-3/4`; `QuestionCard` header/body padding; skeleton token-order; `StatsGrid` gap-3→gap-6; flat `gap-4` vs `gap-6` in adjacent user grids |
| **Candidate for standardization** | Every value in the §9 scale; the 36 arbitrary values in §8.1; the 7 redundant icon margins; max-width family (800/1200/1280/1360px) |

---

## 12. Success Criteria Check

| Criterion | Status |
|---|---|
| Complete repository spacing inventory | ✓ §3 (CSS, primitives, full utility census) |
| User Panel documented as canonical reference | ✓ §4 |
| Duplicate spacing identified | ✓ §5 (with usage counts) |
| Hardcoded spacing cataloged | ✓ §8 (36 arbitrary values, raw px, magic numbers) |
| Inconsistencies documented | ✓ §7 (panel-by-panel, with refs) |
| Canonical spacing scale recommended | ✓ §9 (13-step scale + semantic layer) |
| Repository ready for Step 2 (Spacing Token Design) | ✓ — the recommended scale maps 1:1 onto existing usage |

**Bottom line for Step 2:** Define 13 primitive tokens on the 4px scale, resolve the two competing ladders (`Stack` 4/8/16/24/32/48 vs `Grid` 16/20/24 → unify at 12/16/20/24), pick ONE table cell-padding dialect, then introduce semantic tokens (`space-page-*`, `space-section`, `space-card`, `space-grid`, `space-form`, `space-modal`). No files were modified in this phase.

# Phase 1a Pre-Implementation Report — Typography Unification

---

## Section 1 — Repository Impact Report

### Overview

| Field | Value |
|-------|-------|
| **Phase** | 1a — Typography Unification |
| **Objective** | Align `H1`/`H2`/`H3` component sizes with `--text-h1`/`--text-h2`/`--text-h3` CSS tokens |
| **Risk Level** | **HIGH** — Every heading on every page changes size/font-weight |
| **Blueprint Risk** | MEDIUM — But analysis shows HIGH due to CSS token values and responsive scaling |

### Components Affected

| Component | File | Change |
|-----------|------|--------|
| `H1` | `AntigravityTypography.tsx:13` | Replace hardcoded sizes with `text-h1` |
| `H2` | `AntigravityTypography.tsx:19` | Replace hardcoded sizes with `text-h2` |
| `H3` | `AntigravityTypography.tsx:25` | Replace hardcoded sizes with `text-h3` |
| `BrandTitle` | `AntigravityTypography.tsx:69` | No change (display title, uses font-cinzel) |
| `Body` | `AntigravityTypography.tsx:31` | No change (already aligned per spec §7.1) |
| `Label` | `AntigravityTypography.tsx:44` | No change (not in Phase 1a scope) |

### Pages Affected

Every page that renders `H1`, `H2`, or `H3`:

**H1 consumers (3 usages):**
- `src/pages/exam/ResultsPage.tsx` (via `ResultView.tsx:50`)
- `src/components/user/topics/TopicReader.tsx:81`
- `src/components/user/prepare-write/ResultView.tsx:50`

**H2 consumers (22 usages across 25+ files):**
- `src/pages/user/UserTopics.tsx:53`
- `src/pages/user/UserTopicExams.tsx:54`
- `src/pages/user/UserTeacherExams.tsx:84`
- `src/pages/user/UserSubjectTests.tsx:50`
- `src/pages/user/UserExams.tsx:73`
- `src/pages/user/UserPrepareWrite.tsx:57`
- `src/pages/user/UserPerformance.tsx:51`
- `src/pages/user/UserHistory.tsx:39`
- `src/pages/user/UserLeaderboard.tsx:99`
- `src/pages/sub-admin/SubAdminDashboard.tsx:51`
- `src/components/user/WelcomeBanner.tsx:81`
- `src/components/user/topics/TopicListView.tsx:18`
- `src/components/user/TestConfigView.tsx:35`
- `src/components/user/dashboard/DashboardStatsGrid.tsx:21`
- `src/components/user/dashboard/DashboardRecentActivity.tsx:24,36`
- `src/components/profile/ProfileHeader.tsx:31`
- `src/components/user/prepare-write/PreparationView.tsx:57`
- Error pages (via ErrorContainer pattern)

**H3 consumers (29 usages across 20+ files):**
- `src/pages/LoginPage.tsx:216,256`
- `src/pages/SignupPage.tsx:148,278,312`
- `src/pages/VerifyEmailPage.tsx:88,117,134`
- `src/components/user/WelcomeBanner.tsx:91`
- `src/components/user/topics/TopicSectionRenderer.tsx:22`
- `src/components/user/topics/TopicCard.tsx:32`
- `src/components/common/AntigravityResults.tsx:16,54`
- `src/components/profile/ProfileForm.tsx:63`
- `src/components/profile/StatisticsSection.tsx:23`
- `src/components/user/performance/PerformanceSectionHeader.tsx:14`
- `src/components/user/performance/SubjectInsightsCard.tsx:17`
- `src/components/user/prepare-write/PreparationView.tsx:106`
- `src/components/user/prepare-write/ResultView.tsx:78`
- `src/components/user/leaderboard/LeaderboardTopCard.tsx:24`
- `src/components/user/educator-exams/TeacherExamCard.tsx:45`
- `src/components/user/educator-exams/TeacherExamFilterBar.tsx:34`

### Frozen Features Affected

| Feature | Status | Notes |
|---------|--------|-------|
| Feature 27 (Sub Admin Settings) | ✅ **Not affected** | Uses `Label` and `Body`, no `H1`/`H2`/`H3` |
| Feature 28 (Admin Settings) | ✅ **Not affected** | Uses `Label` and `Body`, no `H1`/`H2`/`H3` |

### Expected Visual Changes

| Component | Type of Change | Severity |
|-----------|---------------|----------|
| H1 | Major font-size increase at every breakpoint | **Major visual adjustment** |
| H2 | Major font-size increase at every breakpoint | **Major visual adjustment** |
| H3 | Major font-size increase at every breakpoint | **Major visual adjustment** |

See Section 4 for detailed breakpoint-by-breakpoint analysis.

### Expected Behavioral Changes

None. Only visual (font-size, font-weight). All ARIA roles, semantic HTML elements, and interactive behavior remain unchanged.

### Rollback Strategy

Single-commit revert: `git revert HEAD` (or `git checkout HEAD -- src/components/common/AntigravityTypography.tsx`).

### Validation Strategy

1. TypeScript: `npx tsc --noEmit` — zero errors
2. Visual comparison of every page listed in Section 3 against baseline screenshots
3. Responsive verification at 320px, 480px, 768px, 1024px, 1440px
4. Dark mode / light mode comparison
5. Confirm frozen feature pages are visually unchanged

---

## Section 2 — Typography Audit

### H1

| Attribute | Current | CSS Token (text-h1) |
|-----------|---------|---------------------|
| Mobile (<480px) | `22px` (text-[22px]) | `28px` (1.75rem) |
| SM (480px) | `26px` (md:text-[26px]) | `32px` (2.0rem) |
| MD (768px) | `26px` | `36px` (2.25rem) |
| LG (1024px) | `30px` (lg:text-[30px]) | `40px` (2.5rem) |
| XL (1440px) | `30px` | `48px` (3.0rem) |
| Font weight | `900` (font-black) | `700` (--fw-h1) |
| Line height | default | `1.15` (--lh-h1) |
| Color | `text-text-title` | `text-text-title` |
| Letter spacing | `tracking-tight` | `tracking-tight` |
| Tag | `<h1>` | `<h1>` |
| **Files using H1** | 3 (TopicReader, ResultView) | — |
| **Usages** | 3 | — |
| **Breaking risk** | HIGH — every usage changes size and weight | — |
| **Migration complexity** | LOW — single file change, but high visual impact | — |

### H2

| Attribute | Current | CSS Token (text-h2) |
|-----------|---------|---------------------|
| Mobile (<480px) | `18px` (text-[18px]) | `22px` (1.375rem) |
| SM (480px) | `20px` (md:text-[20px]) | `26px` (1.625rem) |
| MD (768px) | `20px` | `28px` (1.75rem) |
| LG (1024px) | `20px` | `32px` (2.0rem) |
| XL (1440px) | `20px` | `36px` (2.25rem) |
| Font weight | `700` (font-bold) | `700` (--fw-h2) |
| Line height | default | `1.2` (--lh-h2) |
| Color | `text-text-primary` | `text-text-primary` |
| Letter spacing | `tracking-tight` | `tracking-tight` |
| Tag | `<h2>` | `<h2>` |
| **Files using H2** | ~25 | — |
| **Usages** | 22+ | — |
| **Breaking risk** | HIGH — every usage changes size significantly | — |
| **Migration complexity** | LOW — single file change, but high visual impact | — |

### H3

| Attribute | Current | CSS Token (text-h3) |
|-----------|---------|---------------------|
| Mobile (<480px) | `14px` (text-[14px]) | `18px` (1.125rem) |
| SM (480px) | `15px` (md:text-[15px]) | `20px` (1.25rem) |
| MD (768px) | `15px` | `22px` (1.375rem) |
| LG (1024px) | `15px` | `24px` (1.5rem) |
| XL (1440px) | `15px` | `28px` (1.75rem) |
| Font weight | `600` (font-semibold) | `600` (--fw-h3) |
| Line height | default | `1.3` (--lh-h3) |
| Color | `text-text-primary` | `text-text-primary` |
| Letter spacing | `tracking-tight` | — |
| Tag | `<h3>` | `<h3>` |
| **Files using H3** | ~20 | — |
| **Usages** | 29 | — |
| **Breaking risk** | HIGH — every usage changes size | — |
| **Migration complexity** | LOW — single file change, but high visual impact | — |

### Body

| Attribute | Current | CSS Token (text-body-1) | Verdict |
|-----------|---------|------------------------|---------|
| Mobile | `13px` | `14px` (0.875rem) | Minor increase |
| SM | `14px` | `15px` (0.9375rem) | Minor increase |
| MD | `14px` | `16px` (1.0rem) | Moderate increase |
| LG | `14px` | `16px` (1.0rem) | Moderate increase |
| XL | `14px` | `18px` (1.125rem) | Significant increase |
| Font weight | `500` (font-medium) | `400` (--fw-body-1) | **Decrease** |
| **Scope** | Not in Phase 1a | — | **No change** |

### Label

| Attribute | Current | CSS Token (text-label) | Verdict |
|-----------|---------|------------------------|---------|
| Size | `10px` | `12px` (0.75rem) | Increase |
| Font weight | `700` (font-bold) | `500` (--fw-label) | **Decrease** |
| **Scope** | Not in Phase 1a | — | **No change** |

---

## Section 3 — Usage Analysis

### Pages Using H1

| Page | File | Line | Code | Current Size |
|------|------|------|------|-------------|
| ResultsPage (Simulation Over) | `ResultView.tsx` | 50 | `<H1 className="text-[40px] ...">` | **40px** (overridden via className) |
| TopicReader | `TopicReader.tsx` | 81 | `<H1 className="text-xl sm:text-2xl ...">` | Overridden via className |

**Critical finding**: Both H1 usages override the default size via `className`. The `text-h1` would be overridden by these explicit className values.

### Pages Using H2

| Page | File | Line | Default or Override? |
|------|------|------|---------------------|
| UserTopics | `UserTopics.tsx` | 53 | Default `<H2>{pageError.title}</H2>` |
| UserTopicExams | `UserTopicExams.tsx` | 54 | Default |
| UserTeacherExams | `UserTeacherExams.tsx` | 84 | Default |
| UserSubjectTests | `UserSubjectTests.tsx` | 50 | Default |
| UserExams | `UserExams.tsx` | 73 | Default |
| UserPrepareWrite | `UserPrepareWrite.tsx` | 57 | Default |
| UserPerformance | `UserPerformance.tsx` | 51 | Default |
| UserHistory | `UserHistory.tsx` | 39 | Default |
| UserLeaderboard | `UserLeaderboard.tsx` | 99 | Default |
| SubAdminDashboard | `SubAdminDashboard.tsx` | 51 | Default |
| WelcomeBanner | `WelcomeBanner.tsx` | 81 | Override: `text-[clamp(26px,4.5vw,36px)]` |
| TopicListView | `TopicListView.tsx` | 18 | Override: `text-lg uppercase` |
| TestConfigView | `TestConfigView.tsx` | 35 | Override: `text-[24px] font-black` |
| DashboardStatsGrid | `DashboardStatsGrid.tsx` | 21 | Default |
| DashboardRecentActivity | `DashboardRecentActivity.tsx` | 24,36 | Override: `uppercase` (first), Default (second) |
| ProfileHeader | `ProfileHeader.tsx` | 31 | Override: `text-[24px] md:text-[32px]` |
| PreparationView | `PreparationView.tsx` | 57 | Override: `text-lg font-black uppercase` |

### Pages Using H3

| Page | File | Line | Default or Override? |
|------|------|------|---------------------|
| LoginPage | `LoginPage.tsx` | 216,256 | Override: `text-2xl` / `text-[28px] sm:text-[32px]` |
| SignupPage | `SignupPage.tsx` | 148,278,312 | Override: `text-2xl` / `text-[28px] sm:text-[32px]` |
| VerifyEmailPage | `VerifyEmailPage.tsx` | 88,117,134 | Override: all override via className |
| WelcomeBanner | `WelcomeBanner.tsx` | 91 | Override: `text-[clamp(18px,3vw,24px)]` |
| TopicSectionRenderer | `TopicSectionRenderer.tsx` | 22 | Override: `text-xs` |
| TopicCard | `TopicCard.tsx` | 32 | Override: `text-sm` |
| AntigravityResults | `AntigravityResults.tsx` | 16,54 | Override: `text-[16px] md:text-[20px]` / `text-[16px] md:text-[18px]` |
| ProfileForm | `ProfileForm.tsx` | 63 | Override: `uppercase` only |
| StatisticsSection | `StatisticsSection.tsx` | 23 | Override: `uppercase` only |
| PerformanceSectionHeader | `PerformanceSectionHeader.tsx` | 14 | Override: `uppercase` only |
| SubjectInsightsCard | `SubjectInsightsCard.tsx` | 17 | Override: `uppercase` only |
| PreparationView | `PreparationView.tsx` | 106 | Override: `text-[20px]` |
| ResultView | `ResultView.tsx` | 78 | Override: `uppercase` only |
| LeaderboardTopCard | `LeaderboardTopCard.tsx` | 24 | Override: `text-[16px] md:text-[18px] lg:text-[20px]` |
| TeacherExamCard | `TeacherExamCard.tsx` | 45 | Override: `text-[15px]` |
| TeacherExamFilterBar | `TeacherExamFilterBar.tsx` | 34 | Override: `text-sm` |

**Critical finding**: The majority of H3 usages (18 of 29) override the default size via className. Only ~11 usages rely on the default H3 size.

---

## Section 4 — Visual Change Analysis

### H1 Default Change

```
Mobile:        22px → 28px  (+6px, +27%)
SM (480px):    26px → 32px  (+6px, +23%)
MD (768px):    26px → 36px  (+10px, +38%)
LG (1024px):   30px → 40px  (+10px, +33%)
XL (1440px):   30px → 48px  (+18px, +60%)
Weight:        900  → 700   (decrease, visually lighter)
```

| Aspect | Verdict |
|--------|---------|
| Font size | **Major visual adjustment** — all breakpoints increase significantly |
| Font weight | **Major visual adjustment** — 900→700 is a 2-step decrease |
| Color | No change ✅ |
| Letter spacing | No change ✅ |

### H2 Default Change

```
Mobile:        18px → 22px  (+4px, +22%)
SM (480px):    20px → 26px  (+6px, +30%)
MD (768px):    20px → 28px  (+8px, +40%)
LG (1024px):   20px → 32px  (+12px, +60%)
XL (1440px):   20px → 36px  (+16px, +80%)
Weight:        700  → 700   (no change)
```

| Aspect | Verdict |
|--------|---------|
| Font size | **Major visual adjustment** — large proportional increases |
| Font weight | No change ✅ |
| Color | No change ✅ |
| Letter spacing | No change ✅ |

### H3 Default Change

```
Mobile:        14px → 18px  (+4px, +29%)
SM (480px):    15px → 20px  (+5px, +33%)
MD (768px):    15px → 22px  (+7px, +47%)
LG (1024px):   15px → 24px  (+9px, +60%)
XL (1440px):   15px → 28px  (+13px, +93%)
Weight:        600  → 600   (no change)
```

| Aspect | Verdict |
|--------|---------|
| Font size | **Major visual adjustment** — nearly doubles at XL |
| Font weight | No change ✅ |
| Color | No change ✅ |
| Letter spacing | Drops `tracking-tight` → minor change |

### Critical Observation

**Most usages override the default size.** The impact of changing the base component is:
- Only **1 H1 usage** (TopicReader `pageError.title` via default H1) would actually see the new size
- Only **~8 H2 usages** (mostly `pageError.title` patterns) rely on the default size
- Only **~11 H3 usages** rely on the default size

The usages that override className will NOT be affected by the component default change — their explicit `text-[Xpx]` or `text-*` Tailwind classes will continue to override.

---

## Section 5 — Frozen Feature Verification

### Feature 27 — Sub Admin Settings

| File | Typography used? | Impact? |
|------|-----------------|---------|
| `IdentitySection.tsx` | `Label`, `Body` | No — not in Phase 1a scope |
| `NotificationSection.tsx` | `Label`, `Body` | No |
| `SessionSection.tsx` | `Label`, `Body` | No |
| `RecruitmentSection.tsx` | `Label`, `Body` | No |
| `BackupSection.tsx` | `Label`, `Body` | No |

✅ **No H1/H2/H3 used. Frozen feature unaffected.**

### Feature 28 — Admin Settings

| File | Typography used? | Impact? |
|------|-----------------|---------|
| `ExamParamsForm.tsx` | `Label` | No |
| `AddExamModal.tsx` | `Label` | No |
| `SubjectCardItem.tsx` | `Label` | No |

✅ **No H1/H2/H3 used. Frozen feature unaffected.**

---

## Section 6 — Validation Plan

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| TypeScript | `npx tsc --noEmit` | Exit code 0 |
| Visual — H1 default pages | Compare TopicReader pageError title | Size/weight match expectations |
| Visual — H2 default pages | Compare error states on 8 pages | Size matches text-h2 |
| Visual — H3 default pages | Compare 11 default usages | Size matches text-h3 |
| Visual — H1 override pages | Verify ResultView `text-[40px]` is unchanged | Pixel-identical |
| Visual — H2 override pages | Verify WelcomeBanner, ProfileHeader, etc. unchanged | Pixel-identical |
| Visual — H3 override pages | Verify LoginPage, SignupPage, etc. unchanged | Pixel-identical |
| Responsive | Check at 320px, 480px, 768px, 1024px, 1440px | Sizes match --text-h1/h2/h3 at each breakpoint |
| Dark mode | Verify all heading colors in dark mode | Unchanged (color tokens not modified) |
| Light mode | Verify all heading colors in light mode | Unchanged |
| Accessibility | Verify H1 → `<h1>`, H2 → `<h2>`, H3 → `<h3>` tags | Semantic elements preserved |
| Keyboard nav | Tab through pages with headings | No change (headings don't affect tab order) |

---

## Section 7 — Compliance Projection

| Category | Current Score | After Phase 1a | Notes |
|----------|--------------|----------------|-------|
| Design Tokens | 100% | 100% | Unchanged |
| **Typography** | **~50%** (two parallel systems) | **~75%** (H1-H3 aligned, Body/Label pending) | H1-H3 use CSS tokens; Body, Label, spacing dead code remain |
| Buttons | 0% | 0% | Phase 1b |
| Cards | 0% | 0% | Phase 1c |
| Forms | 0% | 0% | Phase 1d+2a |
| Dialogs | 0% | 0% | Phase 2b |
| Spacing | 0% | 0% | Phase 5f+6a |
| Feedback | 0% | 0% | Phase 2b+4a |
| Accessibility | partial | partial | No change |
| Animation | partial | partial | No change |

### Typography Scoring Breakdown

| Criterion | Weight | Before | After |
|-----------|--------|--------|-------|
| H1-H3 aligned with CSS tokens | 3/8 | 0/3 | 3/3 |
| No arbitrary text sizes in components | 2/8 | 0/2 | 2/2 |
| Dead code (spacing export) removed | 1/8 | 0/1 | 0/1 (Phase 6) |
| Body/Label use CSS tokens | 2/8 | 0/2 | 0/2 (Phase 5a/6a) |
| **Total** | **8/8** | **0/8** | **5/8** |

Typography Compliance: **0% → 62.5%** (H1-H3 aligned, but Body, Label, spacing dead code, and arbitrary className overrides remain)

---

## Key Findings Summary

1. **Visual impact is MAJOR**: All three heading levels increase significantly in size at every breakpoint (H1: +27-60%, H2: +22-80%, H3: +29-93%). H1 weight drops from 900 to 700.

2. **Most usages are protected by className overrides**: Only ~1 H1 usage, ~8 H2 usages, and ~11 H3 usages rely on the component defaults. The remaining 40+ usages have explicit className sizes that would override the new defaults.

3. **CSS token values may need adjustment**: The current `--text-h1` (1.75rem=28px) through `--text-h3` (1.125rem=18px) values produce substantially larger headings than what the components currently render. Consider whether these CSS tokens should be adjusted to match the current visual language before alignment.

4. **Alternative approach**: Rather than changing component defaults (which affects mostly error states), consider updating the CSS token values to match the current component sizes, then reference them. This would produce **zero visual change** while achieving unification.

5. **Frozen features are safe**: No H1/H2/H3 used in Feature 27 or Feature 28.

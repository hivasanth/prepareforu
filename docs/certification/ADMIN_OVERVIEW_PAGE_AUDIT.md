# Phase 3.1 — Admin Overview Page Audit (Visual-First, Component Reuse)

**Status:** ✅ **APPROVED** — audit complete; implementation may begin
**Page:** `src/pages/admin/AdminOverview.tsx`
**Date:** 2026-08-02
**Golden Visual Reference:** User Panel
**First certified consumer:** Authentication

This audit is the implementation blueprint for the Admin Overview page migration. It is
documentation/discovery only — no migration, refactor, rewrite, deletion, or optimization was
performed during the audit.

---

# Step 1 — Page Section Audit

The Admin Overview page breaks into **7 logical sections** (source: `AdminOverview.tsx` +
composed components).

| # | Section | Implementation | Location |
|---|---|---|---|
| 1 | Guard State | `GuardLoader` (auth loading) | `AdminOverview.tsx:17` |
| 2 | Page Scaffold | `PageContainer` → `Stack gap="lg"` → `H1 className="sr-only"` | `AdminOverview.tsx:20-22` |
| 3 | Selection Section | `SectionReveal` → `AdminSelectionTabs` (`SelectionContainer` + `bare` `Tabs`, `customExamTabs=EXAM_TABS`, papers/subjects hidden) | `AdminOverview.tsx:23-31` |
| 4 | Statistics Section | `StatsGrid` → `Grid cols={2} lg={4}` + 4× `StatCard status` | `src/components/admin/overview/StatsGrid.tsx:28-39` |
| 5 | Analytics / Chart Section | `SectionReveal delay={0.1}` → `Card variant="premium-neutral" padding={24} group` → `DailyAttemptsChart` | `AdminOverview.tsx:36-41` |
| 6 | Loading States | `GuardLoader`, `StatSkeleton`, `LoadingSkeleton` (Suspense fallback), `LoadingOverlay` | multiple |
| 7 | Error States | `ErrorState` (emoji ⚠️) in StatsGrid + DailyAttemptsChart | `StatsGrid.tsx:24`, `DailyAttemptsChart.tsx:66` |

**Notable:** the page title is `H1 className="sr-only"` → there is **no visible page header**; the
sidebar (`SidebarLayout` → `AdminPageTitle`) supplies navigation context. Documented as an
**Exception** (intentional, a11y-only title).

---

# Step 2 — Element Inventory

Every visible element per section (nothing skipped).

## Guard State
- Guard loader (auth-loading surface)

## Page Scaffold
- Page container (shell + padding)
- Stack (section rhythm)
- Screen-reader-only page title (`H1 sr-only`)

## Selection Section
- Section reveal wrapper (motion)
- Selection container (surface + radius + elevation)
- Tabs (primary variant, `bare`)
- Active indicator (tab underline/pill)
- Horizontal scroll container (`custom-scrollbar`) + flex centering

## Statistics Section
- Statistics region (`role="region" aria-live="polite"`)
- Grid (`cols={2} lg={4}`)
- Stat Card ×4 — icon container (PremiumIconContainer), stat value, stat label, semantic status tint (accent/secondary/info/warning)
- Loading skeleton (`StatSkeleton`)
- Error state (audited: `ErrorState`)

## Analytics / Chart Section
- Section wrapper (single-column grid)
- Chart Card (`Card premium-neutral padding={24} group`)
- Lazy Suspense fallback (`LoadingSkeleton height={300} borderRadius={16}`)
- Chart header — `PerformanceSectionHeader` (H3 + 11px subtitle)
- Time-range filter (`FilterSelect` + Calendar icon)
- Chart container (`h-[260px] lg:h-[300px]` + certified `animate-in`)
- In-flight loading (audited: `LoadingOverlay` "Syncing Data")
- Chart body (Recharts `BarChart` — zero-day bars, custom tooltip)
- Empty-chart presentation (all-zero bars rendered muted)
- Error state (audited: `ErrorState`)

---

# Step 3 — Component Mapping

| Visible Element | Current Component | Certified Component | Golden Source | Status |
|---|---|---|---|---|
| Page shell / spacing | `PageContainer` + `Stack` | `PageContainer` + `Stack` | User Panel (`UserDashboard`) | Already Canonical |
| Page title | `H1 sr-only` | `H1` (hidden) | User Panel | Exception (no visible header) |
| Auth loading | `GuardLoader` | `GuardLoader` | Shared Foundation | Already Canonical |
| Section reveal | `SectionReveal` | `SectionReveal` | User Panel | Already Canonical |
| Selection container | `SelectionContainer` | `SelectionContainer` | User Panel (`SelectionView`/`TopicPortalView`) | Already Canonical |
| Exam tabs | `Tabs bare variant="primary"` | `Tabs` | User Panel | Already Canonical |
| Stats grid | `Grid cols={2} lg={4}` | `Grid cols={2} lg={4}` | User Panel (`DashboardStatsGrid`) | Already Canonical |
| Stat cards | `StatCard status=` ×4 | `StatCard status=` | User Panel | Already Canonical |
| Stats loading | `StatSkeleton` | `StatSkeleton` | User Panel | Already Canonical |
| **Stats error** | `ErrorState` (⚠️ emoji + Try Again) | `ErrorContainer` + `RetryButton` | User Panel (`DashboardStatsGrid`) | **Needs Migration / Duplicate** |
| Chart card | `Card variant="premium-neutral" padding={24} group` | `Card` | User Panel (`PerformanceAnalyticsSection`) | Already Canonical |
| Chart lazy fallback | `Suspense` + `LoadingSkeleton` | `Suspense` + `LoadingSkeleton` | User Panel | Already Canonical |
| Chart header | `PerformanceSectionHeader` | `PerformanceSectionHeader` | User Panel | Already Canonical |
| Chart time filter | `FilterSelect` (Calendar) | `FilterSelect` | Shared Foundation (certified action slot) | Already Canonical |
| **Chart in-flight loading** | `LoadingOverlay` (spinner overlay) | `LoadingSkeleton` shimmer | User Panel (`PerformanceAnalyticsSection` Suspense fallback) | **Needs Migration / Duplicate** |
| Chart body | Recharts `BarChart` | Recharts (`PerformanceCharts`) | User Panel | Exception (chart-exempt) |
| **Chart error** | `ErrorState` | `ErrorContainer` + `RetryButton` | User Panel | **Needs Migration / Duplicate** |
| **Section wrapper** | `div.grid.grid-cols-1.gap-8` | `section.grid.gap-6` | User Panel (`PerformanceAnalyticsSection`) | **Needs Migration** (spacing token) |

---

# Step 4 — Visual Pattern Mapping

| Pattern | Built From | Used In | Golden Source | Certified Consumer | Status |
|---|---|---|---|---|---|
| Statistics Row | `Grid cols={2} lg={4}` + `StatCard status` | StatsGrid | User Panel | `DashboardStatsGrid` | Certified |
| Selection Header | `SelectionContainer` + `bare` `Tabs` | AdminSelectionTabs | User Panel | `SelectionView` / `TopicPortalView` | Certified |
| Chart Section | `Card premium-neutral p-24` + `PerformanceSectionHeader` + chart | AdminOverview → DailyAttemptsChart | User Panel | `PerformanceAnalyticsSection` | Certified |
| Loading States | `StatSkeleton` / `Suspense` + `LoadingSkeleton` | StatsGrid / chart card | User Panel | `DashboardStatsGrid` / `PerformanceAnalyticsSection` | Certified |
| Error States | `ErrorContainer` + `RetryButton` | (target for StatsGrid + chart) | User Panel | `DashboardStatsGrid` / `DashboardRecentActivity` / `UserPerformance` | Certified (target) |

**Pattern divergence found:** the Admin chart section shows errors/loading **inside the chart card**
(no golden precedent — the User Panel resolves errors at section/page level and loading via the
Suspense shimmer). Pattern must still use the certified error/loading components.

---

# Step 5 — Visual Token Audit

| Section | Components | Visual Tokens | Status |
|---|---|---|---|
| Selection | SelectionContainer + Tabs | radius, hover, spacing, elevation tokens | Canonical |
| Statistics | Grid + StatCard + StatSkeleton | spacing, typography, shadow, radius, status colors | Canonical |
| Chart | Card + PerformanceSectionHeader + chart | card, spacing, typography, radius, loading | Needs Alignment (wrapper `gap-8` → certified `gap-6`; `div` → `section`) |
| Loading | StatSkeleton / LoadingSkeleton | loading, radius | Canonical (LoadingOverlay is page-specific usage → Needs Alignment) |
| Error | ErrorState | radius, colors (emoji-based, no icon badge) | Needs Alignment (→ ErrorContainer token set) |

No page-level CSS file, inline `<style>`, or hardcoded hex/palette color contributes to the page's
appearance — all surface styling comes from certified components + Design System tokens. The only
non-token spacing value on the page is the chart wrapper `gap-8`.

---

# Step 6 — Visual Language Audit

Every attribute compared against the User Panel (golden reference).

| Attribute | Guard | Scaffold | Selection | Statistics | Chart | Notes |
|---|---|---|---|---|---|---|
| Containers | ✅ | ✅ | ✅ | ✅ | ✅ | All certified (`PageContainer`/`SelectionContainer`/`Card`) |
| Cards | ✅ | ✅ | ✅ | ✅ | ✅ | Chart card = exact `PerformanceAnalyticsSection` Card usage |
| Buttons | ✅ | ✅ | ✅ | ✅ | ❌ | Chart error used emoji + raw-styled "Try Again" (`ErrorState`) vs golden `RetryButton` |
| Typography | ✅ | ✅ | ✅ | ✅ | ✅ | `PerformanceSectionHeader`; error titles will use certified `H2`/`Body` |
| Spacing | ✅ | ✅ | ✅ | ✅ | ❌ | Chart wrapper `gap-8` vs golden `gap-6` |
| Colors | ✅ | ✅ | ✅ | ✅ | ✅ | Semantic status tokens only; Recharts chart-exempt |
| Hover | ✅ | ✅ | ✅ | ✅ | ✅ | Certified Card/StatCard/Tab hover; no custom |
| Shadows / Elevation | ✅ | ✅ | ✅ | ✅ | ✅ | Token shadows (`shadow-card-shadow`, premium) only |
| Animations | ✅ | ✅ | ✅ | ✅ | ✅ | `SectionReveal`, `animate-in fade-in slide-in-from-bottom-4` — same as golden chart area |
| Glass effects | ✅ | ✅ | ✅ | ✅ | ✅ | None page-local |
| Transitions | ✅ | ✅ | ✅ | ✅ | ✅ | Component-enforced |
| Focus | ✅ | ✅ | ✅ | ✅ | ✅ | `tabIndex={0}` figure + aria retained |
| Loading | ✅ | ✅ | ✅ | ✅ | ❌ | `LoadingOverlay` spinner vs golden `LoadingSkeleton` shimmer |
| Border radius | ✅ | ✅ | ✅ | ✅ | ✅ | Token radii (Card `rounded-2xl`, chart area, LoadingSkeleton `16`) |

**Legend:** ✅ Matches User Panel · ❌ Different (target of migration)

---

# Step 7 — Duplicate Visual Code Register

| Current Implementation | Canonical Replacement | Consumers (page) | Migration Difficulty | Removal Priority |
|---|---|---|---|---|
| `ErrorState` (emoji ⚠️, no icon badge) | `ErrorContainer` + `H2`/`Body` + `RetryButton` | StatsGrid, DailyAttemptsChart | Low (drop-in composable) | High |
| `LoadingOverlay` in-chart spinner | `LoadingSkeleton height="100%" borderRadius={16}` | DailyAttemptsChart | Low | High |
| `div.grid.grid-cols-1.gap-8` wrapper | `section.grid.gap-6` (golden rhythm) | AdminOverview | Low | Medium |
| `div.col-span-full` error wrapper | removed (ErrorContainer is self-contained) | StatsGrid | Trivial | Medium |

**Important — shared implementations retained:** `ErrorState` and `LoadingOverlay` are shared
components (`SharedComponents.tsx`, `common/LoadingOverlay.tsx`), still used by other surfaces
(`ErrorState`: Admin Users/Sub-Admins/Leaderboard, User Exams/TeacherExams, Exam, TeacherLeaderboardModal,
SelectionView; `LoadingOverlay`: exported barrel component). They are **not** deleted by this page's
migration — only the Admin Overview usages are removed. Register as dead-code candidates for the
**repository-wide** cleanup, not page-scoped.

---

# Step 8 — Dead Visual Code Candidates

After migration, the following page-local visual code becomes removable (documented only — **no
deletion**):

- `ErrorState` usage in `StatsGrid.tsx` (error branch)
- `ErrorState` usage in `DailyAttemptsChart.tsx` (error branch)
- `LoadingOverlay` usage + `message="Syncing Data"` in `DailyAttemptsChart.tsx`
- `div.col-span-full` wrapper in `StatsGrid.tsx`
- `gap-8` on the chart section wrapper (`AdminOverview.tsx`) — superseded by `gap-6`

No page-specific CSS, helper components, gradients, hardcoded shadows, radius overrides, or unused
imports exist on this page after the Module 2 component-reuse round.

---

# Step 9 — Certification Readiness

## Section Summary

| Section | Current State | Canonical Components | Migration Required | Estimated Difficulty | Priority |
|---|---|---|---|---|---|
| Guard State | Certified | GuardLoader | None | — | — |
| Page Scaffold | Certified | PageContainer, Stack | None (H1 sr-only = documented Exception) | — | — |
| Selection Section | Certified | SelectionContainer, Tabs | None | — | — |
| Statistics Section | Loading/Grid/StatCard certified; **error duplicates** | Grid, StatCard, StatSkeleton, ErrorContainer, RetryButton | ErrorState → ErrorContainer+RetryButton; drop `col-span-full` | Low | High |
| Chart Section | Card/header/filter certified; **loading+error duplicate** | Card, PerformanceSectionHeader, FilterSelect, LoadingSkeleton, ErrorContainer, RetryButton | LoadingOverlay → LoadingSkeleton; ErrorState → ErrorContainer+RetryButton; wrapper gap token | Low | High |
| Loading States | Mixed (2 languages on page) | StatSkeleton, LoadingSkeleton | Remove page LoadingOverlay usage | Low | High |
| Error States | Duplicate (ErrorState) | ErrorContainer, RetryButton | Both page usages → certified pattern | Low | High |

## Page Summary

| Metric | Count |
|---|---|
| Total Sections | 7 |
| Total Visible Elements | 24 |
| Total Visual Patterns | 5 |
| Already Canonical | 18 elements |
| Needs Migration | 4 (Stats error, Chart loading, Chart error, wrapper gap) |
| Duplicate Components | 2 page-local usages (ErrorState ×2, LoadingOverlay) |
| Duplicate Visual Patterns | 0 (patterns reused, only their error/loading primitives diverged) |
| Duplicate Visual Tokens | 1 (`gap-8` wrapper spacing) |
| Dead Visual Code Candidates | 4 page-local |
| Exceptions | 2 (`H1 sr-only`, Recharts chart-exempt) |

---

# Audit Rules Followed

- ✅ No migration, refactor, rewrite, deletion, or optimization performed.
- ✅ Every visible element answered: *"Does an identical implementation already exist in the User Panel?"*
- ✅ Golden Source restricted to User Panel / Shared Foundation / Authentication (never "Admin").
- ✅ Every duplicate has a documented canonical replacement.
- ✅ Every future migration decision for this page can be made from this document alone.

# Implementation Blueprint (approved)

Migration sequence (locked): Guard → Scaffold → Selection → Statistics → Chart → Loading → Error →
Token alignment → Cleanup, verified per section. Full plan: `ADMIN_OVERVIEW_IMPLEMENTATION_REPORT.md`.

# Sub Admin Dashboard Feature

## Purpose

Displays the Sub Admin dashboard: welcome banner, statistics grid, and recent deployments.

This is the **Golden Reference Implementation** for all dashboard-style pages in the PrepareForU repository. Future dashboards must follow this architecture unless there is a documented technical reason not to.

> Note: the former "Last Engagements" section (recent attempts list) was
> removed from the dashboard. The "Total Attempts" statistic now comes from a
> dedicated exact-count query (`countAttemptsByTeacherExamIds`), never from a
> limited list page.

## Architecture

```
SubAdminDashboard (page — composition only)
  ├── WelcomeBanner (shared, variant="educator")
  ├── StatCard ×4 (shared, from AntigravityUI)
  ├── RecentExamItem ×N (feature component)
  ├── ExamListSkeleton (feature skeleton)
  ├── EmptyState (shared, Lucide icons)
  ├── ErrorContainer + RetryButton (shared)
  └── ExamDetailModal (cross-feature, from exams barrel)

useSubAdminDashboard (hook — orchestration)
  ├── useStableFetch (stale request protection)
  ├── teacherExamService (data access)
  └── userService (data access)
```

## Data Flow

```
SubAdminDashboard (page)
  → useSubAdminDashboard(user)
    → findSubAdminProfileSimple + countUsersByEducatorId (parallel; errors propagate)
    → fetchTeacherExams (force=true on explicit refresh bypasses cache)
    → fetchTeacherAttemptCount (exact backend count for Total Attempts)
    → normalizeError(err) on failure → PageError { category, severity, title, message }
    → transform → { stats, recentExams, loading, error, refresh }
  → passes data to presentation components
  → no business logic in JSX
```

## State Ownership

| State | Owner |
|-------|-------|
| Dashboard data fetch | `useSubAdminDashboard` |
| Stats computation | `useSubAdminDashboard` |
| Active exam count | `useSubAdminDashboard` |
| Loading / error | `useSubAdminDashboard` |
| Selected exam (modal) | `SubAdminDashboard` (local UI state) |

## Component Hierarchy

```
SubAdminDashboard
  ├── Refresh button (Button variant="secondary" size="xs")
  ├── WelcomeBanner (variant="educator")
  ├── ErrorContainer + RetryButton (error state)
  ├── role="status" wrapper (initial load ONLY — one live region)
  ├── Grid cols=4 → StatCard ×4 (stats)
  ├── Recent Deployments
  │   ├── SectionHeader + ViewAll button
  │   ├── ExamListSkeleton (loading)
  │   ├── EmptyState (empty)
  │   └── RecentExamItem ×N (data)
  └── ExamDetailModal (conditional)
```

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Feature barrel — exports components + types |
| `types.ts` | TypeScript interfaces |
| `RecentExamItem.tsx` | Thin wrapper rendering the canonical `ExamCard` (shared with My Exams) |
| `DashboardSkeletons.tsx` | Exam-list loading skeleton |
| `useSubAdminDashboard.ts` (hook) | Data orchestration — in `hooks/` directory |

## Reusable Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `Button` | AntigravityUI | Refresh, View All |
| `Card` | AntigravityUI | ExamCard (in `exams/`), Skeletons (`premium-neutral`) |
| `Badge` | AntigravityUI | Exam status |
| `StatCard` | AntigravityUI | 4 stat cards |
| `Grid` / `Stack` | AntigravityUI | Stats grid, vertical spacing |
| `PageContainer` | AntigravityUI | Page wrapper |
| `SectionReveal` | AntigravityUI | Entry animations |
| `SectionHeader` | AntigravityUI | Section titles + actions |
| `EmptyState` | SharedComponents | Empty states (Lucide icons) |
| `LoadingSkeleton` | SharedComponents | Skeleton content |
| `ErrorContainer` | ErrorContainer | Error display (category/severity from canonical classifier) |
| `RetryButton` | RetryButton | Retry action |
| `AdminText` | AdminText | Typography (cinzel variant) |
| `WelcomeBanner` | user/WelcomeBanner | Welcome banner |

## Design System Compliance

- All cards use `Card variant="premium-neutral"` (shared card surface)
- All buttons use canonical `Button` (no custom buttons)
- All badges use canonical `Badge` with semantic variants
- All empty states use canonical `EmptyState` with Lucide icons
- All loading uses canonical `LoadingSkeleton`
- All errors use canonical `ErrorContainer` + `RetryButton`
- Zero `!important` overrides, zero inline styles, zero hardcoded colors
- All colors from design tokens (`var(--text-muted)`, `text-primary`, etc.)

## Accessibility

- All interactive elements have `aria-label`
- Recent Deployments cards render the **shared `ExamCard`** (`exams/ExamCard.tsx` — same
  container as the My Exams list) via the `RecentExamItem` wrapper, so both surfaces
  stay visually identical
- `ExamCard`: `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space)
- ONE page-level `role="status" aria-live="polite" aria-label="Loading dashboard"`
  region during initial load; inner skeleton bars are non-announcing
- Decorative icons: `aria-hidden="true"`
- `ErrorContainer`: `role="alert" aria-live="assertive"`
- `RetryButton`: dynamic `aria-label` based on loading state

## Governance Rules

1. Pages compose components — never fetch data or orchestrate services
2. Hooks own data fetching, orchestration, loading, errors, refresh
3. Components own presentation only — no business logic
4. Types have single ownership — defined in `types.ts`, re-exported via barrel
5. Reuse shared components — never recreate Button, Card, Badge, etc.
6. All styling from design tokens — no hardcoded values
7. Memoize list items — all components wrapped in `memo()`
8. Three-state rendering — loading → empty → data

## Future Extension Points

- Additional stat cards → add to Grid cols=4
- Real-time updates → integrate Supabase Realtime in hook
- New user roles → create feature-specific hooks, reuse shared components

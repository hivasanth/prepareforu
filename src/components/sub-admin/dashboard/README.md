# Sub Admin Dashboard Feature

## Purpose

Displays the Sub Admin dashboard: welcome banner, statistics grid, recent deployments, and recent student engagements.

This is the **Golden Reference Implementation** for all dashboard-style pages in the PrepareForU repository. Future dashboards must follow this architecture unless there is a documented technical reason not to.

## Architecture

```
SubAdminDashboard (page — composition only, 122 lines)
  ├── WelcomeBanner (shared, variant="educator")
  ├── StatCard ×4 (shared, from AntigravityUI)
  ├── RecentExamItem ×N (feature component)
  ├── RecentAttemptItem ×N (feature component)
  ├── ExamListSkeleton / AttemptListSkeleton (feature skeletons)
  ├── EmptyState ×2 (shared, Lucide icons)
  ├── ErrorContainer + RetryButton (shared)
  └── ExamDetailModal (cross-feature, from exams barrel)

useSubAdminDashboard (hook — orchestration, 105 lines)
  ├── useStableFetch (stale request protection)
  ├── teacherExamService (data access)
  └── userService (data access)
```

## Data Flow

```
SubAdminDashboard (page)
  → useSubAdminDashboard(user)
    → findSubAdminProfileSimple + countUsersByEducatorId (parallel)
    → fetchTeacherExams
    → fetchAttemptsByTeacherExamIds
    → transform → { stats, recentExams, recentAttempts, loading, error, refresh }
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
  ├── Grid cols=4 → StatCard ×4 (stats)
  ├── Grid cols=2
  │   ├── Recent Deployments
  │   │   ├── SectionHeader + ViewAll button
  │   │   ├── ExamListSkeleton (loading)
  │   │   ├── EmptyState (empty)
  │   │   └── RecentExamItem ×N (data)
  │   └── Last Engagements
  │       ├── SectionHeader + ViewAll button
  │       ├── AttemptListSkeleton (loading)
  │       ├── EmptyState (empty)
  │       └── RecentAttemptItem ×N (data)
  └── ExamDetailModal (conditional)
```

## Files

| File | Lines | Purpose |
|------|-------|---------|
| `index.ts` | 4 | Feature barrel — exports components + types |
| `types.ts` | 30 | TypeScript interfaces (4 interfaces) |
| `RecentExamItem.tsx` | 53 | Memoized exam card (clickable, keyboard accessible) |
| `RecentAttemptItem.tsx` | 36 | Memoized attempt row (avatar, name, score badge) |
| `DashboardSkeletons.tsx` | 35 | Loading skeletons for both sections |
| `useSubAdminDashboard.ts` (hook) | 105 | Data orchestration — in `hooks/` directory |

## Reusable Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `Button` | AntigravityUI | Refresh, View All ×2 |
| `Card` | AntigravityUI | RecentExamItem, RecentAttemptItem, Skeletons (all `premium-neutral`) |
| `Badge` | AntigravityUI | Exam status, Attempt score |
| `StatCard` | AntigravityUI | 4 stat cards |
| `Grid` | AntigravityUI | Stats grid (cols=4), Sections grid (cols=2) |
| `Stack` | AntigravityUI | Vertical spacing |
| `PageContainer` | AntigravityUI | Page wrapper |
| `SectionReveal` | AntigravityUI | Entry animations |
| `SectionHeader` | AntigravityUI | Section titles + actions |
| `EmptyState` | SharedComponents | Empty states (Lucide icons) |
| `LoadingSkeleton` | SharedComponents | Skeleton content |
| `ErrorContainer` | ErrorContainer | Error display |
| `RetryButton` | RetryButton | Retry action |
| `AdminText` | AdminText | Typography (cinzel variant) |
| `AdminIconWrap` | AdminIconWrap | Avatar initial |
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
- `RecentExamItem`: `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space)
- `RecentAttemptItem`: non-interactive (correctly excludes role/tabIndex)
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
- Additional sections → add to Grid cols=2
- Real-time updates → integrate Supabase Realtime in hook
- New user roles → create feature-specific hooks, reuse shared components

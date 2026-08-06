# Admin Overview

Feature directory for Admin → Overview dashboard.

## Architecture

```
AdminOverview.tsx (page, 47 lines)
└── useAdminOverview (hook, 22 lines) — exam selection from URL params
    ├── useAuth (shared — auth guard)
    └── useSearchParams (URL-based exam filter)
├── StatsGrid (34 lines) — 4 summary stat cards (users, attempts, questions, configs)
│   └── useSupabaseQuery → dashboardService.fetchOverviewCounts → countQuery (base.repository)
└── DailyAttemptsChart (124 lines) — daily attempt volume bar chart
    ├── useSupabaseQuery → dashboardService.fetchDailyAttempts → attempt.repository
    ├── useDateRange (shared — week-based date range filter)
    └── useBreakpoint (shared — responsive bar sizing)
```

## Dashboard Workflow

1. User loads page → auth guard checks loading state
2. Exam tab selection from URL params (`?exam=`) — consistent with admin filter strategy
3. Both StatsGrid and DailyAttemptsChart independently fetch via `useSupabaseQuery`
4. Each component has its own loading, error, and retry states
5. Date range filter in DailyAttemptsChart is independent UI state

## Data Flow

```
URL params (exam)
    │
    ▼
useAdminOverview ──► selectedExam, resolvedIds
    │                       │
    ▼                       ▼
AdminSelectionTabs      StatsGrid ──► dashboardService.fetchOverviewCounts ──► countQuery
                        DailyAttemptsChart ──► dashboardService.fetchDailyAttempts ──► attempt.repository
```

## State Ownership

| State | Owner | Mechanism |
|---|---|---|
| selectedExam | useAdminOverview | URL search params |
| resolvedIds | useAdminOverview | Derived via `resolveExamIds` |
| overview counts | StatsGrid | useSupabaseQuery |
| daily attempts | DailyAttemptsChart | useSupabaseQuery |
| date range | DailyAttemptsChart | useDateRange |
| breakpoint | DailyAttemptsChart | useBreakpoint |

## Key Decisions

- `resolvedIds` computed once in the hook and passed as props — avoids duplicate `resolveExamIds` calls in both components
- No shared data fetching — StatsGrid and DailyAttemptsChart are independent, no cross-component coupling
- DailyAttemptsChart lazy-loaded via `React.lazy` + `Suspense` with PremiumLoader fallback
- All presentational components wrapped in `memo`

## Accessibility

- `role="region"` with `aria-label="Statistics summary"` on StatsGrid container
- `role="figure"` with `aria-label` and `tabIndex={0}` on chart container
- `sr-only` heading on page
- LoadingOverlay with `message` prop for screen reader announcements
- ErrorState with retry button

## Governance

- Page is pure composition — no state or data fetching
- Hook is single-responsibility — only URL param management
- Components are self-contained with independent data fetching
- Service layer contract (`dashboardService`) unchanged
- Repository contract (`countQuery`, `attempt.repository`) unchanged

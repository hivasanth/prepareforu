# USER_DASHBOARD_ARCHITECTURE_AUDIT.md

Phase 6.XA — Page Production Certification Audit · User Dashboard (`/dashboard`)
Read-only architecture audit of the page and its dependency tree.

## S15 — Architecture

### Component / dependency tree

```
UserDashboard (src/pages/user/UserDashboard.tsx)
├── useAuth()                        → AuthContext (src/context/AuthContext.tsx)
├── useNavigate()                    → react-router
├── PageContainer / Stack / H1       → AntigravityLayout / AntigravityTypography
├── WelcomeBanner                    → src/components/user/WelcomeBanner.tsx
├── DashboardStatsGrid               → src/components/user/dashboard/DashboardStatsGrid.tsx
│   └── StatCard / Grid / ErrorContainer / RetryButton / StatSkeleton
├── DashboardRecentActivity          → src/components/user/dashboard/DashboardRecentActivity.tsx
│   ├── RecentAttemptCard            → src/components/common/RecentAttemptCard.tsx
│   │   └── AttemptCardBase          → src/components/common/AttemptCardBase.tsx
│   ├── LoadingSkeleton / EmptyState → src/components/common/SharedComponents.tsx
│   └── ErrorContainer / RetryButton
└── PrimaryButton                    → AntigravityButton

useUserDashboard (src/components/user/dashboard/useUserDashboard.ts)
└── dashboardService (src/services/dashboardService.ts)
    ├── dashboard.repository         → src/lib/repositories/dashboard.repository.ts (RPC get_user_dashboard_stats)
    ├── performanceService           → src/services/performanceService.ts (fetchDashboardRecentAttempts)
    ├── attempt.repository           → src/lib/repositories/attempt.repository.ts
    ├── exam.repository              → src/lib/repositories/exam.repository.ts
    ├── queryCache                   → src/utils/queryCache.ts
    ├── examUtils                    → src/utils/examUtils.ts (getAllowedExamIds)
    └── base.repository              → src/lib/repositories/base.repository.ts (countQuery)
```

### Layering

- **Page layer** (`pages/user/UserDashboard.tsx`): renders four content blocks and
  wires navigation callbacks (`/performance`, `/exams`, `/review/:id`). No data
  access logic — delegates to the hook.
- **Hook layer** (`useUserDashboard.ts`): owns loading/error/retry state and the
  parallel `Promise.allSettled` fetch with `requestId` + `mountedRef` guards.
- **Service layer** (`dashboardService.ts`): adapts repository results into
  `ServiceResult<T>`; owns cache keys and exam-isolation filtering for cached data.
- **Repository layer**: thin Supabase clients (`dashboard.repository.ts` RPC,
  `attempt.repository.ts` queries).
- **Shared UI layer**: `AntigravityUI` barrel components reused across the app.

### Routing

`src/App.tsx:94-106` — `/dashboard` is guarded by
`<AuthGuard><RoleGuard allowedRoles={['user']}><UserLayout /></RoleGuard></AuthGuard>`
and lazy-loaded via `Suspense`. Document title set by `PageTitle` (Title "Dashboard").

### Findings

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| USR-ARC-01 | Low | Dashboard imports `fetchDashboardRecentAttempts` from `performanceService` (a performance-domain module) — cross-domain service coupling. | `dashboardService.ts:4` |
| USR-ARC-02 | Low | `attempt.repository.ts` defines feature-specific subset row types duplicated per feature; candidate for consolidation. | `attempt.repository.ts` |
| USR-ARC-03 | Info | Page renders a duplicate `PrimaryButton` "Launch Practice Session" alongside `EmptyState`'s "Start an Exam" — three paths to `/exams`. Intentional, but worth confirming. | `UserDashboard.tsx:50-54` |

### Verdict

**PASS** — layering is clean, page is thin, data access is isolated behind hook +
service + repository. Two low-severity improvements noted for the backlog.

## Related sections
S1 (application flow), S4 (empty), S9 (UI consistency), S14 (code quality),
S13 (reusability), S17 (implementation readiness).

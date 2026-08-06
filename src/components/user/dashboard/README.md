# User Dashboard

Feature directory for User → Dashboard — primary landing page after login with stats, recent activity, and navigation shortcuts.

## Architecture

```
UserDashboard.tsx (page, 37 lines)
└── useUserDashboard (hook, 98 lines) — fetch stats + recent activity, retry, stale protection
    ├── dashboardService → dashboard.repository (RPC: get_user_dashboard_stats)
    └── performanceService → attempt.repository (Supabase: attempts table)
├── WelcomeBanner — time-based greeting with user name
├── DashboardStatsGrid — 4 StatCards (streak, exams, accuracy, rank) + loading/error states
└── DashboardRecentActivity — up to 5 recent attempts + loading/error/empty states
    └── RecentAttemptCard → AttemptCardBase
```

## Data Flow

```
UserDashboard
  └── useUserDashboard(userId, examSelection)
        ├── Initial: reads cache (dash_stats_{userId}, perf_attempts_{userId})
        └── fetchData()
              ├── dashboardService.fetchDashboardStats(userId)
              │     └── RPC: get_user_dashboard_stats → 5 min TTL cache
              └── dashboardService.fetchRecentAttempts(userId, examSelection)
                    └── performanceService.fetchPerformanceAttempts(userId)
                          └── attempt.repository → 5 min TTL cache
```

## Dashboard Metrics

| Metric | Source | Description |
|--------|--------|-------------|
| Streak | `daily_streak` from RPC | Consecutive days with activity |
| Wisdom | `exams_taken` from RPC | Total completed exams |
| Precision | `accuracy` from RPC | Overall accuracy percentage |
| Standing | `global_rank` from RPC | User's global rank string |
| Recent Activity | `attempts` table | Last 5 completed attempts, filtered by exam selection |

## Key Decisions

- `useUserDashboard` owns all orchestration — data fetching, stale request protection, retry state, loading/error tracking
- Services return `ServiceResult<T>` with `{ success, data, error }` — consistent error handling across all data sources
- Cache-first initialization: reads from `queryCache` on mount, then fetches fresh data in background
- `Promise.allSettled` for parallel stats + activity fetch — one failure doesn't block the other
- Retry state (`isRetrying`) managed in the hook instead of `usePageError` — simpler state machine with no external dependency
- `requestId` pattern for stale request protection (incremented on each fetch; outdated responses discarded)
- Page is pure composition (37 lines) — no state management beyond hook calls

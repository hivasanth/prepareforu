# USER_DASHBOARD_PERFORMANCE_AUDIT.md

Phase 6.XA — Page Production Certification Audit · User Dashboard (`/dashboard`)
Read-only performance audit.

## S7 — Performance

### Loading strategy

- **Cache-first**: initial state seeded from `queryCache` (`getCachedStats`,
  `getCachedRecentAttempts`) → instant paint on revisit
  (`useUserDashboard.ts:7-14`).
- **In-flight dedup + TTL**: `fetchDashboardStats` uses
  `queryCache.fetchWithDedup(key, fn, 300000, force)` — 5-minute TTL, single
  in-flight request per key (`dashboardService.ts:67-69`).
- **Session persistence**: cache persists to `sessionStorage` under the `qc_`
  prefix (`queryCache.ts`) — survives navigation, deduped across tabs.
- **Parallel fetch**: stats + recent attempts via `Promise.allSettled`
  (`useUserDashboard.ts:37-40`) — no serialization.
- **Server-side limiting**: recent attempts limited server-side to 5
  (`dashboardService.ts:83-87`; backwards). Only 5 cards render.
- **Race safety**: `requestId` ref + `mountedRef` discard stale results
  (`useUserDashboard.ts:21-42`) — no wasted re-renders / setState-after-unmount.

### Findings

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| USR-PERF-01 | Info | No findings of note. Cache-first + dedup + server limit provide strong baseline. Consider memoizing derived exam-id lists if profiling shows churn. | — |

### Verdict

**PASS** — strong cache/dedup/TTL strategy, parallel fetches, server-side
limit, and race guards. No page-level performance defects.

## Related sections
S2 (loading), S10 (UX), S14 (code quality).
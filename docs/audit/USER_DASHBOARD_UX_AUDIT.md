# USER_DASHBOARD_UX_AUDIT.md

Phase 6.XA — Page Production Certification Audit · User Dashboard (`/dashboard`)
Read-only user-experience audit.

## S1 — Application Flow & S10 — UX

### S1 — Application flow

1. Guarded route (`AuthGuard` + `RoleGuard` + `UserLayout`) ensures only active
   `user` role reaches the page (`App.tsx:94-106`).
2. Page mounts → `useUserDashboard(user?.id, user?.exam_selection)` seeds state
   from cache (`getCachedStats`, `getCachedRecentAttempts`) then fetches fresh
   data on mount (`useUserDashboard.ts:70`).
3. Stats + recent activity render from hook state with independent
   loading/error/content branches.
4. Primary user journeys:
   - Review an attempt → `onReviewAttempt(id)` → `/review/:attemptId`
   - Start practice / exam → `onStartExam` → `/exams`
   - Analytics → `onViewPerformance` → `/performance`
5. On failure, `RetryButton` triggers `handleRetry` (forced refetch with
   `isRetrying` lock).

### S10 — UX observations

- **Instant paint**: cache-first seeding means returning users see cached stats
  and recent attempts immediately, then fresh data arrives.
- **Clear next steps**: hero greeting + CTA + empty-state action all point the
  user toward their next action.
- **Three paths to `/exams`**: the `Analytics`-row is the only one to
  `/performance`; empty state and CTA both start an exam. No conflict, but the
  duplicate CTA is intentional (see `USR-ARC-03`).
- **Shared retry state**: `isRetrying` is shared by both sections
  (`useUserDashboard.ts:19,79`) — retrying one section re-renders both. Minor.

### Findings

| ID | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| USR-UX-01 | Low | `isRetrying` is shared across both dashboard sections; a single section retry triggers both to re-query (deduped by cache, so benign, but coupling exists). | `useUserDashboard.ts:19,79` |
| USR-UX-02 | Info | If the RPC ever returns `null` with no error, stats fall back to zeros/`'N/A'` via `fetchDashboardStats`'s default object — acceptable degradation. | `dashboardService.ts:73` |

### Verdict

**PASS** — the flow is coherent, cache-first UX is strong, and error/empty states
guide recovery.

## Related sections
S2 (loading), S3 (error), S4 (empty), S9 (UI), S7 (performance).
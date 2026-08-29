# USER DASHBOARD PERFORMANCE VERIFICATION

> Phase 6.XB — Verification of the `USR-PERF-01` over-fetch finding for `/dashboard` Recent Activity.
> Method: static review of the data-flow graph (repo → service → cache → hook → component).

## Verdict

**PASS** — Recent Activity now fetches at most **5 rows server-side** instead of 500. The shared 500-row path for the Performance/History pages is preserved.

## USR-PERF-01 — Recent Activity Over-fetch

### Before
`dashboardService.fetchRecentAttempts` → `performanceService.fetchPerformanceAttempts(userId, force)` (shared, cache key `perf_attempts_${userId}`, `.limit(500)` ascending) → client `.reverse().slice(0, 5)`. The dashboard requested the full 500-row history to render 5 cards.

### After (new dedicated path)
`dashboardService.fetchRecentAttempts` → `performanceService.fetchDashboardRecentAttempts(userId, examSelection, force)` (cache key `dash_recent_${userId}`) → `attemptRepo.fetchRecentAttempts(userId, allowedIds, 5)`:
- SQL `order('submitted_at', { ascending: false })` + `.limit(5)`
- optional `exam_id in (…)` filter passed server-side
- **no** client `.reverse()` / `.slice()` on the dashboard path

### Cache isolation
- Dashboard uses its own `dash_recent_${userId}` key; the shared `perf_attempts_${userId}` (Performance page, History) is unchanged — those routes still consume the full history for charts/aggregation.
- `clearPerformanceCache(userId)` now also invalidates `dash_recent_${userId}` and the `dash_stats_*` prefix, so post-submission recompute is consistent.

### Consumers confirmed unchanged
- `useHistory.ts` (exam module) and `useUserPerformance.ts` (performance module) still call `fetchPerformanceAttempts`/`getCachedAttempts` (500-row path). Verified by grep — untouched.

## Impact
- Network payload reduced ~100× for the Recent Activity section (5 rows vs 500).
- Query returns only completed `exam_tab` attempts (same `status`/`source` predicate as before).

## Residual / Deferred
- USR-PERF-02 (refetch-on-mount with warm cache) — DEFER per audit; behavior unchanged.
- Build produced no new large-chunk warnings attributable to this change.

## Build/Gate Result
`tsc -b` PASS, ESLint PASS, `npm run build` PASS, `npm test` 165/165 PASS.
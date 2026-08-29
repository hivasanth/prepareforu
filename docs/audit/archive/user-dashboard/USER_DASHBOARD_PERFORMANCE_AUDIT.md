# USER DASHBOARD PERFORMANCE AUDIT

> Phase 6.XA — Performance/code-review audit of `/dashboard`. READ-ONLY.

## 1. Render / Composition

- Page is 55 lines of pure composition (`UserDashboard.tsx`) — **excellent**; state lives in `useUserDashboard`.
- `StatCard`, `LoadingSkeleton`, `EmptyState`, `StatSkeleton` are `memo`d where defined. Grids are lightweight.
- `PrimaryButton` + section headers cause a single subtree re-render on state change; no fine-grained memoization around the two sections, but both are small and this is negligible.

## 2. Data Fetching & Caching

| Aspect | Verdict | Ref |
|---|---|---|
| Parallel fetch | GOOD — `Promise.allSettled` for stats + activity | `useUserDashboard.ts:37-40` |
| Cache-first init | GOOD — `queryCache.get` seeds state synchronously | `:7-14` |
| Stale-request guard | GOOD — `requestId` increment + `mountedRef` | `:21-27,42` |
| Retry w/ force | GOOD — `fetchData(true)` bypasses cache | `:65-68` |
| 5-min TTL | GOOD — `fetchWithDedup` in-flight dedupe | `dashboardService.ts:68-70` |
| Over-fetch | **ISSUE** — see below | — |

**USR-PERF-01 — Activity over-fetch.** `performanceService.fetchPerformanceAttempts` selects `.limit(500)` then `.reverse().slice(0,5)` (`dashboardService.ts:88-91`; `attempt.repository.ts:300`). Fetching 500 rows to show 5 is heavier than needed.

- Severity: **Medium** · Confidence: High.
- Impact: Larger payload + decode on cold cache; grows with history.
- Recommendation: FIX — order `submitted_at desc` and `.limit(5)` server-side; drop client reverse/slice. Effort 2h.

**USR-PERF-02 — Per-navigation refetch.** `useEffect` on `fetchData` refetches stats+activity on every mount; combined with 5-min cache this is acceptable, but the effect runs even when both sections are already hydrated from cache (extra RPC/query round-trip).

- Severity: **Low** · Confidence: Medium.
- Recommendation: DEFER — only force-fetch when cache is empty; today's cache-first + background refresh is a reasonable model.

## 3. DOM / Layout

- No duplicated DOM; skeletons swap inline (no unmount/mount churn).
- No expensive layout (no heavy transforms; `hover:shadow` transitions are cheap).
- Skeleton count mismatch (USR-LOAD-01) causes card-count shift — cosmetic.

## 4. Bundle / Assets

- `lucide-react` icons are tree-shaken; banner jpg loads on `Dashboard` only — OK.
- Page is `React.lazy` in `App.tsx:27` — chunked, not in main bundle. **GOOD.**

## Summary
- **USR-PERF-01** (Medium) — limit 5 server-side. FIX.
- **USR-PERF-02** (Low) — refetch-on-mount. DEFER.
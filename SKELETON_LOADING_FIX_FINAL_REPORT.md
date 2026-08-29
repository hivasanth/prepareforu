# TARGETED SKELETON LOADING FIX — FINAL REPORT

Date: 2026-08-14
Scope: Fix ONLY the two confirmed skeleton-reachability bugs (BUG-1 `/performance`, BUG-2 `/educator-exams`) with hook-local `.length` loading checks. No service-layer changes, no skeleton redesign, no changes to other pages.

## Revision 2 — retry-path fix (BUG-1b)

Final targeted verification uncovered a **retry-path variant of BUG-1** in `/performance`: after a failed load, clicking "Try Again" caused a **false empty flash** ("No exam activity yet") while the retry was still pending, instead of showing the skeleton. Root cause: `loadInitialData(force = true)` (used on mount `useEffect :105-107` **and** by the retry `captureNetworkError` retryFn `:99`) only cleared the cache and never set `loading`, and the retry resets `attempts` — so `errorState='retrying'` + `loading=false` rendered the empty state. The `/educator-exams` retry path was already correct (`loadExams` checks the cache on every call). Fixed in `useUserPerformance.ts` (see §1, §3). Verified: retry now shows the skeleton while pending, then data.

---

## 1. /performance (BUG-1) — `useUserPerformance.ts`

### Before
`useState` loading initializer returned `false` when cache was **absent**, so on a cold cache mount the page rendered the data view (empty) instead of `<PerformanceSkeleton>`. The real skeleton existed but was unreachable on the initial load path.

### After
```ts
const [loading, setLoading] = useState(() => {
  if (authLoading) return true
  if (!user) return true
  if (!user.exam_selection) return false
  if (!attemptsCacheKey) return true
  return !(getCachedAttempts(user.id) ?? []).length   // ← changed
})
```

### Browser-verified behavior
- **COLD CACHE** → `PerformanceSkeleton` renders immediately (`statusRoleCount: 1`, label "Loading performance", `pulseCount: 56`) while all 4 requests are held; resolves to data/empty/error when requests complete.
- **WARM CACHE** (in-memory `queryCache`, data from a prior fetch < 30s) → data renders instantly on mount AND on SPA round-trip back (`pulseCount: 0` at both mounts). Background re-fetch runs silently; skeleton never flashes because `getCachedAttempts()` still returns the populated array while `loadInitialData` refreshes.
- **GENUINE EMPTY** (server returns `[]`) → after fetch resolves: `EmptyState` "No exam activity yet" + "Start Today's Exam". (Not shown while pending.)
- **ERROR** (all 4 endpoints 500) → after fetch rejects: `ErrorContainer` "Connection Lost" + `RetryButton` "Try Again" wired to `retryError`. Retry re-runs `loadInitialData(true)`; with cache still empty the skeleton shows again during the retry.
- **RETRY (after fix)** → click "Try Again" → skeleton returns immediately (`statusRoleCount: 1`, "Loading performance", `pulseCount: 56`) while the retry request is held, then resolves to content — **no false-empty flash**.
- Auth-boot: `authLoading`/`!user` initializers already returned `true` → skeleton during session restore; force reload (`force = true`) clears cache but never clears `loading`, so the skeleton stays visible until fetch settles. `exam_selection` absent → initializer `false` (pre-existing intentional: selection tab page, unchanged).

### Retry fix (revision 2)
`loadInitialData` now snapshots the cache **before** clearing and sets `loading` on a cold cache even in the `force` branch:
```ts
const cachedAttempts = getCachedAttempts(user?.id || '') ?? []
if (force) {
  clearPerformanceCache(user.id)
  if (!cachedAttempts.length) setLoading(true)
} else if (!cachedAttempts.length) {
  setLoading(true)
}
```
The non-force branch is effectively dead on mount/retry (both call with `force = true`), but the snapshot+guard covers it symmetrically and keeps warm-cache mounts flash-free (`cachedAttempts` non-empty → no `setLoading`).

---

## 2. /educator-exams (BUG-2) — `useTeacherExams.ts`

### Before
Initializer returned `false` on cold cache (`!getCachedTeacherExams(...)`), and `loadExams` only set loading when there was *no cache key*. On cold cache the page rendered the "No live exams" empty state while the request was still in flight.

### After (two edits)
```ts
const [loading, setLoading] = useState(() => {
  if (!cacheKey) return false
  return !(getCachedTeacherExams({ user }, teacherId || '') ?? []).length   // ← changed
})

const loadExams = useCallback(async (force = false) => {
  if (!teacherId) return
  const id = nextId()
  const cached = getCachedTeacherExams({ user }, teacherId)
  if (!(cached ?? []).length) setLoading(true)                               // ← changed
  resetError()
  try {
    const data = await fetchTeacherExams({ user }, teacherId, force)
    ...
```

### Browser-verified behavior
- **COLD CACHE** → `EducatorExamsDataSkeleton` renders immediately in both LIVE SESSIONS and UPCOMING regions (`statusRoleCount: 2`, label "Loading educator exams", `pulseCount: 33`) while `teacher_exams` is held; resolves to data/empty on completion. (The second `role="status"` element is the app-wide `#toast-container` — 0×0, label `null`; only ONE data-skeleton grid is rendered.)
- **WARM CACHE** → exam cards render instantly on mount and on SPA round-trip back (`pulseCount: 0`). Silent background refresh; no flash.
- **GENUINE EMPTY** → after fetch resolves: "No live exams / You don't have any live assessments from your teacher at the moment." (Not shown while pending.)
- **ERROR** (500) → `ErrorContainer` "Connection Lost" + "Try Again" at 390×844 and 1440×1000 — no false empty.
- **RETRY** → click "Try Again" → data skeleton returns (`statusRoleCount: 2`, "Loading educator exams", `pulseCount: 33`) while the retry request is held, then resolves to the live card — no false empty.
- Auth-boot: during `authLoading` the page shows `EducatorExamsLoadingSkeleton` (unchanged); the Fix-B guard in `loadExams` covers the async-auth edge where the initializer ran before the cache key existed.
- `teacherId` absent → `loadExams` early-returns and initializer `!cacheKey → false` (pre-existing behavior, unchanged).
- **NO EDUCATOR LINKED** (`coupon_code_used: false`) → `EducatorLinkCard` "Link to Your Educator" + "Enter the coupon code your educator provided…" at 390×844 and 1440×1000; `pulseCount: 0`, no skeleton, no "No live exams", no `teacher_exams` request fired.

---

## 3. Files Modified

Exactly two files, four changed lines:

| File | Change |
|---|---|
| `src/components/user/performance/useUserPerformance.ts` | `:48` loading initializer → `!(getCachedAttempts(user.id) ?? []).length` |
| `src/components/user/performance/useUserPerformance.ts` | `:72-79` `loadInitialData` — snapshot cache before clear; set `loading` on cold cache in the `force` branch too (retry-path fix, revision 2) |
| `src/components/user/educator-exams/useTeacherExams.ts` | `:63` loading initializer → `!(getCachedTeacherExams({ user }, teacherId || '') ?? []).length` |
| `src/components/user/educator-exams/useTeacherExams.ts` | `:71-72` `loadExams` guard → `const cached = getCachedTeacherExams(...); if (!(cached ?? []).length) setLoading(true)` |

No other files touched. No skeleton components, service files, or other pages modified.

---

## 4. Cache Getter Contract (unchanged)

`getCachedAttempts` and `getCachedTeacherExams` intentionally return `|| []` on a cache miss (they distinguish "no cache" from "cached empty"). This contract is **not** changed — instead the hooks now inspect `.length` against the `?? []` fallback, mirroring the proven `/history` reference pattern (`useHistory.ts:31,51`). The 30-second TTL and background refresh are preserved, which is what prevents warm-cache skeleton flashes.

---

## 5. Skeleton Components (unchanged)

- `PerformanceSkeleton` (`src/components/user/performance/PerformanceSkeleton.tsx`) — unchanged markup/styles/aria; now reachable.
- `EducatorExamsDataSkeleton` + `EducatorExamsLoadingSkeleton` (`src/pages/user/UserTeacherExams.tsx`) — unchanged; data skeleton now reachable.
- `Skeleton`/`SkeletonPulse` primitives (`src/components/common/Skeleton.tsx`) — unchanged.
- No colors, material, geometry, reduced-motion handling, or `aria` attributes were altered. Reduced-motion runs were validated (skeletons render statically; no `prefers-reduced-motion` breakage).

---

## 6. Browser Validation (real Chrome via CDP, mocked Supabase REST)

Matrix: viewports 390×844 / 768×1024 / 1280×800 / 1440×1000; themes Dark + Light; reduced-motion runs included. `statusRoleCount`/`statusLabels`/`pulseCount` measured via `role="status"`/`aria-busy` skeleton wrappers.

### /performance
| Scenario | Result |
|---|---|
| Cold, requests held (390/768/1280/1440, dark) | **Skeleton** `statusRoleCount:1`, "Loading performance", `pulseCount:56`, no overflow — was EMPTY before fix |
| Cold, held (light + reduced-motion, 390/1440) | **Skeleton** `pulseCount:56`, no overflow |
| Genuine empty `[]` (390/1440) | EmptyState "No exam activity yet" + "Start Today's Exam", `pulseCount:0` |
| All endpoints 500 (390/1440) | ErrorContainer "Connection Lost" + "Try Again", `pulseCount:0` |
| Warm cache + SPA round-trip (1280) | Data on both mounts ("Total Exams 2 / Avg Accuracy 82% / Avg Score 86.3"), `pulseCount:0` — no flash (re-verified after revision-2 change) |
| Held → release (1280) | Skeleton at all 4 viewports → release → content, `pulseCount:0` |
| 500 → click Try Again → retry held (1280) | Error → **skeleton while pending** (`pulseCount:56`, no false empty) → release → content |

### /educator-exams
| Scenario | Result |
|---|---|
| Cold, request held (390/768/1280/1440, dark) | **Skeleton** `statusRoleCount:2` (1 data-skeleton grid + 0×0 `#toast-container`), "Loading educator exams", `pulseCount:33`, no overflow — was "No live exams" before fix |
| Cold, held (light + reduced-motion, 390/1440) | **Skeleton** `pulseCount:33`, no overflow |
| Genuine empty `[]` (390/1440) | EmptyState "No live exams…", `pulseCount:0` |
| All endpoints 500 (390/1440) | ErrorContainer "Connection Lost" + "Try Again", `pulseCount:0` — no false empty |
| Warm cache + SPA round-trip (1280) | Live card "Weekly Current Affairs Test" on both mounts, `pulseCount:0` — no flash |
| Held → release (390/768/1280/1440) | Skeleton at all 4 viewports → release → "LIVE NOW / Weekly Current Affairs Test", `pulseCount:0` |
| 500 → click Try Again → retry held (1280) | Error → **skeleton while pending** (`pulseCount:33`, no false empty) → release → content |
| No educator linked (390/1440) | EducatorLinkCard "Link to Your Educator", `pulseCount:0`, no skeleton, no `teacher_exams` request, no error |

Screenshots: `C:\Users\Vasanth\AppData\Local\Temp\opencode\shots\`

---

## 7. Tests

| Gate | Result |
|---|---|
| `npx tsc -b --force` | Pass (no output, exit 0) — re-verified after revision-2 change |
| `npm run build` | Pass (vite build OK; only pre-existing CSS optimizer warnings) |
| `npm run lint` | 379 problems (331 E / 48 W) — repo baseline, **down 1** from 380 (the `:76` no-empty finding was removed by the revision-2 edit). No new findings from the 4 changed lines. Only pre-existing findings in these files: `useTeacherExams.ts:84,158` exhaustive-deps; `useUserPerformance.ts:104` exhaustive-deps |
| `npm test` | 165 passed (5 files); 10 unhandled `ERR_REQUIRE_ESM` fork errors — matches pre-change baseline exactly, no regressions |

---

## 8. Regression Check

Changed code is isolated to the two hooks above; other pages were never touched. Browser spot-checks confirm:

- `/topics` — data renders normally (skeleton→data flow unchanged).
- `/educator-exams` with live data — normal data render (not skeleton path).
- `/performance` with live data — normal analytics render.
- `/exams`, `/history`, `/dashboard`, `/profile` — untouched code; covered by the full passing test suite (165 tests).

---

## 9. Remaining Issues (genuine, pre-existing, out of scope)

- `/profile` "Verified Performance Metrics" briefly shows a failed-load snippet in the mocked harness (harness only mocks dashboard/performance RPCs, not profile metrics; not a product bug).
- `useUserPerformance.ts:104` exhaustive-deps warning; `useTeacherExams.ts:84,158` exhaustive-deps warnings — pre-existing lint debt, unrelated to this fix. (The prior `:76` no-empty finding is resolved by the revision-2 edit.)
- 10 `ERR_REQUIRE_ESM` unhandled-fork errors during `npm test` — pre-existing harness/node-version issue, unchanged by this work.
- Educator loading state shows one data-skeleton grid under `role="status"` plus the app-wide 0×0 `#toast-container` (`role="status"`, no label) — matches existing design, intentionally not "fixed" per scope.

All two confirmed bugs (plus the retry-path variant found during final verification) are fixed and verified in the browser. STOP.

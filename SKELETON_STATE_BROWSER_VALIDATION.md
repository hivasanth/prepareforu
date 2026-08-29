# SKELETON LOADING STATES — BROWSER VALIDATION REPORT

**Date:** 2026-08-14 · **Method:** real Chrome (`--headless=new`), CDP-driven network interception (held/respond scenarios) + fabricated local session. No app source modified.
**Scope:** skeleton-pending states of the user Panel pages `/performance`, `/topics`, `/educator-exams`. `/exams` pages untouched (previously validated).
**Viewports:** 390×844 / 768×1024 / 1280×800 / 1440×1000, both themes, plus `prefers-reduced-motion: reduce` variants.
**Evidence:** `C:\Users\Vasanth\AppData\Local\Temp\opencode\scenarios\*.json` (14 scenarios) + `...\shots\*.png`; driver `...\val.mjs`.

---

## 1. Per-page verdicts

### 1.1 `/performance` (UserPerformance → `PerformanceSkeleton`)

| Field | Result |
|---|---|
| PAGE | `/performance` (user panel, role `user`, exam_selection `APPSC_GROUPS`) |
| RENDERED | Skeleton **unreachable** on cold load; EmptyState "NO EXAM ACTIVITY YET" shown instead while the analytics fetch is in flight |
| SKELETON | `PerformanceSkeleton` is a11y/material/geometry-correct in source (single `role="status"` `aria-live="polite"` `aria-label="Loading performance"`, decorative inner units, StatSkeleton `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, chart/donut/bar panels) — but never rendered in the data-loading phase |
| MATERIAL | PASS (when rendered it uses the certified ONE `Skeleton` primitive / `--skeleton-*` tokens) |
| GEOMETRY | Final, error and empty states: `docW == innerW` at 390/768/1280/1440 — **no horizontal overflow** |
| RESPONSIVE | Final analytics stack correctly (metrics 1→2→4 columns, charts stack at ≤1024) |
| ACCESSIBILITY | FAIL while data loads: no live region is active (skeleton absent); EmptyState is not `role="status"` |
| RETRY | ErrorContainer "Connection Lost | … | TRY AGAIN" renders at all viewports, wired to `loadInitialData(true)` — PASS |
| VERDICT | **FAIL — skeleton loading state unreachable (false-empty flash)** |

### 1.2 `/topics` (UserTopics → `TopicListViewSkeleton`)

| Field | Result |
|---|---|
| PAGE | `/topics?exam=APPSC_GROUP_1` |
| RENDERED | Skeleton renders on cold cache at all viewports, both themes |
| SKELETON | 1× `role="status"` `aria-live="polite"` `aria-label="Loading topics"`; **30 pulse units** (header title 200×18, subtitle 140×12, 4 row cards 374×126, icon 44×44, title/subtitle bars, chevron 18×18) — geometry mirrors real `TopicCard` |
| MATERIAL | PASS (`Skeleton` primitive, `--skeleton-*` tokens, `animate-pulse`) |
| GEOMETRY | Skeleton column widths 374/648/960/1120 == content column; h≈602; no overflow at any viewport |
| RESPONSIVE | Card rows span the full content column at all widths |
| ACCESSIBILITY | PASS (single live region, correct label, inner units `decorative`/aria-hidden) |
| RETRY | Fetch-failure path renders usePageError "Connection Lost / TRY AGAIN" — PASS |
| VERDICT | **PASS — no change needed** |

### 1.3 `/educator-exams` (UserTeacherExams → `EducatorExamsDataSkeleton`)

| Field | Result |
|---|---|
| PAGE | `/educator-exams` (user linked to teacher, coupon used) |
| RENDERED | Data skeleton **unreachable**; page renders header + LIVE SESSIONS/UPCOMING/HISTORY filter bar + EmptyState "NO LIVE EXAMS" while `teacher_exams` fetch is in flight |
| SKELETON | `EducatorExamsDataSkeleton` source is a11y-correct, but never rendered in the data-loading phase. `EducatorExamsLoadingSkeleton` renders only during the auth-boot phase (sub-second) |
| MATERIAL | PASS (source) |
| GEOMETRY | Final state: no horizontal overflow at any viewport |
| RESPONSIVE | PASS (final grid stacks at 390) |
| ACCESSIBILITY | FAIL while data loads (no live region; skeleton absent) |
| RETRY | usePageError error/retry pattern present — PASS |
| VERDICT | **FAIL — skeleton loading state unreachable (false-empty flash)** |

State A (user without coupon) and final (3 live exams) render correctly at all viewports — PASS.

---

## 2. Loading Architecture Findings

1. **`/history` is the correct reference implementation.** `useHistory.ts:31` computes loading with an explicit `.length` check (`!getCachedAttempts(...).length || !getCachedMetadata(...)?.exams?.length`) and mounts with `loadHistory()` (non-force), which triggers `setLoading(true)` on cache-miss (`useHistory.ts:51`). Result: skeleton on cold cache, instant render on warm cache, no flash on refresh.
2. **`/performance` and `/educator-exams` deviate from that pattern in the same two ways:**
   - loading initializers use `!getCachedAttempts(user.id)` / `!getCachedTeacherExams(...)` where the getters *always* return `[]` (`|| []`), so the check is always `false` (`[]` is truthy);
   - the mount effect calls the loader with `force=true`, whose branch clears the cache and **never** calls `setLoading(true)`.
3. The cache getters themselves (`getCachedAttempts`, `getCachedTeacherExams`, `getCachedMetadata`) default a miss to `[]`/`{}`. That is fine for *data* consumers (`|| []` / `|| {...}` fallbacks) but silently defeats every `!getCachedX(...)` loading check. A service-level "return undefined" change is **not** clean: `useHistory.ts:31` and `useHistory.ts:23` dereference `.length`/assign directly and would break (that is why the hook-local `.length` fix is preferred).
4. Skeleton components themselves are all correctly built per the ONE skeleton language (`Skeleton.tsx` primitive, `--skeleton-*` tokens, `animate-pulse`, single `role="status"` + `aria-label` + `aria-live="polite"`, inner units `decorative`). **Only reachability is broken.**
5. Global reduced-motion override at `src/index.css:1059–1066` collapses all skeleton animation to `0.01ms` under `prefers-reduced-motion: reduce` — verified working in both themes (`topics-skel-lite`, `edu-skel-lite`, `perf-skel-lite`). The `animate-pulse` on skeletons is covered.
6. Route-level Suspense spinner (`SidebarLayout.tsx` ~299–307) masks lazy chunk loads only; it does not cover page data loading and was not the cause of any observation.

---

## 3. Confirmed Bugs

### BUG-1 — `/performance`: `PerformanceSkeleton` unreachable → false-empty flash
- **Evidence:** with `attempts`+`metadata` requests held 6–10 s at every viewport (dark and light+rm), the page renders the EmptyState "NO EXAM ACTIVITY YET | Complete exams in the Exams tab… | START TODAY'S EXAM" — `pulseCount: 0`, `statusRoleCount: 0`. `perf-skel.json`, `perf-skel-lite.json`.
- **Root cause chain:**
  1. `performanceService.ts:160-162` — `getCachedAttempts` returns `queryCache.get(...) || []` (always truthy).
  2. `useUserPerformance.ts:48` — loading initializer `return !getCachedAttempts(user.id)` → always `false` on cold cache.
  3. `useUserPerformance.ts:106` — mount effect calls `loadInitialData(true)`; the force branch (`:74-75`) clears the cache and never calls `setLoading(true)` (the `setLoading(true)` at `:78` is in the non-force branch only).
  - Net effect: on a warm session (SPA navigation, auth already loaded) with a cold cache, `loading` is `false` for the entire analytics fetch → EmptyState shown as if there were no data.
- **Fix (mirrors `/history`, 1 line):** `useUserPerformance.ts:48` →
  `return !(getCachedAttempts(user.id) ?? []).length`

### BUG-2 — `/educator-exams`: `EducatorExamsDataSkeleton` unreachable → false-empty flash
- **Evidence:** with `teacher_exams` request held at every viewport (dark and light+rm), the page renders header + filter bar + EmptyState "NO LIVE EXAMS | You don't have any live assessments from your teacher at the moment." — `pulseCount: 0`. `edu-skel.json`, `edu-skel-lite.json`.
- **Root cause chain:**
  1. `teacherExamService.ts:259` — `getCachedTeacherExams` returns `queryCache.get(...) || []` (always truthy).
  2. `useTeacherExams.ts:63` — loading initializer `return !getCachedTeacherExams(...)` → always `false` when a cache key exists (and returns `false` outright when the key is empty, i.e. before auth resolves).
  3. `useTeacherExams.ts:71-72` — `const cached = getCachedTeacherExams(...); if (!cached) setLoading(true)` never fires because `cached` is `[]` (truthy).
  4. `useTeacherExams.ts:87` — mount effect calls `loadExams(true)`; the guard is the only `setLoading(true)` and it is dead.
- **Fix (mirrors `/history`, 2 lines):** `useTeacherExams.ts:63` →
  `return !(getCachedTeacherExams({ user }, teacherId || '') ?? []).length`
  and `useTeacherExams.ts:71-72` →
  `const cached = getCachedTeacherExams({ user }, teacherId); if (!(cached ?? []).length) setLoading(true)`

**Post-fix behavior (both pages):** cold cache → skeleton shows during the fetch (user-present *and* async-auth paths); warm cache → instant data, no skeleton flash; the 30 s background refresh on `/educator-exams` keeps its warm cache at refresh time, so the `?.length` guard prevents a periodic skeleton flash; genuine-empty responses still land on the (correct) EmptyState after the fetch; error/retry flow unchanged.

---

## 4. No-Change Findings

- `/topics` skeleton, final, selection and reduced-motion states — all PASS, no change.
- `/history` — already follows the correct pattern; used as the reference, untouched.
- `/performance` final, error/retry, and `exam_selection=null` → `/signup` redirect (guard-level; page-level EmptyState is a defensive fallback) — PASS.
- `/educator-exams` final and coupon state A — PASS.
- Global reduced-motion override and skeleton a11y structure across all three skeleton components — PASS.
- `/exams` pages — out of scope, not modified.

---

## 5. Exact Implementation Plan

Scope: 2 files, 3 lines, no service-layer or `/history` changes.

1. `src/components/user/performance/useUserPerformance.ts:48`
   - Before: `return !getCachedAttempts(user.id)`
   - After: `return !(getCachedAttempts(user.id) ?? []).length`
2. `src/components/user/educator-exams/useTeacherExams.ts:63`
   - Before: `return !getCachedTeacherExams({ user }, teacherId || '')`
   - After: `return !(getCachedTeacherExams({ user }, teacherId || '') ?? []).length`
3. `src/components/user/educator-exams/useTeacherExams.ts:71-72`
   - Before: `const cached = getCachedTeacherExams({ user }, teacherId); if (!cached) setLoading(true)`
   - After: `const cached = getCachedTeacherExams({ user }, teacherId); if (!(cached ?? []).length) setLoading(true)`

Verification: `npx tsc -b --force`, `npm run lint` (no new problems vs baseline), then re-run the 14 validation scenarios (expected: `perf-skel`/`edu-skel` now show `statusRoleCount: 1` + `pulseCount > 0`; `perf-skel-lite`/`edu-skel-lite` unchanged in structure but skeleton replaces EmptyState; all warm-cache scenarios still render data instantly).

---

## 6. Final Recommendation

**TARGETED FIX REQUIRED** (loading-state reachability only).

- `/topics` → **READY** (P3), no change.
- `/performance` + `/educator-exams` → apply the 3-line fix above (BUG-1 + BUG-2), re-validate, then **READY**.

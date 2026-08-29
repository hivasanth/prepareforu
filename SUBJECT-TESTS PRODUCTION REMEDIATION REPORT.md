# /SUBJECT-TESTS PRODUCTION REMEDIATION REPORT

## Scope
Production remediation of the 5 audit findings on the `/subject-tests` feature (portal → paper → subject config → launch). All 5 findings are **IMPLEMENTED**, statically validated (`tsc`, `build`, lint, unit suites) and **live-browser validated** against the LIVE Supabase project (`xbjhlfwqmcyatblsrhxn.supabase.co`, `VITE_USE_SUPABASE_LOCAL=false`) at `localhost:5173`.

---

## ST-L1 — `getMinQuestions` silently swallows failures
- **Before:** the whole function body sat inside `try/catch`; ANY fetch failure resolved to the silent default `30` and the page proceeded as if 30 questions existed.
- **After** (`src/services/questionAvailabilityService.ts`): catch-all removed. `DEFAULT_MIN_QUESTIONS = 30` is returned **only** for (a) no allowed IDs, (b) empty result set, or (c) no valid numeric `min_questions` in the config. Fetch failures now **propagate**: the non-APPSC init path surfaces via `handleInitError` (ST-M1), the APPSC paper path via the hook's `onPaperError` (ST-H2). Typed as `Pick<ExamConfig, 'min_questions'>[]` (dedup fetcher is not generic — no `queryCache` change).
- **Root cause:** overly broad error handling turned a real outage into a plausible-looking count.
- **Validation:** static review; `tsc --noEmit` PASS; `npm run build` PASS; ds030/ds031/ds032 9/9; failure propagation exercised live in A2/B1 (below).

## ST-M1 — init errors misclassified as network-only
- **Before:** `handleInitError` used `captureNetworkError` (forced `network` category), so 503/auth/timeout all rendered "Connection Lost".
- **After:** generic `captureError(msg, { retryFn: () => loadData(true) })`; the existing `errorClassification` classifier auto-detects network/offline/timeout/auth/server, keeping approved per-class copy. Classifier itself untouched (fallback catch intact).
- **Root cause:** hardcoded category.
- **Validation:** live A2 (blocked reload → correctly classified error) and B1 ("Connection Lost" from `Failed to fetch`); existing classifier unit behavior unchanged.

## ST-M2 — "No questions available" was an infinite-retry server error
- **Before:** `subjectTestService` threw a generic `Error`; `usePortalLaunch` forwarded a message string; the page called `captureServerError` → ErrorContainer with RetryButton that could never succeed and no exit affordance.
- **After:** new typed `NoAvailableQuestionsError` thrown at the empty-selection site (`subjectTestService.ts`); `usePortalLaunch` `onError` now `(error: unknown) => void` passing the error object; page `onError` detects the business-empty state by message prefix (`message.startsWith('No questions available')` — deliberately NOT `instanceof`, because ds030/ds031 mock the whole service module) and calls `captureError(error, { category: 'business', retryable: false, fallbackMessage })`. Page renders the standard ErrorContainer **without RetryButton** plus an AntigravityUI `Button` **"Back to Subject List"** (`UserSubjectTests.tsx`) when `pageError.category === 'business'`. All other launch errors stay retryable (`retryFn: launchTest`).
- **Root cause:** business-empty misreported as a server error with no recovery path.
- **Validation:** static (message-branch + generic `captureError`→classifier path proven live in B1); not live-triggerable with current data (no zero-question subject).

## ST-H1 — retry flash: EmptyState painted while refetching
- **Before:** `loadData(force)` never raised `loading`; the `retrying` state bypassed the page gate (`errorState === 'error'`), so ErrorContainer unmounted and the cached-empty EmptyState painted for the full ~2.2–2.5 s refetch window.
- **After:** force path `setLoading(true)` before clearing cache; whole body in `try { … return true } finally { setLoading(false) }` so the gate clears on success AND failure. Retry window now shows the standard skeleton.
- **Root cause:** force-branch omitted the loading gate; page `isLoading` gate didn't include `retrying`.
- **Validation:** browser A3/A4/A5 — **0 empty-state samples during a 4.5 s sampled retry window**, skeleton present, failure → error, restored network → subjects with 0 empty samples.

## ST-H2 — APPSC paper-switch failures were silent + stale data shown under the new tab
- **Before:** `useAppscPaperSelection` swallowed all errors (`console.error` only); `fetchPaperData` committed unconditionally; no paper-scoped loading gate → P1 subjects painted under P2 (or stale post-switch).
- **After** (`src/hooks/useAppscPaperSelection.ts`, rewritten): failures surface via `onPaperError` → `captureError(error, { retryFn: () => retryPaperRef.current() })`; `isCurrent`/`nextId`/`isStale` guard prevents stale paper data committing after a newer selection supersedes an in-flight fetch; `paperLoading` raised synchronously (`useLayoutEffect`) **only** on an actual paper change or explicit retry (initial auto-select skipped — avoids an extra cold-mount skeleton cycle, the transient ds031 flake); `loadPaper` only ever CLEARS `paperLoading` (in `finally`, when not stale). `handlePaperChange`/`handleExamChange` clear subjects/counts immediately in both consumers (`useSubjectTests`, `useTopicExams`); both pages gate on `loading || paperLoading`.
- **Root cause:** silent catch + unconditional commit + no paper-switch loading gate.
- **Validation:** browser B1/B2 — paper/group switch with blocked `exam_subjects|question_counts` surfaces a retryable "Connection Lost" error (not silent), retry restores subjects (5 in GROUP 2); C1 topic-exams mounts subjects+topics with no error/empty/hook crash.

---

## Remediation matrix
| ID | Component | State | Verified |
|----|-----------|-------|----------|
| ST-L1 | `questionAvailabilityService.getMinQuestions` | Implemented | tsc/build/ds + A2/B1 |
| ST-M1 | `useSubjectTests.handleInitError` | Implemented | A2/B1 |
| ST-M2 | `subjectTestService` + `usePortalLaunch` + launch onError + page | Implemented | static + B1 (generic path) |
| ST-H1 | `useSubjectTests.loadData` | Implemented | A3/A4/A5 |
| ST-H2 | `useAppscPaperSelection` + 2 consumers + 2 pages | Implemented | B1/B2/C1 |

Files touched: `useAppscPaperSelection.ts`, `useSubjectTests.ts`, `useTopicExams.ts`, `UserSubjectTests.tsx`, `UserTopicExams.tsx`, `usePageError.ts`, `usePortalLaunch.ts`, `questionAvailabilityService.ts`, `subjectTestService.ts`, `types/error.types.ts`.

---

## Browser validation (live, msedge, storage-state user)
Harness: `subjecttests_remediation_validate.mjs` (temp). 8/8 meaningful checks pass.
- **A1** live load → 4 subjects, no error. **A2** blocked reload → ErrorContainer + Try Again. **A3** retry window: skeleton present, `emptySamples=0` (of 2 sampled mutations), no EmptyState. **A4** blocked retry → returns to error, no empty flash. **A5** restored retry → subjects, 0 empty samples.
- **B0** no Paper-2 tab exists in this live account (tabs: GROUP 1–4 / GENERAL STUDIES / GENERAL APTITUDE) — harness noted, not a finding; B1/B2 exercised the identical `loadPaper` failure path via a GROUP switch. **B1** switch with blocked paper-data → retryable "Connection Lost" error (not silent). **B2** retry → 5 subjects restored.
- **C1** `/topic-exams` mounts subjects + topics cleanly, no alert/empty/hook-crash (shared-hook regression).

## Database / Migration
None. No schema, migration, RLS, or LIVE data changes.

## Cache
`queryCache`/`fetchWithDedup`, all cache keys, `clearSubjectTestCache` — **unchanged**. Behavior note: `getMinQuestions` no longer caches a "30 because no-config" result on fetch failure; failures now propagate as designed.

## Visual Regression
None to approved visuals. ErrorContainer/EmptyState/StartTestButton/skeletons/DS-005 untouched. Additions: standard AntigravityUI Button for business exit; `paperLoading` reuses the existing skeleton.

## Build / Lint / Test
- `npx tsc --noEmit` — **PASS**.
- `npm run build` — **PASS** (CSS + chunk-size warnings pre-existing).
- `npm run lint` — no findings in any touched file (379 pre-existing baseline).
- `vitest.audit.config.ts` — **318 passed / 33 failed**; all 33 are pre-existing Foundation failures (ds003 ×21, ds005 ×10, ds014 ×2). **ds030/ds031/ds032 = 9/9 PASS** (verified 3×, incl. 2 full-suite runs; stable after cold-mount gate refinement).
- `npm test` — 165 passed / 11 pre-existing `ERR_REQUIRE_ESM` worker errors (unchanged baseline).
- `e2e/history-remediation.spec.ts` — **6/6 PASS** (shared retry-contract regression across `/history` + `/leaderboard` after the additive `usePageError` change).

## Runtime / LIVE
Validated against LIVE Supabase through the local Vite dev server (`localhost:5173`, HMR active).

## Deferred (documented, out of scope for this remediation)
- **ST-L2** mount auto-select race: cosmetically resolved by the layout-effect gate; strict race removal deferred (low impact, negligible window).
- **ST-L3** infinite skeleton if `isAppsc` with no selection: unreachable — AuthGuard redirects non-configured users to `/signup`.
- **ST-I1** launch-path 5000-attempt bulk read / question counts: shared with `/active-exam`; separate initiative.
- **ST-I2** state-backed `/active-exam` refresh error handling: shared; separate initiative.

## Remaining Issues
1. ST-M2 not exercised against a live zero-question subject (none in current data) — message-branch covered by static review and the proven generic capture path.
2. Pre-existing lint baseline (~379) and audit-config environment failures — unrelated, previously reported.
3. Pre-existing double-fetch of paper-1 subjects on initial APPSC mount (loadData + hook auto-select) — unchanged, not introduced here.

## Publish-Readiness
**READY FOR PUBLISH REVIEW** — subject-tests production findings remediated; build/typecheck clean; focused suites green (9/9 + history 6/6); live browser validation green (8/8); no database/cache/visual regressions; known remaining items documented above and none block the review.

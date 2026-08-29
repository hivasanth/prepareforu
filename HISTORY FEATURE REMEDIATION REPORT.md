# /history Feature Remediation Report

## 1. Scope

Remediation of six confirmed defects in the `/history` feature, fixed through a
shared retry contract plus targeted page-level changes.

- **BUG-1** — Retrying after a failure cleared the captured error, letting the
  page fall through to a misleading empty state.
- **BUG-2** — During retry, the loading flag was disabled while the error was
  cleared, causing an empty/content flash for the duration of the retry.
- **BUG-3** — Attempts already reviewed (one-time gate) offered a dead-end
  "Full Review" action/navigation.
- **BUG-4** — After exam metadata changed, the filter selection was not
  reconciled and could hold stale/invalid values.
- **BUG-5** — Filtered-out history showed the same copy as a genuinely empty
  history, hiding the "filter is empty, not no-attempts" state.
- **BUG-7** — `useHistory` returned `loading` / `isRetrying` flags that no page
  consumed.

Constraints honored: no redesign of approved visuals (HistorySkeleton,
AttemptCardBase, UserSelectionTabs, ErrorContainer, EmptyState, tokens);
LIVE Supabase DB/RLS/backend untouched; the `review_accessed` security gate was
never bypassed; no new migration created.

## 2. Shared root-cause fix (BUG-1, BUG-2)

**Root cause.** `usePageError.retry()` cleared `state` to `success` and
`error` to `null` immediately, then invoked the retryFn. Because the retryFn
was fire-and-forget, the page briefly saw `error=null + loading=false`, so it
fell through to whatever came next — the empty history UI.

**Contract.** `RetryFn = () => void | boolean | Promise<void | boolean>`
(`src/types/error.types.ts`, also typed on `CaptureOptions.retryFn` and
`UsePageErrorReturn.retry: () => Promise<void>`).

**Semantics** (`src/hooks/usePageError.ts`):

- The error is retained during retry (never nulled at retry start).
- The retryFn resolves `true` on success → retry sets `state='success'`,
  `error=null`.
- The retryFn resolves `false` on failure (after capturing) → retry re-asserts
  `state='error'`, keeping the captured error visible.
- The retryFn throws → caught, normalized, error shown.
- Any consumer still returning `undefined` is treated as success
  (`result !== false`), preserving backward compatibility.

This removes both BUG-1 (an unresolved retry can no longer clobber the error)
and BUG-2's empty flash (the page never sees `error=null + loading=false`).

**All retryFn sources now return explicit booleans** (audited, no gaps):

| Source | Load fn | Contract |
| --- | --- | --- |
| `src/components/exam/useHistory.ts` | `loadHistory` | `Promise<boolean>` |
| `src/components/user/full-exams/useUserExams.ts` | `fetchData` | `Promise<boolean>` |
| `src/components/user/subject-tests/useSubjectTests.ts` | `loadData` | `Promise<boolean>` |
| `src/components/user/topic-exams/useTopicExams.ts` | `loadData` | `Promise<boolean>` |
| `src/components/user/topics/useTopics.ts` | `loadTopics` | `Promise<boolean>` |
| `src/components/user/educator-exams/useTeacherExams.ts` | `loadExams` | `Promise<boolean>` |
| `src/components/user/leaderboard/useUserLeaderboard.ts` | `loadMetadata` / `loadLeaderboard` | `Promise<boolean>` |
| `src/components/user/performance/useUserPerformance.ts` | `loadInitialData` | `Promise<boolean>` |
| `src/components/user/prepare-write/usePrepareWrite.ts` | `loadInitial` / `handleExamChange` / `startPreparation` | `Promise<boolean>` |
| `src/hooks/usePortalLaunch.ts` | `launchTest` | `Promise<boolean>` |

Supporting contract typing: `src/hooks/usePortalInit.ts` now types
`loadData: (force: boolean) => Promise<boolean>`.

**BUG-2 rendering decision.** Per the approved spec (skeleton explicitly
allowed as an alternative to ErrorContainer + RetryButton spinner), the fix is a
**skeleton during retry**: the force path in `loadHistory` now calls
`setLoading(true)`, so `resetError()` can never open a
`loading=false + error=null + data=[]` window. Consistent across the other
hooks, which either set `loading` or show stale content via warm-cache refresh.

## 3. Per-defect fixes

- **BUG-3** — `review_accessed: boolean` added to
  `PerformanceAttemptRow` and the `.select(...)` list in
  `src/lib/repositories/attempt.repository.ts`, surfaced optionally on
  `PerformanceAttemptSummary.review_accessed?` (`src/types/exam.types.ts`).
  `AttemptCardBase` (shared by UserHistory and the dashboard
  `RecentAttemptCard`) now renders **"Already Reviewed"** instead of
  "Full Review", suppresses navigation/dead-end `/review/:id` for reviewed
  attempts, and drops `role="button"` / `tabIndex` / pointer cursor /
  `FOCUS_RING` when reviewed. Aria-label updated accordingly.
- **BUG-4** — `useHistory` reconciliation effect preserves a valid selection;
  only an invalid selection is re-derived (first paper of the first exam),
  and the paper is re-validated for the selected exam and cleared for
  non-APPSC selections.
- **BUG-5** — `useHistory` exposes `isEmptyFilter` (filtered empty while
  attempts exist). `UserHistory` shows contextual copy ("No attempts in this
  selection") for a filter-empty state and keeps the original copy + "Start
  Today's Exam" CTA for a genuinely empty history. `EmptyState`
  `actionLabel`/`onAction` remain optional.
- **BUG-7** — `loading` and `isRetrying` removed from the `useHistory` return;
  both remain internal and still drive `isLoading`.

## 4. Files changed

- `src/types/error.types.ts`, `src/hooks/usePageError.ts`
- `src/components/exam/useHistory.ts`, `src/pages/user/UserHistory.tsx`
- `src/components/common/AttemptCardBase.tsx`
- `src/types/exam.types.ts`, `src/lib/repositories/attempt.repository.ts`
- `src/hooks/usePortalInit.ts`, `src/hooks/usePortalLaunch.ts`
- Consumer hooks: `useUserExams`, `useSubjectTests`, `useTopicExams`,
  `useTopics`, `useTeacherExams`, `useUserLeaderboard`, `useUserPerformance`,
  `usePrepareWrite`
- New test: `src/ds032-retry-contract.test.tsx`
- New browser harness: `playwright.config.ts`, `e2e/global-setup.ts`,
  `e2e/history-remediation.spec.ts` (`@playwright/test` added as devDependency,
  required `--legacy-peer-deps` due to a pre-existing `react-simple-maps`
  peer-conflict)

## 5. Verification

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | Pass |
| `npm run build` (`tsc -b && vite build`) | Pass (one pre-existing chunk-size warning) |
| `npx eslint` on all changed files | 0 errors (0 warnings on new/edited lines; 12 pre-existing `exhaustive-deps` warnings) |
| `npm run lint` (repo) | 331 pre-existing errors + 47 warnings, **none** in changed files (baseline) |
| `npm test` | 165 passed; 10 pre-existing `ERR_REQUIRE_ESM` pool errors (environment: `@csstools/css-calc` CJS/ESM interop via `@asamuzakjp/css-color`) |
| `ds032-retry-contract.test.tsx` | 4/4 green under `vitest.audit.config.ts` (project's audit config: happy-dom, threads pool, no tailwindcss plugin) |
| Browser checks (`npx playwright test`) | **6/6 green** — live backend, real sign-in, Edge headless; offline simulated via targeted REST aborts |

**Baseline vs regression.** All test/lint/build failures are pre-existing and
unrelated to these changes. The one delta is `src/ds032-retry-contract.test.tsx`:
it cannot start under the default `npm test` config for the same
pre-existing `ERR_REQUIRE_ESM` issue affecting 10 baseline files (which is
exactly why `vitest.audit.config.ts` exists, alongside `src/test-setup.ts`).
It is green under that config and is included in the suite.

## 6. Runtime validation

### Unit level
The retry contract's `true` / `false` / throw paths are exercised and green
(`src/ds032-retry-contract.test.tsx`, 4/4, run under `vitest.audit.config.ts`).
That test also drove one robustness improvement: a retryFn resolving `false`
without re-capturing previously left the state stuck in `'retrying'`; `retry()`
now re-asserts `state='error'` on `false` so a misbehaving consumer cannot hang
the UI in a skeleton.

### Browser level (live backend, real sign-in)
Six targeted browser checks run against the live backend as the `amar` account
via Playwright + Edge (`e2e/history-remediation.spec.ts`; `npm run dev` +
`npx playwright test`). **6/6 passed.** Network failure was simulated by
aborting the exact Supabase REST endpoints each page consumes (auth/profile
calls untouched), with a short delay so loading/skeleton transitions are
deterministically observable.

| Check | Scenario | Result |
| --- | --- | --- |
| C1 | /history initial network failure → Retry while still failing | **Pass** — stays ErrorContainer, skeleton during retry, never empty/content |
| C2 | /history Retry after network restored | **Pass** — attempts grid appears, error gone |
| C3 | /history exam selection Group 1 → Group 2 | **Pass** — filtered correctly (only the selected exam's cards) |
| C4 | /history already-reviewed card | **Pass** — "Already Reviewed", no role=button, click causes no navigation |
| C5 | /dashboard Recent Activity (shared AttemptCardBase) | **Pass** — section + cards render, un-reviewed cards still navigate to /review |
| C6 | non-history consumer: /leaderboard retry contract | **Pass** — error on failure, stays error on retry-while-failing, recovers to real leaderboard UI after restore |

Data notes (read-only probe of the account, 160 attempts, no data modified):

- The account has **zero** attempts with `review_accessed=true`, so no real
  already-reviewed card existed to click. C4 therefore rewrites the `/history`
  attempts response **in the test harness only** (every attempt marked
  reviewed) to exercise the real reviewed rendering path end-to-end. The live
  DB is unchanged; the response rewrite is browser-side and per-test.
- **Write-safety:** the one-time review gate (`useReview` →
  `markReviewAccessed`) PATCHes `attempts` when any review page loads. C5
  clicks into `/review/:id` to prove navigation works, so the suite
  intercepts every non-GET request to `/rest/v1/attempts` and fulfills it
  without forwarding (C5 even asserts the gate's write was attempted and
  blocked). A read-only probe before and after the run confirms
  `review_accessed=true` remained 0 — no live row was ever modified.
- C6's post-restore leaderboard shows the app's legitimate "No data found"
  empty state for the selected exam/paper/range (no ranking rows), not an
  error — correct non-error recovery.

No real data was created, modified, or deleted during any check.

## 7. Migration / DB audit

- No new migration; no schema writes; live DB read-only.
- `npx --no-install supabase migration list --linked`: two unapplied
  duplicate-timestamp local files observed (`20260813000001` ×2,
  `20260813000002` ×2) plus many local-only/remote-only migrations.
  Per the "doubtful → KEEP" rule, nothing was removed or altered.

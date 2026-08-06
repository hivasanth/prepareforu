# Exam Validation Inventory

**Phase 2B — Step 6 (Exam Runtime Validation).**
**Status:** IMPLEMENTED & VERIFIED — 2026-08-01. All 8 proposed fixes landed; validation suites 165/165; tsc + build + ESLint (0 new) green. See `validation-migration-report.md` A25–A34 and `exception-register.md`.
**Principle (Golden Rule):** The exam experience wins where ordinary form validation conflicts with exam usability. Every justified deviation is registered in the Exception Register.

---

## Scope

ActiveExamPage, answer selection/clearing, question navigation, FinishExamModal / submit flow, auto-submit, ReviewView, session guards, timer interactions, exam data-integrity, result parsing. Admin / Sub-Admin excluded. The broad a11y sweep (palette `aria-current`, review filter/search labels, focus restore, radiogroup semantics) is intentionally deferred to Step 7 per the approved migration order.

---

## Cross-cutting findings

- **Zod in the runtime: effectively ZERO.** The only zod in the exam runtime path is a file-local `topicUpsertSchema` (`src/lib/repositories/exam.repository.ts:270-276`) used by an admin flow — out of Step 6 scope. No shared schema from `src/validations/` is consumed by the runtime. All runtime guards are manual.
- **No shared schema exists** for `Attempt`, `AttemptAnswer`, `answers_json`, answer-write payloads, or `SubmitResult` — the runtime trusts unvalidated server/state shapes.
- **Error presentation today:** the active-exam banner already uses the certified `Alert` (`ActiveExamPage.tsx:113-119`); no `useToast` in the runtime; full-page errors use `ExamPageError` → `ErrorState` (no `role="alert"`); exam-specific status (fullscreen violation, fullscreen prompt, Telugu fallback) uses raw amber/cyan boxes — acceptable as contextual UI, but not announced (see a11y).
- **Pre-submission summary is missing:** `SubmitExamModal` declares `answeredCount`/`notVisitedCount`/`totalCount` but never renders them (`SubmitExamModal.tsx:10-12,16-21`); both consumers pass them (`ActiveExamPage.tsx:198-200`, `ExamView.tsx:216-218`). The spec-required student briefing (answered / unanswered / flagged / time) does not exist yet.
- **Stats bug:** `useExamSession.ts:56` calls `computeExamStatistics(..., new Set(), ...)` with a hardcoded empty visited set even though a real `visitedQuestions` set is tracked upstream (`ActiveExamPage.tsx:30`). Consequence: `notVisited = total` and `skipped` goes **negative** in the StatusBoard legend (`StatusBoard.tsx:49-52`).

---

## Inventory

| # | Feature | File(s) | Trigger | Current behavior | Expected | Reuse shared | Exam-specific exception |
|---|---|---|---|---|---|---|---|
| 1 | Load / resume error | `ActiveExamPage.tsx:43-51` | `error` truthy | Full-page `ExamPageError` + Retry | Keep | n/a | Yes (retry flow) |
| 2 | Silent blank page | `ActiveExamPage.tsx:75` | `!attempt \|\| !questions.length \|\| !currentQuestion` | `return null` — blank page, no error/retry | Surface a retryable error instead | No | No — reliability fix |
| 3 | Init silent returns | `useExamInitialization.ts:155,195,266` | `!user` / `!paperId` etc. | Spinner stuck forever, no error | Set error → `ExamPageError` | No | No — reliability fix |
| 4 | Resume partial-loss | `useExamInitialization.ts:124-129` | `fetchAttemptAnswers` throws | Silent `catch`, loses visited/marked/time | Log; keep graceful fallback | No | Yes (recovery must stay graceful) |
| 5 | Answer option write | `useExamSession.ts:129`, `examService.ts:354-363` | Select option | Blind cast `option as 'A'\|'B'\|'C'\|'D'`; unvalidated payload | Validate against a shared option schema at the service boundary | **Yes (new `selectedOptionSchema`)** | No |
| 6 | Answer save failure | `useExamSession.ts:135-146` | RPC rejects | Optimistic rollback + 5 s error banner (`onError`) | Keep (transient, non-modal) | Alert already | Yes (contextual banner, not inline) |
| 7 | Autosave cache sync | `useExamSession.ts:59-72`, `examService.ts:264-270` | 5 s after answers change | `catch {}` fully swallowed | Keep fire-and-forget; add log | No | Yes (must not interrupt) |
| 8 | Stats derivation | `useExamSession.ts:56` | Every render | Empty visited set → wrong `notVisited`, negative `skipped` | Pass the real `visitedQuestions` set | No | No — bug fix |
| 9 | Mark for review | `useExamSession.ts:82-110` | Toggle | Optimistic + rollback + banner | Keep | No | Yes |
| 10 | `canProceed` rule | `useQuestionNavigation.ts:59`, `QuestionNavigator.tsx:49`, `ExamView.tsx:101,205` | Next button | `hasAnswer \|\| isMarked` computed 3× | Centralize as a shared helper | **Yes** | No (rule, not field error) |
| 11 | Navigation time/visit persistence | `useQuestionNavigation.ts:67-79,87-101,105-131` | Navigate / mount | Non-stale failures → `console.warn` only | Keep (silent to user by design); add log | No | Yes |
| 12 | Final submit | `useExamSubmission.ts:54-90` | "Submit & Review" | RPC + failure banner; no retry button | Keep (banner + reopen modal) | Alert already | Yes |
| 13 | Auto submit (timer expiry) | `useExamSubmission.ts:92-99`, `SubmitExamModal.tsx:22-43` | `onTimeUp` | Non-dismissable "Time's Up!" modal, 2 s → submit | Keep unchanged | n/a | Yes |
| 14 | Pre-submission summary | `SubmitExamModal.tsx:6-21`, `ActiveExamPage.tsx:194-202` | Finish / Submit | **Summary never rendered** (dead props) | Render answered / unanswered / flagged counts (+ time if available) with live-region | No (exam-specific UI) | Yes — but feature is missing, so add it |
| 15 | Tab-switch limit | `ExamTimer.tsx:97-131` | `visibilitychange` | Threshold 5 → auto-submit; ≥3 → warning | Keep; log service failure | No | Yes |
| 16 | Fullscreen exit | `useExamSecurity.ts:41-46`, `StatusBoard.tsx:56-66`, `ExamLayout.tsx:17-34` | `fullscreenchange` | Contextual raw warning box + prompt | Keep contextual (NOT forced to Alert); add `role="alert"` (Step 7 for the box) | No | Yes |
| 17 | Result parsing | `useResults.ts:10-31` | `location.state.result` | Manual `any` parsing; string-concatenation hazard (`"5"+3`) | Parse via a shared `submitResultSchema` | **Yes (new schema)** | No |
| 18 | Review one-time gate | `useReview.ts:34-43` | `review_accessed === true` | Full-page error; `markReviewAccessed` throw = **unhandled rejection** | Wrap write in try/catch | No | Yes |
| 19 | EN-field integrity | `examService.ts:150`, `languageUtils.ts:161-172` | Post-fetch | Manual `assertValidEnFields` duplicates `SingleQuestionSchema`/`BulkQuestionSchema` EN rules | Extract shared EN-field schema; both derive from it | **Yes** | No |
| 20 | History/availability | `useHistory.ts`, `examService.ts:428-458` | Load / availability check | Trusts payloads; fail-open; mislabels all errors `network` | Note only (out of Step 6 core) | No | Yes |

---

## Bug fixes proposed (reliability, no UX redesign)

1. **Stats bug (8):** pass `visitedQuestions` into `useExamSession` so `examStats` (StatusBoard legend + submit counts) are correct.
2. **Pre-submission summary (14):** render answered / not-visited / marked-for-review counts in the manual-submit modal; add `markedCount` prop; keep the auto-submit variant unchanged.
3. **Silent blank page / stuck spinners (2, 3):** surface a retryable `ExamPageError` instead of `return null` / stuck spinner.
4. **Unhandled rejection (18):** try/catch around `markReviewAccessed`.
5. **`canProceed` centralization (10):** single derived helper (no behavior change).
6. **Result parsing (17):** shared `submitResultSchema` replaces manual `any` parsing.
7. **Answer-option rule (5):** shared `selectedOptionSchema` (`A`–`D`) enforced at the service boundary; replaces blind casts.
8. **EN-field rule (19):** extract shared `questionEnFieldsSchema`; `assertValidEnFields` and the question schemas derive from it (messages preserved).

## Registered exam-specific exceptions (do NOT force the standard)

Timer countdown · time expiry / auto-submit · unanswered-question summary · tab-switch limit · fullscreen exit / prompt · security notices · Telugu-fallback boxes · transient save-failure banner · silent autosave · navigation time/visit persistence · session expiry auto-submit · one-time review gate. Full justifications in the Exception Register.

## Deferred to Step 7 (a11y sweep)

`role="alert"` on full-page error/`ErrorState` · `role="timer"`/announcements · palette `aria-current` · review search label + filter `aria-pressed` · QuestionActions radiogroup label · focus restore on modal close · announce correct/wrong in review mode · submit-overlay ARIA · loading `role="status"`.

**Step 7 COMPLETE — 2026-08-01.** All items implemented across 25 files (palette `aria-current` + group semantics; nav landmark + collapse toggle; review search/filter labels; answer-option + language radiogroups; `AdminModal` focus restore; `role="alert"` on `ErrorState` + fullscreen prompt/violation (E5); loading `role="status"` on 4 components; review sr-only correctness labels; 17 tab lists labelled; mobile drawer dialog + `inert`). See `accessibility-report.md` (v1.0.0) and migration report A35.

## Verification (after implementation)

`npx tsc -b` · `npm run build` · ESLint on touched files · `npx vitest run src/validations` (+ new schema suites) · manual scenarios: start, resume, navigate, save/clear answer, mark for review, finish, submit, auto-submit, session expiry, timer expiry, refresh recovery, network/API failure.

- `npx tsc -b` — clean.
- `npm run build` — exit 0 (only pre-existing chunk-size notices).
- `npx vitest run src/validations` — 165/165 pass (13 new: `selectedOptionSchema`, `questionEnFieldsSchema`, `submitResultSchema`).
- ESLint on all 16 touched files — 0 new errors/warnings (remaining findings all pre-existing exam-runtime baseline debt: `no-explicit-any`, `set-state-in-effect`, `prefer-const`, empty `catch`, `exhaustive-deps`, `purity`).
- Manual scenarios: start / resume / navigate / save-clear / mark / finish / submit / auto-submit / session expiry / timer expiry / refresh recovery / network+API failure — all preserved except the intended fixes (blank-page → retryable error, stats/visited-set correction, submit summary shown, invalid-link errors, guarded review write, option-rule at service boundary).

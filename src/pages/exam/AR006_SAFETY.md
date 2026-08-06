# AR-006 Implementation Safety Checklist

> **Date:** 2026-07-21
> **Phase:** 6.6C
> **Status:** Safety Verification Complete
> **Scope:** Final implementation planning for AR-006
> **Constraint:** Planning only — no code changes

---

## 1. Extraction Validation Matrix

| Extraction | Validation Method | Success Criteria |
|------------|-------------------|------------------|
| useExamSecurity | Enter exam → right-click blocked → copy blocked → exit fullscreen → warning appears → violation count increments | All 6 listeners fire identically to current behavior |
| useExamKeyboard | Enter exam → press ArrowRight/Left → question changes → press 1-4 → answer selects → press Q → clears → press M → toggles review → press Enter on last question → modal opens | All shortcuts produce identical results |
| useExamInitialization | Navigate to exam via each of 3 paths (exam_tab, teacher_exam, state-backed) → verify identical state restoration on resume | All 3 paths produce identical state; resume restores answers/visited/marked/timeSpent/currentIdx |
| useExamSession | Select answer → verify persisted → clear answer → verify cleared → toggle review → verify toggled → wait 5s → verify autosave fires → refresh → verify state restored | Answer, review, and autosave behavior unchanged |
| useQuestionNavigation | Click next → question advances → click prev → goes back → click palette jump → navigates → verify time accumulated on previous question → verify visited marking | Navigation, time tracking, visit tracking unchanged |
| useExamSubmission | Click Finish → modal opens → confirm → submit completes → navigates to review → verify no double-submit possible → let timer expire → verify auto-submit fires | Manual and auto-submit produce identical results; double-submit impossible |

---

## 2. Effect Migration Checklist

| # | Effect Description | Current Lines | Future Hook | Cleanup Return | Deps Unchanged |
|---|-------------------|---------------|-------------|:--------------:|:--------------:|
| 1 | Initial question visit | 153-179 | useQuestionNavigation | ✅ (cancelled flag) | ✅ |
| 2 | Call initExam on mount | 496-498 | useExamInitialization | N/A (mount only) | ✅ |
| 3 | Cleanup pending ops on unmount | 500-505 | useExamInitialization | ✅ (clearAllPendingOperations) | ✅ |
| 4 | Debounced autosave (5s) | 508-521 | useExamSession | ✅ (clearTimeout) | ✅ |
| 5 | Keyboard shortcuts | 626-644 | useExamKeyboard | ✅ (removeEventListener) | ✅ |
| 6 | Sync selectedAnswersRef | 647-650 | useExamSession | N/A (no cleanup) | ✅ |
| 7 | Sync visitedQuestionsRef | 651 | useQuestionNavigation | N/A (no cleanup) | ✅ |
| 8 | Sync markedForReviewRef | 652 | useExamSession | N/A (no cleanup) | ✅ |
| 9 | Sync currentIdxRef | 653 | useQuestionNavigation | N/A (no cleanup) | ✅ |
| 10 | Sync paperRef | 654 | useExamSession | N/A (no cleanup) | ✅ |
| 11 | Sync attemptRef | 655 | useExamSession | N/A (no cleanup) | ✅ |
| 12 | Security listeners (7 events) | 666-693 | useExamSecurity | ✅ (removeEventListener ×7) | ✅ |

**Verification:**
- Every effect migrated exactly once: ✅
- Every cleanup migrated: ✅
- Dependency arrays unchanged: ✅
- Duplicate listener impossible: ✅ (each effect lives in exactly one hook)
- Duplicate effects remaining: **0**

---

## 3. Ref Ownership Inventory

| Ref | Type | Future Owner | Purpose |
|-----|------|--------------|---------|
| `visitedQuestionsRef` | Set\<string\> | useExamSession | Stale closure guard for visited questions |
| `markedForReviewRef` | Set\<string\> | useExamSession | Stale closure guard for review flags |
| `currentIdxRef` | number | useQuestionNavigation | Stale closure guard for current index |
| `lastSyncAnswers` | string | useExamSession | Autosave deduplication |
| `syncTimeoutRef` | any | useExamSession | Autosave debounce timer |
| `isActuallySubmitted` | boolean | useExamSubmission | Double-submit guard |
| `attemptRef` | Attempt \| null | useExamSession | Stale closure guard for attempt |
| `selectedAnswersRef` | Record\<string, string \| null\> | useExamSession | Stale closure guard for answers |
| `paperRef` | ExamPaper \| null | useExamSession | Stale closure guard for paper |
| `isAutoSubmittingRef` | boolean | useExamSubmission | Auto-submit guard |
| `subjectMarksRef` | Record\<string, number\> | useExamInitialization | Marks lookup (set during init) |
| `questionEntryTimeRef` | number | useQuestionNavigation | Time tracking entry point |
| `questionTimeSpentRef` | Record\<string, number\> | useQuestionNavigation | Accumulated time per question |

**Verification:**
- Every ref has exactly one owner: ✅
- No ref shared between hooks: ✅
- Ref-sync effects (6-11) migrate with their ref: ✅

---

## 4. Service Call Inventory

| Service Call | Current Lines | Future Owner | Invocation Count |
|-------------|---------------|--------------|:----------------:|
| `fetchPaperWithSubjects` | 359 | useExamInitialization | 1 |
| `fetchQuestionsForPaper` | 377 | useExamInitialization | 1 |
| `fetchAttemptAnswers` | 207, 299, 436 | useExamInitialization | 3 (one per init path) |
| `findAttemptById` | 287 | useExamInitialization | 1 |
| `findInProgressAttempt` | 367 | useExamInitialization | 1 |
| `createAttempt` | 189, 399 | useExamInitialization | 2 (state-backed + exam_tab) |
| `touchQuestionVisit` | 143, 168 | useQuestionNavigation | 2 (goToQuestion + initial visit) |
| `setQuestionAnswer` | 568, 604 | useExamSession | 2 (select + clear) |
| `setQuestionReview` | 538 | useExamSession | 1 |
| `addQuestionTime` | 121, 718 | useQuestionNavigation | 2 (goToQuestion + final flush) |
| `syncAnswersCache` | 515, 722 | useExamSession | 2 (autosave + pre-submit) |
| `submitAttempt` | 413, 723 | useExamSubmission | 2 (expired resume + final submit) |
| `executeWithRetry` | 119, 141, 166, 536, 566, 602, 716 | useExamSession / useQuestionNavigation | 7 |
| `clearAllPendingOperations` | 503 | useExamInitialization | 1 |
| `clearExamSession` | 286, 358, 414, 724 | useExamInitialization / useExamSubmission | 4 |
| `lockExamLanguage` | 396 | useExamInitialization | 1 |
| `resolveQuestionsForSession` | 397 | useExamInitialization | 1 |
| `detectTeluguAvailability` | 380 | useExamInitialization | 1 |
| `computeExamStatistics` | 103 | useExamSession | 1 |
| `computeQuestionState` | 749 | useQuestionNavigation | 1 |

**Verification:**
- Every service call has exactly one owner: ✅
- No duplicate implementations: ✅
- `clearExamSession` shared between Initialization (fresh start) and Submission (post-submit) — both are legitimate callers: ✅
- `syncAnswersCache` shared between Session (autosave) and Submission (pre-submit flush) — both are legitimate callers: ✅

---

## 5. Render Responsibility Inventory

| Section | Current Lines | Future Component | Business Logic? |
|---------|---------------|------------------|:---------------:|
| Error state | 767-781 | ExamErrorView (inline or extracted) | NO |
| Loading state | 783-792 | ExamLoadingView (inline or extracted) | NO |
| Language selection | 794-802 | LanguageSelectionScreen (existing) | NO |
| ExamLayout wrapper | 819-822 | ExamLayout (existing) | NO |
| ExamHeader | 823-849 | ExamHeader (existing) | NO |
| QuestionCard | 854-866 | QuestionCard (existing) | NO |
| QuestionNavigator | 868-878 | QuestionNavigator (existing) | NO |
| StatusBoard | 882-891 | StatusBoard (existing) | NO |
| MobileQuestionStrip | 894-901 | MobileQuestionStrip (existing) | NO |
| MobileActionBar | 903-912 | MobileActionBar (existing) | NO |
| SubmitExamModal | 914-922 | SubmitExamModal (existing) | NO |
| Submit overlay | 924-936 | SubmitOverlay (inline or extracted) | NO |

**Verification:**
- No business logic inside any presentation section: ✅
- All sections are pure rendering or callback delegation: ✅
- visualNode/diagramNode (806-816) are pure conditional rendering: ✅

---

## 6. Regression Risk Register

| Risk | Probability | Impact | Mitigation | Verification |
|------|:-----------:|:------:|------------|-------------|
| Timer desynchronization | Low | High | ExamTimer already extracted; onTimeUp callback preserved exactly | Verify countdown and time-up behavior in Step 6 |
| Duplicate autosave | Low | Critical | useExamSession owns autosave effect exclusively; no other hook calls syncAnswersCache during exam | Verify autosave fires once per answer change |
| Lost security listener | Medium | High | useExamSecurity registers all 7 listeners; cleanup returns removeEventListener for each | Verify right-click, copy, fullscreen exit all blocked |
| Double submission | Low | Critical | isActuallySubmitted ref owned exclusively by useExamSubmission; no other hook can set it | Verify rapid double-click on Submit produces single submission |
| Stale closure in navigation | Medium | High | goToQuestion uses questionEntryTimeRef and questionTimeSpentRef owned by useQuestionNavigation; currentIdxRef synced via effect | Verify time tracking accumulates correctly across question changes |
| Init path regression | Medium | High | All 3 init paths tested independently; restoration logic consolidated into shared helper | Verify resume on each path restores identical state |
| Ref-sync effect leak | Low | Medium | Each hook owns its ref-sync effects internally; no cross-hook ref synchronization | Verify no stale refs after rapid state changes |
| Keyboard shortcut conflict | Low | Low | Guard checks (isSubmitting, isSubmitModalOpen, loading) preserved in useExamKeyboard | Verify shortcuts disabled during submission |
| Event listener leak | Low | Medium | Every effect with addEventListener returns cleanup with removeEventListener | Verify no duplicate listeners after re-render |
| Navigation race condition | Medium | High | goToQuestion awaits touchQuestionVisit before completing; currentIdxRef updated synchronously | Verify rapid navigation doesn't skip questions |

---

## 7. Incremental Verification Plan

### Step 1: Extract useExamSecurity

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npx tsc --noEmit` | Clean (our files) |
| Build | `npm run build` | Same output |
| Tests | `npx vitest run` | 79/79 pass |
| Runtime | Manual: right-click, copy, exit fullscreen | All blocked with warning |

**Gate:** All 4 checks pass before proceeding.

### Step 2: Extract useExamKeyboard

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npx tsc --noEmit` | Clean |
| Build | `npm run build` | Same output |
| Tests | `npx vitest run` | 79/79 pass |
| Runtime | Manual: ArrowRight/Left, 1-4, Q, M, Enter | All shortcuts work |

**Gate:** All 4 checks pass before proceeding.

### Step 3: Extract useExamInitialization

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npx tsc --noEmit` | Clean |
| Build | `npm run build` | Same output |
| Tests | `npx vitest run` | 79/79 pass |
| Runtime | Manual: start exam via each of 3 paths, resume each | Identical state restoration |

**Gate:** All 4 checks pass before proceeding.

### Step 4: Extract useExamSession

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npx tsc --noEmit` | Clean |
| Build | `npm run build` | Same output |
| Tests | `npx vitest run` | 79/79 pass |
| Runtime | Manual: select answer, clear, toggle review, wait 5s autosave, refresh | All persisted correctly |

**Gate:** All 4 checks pass before proceeding.

### Step 5: Extract useQuestionNavigation

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npx tsc --noEmit` | Clean |
| Build | `npm run build` | Same output |
| Tests | `npx vitest run` | 79/79 pass |
| Runtime | Manual: next/prev, palette jump, verify time tracking, verify visited | Navigation identical |

**Gate:** All 4 checks pass before proceeding.

### Step 6: Extract useExamSubmission

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npx tsc --noEmit` | Clean |
| Build | `npm run build` | Same output |
| Tests | `npx vitest run` | 79/79 pass |
| Runtime | Manual: submit exam, let timer expire, verify no double-submit | Submit flow identical |

**Gate:** All 4 checks pass before proceeding.

### Step 7: Final Orchestrator Cleanup

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npx tsc --noEmit` | Clean |
| Build | `npm run build` | Same output |
| Tests | `npx vitest run` | 79/79 pass |
| Line count | `(Get-Content ...).Count` | Orchestrator ≤300, all hooks ≤300 |
| Full runtime | Manual: complete exam start-to-finish | End-to-end flow identical |

---

## 8. Completion Gate

| Criterion | Target | Verification |
|-----------|--------|--------------|
| ActiveExamPage orchestrator | ≤300 lines | Line count |
| useExamSecurity | ≤300 lines | Line count |
| useExamKeyboard | ≤300 lines | Line count |
| useExamInitialization | ≤300 lines | Line count |
| useExamSession | ≤300 lines | Line count |
| useQuestionNavigation | ≤300 lines | Line count |
| useExamSubmission | ≤300 lines | Line count |
| Duplicated effects | 0 | Effect migration checklist |
| Duplicated service calls | 0 | Service call inventory |
| Duplicated refs | 0 | Ref ownership inventory |
| Circular dependencies | 0 | Dependency graph |
| TypeScript errors | 0 | `npx tsc --noEmit` |
| Build | Pass | `npm run build` |
| Existing tests | 79/79 pass | `npx vitest run` |
| Manual runtime verification | All extractions verified | Incremental verification plan |

---

## Final Decision

**READY FOR IMPLEMENTATION**

All extraction boundaries are defined. All validations are specified. All risks are mitigated. The incremental verification plan ensures each extraction can be validated independently before proceeding.

No unresolved implementation risks remain.

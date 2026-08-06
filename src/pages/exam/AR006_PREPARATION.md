# AR-006 Preparation — ActiveExamPage Architectural Inventory

> **Date:** 2026-07-21
> **Phase:** 6.6A
> **Status:** Analysis Complete
> **Scope:** `src/pages/exam/ActiveExamPage.tsx` (939 lines)
> **Constraint:** Analysis only — no code changes

---

## 1. Responsibility Map

| Domain | Current Responsibility | Candidate Extraction | Dependencies |
|--------|------------------------|----------------------|-------------|
| Session lifecycle | Exam init, resume, restore, completion | useExamSession | examService, examSessionStore |
| Timer | Countdown, expiry, warnings | ExamTimer (already extracted) | useExamSession |
| Question navigation | Previous/Next, jump, time tracking | useQuestionNavigation | useExamSession |
| Answer management | Save/update/clear answers | useExamSession | examService |
| Review toggle | Mark/unmark for review | useExamSession | examService |
| Security | Fullscreen, tab switch, copy prevention, context menu | useExamSecurity | — |
| Keyboard shortcuts | Navigation shortcuts | useExamKeyboard | useQuestionNavigation, useExamSession |
| Submission | Submit exam, auto-submit, time-up | useExamSubmission | useExamSession |
| Initialization | 3 init paths (exam_tab, teacher_exam, state-backed) | useExamSession | examService, examSessionStore |
| Autosave | Debounced answer sync | useExamSession | examService |
| Presentation | Rendering/UI | Presentation Components | — |

---

## 2. State Inventory

### useState (19 variables)

| Variable | Type | Current Purpose | Proposed Owner |
|----------|------|-----------------|----------------|
| `loading` | boolean | Init loading gate | useExamSession |
| `paper` | ExamPaper \| null | Paper metadata | useExamSession |
| `attempt` | Attempt \| null | Attempt record | useExamSession |
| `questions` | Question[] | Active question list | useExamSession |
| `currentIdx` | number | Current question index | useQuestionNavigation |
| `selectedAnswers` | Record<string, string \| null> | Answer map | useExamSession |
| `isSubmitting` | boolean | Submit in progress | useExamSubmission |
| `isSubmitModalOpen` | boolean | Modal visibility | useExamSubmission |
| `isAutoSubmitting` | boolean | Auto-submit in progress | useExamSubmission |
| `showFullscreenPrompt` | boolean | Fullscreen prompt visibility | useExamSecurity |
| `error` | string \| null | Error message | useExamSession |
| `displayLang` | 'en' \| 'te' | Display language | useExamSession |
| `fullscreenViolations` | number | Violation count | useExamSecurity |
| `visitedQuestions` | Set<string> | Visited question IDs | useExamSession |
| `markedForReview` | Set<string> | Review-marked IDs | useExamSession |
| `phase` | 'loading' \| 'lang_select' \| 'exam' | Init phase | useExamSession |
| `rawQuestions` | Question[] | Pre-resolved questions | useExamSession |
| `teluguAvailable` | boolean | Telugu availability | useExamSession |
| `initComplete` | boolean | Init gate | useExamSession |

### useRef (13 refs)

| Ref | Type | Current Purpose | Proposed Owner |
|-----|------|-----------------|----------------|
| `visitedQuestionsRef` | Set<string> | Stale closure guard | useExamSession |
| `markedForReviewRef` | Set<string> | Stale closure guard | useExamSession |
| `currentIdxRef` | number | Stale closure guard | useQuestionNavigation |
| `lastSyncAnswers` | string | Autosave dedup | useExamSession |
| `syncTimeoutRef` | any | Autosave debounce | useExamSession |
| `isActuallySubmitted` | boolean | Submit guard | useExamSubmission |
| `attemptRef` | Attempt \| null | Stale closure guard | useExamSession |
| `selectedAnswersRef` | Record<string, string \| null> | Stale closure guard | useExamSession |
| `paperRef` | ExamPaper \| null | Stale closure guard | useExamSession |
| `isAutoSubmittingRef` | boolean | Auto-submit guard | useExamSubmission |
| `subjectMarksRef` | Record<string, number> | Marks lookup | useExamSession |
| `questionEntryTimeRef` | number | Time tracking | useQuestionNavigation |
| `questionTimeSpentRef` | Record<string, number> | Time accumulator | useQuestionNavigation |

### Derived Values

| Variable | Type | Computed From | Proposed Owner |
|----------|------|---------------|----------------|
| `examSource` | string | location.state | useExamSession |
| `showSubjectName` | boolean | location.state | useExamSession |
| `currentQuestion` | Question \| undefined | questions[currentIdx] | useQuestionNavigation |
| `isLastQuestion` | boolean | currentIdx === questions.length - 1 | useQuestionNavigation |
| `isFirstQuestion` | boolean | currentIdx === 0 | useQuestionNavigation |
| `examStats` | object | questions, answers, marks, visited | useExamSession |
| `currentQState` | object | currentQuestion, answers, marks | useQuestionNavigation |
| `hasAnswer` | boolean | currentQState | useQuestionNavigation |
| `isMarked` | boolean | currentQState | useQuestionNavigation |
| `canProceed` | boolean | hasAnswer \|\| isMarked | useQuestionNavigation |

---

## 3. Effect Inventory

| # | Lines | Trigger | Dependencies | Purpose | Candidate Owner |
|---|-------|---------|-------------|---------|----------------|
| 1 | 153-179 | currentIdx, currentQuestion?.id, initComplete | Mark first question visited | useQuestionNavigation |
| 2 | 496-498 | initExam | Call initExam on mount | useExamSession |
| 3 | 500-505 | attempt?.id, initComplete | Cleanup pending ops on unmount | useExamSession |
| 4 | 508-521 | selectedAnswers, attempt?.id, loading, initComplete | Debounced autosave (5s) | useExamSession |
| 5 | 626-644 | currentIdx, questions.length, isLastQuestion, isSubmitting, isSubmitModalOpen, loading, goToQuestion, handleOptionSelect, clearAnswer, toggleMarkForReview, initComplete | Keyboard shortcuts | useExamKeyboard |
| 6 | 647-650 | selectedAnswers, initComplete | Sync selectedAnswersRef | useExamSession |
| 7 | 651 | visitedQuestions, initComplete | Sync visitedQuestionsRef | useExamSession |
| 8 | 652 | markedForReview, initComplete | Sync markedForReviewRef | useExamSession |
| 9 | 653 | currentIdx, initComplete | Sync currentIdxRef | useQuestionNavigation |
| 10 | 654 | paper, initComplete | Sync paperRef | useExamSession |
| 11 | 655 | attempt, initComplete | Sync attemptRef | useExamSession |
| 12 | 666-693 | loading, attempt?.id, showToast, initComplete | Security listeners (contextmenu, copy, paste, fullscreen, beforeunload) | useExamSecurity |

**Observations:**
- Effects 6-11 are ref-sync effects (6 total). These are necessary for stale closure prevention but could be consolidated or managed internally by each hook.
- Effect 4 (autosave) overlaps with Effect 3 (cleanup). Both belong to useExamSession.
- Effect 1 (initial visit) overlaps with goToQuestion's visit logic. Both belong to useQuestionNavigation.

---

## 4. Event Handler Inventory

### Navigation Handlers

| Handler | Lines | Responsibility | Future Owner |
|---------|-------|---------------|-------------|
| `goToQuestion` | 106-151 | Navigate to question, persist time, mark visited | useQuestionNavigation |
| `handleNext` | 754-756 | Next question (if canProceed) | useQuestionNavigation |
| `handleSkip` | 758-760 | Skip question (if no answer) | useQuestionNavigation |
| `handlePrev` | 762-764 | Previous question | useQuestionNavigation |

### Answer Handlers

| Handler | Lines | Responsibility | Future Owner |
|---------|-------|---------------|-------------|
| `handleOptionSelect` | 555-589 | Select answer, persist, rollback on error | useExamSession |
| `clearAnswer` | 591-623 | Clear answer, persist, rollback on error | useExamSession |
| `toggleMarkForReview` | 524-552 | Toggle review flag, persist, rollback | useExamSession |

### Submission Handlers

| Handler | Lines | Responsibility | Future Owner |
|---------|-------|---------------|-------------|
| `finalSubmit` | 695-738 | Submit exam, flush time, navigate to review | useExamSubmission |
| `onTimeUp` | 740-746 | Auto-submit on timer expiry | useExamSubmission |

### Security Handlers

| Handler | Lines | Responsibility | Future Owner |
|---------|-------|---------------|-------------|
| `requestFullscreen` | 658-664 | Request fullscreen mode | useExamSecurity |

### Init Handlers

| Handler | Lines | Responsibility | Future Owner |
|---------|-------|---------------|-------------|
| `initExam` | 275-390 | Main init logic (3 paths) | useExamSession |
| `initStateBackedExam` | 182-273 | State-backed init | useExamSession |
| `_startExam` | 392-490 | Exam-tab init | useExamSession |
| `handleLanguageSelect` | 492-494 | Language selection | useExamSession |

---

## 5. Dependency Graph

```
ActiveExamPage (orchestrator)
├── useExamSession
│   ├── examService (fetchPaperWithSubjects, createAttempt, etc.)
│   ├── examSessionStore (lockExamLanguage, clearExamSession, etc.)
│   └── types (Question, Attempt, ExamPaper)
├── useQuestionNavigation
│   ├── useExamSession (questions, currentIdx, attempt)
│   └── examService (touchQuestionVisit, addQuestionTime)
├── useExamSecurity
│   └── (no data dependencies — event listeners only)
├── useExamKeyboard
│   ├── useQuestionNavigation (goToQuestion, handleNext, etc.)
│   └── useExamSession (handleOptionSelect, clearAnswer, toggleMarkForReview)
├── useExamSubmission
│   ├── useExamSession (attempt, selectedAnswers, questions)
│   └── examService (submitAttempt, syncAnswersCache)
└── Presentation Components
    ├── ExamLayout
    ├── ExamHeader
    ├── QuestionCard
    ├── QuestionNavigator
    ├── StatusBoard
    ├── MobileQuestionStrip
    ├── MobileActionBar
    └── SubmitExamModal
```

**Dependency direction:** Session → Navigation → Keyboard; Security → (independent); Submission → Session. No circular dependencies.

---

## 6. Component Extraction Candidates

| Section | Lines | Candidate Component | Safe to Extract? |
|---------|-------|--------------------|:-----------------:|
| Error state (767-781) | 15 | ExamErrorView | ✓ |
| Loading state (783-792) | 10 | ExamLoadingView | ✓ |
| Language select (794-802) | 9 | (already extracted: LanguageSelectionScreen) | ✓ |
| Question area (852-879) | 28 | QuestionArea (wraps QuestionCard + QuestionNavigator) | ✓ |
| Submit overlay (924-936) | 13 | SubmitOverlay | ✓ |
| Main exam render (818-937) | 120 | (orchestrator JSX — simplified with hooks) | ✓ |

**Note:** Most UI is already extracted into components (ExamHeader, QuestionCard, QuestionNavigator, StatusBoard, MobileQuestionStrip, MobileActionBar, SubmitExamModal). The orchestrator JSX is already relatively lean (~120 lines of composition).

---

## 7. Hook Extraction Candidates

### useExamSession

| Aspect | Details |
|--------|---------|
| **Owned state** | loading, paper, attempt, questions, selectedAnswers, error, displayLang, visitedQuestions, markedForReview, phase, rawQuestions, teluguAvailable, initComplete |
| **Owned refs** | visitedQuestionsRef, markedForReviewRef, attemptRef, selectedAnswersRef, paperRef, subjectMarksRef, lastSyncAnswers, syncTimeoutRef |
| **Owned effects** | initExam (effect), cleanup (effect), autosave (effect), 4 ref-sync effects |
| **Owned handlers** | initExam, initStateBackedExam, _startExam, handleLanguageSelect, handleOptionSelect, clearAnswer, toggleMarkForReview |
| **External deps** | examService, examSessionStore, useToast, useAuth, useParams, useLocation |
| **Estimated size** | ~350 lines |

### useQuestionNavigation

| Aspect | Details |
|--------|---------|
| **Owned state** | currentIdx |
| **Owned refs** | currentIdxRef, questionEntryTimeRef, questionTimeSpentRef |
| **Owned effects** | Initial visit effect, ref-sync effect |
| **Owned handlers** | goToQuestion, handleNext, handleSkip, handlePrev |
| **External deps** | useExamSession (questions, attempt, visitedQuestions, markedForReview, selectedAnswers) |
| **Estimated size** | ~120 lines |

### useExamSecurity

| Aspect | Details |
|--------|---------|
| **Owned state** | showFullscreenPrompt, fullscreenViolations |
| **Owned effects** | Security listeners effect |
| **Owned handlers** | requestFullscreen |
| **External deps** | useToast |
| **Estimated size** | ~50 lines |

### useExamKeyboard

| Aspect | Details |
|--------|---------|
| **Owned state** | (none) |
| **Owned effects** | Keyboard shortcuts effect |
| **Owned handlers** | handleKeyDown (inline) |
| **External deps** | useQuestionNavigation, useExamSession |
| **Estimated size** | ~30 lines |

### useExamSubmission

| Aspect | Details |
|--------|---------|
| **Owned state** | isSubmitting, isSubmitModalOpen, isAutoSubmitting |
| **Owned refs** | isActuallySubmitted, isAutoSubmittingRef |
| **Owned handlers** | finalSubmit, onTimeUp |
| **External deps** | useExamSession, examService, useNavigate, useToast |
| **Estimated size** | ~80 lines |

---

## 8. Complexity Analysis

| Metric | Count |
|--------|------:|
| Total lines | 939 |
| useState | 19 |
| useRef | 13 |
| useEffect | 12 |
| useCallback | 13 |
| useMemo | 0 |
| Total hooks | 57 |
| Handler functions | 12 |
| Helper functions | 0 |
| Import statements | 15 |

**Largest logical region:** Initialization (lines 182-490) — 308 lines, 3 init paths, duplicated state restoration logic.

**Most coupled region:** goToQuestion (lines 106-151) — touches time tracking, visit tracking, navigation, and persistence.

**Highest-risk extraction:** useExamSession — owns 13 state variables, 8 refs, 6 effects, and 4 handlers. Must be extracted as a cohesive unit.

---

## 9. Extraction Order

### Step 1: Extract useExamSecurity (lowest risk, zero data dependencies)

Extract fullscreen, copy/paste, context menu, beforeunload listeners.

**Why first:** No dependencies on other hooks. Self-contained. Easy to verify. Reduces main component by ~50 lines.

### Step 2: Extract useExamKeyboard (depends on Step 1 conceptually)

Extract keyboard shortcut handler.

**Why second:** Depends on navigation and answer handlers (which stay in orchestrator initially). Self-contained effect. Reduces main component by ~30 lines.

### Step 3: Extract useExamSubmission (depends on useExamSession)

Extract submit flow, auto-submit, time-up handling.

**Why third:** Depends on attempt, answers, questions from useExamSession. Must be extracted after session hook exists.

### Step 4: Extract useQuestionNavigation (depends on useExamSession)

Extract navigation, time tracking, visit tracking.

**Why fourth:** Heavily depends on useExamSession (questions, attempt, visitedQuestions, markedForReview). Must be extracted after session hook.

### Step 5: Extract useExamSession (largest, most complex)

Extract all session state, init logic, answer management, autosave.

**Why fifth:** This is the foundation. All other hooks depend on it. Extract last because it's the riskiest and most complex.

### Step 6: Extract presentation components (if needed)

Extract ExamErrorView, ExamLoadingView, SubmitOverlay.

**Why last:** Lowest risk. Pure presentation. Can be done after all hooks are stable.

### Step 7: Final orchestrator cleanup

Remove dead code, verify line count, run tests.

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|:----------:|:------:|------------|
| Stale closures in navigation | High | High | Preserve ref pattern; each hook owns its refs |
| Timer synchronization | Medium | High | ExamTimer already extracted; onTimeUp callback preserved |
| Security listener duplication | Low | Medium | Extract to single hook; verify cleanup returns |
| Init state restoration duplication | High | Medium | Consolidate 3 init paths into useExamSession |
| Autosave race conditions | Medium | Medium | Preserve existing debounce + dedup pattern |
| Keyboard shortcut conflicts | Low | Low | Preserve existing guard checks (isSubmitting, isSubmitModalOpen) |
| Navigation regressions | Medium | High | Preserve exact goToQuestion logic including time tracking |
| Ref-sync effects | Low | Low | Each hook manages its own ref-sync internally |
| Breaking submit flow | Medium | Critical | Preserve isActuallySubmitted guard pattern |
| Event listener leaks | Low | Medium | Each hook returns cleanup functions |

---

## 11. Success Criteria

AR-006 implementation must not begin until all of the following are true:

- [x] Every state variable has exactly one future owner (documented above)
- [x] Every effect has exactly one future owner (documented above)
- [x] Every handler has exactly one future owner (documented above)
- [x] Every responsibility has exactly one future owner (documented above)
- [x] Component extraction candidates are documented
- [x] Hook extraction candidates are documented
- [x] Dependency graph is acyclic
- [x] Business logic is separated from presentation
- [x] No unresolved ownership conflicts remain

---

## Final Recommendation

**AR-006 is ready to begin.**

All state, effects, handlers, and responsibilities have been assigned to exactly one future owner. The dependency graph is acyclic. The extraction order is safe (security → keyboard → submission → navigation → session → presentation).

The primary complexity is in `useExamSession` (350 lines, 13 state vars, 8 refs, 6 effects, 4 handlers). This should be extracted last to minimize risk.

The 3 duplicated init paths (exam_tab, teacher_exam, state-backed) should be consolidated into a single `initExam` function inside `useExamSession`, with the restoration logic extracted into a shared helper.

No additional architectural decisions are required.

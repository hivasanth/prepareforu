# User Prepare & Write Feature

## Purpose

Provides a complete exam preparation and simulation workflow: select an exam paper, preview questions in preparation mode, take a timed exam, view results, and review answers with diagnostic filtering.

## Workflow

```
SELECTION → PREPARATION → EXAM → RESULT → REVIEW
                ↓                        ↓
           (preview questions)    (diagnostic review)
```

1. **Selection** — User picks an exam and paper. Availability is checked. Loading/error/empty states handled.
2. **Preparation** — All questions displayed with bilingual toggle, difficulty indicators, explanations, and visual/diagram rendering. "Start Full Exam" button begins timed exam.
3. **Exam** — Timed exam with question navigation, answer selection, mark-for-review, fullscreen toggle, status board, mobile action bar, and submit modal.
4. **Result** — Score summary with correct/incorrect/accuracy stats. Options to review or start new session.
5. **Review** — Diagnostic review with filter-by-status (all/correct/wrong/skipped/not_visited) and search. Bilingual question display.

## Architecture

```
UserPrepareWrite (page — composition only, 160 lines)
  ├── usePrepareWrite (hook — workflow orchestration, 220 lines)
  │     ├── useAuth (user context)
  │     ├── useStableFetch (stale request protection)
  │     ├── useToast (user feedback toasts)
  │     ├── usePageError (centralized error handling)
  │     ├── sessionStorage persistence (SessionState)
  │     ├── prepareWriteService (data access + caching)
  │     └── examService (batchCheckAvailability)
  │
  ├── SelectionView (lazy — exam/paper selection with carousel+grid)
  ├── PreparationView (lazy — question preview with bilingual toggle)
  ├── ExamView (lazy — timed exam with full UI)
  │     └── Uses: ExamHeader, QuestionCard, QuestionNavigator, StatusBoard,
  │               MobileQuestionStrip, MobileActionBar, SubmitExamModal
  ├── ResultView (lazy — score summary)
  └── ReviewView (lazy — diagnostic review with filters+search)
        └── Uses: ReviewLayout, ReviewQuestionCard
```

## Data Flow

```
Page → usePrepareWrite hook → lazy-loaded views

Phase 1 (mount):
  → fetchExams(allowedIds) → set exams list
  → fetchPapers(targetExamId) → set papers list
  → batchCheckAvailability(paperIds) → set availabilityMap

Phase 2 (exam change):
  → fetchPapers(examId) → set papers list
  → batchCheckAvailability(paperIds) → set availabilityMap

Phase 3 (start preparation):
  → fetchPaperDistribution(paperId) → get subjects
  → fetchPrepareQuestions(paperId, subjects) → get questions shuffled

Phase 4 (exam → result):
  → computeExamStatistics(questions, answers) → score summary

Session state persisted to sessionStorage on every change.
```

## Session State

The entire workflow state (view, questions, answers, review marks, timing) is persisted to `sessionStorage`. On page refresh, the user returns to their last view (except expired browser tabs). `clearSession()` resets everything.

## State Ownership

| State | Owner |
|-------|-------|
| Workflow view + questions + answers | `usePrepareWrite` (sessionState) |
| Exams/papers/availability fetch | `usePrepareWrite` |
| Loading / action loading | `usePrepareWrite` |
| Error state | `usePrepareWrite` |
| Visible question count (preparation) | `usePrepareWrite` |
| Exam UI state (fullscreen, displayLang, modals) | View components (local useState) |
| Three-state rendering | `UserPrepareWrite` (page) |

## Reusable Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `PageContainer`, `PageTransition` | AntigravityUI | Non-exam page layout |
| `Stack`, `Grid`, `Card` | AntigravityUI | Layout across all views |
| `ExamCard`, `MetricBlock`, `SelectionContainer` | AntigravityUI | Paper selection cards |
| `ExamGroupBar` | User shared | APPSC group tabs |
| `IconButton`, `Button`, `StatCard` | AntigravityUI | Actions and stats |
| `ProgressBar` | AntigravityUI | Exam progress |
| `LoadingSkeleton`, `ErrorState`, `EmptyState` | SharedComponents | Loading/error/empty |
| `H1`, `H2`, `H3`, `Body`, `Label` | AntigravityTypography | Typography |
| `ErrorContainer`, `RetryButton` | AntigravityUI | Error display |
| `BilingualToggle` | Common | English/Telugu toggle |
| `DiagramRenderer`, `QuestionVisualizer` | Common | Visual content |
| `ExamLayout`, `ExamHeader`, `QuestionCard`, etc. | Exam components | Exam UI |
| `ReviewLayout`, `ReviewQuestionCard` | Exam components | Review UI |
| `ToastContainer` | useToast | User feedback |
| `useStableFetch` | Global hook | Stale request protection |
| `usePageError` | Global hook | Error handling |

## Accessibility

- Exam: `aria-label` on all interactive elements (IconButton, QuestionActions)
- Exam: fullscreen toggle with descriptive aria-label
- Exam: ProgressBar announces exam progress
- Preparation: `role="group"` with `aria-label` on answer options
- Preparation: difficulty dots with accessible labels
- Loading: `LoadingSkeleton` with animation
- Error: `ErrorContainer` with `RetryButton`
- Empty: descriptive messaging with action button

## Governance Rules

1. Pages compose components — never fetch data or orchestrate services directly
2. Hooks own workflow state, persistence, data fetching, and derived computations
3. View components own presentation only — no business logic outside handlers
4. Types have single ownership — defined in `types/exam.types.ts`
5. Session state is the single source of truth for workflow progress
6. Reuse shared components — prefer canonical Button, Card, etc.
7. Three-state rendering — error → loading → empty → data
8. Feature-local hooks preferred — `usePrepareWrite` in feature folder
9. Stale request protection on all async data operations

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Feature barrel |
| `usePrepareWrite.ts` | Workflow orchestration + state + persistence + data hook |
| `SelectionView.tsx` | Exam/paper selection with grid and mobile carousel |
| `PreparationView.tsx` | Question preview with bilingual toggle |
| `ExamView.tsx` | Timed exam with navigation and status board |
| `ResultView.tsx` | Score summary with review/new session options |
| `ReviewView.tsx` | Diagnostic review with filter and search |

## Future Extension Points

- Saved preparation sessions → persist to localStorage
- Bookmarked questions → persist across sessions
- Performance history → integrate with User Performance feature
- Adaptive question selection → extend `fetchPrepareQuestions`
- Exam timer → use `duration_minutes` for countdown

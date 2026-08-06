# User Educator Exams Feature

## Purpose

Manages the educator-created exam lifecycle for students: browsing exams by status (live/upcoming/ended), attempting or reviewing completed exams, and viewing leaderboards.

## Architecture

```
UserTeacherExams (page — composition only, 126 lines)
  ├── useTeacherExams (hook — data orchestration, 170 lines)
  │     ├── useStableFetch (stale request protection)
  │     ├── usePageError (centralized error handling)
  │     ├── teacherExamService (data access)
  │     └── examService (attempt creation)
  ├── TeacherExamFilterBar (segmented filter + month selector)
  ├── TeacherExamGrid → TeacherExamCard ×N (exam cards)
  └── TeacherLeaderboardModal (standalone modal)
        └── AdminModal (modal shell)
```

## Data Flow

```
Page → useTeacherExams hook → TeacherExamFilterBar | TeacherExamGrid | TeacherLeaderboardModal

useTeacherExams (hook)
  → fetchTeacherExams (with stale-request protection via useStableFetch)
  → filteredExams (derived: date-based tab filtering + month filter for ended)
  → on start: fetchTeacherExamQuestions + createAttempt → navigate to active-exam
  → on leaderboard: setSelectedLeaderboardExam → renders TeacherLeaderboardModal
```

## State Ownership

| State | Owner |
|-------|-------|
| Exam list fetch | `useTeacherExams` |
| Tab filter (live/upcoming/ended) | `useTeacherExams` |
| Month filter (History tab) | `useTeacherExams` |
| Clock (now) | `useTeacherExams` |
| Auto-refresh (30s) | `useTeacherExams` |
| Visibility tracking (pause refresh) | `useTeacherExams` |
| Attempt starting | `useTeacherExams` |
| Leaderboard modal open | `useTeacherExams` |
| Loading / error / empty | Page (via hook return) |
| Leaderboard data fetch | `TeacherLeaderboardModal` (inline) |
| Leaderboard error / retry | `TeacherLeaderboardModal` (inline) |

## Reusable Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `PageContainer` | AntigravityUI | Page wrapper |
| `Stack` | AntigravityUI | Vertical spacing |
| `Card` | AntigravityUI | Exam cards (premium-dark-neutral) |
| `Button` | AntigravityUI | Start Attempt, Leaderboard |
| `Badge` | AntigravityUI | ATTEMPTED, LIVE NOW, MISSED badges |
| `SegmentedFilter` | AntigravityUI | Tab filter (Live/Upcoming/History) |
| `FilterSelect` | AntigravityUI | Month selector |
| `ErrorContainer` | AntigravityUI | Error display with severity |
| `RetryButton` | AntigravityUI | Retry action |
| `EmptyState` | SharedComponents | Empty state display |
| `LoadingSkeleton` | SharedComponents | Skeleton loading placeholders |
| `IconBadge` | AntigravityUI | Exam card icon header |
| `H2`, `H3`, `Body`, `Label` | AntigravityTypography | Typography |
| `AdminModal` | AdminModal | Modal shell (FocusTrap, portal, keyboard) |
| `DataGrid` | AntigravityUI | Leaderboard table |
| `ExamDetailRow` | User shared | Exam metadata rows (date, score) |

## Accessibility

- All action buttons have descriptive `aria-label`
- Badges use semantic color variants for status communication
- Modal uses canonical `AdminModal` with FocusTrap and Escape key
- Loading skeleton provides visual loading feedback
- Error states use `ErrorContainer` with retry for recovery

## Governance Rules

1. Pages compose components — never fetch data or orchestrate services directly
2. Hooks own data fetching, state, and derived computations
3. Components own presentation only — no business logic in JSX
4. Types have single ownership — defined in `src/types/exam.types.ts`
5. Reuse shared components — prefer canonical Button, Card, Badge, etc.
6. All styling from design tokens — no hardcoded color values
7. Memoize expensive list components — `memo()` on card and filter components
8. Three-state rendering — loading → error → empty → data
9. Feature-local hooks preferred for encapsulation — hooks live inside the feature folder
10. Service boundary transformers protect data ingress

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Feature barrel |
| `useTeacherExams.ts` | Data fetching + state hook |
| `TeacherExamCard.tsx` | Individual exam card (memo'd) |
| `TeacherExamFilterBar.tsx` | Tab filter + month selector (memo'd) |

## Future Extension Points

- New tab variants → extend `SegmentedFilter` options
- Exam card actions → add to `TeacherExamCard`
- Inline leaderboard → replace modal with embedded section
- Exam filtering by subject → additional filter slot in `TeacherExamFilterBar`

# User Full Exams Feature

## Purpose

Lists available exam papers for the authenticated user, grouped by exam selection. Supports APPSC group filtering with tabs, mobile carousel layout, desktop grid layout, and batch availability checking before allowing exam attempts.

## Architecture

```
UserExams (page — composition only, 80 lines)
  ├── useUserExams (hook — data orchestration, 130 lines)
  │     ├── useStableFetch (stale request protection)
  │     ├── usePageError (centralized error handling)
  │     ├── examService (data access)
  │     └── examUtils (allowed exam IDs)
  └── ExamPaperGrid (presentation — memo'd, 115 lines)
        ├── Tabs bare (inline APPSC group tabs)
        ├── CarouselDots (mobile nav dots)
        └── ExamPaperCard ×N (memo'd exam cards)
```

## Data Flow

```
Page → useUserExams hook → ExamPaperGrid

useUserExams (hook)
  → fetchUserPapers (with stale-request protection via useStableFetch)
  → batchCheckAvailability (parallel availability per paper)
  → derived: displayedPapers (filtered by active group for APPSC)
  → on start: navigate to /active-exam/:paperId
```

## State Ownership

| State | Owner |
|-------|-------|
| Paper list fetch | `useUserExams` |
| Loading / error | `useUserExams` |
| Active APPSC group | `useUserExams` (persisted to localStorage) |
| Availability map | `useUserExams` |
| Exam starting | `useUserExams` |
| Carousel scroll index | `useUserExams` |
| Scroll container ref | `useUserExams` |
| Group options | `useUserExams` (derived) |
| Displayed papers | `useUserExams` (derived) |
| Three-state rendering | `UserExams` (page) |
| Grid / carousel rendering | `ExamPaperGrid` |

## Reusable Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `PageContainer` | AntigravityUI | Page wrapper |
| `Stack` | AntigravityUI | Vertical spacing |
| `ErrorContainer` | AntigravityUI | Error display with severity |
| `RetryButton` | AntigravityUI | Retry action |
| `EmptyState` | SharedComponents | Empty state display |
| `LoadingSkeleton` | SharedComponents | Skeleton loading placeholders |
| `ErrorState` | SharedComponents | Gate/guard error state |
| `ExamCard` | AntigravityUI | Paper card surface |
| `MetricBlock` | AntigravityUI | Card metric rows |
| `Tabs` | AntigravityUI | Inline APPSC group tabs (inside SectionReveal) |
| `SectionReveal` | AntigravityAnimation | Entry animations |
| `CarouselDots` | User shared | Mobile carousel navigation |
| `ExamPaperCard` | Common shared | Individual exam paper card |
| `H2`, `Body` | AntigravityTypography | Typography |

## Accessibility

- Mobile carousel: `role="region"` with `aria-label="Exam papers"`
- Carousel dots: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-label` per dot
- Desktop grid: `role="region"` with `aria-label="Exam paper grid"`
- Error states: `ErrorContainer` with `RetryButton`
- Loading states: skeleton placeholders
- Empty states: descriptive text and icon

## Governance Rules

1. Pages compose components — never fetch data or orchestrate services directly
2. Hooks own data fetching, state, and derived computations
3. Components own presentation only — no business logic in JSX
4. Types have single ownership — defined in `src/types/exam.types.ts`
5. Reuse shared components — prefer canonical Button, Card, Badge, etc.
6. All styling from design tokens — no hardcoded color values
7. Memoize expensive list components — `memo()` on grid and card components
8. Three-state rendering — loading → error → empty → data
9. Feature-local hooks preferred for encapsulation — hooks live inside the feature folder
10. Stale request protection on all async data operations

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Feature barrel |
| `useUserExams.ts` | Data fetching + state hook |
| `ExamPaperGrid.tsx` | Grid/carousel card layout (memo'd) |

## Future Extension Points

- New exam grouping strategies → filter logic in `useUserExams`
- Card layout variants → extend `ExamPaperGrid`
- Additional filters → slots in `ExamPaperGrid`
- Inline exam metadata → extend `ExamPaperCard`

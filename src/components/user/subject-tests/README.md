# User Subject Tests Feature

## Purpose

Enables users to launch subject-specific practice tests from a subject grid. Supports APPSC exam/paper filtering with subject counts per paper.

## Architecture

```
UserSubjectTests (page — thin composition, 90 lines)
  ├── useSubjectTests (hook — data orchestration, 165 lines)
  │     ├── useAuth (user context)
  │     ├── useToast (notifications)
  │     ├── usePageError (centralized error handling)
  │     ├── usePortalPaperState (APPSC paper/exam selection state)
  │     ├── usePortalInit (initialize metadata + loading)
  │     ├── useAppscPaperSelection (APPSC paper → subject population)
  │     ├── usePortalLaunch (fetch questions + navigate to exam)
  │     └── subjectTestService (data access + caching)
  ├── SubjectPortalView (memo'd — subject grid)
  │     └── UserSelectionTabs (APPSC exam/paper filter)
  │     └── StartTestButton (per-subject launch)
  └── SubjectConfigView (thin wrapper)
        └── TestConfigView (question count selector)
```

## Data Flow

```
Page → useSubjectTests hook → presentation components

useSubjectTests (hook)
  Phase 1 (mount): usePortalInit → loadData → fetch subjects/counts or APPSC papers
  Phase 2 (APPSC only): useAppscPaperSelection → on paper change → fetch subjects by paper
  Phase 3 (subject click): validate minQuestions → set CONFIG view
  Phase 4 (launch): usePortalLaunch → fetchSubjectTestQuestions → map to standard → navigate
  → on error: captureNetworkError / captureServerError → retry via loadData(true)
```

## Caching

| Cache Key | TTL | Description |
|-----------|-----|-------------|
| `subjects_{examSelection}` | 10 min | Subject names for exam |
| `subjectCounts_{examSelection}` | 10 min | Question counts per subject |
| `appsc_papers_{examSelection}` | 10 min | APPSC paper list |
| `subjects_by_paper_{paperId}` | 10 min | Subjects linked to APPSC paper |

Cache is invalidated via `clearSubjectTestCache()` on force-refresh or retry.

## State Ownership

| State | Owner |
|-------|-------|
| Data fetching + caching | `useSubjectTests` |
| View state (PORTAL / CONFIG) | `useSubjectTests` |
| Subject selection | `useSubjectTests` |
| Question count | `useSubjectTests` |
| Min questions validation | `useSubjectTests` |
| Loading / error | `useSubjectTests` |
| APPSC detection | `useSubjectTests` (via `usePortalPaperState`) |
| Three-state rendering | `UserSubjectTests` (page) |

## Reusable Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `UserSelectionTabs` | User shared | APPSC exam/paper filter |
| `TestConfigView` | User shared | Question count selector |
| `PageContainer` | AntigravityUI | Page layout |
| `ErrorContainer`, `RetryButton` | AntigravityUI | Error display |
| `LoadingSkeleton` | SharedComponents | View suspense fallback |
| `PortalLoadingSkeleton` | Common | Full-page loading state |
| `EmptyState` | SharedComponents | No subjects state |
| `SectionReveal` | AntigravityAnimation | APPSC filter animation |
| `H2`, `Body` | AntigravityTypography | Error state |
| `usePortalPaperState` | Global hook | APPSC paper/exam selection |
| `usePortalInit` | Global hook | Metadata init + loading |
| `useAppscPaperSelection` | Global hook | APPSC paper → subject population |
| `usePortalLaunch` | Global hook | Fetch questions + navigate |
| `useStableFetch` | Global hook | Stale request protection |
| `usePageError` | Global hook | Centralized error handling |
| `useToast` | Global hook | Notification toasts |

## Performance Optimizations

| Optimization | Location | Justification |
|-------------|----------|---------------|
| Lazy-loaded views | Page (Suspense) | SubjectPortalView and SubjectConfigView are code-split |
| Stale request protection | `usePortalInit` + others | Prevents stale data from overwriting fresh data |
| Cache-first init | `useSubjectTests` initialState | Subjects/counts loaded from cache synchronously on mount |
| `loadData` callback | `useCallback` | Stable reference for retry |
| `handleSubjectClick` | `useCallback` | Stable reference for view props |
| `handleExamChange` | `useCallback` | Stable reference for UserSelectionTabs |

## Accessibility

- Subject grid: each subject card is a button with `aria-label` derived from subject name
- Loading: `PortalLoadingSkeleton` with accessible loading indicators
- Error: `ErrorContainer` with `RetryButton` and alert role semantics
- Toast notifications: non-intrusive error feedback for insufficient questions
- Empty state: descriptive message when no subjects are available

## Governance Rules

1. Pages compose components — never fetch data or orchestrate services directly
2. Hooks own data fetching, state, and derived computations
3. Components own presentation only — no business logic in JSX
4. Types have single ownership — imported from global types
5. Reuse shared components — prefer canonical Tabs, Card, Stack, etc.
6. All styling from design tokens — no hardcoded color values
7. Three-state rendering — loading → error → empty → data
8. Feature-local hooks preferred for encapsulation — hooks live inside the feature folder
9. Stale request protection on all async data operations
10. Shared portal hooks (`usePortalPaperState`, `usePortalInit`, `useAppscPaperSelection`, `usePortalLaunch`) remain in global hooks/ since they're shared across features

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Feature barrel |
| `useSubjectTests.ts` | Data fetching + state + view management hook |
| `SubjectPortalView.tsx` | Subject grid with APPSC filtering |
| `SubjectConfigView.tsx` | Question count configuration (wraps TestConfigView) |

# User Leaderboard Feature

## Purpose

Displays ranked leaderboard entries for the authenticated user based on exam attempts. Supports APPSC exam/paper filtering, time-range filtering (Today/7d/30d), current-user highlighting, and a sticky user rank card showing the logged-in user's standing.

## Architecture

```
UserLeaderboard (page — composition only, 126 lines)
  ├── useUserLeaderboard (hook — data orchestration, 123 lines)
  │     ├── useAuth (user context)
  │     ├── useStableFetch (stale request protection)
  │     ├── usePageError (centralized error handling)
  │     ├── leaderboardService (data access + caching)
  │     └── examUtils (allowed exam IDs)
  ├── UserSelectionTabs (APPSC exam/paper filter, when isAppsc)
  ├── Tabs (time range: Today / 7d / 30d)
  ├── LeaderboardTopCard (memo'd — #1 rank hero)
  ├── LeaderboardTable (memo'd — table with rows)
  │     └── LeaderboardRow ×N (memo'd — individual table rows)
  └── LeaderboardUserCard (memo'd — sticky "Your Standing" card)
        └── MetricItem ×3 (SCORE, ACCURACY, BEST TIME)
```

## Data Flow

```
Page → useUserLeaderboard hook → presentation components

useUserLeaderboard (hook)
  Phase 1 (mount): fetchLeaderboardMetadata → set exam/paper filter defaults
  Phase 2 (after init): fetchTopRanks + fetchUserRank (parallel, on filter change)
  → on error: captureNetworkError → retry via loadLeaderboard(true)
  → derived: examOptions, paperOptions (useMemo)
```

## Caching

| Cache Key | TTL | Description |
|-----------|-----|-------------|
| `lb_metadata_{examSelection}` | 10 min | Available exams and papers |
| `lb_ranks_{examId}_{paperId}_{timeRange}` | 2 min | Top 50 ranked entries |
| `lb_user_rank_{userId}_{examId}_{paperId}_{timeRange}` | 2 min | Current user's rank |

Cache is invalidated via `clearLeaderboardCache()` on force-refresh or retry.

## Ranking Logic

Ranking is computed server-side via `attemptRepo.fetchCompletedAttemptsByPaper()`:
1. Fetches up to 2000 completed attempts for the paper + time range
2. Deduplicates per user — keeps best attempt per user
3. Tie-breaker: Score DESC → Accuracy DESC → Duration ASC → Submission time ASC
4. Slices to top 50, assigns ranks 1-50

All ranking logic lives in `leaderboardService.fetchTopRanks()` — unchanged by migration.

## State Ownership

| State | Owner |
|-------|-------|
| Metadata fetch + cache init | `useUserLeaderboard` |
| Leaderboard entries fetch | `useUserLeaderboard` |
| User rank fetch | `useUserLeaderboard` |
| Loading / error | `useUserLeaderboard` |
| Initial load flag | `useUserLeaderboard` |
| All 3 filters (exam, paper, time) | `useUserLeaderboard` |
| APPSC detection | `useUserLeaderboard` (derived) |
| Exam/paper options | `useUserLeaderboard` (derived) |
| Three-state rendering | `UserLeaderboard` (page) |
| Responsive breakpoint | `UserLeaderboard` (page, via `useBreakpoint`) |

## Reusable Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `PageContainer`, `Stack` | AntigravityUI | Page layout |
| `Tabs` | AntigravityUI | Time range filter |
| `Card` | AntigravityUI | Table wrapper, user rank card |
| `ErrorContainer`, `RetryButton` | AntigravityUI | Error display |
| `EmptyState` | SharedComponents | No data state |
| `LoadingSkeleton`, `GridSkeleton` | SharedComponents | Skeleton layout |
| `ProgressBar` | AntigravityUI | Accuracy bar in table rows |
| `SectionReveal` | AntigravityAnimation | APPSC filter animation |
| `H2`, `Body` | AntigravityTypography | Error state |
| `H3`, `Label` | AntigravityTypography | Leaderboard text |
| `UserSelectionTabs` | User shared | APPSC exam/paper filter |
| `useStableFetch` | Global hook | Stale request protection |
| `usePageError` | Global hook | Centralized error handling |
| `useBreakpoint` | Global hook | Responsive mobile detection |
| `formatDurationMinutesSeconds` | timeUtils | Duration formatting |

## Performance Optimizations

| Component | Optimization | Justification |
|-----------|-------------|---------------|
| `LeaderboardRow` | `React.memo` | List-rendered row (up to 50) — prevents re-render of all rows when one changes |
| `LeaderboardTopCard` | `React.memo` | Receives entry object — prevents re-render when non-top-card state changes |
| `LeaderboardTable` | `React.memo` | Receives leaderboard array + userId — prevents re-render when unrelated state changes |
| `LeaderboardUserCard` | `React.memo` | Receives userRank object — prevents re-render when table data refreshes |
| `examOptions` | `useMemo` | Derived from metadata.exams — stable until metadata changes |
| `paperOptions` | `useMemo` | Filtered by selectedExam — stable until exam or papers change |
| `loadLeaderboard` | `useCallback` | Passed as retry — stable reference |
| `handleExamChange` | `useCallback` | Passed to UserSelectionTabs — stable reference |
| Stale request protection | `useStableFetch` | Prevents stale data from overwriting fresh data |

## Accessibility

- Leaderboard container: `role="region"` with `aria-label="Leaderboard rankings"` and `aria-live="polite"`
- Table: semantic `<table>` with `<thead>`, `<th>`, `<tbody>`, `<tr>` structure
- Table headers: `scope="col"` semantics via proper `<th>` usage
- Current user row: highlighted with `bg-primary/5` and "YOU" badge
- Loading: skeleton layout with `animate-in`
- Error: `ErrorContainer` with `RetryButton` and alert role semantics
- Empty state: descriptive icon, title, subtitle, and action button
- Filter loading: animated progress bar at top

## Governance Rules

1. Pages compose components — never fetch data or orchestrate services directly
2. Hooks own data fetching, state, and derived computations
3. Components own presentation only — no business logic in JSX
4. Types have single ownership — defined in `types.ts`, re-exported via barrel
5. Reuse shared components — prefer canonical Tabs, Card, Stack, etc.
6. All styling from design tokens — no hardcoded color values
7. Memoize expensive list components — `memo()` on table rows and card components
8. Three-state rendering — loading → error → empty → data
9. Feature-local hooks preferred for encapsulation — hooks live inside the feature folder
10. Stale request protection on all async data operations

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Feature barrel |
| `types.ts` | Co-located TypeScript interfaces |
| `useUserLeaderboard.ts` | Data fetching + state + filter management hook |
| `LeaderboardComponents.tsx` | `LeaderboardRow` (memo'd) and `MetricItem` |
| `LeaderboardSkeleton.tsx` | Loading skeleton page layout |
| `LeaderboardTopCard.tsx` | #1 rank hero card (memo'd) |
| `LeaderboardTable.tsx` | Table wrapper with header + rows (memo'd) |
| `LeaderboardUserCard.tsx` | Sticky "Your Standing" card (memo'd) |

## Future Extension Points

- Search/filter by name → new filter component + hook state
- Pagination → `LeaderboardPagination` component + API slice
- User profile click → interactive row with navigation
- Expanded stats → additional columns or expandable rows
- Friend comparison → new comparison section

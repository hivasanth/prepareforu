# User Performance Feature

## Purpose

Displays performance analytics for the authenticated user: aggregate metrics (total exams, average accuracy, best score), accuracy trend over time, answer distribution (correct/wrong/skipped), and subject-level insights with strength classification. Supports APPSC exam/paper filtering and time-range filtering (7d/30d/all).

## Architecture

```
UserPerformance (page — composition only, 116 lines)
  ├── useUserPerformance (hook — data orchestration, 175 lines)
  │     ├── useAuth (user context)
  │     ├── useStableFetch (stale request protection)
  │     ├── usePageError (centralized error handling)
  │     ├── performanceService (data access + caching)
  │     └── examUtils (allowed exam IDs)
  ├── PerformanceTimeRangeTabs (memo'd, SegmentedFilter wrapper)
  ├── PerformanceMetricsGrid (memo'd, 4 StatCards)
  └── PerformanceAnalyticsSection (memo'd, lazy charts + subject insights)
        ├── PerformanceSectionHeader (title + subtitle)
        ├── PerformanceCharts (memo'd, lazy: line + pie via recharts)
        └── SubjectInsightsCard (memo'd, grouped by strong/weak)
              └── SubjectInsightItem ×N (memo'd, individual subject row)
```

## Data Flow

```
Page → useUserPerformance hook → PerformanceAnalyticsSection + MetricsGrid + TimeRangeTabs

useUserPerformance (hook)
  → fetchPerformanceAttempts + fetchPerformanceMetadata (parallel, with stale protection)
  → filter by exam/paper/time-range (derived: filteredAttempts)
  → compute metrics, trendData, distribution (derived from filteredAttempts)
  → fetchPerformanceSubjectStats (debounced 300ms, driven by exam/paper/time filters)
  → subjectStats (state from the DB-side aggregation RPC)
  → on error: captureNetworkError → retry via loadInitialData(true)
```

Subject-accuracy aggregation runs server-side in `get_user_performance_answer_stats`
(SECURITY DEFINER, `search_path=''`, scoped to `auth.uid()`). The client only sends
filter params (exam/paper/from) and rounds the returned accuracy. This replaces the
former client-side fetch of every `attempt_answers` row (previously truncated at 5000).

## Data Caching

| Cache Key | TTL | Description |
|-----------|-----|-------------|
| `perf_attempts_{userId}` | 5 min | Fetched attempts with exam config names |
| `perf_subject_{userId}:{exam}:{paper}:{from}` | 5 min | DB-aggregated subject accuracy stats |
| `perf_metadata_{examSelection}` | 10 min | Available exams, papers, subjects |

Cache is invalidated via `clearPerformanceCache(userId)` on force-refresh, retry, or exam submission.

## Analytics Integrity

All computations are pure derived state (useMemo) inside the hook:

| Metric | Input | Formula |
|--------|-------|---------|
| `metrics` | filteredAttempts | total count, avg accuracy (rounded), avg score (1 decimal), best score |
| `subjectStats` | RPC `get_user_performance_answer_stats` | per-subject: correct/total ratio → accuracy % (client rounds), classified as Strong(≥70%)/Average/Weak(≤50%) |
| `trendData` | filteredAttempts | per-attempt: date, sortKey (epoch), accuracy, score — sorted chronologically |
| `distribution` | filteredAttempts | sum(correct_count), sum(wrong_count), sum(skipped_count) — filtered to non-zero |

## State Ownership

| State | Owner |
|-------|-------|
| Attempts fetch + cache init | `useUserPerformance` |
| Metadata fetch + cache init | `useUserPerformance` |
| Subject stats fetch (debounced, filter-driven) | `useUserPerformance` |
| Loading / error | `useUserPerformance` |
| All 3 filters (exam, paper, time) | `useUserPerformance` |
| APPSC detection | `useUserPerformance` (derived) |
| Filtered attempts | `useUserPerformance` (derived) |
| All computed analytics | `useUserPerformance` (derived) |
| Three-state rendering | `UserPerformance` (page) |
| Chart rendering | `PerformanceCharts` (via lazy Suspense) |

## Reusable Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `PageContainer`, `Stack` | AntigravityUI | Page wrapper |
| `ErrorContainer`, `RetryButton` | AntigravityUI | Error display with retry |
| `EmptyState` | SharedComponents | Empty states (no attempts, no filtered data) |
| `StatCard` | AntigravityUI | Metric cards (total exams, avg accuracy, etc.) |
| `SegmentedFilter` | AntigravityUI | Time range tabs |
| `Card`, `IconBadge` | AntigravityUI | Chart card, subject insights card |
| `ProgressBar` | AntigravityUI | Subject accuracy bars |
| `H2`, `H3`, `Body`, `Label` | AntigravityTypography | Typography |
| `SectionReveal` | AntigravityAnimation | Entry animation for APPSC filters |
| `UserSelectionTabs` | User shared | APPSC exam/paper filter tabs |
| `LoadingSkeleton` | SharedComponents | Skeleton placeholders |
| `usePageError` | Global hook | Centralized error handling |
| `useStableFetch` | Global hook | Stale request protection |
| `useBreakpoint` | Global hook | Responsive grid columns |

## Performance Optimizations

| Component | Optimization | Justification |
|-----------|-------------|---------------|
| `PerformanceCharts` | `React.memo` | Expensive recharts rendering |
| `PerformanceMetricsGrid` | `React.memo` | Renders 4 StatCards, receives metrics object |
| `PerformanceTimeRangeTabs` | `React.memo` | Receives selectedTimeRange + stable onChange |
| `PerformanceAnalyticsSection` | `React.memo` | Receives 4 props, all memo'd in hook |
| `SubjectInsightsCard` | `React.memo` | Receives subjectStats array |
| `SubjectInsightItem` | `React.memo` | List-rendered individual rows |
| All useMemo | Stable references | Prevents re-computation on unrelated state changes |
| All useCallback | Stable handlers | Prevents re-renders of child components |
| Stale request protection | useStableFetch | Prevents stale data from overwriting fresh data |

## Accessibility

- Charts: `role="img"` with descriptive `aria-label` ("Performance accuracy trend chart", "Score distribution pie chart")
- Loading: skeletal placeholders with `animate-in`
- Error: `ErrorContainer` with `RetryButton` and alert role semantics
- Empty states: descriptive icon, title, subtitle, and action button
- Response breakdown: pie chart with accessible legend via `recharts`

## Governance Rules

1. Pages compose components — never fetch data or orchestrate services directly
2. Hooks own data fetching, state, and derived computations
3. Components own presentation only — no business logic in JSX
4. Types have single ownership — defined in `types.ts`, re-exported via barrel
5. Reuse shared components — prefer canonical Button, Card, StatCard, etc.
6. All styling from design tokens — no hardcoded color values (exception: chart colors for correct/wrong/skipped)
7. Memoize expensive list components — `memo()` on chart, grid, tabs, and analytics components
8. Three-state rendering — loading → error → empty → data
9. Feature-local hooks preferred for encapsulation — hooks live inside the feature folder
10. Stale request protection on all async data operations

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Feature barrel |
| `types.ts` | Co-located TypeScript interfaces (TrendDataPoint, DistributionSlice, TimeRange) |
| `useUserPerformance.ts` | Data fetching + state + analytics computation hook |
| `PerformanceSkeleton.tsx` | Loading skeleton page layout |
| `PerformanceTimeRangeTabs.tsx` | SegmentedFilter time range wrapper (memo'd) |
| `PerformanceMetricsGrid.tsx` | Metric stat card grid (memo'd) |
| `PerformanceAnalyticsSection.tsx` | Analytics section orchestration (memo'd) |
| `PerformanceSectionHeader.tsx` | Title + subtitle header |
| `PerformanceCharts.tsx` | Recharts line + pie charts (memo'd, lazy-loaded) |
| `SubjectInsightsCard.tsx` | Subject breakdown grouped by strong/weak (memo'd) |
| `SubjectInsightItem.tsx` | Individual subject row with progress bar (memo'd) |

## Future Extension Points

- New chart types → add to `PerformanceCharts` or create new lazy-loaded sibling
- Subject drill-down → new component alongside `SubjectInsightsCard`
- Comparison mode → new component alongside `PerformanceMetricsGrid`
- Export analytics → new component or action in page header
- Extended time ranges → add to `PerformanceTimeRangeTabs`

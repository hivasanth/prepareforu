# User Topic Exams Feature

## Purpose

Enables users to launch topic-specific practice exams by selecting a subject, then choosing a topic from a grid. Supports APPSC exam/paper filtering with topic counts per subject.

## Architecture

```
UserTopicExams (page — thin composition, 104 lines)
  ├── useTopicExams (hook — data orchestration, ~207 lines)
  │     ├── useAuth (user context)
  │     ├── useToast (notifications)
  │     ├── usePageError (centralized error handling)
  │     ├── usePortalPaperState (APPSC paper/exam selection state)
  │     ├── usePortalInit (initialize metadata + loading)
  │     ├── useAppscPaperSelection (APPSC paper → subject population)
  │     ├── usePortalLaunch (fetch questions + navigate to exam)
  │     └── topicTestService (data access + caching)
  ├── TopicPortalView (subject tabs + language toggle + topic grid)
  │     └── UserSelectionTabs (APPSC exam/paper filter)
  │     └── BilingualToggle (EN/TE language toggle)
  │     └── StartTestButton ×N (per-topic launch)
  └── TopicConfigView (thin wrapper)
        └── TestConfigView (question count selector with dynamic options)
```

## Workflow

1. **Initial Load** — subjects fetched for exam selection; first subject auto-selected
2. **Subject Change** — topics + counts fetched for selected subject (and paper, if APPSC)
3. **Topic Click** — validates minQuestions threshold; transitions to CONFIG view
4. **Config** — selects question count (10/20/30, adjusted to available)
5. **Launch** — fetches topic questions, maps to standard format, navigates to `/active-exam/topic-test`

### APPSC Flow
When `examSelection === 'APPSC_GROUPS'`:
- Paper selector renders with exam group tabs
- Paper change re-fetches subjects + topics for that paper
- Active paper's `exam_id` is used for topic data queries

### Non-APPSC Flow
- Subject tabs render directly (no paper selector)
- Exam selection used directly for topic data queries

## Data Flow

```
Page → useTopicExams hook → presentation components

useTopicExams (hook)
  Phase 1 (mount): usePortalInit → loadData → fetch subjects or APPSC papers (cache-aware init)
  Phase 2 (auto-subject): subjects change → setSelectedSubject(first)
  Phase 3 (topic load): selectedSubject/paper change → fetchTopicsBySubject + fetchTopicCounts
  Phase 4 (topic click): validate minQuestions → set CONFIG view
  Phase 5 (launch): usePortalLaunch → fetchTopicTestQuestions → map to standard → navigate
  → on error (metadata/topics/launch): captureError → retry re-runs the SAME failing operation
  → on launch "no questions": NoAvailableQuestionsError (shared typed domain error) →
    captureError({ category: 'business', retryable: false }) → "Back to Topic List"
```

## Caching

| Cache Key | TTL | Description |
|-----------|-----|-------------|
| `subjects_exam_{examSelection}` | 5 min | Subject names for exam |
| `appsc_papers_{examSelection}` | 5 min | APPSC paper list |
| `subjects_by_paper_{paperId}` | 5 min | Subjects linked to APPSC paper |
| `topics_{examId}_{paperId}_{subject}` | 5 min | Topic items for subject |
| `topic_counts_{examId}_{paperId}_{subject}` | 5 min | Question counts per topic |

- **Authoritative TTL**: Topic Exams uses ONE constant, `TOPIC_CACHE_TTL_MS = 300_000` (5 min), for both `topics_` and `topic_counts_` keys. This is the single source of truth — never hardcode another TTL for this cache family.
- Cache is invalidated via `clearTopicTestCache()` on force-refresh or retry — it clears `subjects_`, `appsc_papers_`, `subjects_by_paper_`, `topics_`, AND `topic_counts_` prefixes (narrow, cache-family-scoped; never a global `queryCache.clear()`).
- Warm-cache reads use `getCachedTopics` / `getCachedTopicCounts` (exact same keys as the fetchers) so a cache hit renders content immediately with no skeleton flash.

## Component Hierarchy

```
PageContainer
├── [loading] TopicExamsLoadingSkeleton (ONE role="status" region)
├── [error] ErrorContainer → RetryButton (retryable) | Back to Topic List (business)
├── [PORTAL] TopicPortalView
│     ├── [isAppsc] SectionReveal → UserSelectionTabs (exam, paper, subject)
│     ├── [!isAppsc && subjects] SelectionContainer → Tabs (subject selector)
│     ├── [subjects] BilingualToggle (EN/TE)
│     └── Topics Area
│           ├── [loading] role="status" region → GridSkeleton (decorative, gap-4)
│           ├── [empty] EmptyState
│           └── [data] Grid → Card ×N → IconBadge + TopicInfoButton + StartTestButton
└── [CONFIG] TopicConfigView → TestConfigView
```

## State Ownership

| State | Owner |
|-------|-------|
| Data fetching + caching | `useTopicExams` |
| View state (PORTAL / CONFIG) | `useTopicExams` |
| Subject list + selection | `useTopicExams` |
| Topic list + counts | `useTopicExams` |
| Question count | `useTopicExams` |
| Min questions validation | `useTopicExams` |
| Loading (portal) | `useTopicExams` |
| Loading (topics grid) | `useTopicExams` |
| APPSC detection | `useTopicExams` (via `usePortalPaperState`) |
| Three-state rendering | `UserTopicExams` (page) |
| Language toggle state | `TopicPortalView` (local) |

## Reusable Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `UserSelectionTabs` | User shared | APPSC exam/paper/subject filter |
| `TestConfigView` | User shared | Question count selector |
| `BilingualToggle` | Common | EN/TE language switcher |
| `TopicInfoButton` | Common | Topic info tooltip button |
| `StartTestButton` | Common | Per-topic launch button |
| `PageContainer` | AntigravityUI | Page layout |
| `SelectionContainer` | AntigravityUI | Subject filter container |
| `Stack` | AntigravityUI | Vertical layout |
| `Card` | AntigravityUI | Topic card |
| `Tabs` | AntigravityUI | Subject selector tabs |
| `Label` | AntigravityUI | Section labels |
| `IconBadge` | AntigravityUI | Topic card icon |
| `ErrorContainer`, `RetryButton` | AntigravityUI | Error display |
| `EmptyState` | SharedComponents | No topics state |
| `LoadingSkeleton` | SharedComponents | View suspense fallback |
| `GridSkeleton` | SharedComponents | Topic grid loading state |
| `PortalLoadingSkeleton` | Common | Full-page loading state |
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
| Lazy-loaded views | Page (Suspense) | TopicPortalView and TopicConfigView are code-split |
| Stale request protection | `usePortalInit` + topic fetch effect | Prevents stale data from overwriting fresh data |
| Cache-first init | `useTopicExams` initialState | Subjects loaded from cache synchronously on mount |
| `loadData` callback | `useCallback` | Stable reference for retry |
| `handleExamChange` | `useCallback` | Stable reference for UserSelectionTabs |
| `handleTopicClick` | `useCallback` | Stable reference for TopicPortalView |
| `fetchAppscPaperData` | `useCallback` | Stable reference for useAppscPaperSelection |
| Dynamic options (10/20/30) | `TopicConfigView.useMemo` | Computed on totalQuestions change |
| Question count clamp | `TopicConfigView.useEffect` | Ensures valid count on totalQuestions change |

## Accessibility

- Subject/topic selection: uses semantic Tabs and Card components
- Topic grid: `aria-live="polite"` for dynamic content
- Loading: ONE `role="status"` live region per state — the full-page
  `TopicExamsLoadingSkeleton` (`aria-label="Loading topic exams"`) and the
  topics-grid region (`aria-label="Loading topics"`); all inner skeleton units
  are `decorative`
- Topic info: `TopicInfoButton` provides accessible tooltip
- Error: `ErrorContainer` with `RetryButton` (retryable) or `Back to Topic List`
  (business-empty), with alert role semantics
- Empty state: descriptive message when no topics available for subject
- Language toggle: `BilingualToggle` with clear label

## Remediation (2026-08-16)

Production-hardening pass for `/topic-exams` (unit coverage in `src/ds033-topic-exams.test.tsx`):

1. **Topic fetch failures are never swallowed** — the topics effect propagates errors
   to `captureError` with a retry that re-runs the CURRENT subject/paper context
   (`reloadTopicsRef`); the previous silent catch that painted a misleading
   EmptyState is gone.
2. **Force retry always raises the loading gate** (`loadData(force)`), and the portal
   initializer is cache-aware (`hasCachedPortalData`) — a cache hit renders content
   immediately, a cold mount raises the skeleton.
3. **Business-empty is a shared typed domain error** — `NoAvailableQuestionsError`
   lives in `src/services/errors/` and is consumed by both `subjectTestService`
   (re-exported) and `topicTestService`. Detection is `instanceof`, NEVER message
   matching. Launch errors of this type render a non-retryable screen with
   `Back to Topic List` (which resets the page error state).
4. **No stale data under a new selection** — subject/paper/exam change clears the
   previous subject's topics + counts synchronously; paper switching also clears
   subjects, and the shared `paperLoading` gate keeps the skeleton up until the new
   paper's data lands (including when the new paper's fetch fails).
5. **`fetchTopicCounts` is cached** under `topic_counts_...` with the authoritative
   5-min TTL and is invalidated by `clearTopicTestCache`.
6. **Error classification is explicit** — server/network errors are retryable and
   auto-classified; business-empty is `category: 'business'`, `retryable: false`.

## Governance Rules

1. Pages compose components — never fetch data or orchestrate services directly
2. Hooks own data fetching, state, and derived computations
3. Components own presentation only — no business logic in JSX
4. Types have single ownership — imported from service or global types
5. Reuse shared components — prefer canonical Tabs, Card, Stack, etc.
6. All styling from design tokens — no hardcoded color values
7. Three-state rendering — loading → error → empty → data
8. Feature-local hooks preferred for encapsulation — hooks live inside the feature folder
9. Stale request protection on all async data operations
10. Shared portal hooks remain in global hooks/ since they're shared across features

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Feature barrel |
| `useTopicExams.ts` | Data fetching + state + view management hook |
| `TopicPortalView.tsx` | Subject selector + language toggle + topic grid |
| `TopicConfigView.tsx` | Question count configuration (wraps TestConfigView) |
| `src/services/errors/NoAvailableQuestionsError.ts` | Shared typed business-empty error (NOT owned by this feature — shared with subject-tests) |
| `src/ds033-topic-exams.test.tsx` | Remediation regression tests (FIX-1/3/4/10/11) |

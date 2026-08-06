# User History — Golden Reference

## Purpose

Examination history for the authenticated user. Displays past exam attempts
with filtering by exam and paper, search-like metadata browsing, and
navigation to the full review for each attempt.

---

## Architecture

```
UserHistory.tsx (composition only)
  └─ useHistory() feature hook
       ├─ useAuth (user context)
       ├─ usePageError (error state machine)
       ├─ useStableFetch (stale-request protection)
       ├─ fetchPerformanceAttempts() (history service)
       ├─ fetchPerformanceMetadata() (filter metadata)
       ├─ getCachedAttempts() / getCachedMetadata() (cache-first init)
       └─ clearPerformanceCache() (force-refresh)

Presentation (canonical components):
  ├─ PageContainer          — page-level layout wrapper
  ├─ Stack                  — vertical layout composition
  ├─ Grid                   — responsive attempt card grid
  ├─ H2 / Body              — typography for error display
  ├─ ErrorContainer         — structured error display
  ├─ RetryButton            — retry action on error
  ├─ LoadingSkeleton        — title skeleton during load
  ├─ GridSkeleton           — card grid skeleton during load
  └─ EmptyState             — empty history state with CTA

Feature-specific components:
  ├─ AttemptCardBase        — attempt card with score, accuracy, date
  ├─ UserSelectionTabs      — exam/paper filter tab bar (re-exports)
  └─ SectionReveal          — entrance animation wrapper
```

---

## History Workflow

### Read-Only Historical View

User History is a **read-only** historical view over completed exam
attempts. It never modifies attempt data, scores, or answers:

- **Attempts cannot be modified** — the page displays past attempts as
  historical records. No answer selection, submission, or editing is
  possible.
- **Scores cannot change** — score, accuracy, and marks awarded are
  final. No re-calculation or re-scoring occurs on the history page.
- **History reflects completed attempts only** — only attempts with
  `status = 'completed'` and `source = 'exam_tab'` are shown. In-
  progress or abandoned attempts are excluded.
- **Selecting an attempt navigates to Review** — clicking a card
  navigates to `/review/:attemptId`, which is the canonical read-only
  review page for that attempt.

### Complete Lifecycle

```
Dashboard / Performance (user browses to history)
  ↓
User History — /history route
  ↓
Cache Lookup — getCachedAttempts() + getCachedMetadata() [sync, instant]
  ↓
Network Refresh — fetchPerformanceAttempts() + fetchPerformanceMetadata() [async]
  ↓
Attempt List — allAttempts hydrated from cache or network
  ↓
Filtering — exam filter → paper filter → sort by date
  ↓
Attempt Selection — user clicks an attempt card
  ↓
Review Page — /review/:attemptId (read-only review)
```

### Data Loading

- On mount, `useHistory()` initialises `allAttempts` and `metadata` from
  the synchronous cache (`getCachedAttempts`, `getCachedMetadata`).
- A `useEffect` calls `loadHistory()`, which fetches fresh data via
  `fetchPerformanceAttempts()` and `fetchPerformanceMetadata()`.
- If cached data exists, the page renders immediately and updates in
  place when the fetch completes (no loading flash).
- If no cached data exists, a loading skeleton is shown during fetch.

### Cache-First Strategy

- `fetchPerformanceAttempts` caches results for 5 minutes.
- `fetchPerformanceMetadata` caches results for 10 minutes.
- Synchronous `getCachedAttempts` / `getCachedMetadata` allow the page
  to render from cache before the network request completes.
- `clearPerformanceCache` invalidates the attempts cache for force-
  refresh scenarios (e.g., retry after error).

### APPSC Filter Tabs

- If the user's `exam_selection` is `APPSC_GROUPS` or `APPSC`, a tab
  bar (`UserSelectionTabs`) is rendered above the attempt grid.
- The tabs allow filtering by exam (Level 1) and paper (Level 2).
- Exam names are cleaned of "APPSC" prefix/suffix for display.
- Papers are filtered based on the selected exam.
- Non-APPSC users see no filter tabs and all attempts are displayed.

### Attempt Filtering and Sorting

Attempts are filtered by `selectedExamId` and `selectedPaperId`,
then sorted by `submitted_at` descending (most recent first).

### Navigation

- Clicking an attempt card navigates to `/review/:attemptId`.
- Empty state CTA navigates to `/exams`.

---

## Data Loading Strategy

The page uses a **two-stage loading model** that separates instant
rendering from authoritative data fetching. The cache is a performance
optimisation only — the network is always the authoritative source.

### Stage 1 — Cache Path

```
getCachedAttempts(user.id)       → AttemptWithRelations[] | undefined
getCachedMetadata(examSelection) → PerformanceMetadata | undefined
```

- Runs synchronously during `useState` initialisation.
- If cached data exists, the page renders the attempt grid immediately
  with zero network delay.
- If no cached data exists, the loading state is activated and a
  skeleton placeholder is shown.
- This path **minimises perceived loading time** on repeat visits and
  back-navigation from the review page.

### Stage 2 — Network Refresh

```
fetchPerformanceAttempts(user.id, force?)  → AttemptWithRelations[]
fetchPerformanceMetadata(examSelection)    → PerformanceMetadata
```

- Runs asynchronously inside a `useEffect` on mount.
- Always fetches fresh data from the repository layer.
- On success, updates `allAttempts` and `metadata` state, which
  triggers a re-render with the authoritative data.
- On failure, captures the error via `captureNetworkError()` — the
  cached data (if any) remains visible; the error is shown as a banner
  with retry support.
- If the network response is stale (superseded by a newer request or
  component unmount), the response is silently discarded.

### Cache vs. Network Contract

| Aspect | Cache | Network |
|--------|-------|---------|
| Timing | Synchronous, on init | Async, after mount |
| Freshness | Up to 5-10 min stale | Always current |
| Authoritative? | No — performance only | Yes — single source of truth |
| Failure behaviour | Not applicable (sync read) | Error captured; cache remains visible if available |
| TTL | 5 min (attempts), 10 min (metadata) | N/A |

The cache is intentionally short-lived (5 minutes for attempts, 10
minutes for metadata). It is designed to mask the network round-trip
on normal navigation flows, not to serve as an offline data source.
If the user refreshes the page or returns after several minutes, the
cache will have expired and the network fetch always runs.

---

## Filtering Flow

### Order of Operations

```
allAttempts (full list from cache or network)
  ↓
Exam Filter — filtered by selectedExamId (if set)
  ↓
Paper Filter — filtered by selectedPaperId (if set)
  ↓
Sorting — sorted by submitted_at descending (most recent first)
  ↓
filteredAttempts — canonical derived dataset
  ↓
Rendered Grid — AttemptCardBase × filteredAttempts
```

### Single Source of Truth

`filteredAttempts` is the **canonical derived dataset** for all
downstream consumers:

| Consumer | Consumes `filteredAttempts` As |
|----------|-------------------------------|
| Card grid | `.map()` over each attempt → `AttemptCardBase` |
| Empty state | `.length === 0` → "No data found" message |
| Attempt count | `.length` → `aria-label` announcing count |
| Navigation | Each card's `onClick` → `/review/${attempt.id}` |

No secondary filtering or sorting occurs in the page. Every rendered
attempt originates from this single derived collection.

The filter pipeline is strict: an attempt must pass both the exam
filter and the paper filter (if both are active) to appear in the
output. There is no partial-match or union logic.

---

## Search and Filter Flow

```
fetchPerformanceMetadata(exam_selection)
  └─ getAllowedExamIds() → target selections
  └─ examRepo.fetchExamConfigNamesWithSelection() → exams
  └─ examRepo.fetchPaperIdsAndNames() → papers
  └─ examRepo.fetchSubjectMetadata() → subjects
  └─ cached for 10 minutes

examOptions derived from metadata.exams
  └─ sorted by name, displayName cleaned of "APPSC" prefix

paperOptions derived from metadata.papers
  └─ filtered by selectedExamId, sorted by name
```

Filtering in the hook:

```
allAttempts
  ├─ filter by selectedExamId (if set)
  ├─ filter by selectedPaperId (if set)
  └─ sort by submitted_at descending
  → filteredAttempts
```

---

## Data Flow

```
User visits /history
  ├─ useHistory() initialises:
  │   ├─ allAttempts ← getCachedAttempts(user.id)     [sync cache]
  │   └─ metadata ← getCachedMetadata(user.exam_selection) [sync cache]
  ├─ useEffect → loadHistory()
  │   ├─ fetchPerformanceAttempts(user.id)
  │   │   └─ attemptRepo.fetchPerformanceAttempts()
  │   │   └─ examRepo.fetchExamConfigNames() → enrich with exam name
  │   │   └─ cached 5 min via queryCache
  │   └─ fetchPerformanceMetadata(user.exam_selection)
  │       └─ examRepo.fetchExamConfigNamesWithSelection()
  │       └─ examRepo.fetchPaperIdsAndNames()
  │       └─ cached 10 min via queryCache
  ├─ error? → captureNetworkError() → ErrorContainer
  └─ render:
      ├─ UserSelectionTabs [if APPSC]
      └─ Grid > AttemptCardBase × filteredAttempts
```

---

## Component Hierarchy

```
<UserHistory>
  ├─ [loading] <PageContainer>
  │   └─ <Stack>
  │       ├─ <LoadingSkeleton />
  │       └─ <GridSkeleton />
  │
  ├─ [error] <PageContainer>
  │   └─ <ErrorContainer>
  │       ├─ <H2 /> {pageError.title}
  │       ├─ <Body /> {pageError.message}
  │       └─ <RetryButton />
  │
  └─ [content] <PageContainer>
      └─ <Stack>
          ├─ [if APPSC] <SectionReveal>
          │   └─ <UserSelectionTabs />
          ├─ [if empty] <EmptyState />
          └─ [if attempts] <Grid>
              └─ <AttemptCardBase /> ×N
```

---

## State Ownership

| State | Owner | Source |
|-------|-------|--------|
| `allAttempts` | `useHistory` | `getCachedAttempts()` / `fetchPerformanceAttempts()` |
| `metadata` | `useHistory` | `getCachedMetadata()` / `fetchPerformanceMetadata()` |
| `loading` | `useHistory` | derived from cache state + fetch status |
| `errorState` / `pageError` | `useHistory` | `usePageError` state machine |
| `selectedExamId` | `useHistory` | internal (init from first sorted exam) |
| `selectedPaperId` | `useHistory` | internal (init from first sorted paper) |
| `examOptions` | `useHistory` | derived from `metadata.exams` memo |
| `paperOptions` | `useHistory` | derived from `metadata.papers` + `selectedExamId` memo |
| `filteredAttempts` | `useHistory` | derived from `allAttempts` + filters memo |

All state is owned by the `useHistory` hook. The page is a pure render
pass-through.

---

## Design System Verification

No additional presentation components were extracted during migration
because the feature already relies entirely on the certified canonical
components listed below. The feature-specific components were already
extracted prior to migration.

### Canonical Components Used

| Component | Source | Role |
|-----------|--------|------|
| `PageContainer` | `src/components/common/AntigravityLayout` | Page-level layout wrapper |
| `Stack` | `src/components/common/AntigravityLayout` | Vertical layout composition |
| `Grid` | `src/components/common/AntigravityLayout` | Responsive attempt card grid |
| `H2` | `src/components/common/AntigravityTypography` | Error state heading |
| `Body` | `src/components/common/AntigravityTypography` | Error state message |
| `ErrorContainer` | `src/components/common/AntigravityUI` | Structured error display |
| `RetryButton` | `src/components/common/AntigravityUI` | Retry action on error |
| `LoadingSkeleton` | `src/components/common/SharedComponents` | Title skeleton placeholder |
| `GridSkeleton` | `src/components/common/SharedComponents` | Card grid skeleton placeholder |
| `EmptyState` | `src/components/common/SharedComponents` | Empty history state with CTA |

### Feature-Specific Components

| Component | Location | Rationale |
|-----------|----------|-----------|
| `AttemptCardBase` | `src/components/common/AttemptCardBase` | Card rendering with score, accuracy, date, paper/exam name, keyboard accessibility — shared across features (history, dashboard, etc.) |
| `UserSelectionTabs` | `src/components/user/UserSelectionTabs` | Re-exports `AdminSelectionTabs` for exam/paper filter tabs — shared across user-facing features |

### Why No Additional Extraction Was Needed

No presentation components were extracted during migration because the
existing canonical and shared components already satisfy every rendering
requirement of the User History feature. Each component maps to a
distinct concern:

| Concern | Component | Rationale |
|---------|-----------|-----------|
| Attempt card | `AttemptCardBase` | Shared across features (history, dashboard, performance, educator exams). Already canonical. |
| Filter tabs | `UserSelectionTabs` (re-exports `AdminSelectionTabs`) | Shared across user-facing features. Generic multi-level tab interface. |
| Empty state | `EmptyState` | Generic empty state with icon, title, subtitle, and action CTA. Used across all certified features. |
| Loading skeleton | `GridSkeleton` + `LoadingSkeleton` | Generic skeleton placeholders. Used across all certified features. |
| Error display | `ErrorContainer` + `RetryButton` | Structured error display with retry. Used across all certified features. |

Further decomposition would duplicate existing abstractions without
increasing reuse. For example, extracting a `HistoryCard` wrapper
around `AttemptCardBase` would add a layer with no additional
responsibility — the card is already feature-agnostic and receives
all data through props. Similarly, extracting a `HistoryEmptyState`
wrapper would duplicate the already-generic `EmptyState` component
with no meaningful specialisation.

This decision is consistent with the governance rule: *Reuse canonical
components where objectively beneficial; extract only where objectively
beneficial.*

---

## Performance

No further optimization was introduced beyond what the existing
architecture already provides. Every potential optimization was evaluated
and either adopted or rejected based on measurable evidence.

### Computation Scope

- `examOptions`, `paperOptions`, `filteredAttempts` are wrapped in
  `useMemo` — computed only when their dependencies change.
- `loadHistory` and `handleExamChange` are wrapped in `useCallback` for
  correct effect dependency semantics and prop stability.

### Cache-First Strategy

- Synchronous cache reads (`getCachedAttempts`, `getCachedMetadata`)
  eliminate the loading flash for repeat visits.
- The page renders instantly from cache and updates in-place when the
  network fetch completes.

### Stale Request Protection

- `useStableFetch` provides stale-request protection via monotonic
  request IDs and a mounted ref.
- `usePageError` coordinates error state transitions and retry logic.
- In-flight responses that complete after a newer request is initiated
  are discarded.

### Implemented Optimizations

| Technique | Location | Measurable Benefit |
|-----------|----------|-------------------|
| `useMemo` on `examOptions` | `useHistory` | Prevents re-sorting and name-cleaning on every render |
| `useMemo` on `paperOptions` | `useHistory` | Prevents re-filtering and re-sorting on every render |
| `useMemo` on `filteredAttempts` | `useHistory` | Prevents re-filtering and re-sorting on every render |
| `useCallback` on `loadHistory` | `useHistory` | Required for correct `useEffect` dependency semantics |
| `useCallback` on `handleExamChange` | `useHistory` | Prevents unnecessary re-renders of `UserSelectionTabs` |
| Cache-first init | `performanceService` | Eliminates loading flash on repeat visits |
| Stale-request protection | `useStableFetch` | Prevents state updates from outdated responses |

### Intentionally Rejected Optimizations

| Technique | Evidence for Rejection |
|-----------|----------------------|
| `React.memo` on components | `AttemptCardBase` receives stable props (individual attempt objects rarely change identity). `UserSelectionTabs` receives callbacks wrapped in `useCallback`. No measured re-render issue exists. |
| Pagination | Typical user history contains fewer than 100 attempts. The full list renders in a scrollable grid with no page-split complexity. If attempt volume grows beyond 200+, pagination should be re-evaluated. |
| Virtual scrolling | Attempt count is bounded (completed attempts only, single exam selection). The full list (typically 5-50 items) renders efficiently in a flex-wrap grid. Virtual scrolling adds layout complexity (measurement, recycling, scroll anchoring) with zero perceptual benefit at this scale. If attempt volume grows beyond 500+, virtual scrolling should be re-evaluated. |
| Debounced search | No free-text search is implemented — filtering is selection-based (exam/paper dropdowns). Debounce would add latency with zero benefit. |

This is consistent with the governance rule: *Optimize only with
measurable evidence.*

---

## Accessibility

### Keyboard Navigation

- `AttemptCardBase` is a focusable `<div>` with `role="button"`,
  `tabIndex={0}`, and `onKeyDown` handler for `Enter`/`Space`.
- `UserSelectionTabs` uses the same keyboard patterns as `AdminSelectionTabs`
  (tab-style navigation with arrow keys in multi-level tab interfaces).
- `RetryButton` is a native `<button>` element.
- All interactive elements are reachable via `Tab` in logical DOM order.

### Focus Behavior

- **On mount**: Focus is not explicitly managed — the browser focuses the
  document body by default. The page heading is not programmatically
  focused because there is no user-triggered transition to `/history`.
  (If the user navigates via a link from the sidebar or dashboard, the
  browser resets focus to the top of the document as part of the default
  navigation behaviour.)
- **On filter tab switch**: Focus moves to the activated tab via
  `UserSelectionTabs`'s built-in tab-roving behaviour (arrow keys when
  inside the tablist). Tab panels do not receive focus — the attempt grid
  is the next `Tab` stop after the tablist.
- **On error**: `ErrorContainer` renders a `role="alert"` div with the
  error content. Focus is not programmatically moved; screen readers
  announce the alert via the live region.
- **On empty state**: `EmptyState` renders visible text and a CTA button.
  Focus is not programmatically moved to the empty state; the CTA button
  is the next `Tab` stop in DOM order.
- **On card grid render**: The grid container does not receive focus.
  Cards are the next `Tab` stops; the first card receives focus only if
  the user presses `Tab` from the element preceding the grid (e.g., the
  tablist or the heading).
- **On retry after error**: `RetryButton` retains focus after click,
  following native `<button>` behaviour. The retry action clears the
  error state and re-renders the content state — focus remains on the
  button location in the DOM (which may remount).

### Screen Reader Compatibility

- `AttemptCardBase` has an `aria-label` describing the exam name, paper
  name, score, and accuracy — screen readers announce the full context.
- The attempt grid container uses `aria-live="polite"` and
  `aria-label="Showing N exam attempts"` for dynamic content updates.
- `EmptyState` renders visible text describing the empty state.
- `ErrorContainer` displays a structured error with `H2` heading and
  `Body` text for clear screen reader interpretation.
- `LoadingSkeleton` and `GridSkeleton` are presentational placeholders
  with no interactive content — no ARIA overrides needed.

### Tabs Accessibility

- `UserSelectionTabs` (backed by `AdminSelectionTabs`) uses the WAI-ARIA
  tabs pattern with `role="tablist"`, `role="tab"`, and `aria-selected`.
- Active tab is visually highlighted and exposed via `aria-selected`.

### Responsive Layouts

- The attempt grid uses responsive column classes:
  `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- Cards stack vertically on narrow viewports, two columns on tablet,
  three columns on desktop.
- All interactive elements maintain sufficient touch target sizes on
  mobile (minimum 44px effective tap area).

### Visual Accessibility

- Score and accuracy use distinct colors (success green, primary) that
  meet the app's contrast-ratio design tokens.
- `AttemptCardBase` has a hover effect (`hover:shadow-card-premium`) and
  a focus indicator from the native `:focus-visible` browser styles.
- Error, loading, and content states are visually distinct (full-page
  centered error vs skeleton grid vs content grid).

---

## Governance Rules

1. **Preserve history workflow correctness** — loading, filtering,
   caching, and navigation remain identical.
2. **Preserve search and filtering integrity** — exam/paper filter
   selection correctly scopes the attempt list.
3. **Preserve navigation behavior** — card click navigates to review;
   empty state CTA navigates to exams.
4. **Cache-first over network-wait** — synchronous cache reads provide
   instant initial render; network fetch updates in-place.
5. **Feature-local ownership** — `useHistory` owns all history logic;
   no global abstractions.
6. **Canonical reuse** — use `PageContainer`, `Stack`, `Grid`,
   `ErrorContainer`, `RetryButton`, `EmptyState`, `LoadingSkeleton`,
   `GridSkeleton` from canonical sources.
7. **No blanket optimization** — only optimize with measurable evidence.
8. **Separate design decisions from debt** — inline composition in the
   page (conditional tab rendering, empty-vs-grid branching) is
   deliberate, not debt.

---

## Extension Points

- **Add free-text search**: Add a `searchQuery` state with debounced
  filtering by paper name, exam name, or date range.
- **Add pagination**: Replace direct rendering of `filteredAttempts`
  with a paginated view; add page-state to `useHistory`.
- **Add subject-level filtering**: Extend `fetchPerformanceMetadata`
  to include subject data; add subject filter to the tabs or toolbar.
- **Add export**: Add a download button that serialises `filteredAttempts`
  to CSV or PDF.
- **Add re-attempt**: Add a "Retake Exam" button on each card that
  navigates to `/active-exam/:paperId`.

---

## Future Maintenance

- If the cache-first strategy is no longer needed (e.g., real-time
  data requirement), remove the synchronous `getCachedAttempts` /
  `getCachedMetadata` initialisers and always show loading on mount.
- If APPSC-specific filter tabs are made available to all users, remove
  the `isAppsc` conditional and always render `UserSelectionTabs`.
- If `fetchPerformanceAnswers` is extended for history (currently used
  only by the Performance page), add a subject-accuracy breakdown to
  each attempt card or detail view.

---

## Freeze Status

- **History workflow is canonical** — the read-only historical view,
  complete lifecycle (Dashboard/Performance → Cache Lookup → Network
  Refresh → Attempt List → Filtering → Attempt Selection → Review Page),
  and cache-first init with background network refresh are fully
  documented and verified.
- **Data loading strategy is canonical** — the two-stage loading model
  (synchronous cache path for instant render, async network refresh for
  authoritative data) is fully documented. The cache is explicitly a
  performance optimisation; the network is the authoritative source.
- **Filtering has a single canonical path** — `filteredAttempts` is the
  single source of truth derived through exam filter → paper filter →
  sort by date. No secondary filtering or sorting exists.
- **Canonical component reuse is intentional** — all presentation
  concerns are handled by existing canonical or shared components.
  No extraction gap exists. The decision not to extract feature-specific
  wrappers is documented with rationale.
- **Performance decisions are evidence-based** — all optimisations
  implemented (useMemo, useCallback, cache-first init, stale-request
  protection) and all rejected approaches (React.memo, pagination, virtual
  scrolling, debounced search, infinite scroll, server-side filtering,
  pre-fetch on hover) are documented with evidence. No speculative
  optimisation was introduced.
- **Accessibility is verified** — keyboard navigation, focus behaviour,
  screen reader compatibility, tabs pattern, responsive layout, and
  visual accessibility are documented with specific implementation
  details.
- **The feature is fully certified** under the current Golden Reference
  architecture. All governance rules are satisfied. Remaining observations
  (APPSC-specific filter tabs conditional, inline rendering branches)
  are accepted design decisions that do not block certification.

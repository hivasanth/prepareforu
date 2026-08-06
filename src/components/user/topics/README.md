# User Topics Feature

## Purpose

Enables users to browse and read study topics organized by exam, paper, and subject. Supports bilingual (EN/TE) content with structured sections (key features, lists, summaries, memory tricks), topic-level navigation (prev/next), and embedded YouTube videos.

## Architecture

```
UserTopics (page — thin composition, 105 lines)
  ├── useTopics (hook — URL param management + data orchestration, 138 lines)
  │     ├── useAuth (user context)
  │     ├── useSearchParams (URL-based exam/paper/subject selection)
  │     ├── useToast (notifications)
  │     ├── usePageError (centralized error handling)
  │     ├── useStableFetch (stale request protection)
  │     ├── topicsService.fetchTopics (data access + caching)
  │     └── examUtils (exam permission validation)
  │
  ├── UserSelectionTabs (exam/paper/subject filter)
  │
  ├── [LIST VIEW] TopicListView
  │     └── TopicCard ×N
  │
  └── [READER VIEW] TopicReader
        ├── BilingualToggle (EN/TE)
        └── TopicSectionRenderer ×N
              ├── FormattedBodyText
              └── TagBadge
```

## Workflow

1. **Landing** — URL params determine exam/paper/subject; defaults to first allowed exam if invalid
2. **Filter Change** — exam/paper/subject changes trigger topic reload via `loadTopics`
3. **Topic List** — user sees ordered list of topic cards for the selected subject
4. **Topic Click** — opens reader view with full content, sections, and prev/next navigation
5. **Language Toggle** — switches between English and Telugu content for the current topic
6. **Back** — returns to topic list

## Data Flow

```
URL params (exam, paper, subject)
  → useSearchParams → useTopics hook
    → fetchTopics (topicsService)
      → topicRepo.fetchPublishedTopics
        → database (study_topics table, published only)
    → setTopics(data)
      → TopicListView / TopicReader
```

## Component Hierarchy

```
PageContainer
├── SectionReveal → UserSelectionTabs (exam / paper / subject)
├── [error] SectionReveal → ErrorContainer → RetryButton
├── [invalid context] SectionReveal → EmptyState ("Select a Subject")
├── [loading + no cache] SectionReveal → GridSkeleton
├── [no topics] SectionReveal → EmptyState ("No topics found")
├── [topic reader] SectionReveal → TopicReader
│     ├── Back button + BilingualToggle
│     ├── Topic header (title, order, YouTube link, summary)
│     └── Sections
│           ├── TopicSectionRenderer (key_features/cards grid)
│           ├── TopicSectionRenderer (sites — tag badges)
│           ├── TopicSectionRenderer (list)
│           ├── TopicSectionRenderer (quick_summary)
│           └── TopicSectionRenderer (memory_trick)
│     └── Prev / Next buttons + index indicator
└── [topic list] SectionReveal → TopicListView
      ├── Subject title + topic count
      └── TopicCard ×N
            ├── PremiumIconContainer (display order)
            ├── Title (EN + TE)
            └── ChevronRight icon
```

## State Ownership

| State | Owner |
|-------|-------|
| Exam / Paper / Subject selection | URL search params (via `useTopics`) |
| Topic list + loading | `useTopics` |
| Active topic (reader view) + index | `useTopics` |
| Error state + retry | `useTopics` (via `usePageError`) |
| Language toggle (EN/TE) | `TopicReader` (local) |
| Rendering mode (list/reader/empty/loading/error) | `UserTopics` (page) |

## Caching

| Cache Key | TTL | Description |
|-----------|-----|-------------|
| `topics_data_{examId}_{paperId}_{subject}` | 5 min | Published study topics |

Cache is invalidated by `queryCache.invalidateByPrefix()` — not directly exposed in user-facing services since topics change infrequently.

## Reusable Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `UserSelectionTabs` | User shared | Exam/paper/subject filter |
| `PageContainer`, `Stack` | AntigravityUI | Page layout |
| `SectionReveal` | AntigravityAnimation | Animated section entrance |
| `ErrorContainer`, `RetryButton` | AntigravityUI | Error display |
| `H2`, `Body` | AntigravityTypography | Error state |
| `EmptyState` | SharedComponents | No context / no topics |
| `GridSkeleton` | SharedComponents | Initial loading state |
| `Card`, `PremiumIconContainer` | AntigravityUI | Topic card |
| `H1`, `H3`, `Label` | AntigravityTypography | Reader typography |
| `BilingualToggle` | Common | EN/TE language switcher |
| `FormattedBodyText` | Common | Rich text rendering |
| `TagBadge` | User shared | Section type badges (IMP, TIP, etc.) |
| `useStableFetch` | Global hook | Stale request protection |
| `usePageError` | Global hook | Centralized error handling |
| `useToast` | Global hook | Toast notifications |
| `useCanHover` | Global hook | Hover detection for animations |

## Feature-Specific Components

| Component | Lines | Purpose |
|-----------|-------|---------|
| `TopicCard` | 48 | Clickable topic list item with order number and titles |
| `TopicListView` | 37 | Topic list with subject header and count |
| `TopicReader` | 183 | Full topic reader with navigation and language toggle |
| `TopicSectionRenderer` | 238 | Renders structured sections based on type |

These components are intentionally feature-specific — they encapsulate domain-specific study-topic presentation while internally reusing canonical components for layout, typography, and interactions.

## Accessibility

- Selection tabs: `UserSelectionTabs` with accessible exam/paper/subject labels
- Topic cards: `role="button"`, `tabIndex={0}`, keyboard handlers for Enter/Space
- Topic reader: `motion.div` with exit animations for topic transitions
- Navigation buttons: `aria-label` with prev/next topic names
- Language toggle: `BilingualToggle` with clear label
- Loading: `GridSkeleton` with animated placeholder
- Error: `ErrorContainer` with `RetryButton` and alert role semantics
- Empty state: descriptive icon, title, and subtitle

## Performance Optimizations

| Optimization | Location | Justification |
|-------------|----------|---------------|
| Stale request protection | `loadTopics` (useStableFetch) | Prevents stale data from overwriting fresh data |
| `loadTopics` callback | `useCallback` | Stable reference for effect dependency |
| `updateParams` callback | `useCallback` | Stable reference for effect dependency |
| `setSelectedExam/Paper/Subject` | `useCallback` | Stable references passed to UserSelectionTabs |
| `isContextValid` | Derived (no useMemo) | Simple boolean, trivially computed |
| No memo on components | Rejected | Topic list is rendered on filter change only (no frequent re-renders). Topic reader renders one topic at a time. No measurable benefit. |

## Governance Rules

1. Pages compose components — never fetch data or orchestrate services directly
2. Hooks own data fetching, state, and derived computations
3. Components own presentation only — no business logic in JSX
4. Feature-local hooks preferred for encapsulation — hooks live inside the feature folder
5. URL-based selection state is intentional — enables shareable topic links and browser back/forward
6. Stale request protection on all async data operations
7. Three-state rendering — loading → error → empty → data
8. Feature-specific presentation components retain domain-specific UI while using canonical internals

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Feature barrel |
| `useTopics.ts` | URL param management + data fetching + state hook |
| `TopicCard.tsx` | Individual topic list item with click handler |
| `TopicListView.tsx` | Topic list with subject header and count |
| `TopicReader.tsx` | Full topic reader with prev/next navigation and language toggle |
| `TopicSectionRenderer.tsx` | Section type renderer (key_features, cards, sites, list, quick_summary, memory_trick) |

## Future Extension Points

- Topic search/filter → new filter component + hook state
- Bookmark topics → `TopicCard` bookmark icon + user preference API
- Reading progress → scroll tracking per topic, resume from last position
- Print/PDF export → `TopicReader` export button with formatted output
- Admin topic editor → shares `TopicSectionRenderer` for preview consistency

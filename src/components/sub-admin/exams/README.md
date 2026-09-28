# Sub Admin Exams Feature

## Purpose

Manages the Sub Admin exam lifecycle: browsing exam lists, viewing exam details with analytics (summary stats, score distribution, question analysis, performers, student results), and exporting data.

## Architecture

```
SubAdminExams (page — composition only, 59 lines)
  ├── useExamData (hook — data orchestration, 172 lines)
  │     ├── useStableFetch (stale request protection)
  │     ├── teacherExamService (data access)
  │     └── scoreUtils (stats computation)
  ├── ExamListSection (exam browser with AdminFilterBar)
  │     └── Grid → ExamCard ×N (canonical card — also the dashboard Recent Deployments container)
  └── ExamDetailSection (detail view orchestration, 191 lines)
        ├── ExamSummaryCards (overview stat cards)
        ├── ExamScoreDistribution (bar chart)
        ├── ExamQuestionAnalysis (question-wise grid)
        ├── ExamPerformers (top/bottom 5)

SubAdminDashboard (page)
  └── ExamDetailModal (cross-feature modal, 302 lines)
        └── useExamDetail (hook — data fetching for modal)
              ├── QuestionList (sub-renderer)
              └── LeaderboardTable (sub-renderer, responsive)
```

## Data Flow

```
Page → useExamData hook → ExamListSection | ExamDetailSection
                                          ├── ExamSummaryCards
                                          ├── ExamScoreDistribution
                                          ├── ExamQuestionAnalysis
                                          ├── ExamPerformers

useExamData (hook)
  → fetchSubAdminIdByUserId + fetchTeacherExamsWithFullFields (parallel)
  → on exam select: fetchAttemptsWithUsersByTeacherExam + fetchTeacherExamQuestions + fetchAttemptAnswersByAttemptIds
  → computeSummaryStats + computeScoreDistribution (derived)
  → returns { exams, loading, error, selectedExam, evalData, search, filter, derived }

useExamDetail (hook, for modal)
  → fetchTeacherExamQuestions + fetchTeacherExamAttempts (parallel)
  → returns { data, loading, error, refetch }

useExamResponsive (hook)
  → owns all responsive calculations (grid cols, font sizes, chart heights)
  → consumed directly by each component
```

## Component Hierarchy

```
SubAdminExams (page)
  ├── ExamListSection (exam browser with filter)
  │     └── AdminFilterBar
  └── ExamDetailSection (orchestration)
        ├── ExamSummaryCards (overview stat cards)
        ├── ExamScoreDistribution (bar chart)
        ├── ExamQuestionAnalysis (question-wise grid)
        ├── ExamPerformers (top/bottom 5)

SubAdminDashboard (page)
  └── ExamDetailModal (standalone modal)
        └── QuestionList / LeaderboardTable (inline sub-renderers)
```

## Data Flow

```
useExamData (hook)
  → fetches exams, eval data, computes stats
  → returns 16 values

SubAdminExams (page)
  → passes business props to sections
  → no responsive calculations (owned by hook)

ExamDetailSection (orchestration)
  → renders header, loading/error/empty states
  → composes 5 presentation components

useExamDetail (hook)
  → fetches questions + leaderboard for modal
  → returns { data, loading, error, refetch }

ExamDetailModal (standalone)
  → consumes useExamDetail
  → pure presentation via AdminModal

useExamResponsive (hook)
  → owns all responsive calculations
  → consumed directly by each component
```

## Responsive Ownership

```
useExamResponsive
  ├── layout: grid columns, card dimensions, spacing
  ├── typography: all font sizes
  └── charts: chart heights
```

No responsive calculations belong inside pages. Each component calls `useExamResponsive()` directly.

## State Ownership

| State | Owner |
|-------|-------|
| Exam list fetch | `useExamData` |
| Exam selection | `useExamData` |
| Eval data fetch | `useExamData` |
| Search / month filter | `useExamData` |
| Modal questions/leaderboard fetch | `useExamDetail` |
| Loading / error / empty | `ExamDetailSection` (parent) |
| Modal loading / error / empty | `ExamDetailModal` (via `useExamDetail`) |
| Header copy summary | `ExamDetailSection` |
| Modal tab switching | `ExamDetailModal` |
| Modal copy leaderboard | `ExamDetailModal` |

## Responsive Values

All responsive values are computed in `useExamResponsive`:

- `layout`: summaryGridCols, qGridCols, cardH, cardPad, rowH, btnH
- `typography`: titleFont, subFont, qFont, qStat, perfFont, tblFont, barFont, cardLbl, cardVal
- `charts`: barH

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Feature barrel |
| `useExamResponsive.ts` | Responsive calculations hook |
| `useExamData.ts` | Data fetching + state hook (Exams page) |
| `useExamDetail.ts` | Data fetching + state hook (ExamDetailModal) |
| `types.ts` | TypeScript interfaces |
| `ExamListSection.tsx` | Exam browser with filter |
| `ExamCard.tsx` | Canonical exam container — also rendered by the dashboard Recent Deployments (`dashboard/RecentExamItem`) |
| `ExamDetailSection.tsx` | Detail view orchestration |
| `ExamDetailModal.tsx` | Standalone modal (used by SubAdminDashboard) |
| `ExamSummaryCards.tsx` | Overview stat cards |
| `ExamScoreDistribution.tsx` | Bar chart |
| `ExamQuestionAnalysis.tsx` | Question-wise analysis |
| `ExamPerformers.tsx` | Top/bottom performers (leaderboard view) |
| `ExamSubComponents.tsx` | Shared UI helpers |

## Reusable Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `Button` | AntigravityUI | Copy Summary, Export CSV, Retry |
| `Card` | AntigravityUI | ExamCard container (premium-neutral), summary cards (default), question cards |
| `Badge` | AntigravityUI | Exam status badges |
| `Grid` | AntigravityUI | Exam list grid (cols=3) |
| `Stack` | AntigravityUI | Vertical/horizontal spacing across all components |
| `SectionHeader` | AntigravityUI | Section titles with icons and actions |
| `PageContainer` | AntigravityUI | Page wrapper |
| `SectionReveal` | AntigravityUI | Entry animations |
| `EmptyState` | SharedComponents | Empty states (list, detail, modal) |
| `LoadingSkeleton` | SharedComponents | Skeleton content |
| `GridSkeleton` | SharedComponents | Grid loading placeholder |
| `StatSkeleton` | SharedComponents | Stat card loading placeholder |
| `ErrorContainer` | ErrorContainer | Error display |
| `RetryButton` | RetryButton | Retry action |
| `Tabs` | AntigravityUI | Modal tab switching |
| `IconBadge` | AntigravityUI | Modal header badge |
| `IconButton` | AntigravityUI | Back navigation button |
| `AdminModal` | AdminModal | Modal shell (FocusTrap, portal, keyboard handling) |
| `AdminFilterBar` | AdminFilterBar | Search + month filter + refresh |
| `AdminText` | AdminText | Typography (cinzel variant) |
| `AdminIconWrap` | AdminIconWrap | Question number icons |

## Design System Compliance

- All cards use canonical `Card` variants (`premium-neutral`, `default`)
- All buttons use canonical `Button` (no custom buttons except feature-specific badges)
- All badges use semantic variant matching (`success` for published, `warning` for draft);
  the `ExamCard` status/Live badges use the `curved` (rounded-full) opt-in, aligned top-right
- All empty states use canonical `EmptyState` with Lucide icons
- All loading uses canonical `LoadingSkeleton` / `GridSkeleton` / `StatSkeleton`
- All errors use canonical `ErrorContainer` + `RetryButton`
- Modal uses canonical `AdminModal` with FocusTrap and Escape key
- Tabs use canonical `Tabs` with keyboard navigation
- Typography uses design tokens (`var(--text-muted)`, `text-primary`, etc.)
- Custom `RankBadge` and `AccuracyBadge` in `ExamSubComponents` are feature-local visual helpers (not replacements for canonical Badge)

## Accessibility

- All interactive cards: `role="button"`, `tabIndex={0}`, Enter/Space keyboard handlers
- `aria-label` on all interactive elements (buttons, cards, modal, tabs)
- `aria-hidden="true"` on all decorative icons
- `aria-expanded` / `aria-controls` on expandable sections
- `role="region"` with `aria-label` on collapsible content areas
- `role="alert"` on error states
- `role="status"` on loading states
- `role="tabpanel"` on tab content with `aria-label`
- `role="list"` / `role="listitem"` on question and leaderboard lists
- `scope="col"` on table header cells
- Modal: FocusTrap, Escape key handler, `aria-modal`, `aria-labelledby`
- Score distribution chart: `role="img"` with descriptive `aria-label`
- `type="button"` on all action buttons

## Governance Rules

1. Pages compose components — never fetch data or orchestrate services directly
2. Hooks own data fetching, state, and derived computations
3. Components own presentation only — no business logic in JSX
4. Types have single ownership — defined in `types.ts`, re-exported via barrel
5. Reuse shared components — prefer canonical Button, Card, Badge, Grid, Stack, etc.
6. All styling from design tokens — no hardcoded color values
7. Memoize expensive list components — `memo()` on components that render lists with stable props
8. Three-state rendering — loading → error → empty → data
9. Responsive calculations centralized in `useExamResponsive` — never inline in pages
10. Feature-local hooks preferred for encapsulation — hooks live inside the feature folder

## Future Extension Points

- New chart types → add to `ExamScoreDistribution` or create new sibling
- Comparison mode → new component alongside `ExamDetailSection`
- Export options → extend header actions in `ExamDetailSection`
- New analytics → new presentation component composed by `ExamDetailSection`

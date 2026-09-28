# Admin Questions

Feature directory for Admin → Questions management.

## Architecture

```
AdminQuestions.tsx (page — pure composition)
└── useAdminQuestions (hook) — fetch, filter, paginate, delete
    ├── useAdminFilters (shared — URL-based filter state)
    └── adminQuestionService (API layer)
├── QuestionsActions — search + difficulty filter + add/bulk buttons
├── QuestionsTable — premium CollectionCard layout="row" management list
│   ├── QUESTION_TABLE_GRID — the ONE deterministic responsive grid contract,
    │   shared by the header and every row (header ↔ row alignment):
    │   mobile  20px | 28px | minmax(0,1fr) | 112px
    │   md+     20px | 28px | minmax(0,1fr) | 72px | 112px
    │   (SELECT | NUMBER | QUESTION | DIFFICULTY | ACTIONS)
│   ├── FloatingListHeader padding="md" — header bar, 16px inset matching rows
│   ├── SelectionCheckbox (Foundation, common) — leading slot
│   ├── NumberBadge (Foundation, common) — dedicated NUMBER column
│   ├── DifficultyBadge → Pill (md+) — fixed 72px DIFFICULTY track
│   └── QuestionsTableComponents — ActionsCell (3 × IconButton sm = 112px)
├── QuestionForm — bilingual (EN/TE) form with read/edit/add modes
├── modals/
│   ├── SingleQuestionModal — create/edit/view
│   └── BulkUploadModal — 4-tab wizard (Instructions → Generate → JSON → Preview & Sync)
│       └── BulkUploadPanel — tab content + AI prompt presets
│           └── useBulkUpload — parse, validate, hash, upload
├── AIToolCards — AI provider selection cards
├── InstructionsTab / JsonTab / PreviewTab — wizard step content
├── UploadProgressOverlay — sync progress indicator
└── PromptEditorModal — edit AI prompt templates
```

## Key Decisions

- `useAdminFilters` stays global — URL-based for shareable admin links
- `useBulkUpload` is feature-local — specific to the admin questions bulk ingest workflow
- Page is pure composition — no state management beyond hook calls
- All presentational components wrapped in `memo`
- Header and rows consume the same `QUESTION_TABLE_GRID` constant and the same
  16px horizontal inset (`FloatingListHeader padding="md"` + `CollectionCard
  padding={16}`), so columns resolve to identical geometry at every viewport
- The loading state composes canonical `Skeleton`/`LoadingSkeleton`/`Card`
  primitives into the final page structure (metadata row, elevated card,
  header bar, five question rows on the same grid, pagination) — no separate
  skeleton component family

## Verification

Two maintained regression tools cover the table's responsive alignment contract:

1. **Structural (CI):** `src/admin-questions-alignment.test.tsx` — vitest suite
   asserting the DOM contract (shared grid constant, column model, visibility,
   single result count, skeleton composition, premium border token).
2. **Geometric (browser):** `scripts/verify-questions-alignment.mjs` — Playwright
   script measuring the REAL rendered table at 390/768/1280 px (header ↔ row
   edges ≤1px, action-center stability, 72px difficulty track fit, 16px insets,
   overflow, skeleton parity, light/dark) and saving screenshots to
   `test-results/questions-alignment/`. It drives the dev-only harness route:

   ```
   npm run dev                                 # terminal 1
   node scripts/verify-questions-alignment.mjs # terminal 2
   ```

   The harness (`/dev/aq-alignment` → `src/dev/AqAlignmentHarness.tsx`) renders
   this real `QuestionsTable` with fixture rows, no auth required. Its route is
   registered in `App.tsx` behind `import.meta.env.DEV` with an inline
   `lazy()` so production builds dead-code-eliminate both the route and the
   chunk entirely. Append `?skeleton=1` to force the loading state.

## Performance / footprint notes

- **LOW — stale-offset round-trip (accepted tradeoff).** On a filter change
  while `page > 0`, the page-reset effect (`setPage(0)`) and the fetch effect
  both fire: an intermediate RPC with the new filter at the OLD offset is
  dispatched before the page-0 RPC. The F-2 sequence guard makes the final
  state correct (proven by `A-06`); the cost is one extra RPC. Fixing it would
  require reordering the two effects, which risks the validated race guard — so
  it is documented rather than "optimized."

## Known asymmetry (pre-existing, app-wide, not introduced here)

Other shared primitives (`AntigravityButton`, `ThemeToggle`, …) still use the
legacy `border-[var(--border-premium-width)]` syntax that Tailwind v4 does not
compile to a width, so those elements render borderless. The questions-page row
cards (the defect tracked by AQ-07) are FIXED: `AntigravityCard`'s
`PREMIUM_SURFACE` / `PREMIUM_SURFACE_IMAGE` / `MANAGEMENT_SURFACE` use the
length-hint syntax `border-(length:--border-premium-width)` and resolve the 1px
border at runtime, matching the header bar.

# Admin Questions

Feature directory for Admin → Questions management.

## Architecture

```
AdminQuestions.tsx (page, 144 lines)
└── useAdminQuestions (hook, 140 lines) — fetch, filter, paginate, delete
    ├── useAdminFilters (shared — URL-based filter state)
    └── adminQuestionService (API layer)
├── QuestionsActions — search + difficulty filter (Foundation CollectionFilter premium dropdown) + add/bulk buttons (Foundation CollectionToolbar)
├── QuestionsTable — compact premium `CollectionCard layout="row"` management list (golden reference)
│   ├── CollectionHeader (Foundation — select-all + range)
│   ├── SelectionCheckbox (Foundation, common)
│   └── QuestionsTableComponents — ActionsCell
├── QuestionForm (378 lines) — bilingual (EN/TE) form with read/edit/add modes
├── modals/
│   ├── SingleQuestionModal — create/edit/view
│   └── BulkUploadModal — 4-tab wizard (Instructions → Generate → JSON → Preview & Sync)
│       └── BulkUploadPanel — tab content + AI prompt presets
│           └── useBulkUpload (614 lines) — parse, validate, hash, upload
├── AIToolCards — AI provider selection cards
├── InstructionsTab / JsonTab / PreviewTab — wizard step content
├── UploadProgressOverlay — sync progress indicator
└── PromptEditorModal — edit AI prompt templates
```

## Key Decisions

- `useAdminFilters` stays global — URL-based for shareable admin links
- `useBulkUpload` is feature-local (moved from `src/hooks/`) — 614-line hook is specific to admin questions bulk ingest workflow
- Page is pure composition — no state management beyond hook calls
- All presentational components wrapped in `memo`

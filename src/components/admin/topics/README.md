# Admin Topics

Feature directory for Admin → Topics management.

## Architecture

```
AdminTopics.tsx (page, 233 lines)
└── useAdminTopics (hook, 223 lines) — fetch, CRUD, reorder, publish, parse
    ├── useAdminFilters (shared — URL-based filter state)
    ├── useAsyncOperation (shared — loading state)
    ├── useToast (shared — notifications)
    └── topicsService → topic.repository (Supabase)
├── TopicsToolbar — subject heading + topic count + Add button
├── TopicListItem — individual topic row with move/publish/preview/edit/delete actions
├── TopicMetadataFields — display order + YouTube URL + publish toggle
├── LangInputPanel — bilingual title + raw text editor + parse button + parsed preview
├── ParsedPreview — parsed section/card structure preview
└── AdminTopicPreviewRenderer — full student-facing preview with language toggle
```

## Key Decisions

- `useAdminTopics` owns all form state (14 fields) rather than a single `formState` object — matching the existing interface pattern where individual setters are passed directly to child components
- Optimistic UI for publish toggle (reverts on failure)
- Batch `display_order` update on reorder
- All presentational components wrapped in `memo`
- Parse logic in `utils/parseOutlineText.ts` (shared with user-facing topics)

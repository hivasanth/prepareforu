# Admin Upload

Feature directory for Admin → Upload question entry method routing.

## Architecture

```
AdminUpload.tsx (page, pure composition)
└── useAdminUpload (hook) — method selection, context validation, question count,
│   live topic list, clicked-topic selection state
│   ├── useToast (shared — notifications)
│   ├── useSupabaseQuery (shared — question count + topics fetch)
│   ├── adminQuestionService.countQuestions (API)
│   └── topicTestService.fetchTopicsBySubject (API — SAME live query path as
│       User Panel Topic Exams; exam_topics with distinct-questions fallback)
├── MethodSelectionView — two-card method selection screen
├── UploadContextPanel — context configuration with tabs + status card
│   ├── AdminSelectionTabs (shared — exam/paper/subject selection)
│   └── Card / Badge / Skeleton (AntigravityUI)
├── SubjectTopicsGrid — one card per LIVE topic of the selected subject
│   │   (visual reference: User Panel Topic Exams TopicPortalView — same Card
│   │   variant "premium-dark-neutral", IconBadge, Body typography, grid
│   │   geometry, GridSkeleton; action slot = canonical Button)
│   ├── BilingualToggle (shared — display-only EN/TE preference)
│   └── EmptyState / ErrorState / GridSkeleton (SharedComponents)
├── SingleQuestionModal (from admin/questions/modals) — manual question entry,
│   receives topicId/topicEnglish/topicTelugu from the clicked card
└── Bulk action → navigate(`/admin/upload/bulk-parser/topic/:topicId`)
    → AdminBulkParserTopic page (topic-scoped bulk parser)
```

## Upload Workflow

1. User lands on method selection screen with two choices:
   - **Add One by One** → manual entry workspace (topic cards)
   - **Upload Many at Once** → bulk topic cards (the Launch Bulk Parser
     button was REMOVED — bulk is now topic-scoped like manual)
2. After method selection, user configures context (exam → paper → subject).
   SUBJECT is the last filter.
3. Once a subject is selected, LIVE topics of that subject render as cards
   below the ready-context card — the SAME `SubjectTopicsGrid` component for
   both flows, differing only in action label (**Upload Manually** vs
   **Bulk Upload**). Each grid has one shared EN/TE display toggle above it.
4. Manual: clicking a card opens the EXISTING SingleQuestionModal seeded with
   the clicked topic's identity (`topic_en` / `topic_te` are persisted on the
   question; the DB trigger `trg_validate_question_topic` validates the
   exam/paper/subject/topic relationship server-side). Bulk: clicking a card
   navigates to `/admin/upload/bulk-parser/topic/:topicId?exam=&paper=&subject=`
   carrying ONLY canonical `topic_id` in the path.
5. On success: modal closes, toast shown, authoritative question count refetched.

## State Ownership

| State | Owner | Mechanism |
|---|---|---|
| uploadType | useAdminUpload | 'single' \| 'bulk' \| null |
| activeModal | useAdminUpload | 'single' \| null (bulk no longer opens a modal here) |
| labels | useAdminUpload | { exam, paper } from AdminSelectionTabs |
| isContextValid | useAdminUpload | Derived from filter selection |
| questionCount | useAdminUpload | useSupabaseQuery (live refetch on save) |
| topics | useAdminUpload | useSupabaseQuery → topicTestService.fetchTopicsBySubject |
| selectedTopic | useAdminUpload | ONE `{ id, name_en, name_te }` object from the clicked card; cleared on any exam/paper/subject change or modal close |
| toasts | useAdminUpload | useToast |
| exam/paper/subject | useAdminFilters (shared) | URL search params |

## Key Decisions

- Page is a **method router**, not a content owner — delegates all question entry to existing modals from Admin → Questions feature
- `useAdminUpload` wraps `useAdminFilters` values with upload-specific orchestration (isContextValid with `APPSC_GROUPS` exclusion)
- Topics come ONLY from the live backend — no hardcoded/mock topic data anywhere in the feature
- The subject-level "Open Manual Form" button was removed: manual entry is topic-scoped, launched per card. Bulk has NO launch button either: its topic-card action navigates to the topic-scoped bulk parser page (`/admin/upload/bulk-parser/topic/:topicId`), carrying only canonical `topic_id` in the route path.
- Both flows reuse the SAME `SubjectTopicsGrid` component (`actionLabel` / `onTopicAction` props) — no duplicated topic-card styling; bulk grid renders only topics with a canonical `id`.
- `BulkUploadModal` remains in `admin/questions/modals/` for the Admin → Questions entry point only.
- Modals are imported from `admin/questions/modals/` — no duplication of question entry logic
- Toast ownership in hook ensures `handleSuccess` and `BulkUploadModal.showToast` share the same toast instance

## Accessibility

- `aria-live="polite"` on upload content container and topics grid
- `role="status"` skeletons for count and topic loading states
- ErrorState (`role="alert"`) with real retry for failed topic fetches
- Only the Upload Manually / Bulk Upload buttons and BilingualToggle are interactive inside topic cards (cards themselves are not buttons)
- Keyboard-navigable AdminSelectionTabs for context selection
- ToastContainer for success/error announcements

## Governance

- Page is pure composition — no state or data fetching
- Hook is single-responsibility — upload workflow orchestration only
- No upload-specific service or repository — reuses topicTestService (topics) and adminQuestionService (save path)
- Feature directory encapsulates all upload-specific presentation

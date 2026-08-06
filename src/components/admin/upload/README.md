# Admin Upload

Feature directory for Admin → Upload question entry method routing.

## Architecture

```
AdminUpload.tsx (page, 65 lines)
└── useAdminUpload (hook, 80 lines) — method selection, context validation, question count
    ├── useToast (shared — notifications)
    ├── useSupabaseQuery (shared — question count fetch)
    └── adminQuestionService.countQuestions (API)
├── MethodSelectionView (83 lines) — two-card method selection screen
└── UploadContextPanel (87 lines) — context configuration with tabs, status card, launch button
    ├── AdminSelectionTabs (shared — exam/paper/subject selection)
    └── Button / Card / Badge (AntigravityUI)
├── SingleQuestionModal (from admin/questions/modals) — manual question entry
└── BulkUploadModal (from admin/questions/modals) — AI-powered bulk ingest
    └── useBulkUpload (feature-local)
```

## Upload Workflow

1. User lands on method selection screen with two choices:
   - **Add One by One** → launches SingleQuestionModal
   - **Upload Many at Once** → launches BulkUploadModal
2. After method selection, user configures context (exam → paper → subject)
3. "Launch" button opens the corresponding modal
4. Modal handles the actual question entry/bulk parsing workflow
5. On success: modal closes, toast shown, question count refetched

## State Ownership

| State | Owner | Mechanism |
|---|---|---|
| uploadType | useAdminUpload | 'single' \| 'bulk' \| null |
| activeModal | useAdminUpload | 'single' \| 'bulk' \| null |
| labels | useAdminUpload | { exam, paper } from AdminSelectionTabs |
| isContextValid | useAdminUpload | Derived from filter selection |
| questionCount | useAdminUpload | useSupabaseQuery |
| toasts | useAdminUpload | useToast |
| exam/paper/subject | useAdminFilters (shared) | URL search params |

## Key Decisions

- Page is a **method router**, not a content owner — delegates all question entry to existing modals from Admin → Questions feature
- `useAdminUpload` wraps `useAdminFilters` values with upload-specific orchestration (isContextValid with `APPSC_GROUPS` exclusion)
- Modals are imported from `admin/questions/modals/` — no duplication of question entry logic
- Toast ownership in hook ensures `handleSuccess` and `BulkUploadModal.showToast` share the same toast instance

## Accessibility

- `aria-live="polite"` on upload content container
- `role="button"` with `tabIndex={0}` and keyboard handlers on method selection cards
- Keyboard-navigable AdminSelectionTabs for context selection
- ToastContainer for success/error announcements

## Governance

- Page is pure composition — no state or data fetching
- Hook is single-responsibility — upload workflow orchestration only
- No upload-specific service or repository — delegates to adminQuestionService
- Feature directory encapsulates all upload-specific presentation

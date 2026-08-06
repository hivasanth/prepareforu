# Phase 4.1 — Admin Questions: Foundation Consumption Comparison

**Status:** READ-ONLY PLANNING (2026-08-03) · D-148
**Baseline:** Certified Management Surface Family (Phase 3.9, D-144/D-145) · Admin Users reference (Phase 4.0, D-146/D-147)

For every reusable Foundation component consumed by Admin Questions, this records the current API, the certified Management API, migration effort, and risk. Variant-swap rows are ready; rows marked ⚠ require a decision or a Foundation/shared gate (never patched here).

---

## Toolbar & Controls

| # | Component | Location | Current API | Certified Management API | Effort | Risk |
|---|---|---|---|---|---|---|
| C1 | `CollectionToolbar` | `QuestionsActions.tsx:23` | `<CollectionToolbar>` (default premium) | `<CollectionToolbar variant="management">` | trivial (prop) | none — surface only |
| C2 | `Input` (search) | `QuestionsActions.tsx:28` | default | `variant="management"` | trivial | none |
| C3 | `CollectionFilter` (difficulty) | `QuestionsActions.tsx:38` | default premium | `variant="management"` (Menu management internally) | trivial | none |
| C4 | `Button` Bulk Upload | `QuestionsActions.tsx:56` | `variant="secondary"` premium | `variant="secondary" management` | trivial | none |
| C5 | `Button` Add Question | `QuestionsActions.tsx:68` | `variant="primary"` premium | `variant="primary" management` | trivial | none |
| C6 | `Button` ×~7 (modal footers, tabs, prompt save, overlay retry) | modals + tabs | secondary/primary premium | add `management` prop | trivial | none |

## List

| # | Component | Location | Current API | Certified Management API | Effort | Risk |
|---|---|---|---|---|---|---|
| C7 | `GridSkeleton` | `QuestionsTable.tsx:51` | default premium | `variant="management"` | trivial | none |
| C8 | `CollectionCard` (row) | `QuestionsTable.tsx:79-107` | `variant="premium" layout="row" padding={16}` | `variant="management" layout="row" padding={16}` | trivial | none — same slots (leading/title/trailing/actions), Admin Users proves the composition |
| C9 | `CollectionHeader` | `QuestionsTable.tsx:64` | shared, no variant | none (CollectionHeader family) | — | ✅ retained |
| C10 | `Pagination` | `QuestionsTable.tsx:112` | shared, no variant | none (Pagination family) | — | ✅ retained |
| C11 | `SelectionCheckbox` | `QuestionsTable.tsx:88` | shared | shared (already management rows) | — | ✅ retained |
| C12 | `PremiumIconContainer` (serial #) | `QuestionsTable.tsx:89-95` | **premium gold** | **none** | — | ⚠ **G5** — either retain premium accent or a Foundation/shared gate; no management variant exists |
| C13 | `IconButton` ghost (view/edit/delete) | `QuestionsTableComponents.tsx` | ghost + status hover (primary/secondary/danger) | **none** (`IconButton` has no `management` prop) | — | ⚠ **G6** — retained as status/ghost (matches Status-family independence) |
| C14 | `DifficultyBadge` | `QuestionsTable.tsx:103` | `Badge` status (success/warning/danger) | none (Status family) | — | ✅ retained |

## Form (inside SingleQuestionModal)

| # | Component | Location | Current API | Certified Management API | Effort | Risk |
|---|---|---|---|---|---|---|
| C15 | `TextArea` (question text, options, explanation, visual JSON) | `QuestionForm.tsx:83,107,174,253,329,366,387` | default | **none — no `management` variant on `TextArea`** | — | ⚠ **G7** Foundation gap: form fields inside a management dialog would stay premium |
| C16 | `Input variant="compact"` (negative marks) | `QuestionForm.tsx:231` | compact | `management` exists but changes density/width semantics | low | ⚠ **G8** decision: keep `compact` (consistent with the field row) or swap to `management` (uniform surface) |
| C17 | `RadioGroup` (difficulty) | `QuestionForm.tsx:212` | default | none | — | ✅ retained |
| C18 | `Badge` ×3 (Required / Active / Not Translated) | `QuestionForm.tsx:67,104,306` | status | none (Status family) | — | ✅ retained |
| C19 | Correct-option highlights | `QuestionForm.tsx` | success/warning status hues | none (Status family) | — | ✅ retained |
| C20 | `QuestionVisualizer` | `QuestionForm.tsx:79,126` | content renderer | content renderer | — | ✅ retained |

## Modals

| # | Component | Location | Current API | Certified Management API | Effort | Risk |
|---|---|---|---|---|---|---|
| C21 | `AdminModal` | `modals/SingleQuestionModal.tsx:181` | default premium | `variant="management"` | trivial | none — FocusTrap/Escape/focus-restore identical, class-only change |
| C22 | `AdminModal` | `modals/BulkUploadModal.tsx:56` | default premium | `variant="management"` | trivial | none |
| C23 | `AdminModal` | `PromptEditorModal.tsx:72` | default premium | `variant="management"` | trivial | none |
| C24 | `Badge` header badges | `SingleQuestionModal.tsx:198` `BulkUploadModal.tsx:62` | status primary | none (Status family) | — | ✅ retained |
| C25 | `Tabs` (wizard steps) | `BulkUploadModal.tsx:66` | default | none (Tabs family) | — | ✅ retained |
| C26 | `BilingualToggle` | `SingleQuestionModal.tsx:204` | shared | shared | — | ✅ retained |
| C27 | `Alert` error/warning | modals, panel, tabs | status | none (Status family) | — | ✅ retained |
| C28 | `Input` (prompt topic) | `PromptEditorModal.tsx:98` | default | `variant="management"` | trivial | none |
| C29 | `TextArea` (prompt text) | `PromptEditorModal.tsx:114` | default | **none** | — | ⚠ **G7** |
| C30 | `Label` / `Checkbox` | `PromptEditorModal.tsx:97,131` | default | none | — | ✅ retained |
| C31 | `ConfirmModal` (delete Q / delete prompt) | `AdminQuestions.tsx:138` `BulkUploadPanel.tsx:135` | premium panel | none | — | ⚠ **G2** shared gate (Phase 4.0 gap) |

## Bulk workflow surfaces

| # | Component | Location | Current API | Certified Management API | Effort | Risk |
|---|---|---|---|---|---|---|
| C32 | `Card variant="subtle"` (AI tools intro) | `AIToolCards.tsx:36` | subtle | `variant="management"` | trivial | low — brand-colour `<button>` tiles inside stay brand-coloured (G9) |
| C33 | `Card variant="subtle"` (instructions) | `InstructionsTab.tsx:22` | subtle + `!bg-primary/5` override | `variant="management"` | trivial | low — accent override retained (G9) |
| C34 | `Card variant="premium-neutral"` (prompt templates) | `InstructionsTab.tsx:50,70` | **premium-neutral** | `variant="management"` | trivial | none |
| C35 | `IconButton` ghost (edit/delete template) | `InstructionsTab.tsx:74-87` | ghost | none | — | ✅ retained (G6) |
| C36 | `Button` copy / soft / success | `InstructionsTab.tsx:39,58,91` | soft/success secondary | secondary → `management`; soft/success = Status family | trivial | ✅ mixed (status retained) |
| C37 | `TextArea` (JSON) | `JsonTab.tsx:23` | default | **none** | — | ⚠ **G7** |
| C38 | `Badge` (application/json) | `JsonTab.tsx:19` | status | none | — | ✅ retained |
| C39 | `Card variant="subtle"` (stats) | `PreviewTab.tsx:24` | subtle | `variant="management"` | trivial | none |
| C40 | Preview rows | `PreviewTab.tsx:42` | page-owned divs | n/a — content preview | — | ✅ retained |
| C41 | Progress overlay | `UploadProgressOverlay.tsx:26` | page-owned overlay (`bg-card-bg/95`) | `Button` → management prop; overlay = page-owned | low | ⚠ **G10** decision |
| C42 | `IconBadge` status icons | `UploadProgressOverlay.tsx:43,53` | status | none | — | ✅ retained |
| C43 | `Button` Try Again | `UploadProgressOverlay.tsx:92` | primary | `management` prop | trivial | none |

## Page shell & shared

| # | Component | Location | Current API | Certified Management API | Effort | Risk |
|---|---|---|---|---|---|---|
| C44 | `AdminSelectionTabs` | `AdminQuestions.tsx:43` | premium (SelectionContainer + Tabs) | `SelectionContainer variant="management"` exists but is inside shared composite | — | ⚠ **G1** shared gate |
| C45 | `EmptyState` | `AdminQuestions.tsx:95` | default premium | `variant="management"` | trivial | none — no action button passed, so Phase-4.0 G3 does not apply here |
| C46 | `ToastContainer` | `AdminQuestions.tsx:149` | default premium | `variant="management"` | trivial | none |
| C47 | `BulkActionBar` | `AdminQuestions.tsx:104` | ancient-card + amber (`admin/common`) | none | — | ⚠ **G4** shared gate |
| C48 | `Alert variant="error"` | `AdminQuestions.tsx:58` | status | none (Status family) | — | ✅ retained |

---

## Effort / Risk summary

- **Ready (variant/`management`-prop swap only):** C1–C8, C21–C23, C28, C32–C34, C36 (secondary), C39, C43, C45, C46 — **24 low-risk swap points** across 10 certified APIs. Zero layout, logic, a11y, or responsive changes.
- **Retained as Status/Tabs/Pagination/CollectionHeader family (independent, D-141):** C9–C11, C14, C17–C20, C24–C27, C30, C35, C38, C40, C42, C48.
- **Blocked by shared-component gates (never touched in a page migration):** C31 (G2 `ConfirmModal`), C44 (G1 `AdminSelectionTabs`), C47 (G4 `BulkActionBar`).
- **Decision / Foundation gap (documented, not patched):** C12 (G5 serial badge), C13 (G6 IconButton ghost), C15/C29/C37 (G7 `TextArea` — no management variant), C16 (G8 compact input), C32/C33 (G9 brand accent overrides), C41 (G10 overlay).

---
*Back to [AUDIT](ADMIN_QUESTIONS_MANAGEMENT_SURFACE_AUDIT.md) · [IMPLEMENTATION_PLAN](ADMIN_QUESTIONS_MANAGEMENT_SURFACE_IMPLEMENTATION_PLAN.md)*

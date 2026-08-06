# Phase 4.1 — Admin Questions Management Surface Audit

**Status:** READ-ONLY PLANNING (2026-08-03) · D-148 · zero source-code changes
**Scope:** `src/pages/admin/AdminQuestions.tsx` + `src/components/admin/questions/**`
**Baseline:** Admin Users = First Certified Management Surface Consumer (D-147) · Foundation frozen (D-144/D-145)

---

## 1. Surface Audit

Every visible surface on the page and its `questions/**` components. Owner = page-owned (`P`, in `questions/**`) vs shared (`S`, outside `questions/**`) vs Foundation composite (`F`).

### 1.1 Page shell — `src/pages/admin/AdminQuestions.tsx`

| Surface | Owner | Foundation component | Current variant | Management equivalent | Migration readiness |
|---|---|---|---|---|---|
| Page title | P | `H1 className="sr-only"` | — | — | ✅ retained (no surface) |
| Stack wrapper | P | `Stack gap="lg"` | — | — | ✅ retained |
| Section reveals | P | `SectionReveal` | — | — | ✅ retained |
| Exam/Paper/Subject selection | S | `AdminSelectionTabs` | premium (internal `SelectionContainer` + `Tabs`) | Management `SelectionContainer` exists | ⚠ **G1** shared-composite gate |
| Error banner | P | `Alert variant="error"` | status | none (Status family independent, D-141) | ✅ retained |
| Toolbar group | P | `QuestionsActions` (composite) | premium | Management variants inside | see §1.2 |
| List group | P | `QuestionsTable` (composite) | premium | Management variants inside | see §1.3 |
| Empty state | P | `EmptyState` | premium (default) | `variant="management"` | ✅ swap only (no action button → G3 n/a here) |
| Bulk action bar | S | `BulkActionBar` (`admin/common`) | ancient-card + amber | none | ⚠ **G4** shared-composite gate |
| Delete confirm | S | `ConfirmModal` | premium (`AdminModal` panel) | none | ⚠ **G2** shared-composite gate |
| Toasts | P | `ToastContainer` | premium (default) | `variant="management"` | ✅ swap only |
| Single-question modal | P | `SingleQuestionModal` (lazy) | premium | `AdminModal variant="management"` | see §1.5 |
| Bulk-upload modal | P | `BulkUploadModal` (lazy) | premium | `AdminModal variant="management"` | see §1.6 |

### 1.2 Toolbar — `src/components/admin/questions/QuestionsActions.tsx`

| Surface | Owner | Foundation component | Current variant | Management equivalent | Migration readiness |
|---|---|---|---|---|---|
| Toolbar | P | `CollectionToolbar` | premium (default) | `variant="management"` | ✅ swap only |
| Search field | P | `Input` | default | `variant="management"` | ✅ swap only |
| Difficulty filter | P | `CollectionFilter` | premium (default) | `variant="management"` (Menu management internally) | ✅ swap only |
| Bulk Upload button | P | `Button variant="secondary"` | premium secondary | `management` prop | ✅ swap only |
| Add Question button | P | `Button variant="primary"` | premium primary | `management` prop | ✅ swap only |

### 1.3 List — `src/components/admin/questions/QuestionsTable.tsx` + `QuestionsTableComponents.tsx`

| Surface | Owner | Foundation component | Current variant | Management equivalent | Migration readiness |
|---|---|---|---|---|---|
| Loading skeleton | P | `GridSkeleton` | premium (default) | `variant="management"` | ✅ swap only |
| Select-all + range | P | `CollectionHeader` | shared | none (CollectionHeader family independent) | ✅ retained |
| Question row | P | `CollectionCard layout="row"` | **premium** | `variant="management"` | ✅ swap only |
| Row select | P | `SelectionCheckbox` | shared | shared (management row already) | ✅ retained |
| Serial-number badge | P | `PremiumIconContainer` | **premium gold** | none | ⚠ **G5** Foundation gap / page decision |
| Difficulty badge | P | `DifficultyBadge` → `Badge` | status (success/warning/danger) | none (Status family) | ✅ retained |
| Row actions | P | `IconButton variant="ghost"` (×3) | ghost + status hover | none (`IconButton` has no management prop) | ⚠ **G6** decision — status/ghost retained |
| Pagination | P | `Pagination` | shared | none (Pagination family independent) | ✅ retained |

### 1.4 Question form — `src/components/admin/questions/QuestionForm.tsx`

| Surface | Owner | Foundation component | Current variant | Management equivalent | Migration readiness |
|---|---|---|---|---|---|
| Question text / options / explanation | P | `TextArea` | default | **none** | ⚠ **G7** Foundation gap |
| Negative marks | P | `Input variant="compact"` | compact | `variant="management"` exists but differs in density | ⚠ **G8** decision — compact retained or swapped |
| Difficulty | P | `RadioGroup` | default | none | ✅ retained |
| Badges (Required / Active / Not Translated) | P | `Badge` | status | none (Status family) | ✅ retained |
| Correct-option highlight | P | success/warning status hues | status | none | ✅ retained |
| Visual metadata editor | P | `TextArea` | default | none | ⚠ **G7** Foundation gap |
| Visual preview | P | `QuestionVisualizer` | content | content | ✅ retained |

### 1.5 Single-question modal — `modals/SingleQuestionModal.tsx`

| Surface | Owner | Foundation component | Current variant | Management equivalent | Migration readiness |
|---|---|---|---|---|---|
| Dialog panel | P | `AdminModal` | premium (default) | `variant="management"` | ✅ swap only |
| Header badge | P | `Badge variant="primary"` | status | none | ✅ retained |
| Language toggle | P | `BilingualToggle` | shared | none | ✅ retained |
| Footer buttons | P | `Button` secondary / primary | premium | `management` prop | ✅ swap only |
| Save error | P | `Alert variant="error"` | status | none | ✅ retained |
| Form body | P | `QuestionForm` | see §1.4 | — | see §1.4 |

### 1.6 Bulk-upload modal — `modals/BulkUploadModal.tsx` + `BulkUploadPanel.tsx` + tabs + overlays

| Surface | Owner | Foundation component | Current variant | Management equivalent | Migration readiness |
|---|---|---|---|---|---|
| Dialog panel | P | `AdminModal` | premium (default) | `variant="management"` | ✅ swap only |
| Step tabs | P | `Tabs` | default | none | ✅ retained |
| AI badge | P | `Badge variant="primary"` | status | none | ✅ retained |
| Footer buttons | P | `Button` secondary / primary | premium | `management` prop | ✅ swap only |
| Action error | P | `Alert variant="error"` | status | none | ✅ retained |
| AI tool cards | P | `Card variant="subtle"` + brand-colour `<button>`s | subtle/premium + brand | `Card variant="management"` exists (brand cards = G9 decision) | ⚠ **G9** |
| Instructions card | P | `Card variant="subtle"` (+`premium-neutral` blocks) | subtle / premium-neutral | `Card variant="management"` | ✅/⚠ (G9) |
| Prompt template cards | P | `Card variant="premium-neutral"` | **premium-neutral** | `Card variant="management"` | ✅ swap only |
| JSON editor | P | `TextArea` | default | none | ⚠ **G7** Foundation gap |
| Validation errors | P | `Alert variant="error"` | status | none | ✅ retained |
| Skip Row | P | `Button variant="danger"` | status | none (Status family) | ✅ retained |
| Preview stats | P | `Card variant="subtle"` | subtle | `Card variant="management"` | ✅ swap only |
| Preview rows | P | page-local divs | page-owned | n/a (content preview) | ✅ retained |
| Duplicate warning | P | `Alert variant="warning"` | status | none | ✅ retained |
| Progress overlay | P | page-local overlay + `IconBadge` + `Button` | page-owned | `Button` management prop; overlay = G10 decision | ⚠ **G10** |
| Prompt delete confirm | S | `ConfirmModal` | premium | none | ⚠ **G2** |
| Prompt editor modal | P | `PromptEditorModal` → `AdminModal` | premium | `variant="management"` | ✅ swap only |
| Prompt fields | P | `Input` / `TextArea` / `Label` / `Checkbox` | default | Input only has management | ⚠ **G7** (TextArea) |

---

## 2. Foundation Consumption Audit (current → certified → effort → risk)

See `ADMIN_QUESTIONS_MANAGEMENT_SURFACE_FOUNDATION_COMPARISON.md` (full table with effort/risk per consumer).

**Summary by consumer count:**

| Certified Management API | Consumers in scope | Effort |
|---|---|---|
| `CollectionToolbar variant="management"` | 1 (`QuestionsActions`) | trivial |
| `Input variant="management"` | 2 (search, prompt topic) | trivial |
| `CollectionFilter variant="management"` | 1 | trivial |
| `Button management` | ~12 buttons (toolbar, modals, tabs, prompt, overlay) | trivial |
| `CollectionCard variant="management"` | 1 | trivial |
| `GridSkeleton variant="management"` | 1 | trivial |
| `EmptyState variant="management"` | 1 | trivial |
| `ToastContainer variant="management"` | 1 | trivial |
| `AdminModal variant="management"` | 3 (single, bulk, prompt) | trivial |
| `Card variant="management"` | 4 (AI tools, instructions, template blocks, preview stats) | trivial |

**Certified APIs with NO current consumer but available:** `Menu variant="management"` (internal to CollectionFilter), `SelectionContainer variant="management"` (blocked — G1).

---

## 3. Shared Component Audit

Dependencies on shared composites. **No modification in this phase.**

| Shared composite | Used by Admin Questions? | Class |
|---|---|---|
| `AdminSelectionTabs` (→ `SelectionContainer` premium + `Tabs`) | ✅ page top (G1) | **shared gap** — used by 7+ admin pages; own gate |
| `ConfirmModal` (→ `AdminModal` premium panel) | ✅ delete questions + delete prompt (G2) | **shared gap** — own overlay gate |
| `EmptyState` internal action `Button` (premium primary) | ❌ **not used** — Admin Questions renders `EmptyState` without `actionLabel`/`onAction` | n/a (G3 from Phase 4.0 does not block this page) |
| `BulkActionBar` (`admin/common`, ancient-card + amber) | ✅ page (G4) | **shared gap** — `admin/common`, outside `questions/**`; own gate |
| `SelectionContainer` direct | ❌ (only via AdminSelectionTabs) | G1 |
| Other `SharedComponents` | `GridSkeleton` + `EmptyState` (both have management variants) | ✅ no gap |

**New gaps introduced by this page (not present in Admin Users):** G4 (`BulkActionBar` amber bar), G5 (serial-number `PremiumIconContainer`), G7 (`TextArea` — no management variant), G8 (`Input compact` density), G9 (brand-colour AI tool cards), G10 (upload progress overlay).

---

## 4. Business Logic Audit

Migration must not touch logic. Document-only findings:

| Layer | Component | Migration impact |
|---|---|---|
| Data hook | `useAdminQuestions.ts` (138 lines) | **0-line diff required** — fetch, debounced search, difficulty filter, pagination, selection, delete, context labels, toasts |
| Bulk hook | `useBulkUpload.ts` (622 lines) | **0-line diff required** — prompt CRUD, JSON parse/validate/hash, chunked upload, progress |
| Services | `adminQuestionService`, `examService`, `adminService` | **0-line diff required** — none referenced by surface layer |
| State | `useAdminFilters` (URL-based) | unchanged |
| Permissions | `isAdmin(user)` guards in both hooks | unchanged |
| API | `listQuestions`, `createQuestion`, `updateQuestion`, `deleteQuestion`, `bulkDeleteQuestions`, `listPrompts`, `upsertPrompt`, `deletePrompt`, `bulkInsertQuestions` | unchanged |
| Loading / optimistic | `isLoading`, `isSubmitting`, `isUploading`, `isDeleting`, `uploadProgress` | unchanged — all surface-driven, unaffected by variant swaps |

**No business-logic change is required for any part of the migration.**

---

## 5. Responsive Audit (vs Admin Users reference)

| Region | Admin Users (reference) | Admin Questions | Parity |
|---|---|---|---|
| Page shell | `PageContainer` → `H1 sr-only` → `Stack gap="lg"` → `SectionReveal` | identical | ✅ |
| Toolbar | `flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0`; `w-full sm:w-fit` filter | identical (same classes) | ✅ |
| Rows | `CollectionCard layout="row"` | identical (layout="row") | ✅ |
| Loading | `GridSkeleton columns="grid-cols-1"` | identical | ✅ |
| Modal | `AdminModal` — full-screen mobile → `sm:h-auto sm:max-h-[92vh]` | identical structure | ✅ |
| Form grid | — | `grid-cols-1 sm:grid-cols-2` options; `grid-cols-2` metadata (isReadOnly only) | ✅ self-contained |
| Bulk bar | — | `w-[95vw] max-w-max` fixed bottom | ✅ retained (G4) |

**Desktop / tablet / mobile / XS:** all layout, spacing, and breakpoint classes are preserved by the planned migration; the migration is variant-selection-only and never touches responsive utilities. No responsive change required.

---

## 6. Accessibility Audit

| Surface | Current a11y | Migration impact |
|---|---|---|
| Page | `H1 sr-only`; `aria-live="polite"` + `aria-label="Questions list"` | ✅ retained |
| Toolbar | `Input aria-label`, `CollectionFilter ariaLabel`, icon buttons with text | ✅ retained |
| Rows | `CollectionCard titleAs="h3"`; `SelectionCheckbox label="Select this question"`; `IconButton aria-label` view/edit/delete | ✅ retained |
| Empty | `EmptyState` icon `role="img"` + title/subtitle | ✅ retained |
| Confirm | `ConfirmModal` initial-focus-on-Cancel, `AdminModal` FocusTrap + Escape + focus restore | ✅ retained (shared, G2) |
| Modals | `AdminModal` `role="dialog"` `aria-modal` `aria-labelledby`; FocusTrap; Escape; focus restore | ✅ retained — management variant is class-only |
| Toasts | `role="status"` `aria-live="polite"` | ✅ retained |
| Form | `aria-invalid` / `aria-describedby` on text fields + `aria-live="polite"` errors; `aria-expanded`/`aria-controls` Telugu toggle; `RadioGroup`; `Checkbox` | ✅ retained |
| Progress | `role="status"`; `role="progressbar"` with `aria-valuemin/max/now` | ✅ retained |

**No accessibility regression risk from the planned migration (variant selection only).**

---

## 7. Baseline Verification (this planning phase)

- `npx tsc -b` → exit 0
- Source snapshot: 18 in-scope files hashed (SHA-256) at phase start → compared at phase end
- **Zero source-code changes · zero Foundation changes · zero shared-component changes** (docs + governance only)

---

*See also: [FOUNDATION_COMPARISON](ADMIN_QUESTIONS_MANAGEMENT_SURFACE_FOUNDATION_COMPARISON.md) · [IMPLEMENTATION_PLAN](ADMIN_QUESTIONS_MANAGEMENT_SURFACE_IMPLEMENTATION_PLAN.md)*

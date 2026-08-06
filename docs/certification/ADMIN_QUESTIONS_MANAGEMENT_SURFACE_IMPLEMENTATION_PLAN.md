# Phase 4.1 — Admin Questions: Management Surface Readiness & Implementation Plan

**Status:** READ-ONLY PLANNING (2026-08-03) · D-148 · **no implementation begins in this phase**
**Gate:** migration starts only after a **separate, dedicated approval** for the Admin Questions migration phase.

---

## Step 7 — Management Surface Readiness

Classification per page section. ✅ Ready = certified Management API exists, variant-selection-only. ⚠ Needs Foundation/Decision = gap documented, never patched here. ❌ Blocked = shared composite requiring its own gate.

| Page section | Ready | Notes |
|---|---|---|
| Page shell (`PageContainer`/`H1 sr-only`/`Stack`/`SectionReveal`) | ✅ | no surface change |
| Exam/Paper/Subject selection (`AdminSelectionTabs`) | ❌ **G1** | shared composite (7+ pages); own shared-component gate |
| Error banner (`Alert`) | ✅ | Status family, retained |
| Toolbar (Toolbar/Search/Filter/buttons) | ✅ | C1–C5 swap |
| List loading (`GridSkeleton`) | ✅ | C7 swap |
| List header + pagination (`CollectionHeader`/`Pagination`) | ✅ | families independent, retained |
| Question rows (`CollectionCard`) | ✅ | C8 swap (premium→management) |
| Row serial badge (`PremiumIconContainer`) | ⚠ **G5** | no management variant |
| Row actions (`IconButton` ghost) | ⚠ **G6** | no management prop; status/ghost retained |
| Empty state (`EmptyState`) | ✅ | C45 swap (no action button → G3 n/a) |
| Bulk action bar (`BulkActionBar`) | ❌ **G4** | shared `admin/common`, amber; own gate |
| Delete confirm (`ConfirmModal`) | ❌ **G2** | shared; own overlay gate |
| Toasts (`ToastContainer`) | ✅ | C46 swap |
| Single-question modal (`AdminModal` + form) | ✅ (⚠ form fields) | panel C21 swap; TextArea G7, compact G8 |
| Bulk-upload modal (`AdminModal` + wizard) | ✅ (⚠ fields/cards) | panel C22 swap; TextArea G7, brand cards G9 |
| Prompt editor modal (`AdminModal` + fields) | ✅ (⚠ TextArea) | panel C23 swap; TextArea G7 |
| Upload progress overlay | ⚠ **G10** | page-owned overlay; Button management, overlay decision |

---

## Step 8 — Migration Checklist

For every item: Component · Current · Target · Foundation API · Risk · Verification.

**Group A — ready swaps (executed in the migration phase; Foundation consumed exactly as certified):**

| # | Component | File:line | Current | Target | Foundation API | Risk | Verification |
|---|---|---|---|---|---|---|---|
| M1 | `CollectionToolbar` | `QuestionsActions.tsx:23` | default | `variant="management"` | `CollectionToolbar` | none | visual diff + grep `variant="management"` |
| M2 | `Input` search | `QuestionsActions.tsx:28` | default | `variant="management"` | `Input` | none | grep + light/dark/hover/focus |
| M3 | `CollectionFilter` | `QuestionsActions.tsx:38` | default | `variant="management"` | `CollectionFilter` | none | dropdown light/dark/active/open |
| M4 | `Button` Bulk Upload | `QuestionsActions.tsx:56` | `secondary` | `secondary` + `management` | `Button management` | none | light/dark + disabled state |
| M5 | `Button` Add Question | `QuestionsActions.tsx:68` | `primary` | `primary` + `management` | `Button management` | none | light/dark + disabled state |
| M6 | `GridSkeleton` | `QuestionsTable.tsx:51` | default | `variant="management"` | `GridSkeleton` | none | loading state |
| M7 | `CollectionCard` | `QuestionsTable.tsx:79` | `premium` | `management` | `CollectionCard` | none | row: leading/title/trailing/actions, selected, hover |
| M8 | `EmptyState` | `AdminQuestions.tsx:95` | default | `variant="management"` | `EmptyState` | none | empty-filter state |
| M9 | `ToastContainer` | `AdminQuestions.tsx:149` | default | `variant="management"` | `ToastContainer` | none | success + danger toast |
| M10 | `AdminModal` ×3 | modals (single/bulk/prompt) | default | `variant="management"` | `AdminModal` | none | open/close, FocusTrap, Esc, focus-restore, mobile/desktop |
| M11 | `Card` (AI tools, instructions, template blocks, preview stats) | `AIToolCards.tsx:36` `InstructionsTab.tsx:22,50,70` `PreviewTab.tsx:24` | subtle/premium-neutral | `variant="management"` | `Card` | low (accent overrides G9) | each card light/dark |
| M12 | `Button` secondary/primary (modal footers, tabs continue, prompt save, retry) | modals + tabs + overlay | premium | add `management` prop | `Button management` | none | each button + loading state |
| M13 | `Input` prompt topic | `PromptEditorModal.tsx:98` | default | `variant="management"` | `Input` | none | focus/error state |

**Group B — retained (no change; families independent per D-141, or content):**
`Alert` (all), `Badge`/`DifficultyBadge` (all), `Pagination`, `CollectionHeader`, `SelectionCheckbox`, `Tabs` (wizard), `RadioGroup`, `Checkbox`, `Label`, `BilingualToggle`, `QuestionVisualizer`, `IconBadge`, preview rows, correct-option/telugu status hues.

**Group C — blocked / documented gaps (NOT in the migration phase):**

| # | Gap | Type | Owner gate | Action in migration phase |
|---|---|---|---|---|
| G1 | `AdminSelectionTabs` premium selection layer | shared composite | shared-component gate | none |
| G2 | `ConfirmModal` premium dialog | shared composite | overlay/shared gate | none |
| G4 | `BulkActionBar` amber bar | shared `admin/common` | shared-component gate | none |
| G5 | `PremiumIconContainer` serial badge — no management variant | Foundation gap / page decision | Foundation evolution or retain-as-accent decision | STOP + document if unresolved |
| G6 | `IconButton` ghost — no management prop | status/ghost retained | decision | none (Status family) |
| G7 | `TextArea` — **no `management` variant** | Foundation gap (3 consumers: QuestionForm, JsonTab, PromptEditorModal) | **separate Foundation evolution gate** | STOP + document |
| G8 | `Input compact` density vs management | decision | decision | pick per field row |
| G9 | Brand-colour AI tool tiles + `!bg-primary/5` overrides | page-owned brand accent | decision | retain (external-brand cards) |
| G10 | Upload progress overlay (`bg-card-bg/95`) | page-owned overlay | decision | Button management only |

---

## Critical decisions required BEFORE the migration phase opens

1. **G7 — `TextArea`:** the certified Foundation exposes `management` on `Input` but **not** on `TextArea`. The three big form areas (question statement/options/explanation, JSON editor, prompt text) all use `TextArea`. A "fully management" Admin Questions form is **impossible without a Foundation evolution gate** to add `TextArea variant="management"`. Options: (a) open a dedicated Foundation evolution phase for `TextArea` before/alongside (Rule 1/3 forbids doing it inside the page migration); (b) migrate everything else and leave `TextArea` premium.
2. **G5 — serial badge:** retain the premium `PremiumIconContainer` accent on rows (as a deliberate accent, like the Status family) or open a Foundation gate for a neutral serial material.
3. **G4 — `BulkActionBar`:** currently amber (`ancient-card` + `--ancient-gold` + `AdminText cinzel`) in `admin/common`. It renders on this page. Requires a shared-component gate.
4. **G8/G9/G10:** small decisions — keep `compact` negative-marks input, keep brand tiles + overlay as page-owned brand/workflow surfaces.

---

## Migration phase rules (reaffirmed)

- Rule 1 — no Foundation modification. Rule 2 — consume only certified Foundation APIs.
- Rule 3 — a Foundation gap discovered during migration → **stop, document, open a separate Foundation evolution gate**; never patch during migration.
- Rule 4 — shared reusable components (G1, G2, G4) are never modified inside a page migration.
- Scope is strictly `AdminQuestions.tsx` + `questions/**`. No other page.
- Business logic, accessibility, and responsive behaviour are preserved unchanged (verified in the audit, §4–§6).

---

## Verification (for the migration phase)

- `npx tsc -b` → 0 · `npm run build` → 0
- `npm run lint` → frozen baseline **405 (352E/53W), zero new**; in-scope files 0 findings
- Grep gates → zero amber tokens (`border-gold`/`stat-card-surface`/`shadow-premium-*`/`ancient-*`) and zero `variant="premium"` in the in-scope files (except documented retained/decision items G5/G9)
- Visual: light/dark/hover/focus/disabled/loading/empty/selected/pagination/dialog/toast/toolbar per Group A
- Responsive: desktop/tablet/mobile/XS unchanged vs current render
- A11y: keyboard/focus/aria unchanged (audit §6)

---

*Back to [AUDIT](ADMIN_QUESTIONS_MANAGEMENT_SURFACE_AUDIT.md) · [FOUNDATION_COMPARISON](ADMIN_QUESTIONS_MANAGEMENT_SURFACE_FOUNDATION_COMPARISON.md)*

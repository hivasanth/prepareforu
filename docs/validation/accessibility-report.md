# Repository Accessibility Report

**Phase 2B — Step 7 (Repository Accessibility Sweep).**
**Status:** COMPLETE — 2026-08-01.
**Scope:** Every a11y item deferred from Steps 1–6, applied repository-wide per the approved Phase 2B migration order (Step 6 deferred the broad sweep to Step 7).
**Constraint (approved):** accessibility ONLY — no validation-logic, business-logic, layout, spacing, typography, color, or animation changes. All changes are invisible to sighted users (ARIA attributes + `sr-only` text only). The exam experience (Golden Rule) is preserved.

---

## What changed (by checklist item)

### 1. Question palette `aria-current` + group semantics
- `src/components/exam/QuestionPalette.tsx` — desktop grid and mobile strip each gained `role="group"` + `aria-label="Question palette"`. Every palette button (desktop + mobile) now carries `aria-current={state.isCurrent ? 'true' : undefined}` so screen readers announce the active question (previously state was color-only).

### 2. Navigation landmark + collapse toggle
- `src/components/common/Navigation.tsx` — `<nav>` gained `aria-label="Main navigation"` (distinguishes it from other landmarks). The collapse toggle button gained an `aria-label` + `aria-expanded={isExpanded}`. NavLink already applies `aria-current="page"` automatically.

### 3. Review search + filter labels
- `src/components/exam/ReviewLayout.tsx` — the search `Input` gained `aria-label="Search questions or subjects"` (was unlabeled). Filter buttons are wrapped in `role="group" aria-label="Filter questions by status"` and each gained `aria-pressed={filter === f.id}` + an `aria-label` that includes the count, so the pressed state and result count are announced.

### 4. Radiogroup semantics — answer options
- `src/components/exam/QuestionOptions.tsx` — the option container gained `role="radiogroup" aria-label="Answer options"`; each option button changed from `aria-pressed` to `role="radio"` + `aria-checked={isSelected}`. Keyboard activation (Enter/Space) unchanged.

### 5. Radiogroup semantics — question language
- `src/components/exam/QuestionActions.tsx` — the shared `RadioGroup` received a `label="Question language"` prop; it previously rendered with no accessible name when no label was passed.

### 6. Modal focus restoration
- `src/components/common/AdminModal.tsx` — on open, `previouslyFocusedRef.current` stores `document.activeElement`; on close, focus is restored to that element. Focus no longer jumps to the page top / `<body>` after closing a modal (covers submit, review, confirm, and bulk-upload modals).

### 7. Full-page errors announce
- `src/components/common/SharedComponents.tsx` — `ErrorState` gained `role="alert"` (its 22 consumers, including `ExamPageError`, inherit it). The exam fullscreen-violation notice (`src/components/exam/StatusBoard.tsx`) and fullscreen prompt (`src/components/exam/ExamLayout.tsx`) also gained `role="alert"` (E5 wiring completed).

### 8. Loading states announce
- `src/components/LoadingScreen.tsx` — inner container gained `role="status" aria-live="polite"`.
- `src/components/PremiumLoader.tsx` — root gained `role="status" aria-live="polite" aria-label="Loading"`.
- `src/components/common/PortalLoadingSkeleton.tsx` — wrapper gained `role="status" aria-live="polite" aria-label="Loading content"`.
- `src/components/exam/ExamPageLoading.tsx` — container gained `role="status" aria-live="polite"`.
- (`Spinner` already had `role="status"` + `aria-label="Loading"`.)

### 9. Review mode announces correctness
- `src/components/exam/ReviewQuestionCard.tsx` — the correct-option and the student's incorrect choice are now labelled with `sr-only` text ("Correct answer" / "Your answer - incorrect"); status icons are `aria-hidden="true"`. Correct/incorrect is no longer color/icon-only.

### 10. Tab lists labelled
- `src/components/common/AntigravityData.tsx` — `Tabs` gained an optional `ariaLabel` prop applied to the tablist. Labelled at 17 usage sites: `UserLeaderboard` ("Leaderboard period"), `TopicPortalView` ("Select subject"), `SubAdminCreate` ("Create exam steps"), `ExamDetailModal` ("Exam details"), `AdminTopics` ("Topic language"), `BulkUploadModal` ("Bulk upload steps"), `AdminSelectionTabs` all 8 instances ("Select exam" / "Select exam group" / "Select paper" / "Select subject" for both bare and prefixed modes), `ExamGroupBar` (new `ariaLabel` prop passed through from `SelectionView` / `ExamPaperGrid` = "Select exam group"). The `UserSelectionTabs` re-export inherits the AdminSelectionTabs labels. Arrow-key tab navigation was already functional.

### 11. Mobile drawer dialog semantics
- `src/layouts/SidebarLayout.tsx` — the mobile drawer `motion.aside` is announced as a `dialog` only when open (`role="dialog"` + `aria-modal="true"` + `aria-label="Navigation menu"` only when `isDrawerOpen`), and the closed drawer is `inert={!isDrawerOpen}` so its content is removed from the tab order and accessibility tree when off-screen (previously the closed drawer's links remained tabbable).

### 12. Timer / submit overlay / error role wiring (validated)
- `ExamTimer` `role="timer"` + last-minute announcements (Step 6, E1) — confirmed still present (`src/components/ExamTimer.tsx:177`).
- Submit-summary live region `role="status"` (Step 6, E3/A30) — confirmed.
- Toast container `role="status"` + `aria-live="polite"` (Step 1) — confirmed.

---

## Verification

- `npx tsc -b` — clean.
- `npm run build` — exit 0 (only pre-existing chunk-size notices).
- `npx vitest run src/validations` — 165/165 pass.
- ESLint on all 25 touched files — **0 new errors/warnings**. The 15 remaining findings are pre-existing baseline debt on lines untouched by this step (`set-state-in-effect` ×4 in AdminSelectionTabs effects, ×1 Navigation; `no-explicit-any` ×5 AntigravityData, ×1 UserLeaderboard; `react-refresh/only-export-components` ×4 Navigation).
- No visual or layout change: only ARIA attributes and `sr-only` text were added.

## Change Record

- v1.0.0 — 2026-08-01 — Created with Step 7. All deferred a11y items implemented across 25 files; palette `aria-current`, radiogroup semantics, modal focus restore, `role="alert"` on errors, loading `role="status"`, review-mode announcements, labelled tabs, mobile drawer dialog/inert; 0 new lint findings; build + tsc + tests green.

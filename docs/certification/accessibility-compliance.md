# Accessibility Compliance Report

**Phase 2B — Step 8 (Repository Final Certification).**
**Status:** VERIFIED — 2026-08-01.
**Scope:** Keyboard navigation · Focus management · ARIA · Dialogs · Loading · Errors · Navigation · Forms · Exam Runtime. Confirms all deferred accessibility work (Steps 1–7) is complete.
**Mode:** Read-only certification. No code changes.
**Revision:** v1.0.0

---

## Verified Compliance

✓ **One accessibility model** — a single vocabulary is applied repo-wide: loading/announcements → `role="status"` + `aria-live="polite"`; errors/alerts → `role="alert"`; modals → `role="dialog"` + `aria-modal` + focus trap; tabs → `role="tablist"`/`role="tab"` + `aria-selected` + roving tabindex; radios → `role="radiogroup"`/`role="radio"` + `aria-checked`; toggles → `role="switch"` + `aria-checked` or `aria-pressed`; current state → `aria-current`.

✓ **Question palette** — `role="group" aria-label="Question palette"` + `aria-current={isCurrent}` on every palette button, desktop + mobile (`QuestionPalette.tsx:24,34,53,63`).

✓ **Navigation** — `<nav aria-label="Main navigation">` + collapse toggle `aria-label`/`aria-expanded`; NavLink `aria-current="page"` (`Navigation.tsx:155-156,246`).

✓ **Review search + filters** — search input `aria-label="Search questions or subjects"`; filter buttons `aria-pressed` + count `aria-label` in labeled group (`ReviewLayout.tsx:88,95-107`).

✓ **Answer-option radiogroup** — `role="radiogroup" aria-label="Answer options"`; options `role="radio"` + `aria-checked` (`QuestionOptions.tsx:27,55-58`); question-language `RadioGroup` labeled (`QuestionActions.tsx:23`); Mark-for-Review `aria-pressed` (`QuestionActions.tsx:32`).

✓ **Modal focus restoration + semantics** — `AdminModal` stores `document.activeElement` on open, restores on close (`AdminModal.tsx:37,52-64`); `role="dialog"` + `aria-modal` + `aria-labelledby` + `aria-describedby` + FocusTrap + Escape + `aria-label="Close modal"` (`:72-105`).

✓ **Error surfaces announce** — `ErrorState` `role="alert"` (`SharedComponents.tsx:84`); fullscreen prompt `role="alert"` (`ExamLayout.tsx:19`); fullscreen-violation `role="alert"` (`StatusBoard.tsx:57`); `ErrorContainer` `role="alert"` (`ErrorContainer.tsx:84`).

✓ **Loading surfaces announce** — `LoadingScreen.tsx:10`, `PremiumLoader.tsx:5`, `PortalLoadingSkeleton.tsx:6`, `ExamPageLoading.tsx:11` all `role="status" aria-live="polite"`; extended consistently to `Spinner.tsx:30`, `LoadingOverlay.tsx:19`, `StartTestButton.tsx:19`.

✓ **Review-mode correctness announced** — sr-only "Correct answer" / "Your answer - incorrect" + `aria-hidden` icons (`ReviewQuestionCard.tsx:100-107`).

✓ **Tabs labelled** — `AntigravityData.tsx:75` tablist `aria-label`; all 15 usage sites pass `ariaLabel` (UserLeaderboard, TopicPortalView, SubAdminCreate, ExamDetailModal, AdminTopics, BulkUploadModal, AdminSelectionTabs ×8, ExamGroupBar via SelectionView/ExamPaperGrid).

✓ **Mobile drawer** — `role="dialog"` + `aria-modal="true"` + `aria-label` only when open; `inert={!isDrawerOpen}` removes off-screen content from tab order + a11y tree (`SidebarLayout.tsx:194-197`); skip-to-content link (`:83-93`); open/close buttons labeled (`:204,275`).

✓ **Exam runtime** — `ExamTimer` `role="timer"` + `aria-label` + sr-only `role="status"` announcements at 10-second marks + expiry (`ExamTimer.tsx:162-163,177`); submit-summary `role="status"` + `aria-describedby` (`SubmitExamModal.tsx:82-104`); toast `role="status"` + `aria-live="polite"` (`useToast.tsx:41-42`).

✓ **Menu keyboard support** — `role="menuitem"`, Escape close, outside-click close, Arrow/Home/End navigation, trigger `aria-expanded`/`aria-haspopup` (`Menu.tsx:118-119,142-143,209-250,289`).

---

## Open Findings

### F-A-1 — Menu does not restore focus to the trigger on close

**Issue:** After closing the dropdown (Escape / outside-click / item activation), focus is not returned to the triggering element.

**Current State:** `Menu.tsx` has no `triggerRef.current.focus()` on close (the only `.focus()` calls are item-to-item at `:231,235,239,243`). `PremiumSelect.tsx:51` does this correctly and is the reference pattern.

**Severity:** High

**User Impact:** Keyboard-only users lose their position; focus drops to the top of the document after every menu interaction.

**Technical Impact:** Violates WCAG 2.4.3 Focus Order; the repo's own modal/drawer pattern restores focus but Menu does not.

**Recommended Phase:** Next planned a11y hardening phase (small, isolated fix to Menu.tsx).

**Status:** Pre-existing · Deferred

**Owner:** Foundation (Design System — Menu)

**Reference:** `src/components/common/Menu.tsx`; contrast `PremiumSelect.tsx:51`

### F-A-2 — Unnamed interactive controls (switches, icon buttons, toggles)

**Issue:** Interactive elements without accessible names.

**Current State:**
- `NotificationSection.tsx:34,38,42` — three `Switch` with no label/aria-label.
- `NotificationPanel.tsx:161-186` — bell `Menu.Trigger` renders only `<Bell>` (no aria-label); `Menu.Content` `role="menu"` has no aria-label (`:189`).
- `SubAdminMobileCard.tsx:25-32` — delete `IconButton` unnamed.
- `SidebarLayout.tsx:149-159` — collapsed theme toggle `title` only, no `aria-label`, no `aria-pressed`/`aria-checked`.
- `QuestionsTableComponents.tsx:6-13` — `SelectionCheckbox` declares `label?` but does not forward it (all callers' labels dropped → row + select-all checkboxes unnamed).
- `QuestionsTableComponents.tsx:48-71` — View/Edit/Delete rely on `title` only.

**Severity:** High

**User Impact:** Screen-reader users cannot determine what these controls do or their state.

**Technical Impact:** Accessible-name gaps in tables, notifications, and settings.

**Recommended Phase:** Next planned a11y hardening phase.

**Status:** Pre-existing · Deferred

**Owner:** Feature owners (Admin tables, Sub-Admin cards, notifications) + Foundation (Switch/IconButton label contract)

**Reference:** `NotificationSection.tsx:34`; `QuestionsTableComponents.tsx:6-13`

### F-A-3 — Auth-page form inputs lack programmatic labels

**Issue:** Visible `<Label>` (no `htmlFor`) + `<Input id=…>` (no `aria-label`) on Login/Signup/UpdatePassword — placeholder is not an accessible name.

**Current State:** `LoginPage.tsx:270-294`, `SignupPage.tsx:329-373`, `auth/UpdatePasswordPage.tsx:97-134`.

**Severity:** High

**User Impact:** Widest-reaching screen-reader gap; users cannot reliably identify email/password fields.

**Technical Impact:** Violates the repo's own label model (every other form surface wires `htmlFor`/`aria-label`). These pages are the documented "bypass" pages per golden ref §1.4.

**Recommended Phase:** Next planned a11y hardening phase.

**Status:** Pre-existing · Deferred

**Owner:** Auth feature

**Reference:** `src/pages/LoginPage.tsx:270-294`

### F-A-4 — Unlabeled `SegmentedFilter` tablists + ambiguous `FilterSelect` labels

**Issue:** Tablists/groups without meaningful accessible names.

**Current State:** `SegmentedFilter.tsx:67` `role="tablist"` with no aria-label (consumers `TeacherExamFilterBar.tsx:21`, `PerformanceTimeRangeTabs.tsx:12`); `FilterSelect` falls back to generic `aria-label="Options"` (`PremiumSelect.tsx:151`) at `DailyAttemptsChart.tsx:62` and `ExamListSection.tsx:35-45`.

**Severity:** Medium

**User Impact:** Screen readers announce generic/ambiguous labels for filters.

**Technical Impact:** Inconsistent with the Tabs model where every tablist gets an explicit label.

**Recommended Phase:** Next planned a11y hardening phase.

**Status:** Pre-existing · Deferred

**Owner:** Foundation (SegmentedFilter) + feature owners

**Reference:** `src/components/common/SegmentedFilter.tsx:67`

### F-A-5 — RadioGroup without accessible name in 2 surfaces

**Issue:** `RadioGroup` used with no `label` prop → `aria-label={undefined}`.

**Current State:** `QuestionForm.tsx:212` (correct-option group) and `AddExamModal.tsx:357` (paper-selection group). Individual radios named; the group is not.

**Severity:** Medium

**User Impact:** Group context is lost to screen readers.

**Technical Impact:** Deviates from the fixed `RadioGroup` label pattern used elsewhere.

**Recommended Phase:** Next planned a11y hardening phase.

**Status:** Pre-existing · Deferred

**Owner:** Admin feature (QuestionForm, AddExamModal)

**Reference:** `src/components/admin/questions/QuestionForm.tsx:212`

### F-A-6 — Minor loading + semantic deviations

**Issue:** Two low-severity deviations from the one-model.

**Current State:** `src/components/Loader.tsx:8-21` (book loader, full-screen in `Guards.tsx:17`/`AuthContext.tsx:54`) lacks `role="status"`/`aria-live`; `TestConfigView.tsx:43-63` uses `role="radiogroup"` with `aria-pressed` buttons instead of `role="radio"`/`aria-checked`.

**Severity:** Low

**User Impact:** Minor; full-screen loader is not announced; config tiles are still individually named.

**Technical Impact:** Two places diverge from the established vocabulary.

**Recommended Phase:** Next planned a11y hardening phase (cleanup).

**Status:** Pre-existing · Deferred

**Owner:** Feature owners (guards loader, TestConfigView)

**Reference:** `src/components/Loader.tsx:8-21`

---

## Conclusion

The Step 1–7 accessibility work is **complete and verified**: all 13 sweep items plus the timer, toast, submit-summary, and menu-keyboard foundations are present and consistent with a single accessibility model. The remaining findings are **pre-existing accessible-name and focus-restoration gaps** in surfaces not covered by the approved sweep scope (auth bypass pages, tables, notifications, Menu). None blocks production; all are tracked below with severity, owner, and recommended phase.

**Verdict: Certified with Accepted Findings.**

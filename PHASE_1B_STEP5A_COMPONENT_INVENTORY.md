# Phase 1b — Step 5A: Reusable Component Inventory & Approval Gate

**Status:** For approval
**Governance baseline:** `FOUNDATION_GOVERNANCE.md` v1.18.0 (§11, §13, §14)
**Scope:** Audit + planning only. Zero runtime code changes. No redesigns, no renames, no API changes, no component removal, no spacing migration.
**Gate:** No reusable component migration (Step 5 execution) may begin until this inventory is approved.

---

## 1. Scope & Exclusions

### 1.1 In scope
Every **reusable** UI component in `src/components/**` (plus `src/hooks/useToast.tsx`, which renders reusable toast UI). Reusable = generic, not bound to a single feature module.

### 1.2 Documented exclusions
| Exclusion | Reason |
|---|---|
| `PageContainer`, `Stack`, `Grid`, `SectionBlock` | Canonical layout primitives (§11) — migrated in Step 4; outside Step 5 scope |
| Feature-specific components: `QuestionVisualizer`, `DiagramRenderer`, `FormattedBodyText`, `TagBadge`, `TopicInfoButton`, `StartTestButton`, `ExamTimer`, `ExamPaperCard`, `AttemptCardBase`, `RecentAttemptCard`, `ExamDetailRow`, `ExamPageLoading`, `ExamPageError`, `WelcomeBanner`, `UserSelectionTabs`, `AdminSelectionTabs`, `TeacherLeaderboardModal`, `PortalLoadingSkeleton`, `AdminTitleHeader` and all of `src/components/admin/**`, `src/components/exam/**`, `src/components/review/**`, `src/components/user/**` feature modules | Dashboard/topic/subject/exam/review/admin implementations are excluded from Step 5 by classification rule |
| `SectionWrapper` (0 consumers), `PageHeader` (legacy), `SectionHeader` (legacy) | Legacy layout components, §11 — dedicated future work, not Step 5 groups |

---

## 2. Complete Component Inventory

Field legend: **Consumers** (distinct importing files, definition + barrel re-exports excluded where verified; `~N` = reference count incl. import lines), **LP** = uses canonical layout primitives (PageContainer/Stack/Grid/SectionBlock), **Spacing** = spacing usage class.

### Group S — Surface (presentation, cards, containers, icons, brand)

#### S1. `Card`
- File: `src/components/common/AntigravityCard.tsx:26` — Consumers: **48** — LP: No — Spacing: mapped utilities per variant (`p-0/p-4/p-5/p-6`) — API: extends `HTMLMotionProps<'div'>`; `padding` (0|16|20|24), `variant`, `className` — Duplicates: AdminCard (see §3), ActivityCard/CTACard (dead), StatCard (derived)
- Purpose: motion card shell, 7 variants — **Priority: Critical** — Complexity: Low — Notes: canonical card; score/result/exam composites already build on it.

#### S2. `StatCard`
- File: `AntigravityCard.tsx:86` — Consumers: 9 — LP: No — Spacing: mapped utilities — API: `{ label, value, icon?, trend? }` — Complexity: Low — Notes: derives from Card; keep.

#### S3. `ScoreCard` / S4. `ResultStatCard` — `AntigravityResults.tsx:7` / `:23` — 1 consumer each (ExamResultsView) — build on Card — Low.

#### S5. `ExamCard` — `AntigravityDashboard.tsx:55` — 2 consumers (ExamPaperGrid, ExamPaperCard) — builds on Card — Low.

#### S6. `AdminCard` — `src/components/admin/common/AdminCard.tsx:13` — 3 consumers (AdminSubAdminsView, AdminUsersView, AdminQuestions) — Surface duplicate of Card; 3 variants (default/elevated/subtle) — **Priority: Critical** — migrate consumers → `Card`, then remove (removal deferred to cleanup per §3.1).

#### S7. `SelectionContainer` — `AntigravityLayout.tsx` — ~6 refs — wrapper div for selection/portal views — Low.

#### S8. `StatePanel` — `AntigravityLayout.tsx` — ~2 refs — empty/loading state surface — Low.

#### S9. `FilterBar` — `AntigravityLayout.tsx` — ~11 refs — filter toolbar container; used by AdminFilterBar + pages — Medium.

#### S10. Typography — `AntigravityTypography.tsx`: `H1`(8), `H2`(19), `H3`(19), `Body`(48), `Label`(41), `Display`(0), `Caption`(0), `BrandTitle`(0) — all `m-0` + font-size/weight tokens, **no spacing concerns** — Low — presentation primitives, grouped under Surface.

#### S11. `AdminText` — `AdminText.tsx` — ~12 refs — theme-aware text helper — Low.

#### S12. `AdminPageTitle` — `AntigravityData.tsx:162` — ~6 refs — page heading block — Low.

#### S13. `Logo` — `src/components/Logo.tsx` — ~13 refs — brand mark — Low.

#### S14. `PaletteBackground` — `src/components/PaletteBackground.tsx` — 2 — decorative page background — Low.

#### S15. `IconBadge` — `IconBadge.tsx` — ~22 refs — themed icon chip — Low.

#### S16. `PremiumIconContainer` — `PremiumIconContainer.tsx` — 4 — icon wrapper — Low.

#### S17. `AdminIconWrap` — `AdminIconWrap.tsx` — 9 — icon wrapper — Low.

#### S18–S20. Dead surfaces: `ActivityCard` (`AntigravityDashboard.tsx:10`, 0 consumers), `CTACard` (`AntigravityResults.tsx:44`, 0 consumers) — recorded; **removal deferred to Phase 1b cleanup**, not Step 5.

### Group F — Form (inputs, selects, controls)

- **F1.** `Input` — `AntigravityForm.tsx` — 19 — LP: No — Spacing: mapped utilities — High consumers, low risk.
- **F2.** `TextArea` — 5 — Medium.
- **F3.** `Select` — 2 — Low (canonical base select).
- **F4.** `Switch` — 5 — Low.
- **F5.** `Checkbox` — 3 — Low.
- **F6.** `Radio` — 1 — Low.
- **F7.** `RadioGroup` — 4 — Low.
- **F8.** `PremiumSelect` — `PremiumSelect.tsx` — ~4 refs — enhanced select (searchable/themeable); consolidation vs `FilterSelect` decision deferred to migration (see §3.7).
- **F9.** `FilterSelect` — `AntigravityLayout.tsx` — derived select; same deferral.
- **F10.** `SegmentedFilter` — `SegmentedFilter.tsx` — 2 — segmented control — Low.
- **F11.** `BilingualToggle` — `BilingualToggle.tsx` — ~11 refs — EN/Telugu segmented switch — Medium (behavioral parity risk).
- **F12.** `ThemeToggle` — `ThemeToggle.tsx` — 1 — Low.
- **F13.** `CarouselDots` — `CarouselDots.tsx` — ~3 refs — carousel control — Low.
- **F14.** `AdminFilterBar` — `AdminFilterBar.tsx` — ~5 refs (2 consumers) — composite search/filter toolbar (FilterBar + Input + FilterSelect + IconButton) — Medium — already composes canonicals.

### Group A — Action (buttons)

- **A1.** `Button` — `AntigravityButton.tsx` — **60** — LP: No — Spacing: mapped utilities (`gap`) — **Priority: Critical** — Complexity: Low (stable API, pure utilities) — canonical action.
- **A2.** `PrimaryButton` — 1 — thin wrapper — Low.
- **A3.** `IconButton` — 19 — Low.
- **A4.** `RetryButton` — `RetryButton.tsx` — 4 — composes Button — Low.
- **A5.** `ErrorActionButtons` — `ErrorActionButtons.tsx` — ~3 refs — composes Button — Low.

### Group N — Navigation (tabs, menus, paging)

- **N1.** `Tabs` — `AntigravityData.tsx` — 8 — canonical tab control — Medium.
- **N2.** `ExamGroupBar` — ~5 refs — Tabs wrapper for exam groups — Low (derived).
- **N3.** `Navigation` — `Navigation.tsx` — sidebar/nav shell + `useSidebarMode` — Medium (app chrome).
- **N4.** `Menu` — `Menu.tsx` — popover/contextual menu (consumers: NotificationPanel + admin popovers) — Medium (popover behavior).
- **N5.** `Pagination` — `common/Pagination.tsx` — **0 consumers — dead** — recorded; removal deferred to cleanup.

### Group Fb — Feedback (modals, toasts, alerts, states, loading)

- **Fb1.** `AdminModal` — `AdminModal.tsx` — 11 — API: modal shell with header/footer slots — **Priority: High** — Complexity: Medium — canonical modal.
- **Fb2.** `ConfirmModal` — `SharedComponents.tsx` — ~36 refs (~14 consumers) — convenience wrapper composing AdminModal + Button — Low.
- **Fb3.** `Alert` — `Alert.tsx` — 3 — inline alert — Low.
- **Fb4.** `ToastContainer` + `useToast` — `src/hooks/useToast.tsx:37` — ~28 refs (18 page-level consumers) — **Priority: Critical** — Complexity: Low — Note: missing barrel export is a pre-existing build blocker (§6); ToastContainer must be added to `AntigravityUI.tsx` barrel.
- **Fb5.** `ErrorContainer` — `ErrorContainer.tsx` — 4 — uses `Stack` — Low.
- **Fb6.** `ErrorState` — `SharedComponents.tsx` — ~49 refs (~8 consumers) — uses Card/Stack/Button — Low.
- **Fb7.** `NotificationBell` — `NotificationPanel.tsx` — 1 — app-chrome bell + dropdown; **coupled to `useNotifications` module** — Medium (decouple note).
- **Fb8.** `Spinner` — `Spinner.tsx` — 7 — Low.
- **Fb9.** `Loader` / **Fb10.** `PremiumLoader` / **Fb11.** `LoadingScreen` — `src/components/*.tsx` — 2/2/1 — full-screen loading family; consolidation decision deferred (Loader preferred).
- **Fb12.** `LoadingOverlay` — `LoadingOverlay.tsx` — 1 — Low.
- **Fb13.** `ErrorBoundary` — `ErrorBoundary.tsx` — 1 — class error boundary — Low.

### Group D — Data (tables, grids, metrics, empty/skeleton states)

- **D1.** `DataGrid` — `AntigravityData.tsx` — 7 — canonical data table/grid — Medium.
- **D2.** `DataTable` — `common/DataTable.tsx:39` — **0 consumers — dead** — recorded; removal deferred to cleanup.
- **D3.** `Badge` — `AntigravityData.tsx:197` — 27 — status pill — Low.
- **D4.** `MetricBlock` — `AntigravityData.tsx:281` — 2 — metric stat display — Low.
- **D5.** `ProgressBar` — `AntigravityData.tsx:240` — 3 — progress display — Low.
- **D6.** `EmptyState` — `SharedComponents.tsx` — ~54 refs (~18 consumers) — composes Card/Stack/IconBadge — Low.
- **D7.** `LoadingSkeleton` — `SharedComponents.tsx` — ~80 refs (~20 consumers) — **Priority: High** — template-driven `skeletonClassName` — Medium.
- **D8.** `GridSkeleton` — `SharedComponents.tsx` — ~15 refs — Low.
- **D9.** `StatSkeleton` — `SharedComponents.tsx` — ~7 refs — Low.

---

## 3. Duplicate Component Families & Canonicals

| # | Family | Members | Canonical | Action |
|---|---|---|---|---|
| 3.1 | Card | `Card`, `AdminCard`, `ActivityCard`(dead), `CTACard`(dead); derived `StatCard`/`ScoreCard`/`ResultStatCard`/`ExamCard` | **Card** | Migrate AdminCard's 3 consumers → Card; remove AdminCard, ActivityCard, CTACard (removal deferred to cleanup) |
| 3.2 | Button | `Button`, `PrimaryButton`(wrapper), `RetryButton`, `ErrorActionButtons` | **Button** | Keep wrappers (already compose Button); no consolidation |
| 3.3 | Modal | `AdminModal`, `ConfirmModal` | **AdminModal** | ConfirmModal already composes AdminModal; no consolidation |
| 3.4 | Toast/Alert | `ToastContainer`/`useToast`, `Alert` | Both (distinct purposes) | No consolidation; fix barrel export |
| 3.5 | Tag/Badge | `Badge`, `TagBadge`(feature) | **Badge** | No action (TagBadge out of scope) |
| 3.6 | Skeleton/Loading | `LoadingSkeleton`/`GridSkeleton`/`StatSkeleton`, `Spinner`, `Loader`, `PremiumLoader`, `LoadingScreen`, `LoadingOverlay` | Per purpose: skeleton family (Data), Spinner (Feedback) | Defer Loader/PremiumLoader/LoadingScreen consolidation decision to migration |
| 3.7 | Select/Filter | `Select`, `PremiumSelect`, `FilterSelect`, `SegmentedFilter` | **Select** (base), SegmentedFilter (distinct) | Consolidate PremiumSelect + FilterSelect **only if** behavioral parity provable; else keep both |
| 3.8 | Navigation/Tabs | `Tabs`, `ExamGroupBar`(wrapper), `UserSelectionTabs`(feature), `AdminSelectionTabs`(feature) | **Tabs** | Wrappers kept; feature tabs out of scope |
| 3.9 | Table/DataGrid | `DataGrid`, `DataTable`(dead) | **DataGrid** | Remove DataTable in cleanup (dead, 0 consumers) |
| 3.10 | Input | `Input`, `TextArea`, `Select`, `Switch`, `Checkbox`, `Radio`, `RadioGroup` | Each canonical | No duplicates |

**Dead-code confirmation** (verified, 0 consumers): `ActivityCard`, `CTACard`, `DataTable`, common `Pagination`. **False positives corrected:** `RecentAttemptCard` (1 consumer: `DashboardRecentActivity.tsx`) and `ExamPaperCard` (1 consumer: `ExamPaperGrid.tsx`) are NOT dead code — feature-specific, excluded.

---

## 4. Component Group Classification

Each in-scope component assigned to exactly one group (legacy + dead components tracked separately):

- **Surface (S1–S17):** Card, StatCard, ScoreCard, ResultStatCard, ExamCard, AdminCard, SelectionContainer, StatePanel, FilterBar, Typography×8, AdminText, AdminPageTitle, Logo, PaletteBackground, IconBadge, PremiumIconContainer, AdminIconWrap
- **Form (F1–F14):** Input, TextArea, Select, Switch, Checkbox, Radio, RadioGroup, PremiumSelect, FilterSelect, SegmentedFilter, BilingualToggle, ThemeToggle, CarouselDots, AdminFilterBar
- **Action (A1–A5):** Button, PrimaryButton, IconButton, RetryButton, ErrorActionButtons
- **Navigation (N1–N5):** Tabs, ExamGroupBar, Navigation, Menu, Pagination(dead)
- **Feedback (Fb1–Fb13):** AdminModal, ConfirmModal, Alert, ToastContainer/useToast, ErrorContainer, ErrorState, NotificationBell, Spinner, Loader, PremiumLoader, LoadingScreen, LoadingOverlay, ErrorBoundary
- **Data (D1–D9):** DataGrid, DataTable(dead), Badge, MetricBlock, ProgressBar, EmptyState, LoadingSkeleton, GridSkeleton, StatSkeleton
- **Legacy (excluded, §11):** SectionWrapper, PageHeader, SectionHeader

---

## 5. Migration Order (Step 5 execution plan)

Group order fixed by governance (one group at a time, per-group certification):

1. **Group 1 — Surface.** Order: Card (canonical first) → AdminCard→Card migration → StatCard → typography → AdminText → icons/brand (IconBadge, PremiumIconContainer, AdminIconWrap, Logo, PaletteBackground) → containers (SelectionContainer, StatePanel, FilterBar, AdminPageTitle).
2. **Group 2 — Form.** Order: Input → TextArea → Select → PremiumSelect/FilterSelect (deferred consolidation decision) → Switch → Checkbox → Radio/RadioGroup → controls (SegmentedFilter, BilingualToggle, ThemeToggle, CarouselDots) → AdminFilterBar composite.
3. **Group 3 — Action.** Order: Button (canonical first) → IconButton → PrimaryButton → RetryButton → ErrorActionButtons.
4. **Group 4 — Navigation.** Order: Tabs → ExamGroupBar → Menu → Navigation. (Pagination dead — no migration.)
5. **Group 5 — Feedback.** Order: ToastContainer/useToast (incl. barrel-export fix) → AdminModal → ConfirmModal → Alert → ErrorContainer/ErrorState → Spinner → Loader family (deferred consolidation) → LoadingOverlay → NotificationBell → ErrorBoundary.
6. **Group 6 — Data.** Order: DataGrid → Badge → MetricBlock → ProgressBar → EmptyState → LoadingSkeleton → GridSkeleton → StatSkeleton. (DataTable dead — no migration.)

Per-group exit: behavioral parity verified (render + layout byte-level where feasible), lint/typecheck clean, certification record appended to governance §31/§36.

---

## 6. Risk Assessment

| Component | Risk | Rationale / Mitigation |
|---|---|---|
| Card | High | 48 consumers; mitigated by stable API + already-tokenized spacing; canonical-first ordering |
| Button | High | 60 consumers; mitigated by pure utility implementation, no spacing in variant internals |
| ToastContainer/useToast | High | 18 page consumers + pre-existing build blocker (`SubAdminCreate.tsx:10` imports it; missing from `AntigravityUI.tsx` barrel). Fix = add barrel export during Group 5 (or as controlled exception before, if build gate demands) |
| LoadingSkeleton | Medium | ~20 consumers, template-driven children; avoid breaking `skeletonClassName` contract |
| NotificationBell | Medium | Coupled to `useNotifications`; decouple UI from data module |
| AdminModal | Medium | 11 consumers, slot-based API; preserve header/footer API |
| Menu / Navigation | Medium | Popover/sidebar behavior; behavioral parity checks required |
| BilingualToggle / SegmentedFilter | Medium | Interactive state; parity test on toggle behavior |
| PremiumSelect/FilterSelect consolidation | Medium | Only consolidate if behavioral parity provable, else keep both |
| Typography, IconBadge, EmptyState, ErrorState, skeletons | Low | Stable props, no spacing risk |

**Pre-existing build blockers (recorded, unrelated, not introduced here):** missing `ToastContainer` barrel export (`AntigravityUI.tsx`), duplicate `selectedTopic` key (`useTopicExams.ts:215`), pre-existing `tsc` errors. Per §14 Health Checkpoints they are tracked separately; only the ToastContainer export lies inside Step 5 scope.

---

## 7. Step 5 Readiness

- [x] Full inventory compiled (~55 reusable components, all consumers/purpose/API/spacing recorded)
- [x] Duplicate analysis complete — 10 families, canonical selected for each, dead code verified
- [x] Every component assigned to exactly one group (Surface/Form/Action/Navigation/Feedback/Data)
- [x] Group execution order + in-group order defined (canonical-first)
- [x] Risk assessment + mitigations recorded
- [x] Zero runtime changes made in this step (audit only)

**Decision requested:** approve this inventory as the Step 5A gate. On approval, Step 5 begins with **Group 1 — Surface (Card first)**. Outstanding optional decisions (PremiumSelect/FilterSelect consolidation, Loader family consolidation) are deferred to their group migrations, not required for this gate.

---

### Change Record
- v1.0.0 — 2026-07-31 — Initial inventory deliverable for Step 5A approval gate. Compiled from Step 5A audit (3 explore agents: AntigravityUI family, standalone/common/top-level/user classification, duplicate families) + verification passes (consumer counts, dead-code confirmation, AdminCard/ToastContainer/AdminSelectionTabs checks).

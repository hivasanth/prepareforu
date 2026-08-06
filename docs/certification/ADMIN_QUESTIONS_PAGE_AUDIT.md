# Phase 3.1 — Admin Questions Page Audit (Visual-First, Component Reuse)

**Status:** 🔍 **AUDIT COMPLETE — AWAITING APPROVAL** (no implementation yet)
**Page:** `src/pages/admin/AdminQuestions.tsx` + `src/components/admin/questions/**`
**Date:** 2026-08-02
**Golden Visual Reference:** User Panel
**First certified consumer:** Authentication
**Shared Component Rule:** `SingleQuestionModal`, `BulkUploadModal`, `QuestionForm`, `UploadProgressOverlay`, `useBulkUpload` are audited with **all consumers** (`AdminQuestions.tsx` + `AdminUpload.tsx`). Public API / behavioral / prop / event / data-contract changes are **deferred** unless every consumer participates in the same phase.

This audit is the implementation blueprint for the Admin Questions page certification. It is
documentation/discovery only — **no migration, refactor, rewrite, deletion, or optimization** was
performed during the audit.

---

# Area 1 — Page Architecture

| Attribute | Detail |
|---|---|
| Route | `/admin/questions` (`App.tsx`, `lazy(() => import('pages/admin/AdminQuestions'))`) |
| Guard | `AuthGuard` + `RoleGuard allowedRoles={['admin']}` (`Guards.tsx`) |
| Layout | `AdminLayout` → `SidebarLayout` + `AdminPageTitle` (sidebar nav `ADMIN_NAV`) |
| Entry | Page default exports composed views; no inner router state |
| Exit | Sidebar navigation / breadcrumb / direct URL |
| Owned surface | `src/components/admin/questions/**` (13 files, all feature-local) |
| Shared consumers | `AdminUpload.tsx` (imports both modals + `QuestionForm` + `UploadProgressOverlay`) |
| Data services | `adminQuestionService.ts` (Phase 6 LOCKED contract), `adminQueryCache.ts`, `question.repository.ts`, `exam.repository.ts` |
| URL contract | `useAdminFilters` — global filter state lives in URL params (`exam`, `paper`, `subject`) |
| Page role | **Pure composition** (per `README.md`): all presentational components memoized; the page owns no local business logic |

**Dependency graph (simplified):**

```
AdminQuestions.tsx (composition root)
 ├─ useAdminQuestions.ts          → adminQuestionService + adminQueryCache (SWR) + useAdminFilters + useToast
 ├─ QuestionsActions              → FilterBar + FilterSelect + Input + Button
 ├─ QuestionsTable                → DataGrid + Pagination + GridSkeleton + (mobile cards) + null-empty
 │   └─ QuestionsTableComponents  → Checkbox / Badge / IconButton / Q-monogram / SrNumber
 ├─ SingleQuestionModal           → AdminModal + BilingualToggle + QuestionForm + questionSchema
 ├─ BulkUploadModal               → Tabs + BulkUploadPanel(ref) + Badge (header pill)
 │   └─ BulkUploadPanel           → useBulkUpload + UploadProgressOverlay + PromptEditorModal + ConfirmModal
 │       ├─ InstructionsTab / JsonTab / PreviewTab / AIToolCards
 │       ├─ PromptEditorModal     → AdminModal (TARGET) — currently raw custom modal
 │       └─ UploadProgressOverlay → Alert + custom SVG progress ring
 ├─ ConfirmModal (delete)         → SharedComponents
 ├─ EmptyState                    → SharedComponents
 ├─ Alert (page error)            → certified Alert
 └─ BulkActionBar                 → custom fixed bar (certified-consistent, retained Module 2 decision)
```

**Shared / duplicate / module summary:**

| Category | Items |
|---|---|
| Shared (reused across pages) | `useAdminFilters`, `adminQuestionService`, `adminQueryCache`, `BulkActionBar`(1 consumer), `DifficultyBadge`(feature-only) |
| Feature-local | Everything under `questions/**` |
| Duplicated across feature | `PAGE_SIZE = 30` (`AdminQuestions.tsx:13` + `useAdminQuestions.ts:10`) |
| External | Recharts none; framer-motion (reveal), `nanoid`/hash libs in service |

---

# Area 2 — UI Section Audit

The Admin Questions page breaks into **11 logical sections**.

| # | Section | Implementation | Location |
|---|---|---|---|
| 1 | Guard State | `GuardLoader` (auth loading, `#080810` bg) | `Guards.tsx` |
| 2 | Page Scaffold | `PageContainer` → `Stack gap="lg"` → `H1 className="sr-only"` | `AdminQuestions.tsx` |
| 3 | Selection Section | `AdminSelectionTabs` (`SelectionContainer` + `bare` `Tabs`, APPSC GRP 1–4) | `AdminQuestions.tsx` |
| 4 | Toolbar / Filter Section | `SectionBlock` → `QuestionsActions` (`FilterBar`, `FilterSelect`, `Input`, `Button`) | `QuestionsActions.tsx` |
| 5 | Bulk Action Bar | custom fixed bottom bar (light `ancient-card` / dark `bg-card-bg`, `shadow-2xl backdrop-blur-xl`, `AdminText cinzel`, token-color overrides) | `BulkActionBar.tsx` |
| 6 | List Section | `div.flex.flex-col.gap-6.animate-in.fade-in` wrapper → desktop `DataGrid` table + mobile card rows | `QuestionsTable.tsx` |
| 7 | Pagination | `Pagination` (`role="navigation" aria-label="Pagination"`, bounded + range label) | `QuestionsTable.tsx` |
| 8 | Loading States | `GridSkeleton count={5} height={80} columns="grid-cols-1"`, button spinners, `ConfirmModal` "Deleting…", `UploadProgressOverlay` | multiple |
| 9 | Error States | certified `Alert` (page-level + modal-level + upload-level) | multiple |
| 10 | Empty State | certified `EmptyState` (page-level; table returns `null`) | `AdminQuestions.tsx` |
| 11 | Telugu View Panel | custom panel (question source view; content-driven, static) | `QuestionsTableComponents.tsx` |

---

# Area 3 — UI Element Inventory

Every visible element per section (nothing skipped).

## Guard State
- Guard loader (auth-loading surface, hardcoded `#080810`)

## Page Scaffold
- Page container (shell + padding) · Stack (section rhythm) · Screen-reader-only title (`H1 sr-only`)

## Selection Section
- Section reveal wrapper (motion) · Selection container (surface + radius + elevation) · Tabs (primary variant, `bare`) · Active indicator · Horizontal scroll container + flex centering

## Toolbar / Filter Section
- Section wrapper · Filter bar (certified `FilterBar`) · Exam filter (`FilterSelect`) · Paper filter (`FilterSelect`) · Subject filter (`FilterSelect`) · Search input (`Input` with `aria-label`) · Clear-filters action · Create question button (`Button`) · Bulk upload button (`Button`)

## Bulk Action Bar
- Fixed bottom bar surface · Selection label (`AdminText cinzel`) · Count · Select-all checkbox · Delete button · Close/deselect button

## List Section (desktop)
- Table shell (`DataGrid`) · Column headers (select / question / subject / difficulty / actions) · Row ×30 (`SelectionCheckbox` + `QuestionCell` + `SubjectBadge` + `DifficultyBadge` + `ActionsCell`) · Alternate row striping (DataGrid)

## List Section (mobile)
- Card list (`div.flex.flex-col.gap-4`) · Card row ×30 (`div.border.rounded-2xl` + checkbox + index chip + Q-monogram + question text + `SubjectBadge` + `DifficultyBadge` + chevron) · Telugu view toggle panel

## Pagination
- Prev/Next controls · Page indicator · Range label

## Loading States
- Table skeleton (`GridSkeleton`) · Button spinners (`loading`) · Confirm button text-swap "Deleting…" · Upload progress overlay + custom ring

## Error States
- Page-level `Alert` · Modal-level `Alert` · JsonTab `Alert` · Overlay `Alert`

## Empty State
- `EmptyState` (emoji + title + optional body)

## Modals
- `SingleQuestionModal` (AdminModal: overlay, dialog, close, Escape, focus trap) · `BilingualToggle` · `QuestionForm` fields (title, options A–D, correct answer RadioGroup, negative marking Input, difficulty RadioGroup, subject Select, explanation, tags, save) · `BulkUploadModal` (Tabs generate/instructions/json/preview, header pill, panel ref) · `PromptEditorModal` (raw modal) · `ConfirmModal` (certified)

---

# Area 4 — Component Mapping

| Visible Element | Current Component | Certified Component | Golden Source | Status |
|---|---|---|---|---|
| Page shell / spacing | `PageContainer` + `Stack` | `PageContainer` + `Stack` | User Panel | Already Canonical |
| Page title | `H1 sr-only` | `H1` (hidden) | User Panel | Exception (documented, a11y-only) |
| Auth loading | `GuardLoader` | `GuardLoader` | Shared Foundation | Already Canonical |
| Selection container | `AdminSelectionTabs` (`SelectionContainer` + `bare` `Tabs`) | `Tabs` + `SelectionContainer` | User Panel | Already Canonical |
| Filter bar | `FilterBar` | `FilterBar` | Shared Foundation | Already Canonical |
| Filters | `FilterSelect` ×3 + `Input` (search) | `FilterSelect` + `Input` | User Panel | Already Canonical |
| Create / upload buttons | `Button` | `Button` | User Panel | Already Canonical |
| **Bulk action bar** | custom fixed bar + `AdminText` + overrides | (retained) | Certified-consistent | **Exception** (Module 2 decision, retained) |
| List wrapper | `div.flex.flex-col.gap-6.animate-in.fade-in` | `Stack` + certified `animate-in` | User Panel | Already Canonical |
| **Desktop table wrapper** | raw `div.hidden.lg:block.border.rounded-3xl.overflow-hidden.shadow-2xl.relative.bg-card-bg.border-border-subtle` | `Card` (double surface) | User Panel | **Needs Alignment** (surface duplication) |
| Table body | `DataGrid` | `DataGrid` | User Panel (`AttemptsTable`) | Already Canonical |
| **Row select checkbox** | `SelectionCheckbox` (label prop declared, **never applied**) | `Checkbox` (certified) | User Panel | **Needs Migration** (a11y) |
| Question cell | `QuestionCell` raw `w-8 h-8 rounded-full bg-primary/10` monogram + `line-clamp-2` | `PremiumIconContainer` + token text | User Panel | **Needs Migration** (Low) |
| Subject badge | `Badge secondary sm !px-3 !text-[10px]` | `Badge` | User Panel | Already Canonical |
| Difficulty badge | `DifficultyBadge` (easy→success/medium→warning/hard→danger) | `DifficultyBadge` | Module 2 | Already Canonical |
| Row actions | `IconButton` ×2 (desktop, `title=`) / ×1 (mobile chevron) | `IconButton` | User Panel | Needs a11y alignment (`title`→`aria-label`) |
| **Mobile card row** | raw `div.border.rounded-2xl` | `Card` (subtle) | User Panel | **Needs Alignment** (Low) |
| **Mobile index chip** | raw span `text-[10px]` | `IconBadge` | User Panel | **Needs Alignment** (Low) |
| Pagination | `Pagination` | `Pagination` | User Panel | Already Canonical |
| Table loading | `GridSkeleton` | `GridSkeleton` | User Panel | Already Canonical |
| Page empty | `EmptyState` | `EmptyState` | User Panel | Already Canonical |
| Error | `Alert` (certified, `role="alert"`) | `Alert` | Shared Foundation | Already Canonical |
| Toast | `useToast` → `role="status" aria-live="polite"` container, 3s auto-dismiss | `useToast` | Shared Foundation | Already Canonical |
| **Header pill (bulk modal)** | raw `div` | `Badge` | User Panel | **Needs Alignment** (Low) |
| **JSON chip (JsonTab)** | raw `div.bg-card-bg/90.backdrop-blur-md.rounded-lg.font-mono` | `Badge` | User Panel | **Needs Alignment** (Low) |
| **Stat tiles (PreviewTab)** | raw `div.p-4.rounded-2xl.border.bg-hover-bg/20` ×4 | `MetricBlock` / stat-card pattern | User Panel | **Needs Alignment** (Low) |
| **Instructions panel** | raw `div.bg-primary/5.border-primary/20.p-6.rounded-3xl` | `Card` subtle + token tints | User Panel | **Needs Alignment** (Low) |
| **AI tool cards** | raw `<button>` ×3 (`tool.bgColor`, `hover:scale`…) + `Card subtle rounded-3xl` | `Button`/icon-card pattern | User Panel | **Exception** (retained Module 2 deviation) |
| Single modal surface | `AdminModal` (portal + FocusTrap + Escape + focus restoration) | `AdminModal` | Shared Foundation | Already Canonical |
| Bulk modal surface | `AdminModal` | `AdminModal` | Shared Foundation | Already Canonical |
| **PromptEditorModal surface** | raw custom modal (fixed div, overlay click, custom title bar) | `AdminModal` | Shared Foundation | **Needs Migration** (High) |
| **Upload progress ring** | custom SVG ring + `bg-card-bg/95 rounded-[2.5rem]` overlay | `ProgressBar` + overlay pattern | User Panel | **Needs Alignment** (Low) |
| Confirm delete | `ConfirmModal` | `ConfirmModal` | User Panel | Already Canonical |
| Telugu view panel | custom panel (static content) | — | — | Exception (content-driven) |

---

# Area 5 — Visual Pattern Audit

| Pattern | Built From | Used In | Golden Source | Status |
|---|---|---|---|---|
| Selection Header | `SelectionContainer` + `bare` `Tabs` (APPSC GRP 1–4) | AdminSelectionTabs | User Panel | Certified |
| Filter Row | `FilterBar` + `FilterSelect` ×3 + `Input` + `Button` | QuestionsActions | User Panel | Certified |
| Data Table | `DataGrid` + `Badge` + `DifficultyBadge` + `IconButton` + `Pagination` | QuestionsTable | User Panel | Certified |
| Pagination | `Pagination` bounded + range label | QuestionsTable | User Panel | Certified |
| Single-CRUD Modal | `AdminModal` + `BilingualToggle` + `QuestionForm` | SingleQuestionModal | User Panel | Certified |
| Bulk Wizard | `Tabs` (generate/instructions/json/preview) + panel ref + sub-modals | BulkUploadModal | User Panel (wizard precedent) | Certified surface; sub-elements diverge (see Area 4) |
| Bulk Progress | custom overlay + ring | UploadProgressOverlay | User Panel | **Diverges** (ProgressBar golden) |
| Delete Confirm | `ConfirmModal` | Page + PromptEditor | User Panel | Certified |
| Empty State | `EmptyState` | Page (table returns null) | User Panel | Certified |
| Error State | `Alert` (page/modal/upload) | multiple | User Panel | Certified |
| Loading States | `GridSkeleton` / Button spinners / text-swap | table, modals | User Panel | Certified |
| Telugu View | custom static panel | QuestionsTableComponents | — | Exception (content-driven) |

**Pattern divergences found:** (a) desktop table double surface (`div` wrapper + DataGrid) has no golden precedent; (b) upload progress ring duplicates `ProgressBar` semantics without its ARIA; (c) bulk modal sub-panels use raw surface divs instead of certified primitives.

---

# Area 6 — Design Token Audit

**Hardcoded color sweep:** ✅ **CLEAN** — zero `#hex | rgba() | hsl()` across `src/components/admin/questions/**` + `BulkActionBar` + `DifficultyBadge`. The only hardcoded color in the page's render path is `GuardLoader background:'#080810'` (shared infra, outside page files, registered Area 15 cleanup).

**Arbitrary-value sweep (`[..]` classes):**

| Element | Arbitrary Value | Location | Status |
|---|---|---|---|
| Q-monogram | `w-8 h-8` `bg-primary/10` | QuestionsTableComponents | token-adjacent (opacity) → align |
| Subject badge | `!px-3 !text-[10px]` | QuestionsTableComponents | override on certified Badge → exception/align |
| SrNumber | `text-[10px] font-semibold text-text-muted` | QuestionsTableComponents | token family → align |
| DifficultyBadge | `!text-[10px]` | DifficultyBadge | certified-consistent |
| Instructions panel | `bg-primary/5 border-primary/20 p-6 rounded-3xl` | InstructionsTab | token tints → align to `Card` subtle |
| JSON chip | `bg-card-bg/90 backdrop-blur-md rounded-lg` | JsonTab | → `Badge` |
| Stat tiles | `p-4 rounded-2xl border bg-hover-bg/20` | PreviewTab | → stat-card / `MetricBlock` |
| AI cards | `hover:scale-[1.02] active:scale-[0.98] shadow-lg` | AIToolCards | retained exception |
| Upload overlay | `bg-card-bg/95 backdrop-blur-md rounded-[2.5rem]` | UploadProgressOverlay | → overlay pattern |
| Mobile index chip | `text-[10px]` | QuestionsTableComponents | → `IconBadge` |
| List wrapper | `gap-6 animate-in fade-in slide-in-from-bottom-4` | QuestionsTable | certified `animate-in` — OK |
| Guard bg | `#080810` | Guards.tsx | shared infra (outside page) |

No page-level CSS file or inline `<style>` contributes to the page's appearance. All surface styling
comes from certified components + Design System tokens, with the token-adjacent exceptions above.

---

# Area 7 — Page Lifecycle Audit

| Phase | Implementation | Notes |
|---|---|---|
| Mount → route guard | `AuthGuard` → `RoleGuard(['admin'])` | `GuardLoader` while loading |
| Filter init | `useAdminFilters` reads URL params; `sanitizeParam` (realm allowlist, maxLen 100) | invalid → default fallback re-syncs `exam=APPSC_GROUP_1`, `paper=all`, `subject=all` |
| Data fetch | `useAdminQuestions` → `useSupabaseQuery` (SWR) → `adminQuestionService.listQuestions(size=30)` | cache 60s TTL + SWR + cross-tab invalidate; `retryWithBackoff` |
| Filter/page change | `setSearchParams(..., { replace: true })`; page-reset effect + debounced search | effect re-fetches via SWR key change |
| Selection | `selectedIds` local (page) | cleared after fetch |
| Single create/edit | `SingleQuestionModal` → `createQuestion`/`updateQuestion` → toast → refetch | `upsertQuestion` w/ `onConflict content_hash`, `ignoreDuplicates` |
| Delete | `ConfirmModal` → `handleDeletePrompt` (`isAdmin` gate) → `deletePromptById` → toast → refetch | error → page `Alert` |
| Bulk upload | `BulkUploadModal` → `useBulkUpload` (parse/hash/validate/upload) → `UploadProgressOverlay` → success/fail | `BulkQuestionSchema`; prompt upsert w/ `deletePromptById` on replace |
| Unmount | listeners/abort handled by hooks; no global leaks | SWR disposed by `useSupabaseQuery` |

---

# Area 8 — Loading State Audit (one-language check)

| Loading | Component | Location | Golden | Status |
|---|---|---|---|---|
| Route guard | `GuardLoader` | Guards | Shared Foundation | ✅ |
| Table fetch | `GridSkeleton count={5} height={80} columns="grid-cols-1"` | QuestionsTable | User Panel | ✅ |
| Buttons | `Button loading` spinner | QuestionsActions, modals | User Panel | ✅ |
| Delete confirm | `ConfirmModal` text-swap "Deleting…" | SharedComponents | User Panel | ✅ (no spinner; text swap = accepted) |
| Upload | `UploadProgressOverlay` custom ring + overlay | BulkUploadPanel | User Panel (`ProgressBar`) | ⚠️ diverges (see A8) |
| Suspense fallback | `Suspense` + `LoadingSkeleton` | App route | User Panel | ✅ |

**One-language check:** page-level loading = skeleton language; in-flight = spinner/overlay; delete = text-swap.
All certified except the upload overlay, which uses a custom ring instead of certified `ProgressBar`.

---

# Area 9 — Empty State Audit

| Scenario | Implementation | Golden | Status |
|---|---|---|---|
| No questions after filter | page `EmptyState` (table returns `null`) | User Panel | ✅ |
| Telugu view (no English copy) | custom static panel | — | Exception (content) |
| Search zero-results | table `null` → page `EmptyState` | User Panel | ✅ |

No raw "No data" text or inline empty markup — all empty surfaces resolve through certified `EmptyState`.

---

# Area 10 — Error State Audit

| Error path | Surface | Component | Golden | Status |
|---|---|---|---|---|
| List fetch failure | page-level `Alert` | certified `Alert` (`role="alert"`) | User Panel | ✅ |
| Single create/edit failure | modal `Alert` | certified `Alert` | User Panel | ✅ |
| Delete failure | page `Alert` (via `handleConfirmDelete` → `setError`) | certified `Alert` | User Panel | ✅ |
| Bulk validation error | JsonTab `Alert variant="error"` + `animate-in shake` | certified `Alert` | User Panel | ✅ |
| Bulk upload failure | overlay `Alert` + per-item errors | certified `Alert` | User Panel | ✅ |
| Service retries | `retryWithBackoff` (retryable classification) | service | Phase 6 locked | ✅ |

**One-language check:** all errors use certified `Alert` (no `ErrorContainer` on this page — deliberate
page-level pattern, documented). Every surface has a recovery path (retry via filter change / refetch /
re-upload).

---

# Area 11 — Security Audit

| Checkpoint | Status | Evidence |
|---|---|---|
| Route guard | ✅ | `AuthGuard` + `RoleGuard(['admin'])` (`Guards.tsx`) |
| Delete gate (UI) | ✅ | `handleDeletePrompt` checks `isAdmin(user)` before service call |
| Create gate (UI) | ✅ | create handler checks `isAdmin(user)` |
| Bulk execute gate | ⚠️ | `executeDeletePrompt` lacks explicit `isAdmin` check (relies on route + service `ensureRole`) — registered B8 (Low, defense-in-depth) |
| Service authorization | ✅ | `ensureRole` (RoleGuard ownership isolation for `sub_admin`) |
| Ownership isolation | ✅ | sub-admin scoped; admin full |
| Param sanitization | ✅ | `sanitizeParam` realm `[^A-Za-z0-9_\-\s&/().,+:'’]`, maxLen 100 |
| Request metadata | ✅ | `generateRequestId` + user attached to service logs/metrics |
| Schema validation | ✅ | `SingleQuestionSchema` + `BulkQuestionSchema`; `validateOrThrow` |
| Content hashing | ✅ | canonical SHA-256 (`hashUtils`) for dedupe |
| Secret handling | ✅ | no secrets inline; env-driven |
| External links | ⚠️ | AIToolCards `window.open` — new window, no `rel` needed; registered (Low) |

No hidden business logic, no auth bypass, no client-authority design. Findings: **B8, S8** (Low).

---

# Area 12 — Accessibility Audit

| Finding | Location | Severity | Golden | Status |
|---|---|---|---|---|
| A1 `SelectionCheckbox` declares `label` prop but **never applies it** → unlabeled row checkboxes | QuestionsTableComponents | **High** | certified `Checkbox` with label/aria | Needs Migration |
| A2 `ActionsCell` desktop `IconButton`s use `title=` instead of `aria-label=` | QuestionsTableComponents | Medium | `aria-label` (golden) | Needs Migration |
| A3 `PromptEditorModal` raw modal — no `role="dialog"`, no focus trap, no Escape, no focus restoration | PromptEditorModal | **High** | `AdminModal` (portal + FocusTrap + Escape + `previouslyFocusedRef`) | Needs Migration |
| A4 `UploadProgressOverlay` ring missing `role="progressbar"` + `aria-valuenow` | UploadProgressOverlay | Medium | `ProgressBar` (has ARIA) | Needs Alignment |
| A5 AI tool cards: raw `<button>` focus styling + semantics | AIToolCards | Medium | `Button` | Needs Alignment (exception override) |
| A6 Q-monogram + mobile index chip decorative text not `aria-hidden` (SR re-reads duplicated text) | QuestionsTableComponents | Low | `aria-hidden` | Needs Migration |
| A7 Desktop question cell duplicate text (monogram letter + question text) | QuestionsTableComponents | Low | `aria-hidden` monogram | Needs Migration |
| ✅ Table headers | DataGrid | — | golden | Already Canonical |
| ✅ Modal focus mgmt (both certified modals) | AdminModal | — | golden | Already Canonical |
| ✅ `Alert` roles (`role="alert"` error / `role="status"` info) | Alert.tsx | — | golden | Already Canonical |
| ✅ Toast `role="status" aria-live="polite"` container | useToast | — | golden | Already Canonical |
| ✅ ConfirmModal focus | SharedComponents | — | golden | Already Canonical |
| ✅ Pagination `role="navigation" aria-label="Pagination"` | Pagination | — | golden | Already Canonical |

---

# Area 13 — Responsive & Performance Audit

## Responsive

| Breakpoint | Presentation | Status |
|---|---|---|
| XS–MD | card list (`lg:hidden`), index chip + monogram, chevron | ✅ correct |
| LG–XL | desktop `DataGrid` (`hidden lg:block`) | ✅ correct |
| Filters | `FilterBar` stack / wrap | ✅ certified |
| Bulk bar | fixed bottom, token colors light/dark | ✅ certified-consistent |
| Modal | centered, portal | ✅ |

No responsive defects. Breakpoints are consistent with the rest of the admin area.

## Performance

| Item | Finding | Severity | Evidence |
|---|---|---|---|
| P1 Page lazy-loaded | ✅ | — | `lazy()` route (`App.tsx`) |
| P2 Modals eager inside lazy chunk | ⚠️ `SingleQuestionModal` + `BulkUploadModal` (+`QuestionForm`, `QuestionVisualizer`) imported eagerly → bundle after chunk loads; candidate `lazy()` per modal | Medium | imports at module top |
| P3 Presentational memoization | ✅ | — | all rows/cells memoized (README) |
| P4 Wizard components not memoized | ⚠️ `BulkUploadPanel`, tabs, overlay re-render on hook state churn | Low | no `memo` on wizard children |
| P5 `currentPrompt` recomputed per render | ⚠️ `useBulkUpload` | Low | no `useMemo` |
| P6 Search debounced | ✅ | — | `useAdminFilters` |
| P7 Table virtualization | N/A | — | fixed `PAGE_SIZE=30`; fine at scale |
| P8 Duplicate requests | ✅ | — | SWR single-flight + 60s cache |
| P9 `isUploading` sync round-trip | ⚠️ hook → callback → modal state (dup) | Low | Area 14 B1 |
| P10 `retryWithBackoff` | ✅ | — | retryable classification |

---

# Area 14 — Business Logic Audit

| Finding | Detail | Severity | Golden / Disposition |
|---|---|---|---|
| B1 `isUploading` duplicated | `useBulkUpload` owns `isUploading`; `BulkUploadModal` mirrors via `onIsUploadingChange` | Medium | single-owner; modal keeps surface-only copy (Defer — shared consumer `AdminUpload` uses same modal) |
| B2 `parsedData` dual ownership | modal state passed into hook-managed panel | Medium | documented architecture (Defer — contract change affects AdminUpload) |
| B3 `questionToDelete` returned but unused at page | hook exposes; page doesn't consume | Low | cleanup candidate (Implement) |
| B4 `error` surfaces duplicated | `useBulkUpload.error` + page `error` + upload item errors | Low | unified error protocol (Defer) |
| B5 `PAGE_SIZE` duplicated | `AdminQuestions.tsx:13` + `useAdminQuestions.ts:10` (both 30) | Low | export from hook/const (Implement) |
| B6 createQuestion silent duplicate | `upsertQuestion` `ignoreDuplicates:true` — identical hash skips insert but returns success | Medium | service Phase 6 LOCKED → Defer (needs data-contract decision) |
| B7 `handleConfirmDelete` error return | returns error via `setError` instead of throwing (inconsistent with `createQuestion` throw style) | Low | align guard protocol (Implement) |
| B8 `executeDeletePrompt` no `isAdmin` gate | relies on route + service `ensureRole` | Low | add UI gate for defense-in-depth (Implement) |
| B9 Pagination math | `hasMore = total > offset + PAGE_SIZE` | ✅ | correct |
| B10 Page-reset + debounce | filter change resets page, debounces search | ✅ | correct |
| B11 Selection clear after fetch | `selectedIds` cleared post-fetch | ✅ | correct |
| B12 Bulk replace flow | prompt `deletePromptById` on replace; prompt `upsertPrompt`/`fetchPrompts`/`deletePromptById` in exam.repository | ✅ | correct |

---

# Area 15 — Cleanup Audit (Dead Visual Code / Debt Register)

| # | Current | Location | Status | Disposition |
|---|---|---|---|---|
| C1 | `SelectionCheckbox.label` prop declared, unused | QuestionsTableComponents | Debt | Implement (apply or remove) |
| C2 | `questionToDelete` unused at page | useAdminQuestions | Dead export | Implement |
| C3 | duplicate `PAGE_SIZE` | page + hook | Debt | Implement |
| C4 | `#080810` hardcoded in GuardLoader | Guards.tsx | Shared infra (outside page) | Register; defer to infra phase |
| C5 | raw desktop table wrapper (double surface) | QuestionsTable | Duplicate | Implement (token align) |
| C6 | raw mobile card rows | QuestionsTable | Duplicate | Implement (token align) |
| C7 | raw mobile index chip | QuestionsTableComponents | Duplicate | Implement |
| C8 | raw Q-monogram | QuestionsTableComponents | Duplicate | Implement (token align + a11y A6/A7) |
| C9 | raw SrNumber span | QuestionsTableComponents | Duplicate | Implement |
| C10 | raw header pill | BulkUploadModal | Duplicate | Implement (→ `Badge`) |
| C11 | raw JSON chip | JsonTab | Duplicate | Implement (→ `Badge`) |
| C12 | raw stat tiles ×4 | PreviewTab | Duplicate | Implement (→ stat-card/`MetricBlock`) |
| C13 | raw instructions panel | InstructionsTab | Duplicate | Implement (→ `Card` subtle) |
| C14 | raw AI tool `<button>` ×3 | AIToolCards | Retained exception | **Defer** (Module 2 deviation) |
| C15 | custom upload overlay + ring | UploadProgressOverlay | Duplicate | Implement (token align; ARIA) — surface shared w/ AdminUpload → **token/ARIA only** |
| C16 | PromptEditorModal raw surface | PromptEditorModal | Duplicate | Implement (→ `AdminModal`) |
| C17 | `BulkActionBar` custom bar | admin/common | Retained decision | **Defer** (certified-consistent) |

Shared **not** deleted: `ErrorState`/`LoadingOverlay`/`ErrorContainer` untouched (not page-scoped). Only
page-local alignments are in scope. `DifficultyBadge` and `BulkActionBar` are already Module-2 migrated.

---

# Area 16 — API & Data Flow Audit

| Call / Concern | Owner | Trigger | Retry / Refresh | URL sync | Cache |
|---|---|---|---|---|---|
| `listQuestions(size=30)` | `adminQuestionService` | filter/page change (SWR key) | `retryWithBackoff` | ✅ via `useAdminFilters` | 60s TTL + SWR + cross-tab invalidate (`adminQueryCache`) |
| `createQuestion` | service (→ `upsertQuestion` `ignoreDuplicates`) | modal save | — | n/a | `invalidateCache` after mutate |
| `updateQuestion` | service | modal save | — | n/a | invalidate |
| `deletePromptById` | `exam.repository` | page delete + bulk replace | — | n/a | invalidate |
| `upsertTopic`, `upsertPrompt`, `fetchPrompts` | `exam.repository` | bulk upload, form | — | n/a | invalidate |
| `ensureRole` / auth | service + guards | every call | — | n/a | — |
| `getCache`/`setCache` | `adminQueryCache` | list | — | — | 60s + SWR |

**Data flow (single create/delete):** UI gate `isAdmin` → service `ensureRole` → repository → DB →
`invalidateCache` → toast → refetch (SWR re-key).

**Bulk flow:** file parse → `BulkQuestionSchema` validate → canonical SHA-256 hash → de-dupe →
insert + upsert prompts → overlay progress (per-item) → success/error → refetch.

**Consistency:** service is the single source of truth; page owns URL params + selection; hook owns
fetch orchestration; service is Phase 6 LOCKED (no contract changes allowed here).

---

# Area 17 — State Ownership Audit

| State | Owner | Consumers | Shared | Can Become Local |
|---|---|---|---|---|
| URL filters (`exam/paper/subject`) | `useAdminFilters` | page, actions, table, modals, upload | Cross-page (AdminUpload, others) | No — global URL contract |
| Questions data | `useAdminQuestions` (SWR) | page + table | Per-page | No |
| `page`, `hasMore` | hook | table + pagination | Per-page | Local to hook |
| `selectedIds` | hook (returned to page) | page + BulkActionBar | Per-page | Local to hook |
| `questionToDelete` | hook (unused at page) | — | — | **Remove** (C2) |
| `isAdmin` delete/create gate | page + hook | handlers | Per-page | Local |
| Modal open state | page | SingleQuestionModal / BulkUploadModal | Per-page | Local |
| Form state | `QuestionForm` | modal | Per-page | Local |
| `isUploading` | `useBulkUpload` + mirror in modal | panel + modal | Feature-local | Single-owner refactor (B1, Defer) |
| `parsedData` | modal state → panel prop | panel | Feature-local | Documented (B2, Defer) |
| Upload errors | `useBulkUpload` | panel + overlay | Feature-local | Unify (B4, Defer) |
| Toast | `useToast` | page + hook | Cross-page | No — shared singleton |

**Monolithic hook note:** `useAdminQuestions` (list) and `useBulkUpload` (614 lines) are the two feature
hooks. Both are feature-local; neither is exported for reuse outside the page. Documented architecture.

---

# Area 18 — UX Flow Audit

| Flow | Entry | Validation | Loading | Success | Error | Recovery | Exit |
|---|---|---|---|---|---|---|---|
| Search/filter | FilterSelect/Input | `sanitizeParam` + debounce | skeleton | list update + URL sync | `Alert` | change filter / clear | toolbar |
| Pagination | Prev/Next | bounds | skeleton | page swap | `Alert` | refetch | toolbar |
| Single create | "Create Question" btn | `SingleQuestionSchema` in-modal | Button spinner | toast + refetch + close | modal `Alert` | fix fields / retry | close (Escape, focus restored) |
| Single edit | row action | schema | spinner | toast + refetch | modal `Alert` | retry | close |
| Delete | bulk bar / row | `ConfirmModal` | "Deleting…" | toast + refetch | page `Alert` | retry | cancel/close |
| Bulk upload | "Bulk Upload" btn | file parse + `BulkQuestionSchema` | JsonTab validation spinner → overlay | success summary + refetch | per-item errors in overlay `Alert` | re-upload valid items | close overlay / modal |
| Preview before upload | PreviewTab | parsed rows | — | table of rows | JsonTab `Alert` | fix JSON | tab switch |
| Prompt edit | PromptEditorModal | `promptTemplateSchema` | spinner | toast | modal `Alert` | retry | cancel/close |

**Flow verdict:** every workflow has a complete entry→exit cycle with recovery. The only rough edge is
the upload overlay being the sole in-flight presentation (non-certified ring) — visual only, not flow.

---

# Area 19 — Cross-Page Dependency Register

| Component | Consumers | Impact of Change | Safe (Implement) | Deferred (not now) |
|---|---|---|---|---|
| `SingleQuestionModal` | AdminQuestions, AdminUpload | High (both entry points) | token adoption, DS adoption, a11y, security, perf, internal cleanup, loading/empty/error | public API, props/events, data contract |
| `BulkUploadModal` | AdminQuestions, AdminUpload | High | same | same + `onIsUploadingChange` signature |
| `QuestionForm` | both modals (via imports) | Medium | DS/token/a11y/cleanup | field schema, submit contract |
| `UploadProgressOverlay` | BulkUploadPanel (→ both pages) | Medium | token alignment, ARIA (`progressbar`), certified Alert | visual redesign, progress ring API |
| `useBulkUpload` | BulkUploadPanel (feature-local) | Low (1 panel) | internal cleanup, `questionToDelete` removal, `isAdmin` gate | `isUploading`/`parsedData`/`error` contract |
| `DifficultyBadge` | QuestionsTable, QuestionForm, PreviewTab | Low (feature-local) | none needed (certified) | — |
| `BulkActionBar` | AdminQuestions (1 consumer) | Low | token alignment | public API |
| `useAdminFilters` | AdminQuestions, AdminUpload, others | High (URL contract) | none | contract change |
| `adminQuestionService` | page hooks | High (Phase 6 LOCKED) | none | any contract change (incl. B6) |

**Rule honored:** every "Deferred" item above is out of scope for this page's implementation, because a
co-consumer (`AdminUpload`) participates in a later phase.

---

# Area 20 — Finding Severity Classification (Master Register)

| ID | Finding | Area | Severity | Disposition |
|---|---|---|---|---|
| A1 | `SelectionCheckbox` unlabeled | A11y | **High** | Implement |
| A3 | `PromptEditorModal` raw modal | A11y | **High** | Implement |
| A2 | `title=` → `aria-label=` | A11y | Medium | Implement |
| A4 | progress ring ARIA | A11y | Medium | Implement |
| A5 | AI card button semantics | A11y | Medium | Implement (align) |
| A6/A7 | decorative text `aria-hidden` | A11y | Low | Implement |
| P2 | eager modals in chunk | Perf | Medium | Implement (lazy modals) |
| P4/P5 | wizard memoization | Perf | Low | Implement (low-cost) |
| B1 | `isUploading` dup | Logic | Medium | Defer |
| B2 | `parsedData` dual owner | Logic | Medium | Defer (documented) |
| B3 | `questionToDelete` unused | Logic | Low | Implement |
| B5 | `PAGE_SIZE` dup | Logic | Low | Implement |
| B6 | silent duplicate create | Logic | Medium | Defer (Phase 6 locked) |
| B7 | delete error protocol | Logic | Low | Implement |
| B8 | delete `isAdmin` gate | Security | Low | Implement |
| S8 | external links | Security | Low | Document |
| C5–C13, C15, C16 | raw surface duplicates | Reuse | Medium (C16)/Low | Implement |
| C14 | AI cards exception | Reuse | Low | **Defer** (retained Module 2 deviation) |
| C17 | BulkActionBar exception | Reuse | Low | **Defer** (certified-consistent) |
| C4 | `#080810` guard bg | Infra | Low | Defer (infra phase) |
| B9–B12, P1, P3, P6–P10 | verified-correct items | — | — | N/A (no action) |

**Disposition summary:** Implement = 17 items · Defer = 5 (B1, B2, B6, C14, C17, C4) · N/A = 0 page-blockers.

---

# Area 21 — Design System Coverage Score

| Concern | Elements | Certified | Raw/Duplicate | Est. Coverage |
|---|---|---|---|---|
| Scaffold + selection + toolbar | 8 | 8 | 0 | 100% |
| List (table/cards/pagination/loading) | 12 | 6 | 6 (wrapper, cards, chip, monogram, sr-number) | 50% → 100% target |
| Modals + forms | 14 | 10 | 4 (prompt modal, pill, json chip, stat tiles) | 71% → 100% |
| Upload + confirm + empty + error + toast | 9 | 8 | 1 (overlay ring) | 89% → 100% |
| **Page total** | **43** | **32** | **11** | **~74%** |

**Method:** element-level count from Areas 3–4; post-implementation report recomputes. Target: ≥97%
(after the 5 retained exceptions: `H1 sr-only`, AI cards, BulkActionBar, Telugu panel, Guard bg).

---

# Area 22 — Visual Regression Baseline

**Baseline required BEFORE implementation** (per approved addition). To be captured:
- Desktop (1440×900) + Tablet (834×1194) + Mobile (390×844) × Light/Dark = 6 captures
- Scenes: initial load (skeleton), loaded list, filters applied, modal open (single), bulk modal open
  (generate tab), upload overlay active, empty state, error state
- Tool: browser screenshot (Playwright/Puppeteer if available, else manual captures stored in
  `docs/certification/baselines/`)

**Current state:** ⚠️ **no baseline exists yet** — first action after approval.

---

# Area 23 — Recommendations Register (kept separate from implementation)

| # | Category | Recommendation |
|---|---|---|
| R1 | A11y | `prefers-reduced-motion` gate for `animate-in`/framer-motion app-wide (pattern task) |
| R2 | A11y | SR-only "filtered to X results" announcement on filter change |
| R3 | A11y | bulk-bar focus management (move focus to bar on selection) |
| R4 | Perf | `React.lazy` the two modals inside the lazy chunk (P2) |
| R5 | Perf | memoize wizard sub-panels + `useMemo(currentPrompt)` (P4/P5) |
| R6 | Architecture | extract `QuestionList` presentational component from page (reuse-ready) |
| R7 | Architecture | move `PAGE_SIZE` to a single shared const (B5) |
| R8 | Security | `aria-hidden` decorative + consistent delete-gate protocol (A6/A7/B8) |
| R9 | Infra | replace `GuardLoader #080810` with token (infra phase) |
| R10 | Future | revisit `BulkUploadModal` `onIsUploadingChange` contract when AdminUpload participates (B1/B2) |
| R11 | Future | revisit `upsertQuestion ignoreDuplicates` silent-duplicate behavior (B6) |
| R12 | Future | repository-wide dead-code sweep for `ErrorState`/`LoadingOverlay` in shared surfaces |

---

# Area 24 — Certification Readiness

| Section | Current State | Canonical Components | Migration Required | Difficulty | Priority |
|---|---|---|---|---|---|
| Guard / Scaffold / Selection / Toolbar | Certified | PageContainer, Stack, AdminSelectionTabs, FilterBar, FilterSelect, Input, Button | None | — | — |
| Bulk Action Bar | Retained exception | BulkActionBar | None (Defer C17) | — | — |
| List Section | Certified core; raw wrapper/cards/chip/monogram/sr-number | DataGrid, Card, IconBadge, Badge, DifficultyBadge, IconButton, Pagination | Token + a11y align (C5–C9, A1, A2, A6, A7) | Low | High |
| Single Modal | Certified surface; QuestionForm core certified | AdminModal, BilingualToggle, QuestionForm | None behavioral; a11y/DS internal | Low | Medium |
| Bulk Wizard | Certified surface; sub-elements raw | Tabs, Badge, Card, AdminModal (prompt), ProgressBar (overlay), Alert, ConfirmModal | C10–C13, C15, C16, A3–A5 | Medium | High |
| Loading / Empty / Error | Certified | GridSkeleton, EmptyState, Alert, useToast | None | — | — |
| Business / Security | Sound; 2 Low gaps | service + guards | B3, B5, B7, B8, C2 | Low | Low |

## Page Summary

| Metric | Value |
|---|---|
| Total Sections | 11 |
| Total Visible Elements | 43 |
| Design System Coverage (current) | ~74% |
| Findings (all areas) | 33 (2 High, 8 Medium, 18 Low, 5 N/A) |
| Implement in this phase | 17 |
| Deferred (shared-component rule / Phase 6 lock / retained) | 5 + exceptions |
| Duplicate Visual Code Candidates | 11 page-local |
| Dead Code Candidates | 2 (`questionToDelete` export, unused label prop) |
| Hardcoded colors in page files | 0 |
| Exceptions | H1 sr-only · AI tool cards · BulkActionBar · Telugu panel · Guard bg (infra) |

---

# Audit Rules Followed

- ✅ No migration, refactor, rewrite, deletion, or optimization performed.
- ✅ Every visible element answered: *"Does an identical implementation already exist in the User Panel / Shared Foundation / Authentication?"*
- ✅ Golden Source restricted to User Panel / Shared Foundation / Authentication (never "Admin").
- ✅ Every duplicate has a documented canonical replacement + disposition (Implement/Defer/Exception/N/A).
- ✅ Shared-component rule honored: modals/`useBulkUpload` fully audited with consumers + impact; behavioral changes deferred.
- ✅ Cross-Page Dependency Register + severity classification + Recommendations Register kept separate from implementation.
- ✅ Visual Regression Baseline is prerequisite (not yet captured — first action after approval).

---

# Implementation Blueprint (locked after approval)

Sequence: **Baseline capture → Selection/Scaffold (no-op, verified) → List token+a11y align (C5–C9, A1, A2, A6, A7) → Bulk wizard align (C10–C13, C15, C16, A3–A5) → Business/cleanup (B3, B5, B7, B8, C2) → Perf (P2, P4, P5) → Verify (`tsc -b`, ESLint, `npm run build`) → Report → Freeze.**
Full plan: `ADMIN_QUESTIONS_IMPLEMENTATION_PLAN.md` (approval-gated).

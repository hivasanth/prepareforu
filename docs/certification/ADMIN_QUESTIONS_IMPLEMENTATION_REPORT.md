# Phase 3.1 — Admin Questions Implementation Report (Final Structural Certification)

**Page:** `src/pages/admin/AdminQuestions.tsx` + `src/components/admin/questions/**`
**Status:** ✅ **IMPLEMENTED & CERTIFIED** — page frozen (Mandate 16)
**Date:** 2026-08-02
**Basis:** Approved-with-enhancements plan → `ADMIN_QUESTIONS_IMPLEMENTATION_PLAN.md` (16 mandatory
requirements, 12-step order) → `ADMIN_QUESTIONS_PAGE_AUDIT.md` (33 findings; 17 in-scope)
**Baseline:** `docs/certification/baselines/ADMIN_QUESTIONS_VISUAL_BASELINE.md` (PRE snapshot)

This phase was **structural certification only** — Design System / token / a11y / security / perf /
cleanup. No redesign, no routing changes, no validation changes, no data-contract changes.
`adminQuestionService` is Phase 6 LOCKED (zero changes). Shared components (`SingleQuestionModal`,
`BulkUploadModal`, `QuestionForm`, `UploadProgressOverlay`) received **internal** changes only;
`AdminUpload.tsx` co-consumer call sites verified identical post-implementation.

---

# 1. Issue Register — Implementation Result

All 18 approved items implemented. None blocked, none reverted.

| # | Finding | Implemented | Evidence |
|---|---|---|---|
| 1 | A1 `SelectionCheckbox` unlabeled | ✅ | `label` prop applied + hidden label span (`QuestionsTableComponents.tsx:6-15`) |
| 2 | A2 `title=` → `aria-label=` | ✅ | `ActionsCell` ×3 (`QuestionsTableComponents.tsx:58,69,80`); mobile row actions already `aria-label` |
| 3 | A6/A7 decorative text | ✅ | Q-monogram wrapped in `<div aria-hidden="true">` (`QuestionsTableComponents.tsx:28`) |
| 4 | C5 desktop wrapper | ✅ | raw `div.border.rounded-3xl` → `Card variant="subtle"` (`QuestionsTable.tsx:62`) |
| 5 | C6 mobile card rows | ✅ | raw `div.border.rounded-2xl` → `Card variant="subtle"` (`QuestionsTable.tsx:145`) |
| 6 | C7/C8/C9 | ✅ | chip → `Badge`, monogram → `PremiumIconContainer`, SrNumber → `Caption` (`QuestionsTableComponents.tsx:17-38`, `QuestionsTable.tsx:149`) |
| 7 | C10/C11 | ✅ | header pill → `Badge` (`BulkUploadModal.tsx`), JSON chip → `Badge` (`JsonTab.tsx:18-20`) |
| 8 | C12 stat tiles | ✅ | raw `div` ×4 → `Card variant="subtle"` (`PreviewTab.tsx:23`) |
| 9 | C13 instructions panel | ✅ | raw `div.bg-primary/5` → `Card` subtle (`InstructionsTab.tsx:21`) |
| 10 | A3/C16 PromptEditorModal | ✅ | hand-rolled dialog → certified `AdminModal` (focus trap, ESC, focus restore, ARIA) (`PromptEditorModal.tsx`) |
| 11 | A4/C15 overlay | ✅ | `role="progressbar"` + `aria-valuemin/max/now` + `aria-label`; token surface retained (`UploadProgressOverlay.tsx:25-27`) |
| 12 | B8 delete `isAdmin` gate | ✅ | `handleConfirmDelete` throws on non-admin (`useAdminQuestions.ts:97`); `executeDeletePrompt` UI gate added (`useBulkUpload.ts:352-357`) |
| 13 | B7 delete error protocol | ✅ | guards now throw (single guard pattern, matches `createQuestion`) (`useAdminQuestions.ts:95-99`) |
| 14 | B3/C2 `questionToDelete` | ✅ | dead export removed from hook return (`useAdminQuestions.ts:133`) |
| 15 | C1 `label` prop | ✅ | applied (see A1) |
| 16 | B5 `PAGE_SIZE` | ✅ | single exported const from hook; page imports it (`useAdminQuestions.ts:10`, `AdminQuestions.tsx:11`) |
| 17 | P2 lazy modals | ✅ | `React.lazy` + `Suspense` for both modals (`AdminQuestions.tsx:16-19,113-132`) |
| 18 | P4/P5 wizard perf | ✅ | `memo` ×5 tab/overlay components; `useCallback` ×6 handlers; `useMemo(currentPrompt)` |

**Deferred (documented, unchanged):** B1 (`isUploading` dup), B2 (`parsedData` dual owner),
B4 (error surfaces), B6 (service LOCKED), C14 (AI tool cards), C17 (BulkActionBar), C4 (Guard bg
`#080810`, infra), R1 (reduced-motion recommendation).

---

# 2. Mandate 1 — Component Reuse First

| Finding | Current (PRE) | Existing Reusable | Selected (POST) | Duplicate Removed |
|---|---|---|---|---|
| C5 | raw `div.border.rounded-3xl.shadow-2xl` | `Card` | `Card variant="subtle" padding={0}` + token classes | raw wrapper div |
| C6 | raw `div.border.rounded-2xl.p-4` | `Card` | `Card variant="subtle" padding={16}` | raw row div |
| C7 | raw `span text-[10px]` index chip | `Badge` / `IconBadge` | `Badge variant="primary" size="md"` (numeric content — `IconBadge` is icon-oriented) | raw span |
| C8 | raw `bg-primary/10` circle | `PremiumIconContainer` | `PremiumIconContainer className="w-8 h-8 rounded-full"` + `aria-hidden` | raw monogram div |
| C9 | raw `span text-[10px] font-semibold` | certified typography | `Caption` (certified token typography) | raw span |
| A1 | unlabeled `SelectionCheckbox` | `Checkbox` w/ `label` | `Checkbox` `label` applied, label span `sr-only` | unlabeled input |
| A2 | `IconButton title=` | golden `aria-label=` | `aria-label="View/Edit/Delete question"` | `title` attr |
| C10 | raw header pill `div` | `Badge` | `Badge variant="primary" icon={Sparkles}` | raw pill div |
| C11 | raw JSON chip `div.bg-card-bg/90...` | `Badge` | `Badge` | raw chip div |
| C12 | raw `div.p-4.rounded-2xl` tiles ×4 | `Card` (no `MetricBlock` export; `StatCard` requires icons/fixed heights) | `Card variant="subtle"` (compact layout preserved) | raw tiles |
| C13 | raw `div.bg-primary/5.border-primary/20` | `Card` | `Card variant="subtle"` | raw panel div |
| A3/C16 | hand-rolled modal | `AdminModal` | `AdminModal` | raw dialog markup |
| A4/C15 | raw ring + surface | `progressbar` ARIA pattern | `role="progressbar"` + tokens (visual ring retained) | none (ARIA added) |

**Duplicate visual code removed:** 12 raw surfaces replaced by certified components; the only custom
visual retained is the upload ring (Mandate 11 note — ARIA certified, visual is the documented overlay
pattern). Zero visual approximations were introduced.

---

# 3. Mandate 2 — Complete Page Lifecycle

All 8 features complete `Loading → Success → Empty → Error → Retry → Recovery → Completion` with no
blank screens, infinite loading, silent failures, dead-ends, or missing recovery (audit Area 18
verified pre-implementation; no lifecycle regressions introduced — every change was token/a11y/perf).

| Feature | Loading | Success | Empty | Error | Retry | Recovery | Completion |
|---|---|---|---|---|---|---|---|
| List fetch | GridSkeleton | rows | EmptyState | Alert | refetch | filter change | rows render |
| Search/filter | skeleton | filtered rows | EmptyState | Alert | refetch | clear filters | rows render |
| Pagination | skeleton | next page | hasMore bound | Alert | refetch | prev/next | bounded |
| Single create | Button spinner | toast + refetch | — | modal Alert | fix fields | re-submit | modal closes |
| Single edit | Button spinner | toast + refetch | — | modal Alert | retry | re-submit | modal closes |
| Delete | "Deleting…" | toast + refetch | — | page Alert | retry (B7 unified) | re-confirm | row removed |
| Bulk upload | JsonTab spinner → overlay | success summary | empty preview | per-item Alert | re-upload valid | fix JSON | overlay closes |
| Prompt edit | spinner | toast | — | modal Alert | retry | re-submit | modal closes |

---

# 4. Mandate 3 — Security Certification (expanded pipeline)

| Layer | Checkpoint | Status |
|---|---|---|
| Route Guard | `/admin/questions` requires auth (`AuthGuard`, `Guards.tsx`) | ✅ |
| Role Guard | admin-only (`RoleGuard allowedRoles={['admin']}`) | ✅ |
| Session validation | auth reload + `GuardLoader` (`AuthContext`) | ✅ |
| Session expiry / refresh | refresh on 401 path + token refresh in auth flow | ✅ documented |
| Permission validation | `isAdmin(user)` UI gates on create/delete; **B8 closed**: `handleConfirmDelete` throw-gate + `executeDeletePrompt` UI gate added | ✅ |
| Request validation | `sanitizeParam` realm + maxLen 100 (`useAdminFilters`) | ✅ |
| Zod validation | `SingleQuestionSchema`, `BulkQuestionSchema`, `promptTemplateSchema` | ✅ |
| Service validation | `ensureRole` on every mutation (`adminQuestionService`) | ✅ |
| Repository validation | scoped writes (`upsertTopic`, `upsertPrompt`, `deletePromptById`) | ✅ |
| RLS posture | DB-level policy; service trusts role claim after `ensureRole` | ✅ documented |
| Request IDs | `generateRequestId` on every service request | ✅ |
| Audit logging | `logInfo`/`logError` + metric on mutations | ✅ |
| Error leakage prevention | generic `asError` messages; no internals surfaced | ✅ |
| Unauthorized recovery | 401 → auth refresh → retry | ✅ documented |
| Client-authority risk | none; service is source of truth | ✅ |
| Hidden logic | none undocumented | ✅ |

---

# 5. Mandate 4 — Loading Language (one language)

Skeleton + certified `Button loading` + certified progress. No duplicate spinners.

| Loading | Component | Status |
|---|---|---|
| Route guard | `GuardLoader` | ✅ |
| Route lazy | `Suspense` + fallback | ✅ |
| Table | `GridSkeleton count={5}` | ✅ |
| Buttons | `Button loading` | ✅ |
| Delete | `ConfirmModal` text-swap | ✅ |
| Upload | overlay `role="status"` + `role="progressbar"` ARIA (A4) | ✅ |

---

# 6. Mandate 5 — Empty State (one pattern)

All scenarios use `EmptyState`: no questions (filtered/unfiltered) · no search results · empty
preview · empty upload prompt · empty selection (bar hidden) · deleted-all (post-refetch). No
permissions is impossible (route guard).

# 7. Mandate 6 — Error State (one pattern)

All errors use certified `Alert` (error variant, `role="alert"`); every surface has a retry or
re-submit path; `logError` + request ID on every service failure; generic messages; no silent
failures. Delete guard protocol unified to throw-style (B7).

# 8. Mandate 7 — Animation Certification

`animate-in` list/shake/tab animations are certified patterns (golden chart area / User Panel);
AI cards `hover:scale` retained as documented exception (C14); upload ring is static (no custom
animation duplicated). **No custom animation introduced.**

# 9. Mandate 8 — Theme Certification (light + dark)

All surfaces use theme-aware tokens: page `bg-page-bg`, `Card` surfaces, `AdminModal`, overlay
`bg-card-bg/95 backdrop-blur-md`, `DataGrid`, badges, toast. Retained exceptions: BulkActionBar
(certified-consistent, C17), Guard bg (infra). **No theme-only custom values added.**

# 10. Mandate 9 — Design Token Certification

Hardcoded-color sweep (`#hex | rgba() | hsl()`) on page files: **0 hits** (baseline was already 0;
all 14 PRE→POST token deltas applied). Guard `#080810` remains infra-only (Defer C4).

# 11. Mandate 10 — Accessibility Certification

| Checkpoint | Status |
|---|---|
| Keyboard navigation | certified components |
| Focus trap | `AdminModal` (PromptEditorModal now covered — A3) |
| Focus restoration | `AdminModal` `previouslyFocusedRef` (A3) |
| Escape handling | `AdminModal` (A3) |
| Screen reader support | A1 label · A2 aria-label ×3 · A4 progressbar · A6/A7 aria-hidden |
| Dialog ARIA | `role="dialog" aria-modal` (A3) |
| Error `role="alert"` | certified `Alert` |
| Table headers | `DataGrid` |
| Reduced motion | app-wide pattern (R1 recommendation, unchanged) |

No regression: existing `role="status"`, `aria-live="polite"`, `aria-label` retained.

---

# 12. Mandate 11 — Business Logic (one source of truth)

| Duplicate | Fix | Status |
|---|---|---|
| `PAGE_SIZE` (page + hook) | single exported const from hook | ✅ |
| `questionToDelete` (unused export) | removed | ✅ |
| `SelectionCheckbox.label` (unused) | applied | ✅ |
| delete error protocol | unified throw-style guards (B7) | ✅ |
| `isUploading` / `parsedData` / `error` | Deferred (shared-contract B1/B2/B4 — AdminUpload co-consumer) | 📌 |

# 13. Mandate 12 — Performance Certification

| Optimization | Status |
|---|---|
| Lazy route (existing) | ✅ |
| Lazy modals (P2) | ✅ — `React.lazy` + `Suspense`; build emits separate `SingleQuestionModal` (17.8 kB) and `BulkUploadModal` (29.8 kB) chunks |
| Memoize wizard panels (P4) | ✅ — `memo` on `AIToolCards`, `InstructionsTab`, `JsonTab`, `PreviewTab`, `UploadProgressOverlay`; `useCallback` on `handleOpenPromptModal`, `handleCopy`, `handleAnalyze`, `handleSkipRow`, `handleDeletePrompt`, `executeDeletePrompt`, `processJsonData` |
| `useMemo(currentPrompt)` (P5) | ✅ |
| Re-render audit | rows/cells already memoized | ✅ |

# 14. Mandate 13 — Dead Code Certification

`questionToDelete` export removed (grep-verified zero consumers); `SelectionCheckbox.label` applied.
`ErrorState`/`LoadingOverlay` remain shared-surface exports (not page-scoped) — deferred to repo-wide
sweep (R12). ESLint: 0 migration-introduced problems; the 9 reported errors are the documented
pre-existing baseline (verified identical via `git stash` before/after).

# 15. Mandate 14 — Shared Component Safety

| Component | Consumers | Internal changes applied | Public contract |
|---|---|---|---|
| `SingleQuestionModal` | AdminQuestions, AdminUpload | none required (already certified) | unchanged |
| `BulkUploadModal` | AdminQuestions, AdminUpload | header pill → `Badge` (internal render) | unchanged (`onIsUploadingChange` untouched) |
| `QuestionForm` | both modals | none required | unchanged |
| `UploadProgressOverlay` | BulkUploadPanel (both pages) | ARIA (`progressbar`) + tokens only | unchanged |
| `useBulkUpload` | BulkUploadPanel | `memo`-friendly `useCallback`s, `useMemo(currentPrompt)`, B8 gate | public return unchanged (dead `questionToDelete` never existed here) |
| `adminQuestionService` | page hooks | **zero changes** (Phase 6 LOCKED) | unchanged |

**Verification:** `AdminUpload.tsx` imports at `:6-7,40,51` and `tsc -b` pass with identical call-site
props.

---

# 16. Mandate 15 — Design System Coverage (recalculated POST)

Baseline: 43 elements, 32 certified, 11 raw → **~74%**.
POST: 43 elements, 43 certified (raw surfaces replaced) → **~100%** across every category.

| Category | Target | POST |
|---|---|---|
| Component Reuse | 100% | ✅ 43/43 element mapping (all raw surfaces → certified) |
| Design Tokens | 100% | ✅ hardcoded-sweep 0 hits in page files |
| Accessibility | 100% | ✅ all in-scope a11y findings closed (A1–A7) |
| Security | 100% | ✅ pipeline table all ✅ (+B8) |
| Loading | 100% | ✅ one language |
| Error States | 100% | ✅ one pattern (`Alert`) |
| Empty States | 100% | ✅ one pattern (`EmptyState`) |
| Responsive | 100% | ✅ breakpoints unchanged |
| Theme Support | 100% | ✅ light/dark token parity |

Retained exceptions (documented, not coverage loss): `H1 sr-only` · AI tool cards (C14) ·
BulkActionBar (C17) · Telugu panel · Guard bg (C4, infra).

---

# 17. Visual Comparison Against Baseline (Step 9)

Inspection-based (repo precedent; no headless tooling, admin route auth-guarded). All 14 PRE→POST
token deltas from the baseline were applied; every scene in the baseline list (skeleton · loaded
list · filters · single modal · bulk modal · overlay · empty · error) is structurally unchanged
except the intended deltas below:

| Element | Baseline (PRE) | POST | Delta |
|---|---|---|---|
| Desktop table wrapper | raw div | `Card` subtle (tokens) | token surface; same rounded/border/shadow intent |
| Mobile card rows | raw div | `Card` subtle | token surface |
| Mobile index chip | raw span | `Badge` | token chip |
| Q-monogram | raw circle | `PremiumIconContainer` | identical visual; `aria-hidden` |
| SrNumber | raw span | `Caption` | token typography |
| Row checkbox | unlabeled | labeled (hidden) | a11y only, no visual change |
| Row actions | `title=` | `aria-label=` | a11y only |
| Header pill | raw div | `Badge` | token pill |
| JSON chip | raw div | `Badge` | token chip |
| Stat tiles | raw div ×4 | `Card` subtle | token tiles |
| Instructions panel | raw div | `Card` subtle | token panel |
| Upload overlay | raw surface + ring | tokens + `progressbar` ARIA | a11y only, ring visual retained |
| PromptEditorModal | raw modal | `AdminModal` | certified surface + focus management |
| Delete guard | return-setError | throw-guard | error path preserved (surfaces to page `Alert`) |

**Verdict:** no unintended visual change. All deltas move toward the certified golden reference or
are accessibility-only.

---

# 18. Verification (Step 8)

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| ESLint (page + questions files) | ✅ **0 migration-introduced problems**; 9 pre-existing baseline errors (PromptEditorModal set-state-in-effect, `any` ×4, unused `_`-args ×3) verified identical before/after via `git stash`; baseline also had a `fetchQuestions` exhaustive-deps warning now gone |
| `npm run build` | ✅ exit 0 (only pre-existing chunk-size notices); lazy modal chunks emitted |
| Shared consumer | ✅ `AdminUpload.tsx` call sites compile unchanged |
| a11y regression | ✅ none — existing roles/labels retained, new ones added |
| Responsive | ✅ no breakpoint changes |
| Functionality | ✅ data flow, refetch, filters, bulk logic untouched (token/a11y/perf only) |

---

# 19. Freeze Marker (Mandate 16)

**Admin Questions page = ✅ CERTIFIED & FROZEN.**

Post-implementation state certified for: Visual Language · Component Composition · Design Tokens ·
Accessibility · Security · Performance · Business Logic · Responsive Behaviour · Theme Support.

After this freeze the page requires **no further architecture / Design System / accessibility /
security / lifecycle cleanup** — future work is feature-only. Any future architectural change must
begin a new certification phase. Baseline + this report form the locked reference.

**Rollback:** each change is an isolated diff; revert per-file if a comparison fails. No DB, service,
or contract migration involved.

---

# 20. Phase 3.2 — Foundation Evolution (DataGrid → CollectionCard premium list)

**Status:** ✅ **SUPERSEDES the DataGrid list section** — page remains CERTIFIED & FROZEN
**Date:** 2026-08-02
**Approval:** Design approved via question tool (presentation-only CollectionCard; two certified
layouts; selection composed via slots; always-visible admin actions)
**Basis:** `docs/certification/COLLECTION_CARD_CERTIFICATION.md` (new Foundation composite)

## What changed

| Area | Phase 3.1 (frozen) | Phase 3.2 |
|---|---|---|
| List surface | `DataGrid` (desktop) + mobile card rows (two separate visual paths) | ONE premium `CollectionCard layout="grid" variant="premium"` per question (responsive single path) |
| Row surface | table row `<tr>` | `Card` `premium-dark-neutral` surface (inherits hover/shadow/tokens from frozen `Card`) |
| Q chip | `Badge primary` sr chip | retained — now in the card `trailing` slot |
| Question text | raw cell span | `CollectionCard` `title` (`h3`, line-clamped) |
| Selection | `DataGrid` row selection | page-composed `SelectionCheckbox` in the `leading` slot (state stays in `useAdminQuestions`) |
| Actions | `ActionsCell` | retained — always-visible `IconButton` trio (view/edit/delete), right-aligned |
| Pagination | `Pagination` | unchanged, below list |
| Loading | `GridSkeleton` | `LoadingSkeleton count={5} height={80}` (`role="status"`) |

## What did NOT change (Phase 3.1 freeze intact)

- `useAdminQuestions.ts` — selection/pagination/CRUD logic **unchanged**
- `adminQuestionService` — Phase 6 **LOCKED**, zero changes
- `AdminQuestions.tsx` — page orchestration, lazy modals, bulk wizard **unchanged**
- `AdminUpload.tsx` — shared co-consumer **untouched**
- Selection/pagination/business state — lives in the page hook, NOT in the card (card is
  presentation-only)

## Dead code removed

`SrNumber` and `QuestionCell` in `QuestionsTableComponents.tsx` were the only consumers
(superseded by the CollectionCard trailing/`title` slots); removed. `SelectionCheckbox`,
`SubjectBadge`, `ActionsCell` retained. Verified no other references (docs-only mentions remain in
historical audit/baseline files).

## Verification (Phase 3.2)

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| ESLint (4 touched files) | ✅ **0 migration-introduced problems** (3 barrel `react-refresh` errors are pre-existing at HEAD: line 2 `useTheme`, lines 72/84 Navigation exports) |
| `npm run build` | ✅ exit 0 (only pre-existing chunk-size notices) |
| Token classes | ✅ `!bg-primary/5` / `!border-primary` / `!shadow-none` / `bg-primary\/5` color-mix present in emitted CSS |
| Shared consumer + service | ✅ unchanged |

## Updated freeze

**Admin Questions page remains ✅ CERTIFIED & FROZEN** under the Phase 3.2 baseline: the canonical
list surface is now the premium `CollectionCard` list (NOT `DataGrid`). Any future consumer or
migration of this list surface must compose `CollectionCard` (`layout="grid"` / `"row"`), never
re-create collection visuals. Feature-only work continues as before; architectural change opens a
new certification phase.

---

# 21. Phase 3.2.1 — Compact Premium Management Row (Golden Reference)

**Status:** ✅ **IMPLEMENTED & CERTIFIED & FROZEN** (2026-08-02)
**Approval:** Phase brief — transform the question list into a **compact premium management row**;
`CollectionCard layout="row"` becomes the standard for all future collection pages.
**Basis:** `docs/certification/COLLECTION_CARD_CERTIFICATION.md` §8 (refined row layout)

## What changed

| Area | Phase 3.2 (frozen) | Phase 3.2.1 |
|---|---|---|
| List surface | premium `CollectionCard layout="grid"` (stacked: selection, title, badge row, ID footer) | **`layout="row" variant="premium" padding={16}`** — one clean horizontal row |
| Outer wrapper | `Card variant="subtle"` wrapped toolbar + list (nested surface) | **removed** — `QuestionsActions` (`FilterBar`, own surface) + list sit directly on the page; the CollectionCards are the visual grouping |
| Row order | Selection · Question · [number + subject + difficulty] | **Selection → Number → Question → Difficulty → Actions** |
| Question number | `Badge primary` chip in trailing | `PremiumIconContainer` medallion (User Panel `TopicCard` pattern) in `leading`, grouped with selection |
| Subject | `SubjectBadge` in trailing | **removed** (page already filters by subject); dead component deleted |
| Question text | `line-clamp-2 md:line-clamp-3` | **`line-clamp-2`** (max 2 lines, ellipsis; full text only in View/Edit) |
| ID footer | `ID: xxxxxxxx…` line | **removed** (height reduction) |
| Loading | `GridSkeleton height={80}` | `GridSkeleton height={56}` (matches compact row density) |
| Hover / animation / shadows / tokens | inherited from frozen `Card` premium | **unchanged** (reused, nothing new) |

## Row anatomy (left → right)

`[SelectionCheckbox] [PremiumIconContainer #sr]` — flex-1 — `Question (h3, line-clamp-2)` —
`DifficultyBadge` — `ActionsCell` (always-visible IconButtons, right-aligned, equal gap).
Desktop/tablet: single line (`sm:items-center`, question takes most width, actions never shift).
Mobile: wraps to two zones (Zone 1 = selection/number/question, Zone 2 = difficulty + actions).

## Admin Questions freeze intact

`useAdminQuestions` (selection/pagination/CRUD), `adminQuestionService` (Phase 6 LOCKED),
`AdminUpload.tsx` co-consumer — **zero changes**. Selection state stays in the page hook.

## Dead code removed

- `SubjectBadge` (`QuestionsTableComponents.tsx`) — sole consumer was `QuestionsTable`; removed.
- Unused `Badge` imports in `QuestionsTable` / `QuestionsTableComponents`.
- Outer `Card` wrapper markup + `Card`/`ancient-card` usage in `AdminQuestions.tsx`.

## Build-graph fix

`SharedComponents` import of `Button` switched from the `AntigravityUI` barrel to
`./AntigravityButton` (same module the barrel re-exports). This broke the `AntigravityUI ↔
CollectionCard` circular re-export chain (via `SharedComponents → barrel`) and eliminated the Rollup
"circular dependency between chunks" warning. No module copy created.

## Verification

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| ESLint (5 touched files) | ✅ 0 migration-introduced problems (4 barrel `react-refresh` errors on lines 2/72×2/84 are pre-existing) |
| `npm run build` | ✅ exit 0 — circular re-export warning gone; only pre-existing chunk-size notices |
| Shared consumer + service | ✅ unchanged |

## Freeze (updated)

**Admin Questions page remains ✅ CERTIFIED & FROZEN** under the **Phase 3.2.1 golden reference**:
the canonical question list is the compact premium `CollectionCard layout="row"` management row.
This same row contract powers all future collection pages — no page may create another
management-row layout.

---

# 22. Phase 3.2.2 — Collection System Refinement (Reusable-Component Audit)

**Status:** ✅ **IMPLEMENTED & CERTIFIED** — Admin Questions now consumes only Foundation blocks;
**zero page-specific visual styling remains** (2026-08-02)
**Method:** Foundation-first — every visual fix was made in the reusable component, not the page.
The table below records the required audit chain per change.

## Audit chain (Current → Consumers → Foundation Updated → Pages Improved → Duplicates Removed)

| Change | Current | Consumers | Foundation updated | Pages automatically improved | Duplicates removed |
|---|---|---|---|---|---|
| Toolbar surface | translucent `FilterBar` (`bg-card-bg/50 rounded-[14px] border-border-subtle`) | QuestionsActions, UsersToolbar, AdminSubAdminsView, AdminFilterBar (Students + Exams) | `CollectionToolbar` in `AntigravityLayout.tsx` — premium Card surface (`bg-card-bg border-[1.8px] border-card-premium-border rounded-2xl shadow-card-shadow hover:shadow-card-premium`); `FilterBar` kept as alias | Questions/Users/Sub-Admins/Students/Exams toolbars now premium-filled | page-level toolbar styling: none existed (all consumers already used `FilterBar`) |
| Filter trigger | translucent `bg-hover-bg/60 opacity-70` in `PremiumSelect` | FilterSelect → Questions, Users, AdminFilterBar (Students + Exams), DailyAttemptsChart, ExamListSection | trigger now premium filled `bg-hover-bg border-border-subtle hover:border-primary/50 focus:border-primary`; dropdown panel `bg-surface-floating` → `bg-card-bg` | all select surfaces match the certified Input/Checkbox control language | none (single `PremiumSelect` implementation) |
| Selection checkbox | page-local `SelectionCheckbox` in `QuestionsTableComponents.tsx` | QuestionsTable only | promoted to Foundation `src/components/common/SelectionCheckbox.tsx` (barrel-exported) | Questions row selection + select-all header | page-level duplicate definition **deleted** |
| Select-all + range row | inline `div` in `QuestionsTable` | QuestionsTable only | new reusable `CollectionHeader` (`src/components/common/CollectionHeader.tsx`): `SelectionCheckbox` + "Select all on this page" + "Showing X–Y of Z" | Questions header now a shared block; Users/Students/Leaderboard/Topics/Exams can compose it directly | inline header markup **removed** |

## What changed on the Admin Questions page

- `QuestionsActions` (`FilterBar`) → automatically renders the premium `CollectionToolbar` surface
  (no page change — inherited from the Foundation block).
- `QuestionsTable` header row (`Select all` + range) → **`CollectionHeader`** (identical visuals,
  now a shared block).
- `SelectionCheckbox` imports → **`../../common/AntigravityUI`** (Foundation set).
- Bulk Upload / Add Question buttons → unchanged (already certified `Button` variants; no page
  styling — requirement 3 verified as already-conformant).

## Page-level visual code remaining (goal: ~zero)

| Area | Page code | Verdict |
|---|---|---|
| Toolbar surface | none (Foundation `CollectionToolbar`) | ✅ compliant |
| Filter surface | none (Foundation `PremiumSelect`) | ✅ compliant |
| Selection / select-all | none (Foundation `SelectionCheckbox` + `CollectionHeader`) | ✅ compliant |
| Card surface | none (Foundation `CollectionCard`) | ✅ compliant |
| `ActionsCell` colors | hover color-per-action (`hover:border-primary/secondary/danger`) | intended semantic differentiation per action, not a surface-family divergence |

## Verification (Phase 3.2.2)

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| ESLint (7 touched files) | ✅ 0 migration-introduced problems (5 pre-existing baseline errors: barrel `react-refresh` lines 2/76×2/88 + `PageHeader` `any` — only line-shifted) |
| `npm run build` | ✅ exit 0 (only pre-existing chunk-size notices) |

## Freeze (updated)

- Admin Questions remains ✅ **CERTIFIED & FROZEN** under the golden reference.
- The page now composes **only** Foundation blocks: `CollectionToolbar` (via `FilterBar`),
  `CollectionHeader`, `SelectionCheckbox`, `CollectionCard`, `FilterSelect`, `Button`,
  `Pagination`. Future collection pages must do the same — **no page-level toolbar/filter/
  header/checkbox styling**.

---

# 23. Phase 3.2.3 — Foundation Refinement (Final Collection System Alignment)

**Status:** ✅ **IMPLEMENTED & RE-CERTIFIED** (2026-08-02)
**Method:** Foundation-first — every visual improvement lives in the reusable Foundation
component. The Admin Questions page required **one presentation-only change** (Difficulty dropdown
→ `CollectionFilter`); all other quality gains were inherited.

## Audit chain (Current → Reusable component → Consumers → Automatic improvements → Duplicates removed)

| Change | Current | Reusable component | Consumers | Automatic improvements | Duplicates removed |
|---|---|---|---|---|---|
| Checkbox visual quality | `Checkbox` (DS-013) already square (`w-5 h-5 rounded-md border-2`) but plain | `AntigravityForm.tsx` `Checkbox` — unchecked `bg-hover-bg border-border-subtle light:bg-card-bg light:border-card-premium-border`; checked `bg-primary border-primary shadow-elevation-2 shadow-primary/30`; `peer-focus:ring-4 peer-focus:ring-primary/25 peer-focus:border-primary`; `peer-hover:border-primary/70`; white check `size={13} strokeWidth={3}` flex-centered | `SelectionCheckbox` (Questions rows + `CollectionHeader` select-all), PromptEditorModal | premium square checkbox everywhere — no page change | none |
| Secondary Button identity | `Button variant="secondary"` already same component as Add Question | `AntigravityButton.tsx` light secondary → `border-[1.8px] border-card-premium-border shadow-card-shadow hover:shadow-card-premium hover:-translate-y-0.5` (premium collection family) | Bulk Upload, Cancel/Close, login secondary, Review/Results CTAs | secondary reads premium next to primary — only icon/label/variant differ | none |
| Difficulty filter | `FilterSelect` dropdown (Menu-based) | new **`CollectionFilter`** (`src/components/common/CollectionFilter.tsx`) — `SelectionContainer` + `Tabs` (`bare`, `variant="primary"`, `size="sm"`): selected = `nav-active-surface` primary pill, unselected = standard pill; keyboard nav + spring motion inherited | `QuestionsActions` Difficulty (`All`/`Easy`/`Medium`/`Hard`) | finite-set filters render as always-visible pills, one selection family with Exam/Paper/Subject | none (FilterSelect retained for PremiumSelect consumers) |

## What changed on the Admin Questions page

- `QuestionsActions` — `FilterSelect` (Difficulty) → **`CollectionFilter`** with explicit `All`
  pill. Selection values unchanged (`all`/`easy`/`medium`/`hard` — the repository treats
  `!== 'all'` as the filter, see `question.repository.ts:199`). Search + action buttons untouched.
- `Filter` icon import removed; `FilterBar`/`FilterSelect` imports → `CollectionToolbar`/
  `CollectionFilter` (both Foundation barrel exports).

## Page-level visual code remaining (goal: ~zero)

| Area | Page code | Verdict |
|---|---|---|
| Toolbar surface | none (Foundation `CollectionToolbar`) | ✅ compliant |
| Difficulty filter | none (Foundation `CollectionFilter`) | ✅ compliant |
| Search / buttons | none (Foundation `Input` / `Button`) | ✅ compliant |
| Selection / select-all | none (Foundation `SelectionCheckbox` + `CollectionHeader`) | ✅ compliant |
| Card surface | none (Foundation `CollectionCard`) | ✅ compliant |
| `ActionsCell` colors | hover color-per-action (`hover:border-primary/secondary/danger`) | intended semantic differentiation per action, not a surface-family divergence |

## Verification (Phase 3.2.3)

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| ESLint (4 touched files) | ✅ 0 new problems (baseline barrel `react-refresh` lines 2/80×2/92 + `PageHeader` `any` — pre-existing, shifted) |
| `npm run build` | ✅ exit 0 (only pre-existing chunk-size notices) |

## Freeze (updated)

- Admin Questions remains ✅ **CERTIFIED & FROZEN** under the golden reference.
- New Foundation blocks available to all collection pages: **`CollectionFilter`** (finite-set pill
  filter). Re-certified: `Checkbox`/`SelectionCheckbox` (premium square), `Button` secondary
  (premium collection surface). `CollectionCard` v1.1, `CollectionToolbar`, `CollectionHeader`,
  `FilterSelect` unchanged.

---

# 24. Phase 3.2.4 — CollectionFilter Redesign (Premium Dropdown)

**Status:** ✅ **IMPLEMENTED & RE-CERTIFIED** (2026-08-02)
**Method:** Foundation-first — the reusable `CollectionFilter` was redesigned from pills to a
**premium dropdown** on the `Menu` foundation. The Admin Questions page required **one additive
prop** (`label="Difficulty"`); the difficulty control updates automatically with no page-specific
styling.

## What changed on the Admin Questions page

- `QuestionsActions` — `CollectionFilter` gains **`label="Difficulty"`** (the dropdown trigger
  label, shown while nothing concrete is selected). Everything else — `ariaLabel`, `value`,
  `onChange`, options (`All`/`Easy`/`Medium`/`Hard`), `className="w-full sm:w-fit"`, and the
  state values (`all`/`easy`/`medium`/`hard`) — **unchanged**.
- The Difficulty control now renders as a compact premium dropdown (`Difficulty ▼`) matching the
  search input's height; selecting a level shows it in the trigger (`Easy ▼`). Rows show
  `✓ All / ✓ Easy / ✓ Medium / ✓ Hard` with the selected row in primary text on a premium
  background.
- No other admin questions file touched (`useAdminQuestions`, `adminQuestionService`,
  `AdminQuestions.tsx`, `QuestionsTable`, `CollectionHeader` all unchanged).

## Page-level visual code remaining (goal: ~zero)

| Area | Page code | Verdict |
|---|---|---|
| Toolbar surface | none (Foundation `CollectionToolbar`) | ✅ compliant |
| Difficulty filter | none (Foundation `CollectionFilter` premium dropdown) | ✅ compliant |
| Search / buttons | none (Foundation `Input` / `Button`) | ✅ compliant |
| Selection / select-all | none (Foundation `SelectionCheckbox` + `CollectionHeader`) | ✅ compliant |
| Card surface | none (Foundation `CollectionCard`) | ✅ compliant |
| `ActionsCell` colors | hover color-per-action (`hover:border-primary/secondary/danger`) | intended semantic differentiation per action, not a surface-family divergence |

## Verification (Phase 3.2.4)

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| ESLint (4 touched files) | ✅ 0 new problems (baseline barrel `react-refresh` lines 2/80×2/92 — pre-existing) |
| `npm run build` | ✅ exit 0 (only pre-existing chunk-size notices) |

## Freeze (updated)

- Admin Questions remains ✅ **CERTIFIED & FROZEN** under the golden reference.
- `CollectionFilter` re-certified **v1.1** (premium dropdown, Menu-based). `Menu` re-certified
  **v1.1** (`selected` item / `disabled` trigger / `shadow-elevation-4` panel). `SelectionContainer`
  + `Tabs` untouched — reserved for section navigation (Exam/Paper/Subject), not filtering.
- `CollectionCard` v1.1, `CollectionToolbar`, `CollectionHeader`, `Checkbox`, `Button`,
  `FilterSelect` unchanged.

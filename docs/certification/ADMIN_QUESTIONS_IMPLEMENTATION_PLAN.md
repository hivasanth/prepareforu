# Phase 3.1 — Admin Questions Implementation Plan (Final Structural Certification)

**Status:** ✅ **APPROVED WITH ENHANCEMENTS** — implementation may begin
**Page:** `src/pages/admin/AdminQuestions.tsx` + `src/components/admin/questions/**`
**Date:** 2026-08-02
**Audit:** `ADMIN_QUESTIONS_PAGE_AUDIT.md` (33 findings; 17 in-scope)
**Rule:** Implement = certified Design System + tokens + a11y/security/perf/cleanup ONLY. **No**
behavioral, prop, event, or data-contract changes to shared components (`SingleQuestionModal`,
`BulkUploadModal`, `QuestionForm`, `UploadProgressOverlay`, `useBulkUpload` public surface) because
`AdminUpload.tsx` co-consumes them in a later phase. `adminQuestionService` is Phase 6 LOCKED.

**Objective:** This is the **final structural certification** of the Admin Questions page. After this
phase the page requires **no further architecture / Design System / accessibility / security /
lifecycle cleanup** — future work is feature-only.

---

# Approved Execution Order (12 steps)

```
 1. Capture Visual Baseline
 2. Reuse Certified Components
 3. Fix Accessibility
 4. Fix Security
 5. Unify Loading / Empty / Error States
 6. Improve Performance
 7. Remove Confirmed Dead Code
 8. Verification (TypeScript · Build · ESLint)
 9. Visual Comparison Against Baseline
10. Recalculate Design System Coverage
11. Generate Implementation Report
12. Certify and Freeze the Page
```

---

# Mandatory Certification Framework (16 requirements)

Every requirement is a hard gate for this phase. Evidence lives in the implementation report.

## 1. Component Reuse First (highest priority)

Every implementation item must answer before editing: *does an identical certified implementation
already exist (User Panel / Authentication / Shared Foundation)?* Never create a visual approximation.
Each item documents: Current → Existing reusable → Selected component → Duplicate code that disappears.

| Finding | Current | Existing Reusable | Selected | Duplicate Removed |
|---|---|---|---|---|
| C5 desktop table wrapper | raw `div.border.rounded-3xl...` | `Card` | `Card` premium surface | raw wrapper |
| C6 mobile card rows | raw `div.border.rounded-2xl` | `Card` subtle | `Card` subtle | raw row div |
| C7 index chip | raw `span` | `IconBadge` | `IconBadge` | raw span |
| C8 Q-monogram | raw `bg-primary/10` circle | `PremiumIconContainer` | `PremiumIconContainer` | raw monogram div |
| C9 SrNumber | raw `span` | token typography | `Body sm`/muted token | raw span |
| A1 checkbox | `SelectionCheckbox` (unlabeled) | `Checkbox` | certified `Checkbox` (or apply `label`) | custom unchecked input |
| A2 actions | `IconButton title=` | `aria-label` golden | `aria-label` | `title` attr |
| C10 header pill | raw `div` | `Badge` | `Badge` | raw pill div |
| C11 JSON chip | raw `div` | `Badge` | `Badge` | raw chip div |
| C12 stat tiles | raw `div` ×4 | `MetricBlock` | `MetricBlock` / stat-card tokens | raw tiles |
| C13 instructions panel | raw `div` | `Card` subtle | `Card` subtle | raw panel div |
| A3 PromptEditorModal | raw modal | `AdminModal` | `AdminModal` | raw dialog markup |
| A4/C15 overlay | raw ring + surface | `ProgressBar` + overlay pattern | ARIA + token surface | raw ring (visual retained) |

## 2. Complete Page Lifecycle Certification

Every feature must complete the lifecycle `Loading → Success → Empty → Error → Retry → Recovery → Completion`
with **no blank screens, no infinite loading, no silent failures, no dead-ends, no missing recovery**.

| Feature | Loading | Success | Empty | Error | Retry | Recovery | Completion | Verdict |
|---|---|---|---|---|---|---|---|---|
| List fetch | GridSkeleton | rows | EmptyState | Alert | refetch (SWR) | filter change | rows render | ✅ |
| Search/filter | skeleton | filtered rows | EmptyState | Alert | refetch | clear filters | rows render | ✅ |
| Pagination | skeleton | next page | hasMore bound | Alert | refetch | prev/next | bounded | ✅ |
| Single create | Button spinner | toast + refetch | — | modal Alert | fix fields | re-submit | modal closes | ✅ |
| Single edit | Button spinner | toast + refetch | — | modal Alert | retry | re-submit | modal closes | ✅ |
| Delete | Confirm "Deleting…" | toast + refetch | — | page Alert | retry | re-confirm | row removed | ✅ |
| Bulk upload | JsonTab spinner → overlay | success summary | empty preview | per-item Alert | re-upload valid | fix JSON | overlay closes | ✅ |
| Prompt edit | spinner | toast | — | modal Alert | retry | re-submit | modal closes | ✅ |

## 3. Security Certification (expanded pipeline)

| Layer | Checkpoint | Evidence | Status |
|---|---|---|---|
| Route Guard | `/admin/questions` requires auth | `AuthGuard` (`Guards.tsx`) | ✅ |
| Role Guard | admin-only | `RoleGuard allowedRoles={['admin']}` | ✅ |
| Session validation | auth reload + `GuardLoader` | `AuthContext` | ✅ |
| Session expiry / refresh | refresh on 401 path, token refresh in auth flow | `AuthContext` + service retry | ✅ documented |
| Permission validation | `isAdmin(user)` UI gates (create/delete) | `handleDeletePrompt`, create handler | ✅ (+ B8 gap fixed) |
| Request validation | `sanitizeParam` realm + maxLen 100 | `useAdminFilters` | ✅ |
| Zod validation | `SingleQuestionSchema`, `BulkQuestionSchema`, `promptTemplateSchema` | validations/ | ✅ |
| Service validation | `ensureRole` on every mutation | `adminQuestionService` | ✅ |
| Repository validation | scoped writes (`upsertTopic`, `upsertPrompt`, `deletePromptById`) | repositories | ✅ |
| RLS posture | DB-level policy; service trusts role claim after `ensureRole` | documented (DB layer) | ✅ documented |
| Request IDs | `generateRequestId` on service requests | service | ✅ |
| Audit logging | `logInfo`/`logError` + metric on mutations | logger | ✅ |
| Error leakage prevention | generic `asError` messages; no internals surfaced | service + UI | ✅ |
| Unauthorized recovery | 401 → auth refresh → retry | service retry + auth | ✅ documented |
| Client-authority risk | none; service is source of truth | — | ✅ |
| Hidden logic | none undocumented | — | ✅ |

## 4. Loading Language Certification (one language)

| Loading | Component | Golden | Status |
|---|---|---|---|
| Route guard | `GuardLoader` | Shared Foundation | ✅ |
| Route lazy | `Suspense` + `LoadingSkeleton` | User Panel | ✅ |
| Table | `GridSkeleton count={5}` | User Panel | ✅ |
| Buttons | `Button loading` | User Panel | ✅ |
| Delete | `ConfirmModal` text-swap | User Panel | ✅ |
| Upload | `UploadProgressOverlay` (ring) | `ProgressBar` ARIA parity | ⚠️ fixed (A4: ARIA only, visual retained) |

**One language:** skeleton + certified `Button loading` + certified progress. No duplicate spinners.

## 5. Empty State Certification (one pattern)

| Scenario | Pattern | Status |
|---|---|---|
| No questions (filtered/unfiltered) | `EmptyState` | ✅ |
| No search results | table `null` → `EmptyState` | ✅ |
| Empty preview (no parsed rows) | `EmptyState` | ✅ |
| Empty upload (no file) | tab prompt + `EmptyState` | ✅ |
| Empty selection (0 selected) | BulkActionBar hidden | ✅ |
| Deleted all records | `EmptyState` (post-refetch) | ✅ |
| No permissions | impossible (route guard); guard-loader only | ✅ |

## 6. Error State Certification (one pattern)

| Requirement | Status |
|---|---|
| Visual consistency | all errors = certified `Alert` (error variant) |
| Retry support | every surface has a retry/re-submit path |
| Recovery path | every error transitions to recovery (Area 2) |
| Accessibility | `Alert` → `role="alert"` for errors, `role="status"` otherwise |
| Logging | `logError` + request ID on every service failure |
| Message consistency | generic service messages, no internals |
| No silent failures | every catch path surfaces to an `Alert`/toast |

## 7. Animation Certification

| Animation | Where | Certified Equivalent | Verdict |
|---|---|---|---|
| `animate-in fade-in slide-in-from-bottom-4` (list wrapper) | QuestionsTable | identical in golden chart area | ✅ reuse |
| `animate-in shake` (JsonTab validation) | JsonTab | certified pattern | ✅ reuse |
| `animate-in` (tabs/filters) | AdminSelectionTabs | User Panel | ✅ reuse |
| `hover:scale`/`active:scale` (AI cards) | AIToolCards | retained exception (C14, Defer) | 📌 exception |
| `hover` on certified components | all | component-enforced | ✅ |
| shimmer (GridSkeleton/LoadingSkeleton) | loading | User Panel | ✅ |
| section reveal (framer-motion) | AdminSelectionTabs | User Panel | ✅ |
| custom SVG ring progress | overlay | no animation (static ring) | ✅ |

No custom animation is duplicated beyond the retained AI-card exception.

## 8. Theme Certification (light + dark)

| Surface | Light (tokens) | Dark (tokens) | Golden parity | Status |
|---|---|---|---|---|
| Page bg | `bg-page-bg` | `bg-page-bg` | User Panel | ✅ |
| Cards (Card subtle/premium) | token card | token card | User Panel | ✅ |
| Bulk bar | `ancient-card` light / `bg-card-bg` dark + overrides | — | certified-consistent | 📌 retained (C17) |
| Modals (AdminModal) | token surfaces | token surfaces | User Panel | ✅ |
| Upload overlay | `bg-card-bg/95 backdrop-blur-md` | same | overlay pattern | ✅ tokens |
| Table (DataGrid) | token | token | User Panel | ✅ |
| Badges (subject/difficulty) | `secondary` + `success/warning/danger` | same | User Panel | ✅ |
| Toast | token | token | Shared Foundation | ✅ |

No theme-only custom values beyond the retained BulkActionBar override.

## 9. Design Token Certification

Every raw value on the page is inventoried in Audit Area 6 (arbitrary values list). Implementation
replaces token-adjacent raws with their certified token equivalent; **nothing is replaced before its
certified equivalent is identified**. Post-implementation sweep re-runs the hardcoded-color check
(`#hex | rgba() | hsl()`) and must report **0 hits** in page files (guard `#080810` is infra, Defer).

## 10. Accessibility Certification (expanded)

| Checkpoint | Page Status | Implemented |
|---|---|---|
| Keyboard navigation | certified components | ✅ |
| Focus order | DataGrid / modals | ✅ |
| Focus restoration | `AdminModal` (`previouslyFocusedRef`) | ✅ + PromptEditorModal (A3) |
| Focus trap | `AdminModal` FocusTrap | ✅ + PromptEditorModal (A3) |
| Escape handling | `AdminModal` | ✅ + PromptEditorModal (A3) |
| Screen reader support | aria labels | ✅ + A1/A2/A4/A6/A7 |
| `aria-label` icon-only buttons | IconButton | ✅ (A2) |
| Dialog focus restore | AdminModal | ✅ (A3) |
| Loading `role="status"` | Button/overlay | ✅ (A4 `progressbar`) |
| Error `role="alert"` | Alert | ✅ |
| Table headers | DataGrid | ✅ |
| Reduced motion | app-wide `prefers-reduced-motion` pattern | 📌 R1 (recommendation) |

## 11. Business Logic Certification (one source of truth)

| Duplicate | Fix | Status |
|---|---|---|
| `PAGE_SIZE` (page + hook) | single const export (B5) | ✅ |
| `questionToDelete` (unused) | remove (B3/C2) | ✅ |
| `SelectionCheckbox.label` (unused) | apply/remove (C1) | ✅ |
| delete error protocol (return vs throw) | unify (B7) | ✅ |
| `isUploading` / `parsedData` / `error` | **Deferred** (shared-contract B1/B2/B4 — AdminUpload co-consumer) | 📌 deferred |

## 12. Performance Certification

| Optimization | Scope | Status |
|---|---|---|
| Lazy route | already | ✅ |
| Lazy modals | P2 (React.lazy both modals) | ✅ implement |
| Memoize wizard panels | P4 | ✅ implement |
| `useMemo(currentPrompt)` | P5 | ✅ implement |
| Re-render audit | cells already memoized | ✅ |

Optimization opportunities (beyond mandatory): R4–R12 in Audit Area 23 — documented separately.

## 13. Dead Code Certification (confirmed-safe only)

| Item | Confirmation | Status |
|---|---|---|
| `questionToDelete` export | grep-verified unused | ✅ remove |
| `SelectionCheckbox.label` prop | unused | ✅ apply/remove |
| `ErrorState`/`LoadingOverlay` in shared surfaces | NOT page-scoped; still used elsewhere | 📌 defer to repo sweep (R12) |

## 14. Shared Component Safety Certification

| Component | Consumers | Safe internal changes | Unsafe public changes | Future owner phase |
|---|---|---|---|---|
| `SingleQuestionModal` | AdminQuestions, AdminUpload | DS/token/a11y/security/perf/cleanup | props/events/data contract | AdminUpload phase |
| `BulkUploadModal` | AdminQuestions, AdminUpload | same + `onIsUploadingChange` untouched | signature | AdminUpload phase |
| `QuestionForm` | both modals | DS/token/a11y/cleanup | field schema/submit | AdminUpload phase |
| `UploadProgressOverlay` | BulkUploadPanel (both pages) | ARIA + tokens only | visual redesign | AdminUpload phase |
| `useBulkUpload` | BulkUploadPanel (feature-local) | internal cleanup + `questionToDelete` | `isUploading`/`parsedData`/`error` | AdminUpload phase |
| `adminQuestionService` | page hooks | none | any contract (Phase 6 LOCKED) | — |

**Verification:** `AdminUpload.tsx` imports at `:6-7,40,51`; post-implementation `tsc -b` must pass with
identical props at those call sites.

## 15. Design System Coverage Score (recalculated post-implementation)

| Category | Target | Method |
|---|---|---|
| Component Reuse | 100% | element mapping (Area 21) recompute |
| Design Tokens | 100% | hardcoded-sweep = 0 in page files |
| Accessibility | 100% | all in-scope a11y findings closed |
| Security | 100% | pipeline table all ✅ |
| Loading | 100% | one-language check |
| Error States | 100% | one-language check |
| Empty States | 100% | one-pattern check |
| Responsive | 100% | breakpoint pass |
| Theme Support | 100% | light/dark parity |

Retained exceptions (explicitly documented, not "coverage loss"): `H1 sr-only`, AI tool cards,
BulkActionBar, Telugu panel, Guard bg (infra).

## 16. Final Page Freeze

Post-implementation certifies: Visual Language · Component Composition · Design Tokens ·
Accessibility · Security · Performance · Business Logic · Responsive Behaviour · Theme Support.
After freeze the page requires **no further structural cleanup**; any future architectural change
must begin a new certification phase. Freeze is recorded in the implementation report.

---

# Issue Register (implementation order)

| # | Finding | Current → Target | Golden | Risk | Verification |
|---|---|---|---|---|---|
| 1 | A1 | unlabeled `SelectionCheckbox` → certified `Checkbox` w/ label | User Panel | Low | tsc + build |
| 2 | A2 | `title=` → `aria-label=` | User Panel | Trivial | tsc + build |
| 3 | A6/A7 | decorative monogram/chip → `aria-hidden` | User Panel | Low | tsc + build |
| 4 | C5 | wrapper → `Card` premium | User Panel | Low | tsc + build + baseline |
| 5 | C6 | row → `Card` subtle | User Panel | Low | tsc + build |
| 6 | C7/C8/C9 | chip/monogram/sr-number → `IconBadge`/`PremiumIconContainer`/token | User Panel | Low | tsc + build |
| 7 | C10/C11 | pill/json chip → `Badge` | User Panel | Low | tsc + build |
| 8 | C12 | stat tiles → `MetricBlock`/stat-card | User Panel | Low | tsc + build |
| 9 | C13 | instructions panel → `Card` subtle | User Panel | Low | tsc + build |
| 10 | A3/C16 | PromptEditorModal → `AdminModal` | Shared Foundation | Medium | tsc + build + manual focus/Escape |
| 11 | A4/C15 | overlay ring ARIA + token surface | `ProgressBar`/overlay | Low | tsc + build |
| 12 | B8 | delete `isAdmin` gate | `handleDeletePrompt` | Low | tsc + build |
| 13 | B7 | delete error protocol unify | guard pattern | Low | tsc + build |
| 14 | B3/C2 | remove `questionToDelete` | — | Low | tsc + build |
| 15 | C1 | apply/remove label prop | — | Low | tsc + build |
| 16 | B5 | single `PAGE_SIZE` | hook export | Trivial | tsc + build |
| 17 | P2 | lazy modals | User Panel lazy | Medium | tsc + build + route smoke |
| 18 | P4/P5 | memoize panels + `useMemo` | React memo | Low | tsc + build |

**Deferred (documented):** B1, B2, B4 (shared-contract), B6 (service locked), C14 (AI cards), C17
(BulkActionBar), C4 (GuardLoader bg infra).

---

# Shared-Component Safety Notes

- `SingleQuestionModal`, `BulkUploadModal`, `QuestionForm`, `UploadProgressOverlay`: **internal
  (token/DS/a11y/ARIA/cleanup) only**. No prop/event/data-contract changes.
- `useBulkUpload`: public return unchanged except removing unused `questionToDelete` (grep-verified no
  consumer). `isUploading`/`parsedData`/`error` contract untouched.
- `adminQuestionService`: zero changes (Phase 6 LOCKED). B6 deferred.
- Behavior freeze: page must be visually consistent with baseline except intended token/a11y deltas.

---

# Rollback

Each item is an isolated diff; revert per-file if baseline comparison fails. No DB, service, or
contract migration. Baseline stored at `docs/certification/baselines/`.

---

# Approval Gate (passed ✅)

User approved **with enhancements** — all 16 mandatory requirements above are now binding for this
phase. Implementation starts at Step 1 (Visual Baseline capture).

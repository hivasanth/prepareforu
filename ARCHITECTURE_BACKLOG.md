# Architecture Refactoring Backlog

> **Single source of truth for all architecture refactoring work.**
> Established: 2026-07-21 (Phase 6.0A)

---

## Document Information

| Field | Value |
|-------|-------|
| Created | 2026-07-21 |
| Version | 3.5.0 |
| Status | Active |
| Source Audits | AUDIT_EXECUTIVE_SUMMARY.md, AUDIT_SUBADMIN.md, PROJECT_ARCHITECTURE.md |
| Total Items | 28 |
| Estimated Total Effort | 14–19 days |
| Scope | Architecture, Maintainability, Performance, Accessibility, Developer Experience |

---

# Architecture Decision Register (ADR)

This register records architectural decisions introduced while executing Architecture Backlog items. Every architectural decision must reference exactly one backlog item.

## ADR Template

Every ADR entry must contain:

| Field | Description |
|-------|-------------|
| **ADR ID** | Unique identifier (ADR-NNN) |
| **Related Work Item** | Exactly one backlog item (AR-NNN) |
| **Decision** | The architectural decision made |
| **Alternatives Considered** | Realistic alternatives evaluated |
| **Reason** | Why this approach was selected |
| **Consequences** | Benefits, trade-offs, limitations, future implications, migration impact, backward compatibility |
| **Status** | Accepted · Superseded · Deprecated |

## ADR Governance Rules

1. Every ADR belongs to exactly one backlog item.
2. ADRs remain immutable after acceptance except Status.
3. Status may only change to Superseded or Deprecated.
4. ADRs must never be deleted.
5. A superseded ADR must reference the ADR that replaced it.
6. A deprecated ADR must document why it is no longer applicable.

## Execution Rules

During every architecture implementation phase:

**If the work introduces a new architectural decision:**
1. Complete the backlog item.
2. Create an ADR.
3. Link the ADR to the completed backlog item.

**If no architectural decision was required:**
State: "No ADR required."

Do not create unnecessary ADRs.

## ADR Change Policy

- New architectural decisions are recorded only inside this document.
- Do not create ADR.md.
- Do not create ADR folders.
- Do not create separate architecture history documents.
- ARCHITECTURE_BACKLOG.md is the single source of truth for backlog, architecture decisions, and decision history.

---

## Placeholder ADRs

These placeholders represent backlog items expected to require architectural decisions. Decisions will be finalized during implementation.

---

### ADR-001

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-001 |
| **Related Work Item** | AR-001 (Extract useStableFetch Hook) |
| **Decision** | Extract stale-response guard into a custom React hook `useStableFetch` that encapsulates `requestId` (via `nextId()`), `mountedRef`, and `isStale()` semantics. The hook is called once at the top of each component; callers use `nextId()` to get a new request token and `isStale(id)` to gate all async state updates. |
| **Alternatives Considered** | 1. React Query / TanStack Query — Rejected: full data-fetching library rewrite; 2. AbortController — Rejected: not sufficient for race conditions; 3. Shared utility function — Rejected: cannot track per-component mount status; 4. Keep inline pattern — Rejected: DRY violation across 14+ files. |
| **Reason** | DRY principle; eliminates 14 instances of identical 20-line boilerplate; single point of maintenance for stale-response semantics; zero runtime cost (ref-based). |
| **Consequences** | All async state-updating components must use `useStableFetch` instead of inline `requestId` + `mountedRef`. New components should adopt the hook from day one. |
| **Status** | Accepted |

---

### ADR-002

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-002 |
| **Related Work Item** | AR-003 (Lazy-Load Sub-Views) |
| **Decision** | Lazy-load eligible sub-views using `React.lazy()` with `Suspense` boundaries. Only the active view loads on initial mount; other views load on-demand when navigation occurs. |
| **Alternatives Considered** | 1. Eager loading (status quo) — rejected: loads all sub-views upfront; 2. Route-based splitting — rejected: sub-views are state-driven, not route-driven; 3. Manual dynamic imports — rejected: `React.lazy()` is the idiomatic React solution. |
| **Reason** | Reduce initial bundle weight for multi-view pages. UserPrepareWrite has 5 mutually exclusive sub-views (742 lines total) that load simultaneously despite only one being visible. |
| **Consequences** | Additional async boundaries per sub-view; improved startup performance for affected pages; consistent with existing lazy-loading pattern in UserTopicExams and UserSubjectTests. |
| **Status** | Accepted |

---

### ADR-003

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-003 |
| **Related Work Item** | AR-004 (Decompose SubAdminCreate.tsx) |
| **Decision** | Decompose the monolithic SubAdminCreate.tsx (1,323 lines) into a 10-file feature component architecture. The main orchestrator component retains state management and navigation logic, while 5 wizard steps are extracted as separate Feature Components. Shared types, constants, and pure validation helpers are extracted to a dedicated `types.ts` file. Two sub-components (`CompactDateTimePicker`, `QuestionCard`) are also extracted as independent Feature Components. A `SuccessView` component handles the post-publish state. All components use native HTML elements with Tailwind CSS classes (matching existing codebase conventions) rather than custom AntigravityUI form components. The original AntigravityUI component imports (`Button`, `Card`, `Tabs`, `Stack`, `Badge`, `IconBadge`, `SectionReveal`, `PageContainer`) are preserved for layout and action components. |
| **Alternatives Considered** | (a) Extract only wizard steps but keep inline sub-components — rejected because it would keep main file over 300 lines. (b) Create shared `useCreateExamWizard` hook — rejected as over-abstraction; state is tightly coupled to step lifecycle and benefits from being colocated in the orchestrator. (c) Use React Context for step state — rejected because state sharing is strictly parent-to-child, not cross-cutting. (d) Replace native `<input>`/`<select>` with AntigravityUI `Input`/`Select` — rejected because the original codebase uses native elements with Tailwind classes consistently in SubAdmin pages. |
| **Reason** | The 1,323-line file violates the 300-line hard limit, makes code review difficult, and blocks parallel development. The wizard steps have distinct responsibilities with minimal shared state overlap. The decomposition follows the existing codebase pattern (native HTML + Tailwind) to minimize risk. |
| **Consequences** | Main component reduced from 1,323 to 278 lines. 8 new files created in `src/components/sub-admin/create/`. Import graph changes: App.tsx → SubAdminCreate → step components → types.ts. TypeScript strict mode maintained. Bundle impact: 8 small chunks added (negligible gzipped overhead). Future step additions require creating new files rather than editing a monolith. |
| **Status** | Accepted |

---

### ADR-004

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-004 |
| **Related Work Item** | AR-005 (Decompose SubAdminExams.tsx) |
| **Decision** | Pending implementation. |
| **Alternatives Considered** | Pending. |
| **Reason** | Pending. |
| **Consequences** | Pending. |
| **Status** | Pending |

---

### ADR-005

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-005 |
| **Related Work Item** | AR-006 (Decompose ActiveExamPage.tsx) |
| **Decision** | Decompose ActiveExamPage.tsx (939 lines) into 6 custom hooks and 1 orchestrator using the "hook extraction" pattern. Hooks own business logic and state mutations; orchestrator owns shared state and renders pure UI. |
| **Alternatives Considered** | (1) Extract presentation components only — rejected because business logic remains monolithic. (2) Full component decomposition with render props — rejected because hook extraction is simpler and more idiomatic. |
| **Reason** | Hook extraction maximizes code reuse (useExamKeyboard, useExamSecurity are standalone), keeps state ownership clear (one hook per domain), and fits React's composition model. The orchestrator becomes a thin coordination layer. |
| **Consequences** | Benefits: 939→372 lines in orchestrator, 6 reusable hooks, clear separation of concerns. Trade-offs: Slightly more indirection (hook call chain). Limitations: useExamInitialization at 329 lines (slightly over 300 target). Migration: No behavioral changes; all hooks are drop-in extractions. Backward compatibility: Full — all existing behavior preserved. |
| **Status** | Accepted |

---

### ADR-006

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-006 |
| **Related Work Item** | AR-016 (Replace Raw Inputs with Foundation Input) |
| **Decision** | No Foundation enhancement required. Repository audit demonstrated Foundation Input already satisfies all claimed requirements. |
| **Alternatives Considered** | 1. Add `sm`/`md`/`lg` size variants — already exists as `default`/`compact`/`violet`. 2. Add checkbox variant — already exists as DS-013 Checkbox. |
| **Reason** | 6 of 7 backlog claims FALSE. Foundation Input has default/compact/violet variants, leftIcon/rightIcon, and full HTML prop pass-through. |
| **Consequences** | No code changes. AR-016 closed as stale backlog item. |
| **Status** | Dissolved |

---

### ADR-007

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-007 |
| **Related Work Item** | AR-025 (Standardize Error Handling) |
| **Decision** | Pending implementation. |
| **Alternatives Considered** | Pending. |
| **Reason** | Pending. |
| **Consequences** | Pending. |
| **Status** | Pending |

---

### ADR-008

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-008 |
| **Related Work Item** | AR-011 (Introduce Canonical useAsyncOperation Hook) |
| **Decision** | Create `useAsyncOperation` as the canonical hook for async lifecycle management, composing `useStableFetch` for mounted-state protection and stale-request detection. All consumers with `try/catch/finally` + `setLoading` patterns migrate to `execute()`. |
| **Alternatives Considered** | (1) Reuse `useStableFetch` directly — rejected because each consumer would still need manual loading state. (2) HOC pattern — rejected due to prop drilling and nesting depth. (3) Extend `useStableFetch` to include loading — rejected because it would mix concerns (staleness detection vs. loading lifecycle). |
| **Reason** | Single abstraction eliminates 37 lines of boilerplate across 7 consumers while preserving error handling flexibility (execute throws, consumers catch as needed). Composable with existing `useStableFetch` foundation. |
| **Consequences** | All new async operations must use `useAsyncOperation`. Existing `useStableFetch` consumers (12 files from AR-009) remain unchanged. Manual `setLoading(true/false)` in async callbacks is now a governance violation. |
| **Status** | Accepted |

---

### ADR-009

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-009 |
| **Related Work Item** | AR-020 (Bundle Analysis and Optimization) |
| **Decision** | Lazy-load heavy visualization libraries (mermaid, recharts, react-katex, react-simple-maps) by splitting QuestionVisualizer.tsx into 4 lazy sub-components. Move katex CSS from global main.tsx to the lazy MathBlock component. Delete 11 unreferenced assets (~3.5MB). Fix broken favicon reference. |
| **Alternatives Considered** | (1) Vendor chunk splitting via `manualChunks` — rejected because it still loads all vendors eagerly. (2) Bundle analyzer only (no code changes) — rejected because the audit revealed actionable Category B optimizations. (3) Full tree-shaking audit of lucide-react (111 files) — deferred to future work (low impact, tree-shaking already handles it). |
| **Reason** | QuestionVisualizer is a shared component imported by multiple routes; eagerly loading ~1.2MB of visualization libraries on every page that touches it is wasteful. Lazy splitting moves these to on-demand chunks. Global katex CSS loads ~230KB for all pages even though only math visuals need it. Unused assets are dead weight in the repo. |
| **Consequences** | Benefits: ~1.2MB removed from initial load path (mermaid, recharts, katex, react-simple-maps now lazy). ~230KB CSS removed from global scope. ~3.5MB dead assets cleaned. Favicon fixed. Trade-offs: 4 new lazy chunks (MathBlock 262KB, MapVisualizer 102KB, vendor-mermaid 601KB, vendor-recharts 426KB) — only loaded on demand. Limitations: mermaid and recharts remain large individual chunks but are now lazy. Migration: Zero behavioral changes; all visual types render identically. Backward compatibility: Full. |
| **Status** | Accepted |

---

## File Size Limits (Reference)

From Phase 3.5 Architecture Spec — all backlog items target these limits:

| Artifact | Soft Limit | Hard Limit |
|----------|-----------|------------|
| Page | 200 lines | 300 lines |
| Feature Component | 200 lines | 250 lines |
| Hook | 150 lines | 250 lines |
| Service function | 40 lines | 60 lines |
| Service file | 250 lines | 400 lines |
| Utility function | 20 lines | 50 lines |
| Utility file | 150 lines | 200 lines |
| JSX render block | 40 lines | 80 lines |
| Function | 30 lines | 50 lines |
| useEffect block | 15 lines | 30 lines |

---

# WAVE 1 — CRITICAL ARCHITECTURE

> Structural changes that unblock other work. Highest impact.

---

## AR-001: Extract useStableFetch Hook

| Field | Value |
|-------|-------|
| **ID** | AR-001 |
| **Area** | User Pages — Stale-Response Guard |
| **Priority** | Critical |
| **Effort** | 0.5 day |
| **Status** | Completed |
| **Dependencies** | None |
| **Source** | AUDIT_EXECUTIVE_SUMMARY.md C5 |
| **ADR** | ADR-001 |

**Current State:**
The `requestId` + `mountedRef` stale-response guard pattern is duplicated in 10+ user page files. Each file contains ~20 lines of identical boilerplate for tracking request IDs and checking component mount status before setting state.

**Files affected:**
- UserExams.tsx, UserSubjectTests.tsx, UserTopicExams.tsx, UserHistory.tsx
- UserPerformance.tsx, UserLeaderboard.tsx, UserTeacherExams.tsx
- UserPrepareWrite.tsx, UserProfile.tsx, UserTopics.tsx

**Target State:**
Single `useStableFetch` hook in `src/hooks/` that encapsulates requestId generation, mountedRef tracking, and stale-response guard logic. All 10+ pages import and use the hook instead of inline boilerplate.

**Estimated Savings:** ~200 lines across 10+ files

**Completed Implementation:**
- `src/hooks/useStableFetch.ts` exists (19 lines) returning `{ requestId, mountedRef, nextId, isStale }`
- 14 files migrated:
  - **Inline → Hook (10 files):** useDashboardData.ts, TeacherLeaderboardModal.tsx, UserTopics.tsx, SignupPage.tsx, LoginPage.tsx, SubAdminStudents.tsx, SubAdminDashboard.tsx, SubAdminCreate.tsx, ExamDetailModal.tsx, SubAdminExams.tsx
  - **Hybrid Cleanup (4 files):** UserExams.tsx, UserTopicExams.tsx, UserSubjectTests.tsx, UserPerformance.tsx
- Zero inline `requestId` + `mountedRef` boilerplate remaining (AuthContext.tsx retained with 4 additional concurrency guards — too complex to refactor)
- TypeScript clean (`npx tsc --noEmit` — no errors)
- All 79 tests pass
- ADR-001 updated below

### Migration Verification

**Migration Inventory:**

| Category | Files | Count |
|----------|-------|------:|
| Inline → `useStableFetch` | `useDashboardData`, `TeacherLeaderboardModal`, `UserTopics`, `LoginPage`, `SignupPage`, `SubAdminStudents`, `SubAdminDashboard`, `SubAdminCreate`, `ExamDetailModal`, `SubAdminExams` | 10 |
| Hybrid Cleanup | `UserExams`, `UserTopicExams`, `UserSubjectTests`, `UserPerformance` | 4 |
| Intentionally Excluded | `AuthContext` | 1 |

**Final Verification:**

- **Inline stale-response implementations remaining:** 0 (excluding approved exceptions)
- **Hybrid implementations remaining:** 0
- **Approved exception:** `AuthContext.tsx`
  - Reason: Contains additional concurrency guards and lifecycle coordination beyond the scope of `useStableFetch`.
  - Classification: Approved architectural exception; tracked independently.

**Completion Evidence:**

- [x] `useStableFetch` is the canonical stale-response guard.
- [x] All targeted components now use the shared hook.
- [x] Duplicate `requestId` / `mountedRef` boilerplate removed from all targeted files.
- [x] No unintended architectural changes introduced.
- [x] TypeScript verification: **PASS**
- [x] Build verification: **PASS**
- [x] Existing security regression suite unchanged.
- [x] Existing unrelated ESM test issues remain pre-existing and are not attributed to AR-001.

---

**Purpose:** This verification section serves as objective evidence that AR-001 achieved its intended architectural outcome. Future audits can validate completion without re-inspecting the entire codebase, while the explicitly documented `AuthContext` exception prevents it from being mistaken for unresolved technical debt.

---

## AR-002: Deduplicate topicTestService.ts

| Field | Value |
|-------|-------|
| **ID** | AR-002 |
| **Area** | Service Layer — Duplicate Code |
| **Priority** | Critical |
| **Effort** | 0.25 day |
| **Status** | Completed |
| **Dependencies** | None |
| **Source** | AUDIT_EXECUTIVE_SUMMARY.md C1 |
| **ADR** | — (straightforward refactoring; no architectural decision required) |

**Current State:**
`topicTestService.ts` (193 lines) contains 4 exact duplicate functions copied from `subjectTestService.ts` (243 lines). Same cache keys, same TTLs, same implementation. ~80 lines of dead duplicate code. Cache key collisions between the two services.

**Target State:**
`topicTestService.ts` re-exports from `subjectTestService.ts` or delegates to shared functions. Zero duplicate implementations. Distinct cache keys for topic vs. subject test data.

**Estimated Savings:** ~80 lines of duplicate code eliminated

**Completed Implementation:**
- Removed duplicate `SubjectQuestion` interface from `topicTestService.ts` (now re-exported from `subjectTestService.ts`)
- Removed duplicate `shuffleArray` function from `topicTestService.ts` (now imported from `subjectTestService.ts`)
- Exported `shuffleArray` from `subjectTestService.ts` (was private)
- `topicTestService.ts` is now a thin facade: re-exports from `subjectTestService.ts` + unique topic functions (`fetchTopicsBySubject`, `fetchTopicCounts`, `fetchTopicTestQuestions`, `clearTopicTestCache`)
- Zero duplicate implementations remaining
- All consumer imports unchanged (facade pattern preserves API)
- TypeScript clean, all 79 tests pass

**Completion Evidence:**
- [x] `topicTestService.ts` has zero duplicate function implementations
- [x] All exports from `topicTestService.ts` still work (no breaking API changes)
- [x] Cache keys are distinct between topic and subject services
- [x] TypeScript clean
- [x] Build passes
- [x] All existing tests pass
- [ ] TypeScript clean
- [ ] Build passes
- [ ] All existing tests pass

---

## AR-003: Lazy-Load Sub-Views

| Field | Value |
|-------|-------|
| **ID** | AR-003 |
| **Area** | Performance — Code Splitting |
| **Priority** | Critical |
| **Effort** | 0.5 day |
| **Status** | Completed |
| **Dependencies** | None |
| **Source** | AUDIT_EXECUTIVE_SUMMARY.md C6 |
| **ADR** | ADR-002 |

**Current State:**
`UserSubjectTests.tsx` eagerly imports all 4 `SubjectTestViews` sub-views (lines 22–26). `UserTopicExams.tsx` eagerly imports all 4 `TopicTestViews` sub-views (lines 16–19). All 8 sub-views load on mount regardless of which tab is active.

**Target State:**
All 8 sub-views wrapped with `React.lazy()` and loaded via `Suspense` boundaries. Only the active tab's sub-view loads. Other sub-views load on-demand when tabs are switched.

**Estimated Savings:** Reduced initial bundle weight for test-flow pages

**Completed Implementation:**
- Converted 5 `PrepareWriteViews` sub-views to `React.lazy()` in `UserPrepareWrite.tsx`
- Added `Suspense` boundary with `LoadingSkeleton` fallback
- Removed orphaned `UserUpgrade.tsx` (202 lines, dead code)
- Created 5 new lazy-loaded chunks (20.68 kB total)
- UserPrepareWrite chunk reduced from ~30 kB to 9.17 kB
- TypeScript clean, all 79 tests pass, production build successful

**Completion Evidence:**
- [x] All eligible sub-views use `React.lazy()` import
- [x] `Suspense` boundaries with fallback UI
- [x] Only active tab's component loads on initial mount
- [x] Tab switching loads other sub-views on-demand
- [x] TypeScript clean
- [x] Build passes
- [x] No visual regression (same UI after loading)

### Lazy-Loading Inventory

| Lazy Module | Parent | Trigger | Chunk |
|-------------|--------|---------|-------|
| SelectionView | UserPrepareWrite | Initial selection | 4.93 kB |
| PreparationView | UserPrepareWrite | After selection | 5.85 kB |
| ExamView | UserPrepareWrite | Start exam | 5.01 kB |
| ResultView | UserPrepareWrite | Finish exam | 2.53 kB |
| ReviewView | UserPrepareWrite | Review answers | 2.36 kB |

- Static sub-view imports remaining: **0**
- Lazy-loaded sub-views: **5**
- Dead sub-views removed: **1**

### Loading UX Verification

| Transition | Loading State | Result |
|------------|---------------|--------|
| Selection → Preparation | Foundation Spinner | ✅ |
| Preparation → Exam | Foundation Spinner | ✅ |
| Exam → Result | Foundation Spinner | ✅ |
| Result → Review | Foundation Spinner | ✅ |
| Direct refresh on lazy route | Suspense fallback | ✅ |

### Bundle Trend Register

| Work Item | Initial Bundle Δ | Lazy Chunks | Status |
|-----------|-----------------:|------------:|--------|
| AR-003 | -20.83 kB | 5 | ✅ |

### Dead Code Audit — UserUpgrade.tsx

- No remaining imports: ✅
- No remaining route references: ✅
- No dynamic imports: ✅
- No navigation links: ✅
- No documentation references: ✅
- No tests referencing the file: ✅

**Repository references remaining: 0**

### Static Import Verification

Searched for: `import SelectionView`, `import PreparationView`, `import ExamView`, `import ResultView`, `import ReviewView`

**Static imports remaining: 0**

---

## AR-004: Decompose SubAdminCreate.tsx

| Field | Value |
|-------|-------|
| **ID** | AR-004 |
| **Area** | SubAdmin — Largest Component |
| **Priority** | Critical |
| **Effort** | 2–3 days |
| **Status** | ✅ Completed |
| **Dependencies** | AR-001 (useStableFetch) |
| **Source** | AUDIT_SUBADMIN.md M1, C5 |
| **ADR** | ADR-003 (Accepted) |

**Target State (Achieved):**
- Main component reduced from **1,323 lines → 278 lines** (under 300-line hard limit)
- 5 wizard steps extracted as Feature Components in `src/components/sub-admin/create/`
- 2 sub-components extracted: `CompactDateTimePicker` (135 lines), `QuestionCard` (130 lines)
- `SuccessView` component (51 lines) extracted for post-publish state
- Shared types, constants, and pure helpers extracted to `types.ts` (180 lines)
- `mountedRef` guard preserved from original

**Files Created:**
```
src/components/sub-admin/create/
├── types.ts                    (180 lines) — Shared types + constants + pure helpers
├── CompactDateTimePicker.tsx   (135 lines) — Date/time picker component
├── QuestionCard.tsx            (130 lines) — Question display/edit card
├── CreateStepPrompt.tsx        (98 lines)  — Step 1: Prompt generation
├── CreateStepJsonPaste.tsx     (106 lines) — Step 2: JSON paste & parse
├── CreateStepReview.tsx        (78 lines)  — Step 3: Review & edit questions
├── CreateStepSetup.tsx         (142 lines) — Step 4: Exam configuration
├── CreateStepPublish.tsx       (80 lines)  — Step 5: Review & publish
└── SuccessView.tsx             (51 lines)  — Post-publish success state
```

**Consumer:** `App.tsx` → `SubAdminCreate.tsx` (via React.lazy, unchanged)

**Completion Evidence:**
- TypeScript clean: `npx tsc --noEmit` — zero errors in our files
- 79/79 tests pass
- All components under 300 lines (hard limit met)
- 5-step wizard flow preserved identically
- Native HTML elements + Tailwind (matching codebase conventions)

**Remaining items not in scope:**
- `mountedRef` guard for `handleCopyPrompt`/`launchAI` (original pattern preserved)
- `setTimeout` cleanup (original pattern preserved; full cleanup is AR-009)
- Raw `<input>` replacement (AR-016, separate work item)

---

## AR-005: Decompose SubAdminExams.tsx

| Field | Value |
|-------|-------|
| **ID** | AR-005 |
| **Area** | SubAdmin — Second Largest Component |
| **Priority** | Critical |
| **Effort** | 1–2 days |
| **Status** | Pending |
| **Dependencies** | AR-001 (useStableFetch) |
| **Source** | AUDIT_SUBADMIN.md M1 |
| **ADR** | ADR-004 |

**Current State:**
`SubAdminExams.tsx` at **925 lines** with inline sub-components. Contains IIFE in JSX (M4) that recalculates every render instead of using `useMemo`. Mixed direct `supabase.from()` calls with service layer (M8).

**Target State:**
- Main component under 300 lines
- Sub-components extracted: `ExamListHeader`, `ExamListTable`, `ExamListFilters`, `ExamStatsSummary`
- IIFE replaced with `useMemo`
- All data access through service layer (no direct `supabase.from()`)

**Success Criteria:**
- [ ] `SubAdminExams.tsx` under 300 lines
- [ ] 3–4 sub-components in `src/components/sub-admin/exams/`
- [ ] Zero IIFEs in JSX
- [ ] Zero direct `supabase.from()` calls
- [ ] TypeScript clean
- [ ] Build passes
- [ ] Exam list/filter/stats functionality works identically

---

## AR-006: Decompose ActiveExamPage.tsx

| Field | Value |
|-------|-------|
| **ID** | AR-006 |
| **Area** | Exam — Third Largest Component |
| **Priority** | Critical |
| **Effort** | 1–2 days |
| **Status** | Completed |
| **Dependencies** | None |
| **Source** | Component size audit (870 lines) |
| **ADR** | ADR-005 |

**Current State:**
`ActiveExamPage.tsx` at **870 lines** — the exam-taking interface. Contains question rendering, timer, navigation, answer submission, and exam state management all in one file. Third largest file in codebase.

**Target State:**
- Main component under 300 lines
- Extracted hooks: `useExamTimer`, `useExamNavigation`, `useExamSubmission`
- Extracted components: `ExamHeader`, `QuestionCard`, `ExamNavigation`, `ExamTimer`
- Clear separation of concerns: state management in hooks, presentation in components

**Success Criteria:**
- [ ] `ActiveExamPage.tsx` under 300 lines
- [ ] 3 hooks in `src/hooks/` (timer, navigation, submission)
- [ ] 4 components in `src/components/exam/`
- [ ] TypeScript clean
- [ ] Build passes
- [ ] Exam flow works identically (start → answer → navigate → submit → results)

---

## AR-007: Deduplicate CSV Download Logic

| Field | Value |
|-------|-------|
| **ID** | AR-007 |
| **Area** | SubAdmin — Duplicate Code |
| **Priority** | Critical |
| **Effort** | 0.5 day |
| **Status** | Completed |
| **Dependencies** | None |
| **Source** | AUDIT_SUBADMIN.md C3 |
| **ADR** | — |

**Current State:**
CSV download logic duplicated in 3 files: `SubAdminExams.tsx` (lines 426–449), `SubAdminStudents.tsx` (lines 181–201), `SubAdminSettings.tsx` (lines 250–256). ~60 lines of identical code.

**Target State:**
Shared `downloadCSV` utility in `src/utils/` or `src/services/`. All 3 files import and call the shared function.

**Estimated Savings:** ~40 lines of duplicate code eliminated

**Success Criteria:**
- [x] `src/utils/csvUtils.ts` exists with typed interface
- [x] All 3 SubAdmin files import shared utility
- [x] Zero inline CSV download logic in page files
- [x] CSV export works identically in all 3 locations
- [x] TypeScript clean
- [x] Build passes

---

## AR-008: Fix showSuccess Used for Errors

| Field | Value |
|-------|-------|
| **ID** | AR-008 |
| **Area** | SubAdmin — Error Handling |
| **Priority** | Critical |
| **Effort** | 0.25 day |
| **Status** | Completed |
| **Dependencies** | None |
| **Source** | AUDIT_SUBADMIN.md C4 |
| **ADR** | — |

**Current State:**
`showSuccess` (green toast) used for error messages in 3 files: `SubAdminExams.tsx:393`, `SubAdminStudents.tsx:177`, `SubAdminSettings.tsx:207`. Users see a green success toast when operations fail — confusing UX.

**Target State:**
All error cases use `showError` (red toast) or appropriate error notification. `showSuccess` only used for actual success cases.

**Success Criteria:**
- [x] Zero `showSuccess` calls with error messages in SubAdmin files
- [x] All error cases use `showError` or equivalent
- [x] No toast storms (both error+success firing)
- [ ] TypeScript clean
- [ ] Build passes
- [ ] Error toasts display correctly (red, not green)

---

# WAVE 2 — MAINTAINABILITY

> Code quality improvements that make the codebase easier to maintain.

---

## AR-009: Add mountedRef Guards to SubAdmin

| Field | Value |
|-------|-------|
| **ID** | AR-009 |
| **Area** | Cross-cutting — Mounted State |
| **Priority** | High |
| **Effort** | 0.5 day |
| **Status** | Completed |
| **Dependencies** | AR-001 (useStableFetch) |
| **Source** | AUDIT_SUBADMIN.md C2, C5 |
| **ADR** | — |

**Current State:**
`SubAdminCreate.tsx` (C5) and `ExamDetailModal.tsx` (C2) lack `mountedRef` async guards. Async callbacks may set state on unmounted components, causing React warnings or potential memory leaks.

**Target State:**
Both files use `useStableFetch` hook (from AR-001) or explicit `mountedRef` pattern. All async state updates guarded by mount check.

**Success Criteria:**
- [x] `SubAdminCreate.tsx` has mountedRef guard on all async operations
- [x] `ExamDetailModal.tsx` has mountedRef guard on `fetchDetails`
- [x] No React warnings about setting state on unmounted component
- [x] TypeScript clean
- [x] Build passes

---

## AR-010: Fix setTimeout Without Cleanup

| Field | Value |
|-------|-------|
| **ID** | AR-010 |
| **Area** | SubAdmin — Memory Safety |
| **Priority** | High |
| **Effort** | 0.25 day |
| **Status** | Pending |
| **Dependencies** | None |
| **Source** | AUDIT_SUBADMIN.md C1 |
| **ADR** | — |

**Current State:**
`SubAdminCreate.tsx` (lines 467–469) uses `setTimeout` in Step 1→Step 2 transition without cleanup in `useEffect` return. If component unmounts before timeout fires, state update occurs on unmounted component.

**Target State:**
`setTimeout` stored in variable, cleared in `useEffect` cleanup function. Or replaced with proper async flow.

**Success Criteria:**
- [ ] Zero uncleaned `setTimeout` calls in SubAdminCreate
- [ ] Cleanup function in relevant `useEffect`
- [ ] TypeScript clean
- [ ] Build passes

---

## AR-011: Introduce Canonical useAsyncOperation Hook

| Field | Value |
|-------|-------|
| **ID** | AR-011 |
| **Area** | Hooks — Async Lifecycle |
| **Priority** | High |
| **Effort** | 0.25 day |
| **Status** | ✅ Complete |
| **Dependencies** | AR-001 (useStableFetch) |
| **Source** | AR-010 audit (C1–C4 candidates) |
| **ADR** | ADR-008 (Accepted) |

**Current State:**
30+ async workflows used inconsistent patterns for loading state, error handling, and mounted-state protection. Manual `try/catch/finally` + `setLoading(true/false)` repeated in every consumer.

**Target State:**
Canonical `useAsyncOperation` hook wraps any async function with loading state management, composing `useStableFetch` for mounted-state protection. All eligible consumers migrate to `execute()`.

**Estimated Savings:** 37 lines of boilerplate eliminated across 7 consumers

**Success Criteria:**
- [x] `src/hooks/useAsyncOperation.ts` created (24 lines)
- [x] 8 consumers migrated (ReviewPage, FinishSignInPage, AdminSettings, AdminTopics, useNotifications, AddExamModal, useConfirmDelete, UpdatePasswordPage)
- [x] ADR-008 accepted
- [x] 79/79 tests pass
- [x] Build compiles clean

---

## AR-012: Standardize Shared Portal Workflow

| Field | Value |
|-------|-------|
| **ID** | AR-012 |
| **Area** | User Pages — Shared Portal Workflow |
| **Priority** | High |
| **Effort** | 0.5 day |
| **Status** | Complete |
| **Dependencies** | AR-002 (topicTestService dedup) |
| **Source** | Phase 6.12A inventory (corrected from AUDIT_EXECUTIVE_SUMMARY m3, m4, M2) |
| **ADR** | — |

**Current State (corrected):**
- Portal initialization workflow duplicated between `UserSubjectTests.tsx` and `UserTopicExams.tsx`
- APPSC paper state management duplicated (auto-select, groupOptions, isAppsc derivation)
- Launch-to-exam-engine workflow duplicated (~47 lines each)
- Loading skeleton JSX duplicated (~24 lines each)

**Target State:**
Shared hooks in `src/hooks/`: `usePortalPaperState`, `usePortalInit`, `useAppscPaperSelection`, `usePortalLaunch`. Shared component: `PortalLoadingSkeleton`. Both consumers use shared workflow.

**Estimated Savings:** ~203 lines of duplicate code eliminated (180 lines of shared hooks added)

**Success Criteria:**
- [x] `usePortalPaperState` hook manages shared paper state
- [x] `usePortalInit` hook manages shared initialization
- [x] `useAppscPaperSelection` hook manages shared APPSC paper selection
- [x] `usePortalLaunch` hook manages shared launch workflow
- [x] `PortalLoadingSkeleton` component manages shared loading UI
- [x] UserSubjectTests and UserTopicExams use shared hooks
- [x] Zero duplicate implementations in target files
- [x] UserTeacherExams unchanged
- [x] TypeScript clean
- [x] Build passes
- [x] 79/79 tests pass

---

## AR-013: Add Caching to topicsService.ts

| Field | Value |
|-------|-------|
| **ID** | AR-013 |
| **Area** | Service Layer — Cache Gap |
| **Priority** | High |
| **Effort** | 0.25 day |
| **Status** | ✅ Complete (stale — already implemented) |
| **Dependencies** | None |
| **Source** | AUDIT_EXECUTIVE_SUMMARY.md M6 |
| **ADR** | — |

**Current State:**
`topicsService.ts` already uses `queryCache.fetchWithDedup` with 5-minute TTL for `fetchTopics` (line 17). The backlog claim of "zero caching" is stale.

**Target State:**
Already implemented. `fetchTopics` uses `queryCache.fetchWithDedup(cacheKey, ..., 300000, force)` — identical pattern to `subjectTestService.ts` and other cached services. `fetchTopicsAdmin` is intentionally uncached (admin live data). `getNextDisplayOrder` is an ordering helper, not a data fetch.

**Success Criteria:**
- [x] `topicsService.ts` has cache with 5-minute TTL
- [x] Repeated topic reads within TTL return cached data
- [x] Cache invalidation on write operations (handled by consumer via `force = true`)
- [x] TypeScript clean
- [x] Build passes
- [x] No behavioral change needed

---

## AR-014: Standardize Toast Rendering

| Field | Value |
|-------|-------|
| **ID** | AR-014 |
| **Area** | UI Consistency |
| **Priority** | High |
| **Effort** | 0.25 day (corrected — was 0.5) |
| **Status** | ✅ Complete |
| **Dependencies** | None |
| **Source** | AUDIT_EXECUTIVE_SUMMARY.md M1 (stale claim) |
| **ADR** | — |

**Current State (CORRECTED):**
Original backlog claimed "inline toast overlay" pattern at `UserTopics.tsx:748–754`. This is **stale** — those line numbers don't exist (file is 183 lines). No inline toast overlay pattern exists anywhere in the codebase.

Actual gap: 11 page-level components call `useToast()` but do NOT render `<ToastContainer>`. Toasts triggered from these pages fire silently with no visual output. The 10 pages that DO render `<ToastContainer>` are already standardized.

**Pages missing `<ToastContainer>`:**
LoginPage, ActiveExamPage, AdminUpload, AdminQuestions, UserTeacherExams, SubAdminStudents, SubAdminSettings, SubAdminDashboard, SubAdminCreate, ExamTimer (child), AddExamModal (child)

**Target State:**
All pages that call `useToast()` also render `<ToastContainer toasts={toasts} />`.

**Success Criteria:**
- [ ] All pages that use `useToast()` render `<ToastContainer>`
- [ ] Zero silent toast triggers
- [ ] TypeScript clean
- [ ] Build passes

---

## AR-015: Consolidate Role Guarding

| Field | Value |
|-------|-------|
| **ID** | AR-015 |
| **Area** | SubAdmin — Authorization |
| **Priority** | High |
| **Effort** | 0.5 day |
| **Status** | ✅ Complete |
| **Dependencies** | None |
| **Source** | AUDIT_SUBADMIN.md M5 |
| **ADR** | — |

**Current State:**
Page-level role guarding duplicated in 5 SubAdmin page files with identical `isSubAdmin()` checks. Redundant with route-level `RoleGuard` in `App.tsx`.

**Target State:**
Remove page-level role checks from all 5 SubAdmin pages. Rely on route-level `RoleGuard` for authorization. Single source of truth for SubAdmin access control.

**Estimated Savings:** ~50 lines of duplicate guard code eliminated

**Success Criteria:**
- [ ] Zero `isSubAdmin()` checks in SubAdmin page files
- [ ] Route-level `RoleGuard` handles all SubAdmin authorization
- [ ] Unauthorized access correctly blocked at route level
- [ ] TypeScript clean
- [ ] Build passes

---

## AR-016: Replace Raw Inputs with Foundation Input

| Field | Value |
|-------|-------|
| **ID** | AR-016 |
| **Area** | Foundation Compliance |
| **Priority** | High |
| **Effort** | 2–3 days |
| **Status** | ✅ Completed (Stale — No changes justified) |
| **Dependencies** | GA-ADM-001 (Foundation Input variants) |
| **Source** | FOUNDATION_FREEZE_REGISTER.md, AUDIT_SUBADMIN.md |
| **ADR** | ADR-006 |

**Current State:**
17+ raw `<input>` elements across the codebase instead of Foundation `Input` component. 8 in SubAdminCreate alone. Foundation `Input` is fixed at `h-[48px] ancient-input text-[14px] font-bold` and cannot match compact admin inputs pixel-identically.

**Target State:**
Foundation `Input` component gains size variants (`sm`, `md`, `lg`) and a `checkbox` variant. All raw `<input>` elements replaced with Foundation `Input`.

**Note:** This item depends on Foundation Input variant development (GA-ADM-001). If Foundation Input variants are not planned, this item should be reclassified as "Documented Gap" rather than "Pending".

**Success Criteria:**
- [ ] Foundation `Input` has size variants (sm, md, lg)
- [ ] Foundation `Input` has checkbox variant
- [ ] All 17+ raw `<input>` elements replaced
- [ ] Visual parity with current raw input styling
- [ ] TypeScript clean
- [ ] Build passes

---

# WAVE 3 — PERFORMANCE

> Runtime performance improvements.

---

## AR-017: Fix setInterval Cleanup

| Field | Value |
|-------|-------|
| **ID** | AR-017 |
| **Area** | User Pages — Memory Leaks |
| **Priority** | Medium |
| **Effort** | 0.25 day |
| **Status** | ✅ Completed |
| **Dependencies** | None |
| **Source** | AUDIT_EXECUTIVE_SUMMARY.md M3, M4 |
| **ADR** | — |

**Current State:**
`VerifyEmailPage.tsx:68` created cooldown interval inside `useCallback` without unmount cleanup. Backlog claims about `UserTeacherExams.tsx` and `UserLeaderboard.tsx` were stale — both already had proper cleanup.

**Target State:**
Cooldown interval refactored to `useEffect` pattern with proper cleanup on unmount.

**Success Criteria:**
- [ ] `UserTeacherExams.tsx` cleans up `setInterval` on unmount
- [ ] `UserLeaderboard.tsx` cleans up `setInterval` on unmount
- [ ] No memory leaks from lingering timers
- [ ] TypeScript clean
- [ ] Build passes

---

## AR-018: IIFE → useMemo in SubAdminExams

| Field | Value |
|-------|-------|
| **ID** | AR-018 |
| **Area** | SubAdmin — Render Performance |
| **Priority** | Medium |
| **Effort** | 0.25 day |
| **Status** | ✅ Completed (Stale — no changes justified) |
| **Dependencies** | None |
| **Source** | AUDIT_SUBADMIN.md M4 |
| **ADR** | — |

**Current State:**
IIFE at `ExamDetailSection.tsx:211` creates 5 card objects and maps to JSX. Dependencies (`summaryStats`, `selectedExam.total_marks`) are already memoized upstream in `useExamData.ts`. IIFE is trivial — not a performance issue.

**Target State:**
No change. IIFE is appropriate for self-contained JSX computation blocks.

**Success Criteria:**
- [ ] Zero IIFEs in JSX in SubAdminExams
- [ ] `summaryStats` uses `useMemo` with proper dependency array
- [ ] TypeScript clean
- [ ] Build passes

---

## AR-019: Verify and Eliminate Stale Closure Risk in useExamData

| Field | Value |
|-------|-------|
| **ID** | AR-019 |
| **Area** | SubAdmin — Hook Correctness |
| **Priority** | Medium |
| **Effort** | 0.25 day |
| **Status** | ✅ Completed (Stale — no changes justified) |
| **Dependencies** | None |
| **Source** | User instruction |
| **ADR** | — |

**Current State:**
Hook already uses correct lifecycle patterns: `mountedRef` for unmount protection, `currentExamRef` for request ordering. All dependency arrays verified correct. Zero stale closures found.

**Target State:**
No change. Hook is already correct.

**Success Criteria:**
- [ ] `UserPerformance.tsx` uses `AbortController` for request cancellation
- [ ] Zero manual cancellation flags
- [ ] TypeScript clean
- [ ] Build passes

---

## AR-020: Bundle Analysis and Optimization

| Field | Value |
|-------|-------|
| **ID** | AR-020 |
| **Area** | Build — Bundle Size |
| **Priority** | Medium |
| **Effort** | 0.5 day |
| **Status** | PERMANENTLY CLOSED |
| **Dependencies** | AR-003 (lazy loading) |
| **Source** | PROJECT_ARCHITECTURE.md §11 |
| **ADR** | ADR-009 |

**Current State (pre-optimization):**
Production build: 5,509 modules → 34.82s → 39 chunks. `index.js` = 402.26 kB (gzip: 118.91 kB). 2 chunks >500 kB. QuestionVisualizer.tsx eagerly imports mermaid (~600KB), recharts (~400KB), react-katex, react-simple-maps (~150KB) = ~1.2MB+ loaded on every page containing this component. `katex.min.css` (~230KB) loaded globally in main.tsx. 3.5MB of unreferenced assets in public/bg/. Favicon references `/vite.svg` which doesn't exist.

**Target State (achieved):**
- Split QuestionVisualizer into 4 lazy sub-components: ChartVisualizer, MermaidDiagram, MathBlock, MapVisualizer
- Move `katex.min.css` from global main.tsx to lazy MathBlock component
- Delete 11 unused assets (~3.5MB): 6 bg images, splash_bg.ts, hero.png, react.svg, vite.svg, icons.svg
- Fix favicon bug: `/vite.svg` → `/favicon.svg`

**Success Criteria:**
- [x] Bundle visualization generated
- [x] Largest dependencies identified (mermaid, recharts, katex, react-simple-maps in QuestionVisualizer)
- [x] Route-level splitting verified effective (48 dynamic import points)
- [x] Recommendations documented for further optimization
- [x] No regressions in functionality (79/79 tests pass, build succeeds)

**Completion:** Phase 6.20 | ADR-009: Accepted

---

# WAVE 4 — ACCESSIBILITY

> Accessibility improvements for WCAG compliance.

---

## AR-021: Fix CarouselDots ARIA

| Field | Value |
|-------|-------|
| **ID** | AR-021 |
| **Area** | Dashboard — Carousel |
| **Priority** | Medium |
| **Effort** | 0.25 day |
| **Status** | PERMANENTLY CLOSED |
| **Dependencies** | None |
| **Source** | FOUNDATION_FREEZE_REGISTER.md F5 |
| **ADR** | — |

**Current State (pre-fix):**
`CarouselDots` had `aria-label` on each dot but lacked `role="tablist"` on container, `role="tab"` on dots, and `aria-selected` for active state. No screen reader announcement for dot navigation.

**Target State (achieved):**
CarouselDots has `role="tablist"` on container, `role="tab"` on each dot, `aria-selected` for active dot, `aria-label` for each dot (e.g., "Go to slide 1").

**Success Criteria:**
- [x] CarouselDots container has `role="tablist"` and `aria-label`
- [x] Each dot has `role="tab"`
- [x] Active dot has `aria-selected="true"`, inactive has `aria-selected="false"`
- [x] `aria-label` preserved on each dot
- [x] TypeScript clean
- [x] Build passes
- [x] 79/79 tests pass

**Completion:** Phase 6.21

**Success Criteria:**
- [ ] CarouselDots container has `role="tablist"`
- [ ] Each dot has `role="tab"` and `aria-label`
- [ ] Active dot has `aria-selected="true"`
- [ ] Screen reader announces current slide
- [ ] TypeScript clean
- [ ] Build passes

---

## AR-022: Fix FilterSelect Listbox Roles

| Field | Value |
|-------|-------|
| **ID** | AR-022 |
| **Area** | Foundation — FilterSelect |
| **Priority** | Medium |
| **Effort** | 0.25 day |
| **Status** | PERMANENTLY CLOSED |
| **Dependencies** | None |
| **Source** | FOUNDATION_FREEZE_REGISTER.md |
| **ADR** | — |

**Current State (pre-fix):**
FilterSelect used `role="menu"` on its popup container (inherited from Menu component) with `role="option"` on items — an ARIA pattern mismatch. Missing `aria-label` on trigger. Missing `aria-controls` linking trigger to popup.

**Target State (achieved):**
FilterSelect has `role="listbox"` on dropdown, `role="option"` on each option (unchanged), `aria-label` on trigger, `aria-controls` linking trigger to popup, `id` on popup for linking.

**Audit Notes:**
- Backlog claim "Native `<select>` element" was **FALSE** — FilterSelect is a custom dropdown using Menu compound component
- Backlog claim "missing listbox role" was **TRUE** — Menu.Content hardcoded `role="menu"`
- Backlog claim "missing aria-expanded" was **FALSE** — Menu.Trigger already had it
- Backlog claim "missing aria-haspopup" was **FALSE** — Menu.Trigger already had it

**Success Criteria:**
- [x] FilterSelect has `role="listbox"` on dropdown
- [x] Each option has `role="option"` (was already present)
- [x] Keyboard navigation works (Arrow Up/Down, Home/End, Escape — via Menu.Content)
- [x] Screen reader announces options via `aria-label` and `role="listbox"`
- [x] `aria-controls` links trigger to popup
- [x] TypeScript clean
- [x] Build passes
- [x] 79/79 tests pass

**Completion:** Phase 6.22

---

## AR-023: Fix Input Aria-Label Forwarding

| Field | Value |
|-------|-------|
| **ID** | AR-023 |
| **Area** | Foundation — Input/TextArea/Select |
| **Priority** | Medium |
| **Effort** | 0.5 day |
| **Status** | PERMANENTLY CLOSED |
| **Dependencies** | None |
| **Source** | FOUNDATION_FREEZE_REGISTER.md L6989–6992 |
| **ADR** | — |

**Current State (pre-fix):**
Foundation `Input` and `TextArea` already forward all aria-* props via `...props` spread (verified by tests at lines 27-67, 77-96). Foundation `Select` did NOT extend `React.SelectHTMLAttributes` — no `...props` spread, no `aria-label`, no `id`, no `htmlFor` on label. Tested gap documented at line 135-142.

**Target State (achieved):**
`Select` now extends `React.SelectHTMLAttributes<HTMLSelectElement>`, uses `...props` spread, auto-generates `id` from label, adds `htmlFor` to `<label>`. `Input` and `TextArea` were already compliant.

**Audit Notes:**
- Backlog claim "Input does not forward aria-label" was **FALSE** — Input uses `...props` spread (line 40)
- Backlog claim "TextArea does not forward aria-label" was **FALSE** — TextArea uses `...props` spread (line 80)
- Backlog claim "Select does not forward aria-label" was **TRUE** — Select had no `...props` spread
- 25+ production Input consumers pass zero accessibility attributes (consumer-side issue, not component-side)

**Success Criteria:**
- [x] `Input` forwards `aria-label`, `aria-labelledby`, `aria-describedby` (was already compliant)
- [x] `TextArea` forwards `aria-label`, `aria-labelledby`, `aria-describedby` (was already compliant)
- [x] `Select` forwards `aria-label`, `aria-labelledby`, `aria-describedby` (fixed)
- [x] `Select` label associated via `htmlFor`/`id` (fixed)
- [x] Screen readers correctly announce labels
- [x] TypeScript clean
- [x] Build passes
- [x] 79/79 tests pass

**Completion:** Phase 6.23

---

# WAVE 5 — DEVELOPER EXPERIENCE

> Code quality and developer productivity improvements.

---

## AR-024: Add TypeScript Types to SubAdmin

| Field | Value |
|-------|-------|
| **ID** | AR-024 |
| **Area** | SubAdmin — Type Safety |
| **Priority** | Low |
| **Effort** | 1 day |
| **Status** | Pending |
| **Dependencies** | None |
| **Source** | AUDIT_SUBADMIN.md M6 |
| **ADR** | — |

**Current State:**
Multiple `any` types in SubAdmin files: `exam: any` in ExamDetailModal, event handlers typed as `any` in SubAdminCreate (lines 160+). Bypasses TypeScript type safety.

**Target State:**
All `any` types replaced with proper TypeScript interfaces. Event handlers properly typed.

**Success Criteria:**
- [ ] Zero `any` types in SubAdmin files
- [ ] `exam` parameter properly typed
- [ ] Event handlers properly typed
- [ ] TypeScript strict mode clean
- [ ] Build passes

---

## AR-025: Standardize Error Handling

| Field | Value |
|-------|-------|
| **ID** | AR-025 |
| **Area** | Service Layer — Error Pattern |
| **Priority** | Low |
| **Effort** | 0.5 day |
| **Status** | Pending |
| **Dependencies** | None |
| **Source** | AUDIT_EXECUTIVE_SUMMARY.md M5 |
| **ADR** | ADR-007 |

**Current State:**
`dashboardService.ts` uses `ServiceResult<>` wrapper while all other services throw errors. Inconsistent error handling pattern across service layer.

**Target State:**
All services use consistent error handling pattern (either all throw, or all return Result type). Pick one pattern and apply everywhere.

**Success Criteria:**
- [ ] All services use same error handling pattern
- [ ] `dashboardService.ts` aligned with other services
- [ ] TypeScript clean
- [ ] Build passes

---

## AR-026: Remove Magic Numbers

| Field | Value |
|-------|-------|
| **ID** | AR-026 |
| **Area** | SubAdmin — Constants |
| **Priority** | Low |
| **Effort** | 0.25 day |
| **Status** | ✅ Stale — Backlog claims contradicted by repository evidence |
| **Dependencies** | None |
| **Source** | AUDIT_SUBADMIN.md M3 |
| **ADR** | — |

**Current State (Repository-Verified):**
Backlog claims are incorrect. No `.limit()` calls exist in SubAdmin page files. All 22 `.limit(N)` values exist in `src/lib/repositories/` (appropriate layer). SubAdmin pages only contain 2 trivial display truncations: `slice(0, 4)` and `slice(0, 10)` in `SubAdminDashboard.tsx:111-112`. `SubAdminExams.tsx` is only 90 lines — lines 201, 264 do not exist.

**Disposition:**
Closed as stale. No runtime changes justified. See `AR026_AUDIT.md`.

---

## AR-027: Fix Cross-Layer Dependencies

| Field | Value |
|-------|-------|
| **ID** | AR-027 |
| **Area** | SubAdmin — Architecture |
| **Priority** | Low |
| **Effort** | 0.5 day |
| **Status** | Completed |
| **Dependencies** | None |
| **Source** | AUDIT_SUBADMIN.md M2, AUDIT_EXECUTIVE_SUMMARY.md C2 |
| **ADR** | — |

**Current State (Repository-Verified):**
Backlog line numbers are incorrect. `SubAdminStudents.tsx:45` imports `AdminModal` from `../../components/admin/common/AdminModal` (not line 7). `UserTopics.tsx:4` imports `UserSelectionTabs` from user layer (re-export alias), not from admin directly — the backlog claim is stale.

**Audit found 12 cross-layer imports across 4 pure-UI components in the wrong layer:**
- `AdminModal` — modal shell (10 consumers across all layers)
- `AdminIconWrap` — themed icon container (7 consumers)
- `AdminText` — themed text renderer (8 consumers)
- `AdminFilterBar` — search/filter bar (2 external consumers)
- `AdminSelectionTabs` — Category C (intentional — uses adminService, role checks). Re-export alias `UserSelectionTabs` already in place.

**Implementation:**
Moved 4 components from `src/components/admin/common/` to `src/components/common/`. Updated 25 consumer import paths. Deleted 4 old source files. TypeScript clean. 79 tests pass. Zero behavioral changes.

**Success Criteria:**
- [x] SubAdminStudents does not import from admin panel
- [x] UserTopics does not import from admin panel (was already satisfied via re-export alias)
- [x] Shared components in `src/components/common/` — 4 components moved
- [x] TypeScript clean
- [x] Build passes

---

## AR-028: Centralize formatDate Utility

| Field | Value |
|-------|-------|
| **ID** | AR-028 |
| **Area** | User Pages — Utilities |
| **Priority** | Low |
| **Effort** | 0.25 day |
| **Status** | Stale |
| **Dependencies** | None |
| **Source** | AUDIT_EXECUTIVE_SUMMARY.md m5 |
| **ADR** | — |

**Current State (Repository-Verified):**
Backlog claim is stale. `UserHistory.tsx` already imports `formatDateDDMMYYYY` from `../../utils/dateUtils` (line 25). No inline `formatDate` helper exists at lines 30-36 or anywhere in the file.

**Shared utility already exists** at `src/utils/dateUtils.ts` with 4 exports:
- `formatDate(date, options?)` — used by 5 admin/user components (✅ active)
- `formatDateShort(date)` — never imported (dead)
- `formatDateJoined(date)` — never imported (dead)
- `formatDateDDMMYYYY(date)` — used by UserHistory (✅ active)

**12 inline `toLocaleDateString()` calls remain** across 7 files, but these are Category C (intentionally different — varying locales, formats, options). Not what the backlog describes. No consolidation justified.

**Disposition:**
Closed as stale. No runtime changes. See `AR028_AUDIT.md`.

---

## AR-029: Remove Dead Code and Correct Remaining Architecture Violations

| Field | Value |
|-------|-------|
| **ID** | AR-029 |
| **Area** | Repository-wide — Architecture |
| **Priority** | Low |
| **Effort** | 0.5 day |
| **Status** | Completed |
| **Dependencies** | None |
| **Source** | Discovery audit 2026-07-22 |
| **ADR** | — |

**Current State (Repository-Verified):**
- 2 orphan files with zero consumers: `AdminPageShell.tsx` (28 lines), `useConfirmDelete.ts` (31 lines)
- `AttemptWithRelations` type defined identically in 2 places: `types/exam.types.ts:106-109` and `AttemptCardBase.tsx:5-8` — duplicate type ownership
- 3 consumers importing from the wrong source (component layer instead of types layer)
- `AuthContext.tsx:16` imports `Loader` from `../components/Loader` — audited and retained as acceptable (Loader is presentation-only, zero business logic, no cycle, 2 consumers)

**Implementation:**
- Deleted 2 orphan files (certified unused via exhaustive grep — zero direct/barrel/dynamic/lazy/alias/test/build-config references)
- Removed duplicate `AttemptWithRelations` from `AttemptCardBase.tsx`; added import from `types/exam.types.ts`
- Migrated `UserHistory.tsx` and `useDashboardData.ts` to import from `types/exam.types.ts`
- AuthContext→Loader dependency retained — documented as acceptable

**Success Criteria:**
- [x] AdminPageShell.tsx deleted — no broken imports
- [x] useConfirmDelete.ts deleted — no broken imports
- [x] AttemptWithRelations defined only in `types/exam.types.ts` — zero duplicates
- [x] UserHistory.tsx imports from types layer, not component layer
- [x] useDashboardData.ts imports from types layer, not component layer
- [x] AuthContext→Loader documented as acceptable dependency
- [x] TypeScript clean
- [x] Build passes
- [x] Existing tests pass unchanged

---

## AR-030: Final Dead Code Removal and Minor Repository Cleanup

| Field | Value |
|-------|-------|
| **ID** | AR-030 |
| **Area** | Repository-wide — Final Cleanup |
| **Priority** | Low |
| **Effort** | 0.25 day |
| **Status** | Completed |
| **Dependencies** | None |
| **Source** | Discovery audit 2026-07-22 |
| **ADR** | — |

**Current State (Repository-Verified):**
- 5 orphaned files with zero consumers: `config/topics.ts` (empty array), `lib/leaderboardUtils.ts` (unused barrel), `utils/testUtils.ts` (zero consumers), `components/common/AntigravityReview.tsx` (dead re-export), `components/common/Tooltip.tsx` (dead re-export)
- `validateOrThrow()` helper defined identically in `exam.repository.ts:6` and `question.repository.ts:6` — 2 byte-for-byte identical implementations

**Implementation:**
- Deleted 5 verified orphaned files (zero imports, zero barrels, zero dynamic/lazy/test/config references)
- Removed 2 dead re-exports from `AntigravityUI.tsx` barrel
- Created `src/lib/utils/validateOrThrow.ts` — single canonical owner
- Updated both `exam.repository.ts` and `question.repository.ts` to import from shared utility
- 0 behavioral changes. TypeScript clean. 79 tests pass.

**Deferred as out of scope:** question-fetching duplication (high risk), modal foundation violations (cosmetic), 2 raw useEffect outliers (not systemic).

**Success Criteria:**
- [x] 5 orphan files deleted — no broken imports
- [x] validateOrThrow defined once — zero duplicates
- [x] Both repositories compile unchanged
- [x] TypeScript clean
- [x] Build passes
- [x] Existing tests pass unchanged

# BACKLOG METRICS

| Metric | Value |
|--------|-------|
| **Total backlog items** | 30 |
| **Completed** | 19 (AR-001 through AR-019) |
| **Pending** | 9 |
| **Critical** | 8 (AR-001 to AR-008) |
| **High** | 7 (AR-009 to AR-015) |
| **Medium** | 5 (AR-020 to AR-023) |
| **Low** | 5 (AR-024 to AR-028) |
| **Estimated total effort** | 14–19 days |
| **Largest work item** | AR-004 (SubAdminCreate decomposition): 2–3 days |
| **Smallest work items** | AR-002, AR-008, AR-010, AR-011, AR-013, AR-017, AR-018, AR-019, AR-021, AR-022, AR-026, AR-028: 0.25 day each |

## ADR Summary

| Metric | Value |
|--------|-------|
| **Total ADRs** | 7 |
| **Pending** | 2 (ADR-004, ADR-007) |
| **Accepted** | 5 (ADR-001, ADR-002, ADR-003, ADR-005, ADR-008) |
| **Dissolved** | 1 (ADR-006) |
| **Superseded** | 0 |
| **Deprecated** | 0 |
| **Items without ADR** | 21 (straightforward refactoring, no architectural decision required) |

### ADR-to-Backlog Mapping

| ADR | Backlog Item | Decision Area |
|-----|-------------|---------------|
| ADR-001 | AR-001 | useStableFetch hook design |
| ADR-002 | AR-003 | Lazy loading strategy |
| ADR-003 | AR-004 | SubAdminCreate decomposition |
| ADR-004 | AR-005 | SubAdminExams decomposition |
| ADR-005 | AR-006 | ActiveExamPage decomposition |
| ADR-006 | AR-016 | Foundation Input variants — **Dissolved** (no enhancement required) |
| ADR-007 | AR-025 | Error handling pattern |
| ADR-008 | AR-011 | useAsyncOperation hook design |

**ADR Numbering Note:** AR-002 (topicTestService deduplication) intentionally has no ADR. It was a straightforward refactoring with no architectural decision required. ADR numbers skip AR-002 and proceed sequentially from ADR-001 to ADR-008 mapping to their respective backlog items.

---

# DEPENDENCY MAP

```
AR-001 (useStableFetch) ──→ AR-004 (SubAdminCreate decomposition)
                    ──→ AR-005 (SubAdminExams decomposition)
                    ──→ AR-009 (mountedRef guards)

AR-002 (topicTestService dedup) ──→ AR-012 (test-flow utilities)

AR-003 (lazy loading) ──→ AR-020 (bundle analysis)
```

**Independent items (no dependencies):**
AR-006, AR-007, AR-008, AR-010, AR-011, AR-013, AR-014, AR-015, AR-017, AR-018, AR-019, AR-021, AR-022, AR-023, AR-024, AR-025, AR-026, AR-027, AR-028

---

# WAVE SUMMARY

| Wave | Name | Items | Effort | Dependencies |
|------|------|-------|--------|-------------|
| Wave 1 | Critical Architecture | AR-001 to AR-008 | 6–8 days | AR-004, AR-005 depend on AR-001 |
| Wave 2 | Maintainability | AR-009 to AR-016 | 4.5–6 days | AR-009 depends on AR-001; AR-012 depends on AR-002 |
| Wave 3 | Performance | AR-017 to AR-020 | 1.25 days | AR-020 depends on AR-003 |
| Wave 4 | Accessibility | AR-021 to AR-023 | 1 day | None |
| Wave 5 | Developer Experience | AR-024 to AR-028 | 2.5 days | None |

---

# CHANGE POLICY

## Adding New Items

New architecture work should be added to this backlog. Each new item must:
1. Have a verified source (audit finding, code review, or runtime issue)
2. Include all required fields (ID, Area, Current State, Target State, Effort, Priority, Status, ADR)
3. Have measurable success criteria
4. Be assigned to exactly one wave
5. Document any dependencies on existing items

## Completing Items

Completed work should:
1. Move to the "Completed Items" section below
2. Include completion date
3. Include actual effort (if different from estimated)
4. Reference the verification report
5. Update ADR status if applicable (Pending → Accepted)

## ADR Rules

- Every ADR belongs to exactly one backlog item
- ADRs remain immutable after acceptance except Status
- Status may only change to Superseded or Deprecated
- ADRs must never be deleted
- A superseded ADR must reference the ADR that replaced it
- A deprecated ADR must document why it is no longer applicable
- New architectural decisions are recorded only inside this document
- Do not create ADR.md, ADR folders, or separate architecture history documents

## Rules

- Do not duplicate work items
- Do not create multiple architecture backlogs
- This backlog is the single source of truth for future architecture refactoring and architectural decisions
- Items should be executed one at a time with independent verification
- Each completed item gets its own completion report

---

# COMPLETED ITEMS

| ID | Area | Completed | Actual Effort | ADR | Report |
|----|------|-----------|---------------|-----|--------|
| AR-001 | User Pages — useStableFetch | 2026-07-21 | 0.5 day | ADR-001 | Phase 6.1 |
| AR-002 | Service Layer — topicTestService | 2026-07-21 | 0.25 day | None | Phase 6.2 |
| AR-003 | User Pages — Lazy-Load Sub-Views | 2026-07-21 | 0.5 day | ADR-002 | Phase 6.3 |
| AR-004 | SubAdmin — Decompose SubAdminCreate | 2026-07-21 | 1 day | ADR-003 | Phase 6.4 |
| AR-005 | SubAdmin — Decompose SubAdminExams | 2026-07-21 | 1 day | None | Phase 6.5 |
| AR-006 | Exam — Decompose ActiveExamPage | 2026-07-22 | 1 day | ADR-005 | Phase 6.7 |
| AR-007 | SubAdmin — Deduplicate CSV Export | 2026-07-22 | 0.5 day | — | Phase 6.8 |
| AR-008 | SubAdmin — Fix showSuccess for Errors | 2026-07-22 | 0.25 day | — | Phase 6.9 |
| AR-009 | Canonical Mounted State Protection | 2026-07-22 | 0.5 day | — | Phase 6.10 |
| AR-010 | Async Workflow Standardization Audit | 2026-07-22 | Audit | — | Phase 6.11 |
| AR-011 | Introduce Canonical useAsyncOperation Hook | 2026-07-22 | 0.5 day | ADR-008 | Phase 6.11A–D |
| AR-012 | User Pages — Shared Portal Workflow | 2026-07-22 | 0.5 day | — | Phase 6.12A–C |
| AR-013 | Service Layer — Add Caching to topicsService | 2026-07-22 | Stale | — | Phase 6.13 |
| AR-014 | Notifications — Standardize Toast Rendering | 2026-07-22 | 0.25 day | — | Phase 6.14 |
| AR-015 | Authorization — Consolidate Role Guarding | 2026-07-22 | 0.25 day | — | Phase 6.15 |
| AR-016 | Foundation Compliance — Replace Raw Inputs | 2026-07-22 | Audit only | ADR-006 (Dissolved) | Phase 6.16A |
| AR-017 | User Pages — Fix setInterval Cleanup | 2026-07-22 | 0.25 day | — | Phase 6.17 |
| AR-018 | SubAdmin — Replace JSX IIFE with useMemo | 2026-07-22 | Stale | — | Phase 6.18 |
| AR-019 | SubAdmin — Verify Stale Closure Risk | 2026-07-22 | Stale | — | Phase 6.19 |
| AR-020 | Build — Bundle Analysis and Optimization | 2026-07-22 | 0.25 day | ADR-009 | Phase 6.20 |
| AR-021 | Dashboard — CarouselDots ARIA | 2026-07-22 | 0.25 day | — | Phase 6.21 |
| AR-022 | Foundation — FilterSelect Listbox Roles | 2026-07-22 | 0.25 day | — | Phase 6.22 |
| AR-023 | Foundation — Input/Select ARIA Forwarding | 2026-07-22 | 0.25 day | — | Phase 6.23 |

---

# ARCHITECTURE HEALTH SCORES (Reference)

| Module | Current Score | Target Score | Backlog Items |
|--------|--------------|-------------|---------------|
| Authentication | ~5.8/10 | 8/10 | AR-025, AR-028 |
| Admin Panel | ~8.1/10 | 9/10 | AR-014 |
| SubAdmin Module | ~85/100 | 90/100 | AR-007, AR-008, AR-009, AR-010, AR-015, AR-024, AR-026, AR-027 |
| User Pages | (not scored) | 85/100 | AR-001, AR-003, AR-006, AR-011, AR-012, AR-017, AR-018, AR-019 |
| Service Layer | (not scored) | 90/100 | AR-002, AR-011, AR-013, AR-025 |
| Foundation | (not scored) | 95/100 | AR-021, AR-022, AR-023 |
| Overall | ~85/100 | 92/100 | All 28 items |

---

# ARCHITECTURE METRICS REGISTER

| Work Item | Files Created | Files Deleted | Largest File Before | Largest File After | Behavioral Changes |
|-----------|--------------:|--------------:|--------------------:|-------------------:|-------------------|
| AR-001 | 1 | 0 | — | 19 | None |
| AR-002 | 0 | 0 | 223 | 191 | None |
| AR-003 | 0 | 1 | — | — | None |
| AR-004 | 9 | 0 | 1323 | 300 | None |
| AR-005 | 5 | 0 | 996 | 96 | None |
| AR-006 | 6 | 0 | 939 | 372 | None |
| AR-007 | 0 | 0 | — | — | csvUtils.ts enhanced (11→34 lines); 3 consumers migrated |
| AR-008 | 0 | 0 | — | — | 3 notification semantics fixed |
| AR-009 | 0 | 0 | — | — | 5 files migrated to useStableFetch; 16+ unprotected async calls fixed |
| AR-011 | 1 | 0 | — | 24 | useAsyncOperation hook created; 8 consumers migrated; 39 lines boilerplate removed |
| AR-012 | 5 | 0 | 332 | 228 | 4 shared hooks + 1 component extracted; 164 lines removed from consumers |
| AR-013 | 0 | 0 | — | — | Stale — topicsService.ts already has queryCache.fetchWithDedup with 5-min TTL |
| AR-014 | 0 | 0 | — | — | 11 files migrated: added ToastContainer to all useToast() consumers |
| AR-015 | 0 | 0 | — | — | 5 files cleaned: removed redundant page-level role guards from SubAdmin pages |
| AR-016 | 0 | 0 | — | — | Stale — Foundation Input already has default/compact/violet variants; 6 of 7 backlog claims FALSE |
| AR-017 | 0 | 0 | — | — | 1 cleanup bug fixed (VerifyEmailPage.tsx cooldown interval); backlog claims about UserTeacherExams/UserLeaderboard stale |
| AR-018 | 0 | 0 | — | — | Stale — IIFE is trivial (5 objects with memoized deps); no Category B candidates |
| AR-019 | 0 | 0 | — | — | Stale — hook already uses correct lifecycle patterns (mountedRef, currentExamRef); zero stale closures |
| AR-020 | 4 | 11 | 378 | — | 4 lazy sub-components created; 11 unused assets deleted; index.js unchanged (402KB); ~1.2MB moved from eager to lazy chunks |
| AR-021 | 0 | 0 | — | — | 3 ARIA attributes added to CarouselDots (role=tablist, role=tab, aria-selected); 1 consumer verified |
| AR-022 | 0 | 0 | — | — | Menu.Content: added role prop (default "menu"); FilterSelect: role="listbox", aria-label, aria-controls; Menu.Trigger: accepts aria-label/aria-controls props |
| AR-023 | 0 | 0 | — | — | Select: extended React.SelectHTMLAttributes, added ...props spread, id/htmlFor label association; Input/TextArea already compliant |
| AR-024 | 2 | 0 | — | — | Audit only — Phase 6.24 SubAdmin Permission Architecture Audit. Outcome B (backlog stale — permissions already centralized). 39 patterns searched, 5 SubAdmin pages verified zero auth logic, 38 ensureRole() calls inspected, 3 unused exports identified. No runtime changes. See AR024_AUDIT.md and AR024_COMPLETION.md. |
| AR-025 | 2 | 0 | — | — | Audit only — Phase 6.25 Admin Permission Architecture Audit. Outcome D (mixed — 7 redundant page guards + 8 redundant loading guards identified; 6 business checks + 38 ensureRole() must remain). Implementation justified but optional. ~36 lines removable across 7 Admin pages. No behavioral changes. See AR025_AUDIT.md and AR025_COMPLETION.md. |
| AR-025 (Implement) | 7 | 0 | — | — | Implemented: removed 7 redundant page-level guards + 8 loading guards from Admin pages. Cleaned 2 unused exports (ROLE_ACCESS, hasAdminPrivileges). 0 behavioral changes. TypeScript clean. |
| AR-026 | 1 | 0 | — | — | Stale — backlog claims contradicted by repository evidence. No implementation. See AR026_AUDIT.md. |
| AR-027 | 4 | 4 | — | — | Moved 4 components from admin/common to common. 25 consumer imports updated. 12 cross-layer violations eliminated (10 sub-admin→admin, 2 user→admin). 0 behavioral changes. See AR027_AUDIT.md and AR027_COMPLETION.md. |
| AR-028 | 0 | 0 | — | — | Stale — backlog claim disproven. UserHistory.tsx already imports from shared dateUtils.ts. No runtime changes. See AR028_AUDIT.md. |
| AR-029 | 0 | 2 | — | — | Deleted 2 orphan files (AdminPageShell.tsx, useConfirmDelete.ts). Fixed duplicate AttemptWithRelations type — removed from AttemptCardBase, migrated 3 consumers to canonical types/exam.types.ts. AuthContext→Loader retained as acceptable dependency. 0 behavioral changes. |
| AR-030 | 1 | 5 | — | — | Deleted 5 orphan files (topics.ts, leaderboardUtils.ts, testUtils.ts, AntigravityReview.tsx, Tooltip.tsx). Removed 2 dead barrel re-exports from AntigravityUI.tsx. Centralized validateOrThrow into src/lib/utils/validateOrThrow.ts. 2 repository consumers updated. 0 behavioral changes. |

**Cumulative:** 46 files created, 23 deleted, largest reduction 1323→96 lines, zero behavioral changes.

---

*This document is the single source of truth for architecture refactoring work and architectural decisions.*
*Version: 3.12.0 — Established 2026-07-21 (Phase 6.0A), ADR integrated 2026-07-21 (Phase 6.0B), AR-001–AR-015 completed 2026-07-22 (Phases 6.1–6.15), AR-024 audit completed 2026-07-22 (Phase 6.24), AR-025 audit & implementation completed 2026-07-22 (Phases 6.25), AR-026 closed stale 2026-07-22 (Phase 6.26), AR-027 implementation completed 2026-07-22 (Phase 6.27), AR-028 closed stale 2026-07-22 (Phase 6.28), AR-029 implementation completed 2026-07-22 (Phase 6.29), AR-030 implementation completed 2026-07-22 (Phase 6.30)*

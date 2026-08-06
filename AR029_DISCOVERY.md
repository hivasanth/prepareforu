# AR-029 — Discovery Audit Report

## Date
2026-07-22

## Executive Summary

Full repository-wide architecture discovery audit completed. 277 files inventoried across 10 layers.

**Architecture is generally clean:**
- Zero page-to-page imports
- Zero component-to-page imports
- Zero service/repository layering violations
- Zero cross-panel imports (after AR-027)
- Proper layer ordering throughout

**Three repository-backed candidates identified for AR-029:**

| Rank | Candidate | Impact | Risk | Effort |
|:----:|-----------|--------|:----:|:------:|
| 1 | Delete dead code (2 files) | Remove unused code | None | < 1h |
| 2 | Eliminate duplicate `AttemptWithRelations` type | Remove duplication, fix 3 consumers | Low | < 1h |
| 3 | Remove AuthContext → Loader component dependency | Fix layering violation | Low | < 1h |

**Decision: AR-029 is justified.** Proposed title: *Remove Dead Code and Correct Remaining Architecture Violations*.

---

## 1. Repository Inventory

| Layer | Directory | Count |
|-------|-----------|:-----:|
| Pages | `src/pages/` | 52 |
| Components | `src/components/` | 140 |
| Hooks | `src/hooks/` | 19 |
| Context | `src/context/` | 3 |
| Services | `src/services/` | 17 |
| Repository | `src/lib/` | 13 |
| Utils | `src/utils/` | 21 |
| Types | `src/types/` | 5 |
| Constants | `src/constants/` | 2 |
| Validations | `src/validations/` | 5 |
| **Total** | | **277** |

---

## 2. Pattern Discovery — Results

### Hook/Workflow Patterns
- `mountedRef` defined in 2 places (`useStableFetch`, `usePortalLaunch`) but widely reused — no consolidation justified
- `useMemo` used 61+ times across the codebase — natural React usage, no consolidation needed
- `useCallback` used 100+ times — natural React usage
- `loading`/`error` state proliferation is widespread but each usage is context-specific — no generic abstraction would help

### UI Duplication
- `AdminModal` is the single modal shell (centralized in AR-027) ✅
- `ConfirmModal` wraps `AdminModal` — single implementation ✅
- `Skeleton`/`EmptyState` centralized in `SharedComponents.tsx` ✅
- `Card` centralized in `AntigravityCard.tsx` ✅
- `PageContainer` centralized in `AntigravityLayout.tsx` ✅

### Cache Patterns
- 3 overlapping cache layers: `queryCache` (util), `adminQueryCache` (SWR), inline service caching
- `useSupabaseQuery` duplicates `adminQueryCache` logic
- **Deferred** — medium risk, not recommended for this AR

### Foundation Violations (DS-007)
- `PromptEditorModal` and `AddExamModal` bypass `AdminModal` — use raw `fixed inset-0`
- ~72 inline `rounded-2xl`, 23 `backdrop-blur`, 8 `text-2xl font-black` bypassing DS components
- **Deferred** — cosmetic/speculative, not recommended for this AR

---

## 3. Candidate Inventory (Quantified)

### Candidate 1: Dead Code Removal
| File | Lines | Status |
|------|:-----:|--------|
| `src/components/admin/common/AdminPageShell.tsx` | 28 | **Unused** — never imported anywhere |
| `src/hooks/useConfirmDelete.ts` | 31 | **Unused** — never imported anywhere |
| **Total** | **59** | |

**Verification:** grep for each export name across entire codebase returns 0 results (excluding self-references).

### Candidate 2: Duplicate Type Definition
| File | Lines | Defines | Status |
|------|:-----:|---------|--------|
| `src/types/exam.types.ts:106-109` | 4 | `AttemptWithRelations extends Attempt` | ✅ Primary source |
| `src/components/common/AttemptCardBase.tsx:5-8` | 4 | `AttemptWithRelations extends Attempt` | ❌ Duplicate |

**Consumers on the wrong source:**
| Consumer | Current Import | Correct Import |
|----------|---------------|----------------|
| `AttemptCardBase.tsx` | Self-defined | `types/exam.types.ts` |
| `UserHistory.tsx:28` | `AttemptCardBase` | `types/exam.types.ts` |
| `useDashboardData.ts:4` | `AttemptCardBase` | `types/exam.types.ts` |

### Candidate 3: Context→Component Dependency
| File | Line | Violation |
|------|:----:|-----------|
| `src/context/AuthContext.tsx` | 16 | Imports `Loader` from `../components/Loader` |
| | 54 | Uses `<Loader />` inside `FullLoader` inline component |

**Fix:** Inline the 23-line Loader JSX directly in `FullLoader` — removes the import entirely.

---

## 4. Ownership Audit

| Responsibility | Current Owner | Duplicate? | Correct? |
|---------------|--------------|:----------:|:--------:|
| `AttemptWithRelations` type | `types/exam.types.ts` + `AttemptCardBase.tsx` | **Yes** | No |
| Full-page loader for auth | `AuthContext.tsx` (imports from `Loader.tsx`) | No — but dependency direction wrong | No |
| Admin page shell wrapper | `AdminPageShell.tsx` | Never used — zero consumers | Orphan |
| Confirmation delete workflow | `useConfirmDelete.ts` | Never used — zero consumers | Orphan |

---

## 5. Dead Code Audit (Verified)

| File | Reason | Verdict |
|------|--------|:-------:|
| `src/components/admin/common/AdminPageShell.tsx` | grep for `AdminPageShell` returns only self-reference | ✅ Delete |
| `src/hooks/useConfirmDelete.ts` | grep for `useConfirmDelete` returns only self-reference | ✅ Delete |
| `src/utils/dateUtils.ts:formatDateShort` | grep for import returns 0 | ⏸️ AR-028 (stale) |
| `src/utils/dateUtils.ts:formatDateJoined` | grep for import returns 0 | ⏸️ AR-028 (stale) |

False positives from initial scan (actually used):
- `LoadingOverlay.tsx` — imported via `AntigravityUI.tsx` → used in `DailyAttemptsChart.tsx`
- `ChartVisualizer.tsx`, `MapVisualizer.tsx`, `MathBlock.tsx`, `MermaidDiagram.tsx` — lazy-loaded via `React.lazy` in `QuestionVisualizer.tsx`

---

## 6. Dependency Graph Audit

```
Pages
  │
  ▼
Hooks ──── Context
  │          │
  ▼          ▼
Services
  │
  ▼
Repositories
  │
  ▼
Supabase
```

**Violations found:**
1. Hook (`useDashboardData.ts`) imports type from Component (`AttemptCardBase`) — **1 violation**
2. Context (`AuthContext.tsx`) imports UI Component (`Loader`) — **1 violation**

**Zero violations in:** page→page, component→page, service→component, service→page, repository→service, repository→component, repository→page, cross-panel.

---

## 7. Ranked Candidates

| Rank | Candidate | Score | Files | Lines | Risk | Effort |
|:----:|-----------|:-----:|:-----:|:-----:|:----:|:------:|
| 1 | Delete dead code | 10/10 | 2 | 59 | None | < 1h |
| 2 | Fix duplicate type + migrate consumers | 9/10 | 4 | 12 | Low | < 1h |
| 3 | Fix AuthContext→Loader dependency | 8/10 | 2 | 30 | Low | < 1h |
| 4 | Cache consolidation (deferred) | 5/10 | Many | High | Medium | Days |
| 5 | DS-007 modal/migration (deferred) | 4/10 | 2 | 100+ | Low | Days |

---

## 8. AR-029 Decision

**✅ AR-029 is justified.** Three repository-backed candidates with objective evidence.

## AR-029: Remove Dead Code and Correct Remaining Architecture Violations

| Field | Value |
|-------|-------|
| **ID** | AR-029 |
| **Area** | Repository-wide — Architecture |
| **Priority** | Low |
| **Effort** | 0.5 day |
| **Status** | Proposed |
| **Dependencies** | None |
| **Source** | Discovery audit 2026-07-22 |
| **ADR** | No |

### Scope A: Dead Code Removal
- Delete `src/components/admin/common/AdminPageShell.tsx` (28 lines, zero consumers)
- Delete `src/hooks/useConfirmDelete.ts` (31 lines, zero consumers)

### Scope B: Fix Duplicate Type Definition
- Remove `AttemptWithRelations` interface from `AttemptCardBase.tsx` (lines 5-8)
- Import `AttemptWithRelations` from `types/exam.types.ts` instead
- Update `UserHistory.tsx` to import `AttemptWithRelations` from `types/exam.types.ts`
- Update `useDashboardData.ts` to import `AttemptWithRelations` from `types/exam.types.ts`

### Scope C: Fix Context → Component Dependency
- Replace `Loader` import in `AuthContext.tsx` with inline JSX
- Remove the `import Loader from '../components/Loader'` line

### Success Criteria
- [ ] AdminPageShell.tsx deleted — no broken imports
- [ ] useConfirmDelete.ts deleted — no broken imports
- [ ] AttemptWithRelations defined only in `types/exam.types.ts` — zero duplicates
- [ ] UserHistory.tsx imports from types layer, not component layer
- [ ] useDashboardData.ts imports from types layer, not component layer
- [ ] AuthContext.tsx does not import any UI component
- [ ] TypeScript clean
- [ ] Build passes
- [ ] Existing tests pass unchanged

---

## 9. ADR Decision

**No ADR required.** All three candidates are routine cleanup:
- Dead code deletion — no behavioral impact
- Type deduplication — identical definition, zero behavioral change
- AuthContext inline — identical UI rendering, zero behavioral change

No architectural boundary changes, no ownership model changes, no dependency direction changes.

---

## 10. Verification Plan

| Check | Method |
|-------|--------|
| TypeScript | `npx tsc --noEmit` |
| Build | `npm run build` |
| Tests | `npx vitest run` |
| No broken imports | grep for deleted exports after deletion |
| No duplicate types | grep for `AttemptWithRelations` — must return exactly 1 definition |
| AuthContext clean | grep for `import.*Loader` in context/ — must return 0 |

---

## 11. Governance

Status: **Proposed** — not yet implemented.

If accepted and implemented:
- Update `ARCHITECTURE_BACKLOG.md` with AR-029 entry
- Update Metrics Register
- Update version to 3.11.0
- Mark AR-029 as Completed

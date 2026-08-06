# AR-011 Completion Report — Introduce Canonical useAsyncOperation Hook

**AR:** AR-011  
**Date:** 2026-07-22  
**Status:** ✅ COMPLETE

---

## 1. Problem Statement

30+ async workflows across the codebase used inconsistent patterns for managing loading states, error handling, and mounted-state protection. Manual `try/catch/finally` blocks with `setLoading(true/false)` were repeated in every consumer, creating duplication and potential stale-state bugs.

## 2. Solution Delivered

### 2.1 New Hook: `useAsyncOperation`

**File:** `src/hooks/useAsyncOperation.ts` (24 lines)

```ts
export function useAsyncOperation<T = void>(initialLoading = false) {
  const [loading, setLoading] = useState(initialLoading)
  const { mountedRef, nextId, isStale } = useStableFetch()

  const execute = useCallback(async (fn: () => Promise<T>): Promise<T | undefined> => {
    setLoading(true)
    const id = nextId()
    try {
      const result = await fn()
      if (isStale(id)) return undefined
      return result
    } catch (err) {
      if (isStale(id)) return undefined
      throw err
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  return { loading, execute }
}
```

**Key features:**
- Wraps any async function with loading state management
- Integrates `useStableFetch` for mounted-state protection and stale-request detection
- Configurable initial loading state (default: `false`)
- Re-throws errors after stale check (consumers can catch for error handling)
- Generic return type `T` for typed results

### 2.2 Consumers Migrated (7 files)

| File | Pattern Before | Pattern After | Lines Removed |
|------|----------------|---------------|---------------|
| `src/pages/exam/ReviewPage.tsx` | try/catch/finally + setLoading | execute + try/catch | 7 |
| `src/pages/FinishSignInPage.tsx` | try/catch/finally + setLoading | execute + try/catch | 8 |
| `src/pages/admin/AdminSettings.tsx` | try/catch/finally + setIsLoading | execute + try/catch | 5 |
| `src/pages/admin/AdminTopics.tsx` | try/finally + setIsLoading | execute + try/catch | 4 |
| `src/hooks/useNotifications.ts` | try/catch/finally + setLoading | execute | 6 |
| `src/components/admin/settings/AddExamModal.tsx` | try/catch/finally + setIsSubmitting | execute + try/catch | 3 |
| `src/hooks/useConfirmDelete.ts` | try/finally + setIsDeleting | execute | 4 |

**Total lines removed:** 37 (boilerplate eliminated)

## 3. Migration Pattern

**Before (manual lifecycle):**
```ts
const [loading, setLoading] = useState(false)

const doWork = useCallback(async () => {
  setLoading(true)
  try {
    await someAsyncWork()
  } catch (err) {
    showError(err.message)
  } finally {
    setLoading(false)
  }
}, [])
```

**After (canonical lifecycle):**
```ts
const { loading, execute } = useAsyncOperation()

const doWork = useCallback(async () => {
  try {
    await execute(async () => {
      await someAsyncWork()
    })
  } catch (err) {
    showError(err.message)
  }
}, [execute])
```

## 4. Design Decisions

1. **`execute` throws on error** — Consumers that need custom error handling (e.g., `showError`) wrap `execute` in try/catch. Consumers that let errors propagate (e.g., `useConfirmDelete`) don't need a catch.

2. **`initialLoading` parameter** — Pages that load data on mount (ReviewPage, AdminSettings) pass `true` to avoid flash of empty content. Button-triggered operations default to `false`.

3. **Delegates to `useStableFetch`** — No new mounted-state logic; reuses the existing 19-line canonical hook.

4. **Single loading state** — Components with multiple independent async operations (e.g., AdminSettings with `isSaving`) retain separate `useState` for those. `useAsyncOperation` handles the primary loading state only.

## 5. Exclusions (Not Migrated)

| Consumer | Reason |
|----------|--------|
| `SubAdminCreate.tsx` (handleCreate) | Already migrated to useStableFetch (AR-009); different pattern |
| `SubAdminDashboard.tsx` (loadDashboard) | Promise.all pattern; already migrated (AR-009) |
| `useExamData.ts` (loadExamData) | Promise.all pattern; already migrated (AR-009) |
| `useBulkUpload.ts` | Complex multi-step lifecycle; custom pattern |
| `AuthContext.tsx` | Infrastructure; separate concerns |
| `useSupabaseQuery.ts` | Infrastructure; separate concerns |
| `useExamSession.ts` | Optimistic updates; different lifecycle |
| `useQuestionNavigation.ts` | Timer + ref-based; different lifecycle |
| `useAsyncRetry.ts` | Retry wrapper; different concerns |

## 6. Verification

- **Tests:** 79/79 pass (unchanged from baseline)
- **Build:** Compiles clean (no new warnings)
- **6 pre-existing ESM errors:** Unrelated (`@csstools/css-calc` require() of ESM)

## 7. Impact on Architecture Metrics

| Metric | Before | After |
|--------|--------|-------|
| Files with manual try/catch/finally for loading | 23 | 16 |
| Files using canonical `useAsyncOperation` | 0 | 7 (+ 12 existing useStableFetch = 19 total canonical) |
| New hook created | — | 1 (24 lines) |
| Lines of boilerplate removed | — | 37 |

## 8. ADR

**ADR-008:** Accepted — `useAsyncOperation` is the canonical hook for async lifecycle management in this codebase.

---

**Completed by:** opencode  
**Reviewed:** Self-reviewed  
**Governance:** FOUNDATION_GOVERNANCE.md v1.14.0

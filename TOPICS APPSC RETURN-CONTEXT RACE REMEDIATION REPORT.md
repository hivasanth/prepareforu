# /TOPICS APPSC RETURN-CONTEXT RACE REMEDIATION REPORT

## 1. Root Cause

`src/components/user/topics/useTopics.ts` → `loadTopics`:

- `nextId()` was called **only on the network-fetch path**, after the
  invalid-context and cache-hit early returns.
- The invalid-context path and the warm-cache path therefore did **not**
  advance `requestId.current`.
- A request still in flight from a *previous* context (B) was still considered
  current when the user returned to an already-cached context (A), because no
  new id had been allocated.
- B's late response (empty `[]` when B's subject has no published topics)
  passed the `isStale(id)` check and overwrote A's cache-restored topics →
  "No topics found". A full reload worked because the fresh page had no
  in-flight request left to clobber the restore.

## 2. Before Flow

```
A first load      → id=1 → fetch(A) → 13 topics → cached          ✓
switch to B       → (B, all, all) invalid → return  (id stays 2 after B fetch)
                    → id=2 → fetch(B) in flight
return to A       → (A, all, all) invalid → return  (id stays 2)
                    → (A, 926c, all) invalid → return (id stays 2)
                    → (A, 926c, H&C) cache HIT → setTopics(13), return  (id stays 2)
B resolves []     → isStale(2)=false → setTopics([])               ✗ EMPTYSTATE
reload            → fresh mount, cache hydrate, no in-flight       ✓ 13 topics
```

## 3. After Flow

```
A first load      → id=1 → fetch(A) → 13 topics → cached          ✓
switch to B       → id=2 (invalid path also advances)
                    → id=3 → fetch(B) in flight
return to A       → id=4 (invalid path) → id=5 (cache HIT) → setTopics(13)
B resolves []     → isStale(3)=true → discarded                    ✓ A remains
reload            → identical cache restore                        ✓ 13 topics
```

## 4. Request ID Fix

`const id = nextId()` is now the **very first** executable statement inside
`loadTopics`, before the invalid-context check and before the cache-hit path.

- Every invocation — including invalid-context and cache-hit runs — advances
  `requestId.current`.
- The instant the context changes away from an in-flight request, that request
  becomes stale (`id !== requestId.current`) and its response is discarded.
- The warm-cache fast path is preserved: it still hydrates from the exact
  context key and returns without a fetch — it now *also* invalidates every
  older in-flight request.

## 5. Context Identity Guard

Added a file-local canonical helper in `useTopics.ts`:

```ts
function getTopicsContextKey(examId, paperId, subjectName): string {
  return `${examId}|${paperId}|${subjectName}`
}
```

`loadTopics` captures `const contextAtCall = getTopicsContextKey(...)` at call
time and, after every `await`, verifies **both**:

```
if (isStale(id) || contextAtCall !== getTopicsContextKey(selectedExam, selectedPaper, selectedSubject)) return false
```

This is a second, context-identity defense that is independent of the shared
request-id primitive. No global abstraction was created; the helper is local to
`useTopics.ts`.

## 6. Cache Behavior

Unchanged and correct. The cache key
`study_topics_data_${exam}_${paper}_${subject}`, `queryCache`, TTL (300s),
T-M4 empty-not-cached, and prefix isolation are all untouched. The audit proved
the cache remained intact during the regression; this fix does not modify it.

## 7. Error Race Protection

- **Stale success / stale empty:** both go through the combined guard before
  `setTopics` — discarded.
- **Stale failure:** the `catch` path applies the same guard *before*
  `captureNetworkError`, so a late B failure can never surface an
  ErrorContainer/error in context A.
- **Loading state:** the `finally` block only clears loading when the id is
  current **and** the context still matches, so a stale request can neither
  turn off nor corrupt the current context's loading state.
- **activeTopic:** derived from `topics` + `?topic=` URL param; because stale
  responses can no longer mutate `topics`, the reader state is protected too.

## 8. Tests

Extended the existing `/topics` suite (`src/ds034-topics.test.tsx`) with a
race-condition describe block using the project's existing patterns
(deferred-promise repo mocks + `router.navigate` URL-driven context changes):

| Test | Scenario | Result |
| --- | --- | --- |
| R1 | B in flight → A cache-restored → B returns `[]` | **Pass** — A topics remain (the exact regression) |
| R2 | B in flight → A cache-restored → B fails | **Pass** — A remains, no B error |
| R3 | A→B→C→A with overlapping responses | **Pass** — only A mutates the UI |
| R4 | In-flight A response + URL becomes invalid | **Pass** — response ignored |
| R5 | Normal cached load (no warm-cache regression) | **Pass** |
| R6 | Normal cold load (no fetch regression) | **Pass** |

`npx vitest run --config vitest.audit.config.ts src/ds034-topics.test.tsx` →
**20/20 passed** (14 pre-existing + 6 new).

Full audit-config run: **344 passed / 34 failed** — the 34 failures are the
same pre-existing files (ds003, ds005, ds014, ds031; Foundation
material/page-mount tests, none import changed code). `npm test` (default
config): **165 passed / 13 `ERR_REQUIRE_ESM` worker errors** — identical to the
pre-existing environmental baseline.

## 9. Runtime Validation

`e2e/topics-race.spec.ts` — real page, real hooks, real backend; only the
B/C (empty-topic) `study_topics` responses are intercepted to make the race
deterministic. **5/5 passed.**

| Check | Scenario | Result |
| --- | --- | --- |
| R1 | A→B→A, B delayed 3s (returns `[]`) | **Pass** — A topics remain after B lands |
| R2 | A→B→A, B fulfilled `[]` | **Pass** — A topics remain |
| R3 | A→B→A, B aborts (fails) | **Pass** — A topics remain, no error |
| R4 | A→B→C→A, overlapping B/C responses | **Pass** — only A mutates the UI |
| R5 | Full reload of A | **Pass** — cache restore, identical behavior |

Regression: `e2e/topics-runtime.spec.ts` — **6/6 passed** (cold load, warm
reload, business-empty, error/retry, reader navigation, invalid topic).
No LIVE data created, modified, or deleted (response interception only).

## 10. Build / Type / Lint

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass (pre-existing chunk-size warnings only) |
| `npx eslint` on `useTopics.ts` + `ds034-topics.test.tsx` | 0 problems |
| `npm run lint` (repo) | pre-existing baseline only; **none** in touched files |

## 11. LIVE Database Impact

```
Database:   NO CHANGE
RLS:        NO CHANGE
Migrations: NO CHANGE
```

## 12. Regression Check

The change is page-local to `useTopics.ts` (one module-level helper + the
`loadTopics` body). No shared hook (`useStableFetch`, `usePageError`),
`queryCache`, selection hooks, or UI components were touched. Focused
regression run: `ds034-topics.test.tsx` 20/20, `topics-runtime` 6/6,
`topics-race` 5/5; full audit suite failure count unchanged (34 pre-existing).

## 13. Remaining Issues

- Pre-existing environmental: default `npm test` cannot start a worker for
  ~13 files (`ERR_REQUIRE_ESM`, `@csstools/css-calc`) — the project's
  `vitest.audit.config.ts` is the canonical runner.
- Pre-existing, out of scope: Foundation material/page-mount test flakiness
  (ds003/ds005/ds014/ds031) and an independent stale-papers cascade inside the
  shared tabs hook during rapid exam switches (it self-corrects and the final
  URL state converges; the directive limits this fix to `useTopics`).
- No new issues introduced by this change.

## 14. Final Verdict

**PUBLISH-READY.**

All publish-ready gates satisfied: `nextId()` advances on every `loadTopics`
invocation; invalid-context and cache-hit invocations invalidate previous
requests; stale success/empty/error/loading responses cannot affect the current
context; the context-identity guard exists; warm cache still renders
immediately with no forced refetch; no `queryCache`/`useStableFetch`/
`usePageError`/DB/RLS changes; 20/20 unit tests, 5/5 targeted runtime race
checks, 6/6 `/topics` regression checks, and full-suite failure count
unchanged. A→B→A now correctly keeps A's topics, and reload behaves
identically.

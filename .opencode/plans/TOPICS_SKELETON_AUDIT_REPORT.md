# [TOPICS — STUDY TOPICS PAGE] — COMPLETE SKELETON AUDIT

Route: `/topics` · Page: `src/pages/user/UserTopics.tsx`
Scope: `/topics` and directly reachable loading states (selection-tab fetches, list load, warm cache, filter changes, retry, reader navigation).
Mode: **READ-ONLY** — no code/CSS/tokens/animations/backend modified. Report only.

> Audit rule applied: **final component geometry determines skeleton geometry**; the **approved skeleton system** (`/dashboard`, `/exams`, `/history`, `/performance`) determines material/elevation language. Central question — *at every point where the user waits for async content, does the skeleton look and behave like the content that will actually appear?*

---

## 1. Page Architecture & Loading States Inventory

| Async wait point | Source | Skeleton provided? | Verdict |
|---|---|---|---|
| Route chunk load (first visit to `/topics`) | `App.tsx:37,100` lazy → `SidebarLayout.tsx:300-306` `<Suspense>` | Generic full-height `Spinner size="md"` | ACCEPTABLE (tiny chunk, cached after first load) |
| Exam / paper / subject tabs fetch | `AdminSelectionTabs.tsx` → `useExamPaperSubjectSelection` (`fetchActiveExams`, adminService, `useSupabaseQuery`) | **NONE** — hollow empty tab track | **DEFECT (TS-1, MEDIUM)** |
| Topics list fetch (cold load) | `useTopics.ts` → `topicsService.fetchTopics` → `topic.repository.fetchPublishedTopics` (limit 200) | `TopicListViewSkeleton` (list + header only) | PRESENT, but preceded by false-empty flash (**FL-1, MEDIUM**) |
| Warm-cache return visit | `useTopics.ts:89` `hasCachedTopics()` early return | **None — page renders EMPTY STATE with data in cache** | **DEFECT (W-1, HIGH)** |
| Filter change (exam/paper/subject) | URL param change → `loadTopics` re-run | **None — stale list persists, no indicator, header mismatch** | **DEFECT (TS-3, HIGH)** |
| Retry after error | `ErrorContainer` → `RetryButton` → `loadTopics(true)` | Full list skeleton (correct) | PASS |
| List → reader → list | `openTopic`/`goNext`/`goPrev` — inline, data prefetched | Not needed (no async) | PASS |
| Empty result (real) | `topics = []` after successful fetch | EmptyState ("No topics found for this subject yet.") | PASS |

Key architecture: URL is the single source of truth (`useSearchParams`); context invalid when `exam/paper/subject` = `all`. `TopicReader` is internal state (no route), so no reader skeleton is ever required — the list fetch prefetches all section content.

## 2. Initial Loading (Cold Load)

Sequence: route chunk (spinner) → `UserSelectionTabs` (blank track) + **false-empty flash** → `TopicListViewSkeleton` → content.

- No URL params: render #1 shows the correct "Select a Subject" context-empty; normalization sets a default exam → render #2 shows **"No topics found for this subject yet."** (one frame) → skeleton. **FL-1.**
- URL params present + valid: render #1 hits `topics.length === 0` → **false empty flash** before the effect sets `isLoading=true` → skeleton.

## 3. Final UI vs Skeleton — Geometry

`TopicListView`: `space-y-6` wrapper, header `mb-6` (H2 text-lg + Body text-xs), rows `space-y-3`.
`TopicCard`: `Card variant="default"` `p-4`, `flex items-center gap-4`, `PremiumIconContainer w-11 h-11 rounded-xl`, H3 text-sm truncate (+ optional `title_te` Body), `ChevronRight size={18}`.

| Element | Final | Skeleton | Match |
|---|---|---|---|
| Page wrapper / gaps | `space-y-6` + header `mb-6` (48px) | identical | ✓ |
| Row gap | `space-y-3` (12px) | identical | ✓ |
| Row height | `16 + 44 + 16 = 76px` | **`16 + (16+44+16) + 16 = 108px` — double padding** | **✗ TS-G2 (MEDIUM)** |
| Icon | `44×44`, radius 12 (`rounded-xl`) | `44×44`, `borderRadius=16` | ✗ TS-G3 (LOW) |
| Title / subtitle | text-sm (1 line) + optional text-xs | 2 bars always (70% / 50%) | ✗ TS-G3 (LOW) |
| Chevron | 18px | 18×18 | ✓ |
| Header bars | H2 ~28px lh / Body ~16px | 22px / 16px | ✓ close |

**TS-G2 root cause:** the `Skeleton type="card"` receives `pad="p-4"` AND the inner content div adds its own `p-4` (`TopicListViewSkeleton.tsx:68`) → 32px inset on every side; rows render ~42% taller than the real cards. The approved `/performance` pattern relies on the outer card padding only.

## 4. Light/Dark Material

Skeleton uses the premium family via the `Skeleton` primitive (token-driven, `skeleton-surface`, gold light material). **Final `Card variant="default"` also carries `GOLD_LIGHT_MATERIAL` + `CARD_HOVER`** (`AntigravityCard.tsx:53`) → the gold light-mode language is a **true match**, not an overstatement. No hardcoded colors anywhere in the skeleton. PASS (5/5).

## 5. 3D / Elevation Language

Final default card = `shadow-card-shadow` + `CARD_HOVER` lift. Skeleton = `shadow-card-hover-3d` + `-translate-y-1` (hovered state), matching the ONE elevation language used by all approved skeletons. PASS (5/5).

## 6. Responsive (390 / 768 / 1280)

- List: single-column stack at all breakpoints; skeleton stacks identically. ✓
- Card padding: final overrides `md:p-5` with `p-4`; skeleton `p-4` → consistent. ✓
- Selection region: primary track `h-[44px] md:h-[52px]`, secondary `h-[40px] md:h-[44px]` — height reserved even when empty (no layout jump), but renders a **hollow bordered strip** with no skeleton pills during fetch (**TS-1**).
- No horizontal overflow from the skeleton (bars are %-based inside `flex-1 min-w-0`). ✓

## 7. Filter / Tab-Change Transitions

**TS-3 (HIGH):** `setSelectedSubject/Paper/Exam` call `setActiveTopic(null)` but never clear `topics`. During the fetch the old list persists with **zero loading feedback**, and the header renders `selectedSubject` (the NEW label) above OLD rows → content/header mismatch. Exam/paper changes force `subject: 'all'` → `isContextValid=false` → `loadTopics` returns early, but because `topics.length > 0` the page skips the context-empty branch and keeps showing the **stale list under an "All" header** through the entire auto-cascade (paper → subject). Race-safety is otherwise correct (`useStableFetch` `isStale` — stale responses discarded). PASS on data race, FAIL on UX/fidelity.

## 8. Error / Empty / Retry

- Error: `captureNetworkError` → `topics=[]`, `isLoading=false` → ErrorContainer + RetryButton. ✓
- Retry: `loadTopics(true)` bypasses the cache gate, `isInitial` true → skeleton → content. ✓ (full-list skeleton on retry is appropriate).
- Real empty: successful fetch with 0 topics → correct EmptyState. ✓
- False empty (FL-1) and warm-cache empty (W-1) announce "No topics found" to sighted + SR users while loading/data exists. ✗

## 9. Navigation Flow (List → Reader → Back)

Reader is fully internal (`activeTopic` state, `motion.div` keyed by `topic.id`); all topic content arrives with the list fetch. No async per-topic load, no Suspense boundary needed, prev/next are instant array ops, return to list is instant. PASS (5/5). No skeleton required or expected at this stage.

## 10. Suspense / Lazy Boundaries

`SidebarLayout.tsx:300-306` wraps `<Outlet/>` with a generic centered `Spinner md` in `h-[calc(100vh-64px)]`. The `/topics` chunk is small and chunk-cached after first load; a structural skeleton here would be disproportionate. ACCEPTABLE (4/5). The one Suspense-shaped gap is the tabs' internal async fetch, which is NOT under a Suspense boundary — it needs a loading representation of its own (**TS-1**).

## 11. Cache / Warm-Load

**W-1 (HIGH):** `useTopics.ts:89-91` — `if (!force && hasCachedTopics()) return;` early-returns **without hydrating `topics` state**. `getCachedTopics` proves data exists (key `topics_data_{exam}_{paper}_{subject}`, 5-min TTL), but the page renders `topics.length===0` → **"No topics found for this subject yet."** for the full TTL window. A user navigating back to a recently viewed subject sees a false empty state; the real data is never painted. This is the single most user-visible defect on the page.

## 12. Accessibility

- Single `role="status" aria-live="polite" aria-label="Loading topics"` region wraps header bars + all rows; row cards are `decorative`, text-type header bars render no role. Exactly one live region — correct. ✓
- Defects FL-1/W-1/TS-3 cause SR users to be told "No topics found" while loading/data exists, and stale-content/header mismatch is not announced. ✗ (logic consequences, not skeleton markup).
- No focus trap / keyboard issue introduced by the skeleton. ✓

## 13. Reduced Motion

Skeleton uses `animate-pulse` (handled by the global CSS `prefers-reduced-motion` block); `SectionReveal` uses framer-motion but `MotionConfig reducedMotion="user"` collapses it. PASS (5/5).

## 14. CSS / Token / Override Audit

- No `!important`, no hardcoded hex colors, no inline shadows in the skeleton; everything token-driven. ✓
- Inline `borderRadius` overrides are scoped to the skeleton and match intent. ✓
- No page-level layout token violated; no interaction of the skeleton with sticky/backdrop regions. ✓
- One red flag: the double `p-4` (TS-G2) is a structural (not token) error.

## 15. Screenshot / Browser Evidence

READ-ONLY session — browser matrix (390/768/1280 × Light/Dark/Reduced-Motion × cold/filter/error/empty/loaded) was **not executed**. Dev server verified running at `http://localhost:5173` (HTTP 200). Cold-load frames must be captured to confirm the FL-1 one-frame flash and the hollow tab track; recommend executing the matrix during the fix pass. Score for this section reflects source-trace confidence only.

---

## Findings — Severity

| ID | Severity | One-line summary |
|---|---|---|
| **W-1** | **HIGH** | Warm cache: `loadTopics` early-returns without hydrating state → false "No topics found" for up to 5-min TTL |
| **TS-3** | **HIGH** | Filter/exam/paper changes keep stale rows with no loading feedback and a mismatched/“All” header |
| **FL-1** | MEDIUM | Cold load: one frame of false empty state before skeleton appears (SR also announces it) |
| **TS-1** | MEDIUM | Selection region: hollow empty tab track during fetch — no skeleton pills (unlike /history, /performance via `customExamTabs`) |
| **TS-G2** | MEDIUM | Double `p-4` in skeleton rows → 108px vs 76px (~42% taller) |
| **TS-G3** | LOW | Icon radius 16 vs 12; subtitle bar always rendered though `title_te` is optional; title bar 14px vs 20px line-height |
| — | INFO | Suspense fallback spinner acceptable (tiny chunk); browser matrix deferred |

## Fix Rules (per issue)

### FIX-TP-1 — W-1 (warm-cache hydration) · `useTopics.ts`
- PROBLEM: cached topics exist but are never rendered; false empty state for up to TTL.
- ROOT CAUSE: `loadTopics` gate returns before state hydration.
- FILE/SYMBOL: `src/components/user/topics/useTopics.ts` / `loadTopics`.
- CURRENT: `if (!force && hasCachedTopics()) return;`
- REMOVE: the early return.
- REPLACE: `if (!force) { const cached = getCachedTopics(selectedExam, selectedPaper, selectedSubject); if (cached) { setTopics(cached); setIsLoading(false); return; } }` — hydrate from cache, no network, no skeleton.
- MATERIAL: n/a (logic). RESPONSIVE: n/a. VALIDATION: load subject → navigate away → return within TTL → list paints instantly, no empty state.

### FIX-TP-2 — FL-1 (false-empty flash) · `UserTopics.tsx` + `useTopics.ts`
- PROBLEM: one frame of "No topics found" on cold load before the skeleton.
- ROOT CAUSE: `isLoading` initial `false`; empty branch not guarded while a load is pending.
- FILE/SYMBOL: `useTopics.ts` (`useState(false)`) + `UserTopics.tsx` (empty branch).
- CURRENT: `isLoading` starts `false`; empty branch `if (topics.length === 0) return <EmptyState/>`.
- REMOVE: n/a (state init).
- REPLACE: initialize `isLoading` to `true` (with FIX-TP-1 ensuring the cache path clears it) and keep the empty branch gated on `!isLoading && errorState !== 'error'`. Cold load then shows skeleton from frame #1; cache path resolves to list; error path resolves to ErrorContainer.
- MATERIAL/RESPONSIVE: n/a. VALIDATION: cold load at 390px — no empty-frame flash; skeleton first frame.

### FIX-TP-3 — TS-3 (filter-change stale content) · `useTopics.ts`
- PROBLEM: old rows shown under a new/"All" header with no loading feedback during any selection change.
- ROOT CAUSE: `setSelectedPaper/Exam` force `subject:'all'` (context invalid) but `topics` is never cleared, so the page bypasses both the context-empty and skeleton branches.
- FILE/SYMBOL: `useTopics.ts` / `setSelectedExam`, `setSelectedPaper`, `setSelectedSubject`.
- CURRENT: `updateParams(...); setActiveTopic(null)`.
- REMOVE: n/a.
- REPLACE: on any selection change, clear the visible list before it can mismatch the context — `setTopics([])` (in `setSelectedExam`/`setSelectedPaper`, and in `setSelectedSubject`) so the `isContextValid`/`isLoading` branches render the **skeleton** during the cascade and the subject change (list identity changes → Type-B skeleton is correct here).
- MATERIAL: existing skeleton. RESPONSIVE: n/a. VALIDATION: change exam/paper/subject → skeleton (not stale rows) while fetching; no "All"-header window; race-safe via `isStale`.

### FIX-TP-4 — TS-1 (selection-region loading) · `AdminSelectionTabs.tsx` / page
- PROBLEM: during exam/paper/subject fetches the selection region is a hollow empty track — no loading representation, no pills.
- ROOT CAUSE: `/topics` passes no `customExamTabs`; the tabs component receives `options=[]` and renders an empty bordered track.
- FILE/SYMBOL: `src/components/admin/shared/AdminSelectionTabs.tsx` (`useExamPaperSubjectSelection`).
- CURRENT: empty `Tabs` track `h-[44px] md:h-[52px]` during fetch.
- REMOVE: n/a.
- REPLACE: when options are still loading, render **skeleton pills** inside the existing track (reuse the approved pill-skeleton language from `/exams`) or pass `customExamTabs` metadata from `/topics` (the `/history`, `/performance` pattern). Track height already reserved → no layout jump; only pill fidelity is missing.
- MATERIAL: token-based pill skeleton. RESPONSIVE: keep track heights. VALIDATION: throttle network at 390/1280 → pills (not a blank strip) while tabs load; jump-free.

### FIX-TP-5 — TS-G2 (double padding) · `TopicListViewSkeleton.tsx`
- PROBLEM: rows render ~108px vs 76px final.
- ROOT CAUSE: outer `pad="p-4"` + inner `<div className="... p-4">`.
- FILE/SYMBOL: `TopicListViewSkeleton.tsx:68`.
- CURRENT: inner `<div className="flex items-center gap-4 p-4">`.
- REMOVE: the inner `p-4` (keep the outer card `pad="p-4"`).
- REPLACE: `<div className="flex items-center gap-4">`.
- MATERIAL: unchanged. RESPONSIVE: n/a. VALIDATION: 390/768/1280 — skeleton row height ≈ final card height (76px), 4-row skeleton ≈ 4-row list.

### FIX-TP-6 — TS-G3 (row micro-geometry) · `TopicListViewSkeleton.tsx`
- PROBLEM: icon radius 16 vs 12; subtitle always 2 lines; title bar thin.
- ROOT CAUSE: approximation in the skeleton rows.
- FILE/SYMBOL: `TopicListViewSkeleton.tsx:70-74`.
- CURRENT: `borderRadius={16}`; two bars `70%/50%`.
- REMOVE: n/a.
- REPLACE: `borderRadius={12}`; single 70% bar (drop the fixed subtitle bar — final `title_te` is optional; mirror it only when the data model guarantees a second line); bump title bar to 16px to match text-sm line-height.
- MATERIAL: unchanged. RESPONSIVE: n/a. VALIDATION: visual diff against a real 1-line and 2-line card.

---

## Scorecard (per rubric category, /5)

| Category | Score |
|---|---|
| 1. Page architecture & loading-states inventory | 5 |
| 2. Initial loading (cold) | 3 |
| 3. Final UI vs skeleton geometry | 3 |
| 4. Light/Dark material | 5 |
| 5. 3D / elevation language | 5 |
| 6. Responsive (390/768/1280) | 4 |
| 7. Filter / tab-change transitions | 2 |
| 8. Error / empty / retry | 4 |
| 9. Navigation flow (list→reader→back) | 5 |
| 10. Suspense / lazy boundaries | 4 |
| 11. Cache / warm-load | 1 |
| 12. Accessibility | 4 |
| 13. Reduced motion | 5 |
| 14. CSS / token / override audit | 5 |
| 15. Screenshot / browser evidence | 3 |
| **Total** | **58 / 75 → 31 / 40** |

## Verdict: **TARGETED FIX REQUIRED**

Score 31/40. The skeleton *system* itself is consistent (material, elevation, tokens, a11y, reduced motion, list geometry all correct) and the reader/navigation model needs no skeleton. The page fails on **state-fidelity defects** rather than visual styling: W-1 (cached data never painted — false empty up to 5 min) and TS-3 (stale rows under wrong headers with no loading feedback) are the two HIGH findings; FL-1, TS-1, TS-G2 are MEDIUM. All six fixes are small and page-scoped (one hook + one skeleton component + the tabs' loading representation). No backend, CSS, token, or animation changes required.

**NOT in this report** (page-by-page rule — stops after `/topics`): no other page was audited.

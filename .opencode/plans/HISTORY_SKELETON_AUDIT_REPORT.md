# /history — COMPLETE SKELETON AUDIT

Status: **AUDIT COMPLETE** — READ-ONLY. No implementation performed.
Date: 2026-08-14
Method: source trace + real Chrome rendering (CDP, dev server :5173, headless :9222) at 390/640/768/1024/1280/1440, dark + light + reduced-motion + warm-cache + NONAPPSC + downstream /review.

> Note: plan mode forbade writing PNG artifacts, so evidence below is numeric DOM/computed-style data captured from the live render rather than saved screenshots. The same harness reproduces them; screenshots can be saved when a writable turn resumes.

---

## 1. Page Architecture

| Layer | Source |
|---|---|
| Route | `src/App.tsx:97` — `<Route path="/history" element={<PageTitle title="History"><UserHistory /></PageTitle>}>` inside `AuthGuard > RoleGuard(role=user) > UserLayout`. **Not lazy.** |
| Page | `src/pages/user/UserHistory.tsx` (eager import) |
| Hook | `src/components/exam/useHistory.ts` |
| Services | `src/services/performanceService.ts` — `fetchPerformanceAttempts` (attempts, 5-min TTL), `fetchPerformanceMetadata` (configs/papers/subjects, 10-min TTL) |
| Repos | `attempt.repository.ts` (`/rest/v1/attempts`), `exam.repository.ts` (`/rest/v1/exam_configs`, `/rest/v1/exam_papers`, `/rest/v1/exam_subjects`) |
| Skeleton | Inline JSX in `UserHistory.tsx:26-50` (`LoadingSkeleton type="card"` ×5 + optional bare tabs div) |
| Final content | `UserSelectionTabs` (`AdminSelectionTabs`, only when `isAppsc`) + `Grid cols={3}` of `AttemptCardBase` / `EmptyState` |
| Suspense | none for /history itself |

## 2. Loading states present

| State | Exists? | Behavior |
|---|---|---|
| Initial page load (cold) | YES | 5 card skeletons + (nothing for tabs on cold) |
| Auth loading | YES | folded into hook `loading` (initial `true` when `authLoading`) |
| Data load | YES | `loadHistory()` → skeleton while pending |
| Filter/tab change | NO async | client-side only (see §9) |
| Retry | YES | `usePageError` → `isRetrying` → skeleton returns |
| Background refresh | YES (silent) | cache hit → **no** skeleton (good) |
| Empty | YES | `EmptyState` (gold, `rounded-[32px]`) |
| Error | YES | `ErrorContainer` + `RetryButton` |
| Nav → /review | YES | spinner-only downstream (see §11) |

## 3. Initial Loading Audit (cold)

- Skeleton appears before content: **YES** (held all 4 data endpoints; skeleton persisted; `role=status` "Loading history").
- False empty state: **NO**. Error flash: **NO**. Blank page: **NO**.
- Layout jump: **YES** — tabs region appears only after load (nothing during cold skeleton), and cards compress on swap (see §7).
- Time-to-skeleton: immediate (auth+guard then hook `loading=true`).

## 4. Final UI vs Skeleton

### TABS REGION (`UserSelectionTabs`)
- **Final** (1280, measured): `SelectionContainer` height **155px**, radius **24px** (`rounded-2xl`), `selection-surface` gold panel, padding-top 12px, **6** pill tabs (pill 52×? r20, font 12px, active = border-primary).
- **Skeleton (cold)**: **MISSING** — the intended placeholder (`w-full h-24` div) is gated on `metadata.exams.length > 0`, which is **empty on cold cache**, so nothing renders.
- **Skeleton (retry/warm-metadata-cold-attempts)**: renders `<div aria-hidden class="w-full h-24 animate-pulse">` which has **no background token** → transparent/invisible.
- Classification: **WRONG** (cold) / **MISSING** (invisible when reachable).

### CARDS REGION (`AttemptCardBase` vs skeleton card) — measured values

| Property | Final card | Skeleton card | Verdict |
|---|---|---|---|
| Radius | **24px** (`rounded-2xl`) | **24px** (`borderRadius=24`) | MATCH |
| Padding | **16px** / **20px** (md) (`p-4 md:p-5`) | **24px** (`p-6`) | MISMATCH |
| Height | 181 (390) · 209 (640) · 187 (768+) | **215** (all) | MISMATCH (compress on swap) |
| Surface dark | `rgb(31,41,55)` + `border rgba(55,65,81,0.5)` | `rgb(55,65,81)` + border 100% | CLOSE (lighter, more opaque) |
| Surface light | `rgb(223,178,107)` + gold border | `rgb(233,197,138)` gold | CLOSE (certified token) |
| Header icon | **36×36 r10** | **40×40 r20** | MISMATCH (minor) |
| Header right | Badge **28h r14** (font 10px) | bar **64×24 r8** | CLOSE |
| Body | paper name (bold) + date | 2 bars (h-4 w-3/4, h-3 w-1/2) | CLOSE |
| Footer divider | **1px** `--border-subtle @ 30%` | **1px** `--border-subtle @ 100%` | MISMATCH (opacity) |
| Footer blocks | score + "Full Review" link | 2× h-10 blocks | CLOSE |
| Grid cols/gaps | 1/2/2/3 cols · gap 24 | identical (same `Grid cols={3} gap={24}`) | **EXACT MATCH** |

## 5. Light Mode Material

- Skeleton card surface = `--skeleton-surface` light (`rgb(233,197,138)` gold) + gold border + `GOLD_LIGHT_MATERIAL`; matches final light card family (`rgb(223,178,107)` gold, `border rgb(184,134,11)`). **MATCH** (certified skeleton token, slightly lighter than final — approved system language).
- Interior blocks `rgb(222,175,107)` vs final icon/badge. **CLOSE**.
- No Light token leaking into Dark. No hardcoded colors on the skeleton path.

## 6. Dark Mode Material

- Skeleton dark surface `rgb(55,65,81)` vs final `rgb(31,41,55)` — skeleton is one step **lighter**; border 100% vs 50%. This is the certified `--skeleton-surface`/`--border-subtle` pair (approved by /exams audit), so acceptable, but the higher border opacity reads heavier than the final card. **CLOSE**.
- Skeleton carries the approved static-hover 3D language (`-translate-y-1 shadow-card-hover-3d`). **CONSISTENT**.

## 7. Geometry

- **Radius match (24px)** — good.
- **Padding mismatch (24 vs 16/20px)** — skeleton interior is 8–4px smaller on each side → content bars land differently than real card content. Real defect.
- **Height mismatch 215 vs ~181–209px** — cards visibly shrink when content lands (up to ~34px on 390).
- **Icon geometry mismatch** (40 r20 vs 36 r10).
- **Count mismatch**: 5 skeletons regardless of actual filtered count (final showed 2 for the auto-selected paper) — over-representation.

## 8. Responsive

| Viewport | Skeleton cols | Final cols | Match |
|---|---|---|---|
| 390 | 1 (374px) | 1 (374px) | EXACT |
| 640 | 2 (292px) | 2 (292px) | EXACT |
| 768 | 2 (312px) | 2 (312px) | EXACT |
| 1280 | 3 (304px) | 3 (304px) | EXACT |

Grid rows/gaps 24px both sides. **No horizontal overflow** anywhere. Same breakpoint logic both sides (shared `Grid`). The **tabs region is the only responsive defect** (absent on cold; invisible on retry).

## 9. Filter/Tab Change Loading

- `handleExamChange`/`setSelectedPaperId` recompute `filteredAttempts` synchronously from already-loaded data. **No async request on filter change.**
- Classification: **TYPE D — NO SKELETON REQUIRED** and the implementation is correct: filters stay visible, selection persists, no empty flash, no stale content. **PASS.**
- Edge: a paper with zero attempts correctly yields the `EmptyState` (legit, not a flash).

## 10. Error / Empty / Retry

- Error → `ErrorContainer(category,severity)` + `RetryButton` → `loadHistory(true)` (force, clears attempts cache) → `isRetrying=true` → **skeleton returns** → content/error. Correct separation of LOADING/EMPTY/ERROR. **PASS.**
- During retry with warm metadata the invisible tabs placeholder renders (defect H-1 surfaces here too).

## 11. Navigation Flow → /review/:attemptId

| Step | Route | Async? | Skeleton required? | Skeleton exists? | Observed |
|---|---|---|---|---|---|
| Card click | `/review/:attemptId` | YES | **YES** | **NO** | Lazy `ReviewPage` → Suspense fallback `PageLoader` = `PremiumLoader` = inline **spinner** ("Loading") |
| Review data | — | YES | **YES** | **NO** | `ExamPageLoading` **spinner** ("Loading Review Data...") |

Measured during navigation: phase1 `statusLabel="Loading"`, spinner, **0 skeleton blocks**; phase2 `statusText="Loading Review Data..."`, spinner, **0 skeleton blocks**. The `/review` page is visually substantial (report header card `rounded-[32px]` + trophy, stat grid 2/4, search input, 5 filter pills, N question cards) and its two loading layers are both generic spinners.
→ **MISSING REQUIRED SKELETON (downstream).**

## 12. Suspense

| Boundary | Fallback | Component | Geometry | Verdict |
|---|---|---|---|---|
| `/review/:attemptId` | `PageLoader` (spinner) | `ReviewPage` | large page | spinner inadequate |
| other routes | n/a for this page | — | — | — |

## 13. Cache / Warm Load

- `queryCache` persists to sessionStorage; hook seeds state synchronously from `getCachedAttempts`/`getCachedMetadata`.
- **Warm test**: nav dashboard → back to /history → `[role=status]` count **0**, content immediate, **no skeleton flash**. **PASS.**
- Background refresh (`force=false`) never sets `loading=true` when cache exists → **no unnecessary skeleton flash**. **PASS.**
- TTL asymmetry (attempts 5 min vs metadata 10 min) is what makes the cold-attempts/warm-metadata state possible → invisible tabs placeholder reachable.

## 14. Accessibility

- **ONE** `role="status" aria-live="polite" aria-label="Loading history"` region wrapping the skeleton; every card is `decorative` (`aria-hidden`) → **single announcement**, no nested status. **PASS.**
- Content list wrapped in `aria-live="polite"` "Showing N exam attempts". **PASS.**
- Tabs placeholder `aria-hidden` (but invisible anyway — neutral for a11y, a visual bug).
- Reduced motion: skeleton pulse `animationDuration = 1e-05s` (0.01ms) under `prefers-reduced-motion: reduce` → global collapse applies. **PASS.**

## 15. CSS / Token / Override Findings

| Issue | Rule | Action |
|---|---|---|
| Tabs placeholder transparent | `UserHistory.tsx:37` `<div aria-hidden class="w-full h-24 animate-pulse"/>` — no background/border/radius | **REMOVE → REPLACE** (structured placeholder) |
| Tabs placeholder cold-missing | gate `isAppsc && metadata.exams.length > 0` (empty on cold) | **REPLACE** gate + structure |
| Card padding | skeleton `p-6` vs final `p-4 md:p-5` | **REPLACE** with `pad` prop / composed interior |
| Card border opacity | skeleton `--border-subtle` 100% vs final card 50% / footer 30% | **REPLACE** footer divider with `/30` |
| Count | hardcoded 5 | KEEP (documented, LOW) |
| No `!important`, no arbitrary hardcoded colors, no legacy overrides on this page | — | KEEP |

Defect ownership: `PAGE` (tabs placeholder, count, `LoadingSkeleton` params in `UserHistory.tsx`) and `SHARED PRIMITIVE interior` (generic card interior of `Skeleton` is not history-specific — page should compose a tailored interior rather than modify the primitive).

## 16. Evidence (real Chrome, numeric)

- Cold skeleton present at all 5 viewports (390/640/768/1024/1280) dark + light + reduced-motion; 1 status region; 5 cards; grid cols 1/2/2/3 identical to final.
- Final at 1280: tabs 155px / 6 pills; cards 187px r24 p20; badge 28 r14; icon 36 r10; footer `--border-subtle/30`.
- Warm: 0 status regions, content immediate.
- NONAPPSC (BANK_EXAMS): skeleton = cards only, no tabs placeholder (correct), 1 status region; final has no tabs — consistent.
- /review: 2 spinner layers, 0 skeleton blocks.

## 17. Severity

- **CRITICAL**: none.
- **HIGH**
  - H-1 Tabs loading placeholder is **invisible** (no background token) and **absent on cold load** — the region flickers/poofs with zero skeleton representation. (`UserHistory.tsx:35-39`)
  - D-1 `/review` downstream loading is **spinner-only** for a structurally large page — MISSING REQUIRED SKELETON. (`App.tsx:144-148`, `ReviewPage.tsx:18-20`, `ExamPageLoading.tsx`)
- **MEDIUM**
  - M-1 Skeleton card padding 24px vs final 16/20px → interior geometry shift.
  - M-2 Skeleton card height 215 vs final 181–209 → vertical compression on swap.
  - M-3 Skeleton card footer divider 100% vs final 30% border opacity (material weight).
- **LOW**
  - L-1 Icon geometry 40 r20 vs final 36 r10 (minor).
  - L-2 Fixed skeleton count 5 vs actual filtered count (over-representation; mirrors approved EX-8 stance).
- **INFO**
  - I-1 Filter/tab change correctly skeleton-free (TYPE D). Verified.
  - I-2 Warm cache correctly skeleton-free. Verified.
  - I-3 Single status region, decorative inners, reduced-motion honored. Verified.

## 18. Exact Rules to REMOVE

1. `UserHistory.tsx:37` — `<div aria-hidden className="w-full h-24 animate-pulse" />` (transparent, structure-less tabs placeholder).
2. `UserHistory.tsx:35` — gate `{isAppsc && metadata.exams.length > 0 && (...)}` as the *only* condition for any tabs representation (leaves cold load blank in that region).
3. `UserHistory.tsx:43` — `LoadingSkeleton height={180} borderRadius={24} type="card"` generic interior (padding `p-6`, generic header/footer) as the history card skeleton.
4. (Downstream) `ReviewPage.tsx:18-20` reliance on `ExamPageLoading` spinner for the whole review page.

## 19. Exact Rules to REPLACE

1. Tabs region skeleton → approved `SelectionContainer`-shaped placeholder: `rounded-2xl` + `bg-[var(--skeleton-surface)]` + `border border-[var(--border-subtle)]` + `shadow-[var(--card-shadow)]` + `GOLD_LIGHT_MATERIAL`, inner `--skeleton-block` bars mirroring the primary-tab row + sub-row heights; gate on `(authLoading || (isAppsc && metadata.exams.length > 0))` (mirrors /exams EX-3 pattern).
2. History card skeleton → composed `Skeleton type="card"` interior mirroring `AttemptCardBase`: `pad="p-4 md:p-5"`, `borderRadius={24}`, header = badge bar (≈56×28 r14) + icon (36×36 r10), body = title bar + date bar, footer `mt-auto pt-4 border-t border-border-subtle/30` + metric bar + link bar. `decorative` retained; single `role="status"` at container.
3. `ReviewPage` loading → structural `ReviewSkeleton`: report header card (`rounded-[32px]`) + stat grid `grid-cols-2 sm:grid-cols-4 gap-4` + search bar + 5 filter pills + N question-card skeletons; keep Suspense `PageLoader` only as the tiny chunk fallback.

## 20. Implementation Plan (next turn — not executed now)

1. Add `HistorySkeleton` inline or in `src/pages/user/` composing `Skeleton` primitives (no `Skeleton.tsx` change; interior via `children`, padding via `pad` prop).
2. Fix the tabs placeholder (replace + re-gate per §19.1).
3. Add `ReviewSkeleton` for `ReviewPage`; swap `ExamPageLoading` → `ReviewSkeleton` on that page only.
4. Re-run the same CDP harness: verify skeleton==final padding/height/divider/icon at 390/768/1280 dark+light, reduced motion, warm, NONAPPSC, and downstream.
5. `npx tsc --noEmit`, `npm run build`, `npx eslint`, `npm test` (baseline 165 pass / 10 pre-existing ERR_REQUIRE_ESM).

How NOT to implement: no `!important`, no override stacking, no change to `Skeleton.tsx`/`Card`/`Button`/`Tabs`/`themes.css`/`index.css`, no JS breakpoint detection, no network-for-count.

## 21. Final Score

| Category | Score | Basis |
|---|---|---|
| Geometry | **3/5** | radius/grid match; padding + height + icon mismatches |
| Color | **4/5** | certified tokens both modes; border-opacity weight off |
| Material / 3D | **4/5** | approved surface + lift; slightly lighter/more opaque than final |
| Responsive | **4/5** | grid exact everywhere; tabs region broken |
| Loading Flow | **3/5** | cold/warm/retry correct; invisible+missing tabs placeholder |
| Filter Transition | **5/5** | TYPE D, correct |
| Navigation Flow | **2/5** | /review spinner-only (MISSING REQUIRED SKELETON) |
| Accessibility | **4/5** | single region, decorative, reduced-motion; minus for silent invisible region |
| **Total** | **29/40** | **NEEDS MINOR FIX (24–30)** |

## 22. Final Verdict

**TARGETED FIX REQUIRED** — the /history initial skeleton is grid-exact and material-approved, but the tabs region is effectively absent/invisible (H-1), the card interior geometry drifts (M-1/2/3), and the downstream /review page has no structural skeleton (D-1). All fixes are page-scoped and do not require touching shared primitives.

---

*Audit STOP — /history only. Next page audited separately.*

# Leaderboard Skeleton Audit Report — `/leaderboard`

**Scope:** READ-ONLY audit of the User Panel leaderboard loading experience. Does the skeleton
loading UI (SKELETON) visually and structurally match the final loaded UI (FINAL) across themes,
breakpoints, and the page's loading states? No product code was changed.

**Method:** source trace of every token chain and geometry constant used by the skeleton and final
components (`LeaderboardSkeleton.tsx`, `UserLeaderboard.tsx`, `useUserLeaderboard.ts`,
`LeaderboardTopCard.tsx`, `LeaderboardTable.tsx`, `LeaderboardUserCard.tsx`,
`LeaderboardComponents.tsx`, `SegmentedFilter.tsx`, `AdminSelectionTabs.tsx`, `AntigravityData.tsx`,
`AntigravityLayout.tsx`, `Skeleton.tsx`, `leaderboardService.ts`, `leaderboard.repository.ts`,
`themes.css`, `index.css`). Vite dev server verified live at `http://localhost:5173`.

**Date:** 2026-08-15

---

## 1. Verdict summary

| # | Criterion | Score | Verdict |
|---|---|---|---|
| 1 | No duplicated controls during partial loading | 1/5 | **FAIL** — full-page skeleton re-renders the selection container + period filter below the live controls on every data load |
| 2 | Selection region mirrors final (rows, heights, scroll) | 2/5 | **PARTIAL** — 1 row of 4 bare 44px pills, no APPSC paper row, `flex-wrap` instead of horizontal scroll, always rendered |
| 3 | Period filter mirrors final (track, height) | 3/5 | **PARTIAL** — no SelectionContainer track; 36px pills vs 34/38px inside `!p-2` container |
| 4 | Hero card geometry (responsive width/height) | 3/5 | **PARTIAL** — fixed `max-w-[600px]` vs 400/500/600; minHeight 220 vs 200/240 floor; no trophy glyph |
| 5 | Table geometry (row count, header, surface) | 2/5 | **FAIL** — 5 rows vs up to 50; header hidden on mobile; lifted separate cards vs continuous table |
| 6 | Rank card geometry (width, sticky, interior) | 2/5 | **FAIL** — 520px centered vs full-width sticky 1280; height 120 vs ~76; interior not mirrored |
| 7 | Token / color / radius fidelity | 5/5 | **PASS** — certified skeleton tokens, premium family, light gold material, 24px radii |
| 8 | A11y + reduced motion + state separation | 4/5 | **PASS** — one live region, RM handled; error/empty clean; retry flashes skeleton |

**Total: 22/40 — NEEDS MINOR FIX.** All defects are scoped to `LeaderboardSkeleton.tsx` plus one
render-split in `UserLeaderboard.tsx`; no shared primitive or token changes required.

---

## 2. Page architecture

| Layer | Source |
|---|---|
| Route | `src/App.tsx` — `/leaderboard` inside `AuthGuard > RoleGuard(role=user) > UserLayout` |
| Page | `src/pages/user/UserLeaderboard.tsx` (eager import) |
| Hook | `src/components/user/leaderboard/useUserLeaderboard.ts` |
| Services | `leaderboardService.ts` — `fetchLeaderboardMetadata` (10-min TTL), `fetchTopRanks` (**limit 50**, 2-min TTL), `fetchUserRank` (2-min TTL) |
| Repo | `leaderboard.repository.ts:34-44` — `fetchLeaderboardTopRpc(..., limit = 50)` |
| Skeleton | `LeaderboardSkeleton.tsx` (shared for full-page and in-content states) |
| Final content | `UserSelectionTabs` (only when `examOptions.length > 0`) + `SegmentedFilter` + `LeaderboardTopCard` + `LeaderboardTable` (maps **all** entries) + sticky `LeaderboardUserCard` (only when `userRank`) |

## 3. Loading states present

| State | Exists? | Behavior |
|---|---|---|
| Cold page load (`authLoading \|\| isInitialLoad`) | YES | full-page `<LeaderboardSkeleton />` (`UserLeaderboard.tsx:57`) |
| Metadata loaded, ranks loading | YES | real tabs + filter render, then `<LeaderboardSkeleton />` in content stack (`:125-126`) — **duplicates the controls** (LB-1) |
| Filter/tab/period change | YES | top progress bar only; old rows stay (good) — `:109-113` |
| Retry | YES | `loadLeaderboard(true)` → `resetError()` + `setLoading(true)` (`useUserLeaderboard.ts:95-96`) → cold retry flashes the full skeleton (LB-8) |
| Warm re-entry (cached metadata) | YES | ranks still refetched → skeleton flash in content (with dup controls) |
| Empty | YES | `EmptyState` + CTA (`:127-136`) |
| Error | YES | `ErrorContainer` + `RetryButton` (`:115-124`) |

## 4. Section-by-section — SKELETON vs FINAL

### 4.1 Selection region

| Property | Skeleton | Final (`UserSelectionTabs`) | Verdict |
|---|---|---|---|
| Rows | 1 row, 4 bare pills (`LeaderboardSkeleton.tsx:15-21`) | primary tabs (md 44/52) **+ divider + papers row (sm 40/44) for APPSC** (`AdminSelectionTabs.tsx:59-134`) | **MISMATCH (APPSC)** — paper row missing |
| Height | pills fixed **44px** | primary `h-[44px] md:h-[52px]` (`AntigravityData.tsx:49`), secondary `h-[40px] md:h-[44px]` (`:48`) | **MISMATCH** desktop 44 vs 52 |
| Mobile overflow | `flex flex-wrap gap-2` → pills **wrap to 2 lines** (~120px) | `overflow-x-auto custom-scrollbar` + `min-w-max` → **single scrollable row** (~92px) | **MISMATCH** (wrap vs scroll) |
| Pill shape | bare bars (no border box) | bordered pills (`rounded-xl border border-border-subtle light:border-[var(--material-tab-pill-border)]`) | **MISMATCH** vs approved selection-skeleton pattern (/history, /performance) |
| Render gating | always | only when `examOptions.length > 0` (`UserLeaderboard.tsx:80`) | **MISMATCH** on cold load (skeleton shows region final hides) |

### 4.2 Period filter

| Property | Skeleton | Final (`SegmentedFilter`, size md) | Verdict |
|---|---|---|---|
| Container/track | none — 3 floating pills `gap-2` (`:24-30`) | `SelectionContainer !p-2` track (`SegmentedFilter.tsx:68`) | **MISMATCH** — missing track + `p-2` padding (≈ −18px total height) |
| Pill height | **36px** | container `h-[34px] md:h-[38px]` (`:28`) | **MISMATCH** ±2px + missing padding |
| Gap | 8px | `gap-0.5 md:gap-1` (2/4px) | **MISMATCH** (slightly wider) |
| Widths | 92/112/120 (approx) | Today / Last 7 Days / Last 30 Days @ 10/11px + `px-3 md:px-4` | CLOSE |

### 4.3 Hero — `LeaderboardTopCard`

| Property | Skeleton (`:33-43`) | Final (`LeaderboardTopCard.tsx:17`) | Verdict |
|---|---|---|---|
| Width | `max-w-[600px]` all breakpoints | `max-w-[400px] md:max-w-[500px] lg:max-w-[600px]` | **MISMATCH** — +100px wider at md (768-1023) |
| Height | `minHeight 220` | `min-h-[200px] md:min-h-[240px]` (floor 200/240) | **MISMATCH** +20 mobile, −20 desktop |
| "#1" bar | 96×56 | `text-[48px] md:text-[64px]` (48/64) | MINOR |
| Trophy | **missing** | absolute 60/80px glyph top-right | MINOR (cosmetic) |
| Surface | premium skeleton surface (dark: `#374151`) | gold gradient `#FFD700→#B8860B`, white text, both themes | **MISMATCH** — hero reads as a plain dark card in dark mode |

### 4.4 Table

| Property | Skeleton (`:46-53`) | Final (`LeaderboardTable.tsx`) | Verdict |
|---|---|---|---|
| Row count | 1 header bar + **5 rows** | **up to 50 rows** (`fetchTopRanks` limit 50; `.map()` renders all, `:33`) | **FAIL** — region grows by ~45 rows at release |
| Header row | `hidden sm:block`, 56px | thead always rendered (Rank+Student always visible), ~48px (`py-4` 11px text) | **MISMATCH** — hidden on mobile; +8px desktop |
| Row height | **64px** fixed | ~64 mobile (avatar 32+`py-4`) / **~72 desktop** (avatar 40) | MINOR (desktop −8px) |
| Row surface | separate lifted cards: border + `rounded-xl` + `SKELETON_ROW_LIFT` (each `unit="row"`) | continuous table: `Card shadow-2xl overflow-hidden p-0 border-none` + `bg-hover-bg/50` header, `border-b border-border-subtle/30` rows | **MISMATCH** — segmented lifted cards vs one surface; wrapper has no `shadow-2xl` |
| Interior | avatar 40 + 2 bars + **right chip 56×28** | mobile: avatar 32 + name + sub-line (no chip); desktop: avatar 40 + rank/score/acc(bar)/time cols | MINOR (chip is desktop-only content) |

### 4.5 Sticky rank card

| Property | Skeleton (`:55-68`) | Final (`LeaderboardUserCard.tsx:14-16`) | Verdict |
|---|---|---|---|
| Width | `max-w-[520px]` centered | `max-w-[1280px] mx-auto` **sticky bottom-6** | **FAIL** — 520 vs full-width 1280; not sticky |
| Height | `minHeight 120` | `p-4` + badge 40/48 ≈ **72-80px** | **MISMATCH** — +40-48px |
| Interior | avatar 40 + 2 bars + chip 56×28 | rank badge 40/48 + name block (hidden <sm) + **3 MetricItems** (SCORE / ACCURACY / BEST TIME) | **MISMATCH** — badge + 3 metrics not mirrored |
| Conditional | always rendered | only when `userRank` is set (`UserLeaderboard.tsx:152`) | **MISMATCH** — phantom card if user unranked |

## 5. Token / color / radius fidelity

- Skeleton uses the ONE certified family: `--skeleton-surface`/`--skeleton-block` (dark `bg-elevated`/`border-input`; light `bg-elevated`/`bg-active` + `GOLD_LIGHT_MATERIAL`), premium variant, `Skeleton.tsx:50-65`. **PASS** — no hardcoded colors, no light-leak.
- SelectionContainer reuses the real material (`selection-surface`, 1.8px premium border) — the strongest fidelity element. **PASS**.
- Radii: hero/rank `borderRadius 24` == `rounded-2xl` (final hero `rounded-[24px]`); rows `rounded-xl` (20px). **PASS** (rows are segmented in skeleton by design — see LB-7).
- Dark-mode hero: final is gold gradient in both themes; skeleton is a dark neutral card — the single token-level fidelity gap (LB-6).

## 6. A11y + reduced motion

- ONE `role="status" aria-label="Loading leaderboard" aria-live="polite"` wrapper; every inner unit is `decorative` (`aria-hidden`). **PASS** (`LeaderboardSkeleton.tsx:12`).
- Content region has `role="region" aria-label="Leaderboard rankings" aria-live="polite"`. **PASS** (`UserLeaderboard.tsx:138`).
- Reduced motion: CSS `@media (prefers-reduced-motion: reduce)` collapses all animations to 0.01ms (`index.css:1059-1066`); the framer progress bar is additionally handled by `MotionConfig reducedMotion="user"` (`main.tsx:9`). **PASS**.
- Error/empty have distinct components with CTAs; error panel is not converted to empty. **PASS**.

## 7. Responsive matrix (expected SKELETON vs FINAL column/height deltas)

| Viewport | Selection (skel/final) | Filter (skel/final) | Hero (skel/final) | Rows (skel/final) | Rank card (skel/final) |
|---|---|---|---|---|---|
| 390 | 2-line wrap 120 / 1-row 92 | 36 / 50 | 220 / 200 | 5 / ≤50 | 520-120 / ~full-76 |
| 640 | wrap / 1-row | 36 / 50 | 220 / 200 | 5 / ≤50 | 520-120 / ~full-76 |
| 768 | 44 / 52 | 36 / 54 | 220 / 240 | 5 / ≤50 | 520-120 / ~full-80 |
| 1024 | 44 / 52+40 | 36 / 54 | 220 / 240 | 5 / ≤50 | 520-120 / 1280-80 |
| 1280 | 44 / 52+40 | 36 / 54 | 220 / 240 | 5 / ≤50 | 520-120 / 1280-80 |
| 1440 | 44 / 52+40 | 36 / 54 | 220 / 240 | 5 / ≤50 | 520-120 / 1280-80 |

## 8. Defects (ranked, implementation-ready)

1. **HIGH — Duplicated controls during in-content loading** (`UserLeaderboard.tsx:125-126` reuses the
   full `LeaderboardSkeleton` while the live `UserSelectionTabs` + `SegmentedFilter` are already
   rendered above at `:80-106`). Visible on every cold data load, cold retry, and warm nav.
   **Fix:** split the skeleton — `LeaderboardSkeleton` (selection + filter + hero + table + rank) for
   the full-page states (`authLoading \|\| isInitialLoad`), and a new `LeaderboardContentSkeleton`
   (hero + table + rank only) for the in-content branch.
2. **HIGH — Row count 5 vs up to 50** (`LeaderboardSkeleton.tsx:50-52`; final maps all rows from
   `fetchTopRanks` limit 50). Region grows ~45 rows on swap.
   **Fix:** export the limit as a shared constant from `leaderboardService.ts` and render
   `min(limit, N)` rows (suggest capped at a sane N, e.g. 5-8, with a note that cold→content always
   grows — or render the true limit when pagination is not used).
3. **MEDIUM — Rank card skeleton geometry** (`:55-68` vs `LeaderboardUserCard.tsx:14-30`): 520px
   centered non-sticky card, 120px tall, avatar+chip interior; final is full-width sticky 1280 with
   rank badge + 3 metric columns at ~76px. **Fix:** mirror width (`max-w-[1280px] mx-auto`), height
   (auto/`min-h-[76px]`-ish), add badge + 3 metric blocks; consider `sticky bottom-6`.
4. **MEDIUM — Selection region not APPSC-faithful** (`:15-21`): single 44px row of 4 bare pills vs
   final primary row `h-[44px] md:h-[52px]` + divider + secondary paper row `h-[40px] md:h-[44px]`
   (APPSC); `flex-wrap` vs `overflow-x-auto custom-scrollbar min-w-max`; pills lack the bordered
   pill-box pattern used by /history + /performance skeletons.
   **Fix:** adopt the `/performance` `TabRowSkeleton` pattern (pill widths ~120/96/110/80 primary,
   ~140/120/90 paper; bordered pill shells; horizontal scroll).
5. **MEDIUM — Period filter track missing + height off** (`:24-30` vs `SegmentedFilter.tsx:26-30,68`):
   3 floating 36px pills with no `SelectionContainer !p-2` track (≈ −18px) and 2/4px gap.
   **Fix:** wrap in the real `SelectionContainer` (`!p-2`), heights 34/38.
6. **MEDIUM — Hero geometry + surface** (`:33-43` vs `LeaderboardTopCard.tsx:17`): `max-w-[600px]`
   at every breakpoint (final 400/500/600 → +100px at md), `minHeight 220` vs floor 200/240, missing
   trophy glyph, and the dark skeleton card does not evoke the gold gradient hero.
   **Fix:** `max-w-[400px] md:max-w-[500px] lg:max-w-[600px]`, height 200/240, add corner trophy bar.
   (Surface: keep certified tokens; do NOT hand-roll gold — note as accepted fidelity limit.)
7. **LOW — Table reads as segmented lifted cards, not one surface** (`:46-53`): rows are separate
   `unit="row"` cards (own border + lift) inside a `shadow-none` wrapper; final is a continuous
   `shadow-2xl overflow-hidden` card. Header bar hidden on mobile but final thead is always present.
   **Fix:** give the wrapper `shadow-2xl` + `overflow-hidden`, show the header bar at all breakpoints,
   and keep rows flush (remove per-row radius/border).
8. **LOW — Cold retry flashes the full skeleton** (`useUserLeaderboard.ts:95-96`: `resetError()` +
   `setLoading(true)` unmounts the `ErrorContainer`). Dashboard keeps its error view during retry.
   **Fix:** keep the error panel mounted while retrying (only swap when data arrives), or show the
   in-content skeleton — which resolves the duplication from LB-1 too.

## 9. Measurement caveats

- Source-trace based (geometry from component constants + token resolution). Live CDP verification is
  available since the dev server is running (`:5173`) if pixel-level confirmation is required.
- All height/width figures are design-intent from class strings; final row heights assume one-line
  names/values.

## 10. Recommendation

Apply LB-1 and LB-2 (the two HIGHs) as a single pass: introduce `LeaderboardContentSkeleton` and a
shared rank-limit constant. Then fold LB-3..LB-6 into the existing `LeaderboardSkeleton` rewrite
mirroring the approved `/performance` and `/history` selection-skeleton patterns. LB-7/LB-8 are
optional polish. Re-validate at 390/414/640/767/768/1024/1280/1440 × Light/Dark/Reduced-Motion after
the change.

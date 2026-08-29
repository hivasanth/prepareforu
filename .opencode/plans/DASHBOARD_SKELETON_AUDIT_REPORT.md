# Dashboard Skeleton Audit Report — `/dashboard`

**Scope:** READ-ONLY audit of the User Panel dashboard loading experience. Does the skeleton
loading UI (SKELETON) visually match the final loaded UI (FINAL) for both stats and recent
activity, across themes and breakpoints? No product code was changed.

**Method:**
- Static resolution of every token chain used by skeleton and final components.
- Live measurements via the CDP harness (`val.mjs`, profile `user`) — skeleton states held with
  `Fetch.pause`, content/error states via immediate `responds`.
- Live DOM probes via CDP `Runtime.evaluate` for error/retry/state verification.
- Source-verified geometry from `Skeleton.tsx`, `SharedComponents.tsx`, `AntigravityCard.tsx`,
  `DashboardStatsGrid.tsx`, `DashboardRecentActivity.tsx`, `AntigravityLayout.tsx`.

---

## 1. Verdict summary

| Area | Verdict | Evidence |
|---|---|---|
| Stats region — skeleton vs final geometry | **PASS (≥768px) / FAIL (mobile)** | columns 1 vs 2 below 768px; everything else matches |
| Recent activity — skeleton vs final geometry | **PARTIAL (LOW)** | count 3 vs ≤5; static lift on skeleton cards |
| Color / token fidelity | **PASS** | on-palette in both themes |
| Radius | **PASS (dark, ≥sm light) / NEGLIGIBLE (light mobile)** | 20/24px vs 24px — 4px at mobile only |
| Live regions / a11y | **PASS** | one `role="status"` per section; clean swap |
| Error state | **PASS** | two independent error panels + Try Again (live-verified) |
| Retry UX | **PASS** | error view stays mounted; no skeleton flash (live-verified) |
| Warm re-entry / back-nav | **PASS** | no skeleton on warm return (live-verified) |
| `/review` loading state | **PASS (by design)** | spinner (`ExamPageLoading`), not skeleton (live-verified) |
| Horizontal overflow | **PASS** | overflowX = 0 in every measured viewport/state |

**Bottom line:** the dashboard skeleton is a faithful, on-palette placeholder. Only two LOW
severity reflow defects exist (recent-activity count, stats mobile columns), one intentional
elevation deviation, and one negligible radius delta. No blocking issues.

---

## 2. Corrected findings (errata vs earlier working notes)

1. **Radius is NOT a 24-vs-12/16 mismatch.** This project remaps Tailwind v4 radius tokens:
   `--radius-xl: 20px`, `--radius-2xl: 24px` (`src/index.css:99-100`, `src/styles/themes.css:113-115`).
   Tailwind v4 `rounded-xl`/`rounded-2xl` resolve to these, not the stock 12/16px.
   - Final stat card, LIGHT: `rounded-stat-card-radius` → `--radius-stat-card-radius` (index.css:200)
     → `--stat-card-radius` (themes.css:885) → `--radius-container` (themes.css:321) → `--radius-2xl` = **24px** all breakpoints.
   - Final stat card, DARK: `rounded-xl sm:rounded-2xl` = **20/24px** (AntigravityCard.tsx:171).
   - StatSkeleton: `rounded-xl sm:rounded-2xl` = **20/24px** (SharedComponents.tsx:53).
   - Verdict: DARK exact match; LIGHT match at ≥sm; 4px corner delta at mobile only.
2. **Stats grid columns DO mismatch at mobile** (earlier note claimed columns matched).
   Final: `<Grid cols={2} lg={4}>` → `grid-cols-2 lg:grid-cols-4` (AntigravityLayout.tsx:146-148).
   Skeleton: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` (DashboardStatsGrid.tsx:19).
   Match at ≥768px; 1-col vs 2-col below 768px.

---

## 3. Section-by-section detail

### 3.1 Stats region (4 cards)

| Property | Skeleton (StatSkeleton) | Final (StatCard) | Verdict |
|---|---|---|---|
| Grid columns | `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` | `grid-cols-2 lg:grid-cols-4` | **MISMATCH <768px** |
| Gap | `gap-4 md:gap-5 lg:gap-6` | `gap-4 md:gap-5 lg:gap-6` | match |
| Card height | `h-16 sm:h-20 lg:h-24` | `h-16 sm:h-20 lg:h-24` | match |
| Padding | `px-3 sm:px-4 lg:px-5 py-3 sm:py-4` | same | match |
| Icon box | `w-9 sm:w-11 lg:w-12` + `rounded-stat-icon-radius` | identical | match |
| Label bar | `w-3/5 h-2 lg:h-2.5` (8/10px) | `text-[9px] lg:text-[11px]` | approx match |
| Value bar | `w-2/5 h-4 sm:h-5 lg:h-6` (16/20/24px) | `text-base sm:text-lg lg:text-xl` (16/18/20px) | approx match |
| Radius | `rounded-xl sm:rounded-2xl` (20/24px) | light 24px / dark 20/24px | match (4px light-mobile) |
| Hover lift | none | `hover:-translate-y-1 hover:shadow-card-hover-3d` | match (rest state flat) |

### 3.2 Recent activity region

| Property | Skeleton (GridSkeleton) | Final (RecentAttemptCard) | Verdict |
|---|---|---|---|
| Card count | `count={3}` (fixed) | up to 5 (service `limit=5`) | **MISMATCH (LOW)** — 4th/5th cards appear at release |
| Grid columns | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | `<Grid cols={1} sm={2} lg={3}>` | match |
| Gap | `gap-4 md:gap-5 lg:gap-6` | default same | match |
| Card height | `minHeight: 180` + interior | auto (content) | approx (skeleton taller/shorter per row) |
| Radius | `rounded-2xl` (24px) | card radius | match |
| Elevation | **static lift** `-translate-y-1 shadow-card-hover-3d` (Skeleton.tsx:62-63) | flat at rest; lift on hover only | **deviation (LOW/INFO)** — placeholder always "hovered" |
| Interior | icon row + 2 text lines + bottom action row (2 blocks) | score/accuracy/meta + review button | approx match |

### 3.3 Colors (resolved)

| Token | Dark | Light |
|---|---|---|
| `--skeleton-surface` (= `--bg-elevated`) | `#374151` | `#E9C58A` (+ `GOLD_LIGHT_MATERIAL`) |
| `--skeleton-block` | `--border-input` `#4B5563` | `--bg-active` `#DEAF6B` |
| skeleton border (`--border-subtle`) | `#374151` == surface → **invisible border in dark** | `#E2E8F0` (neutral) on gold material |
| final stat card surface | `--bg-surface` | `--surface-stat` (gold) |
| final stat card border | `--card-border` = `#374151` (1px) | `--stat-card-border` = `--gold-300` (2px) |

Notes: skeleton bars are visibly darker than the card surface in both themes (good contrast).
Dark border-invisibility is consistent with the final dark card border (same value) — cosmetic, no action.

### 3.4 Skeleton → final transition

- Both sections render exactly one of `loading | error | empty | content` (DashboardStatsGrid.tsx:17-34,
  DashboardRecentActivity.tsx:31-58). Instant conditional swap — no blank gap, no flash.
- No exit animation; content pops in. Reflow (not flash) at release:
  - Stats <768px: stacked 1-col (≈304px) → 2×2 (≈192px).
  - Recent: 3 fixed cards → up to 5 content cards (region grows downward).
- Live verification of the swap: `dash-retry` (short-hold release) — stats recovered to content in
  place after Try Again; no skeleton flash during retry (error view stays mounted, `useUserDashboard`
  force-retry path keeps `loading=false` and does not clear the error).

### 3.5 Error / retry

- Two independent panels (stats / recent), each `role="alert"`, heading + message + Try Again
  (live-verified: `Failed to load dashboard stats` / `Failed to load recent activity`, 2 buttons).
- Retry uses force `Promise.allSettled` re-fetch; error view persists while retrying (RetryButton
  shows spinner). No skeleton flash by design.

### 3.6 Warm re-entry / nav (Section-17 flow)

- `dash-warm` / `dash-nav` (live): /dashboard → /performance → back to /dashboard renders content
  immediately, `statusRoleCount: 0`, `pulseCount: 0` on warm-return — no skeleton on warm re-entry
  (SPA cache, `queryCache` 5-min TTL, no page refresh).
- `/review/{id}` loading state = `ExamPageLoading` spinner (`Loading Review Data...`, w-12 h-12,
  `role="status"`×2, `pulseCount: 0`) — not the skeleton family (live-verified).

### 3.7 a11y

- Each section wraps its skeleton in one container `role="status" aria-live="polite"` with
  `decorative` per-card placeholders (`aria-hidden`) → one clean announcement per section.
- Final content has no live region (swap announced via skeleton region removal).

---

## 4. Responsive matrix (verified)

| Viewport | Stats cols (skel/final) | Recent cols (skel/final) | overflowX |
|---|---|---|---|
| 390×844 | **1 / 2** | 1 / 1 | 0 |
| 414 | **1 / 2** | 1 / 1 | 0 |
| 640 | **1 / 2** | 2 / 2 | 0 |
| 768 | 2 / 2 | 2 / 2 | 0 |
| 1024 | 4 / 4 | 3 / 3 | 0 |
| 1280 | 4 / 4 | 3 / 3 | 0 |
| 1440 | 4 / 4 | 3 / 3 | 0 |

Measured skeleton geometry (dark, `dash-skel`): stats cells stack 1/2/4 col at 390/768/1024+;
recent cells ≈215px; icon pulse rects 36/44/48px; label bar 8px; value bar 16/20/24px. All
consistent with source.

---

## 5. Defects (ranked, implementation-ready fix plan)

1. **LOW — Recent activity count 3 vs ≤5** (`DashboardRecentActivity.tsx:33`).
   Fix: `count={5}` on GridSkeleton (matches service `limit=5`, `dashboard.repository.ts`) so no
   card appears at release. Optional: derive from a shared constant.
2. **LOW — Stats mobile columns 1 vs 2** (`DashboardStatsGrid.tsx:19`).
   Fix: change skeleton columns to `grid-cols-2 lg:grid-cols-4` (mirror final `<Grid cols={2} lg={4}>`).
   Optional: `grid-cols-1` below a real "mobile" breakpoint only if 2-col is too cramped — verify at 320px.
3. **INFO — Recent skeleton static lift** (`Skeleton.tsx:62-63`, type `card`).
   Intentional per DS (placeholder = hovered card look). If a flat placeholder is preferred, drop
   `SKELETON_CARD_LIFT`/`SKELETON_ROW_LIFT`; affects all GridSkeleton consumers, so validate
   /performance too. Recommend leaving as-is.
4. **NEGLIGIBLE — Light mobile radius 24 vs 20px.** Fix if desired: `rounded-2xl` on StatSkeleton
   (matches light final at all breakpoints; dark unchanged since dark final is `rounded-xl`).
   Note: this would diverge the skeleton from the DARK final at mobile — not recommended.

---

## 6. Measurement caveats (tooling, not product)

- Harness `Fetch.fulfillRequest` on requests paused >~5s silently fails (stale requestId, error
  swallowed at `val.mjs` release block). Long-hold `releaseWith` scenarios therefore cannot capture
  the final content state; the live skeleton→content swap and the empty state were **code-verified
  only**. `dash-retry` (short holds) verified the swap live (stats → content).
- `dash-empty` (empty-state live run) not reliable for the same reason; the empty branch
  (`DashboardRecentActivity.tsx:41-48`, `recentActivity.length === 0 → EmptyState`) is deterministic
  from source.
- Several scenario JSONs carried `"theme": "THEME"` (never substituted) → content/error evidence is
  LIGHT-mode only; dark content geometry comes from source resolution.
- Screenshots captured but not viewable in this environment; all numbers from dumps + source.

---

## 7. Evidence inventory

- Scenarios (temp): `dash-skel`, `dash-skel-light`, `dash-warm`, `dash-error`, `dash-retry`,
  `dash-nav`, `dash-review` — all run; dumps confirm status/pulse/overflow/labels per state.
- Live probes (CDP): error state (2 alerts, 2 Try Again), retry outcome (stats content + recent
  error), warm-return no-skeleton.
- Source: `Skeleton.tsx`, `SharedComponents.tsx`, `AntigravityCard.tsx`, `AntigravityLayout.tsx`,
  `DashboardStatsGrid.tsx`, `DashboardRecentActivity.tsx`, `useUserDashboard.ts`,
  `themes.css`, `index.css`, `dashboard.repository.ts`, `ExamPageLoading.tsx`, `ReviewPage.tsx`.

---

**Recommendation:** ship as-is or apply defects #1 and #2 (two-line changes) for a fully
pixel-faithful transition. No skeleton language or token changes required.

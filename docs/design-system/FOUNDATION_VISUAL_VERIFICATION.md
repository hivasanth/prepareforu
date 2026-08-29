# FOUNDATION_VISUAL_VERIFICATION — Phase 6.X Foundation Visual Refinement

- **Phase:** 6.X (Foundation Visual Refinement; Tasks 1–7, 9 + 5 screenshot refinements; Task 8 audit)
- **Status:** IMPLEMENTED 2026-08-07 — automated/mechanical evidence complete; manual visual checks
  await user confirmation during certification
- **Key property:** Phase 6.X is a **refinement-over-certified-Foundation** change — every adjustment
  flows through the existing semantic tokens and Foundation components (`text-on-dark`,
  `text-text-secondary`, `CARD_HOVER`, `--card-shadow`, the `.light` `--bg-*` values, light nav
  tokens) and the retired `.ancient-*` dead recipes are deleted. **No new color names, no new
  token namespace, no page-specific overrides, no page migration.** Verification therefore proves:
  (a) all mechanical gates pass on the reporting baseline, (b) the exact refinement atoms are
  present in source, (c) the anti-patterns the tasks ban (`text-warning` banner primary chain,
  opacity-as-emphasis on primary text, per-card differing hover shadows, `.ancient-*` consumers)
  are zero in scope, (d) the freeze is intact (component/token-only, no page migration).

---

## 1. Change inventory (what was refined)

| # | Refinement | File | Task |
|---|---|---|---|
| 1 | Banner: greeting label, uppercased name, heading, supporting text → full-alpha `text-on-dark`; divider `bg-warning/35`→`bg-white/40`; dropped `/85`,`/90` | `src/components/user/WelcomeBanner.tsx` | T1/T7 |
| 2 | Hero ink overlay opacity `30`→`40` | `src/components/user/WelcomeBanner.tsx` | screenshot |
| 3 | Stat label `light:text-text-hint`→`light:text-text-secondary` | `src/components/common/AntigravityCard.tsx` | T2 |
| 4 | ONE card hover: `CARD_HOVER` hoisted; `PREMIUM_SURFACE_HOVER=CARD_HOVER`; premium variants + StatCard light compose `CARD_HOVER`; duplicate transition classes removed; StatCard metric ladder `base/lg/xl` + `tabular-nums` | `src/components/common/AntigravityCard.tsx` | T4 + screenshot |
| 5 | Premium skeleton `SKELETON_CARD_SURFACE` → `shadow-[var(--card-shadow)]` | `src/components/common/Skeleton.tsx` | T5 |
| 6 | `.light` `--bg-app:#FAFBFC`, `--bg-elevated:#F4F6F8`, `--bg-hover:#F4F6F8`, `--bg-active:#E7ECF1`; light `--skeleton-surface`/`--skeleton-block` → semantic aliases (`var(--bg-elevated)`/`var(--bg-active)`); light nav active `--bg-nav-active rgba(200,150,12,0.28)` / `--text-nav-active rgba(255,235,180,1)` | `src/styles/themes.css` | T6 + screenshot |
| 7 | Dead `.ancient-3d-lift` (×2), `.ancient-card`, `.ancient-card-dark`, `.light .ancient-*` recipes removed | `src/index.css` | T9 |
| 8 | Recent Activity heading `mb-5` | `src/components/user/dashboard/DashboardRecentActivity.tsx` | screenshot |
| 9 | TopicCard drop `hover:shadow-card-premium` → `CARD_HOVER` | `src/components/user/topics/TopicCard.tsx` | T4 |
| 10 | SubjectCardItem recipe `ancient-3d-lift` → `CARD_HOVER` | `src/components/admin/settings/SubjectCardItem.tsx` | T4 |
| 11 | LeaderboardView `brightness-[1.02]` → `CARD_HOVER` | `src/components/admin/leaderboard/LeaderboardView.tsx` | T4 |

Consumer consumer-surface footprint = counts 9–11 (TopicCard, SubjectCardItem, LeaderboardView) —
all three only *replace* a hover recipe with the certified `CARD_HOVER` composite; no other
markup change. Full consumer analysis in `FOUNDATION_CONSUMER_IMPACT_REPORT.md`.

---

## 2. Mechanical gates (executed)

### 2.1 TypeScript
```
npx tsc -b   → exit 0
```

### 2.2 Production build
```
npm run build   → exit 0
```
Pre-existing benign chunk-size warnings only.

### 2.3 ESLint on the changed source files
```
npx eslint <7 changed component/asset files>   → exit 0
```
`WelcomeBanner.tsx`, `AntigravityCard.tsx`, `Skeleton.tsx`, `themes.css`, `index.css`,
`TopicCard.tsx`, `SubjectCardItem.tsx`, `LeaderboardView.tsx`, `DashboardRecentActivity.tsx` — all
exit 0.

### 2.4 Test baseline (regression guard)
```
npm test   → 165/165 passed
```
7 pre-existing worker ESM errors (`ERR_REQUIRE_ESM` from `@csstools/css-calc` /
`@asamuzakjp/css-color`) remain — identical to the pre-change baseline; not introduced by this
phase.

---

## 3. Source-level atom checks (executed)

### 3.1 Zero banned banner primary chain
`src/components/user/WelcomeBanner.tsx` greeting label, name, heading, supporting text — **grep**
shows zero `text-warning` on the banner's primary text chain; all render `text-on-dark` at full
alpha. The uppercase `name` class is present.

### 3.2 Zero opacity-as-emphasis on primary text
No `/85` `/90` alpha suffix remains on the banner supporting/headline text. The only remaining tint
`bg-white/40` is a non-text divider/glyph, not a text emphasis.

### 3.3 ONE card hover — zero differing shadow/duration
- Grep `hover:shadow-card-premium` across `src`: **0 consumers** remaining.
- Grep `light:hover:shadow-premium-elevated` on cards: removed (StatCard light now → `CARD_HOVER`).
- Grep `brightness-[1.02]` (Leaderboard hover): removed.
- Grep `ancient-3d-lift` class usage in `.tsx`: **0** (recipe deleted from `index.css`; only doc/comment
  references remain).
- Card hover classes now resolve to exactly `CARD_HOVER`; no translate/scale/rotate/bounce present on
  any card hover.

### 3.4 Dead-recipe sweep (Task 9)
`src/index.css` contains no `.ancient-card`, `.ancient-card-dark`, `.ancient-3d-lift`, or
`.light .ancient-*` rule/recipe block. `README`/docs and the `themes.css:221` comment mention remain
(non-live, intentional).

### 3.5 Delete keeps no new colors
`themes.css` ⛌ `.light` introduced only **re-assignments of existing token names to brighter grayscale
hexes** — no new semantic name was added (the `--bg-*` and light `--skeleton-*` names already existed;
only their `.light` values changed, plus additive light-nav tokens). `--skeleton-surface`/`--skeleton-block`
remain the ONLY skeleton tokens.

### 3.6 Premium skeleton elevation
`Skeleton.tsx` premium card surface now carries `shadow-[var(--card-shadow)]` — matches final cards on
surface/radius/elevation; only the shimmer differs.

---

## 4. Manual visual checks (recommended — await user confirmation)

| # | Check | Expected |
|---|---|---|
| M1 | **Signed-in banner — dark + light** (user dashboard hero) | greeting label, **uppercased name**, heading, supporting text read white (`text-on-dark`) at full alpha on the forest `--gradient-header` surface — **no amber tint, no dimmed lines, no opacity emphasis**; divider is a subtle `bg-white/40` glyph |
| M2 | **StatCard labels — light mode** | stat labels sit at `text-text-secondary` (legible against `--bg-app #FAFBFC`), not `text-hint`; `--stat-label-text` quiet/disabled state unchanged |
| M3 | **Card hover (all variants)** | hovering default/premium/premium-neutral/premium-dark-neutral/StatCard/card rows produces the **same** subtle `bg-hover-bg/40` fill + `hover:shadow-card-hover-shadow` — **no lift/translate/scale/bounce, no per-card shadow difference** |
| M4 | **Premium skeleton** | placeholder surface/radius/elevation **match the final card** (shadow included); only the pulse differs |
| M5 | **Light surfaces** (lists, cards, sidebars, recent activity) | flat light canvas (#FAFBFC/#F4F6F8), brighter, hierarchy/contrast/shadows/premium feel retained — **no new color family introduced** |
| M6 | **Sidebar / active nav — light** | the light active item reads with a warm-amber translucent fill + bright text (`--bg-nav-active`/`--text-nav-active`) — more legible than the prior flat active |
| M7 | **Stat metric numerics** | value ladder `base→lg→xl`, tabular figures (`tabular-nums`) line up vertically |
| M8 | **Reduced motion / focus** | unchanged: `prefers-reduced-motion` honored; ONE visible focus ring |

---

## 5. Conclusion

All mechanically verifiable invariants pass on baseline: `tsc -b` exit 0, `npm run build` exit 0,
ESLint on changed files exit 0, `npm test` 165/165 with only the pre-existing worker ESM errors. The
banned banner primary chain, opacity-as-emphasis, per-card hover shadows, and `.ancient-*` recipes are
zero in scope. The `.light` surface shift is a token **value re-assignment only** (no new names).
Freeze intact — Foundation components + semantic tokens only, **no page migration**. The refinement
set is ready for user certification under DS-020.
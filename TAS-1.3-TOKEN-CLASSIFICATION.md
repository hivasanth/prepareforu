# TAS-1.3 — TOKEN CLASSIFICATION & FINAL DESIGN SYSTEM ARCHITECTURE

**Status:** READ-ONLY — No files modified, no tokens renamed/deleted, no patches generated.
**Date:** 2026-07-16
**Branch:** phase-3.5
**Project:** PrepareForU (React 19 + Tailwind v4 + Framer Motion 12 + TypeScript 5.9)
**Builds on:** `TAS-1.1-DESIGN-SYSTEM-INVENTORY.md`, `TAS-1.2-DESIGN-SYSTEM-STABILIZATION.md`, `src/styles/themes.css`, `src/index.css`.

**Final target architecture:**
```
Primitive Palette  →  Premium Material Tokens  →  Semantic Tokens  →  Reusable Components  →  Pages
Pages compose. Components own visuals. Theme owns tokens.
```

---

## 1. PRIMITIVE PALETTE INVENTORY (GROUP A)

Raw palette values. **Layer 1 in `themes.css:26-381`.** Never referenced directly by UI per spec, but several ARE (see §3).

| Palette | Tokens | Defined | Referenced in `.tsx`? | Status |
|---|---|---|---|---|
| Gray | `--gray-50..950` (11) | themes.css:28 | No | Unused primitive |
| Slate | `--slate-50..950` (11) | themes.css:41 | No | Unused primitive |
| Blue | `--blue-50..950` (11) | themes.css:53 | No (only via `--color-accent`) | Unused direct |
| Green | `--green-50..950` (11) | themes.css:66 | No (only via `--color-secondary`) | Unused direct |
| Red | `--red-50..950` (11) | themes.css:79 | No (only via `--color-danger`) | Unused direct |
| Amber | `--amber-50..950` (11) | themes.css:92 | No (only via `--color-warning`) | Unused direct |
| Purple | `--purple-50..950` (11) | themes.css:105 | No | Unused primitive |
| Emerald | `--emerald-50..950` (11) | themes.css:118 | No | Unused primitive |
| Teal | `--teal-50..950` (11) | themes.css:131 | No | Unused primitive |
| Cyan | `--cyan-50..950` (11) | themes.css:144 | No | Unused primitive |
| Rose | `--rose-50..950` (11) | themes.css:157 | No | Unused primitive |
| Pink | `--pink-600` (1) | themes.css:171 | No | Incomplete/unused |
| Orange | `--orange-50..950` (11) | themes.css:173 | No | Unused primitive |
| Indigo | `--indigo-50..950` (11) | themes.css:186 | No | Unused primitive |
| Brown (parchment) | `--brown-50..950` (16, non-std steps) | themes.css:199 | **YES** (`--brown-550` in AntigravityButton/AttemptCardBase) | **Primitive bypass** |
| Forest (light brand) | `--forest-50..950` (11) | themes.css:218 | **YES** (`--forest-900` in AntigravityCard/WelcomeBanner/Leaderboard) | **Primitive bypass** |
| Gold (light accent) | `--gold-50..400` (5) | themes.css:231 | **YES** (`--gold-200/300/400` in AttemptCardBase/CarouselDots/Leaderboard) | **Primitive bypass** |
| Dark base | `--dark-50..200` (3) | themes.css:239 | No | Unused primitive |
| Canvas | `--canvas-*` (8) | themes.css:243 | No | Unused primitive |
| Premium | `--premium-green/cream/gold` (3) | themes.css:253 | **YES** (`--premium-green` in PremiumLoader) | Intentional brand |
| AI tool | `--ai-terracotta`, `--ai-green` (2) | themes.css:258 | No | Unused primitive |
| Chart | `--chart-*` (12) | themes.css:262 | No (charts hardcode hex instead) | Unused primitive |
| Pie (admin) | `--pie-*` (6) | themes.css:277 | No | Unused primitive |
| Baseline | `--white`, `--black`, `--transparent` (3) | themes.css:284 | No (Tailwind defaults used) | Unused primitive |
| Radius | `--radius-none..4xl/full` (10) | themes.css:290 | Via semantic `--radius-*` | OK (Layer1) |
| Shadow offset | `--shadow-offset-*` (7) | themes.css:302 | No (composed in Layer2) | OK (Layer1) |
| Font | `--font-sans/mono` (2) | themes.css:311 | Yes (global) | OK (Layer1) |
| Weight | `--weight-*` (7) | themes.css:315 | Yes | OK (Layer1) |
| Text size | `--text-3xs..10xl` (17) | themes.css:323 | Via semantic/typography | OK (Layer1) |
| Line height | `--lh-*` (6) | themes.css:343 | Yes (index.css h1-h6) | OK (Layer1) |
| Letter spacing | `--ls-*` (7) | themes.css:351 | Yes | OK (Layer1) |
| Opacity | `--opacity-*` (21) | themes.css:360 | Via Tailwind `/xx` | OK (Layer1) |

**Primitive palette totals:** ~264 tokens. **Used directly in UI (violation):** Brown, Forest, Gold. **Premium used intentionally:** Premium. **Unused (candidates for prune in later phase):** Gray, Slate, Blue, Green, Red, Amber, Purple, Emerald, Teal, Cyan, Rose, Pink, Orange, Indigo, Dark, Canvas, AI, Chart, Pie, Baseline (~187 tokens, ~60%).

---

## 2. PREMIUM MATERIAL TOKEN INVENTORY (GROUP B)

Define the Premium Theme appearance. **All light-scoped, defined in `themes.css:727-817` (`.light`) and consumed by `.ancient-*` classes in `index.css:663-940`.** These are the "material language" layer.

| Token | Definition | Defined | Consumed By | Category |
|---|---|---|---|---|
| `--border-gold` | `#A87828` | themes.css:731 (light) | `.ancient-card`, `.ancient-tab-pill`, `.ancient-input`, `.ancient-otp`, AntigravityCard/Button, AttemptCardBase, TopicCard, CarouselDots | Gold edge |
| `--surface-stat` | parchment gradient | themes.css:732 | `stat-card-surface` @utility, StatCard | Stat surface |
| `--surface-stat-overlay` | parchment overlay gradient | themes.css:733 | (reserved) | Stat overlay |
| `--surface-tab-pill` | parchment pill gradient | themes.css:734 | `.ancient-tab-pill`, AntigravityData | Tab pill |
| `--card-parchment` | parchment card gradient | themes.css:735 | (reserved) | Card surface |
| `--card-3d-shadow` | carved parchment shadow | themes.css:736 | `--card-shadow` (light), `.ancient-card`? | Card shadow |
| `--stat-card-3d-shadow` | carved stat shadow | themes.css:743 | `--stat-card-shadow` (light) | Stat shadow |
| `--elevation-carved` | carved depth (inset+offset) | themes.css:750 | `--header-shadow` (light), `.ancient-*` hover, AntigravityCard/Button | Header/card depth |
| `--table-row-hover-light` | `#F8ECD0` | themes.css:755 | (reserved) | Table hover |
| `--gradient-header` | forest gradient `150deg` | themes.css:724 | `.ancient-card-dark`, `.ancient-sidebar`, AntigravityCard/Button, WelcomeBanner | Header/sidebar gradient |
| `--gradient-sidebar` | `rgba(12,32,20,0.95)` | themes.css:725 | `.ancient-sidebar` | Sidebar surface |
| `--gradient-surface` | warm surface sheen | themes.css:723 | `.micro-light`, `.ancient-card` | Surface sheen |
| `--gradient-app` | radial parchment | themes.css:722 | `.light body` | App background |
| `--header-shadow-md` | Family B medium carved | themes.css:1015 | `.ancient-tab-track`, `.ancient-icon-badge` | Tab/icon shadow |
| `--header-shadow-sm` | Family B small carved | themes.css:1020 | `.ancient-icon-badge` | Icon shadow |
| `--surface-primary/-nav/-floating/-overlay` | Foundation 4.6A semantic surfaces | themes.css:760-769 | `.ancient-card`, `.ancient-overlay`, `.ancient-sidebar` | Surfaces |

**`.ancient-*` material classes (defined in index.css, consume Group B + Group C):**
`.ancient-card`, `.ancient-card-dark`, `.ancient-tab-track`, `.ancient-tab-pill`, `.ancient-icon-badge`, `.ancient-input/select/textarea/otp`, `.ancient-overlay`, `.ancient-tooltip`, `.ancient-btn-primary/secondary/danger/success`, `.ancient-sidebar`, `.ancient-header`, `.ancient-nav-item-active`, `.ancient-3d-lift`, `.micro-light`, `.premium-card`, `.font-cinzel`, `.font-garamond`.

**Note:** `.ancient-card-dark` (index.css:686) and `.ancient-tab-track` inline `--tab-text-active:#2A1506` / `--tab-text-inactive:#E9D3A8` **hardcode hex** instead of using Group B tokens — see §3.

---

## 3. SEMANTIC TOKEN INVENTORY (GROUP C)

Purpose-bound, theme-aware. **`themes.css:392-604` (dark) + `:616-832` (light) + Layer 3 component tokens `:844-1040`.** Should never contain raw colors (most don't; exceptions flagged).

### 3.1 Background (Group C)
`--bg-app`, `--bg-surface`, `--bg-elevated`, `--bg-hover`, `--bg-active`, `--bg-disabled`, `--bg-input`, `--bg-overlay`, `--bg-success/warning/danger/accent-subtle`. Default owner: **themes.css Layer 2**. Runtime winner: **themes.css** (index.css only aliases them as `--app-bg` etc., which are downstream).

### 3.2 Text (Group C)
`--text-primary/secondary/title/muted/hint/disabled/on-accent/on-danger/link/on-dark`. **Conflict:** index.css:161-163 redefines `--text-primary/secondary/disabled` with the SAME literal hex but as a separate `:root` that wins at runtime (imported later). See §4/§6.

### 3.3 Border (Group C)
`--border-default/input/focus/hover/disabled/subtle`. **Conflict:** index.css:165 redefines `--border-subtle:#374151` (literal) overriding themes.css `var(--border-default)`. Also `--border-color` alias (index.css:164) and `--border-gold` (Group B, light-only).

### 3.4 Accent / Brand (Group C)
`--color-accent/-hover/-subtle/-rgb`, `--color-secondary/-secondary-light`. **Conflict:** `--color-secondary` is defined in themes.css:432 as `#10B981` BUT index.css `@theme` maps `--color-secondary: var(--secondary)` where `--secondary:#10B981` is a hardcoded shorthand (index.css:173). The `@theme` bridge therefore points to the hardcoded alias, not the Layer-2 token. Same pattern for success/danger/warning/info.

### 3.5 State (Group C)
`--color-success/-hover/-subtle`, `--color-warning-*`, `--color-danger-*`, `--color-info-*`. Same broken `@theme` chain as 3.4.

### 3.6 Shadow / Elevation (Group C)
`--shadow-xs..2xl`, `--elevation-1..7`, Foundation 4.6A `--shadow-ambient/contact/hover/pressed/focus/modal`, `--elevation-canvas..overlay`. **Three overlapping elevation systems, no clear hierarchy** (flagged TAS-1.2 R5).

### 3.7 Icon / Selection / Focus / Scrollbar / Placeholder / Gradient / Nav / Header / Misc
All Group C, theme-aware, mostly clean. `--ancient-*` (12) are Group C **compatibility aliases** (see §6).

### 3.8 Component tokens (Layer 3, Group C)
`--card-*`, `--stat-card-*`, `--btn-*`, `--input-*`, `--sidebar-*`, `--header-*` — reference only Group C/Group B. Clean ownership.

---

## 4. INVALID TOKEN USAGE REPORT

| # | Violation | Location | Type | Detail |
|---|---|---|---|---|
| V1 | **Primitive used directly by component** | AntigravityButton:18-19 (`--brown-550`, `--gold-400`) | Group A bypass | Should use Group B (`--border-gold`) / Group C |
| V2 | Primitive used directly by component | AntigravityCard:19 (`--forest-900`) | Group A bypass | Should use `--gradient-header` (Group B) |
| V3 | Primitive used directly by component | AttemptCardBase:46,53,82 (`--brown-550`, `--gold-400`) | Group A bypass | Same as V1 |
| V4 | Primitive used directly by component | WelcomeBanner:9, TopicCard (`--forest-900`, `--gold-200`) | Group A bypass | Should use Group B |
| V5 | Primitive used directly by component | CarouselDots:23 (`--gold-200`) | Group A bypass | Should use Group B `--border-gold` |
| V6 | Primitive used directly by page | LeaderboardComponents:15 (`--gold-300`) | Group A bypass | Rank coloring |
| V7 | **Hardcoded hex in material class** | index.css:686 `.ancient-card-dark` (`#162B1C/#0A1A10`), `:688` (`rgba(200,150,12,0.25)`) | Hex bypass | Bypasses `--gradient-header`/`--border-gold` |
| V8 | Hardcoded hex in material class | index.css:699-700 `.ancient-tab-track` (`--tab-text-active:#2A1506`, `--tab-text-inactive:#E9D3A8`) | Hex bypass | Should be Group C text tokens |
| V9 | **Hardcoded hex in chart/utility** | paletteColors.ts (`#22C55E #8B5CF6 #F59E0B #3B82F6 #64748B #94A3B8`) | Hex bypass (no theme) | Exam question palette — breaks dark/light |
| V10 | Hardcoded hex in component | TopicCard:24,31 (`#FFFDF9 #F5EAD4 #8B5A10`), ExamDetailModal/SplashPage | Hex bypass | Surface/shadow |
| V11 | Hardcoded shadow/radius in chart | DiagramRenderer (×3 `rgba(0,0,0,0.1)`), DailyAttemptsChart, SubjectPieChart (`12px` radius) | Hex/shadow bypass | Should use Group C `--shadow-*`/`--radius-*` |
| V12 | **Semantic token → semantic token unnecessarily** | index.css:61 `--color-border-subtle: var(--border-color)` → `--border-color: var(--border-default)` (double hop) | Redundant alias | Collapse to `var(--border-subtle)` |
| V13 | **Nonexistent token referenced by page** | SignupPage:257-261, 399, 404 (`--color-border-subtle`, `--color-danger`, `--color-warning`, `--color-info`, `--color-success`, `--color-text-secondary`) | Invalid namespace | `--color-*` is the @theme namespace, not a `var()` namespace; resolves to nothing |
| V14 | **Broken @theme → hardcoded chain** | index.css:38-42 `--color-secondary: var(--secondary)` where `--secondary:#10B981` (hardcoded) | Ownership break | Should point to `--color-secondary` (Layer 2) |
| V15 | **Material token bypassed** | `.ancient-card` uses `--surface-primary` + `--gradient-surface` (Group B) correctly, BUT `.ancient-card-dark` hardcodes gradient (V7) | Material bypass | Inconsistent material usage |
| V16 | **Duplicate aliases** | `--card-bg` defined twice: themes.css:853 (`var(--bg-surface)`) AND index.css:158 (`var(--bg-surface)`) | Duplicate | Harmless but redundant |
| V17 | Incorrect ownership | `Body`/`h1-h6` typography: themes.css `--text-3xs..10xl` + index.css `--text-h1..h6` (4 definitions) | Conflicting scale | Single source needed |

---

## 5. COMPONENT OWNERSHIP MATRIX

"Should it?" = per target architecture (components consume Group C; only light-premium surfaces consume Group B; never Group A / hardcoded).

| Component | Uses Group A directly? | Uses Group B? | Uses Group C? | Hardcoded? | Inline styles? | Should? | Notes |
|---|---|---|---|---|---|---|---|
| **Button / PrimaryButton** | YES (`--brown-550`,`--gold-400`) | YES (`--gradient-header`) | YES (`--btn-*`) | no | no | **NO** (fix V1) | Light premium button reaches into primitives |
| **Card / StatCard** | partial (`--forest-900` in premium variant) | YES (`--border-gold`,`--stat-card-*`) | YES (`--card-*`) | no | no | mostly YES | Premium Card variant V2 |
| **Input / Select / Switch** | no | YES (`.ancient-input` via Group B) | YES (`--input-*`) | no | no | YES | Clean |
| **Tabs** | no | YES (`--surface-tab-pill`,`--border-gold`) | YES | no | no | YES | Clean material usage |
| **Badge / TagBadge** | no | no | YES (`--color-*`) | no | no | YES | Clean |
| **ProgressBar / MetricBlock** | no | no | YES (`--color-*`) | no | no | YES | Clean (default `color="var(--primary)"` shorthand — see V14) |
| **Modal / AdminModal / ConfirmModal** | no | YES (`.ancient-overlay`) | YES | no | no | YES | Clean |
| **Header / Sidebar** | no | YES (`--gradient-header/sidebar`,`--header-shadow`) | YES | no | no | YES | Clean |
| **Typography H1-H3/Body/Label** | no | no | YES (`--text-*`) | no | no | YES | But scale conflict (V17) |
| **PageContainer / Stack / Grid** | no | no | YES | no | no | YES | Spacing constants not tokens (minor) |
| **LoadingSkeleton / ErrorState** | no | no | YES | no | no | YES | Clean |
| **AttemptCardBase** | YES (`--brown-550`,`--gold-400`) | YES (`--border-gold`) | YES | no | no | **NO** (fix V3) | |
| **ExamCard / TopicCard** | YES (`--forest-900`,`--gold-200`) | YES (`--border-gold`) | YES | YES (hex `#FFFDF9` etc.) | no | **NO** (fix V4/V10) | |
| **Reader (TopicReader)** | no | YES (`--border-gold` inline boxShadow) | YES | YES (inline `boxShadow` primitive) | YES (Framer `boxShadow`) | YES (material) | Inline primitive shadow acceptable as material intent |
| **WelcomeBanner** | YES (`--forest-900`) | YES (`.ancient-card-dark`) | YES | no | no | **NO** (fix V2) | `.ancient-card-dark` itself hardcodes (V7) |
| **CarouselDots** | YES (`--gold-200`) | YES (`--border-gold`) | YES | YES (rgba hex) | no | **NO** (fix V5) | |
| **Palette (charts) — paletteColors.ts** | no | no | no | YES (6 hex) | no | **NO** (fix V9) | Critical: not theme-aware |
| **DiagramRenderer / DailyAttemptsChart / SubjectPieChart** | no | no | partial | YES (shadow/radius hex) | YES (`contentStyle`) | **NO** (fix V11) | |

---

## 6. COMPATIBILITY ALIAS REPORT

Tokens existing only for backward compatibility. Per themes.css header, ancient tokens are "removed Phase 7."

| Token | Reason | Consumers | Can Remove Later? | Migration Phase |
|---|---|---|---|---|
| `--ancient-gold` | compat alias → `--color-accent` (dark) / `#C8960C` (light) | 55+ refs (TopicSectionRenderer, TopicReader, SplashPage, BulkActionBar…) | YES (after consumers repointed) | Phase 7 |
| `--ancient-brown-deep` | alias → `--text-primary` / `#2D1505` | several | YES | Phase 7 |
| `--ancient-brown` | alias → `--text-secondary` / `#5D4037` | BulkActionBar, etc. | YES | Phase 7 |
| `--ancient-cream` | alias → `--bg-surface` / `#DFC096` | AdminCard, etc. | YES | Phase 7 |
| `--ancient-danger` | alias → `--color-danger` / `#DC2626` | buttons | YES | Phase 7 |
| `--ancient-danger-hover` | alias (transparent/`#FEE2E2`) | buttons | YES | Phase 7 |
| `--ancient-badge-bg/-border` | alias (transparent) | badges | YES | Phase 7 |
| `--ancient-forest` | alias → `--color-accent` | buttons | YES | Phase 7 |
| `--ancient-gold-bright` | alias → `--color-accent` | buttons | YES | Phase 7 |
| `--ancient-amber` | alias → `--color-warning` | badges | YES | Phase 7 |
| `--ancient-cream-light` | alias → `--bg-surface` | cards | YES | Phase 7 |
| `--primary` | shorthand → `--color-accent` | many components | YES | TAS-2 |
| `--primary-hover/-subtle/-rgb` | shorthand → `--color-accent-*` | components | YES | TAS-2 |
| `--secondary/--success/--danger/--warning/--info` | **hardcoded hex shorthands** | charts, pages, `@theme` bridge | YES (delete, route to Layer 2) | TAS-2 |
| `--app-bg/--card-bg/--elevated-bg/--hover-bg` | redundant aliases → `--bg-*` | body, components | YES (delete) | TAS-2 |
| `--border-color` | alias → `--border-default` | `@theme` | YES (use `--border-subtle`/`--border-default`) | TAS-2 |
| `--text-h1..h6` (index.css `:root`) | duplicate of themes.css scale | global h1-h6 | YES (keep one source) | TAS-2 |

---

## 7. DEPRECATED TOKEN REPORT (DO NOT REMOVE)

| Category | Tokens | Detail |
|---|---|---|
| **Unused** | `--gray-*`, `--slate-*`, `--blue-*`, `--green-*`, `--red-*`, `--amber-*`, `--purple-*`, `--emerald-*`, `--teal-*`, `--cyan-*`, `--rose-*`, `--orange-*`, `--indigo-*`, `--dark-*`, `--canvas-*`, `--ai-*`, `--chart-*`, `--pie-*`, `--baseline-*`, `--pink-600` | ~187 primitives never referenced in `.tsx`; charts hardcode hex instead of `--chart-*` |
| **Duplicated** | `--card-bg` (themes.css:853 + index.css:158), `--text-primary/secondary/disabled` (themes.css + index.css:161-163), `--border-subtle` (themes.css:425 + index.css:165), `--text-h1..h6` (4 places), `--radius-xl/2xl/3xl` (themes.css + index.css @theme) | Runtime winner = index.css (imported later) |
| **Conflicting** | `--radius-xl` (themes 20px vs index 12px), `--radius-2xl` (24px vs 16px), `--color-secondary` chain (`#10B981` hardcoded vs Layer-2 `#10B981`/light `#C8960C`), `--border-subtle` (themes `var(--border-default)` vs index literal) | Differing values by access path |
| **Incorrectly Named** | `--brown-150/250/350/450/550/650/750` (non-standard 50-step increments), `--pink-600` only (incomplete scale), `--gold-50..400` only (incomplete), `--ancient-*` namespace mixing color+compat concerns | Naming inconsistent with other scales |
| **Temporary** | `--secondary/--success/--danger/--warning/--info` (index.css shorthands), `--color-border-subtle`/`--color-*` var() refs in SignupPage (typo of @theme namespace) | Scaffolding to be removed in TAS-2 |
| **Legacy** | All 12 `--ancient-*` tokens (themes.css:592-603 + index.css:180-191), `.ancient-*` CSS classes, `.font-cinzel`/`.font-garamond` (now aliases to `--font-sans`), `.premium-card`, `.micro-light` | Marked "removed Phase 7" |

---

## 8. FINAL DEPENDENCY GRAPH

```
PRIMITIVE PALETTE (Group A: themes.css :root)
   gray/slate/blue/green/red/amber/purple/emerald/teal/cyan/rose/pink/orange/indigo
   brown/forest/gold/dark/canvas/premium/ai/chart/pie/baseline
   radius-/shadow-offset-/font-/weight-/text-size-/lh-/ls-/opacity-
        ↓ (ONLY semantic + premium material may reference)
PREMIUM MATERIAL TOKENS (Group B: themes.css .light + .ancient-* classes)
   --border-gold, --surface-stat, --surface-tab-pill, --card-3d-shadow,
   --stat-card-3d-shadow, --elevation-carved, --gradient-header/sidebar/surface/app,
   --header-shadow-md/sm, --surface-primary/nav/floating/overlay
        ↓
SEMANTIC TOKENS (Group C: themes.css :root + .light + Layer 3)
   --bg-*, --text-*, --border-*, --color-accent/secondary, --color-success/warning/danger/info,
   --shadow-*/--elevation-*, --icon-*, --focus-*, --scrollbar-*, --gradient-*, --nav-*, --header-*,
   --card-*, --stat-card-*, --btn-*, --input-*, --sidebar-*, --header-*
        ↓
REUSABLE COMPONENTS
   ↓
PAGES (compose only)

Per-component chains:
Button        → Group C (--btn-*) + Group B (--gradient-header) + [V1: Group A --brown-550/--gold-400]
Card          → Group C (--card-*) + Group B (--border-gold,--stat-card-*) + [V2: Group A --forest-900]
StatCard      → Group C (--stat-card-*) + Group B (--surface-stat,--stat-card-3d-shadow)
Input         → Group C (--input-*) + Group B (.ancient-input/.ancient-otp)
Modal         → Group C (--card-bg,--border-subtle) + Group B (.ancient-overlay)
Tabs          → Group C (--bg-nav-*) + Group B (--surface-tab-pill,--border-gold)
Progress      → Group C (--color-success/warning/danger/info)
Header        → Group C (--header-*) + Group B (--gradient-header,--elevation-carved)
Sidebar       → Group C (--sidebar-*) + Group B (--gradient-sidebar,--header-shadow)
Typography    → Group C (--text-*)  [V17: scale conflict in index.css]
Layout        → Group C (--border-subtle,--card-bg,--elevation-6)
AttemptCard   → Group C + Group B (--border-gold) + [V3: Group A --brown-550/--gold-400]
TopicCard     → Group C + Group B (--border-gold) + [V4/V10: Group A --forest-900 + hex]
WelcomeBanner → Group C + Group B (.ancient-card-dark) + [V2/V7: Group A --forest-900 + hardcoded hex]
```

---

## 9. FINAL DESIGN SYSTEM ARCHITECTURE

**Layer 1 — Primitive Palette (Group A).** Raw color/radius/shadow/font/opacity values in `themes.css :root`. Responsibility: define the paint, nothing else. Must NEVER be referenced by components or pages. Today Brown/Forest/Gold/Premium are leaked into UI (V1-V6) — to be routed through Group B/C.

**Layer 2 — Premium Material Tokens (Group B).** Light-scoped "premium parchment/forest/gold" material language (`themes.css .light` + `.ancient-*` classes). Responsibility: encode the Premium Theme's distinctive surface/material appearance (carved shadows, gold edges, forest gradients). Consumed by reusable components that render premium surfaces. Currently `.ancient-card-dark` and `.ancient-tab-track` hardcode hex (V7/V8) — should consume Group B.

**Layer 3 — Semantic Tokens (Group C).** Purpose-bound, theme-aware tokens (`themes.css :root`+`.light`+Layer3 component tokens). Responsibility: map intent (text-primary, success, card-bg) to theme values. Must never contain raw colors (most don't; the index.css redefinitions and `--secondary` hardcoded shorthands violate this). Single source of truth must live here.

**Layer 4 — Reusable Components.** Button/Card/StatCard/Input/Modal/Tabs/Progress/Header/Sidebar/Typography/Layout/AttemptCard/TopicCard/WelcomeBanner. Responsibility: own visuals, consume Group B (material) + Group C (semantic) only. Several currently leak Group A / hardcoded hex (§5).

**Layer 5 — Pages.** Responsibility: compose reusable components only. Today ~16 page/view files own colors/shadows/z-index/hex directly (§3 V9-V13, TAS-1.2 §5).

---

## 10. MIGRATION READINESS SCORE

| Dimension | Score / 100 | Rationale |
|---|---|---|
| Primitive Palette | **70** | Well-defined; ~187 unused tokens (prune later), but 4 palettes (Brown/Forest/Gold/Premium) leak into UI. |
| Premium Material | **65** | Coherent light material language, but `.ancient-card-dark`/`.ancient-tab-track` hardcode hex (V7/V8); some material tokens reserved/unused. |
| Semantic Tokens | **40** | Single source of truth BROKEN: index.css redefines text/border/card tokens and wins at runtime; `--color-*` @theme chain points to hardcoded shorthands (V14); `--color-*` var() typos in pages (V13). |
| Reusable Components | **68** | Strong Antigravity system; violations localized to light-premium components + chart wrappers. |
| Pages | **45** | ~16 files own visuals directly; `paletteColors.ts` hardcodes 6 non-theme-aware hex. |
| **Overall Readiness** | **58** | Architecture classified but NOT stable. Semantic layer must be single-sourced before TAS-2 implementation. |

---

## 11. BLOCKERS

| # | Blocker | Severity | Gates |
|---|---|---|---|
| B1 | index.css `:root` redefines `--text-primary/secondary/disabled`, `--border-subtle`, `--card-bg` and wins at runtime → deleting requires capturing current rendered values first (TAS-1.2 R1) | HIGH | TAS-2 |
| B2 | `--color-secondary/--success/--danger/--warning/--info` `@theme` bridge points to hardcoded `--secondary` etc. (not Layer 2) → broken chain, no light override (TAS-1.2 R3) | HIGH | TAS-2 |
| B3 | Radius conflict `--radius-xl/2xl` (themes 20/24px vs index 12/16px) changes card/container sizing app-wide (TAS-1.2 R2) | HIGH | TAS-2 |
| B4 | `paletteColors.ts` + chart wrappers hardcode hex → dark/light broken; must add semantic chart tokens before Tables/Charts migration | HIGH | TAS-2 (charts step) |
| B5 | No z-index token ladder; 72 ad-hoc `z-*` usages (TAS-1.2 §10 R-void) | MEDIUM | TAS-2 (layouts step) |
| B6 | 4-definition typography scale (`--text-h1..h6`) → unify before typography migration | MEDIUM | TAS-2 |
| B7 | SignupPage references nonexistent `--color-*` var() namespace (V13) → silent no-op; fix before page cleanup | MEDIUM | TAS-2 |

---

## 12. RECOMMENDATIONS FOR TAS-2 (THEME TOKEN CONSOLIDATION)

1. **Single-source the Semantic layer (B1/B2):** Delete the index.css `:root` redefinitions of `--text-primary/secondary/disabled`, `--border-subtle`, `--card-bg` and the hardcoded `--secondary/--success/--danger/--warning/--info` shorthands. Repoint `@theme --color-*` to Layer-2 `--color-*`. Capture current index.css rendered values first to avoid regression.
2. **Fix radius conflict (B3):** Adopt themes.css values; delete `--radius-xl/2xl/3xl` from index.css `@theme`. Audit card/container sizing.
3. **Unify typography (B6):** Collapse 4 `--text-h1..h6` definitions into one semantic scale in themes.css; remove index.css duplicates.
4. **Route primitives through material/semantic (V1-V6):** Replace `--brown-550/--gold-200/300/400/--forest-900` in AntigravityButton/Card, AttemptCardBase, TopicCard, WelcomeBanner, CarouselDots, LeaderboardComponents with Group B (`--border-gold`, `--gradient-header`) or Group C tokens.
5. **De-hex the material classes (V7/V8):** `.ancient-card-dark` and `.ancient-tab-track` should consume `--gradient-header`/`--border-gold`/Group C text tokens instead of literal hex.
6. **Theme-aware charts (B4):** Add `--color-palette-current/answered/marked/skipped` semantic tokens; migrate `paletteColors.ts` + DiagramRenderer/DailyAttemptsChart/SubjectPieChart off hardcoded hex/shadows/radii.
7. **Introduce z-index ladder (B5):** `--z-dropdown/--z-sticky/--z-overlay/--z-modal/--z-toast/--z-splash`; replace ~72 ad-hoc `z-*`.
8. **Fix page token typos (B7):** SignupPage `--color-*` → correct Group C tokens.
9. **Prune unused primitives (Group A):** After full reference scan, remove ~187 unused scales (gray/slate/blue/green/red/amber/purple/emerald/teal/cyan/rose/orange/indigo/dark/canvas/ai/chart/pie/baseline). Do NOT remove Brown/Forest/Gold/Premium (used).
10. **Keep compatibility aliases (§6) intact** through Phase 7; only remove `--primary/--secondary/...` shorthands in TAS-2.
11. **Do NOT modify** dark/light mode values, animations, layouts, spacing, routing, auth, or business logic — out of scope per TAS-1.3 rules.

**STOP — awaiting approval before TAS-2 (Theme Token Consolidation). No files modified, no code generated.**

# Phase 5.4 — Surface Language Specification

**Status:** ⏳ AWAITING APPROVAL (design proposal — no implementation until approved)
**Date:** 2026-08-06
**Parent audit:** `VISUAL_LANGUAGE_AUDIT.md`
**Authority:** FOUNDATION_GOVERNANCE.md v1.18.0 — this spec defines the ONE surface language.

---

## 1. Purpose

Define the single, permanent surface language for the application. One set of surface materials,
two certified families (Premium + Management), one source of truth (the Foundation token system).
All surfaces — app canvas, cards, navigation, header, form fields, tables, overlays, stat
surfaces, skeleton surfaces — resolve through Layer 2/3 tokens. No hardcoded colors, no inline
styles, no page exceptions.

---

## 2. The two families (design intent, frozen as THE language)

| | **Premium family** | **Management family** |
|---|---|---|
| Role | Branded, accent-forward material (default render) | Neutral tooling/CRUD material (additive opt-in) |
| Namespace | `--bg-*`, `--text-*`, `--border-*`, gold/accent material tokens, `.ancient-*` classes | `--management-*` only |
| Opt-in | default | `variant="management"` / `management` prop |
| Light identity | forest gradient + gold edge (ancient classes) | neutral white/slate + app accent |
| Dark identity | neutral dark tokens (baseline `:root`) | neutral dark tokens (reuses baseline exactly) |
| Accent | gold `--color-secondary` / forest `--color-accent` | `var(--management-accent)` = `var(--color-accent)` |
| Certified since | DS-001, D-141 (gold accent family) | D-144 (Phase 3.9) |

**Rule:** A management surface may consume ONLY `--management-*` tokens for its surface/border/
shadow/accent. Theme text tokens (`--text-primary`, `--text-secondary`, `--text-muted`) are used
for content on management surfaces (neutral in both themes). Zero amber/gold in the management
namespace.

---

## 3. Surface hierarchy — the 7-level canonical scale ✅ CERTIFIED (Phase 5.4A)

Design: a permanent, named hierarchy. **No component may invent another surface level.** Every
surface in the app maps to one of these levels. Resolved values below are the certified
post-Phase-5.4A values (light relight applied).

| Level | Name | Canonical token | Light | Dark | Purpose |
|---|---|---|---|---|---|
| L0 | **App Background** | `--surface-canvas` = `--bg-app` | #F8FAFC | #111827 | page floor (`bg-app-bg`) |
| L1 | **Page Surface** | premium `--bg-surface` / management `--management-surface` | #FFFFFF / #FCFCFD | #1F2937 / #1F2937 | the surface pages sit on inside the canvas; management scaffold |
| L2 | **Primary Surface** | `--surface-primary` = `--bg-surface` (premium) / `--management-surface` | #FFFFFF / #FCFCFD | #1F2937 | cards, panels, collections (`bg-card-bg`) |
| L3 | **Secondary Surface** | `--surface-secondary` = `--bg-elevated` (premium) / `--management-surface-muted` | #F1F5F9 / #F6F8FA | #374151 | nested containers, toolbars, filters, section strips |
| L4 | **Elevated Surface** | `--surface-raised` / `--surface-floating` = `--bg-elevated` | #F1F5F9 | #374151 | floating contexts, inset panels |
| L5 | **Interactive Surface** | `--surface-interactive` / `--surface-hover` = `--bg-hover` (premium) / `--management-surface-hover` | #F1F5F9 / #EDF1F5 | #1F2937 / #374151 | hover/active fills, inputs, ghost controls |
| L6 | **Overlay Surface** | `--surface-overlay` = `--bg-overlay` | rgba(15,23,42,0.45) | rgba(0,0,0,0.6) | modal scrims, drawers, dropdowns |

**Mapping rules:**
- Premium family → L1/L2 = `--bg-surface`; L3 = `--bg-elevated`; L5 = `--bg-hover`/`--bg-active`.
- Management family → L1/L2 = `--management-surface` (relight #FCFCFD); L3 = `--management-surface-muted`
  (#F6F8FA); L5 = `--management-surface-hover` (#EDF1F5)/`--management-surface-active`.
- L6 overlay is theme-agnostic (`--bg-overlay`), applied as `bg-app-bg/60 backdrop-blur-md` for
  modals per certified `AdminModal` parity.
- **No component defines L0–L6 outside this table.** Anything that looks like a surface must be
  one of these or a token of one of these. No additional levels may be introduced.

---

## 4. Management relight ✅ CERTIFIED (Phase 5.4A — implemented in `themes.css`)

The task requires the unified admin/management surface to be **brighter, cleaner, modern,
neutral** and explicitly **NOT white, parchment, amber, yellow, cream, brown** — with dark mode
**pixel-identical**.

Pre-relight management light values (themes.css:939–941): `--management-surface: #FFFFFF`,
`--management-surface-muted: #F8FAFC`, `--management-surface-hover: #F1F5F9`. Pure white is
excluded by the brief; the muted/hover steps read slightly heavy next to the page canvas.

### 4.1 Implemented light ladder (Phase 5.4A, `.light` block only — the certified baseline)

| Token | Before | After (certified) | Rationale |
|---|---|---|---|
| `--management-surface` | `#FFFFFF` | `#FCFCFD` | near-white neutral (slate-tinted), NOT white; brighter than any gray; pairs with `--management-border: #E2E8F0` (border contrast ≈1.2:1 non-text, fine) |
| `--management-surface-muted` | `#F8FAFC` | `#F6F8FA` | cleaner cool slate; distinct from `--bg-app` canvas so the page-surface step reads as a layer |
| `--management-surface-hover` | `#F1F5F9` | `#EDF1F5` | brighter, modern cool hover; still one step below muted |
| `--management-surface-active` | `var(--bg-accent-subtle)` | unchanged | accent-tinted selection (app accent) |
| borders/shadows | as-is | unchanged | neutral, cool, never warm/gold |

Rejected alternatives (explicitly against the brief): `#FFFFFF` (white), `#FBFAF7`/cream (warm/
parchment — Phase 4.2 retired parchment), any amber/yellow/brown tint, any `.light`-only warm shadow.

Dark-mode values **unchanged** (reuse baseline tokens exactly → pixel-identical).

### 4.2 Contrast check (certified values)
| Pair | Ratio | Verdict |
|---|---|---|
| `--text-primary` (#111827) on `#FCFCFD` | ≈ 19.6 : 1 | ✅ |
| `--text-secondary` (#4B5563) on `#F6F8FA` | ≈ 7.4 : 1 | ✅ |
| `--text-muted` (#6B7280) on `#F6F8FA` | ≈ 4.6 : 1 | ✅ (≥ 4.5) |
| `--text-primary` on `#EDF1F5` | ≈ 16.5 : 1 | ✅ |

### 4.3 Elevation — the 4-level ladder ✅ CERTIFIED (Phase 5.4A)

Design: **exactly 4 elevation levels. No custom shadows.** All shadow tokens map onto the ladder.

| Level | Name | Usage | Canonical shadow |
|---|---|---|---|
| **E0** | Flat | page canvas, inset fields, tables inside cards | `--elevation-0: none` (= `shadow-none` / `shadow-elevation-0`) |
| **E1** | Card / default | default cards, panels, toolbars, stat containers, management surfaces | `--elevation-2` (premium `--card-shadow`; management `--management-shadow`) |
| **E2** | Hover / raised | hovered cards, raised panels, menus, dropdowns, popovers | `--elevation-3` (premium `--card-hover-shadow`/`shadow-card-premium`; management `--management-shadow-hover`) |
| **E3** | Modal / floating | modals, drawers, toasts, tooltips, fixed overlays | `--elevation-4` |

Rules:
- **No shadow class outside the ladder** in consumer code. Existing special shadows to migrate:
  `shadow-card-shadow` → E1, `shadow-card-hover-shadow`/`shadow-card-premium` → E2,
  `shadow-elevation-1..4` → E1..E4, `--header-shadow`/carved/3D shadows → stay **only** where a
  frozen premium material defines them (StatCard D-141, Button primary D-123, `.ancient-*`,
  `--elevation-carved`) — those are frozen family materials, not free-form consumer shadows.
- `shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]` (SubjectCardItem) → a named E2 token or the
  management hover shadow.
- Recharts tooltips remain chart-exempt (library-level).
- `shadow-warning/30`, `shadow-success/20`, `shadow-danger/20` (colored glows on status buttons/
  rank badges) are **accent glows on E1/E2**, not elevation levels — permitted as token-typed
  shadows layered on the ladder base.

---

## 5. Card surface language

Source of truth: `AntigravityCard.tsx` (frozen DS-001 base + premium variants) + management
variant. Current constants:

| Constant | Value |
|---|---|
| `PREMIUM_SURFACE` | `bg-card-bg border-[1.8px] border-card-premium-border shadow-card-shadow` |
| `PREMIUM_SURFACE_HOVER` | `hover:shadow-card-premium` |
| `GOLD_SURFACE` | `stat-card-surface border border-gold-300` |
| `MANAGEMENT_SURFACE` | `bg-[var(--management-surface)] border-[1.8px] border-[var(--management-border-strong)] shadow-[var(--management-shadow)]` |
| `MANAGEMENT_SURFACE_HOVER` | `hover:shadow-[var(--management-shadow-hover)]` |
| Hover base | `transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5` |

**Certified render rules:**
- Card surface = `--bg-surface` (dark `#1F2937`, light `#FFFFFF`); premium border = gold-300 in
  light / transparent in dark (D-141 carve-out); management border = `--management-border-strong`.
- Card radius = `--radius-card` (`--radius-3xl`). Padding via `padding` prop (16/24).
- Card hover = translate-y -0.5 + shadow lift (`PREMIUM_SURFACE_HOVER` / `MANAGEMENT_SURFACE_HOVER`),
  200ms.
- **No new Card variant.** Reuse the existing variants; do not restyle frozen DS-001.

**Consumers to align (migration issues S-1…):** see `FOUNDATION_VISUAL_MIGRATION_PLAN.md`.

---

## 6. Navigation & header surface language

Source of truth: `Navigation.tsx` + `SidebarLayout.tsx` (frozen materials, D-123 / D-144).

| Element | Dark (baseline) | Light |
|---|---|---|
| Sidebar shell | `bg-sidebar border-r border-border-subtle` | `ancient-sidebar` (forest gradient + gold edge) |
| Mobile drawer | `bg-card-bg border-r border-border-subtle` | `ancient-sidebar` |
| Header | `bg-card-bg/80 backdrop-blur-xl border-border-subtle` | `ancient-header` |
| Active nav item | `bg-primary text-white shadow-md shadow-primary/20` | `ancient-nav-item-active` |
| Inactive nav item | `text-text-secondary hover:bg-hover-bg hover:text-text-primary` | same |
| Nav icon (active/inactive) | `text-white` / `text-text-secondary lg:group-hover/nav:text-primary` | same |
| Collapse toggle | `bg-sidebar border border-border-subtle` | same (inherits shell) |
| Footer | `bg-hover-bg/30 border-t border-border-subtle` | same |
| Tooltip | `bg-slate-900 text-white` | same |

**Rules:**
- Navigation consumes `--sidebar-*`, `--header-*`, `--nav-*`, `--ancient-*` classes. No page
  overrides. `--ancient-*` resolve to tokens (verified: `--ancient-gold-bright → --color-secondary-light`).
- The `ancient-sidebar`/`ancient-header` light identity is **frozen** (D-123). Do not restyle.
- `bg-slate-900` tooltip is a certified fixed-dark tooltip surface (same in both themes) —
  documented, not a violation (fixed-dark legend `--text-on-dark` precedent).

---

## 7. Form field surface language

Source of truth: `AntigravityForm.tsx` (Input/TextArea/Select).

| Token | Value | Notes |
|---|---|---|
| `--input-bg` | `var(--bg-hover)` (dark `#1F2937`, light `#F1F5F9`) | certified Input render (D-121 re-anchor) |
| `--input-border` | `var(--border-subtle)` | certified |
| `--input-focus-border` | `var(--border-focus)` | |
| `--input-focus-shadow` | `0 0 0 3px var(--focus-ring-color)` | |
| `--input-padding-y` | 12px | |
| `--input-padding-x` | 16px | |
| `--input-radius` | `var(--radius-control)` | |
| Placeholder | `--placeholder-color` (light #9CA3AF, dark #9CA3AF) | |

**Management field variant:** `management` excludes `.ancient-input` (light keeps neutral field),
so management fields are `--bg-hover`/`--border-subtle` in both themes — no gold in management.

**Rules:**
- Fields always render via `Input`/`TextArea`/`Select`; no raw inputs in admin/user code.
- `.ancient-input` remains the premium light field identity (certified, ds003-tested).

---

## 8. Table / list surface language

Source of truth: `AntigravityData.DataGrid` + `LeaderboardView` (certified parity precedent).

| Element | Render |
|---|---|
| Table wrapper | certified `Card` (`p-0 border-none shadow-2xl`) or management Card |
| Header row | `border-b bg-hover-bg/50 border-border-subtle` |
| Header cell | `px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest` |
| Body row | `group hover:bg-hover-bg/30 transition-colors` |
| Selected row | `bg-primary/5` |
| Striped row | `bg-hover-bg/20` |
| Divider | `divide-y divide-border-subtle/10` |

**Management table** (UsersTable): `CollectionCard` management + `GridSkeleton` management —
already the reference. Align other tables (Questions `QuestionsTable`, Sub-Admins) to the same
family via Card/GridSkeleton.

---

## 9. Stat surface language

Source of truth: `StatCard` (D-141 certified gold-accent), `StatCard status=` variants,
`StatsGrid`, `DashboardStatsGrid`.

| Element | Render |
|---|---|
| StatCard (accent) | `stat-card-surface border border-gold-300 shadow-stat-card-3d-shadow` (light gold gradient) |
| StatCard tokens | `--stat-card-bg`, `--stat-card-border`, `--stat-card-shadow` |
| Value/label | `--stat-value-text` / `--stat-label-text` (fixed to semantic in Phase 4.6A) |
| Icon container | `--stat-icon-bg` (`--bg-accent-subtle`) + `--stat-icon-color` |
| Status tones | `status="accent/secondary/info/warning"` |

**Rules:** StatCards stay premium-accent (frozen D-141). Admin `StatsGrid` already reuses the
certified User `DashboardStatsGrid` pattern (Phase 3.1 §8.5). No new stat surface.

---

## 10. Overlay / modal surface language

Source of truth: `AdminModal`, `ConfirmModal`, `PromptEditorModal` (certified parity).

| Element | Render |
|---|---|
| Scrim | `bg-app-bg/60 backdrop-blur-md` |
| Panel | `rounded-[2.5rem] bg-card-bg` (shadow via token) |
| Toast container | `ToastContainer` (premium + management variants) |
| Loader overlay | `LoadingOverlay` |

**Rules:** Overlay = `bg-app-bg/60 backdrop-blur-md`; panel radius = `--radius-card` equivalent
(`rounded-[2.5rem]` per Phase 3.1 §8.4 parity fixes). No `bg-black/*` scrims (migrate any).

---

## 11. Skeleton surface language

Source of truth: `SharedComponents.tsx` — `LoadingSkeleton`, `GridSkeleton`, `StatSkeleton`.

| Token | Value | Use |
|---|---|---|
| `MANAGEMENT_SKELETON_SURFACE` | `--management-surface-muted` based | management skeleton base |
| `MANAGEMENT_SKELETON_BLOCK` | muted block | management skeleton bars |

**Rule:** Skeletons pulse via `animate-pulse`, base on `--bg-hover-bg`/`--bg-elevated` (premium) or
the management skeleton tokens (management). No raw `bg-slate-*`/`bg-white/…` skeleton bars.
See `SKELETON_LANGUAGE_SPECIFICATION.md`.

---

## 12. Issue list (S-*/E-*) — surface & elevation migration backlog

Each issue is fully specified in `FOUNDATION_VISUAL_MIGRATION_PLAN.md`.

| ID | Surface | Change |
|---|---|---|
| S-1 | Light management ladder | Relight `--management-surface`/`-muted`/`-hover` to `#FCFCFD`/`#F6F8FA`/`#EDF1F5` (Design Decision + Freeze Register entry; dark unchanged) |
| S-2 | `BulkActionBar` | Remove `isDark` branch; single surface via management tokens (light) / `bg-card-bg` (dark) — or unify to one Card surface |
| S-3 | `AdminIconWrap` | Remove `!isDark` branch; decide one certified render for both themes (premium `ancient-icon-badge` in light / `bg-primary/10 text-primary` in dark is the certified pattern — document as frozen, no change) |
| S-4 | Admin Questions surfaces | Migrate `QuestionsActions`, `QuestionsTable`, modals, `QuestionForm` containers to management family |
| S-5 | Admin Overview chart panel | `Card variant="premium-neutral"` → management Card (or keep premium if approved as the chart accent — decision required) |
| S-6 | Admin Topics/Settings/Leaderboard/Upload containers | Align toolbars/cards to management family where tooling; keep premium for stat/accent surfaces |
| S-7 | `PremiumLoader` | Replace raw hex `#2c4c3b` / `#f4ebd8` with tokens (§7.1 audit) |
| S-8 | SubjectCardItem selected shadow | `shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]` → named shadow token (E2) |
| S-9 | Table surfaces | Align Questions/Sub-Admins tables to `DataGrid`/`CollectionCard` management render |
| E-1 | Elevation ladder adoption | Map consumer shadows to E0–E3 (§4.3); remove free-form shadows (sweep `shadow-[…]` + `shadow-card-*`) |
| E-2 | `shadow-xl shadow-primary/20` (MethodSelectionView) | E2 base + token glow |
| E-3 | `LeaderboardView` `shadow-lg group-hover:rotate` + wrapper shadows | E1/E2 ladder |

---

## 13. Frozen (do not change)

- DS-001 Card base + premium variants (FOUNDATION_FREEZE_REGISTER).
- `ancient-sidebar` / `ancient-header` / `ancient-nav-item-active` (D-123).
- StatCard gold accent (D-141) incl. its carved 3D shadow (frozen family material).
- Management namespace definition (D-144) — only the light ladder values are under proposed
  revision via S-1.
- Dark-theme management surfaces (reuse baseline tokens exactly).
- Frozen premium material shadows (Button primary `--material-button-*`, `--elevation-carved`,
  `--card-3d-shadow`) — these are family materials, not consumer elevation choices.

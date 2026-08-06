# Foundation Cross-Family & Amber Audit (Consolidated)

**Phase 3.4 P2 — Repo-wide verification (after Wave 5)**
**Date:** 2026-08-02
**Scope:** Repo-wide sweep for cross-family token ownership, duplicated
implementations, page-level visual overrides, hardcoded colors, duplicate
hover/shadow/border/motion systems, and the `#C9A070` amber policy
(complete verification, not spot check).
**Rule:** previously certified visual behaviour remains unchanged unless the change
is required by architectural ownership, explicitly approved, and logged in
`DESIGN_DECISION_LOG.md`.

---

## 1. Cross-Family Ownership Violations

| # | Violation | Evidence | Owning family (correct) | Current source |
|---|---|---|---|---|
| X-1 | `Tabs` (Navigation) consumes Surface `--material-tab-*`/`shadow-tab-*` | `AntigravityData.tsx:79,124` | Navigation | Surface material tokens |
| X-2 | `SelectionContainer` (Navigation) inherits Surface `card-premium-*`/`--elevation-carved` | `AntigravityLayout.tsx:64` | Navigation | Surface card tokens (M-6) |
| X-3 | `AdminModal` (Overlay) uses card surface `bg-card-bg` + `shadow-2xl` | `AdminModal.tsx:82` | Overlay | Surface card language |
| X-4 | `TagBadge` (Status) re-implements badge material with raw palette + `dark:` | `TagBadge.tsx:8-11,16` | Status | raw Tailwind palette |
| X-5 | `Alert` info variant uses `--primary` instead of `--info` | `Alert.tsx:15` | Status | primary tokens |
| X-6 | `Badge`/`Alert`/`IconBadge` disagree on surface alpha (`/15` vs `/10`) | `AntigravityData.tsx:184-188` vs `Alert.tsx:15-18` | Status | in-family inconsistency |

## 2. Duplicated Implementations (parallel systems)

| # | Duplicate | Evidence |
|---|---|---|
| D-1 | Two sidebar shells | `Navigation.tsx:116-126` + `layouts/SidebarLayout.tsx:198` (identical light/dark branches) |
| D-2 | Two typography primitives | `AntigravityTypography.tsx` vs `AdminText.tsx` (style map + cinzel/garamond) |
| D-3 | Two motion vocabularies | framer-motion presets vs `.animate-in fade-in slide-in-from-*` CSS utility language |
| D-4 | Two overlay systems | `Menu.tsx:275` (certified) vs `AdminModal.tsx:82` (hand-rolled) |
| D-5 | Parallel dropdown + tooltip | `PremiumSelect.tsx:211-214` (own list), `TopicInfoButton.tsx:82` (own tooltip) |
| D-6 | `--surface-nav` defined twice | `themes.css:602` + `:814` |
| D-7 | `nav-active-surface` two recipes | `index.css:698` (light) vs `:1094` (base) |
| D-8 | Carved-parchment card two recipes | `.light .ancient-card` (`index.css:1134-1144`, raw hex) vs `--card-parchment` (`themes.css:788`) |

## 3. Page-Level Visual Overrides (must be retired for P2 success criteria)

| # | Override | Evidence |
|---|---|---|
| P-1 | `.light aside … !important` block | `index.css:698-723` — active/hover/text colours forced per-layout with `!important`, incl. hardcoded rgba gold (`:713-714,:721`) |
| P-2 | `.light .ancient-card` global recipe | `index.css:1134-1144` — raw `#C9A070`/`#A87828` + hand-built box-shadow, consumed by pages (`BulkActionBar:20`, `AdminUsersView:132`, `AdminSubAdminsView:146`) |
| P-3 | `.light .ancient-overlay`/`.ancient-tooltip` | `index.css:972-983` — token-backed but `.light`-only global classes the family should own |

## 4. Hardcoded Colors / Shadows in Reusable Components

| # | Component | Value | Fix |
|---|---|---|---|
| H-1 | `BrandTitle` (`AntigravityTypography.tsx:159`) | `from-[#f5e0be] to-[#b88c3a]` | `--brand-text-gradient` token (T-1) |
| H-2 | `AntigravityData.tsx:256` | `shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]` | `--shadow-inset-1` token (N-7) |
| H-3 | `DiagramRenderer.tsx:14` | `['#6366f1','#f43f5e',…]` chart palette | **Sanctioned** data-viz palette — document as chart scale |
| H-4 | `QuestionVisualizer.tsx:115-147` | SVG `#6366f1`/`#f43f5e`/`#10b981` | **Sanctioned** data-viz palette — document as chart scale |

## 5. `dark:` Prefix Remnants (D-123 violations — dead classes)

| # | Location | Classes |
|---|---|---|
| V-1 | `TagBadge.tsx:8-11,16` | `dark:text-amber-400/emerald-400/rose-400/purple-400/sky-400` |
| V-2 | `ExamSubComponents.tsx:24` | `dark:text-text-muted` |

All other `dark:` matches are explanatory comments (`AntigravityButton.tsx:68,182-183`,
`AntigravityData.tsx:76`).

## 6. Amber Verification — `#C9A070`

### 6.1 Allowed (non-semantic)
- `themes.css:212` — `--brown-650: #C9A070` (palette primitive, not a surface).
- `PHASE2_MIGRATION_TABLE.md:183` — documentation only.

### 6.2 Remaining as default visual language — documented per policy
| Location | Component | Purpose | Family | Justification | Migration target |
|---|---|---|---|---|---|
| `themes.css:672` `--bg-surface: #C9A070` (light) | global light surface (cards/panels/controls) | default light surface | Surface (ownership) | pre-P2 golden-light theme; amber is the light brand surface | Phase 7 ancient-theme removal (declared `themes.css:666-668`); light surface re-tuned to neutral parchment |
| `themes.css:1210` `--button-surface-secondary: var(--bg-surface)` (light) | secondary button surface | interaction surface | Control | legacy golden-light Control role | amber Control light tokens — scheduled migration (Control family) |
| `themes.css:1216` `--checkbox-surface: var(--bg-surface)` (light) | checkbox surface | interaction surface | Control | legacy golden-light Control role | amber Control light tokens — scheduled migration (Control family) |
| `themes.css:788` + `index.css:1137-1139` `.light .ancient-card` | premium carved card (light) | premium card material | Surface | premium light card restoration | **new**: unify `.light .ancient-card` onto `--card-parchment`/`--card-border-gold`; remove raw hex from `index.css` |
| `--nav-surface`→`--bg-nav`→`--bg-surface` chain (light) | sidebar/nav surface | navigation surface | Navigation | legacy golden-light nav | **new**: decouple `--bg-nav` from `--bg-surface`; map to `--bg-elevated`-derived token (N-9) |

### 6.3 Conclusion
- `#C9A070` still functions as the default **light-mode surface colour** — as
  required by the policy, every occurrence above is now documented with
  component/purpose/family/justification/migration target. Two **newly documented**
  usages (`index.css:1137` `.light .ancient-card` raw hex, and the nav-surface
  chain) are added to the migration backlog (see plan items P2-1/P2-3).
- No undocumented `#C9A070` remains. No `#C9A070` in components, dark theme, or
  Status/Motion/Overlay families.

## 7. P2 Success Criteria — Current State

| Criterion | State | Blocker → Fix |
|---|---|---|
| Every component/token belongs to exactly one family | ❌ | X-1…X-6, D-6/D-7 |
| Families are independent (no cross-family inheritance) | ❌ | X-1/X-2/X-3, P-1/P-2 |
| No page requires custom styling to render correctly | ❌ | P-1/P-2/P-3 must be retired |
| No duplicate hover/shadow/border/motion systems | ❌ | D-3/D-4/D-8, H-2 |
| Consumer migration becomes component replacement | ❌ | blocked by all of the above; cleared by the P2 plan below |

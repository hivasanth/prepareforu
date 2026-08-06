# SURFACE_TOKEN_INVENTORY

> **Phase 3.3 — read-only documentation.** No token changes. Definitions verified against `src/styles/themes.css` (1173 lines, token-only) and `src/index.css` (Tailwind v4 `@theme` + utilities, 1170 lines).

## 1. Token Architecture

- **Dark** = `:root` block in `themes.css`. **Light** = `.light` block in `themes.css`.
- `index.css` maps utilities→tokens via Tailwind v4 `@theme` (e.g. `--color-card-bg: var(--bg-surface)`).
- The **utility names** (what components write) and the **token names** (what `themes.css` defines) are different layers. This inventory documents both and their mapping.
- Two broad token kinds:
  - **Semantic tokens** (`--bg-*`, `--border-*`, `--card-*`, `--material-*`, `--elevation-*`, `--tab-*`, `--dropdown-*`, `--sidebar-*`, `--nav-*`, `--stat-*`, `--text-*`) — the approved surface language.
  - **Primitive tokens** (`--forest-*`, `--gold-*`, `--brown-*`, `--ancient-*`, `--premium-*`, `--canvas-*`) — raw brand palette; leaks flagged in the problem register.

---

## 2. Background Token Family (Step 4)

| Utility | Token | Dark | Light | Line (dark/light) | Owner | Obsolescence |
|---|---|---|---|---|---|---|
| `bg-app-bg` | `--bg-app` | `#111827` | `#E2CFA6` | 427 / 671 | Layout | Keep |
| `bg-surface` | `--bg-surface` | `#1F2937` | `#C9A070` | 428 / 672 | — (aliased) | Keep (basis of card-bg) |
| `bg-elevated` | `--bg-elevated` | `#374151` | `#FFF8E7` | 429 / 673 | — | Low use |
| `bg-hover-bg` | `--bg-hover` | `#1F2937` | `#D5B486` | 430 / 674 | Input/controls | Keep |
| `bg-active` | `--bg-active` | `#374151` | `#C8A473` | 431 / 675 | Controls | Low use |
| `bg-card-bg` | `--bg-surface` | `#1F2937` | `#C9A070` | via `@theme` | Card | **Keep (most-used)** |
| `bg-card-premium-surface` | `--material-card-premium-surface` | `--forest-900` | (stat gradient) | via `@theme` | Card premium | Keep |
| `light:stat-card-surface` | `--stat-card-bg` | n/a (dark uses `bg-card-bg`) | gold gradient `#D4A55A → #BF8A30` | via `@theme` | StatCard | Keep |
| `bg-selected-row` | `--selected-row` | — | — | themes.css | DataGrid/Tabs | Keep |
| `selection-surface` | `--selection-surface` | `--sidebar-bg` | forest gradient | themes.css | SelectionContainer | Keep |
| `bg-stripe-bg` | `--stripe-bg` | — | — | themes.css | DataGrid | Keep |
| `nav-active-surface` | `--nav-active-surface` | — | — | themes.css | Navigation | Keep |
| `sidebar-bg` | `--bg-nav`/`--sidebar-bg` | `--bg-surface` | `rgba(12,32,20,0.95)` | themes.css | Navigation | Keep |
| `bg-card-auth-light-surface` | `--card-auth-light-surface` | n/a | — | themes.css | Card auth-light | Keep |

### Consumer volumes (verified)

| Class | Total occurrences | Files |
|---|---|---|
| `bg-card-bg` | 74 | 48 |
| `bg-hover-bg` | 125 | 54 |
| `bg-primary/10` (and other `bg-primary/*`) | 42+ | 30+ |
| `bg-card-premium-surface` | 1 | 1 (`AntigravityCard.tsx`) |
| `light:stat-card-surface` | 5 | 2 (`AntigravityCard`, `AntigravityLayout`) |

### Hardcoded backgrounds (bypass tokens — full register in problem doc)

- Topic notebook: `bg-[#FFFDF9]`, `bg-[#F5EAD4]`, `bg-[#FDF5E2]`, `bg-[#FFF8E7]` — `src/components/user/topics/TopicSectionRenderer.tsx` (lines 48/55/61/106/160/200), `TopicReader.tsx` (50/66/75/101/152/172).
- Exam palette: `bg-[#22C55E]`, `bg-[#8B5CF6]`, `bg-[#F59E0B]`, `bg-[#3B82F6]` — `src/utils/paletteColors.ts:4-18`.
- Nav colors: `#8B5CF6`, `#F59E0B`, `#3B82F6` — `src/data/nav.ts`, `src/config/navigation.ts` (per-item icons).
- Performance: `#22C55E`, `#EF4444`, `#F59E0B` — `src/components/user/performance/useUserPerformance.ts:181/206`; `color="#F59E0B"` — `src/components/profile/StatisticsSection.tsx:31`.

---

## 3. Border Token Family (Step 5)

| Utility | Token | Dark | Light | Owner | Obsolescence |
|---|---|---|---|---|---|
| `border-border-subtle` | `--border-subtle` | `#374151` | `rgba(168,120,22,0.30)` | global control | **Keep (most-used)** |
| `border-card-border` | `--card-border` | `rgba(55,65,81,0.5)` | `--border-gold` `#A87828` | Card default/elevated | Keep |
| `border-card-premium-border` | `--material-card-premium-border` | **transparent** | `#A87828` | Card premium | ⚠ **dark gap (P0)** |
| `border-border-gold` | `--border-gold` | **undefined** | `#A87828` | StatCard/skeleton | ❌ **dark gap (P0)** |
| `border-card-auth-light-border` | `--card-auth-light-border` | n/a | — | Card auth-light | Keep |
| `border-stat-card-border` | `--stat-card-border` | n/a | gold | StatCard (light) | Keep |
| `border-sidebar-border` | `--sidebar-border` | — | gold-ish | Navigation | Keep |
| `border-primary/*` | `--primary` | `#3B82F6` | `#166534` | focus/selected | Keep |

### Border width language (verified)

| Width | Where |
|---|---|
| `border` (1px) | Card default/elevated/subtle, Menu, Input, DataGrid |
| `border-[1.8px]` | Card premium family, Button secondary, CollectionToolbar, SelectionContainer, ThemeToggle, Checkbox (light) |
| `border-[1.5px]` | notebook index chip (`TopicSectionRenderer:55/61`) |
| `border-[2px]` | notebook note surface (`TopicSectionRenderer:48`), StatCard (light), SelectionCheckbox check |
| `border-[2.5px]` | notebook (`TopicReader:75`) |
| `border-[3px]` | notebook hero card (`TopicReader:66`) |
| `border-2` | CarouselDots? (see code) |

> **Width language is non-uniform:** 1px / 1.8px / 1.5px / 2px / 2.5px / 3px. The premium family uses 1.8px; the notebook uses 1.5–3px.

### Consumer volumes

| Class | Total | Files |
|---|---|---|
| `border-border-subtle` | 200 | 87 |
| `border-card-premium-border` | 11 | 5 (`AntigravityButton`, `AntigravityCard`, `AntigravityForm`, `AntigravityLayout`, `ThemeToggle`) |
| `border-card-border` | (subset of card) | Card variants |

---

## 4. Shadow / Elevation Token Family (Step 6)

| Utility | Token | Dark | Light | Owner |
|---|---|---|---|---|
| `shadow-card-shadow` | `--card-shadow` | `--elevation-2` | `--card-3d-shadow` (inset gold + `5px 6px 0px`) | Card |
| `shadow-card-hover-shadow` | `--card-hover-shadow` | `--elevation-raised` → `--shadow-md` | `--shadow-contact` | Card elevated |
| `shadow-card-premium` | `--material-card-premium-shadow` | `--elevation-carved` (**undefined in dark**) | `light:shadow-premium-card` (carved gold 3D) | Card premium |
| `shadow-elevation-1` | `--elevation-1` | soft black | soft parchment | Button/control |
| `shadow-elevation-2` | `--elevation-2` | soft black | **inset 3D bevel** | Card shadow base |
| `shadow-elevation-3` | `--elevation-3` | soft black | **inset 3D bevel** | Card elevated |
| `shadow-elevation-4` | `--elevation-4` | soft black | soft parchment | Menu/PremiumSelect panel |
| `shadow-premium-card` | `--premium-card` (primitive) | n/a | carved gold 3D | StatCard/skeleton |
| `shadow-premium-carved` | `--premium-carved` (primitive) | n/a | carved gold 3D | StatSkeleton |
| `shadow-premium-icon` | `--premium-icon` (primitive) | n/a | carved gold 3D | PremiumIconContainer |
| `shadow-inset` | Tailwind | — | — | MetricBlock |

### Tailwind literal shadows (bypass elevations)

| Class | Occurrences | Files |
|---|---|---|
| `shadow-2xl` | 15 | 15 |
| `shadow-xl` | 13 | 11 |
| `shadow-lg` | several | — |
| `shadow-sm` | several | — |
| `shadow-[2px_2px_0px_#8B5A10]` … `[8px_8px_0px_#8B5A10]` | notebook | `TopicSectionRenderer`, `TopicReader` |
| `shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]` | SubjectCardItem:26 | — |
| `shadow-[0_0_6px_rgba(200,150,12,0.6)]` | CarouselDots:25/36 | — |
| recharts tooltip `0 10px 15px -3px` | DiagramRenderer:95/142/193 | — |

### Consumer volumes

| Class | Total | Files |
|---|---|---|
| `shadow-elevation*` | 18 | 9 |
| `shadow-card-shadow` | 8 | 4 |
| `shadow-card-premium` | 9 | 6 (`AntigravityButton`, `AntigravityCard`, `AntigravityLayout`, `AttemptCardBase`, `CollectionFilter`, `user/topics/TopicCard`) |

---

## 5. Radius Token Family (Step 7)

| Utility | `themes.css` token (dark+light) | `@theme` mapping | Owner | Verified conflict |
|---|---|---|---|---|
| `rounded-xl` | `--radius-xl: 20px` | `radius-xl: 12px` | controls/tabs | ❌ **D-01** |
| `rounded-2xl` | `--radius-2xl: 24px` | `radius-2xl: 16px` | cards | ❌ **D-01** |
| `rounded-3xl` | `--radius-3xl: 20px` | `radius-3xl: 20px` | skeleton | ⚠ odd value (20px = 2xl theme) |
| `rounded-full` | — | full | avatars/badges | ✅ |
| arbitrary `rounded-[10px..18px]` | — | — | Button sizes | ⚠ not tokenized |
| `rounded-[24px]/[28px]/[32px]/[36px]` | — | — | results/modals/skeleton | ❌ not tokenized |
| `rounded-[2.5rem]` | — | — | AdminModal, AddExamModal, Card auth-light | ❌ not tokenized |

> **D-01 (confirmed):** `themes.css` defines `--radius-xl: 20px`, `--radius-2xl: 24px`, `--radius-3xl: 20px`, but `index.css` `@theme` maps `radius-xl: 12px`, `radius-2xl: 16px`, `radius-3xl: 20px`. Two authorities disagree; utilities resolve to the `@theme` values, so the `themes.css` radius block is currently dead/conflicting.

---

## 6. Color Family Audit (Step 14)

### Premium Green

| Token | Value | Consumers | Owner |
|---|---|---|---|
| `--forest-900` | (dark green) | `--material-card-premium-surface`, selection gradient | Card premium / SelectionContainer |
| `--forest-*` scale | greens | premium materials | Foundation |
| `--selection-surface` | forest (light) | SelectionContainer, ThemeToggle | SelectionContainer |

### Gold

| Token | Value | Consumers | Owner |
|---|---|---|---|
| `--gold-200` | `#C8960C` | CarouselDots, Splash | Splash/carousel |
| `--gold-400` | `#B07A14` | dark gold accents (AttemptCardBase debt) | AttemptCard |
| `--brown-700` | `#A87828` | light premium border (`--material-card-premium-border`) | Card premium |
| `--border-gold` | `#A87828` | StatCard skeleton, notebook borders | Stat/notebook |
| `--ancient-gold`, `--ancient-gold-bright` | golds | PremiumIconContainer (light), BulkActionBar divider | PremiumIconContainer |
| `--premium-gold` | `#d4af37` | splash/brand | Splash |
| `--stat-card-bg` | gradient `#D4A55A → #BF8A30` | StatCard, skeleton (light) | StatCard |

### Ancient Cream

| Token | Value | Consumers | Owner |
|---|---|---|---|
| `--bg-app` light | `#E2CFA6` | app canvas (light) | Layout |
| `--bg-surface` light | `#C9A070` | cards (light) | Card |
| `--bg-elevated` light | `#FFF8E7` | elevated surfaces | — |
| `--canvas-parchment` | cream | backgrounds | Layout |
| `--gradient-app` | radial parchment | app canvas (light) | Layout |

### Canvas (dark)

| Token | Value | Consumers |
|---|---|---|
| `--bg-app` dark | `#111827` | app canvas |
| `--canvas-splash-bg`/`--canvas-splash-dark` | radial | SplashPage |

### Hover

| Token | Dark | Light | Consumers |
|---|---|---|---|
| `--bg-hover` | `#1F2937` | `#D5B486` | menu items, buttons, table rows, nav |

### Border

| Token | Dark | Light | Consumers |
|---|---|---|---|
| `--border-subtle` | `#374151` | `rgba(168,120,22,0.30)` | 87 files |

### Muted text

| Token | Consumers |
|---|---|
| `--text-muted` / `--text-hint` / `--text-secondary` | captions, placeholder, secondary labels |

### State families (Danger / Success / Warning / Info)

| Token | Approx dark | Consumers | Owner |
|---|---|---|---|
| `--danger` | `#f87171` | Alert error, buttons, toast inline fallback | Alert/Button |
| `--success` | `#22c55e` | Alert success, buttons, toast inline fallback | Alert/Button |
| `--warning` | `#F59E0B` | Alert warning, leaderboard top-3 | Alert |
| `--info` | `#3B82F6` | Alert info, exam palette blue | Alert |

### Primary / Secondary

| Token | Dark | Light | Note |
|---|---|---|---|
| `--primary` | `#3B82F6` | `#166534` | selected/focus/brand |
| `--secondary` | (green) | (green) | **D-02: maps to a fixed green literal, not themed** |

---

## 7. Step 12 — Token Ownership Table

| Token | Defined where | Owner | Reusable consumers | Pages consuming | Can become obsolete? |
|---|---|---|---|---|---|
| `--bg-app` | themes.css 427/671 | Layout | body, `SidebarLayout` | all | No |
| `--bg-surface` | themes.css 428/672 | Card (via card-bg) | Card, CollectionCard, Toolbar | all | No |
| `--bg-elevated` | themes.css 429/673 | — | few | — | Candidate (low use) |
| `--bg-hover` | themes.css 430/674 | Input/controls | Form, DataGrid, Menu, Tabs | admin/auth/exam | No |
| `--bg-active` | themes.css 431/675 | Controls | few | — | Candidate |
| `--material-card-premium-surface` | themes.css | Card premium | Card premium, SelectionContainer | user/admin | No |
| `--stat-card-bg` | themes.css | StatCard | StatCard, skeleton | dashboard/perf/results | No |
| `--border-subtle` | themes.css | global controls | 87 files | all | No |
| `--card-border` | themes.css | Card | Card default/elevated | all | No |
| `--material-card-premium-border` | themes.css | Card premium | Card premium, Button secondary, ThemeToggle, CollectionToolbar | user/admin | **Fix dark gap, then No** |
| `--border-gold` | themes.css (light) | StatCard | StatCard skeleton, notebook | topics | **Fix dark gap, then candidate to merge into material border** |
| `--card-shadow` | themes.css | Card | Card, CollectionCard, Toolbar | all | No |
| `--card-hover-shadow` | themes.css | Card elevated | Card elevated | all | No |
| `--material-card-premium-shadow` | themes.css | Card premium | Card premium, AttemptCard | user | **Fix dark `--elevation-carved` gap, then No** |
| `--elevation-1..4` | themes.css | shared elevation | Card, Button, Menu, Form | all | No |
| `--radius-*` | themes.css **conflict** | Radius | Card, controls | all | **Resolve D-01** |
| `--tab-*` | themes.css | Tabs | Tabs (20+ consumers) | admin/user | No |
| `--dropdown-*` | themes.css | Menu | Menu, PremiumSelect | filters | No |
| `--sidebar-*` | themes.css | Navigation | Navigation | 3 layouts | No |
| `--nav-active-surface` | themes.css | Navigation | Navigation | 3 layouts | No |
| `--selection-surface` | themes.css | SelectionContainer | SelectionContainer, ThemeToggle | selection pages | No |
| `--primary` | themes.css | shared accent | Button, Tabs, Input focus, Badge | all | No |
| `--secondary` | themes.css | **unresolved** | Button secondary, LeaderboardView bar | admin | **Fix D-02** |

---

## 8. Token Discrepancy Register

| ID | Discrepancy | Evidence | Impact | Priority |
|---|---|---|---|---|
| D-01 | Radius tokens conflict (20/24/20 vs 12/16/20) | `themes.css` vs `@theme` in `index.css` | Utilities resolve to `@theme`; `themes.css` radius block dead | P0 |
| D-02 | `--secondary` is a fixed green literal, not themed | `themes.css` + `LeaderboardView.tsx:125` (`bg-secondary` bar) | Dark/light not respected; bar color wrong | P0 |
| D-03 | `--elevation-carved` undefined in dark | `--material-card-premium-shadow` dark fallback | Premium hover shadow vanishes in dark (Card, AttemptCard, CollectionCard, CollectionFilter) | P0 |
| D-04 | `--material-card-premium-border` transparent in dark | `--material-card-premium-border` dark value | Premium cards have no border in dark | P0 |
| D-05 | `--border-gold` undefined in dark | StatCard skeleton family | `border-border-gold` fails in dark (skeletons, `AntigravityLayout:54`) | P1 |
| D-06 | `--radius-3xl` = 20px (equals 2xl) | `themes.css` | Odd value; skeleton 3xl unusable distinctly | P1 |
| D-07 | Modal radius not tokenized (3 values) | `AdminModal` 2.5rem, `LanguageSelectionScreen` 28px, `ReviewLayout` 32px | Modal family inconsistent | P1 |
| D-08 | Skeleton radii not tokenized (2xl / 24px / 32px) | `SharedComponents.tsx` | Skeleton family inconsistent | P1 |
| D-09 | Toast hardcoded fallbacks `var(--card-bg, #1f2937)`, `#22c55e`, `#f87171` | `useToast.tsx:55-62` | Toast not token-bound | P1 |

---

## 9. Color Family Consumer Volume Summary

| Family | Representative tokens | Approx occurrence weight |
|---|---|---|
| Border (subtle) | `--border-subtle` | highest (200) |
| Hover | `--bg-hover` | high (125) |
| Card | `--bg-surface` (`bg-card-bg`) | high (74) |
| Primary | `--primary` | high (42+ `bg-primary/10` alone) |
| Gold | `--border-gold`, `--gold-*`, `--ancient-gold`, `--premium-gold` | medium (stat, notebook, splash, icons) |
| Ancient Cream | light `--bg-*` | medium (light canvas/cards) |
| State | `--danger/--success/--warning/--info` | medium (alerts/buttons/leaderboard) |
| Premium Green | `--forest-900`, `--selection-surface` | low-medium (premium card, selection) |
| Canvas (dark) | `--bg-app` dark | base (all pages) |
| Muted | `--text-muted/--text-hint/--text-secondary` | high (captions) |

---

## 10. Token → Component Ownership Quick Reference

- **Card owns:** card-bg, card-border, card-premium-border, card-shadow, card-hover-shadow, card-premium-shadow, material-card-premium-surface, card radii.
- **StatCard owns:** stat-card-bg, stat-card-border, premium-card/carved shadows, stat radii.
- **Button owns:** material-button-primary-border/shadow, elevation-2/3, button radii (`rounded-[10px..18px]`).
- **Menu owns:** dropdown-* tokens, elevation-4, menu radii (`rounded-2xl`), menu border.
- **Input/Form owns:** hover-bg, border-subtle (controls), control radii (`rounded-xl`), focus `border-primary`.
- **Navigation owns:** sidebar-*, nav-active-surface.
- **SelectionContainer owns:** selection-surface.
- **DataGrid owns:** stripe-bg, selected-row.
- **AdminModal owns:** modal radii (`rounded-[2.5rem]`), shadow-2xl (to be tokenized).
- **Tabs owns:** tab-*, pill motion.
- **Layout owns:** bg-app, gradient-app.
- **Toast — NO owner** (inline styles, no tokens).

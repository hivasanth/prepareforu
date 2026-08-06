# TAS-1.2 — DESIGN SYSTEM STABILIZATION REPORT

**Status:** READ-ONLY — No files modified, no patches generated, no tokens renamed/merged/deleted.
**Date:** 2026-07-16
**Branch:** phase-3.5
**Project:** PrepareForU (React 19 + Tailwind v4 + Framer Motion 12 + TypeScript 5.9)
**Prerequisite:** Builds on `TAS-1.1-DESIGN-SYSTEM-INVENTORY.md` (token inventory) and `src/styles/themes.css` / `src/index.css`.

**Canonical architecture (target, already documented in themes.css header):**
```
Theme Tokens (themes.css)  →  Reusable Components  →  Pages
Pages compose. Components own visuals. Tokens own design values.
```

---

## 1. CANONICAL OWNERSHIP MATRIX

For every visual property, the **Current Owner** (where it actually resolves today) and the **Recommended Owner** (per target architecture). Risk is the migration risk if ownership is left as-is.

| Visual Property | Current Owner | Recommended Owner | Risk |
|---|---|---|---|
| Colors — semantic (bg/text/border/accent/state) | `themes.css` Layer 2 (`:root` + `.light`); **also re-defined in `index.css:161-177`** | **Theme Tokens** | HIGH (dual source of truth) |
| Colors — primitives (gray, blue, brown, gold, forest…) | `themes.css` Layer 1 | Theme Tokens (Layer 1) | LOW |
| Colors — hardcoded hex in charts/palette | `paletteColors.ts`, `DiagramRenderer`, `DailyAttemptsChart`, `SubjectPieChart` | Theme Tokens (via `--color-*` semantic) | HIGH (no theme switch) |
| Typography — font sizes | `themes.css` `--text-3xs..10xl` **AND** `index.css` `--text-h1..h6` (3 definitions) | Theme Tokens | HIGH (conflicting scale) |
| Typography — font family/weight/line-height/letter-spacing | `themes.css` Layer 1 + index.css `:root` | Theme Tokens | LOW |
| Borders | `themes.css` Layer 2; `.ancient-*` in `index.css` | Theme Tokens + Reusable Components | MEDIUM |
| Radius | `themes.css` primitives + `@theme` bridge **CONFLICT** (`index.css:66-68` vs `themes.css:295-297`) | Theme Tokens | HIGH (radius diverges by access path) |
| Spacing | Tailwind defaults + static constants in `AntigravityTypography.tsx` | Theme Tokens (spacing scale) | MEDIUM |
| Elevation | `themes.css` 3 overlapping systems (`--elevation-1..7`, Foundation 4.6A, `--shadow-*`) | Theme Tokens (single system) | MEDIUM |
| Shadow | `themes.css` Layer 1 + 2 + 3; `.ancient-*` carved shadows in `index.css` | Theme Tokens | MEDIUM |
| Motion / Transitions | Framer Motion in `AntigravityAnimation.tsx` + arbitrary `transition-all duration-*` in components/pages | Reusable Components (animation owner) | MEDIUM |
| Opacity | `themes.css` `--opacity-*` + Tailwind `/xx` utilities | Theme Tokens | LOW |
| Blur | Tailwind `backdrop-blur-*` utilities (ad-hoc) | Reusable Components | LOW |
| Z-index | **No token system.** Ad-hoc across 115 component files (`z-10`, `z-[60]`, `z-[200]`, `z-[9999]`, `z-[10000]`, `-z-10`) | Theme Tokens (z-index ladder) | MEDIUM |
| Icons | `themes.css` `--icon-*` + Lucide React | Reusable Components (icon token owner) | LOW |
| Surface | `themes.css` `--surface-*` + `.ancient-card`/`.ancient-card-dark` in `index.css` | Theme Tokens + Components | MEDIUM |
| Status (success/warning/danger/info) | `themes.css` Layer 2; hardcoded in `paletteColors.ts` | Theme Tokens | HIGH |
| Hover | Components via `hover:` + `.ancient-3d-lift`; token `--bg-hover` etc. | Reusable Components | LOW |
| Focus | `themes.css` `--focus-ring-*` + `:focus` resets in `index.css` | Theme Tokens + Components | LOW |
| Disabled | `themes.css` `--bg-disabled`/`--text-disabled` + `--opacity-disabled` | Theme Tokens + Components | LOW |

---

## 2. TOKEN OWNERSHIP REPORT

Selected representative tokens — "Runtime Winner" = which definition actually wins in CSS cascade. All Layer-2 tokens in `themes.css` are overridden by `index.css :root` because `index.css` is imported AFTER `themes.css` (confirmed by TAS-1.1 chain), so the **later `:root` wins for equal specificity**. This is the central ownership defect.

| Token | Defined In | Referenced By | Duplicate Definitions | Runtime Winner | Recommended Canonical | Safe To Migrate |
|---|---|---|---|---|---|---|
| `--text-primary` | themes.css:408 | ~50+ | themes.css + index.css:161 | **index.css:161** | themes.css Layer 2 | NO |
| `--text-secondary` | themes.css:409 | ~30+ | themes.css + index.css:162 | **index.css:162** | themes.css Layer 2 | NO |
| `--text-disabled` | themes.css:413 | ~8 | themes.css + index.css:163 | **index.css:163** | themes.css Layer 2 | NO |
| `--border-subtle` | themes.css:425 | ~15 | themes.css + index.css:165 | **index.css:165** | themes.css Layer 2 | NO |
| `--border-color` | index.css:164 | (alias) | index.css only | index.css | delete (use `--border-default`) | YES (remove) |
| `--card-bg` | themes.css:853 | many | themes.css + index.css:158 | **index.css:158** | themes.css Layer 3 | NO |
| `--elevated-bg` | index.css:159 | (alias) | index.css only | index.css | delete (use `--bg-elevated`) | YES (remove) |
| `--app-bg` | index.css:157 | body bg | index.css only | index.css | delete (use `--bg-app`) | YES (remove) |
| `--primary` | index.css:169 | many components | index.css only | index.css | delete (use `--color-accent`) | YES (remove) |
| `--secondary` | index.css:173 | StatsGrid, charts | index.css (**hardcoded `#10B981`**) | index.css | delete (use `--color-secondary`) | NO (hardcode) |
| `--success` | index.css:174 | charts/pages | index.css (**hardcoded `#22C55E`**) | index.css | delete (use `--color-success`) | NO (hardcode) |
| `--danger` | index.css:175 | pages/charts | index.css (**hardcoded `#F87171`**) | index.css | delete (use `--color-danger`) | NO (hardcode) |
| `--warning` | index.css:176 | pages/charts | index.css (**hardcoded `#FBBF24`**) | index.css | delete (use `--color-warning`) | NO (hardcode) |
| `--info` | index.css:177 | pages/charts | index.css (**hardcoded `#3B82F6`**) | index.css | delete (use `--color-info`) | NO (hardcode) |
| `--color-secondary` | index.css:38 | @theme | references `--secondary` (hardcoded) | broken chain | themes.css Layer 2 | NO |
| `--color-success` | index.css:39 | @theme | references `--success` (hardcoded) | broken chain | themes.css Layer 2 | NO |
| `--radius-xl` | themes.css:295 | semantic radius | index.css:66 (**12px**) | **index.css (12px)** | themes.css (20px) | NO (conflict) |
| `--radius-2xl` | themes.css:296 | semantic radius | index.css:67 (**16px**) | **index.css (16px)** | themes.css (24px) | NO (conflict) |
| `--radius-3xl` | themes.css:297 | semantic radius | index.css:68 (**20px**) | equal | either (20px) | NO (conflict) |
| `--text-h1..h6` | themes.css:323-340 (primitive) + index.css:104-109 (`:root`) + index.css @theme + responsive blocks (line 205, 339-368) | global `h1..h6` + typography | **4 definitions** | **index.css responsive** | single semantic scale | NO |
| `--ancient-gold` | themes.css:592 + index.css:180-191 + `.light` | 55+ refs | triple | context-dependent | keep one alias only | NO |
| `--border-gold` | themes.css:731 (light only) | 55+ refs | single (light-scoped) | light only | Theme Tokens (Foundation 5.0) | YES |
| `--card-3d-shadow` | themes.css:736 | `.ancient-card`, StatCard | single (light) | light only | Theme Tokens | YES |
| `--elevation-carved` | themes.css:750 | header/sidebar/cards | single (light) | light only | Theme Tokens | YES |

**Conclusion:** ~20 tokens have a single canonical definition and are safe. ~30+ tokens (mostly the re-defined text/border/card shorthands and the hardcoded state colors) have a **runtime winner in `index.css` that differs or is hardcoded**, so they are NOT safe to migrate until `index.css` redefinitions are removed.

---

## 3. DUPLICATE OWNERSHIP REPORT

| Duplicate | Locations | Nature | Resolution |
|---|---|---|---|
| `--text-primary/secondary/disabled`, `--border-subtle`, `--card-bg` | themes.css Layer 2/3 + index.css `:root` | Real duplicate, conflicting values | Remove from index.css |
| `--text-h1..h6` | themes.css primitives + index.css `:root` + index.css @theme + 4 responsive blocks | 4 definitions, different scales | Single semantic scale in themes.css |
| `--radius-xl/2xl/3xl` | themes.css Layer 1 + index.css @theme | Conflicting px values | Single source in themes.css |
| `--ancient-*` (12 tokens) | themes.css Layer 2 + index.css `:root` | Triple definition (marked "removed Phase 7") | Deprecate; keep one alias |
| `--secondary/--success/--danger/--warning/--info` | index.css `:root` | Hardcoded hex, no light override, no theme-awareness | Delete; route through `--color-*` |
| `--app-bg/--elevated-bg/--border-color/--primary` | index.css `:root` | Redundant shorthands/aliases | Delete; use canonical token |
| `--color-secondary/--success/...` @theme | index.css @theme | `var()` chain to the hardcoded shorthands above → broken reference | Repoint to `--color-*` Layer 2 |

---

## 4. COMPONENT OWNERSHIP REPORT

Audit of representative reusable components (full set in TAS-1.1 §5). "Architecture Violations" = direct Layer-1/primitive or hardcoded usage instead of semantic tokens; CSS owner = where its visual rules live.

| Component | Visual Owner | Animation Owner | Token Owner | CSS Owner | Inline Styles | Hardcoded Values | Arbitrary Tailwind | Duplicate CSS | Page Overrides | Architecture Violations |
|---|---|---|---|---|---|---|---|---|---|---|
| **Button / PrimaryButton / IconButton** (AntigravityButton) | Self | Framer (hover) | Layer 3 btn-* | Tailwind classes | no | none | `bg-[image:var(--gradient-header)]`, `text-[var(--brown-550)]`, `border-[var(--gold-400)]`, `shadow-[var(--elevation-carved)]` | `.ancient-btn-*` | rare | primitive `--brown-550`, `--gold-400` bypass |
| **Card / StatCard** (AntigravityCard) | Self | Framer | Layer 3 card-/stat-card- | Tailwind + `.ancient-card` | no | none | `bg-[var(--forest-900)]`, `border-[var(--border-gold)]`, `shadow-[var(--elevation-carved)]` | `.ancient-card*` | yes | primitive `--forest-900` bypass |
| **Input / Select / Switch** (AntigravityForm) | Self | no | Layer 3 input- | `.ancient-input/select` | no | none | none | `.ancient-input*` | yes | none |
| **Tabs** (AntigravityData) | Self | no | Layer 2 | `.ancient-tab-track/pill` + arbitrary | no | none | `bg-[var(--surface-tab-pill)]`, `border-[var(--border-gold)]`, `shadow-[var(--elevation-4)]` | `.ancient-tab-*` | no | primitive/light-only bypass |
| **Badge / TagBadge** | Self | no | Layer 2 state | Tailwind | no | none | none | no | no | none |
| **ProgressBar / MetricBlock** | Self | Framer | Layer 2 | Tailwind | no | none | `color="var(--primary)"` default | no | no | `--primary` shorthand bypass |
| **Modal / AdminModal / ConfirmModal** | Self | Framer | card-bg/border-subtle | `.ancient-overlay` | no | none | `z-[100]/z-[1000]/z-[10000]` | `.ancient-overlay` | no | **z-index ad-hoc** |
| **Header / Sidebar** (SidebarLayout) | Layout | Framer | Layer 3 header/sidebar | `.ancient-header/sidebar` | no | none | `z-[60..9999]` | `.ancient-*` | no | **z-index ad-hoc** |
| **Typography H1-H3/Body/Label** | Self | no | Layer 2 text- | Tailwind | no | none | none | no | no | none |
| **PageContainer / Stack / Grid** (AntigravityLayout) | Self | no | Layer 2 | Tailwind | no | static spacing consts | none | no | no | spacing constants not tokens |
| **LoadingSkeleton / ErrorState / EmptyState** | Self | no | card-bg/border-subtle | Tailwind | no | none | none | no | no | none |
| **AttemptCardBase** | Self | Framer group-hover | border-gold | Tailwind | no | none | `bg-[var(--border-gold)]/15`, `text-[var(--brown-550)]`, `hover:bg-[var(--gold-400)]` | no | no | primitive `--brown-550/--gold-400` bypass |
| **ExamCard / TopicCard / WelcomeBanner** | Self | Framer | border-gold/forest | `.ancient-card-dark` + hardcoded hex | no | `bg-[#FFFDF9]`, `shadow-[4px_4px_0px_#8B5A10]` | `bg-[var(--forest-900)]/95`, `from-[var(--forest-900)]` | `.ancient-card-dark` | no | **hardcoded hex + primitive** |
| **Reader (TopicReader)** | Self | Framer | border-gold | `.ancient-card` | no | `boxShadow:"3px 3px 0px var(--border-gold)"` inline | none | `.ancient-card` | no | inline primitive shadow |
| **WelcomeBanner** | Self | no | forest-900 | `.ancient-card-dark` | no | hardcoded gradient hex | `from-[var(--forest-900)]` | `.ancient-card-dark` | no | primitive bypass |
| **StatePanel** | Self | no | Layer 2 | Tailwind | no | none | none | no | no | none |
| **TopicCard** | Self | Framer | border-gold | `.ancient-card-dark` + hardcoded | no | `bg-[#F5EAD4]`, `shadow-[2px_2px_0px_#8B5A10]` | `border-[var(--border-gold)]` | `.ancient-card-dark` | no | **hardcoded hex** |

**Pattern:** The Antigravity system is the correct visual owner. Violations cluster in (a) light-mode "premium" components using Layer-1 primitives (`--brown-550`, `--gold-400`, `--forest-900`) and (b) hardcoded hex values in `TopicCard`/`WelcomeBanner`/`ExamPaperCard`.

---

## 5. PAGE OWNERSHIP REPORT

Pages SHOULD only compose reusable components. Violations found:

| Page / View | Violation | Type |
|---|---|---|
| `SignupPage.tsx` | `var(--color-border-subtle)`, `var(--color-danger/warning/info/success)`, `var(--color-text-secondary)` (nonexistent `--color-*` namespace) + hardcoded strength colors | Owns colors directly; references non-existent tokens |
| `ReviewLayout.tsx` (page-level) | `StatCard color="var(--primary)/var(--success)/var(--danger)/var(--info)"` | Passes primitive/shorthand tokens instead of semantic prop |
| `SubAdminDashboard.tsx` | `StatCard color="var(--primary)/var(--success)/var(--warning)/var(--danger)"` | Same |
| `StatsGrid.tsx` (admin) | `color="var(--primary)/var(--secondary)/var(--info)/var(--warning)"` | Same |
| `LeaderboardComponents.tsx` | `text-[var(--gold-300)]` hardcoded rank color | Direct primitive |
| `SplashPage.tsx` | `text-[var(--border-gold)]` + hardcoded hex gradients | Direct primitive + hex |
| `SubjectPieChart.tsx` | `backgroundColor:'var(--surface-floating)'`, hardcoded `boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'` | Inline hardcoded shadow |
| `DailyAttemptsChart.tsx` | inline `boxShadow` hardcoded; `fill:'var(--primary)'` | Hardcoded shadow |
| `DiagramRenderer.tsx` | `boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'` ×3, `borderRadius:'12px'` | Hardcoded shadow/radius |
| `UserLeaderboard.tsx` | `bg-white/40`, `border-slate-100`, hardcoded `shadow-[0_20px_50px...]` | Owns surface/shadow |
| `UpdatePasswordPage.tsx` | `bg-white`, `border-slate-100`, hardcoded shadow | Owns surface/shadow |
| `AccountDisabledPage.tsx` | `bg-white`, hardcoded shadow, svg noise | Owns surface |
| `LoginPage.tsx` / `FinishSignInPage.tsx` / `VerifyEmailPage.tsx` | `bg-white`, `bg-slate-900/60`, hardcoded shadows | Owns surface (auth shell) |
| `PreparationView.tsx` / `SelectionView.tsx` | `sticky top-0 z-30`, hardcoded carousel shadows | Owns z-index/layout |
| `ActiveExamPage.tsx` | `z-[200]` overlay | Owns z-index |

**Summary:** ~16 page/view files own colors, shadows, radii, or z-index directly. Auth pages and chart components are the worst offenders. `paletteColors.ts` (question palette states) hardcodes **6 hex colors** (`#22C55E`, `#8B5CF6`, `#F59E0B`, `#3B82F6`, `#64748B`, `#94A3B8`) with no theme awareness — a critical violation for dark/light support.

---

## 6. PRIMITIVE USAGE REPORT

Direct usage of Layer-1 primitive variables / hardcoded primitives instead of semantic tokens.

| Location | Primitive Used | Category | Classification |
|---|---|---|---|
| `AntigravityButton.tsx:18-19` | `--brown-550`, `--gold-400` | Color primitive | Architecture Violation (light-only premium intent) |
| `AntigravityCard.tsx:19` | `--forest-900`, `--border-gold`, `--elevation-carved` | Color primitive | Architecture Violation (border-gold is light-only) |
| `AntigravityData.tsx:64` | `--surface-tab-pill`, `--border-gold`, `--elevation-4` | Light-only material | Intentional (Foundation 5.0 light material) |
| `AttemptCardBase.tsx:46,53,82` | `--border-gold`, `--brown-550`, `--gold-400` | Color primitive | Architecture Violation |
| `TopicCard.tsx:18-31` | `--border-gold` + hardcoded `#FFFDF9/#F5EAD4/#8B5A10` | Primitive + hex | Architecture Violation |
| `WelcomeBanner.tsx:9` | `--forest-900` (gradient) | Color primitive | Architecture Violation |
| `TopicReader.tsx:43-44` | `--border-gold` (inline boxShadow) | Light-only material | Intentional (carved hover) |
| `CarouselDots.tsx:23-26` | `--gold-200`, `--border-gold` + hardcoded `rgba(200,150,12,0.6)` | Primitive + hex | Architecture Violation |
| `PremiumLoader.tsx:16` | `--premium-green` | Brand primitive | Intentional (splash brand) |
| `LeaderboardComponents.tsx:15` | `--gold-300` | Color primitive | Architecture Violation |
| `paletteColors.ts` (all) | `#22C55E #8B5CF6 #F59E0B #3B82F6 #64748B #94A3B8` | Hardcoded hex | Architecture Violation (no theme switch) |
| `SubjectPieChart/DailyAttempts/DiagramRenderer` | inline `rgb(0,0,0,0.1)` shadows, `12px` radius | Hardcoded shadow/radius | Architecture Violation |
| `UserLeaderboard/Login/UpdatePassword/AccountDisabled` | `bg-white`, `bg-slate-900`, `border-slate-100` | Hardcoded surface | Architecture Violation |
| `pages` using `var(--primary)/var(--success)/...` | `--primary` shorthand + nonexistent `--color-*` | Shorthand/alias | Architecture Violation |

**Classification totals:**
- **Intentional (light premium material):** ~4 sites (`--border-gold`, `--surface-tab-pill`, `--elevation-carved`, `--premium-green`).
- **Temporary (migration scaffolding):** `index.css` shorthands `--primary/--secondary/...` (marked for removal).
- **Architecture Violation:** ~25+ sites using Layer-1 primitives, hardcoded hex, or shorthand/alias tokens directly in components and pages.

---

## 7. DEPENDENCY GRAPH

```
Button (AntigravityButton)
  ├─ consumes: --btn-*, --color-accent, --gradient-header, --brown-550, --gold-400
  └─ consumers: ALL interactive UI (pages, modals, forms, exam actions, nav)

Card (AntigravityCard)
  ├─ consumes: --card-*, --border-gold, --forest-900, --elevation-carved, .ancient-card
  └─ consumers: ExamCard, StatCard, ActivityCard, ScoreCard, AttemptCardBase,
                ExamPaperCard, AdminCard, QuestionsTable, SettingsCard, TopicCard

StatCard (AntigravityCard)
  ├─ consumes: --stat-card-*, --surface-stat, --border-gold, --stat-card-3d-shadow
  └─ consumers: PerformanceMetricsGrid, StatsGrid, Dashboard views, SubAdminDashboard

Input / Select / Switch (AntigravityForm)
  ├─ consumes: --input-*, .ancient-input/select, --border-subtle
  └─ consumers: Auth pages, AdminQuestionForm, TestConfigView, FilterBar

Tabs (AntigravityData)
  ├─ consumes: --surface-tab-pill, --border-gold, --elevation-4, .ancient-tab-*
  └─ consumers: UserSelectionTabs, AdminSelectionTabs, PerformanceTimeRangeTabs

Badge (AntigravityData / TagBadge / DifficultyBadge)
  ├─ consumes: --color-success/warning/danger, --bg-*-subtle
  └─ consumers: tables, cards, lists, ExamGroupBar

Modal (AdminModal / ConfirmModal / SharedComponents)
  ├─ consumes: --card-bg, --border-subtle, .ancient-overlay, z-[100..10000]
  └─ consumers: all delete/edit flows, SubmitExamModal, TeacherLeaderboardModal

Typography (AntigravityTypography)
  ├─ consumes: --text-title/primary/secondary/muted, --text-danger
  └─ consumers: every page and component (base layer)

Layout (AntigravityLayout: PageContainer/Stack/Grid/FilterBar/StatePanel/PageHeader)
  ├─ consumes: --border-subtle, --card-bg, --text-*, --elevation-6
  └─ consumers: all pages

Exam Components (QuestionCard, StatusBoard, QuestionPalette, ReviewLayout…)
  ├─ consume: --primary, --color-success/danger/warning/info, --border-subtle
  └─ consumers: ActiveExamPage, ResultsPage, ReviewPage
```

---

## 8. MIGRATION READINESS SCORE

| Dimension | Score / 100 | Rationale |
|---|---|---|
| Theme Tokens | **55** | Well-structured 3-layer system, but ~30 tokens duplicated/hardcoded in `index.css` with conflicting runtime winners; 3 overlapping elevation systems; no z-index system. |
| Reusable Components | **70** | Strong Antigravity system is correct visual owner; violations are concentrated in light-premium components and chart wrappers. |
| Pages | **45** | ~16 page/view files own colors/shadows/z-index; `paletteColors.ts` hardcodes 6 theme-unaware hex colors. |
| Documentation | **85** | Excellent `TAS-1.1` inventory + `themes.css` header spec + `THEME_ARCHITECTURE_SPEC_v1.md`. |
| Token Ownership | **40** | Single source of truth NOT achieved — index.css redefinitions win at runtime. |
| Architecture | **60** | Direction correct; violations are real but localized and enumerable. |
| **Overall Readiness** | **59** | Stabilization NOT complete; token ownership must be fixed before TAS-2. |

---

## 9. RECOMMENDED MIGRATION ROADMAP

Safest order (each step removes a class of ownership ambiguity before the next depends on it):

```
1. Typography
   └─ Why first: unify --text-h1..h6 (4 defs) + --text-3xs..10xl into ONE semantic
      scale in themes.css; delete index.css redefinitions. Lowest blast radius, touches
      global h1..h6 + typography components only.

2. Radius
   └─ Why: resolve --radius-xl/2xl/3xl conflict (index.css vs themes.css). Small,
      well-bounded. Prerequisite for card/button shadows reading consistently.

3. Buttons
   └─ Why: highest-consumer component; once --btn-* + --color-accent are single-sourced,
      all interactive UI stabilizes. Remove --primary/--secondary shorthands here.

4. Cards / StatCard
   └─ Why: depends on radius + tokens; consolidate --card-* and light --border-gold/
      --card-3d-shadow material. Largest visual surface.

5. Forms (Input/Select/Switch)
   └─ Why: depends on --input-* already mostly clean; minor .ancient-input cleanup.

6. Navigation (Sidebar/Header/Tabs)
   └─ Why: depends on card/button tokens; introduces z-index ladder (new token system).

7. Tables & Charts
   └─ Why: highest hardcoded-hex density (paletteColors.ts, DiagramRenderer,
      DailyAttemptsChart, SubjectPieChart). Must wait until --color-* single-source
      exists so charts become theme-aware.

8. Layouts & Modals
   └─ Why: depends on z-index ladder + overlay tokens; consolidate .ancient-overlay
      and arbitrary z-[…] values.

9. Pages
   └─ Why: last — only after every component token is single-sourced can pages be
      stripped of direct color/shadow/z-index ownership and reduced to composition.
```

Cross-cutting prerequisite for steps 7–9: **introduce a z-index token ladder** (`--z-dropdown`, `--z-sticky`, `--z-overlay`, `--z-modal`, `--z-toast`, `--z-splash`) and **replace all ~72 ad-hoc `z-*` usages**.

---

## 10. RISKS

| # | Risk | Severity | Trigger |
|---|---|---|---|
| R1 | Removing `index.css` redefinitions flips runtime winner back to themes.css values (which differ) → visual regression | HIGH | TAS-2 token deletion |
| R2 | `--radius-xl/2xl` differ (12/16 vs 20/24px); unifying changes card/container sizing app-wide | HIGH | Radius consolidation |
| R3 | `paletteColors.ts` hardcoded hex breaks dark/light question-palette states | HIGH | Chart/table migration |
| R4 | Charts (`Recharts`) consume inline hex + hardcoded shadows; not theme-aware today | MEDIUM | Table/Chart step |
| R5 | 3 overlapping elevation systems (`--elevation-1..7`, Foundation 4.6A, `--shadow-*`) — picking one may change depth language | MEDIUM | Token consolidation |
| R6 | 187 color primitives, ~60% unused (slate/indigo/rose/pink/orange/cyan/emerald) — pruning risks unknown references | LOW-MED | Token pruning |
| R7 | Light mode is a distinct "parchment/forest/gold" material language vs flat dark — two design languages coexist | MEDIUM | Any light-only token change |
| R8 | Non-standard `--brown-150..950` and single `--pink-600`/`--gold-50..400` scales are incomplete | LOW | Pruning |
| R9 | `var(--color-*)` namespace referenced in SignupPage does not exist (typo of `--color-*` Layer 2) → resolves to nothing | MEDIUM | Page cleanup |

---

## 11. FILES ANALYZED

- **CSS / Tokens:** `src/styles/themes.css` (1041 lines), `src/index.css` (1045 lines, 91 `.ancient-*`/`.premium-*`/font class defs), `src/context/ThemeContext.tsx`.
- **Reusable components:** 115 `.tsx` under `src/components/` (Antigravity system, common, admin, exam, user, sub-admin).
- **Pages / Views:** 47 `.tsx` under `src/pages/` (auth, user, exam, admin, sub-admin, root).
- **Utilities:** `src/utils/paletteColors.ts` (hardcoded palette hex).
- **Prior artifacts:** `TAS-1.1-DESIGN-SYSTEM-INVENTORY.md`, `src/styles/PHASE2_REPORT.md`, `src/styles/PHASE2_MIGRATION_TABLE.md`.
- **Grep evidence:** arbitrary `var(--…)` in 100+ `.tsx` matches; primitive/hex direct usage in 10+ files; ad-hoc `z-*` in 72 matches across components and pages.

---

## 12. RECOMMENDATIONS FOR TAS-2 (THEME TOKEN CONSOLIDATION)

1. **Establish single source of truth:** Delete all Layer-2/3 token redefinitions in `index.css :root` (lines ~157-191) so `themes.css` wins. Capture current `index.css` rendered values first to avoid silent regression (Risk R1).
2. **Remove hardcoded state shorthands:** Delete `--secondary/--success/--danger/--warning/--info` (hardcoded hex) and repoint `@theme` `--color-*` to Layer-2 `--color-*`. Fix the broken `var()` chain.
3. **Unify radius:** Pick themes.css values; delete conflicting `--radius-xl/2xl/3xl` from `index.css @theme`. Audit card/container sizing impact (R2).
4. **Unify typography:** Collapse 4 `--text-h1..h6` definitions into one semantic scale in themes.css; delete index.css duplicates.
5. **Introduce z-index token ladder** and replace ~72 ad-hoc `z-*` usages (R-void).
6. **Promote light-only material tokens** (`--border-gold`, `--card-3d-shadow`, `--surface-stat`, `--elevation-carved`, `--surface-tab-pill`) to canonical Theme Tokens (already light-scoped) so components stop reaching for Layer-1 primitives.
7. **Add semantic aliases for chart/palette colors** and migrate `paletteColors.ts` + chart wrappers off hardcoded hex (R3/R4).
8. **Prune unused primitives** (slate/indigo/rose/pink/orange/cyan/emerald) only after a full reference scan (R6).
9. **Do NOT touch** dark/light mode values, animations, layouts, spacing, routing, auth, or backend — out of scope per TAS-1.2 rules.

**STOP — awaiting approval before TAS-2. No files modified, no code generated.**

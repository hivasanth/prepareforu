# Styling System Duplication Report

- **Phase:** 5.0 — Repository Styling System Architecture Audit (Step 7 / Step 8)
- **Scope:** `src/index.css`, `src/styles/themes.css`, className compounds, `@theme` utilities, token semantics, hardcoded values
- **Type:** Documentation only. Zero code, token, or Foundation changes.
- **Status:** Completed
- **Date:** 2026-08-04

---

## 1. Duplicated className compounds (cross-file, extraction candidates)

### Tier 1 — highest-value extraction candidates (≥4 distinct files)

| # | Class string | Files | Occurrences | Recommended extraction |
|---|---|---|---|---|
| 1 | `text-xs font-bold text-danger mt-1` | 13 | 42 | `<FormError>` / `<FieldError>` component |
| 2 | `flex items-center justify-between` | 8 | 10 | `FlexRow` / `BetweenRow` layout helper |
| 3 | `divide-y divide-border-subtle/10` | 5 | 6 | `DivideList` |
| 4 | `bg-card-bg border border-border-subtle/20 rounded-2xl p-5` | 4 | 4 | shared panel wrapper in create-step screens |
| 5 | `border-b border-border-subtle/10 pb-4` | 4 | 4 | section-header divider (`SectionCardHeader`) |

**Detail — #1 `text-xs font-bold text-danger mt-1` (42 sites / 13 files):**
`PromptEditorModal.tsx:108,127` · `QuestionForm.tsx:93` · `AddExamModal.tsx:247,262,277,297,312,328,352,387,419,436,454` ·
`ExamParamsForm.tsx:35,50,66,93` · `AdminSubAdminsView.tsx:201,217,232` · `LangInputPanel.tsx:54,111` ·
`TopicMetadataFields.tsx:36` · `ProfileForm.tsx:127,184,207` · `IdentitySection.tsx:38,66` · `FinishSignInPage.tsx:161` ·
`LoginPage.tsx:281,312,442` · `SignupPage.tsx:339,358,390,444,464,480,498` · `UpdatePasswordPage.tsx:127,152`

### Tier 2 — 3 distinct files
- `flex flex-col items-center` — `ExamTimer.tsx:169`, `LeaderboardTabletCard.tsx:26,31,36`, `LeaderboardView.tsx:122`
- `flex items-center gap-3 min-w-0` — `SubAdminMobileCard.tsx:16`, `AntigravityDashboard.tsx:34`, `AntigravityLayout.tsx:199`
- `grid grid-cols-1 sm:grid-cols-2 gap-4` — `PortalLoadingSkeleton.tsx:14`, `PreparationView.tsx:121`, `TopicSectionRenderer.tsx:33`
- `flex items-center justify-between w-full` — `ExamDetailModal.tsx:261`, `SubjectPortalView.tsx:75`, `TopicPortalView.tsx:135`
- `rounded-full shadow-lg shadow-primary/25` (auth-page logo) — `LoginPage.tsx:252`, `SignupPage.tsx:310`, `UpdatePasswordPage.tsx:92`

### Tier 3 — 2 distinct files (selection of ~55 matches)
| Pattern | Files |
|---|---|
| `text-[10px] font-bold uppercase tracking-widest text-text-muted` | `DiagramRenderer.tsx:51`, `SubmitExamModal.tsx:87,91,95,100` |
| `flex-1 h-px bg-border-subtle/50` (horizontal divider) | `LoginPage.tsx:359,361`, `VerifyEmailPage.tsx:218,220` |
| `min-h-screen flex flex-col justify-center bg-app-bg px-4 sm:px-6` (auth shell) | `LoginPage.tsx:205`, `SignupPage.tsx:268` |
| `min-h-screen flex items-center justify-center bg-app-bg px-4` | `SignupPage.tsx:135`, `VerifyEmailPage.tsx:94` |
| `w-full max-w-[1200px] mx-auto items-center min-h-[600px] gap-8 md:gap-16` (auth grid) | `LoginPage.tsx:206`, `SignupPage.tsx:269` |
| `hidden lg:flex flex-col justify-center h-full relative` (auth left panel) | `LoginPage.tsx:209`, `SignupPage.tsx:272` |
| portal-card-title compound (13 classes) | `SubjectPortalView.tsx:80`, `TopicPortalView.tsx:140` |
| carousel rail (`flex overflow-x-auto snap-x snap-mandatory …`) | `ExamPaperGrid.tsx:62`, `SelectionView.tsx:102` |
| correct-answer accent bar (`absolute top-0 left-0 w-1 h-full bg-primary`) | `ReviewQuestionCard.tsx:116`, `PreparationView.tsx:154` |
| `shadow-2xl overflow-hidden p-0 border-none` (table card wrapper) | `LeaderboardView.tsx:67`, `LeaderboardTable.tsx:20` |
| `flex flex-col gap-6 animate-in` | `QuestionsTable.tsx:62`, `UsersTable.tsx:54` |
| toolbar layout (`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0`) | `QuestionsActions.tsx:26`, `UsersActions.tsx:18` |
| `bg-primary/10 text-primary` "soft icon-badge" recipe | re-declared in variant maps of ~10 components: `AntigravityButton.tsx:56,85`, `Alert.tsx:15`, `IconBadge.tsx:31,37`, `AntigravityResults.tsx:26`, `AdminIconWrap.tsx:34`, `ErrorBoundary.tsx:35`, `AntigravityDashboard.tsx:83`, `ExamDetailModal.tsx:256` |

---

## 2. Duplicated / overlapping token semantics

### 2.1 Duplicate shadow systems (four parallel sets → same visuals)
| Level | Base | Elevation ladder | Semantic elevation | Semantic shadow |
|---|---|---|---|---|
| xs | `--shadow-xs` | — | — | — |
| sm | `--shadow-sm` | `--elevation-1` | `--elevation-surface` | `--shadow-ambient` |
| md | `--shadow-md` | `--elevation-2` | `--elevation-raised` ≡ `--elevation-interactive` | `--shadow-contact` |
| lg | `--shadow-lg` | `--elevation-3` | `--elevation-floating` | `--shadow-hover` |
| xl | `--shadow-xl` | `--elevation-4` | `--elevation-popover` | — |
| 2xl | `--shadow-2xl` | `--elevation-5` | `--elevation-modal` | `--shadow-modal` |

- `--elevation-overlay: var(--bg-overlay)` is a background color, not a shadow — misnamed; duplicates `--surface-overlay`.

### 2.2 Exact token duplicates
- `--shadow-premium-carved` ≡ `--shadow-premium-icon` — identical declaration `var(--elevation-carved), inset 0 1px 0 rgba(255,248,210,0.5)` (`index.css:214` == `:215`).
- Gold hex `#C8960C` owned by 4 tokens: `--gold-200` (themes.css:220) = `--pie-gold` (:262) = `.light --border-nav-indicator` (:866) = `.light --color-secondary` (:720).
- Brand/state literal duplicates: `#10B981` (index.css:319 `--secondary` ≡ themes.css:436 `--color-secondary`); `#22C55E` (index.css:320 ≡ :440); `#F87171` (:321 ≡ :446); `#FBBF24` (:322 ≡ :443); `#3B82F6` (:323 ≡ :449).
- Neutral restatements: `#374151` = `--gray-700`, `--border-default`, `--border-subtle`, `--scrollbar-thumb`, `--divider-color`; `--bg-elevated` = `--bg-hover` = `--bg-disabled` = `#374151`; `--surface-secondary` = `--surface-floating` = `--surface-raised` = `var(--bg-elevated)`.
- `.light` re-declares the full surface/elevation ladder with identical mappings as `:root` (e.g. `--surface-canvas/…` :824–832 vs :584–593; `--elevation-canvas: none` :835 vs :596).

### 2.3 Three overlapping button-token namespaces
| Namespace | Location | Duplicated intent |
|---|---|---|
| `--btn-*` (Foundation) | themes.css:1121–1158 | `--btn-secondary-bg: transparent` ≈ `--button-surface-ghost: transparent` |
| `--button-surface-*` (Control) | themes.css:926–937 | `--btn-secondary-hover-bg: var(--bg-hover)` ≈ `--button-surface-ghost-hover: var(--bg-hover)` |
| `--material-button-*` | themes.css:1076–1079 | primary family |

### 2.4 Same-value component shadows
`--card-shadow: var(--elevation-2)` (themes.css:1039) = `--management-shadow: var(--elevation-2)` (:1184) = `--filter-shadow: var(--elevation-2)` (:960).

### 2.5 Same-intent focus shadows
`--shadow-focus` (themes.css:610) = `0 0 0 var(--focus-ring-width) var(--focus-ring-color)` vs `--input-focus-shadow` (:915) = `0 0 0 3px var(--focus-ring-color)`; `--shadow-focus` registered twice (:610 and light :850).

### 2.6 Three carved-3D shadow recipes
`.light --card-3d-shadow` (:799–805), `--stat-card-3d-shadow` (:806–812), `--elevation-carved` (:813–817) — near-identical inset/highlight/offset stacks.

### 2.7 Repeated shadow compound
`var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.55)` appears **5× verbatim** in light input/OTP family (`index.css:890,920,929,938,945`).

### 2.8 Cross-file conflicts (duplicate names, different values)
- `--input-border`: themes.css:912 = `var(--border-subtle)` (#374151) **vs** index.css:312 = `var(--border-input)` (#4B5563). Unlayered index.css wins → themes.css Layer-3 definition dead.
- `--radius-xl`: **20px** (themes.css primitives :276) **vs** **12px** (index.css @theme :78); `--radius-2xl`: **24px** (:277) **vs** **16px** (@theme :79).
- `text-stat-value`: font-size (`--text-stat-value`, index.css:231) **and** color (`--color-stat-value`, index.css:240) — class-name collision.

### 2.9 Alias duplication
`@theme --color-primary: var(--color-accent)` (index.css:41) and `:root --primary: var(--color-accent)` (:315); consumers use **both** `bg-primary` utilities **and** `var(--primary)`/`var(--color-accent)` (e.g. `DailyAttemptsChart.tsx:88,100,108`).

### 2.10 Active-nav light treatment duplicated
Token overrides (`.light --bg-nav-active/--text-nav-active`, themes.css:864–865) **and** hardcoded rule `.light .nav-active-surface` (index.css:685–693) with `!important`.

### 2.11 Card surface triplication
`.premium-card` (index.css:623–642), `.ancient-card` (themes.css:839–858), and Card component variants (`AntigravityCard.tsx:37–46`) all implement "raised card" independently; `.light .ancient-card` (themes.css:1121–1160) re-implements another surface.

---

## 3. Utility Audit (@theme, `src/index.css:39–263`)

### 3.1 Dead registered utilities (zero class consumers)
| Family | Defined | Status |
|---|---|---|
| `shadow-elevation-5/-6/-7` | :103–105 | **NEVER USED** |
| `shadow-button-primary` | :132 | class never used (var consumed via arbitrary) |
| `shadow-input-violet-focus` | :189 | class never used (var via arbitrary) |
| `border-input-violet-focus-border` | :188 | class never used (var via arbitrary) |
| `bg/text/border-*-hover`, `*-subtle`, `*-light` (all) | :42–47 | **NEVER USED** as classes |
| `bg-button-surface-primary` / `border-button-primary-border` / `text-button-primary-text` | :129–131 | never used (vars via arbitrary) |
| `bg-button-surface-ghost*` etc. | :144–148 | **NEVER USED** |
| `rounded-button-*`, `rounded-badge-md`, `rounded-alert`, `rounded-icon-sm`, `rounded-empty-state`, `rounded-filter`, `rounded-card-auth-light` | :81–88,:125 | **NEVER USED** |
| `text-h1`/`text-h2`/`text-h3` + `text-display/body/caption/label/badge/metadata/small/heading` (font-size) | :222–235 | never used as class (consumed via `fontSize: 'var(…)'`) |
| `--material-input-checkbox-size/radius` | :190–191 | **NEVER USED** |

### 3.2 Used utilities (verification of live surface)
- **Elevation:** `shadow-elevation-1..4` used (`AntigravityForm:218`, `AntigravityData:79`, `AntigravityCard:40`, `AntigravityButton`, `Menu:276`, `PremiumSelect:214`).
- **Card:** `shadow-card-shadow`, `shadow-card-hover-shadow`, `shadow-card-premium`, `shadow-card-auth-light` all used.
- **Buttons:** `shadow-button-secondary(-hover)` used (`AntigravityButton:49,79`).
- **Filter/tab/stat:** `shadow-filter(-hover)` (`CollectionFilter:60`), `shadow-tab-track`/`shadow-tab-pill-light` (`AntigravityData:80,125`), `shadow-stat-card-shadow` (`AntigravityCard:152`).
- **Premium:** `shadow-premium-card/-elevated/-carved/-icon` all used.
- **Colors:** `bg/text/border-primary`, `secondary`, `success`, `danger`, `warning` used; `bg-info`/`text-info` used but `border-info` never.
- **Surfaces:** `bg-app-bg`, `bg-card-bg`, `bg-elevated-bg` (1 site), `bg-hover-bg`, `text-text-*` (100+), `border-border-subtle/default` used.
- **Gold:** `gold-300` via `GOLD_SURFACE`, `text-[var(--gold-300)]`, `border-[var(--gold-300)]` used.
- **Management:** consumed via arbitrary `bg-[var(--management-*)]` across `AntigravityCard`, `AntigravityButton`, `Menu`, `AdminModal`, `CollectionFilter`, `useToast`, `SharedComponents`, `TopicSectionRenderer`, `BulkActionBar`.
- **Custom @utility:** `stat-card-surface` (5 files), `selection-surface` (`AntigravityButton`, `AntigravityLayout`, `ThemeToggle`) used.
- **Base scale:** `shadow-sm`–`shadow-2xl` all used.

---

## 4. Hardcoded values bypassing the token system

### 4a. Inline hex in components (pages: 0 hits)
| File:Line | Value | Duplicates token |
|---|---|---|
| `PremiumLoader.tsx:8,10,12,13` | `#2c4c3b`, `#d4af37`, `#f4ebd8` | `--premium-green/gold/cream` |
| `PaletteBackground.tsx:4-8` | `#264653 #2a9d8f …` | `--chart-*` (dead file) |
| `MapVisualizer.tsx:41` | `#f43f5e` | `--chart-rose` |
| `ChartVisualizer.tsx:7,74,104-105,112` | `#6366f1 #f43f5e …` | `--chart-*` scale |
| `DiagramRenderer.tsx:14` | 7-hex chart scale | `--chart-*` exactly |
| `QuestionVisualizer.tsx:115,121,129-131,146-147` | `#6366f1 #f43f5e #10b981` | `--chart-*` / `--color-success` |
| `StatisticsSection.tsx:31-32` | `color="#F59E0B"` / `#6366F1` | bypasses `status` prop |
| `PerformanceMetricsGrid.tsx:23-26` | `#2563EB #7C3AED #0891B2 #16A34A` | bypasses `status`; raw palette |
| `SubjectPieChart.tsx:4` | 6-hex palette | `--forest-600`, `--gold-200`, `--pie-green` |
| `AntigravityTypography.tsx:149` | `from-[#f5e0be] to-[#b88c3a]` | retired parchment, no token |
| `LeaderboardTopCard.tsx:17` | `from-[#FFD700] to-[#B8860B]` | `--gold-50`/`--gold-300` |
| `paletteColors.ts:4-8` | `#22C55E #8B5CF6 #F59E0B #3B82F6` | `--color-*` |

### 4b. Arbitrary `shadow-[…]` values
`ExamTimer:155`, `PaletteBackground:32`, `AntigravityButton:67,96`, `AntigravityData:257`,
`TopicSectionRenderer:48,55,61,106,160,200`, `TopicReader:50,66,75,101,152` (+ framer-motion `boxShadow` literals),
`CarouselDots:25,36`, `SubjectCardItem:26`, `LeaderboardUserCard:15`, `LeaderboardTopCard:17`, and inline
`contentStyle` boxShadow in `DailyAttemptsChart:93`, `SubjectPieChart:29`, `DiagramRenderer:95,142,193`.

### 4c. Raw Tailwind-default palette classes (bypass `--purple-*`/`--rose-*`/`--amber-*` primitives)
- `amber-500/400/600/700`, `purple-500`, `violet-600/800`, `slate-900/50`, `red-500/600/400/900/8`,
  `rose-500`, `emerald-500/400`, `blue-400`, `green-400/500`, `white`/`black` — used across
  `QuestionCard`, `PreparationView`, `ExamLayout`, `ReviewQuestionCard`, `QuestionActions`, `AntigravityButton`,
  `TopicReader`, `SidebarLayout`, `ExamTimer`, `DiagramRenderer`, `NotificationPanel`, `ExamSummaryCards`,
  `ExamSubComponents`, `ExamQuestionAnalysis`, `ExamStudentTable`, `TagBadge`, `CreateStep*`, `SuccessView`,
  `QuestionCard`, `Navigation`, `PerformanceCharts`, `ExamPerformers`.

### 4d. Other deviation risks
- `bg-white` hardcoded in light-only branches: `TopicReader.tsx:50,66,152`.
- `bg-[var(--danger)]`: `TopicReader.tsx:101` — references the non-theme-aware index.css alias (light-mode divergence, §2.2).
- Arbitrary gradient classes embedding token values: `LoginPage:210`, `SignupPage:273-274,304`, `SplashPage:166-242`.

---

## 5. Key Takeaways
1. **Highest-value extraction:** `text-xs font-bold text-danger mt-1` (42 sites, 13 files) → a single `<FormError>` component removes ~40 duplicated fragments.
2. **Auth pages and create-step screens copy whole layout panels verbatim** (auth shell, auth grid, left panel, panel wrapper).
3. **Four parallel elevation/shadow systems** resolve to ~3 visual levels — consolidation is the largest token-level win.
4. **~30 dead registered utilities** in `@theme` add CSS weight and confuse ownership; 3 button namespaces and 2 radius/input token definitions conflict.
5. **Charts and topic/exam readers** are the primary token-bypass hot spots (hex palettes duplicating `--chart-*`, hardcoded `rgba(15,23,42,0.12)` offset shadows ~20×).
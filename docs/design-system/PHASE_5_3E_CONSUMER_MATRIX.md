# Phase 5.3E - Render-Affecting Token Corrections: Consumer Matrix

- **Phase:** 5.3E (planning only)
- **Status:** PLANNING (no implementation, no token changes, no source changes)
- **Date:** 2026-08-04
- **Governance:** D-158 (planning only)
- **Purpose:** exhaustively enumerate every consumer of each correction target, classify each as **render-affecting** vs **render-neutral**, and record the exact file:line so implementation and verification are fully deterministic.
- **Verification method:** `Select-String`/grep over `src/**/*.{tsx,ts,css}` + compiled `dist/assets/index-DaoEOt0i.css` (runtime winners). Line numbers are source-accurate as of 2026-08-04.

---

## 0. Consumer Types (how to read this document)

| Type | Definition | Repoint effect |
|---|---|---|
| **T1 — Direct `var(--alias)` value consumer** | JSX/CSS uses `var(--danger)` etc. as a resolved CSS value (inline style, arbitrary value class, plain CSS). | **Render-affecting** in light mode (dark unchanged). |
| **T2 — String-literal compare** | Component compares `color === 'var(--danger)'` against a JSX literal string (not a resolved value). | **Render-neutral** - the literal string is unchanged by the CSS repoint; the resolved branch uses theme-aware utilities. |
| **T3 — Utility indirection** | Consumer uses `text-danger`, `bg-success`, `border-input-border`, etc. These resolve the theme-switched `--color-*`/`--color-input-border` namespace. | **Render-neutral for the alias repoint** (already theme-correct); **render-affecting** if the *underlying* token (`--input-border`) is corrected. |
| **T4 — Namespace registration (`@theme`)** | index.css `@theme` lines 43-47 etc. register utility namespaces. | **Load-bearing for utility generation**; dead for value resolution (unlayered themes.css wins). Must be preserved; the loop hazard (R-2) requires updating the indirection to the canonical directly. |

---

## 1. Group A - Legacy color aliases (`secondary`, `success`, `danger`, `warning`, `info`)

**Definitions:** `index.css:274-278` (`:root`, unlayered, hardcoded dark). **`@theme` indirection:** `index.css:43-47` (`--color-*: var(--alias)`).

### 1.1 Direct consumers (T1 / T2), 17 refs in 10 files

| # | Component | File:Line | Consumer type | Surface | Theme | Path / behavior | Reclass |
|---|---|---|---|---|---|---|---|
| 1 | MetricBlock `isDanger` | `AntigravityData.tsx:260` | **T2** | Icon/text | both | `color === 'var(--danger)'` - string compare on prop; danger branch uses `text-danger bg-danger/20` (theme-aware utilities) | **Render-neutral** |
| 2 | ExamPaperCard negative-marking | `ExamPaperCard.tsx:36` | **T2** | Card | both | passes literal `'var(--danger)'` into MetricBlock → isDanger branch | **Render-neutral** |
| 3 | ReviewLayout stats | `ReviewLayout.tsx:64-66` | **T1** | StatCard icon | light | `color="var(--success)"/"var(--danger)"/"var(--info)"` → inline style (AntigravityCard.tsx:167) | **Render-affecting** |
| 4 | StatisticsSection accuracy | `StatisticsSection.tsx:30` | **T1** | StatCard icon | light | `color="var(--success)"` → inline style | **Render-affecting** |
| 5 | StudentDetailModal stats | `StudentDetailModal.tsx:57-59` | **T1** | StatCard icon | light | success/warning/danger → inline style | **Render-affecting** |
| 6 | ResultView results | `ResultView.tsx:60,66` | **T1** | StatCard icon | light | `var(--success)`/`var(--danger)` → inline style (line 72 `var(--primary)` unrelated) | **Render-affecting** |
| 7 | SelectionView negative-marking (x2) | `SelectionView.tsx:128,182` | **T2** | Card | both | literal `'var(--danger)'` into MetricBlock → isDanger branch | **Render-neutral** |
| 8 | TopicReader watch badge | `TopicReader.tsx:101` | **T1** | Button | light | `bg-[var(--danger)]` arbitrary class - resolves the alias as a real background color | **Render-affecting** |
| 9 | SubAdminDashboard stats | `SubAdminDashboard.tsx:65-67` | **T1** | StatCard icon | light | success/warning/danger → inline style | **Render-affecting** |
| 10 | `@theme` indirection | `index.css:43-47` | **T4** | namespace | both | `--color-danger: var(--danger)` etc. dead for resolution but load-bearing for utility generation; must be updated in the same change (R-2 loop hazard) | **Neutral / mandatory co-edit** |

### 1.2 StatCard `color` prop path (the T1 rendering mechanism)

`StatCard` (AntigravityCard.tsx:167) applies the prop as `style={{ color }}`. The icon sits in `PremiumIconContainer` whose `darkClassName` also carries a `statusClass` color - but the **inline style wins** over the class for `color`. So the rendered icon color in light mode = the theme-blind alias. After the repoint, the inline `var(--danger)` resolves `var(--color-danger)` → unlayered `.light` value → `#DC2626`.

### 1.3 Consolidated counts

- **Render-affecting files:** ReviewLayout, StatisticsSection, StudentDetailModal, ResultView, SubAdminDashboard, TopicReader = **6 files** (12 of 17 refs).
- **Render-neutral files:** AntigravityData, ExamPaperCard, SelectionView = **3 files** (5 of 17 refs) - already theme-correct through the utility branch.
- **Mandatory co-edit:** index.css `@theme` 43-47.

---

## 2. Radius conflicts (`radius-xl`, `radius-2xl`)

**Definitions:** `index.css:78-79` (`@theme` layered 12px/16px) vs `themes.css:114-115` (`:root` unlayered 20px/24px). Runtime winner: **themes.css 20px/24px**.

### 2.1 Direct token chain (bypasses `rounded-*` utilities)

| Token | Site | Value/ref |
|---|---|---|
| `--radius-xl` / `--radius-2xl` | themes.css:114-115 | 20px / 24px (wins) |
| `--radius-container` | themes.css:306 | `var(--radius-2xl)` = 24px |
| `--stat-card-radius` | themes.css:837 | `var(--radius-container)` = 24px |
| `--radius-stat-card-radius` | index.css:174 (`@theme`) | `var(--stat-card-radius)` |
| `rounded-stat-card-radius` consumer | AntigravityCard.tsx:150 | StatCard light card corners |

**Option A (render-neutral):** zero consumers change. **Option B:** the chain above + every `rounded-xl`/`rounded-2xl` utility consumer shifts.

### 2.2 `rounded-xl` / `rounded-2xl` utility consumers — 87 files (Option B blast radius)

Measured 2026-08-04 (grep `rounded-(xl|2xl)`, file-unique):

| Area | Files |
|---|---|
| `components/admin` | 16 (leaderboard 2, questions 6, settings 4, topics 4) |
| `components/common` | 20 |
| `components/exam` | 11 |
| `components/sub-admin` | 15 (create 8, exams 5, settings 1, students 1) |
| `components/user` | 10 (leaderboard 2, performance 2, prepare-write 2, topics 3, TestConfigView 1) |
| `components/profile` | 2 |
| `components/visualizers` | 1 (MapVisualizer) |
| `components/` (root) | 2 (ErrorBoundary, ExamTimer) |
| `hooks` | 1 (useToast) |
| `layouts` | 1 (SidebarLayout) |
| `pages` | 5 (admin 1, exam 1, AccountDisabled, FinishSignIn, Signup, VerifyEmail) |
| Audit tests | 2 (`ds003-runtime-audit.test.tsx`, `ds004-runtime-audit.test.tsx`) |
| **TOTAL** | **87** (85 production + 2 test) |

Representative surfaces affected by Option B: cards, buttons, modals, inputs, dropdown panels, nav pills, toast, stat cards, badges. Full list is the grep output above; every file is a page-family visual regression checkpoint.

---

## 3. `--input-border` (dual definition)

**Definitions:** `index.css:267` `var(--border-input)` (wins at runtime, later source) vs `themes.css:645` `var(--border-subtle)` (D-121 golden). Resulting values: dark `#4B5563`→`#374151`, light `#CBD5E1`→`#E2E8F0`.

| Component | File:Line | Consumer type | Surface | Path |
|---|---|---|---|---|
| AntigravityForm `FIELD_SURFACE` | `AntigravityForm.tsx:7` | **T3** | Input/Select/TextArea | `border-input-border` → `--color-input-border` (index.css:133) → `--input-border` (index.css:267) |
| PremiumSelect trigger | `PremiumSelect.tsx:176` | **T3** | Select trigger | same chain (`border-input-border`) |
| `.light select` (global) | `index.css:332` | **T1** | native select | `border: 1.5px solid var(--border-input)` |
| `.light .ancient-otp` (global) | `index.css:871` | **T1** | OTP | `border: 2px solid var(--border-input)` |

All four are render-affecting after the correction (subtle gray shift). Note: `index.css:133` (`@theme` `--color-input-border: var(--input-border)`) needs no change - it keeps resolving through the corrected single owner.

---

## 4. Group B - Carved shadow recipes (`card-3d-shadow`, `stat-card-3d-shadow`, `elevation-carved`)

**NO CORRECTION REQUIRED (false positive).** Each recipe has exactly one definition site (themes.css:542/549/556). Consumers are ordinary `var()`/`@theme` references and require **no action**:

| Consumer | File:Line | Status |
|---|---|---|
| `--shadow-premium-card` | index.css:183 | unchanged (single-sourced recipe) |
| `--shadow-premium-elevated` | index.css:184 | unchanged |
| `--shadow-premium-icon` | index.css:185 | unchanged |
| `--material-card-premium-shadow` | themes.css:787 | unchanged |
| `--header-shadow` | themes.css:890 | unchanged |
| `--stat-card-shadow` | themes.css:930 | unchanged |
| `shadow-premium-card/elevated` classes | AntigravityCard.tsx:25,39,152,154 | unchanged |
| `shadow-premium-icon` class | PremiumIconContainer.tsx:40, SharedComponents.tsx:26,44 | unchanged |

---

## 5. `text-stat-value`

**Definitions:** `index.css:191` (`@theme` `--text-stat-value: 1.75rem`, dead font-size registration) vs `themes.css:329` (canonical token). Compiled class = **color-only** (`.text-stat-value{color:var(--color-stat-value)}`); the `--text-*` namespace font-size utility is collision-suppressed by the `--color-*` namespace.

| Consumer | File:Line | Consumer type | Effect of cleanup |
|---|---|---|---|
| LoginPage stats | `LoginPage.tsx:231,235,239` | T3 (`text-stat-value` class = color only; size via `Display` inline `fontSize: var(--text-display)`) | **No render change** |
| Dead responsive overrides | index.css:444,458,473 | — | dead (same suppression) |
| AntigravityCard stat value | `AntigravityCard.tsx:183` | `text-stat-value-text` (different token) | unaffected |

**No render-affecting correction in 5.3E.**

---

## 6. Summary counts

| Correction | Consumers | Render-affecting files | Render-neutral files | Co-edits required |
|---|---|---|---|---|
| Group A aliases | 17 refs / 10 files + `@theme` | **6** (ReviewLayout, StatisticsSection, StudentDetailModal, ResultView, SubAdminDashboard, TopicReader) | 3 (AntigravityData, ExamPaperCard, SelectionView) | index.css:43-47 |
| Radius Option A | 0 (render-neutral) | 0 | 0 | index.css:78-79 (align values) |
| Radius Option B | 87 files + token chain | **87** | 0 | themes.css:114-115 + index.css:78-79 |
| `--input-border` | 4 (AntigravityForm, PremiumSelect, `.light select`, `.light .ancient-otp`) | **4** | 0 | index.css:267 |
| Group B carved | 10 refs | 0 | 0 (false positive) | none |
| `text-stat-value` | 3 LoginPage + 1 other | **0** | 3 | none (scheduled render-neutral cleanup, optional) |

---

## 7. Verification anchors (post-implementation)

- Group A: computed `color` on StatCard icons = `#DC2626` (danger), `#16A34A` (success), `#D97706` (warning), `#166534` (info), `#C8960C` (secondary) in light mode; dark mode byte-identical to today.
- Radius Option A: compiled CSS shows a single winning value 20px/24px; no component change.
- `--input-border`: computed `border-color` on AntigravityForm input / PremiumSelect trigger = `#374151` (dark) / `#E2E8F0` (light); `.light select`/`.ancient-otp` follow.

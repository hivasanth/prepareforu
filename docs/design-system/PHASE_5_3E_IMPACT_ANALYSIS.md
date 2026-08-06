# Phase 5.3E - Render-Affecting Token Corrections: Impact Analysis

- **Phase:** 5.3E - first render-affecting Foundation correction phase (planning only)
- **Status:** PLANNING (no implementation, no token changes, no source changes)
- **Date:** 2026-08-04
- **Governance:** D-158 (planning only)
- **Scope:** Group A color aliases, `radius-xl`/`radius-2xl`, `--input-border`, Group B carved recipes, `text-stat-value`
- **Verification method:** compiled `dist` CSS cascade analysis (ground truth) + source read + `@theme` layer rules

---

## 0. Cascade Ground Truth (evidence for every correction)

Tailwind v4 emits `@theme` registrations inside `@layer theme` (`:root,:host`). Author CSS in `themes.css` and `index.css` `:root`/`.light` blocks is **unlayered**. Per the CSS cascade, **unlayered styles beat layered styles** regardless of source order. Therefore:

| Custom property | `@theme` (layered) | `themes.css` `:root` (unlayered) | `themes.css` `.light` (unlayered) | Runtime winner |
|---|---|---|---|---|
| `--radius-xl` | 12px (index.css:78) | **20px** (themes.css:114) | — | **20px** (unlayered beats layered) |
| `--radius-2xl` | 16px (index.css:79) | **24px** (themes.css:115) | — | **24px** |
| `--color-danger` | var(--danger) (index.css:45) | #F87171 (themes.css:246) | #DC2626 (themes.css:481) | **#F87171 dark / #DC2626 light** |
| `--color-success` | var(--success) (index.css:44) | #22C55E (:240) | #16A34A (:475) | **#22C55E dark / #16A34A light** |
| `--color-warning` | var(--warning) (:46) | #FBBF24 (:243) | #D97706 (:478) | **#FBBF24 dark / #D97706 light** |
| `--color-info` | var(--info) (:47) | #3B82F6 (:249) | **#166534** (:484) | **#3B82F6 dark / #166534 light** |
| `--color-secondary` | var(--secondary) (:43) | #10B981 (:236) | #C8960C (:471) | **#10B981 dark / #C8960C light** |
| `--danger` (legacy alias) | — | **#F87171** (index.css:276) | *(no `.light` override)* | **#F87171 ALWAYS (never theme-switches)** |
| `--success`/`--warning`/`--info`/`--secondary` (aliases) | — | hardcoded dark (index.css:274-278) | *(none)* | **dark values ALWAYS** |
| `--input-border` | — | index.css:267 `var(--border-input)` | — | **var(--border-input)** (#4B5563 dark / #CBD5E1 light) |
| `--input-border` (alt def) | — | themes.css:645 `var(--border-subtle)` | — | (lost - index.css:267 later in source, equal specificity) |
| `--text-stat-value` | 1.75rem (index.css:191) | 1.75rem (themes.css:329) | — | 1.75rem (both agree; registration is **collision-suppressed**, see E) |

**Key consequences:**
1. **Utilities** (`text-danger`, `bg-success`, `rounded-2xl`) resolve through the theme-switched `--color-*`/`--radius-*` unlayered values → **already correct in both themes.**
2. **Direct `var(--danger)`/`var(--success)`/etc. legacy-alias consumers** (17 hits) resolve the hardcoded `:root` alias → **theme-blind (dark value in light mode).** This is the Group A defect.
3. The `@theme` `--color-*: var(--alias)` indirection (index.css:43-47) is **dead for value resolution** (loses to unlayered themes.css) but **load-bearing for Tailwind utility generation** (utilities only exist if the namespace is registered). Any fix must preserve the namespace.

---

## 1. Group A - Legacy color aliases (`secondary`, `success`, `danger`, `warning`, `info`)

### 1.1 Current State

- **Current definition (owner: `index.css` `:root`, unlayered, lines 274-278):**
  ```
  --secondary: #10B981;  --success: #22C55E;  --danger: #F87171;
  --warning: #FBBF24;    --info: #3B82F6;
  ```
- **Current owner:** `index.css` `:root` (single site; **no** `.light` override anywhere - verified).
- **Consumer count:** 17 direct `var()` references in components (see consumer matrix); plus the `@theme` indirection index.css:43-47.
- **Current rendered value:** the hardcoded dark values in **both themes** (never theme-switches).
- **Current visual behavior:** In dark mode the aliases equal the dark canonicals (correct). In light mode they render the dark value (e.g. danger `#F87171` instead of canonical `#DC2626`), producing a lighter, washed-out state color on StatCard icons, badges, error marks, and review feedback.

### 1.2 Proposed State

- **Canonical token:** `--color-secondary`/`--color-success`/`--color-danger`/`--color-warning`/`--color-info` in `themes.css` (theme-switched dark/light).
- **New rendered value:** repoint the aliases to the canonicals so they theme-switch:
  - `--danger: var(--color-danger)` → dark `#F87171` / light `#DC2626`
  - `--success: var(--color-success)` → dark `#22C55E` / light `#16A34A`
  - `--warning: var(--color-warning)` → dark `#FBBF24` / light `#D97706`
  - `--info: var(--color-info)` → dark `#3B82F6` / light `#166534`
  - `--secondary: var(--color-secondary)` → dark `#10B981` / light `#C8960C`
- **Reason:** one source of truth; direct consumers become theme-aware; utilities already resolve the same way (visual consistency).
- **Expected visual change:** light-mode state colors shift to the certified canonical values (e.g. danger `#F87171`→`#DC2626`, success `#22C55E`→`#16A34A`, warning `#FBBF24`→`#D97706`, info `#3B82F6`→`#166534`). Dark mode **unchanged**.

### 1.3 Consumer Impact

| Component | File:Line | Surface | Theme | Variant | Risk |
|---|---|---|---|---|---|
| AntigravityData (danger detection) | AntigravityData.tsx:260 | Icon/text | both | danger | Low (string compare `color === 'var(--danger)'` is unaffected by CSS) |
| ExamPaperCard | ExamPaperCard.tsx:36 | Card | light | negative-marking badge | Low-Med |
| ReviewLayout | ReviewLayout.tsx:64-66 | StatCard icon | light | success/danger/info | Med |
| StatisticsSection | StatisticsSection.tsx:30 | StatCard icon | light | success | Low-Med |
| StudentDetailModal | StudentDetailModal.tsx:57-59 | StatCard icon | light | success/warning/danger | Med |
| ResultView | ResultView.tsx:60,66 | StatCard icon | light | success/danger | Med |
| SelectionView | SelectionView.tsx:128,182 | Card | light | negative-marking | Low-Med |
| TopicReader | TopicReader.tsx:101 | Badge | light | danger | Low-Med |
| SubAdminDashboard | SubAdminDashboard.tsx:65-67 | StatCard icon | light | success/warning/danger | Med |
| `@theme` indirection | index.css:43-47 | namespace | — | — | must preserve namespace (see 1.5) |

Full detail in `PHASE_5_3E_CONSUMER_MATRIX.md`.

### 1.4 Visual Impact

**Classification: Medium.** Confined to light mode and to ~10 component files (17 var refs). Each change is a within-family hue/value shift (all state colors move to their certified canonical value). No layout, sizing, or structure change. Dark mode is byte-identical. However, `--info` light canonical is `#166534` (dark green) - a striking change from blue `#3B82F6`; this needs golden-reference verification before implementation (see risk R-3).

### 1.5 Migration Strategy

- **Order:** (1) confirm golden-reference values for all five in light mode; (2) repoint the five aliases in `index.css:274-278` to `var(--color-*)`; (3) update the `@theme` indirection at `index.css:43-47` so it does NOT reference the aliases (set each to the canonical directly, e.g. `--color-danger: var(--color-danger)`) - **otherwise the alias→canonical repoint creates a value loop through the dead `@theme` indirection**. Since the `@theme` values are dead (unlayered themes.css wins) this is cosmetic, but it removes the loop hazard; (4) optionally add a `:root`/`.light` alias comment documenting that aliases are delegated to canonical.
- **Rollback:** git revert of the two-line blocks (aliases + @theme). No schema/data impact.
- **Verification:** `tsc -b && vite build`; grep compiled CSS that `--danger:var(--color-danger)` and `--color-danger` unlayered dark/light remain; computed-style spot check on `ReviewLayout`/`StudentDetailModal` StatCard icons in light mode = canonical value.

### 1.6 Before / After

- **Before (light mode):** StatCard danger icon `#F87171` (light red), success `#22C55E` (bright green), warning `#FBBF24` (yellow), info `#3B82F6` (blue), secondary `#10B981` (green). Theme-blind - identical to dark mode.
- **After (light mode):** danger `#DC2626` (deeper red), success `#16A34A` (forest green), warning `#D97706` (amber), info `#166534` (dark green), secondary `#C8960C` (gold). Now matches `text-danger`/`bg-success` utilities already rendering correctly in light mode.
- **Screenshots:** none available in repo; visual description above. Recommend a light-mode pass over exam review, student detail, sub-admin dashboard, and result pages post-implementation.

---

## 2. Radius conflicts (`radius-xl`, `radius-2xl`)

### 2.1 Current State

- **Current definitions (two sites, different values):**
  - `index.css:78-79` (`@theme`, layered): `--radius-xl: 12px; --radius-2xl: 16px;`
  - `themes.css:114-115` (`:root`, unlayered): `--radius-xl: 20px; --radius-2xl: 24px;`
- **Current owner:** effectively `themes.css` `:root` (unlayered wins at runtime → **20px/24px**).
- **Consumer count:** `rounded-xl`/`rounded-2xl` utilities in **86 component files**; direct `var(--radius-2xl)` via `--radius-container` (themes.css:306) → `--stat-card-radius` (themes.css:837) → `rounded-stat-card-radius` (AntigravityCard:150).
- **Current rendered value:** `rounded-xl` = **20px**, `rounded-2xl` = **24px** (compiled CSS confirms unlayered wins).
- **Current visual behavior:** large radii on cards, buttons, modals, inputs.

### 2.2 Proposed State (two possible resolutions - DECISION POINT)

- **Option A - "themes.css wins" (render-neutral, matches token audit FG-5):** declare `themes.css` (20px/24px) canonical; align `@theme:78-79` values to `20px`/`24px` so both sites agree. Rendered radius **unchanged** (already 20px/24px). Resolves the conflict with zero visual delta.
- **Option B - "@theme wins" (render-affecting, matches D-111 intent):** declare `@theme` (12px/16px) canonical; remove/adjust `themes.css:114-115`. **Every `rounded-xl`/`rounded-2xl` consumer changes 20px→12px / 24px→16px** across 86 files - a large, repository-wide visual change.

### 2.3 Consumer Impact (Option B would be repository-wide)

86 files use `rounded-xl`/`rounded-2xl` (admin, exam, profile, sub-admin, user, common, tests). Full list in `PHASE_5_3E_CONSUMER_MATRIX.md`. Direct `--radius-container`→`--stat-card-radius` chain (themes.css:306,837) also affected by Option B.

### 2.4 Visual Impact

- **Option A:** **None** (render-neutral).
- **Option B:** **Critical** - every rounded-xl/2xl surface in the app shrinks by 8px (24→16) or 8px (20→12). This is a global material-language change.

### 2.5 Migration Strategy

- **Option A:** edit `@theme:78-79` to `20px`/`24px`; build; grep compiled CSS shows single winning value; zero visual check needed.
- **Option B:** remove `themes.css:114-115`; `tsc -b && vite build`; full visual regression across all 86 consumer files; high rollback risk.
- **Order:** decision first (governance), then Option A (trivial) or Option B (screenshot baseline → change → compare).
- **Rollback:** git revert of the affected lines.
- **Verification:** Option A: compile check. Option B: before/after screenshots per page family + computed-style assertions on `rounded-xl`/`rounded-2xl`.

### 2.6 Before / After

- **Option A:** no change.
- **Option B:** before: cards/buttons/modals 20px/24px corners; after: 12px/16px corners (tighter, more compact material). Screenshots not in repo; the cert docs reference `rounded-2xl = 16px` as a design target (ADMIN_USERS_U1_VISUAL_COMPARISON), which supports Option B being the intended design - **but the current runtime is 20/24**, so this must be decided deliberately.

---

## 3. Input border conflict (`--input-border`)

### 3.1 Current State

- **Current definitions (two unlayered `:root` sites, different values):**
  - `index.css:267`: `--input-border: var(--border-input)` → `#4B5563` dark / `#CBD5E1` light (later in source, **wins**)
  - `themes.css:645`: `--input-border: var(--border-subtle)` → `#374151` dark / `#E2E8F0` light (D-121 re-anchored to the certified Input render; lost because index.css:267 comes later at equal specificity)
- **Current owner:** `index.css:267` (runtime winner).
- **Consumer count:** `--color-input-border` (index.css:133 `@theme`) → `border-input-border` utility → AntigravityForm.tsx:7 (FIELD_SURFACE), PremiumSelect.tsx:176; plus direct `var(--border-input)` in `index.css:332` (`.light select`) and `index.css:871` (`.light .ancient-otp`).
- **Current rendered value:** `#4B5563` dark / `#CBD5E1` light (lighter border on inputs).
- **Current visual behavior:** Input family borders use the `--border-input` value, which is lighter than the certified `.ancient-input`/golden render (`--border-subtle`).

### 3.2 Proposed State

- **Canonical token:** per D-121, the certified Input render uses `--border-subtle`. Align `index.css:267` to `var(--border-subtle)` (or remove index.css:267 so themes.css:645 is the single owner).
- **New rendered value:** `#374151` dark / `#E2E8F0` light.
- **Reason:** resolves the duplicate definition; matches the golden `.ancient-input` (`border:1px solid var(--border-subtle)`, verified in compiled CSS).
- **Expected visual change:** subtle - input borders darken slightly in dark mode and lighten slightly in light mode (both are gray-family shifts).

### 3.3 Consumer Impact

| Component | File:Line | Surface | Theme | Variant | Risk |
|---|---|---|---|---|---|
| AntigravityForm FIELD_SURFACE | AntigravityForm.tsx:7 | Input/Select/TextArea | both | default | Low |
| PremiumSelect | PremiumSelect.tsx:176 | Select trigger | both | default | Low |
| `.light select` | index.css:332 | native select | light | global | Low |
| `.light .ancient-otp` | index.css:871 | OTP | light | global | Low |

### 3.4 Visual Impact

**Classification: Low.** Both values are grays in the same family; delta is ~1 shade. Confined to input-family borders. No layout change.

### 3.5 Migration Strategy

- **Order:** (1) confirm golden input render = `--border-subtle` (D-121 + compiled `.ancient-input` confirm); (2) change `index.css:267` to `var(--border-subtle)`; (3) keep `themes.css:645` as canonical (or delete it and keep index.css as owner - prefer keeping themes.css:645 and making index.css:267 reference it, i.e. single owner in themes.css).
- **Rollback:** git revert of `index.css:267`.
- **Verification:** build; computed-style on `AntigravityForm` input and `PremiumSelect` trigger = `#374151` dark / `#E2E8F0` light; confirm no regression on `.light select`/`.ancient-otp`.

### 3.6 Before / After

- **Before:** input borders `#4B5563` (dark) / `#CBD5E1` (light).
- **After:** input borders `#374151` (dark) / `#E2E8F0` (light) - matches golden `.ancient-input`. Screenshots not available; visual delta is a subtle gray shift.

---

## 4. Group B - Carved shadow recipes (`card-3d-shadow`, `stat-card-3d-shadow`, `elevation-carved`)

### 4.1 Current State

- **Current definition:** **single site only** - `themes.css:542` (`--card-3d-shadow`), `:549` (`--stat-card-3d-shadow`), `:556` (`--elevation-carved`).
- **Current owner:** `themes.css` `:root` (only definition in the repo).
- **Consumer count:** referenced by `index.css:183-185` (`@theme` `--shadow-premium-*`), `themes.css:787/890/930` (`--material-card-premium-shadow`, `--header-shadow`, `--stat-card-shadow`), and consumed via the `shadow-premium-card/elevated/icon` utilities in AntigravityCard.tsx:25,39,152,154, PremiumIconContainer.tsx:40, SharedComponents.tsx:26,44,68,145.
- **Current rendered value:** the carved recipes as defined (dark-mode depth shadows).
- **Current visual behavior:** carved gold-material depth on premium cards, stat cards, premium icons.

### 4.2 Proposed State

**NO CORRECTION REQUIRED.** The 5.2A inventory classified these as MERGE; implementation review (5.3D) deferred them because "recipes NOT byte-identical" - but the comparison was between the three **different** recipes (card-3d vs stat-card-3d vs elevation-carved), **not** between duplicate definitions. There is **no duplicate**: each recipe has exactly one definition site. Per the user instruction "only if values differ" - values do not differ because there is no second definition. This is a **false positive in the inventory**.

- **Canonical token:** `themes.css:542/549/556` (already single-sourced).
- **New rendered value:** none.
- **Reason:** no conflict exists.
- **Expected visual change:** none.

### 4.3-4.6 Consumer Impact / Visual Impact / Migration / Before-After

None. Record as "verify-only": confirm no second definition appears in a future batch; no action required in 5.3E.

---

## 5. `text-stat-value`

### 5.1 Current State

- **Current definitions:**
  - `index.css:191` (`@theme`): `--text-stat-value: 1.75rem` (font-size namespace registration)
  - `index.css:196` (`@theme`): `--color-stat-value: var(--stat-value-text)` (color namespace registration)
  - `themes.css:329` (canonical): `--text-stat-value: 1.75rem; --lh-stat-value: 1.0; --fw-stat-value: 900; --ls-stat-value: -0.05em`
- **Current owner:** themes.css:329 for the token; but the utility's behavior is defined by the two `@theme` registrations.
- **Consumer count:** `text-stat-value` class in LoginPage.tsx:231,235,239; `text-stat-value-text` (a different token) in AntigravityCard.tsx:183.
- **Current rendered value:** **The `text-stat-value` class renders COLOR ONLY** - compiled CSS shows `.text-stat-value{color:var(--color-stat-value)}` and **no** `font-size` rule. The `--text-stat-value` font-size registration (index.css:191) is **collision-suppressed**: Tailwind registers the same class name from both the `--color-*` namespace (color) and the `--text-*` namespace (font-size); the color utility wins, the font-size utility is not emitted.
- **Current visual behavior:** LoginPage stat values get their **font size from the `Display` component's inline `fontSize: var(--text-display)`** (AntigravityTypography.tsx:95-102 = 1.75rem), not from `--text-stat-value`. Color comes from `--color-stat-value` (= `--stat-value-text` = `var(--text-primary)`).

### 5.2 Proposed State

**NO RENDER-AFFECTING CORRECTION REQUIRED.** Per the user instruction "only if implementation changes rendered output": removing or aligning the dead `--text-stat-value` font-size registration (index.css:191) does **not** change rendered output (nothing consumes it as font-size; the class is color-only; Display supplies size). The responsive overrides at index.css:444/458/473 (`2.0rem`/`2.25rem`) are also dead for the same reason.

- **Canonical token:** themes.css:329 stays as the token definition.
- **New rendered value:** none.
- **Reason:** the registration is dead; no render delta.
- **Expected visual change:** none.

### 5.3 Consumer Impact

LoginPage.tsx:231,235,239 (class = color only, size from Display) - unaffected by any token cleanup. AntigravityCard.tsx:183 uses `text-stat-value-text`, a different token - unaffected.

### 5.4 Visual Impact

**None** (if dead registration removed). **Medium** (if the intended fix is to make `text-stat-value` actually apply the stat-value font-size - that WOULD change LoginPage rendering, but it requires renaming one of the two namespaces, a larger change outside this phase's scope).

### 5.5 Migration Strategy

- Recommended: remove the dead `--text-stat-value: 1.75rem` registration (index.css:191) and the dead responsive overrides (index.css:444,458,473) **only if** a follow-up render-neutral cleanup phase is approved. Do NOT include in 5.3E's render-affecting scope.
- Alternative (out of scope): rename namespaces so `text-stat-value` can carry font-size - that is a deliberate render change requiring its own approval.
- **Rollback:** git revert of removed lines.
- **Verification:** build; compiled CSS still shows `.text-stat-value{color:...}`; LoginPage stats still render at 1.75rem via Display.

### 5.6 Before / After

- **Before:** LoginPage stats render 1.75rem (via Display inline), color text-primary. Class applies color only.
- **After (recommended):** identical rendering; dead registration removed.
- **Screenshots:** none in repo.

---

## 6. Repository-wide Impact Matrix

| Correction | Management pages | Exam pages | Authentication | Dashboard | Navigation | Buttons | Inputs | Cards | Badges | Typography | Charts | Legacy pages | State |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Group A aliases** | Affected (SubAdminDashboard, ExamDetailModal, StudentDetailModal) | Affected (ReviewLayout, ReviewQuestionCard, QuestionCard) | Affected (LoginPage danger marks) | Affected (SubAdminDashboard) | Not affected | Affected (AntigravityButton danger/success) | Not affected | Affected (StatCard, ExamPaperCard) | Affected (TopicReader, IconBadge, Alert) | Not affected | Not affected | Affected (ResultView, SelectionView) | **Needs verification (light mode)** |
| **Radius Option A** | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | **Conflict resolved render-neutral** |
| **Radius Option B** | Affected | Affected | Affected | Affected | Affected | Affected | Affected | Affected | Affected | Not affected | Affected | Affected | **Needs verification (86 files)** |
| **`--input-border`** | Affected (forms) | Not affected | Affected (LoginPage/SignupPage inputs) | Not affected | Not affected | Not affected | **Affected (AntigravityForm, PremiumSelect, select, otp)** | Not affected | Not affected | Not affected | Not affected | Affected (`.light select`) | **Needs verification (gray shift)** |
| **Group B carved** | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | Not affected | **No action** |
| **`text-stat-value`** | Not affected | Not affected | Affected (LoginPage class) | Not affected | Not affected | Not affected | Not affected | Affected (AntigravityCard:183 color-only) | Not affected | Affected (color only) | Not affected | Not affected | **No render change** |

---

## 7. Risk Register

| ID | Correction | Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|---|---|
| R-1 | Group A | Direct var() consumers are theme-blind today; repoint changes light-mode rendering of ~10 files. | Medium | High | Confirm golden light values first; dark-mode must stay byte-identical; visual pass on exam review/student/dashboard/results. |
| R-2 | Group A | `@theme` indirection (index.css:43-47) references the aliases; repointing aliases creates a **value loop** through the dead `@theme` layer if not also updated. | Medium | Medium | Update `@theme:43-47` to reference canonical `--color-*` directly in the same change. |
| R-3 | Group A | Light `--color-info: #166534` (dark green) is surprising; may itself be a theme defect vs. an intended blue. | Medium | Low | Verify against golden reference; if wrong, treat `--color-info` light value as a separate correction. |
| R-4 | Radius | Two authoritative-looking decisions conflict: D-111 says `@theme` (12/16) authoritative; token audit FG-5 says themes.css (20/24) wins. | High | High | Make a deliberate governance choice; Option A is render-neutral, Option B is repository-wide (Critical). |
| R-5 | Radius Option B | 86 files change radius; high regression surface; screenshots unavailable. | Critical | Medium | Baseline screenshots per page family before change; computed-style assertions; staged rollout. |
| R-6 | `--input-border` | Duplicate definition (index.css:267 vs themes.css:645); runtime winner differs from D-121 golden render. | Low | High | Align to `--border-subtle` per golden; verify PremiumSelect + AntigravityForm + select/otp. |
| R-7 | Group B | Inventory false positive (no duplicate). | None | n/a | Record as verify-only; do not attempt a merge. |
| R-8 | `text-stat-value` | Dead font-size registration; collision with color namespace. | None (if no-op) / Medium (if "fix" attempted) | Medium | Keep as no-op in 5.3E; optionally schedule render-neutral cleanup; do not rename namespaces here. |

---

## 8. Recommendation

| Correction | Recommendation |
|---|---|
| **Group A** | **IMPLEMENT** (in 5.3E) - the flagship render-affecting correction; confirmed light-mode canonical values needed first. |
| **Radius** | **DECISION REQUIRED** - recommend **Option A (render-neutral, themes.css wins)** for 5.3E to keep blast radius zero; if Option B is chosen (D-111 intent, 12/16), **SPLIT into its own phase** with full screenshot baseline (Critical risk). |
| **`--input-border`** | **IMPLEMENT** (in 5.3E) - Low risk, aligns to golden render. |
| **Group B carved** | **NO ACTION** - false positive; verify-only. |
| **`text-stat-value`** | **DO NOT INCLUDE** in 5.3E render-affecting scope - dead registration; no render delta; schedule as render-neutral cleanup if desired. |

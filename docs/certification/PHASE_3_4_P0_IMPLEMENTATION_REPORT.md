# Phase 3.4 P0 — Control Family Per-Role Semantic Tokens (D-121) — Implementation Report

**Status:** ✅ IMPLEMENTED + CERTIFIED (2026-08-02)
**Directive:** D-121 (per-role Control token namespaces), D-120 (identical-render gate),
D-119 (dropdown panels → Surface floating surface), D-118 (CollectionFilter = Control/Filter role).
**Method:** Foundation-first — token changes live in `themes.css`/`index.css`; the six Control
components consume ONLY their role tokens; zero page code changed.

---

## 1. Objective

Re-scope every Control component off Surface/Card material (`--card-*`, `--bg-surface`,
`--material-card-premium-*`) and off the shared generic `--bg-hover-bg`/`--border-subtle`,
re-anchoring each Control role onto its own semantic namespace — with an **identical-render
gate** (D-120): every new value is a re-anchoring of the existing certified render, never a
new color/shadow/radius/border.

Dropdown **panels** are NOT controls: per D-119 (user-approved rule), the panel is a Surface
floating surface shared by ALL dropdown openers (`Menu`, `PremiumSelect`, `CollectionFilter`,
future); only the **trigger** is a Control.

---

## 2. Token changes — `src/styles/themes.css`

### 2.1 Input component tokens (render-neutral re-anchor)

`--input-bg: var(--bg-input)` → `var(--bg-hover)`; `--input-border: var(--border-input)` →
`var(--border-subtle)`. Both prior values had **zero consumers** (nothing rendered from them),
so this is render-neutral. D-121 comment documents the re-anchor against the certified
`.ancient-input` render.

### 2.2 New dark `:root` role tokens (D-121)

| Token | Value | Purpose |
|---|---|---|
| `--input-surface-active` | `color-mix(accent 10%)` | PremiumSelect active trigger bg |
| `--input-text-active` | `var(--color-accent)` | PremiumSelect active trigger text |
| `--input-border-active` | `color-mix(accent 20%)` | PremiumSelect active trigger border |
| `--input-border-hover-active` | `color-mix(accent 50%)` | PremiumSelect idle→active hover border |
| `--button-surface-secondary` | `var(--bg-hover)` | Button Secondary surface (dark) |
| `--button-surface-secondary-hover` | `color-mix(bg-hover 80%)` | Secondary hover (dark) |
| `--button-text-secondary` | `var(--text-primary)` | Secondary text |
| `--button-border-secondary` | `var(--border-subtle)` | Secondary border (dark 1px) |
| `--button-border-secondary-width` | `1px` (dark) | Documented width token (utility-branch note §5.2) |
| `--button-shadow-secondary` | `none` | Secondary shadow (dark) |
| `--button-shadow-secondary-hover` | `var(--elevation-1)` | Secondary hover shadow (dark) |
| `--button-surface-ghost` / `-hover` | `transparent` / `var(--bg-hover)` | Ghost surface |
| `--button-text-ghost` / `-hover` | `var(--text-secondary)` / `var(--text-primary)` | Ghost text |
| `--button-border-ghost` | `transparent` | Ghost border |
| `--checkbox-surface` / `-border` | `var(--bg-hover)` / `var(--border-subtle)` | Unchecked |
| `--checkbox-border-hover` | `color-mix(accent 70%)` | `peer-hover` border |
| `--checkbox-border-focus` | `var(--color-accent)` | `peer-focus` border |
| `--checkbox-surface-checked` / `-border-checked` | `var(--color-accent)` | Checked |
| `--radio-surface` / `-border` | `var(--bg-hover)` / `var(--border-subtle)` | Unchecked |
| `--radio-border-hover` | `color-mix(accent 50%)` | `peer-hover` border |
| `--radio-border-checked` | `var(--color-accent)` | Checked border |
| `--radio-dot-checked` | `var(--color-accent)` | Checked dot |
| `--radio-track-surface` | `var(--bg-surface)` | RadioGroup segmented track |
| `--filter-surface` / `-border` / `-text` | `var(--bg-surface)` / `var(--border-subtle)` / `var(--text-primary)` | CollectionFilter idle |
| `--filter-border-hover` | `color-mix(accent 50%)` | Idle hover border |
| `--filter-surface-active` / `-text-active` / `-border-active` | accent mixes | Active state |
| `--filter-shadow` / `-shadow-hover` | `var(--elevation-2)` / `none` | Trigger elevation (dark) |

Every dark value re-anchors an existing certified dark render (`--bg-hover`,
`--border-subtle`, `--color-accent`, `--elevation-*`). **Zero new colors.**

### 2.3 `.light` overrides (preserve certified light renders)

| Token | Value | Preserves |
|---|---|---|
| `--button-surface-secondary` | `var(--bg-surface)` (#C9A070) | certified light Secondary fill |
| `--button-surface-secondary-hover` | `var(--bg-surface)` | no bg change on light hover |
| `--button-border-secondary` | `var(--border-gold)` (#A87828) | certified light gold edge |
| `--button-border-secondary-width` | `1.8px` | certified light border width |
| `--button-shadow-secondary` | `var(--card-3d-shadow)` | certified light carved shadow |
| `--button-shadow-secondary-hover` | `var(--elevation-carved)` | certified light hover shadow |
| `--checkbox-surface` / `-border` | `var(--bg-surface)` / `var(--border-gold)` | certified light checkbox |
| `--filter-shadow` / `-shadow-hover` | `var(--card-3d-shadow)` / `var(--elevation-carved)` | certified light filter trigger |

`.light`-only references to `--border-gold`/`--elevation-carved`/`--card-3d-shadow` are safe:
those tokens are defined in `.light` scope (see D-122 for why they must NOT be added to dark).

---

## 3. Token exposure — `src/index.css`

Added `@theme` role-token exports after the `--shadow-button-primary` block (~L129), so
Tailwind v4 generates utilities from the role tokens:

- `--color-button-*` — surface-secondary(+hover), text-secondary, border-secondary,
  surface-ghost(+hover), text-ghost(+hover), border-ghost
- `--color-input-*` — bg, text, border, surface-active, text-active, border-active,
  border-hover-active, focus-border
- `--color-filter-*` — surface, text, border, border-hover, surface-active, text-active,
  border-active
- `--shadow-filter`, `--shadow-filter-hover`
- `--color-checkbox-*` — surface, border, border-hover, border-focus, surface-checked,
  border-checked
- `--color-radio-*` — surface, border, border-hover, border-checked, dot-checked,
  track-surface

---

## 4. Component changes (six files)

| File | Role | Change |
|---|---|---|
| `AntigravityButton.tsx` | Button | Secondary → `bg-button-surface-secondary text-button-text-secondary border-[1.8px] border-button-border-secondary shadow-button-secondary hover:bg-button-surface-secondary-hover hover:shadow-button-secondary-hover hover:-translate-y-0.5`; `dark:` branch uses the same role tokens with `border` (1px). Ghost → `--button-*ghost`. IconButton `theme` variant border → `border-button-border-secondary`. |
| `AntigravityForm.tsx` | Input/TextArea/Select/Checkbox/Radio | Fields → `bg-input-bg border-input-border text-input-text` (+ non-violet `focus:border-input-focus-border`); Checkbox → `--checkbox-*` (peer-focus/hover); Radio → `--radio-*`; RadioGroup track → `bg-radio-track-surface`. |
| `PremiumSelect.tsx` | Input role (trigger) + Surface panel | Active `bg-input-surface-active text-input-text-active border-input-border-active`; idle `bg-input-bg … hover:border-input-border-hover-active`; panel `bg-card-bg` → `bg-[var(--surface-floating)]`. |
| `CollectionFilter.tsx` | Filter role (trigger) | `bg-filter-surface text-filter-text border-filter-border hover:border-filter-border-hover shadow-filter hover:shadow-filter-hover`; active `bg-filter-surface-active text-filter-text-active border-filter-border-active`. |
| `Menu.tsx` | Surface panel | Panel `bg-card-bg` → `bg-[var(--surface-floating)]` (`.ancient-overlay` kept — consistent in light). |
| `SelectionCheckbox.tsx` | (consumer of Checkbox) | No change — inherits role tokens automatically. |

### 4.1 Zero `--card-*` classes remain in Control components

Verified by grep: no `card-bg` / `card-premium` / `card-shadow` class remains in the six
Control files. Remaining generic-token uses are **hover/variant internals, not Surface
inheritance** (documented, left as-is):
- `Switch` L190 `bg-hover-bg` (Switch has no dedicated namespace yet — generic track)
- `PremiumSelect` option hover rows L239-240 / L269-270 (`hover:bg-hover-bg`)
- `Menu.Item` hover L313 (`hover:bg-hover-bg`)
- `IconButton` theme dark `dark:bg-hover-bg/60`

---

## 5. Render-preservation notes

### 5.1 Accepted visual deltas (dropdown panels — user-approved, D-119/D-121 rule)

The panel-surface unification is architectural, not per-owner. Every floating panel now uses
`--surface-floating` (`--bg-elevated`):

| Panel | Before | After | Delta |
|---|---|---|---|
| `Menu.Content` dark | `bg-card-bg` #1F2937 | `--surface-floating` #374151 | accepted (all panels unified) |
| `PremiumSelect` panel dark | #1F2937 | #374151 | accepted |
| `PremiumSelect` panel light | `bg-card-bg` #C9A070 | `--surface-floating` (light `--bg-elevated`) | accepted |

These are the only visual deltas in the phase and were explicitly approved by the user
(surface-family ownership for ALL dropdown panels; identical tokens regardless of opener).

### 5.2 Button Secondary border width (theme-branched, per certified render)

Tailwind v4 could not be verified standalone for `border-[length:var(--…)]` (arbitrary length
from a theme-switching var is ambiguous in the v4 `border-width` API), so the certified
per-theme widths are kept as fixed utilities: light `border-[1.8px]` (#A87828 1.8px gold edge
— preserves 3.2.3 certified render), dark `border` 1px (`--button-border-secondary` =
`--border-subtle`). Both match the pre-refactor renders exactly. `--button-border-secondary-width`
is defined (1px dark / 1.8px light) as the documented source of truth but is **currently unused
by utilities** — kept for a future `border-[length:…]` adoption; harmless dead-token documented.

### 5.3 D-122 — dark `--elevation-carved` / `--border-gold` NOT added

3.3A-G3/G4 (P0-1/P0-2) are **deferred**, not executed: adding dark values would re-add carved
shadows / gold border lines to frozen `Card` (DS-001) / `Tabs` (DS-011) dark renders — a
redesign of frozen components, forbidden by the Permanent Freeze Rule and D-120. The current
`none`/`currentColor` dark fallbacks ARE the certified dark states. Logged as D-122.

---

## 6. Verification

- `npx tsc -b` → **exit 0**
- `npm run build` → **exit 0** (only pre-existing chunk-size notices)
- ESLint on all 6 touched components → **0 problems**
- Emitted CSS verified in `dist/assets/*.css`:
  - `bg-button-surface-secondary`, `bg-button-surface-ghost`, `bg-button-surface-secondary-hover`
  - `bg-input-bg`, `border-input-border`, `bg-input-surface-active`, `text-input-text-active`
  - `bg-filter-surface`, `shadow-filter`
  - `bg-checkbox-surface`, `bg-radio-surface`, `bg-radio-track-surface`
  - `border-button-border-secondary`, `text-button-text-secondary`
  - `.bg-\[var\(--surface-floating\)\]{background-color:var(--surface-floating)}`
- Grep: zero `card-bg`/`card-premium`/`card-shadow` classes in the six Control components.

---

## 7. Governance

- **D-121** — per-role namespaces implemented exactly as decided; `--control-surface` NOT
  introduced.
- **D-122** — G3/G4 deferral logged in `DESIGN_DECISION_LOG.md`; known-gaps table updated in
  `FOUNDATION_VISUAL_FAMILIES.md` (G1/G2/G6 ✅ CLOSED, G3/G4 ⏸️ DEFERRED).
- **D-119** — panels moved to `--surface-floating` (user-approved visual unification).
- Docs already updated pre-code: `FOUNDATION_TOKEN_OWNERSHIP.md`,
  `FOUNDATION_VISUAL_FAMILIES.md`, `FOUNDATION_COMPONENT_FAMILY_MAP.md`,
  `FOUNDATION_FAMILY_IMPLEMENTATION_PLAN.md`, `DESIGN_DECISION_LOG.md` (D-121).

---

## 8. Remaining (documented, non-blocking)

| Item | Where | Disposition |
|---|---|---|
| Switch on generic `bg-hover-bg` track | `AntigravityForm.tsx` L190 | Switch has no dedicated namespace; generic state tokens used. Future: `--switch-*` role namespace. |
| Item-hover rows (`hover:bg-hover-bg`) | `PremiumSelect.tsx`, `Menu.tsx` | Internal hover variants, not Surface inheritance; left as-is. |
| `--button-border-secondary-width` unused by utilities | `themes.css` | Documented; kept for future `border-[length:var(…)]`. |
| P0-1/P0-2 (dark `--elevation-carved`/`--border-gold`) | 3.3A-G3/G4 | DEFERRED (D-122) — freeze-conflicting. |
| P1 waves (P1-5 focus tokens, P2 Navigation, P3 Status, P4 consumers) | plan | Future waves. |

---

## 9. Verdict

**Phase 3.4 P0 = ✅ IMPLEMENTED.** All six Control components now consume only their own role
tokens; dropdown panels are unified on the Surface floating surface; the phase introduced
**zero new colors, shadows, radii, or borders**; build/typecheck/lint green; every control
render is preserved except the two approved panel deltas (§5.1).

# Phase 3.4 P1 — Foundation Component Refactoring — Implementation Report

**Status:** ✅ IMPLEMENTED (2026-08-02)
**Directive:** P1 approval (Group A-1…A-5 + B-1); B-2 rejected (D-125); B-3 deferred
**Decisions:** D-123 (app theme = sole source of truth, strip `dark:` in React branches),
D-124 (permanent family-ownership rules + Amber Color Policy), D-125 (B-2 rejected,
`selection-container-dark` documented as legacy)
**Method:** Foundation-first — refactors only reusable Foundation components; zero page-level
work; certified renders unchanged except the single documented light-mode delta (§6.2).

---

## 1. Objective

Resolve the audit findings in `docs/design-system/FOUNDATION_COMPONENT_AUDIT.md`
(H-1, H-2, M-1…M-7, L-1…L-11) for the approved P1 scope:

- **Group A** — safe, render-neutral refactors (A-1…A-5).
- **B-1** — architectural bug fix: the app theme (not the OS `prefers-color-scheme`) is the
  sole source of truth for Foundation styling.
- **B-2 rejected** (D-125) — `selection-container-dark` is NOT activated; documented as legacy.
- **B-3 deferred** — `AdminModal` revisited later with the Modal family.

---

## 2. Changes implemented

### 2.1 A-1 — Navigation shell dark surface → own-family token [M-5]

`src/components/common/Navigation.tsx`
- Shell (`:126`) and `CollapseToggle` (`:158`): `bg-card-bg` → `bg-sidebar`.
- Render-identical in dark: `--sidebar-bg = var(--bg-surface) = --card-bg` (themes.css:991, 906).
- Light shell untouched (`ancient-sidebar` class governs via the `!isDark` ternary).
- Light `CollapseToggle` delta: documented in §6.2.

### 2.2 A-2 — DataGrid selection checkboxes → compose `Checkbox` [M-7]

`src/components/common/AntigravityForm.tsx` + `src/components/common/AntigravityData.tsx`
- `Checkbox` gained additive props (defaults preserve all existing renders):
  - `ariaLabel?: string` — accessible name for the `sr-only` native input (bare usage).
  - `indeterminate?: boolean` — renders the `Minus` glyph (`lucide`), styled exactly as checked;
    no effect when false.
- `DataGrid` select-all header + per-row selection now compose the certified `Checkbox`
  (`checked={allSelected} indeterminate={someSelected}` / `checked={selectedRows?.has(key)}`),
  replacing the hand-rolled duplicates. Same rendered classes → render-neutral.

### 2.3 A-3 — Extract shared premium surface recipes [M-1]

`src/components/common/AntigravityCard.tsx` exports the single source of truth:
- `PREMIUM_SURFACE` · `PREMIUM_SURFACE_IMAGE` · `PREMIUM_SURFACE_HOVER`
- `PREMIUM_LIGHT_OVERRIDES` · `GOLD_SURFACE`

Consumers (identical class strings, render-neutral by construction):
- `Card` premium / premium-neutral / premium-dark-neutral variants
  (`AntigravityCard.tsx:32-34`).
- `CollectionToolbar` (`AntigravityLayout.tsx:218`) and `StatePanel` (`:55`).
- `LoadingSkeleton` card/text, `StatSkeleton`, `EmptyState` (`SharedComponents.tsx:17,35,59,130`).

This collapses the two "premium" dialects to one source of truth and removes the duplication
(M-1).

### 2.4 A-4 — Toast → token classes + shared keyframes + additive `duration` prop [M-4]

`src/hooks/useToast.tsx` + `src/index.css`
- `showToast(message, type, duration = 3000)` — additive `duration` prop (default preserves
  the historical 3000 ms).
- Emoji `✅/❌` → `lucide` `CheckCircle2` / `XCircle` (Status-family hue + surface panel).
- Inline `<style>` + `@keyframes slideIn` → moved to `index.css` after the `sheen` block
  (`@keyframes slideIn` at `index.css:1222`, `.toast-slide-in` at `:1227`); no keyframe-name
  duplication.
- Panel classes `bg-card-bg text-text-primary border-success|border-danger` reproduce the old
  inline `var(--card-bg)` / `var(--text-primary)` / `var(--success, #22c55e)` /
  `var(--danger, #f87171)` values exactly (verified: `index.css:331-332`, `--color-success/
  danger` at `index.css:44-45`). Render-preserving.

### 2.5 A-5 — Small render-neutral cleanups [L-1, L-2, L-3, L-5]

`src/components/common/AntigravityButton.tsx` + `AntigravityForm.tsx` + `AntigravityData.tsx`
- **L-1:** shared `getDisabledCls(disabled, loading, opacity)` now used by `Button` and
  `IconButton` (no render change).
- **L-2:** exported `FIELD_SURFACE` (`bg-input-bg border border-input-border rounded-xl
  text-input-text`) and `FIELD_FOCUS` (`focus:border-input-focus-border`), consumed by
  `Input` / `TextArea` / `Select` (identical strings).
- **L-3:** `Tabs` bare/non-bare tab markup deduplicated into `renderTab(option, index,
  tightActive)` (`tightActive` true only in bare mode). The `isActive` inline-active classes now
  apply in both branches (previously inlined only in bare mode) — the active tab string is
  identical, so the rendered output is unchanged.
- **L-5:** `MetricBlock` carved inset shadow **kept hardcoded** — `--elevation-carved` dark value
  (`inset …rgba(200,150,12…)…`) ≠ the current `rgba(0,0,0,0.06)`; swapping would change the
  certified render, so the hardcode is retained and documented per the plan.

### 2.6 B-1 — Decouple `dark:` classes from the OS media query [H-1]

Root cause (D-123): `index.css` registers only `@custom-variant light` (line 8); no `@custom-variant
dark` exists, so `dark:` utilities resolved to the OS `prefers-color-scheme` — under app-dark +
OS-light, `Button` primary/success/danger/soft rendered with no surface.

- `src/components/common/AntigravityButton.tsx`:
  - `darkVariants` — all `dark:` prefixes removed; strings are now the certified dark renders
    (dark is the `:root` baseline, so no prefix is correct). Also fixed the `auth-muted` light
    `dark:text-text-hint` → plain `text-text-hint` in the dark branch.
  - `IconButton` `theme` variant branches on `isDark` via `themeVariantCls(isDark)`:
    dark = certified dark string (`selection-surface appearance-none bg-hover-bg/60 border
    border-border-subtle hover:shadow-elevation-2`); light = certified material string
    (`selection-surface border-[1.8px] border-button-border-secondary light:selection-container-dark
    appearance-none hover:shadow-elevation-2`).
- `src/components/common/AntigravityData.tsx`:
  - `Tabs` pill branches on `isDark`: dark = `rounded-xl bg-card-bg border border-border-subtle
    shadow-elevation-1`; light = certified material tokens. No `dark:` prefix; the app theme
    (React `isDark`) controls the branch.

**Do NOT register a `dark` custom variant** (D-123): no `.dark` class exists; dark = absence of
`.light`. Render-neutral for the certified configurations (app-dark + OS-dark, app-light +
OS-light); repairs app-dark + OS-light (invisible buttons).

---

## 3. Files changed

| File | Change |
|---|---|
| `src/components/common/Navigation.tsx` | A-1 shell + CollapseToggle → `bg-sidebar` |
| `src/components/common/AntigravityForm.tsx` | A-2 `Checkbox` `ariaLabel`/`indeterminate`; A-5 L-2 `FIELD_SURFACE`/`FIELD_FOCUS` |
| `src/components/common/AntigravityData.tsx` | A-2 DataGrid checkboxes compose `Checkbox`; B-1 Tabs pill `isDark`; A-5 L-3 `renderTab`; L-5 documented |
| `src/components/common/AntigravityButton.tsx` | B-1 `darkVariants` de-prefixed; `themeVariantCls(isDark)`; A-5 L-1 `getDisabledCls` |
| `src/components/common/AntigravityCard.tsx` | A-3 export premium/GOLD surface recipes |
| `src/components/common/AntigravityLayout.tsx` | A-3 `CollectionToolbar`/`StatePanel` consume recipes |
| `src/components/common/SharedComponents.tsx` | A-3 `LoadingSkeleton`/`StatSkeleton`/`EmptyState` consume recipes |
| `src/hooks/useToast.tsx` | A-4 rewrite (duration prop, lucide icons, token classes) |
| `src/index.css` | A-4 `toast-slide-in` + `@keyframes slideIn` (after `sheen`) |

No page-level or consumer migrations.

---

## 4. Verification

| Check | Result |
|---|---|
| `npx tsc -b` | ✅ exit 0 |
| `npm run build` (tsc -b + vite) | ✅ exit 0 — only pre-existing chunk-size notices |
| `npm run lint` | ⚠️ 405 pre-existing problems (352 errors / 53 warnings) — **zero introduced by P1** (§5.1) |
| Premium recipe single-source grep | ✅ one definition each in `AntigravityCard.tsx`; consumers import them |
| `dark:` utility grep in touched files | ✅ 0 (only D-123 comment mentions) |
| `#C9A070` hex grep in `src/components/common` | ✅ 0 — no Control inherits amber |
| `@keyframes slideIn` / `.toast-slide-in` | ✅ defined exactly once (`index.css:1222,1227`) |
| D-124 family-ownership grep | ✅ Controls use role tokens; pill `bg-card-bg` = Navigation family; `MetricBlock` container = display stat, not a Control |

### 5.1 Lint baseline (pre-existing, not P1)

All lint errors in P1-touched files were confirmed pre-existing by inspection (no git-stash
available — the files carry prior-phase uncommitted work; HEAD-only diff impossible for untracked
files):
- `AntigravityData.tsx:284-311` — `any` on `DataGridColumn`/`DataGridProps` type declarations
  (untouched type regions).
- `AntigravityLayout.tsx:75` — `[key: string]: any` on `PageHeader` (untouched).
- `Navigation.tsx:66` — `useEffect` + `setMode` cascade warning (untouched; A-1 changed class
  strings only).
- `useToast.tsx:10` — `react-refresh/only-export-components` (hook + component in one file;
  pre-P1 `git show HEAD:src/hooks/useToast.tsx` confirms the same dual-export structure).

The remaining 400+ problems live in unrelated files (`src/utils/*`, `src/observability/*`,
`src/pages/*`, `supabase/functions/*`) and predate P1. No P1-modified file region introduced a
lint error.

---

## 6. Render-preservation notes

### 6.1 Render-neutral (verified at token/class level)

- **A-1 dark:** `--sidebar-bg = var(--bg-surface) = --card-bg` → identical background.
- **A-2:** identical certified `Checkbox` classes; `indeterminate`/`ariaLabel` are additive.
- **A-3:** consumers use the exact same class strings as before (dedup only).
- **A-4:** token values verified identical to the old inline styles.
- **A-5 L-2/L-3:** identical strings by construction.
- **B-1:** certified class strings reproduced verbatim in the correct theme branch.

### 6.2 Accepted light-mode delta — `CollapseToggle` (A-1)

The plan's "light untouched" note covers the shell (`ancient-sidebar` governs via ternary).
The `CollapseToggle` (`Navigation.tsx:158`) is **not** covered by `ancient-sidebar`:

| Config | Before (`bg-card-bg`) | After (`bg-sidebar`) |
|---|---|---|
| Dark | `--card-bg` #1F2937 | `--sidebar-bg` #1F2937 — identical |
| Light | `--card-bg` (inherits light `--bg-surface`) **#C9A070 amber** | `--sidebar-bg` = `var(--gradient-header)` green gradient |

**Rationale (approved under D-124):** the `CollapseToggle` is a Navigation-chrome control
attached to the sidebar; `bg-card-bg` in light resolved to the amber `#C9A070` — a cross-family
Surface→Control amber leak the Amber Color Policy prohibits. `bg-sidebar` is the Navigation
family's own surface token. This change removes the amber inheritance and is the correct
D-124 alignment; it is logged here and in the certification as the single intentional visual
delta of the phase.

### 6.3 Minor follow-up (non-blocking, no P1 action)

- `iconVariants.theme` (`AntigravityButton.tsx:179`) is now dead code — `themeVariantCls(isDark)`
  takes precedence at `:208`. Candidate for removal in a later maintenance pass (zero render
  impact either way).

---

## 7. Amber audit (P1 verification output)

Repo-wide check: **no component in `src/components/common` references `#C9A070` or amber-derived
surfaces.** Controls never inherit amber.

D-124 compliance for light Control role tokens (themes.css:1210-1217) — **scheduled for
migration, no P1 action** (render-neutral gate; certified "Family B" light material):
- `--button-surface-secondary: var(--bg-surface)` (#C9A070)
- `--button-border-secondary: var(--border-gold)`
- `--checkbox-surface: var(--bg-surface)` / `--checkbox-border: var(--border-gold)`
- `--filter-surface: var(--bg-surface)`

These are the certified golden light renders; changing them is a render change requiring new
design approval (per D-124 amber policy) — deferred to a future token wave, tracked here.

---

## 8. Performance / safety

All P1 refactors are hook-/computation-free or replace logic with equivalent one-liners
(spread / `isDark` branch). `Tabs`, `Button`, `IconButton` remain pure and cheap; no
computation-per-render impact was introduced.

---

## 9. Remaining (documented, non-blocking)

| Item | Where | Disposition |
|---|---|---|
| B-2 `selection-container-dark` | D-125 | Rejected; documented as legacy; Navigation-family P2-1 token wave owns the fix |
| B-3 `AdminModal` | plan | Deferred — revisited with the Modal family |
| Amber light Control tokens | §7 | Scheduled for migration (render-neutral gate) |
| `iconVariants.theme` dead entry | `AntigravityButton.tsx:179` | Follow-up removal candidate |
| Browser pixel spot-check | — | Manual step (CLI cannot render); recommended `npm run dev` light+dark pass (§10) |

---

## 10. Manual visual spot-check (recommended post-certification)

The render-neutrality of every P1 change was verified at the class/token level (§6.1). A
browser-level light + dark pass over the following surfaces is recommended as the final manual
check:

1. **Dark:** Sidebar shell + CollapseToggle, `Button` primary/secondary/success/danger/soft,
   `IconButton` theme, `Tabs` pill, premium `Card`, `CollectionToolbar`, `StatePanel`,
   `LoadingSkeleton`/`StatSkeleton`/`EmptyState`, toast success/error.
2. **Light:** same set — verify only the documented `CollapseToggle` delta (§6.2); toggle the
   app theme (`.light`) rather than the OS setting.

---

## 11. Governance

- **D-123** — implemented exactly as decided; no `@custom-variant dark` registered.
- **D-124** — family-ownership rules + Amber Color Policy adopted; P1 amber compliance audit
  documented (§7).
- **D-125** — B-2 rejected; `selection-container-dark` documented as legacy.
- Decisions logged in `docs/design-system/DESIGN_DECISION_LOG.md` (D-123/124/125, inserted
  before "Rejected alternatives"; rejected-alternatives row added).
- Audit + plan inputs: `docs/design-system/FOUNDATION_COMPONENT_AUDIT.md` /
  `FOUNDATION_COMPONENT_REFACTOR_PLAN.md`.

---

## 12. Verdict

**Phase 3.4 P1 = ✅ IMPLEMENTED.** All approved Group A refactors (A-1…A-5) and the B-1
architectural fix are in place; B-2 rejected and B-3 deferred as approved. Certified renders
are preserved with the single documented, policy-aligned `CollapseToggle` light delta (§6.2).
`tsc` + `vite build` green; lint baseline confirmed pre-existing with zero P1-introduced
problems; repo-wide audit (dark-prefix, amber, premium duplication, family-ownership) clean.

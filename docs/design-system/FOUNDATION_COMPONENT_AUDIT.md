# Foundation Component Audit

**Phase 3.4 P1 — Component Behaviour, Composition & API Audit**
**Date:** 2026-08-02
**Scope:** Every reusable Foundation component across the five families
(P1.1 Surface, P1.2 Control, P1.3 Navigation, P1.4 Status, P1.5 Typography),
plus the Component Composition Audit and the API Audit.
**Rule:** previously certified visual behaviour remains unchanged unless the change
is required by architectural ownership, explicitly approved, and logged in
`DESIGN_DECISION_LOG.md`.

---

## 1. Audit Method

1. Read every Foundation component in `src/components/common/` plus the
   Status/typography consumers (`src/components/admin/common/DifficultyBadge.tsx`,
   `src/hooks/useToast.tsx`).
2. Mapped each component to its family (per `FOUNDATION_COMPONENT_FAMILY_MAP.md`).
3. Verified token ownership against `FOUNDATION_TOKEN_OWNERSHIP.md` rules:
   "a reusable component inherits from its own family only".
4. Verified the theme mechanics (`ThemeContext` toggles a `.light` class on
   `<html>`; `:root` is the dark baseline; `index.css:8` registers
   `@custom-variant light`; **no `@custom-variant dark` is registered**, so any
   `dark:`-prefixed utility resolves to Tailwind's default
   `prefers-color-scheme: dark` media query).
5. Recorded duplication (copy-pasted recipes, parallel components, hand-rolled
   controls) and API overlap (parallel composites, redundant wrappers).

## 2. Theme Mechanics Facts (grounding for all findings)

- Dark is the baseline: `ThemeContext` removes `.light` for dark, adds `.light`
  for light (`src/context/ThemeContext.tsx:18-29`).
- `@custom-variant light (&:where(.light, .light *))` — `index.css:8`.
- There is **no `@custom-variant dark`** anywhere. Therefore every `dark:` class
  in the codebase resolves to `prefers-color-scheme: dark` (OS preference),
  **not** the app theme. See finding **C-1**.
- `selection-surface` = `background: var(--sidebar-bg)` (`index.css:268-270`).
- Light-mode `--sidebar-bg: var(--gradient-header)` = a **dark green gradient**
  `#162B1C → #0A1A10` (`themes.css:777`). Dark-mode `--sidebar-bg: var(--bg-surface)`.
- `--surface-floating: var(--bg-elevated)` (`themes.css:606`).

## 3. Findings

### 3.1 HIGH severity

#### H-1 — `dark:` utilities are gated on the OS, not the app theme
- Evidence: `index.css:8` registers only `@custom-variant light`. Tailwind v4's
  default `dark:` variant is `prefers-color-scheme: dark`.
- Affected:
  - `Button` dark variants are **entirely** `dark:`-prefixed:
    `AntigravityButton.tsx:63` (primary), `:67` (success), `:69` (danger),
    `:71` (soft), `:77` (auth-dark), `:79` (auth-muted), `:81` (auth-violet).
    In app-dark + OS-light these variants have **no surface at all** (no bg, no
    border, no shadow, and `dark:text-white` also fails).
  - `IconButton` theme variant `dark:bg-hover-bg/60 dark:border...`
    (`AntigravityButton.tsx:173`).
  - `Tabs` pill `dark:bg-card-bg dark:border-border-subtle dark:shadow-elevation-1`
    (`AntigravityData.tsx:139`) — has base fallbacks so only partially affected.
- Also: dead-weight CSS — the `dark:`-prefixed classes in `darkVariants` are
  only ever present in dark mode (React branch), so the media query is
  redundant even when it matches.
- Recommended fix: strip `dark:` prefixes in dark-branch class strings (dark is
  the app baseline). Render-neutral under OS-dark (the certified configuration);
  repairs OS-light configurations.
- Status: **approval-gated** (changes renders in the app-dark + OS-light config).

#### H-2 — `light:selection-container-dark` is a dead class; the intended light-mode text reset never applies
- Evidence:
  - `selection-container-dark` is **not** a registered utility (no `@utility`,
    no `--color-*` token). The `light:` variant therefore generates no CSS.
  - Used as `light:selection-container-dark` in `AntigravityLayout.tsx:63`
    (SelectionContainer), `ThemeToggle.tsx:35`, `AntigravityButton.tsx:171`
    (IconButton theme).
  - The reset it was meant to trigger — `.light .selection-container-dark,
    .light .selection-container-dark *` (`index.css:276-282`) — only matches a
    literal `selection-container-dark` class, which **no element carries**.
- Effect: `selection-surface` containers render light-mode `--sidebar-bg` (dark
  green gradient, `themes.css:777`) while text keeps light-mode near-black
  `--text-primary`. The `.light aside` overrides (`index.css:685-760`) cover the
  sidebar only; SelectionContainer lives outside `<aside>`.
- Recommended fix: replace `light:selection-container-dark` with a literal
  `selection-container-dark` class in the three components (the reset CSS then
  applies) — or delete both the dead class and the orphaned rule.
- Status: **approval-gated** (changes light-mode renders of these 3 components).

### 3.2 MEDIUM severity

#### M-1 — Premium surface recipe is copy-pasted across ≥5 components (two dialects)
- `Card` premium dialects:
  - premium-border: `bg-card-bg border-[1.8px] border-card-premium-border
    shadow-card-shadow ... hover:shadow-card-premium` — `CollectionToolbar`
    (`AntigravityLayout.tsx:217`).
  - gold-border: `stat-card-surface border border-border-gold shadow-premium-card`
    (or `shadow-premium-carved`) — `LoadingSkeleton` (`SharedComponents.tsx:16,34`),
    `StatSkeleton` (`:58`), `EmptyState` (`:129`), `StatePanel`
    (`AntigravityLayout.tsx:54`).
- Two copy-pasted surface languages exist for the same "premium/gold panel"
  concept. Recommend exporting the recipes from `AntigravityCard.tsx` (or a
  shared surface primitive) and having consumers compose `Card`.
- Render-neutral if the shared recipes preserve exact strings.
- Status: **safe refactor** (render-neutral, verified output-identical).

#### M-2 — `PremiumSelect` re-implements Menu's interaction model
- `Menu` is the single frozen dropdown owner (DS-008A). `CollectionFilter`
  composes `Menu` correctly (`CollectionFilter.tsx:50-93`).
- `PremiumSelect` duplicates the whole popover state machine: open/close,
  outside-click, Escape, ArrowUp/Down/Home/End, highlightedIndex, focus return,
  maxVisible scroll (`PremiumSelect.tsx`).
- Consolidation options:
  1. Rebuild `PremiumSelect` on `Menu` (touches two frozen components; high risk).
  2. Extract Menu's popover state machine into a shared `usePopover` hook that
     both Menu and PremiumSelect consume (also touches Menu; high risk).
  3. **Defer** — document the duplication; revisit in a later phase with
     dedicated visual regression coverage.
- Status: **defer** (recommended). No change in P1.

#### M-3 — `AdminModal` panel still uses `bg-card-bg` + `shadow-2xl`, not floating tokens
- Evidence: `AdminModal.tsx:82` `bg-card-bg ... border-border-subtle shadow-2xl`.
- Family map target: Modal → `--surface-floating` + `--modal-shadow`
  (`FOUNDATION_COMPONENT_FAMILY_MAP.md` §1).
- In dark, `--bg-card-bg` = `#1F2937` vs `--surface-floating` = `--bg-elevated`
  (lighter) → a visible (small) dark-mode panel change. Light mode is covered by
  the `ancient-overlay` class, so likely unchanged.
- Status: **approval-gated** (dark-mode render change).

#### M-4 — Toast uses inline styles, raw fallback hex, emoji icons, and an inline `<style>` keyframe
- Evidence: `src/hooks/useToast.tsx:45-69` — `style={{ background:
  'var(--card-bg, #1f2937)', color: 'var(--text-primary, #fff)', borderColor:
  'var(--success, #22c55e)' ... }}`; `<style>{@keyframes slideIn{...}}</style>`;
  emoji icons `✅`/`❌`.
- Violates "no raw hex", "semantic token ownership" (Status family: Surface panel
  + Status hues per family map §4), and duplicates animation logic that belongs
  in `index.css`.
- Recommended: convert to token classes, move `slideIn` to `index.css`, replace
  emoji with lucide icons, add a `duration` prop (additive API).
- Render-preserving if the current values are preserved.
- Status: **safe refactor** (render-preserving) with an additive API option.

#### M-5 — Cross-family inheritance in Navigation components (dark shell)
- Evidence: `Navigation.tsx:126` `bg-card-bg border-r border-border-subtle`;
  `Navigation.tsx:158` `bg-card-bg`.
- `--color-sidebar` token already exists (`index.css:235` =
  `var(--sidebar-bg)`), and dark `--sidebar-bg = var(--bg-surface) = --card-bg`.
  Swapping `bg-card-bg` → `bg-sidebar` is **render-identical** in dark and is a
  correct own-family token.
- Status: **safe refactor** (render-neutral).

#### M-6 — `SelectionContainer` inherits Surface tokens cross-family
- Evidence: `AntigravityLayout.tsx:63` `border-[1.8px] border-card-premium-border
  shadow-card-premium` in a Navigation-family component.
- D-121 repository rule: own-family inheritance only. The scheduled fix
  (`--selection-*`, `--nav-indicator`) is P2-1 in
  `FOUNDATION_FAMILY_IMPLEMENTATION_PLAN.md`.
- Status: **defer to P2** (documented here).

#### M-7 — `DataGrid` hand-rolls checkboxes instead of composing `Checkbox`
- Evidence: `AntigravityData.tsx:400-416` (select-all) and `:455-469` (row
  select) duplicate the Checkbox visual language (`w-5 h-5 rounded-md border-2
  bg-primary border-primary text-white`...).
- `SelectionCheckbox` (wraps `Checkbox`) exists as the Foundation control.
- Recommended: replace the hand-rolled buttons with `Checkbox`/`SelectionCheckbox`.
- Render-neutral (same classes).
- Status: **safe refactor**.

### 3.3 LOW / API

- **L-1** `Button`/`IconButton` duplicate loading-spinner + disabled machinery
  (`AntigravityButton.tsx:96,109,192-194,209-213`). Optional shared
  `ButtonBase`/hook. Render-neutral.
- **L-2** `Input`/`TextArea`/`Select` duplicate the field-surface string. Extract
  a shared constant. Render-neutral.
- **L-3** `Tabs` bare/non-bare branches duplicate the tab-button markup
  (`AntigravityData.tsx:78-113` vs `:116-151`). Extract a `renderTab` closure.
  Render-neutral. (Also: Tabs mixes React `isDark` branching with `light:`/
  `dark:` variants — see H-1.)
- **L-4** `Card` `premium-neutral` and `premium-dark-neutral` produce identical
  class strings (already recorded in D-122). Keep as separate variants; note only.
- **L-5** `MetricBlock` carved container hardcodes
  `shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]` (`AntigravityData.tsx:281`)
  instead of the `--elevation-carved` token. Render-neutral swap pending value
  comparison.
- **L-6** Parallel heading composites: `PageHeader`
  (`AntigravityLayout.tsx:68`), `SectionHeader` (`:178`), `AdminPageTitle`
  (`AntigravityData.tsx:164`) each implement icon+title+subtitle+actions. Document
  roles; optionally share one primitive (additive).
- **L-7** Redundant wrappers/aliases kept for consumers: `FilterBar`
  (`AntigravityLayout.tsx:223`), `FilterSelect` (`:241`), `PrimaryButton`
  (`AntigravityButton.tsx:135`). No change; mark deprecated.
- **L-8** `Display` vs `H1` both render `<h1>` (`AntigravityTypography.tsx`).
  Document roles (Display = hero/landing, H1 = page title); no structural change.
- **L-9** `AdminIconWrap` vs `IconBadge` — two icon-badge concepts
  (`AdminIconWrap.tsx`, `IconBadge.tsx`). Document roles.
- **L-10** `Switch` track uses generic `bg-hover-bg`/`bg-primary`; no
  `--switch-*` namespace. Optional P2 token re-anchor (render-neutral).
- **L-11** `Toast` auto-dismiss duration hardcoded `3000` (`useToast.tsx:19`).
  Add `duration` prop (additive).

### 3.4 Out of scope (recorded only)

- `NavButton` is a page-level Exam component (`src/components/exam/
  QuestionNavigator.tsx:19`), not a Foundation component. It wraps `Button` with
  variant names `primary`/`secondary`/`danger` — a consumer; no Foundation action.
- Navigation tooltip uses raw `bg-slate-900` (`Navigation.tsx:211,219`) — known
  Phase 2B documented debt; not Foundation-owned.

## 4. Composition Audit — already-correct patterns (verify as golden)

| Component | Composes | Verdict |
|-----------|----------|---------|
| CollectionCard | `Card` + `Caption` + `LoadingSkeleton` | correct |
| CollectionFilter | `Menu` compound | correct |
| DifficultyBadge | `Badge` | correct (thin wrapper, not a duplicate) |
| MetricBlock | `Label` | correct |
| ConfirmModal | `AdminModal` + `Button` | correct |
| ErrorState / EmptyState | `Button` | correct |
| AdminPageTitle | `IconBadge` | correct |

## 5. Severity Summary

| ID | Severity | Render change? | Decision |
|----|----------|----------------|----------|
| H-1 | HIGH | app-dark + OS-light | approval-gated fix |
| H-2 | HIGH | light mode (3 components) | approval-gated fix |
| M-1 | MED | no (if strings preserved) | safe refactor |
| M-2 | MED | n/a | defer |
| M-3 | MED | dark mode (modal panel) | approval-gated |
| M-4 | MED | no (if values preserved) | safe refactor |
| M-5 | MED | no (render-identical) | safe refactor |
| M-6 | MED | n/a | defer to P2 |
| M-7 | MED | no (same classes) | safe refactor |
| L-1…L-11 | LOW | no | safe refactor / optional |

See `FOUNDATION_COMPONENT_REFACTOR_PLAN.md` for the grouped execution plan and
the approval gate on H-1, H-2, M-3.

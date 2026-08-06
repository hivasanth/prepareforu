# Phase 3.4 P2 — Consolidated Implementation Plan

**Date:** 2026-08-02
**Inputs:** `FOUNDATION_NAVIGATION_AUDIT.md`, `FOUNDATION_STATUS_AUDIT.md`,
`FOUNDATION_TYPOGRAPHY_AUDIT.md`, `FOUNDATION_MOTION_AUDIT.md`,
`FOUNDATION_OVERLAY_AUDIT.md`, `FOUNDATION_CROSS_FAMILY_AUDIT.md`.
**Rule:** render-neutral work proceeds on approval of this plan; **render-affecting**
items are individually flagged (⛔) and require explicit approval + a
`DESIGN_DECISION_LOG.md` entry before code. No consumer/page migration begins
(that is Phase 3.5).

## A. Wave 1 — Navigation

### A1. Token completion (render-neutral)
- Add `--nav-hover`, `--nav-active`, `--nav-shadow`, `--nav-focus` to the alias
  block (`themes.css:631-642`) with values identical to the certified resolved
  values (hover = `--nav-bg-hover`/`--nav-text-hover`, active =
  `--nav-bg-active`/`--nav-text-active`, shadow = `--elevation-1`, focus =
  `--focus-ring-*`/`--border-accent` as certified).
- Delete duplicate `--surface-nav` (`themes.css:814`).
- Unify `nav-active-surface` to a single recipe (`index.css:1094` values);
  delete the `.light`-scoped duplicate (`index.css:698`) after verifying values
  match the certified light render.

### A2. Ownership repair (render-neutral where values are preserved)
- `Tabs` (X-1): add Navigation-owned `--nav-tab-pill-*`/`--nav-tab-track-*` aliases
  with the certified `--material-tab-*` values; switch `AntigravityData.tsx:78-79,124`.
- `SelectionContainer` (X-2/N-4/M-6, P2-1 scheduled): add `--nav-selection-surface`
  + `--nav-selection-shadow` (shadow resolves in **both** themes); switch
  `AntigravityLayout.tsx:64`; remove the dead `light:selection-container-dark` class.
  ⛔ (dark shadow is currently undefined — renders change in dark).
- Amber chain (N-9): decouple `--bg-nav` from `--bg-surface` for light; map light
  nav surface to a `--bg-elevated`-derived value. ⛔ (light sidebar surface colour
  changes).

### A3. Sidebar single-sourcing (retire page-level overrides)
- Retire the `.light aside … !important` block (`index.css:698-723`) and
  `ancient-sidebar`/`ancient-nav-item-active` classes by moving their certified
  values into the nav tokens and component classes.
  ⛔ (highest-risk item; light sidebar/nav-item renders must be preserved exactly).
- Merge `Navigation.tsx` + `SidebarLayout.tsx` sidebar shells behind one composite
  (D-1). Render-neutral.
- `ThemeToggle`/`IconButton theme` `light:selection-container-dark` dead class
  removed (N-4). Render-neutral.
- N-7: `--shadow-inset-1` token; `AntigravityData.tsx:256` consumes it. Render-neutral.

## B. Wave 2 — Status

- S-1 (X-4/V-1): `TagBadge` → thin tag→variant mapper over `Badge`; raw palette +
  `dark:` classes removed. ⛔ (tag chip colours change to status tokens).
- S-2: Toast type→material map (`success`/`error` certified unchanged; `warning`
  repaired). Render-neutral for certified branches.
- S-3 (X-6): unify status surface recipe (`Badge` `/15`→`/10`, border `/30`→`/20`).
  ⛔ (Badge surface alpha changes).
- S-4 (V-2): strip dead `dark:text-text-muted` (`ExamSubComponents.tsx:24`).
  Render-neutral.
- S-5: reconcile `--color-info` light value (green→blue) or document; no consumer.
  Render-neutral.

## C. Wave 3 — Typography

- T-1 (H-1): `--brand-text-gradient` token (values `#f5e0be`→`#b88c3a`); `BrandTitle`
  consumes it. Render-neutral.
- T-3/D-2: single Typography composite; `AdminText` becomes thin wrapper.
  Render-neutral.
- T-2: reusable-component raw sizes (`text-[10px]` etc., ~102 in common) → semantic
  roles where pixel-identical. ⛔ (individual render risk; done component-by-component
  with pixel-diff).
- T-6: `AdminModal`/`AntigravityLayout` raw headings → primitives (render-identical
  only). Render-neutral.
- T-4: `spacing` export verified/removed. Render-neutral.

## D. Wave 4 — Motion

- M-3: shared `TAB_SPRING` preset (Tabs/SegmentedFilter/ThemeToggle). Render-neutral.
- M-4: duration/easing preset table (FAST/STANDARD/SLOW) with current exact values.
  Render-neutral.
- M-5/M-7: motion primitives + skeleton language owned by Motion family; unify
  `.animate-in`, sheen, toast keyframes and skeleton presets. Render-neutral.
- M-1: reusable components (`AdminModal`, `DiagramRenderer`, `QuestionVisualizer`,
  `BulkActionBar`, skeletons) drop dead `fade-in`/`slide-in-from-*`/`zoom-in-*`/
  `shake` classes; page-level sites swept in Wave 5/3.5.
  ⛔ (composed entrance animations actually appear where they were silent).
- M-2: IconButton gains Button's `whileTap 0.98` + `duration 0.2` transition.
  ⛔ (press feedback changes).
- M-6: `darkClassName` prop remnant cleaned. Render-neutral.

## E. Wave 5 — Overlay

- O-2/O-3: `--z-*` layer scale (dropdown/sticky/modal/toast/max) + consumption in all
  overlay components. Render-neutral (values unchanged).
- O-4/D-5: `PremiumSelect` → `Menu`; shared `Tooltip` primitive. Render-neutral.
- O-5: overlay surface recipe owned by Overlay family (document; optionally expose
  utility). Render-neutral.
- O-1/X-3/D-4: unify modal recipe (`AdminModal`/`SuccessModal` → `--surface-floating`
  + `--elevation-4`/modal token + framer scale/fade).
  ⛔ (modal surface/radius/animation changes).

## F. Amber backlog (newly documented — see cross-family audit §6.2)
- P-2: `.light .ancient-card` (`index.css:1134-1144`) → `--card-parchment`/
  `--card-border-gold` tokens; raw hex removed. Render-neutral.
- N-9 light nav surface decouple (in A2 above).

## G. Execution order & gates
1. Approve plan (this document). ⛔ items require per-item approval → logged D-12x.
2. Implement in order A → B → C → D → E (render-neutral first, then ⛔ within each wave).
3. After each wave: repo-wide verification (no cross-family leak, no `#C9A070` as
   default, no `dark:` classes, no dead animation classes, no duplicated systems).
4. Verify: `npx tsc -b`, `npm run build`, `npm run lint` (baseline 405 problems
   unchanged); render-diff spot-check in both themes.
5. Deliverables: `PHASE_3_4_P2_IMPLEMENTATION_REPORT.md`,
   `PHASE_3_4_P2_CERTIFICATION.md`; update `FOUNDATION_FREEZE_REGISTER.md`,
   `DESIGN_DECISION_LOG.md`, `PHASE_3_1_EXECUTION_LOG.md`.
6. Then Phase 3.5 (consumer migration) may begin — P2 success criteria cleared by
   this plan (§7 of the cross-family audit).

# Foundation Overlay Audit

**Phase 3.4 P2 — Wave 5 (Overlay Family)**
**Date:** 2026-08-02
**Scope:** Every floating layer — dropdown/menu, modal, popover/tooltip, notification
panel, toast — plus the z-index scale and the overlay surface tokens
(`--surface-floating`, `--elevation-4`, `--dropdown-*`).
Cross-checked against `FOUNDATION_TOKEN_OWNERSHIP.md` (Overlay owns floating
surfaces, elevation for floating layers, and the z-index layer scale).
**Rule:** previously certified visual behaviour remains unchanged unless the change
is required by architectural ownership, explicitly approved, and logged in
`DESIGN_DECISION_LOG.md`.

---

## 1. Audit Method

1. Read every overlay component: `Menu.tsx`, `AdminModal.tsx`, `SuccessModal.tsx`,
   `PremiumSelect.tsx`, `CollectionFilter.tsx` (Menu consumer), `NotificationPanel.tsx`,
   `Tooltip.tsx`/`TopicInfoButton.tsx` tooltip, toast (`useToast.tsx`),
   `LoadingOverlay.tsx`, `SidebarLayout.tsx`.
2. Built the complete z-index inventory and checked tokenization against
   `--dropdown-z` and any `--z-*`/`--layer-*` tokens.
3. Verified overlay surface language is single-sourced
   (`--surface-floating`, `--elevation-4`, `ancient-overlay`) and theme-consistent.

## 2. Overlay Surface Token Inventory

- `--surface-floating: var(--bg-elevated)` (`themes.css:606`).
- Material Family D overlay recipe: `.light .ancient-overlay` =
  `--surface-floating` + `--border-subtle` + `--elevation-4` (`index.css:972-977`);
  `.light .ancient-tooltip` same recipe + radius 10px (`:978-983`).
- `--dropdown-*` set (`themes.css:973-980`): `--dropdown-bg/shadow/radius/offset/z`.
- **Absent:** `--modal-*`, `--shadow-modal`, `--tooltip-*`, `--z-*` layer scale.

## 3. Findings

### 3.1 HIGH

#### O-1 — Two overlay systems: `Menu` (certified) vs `AdminModal`
- `Menu` (`Menu.tsx:275`): `--surface-floating` + `border-border-subtle` +
  `shadow-elevation-4` + `rounded-2xl` + framer presets (0.18s `easeOut`) — the
  certified Overlay surface.
- `AdminModal` (`AdminModal.tsx:82`): `bg-card-bg` + `shadow-2xl` + `rounded-[2.5rem]`
  + `animate-in zoom-in-95 duration-300` (dead classes, see M-1) + `ancient-overlay`.
  No framer presets.
- Impact: modal and menu use different surface, elevation, radius and animation
  languages; `AdminModal`'s dark surface is `--card-bg` while light renders
  `--surface-floating` (`.light .ancient-overlay` overrides `bg-card-bg` by
  specificity) — a **theme-inconsistent overlay surface**.
- Fix direction (Wave 5): one Overlay modal recipe (surface = `--surface-floating`,
  elevation = `--elevation-4`/`--modal-shadow`, radius token, framer
  scale/fade preset); `AdminModal`/`SuccessModal` migrate onto it.
- Status: **approval-gated** (changes certified modal renders).

#### O-2 — z-index scale is not tokenized
- Inventory: `z-10` (LoadingOverlay, form icons), `z-20` (sticky table headers,
  DiagramRenderer), `z-30` (AdminModal footer), `z-40` (Navigation rail),
  `z-50` (Menu default, AdminModal, TopicInfoButton tooltip), `z-[70]` (SidebarLayout),
  `z-[100]` (BulkActionBar), `z-[200]` (Navigation dropdown, NotificationPanel),
  `z-[1000]` (PremiumSelect list), `z-[99999]` (toast).
- `--dropdown-z: 50` exists (`themes.css:980`) but no component consumes it —
  `Menu.tsx:68` defaults to the literal `'z-50'`.
- Fix direction (Wave 5): add a `--z-*` layer scale (dropdown/sticky/modal/toast/max)
  and consume via `z-[var(--…)]` in every overlay component. Render-neutral
  (values unchanged). Status: plan (tokenization; no render change).

### 3.2 MEDIUM

#### O-3 — `Menu` default zIndex does not read `--dropdown-z`
- `Menu.tsx:68` `zIndex = 'z-50'`; token `--dropdown-z: 50` unused. Switch default to
  `z-[var(--dropdown-z)]` (render-neutral). Status: plan.

#### O-4 — Parallel dropdown/tooltip implementations
- `PremiumSelect.tsx:211-214` re-implements an absolutely-positioned list
  (`z-[1000]` + `shadow-elevation-4`) instead of composing `Menu`.
- `TopicInfoButton.tsx:82` hand-rolls a tooltip (`z-50`) instead of
  `Tooltip`/`ancient-tooltip` material.
- Fix direction (Wave 5): PremiumSelect → Menu; TopicInfoButton → shared Tooltip
  primitive. Status: plan (no render change).

#### O-5 — `ancient-overlay`/`ancient-tooltip` live in global `index.css`, `.light`-only
- The Material Family D recipe is global CSS, not owned by the Overlay family
  module. Dark-mode floating surfaces rely on ad-hoc component classes.
- Fix direction (Wave 5): expose the overlay surface recipe as a tokenized
  `OverlaySurface`/utility owned by the family; document the `.light` refinement.
  Status: plan.

### 3.3 LOW

#### O-6 — SuccessModal/LoadingOverlay share the modal surface
- `SuccessModal` uses `IconBadge` success material; `LoadingOverlay.tsx:18`
  uses `bg-card-bg/40 backdrop-blur-[2px] z-10`. Both are overlay-adjacent;
  route their surfaces through the Overlay recipe. Status: plan.

## 4. Amber Verification (Overlay family)
- `ancient-overlay`/`ancient-tooltip` are token-backed
  (`--surface-floating`/`--border-subtle`/`--elevation-4`) — no `#C9A070`. ✅ Clean.

## 5. Wave 5 Close-out Checklist
- [ ] O-1: unified modal/popover surface recipe; `AdminModal`/`SuccessModal` migrate.
- [ ] O-2/O-3: `--z-*` layer scale + consumption (render-neutral).
- [ ] O-4: PremiumSelect → Menu; Tooltip primitive shared.
- [ ] O-5: Overlay surface recipe owned by the family.
- [ ] Repo-wide re-check: every floating layer uses the Overlay surface/z tokens;
  no component hardcodes `z-[…]` or a second floating-surface recipe.

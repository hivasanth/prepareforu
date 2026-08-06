# Foundation Component Refactor Plan

**Phase 3.4 P1 — Proposed refactors, gated on approval**
**Input:** `FOUNDATION_COMPONENT_AUDIT.md`
**Date:** 2026-08-02
**Rule:** any refactor that changes a previously certified render requires
explicit approval and a `DESIGN_DECISION_LOG.md` entry (D-120 mechanism).

---

## Group A — Safe refactors (render-neutral, recommended to execute in P1)

These produce byte-identical rendered output in both themes; verification is
`npx tsc -b`, `npm run build`, `npm run lint`, then a light+dark spot check.

### A-1. Navigation shell dark surface → own-family token  [M-5]
- `Navigation.tsx:126` `bg-card-bg` → `bg-sidebar`; `:158` (CollapseToggle) same.
- Render-identical in dark (`--sidebar-bg = var(--bg-surface) = --card-bg`);
  light mode is untouched (`ancient-sidebar` class governs).

### A-2. DataGrid selection checkboxes → compose `Checkbox`  [M-7]
- Replace the hand-rolled select-all / row-select buttons
  (`AntigravityData.tsx:400-416, 455-469`) with `Checkbox`/`SelectionCheckbox`.
- Same classes → render-identical.

### A-3. Extract shared premium surface recipes  [M-1]
- Export `premiumSurface` / `goldSurface` (or `PremiumSurface` primitive) from
  `AntigravityCard.tsx`; consume in `CollectionToolbar`
  (`AntigravityLayout.tsx:217`), `LoadingSkeleton`, `StatSkeleton`, `EmptyState`
  (`SharedComponents.tsx:16,34,58,129`), `StatePanel` (`AntigravityLayout.tsx:54`).
- Strictly preserve the exact class strings. No visual change. (This also
  collapses the two "premium" dialects to one source of truth.)

### A-4. Toast → token classes + shared keyframes + additive `duration` prop  [M-4]
- `src/hooks/useToast.tsx:37-69`: inline styles → Surface panel token classes +
  Status colour classes; move `@keyframes slideIn` into `index.css`; replace
  `✅/❌` emoji with lucide icons; keep default 3000ms, add optional `duration`.
- Render-preserving (values identical).

### A-5. Small render-neutral cleanups  [L-1, L-2, L-3, L-5]
- L-1 `Button`/`IconButton`: shared loading/disabled helper (no render change).
- L-2 Input/TextArea/Select: shared field-surface constant.
- L-3 `Tabs`: extract `renderTab` to remove bare/non-bare duplication.
- L-5 `MetricBlock` carved inset shadow → `--elevation-carved` token (verify the
  token value matches the current rgba; otherwise keep the hardcode and log it).

## Group B — Approval-gated (render changes; require sign-off)

### B-1. Decouple `dark:` classes from the OS media query  [H-1]
- Register the app theme as the dark source of truth. Two options:
  - **B-1a (recommended):** strip `dark:` prefixes in dark-branch strings
    (`AntigravityButton.tsx:63-83`, `:173`; `AntigravityData.tsx:139`). Dark is
    the `:root` baseline, so no prefix is correct. Render-neutral under OS-dark
    (certified); **repairs** app-dark + OS-light (currently invisible buttons).
  - B-1b: add `@custom-variant dark (&:where(.dark, .dark *))` and a `.dark`
    class — requires DOM/context changes and touches ThemeToggle; larger blast
    radius. Not recommended for P1.
- Render delta: only in the app-dark + OS-light configuration.
- **Logs as D-123.**

### B-2. Activate the `selection-container-dark` light text reset  [H-2]
- Replace `light:selection-container-dark` with a literal `selection-container-dark`
  class in `AntigravityLayout.tsx:63`, `ThemeToggle.tsx:35`,
  `AntigravityButton.tsx:171` (or delete the dead class + orphaned rule at
  `index.css:276-282` — the deletion preserves current renders).
- Activating changes light-mode renders of those 3 components (readable text on
  the dark-green gradient).
- **Logs as D-124.**

### B-3. `AdminModal` panel → floating surface token  [M-3]
- `AdminModal.tsx:82`: `bg-card-bg` → `bg-surface-floating` (and `shadow-2xl` →
  `shadow-modal` if the token exists / else keep), per family map §1.
- Dark-mode panel shifts to `--bg-elevated`. Light unchanged (`ancient-overlay`).
- **Logs as D-125.**

## Group C — Deferred (documented; no P1 action)

- **C-1 [M-2]** `PremiumSelect` vs `Menu` interaction-model duplication — deferred
  to a later phase with visual regression coverage. Both frozen (DS-008A).
- **C-2 [M-6]** `SelectionContainer` Surface-token inheritance → P2-1 token wave
  (`--selection-*`, `--nav-indicator`).
- **C-3 [L-4/L-6..L-11]** `premium-neutral`/`premium-dark-neutral` duplicate
  (D-122 already records); parallel heading composites; redundant wrappers;
  `Display` vs `H1`; `AdminIconWrap` vs `IconBadge`; `Switch` `--switch-*`
  namespace. All additive/API-documentation only.
- **C-4** Page-level `NavButton` (exam) — not a Foundation component.

## Verification per group

After each approved group:
1. `npx tsc -b`
2. `npm run build`
3. `npm run lint`
4. Visual verification in light + dark for the affected components.

Group A is batch-executed family-by-family (A-1→Navigation, A-2/A-5(L-1..L-3,L-5)→
Control, A-3→Surface, A-4→Status). Group B is executed only after explicit
approval of each B-* item; each gets its own `DESIGN_DECISION_LOG.md` entry.

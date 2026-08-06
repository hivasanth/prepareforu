# Phase 3.4 P0 — Control Family Per-Role Semantic Tokens — Certification

**Status:** ✅ **CERTIFIED** (2026-08-02)
**Gate:** D-120 identical-render (per-role) · D-121 per-role namespaces · D-119 panels =
Surface floating · D-122 G3/G4 deferral
**Verification:** `tsc` exit 0 · `vite build` exit 0 · ESLint 0 problems · CSS output audited

---

## Criterion → Result

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Control components consume ONLY their role tokens | ✅ PASS | `AntigravityButton` (`--button-*`), `AntigravityForm` Input/Select/TextArea (`--input-*`), Checkbox (`--checkbox-*`), Radio (`--radio-*`), `PremiumSelect` trigger (`--input-*`), `CollectionFilter` trigger (`--filter-*`) |
| 2 | Zero `--card-*` inheritance remains in Controls | ✅ PASS | grep over the 6 files: no `card-bg`/`card-premium`/`card-shadow` classes. Only internal hover variants (`hover:bg-hover-bg`) remain, documented. |
| 3 | `--control-surface` NOT introduced | ✅ PASS | D-121 superseded it; per-role namespaces used instead. |
| 4 | No new colors/shadows/radii/borders | ✅ PASS | every value re-anchors existing primitives (`--bg-hover`, `--bg-surface`, `--border-subtle`, `--border-gold`, `--color-accent`, `--elevation-*`, `--card-3d-shadow`). |
| 5 | Dropdown panels = Surface floating surface | ✅ PASS | `Menu.tsx` + `PremiumSelect.tsx` panels → `bg-[var(--surface-floating)]` (D-119). Two accepted deltas documented (§5.1). |
| 6 | Dropdown triggers = Control tokens | ✅ PASS | `PremiumSelect` active/idle → `--input-*`; `CollectionFilter` → `--filter-*` (D-118). |
| 7 | Input component-token re-anchor render-neutral | ✅ PASS | `--input-bg`/`--input-border` had ZERO consumers before; re-anchor cannot change renders. |
| 8 | `.light` certified renders preserved | ✅ PASS | `.light` overrides restore #C9A070 Secondary fill, #A87828 1.8px gold border, carved shadows — matching 3.2.3 certified renders. |
| 9 | Dark certified renders preserved | ✅ PASS | dark role values re-anchor the existing dark renders; G3/G4 NOT added (D-122) so frozen Card/Tabs dark states untouched. |
| 10 | Tailwind utilities compile | ✅ PASS | emitted CSS contains `bg-button-surface-secondary`, `bg-input-bg`, `bg-filter-surface`, `shadow-filter`, `bg-checkbox-surface`, `bg-radio-surface`, `bg-radio-track-surface`, `.bg-\[var\(--surface-floating\)\]{background-color:var(--surface-floating)}`. |
| 11 | Build + typecheck + lint | ✅ PASS | `npx tsc -b` exit 0; `npm run build` exit 0; ESLint (6 components) 0 problems. |
| 12 | Docs updated pre-code | ✅ PASS | `FOUNDATION_TOKEN_OWNERSHIP.md`, `FOUNDATION_VISUAL_FAMILIES.md`, `FOUNDATION_COMPONENT_FAMILY_MAP.md`, `FOUNDATION_FAMILY_IMPLEMENTATION_PLAN.md`, `DESIGN_DECISION_LOG.md` (D-121). D-122 + gaps table updated post-decision. |

---

## Accepted deviations (approved, non-blocking)

1. **Dropdown panel unification** — all panels now `--surface-floating`; Menu/PremiumSelect
   dark panel #1F2937→#374151, PremiumSelect light panel #C9A070→light `--bg-elevated`.
   Explicitly approved by the user (Surface-family ownership rule for panels).
2. **Button Secondary border width theme-branch** — light `border-[1.8px]` (fixed), dark
   `border` 1px — preserves each theme's certified render. `--button-border-secondary-width`
   documented, unused by utilities.
3. **G3/G4 deferral (D-122)** — dark `--elevation-carved`/`--border-gold` NOT added;
   freeze-conflicting.

---

## Certification verdict

**Phase 3.4 P0 = ✅ CERTIFIED.**

- Root defect (Controls inheriting `--card-*` / Surface material — P-001/P-002/P-003) closed.
- Every Control owns its role namespace; one family, multiple roles (D-121).
- Dropdown panels unify under the Surface floating surface (D-119).
- Identical-render gate holds per-role for all controls except the two approved panel deltas.
- Frozen Card/Tabs dark renders untouched (D-122).
- Build / typecheck / lint / CSS-output all green.

**Approval gate:** P1 waves (per-role focus tokens, Navigation/Status families, consumer
migration) may begin when the user approves.

---

- Implementation report: `docs/certification/PHASE_3_4_P0_IMPLEMENTATION_REPORT.md`
- Decisions: `DESIGN_DECISION_LOG.md` (D-118 … D-122)
- Ownership: `FOUNDATION_TOKEN_OWNERSHIP.md` · `FOUNDATION_VISUAL_FAMILIES.md` ·
  `FOUNDATION_COMPONENT_FAMILY_MAP.md` · `FOUNDATION_FAMILY_IMPLEMENTATION_PLAN.md`

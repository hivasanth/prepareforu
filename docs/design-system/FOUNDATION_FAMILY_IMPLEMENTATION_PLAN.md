# Foundation Family Implementation Plan

**Phase 3.3A — Read-Only. This plan is a Phase 3.4 preview; NO implementation here.**
Consolidates `SURFACE_IMPLEMENTATION_PLAN.md` (P0-1…P0-8, P1-1…P1-9, P2-1…P2-10,
P3-1…P3-7) into family-first waves. Every wave is gated: zero visual regressions,
zero new colors.

**Phase 3.4 update (D-121):** the Control family uses **per-role semantic token
namespaces** (`--button-*`, `--input-*`, `--filter-*`, `--checkbox-*`, `--radio-*`)
instead of a single `--control-surface`. Wave P0/P1 below are re-stated for the
per-role architecture.

---

## Wave P0 — Surface Family cleanup (foundation first)

Gate: `--bg-surface` no longer inherited by any Control.

| # | Action | Gaps |
|---|--------|------|
| P0-1 | Add dark value for `--elevation-carved` (light-only today) | 3.3A-G3 — ⏸️ **DEFERRED (D-122)**: dark `:root` references it (frozen `Card` premium shadow); adding a value would alter frozen dark renders (DS-001) |
| P0-2 | Add dark value for `--border-gold` (light-only today) | 3.3A-G4 — ⏸️ **DEFERRED (D-122)**: dark `:root` references it (frozen `Tabs` tokens); adding a value would alter frozen dark renders (DS-011) |
| P0-3 | Verify `--surface-floating` dark/light parity for panels | 3.3A-G6 |
| P0-4 | Re-scope generic `--bg-surface` consumers to family tokens | P-001 |
| P0-5 | Introduce per-role Control token namespaces (`--button-*`, `--input-*`, `--filter-*`, `--checkbox-*`, `--radio-*`) re-anchoring `--bg-hover-bg`/`--border-subtle` | P-002, D-121 |

## Wave P1 — Control family (remove Surface inheritance)

Gate: no Control component uses `--card-*` / `--material-card-premium-*` tokens.

| # | Action | Fixes |
|---|--------|-------|
| P1-1 | Button Secondary → `--button-*` (surface-secondary, border, shadow, hover) | M-1 |
| P1-2 | CollectionFilter trigger → `--filter-*` (surface, border, active, hover); stays Control (Filter role), not Navigation | M-2, D-118, D-121 |
| P1-3 | Menu panel `bg-card-bg` → `--surface-floating` | M-3, D-119 |
| P1-4 | PremiumSelect panel → `--surface-floating`; trigger → `--input-*` (Input role) | M-3, M-4 |
| P1-5 | Introduce per-role focus tokens re-anchoring `--border-subtle`/accent | P-003, D-121 |
| P1-6 | Verify `--dropdown-*` trigger vs panel ownership split | — |
| P1-7 | Checkbox → `--checkbox-*`; Radio → `--radio-*` (own surface/border/selected) | D-121 |

## Wave P2 — Navigation family

Gate: selection/active states never use Surface card borders.

| # | Action | Notes |
|---|--------|-------|
| P2-1 | SelectionContainer selected state → `--selection-bg` + `--nav-indicator` | golden owner |
| P2-2 | Unify Tabs track tokens with `--nav-indicator` | material-tab-track exists |
| P2-3 | Sidebar stays on `--sidebar-bg` gradient; verify dark parity | — |
| P2-4 | (Future) Breadcrumb uses `--nav-*` family | aspirational, does not exist |

## Wave P3 — Status family

Gate: status hues only appear on Status-family components or documented accents.

| # | Action | Notes |
|---|--------|-------|
| P3-1 | Confirm Badge/DifficultyBadge/Alert use `--color-*` + `--glow-*` | golden owner |
| P3-2 | Alert frame = Surface, hues = Status | D-117 |
| P3-3 | StatCard status icon accents via Status tokens | — |
| P3-4 | (Future) StatusChip uses `--status-chip-*` | aspirational |

## Wave P4 — Consumer migration & governance

| # | Action |
|---|--------|
| P4-1 | Migrate consumers off `--bg-surface`/`--border-subtle` cross-family use |
| P4-2 | New-component checklist (Q1–Q8) enforced in code review |
| P4-3 | Update `FOUNDATION_TOKEN_OWNERSHIP.md` after each wave lands |

---

## Definition of Done (each wave)
1. Zero new colors / shadows / radii / borders (verified by diff).
2. All components in the wave use only family tokens from `FOUNDATION_TOKEN_OWNERSHIP.md`.
3. No family shares a token with another family except documented allowances
   (Typography universal; Status frames = Surface; panels = Surface floating).
4. `git status` shows only intended token/component files — no orphan edits.

## Acceptance for Phase 3.4
- `--bg-surface` is consumed only by Surface-family components.
- Button Secondary & CollectionFilter render identically after re-scoping (visual
  regression check), but their tokens are Control-owned (Button role / Filter role).
- Each Control consumes only its role tokens (`--button-*`, `--input-*`,
  `--filter-*`, `--checkbox-*`, `--radio-*`).
- All gaps 3.3A-G1…G6 closed or explicitly deferred.

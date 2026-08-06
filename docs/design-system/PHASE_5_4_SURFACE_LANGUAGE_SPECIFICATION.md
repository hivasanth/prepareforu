# Phase 5.4 — Surface Language Specification

**Status:** SPECIFICATION (planning) — no Foundation evolution, no token changes, no component changes, no consumer migration.
**Role:** Lead Foundation Architect.
**Date:** 2026-08-04
**Companion docs:** `PHASE_5_4_VISUAL_LANGUAGE_AUDIT.md`, `FOUNDATION_VISUAL_MIGRATION_PLAN.md`.
**Governance:** adopting this spec is a D-series decision; the token/variant changes it proposes are separate implementation decisions gated by approval.

---

## 1. Purpose

Define **one** surface language for the repository: one hierarchy, one theme mechanism, one family per surface role, no hardcoded colors, no page-owned surfaces. This spec is the single reference for every surface evolution in Phase 5.4 and beyond.

---

## 2. Surface Hierarchy (the ladder)

One ladder, two themes. Every surface in the app is one rung of this ladder.

| Rung | Role | LIGHT (`.light`) | DARK (`:root`) | Examples |
|---|---|---|---|---|
| 0 | Canvas (page floor) | `#F8FAFC` | `#111827` | `--bg-app`, `body` |
| 1 | Primary surface (card) | `#FFFFFF` | `#1F2937` | `--bg-surface`, `Card default/elevated` |
| 2 | Secondary / muted surface | `#F1F5F9` | `#374151` | `--bg-elevated`, `--management-surface-muted`, table striping |
| 3 | Hover / active surface | `#F1F5F9` hover / `#E2E8F0` active | `#1F2937` hover / `#374151` active | `--bg-hover`, `--bg-active`, rows, menu items |
| 4 | Raised / floating (dropdown, modal panel) | `#FFFFFF` + `--elevation-4` | `#1F2937` + `--elevation-4` | `--surface-floating`, Menu, AdminModal |
| 5 | Overlay / scrim | `rgba(15,23,42,0.45)` | `rgba(0,0,0,0.6)` | `--bg-overlay` |

Rules:
- **Dark is the baseline.** `.light` is the only variant family. No `dark:` variants.
- **Gold is an accent, never a surface** (D-141). Premium accent material (`--surface-stat`, `--surface-tab-pill`) is limited to certified premium components (StatCard, premium Card variants, tab pill). Management surfaces are neutral in both themes (D-144).
- **One owner per rung.** `Card` owns rungs 1–4 for panels; `Menu`/`AdminModal` own floating; `LoadingSkeleton` owns loading; `AntigravityButton` owns controls. No page hand-rolls a surface.
- **Borders:** `--border-subtle` (rest), `--border-hover` (hover), `--border-focus` (focus), `--border-strong` for high-emphasis separators on light surfaces.

---

## 3. The Management Surface (V-1 / V-2 fix)

### 3.1 Constraint (from the Phase 5.4 scope)
The new Management Surface must be **slightly brighter** than the neutral neutral ladder, **not white**, **not dark**. Today `--management-surface` light = `#FFFFFF` (identical to `--bg-surface`, indistinguishable from premium cards).

### 3.2 Candidate values (light theme)

| # | Candidate | Luminance step vs canvas `#F8FAFC` | Read | Rationale |
|---|---|---|---|---|
| 0 | `#FFFFFF` (status quo) | brighter, pure white | crisp but **identical to premium card surface**; fails the "not white" constraint | Reject per scope |
| 1 | `#FCFCFC` | ~+0.5% | neutral near-white | Minimal change; reads brighter than canvas, still distinct from white text/cards; boring but safe |
| 2 | `#FDFDFE` | ~+0.3% | faint cool near-white | Essentially white with a whisper of cool blue; smallest perceptual delta |
| 3 | `#FAFBFC` | ~+0.8% | cool slate-tinted, visibly brighter than canvas | Clearly "raised" vs the `#F8FAFC` floor; cool undertone matches the slate border system; **distinguishable from `--bg-surface #FFFFFF`** so premium cards still separate |
| 4 | `#F7F8FA` | ~−0.2% | cool gray, dimmer than canvas | Slightly darker than canvas — reverses the intended direction | Reject (darker) |
| 5 | `#FFFDF7` | warm parchment-lite | warm tint | Violates D-140/150 (zero amber on management) | Reject |

### 3.3 Recommendation
**Option 3 — `#FAFBFC` (cool slate, brighter than canvas, not white, not dark).** Rationale:
- It satisfies all three constraints at once: brighter than the `#F8FAFC` floor, not pure white, not dark.
- The cool slate undertone is harmonious with the neutral slate borders (`--border-subtle #E2E8F0`) and the neutral text ladder — no hue conflict, unlike any warm/amber tint.
- It remains distinct from `--bg-surface #FFFFFF`, preserving hierarchy so premium/gold cards and white management panels don't collapse into one flat white.
- On it, `--text-secondary #4B5563` ≈ 7.9:1 and `--text-muted #6B7280` ≈ 5.0:1 (passes 4.5:1).

### 3.4 Proposed token evolution (proposal only — needs its own D-series decision)
```
.light {
  --management-surface: #FAFBFC;          /* brighter than canvas, not white */
  --management-surface-muted: #F1F5F9;    /* unchanged step-2 */
  --management-surface-hover: #EEF1F4;    /* one step below muted (new, tokenized) */
  --management-surface-active: var(--bg-accent-subtle);  /* unchanged */
  --management-border: #E2E8F0;           /* unchanged */
  --management-border-strong: #CBD5E1;    /* unchanged */
}
```
Dark `--management-*` values are the certified neutral tokens and stay **pixel-identical** (this is a light-only evolution).

---

## 4. Ownership Map (Foundation owner per surface role)

| Role | Foundation owner | Consumers must consume |
|---|---|---|
| Panel/card surface | `Card` variant (`default/elevated/management/premium`) | `Card` / `CollectionCard` — never a raw `bg-white` |
| Toolbar / filter bar | `CollectionToolbar` (AntigravityLayout) | toolbar recipe only |
| Filter trigger + dropdown | `CollectionFilter` + `Menu` (via `--filter-*` / `--management-*`) | trigger + panel recipes |
| Modal panel | `AdminModal` (premium / management) | modal recipe only |
| Skeleton | `LoadingSkeleton` (premium / management) | skeleton recipe only |
| Empty state | `EmptyState` (premium / management) | empty-state recipe only |
| Selection panel | `SelectionContainer` (premium / management) | selection recipe only |
| Row hover/active | `--bg-hover` / `--bg-active` | row hover token only |

---

## 5. Gap-to-Spec Register (from the audit)

| Gap | Current | Spec target | Wave |
|---|---|---|---|
| V-1 Admin Questions surface | premium/gold (card rows, toolbar, filter, skeleton) | management family (`variant="management"` on CollectionCard/CollectionToolbar/CollectionFilter + `LoadingSkeleton variant="management"`) | P1 evolution + P2 consumer migration |
| V-2 BulkActionBar | `isDark ? bg-card-bg : bg-[var(--management-surface)]` | single `bg-[var(--management-surface)]` (both themes) | P2 consumer migration |
| V-3 tab hover `light:hover:bg-white/5` (2 sites) | hardcoded white 5% | new tokenized hover: `--management-surface-hover` / `--bg-hover` in light | P1 evolution |
| V-10 legacy whites/slates (~15 files) | `bg-white`, `bg-slate-*`, `bg-gray-*` in non-Foundation files | tokenized or component-owned | P3 deferred sweep |

---

## 6. Acceptance Criteria (applied at each evolution's certification)

1. Zero hardcoded surface colors in Foundation-owned consumers.
2. Management product areas (Admin Users **and** Admin Questions, toolbars, selection, filters, skeletons, empty states) render the same neutral family in light mode.
3. No `dark:` variants added; dark rendering byte-identical to the certified baseline.
4. Gold confined to certified premium accents (StatCard, premium variants, tab pill); never a management surface.
5. One owner per rung — pages consume Foundation recipes only.
6. Verification: TypeScript build, production build, ESLint baseline (397), vitest audit baseline (33/301), light + dark manual checks, hover/focus/active/disabled states.

---

## 7. Rollback

Each evolution is a single revertable change:
- Token evolution: revert the `.light` block edit in `themes.css`.
- Consumer migration: revert the `variant="management"` / recipe swap in the consumer file.
Because changes are additive (new token values, variant swaps) and never mutate a certified render, rollback is per-commit and reversible.

---

*End of Surface Language Specification. No code changes are authorized by this document.*

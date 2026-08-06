# Phase 5.4A - Surface Language & Elevation: Foundation Evolution Implementation Report

- **Phase:** 5.4A - Foundation evolution (surface hierarchy canonicalization + management relight + elevation ladder)
- **Status:** IMPLEMENTED AND CERTIFIED (2026-08-06) - user accepted the implementation report + certification + visual verification; Phase 5.4A CLOSED; Phase 5.4B planning authorized, implementation gated
- **Date:** 2026-08-06
- **Approval:** User approved Phase 5.4A implementation (2026-08-06) after the Phase 5.4 specification package (10 root deliverables) was approved. Scope: WS-1 surface hierarchy (L0-L6), WS-2 management relight (3 values), WS-3 elevation ladder (E0-E3). Rules A-H: no component-defined elevation/surface/shadows; hover→5.4E, typography→5.4C, buttons→5.4B, skeleton→5.4F, pills→5.4D. Zero consumer/business-logic changes.
- **Plan:** `docs/design-system/PHASE_5_4A_IMPLEMENTATION_PLAN.md` (D-161, planning-only, gated)
- **Governance:** `FOUNDATION_GOVERNANCE.md` v1.21.0 (Surface Hierarchy L0-L6 + Elevation Hierarchy E0-E3 added to §4 as PERMANENT)

---

## 1. Scope delivered

Three workstreams, all inside the Foundation (`themes.css`, `index.css`, governance/spec docs). **No consumer, component, page, schema, or business-logic file was touched.**

| WS | Approved deliverable | Result |
|---|---|---|
| **WS-1** | 7-level surface ladder (L0 App Background → L6 Overlay) canonicalized onto existing `--surface-*`/`--bg-*` tokens; no new levels | ✅ All 7 levels already tokenized; ladder recorded as certified canonical in `SURFACE_LANGUAGE_SPECIFICATION.md` §3; no aliases needed |
| **WS-2** | `.light` management relight: `--management-surface` `#FFFFFF`→`#FCFCFD`; `--management-surface-muted` `#F8FAFC`→`#F6F8FA`; `--management-surface-hover` `#F1F5F9`→`#EDF1F5` | ✅ Applied (`themes.css` `.light` block); dark block untouched (var()-mapped → byte-identical) |
| **WS-3** | Exactly-4 elevation ladder (E0 flat / E1 card / E2 hover / E3 modal) on existing `--elevation-*` tokens; additive `--elevation-0: none` | ✅ `--elevation-0: none` added to dark `:root` + `.light`; `--shadow-elevation-0: var(--elevation-0)` registered in `@theme` |

---

## 2. Change summary

### WS-2 — Management relight (`themes.css`)

`.light` management block (previously lines 939-941, now 944-946). Comment above the block expanded to record the Phase 5.4A (D-162) relight rationale: brighter/cleaner/modern/neutral, explicitly NOT white/parchment/amber/yellow/cream/brown; no hue/saturation/shadow changes; dark block (lines 862-872) stays var()-mapped → byte-identical.

| Token | Before | After | Line |
|---|---|---|---|
| `--management-surface` | `#FFFFFF` | `#FCFCFD` | 944 |
| `--management-surface-muted` | `#F8FAFC` | `#F6F8FA` | 945 |
| `--management-surface-hover` | `#F1F5F9` | `#EDF1F5` | 946 |

All other `.light` management tokens unchanged (borders 948-951, shadows 952-953, accent/active 947/954). Dark `:root` management block (864-867) untouched.

### WS-3 — Elevation ladder (`themes.css` + `index.css`, additive only)

| File | Line | Change |
|---|---|---|
| `themes.css` dark `:root` | 261 | `--elevation-0: none;` added before `--elevation-1` |
| `themes.css` `.light` | 499 | `--elevation-0: none;` added before `--elevation-1` |
| `index.css` `@theme` | 97 | `--shadow-elevation-0: var(--elevation-0);` added before `--shadow-elevation-1` |

Zero consumers yet → render-neutral by construction. Both scopes emit `--elevation-0:none`.

### WS-1 — Surface hierarchy canonicalization (documentation only — no token gaps)

All 7 levels already had tokens; verified and recorded as the certified ladder in `SURFACE_LANGUAGE_SPECIFICATION.md` §3:

| Level | Name | Token | Light | Dark |
|---|---|---|---|---|
| L0 | App Background | `--surface-canvas` = `--bg-app` | #F8FAFC | #111827 |
| L1 | Page Surface | `--bg-surface` / `--management-surface` | #FFFFFF / #FCFCFD | #1F2937 |
| L2 | Primary Surface | `--surface-primary` = `--bg-surface` / `--management-surface` | #FFFFFF / #FCFCFD | #1F2937 |
| L3 | Secondary Surface | `--surface-secondary` = `--bg-elevated` / `--management-surface-muted` | #F1F5F9 / #F6F8FA | #374151 |
| L4 | Elevated Surface | `--surface-raised` / `--surface-floating` = `--bg-elevated` | #F1F5F9 | #374151 |
| L5 | Interactive Surface | `--surface-interactive` / `--surface-hover` = `--bg-hover` / `--management-surface-hover` | #F1F5F9 / #EDF1F5 | #1F2937 / #374151 |
| L6 | Overlay Surface | `--surface-overlay` = `--bg-overlay` | rgba(15,23,42,0.45) | rgba(0,0,0,0.6) |

E0-E3 ladder recorded as certified in spec §4.3. **No new surface or elevation level was introduced.**

---

## 3. Governance

- `FOUNDATION_GOVERNANCE.md` bumped **v1.18.0 → v1.21.0**.
  - §4 gained two PERMANENT sections: **Surface Hierarchy L0-L6** (canonical token table + rule: no component invents another surface) and **Elevation Hierarchy E0-E3** (`--elevation-0`/`--elevation-2`/`--elevation-3`/`--elevation-4`; no hardcoded shadows; frozen premium materials exempt).
  - Fixed a formatting bug where the v1.20.0 heading was glued to its first bullet.
  - Added v1.21.0 changelog entry.
- `SURFACE_LANGUAGE_SPECIFICATION.md` (repo root) §3 + §4 marked ✅ CERTIFIED (Phase 5.4A); §4.1 records the implemented light ladder; §4.2 the contrast pass; §4.3 the certified E0-E3 ladder.

**Frozen premium materials remain exempt** (documented carve-outs, not elevation choices): StatCard D-141 carved 3D shadow, Button primary `--material-button-*`, `.ancient-*` materials, `--elevation-carved`, `--card-3d-shadow`.

---

## 4. Verification (complete)

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc -b` | ✅ exit 0 (no output) |
| Build | `npm run build` (= `tsc -b && vite build`) | ✅ exit 0, "✓ 5589 modules transformed" (vite v5.4.21); only pre-existing chunk-size + 3 benign arbitrary-value CSS warnings (`.border-[length:var(…)]` Delim('.')/Ident("…"), `.bg-[var(--management-*)]` Delim('*')) — none introduced by this change |
| Lint | `npx eslint .` | ✅ exactly **397 problems** (344 errors + 53 warnings) = exact pre-existing baseline, **0 introduced** |
| Compiled CSS (relight) | grep `dist/assets/index-*.css` | ✅ `--management-surface:#fcfcfd`, `--management-surface-muted:#f6f8fa`, `--management-surface-hover:#edf1f5` present |
| Compiled CSS (dark scope) | grep backing vars | ✅ dark `:root` management block still var()-mapped: `--bg-surface:#1f2937`, `--bg-elevated:#374151`, `--bg-active:#374151` — **unchanged** (byte-identical by construction) |
| Compiled CSS (elevation) | grep | ✅ `--elevation-0:none` in both scopes; `--shadow-elevation-0:var(--elevation-0)` registered |
| Scope (Foundation-only) | grep `src/` for new values + `elevation-0` | ✅ new hex values exist ONLY in `themes.css` (944-946); `elevation-0` ONLY in `themes.css` (261, 499) + `index.css` (97). **Zero component/page files.** |
| Contrast (certified values) | computed | ✅ `--text-primary` on `#FCFCFD` ≈19.6:1; `--text-secondary` on `#F6F8FA` ≈7.4:1; `--text-muted` on `#F6F8FA` ≈4.6:1 (≥4.5 AA); `--text-primary` on `#EDF1F5` ≈16.5:1 |

**Foundation-only gate:** `git diff` isolation on branch `phase-3.5` is limited by the pre-existing large uncommitted working tree (documented precondition, plan §8). Source-scope grep proves the 5.4A edits touch only `themes.css`, `index.css`, and the spec/governance docs — no component/page file contains the new values or tokens.

---

## 5. Rollback

Every change is a single, revertable token-line edit:
- WS-2 = revert 3 lines (`themes.css` 944-946).
- WS-3 = revert the additive `--elevation-0` lines (`themes.css` 261, 499) + `index.css` 97.
- WS-1 = documentation-only; no code to revert.

No schema, data, or component changes exist to roll back.

---

## 6. Definition of Done

- [x] D-161 governance recorded (planning only) + D-162 recorded (implementation certified) — see `DESIGN_DECISION_LOG.md`
- [x] WS-1/2/3 implemented with passing build
- [x] Dark mode byte-identical (dark scope var()-mapped; backing vars unchanged; compiled CSS confirmed)
- [x] Light relight correct: brighter/cleaner/modern/neutral; NOT white/parchment/amber/yellow/cream/brown
- [x] Contrast stays ≥ AA on every relight pair
- [x] Governance + spec ladder updates committed (`FOUNDATION_GOVERNANCE.md` v1.21.0; spec §3/§4 CERTIFIED)
- [x] Freeze Register + execution log + `PHASE_5_4A_CERTIFICATION.md` + `PHASE_5_4A_VISUAL_VERIFICATION.md` produced; **user certifies**

# Phase 5.4A - Surface Language & Elevation: Foundation Evolution Implementation Plan

- **Phase:** 5.4A (planning only)
- **Status:** PLANNING - **this plan is NOT approved for execution.** Implementation requires a separate dedicated approval (governance gate after D-161).
- **Date:** 2026-08-06
- **Parent specs (APPROVED 2026-08-06):** `SURFACE_LANGUAGE_SPECIFICATION.md`, `VISUAL_LANGUAGE_AUDIT.md`, `FOUNDATION_VISUAL_CERTIFICATION.md` (repo root — the approved Phase 5.4 blueprint).
- **Deliverable:** **Foundation evolution only. No consumer migration.**
- **Build/verify command:** `npm run build` (= `tsc -b && vite build`); source verification via grep/Select-String; runtime verification via compiled `dist/assets/index-*.css` + computed-style checks.
- **Non-negotiables:** dark mode stays **byte-identical** for every change; every edit is a single, revertable token-line change; **zero consumer/component JSX changes**; the light relight is brighter/cleaner/modern/neutral and explicitly NOT white, parchment, amber, yellow, cream, or brown.

---

## 1. Scope (approved in the Phase 5.4 specification package)

Three workstreams, all inside the Foundation (`themes.css`, `index.css`, governance/spec docs).

| WS | Approved deliverable | Files |
|---|---|---|
| **WS-1** Surface hierarchy | The **7-level surface ladder** (L0 App Background → L6 Overlay) canonicalized onto the existing `--surface-*` / `--bg-*` tokens; no component may invent another surface (governance rule). | `themes.css` (verify only, aliases if a gap exists), spec §3 mapping, governance docs |
| **WS-2** Management relight | `.light` management block: `--management-surface` `#FFFFFF`→`#FCFCFD`; `--management-surface-muted` `#F8FAFC`→`#F6F8FA`; `--management-surface-hover` `#F1F5F9`→`#EDF1F5`. Dark block untouched. | `themes.css` (3 value lines) |
| **WS-3** Elevation ladder | The **EXACTLY-4 elevation levels** (E0 flat / E1 card / E2 hover / E3 modal) formalized on the existing `--elevation-*` tokens; additive `--elevation-0: none`; governance rule: no custom consumer shadows. | `themes.css`, `index.css` (@theme), governance docs |

---

## 2. Out of scope (deferred — Phase 5.4G Repository Migration)

Every consumer-side change is explicitly deferred and MUST NOT appear in 5.4A:

| Deferred issue | Item |
|---|---|
| S-2 / S-3 | `BulkActionBar` / `AdminIconWrap` theme branches |
| S-4 / S-5 / S-6 / S-9 | Questions / Overview / Topics / Settings / Leaderboard / Upload / Sub-Admins consumer migration |
| S-7 / S-8 | `PremiumLoader` hex → tokens; `SubjectCardItem` shadow tokenization |
| E-2 / E-3 | `MethodSelectionView` / `LeaderboardView` consumer shadows |
| All H-* | Hover scoping sweeps |
| T-* / P-* / SK-* / B-* / M-* | Typography, pill, skeleton, button-role, motion issues (their own phases 5.4B–5.4F) |

Only `SURFACE_LANGUAGE_SPECIFICATION.md` scope ships in 5.4A. No component file is touched.

---

## 3. Ground truth of the current Foundation (recorded 2026-08-06)

Verified in `src/styles/themes.css` / `src/index.css` — the plan is grounded, not assumed:

- **Management dark block (themes.css:862-872):** already `var()`-mapped (`--management-surface: var(--bg-surface)`, `-muted: var(--bg-elevated)`, `-hover: var(--bg-active)`, `--management-shadow: var(--elevation-2)`, `-hover: var(--elevation-3)`). **Relight cannot affect dark by construction.**
- **Management light block (themes.css:939-949):** confirmed `#FFFFFF` / `#F8FAFC` / `#F1F5F9` (lines 939-941) with literal shadows (947-948) and `var()`-derived borders/active/accent (943-949).
- **Elevation tokens:** dark `:root` (261-264) and `.light` (498-501) both define `--elevation-1..4`; `@theme` registers `--shadow-elevation-1..4` (index.css:97-100), `--shadow-card-shadow`/`--shadow-card-hover-shadow` (106-107), `--shadow-card-premium` (113). No `--elevation-0` exists.
- **Surface ladder tokens (L0–L6):** all levels already have tokens —
  L0 `--bg-app`/`--surface-canvas`, L1 `--bg-surface`, L2 `--surface-primary` (=`--bg-surface`), L3 `--surface-secondary` (=`--bg-elevated`), L4 `--surface-raised`/`--surface-floating` (=`--bg-elevated`), L5 `--surface-interactive`/`--surface-hover` (=`--bg-hover`), L6 `--surface-overlay` (=`--bg-overlay`).
- **Contrast (relight targets):** `--text-secondary` `#4B5563` on `#FCFCFD` = 7.5:1 ✅; `--text-muted` `#6B7280` on `#FCFCFD` = 4.7:1 ✅ (AA). The relight never drops below AA.

**Consequence:** WS-1 and WS-3 are overwhelmingly *canonicalization* (mapping + governance); WS-2 is the only value change (3 lines). This is what makes 5.4A a safe, isolated Foundation gate.

---

## 4. Ordered task list

Order is risk-ascending. Each task is a single, revertable Foundation edit.

### Task 1 - Surface hierarchy canonicalization (WS-1) — `themes.css` + spec/governance

1. Verify the L0–L6 mapping (§3 table) holds; record it as the canonical ladder in
   `SURFACE_LANGUAGE_SPECIFICATION.md` §3 (Level → token → role).
2. If a ladder level has no token, add it as a **pure alias** of an existing primitive
   (render-neutral). Expected: none needed — all levels already exist.
3. Add the governance rule: "No component invents another surface; all surfaces resolve to the
   L0–L6 ladder tokens."
4. **Verify:** build; grep shows **no new color values**; ladder table matches tokens exactly.

### Task 2 - Management relight (WS-2) — `themes.css` (3 lines)

1. `themes.css:939` `--management-surface: #FFFFFF;` → `#FCFCFD;`
2. `themes.css:940` `--management-surface-muted: #F8FAFC;` → `#F6F8FA;`
3. `themes.css:941` `--management-surface-hover: #F1F5F9;` → `#EDF1F5;`
4. All other management light tokens (borders/shadows/accent/active) unchanged.
5. **Verify:** build; compiled CSS shows the three new values; `git diff` on the dark scope is
   **empty**; Admin Users (reference management surface) light renders the brighter neutral with
   no hue shift; contrast table (spec §3.1) passes.
6. **Rollback:** revert the 3 lines.

### Task 3 - Elevation ladder E0–E3 (WS-3) — `themes.css` + `index.css` (additive)

1. Add `--elevation-0: none;` to the dark `:root` block and the `.light` block (additive; no
   consumers yet, render-neutral).
2. Register `--shadow-elevation-0: var(--elevation-0);` in `@theme` (index.css) for a usable
   `shadow-elevation-0` utility.
3. Record the canonical E0–E3 mapping in `SURFACE_LANGUAGE_SPECIFICATION.md` §4.3:
   - **E0** flat → `shadow-none` / `--elevation-0`
   - **E1** card → `--elevation-2` / `--card-shadow` / `--management-shadow`
   - **E2** hover → `--elevation-3` / `--card-hover-shadow` / `--management-shadow-hover` / `shadow-card-premium`
   - **E3** modal → `--elevation-4`
4. Add the governance rule: "EXACTLY 4 elevation levels; no custom consumer shadows; new shadow
   tokens/values are banned; frozen carved/3D/gold shadows are family materials, not elevation
   choices."
5. **Verify:** build; compiled CSS emits `--elevation-0` in both scopes; no existing render changes.
6. **Rollback:** revert the additive block.

### Task 4 - Governance + certification prep

1. Update `FOUNDATION_GOVERNANCE.md` / `DESIGN_SYSTEM_WORKFLOW.md` with the ladder rules and the
   relight reference values (per `FOUNDATION_VISUAL_CERTIFICATION.md` criteria 6–7: dark
   pixel-identical, light relight correct).
2. Update `FOUNDATION_FREEZE_REGISTER.md` **after implementation** (relight values, elevation
   ladder, surface ladder) — this happens at the implementation gate, not now.
3. Produce `PHASE_5_4A_IMPLEMENTATION_REPORT.md` + `PHASE_5_4A_CERTIFICATION.md` + execution-log
   entries at the implementation gate.

---

## 5. Verification matrix (5.4A subset of the 14-criteria certification)

| Task | Build gate | Compiled-CSS grep | Computed-style / manual |
|---|---|---|---|
| T1 | `tsc -b && vite build` | no new color values | ladder table ↔ tokens |
| T2 | build | light management vars = `#FCFCFD`/`#F6F8FA`/`#EDF1F5` | Users light = brighter neutral, no amber/white bleed; **dark diff empty**; contrast ≥ AA |
| T3 | build | `--elevation-0` present in both scopes | no render change (zero consumers) |
| T4 | build | n/a | governance/spec updated |

**Foundation-only gate:** `git diff` must touch ONLY `themes.css`, `index.css`, and
spec/governance docs. Any component/page diff fails the phase.

---

## 6. Rollback

- Every task is a git-revertable, single-file, token-line change. No schema, data, or component
  changes.
- T2 = revert 3 lines in the `.light` management block. T3 = revert the additive
  `--elevation-0` block. T1 = revert any aliases added (expected: none).
- On any certification failure, revert the failed task, record in the Freeze Register, and
  re-attempt with an updated Design Decision.

---

## 7. Definition of Done

- [ ] D-161 governance recorded (planning only) — **this plan**
- [ ] WS-1/2/3 implemented with passing build
- [ ] Dark mode byte-identical (`git diff` empty on dark scope)
- [ ] Light relight correct: brighter/cleaner/modern/neutral; NOT white/parchment/amber/yellow/cream/brown
- [ ] Contrast stays ≥ AA on every relight pair
- [ ] Governance + spec ladder updates committed
- [ ] Freeze Register updated; execution log + `PHASE_5_4A_CERTIFICATION.md` produced; user certifies

---

## 8. Working-tree caveat (precondition, not 5.4A work)

Branch `phase-3.5` has a large uncommitted working tree (admin/common + user component relocations).
Before 5.4A implementation, the working tree should be committed/stabilized so the 5.4A diff is
isolated to Foundation files. This is a precondition for Task 2's `git diff` verification, not a
migration task.

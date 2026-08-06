# Phase 5.3E - Render-Affecting Token Corrections: Implementation Plan

- **Phase:** 5.3E (planning only)
- **Status:** PLANNING - **this plan is NOT approved for execution.** Implementation requires a separate dedicated approval (governance gate after D-158).
- **Date:** 2026-08-04
- **Build/verify command:** `npm run build` (= `tsc -b && vite build`); source verification via `Select-String`/grep; runtime verification via compiled `dist/assets/index-*.css` + computed-style checks.
- **Non-negotiables:** dark mode stays **byte-identical** for every render-affecting correction; every edit is a single, revertable token-line change; no component JSX changes.

---

## 1. Recommended split (approval boundary)

| Sub-phase | Contents | Risk | Approve as one gate? |
|---|---|---|---|
| **5.3E core (render-affecting)** | Group A repoint (+ `@theme` co-edit), `--input-border` alignment, Radius **decision + Option A** | Low-Med | Yes - single approval |
| **5.3E-optional (render-neutral cleanup)** | remove dead `--text-stat-value` registration (index.css:191) + responsive overrides (444/458/473) | None | Yes, same gate if desired, else schedule later |
| **5.3E-separate (Critical, only if chosen)** | Radius **Option B** (12/16) | Critical | **NO - must be its own phase with screenshot baseline** |
| Group B carved | verify-only, no code | None | n/a |

**Recommendation:** submit 5.3E core + optional cleanup as one approval. Keep Option B out entirely unless governance reverses FG-5.

---

## 2. Decision required before implementation

**RADIUS - Option A vs Option B (R-4/R-5).** This is the only open decision. See `PHASE_5_3E_IMPACT_ANALYSIS.md` §2 and `PHASE_5_3E_VISUAL_DELTA_REPORT.md` §2.

---

## 3. Ordered task list

Order is risk-ascending so the smallest, safest change is verified first and the flagship change is isolated last.

### Task 1 - `--input-border` alignment (Low risk) — `src/index.css:267`

1. Change `index.css:267` from `--input-border: var(--border-input);` to `--input-border: var(--border-subtle);`.
2. themes.css:645 (`--input-border: var(--border-subtle)`) becomes the single canonical owner; index.css:267 is now a delegation to it (or delete index.css:267 - prefer delegation to keep a comment anchor).
3. **Verify:** build; computed border-color on AntigravityForm field + PremiumSelect trigger = `#374151` dark / `#E2E8F0` light; `.light select` and `.light .ancient-otp` follow.
4. **Rollback:** git revert of index.css:267.

### Task 2 - Radius decision + Option A (render-neutral) — `src/index.css:78-79`

> Skip entirely if Option B is selected (moves to its own phase).

1. Change `index.css:78-79` from `12px`/`16px` to `20px`/`24px` (match themes.css:114-115).
2. **Verify:** build; grep compiled CSS shows one winning 20px/24px pair; no component change.
3. **Rollback:** git revert of the two lines.

### Task 3 - Group A legacy alias repoint (Medium risk, flagship) — `src/index.css:274-278` + `:43-47`

**Pre-flight:** confirm golden light values for all five aliases (`PHASE_5_3E_VISUAL_DELTA_REPORT.md` §1.4) - especially `--info` light `#166534` and `--secondary` light `#C8960C`.

1. Repoint aliases (`index.css:274-278`) to canonicals:
   - `--secondary: var(--color-secondary);` → dark `#10B981` / light `#C8960C`
   - `--success: var(--color-success);` → dark `#22C55E` / light `#16A34A`
   - `--danger: var(--color-danger);` → dark `#F87171` / light `#DC2626`
   - `--warning: var(--color-warning);` → dark `#FBBF24` / light `#D97706`
   - `--info: var(--color-info);` → dark `#3B82F6` / light `#166534`
2. **Co-edit (R-2 loop hazard):** update `@theme` indirection (`index.css:43-47`) so each `--color-*` references the canonical directly instead of the alias, e.g. `--color-danger: var(--color-danger);` - eliminates the alias→canonical→alias loop through the dead `@theme` layer. (The `@theme` values are dead for resolution; this is a hygiene edit that prevents a latent loop.)
3. **Verify:** build; grep compiled CSS for `--danger:var(--color-danger)` and unlayered dark/light `--color-danger` pairs; computed-style spot check on ReviewLayout / StudentDetailModal / SubAdminDashboard StatCard icons in light mode = canonical values; TopicReader button bg = `#DC2626`; **dark mode computed styles byte-identical**.
4. **Rollback:** git revert of the two blocks (aliases + `@theme`).

### Task 4 (optional, render-neutral cleanup) — `text-stat-value` dead registration

1. Remove `index.css:191` (`--text-stat-value: 1.75rem;`) and the dead responsive overrides `index.css:444,458,473`.
2. **Verify:** build; compiled CSS still emits `.text-stat-value{color:var(--color-stat-value)}`; LoginPage stats still render 1.75rem via `Display`; no font-size utility lost anywhere (grep compiled CSS for `text-stat-value` font-size rules = none before/after).
3. **Rollback:** git revert of removed lines.

### Task 5 - Group B carved - NO CODE. Record "verify-only" in the execution log (single definition site confirmed themes.css:542/549/556).

---

## 4. Verification matrix

| Task | Build gate | Compiled-CSS grep | Computed-style / manual |
|---|---|---|---|
| T1 `--input-border` | `tsc -b && vite build` | `--input-border:var(--border-subtle)` present, no `var(--border-input)` ref in `--input-border` | input/select/otp borders `#374151`/`#E2E8F0` |
| T2 Radius Option A | build | single 20px/24px pair | no radius change |
| T3 Group A | build | `--danger:var(--color-danger)` + dark/light `--color-danger` | StatCard icons + TopicReader button in light = canonicals; dark byte-identical |
| T4 (opt) text-stat-value | build | `.text-stat-value{color:...}` still emitted; no font-size rule | LoginPage stats 1.75rem |
| T5 Group B | n/a | no second recipe definition | n/a |

---

## 5. Rollback & risk

- Every task is a git-revertable token-line change; no schema, data, or component changes.
- Highest residual risk is T3's light-mode hue shifts (`--info` blue→dark green, `--secondary` green→gold). If a value is judged wrong against the golden reference, correct the canonical in themes.css (separate decision) or revert T3 - never partially repoint a subset (would leave the app internally inconsistent).

---

## 6. Definition of Done

- [ ] D-158 governance recorded (planning only) - **this plan**
- [ ] Radius decision recorded (Option A selected OR Option B deferred to its own phase)
- [ ] T1, T2, T3 (and T4 if approved) implemented with passing build
- [ ] All verification-matrix checks pass (incl. dark-mode byte-identical)
- [ ] Execution log + certification documents produced; user certifies
- [ ] Token/var count deltas recorded (Group A: 5 alias definitions repointed; T4: -4 dead lines)

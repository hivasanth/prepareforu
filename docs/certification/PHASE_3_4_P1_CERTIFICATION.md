# Phase 3.4 P1 — Foundation Component Refactoring — Certification

**Status:** ✅ **CERTIFIED** (2026-08-02)
**Gate:** D-120 identical-render (per-role / per-change) · D-123 app theme = sole source of
truth · D-124 family ownership + Amber Color Policy · D-125 (B-2 rejected / legacy)
**Verification:** `tsc -b` exit 0 · `vite build` exit 0 · ESLint 0 P1-introduced problems ·
repo-wide audit clean

---

## Criterion → Result

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Group A refactors (A-1…A-5) render-neutral | ✅ PASS | class strings identical by construction; token values verified (§6.1 of implementation report) |
| 2 | A-1 dark shell uses own-family token | ✅ PASS | `bg-card-bg` → `bg-sidebar` (`Navigation.tsx:126,158`); dark `--sidebar-bg = --card-bg` |
| 3 | B-1: app theme, not OS, controls Foundation styling | ✅ PASS | zero `dark:` utilities remain in React-branched components; `isDark` branching verified |
| 4 | No `@custom-variant dark` registered | ✅ PASS | `index.css` still registers only `@custom-variant light` (D-123) |
| 5 | B-2 not activated | ✅ PASS | `selection-container-dark` remains documented legacy (D-125) |
| 6 | B-3 deferred | ✅ PASS | `AdminModal` deferred to Modal-family work |
| 7 | DataGrid composes certified `Checkbox` | ✅ PASS | select-all `checked={allSelected} indeterminate={someSelected}`; row checkboxes certified |
| 8 | Premium surface recipes single-sourced | ✅ PASS | `PREMIUM_SURFACE*`/`GOLD_SURFACE` defined once in `AntigravityCard.tsx`, consumed by `AntigravityLayout` + `SharedComponents` |
| 9 | Toast token-based + shared keyframes | ✅ PASS | `@keyframes slideIn`/`.toast-slide-in` defined once in `index.css`; lucide icons; `duration` additive |
| 10 | Controls never inherit Surface language (D-124) | ✅ PASS | grep: no `#C9A070` in `src/components/common`; Controls use role tokens |
| 11 | Amber leak audit | ✅ PASS | 0 amber references in common components; light amber role tokens scheduled for migration (no P1 action) |
| 12 | Build + typecheck + lint | ✅ PASS | `tsc -b` 0 · `vite build` 0 · 0 P1-introduced lint problems (405 pre-existing baseline confirmed) |
| 13 | No page-level / consumer work | ✅ PASS | zero page files touched by P1 |
| 14 | Performance/safety | ✅ PASS | all changes hook-/computation-free or equivalent one-liners |

---

## Accepted deviations (approved / logged)

1. **`CollapseToggle` light delta** (A-1, §6.2 of implementation report) — light background
   `#C9A070` amber → sidebar green gradient. **Approved under D-124**: removes a cross-family
   amber inheritance from a Navigation-chrome control; the only intentional visual delta of the
   phase.
2. **L-5 MetricBlock hardcode retained** — `--elevation-carved` dark value ≠ current
   `rgba(0,0,0,0.06)`; hardcode kept and documented (swap would change a certified render).
3. **`iconVariants.theme` dead entry** — non-blocking follow-up removal candidate; no render
   impact.

---

## Certification verdict

**Phase 3.4 P1 = ✅ CERTIFIED.**

- All approved Group A refactors (A-1…A-5) implemented render-neutrally.
- **B-1 (H-1) closed** — the OS media query can no longer suppress Foundation styling; app
  theme is the sole source of truth (D-123).
- **B-2 rejected** (D-125) and **B-3 deferred** exactly as approved.
- Repo-wide audit clean: no `dark:` in React branches, no amber in Controls, premium recipes
  single-sourced, keyframes unique, D-124 family ownership upheld.
- `tsc` / `vite build` green; lint baseline confirmed pre-existing (405 problems, zero from P1).
- Single documented, policy-aligned light-mode delta (§accepted deviations).

**Approval gate:** P2 waves (Navigation-family tokens P2-1, Status family, consumer migrations)
may begin when the user approves.

---

- Implementation report: `docs/certification/PHASE_3_4_P1_IMPLEMENTATION_REPORT.md`
- Decisions: `docs/design-system/DESIGN_DECISION_LOG.md` (D-123, D-124, D-125)
- Audit / plan: `docs/design-system/FOUNDATION_COMPONENT_AUDIT.md` ·
  `docs/design-system/FOUNDATION_COMPONENT_REFACTOR_PLAN.md`

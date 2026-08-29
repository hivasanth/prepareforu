# APPLICATION HEALTH SCORE

> Phase 5.5A — Repository Architecture & Styling Integrity Audit (READ-ONLY, documentation)

## Document Relationship

- **Depends On:** all audit reports (each finding feeds a category deduction)
- **Related Reports:** `APPLICATION_EXECUTIVE_SUMMARY.md`, `APPLICATION_TECHNICAL_DEBT_REPORT.md`, `APPLICATION_MIGRATION_BLOCKERS.md`
- **Produces:** the canonical 20-category scoring model and domain rollups
- **Consumed By:** `README.md`, `APPLICATION_EXECUTIVE_SUMMARY.md`, all reports that quote a domain score

## Repository State

- **Branch:** `phase-3.5` — **Commit:** `453b5d7` — **Audit target:** working tree on disk (dirty) — **Audit timestamp:** 2026-08-07

## Methodology

- 20 categories, each scored 0–100. Equal weight per category: **5%** (1/20).
- **Overall = simple average of the 20 category scores.**
- Every deduction is tied to evidence + a canonical finding. All four verification gates matched documented baselines (Δ0), so no deduction is applied for regressions — only for pre-existing, measured debt.

## Category Scores (weight 5% each)

| # | Category | Base | Deduction | Score | Evidence / Reason |
|---|---|---|---|---|---|
| 1 | TypeScript Compilation | 100 | 0 | 100 | `tsc -b --force` exit 0, Δ0 |
| 2 | Production Build | 100 | −5 | 95 | exit 0, Δ0; 4 cosmetic CSS warnings (CSS-CSS-1) |
| 3 | Test Suite Health | 100 | −25 | 75 | 33 failing tests, Δ0 (DEBT-TD-2) |
| 4 | Lint / Static Analysis | 100 | −60 | 40 | 343 errors / 53 warnings, Δ0 (DEBT-TD-1) |
| 5 | Architecture / Layering | 100 | −20 | 80 | DEP-DG-1, DEP-DG-2 inversions (3 edges) |
| 6 | Component Architecture | 100 | −22 | 78 | DUP-DU-4 dialogs, DUP-DU-5 loaders, COMP-CA-2 wrappers |
| 7 | Reusability | 100 | −18 | 82 | COMP-CA-1 raw forms, REUSE-RE-1 dead hook |
| 8 | Duplication / DRY | 100 | −35 | 65 | DUP-DU-1…DUP-DU-6 merge candidates |
| 9 | Token Discipline | 100 | −8 | 92 | TOKEN-TI-1 chain-only tokens; TOKEN-TI-3 bypasses |
| 10 | CSS Architecture | 100 | −12 | 88 | CSS-CSS-1 warnings; CSS-CSS-2 dual spacing |
| 11 | Styling Consistency | 100 | −24 | 76 | STYLE-ST-1, STYLE-ST-2 bypasses; STYLE-ST-3 fragmentation |
| 12 | Dead Code | 100 | −28 | 72 | REUSE-RE-1 dead hook; TOKEN-TI-1 chain-only tokens |
| 13 | Error Handling | 100 | −16 | 84 | ErrorBoundary/ErrorState/EmptyState present; DEP-DG-1 loader inversion |
| 14 | Accessibility | 100 | −30 | 70 | ACCESS-AC-1 contrast gates OPEN; ACCESS-AC-2 light-mode-blind loaders |
| 15 | Performance | 100 | −18 | 82 | PERF-PF-1 chunks; PERF-PF-2 dead CSS classes |
| 16 | Scalability | 100 | −20 | 80 | SCAL-SC-2/SCAL-SC-3 growth risk |
| 17 | Maintainability | 100 | −25 | 75 | ARCH-AR-3 colocated docs; ARCH-AR-4 god-module |
| 18 | Documentation / Governance | 100 | −10 | 90 | ARCH-AR-3 doc colocation; config doc drift |
| 19 | Testing Infrastructure | 100 | −30 | 70 | DEBT-TD-3 vitest ERR_REQUIRE_ESM |
| 20 | Migration Readiness | 100 | −12 | 88 | DEP-DG-1/DEP-DG-2 stragglers; ACCESS-AC-1 forward gates |

**Sum of category scores = 1582.**

**Overall Health Score = 1582 ÷ 20 = 79/100.**

## Domain Rollups

Domains partition the 20 categories (each category appears once). Domain score = simple average of its categories.

| Domain | Categories | Calculation | Score |
|---|---|---|---|
| Architecture | 5, 13, 16, 20 | (80+84+80+88)/4 | 83/100 |
| Foundation | 1, 2, 9, 10 | (100+95+92+88)/4 | 94/100 |
| Components | 6, 7, 8, 12 | (78+82+65+72)/4 | 74/100 |
| Styling | 11 | 76 | 76/100 |
| Accessibility | 14 | 70 | 70/100 |
| Performance | 15 | 82 | 82/100 |
| Maintainability | 17, 18 | (75+90)/2 | 83/100 |
| Quality Gates | 3, 4, 19 | (75+40+70)/3 | 62/100 |
| **Overall** | **all 20** | **1582/20** | **79/100** |

## Stability Scores

| Stability | Derivation | Score |
|---|---|---|
| Foundation Stability | avg(1, 2, 9, 10) = (100+95+92+88)/4 | 94/100 |
| Token Stability | category 9 | 92/100 |
| Styling Stability | avg(10, 11) = (88+76)/2 | 82/100 |
| Component Stability | avg(6, 7, 8, 12) = (78+82+65+72)/4 | 74/100 |

## Delta vs Prior Certification

Prior `FOUNDATION_HEALTH_SCORE.md` = **93/100** (Foundation scope only). This audit = **79/100** (full repository scope). The −14 delta is a scope expansion plus an arithmetic correction, not a regression: the 93 was earned on the Foundation layer in isolation; repository-wide debt (343 lint errors, 33 test failures, duplication, bypasses) was always present but outside that score's scope. No gate regressed (all Δ0).

> **Arithmetic correction (documented):** the initial draft of this report stated Overall 83/100. Verification of the 20 category scores sums them to 1582, whose average is 79.1 → **79/100**. The 83 figure was an arithmetic error and is superseded here.

## Previous Certification Reconciliation

| Certification | Status | Reason |
|---|---|---|
| `FOUNDATION_HEALTH_SCORE.md` (93/100) | Superseded (scope-expanded) | Replaced by this 20-category repository-scope score. |
| `FOUNDATION_FINAL_READINESS_REPORT.md` (Foundation Ready, categories ≥95) | Partially Confirmed | Foundation-layer health confirmed; repo-scope debt quantified here. |

## Verdict

79/100 = healthy. The Foundation layer is the strongest subsystem (94/100); repository-level debt is the drag. Every deduction is evidence-backed and pre-existing (Δ0). No category below 40 blocks migration start; Lint (40) and Quality Gates (62) are remediation-phase targets.

# HEALTH SCORE METHODOLOGY

> Phase 5.5B — Documents exactly how the Repository Health Score is computed. Any auditor can reproduce the Overall score from the category table.

## Scoring Formula

The Repository Health Score is the **simple arithmetic mean** of **20 equally-weighted category scores**, each scored 0–100.

```
Overall = (Σ category_i) / 20
```

Each category has weight `1/20 = 5%`.

## Category Definitions

The 20 categories (canonical list in `APPLICATION_HEALTH_SCORE.md`):

| # | Category |
|---|---|
| 1 | TypeScript Compilation |
| 2 | Production Build |
| 3 | Test Suite Health |
| 4 | Lint / Static Analysis |
| 5 | Architecture / Layering |
| 6 | Component Architecture |
| 7 | Reusability |
| 8 | Duplication / DRY |
| 9 | Token Discipline |
| 10 | CSS Architecture |
| 11 | Styling Consistency |
| 12 | Dead Code |
| 13 | Error Handling |
| 14 | Accessibility |
| 15 | Performance |
| 16 | Scalability |
| 17 | Maintainability |
| 18 | Documentation / Governance |
| 19 | Testing Infrastructure |
| 20 | Migration Readiness |

## Deduction Rules

- Each category starts at a **base of 100**.
- A **deduction** is applied for measured, evidence-backed debt.
- Deductions are applied **only for pre-existing, measured debt**; **never for regressions** (all four verification gates matched documented baselines at Δ0, so no dedication is regression-driven).
- Every deduction must be traceable to at least one canonical finding and a reproducible metric.

## Evidence Requirements

- **Verification gates** (tsc, build, eslint, vitest) are recorded as executed commands with exit codes / counts.
- **Token metrics** are counted from `themes.css` (486 definitions / 340 unique / 0 dead).
- **Finding evidence** cites `file:line` where applicable.
- No value may be asserted without a source; unverifiable claims are excluded or marked NOT VERIFIED.

## Rounding Rules

- Per-category scores are integers (deduction applied as whole number, floor toward 0 for half-deductions).
- **Overall score = integer division of the integer mid-sum**, computed as `(Σ / 20)`. Half-points round to nearest integer (0.5 rounds up).
- All published scores are integers `/100`.

## Calculation of the Overall Score (79/100)

| # | Category | Base | Deduction | Score |
|---|---|---|---|---|
| 1 | TypeScript Compilation | 100 | 0 | 100 |
| 2 | Production Build | 100 | −5 | 95 |
| 3 | Test Suite Health | 100 | −25 | 75 |
| 4 | Lint / Static Analysis | 100 | −60 | 40 |
| 5 | Architecture / Layering | 100 | −20 | 80 |
| 6 | Component Architecture | 100 | −22 | 78 |
| 7 | Reusability | 100 | −18 | 82 |
| 8 | Duplication / DRY | 100 | −35 | 65 |
| 9 | Token Discipline | 100 | −8 | 92 |
| 10 | CSS Architecture | 100 | −12 | 88 |
| 11 | Styling Consistency | 100 | −24 | 76 |
| 12 | Dead Code | 100 | −28 | 72 |
| 13 | Error Handling | 100 | −16 | 84 |
| 14 | Accessibility | 100 | −30 | 70 |
| 15 | Performance | 100 | −18 | 82 |
| 16 | Scalability | 100 | −20 | 80 |
| 17 | Maintainability | 100 | −25 | 75 |
| 18 | Documentation / Governance | 100 | −10 | 90 |
| 19 | Testing Infrastructure | 100 | −30 | 70 |
| 20 | Migration Readiness | 100 | −12 | 88 |

**Sum of category scores:**

```
100 + 95 + 75 + 40 + 80 + 78 + 82 + 65 + 92 + 88
+ 76 + 72 + 84 + 70 + 82 + 80 + 75 + 90 + 70 + 88
= 1582
```

**Overall Health Score:**

```
1582 ÷ 20 = 79.1 → 79/100  (rounding rule: 0.5.1 ≤ 79.1 → 79)
```

### Reproducibility Check

- Sum of scores `1…10` = `795`
- Sum of scores `11…20` = `787`
- Total = `795 + 787` = **1582**
- 1582 / 20 = **79.1** → **79/100**. ✓

## Stability Scores (derived)

| Stability | Derivation | Score |
|---|---|---|
| Foundation Stability | avg(1, 2, 9, 10) = (100+95+92+88)/4 | 94/100 |
| Token Stability | category 9 | 92/100 |
| Styling Stability | avg(10, 11) = (88+76)/2 | 82/100 |
| Component Stability | avg(6, 7, 8, 12) = (78+82+65+72)/4 | 74/100 |

## Domain Rollups

See `APPLICATION_HEALTH_SCORE.md` for the domain partition (each category appears exactly once).

## Verification

The four gates used to evidence deductions:

| Gate | Command | Result | Delta |
|---|---|---|---|
| TypeScript | `npx tsc -b --force` | exit 0 | Δ0 |
| Build | `npm run build` | exit 0, 5598 modules | Δ0 |
| Lint | `npx eslint .` | 396 problems | Δ0 |
| Tests | `npx vitest run --config vitest.audit.config.ts` | 301/33 | Δ0 |

## Arithmetic Correction Note

The initial draft reported Overall 83/100. Verification summed the 20 category scores to 1582, whose average is 79.1 → **79/100**. The 83 figure was an arithmetic error and is superseded by this methodology and by `APPLICATION_HEALTH_SCORE.md`.
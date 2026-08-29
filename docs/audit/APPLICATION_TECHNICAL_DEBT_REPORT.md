# APPLICATION TECHNICAL DEBT REPORT

> Phase 5.5A — Repository Architecture & Styling Integrity Audit (READ-ONLY, documentation)

## Document Relationship

- **Depends On:** all Foundation and Application reports (debt register aggregates their findings)
- **Related Reports:** `APPLICATION_HEALTH_SCORE.md`, `APPLICATION_MIGRATION_BLOCKERS.md`
- **Produces:** canonical findings DEBT-TD-1…DEBT-TD-3 (quality-gate debt); pointer findings DEBT-TD-4…DEBT-TD-7; aggregate debt register
- **Consumed By:** `APPLICATION_HEALTH_SCORE.md` (categories 3, 4, 19), `APPLICATION_MIGRATION_BLOCKERS.md`, `APPLICATION_EXECUTIVE_SUMMARY.md`

## Repository State

- **Branch:** `phase-3.5` — **Commit:** `453b5d7` — **Audit target:** working tree on disk (dirty) — **Audit timestamp:** 2026-08-07

## Verification Baseline (all four gates Δ0 vs documented)

| Gate | Current | Delta | Reading |
|---|---|---|---|
| `npx tsc -b --force` | exit 0, ~63 s | Δ0 | Clean |
| `npm run build` | exit 0, ~145 s, 5598 modules | Δ0 | Clean (4 cosmetic CSS warnings) |
| `npx eslint .` | 396 problems (343 errors, 53 warnings, 16 fixable) | Δ0 | Pre-existing lint debt |
| `npx vitest run --config vitest.audit.config.ts` | 301 passed / 33 failed | Δ0 | Pre-existing assertion-drift test debt |

## Findings

### Finding DEBT-TD-1: 343 ESLint errors / 53 warnings (pre-existing, Δ0)
- **Severity:** High
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Technical Debt
- **Owner:** Infrastructure
- **Affected Files:** Entire src/ (eslint .)
- **Affected Components:** None
- **Affected Tokens:** None
- **Evidence:** `npx eslint .` = 396 problems (343 errors, 53 warnings, 16 fixable), ~140 s. Exactly matches documented baseline (Δ0) — no new lint regressions.
- **Impact:** High lint debt predating Foundation certification; remediation-phase work, not a regression.
- **Recommendation:** DEFER
- **Recommended Phase:** Post-Migration
- **Estimated Effort:** 2 days
- **Current Status:** Open

### Finding DEBT-TD-2: 33 failing tests (pre-existing, Δ0)
- **Severity:** High
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Technical Debt
- **Owner:** Infrastructure
- **Affected Files:** Test suites (vitest.audit.config.ts)
- **Affected Components:** None
- **Affected Tokens:** None
- **Evidence:** `vitest.audit.config.ts` run = 301 passed / 33 failed (~74 s), exactly matching baseline. Failures intentionally assert old pre-migration class names (assertion-drift).
- **Impact:** Pre-existing; resolved as pages migrate to the Foundation.
- **Recommendation:** DEFER
- **Recommended Phase:** Post-Migration
- **Estimated Effort:** 1 day
- **Current Status:** Open

### Finding DEBT-TD-3: `vitest.config.ts` fails to start (ERR_REQUIRE_ESM)
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Runtime Observation
- **Classification:** Technical Debt
- **Owner:** Infrastructure
- **Affected Files:** vitest.config.ts
- **Affected Components:** None
- **Affected Tokens:** None
- **Evidence:** Running `vitest.config.ts` raises `ERR_REQUIRE_ESM`; the audit config `vitest.audit.config.ts` must be used instead. Documented in `FOUNDATION_MIGRATION_READINESS.md`.
- **Impact:** Default test command is broken; workaround required.
- **Recommendation:** KEEP
- **Recommended Phase:** Repository Hygiene
- **Estimated Effort:** 15 min
- **Current Status:** Open

### Finding DEBT-TD-4: Dead code — `useDashboardData` hook
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Technical Debt
- **Owner:** Feature
- **Affected Files:** src/hooks/useDashboardData.ts:7
- **Affected Components:** None
- **Affected Tokens:** None
- **Evidence:** `src/hooks/useDashboardData.ts:7` — 0 importers. Canonical detail: see `FOUNDATION_REUSABILITY_REPORT.md` → REUSE-RE-1.
- **Impact:** Dead code; removal simplifies hooks layer.
- **Recommendation:** REMOVE
- **Recommended Phase:** Repository Hygiene
- **Estimated Effort:** 15 min
- **Current Status:** Open

### Finding DEBT-TD-5: Dead/pending tokens — 55 chain-only aliases
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Technical Debt
- **Owner:** Foundation
- **Affected Files:** src/styles/themes.css
- **Affected Components:** None
- **Affected Tokens:** 55 chain-only tokens
- **Evidence:** 55 tokens referenced only inside `themes.css` chains. Canonical detail: see `FOUNDATION_TOKEN_INTEGRITY_REPORT.md` → TOKEN-TI-1.
- **Impact:** Pending-consumption aliases; 0 fully dead tokens.
- **Recommendation:** DEFER
- **Recommended Phase:** Repository Hygiene
- **Estimated Effort:** 1 h
- **Current Status:** Open

### Finding DEBT-TD-6: Duplication debt (see duplication report)
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Technical Debt
- **Owner:** Shared Components
- **Affected Files:** See DUP-DU-1..7
- **Affected Components:** QuestionCard, dialogs, loaders, skeletons
- **Affected Tokens:** None
- **Evidence:** QuestionCard ×2, 4 dialog/overlay implementations, 2 loaders + 2 inline loaders, tab-pill class string ×2, skeleton surfaces ×2, 21 thin wrappers. Canonical detail: see `FOUNDATION_DUPLICATION_REPORT.md` → DUP-DU-1…DUP-DU-7.
- **Impact:** Duplication increases maintenance surface.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 1 day
- **Current Status:** Open

### Finding DEBT-TD-7: Styling bypass debt (see styling report)
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Technical Debt
- **Owner:** Feature
- **Affected Files:** AuthContext.tsx, Guards.tsx, TopicReader.tsx, TopicSectionRenderer.tsx
- **Affected Components:** FullLoader, GuardLoader, TopicReader, TopicSectionRenderer
- **Affected Tokens:** Bypassed
- **Evidence:** Inline hex in AuthContext/Guards; `bg-white` + hardcoded rgba shadows in topic components. Canonical detail: see `APPLICATION_STYLING_ARCHITECTURE_AUDIT.md` → STYLE-ST-1, STYLE-ST-2.
- **Impact:** 6 localized token bypasses; breaks adaptive theming.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 1 h
- **Current Status:** Open

## Debt Register Summary

Findings are counted per report (each count is verifiable by counting finding blocks). Pointer findings are included — each is a tracked work item in its report's context.

| Report | Actionable | Informational/baseline | Primary items |
|---|---|---|---|
| `FOUNDATION_DEPENDENCY_GRAPH.md` | 2 (DEP-DG-1, DEP-DG-2) | 1 (DEP-DG-3) | layer inversions |
| `APPLICATION_ARCHITECTURE_AUDIT.md` | 4 (ARCH-AR-1…ARCH-AR-4) | 0 | inversions, doc colocation, god-module |
| `APPLICATION_STYLING_ARCHITECTURE_AUDIT.md` | 4 (STYLE-ST-1…STYLE-ST-3, STYLE-ST-5) | 1 (STYLE-ST-4) | inline hex, rgba shadows, fragmentation |
| `FOUNDATION_TOKEN_INTEGRITY_REPORT.md` | 2 (TOKEN-TI-1, TOKEN-TI-3) | 1 (TOKEN-TI-2) | chain-only tokens, bypasses |
| `FOUNDATION_CSS_ARCHITECTURE_REPORT.md` | 2 (CSS-CSS-1, CSS-CSS-2) | 2 (CSS-CSS-3, CSS-CSS-4) | build warnings, dual spacing |
| `FOUNDATION_COMPONENT_ARCHITECTURE_AUDIT.md` | 4 (COMP-CA-1…COMP-CA-4) | 0 | raw forms, wrappers, dialogs/loaders |
| `FOUNDATION_DUPLICATION_REPORT.md` | 6 (DUP-DU-1…DUP-DU-6) | 1 (DUP-DU-7) | card/dialog/loader duplication |
| `FOUNDATION_REUSABILITY_REPORT.md` | 4 (REUSE-RE-1…REUSE-RE-4) | 0 | dead hook, wrappers, loaders |
| `APPLICATION_TECHNICAL_DEBT_REPORT.md` | 7 (DEBT-TD-1…DEBT-TD-7) | 0 | lint, tests, vitest config, aggregate debt |
| `APPLICATION_PERFORMANCE_REPORT.md` | 4 (PERF-PF-1…PERF-PF-4) | 0 | chunks, dead CSS, md, utilities |
| `APPLICATION_ACCESSIBILITY_REPORT.md` | 4 (ACCESS-AC-1…ACCESS-AC-4) | 0 | contrast gates, adaptive contrast |
| `APPLICATION_SCALABILITY_REPORT.md` | 5 (SCAL-SC-2…SCAL-SC-6) | 1 (SCAL-SC-1) | growth risk, consolidation targets |
| **Total (13 reports)** | **48** | **7** | **55 reported findings** |

None is a new regression (all gates Δ0). All are pre-existing, tracked, and migration-time addressable. Unique actionable findings by canonical home: **25** (pointers reference the same underlying defect).

## Previous Certification Reconciliation

| Certification | Status | Reason |
|---|---|---|
| `FOUNDATION_MIGRATION_READINESS.md` (risks: 4 stragglers, 21 wrappers, contrast gates, vitest config) | Confirmed | All reproduced with identical evidence; no new debt introduced. |
| `FOUNDATION_FINAL_READINESS_REPORT.md` (93/100) | Partially Confirmed | Foundation-scope health confirmed; repository-scope debt (lint/test) quantified here. |

## Verdict

All technical debt is pre-existing, tracked, and non-regressing (Δ0). The heaviest items (343 lint errors, 33 test failures) predate Foundation certification and are remediation-phase work, not migration blockers.

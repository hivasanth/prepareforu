# FOUNDATION REUSABILITY REPORT

> Phase 5.5A — Repository Architecture & Styling Integrity Audit (READ-ONLY, documentation)

## Document Relationship

- **Depends On:** `FOUNDATION_COMPONENT_ARCHITECTURE_AUDIT.md`, `FOUNDATION_DUPLICATION_REPORT.md`
- **Related Reports:** `APPLICATION_TECHNICAL_DEBT_REPORT.md`, `FOUNDATION_DEPENDENCY_GRAPH.md`
- **Produces:** canonical finding REUSE-RE-1 (dead hook)
- **Consumed By:** `APPLICATION_TECHNICAL_DEBT_REPORT.md` (DEBT-TD-4), `APPLICATION_HEALTH_SCORE.md` (category 12)

## Repository State

- **Branch:** `phase-3.5` — **Commit:** `453b5d7` — **Audit target:** working tree on disk (dirty) — **Audit timestamp:** 2026-08-07

## Reusability Assessment

### Well-reused assets (verified)

| Asset | Consumers | Health |
|---|---|---|
| `AntigravityForm` Input/TextArea/Select/Switch/Checkbox/Radio/RadioGroup | pages, feature components | High (see COMP-CA-1) |
| `AdminModal` | `SharedComponents.tsx:3`, `SuccessModal.tsx:2` | High |
| `Menu` | `CollectionFilter.tsx:2`, `NotificationPanel.tsx:18`, `AntigravityUI.tsx:91` | High |
| Token layer (486 defs) | entire repository | High (0 dead tokens) |
| `AntigravityCard` | card consumers | High |
| `Skeleton` | skeleton consumers | High |

## Findings

### Finding REUSE-RE-1: Dead hook `useDashboardData` (0 consumers)
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Technical Debt
- **Owner:** Feature
- **Affected Files:** src/hooks/useDashboardData.ts:7
- **Affected Components:** None
- **Affected Tokens:** None
- **Evidence:** `src/hooks/useDashboardData.ts:7` defines `useDashboardData(userId?, examSelection?)`; **0 importers** anywhere in the repo.
- **Impact:** Dead code; removal or consolidation with the active dashboard data path simplifies the hooks layer.
- **Recommendation:** REMOVE
- **Recommended Phase:** Repository Hygiene
- **Estimated Effort:** 15 min
- **Current Status:** Open

### Finding REUSE-RE-2: Raw form elements reduce reuse (see component audit)
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Technical Debt
- **Owner:** Feature
- **Affected Files:** Feature components with raw forms
- **Affected Components:** AntigravityForm
- **Affected Tokens:** None
- **Evidence:** 18 raw form elements in feature components bypass `AntigravityForm`. Canonical detail: see `FOUNDATION_COMPONENT_ARCHITECTURE_AUDIT.md` → COMP-CA-1.
- **Impact:** Lost reuse; styling and a11y bypass risk.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 1 day
- **Current Status:** Open

### Finding REUSE-RE-3: Thin wrappers and card fragmentation reduce reuse clarity
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Repository Evidence
- **Classification:** Technical Debt
- **Owner:** Shared Components
- **Affected Files:** 21 wrappers, 20 Card components
- **Affected Components:** Feature wrappers/cards
- **Affected Tokens:** None
- **Evidence:** 21 thin wrappers (see `FOUNDATION_COMPONENT_ARCHITECTURE_AUDIT.md` → COMP-CA-2); 20 Card-named components (see `FOUNDATION_DUPLICATION_REPORT.md` → DUP-DU-2).
- **Impact:** Indirection without value; card recipes restated per feature.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 1 day
- **Current Status:** Open

### Finding REUSE-RE-4: Loader split reduces reuse clarity (see duplication report)
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Repository Evidence
- **Classification:** Technical Debt
- **Owner:** Shared Components
- **Affected Files:** Loader.tsx, PremiumLoader.tsx
- **Affected Components:** Loader, PremiumLoader
- **Affected Tokens:** None
- **Evidence:** `Loader.tsx` + `PremiumLoader.tsx`; consumers pick arbitrarily. Canonical detail: see `FOUNDATION_DUPLICATION_REPORT.md` → DUP-DU-5.
- **Impact:** Duplicated loader surface; no single Foundation loader.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 1 h
- **Current Status:** Open

## Reusability Score

**Reusability: 82/100** — primitives are genuine and well-adopted; deductions from REUSE-RE-1 (dead hook), REUSE-RE-2 (raw elements), REUSE-RE-3 (wrappers/cards), REUSE-RE-4 (loader split).

## Previous Certification Reconciliation

| Certification | Status | Reason |
|---|---|---|
| Reusability claims in `FOUNDATION_FINAL_READINESS_REPORT.md` | Partially Confirmed | Primitive adoption confirmed; wrapper/raw-element debt (REUSE-RE-2/REUSE-RE-3) newly quantified. |
| `FOUNDATION_MIGRATION_READINESS.md` (21 thin wrappers) | Confirmed | Reproduced (REUSE-RE-3). |

## Verdict

Reusability is strong at the primitive layer. The reuse debt (raw elements, wrappers, loader split, dead hook) is low/medium and migration-time addressable. No blocker.

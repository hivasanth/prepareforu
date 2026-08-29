# FOUNDATION COMPONENT ARCHITECTURE AUDIT

> Phase 5.5A — Repository Architecture & Styling Integrity Audit (READ-ONLY, documentation)

## Document Relationship

- **Depends On:** none (component inventory is primary-source)
- **Related Reports:** `FOUNDATION_DEPENDENCY_GRAPH.md`, `FOUNDATION_DUPLICATION_REPORT.md`, `FOUNDATION_REUSABILITY_REPORT.md`
- **Produces:** canonical findings COMP-CA-1, COMP-CA-2 (component-layer defects)
- **Consumed By:** `FOUNDATION_REUSABILITY_REPORT.md` (REUSE-RE-1, REUSE-RE-2), `FOUNDATION_DUPLICATION_REPORT.md`, `APPLICATION_HEALTH_SCORE.md` (categories 6–7)

## Repository State

- **Branch:** `phase-3.5` — **Commit:** `453b5d7` — **Audit target:** working tree on disk (dirty) — **Audit timestamp:** 2026-08-07

## Component Inventory (`src/components/common/`)

The `common/` directory is the Foundation presentation layer. Verified primitives:

| Component | Export location | Role |
|---|---|---|
| `AntigravityButton` | `AntigravityButton.tsx` | Button (management/premium/secondary, material tokens) |
| `AntigravityCard` | `AntigravityCard.tsx` | Card with `management-surface` tokens (L34) |
| `AntigravityTypography` | `AntigravityTypography.tsx` | Headings/Body via text tokens |
| `AntigravityForm` | `AntigravityForm.tsx` | Input (L21), TextArea (L81), Select (L124), Switch (L188), Checkbox (L241), Radio (L299), RadioGroup (L356) |
| `AntigravityData` | `AntigravityData.tsx` | Tabs component (tab-pill tokens, L82/102/127) |
| `AntigravityLayout` | `AntigravityLayout.tsx` | Gap/spacing map via `gap-[var(--space-N)]` (L116-124) |
| `AntigravityMotion` | `AntigravityMotion.ts` | Motion/transition constants |
| `Menu` | `Menu.tsx` | Dropdown menu (management/floating, L266-267) |
| `AdminModal` | `AdminModal.tsx` | Portal dialog with FocusTrap (L2,4,98-111) |
| `PremiumSelect` | `PremiumSelect.tsx` | Self-contained select dialog (no AdminModal/Menu import) |
| `Pill` | `Pill.tsx` | Pill with management tokens (L121,142) |
| `Skeleton` | `Skeleton.tsx` | Skeleton loaders (premium/management) |
| `CollectionFilter` | `CollectionFilter.tsx` | Filter with management tokens (L57-59) |
| `SharedComponents` | `SharedComponents.tsx` | LoadingSkeleton (L13), GridSkeleton (L26), StatSkeleton (L36), LoadingOverlay (L66), ErrorState (L99), EmptyState (L144), ConfirmModal (L196) |
| `IconBadge` | `AntigravityUI.tsx` (L91 re-exports Menu) | Icon container |

## Findings

### Finding COMP-CA-1: Raw form elements bypass Foundation form primitives
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Technical Debt
- **Owner:** Feature
- **Affected Files:** Feature components/pages (225 files scanned)
- **Affected Components:** AntigravityForm
- **Affected Tokens:** None
- **Evidence:** Raw-element scan of feature components (`src/components`, `src/pages`, 225 files): **12 `<input>`, 2 `<select>`, 4 `<textarea>`** (18 total) use raw HTML instead of `AntigravityForm` (Input/TextArea/Select/Switch/Checkbox/Radio/RadioGroup, L21/81/124/188/241/299/356).
- **Impact:** Lost reuse opportunity; bypasses Foundation label/error/styling semantics; accessibility risk (see `APPLICATION_ACCESSIBILITY_REPORT.md` ACCESS-AC-4).
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 1 day
- **Current Status:** Open

### Finding COMP-CA-2: 21 thin wrappers add no behavior over primitives
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Repository Evidence
- **Classification:** Technical Debt
- **Owner:** Shared Components
- **Affected Files:** 21 wrapper components
- **Affected Components:** Feature wrappers
- **Affected Tokens:** None
- **Evidence:** Re-confirmed as documented in `FOUNDATION_MIGRATION_READINESS.md`; wrapper components add no behavior over Foundation primitives.
- **Impact:** Indirection without value; increases maintenance surface.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 1 day
- **Current Status:** Open

### Finding COMP-CA-3: Loader split and dialog duplication (see canonical reports)
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Technical Debt
- **Owner:** Shared Components
- **Affected Files:** Loader.tsx, PremiumLoader.tsx, AdminModal.tsx, PremiumSelect.tsx, LanguageSelectionScreen.tsx
- **Affected Components:** Loaders, dialogs
- **Affected Tokens:** None
- **Evidence:** Two loaders + two inline loaders; four dialog/overlay implementations. Canonical detail: see `FOUNDATION_DUPLICATION_REPORT.md` → DUP-DU-4, DUP-DU-5, DUP-DU-6.
- **Impact:** Component surface fragmented; consumers pick arbitrarily.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 1 day
- **Current Status:** Open

### Finding COMP-CA-4: Layer inversion — context/guards re-implement loading UI
- **Severity:** High
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Architectural Defect
- **Owner:** Feature
- **Affected Files:** src/context/AuthContext.tsx:44-67, src/guards/Guards.tsx:1-20
- **Affected Components:** FullLoader, GuardLoader
- **Affected Tokens:** Bypassed
- **Evidence:** `AuthContext.tsx:44-67` and `Guards.tsx:1-20` import `Loader` from `../components/Loader` and define `FullLoader`/`GuardLoader` with inline styles. Canonical detail: see `FOUNDATION_DEPENDENCY_GRAPH.md` → DEP-DG-1.
- **Impact:** Presentation owned outside the Foundation; token bypass (see `APPLICATION_STYLING_ARCHITECTURE_AUDIT.md` → STYLE-ST-1).
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 15 min
- **Current Status:** Open

## Component Stability Score

**Component Stability: 74/100** — derived and reported centrally in `APPLICATION_HEALTH_SCORE.md` as the average of Component Architecture (78), Reusability (82), Duplication/DRY (65), and Dead Code (72) = (78+82+65+72)/4.

| Factor | Effect | Notes |
|---|---|---|
| Architecture primitives stable & frozen | positive | No changes to `common/` primitives observed |
| Behavior/API drift (tests) | moderate | 33 failing component tests assert old classes (pre-existing) |
| Layer compliance | negative | COMP-CA-4 inversions; dialog duplication |
| Duplication/wrapper debt | negative | COMP-CA-2, COMP-CA-3 tracked |

## Previous Certification Reconciliation

| Certification | Status | Reason |
|---|---|---|
| `FOUNDATION_ARCHITECTURE_CERTIFICATION.md` ("one owner per concern, no duplicate renderers") | Partially Confirmed | No duplicate renderers confirmed; dialog-layer duplication (DUP-DU-4) and loader split (DUP-DU-5) are duplicate concerns sharing presentation responsibility. |
| `FOUNDATION_MIGRATION_READINESS.md` (21 thin wrappers) | Confirmed | Reproduced (COMP-CA-2). |

## Verdict

Foundation component layer is stable and migration-ready. Component-layer debt (raw form elements, wrappers, loaders, dialogs) is tracked and referenced from its canonical reports. No single finding blocks migration start.

# FOUNDATION DEPENDENCY GRAPH

> Phase 5.5A — Repository Architecture & Styling Integrity Audit (READ-ONLY, documentation)

## Document Relationship

- **Depends On:** none (primary-source analysis of import edges)
- **Related Reports:** `FOUNDATION_COMPONENT_ARCHITECTURE_AUDIT.md`, `FOUNDATION_REUSABILITY_REPORT.md`, `APPLICATION_ARCHITECTURE_AUDIT.md`
- **Produces:** canonical findings DEP-DG-1, DEP-DG-2 (layer inversions)
- **Consumed By:** `APPLICATION_ARCHITECTURE_AUDIT.md` (ARCH-AR-1, ARCH-AR-2), `APPLICATION_SCALABILITY_REPORT.md` (SCAL-SC-2), `APPLICATION_HEALTH_SCORE.md` (category 5)

## Repository State

- **Branch:** `phase-3.5` — **Commit:** `453b5d7` — **Audit target:** working tree on disk (dirty) — **Audit timestamp:** 2026-08-07

## Intended Layering

Expected dependency direction: `pages → guards/context → components → common → styles`.

```
pages/        page compositions (Splash, Admin, User, SubAdmin, Exam)
guards/       auth/route guards
context/      AuthContext
components/   feature + shared + common (Foundation primitives)
hooks/        shared hooks
services/     API/data layer
utils/        pure helpers
styles/       themes.css (frozen tokens)
index.css     Tailwind v4 + resets (frozen)
```

## Dependency Diagram

```
┌──────────────┐
│  pages/      │  page compositions
└──────┬───────┘
       │
       ▼
┌──────────────┐        ┌──────────────────┐
│ guards/      │◄───────│ context/         │
│ context/     │        │ (AuthContext)    │
└──────┬───────┘        └──────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ components/ (feature/shared) │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ components/common/  (Foundation)         │
│ AntigravityButton/Card/Form/Data/Layout  │
│ Menu · AdminModal · Skeleton · Pill      │
└──────┬───────────────────────────────────┘
       │
       ▼
┌─────────────────────┐
│ styles/themes.css   │  frozen token layer
│ index.css           │  Tailwind v4 + resets
└─────────────────────┘
```

**Inversion edges (violate the intended direction):**

```
context/  ──►  components/Loader      DEP-DG-1  (must not depend on presentation)
guards/   ──►  components/Loader      DEP-DG-1
feature components ──► pages/exam/hooks  DEP-DG-2  (reverse direction)
```

## Findings

### Finding DEP-DG-1: Context and guards depend on a presentation component (Loader)
- **Severity:** High
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Architectural Defect
- **Owner:** Feature
- **Affected Files:** src/context/AuthContext.tsx:44-67, src/guards/Guards.tsx:1-20
- **Affected Components:** AuthContext, Guards, Loader
- **Affected Tokens:** None
- **Evidence:** `src/context/AuthContext.tsx:44-67` imports `Loader` from `../components/Loader` and defines `FullLoader` with inline styles; `src/guards/Guards.tsx:1-20` imports `Loader` from `../components/Loader` and defines `GuardLoader` with inline styles.
- **Impact:** Violates the intended layering `pages → guards/context → components → common → styles`. Presentation concern is owned by non-presentation layers; the loading UI is re-implemented outside the Foundation, so it cannot be themed or A/B-consistent with the token layer.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 15 min
- **Current Status:** Open

### Finding DEP-DG-2: Feature components depend on page-level hooks
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Architectural Defect
- **Owner:** Feature
- **Affected Files:** src/components/exam/useActiveExam.tsx:14, src/pages/exam/hooks/*
- **Affected Components:** Exam feature components
- **Affected Tokens:** None
- **Evidence:** `src/components/exam/useActiveExam.tsx:14` defines a hook consumed by feature components; feature components import from `src/pages/exam/hooks/*`, reversing the `page → component` dependency direction.
- **Impact:** Reverses layering and couples `components/` to `pages/`, making the feature layer non-reusable in isolation and harder to test.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** half day
- **Current Status:** Open

### Finding DEP-DG-3: Healthy composition within the common layer (baseline)
- **Severity:** Informational
- **Confidence:** High
- **Verification Method:** Repository Evidence
- **Classification:** Informational
- **Owner:** Foundation
- **Affected Files:** SharedComponents.tsx:3, SuccessModal.tsx:2, AntigravityUI.tsx:91, CollectionFilter.tsx:2, NotificationPanel.tsx:18
- **Affected Components:** Common layer
- **Affected Tokens:** None
- **Evidence:** `SharedComponents.tsx:3` imports `AdminModal`; `SuccessModal.tsx:2` imports `AdminModal`; `AntigravityUI.tsx:91` re-exports `Menu`; `CollectionFilter.tsx:2` and `NotificationPanel.tsx:18` import `Menu`. All composition edges stay inside `common/`.
- **Impact:** No action required. Confirms the common layer composes correctly.
- **Recommendation:** KEEP
- **Recommended Phase:** None
- **Estimated Effort:** Unknown
- **Current Status:** Open

## Dependency Graph Summary

| Layer | Outgoing to | Health |
|---|---|---|
| `styles/` (themes.css, index.css) | — | Healthy (frozen) |
| `common/` primitives | styles only | Healthy |
| `components/` | common, hooks, services | Healthy |
| `context/` | components (INVERSION) | DEP-DG-1 |
| `guards/` | components (INVERSION) | DEP-DG-1 |
| `pages/exam/hooks` + `components/exam` | page hooks (INVERSION) | DEP-DG-2 |

No circular dependencies detected among the inspected layers.

## Previous Certification Reconciliation

| Certification | Status | Reason |
|---|---|---|
| `FOUNDATION_ARCHITECTURE_CERTIFICATION.md` ("one owner per concern") | Partially Confirmed | No renderer duplication confirmed, but DEP-DG-1/DEP-DG-2 show presentation concern owned outside `common/`. |
| `FOUNDATION_MIGRATION_READINESS.md` (4 critical consumer stragglers) | Confirmed | Stragglers correspond to the DEP-DG-1/DEP-DG-2 inversion consumers. |

## Verdict

Clean except for two localized inversions (DEP-DG-1, DEP-DG-2). No cycles. Pre-existing, low-effort to remediate, and not migration blockers.

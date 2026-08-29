# APPLICATION ARCHITECTURE AUDIT

> Phase 5.5A — Repository Architecture & Styling Integrity Audit (READ-ONLY, documentation)

## Document Relationship

- **Depends On:** `FOUNDATION_DEPENDENCY_GRAPH.md`, `FOUNDATION_COMPONENT_ARCHITECTURE_AUDIT.md`
- **Related Reports:** `APPLICATION_STYLING_ARCHITECTURE_AUDIT.md`, `APPLICATION_SCALABILITY_REPORT.md`
- **Produces:** canonical findings ARCH-AR-1, ARCH-AR-2, ARCH-AR-3, ARCH-AR-4; application-layer diagram
- **Consumed By:** `APPLICATION_SCALABILITY_REPORT.md` (SCAL-SC-4, SCAL-SC-5), `APPLICATION_HEALTH_SCORE.md` (categories 5, 17), `APPLICATION_TECHNICAL_DEBT_REPORT.md`

## Repository State

- **Branch:** `phase-3.5` — **Commit:** `453b5d7` — **Audit target:** working tree on disk (dirty) — **Audit timestamp:** 2026-08-07
- **Files in `src/`:** 441 (242 `.tsx`, 142 `.ts`, 2 `.css`, 55 colocated `.md`)

## Application Layer Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ pages/  Splash · Admin · User · SubAdmin · Exam              │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ guards/  Guards ·  context/  AuthContext                     │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ components/                                                   │
│  admin/ (leaderboard, questions, settings, sub-admins)        │
│  user/  (educator-exams, leaderboard, performance, topics)    │
│  exam/  (QuestionCard, LanguageSelectionScreen, hooks)        │
│  sub-admin/ (create, exams, dashboard, students)              │
│  visualizers/  MapVisualizer                                  │
│  Loader.tsx · PremiumLoader.tsx                               │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ hooks/  useDashboardData (dead)  ·  useActiveExam (page)      │
│ services/ · utils/ · config/ · data/                          │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ styles/ themes.css  ·  index.css                              │
└──────────────────────────────────────────────────────────────┘
```

The structure is domain-organized and consistent. Weaknesses: layer inversions (see `FOUNDATION_DEPENDENCY_GRAPH.md` DEP-DG-1/DEP-DG-2), colocated docs (ARCH-AR-3), god-module risk (ARCH-AR-4).

## Findings

### Finding ARCH-AR-1: Context and guards invert layering (see dependency graph)
- **Severity:** High
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Architectural Defect
- **Owner:** Feature
- **Affected Files:** src/context/AuthContext.tsx, src/guards/Guards.tsx
- **Affected Components:** AuthContext, Guards
- **Affected Tokens:** None
- **Evidence:** `AuthContext.tsx:44-67`, `Guards.tsx:1-20` import `Loader` and define `FullLoader`/`GuardLoader` with inline styles. Canonical detail: see `FOUNDATION_DEPENDENCY_GRAPH.md` → DEP-DG-1.
- **Impact:** Presentation owned outside `common/`; token bypass.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 15 min
- **Current Status:** Open

### Finding ARCH-AR-2: Feature components depend on page-level hooks (see dependency graph)
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Architectural Defect
- **Owner:** Feature
- **Affected Files:** src/components/exam/useActiveExam.tsx, src/pages/exam/hooks/*
- **Affected Components:** Exam feature components
- **Affected Tokens:** None
- **Evidence:** `src/components/exam/useActiveExam.tsx:14`; feature components import from `src/pages/exam/hooks/*`. Canonical detail: see `FOUNDATION_DEPENDENCY_GRAPH.md` → DEP-DG-2.
- **Impact:** Reverses page → component dependency; couples feature layer to pages.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** half day
- **Current Status:** Open

### Finding ARCH-AR-3: 55 documentation `.md` files colocated inside `src/`
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Repository Evidence
- **Classification:** Preference
- **Owner:** Documentation
- **Affected Files:** 55 .md files under src/
- **Affected Components:** None
- **Affected Tokens:** None
- **Evidence:** 55 `.md` audit/log/governance files under `src/` (e.g. `FOUNDATION_GOVERNANCE.md`, `FOUNDATION_FREEZE_REGISTER.md`, language/motion/typography specifications). They are documentation, not code.
- **Impact:** Pollutes source tooling and lint/test scanning; docs should live under `docs/`.
- **Recommendation:** REMOVE
- **Recommended Phase:** Repository Hygiene
- **Estimated Effort:** 1 day
- **Current Status:** Open

### Finding ARCH-AR-4: God-module risk in `AntigravityData.tsx` / `SharedComponents.tsx`
- **Severity:** Low
- **Confidence:** Medium
- **Verification Method:** Manual Review
- **Classification:** Preference
- **Owner:** Shared Components
- **Affected Files:** src/components/common/AntigravityData.tsx, src/components/common/SharedComponents.tsx
- **Affected Components:** AntigravityData, SharedComponents
- **Affected Tokens:** None
- **Evidence:** `AntigravityData.tsx` bundles Tabs + tab-track + theming; `SharedComponents.tsx` bundles 7 exports (LoadingSkeleton, GridSkeleton, StatSkeleton, LoadingOverlay, ErrorState, EmptyState, ConfirmModal).
- **Impact:** Module size trending toward god-module; will attract more exports as pages migrate.
- **Recommendation:** DEFER
- **Recommended Phase:** Deferred
- **Estimated Effort:** half day
- **Current Status:** Open

## Architecture Score

**Architecture: 83/100.** Good with 3 localized inversions (DEP-DG-1 ×2 edges, DEP-DG-2), colocated docs, and god-module risk. See `APPLICATION_HEALTH_SCORE.md` category 5 for derivation.

## Previous Certification Reconciliation

| Certification | Status | Reason |
|---|---|---|
| `FOUNDATION_ARCHITECTURE_CERTIFICATION.md` ("one owner per concern") | Partially Confirmed | Presentation concern owned by `common/`, but AuthContext/Guards still host inline presentation (DEP-DG-1). |
| `FOUNDATION_MIGRATION_READINESS.md` (4 critical consumer stragglers) | Confirmed | Stragglers map to DEP-DG-1/DEP-DG-2 inversion consumers. |

## Verdict

Application architecture is sound: domain-organized, cycle-free, with a small pre-existing set of layer inversions. None block page-by-page migration; DEP-DG-1/DEP-DG-2 are 15 min–half-day fixes best done as pages migrate.

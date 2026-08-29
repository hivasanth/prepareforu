# TECHNICAL DEBT DASHBOARD

> Phase 5.5B — The repository implementation backlog. Every actionable finding across all audit reports is indexed by its globally-unique ID. This dashboard does **not** duplicate descriptions; it references the canonical finding. Sort order: severity, then effort.

## Field Legend

| Column | Meaning | Values |
|---|---|---|
| ID | Global finding ID | See `README.md` ID standard |
| Title | Short title | — |
| Severity | Priority | Critical / High / Medium / Low |
| Owner | Responsible layer | Foundation / Shared Components / Feature / Page / Infrastructure / Governance / Documentation |
| Phase | When to address | Migration / Foundation Cleanup / Quality Gate / Post-Migration / Repository Hygiene |
| Effort | Estimate | e.g. 15 min, 1 h, 1 day |
| Status | State | Open / Tracked |

## Debt Register

| ID | Title | Severity | Owner | Classification | Phase | Effort | Status |
|---|---|---|---|---|---|---|---|
| DEBT-TD-1 | Lint: 343 errors / 53 warnings (Δ0) | High | Infrastructure | Technical Debt | Post-Migration | 2 days | Open |
| DEBT-TD-2 | 33 failing tests (assertion-drift, Δ0) | High | Infrastructure | Technical Debt | Migration | 1 day | Open |
| DEP-DG-1 | Context/guards → Loader inversion | High | Feature | Architectural Defect | Migration (1st) | 15 min | Open |
| ARCH-AR-1 | Context/guards invert layering (DUP-DU-1) | High | Feature | Architectural Defect | Migration (1st) | 15 min | Open |
| ACCESS-AC-1 | Contrast gates C-1…C-5 OPEN | High | Foundation | Technical Debt | Forward gate | 1 day | Open |
| TOKEN-TI-3 | 6 non-token color bypasses | Medium | Feature | Technical Defect | Migration | 1 h | Open |
| STYLE-ST-1 | Inline-style bypasses in context/guards | High | Feature | Technical Debt | Migration (1st) | 15 min | Open |
| STYLE-ST-2 | Hardcoded rgba shadows / `bg-white` | Medium | Feature | Technical Debt | Migration | 1 h | Open |
| DEBT-TD-7 | Styling bypass debt | Medium | Feature | Technical Debt | Migration | 1 h | Open |
| DEP-DG-2 | Feature components depend on page hooks | Medium | Feature | Architectural Defect | Migration | half day | Open |
| ARCH-AR-2 | Feature components use page hooks (MM) | Medium | Feature | Architectural Defect | Migration | half day | Open |
| COMP-CA-1 | 18 raw form elements bypass AntigravityForm | Medium | Feature | Technical Debt | Migration (page-scoped) | 1 day | Open |
| REUSE-RE-2 | Raw form elements reduce reuse | Medium | Feature | Technical Debt | Migration | 1 day | Open |
| COMP-CA-2 | 21 thin wrappers add no behavior | Low | Shared Components | Technical Debt | Migration | 1 day | Open |
| COMP-CA-3 | Loader split + dialog duplication | Medium | Shared Components | Technical Debt | Migration | 1 day | Open |
| ARCH-AR-4 | God-module risk (AntigravityData/SharedComponents) | Low | Shared Components | Preference | Migrated/Deferred | half day | Open |
| SCAL-SC-2 | Layer inversions threaten growth coherence | Medium | Feature | Architectural Defect | Migration | half day | Open |
| PERF-PF-1 | Large chunk sizes (>500 kB) | Medium | Infrastructure | Technical Debt | Post-Migration | Unknown | Open |
| SCAL-SC-1 | Domain folders scale well (baseline) | Informational | Governance | Preference | No action | Unknown | Open |

**Key:** remaining items — see the full register below.

## Full Backlog (all findings, by report)

### Quality Gates (`APPLICATION_TECHNICAL_DEBT_REPORT.md`)

| ID | Title | Severity | Owner | Phase | Effort | Status |
|---|---|---|---|---|---|---|
| DEBT-TD-1 | Lint: 343 errors / 53 warnings (Δ0) | High | Infrastructure | Post-Migration | 2 days | Open |
| DEBT-TD-2 | 33 failing tests (Δ0) | High | Infrastructure | Post-Migration | 1 day | Open |
| DEBT-TD-3 | `vitest.config.ts` ERR_REQUIRE_ESM | Medium | Infrastructure | Repository Hygiene | 15 min | Open |
| DEBT-TD-4 | Dead hook `useDashboardData` | Low | Feature | Repository Hygiene | 15 min | Open |
| DEBT-TD-5 | 55 chain-only tokens | Low | Foundation | Repository Hygiene | 1 h | Open |
| DEBT-TD-6 | Duplication debt (DUP-DU-1…DUP-DU-7) | Medium | Shared Components | Migration | 1 day | Open |
| DEBT-TD-7 | Styling bypass debt (STYLE-ST-1, STYLE-ST-2) | Medium | Feature | Migration | 1 h | Open |

### Architecture (`APPLICATION_ARCHITECTURE_AUDIT.md`)

| ID | Title | Severity | Owner | Phase | Effort | Status |
|---|---|---|---|---|---|---|
| ARCH-AR-1 | Context/guards invert layering | High | Feature | Migration | 15 min | Open |
| ARCH-AR-2 | Feature components use page-level hooks | Medium | Feature | Migration | half day | Open |
| ARCH-AR-3 | 55 `.md` colocated in `src/` | Medium | Documentation | Repository Hygiene | 1 day | Open |
| ARCH-AR-4 | God-module risk (AntigravityData/Shared) | Low | Shared Components | Foundation | half day | Open |

### Dependency Graph (`FOUNDATION_DEPENDENCY_GRAPH.md`)

| ID | Title | Severity | Owner | Phase | Effort | Status |
|---|---|---|---|---|---|---|
| DEP-DG-1 | Context/guards → Loader inversion | High | Feature | Migration | 15 min | Open |
| DEP-DG-2 | Feature → page-hooks inversion | Medium | Feature | Migration | half day | Open |
| DEP-DG-3 | Common-layer composition (baseline) | Informational | Foundation | No | Unknown | Open |

### Styling (`APPLICATION_STYLING_ARCHITECTURE_AUDIT.md`)

| ID | Title | Severity | Owner | Phase | Effort | Status |
|---|---|---|---|---|---|---|
| STYLE-ST-1 | Inline bypasses in context/guards | High | Feature | Migration | 15 min | Open |
| STYLE-ST-2 | rgba shadows / bg-white | Medium | Feature | Migration | 1 h | Open |
| STYLE-ST-3 | Arbitrary pixel font-size fragmentation | Low | Feature | Defacto | Post-Migration | half day | Open |
| STYLE-ST-4 | `light:` variant usage correct (baseline) | Informational | Foundation | No | Unknown | Open |
| STYLE-ST-5 | 4 CSS optimizer warnings | Low | Foundation | Repository Hygiene | 1 h | Open |

### Token (`FOUNDATION_TOKEN_INTEGRITY_REPORT.md`)

| ID | Title | Severity | Owner | Phase | Effort | Status |
|---|---|---|---|---|---|---|
| TOKEN-TI-1 | 55 chain-only tokens unconsumed | Low | Foundation | Repository Hygiene | 1 h | Open |
| TOKEN-TI-2 | Token consumption discipline high (baseline) | Informational | Foundation | No | Unknown | Open |
| TOKEN-TI-3 | Rare non-token color bypasses | Medium | Feature | Repository Hygiene | 1 h | Open |

### CSS (`FOUNDATION_CSS_ARCHITECTURE_REPORT.md`)

| ID | Title | Severity | Owner | Phase | Effort | Status |
|---|---|---|---|---|---|---|
| CSS-CSS-1 | 4 Tailwind optimizer warnings | Low | Foundation | Repository Hygiene | 1 h | Open |
| CSS-CSS-2 | Dual spacing consumption paths | Low | Foundation | Keep | Unknown | Open |
| CSS-CSS-3 | No per-component CSS layers (baseline) | Informational | Foundation | No | Unknown | Open |
| CSS-CSS-4 | Tailwind-default utilities (non-issue) | Informational | Foundation | No | Unknown | Open |

### Component Architecture (`FOUNDATION_COMPONENT_ARCHITECTURE_AUDIT.md`)

| ID | Title | Severity | Owner | Phase | Effort | Status |
|---|---|---|---|---|---|---|
| COMP-CA-1 | 18 raw form elements bypass primitives | Medium | Feature | Migration | 1 day | Open |
| COMP-CA-2 | 21 thin wrappers | Low | Shared Components | Migration | 1 day | Open |
| COMP-CA-3 | Loader split + dialog duplication | Medium | Shared Components | Migration | 1 day | Open |
| COMP-CA-4 | Context/guards re-implement loading UI | High | Feature | Migration | 15 min | Open |

### Duplication (`FOUNDATION_DUPLICATION_REPORT.md`)

| ID | Title | Severity | Owner | Phase | Effort | Status |
|---|---|---|---|---|---|---|
| DUP-DU-1 | Two `QuestionCard` components | Medium | Feature | Migration | half day | Open |
| DUP-DU-2 | 20 Card-named components | Low | Feature | Foundation | half day | Open |
| DUP-DU-3 | Tab-pill class string ×2 | Low | Shared Components | Migration | 1 h | Open |
| DUP-DU-4 | Four dialog/overlay implementations | Medium | Shared Components | Migration | 1 day | Open |
| DUP-DU-5 | Loader split (2 + 2 inline) | Medium | Shared Components | Migration | 1 h | Open |
| DUP-DU-6 | Skeleton duplication | Low | Shared Components | Legacy | 1 h | Open |
| DUP-DU-7 | 146 token redefinitions (intentional) | Informational | Foundation | No | Unknown | Open |

### Reusability (`FOUNDATION_REUSABILITY_REPORT.md`)

| ID | Title | Severity | Owner | Phase | Effort | Status |
|---|---|---|---|---|---|---|
| REUSE-RE-1 | Dead hook `useDashboardData` | Low | Feature | Repository Hygiene | 15 min | Open |
| REUSE-RE-2 | Raw form elements reduce reuse | Medium | Feature | Migration | 1 day | Open |
| REUSE-RE-3 | Thin wrappers / card fragmentation | Low | Shared Components | Migration | 1 day | Open |
| REUSE-RE-4 | Loader split | Low | Shared Components | Migration | 1 h | Open |

### Accessibility (`APPLICATION_ACCESSIBILITY_REPORT.md`)

| ID | Title | Severity | Owner | Phase | Effort | Status |
|---|---|---|---|---|---|---|
| ACCESS-AC-1 | Contrast gates C-1…C-5 OPEN | High | Foundation | Forward | 1 day | Open |
| ACCESS-AC-2 | Inline-style loaders light-mode-blind | Medium | Feature | Migration | 15 min | Open |
| ACCESS-AC-3 | rgba shadows / bg-white adaptive contrast | Low | Feature | Migration | 1 h | Open |
| ACCESS-AC-4 | Raw form label wiring | Low | Feature | Migration | half day | Open |

### Performance (`APPLICATION_PERFORMANCE_REPORT.md`)

| ID | Title | Severity | Owner | Phase | Effort | Status |
|---|---|---|---|---|---|---|
| PERF-PF-1 | Large chunk sizes | Medium | Infrastructure | Post-Migration | Unknown | Open |
| PERF-PF-2 | Dead CSS classes | Low | Foundation | Repository Hygiene | 1 h | Open |
| PERF-PF-3 | 55 colocated `.md` ship in source | Low | Documentation | Repository Hygiene | 1 day | Open |
| PERF-PF-4 | Arbitrary utility proliferation | Low | Feature | Post-Migration | half day | Open |

### Scalability (`APPLICATION_SCALABILITY_REPORT.md`)

| ID | Title | Severity | Owner | Phase | Effort | Status |
|---|---|---|---|---|---|---|
| SCAL-SC-1 | Domain-organized folders scale well (baseline) | Informational | Governance | No | Unknown | Open |
| SCAL-SC-2 | Layer inversions threaten growth coherence | Medium | Feature | Migration | half day | Open |
| SCAL-SC-3 | Card/dialog/loader fragmentation | Medium | Shared Components | Migration | 1 day | Open |
| SCAL-SC-4 | Raw form element sprawl | Low | Feature | Migration | 1 day | Open |
| SCAL-SC-5 | God-module pressure | Low | Shared Components | Foundation | half day | Open |
| SCAL-SC-6 | 55 `.md` in `src/` growth | Low | Documentation | Repository Hygiene | 1 day | Open |

### Foundation Integrity
| ID | Title | Severity | Owner | Phase | Effort | Status |
|---|---|---|---|---|---|---|
| FOUND-FI-1 | Loader re-implementation in context/guards | High | Feature | Migration | 15 min | Open |
| FOUND-FI-2 | Two parallel loader implementations | Medium | Shared Components | Migration | 1 h | Open |

## Summary

- **48 actionable findings, 7 informational/baseline** (55 reported total).
- **25 unique actionable findings** by canonical home (pointers reference the same underlying defect).
- All are **pre-existing, Δ0, non-regressing**.
- Highest-priority migration work items: **DEP-DG-1 / STYLE-ST-1 / ARCH-AR-1 / COMP-CA-4** (canonical loader inversion) — address first as pages migrate.

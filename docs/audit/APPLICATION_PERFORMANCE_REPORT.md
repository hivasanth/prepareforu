# APPLICATION PERFORMANCE REPORT

> Phase 5.5A — Repository Architecture & Styling Integrity Audit (READ-ONLY, documentation)

## Document Relationship

- **Depends On:** `FOUNDATION_CSS_ARCHITECTURE_REPORT.md`, `APPLICATION_ARCHITECTURE_AUDIT.md`
- **Related Reports:** `APPLICATION_STYLING_ARCHITECTURE_AUDIT.md`, `APPLICATION_TECHNICAL_DEBT_REPORT.md`
- **Produces:** canonical finding PERF-PF-1; pointer findings PERF-PF-2, PERF-PF-3, PERF-PF-4
- **Consumed By:** `APPLICATION_HEALTH_SCORE.md` (category 15)

## Repository State

- **Branch:** `phase-3.5` — **Commit:** `453b5d7` — **Audit target:** working tree on disk (dirty) — **Audit timestamp:** 2026-08-07

## Performance Baseline

| Metric | Value |
|---|---|
| Production build | exit 0, ~145 s, 5598 modules |
| Generated CSS | ~234 kB raw / ~33.9 kB gzip |
| Bundle | Pre-existing >500 kB chunk warnings |
| CSS optimizer warnings | 4 (cosmetic; see `FOUNDATION_CSS_ARCHITECTURE_REPORT.md` CSS-CSS-1) |
| Runtime test suite | 301 passed / 33 failed (~74 s) |

## Findings

### Finding PERF-PF-1: Large chunk sizes (pre-existing >500 kB warnings)
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Build Verification
- **Classification:** Technical Debt
- **Owner:** Infrastructure
- **Affected Files:** Build output (chunk warnings)
- **Affected Components:** None
- **Affected Tokens:** None
- **Evidence:** Build emits pre-existing >500 kB chunk-size warnings; 5598 modules bundle into large chunks. No code-splitting audit was performed (out of READ-ONLY scope).
- **Impact:** Initial-load payload above recommended threshold; post-migration optimization target.
- **Recommendation:** DEFER
- **Recommended Phase:** Post-Migration
- **Estimated Effort:** Unknown
- **Current Status:** Open

### Finding PERF-PF-2: Dead CSS classes from arbitrary-value utilities (see CSS report)
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Build Verification
- **Classification:** Technical Debt
- **Owner:** Foundation
- **Affected Files:** Generated CSS (~234 kB)
- **Affected Components:** None
- **Affected Tokens:** None
- **Evidence:** Build CSS includes `.bg-[var(--management-*)]`, `.text-[var(--text-*)]`, `.border-[length:var(--…)]` classes that never match rendered elements. Canonical detail: see `FOUNDATION_CSS_ARCHITECTURE_REPORT.md` → CSS-CSS-1.
- **Impact:** Tiny CSS savings; cosmetic.
- **Recommendation:** DEFER
- **Recommended Phase:** Repository Hygiene
- **Estimated Effort:** 1 h
- **Current Status:** Open

### Finding PERF-PF-3: 55 colocated `.md` files ship in source (see architecture audit)
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Repository Evidence
- **Classification:** Preference
- **Owner:** Documentation
- **Affected Files:** 55 .md files under src/
- **Affected Components:** None
- **Affected Tokens:** None
- **Evidence:** 55 `.md` files under `src/`. Canonical detail: see `APPLICATION_ARCHITECTURE_AUDIT.md` → ARCH-AR-3.
- **Impact:** Pollutes source tooling and lint/test scanning; md files aren't JS modules unless imported, so runtime impact is minimal.
- **Recommendation:** REMOVE
- **Recommended Phase:** Repository Hygiene
- **Estimated Effort:** 1 day
- **Current Status:** Open

### Finding PERF-PF-4: Arbitrary utility class proliferation (see styling audit)
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Preference
- **Owner:** Feature
- **Affected Files:** Feature components using arbitrary utilities
- **Affected Components:** Feature components
- **Affected Tokens:** None
- **Evidence:** `text-[8px]`…`text-[16px]`, `shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.12)]`-family, `gap-[var(--space-N)]`. Canonical detail: see `APPLICATION_STYLING_ARCHITECTURE_AUDIT.md` → STYLE-ST-3.
- **Impact:** Each arbitrary value forces Tailwind to keep an extra class in the CSS output.
- **Recommendation:** DEFER
- **Recommended Phase:** Post-Migration
- **Estimated Effort:** half day
- **Current Status:** Open

## Performance Score

**Performance: 82/100.** No runtime hot-path regression detected (no profiling run — out of READ-ONLY scope). All findings are pre-existing, build-time, and post-migration optimizable. See `APPLICATION_HEALTH_SCORE.md` category 15 for derivation.

## Previous Certification Reconciliation

| Certification | Status | Reason |
|---|---|---|
| Performance claims in `FOUNDATION_FINAL_READINESS_REPORT.md` | Partially Confirmed | Build/TS integrity confirmed (Δ0); chunk-size and CSS-warning findings newly recorded. |

## Verdict

Performance is healthy and non-regressing: build exits 0, bundle warnings pre-existing, no runtime red flags. Optimization opportunities (chunk splitting, dead CSS, md files) are post-migration targets — none blocks migration.

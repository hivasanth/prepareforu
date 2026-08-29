# APPLICATION ACCESSIBILITY REPORT

> Phase 5.5A — Repository Architecture & Styling Integrity Audit (READ-ONLY, documentation)

## Document Relationship

- **Depends On:** `APPLICATION_STYLING_ARCHITECTURE_AUDIT.md`, `FOUNDATION_COMPONENT_ARCHITECTURE_AUDIT.md`
- **Related Reports:** `FOUNDATION_INTEGRITY_REPORT.md`, `APPLICATION_TECHNICAL_DEBT_REPORT.md`
- **Produces:** canonical finding ACCESS-AC-1 (contrast gates); pointer findings ACCESS-AC-2, ACCESS-AC-3, ACCESS-AC-4
- **Consumed By:** `APPLICATION_HEALTH_SCORE.md` (category 14), `APPLICATION_MIGRATION_BLOCKERS.md`, `APPLICATION_EXECUTIVE_SUMMARY.md`

## Repository State

- **Branch:** `phase-3.5` — **Commit:** `453b5d7` — **Audit target:** working tree on disk (dirty) — **Audit timestamp:** 2026-08-07

## Accessibility Baseline

| Aspect | Evidence | Status |
|---|---|---|
| Focus traps | `focus-trap-react` used in 2 files: `AdminModal.tsx:4`, `LanguageSelectionScreen.tsx:4` | Good |
| Dialog semantics | `AdminModal.tsx:110-111` `role="dialog" aria-modal="true"` | Good |
| `aria-labelledby` | `LanguageSelectionScreen.tsx:29` `aria-labelledby={titleId}` | Good |
| Raw form elements | 12 `<input>` + 2 `<select>` + 4 `<textarea>` | Risk (label wiring not Foundation-guaranteed) |
| Contrast gates | C-1…C-5 OPEN (prior certification) | Open |

## Findings

### Finding ACCESS-AC-1: Contrast gates C-1…C-5 remain OPEN
- **Severity:** High
- **Confidence:** High
- **Verification Method:** Repository Evidence
- **Classification:** Technical Debt
- **Owner:** Foundation
- **Affected Files:** None (forward gate)
- **Affected Components:** All pages (forward)
- **Affected Tokens:** None
- **Evidence:** Confirmed OPEN from `FOUNDATION_MIGRATION_READINESS.md`; no gate remediation found in the working tree. Gate list (C-1…C-5) spans text-on-surface, text-on-accent, muted-text-on-surface, border/interactive affordance, and light-mode variants.
- **Impact:** Pre-existing quality gate; every migrated page must pass the gates going forward.
- **Recommendation:** DEFER
- **Recommended Phase:** Forward Gate
- **Estimated Effort:** 1 day
- **Current Status:** Open

### Finding ACCESS-AC-2: Inline-style loaders bypass dark-mode adaptation (see styling audit)
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Architectural Defect
- **Owner:** Feature
- **Affected Files:** src/context/AuthContext.tsx:47-62, src/guards/Guards.tsx:12-16
- **Affected Components:** FullLoader, GuardLoader
- **Affected Tokens:** Bypassed (#080810)
- **Evidence:** `AuthContext.tsx:47-62` `FullLoader` inline `background:'#080810'` + `color:'#a78bfa'`; `Guards.tsx:12-16` `GuardLoader` inline `background:'#080810'`. Canonical detail: see `APPLICATION_STYLING_ARCHITECTURE_AUDIT.md` → STYLE-ST-1.
- **Impact:** Fixed dark hex applied regardless of `.light` context — light-mode contrast not verifiable.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 15 min
- **Current Status:** Open

### Finding ACCESS-AC-3: Hardcoded rgba shadows and `bg-white` in topic components (see styling audit)
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Technical Debt
- **Owner:** Feature
- **Affected Files:** TopicSectionRenderer.tsx:46-198, TopicReader.tsx:47,145
- **Affected Components:** TopicSectionRenderer, TopicReader
- **Affected Tokens:** Bypassed (bg-white, rgba)
- **Evidence:** `TopicSectionRenderer.tsx:46-198` `shadow-[…rgba(15,23,42,0.12)]`; `TopicReader.tsx:47,145` `bg-white`. Canonical detail: see `APPLICATION_STYLING_ARCHITECTURE_AUDIT.md` → STYLE-ST-2.
- **Impact:** Fixed white/opaque values reduce adaptive contrast in dark mode.
- **Recommendation:** REMOVE
- **Recommended Phase:** Migration
- **Estimated Effort:** 1 h
- **Current Status:** Open

### Finding ACCESS-AC-4: Raw form elements risk missing label wiring (see component audit)
- **Severity:** Low
- **Confidence:** Medium
- **Verification Method:** Automated Scan
- **Classification:** Preference
- **Owner:** Feature
- **Affected Files:** Feature components with raw form elements
- **Affected Components:** Feature components
- **Affected Tokens:** None
- **Evidence:** 18 raw form elements bypass `AntigravityForm`. Canonical detail: see `FOUNDATION_COMPONENT_ARCHITECTURE_AUDIT.md` → COMP-CA-1.
- **Impact:** Label/`htmlFor` responsibility shifts to page authors.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** half day
- **Current Status:** Open

## Accessibility Score

**Accessibility: 70/100.** Strengths: canonical dialog correctly marked (role/aria-modal/FocusTrap). Gaps: contrast gates OPEN (ACCESS-AC-1) + light-mode-blind inline loaders (ACCESS-AC-2). See `APPLICATION_HEALTH_SCORE.md` category 14 for derivation.

## Previous Certification Reconciliation

| Certification | Status | Reason |
|---|---|---|
| `FOUNDATION_MIGRATION_READINESS.md` (C-1…C-5 OPEN) | Confirmed | Gates remain OPEN, no drift. |

## Verdict

No new accessibility regression. The Open contrast gates are the primary gap; they are pre-existing, tracked, and gate forward migration (each migrated page must pass). Not a blocker to starting migration.

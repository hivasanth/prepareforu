# APPLICATION STYLING ARCHITECTURE AUDIT

> Phase 5.5A — Repository Architecture & Styling Integrity Audit (READ-ONLY, documentation)

## Document Relationship

- **Depends On:** `FOUNDATION_TOKEN_INTEGRITY_REPORT.md`, `FOUNDATION_CSS_ARCHITECTURE_REPORT.md`
- **Related Reports:** `FOUNDATION_DEPENDENCY_GRAPH.md`, `APPLICATION_ACCESSIBILITY_REPORT.md`
- **Produces:** canonical findings STYLE-ST-1…STYLE-ST-5
- **Consumed By:** `FOUNDATION_TOKEN_INTEGRITY_REPORT.md` (TOKEN-TI-3), `APPLICATION_ACCESSIBILITY_REPORT.md` (ACCESS-AC-2, ACCESS-AC-3), `APPLICATION_TECHNICAL_DEBT_REPORT.md` (DEBT-TD-7), `APPLICATION_HEALTH_SCORE.md` (categories 10–12)

## Repository State

- **Branch:** `phase-3.5` — **Commit:** `453b5d7` — **Audit target:** working tree on disk (dirty) — **Audit timestamp:** 2026-08-07

## Styling Architecture Overview

- **Single source of truth:** `src/styles/themes.css` (frozen) — 486 token definitions / 340 unique, Layer-1 primitives + Layer-2 semantics, dark-default `:root` + `.light` overrides.
- **Tailwind v4 integration:** `src/index.css` registers `@custom-variant light (&:where(.light, .light *))` (`index.css:8`) and global resets.
- **Consumption styles (3 paths):** (1) arbitrary-token classes `text-[var(--text-muted)]`, `bg-[var(--management-surface)]`; (2) registered semantic utilities via Tailwind `@theme` (`text-primary`, `bg-card-bg`, `text-text-primary`); (3) Tailwind default utilities (`bg-white`, `shadow-lg`, spacing scale). Paths 1+2 are Foundation-native; path 3 is documented-intentional and non-penalized.

## Findings

### Finding STYLE-ST-1: Inline-style bypasses in context & guards (colors/layout)
- **Severity:** High
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Technical Debt
- **Owner:** Feature
- **Affected Files:** src/context/AuthContext.tsx:44-67, src/guards/Guards.tsx:12-16
- **Affected Components:** FullLoader, GuardLoader
- **Affected Tokens:** Bypassed (#080810, #a78bfa)
- **Evidence:** `src/context/AuthContext.tsx:44-67` — `FullLoader` inline style: `background:'#080810'`, `color:'#a78bfa'`, `fontSize:16`, `letterSpacing:'1px'`, `textTransform:'uppercase'`, `zIndex:9999`, `gap:24`. `src/guards/Guards.tsx:12-16` — `GuardLoader` inline `background:'#080810'`, `zIndex:9999`.
- **Impact:** Hardcoded hex (#080810, #a78bfa) bypass the token layer and break light-mode adaptation. Related to DEP-DG-1.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 15 min
- **Current Status:** Open

### Finding STYLE-ST-2: Hardcoded rgba shadows and raw white in topic components
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Technical Debt
- **Owner:** Feature
- **Affected Files:** src/components/user/topics/TopicSectionRenderer.tsx:46-198, TopicReader.tsx:47,145,96
- **Affected Components:** TopicSectionRenderer, TopicReader
- **Affected Tokens:** Bypassed (bg-white, rgba)
- **Evidence:** `src/components/user/topics/TopicSectionRenderer.tsx:46,53,59,104,158,198` — `shadow-[2px_2px_0px_rgba(15,23,42,0.12)]` (and 1.5/2.5/4px variants) hardcode a shadow color; `src/components/user/topics/TopicReader.tsx:47,145` — `bg-white` (default palette, breaks dark theme); `TopicReader.tsx:96` — `bg-[var(--danger)]` + `text-white`.
- **Impact:** Fixed white/opaque values break adaptive dark-mode contrast.
- **Recommendation:** REMOVE
- **Recommended Phase:** Migration
- **Estimated Effort:** 1 h
- **Current Status:** Open

### Finding STYLE-ST-3: Arbitrary pixel font-size fragmentation
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Preference
- **Owner:** Feature
- **Affected Files:** ExamDetailModal.tsx, StudentsTable.tsx, ExamSubComponents.tsx, ExamStudentTable.tsx, ExamQuestionAnalysis.tsx, ExamListSection.tsx, ExamDetailSection.tsx, RecentExamItem.tsx, RecentAttemptItem.tsx, SplashPage.tsx, CarouselDots.tsx, LeaderboardComponents.tsx
- **Affected Components:** Sub-admin/exam components
- **Affected Tokens:** Text tokens bypassed
- **Evidence:** `text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-[12px]`, `text-[13px]`, `text-[14px]`, `text-[16px]` across sub-admin components (ExamDetailModal.tsx:131,152-156,267; StudentsTable.tsx:30,45,74; ExamSubComponents.tsx:80; ExamStudentTable.tsx:112,134; ExamQuestionAnalysis.tsx:112; ExamListSection.tsx:85; ExamDetailSection.tsx:92; RecentExamItem.tsx:41,45; RecentAttemptItem.tsx:24; SplashPage.tsx:215,240; CarouselDots.tsx:25; LeaderboardComponents.tsx:17).
- **Impact:** Fragments the type scale instead of using Foundation text tokens.
- **Recommendation:** DEFER
- **Recommended Phase:** Post-Migration
- **Estimated Effort:** half day
- **Current Status:** Open

### Finding STYLE-ST-4: `light:` variant usage is correct and contained
- **Severity:** Informational
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Informational
- **Owner:** Foundation
- **Affected Files:** src/components/common/AntigravityData.tsx:102,127, PremiumIconContainer.tsx:41
- **Affected Components:** Foundation primitives
- **Affected Tokens:** light: variant correct
- **Evidence:** `light:`-prefixed utilities appear only in Foundation primitives (`AntigravityData.tsx:102,127`, `PremiumIconContainer.tsx:41`) and direct duplications — consistent with the registered custom variant.
- **Impact:** No action required; confirms correct variant registration.
- **Recommendation:** KEEP
- **Recommended Phase:** None
- **Estimated Effort:** Unknown
- **Current Status:** Open

### Finding STYLE-ST-5: 4 CSS optimizer warnings (see CSS report)
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Build Verification
- **Classification:** Technical Debt
- **Owner:** Foundation
- **Affected Files:** src/components/common/AntigravityTypography.tsx:8
- **Affected Components:** AntigravityTypography
- **Affected Tokens:** None
- **Evidence:** Build warnings for `.border-[length:var(--…)]`, `.bg-[var(--management-*)]`, `.text-[var(--text-*)]`. Canonical detail: see `FOUNDATION_CSS_ARCHITECTURE_REPORT.md` → CSS-CSS-1.
- **Impact:** Cosmetic; dead CSS classes.
- **Recommendation:** DEFER
- **Recommended Phase:** Repository Hygiene
- **Estimated Effort:** 1 h
- **Current Status:** Open

## Styling Consistency Metrics

| Metric | Value |
|---|---|
| Token bypasses (inline hex / hardcoded colors) | 6 localized (AuthContext ×2, Guards ×1, TopicReader bg-white ×2, rgba shadows ×1 cluster) |
| Raw form elements (bypass AntigravityForm) | 12 `<input>` + 2 `<select>` + 4 `<textarea>` (see `FOUNDATION_COMPONENT_ARCHITECTURE_AUDIT.md` COMP-CA-1) |
| Foundation-consistent token usage | ~97% of component styling |
| Build CSS warnings | 4 (cosmetic) |

## Styling Score

**Styling: 76/100.** See `APPLICATION_HEALTH_SCORE.md` category 11 for derivation.

## Previous Certification Reconciliation

| Certification | Status | Reason |
|---|---|---|
| `FOUNDATION_VISUAL_CONSISTENCY_AUDIT.md` | Partially Confirmed | Foundation layer consistent (0 dead tokens, correct `light:` usage); application-layer stragglers (STYLE-ST-1/STYLE-ST-2) quantified at repo scale. |
| `FOUNDATION_MIGRATION_READINESS.md` (C-1…C-5 contrast gates OPEN) | Confirmed | Contrast gates still OPEN; see `APPLICATION_ACCESSIBILITY_REPORT.md` ACCESS-AC-1. |

## Verdict

Styling architecture is Foundation-first and consistent (~97%). The color bypasses and type-scale fragmentation are pre-existing, localized, and migration-time addressable. No migration blocker.

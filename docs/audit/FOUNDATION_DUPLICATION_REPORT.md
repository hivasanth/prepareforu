# FOUNDATION DUPLICATION REPORT

> Phase 5.5A — Repository Architecture & Styling Integrity Audit (READ-ONLY, documentation)

## Document Relationship

- **Depends On:** `FOUNDATION_COMPONENT_ARCHITECTURE_AUDIT.md` (inventory), `FOUNDATION_TOKEN_INTEGRITY_REPORT.md` (token counts)
- **Related Reports:** `FOUNDATION_COMPONENT_ARCHITECTURE_AUDIT.md`, `FOUNDATION_REUSABILITY_REPORT.md`, `APPLICATION_STYLING_ARCHITECTURE_AUDIT.md`
- **Produces:** canonical duplication findings DUP-DU-1…DUP-DU-7
- **Consumed By:** `APPLICATION_TECHNICAL_DEBT_REPORT.md` (DEBT-TD-6), `APPLICATION_SCALABILITY_REPORT.md` (SCAL-SC-3), `APPLICATION_HEALTH_SCORE.md` (category 8)

## Repository State

- **Branch:** `phase-3.5` — **Commit:** `453b5d7` — **Audit target:** working tree on disk (dirty) — **Audit timestamp:** 2026-08-07

## Duplicate Classification Legend

Every duplication finding is classified: **Intentional** / **Merge Candidate** / **Safe Remove** / **Conflict** / **Legacy Compatibility** / **Experimental**.

## Findings

### Finding DUP-DU-1: Two `QuestionCard` components
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Repository Evidence
- **Classification:** Technical Debt
- **Owner:** Feature
- **Affected Files:** src/components/exam/QuestionCard.tsx, src/components/sub-admin/create/QuestionCard.tsx
- **Affected Components:** QuestionCard
- **Affected Tokens:** None
- **Evidence:** `src/components/exam/QuestionCard.tsx` and `src/components/sub-admin/create/QuestionCard.tsx` — same name, different implementations for exam-vs-create flows. Neither composes the other.
- **Impact:** Two divergent question-card behaviors and styles; future fixes must be applied twice.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** half day
- **Current Status:** Open
- **Duplicate classification:** Merge Candidate

### Finding DUP-DU-2: 20 Card-named components
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Automated Scan
- **Classification:** Preference
- **Owner:** Feature
- **Affected Files:** 20 Card-named components
- **Affected Components:** Card components
- **Affected Tokens:** None
- **Evidence:** `LeaderboardMobileCard`, `LeaderboardTabletCard`, `AIToolCards`, `SettingsCard`, `SubjectCardItem`, `SubAdminMobileCard`, `AntigravityCard`, `AttemptCardBase`, `CollectionCard`, `ExamPaperCard`, `RecentAttemptCard`, `QuestionCard` (×2), `ReviewQuestionCard`, `ExamSummaryCards`, `TeacherExamCard`, `LeaderboardTopCard`, `LeaderboardUserCard`, `SubjectInsightsCard`, `TopicCard`. Only `AntigravityCard` is the Foundation primitive.
- **Impact:** Card recipes restated per feature; visual drift risk. Feature cards legitimately differ, so this is preference-level.
- **Recommendation:** DEFER
- **Recommended Phase:** Deferred
- **Estimated Effort:** half day
- **Current Status:** Open
- **Duplicate classification:** Intentional (feature-specific)

### Finding DUP-DU-3: Identical tab-pill class string duplicated
- **Severity:** Low
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Technical Debt
- **Owner:** Shared Components
- **Affected Files:** SegmentedFilter.tsx:90, AntigravityData.tsx:102
- **Affected Components:** SegmentedFilter, AntigravityData
- **Affected Tokens:** material-tab tokens
- **Evidence:** `src/components/common/SegmentedFilter.tsx:90` and `src/components/common/AntigravityData.tsx:102` share the same `tracking-widest … border-border-subtle light:text-[var(--material-tab-text-inactive)] light:hover:text-[var(--material-tab-text-hover)]` class recipe.
- **Impact:** Same visual recipe maintained in two places; drift risk on the material-tab tokens.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 1 h
- **Current Status:** Open
- **Duplicate classification:** Merge Candidate

### Finding DUP-DU-4: Four dialog/overlay implementations
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Technical Debt
- **Owner:** Shared Components
- **Affected Files:** AdminModal.tsx, PremiumSelect.tsx, SharedComponents.tsx:196, LanguageSelectionScreen.tsx:28-29
- **Affected Components:** AdminModal, PremiumSelect, ConfirmModal, LanguageSelectionScreen
- **Affected Tokens:** None
- **Evidence:** `AdminModal.tsx` (canonical portal+FocusTrap, L2,4,98-111); `PremiumSelect.tsx` (self-contained, 0 AdminModal/Menu imports); `SharedComponents.tsx:196` `ConfirmModal`; `src/components/exam/LanguageSelectionScreen.tsx:28-29` (raw `fixed inset-0` overlay + FocusTrap).
- **Impact:** Four overlays, one canonical dialog; inconsistent behavior/accessibility/portal semantics.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 1 day
- **Current Status:** Open
- **Duplicate classification:** Merge Candidate

### Finding DUP-DU-5: Loader split (two components + two inline re-implementations)
- **Severity:** Medium
- **Confidence:** High
- **Verification Method:** Manual Review
- **Classification:** Technical Debt
- **Owner:** Shared Components
- **Affected Files:** Loader.tsx, PremiumLoader.tsx, AuthContext.tsx:44-67, Guards.tsx:1-20
- **Affected Components:** Loader, PremiumLoader, FullLoader, GuardLoader
- **Affected Tokens:** None
- **Evidence:** `src/components/Loader.tsx` + `src/components/PremiumLoader.tsx`; plus `FullLoader` (`AuthContext.tsx:44-67`) and `GuardLoader` (`Guards.tsx:1-20`) re-implement loader styling inline.
- **Impact:** Consumers pick a loader arbitrarily; two token-less loaders bypass the Foundation. Related to DEP-DG-1.
- **Recommendation:** MERGE
- **Recommended Phase:** Migration
- **Estimated Effort:** 1 h
- **Current Status:** Open
- **Duplicate classification:** Merge Candidate

### Finding DUP-DU-6: Skeleton duplication across files
- **Severity:** Low
- **Confidence:** Medium
- **Verification Method:** Manual Review
- **Classification:** Preference
- **Owner:** Shared Components
- **Affected Files:** Skeleton.tsx, SharedComponents.tsx (L13,26,36)
- **Affected Components:** Skeleton, LoadingSkeleton, GridSkeleton, StatSkeleton
- **Affected Tokens:** None
- **Evidence:** `Skeleton.tsx` (premium/management variants) overlaps with `SharedComponents.tsx` `LoadingSkeleton` (L13), `GridSkeleton` (L26), `StatSkeleton` (L36) — two skeleton surfaces with overlapping responsibilities.
- **Impact:** Two skeleton families; consumers choose per feature, retaining legacy surfaces.
- **Recommendation:** DEFER
- **Recommended Phase:** Deferred
- **Estimated Effort:** 1 h
- **Current Status:** Open
- **Duplicate classification:** Legacy Compatibility

### Finding DUP-DU-7: 146 token "duplicates" are intentional dark/light overrides
- **Severity:** Informational
- **Confidence:** High
- **Verification Method:** Repository Evidence
- **Classification:** Informational
- **Owner:** Foundation
- **Affected Files:** src/styles/themes.css
- **Affected Components:** None
- **Affected Tokens:** 146 override redefinitions
- **Evidence:** `themes.css` has 486 definitions / 340 unique names; the 146 extras are the expected dark-`:root` + light-`.light` override pattern.
- **Impact:** Not a defect; expected architecture. No action required.
- **Recommendation:** KEEP
- **Recommended Phase:** None
- **Estimated Effort:** Unknown
- **Current Status:** Open
- **Duplicate classification:** Intentional

## Duplication Summary

| ID | Duplicate | Classification | Action |
|---|---|---|---|
| DUP-DU-1 | QuestionCard ×2 | Merge Candidate | MERGE |
| DUP-DU-2 | 20 Card components | Intentional | DEFER |
| DUP-DU-3 | tab-pill class string ×2 | Merge Candidate | MERGE |
| DUP-DU-4 | 4 dialog/overlay impls | Merge Candidate | MERGE |
| DUP-DU-5 | 2 loaders + 2 inline loaders | Merge Candidate | MERGE |
| DUP-DU-6 | skeleton surfaces ×2 | Legacy Compatibility | DEFER |
| DUP-DU-7 | 146 token redefinitions | Intentional | KEEP |

## Previous Certification Reconciliation

| Certification | Status | Reason |
|---|---|---|
| `FOUNDATION_ARCHITECTURE_CERTIFICATION.md` ("no duplicate renderers") | Confirmed | No duplicate renderer; duplicates are presentational (dialogs, loaders, cards), not renderers. |
| `FOUNDATION_MIGRATION_READINESS.md` (21 thin wrappers) | Confirmed | Wrappers reproduce a distinct duplication class (behavior-free passthroughs). |

## Verdict

Duplication is moderate and non-blocking. Primary merge candidates: DUP-DU-1, DUP-DU-3, DUP-DU-4, DUP-DU-5. DUP-DU-7 is intentional architecture. No conflicts detected.

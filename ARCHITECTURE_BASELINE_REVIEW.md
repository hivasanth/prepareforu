# Architecture Baseline Review Report

**Reviewer:** Principal Architect (Independent Review)  
**Date:** 2026-07-22  
**Document under review:** `ARCHITECTURE_BASELINE.md` (certified 2026-07-22, v3.12.0)

---

## Part 1 — Overall Assessment

| Area | Score | Reason |
|------|:-----:|--------|
| Layer Architecture | 8 | Clear hierarchy with Routes → Guards → Layouts → Pages → Components → Foundation. The ASCII diagram places Hooks at two levels (under Pages and root), which introduces minor ambiguity about canonical hook placement. |
| Dependency Rules | 9 | Comprehensive allowed and forbidden directions. All major dependency paths covered. One minor gap: no explicit "Utilities never import React or Components" rule. |
| Canonical Ownership | 9 | Exceptionally thorough. Every hook, service, repository, utility, type, and guard has a documented owner. 19 hooks, 17 services, 9 repositories, 18+ utilities. |
| Service Architecture | 8 | Clear service→repository→Supabase chain. 17 services cover all major domains. Some service boundaries (e.g., `examService` scope) are implicit rather than explicitly bounded. |
| Hook Architecture | 8 | Good separation between general hooks and exam-specific hooks. Three canonical data-fetching hooks cover the dominant patterns. |
| Repository Layer | 8 | 9 repositories with clear domain ownership. Validation enforced via `validateOrThrow`. Repository→Supabase is the terminal dependency — correctly placed. |
| Foundation Components | 8 | AntigravityUI barrel is well-organized (11 sub-modules). SharedComponents provides remaining common primitives. |
| Accessibility Rules | 8 | Specific, enforceable rules for modals, carousels, menus, and form controls. Two remaining `fixed inset-0` modal violations are categorized as "cosmetic" but have real accessibility impact. |
| Performance Rules | 7 | Rules exist but are thin. Lazy loading, memo justification, and no derived-state-in-useState are covered, but no guidance on bundle size budgets, render frequency thresholds, or `useMemo`/`useCallback` criteria. |
| Maintainability | 8 | Single-owner-per-concern approach and documented exceptions make the baseline easy to maintain. Checklist provides concrete PR review guidance. |
| Scalability | 7 | The Route→Page→Hook→Service→Repository chain scales well horizontally. Cross-panel isolation is strict by design, which prevents leaks but can create friction for genuinely shared patterns. 17 services will need periodic boundary review as the codebase grows. |
| Governance | 9 | Strong future audit policy with 5 objective criteria. Stale closure policy prevents backlog bloat. ADR registry provides decision traceability. |
| Overall Repository Health | 8 | 30 ARs completed with zero behavioral changes. 46 files created, 23 deleted. Comprehensive documentation of all decisions. Minor gaps (pending ADRs, missing error handling section) do not undermine the overall baseline quality. |

**Weighted overall: 8.1 / 10 — Strong production-grade baseline.**

---

## Part 2 — Strength Analysis

### S1 — Comprehensive Canonical Ownership Table
- **Why it is good:** Every architectural concern maps to exactly one file. New developers and reviewers have an unambiguous answer to "where does this belong?"
- **What benefit it provides:** Eliminates ownership disputes during code review. Prevents duplicate implementations. Accelerates onboarding.
- **Should remain unchanged:** Yes. This is the single most valuable artifact in the baseline. Maintain as the authoritative reference.

### S2 — No Behavioral Changes Across 30 ARs
- **Why it is good:** The program disciplined itself to refactor without altering runtime behavior. Zero regressions.
- **What benefit it provides:** High confidence that the documented baseline matches actual runtime behavior. Trust in the certification.
- **Should remain unchanged:** Yes. This principle should carry forward into all future ARs.

### S3 — Forbidden Dependency Directions Are Explicit
- **Why it is good:** Many architecture documents describe what IS allowed but not what IS NOT. This document does both.
- **What benefit it provides:** Prevents layer violations at PR time. Reviewers have clear, citeable rules.
- **Should remain unchanged:** Yes. The list is comprehensive. Add the two minor gaps noted in Part 7.

### S4 — Repository-First Methodology
- **Why it is good:** Every AR required grep-based verification before action. Claims from the backlog were not trusted at face value.
- **What benefit it provides:** Eliminated wasted work on stale items (6 ARs closed stale). Evidence-based decisions prevent subjective refactoring.
- **Should remain unchanged:** Yes. This methodology is codified in the Future Audit Policy (Part 7 of the baseline).

### S5 — Documented Exceptions (Category C)
- **Why it is good:** The document does not pretend the architecture is perfect. Remaining exceptions are explicitly listed, justified, and bounded.
- **What benefit it provides:** Transparency. Future reviewers know which deviations are intentional rather than accidental.
- **Should remain unchanged:** Yes. Continue maintaining this exception list as the codebase evolves.

### S6 — Maintenance Checklist for PR Reviews
- **Why it is good:** Concrete, actionable checklist items (architecture, accessibility, performance, design system) give reviewers objective criteria.
- **What benefit it provides:** Reduces review subjectivity. Ensures consistent standards across all PRs.
- **Should remain unchanged:** Yes. The checklist can be expanded (see Part 11 recommendations) but the format is correct.

### S7 — Strong Future Audit Policy
- **Why it is good:** 5 objective criteria prevent unnecessary refactoring. The "patterns that appear in fewer than 3 files" threshold prevents over-engineering based on isolated examples.
- **What benefit it provides:** Protects development velocity. Architecture work does not restart without genuine evidence.
- **Should remain unchanged:** Yes. The policy is appropriately strict.

---

## Part 3 — Weakness Analysis

### W1 — Pending ADRs Without Resolution Timeline
- **Description:** ADR-004 (Portal Package Architecture) and ADR-007 (Repository-First Audit Scope) are listed as "Pending" with no decision, no owner, no target resolution date. ADR-006 is listed as "Dissolved," which is not a standard ADR status.
- **Repository evidence:** Baseline Part 4 shows 2 of 8 ADRs as "Pending" and 1 as "Dissolved."
- **Architectural impact:** Pending ADRs represent unresolved architectural decisions. If ADR-004 (Portal Package Architecture) is no longer relevant, it should be formally Rejected. If still relevant, it needs an owner and timeline. ADR-006 "Dissolved" is ambiguous — was it Rejected? Superseded? Withdrawn?
- **Severity:** Medium. These do not block current development but represent governance debt.

### W2 — Two Remaining `fixed inset-0` Modal Violations Deferred as "Cosmetic"
- **Description:** `PromptEditorModal` and `AddExamModal` use raw `fixed inset-0` instead of `AdminModal`. The baseline categorizes this as "cosmetic" (Part 3, UI Rule 3 note).
- **Repository evidence:** The baseline itself documents these violations.
- **Architectural impact:** Raw `fixed inset-0` modals lack focus trapping, `aria-modal`, `aria-labelledby`, and keyboard-based dismissal that `AdminModal` provides. This is an accessibility gap, not a cosmetic one. Users relying on keyboard navigation or screen readers are affected.
- **Severity:** Medium (accessibility impact, not behavioral/crash impact).

### W3 — Error Handling Strategy Not Documented
- **Description:** The baseline has no section describing error propagation, error boundary hierarchy, or expected error-handling patterns across layers.
- **Repository evidence:** Absence from baseline document. Part 3 (Architectural Rules) covers authorization, React patterns, services, and UI but has no error handling section.
- **Architectural impact:** Without documented standards, developers may handle errors inconsistently. Some services may swallow errors, some may throw, some may return null. The `logger` utility exists (Part 2) but its expected usage is not defined.
- **Severity:** Medium. Inconsistent error handling leads to silent failures and debugging difficulty.

### W4 — Performance Rules Are Thin
- **Description:** The performance checklist has 4 items (lazy loading, memo justification, no eager imports, no derived state in useState). No guidance on bundle size budgets, render optimization thresholds, or when to use `useMemo`/`useCallback`.
- **Repository evidence:** Part 6 (Maintenance Checklist) — Performance section is the shortest section with the least specific guidance.
- **Architectural impact:** Without render optimization guidance, developers may over-optimize (premature `useMemo`/`useCallback`) or under-optimize (expensive re-renders in list components). However, no repository evidence currently proves this is causing issues.
- **Severity:** Low. The existing rules cover the most common anti-patterns. Additional guidance would be preventative, not corrective.

### W5 — Hooks Layer Ambiguity in Layer Diagram
- **Description:** The layer diagram shows Hooks both as a child of Pages and as a root-level concern. This creates ambiguity about whether hooks belong "inside" pages or at their own layer.
- **Repository evidence:** Baseline Part 1 shows Hooks branching from Pages (line 33: `├──► Hooks`) and also as a root-level sibling (line 35: `├──► Hooks (src/hooks/)`).
- **Architectural impact:** Low. Developers familiar with the codebase will know hooks live in `src/hooks/`. But a new team member reading the diagram could reasonably conclude hooks are page-scoped.
- **Severity:** Low — documentation clarity issue.

### W6 — Metrics Section Belongs in Appendix
- **Description:** Part 5 (Repository Metrics) documents the completed 30-AR program. This is backward-looking historical data, not forward-looking baseline governance.
- **Repository evidence:** The metrics table occupies 27 lines (lines 323–346) in the main body of a forward-governance document.
- **Architectural impact:** None on the architecture itself. Impact on document utility: someone searching for a canonical owner or rule must scroll through historical metrics to reach the governance content.
- **Severity:** Cosmetic. The metrics are valuable but should be in an appendix.

### No repository-backed weakness found in:
- Layer ownership correctness
- Service-to-repository mapping
- Type ownership (single source of truth for `AttemptWithRelations`)
- Hook canonical ownership (no overlap between the 19 hooks)
- Authorization architecture (route guards + service-level `ensureRole()`)
- Foundation component organization
- Accessibility rules completeness (4 specific, enforceable rules)
- Dependency direction rules (comprehensive and correct)

---

## Part 4 — Rule Validation

### Layer Rules

| Rule | Verdict | Reasoning |
|------|---------|-----------|
| Pages never import Pages | **Correct** | Standard layered architecture. Prevents circular page dependencies. |
| Components never import Pages | **Correct** | Components must be reusable; importing a page breaks reusability. |
| Services never import Components or Pages | **Correct** | Services are business logic only. UI dependencies would couple them to the presentation layer. |
| Repositories never import Services, Components, or Pages | **Correct** | Repositories are the terminal data layer. Any upward dependency would create cycles. |
| Hooks never import Components or Pages | **Correct** | The one past exception (useDashboardData → AttemptCardBase type) has been fixed by centralizing `AttemptWithRelations` in `exam.types`. |
| Context providers never import Components | **Correct with exception** | AuthContext→Loader is justified (presentation-only, 23 lines, no business logic). Exception should remain documented. |
| Cross-panel imports are forbidden | **Correct with exception** | UserSelectionTabs alias from AdminSelectionTabs is the sole remaining exception. Ideally the alias should be eliminated, but it's acceptable as-is if it's a thin re-export. |

### React Rules

| Rule | Verdict | Reasoning |
|------|---------|-----------|
| Always use useStableFetch/useAsyncOperation/useSupabaseQuery | **Slightly too strict** | These three hooks cover 90%+ of data fetching patterns, but the rule should allow `useEffect` for non-data operations (e.g., DOM measurements, subscription management) without treating them as violations. |
| Never duplicate mounted lifecycle | **Correct** | Race condition safety is a well-known React footgun. Centralizing in `useStableFetch` is correct. |
| Never duplicate async lifecycle | **Correct** | The loading/error/execute triad is a standard pattern. |
| Derived state with `const`, not `useState` | **Correct** | Storing derived state in `useState` causes synchronization bugs. |
| Complete dependency arrays | **Correct** | Standard React best practice. |
| Cleanup in useEffect returns | **Correct** | Standard React best practice. |
| Justify each React.memo | **Correct** | Prevents premature optimization while allowing appropriate usage. |

### Service Rules

| Rule | Verdict | Reasoning |
|------|---------|-----------|
| Repositories own database access | **Correct** | Clear data access boundary. All Supabase queries in `src/lib/repositories/`. |
| Services own orchestration | **Correct** | Business logic transformation and multi-repo coordination. |
| Pages never call Supabase directly | **Correct** | Forces consistent data access through services → repositories. |
| Validation stays in repositories | **Correct** | Incoming data validated at the boundary. `validateOrThrow()` is the single mechanism. |
| Cache layer rules | **Correct** | Two cache implementations (`fetchWithDedup` + `adminQueryCache`) with documented use cases. |

### Authorization Rules

| Rule | Verdict | Reasoning |
|------|---------|-----------|
| Route layer owns page-level authorization | **Correct** | AuthGuard + RoleGuard at the route level prevent unauthorized navigation. |
| Business operations keep permission checks | **Correct** | Defense-in-depth: service-level `ensureRole()` catches unauthorized access even if routing is bypassed. |
| No page-level isAdmin/isSubAdmin checks | **Correct** | Removed in AR-015 and AR-025. Duplicate checks create maintenance burden. |

### UI Rules

| Rule | Verdict | Reasoning |
|------|---------|-----------|
| Use Foundation components whenever appropriate | **Correct but subjective** | "When appropriate" is intentionally flexible but relies on reviewer judgment. Consider adding concrete guidance: "If a Foundation component exists for the concern, use it. Deviations require inline comment justification." |
| Specialized UI remains specialized | **Correct** | Prevent premature abstraction of feature-specific components. |
| No raw `fixed inset-0` modals | **Correct** | But the two remaining violations should not be categorized as "cosmetic" — they are accessibility violations. |

### Accessibility Rules

| Rule | Verdict | Reasoning |
|------|---------|-----------|
| Modals: focus trap, ARIA attributes | **Correct** | Provided by AdminModal. Enforceable at PR review. |
| Carousels: tablist role | **Correct** | Specific and enforceable. |
| Menus: menu role, expanded, haspopup | **Correct** | Specific and enforceable. |
| Form controls: htmlFor/id | **Correct** | Specific and enforceable. |

### Notification Rules

| Rule | Verdict | Reasoning |
|------|---------|-----------|
| Workflow owner: useToast + ToastContainer | **Correct** | Single notification pipeline. |
| Presentation components never own notifications | **Correct** | Separates concerns: rendering vs. side effects. |

---

## Part 5 — Exception Review

### Exception 1: AuthContext → Loader
| Question | Answer |
|----------|--------|
| Is the exception justified? | Yes. Loader is 23 lines, presentation-only (an SVG spinner), zero business logic dependencies, consumed by only 2 parent components within the same file. Extracting it to a separate file would create more indirection than it resolves. |
| Should it become a rule? | No. The exception is narrow and specific. Making it a rule would open the door for other context→component dependencies. |
| Should it be removed? | No. The exception is valid and well-documented. |
| Should it remain documented? | Yes. Continue documenting it with the same justification (presentation-only, line count, zero business logic, consumer count). |

### Exception 2: UserSelectionTabs alias from AdminSelectionTabs
| Question | Answer |
|----------|--------|
| Is the exception justified? | Partially. If `UserSelectionTabs` is literally `export { AdminSelectionTabs as UserSelectionTabs }`, it creates a cross-panel dependency (user panel ← admin panel). However, if the alternative is duplicating the component in both panels, the alias is the lesser evil. The Category C classification is appropriate. |
| Should it become a rule? | No. This is a specific compromise, not a pattern to encourage. |
| Should it be removed? | Ideally, yes — if AdminSelectionTabs can be moved to `src/components/common/` without creating the reverse violation (admin→common is allowed). But this would require validating that AdminSelectionTabs has no admin-only dependencies. Without repository evidence of those dependencies, this is speculative. |
| Should it remain documented? | Yes. With a note that this is a candidate for future resolution if AdminSelectionTabs is ever refactored to be panel-agnostic. |

### Exception 3: PromptEditorModal and AddExamModal raw `fixed inset-0`
| Question | Answer |
|----------|--------|
| Is the exception justified? | Not fully. The baseline categorizes these as "cosmetic" but they are accessibility violations (no focus trap, no ARIA attributes, no keyboard dismissal). This underestimates their impact. |
| Should it become a rule? | The UI rule already prohibits raw modals. No change needed to the rule — the categorization in the exception note needs correction. |
| Should it be removed? | Yes, these should be migrated to AdminModal. The effort is bounded (2 components), the fix is well-understood (wrap in AdminModal), and the accessibility benefit is clear. If deferred, recategorize from "cosmetic" to "accessibility." |
| Should it remain documented? | Yes, but with corrected severity (accessibility, not cosmetic). Set a target for resolution. |

---

## Part 6 — Canonical Ownership Review

### Already Optimal

The following ownership assignments are correct and should remain unchanged:

- `useStableFetch` → mounted lifecycle (race condition safety)
- `useAsyncOperation` → async lifecycle (loading/error/execute)
- `useToast` + `ToastContainer` → notification workflow
- `AuthGuard` + `RoleGuard` → authorization
- `validateOrThrow` → repository validation (centralized in `src/lib/utils/`)
- `AttemptWithRelations` → `exam.types` (single canonical source)
- `queryCache.fetchWithDedup` → query dedup + TTL
- All 9 repositories with clear domain ownership
- All 19 hooks with distinct, non-overlapping concerns

### Observations (Not Weaknesses)

- **`scoreUtils` and `rankUtils`** are separate utilities. Score calculation and rank calculation are closely related but genuinely distinct concerns (score = raw correctness, rank = position relative to peers). Maintaining separate files is correct — merging them would create a utility with two unrelated responsibilities.
- **`examUtils` (in `src/lib/`)** has a broad name. Without reading its contents, it may be a catch-all for exam-related logic that doesn't fit elsewhere. This is worth noting but not currently a problem.
- **17 services** is a large number. Each maps to a distinct domain concern. The size is proportional to the application's feature surface. Periodic boundary review (every 6–12 months) is recommended to detect scope creep.
- **`adminQueryCache`** as a separate cache from `queryCache.fetchWithDedup` could be questioned, but the distinction is documented: `fetchWithDedup` is for general dedup/TTL, `adminQueryCache` is for SWR-style stale-while-revalidate in admin panels. Distinct cache strategies justify distinct owners.

### Conclusion

Canonical ownership is optimal. No duplicate or overlapping ownership identified. No ownership changes recommended.

---

## Part 7 — Dependency Review

### Forbidden Dependencies — Complete

| Rule | Status |
|------|--------|
| Pages → Pages | ✅ Correctly forbidden |
| Components → Pages | ✅ Correctly forbidden |
| Services → Components, Pages | ✅ Correctly forbidden |
| Repositories → Services, Components, Pages | ✅ Correctly forbidden |
| Hooks → Components, Pages | ✅ Correctly forbidden (past exception fixed) |
| Context → Components | ✅ Correctly forbidden (AuthContext/Loader exception documented) |
| Cross-panel admin↔sub-admin↔user | ✅ Correctly forbidden (UserSelectionTabs alias exception documented) |

### Allowed Dependencies — Complete

All documented allowed paths are correct. The chain `Pages → Hooks → Services → Repositories → Supabase` is the canonical data flow and is correctly represented.

### Missing Rules

Two dependency rules are worth adding explicitly:

1. **"Utilities never import React or Components."** — This is currently implied by the layer architecture but not stated. Utilities should be framework-agnostic. Explicitly stating this prevents a utility from accidentally importing a React hook or UI component.

2. **"Types never import runtime code."** — Type definitions should import only other types, interfaces, and enums. A type file importing a service or utility would create a phantom dependency. This is standard practice but not documented.

### Rules That Could Be Relaxed

None. The current rules strike the right balance between strictness and practicality. The documented exceptions handle the edge cases where strictness would cause more harm than benefit.

---

## Part 8 — ADR Review

| ADR | Status | Verdict | Action |
|:---:|:------:|---------|--------|
| ADR-001 | Accepted | **Still valid.** Foundation components + page-owned composition is working well. | None needed. |
| ADR-002 | Accepted | **Still valid.** React state + context without external library has scaled successfully through 30 ARs. The absence of Redux/Zustand has not been a limiting factor. | None needed. |
| ADR-003 | Accepted | **Still valid.** Service → Repository → Supabase layering is the backbone of the data architecture. | None needed. |
| ADR-004 | Pending | **Needs resolution.** The Portal Package Architecture proposal has been pending with no update. Either accept it (and schedule implementation), reject it (if the current portal workflow is sufficient), or supersede it with a newer decision. Indefinite "Pending" status creates governance uncertainty. | Assign an owner and resolve by next quarterly review. |
| ADR-005 | Accepted | **Still valid.** WCAG 2.1 AA baseline established. | None needed. |
| ADR-006 | Dissolved | **Needs cleanup.** "Dissolved" is not a standard ADR status. If the mobile-first approach was rejected, change status to "Rejected." If it was merged into another ADR, change to "Superseded by ADR-XXX." Ambiguous status reduces the ADR registry's value as a decision log. | Reclassify to "Rejected" or "Superseded." |
| ADR-007 | Pending | **Needs resolution.** Repository-First Audit Scope methodology. If this was the methodology used to complete AR-001 through AR-030, it should be "Accepted" (it was already applied). If it was a forward-looking proposal that is now superseded by Part 7 of the baseline (Future Audit Policy), it should be "Superseded by Architecture Baseline Part 7." | Resolve: either mark Accepted (if retroactively capturing the used methodology) or Superseded (if the baseline supersedes it). |
| ADR-008 | Accepted | **Still valid.** Backlog governance as single source of truth, stale closure process. This is directly reflected in the baseline's Future Audit Policy. | None needed. |

**Summary:** 5 of 8 ADRs are in good standing. 3 need administrative cleanup (ADR-004, ADR-006, ADR-007). No ADR needs to be revised on technical merit.

---

## Part 9 — Repository Metrics Review

| Recommendation | Justification |
|----------------|---------------|
| Move to Appendix A | The metrics document a completed program. They are backward-looking. The main body of the baseline should focus on forward governance. An appendix preserves the data without distracting from the baseline content. |
| Add a `Historical Record` header | Section the appendix clearly: "Historical Record — AR-001 to AR-030 (Completed 2026-07-22)." This makes it clear the metrics are not ongoing targets. |
| Retain the content | The metrics are valuable for future reference (onboarding, audits, measuring future architectural debt). Do not delete — just relocate. |
| Consider adding to CI/CD artifact | If the repository has CI/CD, these metrics could also be stored as a release artifact (e.g., a GitHub Release note) for permanent record-keeping. |

The metrics are well-organized and factually correct. No content changes needed — only structural relocation.

---

## Part 10 — Future Audit Policy

### Is it strict enough?
Yes. The 5-criteria gate (repository evidence, measurable duplication, ownership improvement, acceptable risk, measurable value) plus the explicit negative list (cosmetic, subjective, speculative, fewer than 3 files) makes it difficult to justify unnecessary ARs.

### Is it too strict?
No. A legitimate architectural defect that appears in 3+ files with measurable duplication and acceptable risk would pass all 5 criteria. The policy prevents frivolous ARs without preventing justified ones.

### Does it prevent unnecessary refactoring?
Yes, which is the intended behavior. The "fewer than 3 files" threshold is particularly effective — it forces the creator to demonstrate that the pattern is systemic rather than an isolated case.

### Does it still allow justified architecture improvements?
Yes. The criteria are objective and measurable. An AR backed by grep results showing 4 files with identical duplicated code would pass criteria 1 and 2. If the consolidation would eliminate violations, it passes criteria 3 and 5. If the changed code is not in the exam-taking or auth paths, it passes criterion 4.

### Additional recommendation
Add one more item to the negative list: **"Architecture changes based solely on code review preference without runtime or maintainability impact."** This closes a potential loophole where a reviewer might argue "this would be cleaner" based on personal preference.

---

## Part 11 — Missing Sections

### Recommended (Medium Priority)

**1. Error Handling Architecture**

The baseline documents `logger` and `ErrorBoundary` as utilities but does not specify:
- How errors should propagate between layers (Service → Hook → Component: does each layer catch or re-throw?)
- Error boundary hierarchy (one root boundary? Per-route? Per-panel?)
- Expected error format (structured `{ code, message, details }` or ad-hoc strings?)
- Silent failure policy (when is it acceptable to `console.error` and continue vs. surface to user?)

**Impact:** Without this section, error handling will diverge across the codebase as new features are added. This is the most important missing section.

**2. Testing Architecture Strategy**

The baseline has no testing section. Key gaps:
- What should each layer test? (Services: unit tests with mocked repos? Hooks: render hook tests? Components: component tests?)
- What is the expected test file location convention? (`*.test.ts` co-located? `__tests__/` directory?)
- What is the minimum coverage expectation?

**Impact:** Without documented testing conventions, new features may lack tests or test at the wrong level. However, this is an existing codebase with established (though undocumented) patterns — the impact is lower than error handling.

**3. Logging Standards**

The `logger` utility exists (Part 2) but its expected usage is not defined:
- What log level for each layer? (Repository: debug? Service: info? Error boundary: error?)
- Structured or unstructured logging?
- When to log vs. when to throw?

**Impact:** Low-medium. Inconsistent logging complicates debugging but does not affect runtime behavior.

### Not Recommended

- **Versioning Policy** — The document already uses version 3.12.0. For a single-repository architecture baseline, semantic versioning adds bureaucracy without proportional benefit.
- **CI/CD Architecture Requirements** — Out of scope for an architecture baseline document. If needed, belongs in a separate CI/CD governance document.
- **Security Architecture** — Authorization is covered (AuthGuard, RoleGuard, ensureRole). Broader security architecture (encryption, data sanitization, CSP) is an operational concern beyond the scope of this architecture baseline.
- **Migration Policy** — The repository is single-tenant with no migration history. A migration policy is premature.

### Recommended (Low Priority — Documentation Enhancement)

**4. Error Boundary Hierarchy Diagram** — A simple ASCII chart showing where ErrorBoundary components sit in the component tree.

---

## Part 12 — Improvement Recommendations

### High Priority

| # | Recommendation | Type | Justification |
|---|----------------|------|---------------|
| H1 | Resolve ADR-004, ADR-006, ADR-007 | Governance | Pending ADRs and non-standard statuses (Dissolved) create governance debt. Each needs a decision by end of next quarterly review. |
| H2 | Recategorize two modal violations from "cosmetic" to "accessibility" | Documentation | Raw `fixed inset-0` modals lacking focus trap and ARIA attributes are accessibility violations, not cosmetic preferences. The current categorization underestimates their impact. |

### Medium Priority

| # | Recommendation | Type | Justification |
|---|----------------|------|---------------|
| M1 | Add Error Handling Architecture section | Architecture | The most significant omission. Needed to prevent divergent error-handling patterns as features grow. |
| M2 | Move Part 5 (Repository Metrics) to Appendix | Documentation | Backward-looking metrics should not sit in the forward-governance main body. |
| M3 | Fix Hooks layer ambiguity in layer diagram | Documentation | Hooks appear at two levels. Consolidate to one canonical placement. |
| M4 | Add "Utilities never import React or Components" rule | Governance | Currently implied but not stated. Adding it prevents accidental framework coupling in utility code. |

### Low Priority

| # | Recommendation | Type | Justification |
|---|----------------|------|---------------|
| L1 | Expand Performance rules (bundle budget, useMemo/useCallback criteria) | Governance | Preventative guidance. No evidence of current violations. |
| L2 | Add "Types never import runtime code" rule | Governance | Standard practice but not documented. Low risk of violation. |
| L3 | Add Testing Architecture section | Governance | Would improve consistency but the codebase has established (undocumented) patterns that already work. |
| L4 | Add negative list item: "Architecture changes based on code review preference" | Governance | Closes a potential loophole in the Future Audit Policy. |

### Not Recommended

| Change | Reason for rejection |
|--------|---------------------|
| Move AdminSelectionTabs to common/ | Speculative without repository evidence of its dependencies. Could introduce new issues. |
| Merge scoreUtils + rankUtils | Distinct concerns. Merging would reduce cohesion. |
| Add CI/CD section | Out of scope for an architecture baseline. |
| Add versioning policy | Adds bureaucracy without proportional benefit for a single-repo baseline. |

---

## Part 13 — Final Certification

### Architecture Quality: **A**

**Why A and not A+?** The baseline is comprehensive, well-organized, and backed by rigorous repository evidence. It earns an A for:
- Exceptionally thorough canonical ownership documentation
- Clean layer separation with explicit forbidden dependencies
- Strong governance policy preventing unnecessary refactoring
- Zero behavioral changes across 30 ARs
- Transparent exception documentation

It does not earn A+ due to:
- 3 ADRs needing administrative resolution (W1)
- 2 modal accessibility violations miscategorized as "cosmetic" (W2)
- Missing error handling architecture section (W3)
- Thin performance rules (W4)

These are documentation and governance gaps, not architectural defects. They are straightforward to resolve and do not undermine the baseline's core quality.

---

### 1. Is this suitable as the repository's long-term architecture baseline?

**Yes, with the following conditions:**
- Resolve the 3 ADRs needing attention (H1) within one quarterly review cycle
- Recategorize the modal violations from "cosmetic" to "accessibility" (H2)
- Add an error handling architecture section (M1) before the next major feature cycle
- Move Repository Metrics to an appendix (M2)

These are bounded, low-effort improvements that do not change the baseline's substance.

### 2. Would you approve this for production governance?

**Yes.** The baseline is ready for production governance. It provides clear ownership, enforceable rules, a maintainable checklist, and a strict future audit policy. The improvements listed above would elevate it from A to A+ but are not blockers.

### 3. Should feature development now take priority over architecture work?

**Yes.** The architecture improvement program (30 ARs) is complete. All verified architectural defects have been addressed. The baseline is certified. Feature development should be the primary focus. Architecture work should be limited to:
- Inline corrections during feature PRs (as stated in the Future Audit Policy)
- New ARs that pass all 5 criteria (requiring fresh, objective repository evidence)

### 4. Should new Architecture Refactoring items be created only when backed by fresh repository evidence?

**Yes.** The 5-criteria policy is correct and should be enforced strictly. The 6 stale ARs closed during the program (AR-013, AR-016, AR-018, AR-019, AR-026, AR-028) demonstrate the importance of evidence-based decisions over backlog-based assumptions.

### 5. Are any new AR items currently justified based solely on this baseline document?

**No.** This baseline document, standing alone, does not contain repository evidence that would pass the 5-criteria gate:
- No measurable duplication identified (W1, W2, W3, W4 are governance gaps, not code duplication)
- No ownership improvements demonstrable without repository investigation
- No cross-layer violations proven (the remaining exceptions are documented and accepted)
- No behavioral defects documented

A new AR would require fresh grep-based repository investigation, not analysis of this baseline document.

---

*This completes the independent architecture review. The baseline is certified with minor conditions (see Part 13, Q1). All recommendations are bounded and justified. No speculative refactoring is recommended.*

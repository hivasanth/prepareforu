# SECURITY BASELINE

# Document Authority

**Authority:** Canonical security baseline for the PrepareForU application.
**Purpose:** Permanent record of security posture, enforcement points, scoring methodology, and review policy.
**Version:** 1.0.0
**Maintained by:** Security hardening phases (Phase 5.0–5.4E).

---

## Scope — What This Document Owns

This document is the **single source of truth** for:

| Ownership Area | What It Covers |
|---------------|---------------|
| Security posture measurement | Security score (currently 80/100), scoring methodology, score history |
| Trusted enforcement inventory | Every genuinely server-side enforcement point (Edge Functions, RLS, CHECK constraints, RPCs, triggers, managed services) |
| Client defense inventory | Every browser-side defense point (Zod schemas, repository validation, form validation) with explicit "NOT a security boundary" classification |
| Security baseline history | Phase-by-phase score progression and changes |
| Security review results | When reviews occurred, what was found, what changed |
| Security review policy | When the baseline must be reviewed (7 mandatory triggers) |

## Scope — What This Document MUST NOT Own

| Exclusion | Owner Document |
|-----------|---------------|
| Application architecture, folder structure, data flow | `PROJECT_ARCHITECTURE.md` |
| Security architecture overview (how security fits in the app) | `PROJECT_ARCHITECTURE.md` §10 |
| Design System governance, component contracts, change control | `FOUNDATION_GOVERNANCE.md` |
| Implementation workflow, migration steps, verification checklist | `DESIGN_SYSTEM_WORKFLOW.md` |
| Historical implementation logs, freeze records, adoption waves | `FOUNDATION_FREEZE_REGISTER.md` |
| AI onboarding, navigation, project summary | `AI_PROJECT_CONTEXT.md` |
| Runtime implementation details, code patterns, API usage | Source code and inline documentation |

---

## Document Relationships

This document is part of a 6-document stack. Each document has a single, non-overlapping responsibility.

```
AI_PROJECT_CONTEXT.md          ← "Read me first" entry point
    ↓ dispatches to
PROJECT_ARCHITECTURE.md        ← "How is the app built?"
    ↓ references for security details
SECURITY_BASELINE.md           ← "What is enforced and how do we measure it?"
    ↓ references for governance
FOUNDATION_GOVERNANCE.md       ← "What are the Design System rules?"
    ↓ references for workflow
DESIGN_SYSTEM_WORKFLOW.md      ← "How do I implement changes?"
    ↓ references for history
FOUNDATION_FREEZE_REGISTER.md  ← "What happened historically?"
```

### Relationship Details

| From | To | Relationship | Purpose |
|------|----|-------------|---------|
| AI_PROJECT_CONTEXT | SECURITY_BASELINE | Index reference | Entry point lists baseline in documentation index (row 6) |
| PROJECT_ARCHITECTURE §10 | SECURITY_BASELINE | Cross-reference | Architecture says "we use RLS"; baseline says "here are the 7 specific policies" |
| SECURITY_BASELINE | PROJECT_ARCHITECTURE | Back-reference | Baseline defers architectural context to §10 |
| SECURITY_BASELINE | FOUNDATION_GOVERNANCE | No relationship | Different domains — Design System governance ≠ application security |
| SECURITY_BASELINE | FOUNDATION_FREEZE_REGISTER | No relationship | Different content — current posture ≠ historical log |
| SECURITY_BASELINE | DESIGN_SYSTEM_WORKFLOW | No relationship | Different purpose — measurement ≠ implementation process |

---

## Change Policy

This document may be updated ONLY when one of the following occurs:

### Valid Update Triggers

| Trigger | What Changes | Example |
|---------|-------------|---------|
| Security audit completed | Score, enforcement inventory, or classification | New RLS policy added → update Trusted Enforcement Inventory |
| Security score changes | Score value, category breakdown, or history entry | Score improves from 80→85 after new CHECK constraints |
| Trusted enforcement changes | Enforcement inventory (add/remove/modify entries) | New Edge Function deployed → add to inventory |
| Classification changes | Client-only point reclassified as trusted (or vice versa) | Repository validation moved to server → reclassify |
| New regression suite | Test count in baseline register | New SQL tests added → update test count |
| Security review completed | Review results, findings, or remediation status | Annual security review → append to history |
| Scoring methodology changes | Category weights, rules, or interpretation scale | New category added → update methodology |

### Invalid Update Reasons (Do NOT update for)

| Reason | Why Not | Where It Belongs |
|--------|---------|-----------------|
| Feature development | Not a security change | Source code |
| UI changes | Not a security change | Source code |
| Foundation evolution | Design System concern | FOUNDATION_GOVERNANCE.md |
| Refactoring | Code organization, not security | Source code |
| Performance work | Different concern | PROJECT_ARCHITECTURE.md §11 |
| Accessibility work | Different concern | PROJECT_ARCHITECTURE.md + DESIGN_SYSTEM_WORKFLOW.md |
| Documentation reformatting | No security impact | Direct edit, no version bump |

---

## Canonical Ownership

Every documentation topic has exactly one owner. No duplicated ownership.

| Topic | Owner Document | Section |
|-------|---------------|---------|
| AI onboarding, navigation | `AI_PROJECT_CONTEXT.md` | Full document |
| Application architecture, folder structure, data flow | `PROJECT_ARCHITECTURE.md` | §1–§9, §11–§16 |
| Security architecture overview | `PROJECT_ARCHITECTURE.md` | §10 |
| Security posture measurement | `SECURITY_BASELINE.md` | Full document |
| Trusted enforcement inventory | `SECURITY_BASELINE.md` | Trusted Enforcement Inventory |
| Client defense inventory | `SECURITY_BASELINE.md` | Client Defense Inventory |
| Security scoring methodology | `SECURITY_BASELINE.md` | Security Scoring Methodology |
| Security review policy | `SECURITY_BASELINE.md` | Security Review Policy |
| Design System governance | `FOUNDATION_GOVERNANCE.md` | Full document |
| Implementation workflow | `DESIGN_SYSTEM_WORKFLOW.md` | Full document |
| Historical implementation logs | `FOUNDATION_FREEZE_REGISTER.md` | Full document |
| Security history (phase progression) | `SECURITY_BASELINE.md` | Security Baseline Register + Migration History |

### Ownership Verification

| Potential Overlap | Resolved? | How |
|-------------------|-----------|-----|
| Security architecture (ARCHITECTURE §10) vs Security posture (BASELINE) | ✅ | Architecture describes *how security fits in the app*. Baseline describes *what is enforced and how we measure it*. Complementary, not overlapping. |
| Security review policy (BASELINE) vs Governance review policy (GOVERNANCE §29) | ✅ | Baseline reviews *security enforcement*. Governance reviews *Design System changes*. Different domains. |
| Security history (BASELINE) vs Historical logs (FREEZE_REGISTER) | ✅ | Baseline records *score progression*. Register records *implementation events*. Different content. |

---

## Versioning

This document uses independent semantic versioning. Version changes only when the security baseline substance changes.

### Version Format

`MAJOR.MINOR.PATCH`

- **MAJOR** — Fundamental change to scoring methodology, category structure, or enforcement classification approach
- **MINOR** — Security score change, new enforcement point added, enforcement point removed, classification change
- **PATCH** — Wording corrections, formatting improvements, typo fixes (no substance change)

### When to Bump Versions

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| Scoring methodology restructured | MAJOR | Categories changed from 5 to 6 |
| Security score changes | MINOR | 80/100 → 85/100 |
| New trusted enforcement point | MINOR | New Edge Function added |
| Enforcement point removed | MINOR | RLS policy deleted |
| Classification changed | MINOR | Client-only point reclassified as trusted |
| New review trigger added | MINOR | 8th mandatory trigger added |
| Typo fix | PATCH | "enforcment" → "enforcement" |
| Formatting improvement | PATCH | Table alignment corrected |

### Current Version

**Version: 1.0.0** (established 2026-07-21, Phase 5.4E)

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-21 | Initial baseline: 80/100, 7 trusted points, 8 client points, 94 tests |

## Security Baseline Register

| Phase | Date | Score | Trusted Points | Client Points | Tests | RLS | CHECK | Status |
|-------|------|-------|---------------|---------------|-------|-----|-------|--------|
| Phase 5.0 (Audit) | 2026-07-21 | 38/100 | 0 | 8 | 0 | 0 | 0 | ✅ Complete |
| Phase 5.1 (Verification) | 2026-07-21 | 52/100 | 0 | 8 | 0 | 0 | 0 | ✅ Complete |
| Phase 5.2 (Remediation) | 2026-07-21 | 72/100 | 5 | 8 | 63 | 7 | 0 | ✅ Complete |
| Phase 5.3 (Regression) | 2026-07-21 | 78/100 | 5 | 8 | 94 | 7 | 0 | ✅ Complete |
| Phase 5.4 (Server Enforcement) | 2026-07-21 | 85/100 | 7 | 8 | 94 | 7 | 21 | ✅ Complete |
| Phase 5.4A (Stabilization) | 2026-07-21 | 88/100 | 7 | 8 | 94 | 7 | 21 | ✅ Complete |
| **Phase 5.4B (Certification)** | **2026-07-21** | **80/100** | **7** | **8** | **94** | **7** | **21** | **✅ CERTIFIED** |

**Current Score:** 80/100
**Trusted Enforcement Points:** 7
**Client Defense-in-Depth Points:** 8
**Regression Tests:** 94 (79 JS + 15 SQL)
**RLS Policies:** 7 (attempt_answers: 5, exams: 2)
**CHECK Constraints:** 21 (across 5 tables)

---

## Trusted Enforcement Inventory

Only enforcement points that execute in a trusted server-side environment
belong in this inventory. Client-side validation must never appear here.

### Edge Functions

| Name | File | Runtime | Purpose | Classification |
|------|------|---------|---------|---------------|
| security-gateway | `supabase/functions/security-gateway/index.ts` | Deno (Supabase Edge) | Rate limiting (10 req/60s via Upstash Redis) + Turnstile CAPTCHA verification on auth routes | TRUSTED |

### Database Triggers

| Name | Table | Purpose | Classification |
|------|-------|---------|---------------|
| prevent_user_role_escalation | users | Prevents role field modification by non-admin users | TRUSTED |

### CHECK Constraints (21 total)

| Table | Constraint | Rule | Classification |
|-------|-----------|------|---------------|
| exam_configs | chk_exam_configs_total_questions_positive | total_questions > 0 | TRUSTED |
| exam_configs | chk_exam_configs_total_marks_positive | total_marks > 0 | TRUSTED |
| exam_configs | chk_exam_configs_duration_positive | duration_minutes > 0 AND <= 1440 | TRUSTED |
| exam_configs | chk_exam_configs_negative_mark_value_non_negative | negative_mark_value >= 0 | TRUSTED |
| exam_papers | chk_exam_papers_total_questions_positive | total_questions > 0 | TRUSTED |
| exam_papers | chk_exam_papers_total_marks_positive | total_marks > 0 | TRUSTED |
| exam_papers | chk_exam_papers_duration_positive | duration_minutes > 0 AND <= 1440 | TRUSTED |
| exam_papers | chk_exam_papers_negative_mark_value_non_negative | negative_mark_value >= 0 | TRUSTED |
| exam_subjects | chk_exam_subjects_question_count_positive | question_count > 0 | TRUSTED |
| exam_subjects | chk_exam_subjects_marks_per_question_positive | marks_per_question >= 0.1 | TRUSTED |
| questions | chk_questions_question_text_en_not_empty | length(trim(question_text_en)) > 0 | TRUSTED |
| questions | chk_questions_option_a_en_not_empty | length(trim(option_a_en)) > 0 | TRUSTED |
| questions | chk_questions_option_b_en_not_empty | length(trim(option_b_en)) > 0 | TRUSTED |
| questions | chk_questions_option_c_en_not_empty | length(trim(option_c_en)) > 0 | TRUSTED |
| questions | chk_questions_option_d_en_not_empty | length(trim(option_d_en)) > 0 | TRUSTED |
| questions | chk_questions_correct_option_valid | correct_option IN ('A','B','C','D') | TRUSTED |
| questions | chk_questions_difficulty_valid | difficulty IN ('easy','medium','hard') | TRUSTED |
| attempt_answers | chk_attempt_answers_selected_option_valid | selected_option IS NULL OR IN ('A','B','C','D') | TRUSTED |
| attempt_answers | chk_attempt_answers_correct_option_valid | correct_option IN ('A','B','C','D') | TRUSTED |
| attempt_answers | chk_attempt_answers_marks_awarded_non_negative | marks_awarded >= 0 | TRUSTED |
| attempt_answers | chk_attempt_answers_time_spent_non_negative | time_spent_secs >= 0 | TRUSTED |

### RLS Policies (7 total)

| Table | Policy | Operation | Who | Classification |
|-------|--------|-----------|-----|---------------|
| attempt_answers | rls_attempt_answers_admin_all | ALL | Admin | TRUSTED |
| attempt_answers | rls_attempt_answers_user_select | SELECT | Own rows (via attempts join) | TRUSTED |
| attempt_answers | rls_attempt_answers_user_insert | INSERT | Own rows (via attempts join) | TRUSTED |
| attempt_answers | rls_attempt_answers_user_update | UPDATE | Own rows (via attempts join) | TRUSTED |
| attempt_answers | rls_attempt_answers_sub_admin_select | SELECT | Students' rows (via sub_admins join) | TRUSTED |
| exams | rls_exams_authenticated_select | SELECT | All authenticated | TRUSTED |
| exams | rls_exams_admin_all | ALL | Admin | TRUSTED |

### RPC Functions (Server-Side Validation)

| Function | File | Purpose | Classification |
|----------|------|---------|---------------|
| create_new_exam_rpc | `migrations/...000003_exam_rpc_validation.sql` | Full exam creation validation (mirrors examCreationSchema) before database mutation. SECURITY DEFINER. | TRUSTED |
| is_account_locked | `migrations/...000001_account_lockout.sql` | Checks account lockout status after failed login attempts | TRUSTED |
| record_failed_login | `migrations/...000001_account_lockout.sql` | Records failed login attempts and triggers lockout | TRUSTED |

### Managed Services

| Service | Provider | Purpose | Classification |
|---------|----------|---------|---------------|
| Supabase Auth | Supabase | Authentication, session management, JWT tokens, built-in password policy (min 6 chars) | TRUSTED |
| Upstash Redis | Upstash | Sliding window rate limiting for security-gateway Edge Function | TRUSTED |
| Cloudflare Turnstile | Cloudflare | CAPTCHA verification for auth routes | TRUSTED |

---

## Client Defense Inventory

These defenses execute in the browser and improve UX and data consistency.
They are NOT security boundaries. A malicious actor can bypass all of them
by making direct HTTP requests to the Supabase API.

### Shared Zod Schemas

| Schema | File | Purpose | Used By | Security Value |
|--------|------|---------|---------|---------------|
| passwordSchema | `src/validations/securitySchemas.ts` | Password complexity rules (min 8, uppercase, number, special char) | authService.updatePassword(), SubAdminSettings | Zero (UX only) |
| passwordCreateSchema | `src/validations/securitySchemas.ts` | Password + confirmation matching | UpdatePasswordPage | Zero (UX only) |
| passwordChangeSchema | `src/validations/securitySchemas.ts` | Current + new + confirm with same-password rejection | UserProfile | Zero (UX only) |
| examCreationSchema | `src/validations/securitySchemas.ts` | Full exam creation validation with subject count cross-validation | AddExamModal | Zero (RPC validates server-side) |
| SingleQuestionSchema | `src/validations/questionSchema.ts` | Question fields validation | SingleQuestionModal, BulkUploadModal | Zero (CHECK constraints provide partial server protection) |
| BulkQuestionSchema | `src/validations/questionSchema.ts` | Bulk question with legacy format normalization | BulkUploadModal | Zero (UX only) |
| topicUpsertSchema | `src/lib/repositories/exam.repository.ts` | Topic upsert validation | exam.repository.upsertTopic() | Zero (no server-side validation exists) |

### Repository-Layer Validation

| Function | File | Schema | Security Value |
|----------|------|--------|---------------|
| validateOrThrow() in upsertQuestion | `src/lib/repositories/question.repository.ts:219` | SingleQuestionSchema | Zero — runs in browser |
| validateOrThrow() in upsertQuestionNoIgnore | `src/lib/repositories/question.repository.ts:242` | SingleQuestionSchema | Zero — runs in browser |
| validateOrThrow() in upsertTopic | `src/lib/repositories/exam.repository.ts:294` | topicUpsertSchema | Zero — runs in browser |

**Note:** Comments in question.repository.ts and exam.repository.ts labeling these as
"Server-side validation guard" are inaccurate. The code executes in the browser.

### Service-Layer Validation

| Function | File | Schema | Security Value |
|----------|------|--------|---------------|
| authService.updatePassword() | `src/services/authService.ts:444` | passwordSchema | Zero — runs in browser |

### Form-Level Validation

| Component | File | Schema | Security Value |
|-----------|------|--------|---------------|
| AddExamModal | `src/components/admin/settings/AddExamModal.tsx` | examCreationSchema | Zero (RPC validates) |
| UpdatePasswordPage | `src/pages/auth/UpdatePasswordPage.tsx` | passwordCreateSchema | Zero (Supabase Auth has own rules) |
| UserProfile | `src/pages/user/UserProfile.tsx` | passwordChangeSchema | Zero (Supabase Auth has own rules) |
| SubAdminSettings | `src/pages/sub-admin/SubAdminSettings.tsx` | passwordSchema | Zero (Supabase Auth has own rules) |

---

## Security Scoring Methodology

The security score is calculated from 5 categories. Only trusted enforcement
contributes full score. Client-side validation contributes only to UX consistency.

### Categories

| Category | Max Points | What Contributes Full Score | What Contributes Partial Score |
|----------|-----------|---------------------------|-------------------------------|
| Authentication | 20 | Supabase Auth, account lockout, failed login recording, security gateway, enumeration prevention | — |
| Authorization (RLS) | 20 | RLS policies on all sensitive tables, role escalation prevention | — |
| Input Validation | 20 | Server-side RPC validation, CHECK constraints, Edge Function validation | Client-side Zod (0 points — UX only) |
| Data Integrity | 20 | CHECK constraints, foreign keys, referential integrity | — |
| Regression Protection | 20 | Security regression tests (JS + SQL), enforced at multiple layers | — |

### Scoring Rules

1. **Only TRUSTED enforcement contributes full security score.**
   - A CHECK constraint that prevents empty question text = full score.
   - A Zod schema that prevents empty question text in the browser = 0 security score.

2. **Client-side validation contributes to UX consistency, not security.**
   - Shared schemas ensure consistent error messages across forms.
   - This is valuable but not a security boundary.

3. **Score inflation is prevented by honest classification.**
   - If an enforcement point runs in the browser, it is CLIENT ONLY regardless
     of how it is labeled in code comments.
   - Phase 5.4B corrected 8 misclassified points.

4. **Each category is scored independently.**
   - Authentication: based on what protects login/signup/password flows.
   - Authorization: based on what controls row-level access.
   - Input Validation: based on what prevents invalid data at the server level.
   - Data Integrity: based on what prevents data corruption.
   - Regression Protection: based on what catches regressions.

### Score Interpretation

| Score Range | Meaning |
|-------------|---------|
| 90-100 | Enterprise-grade security. All critical paths have trusted enforcement. |
| 80-89 | Strong security. Most paths protected, minor gaps exist. |
| 70-79 | Good security. Core paths protected, some reliance on client-side. |
| 60-69 | Adequate security. Significant gaps requiring attention. |
| 50-59 | Below average. Multiple unprotected paths. |
| < 50 | Weak security. Fundamental gaps in enforcement. |

**Current Score: 80/100** — Strong security. Most paths protected, minor gaps exist.

---

## Security Review Policy

The security baseline should be reviewed when any of the following occur:

### Mandatory Review Triggers

| Trigger | Reason | Action |
|---------|--------|--------|
| New RPC function added | New server-side validation path | Audit input validation rules, add to Trusted Enforcement Inventory |
| New Edge Function added | New server-side execution context | Audit security implications, add to Trusted Enforcement Inventory |
| New privileged table created | New data requiring access control | Add RLS policies, add CHECK constraints, update inventory |
| New authentication flow | New login/signup/password path | Audit account enumeration, rate limiting, CAPTCHA coverage |
| New public endpoint | New API surface | Audit rate limiting, input validation, authorization |
| Major architecture change | SSR, new deployment model, new backend | Re-evaluate all execution contexts |
| Security incident | Vulnerability discovered | Root cause analysis, update baseline, add regression test |

### Review Process

1. Identify the new or changed component.
2. Classify its execution context (TRUSTED or CLIENT ONLY).
3. Update the appropriate inventory (Trusted or Client Defense).
4. Recalculate the security score if enforcement points changed.
5. Append to the Security Baseline Register.
6. Update this document.

### What Does NOT Trigger a Review

- New client-side form (add to Client Defense Inventory only)
- New Zod schema for UX validation (add to Client Defense Inventory only)
- UI changes that don't affect security
- Foundation component changes
- Documentation changes

---

## Security Changelog

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0 | 2026-07-21 | Initial security baseline established (Phase 5.4C) | AI (Phase 5.4C) |
| | | Security score: 80/100 | |
| | | 7 trusted enforcement points documented | |
| | | 8 client defense points documented | |
| | | 94 regression tests (79 JS + 15 SQL) | |
| | | 7 RLS policies, 21 CHECK constraints | |
| | | Scoring methodology documented | |
| | | Review policy established | |

---

## Migration History

Future security work must append to this register instead of replacing it.

| Phase | Date | Score | Major Changes | Tests Added | Status |
|-------|------|-------|---------------|-------------|--------|
| Phase 5.0 | 2026-07-21 | 38→52 | Audit, false positive removal | 0 | ✅ |
| Phase 5.1 | 2026-07-21 | 52→72 | RLS, shared schemas, form validation | 63 | ✅ |
| Phase 5.2 | 2026-07-21 | 72→78 | Regression suite, validation inventory | 31 | ✅ |
| Phase 5.3 | 2026-07-21 | 78→85 | Server enforcement, CHECK constraints | 0 | ✅ |
| Phase 5.4 | 2026-07-21 | 85→88 | Stabilization | 0 | ✅ |
| Phase 5.4B | 2026-07-21 | 88→80 | Honest reclassification | 0 | ✅ |
| Phase 5.4C | 2026-07-21 | 80 | Governance finalization | 0 | ✅ |

---

=====================================================
SECURITY BASELINE — PERMANENT RECORD ✅
=====================================================

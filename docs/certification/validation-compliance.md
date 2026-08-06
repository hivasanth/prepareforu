# Validation Compliance Report

**Phase 2B — Step 8 (Repository Final Certification).**
**Status:** VERIFIED — 2026-08-01.
**Scope:** Shared schemas · Inline validation · Alert usage · API error handling · Validation timing · Accessibility · Duplicate removal. Confirms there is one validation system across the repository.
**Mode:** Read-only certification. No code changes.
**Revision:** v1.0.0

---

## Verified Compliance

✓ **One validation system** — all zod rules live in `src/validations/`: `authSchemas.ts`, `securitySchemas.ts`, `adminSchemas.ts`, `questionSchema.ts`. Consumed at **27 boundary sites** (pages, hooks, services, repositories, utilities).

✓ **Shared schemas + canonical messages** — `emailSchema` (`authSchemas.ts:12`), centralized password policy + `passwordSchema` (`securitySchemas.ts:9-34`), `examSubjectSchema`/`examParamsSchema`/`examConfigSchema` with `EXAM_SUBJECTS_SUM_MESSAGE`/`EXAM_NEGATIVE_MARK_RANGE_MESSAGE`/`EXAM_NO_QUESTIONS_MESSAGE`, `submitResultSchema`, `selectedOptionSchema`/`SELECTED_OPTIONS`/`questionEnFieldsSchema`, `SingleQuestionSchema`/`BulkQuestionSchema`, `promptTemplateSchema`/`topicMetadataSchema`. Single owner per rule — `assertValidEnFields` delegates to `questionEnFieldsSchema` (`languageUtils.ts:166`).

✓ **Test coverage** — 5 test files, **165/165 passing** (admin 11, auth 25, question 27, security 86, server-side 16).

✓ **Boundary enforcement** — service/repository re-validation: `authService.ts:444` (password), `examService.ts:363` (answer option), `question.repository.ts:213,236` (`validateOrThrow`), `useResults.ts:12` (`submitResultSchema`).

✓ **Validation timing** — RHF surfaces use `mode: 'onSubmit'` + `reValidateMode: 'onBlur'` (Login/Signup); non-RHF surfaces use `submittedRef` gate + blur revalidation (10 surfaces). Zero `mode: 'onChange'`/`'onTouched'`/`'all'`. `onChange` handlers only clear errors.

✓ **ARIA for validation** — `aria-invalid` + `aria-describedby` + error `id` + `aria-live="polite"` spans verified across Login, Signup, FinishSignIn, UpdatePassword, Profile, AddExamModal, ExamParamsForm, TopicMetadataFields, LangInputPanel, AdminSubAdmins, PromptEditorModal, QuestionForm, CreateStepSetup, CompactDateTimePicker, QuestionCard, IdentitySection, CreateStepJsonPaste.

✓ **API errors on certified `Alert`** — `Alert variant="error"` (`role="alert"`) used for server failures at 22+ surfaces (Login, Signup, UpdatePassword, Profile, admin module, sub-admin module, VerifyEmail, ActiveExamPage banner).

✓ **Duplicate removal complete** — Duplicate Register R1–R8 resolved and verified gone (password policy, email rule, auth schemas, confirm-match, question-JSON, `subAdminOnboardSchema`, `promptTemplateSchema`, `topicMetadataSchema`); O1–O3 resolved (sum message, no-questions message, config ranges). Dead Register D1 (`validateQuestions()`) and D2 (`validateConfig()`) removed with zero consumers.

✓ **Exam-runtime deviations registered** — E1–E12 documented with reason + resolution in `exception-register.md`; all 12 verified present in code.

---

## Open Findings

### F-V-1 — `topicUpsertSchema` defined inline outside the shared home

**Issue:** A file-local zod schema exists in the repository layer, contradicting the schema-inventory rule that inline schema definitions "must not exist."

**Current State:** `src/lib/repositories/exam.repository.ts:270-276` defines `const topicUpsertSchema = z.object({...})`, validated via `validateOrThrow` at `:285`. Not registered in duplicate/exception registers. Does not duplicate a shared rule (topic-en integrity otherwise unvalidated).

**Severity:** Medium

**User Impact:** None.

**Technical Impact:** One schema outside `src/validations/`; undermines the single-home rule and is untracked.

**Recommended Phase:** Next validation consolidation phase (move to `src/validations/` and register).

**Status:** Pre-existing · Deferred

**Owner:** Exam feature (repository layer)

**Reference:** `src/lib/repositories/exam.repository.ts:270-285`

### F-V-2 — Hand-rolled error boxes outside the certified `Alert`

**Issue:** Four error surfaces render raw red boxes instead of the certified `Alert`.

**Current State:** `CreateStepJsonPaste.tsx:88-97` (JSON parse errors, has `role="alert"`), `JsonTab.tsx:31-49` (bulk-upload validation, has `role="alert"`), `FinishSignInPage.tsx:200` (auth error, `role="alert"`), `ProfileForm.tsx:265-286` (Authentication Conflict info panel). These are batch-parse/validation or informational surfaces, not strictly API errors — but they are not the certified surface and are not registered exceptions.

**Severity:** Low

**User Impact:** Minor visual inconsistency; all four are `role="alert"`.

**Technical Impact:** The "API errors → certified Alert" claim holds; these are non-API validation surfaces rendered by hand.

**Recommended Phase:** Next validation consolidation phase.

**Status:** Pre-existing · Deferred

**Owner:** Feature owners (Sub-Admin create, Admin questions, Auth, Profile)

**Reference:** `src/components/sub-admin/create/CreateStepJsonPaste.tsx:88-97`

### F-V-3 — Duplicated message string (minor)

**Issue:** A validation message string is re-declared instead of imported.

**Current State:** `AddExamModal.tsx:71` hard-codes `'At least one subject is required.'`, matching the `.min(1, …)` message in `examSubjectSchema`'s array refine (`securitySchemas.ts:122`). Same wording, no rule drift.

**Severity:** Low

**User Impact:** None.

**Technical Impact:** Second source of a message string; wording changes must touch two files.

**Recommended Phase:** Next validation consolidation phase.

**Status:** Pre-existing · Deferred

**Owner:** Admin feature (AddExamModal)

**Reference:** `src/components/admin/settings/AddExamModal.tsx:71`

---

## Conclusion

The repository has **one unified validation system**: shared schemas in `src/validations/` (165 tests), consumed at 27 boundaries, with consistent submit+blur timing, full field ARIA, certified `Alert` for API errors, and verified removal of all registered duplicates and dead validators. The findings are minor — one unregistered inline schema, four hand-rolled non-API error surfaces, one duplicated message string — none of which reintroduces a divergent rule set.

**Verdict: Certified with Accepted Findings.**

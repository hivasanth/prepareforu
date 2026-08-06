# Validation Architecture

**Phase 2B — Form Validation (Step 2: Schema Consolidation, Step 3: Auth & Profile, Step 4: Admin Module, Step 5: Sub-Admin Module, Step 6: Exam Runtime).**
**Status:** ACTIVE — updated 2026-08-01 (Step 6).

## Principle

> Schemas define validation rules. Forms consume schemas. Validation logic must exist only once.

## Layer model

```
src/validations/          ← single home for validation rules (zod schemas + helpers)
  ├─ authSchemas.ts        emailSchema, loginSchema, resetSchema, signupSchema,
  │                        subAdminOnboardSchema (+ inferred types)
  ├─ securitySchemas.ts    passwordSchema + policy predicates, passwordCreate/ChangeSchema,
  │                        exam scalar schemas + canonical EXAM_*_MESSAGE constants,
  │                        examCreationSchema, examParamsSchema, examConfigSchema,
  │                        identityUpdateSchema, submitResultSchema
  ├─ adminSchemas.ts       promptTemplateSchema, topicMetadataSchema (+ inferred types)
  └─ questionSchema.ts     SELECTED_OPTIONS, selectedOptionSchema, questionEnFieldsSchema,
                           SingleQuestionSchema, BulkQuestionSchema

Consumers (forms / services / repositories) — reference schemas, never re-declare rules:
  ├─ Pages:        LoginPage, SignupPage, AdminSubAdmins (subAdminOnboardSchema), AdminTopics,
  │                SubAdminSettings (IdentitySection via useSettings), ActiveExamPage,
  │                ResultsPage (useResults)
  ├─ Components:   ProfileForm/useProfile, UpdatePasswordPage, AddExamModal, ExamParamsForm/
  │                useAdminSettings, SubjectDistributionPanel, SingleQuestionModal, QuestionForm,
  │                PromptEditorModal, useBulkUpload, CreateStepJsonPaste, CreateStepSetup,
  │                QuestionCard, CreateStepPublish, CreateStepReview, useCreateExam,
  │                useExamKeyboard (SELECTED_OPTIONS)
  ├─ Services:     authService.updatePassword (passwordSchema), examService.setQuestionAnswer
  │                (selectedOptionSchema)
  └─ Repositories: question.repository (SingleQuestionSchema via validateOrThrow)
  └─ Utilities:    languageUtils.assertValidEnFields (questionEnFieldsSchema),
                   useResults.normalizeResult (submitResultSchema)
```

## Rule ownership

| Rule | Single owner | Consumers |
|---|---|---|
| Password policy (min 8, upper, number, special) | `securitySchemas.ts` constants + `passwordSchema` | signup, create/change password, service re-validation, strength meter, badge checklist |
| Email format | `emailSchema` (`authSchemas.ts`) | login, reset, signup, admin sub-admin onboarding (via `subAdminOnboardSchema`) |
| Auth form shapes | `loginSchema` / `resetSchema` / `signupSchema` / `subAdminOnboardSchema` (`authSchemas.ts`) | LoginPage, SignupPage, AdminSubAdmins |
| Exam ranges + subject-sum | exam scalar schemas + `EXAM_*_MESSAGE` constants + `examCreationSchema` / `examParamsSchema` / `examConfigSchema` (`securitySchemas.ts`) | AddExamModal, ExamParamsForm/useAdminSettings, SubjectDistributionPanel, CreateStepSetup |
| Sub-Admin identity update | `identityUpdateSchema` (`securitySchemas.ts`, password rule via `passwordSchema`) | useSettings/IdentitySection |
| No-questions guard wording | `EXAM_NO_QUESTIONS_MESSAGE` (`securitySchemas.ts`) | useCreateExam step-guard, useCreateExam.handlePublish, CreateStepReview |
| Admin template / topic metadata | `promptTemplateSchema` / `topicMetadataSchema` (`adminSchemas.ts`) | PromptEditorModal, useAdminTopics |
| Question (single / bulk JSON) | `SingleQuestionSchema` / `BulkQuestionSchema` (`questionSchema.ts`) | modal, repository layer, bulk upload, sub-admin JSON paste |
| Answer option (A–D) | `selectedOptionSchema` + `SELECTED_OPTIONS` (`questionSchema.ts`) | `examService.setQuestionAnswer` (service-boundary guard), `useExamKeyboard` |
| Question EN fields | `questionEnFieldsSchema` (`questionSchema.ts`) | `SingleQuestionSchema` / `BulkQuestionSchema` (derive), `assertValidEnFields` |
| Submit result parsing | `submitResultSchema` (`securitySchemas.ts`) | `useResults.normalizeResult` |

## Consumers vs rules matrix (post-Step 2)

| Consumer | Rule source |
|---|---|
| `LoginPage` login form | `loginSchema` |
| `LoginPage` reset modal | `resetSchema` |
| `SignupPage` signup form | `signupSchema` (password rule via `passwordSchema`) |
| `SignupPage` strength meter | `getPasswordStrengthScore` |
| `UpdatePasswordPage` | `passwordCreateSchema` |
| `ProfileForm` / `useProfile` validation | `passwordChangeSchema` |
| `ProfileForm` / `useProfile` badge checklist | `hasMinLength`/`hasUppercase`/`hasNumber`/`hasSpecial` |
| `AdminSubAdmins` onboarding | `subAdminOnboardSchema` |
| `authService.updatePassword` | `passwordSchema` |
| `useSettings.handleSaveProfile` | `passwordSchema` |
| `AddExamModal` | `examCreationSchema` (per-field inline + submit/blur) |
| `ExamParamsForm` / `useAdminSettings.saveConfig` | `examParamsSchema` |
| `SubjectDistributionPanel` / `saveSubjects` | `examCreationSchema` sum refine + `EXAM_SUBJECTS_SUM_MESSAGE` |
| `PromptEditorModal` | `promptTemplateSchema` |
| `useAdminTopics` (AdminTopics) | `topicMetadataSchema` + title/content presence checks |
| `SingleQuestionModal` / `QuestionForm` | `SingleQuestionSchema` (per-field) |
| `question.repository` | `SingleQuestionSchema` (via `validateOrThrow`) |
| `useBulkUpload.processJsonData` | `BulkQuestionSchema` (per row) |
| `CreateStepJsonPaste.handleParse` | `BulkQuestionSchema` (per row) + structural batch guards |
| `CreateStepSetup` | `examConfigSchema` (per-field inline + submit/blur) |
| `QuestionCard` (edit save) | `BulkQuestionSchema` (per-field inline) |
| `CreateStepPublish` | certified `Alert` for API failures (no field rules) |
| `useCreateExam` / `CreateStepReview` | `EXAM_NO_QUESTIONS_MESSAGE` guard |
| `useSettings` / `IdentitySection` | `identityUpdateSchema` (per-field inline + submit/blur) |
| `examService.setQuestionAnswer` | `selectedOptionSchema` (service-boundary option-rule guard) |
| `useExamKeyboard` | `SELECTED_OPTIONS` (keyboard option derivation) |
| `useResults.normalizeResult` | `submitResultSchema` (result-payload parsing) |
| `assertValidEnFields` (`languageUtils.ts`) | `questionEnFieldsSchema` (post-fetch EN integrity) |

## Message canonicalization

- One canonical message per rule. The same rule always produces the same message.
- Canonical email message: `Enter a valid email address` (`emailSchema`).
- Canonical password messages: defined once in `passwordSchema` (`Password must be at least 8 characters`, `Must include an uppercase letter`, `Must include a number`, `Must include a special character`).
- Canonical confirm-match message: `Passwords do not match`.
- Canonical subject-sum message: `EXAM_SUBJECTS_SUM_MESSAGE` (`securitySchemas.ts`) — used by `AddExamModal`, `SubjectDistributionPanel`, and both exam schemas.
- Canonical negative-mark range message: `EXAM_NEGATIVE_MARK_RANGE_MESSAGE` (`securitySchemas.ts`) — used by `examCreationSchema`, `examParamsSchema`, and Sub-Admin `examConfigSchema`.
- Canonical no-questions message: `EXAM_NO_QUESTIONS_MESSAGE` (`securitySchemas.ts`) — used by `useCreateExam` step-guard, publish guard, and `CreateStepReview`.
- Messages continue to flow through `t()` where the original consumers wrapped them; the identity `t` stub is preserved unchanged.

## Out of scope for this document

- Error **presentation** (D2/D6/D7 of the audit) — canonical pattern established in Steps 3–5; the exam runtime deliberately deviates per the Golden Rule — see `exception-register.md` (E1–E12); remaining User surfaces still later steps.
- Validation **timing** (D3) — canonical submit + blur timing established in Steps 3–5; exam answers auto-save and are transient, so the timing model does not apply there (exception E9).
- Remaining rule duplicates (confirm-match UI status, non-schema rule duplicates) — tracked in Duplicate Register as O4–O5, deferred to later steps.
- The broad a11y sweep (palette `aria-current`, review/search labels, focus restore, radiogroup semantics, ErrorState `role="alert"`, review announcements) — deferred to Step 7.

---

## Change Record

- v1.0.0 — 2026-08-01 — Step 2: documented single-source-of-truth model; auth schemas moved to `authSchemas.ts`; password helpers centralized; `BulkQuestionSchema` becomes the single question-JSON validation source.
- v1.1.0 — 2026-08-01 — Step 4: added `adminSchemas.ts` (`promptTemplateSchema`, `topicMetadataSchema`); added `subAdminOnboardSchema` (authSchemas) and `examParamsSchema` + shared exam scalars + canonical `EXAM_*_MESSAGE` constants (securitySchemas); consumer matrix extended for the Admin module.
- v1.2.0 — 2026-08-01 — Step 5: added `examConfigSchema` + `identityUpdateSchema` + `EXAM_NO_QUESTIONS_MESSAGE` (securitySchemas); consumer matrix extended for the Sub-Admin module (CreateStepSetup, QuestionCard, CreateStepPublish/Review, useCreateExam, useSettings/IdentitySection).
- v1.3.0 — 2026-08-01 — Step 6: added `selectedOptionSchema` + `SELECTED_OPTIONS` + `questionEnFieldsSchema` (questionSchema) and `submitResultSchema` (securitySchemas); consumer matrix extended for the exam runtime (setQuestionAnswer, useExamKeyboard, useResults.normalizeResult, assertValidEnFields). Exam-experience deviations registered in `exception-register.md`.

# Validation Schema Inventory

**Phase 2B — Form Validation (Step 2: Schema Consolidation, Step 3: Auth & Profile, Step 4: Admin Module, Step 5: Sub-Admin Module, Step 6: Exam Runtime).**
**Status:** ACTIVE — updated 2026-08-01 (Step 6).
**Principle:** One rule. One schema. Many consumers. Validation logic exists only once.

This inventory lists every shared validation schema and reusable validation helper in the repository, its owning file, and its consumers. File-local / inline schema definitions are **not** listed because the repository rule is that they must not exist (see Duplicate Register).

---

## 1. Authentication schemas

Owning file: `src/validations/authSchemas.ts`

| Schema | Shape | Consumers |
|---|---|---|
| `emailSchema` | `z.string().email('Enter a valid email address')` — canonical email rule | `loginSchema`, `resetSchema`, `signupSchema`, `AdminSubAdmins` (`handleAddSubAdmin`), `FinishSignInPage` (confirm-email form) |
| `loginSchema` | `email: emailSchema`, `password: min 1` | `LoginPage` (RHF + zodResolver) |
| `resetSchema` | `email: emailSchema` | `LoginPage` reset-password modal (RHF + zodResolver) |
| `signupSchema` | `fullName` min 2, `email`, `password` (shared `passwordSchema`), `confirmPassword` + match refine, `couponCode` optional, `examSelection` min 1 | `SignupPage` (RHF + zodResolver, submit + blur timing) |
| `subAdminOnboardSchema` | `name` min 2, `email: z.string().trim().pipe(emailSchema)`, `couponCode` min 3 | `AdminSubAdmins.handleAddSubAdmin` (per-field inline errors, submit + blur timing) |

Inferred types: `LoginFormData`, `ResetFormData`, `SignupFormData`, `SubAdminOnboardInput`.

## 2. Security schemas

Owning file: `src/validations/securitySchemas.ts`

| Schema | Shape | Consumers |
|---|---|---|
| `passwordSchema` | min 8 + uppercase + number + special (single canonical password policy) | `signupSchema`, `passwordCreateSchema`, `passwordChangeSchema`, `authService.updatePassword`, `useSettings.handleSaveProfile` |
| `passwordCreateSchema` | `password` + `confirmPassword` + match refine | `UpdatePasswordPage` |
| `passwordChangeSchema` | `currentPass` min 1 + `newPass` + `confirmPass` + match refine + different-from-current refine | `useProfile.handlePasswordUpdate` |
| `examCreationSchema` | exam metadata, ranges, subject-sum refine, negative-mark refine | `AddExamModal` (per-field inline + submit/blur), `serverSideValidation.test` |
| `examParamsSchema` | config-shaped range schema: `total_questions` (1–1000), `total_marks` (min 1), `duration_minutes` (1–1440), `negative_marking` enum, `negative_mark_value` (min 0) + cross-field refine (negative mark ≤ marks/question) — the only validation for the previously-unvalidated settings save | `useAdminSettings.validateParams` (via `saveConfig`) |
| `examConfigSchema` | Sub-Admin create-wizard Setup shape: `title` trimmed required/min 5/max 120, `start_time`/`end_time` required, `duration_minutes` (shared scalar), `marks_per_question` positive max 100, `negative_mark_value` (shared scalar) + cross-field refines (penalty ≤ marks/question, start not in past, end after start, duration ≤ window, window ≤ 30 days) — replaces the removed file-local `validateConfig()` | `CreateStepSetup` (per-field inline + submit/blur) |
| `identityUpdateSchema` | Sub-Admin settings Identity: `name` required (trimmed), `password` optional — when non-blank validated through the shared `passwordSchema` with each policy issue surfaced at the `password` path | `useSettings.handleSaveProfile` (per-field inline + submit/blur) |
| `submitResultSchema` | Exam submit-result parsing: coerces `correct_count`/`total_questions`/`attempt_count`/`marks_earned`/`negative_marks` and accepts `correct`/`correct_count` + `duration_seconds`/`duration` variants; transform emits the canonical shape (`SubmitResultInput` → `SubmitResultParsed`) | `useResults.normalizeResult` (replaces manual `any` parsing; fallback zeros on failure) |

Reusable exam scalars + canonical messages (single source of truth — `examCreationSchema` and `examParamsSchema` derive from the same scalars so creation ranges and params ranges cannot drift):

| Item | Definition |
|---|---|
| `examTotalQuestionsSchema` | 1–1000 |
| `examTotalMarksSchema` | min 1 |
| `examDurationMinutesSchema` | 1–1440 |
| `examNegativeMarkValueSchema` | min 0 |
| `examSubjectSchema` | `subjectName` min 1, `questionCount` min 1, `marksPerQuestion` min 1 |
| `EXAM_SUBJECTS_SUM_MESSAGE` | canonical subject-sum wording (creation refine + params refine + AddExamModal + SubjectDistribution) |
| `EXAM_NEGATIVE_MARK_RANGE_MESSAGE` | canonical negative-mark-range wording (creation + params + Sub-Admin `examConfigSchema`) |
| `EXAM_NO_QUESTIONS_MESSAGE` | canonical no-questions wording (`'At least one question is required before proceeding'`) — used by `useCreateExam` step-guard, `useCreateExam.handlePublish`, and `CreateStepReview` |

Reusable password policy helpers (single source of truth for the rules — the schema and the helpers derive from the same regex constants):

| Helper | Definition |
|---|---|
| `PASSWORD_MIN_LENGTH` | `8` |
| `PASSWORD_UPPERCASE_REGEX` | `/[A-Z]/` |
| `PASSWORD_NUMBER_REGEX` | `/[0-9]/` |
| `PASSWORD_SPECIAL_REGEX` | `/[^A-Za-z0-9]/` |
| `hasMinLength` / `hasUppercase` / `hasNumber` / `hasSpecial` | boolean predicates over the regex constants |
| `getPasswordStrengthScore` | 0–4 score, one point per satisfied rule |

Consumers of the helpers: `SignupPage` (strength meter → `getPasswordStrengthScore`), `useProfile` (5-badge checklist → `hasMinLength`/`hasUppercase`/`hasNumber`/`hasSpecial`).

## 3. Question schemas

Owning file: `src/validations/questionSchema.ts`

| Schema | Shape | Consumers |
|---|---|---|
| `SELECTED_OPTIONS` | `['A', 'B', 'C', 'D'] as const` — the single definition of valid answer options | `selectedOptionSchema`, `useExamKeyboard`, `QuestionActions` |
| `selectedOptionSchema` | `z.enum(['A', 'B', 'C', 'D'])` — canonical answer-option rule | `examService.setQuestionAnswer` (service-boundary guard, throws `'Invalid answer option. Answer options are limited to A-D.'`) |
| `questionEnFieldsSchema` | required trimmed EN question + options A–D (single owner of the EN-field rule) | `SingleQuestionSchema`, `BulkQuestionSchema`, `assertValidEnFields` (`languageUtils.ts`) |
| `SingleQuestionSchema` | `questionEnFieldsSchema.extend(...)` — required bilingual question fields + exam context (exam_id, paper_id, subject_name) | `SingleQuestionModal`, `question.repository` (`upsertQuestion`, `upsertQuestionNoIgnore` via `validateOrThrow`) |
| `BulkQuestionSchema` | legacy→canonical normalization (`z.pipe(z.transform, z.object)`) + required EN fields via `...questionEnFieldsSchema.shape`, correct_option A–D, difficulty easy/medium/hard | `useBulkUpload.processJsonData` (per row), `CreateStepJsonPaste.handleParse` (per row), `QuestionCard` (edit save) |

## 4. Admin schemas

Owning file: `src/validations/adminSchemas.ts`

| Schema | Shape | Consumers |
|---|---|---|
| `promptTemplateSchema` | `topic_name` min 1, `prompt_text` min 1 — single owner for the required prompt-template fields (replaced the manual non-empty guard) | `useAdminTopics` via `PromptEditorModal` (per-field inline + submit/blur) |
| `topicMetadataSchema` | `display_order` int min 1, `youtube_url` optional valid URL — single owner for topic metadata (replaced manual `setError`-driven checks) | `useAdminTopics.computeErrors` (per-field inline + submit/blur) |

---

## Change Record

- v1.0.0 — 2026-08-01 — Step 2: added `authSchemas.ts` (`emailSchema`, `loginSchema`, `resetSchema`, `signupSchema`); added password policy helpers to `securitySchemas.ts`; removed file-local `loginSchema`/`resetSchema`/`signupSchema` from `LoginPage`/`SignupPage`; removed `getPasswordStrength` from `SignupPage`; removed `has*` regexes from `useProfile`; `CreateStepJsonPaste` now consumes `BulkQuestionSchema`.
- v1.0.1 — 2026-08-01 — Step 3: Auth & Profile now the canonical validation reference — `emailSchema` additionally consumed by `FinishSignInPage` (confirm-email form); `passwordCreateSchema` consumers unchanged (`UpdatePasswordPage` per-field), `passwordChangeSchema` consumers unchanged (`useProfile` per-field); Login/Signup timing moved to submit + blur. See `validation-migration-report.md`.
- v1.0.2 — 2026-08-01 — Step 4: Admin module on the shared schemas. Added `subAdminOnboardSchema` to `authSchemas.ts` (AdminSubAdmins now consumes it instead of bare `emailSchema`); added `examParamsSchema` + shared exam scalars + `EXAM_SUBJECTS_SUM_MESSAGE` / `EXAM_NEGATIVE_MARK_RANGE_MESSAGE` to `securitySchemas.ts` (`examCreationSchema` derives from the scalars); new `adminSchemas.ts` with `promptTemplateSchema` (PromptEditorModal) + `topicMetadataSchema` (AdminTopics). See `validation-migration-report.md` A10–A17.
- v1.0.3 — 2026-08-01 — Step 5: Sub-Admin module on the shared schemas. Added `examConfigSchema` (replaces the removed file-local `validateConfig()`, reuses the shared range scalars) and `identityUpdateSchema` to `securitySchemas.ts`; added canonical `EXAM_NO_QUESTIONS_MESSAGE` (no-questions guard). Consumers: `CreateStepSetup`, `useSettings.handleSaveProfile`, `useCreateExam`, `CreateStepReview`. See `validation-migration-report.md` A18–A24.
- v1.0.4 — 2026-08-01 — Step 6: Exam runtime on the shared schemas. Added `selectedOptionSchema` + `SELECTED_OPTIONS` + `questionEnFieldsSchema` to `questionSchema.ts` (`SingleQuestionSchema`/`BulkQuestionSchema` now derive from `questionEnFieldsSchema`; `assertValidEnFields` consumes it as the single EN-rule owner) and `submitResultSchema` to `securitySchemas.ts`. Consumers: `examService.setQuestionAnswer`, `useExamKeyboard`, `useResults.normalizeResult`. See `validation-migration-report.md` A25–A34.

# Validation Duplicate Register

**Phase 2B — Form Validation (Steps 2–5: Schema Consolidation, Auth & Profile, Admin Module, Sub-Admin Module).**
**Status:** ACTIVE — updated 2026-08-01 (Step 5).
**Purpose:** Track every duplicated validation rule, its removal, and its canonical replacement. Duplicates closed are marked **RESOLVED**; duplicates deferred to later steps remain **OPEN**.

Repository rule: **One rule. One schema. Many consumers. Never duplicate validation logic.**

---

## Resolved in Step 2

### R1 — Password policy (min 8 + uppercase + number + special)
- **Before:** 4 implementations — `securitySchemas.passwordSchema` (canonical), `SignupPage` local `signupSchema`, `SignupPage.getPasswordStrength` regexes, `useProfile` `has*` regexes. (Audit C1.)
- **After:** 1 implementation — regex constants `PASSWORD_*_REGEX` in `securitySchemas.ts`; `passwordSchema` and the predicates (`hasMinLength`/`hasUppercase`/`hasNumber`/`hasSpecial`/`getPasswordStrengthScore`) all derive from them.
- **Consumers migrated:** `SignupPage` (schema → shared `signupSchema.password`, strength meter → `getPasswordStrengthScore`), `useProfile` (badge checklist → shared predicates).
- **Status:** RESOLVED.

### R2 — Email-format rule
- **Before:** divergent messages for the same rule — Login `'Enter a valid email address.'`, Signup `'Enter a valid email'`, `AdminSubAdmins` manual regex `'Please enter a valid email address.'`. (Audit C2, C12.)
- **After:** single `emailSchema` in `authSchemas.ts` producing canonical message `'Enter a valid email address'` (stray punctuation dropped per audit D8). All three flows now use it.
- **Status:** RESOLVED.

### R3 — Login/Signup auth schemas (file-local)
- **Before:** `loginSchema`/`resetSchema` defined in `LoginPage.tsx`; `signupSchema` defined in `SignupPage.tsx` — file-local duplicates with a shared password/email policy embedded. (Audit D5.)
- **After:** shared `loginSchema`/`resetSchema`/`signupSchema` in `authSchemas.ts`; pages reference them.
- **Status:** RESOLVED.

### R4 — Confirm-password match rule
- **Before:** `SignupPage` local `.refine` + shared `passwordCreateSchema`/`passwordChangeSchema` refines + `useProfile.passwordMatch`. (Audit C2.)
- **After:** `signupSchema` (shared) carries the match refine using the canonical message `'Passwords do not match'`; `passwordCreateSchema`/`passwordChangeSchema` unchanged. `useProfile.passwordMatch` is a derived UI-status boolean, not a message-bearing rule — retained.
- **Status:** RESOLVED (for the auth/signup path).

### R5 — Question-JSON validation
- **Before:** 3 implementations — dead `types.ts validateQuestions()`, near-verbatim manual parser in `CreateStepJsonPaste.handleParse`, shared `BulkQuestionSchema` (unused by sub-admin). (Audit C5.)
- **After:** `CreateStepJsonPaste` validates each row with `BulkQuestionSchema` (issues surfaced per row). Structural batch checks (empty / size / root-array / empty-array / 200-row cap) retained in the flow as non-schema guards. `validateQuestions()` removed (see Dead Register D1).
- **Status:** RESOLVED.

### R6 — AdminSubAdmins manual validation
- **Before:** `handleAddSubAdmin` manual `if (!name || !email || !coupon) return` (silently ignored) + inline email-regex check with divergent message `'Please enter a valid email address.'`, alongside the shared `emailSchema` `'Enter a valid email address'`. (Audit C12.)
- **After:** `subAdminOnboardSchema` in `authSchemas.ts` (name min 2, trimmed `emailSchema`, coupon min 3) — one owner for the onboarding rules; per-field inline errors.
- **Consumers migrated:** `AdminSubAdmins.handleAddSubAdmin`. Coupon normalization (`trim().toUpperCase()`) happens once at submit (the live-typing uppercase was removed).
- **Status:** RESOLVED.

### R7 — Prompt-template required guard (2 copies)
- **Before:** `PromptEditorModal` manual non-empty guard `'Topic name and Prompt text are required.'` + `useBulkUpload.handleSavePrompt` early-return on empty strings.
- **After:** single `promptTemplateSchema` in `adminSchemas.ts` (topic_name / prompt_text min 1); the redundant guard in `handleSavePrompt` removed.
- **Status:** RESOLVED.

### R8 — Topic title/content/metadata manual checks
- **Before:** `useAdminTopics.handleSave` manual `setError`-driven checks for title/content presence, display_order, youtube_url format.
- **After:** single `topicMetadataSchema` in `adminSchemas.ts` (display_order int min 1, youtube_url optional valid URL) + EN title/content presence checked by `computeErrors`; all rendered as inline field errors.
- **Status:** RESOLVED.

---

## Remaining duplicates (deferred to later steps — NOT touched)

These were identified in the audit and are intentionally **out of scope** for Step 2's approved work. They belong to the Admin / Sub-Admin / Exam steps of the migration plan.

### O1 — Subject-question-sum rule
- **RESOLVED in Step 4.** The 3 wordings became 1 canonical `EXAM_SUBJECTS_SUM_MESSAGE` in `securitySchemas.ts`. `AddExamModal`'s inline string + `isSumValid` submit gate removed (badge kept as status); `useAdminSettings.saveSubjects` throw replaced with inline `subjectsError`; the creation refine now derives from the same constant.
- **Status:** RESOLVED (Step 4).

### O2 — Empty-questions guard (3 copies)
`useCreateExam.handleStepChange`, `useCreateExam.handlePublish`, `CreateStepReview` inline. (Audit C4.)
- **RESOLVED in Step 5.** All 3 wordings became 1 canonical `EXAM_NO_QUESTIONS_MESSAGE` in `securitySchemas.ts` (`'At least one question is required before proceeding'`). The step-guard, publish guard, and Review-screen button all consume the constant; the Review-screen no-questions state still renders as its approved inline error.
- **Status:** RESOLVED (Step 5).

### O3 — Exam config ranges (`validateConfig` vs `examCreationSchema`)
`create/types.ts validateConfig()` and `examCreationSchema` express the same limits with different wording. (Audit C6.)
- **RESOLVED in Step 5.** `validateConfig()` **removed** (Dead Register D2); its replacement `examConfigSchema` in `securitySchemas.ts` reuses the shared range scalars (`examDurationMinutesSchema`, `examNegativeMarkValueSchema`) and the canonical `EXAM_NEGATIVE_MARK_RANGE_MESSAGE`, so the Sub-Admin wizard ranges and the Admin creation/params ranges cannot drift.
- **Status:** RESOLVED (Step 5).

### O4 — Password confirm-match in `useProfile.passwordMatch`
UI-status boolean duplication of the refine (no message). Kept as derived UI state; candidate for a shared `passwordMatches` helper in a later a11y/message step. (Audit C2.)

### O5 — Coupon uppercasing, success toast, review filter, canProceed, "Telugu Translation Unavailable"
Non-schema rule duplicates tracked by the audit (C7–C11). Deferred to their owning steps.

---

## Change Record

- v1.0.0 — 2026-08-01 — Step 2: resolved R1–R5 (password policy, email rule, auth schemas, confirm-match, question-JSON validation); registered O1–O5 as deferred.
- v1.1.0 — 2026-08-01 — Step 4: resolved O1 (subject-sum → canonical `EXAM_SUBJECTS_SUM_MESSAGE`); added and resolved R6 (AdminSubAdmins manual check → `subAdminOnboardSchema`), R7 (prompt-template guard → `promptTemplateSchema`), R8 (topic title/content/meta checks → `topicMetadataSchema`).
- v1.2.0 — 2026-08-01 — Step 5: resolved O2 (empty-questions guard → canonical `EXAM_NO_QUESTIONS_MESSAGE` across step-guard/publish/review) and O3 (exam-config ranges — `validateConfig()` removed, replaced by shared `examConfigSchema` reusing the shared range scalars). Remaining deferred: O4 (confirm-match UI status), O5 (non-schema rule duplicates).

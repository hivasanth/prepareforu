# Phase 2 — Design System Polish & UX Standardization

**Phase 1 (Step 6 Design System migration):** COMPLETE and certified.
**Foundation:** FROZEN (repo v2.0.0). No repository-wide migrations. Polish only.
**Golden Reference:** User Panel (spacing, colors, containers, cards, buttons, typography, hover, transitions, animations, loading states).
**Execution model:** One category at a time — Audit → Approve → Implement → Validate → Certify → Freeze.
**Start:** 2026-08-01

---

## Phase 2A — Button System

### Status: COMPLETE (certified)

---

### Audit findings

- Certified `Button`/`IconButton` is already the single button system. Geometry (padding, radius, typography, hover, transition, loading, disabled) is enforced per-size by the component across 117 `Button` + 23 `IconButton` usages. Only 3 geometry/typography `className` overrides exist (`BulkActionBar` ×2, `QuestionCard` ×1 raw) — negligible.
- 66 raw `<button>` elements are internals of certified low-level controls (`SegmentedFilter`, `PremiumSelect`, `Menu`, `Navigation`, `NotificationPanel`, `ThemeToggle`, `AntigravityData/Form/Results`) + Phase 1 registered exceptions (E22–E75) + test file — not a button-language divergence.
- Inconsistencies found:
  1. No `warning` variant on certified `Button` (Phase 2A maps Retry/Refresh → Warning).
  2. Neutral Cancel/Back/Close split: `secondary` ×6 vs `ghost` ×4 across 8 files.
  3. "Close Review" (ReviewView) rendered `danger` — non-destructive.
  4. "Reset Via Email" (ProfileForm) rendered `danger` — non-destructive.
  5. "Sign Out" mixed: `danger` (SidebarLayout) vs `auth-muted` (AccountDisabledPage).
  6. "Finish" (exam submit) rendered `danger` — primary completion action.
  7. "Retry" split: `primary` (certified `RetryButton`/`ErrorState`/`UploadProgressOverlay`) vs `danger` (ExamDetailSection).

### Approved decisions

- **D1 — Warning variant:** KEEP AS-IS. No new `warning` variant on the frozen foundation. Retry/Refresh remain on existing variants.
- **D2 — Neutral canonical:** `secondary` is the single neutral style for Cancel/Back/Close/Return.
- **D3 — Semantic mapping** (approved verbatim):
  - Primary → main positive action (Start, Continue, Save, Submit, **Finish**, Next, Confirm)
  - Secondary → neutral (Cancel, Back, Go Back, Close, Return, Previous, **Reset Via Email**, **Close Review**)
  - Warning → attention, non-destructive (Retry, Refresh, Reload, Reconnect, Try Again) — no variant, kept on existing
  - Danger → destructive/security-sensitive only (Delete, Remove, Logout, **Sign Out**, Reset Account, Revoke Access)
  - Ghost → low-emphasis utility only (toolbar/inline/overflow/icon-text); never the standard neutral page action
- **D4 — Exceptions:** E22–E75 remain frozen (compact micro-actions; no geometry/redesign changes in 2A).

### Implementation (11 variant-only changes — no geometry, typography, spacing, hover, transition, or animation changes)

| # | File | Button | Change |
|---|---|---|---|
| 1 | `src/components/user/prepare-write/ReviewView.tsx:101` | Close Review | `danger` → `secondary` |
| 2 | `src/components/profile/ProfileForm.tsx:246` | Reset Via Email | `danger` → `secondary` |
| 3 | `src/pages/AccountDisabledPage.tsx:53` | SIGN OUT | `auth-muted` → `danger` |
| 4 | `src/pages/exam/ActiveExamPage.tsx:104` | Finish | `danger` → `primary` (confirm modal untouched) |
| 5 | `src/components/sub-admin/exams/ExamDetailSection.tsx:150` | Retry | `danger` → `primary` (aligns certified `RetryButton`; removes Danger misuse of a non-destructive action) |
| 6 | `src/components/admin/questions/modals/BulkUploadModal.tsx:83` | Cancel | `ghost` → `secondary` |
| 7 | `src/components/admin/questions/modals/BulkUploadModal.tsx:95` | Back to Instructions | `ghost` → `secondary` |
| 8 | `src/components/admin/upload/UploadContextPanel.tsx:31` | Back to Selection | `ghost` → `secondary` |
| 9 | `src/components/exam/ReviewLayout.tsx:48` | Back | `ghost` → `secondary` |
| 10 | `src/pages/Unauthorized.tsx:43` | Back to Login | `ghost` → `secondary` |
| 11 | `src/components/admin/questions/modals/SingleQuestionModal.tsx:181` | Close/Cancel | `ghost` → `secondary` |

**Confirmed correct (no change):** "Terminate Session" (`SessionSection.tsx:28`) already `danger` (security-sensitive ✓); certified `RetryButton`/`ErrorState`/`UploadProgressOverlay` Retry already `primary`.

### Validation

- `tsc -b` — clean.
- `npm run build` — exit 0 (only pre-existing chunk-size notices).
- ESLint on all 10 edited files — 0 errors; 1 pre-existing `exhaustive-deps` warning (ReviewView:69, untouched).
- Neutral `ghost` buttons: verified **zero** remaining (grep).
- No geometry/typography/spacing/hover/transition/animation changes — variant-only (`color` semantics). User Panel, Examination, Admin, Sub Admin appearance preserved. Responsive/a11y unaffected (variant classes carry identical layout).

### Exceptions frozen

E22–E75 remain valid and untouched (compact micro-interaction buttons: table row actions, question-card controls, corner actions, dense admin actions, sub-admin utilities, exam micro controls). Any future compact-action redesign belongs to a dedicated phase (e.g., "Phase X — Compact Action System"), not 2A.

### Follow-up flag (not in 2A scope — requires decision)

`src/pages/VerifyEmailPage.tsx:181` (Resend) and `:208` (Sign Out & Try Again) are **hand-rolled raw buttons** (`h-[44px] rounded-[12px] text-[12px] uppercase`, `text-danger/70`), NOT registered exceptions. They duplicate the certified `Button` look with slightly different geometry. Options: (a) migrate to certified `Button` (`secondary`/`danger`) accepting a minor geometry change, or (b) register as exceptions. Deferred — not covered by the approved 2A scope.

### Change Record

- v2.0.0 — 2026-08-01 — Phase 2A (Button System) complete: audit presented, decisions D1–D4 approved, 11 variant-only semantic fixes applied, neutral ghost buttons standardized to `secondary`, build/tsc/lint green, exceptions E22–E75 frozen, VerifyEmailPage raw buttons flagged for future decision.

---

## Phase 2B — Form Validation

### Status: APPROVED — Step 1 (Foundation) certified, Step 2 (Schema Consolidation) certified, Step 3 (Auth & Profile) certified, Step 4 (Admin Module) certified, Step 5 (Sub-Admin Module) certified, Step 6 (Exam Runtime) certified, Step 7 (Repository Accessibility Sweep) certified, Step 8 (Repository Final Certification) certified.

Full audit package: `PHASE_2B_FORM_VALIDATION_AUDIT.md`.

### Audit findings (summary)

- **Stack:** zod + `@hookform/resolvers` + react-hook-form. RHF confined to Login/Signup (3 `useForm` + 3 `zodResolver`). zod `safeParse` in UI at 6 sites (UpdatePassword, ProfileForm, AddExamModal, SingleQuestionModal, useBulkUpload, useSettings). **Exam module: ZERO zod.**
- **Native `<form>`:** 7 in 6 files (Login ×2, Signup, FinishSignIn, UpdatePassword, ProfileForm, AddExamModal). Everything else is div/button-driven.
- **8 distinct error-presentation variants, no canonical** (unwired span, unwired div box, wired SignupPage span, raw red box, Alert banner, hand-rolled raw block, JSON list, page-level state).
- **A11y:** `aria-invalid` = 0 in production; `aria-describedby` = 5, all SignupPage; `role="alert"` missing on exam error screens + several raw error blocks; ToastContainer has no `role`/`aria-live`.
- **`useToast.showError`:** 0 call sites (dead); toasts are success-only.
- **`validateOrThrow`:** repository layer only, 0 UI usage.
- **12 duplicated rule sets** (password policy ×4, confirm-match ×3, subject-sum ×3 wordings, empty-guard ×3, JSON validation ×3, config ranges ×2, etc.) + dead code (`validateQuestions()`) + stale docs claiming `showError` usage.
- **Timing:** submit-only dominates (~20 surfaces); only 1 onBlur (CompactDateTimePicker); no zod form surfaces more than `issues[0]`.
- **Defects:** ProfileForm server errors invisible (orphaned `pageError`); VerifyEmailPage errors swallowed; exam tab-switch/persist failures silent; SubmitExamModal dead props = no unanswered-question warning; duplicate success toast in prepare-write.

### Approved decisions

- **Approved 2026-08-01:** Standard Proposal D1–D9; 8-step migration order (foundation → schema consolidation → Auth+Profile → Admin → Sub-Admin → Exam → a11y sweep → final validation); VerifyEmailPage migration to certified `Button` (Resend=`secondary`, Sign Out & Try Again=`danger`) with inline Alert error surfacing (no floating toasts). Per governance: each step completes Audit → Implementation → TS → Build → Lint → Manual verification → Documentation → Certification → Approval before the next begins.

### Implementation Log

**Step 1 — Foundation (ToastContainer a11y) — CERTIFIED**
- Change: `src/hooks/useToast.tsx` `ToastContainer` root div gains `role="status"` + `aria-live="polite"` (D6). No visual or layout change; container markup/styling untouched.
- Validation: `tsc -b` clean ✓ · `npm run build` exit 0 ✓ · ESLint 1 pre-existing `react-refresh/only-export-components` error (file exports hook + component; confirmed present before change via stash) ✓.

**Step 2 — Schema Consolidation — COMPLETE** (pure refactor; no UI / UX / behavioral changes)
- Added shared auth schemas: `src/validations/authSchemas.ts` → `emailSchema`, `loginSchema`, `resetSchema`, `signupSchema` (+ inferred types). `LoginPage` and `SignupPage` file-local schemas **deleted**; both pages now reference the shared schemas (R3).
- Password policy centralized: regex constants (`PASSWORD_*_REGEX`) + predicates (`hasMinLength`/`hasUppercase`/`hasNumber`/`hasSpecial`/`getPasswordStrengthScore`) added to `securitySchemas.ts`; `passwordSchema` derives from the same constants. `SignupPage.getPasswordStrength` and `useProfile` `has*` regexes **removed**; strength meter and badge checklist now consume the shared helpers (R1).
- Email rule standardized: single `emailSchema` with canonical message `'Enter a valid email address'`. Login (`'Enter a valid email address.'`), Signup (`'Enter a valid email'`) and `AdminSubAdmins` manual regex (`'Please enter a valid email address.'`) all unified (R2).
- Question-JSON validation unified: `CreateStepJsonPaste.handleParse` now validates each row via the certified `BulkQuestionSchema` (structural batch guards retained); no second JSON validator (R5).
- Dead validation removed: `validateQuestions()` deleted from `src/components/sub-admin/create/types.ts` (zero consumers, no runtime dependency — confirmed by grep + no test imports). `safeParse`/`QuestionData` retained (still consumed). Recorded in Dead Register D1.
- Tests: `src/validations/authSchemas.test.ts` added (email/login/reset/signup); password-policy predicates tested in `securitySchemas.test.ts`; `BulkQuestionSchema` per-row messages tested in `questionSchema.test.ts`.
- Docs: Schema Inventory, Duplicate Register (R1–R5 resolved, O1–O5 deferred), Dead Register (D1), Validation Architecture created under `docs/validation/`.
- Validation: `tsc -b` clean ✓ · `npm run build` exit 0 ✓ · `vitest run src/validations` 102/102 ✓ · ESLint 0 new errors/warnings on all touched files (all remaining findings pre-existing in the working tree) ✓.

**Step 3 — Authentication & Profile — COMPLETE** (canonical validation reference; D2 presentation + submit/blur timing + full field a11y; API errors via certified `Alert`)
- **Login (A1)**: `loginSchema` form now `mode: 'onSubmit'` + `reValidateMode: 'onBlur'`; email/password wired with `id` + `aria-invalid` + `aria-describedby`; error spans gained `id` + `aria-live="polite"`.
- **Forgot Password / reset modal (A2)**: field error converted from the hand-rolled red box (above field, shared container) to D2 inline-below-field; API `resetError` stays a certified `Alert`; `resetSchema` form moved to submit + blur timing.
- **Signup (A3)**: timing changed `mode: 'onChange'` → `mode: 'onSubmit'` + `reValidateMode: 'onBlur'` (no per-keystroke validation); `aria-invalid` added to all five text fields + the exam `Select`; realtime strength meter / coupon status retained as non-blocking status.
- **VerifyEmail (A6)**: Resend → certified `Button` (`secondary`), Sign Out & Try Again → certified `Button` (`danger`); `handleResend` and `handleCheck` now catch failures and surface a certified `Alert` inline (no silent failures, no floating toasts).
- **FinishSignIn confirm-email (A5)**: native `required` + raw label replaced with shared `emailSchema` + `noValidate`; D2 inline error + `aria-invalid`/`aria-describedby`/`htmlFor`; submit + blur timing; `role="alert"` on error status paragraph; pre-existing lint errors fixed (const, `no-explicit-any`, `completeSignIn` declaration order).
- **Reset Password / UpdatePasswordPage (A8)**: single `issues[0]` red box replaced with per-field D2 inline errors (password + confirmPassword) + `aria-invalid`/`aria-describedby`; API failures + unexpected throws surfaced via certified `Alert`.
- **User Profile (A9)**: per-field inline errors (currentPass/newPass/confirmPass) replacing `issues[0]`-only Alert; fields wired with `aria-invalid`/`aria-describedby`; submit + blur timing via `submittedRef`; **invisible server errors fixed** — `handleVerify`/`handlePasswordUpdate` catches now set the form `Alert` error in addition to `captureServerError`; badge checklist retained.
- Validation: `tsc -b` clean ✓ · `npm run build` exit 0 ✓ · `vitest run src/validations` 102/102 ✓ · ESLint 0 new errors/warnings on all 8 touched files (remaining findings pre-existing) ✓.
- Docs: `docs/validation/validation-migration-report.md` created; Schema Inventory + Validation Architecture updated.

**Step 4 — Admin Module — COMPLETE** (adopts the Step 3 canonical pattern; no page redesign; excludes User / Sub-Admin / Exam forms)
- **Shared schemas added (single-source rules):**
  - `securitySchemas.ts`: shared scalar schemas (`examTotalQuestionsSchema`, `examTotalMarksSchema`, `examDurationMinutesSchema`, `examNegativeMarkValueSchema`) + exported `examSubjectSchema`; canonical message constants `EXAM_SUBJECTS_SUM_MESSAGE` / `EXAM_NEGATIVE_MARK_RANGE_MESSAGE` used by both creation + params schemas; **new `examParamsSchema`** (config-shaped range validation so 0 questions / 0 minutes / negative or out-of-range penalties can never be saved).
  - `authSchemas.ts`: **new `subAdminOnboardSchema`** (name min 2, trimmed `emailSchema`, coupon min 3) replacing the manual truthiness + inline email-regex check.
  - **New `adminSchemas.ts`**: `promptTemplateSchema` (topic_name / prompt_text required) and `topicMetadataSchema` (display_order ≥ 1, optional-but-valid youtube_url).
  - Tests: `examParamsSchema` (+ shared scalars) in `securitySchemas.test.ts`; `subAdminOnboardSchema` in `authSchemas.test.ts`; new `adminSchemas.test.ts`. Suite now 131/131.
- **AddExamModal (M1)**: `noValidate` on the native `<form>`; `issues[0]` Alert replaced with per-field inline errors (all metadata + params + paper fields) and per-subject row errors + array-level `subjectsError`; full `id`/`aria-invalid`/`aria-describedby` + `aria-live="polite"` wiring + `htmlFor` labels; validate on Submit, revalidate on Blur (`submittedRef`); submit button no longer gated by the manual `isSumValid` flag (schema validates on submit); realtime Running Sum/Marks badges kept as non-blocking status; API failures stay on certified `Alert`; sum-rule wording canonicalized to `EXAM_SUBJECTS_SUM_MESSAGE`.
- **ExamParamsForm (M2)**: previously **completely unvalidated** (0 questions / 0 minutes / negative marks could be saved) — now validated via `examParamsSchema` lifted into `useAdminSettings` (single owner): `saveConfig` blocks the save and shows inline per-field errors; `handleSave` skips the success toast on a blocked save; submit + blur timing via `submittedRef`; fields wired with ids/aria; API failures stay on the page `Alert`.
- **SubjectDistributionPanel / saveSubjects (M3)**: the `saveSubjects` throw (page Alert) replaced with inline `subjectsError` rendered below the Running Total row; canonical `EXAM_SUBJECTS_SUM_MESSAGE` used (O1 resolved — 3 wordings → 1); blur revalidation after a save attempt; realtime badge retained; subject inputs gained `id`/`aria-label`/`htmlFor`/`onBlur`.
- **AdminSubAdmins (M4)**: manual `if (!name||!email||!coupon) return` + inline email regex replaced with `subAdminOnboardSchema` → per-field inline errors (`sa-name`/`sa-email`/`sa-coupon`) + blur revalidation; coupon no longer uppercased while typing — normalized once at submit (`trim().toUpperCase()`); search input gained `aria-label="Search educators"`; API failures stay on `Alert`.
- **SingleQuestionModal + QuestionForm (M6/M5)**: raw red error box → certified `Alert` (API failures); `SingleQuestionSchema` issues now map to per-field inline errors for the required EN text fields (question + options A–D) rendered inside `QuestionForm` with ids/aria/`onBlur`; submit + blur timing; hidden exam/paper/subject context gating unchanged.
- **PromptEditorModal (M9)**: manual non-empty guard moved to `promptTemplateSchema` → inline errors (`prompt-topic-name`/`prompt-text`) + blur; redundant guard removed from `useBulkUpload.handleSavePrompt` (schema is the only rule owner); **double-Alert fixed** — the panel-level error `Alert` is hidden while the prompt modal is open (was rendering the same message twice).
- **AdminTopics (M10/M11)**: `useAdminTopics` now owns `fieldErrors` + `submittedRef`; `topicMetadataSchema` (display_order, youtube_url) + title/content required checks render inline (replacing `setError` page-Alert for those cases); `LangInputPanel` gained `htmlFor`/ids/`aria-invalid`/`aria-describedby` + inline title/content errors; `TopicMetadataFields` gained ids/aria + inline display_order/youtube_url errors.
- **A11y labels (M8/M12)**: `JsonTab` JSON `TextArea` and `UsersToolbar` student-search `Input` gained `aria-label`; all admin search inputs are now labeled.
- Validation: `tsc -b` clean ✓ · `npm run build` exit 0 ✓ · `vitest run src/validations` 131/131 ✓ · ESLint 0 new errors/warnings on all 25 touched files (15 remaining findings all pre-existing in the uncommitted working tree — `set-state-in-effect` ×2, `no-explicit-any` ×7, unused `catch (err)` ×1, `_`-prefixed unused params ×3, `any[]` ×2) ✓.
- Docs: `validation-migration-report.md` (v1.1.0), `schema-inventory.md` (v1.0.2), `duplicate-register.md` (O1 resolved; R6–R8 added), `validation-architecture.md` (v1.1.0) updated.

**Step 5 — Sub-Admin Module — COMPLETE** (adopts the Step 3/4 canonical pattern; no page redesign; excludes User / Admin / Exam runtime)
- **Shared schemas added (single-source rules):**
  - `securitySchemas.ts`: **new `examConfigSchema`** (replaces the file-local `validateConfig()` — see Dead Register D2) — title trimmed required/min 5/max 120, start/end required, `duration_minutes` via shared `examDurationMinutesSchema`, `marks_per_question` positive max 100, `negative_mark_value` via shared `examNegativeMarkValueSchema`, cross-field refines (penalty ≤ marks/question via `EXAM_NEGATIVE_MARK_RANGE_MESSAGE`, start not in the past, end after start, duration ≤ window, window ≤ 30 days) so ranges cannot drift from Admin.
  - **new `identityUpdateSchema`** (Sub-Admin settings Identity) — name required (trimmed); password optional but validated through the shared `passwordSchema` when non-blank, with each policy issue surfaced at the `password` path.
  - Canonical message constant `EXAM_NO_QUESTIONS_MESSAGE` (`'At least one question is required before proceeding'`) — single wording for every no-questions guard (O2 resolved — 3 wordings → 1).
  - Tests: `examConfigSchema` (+ scheduling refines) and `identityUpdateSchema` suites in `securitySchemas.test.ts`. Suite now 152/152.
- **CreateStepSetup (S1)**: file-local `validateConfig()` replaced with `examConfigSchema`; per-field inline errors (title/duration/marks/negative/start/end) with `id`+`aria-invalid`+`aria-describedby` + `aria-live="polite"` spans + `htmlFor` labels; submit + blur timing via `submittedRef`; errors clear on change; `CompactDateTimePicker` gained optional `id` prop + `aria-label`/`aria-invalid`/`aria-describedby` on its hour/minute inputs and `id`+`role="alert"` on the error div (`exam-start`/`exam-end`).
- **CreateStepJsonPaste / CreateStepPrompt (S2)**: JSON textarea gained `id`/`aria-label`/`aria-invalid`/`aria-describedby`; error box → `role="alert"`, success box → `role="status"`; custom question-count input gained `aria-label="Custom question count"`.
- **QuestionCard (S3)**: edit-mode Save now validates via the shared `BulkQuestionSchema` — per-field inline errors for the EN question + options A–D, blocked saves stay in edit mode; unique `q-{idx}-*` ids + `aria-invalid`/`aria-describedby`/`aria-live`; correct-option toggle gained `aria-label` + `aria-pressed`.
- **CreateStepPublish (S4)**: the manual red publish-error box replaced with the certified `Alert variant="error"` for API/server failures.
- **CreateStepReview / useCreateExam (S5)**: step-guard, publish guard, and Review-screen button all share `EXAM_NO_QUESTIONS_MESSAGE` (O2 canonicalized); the Review-screen no-questions state still renders as its approved inline error.
- **Settings Identity (S6)**: `useSettings.ts` now owns `fieldErrors` + `submittedRef` and validates via `identityUpdateSchema` (submit + blur); `handleSaveProfile` blocks on field errors and clears them on success; `IdentitySection.tsx` gained `fieldErrors`/`onFieldBlur` props, inline `identity-name`/`identity-password` errors, `id`/`htmlFor`/`aria-invalid`/`aria-describedby`; email stays read-only; API failures stay on the certified `Alert`.
- **A11y search labels (S7)**: `AdminFilterBar` gained an optional `searchAriaLabel` prop (default `'Search'`); Sub-Admin students search → `"Search students"`, exam search → `"Search exams"`.
- Validation: `tsc -b` clean ✓ · `npm run build` exit 0 ✓ · `vitest run src/validations` 152/152 ✓ · ESLint 0 new errors/warnings on all 17 touched files (remaining findings all pre-existing sub-admin baseline debt — `set-state-in-effect`, `prefer-const`, `no-explicit-any`, unused `catch` params, `exhaustive-deps`) ✓.
- Docs: `validation-migration-report.md` (v1.2.0), `schema-inventory.md` (v1.0.3), `duplicate-register.md` (O2–O3 resolved; v1.2.0), `validation-architecture.md` (v1.2.0), `dead-register.md` (D2) updated.

**Step 6 - Exam Runtime Validation - COMPLETE** (adopts the shared-schema model at the runtime/service boundaries; no UX redesign; Admin / Sub-Admin excluded; broad a11y sweep deferred to Step 7 per the approved migration order)
- **Scope decision (approved via question tool):** a11y limited to **validation-adjacent** only (submit-summary live region, modal `aria-describedby`, validation ARIA, timer role + last-minute announcement); palette `aria-current`, ErrorState `role="alert"`, focus restore, radiogroup semantics, review/search labels, review/loading announcements all **deferred to Step 7**. Three focused schemas approved. Retryable error screens approved.
- **Golden Rule applied:** the exam experience wins where ordinary form validation conflicts with exam usability. Every justified deviation registered in the new `docs/validation/exception-register.md` (E1–E12: timer countdown, time expiry/auto-submit, unanswered summary, tab-switch limit, fullscreen exit/prompt, security notices, Telugu-fallback, transient save banner, silent autosave, navigation persistence, session-expiry auto-submit, one-time review gate).
- **Shared schemas added (single-source rules):**
  - `questionSchema.ts`: **`SELECTED_OPTIONS`** (`['A','B','C','D'] as const`), **`selectedOptionSchema`** (`z.enum`), **`questionEnFieldsSchema`** (trimmed required EN question + options A–D). `SingleQuestionSchema` now uses `questionEnFieldsSchema.extend(...)`; `BulkQuestionSchema` spreads `...questionEnFieldsSchema.shape` — single EN-rule owner.
  - `securitySchemas.ts`: **`submitResultSchema`** — coerces `correct_count`/`total_questions`/`attempt_count`/`marks_earned`/`negative_marks`, accepts `correct`/`correct_count` + `duration_seconds`/`duration` variants, transform emits canonical `SubmitResultParsed`; typed `SubmitResultInput`/`SubmitResultParsed`.
  - Tests: `selectedOptionSchema` + `questionEnFieldsSchema` suites, `submitResultSchema` suite. Suite now 165/165.
- **`assertValidEnFields`** (`languageUtils.ts`): now delegates to `questionEnFieldsSchema.safeParse` (single EN-rule owner; error now lists missing fields).
- **Answer-option rule (A27)**: `examService.setQuestionAnswer` validates non-null `selectedOption` via `selectedOptionSchema`, throws `'Invalid answer option. Answer options are limited to A-D.'`; `useExamKeyboard` uses `SELECTED_OPTIONS`; blind `option as 'A'|'B'|'C'|'D'` cast removed.
- **Stats bug fixed (A28)**: `useExamSession` accepts `visitedQuestions` and passes the real set to `computeExamStatistics` (was `new Set()`) — fixes wrong `notVisited` and negative `skipped` in the StatusBoard legend.
- **Retryable errors (A29)**: `ActiveExamPage` blank-page `return null` → retryable `ExamPageError` "Unable to load exam"; `useExamInitialization` missing `paperId` → `'Invalid exam link.'` + init-complete + loading stopped; `useResults`/`useReview` missing `attemptId` → `'Invalid attempt link.'`.
- **Submit summary (A30)**: `SubmitExamModal` renders Total/Answered/Unanswered (`Math.max(0, total-answered)`)/Marked for Review with `role="status"` via new `markedCount` prop (from `examStats.marked`); auto-submit variant unchanged; `AdminModal` gains `description` → `aria-describedby`.
- **Result parsing (A31)**: `useResults.normalizeResult` via `submitResultSchema.safeParse` (fallback zeros) — fixes `"5"+3` concatenation hazard; manual `any` parsing removed.
- **Review gate (A32)**: `markReviewAccessed` wrapped in try/catch — no unhandled rejection / blank review on a failed write.
- **Timer a11y (A33)**: `ExamTimer` gains `role="timer"` + `aria-label` + sr-only `role="status"` line; last-minute announcements at 10-second marks; expiry announcement. Logic unchanged.
- **canProceed (A34)**: `QuestionNavigator` gains optional `canProceed` prop (fallback `canProceedProp ?? (hasAnswer || isMarkedForReview)`); `ActiveExamPage` passes derived value — rule no longer duplicated.
- Validation: `tsc -b` clean ✓ · `npm run build` exit 0 ✓ (pre-existing chunk-size notices only) · `vitest run src/validations` 165/165 ✓ · ESLint 0 new errors/warnings on all 16 touched files (remaining findings all pre-existing exam-runtime baseline debt — `no-explicit-any`, `set-state-in-effect`, `prefer-const`, empty `catch`, `exhaustive-deps`, `purity`) ✓.
- Docs: `validation-migration-report.md` (v1.3.0 A25–A34), `schema-inventory.md` (v1.0.4), `validation-architecture.md` (v1.3.0), new `exception-register.md` (E1–E12), `exam-validation-inventory.md` status → IMPLEMENTED.

**Step 7 — Repository Accessibility Sweep — COMPLETE** (accessibility-only; no validation-logic, business-logic, layout, spacing, typography, color, or animation changes; all changes invisible to sighted users)
- **Palette (A35):** `QuestionPalette.tsx` — `role="group"` + `aria-label="Question palette"`; every palette button `aria-current={state.isCurrent ? 'true' : undefined}` (desktop + mobile).
- **Navigation:** `Navigation.tsx` — `<nav aria-label="Main navigation">`; collapse toggle `aria-label` + `aria-expanded`.
- **Review search/filters:** `ReviewLayout.tsx` — search input `aria-label="Search questions or subjects"`; filter buttons `aria-pressed` + count-bearing `aria-label` inside `role="group" aria-label="Filter questions by status"`.
- **Radiogroup semantics:** `QuestionOptions.tsx` — `role="radiogroup" aria-label="Answer options"`; option buttons `role="radio"` + `aria-checked` (replacing `aria-pressed`). `QuestionActions.tsx` — language `RadioGroup` gets `label="Question language"`.
- **Focus restore:** `AdminModal.tsx` — remembers `document.activeElement` on open, restores on close.
- **Errors:** `SharedComponents.tsx` `ErrorState` → `role="alert"` (covers `ExamPageError` + 22 consumers); `ExamLayout.tsx` fullscreen prompt + `StatusBoard.tsx` violation notice → `role="alert"` (E5 wiring done).
- **Loading:** `LoadingScreen.tsx`, `PremiumLoader.tsx` (+`aria-label="Loading"`), `PortalLoadingSkeleton.tsx` (+`aria-label="Loading content"`), `ExamPageLoading.tsx` → `role="status" aria-live="polite"`.
- **Review correctness:** `ReviewQuestionCard.tsx` — sr-only "Correct answer" / "Your answer - incorrect"; icons `aria-hidden="true"`.
- **Tabs labelled:** `AntigravityData.tsx` Tabs `ariaLabel` prop → tablist `aria-label`; applied at 17 sites (UserLeaderboard, TopicPortalView, SubAdminCreate, ExamDetailModal, AdminTopics, BulkUploadModal, AdminSelectionTabs ×8 incl. `UserSelectionTabs` re-export, ExamGroupBar via SelectionView/ExamPaperGrid).
- **Mobile drawer:** `SidebarLayout.tsx` — `role="dialog"` + `aria-modal` + `aria-label="Navigation menu"` only when open; closed drawer `inert` (removes off-screen links from tab order).
- Validation: `tsc -b` clean ✓ · `npm run build` exit 0 ✓ (pre-existing chunk-size notices only) · `vitest run src/validations` 165/165 ✓ · ESLint on all 25 touched files — 0 new errors/warnings (15 remaining findings all pre-existing baseline debt: `set-state-in-effect` ×5, `no-explicit-any` ×6, `react-refresh` ×4) ✓.
- Docs: new `accessibility-report.md` (v1.0.0); `validation-migration-report.md` v1.4.0 (A35); `exception-register.md` v1.1.0 (E5 wiring; no new exceptions); `exam-validation-inventory.md` deferred list → Step 7 COMPLETE.

**Step 8 — Repository Final Certification — COMPLETE** (read-only; zero runtime code changes; 6 certification reports under `docs/certification/`)
- **Mode:** certification only. No code changes; no implementation introduced.
- **Health verification:** `tsc -b` clean ✓ · `npm run build` exit 0 ✓ (pre-existing chunk-size notices only) · `vitest run src/validations` 165/165 ✓ · full `vitest run` 165/165 + 6 pre-existing worker errors (`examStateCalculator.test.ts` — `@csstools/css-calc` ESM blocker, P-H-1) · ESLint baseline 407 problems (354 errors / 53 warnings / 103 files, all pre-existing, P-H-2) · working tree 404 changed lines uncommitted (P-H-3).
- **Compliance verified:** one Button system (9 variants/6 sizes, 183+30 uses); one Validation system (`src/validations/` 27 boundaries, R1–R8/O1–O3 resolved, D1–D2 removed); one Layout system (PageContainer/Stack/Grid/SectionBlock, no ContentContainer); Step 1–7 a11y all present; E1–E12 verified in code; docs ↔ implementation match.
- **Findings classified (severity/owner/phase):** 16 findings + 3 health items across the 6 reports — no Critical. High: a11y named gaps (F-A-1/2/3), typography/radius token conflicts (F-DS-1/6). Medium/Low: token adoption, validation consolidation, dead code.
- **Registers updated:** `exception-register.md` v1.2.0 (E13–E19); `dead-register.md` v1.2.0 (D3–D6); `duplicate-register.md` unchanged (all resolved verified).
- **Verdict:** ✅ Certified with Accepted Findings — PRODUCTION READY. Foundation frozen; additive evolution only.

### Change Record

- v2.0.1 — 2026-08-01 — Phase 2B (Form Validation) AUDIT COMPLETE: Validation Inventory + Pattern Report + Duplicate Report + Standard Proposal D1–D9 + Migration Plan + VerifyEmailPage recommendation delivered for approval. No code changes.
- v2.0.2 — 2026-08-01 — Step 1 certified (ToastContainer `role="status"` + `aria-live`; build/tsc green; pre-existing lint issue documented).
- v2.0.3 — 2026-08-01 — **Step 2 certified**: shared auth schemas (`authSchemas.ts`), centralized password policy helpers, canonical email rule, `CreateStepJsonPaste` on `BulkQuestionSchema`, dead `validateQuestions()` removed; tests 102/102; build + tsc green; docs created (`docs/validation/`). No user-visible behavior change.
- v2.0.4 — 2026-08-01 — **Step 3 certified**: Auth + Profile adopt the canonical D2 inline-field-error pattern, submit/blur validation timing, full field ARIA (`aria-invalid`/`aria-describedby`/error id), API failures routed to certified `Alert`; VerifyEmailPage migrated to certified `Button` with inline error surfacing; Profile server errors no longer invisible; FinishSignIn lint fixed; migration report created (`docs/validation/validation-migration-report.md`).
- v2.0.5 — 2026-08-01 — **Step 4 certified**: Admin module adopts the Step 3 validation model. New shared schemas (`examParamsSchema`, `subAdminOnboardSchema`, `promptTemplateSchema`, `topicMetadataSchema`, shared exam scalars + canonical sum/range messages). AddExamModal per-field inline + `noValidate` + removed `isSumValid` gate; ExamParamsForm now validated (previously 0/negative values savable); subject-sum canonicalized + inline; AdminSubAdmins on schema with per-field errors + coupon normalized at submit; SingleQuestionModal per-field errors + certified Alert; PromptEditorModal schema errors + double-Alert fixed; AdminTopics title/content/url/order inline errors; a11y labels for JSON/search inputs. Tests 131/131; build + tsc green; 0 new ESLint findings.
- v2.0.6 — 2026-08-01 — **Step 5 certified**: Sub-Admin module adopts the Step 3/4 validation model. New shared `examConfigSchema` (replaces file-local `validateConfig()`, dead code removed) + `identityUpdateSchema` + `EXAM_NO_QUESTIONS_MESSAGE`; CreateStepSetup per-field inline errors + submit/blur + DateTimePicker/JSON/prompt ARIA; QuestionCard edit save validates via `BulkQuestionSchema`; CreateStepPublish on certified Alert; no-questions guard canonicalized across step-guard/publish/review (O2 resolved); settings Identity on `identityUpdateSchema` with inline errors + blur; search inputs labeled. Tests 152/152; build + tsc green; 0 new ESLint findings.
- v2.0.7 — 2026-08-01 — **Step 6 certified**: Exam runtime adopts the shared-schema model at the runtime/service boundaries. New shared `selectedOptionSchema` + `SELECTED_OPTIONS` + `questionEnFieldsSchema` (questionSchema) + `submitResultSchema` (securitySchemas); EN-field rule single owner via `assertValidEnFields` → `questionEnFieldsSchema`; answer-option rule at the `examService.setQuestionAnswer` boundary; stats/visited-set bug fixed; retryable error screens (blank page → `ExamPageError`, invalid-link errors) replacing stuck spinners; pre-submission summary rendered in the submit modal (`markedCount` + `aria-describedby`); result parsing via `submitResultSchema`; review gate write guarded; timer `role="timer"` + last-minute announcements; `canProceed` centralized. Golden Rule exceptions E1–E12 registered in `exception-register.md`; validation-adjacent a11y only (broad sweep → Step 7). Tests 165/165; build + tsc green; 0 new ESLint findings.
- v2.0.8 — 2026-08-01 — **Step 7 certified**: Repository Accessibility Sweep. All deferred a11y items implemented across 25 files — palette `aria-current` + group semantics; nav landmark + collapse toggle; review search/filter labels; answer-option + language radiogroup semantics; `AdminModal` focus restore; `role="alert"` on `ErrorState`/fullscreen prompt/violation (E5 wired); loading `role="status"` on 4 components; review sr-only correctness labels; 17 tab lists labelled; mobile drawer dialog + `inert`. Accessibility-only (no visual/logic/layout change). New `accessibility-report.md` v1.0.0; migration report v1.4.0 (A35); exception register v1.1.0 (no new exceptions). Tests 165/165; build + tsc green; ESLint 0 new (15 remaining findings pre-existing).
- v2.0.9 — 2026-08-01 — **Step 8 certified**: Repository Final Certification. Read-only; zero code changes. Verified: one Button/Validation/Layout system, all Step 1–7 a11y present, E1–E12 in code, registers + docs synced, tsc + build + 165/165 green, 0 new lint. Produced `docs/certification/` (repository-certification, design-system-compliance, accessibility-compliance, validation-compliance, repository-health, production-readiness). 16 findings + 3 health items classified (no Critical); registers extended (exception E13–E19, dead D3–D6). **Verdict: ✅ Certified with Accepted Findings — PRODUCTION READY.** Foundation frozen; additive evolution only.

---

# Phase 3.1 — User Panel Visual Language Rollout

**Status:** Module 1 (Authentication) — MIGRATION COMPLETE, pending visual comparison + certification + approval
**Foundation:** FROZEN (repo v2.0.0). Every module migrates onto the certified Antigravity system — no redesign, no parallel visual language.
**Execution model:** Module at a time — Audit → Migration → Visual Comparison → Certification → Approval → Next Module.
**User decisions (approved):** migrate the entire Authentication module (9 pages) before Admin; unify to default variants everywhere (primary `Button` + default `Input`).

### Module 1 — Authentication (MIGRATION COMPLETE)

- **9/9 pages migrated** to certified components + tokens:
  - `SplashPage` — `BrandTitle variant="gradient"` (DS-006); inline `<style>` sheen → global `@keyframes sheen` in `index.css`; splash colors → `--canvas-splash-*`, `--gold-*`, `--border-gold`.
  - `LoginPage` / `SignupPage` / `VerifyEmailPage` / `AuthCallbackPage` — `AuthThemeProvider` (DS-006) replaces `ThemeContext.Provider` + `.light`; hero raw `<h1>` → `Display`; stat values → `Display`/`text-stat-value`; arbitrary text sizes → certified sizes; manual coupon spinner → `Spinner size="sm"`; legacy indigo/violet ambient glows → `--color-accent` via `color-mix`; `bg-white` logo chip → `bg-card-bg`.
  - `FinishSignInPage` / `AccountDisabledPage` / `UpdatePasswordPage` — **full rewrites**: removed `PaletteBackground` + manual white cards + `compact` inputs + `auth-dark`/`auth-violet` buttons + inline `<style>` + hand-rolled spinners/errors; now `PageContainer centered` + `Card variant="auth-light"` + default `Input`/`Label` + primary/`danger` `Button` + certified `Spinner`/`Alert`/`IconBadge` + full field ARIA (`aria-invalid`/`aria-describedby`/`aria-live`); `shadow-black/20` → `shadow-elevation-2`.
  - `Unauthorized` — `PageTransition` added (golden-reference §12.1); already token-driven.
- **Sweep clean:** zero `ThemeContext`/`.light` wrappers, `variant="compact"`, `auth-dark`/`auth-violet`, manual spinners, inline `<style>`, or raw hex/`rgba()` colors on auth pages. `PaletteBackground` now has **zero consumers** (dead-register candidate D7).
- Validation: `tsc -b` clean ✓ · `npm run build` exit 0 ✓ (pre-existing chunk-size notices only) · ESLint on all 9 edited files — **0 new problems** (remaining findings pre-existing business-logic `any`/`refs` untouched) ✓.
- Docs: `PHASE_3_1_AUTH_VISUAL_MIGRATION.md` created.

### Change Record

- v3.0.1 — 2026-08-01 — **Phase 3.1 Module 1 (Authentication) migration complete**: all 9 auth surfaces on the certified Antigravity system (`AuthThemeProvider`, `Card auth-light`, `BrandTitle`, `Display`, default `Input`/primary `Button`, certified `Spinner`/`Alert`), 3 pages fully rewritten, legacy indigo/violet removed, inline `<style>` eliminated, `PaletteBackground` orphaned. tsc + build green, 0 new lint. Full report in `PHASE_3_1_AUTH_VISUAL_MIGRATION.md`. Pending: visual comparison vs User Panel + certification + approval.

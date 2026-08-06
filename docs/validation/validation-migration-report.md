# Validation Migration Report

**Phase 2B - Form Validation (Step 3: Authentication & Profile; Step 4: Admin Module; Step 5: Sub-Admin Module; Step 6: Exam Runtime; Step 7: Repository Accessibility Sweep).**
**Status:** COMPLETE - updated 2026-08-01.
**Scope:** Login, Signup, Verify Email, Forgot Password (LoginPage reset modal), Reset Password (UpdatePasswordPage), User Profile, the **Admin module** (AddExamModal, ExamParamsForm, SubjectDistribution, AdminSubAdmins, SingleQuestionModal, PromptEditorModal, AdminTopics, JSON/a11y labels), the **Sub-Admin module** (CreateStepSetup + DateTimePicker, JSON paste + prompt count, QuestionCard, CreateStepPublish, no-questions guard, settings Identity, a11y search labels), the **Exam runtime** (ActiveExamPage, answers, navigation, submit modal, submit flow, review/results, session guards, timer), and the **repository accessibility sweep** (Step 7 - deferred a11y items across 25 files). Exam flows follow the Golden Rule - see `exception-register.md`.

---

## Canonical presentation (D2) applied in this step

Field validation is displayed **directly below the field** (no floating validation, no side containers, no validation toasts):

```
<Stack gap="xs">
  <Label htmlFor="..." >Email Address</Label>
  <Input
    id="..."
    aria-invalid={error ? true : undefined}
    aria-describedby={error ? "...-error" : undefined}
    {...register(...)}
  />
  {error && (
    <span id="...-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
      {error.message}
    </span>
  )}
</Stack>
```

**Rules enforced across all surfaces in this step:**
- Timing: validate on Submit, revalidate on Blur (never every keystroke).
- Field errors are inline, below the field, `aria-live="polite"`, with error `id` + `aria-invalid` + `aria-describedby` on the invalid control.
- API/server failures are rendered with the certified `Alert` (error variant = `role="alert"`); field errors and API errors are never mixed in the same container.
- Realtime derived feedback that adds value (password strength meter, 5-badge checklist, coupon status, running subject-sum badge) is kept as non-blocking status and does not count as validation.

---

## Changes by audit finding

### A1 - LoginPage login form
- `useForm<LoginFormData>` now `mode: 'onSubmit'` + `reValidateMode: 'onBlur'` (was default `onSubmit` + `onChange` revalidation → now errors persist until blur, not every keystroke).
- Email field: `id="login-email"`, `aria-invalid`, `aria-describedby="login-email-error"`; error span now has `id` + `aria-live="polite"` (was an unwired span).
- Password field: `id="login-password"`, `aria-invalid`, `aria-describedby="login-password-error"`; error span wired the same way.
- API failures stay on the certified `Alert` above the form (unchanged).

### A2 - LoginPage forgot-password (reset) modal
- The field error was a hand-rolled red box (P2 pattern) placed **above** the field in a shared `aria-live` container. Converted to the canonical D2 pattern: inline **below** the email field with `id="reset-email"`, `aria-invalid`, `aria-describedby="reset-email-error"`, error span `id` + `aria-live="polite"`.
- `resetError` (API failure) remains a certified `Alert`; field validation and API error no longer share a container.
- `useForm<ResetFormData>` now `mode: 'onSubmit'` + `reValidateMode: 'onBlur'`.

### A3 - SignupPage
- Timing changed from `mode: 'onChange'` (validated every keystroke) to `mode: 'onSubmit'` + `reValidateMode: 'onBlur'` (approved timing). The exam-selection `setValue(..., { shouldValidate: true })` is retained (discrete change, not keystroke).
- Added `aria-invalid` to all invalid fields (fullName, email, password, confirmPassword, couponCode) and to the exam `Select` (`id="examSelection"` + `aria-describedby`).
- Realtime derived feedback kept: password strength meter (shared `getPasswordStrengthScore`), coupon status region (`#coupon-status`).

### A5 - FinishSignInPage (confirm email)
- Replaced native `required` + raw label with shared `emailSchema` validation and `noValidate` on the form.
- Field error inline below the input (`id="confirm-email-error"`, `aria-live="polite"`), control wired with `id="confirm-email"`, `aria-invalid`, `aria-describedby`; label gained `htmlFor="confirm-email"`.
- Timing: validate on submit, revalidate on blur (after first submit attempt).
- Error status screen paragraph gained `role="alert"`.
- Pre-existing lint issues fixed while editing (const, no-explicit-any, `completeSignIn` declared before the effect).

### A6 - VerifyEmailPage
- Resend migrated to certified `Button` (`variant="secondary"`, `fullWidth`, `loading`, `id="resend-email-btn"`).
- Sign Out & Try Again migrated to certified `Button` (`variant="danger"`, `fullWidth`, `id="signout-retry-btn"`).
- Proper resend error handling: `handleResend` now catches failures and surfaces an inline certified `Alert` (no silent failure).
- "I've Verified My Email": `handleCheck` now catches failures and surfaces an inline certified `Alert` (was a swallowed `try/finally`).
- No floating toasts; error surfacing is contextual inline `Alert` per the approved decision.

### A8 - UpdatePasswordPage (Reset Password)
- Replaced the single `issues[0]` red box (P2 raw block) with **per-field** inline errors for New Password and Confirm Password (`id="new-password-error"`, `id="confirm-password-error"`, `aria-live="polite"`).
- Fields wired with `aria-invalid` + `aria-describedby`.
- Timing: validate on submit, revalidate on blur (after first submit attempt).
- API/server failures now render via certified `Alert` (error variant); unexpected throws are also surfaced (were an unhandled rejection from `useAsyncOperation.execute`).

### A9 - ProfileForm / useProfile (User Profile)
- Per-field inline errors introduced for Current Password, New Password, Confirm Password (previously all issues collapsed into `issues[0].message` in the top `Alert`).
- Fields wired with `aria-invalid` + `aria-describedby` (`currentPass-error`, `newPass-error`, `confirmPass-error`), errors `aria-live="polite"`.
- Timing: validate on submit, revalidate on blur (after first submit attempt, tracked via `submittedRef`).
- **Invisible server errors fixed:** `handleVerify` and `handlePasswordUpdate` catches now set the local `error` (rendered by the `Alert`) in addition to `captureServerError` — previously server failures were only logged to the orphaned page-error state.
- The 5-badge realtime checklist and the `newPass !== currentPass` schema refine are retained; the schema refine now maps to the `newPass` inline error (the only case the badge checklist does not pre-empt).

---

## Step 4 — Admin Module

Adopts the same canonical D2 pattern. No page redesign. Scope: settings (AddExamModal, ExamParamsForm, SubjectDistribution), sub-admins, questions (single + prompt editor + JSON label), topics. User / Sub-Admin / Exam forms remain untouched (later steps).

### A10 - AddExamModal
- `noValidate` added to the native `<form>` (the page reads `data.action` from FormData; the schema is the single source of validation).
- The single `issues[0]` red box (P2 pattern) replaced with **per-field inline errors**: examId, examName, examSelection, totalQuestions, totalMarks, durationMinutes, negativeMarkValue, paperName + per-subject row errors (subjectName, questionCount, marksPerQuestion) + array-level `subjectsError`.
- Every invalid control wired with `id` + `aria-invalid` + `aria-describedby`; every error span has an `id` + `aria-live="polite"`; labels gained `htmlFor`.
- Timing: validate on submit, revalidate on blur (after first submit attempt, tracked via `submittedRef`).
- Submit button no longer gated by the manual `isSumValid` flag — the schema validates the sum on submit (`isSumValid` retained only for the realtime Running Sum badge, which is non-blocking status).
- Subject-sum wording canonicalized to the shared `EXAM_SUBJECTS_SUM_MESSAGE` constant (was a divergent inline string).
- API failures render on the certified `Alert`; field errors are never placed inside the Alert.
- Form reset clears `fieldErrors`.

### A11 - ExamParamsForm
- **Previously completely unvalidated**: 0 questions, 0 minutes, negative or out-of-range negative-mark values could be saved. Now validated via `examParamsSchema` (created in Step 4 as a config-shaped range schema).
- Validation is lifted into `useAdminSettings` (single owner): `saveConfig` calls `validateParams`, blocks the save and stores `paramsFieldErrors`; `handleSave` skips the success toast when the save is blocked.
- Inline per-field errors (`totalQuestions`, `totalMarks`, `durationMinutes`, `negativeMarkValue`) with ids/aria + `onBlur` revalidation; API failures stay on the page-level certified `Alert`.
- Note: the `examCreationSchema` cross-field refine (`negative_mark_value <= total_marks / total_questions`) was preserved so the params ranges stay consistent with creation.

### A12 - SubjectDistributionPanel / saveSubjects
- The `saveSubjects` **throw** (page Alert) replaced with inline `subjectsError` rendered below the Running Total row (single canonical message `EXAM_SUBJECTS_SUM_MESSAGE`).
- Real-time Running Sum/Marks badges + PieChart retained as non-blocking status.
- Subject inputs gained `id` + `aria-label` + `htmlFor` labels + `onBlur` revalidation; blurred invalid subjects re-validate after a save attempt.

### A13 - AdminSubAdmins
- Manual `if (!name || !email || !coupon) return` + inline email regex replaced with `subAdminOnboardSchema` → per-field inline errors (`sa-name`, `sa-email`, `sa-coupon`), blur revalidation, ids/aria/`aria-live` wiring.
- Coupon no longer uppercased live while typing; normalized once at submit (`result.data.couponCode.trim().toUpperCase()`).
- Search input gained `aria-label="Search educators"`.
- API failures stay on the certified `Alert`.

### A14 - SingleQuestionModal + QuestionForm
- The raw red error box (P2 pattern) replaced with the certified `Alert` for API failures; `SingleQuestionSchema` issues now map to **per-field inline errors** for the required EN text fields (question + options A–D), rendered inside `QuestionForm` with ids/aria/`onBlur`.
- Timing: validate on submit, revalidate on blur after first submit attempt.
- The hidden exam/paper/subject context gating (edit-mode fields) is unchanged.

### A15 - PromptEditorModal
- The manual non-empty guard replaced with `promptTemplateSchema` → inline errors (`prompt-topic-name`, `prompt-text`) + blur revalidation.
- The redundant guard removed from `useBulkUpload.handleSavePrompt` — the schema is the only rule owner.
- **Double-Alert fixed**: the panel-level error `Alert` is hidden while the prompt modal is open (was rendering the same message twice).

### A16 - AdminTopics
- `useAdminTopics` now owns `fieldErrors` + `submittedRef`; `topicMetadataSchema` (display_order ≥ 1, youtube_url optional valid URL) + title/content required checks render as inline field errors instead of `setError` page-Alert cases.
- `LangInputPanel` gained `htmlFor`/ids/`aria-invalid`/`aria-describedby` + inline title/content errors for both languages.
- `TopicMetadataFields` gained ids/aria + inline display_order/youtube_url errors.

### A17 - A11y labels
- `JsonTab` JSON `TextArea` gained `aria-label="JSON questions input"`; `UsersToolbar` student-search `Input` gained `aria-label="Search students"`.

---

## Step 5 — Sub-Admin Module

Adopts the same canonical D2 pattern. No page redesign. Scope: create-wizard (Setup, JSON paste, prompt count, question cards, publish, review), settings Identity. User / Exam runtime forms remain untouched (later steps).

### A18 - CreateStepSetup + CompactDateTimePicker
- File-local `validateConfig()` replaced with the shared `examConfigSchema` (Dead Register D2). The wizard-local `ExamConfig` state is validated directly by the schema — no second rule owner.
- Per-field inline errors (`title`, `duration_minutes`, `marks_per_question`, `negative_mark_value`, `start_time`, `end_time`) with `id` + `aria-invalid` + `aria-describedby` + `aria-live="polite"` spans; labels gained `htmlFor`.
- Timing: validate on submit, revalidate on blur (after first submit attempt, tracked via `submittedRef`); errors clear on field change.
- `CompactDateTimePicker` gained an optional `id` prop; hour/minute inputs carry `aria-label`/`aria-invalid`/`aria-describedby`; the error div gained `id` + `role="alert"`; setup passes `id="exam-start"`/`id="exam-end"`.

### A19 - CreateStepJsonPaste + CreateStepPrompt
- JSON textarea gained `id` + `aria-label="JSON questions input"` + `aria-invalid`/`aria-describedby`; the error box gained `role="alert"`, the success box `role="status"`.
- Custom question-count input gained `aria-label="Custom question count"`.

### A20 - QuestionCard (edit-mode save)
- Save no longer trusts the editor silently — the edit payload is validated via the shared `BulkQuestionSchema`; per-field inline errors for the EN question + options A–D, and a blocked save keeps the card in edit mode.
- Unique `q-{idx}-*` ids + `aria-invalid`/`aria-describedby`/`aria-live="polite"` wiring; the correct-option toggle gained `aria-label` + `aria-pressed`; error spans carry `id` + `role="alert"`.

### A21 - CreateStepPublish
- The manual red publish-error box replaced with the certified `Alert variant="error"` for API/server failures (field validation stays inline; the two are never mixed).

### A22 - No-questions guard (O2 canonicalized)
- `useCreateExam` step-guard, `useCreateExam.handlePublish`, and `CreateStepReview` all use the shared `EXAM_NO_QUESTIONS_MESSAGE` constant (was 3 divergent wordings). The Review-screen no-questions state still renders as its approved inline error.

### A23 - Settings Identity (useSettings + IdentitySection)
- `useSettings.handleSaveProfile` now validates via `identityUpdateSchema` — name required, optional password checked against the shared `passwordSchema` (each policy issue surfaced at the `password` path).
- `fieldErrors` + `submittedRef` moved into `useSettings`; save blocks on field errors and clears them on success; new `handleFieldBlur` triggers blur revalidation.
- `IdentitySection.tsx` gained `fieldErrors`/`onFieldBlur` props and inline `identity-name`/`identity-password` errors with `id`/`htmlFor`/`aria-invalid`/`aria-describedby`; email stays read-only disabled.
- API failures stay on the certified `Alert`.

### A24 - A11y search labels
- `AdminFilterBar` gained an optional `searchAriaLabel` prop (default `'Search'`); Sub-Admin students search → `"Search students"`, exam search → `"Search exams"`.

---

## Step 6 - Exam Runtime

**Approved scope:** ActiveExamPage, answers, navigation, submit modal, submit flow, review/results, session guards, timer. Admin / Sub-Admin excluded. A11y limited to **validation-adjacent** only (submit-summary live region, modal `aria-describedby`, timer role/last-minute announcement); the broad a11y sweep (palette `aria-current`, review/search labels, focus restore, radiogroup semantics, ErrorState `role="alert"`, review announcements) is deferred to Step 7. Golden Rule applied: exam experience wins where it conflicts with the standard model - every deviation is registered in `exception-register.md` (E1-E12).

### A25 - Shared exam-runtime schemas
- `src/validations/questionSchema.ts`: added `SELECTED_OPTIONS` (`['A','B','C','D'] as const`), `selectedOptionSchema` (`z.enum`), and `questionEnFieldsSchema` (trimmed required EN question + options A-D). `SingleQuestionSchema` now uses `questionEnFieldsSchema.extend(...)`; `BulkQuestionSchema` spreads `...questionEnFieldsSchema.shape` - the EN-field rule has a single owner.
- `src/validations/securitySchemas.ts`: added `submitResultSchema` - coerces `correct_count`/`total_questions`/`attempt_count`/`marks_earned`/`negative_marks` (accepts `correct`/`correct_count` and `duration_seconds`/`duration` variants), transform emits the canonical `SubmitResultParsed` shape; typed `SubmitResultInput`/`SubmitResultParsed` exports.
- Tests: `selectedOptionSchema` + `questionEnFieldsSchema` suites in `questionSchema.test.ts`; `submitResultSchema` suite in `securitySchemas.test.ts`. Validation suite 152 → **165**.

### A26 - EN-field integrity rule owner
- `assertValidEnFields` (`src/utils/languageUtils.ts`) now delegates to `questionEnFieldsSchema.safeParse` instead of re-declaring the EN-field rules. Error message is preserved and now also lists the missing fields (`... has invalid or missing English fields: option_b_en, ...`). `examService` post-fetch integrity check and the question schemas now derive from the same schema.

### A27 - Answer-option rule at the service boundary
- `examService.setQuestionAnswer` validates `selectedOption` (when non-null) via `selectedOptionSchema.safeParse` and throws `'Invalid answer option. Answer options are limited to A-D.'` - replaces the blind `option as 'A'|'B'|'C'|'D'` cast in `useExamSession`. `useExamKeyboard` derives options from the shared `SELECTED_OPTIONS`.

### A28 - Stats bug fixed (visited set)
- `useExamSession` gained a `visitedQuestions` option and now passes the real set to `computeExamStatistics` (was a hardcoded `new Set()`). Consequences fixed: `notVisited` is now `total - visited` instead of always `total`, and `skipped` no longer goes negative in the StatusBoard legend.

### A29 - Retryable error screens (blank page / stuck spinners)
- `ActiveExamPage` blank-page `return null` (no attempt / no questions / no current question) replaced with a retryable `ExamPageError` ("Unable to load exam").
- `useExamInitialization` no longer returns silently when `paperId` is missing - it sets `'Invalid exam link.'`, completes init, and stops loading so the error is reachable and retryable. `useResults`/`useReview` set `'Invalid attempt link.'` when `attemptId` is missing.

### A30 - Submit summary rendered
- `SubmitExamModal` now renders the pre-submission briefing box (`role="status"`): Total Questions / Answered / Unanswered (`Math.max(0, total - answered)`) / Marked for Review (conditional) via the new `markedCount` prop (wired from `examStats.marked` in `ActiveExamPage`). The auto-submit variant is unchanged. `AdminModal` gains `description="Review your progress before submitting."` so the summary is `aria-describedby`-wired.

### A31 - Result parsing via shared schema
- `useResults.normalizeResult(res: unknown)` parses via `submitResultSchema.safeParse` (fallback zeros on failure) - fixes the string-concatenation hazard (`"5"+3`) and removes the manual `any` parsing.

### A32 - Review gate no longer unhandled
- `useReview`: `markReviewAccessed` wrapped in try/catch - a failed write can no longer become an unhandled rejection or blank the review; the gate error path stays.

### A33 - Timer validation-adjacent a11y
- `ExamTimer` gained `role="timer"` + `aria-label="Time remaining: {m} minutes {s} seconds"` and an sr-only `role="status"` announcement line. Last-minute countdown is announced at each 10-second mark (e.g. "50 seconds remaining"); expiry announces "Time is up. Your answers are being submitted." Timer logic is unchanged (exception E1/E2).

### A34 - canProceed centralization
- `QuestionNavigator` gained an optional `canProceed` prop (fallback `canProceedProp ?? (hasAnswer || isMarkedForReview)`); `ActiveExamPage` passes its derived value. The runtime rule is no longer duplicated across call sites.

### A35 - Repository accessibility sweep (Step 7)
- Accessibility-only changes (no visual, layout, or logic change) completing every item deferred from Steps 1–6. Full itemized detail: `accessibility-report.md`. Summary:
- **Question palette:** `role="group"` + `aria-label="Question palette"` and `aria-current={isCurrent}` on every palette button (desktop + mobile) - `QuestionPalette.tsx`.
- **Navigation:** `<nav aria-label="Main navigation">` + collapse toggle `aria-label`/`aria-expanded` - `Navigation.tsx`.
- **Review search/filters:** search input `aria-label="Search questions or subjects"`; filter buttons `aria-pressed` + count `aria-label` in `role="group"` - `ReviewLayout.tsx`.
- **Answer options radiogroup:** `role="radiogroup" aria-label="Answer options"`; option buttons `role="radio"` + `aria-checked` - `QuestionOptions.tsx`. Question language `RadioGroup` gets `label="Question language"` - `QuestionActions.tsx`.
- **Modal focus restore:** `AdminModal` remembers and restores `document.activeElement` on close.
- **Errors:** `ErrorState` + fullscreen prompt (`ExamLayout`) + fullscreen-violation notice (`StatusBoard`) gained `role="alert"` (E5 wiring completed).
- **Loading:** `LoadingScreen`, `PremiumLoader`, `PortalLoadingSkeleton`, `ExamPageLoading` gained `role="status" aria-live="polite"`.
- **Review correctness announced:** `ReviewQuestionCard` sr-only "Correct answer" / "Your answer - incorrect" labels; icons `aria-hidden`.
- **Tabs labelled:** `AntigravityData.Tabs` `ariaLabel` prop applied at 17 sites (leaderboard period, subject select, create-exam steps, exam details, topic language, bulk-upload steps, all AdminSelectionTabs instances, exam-group select via `ExamGroupBar`).
- **Mobile drawer:** dialog semantics + `aria-label` only when open; closed drawer is `inert` so its links leave the tab order - `SidebarLayout.tsx`.

---

## Error placement / API error boundary

| Surface | Field validation (inline below field) | API failure (certified `Alert`) |
|---|---|---|
| Login | email, password | login error (above form) |
| Login reset modal | email | reset error (below field, above actions) |
| Signup | fullName, email, password, confirmPassword, couponCode, examSelection | signup error (above form) |
| VerifyEmail | — (no fields) | check / resend errors (inline in actions block) |
| FinishSignIn confirm email | email | auth error (status screen, `role="alert"`) |
| UpdatePassword (reset) | password, confirmPassword | update error (above form) |
| User Profile | currentPass, newPass, confirmPass | verify / update errors (above form) |
| AddExamModal | examId, examName, examSelection, totalQuestions, totalMarks, durationMinutes, negativeMarkValue, paperName, per-subject rows, subject array sum | API error (certified Alert) |
| ExamParamsForm | totalQuestions, totalMarks, durationMinutes, negativeMarkValue | API error (page Alert) |
| SubjectDistribution | subject array sum (inline under Running Total) | save error (Alert) |
| AdminSubAdmins | name, email, coupon | API error (Alert) |
| SingleQuestionModal | question_text_en, option_a_en…option_d_en | API error (Alert) |
| PromptEditorModal | topic_name, prompt_text | API error (Alert) |
| AdminTopics | title_en, content_en, title_te, content_te, display_order, youtube_url | API error (Alert) |
| CreateStepSetup | title, duration_minutes, marks_per_question, negative_mark_value, start_time, end_time | — (wizard-local) |
| QuestionCard (edit) | question_text_en, option_a_en…option_d_en | API error (Alert) |
| CreateStepPublish | — (publish error) | certified Alert (API failure) |
| Settings Identity | name, password | API error (Alert) |
| **Exam runtime** | — (no form fields; answer-option rule + result parsing validated at service boundary via shared schemas; summary briefing is `role="status"`, not field errors) | full-page `ExamPageError` (retryable) for load/link errors; contextual banner for transient save failure (exception E8) |

---

## Verification

- `npx tsc -b` - clean.
- `npm run build` - exit 0 (only pre-existing chunk-size notices).
- `npx vitest run src/validations` - 165/165 pass.
- ESLint on all 17 touched files in Step 5 - 0 new errors/warnings (remaining findings all pre-existing sub-admin baseline debt in the uncommitted working tree: `set-state-in-effect`, `prefer-const`, `no-explicit-any`, unused `catch` params, `exhaustive-deps`).
- ESLint on all 16 touched files in Step 6 - 0 new errors/warnings (remaining findings all pre-existing exam-runtime baseline debt: `no-explicit-any`, `set-state-in-effect`, `prefer-const`, empty `catch`, `exhaustive-deps`, `purity`).
- Step 6 manual scenarios: start, resume, navigate, save/clear answer, mark for review, finish, submit, auto-submit, session expiry, timer expiry, refresh recovery, network/API failure - preserved except the intended fixes (blank-page → retryable error, stats/visited-set correction, submit summary shown, invalid-link errors, guarded review write, option-rule at service boundary).

---

## Change Record

- v1.0.0 - 2026-08-01 - Step 3 (Auth + Profile) complete: D2 inline field errors + `aria-invalid`/`aria-describedby`/error-id wiring + submit/blur timing across Login (A1), reset modal (A2), Signup (A3), FinishSignIn (A5), VerifyEmail (A6), UpdatePassword (A8), Profile (A9); API errors routed to certified `Alert`; VerifyEmailPage migrated to certified `Button` with inline error surfacing; Profile server errors no longer invisible; FinishSignIn lint fixed.
- v1.1.0 - 2026-08-01 - Step 4 (Admin Module) complete: AddExamModal (A10) per-field inline + `noValidate` + removed `isSumValid` gate + canonicalized sum message; ExamParamsForm (A11) now validated via `examParamsSchema` (previously 0/negative values savable); SubjectDistribution (A12) inline sum error replacing the `saveSubjects` throw; AdminSubAdmins (A13) on `subAdminOnboardSchema` + coupon normalized at submit; SingleQuestionModal (A14) per-field errors + certified Alert; PromptEditorModal (A15) schema errors + double-Alert fixed; AdminTopics (A16) title/content/url/order inline errors; a11y labels (A17). Tests 131/131; build + tsc green; 0 new ESLint findings.
- v1.2.0 - 2026-08-01 - Step 5 (Sub-Admin Module) complete: CreateStepSetup (A18) on shared `examConfigSchema` with per-field inline + submit/blur + DateTimePicker ARIA; JSON/prompt a11y (A19); QuestionCard (A20) edit-save validated via `BulkQuestionSchema`; CreateStepPublish (A21) on certified Alert; no-questions guard canonicalized via `EXAM_NO_QUESTIONS_MESSAGE` (A22); settings Identity (A23) on `identityUpdateSchema` with inline errors + blur; a11y search labels (A24). Tests 152/152; build + tsc green; 0 new ESLint findings.
- v1.3.0 - 2026-08-01 - Step 6 (Exam Runtime) complete: shared exam-runtime schemas `selectedOptionSchema` + `questionEnFieldsSchema` + `submitResultSchema` (A25); EN-field rule single owner via `assertValidEnFields` → `questionEnFieldsSchema` (A26); answer-option rule at the `examService.setQuestionAnswer` boundary (A27); stats/visited-set bug fixed (A28); retryable error screens replacing blank page + stuck spinners + invalid-link errors (A29); pre-submission summary rendered in the submit modal with `markedCount` + `aria-describedby` (A30); result parsing via `submitResultSchema` (A31); review gate write guarded (A32); timer `role="timer"` + last-minute announcements (A33); `canProceed` centralized in `QuestionNavigator` (A34). Tests 165/165; build + tsc green; 0 new ESLint findings. Exam-experience exceptions registered in `exception-register.md` (E1–E12); inventory status → IMPLEMENTED.
- v1.4.0 - 2026-08-01 - Step 7 (Repository Accessibility Sweep) complete (A35): all deferred a11y items implemented across 25 files - palette `aria-current` + group semantics, nav landmark + collapse toggle, review search/filter labels, answer-option + language radiogroup semantics, modal focus restore, `role="alert"` on `ErrorState`/fullscreen prompt/violation (E5 wired), loading `role="status"` on 4 components, review-mode sr-only correctness labels, 17 tab lists labelled, mobile drawer dialog + `inert`. Accessibility-only, no visual/logic change. New `accessibility-report.md` (v1.0.0). Tests 165/165; build + tsc green; ESLint 0 new (15 remaining findings pre-existing).

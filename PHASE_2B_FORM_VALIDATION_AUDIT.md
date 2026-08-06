# PHASE 2B — Form Validation Audit & Standard Proposal

**Status:** AUDIT COMPLETE — awaiting approval. **No implementation performed.** All findings are research/documentation only.
**Category:** Form Validation (Phase 2 of Design System Polish & UX Standardization).
**Golden Reference:** User Panel. **Foundation:** FROZEN — no redesign, no API breaks, no component duplication, no bypassing reusable components.
**Out of scope for 2B:** buttons, spacing tokens, typography, layout, tables, charts, loading, containers.
**Date:** 2026-08-01
**Sources:** Three in-depth module audits (Auth+Profile / Exam+Prepare-Write / Admin+Sub-Admin) + verified greps.

---

## 1. Scope & Method

Audited every form surface in the application (User, Auth, Exam, Admin, Sub Admin):

| Module | Audit method | Native `<form>` | Form surfaces |
|---|---|---|---|
| Auth + Profile | full file reads + greps | 4 files / 5 forms (Login ×2, Signup, FinishSignIn, UpdatePassword, ProfileForm) | 10 |
| Admin + Sub Admin | full file reads + greps | 1 (AddExamModal) | 19 |
| Exam + Prepare-Write | full file reads + greps | 0 | ~15 flows/states |

**Verified cross-cutting baseline (production code):**
- Native `<form onSubmit>`: **7 forms in 6 files** — `LoginPage.tsx` (×2), `SignupPage.tsx`, `FinishSignInPage.tsx`, `auth/UpdatePasswordPage.tsx`, `components/profile/ProfileForm.tsx`, `components/admin/settings/AddExamModal.tsx`.
- `react-hook-form` `useForm` calls: **3** (`LoginPage` ×2, `SignupPage` ×1). `zodResolver`: same 3.
- zod `safeParse` in UI: **6 call sites** — `UpdatePasswordPage` (`passwordCreateSchema`), `ProfileForm`/`useProfile` (`passwordChangeSchema`), `AddExamModal` (`examCreationSchema`), `SingleQuestionModal` (`SingleQuestionSchema`), `useBulkUpload.processJsonData` (`BulkQuestionSchema` per row), `useSettings.handleSaveProfile` (`passwordSchema`, conditional).
- `aria-invalid`: **0 in production** (5 occurrences, all in `src/ds003-runtime-audit.test.tsx`).
- `aria-describedby`: **5 in production, ALL in `SignupPage`** (fullName/email/password/confirmPassword/couponCode) + 1 dialog-level (`AdminModal.tsx:61`).
- `useToast.showError`: **0 call sites** — defined (`useToast.tsx:31`) but never invoked anywhere.
- `validateOrThrow`: **4 call sites, all repository layer** (`question.repository.ts` ×3, `exam.repository.ts` ×1). Zero UI usage.
- `ToastContainer` root: plain `div` — **no `role`, no `aria-live`** (success toasts are not announced to screen readers).

---

## 2. Part A — Validation Inventory

Legend — Method: **RHF** = react-hook-form + zodResolver; **zod** = zod safeParse at submit; **manual** = hand-written state checks; **none** = no validation.
Error display types: `Inline` = below-field text, `Alert` = `Alert variant="error"` banner, `RawBox` = hand-rolled colored div, `Page` = full-screen state/screen, `List` = multi-line list, `Badge` = color chip, `Toast` = toast.

### 2.1 Auth + Profile (10 surfaces)

| # | Surface | Fields | Method | Timing | Error display | Success | API/server | A11y | Key issue |
|---|---|---|---|---|---|---|---|---|---|
| A1 | `LoginPage.tsx:266` login | email, password, captcha | RHF + local `loginSchema` | submit | Inline `<span>text-xs font-bold text-danger mt-1>` (no id/aria) + Alert banner | navigation | `loginWithEmail` err → Alert | `aria-live` on banner; no field aria | local schema; error not linked to field |
| A2 | `LoginPage.tsx:424` forgot-password | email | RHF + local `resetSchema` | submit | Inline `<div>` box (DIFFERENT style from A1) + Alert | toast + "Check your inbox" state | `sendPasswordReset` err → Alert | `aria-live`; no field aria | `document.querySelector('#reset-form').requestSubmit()` DOM hack; submit button outside `<form>`; inline style differs from A1 |
| A3 | `SignupPage.tsx:342` signup | fullName, email, password, confirmPassword, couponCode, examSelection | RHF + local `signupSchema`, mode `onChange`; manual strength + coupon hook | realtime | Inline with `id`+`aria-describedby`+`aria-live` (BEST in codebase); Alert for API | SuccessModal → navigate | `signupWithEmail` err → Alert (ALREADY_EXISTS special-case) | 5× aria-describedby + `setFocus` on error; **no aria-invalid** | schema duplicates shared password policy; `examSelection` Select not registered, error not aria-wired; strength meter = duplicate regex |
| A4 | `SignupPage.tsx:121` selection-only card | examSelection | manual (button gating) | n/a | Alert | navigation | err → Alert | none | div-based, not a `<form>` |
| A5 | `FinishSignInPage.tsx:121` confirm email | email (auto-filled) | manual (native `required`) | submit | Page-level status block (no alert role) | success state → navigate 2s | `completePasswordlessSignIn` err → status | none anywhere | native validation; raw `<label>`s |
| A6 | `VerifyEmailPage.tsx` | none | none | n/a | none | inline verified → navigate | `handleCheck` no catch; `handleResend` no catch (errors swallowed) | none | **raw buttons `:181` Resend, `:208` Sign Out** (see Part F); no error surfacing |
| A7 | `AccountDisabledPage.tsx` | none | none | n/a | none | n/a | n/a | none | static; CONTACT SUPPORT = mailto `<a>` wrapping Button |
| A8 | `auth/UpdatePasswordPage.tsx:71` | password, confirmPassword | manual state + **shared `passwordCreateSchema`** | submit | Single `RawBox` (NOT Alert; NOT inline; `text-red-500 bg-red-50`) | "Password Secured" state → navigate 3s | `updatePassword` err → same box (service re-validates passwordSchema) | none | `issues[0]` only; hardcoded EN strings (no `t()`); inline `<style>` block |
| A9 | `components/profile/ProfileForm.tsx:70` + `useProfile.ts` | currentPass, newPass, confirmPass | hybrid manual derived + **shared `passwordChangeSchema`** | realtime badges + submit | Top Alert banner; 5-Badge checklist (`role="list"`, `aria-live`) | toast `showSuccess` + forced logout | **BUG:** `handleVerify`/`handlePasswordUpdate` server errors → `captureServerError` → `pageError` **never rendered** (invisible to user) | `role="alert"` on forgot panel; no field aria | server-error invisibility = most serious defect found; badge regexes duplicate policy |
| A10 | `auth/AuthCallbackPage.tsx` | none | none | n/a | forwards to `/login?error=` | navigations | token-based | none | — |

**Auth module summary:** RHF is confined to Login/Signup (3 `useForm`). UpdatePassword + ProfileForm use manual `safeParse` with `issues[0]`. FinishSignIn uses native validation. 4 error-presentation styles in one module (A1 span, A2 div, A8 raw box, A3 wired span). Password policy duplicated 4× (see Part C). Message inconsistency: login `"Enter a valid email address."` vs signup `"Enter a valid email"`.

### 2.2 Admin + Sub Admin (19 surfaces)

| # | Surface | Fields | Method | Timing | Error display | Success | A11y | Key issue |
|---|---|---|---|---|---|---|---|---|
| M1 | `admin/settings/AddExamModal.tsx:169` | examId, examName, examSelection, totalQuestions/Marks, duration, switches, 2 papers, dynamic subjects | **zod `examCreationSchema`** + manual realtime sum badges | submit (+realtime badge) | Alert banner | toast + close | none | `issues[0]`; `isSumValid` manual dup of `.refine`; only native admin form; no `noValidate` |
| M2 | `admin/settings/ExamParamsForm.tsx` | total_questions, total_marks, duration_minutes, switches, negative_mark_value | **none** | n/a | page Alert (via handleSave) | toast | none | **no range/positive validation** — 0 questions / 0-minute / negative marks can be saved |
| M3 | `admin/settings/SubjectCardItem` + `SubjectDistributionPanel` | question_count, marks_per_question | manual realtime Badge + throw on save | realtime + save | Badge + page Alert | toast | none | sum rule has 3 wordings (Part C) |
| M4 | `admin/sub-admins/AdminSubAdminsView.tsx` (page `AdminSubAdmins.tsx:40`) | newSAName, newSAEmail, newSACoupon | **manual** (truthiness + email regex) | submit | modal Alert | toast | none | coupon uppercased twice; no zod |
| M5 | `admin/questions/QuestionForm.tsx` | full question fields + visual JSON editor | **none** (parent validates) | n/a | n/a | n/a | none | visual JSON editor swallows parse errors in `catch {}` |
| M6 | `admin/questions/modals/SingleQuestionModal.tsx:104` | full QuestionForm + hidden context | **zod `SingleQuestionSchema`** | submit | inline red `RawBox` (no `role="alert"`) | refetch (no toast) | none | inline div not Alert; no role |
| M7 | `admin/questions/QuestionsActions.tsx` | search, difficulty filter | **none** | debounced | page Alert | n/a | `aria-label` on search ✓ | search unlabeled elsewhere |
| M8 | `admin/questions/JsonTab.tsx` + `useBulkUpload.processJsonData` | JSON TextArea | **zod `BulkQuestionSchema` per row** + manual parse/hash | on Validate click | inline error `List` with `role="alert"` + Skip Row | auto-switch to Preview | `role="alert"` ✓ | TextArea unlabeled |
| M9 | `admin/questions/PromptEditorModal.tsx` | topicName, promptText, isDefault | **manual** non-empty | submit | Alert (may render **twice** — shared state with BulkUploadPanel) | toast | none | double-render caveat |
| M10 | `admin/topics/LangInputPanel.tsx` | title, rawText | **none** (parser deterministic) | Parse click | Alert "Nothing parsed..." | toast | none | inputs unlabeled |
| M11 | `admin/topics/TopicMetadataFields.tsx` | displayOrder, youtubeUrl, isPublished | **none** | n/a | n/a | toast (parent) | none | `type="url"` native only — malformed URL saved |
| M12 | `common/AdminFilterBar.tsx` (+ `UsersToolbar`, `TopicsToolbar`) | search, month | **none** | debounced | n/a | n/a | refresh `aria-label` ✓ | search inputs unlabeled |
| N1 | `sub-admin/settings/IdentitySection.tsx` + `useSettings.handleSaveProfile` | name, email (ro), password | **manual + conditional zod `passwordSchema`** | submit | page Alert (shared, SubAdminSettings) | toast | none | password policy split across flows; `issues[0]` |
| N2 | `sub-admin/settings/NotificationSection.tsx` | 3 switches | **none** (optimistic + rollback) | immediate save | page Alert; inline "Saving..." | none | switch role ✓ | no success feedback |
| N3 | `sub-admin/create/CreateStepSetup.tsx` | title, duration, marks, negative_mark, start/end | **manual `validateConfig()`** (NOT zod) | Final Review click | inline red `List` | advance step | none; raw inputs, labels not `htmlFor`-associated | `validateConfig` duplicates `examCreationSchema` ranges w/ different wording |
| N4 | `sub-admin/create/CreateStepPrompt.tsx` | count input | **none** (`parseInt` > 0) | click | page Alert | toast | none | raw unlabeled input |
| N5 | `sub-admin/create/CreateStepJsonPaste.tsx` | JSON TextArea | **manual inline parser** (duplicates dead `validateQuestions()` and `BulkQuestionSchema`) | Parse click | inline red `RawBox` | green inline banner + confirm | none | major duplication (Part C) |
| N6 | `sub-admin/create/CreateStepPublish.tsx` + `useCreateExam.handlePublish` | none (summary) | **manual** (questions.length, user) | Publish | inline red box | toast + SuccessView | none | — |
| N7 | `sub-admin/create/QuestionCard.tsx` | question fields inline edit | **none** (empty accepted) | Save | none | closes edit mode | none | blank fields accepted |
| N8 | `sub-admin/create/CompactDateTimePicker.tsx` | date, hour, minute, am/pm | **manual onBlur** (hour 1–12, minute 0–59) | **onBlur — the ONLY onBlur in scope** | **inline-below-field (the ONLY true inline error in scope)** | n/a | none | raw inputs |
| N9 | `sub-admin/create/types.ts` | (logic) `safeParse`, `validateConfig` | manual; `validateQuestions()` = **DEAD CODE** | — | — | — | — | dead duplicate validator |

**Admin/Sub-Admin summary:** zod UI validation at only 4 sites; 11 manual; 5 none. Timing: submit-only dominates (14); only 1 onBlur; 1 immediate-save. Error display: 10 Alert banners, 6 raw inline blocks, 1 true inline-below-field, 1 JSON list, 0 toasts. `aria-invalid`/`aria-describedby`: **0 in this module**.

### 2.3 Exam + Prepare-Write (module — no conventional forms)

**Verified: ZERO zod anywhere in the exam module** (no imports under `pages/exam`, `components/exam`, exam hooks, prepare-write). All validation is manual state / none.

| Surface | Method | Timing | Error display | Success | Key issue |
|---|---|---|---|---|---|
| Init/load (`useExamInitialization`) | manual try/catch | on mount | page-level `ExamPageError` → `ErrorState` (**no `role="alert"`**, `role="img"` icon only) | phase transition | fallback strings scattered |
| Answer select (`useExamSession:113`) | manual optimistic + rollback | realtime | Alert banner (auto-dismiss 5s) | silent palette recolor | `aria-pressed` only; no field linkage |
| Mark/Clear (`useExamSession:82-181`) | manual optimistic | realtime | Alert banner | silent | — |
| Finish / Submit (`SubmitExamModal`) | none (direct) | submit | banner after close | full-screen overlay → `/review` | **dead props** `answeredCount/notVisitedCount/totalCount` never rendered — **no unanswered-question warning exists** |
| Auto-submit time-up (`useExamSubmission:93`) | guard refs | timeout | non-dismissible modal | auto submit | no `aria-live` on transition |
| Tab-switch security (`ExamTimer`) | manual threshold | realtime | warning Alert banner | — | `updateTabSwitchCount` failure = `console.error` only (**silent**) |
| Fullscreen enforcement | manual counter | realtime | 3 different surfaces (bar/box/banner) | — | inconsistent surfaces |
| Language selection (`LanguageSelectionScreen`) | manual availability | on mount | amber info chips | gate | `role="dialog"` ✓ FocusTrap ✓ |
| Prepare-write answers (`usePrepareWrite.handleAnswer`) | **none** | click | **none** | toast "Exam submitted successfully." | **duplicate success toast** in `submitExam` + `handleNextOrSubmit` (`:220`,`:253`); no-op guards absent |
| Prepare-write exit | manual | click | — | — | native `window.confirm` (no a11y) |
| Prepare-write load errors (`usePrepareWrite`) | `captureServerError`/`captureNetworkError` | — | `ErrorContainer` (`role="alert"` + `aria-live="assertive"`) ✓ | — | **only** correctly-announced page error in module |
| `SelectionView` availability | server `{valid,message}` | on load | inline `disabledMessage` on cards | — | only inline server-validation display in module |
| `ReviewLayout` search (`ReviewLayout.tsx:84`) | **none** | onChange | empty-state card | — | **no label, no id, no aria-label** (accessible-name gap) |

**Exam/Prepare-Write summary:** 0 native forms, 0 text inputs except the unvalidated Review search. **A11y split:** secure-exam errors (`ExamPageError`/`ErrorState`) are NOT announced; prepare-write (`ErrorContainer`) IS. Silent failures in `touchQuestionVisit`, `addQuestionTime`, `syncAnswersCache`, `updateTabSwitchCount`. `showError` unused (only `showSuccess` in `usePrepareWrite`).

---

## 3. Part B — Validation Pattern Report

### 3.1 Error presentation variants (8 distinct, no canonical)

| # | Pattern | Where | Notes |
|---|---|---|---|
| P1 | Inline `<span>` (unwired) `text-xs font-bold text-danger mt-1` | Login A1 | no id/aria |
| P2 | Inline `<div>` box `p-3 ... bg-danger/10 border-danger/20` | Login reset A2 | differs from P1 in same file |
| P3 | Inline `<span id>` + `aria-describedby` + `aria-live` | Signup A3 | **reference implementation** |
| P4 | Raw `text-red-500 bg-red-50 p-4 ...` box | UpdatePassword A8 | not Alert, not inline, `issues[0]` |
| P5 | `Alert variant="error"` banner | 12+ surfaces (Login, Signup, Profile, AddExamModal, IdentitySection, page-levels...) | `role="alert"` ✓; often `issues[0]` |
| P6 | Hand-rolled red `RawBox`/`List` (`bg-red-500/8 border-red-500/20`) | SingleQuestionModal, CreateStepSetup/JsonPaste/Publish | **no `role="alert"`** |
| P7 | Inline JSON error `List` with `role="alert"` + Skip Row | JsonTab M8 | ✓ (only list with row granularity) |
| P8 | Page-level status screen / full-screen error state | FinishSignIn A5, ExamPageError | no alert role in exam variant |

Plus `Badge` color feedback (Password checklist, sum badges) and Toast (success only).

### 3.2 Accessibility gap

- `aria-invalid`: **0 production** (foundation `Input/TextArea/Select` forward `...props` and render `aria-invalid` per test `ds003`, but no consumer passes it).
- `aria-describedby`: **5, all SignupPage**. `examSelection` error span exists (`id="examSelection-error"`) but the Select is not wired.
- `role="alert"`: via `Alert` error variant, `ErrorContainer`, JsonTab list, PreviewTab banner, ProfileForm forgot-panel. **Missing** on: `ErrorState`/`ExamPageError`, SingleQuestionModal RawBox, UpdatePassword RawBox, CreateStep Setup/JsonPaste/Publish raw boxes, FinishSignIn error state.
- `ToastContainer`: no `role`/`aria-live` → **even success toasts are not announced**.
- Label association: raw `<label>` without `htmlFor`/`id` in UpdatePassword, FinishSignIn, CreateStepSetup, QuestionForm, CompactDateTimePicker; search inputs unlabeled.
- Focus management: `setFocus` only in SignupPage (A3). Login/Profile/AddExam/etc. do not move focus to first error.

### 3.3 Timing report

- Submit-only: **~20 surfaces** (all zod forms, all Alert-banner forms).
- Realtime derived: 3 (Signup RHF onChange, ProfileForm badges, AddExamModal sum badges).
- onBlur: **1** (CompactDateTimePicker).
- Immediate-save: 1 (NotificationSection switches).
- **No form validates per-field on change/blur except CompactDateTimePicker; no zod form surfaces more than `issues[0]`.** Users see one error at a time even when many fields are invalid.

### 3.4 Success feedback

Navigation (login, signup modal, update-password state, exam overlay→review), success toast (`showSuccess`, success-only), inline verified states. **No error toasts anywhere** (`showError` dead).

---

## 4. Part C — Duplicate Validation Report

### C1. Duplicated validation logic (highest risk first)

| # | Rule | Duplicated in | Result |
|---|---|---|---|
| C1 | Password policy (min 8 + upper + number + special) | 1) `securitySchemas.ts` `passwordSchema` (canonical); 2) `SignupPage` local `signupSchema`; 3) `SignupPage.getPasswordStrength` regexes; 4) `useProfile.ts` `has*` regexes | 4 implementations |
| C2 | Confirm-match | shared `passwordCreateSchema` + `passwordChangeSchema` refines; `SignupPage` `.refine`; `useProfile.passwordMatch` | 3 implementations |
| C3 | Subject-question-sum rule | zod `examCreationSchema` refine (`'Subject question counts must equal total questions'`); `useAdminSettings.saveSubjects` throw (`Total questions must be ...`); `AddExamModal` inline (`'Questions sum must match exact total questions.'`) + `isSumValid` manual | 3 wordings, 1 rule |
| C4 | Empty-questions guard | `useCreateExam.handleStepChange` (`'...parse your JSON questions...'`); `useCreateExam.handlePublish` (`'No questions available...'`); `CreateStepReview` inline (`'You must have at least one question...'`) | 3 copies |
| C5 | Question-JSON validation | `create/types.ts validateQuestions()` (**DEAD CODE**, never imported); `CreateStepJsonPaste.handleParse` (near-verbatim copy); shared `BulkQuestionSchema` (unused by sub-admin) | 3 implementations |
| C6 | Exam config ranges | `validateConfig()` (types.ts) vs `examCreationSchema` (admin) — different wording/prefixes for same limits (title length, duration 24h, marks, negative-mark ≤ base) | 2 rule-sets |
| C7 | "Exam submitted successfully." toast | `usePrepareWrite.ts:220` and `:253` | duplicate toast risk |
| C8 | Review search/filter | `useReview.ts:60-75` and `ReviewView.tsx:55-69` | 2 copies |
| C9 | `canProceed = hasAnswer || isMarked` | `useQuestionNavigation.ts:59`, `QuestionNavigator.tsx:49`, `ExamView.tsx:101` | 3 copies |
| C10 | "Telugu Translation Unavailable" | `QuestionCard.tsx:70`, `ReviewQuestionCard.tsx:37`, `PreparationView.tsx:100` | same text, 3 markup variants |
| C11 | Coupon uppercasing | `AdminSubAdminsView` onChange + `AdminSubAdmins.tsx:50` service call | 2x normalize |
| C12 | Email-format regex | `AdminSubAdmins.tsx` manual regex vs `z.string().email()` elsewhere | divergent messages |

### C2. Schema/message inconsistency

- Login `"Enter a valid email address."` vs Signup `"Enter a valid email"` (same field, different message).
- `'Must have at least 1 question'` reused for two different fields (`totalQuestions`, `examSubjectSchema.question_count`).
- `SingleQuestionSchema` `'Correct option is required.'` has a trailing period; siblings don't.
- Login/Signup use **file-local** schemas; only UpdatePassword/ProfileForm use shared `securitySchemas.ts`.

### C3. Dead / stale artifacts

- **Dead code:** `sub-admin/create/types.ts validateQuestions()` (complete, never imported).
- **Stale docs claiming `showError`/`useToast` in exam hooks & settings READMEs** (`pages/exam/AR006_*.md`, `components/admin/settings/README.md`, `components/sub-admin/settings/README.md`, `pages/sub-admin/AR008_COMPLETION.md`, `hooks/AR014_COMPLETION.md`) — actual code uses Alert banners; `showError` is genuinely dead.
- `SubmitExamModal` accepts `answeredCount/notVisitedCount/totalCount` but never renders them (data for an unanswered-question warning is thrown away).

---

## 5. Part D — Validation Standard Proposal (for approval — NOT implemented)

These mirror `FORMS.md` conventions (which only Auth adopted) and the frozen Error Experience System boundary (business validation ≠ ErrorContainer; toasts remain separate). Foundation stays frozen — this is adoption, not redesign.

- **D1 — Validation library:** zod schemas are the single source of truth for field rules + messages (per existing `FORMS.md`). react-hook-form where form state management is warranted (Auth already proves the pattern); manual + `safeParse` is acceptable but must surface **all** issues, not `issues[0]`.
- **D2 — Canonical field-error presentation (the SignupPage pattern):** inline below-field, `text-xs font-bold text-danger mt-1`, error node `id="{field}-error"`, input wired `aria-describedby={error ? '{field}-error' : undefined}` + `aria-invalid`, error node `aria-live="polite"`. One spacing token (mt-1). This is the single presentation; all 7 other variants (P1–P8) migrate to it.
- **D3 — Timing standard:** validate on **submit + onBlur-after-first-submit** for all fields; show all invalid fields simultaneously. Keep realtime derived feedback where it is value-add (password strength badges, sum badges) as non-blocking *status*, not error text.
- **D4 — Error routing:** field-level → inline (D2). Non-field/submission API failures → top `Alert variant="error"` (keep). Page-level data failures → frozen `ErrorContainer` + `RetryButton` (already the standard). Errors must never be silent (fix ProfileForm orphaned `pageError`; stop swallowing VerifyEmail/reserve silent catches).
- **D5 — Schema consolidation:** delete local `loginSchema`/`resetSchema`/`signupSchema` inline duplicates by adding shared schemas to `securitySchemas.ts` (or a new shared auth schema file); delete dead `validateQuestions()`; unify `CreateStepJsonPaste` onto `BulkQuestionSchema`; align `validateConfig` ranges with `examCreationSchema`; unify the 3 subject-sum wordings and 3 empty-guards.
- **D6 — A11y requirements:** `aria-invalid` on invalid inputs; `aria-describedby` wiring everywhere (foundation already forwards props); add `role="alert"` to all hand-rolled error blocks (P6/P8 exam); add `role="status"`/`aria-live="polite"` to `ToastContainer`; associate all labels via `htmlFor`/`id`; `setFocus` to first invalid field on submit failure.
- **D7 — Exam-specific:** implement the unanswered-question confirmation using `SubmitExamModal`'s already-passed dead props; announce `ExamPageError`/`ErrorState` with `role="alert"`; surface tab-switch/persist failures (stop silent `console`); remove duplicate success toast.
- **D8 — Messages:** single canonical message per rule (fix login/signup email string; drop stray punctuation); keep `authService.mapError` strings as the server-message source.
- **D9 — Out of scope for implementation:** no redesign of `Alert`/`Input`/`ToastContainer` internals; foundation components only gained pass-through props already present.

---

## 6. Part E — Migration Plan & Implementation Order (for approval — NOT implemented)

Implementation is deferred until the audit is approved. Proposed order (each step validated with `tsc -b` + `npm run build` + targeted eslint):

1. **Foundation enablement (smallest, unblocks all):** ToastContainer a11y (`role="status"` + `aria-live`). *(No consumer changes.)*
2. **Schema consolidation (pure refactor):** add shared auth schemas, delete local Login/Signup inline schemas, delete dead `validateQuestions()`, unify `CreateStepJsonPaste` onto `BulkQuestionSchema`, dedupe C3/C4/C6 wordings.
3. **Auth + Profile module** (highest traffic, already RHF): adopt D2 presentation in Login (A1, A2), convert UpdatePassword raw box → D2 + all-issues, wire ProfileForm field errors + **fix invisible server errors** (A9), VerifyEmailPage buttons decision (Part F).
4. **Admin module:** M2 ExamParamsForm range validation (currently **none**), M6/M9 raw boxes → Alert/D2, M1 `issues[0]` → all-issues, dedupe M3 sum rule.
5. **Sub-Admin module:** N3 CreateStepSetup → shared `examCreationSchema`-derived rules, N7 QuestionCard required-field validation, N8 keep onBlur (align styling to D2), N1/N5 onto shared schemas.
6. **Exam + Prepare-Write:** unanswered-question warning (D7), `role="alert"` on error screens, surface silent failures, remove duplicate success toast.
7. **A11y sweep:** `aria-invalid`/`aria-describedby`/label association across all migrated forms; `setFocus` behavior.
8. **Final validation:** full build, lint, manual pass against Golden Reference.

Rationale: foundation first → shared schemas → highest-risk user flows (Auth) → admin data-entry (numeric ranges) → wizard (sub-admin) → exam (least form-like) → a11y sweep. No step changes frozen APIs; each is incremental and independently revertible.

---

## 7. Part F — VerifyEmailPage Raw-Button Decision (recommendation for approval)

**Facts:** `VerifyEmailPage.tsx:181` Resend and `:208` "Sign Out & Try Again" are hand-rolled raw `<button>`s (`h-[44px] rounded-[12px] text-[12px] uppercase`, `text-danger/70`) duplicating the certified `Button` look with slightly different geometry. NOT registered exceptions. (Also flagged in Phase 2A follow-up.)

**Recommendation: MIGRATE to certified `Button`** — `variant="secondary"` for Resend, `variant="danger"` for "Sign Out & Try Again". Rationale: these are page-level, full-width actions (not compact micro-actions eligible for the E22–E75 exception class); accepting the minor geometry normalization to the certified component removes hand-rolled markup and a duplicate implementation. Registering them as exceptions (option b) is not justified — the exception register is for dense, compact, context-specific controls, and this is a plain page action. As a side fix, add the missing error surfacing for the silently-swallowed Resend path (`try/finally` with no catch).

**Decision needed from user:** Approve migration (recommended) or register as exceptions.

---

## 8. Annex — Canonical schema & message strings (verified)

`securitySchemas.ts`:
- `passwordSchema`: `Password must be at least 8 characters` / `Must include an uppercase letter` / `Must include a number` / `Must include a special character`
- `passwordCreateSchema` refine (confirmPassword): `Passwords do not match`
- `passwordChangeSchema`: `Current password is required` (currentPass) + `Passwords do not match` (confirmPass) + `New password cannot be the same as the current password` (newPass)
- `examSubjectSchema`: `Subject name is required` / `Must have at least 1 question` / `Marks must be at least 0.1`
- `examCreationSchema`: `Exam ID is required` / `Exam ID must be 50 characters or less` / `Exam ID must contain only uppercase letters, numbers, and underscores` / `Display name is required` / `Name must be 200 characters or less` / `Selection category is required` / `Must have at least 1 question` (totalQuestions) / `Cannot exceed 1000 questions` / `Total marks must be at least 1` / `Duration must be at least 1 minute` / `Cannot exceed 1440 minutes (24 hours)` / `Negative mark cannot be negative` / `Paper name is required` / `At least one subject is required` / `Cannot have more than 20 subjects` / refine `Subject question counts must equal total questions` / refine `Negative mark value must be between 0 and marks per question`

`questionSchema.ts`:
- `SingleQuestionSchema`: `English question is required` / `English Option A..D is required` / `Correct option is required.` / `Exam context is required` / `Paper is required` / `Subject is required`
- `BulkQuestionSchema`: same core, no exam/paper/subject context

`authService.mapError` (server, surfaced via Alert): `Too many attempts. Please wait a few minutes.` / `Incorrect email or password.` / `Invalid email or password.` / `Password is too weak. Try a stronger one.` / `The session was momentarily interrupted. Please try again.` / `Account temporarily locked.` / `` Account temporarily locked. Try again in ${mins} minute(s). `` / `Registration failed. Please try again.`

---

### Change Record

- v2.0.1 — 2026-08-01 — Phase 2B (Form Validation) AUDIT COMPLETE: full Validation Inventory (10 auth + 19 admin/sub-admin + exam flows), Pattern Report (8 presentation variants, a11y gap), Duplicate Report (12 rule duplications + dead code), Standard Proposal D1–D9, Migration Plan (8-step order), VerifyEmailPage migration recommendation. **Awaiting approval — no implementation performed.**

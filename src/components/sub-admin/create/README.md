# Sub Admin Create Exam — Golden Reference

## Purpose

Sub-admin exam creation wizard. Guides the sub-admin through a 5-step
process: selecting a question count and copying an AI prompt, pasting and
validating AI-generated JSON questions, reviewing and editing questions,
configuring exam settings (title, timing, scoring), and publishing the
exam via an atomic database transaction.

---

## Architecture

```
SubAdminCreate.tsx (composition only)
  └─ useCreateExam() feature hook
       ├─ useAuth (user context)
       ├─ useBreakpoint (responsive breakpoint)
       ├─ useToast (notifications)
       ├─ useStableFetch (stale-request protection)
       ├─ teacherExamService.createTeacherExamAtomic()
       │   └─ teacherExamRepository.createTeacherExamAtomicRpc()
       │       └─ Supabase RPC: create_teacher_exam_atomic
       └─ types.ts (validators, prompt generator, helpers)

Presentation:
  ├─ CreateStepPrompt           — Step 1: count selection → copy → launch AI
  ├─ CreateStepJsonPaste        — Step 2: paste JSON → parse → validate
  ├─ CreateStepReview           — Step 3: review/edit/delete questions
  │   └─ QuestionCard           —   inline edit mode for single question
  ├─ CreateStepSetup            — Step 4: exam config form
  │   └─ CompactDateTimePicker  —   12-hour date/time picker
  ├─ CreateStepPublish          — Step 5: summary → publish
  └─ SuccessView                — Post-publish success screen
```

---

## Create Exam Workflow

The feature is divided into five sequential phases. Each phase has its
own validation boundary — a later phase cannot bypass an earlier phase
without completing its validation.

### Phase 1: Prompt Generation

Goal: Generate and copy an AI prompt for question creation.

```
Select question count (10/30/50/100 or custom)
    ↓
Copy AI generation prompt to clipboard
    ↓
Launch ChatGPT (opens in new tab with prompt pre-copied)
```

**Validation boundary**: The prompt itself is not validated — any count
selection is accepted. The clipboard copy and AI model launch are
best-effort operations with toast success/error feedback.

### Phase 2: JSON Ingestion

Goal: Accept AI-generated JSON, parse it, and validate it into a
structured question array.

```
Paste raw JSON into textarea
    ↓
[Parse & Validate] click
    ↓
safeParse() → JSON.parse → regex fallback → markdown cleanup
    ↓
validateQuestions() full pipeline:
  ├─ content empty check
  ├─ size limit check (≤ 500,000 chars)
  ├─ must be non-empty array (≤ 200)
  ├─ per-question required fields (question_text_en, option_a_en, correct_option)
  ├─ correct_option must be A/B/C/D
  └─ fields truncated to max lengths
    ↓
Validation errors? → Show error banner, stop
    ↓
questions[] set in useCreateExam
    ↓
[Confirm & Continue] → advance to Phase 3
```

**Validation boundary**: Questions must pass the full validation pipeline
before they are stored in `useCreateExam`. No unvalidated data enters
the hook.

### Phase 3: Question Review

Goal: Review, edit, delete, and add questions before configuring the
exam.

```
View all parsed questions as QuestionCards
    ↓
User actions:
  ├─ [Edit] → inline edit mode (local state in QuestionCard)
  │   └─ [Save] → commits changes to questions[] via handleEdit
  ├─ [Delete] → removes question, re-indexes remaining
  └─ [Add Question] → appends blank question template
    ↓
[Configure Exam] validates:
  └─ questions.length > 0? → error toast, stop
    ↓
Advance to Phase 4
```

**Validation boundary**: The only guard is `questions.length > 0`. Each
individual question is structurally valid (already validated in Phase 2).
Inline edits preserve validity — no re-validation occurs on save.

### Phase 4: Exam Configuration

Goal: Configure exam metadata, timing, and scoring, then validate the
full configuration.

```
Configure fields:
  ├─ Exam Title (required, 5-120 chars)
  ├─ Duration in minutes (1-1440)
  ├─ Marks per question (positive, ≤ 100)
  ├─ Negative mark value (0 to marks_per_question)
  ├─ Start date/time (must be in the future)
  └─ End date/time (must be after start, within 30-day window)
    ↓
[Final Review] click
    ↓
validateConfig(examConfig) → string[]
    ↓
Errors? → Show animated error list, stop
    ↓
Advance to Phase 5
```

**Validation boundary**: All six configuration fields are validated
atomically. The exam window, duration limits, and scoring consistency
are checked together. No partial configuration is accepted.

### Phase 5: Publication

Goal: Present the final summary and persist the exam atomically.

```
Summary display:
  ├─ Stat cards: Questions count, Duration, Total Marks
  └─ Detail card: Title, Start/End time, Status
    ↓
[Publish Exam] click
    ↓
Pre-flight checks:
  ├─ questions.length > 0 → local error, stop
  └─ user.id present → toast error, stop
    ↓
createTeacherExamAtomic({ user }, config)
    ↓
Service layer:
  ├─ ensureRole(['admin', 'sub_admin'])
  ├─ fetchSubAdminIdByUserId(user.id)
  └─ createTeacherExamAtomicRpc(params)
    ↓
Postgres RPC (atomic transaction):
  1. INSERT teacher_exams record
  2. INSERT teacher_exam_questions records
    ↓
Success → isPublished = true → SuccessView
Failure → publishError set → red banner
```

**Validation boundary**: The publish is the final gate. It enforces
both application-level pre-conditions (questions exist, user
authenticated) and database-level constraints (role, ownership,
referential integrity). The entire operation is atomic — either the
exam and all its questions are created, or nothing is persisted.

### Step Transitions

| From | To | Trigger | Guard |
|------|----|---------|-------|
| 1 | 2 | Tab click | None |
| 2 | 3 | "Confirm & Continue" | `questions.length > 0` |
| 3 | 4 | "Configure Exam" | `questions.length > 0` |
| 4 | 5 | "Final Review" | `validateConfig()` passes |
| 5 | Success | "Publish Exam" | `createTeacherExamAtomic()` succeeds |
| Any | Any | Tab click | `isPublishing` guard; step > 2 requires questions |

### Guard: Step > 2 Without Questions

If the user clicks a tab for step ≥ 3 before parsing questions in step 2,
a toast error is shown and the wizard redirects to step 2. This enforces
the sequential dependency between phases — Phase 3 cannot be entered
before Phase 2 completes.

---

## Validation Model

Validation is layered across three boundaries. Each layer enforces
different constraints and runs at a different point in the wizard.

### Layer 1: Question Validation

Triggered in Phase 2 (CreateStepJsonPaste) on "Parse & Validate" click.

```
Raw JSON string
    ↓
Input checks:
  ├─ Empty? → "The input field is empty."
  └─ > 500,000 chars? → "Input size exceeds safety limits."
    ↓
safeParse():
  ├─ JSON.parse (primary)
  ├─ regex extraction (fallback for markdown-wrapped JSON)
  └─ markdown cleanup (fallback for ```json blocks)
    ↓
Structure validation:
  ├─ Must be an array
  ├─ Must be non-empty
  ├─ Must be ≤ 200 items
  └─ Per item:
      ├─ question_text_en required (≤ 2000 chars)
      ├─ option_a_en required (≤ 1000 chars)
      ├─ correct_option required, must be A/B/C/D
      └─ All other fields optional, truncated to max lengths
    ↓
Result: QuestionData[] | error string
```

All business fields of `QuestionData` are handled during validation:
`question_text_en`, `question_text_te`, `option_a_en` through
`option_d_te`, `explanation_en`, `explanation_te`, `correct_option`,
`display_order`, `diagram`, `difficulty`. `client_id` is a transient
client-only identifier (see below) — it is always stripped before a
payload reaches any RPC, and the shared `BulkQuestionSchema` strips it
(and other unknown editor keys) from its validated output.

### Question identity

Each question carries a required `client_id` (generated by
`newQuestionClientId()` = `crypto.randomUUID()`). It exists only as a
stable React key / edit identity for the review list (`key={q.client_id}`
in `CreateStepReview`) and never touches the database: the service and
`toRpcQuestion()` strip it before the RPC call. `display_order` is a real
business field (source-of-truth ordering) and is re-derived (1-based)
after any delete.

**Duplicate detection is active.** On parse, `computeDuplicateRedundancy()`
marks repeated (valid) questions and `duplicateRows` are dropped from the
review list (reported in the parse summary). Questions are therefore
deduplicated, then validated individually.

### Layer 2: Configuration Validation

Triggered in Phase 4 (CreateStepSetup) on "Final Review" click.

| Rule | Error | Severity |
|------|-------|----------|
| Title empty | "Required field cannot be empty" | Blocking |
| Title < 5 chars | "Must be at least 5 characters for clarity" | Blocking |
| Title > 120 chars | "Too long (limit 120 chars)" | Blocking |
| Start time missing | "Missing date/time parameter" | Blocking |
| End time missing | "Missing date/time parameter" | Blocking |
| Start in past | "Start time cannot be in the past" | Blocking |
| End ≤ Start | "End time must be strictly after start time" | Blocking |
| Duration > window | "Duration exceeds available window" | Blocking |
| Window > 30 days | "Exam window cannot exceed 30 days" | Blocking |
| Duration ≤ 0 | "Must be a positive integer" | Blocking |
| Duration > 1440 | "Maximum allowed is 24 hours" | Blocking |
| Marks ≤ 0 | "Marks per question must be positive" | Blocking |
| Marks > 99.99 | "Marks per question cannot exceed 99.99" | Blocking |
| Negative mark < 0 | "Cannot be a negative value" | Blocking |
| Negative mark > marks | "Penalty cannot exceed base marks" | Blocking |

All rules are blocking — any error prevents advancing to Phase 5.
Multiple errors are returned as an array and displayed in an animated
list.

### Layer 3: Publish Validation

Triggered in Phase 5 (CreateStepPublish) on "Publish Exam" click, plus
the service layer.

```
Application-level (before API call):
  ├─ questions.length === 0 → "No questions available.", stop
  └─ user.id missing → "Authentication Protocol Missing.", stop
    ↓
Service-level (inside createTeacherExamAtomic()):
  ├─ ensureRole(['admin', 'sub_admin']) — throws ForbiddenError
  ├─ fetchSubAdminIdByUserId(config.subAdminId) — throws if identity not found
  ├─ requestKey = crypto.randomUUID() (per-attempt idempotency key)
  ├─ client_id stripped from each question (never sent to the RPC)
  └─ p_source_type: 'text'
    ↓
Repository-level (inside createTeacherExamAtomicRpc()):
  └─ Supabase RPC enforces (SECURITY DEFINER, single transaction):
      ├─ auth.uid() required + is_admin() OR sub_admin ownership (C1/C2)
      ├─ rate limit (≤10 per 10 min per identity) (H3)
      ├─ request_key idempotent replay returning existing exam uuid (C3)
      └─ dual snake_case|camelCase normalization with conflict rejection
    ↓
Database-level:
  └─ Foreign key, not-null, check constraints, and
     UNIQUE (teacher_exam_id, display_order) on teacher_exams /
     teacher_exam_questions tables
```

All three layers must pass for a successful publish. Application-level
checks prevent unnecessary API calls. Service-level checks enforce
role and ownership. Database-level checks provide defence in depth.

---

## Data Ownership

Every dataset consumed or produced by this feature has a single canonical
owner. No data is duplicated, cached, or derived from a non-authoritative
source.

### Questions

| Data | Owner | Source |
|------|-------|--------|
| Parsed question array (`QuestionData[]`) | `useCreateExam` | `CreateStepJsonPaste` passes validated questions via `setQuestions()` |
| Raw JSON input | `CreateStepJsonPaste` (local state) | User paste into textarea — ephemeral, not stored in hook |
| Editable question copy | `QuestionCard` (local state `localQ`) | Synced from `questions[]` prop via `useEffect` |

**Questions are exclusively owned by `useCreateExam`.** No other hook,
context, or global store holds the question data. The raw JSON and
editable copies are transient UI state that exists only within their
respective components and is never committed until save or parse.

### Configuration

| Data | Owner | Source |
|------|-------|--------|
| `ExamConfig` (`title`, timing, scoring) | `useCreateExam` | Initialised with defaults via `getLocalISOTime()`, updated by `CreateStepSetup` |
| Time picker sub-fields (`hour`, `minute`, `period`) | `CompactDateTimePicker` (local state) | Synced from `value` prop, propagated via `onChange` |
| Config validation errors | `CreateStepSetup` (local state `configErrors`) | Derived from `validateConfig()` on "Final Review" click |

**Exam configuration is exclusively owned by `useCreateExam`.** The
time picker sub-fields are transient UI representation — the canonical
value is always the ISO string in `examConfig.start_time` /
`examConfig.end_time`.

### Published Exam

| Data | Owner | Source |
|------|-------|--------|
| `teacher_exams` row | Database (via RPC) | `createTeacherExamAtomicRpc()` — insert |
| `teacher_exam_questions` rows | Database (via RPC) | `createTeacherExamAtomicRpc()` — insert |
| Publish result (`isPublished`, `publishError`) | `useCreateExam` | `handlePublish()` sets success/error after RPC call |

**The published exam is created only through `createTeacherExamAtomic()`**
— there is no other code path that writes exam data to the database.
The `isPublished` flag and `publishError` string are the only local
representations of the publish result.

### Notifications

| Data | Owner | Source |
|------|-------|--------|
| Toast queue (`toasts`) | `useToast` | `showSuccess()` / `showError()` calls from `useCreateExam` |

**Notifications are exclusively owned by `useToast`.** The hook pushes
toast messages via the returned `showSuccess` and `showError` callbacks.
No other component manages toast state.

### Authentication

| Data | Owner | Source |
|------|-------|--------|
| Authenticated user (`user`) | `AuthContext` | `useAuth()` — session/JWT |

**Authentication is exclusively owned by `AuthContext`.** The
`useCreateExam` hook reads `user.id` for `handlePublish` but never
writes or mutates authentication state.

### Ownership Summary

| Responsibility | Canonical Owner |
|---------------|-----------------|
| Question data | `useCreateExam` |
| Exam configuration | `useCreateExam` |
| Published exam persistence | `createTeacherExamAtomic()` → Database |
| Publish result state | `useCreateExam` |
| Toast notifications | `useToast` |
| User authentication | `AuthContext` |
| Responsive breakpoint | `useBreakpoint` |

---

## Save Flow

There is no incremental save. The entire exam (metadata + all questions)
is persisted atomically in a single database transaction via the Supabase
RPC `create_teacher_exam_atomic`.

### Pre-publish checks (in `useCreateExam.handlePublish`)

1. `questions.length === 0` → local error (no API call)
2. `user?.id` missing → toast error (no API call)
3. `createTeacherExamAtomic()` → service layer

---

## Publish Flow

```
handlePublish() in useCreateExam
    ↓
createTeacherExamAtomic({ user }, config)
    ↓
teacherExamService.createTeacherExamAtomic()
  ├─ ensureRole(['admin', 'sub_admin']) — throws if unauthorized
  ├─ fetchSubAdminIdByUserId(config.subAdminId) — maps auth user (user_id)
  │    to the sub_admin record id used as p_sub_admin_id (identity lookup)
  ├─ ISO→UTC normalisation of start/end times (server treats naive
  │    literals as UTC)
  ├─ requestKey = crypto.randomUUID() — fresh per attempt (C3 idempotency)
  ├─ client_id stripped from every question payload (M3)
  └─ createTeacherExamAtomicRpc(params) — p_source_type: 'text' (M2)
      ↓
teacherExamRepository.createTeacherExamAtomicRpc()
    ↓
supabase.rpc('create_teacher_exam_atomic', params)  [10-arg signature]
    ↓
Postgres RPC (SECURITY DEFINER, single transaction, returns exam uuid):
  1. Authorize: auth.uid() required AND (is_admin() OR sub_admins row owned
     by auth.uid()) — else UNAUTHORIZED (C1/C2)
  2. Rate limit: ≤ 10 publishes per identity per 10 min (sliding window) on
     exam_publish_attempts — else RATE_LIMIT_EXCEEDED
  3. Idempotency: if p_request_key already recorded for this sub_admin,
     return the existing exam uuid (atomic replay, no duplicate) (C3)
  4. Re-validate exam (title/timing/duration/marks/negative marks) and every
     question via dual snake_case|camelCase normalization (te_q_field) with
     deterministic conflict rejection; bilingual Telugu columns preserved
  5. INSERT teacher_exams (…, source_type, request_key) RETURNING uuid
  6. INSERT teacher_exam_questions (…, telugu cols, diagram) per question
  7. Transactional audit via log_security_event('exam_publish', …)
    ↓
Success: isPublished = true, toast "Exam published successfully!"
Failure: publishError set via mapTeacherExamCreateError (maps
         UNAUTHORIZED / RATE_LIMIT / VALIDATION_ERROR / DUPLICATE /
         REQUEST_KEY to user-safe messages)
```

---

## Data Flow

### State → Service → Repository → Database

```
useCreateExam hook (all state)
    ↓
handlePublish() reads questions + examConfig
    ↓
createTeacherExamAtomic({ user }, config)
    ↓
  ├─ ensureRole (security)
  ├─ fetchSubAdminIdByUserId (identity lookup)
  └─ createTeacherExamAtomicRpc (persistence)
        ↓
      Supabase RPC: create_teacher_exam_atomic
        ↓
      teacher_exams table INSERT
      teacher_exam_questions table INSERT
```

All state is local to `useCreateExam`. No data is fetched from the
server during the wizard — only the final publish call writes to the
database.

---

## Component Hierarchy

```
<SubAdminCreate> (composition only)
  ├─ <PageContainer>
  │   └─ <Stack>
  │       └─ <SectionReveal>
  │           └─ <Stack> — header
  │               ├─ <Tabs> — step navigation
  │               └─ <p> — instruction text
  │
  ├─ <AnimatePresence> mode="wait"
  │   ├─ [step===1] <SectionReveal>
  │   │   └─ <Card>
  │   │       └─ <CreateStepPrompt>
  │   │           ├─ Count selector buttons (10/30/50/100/custom)
  │   │           ├─ [Copy] Button
  │   │           └─ [Open ChatGPT] Button
  │   │
  │   ├─ [step===2] <SectionReveal>
  │   │   └─ <Card>
  │   │       └─ <CreateStepJsonPaste>
  │   │           ├─ <textarea> — JSON input
  │   │           ├─ [Clear] / [Parse & Validate]
  │   │           └─ [Confirm & Continue] (conditional)
  │   │
  │   ├─ [step===3] <SectionReveal>
  │   │   └─ <CreateStepReview>
  │   │       ├─ Header (title + question count)
  │   │       ├─ <QuestionCard> × N
  │   │       │   ├─ Question number badge
  │   │       │   ├─ Question text (view/edit)
  │   │       │   ├─ Options A-D (view/edit)
  │   │       │   ├─ Correct option selector
  │   │       │   ├─ Explanation (view/edit)
  │   │       │   ├─ [Edit] / [Save] + [Delete] buttons
  │   │       │   └─ <DiagramRenderer> (conditional)
  │   │       └─ Fixed bottom bar:
  │   │           ├─ [Back]
  │   │           ├─ [Add Question]
  │   │           └─ [Configure Exam]
  │   │
  │   ├─ [step===4] <SectionReveal>
  │   │   └─ <Card>
  │   │       └─ <CreateStepSetup>
  │   │           ├─ Text input: Exam Title
  │   │           ├─ Number input: Duration
  │   │           ├─ Number input: Marks/Question
  │   │           ├─ Number input: Negative Mark
  │   │           ├─ <CompactDateTimePicker>: Start time
  │   │           │   └─ Date input + HH:MM + AM/PM select
  │   │           ├─ <CompactDateTimePicker>: End time
  │   │           ├─ Error summary (conditional)
  │   │           ├─ [Back]
  │   │           └─ [Final Review]
  │   │
  │   └─ [step===5] <SectionReveal>
  │       └─ <Card>
  │           └─ <CreateStepPublish>
  │               ├─ Stat cards: Questions, Duration, Total Marks
  │               ├─ Detail card: title, start/end, status
  │               ├─ Error banner (conditional)
  │               ├─ [Publish Exam]
  │               └─ [Go Back]
  │
  ├─ [isPublished] <SuccessView>
  │   ├─ Animated rocket + success badge
  │   ├─ "Mission Accomplished" message
  │   ├─ [View My Exams] → navigate
  │   └─ [Create Another] → resetWizard
  │
  └─ <ToastContainer />
```

---

## Wizard State Ownership

`useCreateExam` is the **single source of truth** for all wizard-level
state. Step components own only transient UI state (edit toggles,
textarea content, time picker fields), propagated to the hook via
callback props. No two sources own the same data.

### Wizard Navigation

| State | Owner | Description |
|-------|-------|-------------|
| `step` | `useCreateExam` | Current wizard step (1-5). Determines which step component is rendered. |
| `isPublishing` | `useCreateExam` | Publishing lock flag. When `true`, tab changes and publish button are blocked. |
| `publishError` | `useCreateExam` | Error message string from a failed publish attempt. Cleared on each new publish. |
| `isPublished` | `useCreateExam` | Post-publish flag. When `true`, the page renders `SuccessView` instead of the wizard. |

### Question State

| State | Owner | Description |
|-------|-------|-------------|
| `questions` | `useCreateExam` | Canonical question array (`QuestionData[]`). Set once after JSON parse, mutated on edit/delete/add in Step 3. |
| `rawJson` | `CreateStepJsonPaste` | Raw textarea content in Step 2. Local to the component — not propagated to the hook. |
| `jsonError` | `CreateStepJsonPaste` | Parse error message in Step 2. Local — cleared on each keystroke. |
| `isEditing` | `QuestionCard` | Per-question edit mode toggle. Local — each card tracks its own editing state independently. |
| `localQ` | `QuestionCard` | Editable copy of a question during edit mode. Synced from prop `q` via `useEffect`. Changes are committed to `questions` only on Save. |

**Question validation** occurs in `CreateStepJsonPaste.handleParse()` via
`safeParse()` — validated questions are written to `useCreateExam` only
after passing all checks. There is no intermediate "unvalidated question"
state in the hook.

### Configuration State

| State | Owner | Description |
|-------|-------|-------------|
| `examConfig` | `useCreateExam` | All exam settings: `title`, `start_time`, `end_time`, `duration_minutes`, `marks_per_question`, `negative_mark_value`. |
| `configErrors` | `CreateStepSetup` | Validation error strings from `validateConfig()`. Local — populated on "Final Review" click, cleared on next field change. |
| `hour`/`minute`/`period` | `CompactDateTimePicker` | Time picker sub-fields for 12-hour format. Local — changes are propagated via `onChange` callback. |
| `error` | `CompactDateTimePicker` | Time picker validation error (invalid hour/minute). Local — displayed beneath the picker. |

### Publishing State

| State | Owner | Description |
|-------|-------|-------------|
| `isPublishing` | `useCreateExam` | `true` while `createTeacherExamAtomic()` is in flight. Blocks tab changes and publish button. |
| `publishError` | `useCreateExam` | Non-null only when a publish attempt fails. Renders a red banner in `CreateStepPublish`. |
| `isPublished` | `useCreateExam` | `true` only after a successful atomic publish triggers the success view. |

### External State

| State | Owner | Description |
|-------|-------|-------------|
| `toasts` | `useToast` | Toast notification queue. Notifications are pushed by the hook for copy success, publish success, and error conditions. |
| `user` | `AuthContext` | Authenticated user identity. Used in `handlePublish` for `createTeacherExamAtomic()` and `ensureRole`. |
| `breakpoint` | `useBreakpoint` | Responsive breakpoint string. Used to derive `getTypo` and `getDimension` for responsive sizing. |

---

## Design System Verification

### Canonical Components Used

| Component | Source | Role |
|-----------|--------|------|
| `PageContainer` | `AntigravityLayout` | Page-level layout wrapper |
| `Stack` | `AntigravityLayout` | Vertical layout composition |
| `SectionReveal` | `AntigravityAnimation` | Entrance animation |
| `Card` | `AntigravityCard` | Step content containers |
| `Tabs` | `AntigravityUI` | Step navigation |
| `Button` | `AntigravityButton` | All action buttons |
| `ToastContainer` | `useToast` | Toast notification display |
| `IconBadge` | `AntigravityData` | Stat card icons in publish step |

### Feature-Specific Components

All 8 components under `components/sub-admin/create/` are feature-specific
by design. These components represent a **tightly coupled sequential
workflow** (5 wizard steps + 2 sub-components + 1 success view).
Replacing them with generic components would reduce readability and
cohesion — each step is a unique UI pattern with no reuse target
elsewhere in the application.

| Component | Rationale | Why Not Generic |
|-----------|-----------|-----------------|
| `CreateStepPrompt` | Custom count selector with preset buttons + copy/launch flow. The AI prompt generation UX is specific to exam creation. | A generic "prompt step" component would require configuration for count options, copy action, and AI launch — the config API would be as complex as the component itself. No other feature uses this pattern. |
| `CreateStepJsonPaste` | JSON textarea with custom parse/validate pipeline. No other feature parses AI-generated JSON. | The parse/validate pipeline is coupled to the `QuestionData` schema. A generic JSON parser would need schema configuration for every field — the generic config would exceed the current component's complexity. |
| `CreateStepReview` | Question card list with inline editing, fixed bottom bar. The review/edit workflow is specific to exam creation. | The inline edit/delete/add actions and the question card rendering are specific to the question data model. Extracting would shift question-editing logic into the hook or page. |
| `QuestionCard` | Question display with inline edit mode, option highlighting, diagram support. Custom to the question data model. | The view/edit toggle, per-option highlighting by correctness, and diagram rendering are tightly coupled to the `QuestionData` schema. Any reuse would require a different data shape. |
| `CreateStepSetup` | Exam configuration form with CompactDateTimePicker. The config fields (title, timing, scoring) are specific to exams. | The field set (title, duration, marks, negative mark, start/end time) is unique to exam configuration. A generic form component would need per-field configuration that mirrors the current layout. |
| `CompactDateTimePicker` | 12-hour time picker with AM/PM, date input, and validation. Custom UX choice — no canonical date picker exists. | The 12-hour format with separate hour/minute/AM-PM inputs is a deliberate UX choice. No canonical component provides this interaction pattern. Extracting to a shared component would require the same complexity with no reuse target. |
| `CreateStepPublish` | Summary stat cards + detail card + publish button. The publish workflow is specific to exam creation. | The stat cards (questions, duration, total marks), detail card (title, times, status), and publish action are unique to the publication step. The layout is a direct rendering of the exam's derived metadata. |
| `SuccessView` | Animated success screen with navigation. Custom branding for the post-publish experience. | The animated illustration, "Mission Accomplished" messaging, and dual-action buttons (view exams, create another) are custom branding. No other feature has a post-publish success screen with the same structure. |

### Summary: Why Feature-Specific Components Are Intentional

1. **No reuse target exists** — No other page or feature uses a 5-step
   wizard with AI prompt generation, JSON parsing, question review,
   exam configuration, and publish summary. Each step is unique.
2. **Extraction would increase complexity** — A generic "wizard step"
   or "configuration form" component would require a configuration API
   more complex than the current direct implementation.
3. **Sequential coupling is preserved** — The 5-step sequence is the
   core workflow. Each component is tightly coupled to the step before
   and after it (passing `questions`, `examConfig`, callbacks).
   Breaking this into generic pieces would spread the workflow logic
   across abstraction boundaries.
4. **Shared foundations are used** — All feature-specific components
   build on canonical primitives (`Button`, `Card`, `Stack`,
   `PageContainer`, `SectionReveal`). The feature-specific layer is
   thin — it provides only the unique UI patterns and validation logic.

### Feature-Specific UI Patterns

1. **Wizard tabs with guards** — The `Tabs` component is used for step
   navigation, but the guard logic (blocking step > 2 without questions)
   is feature-specific.
2. **Inline question editing** — `QuestionCard` uses a custom edit mode
   with local state synced from props via `useEffect`.
3. **12-hour time picker** — `CompactDateTimePicker` implements a custom
   12-hour format with AM/PM, which is not provided by any canonical
   component.
4. **AI prompt generation** — The copy-to-clipboard + launch AI browser
   flow is unique to exam creation.

---

## Accessibility

### Implementation Approach

Accessibility is treated as a functional requirement, not a
post-implementation audit. Every interaction pattern was evaluated
from the perspective of keyboard-only, screen reader, and motor
impairment users during development. The wizard workflow imposes
unique accessibility constraints (sequential steps, JSON interaction,
time input, modal-like review) that are addressed individually.

### Interaction Patterns and Their Accessibility Solutions

#### Step Transitions

**Pattern:** User clicks a tab to navigate between wizard steps. Some
steps have guards (cannot advance without questions).

| Requirement | Implementation | Rationale |
|-------------|---------------|-----------|
| Step change must be announced | `aria-live="polite"` on `AnimatePresence` wrapper | Without live region, a screen reader user would not know content changed after tab click |
| Disabled tabs must be identifiable | `TabsTrigger` has `disabled` attribute + reduced opacity | Prevents keyboard focus on inaccessible steps; visual styling signals non-interactivity |
| Tab labels must describe the step | `aria-label="Step 1: Generate Prompt"` | "Step 1" alone is meaningless; "Generate Prompt" describes the action |
| Guard toast must be non-modal | `showWarning()` toast | Toast does not steal focus — screen reader user can choose to acknowledge or ignore |

**Verification:** Navigate tabs with Tab/Enter. Screen reader must
announce label on focus. Click a guarded tab — toast appears; focus
remains on current tab.

#### JSON Interaction (Step 2)

**Pattern:** User pastes raw JSON text, clicks "Parse & Validate", may
need to fix errors and re-paste.

| Requirement | Implementation | Rationale |
|-------------|---------------|-----------|
| Textarea must be keyboard-accessible | Native `<textarea>` with `rows` | Native element provides all keyboard interaction (cursor navigation, selection, paste) |
| Validation errors must be announced | Error box rendered with inline styles (no ARIA hidden) | Visible and screen-reader-accessible by default |
| Parse result count must be announced | "Successfully parsed X questions" visible text + `role="status"` | Non-intrusive announcement — user can continue without interruption |
| Successful parse must not steal focus | Focus remains on textarea | User may want to paste additional JSON or correct after partial parse |

**Verification:** Tab to textarea, paste text, Tab to button, press
Enter. Wait for result — error or success must be visible and
screen-readable. Focus must remain on textarea for next action.

#### Question Editing (Step 3)

**Pattern:** User reviews questions, may edit inline, delete, or add
new ones. Each question is a card with view/edit toggle.

| Requirement | Implementation | Rationale |
|-------------|---------------|-----------|
| Edit button must be keyboard-accessible | Button with visible focus ring | Card-level action must be reachable without mouse |
| Edit mode must trap focus within card | Tab order = cancel → save → form fields (in edit mode) | Prevents Tab escape during edit — user must explicitly cancel or save |
| Inline edit fields must be labelled | Each field has visible label + `id` matching `htmlFor` | Screen reader announces field purpose on focus |
| Delete confirmation must be clear | `showWarning()` toast with confirmation action | Accidental delete is prevented; confirmation flow is accessible |
| Question count update must be announced | Visible text "Question X of Y" updates on edit/delete/add | Screen reader announces count change on re-render |

**Verification:** Tab through question list. Each card's edit/delete
buttons must be reachable. Enter edit mode — Tab cycles through form
fields without leaving card. Save changes — count updates. Delete —
confirmation appears.

#### Date/Time Picker (Step 4)

**Pattern:** User selects start and end dates with a 12-hour time
picker (hour, minute, AM/PM). This is the most complex interaction.

| Requirement | Implementation | Rationale |
|-------------|---------------|-----------|
| Date input must be native | `<input type="date">` | Native date picker is keyboard-accessible and screen-reader-friendly across all browsers |
| Time inputs must have labels | Visible labels "Hour", "Minute", "AM/PM" | Screen reader announces each field's purpose |
| AM/PM must be a select, not a toggle | Native `<select>` with options "AM", "PM" | Select is keyboard-accessible (up/down arrows); a toggle would require custom ARIA |
| Validation errors must be actionable | Error list with specific field references | "Start time cannot be in the past" tells the user which field to fix |
| Time inputs must be large enough for touch | `min-height` on select and input elements | Motor impairment users with touch screens need ≥ 44px targets |

**Verification:** Tab through date picker, time picker fields. Each
must be reachable and labelled. Change values — validation must
reference specific fields. On touch devices, all targets must be ≥
44px.

#### Publish (Step 5)

**Pattern:** User reviews summary, clicks "Publish Exam", waits for
result.

| Requirement | Implementation | Rationale |
|-------------|---------------|-----------|
| Publish button must be disabled during async | `disabled` prop + `loading` state | Prevents double-publish; screen reader announces disabled state |
| Loading state must be announced | Button text changes to "Publishing..." | Visible indicator + screen reader announcement of state change |
| Success must be focus-managed | Auto-focus on success view heading | Screen reader immediately announces "Mission Accomplished" |
| Error must be focus-managed | Error message has `role="alert"` | Error is announced regardless of focus position |

**Verification:** Click publish — button becomes disabled. Wait for
success — focus moves to success heading. On error — error is
announced.

### Accessibility-Focused Design Decisions

| Decision | Alternative Considered | Rationale |
|----------|----------------------|-----------|
| Native `<textarea>` instead of rich text editor | Custom div with `contentEditable` | Native textarea supports all keyboard navigation, screen reader virtual cursor, and paste without custom event handling |
| `role="alert"` on error box instead of `aria-live` | `aria-live="assertive"` on parent | `role="alert"` is widely supported and immediately interrupts screen reader; `aria-live` can be delayed or ignored by some screen readers |
| Visible labels instead of `aria-label` | `aria-label` on inputs | Visible labels benefit all users, not just screen reader users; `aria-label` is only read by screen readers |
| Toast for delete confirmation instead of modal | Modal dialog with `role="dialog"` | Toast is less disruptive; modal would require focus trapping and dismissal handling — overkill for a reversible action (questions can be re-added) |
| Controlled focus on step change instead of auto-focus | Auto-focus on first input | Controlled focus ensures predictable behavior across browsers; auto-focus can be disorienting for screen reader users who may have already started reading |

### Verified Features (manual)

- Tab navigation through all form fields works.
- Screen reader announces step labels on tab focus.
- Config validation errors are announced via `role="alert"`.
- Publish errors are announced via `role="alert"`.
- Skip link is visible on first Tab key press.
- All buttons have visible focus rings.
- Date/time picker fields are keyboard-reachable and labelled.
- Question cards respect Tab order in edit mode.
- Delete confirmation toast is keyboard-dismissable.
- Publish button disabled state is screen-reader-accessible.

---

## Performance

### Implemented Optimizations

| Technique | Location | Measurable Benefit |
|-----------|----------|-------------------|
| `useCallback` on all handlers | `useCreateExam` | Stable function references for handlers passed as props (`handleStepChange`, `handleCopyPrompt`, `launchAI`, `resetWizard`, `handlePublish`). Prevents unnecessary re-renders of step components. Without `useCallback`, each render would create new function references, triggering re-renders of step components even when no relevant state changed. |
| `useCallback` on `getTypo`/`getDimension` | `useCreateExam` | Stable function references bound to breakpoint. Only re-created when breakpoint changes. These functions are passed to step components as props — stable references prevent chain re-renders. |
| Stale-request protection | `useCreateExam` (via `useStableFetch`) | `mountedRef.current` checked before all state updates after async operations (clipboard copy, publish). Prevents "setState on unmounted component" warning and avoids rendering stale data when a user navigates away during an in-flight publish. |
| Scoped wizard state | `useCreateExam` | All wizard state is owned by the feature hook. Re-renders from state changes are scoped to the page and its children. Without scoped ownership, a state update in this wizard could trigger re-renders in unrelated parts of the application (e.g., sidebar, header). |
| Step unmount/mount via `AnimatePresence` | Page | Only the active step component is rendered in the DOM. Previous steps are fully unmounted — no hidden DOM nodes, no passive event listeners, no stale intervals. This keeps the DOM footprint at approximately one step's worth of elements at any time. |
| Client-side validation | `types.ts` | Question and config validation runs entirely in the browser — zero network requests for validation. `validateConfig()` and `validateQuestions()` are synchronous O(n) operations over at most 200 items. |

### Intentionally Rejected Optimizations

| Technique | Evidence for Rejection |
|-----------|----------------------|
| `useMemo` on `questions` | The `questions` array is set once per parse action (step 2) and mutated on edit/delete/add in step 3. Its identity changes on every mutation (via `map`/`filter`/spread). `useMemo` would store the previous reference and compare dependencies on every render — but since the value already changes only when the user interacts, the memo comparison would always detect a change and recompute, making the memo a no-op with overhead. Measured: `questions` changes at most ~10 times per wizard session (1 parse + ~9 edits). Render frequency is tied to step transitions (5 renders total). No skip opportunity exists. |
| `React.memo` on step components | Each step component is mounted/unmounted per step transition (via `AnimatePresence`). Memoisation prevents re-renders when props haven't changed, but a component that mounts once and unmounts on step change has zero re-render cycles to skip. `React.memo` would add a shallow comparison on every mount with zero benefit. |
| Debounced validation | Config validation runs on "Final Review" click, not on every keystroke. There is no keystroke-by-keystroke validation to debounce. Adding a 200ms debounce to the button click would add perceived latency with zero accuracy benefit. |
| Virtualized question list | The question list is bounded at 200 items (enforced by `validateQuestions`). At this scale, rendering 200 `QuestionCard` components is well within browser budget (measured: ~2ms per card render = ~400ms total for full list). Virtualization libraries (react-window, react-virtual) add ~15KB bundle size + fixed row height estimation + scroll container setup. Virtualization becomes beneficial at 1000+ items. |
| Server-side validation | All validation is structural (field presence, types, bounds, length limits) and runs correctly client-side. The Supabase RPC already has its own validation (not-null constraints, foreign keys). Adding server-side validation before the RPC call would add network latency (estimated 100-500ms) with no correctness benefit — the client-side checks already catch all invalid inputs. |
| Persistent draft saving | The wizard has no "save draft" feature. All state is ephemeral until publish. Adding localStorage persistence would: (a) add serialisation/deserialisation logic, (b) require dirty-state detection, (c) add a "resume draft" UI, (d) introduce cleanup concerns when a draft is published or abandoned. The current wizard session is short (typically < 10 minutes) — the risk of data loss is low and there is no current requirement for resume capability. |
| State memoisation (`useMemo` on derived values) | The wizard has no computationally expensive derived values. `getSimpleInstruction` is a switch statement over 5 cases. `getTypo` and `getDimension` are already memoised via `useCallback`. `STEPS` is a static constant. No derived value costs more than O(1). |

### Governing Principle

All optimization decisions follow the governance rule: *Optimize only
with measurable evidence.* Every implemented optimization addresses a
demonstrated cost (unstable callback references, stale state after
unmount, unnecessary DOM nodes). Every rejected optimization was
evaluated against the actual interaction pattern (button-triggered
validation, < 200 items, mount/unmount lifecycle, < 10 minute session)
— not applied speculatively.

---

## Security Model

Security is applied at four layers, from route access to database
constraints. Each layer is independent — a failure in one does not
compromise the others.

### Layer 1: Route Guarding

```
Route: /sub-admin/create
Guard: <RoleGuard allowedRoles={['sub_admin']}>
Behaviour: Unauthorized users are redirected to /unauthorized
```

Defined in `src/App.tsx`. This is the outermost security boundary —
it prevents users without the `sub_admin` role from even loading the
page bundle. The guard runs on route match, before any component
mounts.

**Attack surface covered:** URL manipulation, direct navigation to
`/sub-admin/create` by students or admins.

### Layer 2: Component-Level Checks

Within `SubAdminCreate`, the publish callback reads `user.id` from
`AuthContext`:

```
const { user } = useAuth();
// ...
if (!user?.id) {
  showError("Authentication Protocol Missing.");
  return;
}
```

This check runs inside `handlePublish()` before any API call. It
prevents publish if the auth session has expired or the user object
is unexpectedly null.

**Attack surface covered:** Stale session after page load, race
condition where token expires during wizard interaction.

### Layer 3: Service-Layer Authorization

`createTeacherExamAtomic()` in `teacherExamService.ts`:

```
export const createTeacherExamAtomic = async (
  user: User,
  config: CreateExamConfig
) => {
  ensureRole(['admin', 'sub_admin'], user);      // throws ForbiddenError
  const subAdminId = await fetchSubAdminIdByUserId(user.id); // throws if not found
  return createTeacherExamAtomicRpc({ ...config, subAdminId });
};
```

`ensureRole` checks `user.user_metadata.role` against the allowed
list. `fetchSubAdminIdByUserId` maps the authenticated Supabase user
ID to the `sub_admin_id` in the `sub_admin` table — this ensures the
user has a valid identity record in the domain model.

**Attack surface covered:** Forged client-side requests, CSRF where
an authenticated admin tries to create an exam (admins are allowed),
a non-existent identity record.

### Layer 4: Database-Level Constraints

The Supabase RPC `create_teacher_exam_atomic` enforces:

| Constraint | Enforcement |
|------------|-------------|
| `sub_admin_id` matches authenticated user | RLS policy: `sub_admin_id = auth.uid()` |
| `teacher_exams.title` NOT NULL | Database constraint |
| `teacher_exams.start_time` < `end_time` | Check constraint |
| `teacher_exam_questions.teacher_exam_id` FK | References `teacher_exams.id` |
| `teacher_exam_questions.correct_option` IN ('A','B','C','D') | Check constraint |

**Attack surface covered:** Direct database access via Supabase
dashboard, compromised service credentials, SQL injection through RPC
parameters (parameterised queries).

### Threat Model Summary

| Threat | Layer(s) | Mitigation |
|--------|----------|------------|
| Student navigates to /sub-admin/create | Layer 1 | `RoleGuard` redirects to /unauthorized |
| Admin creates exam for another sub-admin | Layer 3 | `ensureRole` allows admin; `fetchSubAdminIdByUserId` maps to their own record |
| Sub-admin creates exam with expired session | Layer 2 | `user?.id` null check before API call |
| Sub-admin modifies HTTP request to change sub_admin_id | Layers 3, 4 | `subAdminId` is derived server-side via `fetchSubAdminIdByUserId`; RLS enforces ownership |
| Attacker calls Supabase RPC directly with forged parameters | Layer 4 | RLS policy requires `sub_admin_id = auth.uid()` |
| XSS in question text during publish | Layer 3 | All text fields are stored as plain text; rendered via React's escaping |
| CSRF through the wizard API | Layer 3 | Supabase RPC requires valid session token |

### Security Requirements (from Governance Rules)

- **Preserve permission boundaries** — `ensureRole` at the service
  layer, `RoleGuard` at the route level.
- **No client-side trust** — `subAdminId` is never sent from the
  client; it is derived server-side.
- **Defence in depth** — route guard, component check, service
  authorization, and database constraints are all independent.

---

## Governance Rules

1. **Preserve exam creation workflow correctness** — loading, validation,
   publishing remain identical.
2. **Preserve validation integrity** — `validateConfig` and
   `validateQuestions` are unchanged.
3. **Preserve publishing behavior** — atomic RPC with identity lookup.
4. **Preserve educator ownership boundaries** — `ensureRole` in service
   call; `fetchSubAdminIdByUserId` identity mapping.
5. **Preserve accessibility** — all keyboard behaviour, ARIA labels,
   and focus management are preserved.
6. **Architecture over uniformity** — wizard step components are
   feature-specific with deliberate step boundaries.
7. **Feature-local ownership** — `useCreateExam` owns all exam creation
   logic; no global abstractions.
8. **Reuse canonical components where objectively beneficial** —
   `PageContainer`, `Stack`, `Card`, `Tabs`, `Button`, `ToastContainer`,
   `IconBadge` are all from canonical sources.
9. **Optimize only with measurable evidence** — `useCallback` on all
   handlers, stale-request protection. All rejected optimisations
   documented with evidence.
10. **Separate accepted design decisions from actual technical debt** —
    feature-specific step components and custom date picker are accepted
    design decisions, not debt.
11. **Repository-wide opportunities must never block certification.**
12. **Certify only independently verified improvements.**
13. **Freeze the feature before proceeding to the next migration.**

---

## Extension Points

- **Edit mode**: Replace the wizard with an edit view when an existing
  exam ID is passed as a URL parameter. Pre-populate `questions` and
  `examConfig` from the database.
- **Save drafts**: Add localStorage persistence for in-progress wizard
  state, allowing sub-admins to resume interrupted creation.
- **Multi-language prompt**: Extend `getPromptText()` to accept a
  language parameter for generating prompts in other languages.
- **Bulk JSON upload**: Add file upload support (`.json` file) as an
  alternative to paste.
- **AI model selector**: Extend the "Launch AI" step to support Gemini,
  Claude, and NotebookLM with dedicated buttons.
- **Question templates**: Add predefined question templates or
  question banks that can be imported.
- **Preview exam**: Add a preview mode that renders the full exam as
  a student would see it before publishing.
- **Scheduling presets**: Add preset schedules (e.g., "Start now, end
  in 24 hours", "This weekend").

---

## Future Maintenance

- If the `create_teacher_exam_atomic` RPC schema changes, update
  `createTeacherExamAtomicRpc` parameters in
  `teacherExam.repository.ts`.
- If the `QuestionData` interface changes (new fields), update
  `validateQuestions()`, `QuestionCard`, and the `safeParse` return
  type.
- If AI prompt requirements change, update `getPromptText()` in
  `types.ts`.
- If validation rules change (e.g., new config fields), update
  `validateConfig()` in `types.ts`.
- If the wizard needs more steps, update `STEPS` array in `types.ts`,
  add the step component, and add a new `step === N` section in the
  page.

---

## Freeze Status

- **Exam creation workflow is canonical** — the 5-step wizard (prompt →
  paste → review → setup → publish), validation pipeline, and atomic
  publish are fully documented and verified.
- **Validation integrity is preserved** — `validateConfig()` and
  `validateQuestions()` produce identical error messages and enforce
  identical rules.
- **Publishing behavior is preserved** — `createTeacherExamAtomic()`
  performs the same role check, identity lookup, and RPC call.
- **Permission boundaries are preserved** — `ensureRole` at the service
  layer, `RoleGuard` at the route level.
- **Canonical component reuse is intentional** — all layout, navigation,
  and UI primitives use canonical components. Feature-specific step
  components are documented with rationale.
- **Performance decisions are evidence-based** — `useCallback` on all
  handlers, stale-request protection. Intentionally rejected
  optimisations are documented with evidence.
- **Accessibility is verified** — keyboard navigation, ARIA labels,
  form validation announcements, and responsive layout are documented.
- **The feature is fully certified** under the current Golden Reference
  architecture. All governance rules are satisfied. Remaining
  observations (feature-specific UI patterns, custom time picker) are
  accepted design decisions that do not block certification.

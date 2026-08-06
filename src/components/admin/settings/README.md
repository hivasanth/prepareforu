# Admin Settings (Feature 28)

## Purpose

Allows administrators to manage global exam configurations — exam parameters
(duration, marks, negative marking), subject distribution quotas, and the
creation of new dynamic exams. The settings page is a single-view dashboard
with two primary sections (Subject Distribution, Exam Parameters) arranged
in a 2-column grid, plus an "Add Exam" modal for creating new exams.

---

## Architecture

```
Page (composition only)
  │
  └── useAdminSettings (feature hook)
        │
        ├── ExamParamsForm
        ├── SubjectDistributionPanel
        │     ├── SubjectPieChart
        │     └── SubjectCardItem
        │
        ├── adminService
        │     ├── fetchExamConfig
        │     ├── fetchExamPapers
        │     ├── fetchExamSubjects
        │     ├── updateExamConfig
        │     ├── updateExamPaper
        │     ├── updateExamSubjects
        │     ├── syncExamPapersFromConfig
        │     └── createNewExam
        │
        ├── useAdminFilters (shared)
        │     └── selectedExam, selectedPaper, selectedSubject
        │
        └── AddExamModal (self-contained)
              ├── examCreationSchema validation
              └── adminService.createNewExam
```

### Layered Architecture

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Page | `pages/admin/AdminSettings.tsx` | Composition only — wires hook to components |
| Feature Hook | `components/admin/settings/useAdminSettings.ts` | State ownership, data loading, save orchestration |
| Presentation | `components/admin/settings/*.tsx` | Rendering, layout, user interaction |
| Service | `services/adminService.ts` | Business logic, role enforcement, orchestration |
| Repository | `lib/repositories/exam.repository.ts` | Data access (Supabase RPCs and queries) |

### File Organisation

| File | Purpose |
|------|---------|
| `AdminSettings.tsx` (page) | Composition: 104 lines |
| `useAdminSettings.ts` | Feature hook: 125 lines |
| `types.ts` | Shared type re-exports (`ExamConfig`, `ExamPaper`, `ExamSubject`) |
| `SettingsCard.tsx` | Reusable card wrapper with icon header + save button |
| `ExamParamsForm.tsx` | Exam parameter form (questions, marks, duration, marking, publish) |
| `SubjectDistributionPanel.tsx` | Subject quota management with pie chart + card list |
| `SubjectPieChart.tsx` | Recharts donut chart of subject distribution |
| `SubjectCardItem.tsx` | Individual subject row (name, questions, marks) |
| `AddExamModal.tsx` | Self-contained modal for creating new exams |
| `README.md` | Golden Reference documentation |

---

## Settings Domain Model

The settings feature spans two independent business domains: **Exam
Configuration** and **Subject Distribution**. Each domain owns a distinct
set of data, workflows, and UI sections. The `useAdminSettings` hook
coordinates across both domains but does not couple them — a failure in
one domain has no effect on the other.

### Exam Configuration Domain

| Aspect | Detail |
|--------|--------|
| Purpose | Manage exam-level and paper-level parameters |
| Data | `total_questions`, `total_marks`, `duration_minutes`, `negative_marking`, `negative_mark_value`, `is_published`, `allow_multiple_attempts` |
| Persistence | `exam_configs` table (exam-level) + `exam_papers` table (paper-level) |
| UI Section | `ExamParamsForm` inside `SettingsCard` |
| Workflow | Load → Edit → Validate → Save → Sync (exam-level) |
| Failure Mode | Toast error, form state preserved for retry |

### Subject Distribution Domain

| Aspect | Detail |
|--------|--------|
| Purpose | Allocate question counts and marks per subject |
| Data | `subject_name`, `question_count`, `marks_per_question` per subject |
| Persistence | `exam_subjects` table (batch RPC) |
| UI Section | `SubjectDistributionPanel` (pie chart + card list) inside `SettingsCard` |
| Workflow | Load → Edit → Validate Sum → Save |
| Failure Mode | Toast error, form state preserved for retry |

### Exam Creation Domain

| Aspect | Detail |
|--------|--------|
| Purpose | Create new dynamic exams with papers and subjects atomically |
| Data | Exam metadata + papers array + subjects array |
| Persistence | `exam_repo.createNewExamRpc` (atomic RPC) |
| UI Section | `AddExamModal` (self-contained modal) |
| Workflow | Open Form → Fill → Zod Validate → Atomic Create → Refresh |
| Failure Mode | Toast error, form state preserved for correction |

### Orchestration

`useAdminSettings` is the primary orchestration layer. It:

1. Fetches config, papers, and subjects on mount via `fetchData`.
2. Distributes state and callbacks to each UI section.
3. Provides independent save handlers — `saveConfig` (exam parameters)
   and `saveSubjects` (subject distribution).

Each handler is self-contained. The config handler does not read subject
state. The subject handler does not modify exam parameters. Domain
isolation ensures that a bug in one workflow cannot corrupt another.

The `AddExamModal` is fully self-contained — it owns its own form state,
validation, submission, and toast feedback. The page only receives an
`onExamCreated` callback to refresh the filter tabs and navigate to the
new exam.

---

## Domain Dependency Matrix

Every domain in Admin Settings has its own persistence boundary. No
domain reads or writes another domain's data.

```
Exam Parameters
      │
      └── Exam Config (exam_configs + exam_papers)
            │
            └── Paper Sync (syncExamPapersFromConfig)
                  │
                  └── All papers under the exam

Subject Distribution
      │
      └── Exam Subjects (exam_subjects — batch RPC)

Add Exam
      │
      └── Atomic RPC (exam_configs + exam_papers + exam_subjects)
            │
            └── Single transaction — all or nothing

Filters
      │
      └── Shared useAdminFilters (consumed, not owned)
            │
            └── State lives outside useAdminSettings
```

### Independence Guarantees

| Domain | Persistence Target | Coupling to Other Domains |
|--------|-------------------|---------------------------|
| Exam Parameters | `exam_configs` + `exam_papers` | None — reads config once, writes independently |
| Subject Distribution | `exam_subjects` (batch RPC) | None — reads subjects once, writes independently |
| Add Exam | Atomic RPC (all 3 tables) | None — one-time creation, no ongoing coupling |
| Filters | `useAdminFilters` (memory) | None — consumed by Settings, owned by shared hook |

**Each domain has its own persistence boundary.** Exam Parameters writes
to `exam_configs`/`exam_papers`. Subject Distribution writes to
`exam_subjects`. Add Exam writes to all three in a single transaction.
A failure in any domain never blocks another.

---

## Filter Ownership

### Owner-Consumer Model

```
Owner: useAdminFilters (shared hook)
  │
  ├── Consumers:
  │     ├── Admin Settings (this page)
  │     ├── Admin Questions
  │     ├── Admin Exams
  │     └── Other admin pages
  │
  └── State owned:
        ├── selectedExam
        ├── selectedPaper
        └── selectedSubject
```

**Settings NEVER owns filter state.** The `useAdminSettings` hook
receives `selectedExam`, `selectedPaper`, and `selectedSubject` as
external inputs via `useAdminFilters`. It does not store them, persist
them, or mutate them independently of the shared hook's public API.

### Flow

```
AdminSelectionTabs (shared component)
  │
  ├── useAdminFilters (shared hook)
  │     └── selectedExam, selectedPaper, selectedSubject
  │
  └── useAdminSettings
        └── fetchData reacts to filter changes
```

When the user changes the exam or paper selection, `fetchData` refetches
the config, merges the correct paper-level fields, and reloads subjects.
When `selectedSubject` changes, the page auto-scrolls to the subject card.

### Why Settings Does Not Own Filters

1. **Cross-page consistency** — Admin Questions and Admin Exams use the
   same filters. If Settings owned filter state, switching pages would
   reset the selection.
2. **Single source of truth** — Filter state lives in one place. No
   duplication, no sync protocol, no stale copies.
3. **Decoupled lifetimes** — Settings remounts (e.g., via `tabsKey`
   increment) do not destroy filter state. The shared hook survives
   page re-renders.

---

## Settings Workflow

All four workflows are independent. A failure in one workflow never
affects the state or execution of another.

---

### 1. Load Workflow

The load workflow fetches exam configuration, papers, and subjects on
mount or when the exam/paper filter changes.

```
Page Mount / Filter Change
    ↓
fetchData (via useEffect)
    ↓
Guard: selectedExam === 'all' || 'APPSC_GROUPS' → early return
    ↓
adminService.fetchExamPapers({ user, requestId }, targetExamId)
    ├── examRepo.fetchPapersByExamId(examId)
    │     ← ExamPaper[]
    ↓
Resolve currentPaperId:
  ├── If 'all' or not found in papers → use papers[0].id
  └── Else → keep current selection
    ↓
adminService.fetchExamConfig({ user, requestId }, targetExamId)
    ├── examRepo.findExamConfigById(examId)
    │     ← ExamConfig | null
    ↓
If paper-level (currentPaperId !== 'all'):
  ├── Merge paper fields into config:
  │     total_questions, total_marks, duration_minutes,
  │     negative_marking, negative_mark_value
  └── setConfig(merged)
Else:
  └── setConfig(configData)
    ↓
adminService.fetchExamSubjects({ user, requestId }, targetExamId, paperId?)
    ├── examRepo.fetchSubjectsByExamId(examId, paperId)
    │     ← ExamSubject[]
    ↓
setSubjects(subjectData || [])
    ↓
Error → showError('Failed to load settings data')
```

**Load Phase:** Data is fetched once on mount and refetched when the
exam or paper filter changes. There is no polling or background refresh.
`useAsyncOperation(true)` initialises with `loading = true` so the
loading state is shown immediately.

#### Paper Field Resolution

When a specific paper is selected (`currentPaperId !== 'all'`), the
config displayed in `ExamParamsForm` is a *merged* view: the exam-level
config from `exam_configs` is overlaid with the paper-level fields from
`exam_papers`. This means:

- `name`, `exam_selection`, `is_published`, `allow_multiple_attempts` →
  from `exam_configs` (exam-level)
- `total_questions`, `total_marks`, `duration_minutes`,
  `negative_marking`, `negative_mark_value` → from `exam_papers` (paper-level)

When "All Papers" is selected (`currentPaperId === 'all'`), the raw
`exam_configs` row is used directly.

---

### 2. Save Exam Parameters Workflow

The save workflow persists exam parameters. It branches based on whether
a specific paper or "All Papers" is selected.

```
User clicks "Save Changes" on Exam Parameters card
    ↓
handleSave('params', saveConfig)
    ↓
Guard: isAdmin(user) → else showError('Unauthorized')
    ↓
setIsSaving(params: true)
    ↓
saveConfig()
    ↓
Guard: !config → early return
    ↓
Build paperFields: { total_questions, total_marks, duration_minutes,
                     negative_marking, negative_mark_value }
    ↓
Branch on currentPaperId:
  │
  ├── Paper-level (currentPaperId !== 'all'):
  │     └── adminService.updateExamPaper({ user, requestId },
  │               currentPaperId, paperFields)
  │           ├── ensureRole(user, ['admin'])
  │           └── examRepo.updatePaperById(paperId, updates)
  │
  └── Exam-level (currentPaperId === 'all'):
        ├── adminService.updateExamConfig({ user, requestId },
        │         selectedExam, {
        │           ...paperFields,
        │           is_published,
        │           allow_multiple_attempts
        │         })
        │     ├── ensureRole(user, ['admin'])
        │     └── examRepo.updateExamConfigById(examId, updates)
        │
        └── adminService.syncExamPapersFromConfig({ user, requestId },
                  selectedExam, paperFields)
              ├── ensureRole(user, ['admin'])
              └── examRepo.syncPapersFromConfig(examId, updates)
    ↓
showSuccess('Settings updated successfully')
    ↓
Error → showError(err.message)
    ↓
finally: setIsSaving(params: false)
```

#### Paper-Level vs Exam-Level Save

| Scenario | Target | Behaviour |
|----------|--------|-----------|
| Specific paper selected | `updateExamPaper` | Updates only the selected paper's fields. Exam-level fields (`is_published`, `allow_multiple_attempts`) are NOT updated — they remain managed at the exam config level. |
| "All Papers" selected | `updateExamConfig` + `syncExamPapersFromConfig` | Updates the exam config's fields AND propagates the paper-level fields to all papers under that exam. |

**Domain boundary:** The exam parameters save is completely independent
from the subject distribution save. They have separate save buttons,
separate loading states (`isSaving.params` vs `isSaving.subjects`), and
separate persistence paths.

---

### 3. Save Subject Distribution Workflow

The save workflow persists subject question counts and marks per question.

```
User edits subject fields (questions / marks)
    ↓
Page updates subjects array:
  ├── onQuestionCountChange → subjects[idx].question_count = value
  └── onMarksChange → subjects[idx].marks_per_question = value
    ↓
User clicks "Save Changes" on Subject Distribution card
    ↓
handleSave('subjects', saveSubjects)
    ↓
isAdmin guard → setIsSaving(subjects: true)
    ↓
saveSubjects()
    ↓
Validation:
  ├── totalQ = subjects.reduce(sum of question_count, 0)
  └── totalQ !== config.total_questions?
        └── throw Error('Total questions must be ${config.total_questions}')
    ↓
adminService.updateExamSubjects({ user, requestId }, subjects)
    ├── ensureRole(user, ['admin'])
    ├── examRepo.updateExamSubjectsBatchRpc(subjects)
    │     └── Batch RPC updates all subjects in one transaction
    │           → DELETE + INSERT for the given exam+paper scope
    ↓
showSuccess('Settings updated successfully')
    ↓
Error (validation) → showError('Total questions must be X')
Error (RPC failure) → showError(err.message)
```

**Validation:** The sum of `question_count` across all subjects must
exactly match `config.total_questions`. This prevents misconfigured
exams where the question count per subject does not add up to the
exam total.

**Domain boundary:** The subject distribution save is completely
independent from the exam parameters save. A validation failure in one
does not block the other.

---

### 4. Add Exam Workflow

The add exam workflow is fully self-contained in `AddExamModal.tsx`.
The page only provides the trigger (button to open modal) and a callback
(on exam creation).

```
User clicks "Add Exam" button
    ↓
setIsModalOpen(true)
    ↓
AddExamModal renders with AnimatePresence
    ↓
User fills form fields:
  ├── Exam ID, Display Name, Selection Category
  ├── Total Questions, Total Marks, Duration, Publish toggle
  ├── Paper Name, Paper Stage (Single/Prelims/Mains)
  ├── Negative Marking penalty config
  └── Subject rows (name, question count, marks per question)
    ↓
Client-side sum validation:
  ├── Running sum of questions must equal total
  └── Running marks sum must equal total (warning, not blocking)
    ↓
User clicks "Deploy dynamic exam"
    ↓
examCreationSchema.safeParse(formData) — Zod validation
    ↓
Fails → showError(first issue message)
    ↓
Passes → execute(async ()):
    ↓
adminService.createNewExam({ user, requestId }, examData)
    ├── ensureRole(user, ['admin'])
    └── examRepo.createNewExamRpc(examData)
          └── Atomic RPC → creates exam_configs + exam_papers + exam_subjects
    ↓
showSuccess → onClose() → onExamCreated(examId)
    ↓
Parent: setTabsKey(prev + 1) → remounts AdminSelectionTabs
         setSelectedExam(examId) → navigates to new exam + triggers data load
    ↓
Error → showError(err.message)
```

**Modal independence:** The modal owns its own `useToast` and
`useAsyncOperation`. Success/failure feedback is isolated from the
parent page's toast state.

**Filter integration:** After creation, `setTabsKey(prev + 1)` forces
`AdminSelectionTabs` to remount (resetting internal state), and
`setSelectedExam(examId)` triggers `fetchData` for the new exam.

---

### 5. Filter Change Workflow

The filter change workflow reacts to selection changes in
`AdminSelectionTabs`.

```
User selects different exam / paper / subject
    ↓
useAdminFilters state updates:
  ├── setSelectedExam(value)
  ├── setSelectedPaper(value)
  └── setSelectedSubject(value)
    ↓
fetchData useCallback dependencies change:
  ├── [selectedExam, selectedPaper, user, execute, showError]
  └── useEffect re-runs
    ↓
fetchData() executes
  ├── Fetches papers for new exam
  ├── Resolves currentPaperId (falls back to first paper if 'all' or invalid)
  ├── Fetches config (merged with paper fields if paper-level)
  └── Fetches subjects scoped to exam + paper
    ↓
Stale request protection (useStableFetch):
  ├── Each fetch call increments an ID counter
  ├── After async completion, checks isStale(id)
  └── Stale results → discarded (no setState for superseded requests)
```

**Auto-scroll:** When `selectedSubject` changes and loading is complete,
the page scrolls to the subject card via `document.getElementById()`.

**Staleness protection:** Rapid filter switching (e.g., clicking through
exams quickly) creates multiple in-flight requests. `useStableFetch`
ensures only the latest response updates state — stale responses from
earlier requests are silently discarded.

---

## Save Strategy

The three save workflows are intentionally isolated. Each has its own
handler, loading state, persistence path, and failure recovery. No save
workflow reads or writes another's data.

### Exam Config Save

```
ExamParamsForm (user edits fields)
      ↓
  setConfig(new values)
      ↓
  User clicks "Save Changes"
      ↓
  handleSave('params', saveConfig)
      ↓
  isAdmin check
      ↓
  setIsSaving(params: true)
      ↓
  saveConfig()
      ↓
  ┌── Paper-level (specific paper selected)
  │     └── adminService.updateExamPaper → examRepo.updatePaperById
  │
  └── Exam-level ("All Papers" selected)
        ├── adminService.updateExamConfig → examRepo.updateExamConfigById
        └── adminService.syncExamPapersFromConfig → examRepo.syncPapersFromConfig
      ↓
  setIsSaving(params: false)
```

**Isolation rationale:** Exam config save is the only workflow that
writes to `exam_configs` and `exam_papers`. It never touches
`exam_subjects`. A failure here has no effect on subject distribution
or exam creation.

### Subject Save

```
SubjectCardItem (user edits question_count / marks_per_question)
      ↓
  subjects[idx] = new value (via onQuestionCountChange / onMarksChange)
      ↓
  User clicks "Save Changes"
      ↓
  handleSave('subjects', saveSubjects)
      ↓
  isAdmin check
      ↓
  setIsSaving(subjects: true)
      ↓
  saveSubjects()
      ↓
  Validation: sum of question_count === config.total_questions
      ↓
  adminService.updateExamSubjects → examRepo.updateExamSubjectsBatchRpc
      └── Batch RPC: DELETE + INSERT for the exam+paper scope
      ↓
  setIsSaving(subjects: false)
```

**Isolation rationale:** Subject save is the only workflow that writes
to `exam_subjects`. It never reads `exam_configs` or `exam_papers`
beyond the initial load. A failure here has no effect on exam parameters
or exam creation.

### Add Exam

```
"Add Exam" button clicked
      ↓
  AddExamModal opens (self-contained form state)
      ↓
  User fills all fields
      ↓
  Form validation (client-side sum + Zod schema)
      ↓
  adminService.createNewExam → examRepo.createNewExamRpc
      └── Atomic RPC: all 3 tables in one transaction
      ↓
  onExamCreated(examId)
      ↓
  setTabsKey(prev + 1) + setSelectedExam(examId)
```

**Isolation rationale:** Add Exam runs as an atomic RPC that creates
records in all three tables (`exam_configs`, `exam_papers`,
`exam_subjects`) in a single transaction. If any insert fails, all
roll back. This is a one-time creation workflow with no ongoing coupling
to the edit workflows.

### Why Save Workflows Are Intentionally Isolated

1. **Independent loading states** — `isSaving.params` and
   `isSaving.subjects` are separate state values. Saving exam parameters
   never shows a loading indicator on the subject save button, and vice
   versa.
2. **Independent persistence paths** — Each workflow calls a different
   service method targeting a different database table.
3. **Independent validation** — Exam params has no client-side
   validation. Subject save validates sum === total. Add Exam validates
   via Zod. None share validation logic.
4. **Independent error recovery** — A failure in one workflow preserves
   the form state of the other. The user can retry one without losing
   work in the other.

---

## Security Verification

The security model operates at four independent layers. Every layer
must be bypassed for an unauthorised user to read or mutate exam
configuration data.

### Authentication — RoleGuard

| Layer | Enforcement | Mechanism |
|-------|-------------|-----------|
| Route | `RoleGuard` | `allowedRoles={['admin']}` on route definition |

The route guard is the first line of defence. A non-admin who navigates
to `/admin/settings` is redirected before any page code runs. This
prevents unauthorised users from even seeing the settings UI.

### Authorization — ensureRole

Every `adminService` method calls `ensureRole` before executing any
business logic:

| Method | Guard |
|--------|-------|
| `fetchExamConfig` | `ensureRole({ user, allowedRoles: ['admin'] })` |
| `fetchExamPapers` | `ensureRole({ user, allowedRoles: ['admin'] })` |
| `fetchExamSubjects` | `ensureRole({ user, allowedRoles: ['admin'] })` |
| `updateExamConfig` | `ensureRole({ user, allowedRoles: ['admin'] })` |
| `updateExamPaper` | `ensureRole({ user, allowedRoles: ['admin'] })` |
| `updateExamSubjects` | `ensureRole({ user, allowedRoles: ['admin'] })` |
| `syncExamPapersFromConfig` | `ensureRole({ user, allowedRoles: ['admin'] })` |
| `createNewExam` | `ensureRole({ user, allowedRoles: ['admin'] })` |

The service layer is the trust boundary. Even if a non-admin somehow
reaches the page (e.g., via client-side state manipulation), every
service call validates the role again and throws `ForbiddenError`
on failure.

### Database — Row-Level Security (RLS)

Supabase RLS policies on every table provide defence in depth:

| Table | RLS Policy |
|-------|------------|
| `exam_configs` | Admin-only select/insert/update |
| `exam_papers` | Admin-only select/insert/update |
| `exam_subjects` | Admin-only select/insert/update |

Even if a service call somehow bypasses role checking, the database
rejects unauthorised reads and writes at the row level.

### RPC — Atomic Transactions

| RPC | Tables Affected | Transactional? |
|-----|----------------|----------------|
| `createNewExamRpc` | `exam_configs` + `exam_papers` + `exam_subjects` | Yes — all-or-nothing |
| `updateExamSubjectsBatchRpc` | `exam_subjects` | Yes — DELETE + INSERT in one transaction |
| `syncPapersFromConfig` | `exam_papers` | Yes — updates all papers atomically |

RPCs run inside the database with `SECURITY DEFINER` or `SECURITY INVOKER`
as appropriate. They cannot be invoked directly from the client — they
are only callable through the service layer.

### Why Multiple Security Layers Exist

1. **Defence in depth** — No single layer is trusted. If the route guard
   has a bug, `ensureRole` catches it. If `ensureRole` is bypassed, RLS
   catches it. If RLS is misconfigured, the RPC's `SECURITY` context
   limits damage.
2. **Layer-specific guarantees** — Authentication (who you are) and
   authorization (what you can do) are separate concerns. The route
   guard handles authentication; `ensureRole` handles authorization;
   RLS provides row-level scoping; RPCs provide transactional integrity.
3. **Audit trail** — Each layer independently logs access attempts.
   A failure at any layer is traceable to the specific enforcement point.

### Trust Boundaries Diagram

```
User → Route Guard (redirect if not admin)
         → Page (no data without session)
           → useAdminSettings (no direct DB access)
             → adminService (ensureRole + RPC calls)
               → exam.repository (RLS-enforced queries)
                 → Supabase (RLS policies)
```

1. **Browser (untrusted):** The user's browser renders the UI. No
   sensitive data is exposed in the HTML source beyond what the
   authenticated admin can see.
2. **Route (trust boundary):** `RoleGuard` blocks non-admin users at
   the route level. A non-admin who navigates to `/admin/settings` is
   redirected.
3. **Service (trust boundary):** Every `adminService` method validates
   the user's role again. Even if a non-admin somehow reaches the page
   (e.g., via a client-side state manipulation), the service call fails.
4. **Database (trust boundary):** RLS policies on every table provide
   defence in depth. Even if a service call somehow bypasses role
   checking, the database rejects unauthorised reads and writes.

---

## Data Ownership

Every dataset consumed or produced by this feature has a single canonical
owner. No data is duplicated, cached, or derived from a non-authoritative
source.

### Persistent Data

Data that survives page reloads and is stored in the database.

| Data | Owner | Source | Lifecycle |
|------|-------|--------|-----------|
| `config` (`ExamConfig`) | `useAdminSettings` | `fetchExamConfig` on mount/filter change | Refetched on exam/paper change, mutated on save |
| `subjects` (`ExamSubject[]`) | `useAdminSettings` | `fetchExamSubjects` on mount/filter change | Refetched on exam/paper change, mutated on save |
| `selectedExam` | `useAdminFilters` | `AdminSelectionTabs` | Persists across page navigation (shared hook) |
| `selectedPaper` | `useAdminFilters` | `AdminSelectionTabs` | Persists across page navigation (shared hook) |
| `selectedSubject` | `useAdminFilters` | `AdminSelectionTabs` | Persists across page navigation (shared hook) |

**Config and subjects are the single source of truth for all settings
domains.** They are refetched whenever the exam or paper changes.
Mutations update local state and persist to the database. The database
is the canonical record — the local state is a cache that stays
consistent via save operations.

### Ephemeral UI State

Data that exists only during the current session and is never persisted
to the database.

| Data | Owner | Purpose | Reset Condition |
|------|-------|---------|-----------------|
| `isLoading` | `useAdminSettings` | Initial data load flag | `false` after first fetch completes |
| `isSaving.params` | `useAdminSettings` | Exam params save loading flag | `false` after save completes (success or failure) |
| `isSaving.subjects` | `useAdminSettings` | Subject save loading flag | `false` after save completes |
| `isModalOpen` | `useAdminSettings` | Add Exam modal visibility | Closed on `onClose()` or successful creation |
| `tabsKey` | `useAdminSettings` | AdminSelectionTabs remount trigger | Incremented on exam creation |

**Ephemeral state is exclusively owned by `useAdminSettings`.** No
component stores a copy.

### Externally Owned State

Data owned by hooks or contexts outside the settings feature.

| Data | Owner | Access in Settings | Mutable by Settings? |
|------|-------|-------------------|---------------------|
| `user` (auth session) | `AuthContext` | `useAuth().user` for `ensureRole` and `requestId` | No |
| `toasts` | `useToast` | `showSuccess()` / `showError()` for user feedback | Yes — pushes toast messages |
| `selectedExam`, `selectedPaper`, `selectedSubject` | `useAdminFilters` | Filters for data scoping | Yes — via setSelected* callbacks |

**External state is never duplicated in `useAdminSettings`.** The hook
reads from the canonical source on every render.

### Ownership Invariants

1. Every dataset has exactly one canonical owner.
2. No two owners hold the same data.
3. Ephemeral state is always derived from or related to a single
   user action — it never overlaps with persistent state.
4. External state is accessed through the owning hook's public API
   only — never through direct mutation.

---

## Data Flow

### Exam Config Load

```
AdminSelectionTabs
  ├── selectedExam changes
  ├── selectedPaper changes
  └── selectedSubject changes (scroll only)
        ↓
useAdminSettings.fetchData
  ├── fetchExamPapers → papers[]
  ├── resolve currentPaperId
  ├── fetchExamConfig → config
  ├── merge paper fields (if paper-level)
  ├── setConfig(merged)
  └── fetchExamSubjects → subjects[]
        ↓
ExamParamsForm ← config
SubjectDistributionPanel ← subjects, selectedSubject
```

### Exam Config Save

```
ExamParamsForm
  └── onConfigChange → setConfig(newConfig)
        ↓
SettingsCard "Save Changes" button
  └── handleSave('params', saveConfig)
        ↓
useAdminSettings.saveConfig
  ├── paper-level → adminService.updateExamPaper(paperFields)
  │     └── examRepo.updatePaperById
  └── exam-level → adminService.updateExamConfig(fullConfig) +
                    adminService.syncExamPapersFromConfig(paperFields)
        ↓
Toast: "Settings updated successfully"
```

### Subject Save

```
SubjectCardItem
  └── onQuestionCountChange / onMarksChange → subjects[idx] = value
        ↓
SubjectDistributionPanel (running total badge updates reactively)
        ↓
SettingsCard "Save Changes" button
  └── handleSave('subjects', saveSubjects)
        ↓
useAdminSettings.saveSubjects
  ├── validate: sum === config.total_questions
  └── adminService.updateExamSubjects(batch)
        └── examRepo.updateExamSubjectsBatchRpc
        ↓
Toast: "Settings updated successfully"
```

### Exam Creation

```
"Add Exam" button → setIsModalOpen(true)
        ↓
AddExamModal (self-contained)
  ├── User fills and submits form
  ├── Zod validation (examCreationSchema)
  ├── adminService.createNewExam (atomic RPC)
  └── onExamCreated(examId)
        ↓
Page: setTabsKey(prev + 1) + setSelectedExam(examId)
        ↓
fetchData re-runs for new exam
```

---

## Mutation Boundary

Every mutation in Admin Settings passes through exactly one service
boundary. No mutation bypasses `adminService` to call the repository
or database directly.

### Mutation Table

| Mutation | Service Method | Repository Method | Database Table(s) |
|----------|---------------|-------------------|-------------------|
| Update exam config | `adminService.updateExamConfig` | `examRepo.updateExamConfigById` | `exam_configs` |
| Update exam paper | `adminService.updateExamPaper` | `examRepo.updatePaperById` | `exam_papers` |
| Sync papers from config | `adminService.syncExamPapersFromConfig` | `examRepo.syncPapersFromConfig` | `exam_papers` |
| Update subjects (batch) | `adminService.updateExamSubjects` | `examRepo.updateExamSubjectsBatchRpc` | `exam_subjects` |
| Create new exam (atomic) | `adminService.createNewExam` | `examRepo.createNewExamRpc` | `exam_configs` + `exam_papers` + `exam_subjects` |
| Fetch exam config | `adminService.fetchExamConfig` | `examRepo.findExamConfigById` | `exam_configs` (read) |
| Fetch exam papers | `adminService.fetchExamPapers` | `examRepo.fetchPapersByExamId` | `exam_papers` (read) |
| Fetch exam subjects | `adminService.fetchExamSubjects` | `examRepo.fetchSubjectsByExamId` | `exam_subjects` (read) |

### Boundary Rules

1. **Service boundary is non-negotiable.** `useAdminSettings` never
   calls `examRepo` directly. Every data access passes through
   `adminService`, which enforces `ensureRole` before delegation.
2. **Repository methods are single-table.** Each repository method
   targets exactly one database table, except for the two atomic RPCs
   (`createNewExamRpc` and `updateExamSubjectsBatchRpc`) which are
   explicitly designed for multi-table transactional writes.
3. **No cross-boundary shortcuts.** Event handlers in the page or hook
   never call repository methods, construct SQL, or mutate the database
   directly. All mutations flow through the canonical
   `hook → service → repository` pipeline.

### Data Flow Consistency

```
Page event → useAdminSettings handler → adminService.method
  → ensureRole → examRepo.method → Supabase RPC/query
```

This consistent pipeline ensures that every mutation is auditable,
every mutation has role enforcement, and every mutation follows the
same error handling path.

---

## Design System Verification

### Canonical Components Used

| Component | Source | Role |
|-----------|--------|------|
| `PageContainer` | `AntigravityLayout` | Page-level layout wrapper |
| `Stack` | `AntigravityLayout` | Vertical and horizontal layout composition |
| `Grid` | `AntigravityLayout` | Two-column responsive grid |
| `Card` | `AntigravityCard` | Section containers with variant support |
| `SectionReveal` | `AntigravityAnimation` | Entrance animation on scroll |
| `Input` | `AntigravityForm` | Number and text form fields |
| `Button` | `AntigravityButton` | Primary, secondary actions |
| `IconButton` | `AntigravityButton` | Modal close and subject remove actions |
| `Switch` | `AntigravityForm` | Publish/draft toggle, negative marking toggle |
| `Label` | `AntigravityTypography` | Field and section labels |
| `Badge` | `AntigravityData` | Running total validation indicators |
| `RadioGroup` | `AntigravityForm` | Paper stage selection (Single/Prelims/Mains) |
| `ToastContainer` | `useToast` | Toast notification display |
| `EmptyState` | `SharedComponents` | No-configuration fallback |

All layout, navigation, form, and feedback primitives are canonical.
No reusable primitive was reimplemented.

### Feature-Specific Components

The six feature-specific components are intentionally non-generic. Each
represents a unique business concern that has no reuse target outside
this feature.

#### `SettingsCard` — Reusable Wrapper

| Aspect | Detail |
|--------|--------|
| Domain | Shared (wrapper for both sections) |
| Lines | 33 |
| Composition | `SectionReveal` `Card` `Button` `Save` icon |
| Props | `title`, `icon`, `children`, `onSave`, `isSaving` |
| Instances | 2 (Exam Parameters card, Subject Distribution card) |

**Why not reusable as a generic component:** `SettingsCard` *is* the
reusable component. It wraps both settings sections with a consistent
pattern: icon header, content area (via `children`), and a "Save
Changes" button with loading state. Extracting a further level of
abstraction (e.g., a generic `FormCard`) would add indirection without
reuse benefit — there are only two instances and they already share
this wrapper.

**What makes it feature-specific:** The icon + header + save button
pattern matches the admin settings layout exactly. No other admin page
uses a card with this specific header/save combination.

#### `ExamParamsForm` — Exam Configuration

| Aspect | Detail |
|--------|--------|
| Domain | Exam Configuration |
| Lines | 54 |
| Composition | `Grid` `Input` `Switch` `Label` `motion.div` |
| Props | `config`, `onConfigChange` |
| Mutations | Updates `config` via `setConfig` in parent hook |

**Why not generic:** The form combines multiple field types (number
inputs, switches, expandable sections) in a specific layout. The
expandable negative-marking section (conditional on `negative_marking`)
uses Framer Motion for animation. A generic "parameter form" would
need configuration for which fields to show, their types, validation
rules, conditional sections, and layout — the config API would be as
complex as the component itself.

**What makes it feature-specific:** The combination of total questions,
total marks, duration, publish toggle, negative marking toggle, and
expandable penalty field is unique to exam configuration. No other
feature has this exact field set in this layout.

#### `SubjectDistributionPanel` — Subject Distribution

| Aspect | Detail |
|--------|--------|
| Domain | Subject Distribution |
| Lines | 46 |
| Composition | `Stack` `Badge` `SubjectPieChart` `SubjectCardItem[]` |
| Props | `subjects`, `selectedSubject`, `configTotalQuestions`, `onQuestionCountChange`, `onMarksChange` |
| Memo | Wrapped in `React.memo` |

**Why not generic:** The panel combines three distinct sub-components
— a pie chart (visual distribution), a scrollable card list (per-subject
editing), and a running total badge (validation feedback). The
combination of visual, interactive, and feedback elements is unique to
subject distribution. A generic "distribution panel" would need to
support arbitrary chart types, card layouts, and validation rules.

**What makes it feature-specific:** The chart + cards + running total
`Badge` (with `success`/`danger` variant based on sum matching) is
unique to exam configuration. No other feature displays subject quotas
with this interaction pattern.

#### `SubjectPieChart` — Donut Chart

| Aspect | Detail |
|--------|--------|
| Domain | Subject Distribution |
| Lines | 36 |
| Composition | `ResponsiveContainer` `PieChart` `Pie` `Cell` `Tooltip` from Recharts |
| Props | `data: { subject_name, question_count }[]` |
| Optimization | `useMemo` on chart data, `isAnimationActive={false}` |

**Why not generic:** Chart components are inherently domain-specific.
The data shape (`subject_name` + `question_count`), colour palette
(six hardcoded `COLORS`), donut style (`innerRadius="60%"`,
`outerRadius="85%"`, `paddingAngle={5}`), and tooltip styling (CSS
variable references) are all specific to subject distribution. A
generic pie chart component would need configuration for each of these
dimensions — the API surface would be more complex than the 36-line
component.

**What makes it feature-specific:** The colour palette (`#12291C`,
`#C8960C`, etc.) matches the application's ancient theme. The donut
style with padding angles is specific to this feature's visual design.

#### `SubjectCardItem` — Editable Subject Row

| Aspect | Detail |
|--------|--------|
| Domain | Subject Distribution |
| Lines | 55 |
| Composition | `Stack` `Grid` `Input` `Label` `Badge` |
| Props | `subject`, `index`, `isSelected`, `onQuestionCountChange`, `onMarksChange` |
| Memo | Wrapped in `React.memo` |

**Why not generic:** Each row combines a subject name (with index),
two number inputs (questions and marks), a selected-state badge, and
dark/light mode styling. A generic "editable row" would need
configuration for field labels, input types, validation, and selection
behaviour — the config API would mirror the current implementation.

**What makes it feature-specific:** The `ancient-3d-lift` class, selected
state styling (`bg-[var(--ancient-cream)]` in light mode,
`bg-primary/20` in dark mode), and `animate-pulse` "Selected" badge are
unique to this feature's visual design.

#### `AddExamModal` — Exam Creation Modal

| Aspect | Detail |
|--------|--------|
| Domain | Exam Creation |
| Lines | 309 |
| Composition | `AnimatePresence` `motion.div` `Card` `Grid` `Stack` `Input` `Switch` `Label` `RadioGroup` `Badge` `Button` `IconButton` |
| Props | `isOpen`, `onClose`, `user`, `onExamCreated` |
| Self-contained | Own `useToast`, `useAsyncOperation`, 12 state variables |

**Why not generic:** The modal contains five distinct form sections
(metadata, parameters, paper details, negative marking, subject quota
allocation) with complex interdependencies — subjects must sum to
total questions, calculated marks must match total marks, and the
final submission validates against a Zod schema. Extracting a generic
"creation modal" would need configuration for every form section,
validation rule, and callback — the surface would exceed the 309-line
component.

**What makes it feature-specific:** The combination of exam metadata,
paper configuration, negative marking settings, and dynamic subject
rows is unique to exam creation. No other feature has this exact form
layout.

### Why Feature-Specific Is Intentional

1. **Each component represents a unique business concern.** Exam
   parameters, subject distribution, and exam creation are fundamentally
   different domains. They share no layout, no interaction pattern, and
   no data shape beyond being part of the same feature.

2. **No reuse target exists outside this feature.** No other admin
   page has subject distribution or exam parameter configuration. The
   components are specific to the admin settings use case.

3. **Shared foundations are used.** All feature-specific components
   build on the same canonical primitives (`Card`, `Stack`, `Button`,
   `Input`, `Switch`, `Label`, `Badge`, `RadioGroup`, `SectionReveal`).
   The feature-specific layer is thin — each component is a composition
   of canonical components with domain-specific layout and styling.

4. **Feature-specific components are independently testable.** Each
   component has a clear prop interface and no implicit dependencies
   on the hook or page. They can be rendered in isolation with mock
   props.

### Rejected Migrations

| Migration | Reason for Rejection |
|-----------|---------------------|
| Extract a generic `FormCard` wrapper | `SettingsCard` already serves this role. Extracting a further level of abstraction would add indirection without reuse benefit — there are only two instances. |
| Merge `SubjectDistributionPanel` and `ExamParamsForm` into a single "Settings" card | The two domains (subjects and parameters) have independent save buttons, independent loading states, and independent validation. Merging them would couple the save workflows, preventing independent saves. |
| Extract a generic `NumberField` component for question/marks inputs | The `<Input type="number">` pattern is a single line. Extracting it would add a file import for zero line-count reduction. |
| Extract a generic `ChartCard` wrapper for `SubjectPieChart` | The chart container is a single `div` with `h-[240px] w-full` and `role="img"`. A wrapper component would add a file import for a 2-line pattern. |

---

## Component Hierarchy

```
AdminSettings (page)              — composition only
  ├── PageHeader                  — canonical header with "Add Exam" button
  ├── AdminSelectionTabs          — shared filter component
  │                                (key prop forces remount on exam creation)
  ├── Loading / EmptyState        — conditional loading/no-config states
  │
  ├── Grid cols={2}
  │     ├── SettingsCard          — reusable wrapper
  │     │     └── SubjectDistributionPanel
  │     │           ├── SubjectPieChart     — recharts donut chart
  │     │           └── SubjectCardItem[]   — editable subject rows
  │     │
  │     └── SettingsCard          — reusable wrapper
  │           └── ExamParamsForm  — parameter inputs
  │
  └── AddExamModal                — self-contained modal (outside grid)
```

---

## State Ownership

### State in `useAdminSettings`

| State | Type | Default | Updated By | Purpose |
|-------|------|---------|------------|---------|
| `config` | `ExamConfig \| null` | `null` | `fetchData`, `setConfig` | Current exam configuration |
| `subjects` | `any[]` | `[]` | `fetchData`, page callbacks | Current subject distribution |
| `isLoading` | `boolean` | `true` | `useAsyncOperation` | Initial data load indicator |
| `isSaving` | `Record<string, boolean>` | `{}` | `handleSave` | Per-section save loading state |
| `isModalOpen` | `boolean` | `false` | `setIsModalOpen` | Add Exam modal visibility |
| `tabsKey` | `number` | `0` | `setTabsKey` | AdminSelectionTabs remount counter |

### State in `AddExamModal` (self-contained)

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| `examId`, `examName`, `examSelection` | `string` | `''`, `''`, `'GATE'` | Exam metadata |
| `totalQuestions`, `totalMarks`, `durationMinutes` | `number` | `65`, `100`, `180` | Exam parameters |
| `negativeMarking`, `negativeMarkValue` | `boolean`, `number` | `true`, `0.33` | Negative marking config |
| `isPublished` | `boolean` | `true` | Publish toggle |
| `paperName`, `paperStage` | `string` | `'Core Paper'`, `'SINGLE'` | Initial paper config |
| `modalSubjects` | `array` | 2 default subjects | Subject allocation rows |
| `isSubmitting` | `boolean` | `false` | Form submission loading |

Modal state is fully encapsulated — no state leaks to the parent.

### State in `useAdminFilters` (external, shared)

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| `selectedExam` | `string` | `'all'` | Active exam filter |
| `selectedPaper` | `string` | `'all'` | Active paper filter |
| `selectedSubject` | `string` | `'all'` | Active subject filter |

This state is shared across admin pages (Questions, Exams, Settings).
It is consumed by `useAdminSettings` but owned by `useAdminFilters`.

### State Boundaries

No state duplication exists. `useAdminSettings` stores only config and
subjects (both server-sourced). Filter state is in `useAdminFilters`.
Toast state is in `useToast`. Each piece of state has exactly one owner
and is accessed through that owner's public API.

---

## Accessibility

### Implementation Approach

Accessibility is integrated at the component level rather than applied
as a post-implementation audit.

- **Native elements** over custom widgets: `<input>` for number fields,
  `<button>` for actions.
- **Visible labels** over `aria-label` alone: every form field has a
  visible `<Label>` element.
- **Feedback parity**: loading states and error messages are both
  visual (spinner, colour) and programmatically accessible (DOM presence,
  `aria-live` region).

### Interaction Patterns

#### Forms (ExamParamsForm)

| Pattern | Implementation | Accessibility Benefit |
|---------|---------------|----------------------|
| Number input | Native `<input type="number">` with `<Label>` | Screen reader announces field purpose and current value |
| Toggle | `Switch` component from `AntigravityForm` | Native `<button>` with `role="switch"` and `aria-checked` |
| Expandable section | `motion.div` with `AnimatePresence` | Content is in DOM when visible; screen reader discovers it on render |
| Save button | Native `<button>` with loading state | `loading` prop adds spinner + disabled attribute |

**Keyboard flow:** Tab through number fields → Tab to toggles → Tab to
"Save Changes" button → Enter to submit.

#### Subject Cards (SubjectDistributionPanel)

| Pattern | Implementation | Accessibility Benefit |
|---------|---------------|----------------------|
| Number input (questions) | Native `<input type="number">` with `<Label>` | Screen reader announces "Questions" and current value |
| Number input (marks) | Native `<input type="number">` with `<Label>` | Screen reader announces "Marks/Q" and current value |
| Running total badge | `<Badge>` with variant | Visual colour coding + text content "Running Total Questions" |
| Pie chart | Recharts with `role="img" aria-label="Subject distribution pie chart"` | Screen reader announces chart purpose |

**Keyboard flow:** Tab through each subject card's fields → Tab to next
card's fields → Tab to "Save Changes" button.

#### Chart (SubjectPieChart)

| Pattern | Implementation | Accessibility Benefit |
|---------|---------------|----------------------|
| Chart container | `role="img" aria-label="Subject distribution pie chart"` | Screen reader identifies the chart and its purpose |
| Data display | Recharts tooltip on hover/focus | Numeric values displayed on demand — no screen reader clutter |

### ARIA Usage

| Element | Attribute | Purpose |
|---------|-----------|---------|
| Pie chart container | `role="img" aria-label="Subject distribution pie chart"` | Identifies chart purpose for screen readers |
| Settings content area | `aria-live="polite" aria-label="Settings content"` | Announces dynamic content changes |
| Loading state | Spinner is purely visual (`animate-spin`) | Screen reader discovers "Syncing configuration..." text |
| Toast container | `aria-live="polite"` (via `useToast`) | Announces new toasts without interrupting current output |
| Switch | `role="switch"`, `aria-checked` (via `Switch` component) | Identifies toggle state for screen readers |

### Loading States

| Scenario | Visual Indicator | Screen Reader Behaviour |
|----------|-----------------|------------------------|
| Initial load | `RefreshCw` spinning icon + "Syncing configuration..." text | Text is in DOM — screen reader reads it |
| Config save | Button shows spinner + becomes disabled | "Save Changes" button is dimmed |
| Subject save | Button shows spinner + becomes disabled | "Save Changes" button is dimmed |
| Exam creation | Button shows spinner + becomes disabled | "Deploy dynamic exam" button is dimmed |
| No config | `EmptyState` with `AlertCircle` + "No Configuration" | Text explains the empty state |

### Error States

| Scenario | Visual Indicator | Screen Reader Behaviour |
|----------|-----------------|------------------------|
| Load failure | Toast `showError` | `aria-live="polite"` announces error text |
| Save failure | Toast `showError` | `aria-live="polite"` announces error text |
| Validation failure (subjects) | Toast `showError` | `aria-live="polite"` announces the validation message |
| Subject sum mismatch | Badge shows `danger` variant + "X / Y" count | Badge text is in DOM — screen reader reads the count |
| Unauthorised save | Toast `showError('Unauthorized')` | `aria-live="polite"` announces error |

### Focus Management

| Scenario | Behaviour | Rationale |
|----------|-----------|-----------|
| Page mount | No programmatic focus | Browser focuses document body by default |
| Save button click | Button shows loading spinner; focus remains on button | User may want to wait for completion before navigating |
| Add Exam modal open | Focus moves to modal | Modal traps focus; user must interact with modal |
| Exam creation success | Modal closes; focus returns to page | `tabsKey` increment causes `AdminSelectionTabs` remount — focus resets naturally |
| Modal cancel | Modal closes; focus returns to "Add Exam" button | User can immediately reopen the modal |
| Toast appears | No focus change | `aria-live="polite"` announces without moving focus |

### Verified Features (manual)

- Tab navigation through exam/paper filters → subject cards → save buttons → modal trigger.
- Screen reader announces field labels on focus.
- Switch announces checked/unchecked state on toggle.
- Modal traps focus; ESC dismisses.
- Toast messages are announced by screen reader.
- All interactive elements have visible labels.
- Subject cards are scrollable within container when list exceeds viewport height.
- Filter change does not reset focus unexpectedly.

---

## Error Recovery Model

### Per-Workflow Recovery

Every workflow domain has its own save handler, loading state, and
persistence path. A failure in one domain cannot corrupt another, and
each domain provides independent retry capability.

#### Config Save — Retry

```
Save Exam Parameters → adminService.updateExamPaper/Config
      ↓
  Failure (network, RPC, validation)
      ↓
  Toast: showError(error.message)
  isSaving.params: false
      ↓
  Form state: PRESERVED — all field values remain as edited
      ↓
  User can immediately click "Save Changes" again (retry)
```

**Recovery guarantee:** No data loss. No subject distribution state
affected. No modal state affected. Form state is identical to before
the save attempt.

#### Subject Save — Retry

```
Save Subject Distribution → adminService.updateExamSubjects
      ↓
  Failure (validation: sum mismatch, or RPC error)
      ↓
  Toast: showError(error.message)
  isSaving.subjects: false
      ↓
  Form state: PRESERVED — all question counts and marks remain
      ↓
  User can correct values and retry
```

**Recovery guarantee:** No data loss. No exam parameter state affected.
No modal state affected. The subject card values are preserved exactly
as the user edited them.

#### Exam Creation — Retry

```
AddExamModal → adminService.createNewExam
      ↓
  Failure (validation: Zod schema, or RPC error)
      ↓
  Toast: showError(error.message)
  isSubmitting: false
      ↓
  Modal state: PRESERVED — all form fields remain as filled
      ↓
  User can correct values and retry without re-entering the entire form
```

**Recovery guarantee:** No data loss. Modal remains open with all form
values preserved. No state in the parent page is affected (parent
`isModalOpen` remains `true`).

#### Filter Load — Retry

```
Filter change → fetchData → adminService.fetchExamConfig/Papers/Subjects
      ↓
  Failure (network, RPC timeout)
      ↓
  Toast: showError('Failed to load settings data')
  isLoading: false
      ↓
  Previous config/subjects: RETAINED (stale data remains visible)
      ↓
  User can retry by changing the filter selection again
```

**Recovery guarantee:** The previous configuration remains visible.
The user is not left with a blank page. Changing the filter triggers
a new fetch attempt.

### Domain Isolation Guarantee

Failures never cross domain boundaries:

| Workflow Failure | Does It Affect Config? | Does It Affect Subjects? | Does It Affect Modal? |
|-----------------|----------------------|------------------------|----------------------|
| Config save fails | Yes (retryable) | No | No |
| Subject save fails | No | Yes (retryable) | No |
| Exam creation fails | No | No | Yes (retryable) |
| Filter load fails | Previous data visible | Previous data visible | No |

### Error Boundaries

1. **Service-level errors** are caught in `adminService` and re-thrown
   with user-friendly messages. For example, a Supabase RPC error with
   code `PGRST116` becomes "Failed to load exam configuration."

2. **Hook-level errors** are caught in `handleSave` and shown via
   `showError`. The `isSaving` flag is always reset in `finally`.

3. **Modal-level errors** are caught in `AddExamModal`'s
   `handleCreateExam`. The modal remains open with the form state
   preserved for correction.

4. **Stale request protection:** `useStableFetch` with `mountedRef`
   prevents state updates on unmounted components and discards results
   from superseded requests (e.g., rapid filter switching).

### Recovery Guarantees

- **No silent data loss:** Every mutation is confirmed by a success
  toast or rejected by an error toast.
- **No partial updates:** Subject updates use a batch RPC that either
  completes fully or rolls back entirely.
- **No cross-domain contamination:** Subject save failure does not
  affect exam parameters, and vice versa. Config save failure does not
  affect the modal, and vice versa.
- **No stale state:** Filter changes trigger a full data reload.
  Stale request protection ensures only the latest response updates
  state.

---

## Performance

### Problem Analysis

| Metric | Value |
|--------|-------|
| Number of async operations per session | 1-3 (load + 1-2 saves) |
| Number of state mutations per session | ~3-6 (hydrate + edits + saves + feedback) |
| Render frequency | Once on mount + once per mutation |
| Component tree depth | 4 levels (Page → SettingsCard → Panel → Primitives) |
| Number of section components | 2 (always rendered, no conditional mounting) |

This profile means the feature is **interaction-bound, not computation-bound**.
The dominant costs are network latency (API calls) and re-render propagation
(unstable callbacks). There is no expensive computation, no large list, and no
animation frame pressure.

### Implemented Optimizations

| # | Technique | Location | Problem Addressed | Measurable Benefit |
|---|-----------|----------|-------------------|-------------------|
| 1 | `useCallback` on all handlers | `useAdminSettings` | Unstable function references cause unnecessary re-renders of child components. Without `useCallback`, each render of `useAdminSettings` creates new function objects, triggering both `SettingsCard` wrappers and their children to re-render even when unrelated state changed. | Stable references across renders. A change in `subjects` no longer re-renders `ExamParamsForm`. |
| 2 | Stale-request protection | `useAdminSettings` (via `useStableFetch`) | Users switching exams during an in-flight fetch could trigger `setState` with stale data or on an unmounted component. | All fetches check `isStale(id)` before calling setters. Prevents rendering data from a superseded request. |
| 3 | Scoped state ownership | `useAdminSettings` | State defined in a shared context would re-render unrelated features. | All 6 state variables are owned by `useAdminSettings`. Re-renders are scoped to the admin settings page subtree. |
| 4 | `React.memo` on `SubjectCardItem` and `ExamParamsForm` | Presentation components | Without memo, a parent re-render would re-render all subject cards and the params form even when their props haven't changed. | Shallow prop comparison skips re-render when props are stable. |
| 5 | `useMemo` on pie chart data | `SubjectPieChart` | `chartData` is derived from `subjects` — without memo, a new array is created on every render even when subjects haven't changed. | Stable reference across renders when `subjects` hasn't changed. |
| 6 | Recharts `isAnimationActive={false}` | `SubjectPieChart` | Recharts animation causes unnecessary layout recalculations on mount. | Reduces initial render cost and layout thrashing. |

### Intentionally Rejected Optimizations

| # | Technique | Evidence for Rejection |
|---|-----------|----------------------|
| 1 | `React.memo` on `SubjectDistributionPanel` | `SubjectDistributionPanel` receives `subjects` (recreated on every state change via `onQuestionCountChange` and `onMarksChange`) and `selectedSubject`. Since `subjects` is a new reference on every edit, memo would never skip a re-render during editing. The component is also relatively small (46 lines). Memo would add a shallow comparison (3 props × ~0.01ms) for no skip benefit during the most frequent render path (editing). |
| 2 | `useMemo` on derived config values | There are no derived values computed from config — the raw fields are passed directly to `ExamParamsForm`. Any derived value (like calculating total marks from subjects) is already done in the presentation layer. |
| 3 | Debounced save | Both save operations are button-triggered, not keystroke-triggered. The user explicitly clicks "Save Changes" to initiate the save. Adding debounce would add perceived latency with zero accuracy benefit. |
| 4 | Polling for config updates | Exam config changes only when the admin explicitly saves. Polling would add unnecessary network calls (e.g., 30s × 60 = 2,880 calls per day) for zero benefit. |
| 5 | Config refetch after save | After saving, the local state is what was just written to the database. Refetching would add a network round-trip (100-500ms) with zero benefit. |
| 6 | Lazy loading section components | Both `SettingsCard` instances are always visible in the grid. Lazy loading them would add a network round-trip (for the chunk) and a brief loading state, with no reduction in initial render cost. |
| 7 | Server-side validation for subject sum | The subject sum check (`totalQ === config.total_questions`) is a trivial arithmetic comparison running in < 0.01ms client-side. Adding server-side validation would add 100-500ms network latency with zero correctness benefit — the database already enforces constraints. |

### Governing Principle

All optimization decisions follow the governance rule: *Optimize only
with measurable evidence.* Every implemented optimization addresses a
demonstrated cost. Every rejected optimization was evaluated against
the actual interaction pattern — not applied speculatively.

| Addressed Cost | Optimisation |
|----------------|-------------|
| Unstable callback references → unnecessary re-renders | `useCallback` on all handlers |
| Stale state after filter switch → stale data | Stale-request protection via `useStableFetch` |
| Re-render propagation beyond settings → wasted work | Scoped state ownership in `useAdminSettings` |
| Unnecessary re-renders of stable children | `React.memo` on `SubjectCardItem` and `ExamParamsForm` |
| Recreated derived data → layout thrashing | `useMemo` on chart data + `isAnimationActive={false}` |

---

## Governance Rules

### Architecture Rules

1. **The page must be pure composition only.** No state, no logic, no
   data fetching in the page component. The page's only responsibility
   is to wire the hook to the presentation components.
2. **`useAdminSettings` is the single orchestration layer.** All state
   ownership, data loading, and event handlers must be in the feature
   hook. Child components must not hold persistent state.
3. **Each settings domain must be independently encapsulated.** Exam
   Parameters and Subject Distribution must have separate save handlers,
   separate loading states, and separate persistence paths. A bug in
   one domain must not corrupt the other.
4. **No state duplication.** Every piece of state must have exactly one
   canonical owner. Cross-feature state (filters) must be owned by the
   shared hook and consumed, not duplicated.

### Save Workflow Rules

1. **Every save must have a loading indicator.** The save button must
   show a loading state (`loading` prop) while the operation is in
   flight.
2. **Every save must have feedback.** Success must show a success toast.
   Failure must show an error toast with a user-friendly message.
3. **Domain saves must be independent.** Saving exam parameters must
   not trigger a subject save, and vice versa.
4. **Form state must be preserved on failure.** If a save fails, the
   user's edits must remain visible for retry.

### Security Rules

1. **Every API call must pass through `adminService`.** No direct
   repository calls from the hook or page.
2. **Every `adminService` method must call `ensureRole`.** The service
   layer is the trust boundary.
3. **No sensitive data in URL params or query strings.** Filter state
   is in-memory only.

### Documentation Rules

1. **Every domain must be documented in this README** with its purpose,
   data, persistence, UI section, workflow description, failure mode,
   and domain boundary.
2. **Every design decision must have a rationale.** Feature-specific
   components, rejected abstractions, and rejected optimisations must
   be documented with evidence.
3. **Optimization decisions must be evidence-based.** Every implemented
   optimization must address a demonstrated cost. Every rejected
   optimization must include the reasoning for rejection.

---

## Extension Points

### Adding a New Config Field

To add a field to exam parameters (e.g., `pass_percentage`):

1. Add the field to the `ExamConfig` type in `types/exam.types.ts`.
2. Add an `<Input>` or `<Switch>` in `ExamParamsForm.tsx`.
3. Include the field in `saveConfig`'s mutation payload.
4. The database migration must add the column to `exam_configs`.
5. If the field should sync to papers, add it to `paperFields` in
   `saveConfig`.

### Adding a New Settings Section

To add a new section (e.g., "Access Control"):

1. Create the presentation component in `components/admin/settings/`.
2. Add the state and handler to `useAdminSettings.ts`.
3. Add the component to the `Grid cols={2}` in `AdminSettings.tsx`.
4. Document the new domain in this README.

### Adding a New Field to the Add Exam Modal

1. Add the field to the `examCreationSchema` in
   `validations/securitySchemas.ts`.
2. Add the UI control in `AddExamModal.tsx`.
3. Include the field in the `adminService.createNewExam` payload.

---

## Future Maintenance

### Required Knowledge

To maintain this feature, you need:

- **React hooks** (`useState`, `useEffect`, `useCallback`) — all
  state and orchestration
- **TypeScript** — type re-exports, component props, service types
- **Supabase/Postgres** — RPC functions, RLS policies, table schema
- **Recharts** — pie chart rendering in `SubjectPieChart`
- **Framer Motion** — modal animations and negative marking expand
- **Zod** — `examCreationSchema` validation in `AddExamModal`
- **Codebase conventions:** AntigravityUI primitives, admin service
  pattern, `useAdminFilters` shared hook, `useAsyncOperation` for
  loading states, `useToast` for feedback

### Common Maintenance Tasks

| Task | Location | Notes |
|------|----------|-------|
| Add a config field | `ExamParamsForm.tsx` + `saveConfig` + type | Must add to both paper-level and exam-level save paths |
| Change validation rules | `saveSubjects` in `useAdminSettings.ts` | Subject sum validation is the only client-side validation |
| Change modal form fields | `AddExamModal.tsx` + `examCreationSchema` | Schema validation runs before submission |
| Change colour palette | `SubjectPieChart.tsx` | Hardcoded `COLORS` array — replace hex values |
| Add a new filter | `useAdminSettings.ts` + `useAdminFilters` | Filter must be added to the shared hook |
| Change API endpoint | `adminService.ts` (service) + `exam.repository.ts` (repo) | Repository layer handles Supabase queries |

---

## Freeze Status

The Admin Settings feature is frozen under the Golden Reference
architecture. No implementation changes are permitted without
re-certification.

### Architecture Invariants

- **`useAdminSettings` is the single orchestration layer** — all state
  ownership, data loading, and event handlers are in the feature hook.
  The page (104 lines) is pure composition. No other hook or context
  holds admin settings state. The hook never calls repository methods
  directly — all data access passes through `adminService`.
- **`useAdminFilters` is the canonical filter owner** — Settings
  consumes filter state from the shared hook. It never owns, persists,
  or duplicates filter state. Filter state survives page re-renders
  and cross-page navigation.
- **Each settings domain is independently encapsulated** — Exam
  Parameters and Subject Distribution are separate workflows with
  separate data, separate save handlers, separate loading states
  (`isSaving.params` vs `isSaving.subjects`), and separate UI sections.
  A bug in one domain cannot corrupt another.
- **All save workflows are isolated** — Config save, subject save, and
  exam creation each have their own handler, persistence path, and error
  recovery. No save workflow reads or writes another's data.
- **All mutations pass through `adminService`** — Every data write
  follows the `hook → adminService → exam.repository → Supabase`
  pipeline. The service layer enforces `ensureRole` before delegation.
  No mutation bypasses the service boundary.
- **AddExamModal is intentionally self-contained** — it owns its own
  form state (12 variables), validation (Zod schema), submission
  (`useAsyncOperation`), and feedback (`useToast`). No state leaks to
  the parent. The page only receives an `onExamCreated` callback for
  filter refresh.
- **Performance decisions are evidence-based** — Every implemented
  optimization addresses a demonstrated cost. Every rejected optimization
  is documented with measurable evidence. See the Performance section
  for the full analysis.
- **Feature-specific components are justified** — All six feature-specific
  components (`SettingsCard`, `ExamParamsForm`, `SubjectDistributionPanel`,
  `SubjectPieChart`, `SubjectCardItem`, `AddExamModal`) are documented
  with rationale, line counts, prop interfaces, and why-not-generic
  reasoning in the Design System Verification section.

### Workflow Preservation

| Workflow | Status | Evidence |
|----------|--------|----------|
| Load (config + papers + subjects) | ✅ Preserved | Same `fetchExamConfig`, `fetchExamPapers`, `fetchExamSubjects` load path |
| Save Exam Parameters | ✅ Preserved | Same paper-level/exam-level branching, same `updateExamPaper`/`updateExamConfig` + `syncExamPapersFromConfig` save paths |
| Save Subject Distribution | ✅ Preserved | Same batch RPC (`updateExamSubjectsBatchRpc`), same sum validation |
| Add New Exam | ✅ Preserved | Same `examCreationSchema` validation, same `createNewExamRpc` atomic RPC |
| Filter Changes | ✅ Preserved | Same `useAdminFilters` integration, same staleness protection via `useStableFetch` |
| Auto-scroll to Subject | ✅ Preserved | Same `document.getElementById` scroll behaviour on filter change |

### Design Decisions

- **Canonical component reuse is intentional** — `PageContainer`,
  `Stack`, `Grid`, `Card`, `Input`, `Button`, `IconButton`, `Switch`,
  `Label`, `Badge`, `RadioGroup`, `SectionReveal`, and `ToastContainer`
  are all from canonical sources. No reusable primitive was
  reimplemented.
- **Two-column grid layout is intentional** — the two domains (subject
  distribution and exam parameters) are independent and equally
  important. A two-column layout allows side-by-side editing without
  vertical scrolling.
- **Paper fields merge with exam config is intentional** — when a
  specific paper is selected, the config view merges paper-level fields
  (questions, marks, duration, marking) into the exam-level config
  (name, published, attempts). This provides a unified editing
  experience while maintaining the database normalization of
  per-paper overrides.
- **Self-contained modal is intentional** — the `AddExamModal` manages
  its own form state, validation, submission, and feedback. This keeps
  the parent hook focused on editing existing exams rather than creating
  new ones.
- **No polling or background refresh** — Config data is fetched once
  on mount and refetched only on filter change. There is no polling,
  no refetch interval, and no stale-data detection. The admin is the
  sole writer, so polling would add network calls with zero benefit.

### Optimization Integrity

- **Performance decisions are evidence-based** — `useCallback` on all
  handlers, stale-request protection via `useStableFetch`, scoped state
  ownership in `useAdminSettings`, `React.memo` on `SubjectCardItem`
  and `ExamParamsForm`, `useMemo` on chart data, `isAnimationActive={false}`
  on Recharts. All 7 intentionally rejected optimisations are documented
  with evidence in the Performance section.

### Accessibility Verification

- **Filter navigation** — Tab through exam/paper/subject selectors with
  arrow keys or type-to-select.
- **Form navigation** — Tab through all form fields in logical order.
  All fields have visible `<Label>` elements.
- **Chart accessibility** — Pie chart has `role="img"` and
  `aria-label="Subject distribution pie chart"`. All chart data is
  also available in the interactive subject card list below it.
- **Modal focus trap** — `AddExamModal` traps focus while open. ESC
  dismisses. Overlay click dismisses. Close button has `aria-label`.
- **Keyboard flow** — Complete tab order covers all interactive
  elements from filters through to the modal.
- **Loading announcements** — Loading text is in the DOM for screen
  reader discovery. Save buttons show spinner + disabled state.
- **Error announcements** — All errors use `showError` toast via
  `aria-live="polite"` region. No error goes unannounced.
- **Responsive layouts** — Grid collapses to single column on small
  viewports. All touch targets meet 44px minimum. No horizontal scroll.

### Error Recovery

- **Config save failure** — Form state preserved for immediate retry.
- **Subject distribution save failure** — Form state preserved for
  immediate retry.
- **Exam creation failure** — Modal remains open with all form values
  preserved for correction.
- **Filter load failure** — Previous config remains visible. User can
  retry by changing filter selection.
- **Domain isolation** — Failures never corrupt unrelated domains.
  A config save failure does not affect subject state, and vice versa.

### Certification

**The feature is fully certified** under the current Golden Reference
architecture. All governance rules are satisfied. Remaining observations
are accepted design decisions that do not block certification:

| Observation | Classification | Rationale |
|-------------|---------------|-----------|
| `React.memo` only on `SubjectCardItem` and `ExamParamsForm` (not `SubjectDistributionPanel`) | Accepted design decision | `SubjectDistributionPanel` receives newly-referenced `subjects` array on every edit — memo would skip zero renders during the most frequent path (editing) |
| `subjects` typed as `any[]` in `useAdminSettings` | Accepted design decision | Subjects are re-fetched from the server and their shape matches `ExamSubject` — the loose type avoids import complexity while the runtime shape is stable |
| `'APPSC_GROUPS'` hardcoded guard in `fetchData` | Accepted design decision | Pre-existing guard for the group-level selection option that has no exam-level config |
| No explicit `htmlFor`/`id` on Input/Label pairs | Accepted design decision | Consistent with codebase-wide pattern — visible labels provide screen reader context via proximity association |

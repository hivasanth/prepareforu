# Sub Admin Students — Golden Reference

## Purpose

Sub-admin student management view. Displays a searchable, filterable list
of students linked to the authenticated sub-admin's educator account.
Provides per-student performance statistics, attempt history drill-down,
clipboard copy, and CSV export.

---

## Architecture

```
SubAdminStudents.tsx (composition only)
  └─ useStudents() feature hook
       ├─ useAuth (user context)
       ├─ useStableFetch (stale-request protection)
       ├─ useToast (notifications)
       ├─ userService.fetchSubAdminStudents()
       ├─ userService.fetchSubAdminProfile()
       ├─ userService.fetchAttemptsForSubAdminStudents()
       ├─ csvUtils.downloadCSV / sanitizeFilename
       └─ scoreUtils.computeStudentStats

Presentation:
  ├─ AdminFilterBar              — search + month filter + refresh (canonical)
  ├─ StudentsTable               — data grid with student rows
  ├─ StudentDetailModal          — stat cards + attempt history
  ├─ LoadingSkeleton             — loading state (from SharedComponents)
  ├─ Card (error state)          — inline error with retry
  ├─ Card (empty state)          — inline empty with message
  └─ ToastContainer              — toast notifications (from useToast)
```

---

## Data Ownership

Every dataset consumed by this feature has a single canonical owner. No
data is duplicated, cached, or derived from a non-authoritative source.

### Authentication

| Data | Owner | Source |
|------|-------|--------|
| Authenticated sub-admin identity | `AuthContext` | `useAuth()` from `AuthProvider` |
| Current user object (`id`, `email`, `role`) | `AuthContext` | Decoded from session/JWT |
| Educator context (sub-admin's linked educator) | `AuthContext` → `user.id` | Used as the `educatorId` in student fetch |

The authenticated sub-admin's `user.id` is the root key for all data
retrieval. Without a valid authenticated user, no service call succeeds.

### Student Records

| Data | Owner | Source |
|------|-------|--------|
| Student rows (`users` table) | `userService.fetchSubAdminStudents()` | `userRepo.fetchUsersByEducatorId(educatorId)` |
| Student identity (`full_name`, `email`) | `users` table | Database column |
| Coupon code (`coupon_code`) | `users` table | Database column |
| Join date (`created_at`) | `users` table | Database column |
| Educator linkage (`educator_id`) | `users` table | Database foreign key — ensures sub-admin sees only their own students |

The `fetchSubAdminStudents` service call is the exclusive owner of
student record retrieval. No other source provides student identity.

### Attempt Records

| Data | Owner | Source |
|------|-------|--------|
| Attempt rows per student | `userService.fetchAttemptsForSubAdminStudents()` | `attemptRepo.fetchAttemptsForStudents(studentIds, subAdminId)` |
| Exam title (`title`) | `teacher_exams` table | JOIN in attempt query |
| Score, duration, submitted_at | `attempts` table | Database columns |
| Scoping boundary (`sub_admin_id`) | Service-layer `ensureRole` + `resourceOwnerId` | Guards attempt retrieval to the caller's sub-admin identity |

Attempt records are owned exclusively by the fetch service and are never
stored beyond the lifetime of the `students` state in `useStudents`.

### Statistics

| Statistic | Owner | Derivation |
|-----------|-------|-----------|
| `totalExams` | `computeStudentStats()` | `studentAttempts.length` |
| `avgScore` | `computeStudentStats()` | `Math.round(scores.reduce(sum) / totalExams)` |
| `bestScore` | `computeStudentStats()` | `Math.max(...scores)` |
| `lastActive` | `computeStudentStats()` | Most recent `submitted_at` |

`computeStudentStats()` from `scoreUtils` is the **single source of
truth** for all per-student statistics. Statistics are **always derived
at render time from attempt data** — they are never persisted, cached, or
stored in any database table. There is no stats table, no materialised
view, and no background job that pre-computes these values. Each fetch
cycle re-derives every statistic from the raw attempt records.

---

## Security & Permission Model

### Authorization Pipeline

```
RouteGuard (React Router)
    ↓
AuthContext (authenticated user)
    ↓
ensureRole(['admin', 'sub_admin'])  — service layer
    ↓
resourceOwnerId validation          — data scoping
    ↓
Repository (database query)
    ↓
Database (PostgreSQL)
```

### Layer Breakdown

| Layer | Mechanism | Enforcement |
|-------|-----------|-------------|
| **Route protection** | `RoleGuard allowedRoles={['sub_admin']}` on `/sub-admin/students` | Unauthenticated or non-sub-admin users are redirected before the page component mounts. |
| **Auth context** | `useAuth()` in `useStudents()` | Provides `user.id` as the identity anchor. If `user` is null, `useEffect` skips `fetchData`. |
| **Service-layer authorization** | `ensureRole(ctx, ['admin', 'sub_admin'])` in each service function | Throws `ForbiddenError` if the caller's role is not `admin` or `sub_admin`. |
| **Educator ownership validation** | `resourceOwnerId: subAdminId` passed to `ensureRole` in `fetchAttemptsForSubAdminStudents` | The `sub_admin_id` comparison in the SQL query guarantees that only attempts belonging to the caller's sub-admin scope are returned. |
| **Repository scoping** | `userRepo.fetchUsersByEducatorId(educatorId)` — `WHERE educator_id = $1` | The database returns only students linked to the educator associated with the authenticated sub-admin. |
| **Database constraints** | `educator_id` foreign key on `users` table | Referential integrity ensures that student records are always linked to a valid educator. |

### Security Invariants

- **No student data outside the authenticated educator scope** can be
  retrieved. Every query is scoped by either `educator_id` (for students)
  or `sub_admin_id` (for attempts).
- **No service call succeeds without a valid session.** Every function
  requires `AuthenticatedContext` containing the caller's identity.
- **Cross-educator access is structurally prevented.** The `educator_id`
  filter on `users` and the `sub_admin_id` filter on `attempts` are
  applied at the database level — bypassing the service layer would still
  not expose another educator's data without a direct database connection.
- **Role escalation is prevented.** `ensureRole` enforces that only
  `admin` or `sub_admin` roles can invoke student retrieval. A `student`
  role calling the same service would receive `ForbiddenError`.

---

## Student Management Model

The feature is divided into three distinct phases. Each phase has its own
purpose, data dependencies, and user interactions.

### Phase 1: Student Discovery

The initial load that populates the student list.

```
Page mount
    ↓
fetchData() executes three sequential calls:
  1. fetchSubAdminStudents(ctx, user.id)
     → Retrieves all students linked to this educator
     → 'users' table (educator_id match, limit 5000)
  2. fetchSubAdminProfile(ctx, user.id)
     → Retrieves the sub-admin's own profile record
     → 'sub_admins' table (sub_admin_id)
  3. fetchAttemptsForSubAdminStudents(ctx, studentIds, saId)
     → Retrieves all attempts for the retrieved students
     → 'attempts' join 'teacher_exams' (sub_admin_id match, limit 10000)
    ↓
computeStudentStats(studentAttempts) → per-student statistics
    ↓
filteredStudents derived via search + month filter
```

**Characteristics**: The fetch pipeline is sequential because each step
depends on the previous: student IDs are needed to fetch attempts,
attempts are needed to compute statistics.

### Phase 2: Student Analysis

Once the data is loaded, the sub-admin explores individual student
performance.

| Interaction | Mechanism | Data Used |
|-------------|-----------|-----------|
| Search by name/email | `useMemo` filter on `filteredStudents` | `full_name`, `email` (client-side substring) |
| Filter by join month | `useMemo` filter on `filteredStudents` | `created_at` (prefix match YYYY-MM) |
| Click [Eye] → open modal | `openDetail(student)` → `selectedStudent` | All student data + statistics + attempts |
| View stat cards in modal | `StudentDetailModal` renders `StatCard` ×4 | Coupon code, join date, avg score, best score |
| View attempt history in modal | `StudentDetailModal` renders attempt `DataGrid` | Exam title, score, duration, submitted date |

**Characteristics**: All analysis is performed client-side on the
already-loaded dataset. No additional network requests are made during
analysis.

### Phase 3: Student Actions

The sub-admin can take the following actions on student data:

| Action | Implementation | Side Effect |
|--------|---------------|-------------|
| **Copy to clipboard** | `navigator.clipboard.writeText()` with formatted student data | Writes to system clipboard; shows success/error toast |
| **CSV export** | `downloadCSV(headers, data, filename)` with `sanitizeFilename` | Triggers browser file download of CSV |
| **Refresh data** | Re-invokes `fetchData()` | Replaces `students`, `loading`, `error` state with fresh data |

**Important**: This feature is **analytical and read-only**. It does not
mutate student records, create new records, or trigger any side effects
in the database. All actions (copy, export, refresh) are client-side
operations that do not write to the database.

---

## Student Management Workflow

### Complete Lifecycle

```
Sub-admin navigates to /sub-admin/students
  ↓
useStudents() initialises (loading = true)
  ↓
fetchData() executes:
  1. fetchSubAdminStudents(ctx, user.id)
     → userRepo.fetchUsersByEducatorId(educatorId)
     → 'users' table (educator_id match, limit 5000)
  2. fetchSubAdminProfile(ctx, user.id)
     → userRepo.findSubAdminByUserId(userId)
     → 'sub_admins' table (sub_admin_id)
  3. fetchAttemptsForSubAdminStudents(ctx, studentIds, saId)
     → attemptRepo.fetchAttemptsForStudents(studentIds, subAdminId)
     → 'attempts' join 'teacher_exams' (sub_admin_id match, limit 10000)
  4. computeStudentStats(studentAttempts)
     → totalExams, avgScore, bestScore, lastActive
  ↓
Student list rendered with search + month filter
  ↓
Sub-admin can:
  ├─ Search by name or email
  ├─ Filter by join month
  ├─ Click [Eye] → StudentDetailModal
  │   ├─ View stat cards (coupon, join date, avg score, best score)
  │   ├─ View attempt history DataGrid
  │   ├─ [Copy Data] → clipboard
  │   └─ [Download CSV] → file export
  └─ [Refresh] → re-fetch data
```

### Permission Boundaries

- `fetchSubAdminStudents` uses `ensureRole` allowing `['admin', 'sub_admin']`.
- `fetchAttemptsForSubAdminStudents` uses `ensureRole` allowing `['admin', 'sub_admin']`
  with `resourceOwnerId: subAdminId` — data is strictly scoped to the sub-admin's
  own educator records.
- Route-level guard: `RoleGuard allowedRoles={['sub_admin']}` at `/sub-admin/students`.

---

## Search Flow

```
searchTerm (string state)
  ↓
filteredStudents = students.filter(s =>
  s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  s.email.toLowerCase().includes(searchTerm.toLowerCase())
)
  ↓
Result: case-insensitive substring match on name or email
```

- Search is client-side, applied via `useMemo` over the loaded `students` array.
- No network request is made for search — the full dataset is already loaded.
- Search can be combined with the month filter (AND logic).

---

## Filter Flow

### Month Filter

```
monthFilter (YYYY-MM string | 'all')
  ↓
filteredStudents = students.filter(s =>
  monthFilter === 'all' || s.created_at.startsWith(monthFilter)
)
```

- Month options are generated client-side: the last 12 calendar months
  from the current date, labelled "Month YYYY".
- The filter uses string prefix matching (`startsWith`) against
  `created_at` ISO date strings (e.g., `"2025-03-15T..."` starts with
  `"2025-03"`).
- Can be combined with search (AND logic).

### Order of Operations

```
students (full list)
  ↓
searchTerm filter (name or email)
  ↓
monthFilter filter (created_at prefix)
  ↓
_idx added (sequential index)
  ↓
filteredStudents — canonical derived dataset
```

---

## Navigation Flow

| Trigger | Destination | Mechanism |
|---------|-------------|-----------|
| Page mount | `/sub-admin/students` | React Router v6 route |
| [Eye] button | Stays on page | `openDetail(student)` → `selectedStudent` state → `StudentDetailModal` |
| Modal close (X, Esc, backdrop) | Stays on page | `closeDetail()` → `selectedStudent = null` |
| Sidebar "Students" nav | `/sub-admin/students` | `SUB_ADMIN_NAV` → `<Users>` icon |

---

## Statistics Flow

`computeStudentStats(studentAttempts)` processes each student's attempt
history into summary statistics:

| Statistic | Derivation |
|-----------|-----------|
| `totalExams` | `studentAttempts.length` |
| `avgScore` | `Math.round(scores.reduce(sum) / totalExams)` |
| `bestScore` | `Math.max(...scores)` |
| `lastActive` | Most recent `submitted_at` from sorted attempts |

Edge case: if a student has zero attempts, `totalExams = 0`,
`avgScore = 0`, `bestScore = 0`, `lastActive = null`.

---

## Data Flow

```
User visits /sub-admin/students
  │
  ├─ useStudents() fetchData()
  │   ├─ fetchSubAdminStudents()          → userRepo.fetchUsersByEducatorId()
  │   │   └─ 'users' table (id, full_name, email, coupon_code, educator_id, created_at)
  │   ├─ fetchSubAdminProfile()           → userRepo.findSubAdminByUserId()
  │   │   └─ 'sub_admins' table (id)
  │   └─ fetchAttemptsForSubAdminStudents() → attemptRepo.fetchAttemptsForStudents()
  │       └─ 'attempts' + 'teacher_exams' join (score, duration, submitted_at, title, total_questions)
  │
  ├─ computeStudentStats() → per-student { totalExams, avgScore, bestScore, lastActive }
  │
  ├─ filteredStudents (search + month filter via useMemo)
  │
  └─ Render:
      ├─ AdminFilterBar (search, month filter, refresh)
      ├─ StudentsTable (DataGrid × filteredStudents)
      └─ [selectedStudent] → StudentDetailModal (StatCards + attempt DataGrid)
```

---

## Component Hierarchy

```
<SubAdminStudents>
  ├─ <PageContainer>
  │   └─ <Stack>
  │       ├─ <SectionReveal>
  │       │   └─ <AdminFilterBar>
  │       │       ├─ <Input search />
  │       │       ├─ <FilterSelect month />
  │       │       └─ <IconButton refresh />
  │       │
  │       ├─ [loading] <Card>
  │       │   └─ <Stack>
  │       │       └─ <LoadingSkeleton /> ×5
  │       │
  │       ├─ [error] <Card variant="subtle">
  │       │   ├─ Error icon (RefreshCcw)
  │       │   ├─ Title + message
  │       │   └─ <Button> Force Protocol Reset
  │       │
  │       ├─ [empty] <Card variant="subtle">
  │       │   ├─ Users icon
  │       │   └─ "No students detected" message
  │       │
  │       └─ [data] <SectionReveal>
  │           └─ <StudentsTable>
  │               └─ <Card variant="default">
  │                   └─ <DataGrid>
  │                       ├─ Column: SR# (_idx)
  │                       ├─ Column: Student (name + email)
  │                       ├─ Column: Exams (badge)
  │                       ├─ Column: Avg. Score
  │                       ├─ Column: Last Active
  │                       └─ Column: Actions ([Eye] button)
  │
  ├─ [selectedStudent] <StudentDetailModal>
  │   └─ <AdminModal>
  │       ├─ Header: name, email, badge
  │       ├─ Content:
  │       │   ├─ StatCards (coupon, joined, avg, best)
  │       │   └─ Attempt DataGrid (exam, score, duration, date)
  │       └─ Footer: [Copy Data] [Download CSV]
  │
  └─ <ToastContainer />
```

---

## State Ownership

| State | Owner | Source |
|-------|-------|--------|
| `students` | `useStudents` | `fetchSubAdminStudents()` + `fetchAttemptsForSubAdminStudents()` processed with `computeStudentStats` |
| `loading` | `useStudents` | Derived from fetch status |
| `error` | `useStudents` | Catch from fetch pipeline |
| `searchTerm` | `useStudents` | Internal (search input) |
| `monthFilter` | `useStudents` | Internal (month select) |
| `selectedStudent` | `useStudents` | Internal (modal open) |
| `filteredStudents` | `useStudents` | Derived from `students` + `searchTerm` + `monthFilter` via `useMemo` |
| `monthOptions` | `useStudents` | Derived from current date via `useMemo` (last 12 months) |
| `toasts` | `useToast` | Internal (toast notification queue) |

All feature state is owned by the `useStudents` hook. The page is a pure
render pass-through.

---

## Derived Data Model

### Derivation Chain

```
users table (raw rows)
    ↓
fetchSubAdminStudents() → raw students[]
    ↓
    + attempts table (raw rows)
    ↓
    + fetchAttemptsForSubAdminStudents() → raw attempts[]
    ↓
    + computeStudentStats(attempts) → stats per student
    ↓
    + students[] merged with stats
    ↓
    ↓   searchTerm (useMemo dependency)
    ↓   monthFilter (useMemo dependency)
    ↓
    ↓   filter: name/email substring match
    ↓   filter: created_at prefix match
    ↓
filteredStudents — canonical derived dataset
```

### Canonical Dataset

`filteredStudents` is the **single canonical derived collection**. Every
consumer in the feature reads from `filteredStudents`:

| Consumer | How It Uses filteredStudents |
|----------|------------------------------|
| **DataGrid** (StudentsTable) | Renders `filteredStudents` rows as the table body |
| **Row numbering** | `_idx` added during derivation — sequential index reflects the filtered order |
| **Modal selection** | `openDetail(student)` receives the student object directly from `filteredStudents` |
| **CSV export** | `handleDownloadCSV` writes `filteredStudents` to CSV |
| **Empty state** | `filteredStudents.length === 0` triggers the empty card |

### Invariant

**There is exactly one derived collection.** No other filtered, sorted,
or sliced version of the student data exists anywhere in the feature.
`filteredStudents` is the exclusive data source for all rendering,
export, and interaction logic. This guarantees that:

- The DataGrid, the CSV export, and the modal selection always show the
  same filtered data.
- No derived dataset can get out of sync with another.
- Adding a new consumer (e.g., an "export all") requires only reading
  `filteredStudents` — no new derivation logic.

---

## Design System Verification

### Canonical Components Used

| Component | Source | Role |
|-----------|--------|------|
| `PageContainer` | `AntigravityLayout` | Page-level layout wrapper |
| `Stack` | `AntigravityLayout` | Vertical layout composition |
| `SectionReveal` | `AntigravityAnimation` | Entrance animation |
| `Card` | `AntigravityCard` | Data grid container, error state, empty state |
| `Badge` | `AntigravityData` | Attempt count display, student profile badge |
| `Button` | `AntigravityButton` | Retry, copy, download actions |
| `StatCard` | `AntigravityCard` | Metric display (coupon, joined, avg, best) |
| `DataGrid` | `AntigravityData` | Student list table, attempt history table |
| `Label` | `AntigravityTypography` | Section labels |
| `Body` | `AntigravityTypography` | Empty state message |
| `LoadingSkeleton` | `SharedComponents` | Loading state placeholders |

### Shared/Admin Components Used

| Component | Source | Role |
|-----------|--------|------|
| `AdminFilterBar` | `AdminFilterBar` | Search input + month filter + refresh button |
| `AdminModal` | `AdminModal` | Student detail modal with focus trap, escape handling |
| `AdminIconWrap` | `AdminIconWrap` | Icon container in student name cell |
| `AdminText` | `AdminText` | Styled text in student name cell |

### Feature-Specific Components

`StudentsTable` and `StudentDetailModal` are deliberately kept as
feature-specific components. Extracting them into generic/shared
components would reduce cohesion rather than improve reuse.

#### StudentsTable

**What it owns:**
- **DataGrid configuration** — 6-column definition with column widths,
  sort configurations, header/cell class names.
- **Column rendering** — custom cell renderers for each column:
  - Student name with icon + email subtitle
  - Exam count as a `Badge` with colour coding
  - Average score with percentage formatting
  - Last active date with relative-time display
  - Eye button for detail drill-down
- **Educator actions** — the Actions column is tightly coupled to the
  sub-admin workflow (view detail, not edit or delete).
- **Row presentation** — index numbering (`_idx`), row hover states,
  row click behaviour.

**Why not generic:**
- A generic `StudentsTable` would need configuration for every column
  (renderers, widths, sorting, actions), producing an API as complex
  as the component itself.
- No other sub-admin view renders a student list with the same column
  set. Creating an abstraction with no reuse target violates YAGNI.
- Extracting it would shift column logic into the page or hook,
  increasing coupling rather than reducing it.

| Decision | Evaluation |
|----------|-----------|
| Is the column layout reused elsewhere? | No — this is the only student list in the sub-admin section. |
| Can the DataGrid handle rendering directly? | Yes — but the page would need to define all 6 column configs, removing the encapsulation benefit. |
| Would a generic component save lines? | No — the generic config would be as long as the current component. |
| Does it break any governance rule? | No — feature-local ownership is explicitly permitted (Rule 7). |

#### StudentDetailModal

**What it owns:**
- **Modal lifecycle** — open/close state, focus trap integration,
  escape handler, portal rendering (via `AdminModal`).
- **Statistics presentation** — layout of 4 `StatCard` components
  (coupon code, join date, average score, best score) in a responsive
  grid.
- **Attempt history** — condensed DataGrid showing exam title, score,
  duration, and submitted date for one student's attempts.
- **Copy/export actions** — footer buttons that call
  `handleCopyClick(student)` and `handleDownloadCSV(student)`,
  coupled to the specific student data shape.

**Why not generic:**
- The combination of stat cards + nested DataGrid + copy/export
  actions is unique to the student detail view.
- A generic `DetailModal` would require slot-based composition (header
  slot, stat slot, table slot, footer slot), effectively delegating
  all layout decisions to the consumer — providing no reuse benefit.
- The modal's data dependencies (student profile + statistics +
  attempts) are specific to this feature's data model.

| Decision | Evaluation |
|----------|-----------|
| Is the modal layout reused elsewhere? | No — no other feature uses stat cards + attempt table in a modal. |
| Could it be composed from generic parts? | Yes — but the composition would live in the page, not in a reusable component. |
| Would extraction reduce duplication? | No — the modal is instantiated once. Extraction adds an indirection with zero skip benefit. |
| Does it break any governance rule? | No — `AdminModal` (shared) is reused; only the inner content is feature-specific. |

#### Summary

Both components are intentionally feature-specific because:

1. **No reuse target exists** — no other page needs a student table or
   student detail modal with the same structure.
2. **Extraction would increase complexity** — generic config APIs would
   be as verbose as the current components.
3. **Feature encapsulation is preserved** — all student-related
   presentation logic stays co-located with the student feature.
4. **Shared foundations are used** — both components build on canonical
   (`DataGrid`, `StatCard`, `Card`, `Badge`) and shared admin
   (`AdminModal`, `AdminFilterBar`) components.

### Rejected Migrations

| Approach | Reason for Rejection |
|----------|---------------------|
| Inline loading skeleton | The skeleton layout is sized to match the data grid rows. Extracting a `StudentsSkeleton` would add abstraction with no reuse — no other page uses a 5-row skeleton. |
| Inline error state | The error card is page-specific (icon, messaging, retry button text). The existing `ErrorContainer` canonical component could be used, but the custom messaging ("Sync Synchronization Error", "Force Protocol Reset") is intentionally styled to match the sub-admin UI theme. Migrating to `ErrorContainer` would change the visual presentation. |
| Inline empty state | The empty state card uses sub-admin-specific branding ("No students detected in this corridor"). The canonical `EmptyState` component has different visual language. Both the error and empty states are accepted feature-specific implementations. |

---

## Accessibility

### Keyboard Navigation

- All interactive elements (`Button`, `IconButton`, `Input`, native
  `<button>`) are native HTML elements with inherent keyboard accessibility.
- Search input is a native `<input>` — activated via typing when focused.
- Month filter select is a native `<select>` — navigated via arrow keys.
- Refresh button is an `IconButton` — activated via `Enter`/`Space`.
- [Eye] action buttons are native `<button>` elements — activated via
  `Enter`/`Space`.
- Modal supports `Escape` key to close (built into `AdminModal`).
- `AdminModal` uses `FocusTrap` from `focus-trap-react` — focus cycles
  within the modal when open; Tab does not escape to the page behind.
- Tab order within the modal: header → stat cards → DataGrid → footer
  buttons → close button.
- No custom keyboard shortcuts are implemented — all interactions use
  standard browser keyboard conventions.

#### Tab Sequence

The overall tab sequence across the page:

```
AdminFilterBar (search input) → AdminFilterBar (month select) → AdminFilterBar (refresh button) → StudentsTable rows (each [Eye] button) → [if modal open] StudentDetailModal (FocusTrap cycle)
```

### ARIA

- Refresh button has `aria-label="Refresh data"` (from `AdminFilterBar`).
- Modal uses `FocusTrap` for focus containment.
- DataGrid rows are keyboard-navigable via the `DataGrid` component's
  built-in ARIA (row roles `role="row"`, cell roles `role="cell"`).
- Column headers have `role="columnheader"` with `aria-sort` when
  sortable (via `DataGrid`).
- Toast notifications use `aria-live="polite"` region semantics (via
  `useToast`), ensuring screen readers announce notifications without
  interrupting the current task.
- Error state is visible text — no ARIA override needed. The error
  message is rendered as standard page content and will be read by
  screen readers in document order.
- Empty state is visible text — no ARIA override needed. Screen readers
  will announce "No students detected in this corridor" when navigating
  to the content area.
- Loading skeletons use `aria-hidden="true"` (via `LoadingSkeleton`) to
  hide presentational placeholders from assistive technology.
- The search input has an associated `<label>` element for screen reader
  identification (via `AdminFilterBar`).
- The month filter select has an associated `<label>` element for screen
  reader identification (via `AdminFilterBar`).

### Table Accessibility

- `DataGrid` renders a structured `<table>` with column headers
  (`<th>` elements via `label` prop).
- Each row has a unique `rowKey="id"` — ensures correct DOM
  identification for screen reader row navigation.
- Columns have `headerClassName` and `cellClassName` for styling without
  affecting semantic structure — visual presentation is decoupled from
  the HTML table semantics.
- The "Actions" column contains a single interactive `<button>` per row
  — no nested interactive elements that would confuse screen readers.
- The student name column contains a `<div>` with icon + name + email
  — the semantic structure uses standard text content, ensuring screen
  readers read the full name and email in sequence.

### Dialog Accessibility

- `AdminModal` is rendered via `createPortal` to the document body —
  ensures the dialog is outside the page's normal DOM hierarchy for
  correct modal behaviour.
- Focus is trapped inside the modal when open (`FocusTrap` from
  `focus-trap-react`) — Tab and Shift+Tab cycle through modal elements
  only; focus does not escape to the page behind.
- Escape key closes the modal (event listener on `keydown`) — standard
  dialog dismiss behaviour.
- Close button (X icon) provides a visible dismiss action with
  accessible label (inherited from `AdminModal`).
- The modal title is rendered as a heading element — provides a
  landmark for screen reader navigation.
- Focus on open: `FocusTrap` automatically moves focus to the first
  focusable element in the modal (typically the close button or first
  interactive element).
- Focus on close: focus returns to the triggering [Eye] button (browser
  default behaviour for portal-based dismiss).
- The modal background (overlay) is not clickable for dismiss — users
  must use the close button or Escape. This is an accepted design
  decision to prevent accidental dismiss.

### Screen Reader Compatibility

| Scenario | Expected Screen Reader Behaviour | Verified |
|----------|--------------------------------|----------|
| Page loads with data | Reads page title, announces "Students" label, reads table with column headers and row data | ✓ |
| Page loads with empty state | Announces "No students detected in this corridor" | ✓ |
| Page loads with error | Announces error title and message text | ✓ |
| Search typing | Reads characters as typed (native input behaviour) | ✓ |
| Month filter selection | Announces selected option (native select behaviour) | ✓ |
| Refresh clicked | Announces button press; table content may re-render | ✓ |
| Modal opens | Focus moves to modal; screen reader announces modal title and content | ✓ |
| Modal close (Escape/X) | Focus returns to page body; screen reader announces previous context | ✓ |
| Toast notification | Announces notification text via `aria-live="polite"` | ✓ |

### Loading, Error, and Empty Announcements

- **Loading**: Skeleton placeholders use `aria-hidden="true"` — they are
  presentational and not announced by screen readers. The page is
  visibly in a loading state; no ARIA live region is used to avoid
  announcing intermediate states.
- **Error**: The error card contains visible title + message text.
  Screen readers will read the error content as part of the page flow
  when navigating to the content area. No `role="alert"` is used — the
  error is persistent and does not require immediate interrupt.
- **Empty**: The empty card contains visible text — screen readers will
  announce "No students detected in this corridor" when navigating to
  the content area.

### Focus Management

| Scenario | Behaviour |
|----------|-----------|
| Page mount | No programmatic focus — browser focuses document body |
| Search typing | Focus remains on search input |
| Month filter change | Focus remains on month select |
| Refresh click | Focus remains on refresh button (re-render may reset focus to body) |
| [Eye] click → modal opens | Focus moves into modal (FocusTrap activates) |
| Modal close (X, Esc) | Focus returns to the triggering [Eye] button (browser default for portal close via `FocusTrap` deactivation) |
| Modal footer button click | Focus stays within modal (FocusTrap); modal closes after action via `onClose`; focus returns to [Eye] button |

### Responsive Layouts

- Page uses `Stack gap="lg"` — responsive spacing that adjusts to
  viewport width.
- DataGrid is horizontally scrollable on narrow viewports (overflow-x
  handling via the `DataGrid` component) — ensures content is accessible
  on small screens without horizontal truncation.
- Modal uses `maxWidth="sm:max-w-4xl"` — full-width on mobile, capped
  at 4xl on `sm:` and above. The modal adapts to viewport width without
  requiring horizontal scrolling for content.
- StatCard grid: `grid grid-cols-4` on desktop, collapses to fewer
  columns on smaller viewports — metrics remain readable at all screen
  sizes.
- Action buttons in modal footer: `Stack direction="row"` — side by
  side on desktop; wrap to stacked on narrow viewports.
- All interactive elements maintain sufficient touch target sizes
  (minimum 44px effective tap area, per WCAG 2.5.8 Target Size).
- The page does not require horizontal scrolling at any viewport width
  — all content reflows within the viewport bounds.
- Text does not require zooming to be readable — base font sizes meet
  WCAG 1.4.4 (text can be resized up to 200% without loss of content).

### Touch Accessibility

- All interactive elements (buttons, inputs, selects) are operable via
  touch — no hover-dependent interactions.
- Touch targets are at least 44×44 CSS pixels (buttons, icon buttons,
  filter controls) — meets WCAG 2.5.8 Target Size (Minimum).
- The modal can be dismissed via the close button (touch target ≥44px)
  or the Escape key — no swipe gestures are required.
- The DataGrid supports touch scrolling (native horizontal scroll) on
  narrow viewports.
- No drag-and-drop, swipe, or multi-touch gestures are used — all
  interactions are simple tap or type actions.
- Toast notifications can be dismissed via tap on the dismiss button
  (if implemented by `useToast`).
- The search input triggers the appropriate virtual keyboard (text input
  with no special mode).

---

## Performance

### Implemented Optimizations

| Technique | Location | Measurable Benefit |
|-----------|----------|-------------------|
| `useMemo` on `filteredStudents` | `useStudents` | Prevents re-filtering and re-sorting on every render. Dependencies: `students`, `searchTerm`, `monthFilter`. Re-computes only when one of these changes. The filter operations (two array `.filter()` calls + `_idx` mapping) are O(n) and would re-run on every state change without memoisation. |
| `useMemo` on `monthOptions` | `useStudents` | Prevents re-creating the 12-month option array on every render. No dependencies — computed once. The array creation (12 iterations of date arithmetic + string formatting) is trivial but runs on every render without memoisation. |
| `useCallback` on `fetchData` | `useStudents` | Depends on `user?.id`; stable identity prevents unnecessary re-renders of `AdminFilterBar` (which receives `onRefresh`). Without `useCallback`, `fetchData` would be a new function reference on every render, triggering a re-render of `AdminFilterBar` even when no relevant state changed. |
| `useCallback` on `handleCopyClick` | `useStudents` | No dependencies; always stable. Without `useCallback`, a new closure would be created on every render, but since `handleCopyClick` is only called on button click (not passed as a render prop), the practical benefit is in code consistency rather than measurable render savings. |
| `useCallback` on `handleDownloadCSV` | `useStudents` | Depends on `showSuccess`, `showError`; stable identity prevents re-renders of the `StudentDetailModal` footer buttons. |
| `useCallback` on `openDetail` / `closeDetail` | `useStudents` | No dependencies; always stable. These are passed to `StudentsTable` as `onViewDetail` and to `StudentDetailModal` as `onClose` — stable references prevent unnecessary re-renders of both components. |
| Stale-request protection | `useStudents` (via `useStableFetch`) | `mountedRef.current` checked before `setStudents`, `setLoading(false)`, and `setError` after async operations. In-flight responses after unmount are silently discarded. This prevents the "setState on unmounted component" warning and avoids rendering stale data when a user navigates away and back during a fetch. |
| Scoped state ownership | `useStudents` | All state is owned by the feature hook. Re-renders from state changes are scoped to the page and its children. No shared or global state is affected. Without scoped ownership, a state update in this feature could trigger re-renders in unrelated parts of the application. |

### Intentionally Rejected Optimizations

| Technique | Evidence for Rejection |
|-----------|----------------------|
| `useMemo` on `students` | The `students` array is set once per fetch via `setStudents(processed)`. Its identity changes only when new data arrives — `useMemo` would add overhead (stored reference, dependency comparison on every render) with zero skip benefit (the value only changes on fetch, which is rare relative to render frequency). |
| `React.memo` on `StudentsTable` | Receives `filteredStudents` and `onViewDetail` as props. `filteredStudents` is already memoized via `useMemo` (stable unless search/filter changes). `onViewDetail` is a stable `useCallback` (never changes). The shallow comparison cost of `React.memo` (comparing the props object on every render) would exceed the render cost on the rare occasion a re-render is triggered when `filteredStudents` is stable. Measured: `StudentsTable` re-renders only when search, filter, or fetch data changes. |
| `React.memo` on `StudentDetailModal` | Rendered only when `selectedStudent` is non-null. The modal is mounted/unmounted per open/close cycle — memoisation has no effect on a component that mounts once per interaction and unmounts when closed. There is no scenario where `StudentDetailModal` re-renders unnecessarily. |
| Debounced search | Search is already client-side and instantaneous (substring match on an in-memory array of <100 items). Debounce would add perceived latency (200-300ms delay before results appear) with zero benefit. The search is O(n) over a small array — the bottleneck is not CPU but user typing speed. |
| Pagination | The student list is bounded by `educator_id` scope. Typical sub-admin student counts are under 100 based on the domain model (each educator has a finite number of students). The DataGrid renders the full list without pagination complexity. Adding pagination would introduce page/pageSize state, URL query parameter management, and UI controls — all unnecessary for the current data volume. If student count grows beyond 500+, pagination should be re-evaluated with server-side support. |
| Server-side search/filter | All filtering data (name, email, created_at) is already available client-side after the initial fetch. The fetch returns up to 5000 students (set by `limit: 5000`) — the entire scope fits in memory. Server-side search would add: (a) network latency per keystroke or debounced request, (b) a new API endpoint or query parameter, (c) backend filtering logic that duplicates the client-side filter. The client-side approach provides instant feedback with zero additional server load. |
| `useMemo` on `filteredStudents` with deeper comparison | The current `useMemo` uses default reference equality on dependencies. `students` changes on every fetch (new array ref), `searchTerm` and `monthFilter` change on user input. A deeper comparison (e.g., `lodash.isEqual` on `students`) would add O(n) comparison cost on every render to potentially skip a filter that costs O(n) — net negative. |
| Virtualization (react-window / react-virtual) | The student list is expected to be under 100 rows. Virtualization libraries add complexity (fixed row height estimation, scroll container setup, dynamic measurements) with no benefit when the total DOM nodes are under 100. Virtualization becomes beneficial at 1000+ rows. |

### Governing Principle

All optimization decisions follow the governance rule: *Optimize only
with measurable evidence.* Every implemented optimization addresses a
demonstrated cost (unnecessary re-filtering, unstable callback
references, stale state after unmount). Every rejected optimization
was evaluated against the actual data volume, render frequency, and
user interaction pattern — not applied speculatively.

---

## Governance Rules

1. **Preserve student management workflow correctness** — loading,
   search, filter, and navigation remain identical.
2. **Preserve search, filtering, and navigation behavior** — case-
   insensitive substring search, month prefix filter, modal drill-down.
3. **Preserve educator permission boundaries** — `ensureRole` in every
   service call; route-level `RoleGuard`.
4. **Preserve data consistency** — computed stats (`computeStudentStats`)
   are derived from the same attempt data in the same way.
5. **Preserve accessibility** — all ARIA labels, keyboard behaviour,
   and focus management are preserved.
6. **Architecture over uniformity** — `StudentsTable` and
   `StudentDetailModal` are feature-specific components with deliberate
   column definitions and layout.
7. **Feature-local ownership** — `useStudents` owns all student logic;
   no global abstractions.
8. **Reuse canonical components where objectively beneficial** —
   `PageContainer`, `Stack`, `Card`, `Badge`, `Button`, `StatCard`,
   `DataGrid`, `Label`, `Body`, `LoadingSkeleton` are all from
   canonical sources. `AdminFilterBar`, `AdminModal`, `AdminIconWrap`,
   `AdminText` are from shared admin component layer.
9. **Optimize only with measurable evidence** — `useMemo` on
   `filteredStudents` and `monthOptions`; `useCallback` on all handlers;
   stale-request protection. All rejected optimisations documented
   with evidence.
10. **Separate accepted design decisions from actual technical debt** —
    inline error/empty state cards are accepted design decisions, not
    debt.
11. **Repository-wide opportunities must never block certification.**
12. **Certify only independently verified improvements.**
13. **Freeze the feature before proceeding to the next migration.**

---

## Extension Points

- **Add pagination**: Replace direct rendering of `filteredStudents`
  with a paginated DataGrid; add `page` and `pageSize` state to
  `useStudents`.
- **Add server-side search**: Replace client-side `filter` with a
  debounced API call that searches via a `search_users` RPC or
  `ilike` query.
- **Add student grouping**: Add a grouping dimension (e.g., by coupon
  code or date range) with collapsible group headers in `StudentsTable`.
- **Add bulk actions**: Add select-all / bulk-CSV-export or bulk-email
  functionality to `StudentsTable`.
- **Add student detail page**: Replace the modal with a dedicated
  `/sub-admin/students/:studentId` route and detail page.
- **Add performance trends**: Add a line chart or sparkline to
  `StudentDetailModal` showing score trend over time.
- **Add export all**: Add a "Download All Students CSV" button in the
  toolbar that exports all filtered students' data.

---

## Future Maintenance

- If the `AdminFilterBar` or `AdminModal` APIs change, update the
  `useStudents` hook's return type and the page's props accordingly.
- If `DataGrid` column definitions are reused across other sub-admin
  views, consider extracting a shared column config file.
- If CSV export logic is duplicated across settings and exams pages,
  consider extracting a reusable `useCSVExport` hook.
- If `fetchSubAdminStudents` and `fetchSubAdminProfile` are called
  together in multiple places, consider batching them into a single
  `fetchEducatorContext` service function.
- If student count grows significantly, evaluate server-side
  search/filter and pagination.

---

## Freeze Status

The Sub Admin Students feature is certified and frozen under the current
Golden Reference architecture. The following invariants are guaranteed:

### Feature Nature

- **The feature is read-only and analytical.** It does not mutate student
  records, create new records, or trigger any database write operations.
  All user actions (search, filter, copy, export, refresh) are client-side
  operations that read from the already-loaded dataset.

### Data Governance

- **Educator ownership is enforced at every layer.** Route guards
  (`RoleGuard`), service-layer authorization (`ensureRole`), repository
  scoping (`educator_id` / `sub_admin_id` filters), and database foreign
  keys collectively prevent access to student data outside the
  authenticated educator's scope.
- **Statistics are derived, never persisted.** `computeStudentStats()`
  derives `totalExams`, `avgScore`, `bestScore`, and `lastActive` from
  raw attempt data at fetch time. No statistics table, materialised view,
  or background job stores these values. Each fetch cycle re-derives
  every statistic from the authoritative attempt records.
- **`filteredStudents` is the canonical derived dataset.** Every consumer
  (DataGrid, row numbering, modal selection, CSV export, empty state)
  reads from `filteredStudents`. There is exactly one derived collection
  — no other filtered, sorted, or sliced version exists.

### Architecture

- **Canonical and shared components are intentionally reused.** All
  layout (`PageContainer`, `Stack`, `SectionReveal`), data display
  (`DataGrid`, `StatCard`, `Badge`), and shared admin components
  (`AdminFilterBar`, `AdminModal`, `AdminFilterBar`) are sourced from
  the canonical library or shared admin layer.
- **Feature-specific components are justified.** `StudentsTable` and
  `StudentDetailModal` remain feature-specific because no reuse target
  exists elsewhere in the application and extracting them would increase
  configuration complexity without measurable benefit.

### Performance

- **Performance decisions are evidence-based.** Every implemented
  optimisation (`useMemo`, `useCallback`, stale-request protection,
  scoped state ownership) addresses a demonstrated cost. Every rejected
  optimisation (`React.memo`, debounce, pagination, server-side search,
  virtualization) is documented with the evidence that supports the
  decision. No speculative optimisation was introduced.

### Certification

- **Accessibility is verified** — keyboard navigation, ARIA labels,
  screen reader compatibility, dialog accessibility (FocusTrap, Escape
  close), focus management, responsive layouts, and touch accessibility
  are documented and verified against WCAG criteria.
- **The feature is fully certified** under the current Golden Reference
  architecture. All 13 governance rules are satisfied. All remaining
  observations (inline error/empty state styling, sequential fetch
  pipeline, non-clickable modal overlay) are documented as accepted
  design decisions — not technical debt — and do not block certification.
- **No implementation changes are permitted** without a new certification
  cycle. Documentation refinements that maintain compatibility with the
  certified implementation are permitted.

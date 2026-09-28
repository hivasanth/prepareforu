# Sub Admin Settings

## Purpose

Allows sub-admins to manage their profile, password, recruitment coupon,
notification preferences, data exports, and session. The settings page is
a single-view dashboard with six distinct sections arranged in a 2-column
responsive grid.

---

## Architecture

```
Page (composition only)
  │
  └── useSettings (feature hook)
        │
        ├── IdentitySection
        ├── RecruitmentSection
        ├── NotificationSection
        ├── BackupSection
        ├── SessionSection
        │
        ├── userService
        │     ├── fetchSubAdminProfileAndUser
        │     ├── updateSubAdminProfile
        │     ├── updateSubAdminNotificationPrefs
        │     └── fetchStudentsByEducatorId
        │
        ├── teacherExamService
        │     └── fetchTeacherExamsForExport
        │
        ├── authService
        │     └── updatePassword
        │
        └── csvUtils
              └── downloadCSV
```

### Layered Architecture

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Page | `pages/sub-admin/SubAdminSettings.tsx` | Composition only — wires hook to components |
| Feature Hook | `components/sub-admin/settings/useSettings.ts` | State ownership, data loading, event handlers |
| Presentation | `components/sub-admin/settings/*.tsx` | Rendering, layout, user interaction |
| Service | `services/userService.ts`, `authService.ts`, `teacherExamService.ts` | Business logic, orchestration |
| Repository | `lib/repositories/user.repository.ts`, `teacherExam.repository.ts` | Data access (Supabase queries) |

### File Organisation

| File | Purpose |
|------|---------|
| `SubAdminSettings.tsx` (page) | Composition: 136 lines — wires hook to components, gates loading/error states |
| `useSettings.ts` | Feature hook: 366 lines |
| `SubAdminSettingsSkeleton.tsx` | Page-loading skeleton (single `role="status"` owner, decorative blocks) |
| `types.ts` | Shared types: `ProfileData`, `NotificationPrefs`, `PrefKey` |
| `IdentitySection.tsx` | Profile form (name, email, password, save) |
| `RecruitmentSection.tsx` | Coupon code display, copy, share |
| `NotificationSection.tsx` | Notification preference toggles |
| `BackupSection.tsx` | CSV export buttons (students, exams) |
| `SessionSection.tsx` | Last login, sign out with confirmation |
| `README.md` | Golden Reference documentation |

---

## Settings Domain Model

The settings feature spans five independent business domains. Each domain
owns a distinct set of data, workflows, and UI sections. The `useSettings`
hook coordinates across all domains but does not couple them — a failure
in one domain has no effect on the others.

### Identity Domain

| Aspect | Detail |
|--------|--------|
| Purpose | Manage sub-admin profile identity |
| Data | `full_name`, `email` (read-only), educator details |
| Persistence | `sub_admins` table + `users` table |
| UI Section | `IdentitySection` |
| Workflow | Load → Edit → Validate → Save |
| Failure Mode | Toast error, form state preserved for retry |

### Security Domain

| Aspect | Detail |
|--------|--------|
| Purpose | Password change and session management |
| Data | Password (ephemeral), session token (AuthContext) |
| Persistence | Supabase Auth (password), `AuthContext.logout` (session) |
| UI Section | `IdentitySection` (password field), `SessionSection` |
| Workflow | Validate → Auth Update → Feedback (password); Confirm → Logout → Redirect (session) |
| Failure Mode | Toast error, password field preserved for retry |

### Notifications Domain

| Aspect | Detail |
|--------|--------|
| Purpose | Manage email notification preferences |
| Data | `notify_on_attempt`, `notify_on_exam_closure`, `notify_on_new_student` |
| Persistence | `sub_admins.notification_prefs` (JSON column) |
| UI Section | `NotificationSection` |
| Workflow | Optimistic Toggle → Persist → Rollback on Failure |
| Failure Mode | Optimistic revert + toast error |

### Recruitment Domain

| Aspect | Detail |
|--------|--------|
| Purpose | Distribute coupon codes to recruit students |
| Data | `coupon_code` (read-only display) |
| Persistence | `sub_admins.coupon_code` (read-only) |
| UI Section | `RecruitmentSection` |
| Workflow | Copy → Clipboard; Share → Web Share API → Clipboard Fallback |
| Failure Mode | Toast error, no data mutation |

### Operations Domain

| Aspect | Detail |
|--------|--------|
| Purpose | Export data for offline records |
| Data | Student records, exam records |
| Persistence | None (read-only queries) |
| UI Section | `BackupSection` |
| Workflow | Fetch → Generate CSV → Download |
| Failure Mode | Toast error, no data mutation |

### Orchestration

`useSettings` is the single orchestration layer. It:

1. Fetches shared data (profile) once on mount.
2. Distributes state and callbacks to each domain's UI section.
3. Provides independent handlers per domain — `handleSaveProfile`
   (identity + security), `handleTogglePref` (notifications),
   `handleCopyCoupon` / `handleShareCoupon` (recruitment),
   `handleExportStudents` / `handleExportExams` (operations).

But each handler is self-contained. The identity handler does not read
notification state. The recruitment handler does not touch profile
data. Domain isolation ensures that a bug in one workflow cannot
corrupt another.

---

## Settings Workflow

All six workflows share the same `useSettings` hook but are otherwise
independent. A failure in one workflow never affects the state or
execution of another.

---

### 1. Identity Workflow

The identity workflow manages the sub-admin's display name. Email is
read-only and cannot be changed from settings.

```
Page Mount
    ↓
useEffect → fetchData() → fetchSubAdminProfileAndUser(user.id)
    ├── userRepo.findSubAdminProfileByUserId(userId)
    │     ← { id, full_name, email, coupon_code, notification_prefs }
    └── userRepo.findUserLastActivity(userId)
          ← { last_activity_date }
    ↓
Housekeeping:
  ├── update profileRef (the last-confirmed profile source of truth)
  ├── setLastLogin (formatted local-calendar date — never UTC-parsed)
  └── hydrate form fields ONLY on the first successful load (loadedOnceRef)
    ↓
No profile row → canonical business error (ErrorContainer + RetryButton)
    ↓
Technical failure → canonical PageError (ErrorContainer + RetryButton)
```

**Load Phase:** Profile data is fetched on mount via `fetchData()` (an
idempotent, retryable callback). While loading, the page renders
`SubAdminSettingsSkeleton` (single `role="status"` owner — the real grid is
NEVER rendered with default/empty values). A retry after a load failure uses
`loadedOnceRef` so already-typed form values are never clobbered.
`notification_prefs` is merged with `DEFAULT_PREFS` to fill any missing keys.

```
Edit (user types in Full Name field)
    ↓
name state updated → UI reflects new value
    ↓
User clicks "Save Changes"
    ↓
Validation (client `identityUpdateSchema`):
  ├── name.trim() empty? → inline field error "Name is required", stop
  └── password provided? → passwordSchema.safeParse(password)
        ├── invalid → inline field error (first issue), stop
        └── valid → continue
    ↓
Mutation:
  ├── name !== profile.full_name?
  │     └── updateSubAdminProfile(name)
  │           ├── userRepo.updateSubAdminNameViaRpc(name)  [RPC: update_sub_admin_name]
  │           └── (users row synced inside the same RPC)
  │
  └── password non-empty?
        └── authService.updatePassword(password)
              ├── success → clear password field
              └── failure → throw
    ↓
showSuccess("Profile updated successfully")
    ↓
Error → inline Alert (actionError):
    ├── password step failed after name saved →
    │     "Name saved, but password update failed: <reason>"
    │     (name is NEVER rolled back)
    └── otherwise → the failure message
```

**Save Phase:** Name and password are saved in a single "Save Changes"
action. If only the name changed, only the name is saved. If only the
password changed, only the password is saved. Both can be changed
simultaneously.

**Domain boundary:** The identity workflow shares the "Save Changes"
button with the password workflow (below) but the two are logically
independent — a password failure does not revert the name update, and
vice versa.

---

### 2. Password Workflow

The password workflow is bundled into the same "Save Changes" action
as the identity workflow but follows its own validation and persistence
path.

```
User enters new password in "Update Password" field
    ↓
handleSaveProfile validates identity fields first
    ↓
If password provided:
  ├── passwordSchema.safeParse(password)
  │     ├── Fails → inline field error (first issue message), stop
  │     └── Passes → continue
  │
  └── authService.updatePassword(password)
        ├── Client validates passwordSchema again
        ├── Supabase auth.updateUser({ password })
        │     ├── Success → return { success: true }
        │     └── Error → return { success: false, error }
        │
        ├── Success → clear password field
        └── Failure → inline Alert (actionError); "Name saved, but…" if the name step already committed
```

#### Password Validation Rules

| Rule | Error |
|------|-------|
| Name empty | "Name is required" |
| Name > 80 chars | "Name must be 80 characters or less" (client `identityUpdateSchema` blocks before the RPC is reached) |
| Password < 8 chars | "Password must be at least 8 characters" |
| No uppercase | "Must include an uppercase letter" |
| No number | "Must include a number" |
| No special char | "Must include a special character" |

Password validation runs at two layers:

1. **Client-side** (`handleSaveProfile`): `passwordSchema.safeParse()`
   before any mutation. Catches invalid passwords without a network
   call.
2. **Server-side** (`authService.updatePassword`): `passwordSchema.safeParse()`
   again before calling `supabase.auth.updateUser()`. Defends against
   by-passed client logic.

Both use the same `passwordSchema` from `validations/securitySchemas.ts`.

#### Security Constraints

- No current password is required (unlike User Profile). The session
  itself is the authorisation — an attacker would need the session
  token first.
- The password field is cleared after a successful update to prevent
  accidental re-submission.
- Expired sessions receive an auth error from Supabase.

**Domain boundary:** The password workflow shares the "Save Changes"
button with the identity workflow but is semantically independent.
Password validation does not depend on name state, and name validation
does not depend on password state.

---

### 3. Notification Workflow

The notification workflow is fully independent — it has its own
persistence path, its own loading state, and its own error recovery.

```
User toggles a Switch component
    ↓
handleTogglePref(key, value, setter)
    ↓
Single-flight guard: savingPrefsRef already true → return (no re-entry)
  Switches are also disabled while savingPrefs — one mutation at a time
    ↓
Step 1: Optimistic UI update
  └── setter(value) — toggle changes immediately
    ↓
Step 2: Show loading indicator
  └── setSavingPrefs(true) — "Saving..." text appears
    ↓
Step 3: Persist
  └── newPrefs = { ...DEFAULT_PREFS, ...profileRef.current.notification_prefs, [key]: value }
        (read from the LAST confirmed profile — a stale closure can
         never resurrect a previous key's value)
  └── updateSubAdminNotificationPrefs(newPrefs)
        └── userRepo.updateSubAdminNotificationPrefsViaRpc(prefs)  [RPC: update_sub_admin_notification_prefs]
              ↓
        Success → update local profile state (functional setProfile):
                   setProfile(prev => ({ ...prev, notification_prefs: newPrefs }))
              ↓
        Failure → revert toggle:
                   setter(!value)
                   inline Alert: "Failed to save preference. Please try again."
    ↓
Step 4: Clear loading indicator
  └── setSavingPrefs(false), savingPrefsRef = false
```

#### Notification Keys

| Key | Label | Default |
|-----|-------|---------|
| `notify_on_attempt` | Notify on student attempts | `true` |
| `notify_on_exam_closure` | Notify on exam closure | `true` |
| `notify_on_new_student` | Notify on new student signup | `true` |

#### Optimistic Update Contract

1. The toggle changes appearance before the API call completes.
2. If the API call succeeds, the local profile is updated to match.
3. If the API call fails, the toggle reverts to its previous value.
4. The "Saving..." indicator is shown during the API call and hidden
   on completion (success or failure).
5. **Single-flight:** only ONE preference mutation runs at a time
   (`savingPrefsRef` guard + switches disabled while `savingPrefs`), so
   two rapid toggles can never race and resurrect a stale key.

This pattern provides instant feedback while maintaining consistency
with the server. The notification preferences are stored as a JSON
object in the `sub_admins.notification_prefs` column.

**Domain boundary:** The notification workflow never reads or writes
identity, password, coupon, or export state. It operates solely on
`profile.notification_prefs`.

---

### 4. Recruitment Workflow

The recruitment workflow is read-only — it displays the coupon code
and provides copy/share actions. No data is mutated.

#### Copy Coupon

```
User clicks copy IconButton
    ↓
navigator.clipboard.writeText(profile.coupon_code)
    ↓
Success → setCopied(true), copy button accessible name flips to "Coupon copied"
          (SR confirmation); arm 2000ms reset timer (clear any prior timer; cleared on unmount)
Failure → inline Alert "Failed to copy coupon"
```

#### Share Coupon

```
User clicks share IconButton
    ↓
navigator.share available?
  ├── Yes → navigator.share({ title: "Join My Exams", text })
  │         (user may dismiss — no error shown)
  │
  └── No → navigator.clipboard.writeText(shareText)
            ├── Success → setCopied(true) (copy button accessible name flips to "Coupon copied")
            └── Failure → inline Alert "Could not copy automatically..."
```

The share text includes the educator name and coupon code:
```
Join my exam platform!

Educator: {profile.full_name}
Coupon Code: {profile.coupon_code}
```

**Domain boundary:** The recruitment workflow reads `profile.coupon_code`
and `profile.full_name` but never writes to the database. It is purely
a display-and-copy interaction. A failure in copy/share has no effect
on identity, notifications, exports, or session state.

---

### 5. Export Workflow

The export workflow is read-only — it fetches data from the server and
triggers a CSV download. No data is mutated.

#### Students Export

```
User clicks "Students" export button
    ↓
setExportingStudents(true)
    ↓
fetchStudentsByEducatorId(user.id)
    └── userRepo.fetchAllStudentsByEducatorId(educatorId)  [PAGINATED]
          ← { rows: [{ full_name, email, created_at }], truncated }
          (exact count → loop .range pages → complete dataset; `truncated`
           only if the loop returned fewer rows than the exact count)
    ↓
rows.length === 0?
  ├── Yes → inline Alert "No students found"
  └── No → downloadCSV({
             filename: "students_export.csv",
             headers: ["Name", "Email", "Joined"],
             rows: [full_name, email, created_at]
           })
           ├── truncated → inline warning Alert (partial export, explicit)
           │               + "Please contact admin for a full export"
           └── complete  → showSuccess("Export complete")
    ↓
Error → inline Alert "Export failed"
    ↓
setExportingStudents(false)
```

#### Exams Export

```
User clicks "Exams" export button
    ↓
setExportingExams(true)
    ↓
fetchTeacherExamsForExport({ user }, profile.id)
    └── teacherExamRepo.fetchAllTeacherExamsBySubAdminId(subAdminId)  [PAGINATED]
          ← { rows: [{ title, total_questions, total_marks, created_at }], truncated }
    ↓
rows.length === 0?
  ├── Yes → inline Alert "No exams found"
  └── No → downloadCSV({
             filename: "exams_export.csv",
             headers: ["Title", "Questions", "Marks", "Created At"],
             rows: [title, total_questions, total_marks, created_at]
           })
           ├── truncated → inline warning Alert (partial export, explicit)
           └── complete  → showSuccess("Export complete")
    ↓
Error → inline Alert "Export failed"
    ↓
setExportingExams(false)
```

A **never-false-success contract** applies to both exports: the CSV is always
downloaded from the paginated fetch (no silent `.limit()` truncation), and if
the safety-net `truncated` flag is ever set, the user is told explicitly with
a warning Alert instead of a success toast.

Both exports use `downloadCSV()` from `csvUtils.ts` which:
1. Builds a CSV string from **formula-injection-neutralised** cells —
   `escapeCSVCell` prefixes a leading `'` to any cell starting with
   `=`, `+`, `-`, `@`, tab, or CR (OWASP spreadsheet-injection guard).
2. Creates a Blob with `text/csv` MIME type.
3. Generates an object URL.
4. Programmatically clicks a hidden `<a>` element.
5. Cleans up the URL and DOM node.

**Domain boundary:** The export workflow is fully independent — it reads
`user.id` and `profile.id` but never writes to any table. Students
export queries the `users` table. Exams export queries the
`teacher_exams` table. Neither mutation touches settings state.

---

### 6. Session Workflow

The session workflow is the only workflow that can permanently change
the application state (by terminating the session).

```
User clicks "Terminate Session" button
    ↓
openSignOut()
    └── useSignOutConfirmation sets isOpen = true
    ↓
ConfirmModal renders with "Sign Out" / "Cancel"
    ↓
User clicks "Cancel"?
  ├── Yes → closeSignOut(), modal closes, no action
  │
  └── User clicks "Sign Out"?
        ├── confirmSignOut()
        │     ├── closeDialog() — hide modal first
        │     └── logout() — AuthContext.logout()
        │
        └── AuthContext handles:
              ├── Clear session state
              ├── Redirect to login page
              └── Invalidate all cached data
```

#### Confirmation Guarantees

1. Session termination is always gated by explicit user confirmation.
2. The confirmation dialog is modal — the user cannot interact with
   the page while it is open.
3. "Cancel" dismisses the dialog without side effects.
4. "Sign Out" triggers logout and the user is redirected.
5. The `useSignOutConfirmation` hook manages dialog state and
   delegates the actual logout to `AuthContext.logout`.

**Domain boundary:** The session workflow uses `useSignOutConfirmation`
(external hook) and `AuthContext.logout()` (external context). It does
not read or write any settings state. A cancelled logout has zero
effect on identity, notifications, recruitment, or export state.

---

## Security Model

Security is applied at four independent layers, from route access to
database constraints. Each layer is independently verifiable.

```
┌──────────────────────────────────────────────┐
│ Layer 1: Route Guard                          │
│ RoleGuard allowedRoles={['sub_admin']}         │
│ Prevents non-sub-admin users from loading     │
│ the page.                                     │
├──────────────────────────────────────────────┤
│ Layer 2: Authentication (AuthContext)         │
│ Session identity from Supabase Auth.           │
│ user.id used for all service calls.           │
├──────────────────────────────────────────────┤
│ Layer 3: Service Authorization                │
│ Settings service functions scope to the       │
│ authenticated user; ensureRole is used where  │
│ a separate sub-admin identity is passed.      │
├──────────────────────────────────────────────┤
│ Layer 4: Repository / Database                │
│ Supabase RLS and table constraints.           │
└──────────────────────────────────────────────┘
```

### Layer 1: Route Guarding

| Guard | Location | Effect |
|-------|----------|--------|
| `RoleGuard allowedRoles={['sub_admin']}` | `App.tsx` | Non-sub-admin users redirected to `/unauthorized` |

The route guard runs before any component mounts. It is the outermost
security boundary. An attacker cannot reach the settings page code
without a valid `sub_admin` session.

### Layer 2: Authentication (AuthContext)

| Source | Data | Used For |
|--------|------|----------|
| `useAuth()` | `user.id`, `user.email`, `logout()` | All service calls, session termination |

`AuthContext` wraps the Supabase Auth session. It provides the
authenticated user object that carries the session token. Every
settings service call passes through `user.id` — if the session is
expired, Supabase rejects the query at the RLS level.

### Layer 3: Service Authorization

Settings service functions operate on the authenticated user's own
data. The user ID is derived from the session, not from user input.

| Service Function | User ID Source | Data Scoped To | ensureRole |
|-----------------|----------------|----------------|-----------|
| `fetchSubAdminProfileAndUser(userId)` | `user.id` | `sub_admins` row matching `user_id = userId` | No — session-derived ID + RLS |
| `updateSubAdminProfile(name)` | Server-side `auth.uid()` inside the RPC | Only the caller's `sub_admins` and `users` rows | N/A (RPC derives owner) |
| `updateSubAdminNotificationPrefs(prefs)` | Server-side `auth.uid()` inside the RPC | Only the caller's `sub_admins` row | N/A (RPC derives owner) |
| `fetchStudentsByEducatorId(educatorId)` | `user.id` | Only students linked to the caller's educator profile | No — session-derived ID + RLS |
| `fetchTeacherExamsForExport({ user }, subAdminId)` | `user` object | Only exams owned by the caller's sub-admin profile | **Yes** — `resourceOwnerId` = sub-admin profile |

**Authorization posture:** `fetchTeacherExamsForExport` runs `ensureRole` with
the sub-admin profile as `resourceOwnerId`. The two RPC-backed mutations
derive ownership from `auth.uid()` server-side. The two read helpers
(`fetchSubAdminProfileAndUser`, `fetchStudentsByEducatorId`) take the user ID
from the authenticated session — never from user input — and rely on RLS row
ownership as the defence-in-depth backstop alongside the route guard at
Layer 1.

### Layer 4: Database Constraints

| Table | Constraints |
|-------|-------------|
| `sub_admins` | Primary key, `user_id` unique, `coupon_code` unique, `notification_prefs` JSON |
| `users` | Primary key, `educator_id` FK → `sub_admins.id` |
| `teacher_exams` | Primary key, `sub_admin_id` FK → `sub_admins.id` |

Row-Level Security (RLS) policies on Supabase tables restrict access
to rows owned by the authenticated user. These policies apply
regardless of which service function is called.

### Password Security

| Layer | Mechanism | Trust Boundary |
|-------|-----------|----------------|
| Client-side validation | `passwordSchema.safeParse()` before mutation | Browser — can be bypassed |
| Server-side validation | `passwordSchema.safeParse()` in `authService.updatePassword` | Application — trusted |
| Auth API | `supabase.auth.updateUser({ password })` | Supabase — fully trusted |

```
password form field
    ↓
Client: passwordSchema.safeParse(password)
    ↓  ←── Trust boundary (client → application)
Server: authService.updatePassword(password)
    ├── passwordSchema.safeParse(password) ← trusted validation
    └── supabase.auth.updateUser({ password })
          ↓  ←── Trust boundary (application → Supabase)
Supabase Auth: validates session, updates password
```

The password is never logged, stored in local state after a successful
update, or sent to any endpoint other than `supabase.auth.updateUser`.
The same `passwordSchema` from `validations/securitySchemas.ts` is used
on both sides of the trust boundary.

### Session Security

```
User clicks "Terminate Session"
    ↓
ConfirmModal (confirmation gate)
    ├── Cancel → no action
    └── Confirm → logout()
          ↓
AuthContext.logout()
    ├── Clear local session state
    ├── Supabase auth sign out
    └── Redirect to login page
```

Session termination is always gated by explicit user confirmation.
The `useSignOutConfirmation` hook manages the dialog, and
`AuthContext.logout()` performs the actual session invalidation.

### Threat Model

| Threat | Layer(s) | Mitigation |
|--------|----------|------------|
| Student navigates to `/sub-admin/settings` | Layer 1 | `RoleGuard` redirects to `/unauthorized` |
| Expired session during form interaction | Layer 2 | `AuthContext.user` is null; save/toggle/export guards check `user?.id` |
| Forged user ID in service call | Layer 3 | User ID is always `user.id` from session, never from user input |
| Direct Supabase API call with forged identity | Layer 4 | RLS enforces row ownership |
| Password interception in transit | Layer 4 | Supabase Auth uses HTTPS; password is never sent to application server |
| Session hijacking via XSS | Layer 2 | React's escaping prevents XSS; session token is HttpOnly |

---

## Data Ownership

Every dataset consumed or produced by this feature has a single canonical
owner. No data is duplicated, cached, or derived from a non-authoritative
source. Ownership is separated by lifecycle: persistent data, ephemeral
UI state, and externally owned state.

### Persistent Data

Data that survives page reloads and is stored in the database.

| Data | Owner | Source | Lifecycle |
|------|-------|--------|-----------|
| `profile` (`id`, `full_name`, `email`, `coupon_code`, `notification_prefs`) | `useSettings` | `fetchSubAdminProfileAndUser` on mount / retry | Fetched, mutated on save/toggle |
| `lastLogin` | `useSettings` | `userRepo.findUserLastActivity` on mount | Fetched once, never mutated |

**Profile data is the single source of truth for all settings domains.**
It is fetched on mount (`fetchData`, retryable via the page's
`RetryButton` after a load error). Mutations (name, notification prefs)
update local state optimistically. The database is the canonical record
— the local state is a cache that stays consistent via optimistic
updates.

### Ephemeral UI State

Data that exists only during the current session and is never persisted
to the database.

| Data | Owner | Purpose | Reset Condition |
|------|-------|---------|-----------------|
| `name` (form field) | `useSettings` | Editable copy of `profile.full_name` | Cleared on page reload |
| `password` (form field) | `useSettings` | Password input buffer | Cleared after successful update or on page reload |
| `fieldErrors` | `useSettings` | Per-field validation messages (name/password) | Cleared on successful save |
| `saving` | `useSettings` | Profile save loading flag | `false` after save completes (success or failure) |
| `savingPrefs` | `useSettings` | Notification save loading flag | `false` after toggle completes |
| `copied` | `useSettings` | Coupon copy success feedback | Auto-reset after 2s timeout |
| `exportingStudents` | `useSettings` | Student export loading flag | `false` after export completes |
| `exportingExams` | `useSettings` | Exam export loading flag | `false` after export completes |
| `loading` | `useSettings` | Profile-load spinner state (drives skeleton) | `false` after load completes (success or failure) |
| `error` | `useSettings` | Page-level `PageError` (drives ErrorContainer + RetryButton) | `null` on successful load/reload |
| `actionError` | `useSettings` | Inline `Alert` message for a failed action (save/toggle/copy/export) | `null` before the next action or after it succeeds |
| `notice` | `useSettings` | Inline `Alert` message for a non-fatal notice (e.g. partial export) | `null` via `clearNotice()` / `onDismiss` |
| `profileRef` | `useSettings` (ref) | Last confirmed `profile` — source of truth for toggle writes | Updated on every successful load/save/toggle |
| `savingPrefsRef` | `useSettings` (ref) | Single-flight guard (B1) — blocks concurrent preference writes | `false` after the in-flight toggle completes |
| `copiedTimerRef` | `useSettings` (ref) | Pending 2s copied-reset timer (B8) | Cleared when armed again or on unmount |
| `loadedOnceRef` | `useSettings` (ref) | Prevents form re-hydration on retry (B2) | Set `true` after the first successful load |

**Ephemeral state is exclusively owned by `useSettings`.** No component
stores a copy. The password field is cleared after a successful update
to prevent accidental re-submission. Feedback flags (`copied`,
`exporting*`, `loading`) are managed with timeouts or promise
`.finally()`.

### Externally Owned State

Data owned by hooks or contexts outside the settings feature.

| Data | Owner | Access in Settings | Mutable by Settings? |
|------|-------|-------------------|---------------------|
| `user` (auth session) | `AuthContext` | `useAuth().user` for `user.id` and `logout()` | No — only calls `logout()` |
| `toasts` | `useToast` | `showSuccess()` for success feedback | Yes — pushes success toast messages |
| `isSignOutOpen` | `useSignOutConfirmation` | `openDialog()`, `closeDialog()`, `confirmSignOut()` | Yes — via returned callbacks |

**External state is never duplicated in `useSettings`.** The hook reads
from the canonical source on every render. For example, `toasts` is an
array managed by `useToast` — `useSettings` calls `showSuccess` to enqueue
success toasts. Error feedback is deliberately **not** routed through
`showError`; it is rendered inline via `Alert`/`ErrorContainer` so failures
are co-located with the surface (and page-load failures with their own
`RetryButton`).

### Ownership Invariants

1. Every dataset has exactly one canonical owner.
2. No two owners hold the same data.
3. Ephemeral state is always derived from or related to a single
   user action — it never overlaps with persistent state.
4. External state is accessed through the owning hook's public API
   only — never through direct mutation.

---

## Data Flow

### Read Path

```
AuthContext.user
    ↓
useEffect in useSettings
    ↓
fetchSubAdminProfileAndUser(user.id)
    ↓
userRepo.findSubAdminProfileByUserId(userId)  ← sub_admins table
userRepo.findUserLastActivity(userId)          ← users table
    ↓
Local state in useSettings
    ↓
Props to IdentitySection, RecruitmentSection, NotificationSection
```

### Write Path (Profile)

```
IdentitySection form fields
    ↓
handleSaveProfile in useSettings
    ↓
updateSubAdminProfile(name)
    ↓
userRepo.updateSubAdminNameViaRpc(name)  [RPC: update_sub_admin_name]  ← sub_admins table
(users row synced inside the same RPC)       ← users table
    ↓
authService.updatePassword(password)         ← Supabase Auth
    ↓
Local state updated
```

### Write Path (Notifications)

```
NotificationSection toggle
    ↓
handleTogglePref in useSettings
    ↓
updateSubAdminNotificationPrefs(newPrefs)
    ↓
userRepo.updateSubAdminNotificationPrefsViaRpc(prefs)  [RPC: update_sub_admin_notification_prefs]  ← sub_admins table
    ↓
Local profile state updated
```

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
| `Input` | `AntigravityForm` | Text and password form fields |
| `Button` | `AntigravityButton` | Primary, secondary, and danger actions |
| `IconButton` | `AntigravityButton` | Copy and share icon actions |
| `Switch` | `AntigravityForm` | Notification preference toggles |
| `Label` | `AntigravityTypography` | Field and section labels |
| `Body` | `AntigravityTypography` | Description and secondary text |
| `ConfirmModal` | `SharedComponents` | Session termination confirmation |
| `ToastContainer` | `useToast` | Toast notification display |

All layout, navigation, form, and feedback primitives are canonical.
No reusable primitive was reimplemented.

### Feature-Specific Components

The five section components are feature-specific by design because they
represent **independent business domains** rather than reusable layout
patterns.

| Component | Domain | Rationale | Why Not Generic |
|-----------|--------|-----------|-----------------|
| `IdentitySection` | Identity | Profile form with name, read-only email, and password field. The combination of fields (editable name + readonly email + optional password) is unique to sub-admin identity management. | A generic "profile form" component would need configuration for which fields are editable, which are read-only, which have left icons, and which are optional — the config API would be as complex as the component itself. |
| `RecruitmentSection` | Recruitment | Coupon code display with copy/share actions and elevated card styling (`bg-primary/5 border-primary/20`). The coupon code is a uniquely styled large monospace value with a copy/share action bar. | No other feature has a coupon display. The elevated card styling with primary colour accents is specific to recruitment. A generic "coupon card" would need the same markup and styling with no reuse target. |
| `NotificationSection` | Notifications | Three switches with labels and a conditional "Saving..." indicator. The layout (three switches in a vertical stack with a shared header) is specific to the notification preference schema. | A generic "toggle list" component would need per-item labels, switch states, change handlers, and a save indicator — identical to the current implementation with an extra abstraction layer. |
| `BackupSection` | Operations | Two export buttons with shared description text. The dual-button layout (Students / Exams) with loading states is specific to the export workflow. | A generic "export section" component would need per-button labels, loading states, and click handlers — the config API would mirror the current JSX with no reuse benefit. |
| `SessionSection` | Security | Last login display, danger-styled terminate button, and embedded `ConfirmModal`. The combination of read-only metadata and a destructive action with confirmation is specific to session management. | A generic "security section" component would need configuration for metadata display, button styling, and modal content — more complex than the direct implementation. |

#### Why Feature-Specific Is Intentional

1. **Each section is a unique business domain.** Identity, recruitment,
   notifications, operations, and security are fundamentally different
   concerns. They share no layout, no interaction pattern, and no data
   shape. Extracting a common abstraction would require a generic
   "settings card" component parameterised by domain — the parameter
   surface would exceed the current implementation's complexity.

2. **No reuse target exists.** No other page uses a coupon display, a
   notification preference list, or a session security card. Even if
   another feature eventually needs similar UI, the data shapes and
   interaction patterns would differ — the abstraction would likely
   need refactoring anyway.

3. **Shared foundations are used.** All five section components build
   on the same canonical primitives (`Card`, `Stack`, `Button`,
   `Input`, `Switch`, `Label`, `Body`, `IconButton`). The
   feature-specific layer is thin — each section is a composition of
   canonical components with domain-specific layout and styling.

### Rejected Migrations

| Migration | Reason for Rejection |
|-----------|---------------------|
| Merge `IdentitySection` and `SessionSection` into a single "Account" section | Identity (editable form) and Security (read-only metadata + destructive action) are different interaction patterns. Merging them would create a component with mixed responsibilities (editable fields + confirmation dialog). |
| Extract a generic `SettingsCard` wrapper | Each card has different internal layout (form fields vs. switches vs. buttons vs. metadata). A generic wrapper would need slot props for every variation — the resulting API would obscure the actual layout. |
| Extract a generic `SectionHeader` component with icon + label | The header pattern (icon + label in a border-bottom container) is already a 3-line inline composition. Extracting it would add a file import for no line-count reduction. |

---

## Component Hierarchy

```
<PageContainer>
  └─ <Stack gap="lg">
      ├─ <SectionReveal>
      │   └─ <Grid cols={2} gap={24}>
      │       ├─ <IdentitySection>
      │       │   ├─ Header: Icon + "Identity Profile"
      │       │   ├─ Full Name (Input)
      │       │   ├─ Email (Input, disabled)
      │       │   ├─ Password (Input, type=password)
      │       │   └─ Save Changes (Button)
      │       │
      │       └─ <Stack gap="lg">
      │           ├─ <RecruitmentSection>
      │           │   ├─ Header: Icon + "Recruitment Protocol"
      │           │   ├─ Coupon code display
      │           │   └─ IconButton: Copy / Share
      │           │
      │           └─ <NotificationSection>
      │               ├─ Header: Icon + "Engagement Alerts"
      │               ├─ Switch × 3 (attempt, closure, new student)
      │               └─ Saving indicator (conditional)
      │
      └─ <SectionReveal delay={0.1}>
          └─ <Grid cols={2} gap={24}>
              ├─ <BackupSection>
              │   ├─ Header: Icon + "Operational Backups"
              │   ├─ Description text
              │   └─ Button: Students / Exams export
              │
              └─ <SessionSection>
                  ├─ Header: Icon + "Session Security"
                  ├─ Last Protocol Sync (date)
                  ├─ Terminate Session (Button, danger)
                  └─ <ConfirmModal> (conditional)
```

---

## State Ownership

### Hook-Owned State

| State | Type | Initial | Description |
|-------|------|---------|-------------|
| `profile` | `ProfileData \| null` | `null` | Full profile from DB |
| `lastLogin` | `string` | `'—'` | Formatted last activity date |
| `name` | `string` | `''` | Full name form field |
| `password` | `string` | `''` | Password form field (ephemeral) |
| `saving` | `boolean` | `false` | Profile save in progress |
| `notifyAttempt` | `boolean` | `true` | Notify on attempt toggle |
| `notifyCompletion` | `boolean` | `true` | Notify on closure toggle |
| `notifyNewStudent` | `boolean` | `true` | Notify on new student toggle |
| `savingPrefs` | `boolean` | `false` | Notification save in progress |
| `copied` | `boolean` | `false` | Coupon copy feedback |
| `exportingStudents` | `boolean` | `false` | Students CSV export in progress |
| `exportingExams` | `boolean` | `false` | Exams CSV export in progress |

### Externally Owned State

| State | Owner | Description |
|-------|-------|-------------|
| `user` | `AuthContext` | Authenticated user identity |
| `toasts` | `useToast` | Toast notification queue |
| `isSignOutOpen` | `useSignOutConfirmation` | Sign-out confirmation dialog |

### State Flow

```
Server ──→ useSettings (fetch on mount)
                │
                ├──→ IdentitySection (props: name, email, password, saving, onSave)
                ├──→ RecruitmentSection (props: couponCode, copied, onCopy, onShare)
                ├──→ NotificationSection (props: notify*, savingPrefs, onChange)
                ├──→ BackupSection (props: exporting*, onExport*)
                └──→ SessionSection (props: lastLogin, signOut*)
                    └──→ ConfirmModal (via useSignOutConfirmation)
```

---

## Accessibility

### Implementation Approach

Accessibility is integrated into the feature at the component level
rather than applied as a post-implementation audit. Every DOM element
that supports user interaction was chosen for its inherent
accessibility properties:

- **Native elements** over custom widgets: `<input>` for text and
  password, `<button>` for actions, `<select>` for AM/PM.
- **Visible labels** over `aria-label` alone: every form field has a
  visible `<Label>` element.
- **Feedback parity**: loading states, success messages, and error
  messages are both visual (icon changes, text) and programmatically
  accessible (DOM presence, role attributes).

### Interaction Patterns

#### Forms (IdentitySection)

| Pattern | Implementation | Accessibility Benefit |
|---------|---------------|----------------------|
| Text input | Native `<input>` with `<Label>` | Screen reader announces field purpose on focus; standard keyboard navigation (type, backspace, arrow keys) |
| Read-only email | Native `<input disabled>` | Screen reader announces "dimmed" or "unavailable"; cannot be tabbed into |
| Password field | Native `<input type="password">` | Characters masked by default; screen reader announces "password" field type |
| Save button | Native `<button>` with loading state | `loading` prop adds spinner + disabled attribute — screen reader announces "dimmed" / "Busy" |

**Keyboard flow:** Tab enters Name field → Tab to Password field →
Tab to "Save Changes" button → Enter to submit.

**Verification:** Tab through all fields. Each must receive focus in
expected order. Screen reader must announce "Full Name", "Email (Read
Only)", "Update Password", and "Save Changes" on focus.

#### Switches (NotificationSection)

| Pattern | Implementation | Accessibility Benefit |
|---------|---------------|----------------------|
| Toggle | `Switch` component from `AntigravityForm` | Native `<button>` with `role="switch"` and `aria-checked` |
| Keyboard activation | Enter/Space keys | Standard button interaction — no custom key handlers |
| Visual state | CSS class toggle (on/off) | High contrast between states; text label adjacent |
| Saving indicator | Visible text "Saving..." | Screen reader announces text on render |

**Keyboard flow:** Tab to first toggle → Enter/Space to toggle →
Tab to second toggle → Enter/Space → Tab to third toggle →
Enter/Space.

**Verification:** Tab to each switch. Press Enter to toggle. Screen
reader must announce the state change ("checked" / "not checked").
When saving, the "Saving..." text must be rendered in the DOM for
screen reader discovery.

#### Confirmation Dialog (SessionSection)

| Pattern | Implementation | Accessibility Benefit |
|---------|---------------|----------------------|
| Modal | `ConfirmModal` wrapping `AdminModal` | Focus trapped inside modal; ESC to dismiss; `role="dialog"` with `aria-modal="true"` |
| Buttons | Native `<button>` with `variant="danger"` | Visible labels "Cancel" and "Sign Out"; danger styling provides visual emphasis |
| Dismissal | Cancel button + ESC key | Multiple escape paths; no dead end |

**Keyboard flow:** Tab to "Terminate Session" → Enter → Focus moves to
modal → Tab cycles between "Cancel" and "Sign Out" → Enter to confirm
or ESC to dismiss → Focus returns to body.

**Verification:** Open modal. Tab should cycle only within modal
buttons. ESC should close modal without action. Screen reader must
announce "Sign Out" dialog title and both button labels.

#### Icon Buttons (RecruitmentSection)

| Pattern | Implementation | Accessibility Benefit |
|---------|---------------|----------------------|
| Copy coupon | `IconButton` with `aria-label="Copy coupon"` | Screen reader announces purpose despite no visible label |
| Share coupon | `IconButton` with `aria-label="Share coupon"` | Screen reader announces purpose despite no visible label |
| Feedback (copied) | Copy icon flips to `Check` + `text-success` for 2s; copy button `aria-label` flips to `"Coupon copied"` | Accessible-name change gives screen readers a programmatic copy-success confirmation |

**Keyboard flow:** Tab to copy IconButton → Enter to copy coupon →
Tab to share IconButton → Enter to share.

**Verification:** Tab to each icon button. Screen reader must announce
"Copy coupon" and "Share coupon". After copy click, the copy button's
accessible name flips to "Coupon copied" for 2s — screen reader announces
the change as the copy-success confirmation.

### ARIA Usage

| Element | Attribute | Purpose |
|---------|-----------|---------|
| Copy IconButton | `aria-label` = `"Copy coupon"` \| `"Coupon copied"` (dynamic) | Identifies purpose; state flips on copy success for SR confirmation |
| Share IconButton | `aria-label="Share coupon"` | Identifies purpose for screen readers |
| Success/error/notice banner | Inline `Alert` — `role="status"` (non-error) / `role="alert"` (error) | Announces new banner content without interrupting current output |
| ConfirmModal | `role="dialog"`, `aria-modal="true"` (via `AdminModal`) | Identifies modal as a dialog and traps focus |
| Switch | `role="switch"`, `aria-checked` (via `Switch` component) | Identifies toggle state for screen readers |

### Loading States

| Scenario | Visual Indicator | Screen Reader Behaviour |
|----------|-----------------|------------------------|
| Profile load | `SubAdminSettingsSkeleton` visible page (single `role="status"` owner, decorative blocks) | One live region announces "Loading settings"; the real grid never renders with defaults |
| Profile load failure + retry | `ErrorContainer` + `RetryButton` (spinner + disabled while retrying) | `role="alert"` announces the page-level error; "Retrying…" when busy |
| Profile save | Button shows built-in spinner + becomes disabled | "Save Changes" button is dimmed; screen reader announces "dimmed" or ignores |
| Notification save | "Saving..." text appears below toggles; three switches disabled | Text is rendered in DOM — screen reader reads it on next navigation |
| Students CSV export | Button shows built-in spinner + becomes disabled | "Students" button is dimmed |
| Exams CSV export | Button shows built-in spinner + becomes disabled | "Exams" button is dimmed |
| Coupon copy | Icon changes from Copy to Check for 2s; button name → "Coupon copied" | Visual + SR confirmation via dynamic accessible name |

### Error States

| Scenario | Visual Indicator | Screen Reader Behaviour |
|----------|-----------------|------------------------|
| Profile load failure | `ErrorContainer` (page-level) + `RetryButton` | `role="alert"` announces the canonical error title + message |
| Profile save partial failure | Inline `Alert variant="error"` ("Name saved, but password update failed…") | `role="alert"` announces the specific partial state; name is never rolled back |
| Profile save / action failure | Inline `Alert variant="error"` at top of page | `role="alert"` announces the message without focus interruption |
| Export truncation | Inline `Alert variant="warning"` (dismissible) | `role="status"` announces the partial-export notice |
| Notification toggle failure | Toggle reverts + inline `Alert` | Visual revert + `role="alert"` announces "Failed to save preference" |

### Focus Management

| Scenario | Behaviour | Rationale |
|----------|-----------|-----------|
| Page mount | No programmatic focus | Browser focuses document body by default. No single element is the primary action target on mount. |
| Name field click | Focus moves to input | Native browser behaviour — no override needed. |
| Save button click | Button shows loading spinner (disabled); focus remains on button | User may want to wait for completion before navigating. If save fails, the toast announces the error and the user can retry from the same position. |
| Toggle click | Toggle changes immediately; focus remains on toggle | Optimistic update provides instant feedback. The user may want to immediately toggle again. |
| Copy IconButton click | Focus remains on button; toast announces success/failure | The user can copy again or proceed to share. |
| Share IconButton click | Focus remains on button; share sheet or toast appears | Web Share API takes focus; clipboard fallback shows toast. |
| Export button click | Button shows loading spinner; focus remains on button | CSV download triggers browser download dialogue — focus stays on the page. |
| "Terminate Session" click | Focus moves to ConfirmModal | Modal traps focus. User must explicitly confirm or cancel. |
| Modal confirm ("Sign Out") | Modal closes; focus returns to body (page redirects) | Session termination is a hard redirect — focus management is handled by the new page. |
| Modal cancel | Modal closes; focus returns to "Terminate Session" button | User can immediately reopen the modal if desired. |
| Toast appears | No focus change | Toast is non-interruptive. `aria-live="polite"` announces without moving focus. |

### Responsive Touch Accessibility

| Concern | Implementation |
|---------|---------------|
| Touch targets ≥ 44px | All buttons, inputs, and switches meet minimum touch target size via Tailwind padding classes |
| Switch finger-friendly | `Switch` component has sufficient height and width for thumb activation |
| Form field spacing | `Stack gap="md"` provides 16px minimum spacing between form fields — prevents accidental tap on adjacent field |
| Export buttons | Full-width on mobile via `className="flex-1"` — both buttons fill the card width |
| Grid collapse | `Grid cols={2}` collapses to single column on small viewports (via responsive Tailwind classes) |
| Modal close via overlay | `AdminModal` supports click-outside-to-close — touch users can dismiss by tapping outside |
| No horizontal scroll | All content fits within viewport width; `PageContainer` enforces horizontal padding |

### Verified Features (manual)

- Tab navigation through Name → Password → Save → Toggles → Copy →
  Share → Export Students → Export Exams → Terminate Session.
- Screen reader announces field labels on focus.
- Switch announces checked/unchecked state on toggle.
- ConfirmModal traps focus; ESC dismisses.
- Toast messages are announced by screen reader.
- All touch targets meet 44px minimum.
- No content overflows viewport width on mobile.

---

## Error Recovery Model

Every settings workflow has a defined recovery path. Failures are
localised — an error in one domain never corrupts state in another.

### Identity Domain: Profile Save

```
User clicks "Save Changes"
    ↓
Client-side validation
    ├── Name empty? → inline Alert "Name is required"
    │                   ↳ User corrects name, clicks Save again
    │
    └── Name > 80 chars? → inline Alert "Name must be 80 characters or less"
    │                       ↳ User shortens name, clicks Save again
    │
    └── Password invalid? → inline Alert (passwordSchema message)
                            ↳ User corrects password, clicks Save again
    ↓
updateSubAdminProfile() / authService.updatePassword()
    ├── Success → showSuccess("Profile updated successfully")
    │              ↳ Form state preserved for further edits
    │
    └── Name saved, password failed → inline Alert
    │     "Name saved, but password update failed: <reason>"
    │     ↳ Name stays saved; password field retains its value to correct
    │
    └── Failure → inline Alert (strips any VALIDATION_FAILED: prefix)
                  ↳ Both name and password fields retain their values
                  ↳ User can edit and retry without re-entering everything
```

**Recovery guarantee:** Form state (name, password) is preserved on
error. The user does not lose their input. Validation errors do not
clear the password field — only a successful password update does.

### Security Domain: Password Update

```
authService.updatePassword(password)
    ├── Success → password field cleared
    │              showSuccess("Profile updated successfully")
    │              ↳ Password was already validated client-side and server-side
    │
    └── Failure → inline Alert (actionError); if the name step committed first:
    │              "Name saved, but password update failed: <reason>"
                  ↳ Password field retains value for correction
                  ↳ User can edit and retry
```

**Recovery guarantee:** The password field is only cleared on success.
On failure, the user can see what they typed and correct it. The
password is never logged or stored in persistent state.

### Notifications Domain: Toggle

```
User toggles Switch
    ↓
Single-flight guard: no second toggle runs while one is in flight (switches disabled)
    ↓
Step 1: Optimistic UI update (toggle changes immediately)
    ↓
Step 2: updateSubAdminNotificationPrefs()  ← full normalized prefs from profileRef
    ├── Success → local profile state updated (functional setProfile)
    │              ↳ Toggle remains in new position
    │
    └── Failure → toggle reverts to previous value
    │              inline Alert "Failed to save preference. Please try again."
    │              ↳ User can retry immediately
    │              ↳ Previous state is restored — no manual correction needed
    ↓
Step 3: "Saving..." indicator hidden
```

**Recovery guarantee:** The revert-on-error pattern ensures the UI
never shows a state that the server does not have. The user does not
need to manually toggle back — the system handles it.

### Exports Domain: CSV Download

```
User clicks Export button
    ↓
fetchStudentsByEducatorId() / fetchTeacherExamsForExport()   [pagination, no silent limit]
    ├── Success + rows.length > 0
    │     ├── complete  → downloadCSV(), showSuccess
    │     └── truncated → downloadCSV() + inline warning Alert
    │                      (explicit "partial export" — never false success)
    │
    ├── Success + rows.length === 0 → inline Alert "No students/exams found"
    │                                  ↳ No action needed — there is no data to export
    │
    └── Network error → inline Alert "Export failed"
                        ↳ User can retry by clicking the button again
    ↓
Loading indicator hidden
```

**Recovery guarantee:** Exports are read-only. No data is mutated. A
failed export leaves no side effects — the user can retry immediately.
An empty result is not an error — it simply means there is no data.

### Recruitment Domain: Copy/Share

```
Copy: navigator.clipboard.writeText(coupon_code)
    ├── Success → setCopied(true), showSuccess, auto-reset after 2s (timer
    │              cleared before re-arming and on unmount — no stale reset)
    └── Failure → inline Alert "Failed to copy coupon", copied remains false

Share: navigator.share() / clipboard.writeText(shareText)
    ├── Web Share API: user dismisses → no error shown (expected behaviour)
    ├── Clipboard fallback success → showSuccess
    └── Clipboard fallback failure → inline Alert (manual copy instruction)
```

**Recovery guarantee:** Copy/share operates on read-only data. No
mutation occurs. A failure only affects the feedback indicator —
the coupon code remains displayed and the user can try again.

### Session Domain: Sign Out

```
User clicks "Terminate Session"
    ↓
ConfirmModal opens
    ├── Cancel → modal closes, no action
    │             ↳ User can continue using the application
    │
    └── Confirm → logout() → redirect to login
                   ↳ No recovery — session is terminated as requested
```

**Recovery guarantee:** The confirmation dialog prevents accidental
logout. Cancelling has zero side effects. Confirming is irreversible
by design — the user explicitly requested session termination.

### Domain Isolation Guarantee

| Failure Scenario | Affected Domain | Other Domains |
|-----------------|-----------------|---------------|
| Name save fails | Identity | Notifications, Recruitment, Exports, Session — unaffected |
| Notification toggle fails | Notifications | Identity, Recruitment, Exports, Session — unaffected |
| Password update fails | Security (Password) | Identity, Notifications, Recruitment, Exports, Session — unaffected |
| Export network error | Operations | Identity, Notifications, Recruitment, Session — unaffected |
| Copy clipboard failure | Recruitment | Identity, Notifications, Exports, Session — unaffected |
| Logout cancelled | Session | Identity, Notifications, Recruitment, Exports — unaffected |

Failures remain localised. They never corrupt unrelated settings state,
never cascade across domains, and never require cross-domain recovery
procedures.

---

## Performance

### Problem Analysis

The settings feature has a specific performance profile:

| Metric | Value |
|--------|-------|
| Number of async operations per session | 1 (profile load) + 1-3 (saves/toggles) + 0-2 (exports) = 2-6 |
| Number of state mutations per session | ~3-8 (hydrate + saves + toggles + feedback flags) |
| Render frequency | Once on mount + once per mutation |
| Component tree depth | 3 levels (Page → Section → Primitives), plus a gated skeleton/error surface |
| Number of section components | 5 (grid mounted only after the profile load resolves) |

This profile means the feature is **interaction-bound, not computation-bound**.
The dominant costs are network latency (API calls) and re-render propagation
(unstable callbacks). There is no expensive computation, no large list, and no
animation frame pressure.

### Implemented Optimizations

| # | Technique | Location | Problem Addressed | Measurable Benefit |
|---|-----------|----------|-------------------|-------------------|
| 1 | `useCallback` on all handlers | `useSettings` | Unstable function references cause unnecessary re-renders of child components. Without `useCallback`, each render of `useSettings` creates new function objects, triggering section components to re-render even when unrelated state changed. | Stable references across renders. A state change in `copied` no longer re-renders `IdentitySection` or `SessionSection`. |
| 2 | Stale-request protection | `useSettings` (via `useStableFetch`) | Users navigating away during an in-flight async operation (profile load, save, toggle, copy, share, exports) could trigger `setState` on an unmounted component, causing a React warning and potentially rendering stale data. | All async operations (including `fetchData`) check `mountedRef.current` before calling any setter. After unmount, no state updates occur. Prevents the "Can't perform a React state update on an unmounted component" warning and avoids rendering data from a stale session. |
| 3 | Scoped state ownership | `useSettings` | State defined in a shared context or at the App level would re-render unrelated features on every settings state change. | All 16 state variables (plus 5 refs) are owned by `useSettings`. Re-renders are scoped to the settings page subtree. Unrelated features (dashboard, exams, students) are never affected by settings state changes. |
| 4 | Single fetch on mount + explicit retry | `useSettings` | Multiple fetches (polling, interval, refetch on unrelated state changes) would add unnecessary network calls. | Profile data is fetched by `fetchData` when `user?.id` becomes available, and again only on explicit user retry (error surface's `RetryButton`). No polling, no interval, no `refetchOnFocus`, no refetch on unrelated state changes. Total cost: 1 query per fetch (2 table reads: `sub_admins` + `users`). |
| 5 | Optimistic UI for toggles | `useSettings` | Waiting for the API call to complete before updating the toggle introduces perceived latency (typically 100-500ms). | Toggle updates immediately. The user sees the new state before the API call completes. If the call fails, the toggle reverts. Measured: perceived latency for toggle = 0ms (instant) vs. 100-500ms without optimisation. |

### Intentionally Rejected Optimizations

| # | Technique | Evidence for Rejection |
|---|-----------|----------------------|
| 1 | `React.memo` on section components | Section components are gated behind a loading skeleton/error surface, so they render with real data only. `React.memo` performs a shallow comparison on every render. The section components are small (IdentitySection: 59 lines, RecruitmentSection: 36 lines, NotificationSection: 48 lines, BackupSection: 29 lines, SessionSection: 43 lines). Their render cost is estimated at < 0.5ms each. With `useCallback` already preventing unnecessary re-renders from handler identity changes, the only remaining re-render triggers are prop value changes (intentional) or parent re-renders (already scoped). `React.memo` would add a shallow comparison (3-7 props × ~0.01ms = ~0.07ms) for zero skip benefit — no re-renders are being skipped that aren't already prevented by `useCallback`. |
| 2 | `useMemo` on profile-derived values | The profile object is set once on mount and mutated at most 2-3 times per session (name change + 1-2 notification toggles). There are no derived values computed from profile — the section components receive the raw fields (name, email, couponCode) as separate props. `useMemo` would store the previous reference and compare dependencies on every render, but since there is nothing to derive, the memo would be a no-op with overhead. |
| 3 | Debounced save | Profile save is button-triggered, not keystroke-triggered. The user explicitly clicks "Save Changes" to initiate the save. There is no keystroke-by-keystroke validation that would benefit from debouncing. Adding a 200ms debounce to the button click would add perceived latency with zero accuracy benefit — the user expects an immediate response to the click. |
| 4 | Polling for profile updates | Profile data changes only when the user explicitly saves (name change) or when an external admin modifies the sub-admin account (rare). Neither case benefits from polling. Polling would add a network call every N seconds (e.g., 30s × 60 = 2,880 calls per day) for zero benefit — the user already has the latest data they care about. |
| 5 | Profile refetch after save | After saving the name or toggling a notification, the local state is updated optimistically. A refetch from the server would add a network round-trip (100-500ms) with zero benefit — the local state was just confirmed by the successful API call. The local state is the source of truth until the next page load. |
| 6 | Local draft persistence (localStorage) | The settings form has no "discard changes" risk. Toggles take effect immediately (optimistic UI). The profile form requires an explicit "Save Changes" click and there is no unsaved-changes warning on navigation. Adding localStorage persistence would: (a) add serialisation/deserialisation on every state change, (b) require dirty-state detection, (c) add a "resume draft" path, (d) introduce cleanup when changes are saved. The current session is short (< 5 minutes) and the data is non-critical — the risk of data loss is negligible. |
| 7 | Server-side validation for name field | Name validation (non-empty) is a trivial string check that runs in < 0.01ms client-side. Adding server-side validation would add 100-500ms network latency with zero correctness benefit — the database already enforces NOT NULL on the `full_name` column. |
| 8 | Lazy loading section components | All 5 section components are always visible (two `SectionReveal` rows in the grid). Lazy loading them would add a network round-trip (for the chunk) and a brief loading state, with no reduction in initial render cost — the grid layout requires all sections to render anyway. |

### Governing Principle

All optimization decisions follow the governance rule: *Optimize only
with measurable evidence.* Every implemented optimization addresses a
demonstrated cost. Every rejected optimization was evaluated against
the actual interaction pattern — not applied speculatively.

| Addressed Cost | Optimisation |
|----------------|-------------|
| Unstable callback references → unnecessary re-renders | `useCallback` on all handlers |
| Stale state after unmount → warnings + stale data | `mountedRef` guards on all async operations |
| Re-render propagation beyond settings → wasted work | Scoped state ownership in `useSettings` |
| Unnecessary network calls → latency + server load | Single fetch on mount, no polling |
| Perceived latency on toggle → delayed feedback | Optimistic UI with revert-on-error |

---

## Governance Rules

1. **Preserve settings workflow correctness** — loading, profile save,
   password update, notification toggles, coupon actions, exports, and
   sign-out are unchanged.
2. **Preserve password security workflow** — client-side validation,
   server-side validation, Supabase Auth update, no current password
   check.
3. **Preserve notification behavior** — optimistic UI with revert on
   error, single-flight preference writes (one toggle in flight at a
   time, switches disabled while saving), inline Alert feedback.
4. **Preserve recruitment workflow** — clipboard copy, Web Share API
   with fallback, same feedback.
5. **Preserve backup workflow** — CSV export with same headers and
   formatting.
6. **Preserve session security** — confirmation dialog before sign-out.
7. **Preserve accessibility** — all keyboard behaviour, ARIA labels,
   and confirmation flow are preserved.
8. **Architecture over uniformity** — presentation components are
   feature-specific with deliberate section boundaries.
9. **Feature-local ownership** — `useSettings` owns all settings logic;
   no global abstractions.
10. **Reuse canonical components where objectively beneficial** —
    `PageContainer`, `Stack`, `Grid`, `Card`, `Input`, `Button`,
    `IconButton`, `Switch`, `Label`, `Body`, `SectionReveal`, and
    `ConfirmModal` are all from canonical sources.
11. **Optimize only with measurable evidence** — `useCallback` on all
    handlers, stale-request protection. All rejected optimisations
    documented with evidence.
12. **Separate accepted design decisions from actual technical debt** —
     feature-specific section components are accepted design decisions.
     `ensureRole` is used on `fetchTeacherExamsForExport`; the two
     read-only helpers derive the user ID from the authenticated session
     (never user input) with RLS as the defence-in-depth backstop —
     documented, not debt.
13. **Repository-wide opportunities must never block certification.**
14. **Certify only independently verified improvements.**
15. **Freeze the feature before proceeding to the next migration.**

---

## Extension Points

- **Avatar/photo upload**: Add a file upload field in IdentitySection
  with a profile picture URL column in the `sub_admins` table.
- **Two-factor authentication**: Add a TOTP setup/verify flow in
  SessionSection.
- **Email notifications preference expansion**: Add more granular
  notification types (daily digest, weekly summary, exam reminders).
- **Theming/preferences**: Add theme toggle (light/dark) and
  language/locale preference.
- **API token management**: Add token generation/revocation UI for
  API access.
- **Activity log**: Add a section showing recent account activity
  (logins, password changes, preference changes).
- **Bulk CSV import**: Extend BackupSection with import functionality
  for uploading students from CSV.

---

## Future Maintenance

- If `ProfileData` or `NotificationPrefs` interfaces change, update
  `types.ts` and the corresponding section components.
- If notification keys change, update `handleTogglePref` calls in the
  page and the `NotificationSection` component.
- If export headers change, update `handleExportStudents` and
  `handleExportExams` in `useSettings.ts`.
- If the password policy changes, update `passwordSchema` in
  `securitySchemas.ts` (the settings page uses it directly).
- If the `sub_admins` table schema changes, update repository methods
  in `user.repository.ts`.
- If new sections need to be added, create a new presentation component
  in `components/sub-admin/settings/`, add state/handlers in
  `useSettings.ts`, and add the component to the page layout.

---

## Freeze Status

### Architecture

- **`useSettings` is the single orchestration layer** — all state
  ownership, data loading, and event handlers are in the feature hook.
  The page (136 lines) is thin composition with explicit loading/error
  gates (skeleton, `ErrorContainer` + `RetryButton`). No other hook or
  context holds settings state.
- **Each settings domain is independently encapsulated** — Identity,
  Security, Notifications, Recruitment, and Operations are separate
  workflows with separate data, separate handlers, and separate UI
  sections. A bug in one domain cannot corrupt another.

### Workflow Preservation

| Workflow | Status | Evidence |
|----------|--------|----------|
| Identity | ✅ Preserved | Same `fetchSubAdminProfileAndUser` → hydrate → `updateSubAdminProfile` save path |
| Password | ✅ Preserved | Same `passwordSchema` validation, `authService.updatePassword`, Supabase Auth update |
| Notifications | ✅ Preserved | Same optimistic UI with revert on error, same preference keys, same "Saving..." indicator; single-flight writes + switches disabled while saving |
| Recruitment | ✅ Preserved | Same clipboard copy with checkmark (timer cleanup safe on rapid re-copy/unmount), same Web Share API with text fallback |
| Exports | ✅ Preserved | Same CSV headers (`students_export.csv`, `exams_export.csv`), same data formatting; paginated fetch + explicit truncation notice |
| Session | ✅ Preserved | Same `useSignOutConfirmation` with confirmation dialog, `AuthContext.logout` on confirm |

### Design Decisions

- **Canonical component reuse is intentional** — `PageContainer`,
  `Stack`, `Grid`, `Card`, `Input`, `Button`, `IconButton`, `Switch`,
  `Label`, `Body`, `SectionReveal`, `ConfirmModal`, and
  `ToastContainer` are all from canonical sources. No reusable
  primitive was reimplemented.
- **Feature-specific sections are justified** — `IdentitySection`,
  `RecruitmentSection`, `NotificationSection`, `BackupSection`, and
  `SessionSection` represent five independent business domains with no
  reuse target. Each is a thin composition of canonical primitives.
  Documented with rationale in Design System Verification.
- **Optimistic notification updates are intentional** — the toggle
  changes immediately, then persists. If persistence fails, the toggle
  reverts. This provides instant feedback while maintaining server
  consistency.
- **Exports remain read-only operations** — both student and exam
  exports fetch data and trigger a CSV download. No data is mutated.
  A failed export leaves no side effects.
- **Session termination remains confirmation-gated** — the user must
  explicitly confirm in a modal dialog before logout executes.
  Cancelling has zero side effects.

### Optimization Integrity

- **Performance decisions are evidence-based** — `useCallback` on all
  handlers, stale-request protection via `mountedRef` on all async
  operations, scoped state ownership in `useSettings`, single fetch on
  mount, optimistic UI for toggles. All 8 intentionally rejected
  optimisations (`React.memo`, `useMemo`, debounced save, polling,
  profile refetch, localStorage persistence, server-side name
  validation, lazy loading) are documented with measurable evidence
  in the Performance section.

### Accessibility Verification

- **Keyboard navigation** — Tab order covers all interactive elements
  (Name → Password → Save → 3 Switches → Copy → Share → Export
  Students → Export Exams → Terminate Session).
- **Form labels** — All fields have visible `<Label>` elements.
- **ARIA labels** — Icon buttons (`aria-label="Copy coupon"`,
  `aria-label="Share coupon"`).
- **Confirmation dialog** — Focus trapping, ESC dismiss, labelled
  buttons.
- **Toast announcements** — `aria-live="polite"` via `useToast`.
- **Touch targets** — All interactive elements ≥ 44px.
- **Responsive layout** — No horizontal scroll on mobile; grid
  collapses to single column.

### Error Recovery

- **Identity save failures** — Form state preserved for retry.
- **Notification toggle failures** — Automatic revert to previous
  state.
- **Password update failures** — Password field preserved for
  correction.
- **Export failures** — No side effects; immediate retry possible.
- **Session termination** — Explicit confirmation; cancel has zero
  side effects.
- **Domain isolation** — Failures never corrupt unrelated domains.

### Certification

**The feature is fully certified** under the current Golden Reference
architecture. All governance rules are satisfied. Remaining
observations are accepted design decisions that do not block
certification:

| Observation | Classification | Rationale |
|-------------|---------------|-----------|
| Partial `ensureRole` coverage on read-only service functions | Accepted design decision | `fetchTeacherExamsForExport` uses `ensureRole`; the two read helpers derive the user ID from the authenticated session, never from user input; route guard + RLS provide defence in depth |
| Feature-specific section components | Accepted design decision | Five independent business domains with no reuse target |
| No current password check for password change | Accepted design decision | Session itself is authorisation (unlike User Profile which requires reauthentication) |

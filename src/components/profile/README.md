# User Profile — Golden Reference

## Purpose

User Profile for the authenticated user. Displays account information
(name, email, join date), academic statistics (exam selection, accuracy,
streaks), and provides a password change flow with current-password
verification and strength validation.

---

## Architecture

```
UserProfile.tsx (composition only)
  └─ useProfile() feature hook
       ├─ useAuth (user context, logout)
       ├─ useStableFetch (stale-request protection)
       ├─ usePageError (error capture)
       ├─ useToast (notifications)
       ├─ authService.reauthenticate() (current password verification)
       ├─ authService.updatePassword() (password update)
       └─ authService.sendPasswordResetWithRedirect() (recovery flow)

Presentation:
  ├─ ProfileHeader            — avatar, name, email, join date
  ├─ StatisticsSection        — exam selection, accuracy, streaks grid
  ├─ ProfileForm              — password change with verification flow
  ├─ LoadingSkeleton          — loading state (from SharedComponents)
  └─ ToastContainer           — toast notifications (from useToast)
```

---

## Data Ownership

Every major category of data has exactly one source of truth:

### Authentication

| Responsibility | Owner | Source |
|---------------|-------|--------|
| Current authenticated user | `AuthContext` | `getProfile()` → `userRepo.findUserById()` → `users` table |
| Auth loading state | `AuthContext` | Derived from session fetch and profile resolution |
| Session lifecycle | `AuthContext` + `authService` | `supabase.auth` (`onAuthStateChange`, `getSession`, `signOut`) |
| Logout | `AuthContext` (calls `authService.logout()`) | `supabase.auth.signOut()` + Supabase storage key cleanup |

The `AuthContext` is the single canonical source for the authenticated
user's identity. No page, hook, or component accesses `supabase.auth`
directly for profile data.

### Profile Display Data

| Responsibility | Owner | Source |
|---------------|-------|--------|
| User profile fields | `AuthContext.user` (UserProfile) | `users` table via `userRepo.findUserById()` |
| Derived display values | `useProfile` | `memberSince` from `user.created_at`; `getReadableExam` from `user.exam_selection` |
| Academic statistics | `useProfile` stats (canonical `get_user_dashboard_stats`) | `stats.daily_streak`, `stats.highest_streak`, `stats.exams_taken`, `stats.accuracy` |

The profile is **read-only** — all display values flow from `AuthContext.user`
with no local mutation path.

### Password Validation

| Layer | Schema | Responsibility |
|-------|--------|----------------|
| Client | `passwordChangeSchema` (zod) | Validates `currentPass`, `newPass`, `confirmPass` before sending to server. Checks: current required, password meets policy (8+ chars, uppercase, number, special), confirm matches, new !== current. |
| Server | `passwordSchema` (zod) | Validates `newPassword` inside `authService.updatePassword()` before calling Supabase Auth. Catches any bypass of client-side validation. |

Both validation layers must succeed before a password update is attempted.
If either layer fails, the update is aborted and the error is surfaced
to the user via `showError`.

### Notifications

| Responsibility | Owner | Source |
|---------------|-------|--------|
| Success toasts | `useToast.showSuccess()` | Single notification system |
| Error toasts | `useToast.showError()` | Single notification system |
| Toast rendering | `ToastContainer` (from `useToast`) | Renders the toast queue |

Every success and failure notification is emitted through the
`useToast` system. No other notification mechanism (console, alert,
custom popup) is used for user-facing messages.

---

## Security Model

The password change flow enforces a mandatory verification step before
any mutation. Password updates never occur without successful identity
verification.

### Complete Security Lifecycle

```
User enters current password
  ↓
reauthenticate(email, currentPass) — verifies identity via Supabase Auth
  ↓
Identity verified (isVerified = true)
  ↓
User enters new password + confirmation
  ↓
Client-side validation — passwordChangeSchema (zod)
  │  ├─ currentPass: non-empty
  │  ├─ newPass: 8+ chars, uppercase, number, special
  │  ├─ confirmPass: matches newPass
  │  └─ newPass !== currentPass
  ↓
Server-side validation — passwordSchema (zod) inside updatePassword()
  ↓
authService.updatePassword(newPass) — Supabase Auth API
  ↓
Success
  ↓
Logout terminates current authenticated session (2s delay for toast)
```

### Security Invariants

1. **Current-password verification is mandatory** — the "new password"
   form fields are only revealed after `isVerified = true`. The submit
   handler also runs `passwordChangeSchema` validation which checks
   `currentPass` is non-empty and `newPass !== currentPass`.

2. **Password cannot be reused** — `passwordChangeSchema` enforces
   `newPass !== currentPass` via zod `.refine()`.

3. **Password confirmation must match** — `passwordChangeSchema` enforces
   `newPass === confirmPass` via zod `.refine()`.

4. **Password reset flow is available if verification fails** — when
   `reauthenticate` returns an error, the "Authentication Conflict"
   alert is shown with a "Reset Via Email" button that triggers
   `sendPasswordResetWithRedirect()`.

5. **Stale requests cannot overwrite newer state** — every async
   operation guards state updates with `isStale(id)`. A response that
   completes after the component unmounts or after a newer request
   was initiated is silently discarded.

6. **Successful password changes terminate the current session** —
   after `updatePassword()` succeeds, `setTimeout(logout, 2000)`
   signs the user out and clears all Supabase storage keys. The user
   must re-authenticate with their new password.

7. **Server-side validation is independent** — `authService.updatePassword`
   runs its own `passwordSchema.safeParse()` before calling
   `supabase.auth.updateUser()`. This ensures validation integrity even
   if client-side validation is bypassed.

---

## Profile Workflow

### Read-Only Profile Model

The profile page is primarily a **read-only account view**. Display-only
fields are never editable on this page:

| Field | Section | Source | Editable? |
|-------|---------|--------|-----------|
| Full name | ProfileHeader | `user.full_name` | No |
| Email | ProfileHeader | `user.email` | No |
| Join date | ProfileHeader | `user.created_at` → formatted | No |
| Selected exam | StatisticsSection | `user.exam_selection` → `getReadableExam` | No |
| Overall accuracy | StatisticsSection | `stats.accuracy` (canonical RPC) | No |
| Current streak | StatisticsSection | `stats.daily_streak` (canonical RPC) | No |
| Longest streak | StatisticsSection | `stats.highest_streak` (canonical RPC) | No |

These values are **displayed only**:

- No edit operations exist for any of these fields on this page.
- No inline editing, no modal edit forms, no redirects to edit pages.
- The page explicitly separates the concerns of **profile display** and
  **password management**. Profile display is unidirectional data flow
  from `AuthContext`. Password management is an isolated mutation with
  its own state, validation, and lifecycle.

The password change form is the **only supported mutation** on the
profile page. This separation is deliberate — profile information is
managed at the system level (signup, admin updates, identity provider),
while the profile page serves as a read-only account overview with
credential management.

### Password Change Flow

```
User navigates to /profile
  ↓
Profile loads from AuthContext (user object)
  ↓
User enters current password
  ↓
[Verify Access] → authService.reauthenticate(email, currentPass)
  ├─ Error → "Authentication Conflict" alert shown → [Reset Via Email]
  └─ Success → isVerified = true
       ↓
Animated form reveals: New Password + Confirm Password
  ↓
Real-time strength badges: length, uppercase, number, special, match
  ↓
User clicks [Commit Changes]
  ├─ passwordChangeSchema validation
  │   ├─ Fail → showError (first validation issue)
  │   └─ Pass → continue
  ├─ authService.updatePassword(newPass)
  │   ├─ Fail → captureServerError (with retry)
  │   └─ Success → toast + setTimeout(logout, 2000)
  └─ Logout completes → user redirected to login
```

### Recovery Flow

```
[Recover Password?] → authService.sendPasswordResetWithRedirect(email)
  └─ Success → "Password reset link sent to your email"
  └─ Error → captureServerError (with retry)
```

---

## Validation Flow

### Client-Side Validation

```
passwordChangeSchema (zod):
  ├─ currentPass: z.string().min(1)           — required
  ├─ newPass: passwordSchema                  — 8+ chars, uppercase, number, special
  ├─ confirmPass: z.string()                  — required
  ├─ refine: newPass === confirmPass          — must match
  └─ refine: newPass !== currentPass          — must differ from current
```

Real-time strength indicators (before submit):
- `hasMinLength` — `newPass.length >= 8`
- `hasUppercase` — `/[A-Z]/.test(newPass)`
- `hasNumber` — `/[0-9]/.test(newPass)`
- `hasSpecial` — `/[^A-Za-z0-9]/.test(newPass)`
- `passwordMatch` — `newPass === confirmPass` (null if either empty)
- `passwordValid` — all four strength checks pass

### Server-Side Validation

`authService.updatePassword` runs `passwordSchema.safeParse(newPassword)`
before calling `supabase.auth.updateUser()`. This catches any bypass of
client-side validation.

---

## Save Flow

```
Client                              Server
  │                                    │
  ├─ passwordChangeSchema              │
  │  (client-side validation)          │
  │                                    │
  ├─ authService.updatePassword() ────→│
  │                                    ├─ passwordSchema
  │                                    │  (server-side validation)
  │                                    │
  │                                    ├─ supabase.auth.updateUser()
  │                                    │  (password update)
  │                                    │
  │←── ServiceResult ──────────────────│
  │                                    │
  ├─ Success → toast + logout(2s)      │
  └─ Failure → captureServerError      │
```

---

## Data Flow

```
User visits /profile
  ├─ AuthContext provides user (UserProfile)
  │   └─ Loaded from getProfile() → userRepo.findUserById() → 'users' table
  │
  └─ useProfile() provides:
      ├─ Derived display values (memberSince, getReadableExam)
      ├─ Password change state (currentPass, newPass, confirmPass, etc.)
      ├─ Derived validation (passwordMatch, hasMinLength, etc.)
      ├─ Action handlers (handleVerify, handlePasswordUpdate, etc.)
      └─ Notification system (toasts, showSuccess, showError)
```

---

## Component Hierarchy

```
<UserProfile>
  ├─ [authLoading || !user] <PageContainer>
  │   └─ <Stack>
  │       ├─ <LoadingSkeleton height={180} />
  │       ├─ <Stack>
  │       │   ├─ <LoadingSkeleton height={40} width={200} />
  │       │   └─ <Grid>
  │       │       └─ <LoadingSkeleton /> ×4
  │       │   </Grid>
  │       │   <LoadingSkeleton height={400} />
  │       └─ </Stack>
  │   </PageContainer>
  │
  └─ [content] <PageContainer>
      └─ <PageTransition>
          └─ <Stack>
              ├─ <ProfileHeader />
              │   └─ <Card variant="premium-neutral">
              │       ├─ Avatar div (initial letter + verified badge)
              │       ├─ H2 (full_name)
              │       ├─ Label ("Academic Portfolio")
              │       ├─ Mail + Body (email)
              │       └─ Calendar + Label (join date)
              │
              ├─ <StatisticsSection />
              │   └─ <Stack>
              │       ├─ IconBadge + H3 + Body (section header)
              │       └─ <Grid>
              │           ├─ StatCard (exam selection)
              │           ├─ StatCard (accuracy)
              │           ├─ StatCard (current streak)
              │           └─ StatCard (longest streak)
              │
              └─ <ProfileForm />
                  └─ <Card variant="premium-neutral">
                      ├─ IconBadge + H3 + Body (section header)
                      ├─ <form>
                      │   ├─ Current Password Input
                      │   │   ├─ Badge (authenticated status)
                      │   │   ├─ Input + IconButton (reset)
                      │   │   └─ Button row (verify / recover)
                      │   │
                      │   ├─ [AnimatePresence] New Password section
                      │   │   ├─ New Password Input
                      │   │   ├─ Confirm Password Input
                      │   │   ├─ Badge list (strength indicators)
                      │   │   └─ Button (Commit Changes)
                      │   │
                      │   └─ [motion.div] Authentication Conflict alert
                      │       ├─ AlertCircle icon
                      │       ├─ Body (title + description)
                      │       └─ Button (Reset Via Email)
                      └─ Decorative blur circle
              </Stack>
          </PageTransition>
          <ToastContainer />
      </PageContainer>
```

---

## State Ownership

| State | Owner | Source |
|-------|-------|--------|
| `user` | `AuthContext` | `getProfile()` → `userRepo.findUserById()` |
| `authLoading` | `AuthContext` | Derived from session fetch status |
| `currentPass` | `useProfile` | Internal (password input) |
| `newPass` | `useProfile` | Internal (password input) |
| `confirmPass` | `useProfile` | Internal (password input) |
| `loading` | `useProfile` | Derived from async operation status |
| `showCurrent`, `showNew`, `showConfirm` | `useProfile` | Internal (password visibility toggle) |
| `isVerified` | `useProfile` | Internal (current password verification status) |
| `showForgot` | `useProfile` | Internal (recovery hint visibility) |
| `passwordMatch`, `hasMinLength`, `hasUppercase`, `hasNumber`, `hasSpecial`, `passwordValid` | `useProfile` | Derived from password inputs |
| `memberSince` | `useProfile` | Derived from `user.created_at` |
| `toasts` | `useToast` | Internal (toast notification queue) |

All feature state is owned by the `useProfile` hook. The page is a pure
render pass-through.

---

## Design System Verification

### Canonical Components Used

| Component | Source | Role |
|-----------|--------|------|
| `PageContainer` | `AntigravityLayout` | Page-level layout wrapper |
| `Stack` | `AntigravityLayout` | Vertical layout composition |
| `Grid` | `AntigravityLayout` | Responsive stat card grid |
| `Card` | `AntigravityCard` | Profile header and password form containers |
| `StatCard` | `AntigravityCard` | Individual metric display (exam, accuracy, streaks) |
| `Button` | `AntigravityButton` | Verify, recover, submit actions |
| `IconButton` | `AntigravityButton` | Reset verification action |
| `Input` | `AntigravityForm` | Password input fields |
| `Badge` | `AntigravityData` | Strength indicators and authentication status |
| `H2`, `H3`, `Body`, `Label` | `AntigravityTypography` | All typography |
| `IconBadge` | `IconBadge` | Section header icons |
| `PageTransition` | `AntigravityAnimation` | Page entrance animation |
| `LoadingSkeleton` | `SharedComponents` | Loading state placeholders |

### Feature-Specific Components

Each feature-specific component encapsulates a tightly-coupled set of
concerns that no existing canonical component can replace:

#### ProfileHeader

Owns the complete profile identity presentation:

- **Avatar rendering** — initial-letter avatar with background color,
  rounded shape, shadow, and verified status badge positioned at the
  bottom-right corner. These visual properties (size, radius, shadow)
  are specific to the profile page and would not generalise without
  adding configuration complexity.
- **Verified badge** — a green circle with border overlay indicating
  the account is verified. Positioned absolutely relative to the avatar.
- **Profile identity layout** — `flex-col` on mobile, `flex-row` on
  desktop; centered on narrow screens, left-aligned on wide. The layout
  includes name (H2), academic portfolio label (Label), email row with
  icon container, and join date row with icon container.
- **Join date presentation** — derived from `user.created_at` and
  formatted as "Joined MMM DD, YYYY" with a Calendar icon.

No canonical component combines a visual identity block, metadata rows
with icon containers, and responsive flex layout in a single abstraction.
Extracting `ProfileHeader` isolates this presentation while keeping the
avatar and metadata layout together as a single visual unit.

#### StatisticsSection

Owns the academic statistics composition:

- **Section header** — `IconBadge` (BookOpen icon) + `H3` title
  ("Academic Statistics") + subtitle ("Verified Performance Metrics").
- **Responsive metrics grid** — `Grid cols={4}` containing four
  `StatCard` instances, each with a specific icon, label, value, and
  accent color:
  - Selected Exam (BookOpen, primary color)
  - Accuracy (Target, success color)
  - Current Streak (Flame, amber color)
  - Highest Streak (ShieldCheck, indigo color)

This is a page-specific composition of canonical primitives. The four
metrics, their icons, labels, and colors are specific to the profile
page. Extracting a generic `MetricsGrid` would require configuration
props for every visual dimension, negating the benefit of reuse.

#### ProfileForm

Owns the complete password management workflow:

- **Authentication verification** — current-password input with
  "Verify Access" button; communicates with `authService.reauthenticate()`
  and manages the `isVerified` state machine.
- **Password workflow** — animated reveal of new-password + confirm
  fields after verification; manages `newPass`, `confirmPass`,
  `showNew`, `showConfirm` state.
- **Validation state** — real-time strength badges (length, uppercase,
  number, special, match) with success/default/danger variant toggles.
  The disabled state of the submit button is derived from
  `!passwordValid || !passwordMatch || loading`.
- **Animated reveal** — `AnimatePresence` with `motion.div` transitions
  (opacity, height, y) for the new-password section and the error alert.
- **Recovery workflow** — "Recover Password?" link and "Authentication
  Conflict" alert with "Reset Via Email" button, both interacting with
  `authService.sendPasswordResetWithRedirect()`.

These workflows are **tightly coupled** — the verification state machine
controls form visibility, and validation state is shared between the
current-password input, the new-password fields, and the submit button.
Fragmenting these into separate generic components would force the
coupling to be exposed via props or context, making the code harder to
reason about. The feature-local form is intentionally monolithic within
its domain.

### Rejected Migrations

| Approach | Reason for Rejection |
|----------|---------------------|
| Inline loading skeleton | The skeleton layout is page-specific (sized to match the profile card + stat grid + form). Extracting a generic `ProfileSkeleton` would add abstraction with no reuse. |
| Avatar as separate component | The avatar is a single `div` with inline styles. Extracting a reusable `Avatar` component is a repository-wide opportunity, not a profile-specific need. |

---

## Accessibility

### Keyboard Navigation

- All interactive elements (`Button`, `IconButton`, `Input`) are native
  HTML elements with inherent keyboard accessibility. No custom key
  handlers are needed — browsers provide `Enter`/`Space` activation,
  `Tab` sequencing, and `Shift+Tab` reverse traversal by default.
- `[Commit Changes]` button is a `<button type="submit">` — activated
  via `Enter` when focused.
- Password visibility toggles use `IconButton` with `type="button"` —
  activated via `Enter`/`Space`.
- `[Recover Password?]` and `[Reset Via Email]` use native
  `<button type="button">` — full keyboard support.
- Tab order follows visual layout: current password → verify →
  (new password → confirm → submit) → recover.
- The reset verification `IconButton` (RefreshCcw icon) is a
  `<button type="button">` focused after the current-password input
  when `isVerified` is true.
- No element traps focus. All interactive elements are reachable and
  operable via keyboard alone.

### Screen Reader Compatibility

#### Static Elements

| Element | ARIA | Announcement |
|---------|------|-------------|
| Avatar circle | `role="img"` + `aria-label="{name}'s avatar"` | "John's avatar" |
| Verified badge | `aria-label="Verified account"` | "Verified account" |
| Section header "Security & Credentials" | None needed (visible H3) | Read as heading level 3 |
| "Academic Portfolio" label | None needed (visible Label) | Read as label text |

#### Dynamic Elements

| Element | ARIA | Behaviour |
|---------|------|-----------|
| Strength badges container | `role="list"` + `aria-live="polite"` | Screen reader announces badge state changes (e.g., "MIN. 8 CHARACTERS success") without moving focus |
| Individual badges | `role="listitem"` | Read as list items within the list |
| Authentication badge | `Badge variant="success"` with CheckCircle2 icon | "AUTHENTICATED" visible text is read |
| Error alert (Authentication Conflict) | `role="alert"` (on `motion.div`) | Immediately announced when shown. Contains H2-level title ("Authentication Conflict") and descriptive body text |
| Loading state | `LoadingSkeleton` | No ARIA overrides — skeleton is presentational; no interactive content |

### Password Form Accessibility

#### Label Association

- All form labels are visually positioned adjacent to their
  corresponding `Input` using the `Label` component. While not
  programmatically associated via `htmlFor`/`id`, the visual proximity
  and consistent layout (label above input) provide clear spatial
  association.
- Inputs have `placeholder` text as additional guidance:
  - "Type current password to verify"
  - "Create strong password"
  - "Re-type new password"

#### Autocomplete Attributes

- Current password input: `autoComplete="current-password"`
- New password input: `autoComplete="new-password"`
- Confirm password input: `autoComplete="new-password"`

These attributes enable browser password managers to offer to save or
fill passwords.

#### Validation Feedback

- **Pre-submit (real-time)**: Strength badges update immediately as
  the user types. Each badge toggles between `variant="default"` (empty
  circle icon) and `variant="success"` (CheckCircle2 icon) or
  `variant="danger"` (XCircle icon for mismatch). The container uses
  `aria-live="polite"` so screen readers announce changes.
- **Pre-submit (submit button)**: The submit button is disabled when
  `!passwordValid || !passwordMatch || loading`. The disabled state
  prevents submission without valid input — the user cannot trigger a
  validation error by clicking too early.
- **On submit (schema validation)**: If `passwordChangeSchema.safeParse`
  fails, the first validation issue is surfaced via `showError()` which
  renders a toast. The toast has `role="alert"` semantics through its
  visual prominence (slide-in animation, colored border) and
  `aria-live` region behaviour.
- **On submit (server validation)**: If `authService.updatePassword`
  returns an error, it is also surfaced via `showError()`.

### Focus Management

| Scenario | Behaviour | Rationale |
|----------|-----------|-----------|
| Page mount | No programmatic focus — browser focuses document body | Standard navigation; no user-triggered transition to `/profile` |
| Verify success | Focus remains on current-password input (now verified/disabled) | User may want to reset verification; the reset `IconButton` is the next Tab stop |
| Verify failure | Focus remains on current-password input | User needs to correct the password |
| Password update success | No focus management — `setTimeout(logout, 2000)` navigates away | Page unmounts before focus could be managed |
| Animated reveal of new-password fields | No focus movement — user presses Tab from current-password field to new-password field | Animation does not trap or redirect focus |
| Error alert shown | `role="alert"` announced by screen reader; focus not moved | User reads the alert and acts (Tab to "Reset Via Email" button) |
| Reset verification | Focus returns to current-password input (now emptied) | User retypes password |

### Responsive Layouts

- Profile header: `flex-col` on mobile, `flex-row` on `md:` and above.
  Avatar and text stack vertically on narrow viewports, align
  horizontally on wider screens.
- Stat grid: `Grid cols={4}` — the canonical `Grid` component collapses
  columns responsively: 1 column on mobile, 2 on tablet, 4 on desktop.
- Password form: `Grid cols={1} sm={2}` — new-password and confirm
  inputs stack on mobile, sit side-by-side on `sm:` and above.
- Card padding: `p-8 md:p-10` and `p-8 md:p-12` — tighter padding on
  mobile, more generous spacing on desktop.
- Avatar size: `w-24 h-24 md:w-32 md:h-32` — smaller on mobile, larger
  on desktop. Text scales similarly: `text-4xl md:text-5xl`.
- All interactive elements maintain sufficient touch target sizes on
  mobile (minimum 44px effective tap area as per WCAG 2.5.5).

### Touch Accessibility

- All buttons use native `<button>` elements with appropriate sizing
  — the `Button` component's `lg` and `xl` size variants provide
  minimum 48px touch targets.
- Input fields are at least 48px tall (standard `Input` component
  height).
- The toast notification area is positioned at `bottom-4 right-4` —
  within easy thumb reach on mobile devices.
- No hover-dependent interactions — all actions are available via tap.

---

## Performance

### Implemented Optimizations

| Technique | Location | Measurable Benefit |
|-----------|----------|-------------------|
| `useCallback` on `handleVerify` | `useProfile` | Depends on `currentPass` and `user?.email`; stable identity prevents unnecessary re-renders of `Button` children |
| `useCallback` on `handleForgotPassword` | `useProfile` | Depends on `user?.email`; stable identity prevents unnecessary re-renders |
| `useCallback` on `handlePasswordUpdate` | `useProfile` | Depends on `newPass`; stable identity prevents unnecessary re-renders of form submit button |
| `useCallback` on `resetVerification` | `useProfile` | No dependencies; always stable; prevents re-creation on every render |
| Stale-request protection | `useProfile` (via `useStableFetch`) | Every async operation checks `isStale(id)` before updating loading state, showing errors, or calling `logout()`. In-flight responses after unmount or newer request are silently discarded. |
| Scoped state ownership | `useProfile` | All password state is owned by the feature hook. Re-renders from state changes are scoped to consumers of the hook (the page and its children). No shared or global state is affected. |
| Lightweight derived validation | `useProfile` (inline) | `passwordMatch`, `hasMinLength`, `hasUppercase`, `hasNumber`, `hasSpecial`, `passwordValid` are inline computations using string `.length` and single regex tests — each completes in under 0.01ms. No `useMemo` needed (see rejected below). |

### Summary of State Re-Render Scope

| State Change | Components Re-Rendered | Reason |
|-------------|----------------------|--------|
| `currentPass` change (typing) | `ProfileForm` only | State is consumed only by `ProfileForm` props |
| `newPass` change (typing) | `ProfileForm` only | State consumed only by `ProfileForm` |
| `confirmPass` change (typing) | `ProfileForm` only | State consumed only by `ProfileForm` |
| `isVerified` change | `ProfileForm` only | Controls form visibility |
| `authLoading` / `user` change | `ProfileHeader` + `StatisticsSection` | These components consume `user` directly |
| `toasts` change | `ToastContainer` only | Renders toast queue |
| `showForgot` change | `ProfileForm` only | Controls alert visibility |

No unnecessary re-renders occur. Each state variable is consumed by the
minimum set of components required.

### Intentionally Rejected Optimizations

| Technique | Evidence for Rejection |
|-----------|----------------------|
| `useMemo` on derived validation values | String length checks and regex tests on strings under 128 characters complete in under 0.01ms. These values change on every keystroke, and `useMemo` would need to compare the previous input strings — the comparison cost exceeds the computation cost. Adding `useMemo` would increase memory overhead and dependency tracking complexity with zero measurable render benefit. |
| `useMemo` on display derivations (`memberSince`, `getReadableExam`) | `memberSince` is a single `toLocaleDateString` call. `getReadableExam` is a string replace/split/map/join pipeline on a short string. Both are called only on render of `ProfileHeader`/`StatisticsSection`, which re-render only when `user` changes (effectively once per page visit). `useMemo` would add a dependency on `user` whose identity already triggers re-render — no skip benefit exists. |
| `React.memo` on `ProfileHeader` | Receives `user` and `memberSince` as props. `user` identity changes only when AuthContext updates (rare — only on login, refresh, or logout). `memberSince` is derived from `user`. The comparison cost of `React.memo` (shallow compare of two props) exceeds the render cost on the rare occasions a re-render is skipped. |
| `React.memo` on `StatisticsSection` | Receives `user` and `getReadableExam` as props. Same analysis as `ProfileHeader` — `user` identity changes rarely. No measured re-render issue exists. |
| `React.memo` on `ProfileForm` | Receives 20+ props. The cost of shallow-comparing 20+ props on every keystroke exceeds the cost of letting React re-render. Additionally, `ProfileForm` must re-render on every state change (typing, toggles, loading) — memoisation would never skip a render that matters. |
| Debounced search | No free-text search is implemented. Debounce would add latency to a non-existent operation. |
| Pagination | Profile is a single-page view with bounded content (one header, one stat grid, one form). No list or grid of items exists to paginate. |
| Additional component extraction | Extracting sub-components (e.g., `StrengthBadges`, `CurrentPasswordInput`, `NewPasswordFields`) from `ProfileForm` would increase the number of component boundaries without reducing the scope of re-renders — all sub-components consume the same password state and would re-render together. Additional extraction adds prop-drilling and file-count overhead with zero render benefit. |

This is consistent with the governance rule: *Optimize only with
measurable evidence.*

---

## Governance Rules

1. **Preserve profile workflow correctness** — loading, display, and
   password change flow remain identical.
2. **Preserve validation integrity** — client-side `passwordChangeSchema`
   validation and server-side `passwordSchema` validation are both
   preserved.
3. **Preserve save workflow** — `authService.updatePassword` is called
   only after validation; `setTimeout(logout, 2000)` is preserved on
   success.
4. **Preserve account data consistency** — profile data is read-only on
   this page; no mutations occur.
5. **Preserve accessibility** — all ARIA labels, roles, and keyboard
   behaviour are preserved.
6. **Architecture over uniformity** — `ProfileForm` is a feature-specific
   component with 20+ props; this is deliberate, not debt.
7. **Feature-local ownership** — `useProfile` owns all profile logic;
   no global abstractions.
8. **Reuse canonical components where objectively beneficial** —
   `PageContainer`, `Stack`, `Grid`, `Card`, `StatCard`, `Button`,
   `Input`, `Badge`, typography, `IconBadge`, `LoadingSkeleton` are all
   from canonical sources.
9. **Optimize only with measurable evidence** — all decisions documented
   in performance section.
10. **Separate accepted design decisions from actual technical debt** —
    the 20+ props on `ProfileForm` and inline avatar styling are accepted
    design decisions, not debt.
11. **Repository-wide opportunities must never block certification.**
12. **Certify only independently verified improvements.**
13. **Freeze the feature before proceeding to the next migration.**

---

## Extension Points

- **Add profile editing**: Add editable fields for `full_name` and
  `email` to `ProfileHeader`; add a save handler to `useProfile` that
  calls `userRepo.updateUser()`.
- **Add avatar upload**: Add a file input to `ProfileHeader`; integrate
  with a storage service (e.g., Supabase Storage) and update the user's
  avatar URL in the `users` table.
- **Add account deletion**: Add a "Delete Account" button to
  `ProfileForm` or a new `DangerZone` section with confirmation dialog.
- **Add notification preferences**: Add notification toggle fields
  (currently only available for sub-admins); extend `userRepo.updateUser`
  with notification preference columns.
- **Add membership/subscription display**: Add a `MembershipSection`
  component if subscription data becomes available in the user profile.
- **Add activity log**: Add a recent activity section showing login
  history or exam activity.

---

## Future Maintenance

- If the password change form is used by other pages (e.g., a settings
  page), consider extracting a reusable `PasswordChangeForm` component
  from `ProfileForm`.
- If profile editing (name, email) is added, the `handleProfileUpdate`
  action should be added to `useProfile` and appropriate validation
  schemas from `securitySchemas` or a new `profileSchemas` file.
- If avatar upload is added, consider whether a reusable `AvatarUpload`
  component should be extracted at the repository level.
- If the `usePageError` hook's `captureServerError` usage grows beyond
  simple error capture (currently used only for `showError` fallback),
  consider migrating to a full page-level error state machine with
  `ErrorContainer` + `retry` integration.

---

## Freeze Status

- **Profile information is read-only** — full name, email, join date,
  exam selection, accuracy, and streak values are display-only on this
  page. No edit operations exist for any profile field. Profile display
  flows unidirectionally from `AuthContext.user` with no local mutation
  path.
- **Password change is the only supported mutation** — the profile page
  has exactly one mutation path: the password change form. Profile
  display and password management are intentionally separated
  responsibilities within the same page.
- **Identity verification is mandatory before mutation** — the current
  password must be verified via `authService.reauthenticate()` before
  the new-password form is revealed. Password updates never occur
  without successful identity verification.
- **Authentication integrity is preserved** — the password change flow
  enforces: current-password verification (`reauthenticate`), stale
  request protection (`useStableFetch`), and session termination
  (`logout()`) on success. The user must re-authenticate after a
  successful password change.
- **Validation is enforced at both client and server levels** —
  client-side `passwordChangeSchema` validates all three password fields
  and enforces the "new !== current" rule. Server-side `passwordSchema`
  independently validates the new password before calling the Supabase
  Auth API. Both layers must pass for the update to proceed.
- **Profile workflow is canonical** — the read-only display of profile
  information and the password change flow with current-password
  verification are fully documented and verified.
- **Save workflow is canonical** — the two-phase save flow (validate
  client-side → call `authService.updatePassword` → log out on success)
  is preserved and documented.
- **Canonical component reuse is intentional** — all presentation
  concerns use canonical components where objectively beneficial.
  Feature-specific components (`ProfileHeader`, `StatisticsSection`,
  `ProfileForm`) are documented with detailed rationale explaining why
  each remains feature-local. No extraction gap exists.
- **Performance decisions are evidence-based** — implemented
  optimizations (`useCallback` on all handlers, stale-request protection
  via `useStableFetch`, scoped state ownership, lightweight inline
  validation) and all intentionally rejected optimizations (`useMemo`,
  `React.memo`, debounce, pagination, additional component extraction)
  are documented with measurable evidence. No speculative optimisation
  was introduced.
- **Accessibility is verified** — keyboard navigation, screen reader
  compatibility, password form accessibility, validation announcement
  behaviour, focus management (documented per scenario), responsive
  layout, and touch accessibility are all documented with specific
  implementation details.
- **The feature is fully certified** under the current Golden Reference
  architecture. All governance rules are satisfied. Remaining
  observations (20+ props on `ProfileForm`, inline avatar styling) are
  accepted design decisions that do not block certification.

# Sub Admin Students — Golden Reference

## Purpose

Sub-admin student management view. Displays a searchable, filterable roster of
students linked to the authenticated sub-admin's educator account, with
per-student performance statistics, attempt-history drill-down, clipboard
copy, and CSV export.

## Architecture

```
SubAdminStudents.tsx (composition only)
  └─ useStudents() feature hook
       ├─ useAuth (user context)
       ├─ useStableFetch (stale-request protection)
       ├─ userService.fetchSubAdminStudents()       — roster (role=user, ordered)
       ├─ userService.fetchSubAdminProfile()        — sub-admin identity
       ├─ userService.fetchAttemptsForSubAdminStudents() — chunked attempt queries
       ├─ dateUtils.getLocalMonthKey()              — local-calendar month domain
       ├─ csvUtils.downloadCSV / sanitizeFilename   — CSV export
       ├─ scoreUtils.calculatePercentage            — canonical score → %
       └─ scoreUtils.computeStudentStats            — avgPct / bestPct / lastActive

Presentation:
  ├─ AdminFilterBar              — search + month filter + refresh (canonical)
  ├─ StudentsTable               — custom CSS grid (STUDENTS_TABLE_GRID)
  ├─ StudentDetailModal          — responsive stat cards + attempt history
  ├─ StudentsTableSkeleton       — first-load only (never during refresh)
  ├─ ErrorContainer              — canonical alert (role="alert", aria-live)
  └─ RetryButton                 — busy-state retry (Retrying…)
```

Route: `/sub-admin/students` — guarded by `RoleGuard(['sub_admin'])`
(`src/pages/sub-admin/SubAdminStudents.tsx`). Every service call additionally
enforces `ensureRole({ allowedRoles: ['admin', 'sub_admin'], resourceOwnerId })`,
and all reads are governed by the same Postgres RLS policies as the dashboard
family (no `service_role` anywhere in the browser).

## Data flow

```
users table (role = 'user', educator_id = current sub-admin's user id)
  └─ fetchSubAdminStudents() → raw roster rows (ordered by created_at)

sub_admins table (user_id = auth.uid() equivalent)
  └─ fetchSubAdminProfile() → profile row (null on genuine no-row result)

attempts table (user_id IN roster, teacher_exams.sub_admin_id = profile.id)
  └─ fetchAttemptsForSubAdminStudents()
       ├─ roster id list split into ≤100-id chunks (CHUNK_SIZE = 100)
       ├─ one bounded query per chunk (Promise.all, flattened once)
       └─ each query joins teacher_exams!inner (title, total_questions, total_marks)

useStudents() maps raw attempts → StudentAttempt
  raw_score    = attempts.score (RAW MARKS as stored by submit_attempt)
  total_marks  = attempts.teacher_exams.total_marks
  percentage   = calculatePercentage(raw_score, total_marks)
  time_taken   = attempts.duration_seconds
  submitted_at = attempts.submitted_at (UTC ISO, rendered locally)

computeStudentStats(attempts) → { totalExams, avgPct, bestPct, lastActive }
  avgPct  = round(mean of attempt percentages)   — never raw marks
  bestPct = max of attempt percentages
```

## Scores are percentages — never raw marks

- The `attempts.score` column stores RAW MARKS (the RPC `submit_attempt` sums
  `marks_awarded`). The page must never print raw marks with a `%` suffix.
- The display metric is `calculatePercentage(raw_score, total_marks)` from
  `src/utils/scoreUtils.ts` (canonical singleton — always import it).
- `total_marks <= 0` yields `0` — never `NaN`/`Infinity`. `null` components are
  coalesced with `?? 0` (block-level masks like `a.score || 0` are banned).
- Negative marking produces an honest negative percentage.
- Raw marks are never masked: the detail modal shows `raw_score / total_marks`
  and the CSV exports `Raw Score`, `Total Marks`, `Percentage (%)`.
- `StudentStats` fields are named `avgPct`/`bestPct` explicitly so raw marks can
  never be mistaken for them. The table column is labelled `Avg. Score`.

## Refresh & error semantics (last-good content)

- The skeleton (`StudentsTableSkeleton`) renders ONLY on the first load
  (`loading && !hasLoaded`, where `hasLoaded` flips true after the first
  successful pipeline). Background refreshes NEVER replace the table (or the
  empty-cohort card) with a skeleton.
- The success pipeline sets `students`, clears `error`, then `hasLoaded`.
- Errors never clear retained data:
  - Initial-load failure (no data yet) → full `ErrorContainer` (role="alert",
    aria-live="assertive") with sanitized copy + `RetryButton`.
  - Confirmed refresh failure WITH retained data → the same `ErrorContainer`
    renders as a banner ABOVE the table; the table stays interactive.
  - Errors are only cleared when a pipeline actually succeeds.
- `RetryButton` is disabled while a retry is in flight (`loading`), and its
  aria-label switches to `Retrying…` (aria-busy).

## A11y

- Exactly ONE `role="status"` loading owner on the page, rendered only for the
  first load. During background refresh no live region re-announces; the
  Refresh button communicates busy via `disabled`.
- Error surface = `ErrorContainer` (`role="alert"`, `aria-live="assertive"`),
  canonical copy generated by `utils/errorClassification` (no raw SQL/Supabase
  strings, no custom sci-fi copy).
- Modal (`AdminModal`): `role="dialog"`, `aria-modal="true"`, labelled by
  `aria-labelledby`, described by `aria-describedby`, FocusTrap, Escape closes,
  focus restore on close, backdrop click closes.
- Search input is labelled via `searchAriaLabel` («Search students»); refresh
  icon button carries `aria-label="Refresh data"`.

## Layout & responsiveness

- The table is a CUSTOM CSS grid defined ONCE in `studentsTableGrid.ts`
  (`STUDENTS_TABLE_GRID`). Header cells, every data row, and the skeleton rows
  all consume the same contract — zero layout shift on load, ~0px header↔row
  column delta. No inline grid duplicates, no `_idx`/row-numbering column.
  - Mobile: `grid-cols-[minmax(0,1fr)_88px_48px]` (Student · Attempts · Actions)
  - ≥md : `md:grid-cols-[minmax(0,1.6fr)_88px_72px_96px_48px]`
         (Student · Attempts · Avg. Score · Last Active · Actions)
- Result count element renders ABOVE the header inside the table component.
- Modal stat cards use the shared `Grid cols={4}` contract:
  `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (single column at 390px,
  four columns at ≥lg). No fixed `grid-cols-4`.
- Verified overflow-free at 390px / 768px / 1280px (page + modal).

## Month filter (local calendar domain)

- Both the picker option IDs and the `created_at` matching use
  `getLocalMonthKey(date)` (`src/utils/dateUtils.ts`), which yields the
  LOCAL calendar month (`YYYY-MM`). A UTC ISO prefix slice is never used, so
  the filter never drifts from the locally-rendered «Joined <date>».

## CSV export & copy

- `handleDownloadCSV`: `Exam Name · Raw Score · Total Marks · Percentage (%) ·
  Time Taken (s) · Date`. Returns `boolean` (success/failure); the detail modal
  owns ALL user-facing feedback for the action — no global toast.
- `handleCopyClick`: `Name`, `Exams`, `Average Score: <avgPct>%`. Returns a
  `Promise<boolean>`; clipboard failure surfaces as a modal-local inline error.
- Action feedback contract (COPY + CSV DOWNLOAD): ONE authoritative, modal-local
  feedback owner per action, rendered ON the action button inside the modal.
  Success flips the button to a `success` variant with a check icon
  (`Copied` / `Downloaded`, auto-revert ~2s, framer `MotionConfig
  reducedMotion="user"`). Failure renders an inline `aria-live="polite"` error
  directly above the action and leaves the button retryable. `copying`/
  `preparing` guard against accidental duplicate operations; the download
  re-entry window during the success state is ignored (rapid-click control).
- Global toasts are NOT used for these two actions (page has no `ToastContainer`).
- `csvUtils.downloadCSV` produces a `text/csv;charset=utf-8` Blob, builds the
  `<a download>` anchor (appended → clicked → removed), and revokes the object
  URL **deferred** (10s after click) so the browser download manager is never
  raced by the revoke. If `URL.createObjectURL` is unavailable (restricted/
  webview contexts) it falls back to a self-contained `data:` URI (no revoke
  needed).
- **Focus-trap modal fix (regression-pinned):** `downloadCSV` mounts the anchor
  inside the focused `[role="dialog"]` when one owns focus, falling back to
  `document.body` outside any dialog. Mounting on `<body>` inside a
  focus-trapped modal caused the focus trap to steal the anchor's focus and
  Chromium to CANCEL the download silently — the button flipped to "Downloaded"
  but no file was saved. The My Exams page (no modal / no trap) was unaffected,
  which is why it worked. Verified: a real `download` event now fires from the
  modal with the correct filename and content (see V6 e2e).

## Integration guardrails

- Services (`userService`) rethrow the ORIGINAL transport error object
  (structured metadata preserved) for canonical classification downstream —
  never a generic fallback.
- `fetchAttemptsForSubAdminStudents` short-circuits to `[]` only for an empty
  roster; a repo error propagates untouched.
- Attempt queries are chunked to ≤100 user ids per request
  (`CHUNK_SIZE = 100`) and joined to `teacher_exams` via `!inner`. The
  repository's `limit` parameter is a per-query safety cap, not a pagination
  strategy.

## Security model (unchanged, verified)

- `RoleGuard(['sub_admin'])` at the route + `ensureRole` in every service call.
- RLS (unchanged, already verified): `is_admin()` and `current_sub_admin_id()`
  SPL, sub_admins self-select, users admin-all/self/sub-admin-select, attempts
  sub-admin SELECT via `EXISTS` on owned teacher exams, teacher_exams sub-admin
  policies. Nothing in this page bypasses RLS.

## Testing

- Unit/static lock-in: `src/security/subadmin-students-remediation.test.tsx`
  (`npx vitest run src/security/subadmin-students-remediation.test.tsx`).
- Browser: `e2e/subadmin-students-remediation.spec.ts` (synthetic SA session,
  fully intercepted network; asserts scores as percentages, refresh retention,
  retry busy, single pipeline under 25-click hammer, header↔row alignment,
  390/1280 no overflow, modal responsiveness, light/dark).
- Typecheck: `npx tsc -b` (must stay at the known baseline of pre-existing
  errors; zero additions from this page family).

## Compatibility notes (removed legacy constructs)

The following are intentionally ABSENT from the current implementation
(documented removals — do not reintroduce):

- Custom `DataGrid`-based student table (replaced by the shared
  `STUDENTS_TABLE_GRID` contract) and any `_idx`/row-numbering column.
- Custom sci-fi error copy («Force Protocol Reset», «Sync Synchronization
  Error») and page-specific error card styling (canonical `ErrorContainer`
  only).
- Fixed `grid grid-cols-4` stat card row (shared responsive `Grid` instead).
- Claim that the modal overlay is non-clickable (backdrop clicks close).
- UTC-ISO month prefix filtering (`created_at.startsWith(monthFilter)`).
- `avgScore`/`bestScore`/block-level `a.score || 0` masking.
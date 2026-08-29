# USER_DASHBOARD_IMPLEMENTATION_REPORT.md

Phase 6.XB — Implementation · User Dashboard (`/dashboard`)

> **Governance notice.** This report records the implementation of every finding
> from the Phase 6.XA `/dashboard` audit (`USER_DASHBOARD_EXECUTIVE_SUMMARY.md`,
> S17 backlog). All database changes were applied to the LIVE Supabase project
> (`xbjhlfwqmcyatblsrhxn`) and verified against it. No RLS policy was weakened,
> no destructive change was made, and `supabase db reset` was not used.

## 1. Executive Summary

The `/dashboard` audit surfaced **one P1 security defect, three P2 data/skeleton
defects, three P3 UX/accessibility defects, and two INFO items**, plus one
migration bookkeeping gap. All actionable defects are **FIXED**; the two INFO
items are **VERIFIED NO CHANGE REQUIRED**.

- **P1 fixed:** `get_user_accuracy(uuid)` was a SECURITY DEFINER RPC with no
  identity check that any unauthenticated caller could invoke to read any
  user's exam accuracy. It now enforces `auth.uid()` internally and is
  executable only by the database owner (backend-internal).
- **P2 fixed:** `exams_taken` and `daily_streak` were both wrong (`exams_taken`
  counted 48 vs 13 exam_tab-scoped attempts; streak was permanently 0). Both are
  now computed from completed `exam_tab` attempts.
- **P2 fixed:** the dashboard stats skeleton geometry no longer matches the
  final StatCard; it was rebuilt to be pixel-approximate.
- **P3 fixed:** recent-activity skeleton gap conflict, nested `role="status"`
  live regions, and the invisible RetryButton loading state.
- **P3 fixed:** migration bookkeeping drift — the local reconstruction file was
  renamed to the version already recorded in the live ledger.
- **LIVE deployment:** `20260813150000_dashboard_security_and_correctness.sql`
  deployed to production and verified end-to-end via auth-simulated probes.

## 2. Security Fixes (FIX-1, P1)

### `get_user_accuracy(uuid)` — before

```sql
-- SECURITY DEFINER, STABLE, search_path=public, no auth.uid() check
CREATE OR REPLACE FUNCTION public.get_user_accuracy(p_user_id uuid)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER
-- grants: EXECUTE to PUBLIC + anon + authenticated + service_role + postgres
```

| Probe (live, before fix) | Result |
| --- | --- |
| `get_user_accuracy` called as `postgres` for user `amar` | `34.60` (any caller, any user) |
| `anon_has_execute_accuracy` | `true` |

Because the function is SECURITY DEFINER it bypasses RLS; RLS could not be the
boundary, so any authenticated *or unauthenticated* caller could read any
user's aggregate exam accuracy by supplying the victim UUID.

### `get_user_accuracy(uuid)` — after

- Rewritten in `plpgsql` with an identity guard inside the SECURITY DEFINER
  boundary:
  ```sql
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
      RETURN 0;
  END IF;
  ```
- Execution revoked from every PostgREST-visible role:
  `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated, service_role`.
- **Backend-internal only.** Its sole caller is `get_user_dashboard_stats()`,
  which is itself SECURITY DEFINER and runs as the owner (function-to-function
  invocation is unaffected by the revokes).

### Live verification (after deploy)

| Probe (live, after fix) | Result |
| --- | --- |
| `get_user_accuracy` called as `postgres` for user `amar` | `0` (denied) |
| `anon_has_execute_accuracy` | `false` |
| `authenticated_has_execute_dashboard_rpc` | `true` |
| EXECUTE grant owners — `get_user_accuracy` | `postgres` only |
| EXECUTE grant owners — `get_user_dashboard_stats` | `authenticated`, `postgres`, `service_role` |
| Function flags (both RPCs) | `SECURITY DEFINER`, `STABLE`, `search_path=public` |

Auth-simulated probes (`set_config('request.jwt.claims', '{"sub": <amar uuid>}')`):

| Probe | Result |
| --- | --- |
| `get_user_dashboard_stats(<amar>)` — self | `{"accuracy": 34.60, "exams_taken": 13, "global_rank": "Rank #1", "daily_streak": 0}` |
| `get_user_dashboard_stats(<other>)` — cross-user | `NULL` |
| `get_user_accuracy(<other>)` — cross-user | `0` |
| `get_user_accuracy(<amar>)` — self | `34.60` |

## 3. Dashboard Data Corrections (FIX-2 / FIX-3, P2)

### `exams_taken` — source scope (FIX-2)

- **Before:** counted ALL `status='completed'` attempts regardless of `source`.
  Live value: **48** — inconsistent with Accuracy and Recent Activity, which are
  scoped to `source = 'exam_tab'` (live: **13**).
- **After:** same scope as accuracy and recent activity
  (`status='completed' AND source='exam_tab'`). Live value: **13**.

### `daily_streak` — computed, not stale column (FIX-3)

- **Before:** returned `users.streak`, a column that is never written by the
  app or any migration → **permanently 0**.
- **After:** computed from the user's completed `exam_tab` activity as the
  length of the **trailing run of consecutive DISTINCT active days**, where the
  most recent active day must be **today or yesterday** (else the streak is
  broken → 0). Multiple attempts on the same day count once. Day boundary:
  `Asia/Kolkata` (product audience is India; no per-user timezone is stored;
  timestamps are stored as `timestamptz`).
- Algorithm harness validated **8/8 cases** live via `pg_temp.fn_streak`
  (4-consecutive → 4; gap → 1; yesterday → 1; stale → 0; same-day dedup → 2;
  trailing run → 1; empty → 0; amar's last-two days → 0).

### Accuracy and Rank — preserved

- Accuracy now returns the guarded value from `get_user_accuracy` (34.60 for
  amar — unchanged, correctness preserved).
- Global rank semantics preserved: `MIN(rank)` across the user's ranked
  leaderboard rows → `Rank #1` for amar.

## 4. Skeleton Geometry (FIX-4, P2)

The stats skeleton rendered a DIFFERENT card geometry than the final StatCard,
so the page "shifted" when data loaded.

| Attribute | Skeleton (before) | Final StatCard (ground truth) |
| --- | --- | --- |
| Grid | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6` | `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6` |
| Card | `rounded-[24px] p-6 gap-4` (auto height) | `h-16 sm:h-20 lg:h-24 px-3 sm:px-4 lg:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl` |
| Icon box | `48×48`, radius 16 | `w-9 sm:w-11 lg:w-12`, `rounded-stat-icon-radius` |
| Bars | `40%×10` / `70%×20` | label `w-3/5 h-2 lg:h-2.5`, value `w-2/5 h-4 sm:h-5 lg:h-6` |

**After:** `StatSkeleton` in `SharedComponents.tsx` was rebuilt to mirror the
final StatCard geometry exactly (flex row, fixed height `h-16 sm:h-20 lg:h-24`,
StatCard padding scale, icon box `w-9 sm:w-11 lg:w-12 rounded-stat-icon-radius`,
certified skeleton surface tokens
`bg-[var(--skeleton-surface)] border border-[var(--border-subtle)]
shadow-[var(--card-shadow)] ${GOLD_LIGHT_MATERIAL}`, matching bar heights).
`DashboardStatsGrid.tsx` now passes the matching grid
`columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-4" gap="gap-4 md:gap-5 lg:gap-6"`.

The recent-activity skeleton (VERY CLOSE verdict) was aligned to the final Grid
gap (`gap-4 md:gap-5 lg:gap-6`).

## 5. CSS / Layout Cleanup (FIX-5, P3)

- **Before:** the recent-activity loading state rendered three `LoadingSkeleton`
  cards inside `<Grid cols={1} sm={2} lg={3} className="gap-4 md:gap-6">` while
  the populated state used the Grid default `gap-4 md:gap-5 lg:gap-6` → gap
  conflict between loading and loaded states.
- **After:** `GridSkeleton` accepts a `gap` prop (default `gap-6`, unchanged for
  existing callers); the dashboard passes `gap="gap-4 md:gap-5 lg:gap-6"`; the
  populated `Grid` dropped its override and now uses the identical default. No
  other consumers of `GridSkeleton`/`StatSkeleton` changed.

## 6. Retry UX (FIX-7, P3)

- **Before:** a force-retry synchronously set the loading flags and cleared the
  errors, which unmounted the error branch and mounted the skeleton — so the
  RetryButton's loading state was never visible and the click appeared to do
  nothing.
- **After:** in `useUserDashboard.ts`, loading flags are only set (and errors
  only cleared) on the initial non-force path when no cache is present. On a
  force-retry the current view (error state) stays mounted until the request
  settles, so the RetryButton spinner is observed; errors are cleared on
  success and `isRetrying` remains true throughout the retry. Race safety
  (`requestId` / `mountedRef`) is preserved.

## 7. Accessibility (FIX-6, P3)

- **Before:** every skeleton card carried `role="status"` (live region) nested
  inside the container-level loading live regions → nested live-region noise.
- **After:** `Skeleton` gained an opt-in `decorative` prop (default `false` —
  existing callers unchanged) that removes `role`/`aria-label` and sets
  `aria-hidden`. `DashboardStatsGrid` and `DashboardRecentActivity` each now
  expose **one** container-level `role="status" aria-live="polite"` region while
  loading, and their skeleton cards are decorative. One status region per
  section.

## 8. Responsive

- Stats skeleton breakpoints now match the final StatCard grid
  (1 → md 2 → lg 4) and the card heights scale with the same
  `sm`/`lg` steps, so there is no layout shift at any breakpoint.
- Recent-activity skeleton columns (1/2/3) and gap match the loaded Grid.

## 9. Migration Reconciliation (P3 bookkeeping)

- **Before:** the live `schema_migrations` ledger recorded
  `20260422080151 create_get_user_dashboard_stats_rpc`, while the repo held an
  untracked local reconstruction `20260811000001_user_dashboard_stats.sql`
  (version drift — a future `db push` would replay it).
- **After:** the local file was renamed to
  `20260422080151_create_get_user_dashboard_stats_rpc.sql`, matching the
  recorded live row for the same function, so `db push` will not replay it.
  `docs/migration-ledger-reconciliation.md` documents the reconciliation.
- The corrected function bodies are delivered by the NEW migration
  `20260813150000_dashboard_security_and_correctness.sql` — no historical
  migration was destructively modified.

## 10. LIVE Database Changes (deployed to xbjhlfwqmcyatblsrhxn)

| # | Change | Verification (live) |
| --- | --- | --- |
| 1 | `get_user_accuracy(uuid)` → plpgsql + `auth.uid()` guard | cross-user probe → `0`; postgres → `0` |
| 2 | `REVOKE EXECUTE get_user_accuracy(uuid) FROM PUBLIC, anon, authenticated, service_role` | `anon_has_execute_accuracy = false` |
| 3 | `get_user_dashboard_stats(uuid)` → `exams_taken` exam_tab scope + computed streak | self probe → `exams_taken: 13`, `daily_streak: 0` |
| 4 | `GRANT EXECUTE get_user_dashboard_stats(uuid) TO authenticated` (re-affirmed) | `authenticated_has_execute_dashboard_rpc = true` |

Deployment method: `supabase db query --linked --project-ref xbjhlfwqmcyatblsrhxn
-f supabase/migrations/20260813150000_dashboard_security_and_correctness.sql`
(no errors). Both RPC bodies re-verified via `pg_get_functiondef`; flags
`SECURITY DEFINER / STABLE / search_path=public` confirmed.

## 11. Build / Test / Lint Results

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS (clean) |
| `npm run build` | PASS (7 pre-existing CSS optimization warnings; no new warnings) |
| `npm test` | 165 passed (5 files); 10 pre-existing `@csstools/css-calc` worker-start errors (`ERR_REQUIRE_ESM`) — identical baseline, unrelated to this change |
| `npm run lint` | 331 errors / 51 warnings — identical to baseline; **zero new** errors. The only dashboard file mentioned (`useUserDashboard.ts:86`) is pre-existing unchanged code (initial-load effect) |

## 12. Original Audit Matrix

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| FIX-1 | P1 | `get_user_accuracy(uuid)` IDOR (SECURITY DEFINER, no identity check, EXECUTE to PUBLIC/anon) | **FIXED** (guard + revokes; live-verified) |
| FIX-2 | P2 | `exams_taken` counted all completed attempts (48) vs exam_tab scope (13) | **FIXED** (source-scoped; live 13) |
| FIX-3 | P2 | `daily_streak` always 0 (`users.streak` never maintained) | **FIXED** (computed streak; harness 8/8) |
| FIX-4 | P2 | Stats skeleton geometry mismatch vs final StatCard | **FIXED** (StatSkeleton rebuilt + matching grid) |
| FIX-5 | P3 | Recent-activity gap conflict (skeleton vs loaded Grid) | **FIXED** (unified `gap-4 md:gap-5 lg:gap-6`) |
| FIX-6 | P3 | Nested `role="status"` live regions during loading | **FIXED** (one container region per section; decorative cards) |
| FIX-7 | P3 | RetryButton loading state never visible on force-retry | **FIXED** (fetchData state machine) |
| FIX-8 | INFO | `getAllowedExamIds('all')` unreachable code path → `[]` | **VERIFIED NO CHANGE REQUIRED** (dead path; no call site reaches it) |
| FIX-9 | INFO | SidebarLayout spinner fallback during route transitions | **VERIFIED NO CHANGE REQUIRED** (acceptable loading behavior) |

Additional, outside the numbered matrix: **P3 migration ledger bookkeeping drift**
— **FIXED** via local file rename + `docs/migration-ledger-reconciliation.md`.

## 13. Remaining / Deferred Items

- **None** on the `/dashboard` page. All audit findings are resolved or verified
  no-change.
- **Deferred (out of scope, requires human sign-off):** recording the other
  already-applied out-of-band migrations (`20260701..20260803`) into the remote
  `schema_migrations` ledger so a future `supabase db push` is safe. Documented
  in `docs/migration-ledger-reconciliation.md`; intentionally not executed here.
- **Note:** `get_user_accuracy` is now backend-internal by design. No frontend
  caller exists; if a future feature needs client-side per-user accuracy it must
  flow through `get_user_dashboard_stats`.

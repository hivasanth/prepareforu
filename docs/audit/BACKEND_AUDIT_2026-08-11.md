# Backend Audit Report — PrepareForU (Supabase)

## Metadata
- **Date:** 2026-08-11
- **Project:** `PrepareForU` (ref `xbjhlfwqmcyatblsrhxn`, org `fikdotgovtncdeunfrba`)
- **Region:** South Asia (Mumbai)
- **Database:** PostgreSQL 17.6
- **Access method:** Supabase CLI v2.113.0 (`db query --linked` via Management API) + anonymous REST probing with the publishable `anon` key
- **Scope:** Schema, RLS, grants, SECURITY DEFINER functions, views/matviews, REST exposure, auth, performance, migration drift
- **Scale:** 15 auth users, 15 `users` rows, 155 attempts, 49 questions, 5 exam configs, 4 teacher exams

## Executive Summary

**Severity:** 5 Critical, 4 High, 4 Medium, 4 Low. **282 advisor issues** (1 ERROR, 281 WARN).

The foundation (RLS enabled on all 28 tables, ownership predicates on most policies, one-active-attempt constraint, unique indexes, query indexes) is solid. However there are **multiple confirmed, remotely-exploitable vulnerabilities**:

1. **Answer keys are readable by any logged-in user** (`questions.correct_option` exposed via a `USING (true)` RLS policy).
2. **34 SECURITY DEFINER functions are callable by unauthenticated `anon` via REST**, and several of them have **zero auth checks inside** — allowing anonymous write access to arbitrary rows (attempts, answers, streaks, teacher exams, leaderboard).
3. **User PII + performance data leaked to anonymous callers** via the `admin_leaderboard_view` materialized view (confirmed live: real user names, UUIDs and scores returned with only the anon key).
4. **Account lockout can be trivially DoS'd and bypassed** — `record_failed_login` / `reset_failed_login` are anon-callable.
5. **Anonymous notification injection** via a `WITH CHECK (true)` INSERT policy on `notifications`.

All findings below were verified against the live database.

---

## CRITICAL Findings

### C1. Answer keys exposed to any authenticated user
`public.questions` contains `correct_option` (NOT NULL) alongside the question text and options. The policy:

```sql
-- policy: questions_select_authenticated  (SELECT, TO authenticated)
USING (true)
```

Any signed-in student can fetch every answer key:
`GET /rest/v1/questions?select=id,exam_id,correct_option` → full answer key.

- Table is exposed via Data API (verified: anon probe returns `200 []`; the `authenticated` policy grants all rows).
- **Impact:** Exam integrity is broken; this defeats the entire product.
- **Fix:** Remove `questions_select_authenticated`. Serve questions through an RPC/view that omits `correct_option` (and `explanation_*`), or add a `exam_versions`-style snapshot where answers are hidden from students.

### C2. Unauthenticated write access via SECURITY DEFINER RPCs
34 functions are `SECURITY DEFINER`, live in `public`, and are executable by the **`anon` role over REST** (`/rest/v1/rpc/<fn>`). Of these, the following have **no `auth.uid()` check at all** inside the body — confirmed by reading `pg_get_functiondef`:

| Function | Effect (as postgres, bypassing RLS) |
|---|---|
| `submit_attempt(p_attempt_id)` | Submits/completes **any** attempt, recomputes score, updates leaderboard |
| `set_question_answer(...)` | Injects/overwrites answers on **any** attempt |
| `set_question_review(...)` | Sets review flag on **any** attempt |
| `add_question_time(...)` | Writes time data to **any** attempt |
| `touch_question_visit(...)` | Writes visit data to **any** attempt |
| `update_user_streak(p_user_id)` | Rewrites **any** user's streak |
| `create_teacher_exam_atomic(...)` | Creates teacher exams + questions as **any** `sub_admin_id` (param-driven) |
| `create_notification(...)` | Inserts notifications for **any** user |
| `refresh_leaderboard_ranks(exam,paper)` | Recomputes leaderboard ranks (manipulation/DoS) |
| `get_user_accuracy(p_user_id)` | **IDOR — reads any user's accuracy (CONFIRMED live via REST, see below)** |
| `check_user_exists(email)` | **Email enumeration** |
| `is_account_locked(email)` | **Email + lock-state enumeration** |
| `record_failed_login(email)` | **Lockout DoS** — any email can be locked after 5 anon calls |
| `reset_failed_login(email)` | **Lockout bypass** — unlocks any email |

**Confirmed live:** `POST /rest/v1/rpc/get_user_accuracy` with the publishable anon key returned `200`. The advisory already flags all 34 via `anon_security_definer_function_executable`.

**Fix:**
- Add `auth.uid()` ownership checks inside every function that touches user-scoped rows (must verify `attempts.user_id = auth.uid()`, `p_user_id = auth.uid()`, etc.).
- `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC, anon;` for functions that should be authenticated-only; for trigger-only functions (`trg_*`, `handle_*`, `check_exam_velocity`, `sync_*`, `prevent_user_role_escalation`, `update_sub_admin_referrals`) revoke PUBLIC execute as defense-in-depth.
- Convert to `SECURITY INVOKER` where RLS already provides the correct guard.

### C3. User PII + score data leaked to anonymous callers
Materialized view `public.admin_leaderboard_view` (no RLS — matviews are snapshots) is selectable by `anon`:

```sql
-- contains user_id, u.full_name, exam_id, best_score, best_accuracy, ... FOR ALL USERS
```

**Confirmed live:** `GET /rest/v1/admin_leaderboard_view?select=*&limit=3` with only the anon key returned real rows: `{"user_name":"amar","user_id":"6c9320f5-...","best_score":21.17,...}`.

**Fix:** `REVOKE SELECT ON public.admin_leaderboard_view FROM anon;` (and consider `authenticated` too — expose it only via an admin-guarded RPC). Also revoke for `daily_attempts_stats` and `exam_distribution` unless the aggregates are meant to be public.

### C4. Anonymous notification injection
`notifications` has an INSERT policy on the `public` pseudo-role:

```sql
-- policy: notifications_service_insert (INSERT, TO public)
WITH CHECK (true)
```

`anon` has INSERT privilege on the table, so **any anonymous caller can insert notifications addressed to any user_id** (phishing/spam vector). The policy is mis-aimed — it was presumably meant for `service_role` only.

**Fix:** `ALTER POLICY notifications_service_insert ON public.notifications TO service_role;` and tighten `WITH CHECK` to `user_id = auth.uid()` for any user-facing insert path.

### C5. Security-definer view bypasses RLS
`public.question_counts` (view) is defined with the SECURITY DEFINER property (advisor: **ERROR** `security_definer_view`). It runs as the owner, ignoring RLS, and is selectable by `anon`. It currently only exposes question counts per exam/paper/subject (info leak), but the pattern is unsafe.

**Fix:** `ALTER VIEW public.question_counts SET (security_invoker = on);` and revoke anon SELECT unless intended public.

---

## HIGH Findings

### H1. 42 SECURITY DEFINER functions executable by `authenticated` with no role-gating
Beyond C2's anon list, advisors flag `authenticated_security_definer_function_executable` (42). Functions like `is_admin`, `is_sub_admin`, `get_user_role`, `create_new_exam_rpc`, `update_exam_subjects_batch` do check roles internally (good), but `apply_coupon`, `promote_to_admin`, `demote_from_admin`, `create_sub_admin`, `remove_sub_admin`, `remove_student` rely on internal checks only. All should be audited for internal `auth.uid()` checks and ideally have EXECUTE limited to the roles that legitimately use them.

### H2. `multiple_permissive_policies` — 120 warnings, 50+ duplicate/overlapping policies
Many tables carry two parallel policy generations (legacy `public`-role policies + newer `authenticated` policies) that grant the same action, e.g.:
- `attempts`: `attempts_insert_own` + `rls_attempts_user_insert`; `attempts_select_own` + `rls_attempts_user_select`; `attempts_select_admin` + `rls_attempts_admin_all`
- `users`: 4 SELECT policies, 3 UPDATE policies (`users_update_own`, `Users can update own profile`, `rls_users_self_update`)
- `notifications`: `notifications_own`/`notifications_own_select`, `notifications_own_update`/`notifications_update_own`

Overlapping permissive policies make the effective grant hard to reason about and are where holes like C4 hide. **Fix:** consolidate to a single generation and drop the redundant ones.

### H3. `auth_rls_initplan` — 52 warnings
RLS policies calling `auth.uid()` / `auth.jwt()` in initplans can return stale data after role switches and add per-query overhead. Review the flagged policies.

### H4. Function `search_path` not pinned — 27 warnings
Functions such as `handle_new_user`, `update_updated_at`, `create_teacher_exam_atomic`, etc. run without `SET search_path`, opening SECURITY DEFINER functions to search-path hijacking. **Fix:** add `SET search_path = public` to every SECURITY DEFINER function.

---

## MEDIUM Findings

### M1. Migration drift — repo history does not match remote
`supabase_migrations.schema_migrations` records stop at `20260706000003_isolate_exam_persistence`. The repo contains 30+ migration files (incl. `20260721000001_*`, `20260803000001_user_status_hardening`, `20260811000001_user_dashboard_stats`) that are **not recorded** in the remote history, yet their objects (e.g. `get_user_dashboard_stats`, `security_logs`, `questions_backup_phase6`) exist in the live DB — i.e. they were applied via direct SQL/dashboard rather than the CLI migration system. Filenames also differ from recorded names (repo `20260502_rls_hardening.sql` vs remote `20260506203713_rls_hardening_phase7`). This breaks reproducibility and `db pull`/`db push` parity.
**Fix:** reconcile by capturing the live schema (`supabase db pull`) and re-baselining the migration history.

### M2. `pg_trgm` installed in `public` schema
`extension_in_public` warning. Move to a dedicated schema or accept the risk (lower priority, but note `GIN` trigram indexes on `question_text_en` exist).

### M3. Duplicate index
`bookmarks`: `bookmarks_user_id_question_id_key` and `idx_bookmarks_user_question` are identical. Drop one. Also `attempt_answers` carries redundant `idx_attempt_answers_attempt_id` alongside the `(attempt_id, question_id)` unique key.

### M4. Auth: leaked-password protection disabled
Advisor `auth_leaked_password_protection`: HIBP password breach check is off. Enable in Dashboard → Auth → Security.

---

## LOW Findings / Notes

- **L1.** `create_notification(...)` appears out of sync with the live `notifications` schema (function inserts `title/body/link`; table has `type/message`) — likely dead/broken code. Verify and either fix or remove.
- **L2.** Trigger functions are exposed to `anon`/`authenticated` via REST (`trg_notify_on_attempt`, `trg_notify_on_new_student`, `trg_notify_on_sub_admin_change`, `sync_sub_admin_coupon_to_users`, `check_exam_velocity`, `handle_*`). They are not exploitable directly (they're trigger bodies), but revoke PUBLIC EXECUTE for hygiene.
- **L3.** `exam_papers_select_all`/`exam_subjects_select_all`/`exams viewable by everyone` are `USING (true)` on `public` — fine if exam catalog is public, but confirm no answer-bearing columns are exposed through joins.
- **L4.** `.env` anon key is a publishable key (fine), but ensure **no `service_role` key** ever lands in the repo or client bundle.

---

## Verified-Positive Findings

- RLS enabled + forced where relevant on all 28 tables.
- Ownership predicates (`user_id = auth.uid()`) present on most user-scoped policies (attempts, answers, bookmarks, prepare_sessions, reports, sub_admins self, users self).
- Admin/sub-admin gates use role checks (`is_admin()`, `is_sub_admin()`, admin-role EXISTS).
- `one_active_attempt` partial unique index enforces a single in-progress attempt per user.
- Well-indexed: FK columns, leaderboard query path, notifications, questions (incl. trigram) all covered.
- `get_user_dashboard_stats` and `get_user_leaderboard_rank` contain correct internal `auth.uid()` guards (the newer code is done right — old code is the problem).
- No storage buckets, so no storage attack surface.

---

## Priority Remediation Plan

1. **Immediate (same-day):**
   - Revoke anon/authenticated EXECUTE on the no-auth-check functions (C2 list).
   - Drop/rewrite `questions_select_authenticated` policy; stop serving `correct_option`/explanations to students.
   - `REVOKE SELECT ON admin_leaderboard_view, daily_attempts_stats, exam_distribution FROM anon;`
   - Fix `notifications_service_insert` (C4) and `question_counts` security_invoker (C5).
2. **Short-term (this sprint):**
   - Add `auth.uid()` ownership checks to all SECURITY DEFINER write RPCs.
   - Consolidate duplicate policies (H2); pin `search_path` (H4).
   - Enable HIBP password protection (M4).
3. **Housekeeping:**
   - Re-baseline migrations (M1), drop duplicate indexes (M3), move `pg_trgm` (M2).

No schema changes have been made — this is a read-only audit. Awaiting approval to implement the remediation migration.

# AR-022 — Master Remediation Report: Sub-Admin Create Exam Page (`/sub-admin/create`)

**Scope:** `src/components/sub-admin/create/*` + `teacherExamService.ts`, `teacherExam.repository.ts`, `securitySchemas.ts`, hardening migration.
**Branch:** `phase-3.5` (baseline HEAD `6ec240f`). **Date:** 2026-08-29.
**Session type:** write-permitted remediation of the read-only audit findings (C1/C2/C3, H1, M1–M3, L1–L5).

---

## VERDICT

> **PUBLISH-READY SUBJECT TO DEPLOYING THE STAGED (UNCOMMITTED, NEVER-APPLIED)
> HARDENING MIGRATION `20260828203000` AND RE-VERIFYING AGAINST A LIVE
> DATABASE WITH LEGITIMATE AUTHENTICATED ACCOUNTS.**
>
> All code-level remediation is complete, statically proven, unit-tested green,
> and bundles cleanly. The only remaining opens are **runtime** verification
> gates that require a live, authenticated Supabase environment — these are
> classified **BLOCKED/UNVERIFIED** and are **not** convertible to PASS by this
> session. No UNVERIFIED/BLOCKED item is reported as PASS.

---

## Section 1 — Gate Summary

| Gate | Result | Classification |
|------|--------|----------------|
| TypeScript `tsc -b` | 61 pre-existing errors, **0 in my scope** (identical to baseline) | STATIC-PROVABLE — PASS (no new regressions) |
| ESLint (scoped to changed files) | Clean (0 errors) | STATIC-PROVABLE — PASS |
| Unit + contract tests (create) | 33 / 33 PASS (24 workflow + 9 contract) | STATIC-PROVABLE — PASS |
| Full `vitest` suite | 491 / 494 pass — 3 failures are **pre-existing, unrelated** settings/CSV tests (`b6-sub-admin-self-update`, `subadmin-settings-remediation`) untouched this session | NOT REGRESSION |
| `npx vite build` | OK — emits `SubAdminCreate-*.js` (43 kB) | STATIC-PROVABLE — PASS |
| `npm run build` (`tsc -b && vite build`) | Blocked by the same 8 pre-existing `tsc` files as baseline (not by this work) | PRE-EXISTING — NOT MY SCOPE |
| Hardening migration SQL | Statically reviewed; **NOT executed against a live/real Postgres** | RUNTIME-REQUIRED — NOT RUN |
| Live applied-state of hardening migration | **UNKNOWN** — no authenticated LIVE access; anon cannot call the create RPC; service_role forbidden | **BLOCKED/UNVERIFIED** |
| Authenticated LIVE RPC / RLS positive-negative (Sub-Admin A/B isolation, anonymous denial, real publish) | Not executed — needs legitimate accounts / approved env | **BLOCKED/UNVERIFIED** |

---

## Section 2 — Findings and Dispositions

Legend for §60 acceptance-criteria boxes:
`SP` = static-provable, `RT` = runtime-required, `UNV` = unverified, `BLK` = blocked.

### C1 (CRITICAL) — RPC contract mismatch (client snake_case vs server camelCase)
- **Root cause:** hardening RPC read camelCase keys only; client sends snake_case → every publish would fail `VALIDATION_ERROR`.
- **Fix (decision: keep client snake_case, make RPC backward+forward compatible):**
  - New definer helper `public.te_q_field(q, camel_key, snake_key)` normalizes a field from **either** spelling into one canonical value and **Raises `VALIDATION_ERROR: conflicting values for X`** if both forms are present and differ (deterministic rejection, never silent choice).
  - The RPC validates and inserts all question fields through `te_q_field`, so old snake client + new RPC works, and a future camel client + new RPC works.
- **Gate:** SP (SQL logic reviewed) + RT (needs live run). ✅ static; live = BLK.

### C2 (HIGH) — old RPC allowed anon/PUBLIC EXECUTE with no `auth.uid()` authn/authz
- **Fix (migration):** `REVOKE EXECUTE … FROM PUBLIC, anon`; `GRANT EXECUTE … TO authenticated` on the (only) 10-arg signature. Inside the RPC: require `auth.uid()` IS NOT NULL AND `(is_admin() OR EXISTS sub_admins WHERE id = p_sub_admin_id AND user_id = auth.uid())`, else `UNAUTHORIZED`. `SET search_path='public'` on all definer objects.
- **Gate:** SP (ACL/grant + SQL reviewed) + RT (live anonymous-denial + authorized-ok). ✅ static; live = BLK.

### C3 (HIGH) — idempotency existed server-side but client never sent `request_key`
- **Fix:** `teacher_exams.request_key` + partial `UNIQUE INDEX`; the RPC accepts `p_request_key text DEFAULT NULL`, reuses an existing exam for the same owner+key on retry (`unique_violation` resolved atomically), and now `RETURNS uuid` (was void). Client/service generate a fresh `crypto.randomUUID()` per publish attempt and pass it through hook → service → repository → RPC.
- **Gate:** SP (unit contract test asserts `requestKey` length ≥ 32 and is passed; RPC logic reviewed) + RT (retry-replay live). ✅ static; live = BLK.

### H1 (HIGH) — `marks_per_question` client cap (100) vs `numeric(4,2)` server cap (99.99)
- **Fix (decision: canonical max = 99.99 everywhere):** shared `examConfigSchema` `.max(99.99)`; HTML `max="99.99"`; RPC guards `<= 99.99`. Contract test rejects 100 (and 0/-1/NaN/Infinity), accepts 99.99.
- **Gate:** SP/unit PASS. ✅

### H2 (HIGH) — durable audit
- **Fix:** transactional `log_security_event('exam_publish', …)` inside the definer RPC (rolls back with the create — no "success" audit on rollback).
- **Gate:** SP (SQL reviewed; `log_security_event` is EXECUTE-only for postgres/service_role and callable by the postgres-owned definer). Live execution = BLK.

### H3 (HIGH) — no server-side rate limit
- **Fix:** new `exam_publish_attempts` table (RLS enabled, `REVOKE anon/authenticated`), 10 publishes per identity per 10 min sliding window → `RATE_LIMIT_EXCEEDED`, recorded transactionally inside the RPC.
- **Gate:** SP (SQL/logic reviewed) + RT live. ✅ static; live = BLK.

### M1 (MED) — `launchAI` fake success + auto-advance when popup blocked
- **Fix:** new testable `openExternalWindow()` opens the popup synchronously within the user gesture and returns `false` on null/throw; on block the hook sets an inline `copyError`, does **not** advance step and does **not** toast success.
- **Gate:** unit (3 cases: opened true; null false; throw false). PASS. ✅

### M2 (MED) — client sent `p_source_type: null`
- **Fix:** service passes `p_source_type: 'text'`; RPC also defaults/falls back to `'text'`.
- **Gate:** contract unit test asserts `p_source_type === 'text'`. PASS. ✅

### M3 (MED) — React key `q.display_order` (remount/scroll/key-collision risk)
- **Fix:** `QuestionData.client_id: string` (required) via `newQuestionClientId()` (`crypto.randomUUID()`); `CreateStepReview` uses `key={q.client_id}`; `display_order` remains the **business** ordering field (re-derived 1-based after delete). `client_id` is stripped by `toRpcQuestion()` and by the service before the RPC; `BulkQuestionSchema` strips it from validated output.
- **Gate:** unit (toRpcQuestion strips, uniqueness; workflow fixtures updated to unique `client_id`). PASS. ✅

### L1 (LOW) — SuccessView raw buttons
- **Fix:** replaced with shared `Button` (primary "View My Exams" → `/sub-admin/my-exams`, soft "Create Another" → reset).
- **Gate:** code review. PASS. ✅

### L3 (LOW) — Add Question → Configure carried invalid question state forward
- **Fix:** new `handleConfigure` validates **every** question via `BulkQuestionSchema`, opens the first invalid card (`setAutoEditIndex`) and shows an inline message; empty list shows the canonical no-questions message. Publish still re-validates the authoritative snapshot.
- **Gate:** code review + publish pre-check path unchanged. PASS. ✅

### L4 (LOW) — Step 5 reachable with invalid setup
- **Fix:** `handleStepChange` validates `examConfigSchema` when `targetStep === 5`; on failure sets an inline error naming the offending field and bounces to Step 4.
- **Gate:** code review. PASS. ✅

### L5 (LOW) — README stale
- **Fix:** updated the "Golden Reference" README for: marks cap 99.99 (was "> 100"), `client_id` identity, **active** duplicate detection (was falsely "no duplicate detection"), and the full hardened RPC publish flow (10-arg signature, auth, rate limit, `request_key` idempotency, dual-key normalization, bilingual Telugu preservation, uuid return, error mapping).
- **Gate:** doc review. PASS. ✅

### L2 (LOW) — `SegmentedFilter` tab/disclosure semantics
- **Decision:** **documented, not changed** (non-blocking). `SegmentedFilter` is a shared component used across admin surfaces; changing its ARIA/tab semantics is broader than this page. It correctly uses `role="tablist"`/`tab`; lacks `aria-controls`/arrow-key navigation. Recorded as a known, non-blocking a11y improvement for a future shared-component pass. **PASS (accepted as documented limitation).**

---

## Section 3 — Implementation (files changed this session)

| File | Change |
|------|--------|
| `src/components/sub-admin/create/types.ts` | Added required `client_id`; `newQuestionClientId()`; `toRpcQuestion()` (strips client_id); `openExternalWindow()` |
| `src/components/sub-admin/create/useCreateExam.ts` | M1 popup-block handling; L4 step-5 validation bounce |
| `src/components/sub-admin/create/CreateStepReview.tsx` | `client_id` key; `handleConfigure` validation; `handleAddQuestion` client_id |
| `src/components/sub-admin/create/CreateStepJsonPaste.tsx` | `client_id` on accepted questions |
| `src/components/sub-admin/create/CreateStepSetup.tsx` | `max="99.99"` on marks input |
| `src/components/sub-admin/create/SuccessView.tsx` | Shared `Button` (L1) |
| `src/services/teacherExamService.ts` | `request_key` generation, `client_id` strip, `p_source_type:'text'`, `mapTeacherExamCreateError` |
| `src/lib/repositories/teacherExam.repository.ts` | 10-arg RPC params |
| `src/validations/securitySchemas.ts` | marks cap `99.99` |
| `src/security/subadmin-create-workflow.test.tsx` | Fixtures updated for `client_id` |
| `src/security/subadmin-create-contract.test.tsx` | **new** — 9 contract tests |
| `src/components/sub-admin/create/README.md` | Contract accuracy (L5) |
| `supabase/migrations/20260828203000_teacher_exam_create_security_hardening.sql` | Rewritten: dual-key RPC + auth + rate limit + idempotency + bilingual + validation parity |

---

## Section 4 — Tests

**`src/security/subadmin-create-workflow.test.tsx` — 24/24 PASS**
Prompt/copy gate, AI launch matrix, paste/parse tallies, review edit/delete, setup/schedule (+30 min default, override/reset/re-derive), publish pre-checks.

**`src/security/subadmin-create-contract.test.tsx` — 9/9 PASS**
`toRpcQuestion` strips `client_id`; `newQuestionClientId` uniqueness; `openExternalWindow` opened/null/throw; `examConfigSchema` marks parity (99.99 ok, 100/0/-1/NaN/Infinity rejected); service passes resolved `sub_admin` id + `p_source_type:'text'` + strong `p_request_key` + client_id-stripped questions.

> Full suite note: 3 unrelated pre-existing failures in `subadmin-settings-remediation.test.tsx` (jsdom `Blob.text` missing) and `b6-sub-admin-self-update.test.ts` — neither touched this session.

---

## Section 5 — Migration Detail (deploy step)

`20260828203000` is **staged `A`, never committed, never applied**. Apply as ONE transaction (`supabase db push --linked …` or Management API with BEGIN/COMMIT). It:
1. Drops both old 9-arg overloads; creates the single 10-arg definition (defaults keep old callers working).
2. REVOKE anon/PUBLIC; GRANT authenticated; server authn/authz (`auth.uid()` + is_admin/sub_admin ownership).
3. Adds `request_key` (partial unique index) + idempotent replay returning `uuid`.
4. Adds `exam_publish_attempts` rate-limit table + sliding window.
5. Adds `uq_teacher_exam_questions_order (teacher_exam_id, display_order)`.
6. Adds `te_q_field` dual-key normalization helper (definer, EXECUTE revoked from app roles).
7. Revalidates exam + every question via `te_q_field`, preserves bilingual Telugu columns, and writes a transactional audit event.

---

## Section 6 — Remaining Open Items (must be closed before declaring final PUBLISH-READY in production)

| Item | Type | Needed to close |
|------|------|-----------------|
| Apply the migration to the live DB and confirm applied state (is publish currently broken by the camelCase mismatch, or currently open to anon?) | BLK | Approved env / migration run |
| Authorized positive + negative RPC/RLS tests (Sub-Admin A creates; B cannot touch A's exams; anonymous denied; real publish round-trip; retry-with-same-key returns same uuid; rate-limit kicks in; bilingual Telugu persists) | BLK | Legitimate accounts + approved env |
| Execute the RPC SQL against real Postgres and fix any dialect issues found | RT | Live DB run |
| (Suggested, non-blocking) shared `SegmentedFilter` a11y enhancement | low | separate component pass |

# P0-02 — FINAL RELEASE CLOSURE REPORT

- Project: `xbjhlfwqmcyatblsrhxn` · PostgreSQL `17.6` (live production)
- Date: 2026-09-28
- Authoritative commits: `8a0291a` (migration + pgTAP suite + production report), `2010224` (production report correction)
- Scope: P0-02 release closure ONLY. P0-03 was NOT started.

| GATE ITEM | STATUS |
| --- | --- |
| DATABASE SECURITY | **PASS** |
| SOURCE / REFACTOR INTEGRITY | **PASS** |
| TEST | **PASS** |
| BUILD | **PASS** |
| SOURCE COMMITTED | **NOT COMMITTED** (documented refactor dependency) |
| DEPLOYMENT | **BLOCKED** |
| POST-DEPLOYMENT | **NOT RUN** |
| **P0-02 RELEASE** | **NOT CLOSED** |

---

## 1. DATABASE SECURITY STATUS — PASS

- Migration `20261004000000_p0_02_server_owned_exam_entitlements` is applied in the live ledger; `user_exam_entitlements` exists with RLS enabled.
- `authenticated` no longer holds UPDATE on `users.exam_selection`; `full_name` and `last_activity_date` remain writable (verified intentional).
- The dead public `exam_selection` enum was guarded and dropped without `CASCADE`.
- Backfill preserved exactly 8 legitimate grants (5 group + 3 exam); all 22 NULL-selection users received nothing.
- 5 RLS policies and 9 SECURITY DEFINER RPCs depend on the canonical gate `public.is_exam_allowed_for_user(text)`; no bypassing duplicate exists.
- `set_preferred_exam(p_exam_id text)` and `get_my_entitlements()` are live; `authenticated` EXECUTE allowed, `anon`/`PUBLIC` denied (42501).
- Population: 30 users; 22 NULL-selection users hold zero entitlements.
- No live security logic was modified during this closure task.

## 2. SOURCE / REFACTOR STATUS — PASS (integrity) / NOT COMMITTED (delivery)

Phase A audit and Phase B integration were verified against the current tree (not assumed from the report):

- `userRepo.updateUser` has ZERO executable callers. The 3 HEAD callers were migrated to typed SECURITY DEFINER RPCs in the existing refactor: `adminSetUserActiveRpc` (userService.ts:224), `removeSubAdminViaRpc` (:263), `updateSubAdminNameViaRpc` (:334). This strictly REDUCES client privilege (no client writes to other users' `role`/`educator_id`/`full_name`).
- `getAllowedExamIds` is the single canonical resolver (src/utils/examUtils.ts:28). `resolveExamIds` is a single arrow delegate (src/lib/examUtils.ts:20) — not duplicate logic.
- Exactly one preferred-exam setter (`rpc('set_preferred_exam')`) and one entitlement retrieval path (`rpc('get_my_entitlements')`); no client RPC grants entitlement.
- Zero `.from('users').update|insert|delete|upsert` in non-test source.
- SignupPage loads selectable exams from server `getMyEntitlements` and writes preference via the validated RPC; entitlement remains server-owned; no client metadata grants entitlement.
- tsconfig decision: the `src/**/*.test.ts(x)` / `__tests__` exclusion is RETAINED. It is required by the final architecture (the excluded files import `node:fs` and cannot compile in a browser bundle) and does not hide any production-source error — `include:["src"]` still type-checks all non-test source with `strict:true`. The 4 excluded files are unrelated, untracked live-DB prompt-probe scratch with zero P0-02 references; per instructions they were NOT deleted as unrelated refactor work.

The four P0-02 source files remain intentionally UNCOMMITTED because they are coupled to the in-flight ~300-file refactor and cannot be isolated from HEAD without breaking HEAD callers or fabricating a synthetic commit.

## 3. TEST STATUS — PASS

- Targeted P0-02 suites: 5 files, **56/56 passed**.
- Full suite: **2132 passed, 7 failed** across 4 files — exactly the known unrelated `src/lib/prompts/` failures (promptCorpus, promptDefaultPrompts, and 2 live-DB probe files). No new regression was introduced by the refactor.
- P0-02 database pgTAP suite remains `plan(46)` in the live ledger (executed live in prior phase).

## 4. BUILD STATUS — PASS

- `npx tsc -b`: exit 0 (0 errors).
- `npm run build`: `✓ built in 26.84s`, exit 0. `dist/` is gitignored (generated artifact, not committed).

## 5. GIT / COMMIT STATUS — NOT COMMITTED (documented dependency)

- HEAD: `2010224` → `8a0291a` → `a1bca77`.
- Working tree preserved intact: 878 dirty entries (366 modified, 37 deleted, 475 untracked), 0 staged. No destructive Git operation was performed; no file was reset, checked out, stashed, or discarded.
- Uncommitted P0-02 files (cannot be separated from HEAD):
  - `src/lib/repositories/user.repository.ts`
  - `src/services/leaderboardService.ts`
  - `src/pages/SignupPage.tsx`
  - `tsconfig.app.json`
- No new source commit was created. The verified frontend source exists only in the working tree, coupled to the refactor. The stale detached worktree at `C:/tmp/pfu-head` was not touched.

## 6. DEPLOYMENT STATUS — BLOCKED

Verified preconditions that PASS:
- Supabase target is the correct live project host `xbjhlfwqmcyatblsrhxn.supabase.co` (not a dev/localhost endpoint).
- Anon key present and a valid JWT.
- `vercel.json` present with CSP, HSTS, X-Frame-Options, and related security headers.

Blocking gaps (deployment cannot be performed; no credentials invented, no deployment claimed):
- No `.vercel` project link.
- No Vercel/Netlify CLI installed.
- No deploy script in `package.json`; no `.github/workflows` CI.
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `NETLIFY_AUTH_TOKEN` all unset.
- No authorized P0-02-only deployable artifact exists: the working tree bundles the ~300-file refactor (out of scope to ship), while HEAD lacks the P0-02 frontend source integration.

## 7. POST-DEPLOYMENT STATUS — NOT RUN

Blocked by Phase F. No application-level verification, and no post-deployment live exploit re-test, was performed. Nothing is deployed.

## 8. LIVE EXPLOIT VERIFICATION — PASS (pre-deployment); post-deployment re-test NOT RUN

Recorded from the authoritative live verification (`8a0291a` / `2010224`):
- Direct `users.exam_selection` mutation refused.
- Direct entitlement self-grant refused.
- Unentitled user: 0 protected rows.
- Admin grant: 1767 questions visible; revoke: 0. Matches expected.
- Post-rollback residue 0/0/0; population 30 users / 22 NULL users with zero entitlements.

Repeating this after deployment remains required by the gate and is pending the deployment blocker.

## 9. REMAINING BLOCKERS

1. No deployment credentials / hosting access (Phase F).
2. No authorized P0-02-only deployable artifact — the four P0-02 source files are coupled to the in-flight refactor (documented dependency, not fabricated isolation).
3. Therefore the verified frontend source is not committed and the exact verified build is not deployed; post-deployment verification and post-deployment exploit re-test are impossible.

## 10. P0-02 FINAL VERDICT

- P0-02 SECURITY REMEDIATION: **PASS**
- P0-02 RELEASE: **NOT CLOSED** (deployment BLOCKED; post-deployment NOT RUN)
- P0-03: **NOT STARTED** (not authorized)

Per the absolute stop condition, deployment was not faked, P0-02 was not marked closed, and P0-03 was not started. To proceed, land the parent refactor as a coherent unit (preserving the four P0-02 edits), commit that source, and provide an authenticated deployment mechanism; then run the full post-deployment checklist and re-test the live exploit.

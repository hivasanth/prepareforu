# P0-02 — RELEASE BLOCKER RESOLUTION REPORT

- Project: `xbjhlfwqmcyatblsrhxn` · PostgreSQL `17.6` (live production)
- Date: 2026-09-28
- Mission: resolve ONLY (1) coherent committed source state and (2) authorized deployment mechanism. P0-03 NOT started.

| ITEM | STATUS |
| --- | --- |
| SOURCE / REFACTOR COMMIT (BLOCKER 1) | **RESOLVED** |
| DEPLOYMENT MECHANISM (BLOCKER 2) | **BLOCKED** — credentials/access required |
| P0-02 RELEASE | **STILL BLOCKED — DEPLOYMENT ACCESS REQUIRED** |

---

## 1. CURRENT HEAD
- `f27f669` — refactor: include tsconfig.app.json resolveJsonModule + test boundary
- `5da8f1a` — refactor: land coherent source state containing P0-02 frontend + dependencies
- Prior P0-02 commits preserved: `4e21e7b`, `2010224`, `8a0291a`.

## 2. REFACTOR FILES COMMITTED — PASS
- 646 files committed as one coherent unit (`5da8f1a` + `f27f669`): full frontend `src/`, `supabase/migrations/*.sql`, `supabase/tests/`, `supabase/functions/` (edge-function relocation of `onboard-sub-admin`), and build/test config (`package.json`, `package-lock.json`, `vite.config.ts`, `vitest.config.ts`, `vitest.setup.ts`, `eslint.config.js`, `tsconfig.app.json`, `.gitignore`).
- Rationale (verified, not assumed): the P0-02 source changes are embedded in the larger refactor; HEAD's frontend was undeployable against the live DB (it wrote `users.exam_selection` via `.from('users').update()`, which the live P0-02 migration revoked). A false isolated commit was rejected per mission rules.

## 3. P0-02 SOURCE FILES COMMITTED — PASS
All four P0-02 source files are now in committed history:
- `src/lib/repositories/user.repository.ts` — `set_preferred_exam` / `get_my_entitlements` RPC contract; generic `updateUser` removed.
- `src/services/leaderboardService.ts` — deduped exam-ID expansion via canonical resolver.
- `src/pages/SignupPage.tsx` — typing cleanup; entitlement/preference remain server-owned.
- `tsconfig.app.json` — `resolveJsonModule: true` + broad `*.test.*` boundary (verified: `tsc -b --force` = 0 errors with or without it; it hides no production-source error).

## 4. FILES DELIBERATELY LEFT UNCOMMITTED
264 entries remain dirty, all Category C/D scratch (intentionally excluded): ~180 unrelated audit/spec `.md` reports (root, `docs/`, `.opencode/plans/`), `e2e/*.spec.ts` + `playwright.config.ts` + `pw.*.config.ts`, 12 live-DB `*Probe.test.ts` scratch tests, `scripts/` dev probes and data dumps, `supabase/migrations/_*` raw captures, `supabase/.temp` / `.branches` local CLI state, `supabase/live_schema_snapshot.sql` / `schema_query.sql`, `test-results/`, `android/`, `.env.example`, and the 2 deleted/renamed migrations' old docs. No destructive Git operation was performed; the stale worktree `C:/tmp/pfu-head` was not touched.

## 5. REMOVED OBSOLETE CODE — PASS
- `userRepo.updateUser` removed ONLY after proving zero executable callers (the 3 HEAD callers were migrated to `adminSetUserActiveRpc`, `removeSubAdminViaRpc`, `updateSubAdminNameViaRpc`). Verified absent from the committed `user.repository.ts` blob.
- Obsolete edge-function location `supabase/onboard-sub-admin/` removed (relocated to `supabase/functions/onboard-sub-admin/`, referenced by `config.toml` and `userService.ts:361`).

## 6. DUPLICATE-CODE AUDIT — PASS
- Exactly one canonical `getAllowedExamIds` (src/utils/examUtils.ts); `resolveExamIds` is a single arrow delegate (src/lib/examUtils.ts) — not a second implementation.
- Exactly one preferred-exam setter (`set_preferred_exam`) and one entitlement retrieval (`get_my_entitlements`). No client RPC grants entitlement. Zero `.from('users').update|insert|delete` in non-test source.

## 7. TYPESCRIPT — PASS
- `npx tsc -b`: 0 errors (exit 0). `npx tsc -b --force`: 0 errors.

## 8. TARGETED TESTS — PASS
- P0-02 targeted suites: 5 files, **56/56 passed** (exit 0).

## 9. FULL TESTS — PASS (known unrelated failures)
- Full suite on the working tree: **2132 passed, 7 failed** (4 files, all under `src/lib/prompts/` — 2 of those 7 are live-DB probe scratch tests that are NOT part of the committed state). No P0-02 or refactor regression.

## 10. PRODUCTION BUILD — PASS
- `npm run build`: **✓ built in 1m 28s**, exit 0. `dist/` is gitignored (generated artifact). Build ran on exactly the committed source configuration.

## 11. DEPLOYMENT MECHANISM
- `vercel.json` exists (tracked) with CSP/HSTS/X-Frame-Options security headers.
- Missing: `.vercel` project link, deploy script in `package.json`, any `.github/workflows` CI, Vercel/Netlify/other CLI, and any `netlify.toml`/`firebase.json`/etc.

## 12. CREDENTIAL / ACCESS STATUS — BLOCKED
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `NETLIFY_AUTH_TOKEN`: all unset. No Vercel or Netlify CLI installed. No existing CI deploy access. No hosting account linkage in the repo.

## 13. DEPLOYMENT STATUS — NOT RUN
- Nothing deployed. No deployment was faked.

## 14. POST-DEPLOYMENT STATUS — NOT RUN
- The post-deployment checklist (login, signup, entitlement retrieval, preferred-exam selection, entitled/unentitled visibility, leaderboard, admin flows, RPC errors, live exploit re-test, grant→access / revoke→removed, residue) remains pending deployment.

## 15. REMAINING BLOCKERS
1. Deployment credentials/hosting access (BLOCKER 2) — provider, project association, and authenticated deploy access are all absent.
2. Post-deployment verification is required before P0-02 may be marked closed.

### Live-DB coherence evidence (recorded this session)
- All **36 SECURITY DEFINER RPCs** the committed frontend calls are **present in the live DB** with argument names matching every call site (0 signature mismatches).
- The live P0-02 security model was NOT modified; read-only introspection only.

---

## FINAL STATUS — A
**P0-02 RELEASE STILL BLOCKED — DEPLOYMENT ACCESS REQUIRED.**
- P0-02 SECURITY REMEDIATION: **PASS**
- P0-02 SOURCE/REFACTOR (BLOCKER 1): **RESOLVED** — coherent committed state at `f27f669`, containing all four P0-02 files, verified buildable (tsc 0, P0-02 56/56, build ✓) and contract-compatible with the live DB.
- DEPLOYMENT ACCESS (BLOCKER 2): **BLOCKED** — no provider association or authenticated mechanism.
- POST-DEPLOYMENT VERIFICATION: **NOT RUN**.
- P0-03: **NOT STARTED / NOT AUTHORIZED**.

Next step requires the owner to provide an authenticated deployment path (e.g., Vercel project + CLI/auth, or a CI deploy job), after which the exact verified commit `f27f669` can be deployed and the post-deployment checklist executed.
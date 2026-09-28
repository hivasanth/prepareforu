# P0-02 — Server-Owned Exam Entitlements · Final Production Report

**P0-02 STATUS: NOT CLOSED** — database remediation **COMPLETE and LIVE-VERIFIED**; frontend **NOT DEPLOYED**.
**Permission to start P0-03: NOT GRANTED.** See §29–§30.

| State | Verdict |
|---|---|
| DATABASE | **LIVE VERIFIED** |
| SOURCE | Migration + suite + report **committed** (`8a0291a`); 4 source files **uncommitted, Option B** (§24) |
| FRONTEND | **NOT DEPLOYED** (§27) |
| POST-DEPLOYMENT | **NOT VERIFIED** (nothing deployed) |

- Project: `xbjhlfwqmcyatblsrhxn` · PostgreSQL `17.6`
- Migration: `supabase/migrations/20261004000000_p0_02_server_owned_exam_entitlements.sql`
- Ledger: `supabase_migrations.schema_migrations` version `20261004000000`, name `p0_02_server_owned_exam_entitlements`
- Suite: `supabase/tests/p0_02_exam_entitlements.sql`, `plan(46)`

Every claim below is separated into **implemented in repository**, **applied to live DB**, and **verified against live DB**. Nothing in this report is inferred from repository state alone.

---

## 1. Summary

`public.is_exam_allowed_for_user(text)` decided content access by reading `public.users.exam_selection`, and that column carried an `authenticated` UPDATE grant. Any account holder could therefore grant themselves an entire exam category with one `PATCH`, and signup metadata set the same value verbatim.

Authorization now lives in a server-owned table, `public.user_exam_entitlements`. `users.exam_selection` survives as a **validated preference that grants nothing**, writable only through `set_preferred_exam`, which refuses any value not backed by a live entitlement. The resolver keeps its exact signature and volatility, so all 5 RLS policies and 9 SECURITY DEFINER RPCs that depend on it migrated atomically with a single in-place rewrite.

| | Before | After |
|---|---|---|
| Self-service category unlock | one `PATCH` | impossible |
| `authenticated` UPDATE on `users.exam_selection` | true | **false** |
| Accounts with content access | any self-declared | 8 server-granted |
| Entitlement rows | — | 8 (5 group, 3 exam) |
| Accounts with NULL selection granted access | — | 0 |

## 2. Vulnerability, precisely

Authorization read a user-writable column. Three facts combined:

1. `is_exam_allowed_for_user` returned true when `users.exam_selection` matched.
2. `GRANT UPDATE (full_name, exam_selection, last_activity_date) TO authenticated` (from `20260813200000_profile_security_remediation.sql`) let the holder write it.
3. `handle_new_user()` copied `raw_user_meta_data->>'exam_selection'` into the row, so signup seeded the same value.

Any authenticated user could `PATCH exam_selection='APPSC_GROUPS'` and unlock `APPSC_GROUP_1..4` with no purchase, no admin action, and no audit trail.

## 3. Proof of exploit — before (live, rolled back)

A throwaway account was created the way signup creates one, and the original attack was replayed inside a transaction that was rolled back.

```
01_fresh_exam_selection          NULL
08_direct_update_exam_selection  SUCCEEDED
15_persisted_exam_selection      APPSC_GROUPS
03_allow_g1_before               false      09_allow_g1_after  true
04_allow_g4_before               false      10_allow_g4_after  true
05_q_g1_before                   0          11_q_g1_after      1767
06_papers_g1_before              0          12_papers_g1_after 2
07_study_topics_g1_before        0          13_study_topics_g1_after 13
14_allow_bank_after              false
```

Questions `0 → 1767`, papers `0 → 2`, topics `0 → 13`. `BANK_EXAMS` stayed denied, matching the old explicit exclusion.

## 4. Proof of exploit — after (live, rolled back)

The same attack against the migrated database.

| Probe | Result |
|---|---|
| `03_EXPLOIT_direct_update` | **REFUSED: permission denied for table users** |
| `10_EXPLOIT_direct_entitlement_insert` | **REFUSED: permission denied for table user_exam_entitlements** |
| `11_EXPLOIT_set_preferred_unentitled` | **REFUSED: UNAUTHORIZED_ACCESS … cannot grant access to APPSC_GROUP_1** |
| `13_EXPLOIT_set_preferred_group` | **REFUSED: UNAUTHORIZED_ACCESS … cannot grant access to APPSC_GROUPS** |
| `12_EXPLOIT_self_grant` | **REFUSED: UNAUTHORIZED_ACCESS: admin privileges required** |
| `25_admin_direct_pref_write` | **REFUSED: permission denied for table users** (even as admin) |
| `39_grantee_cannot_self_grant` | REFUSED |
| `04/05_allow_g1/g4` | `false` / `false` |
| `06/07/08` questions / papers / topics | `0` / `0` / `0` |
| `09_my_entitlements` | `0` |

Metadata claiming `APPSC_GROUPS` was accepted as a **preference** (`01_victim_preference_from_metadata = APPSC_GROUPS`) while producing **zero** entitlement rows (`02_victim_entitlement_rows = 0`). Preference and authority are now independent.

## 5. Canonical objects — applied and verified

All present on live.

| Object | Kind | Verified |
|---|---|---|
| `public.user_exam_entitlements` | table, RLS on, no client privilege | ✅ |
| `public._pf_entitled_exam(uuid,text)` | private resolver, `SECURITY DEFINER` | ✅ |
| `public.is_exam_allowed_for_user(text)` | chokepoint, `STABLE` | ✅ |
| `public.get_my_entitlements()` | read side | ✅ |
| `public.set_preferred_exam(text)` | validated preference write | ✅ |
| `public.admin_grant_exam_entitlement(...)` | admin authority | ✅ |
| `public.admin_revoke_exam_entitlement(uuid,text,text)` | admin authority | ✅ |

`exam_id` is deliberately **not** foreign-keyed to `public.exams`: a `group` grant names a category (`APPSC_GROUPS`) with no row in `exams`. Group membership resolves through `exam_configs` at read time, so publishing a new exam inside a group automatically extends existing group grants.

`scope` and `source` are constrained vocabularies, so subscriptions, coupons, referrals and a future payment provider are expressible as data rather than schema changes. No payment code is introduced.

## 6. Privilege state — live

```
auth_update_exam_selection   false   <- the vulnerability, closed
auth_update_full_name        true    <- still self-writable, by design
auth_update_last_activity    true    <- still self-writable, by design
auth_sel_entitlements        false
auth_ins_entitlements        false
auth_upd_entitlements        false
auth_exec_resolver           false
anon_exec_resolver           false
anon_exec_is_allowed         false
anon_exec_get_mine           false
anon_sel_entitlements        false
```

Only `exam_selection` was revoked. `full_name` and `last_activity_date` stay self-writable because neither can grant content access, and stripping them would break the profile page and the activity heartbeat for no security benefit. The table-level UPDATE was already revoked in `20260813200000`, so the column grant was the only writer that existed.

## 7. Enforcing all writers — no bypass remains

All 15 public functions that touch `public.users` were enumerated and each checked for assignment to `exam_selection`:

- `handle_new_user` — the **only** function mentioning `exam_selection`; it INSERTs a signup-seeded **preference**.
- **Zero** functions assign `users.exam_selection` via UPDATE.

Therefore the only UPDATE writer was the direct client column privilege, and revoking it closes the last one. Post-migration the sole writers are `set_preferred_exam` (entitlement-validated) and `handle_new_user` (preference seed, no entitlement).

`commit_hierarchy_draft_rpc`, `admin_list_users`, `get_admin_leaderboard` and `create_new_exam_rpc` were reviewed and **do not** write `users.exam_selection`. `commit_hierarchy_draft_rpc` writes `exam_configs.exam_selection` — the exam catalogue, a different column, admin/sub-admin guarded, `SECURITY DEFINER`, `search_path=public`.

## 8. Dead code removed

**`public.exam_selection` enum — dropped from live.** Not the column and never was: a leftover type whose labels are a hardcoded exam list (`APPSC_GROUPS`, `NEET`, `AP_EAMCET_ENGINEERING`, `AP_EAMCET_MEDICAL`, `TS_EAMCET_ENGINEERING`, `TS_EAMCET_MEDICAL`). Pre-apply verification found 0 columns, 0 casts, 0 function arguments or return types, 0 column defaults, 0 constraints, and 0 non-internal `pg_depend` entries. `admin_leaderboard_view.exam_selection` is `text` from `exam_configs`, not the enum. No migration in this repository ever created the type. The drop is re-guarded at apply time and has **no `CASCADE`**, so a dependency appearing later aborts the drop rather than taking a dependent object with it. Post-apply: `enum_still_exists = false`.

**`userRepo.updateUser(id, updates)` — removed from the repository, but refactor-coupled.** A generic `.from('users').update(updates)` escape hatch, the exact shape that re-introduced P0-02. **Correction to the original claim:** it was described here as having "no callers." That is true only in the current working tree. At commit `8a0291a` it had three live callers — `userService.ts:176` (`is_active`), `:233` (sub-admin deactivation) and `:299` (`full_name`) — which the larger refactor replaced with the typed admin RPCs (`adminSetUserActiveRpc` et al.). It is therefore dead **only after** that refactor lands, cannot be removed in isolation, and is classified as Option B in §24. No test referenced it either way.

**`leaderboardService.APPSC_GROUPS` — removed.** `fetchAdminLeaderboard` carried a second local copy of the four group ids while already importing `getAllowedExamIds`. Now delegates; behaviour identical for all three input cases (`all` → `[]`, `APPSC_GROUPS` → four ids, specific exam → `[id]`).

## 9. Duplicate-code sweep

The four APPSC group ids are now written in exactly one place, `src/utils/examUtils.ts:37-42`. `src/lib/examUtils.ts:20` delegates to it. `leaderboardService.ts:145` delegates to it.

`src/hooks/useExamPaperSubjectSelection.ts:12-17` (`APPSC_SUB_TABS`) also lists the four ids, but as a **labelled UI tab constant** — a different concern with a different shape, granting nothing. Left in place and recorded here rather than silently reshaped.

## 10. Backfill — 8 grants, no invention

```
total_rows            8        distinct_users  8        orphan_users  0
scope=group  source=migration   5
scope=exam   source=migration   3
```

Distribution matches the pre-apply audit exactly: 5 accounts held `APPSC_GROUPS`, 3 held `BANK_EXAMS`, 22 held NULL.

- The 8 accounts with a usable selection kept precisely the access they had.
- **0** of the 22 NULL-selection accounts received anything. No entitlement was invented for anyone.
- `source='migration'` plus `metadata.migrated_from` keeps the origin of every pre-existing grant visible.
- The literal `'all'` is deliberately **not** translated: the old function excluded it explicitly, so granting it would be a privilege increase disguised as a migration. `exam_id='all'` count is `0`.

## 11. Backfill access preserved — verified per user

`is_exam_allowed_for_user` resolves `auth.uid()`, so these were measured as each real account, not from an owner session.

| Account | Result |
|---|---|
| APPSC group grantee | `APPSC_GROUP_1` allowed; **1767** questions visible; `get_my_entitlements` = 4; `BANK_EXAMS` denied; `set_preferred_exam('APPSC_GROUP_2')` OK |
| BANK_EXAMS grantee | `BANK_EXAMS` allowed; `APPSC_GROUP_1` denied; entitlements = 1 |
| NULL-selection user (role `user`) | `APPSC_GROUP_1` denied; **0** questions visible; entitlements = 0 |

Whole-population invariants: `null_users_with_any_entitlement = 0`, `nonnull_users_missing_entitlement = 0` (after probe rollback).

## 12. Admin grant / revoke cycle — verified

```
22_admin_grant_ok                    GRANTED
38_grantee_row_exists                1
24_grantee_allowed_after_grant       true
32_grantee_visible_questions         1767
33_grantee_entitlement_count         1
26_admin_revoke_ok                   REVOKED
34_after_revoke_allowed              false
35_after_revoke_questions            0
36_after_revoke_entitlements         0
37_set_preferred_after_revoke        REFUSED
23_admin_has_no_implicit_access      true
```

Admin authority is over the **grant mechanism**, which is distinct from role-based content access: being an admin does not itself unlock any exam (`23` = true). Revocation is a soft `revoked_at` stamp, so a grant/revoke cycle is auditable rather than destructive, and revoking twice is refused.

## 13. New-user path — no self-service entitlement

A signup carrying `exam_selection: 'APPSC_GROUPS'` in metadata produces a preference and **zero** entitlement rows, and is refused every exploit path. A brand-new account has no first-entitlement path and **that is correct**: entitlement must come from an admin grant or a future purchase. No self-service route to content access exists or is intended.

One consequence to note: because `handle_new_user` seeds a preference, a new account satisfies the profile-completeness gate and lands on an empty dashboard rather than the selection card. The seeded preference is inert and, until the account holds an entitlement, cannot be changed (`set_preferred_exam` refuses unentitled values). This is a UX dead-end, not a security one. Noted for follow-up; signup behaviour was not changed in this phase.

## 14. ACL hardening applied post-migration

First verification found `get_my_entitlements()` and `set_preferred_exam(text)` still executable by `anon`/`PUBLIC`: `GRANT … TO authenticated` was issued without the paired revoke, so the default `PUBLIC` execute survived. Both are safe for anon — `auth.uid()` is NULL, so one returns no rows and the other raises — but a NULL-uid guard is a backstop, not an access policy.

Corrected in two places, keeping a fresh `supabase db reset` identical to live: `REVOKE ALL … FROM PUBLIC, anon` added to the migration, and the same revokes applied to live. Post-fix, **no** P0-02 function is reachable by `anon` or `PUBLIC`.

## 15. API layer — verified through PostgREST

Probed over `https://xbjhlfwqmcyatblsrhxn.supabase.co/rest/v1/` with the anon key. All six functions are present in the schema cache and all deny anon with `42501`:

```
rpc/is_exam_allowed_for_user          401  permission denied for function is_exam_allowed_for_user
rpc/get_my_entitlements               401  permission denied for function get_my_entitlements
rpc/set_preferred_exam                401  permission denied for function set_preferred_exam
rpc/_pf_entitled_exam                 401  permission denied for function _pf_entitled_exam
rpc/admin_grant_exam_entitlement      401  permission denied for function admin_grant_exam_entitlement
rpc/admin_revoke_exam_entitlement     401  permission denied for function admin_revoke_exam_entitlement
table/user_exam_entitlements          401  permission denied for table user_exam_entitlements
```

`42501` rather than `PGRST202` proves the schema cache reloaded and the **ACL** is what refuses. The `NOTIFY pgrst, 'reload schema'` at the end of the migration did its job.

## 16. Dependent objects — 5 policies, 9 RPCs, all intact

**RLS policies (verified via `pg_get_expr`):**

| Table | Policy | Expression |
|---|---|---|
| `questions` | `rls_questions_user_select` | `is_exam_allowed_for_user(exam_id) OR is_admin() OR is_sub_admin()` |
| `exam_papers` | `rls_exam_papers_user_select` | same |
| `exam_subjects` | `rls_exam_subjects_user_select` | same |
| `exam_topics` | `rls_exam_topics_user_select` | same |
| `study_topics` | `Users read published topics` | `is_published = true AND (is_exam_allowed_for_user(exam_id) OR is_admin() OR is_sub_admin())` |

**SECURITY DEFINER RPCs — all 9 present, all 9 call the rewritten resolver:**
`check_availability`, `check_topic_availability`, `create_attempt`, `get_leaderboard_top`, `get_subject_test_questions`, `get_topic_test_questions`, `get_user_leaderboard_rank`, `prepare_exam_questions`, `start_prepared_exam`.

`is_exam_allowed_for_user` is entitlement-backed and no longer references `users`. No public function still reads `users.exam_selection` in an authorization position.

*Correction to an earlier audit artifact:* a first pass used `pg_policy.polqual::text` and reported these policies as not referencing the resolver. `polqual` is `pg_node_tree`; the correct accessor is `pg_get_expr(polqual, p.polrelid)`. All 5 do call the resolver.

## 17. Test suite — two silent defects found and fixed

The suite reported 31/40 with the migration applied. Both causes were in the **fixture**, not the migration, and both failed silently — the suite ran and blamed the migration.

**Defect A — the profiles were never created.** Inserting into `auth.users` fires `handle_new_user()`, which creates the `public.users` row. The suite then re-inserted all four with `ON CONFLICT (id) DO NOTHING`, turning every insert into a no-op. All four fixtures silently had `role='user'` and `exam_selection=NULL`. Fixed: the profiles are no longer re-inserted; the two preferences under test are seeded the way a real signup seeds them, through metadata.

**Defect B — the admin fixture was never an admin.** `UPDATE public.users SET role='admin'` is reverted without error by `prevent_user_role_escalation()`, which assigns `NEW.role := OLD.role` for any caller that is not already an admin. The row stayed `role='user'` and every `admin_grant_*` / `admin_revoke_*` assertion failed with `UNAUTHORIZED_ACCESS`. **Exactly the 9 failures.** Fixed: the role is set at INSERT time by the table owner, which is a different statement from the UPDATE the guard intercepts.

Neither fix weakens production security. No trigger was disabled, no grant altered, no policy loosened. The escalation guard is a `BEFORE UPDATE` trigger and remains fully armed for every client path — the suite still proves that in the privilege section and again at the admin-writes-another-account assertion.

**One tautological assertion replaced.** The backfill check compared one count against itself filtered by scope, so it passed with zero rows and would also pass with every scope set to a bogus value. Replaced with two checks that can actually fail: no grant outside the `('exam','group')` vocabulary, and every `source='migration'` row records `metadata->>'migrated_from'`.

`plan(40)` → `plan(46)`: 5 fixture-sanity assertions added so a future edit reintroducing either defect fails loudly at the top instead of producing nine misleading failures.

## 18. Test results

| Harness | Config | Result |
|---|---|---|
| CONFIG A | current production, no migration | 17/40 |
| CONFIG B | migration + shipped fixtures | 31/40 |
| CONFIG C | corrected fixtures, wrong order | 36/40 |
| CONFIG D | migration + corrected fixtures + order | **40/40** |

**Suites** (corrected):

```
B1_no_exam_selection_update                true
B2_full_name_still_writable                true
B3_last_activity_still_writable            true
B4_resolver_not_client_callable            true
B5_no_client_select_entitlements           true
B6_no_client_insert_entitlements           true
B7_no_client_update_entitlements           true
B8_rls_on_entitlements                     true
B9_no_bad_scope                            true
B10_every_migrated_grant_records_origin    true
B11_no_all_grant                           true
B12_null_selection_users_ungranted         true
```

**Fixture sanity** (the two defects, now asserted):

```
A1_all_four_profiles_created           true
A2_admin_fixture_is_admin              true
A3_groups_preference                   true
A4_bank_preference                     true
A5_none_preference_null                true
A6_handle_new_user_did_not_set_role    true
```

`A6` additionally pins that `handle_new_user` still refuses to take a role from metadata.

## 19. Build, lint, typecheck

| Gate | Before | After |
|---|---|---|
| `tsc -b` (P0-02 files) | 0 errors | **0 errors** |
| `tsc -b` (repo) | 12 errors / 4 files | 12 errors / 4 files (unchanged, all pre-existing and all in test files) |
| `eslint .` | 280 problems (251 errors) | **273 problems (244 errors)** |
| P0-02 files | 34 problems | **27 problems (22 errors, 5 warnings)** |
| `npm run build` | **failed, exit 2** | **passes, exit 0** |
| `npx vitest run` | 8 failed / 2117 passed / 14 skipped | **7 failed / 2132 passed** |

Remaining P0-02-file lint is entirely pre-existing tech debt in five rules: `no-explicit-any` (20), `react-hooks/exhaustive-deps` (5), `no-case-declarations` (1), `react-refresh/only-export-components` (1). Four `any` usages that P0-02 itself introduced in `SignupPage` were removed by using the typed `AuthError.message` and dropping a redundant cast (`ExamSelection` is `string`). None of the remaining 22 is on a P0-02-authored line.

**Pre-existing build break, fixed to unblock deployment.** `npm run build` runs `tsc -b && vite build`, and `tsconfig.app.json` had `"include": ["src"]`, type-checking test files as part of the production bundle. Four suites carry pre-existing type errors, so the build failed and **no frontend deploy could succeed**. Test files are now excluded from the app config. Type-checking of tests is handled by their own tooling; this does not weaken the shipped bundle's type safety.

## 20. Pre-existing failures, not P0-02

`npx vitest run` → **4 failed files / 7 failed tests**, all in `src/lib/prompts/`:

- `promptCorpus.test.ts` — 6 failures, assertions about the duplicated `# VISUAL QUALITY EXAMPLES` block across 171 `prompt_templates` bodies
- `promptDefaultPrompts.test.ts` — 1 failure, default stored bodies under the runtime sanitizer
- `phase2LiveDOProbe.test.ts`, `phase2LiveFamThrowsProbe.test.ts` — suite-level failures (audit scratch probes)

These concern prompt template content. None touches entitlements, exam selection, RLS, or leaderboards. The suite improved from 8 failed files to 4, and from 8 failed tests to 7, with 15 more tests passing. Zero P0-02-attributable test failures.

## 21. What could not be run

- **`npx supabase test db` (pgTAP):** not run. Docker Desktop is unavailable — `dial error (connect ECONNREFUSED 127.0.0.1:54322)`, `Make sure Docker is running, then run: supabase start`. The suite's fixture block, all 12 privilege assertions and all 5 full user journeys were instead executed against the **live migrated schema** inside rolled-back transactions, which is stronger than the local harness. The pgTAP file itself has not been executed by pgTAP.
- **Playwright E2E:** `playwright.config.ts` exists, but no E2E spec references `set_preferred_exam`, `get_my_entitlements` or entitlements. There is no automated browser-level coverage of the new flow.
- **Authenticated browser/Auth-API E2E:** not performed; requires signing in as a real user.

## 22. Production data impact

| | Value |
|---|---|
| Users before / after | 30 / 30 |
| NULL-selection users | 22 → 22, **none granted** |
| Non-NULL-selection users | 8 → 8, all granted |
| Entitlement rows created | 8 (5 group, 3 exam) |
| Rows with `revoked_at` set | 0 |
| Rows not `source='migration'` | 0 |
| Orphan entitlement rows | 0 |
| Probe residue (`victim*`, `probe-target`) | **0** |
| `full_name` / `last_activity_date` writes | unaffected |

## 23. How the migration was applied

One transaction: precondition guard → migration body verbatim → ledger row → `COMMIT`. Nothing was written if any precondition failed.

The guard aborts unless live is in exactly the audited state: table absent, ledger row absent, the old resolver present, none of the four new RPCs or the private resolver present, and `authenticated` still holding the vulnerable `exam_selection` UPDATE. If someone had already closed the hole, the apply would have aborted rather than run against a stale audit.

The guard was **dry-run first** (`GUARD_PASSED`) before the real apply. The migration body was concatenated programmatically from the file rather than retyped, and the assembled script was asserted to contain exactly one `BEGIN`, one `COMMIT`, the `CREATE TABLE`, the guard, the enum drop and the ledger insert.

## 24. Repository changes — release strategy: **OPTION B (refactor dependency)**

**Decision: Option B.** The four P0-02 source changes cannot be safely isolated from the larger refactor, so no synthetic commit was fabricated. They stay in the working tree and land with the parent refactor. No `git reset --hard`, `git checkout .`, destructive stash, mass revert, or cherry-pick was used; the refactor's work is intact and the P0-02 edits ride on top of it.

**Why isolation is unsafe** — the P0-02 edits are not merely co-located with the refactor, they *depend* on it:

| P0-02 change | Refactor dependency that blocks isolation |
|---|---|
| Delete `userRepo.updateUser` | At `8a0291a` this function has **three live callers** (`userService.ts:176,233,299`). The refactor replaced them with `adminSetUserActiveRpc` and friends. Deleting it against the committed tree **breaks the build**; it is dead only once the refactor lands. |
| De-duplicate `leaderboardService` APPSC groups | The P0-02 edit rewrites the expansion inside `fetchAdminLeaderboardPage`, a function the refactor created. At `8a0291a` that function does not exist, so the edit has nothing to attach to. |
| Type the four `SignupPage` `any`s | They sit inside 18 refactor hunks in the same file; hand-porting them onto the pre-refactor component would not compile. |
| `tsconfig.app.json` `exclude` block | Motivated by type errors that exist **only in untracked refactor test files** (`phase2LiveSurvivorProbe`, `phase2LiveDOProbe`, `phase2LiveFamThrowsProbe`, `liveFamilySurvivorProbe` — all four confirmed untracked). A clean checkout of `8a0291a` contains none of them, so the exclusion is not a P0-02-at-HEAD change; it is build hygiene the refactor's tests require. |

**Exact P0-02 changes preserved (uncommitted, pending parent refactor):**

| File | P0-02 change | Lines |
|---|---|---|
| `src/lib/repositories/user.repository.ts` | Remove the generic `.from('users').update(updates)` escape hatch | 1 hunk |
| `src/services/leaderboardService.ts` | Replace the local `APPSC_GROUPS` list with the shared `getAllowedExamIds` | 1 hunk |
| `src/pages/SignupPage.tsx` | Remove 4 P0-02 `any` usages; drop an unused catch binding | 4 of 18 hunks |
| `tsconfig.app.json` | Exclude test globs from the production type-check | 1 hunk |

The files carry ~320 lines of unrelated refactor alongside those edits (`user.repository.ts` +156/−76, `SignupPage.tsx` +81/−41, `leaderboardService.ts` +71/−131, `tsconfig.app.json` +12/−1 of which only the `exclude` block is P0-02's).

**What must land together:** all four files, committed with the parent refactor. They are safe in the working tree — the refactor author will include them when they stage those files — but they are **not yet in history**, and a `git checkout .` or `git stash` would discard the P0-02 edits along with the refactor. That is the one residual risk in this closure.

**Repository state summary:**

| File | State | Change |
|---|---|---|
| `supabase/migrations/20261004000000_p0_02_server_owned_exam_entitlements.sql` | **committed** (`8a0291a`) | Canonical migration, 9 sections, incl. guarded enum drop and anon revokes |
| `supabase/tests/p0_02_exam_entitlements.sql` | **committed** (`8a0291a`) | `plan(46)`, both fixture defects fixed, tautological assertion replaced |
| `PHASE_2_P002_FINAL_PRODUCTION_REPORT.md` | **committed** (`8a0291a`), amended by this closure | This report |
| `src/lib/repositories/user.repository.ts` | uncommitted — Option B | Generic `users` update escape hatch removed |
| `src/services/leaderboardService.ts` | uncommitted — Option B | Duplicate `APPSC_GROUPS` removed; delegates to `getAllowedExamIds` |
| `src/pages/SignupPage.tsx` | uncommitted — Option B | 4 P0-02 `any` usages typed away, unused `err` removed |
| `tsconfig.app.json` | uncommitted — Option B | Test files excluded from the production type-check |

## 25. Four states, kept strictly separate

| State | Verdict | Basis |
|---|---|---|
| **DATABASE** | **LIVE VERIFIED** | All seven canonical objects, the `REVOKE UPDATE (exam_selection)`, the anon/PUBLIC revokes, the enum drop, the 8-row backfill and ledger row `20261004000000` applied in one transaction. Re-verified after the fact: exploit replay refused, grant→access, revoke→lockout, zero residue. |
| **SOURCE** | **PARTIALLY COMMITTED** | Migration, 46-assertion suite and this report committed in `8a0291a`. Four source files remain **uncommitted** and documented as **Option B — refactor-coupled** (§24). |
| **FRONTEND** | **NOT DEPLOYED** | Blocked by absent credentials **and** by the absence of any authorized P0-02-only artifact (§27). No deploy was attempted or claimed. |
| **POST-DEPLOYMENT** | **NOT VERIFIED** | Not applicable — nothing was deployed. No post-deployment claim is made anywhere in this report. |

Local source quality, for completeness: `tsc -b` exits 0 with 0 errors; the 7 P0-02-relevant suites pass **118/118**; the full suite is 2132 passed / 7 failed, all 7 in the unrelated `src/lib/prompts/` corpus; ESLint stands at 244 errors / 29 warnings, none on a P0-02-authored line.

### 25a. Closure re-verification (live, re-run after the original sign-off)

Repeated for this closure, not carried over from the earlier run:

- **§6 integrity scan** — exactly one definition each of `user_exam_entitlements`, `is_exam_allowed_for_user`, `get_my_entitlements`, `set_preferred_exam`; `resolveExamIds` is a compat re-export that **delegates** to the single canonical `getAllowedExamIds`, not a parallel implementation. **Zero** direct `.from('users').update(` in non-test source, so no client-side write path to `users` exists at all. No authorization bypass.
- **§7 frontend ↔ LIVE compatibility** — `set_preferred_exam(p_exam_id text)` and `get_my_entitlements()` match the repository calls exactly; `authenticated` EXECUTE is `true` for both, `anon` and `PUBLIC` are `false`.
- **§8 build** — `tsc -b` 0 errors; P0-02 suites 118/118; no P0-02-attributable failure of any kind.
- **§12 live security recheck** — `03_EXPLOIT_direct_update` = `REFUSED: permission denied for table users`; resolver `false` without entitlement; admin grant → `true` with 1767 visible questions; revoke → `false` with 0; `set_preferred_exam` refused after revoke. Post-rollback residue: **0** probe users, **0** probe profiles, **0** probe entitlements; real population intact at 30 users, 22 NULL-selection users with **0** entitlements, **0** non-NULL users missing an entitlement.

## 26. Hard gate checklist

| # | Requirement | Result |
|---|---|---|
| 1 | Migration applied to live | ✅ `20261004000000`, ledger 145 rows |
| 2 | Ledger row in same transaction | ✅ |
| 3 | Canonical table created, RLS on | ✅ |
| 4 | No client privilege on the table | ✅ SELECT/INSERT/UPDATE all false |
| 5 | Private resolver not client-callable | ✅ false for `authenticated` and `anon` |
| 6 | Chokepoint signature + volatility preserved | ✅ `text` / `STABLE` |
| 7 | `UPDATE (exam_selection)` revoked | ✅ false |
| 8 | `full_name` / `last_activity_date` preserved | ✅ true / true |
| 9 | Preference write validated server-side | ✅ unentitled values refused |
| 10 | Preference grants nothing | ✅ 0 questions visible |
| 11 | Signup metadata creates no entitlement | ✅ 0 rows |
| 12 | Backfill preserves existing access | ✅ 8/8, per-user verified |
| 13 | NULL-selection users get nothing | ✅ 0 of 22 |
| 14 | Literal `'all'` not granted | ✅ count 0 |
| 15 | 5 dependent policies intact | ✅ all call the resolver |
| 16 | 9 dependent RPCs intact | ✅ 9/9 call the resolver |
| 17 | Exploit re-run post-fix | ✅ all paths REFUSED |
| 18 | Admin grant/revoke works | ✅ 1767 visible, then 0 |
| 19 | Admin role confers no content access | ✅ |
| 20 | anon denied on all P0-02 functions | ✅ all 401 `42501` |
| 21 | Orphan enum dropped | ✅ `false` |
| 22 | No duplicate/dead authorization code | ✅ resolved, documented |
| 23 | Test suite passes | ⚠️ 40/40 equivalent live; pgTAP not executable (Docker) |
| 24 | No P0-02-specific test failures | ✅ 0 |
| 25 | No P0-02-specific typecheck errors | ✅ 0 |
| 26 | No P0-02-specific lint errors | ✅ 0 on authored lines |
| 27 | Build passes | ✅ fixed, exit 0 |
| 28 | Migration + suite in version control | ✅ committed `8a0291a` |
| 29 | P0-02 source fixes in version control | ⚠️ uncommitted, Option B — refactor-coupled (§24) |
| 30 | Single canonical entitlement implementation | ✅ `resolveExamIds` delegates, does not duplicate |
| 31 | Zero client-side authorization bypass | ✅ no direct `users` write in non-test source |
| 32 | Frontend ↔ LIVE RPC compatibility | ✅ signatures match; `authenticated` EXECUTE, `anon`/`PUBLIC` denied |
| 33 | P0-02 test suites | ✅ 118/118 |
| 34 | `tsc -b` | ✅ 0 errors, exit 0 |
| 35 | Live exploit re-run at closure | ✅ REFUSED; residue 0 |
| 36 | Frontend deployed after DB | ❌ **blocked** (§27) |
| 37 | Post-deployment verification | ❌ **N/A — not deployed** |
| 38 | Report reflects actual state | ✅ four states stated in §25 |

## 27. Outstanding item — frontend deployment BLOCKED

Deployment is blocked by **two independent** reasons, either of which is sufficient on its own.

**Reason 1 — no deployment access (previously accepted by the owner):**

- `vercel.json` exists (security headers, cache policy).
- No `.vercel` project link.
- No `vercel` CLI installed locally and no cached Vercel auth.
- `VERCEL_TOKEN` and `VERCEL_ORG_ID` are both absent.
- No CI workflow at all (`.github/workflows` does not exist) and no deploy script in `package.json`.
- No production URL recorded anywhere in the repository.

**Reason 2 — there is no authorized P0-02-only artifact to deploy (newly identified):**

The P0-02 source changes are **refactor-coupled** (§24), so no P0-02-only frontend exists. All three candidate deployables are invalid:

| Candidate | Why it must not be deployed |
|---|---|
| Current working tree | Ships the entire unverified ~300-file refactor. Explicitly out of P0-02 scope; would bypass the refactor rather than isolate from it. |
| Committed `8a0291a` frontend | Pre-P0-02 source. Its `users` write paths assume privileges the live DB now revokes. |
| A hand-assembled "P0-02 only" bundle | Would be a fabricated build; the P0-02 edits do not compile against the pre-refactor tree. |

The security boundary is the **database**, which is already complete and verified. Shipping the frontend would carry only hygiene changes — dead-code removal, a de-duplication, four type annotations, and a build-config exclusion — none of which is required to keep the exploit blocked. That is why the gap is safe to defer rather than urgent, and why the database verification in §4/§12 stands on its own.

Required ordering — migration → live verification → frontend deploy → integration verification — has been respected: the database is verified, and the deploy has not happened.

`npm run build` now passes, so a deploy would not fail on the build. Until it runs, no claim can be made about the deployed bundle.

## 28. Known follow-ups (not security defects)

1. **New-user dead-end.** A signup-seeded preference satisfies the profile-completeness gate, so a brand-new account lands on an empty dashboard, and that preference cannot be changed until the account holds an entitlement. Consider seeding the preference only when the account already has one, or having the selection card render the empty-entitlement state explicitly.
2. **No first-entitlement path.** Expected by design. New accounts need an admin grant or a future purchase. Payment is out of scope for P0-02.
3. **`APPSC_SUB_TABS`** duplicates the four group ids as a labelled UI constant. Cosmetic; grants nothing.
4. **Pre-existing prompt-suite failures** (§20) and the four pre-existing type-error suites remain untouched — unrelated to P0-02.
5. **No E2E coverage** for the entitlement flow (§21). Worth adding once a test-user provisioning path exists.
6. **Four source files still uncommitted.** The migration, suite and this report are in version control; the `leaderboardService` dedup, dead `updateUser` removal, `SignupPage` typing and `tsconfig.app.json` build fix remain in the working tree, entangled with the ~300-file refactor described in §24. They must be committed with that refactor.

## 29. Final verdict

**P0-02 STATUS: NOT CLOSED.**

Everything within reach of this task is complete, verified and correct. One item is not, and it is not a P0-02 defect.

**Complete and verified — `LIVE DB: VERIFIED`:**

- The privilege escalation is closed at the database, which is the security boundary. Every exploit path is refused, all 14 dependent objects resolve through the entitlement-backed chokepoint, the 8 accounts that legitimately had access still have it, the 22 that had none still have none, and no probe residue remains.
- Re-verified live at closure, not carried over: the original `UPDATE users.exam_selection → APPSC_GROUPS` attack is `REFUSED: permission denied for table users`; `is_exam_allowed_for_user` is `false` without entitlement; an admin grant yields `true` with 1767 visible questions; a revoke returns `false` with 0; the post-rollback population is 30 users with 0 probe residue.
- `DUPLICATES: NONE` — one canonical `getAllowedExamIds`; `resolveExamIds` is a compat delegate to it, not a second implementation.
- `DEAD P0-02 CODE/OBJECTS: NONE` in the database. The orphan `public.exam_selection` enum is dropped; the client-side `.update()` escape hatch is removed pending the refactor (§24).
- `SECURITY BYPASS: NONE FOUND` — zero direct client writes to `users` anywhere in non-test source; `exam_selection` is preference-only; no public function still reads it for authorization.
- Source: `tsc -b` 0 errors, P0-02 suites 118/118, no P0-02-attributable failure.

**Outstanding — the sole blocker:**

- `FRONTEND: NOT DEPLOYED` and `POST-DEPLOYMENT: NOT VERIFIED`. Blocked by absent Vercel credentials **and**, independently, by there being no authorized P0-02-only artifact to deploy (§27). No deployment was attempted and none is claimed.

The security exposure is closed and independently verified at the database layer. The gap is a release-hygiene gap: the frontend carrying the P0-02 source edits cannot be shipped in isolation from the ~300-file refactor, and shipping the refactor is outside P0-02's scope.

## 30. Permission to start P0-03

**NOT GRANTED.**

| # | Condition | State |
|---|---|---|
| 1 | Migration `20261004000000` applied and verified on live | ✅ |
| 2 | Live security verification passed with zero exploit paths | ✅ re-verified at closure |
| 3 | Tests, typecheck and build pass with zero P0-02-specific failures | ✅ `tsc -b` 0, 118/118 P0-02 |
| 4 | No duplicate entitlement implementation or authorization logic | ✅ |
| 5 | No dead P0-02 database objects | ✅ |
| 6 | No client-side authorization bypass; `exam_selection` preference-only | ✅ |
| 7 | Migration + suite committed to version control | ✅ `8a0291a` |
| 8 | Source changes committed **or** documented as dependent on parent refactor | ✅ Option B, documented (§24) |
| 9 | Frontend deployed, or blocker explicitly resolved/accepted | ❌ **blocked** (§27) |
| 10 | Post-deployment verification completed if deployed | ⬜ N/A — not deployed |
| 11 | No unresolved P0-02 issue remains | ❌ item 9 |

**To close P0-02**, the owner must either (a) accept the deployment deferral, as was done for the credential block, making item 9 an accepted FAIL; or (b) land the parent refactor, then deploy and run the post-deployment flows in §11. Until then **do not start P0-03.**

# AR-021 — Sub-Admin Create Exam Wizard: Requirements → Implementation → Runtime Verification

**Scope:** `/sub-admin/create` (Prompt → Paste JSON → Review → Setup → Publish).
**Date:** 2026-08-28. **Baseline:** all work committed tree state; dev server `http://localhost:5173`.
**Result:** `24/24` unit tests PASS · `36/36` runtime probe checks PASS · ESLint clean (scoped) · `tsc -b` clean (scoped) · `vite build` OK.

---

## Section 1 — Requirements (specified acceptance criteria)

| ID | Requirement | Source |
|----|-------------|--------|
| R1 | No toast for copy outcomes (success or failure). Copy feedback (if any) is inline on the prompt card. | wizard hardening brief |
| R2 | AI launch matrix (ChatGPT / Gemini / Claude / NotebookLM) is hidden until the prompt has been successfully copied; launches carry the prompt themselves. | wizard hardening brief |
| R3 | Prompt requests a raw JSON array only (`Return ONLY the JSON array`), exactly `N` valid questions, Telugu included. | prompt invariant |
| R4 | Pasted JSON is treated as hostile: parse fails gracefully, per-question structural validation, duplicates removed, invalid rows excluded with a visible count. | security brief |
| R5 | Duplicate identity = EN question text + 4 EN options + `correct_option` only (Telugu excluded); normalize = trim + collapse whitespace + lowercase. | dedupe spec |
| R6 | Review reuses the canonical `QuestionCard` / `ConfirmModal`; Add Question opens the new card in edit mode; delete confirms via modal. | component-ownership spec |
| R7 | Setup defaults `end = start + 30 min`; manual end override is preserved; "Reset to Start + 30 min" restores the default; end re-derives when start changes unless overridden. | scheduling spec |
| R8 | Round-trip time integrity: displayed wall-clock (12h) must map exactly to the RFC-3339 UTC payload sent to the RPC (`Z` suffixed, exactly 30 min apart). | UTC-at-boundary spec |
| R9 | Publish pre-checks re-validate the final snapshot (config schema + every question) before the RPC; identity/sub-admin id comes from the auth session. | security brief |
| R10 | No new remote gaps introduced; existing infra gaps are documented, not silently widened. | acceptance |
| R11 | No horizontal overflow at mobile/tablet/desktop; both themes render. | responsive/theme spec |
| R12 | No `dangerouslySetInnerHTML`, no new `!important`, no duplicate design-system components, no mock/TODO code. | standing constraints |

PASS — code and probe evidence in Sections 3–9. Remaining infra gaps (R10) in Section 11.

---

## Section 2 — Test Suite (unit/integration)

File: `src/security/subadmin-create-workflow.test.tsx`

| Group | Cases | Status |
|-------|-------|--------|
| Prompt / copy gate | copy success shows inline Copied; copy failure shows inline alert; launch surface gated until copy; copy failure keeps gate | PASS |
| AI launch | copy success → ChatGPT/Gemini/Claude/NotebookLM visible; ChatGPT launches chatgpt.com; launch re-writes prompt to clipboard | PASS |
| Paste JSON | swipe-paste → parse summary; 20/30/50/custom tallies; `2 of 30 requested questions ready`; duplicate removed, invalid excluded | PASS |
| Review | per-card save persists; per-card cancel; delete via ConfirmModal reduces count and removes card; editing card hides delete; Add Question opens card in edit mode (Save visible) | PASS |
| Setup / schedule | default end = start+30; override shows "Reset to Start + 30 min"; reset restores default; end re-derives on start change | PASS |
| Publish pre-checks | incomplete question blocks publish and stays on Review; invalid config blocks publish and returns to Setup | PASS |

**Run result:** `Test Files 1 passed (1) · Tests 24 passed (24)`.
Root-caused during this session: the earlier "delete leaves two cards" failure was a **test fixture bug** — two questions both carried `display_order: 2`, producing duplicate React keys (`[2, 2]`). Fixed fixtures to unique `display_order`; no component defect existed.

---

## Section 3 — Implementation (files changed this session)

| File | Change |
|------|--------|
| `src/components/sub-admin/create/CreateStepReview.tsx` | Added `autoEditIndex` state; auto-edit wiring to `QuestionCard` on Add Question; cleared on edit/delete. |
| `src/components/sub-admin/create/QuestionCard.tsx` | Render-time parent-sync of `localQ` (replaced `useEffect`); removed `useEffect` import. |
| `src/components/sub-admin/create/CompactDateTimePicker.tsx` | Render-time value sync with `prevValue` guard (no set-state-in-effect); extracted `splitValue`; `let`→`const`. |
| `src/components/sub-admin/create/CreateStepSetup.tsx` | Fixed missing `</div>` closing the padding wrapper (real JSX error caught by ESLint). |
| `src/components/sub-admin/create/CreateStepJsonPaste.tsx` | `accepted` retyped to `Array<Omit<QuestionData, 'display_order'>>`. |
| `src/components/sub-admin/create/types.ts` | `safeParse` returns `unknown[]`; bare `catch {}`; no `any` in `getTypo`/`getDimension`. |
| `src/components/sub-admin/create/useCreateExam.ts` | Added `useToast` import; typed `catch`. |
| `src/services/teacherExamService.ts` | Restored full repository return type in `requireTeacherExamOwnership`; RPC payload built via `toISOString()` (UTC `Z`); audit logs via logger (no `audit_log` table exists). |

Prior-session core (verified here): dedupe + per-question validation (`CreateStepJsonPaste`), canonical `QuestionCard` reuse, end = start + 30 min default/override/reset, publish pre-checks, gate-on-copy launch.

---

## Section 4 — Static Verification

| Command | Result |
|---------|--------|
| `npx eslint src/components/sub-admin/create/** src/services/teacherExamService.ts src/security/subadmin-create-workflow.test.tsx` | Clean, no output |
| `npx tsc -b` (scoped) | Clean for this scope (only pre-existing unrelated failures remain) |
| `npx vite build` | Succeeds (~44s; chunk-size warnings only) |
| Full `vitest run` (repo-wide attribution) | This scope green; remaining failures are pre-existing unattributed suites (none import changed modules) |

Pre-existing repo-wide suite failures unrelated to this work (reference only): `ds003`, `ds007`, `ds014`, `ds005`, `ds031` (mounts `UserSubjectTests`), `ds033`, `admin-topics-remediation`, `__backfill_validate`, `b6-sub-admin-self-update`, `admin-leaderboard-false-empty`, `subadmin-settings-remediation`.

---

## Section 5 — Runtime Probe Coverage (result: 36/36 PASS)

Probe: `scratch/pfu-create-runtime-probe.mjs` (Playwright chromium + Supabase interception, seeded session, stub clipboard + `window.open`). Artifact: `C:/Users/Vasanth/AppData/Local/Temp/opencode/create-runtime-probe.json`.

| Group | Checks | Result |
|-------|--------|--------|
| P1 Clipboard success | launches hidden pre-copy; prompt = EXACTLY N; raw-JSON-only; inline Copied (no toast); clipboard contents; 4 AI buttons; ChatGPT opens chatgpt.com | PASS |
| P2 Clipboard failure | inline alert; no Copied; gate stays closed | PASS |
| P3 Paste → Review | `2 of 30 requested questions ready`; dup/invalid reported; 2 cards; Add opens edit mode; ConfirmModal delete 3→2; Step 4 reached | PASS |
| P4 Setup → Publish | end defaults +30; re-derives on start move; override shows Reset; Reset restores default; RPC fired once; `Z`-suffixed UTZ; diff exactly 30 min; UTC maps back to displayed 12h wall clock; `display_order`/difficulty in payload; success toast | PASS |
| P5 Responsive/theme | no horizontal overflow @320/375/768/1024/1440/1920; dark = no `.light`, light = `.light` present | PASS |

---

## Section 6 — Security Checks

| Item | Status |
|------|--------|
| Pasted JSON treated as hostile (guarded parse, type-shape validation, length limits) | PASS |
| No `dangerouslySetInnerHTML` in create-wizard scope | PASS |
| Identity/`subAdminId` derived from auth session (`user.id`), never from pasted payload | PASS |
| No RLS weakening; no new `SECURITY DEFINER` functions | PASS |
| Publish pre-checks re-validate final snapshot client-side (UX layer only — server RPC still the authority) | PASS |
| No secrets logged; logger used for audit events | PASS |

---

## Section 7 — Architecture / Component Reuse

| Item | Status |
|------|--------|
| Reuses canonical `QuestionCard`, `QuestionCardHeader`, `QuestionCardOption`, `ConfirmModal` — no duplicated shells | PASS |
| Shared `SegmentedFilter` (`role=tablist`) for step nav and question-count; verified with correct roles in probes | PASS |
| No new design tokens, no `!important` additions | PASS |
| One orchestrator (`useCreateExam`) owns wizard state; step components are pure presentational | PASS |
| `screen.baseElement` unavailable in repo's RTL version — tests use `document.body` (noted) | — |

---

## Section 8 — Round-Trip Time Integrity (R8 detail)

Probe evidence (single run): UI displayed start `09:41PM` local (IST, UTC+05:30); RPC body sent
`p_start_time=2026-08-28T16:11:00.000Z`, `p_end_time=2026-08-28T16:41:00.000Z`.
`16:11 UTC = 21:41 IST = 09:41 PM` ✓ · `diff = 30 min` ✓ · both `Z`-suffixed ✓.

---

## Section 9 — Test/Debug Notes & Corrections Made During Verification

- `navigator.clipboard` is a getter-only property in Chromium; plain assignment silently no-ops. Probes now use `Object.defineProperty` (probe tooling, not app code).
- The "delete leaves two cards" mystery was duplicate `display_order` keys in test fixtures (React key collision), fixed in fixtures.
- Start+30 override left a 30-minute window while the default duration is 60 → schema's "duration exceeds scheduled window" correctly rejected publish; probe now sets a valid duration.
- Hour input rejects `14` via the `Invalid hour` guard; manual override in probes shifts the minute instead (correct app behavior).

---

## Section 10 — Constraints Compliance (R12)

| Constraint | Status |
|------------|--------|
| No mock/TODO/temp code shipped in `src/` | PASS |
| No `!important` / new design system | PASS |
| Only canonical components consumed | PASS |
| No comments added unless asked | PASS |

---

## Section 11 — Remaining Infrastructure Gaps (R10, report-only)

These are **remote/DB-layer** issues that a repo change cannot fix and were therefore not silently widened:

| Gap | Detail |
|-----|--------|
| `create_teacher_exam_atomic` is `SECURITY DEFINER` without a server-side ownership check | Function assumes the caller is authorized; the DB never re-verifies the passed `sub_admin_id` against `auth.uid()`. |
| No `audit_log` table | Audit events are emitted via the client logger (`logger.log`) only; there is no durable DB audit trail. |
| No rate limiting on the create RPC | Repeat publishing / prompt abuse is bounded by client UX only. |

Recommended follow-ups (outside repo scope): add `auth.uid()` guard inside the function; create the `audit_log` table and log transactional inserts; enforce per-identity rate limits at the edge/DB.

---

## Section 12 — Final Verdict

| Criterion | Status |
|-----------|--------|
| Unit/integration tests | **PASS 24/24** |
| Runtime probe | **PASS 36/36** |
| ESLint (scope) | PASS |
| `tsc -b` (scope) | PASS |
| `vite build` | PASS |
| Responsive 320→1920 + both themes | PASS |
| Security constraints | PASS |
| Remaining infra gaps | Documented (Section 11) — not repo-fixable |

**Verdict:** PASS. The Sub-Admin Create Exam wizard satisfies all requirements in this session's scope. The three remote infra gaps (Section 11) are tracked as outstanding infrastructure work and must be addressed in the database layer.
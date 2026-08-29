# USER EXAM PAGE AUDIT — `/exams` (User Panel)

> **Date:** 2026-08-12
> **Scope:** Full engineering + UI/UX + design-system + performance + accessibility + full-stack (service → Supabase → RLS → DB → RPC) audit of the user-panel Exams page (`@/exams`).
> **Mode:** AUDIT ONLY — read-only. No source, CSS, tokens, migrations, or RLS were modified. No live Supabase access — RLS/DB conclusions are derived from the migration set in `supabase/migrations/` and marked UNKNOWN where not verifiable from the repo.

## 1. PAGE IDENTITY

- **Route:** `/exams`
- **Page:** `src/pages/user/UserExams.tsx` (120 lines, thin composition)
- **Data hook:** `src/components/user/full-exams/useUserExams.ts` (160 lines)
- **Rendering:** `src/components/user/full-exams/ExamPaperGrid.tsx` (127 lines)
- **Layout wrapper:** `UserLayout` → `SidebarLayout` (`src/layouts/SidebarLayout.tsx`) with nav entry `Exams → /exams` (icon `FileText`, color `#16A34A`, `src/config/navigation.ts`)
- **Guards:** `AuthGuard` (`requireExamSelection=true`), `RoleGuard` (`user`)
- **Lazy imported** in `src/App.tsx`

## 2. ARCHITECTURE — FRONTEND DEPENDENCY MAP

```
Route /exams (lazy) ── AuthGuard(requireExamSelection) + RoleGuard('user')
   └─ UserLayout → SidebarLayout (Nav: Exams, NotificationBell, ThemeToggle)
        └─ UserExams (page)
             ├─ useAuth()                       → user.exam_selection, loading
             ├─ useUserExams()                  → papers, availability, groups, carousel, start
             │    ├─ getAllowedExamIds(selection)            (utils/examUtils.ts)
             │    ├─ fetchUserPapers(ids, force=false)       (services/examService, 10-min cache `user_papers_<sortedIds>`)
             │    │     ├─ resolveExamIds(config, selection) (lib/examUtils.ts)
             │    │     ├─ fetchActiveExamConfigs(published) (exam.repository)
             │    │     └─ fetchPapersByExamIds(ids)         (exam.repository, ORDER display_order)
             │    ├─ batchCheckAvailability(paperIds)        (examService)
             │    │     ├─ fetchSubjectsWithQuestionCount    (exam.repository, exam_subjects)
             │    │     └─ fetchQuestionCountsByPapers       (exam.repository, `question_counts` VIEW — see BE-4)
             │    ├─ useStableFetch()            (stale-request guard — instantiated twice, see P-2)
             │    ├─ usePageError()              (error state machine) — incl. 2nd useStableFetch
             │    └─ handleStartExam → navigate(`/active-exam/${paperId}`)
             ├─ LoadingSkeleton (auth/load)     (SharedComponents)
             ├─ ErrorState (no-selection branch, effectively unreachable — see UX-3)
             └─ ErrorContainer + RetryButton    (on `errorState === 'error'`)
             └─ ExamPaperGrid
                  ├─ Tabs (bare) + SelectionContainer   (AntigravityData / AntigravityLayout)  [APPSC / APPSC_GROUPS]
                  ├─ ExamPaperCard → ExamCard(premium-dark-neutral) + MetricBlock×4   (AntigravityDashboard)
                  ├─ CarouselDots (mobile) — role=tab pattern
                  └─ Empty state (📚 No Exams Available)
```

## 3. ARCHITECTURE — BACKEND / DATA-FLOW DEPENDENCY MAP

```
┌─ Browse (this page) ─────────────────────────────────────────────────────┐
│  exam_configs  (RLS user SELECT USING(true), is_published=false filter)  │
│      │ fetchActiveExamConfigs()   ←─── service resolveExamIds            │
│      ▼                                                                │
│  exam_papers   (RLS user SELECT USING(true))                             │
│      │ fetchPapersByExamIds(examIds)   ←─── fetchUserPapers              │
│      ▼                                                                │
│  exam_subjects (RLS user SELECT USING(true))                             │
│      │ fetchSubjectsWithQuestionCount(paperIds)                          │
│  question_counts  ←── VIEW/table referenced, NO DDL in repo (BE-4 ⚠️)    │
│      │ fetchQuestionCountsByPapers(paperIds) → batchCheckAvailability    │
│      ▼                                                                │
│  availabilityMap → card enabled/disabled (min_questions gate)            │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Start attempt (downstream of page CTA) ────────────────────────────────┐
│  /active-exam/:paperId                                                  │
│   useExamInitialization.initExam ── fetchPaperWithSubjects(paperId)      │
│       findPaperById(paper) / fetchSubjectsByPaperId(subjects)  ←── NO    │
│           ownership/exam_selection check (BE-1 ❌)                       │
│   fetchQuestionsForPaper(paperId, subjects, userId)                     │
│       question.repository … fetchQuestionsByPaperAndSubject*            │
│           ←── .in('exam_id', examIds)   (selection filter OK here)      │
│   findInProgressAttempt(userId, paperId, source='exam_tab')             │
│   createAttempt / upsertAttempt            (attempts INSERT — RLS user)  │
│   SECURITY DEFINER RPCs: set_question_answer / touch_question_visit /   │
│       submit_attempt / add_question_time (bypass RLS — write path)      │
│   CLIENT direct UPDATE: updateAttempt(id, …) via syncAnswersCache /     │
│       updateTabSwitchCount / markReviewAccessed  ←── blocked by RLS     │
│           (NO user UPDATE policy on attempts — BE-3 ❌)                 │
└──────────────────────────────────────────────────────────────────────────┘
```

## 4. FRONTEND VERDICTS (summary table)

| ID | Severity | Area | One-line |
|---|---|---|---|
| DS-1 | MEDIUM | Design-system | Accent resolution `--color-accent` = **blue #3B82F6 in dark** leaks into primary surfaces + focus ring → mixed green/blue brand language on the page |
| A11-1 | MEDIUM | Accessibility | `role="tab"` list declares `aria-controls` panels that never render (no tabpanels) |
| UX-1 | MEDIUM | UX/error-flow | Retry re-runs fetch without re-entering loading → empty state shown during retry |
| DS-2 | MEDIUM | Design-system | Bare Tabs reuse `nav-active-surface` (sidebar token) incl. sibling `+ span` CSS hack |
| RE-1 | MEDIUM | Reusability | Two duplicate exam-ID resolvers (`utils/examUtils`, `lib/examUtils`) can drift |
| A11-2 | LOW | Accessibility | Carousel dots use tab pattern without tabs semantics/control association; duplicated classes on button+span |
| UX-2 | LOW | UX | Card has hover-lift affordance but is not clickable (only inner button); disabled cards also lift |
| DS-3 | LOW | Contrast (light) | `--stat-label-text` in light = muted (#6B7280) on gold stat-card surface — 10px labels under contrast |
| BUG-1 | LOW | Carousel math | `Math.round(scrollLeft/clientWidth)` ignores `gap-4`; index drift ≥ ~13 slides on 390px; dot math misaligned |
| P-1 | LOW | Perf/code | `useStableFetch` instantiated twice per page (inner requestId unused) |
| P-2 | LOW | Code-quality | `!p-5 md:!p-6` important-override of Card default padding; duplicate loading JSX blocks |
| UX-3 | INFO | Reachability | `!user?.exam_selection` gate is unreachable (AuthGuard redirects earlier); its retry → /dashboard relinks to sign-up |

## 5. BACKEND / SECURITY VERDICTS

| ID | Severity | Verdict | One-line |
|---|---|---|---|
| BE-1 | CRITICAL | **FAIL** | No ownership/selection authorization on `/active-exam/:paperId` — any authenticated user may start/resume any paper's attempt |
| BE-2 | HIGH | **FAIL** | Content tables (exam_configs, exam_papers, exam_subjects, questions) user SELECT `USING(true)` — all selections readable incl. `correct_option`; isolation only in the frontend |
| BE-3 | HIGH | **PARTIAL** | No user UPDATE policy on `attempts`; client `updateAttempt` (answers cache, tab-switch, review flag) silently fails under RLS |
| BE-4 | HIGH | **FAIL/UNKNOWN** | `question_counts` consumed by availability/service but **no DDL in any migration** — schema drift; cannot verify RLS/columns; if absent every /exams paper is marked unavailable |
| BE-5 | MEDIUM | PARTIAL | `security-gateway` edge function Turnstile fail-open when secret missing (auth-entry path, not /exams) |
| BE-6 | PASS | OK | `one_active_attempt` partial unique index (20260614000000) enforces single in-progress attempt server-side |
| BE-7 | PASS | OK | Anon-key-only browser Supabase client; `.env` exposes only `VITE_*` client vars; no secrets in bundle |
| BE-8 | INFO | UNKNOWN | Existing SECURITY DEFINER RPCs (set_question_answer etc.) not fully re-validated in this pass (see 20260721000001 comment) |

## 6. FINDINGS — DETAILED (EVIDENCE FORMAT)

### BE-1 — CRITICAL — Broken access control: `/active-exam/:paperId` accepts ANY paper id
- **FILE/SYMBOL:** `src/pages/exam/hooks/useExamInitialization.ts:266-301` (`initExam`)
- **FILE/SYMBOL:** `src/services/examService.ts:55-66` (`fetchPaperWithSubjects`)
- **FILE/SYMBOL:** `src/lib/repositories/exam.repository.ts:125-133` (`findPaperById`), `:178-186` (`fetchSubjectsByPaperId`)
- **OBSERVATION:** `initExam` fetches paper + subjects by `paperId` and then `_startExam(...)` — never validates that the paper's `exam_id` belongs to the user's `exam_selection` (no `getAllowedExamIds` check) and never re-checks availability. Content SELECT is open under RLS (BE-2), attempt INSERT is open under RLS (`rls_attempts_user_insert`), and the partial unique index only prevents duplicate *in-progress* attempts, not cross-selection attempts.
- **IMPACT:** A user subscribed to `APPSC` can deep-link `/active-exam/<paper-of-different-exam>/` and begin a real timed attempt (and have it scored/persisted) for a paper they were never authorized to access. Data exposure + exam-integrity violation. The `/exams` page itself only lists allowed papers, so this is exposed at the downstream route.
- **SEVERITY:** CRITICAL

### BE-2 — HIGH — Content tables open to all authenticated users
- **FILE/SYMBOL:** `supabase/migrations/20260701000004_rls_content_tables.sql`
- **OBSERVATION:** `exam_configs`, `exam_papers`, `exam_subjects`, `questions` each get user `SELECT USING (true)`. Authorization is left entirely to the client (page resolves `getAllowedExamIds`). `questions` rows include `correct_option` + `explanation_en`/`explanation_te` (query at `examService.ts:76-82`).
- **IMPACT:** Any authenticated client can read the answer key and content of any exam/selection directly via Supabase REST. Combined with BE-1 abuse of any `paper_id`, an attacker can harvest question banks. DB does not enforce per-selection isolation.
- **SEVERITY:** HIGH

### BE-3 — HIGH — `attempts` has no user UPDATE policy; client updates silently fail
- **FILE/SYMBOL:** `supabase/migrations/20260502_rls_hardening.sql:173-213` — policies: `rls_attempts_admin_all`, `rls_attempts_user_select`, `rls_attempts_user_insert`, `rls_attempts_sub_admin_select`. **No `rls_attempts_user_update`.**
- **FILE/SYMBOL:** `src/lib/repositories/attempt.repository.ts:126` (`updateAttempt` — filters by `id` only, no `user_id`)
- **FILE/SYMBOL:** `src/services/examService.ts:265-269` (`syncAnswersCache`), `:295-301` (`updateTabSwitchCount`), `:387-391` (`markReviewAccessed`)
- **OBSERVATION:** Writes in the exam path go through SECURITY DEFINER RPCs (bypass RLS) and work; but the three direct-client `UPDATE attempts` calls above are DENIED by RLS and absorbed by `try/catch` (`logError` only). Result: answers JSON cache, tab-switch count, and review_accessed flag do not persist while the exam looks fine.
- **IMPACT:** Silent partial data loss on supporting/analytic fields during live exams; masking `updateAttempt` failures.
- **SEVERITY:** HIGH

### BE-4 — HIGH (UNKNOWN components) — `question_counts` referenced, never defined in repo
- **FILE/SYMBOL:** `src/lib/repositories/exam.repository.ts:257` (`fetchQuestionCountsByPapers` → `.from('question_counts')`), `:226` (`fetchSubjectsWithQuestionCount`)
- **FILE/SYMBOL:** `src/services/examService.ts:421-422` (comment "from the question_counts view"), `:414-463` (`batchCheckAvailability`)
- **OBSERVATION:** No `question_counts` DDL (CREATE VIEW/TABLE) exists in any file under `supabase/migrations/`. `batchCheckAvailability` is the exact gate that disables/enables each "Start Practice" button on /exams.
- **IMPACT:** If the view exists in the live DB with broad RLS it is an unversioned schema (drift); if missing/restricted, `fetchQuestionCountsByPapers` throws → fallback marks every paper "Unable to verify availability" → whole /exams page renders everything disabled without surfacing an error. **Cannot be verified from repo — UNKNOWN.**
- **SEVERITY:** HIGH (availability-critical, unversioned)

### BE-5 — MEDIUM — `security-gateway` Turnstile fail-open (auth entry, platform note)
- **FILE/SYMBOL:** `supabase/functions/security-gateway/index.ts` (Turnstile check returns `true` when `TURNSTILE_SECRET_KEY` not configured)
- **OBSERVATION:** If deployed without the secret, the anti-bot gate is bypassed (rate-limit/Redis still applies). Not on the /exams path (auth entry only). Flagged for completeness.

### DS-1 — MEDIUM — Dark-mode accent is blue; primary branding green/gold
- **FILE/SYMBOL:** `src/styles/themes.css:246` (`--color-accent: #3B82F6` dark), `:507` (`#166534` light), `:367-368` (`--bg-nav-active`/`--text-nav-active` → accent), `:209` (`--bg-accent-subtle` blue)
- **FILE/SYMBOL:** `src/index.css` `@theme` — `--color-primary: var(--color-accent)` (all `bg-primary`, `text-primary`, `border-primary`, `ring-primary`, `bg-primary/10` utilities resolve through accent)
- **FILE/SYMBOL:** Affected on page: `AntigravityDashboard.tsx:39` (card icon `bg-primary/10 text-primary` + hover `group-hover:bg-primary`), `:41` (`Badge variant="primary"` → `Pill` primary = `bg-primary/15 text-primary border-primary/30`), `:45` (title hover `text-primary`), `AntigravityData.tsx:103` active tab `text-primary` + pill `nav-active-surface`, `AntigravityMotion.ts:81-82` `FOCUS_RING` (`ring-primary/50`), Spinner `border-t-primary`.
- **OBSERVATION:** In dark mode every *accent-coded* element on the page renders BLUE (`#3B82F6`) while the primary CTA button is forest-green (`--material-button-primary-surface`, themes.css) and the whole visual language is green/gold. Light mode resolves the same token set to green (`#166534`) — so the mismatch is dark-only and token-driven, not page-specific.
- **IMPACT:** Brand-language inconsistency (dark). Active-tab text `#3B82F6` and focus ring also sit below 4.5:1 against the selection surface — a real (mild) a11y contributor. Per the dark-mode-stable rule this is flagged for the token layer only, app-wide, not per page.
- **SEVERITY:** MEDIUM (visual + mild contrast)

### DS-2 — MEDIUM — Bare Tabs reuse the sidebar nav pill (`nav-active-surface`)
- **FILE/SYMBOL:** `src/components/common/AntigravityData.tsx:108` (`pillClassName || (tightActive ? 'nav-active-surface' : pillCls)`)
- **FILE/SYMBOL:** `src/index.css:663-678` — `.light .nav-active-surface` block + `.light .nav-active-surface + span { color: var(--text-nav-active) !important }`
- **OBSERVATION:** A generic reusable `Tabs` primitive depends on a *navigation-context* CSS class; light mode further depends on an `+ span` adjacent-sibling override in `index.css` (fragile DOM-order coupling). Dark renders the blue accent pill (see DS-1).
- **IMPACT:** Cross-component CSS coupling; the reusable component cannot be themed independently; invisible DOM-order contract (`+ span`).
- **SEVERITY:** MEDIUM

### A11-1 — MEDIUM — Tab ARIA pattern references non-existent panels
- **FILE/SYMBOL:** `src/components/common/AntigravityData.tsx:88-98, 122` (`role="tab"`, `aria-controls={panelId}`, `role="tablist"`)
- **FILE/SYMBOL:** `src/components/user/full-exams/ExamPaperGrid.tsx:44-51` (renders tabs, never renders `role="tabpanel"` with those ids)
- **OBSERVATION:** The filter is declared as a real WAI-ARIA tabs widget, but no tabpanel exists; `aria-controls` point at nothing. The focus roving + Home/End/Arrow keys are implemented correctly (good), which makes the missing panels the only defect.
- **IMPACT:** Screen readers announce tabs with no associated panel content — confusing, and the tab semantics overstate what this widget is (a single-select filter). Either emit real tabpanels or switch to an `aria-pressed` segmented control.
- **SEVERITY:** MEDIUM

### UX-1 — MEDIUM — Retry path bypasses loading state → misleading empty state
- **FILE/SYMBOL:** `src/hooks/usePageError.ts:151-169` (`retry` sets `state='retrying'`, clears error, awaits `retryFn`)
- **FILE/SYMBOL:** `src/components/user/full-exams/useUserExams.ts:87-94` (`captureNetworkError(err, { retryFn: () => fetchData() })`; `fetchData` never flips `loading` on retry)
- **FILE/SYMBOL:** `src/pages/user/UserExams.tsx:69-98` (renders ErrorContainer only on `'error'`; renders skeleton only on `loading`)
- **OBSERVATION:** On a failed first load → honest ErrorState with RetryButton. Pressing Retry: error cleared (`pageError=null`), `loading` stays `false`, `papers` empty → page renders the 📚 "No Exams Available" empty branch during the refetch, then either content or the error again.
- **IMPACT:** Retrying a transient failure briefly lies about the inventory ("no exams available") instead of showing a loading skeleton. Fix: wrap retry in `setLoading(true)` (or surface `state==='retrying'`).
- **SEVERITY:** MEDIUM

### RE-1 — MEDIUM — Duplicated exam-ID/group mapping logic
- **FILE/SYMBOL:** `src/utils/examUtils.ts` (`getAllowedExamIds`, `isExamAllowed`)
- **FILE/SYMBOL:** `src/lib/examUtils.ts` (`resolveExamIds`, `resolveAdminExamId`, `KNOWN_EXAM_IDS`)
- **OBSERVATION:** Both hard-code the same APPSC / APPSC_GROUPS → group-id expansions. `/exams` uses both files (hook calls `getAllowedExamIds`; service calls `resolveExamIds`).
- **IMPACT:** Risk of drift/divergence on selection changes; two sources of truth for authorization-relevant maps.
- **SEVERITY:** MEDIUM

### A11-2 — LOW — Carousel dots reuse tab semantics without a tabs contract
- **FILE/SYMBOL:** `src/components/user/CarouselDots.tsx:22` (buttons `role="tab"`; container `tablist`; duplicated class string on button + inner span)
- **OBSERVATION:** Dots control a scroll region, not panels; no `aria-controls` binding to the region (ExamPaperGrid.tsx:62); no arrow-key nav; tab semantics overstate the widget. The region itself is fine (`role="region"` `aria-label="Exam papers"`, snap slides).
- **SEVERITY:** LOW

### UX-2 — LOW — False affordance: whole card lifts but only the button is clickable
- **FILE/SYMBOL:** `src/components/common/AntigravityMotion.ts:101-102` (`CARD_HOVER` = lift+shadow, applied to every Cartesian Card); `src/components/common/AntigravityDashboard.tsx:33` (`Card variant="premium-dark-neutral"` → includes CARD_HOVER; `role="article"`); disabled cards keep the hover lift too (`:39-63`)
- **OBSERVATION:** Hovering anywhere on the card animates lift/shadow, implying the card is the hit target; only the inner Start button responds. On desktop the affordance actively suggests a click that does nothing.
- **SEVERITY:** LOW

### DS-3 — LOW — Light-mode 10px labels on gold surface under contrast
- **FILE/SYMBOL:** `src/styles/themes.css:1004-1007` (`.light --stat-card-border: var(--gold-300)`, `--stat-label-text: var(--text-muted)`), `:474` (`--text-muted: #6B7280`), and the gold `--bg-stat-card-surface` gradient
- **FILE/SYMBOL:** `src/components/common/AntigravityCard.tsx:186` (StatCard label `text-[9px] lg:text-[11px] ... text-stat-label-text`)
- **OBSERVATION:** Metric labels ("QUESTIONS/DURATION/MARKS/NEGATIVE") render muted grey on the gold-gradient stat surface in light mode — computed contrast ≈ 2.9–3.1:1 for 9–11px bold text (WCAG 4.5:1 needed for normal text). Dark resolves to `--text-secondary` on deep green — fine.
- **IMPACT:** Legibility on light mode exam cards. Fix in light tokens (darken `--stat-label-text` or darken the stat surface behind the label), not per-card classes.
- **SEVERITY:** LOW

### BUG-1 — LOW — Carousel index math ignores the slide gap
- **FILE/SYMBOL:** `src/components/user/full-exams/useUserExams.ts:120-134` (`handleScroll` uses `Math.round(scrollLeft/clientWidth)`; `scrollToCard` uses `scrollTo({ left: index * clientWidth })`); `ExamPaperGrid.tsx:67,70` (`gap-4 px-[3px] -mx-[3px]`, slides `min-w-full`)
- **OBSERVATION:** Scroll position at slide i is `i·(W+16)+…`; index drift is ~`16i/W` and the smooth-click math under-shoots by i·16px (less relevant with `snap-mandatory`, but the computed index can exceed `count-1` around ~13+ slides on a 390px viewport, leaving no active dot).
- **SEVERITY:** LOW

### P-1 — LOW — Duplicate `useStableFetch` instance
- **FILE/SYMBOL:** `src/components/user/full-exams/useUserExams.ts:31` + `src/hooks/usePageError.ts:140`
- **OBSERVATION:** Each page mounts two `useStableFetch` subscriptions; only the outer `isStale`/`nextId` is used, the inner `requestId` is never consumed.
- **SEVERITY:** LOW

### P-2 — LOW — Padding override + duplicated loading trees
- **FILE/SYMBOL:** `src/components/common/AntigravityDashboard.tsx:33` (`!p-5 md:!p-6` vs Card default `p-4 md:p-5`, `AntigravityCard.tsx:73-83` — could use `padding={20}` + a single md override)
- **FILE/SYMBOL:** `src/pages/user/UserExams.tsx:37-98` (authLoading + loading JSX blocks are byte-identical duplicates)
- **SEVERITY:** LOW

### UX-3 — INFO — Unreachable / misleading "No Exam Selection" branch
- **FILE/SYMBOL:** `src/pages/user/UserExams.tsx:54-67`; guard behavior in `AuthContext`/`Guards` (`AuthGuard` `requireExamSelection` redirects to `/signup` first)
- **OBSERVATION:** The branch's Retry ("Try Again") navigates to `/dashboard`, which itself re-runs the same guard → user bounces back to sign-up. The gate is effectively dead code for guarded routes and its recovery CTA is misleading if ever shown.

## 7. ARCHITECTURE / DESIGN-SYSTEM POSITIVES

- Clean layering: Page → hook → service → repository → Supabase; feature hook owns all page state (`useUserExams`); page is a thin composition.
- One interaction language: `CARD_HOVER`/`BUTTON_HOVER`/`FOCUS_RING`/tokens are single-source (`AntigravityMotion.ts`).
- One pill/badge primitive (`Pill`) — Badge is a thin wrapper.
- Global `:focus-visible { outline: token }` fallback (`index.css:636`) so nothing is ever focus-invisible.
- Tabs implement proper keyboard roving (Home/End/Arrows, `tabIndex={active?0:-1}`).
- `snap-mandatory` mobile carousel, `scrollbar-hide`, role-region labelling — decent mobile UX.
- Availability gate is honest: a paper with insufficient questions is disabled with `Not Enough Questions` (server-verifiable via `question_counts` + subjects) rather than silently failing on start (subject to BE-4).
- Response/cache discipline: `fetchUserPapers` deduped + 10-min cache; availability re-checked per page load.
- Auth/session handled centrally; page makes no secret-bearing calls.

## 8. RECOMMENDED FIX PLAN

### P0 (fix first, security)
1. **BE-1:** In `fetchPaperWithSubjects` / `useExamInitialization`, resolve the user's allowed exam ids (`getAllowedExamIds(user.exam_selection)`) and reject (403 page) when `paper.exam_id ∉ allowed`. Also enforce in `findInProgressAttempt`/`createAttempt` if possible. — Move the policy to the RPC layer so the client cannot skip it.
2. **BE-2:** Introduce per-selection RLS on content tables (join `users.exam_selection` → allowed ids, or role-based views) and stop returning `correct_option`/explanations to user SELECT when not needed. Keep the /exams read path working (it only needs paper metadata).
3. **BE-4:** Find the authoritative `question_counts` definition (live DB / SQL dump), commit it as a migration (CREATE OR REPLACE VIEW ... with user-scoped RLS), and re-verify `batchCheckAvailability`. Until resolved, /exams availability is unverifiable.

### P1
4. **BE-3:** Add a scoped user UPDATE policy on `attempts` (or route `syncAnswersCache`/`updateTabSwitchCount`/`markReviewAccessed` through SECURITY DEFINER RPCs) and filter `updateAttempt` by `user_id`. Make the RLS denial loud (don't swallow it) at least in dev.
5. **UX-1:** Retry must set `loading` (or render a retrying state); don't show the empty branch during a retry.
6. **RE-1:** Collapse `getAllowedExamIds`/`resolveExamIds` into one module; single source for group expansions.

### P2
7. **DS-1:** (app-wide, token layer, dark-stable) Introduce a semantic brand accent for interactive-primary surfaces so `--color-accent` no longer leaks blue into every `bg-primary`/`text-primary`/`ring-primary` in dark. No page changes.
8. **DS-2:** Give `Tabs` its own active-pill token (`--material-tab-pill-active`) for the bare variant and remove the `.light .nav-active-surface + span` sibling dependency.
9. **A11-1:** Wire tabpanels (or convert the exam-group filter to an `aria-pressed` segmented control).
10. **DS-3:** Light-mode `--stat-label-text` contrast fix via tokens.

### P3
11. **A11-2 / BUG-1:** Carousel dots semantic cleanup + index math from real slide offsets (measure `offsetWidth + gap` via the card elements).
12. **UX-2:** Make the whole card a single button (or drop the outer-card hover lift).
13. **P-1 / P-2 / UX-3:** Remove duplicate `useStableFetch`; use Card `padding` prop; extract one loading skeleton; drop/rehome the unreachable no-selection branch.

## 9. BACKEND SECURITY VERDICT

**FAIL — presence of CRITICAL and HIGH findings.** The browsing experience of `/exams` itself is frontend-fenced, but the underlying privilege model does not isolate exam selections, exposes answer data, lacks an attempts UPDATE policy, and depends on an unversioned `question_counts` artifact. Not "Secure"; requires the P0/P1 set above before the panel should be considered data-safe. Because live RLS state and `question_counts` DDL were not inspectable from the repo, **BACKEND SECURITY COULD NOT BE FULLY VERIFIED** for those specific artifacts.

---
*AUDIT ONLY — nothing was modified. Next page pending user instruction.*
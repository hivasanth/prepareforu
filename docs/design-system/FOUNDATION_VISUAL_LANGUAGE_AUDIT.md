# FOUNDATION_VISUAL_LANGUAGE_AUDIT

- **Phase:** 3.7/V — Visual Language Audit (Tasks 11–22)
- **Status:** AUDIT COMPLETE (read-only) 2026-08-07 — evidence recorded; implementation deferred to Foundation-first phases
- **Governing rule (FINAL RULE):** if a problem can be solved once in the Foundation, it MUST NOT be solved in pages. Page implementations fix page-specific issues only; everything else evolves in the Foundation first.
- **Scope:** Card Layout (T11), Container (T12), Section Layout (T13), Icon (T14), Statistics (T15), Empty State (T16), List Item (T17), Premium Theme (T18), Light Mode Refinement (T19), Responsive (T20), Visual Polish (T21), Future-Proof Rules (T22).
- **Companion specs:** `FOUNDATION_CARD_LANGUAGE.md`, `FOUNDATION_CONTAINER_LANGUAGE.md`, `FOUNDATION_STATISTICS_LANGUAGE.md`, `FOUNDATION_EMPTY_STATE_LANGUAGE.md`, `FOUNDATION_ICON_LANGUAGE.md`, `FOUNDATION_LIGHT_MODE_REFINEMENT.md`, `FOUNDATION_VISUAL_POLISH_REPORT.md`, `FOUNDATION_GLOBAL_RECOMMENDATIONS.md`, `FOUNDATION_CONSUMER_MIGRATION_PLAN.md`, `FOUNDATION_CERTIFICATION.md`.

---

## 1. Method

Read-only repository audit of `src/**` (styles, Foundation components, pages, feature components)
against the certified Foundation primitives and the 12 audited languages (11–22). Evidence is
cross-referenced to `themes.css` semantic tokens, the frozen foundation components
(`AntigravityCard`, `CollectionCard`, `AntigravityLayout`, `Typography`, `Pill`, `Skeleton`,
`SharedComponents` EmptyState/ErrorState, `AntigravityResults`), and prior certified specs
(DS-016…DS-020). No source mutation.

---

## 2. Executive findings

The Foundation is **strongly and consistently token-driven**: Card surfaces (DS-020), Typography
roles (DS-016), Pill (DS-017), Hover & Motion (DS-018), Skeleton & Loading (DS-019), and the
`.light` brightness refinement (DS-020) are certified and held to a single-source-of-truth. The
vast majority of the app already composes these primitives.

The inconsistencies that remain cluster into **five deviation groups** that repeat across the whole
application. They are NOT page-specific; identical drift reappears in User, Admin, Sub-Admin and
Exam modules. Per the FINAL RULE they must be resolved **at the Foundation level** first:

1. **Hand-rolled surfaces that bypass `Card`** — `ReviewLayout` (`rounded-[32px] shadow-2xl p-8`),
   `LeaderboardTopCard` (raw gold gradient), `LeaderboardUserCard` (`shadow-[0_20px_60px_rgba(...)]`),
   `ResultView` (`p-12`), `Unauthorized` (`rounded-[40px]`). These ignore the certified surface
   ladder.
2. **Numeric/arbitrary section spacing instead of the spacing ladder** — `Stack gap={48}` (Profile),
   `gap={24}/{32}` (Leaderboard/Results), `gap={16}` (TeacherExams), `space-y-8` (Performance), vs
   the dominant `gap="lg"` + named tokens.
3. **Divider/border alpha dialects** — `border-border-subtle/` with at least six alpha values
   (`/8 /10 /20 /30 /40 /50 /15`) used for the same "card/section delimiter" function.
4. **Multiple stat/empty/icon footprints for one concept** — `StatCard` vs `ResultStatCard` vs
   `ScoreCard` vs `MetricBlock`+`ExamSummaryCards`; `EmptyState` vs `ErrorState` vs `ErrorContainer`
   vs hand-rolled; emoji vs lucide in icon slots; icon sizes 8→140.
5. **Raw data text bypassing Typography** — `text-[9px]`/`text-[10px] text-[var(--text-muted)]`
   metadata spans and raw `<h2>/<p>` headings in rows (Topics, Leaderboard, ResultsPage) instead of
   the `Typography`/`AdminText`/`Label` primitives.

---

## 3. Grouped findings by language (evidence)

### 3.1 T11–T12 Card & Container Language — deviations from certified primitives
- **Non-`Card` surfaces:** `ReviewLayout.tsx:55,78` (`shadow-2xl/shadow-xl rounded-[32px] p-8 md:p-10`,
  `p-6 md:p-8 lg:p-12`); `LeaderboardTopCard.tsx:17` (raw `#FFD700→#B8860B` gradient);
  `LeaderboardUserCard.tsx:15` (`shadow-[0_20px_60px_rgba(0,0,0,0.6)] bg-card-bg/90 backdrop-blur`);
  `Unauthorized.tsx:24` (`rounded-[40px]`); `ResultView.tsx:76` (`p-12`).
- **Card padding overrides** beyond the certified map (`p-4/5/6` + `variant` defaults):
  `p-8 md:p-10` (ProfileHeader:17), `p-8 md:p-12` (ProfileForm:66), `p-8 lg:p-12` (TestConfigView:29),
  `p-8 lg:p-10` (PreparationView:83), `p-8 md:p-12` (sub-admin settings ×5), `p-6 md:p-8 lg:p-12`
  (ReviewLayout:78), `!p-5` (TopicPortalView:134).
- **Radii beyond the radius tokens** (`--radius-card 20px / --radius-container 24px /
  --radius-control 12px`): `rounded-[40px]` (Unauthorized), `rounded-[32px]` (ReviewLayout, ProfileForm:270),
  `rounded-[28px]/[36px]` (ScoreCard), `rounded-[24px]` (LeaderboardTopCard, EmptyState), arbitrary
  admin radii.
- **Container surface/border/shadow:** only `CollectionToolbar`/`FilterBar`/`SelectionContainer`
  (AntigravityLayout:45-62,206-222) are sanctioned generic containers. Page-level "section card/rail"
  borders and shadows use ad-hoc combos (`border-primary/30`, gold rgba shadows).
- **Proposed Foundation target:** reachable from the existing `Card` + `AntigravityLayout` container
  primitives with NO new tokens — see `FOUNDATION_CARD_LANGUAGE.md` / `FOUNDATION_CONTAINER_LANGUAGE.md`.

### Module-card structure
- **Consistent where it matters:** most cards follow `header (mb-4) → content → footer (mt-auto pt-4
  border-t)` (AttemptCardBase:41-86, CollectionCard:148-176, Skeleton:69). StatCard chart
  (AntigravityCard:156-202) is coherent.
- **Divergent header/footer dialects:** `SettingsCard` (header `p-5 border-b bg-hover-bg/20` +
  `/50`), `QuestionCard` (`p-4 md:p-6 border-b bg-hover-bg/30`), sub-admin settings header `border-subtle/10`,
  AttemptCardBase footer `/30` — three border-alpha dialects for the same "card header/footer delimiter".

### 1.3 Section Layout (T13)
- Canonical flow = `PageContainer > Stack gap="lg" > [one child per section]`. Dominant across admin &
  user pages (AdminUsers:33, UserHistory:68…≈24 uses).
- **Radical deviations:** `Stack gap={48}` (UserProfile:20,37); `gap={isMobile?24:32}`
  (UserLeaderboard:90,119); `gap={16}` (UserTeacherExams:39,68); `space-y-8` (UserPerformance:112);
  `Stack gap={24} md:gap-8 lg:gap-10` + `max-w-[1200px]` (ResultsPage:57-58); `ResultsPage` &
  `ReviewLayout` re-wrap 1280px PageContainer into 1200px; loading-state gap `gap="xxl"` (UserHistory:28)
  ≠ loaded `gap="lg"`.
- **Section-title vocabulary divergence (4 dialects):** `H2` uppercase (DashboardRecentActivity:25);
  `SectionHeader` cinzel (SubAdminDashboard:74); `H3` uppercase tracking (PerformanceSectionHeader:14);
  raw `text-[10px]…font-black uppercase tracking-tight` (partial hand scale ResultsPage:70).
- **No canonical section-block primitive:** `SectionWrapper`/`SectionBlock`/`StatePanel` were removed
  as dead code (live `AntigravityLayout` exposes `PageContainer`/`SelectionContainer`/`PageHeader`/
  `Stack`/`Grid`/`SectionHeader`/`CollectionToolbar`/`FilterSelect` only). Sections are separated purely
  by `Stack` gaps or ad-hoc className — the **single largest missing primitive** for T13.

### 14.4 Icon Language (T14)
- **No cap on icon size:** lucide `size=8` (TopicListItem:62) to `size=140` (MethodSelectionView:34-36),
  `size=120` (ExamListSection:106), `size=64` (SubAdminStudents:39, ResultView:47). 20+ discrete sizes.
- **Three parallel "icon box" dialects:** `PremiumIconContainer`/`IconBadge` (iconSize 12-24,
  StatCard `iconSize=18`) vs `ResultStatCard` inline `w-14 h-14` vs `ScoreCard` `w-20/28` circle.
- **Emoji-as-Icon:** Foundation EmptyState/ErrorState default `📂`/`⚠️`; consumers pass `🔒📈🏆📊📚🛡️`
  (UserTeacherExams:56, UserPerformance:66, UserLeaderboard:110, ExamPaperGrid:109, etc.).
- **Glyph arrows** `→` in admin string copy (MethodSelectionView:44/73, AIToolCards:65, BulkUploadModal).
- **Inline `<svg>` instead of lucide:** ErrorBoundary:36, AccountDisabledPage, UpdatePasswordPage eye
  SVGs.
- See `FOUNDATION_ICON_LANGUAGE.md`.

### 15. Statistics Language (T15)
- Central `StatCard` (AntigravityCard:156-202) is coherent (icon 18px in `w-9..w-12` container, label
  `text-[9px]→[11px]`, value `text-base→xl`, `tabular-nums`, placeholder box). **No trend/description/**
  footer slots exist — required by T15.
- **Status-input dialect split:** `status` token (DashboardStatsGrid, Admin StatsGrid) vs legacy
  `color` raw/css-var (Profile, PerformanceMetricsGrid raw hex `#2563EB/#7C3AED`, SubAdminDashboard,
  ReviewLayout, ResultView, StudentDetailModal, PrepPreview). StatCard comments it as back-compat
  (AntigravityCard:106-108).
- **Duplicate stat implementations for same job:** `StatCard` (text-xl) vs `ResultStatCard`
  (text-3xl, `w-14 box`) vs `ScoreCard` (text-4xl circle) vs `MetricBlock`+`ExamSummaryCards`
  (hand-rolled, `cardVal` responsive). See `FOUNDATION_STATISTICS_LANGUAGE.md`.

### 16. Empty State Language (T16)
- Foundation recipe: `EmptyState` (SharedComponents:144-181: `p-12 rounded-[32px] gap-2`, icon
  `text-5xl`, title `text-xl font-black uppercase Vend_Sans`, action `mt-6 px-10`) + `ErrorState`
  (margin-1 `text-4xl`) + `ErrorContainer` (Card palette 24, IconBadge `w-20`).
- **Two competing Foundation footprints** (`EmptyState` vs `ErrorState` vs `ErrorContainer`) and many
  hand-rolled variants (`ExamPaperGrid:108-117`, `SubAdminStudents:57-60`).
- **Icon primitive not normalized:** lucide 48 vs lucide 40 vs emoji string vs absent.
- **Padding spread:** documented `p-12` vs consumer sets `py-8/py-12/py-16/py-20` wrappers.
  See `FOUNDATION_EMPTY_STATE_LANGUAGE.md`.

### 17. List Item Language (T17)
- **Centralized:** `CollectionCard layout="row"` (Users: UsersTable:65-95, QuestionsTable:79-105)
  — `padding=16`, `titleAs=h3`, `existing`, metadata + actions.
- **Hand-written rows (bypass CollectionCard row):** `TopicListItem.tsx:34-143` (Card default + manual
  `hover:border-primary/30` breaks CARD_HOVER), Leaderboard `<tr>` LeaderboardComponents:15
  (`py-4` vs DataGrid `py-5` = density mismatch), SubAdminStudents, SubAdminMobileCard, RecentExamItem
  metadata raw `text-[9px] text-[var(--text-muted)]`.
- **Density mismatch:** CollectionCard row `p-4` vs `LibraryTable` DataGrid cell `py-5` (20px) vs
  Leaderboard `py-4` (16px) vs Attempt `p-4 md:p-5`. Rows are the same semantic yet three paddings.
- **Hover fill three "discounts":** Card `hover:bg-hover-bg/40`, DataGrid `hover:bg-hover-bg/30`,
  LeaderboardRow `hover:bg-hover-bg/20` — /40 vs /30 vs /20.

### 18. Premium Theme (T18)
- Gold family = `--gold-*` (-50..-400, `#FFD700/#FFE082/#C8960C/#B8860B/#B04B`) + `--premium-gold`
  (#d4af37, DEAD) + `--color-secondary(…C8960C)` light wine. Certified gold uses (D-141):
  PremiumIconContainer, EmptyDateUpper, StatCard background, nav indicator `--border-nav-indicator
  #C8960C`, Splash, BrandTitle gradient `#f5e0be→#b88c3a`.
- **Raw gold in premium context (LEGIT, ranking/rewards):** `LeaderboardTopCard` `#FFD700→#B8860B`
  (LEGIT — ranking/reward), StatCard `--surface-stat`).
- **Amber-as-metadata/label (VIOLATION of T18 "gold not for metadata/labels"):** `text-amber-400`
  on metadata/labels that read gold-adjacent but are functional:
  `QuestionCard.tsx:72` (Tamil-Unavailable label), `ReviewQuestionCard.tsx:39`,
  `ExamSubComponents.tsx:35` AccuracyBadge `amber`, `ExamSummaryCards.tsx:24` Avg-Time metadata,
  `ExamStudentTable.tsx:147` skipped metadata, `ExamQuestionAnalysis:110` skipped).
  These are amber, not gold — but **semantically they are gold/amber-as-metadata**, which the
  premium rule forbids. See `FOUNDATION_GLOBAL_RECOMMENDATIONS.md` / `FOUNDATION _CERTIFICATION`.

### 19. Light Mode (T-19)
- Current `.light` bg: `--bg-app#FAFBFC`, `--bg-elevated#F4F6F8`, `--bg-hover#F4F6F8`, `--bg-active
  #E7ECF1`, borders `--border-default#E6E8F0`, `--border-input#CB5E1`. Text: secondary #4B5563, muted
  #6B7280, hint **#9CA3AF** (lowest contrast ≈2.7:1 on #FAFBFC).
- The light mode is already brightened by DS-020. Residual "heavy" surface: `--border-hover#94A3B8`,
  `--border-input#CB5E1`, `--bg-active#E7ECF1` boundary, and the light **amber/gold** stats surfaces.
  See `FOUNDATION_LIGHT_MODE_REFINEMENT.md`.

### 20. Responsive (T-20)
- Mobile-first `md:`-dominant, breakpoints sm/md/lg/xl + JS `useBreakpoint`. Icons fixed (`iconSize=18`
  StatCard) not breakpoint-scaled; leaderboard Trophy `size={isMobile?60:80}`.
- Compressed-risk: dataTables `min-w-[600px]…xl min-w-[1000px]` (LeaderboardView), fixed px columns
  (UsersTable `w-[170px]…`), `PopupNotificationPanel w-80`.
- Oversized-risk: StatCard `Grid cols=4` fixed height `lg:h-24`; WelcomeBanner `min-h-[200px]`; Rows
  LeaderboardTopCard `text-[64px]` rank vs single column; Splash coin.

### 21. Visual Polish & 22. Future-Proof Rules
- Foundational system is modern/premium/consistent. Polish gaps = the five deviation groups above
  (hand-rolled surfaces, numeric spacing, divider-alpha, duplicate stat/empty/icon services, raw
  data typography). See `FOUNDATION_VISUAL_POLISH_REPORT.md` + `FOUNDATION_GLOBAL_RECOMMENDATIONS.md`
  (incl. Future-Proof Gateway, Task 22 checklist).

---

## 3. Verification and status

- **Read-only:** no `src/**` file modified; no token/CSS/component/pattern-sheet change.
- **Source of truth check:** all findings cross-referenced to `themes.css`/`Foundation primitives`.
- **Follow-up:** proposals in the 10 companion deliverables; approval gate in
  `FOUNDATION_CERTIFICATION.md`.

---

## 4. Appendix — file:line evidence index (highest-signal)

| Group | Evidence |
|---|---|
| Hand-rolled surfaces | `ReviewLayout.tsx:55,78`; `LeaderboardTopCard.tsx:17`; `LeaderboardUserCard.tsx:15`; `ResultView.tsx:76`; `Unauthorized.tsx:24`; `ProfileForm.tsx:66` |
| Numeric section spacing | `UserProfile.tsx:20,37`; `UserTeacherExams.tsx:39,68`; `UserLeaderboard.tsx:90,119`; `Performance.tsx:112`; `ResultsPage.tsx:57-58` |
| Divider alpha spread | `border-border-subtle/10` (SubAdminStudents), `/20` (ExamScoreDistribution), `/30` (AttemptCardBase/Collection), `/50` (SettingsCard) |
| Duplicate stat | `AntigravityResults.tsx:8,24` (`ScoreCard`/`ResultStatCard`) vs `AntigravityCard:156` (`StatCard`) vs `ExamSummaryCards.tsx:30` |
| Duplicate empty | `SharedComponents:153` `EmptyState` vs `ErrorContainer.tsx` vs `ExamPaperGrid:108` vs `SubAdminStudents:57` |
| Icon range | `TopicListItem:62`(`8`), `MethodSelection:33-47`(`140`), `ExamListSection:106`(`120`), IconBadge `12-24` |
| Raw typography | `TopicListItem:53-58`; `LeaderboardComponents.tsx:41,46`; `RecentExamItem.tsx:41`; `ResultsPage.tsx:70` |
| Amber/metadata | `QuestionCard:72`; `ExamSummaryCards:24`; `ExamStudentTable:147`; `ExamQuestionAnalysis:110` |
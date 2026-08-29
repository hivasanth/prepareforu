# FOUNDATION_CONSUMER_MIGRATION_PLAN

- **Phase:** 3.7/V — migration strategy for the Card(11)/Container(12)/Section(13)/Icon(14)/
  Statistics(15)/Empty(16)/List(17)/Premium(18)/Light(19)/Responsive(20) languages.
- **Status:** PLAN (read-only). Ordering only — **no page is migrated until each Foundation
  primitive ships and is approved** (Foundation-first; FINAL RULE).
- **Companion:** language specs `FOUNDATION_CARD_*`, `FOUNDATION_CONTAINER_*`,
  `FOUNDATION_STATISTICS_*`, `FOUNDATION_EMPTY_STATE_*`, `FOUNDATION_ICON_*`, `FOUNDATION_LIGHT_*`;
  global sequence in `FOUNDATION_GLOBAL_RECOMMENDATIONS.md §4`.

---

## 1. Principle

Two delivery types:
- **A. Foundation-first evolution**: build/refine ONE Foundation primitive (composite, token value,
  icon ladder, StatCard slots, unified EmptyState). Additive → freeze-compatible with DS-016…DS-020.
- **B. Consumer roll**: after (A) is approved, migrate consumers file-by-file to the primitive.
  No consumer change before the primitive exists.

## 2. Wave map (each wave = [Foundation change] → [consumer roll])

### Wave 1 — Card & Container anatomy (T11/T12/T13)
- **Foundation:** canonical card row anatomy composite (or extend CollectionCard) + canonical Section
  wrapper + container tier doc. Remove `max-w-[1200px]` re-wrap rule; `/30` divider; gap ladder.
- **Consumers:** `ReviewLayout` (surfaces→Card/premium), `ResultView` (`p-12`+shell), `Unauthorized`
  (`rounded-[40px]`), `ProfileForm`/`TestConfigView`/`PreparationView` (`p-8*`→padding map),
  `SettingsCard`/`QuestionCard` header/footer `/50`→`/30`, sub-admin settings header `/10`→`/30`,
  `Stack gap={48/24/32/16}` + `space-y-8` → gap ladder, `ResultsPage`/`ReviewLayout`/auth width.
- **Files (representative):** ReviewLayout, ResultsPage, ResultView, ProfileForm, TestConfigView,
  PreparationView, SettingsCard, QuestionCard, Identity/Session/Backup/Notification/Recruitment
  Section, UserProfile, UserLeaderboard, UserTeacherExams, UserPerformance, AdminOverview, error pages.

### Wave 2 — Icon ladder + emoji→lucide (T14)
- **Foundation:** icon-size ladder + single icon-box owner; icon lint.
- **Consumers:** replace emoji icons (`📂⚠️🔒📈🏆📊📚🛡️`) → lucide in Empty/Error/User pages;
  replace glyph `→` in admin copy → lucide; normalize `size=` to ladder; `strokeWidth→2`; retire
  `ResultStatCard`/`ScoreCard` inline boxes → ladder.
  `<exact call sites list in `FOUNDATION_ICON_LANGUAGE.md §4`.
  Files: SharedComponents (defaults), UserTeacherExams, UserPerformance, UserHistory, UserLeaderboard,
  TeacherLeaderboardModal, ExamPaperGrid, TopicReader, UpdatePasswordPage, MethodSelectionView,
  ExamListSection, ReviewQuestionCard, AccountDisabledPage, ErrorBoundary, BulkUploadModal, AIToolCards,
  JsonTab.

### Wave 3 — Statistics (T15)
- **Foundation:** StatCard `trend`/`description` slots + semantic-only `status`; big `variant`.
- **Consumers:** 7 `color`/raw-hex call sites → `status` tokens; ResultStatCard/ScoreCard/MetricBlock/
  ExamSummaryCards → StatCard(+variant); unify label casing; unit via prop.
  Files: DashboardStatsGrid, AdminStatsGrid, Profile/StatisticsSection, PerformanceMetricsGrid,
  SubAdminDashboard, ReviewLayout, ResultView, StudentDetailModal, PrepPreview, AntigravityResults,
  AntigravityData (MetricBlock), ExamSummaryCards.

### Wave 4 — Empty State unification (T16)
- **Foundation:** merge EmptyState/ErrorState/ErrorContainer → ONE `EmptyState` (tone, no-emoji).
- **Consumers:** migrate hand-rolled empties (`ExamPaperGrid`, `SubAdminStudents`, admin states,
  TeacherLeaderboardModal) + emoji-empty pages; remove `py-*` wrappers.
- Files: `SharedComponents` (EmptyState/ErrorState), `ErrorContainer`, ExamPaperGrid, SubAdminStudents,
  UserHistory/Performance/Leaderboard/Topics/TeacherLeaderboard, AdminTopics, AccountDisabledPage, etc.

### Wave 5 — List item rows (T17)
- **Foundation:** CollectionCard row = the row-authority (grid of One `row` + hover `/40`).
- **Consumers:** TopicListItem, Leaderboard `<tr>` (tabular vs grid density), SubAdminStudents,
  SubAdminMobileCard, RecentExamItem/Recent not home raw metadata → CollectionCard/AdminText.
- Files: `TopicListItem`, `TopicCard`, `LeaderboardComponents`, `LeaderboardView`, `StudentsTable`,
  `SubAdminMobileCard`, `RecentExamItem`, `RecentAttemptItem`.

### Wave 6 — Premium gold (T18) + label/meta family (T19) + Light (T19)
- **Fonts-gold:** migrate amber-as-metadata/label → semantic warning/label ladder (T18);
  retire dead `--premium-gold`.
- **Label family:** replace raw `text-[9px]/[10px] text-[var(--text-muted)]` with the certified
  `AdminText size="metadata"`/`Label` role; migrate `text-hint` quiet labels → `text-secondary` (T19).
- **Light:** apply the `.light` value refinements (token-only).
- Files: QuestionCard, ReviewQuestionCard, ExamSummaryCards, ExamStudentTable, ExamQuestionAnalysis,
  ExamSubComponents, Topics rows, Leaderboard, RecentExam/Attempt, Profile, ResultStatCard.
- **Theme:** only `themes.css` `.light` values (no new names).

### Wave 7 — Responsive cleanup (T20)
- **Foundation:** responsive rules document (mobile-first, breakpoint mapping, size-safe icon ladder).
- **Consumers:** collapse fixed-width tables (`min-w-[600px]`) / fixed px columns below `lg`;
  scale decorative icons; keep Icon ladder responsive.

### Wave 8 — Future-Gate + CI (T22)
- Add the Future-Gate checklist to every page audit; wire mechanical lints (no emoji-in-icon, no
  numeric `size=`, no raw hex, no new container/card primitive).

---

## 3. Verification per wave

Each wave: `tsc -b` exit 0; `npm run build` exit 0; eslint on changed files exit 0; `npm test`
165/165 with the pre-existing worker ESM errors; manual visual check on screenshot deck. Foundation
changes are additive; freeze register gains a DS row per shipped language.

---

## 4. Status

- **PLAN** — no consumer file edited. Implementation is gated per-wave by Foundation primitive
  approval (see `FOUNDATION_CERTIFICATION.md`).
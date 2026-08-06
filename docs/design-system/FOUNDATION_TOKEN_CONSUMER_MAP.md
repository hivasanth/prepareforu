# Foundation Token Consumer Map — Phase 5.2A

**Phase:** 5.2A (Token Ownership Verification — Review Only)
**Status:** VERIFIED, AWAITING APPROVAL
**Source of truth:** verified scan of `src/` (all 731 defined tokens)

This is the complete per-token consumer map. Columns:

- **Def** — definition location (`themes.css`/`index.css`, line refs below in the delete/keep lists; here file only for space).
- **Runtime** — count of `var(--token)` occurrences in TS/TSX files.
- **Tailwind** — count of derived utility-class uses in TS/TSX (from the `@theme` registration map, e.g. `--color-text-secondary` → `text-text-secondary`).
- **CSS** — count of `var(--token)` occurrences on non-definition lines in `themes.css`/`index.css` (rules + `@utility` recipes + other tokens' values).
- **Rule** — count of rule-line references (subset of CSS).
- **Tests** — count of references in test/spec files.
- **Docs** — count of references in `docs/` markdown.
- **Consumer files** — unique files consuming the token across runtime/tailwind/css/tests.

DEAD tokens (SAFE REMOVE) show 0 across all counts and are listed for completeness; their full rows with reasons are in `FOUNDATION_TOKEN_DELETE_LIST.md`.
| Token | Category | Def | Runtime | Tailwind | CSS | Rule | Tests | Docs | Consumer files |
|---|---|---|---|---|---|---|---|---|---|
| ai-green | SAFE REMOVE | themes.css:242 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| ai-terracotta | SAFE REMOVE | themes.css:241 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| amber-100 | SAFE REMOVE | themes.css:94 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| amber-200 | SAFE REMOVE | themes.css:95 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| amber-300 | SAFE REMOVE | themes.css:96 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| amber-400 | SAFE REMOVE | themes.css:97 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| amber-50 | SAFE REMOVE | themes.css:93 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| amber-500 | SAFE REMOVE | themes.css:98 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| amber-600 | SAFE REMOVE | themes.css:99 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| amber-700 | SAFE REMOVE | themes.css:100 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| amber-800 | SAFE REMOVE | themes.css:101 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| amber-900 | SAFE REMOVE | themes.css:102 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| amber-950 | SAFE REMOVE | themes.css:103 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| ancient-amber | SAFE REMOVE | themes.css:661; index.css:293 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| ancient-badge-bg | SAFE REMOVE | themes.css:657; index.css:289 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| ancient-badge-border | SAFE REMOVE | themes.css:658; index.css:290 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| ancient-brown | SAFE REMOVE | themes.css:653; index.css:285 | 0 | 0 | 0 | 0 | 0 | 2 |  |
| ancient-brown-deep | SAFE REMOVE | themes.css:652; index.css:284 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| ancient-cream | SAFE REMOVE | themes.css:654; index.css:286 | 0 | 0 | 0 | 0 | 0 | 4 |  |
| ancient-cream-light | SAFE REMOVE | themes.css:662; index.css:294 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| ancient-danger | SAFE REMOVE | themes.css:655; index.css:287 | 0 | 0 | 0 | 0 | 0 | 2 |  |
| ancient-danger-hover | SAFE REMOVE | themes.css:656; index.css:288 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| ancient-forest | SAFE REMOVE | themes.css:659; index.css:291 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| ancient-gold | SAFE REMOVE | themes.css:651; index.css:283 | 0 | 0 | 0 | 0 | 0 | 10 |  |
| ancient-gold-bright | FREEZE PROTECTED | themes.css:660; index.css:292 | 1 | 0 | 0 | 0 | 0 | 4 | PremiumIconContainer.tsx |
| app-bg | KEEP | index.css:264 | 0 | 0 | 1 | 2 | 0 | 0 | index.css |
| bg-accent-subtle | KEEP | themes.css:409; themes.css:690 | 0 | 0 | 6 | 1 | 0 | 6 | index.css, themes.css |
| bg-accent-surface | SAFE REMOVE | themes.css:576; themes.css:876 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| bg-active | KEEP | themes.css:402; themes.css:683 | 0 | 0 | 3 | 0 | 0 | 7 | themes.css |
| bg-app | FREEZE PROTECTED | themes.css:398; themes.css:679 | 0 | 37 | 6 | 1 | 0 | 19 | CreateStepReview.tsx, QuestionForm.tsx, AntigravityLayout.tsx, QuestionOptions.tsx, AddExamModal.tsx, MapVisualizer.tsx, PreparationView.tsx, ActiveExamPage.tsx, ReviewLayout.tsx, LoadingScreen.tsx, LoginPage.tsx, AdminModal.tsx, QuestionsTableComponents.tsx, StatusBoard.tsx, LanguageSelectionScreen.tsx, SignupPage.tsx, VerifyEmailPage.tsx, ErrorBoundary.tsx, SidebarLayout.tsx, ExamLayout.tsx, NotificationPanel.tsx, index.css, themes.css |
| bg-danger-subtle | SAFE REMOVE | themes.css:408; themes.css:689 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| bg-disabled | KEEP | themes.css:403; themes.css:684 | 0 | 0 | 4 | 2 | 0 | 3 | index.css, themes.css |
| bg-elevated | KEEP | themes.css:400; themes.css:681 | 4 | 1 | 13 | 4 | 0 | 26 | TopicSectionRenderer.tsx, TopicReader.tsx, ExamTimer.tsx, index.css, themes.css |
| bg-hover | FREEZE PROTECTED | themes.css:401; themes.css:682 | 2 | 124 | 19 | 4 | 0 | 30 | TopicReader.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, LeaderboardMobileCard.tsx, ParsedPreview.tsx, QuestionForm.tsx, RankBadge.tsx, QuestionsTable.tsx, AttemptCardBase.tsx, SettingsCard.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, FormattedBodyText.tsx, ExamStudentTable.tsx, QuestionOptions.tsx, AddExamModal.tsx, CreateStepPrompt.tsx, Navigation.tsx, QuestionCard.tsx, PreviewTab.tsx, PreparationView.tsx, AntigravityData.tsx, ReviewQuestionCard.tsx, ReviewLayout.tsx, ProfileHeader.tsx, AntigravityButton.tsx, SuccessView.tsx, ExamView.tsx, CreateStepSetup.tsx, LeaderboardComponents.tsx, CompactDateTimePicker.tsx, IconBadge.tsx, TestConfigView.tsx, AntigravityDashboard.tsx, Menu.tsx, LeaderboardTable.tsx, QuestionVisualizer.tsx, ThemeToggle.tsx, ExamDetailModal.tsx, AntigravityResults.tsx, SubjectCardItem.tsx, ExamParamsForm.tsx, SubmitExamModal.tsx, useActiveExam.tsx, SharedComponents.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, BilingualToggle.tsx, ExamDetailRow.tsx, SidebarLayout.tsx, FinishSignInPage.tsx, AccountDisabledPage.tsx, TopicCard.tsx, QuestionNavigator.tsx, PremiumSelect.tsx, index.css, themes.css |
| bg-input | KEEP | themes.css:404; themes.css:685 | 0 | 0 | 3 | 1 | 0 | 2 | themes.css |
| bg-nav | KEEP | themes.css:558; themes.css:858 | 0 | 0 | 3 | 1 | 0 | 19 | themes.css |
| bg-nav-active | KEEP | themes.css:564; themes.css:864 | 0 | 0 | 2 | 1 | 0 | 2 | index.css, themes.css |
| bg-nav-footer | SAFE REMOVE | themes.css:567; themes.css:867 | 0 | 0 | 1 | 0 | 0 | 1 | themes.css |
| bg-nav-hover | SAFE REMOVE | themes.css:563; themes.css:863 | 0 | 0 | 1 | 0 | 0 | 1 | themes.css |
| bg-overlay | SAFE REMOVE | themes.css:405; themes.css:686 | 0 | 0 | 3 | 0 | 0 | 4 | themes.css |
| bg-success-subtle | SAFE REMOVE | themes.css:406; themes.css:687 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| bg-surface | FREEZE PROTECTED | themes.css:399; themes.css:680 | 0 | 68 | 20 | 1 | 0 | 72 | TopicInfoButton.tsx, DiagramRenderer.tsx, Pagination.tsx, CreateStepReview.tsx, CreateStepJsonPaste.tsx, ExamDetailSection.tsx, LeaderboardView.tsx, CreateStepPublish.tsx, ExamStudentTable.tsx, TopicReader.tsx, ExamSubComponents.tsx, AddExamModal.tsx, SelectionView.tsx, CreateStepPrompt.tsx, QuestionCard.tsx, useToast.tsx, AdminLeaderboard.tsx, AntigravityData.tsx, ReviewLayout.tsx, SuccessView.tsx, CreateStepSetup.tsx, CompactDateTimePicker.tsx, TestConfigView.tsx, ExamHeader.tsx, Unauthorized.tsx, AdminModal.tsx, QuestionVisualizer.tsx, ThemeToggle.tsx, ExamDetailModal.tsx, UploadProgressOverlay.tsx, StatusBoard.tsx, RecruitmentSection.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, QuestionPalette.tsx, SignupPage.tsx, LeaderboardUserCard.tsx, AdminTopicPreviewRenderer.tsx, VerifyEmailPage.tsx, ErrorBoundary.tsx, SubAdminStudents.tsx, SidebarLayout.tsx, BulkActionBar.tsx, QuestionNavigator.tsx, ProfileHeader.tsx, index.css, themes.css |
| bg-warning-subtle | SAFE REMOVE | themes.css:407; themes.css:688 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| black | SAFE REMOVE | themes.css:267 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| blue-100 | SAFE REMOVE | themes.css:55 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| blue-200 | SAFE REMOVE | themes.css:56 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| blue-300 | SAFE REMOVE | themes.css:57 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| blue-400 | SAFE REMOVE | themes.css:58 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| blue-50 | SAFE REMOVE | themes.css:54 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| blue-500 | SAFE REMOVE | themes.css:59 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| blue-600 | SAFE REMOVE | themes.css:60 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| blue-700 | SAFE REMOVE | themes.css:61 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| blue-800 | SAFE REMOVE | themes.css:62 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| blue-900 | SAFE REMOVE | themes.css:63 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| blue-950 | SAFE REMOVE | themes.css:64 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| border-accent | KEEP | themes.css:578; themes.css:878 | 0 | 0 | 1 | 1 | 0 | 1 | index.css |
| border-color | LEGACY COMPATIBILITY | index.css:268 | 0 | 0 | 0 | 1 | 0 | 0 | index.css |
| border-default | KEEP | themes.css:424; themes.css:708 | 1 | 11 | 9 | 3 | 0 | 3 | TopicSectionRenderer.tsx, TopicSectionRenderer.tsx, TopicReader.tsx, index.css, themes.css |
| border-disabled | KEEP | themes.css:428; themes.css:712 | 0 | 0 | 1 | 0 | 0 | 0 | themes.css |
| border-focus | KEEP | themes.css:426; themes.css:710 | 0 | 0 | 3 | 2 | 0 | 2 | index.css, themes.css |
| border-hover | KEEP | themes.css:427; themes.css:711 | 0 | 0 | 5 | 3 | 0 | 9 | index.css, themes.css |
| border-input | KEEP | themes.css:425; themes.css:709 | 0 | 0 | 4 | 3 | 0 | 5 | index.css, themes.css |
| border-nav | SAFE REMOVE | themes.css:560; themes.css:860 | 0 | 0 | 1 | 0 | 0 | 9 | themes.css |
| border-nav-footer | SAFE REMOVE | themes.css:568; themes.css:868 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| border-nav-indicator | SAFE REMOVE | themes.css:566; themes.css:866 | 0 | 0 | 1 | 0 | 0 | 3 | themes.css |
| border-subtle | FREEZE PROTECTED | themes.css:429; themes.css:713 | 17 | 234 | 18 | 5 | 0 | 71 | DiagramRenderer.tsx, ChartVisualizer.tsx, MapVisualizer.tsx, DailyAttemptsChart.tsx, paletteColors.ts, ExamListSection.tsx, SubjectInsightsCard.tsx, ResultsPage.tsx, ExamSubComponents.tsx, LeaderboardTabletCard.tsx, LoginPage.tsx, AdminSelectionTabs.tsx, LeaderboardComponents.tsx, VerifyEmailPage.tsx, BulkActionBar.tsx, ExamQuestionAnalysis.tsx, UploadProgressOverlay.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, ProfileForm.tsx, Pagination.tsx, LeaderboardMobileCard.tsx, TeacherExamFilterBar.tsx, ParsedPreview.tsx, CreateStepReview.tsx, QuestionForm.tsx, RankBadge.tsx, CreateStepJsonPaste.tsx, SessionSection.tsx, AttemptCardBase.tsx, SettingsCard.tsx, ExamDetailSection.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, CreateStepPublish.tsx, FormattedBodyText.tsx, ExamStudentTable.tsx, TopicReader.tsx, QuestionOptions.tsx, AddExamModal.tsx, SelectionView.tsx, CreateStepPrompt.tsx, StartTestButton.tsx, Navigation.tsx, QuestionCard.tsx, PreviewTab.tsx, PreparationView.tsx, TopicMetadataFields.tsx, SubAdminCreate.tsx, AdminLeaderboard.tsx, CollectionCard.tsx, AntigravityData.tsx, SubAdminMobileCard.tsx, ReviewQuestionCard.tsx, ReviewLayout.tsx, ProfileHeader.tsx, BackupSection.tsx, AntigravityButton.tsx, SuccessView.tsx, ExamView.tsx, CreateStepSetup.tsx, CompactDateTimePicker.tsx, TestConfigView.tsx, ExamHeader.tsx, Unauthorized.tsx, AntigravityDashboard.tsx, Menu.tsx, AdminModal.tsx, LeaderboardTable.tsx, QuestionVisualizer.tsx, ThemeToggle.tsx, ExamDetailModal.tsx, AntigravityResults.tsx, QuestionsTableComponents.tsx, SubjectCardItem.tsx, ExamParamsForm.tsx, MethodSelectionView.tsx, StatusBoard.tsx, SubmitExamModal.tsx, useActiveExam.tsx, SharedComponents.tsx, SegmentedFilter.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, QuestionPalette.tsx, SignupPage.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, ErrorBoundary.tsx, SubAdminStudents.tsx, SidebarLayout.tsx, StudentsTable.tsx, NotificationSection.tsx, ExamSummaryCards.tsx, QuestionActions.tsx, QuestionNavigator.tsx, PremiumSelect.tsx, IdentitySection.tsx, index.css, themes.css |
| btn-danger-bg | SAFE REMOVE | themes.css:1137 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-danger-border | SAFE REMOVE | themes.css:1139 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-danger-hover-bg | SAFE REMOVE | themes.css:1141 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-danger-hover-shadow | SAFE REMOVE | themes.css:1142 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-danger-shadow | SAFE REMOVE | themes.css:1140 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-danger-text | SAFE REMOVE | themes.css:1138 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-ghost-active-bg | SAFE REMOVE | themes.css:1153 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-ghost-bg | SAFE REMOVE | themes.css:1149 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-ghost-border | SAFE REMOVE | themes.css:1151 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-ghost-hover-bg | SAFE REMOVE | themes.css:1152 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-ghost-text | SAFE REMOVE | themes.css:1150 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-outline-bg | SAFE REMOVE | themes.css:1154 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-outline-border | SAFE REMOVE | themes.css:1156 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-outline-hover-bg | SAFE REMOVE | themes.css:1157 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-outline-hover-border | SAFE REMOVE | themes.css:1158 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-outline-text | SAFE REMOVE | themes.css:1155 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-primary-active-shadow | SAFE REMOVE | themes.css:1127; themes.css:1220 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| btn-primary-bg | SAFE REMOVE | themes.css:1121 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-primary-border | SAFE REMOVE | themes.css:1123 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-primary-disabled-bg | SAFE REMOVE | themes.css:1128 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-primary-disabled-text | SAFE REMOVE | themes.css:1129 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-primary-hover-bg | SAFE REMOVE | themes.css:1125 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-primary-hover-shadow | SAFE REMOVE | themes.css:1126 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-primary-shadow | SAFE REMOVE | themes.css:1124 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-primary-text | SAFE REMOVE | themes.css:1122 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-secondary-active-bg | SAFE REMOVE | themes.css:1136 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-secondary-bg | SAFE REMOVE | themes.css:1130 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| btn-secondary-border | SAFE REMOVE | themes.css:1132 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-secondary-hover-bg | SAFE REMOVE | themes.css:1134 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| btn-secondary-hover-border | SAFE REMOVE | themes.css:1135 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-secondary-shadow | SAFE REMOVE | themes.css:1133 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-secondary-text | SAFE REMOVE | themes.css:1131 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-success-bg | SAFE REMOVE | themes.css:1143 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-success-border | SAFE REMOVE | themes.css:1145 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-success-hover-bg | SAFE REMOVE | themes.css:1147 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-success-hover-shadow | SAFE REMOVE | themes.css:1148 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-success-shadow | SAFE REMOVE | themes.css:1146 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| btn-success-text | SAFE REMOVE | themes.css:1144 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| button-border-ghost | FREEZE PROTECTED | themes.css:937 | 0 | 2 | 1 | 0 | 0 | 1 | AntigravityButton.tsx, index.css |
| button-border-secondary | FREEZE PROTECTED | themes.css:929; themes.css:1232 | 0 | 4 | 1 | 0 | 0 | 15 | AntigravityButton.tsx, index.css |
| button-border-secondary-width | SAFE REMOVE | themes.css:930; themes.css:1233 | 0 | 0 | 0 | 0 | 0 | 5 |  |
| button-shadow-secondary | FREEZE PROTECTED | themes.css:931; themes.css:1234 | 0 | 2 | 1 | 0 | 0 | 8 | AntigravityButton.tsx, index.css |
| button-shadow-secondary-hover | FREEZE PROTECTED | themes.css:932; themes.css:1235 | 0 | 2 | 1 | 0 | 0 | 2 | AntigravityButton.tsx, index.css |
| button-surface-ghost | FREEZE PROTECTED | themes.css:933 | 0 | 3 | 1 | 0 | 0 | 3 | AntigravityButton.tsx, index.css |
| button-surface-ghost-hover | FREEZE PROTECTED | themes.css:934 | 0 | 3 | 1 | 0 | 0 | 1 | AntigravityButton.tsx, index.css |
| button-surface-secondary | FREEZE PROTECTED | themes.css:926; themes.css:1230 | 0 | 2 | 1 | 0 | 0 | 10 | AntigravityButton.tsx, index.css |
| button-surface-secondary-hover | FREEZE PROTECTED | themes.css:927; themes.css:1231 | 0 | 2 | 1 | 0 | 0 | 2 | AntigravityButton.tsx, index.css |
| button-text-ghost | FREEZE PROTECTED | themes.css:935 | 0 | 3 | 1 | 0 | 0 | 1 | AntigravityButton.tsx, index.css |
| button-text-ghost-hover | FREEZE PROTECTED | themes.css:936 | 0 | 3 | 1 | 0 | 0 | 0 | AntigravityButton.tsx, index.css |
| button-text-secondary | FREEZE PROTECTED | themes.css:928 | 0 | 2 | 1 | 0 | 0 | 1 | AntigravityButton.tsx, index.css |
| canvas-splash-bg | KEEP | themes.css:232 | 2 | 0 | 0 | 0 | 0 | 1 | SplashPage.tsx |
| canvas-splash-dark | KEEP | themes.css:233 | 1 | 0 | 0 | 0 | 0 | 1 | SplashPage.tsx |
| card-3d-shadow | MERGE | themes.css:799 | 0 | 1 | 1 | 0 | 0 | 32 | AntigravityCard.tsx, index.css |
| card-bg | KEEP | themes.css:903; index.css:265 | 1 | 0 | 2 | 1 | 0 | 26 | DiagramRenderer.tsx, index.css |
| card-border | FREEZE PROTECTED | themes.css:1038; themes.css:1225 | 0 | 3 | 2 | 0 | 0 | 19 | AntigravityCard.tsx, index.css, themes.css |
| card-hover-shadow | FREEZE PROTECTED | themes.css:1040 | 0 | 3 | 1 | 0 | 0 | 4 | AntigravityCard.tsx, index.css |
| card-shadow | FREEZE PROTECTED | themes.css:1039; themes.css:1226 | 0 | 4 | 1 | 0 | 0 | 13 | AntigravityCard.tsx, index.css |
| chart-amber | SAFE REMOVE | themes.css:253 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| chart-coral | SAFE REMOVE | themes.css:249 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| chart-cyan | SAFE REMOVE | themes.css:255 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| chart-emerald | SAFE REMOVE | themes.css:252 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| chart-indigo | SAFE REMOVE | themes.css:250 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| chart-navy | SAFE REMOVE | themes.css:245 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| chart-orange | SAFE REMOVE | themes.css:248 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| chart-pink | SAFE REMOVE | themes.css:256 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| chart-purple | SAFE REMOVE | themes.css:254 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| chart-rose | SAFE REMOVE | themes.css:251 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| chart-teal | SAFE REMOVE | themes.css:246 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| chart-yellow | SAFE REMOVE | themes.css:247 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| checkbox-border | FREEZE PROTECTED | themes.css:940; themes.css:1237 | 0 | 1 | 1 | 0 | 0 | 10 | AntigravityForm.tsx, index.css |
| checkbox-border-checked | FREEZE PROTECTED | themes.css:944 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityForm.tsx, index.css |
| checkbox-border-focus | FREEZE PROTECTED | themes.css:942 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx, index.css |
| checkbox-border-hover | FREEZE PROTECTED | themes.css:941 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx, index.css |
| checkbox-surface | FREEZE PROTECTED | themes.css:939; themes.css:1236 | 0 | 1 | 1 | 0 | 0 | 6 | AntigravityForm.tsx, index.css |
| checkbox-surface-checked | FREEZE PROTECTED | themes.css:943 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx, index.css |
| color-accent | FREEZE PROTECTED | themes.css:432; themes.css:716 | 4 | 407 | 33 | 3 | 0 | 33 | LoginPage.tsx, SignupPage.tsx, TopicInfoButton.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, ProfileForm.tsx, SubjectInsightsCard.tsx, ParsedPreview.tsx, QuestionForm.tsx, AttemptCardBase.tsx, SettingsCard.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, CreateStepPublish.tsx, FormattedBodyText.tsx, TopicReader.tsx, QuestionOptions.tsx, AddExamModal.tsx, ResultView.tsx, CreateStepPrompt.tsx, Navigation.tsx, QuestionCard.tsx, PreparationView.tsx, LangInputPanel.tsx, CollectionCard.tsx, AntigravityData.tsx, SubAdminMobileCard.tsx, ReviewQuestionCard.tsx, UserLeaderboard.tsx, InstructionsTab.tsx, ReviewLayout.tsx, TeacherExamCard.tsx, ProfileHeader.tsx, AIToolCards.tsx, AntigravityButton.tsx, TopicListItem.tsx, LoadingScreen.tsx, SuccessView.tsx, LeaderboardComponents.tsx, AdminIconWrap.tsx, CompactDateTimePicker.tsx, IconBadge.tsx, TestConfigView.tsx, UploadContextPanel.tsx, AntigravityDashboard.tsx, Menu.tsx, ExamDetailModal.tsx, AntigravityResults.tsx, SubjectCardItem.tsx, StatusBoard.tsx, RecruitmentSection.tsx, LanguageSelectionScreen.tsx, LeaderboardUserCard.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, VerifyEmailPage.tsx, BilingualToggle.tsx, CarouselDots.tsx, Alert.tsx, ErrorBoundary.tsx, SidebarLayout.tsx, TopicCard.tsx, QuestionNavigator.tsx, PremiumSelect.tsx, ExamQuestionAnalysis.tsx, ExamListSection.tsx, Pagination.tsx, LeaderboardMobileCard.tsx, SessionSection.tsx, ExamDetailSection.tsx, AntigravityLayout.tsx, ExamStudentTable.tsx, PreviewTab.tsx, StudentDetailModal.tsx, LeaderboardTabletCard.tsx, AdminTopics.tsx, RecentExamItem.tsx, PerformanceCharts.tsx, CollectionFilter.tsx, BackupSection.tsx, ExamView.tsx, SubAdminLayout.tsx, ExamHeader.tsx, QuestionsTableComponents.tsx, ExamParamsForm.tsx, UploadProgressOverlay.tsx, MethodSelectionView.tsx, UserLayout.tsx, SegmentedFilter.tsx, TeacherLeaderboardModal.tsx, AntigravityCard.tsx, SignupPage.tsx, StudentsTable.tsx, NotificationSection.tsx, ExamSummaryCards.tsx, IdentitySection.tsx, CreateStepJsonPaste.tsx, CreateStepSetup.tsx, Spinner.tsx, ThemeToggle.tsx, index.css, themes.css |
| color-accent-hover | SAFE REMOVE | themes.css:433; themes.css:717 | 0 | 0 | 4 | 0 | 0 | 0 | index.css, themes.css |
| color-accent-rgb | KEEP | themes.css:435; themes.css:719 | 0 | 0 | 1 | 0 | 0 | 0 | index.css |
| color-accent-subtle | KEEP | themes.css:434; themes.css:718 | 0 | 0 | 2 | 1 | 0 | 0 | index.css |
| color-app-bg | FREEZE PROTECTED | index.css:50 | 0 | 37 | 0 | 0 | 0 | 0 | CreateStepReview.tsx, QuestionForm.tsx, AntigravityLayout.tsx, QuestionOptions.tsx, AddExamModal.tsx, MapVisualizer.tsx, PreparationView.tsx, ActiveExamPage.tsx, ReviewLayout.tsx, LoadingScreen.tsx, LoginPage.tsx, AdminModal.tsx, QuestionsTableComponents.tsx, StatusBoard.tsx, LanguageSelectionScreen.tsx, SignupPage.tsx, VerifyEmailPage.tsx, ErrorBoundary.tsx, SidebarLayout.tsx, ExamLayout.tsx, NotificationPanel.tsx |
| color-border-default | KEEP | index.css:70 | 0 | 11 | 0 | 0 | 0 | 2 | TopicSectionRenderer.tsx, TopicReader.tsx |
| color-border-subtle | FREEZE PROTECTED | index.css:69 | 2 | 234 | 0 | 0 | 0 | 0 | SignupPage.tsx, ExamListSection.tsx, SubjectInsightsCard.tsx, ResultsPage.tsx, ExamSubComponents.tsx, LeaderboardTabletCard.tsx, LoginPage.tsx, AdminSelectionTabs.tsx, LeaderboardComponents.tsx, VerifyEmailPage.tsx, BulkActionBar.tsx, ExamQuestionAnalysis.tsx, UploadProgressOverlay.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, ProfileForm.tsx, Pagination.tsx, LeaderboardMobileCard.tsx, TeacherExamFilterBar.tsx, ParsedPreview.tsx, CreateStepReview.tsx, QuestionForm.tsx, RankBadge.tsx, CreateStepJsonPaste.tsx, SessionSection.tsx, AttemptCardBase.tsx, SettingsCard.tsx, ExamDetailSection.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, CreateStepPublish.tsx, FormattedBodyText.tsx, ExamStudentTable.tsx, TopicReader.tsx, QuestionOptions.tsx, AddExamModal.tsx, SelectionView.tsx, CreateStepPrompt.tsx, StartTestButton.tsx, Navigation.tsx, QuestionCard.tsx, PreviewTab.tsx, PreparationView.tsx, TopicMetadataFields.tsx, SubAdminCreate.tsx, AdminLeaderboard.tsx, CollectionCard.tsx, AntigravityData.tsx, SubAdminMobileCard.tsx, ReviewQuestionCard.tsx, ReviewLayout.tsx, ProfileHeader.tsx, BackupSection.tsx, AntigravityButton.tsx, SuccessView.tsx, ExamView.tsx, CreateStepSetup.tsx, CompactDateTimePicker.tsx, TestConfigView.tsx, ExamHeader.tsx, Unauthorized.tsx, AntigravityDashboard.tsx, Menu.tsx, AdminModal.tsx, LeaderboardTable.tsx, QuestionVisualizer.tsx, ThemeToggle.tsx, ExamDetailModal.tsx, AntigravityResults.tsx, QuestionsTableComponents.tsx, SubjectCardItem.tsx, ExamParamsForm.tsx, MethodSelectionView.tsx, StatusBoard.tsx, SubmitExamModal.tsx, useActiveExam.tsx, SharedComponents.tsx, SegmentedFilter.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, QuestionPalette.tsx, SignupPage.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, ErrorBoundary.tsx, SubAdminStudents.tsx, SidebarLayout.tsx, StudentsTable.tsx, NotificationSection.tsx, ExamSummaryCards.tsx, QuestionActions.tsx, QuestionNavigator.tsx, PremiumSelect.tsx, IdentitySection.tsx |
| color-button-border-ghost | FREEZE PROTECTED | index.css:129 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-border-secondary | FREEZE PROTECTED | index.css:122 | 0 | 4 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-surface-ghost | FREEZE PROTECTED | index.css:125 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-surface-ghost-hover | FREEZE PROTECTED | index.css:126 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-surface-secondary | FREEZE PROTECTED | index.css:119 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-surface-secondary-hover | FREEZE PROTECTED | index.css:120 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-text-ghost | FREEZE PROTECTED | index.css:127 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-text-ghost-hover | FREEZE PROTECTED | index.css:128 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-button-text-secondary | FREEZE PROTECTED | index.css:121 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| color-card-auth-light-border | FREEZE PROTECTED | index.css:112 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityCard.tsx |
| color-card-auth-light-surface | FREEZE PROTECTED | index.css:111 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityCard.tsx |
| color-card-bg | FREEZE PROTECTED | index.css:51 | 0 | 68 | 0 | 0 | 0 | 1 | TopicInfoButton.tsx, DiagramRenderer.tsx, Pagination.tsx, CreateStepReview.tsx, CreateStepJsonPaste.tsx, ExamDetailSection.tsx, LeaderboardView.tsx, CreateStepPublish.tsx, ExamStudentTable.tsx, TopicReader.tsx, ExamSubComponents.tsx, AddExamModal.tsx, SelectionView.tsx, CreateStepPrompt.tsx, QuestionCard.tsx, useToast.tsx, AdminLeaderboard.tsx, AntigravityData.tsx, ReviewLayout.tsx, SuccessView.tsx, CreateStepSetup.tsx, CompactDateTimePicker.tsx, TestConfigView.tsx, ExamHeader.tsx, Unauthorized.tsx, AdminModal.tsx, QuestionVisualizer.tsx, ThemeToggle.tsx, ExamDetailModal.tsx, UploadProgressOverlay.tsx, StatusBoard.tsx, RecruitmentSection.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, QuestionPalette.tsx, SignupPage.tsx, LeaderboardUserCard.tsx, AdminTopicPreviewRenderer.tsx, VerifyEmailPage.tsx, ErrorBoundary.tsx, SubAdminStudents.tsx, SidebarLayout.tsx, BulkActionBar.tsx, QuestionNavigator.tsx, ProfileHeader.tsx |
| color-card-border | FREEZE PROTECTED | index.css:99 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityCard.tsx |
| color-card-premium-border | FREEZE PROTECTED | index.css:106 | 0 | 6 | 0 | 0 | 0 | 0 | AntigravityLayout.tsx, ThemeToggle.tsx, AntigravityCard.tsx |
| color-card-premium-surface | FREEZE PROTECTED | index.css:105 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityCard.tsx |
| color-checkbox-border | FREEZE PROTECTED | index.css:151 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-checkbox-border-checked | FREEZE PROTECTED | index.css:155 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-checkbox-border-focus | FREEZE PROTECTED | index.css:153 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-checkbox-border-hover | FREEZE PROTECTED | index.css:152 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-checkbox-surface | FREEZE PROTECTED | index.css:150 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-checkbox-surface-checked | FREEZE PROTECTED | index.css:154 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-danger | FREEZE PROTECTED | themes.css:446; themes.css:730; index.css:45 | 1 | 128 | 3 | 1 | 0 | 7 | SignupPage.tsx, ProfileForm.tsx, QuestionOptions.tsx, PreparationView.tsx, AntigravityData.tsx, ReviewQuestionCard.tsx, TeacherExamCard.tsx, AntigravityButton.tsx, TopicListItem.tsx, IconBadge.tsx, Unauthorized.tsx, ExamDetailModal.tsx, AntigravityResults.tsx, QuestionsTableComponents.tsx, SubmitExamModal.tsx, QuestionCard.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, Alert.tsx, SubAdminStudents.tsx, JsonTab.tsx, AccountDisabledPage.tsx, QuestionNavigator.tsx, SubjectInsightsCard.tsx, QuestionForm.tsx, AddExamModal.tsx, PreviewTab.tsx, TopicMetadataFields.tsx, useToast.tsx, LangInputPanel.tsx, LoginPage.tsx, CreateStepSetup.tsx, PromptEditorModal.tsx, UpdatePasswordPage.tsx, ExamParamsForm.tsx, AntigravityCard.tsx, SignupPage.tsx, AntigravityTypography.tsx, AdminSubAdminsView.tsx, AdminLayout.tsx, FinishSignInPage.tsx, IdentitySection.tsx, SubjectInsightItem.tsx, index.css, themes.css |
| color-danger-hover | SAFE REMOVE | themes.css:447; themes.css:731 | 0 | 0 | 1 | 0 | 0 | 0 | themes.css |
| color-danger-subtle | SAFE REMOVE | themes.css:448; themes.css:732 | 0 | 0 | 2 | 0 | 0 | 1 | index.css, themes.css |
| color-elevated-bg | KEEP | index.css:52 | 0 | 1 | 0 | 0 | 0 | 0 | ExamTimer.tsx |
| color-filter-border | FREEZE PROTECTED | index.css:141 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-filter-border-active | FREEZE PROTECTED | index.css:146 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-filter-border-hover | FREEZE PROTECTED | index.css:143 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-filter-surface | FREEZE PROTECTED | index.css:140 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-filter-surface-active | FREEZE PROTECTED | index.css:144 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-filter-text | FREEZE PROTECTED | index.css:142 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-filter-text-active | FREEZE PROTECTED | index.css:145 | 0 | 1 | 0 | 0 | 0 | 0 | CollectionFilter.tsx |
| color-gold-300 | FREEZE PROTECTED | index.css:73 | 0 | 1 | 0 | 0 | 0 | 3 | AntigravityCard.tsx |
| color-hover-bg | FREEZE PROTECTED | index.css:53 | 0 | 124 | 0 | 0 | 0 | 0 | DiagramRenderer.tsx, AntigravityForm.tsx, LeaderboardMobileCard.tsx, ParsedPreview.tsx, QuestionForm.tsx, RankBadge.tsx, QuestionsTable.tsx, AttemptCardBase.tsx, SettingsCard.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, FormattedBodyText.tsx, ExamStudentTable.tsx, QuestionOptions.tsx, AddExamModal.tsx, CreateStepPrompt.tsx, Navigation.tsx, QuestionCard.tsx, PreviewTab.tsx, PreparationView.tsx, AntigravityData.tsx, ReviewQuestionCard.tsx, ReviewLayout.tsx, ProfileHeader.tsx, AntigravityButton.tsx, SuccessView.tsx, ExamView.tsx, CreateStepSetup.tsx, LeaderboardComponents.tsx, CompactDateTimePicker.tsx, IconBadge.tsx, TestConfigView.tsx, AntigravityDashboard.tsx, Menu.tsx, LeaderboardTable.tsx, QuestionVisualizer.tsx, ThemeToggle.tsx, ExamDetailModal.tsx, AntigravityResults.tsx, SubjectCardItem.tsx, ExamParamsForm.tsx, SubmitExamModal.tsx, useActiveExam.tsx, SharedComponents.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, BilingualToggle.tsx, ExamDetailRow.tsx, SidebarLayout.tsx, FinishSignInPage.tsx, AccountDisabledPage.tsx, TopicCard.tsx, QuestionNavigator.tsx, PremiumSelect.tsx |
| color-info | FREEZE PROTECTED | themes.css:449; themes.css:733; index.css:47 | 1 | 2 | 0 | 0 | 0 | 9 | SignupPage.tsx, StatusBoard.tsx, AntigravityCard.tsx |
| color-info-subtle | SAFE REMOVE | themes.css:450; themes.css:734 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| color-input-bg | FREEZE PROTECTED | index.css:131 | 0 | 4 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, PremiumSelect.tsx |
| color-input-border | FREEZE PROTECTED | index.css:133 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, PremiumSelect.tsx |
| color-input-border-active | FREEZE PROTECTED | index.css:137 | 0 | 1 | 0 | 0 | 0 | 0 | PremiumSelect.tsx |
| color-input-border-hover-active | FREEZE PROTECTED | index.css:138 | 0 | 1 | 0 | 0 | 0 | 0 | PremiumSelect.tsx |
| color-input-focus-border | FREEZE PROTECTED | index.css:134 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-input-surface-active | FREEZE PROTECTED | index.css:135 | 0 | 1 | 0 | 0 | 0 | 0 | PremiumSelect.tsx |
| color-input-text | FREEZE PROTECTED | index.css:132 | 0 | 4 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, PremiumSelect.tsx |
| color-input-text-active | FREEZE PROTECTED | index.css:136 | 0 | 1 | 0 | 0 | 0 | 0 | PremiumSelect.tsx |
| color-primary | FREEZE PROTECTED | index.css:41 | 0 | 407 | 0 | 0 | 0 | 4 | TopicInfoButton.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, ProfileForm.tsx, SubjectInsightsCard.tsx, ParsedPreview.tsx, QuestionForm.tsx, AttemptCardBase.tsx, SettingsCard.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, CreateStepPublish.tsx, FormattedBodyText.tsx, TopicReader.tsx, QuestionOptions.tsx, AddExamModal.tsx, ResultView.tsx, CreateStepPrompt.tsx, Navigation.tsx, QuestionCard.tsx, PreparationView.tsx, LangInputPanel.tsx, CollectionCard.tsx, AntigravityData.tsx, SubAdminMobileCard.tsx, ReviewQuestionCard.tsx, UserLeaderboard.tsx, InstructionsTab.tsx, ReviewLayout.tsx, TeacherExamCard.tsx, ProfileHeader.tsx, AIToolCards.tsx, AntigravityButton.tsx, TopicListItem.tsx, LoadingScreen.tsx, SuccessView.tsx, LeaderboardComponents.tsx, AdminIconWrap.tsx, CompactDateTimePicker.tsx, IconBadge.tsx, TestConfigView.tsx, UploadContextPanel.tsx, AntigravityDashboard.tsx, Menu.tsx, ExamDetailModal.tsx, AntigravityResults.tsx, SubjectCardItem.tsx, StatusBoard.tsx, RecruitmentSection.tsx, LanguageSelectionScreen.tsx, LeaderboardUserCard.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, VerifyEmailPage.tsx, BilingualToggle.tsx, CarouselDots.tsx, Alert.tsx, ErrorBoundary.tsx, SidebarLayout.tsx, TopicCard.tsx, QuestionNavigator.tsx, PremiumSelect.tsx, ExamQuestionAnalysis.tsx, ExamListSection.tsx, Pagination.tsx, LeaderboardMobileCard.tsx, SessionSection.tsx, ExamDetailSection.tsx, AntigravityLayout.tsx, ExamStudentTable.tsx, PreviewTab.tsx, StudentDetailModal.tsx, LeaderboardTabletCard.tsx, AdminTopics.tsx, RecentExamItem.tsx, PerformanceCharts.tsx, CollectionFilter.tsx, BackupSection.tsx, ExamView.tsx, SubAdminLayout.tsx, ExamHeader.tsx, QuestionsTableComponents.tsx, ExamParamsForm.tsx, UploadProgressOverlay.tsx, MethodSelectionView.tsx, UserLayout.tsx, SegmentedFilter.tsx, TeacherLeaderboardModal.tsx, AntigravityCard.tsx, SignupPage.tsx, StudentsTable.tsx, NotificationSection.tsx, ExamSummaryCards.tsx, IdentitySection.tsx, CreateStepJsonPaste.tsx, CreateStepSetup.tsx, Spinner.tsx, ThemeToggle.tsx |
| color-primary-hover | SAFE REMOVE | index.css:42 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| color-radio-border | FREEZE PROTECTED | index.css:158 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-radio-border-checked | FREEZE PROTECTED | index.css:160 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-radio-border-hover | FREEZE PROTECTED | index.css:159 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-radio-dot-checked | FREEZE PROTECTED | index.css:161 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-radio-surface | FREEZE PROTECTED | index.css:157 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-radio-track-surface | FREEZE PROTECTED | index.css:162 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-secondary | FREEZE PROTECTED | themes.css:436; themes.css:720; index.css:43 | 1 | 30 | 1 | 0 | 0 | 10 | AntigravityCard.tsx, QuestionForm.tsx, RankBadge.tsx, LeaderboardView.tsx, AntigravityData.tsx, AIToolCards.tsx, LoadingScreen.tsx, IconBadge.tsx, ExamDetailModal.tsx, SubjectCardItem.tsx, VerifyEmailPage.tsx, LeaderboardMobileCard.tsx, InstructionsTab.tsx, QuestionsTableComponents.tsx, MethodSelectionView.tsx, ReviewLayout.tsx, ErrorBoundary.tsx, index.css, themes.css |
| color-secondary-light | KEEP | themes.css:437; themes.css:721 | 0 | 0 | 3 | 0 | 0 | 1 | index.css, themes.css |
| color-sidebar | FREEZE PROTECTED | index.css:196 | 0 | 2 | 0 | 0 | 0 | 2 | Navigation.tsx |
| color-stat-card-border | FREEZE PROTECTED | index.css:168 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityCard.tsx, AntigravityData.tsx |
| color-stat-icon-bg | FREEZE PROTECTED | index.css:171 | 0 | 3 | 0 | 0 | 0 | 0 | PremiumIconContainer.tsx, AntigravityCard.tsx |
| color-stat-icon-color | FREEZE PROTECTED | index.css:172 | 0 | 3 | 0 | 0 | 0 | 0 | PremiumIconContainer.tsx, AntigravityCard.tsx |
| color-stat-label-text | FREEZE PROTECTED | index.css:170 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityCard.tsx |
| color-stat-value | KEEP | index.css:197 | 0 | 3 | 0 | 0 | 0 | 4 | LoginPage.tsx |
| color-stat-value-text | FREEZE PROTECTED | index.css:169 | 0 | 1 | 0 | 0 | 0 | 1 | AntigravityCard.tsx |
| color-success | FREEZE PROTECTED | themes.css:440; themes.css:724; index.css:44 | 1 | 95 | 3 | 1 | 0 | 11 | SignupPage.tsx, ProfileForm.tsx, QuestionForm.tsx, QuestionOptions.tsx, PreparationView.tsx, AdminTopics.tsx, AntigravityData.tsx, ReviewQuestionCard.tsx, ProfileHeader.tsx, AIToolCards.tsx, AntigravityButton.tsx, TopicListItem.tsx, IconBadge.tsx, TestConfigView.tsx, ExamDetailModal.tsx, AntigravityResults.tsx, StatusBoard.tsx, QuestionCard.tsx, Alert.tsx, SubjectInsightsCard.tsx, ParsedPreview.tsx, AttemptCardBase.tsx, PreviewTab.tsx, useToast.tsx, InstructionsTab.tsx, LeaderboardComponents.tsx, RecruitmentSection.tsx, AntigravityCard.tsx, SignupPage.tsx, LeaderboardUserCard.tsx, SubjectInsightItem.tsx, QuestionPalette.tsx, index.css, themes.css |
| color-success-hover | SAFE REMOVE | themes.css:441; themes.css:725 | 0 | 0 | 1 | 0 | 0 | 0 | themes.css |
| color-success-subtle | SAFE REMOVE | themes.css:442; themes.css:726 | 0 | 0 | 2 | 0 | 0 | 1 | index.css, themes.css |
| color-text-disabled | KEEP | index.css:61 | 0 | 3 | 0 | 0 | 0 | 0 | ReviewQuestionCard.tsx, ReviewLayout.tsx |
| color-text-hint | FREEZE PROTECTED | index.css:60 | 0 | 15 | 0 | 0 | 0 | 0 | DiagramRenderer.tsx, ResultsPage.tsx, QuestionForm.tsx, AdminTopics.tsx, StatisticsSection.tsx, AntigravityCard.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, VerifyEmailPage.tsx, AccountDisabledPage.tsx |
| color-text-muted | FREEZE PROTECTED | index.css:59 | 0 | 93 | 0 | 0 | 0 | 0 | DiagramRenderer.tsx, AntigravityForm.tsx, SubjectInsightsCard.tsx, Pagination.tsx, LeaderboardMobileCard.tsx, TeacherExamFilterBar.tsx, AdminSettings.tsx, QuestionForm.tsx, RankBadge.tsx, LeaderboardView.tsx, AntigravityLayout.tsx, ResultView.tsx, PreviewTab.tsx, TopicMetadataFields.tsx, LeaderboardTabletCard.tsx, AdminLeaderboard.tsx, SubAdminMobileCard.tsx, InstructionsTab.tsx, ReviewLayout.tsx, TeacherExamCard.tsx, PerformanceCharts.tsx, ProfileHeader.tsx, CollectionFilter.tsx, TopicListItem.tsx, TopicsToolbar.tsx, LeaderboardComponents.tsx, IconBadge.tsx, TestConfigView.tsx, QuestionVisualizer.tsx, AdminUsers.tsx, StatusBoard.tsx, SubmitExamModal.tsx, QuestionCard.tsx, ExamPaperGrid.tsx, TeacherLeaderboardModal.tsx, TopicPortalView.tsx, LanguageSelectionScreen.tsx, LeaderboardUserCard.tsx, ExamTimer.tsx, NotificationPanel.tsx, ExamDetailRow.tsx, AntigravityTypography.tsx, AdminSubAdminsView.tsx, BulkActionBar.tsx, CollectionHeader.tsx, PremiumSelect.tsx, SingleQuestionModal.tsx, PerformanceSectionHeader.tsx |
| color-text-on-dark | KEEP | index.css:63 | 0 | 1 | 0 | 0 | 0 | 0 | WelcomeBanner.tsx |
| color-text-placeholder | FREEZE PROTECTED | index.css:62 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| color-text-primary | FREEZE PROTECTED | index.css:56 | 0 | 211 | 0 | 0 | 0 | 0 | TopicInfoButton.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, ExamListSection.tsx, ResultsPage.tsx, Pagination.tsx, LeaderboardMobileCard.tsx, ParsedPreview.tsx, CreateStepReview.tsx, QuestionForm.tsx, CreateStepJsonPaste.tsx, SessionSection.tsx, AttemptCardBase.tsx, SettingsCard.tsx, ExamDetailSection.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, CreateStepPublish.tsx, FormattedBodyText.tsx, ExamStudentTable.tsx, TopicListView.tsx, TopicReader.tsx, ExamSubComponents.tsx, QuestionOptions.tsx, AddExamModal.tsx, SelectionView.tsx, ResultView.tsx, MathBlock.tsx, Navigation.tsx, QuestionCard.tsx, PreviewTab.tsx, StudentDetailModal.tsx, PreparationView.tsx, SubAdminCreate.tsx, LeaderboardTabletCard.tsx, useToast.tsx, SubjectPortalView.tsx, CollectionCard.tsx, AntigravityData.tsx, SubAdminMobileCard.tsx, RecentExamItem.tsx, ReviewQuestionCard.tsx, ActiveExamPage.tsx, InstructionsTab.tsx, ReviewLayout.tsx, TeacherExamCard.tsx, PerformanceCharts.tsx, ProfileHeader.tsx, CollectionFilter.tsx, AntigravityButton.tsx, TopicListItem.tsx, SuccessView.tsx, ExamView.tsx, LoginPage.tsx, CreateStepSetup.tsx, LeaderboardComponents.tsx, CompactDateTimePicker.tsx, TestConfigView.tsx, ExamHeader.tsx, Unauthorized.tsx, Menu.tsx, UsersTable.tsx, QuestionVisualizer.tsx, ThemeToggle.tsx, ExamDetailModal.tsx, AntigravityResults.tsx, AdminUsers.tsx, UploadProgressOverlay.tsx, StatusBoard.tsx, RecruitmentSection.tsx, SubmitExamModal.tsx, RecentAttemptItem.tsx, SharedComponents.tsx, TeacherLeaderboardModal.tsx, TopicPortalView.tsx, MermaidDiagram.tsx, LanguageSelectionScreen.tsx, SignupPage.tsx, LeaderboardUserCard.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, BilingualToggle.tsx, ExamDetailRow.tsx, ErrorBoundary.tsx, AntigravityTypography.tsx, SubAdminStudents.tsx, SidebarLayout.tsx, BulkActionBar.tsx, StudentsTable.tsx, ExamSummaryCards.tsx, TopicCard.tsx, PremiumSelect.tsx, SingleQuestionModal.tsx, ExamQuestionAnalysis.tsx, SubjectInsightItem.tsx |
| color-text-secondary | FREEZE PROTECTED | index.css:58 | 1 | 192 | 0 | 0 | 0 | 0 | SignupPage.tsx, DiagramRenderer.tsx, AdminTopics.tsx, ExamDetailModal.tsx, NotificationPanel.tsx, AntigravityForm.tsx, ExamListSection.tsx, SubjectInsightsCard.tsx, ResultsPage.tsx, Pagination.tsx, LeaderboardMobileCard.tsx, TeacherExamFilterBar.tsx, ParsedPreview.tsx, CreateStepReview.tsx, QuestionForm.tsx, RankBadge.tsx, QuestionsTable.tsx, AttemptCardBase.tsx, ExamDetailSection.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, AntigravityLayout.tsx, CreateStepPublish.tsx, FormattedBodyText.tsx, ExamStudentTable.tsx, TopicListView.tsx, TopicReader.tsx, ExamSubComponents.tsx, QuestionOptions.tsx, AddExamModal.tsx, CreateStepPrompt.tsx, StartTestButton.tsx, Navigation.tsx, QuestionCard.tsx, PreviewTab.tsx, PreparationView.tsx, LeaderboardTabletCard.tsx, ExamPageLoading.tsx, LangInputPanel.tsx, AntigravityData.tsx, SubAdminMobileCard.tsx, ReviewQuestionCard.tsx, ActiveExamPage.tsx, InstructionsTab.tsx, UserTopics.tsx, ReviewLayout.tsx, PerformanceCharts.tsx, ProfileHeader.tsx, AIToolCards.tsx, TopicListItem.tsx, LoadingScreen.tsx, SuccessView.tsx, LoginPage.tsx, CreateStepSetup.tsx, LeaderboardComponents.tsx, CompactDateTimePicker.tsx, TestConfigView.tsx, Unauthorized.tsx, AntigravityDashboard.tsx, AdminModal.tsx, LeaderboardTable.tsx, QuestionVisualizer.tsx, ThemeToggle.tsx, AntigravityResults.tsx, UploadProgressOverlay.tsx, SubmitExamModal.tsx, SharedComponents.tsx, SegmentedFilter.tsx, LanguageSelectionScreen.tsx, SignupPage.tsx, UserIdentity.tsx, AdminTopicPreviewRenderer.tsx, VerifyEmailPage.tsx, BilingualToggle.tsx, ErrorBoundary.tsx, AntigravityTypography.tsx, SubAdminStudents.tsx, AdminSubAdminsView.tsx, SidebarLayout.tsx, BulkActionBar.tsx, QuestionActions.tsx, TopicCard.tsx, QuestionNavigator.tsx, PremiumSelect.tsx, ExamQuestionAnalysis.tsx |
| color-text-title | FREEZE PROTECTED | index.css:57 | 0 | 14 | 0 | 0 | 0 | 4 | TopicSectionRenderer.tsx, AntigravityLayout.tsx, TopicListView.tsx, TopicReader.tsx, AntigravityData.tsx, AdminModal.tsx, SubjectCardItem.tsx, AntigravityTypography.tsx, TopicCard.tsx |
| color-warning | FREEZE PROTECTED | themes.css:443; themes.css:727; index.css:46 | 1 | 75 | 1 | 0 | 0 | 5 | SignupPage.tsx, QuestionForm.tsx, RankBadge.tsx, LeaderboardView.tsx, PreparationView.tsx, AntigravityData.tsx, ReviewQuestionCard.tsx, PerformanceCharts.tsx, IconBadge.tsx, ExamDetailModal.tsx, StatusBoard.tsx, QuestionCard.tsx, Alert.tsx, WelcomeBanner.tsx, LeaderboardMobileCard.tsx, PreviewTab.tsx, RecentExamItem.tsx, AntigravityCard.tsx, index.css, themes.css |
| color-warning-hover | SAFE REMOVE | themes.css:444; themes.css:728 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| color-warning-subtle | SAFE REMOVE | themes.css:445; themes.css:729 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| cyan-100 | SAFE REMOVE | themes.css:146 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| cyan-200 | SAFE REMOVE | themes.css:147 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| cyan-300 | SAFE REMOVE | themes.css:148 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| cyan-400 | SAFE REMOVE | themes.css:149 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| cyan-50 | SAFE REMOVE | themes.css:145 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| cyan-500 | SAFE REMOVE | themes.css:150 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| cyan-600 | SAFE REMOVE | themes.css:151 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| cyan-700 | SAFE REMOVE | themes.css:152 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| cyan-800 | SAFE REMOVE | themes.css:153 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| cyan-900 | SAFE REMOVE | themes.css:154 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| cyan-950 | SAFE REMOVE | themes.css:155 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| danger | MERGE | index.css:278 | 9 | 128 | 0 | 0 | 0 | 16 | TopicReader.tsx, SelectionView.tsx, ResultView.tsx, StudentDetailModal.tsx, AntigravityData.tsx, ReviewLayout.tsx, ExamPaperCard.tsx, SubAdminDashboard.tsx, ProfileForm.tsx, QuestionOptions.tsx, PreparationView.tsx, AntigravityData.tsx, ReviewQuestionCard.tsx, TeacherExamCard.tsx, AntigravityButton.tsx, TopicListItem.tsx, IconBadge.tsx, Unauthorized.tsx, ExamDetailModal.tsx, AntigravityResults.tsx, QuestionsTableComponents.tsx, SubmitExamModal.tsx, QuestionCard.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, Alert.tsx, SubAdminStudents.tsx, JsonTab.tsx, AccountDisabledPage.tsx, QuestionNavigator.tsx, SubjectInsightsCard.tsx, QuestionForm.tsx, AddExamModal.tsx, PreviewTab.tsx, TopicMetadataFields.tsx, useToast.tsx, LangInputPanel.tsx, LoginPage.tsx, CreateStepSetup.tsx, PromptEditorModal.tsx, UpdatePasswordPage.tsx, ExamParamsForm.tsx, AntigravityCard.tsx, SignupPage.tsx, AntigravityTypography.tsx, AdminSubAdminsView.tsx, AdminLayout.tsx, FinishSignInPage.tsx, IdentitySection.tsx, SubjectInsightItem.tsx, index.css |
| dark-100 | SAFE REMOVE | themes.css:226 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| dark-200 | SAFE REMOVE | themes.css:227 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| dark-50 | SAFE REMOVE | themes.css:225 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| divider-color | SAFE REMOVE | themes.css:509; themes.css:854 | 0 | 0 | 1 | 0 | 0 | 2 | themes.css |
| divider-width | SAFE REMOVE | themes.css:510; themes.css:855 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| dropdown-bg | SAFE REMOVE | themes.css:970 | 0 | 0 | 0 | 0 | 0 | 4 |  |
| dropdown-border | SAFE REMOVE | themes.css:971 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| dropdown-item-hover | SAFE REMOVE | themes.css:974 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| dropdown-item-radius | SAFE REMOVE | themes.css:975 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| dropdown-offset | SAFE REMOVE | themes.css:976 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| dropdown-radius | SAFE REMOVE | themes.css:973 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| dropdown-shadow | SAFE REMOVE | themes.css:972 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| dropdown-z | SAFE REMOVE | themes.css:977 | 0 | 0 | 0 | 0 | 0 | 10 |  |
| elevated-bg | SAFE REMOVE | index.css:266 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| elevation-1 | FREEZE PROTECTED | themes.css:461; themes.css:747 | 0 | 3 | 12 | 9 | 0 | 10 | AntigravityForm.tsx, AntigravityData.tsx, AntigravityCard.tsx, index.css, themes.css |
| elevation-2 | FREEZE PROTECTED | themes.css:462; themes.css:748 | 0 | 10 | 11 | 2 | 0 | 31 | AntigravityForm.tsx, AntigravityButton.tsx, AccountDisabledPage.tsx, index.css, themes.css |
| elevation-3 | FREEZE PROTECTED | themes.css:463; themes.css:749 | 0 | 11 | 10 | 6 | 0 | 11 | AntigravityButton.tsx, QuestionCard.tsx, AntigravityCard.tsx, SignupPage.tsx, index.css, themes.css |
| elevation-4 | FREEZE PROTECTED | themes.css:464; themes.css:750 | 0 | 2 | 3 | 2 | 0 | 10 | Menu.tsx, PremiumSelect.tsx, index.css |
| elevation-5 | SAFE REMOVE | themes.css:465; themes.css:751 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| elevation-6 | SAFE REMOVE | themes.css:466; themes.css:752 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| elevation-7 | SAFE REMOVE | themes.css:467; themes.css:753 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| elevation-canvas | SAFE REMOVE | themes.css:596; themes.css:835 | 0 | 0 | 0 | 0 | 0 | 4 |  |
| elevation-carved | MERGE | themes.css:813 | 1 | 3 | 4 | 0 | 0 | 49 | PremiumIconContainer.tsx, SharedComponents.tsx, PremiumIconContainer.tsx, index.css, themes.css |
| elevation-floating | SAFE REMOVE | themes.css:600; themes.css:839 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| elevation-interactive | SAFE REMOVE | themes.css:599; themes.css:838 | 0 | 0 | 0 | 0 | 0 | 4 |  |
| elevation-modal | SAFE REMOVE | themes.css:602; themes.css:841 | 0 | 0 | 0 | 0 | 0 | 4 |  |
| elevation-overlay | SAFE REMOVE | themes.css:603; themes.css:842 | 0 | 0 | 0 | 0 | 0 | 7 |  |
| elevation-popover | SAFE REMOVE | themes.css:601; themes.css:840 | 0 | 0 | 1 | 0 | 0 | 3 | themes.css |
| elevation-raised | KEEP | themes.css:598; themes.css:837 | 0 | 0 | 2 | 1 | 0 | 10 | index.css, themes.css |
| elevation-surface | KEEP | themes.css:597; themes.css:836 | 0 | 0 | 1 | 1 | 0 | 7 | index.css |
| emerald-100 | SAFE REMOVE | themes.css:120 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| emerald-200 | SAFE REMOVE | themes.css:121 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| emerald-300 | SAFE REMOVE | themes.css:122 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| emerald-400 | SAFE REMOVE | themes.css:123 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| emerald-50 | SAFE REMOVE | themes.css:119 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| emerald-500 | SAFE REMOVE | themes.css:124 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| emerald-600 | SAFE REMOVE | themes.css:125 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| emerald-700 | SAFE REMOVE | themes.css:126 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| emerald-800 | SAFE REMOVE | themes.css:127 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| emerald-900 | SAFE REMOVE | themes.css:128 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| emerald-950 | SAFE REMOVE | themes.css:129 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| filter-border | FREEZE PROTECTED | themes.css:954 | 0 | 1 | 1 | 0 | 0 | 6 | CollectionFilter.tsx, index.css |
| filter-border-active | FREEZE PROTECTED | themes.css:959 | 0 | 1 | 1 | 0 | 0 | 0 | CollectionFilter.tsx, index.css |
| filter-border-hover | FREEZE PROTECTED | themes.css:956 | 0 | 1 | 1 | 0 | 0 | 1 | CollectionFilter.tsx, index.css |
| filter-shadow | FREEZE PROTECTED | themes.css:960; themes.css:1238 | 0 | 1 | 1 | 0 | 0 | 6 | CollectionFilter.tsx, index.css |
| filter-shadow-hover | FREEZE PROTECTED | themes.css:961; themes.css:1239 | 0 | 1 | 1 | 0 | 0 | 0 | CollectionFilter.tsx, index.css |
| filter-surface | FREEZE PROTECTED | themes.css:953 | 0 | 1 | 1 | 0 | 0 | 6 | CollectionFilter.tsx, index.css |
| filter-surface-active | FREEZE PROTECTED | themes.css:957 | 0 | 1 | 1 | 0 | 0 | 1 | CollectionFilter.tsx, index.css |
| filter-text | FREEZE PROTECTED | themes.css:955 | 0 | 1 | 1 | 0 | 0 | 0 | CollectionFilter.tsx, index.css |
| filter-text-active | FREEZE PROTECTED | themes.css:958 | 0 | 1 | 1 | 0 | 0 | 0 | CollectionFilter.tsx, index.css |
| focus-ring-color | KEEP | themes.css:483; themes.css:769 | 0 | 0 | 7 | 4 | 0 | 4 | index.css, themes.css |
| focus-ring-offset | KEEP | themes.css:485; themes.css:771 | 0 | 0 | 0 | 1 | 0 | 0 |  |
| focus-ring-width | KEEP | themes.css:484; themes.css:770 | 0 | 0 | 2 | 1 | 0 | 1 | themes.css |
| font-mono | SAFE REMOVE | themes.css:326 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| font-sans | KEEP | themes.css:325 | 0 | 0 | 6 | 6 | 0 | 2 | index.css |
| forest-100 | SAFE REMOVE | themes.css:206 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| forest-200 | SAFE REMOVE | themes.css:207 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| forest-300 | SAFE REMOVE | themes.css:208 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| forest-400 | SAFE REMOVE | themes.css:209 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| forest-50 | SAFE REMOVE | themes.css:205 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| forest-500 | SAFE REMOVE | themes.css:210 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| forest-600 | SAFE REMOVE | themes.css:211 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| forest-700 | SAFE REMOVE | themes.css:212 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| forest-800 | SAFE REMOVE | themes.css:213 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| forest-900 | KEEP | themes.css:214 | 2 | 0 | 1 | 0 | 0 | 7 | WelcomeBanner.tsx, themes.css |
| forest-950 | SAFE REMOVE | themes.css:215 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| fw-bold | SAFE REMOVE | index.css:242 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| fw-medium | SAFE REMOVE | index.css:243 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| fw-regular | SAFE REMOVE | index.css:245 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| fw-semibold | SAFE REMOVE | index.css:244 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| glow-danger | SAFE REMOVE | themes.css:580; themes.css:880 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| glow-warning | SAFE REMOVE | themes.css:579; themes.css:879 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gold-100 | KEEP | themes.css:219 | 2 | 0 | 0 | 0 | 0 | 1 | SplashPage.tsx |
| gold-200 | KEEP | themes.css:220 | 5 | 0 | 0 | 0 | 0 | 6 | CarouselDots.tsx, SplashPage.tsx |
| gold-300 | FREEZE PROTECTED | themes.css:221 | 13 | 1 | 5 | 0 | 0 | 8 | RankBadge.tsx, LeaderboardComponents.tsx, CarouselDots.tsx, SplashPage.tsx, AntigravityCard.tsx, index.css, themes.css |
| gold-400 | KEEP | themes.css:222 | 2 | 0 | 0 | 0 | 0 | 5 | SplashPage.tsx |
| gold-50 | SAFE REMOVE | themes.css:218 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| gradient-app | KEEP | themes.css:503; themes.css:788 | 0 | 0 | 1 | 1 | 0 | 3 | index.css |
| gradient-danger | SAFE REMOVE | themes.css:501; themes.css:785 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gradient-header | FREEZE PROTECTED | themes.css:505; themes.css:790 | 2 | 0 | 2 | 0 | 0 | 13 | PremiumIconContainer.tsx, themes.css |
| gradient-primary | SAFE REMOVE | themes.css:499; themes.css:783 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| gradient-sidebar | SAFE REMOVE | themes.css:506; themes.css:791 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gradient-success | SAFE REMOVE | themes.css:500; themes.css:784 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gradient-surface | KEEP | themes.css:504; themes.css:789 | 0 | 0 | 2 | 2 | 0 | 4 | index.css |
| gradient-warning | SAFE REMOVE | themes.css:502; themes.css:786 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gray-100 | SAFE REMOVE | themes.css:29 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gray-200 | SAFE REMOVE | themes.css:30 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gray-300 | SAFE REMOVE | themes.css:31 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gray-400 | SAFE REMOVE | themes.css:32 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gray-50 | SAFE REMOVE | themes.css:28 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gray-500 | SAFE REMOVE | themes.css:33 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gray-600 | SAFE REMOVE | themes.css:34 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gray-700 | SAFE REMOVE | themes.css:35 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| gray-800 | SAFE REMOVE | themes.css:36 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gray-900 | SAFE REMOVE | themes.css:37 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| gray-950 | SAFE REMOVE | themes.css:38 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| green-100 | SAFE REMOVE | themes.css:68 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| green-200 | SAFE REMOVE | themes.css:69 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| green-300 | SAFE REMOVE | themes.css:70 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| green-400 | SAFE REMOVE | themes.css:71 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| green-50 | SAFE REMOVE | themes.css:67 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| green-500 | SAFE REMOVE | themes.css:72 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| green-600 | SAFE REMOVE | themes.css:73 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| green-700 | SAFE REMOVE | themes.css:74 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| green-800 | SAFE REMOVE | themes.css:75 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| green-900 | SAFE REMOVE | themes.css:76 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| green-950 | SAFE REMOVE | themes.css:77 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| header-bg | KEEP | themes.css:992; themes.css:1202 | 0 | 0 | 1 | 1 | 0 | 0 | index.css |
| header-border | KEEP | themes.css:993; themes.css:1203 | 0 | 0 | 1 | 1 | 0 | 0 | index.css |
| header-shadow | KEEP | themes.css:994; themes.css:1204 | 0 | 0 | 3 | 3 | 0 | 2 | index.css |
| header-shadow-md | SAFE REMOVE | themes.css:1208 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| header-shadow-sm | KEEP | themes.css:1213 | 0 | 0 | 1 | 1 | 0 | 0 | index.css |
| hover-bg | SAFE REMOVE | index.css:267 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| icon-accent | KEEP | themes.css:471; themes.css:757 | 0 | 0 | 2 | 0 | 0 | 0 | themes.css |
| icon-danger | SAFE REMOVE | themes.css:474; themes.css:760 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| icon-default | SAFE REMOVE | themes.css:470; themes.css:756 | 0 | 0 | 1 | 0 | 0 | 0 | themes.css |
| icon-disabled | SAFE REMOVE | themes.css:472; themes.css:758 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| icon-info | SAFE REMOVE | themes.css:476; themes.css:762 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| icon-nav | SAFE REMOVE | themes.css:569; themes.css:869 | 0 | 0 | 1 | 0 | 0 | 0 | themes.css |
| icon-nav-active | SAFE REMOVE | themes.css:570; themes.css:870 | 0 | 0 | 1 | 0 | 0 | 0 | themes.css |
| icon-success | SAFE REMOVE | themes.css:473; themes.css:759 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| icon-warning | SAFE REMOVE | themes.css:475; themes.css:761 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| indigo-100 | SAFE REMOVE | themes.css:188 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| indigo-200 | SAFE REMOVE | themes.css:189 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| indigo-300 | SAFE REMOVE | themes.css:190 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| indigo-400 | SAFE REMOVE | themes.css:191 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| indigo-50 | SAFE REMOVE | themes.css:187 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| indigo-500 | SAFE REMOVE | themes.css:192 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| indigo-600 | SAFE REMOVE | themes.css:193 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| indigo-700 | SAFE REMOVE | themes.css:194 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| indigo-800 | SAFE REMOVE | themes.css:195 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| indigo-900 | SAFE REMOVE | themes.css:196 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| indigo-950 | SAFE REMOVE | themes.css:197 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| info | MERGE | index.css:280 | 1 | 2 | 0 | 0 | 0 | 8 | ReviewLayout.tsx, StatusBoard.tsx, AntigravityCard.tsx, index.css |
| input-bg | FREEZE PROTECTED | themes.css:910 | 0 | 4 | 1 | 0 | 0 | 4 | AntigravityForm.tsx, PremiumSelect.tsx, index.css |
| input-border | FREEZE PROTECTED | themes.css:912; index.css:269 | 0 | 2 | 0 | 0 | 0 | 28 | AntigravityForm.tsx, PremiumSelect.tsx, index.css |
| input-border-active | FREEZE PROTECTED | themes.css:919 | 0 | 1 | 1 | 0 | 0 | 1 | PremiumSelect.tsx, index.css |
| input-border-hover-active | FREEZE PROTECTED | themes.css:920 | 0 | 1 | 1 | 0 | 0 | 1 | PremiumSelect.tsx, index.css |
| input-disabled-bg | SAFE REMOVE | themes.css:1164 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| input-disabled-border | KEEP | themes.css:1166 | 0 | 0 | 1 | 1 | 0 | 1 | index.css |
| input-disabled-text | SAFE REMOVE | themes.css:1165 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| input-focus-border | FREEZE PROTECTED | themes.css:914 | 0 | 1 | 1 | 0 | 0 | 2 | AntigravityForm.tsx, index.css |
| input-focus-shadow | SAFE REMOVE | themes.css:915 | 0 | 0 | 0 | 0 | 0 | 5 |  |
| input-padding-x | SAFE REMOVE | themes.css:1161 | 0 | 0 | 0 | 0 | 0 | 2 |  |
| input-padding-y | SAFE REMOVE | themes.css:916 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| input-placeholder | SAFE REMOVE | themes.css:1162 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| input-radius | SAFE REMOVE | themes.css:913 | 0 | 0 | 0 | 0 | 0 | 2 |  |
| input-shadow | SAFE REMOVE | themes.css:1163 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| input-surface-active | FREEZE PROTECTED | themes.css:917 | 0 | 1 | 1 | 0 | 0 | 1 | PremiumSelect.tsx, index.css |
| input-text | FREEZE PROTECTED | themes.css:911 | 0 | 4 | 1 | 0 | 0 | 2 | AntigravityForm.tsx, PremiumSelect.tsx, index.css |
| input-text-active | FREEZE PROTECTED | themes.css:918 | 0 | 1 | 1 | 0 | 0 | 1 | PremiumSelect.tsx, index.css |
| lh-loose | SAFE REMOVE | themes.css:352 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| lh-none | SAFE REMOVE | themes.css:347 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| lh-normal | SAFE REMOVE | themes.css:350 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| lh-relaxed | SAFE REMOVE | themes.css:351 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| lh-snug | SAFE REMOVE | themes.css:349 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| lh-tight | SAFE REMOVE | themes.css:348 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| ls-normal | SAFE REMOVE | themes.css:357 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| ls-tight | SAFE REMOVE | themes.css:356 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| ls-tighter | SAFE REMOVE | themes.css:355 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| ls-ultra | SAFE REMOVE | themes.css:361 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| ls-wide | SAFE REMOVE | themes.css:358 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| ls-wider | SAFE REMOVE | themes.css:359 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| ls-widest | SAFE REMOVE | themes.css:360 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| management-accent | FREEZE PROTECTED | themes.css:1186; themes.css:1265 | 5 | 0 | 0 | 0 | 1 | 20 | AntigravityForm.tsx, CollectionFilter.tsx, AntigravityButton.tsx, ds003-runtime-audit.test.tsx |
| management-border | FREEZE PROTECTED | themes.css:1180; themes.css:1259 | 8 | 0 | 1 | 1 | 1 | 62 | AntigravityForm.tsx, CollectionFilter.tsx, Menu.tsx, AdminModal.tsx, SharedComponents.tsx, index.css, ds003-runtime-audit.test.tsx |
| management-border-active | FREEZE PROTECTED | themes.css:1183; themes.css:1262 | 1 | 0 | 0 | 0 | 0 | 7 | CollectionFilter.tsx |
| management-border-hover | FREEZE PROTECTED | themes.css:1182; themes.css:1261 | 2 | 0 | 0 | 0 | 0 | 8 | CollectionFilter.tsx, AntigravityCard.tsx |
| management-border-strong | FREEZE PROTECTED | themes.css:1181; themes.css:1260 | 3 | 0 | 0 | 0 | 0 | 12 | AntigravityLayout.tsx, AntigravityButton.tsx, AntigravityCard.tsx |
| management-shadow | FREEZE PROTECTED | themes.css:1184; themes.css:1263 | 8 | 0 | 1 | 1 | 0 | 35 | AntigravityLayout.tsx, CollectionFilter.tsx, AntigravityButton.tsx, Menu.tsx, SharedComponents.tsx, AntigravityCard.tsx, index.css |
| management-shadow-hover | FREEZE PROTECTED | themes.css:1185; themes.css:1264 | 4 | 0 | 1 | 1 | 0 | 10 | CollectionFilter.tsx, AntigravityButton.tsx, AntigravityCard.tsx, index.css |
| management-surface | FREEZE PROTECTED | themes.css:1176; themes.css:1255 | 15 | 0 | 1 | 1 | 1 | 66 | AntigravityForm.tsx, TopicSectionRenderer.tsx, AntigravityLayout.tsx, useToast.tsx, CollectionFilter.tsx, Menu.tsx, AdminModal.tsx, SharedComponents.tsx, AntigravityCard.tsx, BulkActionBar.tsx, index.css, ds003-runtime-audit.test.tsx |
| management-surface-active | FREEZE PROTECTED | themes.css:1179; themes.css:1258 | 1 | 0 | 0 | 0 | 0 | 4 | CollectionFilter.tsx |
| management-surface-hover | FREEZE PROTECTED | themes.css:1178; themes.css:1257 | 1 | 0 | 0 | 0 | 0 | 5 | AntigravityButton.tsx |
| management-surface-muted | FREEZE PROTECTED | themes.css:1177; themes.css:1256 | 2 | 0 | 0 | 0 | 0 | 10 | AntigravityButton.tsx, SharedComponents.tsx |
| material-button-primary-border | FREEZE PROTECTED | themes.css:1077 | 1 | 0 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| material-button-primary-shadow | FREEZE PROTECTED | themes.css:1078 | 3 | 0 | 0 | 0 | 0 | 1 | AntigravityButton.tsx |
| material-button-primary-surface | FREEZE PROTECTED | themes.css:1076 | 1 | 0 | 0 | 0 | 0 | 3 | AntigravityButton.tsx |
| material-button-primary-text | FREEZE PROTECTED | themes.css:1079 | 1 | 0 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| material-card-auth-light-border | FREEZE PROTECTED | themes.css:1069 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityCard.tsx, index.css |
| material-card-auth-light-radius | SAFE REMOVE | themes.css:1071 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| material-card-auth-light-shadow | FREEZE PROTECTED | themes.css:1070 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityCard.tsx, index.css |
| material-card-auth-light-surface | FREEZE PROTECTED | themes.css:1068 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityCard.tsx, index.css |
| material-card-premium-border | FREEZE PROTECTED | themes.css:1062; themes.css:1227 | 0 | 6 | 1 | 0 | 0 | 13 | AntigravityLayout.tsx, ThemeToggle.tsx, AntigravityCard.tsx, index.css |
| material-card-premium-shadow | FREEZE PROTECTED | themes.css:1063 | 0 | 4 | 1 | 0 | 0 | 12 | AttemptCardBase.tsx, AntigravityLayout.tsx, AntigravityCard.tsx, TopicCard.tsx, index.css |
| material-card-premium-surface | FREEZE PROTECTED | themes.css:1051 | 0 | 1 | 1 | 0 | 0 | 7 | AntigravityCard.tsx, index.css |
| material-input-checkbox-radius | SAFE REMOVE | themes.css:1090 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| material-input-checkbox-size | SAFE REMOVE | themes.css:1089 | 0 | 0 | 0 | 0 | 0 | 2 |  |
| material-input-compact-height | FREEZE PROTECTED | themes.css:1084 | 1 | 0 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| material-input-compact-padding | FREEZE PROTECTED | themes.css:1086 | 2 | 0 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| material-input-compact-text | FREEZE PROTECTED | themes.css:1085 | 1 | 0 | 0 | 0 | 0 | 0 | AntigravityForm.tsx |
| material-input-violet-focus-border | SAFE REMOVE | themes.css:1087 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| material-input-violet-focus-shadow | SAFE REMOVE | themes.css:1088 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| material-tab-pill-border | FREEZE PROTECTED | themes.css:1099 | 1 | 0 | 0 | 0 | 0 | 2 | AntigravityData.tsx |
| material-tab-pill-shadow-light | FREEZE PROTECTED | themes.css:1100 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityData.tsx, index.css |
| material-tab-pill-surface | FREEZE PROTECTED | themes.css:1098 | 1 | 0 | 0 | 0 | 0 | 2 | AntigravityData.tsx |
| material-tab-text-hover | FREEZE PROTECTED | themes.css:1106 | 2 | 0 | 0 | 0 | 0 | 0 | AntigravityData.tsx, SegmentedFilter.tsx |
| material-tab-text-inactive | FREEZE PROTECTED | themes.css:1105 | 2 | 0 | 0 | 0 | 0 | 0 | AntigravityData.tsx, SegmentedFilter.tsx |
| material-tab-track-border | FREEZE PROTECTED | themes.css:1096 | 1 | 0 | 0 | 0 | 0 | 2 | AntigravityData.tsx |
| material-tab-track-shadow | FREEZE PROTECTED | themes.css:1097 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityData.tsx, index.css |
| material-tab-track-surface | FREEZE PROTECTED | themes.css:1095 | 1 | 0 | 0 | 0 | 0 | 2 | AntigravityData.tsx |
| nav-active | SAFE REMOVE | themes.css:630 | 0 | 0 | 0 | 0 | 0 | 10 |  |
| nav-bg-active | SAFE REMOVE | themes.css:621 | 0 | 0 | 1 | 0 | 0 | 5 | themes.css |
| nav-bg-hover | SAFE REMOVE | themes.css:620 | 0 | 0 | 1 | 0 | 0 | 5 | themes.css |
| nav-border | SAFE REMOVE | themes.css:625 | 0 | 0 | 0 | 0 | 0 | 4 |  |
| nav-focus | SAFE REMOVE | themes.css:632 | 0 | 0 | 0 | 0 | 0 | 9 |  |
| nav-hover | SAFE REMOVE | themes.css:629 | 0 | 0 | 0 | 0 | 0 | 7 |  |
| nav-icon | SAFE REMOVE | themes.css:623 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| nav-icon-active | SAFE REMOVE | themes.css:624 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| nav-indicator | SAFE REMOVE | themes.css:622 | 0 | 0 | 0 | 0 | 0 | 11 |  |
| nav-shadow | SAFE REMOVE | themes.css:631 | 0 | 0 | 0 | 0 | 0 | 6 |  |
| nav-surface | SAFE REMOVE | themes.css:614 | 0 | 0 | 0 | 0 | 0 | 9 |  |
| nav-surface-footer | SAFE REMOVE | themes.css:615 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| nav-text | SAFE REMOVE | themes.css:616 | 0 | 0 | 0 | 0 | 0 | 9 |  |
| nav-text-active | SAFE REMOVE | themes.css:619 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| nav-text-hover | SAFE REMOVE | themes.css:618 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| nav-text-secondary | SAFE REMOVE | themes.css:617 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| opacity-0 | SAFE REMOVE | themes.css:364 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-10 | SAFE REMOVE | themes.css:366 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-100 | SAFE REMOVE | themes.css:384 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-15 | SAFE REMOVE | themes.css:367 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-20 | SAFE REMOVE | themes.css:368 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-25 | SAFE REMOVE | themes.css:369 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-30 | SAFE REMOVE | themes.css:370 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-35 | SAFE REMOVE | themes.css:371 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-40 | SAFE REMOVE | themes.css:372 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-45 | SAFE REMOVE | themes.css:373 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-5 | SAFE REMOVE | themes.css:365 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-50 | SAFE REMOVE | themes.css:374 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-55 | SAFE REMOVE | themes.css:375 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-60 | SAFE REMOVE | themes.css:376 | 0 | 0 | 2 | 0 | 0 | 0 | themes.css |
| opacity-65 | SAFE REMOVE | themes.css:377 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-70 | SAFE REMOVE | themes.css:378 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-75 | SAFE REMOVE | themes.css:379 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-80 | SAFE REMOVE | themes.css:380 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-85 | SAFE REMOVE | themes.css:381 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-90 | SAFE REMOVE | themes.css:382 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-95 | SAFE REMOVE | themes.css:383 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| opacity-disabled | SAFE REMOVE | themes.css:581; themes.css:881 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| orange-100 | SAFE REMOVE | themes.css:175 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| orange-200 | SAFE REMOVE | themes.css:176 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| orange-300 | SAFE REMOVE | themes.css:177 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| orange-400 | SAFE REMOVE | themes.css:178 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| orange-50 | SAFE REMOVE | themes.css:174 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| orange-500 | SAFE REMOVE | themes.css:179 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| orange-600 | SAFE REMOVE | themes.css:180 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| orange-700 | SAFE REMOVE | themes.css:181 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| orange-800 | SAFE REMOVE | themes.css:182 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| orange-900 | SAFE REMOVE | themes.css:183 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| orange-950 | SAFE REMOVE | themes.css:184 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| pie-forest | SAFE REMOVE | themes.css:261 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| pie-gold | SAFE REMOVE | themes.css:262 | 0 | 0 | 0 | 0 | 0 | 2 |  |
| pie-green | SAFE REMOVE | themes.css:263 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| pink-600 | SAFE REMOVE | themes.css:171 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| placeholder-color | FREEZE PROTECTED | themes.css:494; themes.css:704 | 0 | 2 | 1 | 0 | 0 | 0 | AntigravityForm.tsx, themes.css |
| placeholder-opacity | SAFE REMOVE | themes.css:495 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| placeholder-weight | SAFE REMOVE | themes.css:496 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| premium-cream | SAFE REMOVE | themes.css:237 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| premium-gold | SAFE REMOVE | themes.css:238 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| premium-green | KEEP | themes.css:236 | 1 | 0 | 0 | 0 | 0 | 6 | PremiumLoader.tsx |
| primary | KEEP | index.css:272 | 12 | 0 | 0 | 1 | 0 | 26 | ResultView.tsx, StudentDetailModal.tsx, StatisticsSection.tsx, ReviewLayout.tsx, PerformanceCharts.tsx, DailyAttemptsChart.tsx, CarouselDots.tsx, SubAdminDashboard.tsx, index.css |
| primary-hover | SAFE REMOVE | index.css:273 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| primary-rgb | KEEP | index.css:275 | 1 | 0 | 0 | 0 | 0 | 10 | SubjectCardItem.tsx |
| primary-subtle | SAFE REMOVE | index.css:274 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| purple-100 | SAFE REMOVE | themes.css:107 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| purple-200 | SAFE REMOVE | themes.css:108 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| purple-300 | SAFE REMOVE | themes.css:109 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| purple-400 | SAFE REMOVE | themes.css:110 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| purple-50 | SAFE REMOVE | themes.css:106 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| purple-500 | SAFE REMOVE | themes.css:111 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| purple-600 | SAFE REMOVE | themes.css:112 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| purple-700 | SAFE REMOVE | themes.css:113 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| purple-800 | SAFE REMOVE | themes.css:114 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| purple-900 | SAFE REMOVE | themes.css:115 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| purple-950 | SAFE REMOVE | themes.css:116 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| radio-border | FREEZE PROTECTED | themes.css:947 | 0 | 1 | 1 | 0 | 0 | 2 | AntigravityForm.tsx, index.css |
| radio-border-checked | FREEZE PROTECTED | themes.css:949 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx, index.css |
| radio-border-hover | FREEZE PROTECTED | themes.css:948 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx, index.css |
| radio-dot-checked | FREEZE PROTECTED | themes.css:950 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx, index.css |
| radio-surface | FREEZE PROTECTED | themes.css:946 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx, index.css |
| radio-track-surface | FREEZE PROTECTED | themes.css:951 | 0 | 1 | 1 | 0 | 0 | 1 | AntigravityForm.tsx, index.css |
| radius-2xl | MERGE | themes.css:277; index.css:79 | 0 | 98 | 0 | 0 | 0 | 13 | DiagramRenderer.tsx, ProfileForm.tsx, ParsedPreview.tsx, CreateStepReview.tsx, QuestionForm.tsx, CreateStepJsonPaste.tsx, ExamDetailSection.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, AntigravityLayout.tsx, CreateStepPublish.tsx, FormattedBodyText.tsx, ExamStudentTable.tsx, TopicReader.tsx, ExamSubComponents.tsx, CreateStepPrompt.tsx, QuestionCard.tsx, MapVisualizer.tsx, PreviewTab.tsx, PreparationView.tsx, useToast.tsx, AdminLeaderboard.tsx, AntigravityData.tsx, InstructionsTab.tsx, ReviewLayout.tsx, PerformanceCharts.tsx, AIToolCards.tsx, SuccessView.tsx, ExamView.tsx, CreateStepSetup.tsx, TestConfigView.tsx, ExamHeader.tsx, Menu.tsx, QuestionVisualizer.tsx, ExamDetailModal.tsx, AntigravityResults.tsx, SubjectCardItem.tsx, ExamParamsForm.tsx, StatusBoard.tsx, RecruitmentSection.tsx, SubmitExamModal.tsx, useActiveExam.tsx, SharedComponents.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, SignupPage.tsx, AdminTopicPreviewRenderer.tsx, ExamTimer.tsx, VerifyEmailPage.tsx, ErrorBoundary.tsx, SidebarLayout.tsx, FinishSignInPage.tsx, AccountDisabledPage.tsx, PremiumSelect.tsx, themes.css |
| radius-3xl | KEEP | themes.css:278; index.css:80 | 0 | 13 | 0 | 0 | 0 | 10 | QuestionForm.tsx, TopicReader.tsx, AIToolCards.tsx, Unauthorized.tsx, QuestionVisualizer.tsx, AdminTopicPreviewRenderer.tsx, SubAdminStudents.tsx, BulkActionBar.tsx, themes.css |
| radius-4xl | SAFE REMOVE | themes.css:279 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| radius-alert | SAFE REMOVE | themes.css:287 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| radius-badge-md | SAFE REMOVE | themes.css:286 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| radius-button-auth | SAFE REMOVE | themes.css:285 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| radius-button-md | SAFE REMOVE | themes.css:284 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| radius-button-xs | SAFE REMOVE | themes.css:283 | 0 | 0 | 0 | 0 | 0 | 2 |  |
| radius-card | KEEP | themes.css:513 | 0 | 0 | 3 | 3 | 0 | 5 | index.css |
| radius-card-inner | SAFE REMOVE | themes.css:515 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| radius-container | KEEP | themes.css:514 | 0 | 0 | 1 | 0 | 0 | 2 | themes.css |
| radius-control | KEEP | themes.css:517 | 0 | 0 | 2 | 0 | 0 | 1 | themes.css |
| radius-empty-state | SAFE REMOVE | themes.css:289 | 0 | 0 | 0 | 0 | 0 | 4 |  |
| radius-filter | SAFE REMOVE | themes.css:290 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| radius-full | SAFE REMOVE | themes.css:280 | 0 | 0 | 1 | 0 | 0 | 0 | themes.css |
| radius-icon-sm | SAFE REMOVE | themes.css:288 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| radius-lg | SAFE REMOVE | themes.css:275 | 0 | 0 | 1 | 0 | 0 | 0 | themes.css |
| radius-md | KEEP | themes.css:274 | 0 | 0 | 1 | 0 | 0 | 0 | themes.css |
| radius-none | SAFE REMOVE | themes.css:271 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| radius-pill | SAFE REMOVE | themes.css:519 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| radius-sm | SAFE REMOVE | themes.css:273 | 0 | 0 | 1 | 0 | 0 | 0 | themes.css |
| radius-stat-card-radius | FREEZE PROTECTED | index.css:174 | 0 | 1 | 0 | 0 | 0 | 1 | AntigravityCard.tsx |
| radius-stat-icon-radius | FREEZE PROTECTED | index.css:175 | 0 | 1 | 0 | 0 | 0 | 1 | AntigravityCard.tsx |
| radius-surface | SAFE REMOVE | themes.css:516 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| radius-tooltip | SAFE REMOVE | themes.css:518 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| radius-xl | MERGE | themes.css:276; index.css:78 | 0 | 107 | 0 | 0 | 0 | 17 | TopicInfoButton.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, ProfileForm.tsx, SubjectInsightsCard.tsx, ResultsPage.tsx, LeaderboardMobileCard.tsx, QuestionForm.tsx, CreateStepJsonPaste.tsx, SettingsCard.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, CreateStepPublish.tsx, TopicReader.tsx, QuestionOptions.tsx, AddExamModal.tsx, CreateStepPrompt.tsx, StartTestButton.tsx, Navigation.tsx, QuestionCard.tsx, PreparationView.tsx, LangInputPanel.tsx, AntigravityData.tsx, ReviewQuestionCard.tsx, ReviewLayout.tsx, ProfileHeader.tsx, CollectionFilter.tsx, AntigravityButton.tsx, TopicListItem.tsx, ExamView.tsx, CreateStepSetup.tsx, LeaderboardComponents.tsx, AdminIconWrap.tsx, CompactDateTimePicker.tsx, IconBadge.tsx, ExamHeader.tsx, ExamDetailModal.tsx, QuestionsTableComponents.tsx, StatusBoard.tsx, SharedComponents.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, QuestionPalette.tsx, LeaderboardUserCard.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, VerifyEmailPage.tsx, BilingualToggle.tsx, SidebarLayout.tsx, StudentsTable.tsx, JsonTab.tsx, QuestionActions.tsx, TopicCard.tsx, PremiumSelect.tsx, themes.css |
| radius-xs | SAFE REMOVE | themes.css:272 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| red-100 | SAFE REMOVE | themes.css:81 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| red-200 | SAFE REMOVE | themes.css:82 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| red-300 | SAFE REMOVE | themes.css:83 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| red-400 | SAFE REMOVE | themes.css:84 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| red-50 | SAFE REMOVE | themes.css:80 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| red-500 | SAFE REMOVE | themes.css:85 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| red-600 | SAFE REMOVE | themes.css:86 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| red-700 | SAFE REMOVE | themes.css:87 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| red-800 | SAFE REMOVE | themes.css:88 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| red-900 | SAFE REMOVE | themes.css:89 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| red-950 | SAFE REMOVE | themes.css:90 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| rose-100 | SAFE REMOVE | themes.css:159 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| rose-200 | SAFE REMOVE | themes.css:160 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| rose-300 | SAFE REMOVE | themes.css:161 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| rose-400 | SAFE REMOVE | themes.css:162 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| rose-50 | SAFE REMOVE | themes.css:158 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| rose-500 | SAFE REMOVE | themes.css:163 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| rose-600 | SAFE REMOVE | themes.css:164 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| rose-700 | SAFE REMOVE | themes.css:165 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| rose-800 | SAFE REMOVE | themes.css:166 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| rose-900 | SAFE REMOVE | themes.css:167 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| rose-950 | SAFE REMOVE | themes.css:168 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| scrollbar-thumb | KEEP | themes.css:488; themes.css:774 | 0 | 0 | 2 | 2 | 0 | 3 | index.css |
| scrollbar-thumb-hover | KEEP | themes.css:489; themes.css:775 | 0 | 0 | 2 | 2 | 0 | 1 | index.css |
| scrollbar-track | KEEP | themes.css:490; themes.css:776 | 0 | 0 | 0 | 1 | 0 | 0 |  |
| scrollbar-width | KEEP | themes.css:491; themes.css:777 | 0 | 0 | 0 | 2 | 0 | 0 |  |
| secondary | MERGE | index.css:276 | 0 | 30 | 0 | 0 | 0 | 9 | QuestionForm.tsx, RankBadge.tsx, LeaderboardView.tsx, AntigravityData.tsx, AIToolCards.tsx, LoadingScreen.tsx, IconBadge.tsx, ExamDetailModal.tsx, SubjectCardItem.tsx, VerifyEmailPage.tsx, LeaderboardMobileCard.tsx, InstructionsTab.tsx, QuestionsTableComponents.tsx, MethodSelectionView.tsx, ReviewLayout.tsx, ErrorBoundary.tsx, index.css |
| selection-bg | KEEP | themes.css:479; themes.css:765 | 0 | 0 | 1 | 1 | 0 | 7 | index.css |
| selection-text | KEEP | themes.css:480; themes.css:766 | 0 | 0 | 1 | 1 | 0 | 0 | index.css |
| shadow-2xl | FREEZE PROTECTED | themes.css:458; themes.css:743; index.css:88 | 0 | 30 | 4 | 2 | 0 | 3 | LeaderboardView.tsx, AddExamModal.tsx, useToast.tsx, ReviewLayout.tsx, PerformanceCharts.tsx, ProfileHeader.tsx, SuccessView.tsx, Unauthorized.tsx, AdminModal.tsx, LeaderboardTable.tsx, LanguageSelectionScreen.tsx, ErrorBoundary.tsx, SidebarLayout.tsx, BulkActionBar.tsx, index.css, themes.css |
| shadow-ambient | KEEP | themes.css:606; themes.css:846 | 0 | 0 | 1 | 0 | 0 | 4 | themes.css |
| shadow-button-secondary | FREEZE PROTECTED | index.css:123 | 0 | 2 | 0 | 0 | 0 | 1 | AntigravityButton.tsx |
| shadow-button-secondary-hover | FREEZE PROTECTED | index.css:124 | 0 | 2 | 0 | 0 | 0 | 0 | AntigravityButton.tsx |
| shadow-card-auth-light | FREEZE PROTECTED | index.css:113 | 0 | 1 | 0 | 0 | 0 | 1 | AntigravityCard.tsx |
| shadow-card-hover-shadow | FREEZE PROTECTED | index.css:101 | 0 | 3 | 0 | 0 | 0 | 1 | AntigravityCard.tsx |
| shadow-card-premium | FREEZE PROTECTED | index.css:107 | 0 | 4 | 0 | 0 | 0 | 5 | AttemptCardBase.tsx, AntigravityLayout.tsx, AntigravityCard.tsx, TopicCard.tsx |
| shadow-card-shadow | FREEZE PROTECTED | index.css:100 | 0 | 4 | 0 | 0 | 0 | 6 | AntigravityCard.tsx |
| shadow-contact | KEEP | themes.css:607; themes.css:847 | 0 | 0 | 1 | 0 | 0 | 5 | themes.css |
| shadow-elevation-1 | FREEZE PROTECTED | index.css:91 | 0 | 3 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, AntigravityData.tsx, AntigravityCard.tsx |
| shadow-elevation-2 | FREEZE PROTECTED | index.css:92 | 0 | 10 | 0 | 0 | 0 | 0 | AntigravityForm.tsx, AntigravityButton.tsx, AccountDisabledPage.tsx |
| shadow-elevation-3 | FREEZE PROTECTED | index.css:93 | 0 | 11 | 0 | 0 | 0 | 0 | AntigravityButton.tsx, QuestionCard.tsx, AntigravityCard.tsx, SignupPage.tsx |
| shadow-elevation-4 | FREEZE PROTECTED | index.css:94 | 0 | 2 | 0 | 0 | 0 | 0 | Menu.tsx, PremiumSelect.tsx |
| shadow-filter | FREEZE PROTECTED | index.css:147 | 0 | 1 | 0 | 0 | 0 | 3 | CollectionFilter.tsx |
| shadow-filter-hover | FREEZE PROTECTED | index.css:148 | 0 | 1 | 0 | 0 | 0 | 1 | CollectionFilter.tsx |
| shadow-focus | SAFE REMOVE | themes.css:610; themes.css:850 | 0 | 0 | 1 | 0 | 0 | 9 | themes.css |
| shadow-hover | SAFE REMOVE | themes.css:608; themes.css:848 | 0 | 0 | 1 | 0 | 0 | 4 | themes.css |
| shadow-lg | KEEP | themes.css:456; themes.css:741; index.css:86 | 0 | 52 | 4 | 1 | 0 | 2 | DiagramRenderer.tsx, QuestionForm.tsx, LeaderboardView.tsx, CreateStepPrompt.tsx, PreparationView.tsx, ReviewLayout.tsx, ProfileHeader.tsx, AIToolCards.tsx, LoginPage.tsx, LeaderboardComponents.tsx, TestConfigView.tsx, UpdatePasswordPage.tsx, QuestionCard.tsx, QuestionPalette.tsx, SignupPage.tsx, LeaderboardUserCard.tsx, VerifyEmailPage.tsx, SidebarLayout.tsx, index.css, themes.css |
| shadow-md | FREEZE PROTECTED | themes.css:455; themes.css:740; index.css:85 | 0 | 18 | 7 | 1 | 0 | 4 | TopicInfoButton.tsx, TopicReader.tsx, QuestionOptions.tsx, Navigation.tsx, QuestionCard.tsx, SuccessView.tsx, VerifyEmailPage.tsx, paletteColors.ts, index.css, themes.css |
| shadow-modal | SAFE REMOVE | themes.css:611; themes.css:851 | 0 | 0 | 1 | 0 | 0 | 4 | themes.css |
| shadow-offset-2xl | SAFE REMOVE | themes.css:322 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| shadow-offset-lg | SAFE REMOVE | themes.css:320 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| shadow-offset-md | SAFE REMOVE | themes.css:319 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| shadow-offset-none | SAFE REMOVE | themes.css:316 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| shadow-offset-sm | SAFE REMOVE | themes.css:318 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| shadow-offset-xl | SAFE REMOVE | themes.css:321 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| shadow-offset-xs | SAFE REMOVE | themes.css:317 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| shadow-premium-card | FREEZE PROTECTED | index.css:183 | 0 | 5 | 0 | 0 | 0 | 3 | SharedComponents.tsx, AntigravityCard.tsx |
| shadow-premium-carved | MERGE | index.css:185 | 0 | 2 | 0 | 0 | 0 | 5 | SharedComponents.tsx |
| shadow-premium-elevated | FREEZE PROTECTED | index.css:184 | 0 | 1 | 0 | 0 | 0 | 1 | AntigravityCard.tsx |
| shadow-premium-icon | MERGE | index.css:186 | 0 | 1 | 0 | 0 | 0 | 6 | PremiumIconContainer.tsx |
| shadow-pressed | SAFE REMOVE | themes.css:609; themes.css:849 | 0 | 0 | 1 | 0 | 0 | 2 | themes.css |
| shadow-sm | FREEZE PROTECTED | themes.css:454; themes.css:739; index.css:84 | 0 | 58 | 13 | 6 | 0 | 6 | TopicInfoButton.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, CreateStepJsonPaste.tsx, AntigravityLayout.tsx, FormattedBodyText.tsx, Navigation.tsx, QuestionCard.tsx, ReviewQuestionCard.tsx, CompactDateTimePicker.tsx, ExamHeader.tsx, AntigravityResults.tsx, StatusBoard.tsx, SignupPage.tsx, BilingualToggle.tsx, SidebarLayout.tsx, FinishSignInPage.tsx, QuestionActions.tsx, QuestionNavigator.tsx, paletteColors.ts, index.css, themes.css |
| shadow-stat-card-shadow | FREEZE PROTECTED | index.css:173 | 0 | 1 | 0 | 0 | 0 | 2 | AntigravityCard.tsx |
| shadow-tab-pill-light | FREEZE PROTECTED | index.css:166 | 0 | 1 | 0 | 0 | 0 | 0 | AntigravityData.tsx |
| shadow-tab-track | FREEZE PROTECTED | index.css:165 | 0 | 1 | 0 | 0 | 0 | 1 | AntigravityData.tsx |
| shadow-xl | FREEZE PROTECTED | themes.css:457; themes.css:742; index.css:87 | 0 | 26 | 2 | 0 | 0 | 3 | TopicInfoButton.tsx, DiagramRenderer.tsx, LeaderboardView.tsx, CreateStepPublish.tsx, TopicReader.tsx, SelectionView.tsx, Navigation.tsx, ReviewLayout.tsx, SuccessView.tsx, AntigravityResults.tsx, MethodSelectionView.tsx, index.css, themes.css |
| shadow-xs | SAFE REMOVE | themes.css:453; themes.css:738; index.css:83 | 0 | 0 | 2 | 0 | 0 | 7 | index.css, themes.css |
| sidebar-bg | FREEZE PROTECTED | themes.css:988; themes.css:1198 | 0 | 2 | 5 | 3 | 0 | 21 | Navigation.tsx, index.css, themes.css |
| sidebar-border | KEEP | themes.css:989; themes.css:1199 | 0 | 0 | 4 | 3 | 0 | 2 | index.css, themes.css |
| slate-100 | SAFE REMOVE | themes.css:42 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| slate-200 | SAFE REMOVE | themes.css:43 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| slate-300 | SAFE REMOVE | themes.css:44 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| slate-400 | SAFE REMOVE | themes.css:45 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| slate-50 | SAFE REMOVE | themes.css:41 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| slate-500 | SAFE REMOVE | themes.css:46 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| slate-600 | SAFE REMOVE | themes.css:47 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| slate-700 | SAFE REMOVE | themes.css:48 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| slate-800 | SAFE REMOVE | themes.css:49 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| slate-900 | SAFE REMOVE | themes.css:50 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| slate-950 | SAFE REMOVE | themes.css:51 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| space-0 | FREEZE PROTECTED | themes.css:301 | 1 | 227 | 1 | 0 | 0 | 2 | AntigravityLayout.tsx, SettingsCard.tsx, LeaderboardView.tsx, QuestionCard.tsx, StudentDetailModal.tsx, CompactDateTimePicker.tsx, AdminModal.tsx, LeaderboardTable.tsx, AntigravityCard.tsx, LeaderboardSkeleton.tsx, StudentsTable.tsx, SplashPage.tsx, NotificationPanel.tsx, DiagramRenderer.tsx, Pagination.tsx, ParsedPreview.tsx, RankBadge.tsx, TopicSectionRenderer.tsx, CreateStepPublish.tsx, AdminTopics.tsx, AntigravityData.tsx, PerformanceCharts.tsx, TopicListItem.tsx, LeaderboardComponents.tsx, UploadContextPanel.tsx, LanguageSelectionScreen.tsx, AdminTopicPreviewRenderer.tsx, TagBadge.tsx, ProfileForm.tsx, SubjectInsightsCard.tsx, ResultsPage.tsx, TeacherExamFilterBar.tsx, AntigravityLayout.tsx, TopicReader.tsx, ResultView.tsx, StartTestButton.tsx, PreparationView.tsx, SubjectPortalView.tsx, StatisticsSection.tsx, ReviewQuestionCard.tsx, ReviewLayout.tsx, TeacherExamCard.tsx, ProfileHeader.tsx, ExamView.tsx, TestConfigView.tsx, ExamHeader.tsx, StatusBoard.tsx, TeacherLeaderboardModal.tsx, TopicPortalView.tsx, LeaderboardUserCard.tsx, LeaderboardTopCard.tsx, AntigravityTypography.tsx, SuccessModal.tsx, TopicCard.tsx, SubjectInsightItem.tsx, CreateStepJsonPaste.tsx, TopicsToolbar.tsx, Alert.tsx, ExamQuestionAnalysis.tsx, FormattedBodyText.tsx, AntigravityResults.tsx, CollectionCard.tsx, SegmentedFilter.tsx, QuestionNavigator.tsx, ExamSubComponents.tsx, PreviewTab.tsx, TopicMetadataFields.tsx, LeaderboardTabletCard.tsx, SubAdminMobileCard.tsx, ActiveExamPage.tsx, AdminFilterBar.tsx, UsersTable.tsx, UsersActions.tsx, QuestionsActions.tsx, UserIdentity.tsx, ExamDetailRow.tsx, AdminSubAdminsView.tsx, SidebarLayout.tsx, index.css |
| space-1 | FREEZE PROTECTED | themes.css:302 | 2 | 283 | 1 | 0 | 0 | 1 | AntigravityLayout.tsx, TopicInfoButton.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, QuestionForm.tsx, AntigravityData.tsx, ThemeToggle.tsx, AdminTopicPreviewRenderer.tsx, BilingualToggle.tsx, ProfileForm.tsx, ResultsPage.tsx, Pagination.tsx, ParsedPreview.tsx, AdminTopics.tsx, StatisticsSection.tsx, TopicListItem.tsx, LeaderboardComponents.tsx, CompactDateTimePicker.tsx, NotificationPanel.tsx, CollectionHeader.tsx, TagBadge.tsx, RankBadge.tsx, QuestionCard.tsx, ReviewQuestionCard.tsx, CollectionFilter.tsx, SuccessView.tsx, ExamView.tsx, ExamDetailModal.tsx, ExamLayout.tsx, PremiumSelect.tsx, CreateStepJsonPaste.tsx, CreateStepSetup.tsx, TestConfigView.tsx, LanguageSelectionScreen.tsx, ExamQuestionAnalysis.tsx, SubjectInsightsCard.tsx, PreviewTab.tsx, Menu.tsx, VerifyEmailPage.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, FormattedBodyText.tsx, TopicListView.tsx, TopicReader.tsx, AddExamModal.tsx, PreparationView.tsx, TopicMetadataFields.tsx, LangInputPanel.tsx, CollectionCard.tsx, LoginPage.tsx, PromptEditorModal.tsx, AntigravityResults.tsx, UpdatePasswordPage.tsx, ExamParamsForm.tsx, UploadProgressOverlay.tsx, AntigravityCard.tsx, SignupPage.tsx, AdminSubAdminsView.tsx, FinishSignInPage.tsx, IdentitySection.tsx, AdminSettings.tsx, ReviewLayout.tsx, TeacherLeaderboardModal.tsx, BulkActionBar.tsx, SubAdminDashboard.tsx, AIToolCards.tsx, UploadContextPanel.tsx, ExamTimer.tsx, ExamDetailRow.tsx, PerformanceSectionHeader.tsx, WelcomeBanner.tsx, SubjectInsightItem.tsx, PerformanceCharts.tsx, AttemptCardBase.tsx, ExamStudentTable.tsx, ExamSubComponents.tsx, Navigation.tsx, ActiveExamPage.tsx, InstructionsTab.tsx, AntigravityButton.tsx, AdminUsers.tsx, StatusBoard.tsx, SegmentedFilter.tsx, UserIdentity.tsx, SidebarLayout.tsx, ExamSummaryCards.tsx, QuestionNavigator.tsx, SingleQuestionModal.tsx, TeacherExamCard.tsx, SharedComponents.tsx, LeaderboardTopCard.tsx, UserLeaderboard.tsx, index.css |
| space-10 | FREEZE PROTECTED | themes.css:309 | 1 | 68 | 1 | 0 | 0 | 1 | AntigravityLayout.tsx, PreparationView.tsx, ReviewLayout.tsx, ProfileHeader.tsx, LoginPage.tsx, SharedComponents.tsx, AntigravityCard.tsx, LeaderboardTopCard.tsx, SidebarLayout.tsx, LeaderboardView.tsx, AntigravityButton.tsx, ResultsPage.tsx, UserTopicExams.tsx, AntigravityLayout.tsx, ProfileForm.tsx, LeaderboardSkeleton.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, CreateStepSetup.tsx, AdminLeaderboard.tsx, Unauthorized.tsx, UpdatePasswordPage.tsx, QuestionForm.tsx, QuestionOptions.tsx, ReviewQuestionCard.tsx, LeaderboardComponents.tsx, IconBadge.tsx, QuestionCard.tsx, LeaderboardUserCard.tsx, CreateStepPublish.tsx, BulkActionBar.tsx, index.css |
| space-12 | FREEZE PROTECTED | themes.css:310 | 2 | 41 | 1 | 0 | 0 | 0 | AntigravityLayout.tsx, ProfileForm.tsx, QuestionForm.tsx, ResultView.tsx, ReviewLayout.tsx, TestConfigView.tsx, Unauthorized.tsx, AntigravityResults.tsx, SharedComponents.tsx, UserTeacherExams.tsx, StudentDetailModal.tsx, UserExams.tsx, NotificationPanel.tsx, AntigravityForm.tsx, AdminLeaderboard.tsx, SidebarLayout.tsx, SplashPage.tsx, ResultsPage.tsx, LeaderboardUserCard.tsx, LeaderboardView.tsx, AntigravityData.tsx, LeaderboardComponents.tsx, IconBadge.tsx, AntigravityDashboard.tsx, AntigravityCard.tsx, StudentsTable.tsx, AccountDisabledPage.tsx, Spinner.tsx, WelcomeBanner.tsx, index.css |
| space-16 | FREEZE PROTECTED | themes.css:311 | 1 | 34 | 1 | 0 | 0 | 0 | AntigravityLayout.tsx, ExamPaperGrid.tsx, SubAdminStudents.tsx, ReviewQuestionCard.tsx, SidebarLayout.tsx, LoginPage.tsx, SignupPage.tsx, DiagramRenderer.tsx, LeaderboardView.tsx, PremiumLoader.tsx, TopicMetadataFields.tsx, IconBadge.tsx, LeaderboardTable.tsx, ExamDetailModal.tsx, SharedComponents.tsx, AntigravityCard.tsx, ErrorBoundary.tsx, FinishSignInPage.tsx, AccountDisabledPage.tsx, QuestionPalette.tsx, QuestionNavigator.tsx, index.css |
| space-2 | FREEZE PROTECTED | themes.css:303 | 2 | 314 | 1 | 0 | 0 | 3 | AntigravityLayout.tsx, TopicInfoButton.tsx, AntigravityForm.tsx, LeaderboardMobileCard.tsx, SettingsCard.tsx, AddExamModal.tsx, QuestionCard.tsx, SegmentedFilter.tsx, VerifyEmailPage.tsx, SidebarLayout.tsx, JsonTab.tsx, QuestionNavigator.tsx, SplashPage.tsx, DiagramRenderer.tsx, ResultsPage.tsx, Pagination.tsx, QuestionForm.tsx, RankBadge.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, AntigravityLayout.tsx, CreateStepPublish.tsx, AntigravityData.tsx, InstructionsTab.tsx, PerformanceCharts.tsx, LeaderboardComponents.tsx, UploadContextPanel.tsx, ExamDetailModal.tsx, LanguageSelectionScreen.tsx, AdminTopicPreviewRenderer.tsx, StudentsTable.tsx, ProfileForm.tsx, UserTeacherExams.tsx, ParsedPreview.tsx, Navigation.tsx, LangInputPanel.tsx, ReviewLayout.tsx, ExamView.tsx, CompactDateTimePicker.tsx, QuestionVisualizer.tsx, SignupPage.tsx, ExamTimer.tsx, ExamLayout.tsx, QuestionActions.tsx, TopicReader.tsx, SubAdminMobileCard.tsx, SuccessView.tsx, AntigravityDashboard.tsx, ExamParamsForm.tsx, CarouselDots.tsx, ExamQuestionAnalysis.tsx, FormattedBodyText.tsx, PreviewTab.tsx, ActiveExamPage.tsx, LoginPage.tsx, TestConfigView.tsx, Menu.tsx, UploadProgressOverlay.tsx, ErrorBoundary.tsx, AccountDisabledPage.tsx, SingleQuestionModal.tsx, IdentitySection.tsx, ReviewView.tsx, SessionSection.tsx, StudentDetailModal.tsx, TeacherExamCard.tsx, BackupSection.tsx, ReviewPage.tsx, BulkActionBar.tsx, ResultView.tsx, PreparationView.tsx, RecentExamItem.tsx, ReviewQuestionCard.tsx, ExamHeader.tsx, AdminModal.tsx, UpdatePasswordPage.tsx, MethodSelectionView.tsx, ExamPaperGrid.tsx, LeaderboardTopCard.tsx, SubAdminStudents.tsx, ExamListSection.tsx, SubjectInsightsCard.tsx, QuestionsTable.tsx, ExamDetailSection.tsx, ExamStudentTable.tsx, ExamSubComponents.tsx, TopicMetadataFields.tsx, LeaderboardTabletCard.tsx, useToast.tsx, CollectionCard.tsx, CollectionFilter.tsx, AntigravityButton.tsx, TopicListItem.tsx, Unauthorized.tsx, QuestionsTableComponents.tsx, SharedComponents.tsx, AntigravityCard.tsx, TopicPortalView.tsx, QuestionPalette.tsx, NotificationPanel.tsx, Alert.tsx, AdminSubAdminsView.tsx, PremiumSelect.tsx, UsersTable.tsx, PremiumLoader.tsx, AdminTopics.tsx, SubmitExamModal.tsx, index.css |
| space-20 | FREEZE PROTECTED | themes.css:312 | 1 | 16 | 1 | 0 | 0 | 0 | AntigravityLayout.tsx, ExamPageError.tsx, SubAdminStudents.tsx, SidebarLayout.tsx, Navigation.tsx, AIToolCards.tsx, IconBadge.tsx, AntigravityResults.tsx, TeacherLeaderboardModal.tsx, AccountDisabledPage.tsx, AntigravityCard.tsx, index.css |
| space-24 | FREEZE PROTECTED | themes.css:313 | 1 | 25 | 1 | 0 | 0 | 1 | AntigravityLayout.tsx, AdminLeaderboard.tsx, ReviewLayout.tsx, CreateStepReview.tsx, SubAdminCreate.tsx, DiagramRenderer.tsx, ProfileHeader.tsx, IconBadge.tsx, LeaderboardTable.tsx, AntigravityResults.tsx, UploadProgressOverlay.tsx, TeacherLeaderboardModal.tsx, AntigravityCard.tsx, index.css |
| space-3 | FREEZE PROTECTED | themes.css:304 | 2 | 296 | 1 | 0 | 0 | 3 | AntigravityLayout.tsx, TopicInfoButton.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, AntigravityLayout.tsx, QuestionOptions.tsx, AddExamModal.tsx, Navigation.tsx, QuestionCard.tsx, AdminLeaderboard.tsx, AntigravityData.tsx, ReviewQuestionCard.tsx, PerformanceCharts.tsx, ExamDetailModal.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, AdminTopicPreviewRenderer.tsx, CarouselDots.tsx, ProfileForm.tsx, QuestionForm.tsx, RankBadge.tsx, LangInputPanel.tsx, CollectionFilter.tsx, AntigravityButton.tsx, ExamView.tsx, CompactDateTimePicker.tsx, QuestionVisualizer.tsx, SegmentedFilter.tsx, BilingualToggle.tsx, SidebarLayout.tsx, ExamLayout.tsx, PremiumSelect.tsx, CreateStepJsonPaste.tsx, CreateStepPublish.tsx, FormattedBodyText.tsx, ExamStudentTable.tsx, TopicReader.tsx, ExamSubComponents.tsx, CreateStepPrompt.tsx, StartTestButton.tsx, CreateStepSetup.tsx, Menu.tsx, SubmitExamModal.tsx, NotificationPanel.tsx, Alert.tsx, BulkActionBar.tsx, QuestionNavigator.tsx, CollectionCard.tsx, ActiveExamPage.tsx, AdminSelectionTabs.tsx, AntigravityDashboard.tsx, LeaderboardMobileCard.tsx, ExamPerformers.tsx, LeaderboardTopCard.tsx, ExamSummaryCards.tsx, ExamQuestionAnalysis.tsx, DashboardSkeletons.tsx, TopicSectionRenderer.tsx, StudentDetailModal.tsx, AIToolCards.tsx, AntigravityResults.tsx, SubjectInsightsCard.tsx, ResultsPage.tsx, TeacherExamFilterBar.tsx, CreateStepReview.tsx, QuestionsTable.tsx, SettingsCard.tsx, ExamDetailSection.tsx, LeaderboardView.tsx, ErrorActionButtons.tsx, PreviewTab.tsx, PreparationView.tsx, TopicMetadataFields.tsx, useToast.tsx, AdminTopics.tsx, StatisticsSection.tsx, SubAdminMobileCard.tsx, InstructionsTab.tsx, ReviewLayout.tsx, ProfileHeader.tsx, TopicListItem.tsx, SuccessView.tsx, LoginPage.tsx, LeaderboardComponents.tsx, UploadContextPanel.tsx, ExamHeader.tsx, Unauthorized.tsx, AdminModal.tsx, AdminFilterBar.tsx, UsersTable.tsx, DashboardRecentActivity.tsx, AdminUsers.tsx, UpdatePasswordPage.tsx, StatusBoard.tsx, UsersActions.tsx, QuestionsActions.tsx, QuestionPalette.tsx, SignupPage.tsx, VerifyEmailPage.tsx, ExamDetailRow.tsx, StudentsTable.tsx, CollectionHeader.tsx, QuestionActions.tsx, SplashPage.tsx, SharedComponents.tsx, index.css |
| space-4 | FREEZE PROTECTED | themes.css:305 | 2 | 413 | 1 | 0 | 0 | 2 | AntigravityLayout.tsx, DiagramRenderer.tsx, SubjectInsightsCard.tsx, CreateStepReview.tsx, QuestionForm.tsx, CreateStepJsonPaste.tsx, SettingsCard.tsx, ExamDetailSection.tsx, TopicSectionRenderer.tsx, AntigravityLayout.tsx, CreateStepPublish.tsx, ExamStudentTable.tsx, AddExamModal.tsx, PreviewTab.tsx, PreparationView.tsx, ReviewQuestionCard.tsx, TeacherExamCard.tsx, TopicListItem.tsx, ExamView.tsx, AdminModal.tsx, ExamDetailModal.tsx, SubjectCardItem.tsx, ExamParamsForm.tsx, StatusBoard.tsx, useActiveExam.tsx, QuestionCard.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, LeaderboardUserCard.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, VerifyEmailPage.tsx, AdminSubAdminsView.tsx, SidebarLayout.tsx, TopicCard.tsx, ExamQuestionAnalysis.tsx, AntigravityForm.tsx, ProfileForm.tsx, ParsedPreview.tsx, LeaderboardView.tsx, FormattedBodyText.tsx, TopicReader.tsx, ExamSubComponents.tsx, CreateStepPrompt.tsx, StartTestButton.tsx, AntigravityData.tsx, ActiveExamPage.tsx, ReviewLayout.tsx, ProfileHeader.tsx, CollectionFilter.tsx, AntigravityButton.tsx, SuccessView.tsx, LoginPage.tsx, CreateStepSetup.tsx, LeaderboardComponents.tsx, CompactDateTimePicker.tsx, ExamHeader.tsx, Menu.tsx, LeaderboardTable.tsx, SubmitExamModal.tsx, SegmentedFilter.tsx, QuestionPalette.tsx, SignupPage.tsx, LeaderboardTopCard.tsx, Alert.tsx, BulkActionBar.tsx, AccountDisabledPage.tsx, ExamLayout.tsx, QuestionActions.tsx, PremiumSelect.tsx, UserTeacherExams.tsx, Navigation.tsx, useToast.tsx, SuccessModal.tsx, ExamListSection.tsx, ReviewView.tsx, AttemptCardBase.tsx, LeaderboardTabletCard.tsx, CollectionCard.tsx, ReviewPage.tsx, SharedComponents.tsx, TeacherExamFilterBar.tsx, SessionSection.tsx, SelectionView.tsx, SubAdminCreate.tsx, BackupSection.tsx, ExamPaperGrid.tsx, NotificationSection.tsx, IdentitySection.tsx, Pagination.tsx, ResultsPage.tsx, PremiumLoader.tsx, PerformanceAnalyticsSection.tsx, AIToolCards.tsx, TestConfigView.tsx, UploadProgressOverlay.tsx, UserDashboard.tsx, RecentExamItem.tsx, AdminLeaderboard.tsx, AdminTopics.tsx, InstructionsTab.tsx, TopicsToolbar.tsx, UploadContextPanel.tsx, Unauthorized.tsx, AntigravityResults.tsx, MethodSelectionView.tsx, TopicPortalView.tsx, LeaderboardMobileCard.tsx, AdminSettings.tsx, DashboardSkeletons.tsx, ExamPerformers.tsx, ResultView.tsx, PerformanceMetricsGrid.tsx, StudentDetailModal.tsx, ExamPageLoading.tsx, SubjectPortalView.tsx, LoadingScreen.tsx, DailyAttemptsChart.tsx, AntigravityDashboard.tsx, DashboardRecentActivity.tsx, PerformanceSkeleton.tsx, PortalLoadingSkeleton.tsx, SubAdminStudents.tsx, JsonTab.tsx, QuestionNavigator.tsx, QuestionsTableComponents.tsx, FinishSignInPage.tsx, Spinner.tsx, SingleQuestionModal.tsx, index.css |
| space-5 | FREEZE PROTECTED | themes.css:306 | 1 | 103 | 1 | 0 | 0 | 0 | AntigravityLayout.tsx, CreateStepJsonPaste.tsx, SettingsCard.tsx, TopicSectionRenderer.tsx, CreateStepPublish.tsx, AddExamModal.tsx, CreateStepPrompt.tsx, PreparationView.tsx, SubjectPortalView.tsx, AIToolCards.tsx, CreateStepSetup.tsx, AntigravityDashboard.tsx, ExamDetailModal.tsx, QuestionCard.tsx, AntigravityCard.tsx, TopicPortalView.tsx, SidebarLayout.tsx, WelcomeBanner.tsx, AntigravityLayout.tsx, TopicReader.tsx, AntigravityData.tsx, ReviewLayout.tsx, SegmentedFilter.tsx, LeaderboardView.tsx, ExamSubComponents.tsx, TopicMetadataFields.tsx, AdminTopicPreviewRenderer.tsx, StatusBoard.tsx, FormattedBodyText.tsx, AdminTopics.tsx, AntigravityResults.tsx, ErrorContainer.tsx, ResultsPage.tsx, LeaderboardTabletCard.tsx, ReviewQuestionCard.tsx, CompactDateTimePicker.tsx, AntigravityForm.tsx, QuestionForm.tsx, LanguageSelectionScreen.tsx, index.css |
| space-6 | FREEZE PROTECTED | themes.css:307 | 2 | 201 | 1 | 0 | 0 | 5 | AntigravityLayout.tsx, DiagramRenderer.tsx, ProfileForm.tsx, ExamListSection.tsx, QuestionForm.tsx, SettingsCard.tsx, ExamDetailSection.tsx, LeaderboardView.tsx, AntigravityLayout.tsx, TopicReader.tsx, AddExamModal.tsx, PreparationView.tsx, ReviewLayout.tsx, LoginPage.tsx, TestConfigView.tsx, UploadContextPanel.tsx, AntigravityDashboard.tsx, AdminModal.tsx, QuestionVisualizer.tsx, AntigravityResults.tsx, RecruitmentSection.tsx, QuestionCard.tsx, SharedComponents.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, SignupPage.tsx, AdminTopicPreviewRenderer.tsx, LeaderboardTopCard.tsx, ErrorBoundary.tsx, CreateStepPrompt.tsx, useToast.tsx, AntigravityData.tsx, ActiveExamPage.tsx, AntigravityButton.tsx, ExamView.tsx, ExamHeader.tsx, TeacherLeaderboardModal.tsx, ExamTimer.tsx, SidebarLayout.tsx, BulkActionBar.tsx, QuestionNavigator.tsx, SplashPage.tsx, ResultsPage.tsx, UserTopicExams.tsx, StatusBoard.tsx, UserTeacherExams.tsx, MethodSelectionView.tsx, SubjectInsightsCard.tsx, BulkUploadModal.tsx, AdminLeaderboard.tsx, UploadProgressOverlay.tsx, SubmitExamModal.tsx, UserDashboard.tsx, VerifyEmailPage.tsx, TopicListView.tsx, PerformanceAnalyticsSection.tsx, TopicMetadataFields.tsx, AIToolCards.tsx, UpdatePasswordPage.tsx, AdminSubAdminsView.tsx, SubAdminDashboard.tsx, WelcomeBanner.tsx, QuestionsTable.tsx, SelectionView.tsx, UserExams.tsx, CreateStepSetup.tsx, DailyAttemptsChart.tsx, UsersTable.tsx, DashboardRecentActivity.tsx, AdminOverview.tsx, ExamPaperGrid.tsx, ExamSubComponents.tsx, Navigation.tsx, IconBadge.tsx, NotificationPanel.tsx, CarouselDots.tsx, AccountDisabledPage.tsx, ExamQuestionAnalysis.tsx, AntigravityForm.tsx, LeaderboardMobileCard.tsx, TopicSectionRenderer.tsx, StudentsTable.tsx, index.css |
| space-8 | FREEZE PROTECTED | themes.css:308 | 3 | 161 | 1 | 0 | 0 | 0 | AntigravityLayout.tsx, DiagramRenderer.tsx, ProfileForm.tsx, SessionSection.tsx, TopicReader.tsx, AddExamModal.tsx, PremiumLoader.tsx, ResultView.tsx, PreparationView.tsx, ReviewQuestionCard.tsx, ReviewLayout.tsx, ProfileHeader.tsx, BackupSection.tsx, TestConfigView.tsx, Unauthorized.tsx, AdminModal.tsx, AntigravityResults.tsx, UploadProgressOverlay.tsx, MethodSelectionView.tsx, RecruitmentSection.tsx, AntigravityCard.tsx, SignupPage.tsx, LeaderboardTopCard.tsx, ErrorBoundary.tsx, SubAdminStudents.tsx, NotificationSection.tsx, IdentitySection.tsx, WelcomeBanner.tsx, LeaderboardView.tsx, AntigravityLayout.tsx, AntigravityButton.tsx, SharedComponents.tsx, RetryButton.tsx, SidebarLayout.tsx, BulkActionBar.tsx, QuestionNavigator.tsx, ExamDetailSection.tsx, ActiveExamPage.tsx, UserLeaderboard.tsx, UserPerformance.tsx, LoginPage.tsx, StatusBoard.tsx, ExamView.tsx, UpdatePasswordPage.tsx, SubmitExamModal.tsx, useActiveExam.tsx, VerifyEmailPage.tsx, SplashPage.tsx, ResultsPage.tsx, AttemptCardBase.tsx, DailyAttemptsChart.tsx, PerformanceSkeleton.tsx, LeaderboardUserCard.tsx, PortalLoadingSkeleton.tsx, QuestionForm.tsx, AIToolCards.tsx, TopicListItem.tsx, LeaderboardComponents.tsx, IconBadge.tsx, ExamDetailModal.tsx, QuestionsTableComponents.tsx, Spinner.tsx, ExamListSection.tsx, LeaderboardTabletCard.tsx, index.css |
| spacing-0 | FREEZE PROTECTED | index.css:207 | 0 | 227 | 0 | 0 | 0 | 0 | SettingsCard.tsx, LeaderboardView.tsx, QuestionCard.tsx, StudentDetailModal.tsx, CompactDateTimePicker.tsx, AdminModal.tsx, LeaderboardTable.tsx, AntigravityCard.tsx, LeaderboardSkeleton.tsx, StudentsTable.tsx, SplashPage.tsx, NotificationPanel.tsx, DiagramRenderer.tsx, Pagination.tsx, ParsedPreview.tsx, RankBadge.tsx, TopicSectionRenderer.tsx, CreateStepPublish.tsx, AdminTopics.tsx, AntigravityData.tsx, PerformanceCharts.tsx, TopicListItem.tsx, LeaderboardComponents.tsx, UploadContextPanel.tsx, LanguageSelectionScreen.tsx, AdminTopicPreviewRenderer.tsx, TagBadge.tsx, ProfileForm.tsx, SubjectInsightsCard.tsx, ResultsPage.tsx, TeacherExamFilterBar.tsx, AntigravityLayout.tsx, TopicReader.tsx, ResultView.tsx, StartTestButton.tsx, PreparationView.tsx, SubjectPortalView.tsx, StatisticsSection.tsx, ReviewQuestionCard.tsx, ReviewLayout.tsx, TeacherExamCard.tsx, ProfileHeader.tsx, ExamView.tsx, TestConfigView.tsx, ExamHeader.tsx, StatusBoard.tsx, TeacherLeaderboardModal.tsx, TopicPortalView.tsx, LeaderboardUserCard.tsx, LeaderboardTopCard.tsx, AntigravityTypography.tsx, SuccessModal.tsx, TopicCard.tsx, SubjectInsightItem.tsx, CreateStepJsonPaste.tsx, TopicsToolbar.tsx, Alert.tsx, ExamQuestionAnalysis.tsx, FormattedBodyText.tsx, AntigravityResults.tsx, CollectionCard.tsx, SegmentedFilter.tsx, QuestionNavigator.tsx, ExamSubComponents.tsx, PreviewTab.tsx, TopicMetadataFields.tsx, LeaderboardTabletCard.tsx, SubAdminMobileCard.tsx, ActiveExamPage.tsx, AdminFilterBar.tsx, UsersTable.tsx, UsersActions.tsx, QuestionsActions.tsx, UserIdentity.tsx, ExamDetailRow.tsx, AdminSubAdminsView.tsx, SidebarLayout.tsx |
| spacing-1 | FREEZE PROTECTED | index.css:208 | 0 | 283 | 0 | 0 | 0 | 0 | TopicInfoButton.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, QuestionForm.tsx, AntigravityData.tsx, ThemeToggle.tsx, AdminTopicPreviewRenderer.tsx, BilingualToggle.tsx, ProfileForm.tsx, ResultsPage.tsx, Pagination.tsx, ParsedPreview.tsx, AdminTopics.tsx, StatisticsSection.tsx, TopicListItem.tsx, LeaderboardComponents.tsx, CompactDateTimePicker.tsx, NotificationPanel.tsx, CollectionHeader.tsx, TagBadge.tsx, RankBadge.tsx, QuestionCard.tsx, ReviewQuestionCard.tsx, CollectionFilter.tsx, SuccessView.tsx, ExamView.tsx, ExamDetailModal.tsx, ExamLayout.tsx, PremiumSelect.tsx, CreateStepJsonPaste.tsx, CreateStepSetup.tsx, TestConfigView.tsx, LanguageSelectionScreen.tsx, ExamQuestionAnalysis.tsx, SubjectInsightsCard.tsx, PreviewTab.tsx, Menu.tsx, VerifyEmailPage.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, FormattedBodyText.tsx, TopicListView.tsx, TopicReader.tsx, AddExamModal.tsx, PreparationView.tsx, TopicMetadataFields.tsx, LangInputPanel.tsx, CollectionCard.tsx, LoginPage.tsx, PromptEditorModal.tsx, AntigravityResults.tsx, UpdatePasswordPage.tsx, ExamParamsForm.tsx, UploadProgressOverlay.tsx, AntigravityCard.tsx, SignupPage.tsx, AdminSubAdminsView.tsx, FinishSignInPage.tsx, IdentitySection.tsx, AdminSettings.tsx, ReviewLayout.tsx, TeacherLeaderboardModal.tsx, BulkActionBar.tsx, SubAdminDashboard.tsx, AIToolCards.tsx, UploadContextPanel.tsx, ExamTimer.tsx, ExamDetailRow.tsx, PerformanceSectionHeader.tsx, WelcomeBanner.tsx, SubjectInsightItem.tsx, PerformanceCharts.tsx, AttemptCardBase.tsx, ExamStudentTable.tsx, ExamSubComponents.tsx, Navigation.tsx, ActiveExamPage.tsx, InstructionsTab.tsx, AntigravityButton.tsx, AdminUsers.tsx, StatusBoard.tsx, SegmentedFilter.tsx, UserIdentity.tsx, SidebarLayout.tsx, ExamSummaryCards.tsx, QuestionNavigator.tsx, SingleQuestionModal.tsx, TeacherExamCard.tsx, SharedComponents.tsx, LeaderboardTopCard.tsx, UserLeaderboard.tsx |
| spacing-10 | FREEZE PROTECTED | index.css:215 | 0 | 68 | 0 | 0 | 0 | 0 | PreparationView.tsx, ReviewLayout.tsx, ProfileHeader.tsx, LoginPage.tsx, SharedComponents.tsx, AntigravityCard.tsx, LeaderboardTopCard.tsx, SidebarLayout.tsx, LeaderboardView.tsx, AntigravityButton.tsx, ResultsPage.tsx, UserTopicExams.tsx, AntigravityLayout.tsx, ProfileForm.tsx, LeaderboardSkeleton.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, CreateStepSetup.tsx, AdminLeaderboard.tsx, Unauthorized.tsx, UpdatePasswordPage.tsx, QuestionForm.tsx, QuestionOptions.tsx, ReviewQuestionCard.tsx, LeaderboardComponents.tsx, IconBadge.tsx, QuestionCard.tsx, LeaderboardUserCard.tsx, CreateStepPublish.tsx, BulkActionBar.tsx |
| spacing-12 | FREEZE PROTECTED | index.css:216 | 0 | 41 | 0 | 0 | 0 | 0 | ProfileForm.tsx, QuestionForm.tsx, ResultView.tsx, ReviewLayout.tsx, TestConfigView.tsx, Unauthorized.tsx, AntigravityResults.tsx, SharedComponents.tsx, UserTeacherExams.tsx, StudentDetailModal.tsx, UserExams.tsx, NotificationPanel.tsx, AntigravityForm.tsx, AdminLeaderboard.tsx, SidebarLayout.tsx, SplashPage.tsx, ResultsPage.tsx, LeaderboardUserCard.tsx, LeaderboardView.tsx, AntigravityData.tsx, LeaderboardComponents.tsx, IconBadge.tsx, AntigravityDashboard.tsx, AntigravityCard.tsx, StudentsTable.tsx, AccountDisabledPage.tsx, Spinner.tsx, WelcomeBanner.tsx |
| spacing-16 | FREEZE PROTECTED | index.css:217 | 0 | 34 | 0 | 0 | 0 | 0 | ExamPaperGrid.tsx, SubAdminStudents.tsx, ReviewQuestionCard.tsx, SidebarLayout.tsx, LoginPage.tsx, SignupPage.tsx, DiagramRenderer.tsx, LeaderboardView.tsx, PremiumLoader.tsx, TopicMetadataFields.tsx, IconBadge.tsx, LeaderboardTable.tsx, ExamDetailModal.tsx, SharedComponents.tsx, AntigravityCard.tsx, ErrorBoundary.tsx, FinishSignInPage.tsx, AccountDisabledPage.tsx, QuestionPalette.tsx, QuestionNavigator.tsx |
| spacing-2 | FREEZE PROTECTED | index.css:209 | 0 | 314 | 0 | 0 | 0 | 0 | TopicInfoButton.tsx, AntigravityForm.tsx, LeaderboardMobileCard.tsx, SettingsCard.tsx, AddExamModal.tsx, QuestionCard.tsx, SegmentedFilter.tsx, VerifyEmailPage.tsx, SidebarLayout.tsx, JsonTab.tsx, QuestionNavigator.tsx, SplashPage.tsx, DiagramRenderer.tsx, ResultsPage.tsx, Pagination.tsx, QuestionForm.tsx, RankBadge.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, AntigravityLayout.tsx, CreateStepPublish.tsx, AntigravityData.tsx, InstructionsTab.tsx, PerformanceCharts.tsx, LeaderboardComponents.tsx, UploadContextPanel.tsx, ExamDetailModal.tsx, LanguageSelectionScreen.tsx, AdminTopicPreviewRenderer.tsx, StudentsTable.tsx, ProfileForm.tsx, UserTeacherExams.tsx, ParsedPreview.tsx, Navigation.tsx, LangInputPanel.tsx, ReviewLayout.tsx, ExamView.tsx, CompactDateTimePicker.tsx, QuestionVisualizer.tsx, SignupPage.tsx, ExamTimer.tsx, ExamLayout.tsx, QuestionActions.tsx, TopicReader.tsx, SubAdminMobileCard.tsx, SuccessView.tsx, AntigravityDashboard.tsx, ExamParamsForm.tsx, CarouselDots.tsx, ExamQuestionAnalysis.tsx, FormattedBodyText.tsx, PreviewTab.tsx, ActiveExamPage.tsx, LoginPage.tsx, TestConfigView.tsx, Menu.tsx, UploadProgressOverlay.tsx, ErrorBoundary.tsx, AccountDisabledPage.tsx, SingleQuestionModal.tsx, IdentitySection.tsx, ReviewView.tsx, SessionSection.tsx, StudentDetailModal.tsx, TeacherExamCard.tsx, BackupSection.tsx, ReviewPage.tsx, BulkActionBar.tsx, ResultView.tsx, PreparationView.tsx, RecentExamItem.tsx, ReviewQuestionCard.tsx, ExamHeader.tsx, AdminModal.tsx, UpdatePasswordPage.tsx, MethodSelectionView.tsx, ExamPaperGrid.tsx, LeaderboardTopCard.tsx, SubAdminStudents.tsx, ExamListSection.tsx, SubjectInsightsCard.tsx, QuestionsTable.tsx, ExamDetailSection.tsx, ExamStudentTable.tsx, ExamSubComponents.tsx, TopicMetadataFields.tsx, LeaderboardTabletCard.tsx, useToast.tsx, CollectionCard.tsx, CollectionFilter.tsx, AntigravityButton.tsx, TopicListItem.tsx, Unauthorized.tsx, QuestionsTableComponents.tsx, SharedComponents.tsx, AntigravityCard.tsx, TopicPortalView.tsx, QuestionPalette.tsx, NotificationPanel.tsx, Alert.tsx, AdminSubAdminsView.tsx, PremiumSelect.tsx, UsersTable.tsx, PremiumLoader.tsx, AdminTopics.tsx, SubmitExamModal.tsx |
| spacing-20 | FREEZE PROTECTED | index.css:218 | 0 | 16 | 0 | 0 | 0 | 0 | ExamPageError.tsx, SubAdminStudents.tsx, SidebarLayout.tsx, Navigation.tsx, AIToolCards.tsx, IconBadge.tsx, AntigravityResults.tsx, TeacherLeaderboardModal.tsx, AccountDisabledPage.tsx, AntigravityCard.tsx |
| spacing-24 | FREEZE PROTECTED | index.css:219 | 0 | 25 | 0 | 0 | 0 | 0 | AdminLeaderboard.tsx, ReviewLayout.tsx, CreateStepReview.tsx, SubAdminCreate.tsx, DiagramRenderer.tsx, ProfileHeader.tsx, IconBadge.tsx, LeaderboardTable.tsx, AntigravityResults.tsx, UploadProgressOverlay.tsx, TeacherLeaderboardModal.tsx, AntigravityCard.tsx |
| spacing-3 | FREEZE PROTECTED | index.css:210 | 0 | 296 | 0 | 0 | 0 | 0 | TopicInfoButton.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, AntigravityLayout.tsx, QuestionOptions.tsx, AddExamModal.tsx, Navigation.tsx, QuestionCard.tsx, AdminLeaderboard.tsx, AntigravityData.tsx, ReviewQuestionCard.tsx, PerformanceCharts.tsx, ExamDetailModal.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, AdminTopicPreviewRenderer.tsx, CarouselDots.tsx, ProfileForm.tsx, QuestionForm.tsx, RankBadge.tsx, LangInputPanel.tsx, CollectionFilter.tsx, AntigravityButton.tsx, ExamView.tsx, CompactDateTimePicker.tsx, QuestionVisualizer.tsx, SegmentedFilter.tsx, BilingualToggle.tsx, SidebarLayout.tsx, ExamLayout.tsx, PremiumSelect.tsx, CreateStepJsonPaste.tsx, CreateStepPublish.tsx, FormattedBodyText.tsx, ExamStudentTable.tsx, TopicReader.tsx, ExamSubComponents.tsx, CreateStepPrompt.tsx, StartTestButton.tsx, CreateStepSetup.tsx, Menu.tsx, SubmitExamModal.tsx, NotificationPanel.tsx, Alert.tsx, BulkActionBar.tsx, QuestionNavigator.tsx, CollectionCard.tsx, ActiveExamPage.tsx, AdminSelectionTabs.tsx, AntigravityDashboard.tsx, LeaderboardMobileCard.tsx, ExamPerformers.tsx, LeaderboardTopCard.tsx, ExamSummaryCards.tsx, ExamQuestionAnalysis.tsx, DashboardSkeletons.tsx, TopicSectionRenderer.tsx, StudentDetailModal.tsx, AIToolCards.tsx, AntigravityResults.tsx, SubjectInsightsCard.tsx, ResultsPage.tsx, TeacherExamFilterBar.tsx, CreateStepReview.tsx, QuestionsTable.tsx, SettingsCard.tsx, ExamDetailSection.tsx, LeaderboardView.tsx, ErrorActionButtons.tsx, PreviewTab.tsx, PreparationView.tsx, TopicMetadataFields.tsx, useToast.tsx, AdminTopics.tsx, StatisticsSection.tsx, SubAdminMobileCard.tsx, InstructionsTab.tsx, ReviewLayout.tsx, ProfileHeader.tsx, TopicListItem.tsx, SuccessView.tsx, LoginPage.tsx, LeaderboardComponents.tsx, UploadContextPanel.tsx, ExamHeader.tsx, Unauthorized.tsx, AdminModal.tsx, AdminFilterBar.tsx, UsersTable.tsx, DashboardRecentActivity.tsx, AdminUsers.tsx, UpdatePasswordPage.tsx, StatusBoard.tsx, UsersActions.tsx, QuestionsActions.tsx, QuestionPalette.tsx, SignupPage.tsx, VerifyEmailPage.tsx, ExamDetailRow.tsx, StudentsTable.tsx, CollectionHeader.tsx, QuestionActions.tsx, SplashPage.tsx, SharedComponents.tsx |
| spacing-4 | FREEZE PROTECTED | index.css:211 | 0 | 413 | 0 | 0 | 0 | 0 | DiagramRenderer.tsx, SubjectInsightsCard.tsx, CreateStepReview.tsx, QuestionForm.tsx, CreateStepJsonPaste.tsx, SettingsCard.tsx, ExamDetailSection.tsx, TopicSectionRenderer.tsx, AntigravityLayout.tsx, CreateStepPublish.tsx, ExamStudentTable.tsx, AddExamModal.tsx, PreviewTab.tsx, PreparationView.tsx, ReviewQuestionCard.tsx, TeacherExamCard.tsx, TopicListItem.tsx, ExamView.tsx, AdminModal.tsx, ExamDetailModal.tsx, SubjectCardItem.tsx, ExamParamsForm.tsx, StatusBoard.tsx, useActiveExam.tsx, QuestionCard.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, LeaderboardUserCard.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, VerifyEmailPage.tsx, AdminSubAdminsView.tsx, SidebarLayout.tsx, TopicCard.tsx, ExamQuestionAnalysis.tsx, AntigravityForm.tsx, ProfileForm.tsx, ParsedPreview.tsx, LeaderboardView.tsx, FormattedBodyText.tsx, TopicReader.tsx, ExamSubComponents.tsx, CreateStepPrompt.tsx, StartTestButton.tsx, AntigravityData.tsx, ActiveExamPage.tsx, ReviewLayout.tsx, ProfileHeader.tsx, CollectionFilter.tsx, AntigravityButton.tsx, SuccessView.tsx, LoginPage.tsx, CreateStepSetup.tsx, LeaderboardComponents.tsx, CompactDateTimePicker.tsx, ExamHeader.tsx, Menu.tsx, LeaderboardTable.tsx, SubmitExamModal.tsx, SegmentedFilter.tsx, QuestionPalette.tsx, SignupPage.tsx, LeaderboardTopCard.tsx, Alert.tsx, BulkActionBar.tsx, AccountDisabledPage.tsx, ExamLayout.tsx, QuestionActions.tsx, PremiumSelect.tsx, UserTeacherExams.tsx, Navigation.tsx, useToast.tsx, SuccessModal.tsx, ExamListSection.tsx, ReviewView.tsx, AttemptCardBase.tsx, LeaderboardTabletCard.tsx, CollectionCard.tsx, ReviewPage.tsx, SharedComponents.tsx, TeacherExamFilterBar.tsx, SessionSection.tsx, SelectionView.tsx, SubAdminCreate.tsx, BackupSection.tsx, ExamPaperGrid.tsx, NotificationSection.tsx, IdentitySection.tsx, Pagination.tsx, ResultsPage.tsx, PremiumLoader.tsx, PerformanceAnalyticsSection.tsx, AIToolCards.tsx, TestConfigView.tsx, UploadProgressOverlay.tsx, UserDashboard.tsx, RecentExamItem.tsx, AdminLeaderboard.tsx, AdminTopics.tsx, InstructionsTab.tsx, TopicsToolbar.tsx, UploadContextPanel.tsx, Unauthorized.tsx, AntigravityResults.tsx, MethodSelectionView.tsx, TopicPortalView.tsx, LeaderboardMobileCard.tsx, AdminSettings.tsx, DashboardSkeletons.tsx, ExamPerformers.tsx, ResultView.tsx, PerformanceMetricsGrid.tsx, StudentDetailModal.tsx, ExamPageLoading.tsx, SubjectPortalView.tsx, LoadingScreen.tsx, DailyAttemptsChart.tsx, AntigravityDashboard.tsx, DashboardRecentActivity.tsx, PerformanceSkeleton.tsx, PortalLoadingSkeleton.tsx, SubAdminStudents.tsx, JsonTab.tsx, QuestionNavigator.tsx, QuestionsTableComponents.tsx, FinishSignInPage.tsx, Spinner.tsx, SingleQuestionModal.tsx |
| spacing-5 | FREEZE PROTECTED | index.css:212 | 0 | 103 | 0 | 0 | 0 | 0 | CreateStepJsonPaste.tsx, SettingsCard.tsx, TopicSectionRenderer.tsx, CreateStepPublish.tsx, AddExamModal.tsx, CreateStepPrompt.tsx, PreparationView.tsx, SubjectPortalView.tsx, AIToolCards.tsx, CreateStepSetup.tsx, AntigravityDashboard.tsx, ExamDetailModal.tsx, QuestionCard.tsx, AntigravityCard.tsx, TopicPortalView.tsx, SidebarLayout.tsx, WelcomeBanner.tsx, AntigravityLayout.tsx, TopicReader.tsx, AntigravityData.tsx, ReviewLayout.tsx, SegmentedFilter.tsx, LeaderboardView.tsx, ExamSubComponents.tsx, TopicMetadataFields.tsx, AdminTopicPreviewRenderer.tsx, StatusBoard.tsx, FormattedBodyText.tsx, AdminTopics.tsx, AntigravityResults.tsx, ErrorContainer.tsx, ResultsPage.tsx, LeaderboardTabletCard.tsx, ReviewQuestionCard.tsx, CompactDateTimePicker.tsx, AntigravityForm.tsx, QuestionForm.tsx, LanguageSelectionScreen.tsx |
| spacing-6 | FREEZE PROTECTED | index.css:213 | 0 | 201 | 0 | 0 | 0 | 0 | DiagramRenderer.tsx, ProfileForm.tsx, ExamListSection.tsx, QuestionForm.tsx, SettingsCard.tsx, ExamDetailSection.tsx, LeaderboardView.tsx, AntigravityLayout.tsx, TopicReader.tsx, AddExamModal.tsx, PreparationView.tsx, ReviewLayout.tsx, LoginPage.tsx, TestConfigView.tsx, UploadContextPanel.tsx, AntigravityDashboard.tsx, AdminModal.tsx, QuestionVisualizer.tsx, AntigravityResults.tsx, RecruitmentSection.tsx, QuestionCard.tsx, SharedComponents.tsx, AntigravityCard.tsx, LanguageSelectionScreen.tsx, SignupPage.tsx, AdminTopicPreviewRenderer.tsx, LeaderboardTopCard.tsx, ErrorBoundary.tsx, CreateStepPrompt.tsx, useToast.tsx, AntigravityData.tsx, ActiveExamPage.tsx, AntigravityButton.tsx, ExamView.tsx, ExamHeader.tsx, TeacherLeaderboardModal.tsx, ExamTimer.tsx, SidebarLayout.tsx, BulkActionBar.tsx, QuestionNavigator.tsx, SplashPage.tsx, ResultsPage.tsx, UserTopicExams.tsx, StatusBoard.tsx, UserTeacherExams.tsx, MethodSelectionView.tsx, SubjectInsightsCard.tsx, BulkUploadModal.tsx, AdminLeaderboard.tsx, UploadProgressOverlay.tsx, SubmitExamModal.tsx, UserDashboard.tsx, VerifyEmailPage.tsx, TopicListView.tsx, PerformanceAnalyticsSection.tsx, TopicMetadataFields.tsx, AIToolCards.tsx, UpdatePasswordPage.tsx, AdminSubAdminsView.tsx, SubAdminDashboard.tsx, WelcomeBanner.tsx, QuestionsTable.tsx, SelectionView.tsx, UserExams.tsx, CreateStepSetup.tsx, DailyAttemptsChart.tsx, UsersTable.tsx, DashboardRecentActivity.tsx, AdminOverview.tsx, ExamPaperGrid.tsx, ExamSubComponents.tsx, Navigation.tsx, IconBadge.tsx, NotificationPanel.tsx, CarouselDots.tsx, AccountDisabledPage.tsx, ExamQuestionAnalysis.tsx, AntigravityForm.tsx, LeaderboardMobileCard.tsx, TopicSectionRenderer.tsx, StudentsTable.tsx |
| spacing-8 | FREEZE PROTECTED | index.css:214 | 0 | 161 | 0 | 0 | 0 | 0 | DiagramRenderer.tsx, ProfileForm.tsx, SessionSection.tsx, TopicReader.tsx, AddExamModal.tsx, PremiumLoader.tsx, ResultView.tsx, PreparationView.tsx, ReviewQuestionCard.tsx, ReviewLayout.tsx, ProfileHeader.tsx, BackupSection.tsx, TestConfigView.tsx, Unauthorized.tsx, AdminModal.tsx, AntigravityResults.tsx, UploadProgressOverlay.tsx, MethodSelectionView.tsx, RecruitmentSection.tsx, AntigravityCard.tsx, SignupPage.tsx, LeaderboardTopCard.tsx, ErrorBoundary.tsx, SubAdminStudents.tsx, NotificationSection.tsx, IdentitySection.tsx, WelcomeBanner.tsx, LeaderboardView.tsx, AntigravityLayout.tsx, AntigravityButton.tsx, SharedComponents.tsx, RetryButton.tsx, SidebarLayout.tsx, BulkActionBar.tsx, QuestionNavigator.tsx, ExamDetailSection.tsx, ActiveExamPage.tsx, UserLeaderboard.tsx, UserPerformance.tsx, LoginPage.tsx, StatusBoard.tsx, ExamView.tsx, UpdatePasswordPage.tsx, SubmitExamModal.tsx, useActiveExam.tsx, VerifyEmailPage.tsx, SplashPage.tsx, ResultsPage.tsx, AttemptCardBase.tsx, DailyAttemptsChart.tsx, PerformanceSkeleton.tsx, LeaderboardUserCard.tsx, PortalLoadingSkeleton.tsx, QuestionForm.tsx, AIToolCards.tsx, TopicListItem.tsx, LeaderboardComponents.tsx, IconBadge.tsx, ExamDetailModal.tsx, QuestionsTableComponents.tsx, Spinner.tsx, ExamListSection.tsx, LeaderboardTabletCard.tsx |
| stat-card-3d-shadow | MERGE | themes.css:806 | 0 | 5 | 2 | 0 | 0 | 12 | SharedComponents.tsx, AntigravityCard.tsx, index.css, themes.css |
| stat-card-bg | KEEP | themes.css:1109; themes.css:1244 | 0 | 0 | 1 | 1 | 0 | 9 | index.css |
| stat-card-border | FREEZE PROTECTED | themes.css:1111; themes.css:1245 | 0 | 3 | 1 | 0 | 0 | 1 | AntigravityCard.tsx, AntigravityData.tsx, index.css |
| stat-card-radius | FREEZE PROTECTED | themes.css:1113 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityCard.tsx, index.css |
| stat-card-shadow | FREEZE PROTECTED | themes.css:1112; themes.css:1246 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityCard.tsx, index.css |
| stat-card-text | SAFE REMOVE | themes.css:1110 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| stat-icon-bg | FREEZE PROTECTED | themes.css:1116 | 0 | 3 | 1 | 0 | 0 | 0 | PremiumIconContainer.tsx, AntigravityCard.tsx, index.css |
| stat-icon-color | FREEZE PROTECTED | themes.css:1117 | 0 | 3 | 1 | 0 | 0 | 0 | PremiumIconContainer.tsx, AntigravityCard.tsx, index.css |
| stat-icon-radius | FREEZE PROTECTED | themes.css:1118 | 0 | 1 | 1 | 0 | 0 | 0 | AntigravityCard.tsx, index.css |
| stat-label-text | FREEZE PROTECTED | themes.css:1115; themes.css:1248 | 0 | 1 | 1 | 0 | 0 | 2 | AntigravityCard.tsx, index.css |
| stat-value-text | FREEZE PROTECTED | themes.css:1114; themes.css:1247 | 0 | 4 | 2 | 0 | 0 | 1 | AntigravityCard.tsx, LoginPage.tsx, index.css |
| success | MERGE | index.css:277 | 5 | 95 | 0 | 0 | 0 | 10 | ResultView.tsx, StudentDetailModal.tsx, StatisticsSection.tsx, ReviewLayout.tsx, SubAdminDashboard.tsx, ProfileForm.tsx, QuestionForm.tsx, QuestionOptions.tsx, PreparationView.tsx, AdminTopics.tsx, AntigravityData.tsx, ReviewQuestionCard.tsx, ProfileHeader.tsx, AIToolCards.tsx, AntigravityButton.tsx, TopicListItem.tsx, IconBadge.tsx, TestConfigView.tsx, ExamDetailModal.tsx, AntigravityResults.tsx, StatusBoard.tsx, QuestionCard.tsx, Alert.tsx, SubjectInsightsCard.tsx, ParsedPreview.tsx, AttemptCardBase.tsx, PreviewTab.tsx, useToast.tsx, InstructionsTab.tsx, LeaderboardComponents.tsx, RecruitmentSection.tsx, AntigravityCard.tsx, SignupPage.tsx, LeaderboardUserCard.tsx, SubjectInsightItem.tsx, QuestionPalette.tsx, index.css |
| surface-canvas | SAFE REMOVE | themes.css:584; themes.css:824 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| surface-floating | FREEZE PROTECTED | themes.css:589; themes.css:828 | 10 | 0 | 3 | 2 | 0 | 47 | DiagramRenderer.tsx, ChartVisualizer.tsx, SubjectPieChart.tsx, DailyAttemptsChart.tsx, Menu.tsx, PremiumSelect.tsx, index.css, themes.css |
| surface-hover | SAFE REMOVE | themes.css:591; themes.css:830 | 0 | 0 | 1 | 0 | 0 | 1 | themes.css |
| surface-inset | SAFE REMOVE | themes.css:592; themes.css:831 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| surface-interactive | SAFE REMOVE | themes.css:588; themes.css:827 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| surface-nav | SAFE REMOVE | themes.css:585 | 0 | 0 | 0 | 0 | 0 | 20 |  |
| surface-overlay | SAFE REMOVE | themes.css:590; themes.css:829 | 0 | 0 | 1 | 0 | 0 | 6 | themes.css |
| surface-primary | KEEP | themes.css:586; themes.css:825 | 0 | 0 | 1 | 1 | 0 | 5 | index.css |
| surface-raised | SAFE REMOVE | themes.css:593; themes.css:832 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| surface-secondary | SAFE REMOVE | themes.css:587; themes.css:826 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| surface-stat | KEEP | themes.css:797 | 0 | 0 | 1 | 0 | 0 | 24 | themes.css |
| surface-tab-pill | KEEP | themes.css:798 | 0 | 0 | 1 | 0 | 0 | 3 | themes.css |
| teal-100 | SAFE REMOVE | themes.css:133 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| teal-200 | SAFE REMOVE | themes.css:134 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| teal-300 | SAFE REMOVE | themes.css:135 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| teal-400 | SAFE REMOVE | themes.css:136 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| teal-50 | SAFE REMOVE | themes.css:132 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| teal-500 | SAFE REMOVE | themes.css:137 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| teal-600 | SAFE REMOVE | themes.css:138 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| teal-700 | SAFE REMOVE | themes.css:139 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| teal-800 | SAFE REMOVE | themes.css:140 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| teal-900 | SAFE REMOVE | themes.css:141 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| teal-950 | SAFE REMOVE | themes.css:142 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| text-badge | SAFE REMOVE | themes.css:543; index.css:458; index.css:472; index.css:487 | 0 | 0 | 0 | 0 | 0 | 4 |  |
| text-body | FREEZE PROTECTED | themes.css:535; index.css:455; index.css:469; index.css:484 | 2 | 0 | 0 | 0 | 0 | 5 | AdminText.tsx, AntigravityTypography.tsx |
| text-caption | FREEZE PROTECTED | themes.css:537; index.css:255; index.css:453; index.css:456; index.css:470; index.css:481; index.css:485 | 1 | 0 | 0 | 0 | 0 | 3 | AntigravityTypography.tsx |
| text-disabled | KEEP | themes.css:417; themes.css:699 | 0 | 3 | 5 | 2 | 0 | 0 | ReviewQuestionCard.tsx, ReviewLayout.tsx, index.css, themes.css |
| text-display | FREEZE PROTECTED | themes.css:527; index.css:444; index.css:454; index.css:468; index.css:483 | 1 | 0 | 0 | 0 | 0 | 10 | AntigravityTypography.tsx |
| text-emphasis | SAFE REMOVE | themes.css:577; themes.css:877 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| text-h1 | MERGE | themes.css:529; index.css:248; index.css:308; index.css:441; index.css:451; index.css:465; index.css:479 | 1 | 0 | 0 | 1 | 0 | 11 | AntigravityTypography.tsx, index.css |
| text-h2 | MERGE | themes.css:531; index.css:249; index.css:309 | 1 | 0 | 0 | 1 | 0 | 4 | AntigravityTypography.tsx, index.css |
| text-h3 | MERGE | themes.css:533; index.css:250 | 1 | 0 | 0 | 1 | 0 | 6 | AntigravityTypography.tsx, index.css |
| text-h4 | KEEP | index.css:251 | 0 | 0 | 0 | 1 | 0 | 6 | index.css |
| text-h5 | KEEP | index.css:252; index.css:442; index.css:452; index.css:466; index.css:480 | 0 | 0 | 0 | 1 | 0 | 0 | index.css |
| text-h6 | KEEP | index.css:253 | 0 | 0 | 0 | 1 | 0 | 0 | index.css |
| text-header | SAFE REMOVE | themes.css:573; themes.css:873 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| text-heading | FREEZE PROTECTED | themes.css:555 | 1 | 0 | 0 | 0 | 0 | 16 | AdminText.tsx |
| text-hint | FREEZE PROTECTED | themes.css:416; themes.css:698 | 1 | 15 | 1 | 0 | 0 | 3 | ExamDetailModal.tsx, DiagramRenderer.tsx, ResultsPage.tsx, QuestionForm.tsx, AdminTopics.tsx, StatisticsSection.tsx, AntigravityCard.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, VerifyEmailPage.tsx, AccountDisabledPage.tsx, index.css |
| text-label | FREEZE PROTECTED | themes.css:539; index.css:256; index.css:443; index.css:467; index.css:482 | 1 | 0 | 0 | 0 | 0 | 13 | AntigravityTypography.tsx |
| text-link | SAFE REMOVE | themes.css:420; themes.css:702 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| text-metadata | FREEZE PROTECTED | themes.css:546 | 1 | 0 | 0 | 0 | 0 | 9 | AdminText.tsx |
| text-muted | FREEZE PROTECTED | themes.css:415; themes.css:697 | 22 | 93 | 3 | 0 | 0 | 3 | ExamListSection.tsx, ExamDetailSection.tsx, ExamStudentTable.tsx, ExamSubComponents.tsx, RecentExamItem.tsx, ExamDetailModal.tsx, RecentAttemptItem.tsx, StudentsTable.tsx, ExamQuestionAnalysis.tsx, paletteColors.ts, DiagramRenderer.tsx, AntigravityForm.tsx, SubjectInsightsCard.tsx, Pagination.tsx, LeaderboardMobileCard.tsx, TeacherExamFilterBar.tsx, AdminSettings.tsx, QuestionForm.tsx, RankBadge.tsx, LeaderboardView.tsx, AntigravityLayout.tsx, ResultView.tsx, PreviewTab.tsx, TopicMetadataFields.tsx, LeaderboardTabletCard.tsx, AdminLeaderboard.tsx, SubAdminMobileCard.tsx, InstructionsTab.tsx, ReviewLayout.tsx, TeacherExamCard.tsx, PerformanceCharts.tsx, ProfileHeader.tsx, CollectionFilter.tsx, TopicListItem.tsx, TopicsToolbar.tsx, LeaderboardComponents.tsx, IconBadge.tsx, TestConfigView.tsx, QuestionVisualizer.tsx, AdminUsers.tsx, StatusBoard.tsx, SubmitExamModal.tsx, QuestionCard.tsx, ExamPaperGrid.tsx, TeacherLeaderboardModal.tsx, TopicPortalView.tsx, LanguageSelectionScreen.tsx, LeaderboardUserCard.tsx, ExamTimer.tsx, NotificationPanel.tsx, ExamDetailRow.tsx, AntigravityTypography.tsx, AdminSubAdminsView.tsx, BulkActionBar.tsx, CollectionHeader.tsx, PremiumSelect.tsx, SingleQuestionModal.tsx, PerformanceSectionHeader.tsx, index.css, themes.css |
| text-nav | SAFE REMOVE | themes.css:559; themes.css:859 | 0 | 0 | 1 | 0 | 0 | 8 | themes.css |
| text-nav-active | KEEP | themes.css:565; themes.css:865 | 0 | 0 | 4 | 3 | 0 | 2 | index.css, themes.css |
| text-nav-hover | SAFE REMOVE | themes.css:562; themes.css:862 | 0 | 0 | 1 | 0 | 0 | 1 | themes.css |
| text-nav-secondary | SAFE REMOVE | themes.css:561; themes.css:861 | 0 | 0 | 1 | 0 | 0 | 1 | themes.css |
| text-on-accent | KEEP | themes.css:418; themes.css:700 | 0 | 0 | 5 | 2 | 0 | 0 | index.css, themes.css |
| text-on-danger | KEEP | themes.css:419; themes.css:701 | 0 | 0 | 2 | 1 | 0 | 0 | index.css, themes.css |
| text-on-dark | KEEP | themes.css:421; themes.css:703 | 0 | 1 | 1 | 0 | 0 | 1 | WelcomeBanner.tsx, index.css |
| text-primary | FREEZE PROTECTED | themes.css:412; themes.css:694 | 14 | 211 | 23 | 7 | 0 | 13 | ChartVisualizer.tsx, MapVisualizer.tsx, AntigravityData.tsx, SubjectPieChart.tsx, DailyAttemptsChart.tsx, QuestionVisualizer.tsx, TopicInfoButton.tsx, DiagramRenderer.tsx, AntigravityForm.tsx, ExamListSection.tsx, ResultsPage.tsx, Pagination.tsx, LeaderboardMobileCard.tsx, ParsedPreview.tsx, CreateStepReview.tsx, QuestionForm.tsx, CreateStepJsonPaste.tsx, SessionSection.tsx, AttemptCardBase.tsx, SettingsCard.tsx, ExamDetailSection.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, CreateStepPublish.tsx, FormattedBodyText.tsx, ExamStudentTable.tsx, TopicListView.tsx, TopicReader.tsx, ExamSubComponents.tsx, QuestionOptions.tsx, AddExamModal.tsx, SelectionView.tsx, ResultView.tsx, MathBlock.tsx, Navigation.tsx, QuestionCard.tsx, PreviewTab.tsx, StudentDetailModal.tsx, PreparationView.tsx, SubAdminCreate.tsx, LeaderboardTabletCard.tsx, useToast.tsx, SubjectPortalView.tsx, CollectionCard.tsx, AntigravityData.tsx, SubAdminMobileCard.tsx, RecentExamItem.tsx, ReviewQuestionCard.tsx, ActiveExamPage.tsx, InstructionsTab.tsx, ReviewLayout.tsx, TeacherExamCard.tsx, PerformanceCharts.tsx, ProfileHeader.tsx, CollectionFilter.tsx, AntigravityButton.tsx, TopicListItem.tsx, SuccessView.tsx, ExamView.tsx, LoginPage.tsx, CreateStepSetup.tsx, LeaderboardComponents.tsx, CompactDateTimePicker.tsx, TestConfigView.tsx, ExamHeader.tsx, Unauthorized.tsx, Menu.tsx, UsersTable.tsx, QuestionVisualizer.tsx, ThemeToggle.tsx, ExamDetailModal.tsx, AntigravityResults.tsx, AdminUsers.tsx, UploadProgressOverlay.tsx, StatusBoard.tsx, RecruitmentSection.tsx, SubmitExamModal.tsx, RecentAttemptItem.tsx, SharedComponents.tsx, TeacherLeaderboardModal.tsx, TopicPortalView.tsx, MermaidDiagram.tsx, LanguageSelectionScreen.tsx, SignupPage.tsx, LeaderboardUserCard.tsx, AdminTopicPreviewRenderer.tsx, NotificationPanel.tsx, BilingualToggle.tsx, ExamDetailRow.tsx, ErrorBoundary.tsx, AntigravityTypography.tsx, SubAdminStudents.tsx, SidebarLayout.tsx, BulkActionBar.tsx, StudentsTable.tsx, ExamSummaryCards.tsx, TopicCard.tsx, PremiumSelect.tsx, SingleQuestionModal.tsx, ExamQuestionAnalysis.tsx, SubjectInsightItem.tsx, index.css, themes.css |
| text-secondary | FREEZE PROTECTED | themes.css:413; themes.css:695 | 16 | 192 | 9 | 2 | 0 | 4 | DiagramRenderer.tsx, ChartVisualizer.tsx, DailyAttemptsChart.tsx, QuestionVisualizer.tsx, DiagramRenderer.tsx, AdminTopics.tsx, ExamDetailModal.tsx, NotificationPanel.tsx, AntigravityForm.tsx, ExamListSection.tsx, SubjectInsightsCard.tsx, ResultsPage.tsx, Pagination.tsx, LeaderboardMobileCard.tsx, TeacherExamFilterBar.tsx, ParsedPreview.tsx, CreateStepReview.tsx, QuestionForm.tsx, RankBadge.tsx, QuestionsTable.tsx, AttemptCardBase.tsx, ExamDetailSection.tsx, LeaderboardView.tsx, TopicSectionRenderer.tsx, AntigravityLayout.tsx, CreateStepPublish.tsx, FormattedBodyText.tsx, ExamStudentTable.tsx, TopicListView.tsx, TopicReader.tsx, ExamSubComponents.tsx, QuestionOptions.tsx, AddExamModal.tsx, CreateStepPrompt.tsx, StartTestButton.tsx, Navigation.tsx, QuestionCard.tsx, PreviewTab.tsx, PreparationView.tsx, LeaderboardTabletCard.tsx, ExamPageLoading.tsx, LangInputPanel.tsx, AntigravityData.tsx, SubAdminMobileCard.tsx, ReviewQuestionCard.tsx, ActiveExamPage.tsx, InstructionsTab.tsx, UserTopics.tsx, ReviewLayout.tsx, PerformanceCharts.tsx, ProfileHeader.tsx, AIToolCards.tsx, TopicListItem.tsx, LoadingScreen.tsx, SuccessView.tsx, LoginPage.tsx, CreateStepSetup.tsx, LeaderboardComponents.tsx, CompactDateTimePicker.tsx, TestConfigView.tsx, Unauthorized.tsx, AntigravityDashboard.tsx, AdminModal.tsx, LeaderboardTable.tsx, QuestionVisualizer.tsx, ThemeToggle.tsx, AntigravityResults.tsx, UploadProgressOverlay.tsx, SubmitExamModal.tsx, SharedComponents.tsx, SegmentedFilter.tsx, LanguageSelectionScreen.tsx, SignupPage.tsx, UserIdentity.tsx, AdminTopicPreviewRenderer.tsx, VerifyEmailPage.tsx, BilingualToggle.tsx, ErrorBoundary.tsx, AntigravityTypography.tsx, SubAdminStudents.tsx, AdminSubAdminsView.tsx, SidebarLayout.tsx, BulkActionBar.tsx, QuestionActions.tsx, TopicCard.tsx, QuestionNavigator.tsx, PremiumSelect.tsx, ExamQuestionAnalysis.tsx, index.css, themes.css |
| text-small | SAFE REMOVE | themes.css:549 | 0 | 0 | 0 | 0 | 0 | 8 |  |
| text-stat-value | MERGE | themes.css:541; index.css:192; index.css:457; index.css:471; index.css:486 | 0 | 3 | 0 | 0 | 0 | 14 | LoginPage.tsx |
| text-title | FREEZE PROTECTED | themes.css:414; themes.css:696 | 0 | 14 | 1 | 0 | 0 | 19 | TopicSectionRenderer.tsx, AntigravityLayout.tsx, TopicListView.tsx, TopicReader.tsx, AntigravityData.tsx, AdminModal.tsx, SubjectCardItem.tsx, AntigravityTypography.tsx, TopicCard.tsx, index.css |
| transparent | SAFE REMOVE | themes.css:268 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| warning | MERGE | index.css:279 | 2 | 75 | 0 | 0 | 0 | 7 | StudentDetailModal.tsx, SubAdminDashboard.tsx, QuestionForm.tsx, RankBadge.tsx, LeaderboardView.tsx, PreparationView.tsx, AntigravityData.tsx, ReviewQuestionCard.tsx, PerformanceCharts.tsx, IconBadge.tsx, ExamDetailModal.tsx, StatusBoard.tsx, QuestionCard.tsx, Alert.tsx, WelcomeBanner.tsx, LeaderboardMobileCard.tsx, PreviewTab.tsx, RecentExamItem.tsx, AntigravityCard.tsx, index.css |
| weight-black | SAFE REMOVE | themes.css:335 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| weight-bold | KEEP | themes.css:334 | 0 | 0 | 2 | 2 | 0 | 1 | index.css |
| weight-light | SAFE REMOVE | themes.css:330 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| weight-medium | SAFE REMOVE | themes.css:332 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| weight-regular | SAFE REMOVE | themes.css:331 | 0 | 0 | 1 | 0 | 0 | 0 | themes.css |
| weight-semibold | SAFE REMOVE | themes.css:333 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| weight-thin | SAFE REMOVE | themes.css:329 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| white | SAFE REMOVE | themes.css:266 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| z-canvas | SAFE REMOVE | themes.css:639 | 0 | 0 | 0 | 0 | 0 | 3 |  |
| z-content | SAFE REMOVE | themes.css:640 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| z-drawer | SAFE REMOVE | themes.css:642 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| z-modal | SAFE REMOVE | themes.css:643 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| z-sticky | SAFE REMOVE | themes.css:641 | 0 | 0 | 0 | 0 | 0 | 1 |  |
| z-toast | SAFE REMOVE | themes.css:644 | 0 | 0 | 0 | 0 | 0 | 3 |  |

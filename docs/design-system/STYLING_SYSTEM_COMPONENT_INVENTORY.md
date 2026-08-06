# Styling System Component Inventory

- **Phase:** 5.0 — Repository Styling System Architecture Audit (Step 4 / Step 5 / Step 6)
- **Scope:** `src/components/**` (236 component files), variant/prop systems, page-level usage
- **Type:** Documentation only. Zero code, token, or Foundation changes.
- **Status:** Completed
- **Date:** 2026-08-04

---

## 1. Foundation (Design-System) Component Inventory

### 1.1 Primitives — Common design-system components (`src/components/common/`)

| Component | File | Props | Variant prop | Variant values | Used? |
|---|---|---|---|---|---|
| Card | `AntigravityCard.tsx:7` | 12 | `variant` | `elevated`,`default`,`subtle`,`premium`,`premium-neutral`,`premium-dark-neutral`,`auth-light`,`management` | 8/8 ✅ |
| Card | — | — | `padding` | `16`,`20`,`24`,`0` | 4/4 ✅ |
| StatCard | `AntigravityCard.tsx:89` | — | `status` | `accent`,`warning`,`success`,`info`,`danger`,`secondary` | accent/secondary/info/warning ✅; `success`,`danger` ❌ |
| Button | `AntigravityButton.tsx:9` | 10 | `variant` | `primary`,`secondary`,`success`,`danger`,`soft`,`ghost`,`auth-dark`,`auth-muted`,`auth-violet` | 6/9 ✅; `auth-dark`,`auth-muted`,`auth-violet` ❌ |
| Button | — | — | `size` | `xs`,`sm`,`md`,`lg`,`xl`,`auth-xl` | 5/6 ✅; `auth-xl` ❌ |
| Input/TextArea | `AntigravityForm.tsx:18` | 34 | `variant` | `default`,`compact`,`violet`,`management` | 3/4 ✅; `violet` ❌ |
| Tabs | `AntigravityData.tsx:26` | 41 | `variant`/`size`/`bare` | `primary`,`secondary` / `sm`,`md`,`lg` / boolean | variants ✅; `size` never passed ❌ |
| Badge | `AntigravityData.tsx:158` | — | `variant` | `default`,`success`,`danger`,`warning`,`primary`,`secondary` | 6/6 ✅ |
| ResultStatCard | `AntigravityResults.tsx:23` | 2 | `variant` | `success`,`danger`,`default`,`warning`,`primary` | 3/5 ✅; `warning`,`primary` ❌ |
| ErrorContainer | `ErrorContainer.tsx` (types `error.types.ts:38`) | — | `variant`/`category`/`severity` | `page`,`inline`,`banner`,`modal` | page/inline ✅; `banner`,`modal` ❌ |
| AdminText | `AdminText.tsx:27` | 5 | `variant` | `cinzel`,`garamond`,`cinzel-value`,`garamond-value`,`sans` | 3/5 ✅; `cinzel-value`,`garamond-value` ❌ |
| AdminText | — | — | `size` (CanonicalSize) | `display`,`h1`,`h2`,`h3`,`heading`,`body`,`caption`,`metadata`,`stat-value`,`badge`,`small` | only `metadata`,`body`,`heading` ✅ |
| Avatar | `Avatar.tsx` | 9 | `size`/`shape` | `sm`,`md`,`lg` / `circle`,`square` | app: only `md`+`circle`; `sm`,`lg`,`square` test-only |
| IconBadge | `IconBadge.tsx:21-28` | 6 | `status`/`shape` | `primary`,`success`,`warning`,`danger`,`secondary`,`muted`,`default` / `circle`,`rounded` | 7/7 ✅ |
| Spinner | `Spinner.tsx:3-4` | 3 | `variant`/`size` | `primary`,`neutral` / `sm`,`md`,`lg` | `neutral` ❌ |
| Menu | `Menu.tsx:32,37` | 25 | `animation`/`variant` | `scale`,`fade`,`slide` / `default`,`management` | `scale` ✅; `fade`,`slide` ❌; management via CollectionFilter ✅ |
| CollectionCard | `CollectionCard.tsx:7-8` | 20 | `layout`/`variant` | `grid`,`row` / `default`,`premium`,`subtle`,`outlined`,`compact`,`management` | only `layout=row`,`premium`,`management` ✅ |
| CollectionFilter | `CollectionFilter.tsx:24` | 9 | `variant` | `premium`,`management` | both ✅ |
| CollectionHeader | `CollectionHeader.tsx` | 7 | — | — | ✅ |
| CollectionToolbar | `AntigravityLayout.tsx` | — | `variant` | `management` | ✅ (UsersActions) |
| AdminModal | `AdminModal.tsx:24` | 13 | `variant` | `premium`,`management` | `premium` default ✅; `management` ❌ |
| SharedComponents (LoadingSkeleton/GridSkeleton/EmptyState/ConfirmModal) | `SharedComponents.tsx` | 15 | `variant`/`type` | `premium`,`management` / `text`,`card` | management ✅ (UsersTable/AdminUsers) |
| Alert | `Alert.tsx:4` | 5 | `variant` | `info`,`success`,`error`,`warning` | error/warning ✅; info/success test-only ⚠️ |
| BrandTitle | `AntigravityTypography.tsx:127` | — | `variant` | `plain`,`gradient` | gradient ✅ |
| AntigravityDashboard | `AntigravityDashboard.tsx` | 1 | — | — | ✅ |

### 1.2 No-variant primitives
`Pagination`, `DataTable`, `PremiumIconContainer`, `AdminIconWrap` — no variant props.

### 1.3 Ancillary primitives outside `common/`
`Loader.tsx`, `PremiumLoader.tsx` (`src/components/`), `TagBadge.tsx` (`src/components/user/`),
`ToastContainer` (in `src/hooks/useToast.tsx`). Note: **no dedicated `Badge.tsx`** — Badge lives in
`AntigravityData.tsx`.

---

## 2. Dead Variant Values (defined, never passed in app code)

| Component | Dead variant values |
|---|---|
| Button | `auth-dark`, `auth-muted`, `auth-violet`; `size=auth-xl` |
| Input/TextArea | `violet` |
| ResultStatCard | `warning`, `primary` |
| ErrorContainer | `banner`, `modal` |
| AdminText | `cinzel-value`, `garamond-value`; sizes `display/h1/h2/h3/caption/stat-value/badge/small` |
| Spinner | `neutral` |
| Menu | `fade`, `slide` |
| CollectionCard | `layout="grid"`, `variant=default/subtle/outlined/compact` |
| AdminModal | `management` |
| Tabs | `size=sm/md/lg` (never explicitly passed) |
| StatCard | `success`, `danger` |

**Tightest unused surface families:** the `auth-*` family (Button auth-*, size auth-xl) and the `management`
family is largely used only via `UsersTable`/`UsersActions`/`AdminUsers`.

---

## 3. Reusable-Component Usage (import counts)

### 3.1 Dead / orphaned files (zero importers anywhere in `src`)
| File | Reason |
|---|---|
| `components/PaletteBackground.tsx` | Zero imports repo-wide |
| `components/admin/overview/index.ts` | Dead barrel — `AdminOverview.tsx` imports sub-files directly |
| `components/admin/questions/index.ts` | Dead barrel |
| `components/admin/settings/types.ts` | Dead re-export barrel |
| `components/admin/topics/index.ts` | Dead barrel |
| `components/admin/upload/index.ts` | Dead barrel |
| `components/admin/users/index.ts` | Dead barrel |
| `components/user/subject-tests/index.ts` | Dead barrel |
| `components/user/topic-exams/index.ts` | Dead barrel |
| `components/user/topics/index.ts` | Dead barrel |

**Dead chain check:** none — no dead file is imported by another dead file.

### 3.2 Unreferenced exported symbols (19 total)
`TopicFieldErrors`, `AlertProps`, `StaggerContainer`, `StaggerItem`, `ButtonSize`, `PREMIUM_SURFACE_IMAGE`,
`ActivityCard`, `SectionWrapper`, `CTACard`, `DataTableColumn`, `DataTableProps`, `ICON_BADGE_SIZES`,
`IconBadgeStatus`, `TableSkeleton`, `QuestionInfoHeader`, `MonthOption`, `WelcomeBannerVariant`, `getGreeting`,
`PaletteBackground`.

### 3.3 Top fan-in (Total importers)
| Count | Component |
|---|---|
| 143 | `common/AntigravityUI` (barrel) |
| 50 | `common/SharedComponents` |
| 28 | `common/AntigravityTypography` |
| 15 | `common/AdminText` |
| 12 | `common/AdminModal` |
| 11 | `common/AntigravityAnimation` |
| 8 | `common/AntigravityCard`, `common/Spinner`, `common/AdminIconWrap`, `admin/shared/AdminSelectionTabs` |
| 7 | `common/AntigravityButton`, `Logo` |
| 6 | `common/DiagramRenderer`, `common/IconBadge`, `common/QuestionVisualizer`, `user/UserSelectionTabs` |
| 5 | `common/AntigravityData`, `common/BilingualToggle`, `common/Navigation`, `exam/index.ts` |
| 4 | `common/AntigravityLayout`, `sub-admin/exams/ExamSubComponents` |

### 3.4 Single-consumer fragile dependencies (module tree relies on a barrel or one consumer)
- `admin/leaderboard/LeaderboardMobileCard`, `LeaderboardTabletCard` → only `LeaderboardView`
- `user/ExamDetailRow` → only `TeacherExamCard`
- `visualizers/{ChartVisualizer,MapVisualizer,MathBlock,MermaidDiagram}` → only `QuestionVisualizer` (lazy)
- `profile/{ProfileForm,ProfileHeader,StatisticsSection,useProfile}` → only `UserProfile`

---

## 4. Feature-Tree Inventory (non-Foundation)

| Tree | Module | Root pages |
|---|---|---|
| Admin Overview | `components/admin/overview` | `AdminOverview.tsx` |
| Admin Questions | `components/admin/questions` (+ `modals/`, `useBulkUpload.ts`) | `AdminQuestions.tsx` |
| Admin Topics | `components/admin/topics` | `AdminTopics.tsx` |
| Admin Upload | `components/admin/upload` | `AdminUpload.tsx` |
| Admin Users | `components/admin/users` | `AdminUsers.tsx` |
| Admin Settings | `components/admin/settings` | `AdminSettings.tsx` |
| Admin Leaderboard | `components/admin/leaderboard` | `AdminLeaderboard.tsx` |
| Admin Sub-Admins | `components/admin/sub-admins` | `AdminSubAdmins.tsx` |
| Exam (take/result flow) | `components/exam` (barrel `index.ts`) | `ActiveExamPage`, `ResultsPage`, `ReviewPage` |
| Sub-Admin create | `components/sub-admin/create` | `SubAdminCreate.tsx` |
| Sub-Admin dashboard | `components/sub-admin/dashboard` | `SubAdminDashboard.tsx` |
| Sub-Admin exams | `components/sub-admin/exams` | `SubAdminDashboard.tsx` |
| Sub-Admin settings | `components/sub-admin/settings` | `SubAdminSettings.tsx` |
| Sub-Admin students | `components/sub-admin/students` | `SubAdminStudents.tsx` |
| User dashboard | `components/user/dashboard` | `UserDashboard.tsx` |
| User full-exams | `components/user/full-exams` | `UserExams.tsx` |
| User topic-exams | `components/user/topic-exams` | `UserTopicExams.tsx` |
| User subject-tests | `components/user/subject-tests` | `UserSubjectTests.tsx` |
| User prepare-write | `components/user/prepare-write` | `UserPrepareWrite.tsx` |
| User performance | `components/user/performance` | `UserPerformance.tsx` |
| User leaderboard | `components/user/leaderboard` | `UserLeaderboard.tsx` |
| User topics | `components/user/topics` | `UserTopics.tsx` |
| User educator-exams | `components/user/educator-exams` | `UserTeacherExams.tsx` |
| Profile | `components/profile` | `UserProfile.tsx` |
| Visualizers | `components/visualizers` | lazy via `QuestionVisualizer` |
| Top-level | `Loader`, `PremiumLoader`, `LoadingScreen`, `Logo`, `PaletteBackground` (dead) | `App.tsx`, `AuthContext.tsx`, `Guards.tsx` |

---

## 5. Key Takeaways
1. **10 dead files** (8 never-routed barrels + `PaletteBackground.tsx` + `settings/types.ts`) + **19 unreferenced
   exports** — all safely deletable.
2. **20+ dead variant values** across 11 components are pure unused surface area.
3. The Foundation is a **star-shaped monolith** (`AntigravityUI`: 143 importers, 36 dependencies) — see
   Architecture Audit §4 and Simplification Plan S6.
# Architecture Baseline Certification & Maintenance Framework

**Certified:** 2026-07-22  
**Program:** AR-001 through AR-030  
**Status:** Architecture backlog closed  
**Version:** 3.12.0  

---

## Part 1 — Repository Architecture Baseline

### Layer Hierarchy

```
Routes (App.tsx)
   │
   ▼
Guards (AuthGuard, RoleGuard, GuestGuard)
   │
   ▼
Layouts (UserLayout, AdminLayout, SubAdminLayout, SidebarLayout)
   │
   ▼
Pages (admin/, sub-admin/, user/, exam/, auth/, root/)
   │
   ├──► Feature Components (admin/, sub-admin/, user/, exam/, visualizers/)
   │        │
   │        ├──► Common Components (src/components/common/)
   │        │        │
   │        │        ├──► Foundation (AntigravityUI, AntigravityButton, etc.)
   │        │        └──► Context (ThemeContext, LanguageContext)
   │
   ├──► Hooks (src/hooks/)
   │        │
   │        └──► Services (src/services/)
   │                 │
   │                 └──► Repositories (src/lib/repositories/)
   │                          │
   │                          └──► Supabase client (src/lib/supabase.ts)
   │
   ├──► Context (AuthContext, ThemeContext, LanguageContext)
   │
   └──► Utilities (src/utils/, src/lib/utils/, src/validations/)
```

### Allowed Dependency Directions

```
Pages → Hooks → Services → Repositories → Supabase
Pages → Components → Foundation
Pages → Context
Pages → Utilities
Components → Hooks → Services
Components → Context
Components → Utilities
Hooks → Services → Repositories
Hooks → Utilities
Services → Repositories
Services → Utilities
Context → Utilities
```

### Forbidden Dependency Directions

```
Pages → Pages
Components → Pages
Services → Components, Pages
Repositories → Services, Components, Pages
Hooks → Components, Pages
Context → Components (Loader in AuthContext is the sole exception — documented as acceptable)
Feature Components (admin/) → Feature Components (sub-admin/, user/)
Cross-panel imports: admin ↔ sub-admin ↔ user
```


## Part 2 — Canonical Owners

### Hooks

| Concern | Canonical Owner |
|----------|----------------|
| Mounted lifecycle (race condition safety) | `useStableFetch` |
| Async lifecycle (loading/error/execute) | `useAsyncOperation` |
| Database queries (loading/data/error) | `useSupabaseQuery` |
| Auth state | `AuthContext` (via `useAuth`) |
| Theme state | `ThemeContext` (via `useTheme`) |
| Language state | `LanguageContext` (via `useLanguage`) |
| Toast notifications | `useToast` |
| Portal workflow | `usePortalLaunch` + `usePortalInit` + `usePortalPaperState` |
| Admin filters | `useAdminFilters` |
| Dashboard data | `useDashboardData` |
| Notifications | `useNotifications` |
| Breakpoint detection | `useBreakpoint` |
| Hover detection | `useCanHover` |
| Document title | `useDocumentTitle` |
| Date range | `useDateRange` |
| Paper selection | `useAppscPaperSelection` |
| Bulk upload | `useBulkUpload` |
| Coupon validation | `useCouponValidation` |
| Sign-out confirmation | `useSignOutConfirmation` |

### Exam Hooks (pages/exam/hooks/)

| Concern | Canonical Owner |
|----------|----------------|
| Exam initialization | `useExamInitialization` |
| Exam session | `useExamSession` |
| Exam security | `useExamSecurity` |
| Exam keyboard | `useExamKeyboard` |
| Exam submission | `useExamSubmission` |
| Question navigation | `useQuestionNavigation` |

### Components (Foundation — AntigravityUI barrel)

| Concern | Canonical Owner |
|----------|----------------|
| Buttons | `AntigravityButton` (Button, IconButton) |
| Cards | `AntigravityCard` (Card, CardHeader, CardContent) |
| Forms | `AntigravityForm` (Input, Select, TextArea, Label) |
| Typography | `AntigravityTypography` (H1–H4, Body, Label, Badge) |
| Layout | `AntigravityLayout` (PageContainer, Stack, FilterBar, SectionReveal) |
| Animations | `AntigravityAnimation` (FadeIn, SlideUp, ScaleIn, SectionReveal) |
| Data display | `AntigravityData` (DataTable, StatCard, InfoRow) |
| Dashboard | `AntigravityDashboard` (ExamCard, StatCard, MetricRow) |
| Results | `AntigravityResults` (ScoreCard, ResultStatCard) |
| Menu / Dropdown | `Menu` |
| Navigation | `Navigation` |
| Pagination | `Pagination` |
| Spinner | `Spinner` |
| Alert | `Alert` |
| IconBadge | `IconBadge` |
| LoadingOverlay | `LoadingOverlay` |
| Shared UI | `SharedComponents` (LoadingSkeleton, EmptyState, ConfirmModal, GridSkeleton, StatSkeleton) |

### Components (Common — Beyond Foundation)

| Concern | Canonical Owner |
|----------|----------------|
| Modal shell | `AdminModal` (in `src/components/common/`) |
| Themed text | `AdminText` (in `src/components/common/`) |
| Themed icon container | `AdminIconWrap` (in `src/components/common/`) |
| Search/filter bar | `AdminFilterBar` (in `src/components/common/`) |
| Attempt card | `AttemptCardBase` |
| Recent attempt card | `RecentAttemptCard` |
| Diagram renderer | `DiagramRenderer` |
| Question visualizer | `QuestionVisualizer` |
| Exam paper card | `ExamPaperCard` |
| Start test button | `StartTestButton` |
| Bilingual toggle | `BilingualToggle` |
| Topic info button | `TopicInfoButton` |
| Error action buttons | `ErrorActionButtons` |
| Portal loading skeleton | `PortalLoadingSkeleton` |
| Premium icon container | `PremiumIconContainer` |
| Notification panel | `NotificationPanel` |
| Formatted body text | `FormattedBodyText` |
| Topic reader | `TopicReader` |
| Exam header | `ExamHeader` |
| Exam layout | `ExamLayout` |
| Question card | `QuestionCard` (in `components/exam/`) |
| Question navigator | `QuestionNavigator` |
| Question palette | `QuestionPalette` |
| Submit exam modal | `SubmitExamModal` |

### Services

| Concern | Canonical Owner |
|----------|----------------|
| Auth flows | `authService` |
| User profiles | `userService` |
| Exam-taking lifecycle | `examService` |
| Admin operations | `adminService` |
| Admin questions | `adminQuestionService` |
| Teacher exams | `teacherExamService` |
| Subject tests | `subjectTestService` |
| Topic tests | `topicTestService` |
| Performance history | `performanceService` |
| Leaderboard | `leaderboardService` |
| Dashboard stats | `dashboardService` |
| Notifications | `notificationService` |
| Topics CRUD | `topicsService` |
| Prepare & Write | `prepareWriteService` |
| Question availability | `questionAvailabilityService` |
| Cache (admin SWR) | `adminQueryCache` |
| Retry persistence | `persistenceRetry` |

### Repositories

| Concern | Canonical Owner |
|----------|----------------|
| User data | `user.repository` |
| Exam configs | `exam.repository` |
| Questions | `question.repository` |
| Attempts | `attempt.repository` |
| Topics | `topic.repository` |
| Teacher exams | `teacherExam.repository` |
| Dashboard | `dashboard.repository` |
| Leaderboard | `leaderboard.repository` |
| Notifications | `notification.repository` |

### Utilities

| Concern | Canonical Owner |
|----------|----------------|
| Query cache (dedup + TTL) | `queryCache.fetchWithDedup` |
| Repository validation | `validateOrThrow` (in `src/lib/utils/`) |
| Date formatting | `dateUtils` |
| CSV export | `csvUtils` |
| Time formatting | `timeUtils` |
| Score calculation | `scoreUtils` |
| Rank calculation | `rankUtils` |
| Retry with backoff | `retryUtils` |
| Hashing | `hashUtils` |
| Exam state calculation | `examStateCalculator` |
| Exam session store | `examSessionStore` |
| Authentication helpers | `authUtils` |
| Route by role | `getRouteForRole` |
| i18n / language | `i18n` + `languageUtils` |
| Logging | `logger` |
| Safe Supabase calls | `safeSupabase` |
| Palette colors | `paletteColors` |
| Parse outline text | `parseOutlineText` |
| Exam utilities | `examUtils` (in `src/lib/`) |
| Topic format hints | `topicFormatHints` (in `src/constants/`) |
| AI prompt template | `aiPromptTemplate` (in `src/constants/`) |
| Zod schemas (questions) | `questionSchema` (in `src/validations/`) |
| Zod schemas (security) | `securitySchemas` (in `src/validations/`) |

### Types

| Concern | Canonical Owner |
|----------|----------------|
| Auth types | `auth.types` |
| Exam domain types | `exam.types` |
| Leaderboard types | `leaderboard.types` |
| SubAdmin types | `subAdmin.types` |
| User types | `user.types` |
| AttemptWithRelations | `exam.types` (single canonical source) |

### Guards

| Concern | Canonical Owner |
|----------|----------------|
| Authentication guard | `AuthGuard` |
| Role-based guard | `RoleGuard` |
| Guest-only guard | `GuestGuard` |
| Guard loader | `GuardLoader` |


## Part 3 — Architectural Rules

### Layer Rules

1. **Pages never import Pages.** Zero exceptions.
2. **Components never import Pages.** Zero exceptions.
3. **Services never import Components or Pages.** Zero exceptions.
4. **Repositories never import Services, Components, or Pages.** Zero exceptions.
5. **Hooks never import Components or Pages.** Exception: `useDashboardData` imports a type from `AttemptCardBase` — this is the sole documented violation, now fixed by centralizing `AttemptWithRelations` in `exam.types`.
6. **Context providers never import Components.** Documented exception: `AuthContext` imports `Loader` (presentation-only, 23 lines, zero business logic dependencies, 2 consumers).
7. **Cross-panel imports are forbidden.** Sub-admin → admin, user → admin, admin → sub-admin, admin → user are all violations. After AR-027, only `UserSelectionTabs` re-export from `AdminSelectionTabs` remains — documented as acceptable (Category C).

8. **Utilities never import React runtime (hooks, rendering, lifecycle) or UI Components.** Type-only React imports are permitted. Utilities remain framework-independent.

9. **Type definition files never import runtime code.** Types may import interfaces, enums, and other types only. Types never import services, repositories, utilities, React components, or runtime values.

### React Rules

1. **Data fetching:** Always use `useStableFetch` (race-condition safety), `useAsyncOperation` (loading/error/execute triad), or `useSupabaseQuery` (loading/data/error triad).
2. **Never duplicate mounted lifecycle.** Use `useStableFetch` which provides the `mountedRef` pattern internally.
3. **Never duplicate async lifecycle.** Use `useAsyncOperation` for any operation with loading/error states.
4. **Derived state:** Compute from existing state with `const` — never store in `useState`.
5. **useEffect dependencies:** Always provide complete dependency arrays. No empty dependency arrays without justification.
6. **Cleanup:** Always clean up subscriptions, timeouts, and abort controllers in useEffect returns.
7. **memo:** Justify each `React.memo` usage — all existing usages are on pure visual renderers (charts, diagrams, list items) and are appropriate.

### Service Rules

1. **Repositories own database access.** All Supabase queries live in `src/lib/repositories/`.
2. **Services own orchestration.** Business logic, transformation, and multi-repo coordination live in `src/services/`.
3. **Pages never call Supabase directly.** Pages call services, which call repositories.
4. **Validation stays in repositories.** Repositories validate incoming data via Zod schemas using `validateOrThrow()`.
5. **Cache layer:** Use `queryCache.fetchWithDedup()` for deduplication + TTL; use `adminQueryCache` for SWR caching in admin contexts.

### Authorization Rules

1. **Route layer owns page-level authorization.** `AuthGuard` + `RoleGuard` protect route access. Pages do not duplicate page-level guards.
2. **Business operations keep permission checks.** `ensureRole()` in service calls prevents unauthorized operations regardless of route protection.
3. **No page-level `isAdmin()`/`isSubAdmin()` checks.** These were removed in AR-015 and AR-025.

### UI Rules

1. **Use Foundation (AntigravityUI) components whenever appropriate.** Do not duplicate `Button`, `Input`, `Card`, `TextArea`, `Select`, `Badge`, `Modal`, `Menu`, `Pagination`, `Spinner`.
2. **Specialized UI remains specialized.** Feature-specific components (exam `QuestionCard`, `PerformanceAnalyticsSection`) are intentionally not generic.
3. **No raw `fixed inset-0` modals.** Use `AdminModal` for all modal dialogs. `PromptEditorModal` and `AddExamModal` are the only two remaining violations — deferred (accessibility gap: no focus trap, aria-modal, aria-labelledby, or keyboard dismissal).

### Accessibility Rules

1. **Modals:** Focus trap, `aria-modal`, `aria-labelledby`, `aria-describedby` — provided by `AdminModal`.
2. **Carousels:** `role="tablist"`, `role="tab"`, `aria-selected` — implemented in AR-021.
3. **Menus:** `role="menu"`, `aria-expanded`, `aria-haspopup`, keyboard navigation — implemented in AR-022.
4. **Form controls:** `htmlFor`/`id` label association — implemented in AR-023.

### Notification Rules

1. **Workflow owner:** `useToast` + `ToastContainer`.
2. **Presentation components never own notifications.** Notification logic belongs in callbacks and effects, not in render output.

### Error Handling Architecture

1. **Repository layer:** Repositories validate incoming data via `validateOrThrow`. Repositories throw domain errors. Repositories never swallow errors.
2. **Service layer:** Services orchestrate repositories. Services may translate repository errors into business-level errors. Services never silently ignore failures.
3. **Hook layer:** Hooks own loading state. Hooks expose errors to consumers. Hooks never hide repository or service failures.
4. **UI layer:** Pages determine error presentation. Presentation components never own error recovery logic. `ErrorBoundary` owns unexpected rendering failures at the top level.
5. **Logger:** `logger` records diagnostic information. Logger never replaces error propagation — logging is supplementary to throwing or surfacing errors.

## Part 4 — ADR Registry

| ADR | Title | Decision | Status |
|:---:|-------|----------|:------:|
| ADR-001 | Component Architecture & Foundation | Foundation components in common/; pages own composition | Accepted |
| ADR-002 | State Management Approach | React state + context; no external state library | Accepted |
| ADR-003 | Service Layer Design | Service → Repository → Supabase layering | Accepted |
| ADR-004 | Portal Package Architecture | Feature-specific package proposal | Superseded (by implementation) |
| ADR-005 | Accessibility Baseline | ARIA, keyboard, focus per WCAG 2.1 AA | Accepted |
| ADR-006 | Mobile-First Architecture | Responsive breakpoints + mobile layouts | Rejected |
| ADR-007 | Repository-First Audit Scope | Methodology for future audits | Superseded by Architecture Baseline Part 7 |
| ADR-008 | Architecture Backlog Governance | Backlog as single source of truth; stale closure process | Accepted |

Total: 8 ADRs (5 accepted, 2 superseded, 1 rejected). 21 of 30 ARs required no ADR (routine cleanup).


## Part 5 — Repository Metrics

| Metric | Value |
|--------|-------|
| Architecture Refactoring items | 30 |
| Completed with implementation | 24 |
| Closed as stale | 6 (AR-013, AR-016, AR-018, AR-019, AR-026, AR-028) |
| ADRs accepted | 5 |
| ADRs pending | 0 |
| Files created | 46 |
| Files deleted | 23 |
| Largest single file reduction | 1323 → 96 lines (AR-004) |
| Cumulative behavioral changes | Zero |
| Canonical hooks established | 19 |
| Canonical services | 17 |
| Canonical repositories | 9 |
| Canonical utilities | 18 |
| Cross-layer violations eliminated | 12 (AR-027) |
| Orphan files deleted | 7 (AR-029 + AR-030) |
| Duplicate type definitions resolved | 2 (AttemptWithRelations, validateOrThrow) |
| Dead barrel exports removed | 2 (QuestionCard, Tooltip from AntigravityUI) |
| Unused exports removed | 2 (ROLE_ACCESS, hasAdminPrivileges) |
| Dead utility exports documented | 2 (formatDateShort, formatDateJoined) |
| Final backlog version | 3.12.0 |


## Part 6 — Maintenance Checklist

### Architecture

- [ ] No reverse dependencies (pages→pages, components→pages, services→components, repos→services)
- [ ] No duplicate ownership — check if a concern already has a canonical owner before creating new
- [ ] No new utilities without justification — prefer extending existing utility files
- [ ] No duplicated async lifecycle — use `useAsyncOperation`
- [ ] No duplicated mounted lifecycle — use `useStableFetch`
- [ ] No duplicated query lifecycle — use `useSupabaseQuery`
- [ ] No duplicate validation — use `validateOrThrow()` from `src/lib/utils/`
- [ ] No page-level `isAdmin()`/`isSubAdmin()` checks — route guards + `ensureRole()` in services
- [ ] Pages never call Supabase directly — always through services → repositories

### Accessibility

- [ ] New modals use `AdminModal` (focus trap, ARIA attributes)
- [ ] New carousels use `role="tablist"`, `role="tab"`, `aria-selected`
- [ ] New menus use `role="menu"`, `aria-expanded`, `aria-haspopup`
- [ ] New form controls associate `<label htmlFor>` with `<input id>`
- [ ] Keyboard navigation supported for interactive components

### Performance

- [ ] New routes lazy-loaded in App.tsx
- [ ] `React.memo` justified (pure visual renderers only)
- [ ] No eager imports for page-level components
- [ ] No unnecessary re-renders from derived state stored in `useState`

### Design System

- [ ] Foundation components used when available (`Button`, `Input`, `Card`, `Modal`, etc.)
- [ ] Specialized components remain specialized (not promoted to Foundation prematurely)
- [ ] No raw `fixed inset-0` modals — use `AdminModal`
- [ ] Utilities do not import React runtime — type-only imports permitted
- [ ] Type files import only types, interfaces, and enums — no runtime code
- [ ] Error propagation follows repository → service → hook → UI ownership


## Part 7 — Future Audit Policy

A new Architecture Refactoring (AR) item may be created **only if** ALL criteria are satisfied:

1. **Repository evidence** proves the issue exists (verified via grep, not assumption)
2. **Duplication** is objectively measurable (identical code, same pattern across 3+ files)
3. **Ownership** demonstrably improves (single owner replaces scattered responsibilities)
4. **Behavioral risk** is acceptable (no core exam-taking or auth paths)
5. **Architectural value** is measurable (lines removed, violations eliminated, ownership consolidated)

**AR creation is NOT justified for:**
- Cosmetic improvements
- Subjective style preferences
- Speculative future benefits
- "This could be cleaner" without measurable impact
- Patterns that appear in fewer than 3 files
- Architecture changes based solely on code review preference without measurable runtime, maintainability, or ownership improvement

**When defects are found during development:**
- Fix them inline during the feature PR
- Do not create a new AR unless the defect meets all 5 criteria above

**Stale closure policy (inherited from AR methodology):**
- If a backlog claim is disproven by repository evidence, mark it Stale
- Document the repository evidence
- Perform no runtime changes


## Part 8 — Success Criteria

| Criterion | Status |
|-----------|:------:|
| Single owner for every architectural concern | ✅ Certified |
| No proven duplicate ownership | ✅ Certified (all known duplicates resolved: AttemptWithRelations, validateOrThrow, page-level guards) |
| Layer boundaries respected | ✅ Certified (remaining exceptions documented and accepted) |
| Repository is internally consistent | ✅ Certified |
| Accessibility baseline established | ✅ Certified (AR-021, AR-022, AR-023 complete) |
| Performance baseline established | ✅ Certified (all routes lazy-loaded, memoization justified) |
| No repository-backed architectural defects remaining | ✅ Certified (30 ARs completed, all verified issues addressed) |


## Final Certification

**ARCHITECTURE BASELINE CERTIFIED**

- AR-001 through AR-030 are complete.
- The architecture backlog is closed.
- Future work should focus on feature development and maintenance.
- New Architecture Refactoring items require fresh repository-backed evidence meeting all 5 criteria in Part 7 — they must not be created proactively.
- This baseline document becomes the reference for all future code reviews, PRs, and architectural decisions.

---

*This document certifies the architecture baseline as of 2026-07-22. Any deviation from the rules in Part 3 or ownership in Part 2 should be flagged during code review.*

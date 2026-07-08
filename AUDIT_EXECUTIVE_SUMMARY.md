# PrepareForU — Full Codebase Audit & Quality Report

## Overview

**Audited:** Admin Panel (8 pages) + User Panel (11 pages, 16 sub-views, 7 shared components)
**Total files inspected:** ~50+ across `pages/`, `components/`, `services/`, `hooks/`
**Frameworks:** React 18 (Vite), TypeScript, Tailwind CSS, Framer Motion, Supabase
**UI Library:** Antigravity UI (in-house component library)

---

## Architecture

```
App.tsx
 ├─ AdminLayout → AuthGuard → RoleGuard("admin","sub_admin") → SidebarLayout(ADMIN_NAV)
 ├─ UserLayout  → AuthGuard → SidebarLayout(USER_NAV)
 └─ Exam routes (active-exam, result, review) → AuthGuard only (no layout)
```

**Admin panel:** 8 pages — Overview, Users, Questions, Topics, Upload, Settings, SubAdmins, Leaderboard. All under `RoleGuard` for role-based access.

**User panel:** 11 pages — Dashboard, Exams, History, SubjectTests, TopicExams, StudyTopics, PrepareWrite, Performance, TeacherExams, Leaderboard, Profile, Upgrade. Plus 16 sub-view components and 1 chart component.

**Shared layout:** Both panels use `SidebarLayout` with different nav configs (`ADMIN_NAV` / `USER_NAV`).

---

## Service Layer (9 services)

| Service | Lines | Caching | Notes |
|---|---|---|---|
| examService | 611 | 2 functions cached | Largest service; imports from performanceService |
| userService | 424 | Yes | Profile, exam selection |
| subjectTestService | 300 | 4 functions cached | Fisher-Yates shuffle, attempted-exclusion |
| topicTestService | 335 | 6 functions cached | **4 duplicates from subjectTestService** |
| leaderboardService | 230 | 3 functions cached | 2m TTL on rankings |
| performanceService | 173 | 3 functions cached | 5m TTL on attempts |
| prepareWriteService | 198 | 3 functions cached | Same question-fetch pattern as examService |
| teacherExamService | 148 | 2 functions cached | 30s TTL (live data); uses `ensureRole` |
| dashboardService | ~80 | 2 functions cached | Only service using `ServiceResult<>` wrapper |
| topicsService | ~120 | **Zero caching** | Only service without any cache |

**Cache keys follow:** `domain_context_varyingPart` (e.g., `perf_attempts_${userId}`, `lb_metadata_${examSelection}`)

---

## Issue Tracker

### 🔴 Critical (6 issues)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **C1** | `topicTestService.ts` has 4 exact duplicate functions from `subjectTestService.ts` (same cache keys, same TTLs, same implementation) | `topicTestService.ts:1-120` | ~80 lines of dead duplicate code; cache key collisions |
| **C2** | `UserTopics.tsx` imports `AdminSelectionTabs` from admin panel | `UserTopics.tsx:7` | Cross-pollination; admin component in user bundle |
| **C3** | Cache key strings `perf_attempts_${userId}` and `perf_metadata_${examSelection}` duplicated across page files | `UserHistory.tsx:45-51`, `UserPerformance.tsx:71-77` | Tight coupling; changing keys requires editing 2 files |
| **C4** | `queryCache` used directly in page files, bypassing service abstractions | `UserExams.tsx:28-34`, `UserSubjectTests.tsx:59-65`, etc. | Bypasses TTL/force-refresh logic in services |
| **C5** | `requestId` + `mountedRef` stale-response guard pattern duplicated in 10+ page files | Nearly every user page | ~20 lines of boilerplate × 10 files = 200+ lines |
| **C6** | No lazy loading for `TopicTestViews` / `SubjectTestViews` sub-views | `UserSubjectTests.tsx:22-26`, `UserTopicExams.tsx:16-19` | All 8 sub-views eagerly imported on mount |

### 🟡 Moderate (8 issues)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **M1** | Inconsistent toast rendering — mixed use of `ToastContainer` component vs inline toast overlay | `UserTopics.tsx:748-754` vs `UserSubjectTests.tsx:443-449` vs `UserProfile.tsx:412` | Visual inconsistency |
| **M2** | `sessionStorage` persistence pattern repeated in 3 test-flow pages with identical save/restore logic | `UserSubjectTests.tsx`, `UserTopicExams.tsx`, `UserPrepareWrite.tsx` | Duplicated session management |
| **M3** | Live tab auto-refresh in TeacherExams without proper dedup | `UserTeacherExams.tsx:140-145` | Potential memory leak, unnecessary API calls |
| **M4** | `UserLeaderboard.tsx` uses fetch-on-mount + `setInterval` refresh | `UserLeaderboard.tsx` | Similar to M3 pattern |
| **M5** | `dashboardService.ts` uses `ServiceResult<>` wrapper while all other services throw errors | `dashboardService.ts` | Inconsistent error handling pattern |
| **M6** | `topicsService.ts` has zero caching while all other services cache | `topicsService.ts` | Every topic navigation triggers a new network request |
| **M7** | `UserPerformance.tsx` loads answers with a 300ms debounce + manual cancellation flag | `UserPerformance.tsx:194-211` | Fragile; could be replaced with `AbortController` |
| **M8** | Admin panel uses `AdminSelectionTabs` while user panel re-imports it directly | Cross-panel | User panel shouldn't know about admin components |

### 🟢 Minor (6 issues)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **m1** | `UserUpgrade.tsx` doesn't exist — routed as `UpgradePage.tsx` in App.tsx | `App.tsx` | Confusing naming mismatch |
| **m2** | `UserTeacherExams.tsx` uses top-level `export default` but imports `TeacherExamNavigationState` from types | `UserTeacherExams.tsx:36` | Type import coupled with view logic |
| **m3** | `cleanOptionText` utility function duplicated in both test page files | `UserSubjectTests.tsx:29-32`, `UserTopicExams.tsx:22-25` | 2 copies of same regex |
| **m4** | `renderPalette` function duplicated in both test page files (~50 lines each) | `UserSubjectTests.tsx:273-312`, `UserTopicExams.tsx:308-347` | ~80 lines of duplicate JSX |
| **m5** | `formatDate` helper defined inline in `UserHistory.tsx` instead of a shared utility | `UserHistory.tsx:30-36` | Not reusable |
| **m6** | `useCanHover` hook defined inline in `UserTopics.tsx` instead of `hooks/` directory | `UserTopics.tsx:20-30` | Should be extracted to shared hook |

---

## Code Health Metrics

| Metric | Admin Panel | User Panel |
|--------|------------|------------|
| Pages | 8 | 11 (main) + 16 (sub-views) |
| Services used | 3 | 9 |
| Hooks used | 3 (shared) | 9 (including shared) |
| User-specific components | 5 | 3 |
| Shared components | from `common/` | Same `common/` pool |
| Dead code found | ✅ Removed (`AdminSharedComponents.tsx`) | None found |
| TS errors | 0 | **0 (verified)** |
| `requestId` pattern instances | 0 | 10+ |

---

## Recommendations (Priority Order)

1. **Extract `requestId` + `mountedRef` into a `useStableFetch` hook** — saves ~200 lines across 10 files
2. **Deduplicate `topicTestService.ts`** — re-export from `subjectTestService.ts` instead of copying
3. **Move `AdminSelectionTabs` import out of `UserTopics.tsx`** — either create a user-facing wrapper or export a neutral version
4. **Centralize cache key constants** — define `PERF_ATTEMPTS_KEY`, `PERF_METADATA_KEY` in `performanceService.ts`
5. **Lazy-load sub-views** — wrap `TopicTestViews` and `SubjectTestViews` imports with `React.lazy`
6. **Standardize toast rendering** — pick one pattern (`ToastContainer` component) across all pages
7. **Extract shared test-flow utilities** — `renderPalette`, `cleanOptionText`, `formatTime`, session persistence
8. **Add caching to `topicsService.ts`** — at minimum 5m TTL for read operations

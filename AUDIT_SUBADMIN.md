# PrepareForU — Sub-Admin Panel Audit Report

## Overview

**Files inspected:** 5 pages, 1 sub-view, 1 layout, 2 services
**Total lines:** ~3,567
**Frameworks:** React 18 (Vite), TypeScript, Tailwind CSS, Framer Motion, Supabase

---

## Architecture

```
/sub-admin routes (AuthGuard → RoleGuard)
 ├── /dashboard   → SubAdminDashboard.tsx  (stats, recent exams, recent attempts)
 ├── /my-exams    → SubAdminExams.tsx      (exam evaluation, analytics, leaderboard)
 ├── /students    → SubAdminStudents.tsx   (student grid, profiles, attempts)
 ├── /create      → SubAdminCreate.tsx     (5-step exam creation wizard)
 └── /settings    → SubAdminSettings.tsx   (profile, notifications, exports)

Shared components:
 └── ExamDetailModal.tsx (questions + leaderboard modal)
```

**Note:** Sub-admin routes use `AuthGuard` + `RoleGuard` at the route level, but each page ALSO has an inline `isSubAdmin(user)` guard — redundant.

---

## Issue Tracker

### 🔴 Critical (6 issues)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **C1** | `setTimeout` without cleanup in Step 1 → Step 2 transition | `SubAdminCreate.tsx:467-469` | State update on unmounted component if user navigates away during 500ms delay |
| **C2** | No race condition guard in `ExamDetailModal.fetchDetails` | `ExamDetailModal.tsx:101-103` | Stale response may overwrite correct data on rapid exam switches |
| **C3** | CSV download logic duplicated in 3 files | `SubAdminExams.tsx:426-449`, `SubAdminStudents.tsx:181-201`, `SubAdminSettings.tsx:250-256` | ~60 lines of duplicate code; behavior will drift |
| **C4** | `showSuccess` used for error messages in 3 files | `SubAdminExams.tsx:393`, `SubAdminStudents.tsx:177`, `SubAdminSettings.tsx:207` | Green success toast for failure messages — confusing UX |
| **C5** | Largest/most complex page lacks `mountedRef` async guard | `SubAdminCreate.tsx` (1321 lines) | Async publish callback may set state on unmounted component |
| **C6** | `console.warn`/`console.error` instead of structured logger | `SubAdminCreate.tsx:451`, `ExamDetailModal.tsx:94` | Bypasses project's logger utility |

### 🟡 Moderate (8 issues)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **M1** | Very long files with inline sub-components | `SubAdminExams.tsx` (1080L), `SubAdminCreate.tsx` (1321L) | Reduced maintainability; 6 inner components prevent extraction |
| **M2** | Cross-layer dependency on admin component | `SubAdminStudents.tsx:7` imports `AdminModal` from `admin/common` | Sub-admin bundle includes admin component code |
| **M3** | Hardcoded magic numbers (`limit(50)`, `limit(100)`, `limit(200)`, `limit(5000)`) | `SubAdminDashboard.tsx:108`, `SubAdminExams.tsx:201,264`, `SubAdminSettings.tsx:220,239` | Tight coupling; changing limits requires editing each call site |
| **M4** | IIFE in JSX instead of `useMemo` | `SubAdminExams.tsx:350` | `summaryStats` recalculated on every render |
| **M5** | Page-level role guarding duplicated 5× instead of using route-level `RoleGuard` | All 5 page files | 5 identical `isSubAdmin()` checks + `<Navigate to="/unauthorized">` |
| **M6** | Missing TypeScript types — `exam: any`, event handlers typed as `any` | `ExamDetailModal.tsx:17`, `SubAdminCreate.tsx:160+` | Bypasses type safety |
| **M7** | Empty `catch` block silently swallowing errors | `SubAdminSettings.tsx:201` | `navigator.share()` failures invisible |
| **M8** | Direct `supabase.from()` calls mixed with service layer calls | `SubAdminDashboard.tsx`, `SubAdminExams.tsx` | Inconsistent architecture; bypasses caching/security in services |

### 🟢 Minor (6 issues)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **m1** | Unused import `Target` from lucide-react | `SubAdminExams.tsx:13` | Dead import |
| **m2** | `!important` CSS classes in className strings | `SubAdminDashboard.tsx:158+` | Fragile override pattern |
| **m3** | `let url` with switch statement instead of const map | `SubAdminCreate.tsx:454-461` | Could use `Record<string, string>` |
| **m4** | Type cast to `any` for joined query results | `SubAdminStudents.tsx:105,109` | Loses type safety on teacher_exams join |
| **m5** | `handleCopyData` doesn't actually copy all data | `SubAdminStudents.tsx:171-179` | Misleading function name |
| **m6** | Inline `<style>` tag in JSX creates new style element | `ExamDetailModal.tsx:403-407` | Fragile CSS pattern |

---

## Recommendations (Priority Order)

1. Fix `setTimeout` cleanup in SubAdminCreate (C1)
2. Add `mountedRef` race guard to ExamDetailModal (C2)
3. Extract CSV download utility to shared file (C3 + C6)
4. Replace `showSuccess` misuse with `showError` (C4)
5. Add `mountedRef` to SubAdminCreate (C5)
6. Replace `console.warn`/`console.error` with logger (C6)
7. Remove unused imports (m1)
8. Replace IIFE with `useMemo` in SubAdminExams (M4)
9. Type the `exam` prop in ExamDetailModal (M6)

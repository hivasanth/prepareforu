# AR-027 — Cross-Layer Dependency Audit

## Date
2026-07-22

## Auditor
Repository-first methodology

## Backlog Claims (from ARCHITECTURE_BACKLOG.md)

| Claim | File:Line | Verdict |
|-------|-----------|---------|
| `SubAdminStudents.tsx:7` imports `AdminModal` from admin | `SubAdminStudents.tsx:45` imports `AdminModal` from `../../components/admin/common/AdminModal` | **TRUE** (line mismatch — actual line 45, not 7) |
| `UserTopics.tsx:7` imports `AdminSelectionTabs` from admin | `UserTopics.tsx:4` imports `UserSelectionTabs` from `../../components/user/UserSelectionTabs` | **STALE** — imports from user layer re-export barrel |

## Repository Evidence

### 4 components identified as pure UI (no admin-specific dependencies)

| Component | File | Dependencies | Admin-specific? |
|-----------|------|-------------|:---------------:|
| AdminModal | `src/components/admin/common/AdminModal.tsx` | react, react-dom, focus-trap-react, lucide-react | No |
| AdminIconWrap | `src/components/admin/common/AdminIconWrap.tsx` | react, ThemeContext | No |
| AdminText | `src/components/admin/common/AdminText.tsx` | react, ThemeContext | No |
| AdminFilterBar | `src/components/admin/common/AdminFilterBar.tsx` | lucide-react, AntigravityUI | No |

### 1 component is genuinely admin-aware

| Component | File | Admin deps | Classification |
|-----------|------|-----------|---------------|
| AdminSelectionTabs | `src/components/admin/shared/AdminSelectionTabs.tsx` | adminService, role checks | Category C — intentional |

### Cross-layer import inventory (pre-fix)

| Direction | Count | Components |
|-----------|-------|-----------|
| sub-admin → admin | 10 | AdminModal, AdminIconWrap, AdminText, AdminFilterBar |
| user → admin | 2 | AdminModal (1 direct), AdminSelectionTabs (1 re-export alias) |
| admin → sub-admin | 0 | — |
| sub-admin → user | 0 | — |
| user → sub-admin | 0 | — |

### AdminModal consumer map (10 files)

| File | Layer |
|------|-------|
| `src/pages/sub-admin/SubAdminStudents.tsx` | Sub-admin Page |
| `src/components/sub-admin/exams/ExamDetailModal.tsx` | Sub-admin Component |
| `src/components/user/TeacherLeaderboardModal.tsx` | User Component |
| `src/components/exam/SubmitExamModal.tsx` | Shared Component |
| `src/components/common/SharedComponents.tsx` | Common Component |
| `src/pages/LoginPage.tsx` | Page |
| `src/pages/admin/AdminTopics.tsx` | Admin Page |
| `src/components/admin/sub-admins/AdminSubAdminsView.tsx` | Admin Component |
| `src/components/admin/questions/modals/SingleQuestionModal.tsx` | Admin Component |
| `src/components/admin/questions/modals/BulkUploadModal.tsx` | Admin Component |

### AdminIconWrap consumer map (7 files)

| File | Layer |
|------|-------|
| `src/pages/sub-admin/SubAdminDashboard.tsx` | Sub-admin Page |
| `src/pages/sub-admin/SubAdminStudents.tsx` | Sub-admin Page |
| `src/components/sub-admin/exams/ExamDetailSection.tsx` | Sub-admin Component |
| `src/pages/admin/AdminUpload.tsx` | Admin Page |
| `src/pages/admin/AdminTopics.tsx` | Admin Page |
| `src/components/admin/users/AdminUsersView.tsx` | Admin Component |
| `src/components/admin/sub-admins/AdminSubAdminsView.tsx` | Admin Component |

### AdminText consumer map (8 files)

| File | Layer |
|------|-------|
| `src/pages/sub-admin/SubAdminDashboard.tsx` | Sub-admin Page |
| `src/pages/sub-admin/SubAdminStudents.tsx` | Sub-admin Page |
| `src/components/sub-admin/exams/ExamListSection.tsx` | Sub-admin Component |
| `src/pages/admin/AdminUpload.tsx` | Admin Page |
| `src/pages/admin/AdminTopics.tsx` | Admin Page |
| `src/pages/admin/AdminSettings.tsx` | Admin Page |
| `src/components/admin/users/AdminUsersView.tsx` | Admin Component |
| `src/components/admin/sub-admins/AdminSubAdminsView.tsx` | Admin Component |
| `src/components/admin/common/BulkActionBar.tsx` | Admin Component |

### AdminFilterBar consumer map (2 files outside admin)

| File | Layer |
|------|-------|
| `src/pages/sub-admin/SubAdminStudents.tsx` | Sub-admin Page |
| `src/components/sub-admin/exams/ExamListSection.tsx` | Sub-admin Component |

## Classification

| Finding | Category | Action |
|---------|----------|--------|
| AdminModal in admin/common/ | **A** — genuine violation | Move to src/components/common/ |
| AdminIconWrap in admin/common/ | **A** — genuine violation | Move to src/components/common/ |
| AdminText in admin/common/ | **A** — genuine violation | Move to src/components/common/ |
| AdminFilterBar in admin/common/ | **A** — genuine violation | Move to src/components/common/ |
| UserSelectionTabs re-export | **C** — intentional pattern | No change |
| Backlog line numbers wrong | **D** — stale claim | No change |

## ADR Decision

No ADR required. Components moved within `src/components/` — no layer boundary changes, no ownership model changes, no dependency direction changes. Routine cleanup.

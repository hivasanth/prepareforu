# AR-026: Remove Magic Numbers — Repository Audit

**Phase:** 6.26 — Constants & Magic Numbers
**Date:** 2026-07-22
**Status:** ✅ STALE — No Implementation
**Effort:** 0.25 day (audit only)

---

## Repository Audit

### Backlog Claims vs Repository Evidence

| Backlog Claim | Repository Evidence | Verdict |
|---------------|--------------------|:-------:|
| `limit(50)` in `SubAdminDashboard.tsx:108` | Line 108 is `totalAttempts: attempts?.length \|\| 0` — NOT a limit | **FALSE** |
| `limit(100)` in `SubAdminExams.tsx:201,264` | `SubAdminExams.tsx` is only **90 lines** — lines 201, 264 don't exist | **FALSE** |
| `limit(200)` in SubAdmin files | No `.limit()` calls in any `src/pages/sub-admin/` file | **FALSE** |
| `limit(5000)` in SubAdmin files | No `.limit()` calls in any `src/pages/sub-admin/` file | **FALSE** |
| Magic numbers exist in SubAdmin pages | Only `.slice(0, 4)` and `.slice(0, 10)` display truncations | **PARTIAL** |

### Where `.limit(N)` Actually Lives

All 22 `.limit(N)` calls exist in the **repository layer** (`src/lib/repositories/`), NOT in SubAdmin pages:

| File | Count | Values |
|------|:-----:|--------|
| `exam.repository.ts` | 9 | 50, 100, 200, 200, 200, 200, 200, 500, 200 |
| `question.repository.ts` | 4 | 200, 200 (via param), 200, 200 |
| `user.repository.ts` | 2 | 5000, 5000 |
| `attempt.repository.ts` | 2 | 500, 5000 |
| `teacherExam.repository.ts` | 3 | 500, 1000, 100 |
| `leaderboard.repository.ts` | 1 | 50 |
| `notification.repository.ts` | 1 | 30 |
| `topic.repository.ts` | 2 | 200, 1 |

### Actual SubAdmin Display Limits

| File | Line | Value | Context |
|------|:----:|:-----:|---------|
| `SubAdminDashboard.tsx` | 111 | `4` | Recent exams truncation (`slice(0, 4)`) |
| `SubAdminDashboard.tsx` | 112 | `10` | Recent attempts truncation (`slice(0, 10)`) |

### Admin `PAGE_SIZE` Definitions (Local, Not Centralized)

| File | Value | Scope |
|------|:-----:|-------|
| `AdminUsers.tsx` | `20` | Local `const` inside component |
| `AdminQuestions.tsx` | `30` | Module-level `const` |
| `AdminLeaderboard.tsx` | `50` | Module-level `const` |

**No shared `src/constants/pagination.ts` exists.**

---

## Classification

| Candidate | Location | Category | Rationale |
|-----------|----------|:--------:|-----------|
| `.slice(0, 4)` in SubAdminDashboard | Display truncation | **C** | Trivial display limit (4 items). Extracting to constant reduces local clarity. |
| `.slice(0, 10)` in SubAdminDashboard | Display truncation | **C** | Trivial display limit (10 items). Same reasoning. |
| `.limit(N)` in repositories | Database query limits | **C** | Out of scope for "SubAdmin — Constants" backlog item. Repository-layer concern. |
| `PAGE_SIZE` per Admin page | Pagination constants | **C** | Each page has legitimately different needs (20/30/50). Centralizing would require parameterization with no behavioral benefit. |
| `setTimeout(N)` across codebase | Timing values | **C** | Scattered across 14 files. Mass extraction is speculative cleanup, not backlog-backed. |

---

## Scope Validation

**Outcome: D — Backlog is Stale.**

The backlog's specific claims are objectively incorrect:
- All cited file/line references are wrong
- The cited `.limit()` values exist in the repository layer, not SubAdmin pages
- Only 2 trivial display limits exist in SubAdmin files (`4` and `10`)

No implementation is justified. No ADR required.

---

## Governance

- AR-026 marked as **Stale** in ARCHITECTURE_BACKLOG.md
- No files modified
- No files created or deleted
- No runtime changes

---

## Final Status

**AR-026: CLOSED as Stale.** Backlog claims contradicted by repository evidence.

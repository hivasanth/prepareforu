# AR-028 — Centralize formatDate Utility — Audit Report

## Date
2026-07-22

## Backlog Claim

> `formatDate` helper defined inline in `UserHistory.tsx:30–36` instead of a shared utility. Not reusable by other pages.

## Repository Evidence

**Claim is FALSE.** `UserHistory.tsx` currently:

```
Line 25: import { formatDateDDMMYYYY } from '../../utils/dateUtils'
Line 223: dateFormatter={formatDateDDMMYYYY}
```

No inline `formatDate` helper exists at lines 30-36 or anywhere in the file. The component was already migrated to use the shared `dateUtils.ts` utility.

## Shared Utility Already Exists: `src/utils/dateUtils.ts`

| Export | Definition | Consumers | Status |
|--------|-----------|-----------|--------|
| `formatDate(date, options?)` | `d.toLocaleDateString('en-US', options)` | 5 (AdminUsersView, UserMobileCard, AdminSubAdminsView, SubAdminMobileCard) | ✅ Used |
| `formatDateShort(date)` | Wraps formatDate | 0 | **Dead — never imported** |
| `formatDateJoined(date)` | Wraps formatDate | 0 | **Dead — never imported** |
| `formatDateDDMMYYYY(date)` | Manual DD/MM/YYYY | 1 (UserHistory) | ✅ Used |

## Unconsolidated Inline `toLocaleDateString()` Calls (Not What Backlog Describes)

| File | Line | Expression | Output Format |
|------|------|-----------|---------------|
| `src/services/userService.ts` | 261 | `new Date(...).toLocaleDateString()` | Browser default (no locale) |
| `UserTeacherExams.tsx` | 330 | `new Date(...).toLocaleDateString()` | Browser default (no locale) |
| `UserProfile.tsx` | 159-161 | `toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })` | "Jul 22, 2026" |
| `UserPerformance.tsx` | 231 | Same as above | "Jul 22, 2026" |
| `SubAdminStudents.tsx` | 179, 288, 339, 364 | `new Date(...).toLocaleDateString()` | Browser default (no locale) ×4 |
| `PerformanceCharts.tsx` | 20, 59 | `toLocaleDateString('en-US', { month: 'short', day: 'numeric' })` | "Jul 22" ×2 |
| `ExamListSection.tsx` | 88 | `new Date(...).toLocaleDateString()` | Browser default (no locale) |
| `ExamDetailModal.tsx` | 272 | `new Date(...).toLocaleDateString()` | Browser default (no locale) |
| `AttemptCardBase.tsx` | 29 | Default formatter `(d) => new Date(d).toLocaleDateString()` | Browser default (intentional fallback) |
| `RecentAttemptCard.tsx` | 18 | Fallback in getRelativeTime | Browser default (intentional fallback) |

## Classification

| Finding | Category | Rationale |
|---------|----------|-----------|
| UserHistory.tsx inline helper | **D** | Claim disproven — already uses shared utility |
| formatDateShort, formatDateJoined | **D** | Dead code — not part of backlog scope |
| 8 locale-free toLocaleDateString() calls | **C** | Different from formatDate('en-US') — locale behavior differs |
| 4 'en-US' custom-format calls | **C** | Intentionally different output formats (month names, short dates) |
| 2 default/intentional formatters | **C** | API defaults and fallbacks — intentionally different |

## ADR Decision

No ADR required. No runtime changes performed. Backlog closed as stale.

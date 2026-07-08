# PHASE 3.5 — BUSINESS LOGIC SEPARATION ARCHITECTURE SPECIFICATION

**Enterprise Architecture Rulebook v1.0**  
**Status:** FROZEN — Do not modify without Architecture Board approval  
**Effective:** 2026-07-08  

---

## Table of Contents

1. [Core Doctrine](#1-core-doctrine)
2. [Architecture Overview](#2-architecture-overview)
3. [Layer Definitions & Ownership Rules](#3-layer-definitions--ownership-rules)
4. [Page Ownership (Detailed)](#4-page-ownership-detailed)
5. [Hook Ownership (Detailed)](#5-hook-ownership-detailed)
6. [Service Ownership (Detailed)](#6-service-ownership-detailed)
7. [Repository Ownership (Detailed)](#7-repository-ownership-detailed)
8. [Pure Function / Utility Layer](#8-pure-function--utility-layer)
9. [Dependency Direction](#9-dependency-direction)
10. [Folder Structure](#10-folder-structure)
11. [File Size Limits](#11-file-size-limits)
12. [Naming Conventions](#12-naming-conventions)
13. [Review Checklist](#13-review-checklist)
14. [Migration Strategy](#14-migration-strategy)
15. [Good vs Bad Architecture Examples](#15-good-vs-bad-architecture-examples)
16. [Future Scalability Rules](#16-future-scalability-rules)
17. [Enforcement Policy](#17-enforcement-policy)
18. [Freeze Policy](#18-freeze-policy)
19. [Success Criteria](#19-success-criteria)

---

## 1. Core Doctrine

### 1.1 The Separation Principle

Every unit of code has exactly one reason to change. Business logic changes for business reasons. UI changes for presentation reasons. Data access changes for persistence reasons. These three concerns must never occupy the same file.

### 1.2 The Ownership Principle

Every file belongs to exactly one layer. A file in the service layer must not import from the page layer. A file in the hook layer must not import from the repository layer. Cross-layer communication flows through explicit interfaces, never through implicit coupling.

### 1.3 The Stateless Utility Principle

Pure functions have no side effects, no imports from React or Supabase, and no state. They accept input and return output. They are the most testable, most reusable, and most stable layer in the architecture.

### 1.4 The Service Autonomy Principle

Services own business rules and orchestrate multi-step operations. They do not render UI. They do not read React context. They do not import from the Supabase client directly. They delegate persistence to repositories.

### 1.5 The Single Responsibility Principle

A function does one thing. A file owns one concern. A hook manages one synchronization pattern. A service orchestrates one business capability. If a file has more than one reason to change, split it.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        PAGES                            │
│  Orchestration only. No business logic. No persistence. │
├─────────────────────────────────────────────────────────┤
│                     FEATURE COMPONENTS                   │
│  Composition, layout, theme-aware rendering.            │
│  No business logic. No data fetching.                   │
├─────────────────────────────────────────────────────────┤
│                     SHARED COMPONENTS                    │
│  Reusable UI primitives. Theme-aware. stateless.        │
├──────────┬──────────┬──────────┬────────────────────────┤
│   HOOKS  │ SERVICES │  UTILS   │  VALIDATION            │
│ Sync     │ Biz rules│ Pure fn  │  Zod schemas           │
│ Fetch    │ CRUD     │ Calc     │  Runtime checks        │
│ Poll     │ Orchester│ Format   │  Type guards           │
├──────────┴──────────┴──────────┴────────────────────────┤
│                     REPOSITORIES                         │
│  Supabase queries, RPC calls, DB mapping.               │
│  No React. No business logic.                           │
├─────────────────────────────────────────────────────────┤
│                     SUPABASE CLIENT                      │
│  Raw client instance. No application logic.             │
├─────────────────────────────────────────────────────────┤
│                  FOUNDATION / TOKENS                     │
│  Design tokens, theme vars, base types.                 │
└─────────────────────────────────────────────────────────┘

Dependency direction: TOP → BOTTOM only.
No layer may import from a layer above it.
Hooks may import from Services, Repositories, Utils.
Services may import from Repositories, Utils.
Repositories may import from Supabase client only.
Utils import nothing except language standard library + types.
```

---

## 3. Layer Definitions & Ownership Rules

### 3.1 Pages (`src/pages/`)

| Owns | Does NOT own |
|---|---|
| Route definition | Business calculations |
| URL param management | Aggregation, sorting, filtering |
| Permission/guard dispatch | Validation, parsing |
| Feature Component composition | Data transformation, formatting |
| Page-level state (React state) | Supabase queries, RPC calls |
| Lifecycle orchestration (`useEffect` for init) | Retry logic, caching |
| Loading/error/empty state orchestration | Optimistic update logic |
| Toast/notification triggers | Export/import logic |
| Navigation (redirect, replace) | Timer engines |
| Screen reader page title (`sr-only`) | Large algorithms (>20 lines) |
| | Large switch statements (>5 cases) |
| | Large render helpers (>15 lines) |
| | Duplicate logic of any kind |

### 3.2 Feature Components (`src/components/`)

| Owns | Does NOT own |
|---|---|
| Composing sub-components | Business calculations |
| Theme-aware styling (via hooks) | Data fetching |
| Responsive layout | State mutations beyond local UI |
| Keyboard/ARIA semantics | Direct service calls |
| Loading/empty/error visual states | Direct Supabase calls |
| | Redux/store mutations |

### 3.3 Hooks (`src/hooks/`)

| Owns | Does NOT own |
|---|---|
| Data fetching orchestration | Business calculations |
| Polling, subscriptions, WebSocket | Render logic |
| Pagination, infinite scroll | Supabase queries (delegate to repos) |
| Autosave, debounced sync | Business rule enforcement |
| Keyboard shortcut registration | Complex validation |
| Window/focus/blur listeners | |
| Intersection Observer | |
| Media query matching | |
| Timer management (intervals, timeouts) | |
| Mutation orchestration (create → refetch) | |
| Retry trigger logic | |
| Cursor-based pagination state | |

### 3.4 Services (`src/services/`)

| Owns | Does NOT own |
|---|---|
| Business rule implementation | React imports of any kind |
| Multi-step operation orchestration | UI rendering |
| Transaction coordination | useState, useEffect, useContext |
| Data validation before persistence | Window/document access |
| Authorization checks (who can do what) | Direct Supabase client instantiation |
| Complex CRUD orchestration | |
| Exam lifecycle management | |
| Submission processing | |
| Leaderboard calculation | |
| Dashboard metrics assembly | |
| Export data preparation | |
| Email/notification triggers | |

### 3.5 Repositories (`src/lib/repositories/` or `src/repositories/`)

| Owns | Does NOT own |
|---|---|
| All database queries | React imports |
| RPC invocations | Business rules |
| Transaction management | UI logic |
| Data → Domain mapping | Authorization decisions |
| Pagination at the DB level | Validation beyond type safety |
| Cursor-based query management | Error recovery strategies |
| Filter/sort application at DB level | Retry policies |
| Supabase client interaction | |

### 3.6 Pure Functions / Utilities (`src/utils/`)

| Owns | Does NOT own |
|---|---|
| Score calculation | React imports |
| Statistics computation | Side effects |
| Distribution binning | Supabase imports |
| Percentage/progress calculation | File system access |
| Time formatting | Network calls |
| Ranking assignment | Random/Date mutations (must accept as params) |
| Difficulty analysis | |
| Text parsing/transformation | |
| Data normalization | |
| Grouping/sorting algorithms | |
| Type guards | |

### 3.7 Validation (`src/validations/`)

| Owns | Does NOT own |
|---|---|
| Zod schema definitions | Business logic |
| Runtime type checking | Database queries |
| Input sanitization rules | UI rendering |
| Cross-field validation | |
| Conditional validation logic | |

### 3.8 Configuration (`src/constants/`, `src/config/`)

| Owns | Does NOT own |
|---|---|
| Feature flags | Business logic |
| API endpoints/keys | State |
| Environment configuration | Dependencies on other layers |
| App-wide constants | |

### 3.9 Context (`src/context/`)

| Owns | Does NOT own |
|---|---|
| Global state (auth, theme) | Business calculations |
| Provider composition | Data fetching (delegate to hooks/services) |
| Cross-component communication | Persistence logic |
| | Complex state machines |

---

## 4. Page Ownership (Detailed)

### 4.1 Page MAY contain

```typescript
// ✅ ACCEPTABLE: Route guard
if (!isAdmin(user)) return <Navigate to="/unauthorized" replace />

// ✅ ACCEPTABLE: URL param management
const [searchParams, setSearchParams] = useSearchParams()
const exam = searchParams.get('exam') || 'all'

// ✅ ACCEPTABLE: Permission check
const { user, loading } = useAuth()
if (loading) return <GuardLoader />

// ✅ ACCEPTABLE: Feature Component composition
return (
  <PageContainer>
    <Stack gap="lg">
      <SectionReveal>
        <AdminTabs ... />
      </SectionReveal>
      <StatsGrid exam={exam} />
    </Stack>
  </PageContainer>
)

// ✅ ACCEPTABLE: Page-level state
const [selectedIds, setSelectedIds] = useState<string[]>([])
const [activeModal, setActiveModal] = useState<'edit' | 'view' | null>(null)

// ✅ ACCEPTABLE: Lifecycle-init (single useEffect that kicks off data load)
useEffect(() => { fetchData() }, [])

// ✅ ACCEPTABLE: Toast/notification trigger
showToast('Operation completed', 'success')

// ✅ ACCEPTABLE: Loading/error/empty orchestration
if (loading) return <Skeleton />
if (error) return <ErrorState onRetry={refetch} />
if (!data.length) return <EmptyState />
```

### 4.2 Page MUST NOT contain

```typescript
// ❌ PROHIBITED: Business calculation
const avgScore = attempts.reduce((s, a) => s + a.score, 0) / attempts.length

// ❌ PROHIBITED: Complex aggregation
export const metrics = useMemo(() => ({
  total: data.length,
  avg: data.reduce(...),
  distribution: computeDistribution(data)
}), [data])

// ❌ PROHIBITED: Data transformation
const transformed = data.map(d => ({
  ...d,
  label: d.name.toUpperCase(),
  formatted: formatDate(d.date)
}))

// ❌ PROHIBITED: Sorting logic
const sorted = [...items].sort((a, b) => a.score - b.score)

// ❌ PROHIBITED: Direct Supabase query
const { data } = await supabase.from('attempts').select('*')

// ❌ PROHIBITED: Validation logic
if (formData.score < 0 || formData.score > 100) throw new Error('Invalid')

// ❌ PROHIBITED: Expert/CSV content generation
const csv = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n')

// ❌ PROHIBITED: Retry/caching logic
if (Date.now() - lastFetch < 30000) return cached

// ❌ PROHIBITED: Optimistic update with rollback
const prev = [...items]
setItems(mutated)
try { await save() } catch { setItems(prev) }

// ❌ PROHIBITED: Large render helper functions
const renderCard = (item) => ( ...30 lines of JSX... )

// ❌ PROHIBITED: Duplicate JSX patterns repeated in page
```

---

## 5. Hook Ownership (Detailed)

### 5.1 Hook Structure

```
src/hooks/
├── useAuth.ts                 # Auth state synchronization
├── useToast.ts                # Toast notification state
├── useAdminFilters.ts         # Admin filter state + URL sync
├── useSupabaseQuery.ts        # Generic query hook
├── useStableFetch.ts          # Stable fetch with dedup
├── useDebounce.ts             # Debounce utility hook
│
├── useTopicExams.ts           # Topic exam data fetching
├── useSubjectTests.ts         # Subject test data + launch logic
├── useTeacherExams.ts         # Teacher exam CRUD orchestration
├── useTeacherCreate.ts        # Teacher exam creation wizard
├── useActiveExam.ts           # Active exam lifecycle
├── useExamTimer.ts            # Exam countdown timer
├── useAnswerPersistence.ts    # Auto-save answers
├── useFullscreen.ts           # Fullscreen management
├── useKeyboardShortcuts.ts    # Exam keyboard shortcuts
│
├── useLeaderboard.ts          # Leaderboard data + pagination
├── useUserPerformance.ts      # Performance data + metrics
├── useDashboardStats.ts       # Dashboard metrics aggregation
│
├── useBulkUpload.ts           # Bulk upload state machine
├── useQuestionSearch.ts       # Question search + filters
│
└── useDebouncedCallback.ts    # Debounced callback hook
```

### 5.2 Hook MAY contain

```typescript
// ✅ ACCEPTABLE: Data fetching orchestration
const { data, loading, error } = useSupabaseQuery(
  () => topicService.list({ exam, paper }),
  [exam, paper]
)

// ✅ ACCEPTABLE: Polling
useEffect(() => {
  const interval = setInterval(refetch, 30000)
  return () => clearInterval(interval)
}, [])

// ✅ ACCEPTABLE: Keyboard shortcuts
useEffect(() => {
  const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [])

// ✅ ACCEPTABLE: State synchronization
useEffect(() => {
  setSearchParams(params)
}, [params])
```

### 5.3 Hook MUST NOT contain

```typescript
// ❌ PROHIBITED: Business rules
if (score >= 40 && score < 60) return 'Average'

// ❌ PROHIBITED: Database queries directly
supabase.from('questions').select('*')

// ❌ PROHIBITED: UI rendering or JSX
```

---

## 6. Service Ownership (Detailed)

### 6.1 Service Structure

```
src/services/
├── authService.ts             # Login, signup, password reset, session
├── adminService.ts            # Admin: exam config, subjects, papers
├── adminQuestionService.ts    # Admin: question CRUD, bulk ops
│
├── examService.ts             # Exam: start, submit, answers
├── topicTestService.ts        # Topic test: config, launch, results
├── subjectTestService.ts      # Subject test: config, launch, results
│
├── teacherExamService.ts      # Teacher: exams CRUD
│
├── leaderboardService.ts      # Leaderboard: query, compute ranks
├── userService.ts             # User: profile, history, settings
├── userPerformanceService.ts  # Performance: metrics, stats, charts
│
├── dashboardService.ts        # Dashboard: stats aggregation
│
├── topicsService.ts           # Topic: CRUD + content parse
│
└── notificationService.ts     # Email/push notification triggers
```

### 6.2 Service MAY contain

```typescript
// ✅ ACCEPTABLE: Multi-step operation orchestration
async function submitExam(examId: string, answers: Answer[], user: User) {
  const attempt = await examRepo.createAttempt(examId, user.id)
  const scored = await examRepo.saveAnswers(attempt.id, answers)
  const processed = await examRepo.finalizeAttempt(attempt.id, scored)
  await notificationService.notifyCompletion(user.id, examId)
  return processed
}

// ✅ ACCEPTABLE: Business rule enforcement
function canRetakeExam(exam: Exam, userAttempts: Attempt[]): boolean {
  return exam.allow_multiple_attempts && userAttempts.length < exam.max_attempts
}

// ✅ ACCEPTABLE: Data assembly
async function getDashboardMetrics(userId: string, timeRange: TimeRange) {
  const attempts = await examRepo.getAttemptsInRange(userId, timeRange)
  const exams = await examRepo.getAvailableExams()
  return {
    totalAttempts: attempts.length,
    avgScore: calculateAverage(attempts),
    improvement: calculateTrend(attempts),
    // ... does NOT do the calculation itself, calls utils
  }
}
```

### 6.3 Service MUST NOT contain

```typescript
// ❌ PROHIBITED: React imports
import { useState } from 'react'

// ❌ PROHIBITED: UI logic
if (theme === 'dark') return darkScore

// ❌ PROHIBITED: Direct JSX
```

---

## 7. Repository Ownership (Detailed)

### 7.1 Repository Structure

```
src/lib/
├── repositories/
│   ├── base.repository.ts         # Generic CRUD helpers
│   ├── attempt.repository.ts      # attempts table
│   ├── question.repository.ts     # questions table
│   ├── exam.repository.ts         # exams/config tables
│   ├── user.repository.ts         # users table
│   ├── topic.repository.ts        # study_topics table
│   ├── teacherExam.repository.ts  # teacher_exams table
│   ├── leaderboard.repository.ts  # leaderboard views
│   └── dashboard.repository.ts    # Dashboard aggregation queries
```

### 7.2 Repository MAY contain

```typescript
// ✅ ACCEPTABLE: Database query
async function findById(id: string): Promise<Attempt | null> {
  const { data, error } = await supabase
    .from('attempts')
    .select('*, answers:attempt_answers(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data ? mapToDomain(data) : null
}

// ✅ ACCEPTABLE: Domain mapping
function mapToDomain(raw: RawAttempt): Attempt {
  return {
    id: raw.id,
    userId: raw.user_id,
    score: raw.score,
    answers: (raw.answers || []).map(mapAnswerToDomain),
  }
}

// ✅ ACCEPTABLE: RPC invocation
async function refreshLeaderboard(): Promise<void> {
  const { error } = await supabase.rpc('refresh_leaderboard_view')
  if (error) throw error
}

// ✅ ACCEPTABLE: Transaction
async function createWithAnswers(attempt: NewAttempt, answers: NewAnswer[]) {
  const { data, error } = await supabase.rpc('create_attempt_atomic', {
    p_exam_id: attempt.examId,
    p_user_id: attempt.userId,
    p_answers: answers,
  })
  if (error) throw error
  return data
}
```

### 7.3 Repository MUST NOT contain

```typescript
// ❌ PROHIBITED: Business logic
if (score >= 40) return 'pass'

// ❌ PROHIBITED: React imports
import { useAuth } from '../../context/AuthContext'

// ❌ PROHIBITED: UI types or imports
```

---

## 8. Pure Function / Utility Layer

### 8.1 Utility Structure

```
src/utils/
├── scoreUtils.ts              # Score calculations, percentage, passing
├── statsUtils.ts              # Mean, median, mode, distribution
├── timeUtils.ts               # Duration formatting, date formatting
├── rankUtils.ts               # Rank assignment, ties
├── parseUtils.ts              # Text parsing, markdown, outline
├── formatUtils.ts             # Number/string/currency formatting
├── transformUtils.ts          # Data transformation, normalization
├── groupUtils.ts              # Grouping, categorization
├── sortUtils.ts               # Custom sort comparators
├── filterUtils.ts             # Filter predicates
├── validationUtils.ts         # Reusable validation helpers
├── examUtils.ts               # Exam-specific pure functions
├── leaderboardUtils.ts        # Leaderboard-specific pure functions
├── arrayUtils.ts              # Generic array helpers
└── objectUtils.ts             # Generic object helpers
```

### 8.2 Pure function contract

```typescript
// ✅ CORRECT: Pure function
export function calculatePercentage(score: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((score / total) * 100)
}

// ✅ CORRECT: Accepts dependencies as parameters
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

// ❌ INCORRECT: Side effect (should not call Date internally)
export function getCurrentTimestamp(): string {
  return new Date().toISOString() // BAD: impure
}

// ✅ CORRECT: Accept date as parameter
export function formatTimestamp(date: Date): string {
  return date.toISOString()
}
```

---

## 9. Dependency Direction

### 9.1 Strict Dependency Graph

```
PAGES
  │
  ├──> Feature Components
  ├──> Hooks
  └──> Shared Components
         │
         ├──> Hooks
         └──> Foundation/Tokens

HOOKS
  │
  ├──> Services
  ├──> Repositories
  ├──> Utils
  ├──> Validations
  └──> Constants

SERVICES
  │
  ├──> Repositories
  ├──> Utils
  ├──> Validations
  ├──> Constants
  └──> Context (read-only, e.g., auth user ID)

REPOSITORIES
  │
  ├──> Supabase client (lib/supabase.ts)
  └──> Types (domain models)

UTILS
  │
  └──> Types (domain models)

VALIDATIONS
  │
  └──> Types (domain models)

CONTEXT
  │
  ├──> Services
  ├──> Hooks
  └──> Supabase client

COMPONENTS (Shared + Feature)
  │
  ├──> Foundation/Tokens
  ├──> Hooks (theme, responsive)
  └──> Utils (formatting only)
```

### 9.2 Prohibited imports

| Source | May NOT import from |
|---|---|
| Pages | Services (directly — use hooks), Repositories, Supabase |
| Feature Components | Services, Repositories, Supabase |
| Hooks | Pages, Feature Components, Shared Components |
| Services | Pages, Components, Hooks, React |
| Repositories | Pages, Components, Hooks, Services |
| Utils | Any layer except Types |
| Validations | Any layer except Types |

---

## 10. Folder Structure

```
src/
├── pages/                          # Orchestration only
│   ├── admin/                      #   Admin pages
│   ├── sub-admin/                  #   Sub-admin pages
│   ├── user/                       #   User pages
│   │   ├── TopicTestViews/         #   (sub-views, extract to components if >300 lines)
│   │   ├── SubjectTestViews/
│   │   └── PrepareWriteViews/
│   ├── exam/                       #   Exam pages
│   └── auth/                       #   Auth pages
│
├── components/                     # UI only — no business logic
│   ├── admin/                      #   Admin feature components
│   │   ├── common/                 #     Shared admin UI
│   │   ├── overview/
│   │   ├── leaderboard/
│   │   ├── questions/
│   │   ├── settings/
│   │   ├── topics/
│   │   ├── users/
│   │   └── sub-admins/
│   ├── exam/                       #   Exam feature components
│   ├── user/                       #   User feature components
│   └── common/                     #   Shared components (AntigravityUI)
│
├── hooks/                          # Synchronization, side effects
│   ├── useAuth.ts
│   ├── useAdminFilters.ts
│   ├── useSupabaseQuery.ts
│   ├── useStableFetch.ts
│   ├── useDebounce.ts
│   ├── useToast.ts
│   ├── useTopicExams.ts
│   ├── useSubjectTests.ts
│   ├── useTeacherExams.ts
│   ├── useTeacherCreate.ts
│   ├── useActiveExam.ts
│   ├── useExamTimer.ts
│   ├── useAnswerPersistence.ts
│   ├── useFullscreen.ts
│   ├── useKeyboardShortcuts.ts
│   ├── useLeaderboard.ts
│   ├── useUserPerformance.ts
│   ├── useDashboardStats.ts
│   ├── useBulkUpload.ts
│   └── useQuestionSearch.ts
│
├── services/                       # Business rules, multi-step operations
│   ├── authService.ts
│   ├── adminService.ts
│   ├── adminQuestionService.ts
│   ├── examService.ts
│   ├── topicTestService.ts
│   ├── subjectTestService.ts
│   ├── teacherExamService.ts
│   ├── leaderboardService.ts
│   ├── userService.ts
│   ├── userPerformanceService.ts
│   ├── dashboardService.ts
│   ├── topicsService.ts
│   └── notificationService.ts
│
├── lib/
│   ├── repositories/               # Database access, queries, RPC
│   │   ├── base.repository.ts
│   │   ├── attempt.repository.ts
│   │   ├── question.repository.ts
│   │   ├── exam.repository.ts
│   │   ├── user.repository.ts
│   │   ├── topic.repository.ts
│   │   ├── teacherExam.repository.ts
│   │   ├── leaderboard.repository.ts
│   │   └── dashboard.repository.ts
│   └── supabase.ts                 # Supabase client instance (singleton)
│
├── utils/                          # Pure functions, no side effects
│   ├── scoreUtils.ts
│   ├── statsUtils.ts
│   ├── timeUtils.ts
│   ├── rankUtils.ts
│   ├── parseUtils.ts
│   ├── formatUtils.ts
│   ├── transformUtils.ts
│   ├── groupUtils.ts
│   ├── sortUtils.ts
│   ├── filterUtils.ts
│   ├── validationUtils.ts
│   ├── examUtils.ts
│   ├── leaderboardUtils.ts
│   ├── arrayUtils.ts
│   └── objectUtils.ts
│
├── validations/                    # Zod schemas, type guards
│   ├── authSchemas.ts
│   ├── examSchemas.ts
│   ├── questionSchemas.ts
│   └── topicSchemas.ts
│
├── constants/                      # Configuration, constants
│   ├── aiPromptTemplate.ts
│   └── app.ts
│
├── context/                        # React context providers
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
│
├── guards/                         # Route guards
│   └── Guards.tsx
│
├── types/                          # Domain type definitions
│   ├── exam.types.ts
│   ├── user.types.ts
│   └── api.types.ts
│
└── config/                         # Environment configuration
    └── index.ts
```

---

## 11. File Size Limits

| Artifact | Soft Limit | Hard Limit | Action if exceeded |
|---|---|---|---|
| Page | 200 lines | 300 lines | Extract sub-views to Feature Components |
| Feature Component | 200 lines | 250 lines | Break into smaller components |
| Hook | 150 lines | 250 lines | Extract helpers to utils |
| Service function | 40 lines | 60 lines | Break into smaller functions |
| Service file | 250 lines | 400 lines | Split service by domain |
| Repository | 200 lines | 300 lines | Split by entity |
| Utility function | 20 lines | 50 lines | Simplify or break down |
| Utility file | 150 lines | 200 lines | Split by category |
| JSX render block | 40 lines | 80 lines | Extract to sub-component |
| Function | 30 lines | 50 lines | Extract helper functions |
| useEffect block | 15 lines | 30 lines | Extract to named function |
| Ternary expression | 1 line | 3 lines | Extract to variable or function |
| Switch statement | 5 cases | 10 cases | Use object map instead |

---

## 12. Naming Conventions

### 12.1 Files

| Layer | Pattern | Example |
|---|---|---|
| Page | `PascalCase.tsx` | `AdminOverview.tsx` |
| Component | `PascalCase.tsx` | `TopicCard.tsx` |
| Hook | `camelCase.ts` | `useTopicExams.ts` |
| Service | `camelCase.ts` | `examService.ts` |
| Repository | `camelCase.repository.ts` | `attempt.repository.ts` |
| Utility | `camelCase.ts` | `scoreUtils.ts` |
| Validation | `pascalCase.ts` | `examSchemas.ts` |
| Type definition | `kebab-case.types.ts` | `exam.types.ts` |
| Constant | `camelCase.ts` | `app.ts` |

### 12.2 Exports

| Layer | Convention | Example |
|---|---|---|
| Page | `export default` | `export default function AdminOverview()` |
| Component | Named export | `export function TopicCard(...)` |
| Hook | Named export | `export function useTopicExams(...)` |
| Service | Named exports | `export async function submitExam(...)` |
| Repository | Named exports | `export async function findById(...)` |
| Utility | Named export | `export function calculatePercentage(...)` |

---

## 13. Review Checklist

### 13.1 Pre-Commit Review

#### Page Layer
- [ ] No `useTheme()` or `isDark` present
- [ ] No Supabase imports or direct calls
- [ ] No business calculations, aggregations, or transformations
- [ ] No sorting, filtering, or grouping logic
- [ ] No validation or parsing logic
- [ ] No export/import content generation
- [ ] No retry, caching, or optimistic update logic
- [ ] No inline `style={{}}` props
- [ ] No hardcoded color values (`#`, `rgb`, `rgba`)
- [ ] No responsive classes (`sm:`, `md:`, `lg:`) — these belong in components
- [ ] `useEffect` blocks under 30 lines
- [ ] Render JSX under 80 lines per block
- [ ] Page total under 300 lines
- [ ] Has `sr-only` heading for screen readers
- [ ] `aria-live` regions on dynamic content
- [ ] `aria-label` on interactive elements without visible text

#### Hook Layer
- [ ] No business rule definitions (delegate to services)
- [ ] No Supabase queries (delegate to repositories)
- [ ] Named export
- [ ] Single responsibility (one synchronization concern)
- [ ] Under 250 lines

#### Service Layer
- [ ] No React imports
- [ ] No UI imports
- [ ] No Supabase client imports (use repositories)
- [ ] Named exports only
- [ ] Under 400 lines per file
- [ ] Under 60 lines per function

#### Repository Layer
- [ ] No React imports
- [ ] No business logic
- [ ] No UI types
- [ ] Domain mapping in dedicated function
- [ ] Under 300 lines per file

#### Utility Layer
- [ ] Pure function (no side effects)
- [ ] No React or Supabase imports
- [ ] Dependencies passed as parameters (not created internally)
- [ ] Deterministic output for same input
- [ ] Under 50 lines per function
- [ ] Under 200 lines per file

#### General
- [ ] No duplicate logic across files
- [ ] No unused imports
- [ ] No dead code or commented-out blocks
- [ ] Dependency direction is DOWNWARD only
- [ ] File naming follows convention
- [ ] Export naming follows convention

---

## 14. Migration Strategy

### Phase 3.5 — Implementation Order

#### Step 1: Inventory (Days 1-2)
- Catalog all business logic currently embedded in pages
- Identify every aggregation, calculation, transformation, validation, export, and parsing operation
- Classify each into: `utils` / `service` / `hook` / `repository`
- Build a dependency graph showing what calls what
- Generate the full extraction plan as a task list

#### Step 2: Pure Function Extraction (Days 3-5)
- Extract all stateless calculations to `src/utils/`
- Every score calculation, time formatter, rank assigner, parser, and normalizer
- Each utility file has zero imports from React, Supabase, or services
- Test: each function produces the same output for same input as before

#### Step 3: Repository Layer (Days 5-7)
- Move all Supabase queries out of services and pages into `src/lib/repositories/`
- Create one repository file per database entity
- Add domain-mapping functions in each repository
- Repositories have zero business logic

#### Step 4: Service Layer (Days 7-10)
- Move business logic out of pages into `src/services/`
- Services orchestrate multi-step operations
- Services call repositories for persistence
- Services call utilities for calculations
- Services do NOT import React

#### Step 5: Hook Layer (Days 10-12)
- Extract data fetching, polling, subscriptions, and side-effect orchestration to hooks
- Hooks call services, not repositories directly
- Hooks manage loading/error/data state
- Pages consume hooks, not services directly

#### Step 6: Page Cleanup (Days 12-14)
- Remove all business logic from pages
- Replace direct service calls with hook consumption
- Verify pages contain ONLY: composition, routing, permissions, page state, effects
- Apply file size limits

#### Step 7: Verification (Days 14-15)
- Run full TypeScript check: `npx tsc --noEmit`
- Verify zero `useTheme`/`isDark` in all pages
- Verify zero Supabase imports in all pages
- Verify zero business calculations in all pages
- Verify zero hardcoded colors in all pages
- Verify dependency direction for every new file
- Accessibility review for every page

#### Step 8: Freeze (Day 16)
- Tag: `phase-3.5-freeze`
- Lock specification document
- Branch into `phase-3.6`

### Migration Order (by page complexity)

```
Priority 1: Pure utility extraction (zero risk, high ROI)
  → scoreUtils, timeUtils, rankUtils, parseUtils

Priority 2: Repository extraction (plumbing, no behavior change)
  → attempt.repository, question.repository, exam.repository

Priority 3: Simple service extraction (encapsulate existing logic)
  → leaderboardService, dashboardService, userPerformanceService

Priority 4: Complex service extraction (exam lifecycle)
  → examService, teacherExamService, adminQuestionService

Priority 5: Hook extraction (data fetching patterns)
  → useActiveExam, useLeaderboard, useUserPerformance

Priority 6: Page cleanup (remove remaining violations)
  → ActiveExamPage, AdminLeaderboard, AdminTopics, etc.
```

---

## 15. Good vs Bad Architecture Examples

### 15.1 Score Calculation

```typescript
// ❌ BAD: Calculation in page
function ResultsPage() {
  const percentage = Math.round((score / total) * 100)
  const grade = percentage >= 40 ? 'Pass' : 'Fail'
  return <div>{percentage}% - {grade}</div>
}

// ✅ GOOD: Calculation in utility, consumed by component
// utils/scoreUtils.ts
export function calculatePercentage(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0
}

// Feature Component
function ScoreDisplay({ score, total }: Props) {
  const pct = calculatePercentage(score, total)
  return <div>{pct}%</div>
}
```

### 15.2 Data Fetching

```typescript
// ❌ BAD: Direct Supabase in page
function AdminLeaderboard() {
  const { data } = await supabase.from('leaderboard_view').select('*')
  // ... business logic ...
}

// ✅ GOOD: Hook → Service → Repository
// hooks/useLeaderboard.ts
export function useLeaderboard(filters: LeaderboardFilters) {
  return useSupabaseQuery(
    () => leaderboardService.getEntries(filters),
    [filters]
  )
}

// services/leaderboardService.ts
export async function getEntries(filters: LeaderboardFilters) {
  const raw = await leaderboardRepo.findByFilters(filters)
  const ranked = assignRanks(raw)
  return enrichWithUserNames(ranked)
}
```

### 15.3 Exam Timer

```typescript
// ❌ BAD: Inline timer logic in page
function ActiveExamPage() {
  const [timeLeft, setTimeLeft] = useState(duration * 60)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => t - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])
}

// ✅ GOOD: Extracted to hook
// hooks/useExamTimer.ts
export function useExamTimer(durationMinutes: number, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60)
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { onExpire(); setIsRunning(false); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  return { timeLeft, isRunning, pause: () => setIsRunning(false), resume: () => setIsRunning(true) }
}
```

### 15.4 Aggregation Logic

```typescript
// ❌ BAD: Aggregation in page render
function UserPerformance() {
  const metrics = useMemo(() => ({
    avgScore: Math.round(data.reduce((s, a) => s + a.score, 0) / data.length),
    bestScore: Math.max(...data.map(a => a.score)),
    totalAttempts: data.length,
    improvement: data.length > 1 ? data[0].score - data[data.length - 1].score : 0,
  }), [data])
}

// ✅ GOOD: Extracted to service
// services/userPerformanceService.ts
export function computeMetrics(attempts: Attempt[]): PerformanceMetrics {
  return {
    avgScore: calculateAverage(attempts.map(a => a.score)),
    bestScore: Math.max(...attempts.map(a => a.score)),
    totalAttempts: attempts.length,
    improvement: calculateTrend(attempts),
  }
}

// hooks/useUserPerformance.ts
export function useUserPerformance(userId: string, timeRange: TimeRange) {
  const { data: attempts, ...rest } = useSupabaseQuery(
    () => performanceRepo.getAttempts(userId, timeRange),
    [userId, timeRange]
  )
  const metrics = useMemo(
    () => attempts ? computeMetrics(attempts) : null,
    [attempts]
  )
  return { metrics, ...rest }
}
```

---

## 16. Future Scalability Rules

### 16.1 Adding a new feature

1. Define types in `src/types/`
2. Define validation schemas in `src/validations/`
3. Implement pure functions in `src/utils/`
4. Implement repository queries in `src/lib/repositories/`
5. Implement service orchestration in `src/services/`
6. Implement data hooks in `src/hooks/`
7. Build Feature Components in `src/components/`
8. Compose in Page at `src/pages/`

### 16.2 Adding a new database table

1. Create repository file: `src/lib/repositories/<entity>.repository.ts`
2. Create domain types in `src/types/`
3. Add service functions in the relevant service file
4. Create/update hook for data fetching

### 16.3 Adding a new page

1. Create page file in `src/pages/`
2. Page imports only: Feature Components, Hooks, Context, Guards, Router
3. Page contains NO: business logic, calculations, Supabase calls
4. Page delegates all data needs to hooks

### 16.4 Performance rules

- Expensive calculations (O(n) or higher over large datasets) must be in `src/utils/`
- Expensive calculations must be cached/memoized at the hook level
- Repository queries must use database-level pagination, not application-level
- No Array.filter/map/reduce over datasets larger than 1000 items in a page or component

### 16.5 Testing rules

- Every pure function in `src/utils/` must have a unit test
- Every service function must have an integration test or be testable with mocked repositories
- Every hook should be testable via render-hook testing
- Pages should be testable via integration tests with mocked hooks

---

## 17. Enforcement Policy

### 17.1 Automated Enforcement

The following MUST be checked on every PR via CI or pre-commit hook:

1. **`grep -r "isDark" src/pages/`** — Zero tolerance. Any match fails the build.
2. **`grep -r "useTheme" src/pages/`** — Zero tolerance. Any match fails the build.
3. **`grep -r "supabase" src/pages/`** — Zero tolerance. Any match fails the build.
4. **`npx tsc --noEmit`** — Must pass with zero errors.
5. **File size check** — Files exceeding hard limits fail the build.

### 17.2 Manual Review Enforcement

- Every PR must include the architecture review checklist (Section 13)
- Code review must verify dependency direction for all new imports
- Code review must verify no business logic leakage into pages
- Code review must verify no duplicate logic exists
- Architecture Board must approve any deviation from this specification

### 17.3 Violation Escalation

| Severity | Definition | Action |
|---|---|---|
| **Critical** | `supabase` in `src/pages/` or reverse dependency | Block PR, immediate fix required |
| **Major** | Business logic in page, hardcoded colors | Block PR, fix before merge |
| **Minor** | File size over soft limit, missing accessibility | Flag for follow-up, may merge with 7-day correction window |
| **Cosmetic** | Naming inconsistency, minor style deviation | Note for future cleanup |

---

## 18. Freeze Policy

### 18.1 When to freeze Phase 3.5

Phase 3.5 is frozen when ALL of the following are true:

1. **Zero business logic in pages** — Every page is orchestration-only
2. **Zero Supabase calls in pages** — Every database interaction flows through repositories
3. **Zero `useTheme`/`isDark` in pages** — Already frozen from Phase 3.4
4. **All repositories created** — Every database entity has a repository
5. **All business logic extracted** — Calculations in utils, rules in services
6. **All data fetching extracted** — Side effects in hooks
7. **Dependency direction verified** — No reverse imports in any new file
8. **TypeScript build passes** — `npx tsc --noEmit` with zero errors
9. **Accessibility review passed** — All pages meet minimum a11y criteria
10. **Architecture Board approval** — This specification is followed

### 18.2 Freeze procedure

```
git tag phase-3.5-freeze
git push origin phase-3.5-freeze
git checkout -b phase-3.6
```

### 18.3 Post-freeze changes

After freeze, changes to business logic architecture require:
- Architecture Board variance request
- Approval from 2+ senior engineers
- Updated specification document
- Re-freeze tag

---

## 19. Success Criteria

Phase 3.5 is complete ONLY IF:

- [ ] **All pages are orchestration-only** — no calculations, no Supabase calls, no business rules
- [ ] **All business logic is extracted** to `src/utils/`, `src/services/`, or `src/lib/repositories/`
- [ ] **All repositories own persistence** — every database query flows through a repository
- [ ] **All services own business rules** — multi-step operations, authorization, complex CRUD
- [ ] **All hooks own synchronization** — data fetching, polling, subscriptions, timers
- [ ] **All utilities own calculations** — every pure function lives in `src/utils/`
- [ ] **No duplicated algorithms** — each calculation exists in exactly one place
- [ ] **Dependency direction is clean** — no reverse imports in any layer
- [ ] **No temporary fixes or workarounds** — every pattern follows the spec
- [ ] **No architectural violations** — the spec is the source of truth
- [ ] **`npx tsc --noEmit` passes** with zero errors
- [ ] **All file size limits are respected** — no file exceeds the hard limit
- [ ] **Accessibility baseline met** — all pages have `sr-only` headings, `aria-label` on icon buttons

---

*End of Phase 3.5 Architecture Specification v1.0*

*This document is frozen. Do not modify without Architecture Board approval.*

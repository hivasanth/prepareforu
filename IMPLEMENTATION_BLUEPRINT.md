# Implementation Blueprint — PrepareForU Design System Migration

> **DO NOT modify source code based on this document alone.**
> This is the planning blueprint. Each phase must be individually approved and
> its detailed spec referenced from `GOLDEN_REFERENCE_DESIGN_SYSTEM.md`.

---

## Table of Contents

- [Golden Reference Freeze Protection](#golden-reference-freeze-protection)
- [Repository Impact Report Template](#repository-impact-report-template)
- [Visual Regression Baseline](#visual-regression-baseline)
- [Design System Compliance Score](#design-system-compliance-score)
- [Phase A — Repository Dependency Analysis](#phase-a--repository-dependency-analysis)
- [Phase B — Component Impact Report](#phase-b--component-impact-report)
- [Phase C — Migration Order](#phase-c--migration-order)
- [Phase D — Validation Checklists](#phase-d--validation-checklists)
- [Phase E — Repository Safety Rules](#phase-e--repository-safety-rules)
- [Phase F — Final Implementation Roadmap](#phase-f--final-implementation-roadmap)
- [Future Repository Modernization](#future-repository-modernization)
- [Migration Readiness Gate](#migration-readiness-gate)
- [Final Blueprint Validation](#final-blueprint-validation)

---

## Golden Reference Freeze Protection

### G.1 Policy

Every feature certified as "Golden Reference" is **frozen**.

Frozen features may NOT have their workflows, business logic, API contracts,
navigation, layout, or visual identity altered.

Only the following changes are permitted on frozen features:

**Allowed**:
- Reusable component improvements (if the component is used by the feature)
- Design token updates (if the feature references those tokens)
- Accessibility improvements (ARIA, keyboard nav, focus management)
- Animation consistency (standardized timing, easing)
- Spacing consistency (standardized gap/padding values)
- Typography consistency (standardized font sizes/weights)
- Design system adoption (replacing inline styles with canonical components)
- Bug fixes that do not alter behavior or visual appearance

**Forbidden**:
- Workflow changes
- Business logic changes
- Feature additions
- Feature removals
- Navigation changes
- API contract changes
- Repository architecture changes
- Layout redesign
- Visual redesign
- State management changes
- Data flow changes

### G.2 Currently Certified Golden Reference Features

| Feature | Feature ID | Freeze Status | Protected Files | Protected Workflows |
|---|---|---|---|---|
| **Sub Admin Settings** | Feature 27 | ✅ **FROZEN** | `src/pages/sub-admin/SubAdminSettings.tsx`, `src/components/sub-admin/settings/useSettings.ts` | Load settings, Save name, Save password, Save subjects, Save profile, Export data, Copy coupon, Copy share link |
| **Admin Settings** | Feature 28 | ✅ **FROZEN** | `src/pages/admin/AdminSettings.tsx`, `src/components/admin/settings/useAdminSettings.ts`, `src/components/admin/settings/AddExamModal.tsx`, `src/components/admin/settings/ExamParamsForm.tsx`, `src/components/admin/settings/SubjectCardItem.tsx`, `src/components/admin/settings/SubjectDistributionPanel.tsx`, `src/components/admin/settings/SettingsCard.tsx` | Load settings, Save config, Save subjects, Add exam, Filter changes, Auto-scroll |

### G.3 Protected Business Logic

| Feature | Protected Logic |
|---|---|
| Feature 27 | Profile update flow, password validation, coupon copy, export initiation |
| Feature 28 | Subject distribution calculation, exam parameter validation, exam creation, settings persistence |

### G.4 Protected UI Behavior

| Feature | Protected Behavior |
|---|---|
| Feature 27 | Settings form layout, stat display, export dialog, toggle states |
| Feature 28 | Card layout, form labels, filter behavior, subject distribution panel |

### G.5 How Features Become Certified

A feature is certified as Golden Reference when:

1. All its pages use canonical components exclusively (no inline UI bypass)
2. All its reusable components are finalized (Match Spec in Component Finalization Status)
3. All its feedback uses the canonical Feedback Strategy (Dialogs for success, toasts for errors)
4. All its form validation uses inline FormField errors (no toast validation)
5. All its arbitrary values are replaced with design tokens
6. Zero TypeScript errors
7. Visual regression baseline verified
8. The feature passes the Certification Checklist in §14 of `GOLDEN_REFERENCE_DESIGN_SYSTEM.md`

Once certified, the feature's files are added to the Freeze Protection table.

### G.6 Enforcement

Every implementation phase MUST:

1. Check this policy before modifying any file
2. If a file belongs to a frozen feature, verify the change is in the ALLOWED list
3. If the change is not in the ALLOWED list, it is BLOCKED
4. Blocked changes require a Design System Specification update to proceed

---

## Repository Impact Report Template

Before EVERY implementation phase, a Repository Impact Report must be generated.

This report must be reviewed and approved before any code is written.

### RIR Template

```
┌─────────────────────────────────────────────────────────────┐
│          REPOSITORY IMPACT REPORT                            │
├─────────────────────────────────────────────────────────────┤
│ Phase: <Phase ID> — <Phase Name>                             │
│ Component being modified: <Component Name>                   │
│ Purpose: <Why this change is being made>                     │
├─────────────────────────────────────────────────────────────┤
│ FILES AFFECTED                                               │
│ • src/.../<file>.tsx — <nature of change>                    │
│ • src/.../<file>.ts  — <nature of change>                    │
│ Total files changed: <N>                                     │
├─────────────────────────────────────────────────────────────┤
│ PAGES AFFECTED                                               │
│ • <Page Name> — <how it is affected>                         │
│ • <Page Name> — <how it is affected>                         │
├─────────────────────────────────────────────────────────────┤
│ FEATURES AFFECTED                                            │
│ • <Feature Name> — <how it is affected>                      │
├─────────────────────────────────────────────────────────────┤
│ CERTIFIED GOLDEN REFERENCE FEATURES AFFECTED                 │
│ • Feature 27 (Sub Admin Settings) — <affected? Y/N>          │
│ • Feature 28 (Admin Settings) — <affected? Y/N>              │
│ If Yes: verify change is in ALLOWED list per Freeze Policy   │
├─────────────────────────────────────────────────────────────┤
│ EXPECTED VISUAL CHANGES                                      │
│ • <description of visual differences>                        │
├─────────────────────────────────────────────────────────────┤
│ EXPECTED BEHAVIOR CHANGES                                    │
│ • <description of behavioral differences>                    │
├─────────────────────────────────────────────────────────────┤
│ MIGRATION RISK: <LOW | MEDIUM | HIGH>                        │
│ REGRESSION RISK: <LOW | MEDIUM | HIGH>                       │
├─────────────────────────────────────────────────────────────┤
│ ROLLBACK STRATEGY                                            │
│ • git commit before change                                   │
│ • git revert <commit-hash> to undo                           │
│ • Verify rollback with npx tsc --noEmit                      │
├─────────────────────────────────────────────────────────────┤
│ VALIDATION STRATEGY                                          │
│ • TypeScript: npx tsc --noEmit                               │
│ • Visual: <list of pages to visually verify>                 │
│ • Behavior: <list of workflows to test>                      │
│ • Accessibility: <ARIA, keyboard, focus checks>              │
├─────────────────────────────────────────────────────────────┤
│ READINESS GATE CHECKLIST                                     │
│ □ Impact Report generated                                    │
│ □ Dependencies satisfied                                     │
│ □ Previous phase certified                                   │
│ □ Zero TypeScript errors (current)                          │
│ □ Visual baseline available                                  │
│ □ Rollback plan prepared                                     │
│ □ Validation checklist prepared                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Visual Regression Baseline

### V.1 Baseline Pages

The following pages MUST be visually verified before the first implementation
phase. Screenshots or a detailed description of each page's current appearance
should be captured as the baseline.

| # | Page | Route | Primary Components | Verification Status |
|---|---|---|---|---|
| | **Authentication** | | | |
| 1 | Splash Page | `/` | BrandTitle, PageTransition | □ |
| 2 | Login Page | `/login` | Input, Button, Card, PageContainer | □ |
| 3 | Signup Page | `/signup` | Input, Select, Button, Card, PageContainer | □ |
| 4 | Verify Email | `/verify` | Button, Card, Stack | □ |
| 5 | Finish Sign-In | `/finish-sign-in` | Input, Button, IconBadge | □ |
| 6 | Account Disabled | `/account-disabled` | Button, ConfirmModal | □ |
| 7 | Update Password | `/auth/update-password` | Input, Button, IconButton | □ |
| | **User Pages** | | | |
| 8 | User Dashboard | `/user` | PageContainer, Stack, PrimaryButton | □ |
| 9 | User Exams | `/user/exams` | PageContainer, Stack, ErrorContainer, H2, Body | □ |
| 10 | User Topics | `/user/topics` | PageContainer, Stack, SectionReveal, H2, Body | □ |
| 11 | User Topic Exams | `/user/topics/:id/exams` | PageContainer, ErrorContainer, H2, Body | □ |
| 12 | User Subject Tests | `/user/subject-tests` | PageContainer, ErrorContainer, H2, Body | □ |
| 13 | User Prepare & Write | `/user/prepare-write` | PageContainer, ErrorContainer, H2, Body | □ |
| 14 | User Full Exams | `/user/teacher-exams` | PageContainer, Stack, ErrorContainer, H2, Body | □ |
| 15 | User Leaderboard | `/user/leaderboard` | Tabs, PageContainer, Stack, H2, Body | □ |
| 16 | User Performance | `/user/performance` | PageContainer, Stack, H2, Body, ErrorContainer | □ |
| 17 | User History | `/user/history` | PageContainer, Stack, H2, Body, AttemptCardBase | □ |
| 18 | User Profile | `/user/profile` | PageContainer, Stack, Grid, PageTransition | □ |
| | **Exam Experience** | | | |
| 19 | Active Exam | `/exam/:id` | Button, IconBadge, Spinner | □ |
| 20 | Exam Review | `/exam/:id/review` | Button, ReviewLayout | □ |
| 21 | Exam Results | `/exam/:id/results` | Button, PageContainer, Stack, Grid, ScoreCard | □ |
| | **Admin Pages** | | | |
| 22 | Admin Overview | `/admin` | PageContainer, Stack, SectionReveal, Card | □ |
| 23 | Admin Questions | `/admin/questions` | PageContainer, Stack, SectionReveal, EmptyState | □ |
| 24 | Admin Upload | `/admin/upload` | PageContainer, Stack | □ |
| 25 | Admin Topics | `/admin/topics` | PageContainer, Stack, Button, Tabs, AdminModal | □ |
| 26 | Admin Users | `/admin/users` | PageContainer, Stack, ConfirmModal | □ |
| 27 | Admin Leaderboard | `/admin/leaderboard` | PageContainer, SectionReveal, Card, Stack | □ |
| 28 | Admin Settings | `/admin/settings` | PageContainer, Stack, Card, Button, Grid | □ |
| 29 | Admin Sub-Admins | `/admin/sub-admins` | PageContainer | □ |
| | **Sub-Admin Pages** | | | |
| 30 | Sub-Admin Dashboard | `/sub-admin` | PageContainer, Stack, Grid, StatCard, H2, Body | □ |
| 31 | Sub-Admin Students | `/sub-admin/students` | PageContainer, Stack, Card, Button, AdminFilterBar | □ |
| 32 | Sub-Admin Exams | `/sub-admin/exams` | PageContainer, Stack | □ |
| 33 | Sub-Admin Settings | `/sub-admin/settings` | PageContainer, Stack, Grid, SectionReveal | □ |
| 34 | Sub-Admin Create | `/sub-admin/create` | PageContainer, Stack, Card, Tabs, SectionReveal | □ |
| | **Error/Utility Pages** | | | |
| 35 | Unauthorized | `/unauthorized` | Button, IconBadge, PageContainer | □ |
| 36 | Auth Callback | `/auth/callback` | LoadingScreen | □ |

### V.2 Verification Protocol

After EVERY implementation phase:

1. Identify which pages from the baseline are affected by the phase
2. Compare each affected page against its baseline screenshot/description
3. Classify the result:

   ```
   No regression:    Page appears identical to baseline
   Minor regression: Layout/typography/spacing differences within spec
   Major regression: Broken layout, missing content, broken interactions
   ```

4. For any regression, determine required fixes before proceeding
5. Update baseline after intentional visual changes are approved

### V.3 Baseline Capture Method

Before Phase 0a implementation:
```
1. Navigate to each page listed above
2. Capture full-page screenshot (or describe key visual elements)
3. Save to .visual-baseline/ directory in repository root
4. Document key visual characteristics (colors, sizes, spacing)
```

---

## Design System Compliance Score

### D.1 Scoring Framework

At the end of every implementation phase, a compliance score is generated.

Each component/system is scored as a percentage:

```
Score = (implemented_features / total_required_features) × 100
```

| Component | Total Features | Scoring Criteria |
|---|---|---|
| Design Tokens | 10 | All radius/shadow/spacing tokens registered, no arbitrary values |
| Typography | 8 | H1-H3 aligned with CSS tokens, no arbitrary text sizes, dead code removed |
| Buttons | 12 | 9 variants, 6 sizes, loading/disabled, no arbitrary values, ARIA |
| Cards | 8 | 7 variants, 4 padding values, hover lift, StatCard statuses |
| Forms | 18 | 6 elements × 3 states (error/success/loading/required/optional/helperText) |
| Dialogs | 10 | AdminModal + 4 feedback dialogs + ConfirmModal, all accessible |
| Spacing | 6 | Stack gap map standardized, no arbitrary gaps, no dead spacing export |
| Feedback | 10 | 5 dialog types, decision tree, toast only for errors, 0 success toast violations |
| Accessibility | 14 | Keyboard nav, ARIA, focus trap, screen reader, mobile, touch |
| Animation | 6 | Framer Motion for interactive, Tailwind for decorative, no inline keyframes |
| Repository Adoption | 100 | All pages use canonical components (36 pages × ~3 components each) |

### D.2 Scoring Report Format

```
┌─────────────────────────────────────────────────────────────┐
│     DESIGN SYSTEM COMPLIANCE REPORT — Phase <N>             │
├─────────────────────────────────────────────────────────────┤
│ Component              Current    Target    Remaining        │
│ ─────────────────────────────────────────────────────────── │
│ Design Tokens          XX%        100%      <gap>            │
│ Typography             XX%        100%      <gap>            │
│ Buttons                XX%        100%      <gap>            │
│ Cards                  XX%        100%      <gap>            │
│ Forms                  XX%        100%      <gap>            │
│ Dialogs                XX%        100%      <gap>            │
│ Spacing                XX%        100%      <gap>            │
│ Feedback               XX%        100%      <gap>            │
│ Accessibility          XX%        100%      <gap>            │
│ Animation              XX%        100%      <gap>            │
│ Repository Adoption    XX%        100%      <gap>            │
├─────────────────────────────────────────────────────────────┤
│ OVERALL SCORE: XX%                                           │
│ TARGET: 100%                                                  │
│ REMAINING WORK: <list of items>                               │
│ BLOCKED ITEMS: <list of blockers>                             │
│ NEXT PHASE: <Phase ID> — <Phase Name>                        │
└─────────────────────────────────────────────────────────────┘
```

### D.3 Score Calculation Rules

- **Set to 100%** for components that require no changes (Spinner, StatCard, AdminModal, etc.)
- **Set to 0%** for components not yet started
- **Incremental** — scores only increase, never decrease
- **Repository Adoption** = pages using ONLY canonical components / total pages × 100
  - Initially: ~25/36 = 69% (pages using canonical components correctly)
  - Target: 36/36 = 100%

---

## Phase A — Repository Dependency Analysis

### A.1 Complete Dependency Graph — Topological Sort

```
SET 0 (no dependencies)
├── Design Tokens (themes.css, index.css @theme) ───── Layer 0 Foundation
├── Spinner ─────────────────────────────────────────── No UI deps
├── AntigravityAnimation (PageTransition, SectionReveal) ─── framer-motion only
├── IconBadge ───────────────────────────────────────── Lucide only
├── PremiumIconContainer ───────────────────────────── No deps
├── PremiumSelect ──────────────────────────────────── framer-motion only
├── AdminIconWrap ───────────────────────────────────── useTheme only
├── AdminText ───────────────────────────────────────── useTheme only
├── ThemeToggle ─────────────────────────────────────── No deps
├── useStableFetch ──────────────────────────────────── Standalone hook

SET 1 (depends on SET 0 + Spinner/Theme)
├── Spinner ─────────────────────────────────────────── (N/A — already in SET 0)
├── Button, PrimaryButton, IconButton ───────────────── Spinner + useTheme
├── Card, StatCard ──────────────────────────────────── PremiumIconContainer + useTheme
├── AntigravityForm (Input, TextArea, Select, Switch, Checkbox, Radio, RadioGroup) ─── No internal deps
├── AntigravityTypography (H1, H2, H3, Body, Label, BrandTitle) ─── No internal deps
├── AdminModal ──────────────────────────────────────── IconButton (from Button)
├── LoadingOverlay ──────────────────────────────────── Spinner
├── SegmentedFilter ─────────────────────────────────── SelectionContainer + TabsSize type
├── useAsyncOperation ───────────────────────────────── useStableFetch
├── usePageError ────────────────────────────────────── useStableFetch
└── useBreakpoint ───────────────────────────────────── Standalone

SET 2 (depends on SET 1 + SET 0)
├── AntigravityData (Tabs, Badge, ProgressBar, MetricBlock, DataGrid) ─── Label + IconBadge + useTheme
├── AntigravityLayout (PageContainer, Stack, Grid, SectionHeader, etc.) ─── PremiumSelect + AdminIconWrap + AdminText
├── Alert ───────────────────────────────────────────── No deps (standalone)
├── Pagination ──────────────────────────────────────── IconButton (via AntigravityUI barrel)
├── RetryButton ─────────────────────────────────────── Button (via AntigravityUI barrel)
│   (useAsyncOperation, usePageError) ── already above

SET 3 (depends on SET 2 + SET 1 + SET 0)
├── AntigravityDashboard (ExamCard, ActivityCard) ───── Card + Badge + Button + Body + PremiumIconContainer
├── AntigravityResults (ScoreCard, ResultStatCard, CTACard) ─── Card + Label + H3 + Body
├── SharedComponents (LoadingSkeleton, GridSkeleton, StatSkeleton, ErrorState, EmptyState, ConfirmModal) ─── Button + AdminModal
├── ErrorContainer ──────────────────────────────────── Card + Stack + IconBadge + SectionReveal
├── DataTable ───────────────────────────────────────── Card + DataGrid + Pagination + LoadingSkeleton + EmptyState
├── AdminFilterBar ──────────────────────────────────── FilterBar + Input + FilterSelect + IconButton
├── Menu ────────────────────────────────────────────── framer-motion only (standalone)
└── Navigation ──────────────────────────────────────── useBreakpoint

SET 4 (depends on multiple SET 3 components)
├── Domain-specific modals (SubmitExamModal, AddExamModal, SingleQuestionModal, etc.)
├── Domain-specific views (QuestionCard, ReviewLayout, TopicCard, etc.)
├── Feature hooks (useAdminTopics, useAdminSettings, useSettings, etc.)
└── Pages (all page files)

SET 5 (top-level compositors)
├── Layout files (SidebarLayout, UserLayout, AdminLayout, SubAdminLayout)
├── Context providers (AuthContext, ThemeContext, LanguageContext)
└── App.tsx (router)
```

### A.2 Cycle Detection

**No circular dependencies found** in the component hierarchy. All dependency chains are strictly acyclic following the bottom-up order above.

### A.3 Critical Path

The longest dependency chain that must be migrated sequentially:

```
Design Tokens (themes.css / index.css @theme)
  → Spinner (no deps, foundational)
  → Button (depends on Spinner)
  → AdminModal (depends on IconButton→Button)
  → ConfirmModal (wraps AdminModal + Button)
  → SharedComponents → DataTable
  → Page implementations

Design Tokens
  → Label (Typography, no deps)
  → AntigravityData (depends on Label)
  → AntigravityDashboard (depends on AntigravityData + Card + Button)
  → Page implementations
```

---

## Phase B — Component Impact Report

### B.1 All Reusable Components

| # | Component | Current Status | Canonical Status | Files Using | Usages | Required Changes | Breaking Risk | Regression Risk | Migration Complexity |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Design Tokens** | 570 tokens, 3 layers | Register missing radii in @theme | themes.css, index.css | N/A | Add 7 new radius tokens, document approved values | LOW (additive only) | LOW | **Low** |
| 2 | **Spinner** | 3 sizes, 2 variants, `animate-spin` | Match spec — no changes needed | 6 files | 6 | None | None | None | **None** |
| 3 | **Button** | 9 variants, 6 sizes, loading/disabled | Match spec. Replace arbitrary values with token refs | ~90 files | ~90 | Replace `rounded-[10px]`→`--radius-button-xs`, `text-[10px]`→`--text-3xs`, etc. | **MEDIUM** (classnames change, visual diff risk) | MEDIUM | **Medium** |
| 4 | **IconButton** | 2 sizes, 5 variants, focusRing | Match spec. Replace arbitrary values | ~20 files | ~20 | Replace `w-[36px] h-[36px] rounded-[10px]` with token values | LOW | LOW | **Low** |
| 5 | **Card** | 7 variants, padding map | Match spec. Replace arbitrary values | 35 files | ~35 | Replace `rounded-[2.5rem]`=40px register token | LOW | LOW | **Low** |
| 6 | **StatCard** | 6 statuses, loading, color | Match spec. Already aligned | 4 files | 4 | None | None | None | **None** |
| 7 | **Input** | 3 variants | Add: error, helperText, success, loading, required, optional | 20 files | ~20 | Add new props + render error/success/helper states | **MEDIUM** (new props, backward compatible with defaults) | **MEDIUM** | **Medium** |
| 8 | **TextArea** | 2 variants | Same as Input | 6 files | ~6 | Same + add new states | MEDIUM | MEDIUM | **Medium** |
| 9 | **Select** | icon, label, placeholder, disabled | Add: error, helperText, success, loading, required, optional | 10 files | ~10 | Same + add new states | MEDIUM | MEDIUM | **Medium** |
| 10 | **Switch** | checked, onChange, label, disabled | Add: error, helperText, required, optional | 8 files | ~8 | Same + add new states | LOW | MEDIUM | **Medium** |
| 11 | **Checkbox** | checked, onChange, label, disabled | Add: error, helperText, required, optional | 6 files | ~6 | Same + add new states | LOW | LOW | **Low** |
| 12 | **Radio** | checked, onChange, label, disabled | Add: error, helperText, required, optional | 4 files | ~4 | Same + add new states | LOW | LOW | **Low** |
| 13 | **RadioGroup** | value, onChange, options, label, disabled | Add: error, helperText, required, optional | 6 files | ~6 | Same + add new states | LOW | LOW | **Low** |
| 14 | **FormField** (NEW) | Does not exist | Create wrapper: Label+Input+HelperText+ValidationError | N/A | ~20 (after migration) | Create new component | None (new component) | N/A | **Low** (creation), **High** (migration) |
| 15 | **AdminModal** | isOpen, onClose, title, footer, focus trap | Match spec. Already aligned | 10 direct + 8 via ConfirmModal | 18 | None | None | None | **None** |
| 16 | **ConfirmModal** | open, title, message, danger, confirm/cancel | Match spec. Already aligned | 8 files | 8 | None | None | None | **None** |
| 17 | **SuccessDialog** (NEW) | Does not exist | Create: wraps AdminModal, OK button, success icon | N/A | 0 (target ~20) | Create new component | None (new) | N/A | **Low** (creation), **High** (migration) |
| 18 | **ErrorDialog** (NEW) | Does not exist | Create: wraps AdminModal, OK + optional Retry, error icon | N/A | 0 (target ~72 showError) | Create new component | None (new) | N/A | **Low** (creation) |
| 19 | **WarningDialog** (NEW) | Does not exist | Create: wraps AdminModal, Proceed/Cancel, warning icon | N/A | 0 (target TBD) | Create new component | None (new) | N/A | **Low** (creation) |
| 20 | **InfoDialog** (NEW) | Does not exist | Create: wraps AdminModal, OK button, info icon | N/A | 0 (target TBD) | Create new component | None (new) | N/A | **Low** (creation) |
| 21 | **H1, H2, H3, Body, Label, BrandTitle** | Current sizes differ from CSS tokens | Align H1/H2/H3 sizes with CSS --text-h1/h2/h3 | 45 files | ~45 | Change default size values in typography components | **MEDIUM** (visual change across all consumers) | **HIGH** (heading sizes change on 45+ consumers) | **Medium** |
| 22 | **PageContainer** | centered, fullHeight, padded | Match spec. Replace arbitrary max-w with token | 50 files | ~50 | Replace `max-w-[1280px]` with `max-w-7xl` or register token | LOW | LOW | **Low** |
| 23 | **Stack** | gap map with hardcoded values | Replace `gap-[4px]`→`gap-1`, `gap-[8px]`→`gap-2`, etc. | 50 files | ~50 | Inline gap values change from `gap-[16px]` to standard Tailwind `gap-4` | LOW | LOW | **Low** |
| 24 | **Grid** | responsive cols, gap | Match spec. Already aligned | 20 files | ~20 | None immediately | None | None | **Low** |
| 25 | **SectionHeader** | AdminIconWrap + AdminText | Match spec. Already aligned | 15 files | ~15 | None | None | None | **None** |
| 26 | **Tabs** | 2 variants, 3 sizes, layoutId animation | Match spec. Already aligned | 6 files | ~6 | None | None | None | **None** |
| 27 | **Badge** | 6 variants, 2 sizes, pulse | Match spec. Already aligned | 18 files | ~18 | None | None | None | **None** |
| 28 | **ProgressBar** | 4 colors, animated | Match spec. Already aligned | 3 files | ~3 | None | None | None | **None** |
| 29 | **DataGrid** | sortable, selectable, striped | Match spec. Already aligned | 3 files | ~3 | None | None | None | **None** |
| 30 | **DataTable** | loading, empty, pagination wrapper | Match spec. Already aligned | 0 direct + via barrel | ~0 | None | None | None | **None** |
| 31 | **LoadingSkeleton** | text/card types, animate-pulse | Match spec. Already aligned | 20 files | ~20 | None | None | None | **None** |
| 32 | **GridSkeleton** | count, height, columns | Match spec. Already aligned | 6 files | ~6 | None | None | None | **None** |
| 33 | **StatSkeleton** | count | Match spec. Already aligned | 2 files | ~2 | None | None | None | **None** |
| 34 | **EmptyState** | icon, title, subtitle, action | Match spec. Already aligned | 15 files | ~15 | None | None | None | **None** |
| 35 | **ErrorState** | icon, title, message, onRetry, onBack | Match spec. Already aligned | 6 files | ~6 | None | None | None | **None** |
| 36 | **Alert** | 4 variants | Match spec. Replace `rounded-[14px]`→`--radius-alert`, `text-[13px]`→`--text-body-2` | 2 files | 2 | Replace arbitrary values | LOW | LOW | **Low** |
| 37 | **Pagination** | page, totalPages, hasMore, totalCount, pageSize | Match spec. Already aligned | 1 file (DataTable) + via barrel | 1+ | None | None | None | **None** |
| 38 | **IconBadge** | 11 sizes, 7 statuses, 2 shapes | Match spec. Already aligned | 20 files | ~20 | None | None | None | **None** |
| 39 | **Menu** | compound: Trigger, Content, Item, Separator | Match spec. Already aligned | 0 direct | ~0 | None | None | None | **None** |
| 40 | **Navigation** | Shell, Items, Item, useBreakpoint | Match spec. Already aligned | 1 file (SidebarLayout) | 1 | None | None | None | **None** |
| 41 | **ErrorContainer** | 4 variants | Match spec. Replace `rounded-[14px]`→`--radius-md`, etc. | 3 files | 3 | Replace arbitrary values | LOW | LOW | **Low** |
| 42 | **RetryButton** | loading, disabled | Match spec. Already aligned | 3 files | 3 | None | None | None | **None** |
| 43 | **LoadingOverlay** | visible, aria-live | Match spec. Already aligned | 0 direct | ~0 | None | None | None | **None** |
| 44 | **PageTransition** | motion.div wrapper | Match spec. Already aligned | 1 file (barrel) + via barrel | ~5 | None | None | None | **None** |
| 45 | **SectionReveal** | intersection observer | Match spec. Already aligned | 15 files | ~15 | None | None | None | **None** |
| 46 | **SelectionsContainer** | rounded-2xl, shadow | Match spec. Already aligned | 2 files | ~2 | None | None | None | **None** |
| 47 | **FilterBar** | rounded-[14px], bg-card-bg/50 | Register `--radius-filter` token | 1 file | 1 | Replace arbitrary values | LOW | LOW | **Low** |
| 48 | **StatePanel** | rounded-2xl, border-gold | Match spec. Already aligned | 1 file | ~1 | None | None | None | **None** |
| 49 | **useStableFetch** | mountedRef, requestId | Match spec. No changes needed | 22 files | 22 | None | None | None | **None** |
| 50 | **useAsyncOperation** | loading, execute | Match spec. No changes needed | 8 files | 8 | None | None | None | **None** |
| 51 | **useToast** | toasts, showSuccess, showError, showToast + ToastContainer | Match spec. Add showWarning, showInfo | 35 files | ~35 | Add convenience methods. No breaking changes | LOW | LOW | **Low** |

### B.2 Pages Bypassing Design System

| # | Page | Lines | Missing Canonical Components | Arbitrary Values | Required Changes | Breaking Risk | Migration Complexity |
|---|---|---|---|---|---|---|---|
| P1 | **SplashPage** | 270 | No AntigravityUI imports, inline `<style>` | 15+ | Replace with BrandTitle (gradient), PageTransition, Card | HIGH | **High** |
| P2 | **FinishSignInPage** | 197 | No PageContainer/Card/Stack, manual card, custom spinner | 6+ | Use PageContainer, Card, Spinner | LOW | **Medium** |
| P3 | **AccountDisabledPage** | 77 | No PageContainer/Card/Stack, manual card, inline SVG | 5+ | Use PageContainer, Card | LOW | **Medium** |
| P4 | **UpdatePasswordPage** | 126 | No PageContainer/Card/Stack, 5 inline styles, inline `<style>`, custom spinner, manual validation | 12+ | Use PageContainer, Card, Spinner, Alert, react-hook-form | MEDIUM (form behavior change) | **High** |
| P5 | **VerifyEmailPage** | 248 | Raw `<button>`, custom spinner, no PageContainer/Card/Stack | 21+ | Replace raw buttons with Button, spinner with Spinner, add layout | LOW | **Medium** |
| P6 | **LoginPage** | 444 | Manual `<h1>`, raw stats spans | 14+ | Use BrandTitle for left panel heading | LOW | **Low** |
| P7 | **SignupPage** | 540 | Manual `<h1>`, custom spinner, manual feature chips | 18+ | Use BrandTitle, Spinner | LOW | **Low** |

### B.3 Toast → Dialog Migration Targets

| # | File | `showSuccess` Calls | `showError` Calls | Migration Action |
|---|---|---|---|---|
| T1 | useAdminTopics.ts | 6 | 9 | 6 showSuccess → SuccessDialog; keep showError as toasts |
| T2 | useSettings.ts | 5 | 11 | 5 showSuccess → SuccessDialog; keep showError as toasts |
| T3 | useProfile.ts | 3 | 3 | 3 showSuccess → SuccessDialog; keep showError as toasts |
| T4 | useCreateExam.ts | 3 | 5 | 3 showSuccess → SuccessDialog; keep showError as toasts |
| T5 | usePrepareWrite.ts | 3 | 0 | 3 showSuccess → SuccessDialog |
| T6 | AdminSubAdmins.tsx | 2 | 3 | 2 showSuccess → SuccessDialog; keep showError as toasts |
| T7 | useStudents.ts | 2 | 2 | Keep (clipboard copies = brief toasts); keep showError as toasts |
| T8 | useAdminUsers.ts | 1 | 1 | 1 showSuccess → SuccessDialog |
| T9 | useAdminExams.ts | 1 | 3 | 1 showSuccess → SuccessDialog |
| T10 | AddExamModal.tsx | 1 | 3 | 1 showSuccess → SuccessDialog |
| T11 | useAdminSettings.ts | 1 | 3 | 1 showSuccess → SuccessDialog |
| T12 | LoginPage.tsx | 1 | 9 | Keep (normal login success = toast); keep showError as toasts |
| T13 | SignupPage.tsx | 2 | 6 | Keep (signup success = toast); keep showError as toasts |
| T14 | useExamSession.ts | 0 | 3 | Keep as toasts (error recovery) |
| T15 | useExamSubmission.ts | 0 | 1 | Keep as toast |
| T16 | CreateStepReview.tsx | 0 | 1 | Keep as toast |
| T17 | ExamTimer component | TBD | TBD | Keep as toasts (timers/warnings) |
| **Totals** | | **28** | **72** | **~21 showSuccess → dialogs; 7 retained as toasts; 72 showErrors retained** |

---

## Phase C — Migration Order

### C.1 Foundation: Dependency Justification

The order is determined by the dependency graph in Phase A. Each block must complete before the next block begins.

```
BLOCK 0 ── Foundation Layer (no consumer code changes)
  0a. Design Token additions (register new radius/shadow tokens)
  0b. Spinner (finalized — no changes needed)

BLOCK 1 ── Atomic Components (no cross-component deps)
  1a. Typography (H1, H2, H3, Body, Label, BrandTitle)
  1b. Button + IconButton
  1c. Card + StatCard
  1d. Form elements (Input, TextArea, Select, Switch, Checkbox, Radio, RadioGroup)
  1e. AdminModal
  
BLOCK 2 ── Composite Components (depend on Block 1)
  2a. FormField (NEW — depends on Typography Label)
  2b. Feedback Dialogs (NEW — SuccessDialog, ErrorDialog, WarningDialog, InfoDialog — depend on AdminModal + Button)
  2c. AntigravityData (Tabs, Badge, ProgressBar — depend on Label + IconBadge)
  2d. AntigravityLayout (PageContainer, Stack, Grid, SectionHeader — depend on PremiumSelect + AdminIconWrap)
  2e. AntigravityDashboard (depends on Card, Badge, Button, Body)
  2f. AntigravityResults (depends on Card, Label, H3, Body)
  2g. ErrorContainer (depends on Card, Stack, IconBadge, SectionReveal)
  2h. ConfirmModal (depends on Button + AdminModal — already done)
  2i. DataTable (depends on Card, DataGrid, Pagination, LoadingSkeleton, EmptyState)

BLOCK 3 ── Page Migration (depends on Block 0-2)
  3a. Authentication pages (P2-P7: FinishSignInPage, AccountDisabledPage, VerifyEmailPage, LoginPage, SignupPage, UpdatePasswordPage)
  3b. Landing page (P1: SplashPage)
  3c. User pages (SubAdminStudents, UserLeaderboard, Unauthorized)

BLOCK 4 ── Feedback Migration
  4a. Toast → Dialog replacement (T1-T11)
  4b. Form validation standardization (inline errors)

BLOCK 5 ── Arbitrary Value Cleanup (split by directory)
  5a. Reusable Components (src/components/common/)
  5b. Authentication Pages (src/pages/ auth/ login, signup, etc.)
  5c. User Pages (src/pages/user/ + src/components/user/)
  5d. Sub-Admin Pages (src/pages/sub-admin/ + src/components/sub-admin/)
  5e. Admin Pages (src/pages/admin/ + src/components/admin/)
  5f. Shared Utilities (src/hooks/ + src/layouts/ + src/styles/)

BLOCK 6 ── Token Cleanup
  6a. Remove dead spacing export (AntigravityTypography.tsx)
  6b. Remove dead tokens (themes.css, index.css)

BLOCK 7 ── Final Validation and Certification
  7a. Validation Sprint
  7b. Certification Report
```

### C.2 What Each Block Affects

**Block 0 — Foundation Layer**
- Files changed: `src/styles/themes.css`, `src/index.css`
- Components affected: None directly (tokens are referenced, not imported)
- Pages affected: None
- Validation: `npx tsc --noEmit`, visual inspection of existing components
- Risk: **LOW** (additive changes only, no existing tokens removed)

**Block 1a — Typography**
- Files changed: `src/components/common/AntigravityTypography.tsx`
- Components that depend on this: AntigravityData (Label), AntigravityResults (Label, H3, Body), AntigravityDashboard (Body), ~45 consumers
- Pages affected: Every page that uses H1/H2/H3/Body/Label (~20 pages)
- Validation: Visual comparison of heading sizes before/after
- Risk: **MEDIUM** (visual change — heading sizes may shift)

**Block 1b — Button**
- Files changed: `src/components/common/AntigravityButton.tsx`
- Components that depend on this: AdminModal (IconButton), Pagination (IconButton), SharedComponents (Button), RetryButton (Button), AntigravityDashboard (Button), AdminFilterBar (IconButton), ~90 consumers
- Pages affected: Essentially every page
- Validation: Check all button variants visually; test loading/disabled states
- Risk: **MEDIUM** (classNames change; visual diff accidental)

**Block 1c — Card**
- Files changed: `src/components/common/AntigravityCard.tsx`
- Components that depend on this: AntigravityDashboard (Card), AntigravityResults (Card), ErrorContainer (Card), DataTable (Card), ~35 consumers
- Pages affected: ~15 pages
- Validation: Visual card appearance; hover lift effects; padding variants
- Risk: **LOW** (minor adjustments to existing token references)

**Block 1d — Form Elements**
- Files changed: `src/components/common/AntigravityForm.tsx`
- Components that depend on this: AdminFilterBar (Input), ~20 consumers
- Pages affected: ~10 pages
- Validation: Each form element displays all states correctly
- Risk: **MEDIUM** (non-breaking additive changes — new props don't break existing callers)

**Block 1e — AdminModal** (already finalized — no changes)

**Block 2a — FormField (NEW)**
- Files created: `src/components/common/FormField.tsx`
- Components that depend on this: Nothing yet (new component)
- Pages affected: None yet (migration in Block 4b)
- Validation: FormField renders Label + children + helper/error text correctly
- Risk: **LOW** (new component, no existing code broken)

**Block 2b — Feedback Dialogs (NEW)**
- Files created: `SuccessDialog.tsx`, `ErrorDialog.tsx`, `WarningDialog.tsx`, `InfoDialog.tsx`
- Components that depend on this: Nothing yet (new components)
- Pages affected: None yet (migration in Block 4a)
- Validation: Each dialog renders correctly; focus trap; escape; backdrop click
- Risk: **LOW** (new components, existing toast system unchanged)

**Block 3a — Authentication Page Migration**
- Files changed: FinishSignInPage, AccountDisabledPage, VerifyEmailPage, LoginPage, SignupPage, UpdatePasswordPage
- Components affected: All canonical components (usage increased)
- Pages affected: 6 auth pages
- Validation: Each page visually matches before/after; all functionality preserved
- Risk: **MEDIUM**

**Block 3b — Landing Page Migration**
- Files changed: SplashPage
- Components affected: BrandTitle, PageTransition, Card
- Pages affected: SplashPage only
- Risk: **HIGH** (SplashPage is entirely custom)

**Block 3c — User Page Migration**
- Files changed: SubAdminStudents, UserLeaderboard, Unauthorized
- Components affected: ErrorContainer, ProgressBar, EmptyState
- Pages affected: 3 pages
- Risk: **LOW**

**Block 4a — Toast → Dialog Migration**
- Files changed: 11 feature hooks/pages (T1-T11)
- Components affected: SuccessDialog used in place of showSuccess
- Pages affected: Admin settings, topics, exams, users; sub-admin settings, students; user profile, prepare-write
- Validation: Success scenarios show dialog instead of toast; dialog dismisses correctly
- Risk: **MEDIUM** (UX change — dialog requires explicit OK, no auto-dismiss)

**Block 4b — Form Validation Standardization**
- Files changed: AdminSubAdmins, useAdminSettings, AddExamModal, useAdminTopics, useCreateExam, UpdatePasswordPage, FinishSignInPage
- Components affected: FormField + form elements with new props
- Pages affected: Admin sub-admins, settings, topics; sub-admin create; auth pages
- Validation: Validation errors appear inline below fields; no toast errors for validation
- Risk: **HIGH** (form submission behavior changes; validation flow changes)

**Block 5a — Reusable Components Arbitrary Cleanup**
- Files changed: ~25 files in `src/components/common/` with 168 arbitrary values
- Components affected: Button, Card, Form, Layout, Data, Dashboard, Results, ErrorContainer, FilterBar
- Pages affected: None directly (component-level changes)
- Risk: **MEDIUM** (component classname changes affect all consumers)

**Block 5b — Authentication Pages Cleanup**
- Files changed: SplashPage, LoginPage, SignupPage, VerifyEmailPage, FinishSignInPage, AccountDisabledPage, UpdatePasswordPage
- Components affected: All
- Pages affected: 7 auth pages
- Risk: **LOW** (page-level only)

**Block 5c — User Pages Cleanup**
- Files changed: ~25 files in `src/pages/user/` + `src/components/user/`
- Components affected: All
- Pages affected: ~10 user pages
- Risk: **LOW** (page-level only)

**Block 5d — Sub-Admin Pages Cleanup**
- Files changed: ~15 files in `src/pages/sub-admin/` + `src/components/sub-admin/`
- Components affected: All
- Pages affected: ~5 sub-admin pages
- Risk: **LOW**

**Block 5e — Admin Pages Cleanup**
- Files changed: ~40 files in `src/pages/admin/` + `src/components/admin/`
- Components affected: All
- Pages affected: ~8 admin pages
- Risk: **LOW**

**Block 5f — Shared Utilities Cleanup**
- Files changed: ~10 files in `src/hooks/` + `src/layouts/` + `src/styles/`
- Components affected: None
- Pages affected: None
- Risk: **LOW**

**Block 6a — Dead Code Removal**
- Files changed: `AntigravityTypography.tsx` (remove dead spacing export)
- Components affected: None (removing unused export)
- Pages affected: None
- Validation: `npx tsc --noEmit` passes; grep for `from './AntigravityTypography'` shows no `spacing` consumers
- Risk: **LOW**

**Block 6b — Dead Token Removal**
- Files changed: `themes.css`, `index.css`
- Components affected: None (removing unused tokens)
- Pages affected: None
- Validation: No `var(--removed-token)` references exist anywhere
- Risk: **LOW**

### C.3 Resource Estimates

| Block | Files Changed | New Files | Estimated Implementation Time | Risk Level |
|---|---|---|---|---|
| Block 0 (Tokens) | 2 | 0 | 1 session | LOW |
| Block 1a (Typography) | 1 | 0 | 1 session | MEDIUM |
| Block 1b (Button) | 1 | 0 | 1 session | MEDIUM |
| Block 1c (Card) | 1 | 0 | 1 session | LOW |
| Block 1d (Form) | 1 | 0 | 2 sessions | MEDIUM |
| Block 2a (FormField) | 1 | 1 | 1 session | LOW |
| Block 2b (Dialogs) | 1 | 4 | 1 session | LOW |
| Block 3a (Auth pages) | 6 | 0 | 2 sessions | MEDIUM |
| Block 3b (SplashPage) | 1 | 0 | 1 session | HIGH |
| Block 3c (User pages) | 3 | 0 | 1 session | LOW |
| Block 4a (Toast→Dialog) | 11 | 0 | 2 sessions | MEDIUM |
| Block 4b (Validation) | 7 | 0 | 2 sessions | HIGH |
| Block 5a (Common clean) | 25 | 0 | 2 sessions | MEDIUM |
| Block 5b (Auth clean) | 7 | 0 | 1 session | LOW |
| Block 5c (User clean) | 25 | 0 | 2 sessions | LOW |
| Block 5d (Sub-admin clean) | 15 | 0 | 1 session | LOW |
| Block 5e (Admin clean) | 40 | 0 | 2 sessions | LOW |
| Block 5f (Utilities clean) | 10 | 0 | 1 session | LOW |
| Block 6a (Dead code) | 1 | 0 | 1 session | LOW |
| Block 6b (Dead tokens) | 2 | 0 | 1 session | LOW |
| Block 7a (Validation) | 0 | 0 | 1 session | LOW |
| Block 7b (Certification) | 0 | 1 | 1 session | LOW |
| **Totals** | **~160 files** | **6 new files** | **~28 sessions** | |

---

## Phase D — Validation Checklists

### D.1 Pre-Migration Checklist (for EVERY phase)

```
□ TypeScript compilation passes: npx tsc --noEmit passes with zero errors
□ Current git branch is clean: git status shows no uncommitted changes
□ All current tests pass (if test runner exists)
□ All pages render without runtime errors
□ Current arbitrary value counts are documented (baseline)
□ Current visual state is documented (screenshots or description)
□ Repository Impact Report generated and approved
□ Freeze Protection policy checked — no frozen features violated
□ Visual regression baseline captured for affected pages
□ Rollback plan prepared
```

### D.2 Implementation Checklist (for EVERY phase)

```
□ Changes are limited to ONE component category (enforced by Safety Rule 1)
□ Every new prop has a default value (backward compatible)
□ Every new state has a visual indicator (error = red, success = green, etc.)
□ Every component change is TypeScript-strict (no `any`)
□ ARIA attributes are correct for new/changed states
□ Keyboard navigation works for new/changed interactive elements
□ No inline styles added (use Tailwind classes or CSS variables)
□ No arbitrary values added (use registered tokens)
□ New components are exported from AntigravityUI barrel
□ All frozen feature files remain unmodified
```

### D.3 Post-Migration Checklist (for EVERY phase)

```
□ TypeScript compilation passes: npx tsc --noEmit with zero errors
□ All existing pages still render (no crash)
□ Visual comparison: pages using changed component look correct
□ All variants of changed component render correctly
□ All states of changed component work correctly (loading, disabled, error, etc.)
□ Responsive behavior is intact (test mobile, tablet, desktop)
□ Dark mode / light mode both render correctly
□ No regression in accessibility (tab order, focus management, screen reader)
□ Visual regression baseline compared — no major regressions
□ Compliance score updated
```

### D.4 Regression Checklist (for EVERY phase)

```
□ Button: all 9 variants, all 6 sizes, loading, disabled
□ Card: all 7 variants, all 4 padding values, hover lift
□ Form: every Input, TextArea, Select variant; Switch toggle; Checkbox/Radio states
□ Modal: open/close animation, focus trap, escape key, backdrop click
□ Dialog: title, description, footer buttons, all variants
□ Typography: H1/H2/H3/Body/Label rendering at correct sizes
□ Page: layout breaks (grid, stack, spacing), content is readable
□ Protected features (Feature 27, 28): no behavioral changes
```

### D.5 Rollback Strategy

```
For EVERY phase:

Step 1 — If TypeScript fails:
  □ Revert the last commit: git revert HEAD
  □ Fix the TypeScript issue
  □ Re-apply the changes

Step 2 — If visual regression detected:
  □ Revert the last commit: git revert HEAD
  □ Investigate the CSS/token mismatch
  □ Fix and test visually before re-applying

Step 3 — If functionality broken:
  □ Revert the last commit: git revert HEAD  
  □ The previous version is restored
  □ Report the issue before re-attempting

Step 4 — If protected feature affected:
  □ IMMEDIATE rollback: git revert HEAD
  □ Review Freeze Protection policy
  □ Only re-apply if change is in ALLOWED list

Step 5 — If rollback required:
  □ git reset --hard HEAD~1 (if uncommitted changes)
  □ git revert <commit-hash> (if committed)
  □ Verify rollback with npx tsc --noEmit
  □ Verify rollback with visual check

Rollback is ALWAYS preferred over fix-forward for safety.
```

### D.6 Phase-Specific Pre/Post Conditions

| Phase | Pre-condition | Post-condition |
|---|---|---|
| Block 2b (Feedback Dialogs) | `showSuccess` is the only success feedback mechanism | SuccessDialog exists and can be imported; `useToast` keeps working |
| Block 4a (Toast→Dialog) | `showSuccess` calls produce auto-dismiss toasts | `showSuccess` calls produce SuccessDialogs (or kept as toasts per migration list) |
| Block 4b (Form Validation) | Form validation errors shown as toasts or manually | Form validation errors shown inline via FormField |
| Block 3a-3c (Pages) | Pages bypass design system (raw HTML, missing canonical components) | Pages use canonical components; arbitrary values replaced with tokens |
| Block 5a-5f (Cleanup) | Arbitrary values in each directory | Zero arbitrary values in the directory |
| Block 6a (Dead code) | Dead `spacing` export exists | No dead exports |
| Block 7a (Validation) | All phases complete | All validation criteria pass |
| Block 7b (Certification) | All criteria pass | Certification report generated |

---

## Phase E — Repository Safety Rules

### E.1 Mandatory Rules

Every implementation session MUST follow these rules:

| # | Rule | Reason | Exception |
|---|---|---|---|
| **R1** | **One component category per phase** | Prevents cascading failures; isolates regressions | Never |
| **R2** | **Complete one component entirely before next** | "Almost done" leaves the system in a broken state | Never |
| **R3** | **Run `npx tsc --noEmit` after every phase** | Zero TypeScript errors is a blocking requirement | Never |
| **R4** | **Verify all affected pages manually after every phase** | Automated checks miss visual regressions | Low-risk changes (dead code removal only) |
| **R5** | **Keep implementation commits isolated** | Each phase = one commit. Enables clean rollback | Hotfixes only |
| **R6** | **Never migrate pages before Reusable Component is finalized** | Page migration depends on finalized components | Pre-approved exceptions for trivial changes |
| **R7** | **Never break existing behaviour** | The application must work after every change | Never |
| **R8** | **Preserve current functionality unless explicitly specified** | The Design System is consistency, not redesign | Only when DS explicitly overrides a behavior |
| **R9** | **No new variant beyond what's documented** | Variant proliferation defeats the purpose of a design system | Pre-approved DS specification update |
| **R10** | **No new component if composition from existing works** | Reuse > create | Pre-approved architecture decision |
| **R11** | **All arbitrary values must be documented in Design Token spec** | Token governance | Accidental discovery during cleanup |
| **R12** | **Every commit must have a descriptive message with phase reference** | Traceability | Never |
| **R13** | **Never violate Golden Reference Freeze Protection** | Certified features must remain stable | Only changes in ALLOWED list per Freeze Policy |
| **R14** | **Rollback is preferred over fix-forward** | Safer, cleaner, auditable | Urgent production fix (not applicable here) |
| **R15** | **Generate Repository Impact Report before every phase** | Risk assessment before code changes | Phase 0a (first phase — no prior changes) |
| **R16** | **Satisfy Migration Readiness Gate before every phase** | All preconditions must be met | Never |

### E.2 Commit Message Format

```
phase-<N>: <component-category> — <brief description>

<details of what changed>
<reason for change>
<reference to Golden Reference Design System section>
<freeze protection check: affected_features = [none | Feature_X]>
```

Examples:
```
phase-01: typography — Align H1/H2/H3 sizes with CSS tokens

Updated H1 default sizes to match --text-h1 (28px base)
Updated H2 default sizes to match --text-h2 (24px base)
Updated H3 default sizes to match --text-h3 (20px base)
Reference: GOLDEN_REFERENCE_DESIGN_SYSTEM.md §7.1
Freeze protection: affected_features = [none]
```

```
phase-04a: toast-to-dialog — Replace useAdminTopics showSuccess with SuccessDialog

Replaced 6 showSuccess calls in useAdminTopics.ts with SuccessDialog.
The dialog uses AdminModal (same animation/spacing/accessibility).
Reference: GOLDEN_REFERENCE_DESIGN_SYSTEM.md §4.3
Freeze protection: affected_features = [none]
```

### E.3 File Change Rules

```
□ NEVER modify files listed in Golden Reference Freeze Protection §G.2
□ Exceptions: only changes in the ALLOWED list per Freeze Policy §G.1
□ ALL other files are eligible for migration
□ Route files (App.tsx, router config) MUST NOT be modified
□ Context files (AuthContext, ThemeContext, LanguageContext) MUST NOT be modified
□ Service files (src/services/) MUST NOT be modified
□ Repository files (src/lib/repositories/) MUST NOT be modified
```

### E.4 Migration Safety Verification Protocol

Before marking any phase complete:

```
1. npx tsc --noEmit                 → Zero errors
2. npm run dev (or equivalent)      → App loads without runtime errors
3. Visual check of affected pages   → No visual regressions
4. Affected component check         → All variants work
5. Frozen feature check             → Feature 27 & 28 unaffected
6. Rollback prepared                → git commit made, revert is one command
7. Compliance score updated         → Report generated
```

---

## Phase F — Final Implementation Roadmap

### F.1 Execution Order (Final — Certified)

```
┌─────────────────────────────────────────────────────────────────────┐
│ BLOCK 0 — Foundation Layer (additive, no risk)                      │
├─────────────────────────────────────────────────────────────────────┤
│ Phase 0a: Design Token Additions                                    │
│   └─ Register: --radius-button-xs (10px), --radius-button-md (14px),│
│                 --radius-button-auth (18px), --radius-badge-md (14px),│
│                 --radius-alert (14px), --radius-icon-sm (10px),     │
│                 --radius-empty-state (32px), --radius-filter (14px) │
│   └─ Files: src/styles/themes.css, src/index.css                    │
│   └─ Dependencies: None                                             │
│   └─ Risk: LOW (additive)                                           │
│   └─ Validation: npx tsc, visual component check                    │
│   └─ Compliance: Design Tokens → 100%                               │
├─────────────────────────────────────────────────────────────────────┤
│ BLOCK 1 — Atomic Component Updates (independent of each other)      │
├─────────────────────────────────────────────────────────────────────┤
│ Phase 1a: Typography Unification                                    │
│   └─ Align H1/H2/H3 sizes with CSS --text-h1/h2/h3 tokens          │
│   └─ Files: src/components/common/AntigravityTypography.tsx         │
│   └─ Dependencies: Phase 0a                                         │
│   └─ Risk: MEDIUM (visual change across 45 consumers)               │
│   └─ Validation: Visual comparison of all pages using H1/H2/H3      │
│   └─ Compliance: Typography → 85% (after) → 100% (after dead code) │
│                                                                     │
│ Phase 1b: Button Arbitrary Value Cleanup                            │
│   └─ Replace 24 arbitrary values with token references              │
│   └─ Files: src/components/common/AntigravityButton.tsx             │
│   └─ Dependencies: Phase 0a                                         │
│   └─ Risk: MEDIUM (classname changes across 90 consumers)           │
│   └─ Validation: All button variants render correctly               │
│   └─ Compliance: Buttons → 100%                                     │
│                                                                     │
│ Phase 1c: Card Arbitrary Value Cleanup                              │
│   └─ Replace auth-light rounded-[2.5rem] with registered token      │
│   └─ Files: src/components/common/AntigravityCard.tsx               │
│   └─ Dependencies: Phase 0a                                         │
│   └─ Risk: LOW                                                      │
│   └─ Validation: All card variants render correctly                 │
│   └─ Compliance: Cards → 100%                                       │
│                                                                     │
│ Phase 1d: Form Element State Expansion                              │
│   └─ Add error, helperText, success, loading, required, optional    │
│      to all 6 form elements (Input, TextArea, Select, Switch,       │
│      Checkbox, Radio, RadioGroup)                                   │
│   └─ Files: src/components/common/AntigravityForm.tsx               │
│   └─ Dependencies: Phase 0a                                         │
│   └─ Risk: MEDIUM (new props, backward compatible with defaults)    │
│   └─ Validation: All elements with new states render correctly      │
│   └─ Compliance: Forms → 90% (states added, migration pending)     │
├─────────────────────────────────────────────────────────────────────┤
│ BLOCK 2 — New Composite Components (no existing code dependency)    │
├─────────────────────────────────────────────────────────────────────┤
│ Phase 2a: FormField Component                                       │
│   └─ Create FormField (Label + children + HelperText + ValidationErr│
│   └─ Files created: src/components/common/FormField.tsx             │
│   └─ Exported from: AntigravityUI barrel                            │
│   └─ Dependencies: Phase 1a (Label)                                 │
│   └─ Risk: LOW (new component)                                      │
│   └─ Validation: FormField renders all states correctly             │
│   └─ Compliance: Forms → 95% (FormField exists)                     │
│                                                                     │
│ Phase 2b: Feedback Dialog Components                                │
│   └─ Create: SuccessDialog, ErrorDialog, WarningDialog, InfoDialog  │
│   └─ All wrap AdminModal, share animation/spacing/accessibility     │
│   └─ Files created: src/components/common/SuccessDialog.tsx,        │
│      ErrorDialog.tsx, WarningDialog.tsx, InfoDialog.tsx             │
│   └─ Dependencies: AdminModal, Button, IconButton                   │
│   └─ Risk: LOW (new components)                                     │
│   └─ Validation: Each dialog renders; focus trap; escape; backdrop  │
│   └─ Compliance: Dialogs → 100%, Feedback → 80%                    │
├─────────────────────────────────────────────────────────────────────┤
│ BLOCK 3 — Page Migration (design system adoption)                   │
├─────────────────────────────────────────────────────────────────────┤
│ Phase 3a: Authentication Pages Migration                            │
│   └─ Order: VerifyEmailPage → FinishSignInPage → AccountDisabledPage│
│      → UpdatePasswordPage → LoginPage → SignupPage                  │
│   └─ Each page: replace raw elements with canonical components      │
│   └─ Files: src/pages/VerifyEmailPage.tsx, FinishSignInPage.tsx,    │
│      AccountDisabledPage.tsx, UpdatePasswordPage.tsx,               │
│      pages/LoginPage.tsx, pages/SignupPage.tsx                      │
│   └─ Dependencies: All Block 0-2 components finalized               │
│   └─ Risk: MEDIUM                                                   │
│   └─ Validation: Per-page visual before/after comparison            │
│   └─ Compliance: Repository Adoption → +6 pages                     │
│                                                                     │
│ Phase 3b: SplashPage Migration                                      │
│   └─ Replace with BrandTitle (gradient), PageTransition, Card       │
│   └─ Files: src/pages/SplashPage.tsx                                │
│   └─ Dependencies: All Block 0-2 components finalized               │
│   └─ Risk: HIGH (entirely custom page)                              │
│   └─ Validation: Side-by-side visual comparison                     │
│   └─ Compliance: Repository Adoption → +1 page                      │
│                                                                     │
│ Phase 3c: User/Error Page Migration                                 │
│   └─ Fix: SubAdminStudents (use ErrorContainer, EmptyState)         │
│   └─ Fix: UserLeaderboard (use ProgressBar)                         │
│   └─ Fix: Unauthorized (use PageTransition)                         │
│   └─ Files: 3 files                                                 │
│   └─ Dependencies: All Block 0-2 components finalized               │
│   └─ Risk: LOW                                                      │
│   └─ Validation: Per-page visual check                              │
│   └─ Compliance: Repository Adoption → +3 pages                     │
├─────────────────────────────────────────────────────────────────────┤
│ BLOCK 4 — Feedback & Form Migration (behavior change)               │
├─────────────────────────────────────────────────────────────────────┤
│ Phase 4a: Replace Success Toasts with Dialogs                       │
│   └─ Replace showSuccess calls with SuccessDialog across 11 files   │
│   └─ Retain: clipboard copies, login/signup success, error toasts   │
│   └─ Files: 11 feature hooks and pages (T1-T11)                     │
│   └─ Dependencies: Phase 2b (SuccessDialog)                         │
│   └─ Risk: MEDIUM (UX behavior change — requires explicit OK)       │
│   └─ Validation: Success scenarios show dialog instead of toast     │
│   └─ Compliance: Feedback → 100%                                    │
│                                                                     │
│ Phase 4b: Standardize Form Validation                               │
│   └─ Replace toast validation errors with inline FormField errors   │
│   └─ Migrate UpdatePasswordPage to react-hook-form + zodResolver    │
│   └─ Migrate FinishSignInPage to react-hook-form + zodResolver      │
│   └─ Files: 7 files                                                 │
│   └─ Dependencies: Phase 1d (form states), Phase 2a (FormField)     │
│   └─ Risk: HIGH (form behavior change; validation flow changes)     │
│   └─ Validation: Validation errors appear inline; no toast errors   │
│   └─ Compliance: Forms → 100%, Repository Adoption → +2 pages      │
├─────────────────────────────────────────────────────────────────────┤
│ BLOCK 5 — Arbitrary Value Cleanup (by directory, independent)       │
├─────────────────────────────────────────────────────────────────────┤
│ Phase 5a: Reusable Components Arbitrary Cleanup                     │
│   └─ Replace 168 arbitrary values in canonical components           │
│   └─ Files: ~25 files in src/components/common/                     │
│   └─ Dependencies: Phase 0a (tokens registered)                     │
│   └─ Risk: MEDIUM (classname changes affect all consumers)          │
│   └─ Validation: All components visually verified                   │
│   └─ Completion: 0 arbitrary values in src/components/common/       │
│                                                                     │
│ Phase 5b: Authentication Pages Cleanup                              │
│   └─ Replace arbitrary values in auth pages (102 values)            │
│   └─ Files: 7 auth page files                                       │
│   └─ Dependencies: Phase 0a                                         │
│   └─ Risk: LOW                                                      │
│   └─ Completion: 0 arbitrary values in auth pages                   │
│                                                                     │
│ Phase 5c: User Pages Cleanup                                        │
│   └─ Replace arbitrary values in user domain ( ~150 values)         │
│   └─ Files: ~25 files in src/pages/user/ + src/components/user/     │
│   └─ Dependencies: Phase 0a                                         │
│   └─ Risk: LOW                                                      │
│   └─ Completion: 0 arbitrary values in user domain                  │
│                                                                     │
│ Phase 5d: Sub-Admin Pages Cleanup                                   │
│   └─ Replace arbitrary values in sub-admin domain (~60 values)      │
│   └─ Files: ~15 files in src/pages/sub-admin/ + components/         │
│   └─ Dependencies: Phase 0a                                         │
│   └─ Risk: LOW                                                      │
│   └─ Completion: 0 arbitrary values in sub-admin domain             │
│                                                                     │
│ Phase 5e: Admin Pages Cleanup                                       │
│   └─ Replace arbitrary values in admin domain (~150 values)         │
│   └─ Files: ~40 files in src/pages/admin/ + src/components/admin/   │
│   └─ Dependencies: Phase 0a                                         │
│   └─ Risk: LOW                                                      │
│   └─ Completion: 0 arbitrary values in admin domain                 │
│                                                                     │
│ Phase 5f: Shared Utilities Cleanup                                  │
│   └─ Replace arbitrary values in hooks/layouts/styles (~24 values)  │
│   └─ Files: ~10 files                                               │
│   └─ Dependencies: Phase 0a                                         │
│   └─ Risk: LOW                                                      │
│   └─ Completion: 0 arbitrary values in utilities                    │
├─────────────────────────────────────────────────────────────────────┤
│ BLOCK 6 — Token & Dead Code Cleanup (post-migration)                │
├─────────────────────────────────────────────────────────────────────┤
│ Phase 6a: Remove Dead Spacing Export                                │
│   └─ Remove unused `spacing` object from AntigravityTypography.tsx  │
│   └─ Files: src/components/common/AntigravityTypography.tsx         │
│   └─ Dependencies: None                                             │
│   └─ Risk: LOW (confirmed unused via grep)                          │
│   └─ Validation: npx tsc --noEmit; grep shows zero consumers       │
│                                                                     │
│ Phase 6b: Remove Dead Design Tokens                                 │
│   └─ Remove unused Foundation 4.6A surface/elevation tokens         │
│   └─ Remove unused component tokens (dropdown, btn-secondary, etc.) │
│   └─ Files: src/styles/themes.css, src/index.css                    │
│   └─ Dependencies: None                                             │
│   └─ Risk: LOW (tokens confirmed unused via grep)                   │
│   └─ Validation: grep for each removed token — zero references      │
├─────────────────────────────────────────────────────────────────────┤
│ BLOCK 7 — Final Validation and Certification                        │
├─────────────────────────────────────────────────────────────────────┤
│ Phase 7a: Validation Sprint                                         │
│   └─ npx tsc --noEmit (zero errors)                                 │
│   └─ Check all 12 validation criteria from DS spec §13              │
│   └─ Check all 12 prohibited patterns (zero occurrence)             │
│   └─ Visual regression test across all 36 baseline pages            │
│   └─ Compliance: All categories at 100%                             │
│                                                                     │
│ Phase 7b: Design System Certification Report                        │
│   └─ Generate DESIGN_SYSTEM_CERTIFICATION.md                        │
│   └─ Contents: Executive Summary, Audit Summary, Component          │
│      Inventory, Token Inventory, Migration Report, Validation       │
│      Report, Remaining Observations, Freeze Decisions               │
│   └─ All certified features added to Freeze Protection table        │
└─────────────────────────────────────────────────────────────────────┘
```

### F.2 Implementation Sequence Overview

```
Phase 0a ─── Tokens ───────────────────────────────── 1 commit
Phase 1a ─── Typography ────────────────────────────── 1 commit
Phase 1b ─── Button ────────────────────────────────── 1 commit
Phase 1c ─── Card ──────────────────────────────────── 1 commit
Phase 1d ─── Form Elements ─────────────────────────── 1 commit
Phase 2a ─── FormField ─────────────────────────────── 1 commit
Phase 2b ─── Feedback Dialogs ──────────────────────── 1 commit
Phase 3a ─── Auth Pages ────────────────────────────── 2-3 commits
Phase 3b ─── SplashPage ────────────────────────────── 1 commit
Phase 3c ─── User Pages ────────────────────────────── 1 commit
Phase 4a ─── Toast → Dialog ────────────────────────── 2-3 commits
Phase 4b ─── Form Validation ───────────────────────── 2-3 commits
Phase 5a ─── Common Cleanup ────────────────────────── 1-2 commits
Phase 5b ─── Auth Cleanup ──────────────────────────── 1 commit
Phase 5c ─── User Cleanup ──────────────────────────── 1-2 commits
Phase 5d ─── Sub-Admin Cleanup ─────────────────────── 1 commit
Phase 5e ─── Admin Cleanup ─────────────────────────── 2 commits
Phase 5f ─── Utilities Cleanup ─────────────────────── 1 commit
Phase 6a ─── Dead Code ─────────────────────────────── 1 commit
Phase 6b ─── Dead Tokens ───────────────────────────── 1 commit
Phase 7a ─── Validation ────────────────────────────── 1 commit
Phase 7b ─── Certification ─────────────────────────── 1 commit

Total: ~25-30 implementation commits
```

### F.3 Commit Grouping Strategy

| Group | Commits | Can Parallelize? | Rationale |
|---|---|---|---|
| Phase 0a | 1 | No (foundation) | Tokens must come first |
| Phase 1a-1c | 3 | Yes (no cross-deps) | Typography, Button, Card are independent |
| Phase 1d | 1 | No (single file) | All form elements in one file |
| Phase 2a-2b | 2 | Yes (new components) | No existing code depends on them |
| Phase 3a-3c | 4-5 | No (sequential) | Pages depend on finalized components |
| Phase 4a-4b | 4-6 | No (sequential) | Feedback then validation |
| Phase 5a-5f | 6-9 | Yes (by directory) | Independent file groups |
| Phase 6a-6b | 2 | Yes (independent) | Dead code vs dead tokens |
| Phase 7a-7b | 2 | No (final) | Must be sequential |

**Parallel execution** is permitted across groups marked "Yes" above, but each individual commit must still follow Safety Rules R1-R3.

### F.4 Compliance Score Progression

```
After Phase 0a:  Design Tokens → 100%
After Phase 1a:  Typography → 85%  (dead code removal pending)
After Phase 1b:  Buttons → 100%
After Phase 1c:  Cards → 100%
After Phase 1d:  Forms → 90%       (FormField pending, migration pending)
After Phase 2a:  Forms → 95%       (FormField exists)
After Phase 2b:  Dialogs → 100%, Feedback → 80% (migration pending)
After Phase 3a:  Repository Adoption → 69%→86% (auth pages fixed)
After Phase 3b:  Repository Adoption → 86%→89%
After Phase 3c:  Repository Adoption → 89%→92%
After Phase 4a:  Feedback → 100%
After Phase 4b:  Forms → 100%, Repository Adoption → 92%→97%
After Phase 5a-5f: Spacing → 100%, Animation → 100% (arbitrary values eliminated)
After Phase 6a:  Typography → 100% (dead code removed)
After Phase 6b:  Design Tokens → 100% (dead tokens removed)
After Phase 7a:  Accessibility → 100%, ALL → 100%
After Phase 7b:  All components → 100%, Repository Adoption → 100%
```

---

## Future Repository Modernization

The following tasks are **NOT part of the Design System project**. They are
moved out of the Design System roadmap into a separate backlog for future
planning. These tasks will NOT be executed during Design System migration.

### FM.1 Service Architecture Redesign
- Standardize all services to `ServiceResult<T>` pattern
- Add centralized error interceptor
- Unify error handling across all 17 services

### FM.2 Repository Architecture Refactoring
- Fix `useBreakpoint` `getBreakpoint()` vs `useEffect` listener mismatch
- Remove unused `captureUnknownError`, `captureValidationError`, `captureAuthenticationError`, `captureAuthorizationError` helpers from `usePageError.ts`
- Remove unused `makeHelper` function from `usePageError.ts`
- Remove unused `ErrorContainerVariant` export from `error.types.ts`
- Remove duplicate elevation token system (Foundation 4.6A)

### FM.3 Infrastructure Modernization
- Performance architecture changes
- State management improvements
- Data fetching layer optimization

### FM.4 Feature Improvements
- Repository-wide business logic improvements
- Feature additions (future)
- Navigation changes (future)

These tasks have been removed from the Design System roadmap to ensure the
Design System project remains focused only on:
- Reusable Components
- Design Tokens
- Typography
- Spacing
- Forms
- Dialogs
- Buttons
- Cards
- Accessibility
- Feedback
- Animation
- Layouts
- Visual consistency

---

## Migration Readiness Gate

### M.1 Gate Definition

Before EVERY implementation phase, a formal Readiness Gate must be passed.

The gate ensures all preconditions are satisfied before any code changes begin.

### M.2 Gate Checklist

```
┌──────────────────────────────────────────────────────────────┐
│        MIGRATION READINESS GATE — Phase <N>                   │
├──────────────────────────────────────────────────────────────┤
│ Condition                                    Status         │
│ ──────────────────────────────────────────────────────────── │
│ 1. Repository Impact Report completed        □ Pass / □ Fail│
│ 2. All dependencies satisfied                □ Pass / □ Fail│
│ 3. Previous phase certified                  □ Pass / □ Fail│
│ 4. Zero TypeScript errors (current)         □ Pass / □ Fail│
│ 5. Visual baseline available                 □ Pass / □ Fail│
│ 6. Rollback plan prepared                    □ Pass / □ Fail│
│ 7. Validation checklist prepared             □ Pass / □ Fail│
│ 8. Freeze Protection policy verified         □ Pass / □ Fail│
├──────────────────────────────────────────────────────────────┤
│ GATE RESULT: □ APPROVED / □ BLOCKED                            │
│ BLOCKER: <if blocked, describe why>                            │
└──────────────────────────────────────────────────────────────┘
```

### M.3 Gate Enforcement

- If ALL conditions pass: Implementation may begin
- If ANY condition fails: Implementation is BLOCKED
- The blocker must be resolved before re-submitting the gate
- The gate must be re-verified after blocker resolution
- Only the phase author (AI) and reviewer (user) can approve the gate

### M.4 Phase 0a Exemption

Phase 0a (Design Token Additions) is exempt from:
- Condition 3 (Previous phase certified) — it is the first phase
- Condition 5 (Visual baseline available) — baseline is captured during Phase 0a

All other conditions still apply.

---

## Final Blueprint Validation

### V.1 Validation Checklist

The Implementation Blueprint has been reviewed against the following criteria:

| Criterion | Status | Notes |
|---|---|---|
| Safe migration order | ✅ | Bottom-up dependency graph; foundation→atomics→composites→pages→cleanup |
| Dependency correctness | ✅ | Validated via exhaustive grep of import statements; no cycles found |
| Rollback safety | ✅ | Every phase has revert procedure; rollback > fix-forward |
| Freeze protection | ✅ | Features 27 & 28 frozen; policy defines allowed/forbidden changes; all phases checked |
| Repository impact reporting | ✅ | Template defined; mandatory before every phase |
| Visual regression strategy | ✅ | 36-page baseline defined; per-phase comparison protocol |
| Compliance scoring | ✅ | 11 categories with measurable metrics; report after every phase |
| Implementation sequencing | ✅ | 22 phases across 7 blocks; parallelization where safe |
| Risk management | ✅ | Each phase has risk level; HIGH-risk phases have enhanced validation |
| Certification workflow | ✅ | Validation Sprint + Certification Report |
| Non-DS work removed | ✅ | 4 categories moved to Future Repository Modernization |
| Large phases split | ✅ | Original monolithic Phase 4a split into 6 directory-specific phases (5a-5f) |
| Migration Readiness Gate | ✅ | 8-condition gate before every phase; blocker resolution process |
| Repository-wide scope | ✅ | All 36 pages catalogued; all 53 components assessed; all 654 arbitrary values mapped |

### V.2 Certification

```
┌──────────────────────────────────────────────────────────────┐
│            IMPLEMENTATION BLUEPRINT — CERTIFICATION           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   This Implementation Blueprint has been validated and        │
│   certified as the official migration guide for the           │
│   PrepareForU Golden Reference Design System.                 │
│                                                              │
│   Status: ✅ GOLDEN REFERENCE CERTIFIED                       │
│   Version: 1.0                                                │
│   Date:    2026-07-30                                         │
│                                                              │
│   The blueprint defines 22 implementation phases across       │
│   7 blocks, with 36 baseline pages, 11 compliance metrics,   │
│   16 safety rules, and a formal Migration Readiness Gate.    │
│                                                              │
│   No source code changes may begin until Phase 0a is          │
│   individually approved through the Migration Readiness       │
│   Gate process.                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Appendix: Quick-Reference Tables

### A. Component Finalization Status

| Component | Status | Phase | Notes |
|---|---|---|---|
| Spinner | ✅ Final | — | No changes needed |
| StatCard | ✅ Final | — | No changes needed |
| AdminModal | ✅ Final | — | No changes needed |
| ConfirmModal | ✅ Final | — | No changes needed |
| Tabs | ✅ Final | — | No changes needed |
| Badge | ✅ Final | — | No changes needed |
| ProgressBar | ✅ Final | — | No changes needed |
| DataGrid | ✅ Final | — | No changes needed |
| DataTable | ✅ Final | — | No changes needed |
| LoadingSkeleton | ✅ Final | — | No changes needed |
| GridSkeleton | ✅ Final | — | No changes needed |
| StatSkeleton | ✅ Final | — | No changes needed |
| EmptyState | ✅ Final | — | No changes needed |
| ErrorState | ✅ Final | — | No changes needed |
| Pagination | ✅ Final | — | No changes needed |
| IconBadge | ✅ Final | — | No changes needed |
| Menu | ✅ Final | — | No changes needed |
| Navigation | ✅ Final | — | No changes needed |
| RetryButton | ✅ Final | — | No changes needed |
| LoadingOverlay | ✅ Final | — | No changes needed |
| PageTransition | ✅ Final | — | No changes needed |
| SectionReveal | ✅ Final | — | No changes needed |
| useStableFetch | ✅ Final | — | No changes needed |
| useAsyncOperation | ✅ Final | — | No changes needed |
| H1/H2/H3/Body/Label | 🔄 Update | Phase 1a | Align sizes with CSS tokens |
| Button/IconButton | 🔄 Update | Phase 1b | Replace arbitrary values with tokens |
| Card | 🔄 Update | Phase 1c | Replace auth-light radius with token |
| Input/TextArea/Select | 🔄 Update | Phase 1d | Add error/success/loading/required/optional/helperText |
| Switch/Checkbox/Radio | 🔄 Update | Phase 1d | Add error/success/loading/required/optional/helperText |
| useToast | ➕ Extend | Phase 2c | Add showWarning, showInfo |
| FormField | 🆕 New | Phase 2a | Create wrapper component |
| SuccessDialog | 🆕 New | Phase 2b | Create feedback dialog |
| ErrorDialog | 🆕 New | Phase 2b | Create feedback dialog |
| WarningDialog | 🆕 New | Phase 2b | Create feedback dialog |
| InfoDialog | 🆕 New | Phase 2b | Create feedback dialog |
| Design Tokens | ➕ Extend | Phase 0a | Register new radius tokens |

### B. Files Never to Modify

| File | Reason |
|---|---|
| `src/pages/admin/AdminSettings.tsx` | Feature 28 — frozen |
| `src/pages/sub-admin/SubAdminSettings.tsx` | Feature 27 — frozen |
| `src/components/admin/settings/AddExamModal.tsx` | Feature 28 — frozen |
| `src/components/admin/settings/ExamParamsForm.tsx` | Feature 28 — frozen |
| `src/components/admin/settings/SubjectCardItem.tsx` | Feature 28 — frozen |
| `src/components/admin/settings/SubjectDistributionPanel.tsx` | Feature 28 — frozen |
| `src/components/admin/settings/SettingsCard.tsx` | Feature 28 — frozen |
| `src/components/admin/settings/useAdminSettings.ts` | Feature 28 — frozen |
| `src/components/sub-admin/settings/useSettings.ts` | Feature 27 — frozen |
| `src/App.tsx` | Router — no changes |
| `src/context/AuthContext.tsx` | Core infrastructure — no changes |
| `src/context/ThemeContext.tsx` | Core infrastructure — no changes |
| `src/context/LanguageContext.tsx` | Core infrastructure — no changes |
| `src/services/*` | Service layer — no changes (Future Modernization) |
| `src/lib/repositories/*` | Data access — no changes (Future Modernization) |

### C. Compliance Score Targets

| Category | Current | Phase 0a | Phase 1a-2b | Phase 3a-3c | Phase 4a-4b | Phase 5a-5f | Phase 6a-6b | Phase 7a-7b |
|---|---|---|---|---|---|---|---|---|
| Design Tokens | ~80% | **100%** | 100% | 100% | 100% | 100% | 100% | 100% |
| Typography | ~70% | 70% | **85%** | 85% | 85% | 85% | **100%** | 100% |
| Buttons | ~80% | 80% | **100%** | 100% | 100% | 100% | 100% | 100% |
| Cards | ~80% | 80% | **100%** | 100% | 100% | 100% | 100% | 100% |
| Forms | ~20% | 20% | **95%** | 95% | **100%** | 100% | 100% | 100% |
| Dialogs | ~90% | 90% | **100%** | 100% | 100% | 100% | 100% | 100% |
| Spacing | ~70% | 70% | 70% | 70% | 70% | **100%** | 100% | 100% |
| Feedback | ~30% | 30% | **80%** | 80% | **100%** | 100% | 100% | 100% |
| Accessibility | ~70% | 70% | 75% | 85% | 90% | 95% | 95% | **100%** |
| Animation | ~80% | 80% | 85% | 90% | 90% | **100%** | 100% | 100% |
| Adoption | ~69% | 69% | 69% | **92%** | **97%** | 97% | 97% | **100%** |

---

*This blueprint is the complete, certified planning document for the Golden
Reference Design System migration. Version 1.0 — Golden Reference Certified.*

*Reference: GOLDEN_REFERENCE_DESIGN_SYSTEM.md*

*No source code changes may begin until Phase 0a is individually approved
through the Migration Readiness Gate process.*

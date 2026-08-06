# Phase 5.4 — Visual Language Unification Audit

**Status:** ⏳ AWAITING APPROVAL (approval gate — no implementation until approved)
**Audit date:** 2026-08-06
**Owner:** Foundation (FOUNDATION_GOVERNANCE.md v1.18.0)
**Sibling docs:** `SURFACE_LANGUAGE_SPECIFICATION.md`, `BUTTON_LANGUAGE_SPECIFICATION.md`,
`TYPOGRAPHY_LANGUAGE_SPECIFICATION.md`, `HOVER_LANGUAGE_SPECIFICATION.md`,
`PILL_LANGUAGE_SPECIFICATION.md`, `SKELETON_LANGUAGE_SPECIFICATION.md`,
`MOTION_LANGUAGE_SPECIFICATION.md`, `FOUNDATION_VISUAL_MIGRATION_PLAN.md`,
`FOUNDATION_VISUAL_CERTIFICATION.md`

---

## 0. Objective

Unify the application's visual language into **ONE permanent, certified visual language**
originating entirely from the Foundation token system. This audit records the current state of
every visual surface (surfaces, buttons, typography, hover/transition language, pills/badges,
skeletons) across all three product surfaces — **User Panel, Authentication, Admin** — and is the
input to the six language specifications and the migration plan.

**Acceptance criteria (per the workflow):**
- One visual language, one implementation, zero divergence between surfaces.
- No hardcoded/arbitrary Tailwind colors; no inline styles; no page-specific styling.
- No temporary styles, no local overrides of certified components.
- No mutation of frozen variants. No second visual language. No page exceptions.

---

## 1. Scope & method

**Audited (reads + greps):**
- `src/styles/themes.css` — full token system (Layers 1–3, dark default + `.light` overrides,
  management namespace, Premium Light Material, navigation/header/sidebar/button/card tokens).
- `src/components/common/` — `AntigravityButton`, `AntigravityCard`, `AntigravityData` (Tabs/
  Badge/ProgressBar/MetricBlock/DataGrid), `AntigravityForm`, `SharedComponents` (skeletons),
  `AdminText`, `AdminIconWrap`, `Navigation`, `Pagination`, `Menu`, `CollectionCard`,
  `CollectionFilter`, `CollectionHeader`, `SegmentedFilter`, `AdminFilterBar`,
  `PremiumIconContainer`, `IconBadge`, `PremiumSelect`, `AdminModal`, `BulkActionBar`.
- `src/layouts/SidebarLayout.tsx`, `src/config/navigation.ts`.
- All 8 admin pages + `src/components/admin/**` (users, questions, topics, settings,
  leaderboard, sub-admins, upload, overview, common).
- User dashboard: `UserDashboard.tsx`, `DashboardStatsGrid.tsx`, `DashboardRecentActivity.tsx`,
  `useUserDashboard.ts`, `TopicCard`, `TopicReader`, `TeacherExamCard`, `LeaderboardComponents`,
  `LeaderboardTopCard`, `PerformanceAnalyticsSection`, `CarouselDots`, `MethodSelectionView`,
  `QuestionCard`, `PremiumLoader`.

**Grep sweeps performed:**
| # | Pattern | Result |
|---|---|---|
| 1 | `hover:` + shadow/translate/scale/rotate/transition (all `src/**/*.tsx`) | **48 matches** (specimen captured, see HOVER spec) |
| 2 | `transition-*` in `src/components/user/**` | **17 matches** |
| 3 | Raw arbitrary colors `text-[#…]`/`bg-[#…]`/`border-[#…]` (all `src`) | **3 matches**, all in `src/components/PremiumLoader.tsx` |
| 4 | Raw arbitrary text sizes `text-[9px]`–`text-[13px]` in `src/components/admin/**` | **77 matches** (micro-typography, on certified scale — see §5) |
| 5 | `.ancient-*` class usage (all `src`) | **28 matches** (sidebar, header, input family, icon badge, 3d-lift + test files ds003/ds007/ds014) |
| 6 | `bg-white`/`bg-white/…` usage | Scattered, token-adjacent (documented in Surface spec) |
| 7 | `isDark` ternaries in admin components | `BulkActionBar`, `AdminIconWrap`, `Navigation`/`SidebarLayout` (documented) |

---

## 2. Executive findings

1. **The Foundation is the single source of truth and is healthy.** Three-layer architecture
   (primitives → semantic → component), dark theme = default `:root`, light = `.light` override
   (`@custom-variant light`). Management namespace (Phase 3.9 / D-144) is additive and consumes
   only `--management-*`. No Layer 1 → UI bypass observed in certified components.
2. **Two coherent material families already exist and are the design intent:**
   - **Premium family (default):** the "ancient" forest/gold material — StatCard gold gradient,
     tab pill gold, `ancient-sidebar`/`ancient-header`, `.ancient-*` input/icon/lift classes,
     premium Card carved shadow, gold-300 edges. Certified in dark (baseline) and light.
   - **Management family (additive opt-in):** neutral slate/white material with app accent,
     `variant="management"` / `management` prop, `--management-*` tokens. Certified in dark
     (reuses neutral dark tokens exactly) and light (explicit neutral hexes).
   - **These two are the ONE unified language** — the divergence problem is not "two languages"
     but *inconsistent adoption* of the management family across admin surfaces.
3. **Divergence is localized, not systemic.** The heavy lifting (Users module) is fully migrated.
   Remaining gaps: Questions, Overview, Topics/Settings/Leaderboard tooling components, and the
   user-side premium surfaces that still use legacy tokens or theme-branching.
4. **Only 3 raw-hex violations in the entire app** (`PremiumLoader.tsx`) — a trivial, contained fix.
5. **Hover/transition language has real inconsistencies** (scale vs translate vs shadow-only,
   duration 150/200/300/500ms, `transition-all` vs scoped transitions) — see HOVER spec.
6. **Typography is largely token-correct** but uses arbitrary `text-[9px]…[13px]` micro-type
   heavily in admin (77 matches) and has a low-contrast `text-hint` (#9CA3AF light / #6B7280 dark)
   and 9px type on muted tokens — see TYPOGRAPHY spec.
7. **Skeletons are duplicated in pattern but not in component** — a shared skeleton family exists
   (`SharedComponents`) but admin surfaces re-implement inline; the management variant is
   half-adopted (`MANAGEMENT_SKELETON_*` exists in `SharedComponents` but is not used
   consistently). Dark-mode skeleton colors diverge on Admin Questions/Users (see SKELETON spec).
8. **Elevation is not yet a single system** — cards/panels mix `--elevation-1..4`,
   `--shadow-*`, `--card-*`, `--management-*`, and carved/3D shadows. The surface spec defines
   the 4-level elevation ladder (L0 flat → L1 card → L2 hover → L3 modal).
9. **Pills/badges are certified but drifted from their tests.** `Badge` renders
   `bg-*/15 text-* border-*/30`; the ds005 runtime test asserts `bg-*/10 text-*` (no border).
   Input renders token-mapped `bg-input-bg border-input-border … text-input-text`; the ds003 test
   asserts the pre-D-121 class names. See §8.3 verification baseline — test triage required.
10. **Verification baseline is GREEN for TypeScript/Build, PRE-EXISTING for ESLint and runtime
    audit tests.** `npx tsc -b` exit 0; `npm run build` exit 0 (chunk notices only). ESLint:
    397 pre-existing problems in non-visual code. Runtime audit: 33 pre-existing failures
    (ds003/ds005/ds014) — all class-name drift between stale tests and certified renders.
    See §8.3.

---

## 3. Adoption matrix (who uses which family today)

| Surface | Default render | Management opt-in? | Status |
|---|---|---|---|
| Admin Users (`AdminUsers`, `UsersToolbar`, `UsersTable`, `UsersActions`, `UserMobileCard`, `GridSkeleton`) | management | Yes — **full** | ✅ Migrated |
| Admin Questions (`AdminQuestions`, `QuestionsActions`, `QuestionsTable`, modals, form) | premium default | **No** | ⚠️ Migration target |
| Admin Overview (`AdminOverview`, `StatsGrid`, `DailyAttemptsChart`) | premium-neutral card | No | ⚠️ Partial target |
| Admin Topics (`AdminTopics`, `TopicsToolbar`, `TopicListItem`, `ParsedPreview`, preview renderer) | premium default | No | ⚠️ Partial target |
| Admin Settings (`AdminSettings`, `SubjectCardItem`, `SubjectDistributionPanel`, `AddExamModal`, `ExamParamsForm`) | premium default | No | ⚠️ Partial target |
| Admin Leaderboard (`AdminLeaderboard`, `LeaderboardView`, `RankBadge`, `LeaderboardTablet/MobileCard`) | premium default | No | ⚠️ Partial target |
| Admin Upload (`AdminUpload`, `MethodSelectionView`, `UploadContextPanel`) | premium default | No | ⚠️ Partial target |
| Admin Sub-Admins (`AdminSubAdmins`, `SubAdminMobileCard`, subadmin table) | premium default | No | ⚠️ Verify |
| User dashboard (`UserDashboard`, stats, recent activity) | premium | N/A | ✅ Reference |
| Authentication (auth pages/cards) | premium (forest gradient) | N/A | ✅ Reference |

---

## 4. Token truth table (captured, frozen)

### 4.1 Light semantic core (`themes.css` `.light`, lines 427+)
| Token | Value | Use |
|---|---|---|
| `--bg-app` | `#F8FAFC` | canvas |
| `--bg-surface` | `#FFFFFF` | primary surface |
| `--bg-elevated` | `#F1F5F9` | secondary/floating |
| `--bg-hover` | `#F1F5F9` | interactive/hover |
| `--bg-active` | `#E2E8F0` | active |
| `--text-primary` | `#111827` | body |
| `--text-secondary` | `#4B5563` | secondary |
| `--text-muted` | `#6B7280` | metadata |
| `--text-hint` | `#9CA3AF` | hint/placeholder |
| `--border-default`/`--border-subtle` | `#E2E8F0` | default borders |
| `--border-hover` | `#94A3B8` | hover border |
| `--color-accent` | `#166534` | brand accent (forest green) |
| `--color-secondary` | `#C8960C` | gold accent |
| `--color-secondary-light` | `#D4A84B` | gold bright (ancient remap) |

### 4.2 Dark semantic core (`:root`, lines 196+)
| Token | Value |
|---|---|
| `--bg-app` | `#111827` |
| `--bg-surface` | `#1F2937` |
| `--bg-elevated` | `#374151` |
| `--text-primary` | `#F9FAFB` |
| `--text-secondary` | `#D1D5DB` |
| `--text-muted` | `#9CA3AF` |
| `--text-hint` | `#6B7280` |
| `--border-subtle` | `#374151` |
| `--color-accent` | `#3B82F6` |

### 4.3 Management family (light) — exact block, `themes.css` lines 939–949
| Token | Value |
|---|---|
| `--management-surface` | `#FFFFFF` |
| `--management-surface-muted` | `#F8FAFC` |
| `--management-surface-hover` | `#F1F5F9` |
| `--management-surface-active` | `var(--bg-accent-subtle)` |
| `--management-border` | `#E2E8F0` |
| `--management-border-strong` | `#CBD5E1` |
| `--management-border-hover` | `#94A3B8` |
| `--management-border-active` | `var(--color-accent)` |
| `--management-shadow` | `0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)` |
| `--management-shadow-hover` | `0 2px 4px rgba(15,23,42,0.06), 0 8px 16px -4px rgba(15,23,42,0.10)` |
| `--management-accent` | `var(--color-accent)` |

> ⚠ **Design note for the Surface spec:** the management light surface is **pure `#FFFFFF`** and
> the light theme's admin look reads slightly heavy/dark relative to the brief. The task requires
> the unified admin surface to be **brighter, cleaner, modern, neutral — explicitly NOT white,
> NOT parchment/amber/yellow/cream/brown**, with dark mode **pixel-identical**. The Surface spec
> proposes relighting the light management ladder (page surface + primary + muted) off pure white
> to a neutral light-slate scale. See `SURFACE_LANGUAGE_SPECIFICATION.md` §4.

### 4.4 Ancient/premium material (light) — `.ancient-*` classes
| Class | Location | Material |
|---|---|---|
| `ancient-sidebar` | `Navigation.Shell` (Navigation.tsx:120), mobile drawer (SidebarLayout.tsx:198) | forest gradient + gold edge (light) |
| `ancient-header` | SidebarLayout.tsx:267 (light) | forest gradient header |
| `ancient-input` / `ancient-textarea` / `ancient-select` | AntigravityForm.tsx (excluded when `management`) | gold-framed fields |
| `ancient-icon-badge` | AdminIconWrap.tsx:34 (light) | gold-bordered icon badge |
| `ancient-3d-lift` | SubjectCardItem.tsx:24 | 3D lift card |
| `ancient-nav-item-active` | Navigation.tsx:182 (light active) | gold active nav item |
| `ancient-overlay`, `ancient-textarea`, `ancient-icon-badge` | runtime audit tests ds007/ds003/ds014 | regression coverage |

---

## 5. Micro-typography inventory (admin arbitrary sizes, 77 matches)

Captured from `src/components/admin/**`:
- `text-[9px]` — `LeaderboardMobileCard`, `AIToolCards`, `QuestionForm` (labels/hints),
  `PreviewTab` stat label, `BulkActionBar` counter, `SubjectCardItem` badge,
  `AdminTopicPreviewRenderer` tag pill, `SingleQuestionModal`.
- `text-[10px]` — dominant micro-type: `LeaderboardView` (headers + cells), `LeaderboardTabletCard`,
  `InstructionsTab`, `UploadContextPanel` badge, `QuestionForm`, `QuestionsTable`,
  `TopicListItem`, `ParsedPreview`, `AdminTopicPreviewRenderer`, `LangInputPanel`,
  `UploadProgressOverlay`, `SubjectDistributionPanel`, `AddExamModal`, `SidebarLayout`.
- `text-[11px]` — `LeaderboardView` accuracy, `InstructionsTab`, `JsonTab`, `QuestionForm`,
  `QuestionsTable`, `ParsedPreview`, `LangInputPanel`.
- `text-[12px]` / `text-[13px]` — `SubjectDistributionPanel`, `QuestionForm` flags,
  `AdminTopicPreviewRenderer` body, `MetricBlock` value.

> All sizes align with the certified User Panel micro-typography scale (Phase 3.1 §1 precedent).
> These are NOT violations; they are the canonical micro-scale. The spec formalizes them into a
> named scale (see TYPOGRAPHY spec §4) instead of arbitrary values.

---

## 6. The "management" gap (the core divergence)

The Phase 3.9 / D-144 management family was designed as the unified **admin tooling surface**.
Current adoption:

**Migrated (reference implementation):** Admin Users.
- `CollectionToolbar`/`Input`/`CollectionFilter` → `management`
- `UsersTable` → `GridSkeleton` + `CollectionCard` management
- `AdminUsers` page composes all management.

**Not migrated:** Admin Questions (largest), Overview chart panel (still premium-neutral),
Topics, Settings, Leaderboard, Upload, Sub-Admins — all still render the premium family or a mix.

**Theme-branched (candidates for unification):**
- `BulkActionBar.tsx` — `isDark ? 'bg-card-bg …' : 'bg-[var(--management-surface)] …'`
- `AdminIconWrap.tsx` — `!isDark ? 'ancient-icon-badge' : 'bg-primary/10 text-primary'`
- `Navigation.Shell`/`SidebarLayout` — `!isDark ? 'ancient-sidebar'/'ancient-header' : 'bg-sidebar …'`
- `IconButton variant="theme"` — separate light/dark strings (certified D-123).

---

## 7. Hardcoded color findings

### 7.1 Raw hex (must fix)
All 3 in `src/components/PremiumLoader.tsx`:
| Line | Class | Severity |
|---|---|---|
| 8 | `border-[#2c4c3b]/20` | Violation |
| 12 | `bg-[#2c4c3b]` | Violation |
| 13 | `bg-[#f4ebd8]` | Violation |

Remediation: map to existing tokens — `bg-[#2c4c3b]` → `bg-primary`/`bg-accent` family,
`#f4ebd8` → a neutral surface token (`bg-elevated`/`bg-hover` equivalent). Confirm runtime
tests (ds*) still pass.

### 7.2 Recharts / chart-exempt (documented, not violations)
`DailyAttemptsChart.tsx` tooltip shadow, `SubjectPieChart.tsx` COLORS + tooltip — chart-specific
exemption established in Phase 3.1 Module 1. Containers are certified.

### 7.3 `var(--primary-rgb)` token usage
`SubjectCardItem.tsx` selected-state shadow `shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]` —
token-backed, allowed. Listed for review in migration (can move to a named shadow token).

---

## 8. Verification baseline (recorded 2026-08-06)

Run to establish the Phase 5.4 starting state (pre-implementation).

| Check | Command | Result | Notes |
|---|---|---|---|
| TypeScript | `npx tsc -b` | ✅ exit 0 | clean |
| Build | `npm run build` | ✅ exit 0 | only pre-existing chunk-size notices |
| ESLint | `npx eslint .` | ⚠️ 397 problems (344 E / 53 W) | **all pre-existing** in non-visual code (`utils/`, `validations/`, `supabase/`, tests) — baseline to compare against, not to fix in Phase 5.4 |
| Runtime audit | `npx vitest run -c vitest.audit.config.ts` | ⚠️ 33 failed / 301 passed (12 files) | 3 files fail: ds003, ds005, ds014 |

### 8.1 Runtime-audit drift (pre-existing, must be triaged before certification)

| Test | Failing assertions | Cause |
|---|---|---|
| ds003 (Input/TextArea/Select) | `renders with Foundation material` (DARK+LIGHT ×5), `exposes focus ring + is focusable` (×5), Select a11y gap, TextArea/Select DARK+LIGHT, consumer-override guard | Tests assert **pre-D-121 class names** (`bg-hover-bg border-border-subtle … text-text-primary`, `focus:border-primary`); the certified components now render **token-mapped classes** (`bg-input-bg border-input-border … text-input-text`, `focus:border-input-focus-border`). Values resolve to the same tokens (D-121 re-anchor) — tests are stale, components are certified |
| ds005 (Badge) | all 6 variants × DARK/LIGHT | Test asserts `bg-*/10 text-*`; Badge renders `bg-*/15 text-* border-*/30` (current certified recipe) — tests stale |
| ds014 (Avatar) | `square shape maps to rounded-lg`; `uses the ancient-icon-badge medallion in light` | Avatar renders `rounded-xl` for square; light medallion expectation outdated |

**Decision (governance, not implementation):** the components are the certified source of truth;
the runtime tests must be updated to assert the certified render during migration verification.
This is a recorded prerequisite, not a Phase 5.4 change.

---

## 8.2 Verified invariants (must not change)

- Business logic, routing, permissions, validation system, accessibility foundation — untouched.
- Certified component APIs — no prop removal/renaming.
- Frozen DS-001 Card, frozen navigation/header materials, frozen button base/recipes.
- `.light` management hexes (D-144) are certified values; any change requires a Design Decision +
  Freeze Register entry.
- Charts remain exempt at library level (Recharts palettes/tooltips).
- Dark theme rendering of management surfaces stays pixel-identical (dark reuses neutral tokens).

---

## 9. Component audit (Part 9 — duplicate recipes)

Sweep result: the duplication is **not** in the Foundation components (they are canonical) but in
**consumer-side re-implementations** of Foundation patterns. Full resolution lives in each
language spec; this table is the cross-reference.

| Duplicate | Where | Foundation source | Spec |
|---|---|---|---|
| Hover recipes (scale 105/110, translate, shadow-only, duration 150–500ms, `transition-all`) | Card/panel/icon consumers (MethodSelectionView, QuestionCard, TopicCard, TeacherExamCard, SubjectCardItem, PerformanceAnalyticsSection, LeaderboardView, AIToolCards) | `AntigravityCard` surface recipe, `Button`/`IconButton` motion | HOVER §3, §4 |
| Shadows (`--elevation-1..4`, `--shadow-*`, `--card-*`, `--management-*`, `shadow-card-premium`, carved/3D, `shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]`) | card/panel consumers + `SubjectCardItem` | elevation ladder (SURFACE §4.3) | SURFACE |
| Button recipes | raw `<button>` residue: AIToolCards CTAs, QuestionForm micro-buttons (documented retained, token-colored) | `AntigravityButton` | BUTTON §4 |
| Borders | inactive pills across Tabs/SegmentedFilter/CollectionFilter/SelectionContainer use differing border classes | Badge/Tabs pill recipes | PILL §2, §4 |
| Typography | `text-[9px…13px]` ×77 in admin; `text-hint` misuse; 9px-on-muted | canonical scale + contrast rules | TYPOGRAPHY |
| Radii | `rounded-[10px]/[12px]/[14px]/[16px]/[20px]/[24px]/[28px]/[32px]/[40px]/[2.5rem]` scattered | `--radius-control/container/card` | SURFACE §5 |
| Spacing | inline `p-*`/`gap-*` duplicates of `--space-*` scale (spacing scale frozen Phase 1b) | `--space-*` | SURFACE (governance) |
| Elevations | see shadows row | 4-level ladder | SURFACE §4.3 |
| Colors | only 3 raw hexes (PremiumLoader) + chart-exempt + `var(--primary-rgb)` | Layer 2 tokens | TYPOGRAPHY §5 |
| Skeletons | inline `animate-pulse` blocks (SK-2) vs `SharedComponents` family | skeleton family | SKELETON |

---

## 10. Consumer audit (Part 10 — pages not following the Foundation)

Documented only — **no migration in this phase.** Per-page divergence register.

### 10.1 Admin
| Page | Divergence | Severity |
|---|---|---|
| AdminQuestions + questions/* | premium-default family on management surface (toolbar/table/modals); skeleton family mismatch; retained micro-buttons | High |
| AdminOverview | chart panel `premium-neutral` (family decision); skeleton family | Medium |
| AdminTopics + topics/* | tooling surfaces premium-default; some raw elements already migrated in Phase 3.1 | Medium |
| AdminSettings + settings/* | `SubjectCardItem` shadow + `transition-all`; `AddExamModal` fine | Low |
| AdminLeaderboard + leaderboard/* | tooling cards premium-default; RankBadge tokenized | Low |
| AdminUpload + upload/* | `MethodSelectionView` `transition-all` + scale | Low |
| AdminSubAdmins | verify table family (GridSkeleton variant) | Low |
| AdminUsers + users/* | **Reference implementation** — fully management | ✅ |

### 10.2 User Panel
| Page | Divergence | Severity |
|---|---|---|
| UserDashboard / dashboard/* | certified premium reference | ✅ |
| UserPerformance / performance/* | `group-hover:scale-110 transition-transform duration-500` on icons (certified flourish) | ✅ |
| UserLeaderboard / leaderboard/* | row hover + avatar scale (certified) | ✅ |
| UserTopics / topics/* | `TopicCard` `transition-all` + `lg:group-hover:translate-x-1` | Low (H-5) |
| UserExams / full-exams | `TeacherExamCard` icon-badge `transition-all` | Low (H-6) |
| Exam pages | `QuestionCard` no-op translate hover (H-1) | Low |
| Loading surfaces | `PremiumLoader` raw hex (S-7) | High |

### 10.3 Authentication
| Page | Divergence | Severity |
|---|---|---|
| Login/Signup/Verify/etc. | premium forest gradient + auth card material; token-correct (Phase 3.1 auth migration) | ✅ |

---

## 11. Deliverables produced from this audit

1. `SURFACE_LANGUAGE_SPECIFICATION.md` — the ONE surface language + 7-level surface scale +
   4-level elevation ladder + management relight proposal.
2. `BUTTON_LANGUAGE_SPECIFICATION.md` — full button/icon-button recipe + semantic button roles.
3. `TYPOGRAPHY_LANGUAGE_SPECIFICATION.md` — canonical size scale, full text-role table, contrast
   ratios, `text-hint` finding, 9px-at-muted finding, font-role model.
4. `HOVER_LANGUAGE_SPECIFICATION.md` — unified hover/interaction channels + transition scale.
5. `PILL_LANGUAGE_SPECIFICATION.md` — unified pill/badge/selection language incl. inactive-pill
   border recipe.
6. `SKELETON_LANGUAGE_SPECIFICATION.md` — unified skeleton language (premium + management),
   light/dark skeleton palette.
7. `MOTION_LANGUAGE_SPECIFICATION.md` — one motion system (hover/pressed/focused/selected/
   loading/modal/drawer/dropdown/toast/tooltip) with shared timing + easing.
8. `FOUNDATION_VISUAL_MIGRATION_PLAN.md` — phased migration with owners, consumers, verification,
   certification, rollback, and governance steps.
9. `FOUNDATION_VISUAL_CERTIFICATION.md` — certification checklist + recorded baseline + gates.

---

## 12. Gate

**This audit is the approval gate for the language specifications and the migration plan.**
No implementation occurs until approved. Each specification carries its own issue list; the
migration plan sequences them with verification and certification gates.

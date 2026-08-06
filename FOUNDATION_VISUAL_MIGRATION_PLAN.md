# Phase 5.4 — Foundation Visual Migration Plan

**Status:** ⏳ AWAITING APPROVAL (approval gate — no implementation until approved)
**Date:** 2026-08-06
**Branch:** `phase-3.5` (uncommitted working tree — see §8)
**Parent docs:** `VISUAL_LANGUAGE_AUDIT.md`, the seven language specifications
(`SURFACE_LANGUAGE_SPECIFICATION.md`, `BUTTON_LANGUAGE_SPECIFICATION.md`,
`TYPOGRAPHY_LANGUAGE_SPECIFICATION.md`, `HOVER_LANGUAGE_SPECIFICATION.md`,
`PILL_LANGUAGE_SPECIFICATION.md`, `SKELETON_LANGUAGE_SPECIFICATION.md`,
`MOTION_LANGUAGE_SPECIFICATION.md`), and `FOUNDATION_VISUAL_CERTIFICATION.md`.

---

## 0. Purpose

Sequence the unification of the entire application onto the ONE visual language defined in the
Phase 5.4 specifications. Each migration issue carries: current owner, Foundation owner,
consumer list, migration order, verification, certification, rollback, and the governance steps
(Design Decision → Freeze Register → Execution Log → Certification) per
`DESIGN_SYSTEM_WORKFLOW.md`.

**Rule of the phase:** no hardcoded/arbitrary Tailwind colors, no inline styles, no page-specific
styling, no temporary styles, no local overrides of certified components, no mutation of frozen
variants, no page exceptions, no second visual language.

---

## 1. Migration principles

1. **Reuse, don't recreate.** Use the exact certified component that produces the required
   appearance (Phase 3.1 §8.5 mandate).
2. **Leave what matches.** Certified-looking, token-compliant code stays untouched.
3. **Family correctness.** Management surfaces load with management components/skeletons; premium
   surfaces keep premium. No mixed families on one surface.
4. **Visual-only.** No business logic, routing, permissions, validation, or a11y changes.
5. **Byte-identical dark.** Dark-theme management rendering must not change (reuses baseline
   tokens). Light changes are the only allowed deltas, each with a Design Decision.
6. **Relight, not re-theme.** The management light surface becomes brighter/cleaner/modern/neutral
   (`#FCFCFD`/`#F6F8FA`/`#EDF1F5`) — explicitly NOT white, parchment, amber, yellow, cream, or
   brown. Dark theme stays pixel-identical.
7. **Elevation via the ladder.** EXACTLY 4 elevation levels (E0 flat / E1 card / E2 hover / E3
   modal). No custom consumer shadows; frozen carved/3D/gold shadows are family materials, not
   elevation choices.
8. **One motion system.** Durations only from `--transition-*` (150/200/300/500ms); scoped
   channels; no unjustified `transition-all`.
9. **Semantic button roles.** Every button maps to a role (Primary/Save/Delete/Cancel/…); only
   colors (variant) change, everything else identical.
10. **Contrast floor.** No readable text below WCAG AA; `text-hint` for hints only; 9px only for
    non-essential bold labels.
11. **Per-cluster verification** with `npx tsc -b`, `npm run build`, ESLint, runtime audit tests
    (`ds003/ds005/ds014`), and the palette/raw-button sweeps.

---

## 2. Issue register (all issues from the language specs, consolidated)

| ID | Spec | Issue | Owner | Consumers |
|---|---|---|---|---|
| S-1 | Surface | Management light relight: `--management-surface` `#FFFFFF`→`#FCFCFD`, `-muted` `#F8FAFC`→`#F6F8FA`, `-hover` `#F1F5F9`→`#EDF1F5` (not white/parchment/amber; dark pixel-identical) | Foundation (`themes.css` .light block) | every management surface |
| S-2 | Surface | `BulkActionBar` `isDark` branch → single certified surface | Foundation/common | BulkActionBar |
| S-3 | Surface | `AdminIconWrap` `!isDark` split | Foundation/common | admin icon badges (freeze — verify only) |
| S-4 | Surface | Questions surfaces → management family | Questions cluster | QuestionsActions, QuestionsTable, QuestionForm, modals, PromptEditorModal, UploadProgressOverlay |
| S-5 | Surface | Overview chart panel family decision | Overview cluster | AdminOverview, StatsGrid, DailyAttemptsChart |
| S-6 | Surface | Topics/Settings/Leaderboard/Upload tooling → management family | their clusters | toolbars, cards, tables |
| S-7 | Surface/Typography | `PremiumLoader` raw hex → tokens | PremiumLoader | splash/loader surfaces |
| S-8 | Surface | `SubjectCardItem` `var(--primary-rgb)` shadow → named token | Settings cluster | SubjectCardItem |
| S-9 | Surface | Questions/Sub-Admins tables → `DataGrid`/`CollectionCard` management | Questions, Sub-Admins | QuestionsTable, sub-admin table |
| E-1 | Surface/Elevation | Adopt EXACTLY-4 elevation ladder (E0/E1/E2/E3); map consumer shadows; remove free-form `shadow-[…]`/`shadow-card-*` | Foundation + global | all |
| E-2 | Elevation | `shadow-xl shadow-primary/20` (MethodSelectionView) → E2 base + token glow | Upload cluster | MethodSelectionView |
| E-3 | Elevation | `LeaderboardView` `shadow-lg` + wrapper shadows → E1/E2 ladder | Leaderboard cluster | LeaderboardView |
| H-1 | Hover | `QuestionCard` no-op translate → canonical card hover | Exam cluster | QuestionCard |
| H-2 | Hover | `MethodSelectionView` `transition-all` → scoped | Upload cluster | MethodSelectionView |
| H-5 | Hover | `TopicCard` `transition-all` → scoped | User topics cluster | TopicCard |
| H-6 | Hover | `TeacherExamCard` icon-badge `transition-all` → scoped | User cluster | TeacherExamCard |
| H-7 | Hover | `SubjectCardItem` `transition-all duration-300` → scoped | Settings cluster | SubjectCardItem |
| H-12 | Hover | Sweep `transition-all` → scoped | global | all |
| H-13 | Hover | Verify menu/dropdown item hover = Navigation pattern | global | Menu/dropdown |
| H-14 | Hover | Verify toolbar button hover = soft/secondary | global | FilterBar/toolbar buttons |
| H-15 | Hover | Verify all card consumers use canonical card hover | global | Collection/Question/Topic cards |
| T-1 | Typography | `text-hint` contrast constraint rule | Foundation/governance | all (governance rule, no code change) |
| T-2 | Typography | `text-muted` on elevated → `text-secondary` for readable text | global (targeted) | surfaces using muted on `--bg-elevated` |
| T-4 | Typography | 9px muted micro-type floor | global (targeted) | LeaderboardMobileCard, QuestionForm, PreviewTab |
| T-5 | Typography | Formalize 9–13px micro-scale in governance | Foundation/governance | all admin |
| T-6 | Typography | `PremiumLoader` hex (dup of S-7) | PremiumLoader | — |
| T-8 | Typography | Verify all strings map to a text role | global (verification) | all |
| P-5 | Pill | Confirm/define Tabs management active-pill variant | Foundation/common (AntigravityData) | Tabs consumers |
| P-6 | Pill | User-side pill sweep (verify certified grammar) | User clusters | TopicCard, QuestionCard, exam chips |
| P-7 | Pill | Inactive-pill border recipe (`border-border-subtle` + `text-secondary` + opacity/hover) across Tabs/SegmentedFilter/CollectionFilter/SelectionContainer | global | all pill families |
| SK-1 | Skeleton | Management skeletons on Questions + other management surfaces | Questions + others | GridSkeleton/LoadingSkeleton management |
| SK-2 | Skeleton | Sweep inline `animate-pulse` blocks → family | global | all |
| SK-6 | Skeleton | Dark-mode skeleton divergence (Questions/Users) fixed via management variant | Questions cluster | Questions, Users skeletons |
| B-5 | Button | Verify no Button/IconButton material overrides | global (verification) | all |
| B-6 | Button | Semantic role→variant map in component docs/governance | Foundation | all buttons |
| M-1 | Motion | Normalize durations to `--transition-*` scale | global | all |
| M-2 | Motion | Scope `transition-all` (overlaps H-2/H-5/H-6/H-7/H-12) | global | all |
| M-3 | Motion | Remove non-scale durations (250/400/600/700ms) | global | all |
| M-4 | Motion | Centralize modal/drawer/dropdown/toast/tooltip timing | Foundation | overlays |
| M-5 | Motion | Motion-safety (`prefers-reduced-motion` / framer `useReducedMotion`) | global | transforms/springs |
| RT-1 | Test | Update stale runtime-audit tests ds003 (FIELD_SURFACE/FIELD_FOCUS), ds005 (Badge `bg-*/15 text-* border-*/30`), ds014 (Avatar `rounded-xl`) to certified renders | Tests | ds003/ds005/ds014 |

---

## 3. Governance steps (mandated by workflow)

For **every** change that alters a value or a certified recipe (S-1 token change, P-5 Tabs
variant, S-8 shadow token):

1. **Design Decision** — record rationale + before/after in the issue (or a short Decision doc).
2. **Freeze Register** — add entry to `FOUNDATION_FREEZE_REGISTER.md` for any token/variant touched
   (S-1, P-5, S-8).
3. **Execution Log** — log each cluster's migration in `PHASE_3_1_EXECUTION_LOG.md` (Phase 5.4
   section) or a Phase 5.4 execution log.
4. **Certification** — produce a Phase 5.4 certification doc with the 12-criteria check
   (mirror `GOLDEN_REFERENCE_CERTIFICATION.md` / Phase 3.1 pattern).

Pure adoption changes (S-4/S-6/S-9/SK-1, H-scoping, T-2/T-4 fixes, S-7 token swap) follow the
same loop but only need a Freeze Register entry if they touch a token/variant definition.

---

## 4. Migration order (phased, gated)

### Priority 0 — Foundation (gate before any consumer work)
| # | Issue | Work |
|---|---|---|
| 0.1 | S-1 | Design Decision + Freeze Register entry; relight the three management light tokens (`--management-surface` `#FCFCFD`, `-muted` `#F6F8FA`, `-hover` `#EDF1F5`) in `themes.css`. Verify no regression in Users (the reference management surface) and dark mode pixel-identical. |
| 0.2 | T-1 / T-5 | Governance rules (workflow checklist): `text-hint` content rule, micro-scale formalization. No code change. |
| 0.3 | P-5 | Design Decision + Freeze Register entry; confirm or define Tabs management active-pill (accent-bg + white text). If defined, add as certified variant. |
| 0.4 | E-1 | Design Decision + Freeze Register entry; publish the E0–E3 elevation ladder (map existing shadows: `shadow-none` E0, `--elevation-2`/`--card-shadow`/`--management-shadow` E1, `--elevation-3`/`--card-hover-shadow`/`shadow-card-premium`/`--management-shadow-hover` E2, `--elevation-4` E3); add governance rule banning new shadow tokens/values. |
| 0.5 | M-4 | Design Decision; centralize modal/drawer/dropdown/toast/tooltip enter/exit timing in the motion recipes (AdminModal/AdminModalHeader + shared overlay list). |

Gate: Foundation changes verified (`tsc`, build, runtime ds* tests, Users surface screenshot
comparison, dark-mode diff). **Approval checkpoint A.**

### Priority 1 — Containment fixes (small, high-value)
| # | Issue | Work |
|---|---|---|
| 1.1 | S-7 / T-6 | `PremiumLoader.tsx` lines 8/12/13: `border-[#2c4c3b]/20` → token border; `bg-[#2c4c3b]` → `bg-primary` (or `bg-accent` family); `bg-[#f4ebd8]` → neutral surface token (`bg-elevated`/`bg-hover` equivalent). Confirm loader render parity. |
| 1.2 | H-1 | `QuestionCard` hover: remove no-op `-translate-y-0`, use canonical card hover (E2 elevation + optional -0.5 lift). |
| 1.3 | H-2 / H-5 / H-6 / H-7 / H-12 / M-2 | Scope `transition-all` → `transition-[transform,box-shadow]` / `transition-colors` / `transition-transform` per element (MethodSelectionView, TopicCard, TeacherExamCard icon-badge, SubjectCardItem). |
| 1.4 | S-8 | `SubjectCardItem` selected shadow → named token (add token + Freeze Register, or map to E2 ladder). |
| 1.5 | E-2 / E-3 | `MethodSelectionView` `shadow-xl shadow-primary/20` → E2 + token glow; `LeaderboardView` `shadow-lg` + wrapper shadows → E1/E2. |
| 1.6 | M-1 / M-3 | Normalize all durations to `--transition-*` scale; remove any 250/400/600/700ms. |
| 1.7 | P-7 | Apply inactive-pill border recipe (`border-border-subtle` + `text-secondary` + `opacity-70 hover:opacity-100`) across Tabs, SegmentedFilter, CollectionFilter, SelectionContainer. |
| 1.8 | B-6 | Add role→variant button map to component docs + governance checklist. |

Gate: `tsc -b`, build, ESLint clean; palette + transition-all sweeps re-run. **Approval checkpoint B.**

### Priority 2 — Admin cluster unification (the core "management" gap)
| # | Issue | Work |
|---|---|---|
| 2.1 | S-4 + SK-1 | **Questions cluster** → management family: `QuestionsActions` toolbar (management FilterBar/Input), `QuestionsTable` → `GridSkeleton`/`CollectionCard` management + `DataGrid`/token table, `QuestionForm` containers → management Card, modals (PromptEditorModal, BulkUploadModal, SingleQuestionModal) → management AdminModal, `UploadProgressOverlay` → management. |
| 2.2 | S-9 | **Sub-Admins** table → management (`GridSkeleton` management verify + `CollectionCard`/`DataGrid`). |
| 2.3 | S-6 | **Topics cluster** tooling → management: `TopicsToolbar`, `TopicListItem`, `ParsedPreview`, `AdminTopicPreviewRenderer`, `LangInputPanel`, `TopicMetadataFields`. Keep premium accent for preview highlight surfaces (token-backed). |
| 2.4 | S-6 | **Settings cluster** tooling → management: `SettingsCard`, `SubjectDistributionPanel`, `ExamParamsForm`, `AddExamModal`; keep `SubjectCardItem` premium selection identity + token shadow; `SubjectPieChart` chart-exempt (container aligned). |
| 2.5 | S-6 | **Leaderboard cluster** tooling → management: `AdminLeaderboard` wrapper, `LeaderboardTabletCard`/`LeaderboardMobileCard` cards; keep `RankBadge`/avatar gold accents (premium accents on management surfaces must be token-sourced and deliberate). |
| 2.6 | S-6 | **Upload cluster** tooling → management: `MethodSelectionView`, `UploadContextPanel`, `BulkUploadPanel`; keep premium method-icon flourish (H-2 scoped). |
| 2.7 | S-5 | **Overview** decision: chart panel → management Card OR stay premium-accent as the chart accent. **Decision required** (recommend: management Card + premium StatCards — StatsGrid already reuses certified `StatCard`). Align `DailyAttemptsChart` container + `LoadingSkeleton` family. |
| 2.8 | S-2 | `BulkActionBar` → single certified surface (management in light via tokens; `bg-card-bg` dark unchanged) — remove `isDark` branch where a single recipe suffices. |
| 2.9 | P-6 | **User-side pill sweep** (verify `Badge`/token grammar on TopicCard, QuestionCard, exam chips) + SK-2 sweep of inline `animate-pulse` across admin/user. |
| 2.10 | H-13 / H-14 / H-15 / T-8 / B-5 | Verification sweeps: menu/dropdown item hover = Navigation pattern; toolbar buttons = soft/secondary; card consumers use canonical card hover; all strings map to a text role; no Button/IconButton material overrides. |

Gate: full visual sweep (palette hex 0 outside chart-exempt; `transition-all` 0 on cards;
raw `<button>` only documented retained), `tsc -b`, build, ESLint, runtime ds* tests, per-cluster
before/after comparison. **Approval checkpoint C.**

### Priority 3 — Typography contrast fixes + runtime-audit test triage
| # | Issue | Work |
|---|---|---|
| 3.1 | T-2 | Targeted: readable text currently `text-text-muted` on `--bg-elevated`/elevated surfaces → `text-text-secondary`. |
| 3.2 | T-4 | 9px muted micro-type → 10px floor for content; keep 9px bold-black on non-essential labels where ≥3:1 (verify per case). |
| 3.3 | T-1 | Enforce governance rule (no readable `text-hint`); fix any stray readable uses found by sweep. |
| 3.4 | RT-1 | Update stale runtime-audit expectations to certified renders: ds003 → FIELD_SURFACE/FIELD_FOCUS classes (`bg-input-bg border-input-border rounded-xl text-input-text`, `focus:border-input-focus-border`); ds005 → Badge `bg-*/15 text-* border-*/30`; ds014 → Avatar `rounded-xl` + current medallion. |

Gate: contrast re-check table updated; `tsc -b`, build, ESLint, runtime suite green.
**Approval checkpoint D.**

### Priority 4 — Certification & close-out
- Produce `PHASE_5_4_CERTIFICATION.md` (14-criteria check in
  `FOUNDATION_VISUAL_CERTIFICATION.md` — this file is the gate-close doc).
- Update `FOUNDATION_FREEZE_REGISTER.md`, `FOUNDATION_GOVERNANCE.md` (Phase 5.4 entries:
  elevation ladder, semantic roles, motion scale, relight values),
  `PHASE_3_1_EXECUTION_LOG.md` (or new Phase 5.4 execution log).
- Re-run full sweep suite + runtime audit tests; archive specs as the certified language reference.
- **Final approval gate.**

---

## 5. Verification (per cluster)

| Check | Command / method | Expected |
|---|---|---|
| TypeScript | `npx tsc -b` | exit 0 |
| Build | `npm run build` | exit 0 (pre-existing chunk notices only) |
| Lint | `npx eslint <touched files>` | 0 migration-introduced problems |
| Runtime audit | `npx vitest run` / `npx vitest run -c vitest.audit.config.ts` | ds003/ds005/ds014 (and siblings) pass on certified expectations (RT-1) |
| Palette sweep | `rg -n "text-\[#|bg-\[#|border-\[#|green-[0-9]|red-[0-9]|amber-[0-9]|slate-[0-9]" src` | 0 outside chart-exempt + documented |
| Raw button sweep | `rg -n "<button" src` | only documented retained items |
| Transition-all sweep | `rg -n "transition-all" src` | 0 on cards/panels |
| inline pulse sweep | `rg -n "animate-pulse" src/components` | only SharedComponents family |
| Duration sweep | `rg -n "duration-\[|duration-(250|400|600|700|1000)" src` | 0 outside frozen carved/gold materials |
| Shadow sweep | `rg -n "shadow-\[" src` | only ladder-mapped tokens (E-1) |
| Before/after | per-cluster screenshots (light + dark) | pixel-close, family-correct; dark pixel-identical |
| Contrast re-check | §3 table in `TYPOGRAPHY_LANGUAGE_SPECIFICATION.md` | all readable text ≥ 4.5:1 |

---

## 6. Rollback

- **Token-value changes (S-1, S-8):** revert the single token in `themes.css` (Freeze Register
  records prior value). No consumer churn — consumers read tokens.
- **Consumer changes (S-4/S-6/S-9/SK-1, H-*, T-2/T-4):** revert per-cluster commits; each cluster
  is a self-contained diff.
- **Component variant additions (P-5):** additive only — removing the variant restores prior
  render; no consumer mutation.
- Workflow: on any certification failure at a gate, revert the failed cluster, record in
  Freeze Register, and re-attempt with a Design Decision update.

---

## 7. Deliverables after approval

- Executed issues with per-cluster before/after comparisons.
- `PHASE_5_4_CERTIFICATION.md` (from `FOUNDATION_VISUAL_CERTIFICATION.md` criteria).
- Updated `FOUNDATION_GOVERNANCE.md`, `FOUNDATION_FREEZE_REGISTER.md`, execution log.
- Final language docs marked ✅ CERTIFIED (the specs above, incl. `MOTION_LANGUAGE_SPECIFICATION.md`).

---

## 8. Working-tree caveat (current state)

Branch `phase-3.5` has a large uncommitted working tree: admin/common components relocated from
`src/components/admin/common/*` → `src/components/common/*` (deletions + untracked additions),
user components relocated into `src/components/user/{topics,performance,prepare-write,…}/`, and
many modified/added files. **Before any Phase 5.4 implementation, the current working tree should
be committed/stabilized** so each migration cluster is an isolated, reviewable diff. This is a
precondition for Priority 0, not part of the migration itself.

---

## 9. Gate

**This plan, the seven language specifications, and `FOUNDATION_VISUAL_CERTIFICATION.md` are the
approval gate.** No implementation occurs until the user approves. On approval, execution proceeds
Priority 0 → 4 with the approval checkpoints A → D → final.

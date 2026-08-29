# Typography Component Audit

**Phase 5.4C — Typography Language (planning / audit only)**
**Status:** ⏳ AUDIT ONLY — no code changes.
**Date:** 2026-08-06
**Role:** Lead Foundation Architect
**Parent:** `FOUNDATION_TYPOGRAPHY_AUDIT.md` (this file feeds parts 3 Typography Inventory and 5 Duplicate Analysis)
**Method:** repository-wide sweeps over all `.tsx`/`.ts` under `src/` (2026-08-06). Consumption counts = JSX tag occurrences; identifier counts = all text matches (imports + usage). Representative `file:line` evidence cited per finding.

---

## 1. Primitive layer inventory

### 1.1 `AntigravityTypography.tsx` + `AntigravityUI.tsx` barrel (semantic primitives)

| Primitive | Tags | Files | Role mapping | Evidence |
|---|---|---|---|---|
| `H1` | 10 | 9 | `--text-h1` / 900 / `--text-title` | AntigravityTypography.tsx:12-16 |
| `H2` | 23 | 22 | `--text-h2` / 700 | :31-35 |
| `H3` | 27 | 19 | `--text-h3` / 600 | :45-49 |
| `Body` | 94 | 52 | `--text-body` / `secondary` prop | :63-67 |
| `Label` | 121 | 42 | `--text-label` / 700 / uppercase / 0.1em | :84-88 |
| `Caption` | 2 | 1 | `--text-caption` | :113-115 |
| `Display` | 5 | 2 | `--text-display` / 900 | :99-103 |
| `BrandTitle` | 1 | 1 | display role + raw hex gradient | :159 |

Consumption summary: **283 primitive tags across the semantic set** (Label 121, Body 94, H3 27, H2 23, AdminText 21, H1 10, Display 5, Caption 2, BrandTitle 1). `AdminText` = 21 tags in 14 files (73 identifier references).

### 1.2 `AdminText.tsx` (style-map primitive)

Style map: `body→var(--text-body)`, `metadata→var(--text-metadata)`, `heading→var(--text-heading)` (`AdminText.tsx:7-14`). Variants cinzel/garamond/sans; serif gated `!isDark` (:35-38, light-only premium identity).

Observed variant usage (21 tags):
| Variant | as | Count |
|---|---|---|
| sans | metadata | 6 |
| cinzel | h3 | 3 |
| cinzel | h4 | 2 |
| cinzel | span | 2 |
| cinzel | (default) | 2 |
| cinzel | h2 / h1 / p | 1 each |
| garamond | span | 1 |
| garamond | heading | 1 |
| sans | body | 1 |

**Finding (C-1):** `sans` + `metadata` (6 tags) renders `--text-metadata` (12px/500) — a certified role rendered via the *module* primitive where the *semantic* `--text-caption`/`--text-metadata` role is intended; the two primitives express the same roles through different APIs (duplicate primitive A-7).

### 1.3 Raw heading tags (not primitives)

`<h1>` 18, `<h2>` 30, `<h3>` 37, `<h4>` 5, `<h5>` 1, `<h6>` 2 repo-wide. Known reusable-component raw heads: `AdminModal.tsx:88` (`<h2 className="text-xl sm:text-2xl font-black">`), `AntigravityLayout.tsx:196` — the same two sites from the Phase 3.4 audit (T-6), still open.

---

## 2. Consumer-area findings (representative evidence)

### 2.1 Low-contrast role misuse — `text-text-hint` (14 sites)

Renders the **AA-failing** `--text-hint` token as readable content (not fine print):
- `QuestionForm.tsx:273,324,355` (form help), `AdminTopicPreviewRenderer.tsx:238`, `AntigravityCard.tsx:171`, `DiagramRenderer.tsx:352,413` (7px hints), `NotificationPanel.tsx:246`, `StatisticsSection.tsx:24`, `ExamDetailModal.tsx:266`, `AdminTopics.tsx:218`, `ResultsPage.tsx:85,95,107`, `VerifyEmailPage.tsx:240`, `AccountDisabledPage.tsx:30`.

### 2.2 Palette leaks on text (status colors as neutral content) — 41 matches

- **Green:** `NotificationPanel.tsx:26`, `CreateStepPublish.tsx:41`, `QuestionCard.tsx:114,119`, `SuccessView.tsx:30`, `ExamDetailSection.tsx:107`, `ExamPerformers.tsx:22,23`, `ExamQuestionAnalysis.tsx:73,76`.
- **Red:** `SidebarLayout.tsx:21`, `DiagramRenderer.tsx:428`, `CompactDateTimePicker.tsx:154`, `CreateStepJsonPaste.tsx:95,96`, `QuestionCard.tsx:93`, `ExamDetailSection.tsx:146,148`; `text-red-400` `ExamPerformers.tsx:32,33`, `ExamQuestionAnalysis.tsx:90,93`, `ExamStudentTable.tsx:145`, `ExamSubComponents.tsx:35`, `ExamSummaryCards.tsx:23`.
- **Amber:** `DiagramRenderer.tsx:394`, `LanguageSelectionScreen.tsx:94,106,114,115`, `StatusBoard`, `WelcomeBanner` (per prior audit).
- Singles: `text-green-600` 1, `text-rose-500` 1, `text-emerald-500` 1, `text-amber-600` 1.

### 2.3 Arbitrary-var bypass — `text-[var(--text-*)]` (23)

`text-[var(--text-muted)]` 22 + `text-[var(--text-hint)]` 1 — bypasses the `text-text-*` utility system (ExamSubComponents, ExamStudentTable, StudentsTable, RecentExamItem, RecentAttemptItem, ExamDetailModal, ExamDetailSection per prior audit; resolved value identical, but escapes the class system).

### 2.4 Sub-8px micro-text

`text-[7px]`: `DiagramRenderer.tsx:352,413` (with `text-text-hint` — double risk), `LeaderboardUserCard.tsx:18` (RANK), `LanguageSelectionScreen.tsx:94`; `text-[8px]` 11 sites (ResultsPage, SubjectCardItem, LanguageSelectionScreen, StatusBoard, etc.).

### 2.5 Same-role drift (detail for audit part 4)

| Role | Observed alternatives | Sites (representative) |
|---|---|---|
| Table header | `text-[10px]`/`text-[11px]`, 600 vs 700, `text-text-secondary` vs `var(--text-muted)`, tracking-wide vs widest | LeaderboardView, StudentsTable, QuestionsTable, ExamStudentTable |
| Section label/eyebrow | 9/10/11/13/14px, uppercase vs not | StatusBoard:60, SubmitExamModal, ExamHeader:27 |
| Card title | 13–24px, 700 vs 900 | TopicCard, MetricBlock, ExamSummaryCards |
| Micro tag/pill | 7–10px + opacity fades | BulkActionBar, AIToolCards, PreviewTab |
| Hint/meta line | `text-text-hint` vs `text-text-muted` vs `var(--text-muted)` vs `opacity-70` | QuestionForm, DiagramRenderer, CreateStepSetup |

### 2.6 Opacity-as-hierarchy (79 combined sites)

`opacity-*` + `text-*` in the same className (≈52-59 files): `CreateStepSetup` `opacity-70`, `CreateStepPrompt` `opacity-60`, `TopicCard` `opacity-80`, `SharedComponents` `opacity-90`, plus alpha-slash `text-text-muted/40`, `/50`.

### 2.7 Inline-style typography

44 distinct `fontSize` values (14px 5, 16px 5, 18px 4, 13px 3, 12px 3, 20px 2, 15px 2, 11px 2, 10px 2, 1.125rem 2, …); `letterSpacing` `-0.05em` 2, `0.1em` 2; raw hex `#a78bfa` (DiagramRenderer).

---

## 3. Reusable-component typography gaps (feeds part 8)

| Area | Component family | Gap |
|---|---|---|
| Admin common | `AdminModal`, `AntigravityLayout`, `Alert`, `Pagination`, `NotificationPanel`, `AntigravityDashboard`, `AntigravityForm`, `DiagramRenderer` | arbitrary `text-[Npx]` (~102 in reusable components per Phase 3.4 audit); raw `<h2>` in AdminModal/AntigravityLayout |
| Admin questions | `QuestionForm`, `CreateStep*`, `AdminTopicPreviewRenderer` | `text-text-hint` as content, opacity fades, `text-green-500` in CreateStepPublish |
| Exam/performers | `ExamDetailSection`, `ExamPerformers`, `ExamQuestionAnalysis`, `ExamStudentTable`, `ExamSummaryCards`, `ExamSubComponents` | palette text colors, `var(--text-muted)` bypass |
| Profile/auth | `StatisticsSection`, `ResultsPage`, `VerifyEmailPage`, `AccountDisabledPage` | `text-text-hint` as content |
| Brand | `BrandTitle` | raw hex gradient (Phase 3.4 T-1, still open) |

---

## 4. Component-level issue list (C-*)

| ID | Issue | Primitive/role affected | Proposed direction |
|---|---|---|---|
| C-1 | `text-text-hint` used as readable content (14) | R15 hint role | remap to `--text-muted`/`--text-caption`; hint reserved for decorative |
| C-2 | 41 palette text colors as neutral content | R18 status role | `--color-*` tokens for status; neutral ladder for content |
| C-3 | 23 `text-[var(--text-*)]` bypass | all roles | `text-text-*` utilities or role primitive |
| C-4 | 7-8px micro-text (15 sites) | R14 micro | floor at 9px for labels; 7/8px non-essential only |
| C-5 | 79 opacity fades for content | R8-R14 | ladder-stepping, not opacity |
| C-6 | `AdminText`/`AntigravityTypography` parallel APIs | R7-R11 | single composite; wrappers during transition (A-7) |
| C-7 | Raw `<h2>`/`<h1>` in AdminModal/AntigravityLayout | R3/R4 | route through `H2`/`H1` primitive (render-identical) |
| C-8 | `BrandTitle` raw hex gradient | R1 | `--brand-text-gradient` token, value-identical (T-1) |

---

*End of Typography Component Audit. No code changes are authorized by this document.*

# Typography Reusable Components

**Phase 5.4C — Typography Language (planning / audit only)**
**Status:** ⏳ PROPOSAL ONLY — no implementation; component/utility changes require separate dedicated approval.
**Date:** 2026-08-06
**Role:** Lead Foundation Architect
**12-part structure:** this file carries **Part 8 (Reusable Opportunities)**.
**Grounding:** audit findings A-1/A-2/A-7 (architecture), T-1/T-3/T-4 (prior Phase 3.4), component issues C-6/C-7/C-8.

---

## 1. Ownership principle

Every typography role has exactly **one owner** (D-107). Today two primitives express the same roles through different APIs (`AntigravityTypography` semantic set + `AdminText` style map). The target is one composite with wrapper compatibility, so consumers keep working during the transition.

## 2. Opportunity map

| # | Opportunity | Solves | Owner | Reuse |
|---|---|---|---|---|
| R-1 | **Typography composite** (one primitive, superset API) | A-7 / T-3 / C-6 | Foundation `AntigravityTypography` | all H1/H2/H3/Body/Label/Caption/Display/AdminText consumers (283 tags today) |
| R-2 | **Canonical size utility surface** (`text-display/h1/h2/h3/h4/h5/h6/body/small/caption/label/badge`) registered in `@theme` | A-1 | `index.css` | every size bypass: 278 `text-[Npx]` + 232 `text-xs…2xl` |
| R-3 | **MicroText primitive** (9/10/11/12/13px formal scale) | T-4 / T-5 / C-4 | Foundation (new) | 278 arbitrary micro sizes → scale |
| R-4 | **StatValue / MetricText** | R2 role, T-5 note | Foundation (thin) | stat/metric cards |
| R-5 | **LinkText** (link role w/ underline contract) | X-3, R17 | Foundation (thin) | anchors |
| R-6 | **Weight/Tracking/Leading utility surface** from live tokens (`--weight-*`, `--lh-*` live set, `--ls-*` live set) | A-2/A-3/A-4 | `index.css` | 536 `font-*`, 243 `tracking-*`, 70 `leading-*` uses |
| R-7 | **Badge/Pill text role** | R13 | deferred to 5.4D (Pills & Badges owns it) | — |
| R-8 | **`--brand-text-gradient`** token for `BrandTitle` | T-1 / C-8 | `themes.css` | BrandTitle only |

## 3. Recommended API — Typography composite (R-1)

```tsx
<Typography role="h1|h2|h3|h4|h5|h6|heading|body|small|caption|label|badge|display|stat" variant="cinzel|garamond|sans" color="primary|title|secondary|muted" as={...} />
```

- `role` resolves the full token tuple (size/lh/fw/ls/tt) from the canonical scale — **no inline `var()`** in the composite body.
- `variant` absorbs `AdminText` cinzel/garamond/sans (light-only serif gate preserved).
- `AdminText`, `H1-H6`, `Body`, `Label`, `Caption`, `Display` remain exported as thin wrappers during transition (consumer-inert until migration phase).
- This is a **render-identical consolidation** (same resolved values), so it can proceed in the Foundation phase without consumer churn.

## 4. Recommended API — MicroText (R-3)

```tsx
<MicroText size="9|10|11|12|13" color="primary|secondary|muted" weight="500|600|700" transform="uppercase|none" tracking="widest|wide|none" />
```

Replaces the 278 arbitrary `text-[Npx]` sites with a scale-enforced primitive. Governance: sizes off-scale rejected; 8px and below not offered.

## 5. Recommended API — StatValue (R-4)

```tsx
<StatValue value={} label={} color="title" />
```

Renders the R2 role (`--text-stat-value` / 900 / -0.05em / `--text-title`) as a certified composite for stat/metric cards (StatCard, ResultStatCard, ExamSummaryCards metrics).

## 6. Utility registration targets (R-2 / R-6)

- **`@theme` additions (render-neutral):** register `--text-display/h1/h2/h3/body/small/caption/label/badge` as size utilities and the live `--weight-*`, `--lh-*`, `--ls-*`, `--tt-*` sets as font-weight/leading/tracking/transform utilities so `text-h1`, `font-weight-medium`, `leading-normal`, `tracking-widest` resolve **through tokens** instead of Tailwind defaults.
- **CAUTION:** registering a token as a utility that already exists as a Tailwind default (`tracking-widest`, `leading-normal`, `font-semibold`) **overrides** the default — must be value-identical to be render-neutral; any value difference is a render-affecting change needing its own gate.
- **41 dead tokens** (`--text-badge`, `--text-link`, `--text-small`, `--text-header`, `--text-emphasis`, `--text-nav-secondary`, `--text-nav-hover`, 4× `--fw-*`, 5× `--weight-*`, 6× `--lh-*`, 7× `--ls-*`, 12 composite) → Foundation cleanup SAFE DELETE (5.3-style), deletion-only, separate gate.

## 7. Reuse matrix (who consumes what today)

| Consumer family | Today | Target |
|---|---|---|
| Admin common (AdminModal, AntigravityLayout, Alert, Pagination, NotificationPanel, DiagramRenderer, AntigravityForm, AntigravityDashboard) | 102 arbitrary `text-[Npx]` (Phase 3.4 count) + raw `<h2>` ×2 | primitives + scale utilities |
| Admin questions (QuestionForm, CreateStep*, AdminTopicPreviewRenderer) | `text-text-hint` content, opacity fades, `text-green-500` | `--text-muted`/caption roles, ladder, status tokens |
| Exam/performers (ExamDetailSection, ExamPerformers, ExamQuestionAnalysis, ExamStudentTable, ExamSummaryCards, ExamSubComponents) | palette text, `var(--text-muted)` bypass | neutral ladder + status roles |
| Profile/auth (StatisticsSection, ResultsPage, VerifyEmailPage, AccountDisabledPage) | `text-text-hint` content | caption/muted roles |

---

*End of Typography Reusable Components. Proposal only; no code changes are authorized by this document.*

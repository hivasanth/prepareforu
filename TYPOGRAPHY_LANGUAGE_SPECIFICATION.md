# Phase 5.4 — Typography Language Specification

**Status:** ⏳ AWAITING APPROVAL (design proposal — no implementation until approved)
**Date:** 2026-08-06
**Parent audit:** `VISUAL_LANGUAGE_AUDIT.md`
**Supersedes:** `TYPOGRAPHY_CONTRAST_AUDIT.md` (renamed to the Language spec; contrast tables retained below)

---

## 1. Purpose

Define the ONE typography language. Every text role, size, weight, and color resolves through the
Foundation semantic type scale and the color tokens. No page defines its own type. All text meets
WCAG AA contrast.

---

## 2. Text roles (the complete role model)

Every string in the app is one of these roles. Role → token → contrast is fixed.

| Role | Token (size/lh/fw) | Color token | Typical surface |
|---|---|---|---|
| Display | `--text-display` / `--lh-display` / 900 / -0.025em | `--text-title` | hero/brand |
| Page Title / H1 | `--text-h1` / 900 / -0.025em | `--text-title` | page headings |
| Section Title / H2 | `--text-h2` / 700 / -0.025em | `--text-primary` | section headings |
| Subsection / H3 | `--text-h3` / 600 | `--text-primary` | sub-headings |
| Card Title / Heading | `--text-heading` (1rem) / 700 | `--text-primary` | card titles (AdminText heading) |
| Body | `--text-body` (0.8125rem) / 500 / 1.7 | `--text-primary` | primary reading |
| Small | `--text-small` (0.875rem) / 500 | `--text-primary` / `--text-secondary` | compact body (AdminText body) |
| Metadata | `--text-metadata` (0.75rem) / 500 | `--text-secondary` / `--text-muted` | rows, table cells, timestamps (AdminText metadata) |
| Caption | `--text-caption` (0.6875rem) / 500 | `--text-muted` | secondary metadata |
| Label | `--text-label` (0.625rem) / 700 / 0.1em / uppercase | `--text-secondary` | form labels, tags |
| Badge/Pill | `--text-badge` (0.5625rem) / 700 / 0.05em / uppercase | variant color | pills (see PILL spec) |
| Micro | `text-[9px]`–`text-[13px]` canonical micro-scale | `--text-primary`/`--text-secondary`/`--text-muted` | dense admin UI (formalized, §4) |
| StatValue | `--text-stat-value` (1.75rem) / 900 / -0.05em | `--stat-value-text` | stat cards (D-141) |
| Placeholder | `--placeholder-color` | `--placeholder-color` (light/dark #9CA3AF) | input placeholders |
| Disabled | `--text-disabled` | `--text-disabled` | disabled text |
| Status text | — | `--color-success` / `--color-danger` / `--color-warning` | status messages |
| Link | — | `--text-link` (light #166534 / dark #3B82F6) | anchors |

**Font stacks (frozen):** `--font-sans` (Vend Sans) for everything; `--font-mono` (JetBrains Mono)
for code/IDs/mono data (LeaderboardView, QuestionForm format notes); `cinzel`/`garamond` are the
premium light-only display/italic identity (`font-cinzel`, `font-garamond` — AdminText, cinzel
section headers). Management surfaces use the sans stack only.

---

## 3. Contrast ratio table (token pairs, computed)

Reference pairs on the two certified surface materials. WCAG AA = 4.5:1 normal, 3:1 large
(≥18.66px bold / ≥24px).

### 3.1 Light theme (canvas `#F8FAFC`, surface `#FFFFFF`, elevated `#F1F5F9`, relight `#FCFCFD`)
| Token | Value | On `--bg-surface` (#FFFFFF) | On `--bg-elevated` (#F1F5F9) | On relight (#FCFCFD) | AA |
|---|---|---|---|---|---|
| `--text-primary` | `#111827` | 19.7:1 | 18.6:1 | 19.6:1 | ✅ |
| `--text-secondary` | `#4B5563` | 7.6:1 | 7.0:1 | 7.5:1 | ✅ |
| `--text-muted` | `#6B7280` | 4.8:1 | 4.4:1* | 4.7:1 | ✅ (⚠ on elevated) |
| `--text-hint` | `#9CA3AF` | 2.8:1 | 2.5:1 | 2.7:1 | ❌ (hints/placeholders/disabled only) |
| `--text-link` | `#166534` | 7.2:1 | — | — | ✅ |
| `--text-on-accent` | `#FFFFFF` on `#166534` | 8.6:1 | — | — | ✅ |

\* `#6B7280` on `#F1F5F9` = 4.4:1 — **just under AA.** Finding T-2.

### 3.2 Dark theme (canvas `#111827`, surface `#1F2937`)
| Token | Value | On `--bg-surface` | AA |
|---|---|---|---|
| `--text-primary` | `#F9FAFB` | 15.5:1 | ✅ |
| `--text-secondary` | `#D1D5DB` | 11.0:1 | ✅ |
| `--text-muted` | `#9CA3AF` | 5.8:1 | ✅ |
| `--text-hint` | `#6B7280` | 3.7:1 | ❌ (hints/placeholders/disabled only) |
| `--text-link` | `#3B82F6` | 5.3:1 | ✅ |
| `--text-on-accent` | `#FFFFFF` on `#3B82F6` | 3.7:1 | ⚠ buttons/UI (large/bold) OK |

### 3.3 Findings
| ID | Finding | Severity |
|---|---|---|
| T-1 | `--text-hint` fails AA in BOTH themes (2.8:1 light / 3.7:1 dark). Legal only for hint/placeholder/disabled content. | High |
| T-2 | `--text-muted` on `--bg-elevated` in light = 4.4:1, just under AA. Use `--text-secondary` for readable text on elevated surfaces. | Medium |
| T-3 | Dark `--text-on-accent` (white on `#3B82F6`) = 3.7:1 — fine for buttons/nav active (bold/large), not for body. | Info |
| T-4 | 9px type on muted tokens (`LeaderboardMobileCard`, `QuestionForm` hints, `PreviewTab` labels). 9px below the 11px practical floor; muted on 9px compounds T-1. | Medium |

---

## 4. Micro-typography scale (formalized — 77 admin matches, all on certified scale)

| Size | Dominant uses (evidence) | Contrast rule |
|---|---|---|
| `text-[9px]` | LeaderboardMobileCard labels, AIToolCards footer, QuestionForm hints, PreviewTab stat label, BulkActionBar counter, SubjectCardItem "Selected", AdminTopicPreviewRenderer tag pill, SingleQuestionModal | non-essential labels only; use bold (≥700) weights; never muted-on-elevated |
| `text-[10px]` | LeaderboardView th/cells, InstructionsTab, QuestionForm labels, TopicListItem, ParsedPreview, LangInputPanel, AddExamModal, SidebarLayout role | default micro for labels/uppercase |
| `text-[11px]` | LeaderboardView accuracy/name, InstructionsTab body, JsonTab error, QuestionsTable chip | body micro |
| `text-[12px]` | SubjectDistributionPanel cinzel header | small text |
| `text-[13px]` | QuestionForm flags, AdminTopicPreviewRenderer body, MetricBlock | small text |

**Rules:** use verbatim on this scale (repo precedent); sizes outside the scale prohibited for
micro-type; 8px and below prohibited. Where a semantic token exists (`--text-metadata`=12px,
`--text-small`=14px) prefer the token for non-dense content.

---

## 5. Color-token hygiene audit

| Check | Result |
|---|---|
| Raw hex text/bg/border in `src` | **3 matches**, all `src/components/PremiumLoader.tsx` (lines 8/12/13) |
| Raw hex in admin / user | **0** |
| Palette colors in admin | **0** (Phase 3.1 cleaned) |
| Recharts palettes/tooltips | Exempt (chart-level) |
| `var(--primary-rgb)` | Token-backed (SubjectCardItem shadow) — S-8 moves to named token |
| `.ancient-*` classes | 28 refs, token-resolved (light-only premium identity) |
| `bg-slate-900` | Certified fixed-dark surfaces only (tooltip, drawer scrim) |
| `text-white` | On token fills only (`bg-primary`, `bg-success`, gold gradient) — certified |

---

## 6. Typography issue list (T-*)

| ID | Issue | Proposed resolution |
|---|---|---|
| T-1 | `--text-hint` fails AA | Constrain to hint/placeholder/disabled only; governance rule prohibiting readable `text-hint` |
| T-2 | `--text-muted` on elevated 4.4:1 | Use `text-secondary` for readable text on elevated surfaces |
| T-4 | 9px muted micro-type | Floor micro-type at 10px for content; keep 9px bold-black for non-essential labels where ≥3:1 |
| T-5 | Arbitrary micro-sizes scattered | Formalize 9–13px micro-scale (this spec §4); document token mapping |
| T-6 | `PremiumLoader` raw hex | Migrate to tokens (S-7) |
| T-7 | Font-role gating (`!isDark` cinzel/garamond) | Freeze as certified premium font identity (no change) |
| T-8 | Text-role mapping on consumers | Verify every admin/user string uses a role from §2 (migration verification) |

---

## 7. Frozen

- Canonical semantic type scale (`--text-*` tokens) — `themes.css` lines 314–343.
- `AdminText` size-token mapping (body/metadata/heading).
- Micro-typography scale precedent (Phase 3.1 §1: `text-[7px]…[13px]`).
- Font roles (cinzel/garamond light-only premium; sans default; mono for data).

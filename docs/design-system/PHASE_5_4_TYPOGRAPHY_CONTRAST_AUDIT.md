# Phase 5.4 — Typography Contrast Audit

**Status:** PLANNING / AUDIT ONLY — no Foundation evolution, no token changes, no component changes, no consumer migration.
**Role:** Lead Foundation Architect.
**Date:** 2026-08-04
**Companion docs:** `PHASE_5_4_VISUAL_LANGUAGE_AUDIT.md` (§3.4), `PHASE_5_4_SURFACE_LANGUAGE_SPECIFICATION.md`.

---

## 1. Purpose

Measure the typography ladder's contrast in both themes against every surface it sits on, and catalog the untokenized typography drift (arbitrary sizes, opacity hierarchy, role inconsistency, status-color leakage) that Phase 5.4 must unify.

Contrast ratios are WCAG 2.1 relative-luminance approximations (±0.1), computed from the resolved hex values in `themes.css`.

---

## 2. The Semantic Typography Ladder (resolved values)

| Token | DARK | LIGHT | Role |
|---|---|---|---|
| `--text-primary` | `#F9FAFB` | `#111827` | primary body/heading |
| `--text-title` | `#F9FAFB` | `#111827` | title (same value) |
| `--text-secondary` | `#D1D5DB` | `#4B5563` | secondary body / labels |
| `--text-muted` | `#9CA3AF` | `#6B7280` | metadata / hints |
| `--text-hint` | `#6B7280` | `#9CA3AF` | fine print / footnotes |
| `--text-disabled` | `#9CA3AF` | `#9CA3AF` | disabled (decorative) |

Micro-size tokens (canonical): `--text-label 10px` (700), `--text-badge 9px` (600), `--text-caption 11px` (400).

Accent/status (color, not neutral ladder): `--color-accent #3B82F6`(dark)/`#166534`(light), `--color-secondary #10B981`(dark)/`#C8960C`(light), `--color-success/warning/danger/info`.

---

## 3. Contrast Ratios

### 3.1 Dark theme (surfaces: `#111827` app, `#1F2937` surface, `#374151` elevated)

| Token | on app `#111827` | on surface `#1F2937` | on elevated `#374151` | Pass ≥4.5 (normal text) |
|---|---|---|---|---|
| `--text-primary` | ≈16:1 | ≈15.4:1 | ≈10.5:1 | PASS all |
| `--text-secondary` | ≈11.6:1 | ≈10.9:1 | ≈7.5:1 | PASS all |
| `--text-muted` | ≈6.5:1 | ≈6.1:1 | ≈4.1:1 | **FAIL on elevated `#374151`** |
| `--text-hint` | ≈3.4:1 | ≈3.2:1 | ≈2.2:1 | **FAIL everywhere** |
| `--text-disabled` | ≈6.5:1 | ≈6.1:1 | ≈4.1:1 | decorative (no requirement) |

### 3.2 Light theme (surfaces: `#F8FAFC` canvas, `#FFFFFF` card, `#F1F5F9` elevated, `#E2E8F0` active, `#FAFBFC` proposed management)

| Token | on canvas `#F8FAFC` | on white `#FFFFFF` | on elevated `#F1F5F9` | on active `#E2E8F0` | Pass ≥4.5 |
|---|---|---|---|---|---|
| `--text-primary` | ≈16.4:1 | ≈17.6:1 | ≈15.1:1 | ≈13.1:1 | PASS all |
| `--text-secondary` | ≈7.7:1 | ≈8.1:1 | ≈7.3:1 | ≈6.3:1 | PASS all |
| `--text-muted` | ≈4.9:1 | ≈5.1:1 | ≈4.6:1 | ≈4.2:1 | **borderline-FAIL on `#E2E8F0`** |
| `--text-hint` | ≈2.6:1 | ≈2.7:1 | ≈2.4:1 | ≈2.2:1 | **FAIL everywhere** |
| `--text-disabled` | ≈2.6:1 | ≈2.7:1 | ≈2.4:1 | ≈2.2:1 | decorative |

### 3.3 Status colors used as body text (light theme on white)

| Usage | Color | Contrast | Verdict |
|---|---|---|---|
| `text-warning` body (WelcomeBanner, StatusBoard) | `#D97706` | ≈3.0:1 | FAIL for small text |
| `text-secondary` (gold `#C8960C`) as body | `#C8960C` | ≈3.4:1 | FAIL for small text |
| `text-success` small text | `#16A34A` | ≈2.9:1 | FAIL for small text |

**Key result:** `--text-hint` fails 4.5:1 on every surface in both themes; `--text-muted` fails on raised surfaces (dark `#374151`, light `#E2E8F0`). Status colors are unsafe as body/meta text.

---

## 4. Findings

### 4.1 Low-contrast token (`--text-hint`)
- Fails everywhere; used 15× as `text-text-hint` + the `text-[7px] text-text-hint` nodes (DiagramRenderer).
- **Proposal direction (needs its own D-series decision):** either (a) raise `--text-hint` to the `--text-muted` value and demote `--text-muted` one step (would shift ~96+15 uses), or (b) add a new `--text-hint` value that passes 4.5:1 on white/`#F1F5F9` and on dark `#374151`. Both are render-affecting and gated separately.

### 4.2 Tiny arbitrary micro-text (untokenized)
| Size | Uses | Sites (representative) |
|---|---|---|
| `text-[10px]` | 140 | StatusBoard:60, SubmitExamModal, ExamHeader:27, LeaderboardTable:25 |
| `text-[11px]` | 76 | LeaderboardView:72, QuestionCard:47 |
| `text-[9px]` | 50 | StatusBoard:46, LanguageSelectionScreen:42, CreateStepPublish:41 |
| `text-[8px]` | 16 | ResultsPage:71, LanguageSelectionScreen:94, SubjectCardItem:35 |
| `text-[7px]` | 4 | LeaderboardUserCard:18 (RANK), DiagramRenderer:352/413 |

All bypass `--text-label` (10px) / `--text-badge` (9px) / `--text-caption` (11px). 7–9px bold uppercase fails legibility and large-text guidance.
**Spec target:** micro-text maps to the three canonical micro tokens; sizes below 9px are eliminated; nothing below `--text-label` for interactive content.

### 4.3 Opacity as hierarchy (untokenized)
- 59 `opacity-NN` on text (e.g. `CreateStepSetup` field labels `opacity-70`, `CreateStepPrompt` `opacity-60`, `SharedComponents:101 opacity-90`, `TopicCard:36 opacity-80`) and 7 token-alpha-slash (`text-text-muted/40`, `/50`) do the same job two ways.
- **Spec target:** hierarchy comes from the token ladder, not opacity. Opacity on text is removed for content roles (allowed only for decorative/disabled).

### 4.4 Same role, different size/weight across files
| Role | Observed sizes/weights | Spec target |
|---|---|---|
| Section label / eyebrow | 9px/700, 10px/700, 11px/600, 13px, 14px | one: `--text-caption` 11px / 600 uppercase |
| Card title / headline | 13→24px, 700 vs 900 | `H1–H6` + `--text-title` tokens only |
| Table header | 10px, 11px; 600 vs 700; `text-text-secondary` vs `var(--text-muted)`; tracking-wide vs widest | one: `--text-label` 10px / 700 uppercase, `text-text-secondary` |
| Metadata / secondary line | 9px/10px/12px; medium vs bold; `text-text-secondary` vs `var(--text-muted)` | one: `--text-caption` or `--text-label` + `text-text-muted` |
| Toolbar context label | 10px/11px muted vs `text-xs` muted vs none | one: `--text-label` + `text-text-muted` |

### 4.5 `text-[var(--text-muted)]` bypass (~17+ sites)
Direct CSS-var arbitrary values instead of the `text-text-muted` utility (ExamSubComponents, ExamStudentTable, StudentsTable, RecentExamItem, RecentAttemptItem, ExamDetailModal, ExamDetailSection). Same resolved value; escapes the class/token system.
**Spec target:** replace with `text-text-muted` (or the spec'd micro token).

### 4.6 Status colors as neutral content (V-7)
- WelcomeBanner body/subtitle in `text-warning`; StatusBoard "Security Status" heading in `text-warning`; ExamStudentTable data columns in raw `text-green-500/text-red-400/text-amber-400`; ExamSummaryCards metric values in raw palette; PerformerList section header in `text-green-500/text-red-400`; QuestionForm section labels tinted `text-warning`.
- **Spec target:** status colors are reserved for status indicators; neutral content uses the neutral ladder. Data columns use the neutral ladder with status only for true pass/fail badges.

---

## 5. Unified Typography Scale (one scale, spec direction)

| Tier | Token | Size | Weight | Color | Contrast gate |
|---|---|---|---|---|---|
| Display/Stat | `--text-display` | responsive | 900 | `--text-title` | ≥4.5:1 |
| H1–H3 | `--text-h1..h3` | responsive | 700 | `--text-title` | ≥4.5:1 |
| H4–H6 | `--text-h4..h6` | responsive | 600 | `--text-primary` | ≥4.5:1 |
| Body | `--text-body` | 14px | 400/500 | `--text-primary` | ≥4.5:1 |
| Secondary body | `--text-body` | 14px | 400 | `--text-secondary` | ≥7:1 target |
| Label/micro | `--text-label` | 10px | 700 | `--text-secondary` | ≥7:1 target |
| Badge/micro | `--text-badge` | 9px | 600 | `--text-muted` | ≥4.5:1 (min) |
| Caption | `--text-caption` | 11px | 400 | `--text-muted` | ≥4.5:1 |
| Hint/footnote | `--text-caption` | 11px | 400 | `--text-hint`(fixed) | ≥4.5:1 |
| Disabled | `--text-disabled` | — | — | `--text-disabled` | decorative |

All micro sizes ≥9px; no opacity fades for content; status colors gated to status roles.

---

## 6. Priority

| # | Issue | Severity | Fix layer |
|---|---|---|---|
| T-1 | `--text-hint` fails everywhere (both themes) | High | token value (render-affecting, own decision) |
| T-2 | `--text-muted` fails on raised surfaces | Medium | token value or usage gate |
| T-3 | micro-text 7–9px + 140×[10px]/76×[11px] untokenized | High | consumer migration to micro tokens |
| T-4 | opacity hierarchy (59) + alpha-slash (7) | Medium | consumer migration |
| T-5 | same-role size/weight inconsistency | Medium | consumer migration to scale |
| T-6 | `var(--text-muted)` bypass (~17) | Low | consumer migration |
| T-7 | status colors as neutral content (WelcomeBanner, StatusBoard, tables) | High | consumer migration |

---

*End of Typography Contrast Audit. No code changes are authorized by this document.*

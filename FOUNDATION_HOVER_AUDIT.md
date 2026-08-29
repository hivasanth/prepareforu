# Foundation Hover Audit

**Phase 5.4E — Hover & Interaction (implementation audit)**
**Status:** ✅ AUDIT COMPLETE — every hover model converged to the D-169 brightness + elevation language; awaiting user certification
**Role:** Lead Foundation Architect
**Date:** 2026-08-06
**Supersedes:** `VISUAL_LANGUAGE_AUDIT.md` hover findings (H-1…H-15) and the design-stage `HOVER_LANGUAGE_SPECIFICATION.md` v1 — re-audited against the implemented language.
**Decisions:** D-169, D-170. **Governance:** DS-018 frozen.

---

## 1. Audit Method

1. Repo-wide sweep of `src/**/*.tsx` for every hover interaction channel: `hover:scale`, `group-hover:scale`, `hover:rotate`, `group-hover:rotate`, `hover:-translate`, `group-hover:translate`, `hover:shadow-*`, `hover:bg-*`, `hover:text-*`, `hover:border-*`, `hover:opacity`, `group-hover:opacity`, `transition-all`.
2. Classified each occurrence by surface family (card / row / button / pill / menu / decorative).
3. Converged every Foundation + feature occurrence to the D-169 recipes (`transition-interaction duration-fast ease-standard` + `hover:brightness-105`/`hover:bg-hover-bg`/`hover:shadow-card-hover-shadow` as appropriate).
4. Re-scanned to confirm zero remaining scale/rotate/translate hovers and zero `transition-all`.

## 2. Pre-5.4E divergence (evidence)

| Pattern | Examples | Issue |
|---|---|---|
| `hover:scale-105` / `hover:scale-110` | LeaderboardView avatar, PerformanceAnalyticsSection, MethodSelectionView, AIToolCards, AdminSelectionTabs | scale channel used inconsistently; violates the no-lift/no-scale model |
| `group-hover:rotate-12` | LeaderboardView rank avatar, MethodSelectionView icon | rotation on decorative elements |
| `hover:-translate-y-0.5` | Card surfaces (pre-5.4E certified lift) | translate lift channel |
| `lg:group-hover:translate-x-1` | TopicCard, SidebarLayout logout icon | directional slide |
| `hover:shadow-*` / `hover:shadow-card-premium` | QuestionCard, SubjectCardItem, TeacherExamCard, TopicCard | elevation-only (kept via tokens) |
| `transition-all` | MethodSelectionView, TopicCard, TeacherExamCard, SubjectCardItem | over-broad transition |

## 3. Converged hover recipes (implemented)

| Surface | Recipe |
|---|---|
| Cards (premium) | `hover:shadow-card-hover-shadow` (+ `hover:brightness-[1.02]`) — `transition-interaction duration-fast ease-standard` |
| Cards (management) | `hover:shadow-<elevation token>` — same transition |
| Filled / colored surfaces (buttons, pills, icon buttons) | `hover:brightness-105` — same transition |
| Rows / menus / ghost surfaces | `hover:bg-hover-bg/…` — same transition |
| Color accents (text/icons/links) | `hover:text-text-primary` / `group-hover:text-primary` — same transition |
| Outlined controls / fields | `hover:border-<token>` |
| Decorative (watermarks, loading, chart bars) | `transition-transform duration-very-slow` / `transition-interaction duration-slow/very-slow` — NO scale/rotate on hover |

**Focus ring added** wherever a hover existed without one: MethodSelectionView method cards, SelectionView scroll arrows, CarouselDots, AIToolCards, TestConfigView, UploadContextPanel, AdminSelectionTabs, TopicInfoButton, NotificationPanel buttons.

## 4. Issues resolved (H-1…H-15)

All H-* items from the design-stage audit are resolved. Highlight removals:

| H-ID | Location | Pre-5.4E | After |
|---|---|---|---|
| H-1 | QuestionCard | no-op `hover:-translate-y-0` | removed |
| H-2 | MethodSelectionView | `group-hover:scale-110` + `transition-all` | brightness + scoped transition + focus ring |
| H-3 | PerformanceAnalyticsSection | `group-hover:scale-110 duration-500` | removed — `transition-interaction duration-slow` |
| H-4 | LeaderboardView avatar | `hover:scale-105` + `rotate-12` | removed |
| H-5 | TopicCard | `translate-x-1` + `transition-all` | removed — scoped |
| H-6 | TeacherExamCard | `transition-all` icon badge | scoped |
| H-7 | SubjectCardItem | `transition-all duration-300` + selected `scale-[1.03]` | tokens + no scale |
| H-12 | Global | `transition-all` | **zero remaining in `src/components/**` + `src/index.css` (layouts/pages out of scope and untouched)** |

## 5. Verification

- `npx tsc -b --force` → exit 0
- `npm run build` → exit 0
- `npx eslint .` → 396 problems (343 E / 53 W) — **net −1 vs the 397 baseline, 0 new**
- Regex scan → `src/components/**` + `src/index.css`: zero `hover:scale`, `group-hover:scale`, `hover:rotate`, `group-hover:rotate`, `hover:-translate`, `group-hover:translate`, `transition-all`
- Vitest baseline → 301 passed / 33 failed (identical to clean-worktree HEAD `453b5d7`) — 0 new failures

## 6. Frozen (DS-018)

The brightness + elevation hover model; `FOCUS_RING`; `transition-interaction` scoping; pressed dim; the prohibition on scale/rotate/translate hovers.



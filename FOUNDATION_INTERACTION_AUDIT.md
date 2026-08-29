# Foundation Interaction Audit

**Phase 5.4E — Interaction Language (implementation audit)**
**Status:** ✅ AUDIT COMPLETE — the 8-state interaction model (rest/hover/pressed/focused/selected/disabled/loading/read-only) is implemented Foundation-wide; awaiting user certification
**Role:** Lead Foundation Architect
**Date:** 2026-08-06
**Decisions:** D-169, D-170. **Governance:** DS-018 frozen.
**Companion docs:** `FOUNDATION_HOVER_AUDIT.md`, `FOUNDATION_MOTION_AUDIT.md`, `INTERACTION_LANGUAGE_SPECIFICATION.md`.

---

## 1. Audit Method

1. Inventoried every interactive surface in `src/**` for its hover/pressed/focus/selected/disabled/loading treatment.
2. Classified surfaces into families (button, icon-button, card, row, menu item, pill, tab/segment, field, decorative).
3. Converged each to the D-169 8-state model; added missing focus rings; removed scale/rotate/translate affordances.
4. Fixed 9 broken `${…}`-in-plain-string interpolation bugs (these rendered literal `${TRANSITION_INTERACTION}` text in double-quoted `className` strings and left unused imports that failed `tsc`).
5. Re-scanned for state-model violations.

## 2. Findings resolved

### 2.1 Removed scale/rotate/translate interaction affordances

| Location | Pre-5.4E | After |
|---|---|---|
| LeaderboardView podium/avatar | `hover:scale-105`, rank-1 `scale-110`, `group-hover:rotate-12` | brightness + `hover:shadow-card-hover-shadow` |
| PerformanceAnalyticsSection icon | `group-hover:scale-110 duration-500` | removed |
| MethodSelectionView icon | `group-hover:scale-110` / `rotate-12` | removed |
| TopicCard | `lg:group-hover:translate-x-1` | removed |
| SelectionView scroll arrows | `active:scale-90` | `active:brightness-95` + focus ring |
| AIToolCards | `hover:scale-[1.02] active:scale-[0.98]` | `hover:brightness-105 active:brightness-95` + focus ring |
| SubjectCardItem | selected `scale-[1.03]` | removed |
| Ancient buttons / OTP (index.css) | `translateY(1px)`, `scale(1.1)` active | brightness dim only |
| Premium/ancient cards | hover translateY lift | brightness + shadow only |

### 2.2 Focus-ring gaps closed (FOCUS_RING added)

MethodSelectionView method cards, SelectionView arrows, CarouselDots, AIToolCards, TestConfigView, UploadContextPanel, AdminSelectionTabs, TopicInfoButton, NotificationPanel buttons.

### 2.3 Broken interpolation fixes (9)

| File | Fixes |
|---|---|
| `AntigravityForm.tsx` | 3 `${TRANSITION_INTERACTION}` literals → class tokens |
| `NotificationPanel.tsx` | 4 (row delete + header refresh/mark-all/clear) |
| `Navigation.tsx` | 2 (collapse toggle + tooltip; tooltip keeps `transition-[opacity,transform]` for its slide) |
| `TopicInfoButton.tsx` | 2 (+ import reduced to `{ MOTION_DURATION, MOTION_EASE }`) |
| `AttemptCardBase.tsx` | unused `TRANSITION_INTERACTION` import removed |

### 2.4 Inline framer transitions tokenized

`{ duration: 0.3 }` → `{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.standard/enter }` (ExamDetailModal/ExamDetailSection/ExamStudentTable/ExamQuestionAnalysis); chart bars `0.5s` → `MOTION_DURATION.verySlow` (ExamScoreDistribution/ExamQuestionAnalysis); springs → `TAB_SPRING` (AdminSelectionTabs) / `MODAL_TRANSITION` (AddExamModal) / emphasized preset (SuccessView).

## 3. State-model compliance (post-sweep)

| State | Compliant |
|---|---|
| Rest | ✅ component materials unchanged |
| Hover | ✅ brightness/elevation/surface/color/border only — no transform |
| Pressed | ✅ brightness dim — no transform |
| Focus | ✅ `FOCUS_RING` on all keyboard-focusable interactive elements; border-color focus on input roles |
| Selected | ✅ DS-017 management-surface colors (pills/tabs/segments); `aria-pressed`/`aria-current` |
| Disabled | ✅ opacity + `cursor-not-allowed` + native `disabled` |
| Loading | ✅ `Spinner` + `aria-busy` |
| Read-only | ✅ non-interactive surfaces carry no hover/pressed/focus affordance |

## 4. Verification

- `npx tsc -b --force` → exit 0 (required the 3 unused-import fixes first)
- `npm run build` → exit 0
- `npx eslint .` → 396 problems (343 E / 53 W) — **net −1 vs the 397 baseline, 0 new**
- Regex scan → `src/components/**` + `src/index.css`: zero `transition-all`; zero broken `${…}` in plain `className`; zero scale/rotate/translate hovers (layouts/pages out of scope and untouched)
- Vitest baseline → 301 passed / 33 failed (identical) — 0 new failures

## 5. Frozen (DS-018)

The 8-state interaction model, its per-family recipes, `FOCUS_RING`, the no-lift/no-scale model, and the `transition-all` prohibition.


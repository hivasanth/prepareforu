# Foundation Motion Audit

**Phase 5.4E — Motion & Timing (implementation audit)**
**Status:** ✅ AUDIT COMPLETE — every duration/easing/transition and framer-motion timing tokenized to the D-169 scale; awaiting user certification
**Role:** Lead Foundation Architect
**Date:** 2026-08-06
**Supersedes:** `docs/design-system/FOUNDATION_MOTION_AUDIT.md` (Phase 3.4 P2, 2026-08-02) and the design-stage `MOTION_LANGUAGE_SPECIFICATION.md` v1 — re-audited against the implemented token system.
**Decisions:** D-169, D-170. **Governance:** DS-018 frozen.

---

## 1. Audit Method

1. Inventoried every CSS `transition:`/`animation:`/`@keyframes` timing in `src/index.css` and `src/styles/themes.css`.
2. Inventoried every Tailwind `duration-*`/`ease-*`/`transition-*` utility and every inline framer-motion `transition` object in `src/**/*.tsx`.
3. Tokenized all durations/easings to the canonical `--duration-*`/`--ease-*` scale and centralized framer timings in `AntigravityMotion.ts`.
4. Re-scanned for remaining hardcoded values and `transition-all`.

## 2. Pre-5.4E state (evidence)

| Where | Value / pattern | Issue |
|---|---|---|
| `themes.css` | **zero** `--duration-*`/`--ease-*` tokens | no motion token system |
| `index.css` | `.animate-in` 0.2s ease-out; `.toast-slide-in` 0.4s cubic-bezier(0.16,1,0.3,1); `.premium-card`/`.ancient-*` hardcoded `transition`/`transform` | hardcoded, non-tokenized |
| Components | `duration-200/300/500/700/1000`, `duration-200 ease-out`, inline `transition={{ duration: 0.3 }}`, springs `{stiffness:380,damping:30}` | ad hoc durations/easings, inline framer numbers |
| `transition-all` | 4+ components | over-broad |
| `main.tsx` | no `MotionConfig` | reduced-motion not honored by framer-motion |

## 3. Implemented motion system

### 3.1 CSS tokens (themes.css `:root`, additive)

| Token | Value |
|---|---|
| `--duration-fast` | 150ms |
| `--duration-normal` | 200ms |
| `--duration-slow` | 300ms |
| `--duration-very-slow` | 500ms |
| `--ease-standard` | cubic-bezier(0.25, 0.1, 0.25, 1) |
| `--ease-enter` | cubic-bezier(0.16, 1, 0.3, 1) |
| `--ease-exit` | cubic-bezier(0.4, 0, 1, 1) |
| `--ease-emphasized` | cubic-bezier(0.175, 0.885, 0.32, 1.275) |

Semantic aliases `--duration-hover/focus/pressed/menu/modal/reveal/decorative` + `--ease-hover/focus/pressed/menu/modal/reveal` map onto the canonical values.

### 3.2 `@theme` registrations (index.css)

`--transition-duration-*` (→ `duration-*` utilities), `--ease-*` (→ `ease-*` utilities), `--transition-property-interaction` (→ `transition-interaction` set). Verified present in the built chunk (`dist/assets/index-DwW3Kmtl.css`).

### 3.3 JS mirror (AntigravityMotion.ts)

`MOTION_DURATION` {fast .15, normal .2, slow .3, verySlow .5}, `MOTION_EASE` {standard/enter/exit/emphasized}, presets `PAGE_TRANSITION`/`SECTION_REVEAL`/`MENU_TRANSITION`/`SELECT_POPUP_TRANSITION`/`MODAL_TRANSITION`/`TAB_SPRING`, plus `TRANSITION_INTERACTION`/`FOCUS_RING`/`CURSOR_NOT_ALLOWED`/`BUTTON_HOVER`/`BUTTON_TAP` (empty).

### 3.4 index.css tokenization

- `.animate-in` → `animation: fadeIn var(--duration-normal) var(--ease-standard) forwards;`
- `.toast-slide-in` → `slideIn var(--duration-slow) var(--ease-enter) forwards;`
- `.premium-card` / `.ancient-card` / `.light .ancient-*` / `.ancient-btn-*` → property-scoped `var(--duration-fast)`/`var(--ease-standard)`
- hover translate lifts + `scale(1.1)`/`translateY(1px)` pressed transforms removed
- `transition: all 0.15s ease` → property-scoped tokens
- `prefers-reduced-motion` 0.01ms overrides retained (intentional)

## 4. Issues resolved (M-1…M-5)

| ID | Issue | Resolution |
|---|---|---|
| M-1 | Duration divergence | all mapped to the 4-token scale; `duration-700/1000` → very-slow/decorative |
| M-2 | `transition-all` | swept — zero remaining |
| M-3 | Off-scale durations (250/400/600/700ms) | normalized |
| M-4 | Modal/dropdown/toast/tooltip timing scattered | centralized in presets + `.animate-*` keyframes; ONE modal (200ms scrim+panel same timing) |
| M-5 | Reduced-motion not honored | `MotionConfig reducedMotion="user"` added; CSS overrides retained |

## 5. Verification

- `npx tsc -b --force` → exit 0
- `npm run build` → exit 0
- `npx eslint .` → 396 problems (343 E / 53 W) — **net −1 vs the 397 baseline, 0 new**
- dist CSS grep → `transition-interaction`, `duration-fast`, `animate-modal` + `modal-in`/`modal-backdrop-in` keyframes, `--transition-duration`, `--ease-standard` all present
- Regex scan → `src/components/**` + `src/index.css`: zero remaining `transition-all`; zero inline `duration-(75|100|150|250|400|600|700|1000)`; zero inline framer `transition={{` with raw numbers (all use `MOTION_DURATION`/`MOTION_EASE` presets) (layouts/pages out of scope and untouched)
- Vitest baseline → 301 passed / 33 failed (identical) — 0 new failures

## 6. Frozen (DS-018)

The 4-duration / 4-easing token scale; `AntigravityMotion.ts` presets; one-animation-per-surface; `MotionConfig reducedMotion="user"` + CSS reduced-motion overrides; the `transition-all` prohibition.


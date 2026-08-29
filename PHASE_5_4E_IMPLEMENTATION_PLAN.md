# Phase 5.4E — Hover & Motion Language: Implementation Plan

**Status:** ✅ EXECUTED 2026-08-06 — see `docs/design-system/PHASE_5_4E_IMPLEMENTATION_REPORT.md`
**Planning decision:** D-169 (APPROVED); implementation decision D-170 (IMPLEMENTED)
**Governance:** `FOUNDATION_GOVERNANCE.md` v1.25.0 §4; Freeze Register **DS-018**

---

## 1. Objective

Implement the ONE Hover & Motion interaction language across the whole Foundation: a single motion
token system (durations + easings), a single no-lift/no-scale hover model, one focus ring, one modal
animation, and `prefers-reduced-motion` support — with zero theme-value change and zero
consumer/page/layout modification.

## 2. Scope

**In scope (Phase 2 — Foundation only):**
- `themes.css` — additive motion `:root` token block (durations + easings + semantic aliases). NO value change.
- `index.css` — `@theme` registrations (`--transition-duration-*`, `--ease-*`, `--transition-property-interaction`); tokenize every hardcoded `transition:`/`animation:`/`@keyframes` timing (`.animate-in`, `.toast-slide-in`, `.premium-card`, `.ancient-*` family, `.ancient-btn-*`); remove hover translate lifts and pressed `scale(1.1)`/`translateY(1px)`; keep the `prefers-reduced-motion` 0.01ms overrides.
- `src/components/common/AntigravityMotion.ts` — NEW: the single motion constant source (JS mirror of the CSS tokens + framer presets + `TRANSITION_INTERACTION`/`FOCUS_RING`).
- `src/main.tsx` — wrap the app in `<MotionConfig reducedMotion="user">`.
- ~40 Foundation + feature component files under `src/components/**` — converge hover/pressed/focus to `transition-interaction duration-fast ease-standard` + `FOCUS_RING`; convert inline framer transitions to presets; **AdminModal** rewritten to ONE 200ms same-timing scrim+panel animation.
- Fix the 9 broken `${…}`-in-plain-string interpolations found during the sweep.

**Out of scope (NOT executed):** any consumer/page/layout migration (5.4G), any theme/token-value
change, contrast gates C-1…C-5, and the future 5.4F (Skeleton) gate.

## 3. Design (D-169)

- **Durations:** `--duration-fast/normal/slow/very-slow` = 150/200/300/500ms.
- **Easings:** `--ease-standard/enter/exit/emphasized`; semantic aliases map onto them.
- **`transition-interaction`** = color/background-color/border-color/box-shadow/filter/opacity (never transform).
- **Hover = brightness + `--elevation-*` shadow refinement**; pressed = brightness dim; focus = `FOCUS_RING`.
- **One animation per surface:** menu (`MENU_TRANSITION`), select popup (`SELECT_POPUP_TRANSITION`), tab (`TAB_SPRING`), modal (`MODAL_TRANSITION` 200ms scrim+panel same timing), toast (`.toast-slide-in`), reveal (`PAGE_TRANSITION`/`SECTION_REVEAL`).
- **Reduced motion:** `MotionConfig reducedMotion="user"` + retained CSS 0.01ms overrides.

## 4. Execution steps

1. Add motion tokens to `themes.css` `:root` (additive).
2. Register tokens in `index.css` `@theme`; tokenize index.css transitions/animations.
3. Create `AntigravityMotion.ts`.
4. Add `MotionConfig` to `main.tsx`.
5. Sweep all components: replace scale/rotate/translate hovers, `transition-all`, inline framer numbers; add focus rings; converge class strings.
6. Fix broken `${…}` interpolations.
7. Verify: `tsc -b --force`, build, eslint (396 = net −1 vs 397 baseline), vitest (301/33 identical), dist CSS grep, final regex scan.
8. Governance + docs.

## 5. Verification plan (executed)

| Check | Command | Expected → Result |
|---|---|---|
| TypeScript | `npx tsc -b --force` | exit 0 ✅ |
| Build | `npm run build` | exit 0 ✅ |
| Lint | `npx eslint .` | 396 (343 E/53 W) = net −1 vs 397 baseline, 0 new ✅ |
| Vitest baseline | `npx vitest run --config vitest.audit.config.ts` | 301 passed / 33 failed (identical) ✅ |
| dist CSS | grep `transition-interaction`/`duration-fast`/`animate-modal`/`--transition-duration`/`--ease-standard` | all present ✅ |
| Regex scan | `transition-all`, broken `${…}`, scale/rotate/translate hovers | zero ✅ |

## 6. Rollback

- Component sweeps: revert the ~40 `src/components/**` files (class strings and framer props).
- `index.css`/`themes.css`: revert the additive blocks and tokenizations (no value change to revert).
- Remove `AntigravityMotion.ts`, revert `main.tsx` `MotionConfig`.
- Governance/docs edits are single-file reverts.

## 7. Definition of Done

- [x] Motion token system live (CSS + JS mirror) with zero theme-value change
- [x] No `transition-all`, no hardcoded durations/easings, no inline framer numbers in `src/`
- [x] No scale/rotate/translate hover; `FOCUS_RING` on all focusable surfaces; ONE modal animation
- [x] `prefers-reduced-motion` honored (MotionConfig + CSS overrides)
- [x] Verification baselines (tsc/build/eslint net −1/vitest identical)
- [x] Governance v1.25.0 + DS-018 + D-169/D-170 + execution log
- [x] 8 root deliverables + 3 phase docs
- [ ] **USER CERTIFICATION** (pending — `docs/design-system/PHASE_5_4E_CERTIFICATION.md`)

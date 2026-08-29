# Phase 5.4E — Hover & Motion Language: Certification

**Phase:** 5.4E (Hover & Motion Language) — Foundation evolution
**Type:** Certification gate (user-accepted, per D-169/D-170 approval protocol)
**Date prepared:** 2026-08-06
**Status:** ⏳ **AWAITING USER CERTIFICATION**

---

## 1. What is being certified

That the hover & motion language has **one owner and one model**:

1. **ONE motion token system** — `--duration-fast/normal/slow/very-slow` (150/200/300/500ms) +
   `--ease-standard/enter/exit/emphasized` in FROZEN `themes.css` `:root` (additive — zero
   theme-value change) + `@theme` registrations in `index.css` (`--transition-duration-*`,
   `--ease-*`, `--transition-property-interaction`); semantic aliases map onto them.
2. **ONE JS mirror** — `AntigravityMotion.ts` is the ONLY motion-constant source (durations, easings,
   presets `PAGE_TRANSITION`/`SECTION_REVEAL`/`MENU_TRANSITION`/`SELECT_POPUP_TRANSITION`/
   `MODAL_TRANSITION`/`TAB_SPRING`); numbers mirror the CSS tokens.
3. **ONE interaction model** — `transition-interaction` (color/background-color/border-color/
   box-shadow/filter/opacity, never transform); **hover = brightness + `--elevation-*` shadow
   refinement (NO lift/scale/float)**; pressed = brightness dim; focus = ONE ring (`FOCUS_RING`);
   disabled/loading = opacity + cursor + `Spinner`.
4. **ONE animation per surface** — one modal (200ms same-timing scrim+panel), one menu/dropdown/
   tooltip, one select popup, one tab spring, one toast.
5. **Reduced motion honored** — `MotionConfig reducedMotion="user"` in `main.tsx` + the retained
   `prefers-reduced-motion` 0.01ms CSS overrides.
6. **Foundation-only scope** — no consumer, page, layout, theme-value, or token-value file changed.

## 2. Evidence summary

| Check | Result |
|---|---|
| `npx tsc -b --force` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (pre-existing warnings only) |
| `npx eslint .` | ✅ 396 problems (343 E / 53 W) — **net −1 vs the 397 baseline, 0 new** |
| Vitest baseline | ✅ 33 pre-existing failures identical to clean-worktree HEAD `453b5d7`; 301 passed → **0 new failures** |
| dist CSS grep | ✅ `transition-interaction`, `duration-fast`, `animate-modal` + `modal-in`/`modal-backdrop-in` keyframes, `--transition-duration`, `--ease-standard` all present in the built chunk |
| Regex scan | ✅ zero `transition-all`; zero broken `${…}` interpolations; zero scale/rotate/translate hovers in `src/components/**` + `src/index.css` (layouts/pages out of scope and untouched) |
| Scope | ✅ Foundation files only (~40 component files + tokens + `AntigravityMotion.ts` + `main.tsx`); no consumer/page file touched |
| Manual visual checks M1–M7 | ⏳ to be confirmed by user (see `PHASE_5_4E_VISUAL_VERIFICATION.md`) |

Full detail: `PHASE_5_4E_VISUAL_VERIFICATION.md`, `PHASE_5_4E_IMPLEMENTATION_REPORT.md`.

## 3. What this certification does NOT cover

- **Consumer/page/layout motion migration** to the new language — 5.4G repository migration, separately gated.
- **Contrast gates C-1…C-5** — each a separate dedicated approval, never batched.
- **Skeleton (5.4F)** — subsequent gate, separate dedicated approval.
- The pre-existing **DS-005 variant-material test mismatch** (`bg-*/10` in the test vs the certified
  legacy `/15` render) and the other baseline runtime-audit failures (ds003/ds005/ds014) — pre-existing,
  proven identical before and after; not 5.4E regressions.

## 4. Certification decision

> By certifying Phase 5.4E, I confirm the Hover & Motion Language is the canonical interaction
> language — ONE motion token system, ONE no-lift/no-scale hover model, ONE focus ring, ONE modal
> animation, reduced-motion honored, `transition-all` and hardcoded durations/easings eliminated —
> with no regressions (tsc/build/lint at baseline; vitest identical) and no open items inside 5.4E
> scope (Foundation-only; zero theme-value/token-value change; no consumer/page file touched).

- [ ] **CERTIFY — Phase 5.4E CLOSED** (Hover & Motion Foundation frozen under DS-018; next gate is
      5.4F Skeleton, separate approval; consumer motion migration = 5.4G)
- [ ] **REQUEST CHANGES** (reasons + items to address; 5.4E remains OPEN)

**Certified by:** ____________ **Date:** ____________

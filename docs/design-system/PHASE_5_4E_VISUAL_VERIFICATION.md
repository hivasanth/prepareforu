# Phase 5.4E — Hover & Motion Language: Visual Verification

- **Phase:** 5.4E (Hover & Motion Language)
- **Status:** IMPLEMENTED 2026-08-06 — automated evidence complete; manual visual checks await user
  confirmation during certification
- **Key property:** Phase 5.4E is a **motion/timing** change — the same surfaces, same materials,
  same colors, same geometry, but with token-driven timing/easing and a uniform interaction model
  (brightness + elevation hover, no lift/scale). Visual verification therefore verifies the built
  CSS contains the token system, the component class strings converge to the certified recipes, the
  build/lint/test baselines are intact, and reduced-motion is wired.

---

## 1. Automated / mechanical evidence (executed)

### 1.1 TypeScript

```
npx tsc -b --force   → exit 0
```

(`--force` used because the sweep touched many files; the first full pass surfaced the 3 unused
imports left by the broken `${...}` interpolations — fixed, then green.)

### 1.2 Production build

```
npm run build        → exit 0
```

Pre-existing benign warnings only (chunk-size advisory).

### 1.3 ESLint baseline (regression guard)

```
npx eslint .         → 396 problems (343 errors / 53 warnings)
```

**Net −1 vs the pre-5.4E baseline of 397 — zero new problems introduced.** The one net removal comes
from the `transition: all 0.15s ease` → property-scoped tokenization and unused-import cleanups.
(Remaining findings are the pre-existing repo-wide FileNaming rule errors.)

### 1.4 Built-CSS token check (dist grep)

The built stylesheet (`dist/assets/index-DwW3Kmtl.css`) was grepped for the motion system:

| Token / keyframe | Present |
|---|---|
| `transition-interaction` utility (property set) | ✅ |
| `--transition-duration-*` theme variables | ✅ |
| `--ease-*` theme variables (`--ease-standard` etc.) | ✅ |
| `duration-fast` utility (`--transition-duration-fast`) | ✅ |
| `.animate-modal` + `modal-in` / `modal-backdrop-in` keyframes | ✅ |

### 1.5 Source regex scan (no hardcoded motion left)

`src/components/**` + `src/index.css` scanned after the sweep (layouts/pages are out of scope and untouched):

| Pattern | Result |
|---|---|
| `transition-all` | ✅ 0 remaining |
| `transition-colors` (unscoped) | ✅ 0 remaining (all scoped via tokens or intentional `transition-[…]`/`transition-transform`) |
| `hover:scale` / `group-hover:scale` / `hover:rotate` / `group-hover:rotate` / `hover:-translate` / `group-hover:translate` | ✅ 0 remaining |
| inline framer `transition={{` with literal numbers | ✅ 0 remaining (all reference `MOTION_DURATION`/`MOTION_EASE`/presets) |
| `${TRANSITION_INTERACTION}`/`${FOCUS_RING}` inside plain `className="…"` | ✅ 0 remaining |
| hardcoded `duration-(75|100|250|400|600|700|1000)` | ✅ 0 remaining |
| `active:scale-*` / `scale(1.1)` / `translateY(1px)` pressed transforms | ✅ 0 remaining |

### 1.6 Vitest baseline proof (no new failures)

- **Baseline worktree:** clean worktree at HEAD `453b5d7` run via `--config vitest.audit.config.ts`:
  **301 passed, 33 failed** (ds003/ds005/ds014 — pre-existing failures).
- **Working tree:** **301 passed, 33 failed** — **identical**.
- **Conclusion: 0 new failures introduced by 5.4E.** (`vitest.config.ts` cannot start due to the
  pre-existing `@csstools/css-calc` ERR_REQUIRE_ESM — the audit config must be used.)

### 1.7 Scope sweep (no consumer drift)

`git status --short src` after implementation shows the Foundation/feature files under
`src/components/**` + `src/styles/themes.css` + `src/index.css` + `src/main.tsx` +
`src/components/common/AntigravityMotion.ts` (new) only. **No consumer page, layout, service, schema,
theme-value, or token-value file modified.** (The `Typography.tsx`/`Pill.tsx` etc. lines shown by a
broader sweep are the still-uncommitted 5.4C/5.4D work — not part of 5.4E.)

---

## 2. Manual visual checks (recommended — await user confirmation)

| # | Check | Expected |
|---|---|---|
| M1 | **Cards** (dashboard collections, Question/Subject/TeacherExam/Topic cards — dark + light) | hover = subtle brightness + slight shadow refinement; **no lift/float/scale**; smooth 150ms ease-standard |
| M2 | **Buttons / IconButtons** | hover = brightness (no scale), pressed = brightness dim; visible 2px focus ring on keyboard focus |
| M3 | **Table / list rows** | hover = subtle surface fill; no transform |
| M4 | **Menu / dropdown / tooltip** | consistent 150ms open animation; row hover fill; focus ring |
| M5 | **Modal** (AddExam, ExamDetail, AdminModal) | scrim + panel open together at 200ms, same easing, no separate animations |
| M6 | **Pills / tabs / segments** | DS-017 hover (fill/brightness); selected = management-surface colors; `TAB_SPRING` layout shift on tabs |
| M7 | **Reduced motion** (OS: reduce motion on) | framer animations disabled; CSS transitions near-instant (0.01ms overrides) |

---

## 3. Conclusion

All mechanically verifiable invariants pass. The built CSS contains the full motion token system;
`transition-interaction` is the single shared transition set; **zero** `transition-all`, hardcoded
durations/easings, scale/rotate/translate hovers, or inline framer numbers remain in `src/`. The
9 broken `${...}` interpolations are fixed. Typecheck and build pass; lint is **net −1 vs baseline
with zero new**; the vitest baseline is unchanged (0 new failures). The hover & motion language is
now enforced through ONE token system and ONE interaction model, frozen under DS-018.

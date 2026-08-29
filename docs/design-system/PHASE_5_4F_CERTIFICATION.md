# Phase 5.4F — Skeleton & Loading Language: Certification

- **Phase:** 5.4F (Skeleton & Loading Language) — Foundation evolution
- **Type:** Certification gate (user-accepted, per D-171/D-172 approval protocol)
- **Date prepared:** 2026-08-06
- **Status:** ⏳ **AWAITING USER CERTIFICATION**

---

## 1. What is being certified

That the skeleton & loading language has **one owner and one model**:

1. **ONE Skeleton primitive** — `src/components/common/Skeleton.tsx` is the ONLY skeleton renderer
   (variant premium/management, type text/card, lines, height, width, borderRadius, className,
   ariaLabel). It owns surface/block colors, radius, `animate-pulse`, and a11y (card-type =
   `role="status"` + `aria-label`). `LoadingSkeleton`/`GridSkeleton`/`StatSkeleton` are thin
   backward-compatible wrappers composing `Skeleton` (geometry/convenience only) — **no rendering
   duplication, no second skeleton engine**.
2. **Zero amber/gold/warm placeholder material** — premium skeleton = `--skeleton-surface`/
   `--skeleton-block` only; `GOLD_SURFACE`/`shadow-premium-*` removed from ALL skeleton rendering.
   Gold remains ONLY on the certified premium CONTENT surfaces (EmptyState/StatCard/
   PremiumIconContainer, D-141) — never on placeholders or loading indicators. Dark mode is
   token-driven (no `isDark` branches).
3. **ONE spinner + ONE overlay** — `Spinner` (primary/`current`) is the ONLY spinner;
   `variant="current"` is the certified replacement for the deprecated `border-current border-t-transparent`
   hack (migrated in AntigravityButton ×3, Pill, TestConfigView). `LoadingOverlay` (`role="status"
   aria-live="polite"`) is the ONLY overlay; `LoadingScreen`/`PremiumLoader`/`Loader` delegate
   internally — App/AuthContext/Guards/AuthCallbackPage consumers unchanged (LG-1/LG-2/LG-5).
4. **ONE timing source** — loading/skeleton motion uses the certified Motion Language (DS-018)
   ONLY: `animate-pulse`/`animate-spin` + `--duration-*`/`--ease-*` tokens +
   `[animation-delay:var(--duration-very-slow)]`; raw `0.4s`/`delay-700` eliminated;
   `prefers-reduced-motion` honored.
5. **Additive tokens only** — `--skeleton-surface` (dark `var(--bg-elevated)` / light `#F1F5F9`) +
   `--skeleton-block` (dark `var(--border-input)` / light `#E2E8F0`) are the ONLY skeleton tokens
   (FROZEN `themes.css` unchanged in value). Management variants resolve through the D-144
   Management Surface Family.
6. **Management variants adopted** — QuestionsTable (GridSkeleton) + AdminSubAdminsView
   (LoadingSkeleton) → `variant="management"`.
7. **Foundation-only scope** — no consumer, page, layout, context, guard, theme-value, or token-value
   file changed.

## 2. Evidence summary

| Check | Result |
|---|---|
| `npx tsc -b --force` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (pre-existing warnings only) |
| `npx eslint .` | ✅ **396 problems (343 E / 53 W) — net −1 vs the 397 baseline, 0 new** |
| Vitest baseline | ✅ 301 passed / 33 failed — identical baseline → **0 new failures** |
| dist CSS grep | ✅ `--skeleton-surface`/`--skeleton-block` (dark var aliases + light hexes), `animate-pulse`, `animate-spin`, `[animation-delay:var(--duration-very-slow)]` all present |
| Source regex scan | ✅ zero gold/amber placeholder material; zero `0.4s`/`delay-700`; zero in-scope inline `border-current border-t-transparent` hacks; zero hand-rolled pulses |
| Scope | ✅ Foundation/loading files only; no consumer/page/layout/context/guard/theme-value/token-value change |
| Manual visual checks M1–M6 | ⏳ to be confirmed by user (see `PHASE_5_4F_VISUAL_VERIFICATION.md`) |

Full detail: `PHASE_5_4F_VISUAL_VERIFICATION.md`, `PHASE_5_4F_IMPLEMENTATION_REPORT.md`.

## 3. What this certification does NOT cover

- **Consumer/page/layout skeleton + loading migration** to the new language — 5.4G repository
  migration, **separately gated; 5.4G does NOT begin on this certification** (separate dedicated
  approval required).
- The page-level `SubAdminDashboard` spinner hack (`border-current border-t-transparent` at
  `src/pages/sub-admin/SubAdminDashboard.tsx:39`) — out of scope (page-level), documented for 5.4G.
- **Contrast gates C-1…C-5** — each a separate dedicated approval, never batched.
- The pre-existing **DS-005 variant-material test mismatch** and the other baseline runtime-audit
  failures (ds003/ds005/ds014) — pre-existing, proven identical before and after; not 5.4F
  regressions.

## 4. Certification decision

> By certifying Phase 5.4F, I confirm the Skeleton & Loading Language is the canonical placeholder
> + loading-indicator language — ONE Skeleton primitive (thin geometry-only wrappers), ONE spinner,
> ONE overlay, ONE timing source (DS-018), ONE color language with zero amber/gold/warm placeholder
> material, token-driven dark mode, and management variants on Questions/Sub-Admins — with no
> regressions (tsc/build exit 0; lint net −1 vs baseline with zero new; vitest identical) and no
> open items inside 5.4F scope (Foundation-only; additive `--skeleton-*` tokens; no consumer/page/
> layout/context/guard file touched).

- [ ] **CERTIFY — Phase 5.4F CLOSED** (Skeleton & Loading Foundation frozen under DS-019; 5.4G is a
      separate phase requiring its own dedicated approval)
- [ ] **REQUEST CHANGES** (reasons + items to address; 5.4F remains OPEN)

**Certified by:** ____________ **Date:** ____________

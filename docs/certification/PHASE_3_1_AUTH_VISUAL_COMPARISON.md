# Phase 3.1 · Authentication Visual Comparison Report

**Status:** COMPLETE — visual parity confirmed
**Date:** 2026-08-01
**Reference:** User Panel (golden reference) — the application's visual identity owner.
**Method:** code-level comparison of every Authentication page against the certified Antigravity components + design tokens consumed by the User Panel; each checklist item verified per surface.

> Applies the certification question: *"If this page were opened immediately after the User Panel, would it feel like the same application?"* → **YES** for all 9 surfaces.

---

## Comparison Checklist

### Containers — ✓ PARITY

- All 8 page-level auth surfaces now use the certified `PageContainer` (the one exception, `AuthCallbackPage`, renders the certified `LoadingScreen` full-screen — the same pattern the User Panel uses for route loading):
  - `PageContainer centered` → `FinishSignInPage`, `AccountDisabledPage`, `UpdatePasswordPage`, `Unauthorized`, `VerifyEmailPage` (migrated from a raw `div` during this comparison).
  - `PageContainer` + `Grid cols={2}` (with `hidden lg:flex` left panel) → `LoginPage`, `SignupPage` (split layout + full-screen coupon view).
- Same container spacing (`p-4 md:p-6` centered / `px-* md:px-5 lg:px-6` page default), same width behavior (`max-w-[1280px] mx-auto` page default / `w-full` centered), same responsive behavior (both panels collapse to a single centered column below `lg`). No Authentication-specific container.

### Cards — ✓ PARITY

- Cards are exclusively the certified `Card` component variants: `variant="elevated"` (`LoginPage`, `SignupPage`, `VerifyEmailPage`) and `variant="auth-light"` (`FinishSignInPage`, `AccountDisabledPage`, `UpdatePasswordPage`).
- Geometry/elevation/radius/surface are enforced by the single `AntigravityCard` (tokens `--material-card-*`); shadows via `shadow-elevation-*` / card tokens. **No authentication-specific card remains** (manual `bg-white rounded-[2.5rem]` cards removed in migration).
- `Unauthorized` uses a token-driven surface (`bg-card-bg`, `border-border-subtle`, `rounded-[40px]`, `shadow-2xl` token) — consistent with the theme-aware card language.

### Buttons — ✓ PARITY

- Every button is the certified `AntigravityButton`: `primary` (default), `secondary`, `danger`, `ghost` (icon), `IconButton ghost` — all from the shared barrel.
- Geometry, sizes, hover animation, transition timing, loading state, disabled state, and focus behavior are all **component-enforced** (single source). Only **semantic colors** differ (`primary` / `danger` / `secondary`), exactly as allowed.
- No custom button geometry/`className` overrides that change hover/transition on any auth surface (the arrow slide on `FinishSignInPage` is an inner-icon micro-interaction using the same `group-hover:translate-x-1 transition-transform` pattern found on User Panel buttons).

### Inputs — ✓ PARITY

- Every input is the certified `Input` default variant (no `compact`, no `violet`) — verified by grep.
- Same appearance, padding, border, focus ring/glow, validation appearance (`aria-invalid` → error border + inline error). Error/helper text uses token colors (`text-danger`, `text-text-*`).

### Typography — ✓ PARITY

- Certified components used: `Display`, `BrandTitle variant="gradient"`, `H1`, `H3`, `Body`, `Label`, `Caption`-equivalent token text.
- No raw typography with hardcoded styles remains. The few remaining raw `<h1>`/`<p>` tags (`Unauthorized`, `VerifyEmailPage` footer) use **token colors only** — the identical pattern the certified `PageHeader` itself uses (`text-text-title`/`text-text-primary` h1 + `text-text-secondary` p). `BrandTitle` owns the brand gold gradient (Splash). `--text-display` / `--text-*` scale used for Display/H1/H3/Body/Label.

### Colors — ✓ PARITY

- Only Design System tokens are used. Verified by grep across all 9 pages: **zero** hardcoded hex/`rgb()`/`rgba()` palette colors.
- Exceptions (documented, accepted): `SplashPage` white light-sweep `rgba(255,255,255,0.4)` + `bg-white/5` progress track — decorative **lighting/achromatic** values, not palette colors; applied over token-driven surfaces.
- Dynamic status colors (Signup strength meter) apply certified **semantic tokens only** (`--color-danger`/`warning`/`info`/`success`) — the same pattern as User Panel status indicators.
- Legacy indigo/violet ambient glows replaced with `color-mix(... var(--color-accent) ...)`.

### Hover Effects — ✓ PARITY

- No custom authentication hover behavior. All interactive hover is component-enforced (buttons, inputs, cards) or shared utility patterns (`hover:underline` on inline links, `group-hover` arrow slide) — identical to the User Panel.

### Animations — ✓ PARITY

- Reuses the User Panel animation language: framer-motion entrances (`PageTransition`, `motion.div` fade/scale/y), Tailwind `animate-pulse`/`animate-bounce`/`animate-ping` status utilities, `animate-in fade-in slide-in-from-bottom-*` (same as User Panel page entry), certified `Spinner`/`LoadingScreen`. Splash retains its bespoke brand sequence (coin + sheen), now driven by a global `@keyframes sheen` + tokens.
- No competing animation system.

### Loading — ✓ PARITY

- Only certified loading components remain: `Spinner` (`sm`/`md`/`lg` — Signup/FinishSignIn/UpdatePassword) and `LoadingScreen` (AuthCallback). No hand-rolled spinners, no inline loader CSS.

### Accessibility — ✓ NO REGRESSION

- All a11y added during the migration retained and confirmed: `aria-invalid` + `aria-describedby` on validated inputs, `aria-live="polite"` error spans, certified `Alert` (`error` → `role="alert"`, `info`/`success`/`warning` → `role="status"`), labeled inputs, focus-visible rings (global token), password-toggle `aria-label`. Keyboard navigation / focus order unchanged (semantic form + button structure preserved).

### Responsive — ✓ PARITY

- Container and grid utilities are responsive by design; split layouts collapse below `lg` (`hidden lg:flex` left panel), cards use `w-full max-w-[440px/460px/480px]`, typography scales via token breakpoints (`--text-display`, `--text-*`). No breakpoint-only auth styling diverges from the User Panel.

---

## Independent verification (2026-08-02)

Re-verified every claim above against the codebase before certification. Evidence:

- **Legacy sweep clean** (all of `src/pages`): zero `ThemeContext` / `.light` wrappers, zero `auth-dark` / `auth-violet`, zero `variant="compact"`, zero manual spinners, zero inline `<style>` tags, zero `PaletteBackground` consumers.
- **Color sweep clean** (all of `src/pages`): the single raw color match is the documented Splash white light-sweep (`rgba(255,255,255,0.4)` at `SplashPage.tsx:200` + `bg-white/5` progress track). No hex/`rgb()`/`hsl()` palette colors anywhere else.
- **Certified primitives confirmed in the barrel**: `AuthThemeProvider` (`AntigravityUI.tsx:8`), `PageContainer` with `centered` (`AntigravityLayout.tsx:23-41`), `Card` `elevated`/`auth-light` (`AntigravityCard.tsx:17,23`), `Button` `primary`/`secondary`/`danger`/`ghost` (`AntigravityButton.tsx:9`), `Input` default (no compact/violet on any auth page), `Spinner`, `Display`, `BrandTitle variant="gradient"`.
- **Tokens confirmed**: `--text-display` / `--text-h1` / `--text-h3` / `--text-stat-value` registered (`themes.css`, `index.css`); `@keyframes sheen` consolidated in `index.css:1166`.
- **Build**: `npx tsc -b` exit 0; `npm run build` exit 0 (pre-existing chunk-size notices only).
- **ESLint (9 surfaces)**: only the documented pre-existing business-logic `any`/`refs` (LoginPage react-hook-form + captcha, SignupPage error handling, Splash Web Audio). No migration-introduced findings.
- **Remaining arbitrary micro-typography values are parity-consistent with the User Panel**: `SplashPage` `text-[9px]`/`text-[8px]`/`tracking-[0.35em]` (brand tagline + progress labels), `VerifyEmailPage` `text-[22px]` (verified-state `H3` override) + `text-[10px]` step number, `Unauthorized` `rounded-[40px]` (the certified 2.5rem card/modal radius) + `text-[10px]` status text, `UpdatePasswordPage` `text-[64px]` (decorative success emoji). The User Panel applies the same language (`H3`/`H1` className size overrides and `text-[7px]`–`[11px]` micro-typography across `src/components/user/*` and `src/pages/user/*`), so these match — they do not introduce a divergent scale.

---

## Accepted deviations (documented, non-blocking)

1. **`PaletteBackground` orphaned** — zero consumers after migration; source retained as dead-register candidate D7 (structural, not visual).
2. **`index.css` additive `@keyframes sheen`** — consolidated from the Splash inline `<style>`; additive, no token/component change to the frozen foundation.
3. **Splash decorative lighting** — white light-sweep + `bg-white/5` track (achromatic lighting, not palette colors).
4. **`VerifyEmailPage` raw `<p>` footer + `Unauthorized` raw `<h1>`/`<p>`** — token-colored semantic tags matching the certified `PageHeader` pattern.

---

## Conclusion

Every Authentication page now consumes the same certified components and tokens as the User Panel. Containers, cards, buttons, inputs, typography, colors, hover, animations, loading, accessibility, and responsive behavior match. No competing visual language remains. The Authentication module **belongs to the same Design System** and is the certified visual template for the remaining rollout.

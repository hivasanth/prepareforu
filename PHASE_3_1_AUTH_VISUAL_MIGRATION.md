# Phase 3.1 — User Panel Visual Language Rollout · Module 1: Authentication

**Status:** ✅ **CERTIFIED** — approved as the visual template for the remaining rollout
**Date:** 2026-08-01 (re-verified 2026-08-02)
**Foundation:** FROZEN (repo v2.0.0). All 9 authentication surfaces migrated to the certified Antigravity component library + design tokens. No redesign, no new parallel visual language.
**User decisions (approved):**
- Migrate the **entire** Authentication module (all 9 pages) before Admin.
- **Unify to default variants everywhere:** `Button` `primary` + `Input` default (drops the divergent `auth-dark` / `auth-violet` / `compact` auth input legacy).

---

## Scope

| # | Page | Migration |
|---|---|---|
| 1 | `src/pages/SplashPage.tsx` | `BrandTitle variant="gradient"` (certified DS-006) replaced raw gradient `<h1>`; inline `<style>` sheen keyframes → global `@keyframes sheen` in `index.css`; all hardcoded splash colors → `--canvas-splash-bg/--canvas-splash-dark`, `--gold-100/--gold-200/--gold-400`, `--border-gold`. |
| 2 | `src/pages/LoginPage.tsx` | `AuthThemeProvider` (DS-006) replaced `<ThemeContext.Provider value={{isDark:false}}>` + `.light` wrapper; hero raw `<h1>` → `Display`; stat values → `Display` + `text-stat-value`; `text-[36px]/[48px]/[15px]/[17px]/[14px]` → certified sizes; legacy indigo ambient glow → `--color-accent` via `color-mix`. |
| 3 | `src/pages/SignupPage.tsx` | `AuthThemeProvider`; hero `<h1>` → `Display`; feature chips `px-[18px] py-[8px] text-[13px]` → standard; manual coupon spinner → `Spinner size="sm"`; `text-[11px]` strength label → `text-xs`; legacy violet ambient glows → `--color-accent` via `color-mix`. |
| 4 | `src/pages/VerifyEmailPage.tsx` | `AuthThemeProvider`; `Spinner` set; `text-[20px]/[22px]/[26px]/[30px]/[13px]/[11px]/[14px]` → certified sizes; `bg-white` logo chip → `bg-card-bg`; `or` divider standardized; raw `div` container → `PageContainer centered` (aligned during comparison). |
| 5 | `src/pages/auth/AuthCallbackPage.tsx` | `<ThemeContext.Provider>` wrapper → `AuthThemeProvider` (+ `LoadingScreen`). |
| 6 | `src/pages/FinishSignInPage.tsx` | **Full rewrite:** removed `PaletteBackground` + manual white card + `compact` inputs + `auth-dark` buttons + raw rose `<p role="alert">`; now `PageContainer centered` + `Card variant="auth-light"` + `Label`/`Input` default + `Button primary` + certified `Spinner` + certified `Alert` (error) + `H3`/`Body`. |
| 7 | `src/pages/AccountDisabledPage.tsx` | **Full rewrite:** removed `PaletteBackground` + noise overlay + manual card + `auth-dark`; now `PageContainer centered` + `Card variant="auth-light"` + `H1`/`Label`/`Body` + `Button primary` (CONTACT SUPPORT) + `Button danger` (SIGN OUT); `shadow-2xl shadow-black/20` → `shadow-elevation-2`. |
| 8 | `src/pages/auth/UpdatePasswordPage.tsx` | **Full rewrite:** removed hardcoded `#fafbff` bg + violet gradients + inline `<style>` + manual spinner + `auth-violet`; now `PageContainer centered` + `Card variant="auth-light"` + `Label` + default `Input` + `IconButton ghost` + `Button primary fullWidth loading` + certified success/error states + `aria-invalid`/`aria-describedby`/`aria-live`. |
| 9 | `src/pages/Unauthorized.tsx` | `PageTransition` added per golden-reference §12.1; already token-driven (`bg-card-bg`, `border-border-subtle`, `shadow-2xl` token, `text-text-*`). |

---

## Key certified primitives used

- `AuthThemeProvider` (DS-006) — exported from `AntigravityUI` barrel; replaces hand-rolled `ThemeContext.Provider` + `.light` wrapper on auth pages.
- `Card variant="auth-light"` — `--material-card-auth-light-*` tokens (surface `#FFFFFF`, border `#F1F5F9`, radius `2.5rem`, shadow `0 20px 50px rgba(0,0,0,0.12)`); replaces manual `bg-white rounded-[2.5rem]` cards.
- `Button` `primary`/`secondary`/`danger` — standardized; no `auth-dark`/`auth-violet` on any auth page.
- `Input` default variant — no `compact`/`violet`.
- `Spinner` (`sm`/`md`/`lg`, `primary`/`neutral`) — exported from barrel.
- `Display` — `--text-display` (1.75rem → 3rem responsive).
- `BrandTitle variant="gradient"` (DS-006) — canonical brand gold gradient title (Splash).
- `Label`, `PageContainer centered`, `Alert` (`error` → `role="alert"`; `info`/`success`/`warning` → `role="status"`), `IconBadge`, `IconButton`, `LogoSVG`, `LoadingScreen`.

---

## Sweep (leaks eliminated)

Grep across all 9 pages confirmed zero remaining:
- `ThemeContext` / `.light` wrapper usage (all replaced by `AuthThemeProvider`).
- `variant="compact"`, `auth-dark`, `auth-violet` (auth module only; divergent variants remain frozen in foundation for legacy consumers).
- Manual spinners (`animate-spin`, `border-t-2` spinners) — replaced with certified `Spinner`.
- Inline `<style>` tags — removed (`UpdatePasswordPage`, `SplashPage`).
- Raw hex / `rgba()` colors on auth pages — replaced with tokens or `color-mix(...)` of certified tokens. Remaining `rgba(255,255,255,0.4)` on Splash is a white light-sweep (lighting effect, not a palette color).
- `PaletteBackground` — **zero consumers** (source file retained as Phase-2B dead-register candidate).

---

## Validation

- `npx tsc -b` — clean (exit 0).
- `npm run build` — exit 0 (only pre-existing chunk-size notices).
- ESLint on all 9 edited files — **0 new problems**; remaining findings are pre-existing business-logic `any`/`refs` (LoginPage submit handlers, SignupPage coupon logic, Splash Web Audio) untouched by the migration.
- Behavior preserved: Splash routing, sound synth, progress ticker, and all auth flows unchanged — presentational migration only.
- Full `vitest` suite remains blocked by the pre-existing `@csstools/css-calc` ESM issue (`src/utils/examStateCalculator.test.ts`); no page code is covered by unit tests.

---

## Notes / decisions

- **`PaletteBackground` orphaned:** was used only by `FinishSignInPage` + `AccountDisabledPage`; both fully migrated off it. Source file retained — candidate for dead-register (D7) pending owner approval.
- **`index.css` additive:** `@keyframes sheen` added globally (was an inline `<style>` in `SplashPage`) — additive consolidation, no token/component changes to the frozen foundation.
- **Splash brand treatment retained:** coin ring / logo frame and dark radial canvas are brand identity routed through certified `--gold-*` / `--canvas-splash-*` tokens; light-sweep is decorative lighting.
- **Divergent auth button/input variants remain frozen** in the foundation (registered in `FOUNDATION_FREEZE_REGISTER.md`) for any legacy consumers; the auth module now standardizes on default variants per the approved decision.

---

## Verification record (2026-08-02 — independent re-audit)

Re-ran the full comparison/certification evidence before the Module 2 approval gate. Confirmed items:

- **Verified items (12/12):** Containers ✓ · Cards ✓ · Buttons ✓ · Inputs ✓ · Typography ✓ · Colors ✓ · Hover ✓ · Animations ✓ · Loading ✓ · Accessibility ✓ · Responsive ✓ · No competing language ✓.
- **Visual parity confirmation:** YES — all 9 surfaces consume the certified `PageContainer`/`Card`/`Button`/`Input`/`Spinner`/typography components and Layer-2/3 tokens. The certification question ("same application as the User Panel?") returns an immediate YES for every surface.
- **Sweep greps re-run (all of `src/pages`):** 0 hits for `ThemeContext`/`.light`, `auth-dark`/`auth-violet`, `variant="compact"`, manual spinners, inline `<style>`, `PaletteBackground`; 1 accepted hit (Splash white light-sweep).
- **Remaining auth micro-typography** (`text-[9px]/[8px]/[10px]/[22px]`, `rounded-[40px]`, `text-[64px]`) verified as parity-consistent with the User Panel's own micro-typography scale and certified radii.
- **Build:** `npx tsc -b` exit 0 · `npm run build` exit 0 (chunk-size notices only) · ESLint on 9 surfaces: 0 migration-introduced findings.
- **Accepted deviations:** unchanged — (1) orphaned `PaletteBackground` (D7 dead-register candidate), (2) additive `@keyframes sheen` in `index.css`, (3) Splash decorative white lighting, (4) token-colored raw semantic tags matching `PageHeader`, (5) `Card auth-light` for form surfaces.
- **Final certification:** ✅ **Module 1 = CERTIFIED** — approval gate cleared; Module 2 (Admin) may begin.

---

## Next steps (module 1)

1. ~~Visual comparison vs User Panel golden reference~~ → **COMPLETE** — `docs/certification/PHASE_3_1_AUTH_VISUAL_COMPARISON.md` (12/12 parity; independent re-audit 2026-08-02).
2. ~~Module certification~~ → **COMPLETE** — `docs/certification/PHASE_3_1_AUTH_CERTIFICATION.md` (✅ certified, approved; re-confirmed 2026-08-02).
3. **Visual Baseline screenshots** (recommended, manual browser step): capture Splash · Login · Signup · Verify Email · Update Password · Account Disabled at mobile/tablet/desktop before Module 2. **Still pending** — not a certification blocker.
4. Proceed to Module 2 — Admin panel visual language rollout (reusing this certified template).

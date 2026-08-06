# Phase 1a Step 4 — Typography Token Specification

## Objective

Define the exact canonical typography tokens that will become the repository standard. These tokens will be registered as Layer 2 (Semantic) CSS custom properties in `themes.css`, mapped to Tailwind utilities via `@theme` in `index.css`, and consumed by the Typography Components in `AntigravityTypography.tsx`. The goal is ONE source of truth across all three layers.

**Current architectural problem**: Three different scales coexist with conflicting values:

| Source | H1 mobile | H1 desktop | Location |
|--------|-----------|------------|----------|
| Typography Component (H1) | 22px | 30px | `AntigravityTypography.tsx` (hardcoded Tailwind) |
| CSS variable scale | 28px | 48px | `index.css` `:root` + media queries (consumed by base `h1 {}` rule) |
| themes.css primitives | — | — | `themes.css` defined but not consumed by any typography component |

This proposal replaces all three with a single canonical token set.

---

## Proposed Canonical Typography Scale

All values in `rem` (1rem = 16px). The scale targets 3 breakpoints (mobile/SM up to 480px, MD 768px+, LG 1024px+, XL 1440px+), matching the existing media query structure.

### Display — Brand / Hero Titles

| Property | Mobile (XS) | SM (480+) | MD (768+) | LG (1024+) | XL (1440+) |
|----------|-------------|-----------|-----------|------------|------------|
| **Size** | 1.75rem (28px) | 2.0rem (32px) | 2.25rem (36px) | 2.5rem (40px) | 3.0rem (48px) |
| **Weight** | 900 (black) | same | same | same | same |
| **Line height** | 1.1 | same | same | same | same |
| **Letter spacing** | -0.025em (tight) | same | same | same | same |
| **Text transform** | none | none | none | none | none |
| **Token names** | `--text-display` / `--lh-display` / `--fw-display` |
| **Intended usage** | Login/Signup hero headings, Performance Report title, celebratory banners |

**Rationale**: Migrates the current hero-like CSS variable scale (which is too large for page headings) to a dedicated Display tier. Leaves H1 free for actual page headings at a smaller size.

### H1 — Page Headings

| Property | Mobile (XS) | SM (480+) | MD (768+) | LG (1024+) | XL (1440+) |
|----------|-------------|-----------|-----------|------------|------------|
| **Size** | 1.375rem (22px) | 1.375rem (22px) | 1.625rem (26px) | 1.875rem (30px) | 1.875rem (30px) |
| **Weight** | 900 (black) | same | same | same | same |
| **Line height** | 1.15 | same | same | same | same |
| **Letter spacing** | -0.025em (tight) | same | same | same | same |
| **Text transform** | none | none | none | none | none |
| **Token names** | `--text-h1` / `--lh-h1` / `--fw-h1` |
| **Color token** | `--text-title` |
| **Intended usage** | Primary page titles, major section headers |

**Current component values (identical — Option C):** 22px → 26px → 30px ✅ No visual change.

### H2 — Section Headings

| Property | Mobile (XS) | SM (480+) | MD (768+) | LG (1024+) | XL (1440+) |
|----------|-------------|-----------|-----------|------------|------------|
| **Size** | 1.125rem (18px) | 1.125rem (18px) | 1.25rem (20px) | 1.25rem (20px) | 1.25rem (20px) |
| **Weight** | 700 (bold) | same | same | same | same |
| **Line height** | 1.2 | same | same | same | same |
| **Letter spacing** | -0.025em (tight) | same | same | same | same |
| **Text transform** | none | none | none | none | none |
| **Token names** | `--text-h2` / `--lh-h2` / `--fw-h2` |
| **Color token** | `--text-primary` |
| **Intended usage** | Card titles, modal headers, exam names |

**Current component values (identical — Option C):** 18px → 20px ✅ No visual change.

### H3 — Subsection / Card Headings

| Property | Mobile (XS) | SM (480+) | MD (768+) | LG (1024+) | XL (1440+) |
|----------|-------------|-----------|-----------|------------|------------|
| **Size** | 0.875rem (14px) | 0.875rem (14px) | 0.9375rem (15px) | 0.9375rem (15px) | 0.9375rem (15px) |
| **Weight** | 600 (semibold) | same | same | same | same |
| **Line height** | 1.3 | same | same | same | same |
| **Letter spacing** | -0.025em (tight) | same | same | same | same |
| **Text transform** | none | none | none | none | none |
| **Token names** | `--text-h3` / `--lh-h3` / `--fw-h3` |
| **Color token** | `--text-primary` |
| **Intended usage** | Form section titles, exam card titles, filter headers |

**Current component values (identical — Option C):** 14px → 15px ✅ No visual change.

### Body — Primary Reading Text

| Property | Mobile (XS) | SM (480+) | MD (768+) | LG (1024+) | XL (1440+) |
|----------|-------------|-----------|-----------|------------|------------|
| **Size** | 0.8125rem (13px) | 0.8125rem (13px) | 0.875rem (14px) | 0.875rem (14px) | 0.875rem (14px) |
| **Weight** | 500 (medium) | same | same | same | same |
| **Line height** | 1.7 (relaxed) | same | same | same | same |
| **Letter spacing** | 0em (normal) | same | same | same | same |
| **Text transform** | none | none | none | none | none |
| **Token names** | `--text-body` / `--lh-body` / `--fw-body` |
| **Color token** | `--text-primary` (default) / `--text-secondary` (secondary variant) |
| **Intended usage** | Paragraphs, descriptions, stat values, form helper text |

**Current component values (identical):** 13px → 14px ✅ No visual change.

### Caption — Secondary / Helper Text (NEW)

| Property | Mobile (XS) | SM (480+) | MD (768+) | LG (1024+) | XL (1440+) |
|----------|-------------|-----------|-----------|------------|------------|
| **Size** | 0.6875rem (11px) | 0.6875rem (11px) | 0.75rem (12px) | 0.75rem (12px) | 0.75rem (12px) |
| **Weight** | 500 (medium) | same | same | same | same |
| **Line height** | 1.4 | same | same | same | same |
| **Letter spacing** | 0em (normal) | same | same | same | same |
| **Text transform** | none | none | none | none | none |
| **Token names** | `--text-caption` / `--lh-caption` / `--fw-caption` |
| **Color token** | `--text-secondary` |
| **Intended usage** | Timestamps, secondary metadata less prominent than Body |

**Rationale**: Currently, ~15+ Body overrides use forced `text-[11px]` or `text-[12px]` for secondary data. A dedicated Caption level captures this common pattern. No component exists yet — new `<Caption>` component to be added in Step 5.

### Label — Form Labels / Tags

| Property | Mobile (XS) | SM (480+) | MD (768+) | LG (1024+) | XL (1440+) |
|----------|-------------|-----------|-----------|------------|------------|
| **Size** | 0.625rem (10px) | 0.625rem (10px) | 0.625rem (10px) | 0.625rem (10px) | 0.625rem (10px) |
| **Weight** | 700 (bold) | same | same | same | same |
| **Line height** | 1.4 (inherit from parent) | same | same | same | same |
| **Letter spacing** | 0.1em (widest) | same | same | same | same |
| **Text transform** | uppercase | same | same | same | same |
| **Token names** | `--text-label` / `--lh-label` / `--fw-label` |
| **Color token** | `--text-muted` (default) / `--text-danger` (error variant) |
| **Intended usage** | Form labels, tab labels, stat labels, pill labels |

**Current component values (identical):** 10px uppercase tracking-widest ✅ No visual change.

### StatValue — Large Stat Display

| Property | Mobile (XS) | SM (480+) | MD (768+) | LG (1024+) | XL (1440+) |
|----------|-------------|-----------|-----------|------------|------------|
| **Size** | 1.75rem (28px) | 1.75rem (28px) | 2.0rem (32px) | 2.25rem (36px) | 2.25rem (36px) |
| **Weight** | 900 (black) | same | same | same | same |
| **Line height** | 1.0 (none) | same | same | same | same |
| **Letter spacing** | -0.05em (tighter) | same | same | same | same |
| **Text transform** | none | none | none | none | none |
| **Token names** | `--text-stat-value` / `--lh-stat-value` / `--fw-stat-value` |
| **Color token** | `--stat-value-text` / `--text-primary` |
| **Intended usage** | Score display, metric values, large numbers in StatCards |

**Current state**: No dedicated component. StatCard uses hardcoded `text-4xl` / `text-[32px]` etc.

### Badge — Pill / Tag Text

| Property | Mobile (XS) | SM (480+) | MD (768+) | LG (1024+) | XL (1440+) |
|----------|-------------|-----------|-----------|------------|------------|
| **Size** | 0.5625rem (9px) | 0.5625rem (9px) | 0.625rem (10px) | 0.625rem (10px) | 0.625rem (10px) |
| **Weight** | 700 (bold) | same | same | same | same |
| **Line height** | 1.0 (none) | same | same | same | same |
| **Letter spacing** | 0.05em (wider) | same | same | same | same |
| **Text transform** | uppercase | same | same | same | same |
| **Token names** | `--text-badge` / `--lh-badge` / `--fw-badge` |
| **Color token** | Variant-dependent (primary/secondary/success/danger/warning/default) |
| **Intended usage** | Rank badges, status pills, tag counters |

**Current state**: Badge component exists (`AntigravityData.tsx`) with hardcoded `text-[9px] md:text-[10px]`.

---

## Token Definition Summary

### Layer 2 — Semantic Typography Tokens (themes.css additions)

```css
/* ─── Typography Scale Tokens (replaces index.css lines 216-232, 416-451) ── */
/* Base: Mobile XS (< 480px). Overrides at SM/MD/LG/XL breakpoints. */

/* Display — Hero/Brand */
--text-display: 1.75rem;    --lh-display: 1.1;    --fw-display: 900;
--ls-display: -0.025em;

/* Heading 1 — Page Headings */
--text-h1: 1.375rem;        --lh-h1: 1.15;        --fw-h1: 900;
--ls-h1: -0.025em;

/* Heading 2 — Section Headings */
--text-h2: 1.125rem;        --lh-h2: 1.2;         --fw-h2: 700;
--ls-h2: -0.025em;

/* Heading 3 — Subsection Headings */
--text-h3: 0.875rem;        --lh-h3: 1.3;         --fw-h3: 600;
--ls-h3: -0.025em;

/* Body — Primary Text */
--text-body: 0.8125rem;     --lh-body: 1.7;       --fw-body: 500;

/* Caption — Secondary Text (NEW) */
--text-caption: 0.6875rem;  --lh-caption: 1.4;    --fw-caption: 500;

/* Label — Form/Tag Labels */
--text-label: 0.625rem;     --lh-label: 1.4;      --fw-label: 700;
--ls-label: 0.1em;          --tt-label: uppercase;

/* Stat Value — Large Numbers */
--text-stat-value: 1.75rem; --lh-stat-value: 1.0; --fw-stat-value: 900;
--ls-stat-value: -0.05em;

/* Badge — Pill/Tag */
--text-badge: 0.5625rem;    --lh-badge: 1.0;      --fw-badge: 700;
--ls-badge: 0.05em;         --tt-badge: uppercase;
```

### Breakpoint Overrides (index.css media queries)

```css
/* SM (480px) */
--text-display: 2.0rem;
/* no H1/H2/H3/Body change at SM — they keep mobile values */
--text-caption: 0.6875rem;  /* no SM change for caption */

/* MD (768px) */
--text-display: 2.25rem;
--text-h1: 1.625rem;
--text-h2: 1.25rem;
--text-h3: 0.9375rem;
--text-body: 0.875rem;
--text-caption: 0.75rem;
--text-stat-value: 2.0rem;
--text-badge: 0.625rem;

/* LG (1024px) */
--text-display: 2.5rem;
--text-h1: 1.875rem;
/* H2/H3/Body/Caption stay at MD values */
--text-stat-value: 2.25rem;
/* Badge stays at MD value */

/* XL (1440px) */
--text-display: 3.0rem;
/* H1 stays at LG value */
/* all others stay at previous values */
```

---

## Compatibility Matrix

### Display — Brand / Hero Titles

| Aspect | Current (hardcoded values across pages) | New token | Visual difference |
|--------|-----------------------------------------|-----------|-------------------|
| LoginPage hero h1 | `text-[36px] xl:text-[48px]` | `--text-display` (28→48px) | Mobile: 36→28px (smaller). Desired — mobile hero over-scale was a known issue. |
| SignupPage hero h1 | `text-[36px] xl:text-[48px]` | `--text-display` | Same change. |
| ReviewLayout Performance Report h1 | `text-[clamp(22px,3.5vw,42px)]` | `--text-display` | Clamp removal means explicit breakpoints. Design review needed. |
| ActiveExamPage Loading/Error h2 | `text-2xl` (24px) | `--text-display` via component | Would need a `<Display>` component — not created yet. |

**Affected pages**: LoginPage, SignupPage, ReviewLayout (partial), SuccessView.

### H1 — Page Headings

| Aspect | Current (component) | New token | Visual difference |
|--------|---------------------|-----------|-------------------|
| H1 component | `text-[22px] md:text-[26px] lg:text-[30px]` | `--text-h1` (22→26→30px) | **None** — values identical |
| Base `h1 {}` rule | `var(--text-h1)` which was 28→48px (old CSS var) | `var(--text-h1)` now 22→30px (new token) | Raw `<h1>` shrinks from 28→48px to 22→30px. **Intentional fix** — raw h1 was oversized. |
| @theme mapping | `--text-h1: 1.75rem` (static, not responsive) | Responsive via token | Tailwind `text-h1` utility now responsive. |

**Affected components**: H1 component (no change), all raw `<h1>` pages (will render smaller — this is the actual bug fix).

### H2 — Section Headings

| Aspect | Current | New token | Visual difference |
|--------|---------|-----------|-------------------|
| H2 component | `text-[18px] md:text-[20px]` | `--text-h2` (18→20px) | **None** |
| Base `h2 {}` rule | `var(--text-h2)` which was 22→36px (old CSS var) | 18→20px (new token) | Raw `<h2>` shrinks significantly. **Intentional fix.** |
| @theme mapping | `--text-h2: 1.375rem` (static) | Responsive | `text-h2` utility now responsive. |

**Affected components**: H2 component (none), all raw `<h2>` pages (will render at canonical size).

### H3 — Subsection Headings

| Aspect | Current | New token | Visual difference |
|--------|---------|-----------|-------------------|
| H3 component | `text-[14px] md:text-[15px]` | `--text-h3` (14→15px) | **None** |
| Base `h3 {}` rule | `var(--text-h3)` which was 18→28px (old CSS var) | 14→15px (new token) | Raw `<h3>` shrinks significantly. **Intentional fix.** |

**Affected components**: H3 component (none), all raw `<h3>` pages (will render at canonical size).

### Body — Primary Reading Text

| Aspect | Current | New token | Visual difference |
|--------|---------|-----------|-------------------|
| Body component | `text-[13px] md:text-[14px]` | `--text-body` (13→14px) | **None** |
| Base `p {}` rule | No CSS variable (uses body `font-size: 1rem`) | No change | No change — base body rule stays. |
| @theme mapping | `--text-body-1: 0.875rem`; `--text-body-2: 0.8125rem` | Merge to `--text-body: 0.8125rem` | Body-1 shrinks from 14px→13px (mobile). **Minor but intentional** — Body default IS 13px. |

### Caption — Secondary Text (NEW)

| Aspect | Current | New token | Visual difference |
|--------|---------|-----------|-------------------|
| Current approach | `text-[11px]` or `text-[12px]` overrides on Body | `--text-caption` | Depends on context. See Token Impact Report below. |
| Existing CSS var | `--text-caption: 0.6875rem` (11px) | `--text-caption: 0.6875rem` (11→12px) | MD+ increases from 11→12px. Minor. |

### Label — Form / Tag Labels

| Aspect | Current | New token | Visual difference |
|--------|---------|-----------|-------------------|
| Label component | `text-[10px] font-bold uppercase tracking-widest` | `--text-label` tokens | **None** — values identical |
| @theme mapping | `--text-label: 0.75rem` (12px) | `--text-label: 0.625rem` (10px) | Utility `text-label` changes from 12px→10px. **Breaking for any code using `text-label` class.** This is intentional — the old mapping was wrong. |

### StatValue — Large Stat Display

| Aspect | Current | New token | Visual difference |
|--------|---------|-----------|-------------------|
| StatCard usage | `text-4xl` (36px) or `text-[32px]` | `--text-stat-value` (28→36px) | Mobile: 36→28px. MD+: 36→32px. LG+: 36→36px (no change). **Smaller on mobile.** |

### Badge — Pill / Tag Text

| Aspect | Current | New token | Visual difference |
|--------|---------|-----------|-------------------|
| Badge component | `text-[9px] md:text-[10px]` | `--text-badge` (9→10px) | **None** — values identical |

---

## Token Impact Report

### Components That Will Consume New Tokens

| Component | Current implementation | Token to consume | Change required |
|-----------|----------------------|------------------|-----------------|
| H1 | hardcoded `text-[22px] md:text-[26px] lg:text-[30px]` | `var(--text-h1)` via Tailwind `text-h1` | Replace hardcoded classes with `text-h1` |
| H2 | hardcoded `text-[18px] md:text-[20px]` | `var(--text-h2)` via `text-h2` | Replace hardcoded classes |
| H3 | hardcoded `text-[14px] md:text-[15px]` | `var(--text-h3)` via `text-h3` | Replace hardcoded classes |
| Body | hardcoded `text-[13px] md:text-[14px]` | `var(--text-body)` via `text-body` | Replace hardcoded classes |
| Label | hardcoded `text-[10px]` | `var(--text-label)` via `text-label` | Replace hardcoded class |
| Base `h1`-`h6` rules | `var(--text-h1)` etc. (old values) | `var(--text-h1)` etc. (new values) | Automatic — CSS variable change only |
| StatCard | hardcoded sizes | `var(--text-stat-value)` | Component update (Step 5) |
| Badge | hardcoded `text-[9px] md:text-[10px]` | `var(--text-badge)` | Component update (Step 5) |
| New Caption component | N/A | `var(--text-caption)` | New component (Step 5) |

### Pages That Will Change Visually

| Page | What changes | Magnitude | Direction |
|------|-------------|-----------|-----------|
| LoginPage h1 | 36→48px → 28→48px | **Medium** — mobile shrinks from 36px to 28px | Smaller on mobile |
| SignupPage h1 (hero) | 36→48px → 28→48px | **Medium** | Smaller on mobile |
| FinishSignupPage h1 (4x) | 24px → 22-30px | **Small** — mobile 24→22px | Smaller |
| AccountDisabled h1 | 30px → 22→30px | **Small** — mobile 30→22px | Smaller |
| Unauthorized h1 | 30px + uppercase → 22→30px | **Medium** — size + transform | Smaller on mobile |
| ErrorBoundary h1 | 24px font-cinzel → 22→30px | **Medium** — size + font-family | Different style |
| ActiveExamPage h2 (error) | 24px white → 18→20px text-primary | **Large** — size + color | Breaking — needs override |
| QuestionCard h2 | Clamp 14-17px → 18→20px | **Large** — size increase | Breaking — needs override |
| All raw h3 (13 pages) | 16-22px → 14→15px | **Large** — significant shrink | Intentional fix |

### Pages That Will NOT Change (explicit overrides)

| Page | Reason |
|------|--------|
| AdminOverview (sr-only H1) | `sr-only` hides all visual rendering |
| AdminQuestions (sr-only H1) | Same |
| AdminSubAdmins (sr-only H1) | Same |
| AdminSettings (sr-only H1) | Same |
| AdminUsers (sr-only H1) | Same |
| UpdatePasswordPage (H1) | Already uses H1 component — tokens match exactly |
| All pages using H2/H3 components | Tokens match component defaults exactly |
| AddExamModal heading | Uses H2 with `uppercase tracking-widest` override |
| ExamPaperGrid heading | Uses H2 with `text-xl mb-2 tracking-normal` override |
| StatusBoard heading | Uses H3 with `text-sm font-bold uppercase` override |
| AIToolCards heading | Uses H3 with `font-bold uppercase tracking-wide` override |
| PromptEditorModal heading | Uses H3 with `font-bold uppercase tracking-wide` override |
| All components with explicit Body overrides (55 usages) | Explicit className overrides take precedence over component defaults |
| All components with explicit Label overrides (58 usages) | Same |
| Badge component (internal) | Will be updated in Step 5 — not affected by Step 4 |
| StatCard | Will be updated in Step 5 |

### Existing CSS Variable Scale — Removal Plan

The following declarations in `index.css` must be **removed** and **replaced** by the new token system:

**Remove (lines 216-232)**:
```css
--text-h1: 1.75rem; --lh-h1: 1.15; --fw-h1: 700;
--text-h2: 1.375rem; --lh-h2: 1.2; --fw-h2: 700;
--text-h3: 1.125rem; --lh-h3: 1.3; --fw-h3: 600;
--text-h4: 1.0rem; --lh-h4: 1.35; --fw-h4: 600;
--text-h5: 0.875rem; --lh-h5: 1.4; --fw-h5: 600;
--text-h6: 0.75rem; --lh-h6: 1.5; --fw-h6: 600;
--text-sub-1, --text-sub-2, --text-body-1, --text-body-2
--text-caption, --text-overline, --text-button, --text-label
```

**Remove (lines 416-451, all media query overrides)**:
```css
@media (min-width: 480px) {
  :root { --text-h1: 2.0rem; ... }
}
@media (min-width: 768px) {
  :root { --text-h1: 2.25rem; ... }
}
@media (min-width: 1024px) {
  :root { --text-h1: 2.5rem; ... }
}
@media (min-width: 1440px) {
  :root { --text-h1: 3.0rem; ... }
}
```

**Replace with** — new tokens as defined in the Token Definition Summary above, using the same media query structure but with the correct values.

---

## Validation Plan

### Visual Regression Checklist

| Check | Method | Expected outcome |
|-------|--------|------------------|
| H1 component renders same | Screenshot diff at 3 breakpoints | Pixel-identical |
| H2 component renders same | Screenshot diff at 2 breakpoints | Pixel-identical |
| H3 component renders same | Screenshot diff at 2 breakpoints | Pixel-identical |
| Body component renders same | Screenshot diff at 2 breakpoints | Pixel-identical |
| Label component renders same | Screenshot diff at 1 breakpoint | Pixel-identical |
| Raw `<h1>` pages shrink | Screenshot comparison | Known intentional change — smaller on mobile |
| Raw `<h2>` pages shrink | Screenshot comparison | Known intentional change |
| Raw `<h3>` pages shrink | Screenshot comparison | Known intentional change |
| `text-label` utility changes | Check any usage of `text-label` class | 12px→10px — intentional fix |
| `text-body-1`/`text-body-2` removal | Check any usage of these utility classes | Must also migrate to `text-body` |

### Responsive Verification

| Breakpoint | Levels affected | Verification method |
|------------|----------------|--------------------|
| XS (< 480px) | All 9 levels | Render at 375px viewport |
| SM (480-767px) | Display only | Render at 480px viewport |
| MD (768-1023px) | Display, H1, H2, H3, Body, Caption, StatValue, Badge | Render at 768px viewport |
| LG (1024-1439px) | Display, H1, StatValue | Render at 1024px viewport |
| XL (1440px+) | Display | Render at 1440px viewport |

Pages requiring special attention at each breakpoint:

| Page | XS | SM | MD | LG | XL |
|------|----|----|----|----|----|
| LoginPage | hero shrinks from 36→28px | 32px | 36px | 40px | 48px |
| SignupPage | hero shrinks from 36→28px | 32px | 36px | 40px | 48px |
| FinishSignInPage | h1 shrinks from 24→22px | same 22px | 26px | 30px | 30px |
| AccountDisabled | h1 shrinks from 30→22px | same | 26px | 30px | 30px |

### Accessibility Verification

| Check | Criteria | Method |
|-------|----------|--------|
| Heading hierarchy | All heading levels maintain semantic order (h1→h2→h3, never skip) | Audit all 30 remaining raw headings + 55 canonical headings |
| Font size minimum | No body text below 13px (10px for label is acceptable — uppercase short strings) | Verify Body minimum = 13px, Label minimum = 10px |
| Letter spacing | `-0.025em` on headings — verify no clipping on 3-line headings | Test long headings at narrowest breakpoint |
| Text contrast | All text tokens pass WCAG AA 4.5:1 | Already confirmed in Phase 0a — text tokens unchanged |
| Focus visibility | No typography change affects focus indicators | Regression test |

### Rollback Plan

If token alignment causes unacceptable visual regressions:

| Step | Action | Reversibility |
|------|--------|---------------|
| 1 | Revert `themes.css` token additions | Full — tokens are additive |
| 2 | Revert `index.css` @theme and media query changes | Full — git revert |
| 3 | Revert `AntigravityTypography.tsx` component updates | Full — git revert |
| 4 | If git revert not possible: restore old CSS variable values | Partial — old values are known |
| 5 | Mark raw `<h1>`/`<h2>`/`<h3>` fix as "requires design decision" | Documentation change |

**Rollback trigger criteria**:
- Any page heading is illegible (truncated, overlapping, clipped)
- Any Layout shifts by >2px at any breakpoint
- Any accessibility violation introduced
- Any frozen feature (27, 28) visual test fails

### Migration Sequence

| Step | Action | Files affected | Risk | Duration |
|------|--------|----------------|------|----------|
| **4a** | Add new Layer 2 tokens to `themes.css` | `themes.css` | None (additive) | 5 min |
| **4b** | Update `index.css` @theme mappings and media queries | `index.css` | Medium — existing `text-h1` etc. utilities change | 15 min |
| **4c** | Update `AntigravityTypography.tsx` components to consume tokens | `AntigravityTypography.tsx` | Low — values identical | 10 min |
| **4d** | Remove old CSS variable scale (lines 216-232, 416-451) | `index.css` | Medium — only if all consumers migrated | 5 min |
| **4e** | Full visual regression test | All pages | Dependent on 4a-4d results | 30 min |
| **4f** | Rollback if triggers met | All | Quick via git revert | 5 min |

**Total estimated implementation time**: 70 minutes (excluding manual visual verification).

---

## STOP

This is a **specification only** document.

Do NOT modify:
- `themes.css`
- `index.css`
- `AntigravityTypography.tsx`

These will be updated in Phase 1a Step 4 implementation, which requires separate approval.

---
*Generated: 2026-07-30*
*Specification authority: Technical audit*

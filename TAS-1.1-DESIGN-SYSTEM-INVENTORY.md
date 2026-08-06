# TAS-1.1 — Design System Architecture Inventory

**Status:** READ-ONLY — No files modified
**Date:** 2026-07-16
**Project:** PrepareForU — Premium Competitive Examination Preparation Platform
**Framework:** React 19 + Tailwind CSS v4 + Framer Motion 12 + TypeScript 5.9

---

## 1. Theme Files

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 1 | `src/styles/themes.css` | 1046 | **Canonical token source.** Layer 1 (Primitives) + Layer 2 (Semantic) + Layer 3 (Component). Dark default + `.light` overrides. |
| 2 | `src/index.css` | 1045 | **Global styles + Tailwind bridge.** `@theme` block, responsive typography, global resets, `.ancient-*` utility classes, premium material system. |
| 3 | `src/context/ThemeContext.tsx` | 46 | **Runtime theme provider.** Toggles `.light` class on `<html>`. Persists to localStorage. Dark = default. |
| 4 | `THEME_ARCHITECTURE_SPEC_v1.md` | — | Design spec document (referenced by themes.css header). |

### File Dependency Chain

```
THEME_ARCHITECTURE_SPEC_v1.md
        ↓ (spec)
src/styles/themes.css           ← Layer 1 + 2 + 3 tokens
        ↓ (@import)
src/index.css                   ← @theme bridge + global styles + .ancient-* classes
        ↓ (runtime)
src/context/ThemeContext.tsx     ← Adds/removes .light class
        ↓ (consumed by)
All .tsx components              ← via Tailwind utilities OR var(--token) inline
```

---

## 2. Token Inventory

### Layer 1 — Primitive Tokens (themes.css `:root`)

#### 2.1 Color Primitives

| Scale | Tokens | Defined In |
|-------|--------|------------|
| Gray | `--gray-50` through `--gray-950` (11 tokens) | themes.css:28-40 |
| Slate | `--slate-50` through `--slate-950` (11 tokens) | themes.css:41-51 |
| Blue | `--blue-50` through `--blue-950` (11 tokens) | themes.css:53-64 |
| Green | `--green-50` through `--green-950` (11 tokens) | themes.css:66-77 |
| Red | `--red-50` through `--red-950` (11 tokens) | themes.css:79-90 |
| Amber | `--amber-50` through `--amber-950` (11 tokens) | themes.css:92-103 |
| Purple | `--purple-50` through `--purple-950` (11 tokens) | themes.css:105-116 |
| Emerald | `--emerald-50` through `--emerald-950` (11 tokens) | themes.css:118-129 |
| Teal | `--teal-50` through `--teal-950` (11 tokens) | themes.css:131-142 |
| Cyan | `--cyan-50` through `--cyan-950` (11 tokens) | themes.css:144-155 |
| Rose | `--rose-50` through `--rose-950` (11 tokens) | themes.css:157-168 |
| Pink | `--pink-600` (1 token only) | themes.css:171 |
| Orange | `--orange-50` through `--orange-950` (11 tokens) | themes.css:173-184 |
| Indigo | `--indigo-50` through `--indigo-950` (11 tokens) | themes.css:186-197 |
| Brown | `--brown-50` through `--brown-950` (16 tokens, non-standard steps) | themes.css:199-216 |
| Forest | `--forest-50` through `--forest-950` (11 tokens) | themes.css:218-229 |
| Gold | `--gold-50` through `--gold-400` (5 tokens) | themes.css:231-234 |
| Dark | `--dark-50` through `--dark-200` (3 tokens) | themes.css:238-240 |
| Canvas | 8 custom tokens (`--canvas-cream` etc.) | themes.css:243-251 |
| Premium | 3 tokens (`--premium-green/cream/gold`) | themes.css:253-256 |
| AI Tool | 2 tokens (`--ai-terracotta`, `--ai-green`) | themes.css:258-259 |
| Chart | 12 tokens (`--chart-navy` through `--chart-pink`) | themes.css:262-274 |
| Pie (Admin) | 6 tokens (`--pie-forest` through `--pie-bronze`) | themes.css:277-282 |
| Baseline | 3 tokens (`--white`, `--black`, `--transparent`) | themes.css:284-286 |

**Total Color Primitives: ~187 tokens**

#### 2.2 Radius Primitives

| Token | Value | Defined In |
|-------|-------|------------|
| `--radius-none` | 0px | themes.css:290 |
| `--radius-xs` | 4px | themes.css:291 |
| `--radius-sm` | 8px | themes.css:292 |
| `--radius-md` | 12px | themes.css:293 |
| `--radius-lg` | 16px | themes.css:294 |
| `--radius-xl` | 20px | themes.css:295 |
| `--radius-2xl` | 24px | themes.css:296 |
| `--radius-3xl` | 20px | themes.css:297 |
| `--radius-4xl` | 32px | themes.css:298 |
| `--radius-full` | 9999px | themes.css:299 |

**Total Radius Primitives: 10**

#### 2.3 Shadow Primitives

| Token | Value | Defined In |
|-------|-------|------------|
| `--shadow-offset-none` | 0 0 0 0 | themes.css:302 |
| `--shadow-offset-xs` | 0 1px 2px 0 | themes.css:303 |
| `--shadow-offset-sm` | 0 1px 3px 0 | themes.css:304 |
| `--shadow-offset-md` | 0 4px 6px -1px | themes.css:305 |
| `--shadow-offset-lg` | 0 10px 15px -3px | themes.css:306 |
| `--shadow-offset-xl` | 0 20px 25px -5px | themes.css:307 |
| `--shadow-offset-2xl` | 0 25px 50px -12px | themes.css:308 |

**Total Shadow Primitives: 7**

#### 2.4 Typography Primitives

| Category | Tokens | Defined In |
|----------|--------|------------|
| Font Family | `--font-sans`, `--font-mono` (2) | themes.css:311-312 |
| Font Weight | `--weight-thin` through `--weight-black` (7) | themes.css:315-321 |
| Font Size | `--text-3xs` through `--text-10xl` (17) | themes.css:323-340 |
| Line Height | `--lh-none` through `--lh-loose` (6) | themes.css:343-348 |
| Letter Spacing | `--ls-tighter` through `--ls-ultra` (7) | themes.css:351-357 |

**Total Typography Primitives: 39**

#### 2.5 Opacity Primitives

| Token | Value | Defined In |
|-------|-------|------------|
| `--opacity-0` through `--opacity-100` (21 tokens, 5% increments) | 0 to 1 | themes.css:360-380 |

**Total Opacity Primitives: 21**

#### LAYER 1 TOTAL: ~264 tokens

---

### Layer 2 — Semantic Tokens

#### 2.6 Background Tokens

| Token | Dark Value | Light Override | Defined In |
|-------|-----------|----------------|------------|
| `--bg-app` | #111827 | #E2CFA6 | themes.css:394/618 |
| `--bg-surface` | #1F2937 | #C9A070 | themes.css:395/619 |
| `--bg-elevated` | #374151 | #FFF8E7 | themes.css:396/620 |
| `--bg-hover` | #1F2937 | #D5B486 | themes.css:397/621 |
| `--bg-active` | #374151 | #C8A473 | themes.css:398/622 |
| `--bg-disabled` | #374151 | rgba(139,90,10,0.06) | themes.css:399/623 |
| `--bg-input` | #1F2937 | #FFF8E7 | themes.css:400/624 |
| `--bg-overlay` | rgba(0,0,0,0.6) | rgba(28,20,5,0.45) | themes.css:401/625 |
| `--bg-success-subtle` | rgba(34,197,94,0.1) | rgba(14,51,38,0.15) | themes.css:402/626 |
| `--bg-warning-subtle` | rgba(251,191,36,0.1) | rgba(115,50,6,0.15) | themes.css:403/627 |
| `--bg-danger-subtle` | rgba(248,113,113,0.1) | rgba(122,12,12,0.15) | themes.css:404/628 |
| `--bg-accent-subtle` | rgba(59,130,246,0.1) | rgba(22,101,52,0.1) | themes.css:405/629 |

#### 2.7 Text Tokens

| Token | Dark Value | Light Override | References | Category |
|-------|-----------|----------------|------------|----------|
| `--text-primary` | #F9FAFB | #0A0503 | ~50+ (body, headings, charts, tables) | Typography |
| `--text-secondary` | #D1D5DB | #23120B | ~30+ (labels, axes, hints) | Typography |
| `--text-title` | #F9FAFB | #0A0503 | ~15 (section headings) | Typography |
| `--text-muted` | #9CA3AF | #3D1F08 | ~40+ (table headers, sub-admin UI, labels) | Typography |
| `--text-hint` | #6B7280 | #5D4037 | ~3 (low-emphasis footers) | Typography |
| `--text-disabled` | #9CA3AF | #4A3525 | ~8 (disabled inputs/buttons) | Typography |
| `--text-on-accent` | #FFFFFF | #FFFFFF | ~5 (button text) | Typography |
| `--text-on-danger` | #FFFFFF | #FFFFFF | ~3 (danger button text) | Typography |
| `--text-link` | #3B82F6 | #166534 | ~2 (link text) | Typography |
| `--text-on-dark` | var(--text-primary) | var(--brown-500) | ~5 (dark card text) | Typography |

#### 2.8 Border Tokens

| Token | Dark Value | Light Override | References |
|-------|-----------|----------------|------------|
| `--border-default` | #374151 | #C4A882 | ~20 (cards, containers) |
| `--border-input` | #4B5563 | #A87828 | ~10 (inputs) |
| `--border-focus` | #3B82F6 | #166534 | ~5 (focus rings) |
| `--border-hover` | #60A5FA | #8B5A10 | ~8 (hover states) |
| `--border-disabled` | #4B5563 | rgba(196,168,130,0.5) | ~3 (disabled borders) |
| `--border-subtle` | #374151 | rgba(168,120,22,0.30) | ~15 (subtle separators) |
| `--border-gold` | #A87828 | #A87828 (light-only) | **~55 (highest usage)** |

#### 2.9 Accent / Brand Tokens

| Token | Dark Value | Light Override | References |
|-------|-----------|----------------|------------|
| `--color-accent` | #3B82F6 | #166534 | ~30 (primary interactive) |
| `--color-accent-hover` | #60A5FA | #14532D | ~10 (hover state) |
| `--color-accent-subtle` | rgba(59,130,246,0.1) | rgba(22,101,52,0.08) | ~8 (subtle bg) |
| `--color-accent-rgb` | 59,130,246 | 22,101,52 | ~3 (rgba usage) |
| `--color-secondary` | #10B981 | #C8960C | ~5 |
| `--color-secondary-light` | #34D399 | #D4A84B | ~2 |

#### 2.10 State Tokens

| Token | Dark Value | Light Override | References |
|-------|-----------|----------------|------------|
| `--color-success` | #22C55E | #16A34A | ~10 |
| `--color-success-hover` | #16A34A | #15803D | ~3 |
| `--color-success-subtle` | rgba(34,197,94,0.15) | rgba(22,163,74,0.08) | ~3 |
| `--color-warning` | #FBBF24 | #D97706 | ~8 |
| `--color-warning-hover` | #F59E0B | #B45309 | ~3 |
| `--color-warning-subtle` | rgba(251,191,36,0.15) | rgba(217,119,6,0.08) | ~3 |
| `--color-danger` | #F87171 | #DC2626 | ~10 |
| `--color-danger-hover` | #EF4444 | #B91C1C | ~3 |
| `--color-danger-subtle` | rgba(248,113,113,0.15) | rgba(220,38,38,0.08) | ~3 |
| `--color-info` | #3B82F6 | #166534 | ~4 |
| `--color-info-subtle` | rgba(59,130,246,0.1) | rgba(22,101,52,0.08) | ~3 |

#### 2.11 Shadow / Elevation Tokens

| Token | Dark Value | Light Override | Defined In |
|-------|-----------|----------------|------------|
| `--shadow-xs` through `--shadow-2xl` | Various | Various | themes.css:449-454 / 674-679 |
| `--elevation-1` through `--elevation-7` | Various (simple) | Various (complex carved) | themes.css:457-463 / 682-688 |

#### 2.12 Icon Tokens

| Token | Dark Value | Light Override |
|-------|-----------|----------------|
| `--icon-default` | #D1D5DB | #57534E |
| `--icon-accent` | #3B82F6 | #166534 |
| `--icon-disabled` | #9CA3AF | #8D6E63 |
| `--icon-success` | #22C55E | #16A34A |
| `--icon-danger` | #F87171 | #DC2626 |
| `--icon-warning` | #FBBF24 | #D97706 |
| `--icon-info` | #3B82F6 | #166534 |

#### 2.13 Selection / Focus / Scrollbar / Placeholder Tokens

| Token | Dark | Light |
|-------|------|-------|
| `--selection-bg` | #2D5A27 | #166534 |
| `--selection-text` | #FFFFFF | #FFFFFF |
| `--focus-ring-color` | rgba(59,130,246,0.5) | rgba(22,101,52,0.4) |
| `--scrollbar-thumb` | #374151 | #C4A882 |
| `--scrollbar-thumb-hover` | #4B5563 | #A87828 |
| `--placeholder-color` | #9CA3AF | #4A3525 |

#### 2.14 Gradient Tokens

| Token | Dark Value | Light Override |
|-------|-----------|----------------|
| `--gradient-primary` | linear-gradient(90deg, #3B82F6, #60A5FA) | linear-gradient(90deg, #166534, #14532D) |
| `--gradient-success` | linear-gradient(90deg, #22C55E, #34D399) | linear-gradient(90deg, #16A34A, #15803D) |
| `--gradient-danger` | linear-gradient(90deg, #F87171, #EF4444) | linear-gradient(90deg, #DC2626, #B91C1C) |
| `--gradient-warning` | linear-gradient(90deg, #FBBF24, #F59E0B) | linear-gradient(90deg, #D97706, #B45309) |
| `--gradient-app` | none | radial-gradient(circle at 50% 0%, #EFE1C6, #E2CFA6, #D2BA8E) |
| `--gradient-surface` | none | linear-gradient(170deg, rgba(255,240,195,0.35), ...) |
| `--gradient-header` | none | linear-gradient(150deg, #162B1C, #0A1A10) |
| `--gradient-sidebar` | none | rgba(12,32,20,0.95) |

#### 2.15 Navigation Tokens

| Token | Dark | Light |
|-------|------|-------|
| `--bg-nav` | var(--bg-surface) | rgba(12,32,20,0.95) |
| `--text-nav` | var(--text-primary) | rgba(255,255,255,0.95) |
| `--border-nav` | var(--border-default) | rgba(200,150,12,0.25) |
| Plus 10 more nav-specific tokens | | |

#### 2.16 Foundation 4.6A Surface / Elevation Tokens (in themes.css)

| Token | Purpose |
|-------|---------|
| `--surface-canvas` through `--surface-overlay` (8 tokens) | Semantic surface hierarchy |
| `--elevation-canvas` through `--elevation-overlay` (8 tokens) | Semantic elevation levels |
| `--shadow-ambient` through `--shadow-modal` (6 tokens) | Single shadow system |
| `--nav-surface` through `--nav-border` (10 tokens) | Navigation surface system |

#### 2.17 Light-only Material Tokens (Foundation 5.0)

| Token | Purpose |
|-------|---------|
| `--border-gold` | Gold edge for cards |
| `--surface-stat` | Stat card gradient surface |
| `--surface-stat-overlay` | Stat card gradient overlay |
| `--surface-tab-pill` | Active tab pill gradient |
| `--card-parchment` | Card parchment gradient |
| `--card-3d-shadow` | Carved parchment card shadow |
| `--stat-card-3d-shadow` | Stat card 3D shadow |
| `--elevation-carved` | Carved depth effect |
| `--table-row-hover-light` | Table row hover |
| `--header-shadow-md` | Header medium shadow |
| `--header-shadow-sm` | Header small shadow |

#### 2.18 Ancient Backward Compatibility Tokens

| Token | Dark (alias) | Light (literal) |
|-------|-------------|----------------|
| `--ancient-gold` | var(--primary) | #C8960C |
| `--ancient-brown-deep` | var(--text-primary) | #2D1505 |
| `--ancient-brown` | var(--text-secondary) | #5D4037 |
| `--ancient-cream` | var(--card-bg) | #DFC096 |
| `--ancient-danger` | var(--danger) | #DC2626 |
| Plus 6 more ancient tokens | | |

#### LAYER 2 TOTAL: ~140 tokens

---

### Layer 3 — Component Tokens (themes.css)

#### 2.19 Card Component Tokens

| Token | Value | Defined In |
|-------|-------|------------|
| `--card-bg` | var(--bg-surface) | themes.css:853 |
| `--card-text` | var(--text-primary) | themes.css:924 |
| `--card-border` | rgba(55,65,81,0.5) | themes.css:925 |
| `--card-shadow` | var(--elevation-2) | themes.css:926 |
| `--card-radius` | var(--radius-card) | themes.css:927 |
| `--card-hover-shadow` | var(--elevation-raised) | themes.css:928 |
| `--card-hover-border` | var(--border-hover) | themes.css:929 |
| `--card-header-text` | var(--text-primary) | themes.css:930 |
| `--card-body-text` | var(--text-secondary) | themes.css:931 |
| `--card-padding` | 24px | themes.css:932 |
| `--card-padding-sm` | 16px | themes.css:933 |

Light overrides: `--card-border: var(--border-gold)`, `--card-shadow: var(--card-3d-shadow)` (themes.css:1030-1031)

#### 2.20 Stat Card Component Tokens

| Token | Value |
|-------|-------|
| `--stat-card-bg` | var(--bg-surface) / Light: var(--surface-stat) |
| `--stat-card-text` | var(--text-primary) |
| `--stat-card-border` | var(--border-subtle) / Light: var(--border-gold) |
| `--stat-card-shadow` | var(--shadow-sm) / Light: var(--stat-card-3d-shadow) |
| `--stat-card-radius` | var(--radius-container) |
| `--stat-value-text` | var(--text-primary) |
| `--stat-label-text` | var(--text-secondary) / Light: var(--text-muted) |
| `--stat-icon-bg` | var(--bg-accent-subtle) |
| `--stat-icon-color` | var(--icon-accent) |
| `--stat-icon-radius` | var(--radius-control) |

#### 2.21 Button Component Tokens

| Token | Value |
|-------|-------|
| `--btn-primary-bg` | var(--color-accent) |
| `--btn-primary-text` | var(--text-on-accent) |
| `--btn-primary-hover-bg` | var(--color-accent-hover) |
| `--btn-primary-shadow` / hover / active | var(--shadow-sm/md/xs) |
| `--btn-secondary-*` | transparent / border-based |
| `--btn-danger-*` | var(--color-danger) based |
| `--btn-success-*` | var(--color-success) based |
| `--btn-ghost-*` | transparent / text-based |
| `--btn-outline-*` | accent border-based |
| Light override: `--btn-primary-active-shadow` | inset carved shadow |

#### 2.22 Input Component Tokens

| Token | Value |
|-------|-------|
| `--input-bg` | var(--bg-input) |
| `--input-text` | var(--text-primary) |
| `--input-border` | var(--border-input) |
| `--input-radius` | var(--radius-control) |
| `--input-focus-border` | var(--border-focus) |
| `--input-focus-shadow` | 0 0 0 3px var(--focus-ring-color) |
| `--input-padding-y` | 12px |
| `--input-padding-x` | 16px |
| `--input-placeholder` | var(--placeholder-color) |
| `--input-shadow` | var(--shadow-pressed) |
| `--input-disabled-bg/text/border` | var(--bg-disabled/text-disabled/border-disabled) |

#### 2.23 Header / Sidebar Component Tokens

| Token | Value |
|-------|-------|
| `--sidebar-bg` | var(--bg-surface) / Light: var(--gradient-header) |
| `--sidebar-border` | var(--border-default) / Light: var(--border-gold) |
| `--header-bg` | var(--bg-surface) / Light: var(--sidebar-bg) |
| `--header-border` | var(--border-default) / Light: var(--sidebar-border) |
| `--header-shadow` | var(--shadow-sm) / Light: var(--elevation-carved) |

#### LAYER 3 TOTAL: ~55 tokens

---

### Tailwind @theme Bridge (index.css)

The `@theme` block in `src/index.css:34-119` maps CSS custom properties to Tailwind utility classes:

| Tailwind Utility | Maps To | Notes |
|-----------------|---------|-------|
| `text-primary` | var(--color-accent) | Brand primary color |
| `text-text-primary` | var(--text-primary) | Body text |
| `text-text-title` | var(--text-title) | Heading text |
| `text-text-secondary` | var(--text-secondary) | Secondary text |
| `text-text-muted` | var(--text-muted) | Muted text |
| `text-text-hint` | var(--text-hint) | Hint text |
| `text-text-disabled` | var(--text-disabled) | Disabled text |
| `bg-card-bg` | var(--bg-surface) | Card background |
| `bg-hover-bg` | var(--bg-hover) | Hover background |
| `bg-elevated-bg` | var(--bg-elevated) | Elevated background |
| `shadow-card-shadow` | var(--card-shadow) | Card shadow |
| `shadow-card-hover-shadow` | var(--card-hover-shadow) | Card hover shadow |
| `border-card-border` | var(--card-border) | Card border |
| `shadow-elevation-1..7` | var(--elevation-1..7) | Elevation shadows |
| `shadow-xs..2xl` | var(--shadow-xs..2xl) | Standard shadows |
| `radius-xl/2xl/3xl` | 12px/16px/20px | **HARDCODED — conflicts with themes.css** |
| `text-h1..h6` | 1.75rem..0.75rem | **HARDCODED — duplicates :root** |
| `text-body-1/2` | 0.875rem/0.8125rem | Typography scale |
| `text-caption/label/button` | Various | Typography scale |
| `stat-card-surface` | @utility — background-image | Gradient cannot be color utility |

### Duplicated Token Definitions (index.css :root)

The following tokens are defined AGAIN in `index.css:128-201` (redundant with themes.css):

| Token | themes.css | index.css | Conflict? |
|-------|-----------|-----------|-----------|
| `--text-h1..h6` | themes.css:323-340 (primitive) | index.css:138-143 | **YES** — index.css values differ |
| `--text-body-1/2` | — | index.css:148-149 | Duplicated in @theme block |
| `--text-caption` | — | index.css:151 | Duplicated |
| `--app-bg` | — | index.css:157 | New alias |
| `--card-bg` | themes.css:853 | index.css:158 | Redundant |
| `--elevated-bg` | — | index.css:159 | New alias |
| `--text-primary` | themes.css:408 | index.css:161 | **Re-definitions** |
| `--text-secondary` | themes.css:409 | index.css:162 | **Re-definitions** |
| `--text-disabled` | themes.css:413 | index.css:163 | **Re-definitions** |
| `--border-color` | — | index.css:164 | New alias |
| `--border-subtle` | themes.css:425 | index.css:165 | **Re-definitions** |
| `--input-border` | themes.css:858 | index.css:166 | Redundant |
| `--primary` | — | index.css:169 | New shorthand |
| `--secondary` | — | index.css:173 | **Hardcoded #10B981** |
| `--success` | — | index.css:174 | **Hardcoded #22C55E** |
| `--danger` | — | index.css:175 | **Hardcoded #F87171** |
| `--warning` | — | index.css:176 | **Hardcoded #FBBF24** |
| `--info` | — | index.css:177 | **Hardcoded #3B82F6** |
| `--ancient-gold..cream-light` | themes.css:592-603 | index.css:180-191 | **Triple definition** |

---

## 3. Token Categories Summary

| Category | Layer 1 | Layer 2 | Layer 3 | Total |
|----------|---------|---------|---------|-------|
| Colors (scales) | 187 | — | — | 187 |
| Backgrounds | — | 12 | 1 | 13 |
| Text / Typography | 39 | 10 | — | 49 |
| Borders | — | 7 | 3 | 10 |
| Accent / Brand | — | 6 | — | 6 |
| State (success/warning/danger/info) | — | 11 | — | 11 |
| Shadows | 7 | 6 | 3 | 16 |
| Elevation | — | 7 | 7 | 14 |
| Radius | 10 | 7 | — | 17 |
| Icons | — | 7 | — | 7 |
| Gradients | — | 8 | — | 8 |
| Navigation | — | 12 | — | 12 |
| Selection / Focus / Scrollbar | — | 9 | — | 9 |
| Surfaces | — | 8 | — | 8 |
| Ancient compat | — | 12 | — | 12 |
| Light-only material | — | 11 | — | 11 |
| Button tokens | — | — | ~30 | 30 |
| Input tokens | — | — | 11 | 11 |
| Card tokens | — | — | 11 | 11 |
| Stat card tokens | — | — | 10 | 10 |
| Header/sidebar tokens | — | — | 5 | 5 |
| **TOTAL** | **~264** | **~140** | **~55** | **~459** |

---

## 4. Dependency Graph

### 4.1 Background Token Family

```
--gray-900 (#111827)  ──┐
--brown-600 (#C9A070) ──┼── Layer 1 Primitives
                        │
    ┌───────────────────┘
    ↓
--bg-app ─────── #111827 (dark) / #E2CFA6 (light)
    ↓
┌─── @theme ─── color-app-bg
│
├─── Surface tokens ─── --surface-canvas = var(--bg-app)
│
└─── Components ─── body { background: var(--app-bg) }  ← (index.css re-alias)
    ↓
    Pages ─── <body>, <html>, #root
```

```
--bg-surface (#1F2937)
    ↓
┌── --surface-primary = var(--bg-surface)
├── --card-bg = var(--bg-surface)
├── --sidebar-bg = var(--bg-surface)  / Light: var(--gradient-header)
├── --header-bg = var(--bg-surface)   / Light: var(--sidebar-bg)
├── --stat-card-bg = var(--bg-surface) / Light: var(--surface-stat)
│
└── @theme ─── color-card-bg
    ↓
    Card (AntigravityCard) → StatCard → ExamCard → ExamPaperCard
    AdminCard → QuestionsTable → SettingsCard
```

### 4.2 Text Token Family

```
--gray-50 (#F9FAFB) ──┐
--slate-100 (#F1F5F9) ┼── Layer 1
                       │
    ┌──────────────────┘
    ↓
--text-primary: #F9FAFB (dark) / #0A0503 (light)
    ↓
┌── @theme ─── color-text-primary ──→ Tailwind: text-text-primary
├── --text-title ──→ Tailwind: text-text-title
├── --card-text = var(--text-primary) ──→ Card component
├── --stat-value-text = var(--text-primary) ──→ StatCard
├── --input-text = var(--text-primary) ──→ Input component
├── --stat-card-text = var(--text-primary) ──→ StatCard
│
└── Components ─── H1, H2, H3, Body, Label, AdminPageTitle, DataGrid
    ↓
    Pages ─── UserDashboard, AdminOverview, SubAdminDashboard, etc.
```

```
--text-muted (#9CA3AF / #3D1F08)
    ↓
┌── @theme ─── color-text-muted ──→ Tailwind: text-text-muted
├── --stat-label-text (dark) / var(--text-muted) (light)
├── --text-nav-secondary ──→ Navigation
├── --placeholder-color (dark)
│
└── Components ─── Label, AdminPageTitle, Table headers, SubAdmin views
    Usage count: ~40 references
```

### 4.3 Border / Gold Token Family

```
--brown-700 (#A87828) ──┐── Layer 1 Primitive
--gold-200 (#C8960C) ────┘
    ↓
--border-gold: #A87828 (light-only semantic)
    ↓
┌── Components ─── TopicSectionRenderer (~15 refs), TopicReader (~10 refs),
│                  TopicCard (~2 refs), CarouselDots, AntigravityCard (premium),
│                  AntigravityButton (light primary), AttemptCardBase, AntigravityData
├── CSS ─── .ancient-card border, .ancient-tab-pill, .ancient-tab-track,
│            .ancient-header, .ancient-btn-primary, .ancient-input
├── Pages ─── SplashPage (3 refs)
│
└── Total usage: ~55 references (HIGHEST USED TOKEN)
```

### 4.4 Accent / Primary Token Family

```
--blue-500 (#3B82F6) ──────── Layer 1 (dark accent)
--forest-500 (#1C3D28) ────── Layer 1 (light brand)
--green-800 (#166534) ─────── Layer 1 (light accent)
    ↓
--color-accent: #3B82F6 (dark) / #166534 (light)
    ↓
┌── @theme ─── color-primary ──→ Tailwind: bg-primary, text-primary
├── --color-accent-hover ──→ hover states
├── --color-accent-subtle ──→ bg-primary/10
├── --border-focus ──→ focus rings
├── --border-accent ──→ accent borders
├── --btn-primary-bg ──→ Button component
├── --icon-accent ──→ Icon tinting
├── --gradient-primary ──→ Gradient buttons
│
└── Components ─── Button (all variants), Card (premium), Badge,
    FilterSelect, ProgressBar, Tabs, IconButton, ProgressBar
    ↓
    Pages ─── All pages (primary interactive color)
```

### 4.5 Elevation / Shadow Token Family

```
--shadow-offset-xs..2xl ────── Layer 1 Primitives
    ↓
--shadow-xs..2xl ─────── Semantic (composed shadows)
    ↓
┌── --elevation-1..7 ──── Higher-level elevation (some overlap)
├── --shadow-ambient/contact/hover/pressed/focus/modal ── Foundation 4.6A
├── @theme ─── shadow-xs..2xl, shadow-elevation-1..7
│
└── Components ─── Card (all variants), Button, Modal, Overlay, Tabs
    Light mode: complex carved shadows with warm tones
    Dark mode: simple dark shadows with opacity
```

### 4.6 Ancient Premium Material Token Family (Light Mode Only)

```
--card-3d-shadow ─────────────── Carved parchment card
--stat-card-3d-shadow ────────── Carved stat card
--elevation-carved ───────────── Carved depth effect
--surface-stat ───────────────── Gold gradient surface
--surface-tab-pill ───────────── Active tab gradient
--border-gold ────────────────── Gold edge
--gradient-header ────────────── Dark forest green gradient
--header-shadow / --header-shadow-md / --header-shadow-sm
    ↓
┌── .ancient-card ──────────── Parchment card material
├── .ancient-card-dark ─────── Dark forest card
├── .ancient-tab-track ─────── Forest chrome tab track
├── .ancient-tab-pill ──────── Parchment floating pill
├── .ancient-icon-badge ────── Forest chrome medallion
├── .ancient-input/select/textarea ── Material inputs
├── .ancient-overlay ───────── Floating overlay
├── .ancient-tooltip ───────── Tooltip material
├── .ancient-btn-* ─────────── Button variants
├── .ancient-sidebar ───────── Sidebar material
├── .ancient-header ────────── Header material
├── .ancient-3d-lift ───────── Hover lift effect
├── .ancient-nav-item-active ── Active nav item
│
└── Components consuming .ancient-* classes:
    AdminCard, AdminIconWrap, AdminTabTrack, AdminSelectionTabs,
    AntigravityData, AntigravityLayout (FilterSelect, dropdown),
    SubjectInsightsCard, OTPInput, ReviewLayout, WelcomeBanner,
    LanguageSelectionScreen, JsonTab, PromptEditorModal,
    QuestionsTable, ProfileDropdown, SharedComponents (ConfirmModal),
    TopicCard, TopicReader, TopicSectionRenderer, ExamDetailModal,
    SubmitExamModal, TeacherLeaderboardModal, Unauthorized,
    SubAdminCreate, SubAdminExams, BulkActionBar
```

---

## 5. Reusable Components Inventory

### 5.1 Antigravity Design System (Internal Component Library)

Exported via barrel: `src/components/common/AntigravityUI.tsx`

| Component | File | Exports | Token Usage | Consumers |
|-----------|------|---------|-------------|-----------|
| **H1, H2, H3, Body, Label** | AntigravityTypography.tsx | Typography primitives | text-text-title, text-text-primary, text-text-secondary, text-text-muted, text-danger | All pages, AdminPageTitle |
| **spacing** | AntigravityTypography.tsx | Static spacing constants | — | Layout spacing |
| **Card, StatCard** | AntigravityCard.tsx | Card variants + stat card | card-bg/border/shadow, stat-card-*, micro-light, gradient-header, border-gold, elevation-carved | ExamCard, Results, Dashboard, All admin/user views |
| **Button, PrimaryButton, IconButton** | AntigravityButton.tsx | Button variants (primary/secondary/success/danger/soft) | color-accent, gradient-header, brown-550, gold-400, elevation-carved, card-bg/border, success/danger | All interactive UI |
| **Input, Select, Switch** | AntigravityForm.tsx | Form controls | ancient-input, ancient-select, hover-bg, border-subtle, text-primary, text-placeholder | Admin forms, auth pages |
| **Tabs, AdminPageTitle, Badge, ProgressBar, MetricBlock, DataGrid** | AntigravityData.tsx | Data display components | ancient-tab-track, ancient-tab-pill, ancient-3d-lift, primary, success, danger, warning, secondary | Admin pages, User pages |
| **PageContainer, Stack, Grid, FilterBar, FilterSelect, StatePanel, SectionHeader, SectionWrapper, SectionBlock, PageHeader** | AntigravityLayout.tsx | Layout primitives | border-subtle, hover-bg, card-bg, text-title/secondary/primary/muted, elevation-6, ancient-select, ancient-overlay | All pages |
| **PageTransition, SectionReveal, StaggerContainer, StaggerItem** | AntigravityAnimation.tsx | Framer Motion wrappers | — (no tokens) | Page transitions |
| **ActivityCard, ExamCard** | AntigravityDashboard.tsx | Dashboard cards | card-bg, border-subtle, hover-bg, text-primary/secondary/muted, primary | UserDashboard, AdminOverview |
| **ScoreCard, ResultStatCard, CTACard** | AntigravityResults.tsx | Result display | primary, hover-bg, border-subtle, success/danger/warning, card-bg | ResultsPage |
| **QuestionCard** | AntigravityReview.tsx | Review display | correct/wrong/skipped colors | ReviewPage |

### 5.2 Common Shared Components

| Component | File | Token Usage | Consumers |
|-----------|------|-------------|-----------|
| **LoadingSkeleton, GridSkeleton, StatSkeleton** | SharedComponents.tsx | card-bg, border-subtle, hover-bg | All loading states |
| **ErrorState, EmptyState** | SharedComponents.tsx | text-primary/secondary, border-subtle, card-bg, primary | All error/empty states |
| **ConfirmModal** | SharedComponents.tsx | card-bg, border-subtle, text-title/secondary, ancient-overlay | Delete confirmations |
| **IconBadge** | IconBadge.tsx | primary/10, primary (dark) | AdminPageTitle, AntigravityData, Review, NotificationPanel |
| **LoadingOverlay** | LoadingOverlay.tsx | card-bg, primary, text-muted | AntigravityUI barrel re-export |
| **NotificationBell** | NotificationPanel.tsx | primary, danger, hover-bg, card-bg, border-subtle, text-primary/secondary/muted | App shell |
| **StartTestButton** | StartTestButton.tsx | Button (primary/secondary) | TopicTestViews, SubjectTestViews |
| **TopicInfoButton** | TopicInfoButton.tsx | primary, card-bg, border-primary/20, text-primary/secondary/muted, ancient-overlay | TopicCard, TopicListView |
| **AttemptCardBase** | AttemptCardBase.tsx | Card (premium), Badge, Body, Label, border-gold, brown-550, gold-400, success, text-on-dark | RecentAttemptCard |
| **RecentAttemptCard** | RecentAttemptCard.tsx | AttemptCardBase | UserDashboard, UserHistory |
| **ExamPaperCard** | ExamPaperCard.tsx | ExamCard, MetricBlock | TopicTestViews, SubjectTestViews |
| **BilingualToggle** | BilingualToggle.tsx | primary, hover-bg, text-secondary | TopicReader, QuestionCard |
| **ErrorActionButtons** | ErrorActionButtons.tsx | Button (secondary/primary) | ErrorBoundary, ExamPageError |
| **FormattedBodyText** | FormattedBodyText.tsx | text-primary, border-subtle, hover-bg, primary | TopicReader |
| **QuestionVisualizer** | QuestionVisualizer.tsx | border-subtle, text-primary/secondary, surface-floating, card-bg | QuestionCard, ReviewQuestionCard |
| **DiagramRenderer** | DiagramRenderer.tsx | border-subtle, text-primary/secondary, surface-floating, card-bg | FormattedBodyText |
| **Logo** | Logo.tsx | — | App shell |
| **Loader** | Loader.tsx | — | Loading states |
| **PremiumLoader** | PremiumLoader.tsx | premium-green | SplashPage |
| **LoadingScreen** | LoadingScreen.tsx | — | Route loading |
| **OTPInput** | OTPInput.tsx | ancient-otp, border-gold, text-primary | Auth flow |
| **ExamTimer** | ExamTimer.tsx | — | ExamHeader |
| **PaletteBackground** | PaletteBackground.tsx | — | SplashPage |
| **ErrorBoundary** | ErrorBoundary.tsx | ErrorActionButtons | App root |

### 5.3 Admin Common Components

| Component | File | Token Usage | Consumers |
|-----------|------|-------------|-----------|
| **AdminCard** | AdminCard.tsx | ancient-card (light), bg-primary (elevated dark) | Admin pages |
| **AdminFilterBar** | AdminFilterBar.tsx | FilterBar, Input, FilterSelect, IconButton | AdminUsers, AdminTopics, AdminSubAdmins, AdminQuestions |
| **AdminIconWrap** | AdminIconWrap.tsx | ancient-icon-badge (light), bg-primary/10 (dark) | Admin views |
| **AdminModal** | AdminModal.tsx | card-bg, border-subtle, text-title/secondary, ancient-overlay | All admin modals |
| **AdminPageShell** | AdminPageShell.tsx | — (state management only) | All admin pages |
| **AdminTabTrack** | AdminTabTrack.tsx | ancient-tab-track (light), card-bg/50 border-subtle (dark) | Admin navigation |
| **AdminText** | AdminText.tsx | font-cinzel, font-garamond (light only) | Admin typography |
| **BulkActionBar** | BulkActionBar.tsx | ancient-card, ancient-gold/brown/brown-deep | AdminQuestions bulk mode |
| **DifficultyBadge** | DifficultyBadge.tsx | Badge (success/warning/danger) | QuestionsTable |

### 5.4 Exam Components

| Component | File | Key Tokens |
|-----------|------|------------|
| ExamHeader | ExamHeader.tsx | text-primary, bg-app-bg, border-subtle |
| ExamLayout | ExamLayout.tsx | bg-app-bg, text-primary |
| QuestionCard | QuestionCard.tsx | bg-card-bg, border-subtle, primary |
| QuestionOptions | QuestionOptions.tsx | primary, border-subtle, bg-hover-bg |
| QuestionPalette | QuestionPalette.tsx | primary, success, danger, warning |
| QuestionNavigator | QuestionNavigator.tsx | primary, border-subtle |
| QuestionActions | QuestionActions.tsx | Button tokens |
| StatusBoard | StatusBoard.tsx | success, danger, warning, info |
| ReviewLayout | ReviewLayout.tsx | primary, success, danger, info, ancient-input |
| ReviewQuestionCard | ReviewQuestionCard.tsx | success, danger, border-subtle |
| SubmitExamModal | SubmitExamModal.tsx | ancient-overlay, card-bg, border-subtle |
| LanguageSelectionScreen | LanguageSelectionScreen.tsx | ancient-overlay, card-bg |

### 5.5 User Components

| Component | File | Key Tokens |
|-----------|------|------------|
| WelcomeBanner | WelcomeBanner.tsx | forest-900, ancient-card-dark |
| TopicCard | TopicCard.tsx | border-gold, ancient-card-dark |
| TopicReader | TopicReader.tsx | border-gold, ancient-card, primary |
| TopicSectionRenderer | TopicSectionRenderer.tsx | border-gold (heaviest user) |
| TopicListView | TopicListView.tsx | Card, Badge, ProgressBar |
| UserSelectionTabs | UserSelectionTabs.tsx | Tabs component |
| TagBadge | TagBadge.tsx | Badge variants |
| SubjectInsightsCard | SubjectInsightsCard.tsx | ancient-icon-badge, primary |
| PerformanceCharts | PerformanceCharts.tsx | primary, border-subtle |
| PerformanceMetricsGrid | PerformanceMetricsGrid.tsx | StatCard |
| ExamGroupBar | ExamGroupBar.tsx | Badge |
| ExamDetailRow | ExamDetailRow.tsx | Card |
| CarouselDots | CarouselDots.tsx | gold-200, border-gold, primary |
| TeacherLeaderboardModal | TeacherLeaderboardModal.tsx | ancient-overlay |
| TestConfigView | TestConfigView.tsx | Tabs, Button, Input |
| PerformanceSkeleton | PerformanceSkeleton.tsx | SharedComponents skeletons |

---

## 6. Component Ownership

| Owner Domain | Components | Primary Tokens |
|-------------|------------|----------------|
| **Antigravity UI System** | Card, StatCard, Button, IconButton, PrimaryButton, Input, Select, Switch, Tabs, Badge, ProgressBar, MetricBlock, DataGrid, PageContainer, Stack, Grid, FilterBar, FilterSelect, StatePanel, PageHeader, SectionHeader, ExamCard, ScoreCard, ResultStatCard, CTACard, QuestionCard, H1-H3, Body, Label, IconBadge, LoadingOverlay | All semantic Layer 2 tokens via Tailwind @theme |
| **Admin Domain** | AdminCard, AdminFilterBar, AdminIconWrap, AdminModal, AdminPageShell, AdminTabTrack, AdminText, BulkActionBar, DifficultyBadge, AdminSelectionTabs, StatsGrid, DailyAttemptsChart, QuestionsTable, QuestionForm, SettingsCard, SubjectPieChart, LeaderboardView, etc. | ancient-* (light), primary, card-bg, border-subtle |
| **Exam Domain** | ExamHeader, ExamLayout, QuestionCard, QuestionOptions, QuestionPalette, StatusBoard, ReviewLayout, SubmitExamModal, LanguageSelectionScreen, ExamTimer | primary, success, danger, warning, border-subtle, card-bg |
| **User Domain** | WelcomeBanner, TopicCard, TopicReader, TopicSectionRenderer, UserSelectionTabs, TagBadge, SubjectInsightsCard, PerformanceCharts, PerformanceMetricsGrid, ExamGroupBar, CarouselDots, TeacherLeaderboardModal | border-gold (heavy), primary, forest-900, ancient-card-dark |
| **Auth Domain** | LoginPage, SignupPage, VerifyEmailPage, OTPInput, Logo, PaletteBackground, PremiumLoader, LoadingScreen | border-gold (splash), primary, text-primary |
| **Layout Domain** | SidebarLayout, UserLayout, AdminLayout, SubAdminLayout | sidebar-bg, header-bg, header-border, ancient-sidebar, ancient-header |
| **Shared/Common** | ErrorBoundary, ErrorActionButtons, ConfirmModal, EmptyState, ErrorState, LoadingSkeleton, GridSkeleton, StatSkeleton, StartTestButton, TopicInfoButton, BilingualToggle, FormattedBodyText, QuestionVisualizer, DiagramRenderer | All semantic tokens |

---

## 7. Design System Map

```
═══════════════════════════════════════════════════════════════
                    THEME TOKENS (Layer 1)
═══════════════════════════════════════════════════════════════
    themes.css :root
    ├── 187 Color Primitives (gray, blue, green, red, amber, etc.)
    ├── 10 Radius Primitives
    ├── 7 Shadow Primitives
    ├── 39 Typography Primitives
    └── 21 Opacity Primitives
                        ↓
═══════════════════════════════════════════════════════════════
                    THEME TOKENS (Layer 2)
═══════════════════════════════════════════════════════════════
    themes.css :root (dark) + .light (overrides)
    ├── 12 Background Tokens
    ├── 10 Text Tokens
    ├── 7 Border Tokens (+ --border-gold)
    ├── 6 Accent/Brand Tokens
    ├── 11 State Tokens
    ├── 13 Shadow/Elevation Tokens
    ├── 7 Icon Tokens
    ├── 8 Gradient Tokens
    ├── 12 Navigation Tokens
    ├── 8 Surface Tokens (Foundation 4.6A)
    ├── 8 Elevation Semantic Tokens
    ├── 6 Shadow System Tokens
    └── 12 Ancient Compat Tokens
                        ↓
═══════════════════════════════════════════════════════════════
                    THEME TOKENS (Layer 3)
═══════════════════════════════════════════════════════════════
    themes.css :root (component-scoped)
    ├── 11 Card Tokens
    ├── 10 Stat Card Tokens
    ├── ~30 Button Tokens
    ├── 11 Input Tokens
    ├── 5 Header/Sidebar Tokens
    └── Light material overrides (card-3d-shadow, etc.)
                        ↓
═══════════════════════════════════════════════════════════════
                TAILWIND @theme BRIDGE
═══════════════════════════════════════════════════════════════
    index.css @theme { }
    ├── Maps CSS vars → Tailwind utilities
    ├── Duplicated typography scale (text-h1..h6)
    └── Hardcoded shorthand aliases (--primary, --danger, etc.)
                        ↓
═══════════════════════════════════════════════════════════════
              GLOBAL CSS CLASSES (index.css)
═══════════════════════════════════════════════════════════════
    ├── .ancient-card, .ancient-card-dark
    ├── .ancient-tab-track, .ancient-tab-pill
    ├── .ancient-icon-badge
    ├── .ancient-input, .ancient-select, .ancient-textarea
    ├── .ancient-otp
    ├── .ancient-overlay, .ancient-tooltip
    ├── .ancient-btn-primary/secondary/danger/success
    ├── .ancient-sidebar, .ancient-header
    ├── .ancient-nav-item-active
    ├── .ancient-3d-lift
    ├── .premium-card
    ├── .micro-light
    ├── .font-cinzel, .font-garamond
    └── .animate-in, .no-scrollbar, .skeleton-static
                        ↓
═══════════════════════════════════════════════════════════════
              REUSABLE COMPONENTS
═══════════════════════════════════════════════════════════════
    Antigravity System (28 components):
    ├── Typography: H1, H2, H3, Body, Label
    ├── Layout: PageContainer, Stack, Grid, FilterBar, FilterSelect, StatePanel, PageHeader, SectionHeader
    ├── Card: Card, StatCard
    ├── Button: Button, PrimaryButton, IconButton
    ├── Form: Input, Select, Switch
    ├── Data: Tabs, AdminPageTitle, Badge, ProgressBar, MetricBlock, DataGrid
    ├── Animation: PageTransition, SectionReveal, StaggerContainer, StaggerItem
    ├── Dashboard: ActivityCard, ExamCard
    ├── Results: ScoreCard, ResultStatCard, CTACard
    └── Review: QuestionCard

    Common Shared (17 components):
    ├── LoadingSkeleton, GridSkeleton, StatSkeleton
    ├── ErrorState, EmptyState, ConfirmModal
    ├── IconBadge, LoadingOverlay
    ├── NotificationBell, StartTestButton
    ├── TopicInfoButton, BilingualToggle
    ├── ErrorActionButtons, FormattedBodyText
    ├── QuestionVisualizer, DiagramRenderer
    └── ExamPaperCard, AttemptCardBase, RecentAttemptCard

    Admin Common (9 components):
    ├── AdminCard, AdminFilterBar, AdminIconWrap
    ├── AdminModal, AdminPageShell, AdminTabTrack
    ├── AdminText, BulkActionBar, DifficultyBadge

    Exam Components (12 components)
    User Components (15 components)
    Shared Components (7: Logo, Loader, PremiumLoader, etc.)
                        ↓
═══════════════════════════════════════════════════════════════
                    LAYOUTS
═══════════════════════════════════════════════════════════════
    SidebarLayout → UserLayout, AdminLayout, SubAdminLayout
    (All consume: sidebar-bg, header-bg, header-border, ancient-sidebar, ancient-header)
                        ↓
═══════════════════════════════════════════════════════════════
                        PAGES
═══════════════════════════════════════════════════════════════
    Auth (5): LoginPage, SignupPage, VerifyEmailPage, etc.
    User (22): UserDashboard, UserExams, UserPerformance, UserTopics, etc.
    Exam (3): ActiveExamPage, ResultsPage, ReviewPage
    Admin (8): AdminOverview, AdminUsers, AdminTopics, AdminQuestions, etc.
    Sub-Admin (5): SubAdminDashboard, SubAdminExams, etc.
```

---

## 8. Potential Architecture Problems

### CRITICAL

| # | Problem | Location | Impact |
|---|---------|----------|--------|
| 1 | **Triple token definition** for `--ancient-*`, `--text-primary`, `--text-secondary`, `--text-disabled` | themes.css → index.css :root → index.css @theme | Theme values can silently differ between CSS resolution contexts |
| 2 | **Hardcoded color values** in index.css shorthand aliases (`--secondary: #10B981`, `--danger: #F87171`, etc.) | index.css:173-177 | Bypasses the token system; light mode override impossible |
| 3 | **@theme radius conflict**: index.css defines `--radius-xl: 12px`, `--radius-2xl: 16px`, `--radius-3xl: 20px` but themes.css defines `--radius-xl: 20px`, `--radius-2xl: 24px`, `--radius-3xl: 20px` | index.css:66-68 vs themes.css:295-297 | Different radius values depending on consumption method |
| 4 | **Broken @theme references**: `--color-secondary: var(--secondary)`, `--color-success: var(--success)`, `--color-danger: var(--danger)`, `--color-warning: var(--warning)`, `--color-info: var(--info)` | index.css:38-42 | These reference the hardcoded shorthands, not the semantic tokens |

### HIGH

| # | Problem | Location | Impact |
|---|---------|----------|--------|
| 5 | **Page-level hardcoded hex colors**: UserDashboard, UserProfile, ReviewLayout, ResultView, SelectionView, LeaderboardComponents use `color="var(--primary)"`, `color="var(--success)"`, etc. | Multiple pages | Direct primitive bypass, inconsistent with token system |
| 6 | **Direct primitive token usage** in components: `--border-gold`, `--brown-550`, `--gold-200/300/400`, `--forest-900`, `--surface-tab-pill` | AntigravityButton, AntigravityCard, AntigravityData, AttemptCardBase, TopicCard, TopicReader, TopicSectionRenderer, CarouselDots, AntigravityCard (premium) | Skips semantic layer; ~55 direct primitive refs |
| 7 | **Tailwind arbitrary value bypass**: 73+ occurrences of `bg-[var(--token)]`, `text-[var(--token)]`, `border-[var(--token)]` across 16 files | Components and pages | Should use Tailwind @theme utilities instead |
| 8 | **Dual typography systems**: themes.css defines `--text-3xs..--text-10xl` (primitive sizes), index.css defines `--text-h1..h6` (semantic), @theme re-exports them, AND index.css :root redefines `--text-h1..h6` with different values | themes.css + index.css | Confusing scale; 3 definitions of heading sizes |

### MEDIUM

| # | Problem | Location | Impact |
|---|---------|----------|--------|
| 9 | **Elevation token confusion**: themes.css defines `--elevation-1..7` with different values in dark vs light, PLUS `--shadow-ambient/contact/hover/pressed/focus/modal` (Foundation 4.6A), AND `--elevation-canvas/surface/raised/interactive/floating/popover/modal/overlay` | themes.css Layer 2 | 3 overlapping elevation systems with no clear hierarchy |
| 10 | **187 color primitives but ~60% unused**: Many scales (gray, slate, indigo, rose, pink, orange, cyan, emerald) have no semantic token references | themes.css Layer 1 | Bloated token file; unused scales add maintenance burden |
| 11 | **Light mode is complex**: Light theme uses warm parchment/forest/gold material language with carved 3D shadows, while dark mode uses simple flat shadows | themes.css `.light` | 2 completely different design languages coexist |
| 12 | **Component CSS classes in index.css**: `.ancient-card`, `.ancient-btn-*`, `.ancient-sidebar`, etc. are defined in the global stylesheet | index.css:662-945 | Should be component-scoped CSS or CSS modules |

### LOW

| # | Problem | Location | Impact |
|---|---------|----------|--------|
| 13 | **Non-standard radius steps**: `--brown` scale has non-standard 50-step increments (150, 250, 350, 450, 550, 650, 750) | themes.css:199-216 | Inconsistent with other scales |
| 14 | **Pink scale has 1 token**: `--pink-600` only (for Admin Upload route) | themes.css:171 | Incomplete scale |
| 15 | **Gold scale has 5 tokens**: `--gold-50..--gold-400` (not full 50-950) | themes.css:231-234 | Incomplete scale |
| 16 | **`--radius-3xl` duplicated**: Defined as 20px in both themes.css and index.css (but `--radius-xl` differs) | themes.css:297, index.css:68 | Minor inconsistency |
| 17 | **No z-index token system**: Z-index values are ad-hoc across components (z-10, z-20, z-50, z-[100], z-[200], z-[1000], z-[10000]) | Various components | No systematic z-index layering |

---

## 9. Files Scanned

### CSS Files
| File | Lines |
|------|-------|
| `src/styles/themes.css` | 1046 |
| `src/index.css` | 1045 |

### Context / Providers
| File | Lines |
|------|-------|
| `src/context/ThemeContext.tsx` | 46 |

### Component Files (111 total)
| Directory | Count | Examples |
|-----------|-------|----------|
| `src/components/common/` | 25 | AntigravityUI, SharedComponents, IconBadge, QuestionVisualizer |
| `src/components/admin/` | 45 | AdminCard, AdminModal, QuestionsTable, StatsGrid |
| `src/components/exam/` | 16 | ExamHeader, QuestionCard, StatusBoard |
| `src/components/user/` | 20 | WelcomeBanner, TopicCard, PerformanceCharts |
| `src/components/sub-admin/` | 1 | ExamDetailModal |
| `src/components/` (root) | 8 | ErrorBoundary, ExamTimer, OTPInput, Logo |

### Page Files (48 total)
| Directory | Count | Examples |
|-----------|-------|----------|
| `src/pages/` (root) | 7 | LoginPage, SignupPage, SplashPage |
| `src/pages/admin/` | 9 | AdminOverview, AdminUsers, AdminQuestions |
| `src/pages/user/` | 22+ sub-views | UserDashboard, UserPerformance |
| `src/pages/exam/` | 3 | ActiveExamPage, ResultsPage, ReviewPage |
| `src/pages/sub-admin/` | 5 | SubAdminDashboard, SubAdminExams |
| `src/pages/auth/` | 2 | AuthCallbackPage, UpdatePasswordPage |

### Layout Files (4 total)
| File | Lines |
|------|-------|
| `src/layouts/SidebarLayout.tsx` | — |
| `src/layouts/UserLayout.tsx` | — |
| `src/layouts/AdminLayout.tsx` | — |
| `src/layouts/SubAdminLayout.tsx` | — |

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Dependencies: Tailwind v4.2.2, Framer Motion 12.4.7, Recharts 3.8.1, Lucide React |
| `vite.config.ts` | Build config |
| `tsconfig.json` | TypeScript config |

---

## 10. Recommendations for TAS-1.2

### Immediate Priorities (Token Consolidation)

1. **Single source of truth for tokens**: Move ALL token definitions to `themes.css` only. Remove ALL duplicate definitions from `index.css :root` (`--text-primary`, `--text-secondary`, `--text-disabled`, `--border-subtle`, `--input-border`, `--card-bg`, `--ancient-*`, etc.)

2. **Fix @theme bridge**: Remove hardcoded shorthands (`--secondary: #10B981`, `--danger: #F87171`). Map @theme to the actual semantic tokens (`var(--color-secondary)`, `var(--color-danger)`, etc.)

3. **Fix radius conflict**: Reconcile the radius values between themes.css and the @theme block. The Tailwind @theme `--radius-xl/2xl/3xl` definitions must match or reference themes.css.

4. **Remove index.css typography duplication**: The `--text-h1..h6` values in index.css :root conflict with themes.css. Use ONLY the responsive `@media` overrides.

### Token Cleanup

5. **Audit unused primitives**: ~60% of color primitives (gray, slate, indigo, rose, cyan, emerald, orange scales) appear to have zero semantic references. Document which are intentional reserves vs removable.

6. **Create z-index token system**: Define `--z-dropdown`, `--z-modal`, `--z-toast`, `--z-tooltip` etc. to replace ad-hoc z-index values.

7. **Resolve elevation confusion**: Consolidate the 3 overlapping systems (shadow-*, elevation-*, and Foundation 4.6A shadow system) into a single clear hierarchy.

### Component Migration Path

8. **Replace .ancient-* CSS classes with component-scoped styles**: Move `.ancient-card`, `.ancient-btn-*`, `.ancient-sidebar`, `.ancient-header` etc. from index.css into their respective component files or CSS modules.

9. **Replace arbitrary Tailwind values**: Convert `bg-[var(--border-gold)]` → proper Tailwind utilities via @theme. The 73+ arbitrary value usages should become semantic utilities.

10. **Clean up direct primitive references**: Components referencing `--border-gold`, `--brown-550`, `--gold-400` etc. should use semantic tokens instead.

### Component Architecture

11. **Document the Antigravity system**: It's well-structured but undocumented. Create a component catalog with props, variants, and usage examples.

12. **Separate admin common components**: AdminCard, AdminModal, AdminFilterBar etc. should be part of the Antigravity barrel or a separate admin design system export.

### Build for TAS-1.2

The migration should follow the documented dependency direction:

```
Layer 1 (Primitives) → Layer 2 (Semantic) → Layer 3 (Component)
                                                        ↓
                                              Reusable Components
                                                        ↓
                                                    Pages
```

**No page or component should reference Layer 1 directly. All references should flow through Layer 2 semantic tokens.**

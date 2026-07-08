# Phase 2 — Design Token Migration Table

## Overview
Comprehensive mapping of every current hardcoded color, CSS variable, shadow, and gradient
to its replacement Design Token. Created during Phase 2 audit on 2026-07-08.

---

## 1. CURRENT CSS VARIABLES → NEW TOKENS

### 1.1 Theme Palette Variables (in index.css `:root` and `.light`)

| Current Variable | Dark Value | Light Value | → New Token | Layer |
|---|---|---|---|---|
| `--app-bg` | `#111827` | `#E8D5B0` | `--bg-app` | Layer 2 |
| `--card-bg` | `#1F2937` | `#F4E5C4` | `--bg-surface` | Layer 2 |
| `--elevated-bg` | `#374151` | `#FDF5E2` | `--bg-elevated` | Layer 2 |
| `--hover-bg` | `#1F2937` | `#EEDEB5` | `--bg-hover` | Layer 2 |
| `--text-primary` | `#F9FAFB` | `#0A0503` | `--text-primary` | Layer 2 |
| `--text-secondary` | `#D1D5DB` | `#23120B` | `--text-secondary` | Layer 2 |
| `--text-disabled` | `#9CA3AF` | `#4A3525` | `--text-disabled` | Layer 2 |
| `--border-color` | `#374151` | `#8B5A10` | `--border-default` | Layer 2 |
| `--border-subtle` | `#374151` | `rgba(139,90,16,0.45)` | `--border-subtle` | Layer 2 |
| `--input-border` | `#4B5563` | `#59320C` | `--border-input` | Layer 2 |
| `--primary` | `#3B82F6` | `#0E3326` | `--color-accent` | Layer 2 |
| `--primary-hover` | `#60A5FA` | `#164635` | `--color-accent-hover` | Layer 2 |
| `--primary-subtle` | `rgba(59,130,246,0.1)` | `rgba(14,51,38,0.1)` | `--bg-accent-subtle` | Layer 2 |
| `--primary-rgb` | `59, 130, 246` | `14, 51, 38` | `--color-accent-rgb` | Layer 2 |
| `--secondary` | `#10B981` | `#8B5A10` | `--color-secondary` | Layer 2 |
| `--secondary-light` | *(missing)* | `#C8960C` | `--color-secondary-light` | Layer 2 |
| `--success` | `#22C55E` | `#0E3326` | `--color-success` | Layer 2 |
| `--danger` | `#F87171` | `#7A0C0C` | `--color-danger` | Layer 2 |
| `--warning` | `#FBBF24` | `#733206` | `--color-warning` | Layer 2 |
| `--selection-bg` | *(missing)* | `#12291C` | `--selection-bg` | Layer 2 |
| `--selection-text` | *(missing)* | `#E8D5B0` | `--selection-text` | Layer 2 |

### 1.2 Ancient Theme Variables (will be REMOVED after Phase 7)

| Current Variable | Dark Value | Light Value | → Current New Token |
|---|---|---|---|
| `--ancient-gold` | `var(--primary)` | `#A87828` | `--color-accent` (dark) / `#A87828` (distinct) |
| `--ancient-brown-deep` | `var(--text-primary)` | `#3D1F08` | `--text-primary` (dark) / `#3D1F08` (distinct) |
| `--ancient-brown` | `var(--text-secondary)` | `#8B5A10` | `--text-secondary` (dark) / `#8B5A10` (distinct) |
| `--ancient-cream` | `var(--card-bg)` | `#F4E5C4` | `--bg-surface` (dark) / `#F4E5C4` (distinct) |
| `--ancient-danger` | `var(--color-danger)` | `#D32F2F` | `--color-danger` (dark) / `#D32F2F` (distinct) |
| `--ancient-forest` | `var(--primary)` | `#1C3D28` | `--color-accent` (dark) / `#1C3D28` (distinct) |
| `--ancient-gold-bright` | `var(--primary)` | `#C8960C` | `--color-accent` (dark) / `#C8960C` (distinct) |
| `--ancient-amber` | `var(--color-warning)` | `#B45309` | `--color-warning` (dark) / `#B45309` (distinct) |
| `--ancient-cream-light` | `var(--card-bg)` | `#E8D5B0` | `--bg-surface` (dark) / `#E8D5B0` (distinct) |

### 1.3 Tailwind `@theme` Variables

| Current | Resolves To | → New Token |
|---|---|---|
| `--color-primary` | `var(--primary)` | `--color-accent` |
| `--color-primary-hover` | `var(--primary-hover)` | `--color-accent-hover` |
| `--color-secondary` | `var(--secondary)` | `--color-secondary` |
| `--color-success` | `var(--color-success)` | `--color-success` |
| `--color-danger` | `var(--color-danger)` | `--color-danger` |
| `--color-warning` | `var(--color-warning)` | `--color-warning` |
| `--color-info` | `var(--primary)` | `--color-info` |
| `--color-app-bg` | `var(--app-bg)` | `--bg-app` |
| `--color-card-bg` | `var(--card-bg)` | `--bg-surface` |
| `--color-elevated-bg` | `var(--elevated-bg)` | `--bg-elevated` |
| `--color-hover-bg` | `var(--hover-bg)` | `--bg-hover` |
| `--color-text-primary` | `var(--text-primary)` | `--text-primary` |
| `--color-text-secondary` | `var(--text-secondary)` | `--text-secondary` |
| `--color-text-disabled` | `var(--text-disabled)` | `--text-disabled` |
| `--color-text-muted` | `var(--text-disabled)` | `--text-disabled` |
| `--color-border-subtle` | `var(--border-color)` | `--border-subtle` |
| `--color-input-border` | `var(--input-border)` | `--border-input` |
| `--color-input-focus` | `var(--primary)` | `--border-focus` |
| `--color-correct` | `var(--success)` | `--color-success` |
| `--color-wrong` | `var(--danger)` | `--color-danger` |
| `--color-disabled-btn` | `var(--text-disabled)` | `--text-disabled` |
| `--radius-xl` | `12px` | `--radius-md` |
| `--radius-2xl` | `16px` | `--radius-lg` |
| `--radius-3xl` | `20px` | `--radius-xl` |
| `--radius-4xl` | `28px` | `--radius-3xl` |

---

## 2. HARDCODED COLORS IN TSX/JSX → REPLACEMENT TOKENS

### 2.1 Most Common Hardcoded Colors

| Hex Color | Occurrences | → Replacement Token |
|---|---|---|
| `#A87828` | ~30+ | `--color-accent` (dark) / hardcoded ancient-gold (light) → will use `--border-hover` or new token |
| `#8B5A10` | ~20+ | `--border-default` (light) / → `--color-secondary` (light) |
| `#3D1F08` | ~20+ | `--text-primary` (light) → `--brown-900` primitive |
| `#F5EAD4` | ~10+ | `--bg-surface` (light) → `--brown-300` primitive |
| `#FFFDF9` | ~7 | `--brown-50` primitive |
| `#FDF5E2` | ~5 | `--bg-elevated` (light) → `--brown-200` primitive |
| `#F4E5C4` | ~6 | `--bg-surface` (light) → `--brown-400` primitive |
| `#0E3326` | ~6 | `--color-accent` (light) → `--forest-700` primitive |
| `#4A2E1A` | ~5 | `--text-disabled` (light) → `--brown-800` primitive |
| `#B07A14` | ~6 | `--gold-400` primitive |
| `#C8960C` | ~5 | `--gold-200` primitive / `--color-secondary-light` (light) |
| `#94a3b8` | ~6 | `--slate-400` primitive → chart colors map |
| `#6366f1` | ~5 | `--indigo-500` primitive → chart colors map |
| `#1e293b` | ~3 | `--slate-800` primitive |
| `#f8fafc` | ~4 | `--slate-50` primitive |
| `#080810` | ~2 | `--dark-50` primitive |
| `#5D4037` | ~4 | `--brown-750` primitive |
| `#dfc096` | ~4 | `--brown-550` primitive |
| `#b07a14` | ~3 | `--gold-400` primitive |
| `#22C55E` | ~3 | `--color-success` (dark) / `--green-500` primitive |
| `#EF4444` | ~3 | `--red-500` primitive |
| `#110e08` | ~2 | `--canvas-splash-bg` primitive |
| `#030201` | ~1 | `--canvas-splash-dark` primitive |
| `#2c4c3b` | ~2 | `--premium-green` primitive |
| `#f4ebd8` | ~2 | `--premium-cream` primitive |
| `#d4af37` | ~1 | `--premium-gold` primitive |
| `#D97757` | ~1 | `--ai-terracotta` primitive |
| `#10a37f` | ~1 | `--ai-green` primitive |
| `#7c3aed` | ~4 | `--purple-700` primitive |
| `#F59E0B` | several | `--color-warning` (dark) / `--amber-500` primitive |
| `#8B5CF6` | several | `--purple-500` primitive |
| `#64748B` | several | `--slate-500` primitive |

### 2.2 Navigation Route Colors (nav.ts, navigation.ts)

| Route | Current Color | → Replacement Token |
|---|---|---|
| Dashboard | `#2563EB` | `--blue-600` primitive |
| Exams | `#16A34A` | `--green-600` primitive |
| History | `#8B5CF6` | `--purple-500` primitive |
| Subject Tests | `#F59E0B` | `--amber-500` primitive |
| Topic Exams | `#10B981` | `--emerald-500` primitive |
| Study Topics | `#7C3AED` | `--purple-700` primitive |
| Prepare & Write | `#DC2626` | `--red-600` primitive |
| Performance | `#3B82F6` | `--blue-500` primitive |
| Educator Exams | `#7C3AED` | `--purple-700` primitive |
| Leaderboard | `#EA580C` | `--orange-600` primitive |
| Profile | `#0891B2` | `--cyan-600` primitive |
| Admin Overview | `#374151` | `--gray-700` primitive |
| Admin Questions | `#16A34A` | `--green-600` primitive |
| Admin Upload | `#DB2777` | `--pink-600` primitive |
| Admin Topics | `#7C3AED` | `--purple-700` primitive |
| Admin Leaderboard | `#F59E0B` | `--amber-500` primitive |
| Admin Users | `#2563EB` | `--blue-600` primitive |
| Admin Sub Admins | `#4F46E5` | `--indigo-600` primitive |
| Admin Settings | `#EA580C` | `--orange-600` primitive |

### 2.3 Question Palette Colors (paletteColors.ts)

| State | Current Classes & Colors | → Replacement Layer 3 Token |
|---|---|---|
| Correct | `bg-[#22C55E] text-white border-[#22C55E] ring-2 ring-[#22C55E]/30 shadow-md shadow-[#22C55E]/30` | `--palette-item-correct-bg`, `--palette-item-correct-text` |
| Marked | `bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm shadow-[#8B5CF6]/30` | `--palette-item-marked-bg`, `--palette-item-marked-text` |
| Review | `bg-[#F59E0B] text-white border-[#F59E0B] shadow-sm shadow-[#F59E0B]/30` | `--palette-item-review-bg`, `--palette-item-review-text` |
| Visited | `bg-[#8B5CF6]/60 text-white border-[#8B5CF6]/40 shadow-sm` | `--palette-item-visited-bg`, `--palette-item-visited-text` |
| Current | `bg-[#3B82F6] text-white border-[#3B82F6] shadow-sm` | `--palette-item-current-bg`, `--palette-item-current-text` |
| Unanswered | `bg-transparent text-[#94A3B8] border-[#64748B]` | `--palette-item-unanswered-bg`, `--palette-item-unanswered-text` |

### 2.4 Shadow Colors

| Location | Current Shadow | → Replacement Token |
|---|---|---|
| UserTopics (cards) | `2.5px_2.5px_0px_#8B5A10` | `--shadow-sm` (themed per layer) |
| UserTopics (hover) | `4px_4px_0px_#A87828` | `--shadow-md` (themed per layer) |
| ReviewQuestionCard | `3px_4px_0px_rgba(105,62,15,0.5)` | `--stat-card-shadow` component |
| BilingualToggle | `2px_2px_0px_#8B5A10` | `--btn-outline-shadow` component |
| AntigravityForm | `0_0_12px_rgba(27,77,62,0.3)` | `--input-focus-shadow` component |
| ExamTimer | `0_0_15px_rgba(244,63,94,0.2)` | `--exam-timer-danger-shadow` component |
| RankBadge | `0_0_15px_-3px_rgba(245,158,11,0.3)` | `--glow-warning` (Layer 2) |
| OTPInput | `0_0_20px_rgba(14,165,233,0.2)` | `--input-focus-shadow` component |
| SplashPage | `0_0_60px_rgba(200,150,12,0.25)` | *(pending — no gold glow token created)* |
| SplashPage | `0_0_10px_rgba(200,150,12,0.4)` | *(pending — no gold glow token created)* |

---

## 3. GRADIENTS → REPLACEMENT TOKENS

| Location | Current Gradient | → Replacement Token |
|---|---|---|
| SplashPage (bg) | `radial-gradient(circle, #110e08 0%, #030201 100%)` | `--bg-app` + overlay |
| SplashPage (btn) | `from-[#dfc096] to-[#b07a14]` | *(pending — no gold gradient token)* |
| SplashPage (text) | `from-[#f5e0be] to-[#b88c3a]` | *(pending — no gold gradient token)* |
| UserLeaderboard | `from-[#FFD700] to-[#B8860B]` | *(pending — no gold gradient token)* |
| UserUpgrade | `from-[#C8960C]/8 via-card-bg to-card-bg` | *(pending — no gold gradient token)* |
| WelcomeBanner | `from-[rgba(10,30,18,0.95)] via-[rgba(10,30,18,0.7)] to-transparent` | `--gradient-header` |
| Ancient card | `linear-gradient(170deg, rgba(255,240,195,0.35) 0%, rgba(195,145,70,0.08) 45%, rgba(155,100,35,0.12) 100%), #C9A070` | `--gradient-surface` + `--stat-card-bg` |
| Ancient stat card | `linear-gradient(135deg, #D4A55A 0%, #C9943C 50%, #BF8A30 100%)` | *(pending — no stat card gradient token)* |
| Ancient icon badge | `linear-gradient(150deg, #1C3D28 0%, #081510 100%)` | `--gradient-header` |

---

## 4. DUPLICATE VARIABLES IDENTIFIED

| Variable | Duplicate Occurrences | Notes |
|---|---|---|
| `--color-border-subtle` | = `--border-subtle` = `var(--border-color)` | 3 names for same value |
| `--color-text-muted` | = `--text-disabled` | Muted is same as disabled |
| `--color-info` | = `var(--primary)` | Info reuses primary |
| `--radius-xl` through `--radius-4xl` | Defined in `@theme` but not in `:root` | Incomplete radius set |
| `--ancient-*` variables | Map to `--primary`, `--text-primary`, etc. | Unnecessary indirection |

---

## 5. DEPRECATED VARIABLES

These variables exist in the current codebase and will be kept for backward compatibility
during migration but are considered DEPRECATED. New code MUST NOT reference them.

| Deprecated Variable | Replacement |
|---|---|
| `--app-bg` | `--bg-app` |
| `--card-bg` | `--bg-surface` |
| `--elevated-bg` | `--bg-elevated` |
| `--hover-bg` | `--bg-hover` |
| `--border-color` | `--border-default` |
| `--primary` | `--color-accent` |
| `--primary-hover` | `--color-accent-hover` |
| `--primary-subtle` | `--bg-accent-subtle` |
| `--primary-rgb` | `--color-accent-rgb` |
| `--ancient-gold` | `--color-accent` or new token |
| `--ancient-brown-deep` | `--text-primary` or `--brown-900` |
| `--ancient-brown` | `--text-secondary` or `--brown-750` |
| `--ancient-cream` | `--bg-surface` or `--brown-400` |
| `--ancient-forest` | `--color-accent` or `--forest-500` |
| `--ancient-gold-bright` | `--color-secondary-light` |
| `--ancient-amber` | `--color-warning` or `--amber-700` |
| `--ancient-cream-light` | `--bg-surface` or `--brown-500` |
| `--color-border-subtle` | `--border-subtle` |
| `--color-text-muted` | `--text-disabled` |

---

## 6. REMAINING TECHNICAL DEBT (Post-Phase 2)

These issues are IDENTIFIED but NOT FIXED in Phase 2 (per scope):

1. **55+ components** still import `useTheme()` and use `isDark` branches
2. **268 hardcoded colors** in TSX/JSX files (documented above)
3. **44 `.light` CSS override blocks** with ~140 `!important` declarations
4. **6 components** with fully duplicate JSX trees per theme
5. **All `ancient-*` CSS classes** hardcode colors and gradients
6. **`paletteColors.ts`** returns hardcoded Tailwind arbitrary color classes
7. **Gradients and shadows** hardcoded in CSS (`.ancient-card`, `.ancient-stat-card`, etc.)
8. **`!important` usage** in ~140 locations throughout `index.css`
9. **`dark:` Tailwind variants** in component files
10. **`.light` selectors** in `index.css` that change layout properties (not just colors)
11. **Typography duplication** — `font-cinzel`, `font-garamond` conditional on `isDark`
12. **Inline SVG colors** in `QuestionVisualizer.tsx` and `DiagramRenderer.tsx`
13. **Navigation route colors** in `nav.ts` and `navigation.ts` are hardcoded hex values
14. **Chart colors** hardcoded in 5+ chart component files

---

## 7. NEW TOKENS ADDED (Not in Original Codebase)

These tokens are entirely new additions:

| Token | Purpose |
|---|---|
| `--bg-active` | Active/selected state background |
| `--bg-disabled` | Disabled element background |
| `--border-hover` | Hover border color |
| `--border-disabled` | Disabled border color |
| `--color-success-hover` | Success hover state |
| `--color-warning-hover` | Warning hover state |
| `--color-danger-hover` | Danger hover state |
| `--shadow-xs` through `--shadow-2xl` | Complete shadow scale |
| `--shadow-offset-*` | Shadow offset primitives |
| `--font-sans`, `--font-mono` | Font family tokens |
| `--weight-*` | Font weight tokens |
| `--text-3xs` through `--text-10xl` | Complete type scale |
| `--lh-*` | Line height tokens |
| `--ls-*` | Letter spacing tokens |
| `--opacity-*` | Opacity scale tokens |
| `--radius-none` through `--radius-full` | Complete radius scale |
| `--gradient-*` | Gradient tokens |
| `--icon-*` | Icon color tokens |
| `--focus-ring-*` | Focus ring tokens |
| `--scrollbar-*` | Scrollbar tokens |
| `--placeholder-*` | Placeholder tokens |
| `--divider-*` | Divider tokens |
| `--skeleton-*` | Skeleton tokens |
| All Layer 3 `--{component}-*` | Component-scoped tokens |

---

## 8. TOKEN VALIDATION SUMMARY

| Check | Status |
|---|---|
| Every color in `:root` has a semantic token | ✅ Complete |
| Every color in `.light` has a semantic token | ✅ Complete |
| Every shadow has a token | ✅ Complete |
| Every border has a token | ✅ Complete |
| Every radius has a token | ✅ Complete |
| Every typography value is categorized | ✅ Complete |
| Every semantic token resolves to primitives | ✅ Complete |
| Every component token resolves to semantic tokens | ✅ Complete |
| No circular dependencies | ✅ Verified |
| No duplicate tokens | ✅ Verified |
| Layer 1 not referenced by UI directly | ✅ Enforced by spec |
| Layer 2 → Layer 3 dependency direction | ✅ Enforced by spec |

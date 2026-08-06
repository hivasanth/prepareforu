# Golden Reference Design System — PrepareForU

> This document is the **single source of truth** for all UI decisions in the
> PrepareForU repository. Every existing feature and every future feature MUST
> conform to this specification.
>
> **Do NOT redesign the application. Do NOT change the Ancient Gold theme.**
> **Do NOT change branding. Do NOT change the application's visual identity.**
>
> The sole objective is **consistency, maintainability, accessibility, and
> reusability**.

---

## Table of Contents

1.  [Repository Audit Summary](#1-repository-audit-summary)
2.  [Canonical Component Inventory](#2-canonical-component-inventory)
3.  [Design Token Specification](#3-design-token-specification)
4.  [Feedback Strategy](#4-feedback-strategy)
5.  [Form System Specification](#5-form-system-specification)
6.  [Dialog System Specification](#6-dialog-system-specification)
7.  [Typography System Specification](#7-typography-system-specification)
8.  [Spacing System Specification](#8-spacing-system-specification)
9.  [Animation System Specification](#9-animation-system-specification)
10. [Accessibility Standard](#10-accessibility-standard)
11. [Repository Gap Analysis](#11-repository-gap-analysis)
12. [Implementation Plan](#12-implementation-plan)
13. [Validation Criteria](#13-validation-criteria)
14. [Certification Checklist](#14-certification-checklist)
15. [Design System Governance](#15-design-system-governance)

---

## 1. Repository Audit Summary

### 1.1 Component Inventory

| Category | Canonical File | Exports | Variants | States |
|---|---|---|---|---|
| **Button** | `AntigravityButton.tsx` | `Button`, `PrimaryButton`, `IconButton` | 9 variants, 6 sizes | loading, disabled, focus, hover, active, tap |
| **Card** | `AntigravityCard.tsx` | `Card`, `StatCard` | 7 card variants, 6 stat statuses | hover, loading (StatCard) |
| **Form** | `AntigravityForm.tsx` | `Input`, `TextArea`, `Select`, `Switch`, `Checkbox`, `Radio`, `RadioGroup` | 3 input variants | disabled, focus, hover, checked, error (partial) |
| **Layout** | `AntigravityLayout.tsx` | `PageContainer`, `Stack`, `Grid`, `FilterBar`, `FilterSelect`, `StatePanel`, `SelectionContainer`, `SectionHeader`, `PageHeader`, `SectionBlock`, `SectionWrapper` | responsive cols, gap keys | none |
| **Data** | `AntigravityData.tsx` | `Tabs`, `Badge`, `ProgressBar`, `MetricBlock`, `DataGrid`, `AdminPageTitle` | 2 tab variants, 6 badge variants, 4 progress colors | tab disabled, badge pulse, sortable columns |
| **Typography** | `AntigravityTypography.tsx` | `H1`, `H2`, `H3`, `Body`, `Label`, `BrandTitle` | 2 BrandTitle variants | Label error |
| **Dialog** | `AdminModal.tsx` | `AdminModal` | maxWidth variants, showCloseButton | open/close, aria-modal, focus trap |
| **Dialog** | `SharedComponents.tsx` | `ConfirmModal` | danger variant | open/close, wraps AdminModal |
| **Error** | `ErrorContainer.tsx` + `usePageError.ts` | `ErrorContainer`, `RetryButton` | 4 variants (page/inline/banner/modal), 13 categories | idle/loading/error/retrying/success state machine |
| **Toast** | `useToast.tsx` | `useToast()`, `ToastContainer` | success/error/info | auto-dismiss, 3000ms |
| **Menu** | `Menu.tsx` | `Menu` (compound: Trigger, Content, Item, Separator) | 3 animations (scale/fade/slide), 3 alignments | open/close, disabled item, keyboard nav |
| **Navigation** | `Navigation.tsx` | `Navigation` (Shell, Items, Item), `useNavigationActive`, `useSidebarMode` | 3 modes (drawer/collapsed/expanded) | active path, collapsed/expanded |
| **Loading** | `SharedComponents.tsx` | `LoadingSkeleton`, `GridSkeleton`, `StatSkeleton` | text/card types | animate-pulse |
| **Loading** | `Spinner.tsx` | `Spinner` | 3 sizes, 2 variants | always animating |
| **Loading** | `LoadingOverlay.tsx` | `LoadingOverlay` | visible prop | aria-live="polite" |
| **Empty** | `SharedComponents.tsx` | `EmptyState` | action button variant | icon/title/subtitle/action |
| **Alert** | `Alert.tsx` | `Alert` | 4 variants (info/success/error/warning) | role="alert" for error |
| **Pagination** | `Pagination.tsx` | `Pagination` | hasMore/totalPages | disabled prev/next at boundaries |
| **Badge** | `AntigravityData.tsx` | `Badge` | 6 variants, 2 sizes | pulse animation |
| **Icon** | `IconBadge.tsx` | `IconBadge` | 11 sizes, 7 statuses, 2 shapes | none |
| **Theme** | `ThemeToggle.tsx` | `ThemeToggle` | light/dark | spring animation, disabled |
| **SegmentedFilter** | `SegmentedFilter.tsx` | `SegmentedFilter` | 3 sizes | active option, disabled option |

### 1.2 Design Token Architecture

3-layer system defined in `src/styles/themes.css` (1120 lines) with `@theme` registrations in `src/index.css` (1110 lines).

| Layer | Purpose | Defined In | Count |
|---|---|---|---|
| **Layer 1 — Primitives** | Raw values (colors, sizes, radii) | `themes.css :root` | ~570 tokens |
| **Layer 2 — Semantic** | Contextual meaning (--text-primary, --bg-surface) | `themes.css :root` + `.light` | ~120 tokens |
| **Layer 3 — Component** | Component-scoped tokens (--btn-primary-bg) | `themes.css :root` + `.light` | ~80 tokens |

**Rule**: UI code MUST reference only Layer 2 (semantic) tokens. Layer 1 (primitives) are for token definitions only. Layer 3 (component) is for component-specific overrides.

### 1.3 Key Problems Identified

| Problem | Severity | Impact |
|---|---|---|
| Two parallel typography systems (CSS h1-h6 vs Foundation H1-H3) with different sizes | **HIGH** | Inconsistent heading sizes across pages |
| 200+ arbitrary `text-[...]` values bypassing `@theme` tokens | **HIGH** | Token system not enforced |
| 86+ arbitrary `rounded-[...]` values; only 3 radii registered in `@theme` | **HIGH** | Radius inconsistency |
| 76+ arbitrary `shadow-[...]` values | **HIGH** | Shadow inconsistency |
| 28 success toast calls for normal workflows (not errors) | **MEDIUM** | Violates feedback strategy |
| Form validation split: inline (auth) vs toast errors (admin/features) | **MEDIUM** | Inconsistent UX |
| 7+ domain-specific modals with independent animations/spacing | **MEDIUM** | Dialog inconsistency |
| 10+ canonical card components with overlapping purpose | **MEDIUM** | Card proliferation |
| Inline `<style>` tags in 3 pages (SplashPage, UpdatePasswordPage) | **MEDIUM** | Performance + maintainability |
| Custom spinner implementations in 3 pages instead of `Spinner` component | **MEDIUM** | Duplicate code |
| 5 pages entirely bypass design system (no PageContainer, Card, or Stack) | **HIGH** | Design system not adopted |
| Raw `<button>` elements instead of `Button` component (VerifyEmailPage) | **MEDIUM** | Button inconsistency |
| Font name mismatch: `font-cinzel` and `font-garamond` both resolve to Vend Sans | **LOW** | Misleading names |
| Dead `spacing` export in `AntigravityTypography.tsx` | **LOW** | Dead code |
| `ErrorContainerVariant` type exported but never used | **LOW** | Dead type |
| 5 of 7 specialized capture helpers in `usePageError` never used | **LOW** | Dead code |
| 3 distinct error-handling patterns across 17 services | **MEDIUM** | Error handling fragmentation |
| Foundation 4.6A tokens (--surface-canvas, --elevation-canvas) defined but unused | **LOW** | Dead tokens |
| Two parallel elevation systems (--elevation-1-7 vs --elevation-canvas-overlay) | **LOW** | Token duplication |
| `getBreakpoint()` vs `useEffect` listener breakpoint mismatch | **LOW** | Potential responsive bug |

### 1.4 Pages Bypassing Design System

| Page | Missing Canonical Components | Arbitrary Values Count | Fix Priority |
|---|---|---|---|
| `SplashPage.tsx` | No AntigravityUI imports at all, inline `<style>` tag | 15+ | **HIGH** |
| `FinishSignInPage.tsx` | No PageContainer/Card/Stack, manual card | 6+ | **HIGH** |
| `AccountDisabledPage.tsx` | No PageContainer/Card/Stack, manual card | 5+ | **HIGH** |
| `UpdatePasswordPage.tsx` | No PageContainer/Card/Stack, 5 inline styles, inline `<style>` | 15+ | **HIGH** |
| `VerifyEmailPage.tsx` | Raw `<button>` elements, manual spinners | 18+ | **HIGH** |
| `LoginPage.tsx` | Manual `<h1>` with arbitrary text size | 12+ | **MEDIUM** |
| `SignupPage.tsx` | Manual `<h1>`, custom spinner, inline styles | 15+ | **MEDIUM** |

---

## 2. Canonical Component Inventory

### 2.1 Button System (`AntigravityButton.tsx`)

**Purpose**: Single button system for all actions across the application.

**Responsibilities**:
- Render clickable actions with consistent styling
- Show loading state with spinner
- Disable interaction when loading or disabled
- Provide accessible focus indicators

**Variants**:

| Variant | Use Case | Theme |
|---|---|---|
| `primary` | Primary CTA (default) | Forest green (light), Blue (dark) |
| `secondary` | Secondary actions | Bordered, subtle |
| `success` | Confirm/save success | Green |
| `danger` | Destructive actions | Red |
| `soft` | Subtle primary variant | Transparent primary tint |
| `ghost` | Minimal, low emphasis | Transparent |
| `auth-dark` | Auth flow dark button | Slate-900 |
| `auth-muted` | Auth flow muted button | Slate-50 |
| `auth-violet` | Auth flow accent | Violet gradient |

**Sizes**:

| Size | Height | Padding | Radius | Font |
|---|---|---|---|---|
| `xs` | 32px | 12px | 10px | 10px |
| `sm` | 36px | 16px | 12px | 12px |
| `md` | 48px | 24px | 14px | 13px |
| `lg` | 48px | 32px | 14px | 14px |
| `xl` | 56px | 40px | 16px | 15px |
| `auth-xl` | py-5 | 24px | 18px | 15px |

**States**:

| State | Implementation |
|---|---|
| **Default** | Base variant styles |
| **Hover** | `whileHover: scale(1.01)`, brightness/translate-y adjustments |
| **Active/Tap** | `whileTap: scale(0.98)` |
| **Focus** | `focus-visible:ring-2` (IconButton with focusRing prop) |
| **Disabled** | `opacity-50 cursor-not-allowed pointer-events-none` |
| **Loading** | Replaces children with `Spinner size="sm"` + disabled styles |

**Animations**:
- Framer Motion `whileHover` scale 1.01, duration 0.2
- Framer Motion `whileTap` scale 0.98

**Accessibility**:
- Native `<button>` element
- `aria-label` when icon-only
- `loading` prop disables interaction
- `IconButton.focusRing` opt-in for keyboard focus ring

**Usage Rules**:
- Use `Button` for text labels, `IconButton` for icon-only actions
- Use `PrimaryButton` for wide CTAs on auth pages
- Always provide `aria-label` on IconButton
- Do NOT create new button variants; use existing 9 variants

### 2.2 Card System (`AntigravityCard.tsx`)

**Purpose**: Surface-level containers for grouping content.

**Variants**:

| Variant | Use Case | Styling |
|---|---|---|
| `default` | Standard content card | rounded-2xl, border, shadow, hover lift |
| `elevated` | Higher emphasis card | elevated shadow, no premium light treatment |
| `subtle` | Low emphasis, background | rounded-xl, minimal shadow, no hover lift |
| `premium` | Premium/featured content | Premium surface, 1.8px border, hover lift |
| `premium-neutral` | Premium without accent tint | Premium border on neutral bg |
| `premium-dark-neutral` | Dark mode premium | Same as premium-neutral |
| `auth-light` | Auth flow card | 2.5rem radius, auth light surface |

**States**: Hover lift (`-translate-y-0.5` + shadow increase) for elevated/default/premium variants.

**StatCard** — semantic status-driven stat display:

| Status | Text Color |
|---|---|
| `accent` | text-primary |
| `warning` | text-warning |
| `success` | text-success |
| `info` | text-info |
| `danger` | text-danger |
| `secondary` | --color-secondary |

**Usage Rules**:
- Prefer `default` variant for most content cards
- Use `StatCard` for dashboard statistics only
- Do NOT create new card components; compose with `Card` + `padding` prop

### 2.3 Form Elements (`AntigravityForm.tsx`)

**All form elements MUST support** (currently missing states marked with ✗):

| State | Input | TextArea | Select | Switch | Checkbox | Radio | RadioGroup |
|---|---|---|---|---|---|---|---|
| Default | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Placeholder | ✅ | ✅ | ✅ | — | — | — | — |
| Disabled | ✅ native | ✅ native | ✅ | ✅ | ✅ | ✅ | ✅ |
| Focus | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hover | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Error** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** |
| **Success** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** |
| **Loading** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** |
| **Required** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** |
| **Optional** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** |
| **Helper text** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** |
| **Validation msg** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** | **✗** |

**States to add to every form element**:
- `error?: string` — Shows error message below field, red border
- `helperText?: string` — Shows helper text below field
- `success?: boolean` — Green border/icon
- `loading?: boolean` — Spinner inside field (Input/Select only)
- `required?: boolean` — Required indicator (*) after label
- `optional?: boolean` — "(optional)" text after label

### 2.4 Dialog System

**Canonical**: `AdminModal` — portal-based, focus-trapped, accessible modal.

**Specification**:
- Uses `createPortal` to `document.body`
- `FocusTrap` from `focus-trap-react`
- Escape key closes (handled in `useEffect`)
- Backdrop click closes
- `aria-modal="true"`, `role="dialog"`, `aria-labelledby`, `aria-describedby`
- Animation: `animate-in zoom-in-95 duration-300` on content, `fade-in duration-300` on backdrop
- Backdrop: `bg-app-bg/60 backdrop-blur-md`
- Content: `sm:rounded-[2.5rem]`, `border-0 sm:border`, `shadow-2xl`
- Title: `text-xl sm:text-2xl font-black`, required
- Description: optional, shown below title with `text-[10px] sm:text-xs text-text-secondary`
- Footer: sticky bottom, left-aligned actions
- No stacked containers — only one modal at a time

**ConfirmModal** (`SharedComponents.tsx`): Wraps `AdminModal` with confirm/cancel buttons.

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | boolean | required | Visibility control |
| `title` | string | required | Modal title |
| `message` | ReactNode | required | Modal body content |
| `confirmLabel` | string | 'Confirm' | Confirm button text |
| `cancelLabel` | string | 'Cancel' | Cancel button text |
| `onConfirm` | function | undefined | Confirm handler (if absent, info-only) |
| `onCancel` | function | required | Close handler |
| `danger` | boolean | false | Danger variant for destructive actions |

### 2.5 Typography System

**Current state**: Two parallel systems:

1. **CSS system** (index.css `@theme`): `--text-h1` (28px) through `--text-h6` (12px)
2. **Component system** (AntigravityTypography.tsx): `H1` (22px→30px), `H2` (18px→20px), `H3` (14px→15px)

**Canonical specification** (post-unification):

| Level | Component | CSS Token | Size (mobile→desktop) | Weight | Letter Spacing |
|---|---|---|---|---|---|
| Display | `BrandTitle` (gradient/plain) | — | 26px→34px | 900 | 0.2em |
| H1 | `H1` | `--text-h1` | 22px→30px | 900 | -0.02em |
| H2 | `H2` | `--text-h2` | 18px→20px | 700 | -0.01em |
| H3 | `H3` | `--text-h3` | 14px→15px | 600 | — |
| Body | `Body` | `--text-body-1` | 13px→14px | 500 | — |
| Caption | — | `--text-caption` | 11px | 500 | — |
| Label | `Label` | `--text-label` | 10px | 700 | 0.1em |
| Small | — | `--text-button` | 13px | 700 | — |

**Migration**: Align `H1`/`H2`/`H3` sizes with `--text-h1`/`--text-h2`/`--text-h3` CSS tokens.

### 2.6 Spacing System

**Canonical spacing scale** (to be used everywhere):

| Token | Pixels | Tailwind Class |
|---|---|---|
| `xs` | 4px | `gap-1` |
| `sm` | 8px | `gap-2` |
| `md` | 16px | `gap-4` |
| `lg` | 24px | `gap-6` |
| `xl` | 32px | `gap-8` |
| `xxl` | 48px | `gap-12` |
| `section` | 32px | `gap-8` |

The `Stack` component uses these as `gap` prop values. The `spacing` export in `AntigravityTypography.tsx` is **DEAD CODE** — to be removed.

### 2.7 Animation System

**Canonical animations**:

| Animation | Component | Implementation |
|---|---|---|
| Page enter | `PageTransition` | Framer Motion `motion.div` wrapper |
| Section reveal | `SectionReveal` | Framer Motion intersection observer |
| Stagger children | `StaggerContainer` + `StaggerItem` | Framer Motion stagger |
| Button hover | Inline in `Button` | scale 1.01, duration 0.2 |
| Button tap | Inline in `Button` | scale 0.98 |
| Card hover | Tailwind classes | `-translate-y-0.5` + shadow transition |
| Modal enter | Tailwind + CSS | `animate-in zoom-in-95 duration-300` |
| Modal backdrop | Tailwind | `animate-in fade-in duration-300` |
| Switch toggle | Tailwind | `transition-colors duration-300` + cubic-bezier |
| Theme toggle | Framer Motion | spring stiffness 260, damping 32, mass 1.1 |
| Badge pulse | Tailwind | `animate-pulse` |
| Spinner | Tailwind | `animate-spin` |
| ProgressBar | Tailwind | `transition-all duration-500` |
| Tab pill | Framer Motion | `layoutId` for smooth slide |

**Rules**:
- Use `PageTransition` for page-level enter animations
- Use `SectionReveal` for scroll-triggered section reveals
- Use `StaggerContainer`/`StaggerItem` for list enter animations
- Do NOT create custom keyframes; use Tailwind's built-in animations
- Do NOT use inline `<style>` tags for animation keyframes

---

## 3. Design Token Specification

### 3.1 Token Usage Rules

1. **NEVER use arbitrary values** (`text-[14px]`, `rounded-[14px]`, `shadow-[0_0_60px_rgba(...)]`) in component or page code
2. **ALWAYS reference semantic tokens** (`var(--text-primary)`, `var(--radius-md)`) or registered Tailwind utilities (`text-primary`, `rounded-xl`)
3. **Arbitrary values are ONLY permitted** in the following files:
   - `src/styles/themes.css` (token definitions)
   - `src/index.css` (component CSS, @theme registrations)
4. **Exception**: Inline `style={}` props are permitted ONLY for:
   - Dynamic values (e.g., progress bar width, animation delay)
   - Chart data-driven colors
5. **All exceptions MUST be documented** in a comment with the format: `/* DS-XXX: <reason> */`

### 3.2 Approved Radius Values

| Name | Value | CSS Token | Tailwind Class |
|---|---|---|---|
| none | 0px | `--radius-none` | `rounded-none` |
| xs | 4px | `--radius-xs` | `rounded` |
| sm | 8px | `--radius-sm` | `rounded-sm` |
| md | 12px | `--radius-md` | `rounded-md` |
| lg | 16px | `--radius-lg` | `rounded-lg` |
| xl | 20px | `--radius-xl` | `rounded-xl` |
| 2xl | 24px | `--radius-2xl` | `rounded-2xl` |
| 3xl | 20px | `--radius-3xl` | `rounded-3xl` |
| 4xl | 32px | `--radius-4xl` | `rounded-[32px]` |
| full | 9999px | `--radius-full` | `rounded-full` |

**Approved component radii**:
- Button xs: 10px → `rounded-[10px]` (register as `--radius-button-xs`)
- Button sm: 12px → `rounded-md` (resolves to 12px)
- Button md/lg: 14px → `rounded-[14px]` (register as `--radius-button-md`)
- Button xl: 16px → `rounded-lg` (resolves to 16px)
- Button auth-xl: 18px → `rounded-[18px]` (register as `--radius-button-auth`)
- Modal: 2.5rem → `rounded-[2.5rem]` (40px)
- Card: 16px → `rounded-2xl`
- Input: 12px → `rounded-md` or `rounded-xl`
- Badge md: 14px → `rounded-[14px]` (register as `--radius-badge-md`)
- StatCard: 24px → `rounded-2xl`
- StatSkeleton: 24px → `rounded-2xl`
- EmptyState: 32px → `rounded-[32px]` (register as `--radius-empty-state`)
- Alert: 14px → `rounded-[14px]` (register as `--radius-alert`)
- IconButton sm: 10px → `rounded-[10px]` (register as `--radius-icon-sm`)
- IconButton md: 12px → `rounded-xl`

### 3.3 Approved Shadow Values

| Name | CSS Token | Tailwind Class |
|---|---|---|
| xs | `--shadow-xs` | `shadow-xs` |
| sm | `--shadow-sm` | `shadow-sm` |
| md | `--shadow-md` | `shadow-md` |
| lg | `--shadow-lg` | `shadow-lg` |
| xl | `--shadow-xl` | `shadow-xl` |
| 2xl | `--shadow-2xl` | `shadow-2xl` |
| Elevation 1 | `--elevation-1` | `shadow-elevation-1` |
| Elevation 2 | `--elevation-2` | `shadow-elevation-2` |
| Elevation 3 | `--elevation-3` | `shadow-elevation-3` |
| Elevation 4 | `--elevation-4` | `shadow-elevation-4` |
| Elevation 5 | `--elevation-5` | `shadow-elevation-5` |
| Elevation 6 | `--elevation-6` | `shadow-elevation-6` |
| Elevation 7 | `--elevation-7` | `shadow-elevation-7` |
| Card | `--shadow-card-shadow` | `shadow-card-shadow` |
| Card hover | `--shadow-card-hover-shadow` | `shadow-card-hover-shadow` |
| Card premium | `--shadow-card-premium` | `shadow-card-premium` |
| Premium card | `--shadow-premium-card` | `shadow-premium-card` |
| Premium elevated | `--shadow-premium-elevated` | `shadow-premium-elevated` |
| Premium carved | `--shadow-premium-carved` | `shadow-premium-carved` |
| Premium icon | `--shadow-premium-icon` | `shadow-premium-icon` |
| Stat card | `--shadow-stat-card-shadow` | `shadow-stat-card-shadow` |
| Tab track | `--shadow-tab-track` | `shadow-tab-track` |
| Tab pill light | `--shadow-tab-pill-light` | `shadow-tab-pill-light` |
| Ambient | `--shadow-ambient` | `shadow-ambient` |
| Contact | `--shadow-contact` | `shadow-contact` |
| Modal | `--shadow-modal` | `shadow-modal` |

### 3.4 Approved Spacing Values

| Name | Value | Tailwind |
|---|---|---|
| px | 1px | `px` |
| 0.5 | 2px | `p-0.5` |
| 1 | 4px | `p-1` |
| 1.5 | 6px | `p-1.5` |
| 2 | 8px | `p-2` |
| 2.5 | 10px | `p-2.5` |
| 3 | 12px | `p-3` |
| 3.5 | 14px | `p-3.5` |
| 4 | 16px | `p-4` |
| 5 | 20px | `p-5` |
| 6 | 24px | `p-6` |
| 7 | 28px | `p-7` |
| 8 | 32px | `p-8` |
| 9 | 36px | `p-9` |
| 10 | 40px | `p-10` |
| 11 | 44px | `p-11` |
| 12 | 48px | `p-12` |
| 14 | 56px | `p-14` |
| 16 | 64px | `p-16` |

### 3.5 Token Cleanup Actions

| Action | Details | Priority |
|---|---|---|
| Remove `spacing` dead export from `AntigravityTypography.tsx` | Already replaced by `Stack` gap | **Phase 6** |
| Remove unused Foundation 4.6A tokens (--surface-canvas, --elevation-canvas, etc.) | ~30 tokens defined but never used | **Phase 7** |
| Remove unused component tokens (--dropdown-*, --btn-*-disabled, etc.) | ~20 tokens defined but never used | **Phase 7** |
| Remove dead `makeHelper` function in `usePageError.ts` | Defined but never invoked | **Phase 7** |
| Remove unused `ErrorContainerVariant` export | Type exported, never referenced | **Phase 7** |
| Register missing radius values in `@theme` | button-xs, button-md, button-auth, badge-md, alert, icon-sm | **Phase 1** |
| Merge duplicate Foundation 6 elevation tokens with Foundation 4.6A | Two parallel elevation systems | **Phase 7** |

---

## 4. Feedback Strategy

### 4.1 Principle

> **Toasts are for unexpected system errors only.**
> **Dialogs are for important success confirmations, warnings, and information.**

### 4.2 Feedback Decision Tree

```
User action occurs
│
├─ Is it an unexpected system error?
│   │  (network failure, server error, auth expired, permission denied)
│   └─ YES → Show Toast (auto-dismiss 3000ms)
│
├─ Is it a normal success workflow?
│   │  (settings saved, exam created, questions uploaded, profile updated)
│   └─ YES → Show Success Dialog (requires OK dismissal)
│
├─ Is it a warning about potential data loss?
│   │  (unsaved changes, leaving page, overwrite data)
│   └─ YES → Show Warning Dialog
│
├─ Does it require user confirmation?
│   │  (delete, logout, reset, archive, deactivate)
│   └─ YES → Show Confirmation Dialog
│
├─ Is it important information the user must acknowledge?
│   │  (instructions, help, important notices)
│   └─ YES → Show Information Dialog
│
└─ Is it a form validation error?
    └─ YES → Show Inline Field Error (never toast)
```

### 4.3 Dialog Components

All dialog components wrap `AdminModal` and share:
- Same spacing (p-6 sm:p-8)
- Same animation (zoom-in-95 + fade-in)
- Same backdrop (bg-app-bg/60 backdrop-blur-md)
- Same accessibility (role="dialog", aria-modal, focus trap, escape key)
- Same maxWidth pattern (default sm:max-w-md)

#### SuccessDialog
```
Props: open, title, description (optional), onClose
Buttons: OK (primary)
Icon: CheckCircle (green)
```

#### ErrorDialog
```
Props: open, title, description (required), onClose, retryFn (optional)
Buttons: OK (primary), Retry (secondary, optional)
Icon: AlertCircle (red)
```

#### WarningDialog
```
Props: open, title, description, onConfirm, onCancel, confirmLabel ("Proceed"), cancelLabel ("Cancel")
Buttons: Proceed (warning/danger), Cancel (secondary)
Icon: AlertTriangle (amber)
```

#### ConfirmDialog
```
Props: open, title, description, onConfirm, onCancel, confirmLabel ("Confirm"), cancelLabel ("Cancel"), danger (boolean)
Buttons: Confirm (primary or danger), Cancel (secondary)
Icon: based on danger prop
```

#### InfoDialog
```
Props: open, title, description, onClose
Buttons: OK (primary)
Icon: Info (blue)
```

### 4.4 Current Toast Usage → Migration Targets

| Current `showSuccess` Call | New Target | File |
|---|---|---|
| "Settings updated" | SuccessDialog | useAdminSettings.ts |
| "Exam created" | SuccessDialog | AddExamModal.tsx |
| "Topic updated/created/deleted" | SuccessDialog | useAdminTopics.ts |
| "Questions uploaded" | SuccessDialog | useAdminUpload.ts |
| "Profile updated" | SuccessDialog | useSettings.ts |
| "Password updated" | SuccessDialog | useProfile.ts |
| "Exam published" | SuccessDialog | useCreateExam.ts |
| "Invitation sent" | SuccessDialog | AdminSubAdmins.tsx |
| "Educator removed" | SuccessDialog | AdminSubAdmins.tsx |
| "Data copied" (clipboard) | Toast (brief, keep) | useStudents.ts |
| "Coupon copied" (clipboard) | Toast (brief, keep) | useSettings.ts |
| "Share link copied" (clipboard) | Toast (brief, keep) | useSettings.ts |
| "Export complete" | SuccessDialog | useSettings.ts |
| "User activated/deactivated" | SuccessDialog | useAdminUsers.ts |
| "Exam submitted" | SuccessDialog | usePrepareWrite.ts |

**Retained as toasts** (legitimate system/transient events):
- All `showError` calls (unexpected errors)
- Clipboard copy operations (brief, non-blocking)
- Countdown/timer warnings

---

## 5. Form System Specification

### 5.1 Architecture

All forms MUST use:
- **react-hook-form** for form state management
- **zod** for validation schemas
- **zodResolver** from `@hookform/resolvers` for integration
- `FormField` wrapper component for consistent field layout

### 5.2 FormField Component

**New canonical component** to be created:

```
FormField
├── Label (required/optional indicator)
├── Input/Select/TextArea/etc (children)
├── HelperText (always visible)
└── ValidationError (red, appears on validation failure)
```

**Props**:
```typescript
interface FormFieldProps {
  label: string
  required?: boolean
  optional?: boolean
  helperText?: string
  error?: string
  children: React.ReactNode
  className?: string
}
```

### 5.3 Form Element State Requirements

Every form element MUST accept these additional props:

```typescript
interface FormElementBaseProps {
  error?: string        // Validation error message
  helperText?: string   // Helper text below field
  success?: boolean     // Success state styling
  loading?: boolean     // Loading state (spinner)
  required?: boolean    // Required indicator
  optional?: boolean    // Optional indicator  
}
```

### 5.4 Validation Pattern

```typescript
// 1. Define schema with zod
const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Minimum 8 characters'),
})

// 2. Use react-hook-form with zodResolver
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
})

// 3. Render with FormField
<FormField label="Email" error={errors.email?.message}>
  <Input {...register('email')} error={errors.email?.message} />
</FormField>
```

**Rules**:
- NEVER show form validation errors in toasts
- ALL validation errors appear inline below the field
- Auth pages (Login, Signup) already follow this — this is the canonical pattern
- Admin/feature pages currently using toast errors for validation MUST be migrated

### 5.5 Migration Targets

| Current Pattern | File | Migration |
|---|---|---|
| Toast validation errors | AdminSubAdmins.tsx | Inline validation |
| Toast validation errors | useAdminSettings.ts | Inline validation |
| Toast validation errors | AddExamModal.tsx | Inline validation |
| Toast validation errors | useAdminTopics.ts | Inline validation |
| Manual `zod.safeParse` | UpdatePasswordPage.tsx | react-hook-form + zodResolver |
| No validation framework | FinishSignInPage.tsx | react-hook-form + zodResolver |
| Toast validation errors | useCreateExam.ts | Inline validation |

---

## 6. Dialog System Specification

### 6.1 Canonical Dialog Architecture

```
AdminModal (base) ← ConfirmModal (existing wrapper)
                 ← SuccessDialog (new)
                 ← ErrorDialog (new)
                 ← WarningDialog (new)
                 ← InfoDialog (new)
```

### 6.2 Shared Dialog Properties

Every dialog variant MUST share:
- `AdminModal` as base (portal, focus trap, escape, backdrop click)
- Same animation: `animate-in zoom-in-95 duration-300` (content), `animate-in fade-in duration-300` (backdrop)
- Same spacing: `p-6 sm:p-8` header/body, `max-width: sm:max-w-md`
- Same footer pattern: `sticky bottom-0 p-6 border-t border-border-subtle bg-card-bg/95 backdrop-blur-md`
- Same close button: `IconButton variant="ghost" size="sm"` with X icon
- Same title style: `text-xl sm:text-2xl font-black text-text-title tracking-tight`
- Same description style: `text-[10px] sm:text-xs text-text-secondary font-medium`

### 6.3 Domain-Specific Modal Audit

| Modal | Current Implementation | Action |
|---|---|---|
| `SubmitExamModal` | Custom in `components/exam/` | Evaluate: can it use AdminModal? |
| `AddExamModal` | Custom in `components/admin/settings/` | Evaluate: can it use AdminModal? |
| `SingleQuestionModal` | Custom in `components/admin/questions/` | Evaluate |
| `BulkUploadModal` | Custom in `components/admin/upload/` | Evaluate |
| `ExamDetailModal` | Custom (if exists) | Evaluate |
| `StudentDetailModal` | Custom (if exists) | Evaluate |
| `TeacherLeaderboardModal` | Custom in `components/user/` | Evaluate |

Each custom modal should be assessed for:
1. Does its layout match `AdminModal` header/body/footer structure?
2. Does it use consistent spacing/padding?
3. Does it have proper accessibility (aria-modal, focus trap, escape)?
4. If yes to all 3, it can remain as a composition of `AdminModal`.

### 6.4 No Stacked Containers Rule

NEVER create stacked notification/overlay containers. A single `AdminModal` at a time.
- No nested dialogs
- No toast + dialog simultaneous (dialog supersedes toast)
- ConfirmModal closes before opening another dialog

---

## 7. Typography System Specification

### 7.1 Unification Plan

The two parallel typography systems MUST be unified:

| Level | Current H1-H3 (px) | CSS Token (rem) | Target (px equiv) | Action |
|---|---|---|---|---|
| H1 | 22→30px | 1.75rem (28px) | 22→28px | Update H1 default size |
| H2 | 18→20px | 1.5rem (24px) | 18→24px | Update H2 default size |
| H3 | 14→15px | 1.25rem (20px) | 14→20px | Update H3 default size |
| Body | 13→14px | 0.875rem (14px) | 14px | Already aligned |
| Label | 10px | 0.75rem (12px) | 10px | Confirm label token |

**Resolution**: Align `H1`/`H2`/`H3` component sizes to use CSS `--text-h1`/`--text-h2`/`--text-h3` tokens. The CSS tokens are the authoritative source.

### 7.2 Dead Code Removal

- Remove `spacing` object export from `AntigravityTypography.tsx` (lines 3-11)
- The `Stack` component's `gap` prop is the canonical spacing API

---

## 8. Spacing System Specification

### 8.1 Canonical Space Scale

```
xs:    4px  (gap-1)
sm:    8px  (gap-2)
md:   16px  (gap-4)
lg:   24px  (gap-6)
xl:   32px  (gap-8)
xxl:  48px  (gap-12)
```

### 8.2 Layout Component Spec

| Component | Purpose | Props |
|---|---|---|
| `PageContainer` | Page-level wrapper, max-width 1280px | centered, fullHeight, padded |
| `Stack` | Flex layout with canonical gap scale | gap (GapKey | number), direction, align, justify |
| `Grid` | Responsive CSS Grid | cols (1-4), sm/md/lg (breakpoint cols), gap (number) |
| `SectionHeader` | Title + subtitle + icon + badge + action | title, subtitle, icon, badge, action |
| `SectionBlock` | Section spacing wrapper (12px gap) | children, className |
| `SectionWrapper` | Wrapper with 14px gap | children, className |

### 8.3 Rule

Use `Stack` and `Grid` instead of raw `div` with `space-y-*` or `grid-cols-*`. If using raw div spacing, use Tailwind standard spacing classes only (p-1 through p-16, gap-1 through gap-12, space-y-1 through space-y-12).

---

## 9. Animation System Specification

### 9.1 Canonical Animation Tokens

| Token | Value | Used By |
|---|---|---|
| --transition-fast | 150ms | hover effects |
| --transition-normal | 200ms | Button hover/tap |
| --transition-slow | 300ms | Modal enter, Switch toggle |
| --ease-out | cubic-bezier(0.16, 1, 0.3, 1) | Exit animations |
| --ease-in-out | cubic-bezier(0.65, 0, 0.35, 1) | Toggle animations |
| --ease-spring | cubic-bezier(0.175, 0.885, 0.32, 1.275) | Switch thumb |

### 9.2 Animation Rules

1. Use Framer Motion for interactive animations (button hover/tap, page transitions, stagger)
2. Use Tailwind CSS for decorative animations (pulse, spin, fade-in, zoom-in)
3. NEVER use inline `<style>` tags for `@keyframes`
4. Use `prefers-reduced-motion: reduce` media query (already in index.css)
5. All animations must have `duration-*` or `transition-*` classes (already in components)
6. Modal animations use CSS classes only (no Framer Motion for modals)

### 9.3 Stagger Animation

```typescript
// StaggerContainer — parent
// StaggerItem — children
// Usage:
<StaggerContainer>
  {items.map(item => (
    <StaggerItem key={item.id}>
      <Card>{item.content}</Card>
    </StaggerItem>
  ))}
</StaggerContainer>
```

---

## 10. Accessibility Standard

### 10.1 Keyboard Navigation

| Component | Keyboard Behavior |
|---|---|
| Button | Enter/Space activates |
| IconButton | Enter/Space activates, focusRing prop for visual indicator |
| Input | Tab to focus, all standard input keys |
| Select | Tab to focus, arrow keys navigate, Enter selects |
| Switch | Tab to focus, Enter/Space toggles, role="switch", aria-checked |
| Checkbox | Tab to focus, Space toggles, role="checkbox" |
| Radio/RadioGroup | Tab to enter group, arrow keys navigate, role="radio" |
| Tabs | Tab to enter tablist, arrow keys navigate, role="tab"/"tabpanel" |
| Menu | Enter/Space opens, arrow keys navigate, Escape closes, role="menu" |
| Modal | Focus trapped inside, Escape closes, Tab cycles within |
| Pagination | Tab to navigate buttons, Enter activates |
| DataGrid | Tab to enter, arrow keys navigate cells (future) |
| Tooltip | Hover/focus opens, Escape closes |

### 10.2 ARIA Requirements

| Component | ARIA Attributes |
|---|---|
| Button | `aria-label` (icon-only), `aria-disabled` |
| Switch | `role="switch"`, `aria-checked` |
| Checkbox | `role="checkbox"`, `aria-checked` |
| Radio | `role="radio"`, `aria-checked` |
| RadioGroup | `role="radiogroup"`, `aria-label` |
| Tabs | `role="tablist"` (container), `role="tab"` (each), `aria-selected`, `aria-controls` |
| TabPanel | `role="tabpanel"`, `aria-labelledby` |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` |
| Menu | `role="menu"`, `role="menuitem"` |
| ProgressBar | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Alert (error) | `role="alert"` |
| Spinner | `aria-label="Loading"` |
| LoadingOverlay | `aria-live="polite"` |
| ErrorState | `role="alert"` |
| Navigation | `role="navigation"`, `aria-label` |
| Skip link | `href="#main-content"`, visible on focus |

### 10.3 Focus Management

1. **Tab order**: Logical DOM order matching visual order
2. **Focus trap**: All modals use `FocusTrap` from `focus-trap-react`
3. **Focus ring**: Use `focus-visible:ring-2` (not `focus:ring-2`) to show ring only on keyboard focus
4. **Skip link**: Already present in `SidebarLayout` — `href="#main-content"`
5. **Auto-focus**: First focusable element in modal on open
6. **Focus return**: Return focus to trigger element when modal closes

### 10.4 Screen Reader Considerations

1. All icons MUST have `aria-hidden="true"` unless they are the sole content of an interactive element
2. All icon-only buttons MUST have `aria-label`
3. Loading states MUST use `aria-live="polite"` for dynamic content
4. Error messages MUST be associated with inputs via `aria-describedby` or `aria-errormessage`
5. Status messages (success/error after action) MUST use `role="status"` or `role="alert"`
6. Empty states should have `aria-label` matching the title

### 10.5 Touch Device Behavior

1. Minimum touch target: 44×44px (all buttons meet this)
2. Hover-only effects must degrade gracefully on touch
3. `useCanHover()` hook for detecting hover capability
4. Tooltips must be `click` toggles on touch devices

### 10.6 Mobile Behavior

1. Modals go full-screen on mobile (`h-full w-full sm:h-auto sm:max-h-[92vh]`) — already implemented
2. Sidebar becomes drawer on mobile — already implemented
3. Grids stack to single column on mobile — already implemented
4. Padding reduces on mobile (`p-0 sm:p-4` for modal, `px-2 sm:px-4` for PageContainer)
5. Font sizes adjust responsively (`text-[13px] md:text-[14px]` for Body)

### 10.7 Focus Order Standard

```
Page Load → Skip Link (first tabbable)
         → Navigation / Sidebar
         → Main Content (#main-content)
         → Page Actions (buttons, links)
         → Footer
Modal Open → Focus trapped inside modal
           → Close button → Content → Footer actions → cycles
           → Escape closes, focus returns to trigger
```

---

## 11. Repository Gap Analysis

### 11.1 Component Duplication Table

| Component | Canonical Version | Duplicate/Missing | Files Affected | Migration Complexity | Risk |
|---|---|---|---|---|---|
| **Button** | `Button` in AntigravityButton | Raw `<button>` in VerifyEmailPage (lines 181, 208) | `VerifyEmailPage.tsx` | Low | Low |
| **Spinner** | `Spinner` in Spinner.tsx | Custom spinner divs in UpdatePasswordPage (line 52, 110), SignupPage (coupon), ActiveExamPage | 3 pages | Low | Low |
| **Card manual** | `Card` in AntigravityCard | `bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[...]` | FinishSignInPage, AccountDisabledPage | Low | Low |
| **PageContainer** | `PageContainer` in AntigravityLayout | Missing in FinishSignInPage, AccountDisabledPage, UpdatePasswordPage | 3 pages | Low | Low |
| **Stack/Grid** | `Stack`/`Grid` in AntigravityLayout | Raw `space-y-8`, `grid-cols-*` divs | UserExams, UserTeacherExams, UserPerformance, UserHistory | Low | Low |
| **Error state** | `ErrorContainer` | Manual Card in SubAdminStudents (lines 44-54) | `SubAdminStudents.tsx` | Low | Low |
| **Empty state** | `EmptyState` | Manual Card with py-20 in SubAdminStudents | `SubAdminStudents.tsx` | Low | Low |
| **H1/H2** | `H1`/`H2`/`H3` in Antigravity | Manual `<h1>` with `text-[36px]` | LoginPage, SignupPage, SplashPage | Low | Low |
| **BrandTitle** | `BrandTitle` in Antigravity | Manual gradient title in SplashPage | `SplashPage.tsx` | Low | Low |
| **ProgressBar** | `ProgressBar` in AntigravityData | Raw motion.div bar in UserLeaderboard (line 92) | `UserLeaderboard.tsx` | Low | Low |
| **Form validation** | react-hook-form + zod | Toast validation errors | AdminSubAdmins, useAdminSettings, AddExamModal, useAdminTopics | Medium | Medium |
| **Success feedback** | SuccessDialog (new) | showSuccess toasts (28 calls) | 11 feature files | Medium | Medium |
| **PageTransition** | `PageTransition` | Raw motion.div in Unauthorized (line 20-23) | `Unauthorized.tsx` | Low | Low |
| **Spacing** | Stack gap / Tailwind standard | `gap-[4px]`, `gap-[8px]`, `space-y-[12px]` | AntigravityLayout.tsx (own gap map) | Low | Low |

### 11.2 Migration Priority Matrix

| Priority | Component | Reason | Phase |
|---|---|---|---|
| P0 | **Feedback dialogs** (SuccessDialog, ErrorDialog, WarningDialog, InfoDialog) | Architectural foundation, unblocks all other feedback migration | Phase 1 |
| P0 | **FormField** wrapper component | Required for all form validation standardization | Phase 2 |
| P1 | **Pages bypassing design system** (SplashPage, FinishSignInPage, AccountDisabledPage, UpdatePasswordPage, VerifyEmailPage) | HIGH severity — no canonical components used | Phase 3 |
| P1 | **Arbitrary value cleanup** (text-[], rounded-[], shadow-[]) | Token system enforcement | Phase 4 |
| P2 | **Typography unification** (align H1-H3 with CSS tokens) | Consistency | Phase 5 |
| P2 | **Spacing standardization** (remove dead spacing export, use canonical gap map) | Dead code + consistency | Phase 5 |
| P3 | **Domain-specific modal audit** | Dialog consistency | Phase 6 |
| P3 | **Error pattern unification across services** | Error handling consistency | Phase 7 |
| P4 | **Token cleanup** (remove dead tokens, merge elevation systems) | Maintainability | Phase 8 |

---

## 12. Implementation Plan

### 12.1 Phase Order

```
Phase 1 — Feedback Dialogs (P0)
  Create: SuccessDialog, ErrorDialog, WarningDialog, InfoDialog
  Export: from AntigravityUI barrel
  Test: Each dialog renders correctly with AdminModal pattern

Phase 2 — FormField Component (P0)
  Create: FormField wrapper (Label + HelperText + ValidationError)
  Update: Input, TextArea, Select, Switch, Checkbox, Radio, RadioGroup
    Add: error, helperText, success, loading, required, optional props
  Test: Each element displays all states correctly

Phase 3 — Page Migration (P1)
  Migrate: SplashPage (use BrandTitle, PageTransition)
  Migrate: FinishSignInPage, AccountDisabledPage (use PageContainer, Card)
  Migrate: UpdatePasswordPage (use PageContainer, Card, Spinner, Alert, react-hook-form)
  Migrate: VerifyEmailPage (replace raw buttons with Button, raw spinner with Spinner)
  Migrate: LoginPage, SignupPage (use H1->BrandTitle for left panel)
  Fix: SubAdminStudents (use ErrorContainer, EmptyState)
  Fix: UserLeaderboard (use ProgressBar)
  Fix: Unauthorized (use PageTransition)

Phase 4 — Arbitrary Value Cleanup (P1)
  Register: missing radius tokens in @theme (button-xs, button-md, etc.)
  Replace: text-[Xpx] → Tailwind typography utilities
  Replace: rounded-[Xpx] → registered radius tokens
  Replace: shadow-[X] → registered shadow tokens

Phase 5 — Typography + Spacing Unification (P2)
  Align: H1/H2/H3 sizes with --text-h1/h2/h3 CSS tokens
  Remove: dead spacing export from AntigravityTypography.tsx

Phase 6 — Dialog Consistency (P3)
  Audit: each domain-specific modal for AdminModal compliance
  Migrate: where compliant, wrap AdminModal; where not, document exception

Phase 7 — Toast → Dialog Migration (P1)
  Replace: 28 showSuccess calls with SuccessDialog
  Retain: clipboard copy toasts, error toasts

Phase 8 — Form Validation Standardization (P1)
  Migrate: toast validation errors to inline FormField errors
  Migrate: UpdatePasswordPage to react-hook-form + zodResolver
  Migrate: FinishSignInPage to react-hook-form + zodResolver

Phase 9 — Token Cleanup (P4)
  Remove: dead Foundation 4.6A tokens
  Remove: dead component tokens
  Remove: dead makeHelper function
  Remove: dead ErrorContainerVariant export
  Merge: duplicate elevation systems

Phase 10 — Service Error Unification (P3)
  Standardize: all services to ServiceResult<T> pattern
  Add: centralized error interceptor
```

### 12.2 Implementation Rules

1. **One phase at a time** — implement completely before starting next
2. **Each migration preserves existing functionality** — no regressions
3. **Zero TypeScript errors** after each phase
4. **Design system changes** (Phase 1-2 components) must be completed before page migrations (Phase 3+)
5. **No new variants** — use existing canonical variants
6. **No new components** that duplicate existing functionality

---

## 13. Validation Criteria

### 13.1 Pass/Fail Checklist

After each phase, verify:

| Criterion | Method |
|---|---|
| Zero TypeScript errors | `npx tsc --noEmit` |
| No new arbitrary `text-[...]` values | `rg 'text-\[\d+px\]' src/` — count must not increase |
| No new arbitrary `rounded-[...]` values | `rg 'rounded-\[\d+px\]' src/` — count must not increase |
| No new arbitrary `shadow-[...]` values | `rg 'shadow-\[' src/` — count must not increase |
| No new inline `<style>` tags | `rg '<style>' src/ --include '*.tsx'` — count must not increase |
| No new `showSuccess` calls | `rg 'showSuccess\(' src/` — count should decrease |
| No duplicate component implementations | Manual review per category |
| All modals use AdminModal or document exception | Manual review |
| All forms use react-hook-form + zodResolver | `rg 'useForm' src/` + `rg 'zodResolver' src/` |
| All form validation errors inline (not toast) | Manual review |
| All pages use PageContainer | `rg 'PageContainer' src/pages/` per page |
| All buttons use Button component | `rg '<button' src/pages/` — count should be 0 or documented exceptions |

### 13.2 Prohibited Patterns

After migration, the following patterns are **banned**:

1. `text-[<arbitrary>]` in component/page code
2. `rounded-[<arbitrary>]` in component/page code  
3. `shadow-[<arbitrary>]` in component/page code
4. Inline `<style>` tags in `.tsx` files
5. Raw `<button>` elements (must use `Button` or `IconButton`)
6. Custom spinner implementations (must use `Spinner` component)
7. Toast for form validation errors
8. Toast for normal success workflows
9. Manual card layout (must use `Card` component)
10. Manual page layout without `PageContainer`
11. Dead code exports (no unused exports)
12. Parallel implementations of same component

### 13.3 TypeScript Error Zero Policy

After every implementation change, run:
```
npx tsc --noEmit
```

Zero TypeScript errors is a **blocking requirement** for phase completion.

---

## 14. Certification Checklist

### 14.1 Design System Certification

- [ ] All reusable components documented in this specification
- [ ] All design tokens documented and registered in `@theme`
- [ ] Feedback Strategy documented and implemented
- [ ] Form System documented and implemented
- [ ] Dialog System documented and implemented
- [ ] Typography System documented and unified
- [ ] Spacing System documented and canonical
- [ ] Animation System documented
- [ ] Accessibility Standard documented
- [ ] Design Governance rules documented

### 14.2 Migration Certification

- [ ] No duplicate button implementations
- [ ] No duplicate card implementations
- [ ] No duplicate dialog implementations
- [ ] No duplicate validation patterns
- [ ] No duplicate spacing systems
- [ ] No duplicate typography systems
- [ ] No duplicate hover effects
- [ ] No duplicate animation systems
- [ ] No duplicate shadow systems
- [ ] No duplicate border radius systems
- [ ] No duplicate feedback systems

### 14.3 Quality Certification

- [ ] Zero TypeScript errors
- [ ] No visual regressions
- [ ] No behavioral regressions
- [ ] All pages use canonical layout components
- [ ] All form validation is inline
- [ ] All feedback is via appropriate dialog or toast
- [ ] All modals are accessible (focus trap, aria-modal, escape close)
- [ ] All icon buttons have aria-label
- [ ] Skip link present and functional

---

## 15. Design System Governance

### 15.1 Rules for Contributors

1. **Single source of truth**: This document IS the design system. All UI decisions must reference this document.
2. **No new variants**: If a component already exists, use it. Do not create new variants without updating this document.
3. **No new components**: If the functionality can be composed from existing components, compose. Only create new components when composition is impossible.
4. **Arbitrary values forbidden**: All styling must use design tokens. Document exceptions with `/* DS-XXX: reason */`.
5. **Accessibility is mandatory**: Every component must meet the Accessibility Standard in Section 10.
6. **TypeScript required**: All components must have proper TypeScript types. Zero `any` types.
7. **Test before commit**: Run `npx tsc --noEmit` before every commit.

### 15.2 Change Process

To modify this specification:
1. Open an issue describing the change
2. Update this document
3. Implement the change across all affected components
4. Run `npx tsc --noEmit`
5. Update the Certification Checklist
6. Mark as certified

### 15.3 Version

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-07-30 | AI | Initial Golden Reference Design System Specification |

---

*This document is the Golden Reference for all PrepareForU UI development.
Every feature, every page, every component MUST conform to this specification.*

# PrepareForU — Canonical UI Styling Reference

> **Single source of truth** for all UI styling decisions.
> Created from a verified audit of User Panel + Admin Panel codebases.
> Every new component must follow this document.

---

## Table of Contents

1. [Verified Token System](#1-verified-token-system)
2. [Component Exports](#2-component-exports)
3. [Canonical Element Table](#3-canonical-element-table)
4. [Motion Reference](#4-motion-reference)
5. [Typography Reference](#5-typography-reference)
6. [Layout & Spacing](#6-layout--spacing)
7. [Light/Dark Mode](#7-lightdark-mode)
8. [Accessibility Patterns](#8-accessibility-patterns)
9. [Canonical Decisions](#9-canonical-decisions)
10. [DO NOT USE Rules](#10-do-not-use-rules)
11. [Audit Procedure](#11-audit-procedure)

---

## 1. Verified Token System

### 1.1 Source of Truth

**`src/styles/themes.css`** — All CSS custom properties (3-layer architecture).
**`src/index.css`** — Tailwind `@theme` mappings, custom utilities, fonts.

### 1.2 Architecture

```
Layer 1 (Primitives) → Layer 2 (Semantic) → Layer 3 (Component)
     NEVER UI          Referenced by UI      Referenced by owning component only
```

### 1.3 Primitive Colors

| Scale | Tokens | Values |
|---|---|---|
| Forest | `--forest-50` to `--forest-950` | `#F0F5F2` → `#030F08` |
| Gold | `--gold-50` to `--gold-400` | `#FFD700` → `#B07A14` |
| Dark | `--dark-50` to `--dark-200` | `#080810` → `#1A1A2E` |
| Pink | `--pink-600` | `#DB2777` |

### 1.4 Semantic Colors (Dark = Default, Light = `.light` overrides)

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--bg-app` | `#111827` | `#FBF6EC` | App background |
| `--bg-surface` | `#1F2937` | `#DFB26B` | Card/surface bg |
| `--bg-elevated` | `#374151` | `#E9C58A` | Elevated surfaces |
| `--bg-hover` | `#1F2937` | `#E9C58A` | Hover states, input bg |
| `--bg-input` | `#1F2937` | `#FFF9EC` | Input fields |
| `--bg-overlay` | `rgba(0,0,0,0.6)` | `rgba(15,23,42,0.45)` | Modal overlay |
| `--text-primary` | `#F9FAFB` | `#111827` | Primary text |
| `--text-secondary` | `#D1D5DB` | `#4B5563` | Secondary text |
| `--text-muted` | `#9CA3AF` | `#6B7280` | Muted/label text |
| `--text-hint` | `#6B7280` | `#9CA3AF` | Hint text |
| `--text-disabled` | `#9CA3AF` | `#9CA3AF` | Disabled text |
| `--text-title` | `#F9FAFB` | `#111827` | Title text |
| `--text-link` | `#3B82F6` | `#166534` | Link text |
| `--text-success` | `#22C55E` | `#16A34A` | Success text |
| `--text-warning` | `#FBBF24` | `#D97706` | Warning text |
| `--text-danger` | `#F87171` | `#DC2626` | Danger text |
| `--text-info` | `#3B82F6` | `#2563EB` | Info text |
| `--color-accent` | `#3B82F6` | `#166534` | Primary accent |
| `--color-success` | `#22C55E` | `#16A34A` | Success state |
| `--color-warning` | `#FBBF24` | `#D97706` | Warning state |
| `--color-danger` | `#F87171` | `#DC2626` | Danger state |
| `--color-secondary` | `#10B981` | `#C8960C` | Secondary accent |
| `--border-default` | `#374151` | `#E2E8F0` | Default border |
| `--border-input` | `#4B5563` | `#CBD5E1` | Input border |
| `--border-focus` | `#3B82F6` | `#166534` | Focus border |
| `--border-subtle` | `#374151` | `#E2E8F0` | Subtle border |

### 1.5 Component Tokens

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--card-bg` | `var(--bg-surface)` | `#FFFFFF` | Card background |
| `--card-border` | `rgba(55,65,81,0.5)` | `#E2E8F0` | Card border |
| `--card-shadow` | `var(--elevation-2)` | soft neutral | Card shadow |
| `--input-bg` | `var(--bg-hover)` | `#FFFFFF` | Input background |
| `--input-border` | `var(--border-subtle)` | `#CBD5E1` | Input border |
| `--skeleton-surface` | `var(--bg-elevated)` | neutral | Skeleton bg |
| `--skeleton-block` | `var(--border-input)` | neutral | Skeleton inner blocks |
| `--stat-card-bg` | `var(--bg-surface)` | gold gradient | StatCard bg |
| `--stat-icon-bg` | `var(--bg-accent-subtle)` | forest gradient | StatCard icon bg |

### 1.6 Radius Primitives

| Token | Value | Usage |
|---|---|---|
| `--radius-md` | `12px` | Inputs, controls |
| `--radius-xl` | `20px` | Cards, modals |
| `--radius-2xl` | `24px` | Large cards |
| `--radius-3xl` | `20px` | Card variant |
| `--radius-button-xs` | `10px` | Button xs |
| `--radius-button-sm` | `12px` | Button sm |
| `--radius-button-md` | `14px` | Button md/lg |
| `--radius-button-xl` | `16px` | Button xl |

### 1.7 Spacing Scale

| Token | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |
| `--space-20` | `80px` |
| `--space-24` | `96px` |

### 1.8 Shadow Scale

| Token | Dark | Light |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.3)` | `0 1px 2px rgba(15,23,42,0.05)` |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.3)` | `0 1px 3px rgba(15,23,42,0.08)` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.3)` | `0 4px 8px -1px rgba(15,23,42,0.08)` |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.3)` | `0 10px 20px -3px rgba(15,23,42,0.10)` |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.4)` | `0 20px 30px -5px rgba(15,23,42,0.12)` |
| `--elevation-0` | `none` | `none` |
| `--elevation-1` | `0 1px 2px rgb(0 0 0 / 0.3), 0 1px 3px rgb(0 0 0 / 0.35)` | soft neutral |
| `--elevation-2` | `0 1px 2px rgb(0 0 0 / 0.3), 0 2px 6px -1px rgb(0 0 0 / 0.35)` | soft neutral |
| `--elevation-3` | `0 2px 4px -1px rgb(0 0 0 / 0.3), 0 4px 12px -2px rgb(0 0 0 / 0.35)` | soft neutral |
| `--elevation-4` | `0 4px 8px -2px rgb(0 0 0 / 0.35), 0 8px 20px -4px rgb(0 0 0 / 0.4)` | soft neutral |

---

## 2. Component Exports

### 2.1 Barrel Exports (`src/components/common/AntigravityUI.tsx`)

| Export Name | Source File | Category |
|---|---|---|
| `Button`, `PrimaryButton`, `IconButton` | `AntigravityButton.tsx` | Action |
| `Card`, `StatCard` | `AntigravityCard.tsx` | Surface |
| `Input`, `TextArea`, `Select`, `Switch`, `Checkbox`, `Radio`, `RadioGroup` | `AntigravityForm.tsx` | Form |
| `Tabs`, `Badge`, `ProgressBar`, `MetricBlock`, `DataGrid` | `AntigravityData.tsx` | Data |
| `PageContainer`, `Stack`, `Grid`, `FilterBar`, `CollectionToolbar`, `FilterSelect`, `SelectionContainer`, `SectionHeader` | `AntigravityLayout.tsx` | Layout |
| `PremiumSelect` | `PremiumSelect.tsx` | Dropdown |
| `Pill`, `StatusBadge`, `CounterBadge`, `FilterPill`, `SelectionPill`, `NavigationPill` | `Pill.tsx` + siblings | Pill/Badge |
| `SegmentedFilter` | `SegmentedFilter.tsx` | Filter |
| `ThemeToggle` | `ThemeToggle.tsx` | Theme |
| `Alert` | `Alert.tsx` | Feedback |
| `Spinner` | `Spinner.tsx` | Loading |
| `Pagination` | `Pagination.tsx` | Navigation |
| `PageTransition`, `SectionReveal` | `AntigravityAnimation.tsx` | Animation |
| `ExamCard` | `AntigravityDashboard.tsx` | Dashboard |
| `ScoreCard`, `ResultStatCard` | `AntigravityResults.tsx` | Results |
| `IconBadge`, `PremiumIconContainer` | `IconBadge.tsx`, `PremiumIconContainer.tsx` | Icon |
| `NumberBadge` | `NumberBadge.tsx` | Number |
| `Avatar` | `Avatar.tsx` | Avatar |
| `FloatingList`, `FloatingListHeader`, `FloatingListItem` | `FloatingList.tsx` | List |
| `CollectionCard`, `SelectionCheckbox`, `CollectionHeader`, `CollectionFilter` | `CollectionCard.tsx` + siblings | Collection |
| `Menu` | `Menu.tsx` | Menu |
| `Navigation`, `NavigationContext`, `useSidebarMode` | `Navigation.tsx` | Navigation |
| `ErrorContainer`, `RetryButton` | `ErrorContainer.tsx`, `RetryButton.tsx` | Error |
| `SuccessModal` | `SuccessModal.tsx` | Modal |
| `ToastContainer`, `useToast` | `useToast.tsx` | Toast |
| `Skeleton` | `Skeleton.tsx` | Loading |
| `Typography`, `H1`, `H2`, `H3`, `Body`, `Label`, `Display`, `Caption`, `BrandTitle` | `Typography.tsx`, `AntigravityTypography.tsx` | Typography |
| `AdminText` | `AdminText.tsx` | Typography |

### 2.2 Motion Recipes (`src/components/common/AntigravityMotion.ts`)

| Recipe | Type | Value | Usage |
|---|---|---|---|
| `BUTTON_HOVER` | CSS class string | `transition-card-3d duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-card-hover-3d` | All material buttons |
| `CARD_HOVER` | CSS class string | `transition-card-3d duration-fast ease-standard hover:-translate-y-1 hover:shadow-card-hover-3d` | Cards, containers |
| `ROW_HOVER` | CSS class string | `transition-card-3d duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-card-hover-3d` | List rows, table rows |
| `GHOST_HOVER` | CSS class string | `= TRANSITION_INTERACTION` | Ghost buttons, soft controls |
| `TRANSITION_INTERACTION` | CSS class string | `transition-interaction duration-fast ease-standard` | Ghost/soft elements |
| `FOCUS_RING` | CSS class string | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2` | All keyboard-focusable |
| `CURSOR_NOT_ALLOWED` | CSS class string | `cursor-not-allowed` | Disabled elements |
| `GOLD_LIGHT_MATERIAL` | CSS class string | Light: `light:stat-card-surface light:shadow-premium-card light:border-card-premium-border` | Light mode gold |
| `TAB_SPRING` | framer-motion | `{ type:'spring', stiffness:260, damping:32, mass:1.1 }` | Tab/segment pill indicator |
| `TOGGLE_SPRING` | framer-motion | `{ type:'spring', stiffness:260, damping:28, mass:1 }` | Switch thumb |
| `DRAWER_SPRING` | framer-motion | `{ type:'spring', stiffness:220, damping:25 }` | Mobile drawer |
| `MODAL_TRANSITION` | framer-motion tween | `{ duration:0.2, ease:[0.25,0.1,0.25,1] }` | Modal open/close |
| `PAGE_TRANSITION` | framer-motion tween | `{ duration:0.3, ease:[0.25,0.1,0.25,1] }` | Page transitions |
| `SELECT_POPUP_TRANSITION` | framer-motion tween | `{ duration:0.15, ease:[0.16,1,0.3,1] }` | Select dropdown |
| `SECTION_REVEAL` | framer-motion tween | `{ duration:0.2, ease:[0.25,0.1,0.25,1] }` | Section entrance |
| `MENU_TRANSITION` | framer-motion tween | `{ duration:0.15, ease:[0.25,0.1,0.25,1] }` | Menu/tooltip open |
| `BUTTON_TAP` | empty object | `{}` | No whileTap scale (CSS only) |

### 2.3 Duration Tokens

| Token | Value |
|---|---|
| `MOTION_DURATION.fast` | `0.15s` |
| `MOTION_DURATION.normal` | `0.2s` |
| `MOTION_DURATION.slow` | `0.3s` |
| `MOTION_DURATION.verySlow` | `0.5s` |

### 2.4 Easing Tokens

| Token | Value |
|---|---|
| `MOTION_EASE.standard` | `[0.25, 0.1, 0.25, 1]` |
| `MOTION_EASE.enter` | `[0.16, 1, 0.3, 1]` |
| `MOTION_EASE.exit` | `[0.4, 0, 1, 1]` |
| `MOTION_EASE.emphasized` | `[0.175, 0.885, 0.32, 1.275]` |

---

## 3. Canonical Element Table

### 3.1 Buttons

| Element | Component | Variants | Sizes | Surface | Hover | Focus |
|---|---|---|---|---|---|---|
| Action button | `Button` | primary, secondary, success, danger, soft, ghost | xs, sm, md, lg, xl | `bg-primary text-white` (primary) | `BUTTON_HOVER` | `FOCUS_RING` |
| Icon button | `IconButton` | primary, ghost, danger, danger-soft, theme, action | sm, md | `bg-hover-bg text-text-secondary` (ghost) | `GHOST_HOVER` | `FOCUS_RING` |
| Primary button | `PrimaryButton` | primary only | lg (full-width) | `bg-primary text-white` | `BUTTON_HOVER` | `FOCUS_RING` |

**Button sizes:**
- xs: `h-8 px-3 text-[10px] rounded-button-xs`
- sm: `h-9 px-4 text-xs rounded-button-sm`
- md: `h-[48px] px-6 text-[13px] rounded-button-md`
- lg: `h-[48px] px-8 text-[14px] rounded-button-md`
- xl: `h-14 px-10 text-[15px] rounded-button-xl`

**All buttons:** `font-bold uppercase tracking-widest`, disabled: `opacity-40 pointer-events-none`

### 3.2 Cards

| Element | Component | Variants | Padding | Surface | Hover | Border |
|---|---|---|---|---|---|---|
| Default card | `Card` | elevated, default, subtle, premium, premium-neutral, premium-dark-neutral, auth-light, management, static | 16, 20, 24, 0 | `bg-card-bg` | `CARD_HOVER` (except static) | `border-border-subtle` |
| Stat card | `StatCard` | 5 status themes | built-in | `bg-stat-card-bg` | `CARD_HOVER` | `border-stat-card-border` |

**Card default padding (per variant):**
- elevated: `p-4 md:p-6`
- default: `p-4 md:p-5`
- subtle: `p-3 md:p-4`
- premium: `p-4 md:p-5`
- management: `p-4 md:p-5`

### 3.3 Form Elements

| Element | Component | Variants | Surface | Focus | Error |
|---|---|---|---|---|---|
| Input | `Input` | default, compact, management | `bg-input-bg border-input-border rounded-xl` | `border-input-focus-border` | `border-danger` |
| Textarea | `TextArea` | default, compact, management | same as Input | same | same |
| Select | `Select` | default | same as Input | same | same |
| Switch | `Switch` | — | `bg-primary` (on) / `bg-hover-bg` (off) | `FOCUS_RING` | — |
| Checkbox | `Checkbox` | — | `bg-checkbox-surface` / `bg-checkbox-surface-checked` | `peer-focus:ring-4 peer-focus:ring-primary/25` | — |
| Radio | `Radio` | — | `bg-radio-surface` / `border-radio-border-checked` | `peer-focus:ring-2 peer-focus:ring-primary/30` | — |
| RadioGroup | `RadioGroup` | segmented button | `bg-radio-track-surface` | `FOCUS_RING` | — |

### 3.4 Data Display

| Element | Component | Variants | Surface |
|---|---|---|---|
| Badge/Pill | `Badge` / `Pill` | primary, success, warning, danger, accent, neutral, default | `bg-{color}/10 text-{color} border-{color}/20` |
| Tabs | `Tabs` | primary, secondary (bare variant) | Active pill: `bg-card-bg border-border-subtle shadow-elevation-1` |
| ProgressBar | `ProgressBar` | primary, success, warning, danger, info | `bg-hover-bg` track, `bg-primary` fill |
| MetricBlock | `MetricBlock` | — | `bg-hover-bg/30 border-border-subtle/30` |
| DataGrid | `DataGrid` | — | `bg-card-bg border-border-subtle` |
| NumberBadge | `NumberBadge` | question, rank, option | `bg-hover-bg text-text-secondary` (dark) |

### 3.5 Navigation

| Element | Component | Surface | Active | Hover |
|---|---|---|---|---|
| Sidebar nav item | `Navigation.Item` | `text-text-secondary` | **`bg-primary text-white shadow-md shadow-primary/20`** | `hover:bg-hover-bg hover:text-text-primary` |
| Active indicator | `Navigation.Item` | `bg-white rounded-r-full` | `w-1 h-6` bar | — |

### 3.6 Selection & Filtering

| Element | Component | Surface | Active |
|---|---|---|---|
| Selection container | `SelectionContainer` | **`selection-surface border-[var(--border-premium-width)] border-card-premium-border shadow-card-premium`** | — |
| Segmented filter | `SegmentedFilter` | `bg-filter-surface border-filter-border` | `bg-filter-surface-active text-filter-text-active border-filter-border-active` |
| Collection filter | `CollectionFilter` | same as SegmentedFilter | same |

### 3.7 Overlays & Modals

| Element | Component | Surface | Animation |
|---|---|---|---|
| Modal scrim | `AdminModal` | `bg-app-bg/60 backdrop-blur-md` | `MODAL_TRANSITION` |
| Modal panel | `AdminModal` | `bg-card-bg rounded-[2.5rem] border-border-subtle shadow-2xl` | `y:10,scale:0.98` → `y:0,scale:1` |
| Drawer | `Navigation.Shell` (mobile) | `bg-card-bg border-r border-border-subtle shadow-2xl` | `DRAWER_SPRING` |
| Bulk action bar | `BulkActionBar` | `bg-card-bg border-border-subtle rounded-3xl shadow-2xl backdrop-blur-xl` | `animate-in` |

### 3.8 Status & Feedback

| Element | Component | Surface |
|---|---|---|
| Empty state | `EmptyState` | `GOLD_SURFACE shadow-premium-card rounded-[32px]` |
| Error state | `ErrorContainer` | `Card variant="default" padding={24}` |
| Skeleton (premium) | `Skeleton` | `bg-[var(--skeleton-surface)] border-card-premium-border` + `GOLD_LIGHT_MATERIAL` |
| Skeleton (text) | `Skeleton` | `bg-[var(--skeleton-block)] animate-pulse` |
| Spinner | `Spinner` | `border-primary/20 border-t-primary rounded-full animate-spin` |
| Alert | `Alert` | `bg-card-bg border-{color}` |

---

## 4. Motion Reference

### 4.1 Hover Language (CSS class strings)

| Recipe | Effect | Usage |
|---|---|---|
| `BUTTON_HOVER` | `-translate-y-0.5 shadow-card-hover-3d` | Material buttons, icon buttons with surface |
| `CARD_HOVER` | `-translate-y-1 shadow-card-hover-3d` | Cards, containers, collection cards |
| `ROW_HOVER` | `-translate-y-0.5 shadow-card-hover-3d` | List rows, table rows, sidebar items |
| `GHOST_HOVER` | bg/color only, NO lift, NO shadow | Ghost buttons, soft controls, text actions |

### 4.2 State Transitions (framer-motion)

| Recipe | Spring/Tween | Values | Usage |
|---|---|---|---|
| `TAB_SPRING` | spring | stiffness:260, damping:32, mass:1.1 | Tab/segment pill indicator movement |
| `TOGGLE_SPRING` | spring | stiffness:260, damping:28, mass:1 | Switch thumb position |
| `DRAWER_SPRING` | spring | stiffness:220, damping:25 | Mobile drawer slide |
| `MODAL_TRANSITION` | tween | duration:0.2, ease:standard | Modal open/close |
| `PAGE_TRANSITION` | tween | duration:0.3, ease:standard | Page route changes |
| `SELECT_POPUP_TRANSITION` | tween | duration:0.15, ease:enter | Select dropdown open |
| `SECTION_REVEAL` | tween | duration:0.2, ease:standard | Section entrance |
| `MENU_TRANSITION` | tween | duration:0.15, ease:standard | Menu/tooltip open |

### 4.3 Overlay Values

| Usage | Value |
|---|---|
| Modal overlay | `bg-app-bg/60 backdrop-blur-md` |
| Mobile drawer overlay | `bg-black/60 backdrop-blur-sm` |

---

## 5. Typography Reference

### 5.1 Font Families

| Token | Value | Usage |
|---|---|---|
| `--font-sans` | `'Vend Sans', system-ui, -apple-system, sans-serif` | Primary font |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', monospace` | Code, JSON |

### 5.2 Canonical Typography Scale

| Role | Size | Weight | Tracking | Usage |
|---|---|---|---|---|
| Display | `1.75rem` | 900 | `-0.025em` | Hero headings, brand titles |
| H1 | `1.375rem` | 900 | `-0.025em` | Page headings |
| H2 | `1.125rem` | 700 | `-0.025em` | Section headings |
| H3 | `0.875rem` | 600 | `-0.025em` | Subsection headings |
| Body | `0.8125rem` | 500 | normal | Primary reading text |
| Caption | `0.6875rem` | 500 | normal | Secondary/metadata |
| Label | `0.625rem` | 700 | `0.1em` uppercase | Form labels, tags |
| StatValue | `1.75rem` | 900 | `-0.05em` | Large stat display |
| Badge | `0.5625rem` | 700 | `0.05em` uppercase | Pill/tag text |
| Metadata | `0.75rem` | 500 | normal | Helper/row text |
| Small | `0.875rem` | 500 | normal | Compact table text |
| Heading | `1rem` | 700 | normal | Card titles |

### 5.3 Light Mode Font Variants

| Context | Font | Usage |
|---|---|---|
| Decorative headings | `font-cinzel` (serif) | Section headers in light mode |
| Subtitles | `font-garamond italic` | Hero subtitles in light mode |
| Brand text | `font-cinzel` | Logo text in light mode |
| Body/labels | `font-sans` (Vend Sans) | All other text |

---

## 6. Layout & Spacing

### 6.1 Standard Padding Patterns

| Element | Padding |
|---|---|
| Card (default) | `p-4 md:p-5` (20px) |
| Card (compact) | `p-3 md:p-4` (12-16px) |
| Card (spacious) | `p-6` (24px) |
| Modal body | `p-6 sm:p-8` |
| Modal header | `p-6 sm:p-8` |
| Button sm | `px-4` |
| Button md | `px-6` |
| Input | `px-4` |
| Nav item | `p-3` |

### 6.2 Standard Gap Patterns

| Context | Gap |
|---|---|
| Stack (tight) | `gap-[var(--space-2)]` (8px) |
| Stack (standard) | `gap-[var(--space-4)]` (16px) |
| Stack (loose) | `gap-[var(--space-6)]` (24px) |
| Grid (compact) | `gap-3` (12px) |
| Grid (standard) | `gap-4` (16px) |
| Grid (loose) | `gap-6` (24px) |

### 6.3 Container Widths

| Container | Width |
|---|---|
| Page container | `max-w-[1280px] mx-auto` |
| Sidebar (expanded) | `w-64` (256px) |
| Sidebar (collapsed) | `w-20` (80px) |
| Status board | `w-[27%] min-w-[220px] max-w-[340px]` |

### 6.4 Border Radius Scale

| Context | Radius |
|---|---|
| Buttons (xs) | `rounded-button-xs` (10px) |
| Buttons (sm) | `rounded-button-sm` (12px) |
| Buttons (md/lg) | `rounded-button-md` (14px) |
| Buttons (xl) | `rounded-button-xl` (16px) |
| Inputs | `rounded-xl` (12px) |
| Cards | `rounded-2xl` (16px) |
| Modals | `rounded-[2.5rem]` (40px) |
| Nav items | `rounded-xl` (12px) |
| Badges | `rounded-button-md` (14px) |
| Avatars | `rounded-xl` (12px) or `rounded-full` |

---

## 7. Light/Dark Mode

### 7.1 Mechanism

- **Toggle**: `ThemeToggle` component uses `button[role="switch"]`
- **Class toggle**: `.light` class on `<html>` element
- **Storage**: `localStorage` key `"theme-preference"`
- **Transition**: `transition: background-color 0.2s ease, color 0.2s ease`

### 7.2 Token Switching

All tokens switch automatically via CSS custom properties when `.light` class is added/removed from `<html>`.

### 7.3 Light Mode Premium Material

| Token | Light Value |
|---|---|
| `--surface-stat` | `linear-gradient(135deg, #D4A55A 0%, #C9943C 50%, #BF8A30 100%)` |
| `--surface-tab-pill` | `linear-gradient(135deg, #E6D2A5 0%, #D8C390 100%)` |
| `--gradient-gold-hero` | `linear-gradient(135deg, #FFD700 0%, #B8860B 100%)` |
| `--material-card-premium-border` | `var(--gold-300)` = `#B8860B` |
| `--material-button-primary-surface` | `linear-gradient(150deg, #162B1C 0%, #0A1A10 100%)` |

### 7.4 Hard-Coded Exceptions

| File | Value | Reason |
|---|---|---|
| `AntigravityForm.tsx:248` | `bg-white` (switch thumb) | Intentional — white thumb on colored track |
| All overlays | `rgba(0,0,0,0.5)` | Modal overlay — consistent contrast |

---

## 8. Accessibility Patterns

### 8.1 Focus Management

| Component | Pattern |
|---|---|
| All buttons | `FOCUS_RING` — `focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2` |
| All inputs | `focus:border-input-focus-border` + `focus:ring-2 focus:ring-primary/20` |
| Switch | `FOCUS_RING` |
| Custom select | `aria-expanded`, `aria-haspopup="listbox"`, `role="combobox"` |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` |
| Focus trap | `FocusTrap` component wraps modals |
| Body scroll lock | `document.body.style.overflow = 'hidden'` while modal open |

### 8.2 ARIA Patterns

| Pattern | Components |
|---|---|
| `role="dialog"` + `aria-modal="true"` | `AdminModal` |
| `role="switch"` + `aria-checked` | `Switch`, `ThemeToggle` |
| `role="combobox"` + `aria-expanded` | `PremiumSelect`, `CollectionFilter` |
| `role="listbox"` + `aria-activedescendant` | `PremiumSelect` popup |
| `role="option"` + `aria-selected` | `PremiumSelect` options |
| `role="alert"` + `aria-live="assertive"` | `ErrorContainer` |
| `role="status"` | `Skeleton` (loading) |
| `aria-label` | Icon buttons, close buttons |
| `aria-describedby` | Form inputs (error messages) |
| `aria-current="page"` | Active navigation items |
| `aria-busy` | Loading buttons |

### 8.3 Keyboard Navigation

| Pattern | Components |
|---|---|
| Tab | All interactive elements |
| Enter/Space | Buttons, links |
| Arrow keys | `PremiumSelect` options, `Tabs`, `RadioGroup` |
| Escape | `AdminModal` close, mobile drawer close |
| Tab trapping | `FocusTrap` in modals |

### 8.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 9. Canonical Decisions

These are the finalized choices for inconsistencies found between User Panel and Admin Panel.

### 9.1 Navigation Active State

**Canonical**: Solid primary background (admin style)

```
Active: bg-primary text-white shadow-md shadow-primary/20
Indicator: w-1 h-6 bg-white rounded-r-full (absolute left)
Inactive: text-text-secondary hover:bg-hover-bg hover:text-text-primary
```

**File**: `Navigation.tsx:182-185`

### 9.2 Selection Container Surface

**Canonical**: Premium/gold surface (admin style)

```
Surface: selection-surface
Border: border-[var(--border-premium-width)] border-card-premium-border
Shadow: shadow-card-premium
Radius: rounded-2xl
Offset: -translate-y-0.5
```

**File**: `AntigravityLayout.tsx:74-91` — `variant='premium'` (default)

### 9.3 Skeleton Loading Variant

**Canonical**: Premium (gold-aware) as default

```
Surface: bg-[var(--skeleton-surface)] border-card-premium-border
Block: bg-[var(--skeleton-block)]
Light: GOLD_LIGHT_MATERIAL
```

**File**: `Skeleton.tsx:119` — `variant = 'premium'` (default)

### 9.4 Question Option Hover

**Canonical**: Hover-to-green border on all question options

```
Default: border-border-subtle bg-option-surface hover:border-success
Correct: border-success bg-success/5
```

**File**: Question options in both User Panel exam and Admin Panel edit mode

---

## 10. DO NOT USE Rules

### 10.1 Colors

| Rule | Reason |
|---|---|
| **NEVER** use `bg-white` or `bg-black` directly | Breaks dark mode — use `surface-*` tokens |
| **NEVER** use `text-gray-*` or `text-slate-*` | Use `text-primary`, `text-secondary`, `text-muted` |
| **NEVER** use `border-gray-*` | Use `border-default`, `border-subtle` |
| **NEVER** use `#hex` color values in components | Always use CSS custom properties |
| **NEVER** use `rgb()` or `rgba()` for surfaces | Always use semantic tokens |

### 10.2 Shadows

| Rule | Reason |
|---|---|
| **NEVER** use `shadow-sm`, `shadow-md`, `shadow-lg` directly in components | Use elevation tokens or component tokens |
| **NEVER** use hard-coded `box-shadow` values | Always use shadow tokens |

### 10.3 Border Radius

| Rule | Reason |
|---|---|
| **NEVER** use `rounded-sm`, `rounded-md`, `rounded-lg` directly | Use `radius-*` tokens or component-specific tokens |
| **NEVER** use hard-coded pixel values for border-radius | Always use radius tokens |

### 10.4 Spacing

| Rule | Reason |
|---|---|
| **NEVER** use `className="p-4"` for padding in cards | Use `padding` prop on `Card` |
| **NEVER** use `className="gap-4"` for layout gaps | Use `Stack` or `Grid` gap props |
| **NEVER** hard-code `margin` or `padding` pixel values | Use spacing tokens or component props |

### 10.5 Typography

| Rule | Reason |
|---|---|
| **NEVER** use `font-size: 14px` in component files | Use `text-sm`, `text-base`, etc. |
| **NEVER** use `font-weight: 600` directly | Use `font-semibold` |
| **NEVER** hard-code `font-family` in components | Use `font-sans` or `font-mono` |

### 10.6 Motion

| Rule | Reason |
|---|---|
| **NEVER** use `transition: all` | Use specific motion recipe |
| **NEVER** use hard-coded `transition-duration` | Use duration tokens |
| **NEVER** use `animation` property directly | Use `animate-pulse` for skeletons, motion recipes for interactions |

### 10.7 Components

| Rule | Reason |
|---|---|
| **NEVER** create new button components — use `Button` | Maintains consistency |
| **NEVER** create new card components — use `Card` | Maintains consistency |
| **NEVER** create new input components — use `Input` or `PremiumSelect` | Maintains consistency |
| **NEVER** create new modal components — use `AdminModal` | Maintains consistency |
| **NEVER** create new skeleton components — use `Skeleton` | Maintains consistency |
| **NEVER** create new badge components — use `Badge` or `NumberBadge` | Maintains consistency |
| **NEVER** create new tab components — use `Tabs` | Maintains consistency |
| **NEVER** create new tooltip components — use `AntigravityTooltip` | Maintains consistency |

#### Documented Intentional Exceptions

| Component | Exception | Reason |
|---|---|---|
| `RankBadge` (admin leaderboard) | Page-local rank pill, NOT a `NumberBadge` wrapper | The admin leaderboard rank carries medal icons for top-3, tier color treatments, and a responsive pill format that is materially different from `NumberBadge`'s fixed square monogram. Replacing it would change the certified rank appearance. Kept as the ONE rank component for the admin leaderboard; do not clone it further. |

---

## 11. Audit Procedure

When auditing a new feature:

### Step 1: Component Selection
- [ ] Check if an authorized component exists
- [ ] Verify using correct variant/size/padding
- [ ] Verify importing from `@/components/common/AntigravityUI`

### Step 2: Token Usage
- [ ] No hard-coded colors
- [ ] No hard-coded shadows
- [ ] No hard-coded border-radius
- [ ] Using semantic tokens

### Step 3: Spacing
- [ ] Using `padding` prop on `Card` (NOT `className="p-4"`)
- [ ] Using `Stack` or `Grid` gap props
- [ ] Consistent padding patterns

### Step 4: Typography
- [ ] Using Vend Sans font family
- [ ] Using canonical size scale
- [ ] Using semantic text color tokens

### Step 5: Motion
- [ ] Using motion recipes from `AntigravityMotion`
- [ ] No `transition: all`
- [ ] Hover uses correct recipe (BUTTON/CARD/ROW/GHOST)

### Step 6: Light/Dark Mode
- [ ] No `bg-white` or `bg-black` (except switch thumb)
- [ ] No `text-gray-*`
- [ ] All colors switch via CSS custom properties

### Step 7: Accessibility
- [ ] Focus management (FOCUS_RING)
- [ ] ARIA roles correct
- [ ] Keyboard navigation works
- [ ] Focus trap in modals

---

*Document created: 2026-08-19*
*Source: Verified audit of User Panel + Admin Panel codebases*
*Canonical decisions: Nav active (solid primary), SelectionContainer (premium), Skeleton (premium), Option hover (hover-to-green)*

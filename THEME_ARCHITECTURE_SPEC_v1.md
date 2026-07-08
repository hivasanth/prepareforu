# Theme Architecture Specification v1.0 (Frozen)

**Status:** PERMANENT ARCHITECTURE STANDARD — Frozen  
**Scope:** PrepareForU — entire frontend  
**Ownership:** Frontend Architecture Team  
**Enforcement:** Mandatory. No exceptions without Architecture Review Board approval.  
**Effective Date:** 2026-07-08  

This document is the single source of truth for the UI architecture. All future implementation phases, code reviews, design decisions, and migrations must comply with this specification. Any deviation requires written exception from the Architecture Review Board.

---

## 1. Core Doctrine

### 1.1 The Single UI Principle

There is exactly ONE UI. Theme is a layer of color applied to that UI — nothing more.

A component must render the identical tree of elements, the identical layout, the identical spacing, the identical typography, the identical responsive behavior, and the identical interactions in every theme. Only the following may differ between themes:

- colors
- gradients
- background fills
- text colors
- border colors
- icon colors / fills
- shadow colors

### 1.2 What Theme Must NEVER Change

Every property in this list is FORBIDDEN to vary by theme:

- component hierarchy
- JSX structure
- layout (flex, grid, position, float, top, left, right, bottom)
- spacing (margin, padding, gap)
- sizing (width, height, min/max dimensions)
- border radius
- border width
- font family
- font size
- font weight
- line height
- letter spacing
- text transform
- text decoration
- animation (keyframes, duration, easing, delay)
- transition properties (duration, easing, delay — color-only transitions allowed)
- transform
- opacity (except when used for thematic overlay blending)
- filter / backdrop-filter
- z-index
- overflow behavior
- cursor
- pointer-events
- responsive breakpoints
- responsive column/row layouts
- visibility / display

### 1.3 Enforcement Rule

Any code review that shows `isDark`, `useTheme()`, `theme ===`, `dark:`, or `.light` inside a component's JSX must be rejected. Components MUST NOT know themes exist.

---

## 2. Enterprise Token Hierarchy

### 2.1 Three-Layer System

Tokens are organized into three strictly hierarchical layers. Dependency flows in ONE direction only:

```
PRIMITIVE TOKENS  ──map to──▶  SEMANTIC TOKENS  ──consumed by──▶  COMPONENT TOKENS
      Layer 1                      Layer 2                            Layer 3
  (raw values)               (purpose-bound)                    (component-scoped)

      │                              │                                  │
      │                              │                                  │
      ▼                              ▼                                  ▼
  NEVER referenced             referenced by                        referenced by
  by UI directly               all components                       specific variant
                                                                     instances
```

**Dependency direction is ABSOLUTE.**
- Layer 1 → Layer 2: Primitive tokens map to semantic tokens.
- Layer 2 → Layer 3: Semantic tokens map to component tokens.
- Layer 3 may NEVER reference Layer 1 directly.
- Layer 2 may NEVER reference Layer 3 or any component context.
- Layer 1 has no knowledge of any other layer.

### 2.2 Layer 1 — Primitive Tokens

**Ownership:** Design System Team  
**Purpose:** Raw color, spacing, radius, shadow, font values. These are the atomic building blocks.  
**Usage:** Mapped into semantic tokens. NEVER referenced directly by any CSS selector in component styles.  

Pattern:

```
--{category}-{value}
```

| Category | Example Values |
|----------|---------------|
| `--gray-*` | `--gray-50: #F9FAFB` ... `--gray-950: #030712` |
| `--blue-*` | `--blue-50: #EFF6FF` ... `--blue-950: #172554` |
| `--green-*` | `--green-50: #F0FDF4` ... `--green-950: #052E16` |
| `--red-*` | `--red-50: #FEF2F2` ... `--red-950: #450A0A` |
| `--amber-*` | `--amber-50: #FFFBEB` ... `--amber-950: #451A03` |
| `--purple-*` | `--purple-50: #FAF5FF` ... `--purple-950: #2E1065` |
| `--teal-*` | `--teal-50: #F0FDFA` ... `--teal-950: #042F2E` |
| `--white` | `--white: #FFFFFF` |
| `--black` | `--black: #000000` |
| `--radius-*` | `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-xl: 20px`, `--radius-2xl: 24px`, `--radius-3xl: 28px`, `--radius-4xl: 32px`, `--radius-full: 9999px` |
| `--shadow-*` | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl` |
| `--font-*` | `--font-sans: 'Vend Sans', system-ui, sans-serif`, `--font-mono: 'JetBrains Mono', monospace` |
| `--weight-*` | `--weight-regular: 400`, `--weight-medium: 500`, `--weight-semibold: 600`, `--weight-bold: 700`, `--weight-black: 900` |

### 2.3 Layer 2 — Semantic Tokens

**Ownership:** Design System Team + Engineering (joint)  
**Purpose:** Purpose-bound, theme-aware tokens. These describe WHAT a color is used for, not what value it has.  
**Usage:** Consumed by all component CSS and all utility classes. This is the layer that all UI code references.  

Pattern:

```
--{domain}-{property}-{modifier?}
```

#### Background Tokens

| Token | Purpose | Used For |
|-------|---------|----------|
| `--bg-app` | Root application background | `body`, `#root` |
| `--bg-surface` | Card / container background | `Card`, panels |
| `--bg-elevated` | Elevated surface | Popups, dialogs, dropdowns |
| `--bg-hover` | Hover state background | Row hover, button hover |
| `--bg-active` | Active / selected state background | Selected tab, active row |
| `--bg-disabled` | Disabled element background | Disabled inputs, buttons |
| `--bg-input` | Input field background | `input`, `textarea`, `select` |
| `--bg-overlay` | Modal / drawer backdrop | Overlay scrim |
| `--bg-success-subtle` | Subtle success background | Success badges |
| `--bg-warning-subtle` | Subtle warning background | Warning badges |
| `--bg-danger-subtle` | Subtle danger background | Error badges |
| `--bg-accent-subtle` | Subtle accent background | Accent fills |

#### Text Tokens

| Token | Purpose | Used For |
|-------|---------|----------|
| `--text-primary` | Primary body text | Paragraphs, headings, labels |
| `--text-secondary` | Secondary / subdued text | Captions, metadata, help text |
| `--text-disabled` | Disabled text | Disabled labels, placeholder |
| `--text-on-accent` | Text on accent background | Button labels, badges |
| `--text-on-danger` | Text on danger background | Danger button labels |
| `--text-link` | Link text | Anchor elements |

#### Border Tokens

| Token | Purpose | Used For |
|-------|---------|----------|
| `--border-default` | Default border | Card borders, dividers |
| `--border-input` | Input border | `input`, `textarea`, `select` border |
| `--border-focus` | Focus ring | `:focus-visible` outline |
| `--border-hover` | Hover border | Hovered card, button border |
| `--border-disabled` | Disabled border | Disabled element border |

#### Accent Tokens

| Token | Purpose | Used For |
|-------|---------|----------|
| `--accent` | Primary brand color | Primary buttons, links, active indicators |
| `--accent-hover` | Primary hover | Primary button hover |
| `--success` | Success state | Correct answers, success messages |
| `--warning` | Warning state | Warning messages, medium timer |
| `--danger` | Danger / error state | Wrong answers, error messages, danger buttons |
| `--info` | Info state | Informational badges |

#### Shadow Tokens

| Token | Purpose | Used For |
|-------|---------|----------|
| `--shadow-sm` | Small shadow | Cards, buttons |
| `--shadow-md` | Medium shadow | Dropdowns, elevated cards |
| `--shadow-lg` | Large shadow | Modals, drawers |
| `--shadow-xl` | Extra large shadow | Toast notifications, overlays |
| `--shadow-focus` | Focus ring shadow | `:focus-visible` ring |

#### Icon Tokens

| Token | Purpose | Used For |
|-------|---------|----------|
| `--icon-default` | Default icon color | Navigation icons, action icons |
| `--icon-accent` | Accent icon | Active nav items, featured icons |
| `--icon-disabled` | Disabled icon | Disabled action icons |
| `--icon-success` | Success icon | Correct answer indicator |
| `--icon-danger` | Danger icon | Wrong answer indicator |
| `--icon-warning` | Warning icon | Warning indicator |

### 2.4 Layer 3 — Component Tokens

**Ownership:** Engineering (Component Teams)  
**Purpose:** Scoped to a specific component or component variant. Only created when a general semantic token is insufficient.  
**Usage:** Defined in the component's CSS file. NEVER referenced outside the owning component.  

Pattern:

```
--{component-name}-{property}
```

Examples:

```
--btn-primary-bg: var(--accent)
--btn-primary-text: var(--text-on-accent)
--btn-primary-shadow: var(--shadow-sm)
--card-bg: var(--bg-surface)
--card-border: var(--border-default)
--card-shadow: var(--shadow-sm)
--exam-timer-bg: var(--bg-surface)
--exam-timer-text: var(--text-primary)
--palette-item-correct: var(--success)
--palette-item-wrong: var(--danger)
```

### 2.5 Token Definition Location

Tokens live EXCLUSIVELY in CSS custom properties on `:root` and `:root.light`. No token values in TypeScript files. No token values in component CSS that mix primitive values.

Component tokens (Layer 3) are the ONLY exception — they may be defined in the component's CSS file, but they must reference ONLY semantic tokens (Layer 2), never primitives.

```
/* THE ONLY PLACE primitive + semantic tokens are defined */
:root {
  /* Layer 1: Primitive tokens */
  --gray-50: #F9FAFB;
  /* ... */

  /* Layer 2: Semantic tokens (dark theme defaults) */
  --bg-app: var(--gray-950);
  --text-primary: var(--gray-50);
  /* ... */
}

.light {
  /* Only Layer 2 semantic token overrides needed */
  --bg-app: var(--gray-50);
  --text-primary: var(--gray-950);
  /* ... */
}
```

```
/* Component CSS — may define Layer 3 component tokens */
/* MUST reference only Layer 2 semantic tokens */
.btn-primary {
  --btn-bg: var(--accent);
  --btn-text: var(--text-on-accent);
  --btn-shadow: var(--shadow-sm);
  background: var(--btn-bg);
  color: var(--btn-text);
  box-shadow: var(--btn-shadow);
}
```

---

## 3. Theme Ownership

### 3.1 Theme Definition

A theme is a complete set of semantic token values for `:root`. Changing theme = replacing the CSS custom property values.

Themes are defined in exactly ONE file:

```
src/styles/themes.css
```

This file contains ONLY token definitions. No component styles. No layout styles. No typography.

### 3.2 Theme Context Responsibility

The ThemeContext has exactly ONE job:

1. Read the current theme preference from `localStorage`
2. Toggle the `.light` class on `document.documentElement`
3. Expose a `toggleTheme` function

It MUST NOT expose `isDark` or any boolean theme identifier. It MUST NOT be imported by any component.

ThemeContext is consumed exclusively by the root layout wrapper in `App.tsx`.

### 3.3 Theme Switching Mechanism

Switching themes toggles the `.light` class on `<html>`. The browser applies the matching `:root` or `:root.light` CSS custom properties. All downstream styles resolve via `var(--token)` references.

This is a zero-JS, purely CSS-driven theme switch. No component re-renders needed. No state changes in React.

### 3.4 Future Theme Support

A third theme (e.g., "high-contrast", "sepia") adds a new CSS class selector in `themes.css`:

```css
.high-contrast {
  --text-primary: #000000;
  --bg-app: #FFFFFF;
  /* ... override only what differs from default */
}
```

ThemeContext toggles the corresponding class on `<html>`. No components change. No new tokens needed unless existing semantic coverage is insufficient.

---

## 4. Token Ownership

### 4.1 Token Stewardship

| Role | Responsibility |
|------|---------------|
| Design System Team | Defines, names, and version all Layer 1 + Layer 2 tokens |
| Engineering (Component Teams) | Defines Layer 3 component tokens; implements all tokens as CSS |
| Architecture Review Board | Approves new token proposals; audits token usage quarterly |

### 4.2 Token Governance Rules

**Rule 1:** Every color value in the application MUST reference a semantic token (Layer 2). Zero exceptions.

**Rule 2:** A color value may appear in exactly ONE place: the `:root` or `.light` block in `src/styles/themes.css`.

**Rule 3:** No color value may appear in:
- Component TSX files
- Component CSS/SCSS files (except as `var(--token)` references)
- Tailwind `@apply` directives
- Inline `style` props
- SVG `fill` or `stroke` attributes (use `currentColor` with token-based text color)

**Rule 4:** If a component needs a color not covered by existing semantic tokens, a new semantic token must be proposed to the Architecture Review Board. The component must NOT hardcode a value as a workaround.

**Rule 5:** Tailwind's arbitrary value syntax (`text-[#...]`, `bg-[#...]`, `border-[#...]`) is FORBIDDEN in component files.

### 4.3 Token Verification

A CI lint rule (`no-hardcoded-colors`) MUST scan all `*.tsx`, `*.css`, and `*.scss` files for:
- Hex color literals (`#...`)
- `rgb()` / `rgba()` / `hsl()` / `hsla()` in component files
- Named CSS colors (`white`, `black`, `red`, `blue`, etc.) in class strings
- Tailwind arbitrary color classes (`text-[#...]`, `bg-[#...]`, etc.)
- `text-white`, `bg-white`, `text-black`, `bg-black`

This rule MUST fail CI with a clear error message directing the developer to the token to use instead.

---

## 5. Behavioral Contract

### 5.1 Presentation Only

Theme changes presentation only. Theme MUST NEVER affect application behavior.

### 5.2 Forbidden Behavioral Differences

The following are STRICTLY FORBIDDEN from varying by theme:

- **React logic** — No conditional `useEffect`, `useState`, `useMemo`, `useCallback` based on theme
- **Calculations** — No different math, formatting, or data processing per theme
- **API calls** — No theme-dependent requests, caching, or data fetching
- **Routing** — No different routes, navigation targets, or redirects per theme
- **Validation** — No different validation rules, constraints, or error messages per theme
- **Persistence** — No different `localStorage`, `sessionStorage`, or IndexedDB keys per theme
- **State management** — No different state shape, context values, or reducer logic per theme
- **JSX trees** — No different element structure, conditional rendering paths, or component composition per theme
- **Event handlers** — No different `onClick`, `onSubmit`, `onChange`, or other handlers per theme
- **Hooks** — No different custom hooks, hook ordering, or hook dependencies per theme
- **Lifecycle** — No different mount/unmount/update behavior per theme

### 5.3 Enforcement

A component that imports `useTheme()` for any purpose other than theme class management at the root level is in violation. A component that wraps `isDark` around a function call, an API request, or a state update is in violation.

---

## 6. Component Ownership

### 6.1 The Immunity Principle

A component MUST be theme-agnostic. A component MUST NOT:

- Import `ThemeContext`
- Import `useTheme`
- Reference `isDark`
- Apply conditional classes based on theme
- Render different JSX structures for different themes
- Use `dark:` Tailwind variants
- Use `.light` CSS selectors
- Accept `darkClassName` props

### 6.2 Component Color API

A component receives colors through ONE of these mechanisms, in order of preference:

1. **CSS custom properties** (default): The component uses `var(--bg-surface)`, `var(--text-primary)`, etc. directly in its CSS.

2. **Semantic className props** (when dynamic theming is needed): e.g., `<Button variant="primary" />` where the variant maps to component tokens.

3. **CSS class composition** (for micro-variants): e.g., `className="btn btn--primary"` where `btn--primary` uses `var(--accent)`.

### 6.3 Prohibited Component Patterns (Anti-Patterns)

#### ❌ FORBIDDEN: Theme branching in JSX
```tsx
// BAD — DO NOT USE
const { isDark } = useTheme();
return (
  <div className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-black'}>
```

#### ❌ FORBIDDEN: `darkClassName` prop
```tsx
// BAD — DO NOT USE
<IconBadge darkClassName="bg-gray-900" />
```

#### ❌ FORBIDDEN: Dark variant in CSS
```css
/* BAD — DO NOT USE */
.light .card {
  background: #F4E5C4;
}
```

#### ✅ CORRECT: Pure CSS variable references
```tsx
// GOOD — component is theme-agnostic
return <div className="card">{children}</div>;
```
```css
/* CSS — single source */
.card {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
```

---

## 7. Component Contracts

Every reusable component in the application has an immutable contract. The contract defines what theme MAY change, what theme MUST NOT change, and what properties are invariant.

### 7.1 Button Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: inline-flex`, `align-items: center`, `justify-content: center`, `gap` | — |
| Spacing | `padding`, `margin` | — |
| Typography | `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform` | `color` |
| Border | `border-width`, `border-style`, `border-radius` | `border-color` |
| Radius | `border-radius` (per variant) | — |
| Icon | SVG `width`, `height`, placement | `stroke`, `fill` via `currentColor` |
| Animation | `transition-duration`, `transition-timing-function` | `background-color`, `border-color`, `box-shadow`, `color` |
| Accessibility | `:focus-visible` outline offset + width | `outline-color` |
| Sizing | `height` per variant (sm/md/lg), `min-width` | — |
| States | hover scale, active press offset | hover bg, active shadow color |

**Variants:** `primary`, `secondary`, `danger`, `success`, `ghost`, `outline`  
**Each variant differs ONLY in which semantic tokens it references.** All six variants share the identical layout, spacing, typography, radius, and animation contract.

### 7.2 Card Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: flex`, `flex-direction: column` | — |
| Spacing | `padding` (per variant: default, compact, spacious) | — |
| Typography | All font properties | `color` |
| Border | `border-width`, `border-style`, `border-radius` | `border-color` |
| Radius | `border-radius` (per variant) | — |
| Shadow | `box-shadow` offset, blur, spread | `box-shadow` color |
| Animation | `transition-duration`, `transition-timing-function` | `background-color`, `border-color`, `box-shadow` |
| Responsive | Padding reduction at breakpoints | — |

**Variants:** `default` (elevated), `outlined`, `flat`, `interactive` (hoverable)

### 7.3 Input / Textarea Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: block`, `width: 100%` | — |
| Spacing | `padding` (per size variant) | — |
| Typography | `font-family`, `font-size`, `line-height` | `color` |
| Border | `border-width`, `border-style`, `border-radius` | `border-color` |
| Radius | `border-radius` | — |
| Shadow | `box-shadow` on focus | `box-shadow` color |
| Animation | `transition` duration + easing | `border-color`, `box-shadow` |
| States | focus ring width + offset | focus ring color |
| Placeholder | `font-family`, `font-size` | `color` |
| Disabled | `opacity` level, `cursor: not-allowed` | `background-color`, `border-color` |

### 7.4 Dropdown / Select Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | Same as Input | — |
| Spacing | Same as Input | — |
| Typography | Same as Input | `color` |
| Dropdown panel | `position: absolute`, `z-index`, border-radius, padding | `background-color`, `border-color`, `box-shadow` |
| Option items | `padding`, `gap`, font properties | `background-color` (hover), `color` |

### 7.5 Dialog / Modal Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `position: fixed`, `inset: 0`, `display: flex`, `align-items: center`, `justify-content: center` | — |
| Overlay | `position: absolute`, `inset: 0` | `background-color` (via `--bg-overlay`) |
| Content panel | `padding`, `border-radius`, `max-width`, `width` | `background-color`, `border-color`, `box-shadow` |
| Typography | All font properties | `color` |
| Border | `border-width`, `border-style`, `border-radius` | `border-color` |
| Animation | `animation` name, duration, easing | — |
| z-index | Fixed value per tier | — |

### 7.6 Table Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `width: 100%`, `border-collapse` | — |
| Spacing | `padding` per cell (header + body) | — |
| Typography | `font-family`, `font-size`, `font-weight` (header), `line-height` | `color` |
| Border | `border-width`, `border-style` | `border-color` |
| Radius | `border-radius` on container | — |
| Hover | Row hover: `background-color` change intensity | `background-color` |
| Striped | Alternating row background | `background-color` |
| Responsive | Horizontal scroll on overflow | — |

### 7.7 Sidebar Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: flex`, `flex-direction: column`, `width`, `height: 100%`, `position: fixed` | — |
| Spacing | `padding` for nav items, `gap` between groups | — |
| Typography | `font-family`, `font-size`, `font-weight`, `letter-spacing`, `text-transform` | `color` |
| Border | `border-right-width`, `border-right-style` | `border-right-color` |
| Active indicator | `width`, `border-radius`, position (left bar) | `background-color` |
| Hover | `background-color` change intensity | `background-color` |
| Icons | `width`, `height`, `gap` from label | `stroke`, `fill` via `currentColor` |

### 7.8 Header Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: flex`, `align-items: center`, `height`, `position: sticky`, `top: 0`, `z-index` | — |
| Spacing | `padding-left`, `padding-right`, `gap` | — |
| Typography | `font-family`, `font-size`, `font-weight`, `letter-spacing` | `color` |
| Border | `border-bottom-width`, `border-bottom-style` | `border-bottom-color` |
| Background | — | `background-color`, `backdrop-filter` |
| Shadow | `box-shadow` offset, blur, spread | `box-shadow` color |

### 7.9 Navigation Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: flex`, `flex-direction`, `align-items`, `gap` | — |
| Spacing | `padding` per item, `margin` between groups | — |
| Typography | `font-family`, `font-size`, `font-weight`, `letter-spacing`, `text-transform` | `color` |
| Active state | `font-weight`, indicator position + size | `color`, `background-color`, `border-color` |
| Hover state | `background-color` change intensity | `background-color`, `color` |
| Icons | `width`, `height`, `gap` from label | `stroke`, `fill` via `currentColor` |

### 7.10 Tabs Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: flex`, `gap`, `overflow-x: auto` | — |
| Spacing | `padding` per tab, `padding` on track | — |
| Typography | `font-family`, `font-size`, `font-weight`, `letter-spacing`, `text-transform` | `color` |
| Border | `border-bottom` on track, `border-radius` on active pill | `border-color` |
| Active state | Underline height + width, pill padding | `background-color`, `color`, `border-color` |
| Hover state | Change intensity | `color`, `background-color` |

### 7.11 Badge Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: inline-flex`, `align-items: center` | — |
| Spacing | `padding-x`, `padding-y` | — |
| Typography | `font-family`, `font-size`, `font-weight`, `letter-spacing`, `text-transform` | `color` |
| Border | `border-radius` | — |
| Radius | `border-radius` per variant (pill, rounded, square) | — |

**Variants:** `default`, `success`, `warning`, `danger`, `info`, `accent`

### 7.12 Status Card / Statistics Card Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: flex`, `flex-direction: column`, `gap` | — |
| Spacing | `padding`, `gap` between label/value | — |
| Typography | `font-family`, `font-size`, `font-weight` (label + value) | `color` |
| Border | `border-width`, `border-style`, `border-radius` | `border-color` |
| Radius | `border-radius` | — |
| Shadow | `box-shadow` offset, blur, spread | `box-shadow` color |
| Icon | `width`, `height` | `stroke`, `fill` via `currentColor` or `var(--icon-*)` |

### 7.13 Question Card Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: flex`, `flex-direction: column`, `gap` | — |
| Spacing | `padding` (question body, options, metadata) | — |
| Typography | `font-family`, `font-size`, `font-weight` per element (question text, option label, option text) | `color` |
| Border | `border-width`, `border-style`, `border-radius` | `border-color` |
| Radius | `border-radius` | — |
| Shadow | `box-shadow` offset, blur, spread | `box-shadow` color |
| Options | `padding`, `gap`, `border-radius`, `min-height` per option | `background-color`, `border-color`, `color` per state (default, selected, correct, wrong) |
| Animation | `transition` duration + easing | `background-color`, `border-color`, `box-shadow` |
| States | Default, selected, correct, wrong, disabled | Colors per state |

### 7.14 Question Palette Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: grid`, `grid-template-columns`, `gap` | — |
| Spacing | `padding` per item | — |
| Typography | `font-family`, `font-size`, `font-weight` | `color` |
| Border | `border-radius` per item | `border-color` |
| States | Unanswered, answered, marked, current, correct, wrong | `background-color`, `border-color`, `color` per state |

### 7.15 Status Board Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: flex`, `flex-wrap`, `gap` between stats | — |
| Spacing | `padding` per stat item | — |
| Typography | `font-family`, `font-size`, `font-weight` per stat (label + value) | `color` |
| Icons | `width`, `height` | `stroke`, `fill` via `var(--icon-*)` |
| Dividers | `width`, `height` | `background-color` |

### 7.16 Review Card Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: flex`, `flex-direction: column`, `gap` | — |
| Spacing | `padding`, `gap` between sections | — |
| Typography | `font-family`, `font-size`, `font-weight` | `color` |
| Border | `border-width`, `border-style`, `border-radius` | `border-color` |
| Radius | `border-radius` | — |
| Shadow | `box-shadow` offset, blur, spread | `box-shadow` color |
| States | Correct indicator, wrong indicator, marked indicator | Colors per state |

### 7.17 Exam Timer Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `display: flex`, `align-items: center`, `gap` | — |
| Spacing | `padding`, `gap` between time units | — |
| Typography | `font-family`, `font-size`, `font-weight`, `font-variant-numeric: tabular-nums` | `color` |
| Border | `border-radius` | `border-color` |
| States | Normal, warning (time low), danger (time critical) | `color`, `border-color`, `background-color` per state |
| Animation | Pulse/glow on critical state duration + easing | `box-shadow` color, `background-color` |

### 7.18 Tooltip Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `position: absolute`, `z-index`, pointer behavior | — |
| Spacing | `padding`, `gap` | — |
| Typography | `font-family`, `font-size` | `color` |
| Border | `border-radius` | — |
| Shadow | `box-shadow` offset, blur, spread | `box-shadow` color |
| Arrow | `width`, `height`, `position` | `border-color` |

### 7.19 Toast Contract

| Domain | Invariant | Theme-May-Change |
|--------|-----------|------------------|
| Layout | `position: fixed`, `z-index`, `display: flex`, `align-items: flex-start`, `gap` | — |
| Spacing | `padding`, `gap` between icon/text/dismiss | — |
| Typography | `font-family`, `font-size`, `font-weight` | `color` |
| Border | `border-width`, `border-style`, `border-radius` | `border-color` |
| Radius | `border-radius` | — |
| Shadow | `box-shadow` offset, blur, spread | `box-shadow` color |
| Animation | Enter/exit duration, easing, slide direction | — |
| States | Success, error, warning, info | `background-color`, `border-color`, `color` per state |
| Icons | `width`, `height` | `stroke`, `fill` via `var(--icon-*)` per state |

---

## 8. Reusable Component Ownership

### 8.1 Single Owner Rule

Every reusable component must have exactly one owner. There MUST NOT be:

- `DarkButton` + `LightButton`
- `AdminButton` + `UserButton`
- `ExamButton` + `TeacherButton`
- `Button` + `Button2`

Any duplicate component implementation is a violation.

### 8.2 Component Registry

All reusable components live in `src/components/common/`. Every component exported from this directory is THE canonical version. Pages compose these components. Pages MUST NOT duplicate them.

### 8.3 Component Composition, Not Duplication

A page may compose any number of reusable components. A page may extend a reusable component via props or composition. A page MUST NOT fork a reusable component into a page-specific copy.

### 8.4 Variant, Not Fork

When a component needs a different appearance in a specific context, add a `variant` prop to the canonical component. Do NOT create a new component.

```tsx
// ✅ CORRECT: variant on canonical component
<Button variant="primary" />
<Button variant="danger" />

// ❌ FORBIDDEN: duplicate components
<PrimaryButton />
<DangerButton />
```

### 8.5 Exam Module Components

Exam module components (QuestionCard, QuestionPalette, StatusBoard, QuestionNavigator, ExamTimer, ReviewCard, LanguageSelector) are reusable components. They follow the same single-owner rule and the same component contracts. They MUST NOT import `useTheme`.

---

## 9. Layout Ownership

### 9.1 Layout Immunity

Layout components (SidebarLayout, AdminLayout, UserLayout, SubAdminLayout, ExamLayout) MUST render the identical DOM structure in every theme.

### 9.2 Layout Invariants — Explicit List

Every property in this list is LOCKED across all themes:

| Category | Invariant Properties |
|----------|---------------------|
| Display | `display` (block, flex, grid, inline, none, etc.) |
| Flex | `flex-direction`, `flex-wrap`, `flex-grow`, `flex-shrink`, `flex-basis`, `align-items`, `align-self`, `align-content`, `justify-content`, `justify-self`, `justify-items`, `order` |
| Grid | `grid-template-columns`, `grid-template-rows`, `grid-template-areas`, `grid-column`, `grid-row`, `grid-gap`, `gap` |
| Spacing | `margin` (all directions), `padding` (all directions) |
| Sizing | `width`, `height`, `min-width`, `min-height`, `max-width`, `max-height` |
| Position | `position`, `top`, `right`, `bottom`, `left` |
| Overflow | `overflow`, `overflow-x`, `overflow-y`, `text-overflow` |
| z-index | `z-index` (all values) |
| Scroll | `scroll-behavior`, `scrollbar-width`, `scroll-snap-type`, `overscroll-behavior` |
| Visibility | `visibility`, `opacity` (except thematic overlay blending), `pointer-events`, `cursor` |
| Breakpoints | All `@media` query breakpoints, all responsive class variants |
| Sticky | `position: sticky`, `top`, `z-index` for sticky headers/sidebars |

### 9.3 Layout CSS Rules

Layout CSS MUST:
- Use `var(--bg-app)` for root background
- Use `var(--bg-surface)` for content area background
- Use `var(--border-default)` for borders

Layout CSS MUST NOT:
- Apply different `padding`, `margin`, `gap`, `width`, `height`, `flex`, or `grid` properties per theme
- Apply different `position`, `top`, `left`, `right`, `bottom` per theme
- Apply different `border-radius` per theme
- Apply different `backdrop-filter` per theme
- Use `!important` for layout properties

### 9.4 Sidebar and Header

The sidebar and header are layout elements. They follow layout immunity strictly.

Any existing `.light aside` or `.light .ancient-header` rules that change `backdrop-filter`, `box-shadow` offset, `border-width`, `position`, or pseudo-element presence violate this specification and MUST be migrated to use CSS variables exclusively.

---

## 10. Typography Ownership

### 10.1 Typography Immunity

Typography is theme-invariant. Font family, font size, font weight, line height, letter spacing, and text transform MUST be identical across all themes.

### 10.2 Single Source for Typography

All typography tokens are defined on `:root` and NEVER overridden:

```css
:root {
  --font-sans: 'Vend Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  --weight-black: 900;
  
  --text-xs: 0.6875rem;
  --text-sm: 0.8125rem;
  --text-base: 0.875rem;
  --text-lg: 1.0rem;
  --text-xl: 1.125rem;
  --text-2xl: 1.375rem;
  --text-3xl: 1.75rem;
  --text-4xl: 2.25rem;
  
  --lh-tight: 1.15;
  --lh-normal: 1.5;
  --lh-relaxed: 1.7;
}
```

These tokens are NOT overridden in `.light`. Typography is identical in every theme.

### 10.3 Prohibition on Font Switching per Theme

Any existing code that conditionally applies `font-cinzel`, `font-garamond`, or `font-ancient` based on `isDark` is a violation. Font choice is theme-invariant.

---

## 11. Border Ownership

### 11.1 Border Rules

- Border WIDTH, STYLE, and RADIUS are theme-invariant
- Only border COLOR may differ between themes
- All borders use `var(--border-*)` tokens

### 11.2 Radius Invariance

Border radius is defined once on `:root` and NEVER overridden:

```css
:root {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-3xl: 28px;
  --radius-4xl: 32px;
  --radius-full: 9999px;
}
```

These MUST NOT appear in `.light` overrides. Any existing `.light` rule that changes border-radius is a violation. Any component that applies different `border-radius` per theme is a violation.

---

## 12. Shadow Ownership

### 12.1 Shadow Tokenization

Shadows are defined as CSS custom properties on `:root` and may be overridden in `.light`:

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.4);
}

.light {
  --shadow-sm: 0 1px 2px rgba(139, 90, 16, 0.15);
  --shadow-md: 0 4px 6px rgba(139, 90, 16, 0.15);
  --shadow-lg: 0 10px 15px rgba(139, 90, 16, 0.2);
  --shadow-xl: 0 20px 25px rgba(139, 90, 16, 0.25);
}
```

### 12.2 Shadow Rules

- Shadow OFFSET (x, y, blur, spread) MUST be identical across all themes
- Only shadow COLOR may differ between themes
- Shadow tokens are referenced as `var(--shadow-*)` — never hardcoded

### 12.3 Hard Offset Shadows

The existing "ancient" 3D hard-offset shadows (e.g., `5px 6px 0px rgba(105, 62, 15, 0.70)`) violate the rule that shadow offset must be theme-invariant. These MUST be migrated: the offset values (`5px 6px 0px`) are invariant; only the color portion differs by theme. Define component-level shadow tokens where the offset is baked into a component token and only the rgba value is overridden per theme.

---

## 13. Icon Ownership

### 13.1 Icon Color Tokenization

Icons use SVG `stroke` and `fill` colors derived exclusively from semantic tokens:

```css
.icon { stroke: var(--icon-default); }
.icon--accent { stroke: var(--icon-accent); }
.icon--success { stroke: var(--icon-success); }
.icon--danger { stroke: var(--icon-danger); }
.icon--disabled { stroke: var(--icon-disabled); }
```

### 13.2 Icon Color Rules

- Icons inherit their color via `currentColor` or explicit `var(--icon-*)` references
- No hardcoded color values in icon-related code
- No `color="..."` props passed to icon components (except through token-based CSS)

### 13.3 Illustration Support (Theme-Aware)

Illustrations and decorative graphics that are theme-sensitive use two strategies (in order of preference):

1. **CSS-driven coloring**: SVG fill/stroke references `currentColor` or CSS variables
2. **Theme-aware image switching**: Only when CSS coloring is insufficient, use `<picture>` element with `<source media="(prefers-color-scheme: ...)">` or the `.light` class to select the appropriate asset

---

## 14. Animation Ownership

### 14.1 Animation Invariance

Animations and transitions are theme-invariant. Their properties MUST be identical across all themes:

| Property | Invariant | Theme-May-Change |
|----------|-----------|------------------|
| `animation-name` | Yes | — |
| `animation-duration` | Yes | — |
| `animation-timing-function` | Yes | — |
| `animation-delay` | Yes | — |
| `animation-iteration-count` | Yes | — |
| `animation-direction` | Yes | — |
| `animation-fill-mode` | Yes | — |
| `transition-property` | Yes (only color-related properties allowed) | — |
| `transition-duration` | Yes | — |
| `transition-timing-function` | Yes | — |
| `transition-delay` | Yes | — |
| `transform` (scale on hover, press offset) | Yes | — |
| Hover state transition | Same duration + easing | Colors targeted by transition |
| Pressed state transition | Same duration + easing | Colors targeted by transition |
| Focus state transition | Same duration + easing | Colors targeted by transition |
| Loading state animation | Same keyframes + duration | Colors inside animation |
| Disabled state transition | Same duration + easing | Colors targeted by transition |

### 14.2 Allowable Thematic Animation

Color transitions are permitted. Only the color values in the transition differ:

```css
.card {
  /* ✅ CORRECT: duration and easing are invariant; only color values change per theme */
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
```

### 14.3 Hover/Pressed/Focus Contract

| State | Invariant | Theme-May-Change |
|-------|-----------|------------------|
| Hover | `transform: scale(...)` or `translateY(...)`, `transition-duration`, `transition-easing` | `background-color`, `border-color`, `box-shadow`, `color` |
| Pressed / Active | `transform: scale(...)` or `translate(...)`, `transition-duration` | `background-color`, `border-color`, `box-shadow` |
| Focus | `outline-width`, `outline-offset`, `outline-style` | `outline-color`, `box-shadow` (focus ring color) |
| Loading | `animation-name`, `animation-duration`, `animation-timing-function` | Colors within the animation keyframes |
| Disabled | `opacity`, `cursor: not-allowed` | `background-color`, `border-color`, `color` |

---

## 15. Responsive Ownership

### 15.1 Responsive Invariance

Responsive behavior is theme-invariant. Breakpoints, column counts, grid arrangements, stacking order, and visibility toggles MUST be identical across all themes.

### 15.2 Breakpoint System

Breakpoints are defined ONCE as shared constants:

```typescript
// src/config/breakpoints.ts (shared, NOT theme-dependent)
export const BREAKPOINTS = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1440,
} as const;
```

These breakpoints apply equally to both themes. No `.light`-specific responsive overrides are permitted.

### 15.3 Responsive Media Queries

All responsive media queries MUST use these breakpoints identically for both themes:

```css
/* ✅ CORRECT: same media query, same layout change, different theme values via var() */
@media (max-width: 767px) {
  .card {
    padding: 16px;          /* same padding regardless of theme */
    background: var(--bg-surface);  /* theme-aware via variable */
  }
}

/* ❌ FORBIDDEN: different responsive behavior per theme */
@media (max-width: 767px) {
  .light .card { padding: 12px; }
  /* dark gets different padding — VIOLATION */
}
```

---

## 16. Accessibility Contract

### 16.1 Theme Switching Must Never Affect Accessibility

All accessibility properties and behaviors are theme-invariant:

| Domain | Invariant Properties |
|--------|---------------------|
| ARIA | All `aria-*` attributes, `role` attributes |
| Focus | `:focus-visible` outline width + offset, tab order, `tabindex` |
| Keyboard | All keyboard event handlers, arrow key navigation, Enter/Space activation |
| Screen Reader | All `sr-only` text, `aria-label`, `aria-describedby`, `aria-live` regions |
| Touch Targets | `min-width`, `min-height`, `padding` for interactive elements |
| Contrast | WCAG 2.1 AA contrast ratios (4.5:1 normal text, 3:1 large text) |
| Reduced Motion | `prefers-reduced-motion` query behavior, animation disabling |
| Color Alone | No information conveyed by color alone; all states also use icons, text, or patterns |
| Focus Order | Logical tab order, skip links, heading hierarchy |

### 16.2 Contrast Requirements

Regardless of theme, every color combination MUST meet WCAG 2.1 AA contrast ratios:
- Normal text: contrast ratio ≥ 4.5:1
- Large text (≥18px bold or ≥24px): contrast ratio ≥ 3:1
- UI components and graphical objects: contrast ratio ≥ 3:1

This is a REQUIREMENT on token values, not a suggestion. If a theme's tokens fail contrast requirements, the theme is rejected.

### 16.3 Reduced Motion

When `prefers-reduced-motion: reduce` is active:
- All animations MUST be disabled or reduced to essential fades
- Theme switching MUST be instant (no transition)
- Hover/press transforms MUST be disabled
- The same behavior applies regardless of active theme

---

## 17. Performance Contract

### 17.1 Theme Switching Must Never

| Operation | Requirement |
|-----------|-------------|
| Unmount components | Theme switch MUST NOT unmount any component |
| Reset state | Theme switch MUST NOT reset any React state |
| Refetch data | Theme switch MUST NOT trigger any API calls |
| Trigger renders | Theme switch MUST NOT cause component re-renders (CSS-only switch) |
| Recreate JSX | Theme switch MUST NOT recreate JSX trees |
| Recalculate layout | Theme switch MUST NOT cause layout recalculations beyond color repainting |
| Invalidate caches | Theme switch MUST NOT invalidate any cache |

### 17.2 CSS-Only Switch Proof

Theme switches operate by toggling `.light` on `<html>`. All downstream changes are CSS variable resolutions. The browser repaints affected elements without layout recalculations.

The implementation MUST verify:
- No React component re-renders triggered by theme change
- No Layout Shift (CLS) from theme change
- No JavaScript execution during theme change (beyond class toggle)

### 17.3 Component Render Guarantee

Components must NOT re-render when the theme changes. The current architecture's `useTheme()` pattern causes unnecessary re-renders across 55+ components every time the theme toggles. The CSS-variable approach eliminates this entirely.

---

## 18. CSS Ownership

### 18.1 Where CSS Belongs

| File | Purpose | Ownership |
|------|---------|-----------|
| `src/styles/themes.css` | ALL token definitions (Layer 1 + Layer 2). Theme variable overrides. NO selectors beyond `:root` and `.light`. | Design System Team |
| `src/styles/base.css` | CSS reset, `body`, typography base, global animations, scrollbar styling. NO colors. NO theme references. | Engineering |
| `src/styles/utilities.css` | Utility classes using `var(--*)` tokens. NO hardcoded values. | Engineering |
| `src/components/*/ComponentName.css` | Component-scoped styles using `var(--*)` tokens. Layer 3 component tokens allowed. | Component Team |

### 18.2 Forbidden CSS Patterns

| Pattern | Reason |
|---------|--------|
| Page-level global CSS | Breaks encapsulation; creates specificity conflicts |
| Theme-specific page CSS (`.light .page-x`) | Ties page layout to theme |
| `!important` | Indicates specificity failure; must be resolved at source |
| Duplicate selectors across files | Creates maintenance burden |
| Duplicate gradients | Every gradient must be defined once as a token |
| Duplicate shadow patterns | Every shadow must be defined once as a token |
| Hardcoded colors in component CSS | Must use `var(--*)` tokens |
| `@media` queries duplicating component layout | Responsive behavior must be in component CSS, not page CSS |

### 18.3 CSS Architecture Rules

1. **Specificity must be flat.** Avoid nested selectors deeper than 2 levels. Avoid `!important`.
2. **No `.light` selector overrides.** Theme variation comes from CSS variable resolution, not selector overrides.
3. **No `dark:` Tailwind variants.** The application uses class-based theme toggling; `dark:` is dead code.
4. **No per-page CSS files.** All component styles belong with the component. Global styles belong in `base.css`.
5. **Component CSS must be scoped.** Use CSS Modules or a naming convention (BEM) to prevent leakage.

---

## 19. File Structure

### 19.1 Required File Layout

```
src/
  styles/
    themes.css              ← ALL theme token definitions (Layer 1 + Layer 2)
    base.css                ← Reset, typography, animations (theme-invariant)
    utilities.css           ← Utility classes (theme-invariant, use var() tokens)
  
  context/
    ThemeContext.tsx         ← ONLY toggles .light class on <html>
                              MUST NOT expose isDark
                              MUST NOT be imported by any component
  
  components/
    common/
      Button.tsx + Button.css
      Card.tsx + Card.css
      ...
```

### 19.2 Migration Path for Existing Files

| Current location | Target | Action |
|-----------------|--------|--------|
| `src/index.css` (`.light` blocks) | `src/styles/themes.css` | Migrate all color overrides |
| `src/index.css` (`.ancient-*` classes) | Eliminate or make token-driven | Replace hardcoded colors with `var(--*)` |
| `src/index.css` (non-color rules) | `src/styles/base.css` | Keep, remove duplicates |
| Per-component CSS (color overrides) | `src/styles/themes.css` | Move color tokens out |

---

## 20. Migration Roadmap

### 20.1 Phase Sequence

Migration proceeds in strictly ordered phases. No phase starts until the previous phase is verified complete.

```
Phase 1  ──▶  Phase 2  ──▶  Phase 3  ──▶  Phase 4  ──▶  Phase 5
 ARCHITECTURE    DESIGN         CSS           REUSABLE        EXAM
 SPECIFICATION   TOKEN SYSTEM   FOUNDATION    COMPONENTS      MODULE

     │                                              │
     ▼                                              ▼
  Phase 6  ◀───────────────────  Phase 7  ◀────  Phase 8
  ADMIN       USER MODULE        MODULE           RESPONSIVE +
  MODULE                                           ACCESSIBILITY

     │
     ▼
  Phase 9  ──▶  Phase 10
  PERFORMANCE    ARCHITECTURE
  & CLEANUP     FREEZE
```

### 20.2 Phase Details

**Phase 1 — Architecture Specification** (CURRENT)
- Review and freeze this document
- Architecture Review Board approval
- Communication to all engineering teams

**Phase 2 — Design Token System**
- Create `src/styles/themes.css` with all Layer 1 + Layer 2 tokens
- Both themes fully defined (dark default + `.light` overrides)
- Token verification CI rule implemented
- No component changes yet

**Phase 3 — CSS Foundation**
- Create `src/styles/base.css` (reset, typography, animations)
- Migrate all non-color rules from `src/index.css` to `base.css`
- Create `src/styles/utilities.css`
- Remove `.light` selector overrides from `index.css`
- Remove all `!important` usage
- Remove duplicate `::selection` definitions
- Remove dead `dark:` variant code
- Verify visual parity: both themes must look identical to before

**Phase 4 — Reusable Component Migration**
- One component at a time, in dependency order:
  1. `IconBadge` — remove `darkClassName` prop
  2. `AntigravityButton` — eliminate duplicate JSX tree
  3. `AntigravityCard` — eliminate duplicate JSX tree (StatCard)
  4. `AntigravityData` (TabGroup) — eliminate duplicate JSX tree
  5. `AttemptCardBase` — eliminate duplicate JSX tree
  6. `AntigravityForm` — remove `isDark` branches
  7. `AntigravityDashboard` — remove `isDark` branches
  8. `AntigravityLayout` — remove `isDark` branches
  9. `AntigravityResults` — remove `isDark` branches
  10. `AntigravityReview` — remove `isDark` branches
  11. `SharedComponents` — remove `isDark` branches
  12. `NotificationPanel` — remove `isDark` branches
  13. `BilingualToggle` — remove `isDark` branches
- Each migration step verified for visual parity

**Phase 5 — Exam Module**
- `QuestionNavigator` — eliminate duplicate JSX tree (NavButton + MobileActionBar)
- `SubmitExamModal` — remove all `isDark` branches
- `ReviewLayout` — remove all `isDark` branches
- `QuestionCard` — remove all `isDark` branches
- `QuestionActions` — remove all `isDark` branches
- `ReviewQuestionCard` — remove all `isDark` branches
- `ExamHeader` — remove `isDark` branches
- `ExamTimer` — remove `isDark` branches
- `FixedBackButton` — remove `isDark` branches
- `ExamLayout` — remove `isDark` branches
- `StatusBoard` — use token-based color references
- `LanguageSelectionScreen` — use token-based color references
- Fix `QuestionVisualizer.tsx` (currently dark-mode-only)
- Fix `DiagramRenderer.tsx` (partially dark-mode-only)
- Each migration step verified for visual parity

**Phase 6 — Admin Module**
- `SidebarLayout` — remove all `isDark` branches
- `AdminUsers` — remove all `isDark` branches
- `AdminSubAdmins` — remove all `isDark` branches
- `AdminUpload` — remove all `isDark` branches
- `AdminTopics` — remove all `isDark` branches
- `AdminQuestions` — remove all `isDark` branches
- `AdminSettings` — remove all `isDark` branches
- `AdminOverview` — remove all `isDark` branches
- `AdminSelectionTabs` — remove all `isDark` branches
- `ProfileDropdown` — remove all `isDark` branches
- All admin sub-components (TopicListItem, ParsedPreview, AdminTopicPreviewRenderer, LangInputPanel, UserMobileCard, SubAdminMobileCard, SettingsCard, AddExamModal, UploadProgressOverlay, PromptEditorModal, AIToolCards)
- Each migration step verified for visual parity

**Phase 7 — User Module**
- `UserTopics` — remove all `isDark` branches (heaviest user file ~46 branches)
- `UserExams` — remove `isDark` branches
- `UserProfile` — remove hardcoded colors
- `UserPerformance` / `PerformanceCharts` — remove all `isDark` branches
- `UserLeaderboard` — use token-based colors
- `UserHistory` — remove `darkClassName` prop
- `UserTeacherExams` — remove `darkClassName` prop
- `UserUpgrade` — use token-based colors
- `WelcomeBanner` — replace all inline style colors with tokens
- `TeacherLeaderboardModal` — use token-based colors
- `ExamDetailModal` — remove `isDark` + `darkClassName` + hardcoded colors
- `SplashPage` — replace hardcoded gold colors with tokens
- `SignupPage` — replace hardcoded `#FCFAF2` with token
- `AccountDisabledPage` — replace hardcoded white/black with tokens
- `VerifyEmailPage` — replace hardcoded white with token
- `UpdatePasswordPage` — replace hardcoded purple colors with tokens
- Each migration step verified for visual parity

**Phase 8 — Responsive and Accessibility**
- Verify all responsive breakpoints produce identical layouts in both themes
- Verify WCAG contrast ratios in both themes
- Verify reduced motion behavior
- Verify keyboard navigation in both themes
- Verify screen reader compatibility in both themes

**Phase 9 — Performance and Cleanup**
- Remove `useTheme()` imports from all components
- Remove `ThemeContext` export (internal only)
- Remove all `ancient-*` CSS classes that are no longer referenced
- Remove all dead `dark:` variant CSS
- Remove all `!important` declarations
- Remove duplicate CSS rules
- Verify zero re-renders on theme switch
- Run performance benchmarks

**Phase 10 — Architecture Freeze**
- Final visual parity verification
- Full CI compliance check
- Architecture Review Board sign-off
- Document published as permanent standard
- All future work must follow this specification

### 20.3 Zero-Regression Guarantee

Every migration step MUST produce a pixel-identical UI in both themes. The visual result is the same — only the mechanism changes. Each phase includes verification steps.

---

## 21. Definition of Done

Before any component migration is considered complete, ALL of the following must be verified:

### 21.1 Structural Compliance

- [ ] **One JSX tree** — No separate render paths for different themes
- [ ] **No duplicated layout** — Same padding, margin, gap, flex, grid in both themes
- [ ] **No duplicated logic** — Same event handlers, hooks, calculations

### 21.2 Color Compliance

- [ ] **No hardcoded colors** — Zero hex, rgb, rgba, hsl values in component files
- [ ] **Semantic tokens only** — Every color is `var(--semantic-token)`

### 21.3 CSS Compliance

- [ ] **No `!important`** — Zero `!important` declarations in component CSS
- [ ] **No `.light` selectors** — Zero `.light`-prefixed CSS selectors
- [ ] **No `dark:` variants** — Zero `dark:` Tailwind variants
- [ ] **No `darkClassName` props** — Zero `darkClassName` prop usage

### 21.4 Runtime Compliance

- [ ] **No `useTheme()` in component** — Zero `useTheme` imports in component files
- [ ] **No `isDark` in component** — Zero `isDark` references in JSX or logic
- [ ] **Theme switch triggers zero re-renders** — CSS-only theme change verified

### 21.5 Quality Compliance

- [ ] **Accessibility verified** — ARIA, focus, keyboard nav, contrast in both themes
- [ ] **Responsive verified** — All breakpoints produce identical layouts in both themes
- [ ] **Visual parity verified** — Pixel-identical rendering in both themes (before vs after)
- [ ] **TypeScript clean** — Zero TypeScript errors
- [ ] **Existing tests pass** — All pre-existing tests continue to pass

---

## 22. Review Checklist

Every pull request involving UI changes MUST pass this checklist:

- [ ] No `useTheme()` imported in any component
- [ ] No `isDark` references in JSX
- [ ] No `dark:` Tailwind variants
- [ ] No `.light` selectors in CSS
- [ ] No `darkClassName` props
- [ ] No hardcoded color values (hex, rgb, rgba, hsl) in component files
- [ ] No `text-white`, `bg-white`, `text-black`, `bg-black` in component files
- [ ] No Tailwind arbitrary color values (`text-[#...]`, `bg-[#...]`, `border-[#...]`)
- [ ] All color references use `var(--semantic-token)`
- [ ] No `!important` in new CSS
- [ ] Layout properties (padding, margin, gap, width, etc.) do NOT differ per theme
- [ ] Typography properties (font-size, font-weight, line-height, letter-spacing) do NOT differ per theme
- [ ] Border radius values do NOT differ per theme
- [ ] Shadow offset values do NOT differ per theme
- [ ] Responsive breakpoints do NOT differ per theme
- [ ] Behavioral properties do NOT differ per theme (event handlers, API calls, state, routing)
- [ ] Animation properties do NOT differ per theme (duration, easing, keyframes)
- [ ] Accessibility properties do NOT differ per theme (ARIA, focus, keyboard, screen reader)
- [ ] Component contract is followed (variant, not fork)

---

## 23. Architecture Governance

### 23.1 Governance Bodies

| Body | Responsibility |
|------|---------------|
| Architecture Review Board | Approves specification changes, new tokens, and exceptions |
| Engineering Leads | Ensure team compliance; review PRs against specification |
| CI System | Automated enforcement via lint rules |

### 23.2 PR Governance

Every Pull Request must verify:

- **Architecture compliance** — No violations of Core Doctrine or Component Contracts
- **Token usage** — No hardcoded colors; all references use `var(--*)`
- **Component ownership** — No duplicate components; no forked variants
- **Accessibility** — No accessibility regression in either theme
- **Performance** — No unnecessary renders or layout recalculations
- **Responsive behavior** — Identical in both themes
- **Theme consistency** — All color changes go through tokens
- **No duplicate implementations** — One canonical component per concern
- **No hardcoded colors** — Zero exceptions
- **No forbidden CSS** — No `!important`, no `.light` selectors, no `dark:` variants, no page-level global CSS

### 23.3 CI Enforcement Rules

| Rule | Scope | Fails On |
|------|-------|----------|
| `no-hardcoded-colors` | All `*.tsx`, `*.css`, `*.scss` | Any hex, rgb, rgba, hsl literal in component files |
| `no-dark-variant` | All `*.tsx`, `*.css` | Any `dark:` Tailwind variant |
| `no-light-selector` | All `*.css` | Any `.light` CSS selector |
| `no-isDark-in-jsx` | All `*.tsx` | Any `isDark` reference |
| `no-useTheme-in-component` | All `*.tsx` (excluding `App.tsx`, `ThemeContext.tsx`) | Any `useTheme()` import |
| `no-darkClassName` | All `*.tsx` | Any `darkClassName` prop |
| `no-important` | All `*.css`, `*.scss` | Any `!important` declaration |
| `no-inline-style-color` | All `*.tsx` | Any `style={{ color: ... }}` or `style={{ background: ... }}` |

### 23.4 Exception Process

Any deviation from this specification requires:
1. Written justification describing why the specification cannot be followed
2. Approval from Architecture Review Board
3. Time-bound expiration date for the exception
4. Documentation of the exception in the affected code

### 23.5 Annual Audit

Every year, the Architecture Review Board conducts:
1. Full scan of all components for specification compliance
2. Token coverage audit (do all semantic tokens have values for all themes?)
3. Component contract audit (do components still follow their contracts?)
4. Dead code audit (unused tokens, unused CSS, unused components)
5. Performance audit (theme switch benchmarks)
6. Accessibility audit (contrast verification for all themes)
7. Published compliance report with remediation items

---

## Appendix A: Migration Quick Reference

| Current Anti-Pattern | Correct Pattern |
|---------------------|-----------------|
| `const { isDark } = useTheme()` | Remove import; use CSS variables |
| `isDark ? 'bg-gray-900' : 'bg-white'` | `className="bg-surface"` with CSS `var(--bg-surface)` |
| `darkClassName="..."` prop | Remove prop; single className with `var(*)` |
| `dark:bg-gray-900` variant | Remove; use CSS variable on root selector |
| `.light input { color: #0A0503 !important }` | `input { color: var(--text-primary) }` with `.light` overriding the token |
| `text-[#3D1F08]` | `var(--text-secondary)` or a semantic class |
| `bg-[#F4E5C4]` | `className="bg-surface"` |
| `<IconBadge darkClassName="..." />` | `<IconBadge />` with icon + CSS `var(--icon-default)` |
| `color="#6366f1"` (inline) | Remove; use `className="text-accent"` or CSS variable |
| `if (!isDark) return <AncientCard>...` | Return `<Card>...</Card>` once; `Card` CSS uses `var(--bg-surface)` |
| `font-cinzel` (conditional) | Apply font class unconditionally or not at all |
| Separate `DarkButton` / `LightButton` | Single `<Button variant="...">` component |
| Page-level `.light .page-styles` | Move to component CSS using `var(*)` |

---

## Appendix B: Component Contract Summary Table

| Component | Duplicate JSX? | `useTheme`? | `isDark`? | Hardcoded Colors? | Priority |
|-----------|---------------|-------------|-----------|-------------------|----------|
| Button (AntigravityButton) | **YES** — 2 trees | YES | YES | YES | **P0** |
| Card (AntigravityCard StatCard) | **YES** — 2 trees | YES | YES | YES | **P0** |
| TabGroup (AntigravityData) | **YES** — 2 trees | YES | YES | YES | **P0** |
| AttemptCardBase | **YES** — 2 trees | YES | YES | YES | **P0** |
| QuestionNavigator | **YES** — 2 trees | YES | YES | YES | **P0** |
| SubmitExamModal | NO | YES | YES | YES | P1 |
| ReviewLayout | NO | YES | YES | YES | P1 |
| QuestionCard | NO | YES | YES | YES | P1 |
| QuestionActions | NO | YES | YES | YES | P1 |
| ReviewQuestionCard | NO | YES | YES | YES | P1 |
| SidebarLayout | NO | YES | YES | YES | P1 |
| ExamTimer | NO | YES | YES | YES | P1 |
| ExamHeader | NO | YES | YES | YES | P1 |
| NotificationPanel | NO | YES | YES | YES | P1 |
| UserTopics | NO | YES | YES | YES (46 branches) | P1 |
| AddExamModal | NO | YES | YES | YES (25 branches) | P1 |
| AdminTopicPreviewRenderer | NO | YES (prop) | YES | YES | P1 |
| ExamDetailModal | NO | YES | YES | YES | P1 |
| WelcomeBanner | NO | NO | NO | **YES (inline)** | P1 |
| QuestionVisualizer | NO | NO | NO | **YES (dark-only)** | P1 |
| DiagramRenderer | NO | NO | NO | **YES (partial)** | P2 |
| PerformanceCharts | NO | YES | YES (prop) | YES | P2 |
| ProfileDropdown | NO | YES | YES | YES | P2 |
| SharedComponents | NO | YES | YES | YES | P2 |
| All other admin components | NO | YES | YES | YES | P2 |
| All other user components | NO | Mixed | Mixed | Mixed | P2 |
| PageHeader | NO | NO | NO | NO | Clean |
| AdminLeaderboard | NO | NO | NO | NO | Clean |
| UserDashboard | NO | NO | NO | NO | Clean |
| UserPrepareWrite | NO | NO | NO | NO | Clean |
| UserSubjectTests | NO | NO | NO | NO | Clean |
| UserTopicExams | NO | NO | NO | NO | Clean |
| Layout wrappers (3) | NO | NO | NO | NO | Clean |
| ExamGroupBar, ExamDetailRow | NO | NO | NO | NO | Clean |

---

*End of Theme Architecture Specification v1.0 (Frozen)*

---

## Permanent Architecture Standard Declaration

This document, **Theme Architecture Specification v1.0 (Frozen)**, effective 2026-07-08, is hereby established as the permanent architecture standard for the PrepareForU frontend application.

All future development, code reviews, design decisions, and migrations MUST comply with this specification. No component may be created, modified, or approved in violation of these rules. Any deviation requires written exception from the Architecture Review Board.

The specification supersedes all prior theming conventions, patterns, and practices in the codebase. Existing code that violates this specification is technical debt and must be migrated according to the Migration Roadmap (Section 20).

**Signed,**  
Frontend Architecture Team  
PrepareForU

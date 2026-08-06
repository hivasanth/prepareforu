# FOUNDATION GOVERNANCE

Version: 1.21.0
Status: APPROVED
Scope: Entire Application
Supersedes: All previous governance summaries.

---

# Document Authority

**Authority:** Canonical Design System governance.
**Purpose:** Defines ownership, Foundation responsibilities, consumer
responsibilities, governance rules, change control, adoption governance, and
permanent Foundation contracts. Governance decisions originate here.

---

This document is the **permanent engineering standard** for the Design System. It is
stable and rarely changes. Implementation history lives in `FOUNDATION_FREEZE_REGISTER.md`.

Cross-reference: see `FOUNDATION_FREEZE_REGISTER.md` for chronological component
freeze history, migration reports, and acceptance records. See
`DESIGN_SYSTEM_WORKFLOW.md` for the day-to-day implementation workflow (how to apply
these rules in practice). See `PROJECT_ARCHITECTURE.md` for overall application
architecture (read this first).

---

# 1. CARD SYSTEM (DS-001)

## Shared Contract

- **Purpose:** Reusable card surfaces for content containers.
- **Scope:** All generic card rendering across the application.
- **Single Source of Truth:** `src/components/common/AntigravityCard.tsx` — owns
  surface, material, background, background-image, border, border-color, border-width,
  radius, shadow, elevation, hover, transition, animation, transform, motion, 3D depth,
  Light Mode appearance, Dark Mode appearance.
- **Status:** PERMANENTLY FROZEN

## Shared Foundation Ownership

Foundation owns: appearance, layout, spacing, sizing, borders, radius, typography,
hover, focus, disabled appearance, keyboard behavior, semantic structure, accessibility,
ARIA attributes, light mode, dark mode, theme tokens, motion, transitions, surface
material, elevation, shadow, 3D depth.

## Shared Consumer Ownership

Consumers own ONLY: placement, width, layout height, flex, grid, order, positioning,
visibility, responsive layout, content, click handlers, loading state, disabled state,
business logic. Nothing else.

## Foundation Protection

If ONE card behaves incorrectly:
↓
Fix the Consumer. Do NOT modify Foundation.
Foundation changes ONLY when multiple verified consumers share the same runtime defect.

## API Evolution

New Card capabilities may be added ONLY when ALL hold:
1. ≥3 real runtime consumers require it
2. Existing APIs cannot represent it
3. Capability belongs to Foundation (not one consumer)
4. Addition is fully backward compatible

No one-off APIs. No consumer-specific props.

## Verification Rules

Every Card change requires verification of:
- ✓ Light Mode — ✓ Dark Mode — ✓ Hover — ✓ Motion — ✓ Animation — ✓ 3D depth
- ✓ Elevation — ✓ Shadow — ✓ Border — ✓ Responsive behavior — ✓ Accessibility
- ✓ Build — ✓ TypeScript

Build success alone is NEVER acceptance.

## Component-Specific Contracts

### Cards
Foundation additionally owns: surface material, background-image, border-color,
border-width, 3D depth, hover transform, hover shadow, premium material family.

### Buttons
Foundation additionally owns: surface, background, border, radius, shadow, elevation,
typography, sizing, variants (primary/secondary/danger/ghost), hover, transition,
animation, focus ring, disabled appearance, loading appearance.

## Additional Governance

### Strictly Forbidden on any Consumer
Never own: `bg-*`, `dark:bg-*`, `light:bg-*`, `background-image`, `shadow-*`,
`hover:shadow-*`, `rounded-*`, `border-*`, `hover:border-*`, `transition-*`,
`duration-*`, `ease-*`, `hover:translate*`, `hover:scale*`, `transform`, `animation`,
`motion`, inline style, `style={}`, `sx={}`, module CSS, styled-components, emotion,
Tailwind arbitrary visual values. Any visual ownership belongs to Foundation.

### No Duplication
Never recreate generic Cards/Buttons with `<div>`, `<button>`, `<a>`, `motion.div`,
`motion.button`, or custom wrappers when Foundation already provides the capability.
Always reuse Foundation.

### Newly Discovered Card or Button
1. Compare against Foundation. 2. If generic → migrate to Foundation. 3. Remove ALL
page-owned visual styling. 4. Keep only layout, content, business logic. 5. Delete
obsolete styling. Never copy its appearance.

### Bug Triage
1. Verify runtime. 2. Locate rendered component. 3. Determine ownership. 4. Consumer
owns it → fix Consumer. 5. Foundation owns it → fix Foundation ONCE.

### No Guessing Rule
Never recreate / approximate / restore an old implementation / assume the cause.
Instead: 1. Locate the rendered component. 2. Compare against the approved runtime
reference. 3. Identify the true visual owner. 4. Modify ONLY that owner.

### Consumer Cleanup
Whenever a consumer is migrated, remove: dead CSS, duplicate CSS, duplicate utilities,
obsolete wrappers, inline visual overrides, unused imports, unused helpers,
unreachable branches, obsolete variants, obsolete tokens. Never leave compatibility
styling behind.

### Visual Regression Policy
Verify: ✓ Light Mode ✓ Dark Mode ✓ Hover ✓ Motion ✓ Animation ✓ 3D depth ✓
Elevation ✓ Shadow ✓ Border ✓ Responsive behaviour ✓ Accessibility. Zero regressions.

### Special Exceptions
tables, table rows, charts, graph containers, modals, drawers, popovers, dropdown
menus, toolbars, floating action buttons, exam answer palette, OTP keypad, editor
toolbar, segmented controls, toggle switches, pagination controls, icon-only state
controls, branded hero banners, Ancient Reader parchment, intentionally branded
marketing/auth surfaces.

### Final Rule
If any future feature introduces another generic Card/Button with different visuals:
DO NOT copy it, DO NOT duplicate it, DO NOT create another Foundation. Instead
migrate it to Foundation, remove local styling, remove duplicate styling, delete dead
code, and preserve Foundation as the ONLY visual authority.

---

# 2. BUTTON SYSTEM (DS-002)

## Shared Contract

- **Purpose:** Reusable button controls for all user interactions.
- **Scope:** All generic button rendering across the application.
- **Single Source of Truth:** `src/components/common/AntigravityButton.tsx` — owns
  surface, background, border, radius, shadow, elevation, typography, sizing, variants,
  hover, transition, animation, motion, focus, disabled appearance, loading appearance.
- **Status:** PERMANENTLY FROZEN

(All shared ownership, protection, API evolution, verification rules inherited from
§1 Card System above. Component-specific differences listed in §1 Component-Specific
Contracts.)

---

# 3. COMPOSITE COMPONENTS

## Shared Contract

- **Purpose:** Reusable Foundation building blocks that compose primitives into
  common UI patterns.
- **Scope:** All composite components that reach Foundation maturity.
- **Single Source of Truth:** Each composite owns ONLY its documented responsibility.
  Example — `PremiumIconContainer` owns: premium icon material, background, border,
  elevation, hover, transition, sizing.
- **Status:** PERMANENTLY FROZEN when mature.

## Shared Foundation Ownership

Composite Components own: their visual language, their animation, their transitions,
their elevation, their semantic styling. Consumers own ONLY: placement, layout,
business logic, content.

## Shared Consumer Ownership

Consumers own ONLY: placement, layout, business logic, content. Nothing else.

## Foundation Protection

If ONE composite behaves incorrectly:
↓
Fix the Consumer. Do NOT modify Foundation.
Foundation changes ONLY when multiple verified consumers share the same runtime defect.

## API Evolution

New Composite capabilities may be added ONLY when ALL hold:
1. ≥3 real runtime consumers require it
2. Existing APIs cannot represent it
3. Capability belongs to Foundation (not one consumer)
4. Addition is fully backward compatible

## Verification Rules

Every Composite change requires verification of:
- ✓ Light Mode — ✓ Dark Mode — ✓ Hover — ✓ Motion — ✓ Accessibility
- ✓ Build — ✓ TypeScript

Build success alone is NEVER acceptance.

## Additional Governance

### No Duplication
Never recreate a frozen Composite Component using `<div>`, `<span>`, `motion.div`,
custom wrapper, inline utilities, or custom CSS. Always reuse the Foundation Composite.

### Consumer Rule
Consumers must NEVER override background, border, shadow, radius, animation,
transition, hover, or motion using className, inline style, custom CSS, or Tailwind
utilities. The Composite Component already owns them.

### Cleanup
Whenever a Composite Component is adopted, remove: duplicate wrappers, duplicate
styling, dead utilities, dead CSS, obsolete helper components, unreachable code.
Never leave compatibility styling behind.

---

# 4. DESIGN SYSTEM HIERARCHY (PERMANENT)

**Classification:** PERMANENT architectural contract. Defines where every reusable UI
component belongs. No future implementation may violate this hierarchy.

## Level 1 — Foundation Primitives
Examples: Card, Button, Input, Alert, Spinner, Pagination, DataTable, Typography.
Responsibilities: own the visual language, material, animation, transitions,
elevation, radius, semantic styling. These components never contain business logic.

## Level 2 — Foundation Composites
Examples: PremiumIconContainer, IconBadge, AdminIconWrap, StatCard, EmptyState,
ErrorState. Responsibilities: compose Level 1 primitives into reusable UI patterns.
May own ONLY documented composition + documented visual pattern. Must NOT duplicate
Level 1 styling.

## Level 3 — Application Components
Examples: ExamCard, TopicCard, SubjectCard, AttemptCard, DashboardCard.
Responsibilities: compose Level 1 and Level 2 components. Own ONLY application
layout, application content, business behaviour. Must NOT own generic visual language.

## Level 4 — Feature Components
Examples: Dashboard, Exams, Subject Tests, Topic Tests, Performance, Admin, Sub Admin.
Responsibilities: compose Application Components. Own ONLY page layout, routing,
feature logic, state management, API integration. Must NEVER own reusable visual
styling.

## Dependency Rule
Allowed: Level 4 → Level 3 → Level 2 → Level 1. Forbidden (reverse): Level 1 →
Level 2 → Level 3 → Level 4. Foundation must NEVER depend on application code.

## Visual Ownership
Every visual decision must exist in ONE place only. If visual ownership exists in
multiple layers, it is an architectural defect.

## Migration Rule
Whenever duplicate UI is discovered: identify its level. If it belongs to Level 1 →
move to Foundation Primitive; Level 2 → move to Foundation Composite; Level 3 →
reuse existing Foundation. Delete duplicate implementations.

## Surface Hierarchy — L0–L6 (Phase 5.4A, PERMANENT)

The canonical surface hierarchy. **No component may define its own surface color.** Every surface
must originate from the Surface Language; every future surface must map to one of these levels
(`SURFACE_LANGUAGE_SPECIFICATION.md` §3):

| Level | Name | Canonical token |
|---|---|---|
| L0 | App Background | `--surface-canvas` = `--bg-app` |
| L1 | Page Surface | premium `--bg-surface` / management `--management-surface` |
| L2 | Primary Surface | `--surface-primary` = `--bg-surface` / `--management-surface` |
| L3 | Secondary Surface | `--surface-secondary` = `--bg-elevated` / `--management-surface-muted` |
| L4 | Elevated Surface | `--surface-raised` / `--surface-floating` = `--bg-elevated` |
| L5 | Interactive Surface | `--surface-interactive` / `--surface-hover` = `--bg-hover` / `--management-surface-hover` |
| L6 | Overlay Surface | `--surface-overlay` = `--bg-overlay` |

Rules:
- No additional surface levels may be introduced; no new surface color tokens without a D-series
  decision.
- A management surface consumes ONLY `--management-*` tokens for surface/border/shadow/accent.
- The management light relight values (`--management-surface` `#FCFCFD`, `-muted` `#F6F8FA`,
  `-hover` `#EDF1F5`) are the certified light-theme baseline; dark mode is byte-identical.

## Elevation Hierarchy — E0–E3 (Phase 5.4A, PERMANENT)

The canonical elevation ladder. **No component may define its own elevation.** Every component
must consume only `--elevation-0` / `--elevation-1` / `--elevation-2` / `--elevation-3` (via their
`shadow-*` utilities); no hardcoded shadows; no additional elevation levels
(`SURFACE_LANGUAGE_SPECIFICATION.md` §4.3):

| Level | Name | Canonical shadow |
|---|---|---|
| E0 | Flat | `--elevation-0: none` |
| E1 | Default Surface | `--elevation-2` (premium `--card-shadow`; management `--management-shadow`) |
| E2 | Hover | `--elevation-3` (premium `--card-hover-shadow`/`shadow-card-premium`; management `--management-shadow-hover`) |
| E3 | Overlay / Modal | `--elevation-4` |

Rules:
- No custom/free-form shadows in consumer code; everything resolves through Foundation elevation
  tokens.
- Frozen premium materials (StatCard D-141 carved 3D shadow, Button primary `--material-button-*`,
  `.ancient-*`, `--elevation-carved`) are family materials, not elevation choices, and remain frozen.
- Colored glows (`shadow-success/20` etc.) are accent layers on E1/E2, not elevation levels.

## Final Rule
The Design System hierarchy is permanently frozen. Every future component must fit
into one of these four levels. Creating a new reusable visual system outside this
hierarchy is prohibited.

---

# 5. FOUNDATION ENGINEERING CONSTITUTION (PERMANENT)

**Classification:** PERMANENT engineering workflow. Governs HOW every future
implementation, migration, refactor, enhancement, or bug fix must be performed.

## Rule 1 — Foundation First
Always classify the work as Level 1, Level 2, Level 3, or Level 4 BEFORE writing
code. Never implement first; always classify first.

## Rule 2 — Ownership First
Every property must have ONE owner. Never allow background, border, shadow, radius,
hover, animation, transition, motion, typography, spacing, or theme to exist in
multiple layers. Multiple owners = architectural defect.

## Rule 3 — Consumer First
If ONE rendered component is wrong → assume Consumer. Do NOT touch Foundation. Only
change Foundation after verifying the same runtime defect exists across multiple
consumers.

## Rule 4 — Runtime First
Never accept code because build succeeds, TypeScript succeeds, or tests succeed.
Acceptance requires the RENDERED application to match the approved design.

## Rule 5 — No Recreation
Never recreate / approximate / rewrite / re-style / duplicate an approved component.
Always reuse the existing Foundation implementation.

## Rule 6 — Clean As You Go
Whenever any component is modified, remove dead code, dead CSS, duplicate CSS,
duplicate utilities, duplicate wrappers, obsolete helpers, unused imports, unused
tokens, obsolete variants, unreachable code. Do not postpone cleanup.

## Rule 7 — Additive Evolution
Foundation evolves only by additive, backward-compatible changes. Never break
existing consumers.

## Rule 8 — Delete After Migration
After migrating to Foundation, delete obsolete implementation, duplicate
implementation, temporary compatibility code, and legacy styling. Never keep both
implementations.

## Rule 9 — Verify Before Freeze
Before freezing any system, verify Light Mode, Dark Mode, Hover, Animation, Motion,
3D, Elevation, Responsive, Accessibility, Performance, Runtime. Only then freeze.

## Rule 10 — Freeze Means Freeze
Once a system is frozen, future work must adapt to the system. The system must not
adapt to individual pages.

## Final Principle
The application must always evolve toward ONE Design System, ONE visual language, ONE
owner for every responsibility, ONE implementation for every reusable component. Zero
duplication. Zero ambiguity. Zero competing systems.

---

# 6. DESIGN SYSTEM CHANGE CONTROL (PERMANENT)

**Classification:** PERMANENT governance policy. Governs how every future Design
System change must be proposed, reviewed, implemented, verified, approved, and frozen.

## Change Classification
- **Category A — Foundation Bug:** multiple Foundation consumers render incorrectly →
  fix Foundation.
- **Category B — Consumer Bug:** only one page renders incorrectly → fix Consumer;
  Foundation untouched.
- **Category C — Foundation Evolution:** ≥3 runtime consumers require a new
  capability → extend Foundation additively; never redesign existing APIs.
- **Category D — Feature Request:** a page needs a unique visual treatment →
  implement as a Feature Component; do NOT modify Foundation.

## Approval Workflow
1. Classify → 2. Identify ownership → 3. Locate runtime consumer → 4. Compare against
approved reference → 5. Implement → 6. Remove duplicate code → 7. Runtime verification
→ 8. Approval → 9. Freeze. Skipping any step is prohibited.

## Mandatory Evidence
Every implementation report must include: root cause, ownership, files changed,
runtime impact, removed dead code, removed duplicate styling, backward compatibility,
build result, TypeScript result, runtime verification. No "fixed" report is accepted
without evidence.

## No Architectural Drift
Future implementations must never create another visual owner, duplicate components,
tokens, variants, animations, shadows, borders, or themes. If duplication appears,
remove it immediately.

## Freeze Gate
A system may be frozen ONLY when: ✓ runtime approved ✓ architecture compliant ✓ no
dead code ✓ no duplicate styling ✓ no duplicate ownership ✓ backward compatible ✓
documentation updated. Otherwise DO NOT freeze.

## Permanent Principle
The Foundation is a product. Consumers are implementations. Pages adapt to the
Foundation. The Foundation never adapts to individual pages.

---

# 7. MENU / DROPDOWN SYSTEM (DS-008B)

## Shared Contract

- **Purpose:** Reusable dropdown menus for all generic menu/dropdown interactions.
- **Scope:** All generic menu/dropdown rendering across the application.
- **Single Source of Truth:** `src/components/common/Menu.tsx` — owns open/close
  state management, outside-click detection, escape-key handling, keyboard navigation,
  focus management, focus restoration, initial focus, ARIA attributes, animation,
  transition, positioning, alignment, z-index, light mode appearance, dark mode
  appearance, theme tokens.
- **Status:** PERMANENTLY FROZEN

## Shared Foundation Ownership

Foundation owns: appearance, layout, spacing, sizing, borders, radius, typography,
hover, focus, disabled appearance, keyboard behavior, semantic structure, accessibility,
ARIA attributes, light mode, dark mode, theme tokens, motion, transitions, state
management (open/close), interaction behavior (outside-click, escape), focus
management, animation presets, positioning, alignment, z-index.

## Shared Consumer Ownership

Consumers own ONLY: trigger content, menu items (text, structure, grouping), icons,
badges, labels, business logic, callbacks, routing, feature state, data loading.
Nothing else.

## Foundation Protection

If ONE menu behaves incorrectly:
↓
Fix the Consumer. Do NOT modify Foundation.
Foundation changes ONLY when multiple verified consumers share the same runtime defect.

## API Evolution

New Menu APIs may be added ONLY when ALL hold:
1. ≥3 real runtime consumers require it
2. Existing APIs cannot represent it
3. Capability belongs to Foundation (not one consumer)
4. Addition is fully backward compatible

No one-off APIs. No consumer-specific props.

## Verification Rules

Every Menu change requires verification of:
- ✓ Light Mode — ✓ Dark Mode — ✓ Open/Close — ✓ Outside click — ✓ Escape
- ✓ Keyboard navigation — ✓ Focus management — ✓ Animation — ✓ Positioning
- ✓ Alignment — ✓ Responsive behavior — ✓ Accessibility
- ✓ Build — ✓ TypeScript

Build success alone is NEVER acceptance.

## Component-Specific Contracts

### Menu.Trigger
Foundation additionally owns: trigger click handling, `aria-expanded`, `aria-haspopup`,
trigger wrapper positioning context.

### Menu.Content
Foundation additionally owns: dropdown surface rendering, absolute positioning,
3 alignment modes (left/right/center), configurable offset, configurable z-index,
min-width (`min-w-[200px]`), border radius (`rounded-2xl`), shadow (`shadow-2xl`).

### Menu.Item
Foundation additionally owns: `role="menuitem"`, click-to-close behavior, focus
management within items.

### Menu.Separator
Foundation additionally owns: visual divider rendering.

## Forbidden Generic Wrappers

Developers must NEVER create: ActionMenu, UserMenu, ProfileMenu, OverflowMenu,
FilterMenu, SettingsMenu, ContextMenu, DropdownMenu, NavMenu, or any other
generic wrapper that recreates the Menu shell. Compose the Foundation Menu directly.

## Cleanup Rule

Every Menu migration must remove: duplicate menu wrappers, duplicate outside-click
handlers, duplicate escape handlers, duplicate keyboard navigation, duplicate
animation, duplicate positioning, duplicate alignment, duplicate z-index, duplicate
CSS, dead menu components, dead utilities, dead imports, obsolete helper hooks,
compatibility code. Never leave duplicate behavior behind.

---

# 8. NAVIGATION SYSTEM (DS-009C)

## Shared Contract

- **Purpose:** Reusable sidebar navigation for all generic navigation patterns.
- **Scope:** All generic sidebar navigation rendering across the application.
- **Single Source of Truth:**
  - `src/components/common/Navigation.tsx` — owns sidebar shell, nav items, active
    state detection, active styling, hover styling, tooltip rendering, active indicator
    animation, collapse/expand, responsive modes, keyboard navigation, dark/light mode
    appearance, width transitions.
  - `useSidebarMode` hook — owns sidebar mode state, mode persistence, breakpoint
    detection, reactive mode updates, toggle collapse.
  - `useNavigationActive` hook — owns active state detection for a given path.
- **Status:** PERMANENTLY FROZEN

## Shared Foundation Ownership

Foundation owns: appearance, layout, spacing, sizing, borders, radius, typography,
hover, focus, disabled appearance, keyboard behavior, semantic structure, accessibility,
ARIA attributes, light mode, dark mode, theme tokens, motion, transitions, sidebar
shell, nav items, active state detection, active styling, tooltip rendering, active
indicator animation, collapse/expand, responsive modes, width transitions.

## Shared Consumer Ownership

Consumers own ONLY: navigation data (`NavItem[]` arrays), routes, permissions,
business logic, callbacks (`onItemNavigate`), logo content, role badge, user
information, theme toggle, sign-out action, footer content, storage keys.
Nothing else.

## Foundation Protection

If ONE navigation behaves incorrectly:
↓
Fix the Consumer. Do NOT modify Foundation.
Foundation changes ONLY when multiple verified consumers share the same runtime defect.

## API Evolution

New Navigation APIs may be added ONLY when ALL hold:
1. ≥3 real runtime consumers require it
2. Existing APIs cannot represent it
3. Capability belongs to Foundation (not one consumer)
4. Addition is fully backward compatible

No one-off APIs. No consumer-specific props.

## Verification Rules

Every Navigation change requires verification of:
- ✓ Light Mode — ✓ Dark Mode — ✓ Expanded sidebar — ✓ Collapsed sidebar
- ✓ Mobile drawer — ✓ Tablet mode — ✓ Collapse/expand — ✓ Active state
- ✓ Active indicator — ✓ Hover — ✓ Tooltip — ✓ Responsive behavior
- ✓ Accessibility — ✓ Theme toggle
- ✓ Build — ✓ TypeScript

Build success alone is NEVER acceptance.

## Component-Specific Contracts

### Navigation.Shell
Foundation additionally owns: sidebar container rendering (`<aside>`), width
management (`w-64` expanded, `w-20` collapsed), width transition, overflow handling,
footer slot, hamburger button, mobile drawer (AnimatePresence + motion.aside),
backdrop rendering.

### Navigation.Items
Foundation additionally owns: nav item rendering from config array, icon + label
layout, label visibility toggle, spacing (`gap-3` expanded, `justify-center`
collapsed).

### Navigation.Item
Foundation additionally owns: active state detection (`currentPath === item.path`),
active styling, hover styling, focus styling, tooltip rendering (collapsed mode),
active indicator animation (Framer Motion `layoutId`), icon scaling, keyboard
navigation, ARIA (`aria-current="page"`).

## Forbidden Generic Wrappers

Developers must NEVER create: Sidebar, AppSidebar, NavSidebar, NavigationSidebar,
SideNav, TopNav, NavigationMenu, AppNavigation, UserNavigation, AdminNavigation,
or any other generic wrapper that recreates the Navigation shell.
Compose the Foundation Navigation directly.

## Cleanup Rule

Every Navigation migration must remove: duplicate nav item rendering loops, duplicate
active state detection, duplicate sidebar mode management, duplicate collapse toggle
logic, duplicate nav item styling, duplicate tooltip rendering, duplicate drawer
rendering, dead navigation components, dead utilities, dead imports, compatibility
code. Never leave duplicate behavior behind.

---

# 9. TABLE / DATAGRID SYSTEM (DS-010)

## Shared Contract

- **Purpose:** Reusable data tables for all generic tabular data display.
- **Scope:** All generic table rendering across the application.
- **Single Source of Truth:**
  - `src/components/common/AntigravityData.tsx` (DataGrid) — owns thead, tbody,
    column sorting, sticky headers, row focus, row selection, striped rows, hover,
    empty state, loading state, error state, skeleton, responsive horizontal scroll.
  - `src/components/common/DataTable.tsx` (DataTable) — owns all DataGrid behavior
    plus Card shell, header, toolbar, loading overlay, pagination, keyboard shortcuts
    hint, stats line.
- **Status:** PERMANENTLY FROZEN

## Shared Foundation Ownership

Foundation owns: appearance, layout, spacing, sizing, borders, radius, typography,
hover, focus, disabled appearance, keyboard behavior, semantic structure, accessibility,
ARIA attributes, light mode, dark mode, theme tokens, motion, transitions, table
structure, column sorting, sticky headers, row focus, row selection, striped rows,
loading skeleton, empty state, error state, responsive scroll.

## Shared Consumer Ownership

Consumers own ONLY: columns definition, data array, row click handler, sort config,
loading/empty/error state messages, feature-specific cell rendering, pagination state,
header action, toolbar content. Nothing else.

## Foundation Protection

If ONE table behaves incorrectly:
↓
Fix the Consumer. Do NOT modify Foundation.
Foundation changes ONLY when multiple verified consumers share the same runtime defect.

## API Evolution

New Table APIs may be added ONLY when ALL hold:
1. ≥3 real runtime consumers require it
2. Existing APIs cannot represent it
3. Capability belongs to Foundation (not one consumer)
4. Addition is fully backward compatible

No one-off APIs. No consumer-specific props.

## Verification Rules

Every Table change requires verification of:
- ✓ Light Mode — ✓ Dark Mode — ✓ Sorting — ✓ Sticky headers — ✓ Row focus
- ✓ Row selection — ✓ Striped rows — ✓ Hover — ✓ Empty state — ✓ Loading
- ✓ Error state — ✓ Responsive scroll — ✓ Accessibility
- ✓ Build — ✓ TypeScript

Build success alone is NEVER acceptance.

## Component-Specific Contracts

### DataGrid
Foundation additionally owns: base `<table>` renderer, column header rendering
(icon + label + sort indicator), sort indicators (ArrowUp/ArrowDown/ArrowUpDown),
row focus (`focus-visible:ring-2`), row selection (`bg-selected-row`), loading
skeleton (8-row animated), responsive horizontal scroll (`overflow-x-auto`).

### DataTable
Foundation additionally owns: Card shell (`variant="empty" padding={0}`), header
slot (`TableHeader`), toolbar slot, loading overlay (`Spinner`), pagination slot,
keyboard shortcuts hint, stats line ("Showing X of Y").

---

# 10. TABS SYSTEM (DS-011)

## Shared Contract

- **Purpose:** Reusable tab interfaces for all generic tabbed content display.
- **Scope:** All generic tab rendering across the application.
- **Single Source of Truth:** `src/components/common/AntigravityData.tsx` (Tabs) —
  owns tab switching, active state detection, active styling, keyboard navigation,
  focus management, disabled state, animation, responsive sizing, light/dark mode
  appearance, theme tokens.
- **Status:** PERMANENTLY FROZEN

## Shared Foundation Ownership

Foundation owns: appearance, layout, spacing, sizing, borders, radius, typography,
hover, focus, disabled appearance, keyboard behavior, semantic structure, accessibility,
ARIA attributes, light mode, dark mode, theme tokens, motion, transitions, tab
switching, active state, animated pill, roving tabindex.

## Shared Consumer Ownership

Consumers own ONLY: tab labels, tab values, tab icons, tab badges, tab disabled state,
active tab state, content rendering per tab, business logic. Nothing else.

## Foundation Protection

If ONE tab behaves incorrectly:
↓
Fix the Consumer. Do NOT modify Foundation.
Foundation changes ONLY when multiple verified consumers share the same runtime defect.

## API Evolution

New Tab APIs may be added ONLY when ALL hold:
1. ≥3 real runtime consumers require it
2. Existing APIs cannot represent it
3. Capability belongs to Foundation (not one consumer)
4. Addition is fully backward compatible

No one-off APIs. No consumer-specific props.

## Verification Rules

Every Tab change requires verification of:
- ✓ Light Mode — ✓ Dark Mode — ✓ Tab switching — ✓ Keyboard navigation (Arrow, Home/End)
- ✓ Focus management — ✓ Disabled state — ✓ Animation (pill slide) — ✓ Sizing (sm/md/lg)
- ✓ Accessibility (`role="tablist"`, `role="tab"`, `aria-selected`)
- ✓ Build — ✓ TypeScript

Build success alone is NEVER acceptance.

## Component-Specific Contracts

### Tabs.List
Foundation additionally owns: `role="tablist"`, horizontal layout, pill container.

### Tabs.Trigger
Foundation additionally owns: `role="tab"`, `aria-selected`, `aria-disabled`,
`tabIndex` (roving), icon slot, badge slot, disabled styling.

### Tabs.Pill
Foundation additionally owns: animated active indicator via Framer Motion `layoutId`,
spring transition.

---

# 11. LAYOUT PRIMITIVES SYSTEM (DS-012)

## Shared Contract

- **Purpose:** Reusable layout primitives for all generic page and section layouts.
- **Scope:** All generic layout rendering across the application.
- **Single Source of Truth:** `src/components/common/AntigravityLayout.tsx` — owns
  PageContainer, Stack, Grid, SectionBlock, SectionHeader, SectionWrapper, PageHeader,
  FilterBar, StatePanel, FilterSelect.
- **Status:** PERMANENTLY FROZEN

## Shared Foundation Ownership

Foundation owns: appearance, layout, spacing, sizing, borders, radius, typography,
hover, focus, keyboard behavior, semantic structure, accessibility, ARIA attributes,
light mode, dark mode, theme tokens, motion, transitions, page wrapper, flex
containers, grid containers, section spacing, filter containers, empty states.

## Shared Consumer Ownership

Consumers own ONLY: layout content, grid column definitions, filter configuration,
section content, business logic. Nothing else.

## Foundation Protection

If ONE layout primitive behaves incorrectly:
↓
Fix the Consumer. Do NOT modify Foundation.
Foundation changes ONLY when multiple verified consumers share the same runtime defect.

## API Evolution

New Layout APIs may be added ONLY when ALL hold:
1. ≥3 real runtime consumers require it
2. Existing APIs cannot represent it
3. Capability belongs to Foundation (not one consumer)
4. Addition is fully backward compatible

No one-off APIs. No consumer-specific props.

## Verification Rules

Every Layout change requires verification of:
- ✓ Light Mode — ✓ Dark Mode — ✓ Responsive behavior — ✓ Accessibility
- ✓ Build — ✓ TypeScript

Build success alone is NEVER acceptance.

## Component-Specific Contracts

### PageContainer
Foundation additionally owns: max-w-[1280px] mx-auto wrapper, `centered` variant
(full-screen centered layout), `fullHeight` variant, `padded` prop.

### Stack
Foundation additionally owns: flex container, configurable gap (xs/sm/md/lg/xl/xxl/
section/number), direction (col/row), align (start/center/end/stretch), justify
(start/center/end/between).

### Grid
Foundation additionally owns: CSS Grid, responsive columns (1/2/3/4), responsive
overrides (sm/md/lg), configurable gap.

### SectionBlock
Foundation additionally owns: vertical section spacing container (`space-y`), the
canonical section-level spacing primitive.

### SectionHeader / SectionWrapper / PageHeader (Legacy)
Foundation additionally owns: title + action header, vertical spacing container,
page header with subtitle + actions. These components are LEGACY — see Legacy Layout
Components below.

### FilterBar / StatePanel / FilterSelect
Foundation additionally owns: responsive filter container, empty/error state
container, dropdown filter (via Menu).

## Canonical Layout Primitives

The following layout primitives are the permanent, canonical layout foundation of
the repository:

- PageContainer
- Stack
- Grid
- SectionBlock

Future reusable UI components must COMPOSE these primitives instead of recreating
layout behavior. No new layout primitives may be introduced without a repository-wide
requirement (see API Evolution rules above).

## ContentContainer Decision (Phase 1b Step 4)

ContentContainer does not exist in the repository. **Option A is adopted**:
ContentContainer will NOT be created unless a real, repository-wide need is
demonstrated through the API Evolution rules above. Later migration phases must not
silently introduce it.

## Legacy Layout Components

SectionHeader, SectionWrapper, and PageHeader are legacy layout components. They are
NOT part of the canonical layout foundation and must NOT be silently migrated during
Step 5. Any modernization of these components is dedicated reusable component work
governed by the normal Foundation change control process.

## Compose, Don't Recreate

Reusable UI components must never recreate spacing or layout behavior already provided
by PageContainer, Stack, Grid, or SectionBlock. When a reusable component requires
standard layout behavior, it composes the existing layout primitives. This keeps
layout behavior centralized and consistent.

### Composition Before Configuration

If a component requires layout behavior, prefer composing Stack, Grid, PageContainer,
or SectionBlock. Do NOT add spacing props simply to recreate layout behavior inside a
component. Composition is always preferred over expanding component APIs.

## Separation of Layout from UI

The architectural distinction is permanent:

```
Layout primitives
↓
Reusable UI components
↓
Application pages
```

Layout primitives define structure. Reusable UI components define presentation and
interaction. Pages compose reusable components. Mixing these responsibilities is
prohibited.

---

# 12. FORMS SYSTEM (DS-013)

## Shared Contract

- **Purpose:** Reusable form controls for all generic form input interactions.
- **Scope:** All generic form input rendering across the application.
- **Single Source of Truth:** `src/components/common/AntigravityForm.tsx` — contains
  Input, TextArea, Select, Switch, Checkbox, Radio, RadioGroup.
- **Status:** PERMANENTLY FROZEN

## Shared Foundation Ownership

Foundation owns: appearance, layout, spacing, sizing, borders, radius, typography,
hover, focus, disabled appearance, validation presentation, keyboard behavior,
semantic structure, accessibility, ARIA attributes, labels, helper text,
error/success presentation, light mode, dark mode, theme tokens, motion, transitions.

## Shared Consumer Ownership

Consumers own ONLY: values, options, selected values, onChange callbacks,
validation rules, validation messages, business logic, permissions, feature state,
API integration, data loading. Nothing else.

## Foundation Protection

If ANY form component behaves incorrectly:
↓
Fix the Consumer. Do NOT modify Foundation.
Foundation changes ONLY when multiple verified consumers share the same runtime defect.

## API Evolution

Any new Foundation form control must satisfy ALL before becoming part of Foundation:
1. ≥3 real runtime consumers require the capability
2. Existing APIs cannot represent it
3. Responsibility belongs to Foundation (behavior/appearance, not business logic)
4. Addition is fully backward compatible

No one-off APIs. No consumer-specific props.

## Verification Rules

Every Forms System modification requires verification of:
- ✓ Light Mode — ✓ Dark Mode — ✓ Hover — ✓ Focus — ✓ Disabled state
- ✓ Validation visual states — ✓ Accessibility — ✓ Keyboard navigation
- ✓ Screen reader — ✓ Responsive behavior
- ✓ Build — ✓ TypeScript

Build success alone is NEVER acceptance.

## Component-Specific Contracts

### RadioGroup
Foundation additionally owns: group semantics (`role="radiogroup"`, `role="radio"`,
`aria-checked`), single-selection behavior, keyboard navigation (ArrowLeft/ArrowRight),
selection indicator, container spacing, equal-width layout.

### Select
Foundation additionally owns: native `<select>` rendering, dropdown arrow indicator,
option rendering, placeholder option.

### Checkbox
Foundation additionally owns: custom checkbox rendering (not native), checkmark
animation, check indicator.

### Switch
Foundation additionally owns: toggle track (`<button role="switch">`), animated
knob, track color transition, `aria-checked`.

### Input
Foundation additionally owns: type handling (text/password/email/number/search),
placeholder styling, icon slots (left/right), compact variant, violet variant.

### TextArea
Foundation additionally owns: resize behavior (`resize-none`), compact variant,
multiline rendering.

### Future Controls
Any future form control (Combobox, Autocomplete, DatePicker, OTPInput, FileUpload,
ColorPicker, Slider, Rating, TransferList, etc.) inherits ALL shared ownership,
protection, API evolution, and verification rules above. It adds ONLY its
component-specific contract section.

## Forbidden Generic Wrappers

Developers must NEVER create: CustomCheckbox, CustomRadio, CustomSwitch,
CustomRadioGroup, SegmentedControl, ToggleGroup, OptionGroup, ButtonGroup
(for selection), or any any other generic wrapper that recreates form input behavior.
Compose the Foundation Form components directly.

---

# 13. SPACING TOKEN SYSTEM (DS-014)

**Classification:** PERMANENT governance contract for the single-layer spacing token system.

## Shared Contract

- **Purpose:** The one approved source of spacing values throughout the repository.
- **Scope:** All spacing values (padding, margin, gap, inset offsets) across every layer — reusable components and pages alike.
- **Single Source of Truth:** `src/styles/themes.css` — owns the token scale `--space-0` … `--space-24` and their values (`--space-4 = 16px`, etc.). Tailwind `@theme` utility wiring in `src/index.css` is an implementation detail, NOT part of the token definition.
- **Status:** PERMANENTLY FROZEN (token scale approved in Phase 1b Step 2; consumption migration continues Steps 3–8).

## Framework Independence

The Design System owns the spacing values; Tailwind is only one method of consuming them.

- Tokens are defined purely as values: `--space-4 = 16px`.
- Tailwind utility mapping (`p-4`, `gap-4`, `px-4`) belongs to the implementation, not to the token definition.
- Consumers may reference tokens via CSS `var()` or through any framework. The token layer must never depend on a CSS framework.

## Only Approved Source of Spacing

**Spacing tokens are the only approved source of spacing values throughout the repository.**

- Reusable components must never introduce new spacing values unless they become part of the Design System.
- Avoid: random `px` values, one-off spacing, arbitrary spacing additions.
- Every reusable spacing value must originate from the spacing token system.

## Token Approval Policy

A new spacing token may be added ONLY when ALL of the following hold:

1. An existing token cannot satisfy the requirement.
2. The value is expected to be reused (not a one-off).
3. The value has been reviewed and approved as part of the Design System.

Otherwise, existing spacing tokens must be reused. The goal is to keep the spacing system small, predictable, and consistent.

## Off-Scale Legacy Values

Off-scale spacing values that remain in the repository (for example 10px and 14px) are
legacy values, NOT tokens. They must never be:

- converted into temporary tokens
- silently replaced with one-off spacing values
- migrated outside the Design System approval process

If any off-scale value ever needs to become a first-class spacing value, it must comply
with the Token Approval Policy above and be approved as part of the Design System first.

## Simplicity (No Abstraction Layers)

Do NOT introduce additional spacing abstraction layers:

- No primitive spacing tokens
- No semantic spacing tokens
- No alias spacing tokens
- No multi-level spacing mapping

The approved architecture is:

```
Pages → Reusable Components → Spacing Tokens
```

Layout components (PageContainer, Stack, Grid, SectionBlock) are reusable components, not a token layer; they simply consume the tokens. (ContentContainer does not exist and is not planned — see §11 Canonical Layout Primitives.) This architecture remains consistent with the Typography, Colors, Radius, and Shadows systems.

## Final Principle

> The Design System should centralize values — not complexity.
>
> Every reusable component should consume the same spacing tokens.
>
> Pages should consume reusable components.

---

# 14. DESIGN SYSTEM MIGRATION LIFECYCLE (PERMANENT)

**Classification:** PERMANENT governance policy. Governs how every future Design System migration (spacing, typography, colors, radius, shadows, or any other token category) is performed.

Every Design System migration must follow the same lifecycle:

1. **Repository Audit** — inventory current usage, values, and inconsistencies.
2. **Token Design** — define token values from actual repo usage; no invented scales.
3. **Token Integration** — introduce tokens into the Design System.
4. **Layout Primitive Migration** — layout components become the first consumers of the token system and establish repository-wide behavior.
5. **Reusable Component Migration** — reusable UI components consume tokens.
6. **Repository Migration** — migrate only the remaining hardcoded values; utilities already resolving through tokens need no changes.
7. **Repository Certification** — verify BOTH visual parity and architecture compliance (token consumption, no hardcoded values, duplicates removed, consistent usage).
8. **Legacy Cleanup** — remove orphaned values and hardcoded leftovers.

This lifecycle ensures:

- predictable migrations
- visual stability
- minimal regression risk
- repository-wide consistency

Skipping any step is prohibited.

## Step 5 Execution Governance (Reusable Component Migration)

Step 5 migrates ONLY reusable UI components. It includes components such as:

- Card, Panel, Container (surface)
- Input, Select, Textarea, Checkbox, Radio (form)
- Button, IconButton, FAB (action)
- Tabs, Breadcrumb, Pagination (navigation)
- Modal, Dialog, Toast, Alert, Tooltip (feedback)
- Table, DataGrid, List, EmptyState, Skeleton (data)

Step 5 EXCLUDES: application pages, exam pages, review pages, dashboard pages, and
feature-specific components. These belong to later repository migration phases.

The Step 5 scope is FROZEN once the phase begins. It may not be expanded to include
layout primitives, application pages, feature modules, dashboard implementations, exam
flows, or review flows. Only reusable UI components may be migrated. Any newly
discovered work is documented and scheduled for a later phase — never absorbed into
Step 5.

Reusable components must migrate in dependency order, validating each group before
proceeding:

1. Surface Components (Card, Panel, Container)
2. Form Components (Input, Select, Textarea, Checkbox, Radio)
3. Action Components (Button, IconButton, FAB)
4. Navigation Components (Tabs, Breadcrumb, Pagination)
5. Feedback Components (Modal, Dialog, Toast, Alert, Tooltip)
6. Data Components (Table, DataGrid, List, EmptyState, Skeleton)

NEVER migrate multiple component groups simultaneously. Each group completes the full
cycle — Audit → Migration → Validation → Certification → Approval — before the next
group begins.

Migrations stay SMALL. Each migration ideally represents one component or one closely
related component family. Small migrations simplify review, rollback, certification,
and regression detection. Avoid very large migration commits.

Certification is performed PER COMPONENT GROUP — not once at the end of Step 5. After
each group completes, validate: visual parity, responsive behavior, spacing token
usage, removal of hardcoded spacing, and absence of duplicated layout logic. Small
certification checkpoints make regressions easier to isolate.

Step 5 must also preserve repository simplicity: no additional spacing layers, no
component-specific spacing systems, no semantic spacing aliases, no duplicated layout
behavior, and no alternative spacing scales. Every reusable component consumes the same
Design System.

## Step 5 Behavioral Parity

Migration changes implementation — NOT behavior. Every migrated component must verify:
interactions, keyboard support, accessibility, loading states, disabled states,
responsive behavior, and visual appearance. Behavioral regressions are treated as
migration failures.

## Step 5 Inventory & Canonical Components

Before ANY component group is migrated, a complete reusable component inventory MUST be
generated AND APPROVED. For each reusable component the inventory records:

- component name
- file location
- current consumers
- spacing usage
- layout primitive usage
- hardcoded spacing
- duplicate implementations
- migration priority
- canonical component (if duplicates exist)

The inventory is an APPROVAL GATE: no reusable UI component may be migrated until the
complete inventory has been reviewed and approved.

Where duplicate reusable components exist, a single canonical implementation MUST be
chosen. The canonical component is selected FIRST and migrated FIRST. Alternatives are
marked as deprecated. Consumers update later during repository migration. Document: the
canonical component, the deprecated component, the migration strategy, and the removal
strategy. Duplicate implementations are NOT migrated in parallel — maintain only ONE
active implementation.

## Step 5 API Stability & Deprecation

Public APIs are preserved whenever possible: props, events, exports, and behavior.
Internal implementation may change. Public APIs remain stable unless a repository-wide
breaking change is explicitly approved through the Design System change control process.

When an older reusable component is replaced, it is NOT deleted immediately. It is
marked as: deprecated, scheduled for removal, and replacement available. Deprecated
components are removed only after repository migration has been completed.

## Step 5 Documentation & Metrics

Documentation is written IMMEDIATELY after each component migration — it must never lag
behind implementation. Each component's documentation records: responsibilities, public
API, dependencies, Design System tokens consumed, layout primitives composed, intended
usage, deprecated replacements (if any), and known limitations. Every component has a
clearly defined responsibility.

Migration progress is tracked with measurable metrics:

- components completed
- remaining components
- hardcoded spacing removed
- spacing token adoption
- duplicate components eliminated
- layout primitive adoption
- visual regressions
- responsive regressions

## Step 5 Repository Health Checkpoints

After each component group completes, verify: build status, lint status, type checking,
visual verification, and responsive verification. Any unrelated pre-existing issues are
recorded SEPARATELY. Migration work must never hide unrelated repository problems.

## Step 5 Controlled Exceptions

If a reusable component cannot fully adopt the Design System because of a legitimate
technical constraint, the exception MUST be documented with: the reason, the temporary
implementation, the future migration phase, the owner, and the removal condition.
Undocumented exceptions are prohibited.

## Step 5 Certification

Before Step 5 is approved, verify ALL of the following:

- all component groups completed
- reusable UI components consume spacing tokens
- reusable UI components compose layout primitives where appropriate
- duplicate implementations reduced
- no new spacing systems exist
- public APIs preserved
- visual parity is maintained
- responsive behavior is maintained

## Step 5 Foundation Freeze

After Step 5 is certified, freeze: spacing tokens, layout primitives, and the reusable
component architecture. Subsequent work EXTENDS the Design System rather than redesigns
it. Any future architectural change follows the established Design System lifecycle and
governance process (§6 Design System Change Control).

## Step 5 Discipline

Throughout the remaining migration phases, do not optimize for speed. Optimize for:
consistency, maintainability, predictable architecture, incremental certification, and
repository stability. Every completed phase must leave the repository in a
production-ready state before the next phase begins.

## Step 5B Execution Recommendations (Phase 1b Step 5)

Approved with the Step 5A component inventory (Phase 1b). These ten recommendations
govern the execution of every Step 5 component group.

### 5B-1 Inventory Freeze
The approved component inventory is FROZEN when Step 5B begins. Newly discovered
reusable components are documented, classified, and scheduled AFTER the current group —
never absorbed into the active migration. This prevents migration scope creep.

### 5B-2 Canonical Component First
Within every component family the migration order is fixed:
1. migrate the canonical component
2. certify it
3. migrate dependent wrappers
4. update consumers later

Never migrate a deprecated implementation before the canonical one.

### 5B-3 Consumer Impact Analysis
Before modifying a component with many consumers (e.g. Card, Button, EmptyState,
LoadingSkeleton), produce a consumer impact report covering: consumer count, consumer
categories, API usage patterns, customization patterns, and potential regression points.
Large-impact components receive additional validation.

### 5B-4 Wrapper Preservation
Thin wrappers remain thin. Wrappers compose canonical components, simplify common
usage, and preserve APIs. They must never become competing implementations or absorb
business logic.

### 5B-5 Component Dependency Graph
Before each migration group, document Component → Depends on → Used by. The dependency
graph guides migration order and certification. Never migrate a component whose
dependencies remain unstable.

### 5B-6 Dead Component Register
Components confirmed as dead code are entered in a dedicated register: component,
reason, consumer count, planned removal phase. Dead components are NOT deleted during
Step 5. Removal belongs to the later repository cleanup phase.

### 5B-7 Regression Baseline
Before migrating each component group, capture a baseline: screenshots, responsive
layouts, interaction behavior, accessibility behavior (where applicable). The baseline
is the reference for group certification.

### 5B-8 Exception Register
A migration that cannot fully satisfy Design System rules is recorded in a dedicated
register: component, reason, temporary solution, target resolution phase, approval
reference. Every exception must be traceable.

### 5B-9 Group Completion Report
Each completed component group produces a report: migration summary, components
migrated, duplicate reductions, spacing token adoption, layout primitive adoption,
behavioral parity verification, remaining work. Group reports are required — not only
the final Step 5 report.

### 5B-10 Stable Execution Rhythm
Every component group follows the same rhythm:
Inventory → Migration → Validation → Certification → Approval → Next Group.
Never overlap two migration groups. This isolates regressions and simplifies review.

> Final Design Principle: Inventory provides visibility. Canonical components provide
> consistency. Small, certified migrations provide stability. Complete one component
> group with confidence before moving to the next.

## Step 6 Execution Governance (Repository-Wide Design System Adoption)

Step 6 migrates application pages, exam flows, review flows, dashboards, and feature
modules to the certified Design System (frozen at Step 5 certification — repository
v2.0.0). Step 6 is NOT a redesign phase; it replaces custom implementations with the
certified reusable components.

### 6A-1 Certified Foundation Freeze
The Step 5 certified foundation (Typography, Spacing Tokens, Layout Primitives,
Surface, Form, Action, Navigation, Feedback components) is FROZEN and canonical.
Step 6 changes consumers, never the foundation. Any foundation change requires the
Step 5 change-control process (§6, §21, §22).

### 6A-2 Golden Reference
The User Panel remains the visual reference for the entire application. Every
migration must preserve appearance, spacing, typography, interaction,
responsiveness, accessibility, and animations. Conflict → **User Panel wins.**

### 6A-3 Repository Scope
Audit every page in User Panel, Examination, Sub Admin, and Admin. For every page
identify: custom UI, duplicate implementations, bespoke layouts, and direct Tailwind
implementations that bypass reusable components.

### 6A-4 Consumer Audit
Every page produces a Consumer Audit: Current Components → Canonical Mapping
(custom component → certified equivalent, e.g. custom Card → Card, custom Button →
Button, custom Modal → AdminModal/ConfirmModal/SuccessModal).

### 6A-5 Migration Rules
Never redesign. Never change public APIs unless absolutely necessary. Replace only
implementation. Consumers move to the certified component.

### 6A-6 Adoption Requirements
Replace bespoke layouts with the certified primitives where appropriate
(PageContainer, Stack, Grid, SectionBlock). Replace hardcoded typography, spacing,
and colors with certified Design System tokens. Use only certified reusable
components. Do not introduce new layout systems, font sizes, spacing values, or
colors.

### 6B-1 Duplicate Reduction
Identify duplicate implementations. Document: duplicate, canonical replacement,
consumer count, migration impact. Remove duplicates only after all consumers have
migrated.

### 6B-2 Dead Code
Document unused components, obsolete utilities, abandoned wrappers, and duplicate
helpers in the Dead Component Register. Do not remove shared code until there are
zero consumers.

### 6B-3 Accessibility & Responsive
Verify every migrated page: keyboard navigation, focus visibility, screen readers,
aria attributes, and responsive layouts. Verify XS/SM/MD/LG/XL breakpoints. No
regressions.

### 6B-4 Performance
Do not introduce unnecessary renders. Do not duplicate providers. Reuse certified
infrastructure wherever possible.

### 6B-5 Documentation
Update per group: Execution Log, Consumer Migration Report, Dead Component Register,
Exception Register (only if new exceptions are unavoidable), Duplicate Reduction
Report.

### 6B-6 Validation
Run after every migration group: `npm run build`, `npx tsc --noEmit`, lint (if
configured), responsive verification, accessibility verification.

### 6B-7 Out of Scope
Do NOT perform: Button System Standardization, new animations, new themes, visual
redesign, color redesign, new spacing scales, new typography scales. These belong to
future phases. When discovered during Step 6 audits, document them — never implement.

### 6B-8 Step 6 Completion Criteria
Step 6 is complete only if: every page consumes the certified Design System; custom
implementations are eliminated wherever possible; duplicate components are removed
after migration; User Panel appearance is preserved; repository builds successfully;
TypeScript reports zero errors; accessibility is maintained; responsive behavior is
unchanged; documentation is complete.

### 6B-9 Stable Execution Rhythm
Step 6 groups follow: Audit → Plan → Migrate → Validate → Certify → Approval → Next
Group. Never overlap two migration groups.

---

# 15. GOVERNANCE LIFECYCLE

The only approved documentation workflow:

1. Read `AI_PROJECT_CONTEXT.md` (onboarding)
2. Read `PROJECT_ARCHITECTURE.md` (application structure)
3. Read `FOUNDATION_GOVERNANCE.md` (permanent rules)
4. Read `DESIGN_SYSTEM_WORKFLOW.md` (implementation playbook)
5. Implement
6. Verify (`npx tsc --noEmit` + `npm run build`)
7. Record implementation in `FOUNDATION_FREEZE_REGISTER.md`
8. Update Adoption Register (if applicable)
9. Freeze (if applicable)

Contributors and AI agents must follow this lifecycle. Skipping documentation
steps is prohibited.

---

# 16. DOCUMENTATION RELATIONSHIPS

```
AI_PROJECT_CONTEXT
        ↓
PROJECT_ARCHITECTURE
        ↓
FOUNDATION_GOVERNANCE
        ↓
DESIGN_SYSTEM_WORKFLOW
        ↓
FOUNDATION_FREEZE_REGISTER
```

Rules:
- Higher-level documents define policy.
- Lower-level documents must never contradict higher-level documents.
- `FOUNDATION_FREEZE_REGISTER` records history only — governance is never
  authored inside the Freeze Register.
- `DESIGN_SYSTEM_WORKFLOW` explains how to apply governance — it does not
  create new governance.
- `PROJECT_ARCHITECTURE` defines application structure — it defers to
  `FOUNDATION_GOVERNANCE` for all Design System decisions.

---

# 17. DOCUMENT CHANGE POLICY

| Document | Update Rule |
|---|---|
| `AI_PROJECT_CONTEXT.md` | Update ONLY when onboarding information changes |
| `PROJECT_ARCHITECTURE.md` | Update ONLY when application architecture changes |
| `FOUNDATION_GOVERNANCE.md` | Update ONLY when governance evolves |
| `DESIGN_SYSTEM_WORKFLOW.md` | Update ONLY when implementation workflow evolves |
| `FOUNDATION_FREEZE_REGISTER.md` | Update continuously after every implementation, adoption wave, runtime audit, or freeze |

---

# 18. DOCUMENT VERSIONING PRINCIPLE

Documentation versions are independent from application versions.

- **Patch (x.x.1):** Documentation corrections.
- **Minor (x.1.0):** Governance additions.
- **Major (2.0.0):** Breaking governance restructuring.

---

# 19. DOCUMENT OWNERSHIP

Every topic has ONE canonical owner:

| Topic | Canonical Owner |
|---|---|
| AI onboarding | `AI_PROJECT_CONTEXT.md` |
| Application architecture | `PROJECT_ARCHITECTURE.md` |
| Design System governance | `FOUNDATION_GOVERNANCE.md` |
| Implementation workflow | `DESIGN_SYSTEM_WORKFLOW.md` |
| Implementation history | `FOUNDATION_FREEZE_REGISTER.md` |

Duplicate ownership is forbidden. If a topic appears in two documents, one is
wrong and must be corrected.

---

# 20. MODIFICATION POLICY

Future governance changes require:
1. Architecture justification
2. Backward compatibility
3. Documentation update
4. Version increment
5. Approval

---

# 21. FOUNDATION ADOPTION PRINCIPLE

A remaining Foundation bypass is NOT automatically technical debt.
Every bypass must be explicitly classified before migration is considered.
Only unclassified bypasses require investigation.

**Every consumer bypass MUST belong to exactly ONE category.
Unclassified bypasses are governance defects.**

Classification categories (see `FOUNDATION_FREEZE_REGISTER.md` Remaining Foundation
Bypasses section for the current classified list):

- **Category A — Intentional Exception:** Governance explicitly allows this
  implementation. No action required.
- **Category B — Foundation Capability Gap:** The Foundation currently has no generic
  capability. A future Foundation evolution may be justified.
- **Category C — Future Adoption Candidate:** A Foundation component already exists,
  but migration is intentionally deferred.
- **Category D — Feature-Specific Component:** This implementation should NEVER
  migrate to Foundation because it belongs to a domain-specific workflow.
- **Category E — Governance Violation:** A consumer bypasses an existing Foundation
  capability without an approved, documented architectural reason. This is NOT an
  intentional exception. This is NOT a Foundation capability gap. This is NOT
  feature-specific. Foundation already supports the required capability. The consumer
  simply failed to adopt it.

Category E violations are mandatory work items. They cannot remain indefinitely.
They must either be migrated to Foundation, or be reclassified into another valid
category with documented evidence.

---

# 22. FOUNDATION BYPASS DECISION FLOW

Every future bypass must follow this exact classification process:

```
Consumer bypass discovered
        ↓
Does Foundation already support it?
        ↓ NO → Category B (Foundation Capability Gap)
        ↓ YES
Is it an approved documented exception?
        ↓ YES → Category A (Intentional Exception)
        ↓ NO
Is it feature-specific?
        ↓ YES → Category D (Feature-Specific Component)
        ↓ NO
Is migration intentionally deferred?
        ↓ YES → Category C (Future Adoption Candidate)
        ↓ NO
Category E (Governance Violation)
```

This flow is the ONLY approved classification process.
Every bypass must be classified through this decision path before it is recorded
in the Foundation Adoption Register (`FOUNDATION_FREEZE_REGISTER.md`).

---

# 23. ADOPTION GOVERNANCE

Foundation Adoption is continuous. Every future adoption wave must:

1. **Measure progress** — record consumers migrated, Foundation files changed, and
   remaining bypasses in the Adoption History table (`FOUNDATION_FREEZE_REGISTER.md`).
2. **Update the Adoption History** — append a new row to the Foundation Adoption
   History table. Never replace or rewrite existing rows.
3. **Update Remaining Bypass classifications** — reclassify any bypass whose status
   changes. Add new bypasses when discovered. Remove bypasses that have been migrated.
4. **Verify ownership** — confirm every migrated consumer delegates visual ownership
   to a single Foundation component. No consumer may own Foundation visual properties.
5. **Verify runtime** — `npx tsc --noEmit` exit 0 and `npm run build` exit 0 before
   and after every adoption wave.
6. **Avoid unnecessary Foundation systems** — never create a new Foundation system to
   satisfy a single consumer. Foundation systems require ≥3 real runtime consumers.

---

# 24. DOCUMENTATION BASELINE

The current documentation architecture is considered complete. The official
documentation stack is permanently defined as:

1. **`AI_PROJECT_CONTEXT.md`** — Project entry point and onboarding.
2. **`PROJECT_ARCHITECTURE.md`** — Canonical application architecture.
3. **`FOUNDATION_GOVERNANCE.md`** — Canonical Design System governance.
4. **`DESIGN_SYSTEM_WORKFLOW.md`** — Canonical implementation workflow.
5. **`FOUNDATION_FREEZE_REGISTER.md`** — Historical implementation and adoption record.

No additional permanent governance documents should be introduced unless a clear
architectural gap is demonstrated. See §25 for the maintenance principle.

---

# 25. DOCUMENT MAINTENANCE PRINCIPLE

Future work should normally UPDATE existing documentation. It should NOT:

- Create new governance documents
- Duplicate governance
- Duplicate workflow
- Duplicate architecture
- Duplicate history

Each topic must continue to have exactly one canonical owner (see §19). Before
modifying documentation, consult the Documentation Maintenance Checklist (§27).

---

# 26. GOVERNANCE MATURITY

Version 1.12.0+ represents the stable governance baseline. Future governance
changes should be:

- **Small** — incremental additions, not restructuring
- **Backward compatible** — never break existing governance rules
- **Driven by demonstrated project needs** — not theoretical improvements

Avoid expanding governance unless it materially improves engineering practice.
The governance framework is complete; further expansion requires strong justification.

---

# 27. DOCUMENTATION MAINTENANCE CHECKLIST

Before modifying documentation, ask:

- [ ] Does this belong in an existing document?
- [ ] Am I duplicating another document?
- [ ] Am I changing the canonical owner?
- [ ] Is this governance or history?
- [ ] Can this be handled by updating an existing section?

Only if all answers are appropriate should documentation be modified.

---

# 28. GOVERNANCE STABILITY

Version 1.12.0+ is the stable governance baseline. Governance should remain
intentionally stable. Future governance changes should occur ONLY when supported
by demonstrated engineering evidence. Governance must not expand simply because
additional ideas are available.

---

# 29. GOVERNANCE REVIEW POLICY

Governance should normally be reviewed ONLY when one or more of the following
occurs:

- A new Foundation System is introduced.
- A recurring implementation problem exposes a governance gap.
- Multiple Adoption Waves repeatedly encounter the same issue.
- An architectural change affects multiple Foundation systems.
- A documented governance contradiction is discovered.
- A repeated engineering decision cannot be resolved using existing governance.

Otherwise, prefer updating existing sections rather than creating new governance.

---

# 30. GOVERNANCE CHANGE PRINCIPLES

Future governance changes should be:

- **Minimal** — smallest possible addition
- **Incremental** — never restructuring
- **Backward compatible** — never break existing rules
- **Evidence-driven** — based on demonstrated engineering needs
- **Non-duplicative** — never repeat what already exists
- **Easy to understand** — reduce ambiguity, not increase complexity

Every governance addition should reduce ambiguity rather than increase complexity.

---

# 31. GOVERNANCE REVIEW RECORD

| Item | Value |
|---|---|
| Current Stable Baseline | Version 1.19.0 |
| Status | Stable |
| Last Major Governance Completion | Phase 1b Step 5B Execution (10 Execution Recommendations encoded — Inventory Freeze, Canonical First, Consumer Impact, Wrapper Preservation, Dependency Graph, Dead Component Register, Regression Baseline, Exception Register, Group Reports, Execution Rhythm) |

Future entries should append to this record whenever governance undergoes a
significant architectural evolution. This is NOT an implementation history —
it is a governance review history.

---

# 32. GOVERNANCE SUNSET POLICY

Governance is intended to remain current. If a governance rule becomes obsolete
because of architectural evolution, Foundation evolution, workflow replacement,
component removal, Design System simplification, or technology changes, then the
obsolete governance should be removed — not preserved indefinitely.

Historical removals should be recorded in the Governance Changelog (§36).

Governance should remain:

- **Concise** — no unnecessary words
- **Current** — no obsolete rules
- **Relevant** — every rule serves a purpose
- **Authoritative** — single source of truth

---

# 33. GOVERNANCE HEALTH REVIEW

Whenever governance is reviewed, verify:

- [ ] No duplicated governance
- [ ] No contradictory rules
- [ ] One canonical owner per topic
- [ ] Documentation hierarchy intact
- [ ] Governance reflects the current architecture
- [ ] Foundation Adoption Register is current
- [ ] Freeze Register contains history only
- [ ] Workflow matches implementation practice
- [ ] AI guidance remains accurate
- [ ] Obsolete guidance removed

---

# 34. GOVERNANCE QUALITY PRINCIPLE

Governance quality is measured by clarity, consistency, and maintainability —
not by document size. Adding governance is not automatically an improvement.
Removing obsolete governance is considered a governance improvement.

---

# 35. GOVERNANCE VERSION RULES

- **Patch (1.0.x):** editorial clarification only.
- **Minor (1.1.x):** new governance capability.
- **Major (2.0.0):** breaking governance rule.

# 36. GOVERNANCE CHANGELOG

## v1.0.0 — Initial Governance
- ✓ Foundation Freeze (Card DS-001, Button DS-002)
- ✓ Composite Freeze
- ✓ Design System Hierarchy
- ✓ Foundation Engineering Constitution
- ✓ Design System Change Control

## v1.1.0 — Menu/Dropdown System Freeze (DS-008B)
- ✓ Permanent Foundation Freeze — Menu/Dropdown System

## v1.2.0 — Navigation System Freeze (DS-009C)
- ✓ Permanent Foundation Freeze — Navigation System

## v1.3.0 — Navigation System Governance Finalization (DS-009B)
- ✓ Navigation System permanently frozen

## v1.4.0 — Foundation Extension (DS-010, DS-011, DS-012)
- ✓ Table/DataGrid System permanently frozen (DS-010)
- ✓ Tabs System permanently frozen (DS-011)
- ✓ Layout Primitives System permanently frozen (DS-012)

## v1.5.0 — Foundation Forms (DS-013)
- ✓ Foundation Forms created (Checkbox, Radio, RadioGroup, Switch)

## v1.6.0 — DS-013A RadioGroup Governance Enhancement
- ✓ RadioGroup ownership frozen

## v1.7.0 — DS-013B Foundation Forms Governance Unification
- ✓ Shared Forms ownership introduced
- ✓ Component-specific contracts reorganized

## v1.8.0 — DS-013C Foundation Governance Normalization
- ✓ Governance structure standardized across ALL Foundation Systems
- ✓ Shared hierarchy adopted (Contract → Ownership → Consumer → Protection → API → Verification → Component-Specific)
- ✓ Duplicate governance text removed (was: repeated protection/API/verification wording in every section)
- ✓ Identical Foundation Protection wording across all systems
- ✓ Identical API Evolution wording across all systems
- ✓ Identical Verification structure across all systems
- ✓ Component-specific contracts reorganized per system
- ✓ Future Foundation systems must follow this template
- ✓ Card and Button split into separate sections for clarity
- ✓ Table, Tabs, Layout Primitives elevated to permanent freeze sections
- ✓ NO runtime code modified — documentation normalization only

## v1.9.0 — Foundation Adoption Governance Finalization
- ✓ Foundation Adoption Principle introduced (bypass ≠ technical debt)
- ✓ Remaining Foundation Bypass Classification introduced (Categories A–D)
- ✓ Adoption Governance standardized (6 permanent rules)
- ✓ Technical debt classification clarified
- ✓ Section numbers rebalanced (§14 Adoption Principle, §15 Adoption Governance, §16 Version Rules, §17 Changelog)
- ✓ NO runtime code modified — documentation only

## v1.10.0 — Foundation Adoption Governance Completion
- ✓ Category E (Governance Violation) introduced
- ✓ Foundation Bypass Decision Flow introduced (deterministic classification process)
- ✓ Governance classification completed — every bypass must belong to exactly one category
- ✓ Category E violations are mandatory work items (migrate or reclassify with evidence)
- ✓ Unclassified bypasses are governance defects
- ✓ Section numbers rebalanced (§14 Principle, §15 Decision Flow, §16 Adoption Governance, §17 Version Rules, §18 Changelog)
- ✓ NO runtime code modified — documentation only

## v1.11.0 — Design System Documentation Authority
- ✓ Document Authority established for all 5 documentation files
- ✓ Governance Lifecycle introduced (9-step documentation workflow)
- ✓ Documentation Relationships defined (hierarchy + dependency graph)
- ✓ Document Change Policy defined (when each file may be updated)
- ✓ Document Versioning Principle documented (independent from application versions)
- ✓ Canonical ownership established (one owner per topic, no duplicates)
- ✓ Documentation hierarchy finalized
- ✓ NO runtime code modified — documentation only

## v1.12.0 — Documentation Baseline & Maintenance Policy
- ✓ Documentation baseline established (6-document stack permanently defined: AI_PROJECT_CONTEXT, PROJECT_ARCHITECTURE, FOUNDATION_GOVERNANCE, DESIGN_SYSTEM_WORKFLOW, FOUNDATION_FREEZE_REGISTER, SECURITY_BASELINE)
- ✓ Documentation index introduced (AI_PROJECT_CONTEXT.md)
- ✓ Document Maintenance Principle introduced (update existing, don't create new)
- ✓ Governance maturity recorded (v1.12.0+ = stable baseline)
- ✓ Freeze Register responsibility clarified (historical journal only)
- ✓ Documentation Maintenance Checklist introduced (5-question pre-modification check)
- ✓ Section numbering corrected and rebalanced (§13–§27)
- ✓ NO runtime code modified — documentation only

## v1.13.0 — Governance Stability & Review Policy
- ✓ Governance Stability established (v1.12.0+ = stable baseline)
- ✓ Governance Review Policy added (6 triggers for governance review)
- ✓ Governance Change Principles added (minimal, incremental, evidence-driven)
- ✓ Governance Review Record created (baseline tracking table)
- ✓ AI guidance updated (AI_PROJECT_CONTEXT.md)
- ✓ Section numbering rebalanced (§13–§31)
- ✓ NO runtime code modified — documentation only

## v1.14.0 — Governance Sunset & Health Policy
- ✓ Governance Sunset Policy introduced (remove obsolete rules, don't preserve indefinitely)
- ✓ Governance Health Review introduced (10-point verification checklist)
- ✓ Governance Quality Principle added (clarity > size; removing obsolete = improvement)
- ✓ AI Governance Maintenance guidance added (AI_PROJECT_CONTEXT.md)
- ✓ Governance simplification encouraged
- ✓ Section numbering rebalanced (§13–§34)
- ✓ NO runtime code modified — documentation only

## v1.15.0 — Spacing Token System & Design System Migration Lifecycle
- ✓ Spacing Token System (DS-014) permanently frozen — single-layer spacing tokens (`--space-0` … `--space-24`) as the only approved source of spacing values
- ✓ Framework independence established — Design System owns spacing values; Tailwind wiring is implementation, not token definition
- ✓ Only Approved Source rule added — reusable components must never introduce new spacing values outside the Design System
- ✓ Token Approval Policy added — new tokens only when existing cannot satisfy, value expected to be reused, and Design System approved
- ✓ Simplicity rule added — no primitive/semantic/alias spacing tokens, no multi-level spacing mapping (Pages → Reusable Components → Spacing Tokens)
- ✓ Design System Migration Lifecycle introduced — 8-step lifecycle (Audit → Token Design → Token Integration → Layout Primitive Migration → Reusable Component Migration → Repository Migration → Repository Certification → Legacy Cleanup) for every future Design System migration
- ✓ Certification clarified — repository certification requires visual AND architecture verification
- ✓ Section numbering rebalanced (§13–§36)
- ✓ NO runtime code modified — documentation only

## v1.16.0 — Layout Primitives Standard & Step 5 Governance
- ✓ Layout Primitives frozen as canonical foundation (DS-012): PageContainer, Stack, Grid, SectionBlock
- ✓ ContentContainer decision recorded — Option A adopted (not created unless repository-wide need demonstrated)
- ✓ Legacy layout components defined (SectionHeader, SectionWrapper, PageHeader) — excluded from silent Step 5 migration
- ✓ Compose, Don't Recreate rule added — reusable components must compose layout primitives, never recreate layout behavior
- ✓ Separation of Layout from UI made permanent (Layout primitives → Reusable UI components → Application pages)
- ✓ Off-Scale Legacy Values rule added (DS-014) — 10px/14px legacy values must follow the Token Approval Policy; no temporary tokens, no silent one-off replacements
- ✓ Step 5 Execution Governance added (§14) — scope control, dependency-order migration (Surface → Form → Action → Navigation → Feedback → Data), per-group certification checkpoints, repository simplicity preserved
- ✓ Section numbering unchanged (§11, §13, §14 amended; §15–§36 stable)
- ✓ NO runtime code modified — documentation only

## v1.17.0 — Step 5 Execution Governance Completion
- ✓ Step 5 scope frozen — only reusable UI components may be migrated; pages, layout primitives, feature/dashboard/exam/review work is deferred and documented, never absorbed
- ✓ Component Inventory required before ANY group migration (name, consumers, spacing usage, layout primitive usage, duplicates, hardcoded spacing, priority)
- ✓ Canonical Components rule added — single canonical implementation per duplicate set, with documented migration and removal strategy
- ✓ Public API Stability rule added — props/events/exports/behavior preserved; internal implementation may change; breaking changes require approval
- ✓ Composition Before Configuration added (§11 DS-012) — compose Stack/Grid/PageContainer/SectionBlock instead of adding spacing props
- ✓ Component-Level Documentation required after each migration (responsibilities, dependencies, consumed primitives/tokens, usage, limitations)
- ✓ Deprecation Policy added — replaced components marked deprecated + scheduled for removal, deleted only after repository migration completes
- ✓ Migration Metrics added (components completed, hardcoded spacing removed, token adoption, duplicates eliminated, visual/responsive regressions, etc.)
- ✓ Final Step 5 Certification checklist added (tokens, composition, duplicates, no new spacing systems, API stability, visual/responsive parity)
- ✓ Step 5 Discipline added — optimize for consistency/maintainability/stability, not speed; production-ready state after every phase
- ✓ Section numbering unchanged (§11, §14 amended; §15–§36 stable)
- ✓ NO runtime code modified — documentation only

## v1.18.0 — Step 5 Execution Governance Finalization
- ✓ Inventory Approval Gate added — complete component inventory (name, file location, consumers, spacing/layout usage, hardcoded spacing, duplicates, priority, canonical) must be reviewed and approved before ANY migration
- ✓ One Group at a Time rule added — never migrate multiple component groups simultaneously; each group completes Audit → Migration → Validation → Certification → Approval before the next begins
- ✓ Canonical Component First clarified — select and migrate the canonical implementation first, mark alternatives deprecated, update consumers during repository migration; only ONE active implementation maintained
- ✓ Small Migrations rule added — one component or closely related family per migration; no very large migration commits
- ✓ Behavioral Parity rule added — migration changes implementation, not behavior (interactions, keyboard, accessibility, loading/disabled states, responsive, visual); behavioral regressions are migration failures
- ✓ Documentation Immediately rule added — docs written right after each migration and never lagging behind implementation (responsibilities, public API, dependencies, tokens, primitives, deprecated replacements)
- ✓ Repository Health Checkpoints added — build/lint/typecheck/visual/responsive verified per group; unrelated pre-existing issues recorded separately
- ✓ Controlled Exceptions added — documented reason, temporary implementation, future phase, owner, and removal condition; undocumented exceptions prohibited
- ✓ Final Step 5 Approval criteria expanded — all groups completed, duplicates reduced, token adoption, primitive composition, no new spacing systems, public APIs preserved, visual/responsive parity
- ✓ Step 5 Foundation Freeze added — freeze spacing tokens, layout primitives, and reusable component architecture after certification; future work extends, not redesigns
- ✓ Section numbering unchanged (§14 amended; §15–§36 stable)
- ✓ NO runtime code modified — documentation only

## v1.19.0 — Step 5B Execution Recommendations
- ✓ Step 5A inventory approved — frozen as the Step 5B baseline (inventory freeze; new discoveries scheduled after current group, never absorbed)
- ✓ Canonical Component First rule added — migrate canonical → certify → dependent wrappers → consumers; never migrate deprecated before canonical
- ✓ Consumer Impact Analysis added — impact report (count, categories, API/customization patterns, regression points) required before modifying high-consumer components
- ✓ Wrapper Preservation rule added — wrappers stay thin (compose canonical, simplify usage, preserve APIs); never competing implementations
- ✓ Component Dependency Graph added — Component → Depends on → Used by documented before each group; no migration over unstable dependencies
- ✓ Dead Component Register added — dead components registered (component, reason, consumer count, removal phase); NOT deleted during Step 5
- ✓ Regression Baseline added — screenshots/responsive/interaction/accessibility baseline captured before each group; baseline = certification reference
- ✓ Exception Register added — component, reason, temporary solution, target resolution phase, approval reference; every exception traceable
- ✓ Group Completion Report added — each group reports summary, migrated components, duplicate reductions, token/layout adoption, parity verification, remaining work
- ✓ Stable Execution Rhythm added — Inventory → Migration → Validation → Certification → Approval → Next Group; never overlap groups
- ✓ Section numbering unchanged (§14 amended; §15–§36 stable)
- ✓ NO runtime code modified — documentation only

## v1.20.0 — Step 6 Execution Governance (Repository-Wide Adoption)
- ✓ Step 5 certified + approved — Foundation FROZEN (repo v2.0.0); canonical components: Typography, Spacing Tokens, Layout Primitives, Surface, Form, Action, Navigation, Feedback
- ✓ Step 6 scope defined — repository-wide adoption across User Panel, Examination, Sub Admin, Admin; NOT a redesign phase
- ✓ 6A-1 Certified Foundation Freeze — Step 6 changes consumers, never the foundation
- ✓ 6A-2 Golden Reference — User Panel wins on any conflict
- ✓ 6A-3 Repository Scope — audit every page: custom UI, duplicates, bespoke layouts, direct Tailwind bypasses
- ✓ 6A-4 Consumer Audit — current components → canonical mapping per page
- ✓ 6A-5 Migration Rules — never redesign; replace only implementation
- ✓ 6A-6 Adoption Requirements — certified primitives + tokens only; no new scales/colors
- ✓ 6B-1 Duplicate Reduction — duplicate → canonical → consumer count → impact; remove after migration
- ✓ 6B-2 Dead Code — Dead Component Register; no removal until zero consumers
- ✓ 6B-3 Accessibility & Responsive — no regressions; XS–XL verified
- ✓ 6B-4 Performance — no unnecessary renders/providers
- ✓ 6B-5 Documentation — Execution Log, Consumer Migration Report, Dead Component Register, Exception Register, Duplicate Reduction Report per group
- ✓ 6B-6 Validation — build + tsc + lint + responsive + a11y per group
- ✓ 6B-7 Out of Scope — Button Standardization, new animations/themes/colors/scales deferred
- ✓ 6B-8 Completion Criteria — full repository adoption, builds, zero TS errors, docs complete
- ✓ 6B-9 Stable Execution Rhythm — Audit → Plan → Migrate → Validate → Certify → Approval → Next
- ✓ Section numbering unchanged (§14 amended; §15–§36 stable)
- ✓ NO runtime code modified — documentation only

## v1.21.0 — Phase 5.4A Surface & Elevation Ladders (Foundation Evolution)
- ✓ Surface Hierarchy L0–L6 added to §4 (PERMANENT) — canonical surface levels, tokens, and rules; no component may define its own surface color; no new surface levels without a D-series decision
- ✓ Elevation Hierarchy E0–E3 added to §4 (PERMANENT) — `--elevation-0: none` is the canonical flat level; components consume only `--elevation-0/1/2/3`; no hardcoded shadows
- ✓ Management relight values recorded as the certified light-theme baseline (`#FCFCFD`/`#F6F8FA`/`#EDF1F5`); dark mode byte-identical
- ✓ Frozen premium materials (D-141 carved shadow, `--material-button-*`, `.ancient-*`, `--elevation-carved`) remain family materials, not elevation choices
- ✓ Section numbering unchanged (§4 amended; §5–§36 stable)
- ✓ Foundation files only — `themes.css` (relight values + `--elevation-0`) and `index.css` (`@theme` registration); NO component/page/consumer changes

Status: ACTIVE

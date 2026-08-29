/* ─── ONE Motion & Interaction Language ───────────────────────────────────────
   Single source of truth for ALL motion in the application.

   Architecture:
     Durations: fast 150ms / normal 200ms / slow 300ms / very-slow 500ms.
     Easings: ONE system — standard / enter / exit / emphasized.
     Interaction model: ONE hover per element kind, ONE focus ring, ONE tap language.

   CSS consumes the SAME tokens via themes.css (:root primitives) +
   index.css @theme (duration-*, ease-*, transition-* utilities).
   The numeric values here MIRROR the CSS tokens (in seconds).

   RULE: Same semantic element → same motion recipe everywhere.
   No page-level overrides. No copy-pasted values. No duplicate definitions.
--------------------------------------------------------------------------- */

/* ═══ DURATION TOKENS ═══════════════════════════════════════════════════════
 * DESIGN ROLE: Universal duration scale.
 * USE FOR: All timing in the application — CSS and framer-motion.
 * DO NOT USE FOR: Raw numeric durations (0.15, 0.2, 0.3).
 * CONSISTENCY RULE: All durations must reference these tokens.
 */
export const MOTION_DURATION = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  verySlow: 0.5,
} as const

/* ═══ EASING TOKENS ═════════════════════════════════════════════════════════
 * DESIGN ROLE: Universal easing scale.
 * USE FOR: All cubic-bezier curves in the application.
 * DO NOT USE FOR: Inline ease-[...] values.
 * CONSISTENCY RULE: All easings must reference these tokens.
 */
export const MOTION_EASE = {
  standard: [0.25, 0.1, 0.25, 1] as const,
  enter: [0.16, 1, 0.3, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
  emphasized: [0.175, 0.885, 0.32, 1.275] as const,
} as const

/* ═══ PAGE TRANSITION ═══════════════════════════════════════════════════════
 * DESIGN ROLE: Full page entrance animation.
 * USE FOR: PageTransition wrapper, top-level route changes.
 * DO NOT USE FOR: Section reveals, modal open/close, content transitions.
 * CONSISTENCY RULE: All page entrances use this same timing.
 */
export const PAGE_TRANSITION = {
  duration: MOTION_DURATION.slow,
  ease: MOTION_EASE.standard,
} as const

/* ═══ SECTION REVEAL ════════════════════════════════════════════════════════
 * DESIGN ROLE: Section/content entrance within a page.
 * USE FOR: SectionReveal wrapper, content panels appearing on load.
 * DO NOT USE FOR: Page transitions, modal open/close, menu animations.
 * CONSISTENCY RULE: All section entrances use this same timing.
 */
export const SECTION_REVEAL = {
  duration: MOTION_DURATION.normal,
  ease: MOTION_EASE.standard,
} as const

/* ═══ MENU TRANSITION ═══════════════════════════════════════════════════════
 * DESIGN ROLE: Dropdown/tooltip/menu open animation.
 * USE FOR: Menu, tooltips, context menus, dropdowns.
 * DO NOT USE FOR: Modals, select popups, page transitions.
 * CONSISTENCY RULE: All menu/tooltip opens use this same timing.
 */
export const MENU_TRANSITION = {
  duration: MOTION_DURATION.fast,
  ease: MOTION_EASE.standard,
} as const

/* ═══ SELECT POPUP TRANSITION ═══════════════════════════════════════════════
 * DESIGN ROLE: Select/popup open animation (spring-forward enter curve).
 * USE FOR: PremiumSelect dropdown, select popups.
 * DO NOT USE FOR: Menus, modals, tooltips.
 * CONSISTENCY RULE: All select popup opens use this same timing.
 */
export const SELECT_POPUP_TRANSITION = {
  duration: MOTION_DURATION.fast,
  ease: MOTION_EASE.enter,
} as const

/* ═══ MODAL TRANSITION ══════════════════════════════════════════════════════
 * DESIGN ROLE: Modal open/close animation.
 * USE FOR: AdminModal, AddExamModal, LanguageSelectionScreen overlay.
 * DO NOT USE FOR: Menus, tooltips, page transitions.
 * CONSISTENCY RULE: All modal open/close uses this same timing.
 */
export const MODAL_TRANSITION = {
  duration: MOTION_DURATION.normal,
  ease: MOTION_EASE.standard,
} as const

/* ═══ TAB SPRING ════════════════════════════════════════════════════════════
 * DESIGN ROLE: Shared filter/tab/segment selection animation.
 * USE FOR: Semantically equivalent tabs, segmented filters, configuration
 *          pills (layoutId spring for active pill indicator movement).
 * DO NOT USE FOR: Toggles, drawers, expandable rows, page transitions.
 * CONSISTENCY RULE: All tab/segment pill selection uses this same spring.
 */
export const TAB_SPRING = {
  type: 'spring',
  stiffness: 260,
  damping: 32,
  mass: 1.1,
} as const

/* ═══ TOGGLE SPRING ═════════════════════════════════════════════════════════
 * DESIGN ROLE: Toggle-thumb slide animation.
 * USE FOR: ThemeToggle thumb x-translation between light/dark positions.
 * DO NOT USE FOR: Tabs, drawers, page transitions, other toggles.
 * CONSISTENCY RULE: All toggle thumb slides use this same spring.
 */
export const TOGGLE_SPRING = {
  type: 'spring',
  stiffness: 260,
  damping: 28,
  mass: 1,
} as const

/* ═══ DRAWER SPRING ═════════════════════════════════════════════════════════
 * DESIGN ROLE: Mobile drawer slide animation.
 * USE FOR: SidebarLayout mobile drawer open/close.
 * DO NOT USE FOR: Tabs, toggles, page transitions.
 * CONSISTENCY RULE: All mobile drawer slides use this same spring.
 */
export const DRAWER_SPRING = {
  type: 'spring',
  stiffness: 220,
  damping: 25,
} as const

/* ═══ TRANSITION INTERACTION ════════════════════════════════════════════════
 * DESIGN ROLE: Base transition set for ghost/soft interactive elements.
 * USE FOR: Ghost buttons, soft controls, text-only actions.
 * DO NOT USE FOR: Material buttons, cards, rows (use their own hover).
 * CONSISTENCY RULE: All ghost/soft elements use this same transition base.
 */
export const TRANSITION_INTERACTION =
  'transition-interaction duration-fast ease-standard'

/* ═══ FOCUS RING ════════════════════════════════════════════════════════════
 * DESIGN ROLE: Single application-wide keyboard focus indicator (WCAG 2.4.7).
 * USE FOR: All keyboard-focusable interactive elements (buttons, tabs,
 *          segments, toggles, nav rows, menu rows, pagination).
 * DO NOT USE FOR: Input-role fields (they use border-focus language).
 * CONSISTENCY RULE: ONE focus ring spec across the entire application.
 */
export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2'

/* ═══ CURSOR NOT ALLOWED ════════════════════════════════════════════════════
 * DESIGN ROLE: Disabled/loading cursor state.
 * USE FOR: All disabled interactive elements.
 * CONSISTENCY RULE: All disabled states use this cursor.
 */
export const CURSOR_NOT_ALLOWED = 'cursor-not-allowed'

/* ═══ HOVER LANGUAGE ════════════════════════════════════════════════════════
   One hover effect per element kind, app-wide — no per-component overrides.

   CARD_HOVER   → cards & containers   : lift -translate-y-1 + 3D shadow
   ROW_HOVER    → rows/list/table rows : lift -translate-y-0.5 + 3D shadow
   BUTTON_HOVER → material buttons     : lift -translate-y-0.5 + 3D shadow
   GHOST_HOVER  → ghost/soft buttons   : bg/color only — NO lift, NO shadow
--------------------------------------------------------------------------- */

/* ═══ CARD HOVER ════════════════════════════════════════════════════════════
 * DESIGN ROLE: Standard interactive card motion.
 * USE FOR: Cards and card-like content containers (Card, StatCard, ExamCard,
 *          AttemptCard, dashboard cards, collection cards).
 * DO NOT USE FOR: Standard list rows, inputs, text, tabs, buttons.
 * CONSISTENCY RULE: All card-shaped elements with hover use this same recipe.
 */
export const CARD_HOVER =
  'transition-card-3d duration-fast ease-standard hover:-translate-y-1 hover:shadow-card-hover-3d'

/* ═══ ROW HOVER ═════════════════════════════════════════════════════════════
 * DESIGN ROLE: Standard floating/repeated list-item motion.
 * USE FOR: Leaderboard rows, student rows, sub-admin rows, notification
 *          rows, table/list rows, repeated configuration rows.
 * DO NOT USE FOR: Large content cards (use CARD_HOVER).
 * CONSISTENCY RULE: All repeated list items use this same lighter hover.
 */
export const ROW_HOVER =
  'transition-card-3d duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-card-hover-3d'

/* ═══ GOLD LIGHT MATERIAL ═══════════════════════════════════════════════════
 * DESIGN ROLE: Light-mode gold surface recipe.
 * USE FOR: Cards, containers, and card-shaped placeholders in light mode.
 * DO NOT USE FOR: Dark mode surfaces, ghost elements, inputs.
 * CONSISTENCY RULE: All light-mode premium surfaces use this same recipe.
 */
export const GOLD_LIGHT_MATERIAL =
  'light:stat-card-surface light:shadow-premium-card light:border-card-premium-border'

/* ═══ BUTTON HOVER ══════════════════════════════════════════════════════════
 * DESIGN ROLE: Standard material button interaction.
 * USE FOR: All material buttons application-wide (primary, secondary, success,
 *          danger, material CTA, material icon buttons with surface).
 * DO NOT USE FOR: Ghost/soft controls, cards, rows, inputs.
 * CONSISTENCY RULE: All material buttons use this same hover — colors may
 *                   differ, motion must not.
 */
export const BUTTON_HOVER =
  'transition-card-3d duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-card-hover-3d'

/* ═══ GHOST HOVER ═══════════════════════════════════════════════════════════
 * DESIGN ROLE: Ghost/soft/text-only button interaction.
 * USE FOR: Ghost buttons, soft controls, text-only actions, toggle pills
 *          without material surface.
 * DO NOT USE FOR: Material buttons with solid background, cards, rows.
 * CONSISTENCY RULE: All ghost/soft elements use this same lift-free hover.
 */
export const GHOST_HOVER = TRANSITION_INTERACTION

/* ═══ BUTTON TAP ════════════════════════════════════════════════════════════
 * DESIGN ROLE: Button tap/press behavior.
 * USE FOR: Documenting that buttons carry NO whileHover/whileTap scale.
 *          The CSS hover lift (BUTTON_HOVER) is the contract.
 * NOTE: This is an empty preset — the absence is the specification.
 */
export const BUTTON_TAP = {}

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Typography } from './Typography'
import { Spinner } from './Spinner'
import { FOCUS_RING, BUTTON_HOVER } from './AntigravityMotion'

/* ─── Phase 5.4D Foundation Pill/Badge (single primitive) ───────────────────
   ONE Pill component owns the entire pill/badge visual language: radius,
   padding, typography, spacing, border, elevation (flat by default), hover,
   focus, active, disabled, loading, transitions, and semantic colors.

   Every badge/pill in the application is a thin role wrapper over this
   component — Badge, DifficultyBadge, StatusBadge, CounterBadge, FilterPill,
   SelectionPill, NavigationPill, TagBadge, and the future Exam/Subject/Category
   pills. No duplicate rendering systems exist.

   Typography: the text layer renders through the certified Typography
   Foundation (role="badge": uppercase, 700 weight, 0.05em tracking, the
   --text-badge tier) with `font-size: inherit` so the container's certified
   size recipes (identical to the pre-5.4D Badge recipes) keep driving the
   rendered size. Pill NEVER bypasses Typography and defines no custom type.

   Colors: semantic tokens only (--color-success/warning/danger/info/accent/
   secondary + the neutral border language --border-subtle). No palette
   classes, no hardcoded amber, no hex.

   LIGHT MODE BADGE RULE:
   Semantic badge variants (success/danger/warning/info) render with:
     - white background (--badge-light-bg)
     - full-opacity semantic text color
     - full-opacity semantic border color
   Dark mode retains the existing translucent semantic treatment.

   Examples:
     success → white bg + green text + green border
     danger  → white bg + red text + red border
     warning → white bg + yellow text + yellow border
     info    → white bg + blue text + blue border
--------------------------------------------------------------------------- */

export type PillRole =
  | 'status'
  | 'difficulty'
  | 'counter'
  | 'notification'
  | 'selection'
  | 'navigation'
  | 'filter'
  | 'exam'
  | 'subject'
  | 'information'
  | 'category'
  | 'tag'

export type PillVariant =
  | 'default'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  | 'secondary'
  | 'outline'

export type PillSize = 'xs' | 'sm' | 'md' | 'lg'

export type PillState = 'default' | 'selected' | 'active' | 'inactive' | 'disabled' | 'loading'

export interface PillProps {
  /** Semantic meaning of the pill (exactly one owner per role). */
  role?: PillRole
  /** Semantic color material (ignored when a color-bearing state is set). */
  variant?: PillVariant
  /** ONE radius/padding/typography scale (XS/SM/MD/LG). */
  size?: PillSize
  /** Visual state. Hover/Pressed/Focus are CSS pseudo-states, not props. */
  state?: PillState
  /** Interactive pills render a real <button> (keyboard focus + visible ring). */
  as?: 'div' | 'button'
  /** Inline pill (display:inline-flex) for flowing text / flex-wrap rows. */
  inline?: boolean
  icon?: LucideIcon
  /** Pulsing live indicator (e.g. live/active status). */
  pulse?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  ariaLabel?: string
  /** Toggle pill (FilterPill/SelectionPill) — aria-pressed. */
  ariaPressed?: boolean
  /** Navigation pill — aria-current="page". */
  ariaCurrent?: boolean
  /** Fully curved (pill) radius — overrides the size's certified radius with
   *  the reusable `rounded-full` pill language. Default `false` keeps the
   *  certified size radius (md = rounded-button-md). */
  curved?: boolean
  title?: string
  className?: string
  children: ReactNode
}

/* One radius language, one padding system, one type scale. The XS/MD recipes
   reproduce the pre-5.4D certified Badge renders exactly (DS-005): md was
   h-7 px-3 rounded-button-md text-[10px], sm was h-5 px-2.5 rounded-full
   text-[9px]. Consumers never define radius/padding/type — the optional
   `curved` prop is the ONE sanctioned way to switch a pill to the fully
   curved `rounded-full` language. */
const PILL_SIZE_LAYOUT: Record<PillSize, string> = {
  xs: 'h-5 px-2 text-[9px] tracking-wider',
  sm: 'h-5 px-2.5 text-[9px] tracking-wider',
  md: 'h-7 px-3 text-[10px] tracking-wider',
  lg: 'h-8 px-4 text-[11px] tracking-wider',
}

const PILL_SIZE_RADIUS: Record<PillSize, string> = {
  xs: 'rounded-full',
  sm: 'rounded-full',
  md: 'rounded-button-md',
  lg: 'rounded-full',
}

/* Semantic color material. Flat by default (elevation is opt-in only).
   default/neutral = the neutral border language (--border-subtle);
   status = --color-* tokens; outline = the neutral border language on a
   transparent surface (inactive pills).

   Light Mode: semantic variants (success/danger/warning/info) use white
   background with full-opacity text+border for maximum readability.
   Dark Mode: translucent semantic backgrounds (bg-success/15 etc.) are retained. */
const PILL_VARIANTS: Record<PillVariant, string> = {
  default: 'bg-hover-bg text-text-secondary border-border-subtle light:bg-white',
  neutral: 'bg-hover-bg text-text-secondary border-border-subtle light:bg-white',
  success: 'bg-success/15 text-success border-success/30 light:bg-[var(--badge-light-bg)] light:text-success light:border-success',
  warning: 'bg-warning/15 text-warning border-warning/30 light:bg-[var(--badge-light-bg)] light:text-warning light:border-warning',
  danger: 'bg-danger/15 text-danger border-danger/30 light:bg-[var(--badge-light-bg)] light:text-danger light:border-danger',
  info: 'bg-info/15 text-info border-info/30 light:bg-white light:text-info light:border-info',
  primary: 'bg-primary/15 text-primary border-primary/30 light:bg-white',
  secondary: 'bg-secondary/15 text-secondary border-secondary/30 light:bg-white',
  outline: 'bg-transparent text-text-secondary border-border-subtle light:bg-white',
}

/* State material REPLACES the variant material (never stacks conflicting
   color utilities). selected = the Management Surface selection language
   (5.4A --management-surface-active + --management-accent) — the same premium
   selection used by Menu rows; active = solid on-state (global bg-primary);
   inactive = the neutral border language; disabled = neutral + opacity;
   loading keeps the variant + spinner. */
const PILL_STATES: Record<PillState, string | null> = {
  default: null,
  selected: 'bg-[var(--management-surface-active)] text-[var(--management-accent)] border-[var(--management-border-active)]',
  active: 'bg-primary text-white border-primary',
  inactive: 'bg-transparent text-text-secondary border-border-subtle',
  disabled: 'bg-hover-bg text-text-secondary border-border-subtle opacity-40 cursor-not-allowed pointer-events-none',
  loading: null,
}

/* Interactive pills that carry an explicit material (a solid active pill, a
   semantic clickable pill) hover with the ONE button hover (3D-block lift) plus
   an accent border refinement — no framer-motion scale. */
const INTERACTIVE_CLASSES =
  `${BUTTON_HOVER} ${FOCUS_RING} ` +
  'cursor-pointer select-none ' +
  'hover:border-primary/50 active:brightness-95 light:hover:bg-white'

/* Toggle pills (filter/selection/navigation chips): neutral border language at
   rest, Management Surface fill + border on hover (5.4A --management-surface-
   hover / --management-border-hover) riding the ONE button 3D-block hover. */
const TOGGLE_CLASSES =
  `${BUTTON_HOVER} ${FOCUS_RING} ` +
  'cursor-pointer select-none ' +
  'hover:bg-[var(--management-surface-hover)] hover:border-[var(--management-border-hover)] active:brightness-95 light:hover:bg-white'

export function Pill({
  role = 'information',
  variant = 'default',
  size = 'md',
  state,
  as = 'div',
  inline = false,
  icon: Icon,
  pulse = false,
  disabled = false,
  loading = false,
  onClick,
  ariaLabel,
  ariaPressed,
  ariaCurrent,
  curved = false,
  title,
  className = '',
  children,
}: PillProps) {
  const resolvedState: PillState = disabled ? 'disabled' : loading ? 'loading' : (state ?? 'default')
  const isButton = as === 'button'
  /* Interactive pills at rest default to the neutral border language (the
     "inactive pill") unless the wrapper supplies an explicit variant/state. */
  const isToggle = isButton && state === undefined && !loading
  const material = PILL_STATES[resolvedState] ?? (isToggle ? PILL_STATES.inactive : PILL_VARIANTS[variant])
  const Tag: 'div' | 'button' = as
  const interactive = isButton ? (isToggle || resolvedState === 'selected' ? TOGGLE_CLASSES : INTERACTIVE_CLASSES) : ''
  const radiusCls = curved ? 'rounded-full' : PILL_SIZE_RADIUS[size]

  return (
    <Tag
      data-role={role}
      type={isButton ? 'button' : undefined}
      disabled={isButton ? resolvedState === 'disabled' : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isButton && ariaPressed !== undefined ? ariaPressed : undefined}
      aria-current={isButton && ariaCurrent ? 'page' : undefined}
      aria-busy={isButton && resolvedState === 'loading' ? true : undefined}
      title={title}
      className={[
        PILL_SIZE_LAYOUT[size],
        radiusCls,
        `font-bold uppercase border ${inline ? 'inline-flex' : 'flex'} items-center gap-1.5 w-fit`,
        material,
        pulse ? 'animate-pulse' : '',
        interactive,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {resolvedState === 'loading' ? (
        <Spinner size="sm" variant="current" />
      ) : (
        <>
          {Icon && <Icon size={12} />}
          <Typography role="badge" color="inherit" style={{ fontSize: 'inherit' }}>
            {children}
          </Typography>
        </>
      )}
    </Tag>
  )
}

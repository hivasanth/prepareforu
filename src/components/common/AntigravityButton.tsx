import React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { Spinner } from './Spinner'
import { FOCUS_RING, BUTTON_HOVER, GHOST_HOVER } from './AntigravityMotion'

/* ─── Button Component ─────────────────────────────────────────────────────
 * Design role:
 *   Primary interactive action element for all user-initiated actions.
 *
 * Variants:
 *   primary   — Forest gradient (light) / Blue accent (dark) — main CTA
 *   secondary — Neutral elevated surface — secondary actions
 *   success   — Green — positive confirmation actions
 *   danger    — Red — destructive/deletion actions
 *   soft      — Transparent primary tint — subtle actions
 *   ghost     — Transparent — minimal visual weight actions
 *
 * Sizes: xs / sm / md / lg / xl (fixed height + padding + radius)
 *
 * Interaction model:
 *   Hover: BUTTON_HOVER (3D-block lift + shadow) for material buttons
 *          GHOST_HOVER (surface/color only) for ghost/soft buttons
 *   Focus: FOCUS_RING (2px ring-primary/50 offset-2)
 *   Press: active:brightness-95 (CSS-only, no framer-motion scale)
 *   Disabled: opacity-50 + cursor-not-allowed
 *   Loading: Spinner + aria-busy
 *
 * Use for:
 *   - Form submission
 *   - Action triggers (create, delete, save, retry)
 *   - Navigation CTAs
 *   - Modal confirm/cancel
 *
 * Do not use for:
 *   - Selection/filter pills (use Pill or SegmentedFilter)
 *   - Navigation links (use Navigation component)
 *   - Display-only elements
 *
 * Theme: Light + Dark (theme-aware via useTheme)
 * Consumers: 30+ files across all layers
 * ────────────────────────────────────────────────────────────────────────── */

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends HTMLMotionProps<'button'> {
  /** Override the framer-motion children type (which includes MotionValue)
   *  back to a plain ReactNode so React children type-check cleanly. */
  children?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'soft' | 'ghost'
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  /** Fully curved (pill) radius — overrides the size's certified radius with the
   *  reusable `rounded-full` language. */
  curved?: boolean
  /** Phase 3.9 (D-144) — additive Management Surface Family opt-in. When true and
   *  `variant` is `primary`/`secondary`, renders the neutral management material
   *  (no amber/gold). Other variants are unaffected. Default render is unchanged. */
  management?: boolean
}

/* Phase 5.4E (D-169) — ONE button interaction model. Every Button uses the SAME
   transition set, pressed (active:brightness-95), focus (FOCUS_RING) and
   disabled/loading language (opacity + cursor-not-allowed + pointer-events-none).
   Hover is ONE language: material buttons lift with BUTTON_HOVER (the 3D-block
   hover + per-variant surface tint); ghost/soft text buttons use GHOST_HOVER
   (surface/color tint only — no lift, no shadow). Variants differ ONLY in which
   surface/color tokens they consume. No framer-motion scale/lift on hover. */
const base =
  `uppercase flex items-center justify-center`

/* Shared disabled/loading treatment for Button and IconButton (P1 A-5 L-1). */
const getDisabledCls = (disabled: boolean | undefined, loading: boolean, opacity: 30 | 50 = 50) =>
  disabled || loading
    ? `${opacity === 30 ? 'opacity-30' : 'opacity-50'} cursor-not-allowed pointer-events-none`
    : ''

/* Authoritative disabled state for Button/IconButton: a button is disabled when
   it is either explicitly disabled OR currently loading. This is forwarded to
   the native <button disabled> so the DOM exposes the true semantic state —
   loading is never just a visual overlay. */
const effectiveDisabled = (disabled: boolean | undefined, loading: boolean) => !!(disabled || loading)

/* Foundation owns height, horizontal padding, font weight/size, tracking, icon gap, radius per size */
const sizeVariants: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-[10px] gap-1.5 font-bold tracking-wider',
  sm: 'h-9 px-4 text-xs gap-1.5 font-bold tracking-wider',
  md: 'h-[48px] px-6 text-[13px] gap-2 font-bold tracking-wider',
  lg: 'h-[48px] px-8 text-[14px] gap-2 font-bold tracking-wider',
  xl: 'h-14 px-10 text-[15px] gap-2 font-bold tracking-wider',
}

/* Certified per-size radius. `curved` swaps in the fully-rounded pill radius. */
const sizeRadii: Record<ButtonSize, string> = {
  xs: 'rounded-button-xs',
  sm: 'rounded-button-sm',
  md: 'rounded-button-md',
  lg: 'rounded-button-md',
  xl: 'rounded-button-xl',
}

/* Premium Light Mode — forest/parchment material implemented directly via tokens */
const lightVariants = {
  primary:
    'bg-[image:var(--material-button-primary-surface)] text-[var(--material-button-primary-text)] ' +
    'border-[var(--border-premium-width)] border-[var(--material-button-primary-border)] ' +
    `shadow-[var(--material-button-primary-shadow)] ${BUTTON_HOVER} active:brightness-95`,
  secondary:
    'bg-button-surface-secondary text-button-text-secondary border-[var(--border-premium-width)] border-button-border-secondary ' +
    `shadow-button-secondary ${BUTTON_HOVER} hover:bg-button-surface-secondary-hover active:brightness-95`,
  success:
    `bg-success text-white border border-transparent shadow-elevation-2 shadow-success/20 ${BUTTON_HOVER} active:brightness-95`,
  danger:
    `bg-danger text-white border border-transparent shadow-elevation-2 shadow-danger/20 ${BUTTON_HOVER} active:brightness-95`,
  soft:
    `bg-primary/10 text-primary border border-primary/20 ${GHOST_HOVER} hover:bg-primary/20 active:brightness-95`,
  ghost:
    `bg-button-surface-ghost text-button-text-ghost border border-button-border-ghost shadow-none ${GHOST_HOVER} hover:bg-button-surface-ghost-hover hover:text-button-text-ghost-hover active:brightness-95`,
}

/* Dark Mode — unchanged visual language (blue accent primary).
   D-123: dark is the app baseline (:root); these strings render only when the
   app is in dark mode (React branch), so `dark:` prefixes are removed — the app
   theme, not the OS prefers-color-scheme, must control Foundation styling. */
const darkVariants = {
  primary:
    `bg-primary text-white border-transparent shadow-elevation-2 shadow-primary/20 ${BUTTON_HOVER} active:brightness-95`,
  secondary:
    'bg-button-surface-secondary text-button-text-secondary border border-button-border-secondary ' +
    `shadow-button-secondary ${BUTTON_HOVER} hover:bg-button-surface-secondary-hover active:brightness-95`,
  success:
    `bg-success text-white border-transparent shadow-elevation-2 shadow-success/20 ${BUTTON_HOVER} active:brightness-95`,
  danger:
    `bg-danger text-white border-transparent shadow-elevation-2 shadow-danger/20 ${BUTTON_HOVER} active:brightness-95`,
  soft:
    `bg-primary/10 text-primary border border-primary/20 ${GHOST_HOVER} hover:bg-primary/20 active:brightness-95`,
  ghost:
    `bg-button-surface-ghost text-button-text-ghost border border-button-border-ghost shadow-none ${GHOST_HOVER} hover:bg-button-surface-ghost-hover hover:text-button-text-ghost-hover active:brightness-95`,
}

/* Management Surface Family (Phase 3.9 — D-144). Theme-independent neutral
   material — same family in light and dark. Consumes ONLY the --management-*
   namespace (accent follows var(--management-accent) = the app accent).
   Status variants (success/danger) and soft/ghost/auth stay with their theme
   variants. No amber/gold anywhere in this namespace. */
const managementVariants: Partial<Record<NonNullable<ButtonProps['variant']>, string>> = {
  primary:
    `bg-[var(--management-accent)] text-white border border-transparent shadow-[var(--management-shadow)] ${BUTTON_HOVER} active:brightness-95`,
  secondary:
    `bg-[var(--management-surface-muted)] text-text-primary border-[var(--border-premium-width)] border-[var(--management-border-strong)] shadow-[var(--management-shadow)] ${BUTTON_HOVER} hover:bg-[var(--management-surface-hover)] active:brightness-95`,
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  curved = false,
  management = false,
  className = '',
  ...props
}) => {
  const { isDark } = useTheme()
  const disabledCls = getDisabledCls(disabled, loading)
  const widthCls = fullWidth ? 'w-full' : ''
  const sizeCls = `${sizeVariants[size]} ${curved ? 'rounded-full' : sizeRadii[size]}`
  const resolvedLight = management ? (managementVariants[variant] ?? lightVariants[variant]) : lightVariants[variant]
  const resolvedDark = management ? (managementVariants[variant] ?? darkVariants[variant]) : darkVariants[variant]

  if (!isDark) {
    return (
      <motion.button
        aria-busy={loading || undefined}
        className={`${base} ${sizeCls} ${resolvedLight} ${widthCls} ${disabledCls} ${FOCUS_RING} ${className}`}
        {...props}
        disabled={effectiveDisabled(disabled, loading) || undefined}
      >
        {loading ? (
          <>
            <span className="sr-only">{children}</span>
            <Spinner size="sm" variant="current" />
          </>
        ) : (
          children
        )}
      </motion.button>
    )
  }

  return (
    <motion.button
      aria-busy={loading || undefined}
      className={`${base} ${sizeCls} ${resolvedDark} ${widthCls} ${disabledCls} ${FOCUS_RING} ${className}`}
      {...props}
      disabled={effectiveDisabled(disabled, loading) || undefined}
    >
      {loading ? (
        <>
          <span className="sr-only">{children}</span>
          <Spinner size="sm" variant="current" />
        </>
      ) : (
        children
      )}
    </motion.button>
  )
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <Button
      size="lg"
      className={`w-full sm:w-auto sm:min-w-[320px] md:min-w-[400px] lg:min-w-[480px] max-w-full ${className}`}
      {...props}
    >
      {children}
    </Button>
  )
}

interface IconButtonProps extends HTMLMotionProps<'button'> {
  loading?: boolean
  size?: 'sm' | 'md'
  variant?: 'primary' | 'ghost' | 'danger' | 'danger-soft' | 'theme' | 'action'
  /** Semantic intent for action variant — determines icon hover color. */
  intent?: 'view' | 'edit' | 'delete'
  /* Additive a11y capability — ONE visible focus ring (FOCUS_RING). Defaults on
     so every icon button participates in the unified focus language. */
  focusRing?: boolean
  /* Additive — disabled opacity level; default preserves existing 50 */
  disabledOpacity?: 30 | 50
}

/* Icon button variants — shares BUTTON_HOVER/GHOST_HOVER/FOCUS_RING with Button.
   danger-soft: ghost language with danger text on hover.
   theme: premium theme-toggle material with light/dark branches. */
const iconVariants = {
  primary: `bg-primary/10 text-primary ${BUTTON_HOVER} hover:bg-primary hover:text-white active:brightness-95 light:bg-white`,
  ghost: `bg-button-surface-ghost text-button-text-ghost ${GHOST_HOVER} hover:bg-button-surface-ghost-hover hover:text-button-text-ghost-hover active:brightness-95 light:bg-white light:hover:bg-white`,
  danger: `bg-danger/10 text-danger ${BUTTON_HOVER} hover:bg-danger hover:text-white active:brightness-95 light:bg-white`,
  'danger-soft': `bg-primary/10 text-danger ${GHOST_HOVER} hover:bg-danger/10 hover:text-danger active:brightness-95 light:bg-white`,
  theme: `selection-surface border-[var(--border-premium-width)] border-button-border-secondary appearance-none ${BUTTON_HOVER} active:brightness-95 light:bg-white light:hover:bg-white`,
  action: `bg-button-surface-action text-button-text-action border border-button-border-action ${GHOST_HOVER} hover:bg-button-surface-action-hover active:brightness-95 light:bg-white`,
}

/* Action intent hover colors — tinted background + semantic text on hover. */
const ACTION_INTENT_HOVER: Record<string, string> = {
  view: 'hover:text-info hover:bg-info/10',
  edit: 'hover:text-success hover:bg-success/10',
  delete: 'hover:text-danger hover:bg-danger/10',
}

const themeVariantCls = (isDark: boolean) =>
  isDark
    ? `selection-surface appearance-none bg-hover-bg/60 border border-border-subtle ${BUTTON_HOVER} active:brightness-95`
    : `selection-surface border-[var(--border-premium-width)] border-button-border-secondary appearance-none ${BUTTON_HOVER} active:brightness-95`

/**
 * DESIGN ROLE:
 * Square icon-only button primitive.
 *
 * USE FOR:
 * All icon-only interactive actions (close, delete, navigate, toggle).
 *
 * DO NOT USE:
 * Buttons with text labels — use Button directly.
 *
 * CONSISTENCY:
 * All button interactions come from AntigravityMotion.
 * Shares FOCUS_RING, BUTTON_HOVER, GHOST_HOVER, getDisabledCls with Button.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  children,
  loading = false,
  size = 'md',
  variant = 'primary',
  intent,
  focusRing = true,
  disabled = false,
  disabledOpacity = 50,
  className = '',
  ...props
}) => {
  const { isDark } = useTheme()
  const sizes = {
    sm: 'w-8 h-8 rounded-button-xs',
    md: 'w-[44px] h-[44px] rounded-xl'
  }
  const focusCls = focusRing ? FOCUS_RING : ''
  const disabledCls = getDisabledCls(disabled, loading, disabledOpacity)
  const baseVariantCls = variant === 'theme' ? themeVariantCls(isDark) : iconVariants[variant]
  const intentCls = variant === 'action' && intent ? ACTION_INTENT_HOVER[intent] ?? '' : ''
  const variantCls = `${baseVariantCls} ${intentCls}`

  return (
    <motion.button
      className={`
        ${sizes[size]} ${variantCls} ${focusCls}
        flex items-center justify-center flex-shrink-0
        ${disabledCls}
        ${className}
      `}
      {...props}
      disabled={effectiveDisabled(disabled, loading) || undefined}
    >
      {loading ? (
        <Spinner size="sm" variant="current" />
      ) : (
        children
      )}
    </motion.button>
  )
}

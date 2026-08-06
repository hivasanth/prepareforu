import React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { Spinner } from './Spinner'

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'soft' | 'ghost'
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  /** Phase 3.9 (D-144) — additive Management Surface Family opt-in. When true and
   *  `variant` is `primary`/`secondary`, renders the neutral management material
   *  (no amber/gold). Other variants are unaffected. Default render is unchanged. */
  management?: boolean
}

const base =
  'uppercase flex items-center justify-center transition-[color,box-shadow,border-color,opacity,filter] duration-200'

/* Shared disabled/loading treatment for Button and IconButton (P1 A-5 L-1). */
const getDisabledCls = (disabled: boolean | undefined, loading: boolean, opacity: 30 | 50 = 50) =>
  disabled || loading
    ? `${opacity === 30 ? 'opacity-30' : 'opacity-50'} cursor-not-allowed pointer-events-none`
    : ''

/* Foundation owns height, horizontal padding, font weight/size, tracking, icon gap, radius per size */
const sizeVariants: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-[10px] gap-1.5 rounded-[10px] font-bold tracking-wider',
  sm: 'h-9 px-4 text-xs gap-1.5 rounded-[12px] font-bold tracking-wider',
  md: 'h-[48px] px-6 text-[13px] gap-2 rounded-[14px] font-bold tracking-wider',
  lg: 'h-[48px] px-8 text-[14px] gap-2 rounded-[14px] font-bold tracking-wider',
  xl: 'h-14 px-10 text-[15px] gap-2 rounded-[16px] font-bold tracking-wider',
}

/* Premium Light Mode — forest/parchment material implemented directly via tokens */
const lightVariants = {
  primary:
    'bg-[image:var(--material-button-primary-surface)] text-[var(--material-button-primary-text)] ' +
    'border-[1.8px] border-[var(--material-button-primary-border)] ' +
    'shadow-[var(--material-button-primary-shadow)] ' +
    'hover:shadow-[var(--material-button-primary-shadow)] hover:brightness-110 ' +
    'active:shadow-[var(--material-button-primary-shadow)] active:translate-y-0.5',
  secondary:
    'bg-button-surface-secondary text-button-text-secondary border-[1.8px] border-button-border-secondary ' +
    'shadow-button-secondary hover:bg-button-surface-secondary-hover ' +
    'hover:shadow-button-secondary-hover hover:-translate-y-0.5',
  success:
    'bg-success text-white border border-transparent shadow-elevation-2 shadow-success/20 hover:shadow-elevation-3 hover:brightness-105',
  danger:
    'bg-danger text-white border border-transparent shadow-elevation-2 shadow-danger/20 hover:shadow-elevation-3 hover:brightness-105',
  soft:
    'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:brightness-100',
  ghost:
    'bg-button-surface-ghost text-button-text-ghost border border-button-border-ghost shadow-none ' +
    'hover:bg-button-surface-ghost-hover hover:text-button-text-ghost-hover',
}

/* Dark Mode — unchanged visual language (blue accent primary).
   D-123: dark is the app baseline (:root); these strings render only when the
   app is in dark mode (React branch), so `dark:` prefixes are removed — the app
   theme, not the OS prefers-color-scheme, must control Foundation styling. */
const darkVariants = {
  primary:
    'bg-primary text-white border-transparent shadow-elevation-2 shadow-primary/20 hover:shadow-elevation-3 hover:brightness-100 active:shadow-elevation-3',
  secondary:
    'bg-button-surface-secondary text-button-text-secondary border border-button-border-secondary ' +
    'shadow-button-secondary hover:bg-button-surface-secondary-hover hover:shadow-button-secondary-hover',
  success:
    'bg-success text-white border-transparent shadow-elevation-2 shadow-success/20 hover:shadow-elevation-3 hover:brightness-100 active:shadow-elevation-3',
  danger:
    'bg-danger text-white border-transparent shadow-elevation-2 shadow-danger/20 hover:shadow-elevation-3 hover:brightness-100 active:shadow-elevation-3',
  soft:
    'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:brightness-100',
  ghost:
    'bg-button-surface-ghost text-button-text-ghost border border-button-border-ghost shadow-none ' +
    'hover:bg-button-surface-ghost-hover hover:text-button-text-ghost-hover',
}

/* Management Surface Family (Phase 3.9 — D-144). Theme-independent neutral
   material — same family in light and dark. Consumes ONLY the --management-*
   namespace (accent follows var(--management-accent) = the app accent).
   Status variants (success/danger) and soft/ghost/auth stay with their theme
   variants. No amber/gold anywhere in this namespace. */
const managementVariants: Partial<Record<NonNullable<ButtonProps['variant']>, string>> = {
  primary:
    'bg-[var(--management-accent)] text-white border border-transparent ' +
    'shadow-[var(--management-shadow)] hover:shadow-[var(--management-shadow-hover)] ' +
    'hover:brightness-110 active:translate-y-0.5',
  secondary:
    'bg-[var(--management-surface-muted)] text-text-primary border-[1.8px] border-[var(--management-border-strong)] ' +
    'shadow-[var(--management-shadow)] hover:bg-[var(--management-surface-hover)] ' +
    'hover:shadow-[var(--management-shadow-hover)] hover:-translate-y-0.5',
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  management = false,
  className = '',
  ...props
}) => {
  const { isDark } = useTheme()
  const disabledCls = getDisabledCls(props.disabled, loading)
  const widthCls = fullWidth ? 'w-full' : ''
  const sizeCls = sizeVariants[size]
  const resolvedLight = management ? (managementVariants[variant] ?? lightVariants[variant]) : lightVariants[variant]
  const resolvedDark = management ? (managementVariants[variant] ?? darkVariants[variant]) : darkVariants[variant]

  if (!isDark) {
    return (
      <motion.button
        whileHover={{ scale: props.disabled || loading ? 1 : 1.01 }}
        whileTap={{ scale: props.disabled || loading ? 1 : 0.98 }}
        transition={{ duration: 0.2 }}
        className={`${base} ${sizeCls} ${resolvedLight} ${widthCls} ${disabledCls} ${className}`}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" className="border-current border-t-transparent" />
        ) : (
          children
        )}
      </motion.button>
    )
  }

  return (
    <motion.button
      whileHover={{ scale: props.disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: props.disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.2 }}
      className={`${base} ${sizeCls} ${resolvedDark} ${widthCls} ${disabledCls} ${className}`}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" className="border-current border-t-transparent" />
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
  variant?: 'primary' | 'ghost' | 'danger' | 'danger-soft' | 'theme'
  /* Additive a11y capability — opt-in keyboard focus ring (no rendering change when false) */
  focusRing?: boolean
  /* Additive — disabled opacity level; default preserves existing 50 */
  disabledOpacity?: 30 | 50
}

const iconVariants = {
  primary: 'bg-primary/10 text-primary hover:bg-primary hover:text-white',
  ghost: 'bg-button-surface-ghost text-button-text-ghost hover:bg-button-surface-ghost-hover hover:text-button-text-ghost-hover',
  danger: 'bg-danger/10 text-danger hover:bg-danger hover:text-white',
  /* Subtle danger icon (reproduces the historical primary-base + danger-text/hover union) */
  'danger-soft': 'bg-primary/10 text-danger hover:bg-primary hover:bg-danger/10 hover:text-white',
  /* Premium theme toggle — matches expanded ThemeToggle material (selection-surface + gold border).
     No hover:bg-* (no background flash). Only shadow elevation on hover. appearance-none strips
     native button rendering that causes browser tint. */
  theme: 'selection-surface border-[1.8px] border-button-border-secondary appearance-none hover:shadow-elevation-2',
}

/* D-123: the theme variant previously applied `dark:`-prefixed overrides gated on the
   OS prefers-color-scheme. The app theme is now the only source of truth — the dark
   branch reproduces the certified dark string (selection-surface + translucent hover
   surface + 1px subtle border) exactly. */
const themeVariantCls = (isDark: boolean) =>
  isDark
    ? 'selection-surface appearance-none bg-hover-bg/60 border border-border-subtle hover:shadow-elevation-2'
    : 'selection-surface border-[1.8px] border-button-border-secondary appearance-none hover:shadow-elevation-2'

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  loading = false,
  size = 'md',
  variant = 'primary',
  focusRing = false,
  disabledOpacity = 50,
  className = '',
  ...props
}) => {
  const { isDark } = useTheme()
  const sizes = {
    sm: 'w-[36px] h-[36px] rounded-[10px]',
    md: 'w-[44px] h-[44px] rounded-xl'
  }
  const focusCls = focusRing ? 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2' : ''
  const disabledCls = getDisabledCls(props.disabled, loading, disabledOpacity)
  const variantCls = variant === 'theme' ? themeVariantCls(isDark) : iconVariants[variant]

  return (
    <motion.button
      whileHover={{ scale: props.disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: props.disabled || loading ? 1 : 0.95 }}
      className={`
        ${sizes[size]} ${variantCls} ${focusCls}
        flex items-center justify-center flex-shrink-0
        transition-[color,box-shadow,border-color,opacity]
        ${disabledCls}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" className="border-current border-t-transparent" />
      ) : (
        children
      )}
    </motion.button>
  )
}

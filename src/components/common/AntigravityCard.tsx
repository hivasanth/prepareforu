import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { PremiumIconContainer } from './PremiumIconContainer'

type CardVariant = 'elevated' | 'default' | 'subtle' | 'premium' | 'premium-neutral' | 'premium-dark-neutral' | 'auth-light' | 'management'

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  padding?: 16 | 20 | 24 | 0
  variant?: CardVariant
}

/* Surface-family premium recipes (owned by Card). Single source of truth for the
   premium/gold panel language so consumers compose instead of copy-pasting
   (P1 A-3). PREMIUM_SURFACE* = premium-border dialect; GOLD_SURFACE =
   gold-border dialect. */
export const PREMIUM_SURFACE =
  'bg-card-bg border-[1.8px] border-card-premium-border shadow-card-shadow'
const PREMIUM_SURFACE_IMAGE =
  'bg-card-premium-surface border-[1.8px] border-card-premium-border shadow-card-shadow'
export const PREMIUM_SURFACE_HOVER = 'hover:shadow-card-premium'
export const PREMIUM_LIGHT_OVERRIDES = 'light:stat-card-surface light:shadow-premium-card'
export const GOLD_SURFACE = 'stat-card-surface border border-gold-300'
/* Management Surface Family (Phase 3.9 — D-144). Neutral management dialect —
   additive, opt-in. Consumes ONLY the --management-* namespace; deliberately has
   NO PREMIUM_LIGHT_OVERRIDES (that is the amber/parchment light override and must
   never appear on the management recipe). Dark resolves to the certified neutral
   tokens so dark rendering is pixel-identical. */
export const MANAGEMENT_SURFACE =
  'bg-[var(--management-surface)] border-[1.8px] border-[var(--management-border-strong)] shadow-[var(--management-shadow)]'
export const MANAGEMENT_SURFACE_HOVER =
  'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--management-shadow-hover)] hover:border-[var(--management-border-hover)]'

const variantClasses: Record<CardVariant, string> = {
  elevated: 'rounded-2xl shadow-elevation-3 bg-card-bg micro-light border border-card-border transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover-shadow',
  default:  'rounded-2xl shadow-card-shadow bg-card-bg border border-card-border transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover-shadow light:stat-card-surface light:shadow-premium-card light:border-card-premium-border',
  subtle:   'rounded-xl shadow-elevation-1 bg-card-bg/60 micro-light border border-border-subtle/30',
  premium:  `rounded-2xl ${PREMIUM_SURFACE_IMAGE} transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 ${PREMIUM_SURFACE_HOVER} ${PREMIUM_LIGHT_OVERRIDES}`,
  'premium-neutral': `rounded-2xl ${PREMIUM_SURFACE} transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 ${PREMIUM_SURFACE_HOVER} ${PREMIUM_LIGHT_OVERRIDES}`,
  'premium-dark-neutral': `rounded-2xl ${PREMIUM_SURFACE} transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 ${PREMIUM_SURFACE_HOVER} ${PREMIUM_LIGHT_OVERRIDES}`,
  'auth-light': 'rounded-[2.5rem] shadow-card-auth-light bg-card-auth-light-surface border border-card-auth-light-border transition-shadow duration-200',
  management: `rounded-2xl ${MANAGEMENT_SURFACE} ${MANAGEMENT_SURFACE_HOVER}`,
}

export const Card: React.FC<CardProps> = ({ children, className = '', padding, variant = 'default', ...props }) => {
  let paddingClass = ''
  if (padding !== undefined) {
    const paddingMap: Record<number, string> = {
      0: 'p-0',
      16: 'p-4',
      20: 'p-5',
      24: 'p-6',
    }
    paddingClass = paddingMap[padding] || 'p-4 md:p-5'
  } else {
    const defaultPaddingMap: Record<CardVariant, string> = {
      elevated: 'p-4 md:p-6',
      default:  'p-4 md:p-5',
      subtle:   'p-3 md:p-4',
      premium:  'p-4 md:p-5',
      'premium-neutral': 'p-4 md:p-5',
      'premium-dark-neutral': 'p-4 md:p-5',
      'auth-light': 'p-8 md:p-10',
      management: 'p-4 md:p-5',
    }
    paddingClass = defaultPaddingMap[variant]
  }

  return (
    <motion.div
      className={`${variantClasses[variant]} ${paddingClass} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  /** Semantic status key — StatCard owns the icon/status appearance via theme-aware tokens.
      Preferred over `color`. Dark values match the previous inline shorthands exactly. */
  status?: 'accent' | 'warning' | 'success' | 'info' | 'danger' | 'secondary'
  /** Legacy escape hatch (page-passed raw color). Retained for back-compat;
      the Dashboard still uses this. StatCard applies it as before. */
  color?: string
  loading?: boolean
  className?: string
}

/** Semantic status → theme-aware text token.
    Dark resolved values equal the prior inline shorthands:
    warning #FBBF24, info #3B82F6, accent #3B82F6, secondary #10B981. */
const statusTextClass: Record<NonNullable<StatCardProps['status']>, string> = {
  accent:   'text-primary',
  warning:  'text-warning',
  success:  'text-success',
  info:     'text-info',
  danger:   'text-danger',
  secondary: 'text-[var(--color-secondary)]',
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  unit,
  status,
  color,
  loading = false,
  className = ''
}) => {
  const { isDark } = useTheme()
  let displayValue = value
  let displayUnit = unit

  if (!displayUnit) {
    const valStr = value.toString()
    const match = valStr.match(/^(.+?)(?:\s+([a-zA-Z%#]+)|(%))$/)
    if (match) {
      displayValue = match[1]
      displayUnit = match[2] || match[3]
    } else {
      displayValue = valStr
      displayUnit = ''
    }
  } else {
    const valStr = value.toString()
    if (valStr.endsWith(displayUnit)) {
      displayValue = valStr.slice(0, -displayUnit.length).trim()
    }
  }

  const cardBase =
    'flex items-center gap-2 sm:gap-3 lg:gap-4 transition-[transform,box-shadow] duration-300'

  // Icon appearance is owned by StatCard (per architecture rules).
  // Dark: unchanged (bg-stat-icon-bg text-stat-icon-color, no added material).
  // Light: premium "medallion" — forest material + gold edge + carved depth,
  //   no size/spacing/layout change (border-box global). Status tint via theme-aware token.
  const statusClass = status ? (statusTextClass[status] ?? '') : ''

  const cardLight =
    'h-16 sm:h-20 lg:h-24 px-3 sm:px-4 lg:px-5 py-3 sm:py-4 rounded-stat-card-radius stat-card-surface ' +
    'border-2 border-stat-card-border ' +
    'shadow-stat-card-shadow light:shadow-premium-card ' +

  'hover:-translate-y-0.5 light:hover:shadow-premium-elevated'
  const cardDark =
    'h-16 sm:h-20 lg:h-24 px-3 sm:px-4 lg:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl ' +
    'bg-card-bg micro-light border border-card-border ' +
    'shadow-card-shadow hover:shadow-card-hover-shadow hover:bg-hover-bg/40 hover:-translate-y-0.5'

  return (
    <div className={`${cardBase} ${isDark ? cardDark : cardLight} ${className}`}>
      <PremiumIconContainer
        icon={Icon}
        iconSize={18}
        className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-stat-icon-radius"
        darkClassName={`bg-stat-icon-bg text-stat-icon-color ${statusClass}`}
        style={color ? { color } : undefined}
      />
      <div className="flex flex-col min-w-0 gap-0.5 sm:gap-1 flex-1">
        <p
          className="font-bold uppercase tracking-widest leading-none m-0 text-[9px] lg:text-[11px] text-stat-label-text light:text-text-hint"
        >
          {label}
        </p>
        {loading ? (
          <div
            className={`h-4 w-16 animate-pulse rounded mt-1 ${
              isDark ? 'bg-hover-bg' : 'bg-stat-card-border/20'
            }`}
          />
        ) : (
        <p
          className="font-black leading-tight m-0 text-sm sm:text-base lg:text-lg text-stat-value-text"
        >
            {displayValue}{displayUnit ? (displayUnit === '%' ? '%' : ` ${displayUnit}`) : ''}
          </p>
        )}
      </div>
    </div>
  )
}

import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { PremiumIconContainer } from './PremiumIconContainer'
import { Skeleton } from './Skeleton'
import { CARD_HOVER, ROW_HOVER, GOLD_LIGHT_MATERIAL } from './AntigravityMotion'

/* ─── Card ──────────────────────────────────────────────────────────────────
 * Design role:
 *   Shared surface container for all card-shaped content blocks.
 *
 * Variants (8):
 *   elevated         — Raised content cards (dashboard stats, summaries)
 *   default          — Standard content cards (attempt cards, list cards)
 *   subtle           — Soft background cards (less visual weight)
 *   premium          — Gold gradient surface (premium/featured content)
 *   premium-neutral  — Premium border without gold surface tint
 *   premium-dark-neutral — Same as premium-neutral (dark mode safe)
 *   auth-light       — Auth page card (rounded-2.5rem, gold surface)
 *   management       — Neutral admin surface (no gold, no amber)
 *
 * Use for:
 *   - Dashboard stat sections
 *   - User attempt/activity cards
 *   - Admin content panels
 *   - Modal content containers
 *   - Any card-shaped content block
 *
 * Do not use for:
 *   - Selection/navigation containers (use SelectionContainer)
 *   - Inline pill/badge elements (use Pill)
 *   - Form input fields (use Input)
 *   - Skeleton placeholders (use Skeleton)
 *   - Error states (use ErrorContainer)
 *
 * Theme: Light + Dark (variant-aware: premium/management light overrides)
 * Visual language: forest + gold 3D (light) / neutral slate (dark)
 *
 * Consumers: 32+ files across user/, admin/, sub-admin/, exam/, pages/
 * ────────────────────────────────────────────────────────────────────────── */

/* The ONE hover + gold-material fragments live in AntigravityMotion.ts.
   Re-exported here so the ~15 existing consumers importing these from
   './AntigravityCard' keep working unchanged. */
export { CARD_HOVER, ROW_HOVER, GOLD_LIGHT_MATERIAL }

type CardVariant = 'elevated' | 'default' | 'subtle' | 'premium' | 'premium-neutral' | 'premium-dark-neutral' | 'auth-light' | 'management' | 'static'

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
/* CARD_HOVER / ROW_HOVER are owned by AntigravityMotion.ts and re-exported above
   (the ONE 3D-block hover language). GOLD_LIGHT_MATERIAL lives there too — the
   ONE gold surface recipe (defined in AntigravityMotion.ts, imported above). */

export const PREMIUM_SURFACE =
  'bg-card-bg border-(length:--border-premium-width) border-card-premium-border shadow-card-shadow'
const PREMIUM_SURFACE_IMAGE =
  'bg-card-premium-surface border-(length:--border-premium-width) border-card-premium-border shadow-card-shadow'
/* Phase 6.X (Task 4) — premium variants use the SAME card hover as default/
   elevated (CARD_HOVER) instead of the previous distinct `shadow-card-premium`,
   so the whole foundation lifts with exactly one hover language. */
export const PREMIUM_SURFACE_HOVER = CARD_HOVER
export const PREMIUM_LIGHT_OVERRIDES = 'light:stat-card-surface light:shadow-premium-card'
export const GOLD_SURFACE = 'stat-card-surface border border-gold-300'
/* Management Surface Family (Phase 3.9 — D-144). Neutral management dialect —
   additive, opt-in. Consumes ONLY the --management-* namespace; deliberately has
   NO PREMIUM_LIGHT_OVERRIDES (that is the amber/parchment light override and must
   never appear on the management recipe). Dark resolves to the certified neutral
   tokens so dark rendering is pixel-identical. */
export const MANAGEMENT_SURFACE =
  `bg-[var(--management-surface)] border-(length:--border-premium-width) border-[var(--management-border-strong)] shadow-[var(--management-shadow)] ${GOLD_LIGHT_MATERIAL}`
/* Management containers use the SAME CARD_HOVER as every other card/container —
   the ONE 3D-block hover. No custom surface/shadow/border hover override. */

/* ─── Shared Surface Constants ────────────────────────────────────────────────
   Exported so FloatingList and other non-Card surfaces can share the
   canonical Card material grammar without duplicating class strings. */

/** Card default surface — radius + bg + border + shadow (no hover, no material). */
export const CARD_SURFACE_BASE =
  'rounded-2xl bg-card-bg border border-card-border shadow-card-shadow'

/** Card default light-mode premium overrides. */
export const CARD_SURFACE_LIGHT_OVERRIDES =
  'light:stat-card-surface light:shadow-premium-card light:border-card-premium-border'

const variantClasses: Record<CardVariant, string> = {
  elevated: `rounded-2xl shadow-elevation-3 bg-card-bg micro-light border border-card-border ${CARD_HOVER} ${GOLD_LIGHT_MATERIAL}`,
  default:  `${CARD_SURFACE_BASE} ${CARD_HOVER} ${GOLD_LIGHT_MATERIAL}`,
  subtle:   `rounded-xl shadow-elevation-1 bg-card-bg/60 micro-light border border-border-subtle/30 ${CARD_HOVER} ${GOLD_LIGHT_MATERIAL}`,
  premium:  `rounded-2xl ${PREMIUM_SURFACE_IMAGE} ${CARD_HOVER} ${PREMIUM_LIGHT_OVERRIDES}`,
  'premium-neutral': `rounded-2xl ${PREMIUM_SURFACE} ${CARD_HOVER} ${PREMIUM_LIGHT_OVERRIDES}`,
  'premium-dark-neutral': `rounded-2xl ${PREMIUM_SURFACE} ${CARD_HOVER} ${PREMIUM_LIGHT_OVERRIDES}`,
  'auth-light': `rounded-[2.5rem] shadow-card-auth-light bg-card-auth-light-surface border border-card-auth-light-border ${CARD_HOVER} ${GOLD_LIGHT_MATERIAL}`,
  management: `rounded-2xl ${MANAGEMENT_SURFACE} ${CARD_HOVER}`,
  static: `rounded-2xl shadow-elevation-3 bg-card-bg micro-light border border-card-border ${GOLD_LIGHT_MATERIAL}`,
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
      static: 'p-4 md:p-6',
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
      still used by ReviewLayout, StatisticsSection, StudentDetailModal,
      PerformanceMetricsGrid and SubAdminDashboard. StatCard applies it as
      before; prefer `status` for new callers. */
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
    `flex items-center gap-2 sm:gap-3 lg:gap-4 ${CARD_HOVER}`

  // Icon appearance is owned by StatCard (per architecture rules).
  // Dark: unchanged (bg-stat-icon-bg text-stat-icon-color, no added material).
  // Light: premium "medallion" — forest material + gold edge + carved depth,
  //   no size/spacing/layout change (border-box global). Status tint via theme-aware token.
  const statusClass = status ? (statusTextClass[status] ?? '') : ''

  const cardLight =
    'h-16 sm:h-20 lg:h-24 px-3 sm:px-4 lg:px-5 py-3 sm:py-4 rounded-stat-card-radius stat-card-surface ' +
    'border-2 border-stat-card-border ' +
    'shadow-stat-card-shadow light:shadow-premium-card'
  const cardDark =
    'h-16 sm:h-20 lg:h-24 px-3 sm:px-4 lg:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl ' +
    'bg-card-bg micro-light border border-card-border ' +
    'shadow-card-shadow'

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
          className="font-bold uppercase tracking-widest leading-none m-0 text-[9px] lg:text-[11px] text-stat-label-text light:text-text-secondary"
        >
          {label}
        </p>
        {loading ? (
          <Skeleton width={64} height={16} borderRadius={4} className="mt-1" />
        ) : (
        <p
          className="font-black leading-tight m-0 tabular-nums text-base sm:text-lg lg:text-xl text-stat-value-text"
        >
            {displayValue}{displayUnit ? (displayUnit === '%' ? '%' : ` ${displayUnit}`) : ''}
          </p>
        )}
      </div>
    </div>
  )
}

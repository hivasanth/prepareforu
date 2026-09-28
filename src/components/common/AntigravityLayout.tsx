import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { PremiumSelect } from './PremiumSelect'
import { AdminIconWrap } from './AdminIconWrap'
import { AdminText } from './AdminText'
import { PREMIUM_SURFACE, PREMIUM_SURFACE_HOVER, PREMIUM_LIGHT_OVERRIDES, MANAGEMENT_SURFACE } from './AntigravityCard'
import { CARD_HOVER } from './AntigravityMotion'

/* ─── SelectionContainer ─────────────────────────────────────────────────────
 * Design role:
 *   Premium selection/nav/filter surface container.
 *   The ONE container for multi-tab selection strips and configuration panels.
 *
 * Variants:
 *   premium (default) — Forest/gold gradient surface + gold border + premium
 *     shadow. The primary selection surface for exam/paper/subject navigation.
 *   management — Neutral admin surface (no gold). Opt-in for admin contexts.
 *
 * Use for:
 *   - Exam type/paper/subject selection tabs
 *   - SegmentedFilter track wrapper
 *   - Configuration mode selectors
 *   - Multi-level tab navigation containers
 *
 * Do not use for:
 *   - Regular content cards (use Card variant="default")
 *   - List item containers (use Card or direct layout)
 *   - Form input wrappers (use Input)
 *   - Error containers (use ErrorContainer)
 *   - Skeleton placeholders (use Skeleton)
 *
 * Theme: Light + Dark (premium = gold gradient light / dark forest;
 *         management = neutral in both)
 * Visual language: forest chrome + 3D elevation (premium)
 * Consumers: 13 files / 15 JSX sites (all use default premium variant)
 * ────────────────────────────────────────────────────────────────────────── */

const PX_TO_SPACE: Record<number, string> = {
  0: 'var(--space-0)',
  4: 'var(--space-1)',
  8: 'var(--space-2)',
  12: 'var(--space-3)',
  16: 'var(--space-4)',
  20: 'var(--space-5)',
  24: 'var(--space-6)',
  32: 'var(--space-8)',
  40: 'var(--space-10)',
  48: 'var(--space-12)',
  64: 'var(--space-16)',
  80: 'var(--space-20)',
  96: 'var(--space-24)',
}

export const PageContainer: React.FC<{
  children: React.ReactNode
  className?: string
  centered?: boolean
  fullHeight?: boolean
  padded?: boolean
}> = ({ children, className = '', centered = false, fullHeight = false, padded = true }) => {
  const base = centered
    ? `min-h-screen flex items-center justify-center bg-app-bg ${padded ? 'p-4 md:p-6' : ''}`
    : fullHeight
      ? `min-h-screen bg-app-bg ${padded ? 'px-2 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-6 md:py-10' : ''}`
      : `px-2 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-6 md:py-10`
  const width = centered ? 'w-full' : 'max-w-[1280px] mx-auto'
  return (
    <div className={`${base} ${width} ${className}`}>
      {children}
    </div>
  )
}

/* Semantic inset scale for SelectionContainer. 'sm' (12px) is the historical
   canonical default; 'md' (16px) matches the FloatingListItem row inset so
   list headers and rows can share one content-box geometry. */
const SELECTION_CONTAINER_PADDING = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
} as const

export const SelectionContainer: React.FC<{
  children: React.ReactNode
  className?: string
  variant?: 'premium' | 'management'
  /** Semantic inset. Default 'sm' preserves the canonical render. */
  padding?: keyof typeof SELECTION_CONTAINER_PADDING
  /** Premium depth tilt (`-translate-y-0.5`). On by default to preserve the
   *  canonical premium surface. Compact control rows that must share a flex
   *  centerline with neighboring controls (e.g. SegmentedFilter beside a
   *  language toggle) opt out so their layout box and rendered box coincide. */
  tilt?: boolean
}> = ({
  children,
  className = '',
  variant = 'premium',
  padding = 'sm',
  tilt = true,
}) => {
  /* Phase 3.9 (D-144) — additive Management variant. Default ('premium') render is
     byte-identical (gold selection surface + premium border + premium shadow).
     Management renders the neutral family (no gold); Navigation-family consumers
     are untouched. Gold remains the active-state accent for the premium path. */
  const surface = variant === 'management'
    ? MANAGEMENT_SURFACE
    : 'shadow-card-premium selection-surface border-(length:--border-premium-width) border-card-premium-border'
  return (
    <div className={`rounded-2xl ${surface} ${tilt ? '-translate-y-0.5' : ''} ${SELECTION_CONTAINER_PADDING[padding]} ${className}`}>
      {children}
    </div>
  )
}

export const PageHeader: React.FC<{
  title: string
  subtitle?: string
  className?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  [key: string]: any
}> = ({
  title,
  subtitle,
  className = '',
  icon: Icon,
  actions,
}) => (
  <header className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${className}`}>
    <div className="space-y-[4px] min-w-0">
      <div className="flex items-center gap-[8px]">
        {Icon && <Icon size={18} className="text-primary shrink-0" />}
        <h1 className="text-[20px] md:text-[24px] font-bold text-text-title tracking-tight m-0 truncate">
          {title}
        </h1>
      </div>
      {subtitle && <p className="text-[12px] md:text-[13px] text-text-secondary leading-relaxed m-0">{subtitle}</p>}
    </div>
    {actions && (
      <div className="flex items-center gap-2 shrink-0">
        {actions}
      </div>
    )}
  </header>
)

type GapKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'section'

export const Stack: React.FC<{
  children: React.ReactNode
  gap?: GapKey | number
  direction?: 'col' | 'row'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between'
  className?: string
}> = ({
  children,
  gap = 'md',
  direction = 'col',
  align = 'stretch',
  justify = 'start',
  className = ''
}) => {
  const alignMap = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' }
  const justifyMap = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between' }
  const spacingMap: Record<GapKey, string> = {
    xs: 'gap-[var(--space-1)]',
    sm: 'gap-[var(--space-2)]',
    md: 'gap-[var(--space-4)]',
    lg: 'gap-[var(--space-6)]',
    xl: 'gap-[var(--space-8)]',
    xxl: 'gap-[var(--space-12)]',
    section: 'gap-[var(--space-8)]',
  }
  const gapClass = typeof gap === 'number' ? '' : (spacingMap[gap] ?? 'gap-[var(--space-3)]')
  const gapStyle = typeof gap === 'number' ? { gap: PX_TO_SPACE[gap] ?? `${gap}px` } : undefined
  return (
    <div
      className={`flex flex-${direction} ${alignMap[align]} ${justifyMap[justify]} ${gapClass} ${className}`}
      style={gapStyle}
    >
      {children}
    </div>
  )
}

export const Grid: React.FC<{
  children: React.ReactNode
  cols?: 1|2|3|4
  sm?: 1|2|3|4
  md?: 1|2|3|4
  lg?: 1|2|3|4
  gap?: number
  className?: string
}> = ({ children, cols = 1, sm, md, lg, gap, className = '' }) => {
  const hasResponsive = sm !== undefined || md !== undefined || lg !== undefined
  const finalColClass = hasResponsive
    ? [
        `grid-cols-${cols}`,
        sm ? `sm:grid-cols-${sm}` : '',
        md ? `md:grid-cols-${md}` : '',
        lg ? `lg:grid-cols-${lg}` : '',
      ].filter(Boolean).join(' ')
    : ({
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      } as Record<number, string>)[cols]
  const gapClass = gap !== undefined ? '' : 'gap-4 md:gap-5 lg:gap-6'
  const gapStyle = gap !== undefined ? { gap: PX_TO_SPACE[gap] ?? `${gap}px` } : undefined
  return (
    <div className={`grid ${finalColClass} ${gapClass} ${className}`} style={gapStyle}>
      {children}
    </div>
  )
}

export const SectionHeader: React.FC<{
  title: string
  subtitle?: string
  icon?: LucideIcon
  badge?: React.ReactNode
  action?: React.ReactNode
  className?: string
}> = ({ title, subtitle, icon: Icon, badge, action, className = '' }) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <AdminIconWrap size="sm" rounded="lg" className="shadow-sm scale-90 shrink-0">
            <Icon size={18} />
          </AdminIconWrap>
        )}
        <div className="min-w-0">
          <AdminText as="span" variant="cinzel">{title}</AdminText>
          {subtitle && (
            <p className="text-[11px] text-text-muted uppercase tracking-widest mt-0.5 m-0">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        {badge}
        {action}
      </div>
    </div>
  )
}

/**
 * CollectionToolbar — Foundation action container for collection pages
 * (Questions, Users, Topics, Exams, Students). Surface is pixel-identical to
 * the premium `CollectionCard`/`Card` surface (same bg, border, radius, shadow
 * and elevation) so the toolbar reads as one surface family with the cards it
 * drives. Density (p-3/p-4) matches management CollectionCard rows (padding 16).
 */
export const CollectionToolbar: React.FC<{ children: React.ReactNode; className?: string; variant?: 'premium' | 'management' }> = ({
  children,
  className = '',
  variant = 'premium',
}) => {
  /* Phase 3.9 (D-144) — additive `variant` prop. Default ('premium') render is
     byte-identical (premium surface + gold light override). Management renders
     the neutral Management Surface Family with NO PREMIUM_LIGHT_OVERRIDES. */
  const surface = variant === 'management'
    ? `${MANAGEMENT_SURFACE} ${CARD_HOVER}`
    : `${PREMIUM_SURFACE} ${PREMIUM_SURFACE_HOVER} ${PREMIUM_LIGHT_OVERRIDES}`
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 md:p-4 rounded-2xl ${surface} ${className}`}>
      {children}
    </div>
  )
}

/** @deprecated Use `CollectionToolbar` — retained as an alias for existing consumers. */
export const FilterBar = CollectionToolbar

interface SelectOption {
  id: string
  name: string
}

interface SelectProps {
  label?: string
  icon?: LucideIcon
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const FilterSelect: React.FC<SelectProps> = ({
  icon,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = '',
  label,
}) => (
  <PremiumSelect
    icon={icon}
    value={value}
    onChange={onChange}
    options={options}
    placeholder={placeholder}
    label={label}
    disabled={disabled}
    className={`w-full md:w-auto ${className}`}
  />
)

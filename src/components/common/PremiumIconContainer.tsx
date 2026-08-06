import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface PremiumIconContainerProps {
  icon?: LucideIcon
  iconSize?: number
  children?: ReactNode
  /** Container sizing + shape (e.g. w-9 h-9 rounded-[10px]). Keeps sizing per consumer. */
  className?: string
  /** Dark-mode material (applied as-is; project is dark-first). Keeps existing dark look. */
  darkClassName?: string
  /** Optional inline style (e.g. icon color tint). */
  style?: CSSProperties
}

/**
 * Application-standard Premium Icon Container (Material Family v1.0).
 *
 * Light mode material language (shared with StatCard / AttemptCardBase):
 *   • forest surface   → var(--gradient-header)
 *   • carved depth     → var(--elevation-carved)
 *   • soft gold highlight (inner) → inset 0 1px 0 rgba(255,248,210,0.5)
 *   • NO colored outline (no border / no ring)
 *   • icon centered
 *
 * Dark mode is delegated to `darkClassName` so each consumer keeps its
 * pixel-identical dark appearance. Sizing/shape is delegated to `className`.
 */
export function PremiumIconContainer({
  icon: Icon,
  iconSize = 18,
  children,
  className = '',
  darkClassName = 'bg-stat-icon-bg text-stat-icon-color',
  style,
}: PremiumIconContainerProps) {
  return (
    <div
      style={style}
      className={`flex items-center justify-center shrink-0 transition-all light:bg-[image:var(--gradient-header)] light:text-[var(--ancient-gold-bright)] light:shadow-premium-icon ${darkClassName} ${className}`}
    >
      {children ?? (Icon ? <Icon size={iconSize} /> : null)}
    </div>
  )
}

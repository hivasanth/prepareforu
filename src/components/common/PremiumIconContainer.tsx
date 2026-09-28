import type { CSSProperties, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { TRANSITION_INTERACTION } from './AntigravityMotion'

interface PremiumIconContainerProps {
  icon?: LucideIcon
  iconSize?: number
  children?: ReactNode
  /** Container sizing + shape (e.g. w-9 h-9 rounded-[10px]). Keeps sizing per consumer. */
  className?: string
  /** Dark/base-mode material classes (applied as-is; project is dark-first).
      Light mode is owned by the `light:` variants below, so these classes only
      ever paint in non-light contexts. */
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
 * The `darkClassName` name is kept for parity with `IconBadge` — it carries
 * the base/non-light mode classes; light-mode material comes from the `light:`
 * variants below, never from `darkClassName`.
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
      className={`flex items-center justify-center shrink-0 ${TRANSITION_INTERACTION} light:bg-[image:var(--gradient-header)] light:text-[var(--ancient-gold-bright)] light:shadow-premium-icon ${darkClassName} ${className}`}
    >
      {children ?? (Icon ? <Icon size={iconSize} /> : null)}
    </div>
  )
}

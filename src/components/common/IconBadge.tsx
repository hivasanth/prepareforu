import type { LucideIcon } from 'lucide-react'

const ICON_BADGE_SIZES = {
  xs: { container: 'w-6 h-6', icon: 12 },
  sm: { container: 'w-7 h-7', icon: 14 },
  md: { container: 'w-8 h-8', icon: 16 },
  lg: { container: 'w-9 h-9', icon: 18 },
  xl: { container: 'w-10 h-10', icon: 20 },
  '2xl': { container: 'w-12 h-12', icon: 24 },
  '3xl': { container: 'w-14 h-14', icon: 28 },
  '4xl': { container: 'w-16 h-16', icon: 32 },
  '5xl': { container: 'w-20 h-20', icon: 36 },
  '6xl': { container: 'w-24 h-24', icon: 40 },
  '7xl': { container: 'w-28 w-28', icon: 48 },
} as const

type IconBadgeSize = keyof typeof ICON_BADGE_SIZES

/** Semantic status material (additive DS-004). Maps to the standard bg-X/10 text-X
 *  icon-badge material so consumers stop passing raw darkClassName overrides. */
type IconBadgeStatus =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'secondary'
  | 'muted'
  | 'default'

const STATUS_MATERIAL: Record<IconBadgeStatus, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  secondary: 'bg-secondary/10 text-secondary',
  muted: 'bg-hover-bg text-text-muted',
  default: 'bg-primary/10 text-primary',
}

interface IconBadgeProps {
  icon: LucideIcon
  size?: IconBadgeSize
  shape?: 'rounded' | 'circle'
  className?: string
  /** @deprecated prefer `status`. Raw material override (kept for backward compat). */
  darkClassName?: string
  /** Semantic material owner. Replaces `darkClassName="bg-X/10 text-X"`. */
  status?: IconBadgeStatus
}

export function IconBadge({
  icon: Icon,
  size = '2xl',
  shape = 'rounded',
  className = '',
  darkClassName,
  status = 'default',
}: IconBadgeProps) {
  const { container, icon: iconSize } = ICON_BADGE_SIZES[size]
  const material = darkClassName ?? STATUS_MATERIAL[status]
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-xl'

  return (
    <div className={`${container} ${radius} flex items-center justify-center shrink-0 transition-all ${material} ${className}`}>
      <Icon size={iconSize} />
    </div>
  )
}

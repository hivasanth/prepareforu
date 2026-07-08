import type { LucideIcon } from 'lucide-react'

export const ICON_BADGE_SIZES = {
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
  '7xl': { container: 'w-28 h-28', icon: 48 },
} as const

type IconBadgeSize = keyof typeof ICON_BADGE_SIZES

interface IconBadgeProps {
  icon: LucideIcon
  size?: IconBadgeSize
  shape?: 'rounded' | 'circle'
  className?: string
  darkClassName?: string
}

export function IconBadge({
  icon: Icon,
  size = '2xl',
  className = '',
  darkClassName = 'rounded-xl bg-primary/10 text-primary',
}: IconBadgeProps) {
  const { container, icon: iconSize } = ICON_BADGE_SIZES[size]

  return (
    <div className={`${container} flex items-center justify-center shrink-0 transition-all ${darkClassName} ${className}`}>
      <Icon size={iconSize} />
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'
import { Pill } from './Pill'
import type { PillVariant } from './Pill'

/* ─── Phase 5.4D Counter badge ───────────────────────────────────────────────
   Counter role owner: a compact count/label pill (e.g. "3 new", notification
   counts). Wrapper only — every color, radius, padding and type rule lives in
   the Pill primitive. */
export interface CounterBadgeProps {
  variant?: PillVariant
  icon?: LucideIcon
  className?: string
  children: React.ReactNode
}

export const CounterBadge: React.FC<CounterBadgeProps> = ({
  variant = 'primary',
  icon,
  className = '',
  children,
}) => (
  <Pill role="counter" variant={variant} size="xs" icon={icon} className={className}>
    {children}
  </Pill>
)

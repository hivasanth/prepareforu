import type { LucideIcon } from 'lucide-react'
import { Pill } from './Pill'
import type { PillVariant } from './Pill'

/* ─── Phase 5.4D Status badge ────────────────────────────────────────────────
   Status role owner: a small semantic pill marking the state of a thing
   (success / warning / danger / info / neutral). Wrapper only — every color,
   radius, padding and type rule lives in the Pill primitive. */
export interface StatusBadgeProps {
  status?: PillVariant
  icon?: LucideIcon
  pulse?: boolean
  className?: string
  children: React.ReactNode
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'default',
  icon,
  pulse = false,
  className = '',
  children,
}) => (
  <Pill role="status" variant={status} size="sm" icon={icon} pulse={pulse} className={className}>
    {children}
  </Pill>
)

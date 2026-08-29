import type { LucideIcon } from 'lucide-react'
import { Pill } from './Pill'
import type { PillSize } from './Pill'

/* ─── Phase 5.4D Navigation pill ─────────────────────────────────────────────
   Navigation role owner: a tab-like nav chip. The current page renders the
   solid active state (bg-primary, aria-current="page"); other pages render the
   neutral border language at rest with the Management Surface hover fill.
   Renders a real <button> with keyboard focus + visible ring. Wrapper only. */
export interface NavigationPillProps {
  size?: PillSize
  icon?: LucideIcon
  current?: boolean
  disabled?: boolean
  onClick?: () => void
  ariaLabel?: string
  title?: string
  className?: string
  children: React.ReactNode
}

export const NavigationPill: React.FC<NavigationPillProps> = ({
  size = 'sm',
  icon,
  current = false,
  disabled = false,
  onClick,
  ariaLabel,
  title,
  className = '',
  children,
}) => (
  <Pill
    role="navigation"
    size={size}
    icon={icon}
    state={current ? 'active' : undefined}
    as="button"
    disabled={disabled}
    onClick={onClick}
    ariaCurrent={current}
    ariaLabel={ariaLabel}
    title={title}
    className={className}
  >
    {children}
  </Pill>
)

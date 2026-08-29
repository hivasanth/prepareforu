import type { LucideIcon } from 'lucide-react'
import { Pill } from './Pill'
import type { PillSize } from './Pill'

/* ─── Phase 5.4D Selection pill ──────────────────────────────────────────────
   Selection role owner: a toggleable selection chip. At rest it uses the
   neutral border language ("inactive pill"); when selected it uses the
   Management Surface selection colors (5.4A --management-surface-active /
   --management-border-active / --management-accent). Renders a real <button>
   with keyboard focus + visible ring. Wrapper only. */
export interface SelectionPillProps {
  size?: PillSize
  icon?: LucideIcon
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  ariaLabel?: string
  title?: string
  className?: string
  children: React.ReactNode
}

export const SelectionPill: React.FC<SelectionPillProps> = ({
  size = 'sm',
  icon,
  selected = false,
  disabled = false,
  onClick,
  ariaLabel,
  title,
  className = '',
  children,
}) => (
  <Pill
    role="selection"
    size={size}
    icon={icon}
    state={selected ? 'selected' : undefined}
    as="button"
    disabled={disabled}
    onClick={onClick}
    ariaPressed={selected}
    ariaLabel={ariaLabel}
    title={title}
    className={className}
  >
    {children}
  </Pill>
)

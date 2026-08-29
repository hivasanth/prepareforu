import type { LucideIcon } from 'lucide-react'
import { Pill } from './Pill'
import type { PillSize, PillState } from './Pill'

/* ─── Phase 5.4D Filter pill ─────────────────────────────────────────────────
   Filter role owner: an interactive, toggleable filter chip (selected/unselected).
   Renders a real <button> with keyboard focus + visible ring and the certified
   subtle hover/pressed language (no scaling, no lifting). Wrapper only. */
export interface FilterPillProps {
  size?: PillSize
  state?: PillState
  icon?: LucideIcon
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  ariaLabel?: string
  title?: string
  className?: string
  children: React.ReactNode
}

export const FilterPill: React.FC<FilterPillProps> = ({
  size = 'sm',
  state,
  icon,
  selected = false,
  disabled = false,
  onClick,
  ariaLabel,
  title,
  className = '',
  children,
}) => {
  const resolvedState: PillState | undefined = state ?? (selected ? 'selected' : undefined)
  return (
    <Pill
      role="filter"
      variant="neutral"
      size={size}
      state={resolvedState}
      icon={icon}
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
}

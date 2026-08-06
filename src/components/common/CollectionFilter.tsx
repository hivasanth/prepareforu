import React from 'react'
import { Menu } from './Menu'
import { Check, ChevronDown } from 'lucide-react'

export interface CollectionFilterOption {
  id: string
  label: string
  disabled?: boolean
}

interface CollectionFilterProps {
  options: CollectionFilterOption[]
  value: string
  onChange: (id: string) => void
  /** Trigger label shown while nothing concrete is selected (e.g. "Difficulty"). */
  label: string
  ariaLabel?: string
  disabled?: boolean
  align?: 'left' | 'right' | 'center'
  className?: string
  /** Phase 3.9 (D-144) — additive surface family. `premium` (default, unchanged)
   *  renders the certified premium trigger/panel; `management` renders the neutral
   *  Management Surface Family. No existing consumer changes. */
  variant?: 'premium' | 'management'
}

/**
 * CollectionFilter — Foundation premium dropdown filter for small finite option
 * sets (Difficulty, Status, Role, Language, Question Type, ...).
 *
 * Reuses the Menu foundation: a compact premium trigger (same size as the
 * search bar controls) + a premium dropdown panel. The selected row renders
 * primary text, a premium background and a check icon. `SelectionContainer`
 * stays reserved for cross-section navigation (Exam/Paper/Subject);
 * `CollectionFilter` is for filtering within the current section.
 *
 * For large or searchable datasets use `PremiumSelect` instead.
 */
export const CollectionFilter: React.FC<CollectionFilterProps> = ({
  options,
  value,
  onChange,
  label,
  ariaLabel,
  disabled = false,
  align = 'left',
  className = '',
  variant = 'premium',
}) => {
  const selected = options.find(opt => opt.id === value)
  const isActive = value !== 'all' && value !== '' && !!selected
  const display = isActive ? selected.label : label

  const isManagement = variant === 'management'
  const triggerSurface = isManagement
    ? `bg-[var(--management-surface)] text-text-primary border-[var(--management-border)]
       hover:border-[var(--management-border-hover)] shadow-[var(--management-shadow)] hover:shadow-[var(--management-shadow-hover)]
       ${isActive ? 'bg-[var(--management-surface-active)] text-[var(--management-accent)] border-[var(--management-border-active)]' : ''}`
    : `bg-filter-surface text-filter-text border-filter-border
       hover:border-filter-border-hover shadow-filter hover:shadow-filter-hover
       ${isActive ? 'bg-filter-surface-active text-filter-text-active border-filter-border-active' : ''}`

  return (
    <Menu align={align} className={className} variant={isManagement ? 'management' : 'default'}>
      <Menu.Trigger
        disabled={disabled}
        aria-label={ariaLabel || label}
        className={`
          w-full h-[44px] md:h-[48px] rounded-xl px-4 md:px-3.5 gap-2
          flex items-center justify-between
          text-[11px] font-bold uppercase tracking-widest
          border transition-all duration-200 focus:outline-none focus:border-primary
          ${triggerSurface}
          ${disabled ? 'opacity-40 pointer-events-none' : ''}
        `}
      >
        {({ isOpen }) => (
          <>
            <span className="truncate">{display}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''} ${isActive ? 'text-primary' : 'text-text-muted'}`}
            />
          </>
        )}
      </Menu.Trigger>

      <Menu.Content align={align} aria-label={ariaLabel || label} className="py-1">
        {options.map(opt => {
          const isSelected = value === opt.id
          return (
            <Menu.Item
              key={opt.id}
              disabled={opt.disabled}
              selected={isSelected}
              onClick={() => onChange(opt.id)}
              className="flex items-center justify-between gap-3"
            >
              <span className="truncate">{opt.label}</span>
              {isSelected && <Check size={14} className="text-primary shrink-0" />}
            </Menu.Item>
          )
        })}
      </Menu.Content>
    </Menu>
  )
}

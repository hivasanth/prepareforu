import React from 'react'
import { motion } from 'framer-motion'
import { SelectionContainer } from './AntigravityLayout'
import { TAB_SPRING } from './AntigravityAnimation'
import type { TabsSize } from './AntigravityData'

export interface SegmentedFilterOption {
  id: string
  label: string
  disabled?: boolean
  icon?: React.ReactNode
  badge?: React.ReactNode
}

interface SegmentedFilterProps {
  options: SegmentedFilterOption[]
  value: string
  onChange: (id: string) => void
  size?: TabsSize
  className?: string
}

const SIZE_CLASSES: Record<TabsSize, { tab: string; container: string }> = {
  sm: { tab: 'px-2.5 md:px-3 text-[9px]', container: 'h-[30px] md:h-[34px]' },
  md: { tab: 'px-3 md:px-4 text-[10px] md:text-[10px]', container: 'h-[34px] md:h-[38px]' },
  lg: { tab: 'px-4 md:px-5 text-[10px] md:text-[11px]', container: 'h-[38px] md:h-[42px]' },
}

export const SegmentedFilter: React.FC<SegmentedFilterProps> = ({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}) => {
  const instanceId = React.useId()
  const tablistRef = React.useRef<HTMLDivElement>(null)

  const onKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    const enabledIndices = options.map((o, i) => o.disabled ? -1 : i).filter(i => i >= 0)
    const currentEnabledPos = enabledIndices.indexOf(currentIndex)
    let nextEnabledPos: number | null = null

    if (e.key === 'ArrowRight') {
      nextEnabledPos = (currentEnabledPos + 1) % enabledIndices.length
    } else if (e.key === 'ArrowLeft') {
      nextEnabledPos = (currentEnabledPos - 1 + enabledIndices.length) % enabledIndices.length
    } else if (e.key === 'Home') {
      nextEnabledPos = 0
    } else if (e.key === 'End') {
      nextEnabledPos = enabledIndices.length - 1
    }

    if (nextEnabledPos !== null) {
      e.preventDefault()
      const nextIndex = enabledIndices[nextEnabledPos]
      onChange(options[nextIndex].id)
      const buttons = tablistRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      buttons?.[nextIndex]?.focus()
    }
  }

  return (
    <SelectionContainer className={`w-fit max-w-full !p-2 ${className}`}>
      <div
        ref={tablistRef}
        className={`flex items-center gap-0.5 md:gap-1 min-w-max ${SIZE_CLASSES[size].container}`}
        role="tablist"
        aria-orientation="horizontal"
      >
        {options.map((option, index) => {
          const isActive = value === option.id
          const isDisabled = option.disabled
          const tabId = `${instanceId}-tab-${option.id}`
          const panelId = `${instanceId}-panel-${option.id}`

          return (
            <button
              key={option.id}
              role="tab"
              id={tabId}
              aria-selected={isActive}
              aria-controls={panelId}
              aria-disabled={isDisabled}
              tabIndex={isActive ? 0 : -1}
              disabled={isDisabled}
              onClick={() => !isDisabled && onChange(option.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={`relative shrink-0 rounded-lg font-bold uppercase ${isActive ? 'tracking-tight' : 'tracking-widest'} transition-[color,opacity] duration-200 outline-none whitespace-nowrap h-full flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 ${SIZE_CLASSES[size].tab} ${isDisabled ? 'opacity-40 cursor-not-allowed' : `cursor-pointer ${isActive ? 'text-primary' : 'text-text-secondary border border-border-subtle light:text-[var(--material-tab-text-inactive)] light:hover:text-[var(--material-tab-text-hover)] light:hover:bg-white/5'}`}`}
            >
              {isActive && !isDisabled && (
                <motion.div
                  layoutId={`${instanceId}-segmented-pill`}
                  className="absolute inset-0 rounded-lg nav-active-surface"
                  transition={TAB_SPRING}
                />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                {option.label}
                {option.badge && <span className="flex-shrink-0">{option.badge}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </SelectionContainer>
  )
}

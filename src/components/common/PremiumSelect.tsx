import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown, Check } from 'lucide-react'

interface PremiumSelectOption {
  id: string
  name: string
}

interface PremiumSelectProps {
  icon?: LucideIcon
  value: string
  onChange: (value: string) => void
  options: PremiumSelectOption[]
  placeholder?: string
  label?: string
  disabled?: boolean
  className?: string
  maxVisible?: number
}

export function PremiumSelect({
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  label,
  disabled = false,
  className = '',
  maxVisible = 6,
}: PremiumSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const instanceId = useId()

  const isActive = value !== 'all' && value !== ''
  const selectedOption =
    options.find(o => String(o.id) === String(value)) ||
    (placeholder ? { id: 'all', name: placeholder } : options[0])

  const optionHeight = 44
  const popupMaxHeight = maxVisible * optionHeight

  const close = useCallback(() => {
    setIsOpen(false)
    setHighlightedIndex(-1)
    triggerRef.current?.focus()
  }, [])

  const selectOption = useCallback(
    (optId: string) => {
      onChange(optId)
      close()
    },
    [onChange, close],
  )

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, close])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, close])

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLElement>('[data-option]')
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, isOpen])

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        setIsOpen(prev => !prev)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) setIsOpen(true)
        break
    }
  }

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    const total = options.length + (placeholder ? 1 : 0)
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev + 1) % total)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev - 1 + total) % total)
        break
      case 'Home':
        e.preventDefault()
        setHighlightedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setHighlightedIndex(total - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          if (placeholder && highlightedIndex === 0) {
            selectOption('all')
          } else {
            const optIdx = placeholder ? highlightedIndex - 1 : highlightedIndex
            if (options[optIdx]) selectOption(String(options[optIdx].id))
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        close()
        break
    }
  }

  const listboxId = `${instanceId}-listbox`
  const listboxLabel = label || placeholder || 'Options'

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={listboxLabel}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(prev => !prev)
        }}
        onKeyDown={handleTriggerKeyDown}
        className={`
          w-full h-[44px] md:h-[48px] rounded-xl transition-all duration-200 flex items-center justify-between px-4 md:px-3.5 gap-2
          text-[11px] font-bold uppercase tracking-widest focus:outline-none
          border focus:border-primary
          ${disabled ? 'opacity-40 pointer-events-none' : ''}
          ${
            isActive
              ? 'bg-input-surface-active text-input-text-active border-input-border-active'
              : 'bg-input-bg text-input-text border-input-border hover:border-input-border-hover-active'
          }
        `}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {Icon && (
            <Icon
              size={16}
              className={`shrink-0 ${isActive ? 'text-primary' : 'text-text-secondary'}`}
            />
          )}
          <span className="truncate">{selectedOption?.name}</span>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          } ${isActive ? 'text-primary' : 'text-text-muted'}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={listRef}
            role="listbox"
            aria-label={listboxLabel}
            id={listboxId}
            tabIndex={-1}
            onKeyDown={handleListKeyDown}
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`
              absolute left-0 mt-1 z-[1000] min-w-full w-full
              rounded-2xl overflow-hidden
              bg-[var(--surface-floating)] border border-border-subtle
              shadow-elevation-4
            `}
            style={{ maxHeight: popupMaxHeight + 8 }}
          >
            <div
              className="overflow-y-auto overflow-x-hidden py-1 custom-scrollbar"
              style={{ maxHeight: popupMaxHeight }}
            >
              {placeholder && (
                <button
                  type="button"
                  role="option"
                  aria-selected={value === 'all'}
                  data-option
                  onClick={() => selectOption('all')}
                  onMouseEnter={() => setHighlightedIndex(0)}
                  className={`
                    w-full text-left px-4 h-[44px] flex items-center justify-between
                    text-[10px] font-bold uppercase tracking-widest
                    transition-colors duration-150
                    border-b border-border-subtle/50 last:border-b-0
                    ${
                      value === 'all'
                        ? 'bg-primary/20 text-primary'
                        : highlightedIndex === 0
                          ? 'bg-hover-bg/80 text-text-primary'
                          : 'text-text-primary hover:bg-hover-bg/60'
                    }
                  `}
                >
                  {placeholder}
                  {value === 'all' && <Check size={14} className="text-primary shrink-0" />}
                </button>
              )}
              {options.map((opt, idx) => {
                const isSelected = String(value) === String(opt.id)
                const itemIdx = placeholder ? idx + 1 : idx
                return (
                  <button
                    key={`${opt.id}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-option
                    onClick={() => selectOption(String(opt.id))}
                    onMouseEnter={() => setHighlightedIndex(itemIdx)}
                    className={`
                      w-full text-left px-4 h-[44px] flex items-center justify-between
                      text-[10px] font-bold uppercase tracking-widest
                      transition-colors duration-150
                      border-b border-border-subtle/50 last:border-b-0
                      ${
                        isSelected
                          ? 'bg-primary/20 text-primary'
                          : highlightedIndex === itemIdx
                            ? 'bg-hover-bg/80 text-text-primary'
                            : 'text-text-primary hover:bg-hover-bg/60'
                      }
                    `}
                  >
                    {opt.name}
                    {isSelected && <Check size={14} className="text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

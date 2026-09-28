import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown, Check } from 'lucide-react'
import { SELECT_POPUP_TRANSITION, GHOST_HOVER, FOCUS_RING } from './AntigravityMotion'
import { SelectionContainer } from './AntigravityLayout'
import { Portal } from './Floating'
import { useAnchoredFloating } from './useAnchoredFloating'

interface PremiumSelectOption {
  id: string
  name: string
}

/* Shared option button — eliminates copy-paste between placeholder and option items.
   Module scope so it is not re-created on every render (react-hooks rule). */
function OptionButton({
  isSelected,
  isHighlighted,
  onClick,
  onMouseEnter,
  children,
}: {
  isSelected: boolean
  isHighlighted: boolean
  onClick: () => void
  onMouseEnter: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      data-option
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`
        w-full text-left px-3 h-[40px] my-1 flex items-center justify-between
        text-[10px] font-bold uppercase tracking-widest
        ${GHOST_HOVER} ${FOCUS_RING}
        rounded-lg
        ${
          isSelected
            ? 'selection-active-text nav-active-surface'
            : isHighlighted
              ? 'text-text-secondary light:text-[var(--gold-300)] border border-border-subtle light:border-[var(--material-tab-pill-border)] light:hover:text-[var(--material-tab-text-hover)] light:hover:bg-white/5'
              : 'text-text-secondary light:text-[var(--gold-300)] border border-border-subtle light:border-[var(--material-tab-pill-border)] light:hover:text-[var(--material-tab-text-hover)] light:hover:bg-white/5'
        }
      `}
    >
      {children}
    </button>
  )
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

  const dismiss = useCallback(() => {
    setIsOpen(false)
    setHighlightedIndex(-1)
  }, [])

  const close = useCallback(() => {
    dismiss()
    /* Focus returns to the trigger without scroll-jumping the page (the
       trigger may be far off-screen when a scroll dismissed the menu). */
    triggerRef.current?.focus({ preventScroll: true })
  }, [dismiss])

  const selectOption = useCallback(
    (optId: string) => {
      onChange(optId)
      close()
    },
    [onChange, close],
  )

  /* Highlight index → option id. Index 0 is the placeholder row when present. */
  const selectAt = useCallback(
    (idx: number) => {
      if (idx < 0) return
      if (placeholder && idx === 0) {
        selectOption('all')
        return
      }
      const optIdx = placeholder ? idx - 1 : idx
      const opt = options[optIdx]
      if (opt) selectOption(String(opt.id))
    },
    [options, placeholder, selectOption],
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
      else if (e.key === 'Tab') dismiss()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, close, dismiss])

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLElement>('[data-option]')
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, isOpen])

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    const total = options.length + (placeholder ? 1 : 0)
    /* Index of the currently-selected row (placeholder-aware) — the combobox
       convention when opening via keyboard is to highlight the selection. */
    const selectedIdx = () => {
      const optIdx = options.findIndex(o => String(o.id) === String(value))
      if (optIdx >= 0) return placeholder ? optIdx + 1 : optIdx
      return 0
    }
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (isOpen) {
          if (highlightedIndex >= 0) selectAt(highlightedIndex)
          else dismiss()
        } else {
          setHighlightedIndex(selectedIdx())
          setIsOpen(true)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setHighlightedIndex(selectedIdx())
          setIsOpen(true)
        } else if (total > 0) {
          setHighlightedIndex(prev => (prev + 1) % total)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setHighlightedIndex(selectedIdx())
          setIsOpen(true)
        } else if (total > 0) {
          setHighlightedIndex(prev => (prev - 1 + total) % total)
        }
        break
      case 'Home':
        if (isOpen) {
          e.preventDefault()
          setHighlightedIndex(0)
        }
        break
      case 'End':
        if (isOpen) {
          e.preventDefault()
          setHighlightedIndex(total - 1)
        }
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
        selectAt(highlightedIndex)
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        dismiss()
        break
    }
  }

  const listboxId = `${instanceId}-listbox`
  const listboxLabel = label || placeholder || 'Options'

  /* The menu portals to <body> (Floating layer) so no ancestor overflow or
     stacking context can clip or bury it. Position is computed against the
     trigger rect with viewport collision handling; the canonical --z-dropdown
     layer keeps it above cards/toolbars/modals but below guards/toasts. */
  const floating = useAnchoredFloating(isOpen, triggerRef, listRef, {
    capHeight: popupMaxHeight + 8,
    offset: 4,
    margin: 8,
    onAnchorExitViewport: close,
  })

  return (
    <>
      <div className={`relative inline-block ${className}`}>
      <SelectionContainer className="p-1">
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
            relative w-full h-[44px] md:h-[48px] rounded-xl ${GHOST_HOVER} ${FOCUS_RING} flex items-center justify-between px-4 md:px-3.5 gap-2
            text-[11px] font-bold uppercase tracking-widest focus:outline-none
            ${disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}
            ${isActive ? '' : 'text-text-secondary border border-border-subtle light:border-[var(--material-tab-pill-border)] light:hover:text-[var(--material-tab-text-hover)] light:hover:bg-white/5'}
          `}
        >
          {isActive && (
            <div className="absolute inset-0 rounded-xl nav-active-surface" />
          )}
          <div className="relative z-10 flex items-center gap-2 overflow-hidden">
            {Icon && (
              <Icon
                size={16}
                className={`shrink-0 ${isActive ? 'selection-active-text' : 'text-text-secondary'}`}
              />
            )}
            <span className={`truncate ${isActive ? 'selection-active-text light:text-[var(--text-nav-active)] tracking-tight' : 'text-text-secondary light:text-[var(--gold-300)]'}`}>{selectedOption?.name}</span>
          </div>
          <ChevronDown
            size={14}
            className={`relative z-10 transition-transform duration-fast ease-standard shrink-0 ${
              isOpen ? 'rotate-180' : ''
            } ${isActive ? 'selection-active-text' : 'text-text-muted'}`}
          />
        </button>
      </SelectionContainer>
      </div>

      <Portal>
        <AnimatePresence>
          {isOpen && (
            /* Positional wrapper — owns fixed coordinates + layer token.
               The animated surface below keeps the approved menu appearance. */
            <div
              ref={listRef}
              className="fixed z-[var(--z-dropdown)] min-w-max max-w-72"
              style={{
                top: floating?.y,
                left: floating?.x,
                ...(floating?.placement === 'top' ? { transform: 'translateY(-100%)' } : null),
              }}
            >
              <motion.div
                role="listbox"
                aria-label={listboxLabel}
                id={listboxId}
                tabIndex={-1}
                onKeyDown={handleListKeyDown}
                initial={{ opacity: 0, y: floating?.placement === 'top' ? 4 : -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: floating?.placement === 'top' ? 4 : -4, scale: 0.97 }}
                transition={SELECT_POPUP_TRANSITION}
                className="
                  rounded-2xl overflow-hidden p-2
                  selection-surface
                  shadow-elevation-4
                "
                style={{ maxHeight: floating?.maxHeight }}
              >
            <div
              className="overflow-y-auto overflow-x-hidden p-2 custom-scrollbar"
              style={{ maxHeight: popupMaxHeight }}
            >
              {placeholder && (
                <OptionButton
                  isSelected={value === 'all'}
                  isHighlighted={highlightedIndex === 0}
                  onClick={() => selectOption('all')}
                  onMouseEnter={() => setHighlightedIndex(0)}
                >
                  {placeholder}
                  {value === 'all' && <Check size={14} className="text-primary shrink-0" />}
                </OptionButton>
              )}
              {options.map((opt, idx) => {
                const isSelected = String(value) === String(opt.id)
                const itemIdx = placeholder ? idx + 1 : idx
                return (
                  <OptionButton
                    key={`${opt.id}-${idx}`}
                    isSelected={isSelected}
                    isHighlighted={highlightedIndex === itemIdx}
                    onClick={() => selectOption(String(opt.id))}
                    onMouseEnter={() => setHighlightedIndex(itemIdx)}
                  >
                    <span className="truncate">{opt.name}</span>
                    {isSelected && <Check size={14} className="selection-active-text shrink-0" />}
                  </OptionButton>
                )
              })}
            </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  )
}

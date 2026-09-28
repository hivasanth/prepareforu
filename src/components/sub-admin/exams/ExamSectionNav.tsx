import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { SelectionContainer } from '../../common/AntigravityLayout'
import { TAB_SPRING } from '../../common/AntigravityAnimation'
import { GHOST_HOVER, FOCUS_RING } from '../../common/AntigravityMotion'

/* ─── ExamSectionNav ───────────────────────────────────────────────────────
 * Segmented navigation for the exam-detail views. Reuses the EduPanel
 * SelectionContainer + SegmentedFilter design language (Forest/gold surface,
 * animated nav-active-surface pill, FOCUS_RING, GHOST_HOVER) but bounds the
 * track in an OWN horizontal scroll container so a long list of sections never
 * causes the PAGE to overflow horizontally on tablet/mobile. Only this strip
 * scrolls; the active segment is scrolled into view on selection.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ExamSectionOption {
  id: string
  label: string
}

interface ExamSectionNavProps {
  options: ExamSectionOption[]
  value: string
  onChange: (id: string) => void
  ariaLabel?: string
  /** Stable id prefix shared with the tabpanel(s) this nav controls. */
  idPrefix: string
}

export function ExamSectionNav({ options, value, onChange, ariaLabel, idPrefix }: ExamSectionNavProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  // Keep the active segment visible when it changes (scroll into view).
  useEffect(() => {
    const track = trackRef.current
    const active = track?.querySelector<HTMLButtonElement>(`[data-active="true"]`)
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [value])

  const onKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex: number | null = null
    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % options.length
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + options.length) % options.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = options.length - 1

    if (nextIndex !== null) {
      e.preventDefault()
      onChange(options[nextIndex].id)
      const buttons = trackRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      buttons?.[nextIndex]?.focus()
    }
  }

  return (
    <SelectionContainer className="w-full" tilt={false}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        ref={trackRef}
        className="flex items-center gap-0.5 md:gap-1 overflow-x-auto custom-scrollbar py-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {options.map((option, index) => {
          const isActive = option.id === value
          const tabId = `${idPrefix}-tab-${option.id}`
          return (
            <button
              key={option.id}
              role="tab"
              id={tabId}
              aria-selected={isActive}
              aria-controls={`${idPrefix}-panel-${option.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(option.id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              data-active={isActive}
              className={`relative shrink-0 whitespace-nowrap rounded-lg font-bold uppercase h-[30px] md:h-[34px] px-3 md:px-4 text-[9px] md:text-[10px] ${isActive ? 'tracking-tight selection-active-text' : 'tracking-widest text-text-secondary light:text-[var(--gold-300)] border border-border-subtle light:border-[var(--material-tab-pill-border)] light:hover:text-[var(--material-tab-text-hover)] light:hover:bg-white/5'} ${GHOST_HOVER} ${FOCUS_RING} flex items-center justify-center gap-1.5 cursor-pointer`}
            >
              {isActive && (
                <motion.div
                  layoutId={`${idPrefix}-pill`}
                  className="absolute inset-0 rounded-lg nav-active-surface"
                  transition={TAB_SPRING}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">{option.label}</span>
            </button>
          )
        })}
      </div>
    </SelectionContainer>
  )
}

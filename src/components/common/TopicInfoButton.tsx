import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info } from 'lucide-react'
import { useCanHover } from '../../hooks/useCanHover'
import { ConfirmModal } from './SharedComponents'

interface TopicInfoButtonProps {
  displayTitle: string
  heading?: string
}

export function TopicInfoButton({ displayTitle, heading = 'Topic Name' }: TopicInfoButtonProps) {
  const canHover = useCanHover()
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsDialogOpen(true)
    }
  }, [])

  useEffect(() => {
    if (!isTooltipOpen) return
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsTooltipOpen(false)
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [isTooltipOpen])

  if (canHover) {
    return (
      <div
        className="relative"
        onMouseEnter={() => {
          clearTimeout(tooltipTimerRef.current)
          setIsTooltipOpen(true)
        }}
        onMouseLeave={() => {
          tooltipTimerRef.current = setTimeout(() => setIsTooltipOpen(false), 80)
        }}
        onFocus={() => setIsTooltipOpen(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsTooltipOpen(false)
          }
        }}
      >
        <button
          type="button"
          aria-label={`Show full ${heading.toLowerCase()}`}
          className="
            p-2.5 rounded-lg
            bg-gradient-to-br from-primary/15 to-primary/5
            border border-primary/20
            text-primary/70
            shadow-sm shadow-primary/5
            hover:bg-primary/20 hover:border-primary/40 hover:text-primary
            hover:shadow-md hover:shadow-primary/10
            active:shadow-sm active:translate-y-[1px]
            transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out
            cursor-pointer pointer-events-auto relative z-10
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
          "
        >
          <Info size={16} className="transition-transform duration-200 group-hover:scale-110" />
        </button>

        <AnimatePresence>
          {isTooltipOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              role="tooltip"
              aria-label={displayTitle}
              className="
                absolute top-full right-0 mt-2 z-50
                bg-card-bg border border-primary/20 rounded-xl p-3
                shadow-xl shadow-primary/10
                min-w-[200px] max-w-[280px]
                pointer-events-none
                ancient-overlay
              "
            >
              <p className="text-[13px] font-semibold text-text-primary leading-snug">
                {displayTitle}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsDialogOpen(true) }}
        onKeyDown={handleKeyDown}
        aria-label={`Show full ${heading.toLowerCase()}`}
        className="
          p-1.5 rounded-lg
          bg-gradient-to-br from-primary/15 to-primary/5
          border border-primary/20
          text-primary/70
          shadow-sm shadow-primary/5
          active:shadow-sm active:translate-y-[1px]
          transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out
          cursor-pointer pointer-events-auto relative z-10
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
        "
      >
        <Info size={16} />
      </button>

      <ConfirmModal
        open={isDialogOpen}
        onCancel={() => setIsDialogOpen(false)}
        title={heading}
        message={displayTitle}
        confirmLabel="OK"
      />
    </>
  )
}

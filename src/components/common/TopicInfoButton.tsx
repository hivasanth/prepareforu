import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, X } from 'lucide-react'
import { useCanHover } from '../../hooks/useCanHover'

interface TopicInfoButtonProps {
  displayTitle: string
  heading?: string
}

export function TopicInfoButton({ displayTitle, heading = 'Topic Name' }: TopicInfoButtonProps) {
  const canHover = useCanHover()
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsDialogOpen(true)
    }
  }, [])

  useEffect(() => {
    if (!isDialogOpen) return
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDialogOpen(false)
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [isDialogOpen])

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
            p-1.5 rounded-lg
            bg-gradient-to-br from-primary/15 to-primary/5
            border border-primary/20
            text-primary/70
            shadow-sm shadow-primary/5
            hover:bg-primary/20 hover:border-primary/40 hover:text-primary
            hover:shadow-md hover:shadow-primary/10
            active:shadow-sm active:translate-y-[1px]
            transition-all duration-200 ease-out
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
          transition-all duration-200 ease-out
          cursor-pointer pointer-events-auto relative z-10
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
        "
      >
        <Info size={16} />
      </button>

      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
            role="dialog"
            aria-modal="true"
            aria-label={heading}
            ref={dialogRef}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="
                relative bg-card-bg border border-primary/20 rounded-2xl p-6
                max-w-sm w-full shadow-2xl shadow-primary/15
              "
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-bold text-text-primary uppercase tracking-tight">
                  {heading}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  aria-label="Close"
                  className="
                    p-1 rounded-lg
                    text-text-secondary/60 hover:text-text-secondary
                    hover:bg-hover-bg transition-colors
                  "
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-[14px] text-text-secondary leading-relaxed font-medium">
                {displayTitle}
              </p>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="
                  mt-5 w-full py-2.5
                  bg-primary text-white
                  rounded-xl text-[11px] font-bold uppercase tracking-wider
                  hover:bg-primary-hover active:scale-[0.98]
                  transition-all duration-150
                "
              >
                OK
              </button>
            </motion.div>
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm -z-10"
              onClick={() => setIsDialogOpen(false)}
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

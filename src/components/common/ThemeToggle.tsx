import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { MOTION_DURATION, MOTION_EASE, FOCUS_RING, TOGGLE_SPRING } from './AntigravityMotion'

interface ThemeToggleProps {
  theme: 'light' | 'dark'
  onToggle: () => void
  disabled?: boolean
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggle,
  disabled = false,
  className = '',
}) => {
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      disabled={disabled}
      onClick={onToggle}
      className={`
        relative inline-flex items-center shrink-0
        w-[104px] h-[36px] rounded-full p-1
        appearance-none transition-interaction duration-slow ease-standard outline-none
        ${FOCUS_RING}
        ${isDark
          ? 'bg-hover-bg/60 border border-border-subtle'
          : 'selection-surface border-[var(--border-premium-width)] border-card-premium-border'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Sliding thumb */}
      <motion.span
        aria-hidden
        className={`
          relative z-10 flex items-center justify-center
          w-[28px] h-[28px] rounded-full shrink-0
          ${isDark
            ? 'bg-card-bg border border-border-subtle'
            : 'nav-active-surface border border-card-premium-border'
          }
        `}
        animate={{ x: isDark ? 68 : 0 }}
        transition={TOGGLE_SPRING}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
              transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard }}
              className="flex items-center justify-center"
            >
              <Moon size={14} className="text-text-primary" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, scale: 0.6, rotate: 30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: -30 }}
              transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard }}
              className="flex items-center justify-center"
            >
              <Sun size={14} className="text-text-primary" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>

      {/* Labels */}
      <span className="absolute inset-0 flex items-center px-[10px] pointer-events-none" aria-hidden>
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="dark-label"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.standard }}
              className="text-[10px] font-bold uppercase tracking-widest text-text-secondary"
            >
              Dark
            </motion.span>
          ) : (
            <motion.span
              key="light-label"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.standard }}
              className="ml-auto text-[10px] font-bold uppercase tracking-widest text-text-secondary"
            >
              Light
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  )
}

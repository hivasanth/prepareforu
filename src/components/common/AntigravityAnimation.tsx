import React from 'react'
import { motion } from 'framer-motion'

const PAGE_EASE = [0.25, 0.1, 0.25, 1] as const
const SECTION_EASE = [0.25, 0.1, 0.25, 1] as const

/** P2 Wave 4 — single source for the tab/segment pill spring (was duplicated
 *  inline in Tabs, SegmentedFilter and ThemeToggle). Values are identical to the
 *  certified render; render-neutral consolidation. */
export const TAB_SPRING = { type: 'spring', stiffness: 260, damping: 32, mass: 1.1 } as const

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: PAGE_EASE }}
    className={className}
  >
    {children}
  </motion.div>
)

interface SectionRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export const SectionReveal: React.FC<SectionRevealProps> = ({ children, className = '', delay = 0.08 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, ease: SECTION_EASE, delay }}
    className={className}
  >
    {children}
  </motion.div>
)

import React from 'react'
import { motion } from 'framer-motion'
import { PAGE_TRANSITION, SECTION_REVEAL } from './AntigravityMotion'

/* Phase 5.4E (D-169): all durations/easings now come from AntigravityMotion
   (the ONE motion language). PAGE_TRANSITION/SECTION_REVEAL mirror the
   certified 0.35s/0.28s renders through the 300/200ms tokens; TAB_SPRING is
   the certified spring (260/32/1.1), re-exported for existing consumers. */
export { TAB_SPRING } from './AntigravityMotion'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={PAGE_TRANSITION}
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
    transition={{ ...SECTION_REVEAL, delay }}
    className={className}
  >
    {children}
  </motion.div>
)

import React from 'react'
import { motion } from 'framer-motion'

const PAGE_EASE = [0.25, 0.1, 0.25, 1] as const
const SECTION_EASE = [0.25, 0.1, 0.25, 1] as const

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

const staggerParentVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } },
}

interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({ children, className = '' }) => (
  <motion.div
    variants={staggerParentVariants}
    initial="hidden"
    animate="show"
    className={className}
  >
    {children}
  </motion.div>
)

const staggerItemVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: SECTION_EASE } },
}

interface StaggerItemProps {
  children: React.ReactNode
  className?: string
}

export const StaggerItem: React.FC<StaggerItemProps> = ({ children, className = '' }) => (
  <motion.div variants={staggerItemVariants} className={className}>
    {children}
  </motion.div>
)

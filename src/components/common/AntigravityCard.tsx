import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

type CardVariant = 'elevated' | 'default' | 'subtle'

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  padding?: 16 | 20 | 24 | 0
  variant?: CardVariant
}

export const Card: React.FC<CardProps> = ({ children, className = '', padding, variant = 'default', ...props }) => {
  const { isDark } = useTheme()

  let paddingClass = ''
  if (padding !== undefined) {
    const paddingMap = {
      0: 'p-0',
      16: 'p-4',
      20: 'p-5',
      24: 'p-6',
    }
    paddingClass = paddingMap[padding] || 'p-4 md:p-5'
  } else {
    const defaultPaddingMap: Record<CardVariant, string> = {
      elevated: 'p-4 md:p-6',
      default:  'p-4 md:p-5',
      subtle:   'p-3 md:p-4',
    }
    paddingClass = defaultPaddingMap[variant]
  }

  const baseStyleClass = !isDark
    ? 'ancient-card'
    : {
        elevated: 'rounded-[18px] shadow-lg bg-card-bg brightness-[1.04]',
        default:  'rounded-[14px] shadow-md bg-card-bg border border-border-subtle/50',
        subtle:   'rounded-[12px] shadow-sm bg-card-bg/60 border border-border-subtle/30',
      }[variant]

  return (
    <motion.div
      className={`${baseStyleClass} ${paddingClass} ancient-3d-lift ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  color?: string
  loading?: boolean
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  unit,
  color = 'var(--primary)',
  loading = false,
  className = ''
}) => {
  const { isDark } = useTheme()

  let displayValue = value
  let displayUnit = unit

  if (!displayUnit) {
    const valStr = value.toString()
    const match = valStr.match(/^(.+?)(?:\s+([a-zA-Z%#]+)|(%))$/)
    if (match) {
      displayValue = match[1]
      displayUnit = match[2] || match[3]
    } else {
      displayValue = valStr
      displayUnit = ''
    }
  } else {
    const valStr = value.toString()
    if (valStr.endsWith(displayUnit)) {
      displayValue = valStr.slice(0, -displayUnit.length).trim()
    }
  }

  if (!isDark) {
    return (
      <div className={`ancient-stat-card ancient-3d-lift ${className}`}>
        <div className="stat-header">
          <p className="stat-label">{label}</p>
          <div className="stat-icon-wrap">
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
        <div className="stat-body">
          {loading ? (
             <div className="h-4 w-16 bg-hover-bg animate-pulse rounded mt-1" />
          ) : (
            <>
              <p className="stat-value">{displayValue}</p>
              {displayUnit && <p className="stat-unit">{displayUnit}</p>}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`
        h-[64px] sm:h-[72px] lg:h-[84px] px-3 sm:px-4 lg:px-5 py-3 sm:py-4 rounded-[12px] sm:rounded-[14px] shadow-sm flex items-center gap-2 sm:gap-3 lg:gap-4
        bg-card-bg border border-border-subtle/50 hover:bg-hover-bg/40 transition-all duration-300 ancient-3d-lift
        ${className}
      `}
    >
      <div
        className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-[8px] sm:rounded-[10px] lg:rounded-[12px] flex items-center justify-center flex-shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
      >
        <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
      </div>
      <div className="flex flex-col min-w-0 gap-0.5 sm:gap-1 flex-1">
        <p className="text-[9px] lg:text-[11px] font-bold text-text-secondary uppercase tracking-widest opacity-60 leading-none m-0">
          {label}
        </p>
        {loading ? (
          <div className="h-4 w-16 bg-hover-bg animate-pulse rounded mt-1" />
        ) : (
          <p className="text-[13px] sm:text-[15px] lg:text-[18px] font-black text-text-primary leading-tight m-0">
            {displayValue}{displayUnit ? (displayUnit === '%' ? '%' : ` ${displayUnit}`) : ''}
          </p>
        )}
      </div>
    </div>
  )
}

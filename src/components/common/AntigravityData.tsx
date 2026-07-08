import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { Label } from './AntigravityTypography'
import { IconBadge } from './IconBadge'

// ─── Tabs ─────────────────────────────────────────────────────────────────────
interface TabOption {
  id: string
  label: string
}

interface TabsProps {
  options: TabOption[]
  activeId: string
  onChange: (id: string) => void
  variant?: 'primary' | 'secondary'
  className?: string
  pillClassName?: string
}

export const Tabs: React.FC<TabsProps> = ({ options, activeId, onChange, variant = 'primary', className = '', pillClassName = '' }) => {
  const instanceId = React.useId()
  const isSecondary = variant === 'secondary'
  const { isDark } = useTheme()

  const containerClass = !isDark 
    ? `ancient-tab-track flex items-center gap-1 md:gap-2 p-1.5 min-w-max ${isSecondary ? 'h-[40px] md:h-[44px] opacity-90' : 'h-[44px] md:h-[52px]'}`
    : `flex items-center gap-1 md:gap-2 p-1.5 bg-hover-bg/60 rounded-[16px] border border-border-subtle/80 min-w-max ${isSecondary ? 'h-[40px] md:h-[44px] opacity-80' : 'h-[44px] md:h-[52px]'}`

  return (
    <div className={`w-full overflow-x-auto scrollbar-hide flex ${className}`}>
      <div className={containerClass}>
        {options.map((option) => {
          const isActive = activeId === option.id
          const textColor = !isDark 
            ? (isActive ? 'var(--tab-text-active, var(--text-primary))' : 'var(--tab-text-inactive, var(--text-secondary))')
            : (isActive ? 'var(--primary)' : 'var(--text-secondary)')

          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={`relative shrink-0 rounded-[12px] font-bold uppercase tracking-widest transition-all duration-200 outline-none whitespace-nowrap h-full ${isSecondary ? 'px-3 md:px-4 text-[10px]' : 'px-4 md:px-6 text-[11px] md:text-[12px]'}`}
              style={{ color: textColor }}
            >
              {isActive && (
                <motion.div
                  layoutId={`${instanceId}-tab-pill`}
                  className={`absolute inset-0 ${pillClassName || (!isDark ? 'ancient-tab-pill' : 'rounded-[12px] bg-card-bg border border-border-subtle shadow-md dark:shadow-none')}`}
                  transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
                />
              )}
              <span className={`relative z-10 ${isActive ? 'opacity-100 scale-105' : (!isDark ? 'opacity-85 hover:opacity-100' : 'opacity-70 hover:opacity-100')}`}>
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── AdminPageTitle ───────────────────────────────────────────────────────────
interface AdminPageTitleProps {
  children: React.ReactNode
  icon?: LucideIcon
  className?: string
}

export const AdminPageTitle: React.FC<AdminPageTitleProps> = ({
  children,
  icon: Icon,
  className = ''
}) => {
  const { isDark } = useTheme()
  
  if (isDark) {
    return (
      <div className={`flex items-center gap-3 ml-2 border-l border-border-subtle pl-3 overflow-hidden flex-1 min-w-0 ${className}`}>
        {Icon && (
          <IconBadge icon={Icon} size="md" className="flex-shrink-0" darkClassName="rounded-lg bg-primary/10 text-primary" />
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-xl font-black text-text-primary tracking-tight uppercase truncate">{children}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ml-4 p-1.5 px-4 rounded-[16px] ancient-tab-track shadow-md border-[#B07A14]/30 min-w-0 max-w-fit ${className}`}>
      {Icon && (
        <IconBadge icon={Icon} size="md" className="flex-shrink-0" darkClassName="rounded-lg bg-primary/10 text-primary" />
      )}
      <div className="flex flex-col min-w-0 pr-1">
        <span className="text-lg md:text-xl font-black font-cinzel text-[#DFC096] tracking-[0.08em] uppercase truncate drop-shadow-sm">
          {children}
        </span>
      </div>
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'primary' | 'secondary'

export interface BadgeProps {
  variant?: BadgeVariant
  icon?: LucideIcon
  pulse?: boolean
  className?: string
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  icon: Icon,
  pulse = false,
  className = '',
  children,
}) => {
  const variants: Record<BadgeVariant, string> = {
    default:   'bg-hover-bg text-text-secondary border-border-subtle',
    success:   'bg-success/10 text-success border-success/20',
    danger:    'bg-danger/10 text-danger border-danger/20',
    warning:   'bg-warning/10 text-warning border-warning/20',
    primary:   'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  }

  return (
    <div
      className={`
        h-7 px-3 rounded-[14px] text-[10px] font-bold uppercase tracking-widest
        border flex items-center gap-1.5 w-fit
        ${variants[variant]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {Icon && <Icon size={12} />}
      {children}
    </div>
  )
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
type ProgressBarColor = 'primary' | 'success' | 'danger' | 'warning'

interface ProgressBarProps {
  value: number
  color?: ProgressBarColor
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'primary',
  className = '',
}) => {
  const colors: Record<ProgressBarColor, string> = {
    primary: 'bg-primary',
    success: 'bg-success',
    danger:  'bg-danger',
    warning: 'bg-warning',
  }

  return (
    <div className={`w-full bg-hover-bg rounded-full overflow-hidden h-1.5 ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out ${colors[color]}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

// ─── MetricBlock ──────────────────────────────────────────────────────────────
export const MetricBlock: React.FC<{ label: string; value: string | number; secondary?: string; color?: string }> = ({ label, value, secondary, color = 'var(--text-primary)' }) => (
  <div className="flex flex-col gap-1">
    <Label>{label}</Label>
    <div className="flex items-baseline gap-2">
      <span className="text-[20px] font-black tracking-tight" style={{ color }}>{value}</span>
      {secondary && <Label>{secondary}</Label>}
    </div>
  </div>
)

// ─── DataGrid ─────────────────────────────────────────────────────────────────
export interface DataGridColumn<T = any> {
  key: string
  label: React.ReactNode
  align?: 'left' | 'center' | 'right'
  headerClassName?: string
  cellClassName?: string
  render?: (value: any, row: T) => React.ReactNode
}

interface DataGridProps<T extends Record<string, any> = any> {
  columns: DataGridColumn<T>[]
  rows: T[]
  rowKey: string
  renderRow?: (row: T, index: number) => React.ReactNode
  className?: string
}

export function DataGrid<T extends Record<string, any>>({
  columns,
  rows,
  rowKey,
  renderRow,
  className = '',
}: DataGridProps<T>) {
  const { isDark } = useTheme()
  const alignClass = {
    left:   'text-left',
    center: 'text-center',
    right:  'text-right',
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={`w-full text-left ${!isDark ? 'border-separate border-spacing-y-1' : 'border-collapse'}`}>
        <thead>
          <tr className={`border-b ${!isDark ? 'bg-primary/5' : 'bg-hover-bg/50 border-border-subtle'}`}>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`
                  px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest
                  ${col.align ? alignClass[col.align] : 'text-left'}
                  ${col.headerClassName ?? ''}
                `}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle/10">
          {rows.map((row, idx) =>
            renderRow ? (
              renderRow(row, idx)
            ) : (
              <tr
                key={row[rowKey]}
                className="group hover:bg-hover-bg/30 transition-colors ancient-3d-lift"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`
                      px-6 py-5
                      ${col.align ? alignClass[col.align] : ''}
                      ${col.cellClassName ?? ''}
                    `}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : (row[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  )
}

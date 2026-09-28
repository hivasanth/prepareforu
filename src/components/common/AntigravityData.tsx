import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { Label } from './AntigravityTypography'
import { TAB_SPRING } from './AntigravityAnimation'
import { IconBadge } from './IconBadge'
import { Checkbox } from './AntigravityForm'
import { ROW_HOVER } from './AntigravityCard'
import { useTheme } from '../../context/ThemeContext'
import { Pill } from './Pill'
import { TRANSITION_INTERACTION, FOCUS_RING } from './AntigravityMotion'

// ─── Tabs ─────────────────────────────────────────────────────────────────────
export interface TabOption {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  disabled?: boolean
}

export type TabsSize = 'sm' | 'md' | 'lg'

interface TabsProps {
  options: TabOption[]
  activeId: string
  onChange: (id: string) => void
  variant?: 'primary' | 'secondary'
  size?: TabsSize
  className?: string
  pillClassName?: string
  /** Accessible name for the tablist. */
  ariaLabel?: string
  /** Strip inner container styling (bg, border, shadow, rounding) for use inside a parent wrapper */
  bare?: boolean
  /** D-2: opt-in deterministic id prefix for ARIA tab <-> panel linkage.
   * When set, each tab gets `id={idBase}-tab-{id}` and
   * `aria-controls={idBase}-panel-{id}`; the OPT-IN caller is responsible for
   * rendering a matching `role="tabpanel"` with `id={idBase}-panel-{id}` and
   * `aria-labelledby={idBase}-tab-{id}`. MUST be page-unique when used.
   * Without this prop the legacy `useId()` behaviour is preserved exactly and
   * tabs never emit an aria-controls reference (BUG-09 contract). */
  idBase?: string
}

export const Tabs: React.FC<TabsProps> = ({ options, activeId, onChange, variant = 'primary', size, className = '', pillClassName = '', ariaLabel, bare = false, idBase }) => {
  const instanceId = React.useId()
  const isSecondary = variant === 'secondary'
  const { isDark } = useTheme()
  const tablistRef = React.useRef<HTMLDivElement>(null)

  const resolvedSize = size ?? (isSecondary ? 'sm' : 'md')

  const sizeClasses: Record<TabsSize, { tab: string; container: string }> = {
    sm: { tab: 'px-3 md:px-4 text-[10px]', container: 'h-[40px] md:h-[44px]' },
    md: { tab: 'px-4 md:px-6 text-[11px] md:text-[12px]', container: 'h-[44px] md:h-[52px]' },
    lg: { tab: 'px-5 md:px-7 text-[12px] md:text-[13px]', container: 'h-[48px] md:h-[56px]' },
  }

  const onKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    const enabledIndices = options.map((o, i) => o.disabled ? -1 : i).filter(i => i >= 0)
    const currentEnabledPos = enabledIndices.indexOf(currentIndex)
    let nextEnabledPos: number | null = null

    if (e.key === 'ArrowRight') {
      nextEnabledPos = (currentEnabledPos + 1) % enabledIndices.length
    } else if (e.key === 'ArrowLeft') {
      nextEnabledPos = (currentEnabledPos - 1 + enabledIndices.length) % enabledIndices.length
    } else if (e.key === 'Home') {
      nextEnabledPos = 0
    } else if (e.key === 'End') {
      nextEnabledPos = enabledIndices.length - 1
    }

    if (nextEnabledPos !== null) {
      e.preventDefault()
      const nextIndex = enabledIndices[nextEnabledPos]
      onChange(options[nextIndex].id)
      const buttons = tablistRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      buttons?.[nextIndex]?.focus()
    }
  }

  /* D-123: dark is the app baseline; the pill branches on the app theme (React isDark),
     not the OS prefers-color-scheme. Strings reproduce the certified renders exactly. */
  const pillCls = isDark
    ? 'rounded-xl bg-card-bg border border-border-subtle shadow-elevation-1'
    : 'rounded-xl bg-[image:var(--material-tab-pill-surface)] border border-[var(--material-tab-pill-border)] shadow-tab-pill-light'

  const renderTab = (option: TabOption, index: number, tightActive: boolean) => {
    const isActive = activeId === option.id
    const isDisabled = option.disabled
    /* FIX-1: the bare variant sits on the nav/forest SelectionContainer surface,
       so Light Mode unselected text follows the navigation language
       (--text-nav-secondary gold) instead of the generic --text-secondary.
       Dark Mode keeps text-text-secondary; the non-bare track is unchanged. */
    const inactiveText = tightActive
      ? 'text-text-secondary light:text-[var(--text-nav-secondary)]'
      : 'text-text-secondary'
    /* D-2: when the caller opts into deterministic ids (idBase), the tab only
       emits aria-controls when the caller also owns a real named panel. The
       legacy useId() path carries NO aria-controls (BUG-09: never reference a
       panel that does not exist). */
    const tabId = idBase ? `${idBase}-tab-${option.id}` : `${instanceId}-tab-${option.id}`
    const panelId = idBase ? `${idBase}-panel-${option.id}` : undefined

    return (
      <button
        key={option.id}
        role="tab"
        id={tabId}
        aria-controls={panelId}
        aria-selected={isActive}
        aria-disabled={isDisabled}
        tabIndex={isActive ? 0 : -1}
        disabled={isDisabled}
        onClick={() => !isDisabled && onChange(option.id)}
        onKeyDown={(e) => onKeyDown(e, index)}
        className={`relative shrink-0 rounded-xl font-bold uppercase ${tightActive ? (isActive ? 'tracking-tight' : 'tracking-widest') : 'tracking-widest'} ${TRANSITION_INTERACTION} ${FOCUS_RING} whitespace-nowrap h-full flex items-center justify-center gap-1.5 ${sizeClasses[resolvedSize].tab} ${isDisabled ? 'opacity-40 cursor-not-allowed' : `cursor-pointer ${isActive ? 'selection-active-text' : `${inactiveText} border border-border-subtle light:border-[var(--material-tab-pill-border)] light:hover:text-[var(--material-tab-text-hover)] light:hover:bg-white/5`}`}`}
      >
        {isActive && !isDisabled && (
          <motion.div
            layoutId={`${instanceId}-tab-pill`}
            className={`absolute inset-0 rounded-xl ${pillClassName || (tightActive ? 'nav-active-surface' : pillCls)}`}
            transition={TAB_SPRING}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
          {option.label}
          {option.badge && <span className="flex-shrink-0">{option.badge}</span>}
        </span>
      </button>
    )
  }

  return (
    <div className={`w-full overflow-x-auto ${bare ? 'custom-scrollbar' : 'scrollbar-hide'} flex ${className}`} role="tablist" aria-orientation="horizontal" aria-label={ariaLabel}>
      {bare ? (
        <div ref={tablistRef} className={`flex items-center gap-1 md:gap-2 min-w-max mx-auto lg:mx-0 ${sizeClasses[resolvedSize].container}`}>
          {options.map((option, index) => renderTab(option, index, true))}
        </div>
      ) : (
        <div ref={tablistRef} className={`${!isDark ? `bg-[image:var(--material-tab-track-surface)] border border-[var(--material-tab-track-border)] shadow-tab-track flex items-center gap-1 md:gap-2 p-1.5 min-w-max rounded-2xl ${sizeClasses[resolvedSize].container} ${isSecondary ? 'opacity-90' : ''}` : `flex items-center gap-1 md:gap-2 p-1.5 bg-hover-bg/60 rounded-2xl border border-border-subtle/80 min-w-max ${sizeClasses[resolvedSize].container} ${isSecondary ? 'opacity-80' : ''}`}`}>
          {options.map((option, index) => renderTab(option, index, false))}
        </div>
      )}
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
  return (
    <div className={`flex items-center gap-3 ml-2 border-l border-border-subtle pl-3 overflow-hidden flex-1 min-w-0 ${className}`}>
      {Icon && (
        <IconBadge icon={Icon} size="md" status="primary" className="flex-shrink-0 rounded-lg" />
      )}
      <div className="flex flex-col min-w-0">
        <span className="text-xl font-black text-text-title tracking-tight uppercase truncate">{children}</span>
      </div>
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
/* Phase 5.4D: Badge is now a thin wrapper over the Pill primitive. Its legacy
   variant/size API maps directly onto Pill's certified variant/size recipes,
   so the DS-005 render contract (md: h-7 px-3 rounded-[14px] text-[10px];
   variants: bg-[color]/15 text-[color] border-[color]/30; default: neutral
   border language) is preserved exactly. No custom styling exists here. */
type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'primary' | 'secondary'
/* Full Pill size scale — every value maps to Pill's certified recipes. */
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

export interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: LucideIcon
  pulse?: boolean
  /** Fully curved (pill) radius — overrides the size's certified radius. */
  curved?: boolean
  className?: string
  /** Native hover tooltip — surfaces truncated content (e.g. coupon codes). */
  title?: string
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  icon,
  pulse = false,
  curved = false,
  className = '',
  title,
  children,
}) => (
  <Pill variant={variant} size={size} icon={icon} pulse={pulse} curved={curved} className={className} title={title}>
    {children}
  </Pill>
)

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
    <div
      className={`w-full rounded-full overflow-hidden h-1.5 bg-hover-bg/60 border border-border-subtle/40 ${className}`}
      role="progressbar"
      aria-valuenow={Math.min(100, Math.max(0, value))}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-slow ease-standard ${colors[color]}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

// ─── MetricBlock ──────────────────────────────────────────────────────────────
interface MetricBlockProps {
  label: string
  value: string | number
  secondary?: string
  color?: string
  /** When "metric", renders inside a carved container (exam card metric boxes). */
  variant?: 'default' | 'metric'
}

const METRIC_CONTAINER =
  'bg-hover-bg/20 p-3 rounded-xl border border-border-subtle/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] light:bg-card-bg/30 light:border-stat-card-border/20'

export const MetricBlock: React.FC<MetricBlockProps> = ({ label, value, secondary, color = 'var(--text-primary)', variant = 'default' }) => {
  const isDanger = color === 'var(--danger)'
  const content = (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <div className="flex items-baseline gap-2">
        <span
          className={`text-[20px] font-black tracking-tight ${isDanger ? 'text-danger bg-danger/20 px-2.5 py-0.5 -mx-0.5 rounded-lg' : 'text-text-primary'}`}
          style={color !== 'var(--text-primary)' && !isDanger ? { color } : undefined}
        >
          {value}
        </span>
        {secondary && <Label>{secondary}</Label>}
      </div>
    </div>
  )

  if (variant === 'metric') {
    return <div className={METRIC_CONTAINER}>{content}</div>
  }
  return content
}

// ─── DataGrid ─────────────────────────────────────────────────────────────────
export type DataGridSortDirection = 'asc' | 'desc' | null

export interface DataGridColumn<T = any> {
  key: string
  label: React.ReactNode
  align?: 'left' | 'center' | 'right'
  headerClassName?: string
  cellClassName?: string
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
  sortKey?: string
}

interface DataGridProps<T extends Record<string, any> = any> {
  columns: DataGridColumn<T>[]
  rows: T[]
  rowKey: string
  renderRow?: (row: T, index: number) => React.ReactNode
  className?: string
  ariaLabel?: string
  ariaLabelledBy?: string
  stickyHeader?: boolean
  selectable?: boolean
  selectedRows?: Set<string | number>
  onSelectionChange?: (selected: Set<string | number>) => void
  sortColumn?: string
  sortDirection?: DataGridSortDirection
  onSort?: (column: string, direction: DataGridSortDirection) => void
  striped?: boolean
}

export function DataGrid<T extends Record<string, any>>({
  columns,
  rows,
  rowKey,
  renderRow,
  className = '',
  ariaLabel,
  ariaLabelledBy,
  stickyHeader = false,
  selectable = false,
  selectedRows,
  onSelectionChange,
  sortColumn,
  sortDirection,
  onSort,
  striped = false,
}: DataGridProps<T>) {
  const alignClass = {
    left:   'text-left',
    center: 'text-center',
    right:  'text-right',
  }

  const allSelected = rows.length > 0 && selectedRows?.size === rows.length
  const someSelected = selectedRows && selectedRows.size > 0 && !allSelected

  const handleSelectAll = () => {
    if (!onSelectionChange) return
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(rows.map(r => r[rowKey])))
    }
  }

  const handleSelectRow = (key: string | number) => {
    if (!onSelectionChange || !selectedRows) return
    const next = new Set(selectedRows)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onSelectionChange(next)
  }

  const handleSort = (col: DataGridColumn<T>) => {
    if (!col.sortable || !onSort) return
    const nextDir = sortColumn === col.key
      ? sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc'
      : 'asc'
    onSort(col.sortKey ?? col.key, nextDir)
  }

  const renderSortIcon = (col: DataGridColumn<T>) => {
    if (!col.sortable) return null
    if (sortColumn !== col.key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover/col:opacity-40 transition-opacity" />
    if (sortDirection === 'asc') return <ArrowUp className="w-3 h-3 ml-1 text-primary" />
    if (sortDirection === 'desc') return <ArrowDown className="w-3 h-3 ml-1 text-primary" />
    return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse" aria-label={ariaLabel} aria-labelledby={ariaLabelledBy}>
        <thead>
          <tr className={`border-b bg-hover-bg/50 border-border-subtle ${stickyHeader ? 'sticky top-0 z-20' : ''}`}>
            {selectable && (
              <th scope="col" className="px-4 py-4 w-12">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSelectAll}
                  ariaLabel="Select all rows"
                  className="justify-center"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`
                  px-6 py-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest
                  ${col.align ? alignClass[col.align] : 'text-left'}
                  ${col.sortable ? 'cursor-pointer select-none group/col' : ''}
                  ${col.headerClassName ?? ''}
                `}
                onClick={() => handleSort(col)}
                aria-sort={sortColumn === col.key ? (sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none') : undefined}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {renderSortIcon(col)}
                </span>
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
                className={`
                  group ${ROW_HOVER}
                  ${selectedRows?.has(row[rowKey]) ? 'bg-primary/5' : ''}
                  ${striped && idx % 2 === 1 ? 'bg-hover-bg/20' : ''}
                `}
              >
                {selectable && (
                  <td className="px-4 py-5 w-12">
                    <Checkbox
                      checked={selectedRows?.has(row[rowKey]) ?? false}
                      onChange={() => handleSelectRow(row[rowKey])}
                      ariaLabel={`Select row ${idx + 1}`}
                      className="justify-center"
                    />
                  </td>
                )}
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

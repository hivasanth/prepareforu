import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const PageContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`max-w-[1280px] mx-auto px-2 sm:px-4 md:px-5 lg:px-6 xl:px-8 py-6 md:py-10 ${className}`}>
      {children}
    </div>
  )
}

export const SectionBlock: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`space-y-[12px] ${className}`}>
    {children}
  </div>
)

export const PageHeader: React.FC<{
  title: string
  subtitle?: string
  className?: string
  icon?: LucideIcon
  actions?: React.ReactNode
  [key: string]: any
}> = ({
  title,
  subtitle,
  className = '',
  icon: Icon,
  actions,
}) => (
  <header className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${className}`}>
    <div className="space-y-[4px] min-w-0">
      <div className="flex items-center gap-[8px]">
        {Icon && <Icon size={18} className="text-primary shrink-0" />}
        <h1 className="text-[20px] md:text-[24px] font-bold text-text-primary tracking-tight m-0 truncate">
          {title}
        </h1>
      </div>
      {subtitle && <p className="text-[12px] md:text-[13px] text-text-secondary opacity-70 leading-relaxed m-0">{subtitle}</p>}
    </div>
    {actions && (
      <div className="flex items-center gap-2 shrink-0">
        {actions}
      </div>
    )}
  </header>
)

export const SectionWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`space-y-[14px] ${className}`}>
    {children}
  </div>
)

type GapKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'section'

export const Stack: React.FC<{
  children: React.ReactNode
  gap?: GapKey | number
  direction?: 'col' | 'row'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between'
  className?: string
}> = ({
  children,
  gap = 'md',
  direction = 'col',
  align = 'stretch',
  justify = 'start',
  className = ''
}) => {
  const alignMap = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' }
  const justifyMap = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between' }
  const spacingMap: Record<GapKey, string> = {
    xs: 'gap-[4px]',
    sm: 'gap-[8px]',
    md: 'gap-[16px]',
    lg: 'gap-[24px]',
    xl: 'gap-[32px]',
    xxl: 'gap-[48px]',
    section: 'gap-[32px]',
  }
  const gapClass = typeof gap === 'number' ? '' : (spacingMap[gap] ?? 'gap-[12px]')
  const gapStyle = typeof gap === 'number' ? { gap: `${gap}px` } : undefined
  return (
    <div
      className={`flex flex-${direction} ${alignMap[align]} ${justifyMap[justify]} ${gapClass} ${className}`}
      style={gapStyle}
    >
      {children}
    </div>
  )
}

export const Grid: React.FC<{
  children: React.ReactNode
  cols?: 1|2|3|4
  sm?: 1|2|3|4
  md?: 1|2|3|4
  lg?: 1|2|3|4
  gap?: number
  className?: string
}> = ({ children, cols = 1, sm, md, lg, gap, className = '' }) => {
  const hasResponsive = sm !== undefined || md !== undefined || lg !== undefined
  const finalColClass = hasResponsive
    ? [
        `grid-cols-${cols}`,
        sm ? `sm:grid-cols-${sm}` : '',
        md ? `md:grid-cols-${md}` : '',
        lg ? `lg:grid-cols-${lg}` : '',
      ].filter(Boolean).join(' ')
    : ({
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      } as Record<number, string>)[cols]
  const gapClass = gap !== undefined ? '' : 'gap-4 md:gap-5 lg:gap-6'
  const gapStyle = gap !== undefined ? { gap: `${gap}px` } : undefined
  return (
    <div className={`grid ${finalColClass} ${gapClass} ${className}`} style={gapStyle}>
      {children}
    </div>
  )
}

export const SectionHeader: React.FC<{
  title: string
  action?: React.ReactNode
  className?: string
}> = ({ title, action, className = '' }) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <h2 className="text-[16px] sm:text-[18px] lg:text-[20px] font-semibold tracking-tight m-0">
        {title}
      </h2>
      {action && (
        <div className="h-8 flex items-center">
          {action}
        </div>
      )}
    </div>
  )
}

export const FilterBar: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 md:p-4 rounded-[14px] bg-card-bg/50 border border-border-subtle ${className}`}>
    {children}
  </div>
)

interface SelectOption {
  id: string
  name: string
}

interface SelectProps {
  label?: string
  icon?: LucideIcon
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const FilterSelect: React.FC<SelectProps> = ({
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const isActive = value !== 'all' && value !== ''

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => String(o.id) === String(value)) || (placeholder ? { id: 'all', name: placeholder } : options[0])

  return (
    <div ref={dropdownRef} className={`relative w-full md:w-auto ${isOpen ? 'z-[110]' : 'z-auto'} ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full h-[44px] md:h-[48px] rounded-[12px] transition-all flex items-center justify-between px-4 md:px-3.5 gap-2
          text-[11px] font-black uppercase tracking-widest focus:outline-none border
          ${isActive ? 'bg-primary/10 text-primary border-primary/20' : 'bg-hover-bg/60 text-text-primary border-border-subtle opacity-70 hover:opacity-100'}
        `}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {Icon && <Icon size={16} className={`shrink-0 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />}
          <span className="truncate">{selectedOption?.name}</span>
        </div>
        <ChevronDown size={14} className={`transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''} ${isActive ? 'text-primary' : 'text-text-secondary opacity-40'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={'absolute top-full left-0 right-0 z-[1000] border rounded-xl overflow-hidden shadow-2xl min-w-[200px] bg-card-bg border-border-subtle'}
          >
            <div className="py-1">
              {placeholder && (
                <button
                  type="button"
                  onClick={() => { onChange('all'); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    value === 'all' 
                      ? 'bg-primary/20 text-primary' 
                      : 'text-text-primary hover:bg-white/5'
                  }`}
                >
                  {placeholder}
                </button>
              )}
              {options.map((opt, idx) => (
                <button
                  key={`${opt.id}-${idx}`}
                  type="button"
                  onClick={() => { onChange(String(opt.id)); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-t border-border-subtle/5 first:border-t-0 ${
                    String(value) === String(opt.id)
                      ? 'bg-primary/20 text-primary' 
                      : 'text-text-primary hover:bg-white/5'
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import type { ReactNode } from 'react'
import { useTheme } from '../../../context/ThemeContext'

interface AdminCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'subtle'
  role?: string
  'aria-label'?: string
  'aria-live'?: 'off' | 'assertive' | 'polite'
}

export function AdminCard({ children, className = '', variant = 'default', ...rest }: AdminCardProps) {
  const { isDark } = useTheme()

  const variants: Record<string, string> = {
    default: !isDark ? 'ancient-card shadow-xl border-[var(--ancient-gold)]/20' : '',
    elevated: !isDark ? 'ancient-nav-item-active shadow-lg' : 'bg-primary text-white shadow-primary/25',
    subtle: !isDark ? 'ancient-card' : 'border-border-subtle/20',
  }

  return (
    <div className={`${variants[variant]} ${className}`} {...rest}>
      {children}
    </div>
  )
}

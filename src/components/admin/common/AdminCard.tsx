import type { ReactNode } from 'react'
import { useTheme } from '../../../context/ThemeContext'

interface AdminCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'subtle'
}

export function AdminCard({ children, className = '', variant = 'default' }: AdminCardProps) {
  const { isDark } = useTheme()

  const variants: Record<string, string> = {
    default: !isDark ? 'ancient-card shadow-xl border-[var(--ancient-gold)]/20' : '',
    elevated: !isDark ? 'ancient-nav-item-active shadow-lg' : 'bg-primary text-white shadow-primary/25',
    subtle: !isDark ? 'ancient-card' : 'border-border-subtle/20',
  }

  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}

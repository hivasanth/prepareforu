import type { ElementType, ReactNode } from 'react'
import { useTheme } from '../../../context/ThemeContext'

interface AdminTextProps {
  as?: ElementType
  variant?: 'cinzel' | 'garamond' | 'cinzel-value' | 'garamond-value'
  className?: string
  children: ReactNode
}

export function AdminText({
  as: Tag = 'span',
  variant = 'cinzel',
  className = '',
  children,
}: AdminTextProps) {
  const { isDark } = useTheme()

  const classes: Record<string, string> = {
    'cinzel': !isDark ? 'font-cinzel' : '',
    'garamond': !isDark ? 'font-garamond italic' : '',
    'cinzel-value': `${!isDark ? 'font-cinzel' : ''}`,
    'garamond-value': `${!isDark ? 'font-garamond italic' : ''}`,
  }

  return (
    <Tag className={`${classes[variant]} ${className}`}>
      {children}
    </Tag>
  )
}

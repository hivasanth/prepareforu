import type { ElementType, ReactNode } from 'react'
import { useTheme } from '../../context/ThemeContext'

type CanonicalSize = 'body' | 'metadata' | 'heading'

const canonicalSizeTokens: Record<CanonicalSize, string> = {
  'body': 'var(--text-body)',
  'metadata': 'var(--text-metadata)',
  'heading': 'var(--text-heading)',
}

const canonicalLineHeightTokens: Partial<Record<CanonicalSize, string>> = {
  'metadata': 'var(--lh-metadata)',
}

interface AdminTextProps {
  as?: ElementType
  variant?: 'cinzel' | 'garamond' | 'sans'
  size?: CanonicalSize
  className?: string
  children: ReactNode
}

export function AdminText({
  as: Tag = 'span',
  variant = 'cinzel',
  size,
  className = '',
  children,
}: AdminTextProps) {
  const { isDark } = useTheme()

  const classes: Record<string, string> = {
    'cinzel': !isDark ? 'font-cinzel' : '',
    'garamond': !isDark ? 'font-garamond italic' : '',
    'sans': '',
  }

  const fontSize = size ? canonicalSizeTokens[size] : undefined
  const lineHeight = size ? canonicalLineHeightTokens[size] : undefined

  return (
    <Tag
      className={`${classes[variant]} ${className}`}
      style={fontSize || lineHeight ? { fontSize, lineHeight } : undefined}
    >
      {children}
    </Tag>
  )
}

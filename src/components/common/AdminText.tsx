import type { ElementType, ReactNode } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { Typography } from './Typography'

/* ─── Phase 5.4C wrapper layer ───────────────────────────────────────────────
   AdminText now renders through the single Foundation `Typography` component.
   Its size sub-language (body/metadata/heading tokens) and the light-only
   cinzel/garamond identity variants are preserved exactly for render-identity;
   the size→token mapping is a thin compatibility surface (retired during
   consumer migration phases).
--------------------------------------------------------------------------- */

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
  /** Forwarded to Typography — enables aria-describedby target linkage. */
  id?: string
  children: ReactNode
}

export function AdminText({
  as = 'span',
  variant = 'cinzel',
  size,
  className = '',
  id,
  children,
}: AdminTextProps) {
  const { isDark } = useTheme()

  const fontVariant = !isDark ? variant : 'sans'

  const fontSize = size ? canonicalSizeTokens[size] : undefined
  const lineHeight = size ? canonicalLineHeightTokens[size] : undefined

  return (
    <Typography
      as={as}
      id={id}
      color="inherit"
      variant={fontVariant}
      className={className}
      style={fontSize || lineHeight ? { fontSize, lineHeight } : undefined}
    >
      {children}
    </Typography>
  )
}

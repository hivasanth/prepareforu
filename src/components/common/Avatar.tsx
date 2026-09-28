import type { ReactNode } from 'react'
import { AdminIconWrap } from './AdminIconWrap'

export type AvatarSize = 'sm' | 'md' | 'lg'
export type AvatarShape = 'circle' | 'square'

interface AvatarProps {
  /** Person's display name — first character becomes the monogram */
  name?: string | null
  /** Fallback email — supplies the monogram when name is empty */
  email?: string | null
  /** Explicit monogram when neither name nor email resolve (default '?') */
  fallback?: string
  size?: AvatarSize
  shape?: AvatarShape
  /** Hide from assistive tech when the person's name is adjacent visible text */
  decorative?: boolean
  /** Accessible label — used when decorative is false */
  ariaLabel?: string
  /** Optional status indicator rendered in the corner (e.g., verified) */
  status?: ReactNode
  className?: string
}

const FONT_SIZE: Record<AvatarSize, string> = {
  sm: 'text-[10px]',
  md: 'text-sm',
  lg: 'text-lg',
}

function deriveInitial(name?: string | null, email?: string | null): string | null {
  const source = name?.trim() || email?.trim()
  if (!source) return null
  return source[0].toUpperCase()
}

export function Avatar({
  name,
  email,
  fallback = '?',
  size = 'md',
  shape = 'circle',
  decorative = true,
  ariaLabel,
  status,
  className = '',
}: AvatarProps) {
  const initial = deriveInitial(name, email) ?? fallback

  const a11y = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': ariaLabel ?? `${name?.trim() || fallback}'s avatar` }

  return (
    <div className="relative inline-flex shrink-0" {...a11y}>
      <AdminIconWrap
        size={size}
        rounded={shape === 'circle' ? 'full' : 'md'}
        className={`${FONT_SIZE[size]} ${className}`}
      >
        {initial}
      </AdminIconWrap>
      {status && (
        <div className="absolute -bottom-1 -right-1">{status}</div>
      )}
    </div>
  )
}

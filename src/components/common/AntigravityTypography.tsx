import React from 'react'
import { Typography } from './Typography'

/* ─── Phase 5.4C wrapper layer ───────────────────────────────────────────────
   Every legacy primitive now renders through the single Foundation `Typography`
   component. Public APIs are unchanged (backward compatible). Rendered output is
   byte-identical to the pre-5.4C primitives: same tags, same className sets,
   same inline `var(--text-*)` recipes.

   BrandTitle is the ONE documented exception: its contract is arbitrary
   responsive size classes + gradient clip, which an inline role recipe would
   override. It stays a single-purpose primitive (no duplication).
--------------------------------------------------------------------------- */

export const H1: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <Typography role="page-title" as="h1" className={`m-0 ${className}`}>
    {children}
  </Typography>
)

export const H2: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({
  children,
  className = '',
  id,
}) => (
  <Typography role="section-title" as="h2" id={id} className={`m-0 ${className}`}>
    {children}
  </Typography>
)

export const H3: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <Typography role="card-title" as="h3" className={`m-0 ${className}`}>
    {children}
  </Typography>
)

export const Body: React.FC<{ children: React.ReactNode; className?: string; secondary?: boolean }> = ({
  children,
  className = '',
  secondary = false,
}) => (
  <Typography
    role="body"
    as="p"
    color={secondary ? 'secondary' : 'primary'}
    className={`m-0 ${className}`}
  >
    {children}
  </Typography>
)

export const Label: React.FC<{ children: React.ReactNode; className?: string; error?: boolean; htmlFor?: string }> = ({
  children,
  className = '',
  error = false,
  htmlFor,
}) => (
  <Typography role="label" as="label" color={error ? 'danger' : undefined} htmlFor={htmlFor} className={className}>
    {children}
  </Typography>
)

export const Display: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <Typography role="display" as="h1" className={`m-0 ${className}`}>
    {children}
  </Typography>
)

export const Caption: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <Typography role="caption" as="p" className={`m-0 ${className}`}>
    {children}
  </Typography>
)

/* DS-006 Typography capability — Brand/Display title.
   Additive Foundation primitive for brand/gradient headings (Splash Cinzel
   gold-gradient title, VerifyEmail custom display sizes). Reuses existing
   Semantic utilities (font-cinzel, gradient clip) and accepts an arbitrary
   `size` token so callers reproduce custom display sizes pixel-identically. */
type BrandTitleVariant = 'plain' | 'gradient'

interface BrandTitleProps {
  children: React.ReactNode
  variant?: BrandTitleVariant
  /** Arbitrary size token, e.g. 'text-[22px]' or 'text-3xl'. Defaults to a
   *  display size matching the prior H1 scale. */
  size?: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  className?: string
}

export const BrandTitle: React.FC<BrandTitleProps> = ({
  children,
  variant = 'plain',
  size = 'text-[26px] md:text-[30px] lg:text-[34px]',
  as = 'h1',
  className = '',
}) => {
  const Tag: React.ElementType = as
  const variantCls =
    variant === 'gradient'
      ? 'font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-[#f5e0be] to-[#b88c3a] drop-shadow-md'
      : 'font-cinzel'
  return (
    <Tag className={`font-black uppercase tracking-[0.2em] pl-[0.2em] m-0 ${size} ${variantCls} ${className}`}>
      {children}
    </Tag>
  )
}

import React from 'react'

interface TypographyProps {
  children: React.ReactNode
  className?: string
}

export const H1: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h1
    className={`text-text-title m-0 ${className}`}
    style={{
      fontSize: 'var(--text-h1)',
      lineHeight: 'var(--lh-h1)',
      fontWeight: 'var(--fw-h1)',
      letterSpacing: 'var(--ls-h1, -0.025em)',
    }}
  >
    {children}
  </h1>
)

interface H2Props extends TypographyProps {
  id?: string
}

export const H2: React.FC<H2Props> = ({ children, className = '', id }) => (
  <h2
    id={id}
    className={`text-text-primary m-0 ${className}`}
    style={{
      fontSize: 'var(--text-h2)',
      lineHeight: 'var(--lh-h2)',
      fontWeight: 'var(--fw-h2)',
      letterSpacing: 'var(--ls-h2, -0.025em)',
    }}
  >
    {children}
  </h2>
)

export const H3: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h3
    className={`text-text-primary m-0 ${className}`}
    style={{
      fontSize: 'var(--text-h3)',
      lineHeight: 'var(--lh-h3)',
      fontWeight: 'var(--fw-h3)',
      letterSpacing: 'var(--ls-h3, -0.025em)',
    }}
  >
    {children}
  </h3>
)

interface BodyProps extends TypographyProps {
  secondary?: boolean
}

export const Body: React.FC<BodyProps> = ({ children, className = '', secondary = false }) => (
  <p
    className={`m-0 ${secondary ? 'text-text-secondary' : 'text-text-primary'} ${className}`}
    style={{
      fontSize: 'var(--text-body)',
      lineHeight: 'var(--lh-body)',
      fontWeight: 'var(--fw-body)',
    }}
  >
    {children}
  </p>
)

interface LabelProps {
  children: React.ReactNode
  className?: string
  error?: boolean
  htmlFor?: string
}

export const Label: React.FC<LabelProps> = ({ children, className = '', error = false, htmlFor }) => (
  <label
    htmlFor={htmlFor}
    className={`${error ? 'text-danger' : 'text-text-muted'} ${className}`}
    style={{
      fontSize: 'var(--text-label)',
      lineHeight: 'var(--lh-label)',
      fontWeight: 'var(--fw-label)',
      letterSpacing: 'var(--ls-label)',
      textTransform: 'var(--tt-label)',
    }}
  >
    {children}
  </label>
)

export const Display: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h1
    className={`text-text-title m-0 ${className}`}
    style={{
      fontSize: 'var(--text-display)',
      lineHeight: 'var(--lh-display)',
      fontWeight: 'var(--fw-display)',
      letterSpacing: 'var(--ls-display)',
    }}
  >
    {children}
  </h1>
)

export const Caption: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <p
    className={`text-text-secondary m-0 ${className}`}
    style={{
      fontSize: 'var(--text-caption)',
      lineHeight: 'var(--lh-caption)',
      fontWeight: 'var(--fw-caption)',
    }}
  >
    {children}
  </p>
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

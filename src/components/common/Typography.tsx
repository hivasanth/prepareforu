import type { CSSProperties, ElementType, ReactNode } from 'react'

/* ─── Typography ───────────────────────────────────────────────────────────
 * Design role:
 *   Single foundation typography primitive. ALL rendered text in the
 *   application resolves through this component.
 *
 * 18 roles map to the canonical semantic type scale:
 *   display / page-title / section-title / card-title / heading / body /
 *   body-small / caption / label / badge / metric / link / helper / muted /
 *   disabled / navigation / button / status
 *
 * Each role resolves to CSS custom properties:
 *   --text-{role} (size) / --lh-{role} (line-height) / --fw-{role} (weight)
 *   --ls-{role} (letter-spacing) / --tt-{role} (text-transform)
 *
 * Color ladder: primary / title / secondary / muted / hint / disabled /
 *   on-dark / on-accent / on-danger / link / success / warning / danger /
 *   info / inherit
 *
 * Variants: sans (default) / cinzel (decorative) / garamond (decorative)
 *
 * Use for:
 *   - All text rendering (headings, body, labels, badges, captions, metrics)
 *   - Page titles, section headers, card titles
 *   - Form labels, helper text, error text
 *   - Navigation labels, button text
 *
 * Do NOT use for:
 *   - Raw HTML text elements (always prefer Typography for consistency)
 *   - Inline styles with hardcoded px/em values
 *
 * Theme: Light + Dark (token-driven, theme-adaptive)
 * Consumers: entire app via legacy wrappers + direct usage
 * ────────────────────────────────────────────────────────────────────────── */

export type TypographyRole =
  | 'display'
  | 'page-title'
  | 'section-title'
  | 'card-title'
  | 'heading'
  | 'body'
  | 'body-small'
  | 'caption'
  | 'label'
  | 'badge'
  | 'metric'
  | 'link'
  | 'helper'
  | 'muted'
  | 'disabled'
  | 'navigation'
  | 'button'
  | 'status'

export type TypographyColor =
  | 'primary'
  | 'title'
  | 'secondary'
  | 'muted'
  | 'hint'
  | 'disabled'
  | 'on-dark'
  | 'link'
  | 'on-accent'
  | 'on-danger'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'inherit'

export type TypographyWeight =
  | 'thin'
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'black'

export type TypographyVariant = 'cinzel' | 'garamond' | 'sans'

export interface TypographyProps {
  role?: TypographyRole
  as?: ElementType
  color?: TypographyColor
  weight?: TypographyWeight
  variant?: TypographyVariant
  id?: string
  htmlFor?: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}

interface RoleRecipe {
  tag: ElementType
  color: TypographyColor
  style: CSSProperties
}

const ROLE_RECIPES: Record<TypographyRole, RoleRecipe> = {
  display: {
    tag: 'h1',
    color: 'title',
    style: {
      fontSize: 'var(--text-display)',
      lineHeight: 'var(--lh-display)',
      fontWeight: 'var(--fw-display)',
      letterSpacing: 'var(--ls-display)',
    },
  },
  'page-title': {
    tag: 'h1',
    color: 'title',
    style: {
      fontSize: 'var(--text-h1)',
      lineHeight: 'var(--lh-h1)',
      fontWeight: 'var(--fw-h1)',
      letterSpacing: 'var(--ls-h1, -0.025em)',
    },
  },
  'section-title': {
    tag: 'h2',
    color: 'primary',
    style: {
      fontSize: 'var(--text-h2)',
      lineHeight: 'var(--lh-h2)',
      fontWeight: 'var(--fw-h2)',
      letterSpacing: 'var(--ls-h2, -0.025em)',
    },
  },
  'card-title': {
    tag: 'h3',
    color: 'primary',
    style: {
      fontSize: 'var(--text-h3)',
      lineHeight: 'var(--lh-h3)',
      fontWeight: 'var(--fw-h3)',
      letterSpacing: 'var(--ls-h3, -0.025em)',
    },
  },
  heading: {
    tag: 'h4',
    color: 'primary',
    style: {
      fontSize: 'var(--text-h4)',
      lineHeight: 'var(--lh-h4)',
      fontWeight: 'var(--fw-h4)',
    },
  },
  body: {
    tag: 'p',
    color: 'primary',
    style: {
      fontSize: 'var(--text-body)',
      lineHeight: 'var(--lh-body)',
      fontWeight: 'var(--fw-body)',
    },
  },
  'body-small': {
    tag: 'p',
    color: 'secondary',
    style: {
      fontSize: 'var(--text-small)',
      lineHeight: 'var(--lh-small)',
      fontWeight: 'var(--fw-small)',
    },
  },
  caption: {
    tag: 'p',
    color: 'secondary',
    style: {
      fontSize: 'var(--text-caption)',
      lineHeight: 'var(--lh-caption)',
      fontWeight: 'var(--fw-caption)',
    },
  },
  label: {
    tag: 'label',
    color: 'muted',
    style: {
      fontSize: 'var(--text-label)',
      lineHeight: 'var(--lh-label)',
      fontWeight: 'var(--fw-label)',
      letterSpacing: 'var(--ls-label)',
      textTransform: 'var(--tt-label)',
    },
  },
  badge: {
    tag: 'span',
    color: 'primary',
    style: {
      fontSize: 'var(--text-badge)',
      lineHeight: 'var(--lh-badge)',
      fontWeight: 'var(--fw-badge)',
      letterSpacing: 'var(--ls-badge)',
      textTransform: 'var(--tt-badge)',
    },
  },
  metric: {
    tag: 'span',
    color: 'primary',
    style: {
      fontSize: 'var(--text-stat-value)',
      lineHeight: 'var(--lh-stat-value)',
      fontWeight: 'var(--fw-stat-value)',
      letterSpacing: 'var(--ls-stat-value)',
    },
  },
  link: {
    tag: 'span',
    color: 'link',
    style: {
      fontSize: 'var(--text-body)',
      lineHeight: 'var(--lh-body)',
      fontWeight: 'var(--fw-body)',
    },
  },
  helper: {
    tag: 'span',
    color: 'hint',
    style: {
      fontSize: 'var(--text-caption)',
      lineHeight: 'var(--lh-caption)',
      fontWeight: 'var(--fw-caption)',
    },
  },
  muted: {
    tag: 'span',
    color: 'muted',
    style: {
      fontSize: 'var(--text-body)',
      lineHeight: 'var(--lh-body)',
      fontWeight: 'var(--fw-body)',
    },
  },
  disabled: {
    tag: 'span',
    color: 'disabled',
    style: {
      fontSize: 'var(--text-body)',
      lineHeight: 'var(--lh-body)',
      fontWeight: 'var(--fw-body)',
    },
  },
  navigation: {
    tag: 'span',
    color: 'primary',
    style: {
      fontSize: 'var(--text-body)',
      lineHeight: 'var(--lh-body)',
      fontWeight: 'var(--fw-body)',
    },
  },
  button: {
    tag: 'span',
    color: 'primary',
    style: {
      fontSize: 'var(--text-body)',
      lineHeight: 'var(--lh-body)',
      fontWeight: 'var(--fw-body)',
    },
  },
  status: {
    tag: 'span',
    color: 'primary',
    style: {
      fontSize: 'var(--text-body)',
      lineHeight: 'var(--lh-body)',
      fontWeight: 'var(--fw-body)',
    },
  },
}

const COLOR_CLASSES: Record<TypographyColor, string | null> = {
  primary: 'text-text-primary',
  title: 'text-text-title',
  secondary: 'text-text-secondary',
  muted: 'text-text-muted',
  hint: 'text-text-hint',
  disabled: 'text-text-disabled',
  'on-dark': 'text-text-on-dark',
  link: null,
  'on-accent': null,
  'on-danger': null,
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  inherit: null,
}

const COLOR_VARS: Record<string, string> = {
  link: 'var(--text-link)',
  'on-accent': 'var(--text-on-accent)',
  'on-danger': 'var(--text-on-danger)',
}

const WEIGHT_TOKENS: Record<TypographyWeight, string> = {
  thin: 'var(--weight-thin)',
  light: 'var(--weight-light)',
  regular: 'var(--weight-regular)',
  medium: 'var(--weight-medium)',
  semibold: 'var(--weight-semibold)',
  bold: 'var(--weight-bold)',
  black: 'var(--weight-black)',
}

const VARIANT_CLASSES: Record<TypographyVariant, string> = {
  cinzel: 'font-cinzel',
  garamond: 'font-garamond italic',
  sans: '',
}

export function Typography({
  role,
  as,
  color,
  weight,
  variant,
  id,
  htmlFor,
  className = '',
  style,
  children,
}: TypographyProps) {
  const recipe = role ? ROLE_RECIPES[role] : undefined
  const Tag = (as ?? recipe?.tag ?? 'span') as ElementType

  const resolvedColor = color ?? recipe?.color
  const colorClass = resolvedColor ? COLOR_CLASSES[resolvedColor] ?? '' : ''
  const colorStyle =
    resolvedColor && COLOR_CLASSES[resolvedColor] == null && resolvedColor !== 'inherit'
      ? { color: COLOR_VARS[resolvedColor] }
      : undefined

  const fontClass = variant ? VARIANT_CLASSES[variant] : ''
  const weightStyle = weight ? { fontWeight: WEIGHT_TOKENS[weight] } : undefined

  return (
    <Tag
      id={id}
      htmlFor={htmlFor}
      className={[colorClass, fontClass, className].filter(Boolean).join(' ')}
      style={{ ...recipe?.style, ...colorStyle, ...weightStyle, ...style }}
    >
      {children}
    </Tag>
  )
}

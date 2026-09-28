import { memo } from 'react'
import type { ReactNode } from 'react'
import { Card } from './AntigravityCard'
import { Caption } from './AntigravityTypography'
import { LoadingSkeleton } from './SharedComponents'

export type CollectionCardLayout = 'grid' | 'row'
export type CollectionCardVariant = 'default' | 'premium' | 'subtle' | 'outlined' | 'compact' | 'management'
export type CollectionCardTitleTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'

export interface CollectionCardProps {
  /** Stable key forwarded to callers for list identity (not rendered). */
  id?: string | number
  /** Vertical premium card (Questions, Exams, Topics, Study Cards, Dashboard
      Collections) vs horizontal premium row (Leaderboard, Students, History,
      Search Results, Notifications). Only content arrangement differs. */
  layout?: CollectionCardLayout
  /** Surface language — all variants map to certified `Card` surfaces. */
  variant?: CollectionCardVariant
  /** Explicit content padding override (16/20/24 px). Overrides the variant's
      default padding — lets a premium surface adopt management-row density. */
  padding?: 16 | 20 | 24
  /** Media / leading slot — composed by pages: SelectionCheckbox (Questions),
      RankBadge (Leaderboard), Avatar (Students), StatusIcon (History),
      TopicIcon (Topics), ExamStatusIcon (Exams). */
  leading?: ReactNode
  /** Custom full-width header region (rendered above the card body). */
  header?: ReactNode
  /** Card headline — rendered as a semantic heading (`titleAs`). */
  title?: ReactNode
  /** Secondary line under the headline. */
  subtitle?: ReactNode
  /** Metadata region (badges / chips), rendered as a wrapped token row. */
  metadata?: ReactNode
  /** Main body slot. In `grid` layout it grows to pin the footer. With
   *  `layout="row"` + `innerClassName` it renders as direct children of the
   *  caller's grid (between `leading` and `title`) so a row can declare more
   *  columns than the four slots — e.g. QuestionsTable's dedicated number
   *  column. */
  content?: ReactNode
  /** Footer slot (left side of the footer row in `grid` layout). */
  footer?: ReactNode
  /** Always-visible, right-aligned action area (certified IconButtons). */
  actions?: ReactNode
  /** Trailing slot (right side of the header row / end of a row). */
  trailing?: ReactNode
  /** Loading state — renders a certified `LoadingSkeleton` (`role="status"`). */
  loading?: boolean
  /** Visual selection highlight (border + tint). Selection logic stays in the
      page — this is presentation only. */
  selected?: boolean
  disabled?: boolean
  /** Makes the whole card keyboard-activatable (`role="button"` + Enter/Space). */
  onClick?: () => void
  /** Semantic tag for the title. Defaults to `h2`. */
  titleAs?: CollectionCardTitleTag
  ariaLabel?: string
  className?: string
  /** Override the internal row layout with a custom grid/flex container.
   *  When provided, leading, title, trailing, and actions render as direct
   *  grid children instead of the default flex row structure. */
  innerClassName?: string
}

type CardSurface = 'default' | 'subtle' | 'premium-dark-neutral' | 'management'

const VARIANT_MAP: Record<
  CollectionCardVariant,
  { surface: CardSurface; padding?: 16 | 20 | 24; extra?: string }
> = {
  default: { surface: 'default' },
  premium: { surface: 'premium-dark-neutral' },
  subtle: { surface: 'subtle' },
  outlined: { surface: 'default', extra: '!shadow-none' },
  compact: { surface: 'default', padding: 16 },
  /* Phase 3.9 (D-144) — additive Management Surface Family mapping. Delegates
     100% of the surface to the certified `Card` management variant; CollectionCard
     never hand-rolls a surface. No existing variant is changed. */
  management: { surface: 'management' },
}

export const CollectionCard = memo(function CollectionCard({
  layout = 'grid',
  variant = 'default',
  padding,
  leading,
  header,
  title,
  subtitle,
  metadata,
  content,
  footer,
  actions,
  trailing,
  loading = false,
  selected = false,
  disabled = false,
  onClick,
  titleAs = 'h2',
  ariaLabel,
  className = '',
  innerClassName = '',
}: CollectionCardProps) {
  const resolved = VARIANT_MAP[variant]
  const resolvedPadding = padding ?? resolved.padding
  const isClickable = typeof onClick === 'function'
  const compact = variant === 'compact'
  const TitleTag: React.ElementType = titleAs

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isClickable || disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  const cardClasses = [
    layout === 'grid' ? 'flex flex-col h-full' : 'flex flex-col',
    isClickable ? 'cursor-pointer group' : '',
    disabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : '',
    selected ? '!border-primary !bg-primary/5' : '',
    resolved.extra ?? '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const titleClass = compact
    ? 'text-[13px] font-bold leading-tight tracking-tight text-text-primary'
    : layout === 'row'
      ? 'text-[13px] md:text-[14px] font-bold leading-tight tracking-tight text-text-primary'
      : 'text-[15px] md:text-[16px] font-bold leading-tight tracking-tight text-text-primary'

  const skeleton =
    layout === 'row' ? (
      <div role="status" aria-label="Loading collection item" className="w-full flex items-center gap-3">
        <LoadingSkeleton width={40} height={40} borderRadius={12} />
        <div className="flex-1 flex flex-col gap-2">
          <LoadingSkeleton height={12} width="60%" />
          <LoadingSkeleton height={10} width="40%" />
        </div>
      </div>
    ) : (
      <div role="status" aria-label="Loading collection item" className="w-full flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <LoadingSkeleton width={40} height={40} borderRadius={12} />
          <div className="flex-1 flex flex-col gap-2">
            <LoadingSkeleton height={12} width="55%" />
            <LoadingSkeleton height={10} width="35%" />
          </div>
        </div>
        <LoadingSkeleton height={12} width="85%" />
      </div>
    )

  const autoHeader =
    leading || title || subtitle || trailing ? (
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {leading && <div className="shrink-0">{leading}</div>}
          {(title || subtitle) && (
            <div className="flex flex-col gap-1 min-w-0">
              {title && <TitleTag className={titleClass}>{title}</TitleTag>}
              {subtitle && <Caption className="leading-relaxed">{subtitle}</Caption>}
            </div>
          )}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
    ) : null

  const gridBody = (
    <div className="flex flex-col flex-1 min-w-0 gap-3">
      {autoHeader}
      {metadata && <div className={`flex flex-wrap items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>{metadata}</div>}
      {content && <div className="flex-1 min-w-0">{content}</div>}
      {(footer || actions) && (
        <div className="mt-auto pt-4 border-t border-border-subtle/30 flex items-center justify-between gap-3">
          {footer && <div className="min-w-0">{footer}</div>}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
    </div>
  )

  const rowBody = innerClassName ? (
    <div className={innerClassName}>
      {leading}
      {content}
      <div className="flex-1 min-w-0">
        {title && <TitleTag className={titleClass}>{title}</TitleTag>}
      </div>
      {trailing}
      {actions}
    </div>
  ) : (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          {leading && <div className="shrink-0">{leading}</div>}
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            {title && <TitleTag className={titleClass}>{title}</TitleTag>}
            {subtitle && <Caption className="leading-relaxed">{subtitle}</Caption>}
            {metadata && <div className={`flex flex-wrap items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>{metadata}</div>}
            {content && <div className="mt-1">{content}</div>}
          </div>
        </div>
        {(trailing || actions) && (
          <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-2 shrink-0">
            {trailing && <div className="shrink-0">{trailing}</div>}
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        )}
      </div>
      {footer && (
        <div className="mt-3 pt-3 border-t border-border-subtle/30">
          {footer}
        </div>
      )}
    </>
  )

  return (
    <Card
      variant={resolved.surface}
      padding={resolvedPadding}
      className={cardClasses}
      {...(isClickable ? { role: 'button', tabIndex: disabled ? -1 : 0, onClick, onKeyDown: handleKeyDown } : undefined)}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
    >
      {loading ? (
        skeleton
      ) : (
        <>
          {header && <div className="mb-4">{header}</div>}
          {layout === 'grid' ? gridBody : rowBody}
        </>
      )}
    </Card>
  )
})

export default CollectionCard

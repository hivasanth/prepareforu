import React from 'react'
import { SelectionContainer } from './AntigravityLayout'
import { CARD_SURFACE_BASE, CARD_SURFACE_LIGHT_OVERRIDES } from './AntigravityCard'
import { ROW_HOVER, FOCUS_RING } from './AntigravityMotion'

/* ─── FloatingList ──────────────────────────────────────────────────────────
 * DESIGN ROLE:
 *   Header + independent floating list items. The canonical pattern for
 *   repeated management/content lists (leaderboards, student lists,
 *   sub-admin lists, etc.).
 *
 * STRUCTURE:
 *   HEADER → SelectionContainer material (premium or management).
 *   ITEMS  → Independent Card/List surfaces + ROW_HOVER.
 *   PARENT → Layout-only (no background, no border, no shadow).
 *
 * USE FOR:
 *   Leaderboards, student lists, sub-admin lists, and other repeated
 *   management/content lists.
 *
 * DO NOT USE FOR:
 *   Forms, errors, skeleton-only layouts, or semantic tables where
 *   <table> structure is required for accessibility.
 *
 * THEME: Light + Dark (via SelectionContainer + token-driven surfaces)
 * VISUAL LANGUAGE: SelectionContainer (header) + Card/List (items)
 * CONSUMERS: UsersTable, AdminSubAdminsView, StudentsTable,
 *            LeaderboardTable, LeaderboardView
 * ────────────────────────────────────────────────────────────────────────── */

/* ─── FloatingList (parent — layout only, NO visual surface) ──────────────── */

interface FloatingListProps {
  children: React.ReactNode
  className?: string
  /** Gap between header and items, and between items. Default: 'md' (16px). */
  gap?: 'sm' | 'md' | 'lg'
  as?: 'div' | 'ul' | 'nav'
}

const GAP_MAP = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
} as const

export function FloatingList({
  children,
  className = '',
  gap = 'md',
  as: Tag = 'div',
}: FloatingListProps) {
  return (
    <Tag className={`flex flex-col ${GAP_MAP[gap]} ${className}`}>
      {children}
    </Tag>
  )
}

/* ─── FloatingListHeader ────────────────────────────────────────────────────
 * Uses SelectionContainer material for the premium gold/forest surface.
 * Renders as a row-based header bar. Supports responsive column visibility
 * via className on child elements.
 *
 * DESIGN ROLE: Floating List Header
 * USE FOR: Leaderboard column header, student list header, sub-admin header
 * DO NOT USE FOR: Editable inputs, errors, skeletons, ordinary list items
 * ────────────────────────────────────────────────────────────────────────── */

interface FloatingListHeaderProps {
  children: React.ReactNode
  className?: string
  variant?: 'premium' | 'management'
  /** Semantic inset forwarded to SelectionContainer. Default 'sm' preserves the
   *  canonical render; 'md' matches FloatingListItem padding="md" so header and
   *  rows share one content-box geometry (header ↔ row alignment contract). */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  as?: 'div' | 'header' | 'tr'
}

export function FloatingListHeader({
  children,
  className = '',
  variant = 'premium',
  padding = 'sm',
  as: Tag = 'div',
}: FloatingListHeaderProps) {
  return (
    <SelectionContainer variant={variant} padding={padding} className={className}>
      <Tag className="flex items-center w-full">
        {children}
      </Tag>
    </SelectionContainer>
  )
}

/* ─── FloatingListItem ──────────────────────────────────────────────────────
 * Independent floating surface for list items. Uses Card default visual
 * language (radius, border, shadow) with ROW_HOVER for the lighter
 * row-appropriate hover lift.
 *
 * Slot system:
 *   leading  — avatar, rank badge, icon (left side)
 *   children — primary content area (flex-1)
 *   trailing — status badges, actions (right side)
 *
 * Supports as="button" or as="a" for interactive items.
 *
 * DESIGN ROLE: Floating List Item
 * USE FOR: Leaderboard rows, student rows, sub-admin rows
 * DO NOT USE FOR: Card-level content, hero sections, forms
 * ────────────────────────────────────────────────────────────────────────── */

interface FloatingListItemProps {
  children: React.ReactNode
  leading?: React.ReactNode
  trailing?: React.ReactNode
  className?: string
  innerClassName?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
  as?: 'div' | 'button' | 'li' | 'tr' | 'article'
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  ariaLabel?: string
  role?: string
  /** Layout direction. `inline` (default) = single horizontal row.
   *  `stacked` = vertical column — for expandable items where children
   *  contain both a main row and an expanded detail region. */
  layout?: 'inline' | 'stacked'
}

const PADDING_MAP = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
} as const

export function FloatingListItem({
  children,
  leading,
  trailing,
  className = '',
  innerClassName = '',
  padding = 'md',
  as: Tag = 'div',
  onClick,
  selected = false,
  disabled = false,
  ariaLabel,
  role,
  layout = 'inline',
}: FloatingListItemProps) {
  const isInteractive = Tag === 'button' || !!onClick
  const interactiveClass = isInteractive
    ? `cursor-pointer select-none ${FOCUS_RING}`
    : ''

  const isStacked = layout === 'stacked'

  return (
    <Tag
      className={[
        /* Surface: shared Card base visual language (radius, bg, border, shadow) */
        CARD_SURFACE_BASE,
        /* Light mode premium surface */
        CARD_SURFACE_LIGHT_OVERRIDES,
        /* ROW_HOVER: lighter than CARD_HOVER — for repeated list items */
        ROW_HOVER,
        /* Padding */
        PADDING_MAP[padding],
        /* Layout */
        isStacked
          ? 'flex flex-col w-full'
          : 'flex items-center gap-3 w-full',
        /* Selection highlight */
        selected ? 'border-primary bg-primary/5' : '',
        /* Disabled */
        disabled ? 'opacity-40 pointer-events-none' : '',
        /* Interactive */
        interactiveClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      aria-label={ariaLabel}
      role={role}
      {...(Tag === 'button' ? { type: 'button', disabled } : {})}
    >
      {isStacked ? (
        children
      ) : innerClassName ? (
        <div className={innerClassName}>
          {leading}
          {children}
          {trailing}
        </div>
      ) : (
        <>
          {leading && (
            <div className="flex items-center gap-3 shrink-0">
              {leading}
            </div>
          )}
          <div className="flex-1 min-w-0 flex items-center gap-3">
            {children}
          </div>
          {trailing && (
            <div className="flex items-center gap-2 shrink-0">
              {trailing}
            </div>
          )}
        </>
      )}
    </Tag>
  )
}

import { memo, type ReactNode } from 'react'
import { GOLD_LIGHT_MATERIAL } from './AntigravityMotion'

/* ─── Skeleton ──────────────────────────────────────────────────────────────
 * Design role:
 *   Loading placeholder for content that is being fetched.
 *
 * The ONE skeleton primitive. All skeleton composites (LoadingSkeleton,
 * GridSkeleton, StatSkeleton, page-level skeletons) wrap or replicate
 * this component's material grammar.
 *
 * Variants:
 *   premium    — Certified skeleton surface tokens (--skeleton-surface/block)
 *   management — Management Surface Family material
 *
 * Types:
 *   text — Single placeholder bar (height × width, animate-pulse)
 *   card — Full card/row placeholder with surface, border, static hover look,
 *          pulse animation, and role="status" a11y
 *
 * Units (within type="card"):
 *   card — Full card interior (icon + title + subtitle + divider + actions)
 *   row  — Slim list-row interior (icon + title + badge)
 *
 * CRITICAL RULE: Skeleton material is for LOADING state ONLY.
 *   Once data loads, skeleton must be replaced with real content.
 *   Skeleton surfaces must NEVER be used as final content backgrounds.
 *
 * Use for:
 *   - Page-level loading states
 *   - Card/row loading placeholders
 *   - Inline text loading bars
 *
 * Do not use for:
 *   - Final content surfaces (use Card)
 *   - Selection containers (use SelectionContainer)
 *   - Empty states (use EmptyState from SharedComponents)
 *   - Error states (use ErrorContainer)
 *
 * Theme: Light + Dark (GOLD_LIGHT_MATERIAL aligns light to gold cards)
 * Consumers: 20+ direct + 18 via SharedComponents wrappers
 * ────────────────────────────────────────────────────────────────────────── */

type SkeletonVariant = 'premium' | 'management'
type SkeletonUnit = 'card' | 'row'
type SkeletonType = 'text' | 'card'

export interface SkeletonProps {
  /** Surface family. `premium` = the certified skeleton surface tokens
   *  (`--skeleton-surface`/`--skeleton-block`); `management` = the Management
   *  Surface Family material (D-144). */
  variant?: SkeletonVariant
  /** `text` renders a single placeholder bar; `card` renders a full card/row
   *  placeholder (surface + border + static hover look + pulse + role="status"). */
  type?: SkeletonType
  /** Placeholder footprint within `type="card"`: `card` = full card interior;
   *  `row` = slim list-row interior (matches ROW_HOVER shapes). Default `card`. */
  unit?: SkeletonUnit
  /** Number of text lines in the card interior (default 2). */
  lines?: number
  /** `type="text"`: fixed box height. `type="card"`: minimum height floor
   *  (minHeight) for BOTH `unit="row"` and `unit="card"` — content taller than
   *  the floor keeps its natural size, so callers only shrink if they pass a
   *  taller value than the default interior. Undefined/omitted keeps the
   *  default 20 (effectively a no-op for card interiors). */
  height?: number | string
  /** `type="card"` interior padding override. Defaults per unit (`p-4` row /
   *  `p-6` card). The primitive's default padding is emitted before any
   *  caller-provided utility in `className`, so page-level padding changes
   *  must use this prop instead of class stacking. */
  pad?: string
  width?: number | string
  /** Radius of the rendered placeholder (inline style — wins over any class). */
  borderRadius?: number | string
  className?: string
  /** Card-type container label (default "Loading"). */
  ariaLabel?: string
  /** Geometry-only card interior composed of `Skeleton` text-type bars.
   *  Skeleton still owns surface/block colors, pulse, and a11y. */
  children?: ReactNode
  /** Opt-in (default false): render as pure decoration — no `role="status"`
   *  live region, marked `aria-hidden`. For pages that already wrap the
   *  skeleton grid in ONE container-level `role="status"` region so nested
   *  live regions are not announced. Existing callers are unchanged. */
  decorative?: boolean
}

/* The ONE skeleton material grammar (Surface Language only — DS-001/DS-005 +
   the additive --skeleton-* tokens). Block colors per family. */
const SKELETON_BLOCK: Record<SkeletonVariant, string> = {
  premium: 'bg-[var(--skeleton-block)]',
  management: 'bg-[var(--management-surface-muted)]',
}

/* Card/row placeholder surface per family — token-only. Both families carry
   GOLD_LIGHT_MATERIAL (the ONE gold recipe, owned by AntigravityMotion) so the
   light-mode placeholder is pixel-aligned to every certified gold card. No
   per-variant light override copy. */
const SKELETON_CARD_SURFACE: Record<SkeletonVariant, string> = {
  /* `border-card-premium-border` is the real token utility (--color-card-premium-border:
     dark → transparent, light → gold-300). The former raw CSS var `--border-card-premium-border`
     does not exist in the theme contract and fell back to currentColor in Dark Mode (P-5). */
  premium: `bg-[var(--skeleton-surface)] border border-card-premium-border shadow-[var(--card-shadow)] ${GOLD_LIGHT_MATERIAL}`,
  management: `bg-[var(--management-surface)] border border-[var(--management-border)] shadow-[var(--management-shadow)] ${GOLD_LIGHT_MATERIAL}`,
}

/* The static hover look — CARD_HOVER / ROW_HOVER with the `hover:` removed, so
   the placeholder already sits lifted with the 3D block shadow, exactly like a
   hovered card/row (Phase 6.Z D-184 language, AntigravityMotion). */
const SKELETON_CARD_LIFT =
  'transition-card-3d duration-fast ease-standard -translate-y-1 shadow-card-hover-3d'
const SKELETON_ROW_LIFT =
  'transition-card-3d duration-fast ease-standard -translate-y-0.5 shadow-card-hover-3d'

/* The ONE skeleton renderer. Owners of the whole skeleton language — surface,
   block, radius, motion (animate-pulse), and a11y. All other skeleton
   components are thin wrappers over this primitive. */
export const Skeleton = memo(({
  variant = 'premium',
  type = 'text',
  unit = 'card',
  lines = 2,
  height = 20,
  width = '100%',
  borderRadius,
  pad: padOverride,
  className = '',
  ariaLabel,
  children,
  decorative = false,
}: SkeletonProps) => {
  const block = SKELETON_BLOCK[variant]

  if (type === 'card') {
    const isRow = unit === 'row'
    const surface = SKELETON_CARD_SURFACE[variant]
    const look = isRow ? SKELETON_ROW_LIFT : SKELETON_CARD_LIFT
    const radius = isRow ? 'rounded-xl' : 'rounded-2xl'
    const pad = padOverride ?? (isRow ? 'p-4' : 'p-6')

    return (
      <div
        role={decorative ? undefined : 'status'}
        aria-label={decorative ? undefined : (ariaLabel ?? 'Loading')}
        aria-hidden={decorative || undefined}
        className={`${surface} ${look} ${radius} ${pad} animate-pulse ${className}`}
        style={{ minHeight: height, ...(borderRadius !== undefined ? { borderRadius } : {}) }}
      >
        {children ?? (isRow ? (
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${block}`} />
            <div className="flex-1 space-y-2">
              <div className={`w-2/3 h-3 rounded-full ${block}`} />
              <div className={`w-1/3 h-2.5 rounded-full opacity-60 ${block}`} />
            </div>
            <div className={`w-14 h-8 rounded-lg ${block}`} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl ${block}`} />
              <div className={`w-16 h-6 rounded-lg ${block}`} />
            </div>
            <div className="space-y-2">
              {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
                <div
                  key={i}
                  className={`${i === 0 ? 'h-4 w-3/4' : 'h-3 w-1/2 opacity-60'} rounded-full ${block}`}
                />
              ))}
            </div>
            <div className="pt-4 border-t border-border-subtle grid grid-cols-2 gap-4">
              <div className={`h-10 rounded-xl ${block}`} />
              <div className={`h-10 rounded-xl ${block}`} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className={`${block} animate-pulse ${className}`}
      style={{ height, width, borderRadius }}
      aria-hidden={decorative || undefined}
    />
  )
})

Skeleton.displayName = 'Skeleton'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/* ═══ useAnchoredFloating — canonical anchored-positioning hook ═════════════
 * DESIGN ROLE:
 *   The positioning half of the Floating layer (see Floating.tsx for the
 *   portal half and the full rationale). Tracks an anchor element and yields
 *   fixed-viewport coordinates for a floating panel with collision handling:
 *
 *   - opens below when there is room (or below is still the better side)
 *   - flips above near the viewport bottom
 *   - shifts horizontally to stay inside the safe area
 *   Repositions (rAF-throttled) on any scroll/resize while open; all listeners
 *   detach on close/unmount.
 *
 * CONSUMERS: PremiumSelect. Do not fork; extend here.
 * ────────────────────────────────────────────────────────────────────────── */

export interface AnchoredFloatingState {
  /** Fixed-viewport left coordinate (px). */
  x: number
  /** Fixed-viewport top coordinate for the anchor edge (px). For 'top'
   *  placement the caller pins the panel's BOTTOM edge to this coordinate
   *  (translateY(-100%)) so exact height never feeds back into layout. */
  y: number
  placement: 'bottom' | 'top'
  /** Viewport-safe max height the panel may occupy on the chosen side. */
  maxHeight: number
}

interface AnchoredFloatingOptions {
  /** Intrinsic content cap (px). The panel never exceeds this even with room. */
  capHeight: number
  /** Gap between trigger edge and menu (px). Default 4 ('mt-1' parity). */
  offset?: number
  /** Viewport safe-area margin (px). Default 8. */
  margin?: number
  /** Policy hook: invoked when the anchor fully leaves the viewport while
   *  open (consumers typically close — a detached menu is meaningless). */
  onAnchorExitViewport?: () => void
}

const MIN_MENU_HEIGHT = 96

/**
 * Tracks `anchorRef` and yields fixed coordinates for `panelRef`.
 * See module header for the full contract.
 */
export function useAnchoredFloating(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>,
  { capHeight, offset = 4, margin = 8, onAnchorExitViewport }: AnchoredFloatingOptions,
): AnchoredFloatingState | null {
  const [state, setState] = useState<AnchoredFloatingState | null>(null)
  const frameRef = useRef<number | null>(null)
  const exitCbRef = useRef(onAnchorExitViewport)
  useEffect(() => {
    exitCbRef.current = onAnchorExitViewport
  })

  const update = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    /* Anchor fully outside the viewport → nothing to stay anchored to.
       Zero-size rects (unmeasured/test environments) are not "exited". */
    const hasSize = rect.width > 0 || rect.height > 0
    if (hasSize && (rect.bottom <= 0 || rect.top >= vh || rect.right <= 0 || rect.left >= vw)) {
      exitCbRef.current?.()
      return
    }
    /* Prefer below; flip above only when below cannot fit the content cap AND
       above has strictly more room. Deterministic w.r.t. constants → converges. */
    const spaceBelow = vh - rect.bottom - offset - margin
    const spaceAbove = rect.top - offset - margin
    const placement = spaceBelow >= capHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top'
    const available = placement === 'bottom' ? spaceBelow : spaceAbove
    const maxHeight = Math.max(Math.min(capHeight, available), MIN_MENU_HEIGHT)
    /* Horizontal: keep the start edges aligned, shift only to stay visible.
       Width may be unmeasurable on the very first pass (panel not yet
       mounted); the pre-paint effect loop converges once it is. */
    const width = panelRef.current?.offsetWidth ?? 0
    const x = Math.min(Math.max(rect.left, margin), Math.max(margin, vw - margin - width))
    const y = placement === 'bottom' ? rect.bottom + offset : Math.max(margin, rect.top - offset)
    setState(prev => {
      if (
        prev &&
        Math.abs(prev.x - x) < 0.5 &&
        Math.abs(prev.y - y) < 0.5 &&
        prev.placement === placement &&
        Math.abs(prev.maxHeight - maxHeight) < 0.5
      ) {
        return prev
      }
      return { x, y, placement, maxHeight }
    })
  }, [anchorRef, panelRef, capHeight, offset, margin])

  /* Position before paint on every commit while open — self-heals measurement
     convergence (width settles after classes apply) with zero visual flash. */
  useLayoutEffect(() => {
    if (open) update()
  })

  /* rAF-throttled repositioning on scroll (any container, captured) + resize. */
  useEffect(() => {
    if (!open) return
    const schedule = () => {
      if (frameRef.current !== null) return
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null
        update()
      })
    }
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
    }
  }, [open, update])

  return state
}

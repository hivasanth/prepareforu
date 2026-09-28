import type { QuestionState } from './examStateCalculator';

/**
 * Canonical palette color classes for question state indicators.
 * Uses semantic Tailwind tokens (success/warning/info) and the approved
 * purple accent for marked-for-review. All colors resolve correctly in
 * both Light and Dark modes via the design token system.
 *
 * States:
 *   current     → success (green)
 *   answered    → warning (amber)
 *   marked      → purple accent
 *   answered+marked → purple accent (takes priority)
 *   skipped     → info (blue)
 *   not visited → muted/transparent
 */
export function getPaletteColor(state: QuestionState): string {
  if (state.isCurrent) return 'bg-success text-white border-success ring-2 ring-success/30 shadow-md shadow-success/30 scale-105 z-10';
  if (state.isAnswered && state.isMarked) return 'bg-purple-500 text-white border-purple-500 shadow-sm shadow-purple-500/30';
  if (state.isAnswered) return 'bg-warning text-white border-warning shadow-sm shadow-warning/30';
  if (state.isMarked) return 'bg-purple-500/60 text-white border-purple-500/40 shadow-sm';
  if (state.isSkipped) return 'bg-info text-white border-info shadow-sm';
  return 'bg-transparent light:bg-white text-text-muted border-border-subtle';
}

export function getPaletteColorMobile(state: QuestionState): string {
  if (state.isCurrent) return 'bg-success text-white border-success';
  if (state.isAnswered && state.isMarked) return 'bg-purple-500 text-white border-purple-500';
  if (state.isAnswered) return 'bg-warning text-white border-warning';
  if (state.isMarked) return 'bg-purple-500/60 text-white border-purple-500/40';
  if (state.isSkipped) return 'bg-info text-white border-info';
  return 'bg-transparent light:bg-white text-text-muted border-border-subtle';
}

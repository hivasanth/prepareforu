import { TRANSITION_INTERACTION } from './AntigravityMotion'

/* ─── NumberBadge — Reusable Number/Rank/Option Indicator ────────────────────
 * Foundation primitive for displaying ordinal numbers, rank indicators,
 * sequence numbers, and option letter indicators with consistent visual language.
 *
 * Variants:
 *   question — Admin question number (PremiumIconContainer forest material)
 *   rank     — Leaderboard rank (neutral surface, gold top-3 in Light only)
 *   option   — Answer option letter (A/B/C/D) — white surface, semantic border
 *
 * Theme: Light + Dark (theme-aware surfaces)
 * Dark Mode: NO gold — uses blue accent / neutral hierarchy for rank emphasis.
 * Consumers: QuestionsTable, user LeaderboardComponents, QuestionOptions.
 * NOTE: the Admin Leaderboard rank pill (RankBadge) is a DOCUMENTED
 * INTENTIONAL EXCEPTION — see design-system-reference.md (its medal/tier
 * treatment is materially different from this primitive's square format).
 * ────────────────────────────────────────────────────────────────────────── */

export type NumberBadgeVariant = 'question' | 'rank' | 'option'

interface NumberBadgeProps {
  /** The number or letter to display. */
  value: number | string
  /** Visual variant determining surface material and color treatment. */
  variant?: NumberBadgeVariant
  /** Additional CSS classes (sizing, spacing). */
  className?: string
  /** Optional data hook for tests/consumers (rendered as data-question-card-marker). */
  dataQuestionCardMarker?: string
}

const VARIANT_CLASSES: Record<NumberBadgeVariant, string> = {
  question:
    'light:bg-[image:var(--gradient-header)] light:text-[var(--ancient-gold-bright)] light:shadow-premium-icon ' +
    'bg-hover-bg text-text-secondary',
  rank:
    'light:bg-[image:var(--gradient-header)] light:text-[var(--ancient-gold-bright)] light:shadow-premium-icon ' +
    'bg-hover-bg text-text-secondary border border-border-subtle',
  option:
    'light:bg-[image:var(--gradient-header)] light:text-[var(--ancient-gold-bright)] light:shadow-premium-icon ' +
    'bg-option-surface text-text-secondary border border-border-subtle',
}

/* Top-3 rank differentiation.
   Light: gold-amber for 1st/3rd (sidebar gold authority).
   Dark: blue accent for 1st, neutral for 2nd/3rd — NO gold in dark mode. */
const RANK_TOP3_CLASSES: Record<number, string> = {
  1: 'light:text-warning light:border-warning/20 text-primary border-primary/20',
  2: 'text-text-muted border-border-subtle/40',
  3: 'light:text-[var(--gold-300)] light:border-warning/20 text-text-secondary border-border-subtle/40',
}

export function NumberBadge({ value, variant = 'question', className = '', dataQuestionCardMarker }: NumberBadgeProps) {
  const baseCls = VARIANT_CLASSES[variant]
  const rankCls = variant === 'rank' ? RANK_TOP3_CLASSES[value as number] ?? '' : ''

  return (
    <div
      data-question-card-marker={dataQuestionCardMarker}
      className={`flex items-center justify-center shrink-0 ${TRANSITION_INTERACTION} rounded-lg font-black text-[11px] w-7 h-7 ${baseCls} ${rankCls} ${className}`}
    >
      {variant === 'rank' ? (value as number).toString().padStart(2, '0') : value}
    </div>
  )
}

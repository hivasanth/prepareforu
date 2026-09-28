/* ═══ Leaderboard grid contract — single source of truth ═════════════════════
 * ONE responsive grid consumed by BOTH the header and every row (and the
 * loading skeleton), so their content origins and column tracks are identical
 * by construction.
 *
 * Deterministic semantic metric tracks (fixed px) + flexible participant
 * (minmax(0,1fr)). NO auto/max-content metric tracks — content variation
 * (1-digit vs 3-digit scores, short vs long durations) can never move a
 * column. Track sizes mirror the certified cell widths:
 *   rank 56/64 · score 96/112 · duration 112/128(xl) · attempts 96/112(xl)
 *   last active 144/160(xl)
 *
 * Mobile / Tablet (<lg): RANK | PARTICIPANT | SCORE
 * Desktop (lg+):         RANK | PARTICIPANT | SCORE | DURATION | ATTEMPTS | LAST ACTIVE
 */
export const LEADERBOARD_GRID = [
  'grid w-full min-w-0 items-center',
  'grid-cols-[56px_minmax(0,1fr)_96px]',
  'md:grid-cols-[64px_minmax(0,1fr)_112px]',
  'lg:grid-cols-[64px_minmax(0,1fr)_112px_112px_96px_144px]',
  'xl:grid-cols-[64px_minmax(0,1fr)_112px_128px_112px_160px]',
  'gap-x-3 lg:gap-x-4',
].join(' ')

/* Per-cell alignment/visibility only — widths live in LEADERBOARD_GRID. */
export const LEADERBOARD_CELL = {
  rank:     'text-center',
  name:     'min-w-0',
  score:    'text-center',
  duration: 'text-center hidden lg:block',
  attempts: 'text-center hidden lg:block',
  date:     'text-center hidden lg:block',
} as const

/* The ONE shared horizontal inset for header AND rows: the grid's own px-1.
 * Header uses FloatingListHeader padding="none" so SelectionContainer adds no
 * extra padding — both materials share an identical content-box origin. */
export const LEADERBOARD_GRID_INSET = 'px-1'

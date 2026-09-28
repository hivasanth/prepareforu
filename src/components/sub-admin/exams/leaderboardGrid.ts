/* ═══ LEADERBOARD_GRID — the ONE deterministic responsive grid contract ═══
 * Consumed by BOTH the leaderboard header and EVERY leaderboard row on the
 * Sub-Admin Exam Details page, so all grid instances resolve identical track
 * geometry regardless of content (header ↔ row alignment contract).
 *
 * Pattern mirrors questionsTableGrid.ts (Admin Questions table contract).
 *
 * Tracks:
 *   RANK        48px          — rank badge (w-8 + padding)
 *   PARTICIPANT minmax(0,1fr) — flexible name column (min-w-0, truncate)
 *   SCORE       88px          — score/total, centered
 *   TIME        96px          — duration, centered (md+ only)
 *   ACCURACY    88px          — accuracy badge, centered (md+ only)
 *
 * Mobile (< md): RANK | PARTICIPANT | SCORE            (3 cols)
 * md+:           RANK | PARTICIPANT | SCORE | TIME | ACCURACY (5 cols)
 * ══════════════════════════════════════════════════════════════════════ */
export const LEADERBOARD_GRID = [
  'grid w-full min-w-0',
  'grid-cols-[48px_minmax(0,1fr)_88px]',
  'items-center',
  'gap-x-2.5',
  'md:grid-cols-[48px_minmax(0,1fr)_88px_96px_88px]',
  'md:gap-x-3',
].join(' ')

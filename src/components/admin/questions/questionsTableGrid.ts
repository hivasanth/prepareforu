/* ═══ QUESTION_TABLE_GRID — the ONE deterministic responsive grid contract ═══
 * Consumed by BOTH the FloatingListHeader and EVERY CollectionCard row in
 * QuestionsTable, so all grid instances resolve identical track geometry
 * regardless of their content (header ↔ row alignment contract).
 *
 * Tracks are fixed-width where the content is canonically sized:
 *   SELECT     20px          — SelectionCheckbox (w-5)
 *   NUMBER     28px          — NumberBadge question variant (w-7)
 *   QUESTION   minmax(0,1fr) — flexible text column (min-w-0, line-clamp-2)
 *   DIFFICULTY 72px          — Pill md (h-7 px-3): widest label MEDIUM fits,
 *                            centered; EASY/MEDIUM/HARD share one track so the
 *                            Actions column never moves
 *   ACTIONS    112px         — 3 × IconButton sm (w-8 = 32px) + 2 × gap-2
 *                            (8px) = 112px, centered
 *
 * Mobile (< md): SELECT | NUMBER | QUESTION | ACTIONS           (4 cols)
 * md+:           SELECT | NUMBER | QUESTION | DIFFICULTY | ACTIONS (5 cols)
 * ══════════════════════════════════════════════════════════════════════════ */
export const QUESTION_TABLE_GRID = [
  'grid w-full min-w-0',
  'grid-cols-[20px_28px_minmax(0,1fr)_112px]',
  'items-center',
  'gap-x-2.5',
  'md:grid-cols-[20px_28px_minmax(0,1fr)_72px_112px]',
  'md:gap-x-3',
].join(' ')

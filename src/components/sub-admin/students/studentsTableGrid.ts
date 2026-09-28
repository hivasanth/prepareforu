/* ═══ STUDENTS_TABLE_GRID — the ONE deterministic responsive grid contract ═══
 * Consumed by BOTH the FloatingListHeader and EVERY FloatingListItem row in
 * StudentsTable (and the loading skeleton), so all grid instances resolve
 * identical track geometry regardless of content (header ↔ row alignment
 * contract).
 *
 * Tracks are fixed-width where content is canonically sized:
 *   STUDENT     minmax(0,1.6fr) - flexible identity column (avatar + truncated
 *                                 name/email), left-aligned
 *   ATTEMPTS    88px            - Badge xs over Pill ("12 Attempts" ≤ ~78px),
 *                                 centered
 *   SCORE       72px            - "100%" / header label "SCORE", centered
 *   LAST ACTIVE 96px            - formatDate() worst case ≤ ~80px, centered
 *   ACTIONS     48px            - IconButton sm (w-8) + breathing room, centered
 *
 * Mobile (< md):   STUDENT | ATTEMPTS | ACTIONS                 (3 cols)
 * md+:             + SCORE + LAST ACTIVE                        (5 cols)
 *
 * Hidden columns are display:none — no ghost slots. Fixed px tracks, never
 * auto/max-content: header and each row are independent grid instances, so
 * content-sized tracks resolve differently per instance and break alignment.
 * ══════════════════════════════════════════════════════════════════════════ */
export const STUDENTS_TABLE_GRID = [
  'grid w-full min-w-0',
  'grid-cols-[minmax(0,1fr)_88px_48px]',
  'items-center',
  'gap-x-3',
  'md:grid-cols-[minmax(0,1.6fr)_88px_72px_96px_48px]',
  'md:gap-x-4',
].join(' ')

/* Canonical header typography — identical recipe to the Questions/Sub-Admins
 * table headers (dark premium surface inherits from SelectionContainer). */
export const HEADER_CELL = 'text-[10px] font-bold uppercase tracking-widest'

/* ═══ ATTEMPTS_TABLE_GRID — the ONE deterministic responsive grid contract for
 * the Student Profile modal's Academic Timeline exam-attempt table.
 *
 * It is a SEPARATE contract from STUDENTS_TABLE_GRID (the column sets differ:
 * student identity vs. exam attempt metrics), but it reuses the SAME tokens,
 * the SAME header/row components (FloatingListHeader / FloatingListItem), and
 * the SAME responsive strategy: fixed-px tracks (never auto/max-content so
 * header ↔ row alignment holds across independent grid instances), with
 * non-critical columns display:none on mobile.
 *
 * Tracks:
 *   EXAM        minmax(0,1fr)  - flexible exam name, left-aligned, truncated
 *   SCORE (%)   72px           - "100%" / header "SCORE (%)", centered
 *   MARKS       96px           - "0 / 30" (raw / total), centered
 *   DURATION    96px           - "0m 33s", centered
 *   SUBMISSION  112px          - locale date, centered
 *
 * Mobile (< md):  EXAM | SCORE (%) | SUBMISSION                 (3 cols)
 * md+:            + MARKS + DURATION                            (5 cols)
 * ══════════════════════════════════════════════════════════════════════════ */
export const ATTEMPTS_TABLE_GRID = [
  'grid w-full min-w-0',
  'grid-cols-[minmax(0,1fr)_64px_112px]',
  'items-center',
  'gap-x-3',
  'md:grid-cols-[minmax(0,1.6fr)_72px_96px_96px_112px]',
  'md:gap-x-4',
].join(' ')

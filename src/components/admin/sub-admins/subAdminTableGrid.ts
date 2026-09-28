/* ═══ SUB_ADMIN_TABLE_GRID — the ONE deterministic responsive grid contract ═══
 * Consumed by BOTH the FloatingListHeader and EVERY FloatingListItem row in
 * AdminSubAdminsView, so all grid instances resolve identical track geometry
 * regardless of their content (header ↔ row alignment contract).
 *
 * Tracks are fixed-width where the content is canonically sized:
 *   EDUCATOR    minmax(0,1fr) — flexible identity column (Avatar + truncated
 *                               name/email via UserIdentity)
 *   COUPON      104px         — Badge md over Pill (h-7 px-3 text-[10px]):
 *                               icon 12px + gap 6px + widest legitimate code
 *                               ("EDUA1B2C3", 9 chars ≈ 58px) + padding 24px
 *                               ≈ 100px → 104px. Codes are unbounded
 *                               (schema enforces min 3, no max), so the badge
 *                               carries max-w-full + truncate — geometry never
 *                               moves, long codes ellipsize.
 *   JOINED      80px          — formatDate() "12/31/2026" ≈ 70px worst case,
 *                               centered
 *   REFERRALS   88px          — header label "REFERRALS" at 10px bold
 *                               tracking-widest ≈ 68px governs the track,
 *                               centered
 *   STATUS      88px          — Badge success "Active" + ShieldCheck icon
 *                               ≈ 84px (same proven track as Users status),
 *                               centered; non-active renders muted "—"
 *   COMMISSION  72px          — "100.00%" worst case ≈ 60px, centered
 *   ACTIONS     96px          — two IconButton md (w-[44px] each) + gap:
 *                               Edit (pencil) + Remove (trash), centered
 *
 * Mobile (< md):   EDUCATOR | COUPON | COMMISSION | ACTIONS   (4 cols)
 * md (< lg):       + JOINED                                    (5 cols)
 * lg:              + REFERRALS + STATUS                        (7 cols)
 *
 * Hidden columns are display:none — no ghost slots. Fixed px tracks, never
 * auto/max-content: header and each row are independent grid instances, so
 * content-sized tracks resolve differently per instance and break alignment.
 * ══════════════════════════════════════════════════════════════════════════ */
export const SUB_ADMIN_TABLE_GRID = [
  'grid w-full min-w-0',
  'grid-cols-[minmax(0,1fr)_104px_72px_96px]',
  'items-center',
  'gap-x-3',
  'md:grid-cols-[minmax(0,1fr)_104px_80px_72px_96px]',
  'md:gap-x-4',
  'lg:grid-cols-[minmax(0,1.8fr)_104px_80px_88px_88px_72px_96px]',
].join(' ')

/* Canonical header typography — identical recipe to the Users table header. */
export const HEADER_CELL = 'text-[10px] font-bold uppercase tracking-widest'

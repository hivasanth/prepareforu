import { Skeleton } from '../../common/Skeleton'
import { Grid } from '../../common/AntigravityLayout'

/* ─── SubAdminSettingsSkeleton ──────────────────────────────────────────────
 * Page-loading skeleton for /sub-admin/settings. Mirrors the page's 2×2 grid
 * geometry (Identity | Recruitment + Notifications / Backup | Session).
 *
 * A11y: exactly ONE loading status owner. This container owns the single
 * `role="status"` live region; every inner Skeleton block is `decorative`
 * (no nested live regions) — same contract as StudentsTableSkeleton.
 *
 * Material: the certified premium skeleton tokens via the Skeleton primitive
 * (surface/block colours, radius, pulse, card lift). LOADING state only —
 * once profile data arrives this is replaced by the real grid.
 * ────────────────────────────────────────────────────────────────────────── */

export function SubAdminSettingsSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading settings"
      className="space-y-6"
    >
      <Grid cols={2} gap={24}>
        <Skeleton type="card" variant="premium" height={360} decorative />
        <div className="space-y-6">
          <Skeleton type="card" variant="premium" height={212} decorative />
          <Skeleton type="card" variant="premium" height={132} decorative />
        </div>
      </Grid>
      <Grid cols={2} gap={24}>
        <Skeleton type="card" variant="premium" height={160} decorative />
        <Skeleton type="card" variant="premium" height={160} decorative />
      </Grid>
    </div>
  )
}
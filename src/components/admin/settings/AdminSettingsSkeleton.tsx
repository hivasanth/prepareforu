import { memo } from 'react'

/* ─── AdminSettingsSkeleton ─────────────────────────────────────────────────
 * Structural mirror of the FINAL settings layout:
 *   mode filter → selection tabs → [distribution | paper details] grid →
 *   subject-card grid → sticky save bar.
 * Geometry follows the loaded UI (header strips p-4 border-b, chart 240px,
 * divider, switch rows, ~48px save button, space-y-6 section rhythm);
 * material uses the SAME token family as the page's cards
 * (bg-card-bg/60 · border-card-border · shadow-card-shadow) with
 * var(--skeleton-block) pulse blocks as the loading differentiator.
 * A11y: ONE role="status" region; every inner piece is decorative. ────────── */

const BLOCK = 'bg-[var(--skeleton-block)] animate-pulse'

function SkeletonCardHeader({ width }: { width: string }) {
  return (
    <div className="p-4 border-b border-border-subtle/30 flex items-center gap-2">
      <div className={`w-4 h-4 rounded-md ${BLOCK}`} />
      <div className={`h-3 rounded ${BLOCK}`} style={{ width }} />
    </div>
  )
}

export const AdminSettingsSkeleton = memo(function AdminSettingsSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading admin settings" className="space-y-6">
      <div aria-hidden="true">
        {/* Mode segmented filter */}
        <div className="flex justify-start mb-6">
          <div className="rounded-2xl bg-card-bg/60 border border-card-border shadow-card-shadow p-2 flex gap-1 h-[34px] md:h-[38px] items-center">
            <div className={`h-5 w-20 rounded-lg ${BLOCK}`} />
            <div className={`h-5 w-24 rounded-lg ${BLOCK}`} />
          </div>
        </div>

        {/* Selection context (exam / paper / subject tabs) */}
        <div className="rounded-2xl bg-card-bg/60 border border-card-border shadow-card-shadow px-4 py-3 flex items-center gap-2 mb-6">
          {[96, 72, 88].map((w, i) => (
            <div key={i} className={`h-6 rounded-lg ${BLOCK}`} style={{ width: w }} />
          ))}
        </div>

        {/* Distribution + Paper Details grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Distribution card: header strip + body (chart / rows / total) */}
          <div className="rounded-2xl bg-card-bg/60 border border-card-border shadow-card-shadow overflow-hidden">
            <SkeletonCardHeader width={120} />
            <div className="p-5">
              <div className={`h-[240px] rounded-xl ${BLOCK}`} />
              <div className="mt-4 space-y-1.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-border-subtle/10 last:border-0">
                    <div className={`h-3 rounded flex-1 mr-4 ${BLOCK}`} style={{ maxWidth: `${45 + i * 9}%` }} />
                    <div className={`h-3 w-8 rounded ${BLOCK}`} />
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border-subtle/30 flex items-center justify-between">
                <div className={`h-2.5 w-16 rounded ${BLOCK}`} />
                <div className={`h-3 w-12 rounded ${BLOCK}`} />
              </div>
            </div>
          </div>

          {/* Paper Details card: header strip + body (inputs / divider /
              switches / penalty) mirroring ExamModePanel structure */}
          <div className="rounded-2xl bg-card-bg/60 border border-card-border shadow-card-shadow overflow-hidden">
            <SkeletonCardHeader width={96} />
            <div className="p-5 space-y-4">
              {[104, 88, 120].map((w, i) => (
                <div key={i} className="space-y-1.5">
                  <div className={`h-3 rounded w-24`} style={{ maxWidth: w }} />
                  <div className={`h-9 rounded-lg ${BLOCK}`} />
                </div>
              ))}
              <div className="h-px bg-border-subtle/20" />
              {[128, 112].map((w, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className={`h-3 rounded ${BLOCK}`} style={{ width: w }} />
                  <div className={`h-6 w-11 rounded-full ${BLOCK}`} />
                </div>
              ))}
              <div className="space-y-1.5">
                <div className={`h-3 w-24 rounded ${BLOCK}`} />
                <div className={`h-9 rounded-lg w-1/2 ${BLOCK}`} />
              </div>
              <div className="flex items-center justify-between py-1">
                <div className={`h-3 w-36 rounded ${BLOCK}`} />
                <div className={`h-6 w-11 rounded-full ${BLOCK}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Subject container cards (per-subject topic lists) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map(col => (
            <div key={col} className="rounded-2xl bg-card-bg/60 border border-card-border shadow-card-shadow p-4 space-y-4">
              {[1, 2].map(section => (
                <div key={section} className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className={`h-2.5 w-16 rounded ${BLOCK}`} />
                    <div className={`h-2.5 w-14 rounded ${BLOCK}`} />
                  </div>
                  {[1, 2, 3, 4].map(row => (
                    <div key={row} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-hover-bg/40 border border-border-subtle/20">
                      <div className={`h-3 rounded flex-1 mr-4 ${BLOCK}`} style={{ maxWidth: `${55 - row * 7}%` }} />
                      <div className={`h-7 w-14 rounded-lg flex-shrink-0 ${BLOCK}`} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Sticky save bar — real save Button renders at md size (48px) */}
        <div className="sticky bottom-4 z-30 pt-4">
          <div className="rounded-2xl bg-card-bg border border-card-border shadow-card-shadow p-4 flex items-center justify-between">
            <div className={`h-3 w-24 rounded ${BLOCK}`} />
            <div className={`h-[48px] w-36 rounded-button-md ${BLOCK}`} />
          </div>
        </div>
      </div>
    </div>
  )
})

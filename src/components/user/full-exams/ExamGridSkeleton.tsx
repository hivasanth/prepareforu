import { memo } from 'react'
import { Skeleton } from '../../../components/common/Skeleton'

/* EX-1..EX-7 (2026-08-14): the /exams loading state must mirror the final
   ExamCard geometry AND the responsive layout of the finished page:
     * mobile  -> full-width snap carousel (sm:hidden) — min-w-full slides,
       gap-4, px-[3px] -mx-[3px], exactly like the final ExamPaperGrid row
     * >=640   -> the exact final grid classes (sm:grid-cols-2 ... xl:grid-cols-4)
   Each card reuses the ONE `Skeleton` primitive (surface/block tokens, pulse)
   so the loading card sits at final render size (no layout jump), while the
   inner bars only approximate ExamCard's painted geometry. The card body
   mirrors the final vertical flow (header -> body/flex-1 -> metrics -> footer
   divider -> 48px CTA) so the CTA is bottom-pinned. A11y: ONE role="status"
   region; every card unit is decorative. */

const DESKTOP_GRID =
  'hidden sm:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 w-full auto-rows-stretch'
const MOBILE_CAROUSEL =
  'sm:hidden flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 px-[3px] -mx-[3px] pb-4 scroll-smooth'

function ExamCardSkeleton() {
  return (
    <Skeleton type="card" decorative pad="p-5 md:p-6" className="flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <Skeleton width={48} height={48} borderRadius={14} />
        <Skeleton width={56} height={28} borderRadius={14} />
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-2 mt-2">
          <Skeleton width="85%" height={14} borderRadius={6} />
          <Skeleton width="55%" height={14} borderRadius={6} />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="flex flex-col gap-1.5 p-3 rounded-xl border border-border-subtle/30 light:border-stat-card-border/20 bg-[var(--skeleton-block)]/30"
            >
              <Skeleton width="55%" height={8} borderRadius={4} />
              <Skeleton width="70%" height={20} borderRadius={6} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border-subtle/30">
        <Skeleton width="100%" height={48} borderRadius={14} />
      </div>
    </Skeleton>
  )
}

interface ExamGridSkeletonProps {
  /** Number of desktop grid cards to render. Default 8. */
  count?: number
}

export const ExamGridSkeleton = memo(function ExamGridSkeleton({
  count = 8,
}: ExamGridSkeletonProps) {
  const desktopCards = Array.from({ length: count }, (_, i) => <ExamCardSkeleton key={i} />)
  const mobileSlides = Array.from({ length: Math.min(count, 4) }, (_, i) => (
    <div key={i} className="min-w-full shrink-0 snap-center snap-always">
      <ExamCardSkeleton />
    </div>
  ))

  return (
    <div role="status" aria-live="polite" aria-label="Loading exam papers" className="w-full">
      <div className={MOBILE_CAROUSEL}>{mobileSlides}</div>
      <div className={DESKTOP_GRID}>{desktopCards}</div>
    </div>
  )
})

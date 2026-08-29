import { memo } from 'react'
import { Skeleton } from '../common/Skeleton'
import { GOLD_LIGHT_MATERIAL } from '../common/AntigravityMotion'

/* D-1 (2026-08-14): /review loading must be a structural skeleton mirroring
   ReviewLayout (report header card -> stat grid -> search -> filter pills ->
   question cards) instead of a generic spinner. Uses the certified skeleton
   material only (--skeleton-surface / --skeleton-block, GOLD_LIGHT_MATERIAL,
   semantic borders/shadows, animate-pulse). ONE role="status" region; every
   inner placeholder is decorative. No fixed question count is derived from the
   network — a stable count is used. */

const HEADER_SURFACE =
  `bg-[var(--skeleton-surface)] border border-[var(--border-subtle)] shadow-[var(--card-shadow)] ${GOLD_LIGHT_MATERIAL}`

const STAT_LABELS = ['Accuracy', 'Correct', 'Wrong', 'Time']
const STAT_BOTTOM = ['Total', 'Skipped', 'Not Visited', 'Score']
const FILTER_PILLS = ['All', 'Correct', 'Wrong', 'Skipped', 'Not Visited']
const QUESTION_COUNT = 3

function ReportHeaderSkeleton() {
  return (
    <div
      className={`${HEADER_SURFACE} animate-pulse p-8 md:p-10 text-center space-y-6 relative overflow-hidden rounded-[32px]`}
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--skeleton-block)]" />
      <Skeleton width={80} height={80} borderRadius={40} decorative className="mx-auto" />
      <div className="space-y-3">
        <Skeleton width={280} height={30} borderRadius={8} decorative className="mx-auto" />
        <Skeleton width={200} height={12} borderRadius={6} decorative className="mx-auto" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-border-subtle">
        {STAT_LABELS.map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 sm:gap-3 lg:gap-4 h-16 sm:h-20 lg:h-24 px-3 sm:px-4 lg:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[var(--skeleton-block)]/30 border border-border-subtle/30"
          >
            <Skeleton width={36} height={36} borderRadius={10} decorative className="shrink-0" />
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <Skeleton width="70%" height={8} borderRadius={4} />
              <Skeleton width="55%" height={16} borderRadius={6} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {STAT_BOTTOM.map((_, i) => (
          <Skeleton key={i} width={84} height={12} borderRadius={6} decorative />
        ))}
      </div>
    </div>
  )
}

function ReviewQuestionSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex gap-5">
        <Skeleton width={40} height={40} borderRadius={12} decorative className="shrink-0" />
        <div className="space-y-3 flex-grow min-w-0">
          <Skeleton width="70%" height={16} borderRadius={6} />
          <Skeleton width="90%" height={14} borderRadius={6} />
          <Skeleton width="45%" height={14} borderRadius={6} />
        </div>
      </div>

      <div className="flex gap-2 sm:pl-16">
        <Skeleton width={120} height={22} borderRadius={11} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:pl-16">
        {['A', 'B', 'C', 'D'].map((opt) => (
          <Skeleton key={opt} width="100%" height={52} borderRadius={14} />
        ))}
      </div>

      <div className="sm:ml-16 p-8 rounded-[20px] border border-border-subtle/30 bg-[var(--skeleton-block)]/20">
        <Skeleton width={160} height={12} borderRadius={6} className="mb-3" />
        <Skeleton width="90%" height={14} borderRadius={6} />
        <Skeleton width="65%" height={14} borderRadius={6} />
      </div>
    </div>
  )
}

export const ReviewSkeleton = memo(function ReviewSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading review" className="min-h-screen bg-app-bg">
      <div className="max-w-[1200px] mx-auto px-4 py-6 md:py-10 space-y-8">
        <ReportHeaderSkeleton />

        <div className={`${HEADER_SURFACE} animate-pulse p-6 md:p-8 lg:p-12 space-y-8 rounded-[32px]`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
            <Skeleton width={200} height={20} borderRadius={6} />
            <Skeleton width={120} height={36} borderRadius={12} />
          </div>

          <Skeleton width="100%" height={48} borderRadius={14} />

          <div role="group" aria-label="Filter questions by status" className="flex flex-wrap gap-3">
            {FILTER_PILLS.map((label, i) => (
              <div
                key={label}
                className={`flex items-center justify-center px-5 py-2.5 rounded-xl border-2 border-border-subtle/30 ${
                  i === 0 ? 'bg-[var(--skeleton-block)]/30' : ''
                }`}
              >
                <Skeleton width={i === 0 ? 72 : 88} height={11} borderRadius={6} />
              </div>
            ))}
          </div>

          <div className="space-y-16">
            {Array.from({ length: QUESTION_COUNT }).map((_, i) => (
              <ReviewQuestionSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

ReviewSkeleton.displayName = 'ReviewSkeleton'

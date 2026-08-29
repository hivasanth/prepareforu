import { memo } from 'react'
import { Skeleton } from '../../common/Skeleton'
import { SelectionContainer, Stack } from '../../common/AntigravityUI'
import { Grid } from '../../common/AntigravityLayout'
import { SectionReveal } from '../../common/AntigravityAnimation'

/* H-1 / M-1 / M-2 / M-3 / L-1 (2026-08-14): /history loading state must mirror
   the final page geometry (UserSelectionTabs + AttemptCardBase grid) using the
   certified skeleton material only (Skeleton surface/block tokens, pulse, a11y).
   The page owns ONE role="status" region; every inner unit is decorative. */

/* Mirrors the final SelectionContainer structure (AdminSelectionTabs with
   hideAll=true, showSubjects=false): primary exam-tab row (h-[44px] md:h-[52px])
   + divider + secondary paper-tab row (h-[40px] md:h-[44px]). Decorative only —
   the page-level HistorySkeleton region announces the loading state once. */
const EXAM_PILL_WIDTHS = [104, 104, 104, 104]
const PAPER_PILL_WIDTHS = [88, 88, 88]

function TabRowSkeleton({ widths, heightCls }: { widths: number[]; heightCls: string }) {
  return (
    <div className="w-full flex justify-center lg:justify-start">
      <div className="w-full max-w-full overflow-x-auto custom-scrollbar">
        <div className={`flex items-center gap-1 md:gap-2 min-w-max mx-auto lg:mx-0 ${heightCls}`}>
          {widths.map((width, i) => (
            <div
              key={i}
              className="shrink-0 h-full flex items-center px-4 md:px-6 rounded-xl border border-[var(--border-subtle)] light:border-[var(--material-tab-pill-border)]"
            >
              <Skeleton width={width} height={12} borderRadius={6} decorative />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const HistorySelectionSkeleton = memo(function HistorySelectionSkeleton() {
  return (
    <SelectionContainer>
      <Stack gap="sm" className="w-full">
        <TabRowSkeleton widths={EXAM_PILL_WIDTHS} heightCls="h-[44px] md:h-[52px]" />
        <div className="pt-3 flex flex-col gap-3">
          <div className="h-px w-full mx-auto opacity-30 bg-border-subtle" />
          <TabRowSkeleton widths={PAPER_PILL_WIDTHS} heightCls="h-[40px] md:h-[44px]" />
        </div>
      </Stack>
    </SelectionContainer>
  )
})

HistorySelectionSkeleton.displayName = 'HistorySelectionSkeleton'

/* Mirrors AttemptCardBase's vertical flow (Card default: p-4 md:p-5, radius 24):
   header (badge 28h r14 + icon 36x36 r10) -> body (title + date / md right
   metrics) -> mt-auto footer with border-border-subtle/30 divider. minHeight
   floor 180 keeps the card near the final 181-209px footprint at every
   breakpoint without forcing a universal fixed height. */
export const HistoryCardSkeleton = memo(function HistoryCardSkeleton() {
  return (
    <Skeleton
      type="card"
      decorative
      pad="p-4 md:p-5"
      height={180}
      className="flex flex-col h-full"
    >
      <div className="flex justify-between items-center mb-4">
        <Skeleton width={72} height={28} borderRadius={14} />
        <Skeleton width={36} height={36} borderRadius={10} />
      </div>

      <div className="flex flex-col md:grid md:grid-cols-[1fr_auto] gap-4">
        <div className="space-y-3">
          <Skeleton width="75%" height={16} borderRadius={6} />
          <div className="flex items-center justify-between md:justify-start gap-8">
            <Skeleton width={112} height={12} borderRadius={6} />
            <Skeleton width={72} height={12} borderRadius={6} className="md:hidden" />
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end justify-center gap-2">
          <Skeleton width={64} height={9} borderRadius={4} />
          <Skeleton width={44} height={18} borderRadius={6} />
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border-subtle/30 flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <Skeleton width={36} height={20} borderRadius={6} />
          <Skeleton width={24} height={10} borderRadius={4} />
        </div>
        <Skeleton width={96} height={16} borderRadius={6} />
      </div>
    </Skeleton>
  )
})

HistoryCardSkeleton.displayName = 'HistoryCardSkeleton'

interface HistorySkeletonProps {
  /** Render the selection (tabs) skeleton. True while auth identity/exam
   *  selection is unknown OR the user is APPSC — mirrors the /exams EX-3 gate.
   *  Never true for known NON-APPSC users (no phantom tabs). */
  showSelection?: boolean
}

export const HistorySkeleton = memo(function HistorySkeleton({
  showSelection = false,
}: HistorySkeletonProps) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading history" className="w-full">
      <Stack gap="lg">
        {showSelection && (
          <SectionReveal className="w-full">
            <HistorySelectionSkeleton />
          </SectionReveal>
        )}
        <Grid cols={3} gap={24}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-full">
              <HistoryCardSkeleton />
            </div>
          ))}
        </Grid>
      </Stack>
    </div>
  )
})

HistorySkeleton.displayName = 'HistorySkeleton'

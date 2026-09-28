import { Skeleton } from '../../common/Skeleton'
import { PageContainer, Stack, SelectionContainer } from '../../common/AntigravityUI'

/* The server RPC ceiling — the final table can render up to this many rows.
   The skeleton deliberately shows fewer (LEADERBOARD_SKELETON_COUNT): a small
   visible placeholder keeps the cold→content swap bounded instead of hinting
   at a ~45-row expansion. The count below is the intentional design constant. */
export { LEADERBOARD_TOP_LIMIT } from '../../../services/leaderboardService'

export const LEADERBOARD_SKELETON_COUNT = 8

const EXAM_PILL_WIDTHS = [120, 96, 110, 80]
const PAPER_PILL_WIDTHS = [140, 120, 90]

/* Approved selection pattern (/history + /performance): bordered pill shells
   inside a real SelectionContainer track, rows scroll horizontally so every
   pill stays reachable on mobile. */
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

/* LB-4 — mirrors the final UserSelectionTabs structure: primary exam row +
   divider + secondary paper row (44/52 primary, 40/44 secondary). */
export function LeaderboardSelectionSkeleton({ showPapers = false }: { showPapers?: boolean }) {
  return (
    <SelectionContainer>
      <Stack gap="sm" className="w-full">
        <TabRowSkeleton widths={EXAM_PILL_WIDTHS} heightCls="h-[44px] md:h-[52px]" />
        {showPapers && (
          <div className="pt-3 flex flex-col gap-3">
            <div className="h-px w-full mx-auto opacity-30 bg-border-subtle" />
            <TabRowSkeleton widths={PAPER_PILL_WIDTHS} heightCls="h-[40px] md:h-[44px]" />
          </div>
        )}
      </Stack>
    </SelectionContainer>
  )
}

/* LB-5 — mirrors SegmentedFilter geometry exactly: SelectionContainer !p-2
   track, 34/38 pill height, gap-0.5 md:gap-1, realistic label widths. */
export function LeaderboardPeriodFilterSkeleton() {
  return (
    <div className="w-fit max-w-full">
      <SelectionContainer className="!p-2">
        <div className="flex items-center gap-0.5 md:gap-1 min-w-max h-[34px] md:h-[38px]">
          {[28, 64, 72].map((width, i) => (
            <div
              key={i}
              className="shrink-0 h-full flex items-center px-3 md:px-4 rounded-lg border border-[var(--border-subtle)] light:border-[var(--material-tab-pill-border)]"
            >
              <Skeleton width={width} height={10} borderRadius={6} decorative />
            </div>
          ))}
        </div>
      </SelectionContainer>
    </div>
  )
}

/* LB-6 — mirrors LeaderboardTopCard: 400/500/600 responsive width, 200/240
   responsive min-height floor, trophy glyph top-right, #1 rank block. Surface
   stays the certified skeleton material (the final gold gradient is not
   reproduced with hand-rolled colors per the surface rule). */
export function LeaderboardHeroSkeleton() {
  return (
    <div className="flex justify-center">
      <Skeleton
        type="card"
        width="100%"
        className="relative max-w-[400px] md:max-w-[500px] lg:max-w-[600px]"
        borderRadius={24}
        pad="p-6"
        decorative
      >
        <div className="absolute top-4 right-4 w-[60px] h-[60px] md:w-[80px] md:h-[80px]">
          <Skeleton type="text" height="100%" width="100%" borderRadius={16} decorative />
        </div>
        <div className="relative flex flex-col items-center justify-center min-h-[152px] md:min-h-[192px]">
          <Skeleton type="text" height={11} width={120} borderRadius={8} decorative />
          <div className="w-[88px] h-[48px] md:h-[64px] mt-2 mb-4">
            <Skeleton type="text" height="100%" width="100%" borderRadius={12} decorative />
          </div>
          <Skeleton type="text" height={18} width="60%" borderRadius={8} decorative />
          <div className="flex items-center gap-3 mt-3">
            <Skeleton type="text" height={12} width={64} borderRadius={8} decorative />
            <Skeleton type="text" height={12} width={64} borderRadius={8} decorative />
          </div>
        </div>
      </Skeleton>
    </div>
  )
}

/* LB-2 + LB-7 — header skeleton + independent row skeletons (matching the
   final FloatingList pattern: SelectionContainer header + floating rows). */
export function LeaderboardTableSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <SelectionContainer>
        <Skeleton type="card" unit="row" height={44} decorative />
      </SelectionContainer>
      {Array.from({ length: LEADERBOARD_SKELETON_COUNT }).map((_, i) => (
        <Skeleton key={i} type="card" unit="row" height={64} decorative />
      ))}
    </div>
  )
}

/* LB-3 — mirrors LeaderboardUserCard: full-width max-w-[1280px] mx-auto,
   sticky bottom-6, rank badge + name block + SCORE/ACCURACY/BEST TIME metric
   columns. Natural sizing with a min-height floor (no forced 76px). */
export function LeaderboardRankSkeleton() {
  return (
    <div className="sticky bottom-6 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <Skeleton type="card" width="100%" pad="p-4" className="max-w-[1280px] mx-auto" decorative>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12">
              <Skeleton type="text" height="100%" width="100%" borderRadius={12} decorative />
            </div>
            <div className="hidden sm:block space-y-2">
              <Skeleton type="text" height={12} width={140} borderRadius={6} decorative />
              <Skeleton type="text" height={10} width={110} borderRadius={6} decorative />
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-8 lg:gap-12">
            {[56, 72, 64].map((width, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton type="text" height={8} width={44} borderRadius={6} decorative />
                <Skeleton type="text" height={14} width={width} borderRadius={6} decorative />
              </div>
            ))}
          </div>
        </div>
      </Skeleton>
    </div>
  )
}

/* FULL PAGE SKELETON — used only when authLoading OR isInitialLoad. The
   selection region mirrors the final gating (no phantom tabs for users whose
   exam options are unknown/empty). */
interface LeaderboardSkeletonProps {
  /** Show the exam/paper selection skeleton (mirrors final `examOptions.length > 0`). */
  showSelection?: boolean
  /** Show the secondary APPSC paper row (primary + divider + papers). */
  showPapers?: boolean
}

export function LeaderboardSkeleton({ showSelection = false, showPapers = false }: LeaderboardSkeletonProps) {
  return (
    <div role="status" aria-label="Loading leaderboard" aria-live="polite" className="w-full">
      <PageContainer>
        <Stack gap="lg">
          {showSelection && <LeaderboardSelectionSkeleton showPapers={showPapers} />}
          <LeaderboardPeriodFilterSkeleton />
          <LeaderboardHeroSkeleton />
          <LeaderboardTableSkeleton />
          <LeaderboardRankSkeleton />
        </Stack>
      </PageContainer>
    </div>
  )
}

/* CONTENT-ONLY SKELETON — used when the real tabs + period filter are already
   rendered and only the rank data is loading (LB-1/LB-8). NO duplicated
   SelectionContainer / tabs / filter here. */
export function LeaderboardContentSkeleton() {
  return (
    <div role="status" aria-label="Loading leaderboard" aria-live="polite" className="w-full">
      <Stack gap="lg">
        <LeaderboardHeroSkeleton />
        <LeaderboardTableSkeleton />
        <LeaderboardRankSkeleton />
      </Stack>
    </div>
  )
}

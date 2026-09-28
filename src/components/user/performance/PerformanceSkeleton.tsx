import { Skeleton } from '../../common/Skeleton'
import { StatSkeleton } from '../../common/SharedComponents'
import { PageContainer, SelectionContainer, Stack, SectionReveal } from '../../common/AntigravityUI'

interface PerformanceSkeletonProps {
  /** Mirror the APPSC exam/paper tab rows shown on the final page. */
  showAppscTabs?: boolean
}

/* P-1 — the APPSC selection skeleton mirrors the final UserSelectionTabs
   structure (SelectionContainer → primary exam row → divider → secondary paper
   row) using the approved /history + /exams selection skeleton pattern. Row
   heights match the real Tabs geometry (md: h-[44px] md:h-[52px], sm:
   h-[40px] md:h-[44px]) and the rows scroll horizontally so every pill stays
   reachable on mobile. */
const EXAM_PILL_WIDTHS = [120, 96, 110, 80]
const PAPER_PILL_WIDTHS = [140, 120, 90]

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

function PerformanceSelectionSkeleton() {
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
}

/* P-2 — Subject Insights loading row: mirrors SubjectInsightItem (label + % +
   ProgressBar). */
function SubjectInsightRowSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Skeleton type="text" height={11} width="60%" decorative />
        <Skeleton type="text" height={11} width={32} decorative />
      </div>
      <Skeleton type="text" height={6} width="100%" borderRadius={999} decorative />
    </div>
  )
}

export function PerformanceSkeleton({ showAppscTabs = false }: PerformanceSkeletonProps) {
  return (
    <PageContainer>
      <div role="status" aria-live="polite" aria-label="Loading performance" className="space-y-6 animate-in">
        {showAppscTabs && (
          <SectionReveal className="w-full">
            <PerformanceSelectionSkeleton />
          </SectionReveal>
        )}

        <div className="flex gap-2 w-fit">
          <Skeleton type="text" height={38} width={110} borderRadius={12} />
          <Skeleton type="text" height={38} width={110} borderRadius={12} />
          <Skeleton type="text" height={38} width={110} borderRadius={12} />
        </div>

        {/* P-3 — matches PerformanceMetricsGrid breakpoints exactly (1 col <768, 2 at md, 4 at lg). */}
        <StatSkeleton decorative columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-4" gap="gap-4" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* P-2 Trend card — mirrors Card premium-neutral p-6: header (title + subtitle +
              icon badge) + chart area h-[260px] lg:h-[300px]. */}
          <div className="lg:col-span-2">
            <Skeleton type="card" decorative borderRadius={24} className="h-full">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="space-y-2">
                  <Skeleton type="text" height={18} width={160} decorative />
                  <Skeleton type="text" height={11} width={110} decorative />
                </div>
                <Skeleton type="text" height={40} width={40} borderRadius={12} decorative />
              </div>
              <div className="h-[260px] lg:h-[300px]">
                <Skeleton type="text" height="100%" width="100%" borderRadius={16} decorative />
              </div>
            </Skeleton>
          </div>

          {/* P-2 Distribution card — mirrors header + flex-1 pie area (min-h 220) +
              recharts legend row (3 dots + labels). */}
          <div className="flex flex-col">
            <Skeleton type="card" decorative borderRadius={24} className="flex flex-col h-full">
              <div className="space-y-2 mb-4">
                <Skeleton type="text" height={18} width={140} decorative />
                <Skeleton type="text" height={11} width={100} decorative />
              </div>
              <div className="flex-1 min-h-[220px] flex flex-col">
                <Skeleton type="text" className="flex-1 w-full" borderRadius={16} decorative />
              </div>
              <div className="flex items-center justify-center gap-6 mt-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Skeleton type="text" height={8} width={8} borderRadius={999} decorative />
                    <Skeleton type="text" height={10} width={48} decorative />
                  </div>
                ))}
              </div>
            </Skeleton>
          </div>

          {/* P-2 Subject Insights — mirrors header + Strong/Weak groups + divider +
              footer tip box. */}
          <div className="flex flex-col">
            <Skeleton type="card" decorative borderRadius={24} className="flex flex-col h-full">
              <div className="space-y-2 mb-6">
                <Skeleton type="text" height={18} width={150} decorative />
              </div>
              <div className="flex-1 space-y-6">
                <div className="space-y-3">
                  <Skeleton type="text" height={14} width={110} decorative />
                  {[0, 1, 2].map(i => <SubjectInsightRowSkeleton key={i} />)}
                </div>
                <div className="h-px bg-border-subtle opacity-10" />
                <div className="space-y-3">
                  <Skeleton type="text" height={14} width={100} decorative />
                  {[0, 1, 2].map(i => <SubjectInsightRowSkeleton key={i} />)}
                </div>
              </div>
              <div className="mt-6 p-4 rounded-xl border border-border-subtle flex items-center gap-3">
                <Skeleton type="text" height={40} width={40} borderRadius={12} decorative />
                <div className="space-y-2 flex-1">
                  <Skeleton type="text" height={10} width="90%" decorative />
                  <Skeleton type="text" height={10} width="65%" decorative />
                </div>
              </div>
            </Skeleton>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

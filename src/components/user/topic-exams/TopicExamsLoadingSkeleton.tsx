import { Skeleton } from '../../common/Skeleton';
import { GridSkeleton } from '../../common/SharedComponents';
import { PageContainer, Stack, SelectionContainer } from '../../common/AntigravityUI';

/* Page-specific loading skeleton for /topic-exams.
 *
 * Reference: /dashboard (`DashboardStatsGrid` + `DashboardRecentActivity`) —
 * the skeleton mirrors the actual geometry of the page being loaded.
 *
 * Composition mirrors the final TopicPortalView hierarchy:
 *   • exam/paper/subject selection row → SelectionContainer (the SAME real
 *     forest material as the loaded page, pulse only on inner placeholder bars)
 *   • language toggle row (right-aligned, ~140px wide, with label)
 *   • "Select Topic" label
 *   • topic grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`)
 *
 * The grid uses the shared `GridSkeleton` so the skeleton family is the
 * SAME primitive as the Dashboard. A11y: ONE outer `role="status"` region;
 * every inner unit is decorative. */
export function TopicExamsLoadingSkeleton() {
  return (
    <PageContainer className="py-6 md:py-10">
      <div role="status" aria-live="polite" aria-label="Loading topic exams" className="w-full">
        <Stack gap="lg">
          {/* Selection row: SelectionContainer + 3 tab pills (exam / paper / subject). */}
          <SelectionContainer>
            <div className="flex items-center gap-2 h-[44px] md:h-[52px]">
              <Skeleton width={104} height={44} borderRadius={12} decorative />
              <Skeleton width={120} height={44} borderRadius={12} decorative />
              <Skeleton width={88} height={44} borderRadius={12} decorative />
            </div>
          </SelectionContainer>

          {/* Language toggle (right-aligned, ~140px wide, with label above). */}
          <div className="flex justify-end">
            <div className="flex flex-col gap-2 min-w-[140px]">
              <Skeleton width={80} height={12} />
              <Skeleton width={140} height={40} borderRadius={12} />
            </div>
          </div>

          {/* "Select Topic" label + topic grid. */}
          <div className="flex flex-col gap-4">
            <Skeleton width={120} height={14} />
            <GridSkeleton
              count={6}
              height={180}
              columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              gap="gap-4"
              decorative
            />
          </div>
        </Stack>
      </div>
    </PageContainer>
  );
}
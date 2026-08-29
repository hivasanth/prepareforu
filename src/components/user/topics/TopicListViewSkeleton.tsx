import { Skeleton } from '../../common/Skeleton';

/* ─── Geometry mirrors TopicListView + TopicCard ─────────────────────────
 *
 *   Real view (TopicListView.tsx + TopicCard.tsx):
 *     <div className="space-y-6">
 *       <div className="mb-6">
 *         <H2 text-lg font-black uppercase tracking-wider>subject</H2>
 *         <Body text-xs>N topics · click any to start reading</Body>
 *       </div>
 *       <div className="space-y-3">
 *         {topics.map → <TopicCard key={topic.id} topic onClick/>}
 *       </div>
 *     </div>
 *
 *   TopicCard geometry:
 *     <Card variant="default" className="flex items-center gap-4 p-4">
 *       <PremiumIconContainer className="w-11 h-11 rounded-xl">display_order</PremiumIconContainer>
 *       <div className="flex-1 min-w-0">
 *         <H3 text-sm truncate>title_en</H3>
 *         {title_te && <Body text-xs truncate mt-0.5 opacity-80>title_te</Body>}
 *       </div>
 *       <ChevronRight size={18} />
 *     </Card>
 *
 *   Material: premium family via Skeleton primitive (GOLD_LIGHT_MATERIAL,
 *   rounded-2xl, shadow-card-hover-3d, animate-pulse). Status semantics
 *   follow the Dashboard pattern: a single role="status" region wraps
 *   the whole skeleton — not per row.
 * ─────────────────────────────────────────────────────────────────────────── */

const DEFAULT_ROW_COUNT = 4;

interface TopicListViewSkeletonProps {
  count?: number;
  pad?: string;
  borderRadius?: number | string;
}

export function TopicListViewSkeleton({
  count = DEFAULT_ROW_COUNT,
  pad = 'p-4',
  borderRadius = 24,
}: TopicListViewSkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading topics"
      className="space-y-6"
    >
      {/* Subject header: H2 + count body — H2 text-lg ~22px, Body text-xs ~16px */}
      <div className="mb-6 space-y-2">
        <Skeleton width={200} height={22} borderRadius={4} />
        <Skeleton width={140} height={16} borderRadius={4} />
      </div>

      {/* Topic rows: mirrors TopicCard (icon + title + subtitle + chevron) */}
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton
            key={i}
            type="card"
            borderRadius={borderRadius}
            pad={pad}
            decorative
          >
            <div className="flex items-center gap-4 p-4">
              {/* Icon — TopicCard uses w-11 h-11 rounded-xl (44×44) */}
              <Skeleton width={44} height={44} borderRadius={16} />
              {/* Title + subtitle column */}
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton width="70%" height={14} borderRadius={4} />
                <Skeleton width="50%" height={12} borderRadius={4} />
              </div>
              {/* ChevronRight — size=18 in real view */}
              <Skeleton width={18} height={18} borderRadius={4} />
            </div>
          </Skeleton>
        ))}
      </div>
    </div>
  );
}
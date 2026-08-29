import { Skeleton } from '../../common/Skeleton';
import { SelectionContainer, Stack } from '../../common/AntigravityUI';

/* ─── Geometry references ─────────────────────────────────────────────────────
 *
 *   /dashboard
 *     • StatSkeleton (count=4, cols="grid-cols-2 lg:grid-cols-4") — premium material
 *     • GridSkeleton   (count=3, height=180, cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")
 *     • role="status" aria-live="polite" aria-label="Loading ..."
 *
 *   /prepare-write (this file)
 *   • SelectionViewSkeleton: mirrors ExamCard geometry (icon + status + title +
 *       2×2 metric grid + Start button). Eight cards (live max papers per exam).
 *       The tabs placeholder renders ONLY when `showTabs` (APPSC selection);
 *       non-APPSC pages have no tabs, so no phantom tabs skeleton.
 *     • PreparationViewSkeleton: mirrors question-card geometry (number badge +
 *       subject + difficulty + question text + 4 options + rationale block).
 *     • ExamViewSkeleton: mirrors ExamHeader (timer, actions) + QuestionCard
 *       + QuestionNavigator + StatusBoard + MobileActionBar.
 *     • ResultViewSkeleton: mirrors Trophy header + 3 StatCards + Performance card.
 *     • ReviewViewSkeleton: mirrors ReviewLayout header + filter chips +
 *       search + question cards.
 *     • Each view's Suspense fallback is the matching per-view skeleton.
 *
 *   Material grammar: selection/filter shells reuse the real SelectionContainer
 *   (forest surface, gold 1.8px border, carved 3D shadow — pulse only on inner
 *   placeholder bars); card regions use the premium family via the Skeleton
 *   primitive (GOLD_LIGHT_MATERIAL, rounded-2xl, animate-pulse).
 *   A11y: ONE role="status" wrapper per view; every inner unit is decorative.
 * ─────────────────────────────────────────────────────────────────────────── */

/* ─── Selection: mirrors ExamCard geometry ─────────────────────────────────
 *
 *   The real ExamCard structure (src/components/common/AntigravityDashboard.tsx):
 *     <Card variant="premium-dark-neutral" padding={20}
 *         className="flex flex-col gap-4 group h-full md:p-6">
 *       <div className="flex justify-between items-start">       ← header row
 *         <PremiumIconContainer className="w-12 h-12 rounded-[14px]" />
 *         {status && <Badge>...</Badge>}
 *       </div>
 *       <div className="flex-1 flex flex-col gap-4">             ← body
 *         <Body className="!text-[13px] md:!text-[14px] ... line-clamp-2">title</Body>
 *         <div className="grid grid-cols-2 gap-3 mt-auto pt-2">← 2x2 metric grid
 *           <MetricBlock variant="metric" />×4
 *         </div>
 *       </div>
 *       <div className="mt-3 pt-3 border-t border-border-subtle/30">← footer
 *         <Button fullWidth variant="primary">Start Practice <ArrowRight /></Button>
 *       </div>
 *     </Card>
 *
 *   The SelectionCardSkeleton below mirrors each region with the same
 *   surface (Skeleton type="card") and proportional geometry.
 */
export function SelectionCardSkeleton() {
  return (
    <Skeleton type="card" borderRadius={16} decorative>
      <div className="flex flex-col gap-4 h-full">
        {/* Header row: icon (48x48, rounded-[14px]) + status badge (top-right).
            Badge (Pill md) is h-7 px-3 rounded-[14px] text-[10px] — ~28px tall. */}
        <div className="flex justify-between items-start">
          <Skeleton width={48} height={48} borderRadius={14} />
          <Skeleton width={64} height={28} borderRadius={14} />
        </div>

        {/* Body: title (2 lines) + 2x2 metric grid.
            MetricBlock variant="metric" container is p-3 rounded-xl border
            (~12px padding + label h-3 + value text-[20px]); ~60px total height. */}
        <div className="flex-1 flex flex-col gap-4">
          <Skeleton width="85%" height={14} borderRadius={4} />
          <Skeleton width="60%" height={14} borderRadius={4} />
          <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width="100%" height={60} borderRadius={12} />
            ))}
          </div>
        </div>

        {/* Footer: full-width Button (Button md = h-[48px] px-6 rounded-[14px]) */}
        <div className="mt-3 pt-3 border-t border-border-subtle/30">
          <Skeleton width="100%" height={48} borderRadius={14} />
        </div>
      </div>
    </Skeleton>
  );
}

export function SelectionViewSkeleton({ count = 8, showTabs = false }: { count?: number; showTabs?: boolean }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading papers">
      <Stack gap={32}>
        {/* Tabs row — SelectionContainer with three tab pills. Mirrors the APPSC
            selection row mounted only when userSelection is APPSC_GROUPS/APPSC.
            Non-APPSC pages render no tabs, so the tabs placeholder is gated on
            `showTabs` to avoid a phantom 72px row. */}
        {showTabs && (
          <SelectionContainer>
            <div className="flex items-center gap-2 h-[44px] md:h-[52px]">
              <Skeleton width={104} height={44} borderRadius={12} decorative />
              <Skeleton width={120} height={44} borderRadius={12} decorative />
              <Skeleton width={88} height={44} borderRadius={12} decorative />
            </div>
          </SelectionContainer>
        )}

        {/* ExamCard grid: 8 cards, each mirroring ExamCard internals.
            Mirrors SelectionView's desktop xl:grid-cols-4 + mobile carousel. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6 w-full auto-rows-stretch">
          {Array.from({ length: count }).map((_, i) => (
            <SelectionCardSkeleton key={i} />
          ))}
        </div>
      </Stack>
    </div>
  );
}

/* ─── Preparation: mirrors question-card geometry ─────────────────────────── */
export function PreparationViewSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading preparation">
      <Stack gap={32}>
        {/* Sticky header (title + practice badge + timer + Start Full Exam button) */}
        <Skeleton type="card" borderRadius={16} height={64} decorative>
          <div className="flex items-center justify-between gap-4">
            <Skeleton width={180} height={28} borderRadius={6} />
            <Skeleton width={120} height={40} borderRadius={12} />
          </div>
        </Skeleton>

        {/* Question cards: Card variant="premium-dark-neutral" p-8 lg:p-10 */}
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton
            key={i}
            type="card"
            borderRadius={16}
            height={400}
            decorative
          >
            <div className="flex flex-col gap-6">
              {/* Number badge + subject + difficulty */}
              <div className="flex items-center gap-4">
                <Skeleton width={40} height={40} borderRadius={12} />
                <div className="flex-1 space-y-2">
                  <Skeleton width="40%" height={14} />
                  <Skeleton width="20%" height={10} />
                </div>
              </div>
              {/* Question text lines */}
              <Skeleton width="95%" height={18} />
              <Skeleton width="80%" height={18} />
              {/* Options grid (2×2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((j) => (
                  <Skeleton key={j} width="100%" height={56} borderRadius={16} />
                ))}
              </div>
              {/* Rationale block */}
              <Skeleton width="100%" height={84} borderRadius={16} />
            </div>
          </Skeleton>
        ))}
      </Stack>
    </div>
  );
}

/* ─── Exam: mirrors ExamView geometry ─────────────────────────────────────── */
export function ExamViewSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading exam">
      {/* ExamHeader */}
      <Skeleton type="card" borderRadius={16} height={60} decorative>
        <div className="flex items-center justify-between gap-4">
          <Skeleton width={200} height={18} borderRadius={6} />
          <Skeleton width={140} height={36} borderRadius={12} />
        </div>
      </Skeleton>

      <div className="flex-1 flex gap-4 mt-4">
        {/* Main: QuestionCard */}
        <section className="flex-1 flex flex-col gap-6">
          <Skeleton width="100%" height={8} borderRadius={4} />
          <Skeleton type="card" borderRadius={16} height={420} decorative>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <Skeleton width={64} height={20} borderRadius={6} />
                <Skeleton width={120} height={20} borderRadius={6} />
              </div>
              <Skeleton width="95%" height={20} />
              <Skeleton width="70%" height={20} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {[0, 1, 2, 3].map((j) => (
                  <Skeleton key={j} width="100%" height={64} borderRadius={16} />
                ))}
              </div>
            </div>
          </Skeleton>
          {/* QuestionNavigator */}
          <Skeleton width="100%" height={56} borderRadius={16} />
        </section>

        {/* StatusBoard */}
        <aside className="hidden lg:block w-[280px]">
          <Skeleton type="card" borderRadius={16} height={420} decorative />
        </aside>
      </div>
    </div>
  );
}

/* ─── Result: mirrors ResultView geometry ──────────────────────────────────── */
export function ResultViewSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading result">
      <Stack gap={48}>
        {/* Trophy + title */}
        <div className="flex flex-col items-center gap-6">
          <Skeleton width={96} height={96} borderRadius={9999} />
          <Skeleton width={320} height={40} borderRadius={8} />
          <Skeleton width={240} height={14} borderRadius={4} />
        </div>
        {/* 3 StatCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((j) => (
            <Skeleton key={j} type="card" borderRadius={16} height={96} decorative />
          ))}
        </div>
        {/* Performance summary card */}
        <Skeleton type="card" borderRadius={16} height={280} decorative />
      </Stack>
    </div>
  );
}

/* ─── Review: mirrors ReviewLayout + ReviewQuestionCard ──────────────────── */
export function ReviewViewSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading review">
      {/* ReviewLayout header: stats grid + filters + search */}
      <Skeleton type="card" borderRadius={16} height={120} decorative />
      {/* Filter chips + search bar */}
      <Skeleton width="100%" height={56} borderRadius={16} className="mt-4" />
      {/* Question cards */}
      <Stack gap={24} className="mt-4">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} type="card" borderRadius={16} height={360} decorative />
        ))}
      </Stack>
    </div>
  );
}
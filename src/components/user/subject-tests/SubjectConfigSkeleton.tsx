import { Skeleton } from '../../common/Skeleton';

/* Suspense fallback for the lazy SubjectConfigView / TopicConfigView
   (subject-tests audit FIX-2; topic-exams audit E3; remediation FIX-B).
   Mirrors TestConfigView structure: header (back button + title + "Session
   Configuration" label), "Select Question Count" label, 3-col option buttons,
   hint bar, info panel (Strict Timing + Standard Marking), full-width CTA,
   responsive p-8 lg:p-12 card padding. A11y: ONE role="status" region; every
   inner unit is decorative. */
export function SubjectConfigSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading session configuration" className="max-w-[800px] mx-auto">
      <Skeleton type="card" pad="p-8 lg:p-12" decorative>
        <div className="flex flex-col gap-6 lg:gap-8">
          <div className="flex items-center gap-4 border-b border-border-subtle pb-6">
            <Skeleton width={44} height={44} borderRadius={12} decorative />
            <div className="flex flex-col gap-2">
              <Skeleton width={200} height={22} decorative />
              <Skeleton width={140} height={12} decorative />
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:gap-8">
            <div className="flex flex-col gap-4">
              <Skeleton width={160} height={14} decorative />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} type="card" height={108} pad="p-0" decorative>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Skeleton width={40} height={32} decorative />
                      <Skeleton width={70} height={12} decorative />
                    </div>
                  </Skeleton>
                ))}
              </div>
              <Skeleton width="62%" height={12} decorative />
            </div>

            <div className="p-6 rounded-2xl bg-hover-bg/30 border border-border-subtle space-y-4">
              <div className="flex items-start gap-4">
                <Skeleton width={32} height={32} borderRadius={999} decorative />
                <div className="flex flex-col gap-1.5 pt-1">
                  <Skeleton width={110} height={14} decorative />
                  <Skeleton width={230} height={12} decorative />
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Skeleton width={32} height={32} borderRadius={999} decorative />
                <div className="flex flex-col gap-1.5 pt-1">
                  <Skeleton width={130} height={14} decorative />
                  <Skeleton width={250} height={12} decorative />
                </div>
              </div>
            </div>

            <Skeleton width="100%" height={56} borderRadius={16} decorative />
          </div>
        </div>
      </Skeleton>
    </div>
  );
}

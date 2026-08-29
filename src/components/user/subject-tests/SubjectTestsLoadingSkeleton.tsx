import { Skeleton } from '../../common/Skeleton';
import { PageContainer, Stack, SelectionContainer } from '../../common/AntigravityUI';

interface SubjectTestsLoadingSkeletonProps {
  /** APPSC portals render the exam/paper tab bar above the subject grid. */
  isAppsc?: boolean;
}

/* Page-specific loading skeleton (subject-tests audit FIX-1/FIX-3 +
   remediation FIX-A/FIX-C/FIX-D). Mirrors the real SubjectPortalView
   geometry — optional APPSC selection region (SelectionContainer material:
   primary exam-tab row, subtle divider, secondary papers row, matching
   AdminSelectionTabs) + subject card grid (grid-cols-2 sm:grid-cols-3
   xl:grid-cols-4 gap-4). Card placeholders use the final rounded-2xl radius
   and p-5 interior padding. No phantom banner or right-sidebar regions.
   A11y: ONE role="status" region; every inner unit is decorative. */
export function SubjectTestsLoadingSkeleton({ isAppsc = false }: SubjectTestsLoadingSkeletonProps) {
  return (
    <PageContainer className="py-6 md:py-10">
      <div role="status" aria-live="polite" aria-label="Loading subject tests" className="w-full">
        <Stack gap="lg">
          {isAppsc && (
            <SelectionContainer>
              <Stack gap="sm" className="w-full">
                <div className="w-full flex justify-center lg:justify-start">
                  <div className="w-full max-w-full overflow-x-auto custom-scrollbar">
                    <div className="flex items-center gap-1 md:gap-2 h-[44px] md:h-[52px] min-w-max">
                      <Skeleton width={104} height={44} borderRadius={12} decorative />
                      <Skeleton width={88} height={44} borderRadius={12} decorative />
                      <Skeleton width={120} height={44} borderRadius={12} decorative />
                    </div>
                  </div>
                </div>

                <div className="w-full flex flex-col overflow-hidden">
                  <div className="pt-3 flex flex-col gap-3">
                    <div className="h-px w-full mx-auto opacity-30 bg-border-subtle" />
                    <div>
                      <Stack gap="sm">
                        <div className="w-full flex justify-center lg:justify-start">
                          <div className="w-full max-w-full overflow-x-auto custom-scrollbar">
                            <div className="flex items-center gap-1 md:gap-2 h-[40px] md:h-[44px] min-w-max">
                              <Skeleton width={96} height={40} borderRadius={12} decorative />
                              <Skeleton width={72} height={40} borderRadius={12} decorative />
                              <Skeleton width={96} height={40} borderRadius={12} decorative />
                            </div>
                          </div>
                        </div>
                      </Stack>
                    </div>
                  </div>
                </div>
              </Stack>
            </SelectionContainer>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} type="card" borderRadius={24} pad="p-5" decorative>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between w-full">
                    <Skeleton width={40} height={40} borderRadius={14} decorative />
                    <Skeleton width={36} height={36} borderRadius={10} decorative />
                  </div>
                  <Skeleton width="70%" height={17} decorative />
                  <Skeleton width="100%" height={54} borderRadius={14} decorative />
                </div>
              </Skeleton>
            ))}
          </div>
        </Stack>
      </div>
    </PageContainer>
  );
}

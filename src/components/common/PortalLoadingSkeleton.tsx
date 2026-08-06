import { LoadingSkeleton } from './SharedComponents';
import { PageContainer, Stack } from './AntigravityUI';

export function PortalLoadingSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading content">
      <PageContainer>
        <Stack gap={32}>
          <LoadingSkeleton height={120} borderRadius={16} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <Stack gap={32}>
                <LoadingSkeleton height={80} borderRadius={16} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <LoadingSkeleton height={80} borderRadius={16} />
                   <LoadingSkeleton height={80} borderRadius={16} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                   {[1,2,3,4,5,6,7,8].map(i => <LoadingSkeleton key={i} height={140} borderRadius={16} />)}
                </div>
              </Stack>
            </div>
            <div className="lg:col-span-4">
               <LoadingSkeleton height={400} borderRadius={16} />
            </div>
          </div>
        </Stack>
      </PageContainer>
    </div>
  );
}

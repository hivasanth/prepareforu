import { LoadingSkeleton } from '../common/SharedComponents'
import { PageContainer } from '../common/AntigravityUI'

export function PerformanceSkeleton() {
  return (
    <PageContainer>
      <div className="space-y-8 animate-in fade-in duration-500">
        <LoadingSkeleton height={80} borderRadius={24} />
        <LoadingSkeleton height={140} borderRadius={24} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {[1,2,3,4].map(i => <LoadingSkeleton key={i} height={80} borderRadius={20} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <LoadingSkeleton height={400} borderRadius={24} />
          </div>
          <LoadingSkeleton height={400} borderRadius={24} />
        </div>
      </div>
    </PageContainer>
  )
}

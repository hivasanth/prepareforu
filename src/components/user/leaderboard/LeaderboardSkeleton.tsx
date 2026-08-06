import { LoadingSkeleton, GridSkeleton } from '../../common/SharedComponents'
import { PageContainer, Card } from '../../common/AntigravityUI'

export function LeaderboardSkeleton() {
  return (
    <PageContainer>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSkeleton height={40} width={300} borderRadius={12} />
          <LoadingSkeleton height={40} width={200} borderRadius={12} />
          <LoadingSkeleton height={40} width={250} borderRadius={12} />
        </div>
        <div className="flex flex-col items-center space-y-6 pt-10">
          <LoadingSkeleton height={240} width="100%" className="max-w-[600px]" borderRadius={24} />
        </div>
        <Card className="p-0 border-none shadow-none">
          <GridSkeleton count={8} height={64} columns="grid-cols-1" />
        </Card>
      </div>
    </PageContainer>
  )
}

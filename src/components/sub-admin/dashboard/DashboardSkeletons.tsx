import { Card } from '../../common/AntigravityUI'
import { LoadingSkeleton } from '../../common/SharedComponents'

export function ExamListSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <Card key={i} variant="premium-neutral">
          <LoadingSkeleton height={16} width="75%" borderRadius={4} className="mb-3" />
          <div className="flex gap-4">
            <LoadingSkeleton height={12} width={64} borderRadius={4} />
            <LoadingSkeleton height={12} width={48} borderRadius={4} />
          </div>
        </Card>
      ))}
    </>
  )
}

export function AttemptListSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map(i => (
        <Card key={i} variant="premium-neutral" className="flex items-center gap-3">
          <LoadingSkeleton width={40} height={40} borderRadius={12} />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton height={12} width={112} borderRadius={4} />
            <LoadingSkeleton height={8} width={64} borderRadius={4} />
          </div>
          <LoadingSkeleton height={20} width={48} borderRadius={4} />
        </Card>
      ))}
    </>
  )
}

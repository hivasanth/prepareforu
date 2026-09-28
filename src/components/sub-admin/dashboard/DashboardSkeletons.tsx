import { Grid } from '../../common/AntigravityUI'
import { Card } from '../../common/AntigravityCard'
import { LoadingSkeleton } from '../../common/SharedComponents'

// Mirrors the loaded Recent Deployments grid (Grid cols={1} lg={2}) so the
// skeleton occupies the same columns/geometry/gap as the loaded cards.
export function ExamListSkeleton() {
  return (
    <Grid cols={1} lg={2}>
      {[1, 2, 3, 4].map(i => (
        <Card key={i} variant="premium-neutral">
          <LoadingSkeleton height={16} width="75%" borderRadius={4} className="mb-3" />
          <div className="flex gap-4">
            <LoadingSkeleton height={12} width={64} borderRadius={4} />
            <LoadingSkeleton height={12} width={48} borderRadius={4} />
          </div>
        </Card>
      ))}
    </Grid>
  )
}

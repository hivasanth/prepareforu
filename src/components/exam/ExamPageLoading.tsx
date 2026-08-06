import { PageContainer } from '../common/AntigravityUI'
import { Spinner } from '../common/Spinner'

interface ExamPageLoadingProps {
  message?: string
}

export function ExamPageLoading({ message = 'Loading...' }: ExamPageLoadingProps) {
  return (
    <PageContainer centered padded={false}>
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <Spinner size="lg" />
        <span className="text-base font-semibold text-text-secondary">{message}</span>
      </div>
    </PageContainer>
  )
}

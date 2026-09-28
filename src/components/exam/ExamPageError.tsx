import type { LucideIcon } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { ErrorContainer } from '../common/ErrorContainer'
import { H3, Body } from '../common/AntigravityUI'
import { PageContainer } from '../common/AntigravityUI'

interface ExamPageErrorProps {
  icon?: LucideIcon
  title?: string
  message: string
  onRetry: () => void
  onBack?: () => void
}

export function ExamPageError({
  icon: Icon = AlertCircle,
  title = 'Error',
  message,
  onRetry,
}: ExamPageErrorProps) {
  return (
    <PageContainer centered padded={false}>
      <div className="py-20 max-w-md mx-auto">
        <ErrorContainer icon={Icon} category="server" severity="high">
          <H3>{title}</H3>
          <Body>{message}</Body>
          {onRetry && (
            <button onClick={onRetry} className="mt-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold">
              Retry
            </button>
          )}
        </ErrorContainer>
      </div>
    </PageContainer>
  )
}

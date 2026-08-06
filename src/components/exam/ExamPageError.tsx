import type { LucideIcon } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { ErrorState } from '../common/SharedComponents'
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
  onBack,
}: ExamPageErrorProps) {
  return (
    <PageContainer centered padded={false}>
      <div className="py-20 max-w-md mx-auto">
        <ErrorState
          icon={<Icon size={48} />}
          title={title}
          message={message}
          onRetry={onRetry}
          onBack={onBack}
        />
      </div>
    </PageContainer>
  )
}

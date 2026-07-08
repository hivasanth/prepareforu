import type { LucideIcon } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { Button, IconBadge, Stack, H3, Body } from '../common/AntigravityUI'

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
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 max-w-md">
        <IconBadge icon={Icon} size="4xl" className="rounded-[18px]" darkClassName="bg-danger/10 text-danger" />
        <Stack gap={8}>
          <H3>{title}</H3>
          <Body secondary>{message}</Body>
        </Stack>
        <Stack gap={12} className="w-full max-w-xs">
          <Button onClick={onRetry} fullWidth>Retry</Button>
          {onBack && (
            <Button variant="secondary" onClick={onBack} fullWidth>Return Home</Button>
          )}
        </Stack>
      </div>
    </div>
  )
}

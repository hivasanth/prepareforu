import { Button } from './AntigravityButton'

interface StartTestButtonProps {
  hasMinimum: boolean
  onClick: () => void
}

export function StartTestButton({ hasMinimum, onClick }: StartTestButtonProps) {
  return (
    <Button
      variant={hasMinimum ? 'primary' : 'secondary'}
      fullWidth
      onClick={hasMinimum ? onClick : undefined}
      disabled={!hasMinimum}
    >
      {hasMinimum ? 'Start Test' : 'Not Enough Questions'}
    </Button>
  )
}

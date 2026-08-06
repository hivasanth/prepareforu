import { Button } from './AntigravityButton'

interface StartTestButtonProps {
  hasMinimum: boolean
  onClick: () => void
}

export function StartTestButton({ hasMinimum, onClick }: StartTestButtonProps) {
  if (hasMinimum) {
    return (
      <Button variant="primary" fullWidth onClick={onClick}>
        Start Test
      </Button>
    )
  }

  return (
    <div
      role="status"
      aria-label="Not enough questions available"
      className="w-full rounded-xl border border-border-subtle/40 bg-white/[0.03] px-4 py-3 text-center space-y-0.5"
    >
      <p className="text-[14px] font-bold text-text-secondary m-0">Not Enough Questions</p>
    </div>
  )
}

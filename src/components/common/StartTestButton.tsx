import { Button } from './AntigravityButton'

interface StartTestButtonProps {
  hasMinimum: boolean
  onClick: () => void
  /** Subject context for the accessible name (FIND-2). Optional so callers that
   *  have no subject (e.g. shared topic flow) keep a generic label. */
  subjectName?: string
}

export function StartTestButton({ hasMinimum, onClick, subjectName }: StartTestButtonProps) {
  if (hasMinimum) {
    return (
      <Button
        variant="primary"
        fullWidth
        onClick={onClick}
        aria-label={subjectName ? `Start Test: ${subjectName}` : undefined}
      >
        Start Test
      </Button>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Not enough questions available"
      className="
        w-full rounded-xl border border-border-subtle
        bg-hover-bg/30
        px-4 py-3 text-center
        flex items-center justify-center gap-2
      "
    >
      <span className="text-[14px] font-bold text-text-secondary m-0">Not Enough Questions</span>
    </div>
  )
}

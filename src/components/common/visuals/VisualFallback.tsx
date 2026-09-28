import type { FC } from 'react'
import type { VisualErrorCode } from './visualErrorCodes'

interface Props {
  code: VisualErrorCode
  label?: string
}

export const VisualFallback: FC<Props> = ({ code, label }) => (
  <div
    role="status"
    aria-live="polite"
    className="w-full min-h-[120px] flex flex-col items-center justify-center gap-2 rounded-2xl border border-border-subtle/20 bg-card-bg/30 px-6 py-8 text-center"
  >
    <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
    </svg>
    <p className="text-sm text-text-secondary font-medium">Visual could not be rendered.</p>
    {label && <p className="text-xs text-text-muted">{label}</p>}
    <span className="sr-only" data-visual-error-code={code} />
  </div>
)

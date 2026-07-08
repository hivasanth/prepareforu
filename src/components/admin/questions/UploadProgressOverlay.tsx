import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { IconBadge } from '../../common/AntigravityUI'

interface UploadProgressOverlayProps {
  uploadProgress: {
    current: number
    total: number
    status: 'idle' | 'running' | 'error' | 'success'
  }
  errors: { row: number; message: string }[]
  examLabel?: string
  paperLabel?: string
  subjectName: string
  onRetry?: () => void
}

export function UploadProgressOverlay({ uploadProgress, errors, examLabel, paperLabel, subjectName, onRetry }: UploadProgressOverlayProps) {
  if (uploadProgress.status === 'idle') return null

  const percentage = uploadProgress.total > 0
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
    : 0

  return (
    <div className="absolute inset-0 z-50 bg-card-bg/95 backdrop-blur-md rounded-[28px] flex flex-col items-center justify-center p-8 text-center">
      {uploadProgress.status === 'running' && (
        <div className="relative w-24 h-24 mb-6">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" className="text-border-subtle" strokeWidth="6" />
            <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" className="text-primary" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - percentage / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-primary">{percentage}%</span>
        </div>
      )}

      {uploadProgress.status === 'success' && (
        <IconBadge
          icon={CheckCircle2}
          size="6xl"
          shape="circle"
          className="bg-success/10 text-success mb-6"
          darkClassName="rounded-full bg-success/10 text-success"
        />
      )}

      {uploadProgress.status === 'error' && (
        <IconBadge
          icon={AlertTriangle}
          size="6xl"
          shape="circle"
          className="bg-danger/10 text-danger mb-6"
          darkClassName="rounded-full bg-danger/10 text-danger"
        />
      )}

      <h3 className="text-lg font-black uppercase tracking-widest mb-2 text-text-primary">
        {uploadProgress.status === 'running' && 'Syncing Questions...'}
        {uploadProgress.status === 'success' && 'Upload Complete!'}
        {uploadProgress.status === 'error' && 'Upload Failed'}
      </h3>

      {examLabel && <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{examLabel}{paperLabel ? ` • ${paperLabel}` : ''}</p>}
      <p className="text-xs font-medium text-text-secondary mt-1">{subjectName}</p>

      <p className="text-sm text-text-secondary mt-4 max-w-md">
        {uploadProgress.status === 'running' && `Processing ${uploadProgress.current} of ${uploadProgress.total} records. Please do not close this panel.`}
        {uploadProgress.status === 'success' && `Successfully uploaded ${uploadProgress.total} questions.`}
        {uploadProgress.status === 'error' && 'An error occurred during upload. You can try again.'}
      </p>

      {uploadProgress.status === 'running' && (
        <p className="text-xs text-text-secondary mt-2 opacity-60">
          {uploadProgress.current} / {uploadProgress.total} records processed
        </p>
      )}

      {uploadProgress.status === 'error' && errors.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-danger/5 border border-danger/20 max-w-md text-left">
          <p className="text-[10px] font-bold text-danger uppercase tracking-wider mb-1">Error Details</p>
          <p className="text-xs text-text-secondary">{errors[errors.length - 1]?.message}</p>
        </div>
      )}

      {uploadProgress.status === 'error' && onRetry && (
        <button onClick={onRetry} aria-label="Retry upload" className="mt-6 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all bg-primary text-white">
          Try Again
        </button>
      )}
    </div>
  )
}

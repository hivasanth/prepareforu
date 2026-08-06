import { memo } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { Alert, IconBadge, Button } from '../../common/AntigravityUI'

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

export const UploadProgressOverlay = memo(function UploadProgressOverlay({ uploadProgress, errors, examLabel, paperLabel, subjectName, onRetry }: UploadProgressOverlayProps) {
  if (uploadProgress.status === 'idle') return null

  const percentage = uploadProgress.total > 0
    ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
    : 0

  return (
    <div className="absolute inset-0 z-50 bg-card-bg/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center" role="status">
      {uploadProgress.status === 'running' && (
        <div className="relative w-24 h-24 mb-6" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} aria-label="Upload progress">
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
          status="success"
          className="mb-6"
        />
      )}

      {uploadProgress.status === 'error' && (
        <IconBadge
          icon={AlertTriangle}
          size="6xl"
          shape="circle"
          status="danger"
          className="mb-6"
        />
      )}

      <h3 className="text-lg font-bold uppercase tracking-widest mb-2 text-text-primary">
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
        <div className="mt-4 max-w-md text-left">
          <Alert variant="error" title="Error Details">
            {errors[errors.length - 1]?.message}
          </Alert>
        </div>
      )}

      {uploadProgress.status === 'error' && onRetry && (
        <Button onClick={onRetry} aria-label="Retry upload" className="mt-6">
          Try Again
        </Button>
      )}
    </div>
  )
})

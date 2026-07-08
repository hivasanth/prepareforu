interface LoadingOverlayProps {
  visible: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({
  visible,
  message = 'Syncing Data',
  className = '',
}: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div
      className={`absolute inset-0 z-10 flex items-center justify-center bg-card-bg/40 backdrop-blur-[2px] rounded-2xl transition-all duration-300 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40 animate-pulse">
          {message}
        </span>
      </div>
    </div>
  )
}

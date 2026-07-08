interface ExamPageLoadingProps {
  message?: string
}

export function ExamPageLoading({ message = 'Loading...' }: ExamPageLoadingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-app-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-base font-semibold text-text-secondary">{message}</span>
      </div>
    </div>
  )
}

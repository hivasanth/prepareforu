import { useState, useCallback } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const showSuccess = useCallback((msg: string) => showToast(msg, 'success'), [showToast])
  const showError = useCallback((msg: string) => showToast(msg, 'error'), [showToast])

  return { toasts, showSuccess, showError, showToast }
}

// ─── Toast Container Component ───────────────────────────────────────────────
export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      id="toast-container"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-2.5 z-[99999] pointer-events-none"
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%) scale(0.9); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>
      {toasts.map(t => (
        <div
          key={t.id}
          className="min-w-[300px] px-6 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 pointer-events-auto shadow-2xl backdrop-blur-md"
          style={{
            background: 'var(--card-bg, #1f2937)',
            color: 'var(--text-primary, #fff)',
            borderColor: t.type === 'success' ? 'var(--success, #22c55e)' : 'var(--danger, #f87171)',
            borderWidth: 2,
            borderStyle: 'solid',
            animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <span className="text-xl">{t.type === 'success' ? '✅' : '❌'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

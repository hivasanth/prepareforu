import { useState, useCallback, useRef, useEffect } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning', duration = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    const timerId = setTimeout(() => {
      timersRef.current = timersRef.current.filter(t => t !== timerId)
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
    timersRef.current.push(timerId)
  }, [])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  const showSuccess = useCallback((msg: string) => showToast(msg, 'success'), [showToast])
  const showError = useCallback((msg: string) => showToast(msg, 'error'), [showToast])

  return { toasts, showSuccess, showError, showToast }
}

// ─── Toast Container Component ───────────────────────────────────────────────
// Status-family presentation: Surface panel (card surface) + Status hue
// (border + icon). Animation lives in index.css (toast-slide-in) so no
// component injects keyframes (P1 A-4).
// Phase 3.9 (D-144): additive `variant` prop — `premium` (default, unchanged)
// renders the card/parchment panel; `management` renders the neutral Management
// Surface Family panel. Status hues (success/danger border + icon) are unchanged
// in both. No behavioural change; no error-language redesign.
export function ToastContainer({ toasts, variant = 'premium' }: { toasts: Toast[]; variant?: 'premium' | 'management' }) {
  const panelSurface = variant === 'management' ? 'bg-[var(--management-surface)]' : 'bg-card-bg'
  return (
    <div
      id="toast-container"
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-2.5 z-[99999] pointer-events-none"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className={`min-w-[300px] px-6 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 pointer-events-auto shadow-2xl backdrop-blur-md border-2 border-solid ${panelSurface} text-text-primary toast-slide-in ${t.type === 'success' ? 'border-success' : 'border-danger'}`}
        >
          {t.type === 'success'
            ? <CheckCircle2 size={20} className="text-success shrink-0" aria-hidden />
            : <XCircle size={20} className="text-danger shrink-0" aria-hidden />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

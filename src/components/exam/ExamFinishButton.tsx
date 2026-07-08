import { Send } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

interface ExamFinishButtonProps {
  onClick: () => void
}

export function ExamFinishButton({ onClick }: ExamFinishButtonProps) {
  const { isDark } = useTheme()

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 text-xs rounded-[13px] uppercase tracking-widest shadow-lg font-black transition-all active:scale-95 ${
        isDark
          ? 'bg-danger text-white shadow-danger/20 hover:bg-danger/90'
          : 'ancient-btn-danger'
      }`}
    >
      <Send size={14} />
      <span>Finish</span>
    </button>
  )
}

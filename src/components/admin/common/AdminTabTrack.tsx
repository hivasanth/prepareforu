import type { ReactNode } from 'react'
import { useTheme } from '../../../context/ThemeContext'

interface AdminTabTrackProps {
  children: ReactNode
  className?: string
}

export function AdminTabTrack({ children, className = '' }: AdminTabTrackProps) {
  const { isDark } = useTheme()

  return (
    <div
      className={`w-fit max-w-full overflow-x-auto custom-scrollbar relative p-1 ${
        !isDark ? 'ancient-tab-track shadow-md' : 'bg-card-bg/50 border border-border-subtle rounded-2xl'
      } ${className}`}
    >
      {children}
    </div>
  )
}

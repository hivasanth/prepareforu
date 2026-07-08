import { AttemptCardBase } from './AttemptCardBase'
import type { AttemptWithRelations } from '../../types/exam.types'

interface RecentAttemptCardProps {
  attempt: AttemptWithRelations;
  onClick: () => void;
}

// Helper for relative time
function getRelativeTime(dateString: string) {
  if (!dateString) return 'Invalid Date';
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return date.toLocaleDateString()
}

export function RecentAttemptCard({ attempt, onClick }: RecentAttemptCardProps) {
  return (
    <AttemptCardBase 
      attempt={attempt}
      onClick={onClick}
      dateFormatter={getRelativeTime}
    />
  )
}

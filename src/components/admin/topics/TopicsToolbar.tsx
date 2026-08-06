import { memo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../../common/AntigravityUI'
import { AdminText } from '../../common/AdminText'

interface TopicsToolbarProps {
  subjectName: string
  topicCount: number
  onAdd: () => void
}

export const TopicsToolbar = memo(function TopicsToolbar({ subjectName, topicCount, onAdd }: TopicsToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <AdminText as="h2" variant="cinzel" className="font-bold text-base uppercase tracking-wider">
          Topics — {subjectName}
        </AdminText>
        <p className="text-xs text-text-muted mt-0.5">
          {topicCount} topic{topicCount !== 1 ? 's' : ''} · sorted by number order
        </p>
      </div>
      <Button variant="primary" size="sm" onClick={onAdd}>
        <Plus size={14} /> Add Topic
      </Button>
    </div>
  )
})

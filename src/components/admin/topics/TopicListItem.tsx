import React from 'react'
import {
  ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, BookOpen, Pencil, Trash2, Youtube
} from 'lucide-react'
import { Badge, IconButton, Card, PremiumIconContainer } from '../../common/AntigravityUI'
import type { StudyTopic } from '../../../types/exam.types'

interface TopicListItemProps {
  topic: StudyTopic
  index: number
  onPreview: () => void
  onEdit: () => void
  onDelete: () => void
  onTogglePublish: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}

export const TopicListItem = React.memo(function TopicListItem({
  topic,
  index,
  onPreview,
  onEdit,
  onDelete,
  onTogglePublish,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: TopicListItemProps) {
  return (
    <Card
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      variant="default"
      className="group flex items-center gap-3 p-4 hover:border-primary/30"
    >
      <PremiumIconContainer
        iconSize={14}
        className="w-8 h-8 rounded-xl font-black text-xs"
        darkClassName="bg-primary/20 text-primary"
      >
        {index + 1}
      </PremiumIconContainer>

      <GripVertical size={14} className="text-text-secondary opacity-30 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate text-text-primary">
          {topic.title_en || 'Untitled Topic'}
        </p>
        {topic.title_te && (
          <p className="text-xs text-text-secondary truncate">{topic.title_te}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {topic.youtube_url && (
            <Badge variant="default" className="!text-[9px] !py-0 !px-1.5 !gap-1">
              <Youtube size={8} /> Video
            </Badge>
          )}
          <span className="text-[10px] text-text-muted">
            EN: {topic.content_en?.length ?? 0} sections
          </span>
          {(topic.content_te?.length ?? 0) > 0 && (
            <span className="text-[10px] text-text-muted">
              · TE: {topic.content_te?.length} sections
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <IconButton
          variant="ghost"
          size="sm"
          focusRing
          onClick={e => { e.stopPropagation(); onMoveUp() }}
          disabled={isFirst}
          disabledOpacity={30}
          aria-label="Move topic up"
          className="!w-8 !h-8"
        >
          <ChevronUp size={14} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          focusRing
          onClick={e => { e.stopPropagation(); onMoveDown() }}
          disabled={isLast}
          disabledOpacity={30}
          aria-label="Move topic down"
          className="!w-8 !h-8"
        >
          <ChevronDown size={14} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          focusRing
          onClick={e => { e.stopPropagation(); onTogglePublish() }}
          aria-label={topic.is_published ? 'Unpublish topic' : 'Publish topic'}
          className={`!w-8 !h-8 ${topic.is_published ? '!text-success hover:!bg-success/10' : '!text-text-secondary'}`}
        >
          {topic.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          focusRing
          onClick={e => { e.stopPropagation(); onPreview() }}
          aria-label="Preview topic"
          title="Preview Topic"
          className="!w-8 !h-8 !text-primary hover:!bg-primary/10"
        >
          <BookOpen size={14} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          focusRing
          onClick={e => { e.stopPropagation(); onEdit() }}
          aria-label="Edit topic"
          className="!w-8 !h-8 !text-primary hover:!bg-primary/10"
        >
          <Pencil size={14} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          focusRing
          onClick={e => { e.stopPropagation(); onDelete() }}
          aria-label="Delete topic"
          className="!w-8 !h-8 !text-danger hover:!bg-danger/10"
        >
          <Trash2 size={14} />
        </IconButton>
      </div>
    </Card>
  )
})

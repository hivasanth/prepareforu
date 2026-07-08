import React from 'react'
import { motion } from 'framer-motion'
import {
  ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, BookOpen, Pencil, Trash2, Youtube
} from 'lucide-react'
import { Badge } from '../../common/AntigravityUI'
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
  isDark: boolean
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
  isDark,
}: TopicListItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all ${
        !isDark
          ? 'bg-white/60 border-primary/15 hover:border-primary/40 hover:bg-[var(--ancient-cream)]'
          : 'bg-card-bg/50 border-border-subtle/40 hover:border-primary/30'
      }`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
        !isDark ? 'bg-primary/10 text-primary' : 'bg-primary/20 text-primary'
      }`}>
        {index + 1}
      </div>

      <GripVertical size={14} className="text-text-secondary opacity-30 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${!isDark ? 'text-[var(--ancient-brown-deep)]' : 'text-text-primary'}`}>
          {topic.title_en || 'Untitled Topic'}
        </p>
        {topic.title_te && (
          <p className="text-xs text-text-secondary truncate opacity-70">{topic.title_te}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {topic.youtube_url && (
            <Badge variant="default" className="!text-[9px] !py-0 !px-1.5 !gap-1">
              <Youtube size={8} /> Video
            </Badge>
          )}
          <span className="text-[10px] text-text-secondary">
            EN: {topic.content_en?.length ?? 0} sections
          </span>
          {(topic.content_te?.length ?? 0) > 0 && (
            <span className="text-[10px] text-text-secondary">
              · TE: {topic.content_te?.length} sections
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onMoveUp() }}
          disabled={isFirst}
          aria-label="Move topic up"
          className="p-1.5 rounded-lg hover:bg-hover-bg/30 disabled:opacity-20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onMoveDown() }}
          disabled={isLast}
          aria-label="Move topic down"
          className="p-1.5 rounded-lg hover:bg-hover-bg/30 disabled:opacity-20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronDown size={14} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onTogglePublish() }}
          aria-label={topic.is_published ? 'Unpublish topic' : 'Publish topic'}
          className={`p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            topic.is_published ? 'text-success hover:bg-success/10' : 'text-text-secondary hover:bg-hover-bg/30'
          }`}
        >
          {topic.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onPreview() }}
          aria-label="Preview topic"
          className="p-1.5 rounded-lg hover:bg-primary/10 text-[#0F766E] dark:text-[#2DD4BF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title="Preview Topic"
        >
          <BookOpen size={14} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onEdit() }}
          aria-label="Edit topic"
          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          aria-label="Delete topic"
          className="p-1.5 rounded-lg hover:bg-danger/10 text-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  )
})

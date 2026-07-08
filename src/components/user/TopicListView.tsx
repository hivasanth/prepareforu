import { useTheme } from '../../context/ThemeContext'
import { TopicCard } from './TopicCard'
import type { StudyTopic } from '../../types/exam.types'

interface TopicListViewProps {
  selectedSubject: string
  topics: StudyTopic[]
  onTopicClick: (topic: StudyTopic) => void
}

export function TopicListView({ selectedSubject, topics, onTopicClick }: TopicListViewProps) {
  const { isDark } = useTheme()

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className={`font-black text-lg uppercase tracking-wider ${!isDark ? 'font-cinzel text-[#3D1F08]' : 'text-text-primary'}`}>
          {selectedSubject}
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          {topics.length} topic{topics.length !== 1 ? 's' : ''} · click any to start reading
        </p>
      </div>

      <div className="space-y-3">
        {topics.map(topic => (
          <TopicCard
            key={topic.id}
            topic={topic}
            onClick={() => onTopicClick(topic)}
          />
        ))}
      </div>
    </div>
  )
}

import { useTheme } from '../../../context/ThemeContext'
import { H2, Body } from '../../common/AntigravityTypography'
import { TopicCard } from './TopicCard'
import type { StudyTopic } from '../../../types/exam.types'

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
        <H2 className={`font-black text-lg uppercase tracking-wider ${!isDark ? 'font-cinzel text-text-title' : 'text-text-primary'}`}>
          {selectedSubject}
        </H2>
        <Body className="text-xs text-text-secondary mt-1">
          {topics.length} topic{topics.length !== 1 ? 's' : ''} · click any to start reading
        </Body>
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

import { ChevronRight } from 'lucide-react'
import { Card, PremiumIconContainer } from '../../common/AntigravityUI'
import { H3, Body } from '../../common/AntigravityTypography'
import { useTheme } from '../../../context/ThemeContext'
import type { StudyTopic } from '../../../types/exam.types'

interface TopicCardProps {
  topic: StudyTopic
  onClick: () => void
}

export function TopicCard({ topic, onClick }: TopicCardProps) {
  const { isDark } = useTheme()
  return (
    <Card
      variant="default"
      className="flex items-center gap-4 p-4 group hover:shadow-card-premium"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
    >
      <PremiumIconContainer
        iconSize={14}
        className="w-11 h-11 rounded-xl font-black text-sm"
        darkClassName="bg-hover-bg text-text-secondary lg:group-hover:bg-primary lg:group-hover:text-white"
      >
        {topic.display_order}
      </PremiumIconContainer>

      <div className="flex-1 min-w-0">
        <H3 className={`font-black text-sm truncate m-0 ${!isDark ? 'font-cinzel text-text-title' : 'text-text-primary'}`}>
          {topic.title_en}
        </H3>
        {topic.title_te && (
          <Body className="text-xs text-text-secondary truncate opacity-80 mt-0.5">{topic.title_te}</Body>
        )}
      </div>

      <ChevronRight
        size={18}
        className={`flex-shrink-0 transition-transform lg:group-hover:translate-x-1 ${
          !isDark ? 'text-text-primary stroke-[2.5]' : 'text-text-secondary'
        }`}
      />
    </Card>
  )
}

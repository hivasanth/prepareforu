import { memo } from 'react'
import { Input } from '../../common/AntigravityUI'
import { FloatingListItem } from '../../common/AntigravityUI'
import { getTopicThreshold, TOPIC_INPUT_CLASS } from './utils/topicConfigUtils'
import type { ExamTopicConfig } from '../../../types/exam.types'
import type { ConfigMode } from './utils/topicConfigUtils'

interface TopicRequirementCardProps {
  topic: ExamTopicConfig
  mode: ConfigMode
  onChange: (topicId: string, value: number) => void
}

export const TopicRequirementCard = memo(function TopicRequirementCard({
  topic,
  mode,
  onChange,
}: TopicRequirementCardProps) {
  const required = getTopicThreshold(topic, mode)

  return (
    <FloatingListItem>
      <div className="flex items-center w-full">
        <p className="flex-1 min-w-0 text-sm font-bold text-text-primary truncate">
          {topic.topic_en}
        </p>
        <div className="w-24 flex justify-center flex-shrink-0">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={required}
            onChange={(e) => onChange(topic.id, Number(e.target.value))}
            className={TOPIC_INPUT_CLASS}
            aria-label={`Required questions for ${topic.topic_en}`}
          />
        </div>
      </div>
    </FloatingListItem>
  )
})

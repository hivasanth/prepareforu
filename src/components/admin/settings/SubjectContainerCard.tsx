import { memo } from 'react'
import { Card, Input, Label } from '../../common/AntigravityUI'
import { FloatingList, FloatingListHeader, FloatingListItem } from '../../common/AntigravityUI'
import { Alert } from '../../common/Alert'
import { Skeleton } from '../../common/Skeleton'
import { TopicRequirementCard } from './TopicRequirementCard'
import { getTopicThresholdSum } from './utils/topicConfigUtils'
import type { ExamSubject, ExamTopicConfig } from '../../../types/exam.types'
import type { ConfigMode } from './utils/topicConfigUtils'

interface SubjectContainerCardProps {
  subject: ExamSubject
  topics: ExamTopicConfig[] | null
  topicLoading: boolean
  mode?: ConfigMode
  /** Subject Test mode: when set, the header renders a read-only
   *  CONFIGURED `{sum} / {total}` summary and validity is measured against
   *  this total instead of `subject.question_count`. */
  testTotal?: number | null
  onTopicThresholdChange: (topicId: string, value: number) => void
  onQuestionCountChange?: (value: number) => void
  onBlur?: () => void
}

export const SubjectContainerCard = memo(function SubjectContainerCard({
  subject,
  topics,
  topicLoading,
  mode = 'exam',
  testTotal = null,
  onTopicThresholdChange,
  onQuestionCountChange,
  onBlur,
}: SubjectContainerCardProps) {
  const topicSum = topics ? getTopicThresholdSum(topics, mode) : 0
  const isValid = testTotal !== null ? topicSum === testTotal : topicSum === subject.question_count

  return (
    <Card variant="elevated" className="space-y-4">
      {/* ── Subject row ── */}
      <FloatingList>
        <FloatingListHeader>
          <div className="flex items-center w-full text-[10px] font-bold text-text-muted light:text-[var(--gold-300)] uppercase tracking-widest">
            <span className="flex-1 pl-1">Subject</span>
            <span className="w-24 text-center">{testTotal !== null ? 'Configured' : 'Questions'}</span>
          </div>
        </FloatingListHeader>

        <FloatingListItem>
          <div className="flex items-center w-full">
            <span className="flex-1 text-sm font-bold text-text-primary truncate">
              {subject.subject_name}
            </span>
            {testTotal !== null ? (
              <div className="w-24 flex items-center justify-center flex-shrink-0">
                <span
                  className={`text-[11px] font-bold tabular-nums ${isValid ? 'text-text-primary' : 'text-danger'}`}
                  aria-label={`Configured ${topicSum} of ${testTotal} questions`}
                >
                  {topicSum} / {testTotal}
                </span>
              </div>
            ) : (
              <div className="w-24 flex items-center justify-center gap-1.5 flex-shrink-0">
                <Label htmlFor={`subj-q-${subject.id}`} className="text-[9px] uppercase tracking-wider text-text-muted mb-0">Q</Label>
                <Input
                  id={`subj-q-${subject.id}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={subject.question_count}
                  onChange={(e) => onQuestionCountChange?.(Number(e.target.value))}
                  onBlur={onBlur}
                  className="min-w-[56px] w-14 py-1 text-xs font-bold text-center flex-shrink-0"
                  aria-label={`Questions for ${subject.subject_name}`}
                />
              </div>
            )}
          </div>
        </FloatingListItem>
      </FloatingList>

      {/* ── Topics grid ── */}
      {topicLoading ? (
        <div role="status" aria-label="Loading topics" className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} type="card" unit="row" variant="premium" decorative pad="p-4">
              <div className="flex items-center gap-3 w-full">
                <Skeleton type="text" height={12} className="flex-1" decorative />
                <Skeleton type="text" height={28} width={72} borderRadius={8} decorative />
              </div>
            </Skeleton>
          ))}
        </div>
      ) : topics === null ? (
        <div className="py-4 text-center">
          <p className="text-[10px] text-text-muted">Loading topics...</p>
        </div>
      ) : topics.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-[10px] text-text-muted">No topics found</p>
        </div>
      ) : (
        <FloatingList>
          <FloatingListHeader>
            <div className="flex items-center w-full text-[10px] font-bold text-text-muted light:text-[var(--gold-300)] uppercase tracking-widest">
              <span className="flex-1 pl-1">Topic</span>
              <span className="w-24 text-center">Required</span>
            </div>
          </FloatingListHeader>

          {topics.map((topic) => (
            <TopicRequirementCard
              key={topic.id}
              topic={topic}
              mode={mode}
              onChange={onTopicThresholdChange}
            />
          ))}
        </FloatingList>
      )}

      {topics !== null && topics.length > 0 && !isValid && (
        <Alert variant="error" className="text-[11px]">
          {testTotal !== null
            ? `Configured total ${topicSum} must equal the selected ${testTotal} questions.`
            : `Required total: ${subject.question_count} · Configured topic total: ${topicSum}`}
        </Alert>
      )}
    </Card>
  )
})

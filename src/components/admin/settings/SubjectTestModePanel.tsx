import { memo } from 'react'
import { Stack } from '../../common/AntigravityUI'
import { SectionReveal } from '../../common/AntigravityAnimation'
import { SegmentedFilter } from '../../common/SegmentedFilter'
import { SubjectContainerCard } from './SubjectContainerCard'
import type { TestMode } from './useAdminSettings'
import type { ExamSubject, ExamTopicConfig } from '../../../types/exam.types'

interface SubjectTestModePanelProps {
  subjects: ExamSubject[]
  selectedSubject: string
  topicConfigs: Record<string, ExamTopicConfig[]>
  topicLoading: Record<string, boolean>
  testMode: TestMode
  onTestModeChange: (mode: TestMode) => void
  onTopicThresholdChange: (subjectName: string, topicId: string, value: number) => void
}

/**
 * Subject Test mode — another MODE of the same Admin Settings system.
 * Reuses the exact selection container / topic-row / input / skeleton
 * components as EXAMS mode; only the data and business rules differ
 * (per-mode totals validated against the 20/30/50 segmented filter).
 */
export const SubjectTestModePanel = memo(function SubjectTestModePanel({
  subjects, selectedSubject, topicConfigs, topicLoading,
  testMode, onTestModeChange, onTopicThresholdChange,
}: SubjectTestModePanelProps) {
  const selectedSub = subjects.find(s => s.subject_name === selectedSubject)

  return (
    <SectionReveal>
      <Stack gap="md">
        <SegmentedFilter
          ariaLabel="Subject test mode"
          size="sm"
          options={[
            { id: '20', label: '20 Questions' },
            { id: '30', label: '30 Questions' },
            { id: '50', label: '50 Questions' },
          ]}
          value={testMode}
          onChange={(val) => onTestModeChange(val as TestMode)}
        />

        {!selectedSub ? (
          <div className="py-8 text-center">
            <p className="text-[10px] text-text-muted">Select a subject from the navigation above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div id={`subject-test-${selectedSub.subject_name}`}>
              <SubjectContainerCard
                subject={selectedSub}
                topics={topicConfigs[selectedSub.subject_name] ?? null}
                topicLoading={topicLoading[selectedSub.subject_name] ?? false}
                mode={testMode}
                testTotal={Number(testMode)}
                onTopicThresholdChange={(topicId, value) => onTopicThresholdChange(selectedSub.subject_name, topicId, value)}
              />
            </div>
          </div>
        )}
      </Stack>
    </SectionReveal>
  )
})

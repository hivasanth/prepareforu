import { BookOpen } from 'lucide-react'
import { Stack, Card, IconBadge } from '../../common/AntigravityUI'
import { Body } from '../../common/AntigravityTypography'
import { EmptyState } from '../../common/SharedComponents'
import { SectionReveal } from '../../common/AntigravityAnimation'
import { UserSelectionTabs } from '../UserSelectionTabs'
import { TopicInfoButton } from '../../common/TopicInfoButton'
import { StartTestButton } from '../../common/StartTestButton'
import type { ExamPaper } from '../../../types/exam.types'

interface SubjectPortalViewProps {
  isAppsc: boolean;
  groupOptions: { id: string, label: string }[];
  papers: ExamPaper[];
  activeGroup: string;
  selectedPaperId: string | null;
  onExamChange: (id: string) => void;
  onPaperChange: (id: string) => void;
  subjects: string[];
  subjectCounts: Record<string, number>;
  onSubjectClick: (subject: string) => void;
  minQuestions?: number;
}

export function SubjectPortalView({
  isAppsc,
  groupOptions,
  papers,
  activeGroup,
  selectedPaperId,
  onExamChange,
  onPaperChange,
  subjects,
  subjectCounts,
  onSubjectClick,
  minQuestions = 30
}: SubjectPortalViewProps) {
  const paperOptions = papers
    .filter(p => p.exam_id === activeGroup)
    .map(p => ({ label: p.paper_name, id: p.id }));

  return (
    <div className="w-full">
      <Stack gap="lg">
        {isAppsc && (
          <SectionReveal className="w-full">
            <UserSelectionTabs
              selectedExam={activeGroup}
              setSelectedExam={onExamChange}
              selectedPaper={selectedPaperId || ''}
              setSelectedPaper={onPaperChange}
              customExamTabs={groupOptions}
              customPapers={paperOptions}
              showSubjects={false}
              hideAll={true}
            />
          </SectionReveal>
        )}

        <Stack gap={16}>
          {subjects.length === 0 ? (
            <EmptyState
              icon="📚"
              title="No subjects available"
              subtitle="Check back later or contact your administrator for access."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4" aria-live="polite">
              {subjects.map(subjectKey => {
                const count = subjectCounts[subjectKey] || 0;
                const hasMinimum = count >= minQuestions;
                return (
                  <Card key={subjectKey} variant="premium-dark-neutral" className="relative p-5 text-left flex flex-col gap-4">
                    <div className="flex items-center justify-between w-full">
                      <IconBadge icon={BookOpen} size="xl" shape="rounded" className="rounded-button-md" />
                      <TopicInfoButton displayTitle={subjectKey} heading="Subject Name" />
                    </div>
                    <div title={subjectKey}>
                      <Body className="text-[14px] font-bold text-text-primary leading-tight truncate uppercase tracking-tight block w-full m-0">
                        {subjectKey}
                      </Body>
                    </div>
                    <StartTestButton hasMinimum={hasMinimum} subjectName={subjectKey} onClick={() => onSubjectClick(subjectKey)} />
                  </Card>
                );
              })}
            </div>
          )}
        </Stack>
      </Stack>
    </div>
  );
}

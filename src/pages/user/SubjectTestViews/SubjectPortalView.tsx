import { AlertCircle, BookOpen } from 'lucide-react'
import { Stack, Card, IconBadge } from '../../../components/common/AntigravityUI'
import { SectionReveal } from '../../../components/common/AntigravityAnimation'
import { UserSelectionTabs } from '../../../components/user/UserSelectionTabs'
import { TopicInfoButton } from '../../../components/common/TopicInfoButton'
import { StartTestButton } from '../../../components/common/StartTestButton'

interface SubjectPortalViewProps {
  isAppsc: boolean;
  isMobile: boolean;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  groupOptions: { id: string, label: string }[];
  papers: any[];
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
  isMobile,
  isFilterOpen,
  setIsFilterOpen,
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
              className="bg-transparent border-none p-0 w-full"
            />
          </SectionReveal>
        )}

        <Stack gap={16}>
          {subjects.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-border-subtle rounded-[20px] bg-hover-bg/20">
              <AlertCircle className="mx-auto mb-3 text-text-disabled" size={32} />
              <p className="text-[14px] font-bold text-text-disabled uppercase tracking-widest">No subjects available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {subjects.map(s => {
                const count = subjectCounts[s] || 0;
                const hasMinimum = count >= minQuestions;
                return (
                  <Card key={s} className="relative !p-5 transition-all text-left flex flex-col gap-4">
                    <div className="flex items-center justify-between w-full">
                      <IconBadge icon={BookOpen} size="xl" shape="rounded" className="rounded-[14px]" />
                      <TopicInfoButton displayTitle={s} heading="Subject Name" />
                    </div>
                    <span className="text-[14px] font-bold text-text-primary leading-tight truncate uppercase tracking-tight block w-full" title={s}>
                      {s}
                    </span>
                    <StartTestButton hasMinimum={hasMinimum} onClick={() => onSubjectClick(s)} />
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

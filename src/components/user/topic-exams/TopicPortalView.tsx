import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { BilingualToggle } from '../../common/BilingualToggle'
import { Stack, Card, Tabs, Label, IconBadge, SelectionContainer } from '../../common/AntigravityUI'
import { Body } from '../../common/AntigravityTypography'
import { EmptyState, GridSkeleton } from '../../common/SharedComponents'
import { SectionReveal } from '../../common/AntigravityAnimation'
import { UserSelectionTabs } from '../UserSelectionTabs'
import { TopicInfoButton } from '../../common/TopicInfoButton'
import { StartTestButton } from '../../common/StartTestButton'
import type { TopicItem } from '../../../services/topicTestService'
import type { ExamPaper } from '../../../types/exam.types'

interface TopicPortalViewProps {
  isAppsc: boolean;
  groupOptions: { id: string, label: string }[];
  papers: ExamPaper[];
  activeGroup: string;
  selectedPaperId: string | null;
  onExamChange: (id: string) => void;
  onPaperChange: (id: string) => void;
  
  // Subject Filter
  subjects: string[];
  selectedSubject: string | null;
  onSubjectChange: (subject: string) => void;

  // Topics Grid
  topics: TopicItem[];
  topicCounts: Record<string, number>;
  onTopicClick: (topic: TopicItem) => void;
  topicsLoading?: boolean;
  minQuestions?: number;
}

export function TopicPortalView({
  isAppsc,
  groupOptions,
  papers,
  activeGroup,
  selectedPaperId,
  onExamChange,
  onPaperChange,
  subjects,
  selectedSubject,
  onSubjectChange,
  topics,
  topicCounts,
  onTopicClick,
  topicsLoading = false,
  minQuestions = 30
}: TopicPortalViewProps) {
  const [lang, setLang] = useState<'en' | 'te'>('en');

  const paperOptions = papers
    .filter(p => p.exam_id === activeGroup)
    .map(p => ({ label: p.paper_name, id: p.id }));

  const subjectOptions = subjects.map(s => ({ label: s, id: s }));

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
              selectedSubject={selectedSubject || 'all'}
              setSelectedSubject={onSubjectChange}
              customExamTabs={groupOptions}
              customPapers={paperOptions}
              customSubjects={subjectOptions}
              hideAll={true}
            />
          </SectionReveal>
        )}

        {/* Subject tabs (non-APPSC) */}
        {!isAppsc && subjects.length > 0 && (
          <SelectionContainer>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 flex-grow">
                <Label className="uppercase font-bold tracking-widest text-[11px] text-text-muted">Select Subject</Label>
                <div className="w-full">
                  <Tabs 
                    ariaLabel="Select subject"
                    options={subjectOptions}
                    activeId={selectedSubject || ''}
                    onChange={onSubjectChange}
                    bare
                  />
                </div>
              </div>
            </div>
          </SelectionContainer>
        )}

        {/* Language Toggle (all users) */}
        {subjects.length > 0 && (
          <div className="flex justify-end">
            <div className="flex flex-col gap-2 min-w-[140px]">
              <Label className="uppercase font-bold tracking-widest text-[11px] text-text-muted">Language</Label>
              <BilingualToggle
                displayLang={lang}
                onChange={setLang}
              />
            </div>
          </div>
        )}

        {/* Topics Grid */}
        <div>
          <Label className="uppercase font-bold tracking-widest text-[11px] text-text-muted block mb-4">Select Topic</Label>
          
          {topicsLoading ? (
            <div role="status" aria-label="Loading topics" className="w-full">
              <GridSkeleton count={6} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" gap="gap-4" decorative />
            </div>
          ) : topics.length === 0 ? (
            <EmptyState title="No topics available" subtitle="Select a different subject to view topics." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite">
              {topics.map(t => {
                const count = topicCounts[t.topic_en] || 0;
                const hasMinimum = count >= minQuestions;
                
                const hasTelugu = !!t.topic_te;
                const displayTitle = (lang === 'te' && hasTelugu) ? t.topic_te! : t.topic_en;

                return (
                  <Card key={t.id ?? t.topic_en} variant="premium-dark-neutral" padding={20} className="relative text-left flex flex-col gap-4">
                    <div className="flex items-center justify-between w-full">
                      <IconBadge icon={BookOpen} size="xl" shape="rounded" className="rounded-button-md" />
                      <TopicInfoButton displayTitle={displayTitle} />
                    </div>
                    <div title={displayTitle}>
                      <Body className="text-[14px] font-bold text-text-primary leading-tight truncate uppercase tracking-tight block w-full m-0">
                        {displayTitle}
                      </Body>
                    </div>
                    <StartTestButton hasMinimum={hasMinimum} subjectName={displayTitle} onClick={() => onTopicClick(t)} />
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Stack>
    </div>
  );
}

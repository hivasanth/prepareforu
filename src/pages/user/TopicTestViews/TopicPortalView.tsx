import { useState } from 'react'
import { AlertCircle, BookOpen } from 'lucide-react'
import { BilingualToggle } from '../../../components/common/BilingualToggle'
import { Stack, Card, Tabs, Label, IconBadge } from '../../../components/common/AntigravityUI'
import { SectionReveal } from '../../../components/common/AntigravityAnimation'
import { UserSelectionTabs } from '../../../components/user/UserSelectionTabs'
import { TopicInfoButton } from '../../../components/common/TopicInfoButton'
import { StartTestButton } from '../../../components/common/StartTestButton'
import type { TopicItem } from '../../../services/topicTestService'

interface TopicPortalViewProps {
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
  
  // Subject Filter
  subjects: string[];
  selectedSubject: string | null;
  onSubjectChange: (subject: string) => void;

  // Topics Grid
  topics: TopicItem[];
  topicCounts: Record<string, number>;
  onTopicClick: (topic: string) => void;
  topicsLoading?: boolean;
  minQuestions?: number;
}

export function TopicPortalView({
  isAppsc,
  isMobile: _isMobile,
  isFilterOpen: _isFilterOpen,
  setIsFilterOpen: _setIsFilterOpen,
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
              className="bg-transparent border-none p-0 w-full"
            />
          </SectionReveal>
        )}

        {/* Subject tabs (non-APPSC) */}
        {!isAppsc && subjects.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 flex-grow">
              <Label className="uppercase font-bold tracking-widest text-[11px] text-text-secondary opacity-60">Select Subject</Label>
              <div className="w-full">
                <Tabs 
                  options={subjectOptions}
                  activeId={selectedSubject || ''}
                  onChange={onSubjectChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Language Toggle (all users) */}
        {subjects.length > 0 && (
          <div className="flex justify-end">
            <div className="flex flex-col gap-2 min-w-[140px]">
              <Label className="uppercase font-bold tracking-widest text-[11px] text-text-secondary opacity-60">Language</Label>
              <BilingualToggle
                displayLang={lang}
                onChange={setLang}
                showShadow
              />
            </div>
          </div>
        )}

        {/* Topics Grid */}
        <div>
          <Label className="uppercase font-bold tracking-widest text-[11px] text-text-secondary opacity-60 block mb-4">Select Topic</Label>
          
          {topicsLoading ? (
            <div className="py-8 text-center">
              <span className="text-[13px] font-bold text-text-secondary uppercase tracking-widest animate-pulse">Loading topics...</span>
            </div>
          ) : topics.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-border-subtle rounded-[20px] bg-hover-bg/20">
              <AlertCircle className="mx-auto mb-3 text-text-disabled" size={32} />
              <p className="text-[14px] font-bold text-text-disabled uppercase tracking-widest">No topics available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map(t => {
                const count = topicCounts[t.topic_en] || 0;
                const hasMinimum = count >= minQuestions;
                
                const hasTelugu = !!t.topic_te;
                const displayTitle = (lang === 'te' && hasTelugu) ? t.topic_te! : t.topic_en;

                return (
                  <Card key={t.topic_en} className="relative !p-5 transition-all text-left flex flex-col gap-4">
                    <div className="flex items-center justify-between w-full">
                      <IconBadge icon={BookOpen} size="xl" shape="rounded" className="rounded-[14px]" />
                      <TopicInfoButton displayTitle={displayTitle} />
                    </div>
                    <span className="text-[14px] font-bold text-text-primary leading-tight truncate uppercase tracking-tight block w-full" title={displayTitle}>
                      {displayTitle}
                    </span>
                    <StartTestButton hasMinimum={hasMinimum} onClick={() => onTopicClick(t.topic_en)} />
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

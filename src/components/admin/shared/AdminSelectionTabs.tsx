import { motion } from 'framer-motion'
import { Tabs, Stack, SelectionContainer, ErrorContainer, RetryButton, H2, Body } from '../../common/AntigravityUI'
import { MOTION_DURATION, MOTION_EASE } from '../../common/AntigravityMotion'
import { Skeleton } from '../../common/Skeleton'
import { useExamPaperSubjectSelection, APPSC_SUB_TABS, type ExamPaperSubjectSelectionResult } from '../../../hooks/useExamPaperSubjectSelection'

interface AdminSelectionTabsProps {
  selectedExam: string
  setSelectedExam: (val: string) => void
  selectedPaper?: string
  setSelectedPaper?: (val: string) => void
  selectedSubject?: string
  setSelectedSubject?: (val: string) => void
  selectedTopic?: string
  setSelectedTopic?: (val: string) => void
  hideAll?: boolean
  showPapers?: boolean
  showSubjects?: boolean
  /** Opt-in Topic row (Exam -> Paper -> Subject -> Topic). */
  showTopics?: boolean
  onContextUpdate?: (labels: { exam: string; paper: string }) => void
  /** Flatten APPSC groups into individual tabs (no parent "APPSC" tab) */
  flattenAppsc?: boolean
  /** Pre-computed exam tab options (skip internal fetch) */
  customExamTabs?: { label: string; id: string }[]
  /** Pre-computed paper options (skip internal fetch) */
  customPapers?: { label: string; id: string }[]
  /** Pre-computed subject options (skip internal fetch) */
  customSubjects?: { label: string; id: string }[]
  /** Externally-supplied selection state (the host page already owns a
   *  useExamPaperSubjectSelection instance). When provided this component
   *  renders FROM it and never mounts a second internal instance — no
   *  duplicated topic queries or duplicated auto-selection effects. */
  externalSelection?: ExamPaperSubjectSelectionResult | null
}

/* ── Topic row loading skeleton (A5-A7) ─────────────────────────────────────
 * THE mutually-exclusive loading state for the topic row: a chip-row of 5
 * skeletons shaped like the live topic tabs. It renders ONLY while the segment
 * topics are being fetched — never under the loaded (tabs), error (retry) or
 * empty (no-topics) states, and never as a final content surface. */
function TopicSkeleton() {
  const chipWidths = [96, 148, 116, 168, 104]
  return (
    <div role="status" aria-label="Loading topics" className="flex flex-wrap items-center gap-3">
      {chipWidths.map((w, i) => (
        <Skeleton key={`${w}-${i}`} variant="premium" type="text" height={40} width={w} borderRadius={999} decorative />
      ))}
    </div>
  )
}

/* ── Presentational body ───────────────────────────────────────────────────
 * Every selector row reads its data from `selection`, which is supplied either
 * by an external owner (AdminQuestions page) or by the internal hook instance
 * (AdminSelectionTabsInternal). No hooks live here — pure rendering. */
function AdminSelectionTabsBody({
  selection,
  selectedExam, setSelectedExam,
  selectedPaper = 'all', setSelectedPaper = () => {},
  selectedSubject = 'all', setSelectedSubject,
  selectedTopic = '', setSelectedTopic,
  hideAll = false,
  showPapers = true,
  showSubjects = true,
  showTopics = false,
  customExamTabs,
  customPapers,
  customSubjects,
  flattenAppsc = false,
}: Omit<AdminSelectionTabsProps, 'externalSelection'> & { selection: ExamPaperSubjectSelectionResult }) {
  const {
    examTabs,
    examTabsError,
    retryExamTabs,
    papersError,
    refetchPapers,
    isAppscActive,
    displayPapers,
    displaySubjects,
    displayTopics,
    topicsLoading,
    topicsError,
    refetchTopics,
    paperRowOpen,
    subjectRowOpen,
    topicsRowOpen,
  } = selection

  return (
    <div className="w-full relative">
      <SelectionContainer>
        <Stack gap="sm" className="w-full">
          {/* LEVEL 1: Main exam tabs — a failed load surfaces the canonical
              error + retry surface instead of a silent empty tab strip. */}
          <div className="w-full flex justify-center lg:justify-start">
            {examTabsError && examTabs.length === 0 ? (
              <ErrorContainer variant="inline" className="w-full">
                <H2>Failed to load exam list</H2>
                <Body>{examTabsError}</Body>
                <RetryButton onRetry={retryExamTabs} />
              </ErrorContainer>
            ) : (
              <div className="w-full max-w-full overflow-x-auto custom-scrollbar">
                  <Tabs
                    ariaLabel="Select exam"
                    options={examTabs}
                    activeId={customExamTabs ? selectedExam : (isAppscActive && !flattenAppsc ? 'APPSC_GROUPS' : selectedExam)}
                    onChange={setSelectedExam}
                    variant="primary"
                    className="w-full"
                    bare
                  />
              </div>
            )}
          </div>

          {/* Sub-level rows — kept mounted during fetches to avoid flicker */}
          {(!customExamTabs || showPapers || showSubjects || showTopics) && (
          <motion.div
            initial={false}
            animate={{ 
              height: (isAppscActive || paperRowOpen || subjectRowOpen) ? 'auto' : 0,
              opacity: (isAppscActive || paperRowOpen || subjectRowOpen) ? 1 : 0
            }}
            transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.standard }}
            className="w-full flex flex-col overflow-hidden"
          >
            <div className="pt-3 flex flex-col gap-3">
              {/* Subtle Divider */}
              <div className="h-px w-full mx-auto opacity-30 bg-border-subtle" />

              <div>
                <Stack gap="sm">
                  {/* LEVEL 2: APPSC Specific Groups (skip when custom data or flattenAppsc — parent handles grouping) */}
                  {isAppscActive && !customExamTabs && !flattenAppsc && (
                    <div className="w-full flex justify-center lg:justify-start">
                      <div className="w-full max-w-full overflow-x-auto custom-scrollbar">
                        <Tabs 
                          ariaLabel="Select exam group"
                          options={[
                            ...(!hideAll ? [{ label: 'ALL GROUPS', id: 'APPSC_GROUPS' }] : []),
                            ...APPSC_SUB_TABS
                          ]}
                          activeId={selectedExam}
                          onChange={setSelectedExam}
                          variant="secondary"
                          className="w-full"
                          bare
                        />
                      </div>
                    </div>
                  )}

                  {/* LEVEL 3: Papers — a failed load surfaces the canonical
                      error + retry surface instead of a silent empty row.
                      Retained papers from a previous successful load keep
                      rendering (flicker prevention), matching the exam-tab
                      error gating. */}
                  {paperRowOpen && (
                    <div className="w-full flex justify-center lg:justify-start">
                      {papersError && !(displayPapers && displayPapers.length > 0) ? (
                        <ErrorContainer variant="inline" className="w-full">
                          <H2>Failed to load papers</H2>
                          <Body>{papersError}</Body>
                          <RetryButton onRetry={refetchPapers} />
                        </ErrorContainer>
                      ) : (
                        <div className="w-full max-w-full overflow-x-auto custom-scrollbar">
                        <Tabs 
                          ariaLabel="Select paper"
                          options={[
                            ...(!hideAll && !customPapers ? [{ label: 'ALL PAPERS', id: 'all' }] : []),
                            ...(displayPapers ?? []).map(p => ({
                              label: (('paper_name' in p ? (p as unknown as Record<string, unknown>).paper_name : (p as unknown as Record<string, unknown>).label) as string).toUpperCase(),
                              id: p.id
                            }))
                          ]}
                          activeId={selectedPaper}
                          onChange={setSelectedPaper}
                          variant="secondary"
                          className="w-full"
                          bare
                        />
                        </div>
                      )}
                    </div>
                  )}
 
                  {/* LEVEL 4: Subjects */}
                  {subjectRowOpen && setSelectedSubject && (
                    <div className="w-full flex justify-center lg:justify-start">
                      <div className="w-full max-w-full overflow-x-auto custom-scrollbar">
                        <Tabs 
                          ariaLabel="Select subject"
                          options={[
                            ...(!hideAll && !customSubjects ? [{ label: 'ALL SUBJECTS', id: 'all' }] : []),
                            ...(displaySubjects ?? []).map(s => ({
                              label: (('subject_name' in s ? (s as unknown as Record<string, unknown>).subject_name : (s as unknown as Record<string, unknown>).label) as string).toUpperCase(),
                              id: ('subject_name' in s ? (s as unknown as Record<string, unknown>).subject_name : (s as unknown as Record<string, unknown>).id) as string
                            }))
                          ]}
                          activeId={selectedSubject}
                          onChange={setSelectedSubject}
                          variant="secondary"
                          className="w-full"
                          bare
                        />
                      </div>
                    </div>
                  )}

                  {/* LEVEL 5: Topics — opt-in, LIVE exam_topics only. No
                      'all topics' option exists: the row ends in a skeleton
                      while the segment topics fetch, a canonical error+retry
                      surface on failure, the explicit empty state when the
                      list resolves empty, and otherwise the live topic tabs.
                      The four states are mutually exclusive (A5-A7). */}
                  {showTopics && setSelectedTopic && topicsRowOpen && (
                    <div className="w-full flex justify-center lg:justify-start">
                      {topicsLoading ? (
                        <TopicSkeleton />
                      ) : topicsError && !(displayTopics && displayTopics.length > 0) ? (
                        <ErrorContainer variant="inline" className="w-full">
                          <H2>Failed to load topics</H2>
                          <Body>{topicsError}</Body>
                          <RetryButton onRetry={refetchTopics} />
                        </ErrorContainer>
                      ) : displayTopics !== null && displayTopics.length === 0 ? (
                        <div className="w-full text-center lg:text-left text-[11px] text-text-muted py-1">
                          No topics available for this subject.
                        </div>
                      ) : (
                        <div className="w-full max-w-full overflow-x-auto custom-scrollbar">
                          <Tabs
                            ariaLabel="Select topic"
                            options={(displayTopics ?? []).map(t => ({
                              label: t.topic_en.toUpperCase(),
                              id: t.id ?? t.topic_en,
                            }))}
                            activeId={selectedTopic}
                            onChange={setSelectedTopic}
                            variant="secondary"
                            className="w-full"
                            bare
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Stack>
              </div>
            </div>
          </motion.div>
          )}
        </Stack>
      </SelectionContainer>
    </div>
  )
}

/* ── Default wiring — the component owns a useExamPaperSubjectSelection
 *  instance (existing App-level consumers are unchanged). */
function AdminSelectionTabsInternal(props: Omit<AdminSelectionTabsProps, 'externalSelection'>) {
  const {
    selectedExam, setSelectedExam,
    selectedPaper, setSelectedPaper,
    selectedSubject, setSelectedSubject,
    selectedTopic, setSelectedTopic,
    hideAll, showPapers, showSubjects, showTopics,
    onContextUpdate,
    customExamTabs, customPapers, customSubjects,
    flattenAppsc,
  } = props
  const selection = useExamPaperSubjectSelection({
    selectedExam, setSelectedExam,
    selectedPaper, setSelectedPaper,
    selectedSubject, setSelectedSubject,
    selectedTopic, setSelectedTopic,
    hideAll, showPapers, showSubjects, showTopics,
    onContextUpdate,
    customExamTabs, customPapers, customSubjects,
    flattenAppsc,
  })
  return <AdminSelectionTabsBody selection={selection} {...props} />
}

export function AdminSelectionTabs({ externalSelection, ...props }: AdminSelectionTabsProps) {
  return externalSelection
    ? <AdminSelectionTabsBody selection={externalSelection} {...props} />
    : <AdminSelectionTabsInternal {...props} />
}
import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Badge, Button, Card, Body, H2, PageContainer, Stack, ErrorContainer, RetryButton } from '../../components/common/AntigravityUI'
import { SegmentedFilter } from '../../components/common/SegmentedFilter'
import { AdminText } from '../../components/common/AdminText'
import { Skeleton } from '../../components/common/Skeleton'
import { GridSkeleton } from '../../components/common/SharedComponents'
import { useAdminFilters } from '../../hooks/useAdminFilters'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { BulkUploadPanel } from '../../components/admin/questions/BulkUploadPanel'
import { BULK_WORKFLOW_TABS, type BulkTabType, type ParsedDataItem } from '../../components/admin/questions/useBulkUpload'
import { fetchTopicRecord, type TopicRecord } from '../../services/topicTestService'
import { isExamAllowed } from '../../utils/examUtils'

/* ── Topic-specific Bulk Parser page ──────────────────────────────────────────
 * Route identity is the canonical exam_topics.id. The LIVE record (and its
 * English/Telugu names) always resolve from exam_topics — never from the URL.
 * A topic that does not exist, or that falls outside the current
 * exam/paper/subject context, renders the canonical error state instead of
 * another topic's workflow.
 * ────────────────────────────────────────────────────────────────────────── */
export default function AdminBulkParserTopic() {
  const { topicId } = useParams<{ topicId: string }>()
  const { selectedExam, selectedPaper, selectedSubject } = useAdminFilters()
  const navigate = useNavigate()

  // INSTRUCTIONS is the canonical entry segment of the preserved workflow.
  const [activeTab, setActiveTab] = useState<BulkTabType>('instructions')
  const [parsedData, setParsedData] = useState<ParsedDataItem[]>([])

  const contextValid =
    selectedExam !== 'all' &&
    selectedExam !== 'APPSC_GROUPS' &&
    selectedPaper !== 'all' &&
    selectedSubject !== 'all'

  const backToTopics = useCallback(() => {
    const params = new URLSearchParams({ exam: selectedExam, paper: selectedPaper, subject: selectedSubject })
    navigate(`/admin/upload?${params.toString()}`)
  }, [navigate, selectedExam, selectedPaper, selectedSubject])

  const { data: liveTopic, loading: topicLoading, error: topicError, refetch: refetchTopic } =
    useSupabaseQuery<TopicRecord | null>(async () => {
      if (!contextValid || !topicId) return { data: null, error: null }
      try {
        return { data: await fetchTopicRecord(topicId), error: null }
      } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Failed to load topic.' }
      }
    }, [topicId, contextValid], 'bulk_parser_topic')

  // Segment membership check — the route id must resolve to a LIVE topic of
  // the CURRENT exam/paper/subject context before any workflow content mounts.
  // A valid route alone authorizes nothing.
  const segmentValid = useMemo(() => {
    if (!liveTopic) return false
    return (
      isExamAllowed(selectedExam, liveTopic.exam_id) &&
      liveTopic.paper_id === selectedPaper &&
      liveTopic.subject_name === selectedSubject
    )
  }, [liveTopic, selectedExam, selectedPaper, selectedSubject])

  const workflowReady = !!liveTopic && segmentValid && !topicError

  const handleSuccess = useCallback(() => {
    const params = new URLSearchParams({ exam: selectedExam, paper: selectedPaper, subject: selectedSubject })
    navigate(`/admin/upload?${params.toString()}`, { state: { bulkUploadSuccess: true } })
  }, [navigate, selectedExam, selectedPaper, selectedSubject])

  const showErrorState =
    !contextValid ||
    (!topicLoading && (!!topicError || !liveTopic || !segmentValid))

  return (
    <PageContainer>
      <AdminText as="h1" variant="cinzel" className="sr-only">Bulk Parser</AdminText>
      <Stack gap="lg">
        <div className="flex items-center justify-between mb-4">
          <Button variant="soft" onClick={backToTopics}>
            <ArrowLeft size={16} /> Back to Topics
          </Button>
          <Badge variant="primary" icon={Sparkles}>AI Powered</Badge>
        </div>

        {showErrorState ? (
          <ErrorContainer category="unknown" variant="page">
            <H2>{!liveTopic && !topicError ? 'Topic Not Found' : 'Something went wrong'}</H2>
            <Body>
              {
                !contextValid
                  ? 'Select an exam, paper and subject on the Upload page first.'
                  : topicError
                    ? topicError
                    : !liveTopic
                      ? 'This topic does not exist.'
                      : 'This topic does not belong to the selected exam, paper and subject.'
              }
            </Body>
            {topicError ? <RetryButton onRetry={refetchTopic} /> : null}
            {!contextValid ? (
              <Button variant="secondary" onClick={backToTopics} className="px-8">
                Back to Topics
              </Button>
            ) : null}
          </ErrorContainer>
        ) : liveTopic ? (
          <>
            <Card variant="default" padding={24}>
              <Stack direction="row" justify="between" align="center" gap="lg" className="max-md:flex-col max-md:items-stretch">
                <Stack gap="xs">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <AdminText as="h2" variant="cinzel" className="text-lg font-bold uppercase tracking-tight">
                      {topicLoading ? (
                        <Skeleton variant="management" type="text" lines={1} width={280} height={24} borderRadius={8} />
                      ) : (
                        liveTopic.topic_en
                      )}
                    </AdminText>
                  </div>
                  <Body secondary className="text-xs">
                    {topicLoading ? (
                      <Skeleton variant="management" type="text" lines={1} width={200} height={16} borderRadius={8} />
                    ) : (
                      liveTopic.topic_te ?? '\u2014'
                    )}
                  </Body>
                </Stack>
              </Stack>
            </Card>

            {workflowReady ? (
              <>
                <SegmentedFilter
                  ariaLabel="Bulk upload steps"
                  size="sm"
                  options={BULK_WORKFLOW_TABS}
                  value={activeTab}
                  onChange={(id) => setActiveTab(id as BulkTabType)}
                />

                {/* Concise instruction surface — INSTRUCTIONS segment only.
                 *  No headings, no decorative chrome; the prompt container
                 *  below remains the single elevated surface. */}
                {activeTab === 'instructions' && (
                  <Card variant="default" padding={16}>
                    <Body secondary className="text-xs m-0">
                      Copy the prompt below and paste it into your preferred AI tool
                      to generate questions in the required JSON format. Paste the AI
                      output in Upload Questions to validate and sync it to this topic.
                    </Body>
                  </Card>
                )}

                <BulkUploadPanel
                  examId={selectedExam}
                  paperId={selectedPaper}
                  subjectName={selectedSubject}
                  topicId={liveTopic.id}
                  onSuccess={handleSuccess}
                  onClose={backToTopics}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  parsedData={parsedData}
                  setParsedData={setParsedData}
                />

                {/* Minimal action row — GENERATE segment only. The workflow's
                 *  forward navigation stays explicit; no decorative wrapper. */}
                {activeTab === 'generate' && (
                  <div className="flex justify-end">
                    <Button onClick={() => setActiveTab('json')}>
                      Continue to Upload
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card variant="default" padding={24}>
                <div role="status" aria-label="Preparing bulk parser" className="min-h-[400px] flex flex-col gap-6">
                  <Skeleton variant="management" type="text" lines={1} width={320} height={16} borderRadius={8} />
                  <GridSkeleton count={3} columns="grid-cols-1 sm:grid-cols-2" gap="gap-3" decorative />
                </div>
              </Card>
            )}
          </>
        ) : null}
      </Stack>
    </PageContainer>
  )
}

import { useState } from 'react'
import { ThemeProvider } from '../context/ThemeContext'
import { AuthProvider } from '../context/AuthContext'
import { PageContainer, Stack, SectionReveal } from '../components/common/AntigravityUI'
import { MethodSelectionView } from '../components/admin/upload/MethodSelectionView'
import { UploadContextPanel } from '../components/admin/upload/UploadContextPanel'
import { SubjectTopicsGrid } from '../components/admin/upload/SubjectTopicsGrid'
import type { ManualEntryTopic } from '../components/admin/upload/useAdminUpload'
import { SingleQuestionModal } from '../components/admin/questions/modals/SingleQuestionModal'

/* ── DEV-ONLY verification harness — /dev/upload-alignment ────────────────────
 * Mounted to verify the rebuilt /admin/upload surfaces against a fresh dev
 * build — no auth required. Registered in App.tsx behind import.meta.env.DEV
 * (dead-code-eliminated from production).
 *
 * Query switches:
 *   ?context=1      ready-context card, valid selection (live-count slot fed 49)
 *   ?context=2      ready-context card, invalid selection state
 *   ?context=3      ready-context card, count loading (skeleton)
 *   ?topics=1       topic workspace grid with fixture topics
 *   ?topics=2       topic grid loading skeleton
 *   ?topics=3       topic grid error state (retry wired to a real handler)
 *   ?topics=4       topic grid empty state
 *   ?modal=1        manual-entry modal open on a blank draft (add mode)
 *   ?modal=2        modal with Telugu data pre-filled + EN view
 * Fixtures are adversarial: long subject names, long context labels.
 * ────────────────────────────────────────────────────────────────────────── */

const LONG_SUBJECT = 'History and Culture of Ancient South India Under the Kakatiya and Vijayanagara Dynasties'

const FIXTURE_TOPICS: ManualEntryTopic[] = [
  { id: 'fixture-1', name_en: 'Delhi Sultanate, Vijayanagara & Mughal India — A Very Long Composite Topic Name', name_te: 'ఢిల్లీ సుల్తానేట్, విజయనగర సామ్రాజ్యం మరియు మొఘల్ భారతదేశం' },
  { id: 'fixture-2', name_en: 'European Companies & British Expansion in India', name_te: 'యూరోపియన్ వాణిజ్య సంస్థలు మరియు భారతదేశంలో బ్రిటిష్ విస్తరణ' },
  { id: 'fixture-3', name_en: 'Ancient India', name_te: null },
  { id: null, name_en: 'Later Vedic Period (derived)', name_te: null },
]

const FIXTURE_TOPIC_COUNTS: Record<string, number> = {
  'Delhi Sultanate, Vijayanagara & Mughal India — A Very Long Composite Topic Name': 22,
  'European Companies & British Expansion in India': 0,
  'Ancient India': 7,
  'Later Vedic Period (derived)': 3,
}

function Harness() {
  const [params] = useState(() => new URLSearchParams(window.location.search))
  const mode = params.get('context') ? 'context' : params.get('topics') ? 'topics' : params.get('modal') ? 'modal' : 'methods'
  const contextVariant = params.get('context') ?? ''
  const topicsVariant = params.get('topics') ?? ''
  const modalVariant = params.get('modal') ?? ''
  // Exercises the real retry path shape (state flip) — never a silent no-op.
  const [retryTick, setRetryTick] = useState(0)

  const [selected, setSelected] = useState<'single' | 'bulk' | null>(null)
  const [modalOpen, setModalOpen] = useState(mode === 'modal')

  if (mode === 'methods') {
    return (
      <PageContainer>
        <Stack gap="lg">
          <div aria-live="polite" aria-label="Upload content">
            {selected === null ? (
              <MethodSelectionView onSelect={setSelected} />
            ) : (
              <UploadContextPanel
                uploadType={selected}
                isContextValid={true}
                questionCount={49}
                countLoading={false}
                labels={{ exam: 'APPSC Group 1', paper: 'Paper 1 — General Studies' }}
                selectedExam="APPSC_GROUP_1"
                selectedPaper="926c7d30-add2-4d03-a040-f011e9282562"
                selectedSubject="History and Culture"
                onBack={() => setSelected(null)}
                onExamChange={() => {}}
                onPaperChange={() => {}}
                onSubjectChange={() => {}}
                onContextUpdate={() => {}}
              />
            )}
          </div>
        </Stack>
      </PageContainer>
    )
  }

  if (mode === 'context') {
    const valid = contextVariant !== '2'
    const loading = contextVariant === '3'
    return (
      <PageContainer>
        <Stack gap="lg">
          <div aria-live="polite" aria-label="Upload content">
            <UploadContextPanel
              uploadType="single"
              isContextValid={valid}
              questionCount={valid ? (loading ? undefined : 49) : undefined}
              countLoading={loading}
              labels={{ exam: 'APPSC Group 1 Combined Level Examination', paper: 'Paper 1 — General Studies & Mental Ability' }}
              selectedExam={valid ? 'APPSC_GROUP_1' : 'all'}
              selectedPaper={valid ? '926c7d30-add2-4d03-a040-f011e9282562' : 'all'}
              selectedSubject={valid ? LONG_SUBJECT : 'all'}
              onBack={() => {}}
              onExamChange={() => {}}
              onPaperChange={() => {}}
              onSubjectChange={() => {}}
              onContextUpdate={() => {}}
            />
          </div>
        </Stack>
      </PageContainer>
    )
  }

  if (mode === 'topics') {
    const countsLoading = topicsVariant === '5'
    const countsError = topicsVariant === '6' ? `Failed to load topic counts. (attempt ${retryTick})` : null
    return (
      <PageContainer>
        <SectionReveal>
          <SubjectTopicsGrid
            topics={topicsVariant === '4' ? [] : FIXTURE_TOPICS}
            loading={topicsVariant === '2'}
            error={topicsVariant === '3' ? `Failed to load topics. (attempt ${retryTick})` : null}
            onRetry={() => setRetryTick(t => t + 1)}
            actionLabel="Upload Manually"
            onTopicAction={() => setModalOpen(true)}
            topicCounts={FIXTURE_TOPIC_COUNTS}
            countsLoading={countsLoading}
            countsError={countsError}
            onRetryCounts={() => setRetryTick(t => t + 1)}
          />
        </SectionReveal>
        <SingleQuestionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          mode="add"
          examId="APPSC_GROUP_1"
          examLabel="APPSC Group 1"
          paperId="926c7d30-add2-4d03-a040-f011e9282562"
          paperLabel="Paper 1 — General Studies"
          subjectName="History and Culture"
          topicId={FIXTURE_TOPICS[0].id}
          topicEnglish={FIXTURE_TOPICS[0].name_en}
          topicTelugu={FIXTURE_TOPICS[0].name_te}
          question={null}
          onSuccess={() => {}}
        />
      </PageContainer>
    )
  }

  /* modal mode */
  const teDraft = modalVariant === '2'
  return (
    <PageContainer>
      <SingleQuestionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={teDraft ? 'edit' : 'add'}
        examId="APPSC_GROUP_1"
        examLabel="APPSC Group 1"
        paperId="926c7d30-add2-4d03-a040-f011e9282562"
        paperLabel="Paper 1 — General Studies"
        subjectName="History and Culture"
        question={teDraft ? {
          id: 'verify-q-1',
          exam_id: 'APPSC_GROUP_1',
          paper_id: '926c7d30-add2-4d03-a040-f011e9282562',
          subject_name: 'History and Culture',
          question_text_en: 'Which of the following statements about the Kakatiya dynasty is correct?',
          option_a_en: 'Rudramadevi was the first female ruler of the dynasty',
          option_b_en: 'The capital was at Vijayawada',
          option_c_en: 'Ganapatideva built the Ramappa Temple',
          option_d_en: 'They ruled from Madurai',
          explanation_en: 'Rudramadevi ruled from 1262–1289.',
          question_text_te: 'కాకతీయ రాజవంశం గురించి ఈ క్రింది వాటిలో సరైనది ఏది?',
          option_a_te: 'రుద్రమదేవి మొదటి మహిళా పాలకురాలు',
          option_b_te: 'రాజధాని విజయవాడ',
          option_c_te: 'గణపతిదేవుడు రామప్ప ఆలయాన్ని నిర్మించారు',
          option_d_te: 'వారు మదురై నుండి పరిపాలించారు',
          difficulty: 'medium',
          correct_option: 'A',
        } : null}
        onSuccess={() => {}}
      />
    </PageContainer>
  )
}

export default function UploadAlignmentHarness() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Harness />
      </AuthProvider>
    </ThemeProvider>
  )
}

import { ThemeProvider } from '../context/ThemeContext'
import { H1, H2, PageContainer } from '../components/common/AntigravityUI'
import { QuestionsTable } from '../components/admin/questions/QuestionsTable'
import type { Question } from '../types/exam.types'

/* ═══ DEV-ONLY verification harness — /dev/aq-alignment ═══════════════════════
 * Mounted by scripts/verify-questions-alignment.mjs to measure the REAL
 * QuestionsTable geometry (header ↔ row alignment, difficulty track fit,
 * skeleton parity) against a fresh development build — no auth required.
 * The route is registered in App.tsx behind `import.meta.env.DEV`, so this
 * module is dead-code-eliminated from production builds.
 * Supports ?skeleton=1 to force the loading state for parity checks. */

const FIXTURES: Question[] = [
  {
    id: 'aq-verify-easy',
    exam_id: 'verify-exam',
    paper_id: 'verify-paper',
    subject_name: 'Physics',
    correct_option: 'A',
    difficulty: 'easy',
    negative_marks: 0,
    question_text_en: 'Short easy question used for header alignment measurement.'
  },
  {
    id: 'aq-verify-medium',
    exam_id: 'verify-exam',
    paper_id: 'verify-paper',
    subject_name: 'Physics',
    correct_option: 'B',
    difficulty: 'medium',
    negative_marks: 0,
    question_text_en: 'Medium row carrying the widest uppercase MEDIUM pill label in the difficulty track.'
  },
  {
    id: 'aq-verify-hard',
    exam_id: 'verify-exam',
    paper_id: 'verify-paper',
    subject_name: 'Chemistry',
    correct_option: 'C',
    difficulty: 'hard',
    negative_marks: 0,
    question_text_en: 'Hard question with a longer statement so the title column wraps across two lines at narrow viewports.'
  }
]

export default function AqAlignmentHarness() {
  const forceSkeleton = new URLSearchParams(window.location.search).has('skeleton')
  return (
    <ThemeProvider>
      <PageContainer>
        <H1 className="sr-only">Manage Questions</H1>
        <H2 className="sr-only">Question Bank</H2>
        <QuestionsTable
          questions={forceSkeleton ? [] : FIXTURES}
          isLoading={forceSkeleton}
          page={0}
          setPage={() => {}}
          hasMore={false}
          totalCount={FIXTURES.length}
          pageSize={30}
          selectedIds={[]}
          onSelect={() => {}}
          onSelectAll={() => {}}
          onEdit={() => {}}
          onView={() => {}}
          onDelete={() => {}}
        />
      </PageContainer>
    </ThemeProvider>
  )
}

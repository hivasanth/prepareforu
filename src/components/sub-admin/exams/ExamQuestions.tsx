import { useMemo, useState } from 'react'
import { SectionHeader } from '../../../components/common/AntigravityUI'
import { BilingualToggle } from '../../../components/common/BilingualToggle'
import { EmptyState } from '../../../components/common/SharedComponents'
import { QuestionCard } from '../../exam/QuestionCard'
import { HelpCircle } from 'lucide-react'
import type { Question } from '../../../types/exam.types'
import type { ExamDetailQuestion } from './types'

type Lang = 'en' | 'te'

interface ExamQuestionsProps {
  questions: ExamDetailQuestion[]
}

function toQuestion(q: ExamDetailQuestion): Question {
  return {
    id: q.id,
    exam_id: '',
    paper_id: '',
    subject_name: '',
    correct_option: (q.correct_option as Question['correct_option']) ?? undefined,
    difficulty: q.difficulty ?? 'medium',
    negative_marks: 0,
    question_text_en: q.question_text_en,
    question_text_te: q.question_text_te ?? null,
    option_a_en: q.option_a_en ?? null,
    option_a_te: q.option_a_te ?? null,
    option_b_en: q.option_b_en ?? null,
    option_b_te: q.option_b_te ?? null,
    option_c_en: q.option_c_en ?? null,
    option_c_te: q.option_c_te ?? null,
    option_d_en: q.option_d_en ?? null,
    option_d_te: q.option_d_te ?? null,
    explanation_en: q.explanation_en ?? null,
    explanation_te: q.explanation_te ?? null,
  }
}

export function ExamQuestions({ questions }: ExamQuestionsProps) {
  const [lang, setLang] = useState<Lang>('en')

  const ordered = useMemo(() => [...questions].sort((a, b) => a.display_order - b.display_order), [questions])

  if (ordered.length === 0) {
    return <EmptyState icon={<HelpCircle size={48} />} title="No Questions" subtitle="No questions found in this exam vault." />
  }

  return (
    <section aria-label="Exam questions">
      <SectionHeader
        title={`Questions (${ordered.length})`}
        icon={HelpCircle}
        action={<BilingualToggle displayLang={lang} onChange={setLang} shortLabels />}
      />
      <div className="space-y-6 mt-3" role="list" aria-label="Exam questions">
        {ordered.map((q, i) => (
          <div key={q.id} role="listitem">
            <QuestionCard
              question={toQuestion(q)}
              index={i}
              total={ordered.length}
              displayLang={lang}
              onToggleLang={() => {}}
              selectedAnswer={null}
              onSelectOption={() => {}}
              readOnly
              showCorrect
              correctOption={q.correct_option}
              optionsDisabled
              explanation={lang === 'te' ? (q.explanation_te ?? q.explanation_en) : q.explanation_en}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

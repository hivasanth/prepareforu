import { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronUp, ChevronDown } from 'lucide-react'
import { Card, Button, SectionHeader } from '../../../components/common/AntigravityUI'
import { AdminIconWrap } from '../../../components/common/AdminIconWrap'
import { StatChip } from './ExamSubComponents'
import { useExamResponsive } from './useExamResponsive'
import { formatNumber } from '../../../utils/timeUtils'
import type { QuestionStat } from './types'

interface ExamQuestionAnalysisProps {
  questionStats: QuestionStat[]
}

export const ExamQuestionAnalysis = memo(function ExamQuestionAnalysis({ questionStats }: ExamQuestionAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const {
    layout: { qGridCols },
    typography: { qFont, qStat },
  } = useExamResponsive()

  if (questionStats.length === 0) return null

  return (
    <section aria-label="Question-wise analysis">
      <SectionHeader
        title={`Question Analysis (${questionStats.length} Questions)`}
        icon={BookOpen}
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-1.5"
            aria-expanded={isExpanded}
            aria-controls="question-analysis-grid"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest">{isExpanded ? 'Collapse' : 'Enlarge'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        }
      />
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id="question-analysis-grid"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
            role="region"
            aria-label="Question analysis details"
          >
            <div className="grid gap-3 mt-3 pb-2" style={{ gridTemplateColumns: qGridCols }}>
              {questionStats.map((qs, i) => (
                <Card
                  key={qs.question_id}
                  variant="default"
                  className="p-4 space-y-3 border-border-subtle/20"
                >
                  <div className="flex items-start gap-2">
                    <AdminIconWrap size="sm" rounded="lg" className="w-6 h-6 mt-0.5">
                      {qs.display_order}
                    </AdminIconWrap>
                    <p className="font-bold text-text-primary leading-snug line-clamp-2" style={{ fontSize: qFont }}>
                      {qs.question_text_en}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-green-500 font-bold uppercase tracking-widest" style={{ fontSize: qStat }}>
                        Correct
                      </span>
                      <span className="font-black text-green-500" style={{ fontSize: qStat }}>
                        {formatNumber(qs.correctPct, 0)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-border-subtle/15 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${qs.correctPct}%` }}
                        transition={{ duration: 0.5, delay: i * 0.02 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-red-400 font-bold uppercase tracking-widest" style={{ fontSize: qStat }}>
                        Wrong
                      </span>
                      <span className="font-black text-red-400" style={{ fontSize: qStat }}>
                        {formatNumber(qs.incorrectPct, 0)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-border-subtle/15 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${qs.incorrectPct}%` }}
                        transition={{ duration: 0.5, delay: i * 0.02 + 0.05 }}
                        className="h-full bg-red-400/70 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-border-subtle/10">
                    <StatChip label="Attempts" value={qs.total} color="text-text-secondary" font={qStat} />
                    <StatChip label="Skipped" value={qs.skipped} color="text-amber-400" font={qStat} />
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="text-[var(--text-muted)] font-medium" style={{ fontSize: qStat }}>Most picked:</span>
                      <span className="font-black text-primary" style={{ fontSize: qStat }}>{qs.mostSelected}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
})

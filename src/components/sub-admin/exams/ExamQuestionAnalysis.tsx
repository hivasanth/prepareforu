import { memo } from 'react'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { Card, SectionHeader } from '../../../components/common/AntigravityUI'
import { MOTION_DURATION, MOTION_EASE } from '../../../components/common/AntigravityMotion'
import { AdminIconWrap } from '../../../components/common/AdminIconWrap'
import { StatChip } from './ExamSubComponents'
import { useExamResponsive } from './useExamResponsive'
import { formatNumber } from '../../../utils/timeUtils'
import type { QuestionStat } from './types'

interface ExamQuestionAnalysisProps {
  questionStats: QuestionStat[]
}

export const ExamQuestionAnalysis = memo(function ExamQuestionAnalysis({ questionStats }: ExamQuestionAnalysisProps) {
  const {
    layout: { qGridCols },
    typography: { qFont, qStat },
  } = useExamResponsive()

  if (questionStats.length === 0) return null

  return (
    <section aria-label="Question-wise analysis">
      <SectionHeader title={`Question Analysis (${questionStats.length} Questions)`} icon={BookOpen} />
      {/* Leaderboard-style wrapper container hosting the analysis grid */}
      <Card variant="elevated" className="animate-in mt-3 overflow-hidden">
        {/* Bounded horizontal scroll (same x-auto flow as the section nav track) */}
        <div className="overflow-x-auto custom-scrollbar">
          <div className="grid gap-3 p-4" style={{ gridTemplateColumns: qGridCols }}>
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
                      transition={{ duration: MOTION_DURATION.verySlow, ease: MOTION_EASE.standard, delay: i * 0.02 }}
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
                      transition={{ duration: MOTION_DURATION.verySlow, ease: MOTION_EASE.standard, delay: i * 0.02 + 0.05 }}
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
        </div>
      </Card>
    </section>
  )
})

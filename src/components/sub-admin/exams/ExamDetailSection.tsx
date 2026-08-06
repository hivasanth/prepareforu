import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle, RefreshCcw, Download, Copy, Check,
  ChevronLeft, FileText,
} from 'lucide-react'
import { Button, IconButton, Spinner } from '../../../components/common/AntigravityUI'
import { LoadingSkeleton, EmptyState } from '../../../components/common/SharedComponents'
import { formatNumber, formatDurationShort } from '../../../utils/timeUtils'
import { downloadCSV, sanitizeFilename } from '../../../utils/csvUtils'
import { copyToClipboard } from './ExamSubComponents'
import { useExamResponsive } from './useExamResponsive'
import { ExamSummaryCards } from './ExamSummaryCards'
import { ExamScoreDistribution } from './ExamScoreDistribution'
import { ExamQuestionAnalysis } from './ExamQuestionAnalysis'
import { ExamPerformers } from './ExamPerformers'
import { ExamStudentTable } from './ExamStudentTable'
import type { TeacherExamOption, EvalData } from './types'

interface ExamDetailSectionProps {
  selectedExam: TeacherExamOption
  evalData: EvalData | null
  dataLoading: boolean
  dataError: string | null
  summaryStats: { total: number; avg: number; hi: number; lo: number; avgTime: number } | null
  scoreDistribution: { label: string; count: number; pct: number }[]
  topPerformers: EvalData['attempts']
  bottomPerformers: EvalData['attempts']
  onBack: () => void
  onRetry: () => void
}

export function ExamDetailSection({
  selectedExam, evalData, dataLoading, dataError,
  summaryStats, scoreDistribution, topPerformers, bottomPerformers,
  onBack, onRetry,
}: ExamDetailSectionProps) {
  const {
    layout: { summaryGridCols, cardH, btnH },
    typography: { titleFont },
    charts: { barH },
  } = useExamResponsive()
  const [copied, setCopied] = useState(false)

  const copyText = () => {
    if (!summaryStats) return
    const text = [
      `Exam: ${selectedExam.title}`,
      `Total Students: ${summaryStats.total}`,
      `Average Score: ${formatNumber(summaryStats.avg)} / ${selectedExam.total_marks}`,
      `Highest Score: ${summaryStats.hi} / ${selectedExam.total_marks}`,
      `Lowest Score: ${summaryStats.lo} / ${selectedExam.total_marks}`,
      `Average Time: ${formatDurationShort(Math.round(summaryStats.avgTime))}`,
    ].join('\n')
    copyToClipboard(text, () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const downloadCSVFile = () => {
    if (!evalData?.attempts.length) return
    downloadCSV({
      filename: `${sanitizeFilename(selectedExam.title)}_results.csv`,
      headers: ['Rank', 'Name', 'Email', 'Score', 'Total', 'Accuracy%', 'Correct', 'Wrong', 'Skipped', 'Time'],
      rows: evalData.attempts.map((a, i) => [
        i + 1,
        a.users?.full_name ?? 'Unknown',
        a.users?.email ?? '—',
        a.score,
        a.total_marks,
        formatNumber(Number(a.accuracy)),
        a.correct_count,
        a.wrong_count,
        a.skipped_count,
        formatDurationShort(a.duration_seconds),
      ]),
    })
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <IconButton variant="ghost" size="sm" onClick={onBack} aria-label="Go back to exam list">
            <ChevronLeft size={20} />
          </IconButton>
          <div>
            <h2 className="font-black text-text-primary" style={{ fontSize: titleFont }}>{selectedExam.title}</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              {selectedExam.total_questions} Qs · {selectedExam.total_marks} Marks
            </span>
          </div>
        </div>
        {evalData && !dataLoading && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={copyText}
              disabled={!summaryStats}
              style={{ height: btnH }}
              aria-label={copied ? 'Summary copied to clipboard' : 'Copy exam summary to clipboard'}
            >
              {copied ? <><Check size={13} className="text-green-500" /> Copied</> : <><Copy size={13} /> Copy Summary</>}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={downloadCSVFile}
              disabled={!evalData.attempts.length}
              style={{ height: btnH }}
              aria-label="Export exam results as CSV"
            >
              <Download size={13} /> Export CSV
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {dataLoading && (
        <div className="space-y-5" role="status" aria-label="Loading exam data">
          <div className="grid gap-3" style={{ gridTemplateColumns: summaryGridCols }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card-bg border border-border-subtle/20 rounded-2xl p-4 space-y-3" style={{ height: cardH }}>
                <LoadingSkeleton height={12} width="60%" borderRadius={6} />
                <LoadingSkeleton height={22} width="45%" borderRadius={6} />
              </div>
            ))}
          </div>
          <LoadingSkeleton height={barH} borderRadius={16} />
          <div className="flex items-center justify-center gap-3 py-8">
            <Spinner size="sm" className="text-primary border-primary/20 border-t-primary" />
            <span className="text-text-secondary font-bold text-sm">Loading evaluation data…</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {dataError && !dataLoading && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center gap-4 text-center" role="alert">
          <AlertCircle size={28} className="text-red-500" />
          <div>
            <p className="font-black text-red-500 text-sm">{dataError}</p>
          </div>
          <Button variant="primary" size="sm" onClick={onRetry} aria-label="Retry loading exam data">
            <RefreshCcw size={13} /> Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!dataLoading && !dataError && evalData && evalData.attempts.length === 0 && (
        <EmptyState
          icon={<FileText size={48} />}
          title="No Submissions Yet"
          subtitle="Students haven't submitted this exam yet. Check back after the exam window closes."
        />
      )}

      {/* Main Content */}
      <AnimatePresence>
        {!dataLoading && !dataError && evalData && evalData.attempts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <ExamSummaryCards
              summaryStats={summaryStats}
              totalMarks={selectedExam.total_marks}
            />
            <ExamScoreDistribution scoreDistribution={scoreDistribution} />
            <ExamQuestionAnalysis questionStats={evalData.questionStats} />
            <ExamPerformers
              topPerformers={topPerformers}
              bottomPerformers={bottomPerformers}
              totalMarks={selectedExam.total_marks ?? 0}
            />
            <ExamStudentTable
              attempts={evalData.attempts}
              examTitle={selectedExam.title}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

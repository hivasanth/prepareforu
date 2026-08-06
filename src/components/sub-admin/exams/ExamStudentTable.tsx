import { useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ChevronUp, ChevronDown, Copy, Check } from 'lucide-react'
import { Button, SectionHeader } from '../../../components/common/AntigravityUI'
import { RankBadge, AccuracyBadge, Dot, copyToClipboard } from './ExamSubComponents'
import { useExamResponsive } from './useExamResponsive'
import { formatNumber, formatDurationShort } from '../../../utils/timeUtils'
import type { AttemptRow } from './types'

interface ExamStudentTableProps {
  attempts: AttemptRow[]
  examTitle: string
}

export const ExamStudentTable = memo(function ExamStudentTable({ attempts, examTitle }: ExamStudentTableProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const {
    isMobile,
    layout: { rowH },
    typography: { tblFont },
  } = useExamResponsive()

  const copyLeaderboard = () => {
    if (!attempts.length) return
    const text = attempts.map((a, i) =>
      `${i + 1}. ${a.users?.full_name ?? 'Unknown'} - ${a.score}/${a.total_marks} (${formatNumber(Number(a.accuracy))}%)`
    ).join('\n')
    copyToClipboard(`Leaderboard: ${examTitle}\n\n${text}`, () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section aria-label="Student results">
      <SectionHeader
        title={`All Students (${attempts.length})`}
        icon={Users}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={copied ? 'success' : 'ghost'}
              size="sm"
              onClick={copyLeaderboard}
              className="gap-1.5"
              aria-label={copied ? 'Copied leaderboard to clipboard' : 'Copy leaderboard to clipboard'}
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              <span className="text-[10px] font-bold uppercase tracking-widest">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-1.5"
              aria-expanded={isExpanded}
              aria-controls="student-table"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">{isExpanded ? 'Collapse' : 'Enlarge'}</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </div>
        }
      />
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id="student-table"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
            role="region"
            aria-label="Student results table"
          >
            <div className="mt-3 bg-card-bg border border-border-subtle/20 rounded-2xl overflow-hidden">
              {isMobile ? (
                <div className="divide-y divide-border-subtle/10">
                  {attempts.map((a, i) => (
                    <div key={a.id} className="p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RankBadge rank={i + 1} />
                          <span className="font-bold text-text-primary truncate max-w-[140px]" style={{ fontSize: tblFont }}>
                            {a.users?.full_name ?? 'Unknown'}
                          </span>
                        </div>
                        <span className="font-black text-primary" style={{ fontSize: tblFont }}>
                          {a.score} / {a.total_marks}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-text-secondary" style={{ fontSize: tblFont }}>
                        <span>Acc: {formatNumber(Number(a.accuracy))}%</span>
                        <Dot />
                        <span>{formatDurationShort(a.duration_seconds)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full" role="table">
                    <thead>
                      <tr className="border-b border-border-subtle/20">
                        {['Rank', 'Student', 'Score', 'Accuracy', 'Correct', 'Wrong', 'Skipped', 'Time'].map(col => (
                          <th
                            key={col}
                            scope="col"
                            className="text-left px-4 py-3 text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px]"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/10">
                      {attempts.map((a, i) => (
                        <tr
                          key={a.id}
                          className="hover:bg-hover-bg/40 transition-colors"
                          style={{ height: rowH }}
                        >
                          <td className="px-4">
                            <RankBadge rank={i + 1} />
                          </td>
                          <td className="px-4">
                            <div>
                              <p className="font-bold text-text-primary truncate max-w-[160px]" style={{ fontSize: tblFont }}>
                                {a.users?.full_name ?? 'Unknown'}
                              </p>
                              <p className="text-[var(--text-muted)] truncate max-w-[160px] text-[10px]">
                                {a.users?.email ?? '—'}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 font-black text-primary" style={{ fontSize: tblFont }}>
                            {a.score} / {a.total_marks}
                          </td>
                          <td className="px-4" style={{ fontSize: tblFont }}>
                            <AccuracyBadge acc={Number(a.accuracy)} />
                          </td>
                          <td className="px-4 font-bold text-green-500" style={{ fontSize: tblFont }}>{a.correct_count}</td>
                          <td className="px-4 font-bold text-red-400" style={{ fontSize: tblFont }}>{a.wrong_count}</td>
                          <td className="px-4 font-bold text-amber-400" style={{ fontSize: tblFont }}>{a.skipped_count}</td>
                          <td className="px-4 font-bold text-text-secondary" style={{ fontSize: tblFont }}>
                            {formatDurationShort(a.duration_seconds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
})

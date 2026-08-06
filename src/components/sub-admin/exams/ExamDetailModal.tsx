import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { HelpCircle, Trophy, Copy, Check, User, FileText } from 'lucide-react'
import { IconBadge, Button, Tabs } from '../../common/AntigravityUI'
import { AdminModal } from '../../common/AdminModal'
import { EmptyState, StatSkeleton } from '../../common/SharedComponents'
import { ErrorContainer } from '../../common/ErrorContainer'
import { RetryButton } from '../../common/RetryButton'
import { useExamResponsive } from './useExamResponsive'
import { formatDurationShort } from '../../../utils/timeUtils'
import { useExamDetail } from './useExamDetail'
import type { ExamDetailQuestion, ExamDetailLeaderboardEntry } from './types'

// ─── Public API ─────────────────────────────────────────────────────────────

interface ExamDetailModalProps {
  exam: { id: string; title: string; created_at: string }
  onClose: () => void
}

// ─── Helpers ────────────────────────────────────────────────────────────────

type TabId = 'questions' | 'leaderboard'

function rankBadgeClass(idx: number): string {
  if (idx === 0) return 'bg-warning/20 text-warning'
  if (idx === 1) return 'bg-text-secondary/20 text-white'
  if (idx === 2) return 'bg-secondary/20 text-secondary'
  return 'bg-primary/10 text-primary'
}

function accuracyBadgeClass(accuracy: number): string {
  if (accuracy >= 80) return 'bg-success/5 border-success/20 text-success'
  if (accuracy >= 50) return 'bg-warning/5 border-warning/20 text-warning'
  return 'bg-danger/5 border-danger/20 text-danger'
}

function optionText(q: ExamDetailQuestion, opt: string): string {
  const key = `option_${opt.toLowerCase()}_en` as keyof ExamDetailQuestion
  return ((q[key] as string | null) ?? '').trim()
}

// ─── Sub-Renderers ──────────────────────────────────────────────────────────

function QuestionList({ questions }: { questions: ExamDetailQuestion[] }) {
  const { typography } = useExamResponsive()

  if (questions.length === 0) {
    return <EmptyState icon={<HelpCircle size={48} />} title="No Questions" subtitle="No questions found in this exam vault." />
  }

  return (
    <div className="space-y-4" role="list" aria-label="Exam questions">
      {questions.map((q, i) => (
        <div
          key={q.id}
          role="listitem"
          className="bg-hover-bg/20 border border-border-subtle/50 rounded-2xl p-4 md:p-5 space-y-4"
        >
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0" aria-hidden="true">
              {i + 1}
            </div>
            <div className="space-y-4 flex-1">
              <p className="font-bold text-text-primary leading-relaxed" style={{ fontSize: typography.qFont }}>
                {q.question_text_en?.trim() || 'Untitled Question'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2" role="group" aria-label={`Options for question ${i + 1}`}>
                {['A', 'B', 'C', 'D'].map(opt => {
                  const isCorrect = q.correct_option === opt
                  const text = optionText(q, opt)
                  return (
                    <div
                      key={opt}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isCorrect
                          ? 'bg-success/5 border-success/30 text-success'
                          : 'bg-card-bg/50 border-border-subtle/30 text-text-secondary opacity-60'
                      }`}
                      aria-label={`Option ${opt}${isCorrect ? ' (correct)' : ''}`}
                    >
                      <span className="font-bold text-xs w-5 h-5 rounded-md bg-current/5 flex items-center justify-center" aria-hidden="true">{opt}</span>
                      <span className="text-xs font-bold leading-tight">{text}</span>
                    </div>
                  )
                })}
              </div>

              {q.explanation_en && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Explanation</span>
                  <p className="text-xs text-text-secondary font-medium leading-relaxed italic">
                    &ldquo;{q.explanation_en.trim()}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LeaderboardTable({ entries }: { entries: ExamDetailLeaderboardEntry[] }) {
  const { breakpoint } = useExamResponsive()

  if (entries.length === 0) {
    return <EmptyState icon={<Trophy size={48} />} title="No Attempts" subtitle="No students have attempted this exam yet." />
  }

  if (breakpoint === 'xs') {
    return (
      <div className="space-y-3" role="list" aria-label="Leaderboard rankings">
        {entries.map((entry, idx) => (
          <div
            key={entry.id}
            role="listitem"
            className="bg-hover-bg/20 border border-border-subtle/50 rounded-2xl p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${rankBadgeClass(idx)}`} aria-hidden="true">
                #{idx + 1}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-text-primary uppercase tracking-tight truncate max-w-[120px]">
                  {entry.users?.full_name || 'Anonymous'}
                </span>
                <span className="text-[9px] text-[var(--text-muted)] font-medium uppercase">
                  {formatDurationShort(entry.duration_seconds)} &bull; Accuracy: {entry.accuracy}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-primary">
                {entry.score}<span className="opacity-40 text-[10px]">/{entry.total_marks}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden border border-border-subtle/50 rounded-2xl bg-card-bg/20">
      <table className="w-full border-collapse" role="table" aria-label="Leaderboard rankings">
        <thead>
          <tr className="bg-hover-bg/30 border-b border-border-subtle/40">
            <th scope="col" className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] w-16">Rank</th>
            <th scope="col" className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Candidate</th>
            <th scope="col" className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Score</th>
            <th scope="col" className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Time</th>
            <th scope="col" className="px-5 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Accuracy</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle/30">
          {entries.map((entry, idx) => (
            <tr key={entry.id} className="hover:bg-hover-bg/20 transition-colors">
              <td className="px-5 py-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${rankBadgeClass(idx)}`} aria-label={`Rank ${idx + 1}`}>
                  #{idx + 1}
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <IconBadge
                    icon={User}
                    size="md"
                    shape="circle"
                    className="bg-card-bg border border-border-subtle/50 text-text-secondary"
                    darkClassName="rounded-full bg-card-bg border border-border-subtle/50 text-text-secondary"
                  />
                  <span className="text-sm font-bold text-text-primary uppercase tracking-tight">
                    {entry.users?.full_name || 'Anonymous Student'}
                  </span>
                </div>
              </td>
              <td className="px-5 py-4 text-center">
                <span className="text-sm font-black text-primary">
                  {entry.score}<span className="opacity-40 text-[10px]">/{entry.total_marks}</span>
                </span>
              </td>
              <td className="px-5 py-4 text-center text-xs font-bold text-text-secondary">
                {formatDurationShort(entry.duration_seconds)}
              </td>
              <td className="px-5 py-4 text-center">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${accuracyBadgeClass(entry.accuracy)}`}>
                  {entry.accuracy}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ExamDetailModal({ exam, onClose }: ExamDetailModalProps) {
  const { data, loading, error, refetch } = useExamDetail(exam.id)
  const { breakpoint } = useExamResponsive()
  const [activeTab, setActiveTab] = useState<TabId>('questions')
  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = useCallback(() => {
    if (data.leaderboard.length === 0) return
    const text = data.leaderboard
      .map((entry, i) => `${i + 1}. ${entry.users?.full_name || 'Student'} - ${entry.score}/${entry.total_marks} - ${formatDurationShort(entry.duration_seconds)}`)
      .join('\n')
    navigator.clipboard.writeText(`Exam: ${exam.title}\n\n${text}`)
    setCopied(true)
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }, [data.leaderboard, exam.title])

  const handleTabChange = useCallback((id: string | number) => {
    setActiveTab(id as TabId)
  }, [])

  const tabSwitcher = (
    <Tabs
      ariaLabel="Exam details"
      options={[
        { id: 'questions', label: 'Questions' },
        { id: 'leaderboard', label: 'Leaderboard' },
      ]}
      activeId={activeTab}
      onChange={handleTabChange}
    />
  )

  const headerActions = activeTab === 'leaderboard' && data.leaderboard.length > 0 ? (
    <Button
      variant={copied ? 'success' : 'secondary'}
      size="sm"
      onClick={handleCopy}
      className="whitespace-nowrap"
      aria-label={copied ? 'Copied to clipboard' : 'Copy leaderboard to clipboard'}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  ) : null

  return (
    <AdminModal
      isOpen={true}
      onClose={onClose}
      title={exam.title}
      description={`ID: ${exam.id.slice(0, 8)} \u2022 ${new Date(exam.created_at).toLocaleDateString()}`}
      headerBadge={<IconBadge icon={FileText} size="lg" className="bg-primary/10 text-primary" />}
      headerActions={headerActions}
      subHeader={tabSwitcher}
      maxWidth={breakpoint === 'xs' ? 'sm:max-w-full' : 'sm:max-w-5xl'}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 opacity-30">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-primary">Live Security Sync Active</span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-hint)]">PREPAREFORU &bull; v3.0</span>
        </div>
      }
    >
      {loading ? (
        <div role="status" aria-label="Loading exam details" className="space-y-4 py-4">
          <StatSkeleton count={2} />
          <div className="space-y-3 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-hover-bg/30 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorContainer category="server" severity="high" variant="inline">
          <h3 className="text-lg font-black text-text-primary">Load Failed</h3>
          <p className="text-sm text-text-secondary font-medium">{error}</p>
          <RetryButton onRetry={refetch} label="Retry" />
        </ErrorContainer>
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'questions' ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          role="tabpanel"
          aria-label={activeTab === 'questions' ? 'Questions tab' : 'Leaderboard tab'}
        >
          {activeTab === 'questions' ? (
            <QuestionList questions={data.questions} />
          ) : (
            <LeaderboardTable entries={data.leaderboard} />
          )}
        </motion.div>
      )}
    </AdminModal>
  )
}

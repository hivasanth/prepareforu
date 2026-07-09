import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { downloadCSV as downloadCSVFile } from '../../utils/csvUtils'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigate } from 'react-router-dom'
import { GuardLoader } from '../../guards/Guards'
import { isSubAdmin } from '../../utils/authUtils'
import {
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  Award,
  Target,
  AlertCircle,
  RefreshCcw,
  Download,
  Copy,
  Check,
  BookOpen,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  FileText,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchSubAdminIdByUserId,
  fetchTeacherExamsWithFullFields,
  fetchTeacherExamQuestions,
  fetchAttemptsWithUsersByTeacherExam,
  fetchAttemptAnswersByAttemptIds,
} from '../../services/teacherExamService'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useToast } from '../../hooks/useToast'
import { formatNumber, formatDurationShort } from '../../utils/timeUtils'
import { computeSummaryStats, computeScoreDistribution } from '../../utils/scoreUtils'
import { 
  PageContainer,
  Stack, 
  IconButton, 
  SectionReveal, 
  Grid, 
  Card, 
  Badge, 
  Label,
  Button,
} from '../../components/common/AntigravityUI'
import { AdminFilterBar } from '../../components/admin/common/AdminFilterBar'
import { AdminIconWrap } from '../../components/admin/common/AdminIconWrap'
import { AdminText } from '../../components/admin/common/AdminText'

// ─── Types ───────────────────────────────────────────────────────────────────
interface TeacherExamOption {
  id: string
  title: string
  total_questions: number
  total_marks: number
  marks_per_question: number
  start_time: string
  end_time: string
  created_at: string
  status: string
}

interface AttemptRow {
  id: string
  user_id: string
  score: number
  total_marks: number
  correct_count: number
  wrong_count: number
  skipped_count: number
  accuracy: number
  duration_seconds: number | null
  submitted_at: string | null
  status: string
  users: { full_name: string; email: string } | null
}

interface AnswerRow {
  question_id: string
  selected_option: string | null
  is_correct: boolean | null
  attempt_id: string
}

interface QuestionRow {
  id: string
  question_text_en: string
  correct_option: string
  display_order: number
}

interface QuestionStat {
  question_id: string
  question_text_en: string
  display_order: number
  total: number
  correct: number
  incorrect: number
  skipped: number
  correctPct: number
  incorrectPct: number
  mostSelected: string
  optionCounts: Record<string, number>
}

interface EvalData {
  attempts: AttemptRow[]
  questionStats: QuestionStat[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────


// ─── Component ───────────────────────────────────────────────────────────────
export default function SubAdminExams() {
  const { user, loading: authLoading } = useAuth()
  const { breakpoint } = useBreakpoint()
  const { showSuccess, showError } = useToast()

  // ── Exam list
  const [exams, setExams] = useState<TeacherExamOption[]>([])
  const [examsLoading, setExamsLoading] = useState(true)
  const [examsError, setExamsError] = useState<string | null>(null)

  // ── Selected exam & eval data
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [selectedExam, setSelectedExam] = useState<TeacherExamOption | null>(null)
  const [evalData, setEvalData] = useState<EvalData | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  // ── Refs for lifecycle/race safety
  const mountedRef = useRef(true)
  const currentExamRef = useRef<string | null>(null)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  // ── UI state
  const [copied, setCopied] = useState(false)
  const [leaderboardCopied, setLeaderboardCopied] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [monthFilter, setMonthFilter] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 7);
  })
  const [isQuestionsExpanded, setIsQuestionsExpanded] = useState(false)
  const [isLeaderboardExpanded, setIsLeaderboardExpanded] = useState(false)

  // ── Typography scale
  const px = (map: Record<string, number>) => `${map[breakpoint] ?? map.xs}px`

  const title   = px({ xs: 16, sm: 18, md: 20, lg: 22, xl: 22 })
  const sub     = px({ xs: 12, sm: 13, md: 14, lg: 15, xl: 15 })
  const cardLbl = px({ xs: 11, sm: 12, md: 13, lg: 14, xl: 14 })
  const cardVal = px({ xs: 14, sm: 16, md: 18, lg: 20, xl: 20 })
  const barFont = px({ xs: 11, sm: 13, md: 14, lg: 15, xl: 15 })
  const qFont   = px({ xs: 12, sm: 14, md: 15, lg: 16, xl: 16 })
  const qStat   = px({ xs: 11, sm: 13, md: 14, lg: 15, xl: 15 })
  const perfFont= px({ xs: 11, sm: 13, md: 14, lg: 15, xl: 15 })
  const tblFont = px({ xs: 11, sm: 13, md: 14, lg: 15, xl: 15 })

  const cardH       = { xs: 80, sm: 90, md: 100, lg: 110, xl: 110 }[breakpoint] ?? 80
  const cardPad     = { xs: 12, sm: 14, md: 16, lg: 18, xl: 18 }[breakpoint] ?? 12
  const barH        = { xs: 120, sm: 140, md: 160, lg: 180, xl: 180 }[breakpoint] ?? 120
  const rowH        = { xs: undefined, sm: 40, md: 44, lg: 48, xl: 48 }[breakpoint]
  const btnH        = { xs: 36, sm: 38, md: 40, lg: 42, xl: 42 }[breakpoint] ?? 36

  const isMobile = breakpoint === 'xs'
  const isTablet = breakpoint === 'sm'

  // ── Summary cards grid columns
  const summaryGridCols = ['xs', 'sm'].includes(breakpoint) ? 'repeat(1,1fr)' : 'repeat(5,1fr)'

  // ── Question grid columns
  const qGridCols = isMobile ? 'repeat(1,1fr)' : isTablet || breakpoint === 'md' ? 'repeat(2,1fr)' : 'repeat(3,1fr)'

  // ── 1. Load sub-admin's exams
  const fetchExams = useCallback(async () => {
    if (!user?.id) return
    setExamsLoading(true)
    setExamsError(null)
    try {
      const profile = await fetchSubAdminIdByUserId({ user }, user.id)

      if (!profile) throw new Error('Could not identify your Sub-Admin profile.')

      const data = await fetchTeacherExamsWithFullFields({ user }, profile.id)
      setExams(data ?? [])
    } catch (err: any) {
      setExamsError(err.message ?? 'Failed to load exams.')
    } finally {
      setExamsLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchExams() }, [fetchExams])

  // ── Month options (Last 3 months)
  const monthOptions = useMemo(() => Array.from({ length: 3 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return { 
      id: d.toISOString().slice(0, 7), 
      name: d.toLocaleString('default', { month: 'long', year: 'numeric' }) 
    }
  }), [])

  // ── Filter Exams
  const filteredExams = useMemo(() => exams.filter(exam => {
    const term = searchTerm.trim().toUpperCase()
    const matchesSearch = (exam.title || '').toUpperCase().includes(term)
    
    // If searching, show all related exams across all months
    if (term) return matchesSearch
    
    // Default view: filter by the selected month
    const matchesMonth = exam.created_at && exam.created_at.startsWith(monthFilter)
    return matchesMonth
  }), [exams, searchTerm, monthFilter])

  // ── 2. Load evaluation data when exam is selected
  const fetchEvalData = useCallback(async (examId: string) => {
    currentExamRef.current = examId
    setDataLoading(true)
    setDataError(null)
    setEvalData(null)
    try {
      // Fetch completed attempts with user info
      const attempts = await fetchAttemptsWithUsersByTeacherExam({ user }, examId)
      const questions = await fetchTeacherExamQuestions({ user }, examId)

      const attemptList: AttemptRow[] = (attempts ?? []) as unknown as AttemptRow[]
      const questionList: QuestionRow[] = (questions ?? []) as QuestionRow[]

      // Fetch all answers for these attempts
      let questionStats: QuestionStat[] = []

      if (attemptList.length > 0 && questionList.length > 0) {
        const attemptIds = attemptList.map(a => a.id)

        const answers = await fetchAttemptAnswersByAttemptIds({ user }, attemptIds)
        const answerList: AnswerRow[] = (answers ?? []) as AnswerRow[]

        // Build question stats
        questionStats = questionList.map(q => {
          const qAnswers = answerList.filter(a => a.question_id === q.id)
          const total = qAnswers.length
          const correct = qAnswers.filter(a => a.is_correct === true).length
          const incorrect = qAnswers.filter(a => a.is_correct === false && a.selected_option !== null).length
          const skipped = total - correct - incorrect

          // Count each option selection
          const optionCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 }
          for (const ans of qAnswers) {
            const opt = ans.selected_option?.toUpperCase()
            if (opt && optionCounts[opt] !== undefined) optionCounts[opt]++
          }

          const mostSelected = total > 0
            ? Object.entries(optionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
            : '—'

          return {
            question_id: q.id,
            question_text_en: q.question_text_en?.trim() || '',
            display_order: q.display_order,
            total,
            correct,
            incorrect,
            skipped,
            correctPct: total > 0 ? (correct / total) * 100 : 0,
            incorrectPct: total > 0 ? (incorrect / total) * 100 : 0,
            mostSelected,
            optionCounts,
          }
        })
      }

      if (currentExamRef.current !== examId || !mountedRef.current) return
      setEvalData({ attempts: attemptList, questionStats })
    } catch (err: any) {
      if (currentExamRef.current !== examId || !mountedRef.current) return
      setDataError(err.message ?? 'Failed to load evaluation data.')
    } finally {
      if (currentExamRef.current === examId && mountedRef.current) {
        setDataLoading(false)
      }
    }
  }, [])

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId)
    const exam = exams.find(e => e.id === examId) ?? null
    setSelectedExam(exam)
    if (examId) fetchEvalData(examId)
    else { setEvalData(null) }
  }

  const summaryStats = useMemo(() => {
    if (!evalData?.attempts.length) return null
    return computeSummaryStats(evalData.attempts.map(a => ({ ...a, duration_seconds: a.duration_seconds ?? undefined })))
  }, [evalData?.attempts])

  const scoreDistribution = useMemo(() => {
    if (!evalData?.attempts.length || !selectedExam) return []
    return computeScoreDistribution(evalData.attempts, Number(selectedExam.total_marks))
  }, [evalData?.attempts, selectedExam])

  // ── Top / Bottom 5
  const topPerformers    = evalData?.attempts.slice(0, 5) ?? []
  const bottomPerformers = [...(evalData?.attempts ?? [])].reverse().slice(0, 5)

  if (authLoading) return <GuardLoader />
  if (!isSubAdmin(user)) return <Navigate to="/unauthorized" replace />

  // ── Export helpers
  const copyToClipboard = async (text: string, onSuccess: () => void) => {
    try {
      await navigator.clipboard.writeText(text)
      onSuccess()
    } catch {
      showError('Could not copy automatically. Select and copy manually.')
    }
  }

  const copyLeaderboard = () => {
    if (!evalData?.attempts.length) return
    const text = evalData.attempts.map((a, i) => 
      `${i + 1}. ${a.users?.full_name ?? 'Unknown'} - ${a.score}/${a.total_marks} (${formatNumber(Number(a.accuracy))}%)`
    ).join('\n')
    copyToClipboard(`Leaderboard: ${selectedExam?.title}\n\n${text}`, () => {
      setLeaderboardCopied(true)
      showSuccess('Leaderboard copied!')
      setTimeout(() => setLeaderboardCopied(false), 2000)
    })
  }

  const copyText = () => {
    if (!selectedExam || !summaryStats) return
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
      showSuccess('Summary copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const downloadCSV = () => {
    if (!evalData?.attempts.length || !selectedExam) return
    const header = ['Rank', 'Name', 'Email', 'Score', 'Total', 'Accuracy%', 'Correct', 'Wrong', 'Skipped', 'Time']
    const rows = evalData.attempts.map((a, i) => [
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
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    downloadCSVFile(csv, `${selectedExam.title.replace(/\s+/g, '_')}_results.csv`)
    showSuccess('CSV downloaded!')
  }

  // ─── SKELETON ────────────────────────────────────────────────────────────
  const Skeleton = ({ h = 20, w = '100%', rounded = 'rounded-xl' }: { h?: number; w?: string | number; rounded?: string }) => (
    <div className={`bg-border-subtle/20 animate-pulse ${rounded}`} style={{ height: h, width: w }} />
  )

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <PageContainer>
      <Stack gap="lg" className="overflow-x-hidden">

      {/* ── DETAIL VIEW HEADER ── */}
      {selectedExam && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setSelectedExamId(''); setSelectedExam(null); setEvalData(null); }}
              className="p-2 hover:bg-hover-bg rounded-xl transition-colors text-text-secondary hover:text-text-primary"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="font-black text-text-primary" style={{ fontSize: title }}>{selectedExam.title}</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-50">
                {selectedExam.total_questions} Qs · {selectedExam.total_marks} Marks
              </span>
            </div>
          </div>
          
          {evalData && !dataLoading && (
            <div className="flex items-center gap-2">
              <button
                onClick={copyText}
                disabled={!summaryStats}
                style={{ height: btnH }}
                className="flex items-center gap-2 px-4 border rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-40 bg-card-bg border-border-subtle/30 text-text-primary hover:border-primary/30"
              >
                {copied ? <><Check size={13} className="text-green-500" /> Copied</> : <><Copy size={13} /> Copy Summary</>}
              </button>
              <button
                onClick={downloadCSV}
                disabled={!evalData.attempts.length}
                style={{ height: btnH }}
                className="flex items-center gap-2 px-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all disabled:opacity-40 bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── LIST VIEW (Cards) ── */}
      {!selectedExamId && (
        <Stack gap="lg">
          <SectionReveal>
            <AdminFilterBar
              searchPlaceholder="Search exams..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              monthValue={monthFilter}
              onMonthChange={setMonthFilter}
              monthOptions={monthOptions}
              onRefresh={fetchExams}
              loading={examsLoading}
            />
          </SectionReveal>

          {examsLoading ? (
            <Grid cols={3} gap={24}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-48 rounded-[24px] bg-card-bg border border-border-subtle/20 animate-pulse" />
              ))}
            </Grid>
          ) : examsError ? (
            <Card variant="subtle" className="py-16 text-center flex flex-col items-center gap-4">
              <AlertCircle size={48} className="text-danger opacity-40" />
              <div className="space-y-1">
                <h3 className="text-lg font-black text-text-primary">PROTOCOL FAILURE</h3>
                <p className="text-sm text-text-secondary font-medium">{examsError}</p>
              </div>
              <Button variant="primary" onClick={fetchExams}>Re-sync Vault</Button>
            </Card>
          ) : filteredExams.length === 0 ? (
            <Card variant="subtle" className="py-24 text-center flex flex-col items-center gap-4 opacity-40">
              <BookOpen size={64} />
              <div className="space-y-1">
                <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter">Vault is Empty</h3>
                <p className="text-sm text-text-secondary font-medium">No results matching your filters were identified.</p>
              </div>
            </Card>
          ) : (
            <Grid cols={3} gap={24}>
              {filteredExams.map((exam, idx) => (
                <SectionReveal key={exam.id} delay={idx * 0.05}>
                  <Card 
                    variant="default" 
                    className="p-6 flex flex-col h-full group relative cursor-pointer transition-all duration-300 ancient-3d-lift hover:border-primary/30" 
                    onClick={() => handleExamChange(exam.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant={exam.status === 'published' ? 'success' : 'warning'}>
                        {exam.status || 'Draft'}
                      </Badge>
                      <IconButton size="sm" onClick={(e) => { e.stopPropagation(); handleExamChange(exam.id); }}>
                        <BarChart3 size={14} />
                      </IconButton>
                    </div>

                    <div className="space-y-2 mb-6">
                      <AdminText as="h3" variant="cinzel" className="font-black text-text-primary text-lg leading-tight uppercase group-hover:text-primary transition-colors truncate">
                        {exam.title}
                      </AdminText>
                      <div className="flex items-center gap-2 text-text-secondary font-bold text-[11px] opacity-40 uppercase tracking-widest">
                        <Clock size={12} />
                        {new Date(exam.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-border-subtle/30 flex items-center justify-between">
                      <Stack gap="xs">
                        <Label>Questions</Label>
                        <span className="text-sm font-black text-text-primary">{exam.total_questions}</span>
                      </Stack>
                      <div className="w-px h-8 bg-border-subtle/30" />
                      <Stack gap="xs" align="end">
                        <Label>Total Marks</Label>
                        <span className="text-sm font-black text-text-primary">
                          {exam.total_marks}
                        </span>
                      </Stack>
                    </div>

                    <div className="absolute -bottom-6 -right-6 opacity-[0.03] text-text-primary group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                      <BookOpen size={120} strokeWidth={1} />
                    </div>
                  </Card>
                </SectionReveal>
              ))}
            </Grid>
          )}
        </Stack>
      )}

      {/* ── LOADING STATE (Detail View) ── */}
      {selectedExamId && dataLoading && (
        <div className="space-y-5">
          {/* Summary skeletons */}
          <div className="grid gap-3" style={{ gridTemplateColumns: summaryGridCols }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card-bg border border-border-subtle/20 rounded-2xl p-4 space-y-3" style={{ height: cardH }}>
                <Skeleton h={12} w="60%" />
                <Skeleton h={22} w="45%" />
              </div>
            ))}
          </div>
          <Skeleton h={barH} rounded="rounded-2xl" />
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 size={20} className="text-primary animate-spin" />
            <span className="text-text-secondary font-bold text-sm">Loading evaluation data…</span>
          </div>
        </div>
      )}

      {/* ── ERROR STATE (Detail View) ── */}
      {selectedExamId && dataError && !dataLoading && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
          <AlertCircle size={28} className="text-red-500" />
          <div>
            <p className="font-black text-red-500 text-sm">{dataError}</p>
          </div>
          <button
            onClick={() => fetchEvalData(selectedExamId)}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-500/15 transition-all"
          >
            <RefreshCcw size={13} /> Retry
          </button>
        </div>
      )}

      {/* ── EMPTY STATE (Detail View) ── */}
      {selectedExamId && !dataLoading && !dataError && evalData && evalData.attempts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-border-subtle/10 border border-border-subtle/20 flex items-center justify-center">
            <FileText size={28} className="text-text-secondary opacity-30" />
          </div>
          <p className="font-black text-text-primary" style={{ fontSize: title }}>No Submissions Yet</p>
          <p className="text-text-secondary font-medium" style={{ fontSize: sub }}>
            Students haven't submitted this exam yet. Check back after the exam window closes.
          </p>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <AnimatePresence>
        {selectedExamId && !dataLoading && !dataError && evalData && evalData.attempts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >

            {/* ── SUMMARY CARDS ── */}
            <section>
              <SectionLabel icon={<Target size={14} />} text="Overview" />
              <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: summaryGridCols }}>
                {(() => {
                  const ss = summaryStats
                  const se = selectedExam
                  const tm = se?.total_marks ?? 0
                  const cards = [
                    { icon: <Users size={16} />,       label: 'Total Students',  value: ss?.total.toString() ?? '0',                              color: 'text-primary' },
                    { icon: <BarChart3 size={16} />,   label: 'Average Score',   value: `${formatNumber(ss?.avg ?? 0)} / ${tm}`,                             color: 'text-blue-400' },
                    { icon: <TrendingUp size={16} />,  label: 'Highest Score',   value: `${ss?.hi ?? 0} / ${tm}`,                                  color: 'text-green-500' },
                    { icon: <TrendingDown size={16} />,label: 'Lowest Score',    value: `${ss?.lo ?? 0} / ${tm}`,                                  color: 'text-red-400' },
                    { icon: <Clock size={16} />,       label: 'Avg Time Taken',  value: formatDurationShort(Math.round(ss?.avgTime ?? 0)),                     color: 'text-amber-400' },
                  ]
                  return cards.map((card, i) => (
                   <Card
                    key={i}
                    variant="default"
                    className="flex flex-col justify-between border-border-subtle/20"
                    style={{ minHeight: cardH, padding: cardPad }}
                  >
                    <div className={`flex items-center gap-1.5 ${card.color} opacity-70`}>
                      {card.icon}
                      <span className="font-black uppercase tracking-widest truncate" style={{ fontSize: cardLbl }}>
                        {card.label}
                      </span>
                    </div>
                    <span className="font-black text-text-primary leading-none" style={{ fontSize: cardVal }}>
                      {card.value}
                    </span>
                  </Card>
                  ))
                })()}
              </div>
            </section>

            {/* ── SCORE DISTRIBUTION ── */}
            <section>
              <SectionLabel icon={<BarChart3 size={14} />} text="Score Distribution" />
              <div
                className="bg-card-bg border border-border-subtle/20 rounded-2xl p-4 mt-3"
                style={{ height: barH + 56 }}
              >
                <div className="flex items-end justify-between gap-2 h-full pb-6">
                  {scoreDistribution.map((band, i) => {
                    const barMaxPct = Math.max(...scoreDistribution.map(b => b.pct)) || 1
                    const heightPct = (band.pct / barMaxPct) * 100
                    const colors = [
                      'bg-red-400/70',
                      'bg-amber-400/70',
                      'bg-yellow-400/70',
                      'bg-blue-400/70',
                      'bg-green-500/70',
                    ]
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className="font-black text-text-primary" style={{ fontSize: barFont }}>
                          {band.count}
                        </span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(heightPct, band.count > 0 ? 4 : 0)}%` }}
                          transition={{ duration: 0.5, delay: i * 0.08 }}
                          className={`w-full rounded-t-xl ${colors[i]} min-h-[4px]`}
                          style={{ maxHeight: `${barH - 40}px` }}
                        />
                        <span
                          className="text-text-secondary font-bold text-center leading-tight"
                          style={{ fontSize: barFont, marginTop: 4 }}
                        >
                          {band.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* ── QUESTION-WISE ANALYSIS ── */}
            {evalData.questionStats.length > 0 && (
              <section>
                <div className="flex items-center justify-between">
                  <SectionLabel icon={<BookOpen size={14} />} text={`Question Analysis (${evalData.questionStats.length} Questions)`} />
                  <button 
                    onClick={() => setIsQuestionsExpanded(!isQuestionsExpanded)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hover-bg/80 border border-border-subtle/30 text-text-secondary hover:text-text-primary hover:bg-hover-bg hover:border-primary/30 transition-all"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">{isQuestionsExpanded ? 'Collapse' : 'Enlarge'}</span>
                    {isQuestionsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {isQuestionsExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-3 mt-3 pb-2" style={{ gridTemplateColumns: qGridCols }}>
                  {evalData.questionStats.map((qs, i) => (
                    <Card
                      key={qs.question_id}
                      variant="default"
                      className="p-4 space-y-3 border-border-subtle/20"
                    >
                      {/* Question header */}
                      <div className="flex items-start gap-2">
                        <AdminIconWrap size="sm" rounded="lg" className="w-6 h-6 mt-0.5">
                          {qs.display_order}
                        </AdminIconWrap>
                        <p className="font-bold text-text-primary leading-snug line-clamp-2" style={{ fontSize: qFont }}>
                          {qs.question_text_en}
                        </p>
                      </div>

                      {/* Correct % bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-green-500 font-black uppercase tracking-widest" style={{ fontSize: qStat }}>
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
                          <span className="text-red-400 font-black uppercase tracking-widest" style={{ fontSize: qStat }}>
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

                      {/* Stats row */}
                      <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-border-subtle/10">
                        <StatChip label="Attempts" value={qs.total} color="text-text-secondary" font={qStat} />
                        <StatChip label="Skipped" value={qs.skipped} color="text-amber-400" font={qStat} />
                        <div className="ml-auto flex items-center gap-1.5">
                          <span className="text-text-secondary opacity-50 font-bold" style={{ fontSize: qStat }}>Most picked:</span>
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
            )}

            {/* ── TOP & BOTTOM PERFORMERS ── */}
            <section>
              <SectionLabel icon={<Award size={14} />} text="Top & Bottom Performers" />
              <div className={`mt-3 ${isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}`}>
                {/* Top 5 */}
                <PerformerList
                  title="Top 5"
                  icon={<ChevronUp size={15} className="text-green-500" />}
                  accent="text-green-500"
                  border="border-green-500/15"
                  bg="bg-green-500/5"
                  performers={topPerformers}
                  totalMarks={selectedExam?.total_marks ?? 0}
                  font={perfFont}
                />
                {/* Bottom 5 */}
                <PerformerList
                  title="Bottom 5"
                  icon={<ChevronDown size={15} className="text-red-400" />}
                  accent="text-red-400"
                  border="border-red-400/15"
                  bg="bg-red-400/5"
                  performers={bottomPerformers}
                  totalMarks={selectedExam?.total_marks ?? 0}
                  font={perfFont}
                />
              </div>
            </section>

            {/* ── STUDENT TABLE ── */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <SectionLabel icon={<Users size={14} />} text={`All Students (${evalData.attempts.length})`} />
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyLeaderboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hover-bg/80 border border-border-subtle/30 text-text-secondary hover:text-text-primary hover:bg-hover-bg hover:border-primary/30 transition-all"
                  >
                    {leaderboardCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{leaderboardCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button 
                    onClick={() => setIsLeaderboardExpanded(!isLeaderboardExpanded)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hover-bg/80 border border-border-subtle/30 text-text-secondary hover:text-text-primary hover:bg-hover-bg hover:border-primary/30 transition-all"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">{isLeaderboardExpanded ? 'Collapse' : 'Enlarge'}</span>
                    {isLeaderboardExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>
              <AnimatePresence initial={false}>
                {isLeaderboardExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 bg-card-bg border border-border-subtle/20 rounded-2xl overflow-hidden">
                {isMobile ? (
                  /* Mobile: Card list */
                  <div className="divide-y divide-border-subtle/10">
                    {evalData.attempts.map((a, i) => (
                      <div key={a.id} className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <RankBadge rank={i + 1} />
                            <span className="font-black text-text-primary truncate max-w-[140px]" style={{ fontSize: tblFont }}>
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
                  /* Tablet+: Full table */
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border-subtle/20">
                          {['Rank', 'Student', 'Score', 'Accuracy', 'Correct', 'Wrong', 'Skipped', 'Time'].map(col => (
                            <th
                              key={col}
                              className="text-left px-4 py-3 text-text-secondary font-black uppercase tracking-widest opacity-50 text-[10px]"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle/10">
                        {evalData.attempts.map((a, i) => (
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
                                <p className="text-text-secondary opacity-50 truncate max-w-[160px] text-[10px]">
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

          </motion.div>
        )}
      </AnimatePresence>
    </Stack>
    </PageContainer>
  )
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-primary opacity-70">{icon}</div>
      <span className="text-[11px] font-black uppercase tracking-widest text-text-secondary opacity-60">{text}</span>
    </div>
  )
}

function StatChip({ label, value, color, font }: { label: string; value: number; color: string; font: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="opacity-50 font-bold text-text-secondary" style={{ fontSize: font }}>{label}:</span>
      <span className={`font-black ${color}`} style={{ fontSize: font }}>{value}</span>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const colors =
    rank === 1 ? 'bg-amber-400/20 text-amber-400' :
    rank === 2 ? 'bg-slate-400/20 text-slate-400' :
    rank === 3 ? 'bg-orange-400/20 text-orange-400' :
    'bg-border-subtle/15 text-text-secondary'
  return (
    <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${colors}`}>
      {rank}
    </div>
  )
}

function AccuracyBadge({ acc }: { acc: number }) {
  const color = acc >= 70 ? 'text-green-500' : acc >= 40 ? 'text-amber-400' : 'text-red-400'
  return <span className={`font-bold ${color}`}>{isNaN(acc) ? '—' : `${acc.toFixed(1)}%`}</span>
}

function Dot() {
  return <span className="text-border-subtle opacity-40">·</span>
}

function PerformerList({
  title, icon, accent, border, bg, performers, totalMarks, font
}: {
  title: string
  icon: React.ReactNode
  accent: string
  border: string
  bg: string
  performers: AttemptRow[]
  totalMarks: number
  font: string
}) {
  return (
    <div className={`${bg} border ${border} rounded-2xl overflow-hidden`}>
      <div className={`px-4 py-3 border-b ${border} flex items-center gap-2`}>
        {icon}
        <span className={`font-black uppercase tracking-widest text-[11px] ${accent}`}>{title}</span>
      </div>
      <div className="divide-y divide-border-subtle/10">
        {performers.length === 0 ? (
          <div className="px-4 py-5 text-center text-text-secondary font-medium" style={{ fontSize: font }}>
            No data
          </div>
        ) : performers.map((p, i) => (
          <div key={p.id} className="px-4 py-3 flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-card-bg border border-border-subtle/20 flex items-center justify-center font-black text-[10px] text-text-secondary shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text-primary truncate" style={{ fontSize: font }}>
                {p.users?.full_name ?? 'Unknown'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-black ${accent}`} style={{ fontSize: font }}>
                {p.score} / {totalMarks}
              </p>
              <p className="text-text-secondary opacity-50 text-[10px]">
                {Number(p.accuracy).toFixed(1)}% acc
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

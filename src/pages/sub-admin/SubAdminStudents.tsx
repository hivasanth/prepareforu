import { useState, useEffect, useMemo, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { 
  Users, 
  Calendar, 
  RefreshCcw, 
  Copy, 
  Download, 
  TrendingUp, 
  BookOpen, 
  Award,
  Eye
} from 'lucide-react'
import { isSubAdmin } from '../../utils/authUtils'
import { fetchSubAdminStudents, fetchSubAdminProfile, fetchAttemptsForSubAdminStudents } from '../../services/userService'
import { generateRequestId } from '../../utils/logger'
import { GuardLoader } from '../../guards/Guards'
import { useAuth } from '../../context/AuthContext'
import { downloadCSV } from '../../utils/csvUtils'

interface AttemptWithExam {
  id: string;
  user_id: string;
  score: number;
  duration_seconds: number;
  submitted_at: string;
  teacher_exams: { title: string; total_questions: number };
}
import { useToast } from '../../hooks/useToast'
import { 
  PageContainer, 
  Stack, 
  IconButton,
  SectionReveal, 
  Card, 
  Badge, 
  Label,
  Button,
  StatCard,
  DataGrid,
  Body
} from '../../components/common/AntigravityUI'
import { AdminFilterBar } from '../../components/admin/common/AdminFilterBar'
import { AdminIconWrap } from '../../components/admin/common/AdminIconWrap'
import { AdminText } from '../../components/admin/common/AdminText'
import { AdminModal } from '../../components/admin/common/AdminModal'

// ─── Types ──────────────────────────────────────────────────────────────────
interface StudentAttempt {
  id: string
  exam_name: string
  score: number
  total_questions: number
  time_taken: number
  submitted_at: string
}

interface Student {
  id: string
  full_name: string
  email: string
  coupon_code: string | null
  created_at: string
  attempts: StudentAttempt[]
  stats: {
    totalExams: number
    avgScore: number
    bestScore: number
    lastActive: string | null
  }
}

export default function SubAdminStudents() {
  const { user, loading: authLoading } = useAuth()
  const { showSuccess } = useToast()

  const mountedRef = useRef(true)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  // State
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // ── Data Fetching
  const fetchData = async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)

    try {
      const requestId = generateRequestId('fetch_students')
      const usersData = await fetchSubAdminStudents({ user, requestId }, user.id)
      
      if (!usersData || usersData.length === 0) {
        if (mountedRef.current) setStudents([])
        return
      }

      const profile = await fetchSubAdminProfile({ user, requestId }, user.id)
      const saId = profile.id

      const studentIds = usersData.map(u => u.id)
      const attemptsData = await fetchAttemptsForSubAdminStudents({ user, requestId }, studentIds, saId)

      const processed: Student[] = usersData.map(u => {
        const attempts = (attemptsData || []) as AttemptWithExam[]
        const studentAttempts: StudentAttempt[] = attempts
          .filter(a => a.user_id === u.id)
          .map(a => ({
            id: a.id,
            exam_name: a.teacher_exams?.title ?? 'Unknown',
            score: a.score || 0,
            total_questions: a.teacher_exams?.total_questions || 0,
            time_taken: a.duration_seconds || 0,
            submitted_at: a.submitted_at
          }))

        const totalExams = studentAttempts.length
        const avgScore = totalExams > 0 
          ? Math.round(studentAttempts.reduce((acc, curr) => acc + curr.score, 0) / totalExams) 
          : 0
        const bestScore = totalExams > 0 
          ? Math.max(...studentAttempts.map(a => a.score)) 
          : 0
        const lastActive = totalExams > 0 
          ? [...studentAttempts].sort((a,b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0].submitted_at 
          : null

        return {
          ...u,
          attempts: studentAttempts,
          stats: {
            totalExams,
            avgScore,
            bestScore,
            lastActive
          }
        }
      })

      if (!mountedRef.current) return
      setStudents(processed)
    } catch (err: any) {
      if (!mountedRef.current) return
      setError(err.message || 'Unable to sync with your student registry.')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id])

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = 
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesMonth = monthFilter === 'all' || s.created_at.startsWith(monthFilter)
      return matchesSearch && matchesMonth
    }).map((s, idx) => ({ ...s, _idx: idx }))
  }, [students, searchTerm, monthFilter])

  const monthOptions = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return {
      id: d.toISOString().slice(0, 7),
      name: d.toLocaleString('default', { month: 'long', year: 'numeric' })
    }
  })

  const handleCopyClick = async (s: Student) => {
    const text = `Name: ${s.full_name}\nExams: ${s.stats.totalExams}\nAverage Score: ${s.stats.avgScore}%`
    try {
      await navigator.clipboard.writeText(text)
      showSuccess('Student data copied to clipboard!')
    } catch {
      showError('Could not copy automatically. Select and copy manually.')
    }
  }

  const handleDownloadCSV = (s: Student) => {
    const headers = ['Exam Name', 'Score', 'Time Taken (s)', 'Date']
    const rows = s.attempts.map(a => [
      a.exam_name,
      a.score,
      a.time_taken,
      new Date(a.submitted_at).toLocaleDateString()
    ])
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    downloadCSV(csvContent, `${s.full_name.replace(/\s+/g, '_')}_performance.csv`)
    showSuccess('Performance report generated!')
  }

  if (authLoading) return <GuardLoader />
  if (!isSubAdmin(user)) return <Navigate to="/unauthorized" replace />

  return (
    <PageContainer>

      <Stack gap="lg">
        <SectionReveal>
          <AdminFilterBar
            searchPlaceholder="Search name or email..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            monthValue={monthFilter}
            onMonthChange={setMonthFilter}
            monthOptions={monthOptions}
            monthPlaceholder="All Time"
            onRefresh={fetchData}
            loading={loading}
          />
        </SectionReveal>

        {loading ? (
          <div className="bg-card-bg border border-border-subtle/20 rounded-3xl p-8">
            <Stack gap="md">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-16 rounded-xl bg-hover-bg/40 animate-pulse" />
              ))}
            </Stack>
          </div>
        ) : error ? (
          <Card variant="subtle" className="py-16 text-center flex flex-col items-center gap-4">
            <IconButton className="!w-16 !h-16 !rounded-3xl !bg-danger/10 !text-danger">
              <RefreshCcw size={32} />
            </IconButton>
            <div className="text-center max-w-xs">
              <p className="text-text-primary font-black uppercase tracking-widest text-[10px] mb-2">Sync Synchronization Error</p>
              <p className="text-text-secondary text-sm font-medium">{error}</p>
            </div>
            <Button variant="primary" onClick={fetchData}>Force Protocol Reset</Button>
          </Card>
        ) : filteredStudents.length === 0 ? (
          <Card variant="subtle" className="py-20 opacity-40 text-center flex flex-col items-center gap-4">
            <Users size={64} className="text-text-secondary" />
            <p className="font-black uppercase tracking-widest text-xs">No students detected in this corridor</p>
          </Card>
        ) : (
          <SectionReveal>
            <Card variant="default" className="p-0 overflow-hidden border-border-subtle/20">
              <DataGrid 
                rowKey="id"
                rows={filteredStudents}
                columns={[
                  {
                    key: '_idx',
                    label: 'SR.',
                    headerClassName: 'w-12 text-center',
                    cellClassName: 'text-center',
                    render: (val: number) => (
                      <span className="text-[10px] font-black text-text-secondary opacity-40">
                        {val + 1}
                      </span>
                    )
                  },
                  {
                    key: 'full_name',
                    label: 'Student',
                    render: (_: any, s: Student) => (
                      <div className="flex items-center gap-3">
                        <AdminIconWrap size="sm" rounded="full">
                          <Users size={14} />
                        </AdminIconWrap>
                        <div className="min-w-0">
                          <AdminText as="p" variant="cinzel" className="font-bold text-text-primary truncate text-[13px]">{s.full_name}</AdminText>
                          <p className="text-[10px] text-text-secondary opacity-50 truncate">{s.email}</p>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'totalExams',
                    label: 'Exams',
                    align: 'center',
                    render: (_: any, s: Student) => (
                      <Badge variant="default" className="!h-6 !px-2">
                        {s.stats.totalExams} Attempts
                      </Badge>
                    )
                  },
                  {
                    key: 'avgScore',
                    label: 'Avg. Score',
                    align: 'center',
                    render: (_: any, s: Student) => (
                      <span className="font-black text-primary text-[13px]">
                        {s.stats.avgScore}%
                      </span>
                    )
                  },
                  {
                    key: 'lastActive',
                    label: 'Last Active',
                    render: (_: any, s: Student) => (
                      <span className="text-text-secondary font-medium opacity-60 text-[12px]">
                        {s.stats.lastActive ? new Date(s.stats.lastActive).toLocaleDateString() : 'Never'}
                      </span>
                    )
                  },
                  {
                    key: 'actions',
                    label: 'Actions',
                    align: 'center',
                    render: (_: any, s: Student) => (
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          title="View Analytics"
                          className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:border-primary hover:text-white"
                        >
                          <Eye size={16} />
                        </button>
                      </div>

                    )
                  }
                ]}
              />
            </Card>
          </SectionReveal>
        )}
      </Stack>

      {selectedStudent && (() => {
        const s = selectedStudent
        return (
        <AdminModal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={s.full_name}
          description={s.email}
          headerBadge={<Badge variant="primary" icon={Users}>Student Profile</Badge>}
          footer={
            <Stack direction="row" gap="sm">
              <Button variant="secondary" onClick={() => handleCopyClick(s)}>
                <Copy size={16} className="mr-2" /> Copy Data
              </Button>
              <Button variant="primary" onClick={() => handleDownloadCSV(s)}>
                <Download size={16} className="mr-2" /> Download CSV
              </Button>
            </Stack>
          }
        >
          <Stack gap="xl">
            <Grid cols={4} gap={16}>
              <StatCard icon={Users} label="Coupon" value={s.coupon_code || 'N/A'} color="var(--primary)" />
              <StatCard icon={Calendar} label="Joined" value={new Date(s.created_at).toLocaleDateString()} color="var(--success)" />
              <StatCard icon={TrendingUp} label="Avg. Score" value={`${s.stats.avgScore}%`} color="var(--warning)" />
              <StatCard icon={Award} label="Best Score" value={`${s.stats.bestScore}%`} color="var(--danger)" />
            </Grid>

            <Stack gap="md">
              <div className="flex items-center justify-between">
                <Label>Academic Timeline</Label>
                <Badge variant="default" icon={BookOpen}>{s.attempts.length} Attempts</Badge>
              </div>

              {s.attempts.length === 0 ? (
                <Card variant="subtle" className="py-12 text-center opacity-40">
                  <TrendingUp size={48} className="mx-auto mb-3" />
                  <Body secondary>No academic activity recorded yet.</Body>
                </Card>
              ) : (
                <Card variant="default" className="p-0 overflow-hidden">
                  <DataGrid 
                    rowKey="id"
                    rows={s.attempts}
                    columns={[
                      { key: 'exam_name', label: 'Exam Protocol', cellClassName: 'font-bold text-text-primary' },
                      { key: 'score', label: 'Score', render: (val) => <span className="font-black text-primary">{val}%</span> },
                      { key: 'time_taken', label: 'Duration', render: (val) => `${Math.floor(val/60)}m ${val%60}s` },
                      { key: 'submitted_at', label: 'Submission', render: (val) => new Date(val).toLocaleDateString() }
                    ]}
                  />
                </Card>
              )}
            </Stack>
          </Stack>
        </AdminModal>
      )})()}
    </PageContainer>
  )
}

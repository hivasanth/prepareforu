import { useState, useEffect, useRef } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isSubAdmin } from '../../utils/authUtils'
import { GuardLoader } from '../../guards/Guards'
import { fetchTeacherExams, fetchAttemptsByTeacherExamIds } from '../../services/teacherExamService'
import { findSubAdminProfileSimple, countUsersByEducatorId } from '../../services/userService'
import { 
  Users, 
  BookOpen, 
  Activity, 
  FileText, 
  Clock, 
  LayoutGrid, 
  ChevronRight, 
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import ExamDetailModal from '../../components/sub-admin/exams/ExamDetailModal'
import { 
  PageContainer, 
  Stack, 
  Grid, 
  StatCard, 
  SectionReveal, 
  Card, 
  Button, 
  Badge,
  Body
} from '../../components/common/AntigravityUI'
import { AdminIconWrap } from '../../components/admin/common/AdminIconWrap'
import { AdminText } from '../../components/admin/common/AdminText'
import { useToast } from '../../hooks/useToast'

/* ─── TYPES ─────────────────────────────────────────────────────────────────── */
interface DashboardStats {
  totalExams: number;
  activeExams: number;
  totalStudents: number;
  totalAttempts: number;
}

interface RecentActivity {
  exams: any[];
  attempts: any[];
}

export default function SubAdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { showError } = useToast()
  
  const mountedRef = useRef(true)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  // State
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<RecentActivity | null>(null)
  const [selectedExam, setSelectedExam] = useState<any | null>(null)

  // ── Data Fetching
  const fetchData = async () => {
    if (!user?.id) return
    setLoading(true)
    
    try {
      // 1 & 2. Parallel — get sub-admin identity + student count
      const [profileData, studentCount] = await Promise.all([
        findSubAdminProfileSimple(user.id),
        countUsersByEducatorId(user.id)
      ])

      if (!profileData) {
        showError('Educator profile not found. Please contact admin.')
        setLoading(false)
        return
      }

      const saId = profileData.id

      // 3. Fetch Exams
      const exams = await fetchTeacherExams(
        { user, requestId: `dash_exams_${Date.now()}` },
        saId
      )

      // 4. Fetch Attempts (guard against empty exam list)
      let attempts: any[] = []
      const examIds = (exams || []).map(e => e.id)
      if (examIds.length > 0) {
        attempts = await fetchAttemptsByTeacherExamIds(examIds)
      }

      // 5. Transform
      const now = new Date()
      const activeCount = (exams || []).filter(e => {
        const start = new Date(e.start_time)
        const end = new Date(e.end_time)
        return e.status === 'published' && now >= start && now <= end
      }).length

      if (!mountedRef.current) return
      setStats({
        totalExams: exams?.length || 0,
        activeExams: activeCount,
        totalStudents: studentCount || 0,
        totalAttempts: attempts?.length || 0
      })

      setActivity({
        exams: (exams || []).slice(0, 4),
        attempts: (attempts || []).slice(0, 10)
      })

    } catch (err: any) {
      if (!mountedRef.current) return
      showError(err.message || 'Failed to sync with backend protocols.')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id])

  if (authLoading) return <GuardLoader />
  if (!isSubAdmin(user)) return <Navigate to="/unauthorized" replace />

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div />
        <Button
          variant="secondary"
          onClick={fetchData}
          disabled={loading}
          className="!h-8 px-3 text-[10px]"
        >
          <RefreshCw size={12} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Stack gap="lg">
        <SectionReveal>
          <Grid cols={4} gap={24}>
            <StatCard icon={BookOpen} label="Total Exams" value={stats?.totalExams || 0} loading={loading} color="var(--primary)" />
            <StatCard icon={Activity} label="Active Exams" value={stats?.activeExams || 0} loading={loading} color="var(--success)" />
            <StatCard icon={Users} label="Cohort Size" value={stats?.totalStudents || 0} loading={loading} color="var(--warning)" />
            <StatCard icon={TrendingUp} label="Total Attempts" value={stats?.totalAttempts || 0} loading={loading} color="var(--danger)" />
          </Grid>
        </SectionReveal>

        <Grid cols={2} gap={24}>
          {/* Recent Exams */}
          <SectionReveal delay={0.1}>
            <Stack gap="md">
              <div className="flex items-center justify-between">
                <Stack direction="row" gap="sm" align="center">
                  <AdminIconWrap size="sm" rounded="lg" className="shadow-sm scale-90">
                    <FileText size={18} />
                  </AdminIconWrap>
                  <AdminText as="span" variant="cinzel">Recent Deployments</AdminText>
                </Stack>
                <Button variant="secondary" onClick={() => navigate('/sub-admin/my-exams')} className="!h-8 px-3 text-[10px]">
                  View All
                </Button>
              </div>

              <Stack gap="sm">
                {loading && !activity ? (
                  <>
                    {[1,2,3].map(i => (
                      <Card key={i} variant="default" className="p-4 animate-pulse">
                        <div className="h-4 bg-border-subtle/40 rounded w-3/4 mb-3" />
                        <div className="flex gap-4">
                          <div className="h-3 bg-border-subtle/30 rounded w-16" />
                          <div className="h-3 bg-border-subtle/30 rounded w-12" />
                        </div>
                      </Card>
                    ))}
                  </>
                ) : activity?.exams.length === 0 ? (
                  <Card variant="subtle" className="py-12 text-center opacity-40">
                    <BookOpen size={40} className="mx-auto mb-2" />
                    <Body secondary>No exams deployed yet.</Body>
                  </Card>
                ) : (
                  activity?.exams.map((exam) => (
                    <Card 
                      key={exam.id} 
                      variant="default" 
                      className="p-4 group transition-all cursor-pointer hover:border-primary/30"
                      onClick={() => setSelectedExam(exam)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <AdminText as="h4" variant="cinzel" className="font-black text-text-primary uppercase tracking-tight truncate flex-1 mr-4">
                          {exam.title}
                        </AdminText>
                        <Badge variant={exam.status === 'published' ? 'primary' : 'default'}>
                          {exam.status}
                        </Badge>
                      </div>
                      <Stack direction="row" gap="md" align="center">
                        <Stack direction="row" gap="xs" align="center">
                          <LayoutGrid size={12} className="text-primary opacity-60" />
                          <span className="text-[10px] font-bold text-text-secondary">{exam.total_questions} Qs</span>
                        </Stack>
                        <Stack direction="row" gap="xs" align="center">
                          <Clock size={12} className="text-warning opacity-60" />
                          <span className="text-[10px] font-bold text-text-secondary">{exam.duration_minutes || 0}m</span>
                        </Stack>
                        <Stack direction="row" gap="xs" align="center" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] font-black uppercase text-primary">Details</span>
                          <ChevronRight size={12} className="text-primary" />
                        </Stack>
                      </Stack>
                    </Card>
                  ))
                )}
              </Stack>
            </Stack>
          </SectionReveal>

          {/* Recent Attempts */}
          <SectionReveal delay={0.15}>
            <Stack gap="md">
              <div className="flex items-center justify-between">
                <Stack direction="row" gap="sm" align="center">
                  <AdminIconWrap size="sm" rounded="lg" className="shadow-sm scale-90">
                    <Activity size={18} />
                  </AdminIconWrap>
                  <AdminText as="span" variant="cinzel">Last Engagements</AdminText>
                </Stack>
                <Button variant="secondary" onClick={() => navigate('/sub-admin/students')} className="!h-8 px-3 text-[10px]">
                  View All
                </Button>
              </div>

              <Stack gap="sm">
                {loading && !activity ? (
                  <>
                    {[1,2,3,4,5].map(i => (
                      <Card key={i} variant="subtle" className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="w-10 h-10 rounded-xl bg-border-subtle/30" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-border-subtle/30 rounded w-28" />
                          <div className="h-2 bg-border-subtle/20 rounded w-16" />
                        </div>
                        <div className="h-5 bg-border-subtle/30 rounded w-12" />
                      </Card>
                    ))}
                  </>
                ) : activity?.attempts.length === 0 ? (
                  <Card variant="subtle" className="py-12 text-center opacity-40">
                    <Users size={40} className="mx-auto mb-2" />
                    <Body secondary>No student activity detected.</Body>
                  </Card>
                ) : (
                  activity?.attempts.map((attempt) => (
                    <Card 
                      key={attempt.id} 
                      variant="subtle"
                      className="flex items-center justify-between p-3 border border-border-subtle/30 rounded-2xl transition-all group cursor-default bg-card-bg hover:border-secondary/30"
                    >
                      <Stack direction="row" gap="md" align="center">
                        <AdminIconWrap size="sm" rounded="lg" className="font-black text-xs">
                          {attempt.users?.full_name?.charAt(0) || 'S'}
                        </AdminIconWrap>
                        <Stack gap={0}>
                          <AdminText as="span" variant="cinzel" className="text-xs font-black text-text-primary uppercase tracking-tight truncate max-w-[150px]">
                            {attempt.users?.full_name || 'Anonymous'}
                          </AdminText>
                          <span className="text-[9px] text-text-secondary font-bold opacity-50 uppercase tracking-widest">
                            {new Date(attempt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </Stack>
                      </Stack>
                      <div className="text-right">
                        <Badge variant="default" className="!bg-secondary/5 !text-secondary !border-secondary/10">
                          {attempt.score}%
                        </Badge>
                      </div>
                    </Card>
                  ))
                )}
              </Stack>
            </Stack>
          </SectionReveal>
        </Grid>
      </Stack>

      {selectedExam && (
        <ExamDetailModal 
          exam={selectedExam} 
          onClose={() => setSelectedExam(null)} 
        />
      )}
    </PageContainer>
  )
}

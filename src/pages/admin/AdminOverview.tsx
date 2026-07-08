import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { GuardLoader } from '../../guards/Guards'
import { ExamTabs } from '../../components/admin/overview/ExamTabs'
import { StatsGrid } from '../../components/admin/overview/StatsGrid'
import { lazy, Suspense } from 'react'
import PremiumLoader from '../../components/PremiumLoader'
const DailyAttemptsChart = lazy(() => import('../../components/admin/overview/DailyAttemptsChart').then(m => ({ default: m.DailyAttemptsChart })))
import {
  PageContainer, 
  Stack, 
  SectionReveal, 
  Card,
  useTheme
} from '../../components/common/AntigravityUI'

export default function AdminOverview() {
  const { loading } = useAuth()
  const { isDark } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedExam = searchParams.get('exam') || 'all'

  const setSelectedExam = (exam: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (exam === 'all') next.delete('exam')
      else next.set('exam', exam)
      return next
    }, { replace: true })
  }

  if (loading) return <GuardLoader />

  return (
    <PageContainer>
      <h1 className="sr-only">Admin Overview</h1>

      <Stack gap="lg">
        <SectionReveal className="flex justify-center lg:justify-start w-full">
          <div className={`w-fit max-w-full overflow-x-auto custom-scrollbar p-1 ${!isDark ? 'ancient-tab-track shadow-md' : 'bg-card-bg/50 border border-border-subtle rounded-2xl'}`}>
            <ExamTabs 
              selectedExam={selectedExam} 
              setSelectedExam={setSelectedExam} 
              className="bg-transparent border-none p-0 w-fit"
            />
          </div>
        </SectionReveal>

        <StatsGrid selectedExam={selectedExam} />

        <div className="grid grid-cols-1 gap-8">
          <SectionReveal delay={0.1}>
            <Card variant="default" className="p-0 overflow-hidden h-full min-h-[400px]">
              <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center"><PremiumLoader /></div>}>
                <DailyAttemptsChart selectedExam={selectedExam} />
              </Suspense>
            </Card>
          </SectionReveal>
        </div>
      </Stack>
    </PageContainer>
  )
}

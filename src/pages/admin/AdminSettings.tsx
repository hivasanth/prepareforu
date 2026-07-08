import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminFilters } from '../../hooks/useAdminFilters'
import { isAdmin } from '../../utils/authUtils'
import { adminService } from '../../services/adminService'
import type { ExamConfig } from '../../types/exam.types'
import { generateRequestId } from '../../utils/logger'
import { useAuth } from '../../context/AuthContext'
import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import { PageHeader } from '../../components/admin/PageHeader'
import { SettingsCard } from '../../components/admin/settings/SettingsCard'
import { SubjectPieChart } from '../../components/admin/settings/SubjectPieChart'
import { AddExamModal } from '../../components/admin/settings/AddExamModal'
import { 
  AlertCircle, 
  Shield, 
  BarChart3, 
  ToggleLeft,
  RefreshCw,
  Plus
} from 'lucide-react'
import { 
  PageContainer, 
  Stack, 
  Card, 
  Input, 
  Switch, 
  Button,
  Badge, 
  Label, 
  SectionReveal, 
  Grid,
  useTheme
} from '../../components/common/AntigravityUI'
import { useToast, ToastContainer } from '../../hooks/useToast'
import { EmptyState } from '../../components/common/SharedComponents'
import { GuardLoader } from '../../guards/Guards'
import { motion } from 'framer-motion'

export default function AdminSettings() {
  const { user, loading: authLoading } = useAuth()
  const { isDark } = useTheme()
  const { selectedExam, selectedPaper, selectedSubject, setSelectedExam, setSelectedPaper, setSelectedSubject } = useAdminFilters()
  const { toasts, showSuccess, showError } = useToast()

  const [config, setConfig] = useState<ExamConfig | null>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tabsKey, setTabsKey] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const requestId = generateRequestId('fetch_admin_settings')
      if (selectedExam === 'all' || selectedExam === 'APPSC_GROUPS') return

      const targetExamId = selectedExam
      const paperData = await adminService.fetchExamPapers({ user, requestId }, targetExamId)

      let currentPaperId = selectedPaper
      if (paperData?.length > 0 && (currentPaperId === 'all' || !paperData.find(p => p.id === currentPaperId))) {
        currentPaperId = paperData[0].id
      }

      const configData = await adminService.fetchExamConfig({ user, requestId }, targetExamId)
      if (currentPaperId !== 'all') {
        const paper = paperData?.find(p => p.id === currentPaperId)
        if (paper && configData) {
          setConfig({
            ...configData,
            total_questions: paper.total_questions,
            total_marks: paper.total_marks,
            duration_minutes: paper.duration_minutes,
            negative_marking: paper.negative_marking,
            negative_mark_value: Number(paper.negative_mark_value)
          })
        } else {
          setConfig(configData)
        }
      } else {
        setConfig(configData)
      }

      const subjectData = await adminService.fetchExamSubjects({ user, requestId }, targetExamId, currentPaperId === 'all' ? null : currentPaperId)
      setSubjects(subjectData || [])
    } catch (err) {
      showError('Failed to load settings data')
    } finally {
      setIsLoading(false)
    }
  }, [selectedExam, selectedPaper, user, showError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (selectedSubject !== 'all' && !isLoading) {
      const el = document.getElementById(`subject-${selectedSubject}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedSubject, isLoading])

  const handleSave = async (key: string, fn: () => Promise<void>) => {
    if (!isAdmin(user)) return showError('Unauthorized')
    setIsSaving(p => ({ ...p, [key]: true }))
    try {
      await fn()
      showSuccess('Settings updated successfully')
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setIsSaving(p => ({ ...p, [key]: false }))
    }
  }

  const saveConfig = async () => {
    if (!config) return
    const requestId = generateRequestId('save_config')
    const currentPaperId = selectedPaper
    const paperFields = {
      total_questions: config.total_questions,
      total_marks: config.total_marks,
      duration_minutes: config.duration_minutes,
      negative_marking: config.negative_marking,
      negative_mark_value: config.negative_mark_value,
    }
    if (currentPaperId !== 'all') {
      await adminService.updateExamPaper({ user, requestId }, currentPaperId, paperFields)
    } else {
      await adminService.updateExamConfig({ user, requestId }, selectedExam, {
        ...paperFields,
        is_published: config.is_published,
        allow_multiple_attempts: config.allow_multiple_attempts,
      })
      await adminService.syncExamPapersFromConfig({ user, requestId }, selectedExam, paperFields)
    }
  }

  const saveSubjects = async () => {
    const totalQ = subjects.reduce((sum, s) => sum + s.question_count, 0)
    if (totalQ !== config?.total_questions) throw new Error(`Total questions must be ${config?.total_questions}`)
    await adminService.updateExamSubjects({ user, requestId: generateRequestId('save_subjects') }, subjects)
  }

  if (authLoading) return <GuardLoader />
  if (!isAdmin(user)) return <Navigate to="/unauthorized" replace />

  return (
    <PageContainer>
      <ToastContainer toasts={toasts} />
      <h1 className="sr-only">Settings</h1>

      <PageHeader
        actionButton={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="!h-[36px] !text-xs">
            <Plus size={14} className="mr-1.5" /> Add Exam
          </Button>
        }
      />

      <Stack gap="lg">
        <SectionReveal className="w-full">
          <div className="w-full flex flex-col gap-4 relative">
            <AdminSelectionTabs
              key={tabsKey}
              selectedExam={selectedExam}
              setSelectedExam={setSelectedExam}
              selectedPaper={selectedPaper}
              setSelectedPaper={setSelectedPaper}
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              hideAll={true}
              className="bg-transparent border-none p-0 w-full"
            />
          </div>
        </SectionReveal>

        <div aria-live="polite" aria-label="Settings content">
        {isLoading ? (
          <SectionReveal>
            <Card variant="subtle" className="py-32 text-center flex flex-col items-center gap-4">
              <RefreshCw size={48} className="animate-spin text-primary opacity-20" />
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-40">Syncing configuration...</p>
            </Card>
          </SectionReveal>
        ) : !config ? (
          <SectionReveal>
            <EmptyState
              icon={<AlertCircle size={48} />}
              title="No Configuration"
              subtitle="No configuration found for this selection."
            />
          </SectionReveal>
        ) : (
          <Grid cols={2}>
            <SettingsCard title="Subject Distribution" icon={Shield} onSave={() => handleSave('subjects', saveSubjects)} isSaving={isSaving.subjects}>
              <Stack gap="lg">
                <SubjectPieChart data={subjects} />
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 form-scrollbar">
                  {subjects.map((sub, idx) => (
                    <div key={sub.id} id={`subject-${sub.subject_name}`}>
                      <Stack 
                        gap="sm" 
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 ancient-3d-lift ${
                          selectedSubject === sub.subject_name 
                          ? (!isDark ? 'bg-[var(--ancient-cream)] border-primary shadow-xl scale-[1.03] z-20' : 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]') 
                          : (!isDark ? 'bg-white/40 border-primary/10' : 'bg-hover-bg/30 border-border-subtle/50')
                        }`}
                      >
                        <Stack direction="row" justify="between" align="center">
                          <Label className={selectedSubject === sub.subject_name ? 'text-primary font-black' : ''}>
                            #{idx + 1} {sub.subject_name}
                          </Label>
                          {selectedSubject === sub.subject_name && (
                            <Badge variant="secondary" className="text-[8px] animate-pulse !bg-secondary !text-[#1C0F0A]">Selected</Badge>
                          )}
                        </Stack>
                        <Grid cols={2} gap={10}>
                          <Stack gap="xs">
                            <Label>Questions</Label>
                            <Input type="number" value={sub.question_count} onChange={(e) => {
                              const ns = [...subjects]; ns[idx].question_count = Number(e.target.value); setSubjects(ns);
                            }} />
                          </Stack>
                          <Stack gap="xs">
                            <Label>Marks/Q</Label>
                            <Input type="number" value={sub.marks_per_question} onChange={(e) => {
                              const ns = [...subjects]; ns[idx].marks_per_question = Number(e.target.value); setSubjects(ns);
                            }} />
                          </Stack>
                        </Grid>
                      </Stack>
                    </div>
                  ))}
                </div>
                <Stack direction="row" justify="between" className={`pt-4 border-t ${!isDark ? 'border-primary/20' : 'border-border-subtle/50'}`}>
                  <Label className={!isDark ? '!opacity-100 !text-primary text-[12px] font-black' : 'text-primary font-black'}>Running Total Questions</Label>
                  <Badge variant={subjects.reduce((s, b) => s + b.question_count, 0) === config.total_questions ? 'success' : 'danger'}
                    className={!isDark ? 'scale-110 shadow-md !font-black !text-[12px]' : '!font-black !text-[12px]'}>
                    {subjects.reduce((s, b) => s + b.question_count, 0)} / {config.total_questions}
                  </Badge>
                </Stack>
              </Stack>
            </SettingsCard>

            <SettingsCard title="Exam Parameters" icon={BarChart3} onSave={() => handleSave('params', saveConfig)} isSaving={isSaving.params}>
              <Stack gap="lg">
                <Grid cols={2} gap={16}>
                  <Stack gap="sm">
                    <Label>Total Questions</Label>
                    <Input type="number" value={config.total_questions} onChange={(e) => setConfig({...config, total_questions: Number(e.target.value)})} />
                  </Stack>
                  <Stack gap="sm">
                    <Label>Total Marks</Label>
                    <Input type="number" value={config.total_marks} onChange={(e) => setConfig({...config, total_marks: Number(e.target.value)})} />
                  </Stack>
                </Grid>
                <Stack gap="sm">
                  <Label>Duration (Minutes)</Label>
                  <Input type="number" value={config.duration_minutes} onChange={(e) => setConfig({...config, duration_minutes: Number(e.target.value)})} />
                </Stack>

                <Stack gap="sm">
                  <Stack direction="row" align="center" gap="sm" className="p-4 bg-hover-bg/30 rounded-2xl border border-border-subtle/50">
                    <ToggleLeft size={18} className="text-primary opacity-60" />
                    <Switch label={config.is_published ? "Published (Live)" : "Draft (Hidden)"} checked={config.is_published} onChange={(v) => setConfig({...config, is_published: v})} />
                  </Stack>
                </Stack>

                <Stack gap="md" className="p-4 bg-hover-bg/30 rounded-2xl border border-border-subtle/50">
                  <Switch label="Negative Marking" checked={config.negative_marking} onChange={(v) => setConfig({...config, negative_marking: v})} />
                  {config.negative_marking && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                      <Label>Penalty Value</Label>
                      <Input type="number" className="mt-1" value={config.negative_mark_value} onChange={(e) => setConfig({...config, negative_mark_value: Number(e.target.value)})} />
                    </motion.div>
                  )}
                </Stack>

                <Stack gap="sm">
                  <div className="p-4 bg-hover-bg/30 rounded-2xl border border-border-subtle/50">
                    <Switch label="Multiple Attempts" checked={!!config.allow_multiple_attempts} onChange={(v) => setConfig({...config, allow_multiple_attempts: v})} />
                  </div>
                </Stack>
              </Stack>
            </SettingsCard>
          </Grid>
        )}
        </div>
      </Stack>

      <AddExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onExamCreated={(examId) => {
          setTabsKey(prev => prev + 1)
          setSelectedExam(examId)
        }}
      />
    </PageContainer>
  )
}

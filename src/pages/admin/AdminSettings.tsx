import { AlertCircle, Shield, BarChart3, Plus } from 'lucide-react'
import {
  H1, PageContainer, Stack, Card, Button, SectionReveal, Grid, Alert, Spinner
} from '../../components/common/AntigravityUI'
import { PageHeader } from '../../components/admin/PageHeader'
import { SettingsCard, AddExamModal } from '../../components/admin/settings'
import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import { ToastContainer } from '../../hooks/useToast'
import { EmptyState } from '../../components/common/SharedComponents'
import { SubjectDistributionPanel } from '../../components/admin/settings/SubjectDistributionPanel'
import { ExamParamsForm } from '../../components/admin/settings/ExamParamsForm'
import { useAdminSettings } from '../../components/admin/settings/useAdminSettings'

export default function AdminSettings() {
  const {
    user, toasts, error, selectedExam, selectedPaper, selectedSubject,
    setSelectedExam, setSelectedPaper, setSelectedSubject,
    config, setConfig, subjects, setSubjects,
    isLoading, isSaving, isModalOpen, setIsModalOpen,
    tabsKey, setTabsKey,
    handleSave, saveConfig, saveSubjects,
    paramsFieldErrors, subjectsError, handleParamsBlur, handleSubjectBlur,
  } = useAdminSettings()

  return (
    <PageContainer>
      <ToastContainer toasts={toasts} />
      <H1 className="sr-only">Settings</H1>

      <PageHeader
        actionButton={
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
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
            />
          </div>
        </SectionReveal>

        {error && (
          <SectionReveal>
            <Alert variant="error" icon={AlertCircle} title="Something went wrong" className="w-full">
              {error}
            </Alert>
          </SectionReveal>
        )}

        <div aria-live="polite" aria-label="Settings content">
        {isLoading ? (
          <SectionReveal>
            <Card variant="subtle" className="py-32 text-center flex flex-col items-center gap-4">
              <Spinner size="lg" />
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Syncing configuration...</p>
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
              <SubjectDistributionPanel
                subjects={subjects}
                selectedSubject={selectedSubject}
                configTotalQuestions={config.total_questions}
                onQuestionCountChange={(idx, value) => {
                  const ns = [...subjects]; ns[idx].question_count = value; setSubjects(ns);
                }}
                onMarksChange={(idx, value) => {
                  const ns = [...subjects]; ns[idx].marks_per_question = value; setSubjects(ns);
                }}
                error={subjectsError}
                onSubjectBlur={handleSubjectBlur}
              />
            </SettingsCard>

            <SettingsCard title="Exam Parameters" icon={BarChart3} onSave={() => handleSave('params', saveConfig)} isSaving={isSaving.params}>
              <ExamParamsForm
                config={config}
                onConfigChange={setConfig}
                fieldErrors={paramsFieldErrors}
                onFieldBlur={handleParamsBlur}
              />
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

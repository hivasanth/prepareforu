import { useState } from 'react'
import { AlertCircle, Plus, Save, CheckCircle, CheckCircle2 } from 'lucide-react'
import {
  H1, PageContainer, Stack, Card, Button, SectionReveal, Alert
} from '../../components/common/AntigravityUI'
import { PageHeader } from '../../components/admin/PageHeader'
import { AddExamModal } from '../../components/admin/settings'
import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import { EmptyState, ConfirmModal } from '../../components/common/SharedComponents'
import { SegmentedFilter } from '../../components/common/SegmentedFilter'
import { ErrorContainer } from '../../components/common/ErrorContainer'
import { RetryButton } from '../../components/common/RetryButton'
import { ExamModePanel } from '../../components/admin/settings/ExamModePanel'
import { SubjectTestModePanel } from '../../components/admin/settings/SubjectTestModePanel'
import { AdminSettingsSkeleton } from '../../components/admin/settings/AdminSettingsSkeleton'
import { useAdminSettings } from '../../components/admin/settings/useAdminSettings'
import { motion, AnimatePresence } from 'framer-motion'
import { SECTION_REVEAL } from '../../components/common/AntigravityMotion'

export default function AdminSettings() {
  const {
    user, selectedExam, selectedPaper, selectedSubject,
    setSelectedExam, setSelectedPaper, setSelectedSubject,
    config, setConfig, subjects,
    isLoading, isSaving, isModalOpen, setIsModalOpen,
    tabsKey, setTabsKey,
    handleSave,
    paramsFieldErrors, subjectsError, handleParamsBlur, handleSubjectBlur,
    handleQuestionCountChange,
    pageMode, setPageMode,
    testMode, setTestMode,
    topicConfigs, topicLoading, topicError, saveRetryable,
    saveSuccess, draftDivergesFromServer,
    subjectTestValid,
    handleTopicThresholdChange,
    pageError, retryLoad, retrySave,
    pendingSelection, stayHere, discardForSwitch, saveAndSwitch,
  } = useAdminSettings()
  const [examCreatedMessage, setExamCreatedMessage] = useState<string | null>(null)

  return (
    <PageContainer>
      <H1 className="sr-only">Settings</H1>

      <PageHeader
        actionButton={
          <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} className="mr-1.5" /> Add Exam
          </Button>
        }
      />

      <Stack gap="lg">
        {examCreatedMessage && (
          <SectionReveal>
            <Alert variant="success" icon={CheckCircle2} title="Exam created" className="w-full" onDismiss={() => setExamCreatedMessage(null)}>
              {examCreatedMessage}
            </Alert>
          </SectionReveal>
        )}

        <SectionReveal>
          <SegmentedFilter
            ariaLabel="Configuration mode"
            options={[
              { id: 'exams', label: 'Exams' },
              { id: 'subject_test', label: 'Subject Test' },
            ]}
            value={pageMode}
            onChange={(val) => setPageMode(val as 'exams' | 'subject_test')}
          />
        </SectionReveal>

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
              showSubjects={pageMode === 'subject_test'}
            />
          </div>
        </SectionReveal>

        {/* BUG-E: this wrapper is layout-only. ErrorContainer owns the alert
         *  semantics and AdminSettingsSkeleton owns the single loading status
         *  region — a live region here would nest conflicting announcements. */}
        <div>
          {pageError ? (
            <ErrorContainer category={pageError.category} severity={pageError.severity}>
              <h2 className="text-sm font-bold text-text-primary">{pageError.title}</h2>
              <p className="text-[11px] text-text-muted">{pageError.message}</p>
              <RetryButton onRetry={retryLoad} loading={isLoading} />
            </ErrorContainer>
          ) : isLoading ? (
            <AdminSettingsSkeleton />
          ) : selectedExam === 'all' || selectedExam === 'APPSC_GROUPS' ? (
            /* BUG-D: a group-level pseudo-selection is not a data-empty
             * condition — show neutral guidance instead of EmptyState. */
            <SectionReveal>
              <Card padding={24}>
                <p className="text-center text-[12px] text-text-muted">
                  Select a specific exam to view its configuration.
                </p>
              </Card>
            </SectionReveal>
          ) : !config ? (
            <SectionReveal>
              <EmptyState
                icon={<AlertCircle size={48} />}
                title="No Configuration Yet"
                subtitle="This exam has no saved configuration for the current selection."
              />
            </SectionReveal>
          ) : (
            <Stack gap="lg">
              <AnimatePresence mode="wait">
                {pageMode === 'exams' ? (
                  <motion.div
                    key="exams"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={SECTION_REVEAL}
                  >
                    <ExamModePanel
                      config={config}
                      subjects={subjects}
                      topicConfigs={topicConfigs}
                      topicLoading={topicLoading}
                      subjectsError={subjectsError}
                      paramsFieldErrors={paramsFieldErrors}
                      onConfigChange={setConfig}
                      onQuestionCountChange={handleQuestionCountChange}
                      onTopicThresholdChange={handleTopicThresholdChange}
                      onFieldBlur={handleParamsBlur}
                      onSubjectBlur={handleSubjectBlur}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="subject_test"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={SECTION_REVEAL}
                  >
                    <SubjectTestModePanel
                      subjects={subjects}
                      selectedSubject={selectedSubject}
                      topicConfigs={topicConfigs}
                      topicLoading={topicLoading}
                      testMode={testMode}
                      onTestModeChange={setTestMode}
                      onTopicThresholdChange={handleTopicThresholdChange}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <SectionReveal>
                <div className="sticky bottom-4 z-30">
                <Card variant="default" padding={16}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AnimatePresence mode="wait">
                        {saveSuccess && (
                          <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            className="flex items-center gap-1.5"
                          >
                            <CheckCircle size={14} className="text-success" />
                            <span className="text-[11px] font-semibold text-success">Changes saved</span>
                          </motion.div>
                        )}
                        {topicError && !saveSuccess && (
                          <ErrorContainer
                            category="server"
                            severity="medium"
                            variant="inline"
                            padding={16}
                          >
                            <p className="text-[11px] text-text-primary">{topicError}</p>
                            {/* BUG-C: retry is offered only for genuine
                             *  transport/backend failures backed by a valid
                             *  current-context factory. Validation failures
                             *  keep the draft and show the message only. */}
                            {saveRetryable && (
                              <RetryButton onRetry={retrySave} loading={isSaving} label="Retry" size="sm" />
                            )}
                          </ErrorContainer>
                        )}
                      </AnimatePresence>
                    </div>
                    <Button
                      onClick={handleSave}
                      loading={isSaving}
                      disabled={isSaving || (pageMode === 'subject_test' && (!draftDivergesFromServer || !subjectTestValid))}
                      variant="primary"
                    >
                      <Save size={16} className="mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </Card>
              </div>
            </SectionReveal>
            </Stack>
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
        onSuccess={setExamCreatedMessage}
      />

      <ConfirmModal
        open={pendingSelection !== null}
        title="Unsaved changes"
        message="You have unsaved changes. Save them before switching, or discard to continue without saving."
        confirmLabel="Save Changes"
        cancelLabel="Stay Here"
        onConfirm={saveAndSwitch}
        onCancel={stayHere}
        secondaryAction={{ label: 'Discard Changes', onClick: discardForSwitch }}
        busy={isSaving}
      />
    </PageContainer>
  )
}

import { AnimatePresence } from 'framer-motion'
import { STEPS } from '../../components/sub-admin/create/types'
import { useCreateExam } from '../../components/sub-admin/create/useCreateExam'
import { CreateStepPrompt } from '../../components/sub-admin/create/CreateStepPrompt'
import { CreateStepJsonPaste } from '../../components/sub-admin/create/CreateStepJsonPaste'
import { CreateStepReview } from '../../components/sub-admin/create/CreateStepReview'
import { CreateStepSetup } from '../../components/sub-admin/create/CreateStepSetup'
import { CreateStepPublish } from '../../components/sub-admin/create/CreateStepPublish'
import { SuccessView } from '../../components/sub-admin/create/SuccessView'
import { PageContainer, Stack, Card, SegmentedFilter, SectionReveal, Alert } from '../../components/common/AntigravityUI'

import { AlertCircle, CheckCircle2 } from 'lucide-react'


export default function SubAdminCreate() {
  const {
    step, setStep,
    error,
    isPublishing, publishError,
    targetCount, setTargetCount,
    customCount, setCustomCount,
    promptPhase, setPromptPhase,
    copied, copyError, activeAICopy,
    isPublished,
    questions, setQuestions,
    parseReport, setParseReport,
    examConfig, setExamConfig,
    endTimeManuallyOverridden,
    handleStartTimeChange,
    handleEndTimeChange,
    handleResetEndToDefault,
    breakpoint,
    successMessage, clearSuccessMessage,
    getSimpleInstruction,
    handleStepChange,
    handleCopyPrompt,
    launchAI,
    resetWizard,
    handlePublish,
  } = useCreateExam()

  const requestCount = targetCount === 0 ? parseInt(customCount) || 10 : targetCount

  if (isPublished) {
    return (
      <PageContainer>
        <SuccessView examTitle={examConfig.title} onReset={resetWizard} />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Stack gap="xl">
        <SectionReveal>
          <Stack gap="md" className="pb-4 border-b border-border-subtle/30">
            <div className="w-full max-lg:overflow-x-auto scrollbar-hide lg:overflow-x-visible">
              <SegmentedFilter
                ariaLabel="Create exam steps"
                options={STEPS.map(s => ({ id: s.n.toString(), label: `${s.n}. ${s.label}` }))}
                value={step.toString()}
                onChange={(id) => handleStepChange(parseInt(id))}
              />
            </div>
            <div className="flex-1">
              <p className="!text-sm sm:!text-base font-bold tracking-wide text-text-primary opacity-90 transition-opacity duration-slow">
                {getSimpleInstruction()}
              </p>
            </div>
          </Stack>
        </SectionReveal>

        {successMessage && (
          <SectionReveal>
            <Alert variant="success" icon={CheckCircle2} title="AI assistant opened" className="w-full" onDismiss={clearSuccessMessage}>
              {successMessage}
            </Alert>
          </SectionReveal>
        )}

        {error && (
          <SectionReveal>
            <Alert variant="error" icon={AlertCircle} title="Action failed" className="w-full">
              {error}
            </Alert>
          </SectionReveal>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <SectionReveal key="s1">
              <Stack gap="xl">
                <CreateStepPrompt
                  targetCount={targetCount}
                  setTargetCount={setTargetCount}
                  customCount={customCount}
                  setCustomCount={setCustomCount}
                  promptPhase={promptPhase}
                  copied={copied}
                  copyError={copyError}
                  activeAICopy={activeAICopy}
                  onCopyPrompt={handleCopyPrompt}
                  onLaunchAI={launchAI}
                  onPromptPhaseChange={setPromptPhase}
                />
              </Stack>
            </SectionReveal>
          )}

          {step === 2 && (
            <SectionReveal key="s2">
              <Stack gap="xl">
                <CreateStepJsonPaste
                  questions={questions}
                  setQuestions={setQuestions}
                  requestCount={requestCount}
                  parseReport={parseReport}
                  setParseReport={setParseReport}
                  onConfirm={() => setStep(3)}
                  breakpoint={breakpoint}
                />
              </Stack>
            </SectionReveal>
          )}

          {step === 3 && (
            <SectionReveal key="s3">
              <Stack gap="lg" className="pb-24">
                <CreateStepReview
                  questions={questions}
                  setQuestions={setQuestions}
                  parseReport={parseReport}
                  onConfirm={() => setStep(4)}
                  onBack={() => setStep(2)}
                  breakpoint={breakpoint}
                />
              </Stack>
            </SectionReveal>
          )}

          {step === 4 && (
            <SectionReveal key="s4">
              <Stack gap="xl">
                <CreateStepSetup
                  examConfig={examConfig}
                  setExamConfig={setExamConfig}
                  endTimeManuallyOverridden={endTimeManuallyOverridden}
                  onStartTimeChange={handleStartTimeChange}
                  onEndTimeChange={handleEndTimeChange}
                  onResetEndToDefault={handleResetEndToDefault}
                  onConfirm={() => setStep(5)}
                  onBack={() => setStep(3)}
                  breakpoint={breakpoint}
                />
              </Stack>
            </SectionReveal>
          )}

          {step === 5 && (
            <SectionReveal key="s5">
              <Stack gap="xl">
                <Card padding={24}>
                  <CreateStepPublish
                    examConfig={examConfig}
                    questions={questions}
                    onPublish={handlePublish}
                    onBack={() => setStep(4)}
                    isPublishing={isPublishing}
                    publishError={publishError}
                  />
                </Card>
              </Stack>
            </SectionReveal>
          )}
        </AnimatePresence>
      </Stack>
    </PageContainer>
  )
}
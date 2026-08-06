import { AnimatePresence } from 'framer-motion'
import { STEPS } from '../../components/sub-admin/create/types'
import { useCreateExam } from '../../components/sub-admin/create/useCreateExam'
import { CreateStepPrompt } from '../../components/sub-admin/create/CreateStepPrompt'
import { CreateStepJsonPaste } from '../../components/sub-admin/create/CreateStepJsonPaste'
import { CreateStepReview } from '../../components/sub-admin/create/CreateStepReview'
import { CreateStepSetup } from '../../components/sub-admin/create/CreateStepSetup'
import { CreateStepPublish } from '../../components/sub-admin/create/CreateStepPublish'
import { SuccessView } from '../../components/sub-admin/create/SuccessView'
import { PageContainer, Stack, Card, Tabs, SectionReveal, Alert, ToastContainer } from '../../components/common/AntigravityUI'
import { AlertCircle } from 'lucide-react'

export default function SubAdminCreate() {
  const {
    step, setStep,
    error,
    isPublishing, publishError,
    targetCount, setTargetCount,
    customCount, setCustomCount,
    promptPhase, setPromptPhase,
    copied, activeAICopy,
    isPublished,
    questions, setQuestions,
    examConfig, setExamConfig,
    getTypo, breakpoint,
    toasts,
    getSimpleInstruction,
    handleStepChange,
    handleCopyPrompt,
    launchAI,
    resetWizard,
    handlePublish,
  } = useCreateExam()

  if (isPublished) {
    return (
      <PageContainer>
        <SuccessView examTitle={examConfig.title} onReset={resetWizard} />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Stack gap="lg" className="overflow-x-hidden">
        <Stack gap="xl">
          <SectionReveal>
            <Stack gap="md" className="pb-4 border-b border-border-subtle/30">
              <div className="w-full">
                <Tabs
                  ariaLabel="Create exam steps"
                  options={STEPS.map(s => ({ id: s.n.toString(), label: `${s.n}. ${s.label}` }))}
                  activeId={step.toString()}
                  onChange={(id) => handleStepChange(parseInt(id))}
                />
              </div>
              <div className="flex-1">
                <p className="!text-sm sm:!text-base font-bold tracking-wide text-text-primary opacity-90 transition-all duration-300">
                  {getSimpleInstruction()}
                </p>
              </div>
            </Stack>
          </SectionReveal>

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
                  <Card padding={24}>
                    <CreateStepPrompt
                      targetCount={targetCount}
                      setTargetCount={setTargetCount}
                      customCount={customCount}
                      setCustomCount={setCustomCount}
                      promptPhase={promptPhase}
                      copied={copied}
                      activeAICopy={activeAICopy}
                      onCopyPrompt={handleCopyPrompt}
                      onLaunchAI={() => launchAI('chatgpt')}
                      onPromptPhaseChange={setPromptPhase}
                      getTypo={getTypo}
                    />
                  </Card>
                </Stack>
              </SectionReveal>
            )}

            {step === 2 && (
              <SectionReveal key="s2">
                <Stack gap="xl">
                  <Card padding={24}>
                    <CreateStepJsonPaste
                      questions={questions}
                      setQuestions={setQuestions}
                      onConfirm={() => setStep(3)}
                      breakpoint={breakpoint}
                    />
                  </Card>
                </Stack>
              </SectionReveal>
            )}

            {step === 3 && (
              <SectionReveal key="s3">
                <Stack gap="lg" className="pb-24">
                  <CreateStepReview
                    questions={questions}
                    setQuestions={setQuestions}
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
                  <Card padding={24}>
                    <CreateStepSetup
                      examConfig={examConfig}
                      setExamConfig={setExamConfig}
                      onConfirm={() => setStep(5)}
                      onBack={() => setStep(3)}
                      breakpoint={breakpoint}
                    />
                  </Card>
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
      </Stack>
      <ToastContainer toasts={toasts} />
    </PageContainer>
  )
}

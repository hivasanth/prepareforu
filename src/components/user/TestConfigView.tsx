import { ArrowLeft, Timer, Target, ChevronRight } from 'lucide-react'
import { Card, IconButton, Stack, Button, H2 } from '../common/AntigravityUI'
import { Body, Label } from '../common/AntigravityTypography'
import { Spinner } from '../common/Spinner'

interface TestConfigViewProps {
  title: string
  options: number[]
  totalQuestions: number
  questionCount: number
  setQuestionCount: (count: number) => void
  isLaunching: boolean
  onLaunch: () => void
  onBack: () => void
}

export function TestConfigView({
  title,
  options,
  totalQuestions,
  questionCount,
  setQuestionCount,
  isLaunching,
  onLaunch,
  onBack
}: TestConfigViewProps) {
  return (
    <div className="max-w-[800px] mx-auto animate-in">
      <Card variant="premium-dark-neutral" className="p-8 lg:p-12 space-y-8">
        <div className="flex items-center gap-4 border-b border-border-subtle pb-6">
          <IconButton onClick={onBack} title="Back">
            <ArrowLeft size={20} />
          </IconButton>
          <div className="flex flex-col">
            <H2 className="text-[24px] font-black uppercase tracking-tight m-0">{title}</H2>
            <Label className="text-[12px] font-bold text-primary uppercase tracking-widest m-0">Session Configuration</Label>
          </div>
        </div>

        <Stack gap={32}>
          <Stack gap={16}>
            <Label className="text-[14px] font-bold text-text-secondary uppercase tracking-widest m-0">Select Question Count</Label>
            <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label="Select question count">
              {options.map(cnt => {
                const isAvailable = cnt <= totalQuestions;
                return (
                  <button
                    key={cnt}
                    disabled={!isAvailable}
                    aria-pressed={questionCount === cnt}
                    aria-label={`${cnt} questions`}
                    onClick={() => setQuestionCount(cnt)}
                    className={`
                      py-6 rounded-2xl border-2 transition-[color,box-shadow,border-color,opacity] duration-200 ease-out text-center flex flex-col items-center justify-center gap-2
                      ${!isAvailable ? 'opacity-40 bg-hover-bg/20 border-border-subtle cursor-not-allowed' : 
                        questionCount === cnt ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-border-subtle bg-card-bg lg:hover:border-primary/30'}
                    `}
                  >
                    <Body className={`text-[28px] font-black tracking-tighter m-0 ${questionCount === cnt ? 'text-primary' : 'text-text-primary'}`}>{cnt}</Body>
                    <Label className={`text-[11px] font-bold uppercase tracking-widest m-0 ${questionCount === cnt ? 'text-primary' : 'text-text-muted'}`}>Questions</Label>
                  </button>
                )
              })}
            </div>
            <Body className="text-[12px] text-text-muted mt-2">* You can only select up to the number of available questions in the database.</Body>
          </Stack>

          <div className="p-6 rounded-2xl bg-hover-bg/30 border border-border-subtle space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full bg-primary/10 text-primary">
                <Timer size={16} />
              </div>
              <div className="flex flex-col pt-1">
                <Body className="text-[14px] font-bold text-text-primary m-0">Strict Timing</Body>
                <Body className="text-[12px] text-text-secondary m-0">1 minute allocated per question. Timer runs automatically.</Body>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full bg-success/10 text-success">
                <Target size={16} />
              </div>
              <div className="flex flex-col pt-1">
                <Body className="text-[14px] font-bold text-text-primary m-0">Standard Marking</Body>
                <Body className="text-[12px] text-text-secondary m-0">Each question carries exactly 1 mark. There is no negative marking.</Body>
              </div>
            </div>
          </div>

          <Button 
            fullWidth variant="primary" size="xl" disabled={isLaunching}
            onClick={onLaunch} className="mt-4"
          >
            {isLaunching ? (
              <Label className="inline-flex items-center gap-2 m-0"><Spinner size="sm" className="border-current border-t-transparent" /> Launching...</Label>
            ) : (
              <Label className="inline-flex items-center gap-2 m-0">Start Session <ChevronRight size={18} /></Label>
            )}
          </Button>
        </Stack>
      </Card>
    </div>
  )
}

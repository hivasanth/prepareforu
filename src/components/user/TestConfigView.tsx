import { ArrowLeft, Timer, Target, ChevronRight, RefreshCw } from 'lucide-react'
import { Card, IconButton, Stack, Button } from '../common/AntigravityUI'

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
    <div className="max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-8 lg:p-12 space-y-8 shadow-xl border-primary/10">
        <div className="flex items-center gap-4 border-b border-border-subtle pb-6">
          <IconButton onClick={onBack} title="Back">
            <ArrowLeft size={20} />
          </IconButton>
          <div className="flex flex-col">
            <h2 className="text-[24px] font-black text-text-primary uppercase tracking-tight m-0">{title}</h2>
            <span className="text-[12px] font-bold text-primary uppercase tracking-widest">Session Configuration</span>
          </div>
        </div>

        <Stack gap={32}>
          <Stack gap={16}>
            <span className="text-[14px] font-bold text-text-secondary uppercase tracking-widest">Select Question Count</span>
            <div className="grid grid-cols-3 gap-4">
              {options.map(cnt => {
                const isAvailable = cnt <= totalQuestions;
                return (
                  <button
                    key={cnt}
                    disabled={!isAvailable}
                    onClick={() => setQuestionCount(cnt)}
                    className={`
                      py-6 rounded-[20px] border-2 transition-all text-center flex flex-col items-center justify-center gap-2
                      ${!isAvailable ? 'opacity-40 bg-hover-bg/20 border-border-subtle cursor-not-allowed' : 
                        questionCount === cnt ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-border-subtle bg-card-bg lg:hover:border-primary/30'}
                    `}
                  >
                    <span className={`text-[28px] font-black tracking-tighter ${questionCount === cnt ? 'text-primary' : 'text-text-primary'}`}>{cnt}</span>
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${questionCount === cnt ? 'text-primary' : 'text-text-secondary opacity-60'}`}>Questions</span>
                  </button>
                )
              })}
            </div>
            <p className="text-[12px] font-medium text-text-secondary opacity-70 mt-2">* You can only select up to the number of available questions in the database.</p>
          </Stack>

          <div className="p-6 rounded-[20px] bg-hover-bg/30 border border-border-subtle space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full bg-primary/10 text-primary">
                <Timer size={16} />
              </div>
              <div className="flex flex-col pt-1">
                <span className="text-[14px] font-bold text-text-primary">Strict Timing</span>
                <span className="text-[12px] text-text-secondary">1 minute allocated per question. Timer runs automatically.</span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full bg-success/10 text-success">
                <Target size={16} />
              </div>
              <div className="flex flex-col pt-1">
                <span className="text-[14px] font-bold text-text-primary">Standard Marking</span>
                <span className="text-[12px] text-text-secondary">Each question carries exactly 1 mark. There is no negative marking.</span>
              </div>
            </div>
          </div>

          <Button 
            fullWidth variant="primary" disabled={isLaunching}
            onClick={onLaunch} className="h-14 rounded-[20px] text-[15px] font-bold shadow-xl shadow-primary/20 mt-4"
          >
            {isLaunching ? (
              <>Launching... <RefreshCw className="animate-spin" size={18} /></>
            ) : (
              <>Start Session <ChevronRight size={18} /></>
            )}
          </Button>
        </Stack>
      </Card>
    </div>
  )
}


import { useState } from 'react'
import { Button, Card, SegmentedFilter } from '../../common/AntigravityUI'
import { getPromptText, MAX_QUESTIONS } from './types'
import { MessagesSquare, Sparkles, Bot, Notebook, Check, Copy } from 'lucide-react'

const PRESET_COUNTS = [10, 30, 50, 100]

const COUNT_OPTIONS = [
  { id: '10', label: '10 MCQs' },
  { id: '30', label: '30 MCQs' },
  { id: '50', label: '50 MCQs' },
  { id: '100', label: '100 MCQs' },
  { id: 'custom', label: 'Custom' },
]

// Trusted launch surface — each row both re-copies the prompt (so the AI has
// it on the clipboard) and opens the fixed destination URL (no user input;
// the popped window's opener is neutralized in the hook). Only reachable
// after a successful copy.
const AI_MODELS: { id: string; label: string; icon: typeof MessagesSquare }[] = [
  { id: 'chatgpt', label: 'ChatGPT', icon: MessagesSquare },
  { id: 'gemini', label: 'Gemini', icon: Sparkles },
  { id: 'claude', label: 'Claude', icon: Bot },
  { id: 'notebooklm', label: 'NotebookLM', icon: Notebook },
]

interface CreateStepPromptProps {
  targetCount: number
  setTargetCount: (v: number) => void
  customCount: string
  setCustomCount: (v: string) => void
  promptPhase: 'count' | 'copy' | 'launch'
  copied: boolean
  copyError: string | null
  activeAICopy: string | null
  onCopyPrompt: () => void
  onLaunchAI: (model: string) => void
  onPromptPhaseChange: (v: 'count' | 'copy' | 'launch') => void
}

export function CreateStepPrompt({
  targetCount, setTargetCount, customCount, setCustomCount,
  promptPhase, copied, copyError, activeAICopy,
  onCopyPrompt, onLaunchAI, onPromptPhaseChange,

}: CreateStepPromptProps) {
  const isCustom = !PRESET_COUNTS.includes(targetCount)
  const resolvedValue = isCustom ? 'custom' : String(targetCount)
  const finalCount = targetCount === 0 ? parseInt(customCount) || 10 : targetCount
  const [countError, setCountError] = useState<string | null>(null)

  const handleCountChange = (id: string) => {
    if (id === 'custom') {
      setTargetCount(0)
      setCustomCount('')
      setCountError(null)
      onPromptPhaseChange('count')
      return
    }
    setTargetCount(Number(id))
    setCustomCount('')
    setCountError(null)
    onPromptPhaseChange('copy')
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block opacity-60">
            1. Select Question Count
          </label>
          <div className="w-full max-lg:overflow-x-auto scrollbar-hide lg:overflow-x-visible">
            <SegmentedFilter
              ariaLabel="Question count"
              options={COUNT_OPTIONS}
              value={resolvedValue}
              onChange={handleCountChange}
            />
          </div>
          {isCustom && (
            <div className="w-full">
              <input
                type="number"
                min={1}
                max={MAX_QUESTIONS}
                placeholder="Enter custom count"
                value={customCount}
                aria-label="Custom question count"
                aria-invalid={!!countError}
                aria-describedby={countError ? 'custom-count-error' : undefined}
                onChange={e => {
                  setCustomCount(e.target.value)
                  setCountError(null)
                  const val = parseInt(e.target.value)
                  if (val > MAX_QUESTIONS) {
                    // W2: a count above the server cap is never accepted — the
                    // prompt stays hidden and the target reverts to "not set".
                    setCountError(`Exams are limited to ${MAX_QUESTIONS} questions.`)
                    setTargetCount(0)
                    onPromptPhaseChange('count')
                    return
                  }
                  if (val > 0) {
                    setTargetCount(val)
                    onPromptPhaseChange('copy')
                  }
                }}
                className="w-full bg-hover-bg/50 border-2 rounded-xl px-4 py-3 text-xs font-black transition-interaction duration-fast ease-standard outline-none border-border-subtle/10 focus:border-primary/30"
              />
              {countError && (
                <p id="custom-count-error" role="alert" className="text-xs font-bold text-danger">
                  {countError}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {promptPhase !== 'count' && (
        <Card variant="elevated">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block opacity-60">
              2. Copy Generation Prompt
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={copied ? 'success' : 'soft'}
                  size="sm"
                  onClick={onCopyPrompt}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Prompt Copied!' : 'Copy Prompt to Clipboard'}
                </Button>

              </div>
            </div>

            {copyError && (
              <p role="alert" className="text-xs font-bold text-danger">
                {copyError}
              </p>
            )}
            <div className="max-h-72 overflow-y-auto min-h-0 custom-scrollbar">
              <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-text-primary m-0">
                {getPromptText(finalCount)}
              </p>
            </div>

            {promptPhase === 'launch' && (
              <div className="pt-6 mt-6 border-t border-border-subtle/10 space-y-4">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block opacity-60">
                  3. Launch AI Model
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {AI_MODELS.map(({ id, label, icon: Icon }) => (
                    <Button
                      key={id}
                      variant="soft"
                      onClick={() => onLaunchAI(id)}
                      loading={activeAICopy === id}
                      disabled={activeAICopy !== null}
                      className="h-12"
                    >
                      <Icon className="w-4 h-4" />
                      {activeAICopy === id ? 'Opening…' : label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
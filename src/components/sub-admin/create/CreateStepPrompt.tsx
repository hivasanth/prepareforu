import { Copy, Check } from 'lucide-react'
import { Button } from '../../common/AntigravityUI'

interface CreateStepPromptProps {
  targetCount: number
  setTargetCount: (v: number) => void
  customCount: string
  setCustomCount: (v: string) => void
  promptPhase: 'count' | 'copy' | 'launch'
  copied: boolean
  activeAICopy: string | null
  onCopyPrompt: () => void
  onLaunchAI: () => void
  onPromptPhaseChange: (v: 'count' | 'copy' | 'launch') => void
  getTypo: (element: string) => string
}

export function CreateStepPrompt({
  targetCount, setTargetCount, customCount, setCustomCount,
  promptPhase, copied, activeAICopy,
  onCopyPrompt, onLaunchAI, onPromptPhaseChange, getTypo
}: CreateStepPromptProps) {
  return (
    <div className="space-y-6">
      <div className="bg-card-bg border border-border-subtle/20 rounded-2xl p-5">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block opacity-60">
            1. Select Question Count
          </label>
          <div className="flex flex-wrap gap-3">
            {[10, 30, 50, 100].map(c => (
              <button
                key={c}
                onClick={() => {
                  setTargetCount(c)
                  setCustomCount('')
                  onPromptPhaseChange('copy')
                }}
                className={`px-6 py-3 rounded-xl font-black transition-all ${
                  targetCount === c && promptPhase !== 'count'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-hover-bg/50 text-text-secondary border-2 border-border-subtle/10'
                }`}
                style={{ fontSize: getTypo('stepLabel') }}
              >
                {c} MCQs
              </button>
            ))}
            <div className="relative flex-1 min-w-[120px]">
              <input
                type="number"
                placeholder="Custom"
                value={customCount}
                aria-label="Custom question count"
                onChange={e => {
                  setCustomCount(e.target.value)
                  const val = parseInt(e.target.value)
                  if (val > 0) {
                    setTargetCount(val)
                    onPromptPhaseChange('copy')
                  }
                }}
                className={`w-full bg-hover-bg/50 border-2 rounded-xl px-4 py-3 text-xs font-black transition-all outline-none ${
                  targetCount === 0 && promptPhase !== 'count' ? 'border-primary ring-2 ring-primary/10' : 'border-border-subtle/10 focus:border-primary/30'
                }`}
              />
            </div>
          </div>
        </div>

        {promptPhase !== 'count' && (
          <div className="pt-6 mt-6 border-t border-border-subtle/10 space-y-4">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block opacity-60">
              2. Copy Generation Prompt
            </label>
            <Button
              onClick={onCopyPrompt}
              className={`w-full h-14 shadow-lg transition-all ${copied ? 'bg-green-500 shadow-green-500/20' : 'shadow-primary/20'}`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Prompt Copied!' : 'Copy Prompt to Clipboard'}
            </Button>
          </div>
        )}

        {promptPhase === 'launch' && (
          <div className="pt-6 mt-6 border-t border-border-subtle/10 space-y-4">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest block opacity-60">
              3. Launch AI Model
            </label>
            <Button
              onClick={onLaunchAI}
              loading={!!activeAICopy}
              className="w-full h-14 shadow-lg shadow-primary/20"
            >
              {activeAICopy ? 'Opening AI...' : 'Open ChatGPT'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

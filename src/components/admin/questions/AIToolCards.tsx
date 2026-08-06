import { memo } from 'react'
import { Bot, Notebook, Sparkles } from 'lucide-react'
import { Card, IconBadge, H3 } from '../../common/AntigravityUI'

interface AIToolCardsProps {
  setActiveTab: (tab: 'generate' | 'instructions' | 'json' | 'preview') => void
}

const AI_TOOLS = [
  {
    name: 'NotebookLM',
    description: 'Upload PDFs/links and generate questions with Gemini AI',
    bgColor: 'bg-primary',
    icon: Notebook,
    url: 'https://notebooklm.google.com',
  },
  {
    name: 'Claude AI',
    description: 'Advanced prompt-based question generation',
    bgColor: 'bg-secondary',
    icon: Bot,
    url: 'https://claude.ai',
  },
  {
    name: 'ChatGPT',
    description: 'Multi-format question generation from documents',
    bgColor: 'bg-success',
    icon: Sparkles,
    url: 'https://chatgpt.com',
  },
]

export const AIToolCards = memo(function AIToolCards({ setActiveTab }: AIToolCardsProps) {
  return (
    <div className="space-y-6 animate-in">
      <Card variant="subtle" padding={24} className="rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <IconBadge
            icon={Bot}
            size="xl"
            status="secondary"
            className="rounded-2xl"
          />
          <div>
            <H3 className="font-bold uppercase tracking-wide">AI Question Generation</H3>
            <p className="text-[10px] font-medium tracking-wider text-text-secondary">Use external AI tools to generate question sets</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {AI_TOOLS.map(tool => (
            <button
              key={tool.name}
              onClick={() => {
                window.open(tool.url, '_blank')
                setActiveTab('json')
              }}
              className={`${tool.bgColor} group relative overflow-hidden p-5 rounded-2xl text-left text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
            >
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/5 group-hover:scale-150 transition-transform duration-700" />
              <tool.icon className="w-8 h-8 mb-3 opacity-90" />
              <h4 className="font-bold text-sm uppercase tracking-wider mb-1">{tool.name}</h4>
              <p className="text-[10px] opacity-80 leading-relaxed font-medium">{tool.description}</p>
              <div className="mt-4 text-[9px] font-black uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity">
                Open Tool →
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
})

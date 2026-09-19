import { memo, useState } from 'react'
import { Bot, Notebook, Sparkles, MessagesSquare, Check, Copy } from 'lucide-react'
import { Card, H3, Button } from '../../common/AntigravityUI'
import { BUTTON_HOVER, FOCUS_RING } from '../../common/AntigravityMotion'
import { composeBulkUploadPrompt, type TopicIdentity } from '../../../lib/prompts/promptComposer'

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

export const AIToolCards = memo(({ topicPrompt, topicIdentity }: { topicPrompt: string; topicIdentity: TopicIdentity | null }) => {
  const [copied, setCopied] = useState(false)

  const handleCopyPrompt = () => {
    // DYNAMIC OUTPUT CONTRACT: the Generate-tab shortcut copies the SAME
    // composed topic prompt as the Instructions tab (fixes the historical
    // contract mismatch where it copied a different, sub-admin prompt).
    navigator.clipboard.writeText(composeBulkUploadPrompt(topicPrompt, topicIdentity).text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <H3 className="flex items-center gap-2">
          <MessagesSquare className="w-5 h-5" />
          AI Generation Tools
        </H3>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopyPrompt}
          className="gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy System Prompt'}
        </Button>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {AI_TOOLS.map(tool => (
            <button
              key={tool.name}
              onClick={() => {
                window.open(tool.url, '_blank')
              }}
              className={`${tool.bgColor} group relative overflow-hidden p-5 rounded-2xl text-left text-white ${BUTTON_HOVER} active:brightness-95 shadow-lg ${FOCUS_RING}`}
            >
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
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
});


import { memo } from 'react'
import { Sparkles, Plus, CheckCircle2, Copy, Check, Edit3, Trash2 } from 'lucide-react'
import { Button, IconButton, IconBadge, Card } from '../../common/AntigravityUI'
import type { PromptTemplate } from './useBulkUpload'

interface InstructionsTabProps {
  promptBlocks: PromptTemplate[]
  subjectName: string
  localCopied: boolean
  copiedPromptId: string | null
  onCopy: (text?: string, id?: string) => void
  onCreateNew: () => void
  onEdit: (block: PromptTemplate) => void
  onDelete: (id: string) => void
}

export const InstructionsTab = memo(function InstructionsTab({
  promptBlocks, subjectName, localCopied, copiedPromptId, onCopy, onCreateNew, onEdit, onDelete
}: InstructionsTabProps) {
  return (
    <div className="space-y-6 animate-in">
      <Card variant="subtle" padding={24} className="!bg-primary/5 !border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <IconBadge
            icon={Sparkles}
            size="xl"
            className="bg-primary/20 text-primary"
            darkClassName="rounded-2xl bg-primary/20 text-primary"
          />
          <div>
            <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">AI Prompt Builder</h4>
            <p className="text-xs text-text-secondary font-bold">Copy instructions for NotebookLM / ChatGPT</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Active Template</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={onCreateNew}
            >
              <Plus className="w-3 h-3" />
              Create New
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card variant="premium-neutral" padding={16} className="group relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-tighter">System Default</span>
                <CheckCircle2 className="w-3 h-3 text-success" />
              </div>
              <p className="text-[11px] font-bold text-text-primary mb-4 line-clamp-2">
                {subjectName === "History and Culture" ? "Advanced History MCQs (60 Qs)" : "Generic MCQ Extraction"}
              </p>
              <Button
                variant={localCopied ? 'success' : 'soft'}
                size="sm"
                fullWidth
                onClick={() => onCopy()}
              >
                {localCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {localCopied ? 'Copied!' : 'Copy Instructions'}
              </Button>
            </Card>

            {promptBlocks.map(block => (
              <Card variant="premium-neutral" padding={16} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-secondary uppercase tracking-tighter">{block.topic_name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconButton
                      variant="ghost"
                      onClick={() => onEdit(block)}
                      aria-label="Edit prompt template"
                    >
                      <Edit3 className="w-3 h-3" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      onClick={() => block.id && onDelete(block.id)}
                      aria-label="Delete prompt template"
                    >
                      <Trash2 className="w-3 h-3" />
                    </IconButton>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-text-primary mb-4 line-clamp-2">{block.prompt_text}</p>
                <Button
                  variant={copiedPromptId === block.id ? 'success' : 'soft'}
                  size="sm"
                  fullWidth
                  onClick={() => onCopy(block.prompt_text, block.id)}
                >
                  {copiedPromptId === block.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedPromptId === block.id ? 'Copied!' : 'Copy Template'}
              </Button>
            </Card>
          ))}
        </div>
        </div>
      </Card>
    </div>
  )
})

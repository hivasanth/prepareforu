import { Sparkles, Plus, CheckCircle2, Copy, Check, Edit3, Trash2 } from 'lucide-react'
import { Button, IconButton, IconBadge } from '../../common/AntigravityUI'
import type { PromptTemplate } from '../../../hooks/useBulkUpload'

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

export function InstructionsTab({
  promptBlocks, subjectName, localCopied, copiedPromptId, onCopy, onCreateNew, onEdit, onDelete
}: InstructionsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl">
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
              onClick={onCreateNew}
              className="flex items-center gap-1.5 px-3 py-1 bg-card-bg border border-border-subtle rounded-lg text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all !h-auto !shadow-none"
            >
              <Plus className="w-3 h-3" />
              Create New
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-card-bg border border-border-subtle p-4 rounded-2xl group hover:border-primary/30 transition-all relative shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-tighter">System Default</span>
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              </div>
              <p className="text-[11px] font-bold text-text-primary mb-4 line-clamp-2">
                {subjectName === "History and Culture" ? "Advanced History MCQs (60 Qs)" : "Generic MCQ Extraction"}
              </p>
              <Button
                onClick={() => onCopy()}
                className={`w-full py-2 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black transition-all !h-auto !shadow-none hover:!scale-100 ${localCopied ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary border-2 border-primary/30 hover:!bg-primary/20 hover:!text-primary hover:!border-primary/30'}`}
                whileHover={{ scale: 1 }}
                whileTap={{ scale: 0.98 }}
              >
                {localCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {localCopied ? 'Copied!' : 'Copy Instructions'}
              </Button>
            </div>

            {promptBlocks.map(block => (
              <div key={block.id} className="bg-card-bg border border-border-subtle p-4 rounded-2xl group hover:border-secondary/30 transition-all shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-secondary uppercase tracking-tighter">{block.topic_name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconButton
                      onClick={() => onEdit(block)}
                      aria-label="Edit prompt template"
                      className="!bg-transparent !text-text-secondary hover:!bg-transparent hover:!text-text-secondary"
                      whileHover={{ scale: 1 }}
                    >
                      <Edit3 className="w-3 h-3" />
                    </IconButton>
                    <IconButton
                      onClick={() => block.id && onDelete(block.id)}
                      aria-label="Delete prompt template"
                      className="!bg-transparent !text-text-secondary hover:!bg-transparent hover:!text-text-secondary"
                      whileHover={{ scale: 1 }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </IconButton>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-text-primary mb-4 line-clamp-2">{block.prompt_text}</p>
                <Button
                  onClick={() => onCopy(block.prompt_text, block.id)}
                  className={`w-full py-2 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black transition-all !h-auto !shadow-none hover:!scale-100 ${copiedPromptId === block.id ? 'bg-green-500 text-white' : 'bg-secondary/20 text-secondary border-2 border-secondary/30 hover:!bg-secondary/20 hover:!text-secondary hover:!border-secondary/30'}`}
                  whileHover={{ scale: 1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {copiedPromptId === block.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedPromptId === block.id ? 'Copied!' : 'Copy Template'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import { memo } from 'react'
import { PenSquare, Trash2, Check, Copy } from 'lucide-react'
import { Button, IconButton, Card } from '../../common/AntigravityUI'
import { composeBulkUploadPrompt, type TopicIdentity } from '../../../lib/prompts/promptComposer'
import type { PromptTemplate } from './useBulkUpload'

interface InstructionsTabProps {
  promptBlocks: PromptTemplate[]
  /** Built-in extraction prompt used only when no stored prompt exists yet. */
  fallbackPrompt: string
  /** Live topic identity (exam_topics bytes) injected into the display/copy. */
  topicIdentity: TopicIdentity | null
  localCopied: boolean
  copiedPromptId: string | null
  onCopy: (text?: string, id?: string) => void
  onEdit: (block: PromptTemplate) => void
  onDelete: (id: string) => void
}

/* ONE elevated prompt surface: actions on top, prompt in a fixed-height
   internally-scrollable region. The active record is the default-flagged
   stored prompt (first record as fallback); its exact copy/edit/delete path
   is preserved. With no stored record the built-in fallback prompt is shown.
   The retired separate default-card presentation is gone, not its data. */
export const InstructionsTab = memo(function InstructionsTab({
  promptBlocks, fallbackPrompt, topicIdentity, localCopied, copiedPromptId, onCopy, onEdit, onDelete
}: InstructionsTabProps) {
  const activeBlock = promptBlocks.find(b => b.is_default) ?? promptBlocks[0] ?? null
  // DYNAMIC OUTPUT CONTRACT: the displayed instructions = topic content + the
  // live canonical contract + the topic identity. The copy action composes the
  // identical text.
  const promptText = composeBulkUploadPrompt(activeBlock ? activeBlock.prompt_text : fallbackPrompt, topicIdentity).text
  const isCopied = activeBlock ? copiedPromptId === activeBlock.id : localCopied

  return (
    <div className="animate-in">
      <Card variant="elevated" className="min-w-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-border-subtle/40">

            <div className="flex items-center gap-2 ml-auto">
              {activeBlock && (
                <>
                  <IconButton
                    type="button"
                    variant="action"
                    intent="edit"
                    size="sm"
                    focusRing
                    onClick={() => onEdit(activeBlock)}
                    aria-label="Edit prompt"
                  >
                    <PenSquare className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    type="button"
                    variant="action"
                    intent="delete"
                    size="sm"
                    focusRing
                    onClick={() => activeBlock.id && onDelete(activeBlock.id)}
                    aria-label="Delete prompt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </>
              )}
              <Button
                variant={isCopied ? 'success' : 'soft'}
                size="sm"
                onClick={() => activeBlock ? onCopy(activeBlock.prompt_text, activeBlock.id) : onCopy()}
              >
                {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {isCopied ? 'Copied!' : 'Copy Template'}
              </Button>
            </div>
          </div>


          <div className="h-[320px] md:h-[400px] lg:h-[460px] overflow-y-auto min-h-0">
            <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-text-primary m-0">
              {promptText}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
})

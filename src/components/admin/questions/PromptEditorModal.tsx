import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import { Button, Input, Label, useTheme } from '../../common/AntigravityUI'
import type { PromptTemplate } from './BulkUploadPanel'

interface PromptEditorModalProps {
  isOpen: boolean
  editingPrompt: PromptTemplate | null
  isSaving: boolean
  onSave: (prompt: PromptTemplate) => Promise<void>
  onDelete: (id: string) => void
  onClose: () => void
}

export function PromptEditorModal({ isOpen, editingPrompt, isSaving, onSave, onDelete, onClose }: PromptEditorModalProps) {
  const { isDark } = useTheme()
  const [topicName, setTopicName] = useState('')
  const [promptText, setPromptText] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    if (editingPrompt) {
      setTopicName(editingPrompt.topic_name)
      setPromptText(editingPrompt.prompt_text)
      setIsDefault(editingPrompt.is_default)
    }
  }, [editingPrompt])

  if (!isOpen || !editingPrompt) return null

  const handleSave = async () => {
    await onSave({
      ...editingPrompt,
      topic_name: topicName,
      prompt_text: promptText,
      is_default: isDefault,
    })
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] p-6 md:p-8 ${
          !isDark ? 'bg-[#FDF5E2]/98 border-2 border-[#B07A14]/40' : 'bg-card-bg border border-border-subtle/80 shadow-2xl'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-sm font-black uppercase tracking-widest ${!isDark ? 'font-cinzel text-[#3D1F08]' : 'text-text-primary'}`}>Prompt Template Editor</h3>
          {editingPrompt.id && (
            <button onClick={() => onDelete(editingPrompt.id!)} aria-label="Delete prompt" className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={onClose} aria-label="Close editor" className={`p-2 rounded-full hover:bg-hover-bg/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${!isDark ? 'text-primary' : 'text-text-secondary'}`}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Topic / Name</Label>
            <Input
              placeholder="e.g. Indian History - Modern India"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Prompt Instructions</Label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={16}
              className="w-full p-4 rounded-2xl border font-mono text-xs leading-relaxed resize-vertical focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all bg-card-bg text-text-primary border-border-subtle"
              placeholder="Paste your structured prompt here..."
              spellCheck={false}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary"
            />
            <span className={`text-xs font-bold uppercase tracking-wider ${!isDark ? 'text-[#3D1F08]' : 'text-text-primary'}`}>
              Set as subject default
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border-subtle/30">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={isSaving}>Save Template</Button>
        </div>
      </div>
    </div>
  )
}

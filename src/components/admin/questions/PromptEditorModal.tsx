import { useState, useEffect, useRef } from 'react'
import { Trash2, AlertCircle } from 'lucide-react'
import { Button, IconButton, Input, TextArea, Label, Checkbox, Alert } from '../../common/AntigravityUI'
import { AdminModal } from '../../common/AdminModal'
import { promptTemplateSchema } from '../../../validations/adminSchemas'
import type { PromptTemplate } from './BulkUploadPanel'

interface PromptEditorModalProps {
  isOpen: boolean
  editingPrompt: PromptTemplate | null
  isSaving: boolean
  error: string | null
  onSave: (prompt: PromptTemplate) => Promise<void>
  onDelete: (id: string) => void
  onClose: () => void
}

type PromptFieldErrors = Partial<Record<'topic_name' | 'prompt_text', string>>

export function PromptEditorModal({ isOpen, editingPrompt, isSaving, error, onSave, onDelete, onClose }: PromptEditorModalProps) {
  const [topicName, setTopicName] = useState('')
  const [promptText, setPromptText] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<PromptFieldErrors>({})
  const submittedRef = useRef(false)

  useEffect(() => {
    if (editingPrompt) {
      setTopicName(editingPrompt.topic_name)
      setPromptText(editingPrompt.prompt_text)
      setIsDefault(editingPrompt.is_default)
    }
    setFieldErrors({})
    submittedRef.current = false
  }, [editingPrompt])

  if (!isOpen || !editingPrompt) return null

  const runValidation = () => {
    const result = promptTemplateSchema.safeParse({ topic_name: topicName, prompt_text: promptText })
    const nextFieldErrors: PromptFieldErrors = {}
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof PromptFieldErrors | undefined
        if (field) nextFieldErrors[field] = issue.message
      })
    }
    return { result, fieldErrors: nextFieldErrors }
  }

  const handleFieldBlur = (field: keyof PromptFieldErrors) => {
    if (!submittedRef.current) return
    const { fieldErrors } = runValidation()
    setFieldErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
  }

  const handleSave = async () => {
    submittedRef.current = true
    const { result, fieldErrors } = runValidation()
    setFieldErrors(fieldErrors)
    if (!result.success) return

    await onSave({
      ...editingPrompt,
      topic_name: topicName,
      prompt_text: promptText,
      is_default: isDefault,
    })
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Prompt Template Editor"
      titleClassName="uppercase tracking-wide"
      headerActions={editingPrompt.id ? (
        <IconButton variant="danger" size="sm" onClick={() => onDelete(editingPrompt.id!)} aria-label="Delete prompt">
          <Trash2 size={16} />
        </IconButton>
      ) : undefined}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={isSaving}>Save Template</Button>
        </>
      )}
      maxWidth="sm:max-w-2xl"
    >
      <div className="space-y-5">
        {error && (
          <Alert variant="error" icon={AlertCircle} title="Unable to save prompt">
            {error}
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="prompt-topic-name">Topic / Name</Label>
          <Input
            id="prompt-topic-name"
            placeholder="e.g. Indian History - Modern India"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            onBlur={() => handleFieldBlur('topic_name')}
            aria-invalid={!!fieldErrors.topic_name}
            aria-describedby={fieldErrors.topic_name ? 'prompt-topic-name-error' : undefined}
          />
          {fieldErrors.topic_name && (
            <span id="prompt-topic-name-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">{fieldErrors.topic_name}</span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt-text">Prompt Instructions</Label>
          <TextArea
            id="prompt-text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onBlur={() => handleFieldBlur('prompt_text')}
            aria-invalid={!!fieldErrors.prompt_text}
            aria-describedby={fieldErrors.prompt_text ? 'prompt-text-error' : undefined}
            rows={16}
            className="w-full font-mono text-xs leading-relaxed resize-vertical"
            placeholder="Paste your structured prompt here..."
            spellCheck={false}
          />
          {fieldErrors.prompt_text && (
            <span id="prompt-text-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">{fieldErrors.prompt_text}</span>
          )}
        </div>

        <Checkbox
          checked={isDefault}
          onChange={setIsDefault}
          label="Set as subject default"
        />
      </div>
    </AdminModal>
  )
}

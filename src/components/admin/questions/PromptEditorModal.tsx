import { useState } from 'react'
import { Trash2, AlertCircle } from 'lucide-react'
import { Button, IconButton, TextArea, Label, Checkbox, Alert } from '../../common/AntigravityUI'
import { PremiumSelect } from '../../common/PremiumSelect'
import { AdminModal } from '../../common/AdminModal'
import { promptTemplateSchema } from '../../../validations/adminSchemas'
import { canonicalizePromptTopics } from '../../../lib/utils/promptTopicCanonicalizer'
import { ensureDynamicContractMarker } from '../../../lib/prompts/promptComposer'
import type { TopicItem } from '../../../services/topicTestService'
import type { PromptTemplate } from './BulkUploadPanel'

interface PromptEditorModalProps {
  isOpen: boolean
  editingPrompt: PromptTemplate | null
  topics: TopicItem[]
  isSaving: boolean
  error: string | null
  onSave: (prompt: PromptTemplate) => Promise<void>
  onDelete: (id: string) => void
  onClose: () => void
}

type PromptFieldErrors = Partial<Record<'topic_name' | 'prompt_text', string>>

export function PromptEditorModal({ isOpen, editingPrompt, topics, isSaving, error, onSave, onDelete, onClose }: PromptEditorModalProps) {
  // The editable draft seeds from the dialog target and re-seeds whenever that
  // target changes IDENTITY (open edit, open new, save echo, close → null).
  // Per react.dev "adjusting state when a prop changes", the reset runs as a
  // render-phase adjustment guarded by identity — no effect needed.
  const [syncedPrompt, setSyncedPrompt] = useState<PromptTemplate | null>(editingPrompt)
  const [topicId, setTopicId] = useState(() => editingPrompt?.topic_id || '')
  const [promptText, setPromptText] = useState(() => editingPrompt?.prompt_text ?? '')
  const [isDefault, setIsDefault] = useState(() => editingPrompt?.is_default ?? false)
  const [fieldErrors, setFieldErrors] = useState<PromptFieldErrors>({})
  const [submitted, setSubmitted] = useState(false)

  if (syncedPrompt !== editingPrompt) {
    setSyncedPrompt(editingPrompt)
    if (editingPrompt) {
      setTopicId(editingPrompt.topic_id || '')
      setPromptText(editingPrompt.prompt_text)
      setIsDefault(editingPrompt.is_default)
    }
    setFieldErrors({})
    setSubmitted(false)
  }

  if (!isOpen || !editingPrompt) return null

  // Display names come LIVE from exam_topics; the stored topic_name is only a cache.
  const topicOptions = topics.map(t => ({
    id: t.id!,
    name: t.topic_te ? `${t.topic_en} / ${t.topic_te}` : t.topic_en,
  }))
  const selectedTopic = topics.find(t => t.id === topicId)

  // topics is fetched for exactly the current exam/paper/subject; membership
  // in that list IS the segment check. D3: a topic outside it must never save.
  const runValidation = () => {
    const result = promptTemplateSchema.safeParse({
      topic_id: topicId,
      topic_name: selectedTopic?.topic_en ?? '',
      prompt_text: promptText,
    })
    const nextFieldErrors: PromptFieldErrors = {}
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof PromptFieldErrors | undefined
        if (field) nextFieldErrors[field] = issue.message
      })
    }
    if (topicId && !selectedTopic && !nextFieldErrors.topic_name) {
      nextFieldErrors.topic_name =
        'Selected topic does not belong to the selected exam, paper and subject'
    }
    return { result, fieldErrors: nextFieldErrors }
  }

  const handleFieldBlur = (field: keyof PromptFieldErrors) => {
    if (!submitted) return
    const { fieldErrors } = runValidation()
    setFieldErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
  }

  const handleSave = async () => {
    setSubmitted(true)
    const { result, fieldErrors } = runValidation()
    setFieldErrors(fieldErrors)
    if (!result.success || !selectedTopic) return

    // FINAL DATA ARCHITECTURE: the stored prompt must echo the LIVE canonical
    // topic record. Surgical rewrite of only the output-schema example's
    // topic_en/topic_te VALUES — every other byte of the prompt survives.
    const canonicalized = canonicalizePromptTopics(promptText, {
      topic_en: selectedTopic.topic_en,
      topic_te: selectedTopic.topic_te ?? null,
    }).text

    // DYNAMIC OUTPUT CONTRACT: the stored template keeps topic content only
    // (legacy fenced format examples removed) and carries the internal marker
    // exactly once, so the composer injects the LIVE contract at copy time.
    const storageText = ensureDynamicContractMarker(canonicalized)

    await onSave({
      ...editingPrompt,
      topic_id: selectedTopic.id!,
      topic_name: selectedTopic.topic_en,
      prompt_text: storageText,
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
          <Label htmlFor="prompt-topic-name">Topic</Label>
          <PremiumSelect
            value={topicId}
            onChange={(value) => {
              setTopicId(value)
              if (submitted) handleFieldBlur('topic_name')
            }}
            options={topicOptions}
            placeholder={topics.length === 0 ? 'No topics available' : 'Select a topic'}
            disabled={topics.length === 0}
            maxVisible={8}
          />
          <span id="prompt-topic-name-error" aria-live="polite" className="text-xs font-bold text-danger mt-1">
            {fieldErrors.topic_name ? fieldErrors.topic_name : ''}
          </span>
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

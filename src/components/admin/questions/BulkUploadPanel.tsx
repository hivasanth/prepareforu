import React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert } from '../../common/AntigravityUI'
import { AIToolCards } from './AIToolCards'
import { PreviewTab } from './PreviewTab'
import { UploadProgressOverlay } from './UploadProgressOverlay'
import { PromptEditorModal } from './PromptEditorModal'
import { InstructionsTab } from './InstructionsTab'
import { JsonTab } from './JsonTab'

import { useBulkUpload, type PromptTemplate, type ParsedDataItem } from './useBulkUpload'
import { useAuth } from '../../../context/AuthContext'
import { ConfirmModal } from '../../common/SharedComponents'
import type { BulkTabType } from './useBulkUpload'

export type { PromptTemplate }
export type { BulkTabType }

interface BulkUploadPanelProps {
  examId: string
  examLabel?: string
  paperId: string
  paperLabel?: string
  subjectName: string
  /** Scopes prompt retrieval DB-side to one canonical exam_topics.id. */
  topicId?: string | null
  onSuccess: () => void
  onClose: () => void
  activeTab: 'generate' | 'instructions' | 'json' | 'preview'
  setActiveTab: (tab: 'generate' | 'instructions' | 'json' | 'preview') => void
  parsedData: ParsedDataItem[]
  setParsedData: React.Dispatch<React.SetStateAction<ParsedDataItem[]>>
  onIsUploadingChange?: (isUploading: boolean) => void
}

export interface BulkUploadPanelHandle {
  handleUpload: () => Promise<void>
}

export const BulkUploadPanel = React.forwardRef<BulkUploadPanelHandle, BulkUploadPanelProps>(({
  examId, examLabel, paperId, paperLabel, subjectName, topicId, onSuccess, onClose, activeTab, setActiveTab, parsedData, setParsedData, onIsUploadingChange
}, ref) => {
  const { user: authUser } = useAuth()

const {
    jsonText,
    handleJsonChange,
    errors,
    error, setError,
    feedback,
    setFeedback,
    isUploading,
    promptBlocks,
    topics,
    currentPrompt,
    currentTopicIdentity,
    isPromptModalOpen, setIsPromptModalOpen,
    editingPrompt, setEditingPrompt,
    isSavingPrompt,
    localCopied,
    copiedPromptId,
    duplicateCount,
    uploadProgress,
    canPreview,
    topicGuard,
    syncBlockers,
    isDeletingPrompt, setIsDeletingPrompt,
    setPromptIdToDelete,
    setUploadProgress,
    handleOpenPromptModal,
    handleSavePrompt,
    handleDeletePrompt,
    executeDeletePrompt,
    handleCopy,
    handleAnalyze,
    handleSkipRow,
    handleUpload,
  } = useBulkUpload({
    examId, examLabel, paperId, paperLabel, subjectName, topicId, onSuccess, onClose, activeTab, setActiveTab, parsedData, setParsedData, onIsUploadingChange, authUser
  })

  React.useImperativeHandle(ref, () => ({
    handleUpload
  }))

  return (
    <div className="space-y-6">
      {feedback?.type === 'success' && !isPromptModalOpen && (
        <Alert
          variant="success"
          icon={CheckCircle2}
          title="Action complete"
          className="w-full"
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}
      {error && !isPromptModalOpen && (
        <Alert variant="error" icon={AlertCircle} title="Action failed">
          {error}
        </Alert>
      )}
      <div className="min-h-[400px]">
        {activeTab === 'generate' && (
          <AIToolCards topicPrompt={currentPrompt} topicIdentity={currentTopicIdentity} onCopyError={setError} />
        )}

        {activeTab === 'instructions' && (
          <InstructionsTab
            promptBlocks={promptBlocks}
            fallbackPrompt={currentPrompt}
            topicIdentity={currentTopicIdentity}
            localCopied={localCopied}
            copiedPromptId={copiedPromptId}
            onCopy={handleCopy}
            onEdit={handleOpenPromptModal}
            onDelete={handleDeletePrompt}
          />
        )}

        {activeTab === 'json' && (
          <JsonTab
            jsonText={jsonText}
            onJsonChange={handleJsonChange}
            errors={errors}
            isUploading={isUploading}
            onValidate={handleAnalyze}
            onSkipRow={handleSkipRow}
          />
        )}

        {activeTab === 'preview' && (
          <PreviewTab
            parsedData={parsedData}
            setParsedData={setParsedData}
            duplicateCount={duplicateCount}
            canPreview={canPreview}
            topicGuard={topicGuard}
            syncBlockers={syncBlockers}
            isUploading={isUploading}
            onSync={() => { void handleUpload() }}
            examId={examId}
            examLabel={examLabel}
            paperId={paperId}
            paperLabel={paperLabel}
            subjectName={subjectName}
            topicId={topicId}
            topicEnglish={currentTopicIdentity?.topic_en ?? null}
            topicTelugu={currentTopicIdentity?.topic_te ?? null}
          />
        )}
      </div>

      <UploadProgressOverlay
        uploadProgress={uploadProgress}
        errors={errors}
        examLabel={examLabel}
        paperLabel={paperLabel}
        subjectName={subjectName}
        onRetry={React.useCallback(() => setUploadProgress(prev => ({ ...prev, status: 'idle' })), [setUploadProgress])}
      />


      <PromptEditorModal
        isOpen={isPromptModalOpen}
        editingPrompt={editingPrompt}
        topics={topics}
        isSaving={isSavingPrompt}
        error={error}
        onSave={async (prompt) => {
          setEditingPrompt(prompt)
          await handleSavePrompt(prompt)
        }}
        onDelete={handleDeletePrompt}
        onClose={() => { setError(null); setIsPromptModalOpen(false); setEditingPrompt(null) }}
      />

      <ConfirmModal
        open={isDeletingPrompt}
        title="Delete Prompt Template?"
        message="This will permanently remove this AI instruction template. You cannot undo this."
        danger
        onConfirm={executeDeletePrompt}
        onCancel={() => {
          setIsDeletingPrompt(false)
          setPromptIdToDelete(null)
        }}
      />
    </div>
  )
})
BulkUploadPanel.displayName = 'BulkUploadPanel'

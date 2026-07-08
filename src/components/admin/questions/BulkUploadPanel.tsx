import React from 'react'
import { AIToolCards } from './AIToolCards'
import { PreviewTab } from './PreviewTab'
import { UploadProgressOverlay } from './UploadProgressOverlay'
import { PromptEditorModal } from './PromptEditorModal'
import { InstructionsTab } from './InstructionsTab'
import { JsonTab } from './JsonTab'
import { useBulkUpload, type PromptTemplate, type ParsedDataItem } from '../../../hooks/useBulkUpload'
import { useAuth } from '../../../context/AuthContext'
import { ConfirmModal } from '../../common/SharedComponents'
import type { BulkTabType } from '../../../hooks/useBulkUpload'

export type { PromptTemplate }
export type { BulkTabType }

interface BulkUploadPanelProps {
  examId: string
  examLabel?: string
  paperId: string
  paperLabel?: string
  subjectName: string
  onSuccess: () => void
  onClose: () => void
  activeTab: 'generate' | 'instructions' | 'json' | 'preview'
  setActiveTab: (tab: 'generate' | 'instructions' | 'json' | 'preview') => void
  parsedData: ParsedDataItem[]
  setParsedData: React.Dispatch<React.SetStateAction<ParsedDataItem[]>>
  onIsUploadingChange?: (isUploading: boolean) => void
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void
}

export interface BulkUploadPanelHandle {
  handleUpload: () => Promise<void>
}

export const BulkUploadPanel = React.forwardRef<BulkUploadPanelHandle, BulkUploadPanelProps>(({
  examId, examLabel, paperId, paperLabel, subjectName, onSuccess, onClose, activeTab, setActiveTab, parsedData, setParsedData, onIsUploadingChange, showToast
}, ref) => {
  const { user: authUser } = useAuth()

  const {
    jsonText, setJsonText,
    errors,
    isUploading,
    promptBlocks,
    isPromptModalOpen, setIsPromptModalOpen,
    editingPrompt, setEditingPrompt,
    isSavingPrompt,
    localCopied,
    copiedPromptId,
    duplicateCount,
    uploadProgress,
    validationSummary,
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
    examId, examLabel, paperId, paperLabel, subjectName, onSuccess, onClose, activeTab, setActiveTab, parsedData, setParsedData, onIsUploadingChange, showToast, authUser
  })

  React.useImperativeHandle(ref, () => ({
    handleUpload
  }))

  return (
    <div className="space-y-6">
      <div className="min-h-[400px]">
        {activeTab === 'generate' && <AIToolCards setActiveTab={setActiveTab} />}

        {activeTab === 'instructions' && (
          <InstructionsTab
            promptBlocks={promptBlocks}
            subjectName={subjectName}
            localCopied={localCopied}
            copiedPromptId={copiedPromptId}
            onCopy={handleCopy}
            onCreateNew={() => handleOpenPromptModal()}
            onEdit={(block) => handleOpenPromptModal(block)}
            onDelete={handleDeletePrompt}
          />
        )}

        {activeTab === 'json' && (
          <JsonTab
            jsonText={jsonText}
            onJsonChange={setJsonText}
            errors={errors}
            isUploading={isUploading}
            onValidate={handleAnalyze}
            onSkipRow={handleSkipRow}
          />
        )}

        {activeTab === 'preview' && <PreviewTab parsedData={parsedData} validationSummary={validationSummary} duplicateCount={duplicateCount} />}
      </div>

      <UploadProgressOverlay
        uploadProgress={uploadProgress}
        errors={errors}
        examLabel={examLabel}
        paperLabel={paperLabel}
        subjectName={subjectName}
        onRetry={() => setUploadProgress(prev => ({ ...prev, status: 'idle' }))}
      />

      <PromptEditorModal
        isOpen={isPromptModalOpen}
        editingPrompt={editingPrompt}
        isSaving={isSavingPrompt}
        onSave={async (prompt) => {
          setEditingPrompt(prompt)
          await handleSavePrompt()
        }}
        onDelete={handleDeletePrompt}
        onClose={() => { setIsPromptModalOpen(false); setEditingPrompt(null) }}
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

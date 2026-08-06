import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AdminModal } from '../../../common/AdminModal'
import { Badge, Button, Tabs } from '../../../common/AntigravityUI'
import { BulkUploadPanel, type BulkUploadPanelHandle } from '../BulkUploadPanel'
import type { ParsedDataItem } from '../useBulkUpload'

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  examId: string
  examLabel?: string
  paperId: string
  paperLabel?: string
  subjectName: string
  onSuccess: () => void
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void
}

type TabType = 'generate' | 'instructions' | 'json' | 'preview'

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen, onClose, examId, examLabel, paperId, paperLabel, subjectName, onSuccess, showToast
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('instructions')
  const [parsedData, setParsedData] = useState<ParsedDataItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const panelRef = React.useRef<BulkUploadPanelHandle>(null)

  if (!isOpen) return null

  const handleUploadClick = () => {
    if (panelRef.current) {
      panelRef.current.handleUpload()
    }
  }

  const getTabHeader = () => {
    switch (activeTab) {
      case 'instructions':
        return "→ Copy a prompt which are available and then click on Generate tab."
      case 'generate':
        return "→ Click any AI model, paste your documents and the prompt. Copy the output and return here for Paste JSON tab."
      case 'json':
        return "→ Paste the JSON text you copied from the AI model into the box below."
      case 'preview':
        return "→ Check the preview below and click Sync to save the questions to database."
      default:
        return "→ Bulk Ingest"
    }
  }

  const dynamicInstruction = getTabHeader()

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={dynamicInstruction}
      titleClassName="!text-sm sm:!text-base !font-bold !tracking-wide opacity-90"
      headerBadge={(
        <Badge variant="primary" icon={Sparkles}>AI Powered</Badge>
      )}
      subHeader={(
        <div className="mt-6">
          <Tabs
            ariaLabel="Bulk upload steps"
            options={[
              { id: 'instructions', label: '1. Instructions' },
              { id: 'generate', label: '2. Generate' },
              { id: 'json', label: '3. Paste JSON' },
              { id: 'preview', label: '4. Preview & Sync' }
            ]}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as TabType)}
          />
        </div>
      )}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {activeTab === 'instructions' && (
            <Button onClick={() => setActiveTab('generate')}>
              Continue to Generate
            </Button>
          )}
          {activeTab === 'generate' && (
            <Button onClick={() => setActiveTab('json')}>
              Continue to Upload
            </Button>
          )}
          {activeTab === 'json' && (
            <Button variant="secondary" onClick={() => setActiveTab('instructions')}>
              Back to Instructions
            </Button>
          )}
          {activeTab === 'preview' && (() => {
            const itemsToSync = parsedData.filter(item => item.status !== 'success')
            const allSynced = parsedData.length > 0 && itemsToSync.length === 0
            
            return (
              <Button 
                onClick={handleUploadClick}
                disabled={itemsToSync.length === 0 || isUploading}
                loading={isUploading}
                variant={allSynced ? "secondary" : "primary"}
              >
                {isUploading ? 'Syncing...' : 
                 allSynced ? 'All Questions Synced' :
                 `Sync ${itemsToSync.length} Questions`}
              </Button>
            )
          })()}
        </>
      )}
    >
      <BulkUploadPanel
        ref={panelRef}
        examId={examId}
        examLabel={examLabel}
        paperId={paperId}
        paperLabel={paperLabel}
        subjectName={subjectName}
        onSuccess={onSuccess}
        onClose={onClose}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        parsedData={parsedData}
        setParsedData={setParsedData}
        onIsUploadingChange={setIsUploading}
        showToast={showToast}
      />
    </AdminModal>
  )
}

import { AlertCircle, BookMarked, BookOpen, Save, Pencil, Globe, Languages } from 'lucide-react'
import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import {
  PageContainer, Stack, Button, SectionReveal, Tabs, Alert
} from '../../components/common/AntigravityUI'
import { AdminIconWrap } from '../../components/common/AdminIconWrap'
import { ToastContainer } from '../../hooks/useToast'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminModal } from '../../components/common/AdminModal'
import { ConfirmModal, GridSkeleton, EmptyState } from '../../components/common/SharedComponents'
import { TopicsToolbar } from '../../components/admin/topics/TopicsToolbar'
import { TopicMetadataFields } from '../../components/admin/topics/TopicMetadataFields'
import { LangInputPanel } from '../../components/admin/topics/LangInputPanel'
import { TopicListItem } from '../../components/admin/topics/TopicListItem'
import { AdminTopicPreviewRenderer } from '../../components/admin/topics/AdminTopicPreviewRenderer'
import { useAdminTopics } from '../../components/admin/topics/useAdminTopics'

export default function AdminTopics() {
  const {
    toasts, error,
    topics, isLoading, isContextValid,
    selectedExam, selectedPaper, selectedSubject,
    setSelectedExam, setSelectedPaper, setSelectedSubject,
    isModalOpen, editingTopic, isSaving,
    previewTopic, setPreviewTopic,
    topicToDelete,
    activeLang, setActiveLang,
    titleEn, setTitleEn, titleTe, setTitleTe,
    rawEn, setRawEn, rawTe, setRawTe,
    parsedEn, setParsedEn, parsedTe, setParsedTe,
    youtubeUrl, setYoutubeUrl,
    displayOrder, setDisplayOrder,
    isPublished, setIsPublished,
    openAdd, openEdit, closeModal,
    handleCopyAiPrompt,
    handleParseEn, handleParseTe,
    handleSave,
    fieldErrors, handleTopicFieldBlur,
    handleDelete, handleConfirmDelete, cancelDelete,
    handleTogglePublish, handleMove,
  } = useAdminTopics()

  return (
    <PageContainer>
      <ToastContainer toasts={toasts} />
      <Stack gap="lg">
        <SectionReveal className="w-full">
          <AdminSelectionTabs
            selectedExam={selectedExam}       setSelectedExam={setSelectedExam}
            selectedPaper={selectedPaper}     setSelectedPaper={setSelectedPaper}
            selectedSubject={selectedSubject}  setSelectedSubject={setSelectedSubject}
            hideAll={true}
          />
        </SectionReveal>

        {error && (
          <SectionReveal>
            <Alert variant="error" icon={AlertCircle} title="Something went wrong" className="w-full">
              {error}
            </Alert>
          </SectionReveal>
        )}

        {!isContextValid ? (
          <SectionReveal>
            <EmptyState
              icon={<BookMarked size={48} />}
              title="Select Context"
              subtitle="Select an Exam, Paper, and Subject to manage topics."
            />
          </SectionReveal>
        ) : (
          <SectionReveal>
            <TopicsToolbar subjectName={selectedSubject} topicCount={topics.length} onAdd={openAdd} />

            {isLoading ? (
              <GridSkeleton count={5} height={80} columns="grid-cols-1" />
            ) : topics.length === 0 ? (
              <EmptyState
                icon={<AlertCircle size={40} />}
                title="No Topics Yet"
                subtitle="No topics yet for this subject."
                actionLabel="Add First Topic"
                onAction={openAdd}
              />
            ) : (
              <AnimatePresence>
                <div className="space-y-2" aria-live="polite" aria-label="Topics list">
                  {topics.map((topic, idx) => (
                    <TopicListItem
                      key={topic.id} topic={topic} index={idx}
                      onPreview={() => setPreviewTopic(topic)}
                      onEdit={() => openEdit(topic)}
                      onDelete={() => handleDelete(topic)}
                      onTogglePublish={() => handleTogglePublish(topic)}
                      onMoveUp={() => handleMove(idx, 'up')}
                      onMoveDown={() => handleMove(idx, 'down')}
                      isFirst={idx === 0} isLast={idx === topics.length - 1}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </SectionReveal>
        )}
      </Stack>

      {/* Topic Form Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTopic ? 'Edit Topic' : 'Add New Topic'}
        description={`${selectedExam} → ${selectedSubject}`}
        headerBadge={(
          <AdminIconWrap>
            <BookMarked className="w-5 h-5 text-primary" />
          </AdminIconWrap>
        )}
        footer={(
          <>
            <div className="flex items-center gap-3 text-xs text-text-secondary mr-auto">
              {([{ key: 'EN', parsed: parsedEn }, { key: 'TE', parsed: parsedTe }] as const).map(({ key, parsed }) => (
                <span key={key} className={`flex items-center gap-1.5 ${parsed && parsed.length > 0 ? 'text-success' : ''}`}>
                  <span className={`w-2 h-2 rounded-full inline-block ${parsed && parsed.length > 0 ? 'bg-success' : 'bg-text-secondary opacity-30'}`} />
                  {key} {parsed ? `${parsed.length} sections` : 'not parsed'}
                </span>
              ))}
            </div>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={isSaving}>
              <Save size={14} className="mr-1.5" />
              {editingTopic ? 'Save Changes' : 'Create Topic'}
            </Button>
          </>
        )}
      >
        {error && (
          <Alert variant="error" icon={AlertCircle} title="Save failed" className="mb-4">
            {error}
          </Alert>
        )}

        <TopicMetadataFields
          displayOrder={displayOrder}
          onDisplayOrderChange={setDisplayOrder}
          youtubeUrl={youtubeUrl}
          onYoutubeUrlChange={setYoutubeUrl}
          isPublished={isPublished}
          onPublishedChange={setIsPublished}
          fieldErrors={fieldErrors}
          onFieldBlur={handleTopicFieldBlur}
        />

        <div className="mb-5">
          <Tabs
            ariaLabel="Topic language"
            activeId={activeLang}
            onChange={(id) => setActiveLang(id as 'en' | 'te')}
            options={[
              {
                id: 'en', label: 'English', icon: <Globe size={13} />,
                badge: parsedEn && parsedEn.length > 0 ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-success/20 text-success">
                    {parsedEn.length} sec
                  </span>
                ) : undefined,
              },
              {
                id: 'te', label: 'Telugu', icon: <Languages size={13} />,
                badge: parsedTe && parsedTe.length > 0 ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-success/20 text-success">
                    {parsedTe.length} sec
                  </span>
                ) : undefined,
              },
            ]}
          />
        </div>

        <AnimatePresence mode="wait">
          {[activeLang].map(lang => {
            const isEn = lang === 'en'
            return (
              <motion.div key={lang} role="tabpanel"
                initial={{ opacity: 0, x: isEn ? -10 : 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isEn ? 10 : -10 }} transition={{ duration: 0.15 }}>
                <LangInputPanel
                  lang={lang}
                  title={isEn ? titleEn : titleTe}
                  onTitleChange={isEn ? setTitleEn : setTitleTe}
                  rawText={isEn ? rawEn : rawTe}
                  onTextChange={isEn ? t => { setRawEn(t); setParsedEn(null) } : t => { setRawTe(t); setParsedTe(null) }}
                  parsed={isEn ? parsedEn : parsedTe}
                  onParse={isEn ? handleParseEn : handleParseTe}
                  onCopyPrompt={handleCopyAiPrompt}
                  fieldErrors={fieldErrors}
                  onFieldBlur={handleTopicFieldBlur}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </AdminModal>

      {/* Preview Modal */}
      <AdminModal
        isOpen={previewTopic !== null}
        onClose={() => setPreviewTopic(null)}
        title="Preview Topic"
        description={`${selectedExam} → ${selectedSubject}`}
        headerBadge={(
          <AdminIconWrap>
            <BookOpen className="w-5 h-5 text-primary" />
          </AdminIconWrap>
        )}
        footer={(
          <>
            <span className="text-[11px] text-text-hint hidden sm:inline mr-auto">
              Reviewing how this topic appears in the student interface
            </span>
            <Button variant="secondary" onClick={() => setPreviewTopic(null)}>Close Preview</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!previewTopic) return;
                const topic = previewTopic;
                setPreviewTopic(null);
                openEdit(topic);
              }}
            >
              <Pencil size={14} className="mr-1.5" />
              Edit Topic
            </Button>
          </>
        )}
      >
        <AdminTopicPreviewRenderer topic={previewTopic!} />
      </AdminModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={topicToDelete !== null}
        title={`Delete "${topicToDelete?.title_en}"?`}
        message="This will permanently remove this topic and all its content. This cannot be undone."
        danger
        onConfirm={handleConfirmDelete}
        onCancel={cancelDelete}
        confirmLabel="Yes, Delete Permanently"
      />
    </PageContainer>
  )
}

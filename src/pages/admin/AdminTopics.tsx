import { useState, useCallback, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isAdmin } from '../../utils/authUtils'
import {
  Plus,
  BookMarked, BookOpen, Save, Youtube,
  Pencil, AlertCircle, Globe, Languages
} from 'lucide-react'
import { AdminSelectionTabs } from '../../components/admin/shared/AdminSelectionTabs'
import {
  PageContainer, Stack, Button,
  Label, SectionReveal, Switch
} from '../../components/common/AntigravityUI'
import { AdminText } from '../../components/admin/common/AdminText'
import { AdminIconWrap } from '../../components/admin/common/AdminIconWrap'
import { useToast, ToastContainer } from '../../hooks/useToast'
import { useAdminFilters } from '../../hooks/useAdminFilters'
import { GuardLoader } from '../../guards/Guards'
import { motion, AnimatePresence } from 'framer-motion'
import {
  fetchTopicsAdmin, createTopic, updateTopic,
  deleteTopic, toggleTopicPublish, getNextDisplayOrder
} from '../../services/topicsService'
import type { StudyTopic, TopicSection } from '../../types/exam.types'
import { AdminModal } from '../../components/admin/common/AdminModal'
import { ConfirmModal, GridSkeleton, EmptyState } from '../../components/common/SharedComponents'
import { AI_PROMPT_TEMPLATE } from '../../constants/aiPromptTemplate'
import { parseOutlineText, reconstructOutlineText } from '../../utils/parseOutlineText'
import { LangInputPanel } from '../../components/admin/topics/LangInputPanel'
import { TopicListItem } from '../../components/admin/topics/TopicListItem'
import { AdminTopicPreviewRenderer } from '../../components/admin/topics/AdminTopicPreviewRenderer'


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminTopics() {
  const { user, loading: authLoading } = useAuth()
  const { toasts, showSuccess, showError } = useToast()
  const { selectedExam, selectedPaper, selectedSubject, setSelectedExam, setSelectedPaper, setSelectedSubject } = useAdminFilters()

  const [topics, setTopics]                 = useState<StudyTopic[]>([])
  const [isLoading, setIsLoading]           = useState(false)
  const [isModalOpen, setIsModalOpen]       = useState(false)
  const [editingTopic, setEditingTopic]     = useState<StudyTopic | null>(null)
  const [isSaving, setIsSaving]             = useState(false)
  const [previewTopic, setPreviewTopic]     = useState<StudyTopic | null>(null)
  const [topicToDelete, setTopicToDelete]   = useState<StudyTopic | null>(null)

  const handleCopyAiPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE)
    showSuccess('AI Prompt Template copied to clipboard!')
  }

  // Modal state
  const [activeLang, setActiveLang] = useState<'en' | 'te'>('en')

  // Per-language fields
  const [titleEn, setTitleEn]       = useState('')
  const [titleTe, setTitleTe]       = useState('')
  const [rawEn, setRawEn]           = useState('')
  const [rawTe, setRawTe]           = useState('')
  const [parsedEn, setParsedEn]     = useState<TopicSection[] | null>(null)
  const [parsedTe, setParsedTe]     = useState<TopicSection[] | null>(null)

  // Extra fields
  const [youtubeUrl, setYoutubeUrl]   = useState('')
  const [displayOrder, setDisplayOrder] = useState(1)
  const [isPublished, setIsPublished]  = useState(true)

  const isContextValid =
    selectedExam !== 'all' && selectedExam !== 'APPSC_GROUPS' &&
    selectedPaper !== 'all' && selectedSubject !== 'all'

  // ─── Load topics ───────────────────────────────────────────────────────────
  const loadTopics = useCallback(async () => {
    if (!isContextValid) { setTopics([]); return }
    setIsLoading(true)
    try {
      setTopics(await fetchTopicsAdmin(selectedExam, selectedPaper, selectedSubject))
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to load topics')
    } finally {
      setIsLoading(false)
    }
  }, [selectedExam, selectedPaper, selectedSubject, isContextValid])

  useEffect(() => { loadTopics() }, [loadTopics])

  // ─── Open modal ────────────────────────────────────────────────────────────
  const resetForm = (topic?: StudyTopic, nextOrder?: number) => {
    setTitleEn(topic?.title_en ?? '')
    setTitleTe(topic?.title_te ?? '')
    setRawEn(topic?.content_en?.length ? reconstructOutlineText(topic.content_en, 'en') : '')
    setRawTe(topic?.content_te?.length ? reconstructOutlineText(topic.content_te, 'te') : '')
    setParsedEn(topic?.content_en?.length ? topic.content_en : null)
    setParsedTe(topic?.content_te?.length ? topic.content_te : null)
    setYoutubeUrl(topic?.youtube_url ?? '')
    setDisplayOrder(topic?.display_order ?? nextOrder ?? 1)
    setIsPublished(topic?.is_published ?? true)
    setActiveLang('en')
  }

  const openAdd = async () => {
    const nextOrder = await getNextDisplayOrder(selectedExam, selectedPaper, selectedSubject)
    setEditingTopic(null)
    resetForm(undefined, nextOrder)
    setIsModalOpen(true)
  }

  const openEdit = (topic: StudyTopic) => {
    setEditingTopic(topic)
    resetForm(topic)
    setIsModalOpen(true)
  }

  const closeModal = () => { setIsModalOpen(false); setEditingTopic(null) }

  // ─── Parse handlers ────────────────────────────────────────────────────────
  const handleParseEn = () => {
    const result = parseOutlineText(rawEn, 'en')
    setParsedEn(result)
    if (result.length > 0) showSuccess(`Parsed ${result.length} English sections`)
  }

  const handleParseTe = () => {
    const result = parseOutlineText(rawTe, 'te')
    setParsedTe(result)
    if (result.length > 0) showSuccess(`Parsed ${result.length} Telugu sections`)
  }

  // ─── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    let finalParsedEn = parsedEn
    if (rawEn.trim() && (!finalParsedEn || finalParsedEn.length === 0)) {
      finalParsedEn = parseOutlineText(rawEn, 'en')
    }

    let finalParsedTe = parsedTe
    if (rawTe.trim() && (!finalParsedTe || finalParsedTe.length === 0)) {
      finalParsedTe = parseOutlineText(rawTe, 'te')
    }

    if (!titleEn.trim()) return showError('English title is required.')
    if (!finalParsedEn || finalParsedEn.length === 0) return showError('Please add and parse your English content first.')

    setIsSaving(true)
    try {
      const payload = {
        title_en:     titleEn.trim(),
        title_te:     titleTe.trim(),
        summary_en:   '',
        summary_te:   '',
        content_en:   finalParsedEn,
        content_te:   finalParsedTe ?? [],
        youtube_url:  youtubeUrl.trim() || null,
        display_order: displayOrder,
        is_published: isPublished,
      }

      if (editingTopic) {
        const updated = await updateTopic(editingTopic.id, payload, user)
        setTopics(prev => prev.map(t => t.id === updated.id ? updated : t))
        showSuccess('Topic updated!')
      } else {
        if (!user) return showError('Authentication required.')
        const created = await createTopic({
          ...payload,
          exam_id:      selectedExam,
          paper_id:     selectedPaper,
          subject_name: selectedSubject,
          created_by:   user.id,
        }, user)
        setTopics(prev => [...prev, created].sort((a, b) => a.display_order - b.display_order))
        showSuccess('Topic created!')
      }
      closeModal()
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Delete / toggle / reorder ─────────────────────────────────────────────
  const handleDelete = async (topic: StudyTopic) => {
    setTopicToDelete(topic)
  }

  const handleConfirmDelete = async () => {
    if (!topicToDelete) return
    try {
      await deleteTopic(topicToDelete.id, user)
      setTopics(prev => prev.filter(t => t.id !== topicToDelete.id))
      setTopicToDelete(null)
      showSuccess('Topic deleted.')
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Delete failed.')
      setTopicToDelete(null)
    }
  }

  const handleTogglePublish = async (topic: StudyTopic) => {
    const newPublished = !topic.is_published
    const prevTopics = topics
    setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, is_published: newPublished } : t))
    try {
      await toggleTopicPublish(topic.id, newPublished, user)
    } catch (err: unknown) {
      setTopics(prevTopics)
      showError(err instanceof Error ? err.message : 'Failed to update.')
    }
  }

  const handleMove = async (idx: number, dir: 'up' | 'down') => {
    const arr = [...topics]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= arr.length) return
    ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
    const updated = arr.map((t, i) => ({ ...t, display_order: i + 1 }))
    setTopics(updated)
    try {
      await Promise.all(updated.map(t => updateTopic(t.id, { display_order: t.display_order }, user)))
    } catch {
      showError('Failed to save order.'); loadTopics()
    }
  }

  if (authLoading) return <GuardLoader />
  if (!isAdmin(user)) return <Navigate to="/unauthorized" replace />

  return (
    <PageContainer>
      <ToastContainer toasts={toasts} />
      <Stack gap="lg">

        {/* Selection Tabs */}
        <SectionReveal className="w-full">
          <AdminSelectionTabs
            selectedExam={selectedExam}       setSelectedExam={setSelectedExam}
            selectedPaper={selectedPaper}     setSelectedPaper={setSelectedPaper}
            selectedSubject={selectedSubject}  setSelectedSubject={setSelectedSubject}
            hideAll={true}
            className="bg-transparent border-none p-0 w-full"
          />
        </SectionReveal>

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
            <div className="flex items-center justify-between mb-4">
              <div>
                <AdminText as="h2" variant="cinzel" className="font-black text-base uppercase tracking-wider">
                  Topics — {selectedSubject}
                </AdminText>
                <p className="text-xs text-text-secondary mt-0.5">
                  {topics.length} topic{topics.length !== 1 ? 's' : ''} · sorted by number order
                </p>
              </div>
              <Button variant="primary" onClick={openAdd} className="!h-9 !text-xs gap-1.5">
                <Plus size={14} /> Add Topic
              </Button>
            </div>

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

      {/* ─── Topic Form Modal ─────────────────────────────────────────────────── */}
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
        {/* Extra fields row: order + youtube + publish */}
        <div className="flex flex-wrap items-center gap-3 mb-6 pb-5 border-b border-border-subtle/20">
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Topic #</Label>
            <input
              type="number" min={1} value={displayOrder}
              onChange={e => setDisplayOrder(Number(e.target.value))}
              className="w-16 text-sm rounded-xl px-3 py-2 border outline-none bg-hover-bg border-border-subtle text-text-primary"
            />
          </div>

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <Youtube size={14} className="text-text-secondary flex-shrink-0" />
            <input
              type="url"
              placeholder="YouTube link (optional)"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              className="flex-1 text-sm rounded-xl px-3 py-2 border outline-none transition-colors bg-hover-bg border-border-subtle text-text-primary focus:border-primary placeholder-text-secondary"
            />
          </div>

          <Switch label="Visible to students" checked={isPublished} onChange={setIsPublished} />
        </div>

        {/* Language Tabs */}
        <div role="tablist" className="flex gap-1 p-1 rounded-2xl mb-5 bg-hover-bg/40">
          {([{ key: 'en', label: 'English', icon: Globe, parsed: parsedEn },
            { key: 'te', label: 'Telugu', icon: Languages, parsed: parsedTe }] as const).map(({ key, label, icon: Icon, parsed }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeLang === key}
              onClick={() => setActiveLang(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeLang === key
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={13} /> {label}
              {parsed && parsed.length > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                  activeLang === key ? 'bg-white/20' : 'bg-success/20 text-success'
                }`}>
                  {parsed.length} sec
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Language content panels */}
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
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </AdminModal>

      {/* ─── Preview Modal ─────────────────────────────────────────────────── */}
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
            <span className="text-[11px] text-text-secondary hidden sm:inline mr-auto">
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

      {/* ─── Delete Confirmation Modal ───────────────────────────────────────── */}
      <ConfirmModal
        open={topicToDelete !== null}
        title={`Delete "${topicToDelete?.title_en}"?`}
        message="This will permanently remove this topic and all its content. This cannot be undone."
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setTopicToDelete(null)}
        confirmLabel="Yes, Delete Permanently"
      />
    </PageContainer>
  )
}

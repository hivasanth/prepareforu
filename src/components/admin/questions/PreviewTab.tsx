import { memo, useState } from 'react'
import { AlertTriangle, PenSquare, Trash2 } from 'lucide-react'
import { Alert, Button, Card } from '../../common/AntigravityUI'
import { BilingualToggle } from '../../common/BilingualToggle'
import { QuestionCard } from '../../exam/QuestionCard'
import { QuestionVisualizer } from '../../common/QuestionVisualizer'
import { ConfirmModal } from '../../common/SharedComponents'
import { SingleQuestionModal } from './modals/SingleQuestionModal'
import type { Question } from '../../../types/exam.types'
import type { ParsedDataItem, TopicGuardMismatch, SyncRowProblem } from './useBulkUpload'

interface PreviewTabProps {
  parsedData: ParsedDataItem[]
  setParsedData: React.Dispatch<React.SetStateAction<ParsedDataItem[]>>
  duplicateCount: number
  /** Explicit validation gate (§12): preview content renders only after a
   *  successful validation whose context still matches the live workflow. */
  canPreview: boolean
  /** Pre-sync STRICT REJECT guard summary (null = workspace is not
   *  topic-scoped or every pending row already matches the topic bytes). */
  topicGuard?: TopicGuardMismatch | null
  /** Pre-sync block-list: pending rows that would fail the canonical
   *  SingleQuestionSchema (live re-checked inside handleUpload as the final
   *  gate). Empty array = nothing pending or every pending row is valid. */
  syncBlockers: SyncRowProblem[]
  isUploading: boolean
  onSync: () => void
  /** Workflow context — feeds the local (never-DB) single-question editor. */
  examId: string
  examLabel?: string
  paperId: string
  paperLabel?: string
  subjectName: string
  topicId?: string | null
  topicEnglish?: string | null
  topicTelugu?: string | null
}

/* The preserved canonical output contract only admits A/B/C/D as the correct
 * option (BulkQuestionSchema normalizes + enum-validates every row before it
 * reaches Preview). This stays as a defensive fallback: an unrecognized value
 * must NEVER silently mark the wrong option. */
const VALID_CORRECT_OPTIONS = new Set<string>(['A', 'B', 'C', 'D'])

function isCorrectOption(value: string | undefined): value is Question['correct_option'] {
  return value !== undefined && VALID_CORRECT_OPTIONS.has(value)
}

/* Maps a validated row onto the canonical Question data model so the preview
 * renders through the SAME QuestionCard used by Exam View / Review. The
 * exam/paper/subject context is taken from the ACTIVE bulk-upload workspace
 * (the 'all' sentinel means "pick later" — the editor gates on it the same way
 * the add flow does). */
function toPreviewQuestion(item: ParsedDataItem, ctx: { examId: string; paperId: string; subjectName: string }): Question {
  return {
    id: item.id,
    exam_id: ctx.examId !== 'all' ? ctx.examId : '',
    paper_id: ctx.paperId !== 'all' ? ctx.paperId : '',
    subject_name: ctx.subjectName !== 'all' ? ctx.subjectName : '',
    correct_option: item.correct as Question['correct_option'],
    difficulty: item.difficulty,
    negative_marks: 0,
    visual: item.visual ?? null,
    question_text_en: item.question,
    question_text_te: item.question_text_te,
    topic_en: item.topic_en,
    topic_te: item.topic_te,
    option_a_en: item.options[0],
    option_b_en: item.options[1],
    option_c_en: item.options[2],
    option_d_en: item.options[3],
    option_a_te: item.option_a_te,
    option_b_te: item.option_b_te,
    option_c_te: item.option_c_te,
    option_d_te: item.option_d_te,
    explanation_en: item.explanation || null,
    explanation_te: item.explanation_te,
  }
}

const GUARD_MESSAGE =
  'Please enter valid JSON questions and click Validate Questions to continue to Preview & Sync.'

export const PreviewTab = memo(function PreviewTab({
  parsedData, setParsedData, duplicateCount, canPreview, topicGuard, syncBlockers, isUploading, onSync,
  examId, examLabel, paperId, paperLabel, subjectName, topicId, topicEnglish, topicTelugu,
}: PreviewTabProps) {
  /* §B — PER-CARD preview language. Each validated row owns its own
   * presentation language (default English), keyed by the stable preview id.
   * Presentation-only: switching NEVER touches parsedData, the JSON, the sync
   * payload, or the database. */
  const [langById, setLangById] = useState<Record<string, 'en' | 'te'>>({})

  /* §B — local-only edit + delete against the UNSYNCED preview workspace.
   * Nothing here ever writes to the database; Sync is the only DB boundary. */
  const [editingItem, setEditingItem] = useState<ParsedDataItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  /* Guarded state (§13): no question cards, no sync — only the concise
   * validation-state message on the canonical Alert surface. */
  if (!canPreview) {
    return (
      <div className="animate-in">
        <Alert variant="warning" icon={AlertTriangle} title="Preview not available yet">
          {GUARD_MESSAGE}
        </Alert>
      </div>
    )
  }

  const itemsToSync = parsedData.filter(item => item.status !== 'success')
  const allSynced = parsedData.length > 0 && itemsToSync.length === 0
  const invalidCorrectCount = parsedData.filter(item => !isCorrectOption(item.correct)).length

  /* Live stats — derived from the CURRENT preview rows so local edits (which
   * can change difficulty after validation) are always reflected in the header. */
  const statTotal = parsedData.length
  const statEasy = parsedData.filter(i => i.difficulty === 'easy').length
  const statMedium = parsedData.filter(i => i.difficulty === 'medium').length
  const statHard = parsedData.filter(i => i.difficulty === 'hard').length

  const deletingItem = deletingId ? parsedData.find(i => i.id === deletingId) ?? null : null

  const openEdit = (item: ParsedDataItem) => {
    setEditingItem(item)
  }

  /* §B — LOCAL-ONLY save: merge the canonical single-question payload back into
   * the preview row. Status returns to 'pending' (the row is unsynced again)
   * and the topic identity bytes are force-preserved. */
  const handleLocalSave = (payload: Partial<Question>) => {
    if (!editingItem) return
    const id = editingItem.id
    setParsedData(prev => prev.map(item => {
      if (item.id !== id) return item
      return {
        ...item,
        status: 'pending' as const,
        question: payload.question_text_en ?? item.question,
        options: [
          payload.option_a_en ?? item.options[0],
          payload.option_b_en ?? item.options[1],
          payload.option_c_en ?? item.options[2],
          payload.option_d_en ?? item.options[3],
        ],
        correct: payload.correct_option ?? item.correct,
        explanation: payload.explanation_en ?? item.explanation,
        difficulty: payload.difficulty ?? item.difficulty,
        question_text_te: payload.question_text_te ?? null,
        option_a_te: payload.option_a_te ?? null,
        option_b_te: payload.option_b_te ?? null,
        option_c_te: payload.option_c_te ?? null,
        option_d_te: payload.option_d_te ?? null,
        explanation_te: payload.explanation_te ?? null,
        // The canonical schema normalized the editor visual — keep the merged
        // row in CanonicalQuestionVisual shape (identity preserved when the
        // editor did not touch the visual).
        visual: (payload.visual ?? item.visual ?? null) as ParsedDataItem['visual'],
        // Topic identity bytes are non-negotiable: the STRICT REJECT service
        // refuses rows with the wrong bytes, so the editor can never drift them.
        topic_en: item.topic_en ?? null,
        topic_te: item.topic_te ?? null,
      }
    }))
    setEditingItem(null)
  }

  const handleConfirmDelete = () => {
    if (!deletingId) return
    setParsedData(prev => prev.filter(i => i.id !== deletingId))
    // Per-card language state dies with its row; remaining cards renumber
    // automatically from their current array positions.
    setLangById(prev => {
      if (!(deletingId in prev)) return prev
      const next = { ...prev }
      delete next[deletingId]
      return next
    })
    setDeletingId(null)
  }

  return (
    <Card variant="elevated" padding={24} className="animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="m-0 text-sm font-black text-text-primary uppercase tracking-widest">
          Preview &amp; Sync
        </h2>
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
          {statTotal} question{statTotal === 1 ? '' : 's'}
        </span>
      </div>

      {/* Defensive §16: a row carrying an invalid correct_option must surface an
       * admin-visible error instead of silently marking the wrong option. */}
      {invalidCorrectCount > 0 && (
        <Alert variant="error" icon={AlertTriangle} title="Invalid correct option detected" className="mb-5">
          <p className="text-xs font-medium text-text-secondary">
            <span className="font-bold text-danger">{invalidCorrectCount}</span>{' '}
            question{invalidCorrectCount > 1 ? 's' : ''} {invalidCorrectCount > 1 ? 'have' : 'has'} an
            unrecognized <span className="font-mono">correct_option</span> value. The correct answer is not
            marked for {invalidCorrectCount > 1 ? 'those rows' : 'that row'}.
          </p>
        </Alert>
      )}

      {statTotal > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Questions', value: statTotal, color: 'text-primary' },
            { label: 'Easy', value: statEasy, color: 'text-success' },
            { label: 'Medium', value: statMedium, color: 'text-warning' },
            { label: 'Hard', value: statHard, color: 'text-danger' },
          ].map(stat => (
            <Card key={stat.label} variant="subtle" padding={16} className="text-center">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">{stat.label}</p>
            </Card>
          ))}
        </div>
      )}

      {duplicateCount > 0 && (
        <Alert variant="warning" icon={AlertTriangle} className="mb-5">
          <p className="text-xs font-medium text-text-secondary">
            <span className="font-bold text-warning">{duplicateCount}</span> duplicate{duplicateCount > 1 ? 's' : ''} auto-filtered out.
          </p>
        </Alert>
      )}

      {/* Pre-sync STRICT REJECT guard warning (§42 / DEF-4): the selected topic
       * is the sole ingestion authority. Rows whose topic_en/topic_te do not
       * byte-match it WILL be rejected at sync — tell the admin the exact
       * expected bytes BEFORE they click Sync, not through a cryptic error. */}
      {topicGuard && (
        <Alert variant="warning" icon={AlertTriangle} title="Questions don't match this topic" className="mb-5">
          <p className="text-xs font-medium text-text-secondary">
            <span className="font-bold text-warning">{topicGuard.mismatched}</span> of {topicGuard.pending} pending
            question{topicGuard.pending === 1 ? '' : 's'} won't sync unless their topic matches this topic exactly.
            Set <span className="font-mono">topic_en</span> ={' '}
            <span className="font-mono font-bold">"{topicGuard.topicEn}"</span>
            {topicGuard.topicTe != null && (
              <> and <span className="font-mono">topic_te</span> ={' '}
                <span className="font-mono font-bold">"{topicGuard.topicTe}"</span></>
            )}, or select a matching topic before syncing.
          </p>
        </Alert>
      )}

      {/* §B — pre-sync block-list: rows an edit could invalidate CANNOT reach
       * the DB. Shown here and enforced inside handleUpload as the final gate. */}
      {syncBlockers.length > 0 && (
        <Alert variant="error" icon={AlertTriangle} title="Sync blocked - fix invalid questions" className="mb-5">
          <ul className="text-xs font-medium text-text-secondary list-disc pl-4 space-y-1">
            {syncBlockers.map(b => (
              <li key={b.id}>{b.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Per-question cards. Each card owns its presentation language + a
       * LOCAL edit/delete toolbar. The canonical Exam View / Review QuestionCard
       * stays read-only (static options, no mark-for-review), with the correct
       * option always visible from the validated `correct_option` and visuals
       * rendering through the shared QuestionVisualizer. */}
      <div className="space-y-4 min-w-0">
        {parsedData.map((item, i) => {
          const correctValid = isCorrectOption(item.correct)
          const cardLang = langById[item.id] ?? 'en'
          return (
            <div
              key={item.id}
              data-question-preview-id={item.id}
              className="rounded-2xl border border-border-subtle/50 bg-bg-surface/40 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Question {i + 1} of {parsedData.length}
                  </span>
                  <BilingualToggle
                    displayLang={cardLang}
                    onChange={lang => setLangById(prev => ({ ...prev, [item.id]: lang }))}
                    minimal
                    shortLabels
                    ariaLabel="Preview question language"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="soft" size="sm" onClick={() => openEdit(item)} aria-label="Edit question">
                    <PenSquare size={14} aria-hidden="true" />
                    <span className="uppercase tracking-widest">Edit</span>
                  </Button>
                  <Button variant="soft" size="sm" onClick={() => setDeletingId(item.id)} aria-label="Delete question">
                    <Trash2 size={14} aria-hidden="true" />
                    <span className="uppercase tracking-widest">Delete</span>
                  </Button>
                </div>
              </div>

              <QuestionCard
                question={toPreviewQuestion(item, { examId, paperId, subjectName })}
                index={i}
                total={parsedData.length}
                displayLang={cardLang}
                onToggleLang={lang => setLangById(prev => ({ ...prev, [item.id]: lang }))}
                selectedAnswer={null}
                readOnly
                showCorrect={correctValid}
                correctOption={correctValid ? item.correct : undefined}
                visualNode={item.visual ? <QuestionVisualizer visual={item.visual} /> : undefined}
              />
            </div>
          )
        })}
      </div>

      {/* Action footer — clearly separated from the card content (§26). Sync is
       * disabled while any pending row is blocked by the final validation gate. */}
      <div className="pt-5 mt-6 border-t border-border-subtle/40 flex justify-end">
        <Button
          onClick={onSync}
          disabled={itemsToSync.length === 0 || isUploading || syncBlockers.length > 0}
          loading={isUploading}
          variant={allSynced ? 'secondary' : 'primary'}
        >
          {isUploading ? 'Syncing...' :
           allSynced ? 'All Questions Synced' :
           `Sync ${itemsToSync.length} Questions`}
        </Button>
      </div>

      {/* §B — LOCAL-ONLY editor: the canonical Add/Edit form, but localOnly
       * never touches the database. onLocalSave merges back into the preview
       * workspace only; Sync remains the sole DB boundary. Mounted only while
       * an edit is in progress (never on a closed modal). */}
      {editingItem !== null && (
        <SingleQuestionModal
          isOpen
          onClose={() => setEditingItem(null)}
          mode="edit"
          question={toPreviewQuestion(editingItem, { examId, paperId, subjectName })}
          examId={examId}
          examLabel={examLabel}
          paperId={paperId}
          paperLabel={paperLabel}
          subjectName={subjectName}
          topicId={topicId ?? undefined}
          topicEnglish={topicEnglish}
          topicTelugu={topicTelugu}
          onSuccess={() => {}}
          localOnly
          onLocalSave={handleLocalSave}
        />
      )}

      <ConfirmModal
        open={deletingId !== null}
        title="Delete Question from Preview?"
        message={deletingItem
          ? `"${deletingItem.question.length > 90 ? deletingItem.question.slice(0, 90) + '…' : deletingItem.question}" will be removed from the preview. It has NOT been synced yet — this only affects the current upload.`
          : 'This question will be removed from the preview. It has NOT been synced yet.'}
        danger
        confirmLabel="Yes, Remove from Preview"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </Card>
  )
})
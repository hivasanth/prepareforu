import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { adminQuestionService } from '../../../services/adminQuestionService'
import type { Question } from '../../../types/exam.types'
import { resolveAdminExamId } from '../../../lib/examUtils'
import { BulkQuestionSchema, SingleQuestionSchema } from '../../../validations/questionSchema'
import { composeBulkUploadPrompt } from '../../../lib/prompts/promptComposer'
import type { CanonicalQuestionVisual } from '../../../validations/questionVisualSchemas'
import { generateQuestionHash } from '../../../utils/hashUtils'
import { copyText } from '../../../utils/clipboardUtils'
import { generateRequestId } from '../../../utils/logger'
import { isAdmin } from '../../../utils/authUtils'
import { logError } from '../../../utils/logger'
import { classifyError } from '../../../utils/errorClassification'
import { fetchTopicsBySubject, type TopicItem } from '../../../services/topicTestService'
import type { UserProfile } from '../../../types/auth.types'

export interface PromptTemplate {
  id?: string
  exam_id: string
  paper_id: string
  subject_name: string
  /** Canonical exam_topics.id — the storage identity for a prompt. */
  topic_id: string
  /** Denormalized display cache resolved from exam_topics; never used as identity. */
  topic_name: string
  prompt_text: string
  is_default: boolean
}

export interface UploadProgress {
  current: number
  total: number
  status: 'idle' | 'running' | 'error' | 'success'
}

export interface ValidationSummary {
  total: number
  easy: number
  medium: number
  hard: number
}

export interface ParsedDataItem {
  id: string
  status: 'pending' | 'success' | 'error'
  question: string
  options: [string, string, string, string]
  correct: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  /** Canonical visual payload as validated by BulkQuestionSchema (QuestionVisualSchema). */
  visual?: CanonicalQuestionVisual | null
  topic_en?: string | null
  topic_te?: string | null
  question_text_te?: string | null
  option_a_te?: string | null
  option_b_te?: string | null
  option_c_te?: string | null
  option_d_te?: string | null
  explanation_te?: string | null
  error?: string
}

export type BulkTabType = 'generate' | 'instructions' | 'json' | 'preview'

/* Explicit validation state machine for the Paste JSON → Preview & Sync gate.
 * Preview content and Sync are ONLY reachable when status === 'valid' AND the
 * captured validated context still matches the live workflow context.
 * Validation is NEVER inferred from jsonText or parsedData presence. */
export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

export interface ValidatedContext {
  examId: string
  paperId: string
  subjectName: string
  topicId: string | null
}

/** Pre-sync topic-guard summary surfaced in Preview: which pending rows the
 *  STRICT REJECT service would refuse and the exact canonical bytes the rows
 *  must carry. Null when the workspace is not topic-scoped or all pending rows
 *  already match. */
export interface TopicGuardMismatch {
  topicEn: string
  topicTe: string | null
  mismatched: number
  pending: number
}

// ONE definition of the segmented bulk-parser workflow. The modal container
// and the topic-specific page both render these exact segments in this order.
export const BULK_WORKFLOW_TABS: { id: BulkTabType; label: string }[] = [
  { id: 'instructions', label: '1. Instructions' },
  { id: 'generate', label: '2. Generate' },
  { id: 'json', label: '3. Paste JSON' },
  { id: 'preview', label: '4. Preview & Sync' },
]

// Authored STRICT REJECT guard messages (adminQuestionService.validateRow) are
// written for the admin and carry the exact expected topic bytes — they MUST
// surface verbatim so a failed sync explains itself. Everything else (raw
// PostgREST/Postgres/transport text) goes through classifyError so the F-7
// canonical copy still protects the UI boundary.
const TOPIC_GUARD_MESSAGE_RE = /^Topic mismatch:|^Telugu topic mismatch:|does not belong to this exam, paper and subject/

function surfaceRowFailure(message?: string | null): string {
  if (message && TOPIC_GUARD_MESSAGE_RE.test(message)) return message
  return message ? classifyError(message).message : 'Upload failed'
}

/** Mirrors adminQuestionService.bulkInsertQuestions validateRow's topic arm —
 *  keep in lock-step with the service contract. */
function isTopicGuardMismatch(
  item: Pick<ParsedDataItem, 'topic_en' | 'topic_te'>,
  topic: Pick<TopicItem, 'topic_en' | 'topic_te'>
): boolean {
  if (!item.topic_en || item.topic_en !== topic.topic_en) return true
  if (topic.topic_te == null) {
    return item.topic_te != null && item.topic_te.trim() !== ''
  }
  return item.topic_te !== topic.topic_te
}

/** A pending preview row that would fail the canonical SingleQuestionSchema at
 *  sync time. Surfaced BEFORE syncing (PreviewTab alert) and enforced as a
 *  final gate INSIDE handleUpload — the DB is never reached with an invalid
 *  row, even if the preview UI was bypassed. */
export interface SyncRowProblem {
  id: string
  message: string
}

interface ValidateSyncContext {
  examId: string
  paperId: string
  subjectName: string
}

/** Builds the exact payload handleUpload would send for a pending row and runs
 *  it through the SAME canonical schema as the single-question editor. This is
 *  the single pre-sync authority for both the PreviewTab block-list and the
 *  in-flight sync gate — rows edited in Preview can never slip past it. */
export function validatePendingRowsForSync(
  rows: ParsedDataItem[],
  ctx: ValidateSyncContext
): SyncRowProblem[] {
  const problems: SyncRowProblem[] = []
  for (const [index, item] of rows.entries()) {
    const payload = {
      exam_id: ctx.examId,
      paper_id: ctx.paperId,
      subject_name: ctx.subjectName,
      question_text_en: item.question,
      option_a_en: item.options[0],
      option_b_en: item.options[1],
      option_c_en: item.options[2],
      option_d_en: item.options[3],
      correct_option: item.correct as 'A' | 'B' | 'C' | 'D',
      explanation_en: item.explanation || '',
      difficulty: item.difficulty,
      negative_marks: 0,
      visual: item.visual,
      topic_en: item.topic_en || null,
      topic_te: item.topic_te || null,
      question_text_te: item.question_text_te || null,
      option_a_te: item.option_a_te || null,
      option_b_te: item.option_b_te || null,
      option_c_te: item.option_c_te || null,
      option_d_te: item.option_d_te || null,
      explanation_te: item.explanation_te || null,
    }
    const result = SingleQuestionSchema.safeParse(payload)
    if (!result.success) {
      const first = result.error.issues[0]
      const field = first?.path.join('.') || 'row'
      problems.push({
        id: item.id,
        message: `Row ${index + 1} (${field}): ${first?.message ?? 'Invalid question'}`,
      })
    }
  }
  return problems
}

export function bulkTabInstruction(tab: BulkTabType): string {
  switch (tab) {
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

interface UseBulkUploadOptions {
  examId: string
  examLabel?: string
  paperId: string
  paperLabel?: string
  subjectName: string
  /** Canonical exam_topics.id when the workspace is scoped to one topic. */
  topicId?: string | null
  onSuccess: () => void
  onClose: () => void
  activeTab: BulkTabType
  setActiveTab: (tab: BulkTabType) => void
  parsedData: ParsedDataItem[]
  setParsedData: React.Dispatch<React.SetStateAction<ParsedDataItem[]>>
  onIsUploadingChange?: (isUploading: boolean) => void
  authUser: UserProfile | null
}

const GENERIC_PROMPT = `Extract all the multiple choice questions from the uploaded documents.
Generate one JSON question object per extracted question using the CANONICAL
OUTPUT CONTRACT appended below.

Rules:
1. Return ONLY a valid JSON array. No markdown ticks, no conversational text.
2. Copy "topic_en" and "topic_te" into every question object — copy EXACTLY from the topic name given in this prompt, and never translate, transliterate, shorten or rephrase them.
3. The appended output contract defines the ONLY accepted JSON keys, visual shapes, and validation rules. Ignore any embedded example above that conflicts with it.`

const HISTORY_PROMPT = `ROLE
You are an expert question paper setter for competitive exams like APPSC, UPSC, and other national-level exams.

Generate high-quality multiple-choice questions (MCQs) strictly based on the given syllabus.

---

SYLLABUS

(A) HISTORY & CULTURE

1. Indus Valley Civilization: Features, Sites, Society, Cultural History, Art and Religion.
   Vedic Age- Mahajanapadas, Religions-Jainism and Buddhism.
   The Maghadas, the Mauryan, Foreign invasions on India and their impact, the Kushans.
   The Sathavahanas, the Sangam Age, the Sungas, the Gupta Empire - their Administration -
   Social, Religious and Economic conditions - Art, Architecture, Literature, Science and Technology.

2. The Kanauj and their Contributions, South Indian Dynasties - The Badami Chalukyas,
   the Eastern Chalukyas, the Rastrakutas, the Kalyani Chalukyas, the Cholas, the Hoyasalas,
   the Yadavas, the Kakatiyas and the Reddis.

3. The Delhi Sultanate, the Vijayanagar Empire and the Mughal Empire, the Bhakti Movement
   and Sufism - Administration, Economy, Society, Religion, Literature, Arts and Architecture.

4. The European Trading companies in India - their struggle for supremacy - with special
   reference to Bengal, Bombay, Madras, Mysore, Andhra and Nizam, Governor-Generals and Viceroys.

5. Indian War of Independence of 1857 - Origin, Nature, Causes, Consequences and Significance
   with special reference to concerned regions, Religious and Social Reform Movements in 19th century,
   India's Freedom Movement, Revolutionaries in India and Abroad.

6. Mahatma Gandhi - his thoughts, principles and philosophy, Important Satyagrahas,
   Role of Sardar Patel and Subhas Chandra Bose, Post-independence consolidation,
   Dr. B.R. Ambedkar and Indian Constitution, Reorganization of States in India.

---

OUTPUT REQUIREMENTS

Generate exactly 60 MCQs.

---

DISTRIBUTION RULE (VERY IMPORTANT)

Generate exactly 10 questions from EACH numbered section (1–6).
Do NOT generate more or fewer questions from any section.

---

QUESTION QUALITY RULES

1. No Repetition

* No duplicate questions
* No repeated concepts
* Each question must test a unique idea

2. Language Quality

* No spelling mistakes
* No grammar mistakes
* Use formal exam-level English

3. Professional Framing

* Questions must resemble official competitive exams
* Avoid casual or vague phrasing

4. Difficulty Distribution

* Easy → 30%
* Medium → 50%
* Hard → 20%

5. Coverage
   Each section must include:

* political history
* administration
* economy
* culture
* religion
* art & architecture

---

QUESTION STRUCTURE

Follow the CANONICAL OUTPUT CONTRACT appended below — it defines the ONLY
accepted JSON keys, visual shapes, and validation rules.

---

OPTION RULES

* Exactly 4 options
* All options must be meaningful and similar in length
* Avoid obvious wrong answers
* Do NOT use "All of the above" or "None of the above"

---

CORRECT ANSWER

* Must be accurate
* Must match A/B/C/D exactly

---

EXPLANATION

* Short and clear
* Explain why the correct answer is correct

---

STRICT RULES

Follow the CANONICAL OUTPUT CONTRACT appended below for the exact JSON output
format and final output rules — including the JSON-only rule (no extra text),
the verbatim topic-copy rule, and the exclusion of any database field.

---

FINAL CHECK BEFORE OUTPUT

✔ Exactly 60 questions
✔ Exactly 10 per section
✔ No duplicates
✔ Correct answers verified
✔ JSON valid
✔ Professional language

---

END OF INSTRUCTIONS`

export interface BulkUploadFeedback {
  type: 'success' | 'error'
  message: string
}

export function useBulkUpload({
  examId, paperId, subjectName, topicId = null, onSuccess, onClose, setActiveTab, parsedData, setParsedData, onIsUploadingChange, authUser
}: UseBulkUploadOptions) {
  const [jsonText, setJsonText] = useState('')
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [feedback, setFeedback] = useState<BulkUploadFeedback | null>(null)

  useEffect(() => {
    onIsUploadingChange?.(isUploading)
  }, [isUploading, onIsUploadingChange])

  const [promptBlocks, setPromptBlocks] = useState<PromptTemplate[]>([])
  const [topics, setTopics] = useState<TopicItem[]>([])
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null)
  const [isSavingPrompt, setIsSavingPrompt] = useState(false)
  const [localCopied, setLocalCopied] = useState(false)
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [duplicateCount, setDuplicateCount] = useState(0)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ current: 0, total: 0, status: 'idle' })
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null)
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle')
  const [validatedContext, setValidatedContext] = useState<ValidatedContext | null>(null)
  const [lastActionTime, setLastActionTime] = useState(0)
  const [isDeletingPrompt, setIsDeletingPrompt] = useState(false)
  const [promptIdToDelete, setPromptIdToDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const ACTION_COOLDOWN = 3000

  const currentPrompt = useMemo(
    () => promptBlocks.find(p => p.is_default)?.prompt_text ||
      (subjectName === 'History and Culture' ? HISTORY_PROMPT : GENERIC_PROMPT),
    [promptBlocks, subjectName]
  )

  // §2/§3/§22 — the LIVE topic identity (exam_topics bytes) the composed prompt
  // injects as TOPIC IDENTITY. Null when the workspace is not topic-scoped or
  // the topic record has not loaded yet.
  const currentTopicIdentity = useMemo(() => {
    if (!topicId) return null
    const topic = topics.find(t => t.id === topicId)
    if (!topic) return null
    return { topic_en: topic.topic_en, topic_te: topic.topic_te ?? null }
  }, [topics, topicId])

  const fetchPrompts = useCallback(async () => {
    if (!examId || !paperId || !subjectName) return
    const result = await adminQuestionService.listPrompts(examId, paperId, subjectName, { user: authUser }, topicId)
    if (result.success) {
      setPromptBlocks(result.data || [])
    }
  }, [examId, paperId, subjectName, topicId, authUser])

  useEffect(() => {
    let cancelled = false
    fetchTopicsBySubject(examId, paperId, subjectName)
      .then(items => {
        if (!cancelled) setTopics((items || []).filter(t => !!t.id))
      })
      .catch(err => {
        logError('bulk.topics_load_failed', { error: err instanceof Error ? err.message : String(err) })
        if (!cancelled) setTopics([])
      })
    return () => { cancelled = true }
  }, [examId, paperId, subjectName])

  const handleOpenPromptModal = useCallback((block: PromptTemplate | null = null) => {
    if (block) {
      setEditingPrompt({ ...block })
    } else {
      // On a topic-scoped page the current topic_id is known — a Create New
      // draft is born inside it (the editor dropdown still allows reassignment).
      setEditingPrompt({
        exam_id: examId,
        paper_id: paperId,
        subject_name: subjectName,
        topic_id: topicId ?? '',
        topic_name: '',
        prompt_text: GENERIC_PROMPT,
        is_default: promptBlocks.length === 0
      })
    }
    setIsPromptModalOpen(true)
  }, [examId, paperId, subjectName, topicId, promptBlocks])

  const handleSavePrompt = async (promptOverride?: PromptTemplate) => {
    if (!isAdmin(authUser)) {
      setError('Unauthorized: Admin privileges required to manage prompts.')
      return
    }
    const currentPrompt = promptOverride ?? editingPrompt
    if (!currentPrompt) return

    setIsSavingPrompt(true)
    setError(null)
    try {
      const payload = {
        ...currentPrompt,
        updated_at: new Date().toISOString()
      }

      const result = await adminQuestionService.upsertPrompt(payload, { user: authUser })
      if (!result.success) throw new Error(result.error?.message || 'Failed to save prompt')

      await fetchPrompts()
      setIsPromptModalOpen(false)
      setEditingPrompt(null)
      setFeedback({ type: 'success', message: 'Prompt saved successfully.' })
    } catch (err: unknown) {
      setError('Save failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsSavingPrompt(false)
    }
  }

  const handleDeletePrompt = useCallback((id: string) => {
    if (!isAdmin(authUser)) {
      setError('Unauthorized: Admin privileges required to manage prompts.')
      return
    }
    setPromptIdToDelete(id)
    setIsDeletingPrompt(true)
  }, [authUser])

  const executeDeletePrompt = useCallback(async () => {
    if (!isAdmin(authUser)) {
      setError('Unauthorized: Admin privileges required to manage prompts.')
      return
    }
    if (!promptIdToDelete) return
    const result = await adminQuestionService.deletePrompt(promptIdToDelete, { user: authUser })
    if (result.success) {
      await fetchPrompts()
      setIsPromptModalOpen(false)
      setError(null)
      setFeedback({ type: 'success', message: 'Prompt deleted successfully.' })
    } else {
      setError('Delete failed: ' + (result.error?.message || result.error))
    }
    setIsDeletingPrompt(false)
    setPromptIdToDelete(null)
  }, [promptIdToDelete, authUser, fetchPrompts])

  const handleCopy = useCallback(async (text?: string, id?: string) => {
    // DYNAMIC OUTPUT CONTRACT: the copied prompt = topic instructions + the
    // LIVE canonical contract + the current topic's TOPIC IDENTITY block
    // (composed exactly once at copy time).
    const content = composeBulkUploadPrompt(text || currentPrompt, currentTopicIdentity).text
    // LAN-ORIGIN FIX: never report "Copied" unless the write actually
    // succeeded. copyText() resolves true only after the Clipboard API (or the
    // legacy fallback) performed the write; failures surface as a real error.
    const ok = await copyText(content)
    if (ok) {
      setError(null)
      if (id) {
        setCopiedPromptId(id)
        setTimeout(() => setCopiedPromptId(null), 2000)
      } else {
        setLocalCopied(true)
        setTimeout(() => setLocalCopied(false), 2000)
      }
      return
    }
    setCopiedPromptId(null)
    setLocalCopied(false)
    setError('Unable to copy content to your clipboard. Please select and copy manually.')
  }, [currentPrompt, currentTopicIdentity, setError])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  /* §17 — validation is bound to the current topic/exam/paper/subject context.
   * Any context change invalidates the previously validated dataset: the stale
   * result can never be previewed or synced against a different topic. */
  useEffect(() => {
    setValidationStatus('idle')
    setValidatedContext(null)
    setParsedData([])
    setValidationSummary(null)
    setDuplicateCount(0)
  }, [examId, paperId, subjectName, topicId, setParsedData])

  /* User edit of the JSON invalidates the previous validation result (§16):
   * a validated dataset whose source has changed must never reach Preview. */
  const handleJsonChange = useCallback((text: string) => {
    setJsonText(text)
    setValidationStatus('idle')
    setValidatedContext(null)
    setParsedData([])
    setValidationSummary(null)
    setDuplicateCount(0)
  }, [setParsedData])

  const processJsonData = useCallback(async (json: string) => {
    setErrors([])
    setParsedData([])
    setDuplicateCount(0)
    setValidationSummary(null)
    setValidationStatus('validating')
    setValidatedContext(null)

    if (!json.trim()) {
      setErrors([{ row: 0, message: 'Please paste your JSON context.' }])
      setValidationStatus('invalid')
      return
    }

    let data: unknown[]
    try {
      data = JSON.parse(json.trim()) as unknown[]
    } catch {
      setErrors([{ row: 0, message: 'Invalid JSON syntax. Please check for trailing commas or unescaped quotes.' }])
      setValidationStatus('invalid')
      return
    }

    if (!Array.isArray(data)) {
      setErrors([{ row: 0, message: 'Root level must be a JSON array: "[ { ... } ]"' }])
      setValidationStatus('invalid')
      return
    }

    const newErrors: { row: number; message: string }[] = []
    const ValidatedQueue: ParsedDataItem[] = []
    const seenHashes = new Set<string>()
    let dupeCount = 0
    let easy = 0, medium = 0, hard = 0

    // LAN-ORIGIN FIX: hashing runs through a Web Crypto → js-sha256 fallback,
    // but ANY unexpected validation failure must still terminate the validation
    // state machine instead of leaving the UI stuck at 'validating'.
    try {
      for (const [index, item] of data.entries()) {
        const rowNum = index + 1

        let result: ReturnType<typeof BulkQuestionSchema.safeParse>
        try {
          result = BulkQuestionSchema.safeParse(item)
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Invalid visual format'
          newErrors.push({ row: rowNum, message: `Row ${rowNum} (visual): ${message}` })
          continue
        }

        if (!result.success) {
          result.error.issues.forEach(issue => {
            const field = issue.path.join('.')
            newErrors.push({
              row: rowNum,
              message: `Row ${rowNum}${field ? ` (${field})` : ''}: ${issue.message}`
            })
          })
          continue
        }

        const validItem = result.data
        const hash = await generateQuestionHash(validItem as unknown as Parameters<typeof generateQuestionHash>[0])

        if (seenHashes.has(hash)) {
          dupeCount++
          continue
        }
        seenHashes.add(hash)

        if (validItem.difficulty === 'easy') easy++
        else if (validItem.difficulty === 'hard') hard++
        else medium++

        ValidatedQueue.push({
          id: hash,
          status: 'pending',
          question: validItem.question_text_en,
          options: [validItem.option_a_en, validItem.option_b_en, validItem.option_c_en, validItem.option_d_en],
          correct: validItem.correct_option,
          explanation: validItem.explanation_en ?? '',
          difficulty: validItem.difficulty,
          visual: validItem.visual,
          topic_en: validItem.topic_en,
          topic_te: validItem.topic_te,
          question_text_te: validItem.question_text_te,
          option_a_te: validItem.option_a_te,
          option_b_te: validItem.option_b_te,
          option_c_te: validItem.option_c_te,
          option_d_te: validItem.option_d_te,
          explanation_te: validItem.explanation_te
        })
      }

      if (newErrors.length > 0) {
        setErrors(newErrors)
        setValidationStatus('invalid')
      } else if (ValidatedQueue.length === 0) {
        setErrors([{ row: 0, message: 'No valid questions found after processing.' }])
        setValidationStatus('invalid')
      } else {
        setDuplicateCount(dupeCount)
        setParsedData(ValidatedQueue)
        setValidationSummary({ total: ValidatedQueue.length, easy, medium, hard })
        /* Explicit success — the ONLY path that marks validation valid and
         * binds the validated dataset to the current workflow context. */
        setValidatedContext({ examId, paperId, subjectName, topicId })
        setValidationStatus('valid')
        setActiveTab('preview')
      }
    } catch (err: unknown) {
      logError('bulk.validation_failed', { error: err instanceof Error ? err.message : String(err) })
      setErrors([{ row: 0, message: err instanceof Error ? err.message : 'Failed to validate questions. Please try again.' }])
      setValidationStatus('invalid')
    }
  }, [setParsedData, setActiveTab, examId, paperId, subjectName, topicId])

  const handleAnalyze = useCallback(async () => {
    await processJsonData(jsonText)
  }, [jsonText, processJsonData])

  const handleSkipRow = useCallback(async (rowNum: number) => {
    if (rowNum <= 0) return
    try {
      const data = JSON.parse(jsonText.trim())
      if (Array.isArray(data)) {
        data.splice(rowNum - 1, 1)
        const updatedJson = JSON.stringify(data, null, 2)
        setJsonText(updatedJson)
        setErrors([])
        await processJsonData(updatedJson)
      }
    } catch (e) {
      setErrors([{ row: 0, message: 'Failed to update JSON: ' + (e instanceof Error ? e.message : 'Unknown error') }])
    }
  }, [jsonText, processJsonData])

  /* F-11: post-success reset timer must not fire after unmount. */
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current)
  }, [])

  const handleUpload = async () => {
    const now = Date.now()
    if (now - lastActionTime < ACTION_COOLDOWN) {
      return
    }
    setLastActionTime(now)

    if (!isAdmin(authUser)) {
      setError('Unauthorized: Admin privileges required to upload questions.')
      return
    }
    // FINAL DATA ARCHITECTURE: sync is topic-scoped. Without the canonical
    // topicId the STRICT REJECT service would refuse every row — fail fast
    // here with an actionable message instead.
    if (!topicId) {
      setError('Select a topic before syncing questions.')
      return
    }
    const itemsToUpload = parsedData.filter(item => item.status !== 'success')
    if (itemsToUpload.length === 0) return

    // FINAL GATE (§B): a pending row that fails the canonical single-question
    // schema (e.g. after an invalid bulk-preview edit) must NEVER reach the
    // DB. Same authority as the PreviewTab block-list, evaluated fresh here so
    // no UI state can be bypassed.
    const blockers = validatePendingRowsForSync(itemsToUpload, { examId, paperId, subjectName })
    if (blockers.length > 0) {
      setError(
        `Sync blocked: ${blockers.length} pending question${blockers.length === 1 ? '' : 's'} ${blockers.length === 1 ? 'is' : 'are'} invalid after validation. Edit or remove ${blockers.length === 1 ? 'it' : 'them'} in Preview, or re-validate the JSON.`
      )
      return
    }

    setIsUploading(true)
    setErrors([])
    setError(null)
    const requestId = generateRequestId('bulk_upload')
    setUploadProgress({ current: 0, total: itemsToUpload.length, status: 'running' })

    const CHUNK_SIZE = 50
    const chunks = []
    for (let i = 0; i < itemsToUpload.length; i += CHUNK_SIZE) {
      chunks.push(itemsToUpload.slice(i, i + CHUNK_SIZE))
    }

    try {
      if (!authUser) {
        throw new Error('Authentication session expired. Please log in again.')
      }

      let completedCount = 0
      for (const [index, chunk] of chunks.entries()) {
        const payload: Partial<Question>[] = chunk.map(item => ({
          exam_id: resolveAdminExamId(examId),
          paper_id: paperId,
          subject_name: subjectName,
          question_text_en: item.question,
          option_a_en: item.options[0],
          option_b_en: item.options[1],
          option_c_en: item.options[2],
          option_d_en: item.options[3],
          explanation_en: item.explanation || '',

          correct_option: item.correct as 'A'|'B'|'C'|'D',
          difficulty: item.difficulty,
          visual: item.visual,
          negative_marks: 0,
          created_by: authUser.id,
          topic_en: item.topic_en || null,
          topic_te: item.topic_te || null,
          question_text_te: item.question_text_te || null,
          option_a_te: item.option_a_te || null,
          option_b_te: item.option_b_te || null,
          option_c_te: item.option_c_te || null,
          option_d_te: item.option_d_te || null,
          explanation_te: item.explanation_te || null
        }))

        // STRICT REJECT: the selected topic is the sole ingestion authority.
        const result = await adminQuestionService.bulkInsertQuestions(payload, { requestId: `${requestId}_c${index}`, user: authUser, topicId })

        if (!result.success && result.data) {
          // DEF-4: partial failure — mark failed rows in parsedData
          const failedIndices = new Set(result.data.failures.map(f => f.index))
          const chunkHashes = chunk.map((c, i) => ({ hash: c.id, failed: failedIndices.has(i) }))

          setParsedData((prev: ParsedDataItem[]) => prev.map((item: ParsedDataItem) => {
            const match = chunkHashes.find(c => c.hash === item.id)
            if (match && match.failed) {
              const failInfo = result.data!.failures.find(f => f.index === chunk.findIndex(c => c.id === item.id))
              // F-7: authored guard reasons surface verbatim; raw DB/transport
              // text is classified into canonical copy before display.
              return { ...item, status: 'error' as const, error: surfaceRowFailure(failInfo?.error) }
            }
            return match ? { ...item, status: 'success' as const } : item
          }))

          // If ALL rows in chunk failed, throw
          if (result.data.failed === chunk.length) {
            logError('bulk.chunk_failed', { requestId: `${requestId}_c${index}`, message: result.error?.message || 'All rows failed' })
            const guardReason = result.data.failures.map(f => f.error).find(e => TOPIC_GUARD_MESSAGE_RE.test(e ?? ''))
            throw new Error(`Chunk ${index + 1} failed: ${guardReason ?? classifyError(result.error ?? 'All rows failed').message}`)
          }
        } else if (!result.success) {
          logError('bulk.chunk_failed', { requestId: `${requestId}_c${index}`, message: result.error?.message || 'Bulk upload failed' })
          throw new Error(`Chunk ${index + 1} failed: ${classifyError(result.error ?? 'Bulk upload failed').message}`)
        } else {
          // DEF-4: all succeeded — mark all as success
          const chunkHashes = chunk.map(c => c.id)
          setParsedData((prev: ParsedDataItem[]) => prev.map((item: ParsedDataItem) =>
            chunkHashes.includes(item.id) ? { ...item, status: 'success' as const } : item
          ))
        }

        completedCount += chunk.length
        setUploadProgress(prev => ({ ...prev, current: completedCount }))
      }

      setUploadProgress(prev => ({ ...prev, status: 'success', current: prev.total }))

      successTimerRef.current = setTimeout(() => {
        onSuccess()
        onClose()
        setParsedData([])
        setJsonText('')
        setValidationSummary(null)
      }, 1500)

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during sync'
      logError('bulk.sync_failed', { error: errorMessage, requestId })
      setErrors([{ row: 0, message: errorMessage }])
      setUploadProgress(prev => ({ ...prev, status: 'error' }))
    } finally {
      setIsUploading(false)
    }
  }

  /* Preview & Sync gate (§12/§27): valid status AND the validated context
   * must still be the LIVE context — stale validations never unlock preview. */
  const canPreview =
    validationStatus === 'valid' &&
    validatedContext !== null &&
    validatedContext.examId === examId &&
    validatedContext.paperId === paperId &&
    validatedContext.subjectName === subjectName &&
    validatedContext.topicId === (topicId ?? null)

  /* Pre-sync topic-guard preview: when the workspace is topic-scoped and some
   * pending rows do not byte-match the topic's canonical topic_en/topic_te,
   * surface the exact expected bytes BEFORE the admin clicks Sync (the STRICT
   * REJECT service would refuse those rows). */
  const topicGuard = useMemo<TopicGuardMismatch | null>(() => {
    if (!topicId) return null
    const topic = topics.find(t => t.id === topicId)
    if (!topic) return null
    const pendingItems = parsedData.filter(i => i.status !== 'success')
    const mismatched = pendingItems.filter(i => isTopicGuardMismatch(i, topic)).length
    if (mismatched === 0) return null
    return { topicEn: topic.topic_en, topicTe: topic.topic_te ?? null, mismatched, pending: pendingItems.length }
  }, [topicId, topics, parsedData])

  /* §B — LIVE pre-sync block-list: every pending row that would fail the
   * canonical SingleQuestionSchema at sync time. Surfaced in Preview BEFORE
   * syncing (and re-checked inside handleUpload as the final gate). Empty when
   * there is nothing pending or every pending row is valid. */
  const syncBlockers = useMemo<SyncRowProblem[]>(() => {
    const pendingItems = parsedData.filter(i => i.status !== 'success')
    if (pendingItems.length === 0) return []
    return validatePendingRowsForSync(pendingItems, { examId, paperId, subjectName })
  }, [parsedData, examId, paperId, subjectName])

  return {
    jsonText, setJsonText, handleJsonChange,
    parsedData,
    setParsedData,
    errors,
    error, setError,
    feedback,
    setFeedback,
    isUploading,
    promptBlocks,
    topics,
    isPromptModalOpen, setIsPromptModalOpen,
    editingPrompt, setEditingPrompt,
    isSavingPrompt,
    localCopied, setLocalCopied,
    copiedPromptId, setCopiedPromptId,
    duplicateCount,
    uploadProgress,
    validationSummary,
    validationStatus,
    canPreview,
    topicGuard,
    syncBlockers,
    isDeletingPrompt, setIsDeletingPrompt,
    promptIdToDelete, setPromptIdToDelete,
    currentPrompt,
    currentTopicIdentity,
    fetchPrompts,
    setUploadProgress,
    handleOpenPromptModal,
    handleSavePrompt,
    handleDeletePrompt,
    executeDeletePrompt,
    handleCopy,
    handleAnalyze,
    handleSkipRow,
    handleUpload,
  }
}

import { useState, useEffect, useCallback } from 'react'
import { adminQuestionService } from '../services/adminQuestionService'
import type { Question } from '../types/exam.types'
import { resolveAdminExamId } from '../lib/examUtils'
import { BulkQuestionSchema } from '../validations/questionSchema'
import { generateQuestionHash } from '../utils/hashUtils'
import { generateRequestId } from '../utils/logger'
import { isAdmin } from '../utils/authUtils'
import { logError } from '../utils/logger'
import type { UserProfile } from '../types/auth.types'

export interface PromptTemplate {
  id?: string
  exam_id: string
  paper_id: string
  subject_name: string
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
  status: 'pending' | 'success'
  question: string
  options: [string, string, string, string]
  correct: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  visual?: any
  topic_en?: string | null
  topic_te?: string | null
  question_text_te?: string | null
  option_a_te?: string | null
  option_b_te?: string | null
  option_c_te?: string | null
  option_d_te?: string | null
  explanation_te?: string | null
}

export type BulkTabType = 'generate' | 'instructions' | 'json' | 'preview'

interface UseBulkUploadOptions {
  examId: string
  examLabel?: string
  paperId: string
  paperLabel?: string
  subjectName: string
  onSuccess: () => void
  onClose: () => void
  activeTab: BulkTabType
  setActiveTab: (tab: BulkTabType) => void
  parsedData: ParsedDataItem[]
  setParsedData: React.Dispatch<React.SetStateAction<ParsedDataItem[]>>
  onIsUploadingChange?: (isUploading: boolean) => void
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void
  authUser: UserProfile | null
}

const GENERIC_PROMPT = `Extract all the multiple choice questions from the uploaded documents.
Return ONLY a valid JSON array, strictly adhering to this structure:

[
  {
    "question": "string (the question text)",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": "A",
    "explanation": "string (brief explanation why it's correct)"
  }
]

Rules:
1. ONLY return the JSON. No markdown ticks, no conversational text.
2. The 'options' key MUST be an array of exactly 4 strings.
3. The 'correct' key must EQUAL EXACTLY 'A', 'B', 'C', or 'D'.
4. Ensure valid JSON syntax (escape quotes natively).
5. Include 'visual' key ONLY if a diagram/chart is present. Use metadata schema for geometry, charts, venn, and tables.`

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

Each question must follow EXACTLY this structure:

{
"question_text": "string",
"option_a": "A. ...",
"option_b": "B. ...",
"option_c": "C. ...",
"option_d": "D. ...",
"correct_option": "A",
"explanation": "string",
"difficulty": "easy/medium/hard"
}

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

* Do NOT include exam_id, paper_id, or subject_name in output
* Do NOT include any extra text outside JSON array
* Do NOT break JSON format
* Do NOT generate incomplete questions

---

FINAL OUTPUT FORMAT

[
{
"question_text": "...",
"visual": { "type": "...", "data": { ... } },
"option_a": "A. ...",
"option_b": "B. ...",
"option_c": "C. ...",
"option_d": "D. ...",
"correct_option": "A",
"explanation": "...",
"difficulty": "medium"
}
]

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

export function useBulkUpload({
  examId, examLabel: _examLabel, paperId, paperLabel: _paperLabel, subjectName, onSuccess, onClose, activeTab: _activeTab, setActiveTab, parsedData, setParsedData, onIsUploadingChange, showToast, authUser
}: UseBulkUploadOptions) {
  const [jsonText, setJsonText] = useState('')
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    onIsUploadingChange?.(isUploading)
  }, [isUploading, onIsUploadingChange])

  const [promptBlocks, setPromptBlocks] = useState<PromptTemplate[]>([])
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null)
  const [isSavingPrompt, setIsSavingPrompt] = useState(false)
  const [localCopied, setLocalCopied] = useState(false)
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [duplicateCount, setDuplicateCount] = useState(0)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ current: 0, total: 0, status: 'idle' })
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null)
  const [lastActionTime, setLastActionTime] = useState(0)
  const [isDeletingPrompt, setIsDeletingPrompt] = useState(false)
  const [promptIdToDelete, setPromptIdToDelete] = useState<string | null>(null)

  const ACTION_COOLDOWN = 3000

  const currentPrompt = promptBlocks.find(p => p.is_default)?.prompt_text ||
    (subjectName === 'History and Culture' ? HISTORY_PROMPT : GENERIC_PROMPT)

  const fetchPrompts = useCallback(async () => {
    if (!examId || !paperId || !subjectName) return
    const result = await adminQuestionService.listPrompts(examId, paperId, subjectName, { user: authUser })
    if (result.success) {
      setPromptBlocks(result.data || [])
    }
  }, [examId, paperId, subjectName, authUser])

  const handleOpenPromptModal = (block: PromptTemplate | null = null) => {
    if (block) {
      setEditingPrompt({ ...block })
    } else {
      setEditingPrompt({
        exam_id: examId,
        paper_id: paperId,
        subject_name: subjectName,
        topic_name: '',
        prompt_text: GENERIC_PROMPT,
        is_default: promptBlocks.length === 0
      })
    }
    setIsPromptModalOpen(true)
  }

  const handleSavePrompt = async () => {
    if (!isAdmin(authUser)) {
      showToast('Unauthorized: Admin privileges required to manage prompts.', 'error')
      return
    }
    if (!editingPrompt) return
    if (!editingPrompt.topic_name.trim() || !editingPrompt.prompt_text.trim()) {
      showToast('Topic name and Prompt text are required.', 'warning')
      return
    }

    setIsSavingPrompt(true)
    try {
      const payload = {
        ...editingPrompt,
        updated_at: new Date().toISOString()
      }

      const result = await adminQuestionService.upsertPrompt(payload, { user: authUser })
      if (!result.success) throw new Error(result.error?.message || 'Failed to save prompt')

      await fetchPrompts()
      setIsPromptModalOpen(false)
      setEditingPrompt(null)
      showToast('Prompt saved successfully.', 'success')
    } catch (err: unknown) {
      showToast('Save failed: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error')
    } finally {
      setIsSavingPrompt(false)
    }
  }

  const handleDeletePrompt = (id: string) => {
    if (!isAdmin(authUser)) {
      showToast('Unauthorized: Admin privileges required to manage prompts.', 'error')
      return
    }
    setPromptIdToDelete(id)
    setIsDeletingPrompt(true)
  }

  const executeDeletePrompt = async () => {
    if (!promptIdToDelete) return
    const result = await adminQuestionService.deletePrompt(promptIdToDelete, { user: authUser })
    if (result.success) {
      await fetchPrompts()
      setIsPromptModalOpen(false)
      showToast('Prompt deleted successfully.', 'success')
    } else {
      showToast('Delete failed: ' + (result.error?.message || result.error), 'error')
    }
    setIsDeletingPrompt(false)
    setPromptIdToDelete(null)
  }

  const handleCopy = (text?: string, id?: string) => {
    const copyText = text || currentPrompt
    navigator.clipboard.writeText(copyText)

    if (id) {
      setCopiedPromptId(id)
      setTimeout(() => setCopiedPromptId(null), 2000)
    } else {
      setLocalCopied(true)
      setTimeout(() => setLocalCopied(false), 2000)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  const processJsonData = async (json: string) => {
    setErrors([])
    setParsedData([])
    setDuplicateCount(0)
    setValidationSummary(null)

    if (!json.trim()) {
      setErrors([{ row: 0, message: 'Please paste your JSON context.' }])
      return
    }

    let data: any[]
    try {
      data = JSON.parse(json.trim())
    } catch {
      setErrors([{ row: 0, message: 'Invalid JSON syntax. Please check for trailing commas or unescaped quotes.' }])
      return
    }

    if (!Array.isArray(data)) {
      setErrors([{ row: 0, message: 'Root level must be a JSON array: "[ { ... } ]"' }])
      return
    }

    const newErrors: { row: number; message: string }[] = []
    const ValidatedQueue: ParsedDataItem[] = []
    const seenHashes = new Set<string>()
    let dupeCount = 0
    let easy = 0, medium = 0, hard = 0

    for (const [index, item] of data.entries()) {
      const rowNum = index + 1

      const result = BulkQuestionSchema.safeParse(item)

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
    } else if (ValidatedQueue.length === 0) {
      setErrors([{ row: 0, message: 'No valid questions found after processing.' }])
    } else {
      setDuplicateCount(dupeCount)
      setParsedData(ValidatedQueue)
      setValidationSummary({ total: ValidatedQueue.length, easy, medium, hard })
      setActiveTab('preview')
    }
  }

  const handleAnalyze = async () => {
    await processJsonData(jsonText)
  }

  const handleSkipRow = async (rowNum: number) => {
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
      showToast('Failed to update JSON: ' + (e instanceof Error ? e.message : 'Unknown error'), 'error')
    }
  }

  const handleUpload = async () => {
    const now = Date.now()
    if (now - lastActionTime < ACTION_COOLDOWN) {
      return
    }
    setLastActionTime(now)

    if (!isAdmin(authUser)) {
      showToast('Unauthorized: Admin privileges required to upload questions.', 'error')
      return
    }
    const itemsToUpload = parsedData.filter(item => item.status !== 'success')
    if (itemsToUpload.length === 0) return
    setIsUploading(true)
    setErrors([])
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

        const result = await adminQuestionService.bulkInsertQuestions(payload, { requestId: `${requestId}_c${index}`, user: authUser })

        if (!result.success) {
          throw new Error(`Chunk ${index + 1} failed: ${result.error?.message || 'Bulk upload failed'}`)
        }

        completedCount += chunk.length
        setUploadProgress(prev => ({ ...prev, current: completedCount }))

        const chunkHashes = chunk.map(c => c.id)
        setParsedData((prev: ParsedDataItem[]) => prev.map((item: ParsedDataItem) =>
          chunkHashes.includes(item.id) ? { ...item, status: 'success' as const } : item
        ))
      }

      setUploadProgress(prev => ({ ...prev, status: 'success', current: prev.total }))

      setTimeout(() => {
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

  return {
    jsonText, setJsonText,
    errors,
    isUploading,
    promptBlocks,
    isPromptModalOpen, setIsPromptModalOpen,
    editingPrompt, setEditingPrompt,
    isSavingPrompt,
    localCopied, setLocalCopied,
    copiedPromptId, setCopiedPromptId,
    duplicateCount,
    uploadProgress,
    validationSummary,
    isDeletingPrompt, setIsDeletingPrompt,
    promptIdToDelete, setPromptIdToDelete,
    currentPrompt,
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

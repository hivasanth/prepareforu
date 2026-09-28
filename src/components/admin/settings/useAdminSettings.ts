import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAsyncOperation } from '../../../hooks/useAsyncOperation'
import { useAdminFilters } from '../../../hooks/useAdminFilters'
import { isAdmin } from '../../../utils/authUtils'
import { adminService } from '../../../services/adminService'
import { useAuth } from '../../../context/AuthContext'
import { generateRequestId } from '../../../utils/logger'
import { normalizeError } from '../../../utils/errorClassification'
import type { PageError } from '../../../types/error.types'
import type { ExamConfig, ExamSubject, ExamTopicConfig } from '../../../types/exam.types'
import { examParamsSchema, EXAM_SUBJECTS_SUM_MESSAGE } from '../../../validations/securitySchemas'
import { getTopicThresholdSum, getTopicThreshold, computeEvenDistribution, TOPIC_MIN_REQUIRED } from './utils/topicConfigUtils'
import { normalizeAdminSettingsDraft, deepEqualPlain } from './utils/draftComparison'
import type { NormalizedSettingsDraft } from './utils/draftComparison'
import type { ConfigMode } from './utils/topicConfigUtils'
export type ParamsFieldErrors = Partial<Record<
  'total_questions' | 'total_marks' | 'duration_minutes' | 'negative_mark_value',
  string
>>

export type PageMode = 'exams' | 'subject_test'
export type TestMode = '20' | '30' | '50'

/**
 * BUG-C: a save failure is either a NON-RETRYABLE validation rejection
 * (client rules or the atomic RPC's INVALID_*, SUM_MISMATCH,
 * UNAUTHORIZED_ACCESS family — retrying identical data can never succeed)
 * or a RETRYABLE transport/backend failure. The retryable flag drives whether
 * the UI offers Retry at all; a validation error must never produce a dead or
 * stale context-replaying retry button.
 */
interface SaveErrorState {
  message: string
  retryable: boolean
}

/** Structured RPC rejection prefixes raised by public.save_admin_settings_rpc
 *  / save_subject_test_configuration. Anything matching is deterministic
 *  validation/authorization output, never worth an automatic retry. */
const NON_RETRYABLE_SAVE_PREFIXES = [
  'INVALID_MODE', 'INVALID_PAPER', 'INVALID_SUBJECT', 'INVALID_TOPIC',
  'INVALID_THRESHOLD', 'SUM_MISMATCH', 'SUBJECT_NOT_FOUND', 'EXAM_NOT_FOUND',
  'VALIDATION_ERROR', 'UNAUTHORIZED_ACCESS',
] as const

function toSaveError(err: unknown): SaveErrorState {
  const raw = err instanceof Error ? err.message : String(err)
  const retryable = !NON_RETRYABLE_SAVE_PREFIXES.some(p => raw.includes(p))
  return { message: raw, retryable }
}

/** Navigation intent — the complete requested switch, stored BEFORE any
 *  selection mutates so one user decision resolves one hierarchy (§9/§12). */
export type PendingSelection =
  | { kind: 'exam'; value: string }
  | { kind: 'paper'; value: string }
  | { kind: 'subject'; value: string }
  | { kind: 'page_mode'; value: PageMode }
  | { kind: 'test_mode'; value: TestMode }

const EXAM_TOPIC_SUM_MISMATCH = 'Topic required questions must sum to the subject question count'

export function useAdminSettings() {
  const { user } = useAuth()
  const {
    selectedExam, selectedPaper, selectedSubject,
    setSelectedExam: setSelectedExamRaw,
    setSelectedPaper: setSelectedPaperRaw,
    setSelectedSubject: setSelectedSubjectRaw,
  } = useAdminFilters()

  const [pageMode, setPageMode] = useState<PageMode>('exams')
  const [testMode, setTestMode] = useState<TestMode>('20')

  const [config, setConfig] = useState<ExamConfig | null>(null)
  const configRef = useRef(config)
  configRef.current = config

  const [subjects, setSubjects] = useState<ExamSubject[]>([])
  const subjectsRef = useRef(subjects)
  subjectsRef.current = subjects

  const [topicConfigs, setTopicConfigs] = useState<Record<string, ExamTopicConfig[]>>({})
  /** EAGER synchronous mirror of the topic draft. Every mutation composes
   *  from (and assigns) this ref BEFORE calling setTopicConfigs, so
   *  concurrent fetches never build on a stale map and baseline captures can
   *  be paired exactly with the data being committed in the same batch. */
  const draftTopicsRef = useRef<Record<string, ExamTopicConfig[]>>({})

  const { loading: isLoading, execute } = useAsyncOperation(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tabsKey, setTabsKey] = useState(0)
  const [paramsFieldErrors, setParamsFieldErrors] = useState<ParamsFieldErrors>({})
  const [subjectsError, setSubjectsError] = useState<string | undefined>(undefined)
  const submittedRef = useRef(false)

  const [topicLoading, setTopicLoading] = useState<Record<string, boolean>>({})
  const [pageError, setPageError] = useState<PageError | null>(null)
  const [saveError, setSaveError] = useState<SaveErrorState | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const saveSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ═══ Request ownership (BUG-1) — monotonic fetch sequence ══════════════
   * Every data fetch captures the sequence value at start; ALL state writes
   * are gated on still owning the latest sequence. A late-resolving stale
   * response can therefore never overwrite newer state, and a stale FAILURE
   * can never replace fresh success data with an error. The guard sits
   * immediately before the write cluster (no awaits between check and
   * setState), so each check→write block is atomic in JS and the paired
   * baseline capture stays inside the same logical update. */
  const fetchSeqRef = useRef(0)

  /* ═══ Dirty-state architecture — dual baselines, ONE owner (this hook) ═══
   * PERSISTED STATE  → settingsBaselines.server   (raw payloads as returned)
   * INIT BASELINE    → settingsBaselines.baseline (post-initialization draft)
   * DRAFT STATE      → live config/subjects/topicConfigs state
   * NAVIGATION INTENT→ pendingSelection (never mixed into either snapshot)
   *
   * isDirty (confirmation semantics) compares the draft against the INIT
   * BASELINE: deterministic initialization (even-split redistribution) is
   * part of the baseline, so hydration/programmatic init can never produce a
   * false warning. draftDivergesFromServer compares against the RAW SERVER
   * payload and drives Save-button enablement (an auto-generated correction
   * remains savable). Comparisons are sliced to the active editing context
   * (exams: config + all subjects/topics · Subject Test: active subject's
   * thresholds) so switching exam/paper/subject never fabricates dirtiness.
   * ════════════════════════════════════════════════════════════════════ */
  const [settingsBaselines, setSettingsBaselines] = useState<{
    server: NormalizedSettingsDraft
    baseline: NormalizedSettingsDraft
  } | null>(null)
  const baselinesRef = useRef(settingsBaselines)
  baselinesRef.current = settingsBaselines

  /** Raw server topic payloads (pre-redistribution), keyed by subject name. */
  const rawServerTopicsRef = useRef<Record<string, ExamTopicConfig[]>>({})

  /**
   * Re-establish BOTH baselines. Called in the SAME batch as the paired data
   * setStates at every programmatic-init point, passing exactly the objects
   * being committed — so each render evaluates a consistent (draft,
   * baseline) pair and hydration/initialization can never flash a phantom
   * "unsaved changes" warning, even with overlapping topic fetches.
   */
  const captureBaselines = useCallback((paired?: {
    config?: ExamConfig | null
    subjects?: ExamSubject[]
    topics?: Record<string, ExamTopicConfig[]>
  }) => {
    const cfg = (paired && 'config' in paired ? paired.config : configRef.current) ?? null
    const subs = paired?.subjects ?? subjectsRef.current
    const tops = paired?.topics ?? draftTopicsRef.current
    setSettingsBaselines({
      server: normalizeAdminSettingsDraft({ config: cfg, subjects: subs, rawTopics: rawServerTopicsRef.current }),
      baseline: normalizeAdminSettingsDraft({ config: cfg, subjects: subs, topicConfigs: tops }),
    })
  }, [])

  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null)

  // Refs mirroring mode state for stable callbacks (fetchTopicConfig etc.)
  const pageModeRef = useRef(pageMode)
  pageModeRef.current = pageMode
  const testModeRef = useRef(testMode)
  testModeRef.current = testMode
  const selectedSubjectRef = useRef(selectedSubject)
  selectedSubjectRef.current = selectedSubject

  // H-1: Refs for retry — stores a factory that reads current state at call time
  const lastSaveFactoryRef = useRef<(() => Promise<void>) | null>(null)
  const selectedExamRef = useRef(selectedExam)
  selectedExamRef.current = selectedExam
  const selectedPaperRef = useRef(selectedPaper)
  selectedPaperRef.current = selectedPaper

  // Finding #10: Clean save-success timeout on unmount
  useEffect(() => {
    return () => {
      if (saveSuccessTimeoutRef.current) clearTimeout(saveSuccessTimeoutRef.current)
    }
  }, [])

  /**
   * Subject Test distribution rule: persisted values are preserved only when
   * they already sum to the mode total; otherwise a deterministic even split
   * is returned (base = floor(total/n), first `total % n` topics base + 1).
   * Applied ONLY at legitimate re-init points (topic fetch, test-mode change,
   * mode activation, subject activation) — never after manual edits: a
   * subject+mode key touched by the admin is respected verbatim until fresh
   * server data arrives.
   */
  const applyDistribution = useCallback((topics: ExamTopicConfig[], mode: TestMode): ExamTopicConfig[] => {
    const modeTotal = Number(mode)
    if (getTopicThresholdSum(topics, mode as ConfigMode) === modeTotal) return topics
    const distributed = computeEvenDistribution(topics.length, modeTotal)
    const key = mode === '20' ? 'test_20_required' : mode === '30' ? 'test_30_required' : 'test_50_required'
    return topics.map((t, i) => ({ ...t, [key]: distributed[i] ?? t[key as 'test_20_required'] }))
  }, [])

  // Draft keys the admin has hand-edited — redistribution must never clobber them.
  const userEditedKeysRef = useRef<Set<string>>(new Set())
  const draftKey = useCallback((subject: string, mode: TestMode | 'exam') => `${subject}:${mode}`, [])

  /**
   * Ensure a cached topic draft satisfies the active mode total. No-op when
   * the sum is already valid or the admin edited this (subject, mode) draft.
   * Deterministic initialization — never marks the form dirty; the resulting
   * draft becomes part of the init baseline via the paired capture.
   */
  const ensureCachedDistribution = useCallback((subjectName: string, topics: ExamTopicConfig[] | undefined) => {
    if (!topics || topics.length === 0) return
    const mode = testModeRef.current
    if (userEditedKeysRef.current.has(draftKey(subjectName, mode))) return
    const distributed = applyDistribution(topics, mode)
    if (distributed !== topics) {
      const next = { ...draftTopicsRef.current, [subjectName]: distributed }
      draftTopicsRef.current = next
      setTopicConfigs(next)
      setSaveError(null)
      setSaveSuccess(false)
      captureBaselines({ topics: next })
    }
  }, [applyDistribution, draftKey, captureBaselines])

  // M-1: Stable fetchTopicConfig — reads paper_id from ref, not subjects state
  const fetchTopicConfig = useCallback(async (subjectName: string) => {
    const exam = selectedExamRef.current
    if (!exam || exam === 'all' || exam === 'APPSC_GROUPS') return
    const paperId = selectedPaperRef.current === 'all' ? subjectsRef.current[0]?.paper_id : selectedPaperRef.current
    if (!paperId || !subjectName) return

    // Request ownership: a topic payload fetched under an older exam context
    // must never merge into the draft map after the exam switched.
    const seq = fetchSeqRef.current

    setTopicLoading(prev => ({ ...prev, [subjectName]: true }))
    try {
      const rawTopics = await adminService.fetchTopicConfiguration(
        { user, requestId: generateRequestId('fetch_topics') },
        exam, paperId, subjectName
      )
      if (fetchSeqRef.current !== seq) return
      // Fresh server truth resets manual-edit tracking for this subject.
      for (const k of [...userEditedKeysRef.current]) {
        if (k.startsWith(`${subjectName}:`)) userEditedKeysRef.current.delete(k)
      }
      // Stash the RAW payload — the server side of the dual baseline.
      const stash = { ...rawServerTopicsRef.current, [subjectName]: rawTopics }
      rawServerTopicsRef.current = stash
      // Subject Test: persisted values are kept only when they already satisfy
      // the active mode total; otherwise the draft starts from the
      // deterministic even distribution (programmatic init — never "dirty").
      let topics = rawTopics
      if (pageModeRef.current === 'subject_test' && topics.length > 0) {
        topics = applyDistribution(topics, testModeRef.current)
      }
      const next = { ...draftTopicsRef.current, [subjectName]: topics }
      draftTopicsRef.current = next
      setTopicConfigs(next)
      captureBaselines({ topics: next })
    } catch (err: unknown) {
      if (fetchSeqRef.current !== seq) return
      setPageError(normalizeError(err instanceof Error ? err : new Error(String(err)), { fallbackMessage: err instanceof Error ? err.message : 'Failed to load topics' }))
    } finally {
      setTopicLoading(prev => ({ ...prev, [subjectName]: false }))
    }
  }, [user, applyDistribution, captureBaselines])

  const fetchData = useCallback(async () => {
    const seq = ++fetchSeqRef.current
    const isStaleSeq = () => fetchSeqRef.current !== seq
    try {
      await execute(async () => {
        const requestId = generateRequestId('fetch_admin_settings')
        if (selectedExam === 'all' || selectedExam === 'APPSC_GROUPS') return

        const targetExamId = selectedExam
        const paperData = await adminService.fetchExamPapers({ user, requestId }, targetExamId)

        let currentPaperId = selectedPaper
        if (paperData?.length > 0 && (currentPaperId === 'all' || !paperData.find(p => p.id === currentPaperId))) {
          currentPaperId = paperData[0].id
        }

        const configData = await adminService.fetchExamConfig({ user, requestId }, targetExamId)
        let finalConfig: ExamConfig | null
        if (currentPaperId !== 'all') {
          const paper = paperData?.find(p => p.id === currentPaperId)
          if (paper && configData) {
            finalConfig = {
              ...configData,
              total_questions: paper.total_questions,
              total_marks: paper.total_marks,
              duration_minutes: paper.duration_minutes,
              negative_marking: paper.negative_marking,
              negative_mark_value: Number(paper.negative_mark_value)
            }
          } else {
            finalConfig = configData
          }
        } else {
          finalConfig = configData
        }

        const subjectData = await adminService.fetchExamSubjects({ user, requestId }, targetExamId, currentPaperId === 'all' ? null : currentPaperId)
        const subjectList = subjectData || []

        /* BUG-1 stale guard — single transactional gate before the ENTIRE
         * write cluster. No awaits between this check and the setState calls,
         * so data + baseline can never interleave across requests. */
        if (isStaleSeq()) return

        setConfig(finalConfig)
        setSubjects(subjectList)
        setParamsFieldErrors({})
        setSubjectsError(undefined)
        draftTopicsRef.current = {}
        rawServerTopicsRef.current = {}
        setTopicConfigs({})
        setPageError(null)
        setSaveError(null)
        setSaveSuccess(false)
        submittedRef.current = false
        captureBaselines({ config: finalConfig, subjects: subjectList, topics: {} })
      })
    } catch (err: unknown) {
      // A stale request's failure must never replace newer success state.
      if (!isStaleSeq()) {
        setPageError(normalizeError(err instanceof Error ? err : new Error(String(err))))
      }
    }
  }, [selectedExam, selectedPaper, user, execute, captureBaselines])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Finding #1: Concurrent fetch — Promise.all for all missing subjects
  // M-1: fetchTopicConfig is now stable, so this effect only re-fires when
  // isLoading/subjects/topicConfigs/selectedExam actually change
  useEffect(() => {
    if (!isLoading && subjects.length > 0 && selectedExam && selectedExam !== 'all' && selectedExam !== 'APPSC_GROUPS') {
      const missing = subjects.filter(s => !topicConfigs[s.subject_name])
      if (missing.length > 0) {
        Promise.all(missing.map(s => fetchTopicConfig(s.subject_name)))
      }
    }
  }, [isLoading, subjects, selectedExam, topicConfigs, fetchTopicConfig])

  /* ═══ Derived dirty state — the ONE authoritative calculation (§5/§6) ═══ */

  const normalizedDraft = useMemo(
    () => normalizeAdminSettingsDraft({ config, subjects, topicConfigs }),
    [config, subjects, topicConfigs],
  )

  const comparable = useCallback((snap: NormalizedSettingsDraft): NormalizedSettingsDraft => {
    if (pageMode === 'subject_test') {
      const key = selectedSubject && selectedSubject !== 'all' ? selectedSubject : ''
      const topics = key && snap.topics[key] ? { [key]: snap.topics[key] } : {}
      return { config: null, subjects: {}, topics }
    }
    return snap
  }, [pageMode, selectedSubject])

  const baselineReady = settingsBaselines !== null
  const isDirty = baselineReady
    && !deepEqualPlain(comparable(normalizedDraft), comparable(settingsBaselines.baseline))
  const draftDivergesFromServer = baselineReady
    && !deepEqualPlain(comparable(normalizedDraft), comparable(settingsBaselines.server))

  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  // Finding #4: beforeunload guard for unsaved changes — browser/tab close
  // ONLY. Internal exam/paper/subject switches use the in-app confirmation
  // modal and never touch this path (§38).
  // BUG-4: modern Chrome requires `returnValue` assignment; preventDefault
  // alone is not honored everywhere.
  useEffect(() => {
    if (!isDirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  /* ═══ Selection application — guarded intent vs direct mutation ════════ */

  const applySubject = useCallback((subjectName: string) => {
    setSelectedSubjectRaw(subjectName)
    setSaveError(null)
    setSaveSuccess(false)
    if (!draftTopicsRef.current[subjectName]) {
      fetchTopicConfig(subjectName)
    } else if (pageModeRef.current === 'subject_test') {
      ensureCachedDistribution(subjectName, draftTopicsRef.current[subjectName])
    }
  }, [setSelectedSubjectRaw, fetchTopicConfig, ensureCachedDistribution])

  const applyPageMode = useCallback((newMode: PageMode) => {
    setPageMode(newMode)
    setSaveError(null)
    setSaveSuccess(false)
    // Activating Subject Test re-initializes any prefetched draft whose
    // persisted values violate the active mode total (manual edits were
    // resolved through the confirmation decision, so redistribution is safe).
    // No baseline capture is needed here: snapshots describe DATA, not mode —
    // and any redistribution above captures its own paired baselines.
    if (newMode === 'subject_test') {
      const subject = selectedSubjectRef.current
      if (subject && subject !== 'all') ensureCachedDistribution(subject, draftTopicsRef.current[subject])
    }
  }, [ensureCachedDistribution])

  const applyTestMode = useCallback((newMode: TestMode) => {
    setTestMode(newMode)
    setSaveError(null)
    setSaveSuccess(false)
    // Section 13: a question-count change reinitializes the draft distribution
    // deterministically whenever the newly selected column violates its total.
    const subject = selectedSubjectRef.current
    const topics = draftTopicsRef.current[subject]
    // Confirming the switch discards prior manual edits for this subject.
    if (subject) userEditedKeysRef.current.delete(draftKey(subject, testMode))
    if (subject && subject !== 'all' && topics && topics.length > 0) {
      const distributed = applyDistribution(topics, newMode)
      if (distributed !== topics) {
        const next = { ...draftTopicsRef.current, [subject]: distributed }
        draftTopicsRef.current = next
        setTopicConfigs(next)
        captureBaselines({ topics: next })
      }
    }
  }, [testMode, applyDistribution, draftKey, captureBaselines])

  const applySelection = useCallback((action: PendingSelection) => {
    switch (action.kind) {
      case 'exam': setSelectedExamRaw(action.value); break
      case 'paper': setSelectedPaperRaw(action.value); break
      case 'subject': applySubject(action.value); break
      case 'page_mode': applyPageMode(action.value); break
      case 'test_mode': applyTestMode(action.value); break
    }
  }, [setSelectedExamRaw, setSelectedPaperRaw, applySubject, applyPageMode, applyTestMode])

  /** Single entry point for every user-initiated selection switch: clean
   *  drafts switch immediately; dirty drafts park the COMPLETE intent in
   *  pendingSelection and open the reusable confirmation modal (§10/§11). */
  const requestSelection = useCallback((action: PendingSelection) => {
    if (isSaving) return
    if (!isDirtyRef.current) {
      applySelection(action)
      return
    }
    setPendingSelection(action)
  }, [isSaving, applySelection])

  const stayHere = useCallback(() => {
    setPendingSelection(null)
  }, [])

  /** Discard Changes: restore the draft from the init baseline (last known
   *  authoritative configuration), clear transient validation state, then
   *  apply the pending selection. No database call (§19). */
  const discardForSwitch = useCallback(() => {
    const action = pendingSelection
    const baseline = baselinesRef.current?.baseline
    if (baseline) {
      if (config && baseline.config) {
        setConfig({
          ...config,
          total_questions: baseline.config.total_questions,
          total_marks: baseline.config.total_marks,
          duration_minutes: baseline.config.duration_minutes,
          negative_marking: baseline.config.negative_marking,
          negative_mark_value: baseline.config.negative_mark_value,
          is_published: baseline.config.is_published,
          allow_multiple_attempts: baseline.config.allow_multiple_attempts,
        })
      }
      setSubjects(prev => prev.map(s =>
        baseline.subjects[s.id] !== undefined ? { ...s, question_count: baseline.subjects[s.id] } : s,
      ))
      const next: Record<string, ExamTopicConfig[]> = {}
      for (const [name, rows] of Object.entries(draftTopicsRef.current)) {
        const baseRows = baseline.topics[name]
        next[name] = !baseRows?.length
          ? rows
          : rows.map(t => {
            const b = baseRows.find(x => x.id === t.id)
            return b
              ? {
                ...t,
                required_questions: b.required_questions,
                test_20_required: b.test_20_required,
                test_30_required: b.test_30_required,
                test_50_required: b.test_50_required,
              }
              : t
          })
      }
      draftTopicsRef.current = next
      setTopicConfigs(next)
    }
    userEditedKeysRef.current.clear()
    setParamsFieldErrors({})
    setSubjectsError(undefined)
    setSaveError(null)
    setSaveSuccess(false)
    setPendingSelection(null)
    if (action) applySelection(action)
  }, [pendingSelection, config, applySelection])

  /* ═══ Validation & save paths — UNCHANGED authoritative logic ══════════ */

  const validateParams = useCallback((cfg: ExamConfig) => {
    const result = examParamsSchema.safeParse({
      total_questions: cfg.total_questions,
      total_marks: cfg.total_marks,
      duration_minutes: cfg.duration_minutes,
      negative_marking: cfg.negative_marking,
      negative_mark_value: cfg.negative_mark_value,
    })
    const fieldErrors: ParamsFieldErrors = {}
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof ParamsFieldErrors | undefined
        if (field) fieldErrors[field] = issue.message
      })
    }
    return { ok: result.success, fieldErrors }
  }, [])

  const saveAll = useCallback(async (): Promise<boolean> => {
    if (!config || !isAdmin(user)) return false
    submittedRef.current = true

    const { ok, fieldErrors } = validateParams(config)
    setParamsFieldErrors(fieldErrors)
    if (!ok) return false

    const totalQ = subjects.reduce((sum, s) => sum + (Number(s.question_count) || 0), 0)
    if (totalQ !== Number(config.total_questions)) {
      // Inline field-level validation (distribution card); not a save-bar
      // failure — never retryable, so no SaveError state is created.
      setSubjectsError(EXAM_SUBJECTS_SUM_MESSAGE)
      return false
    }
    setSubjectsError(undefined)

    for (const sub of subjects) {
      const topics = topicConfigs[sub.subject_name]
      if (!topics || topics.length === 0) continue
      const topicSum = getTopicThresholdSum(topics, 'exam')
      if (topicSum !== sub.question_count) {
        setSaveError({ message: `${sub.subject_name}: ${EXAM_TOPIC_SUM_MISMATCH} (${topicSum} configured / ${sub.question_count} required)`, retryable: false })
        return false
      }
    }

    // H-1: Store a factory that reads CURRENT state at retry time via refs.
    // BUG-A: the whole save persists through ONE atomic RPC — a mid-save
    // failure rolls back everything, so partial persistence is impossible.
    // BUG-B: on success the factory pairs BOTH baselines with the exact
    // committed state, so isDirty/draftDivergesFromServer resolve correctly
    // for both the direct Save path and the retry path.
    lastSaveFactoryRef.current = async () => {
      const curConfig = configRef.current
      if (!curConfig || !isAdmin(user)) return
      const curSubjects = subjectsRef.current
      const curTopicConfigs = draftTopicsRef.current
      const curPaperId = selectedPaperRef.current
      const curExamId = selectedExamRef.current
      if (!curExamId) return

      const requestId = generateRequestId('save_all')
      const examLevel = curPaperId === 'all'

      const topicGroups = curSubjects
        .map(sub => {
          const topics = curTopicConfigs[sub.subject_name]
          if (!topics || topics.length === 0) return null
          const paperId = examLevel ? sub.paper_id : curPaperId
          if (!paperId) return null
          return {
            paper_id: paperId,
            subject_name: sub.subject_name,
            topics: topics.map(t => ({ topic_id: t.id, required_questions: t.required_questions })),
          }
        })
        .filter((g): g is NonNullable<typeof g> => g !== null)

      await adminService.saveAdminSettingsAtomic({ user, requestId }, {
        examId: curExamId,
        paperId: examLevel ? null : curPaperId,
        config: {
          total_questions: curConfig.total_questions,
          total_marks: curConfig.total_marks,
          duration_minutes: curConfig.duration_minutes,
          negative_marking: curConfig.negative_marking,
          negative_mark_value: curConfig.negative_mark_value,
          ...(examLevel ? {
            is_published: curConfig.is_published,
            allow_multiple_attempts: curConfig.allow_multiple_attempts,
          } : {}),
        },
        subjects: curSubjects.map(s => ({
          id: s.id,
          question_count: s.question_count,
          marks_per_question: s.marks_per_question,
        })),
        topics: topicGroups,
      })

      // BUG-B: the committed draft IS authoritative now (the RPC validated
      // and applied exactly these values in one transaction). Refresh the RAW
      // server topic snapshot with the committed rows, then re-pair both
      // baselines with this exact state — no false dirty, no stale restore.
      const nextRaw = { ...rawServerTopicsRef.current }
      for (const g of topicGroups) {
        const committed = draftTopicsRef.current[g.subject_name]
        if (committed) nextRaw[g.subject_name] = committed
      }
      rawServerTopicsRef.current = nextRaw
      captureBaselines({
        config: configRef.current,
        subjects: subjectsRef.current,
        topics: draftTopicsRef.current,
      })
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await lastSaveFactoryRef.current()
      setSaveSuccess(true)
      if (saveSuccessTimeoutRef.current) clearTimeout(saveSuccessTimeoutRef.current)
      saveSuccessTimeoutRef.current = setTimeout(() => setSaveSuccess(false), 3000)
      return true
    } catch (err: unknown) {
      setSaveError(toSaveError(err))
      return false
    } finally {
      setIsSaving(false)
    }
  }, [config, subjects, topicConfigs, user, validateParams, captureBaselines])

  const saveSubjectTest = useCallback(async (): Promise<boolean> => {
    if (!selectedExam || selectedExam === 'all' || !selectedSubject || selectedSubject === 'all') return false
    const topics = topicConfigs[selectedSubject]
    if (!topics || topics.length === 0) return false

    const paperId = selectedPaper === 'all' ? subjects[0]?.paper_id : selectedPaper
    if (!paperId) return false

    const modeTotal = Number(testMode)
    const topicSum = getTopicThresholdSum(topics, testMode as ConfigMode)

    // Mirror of the live RPC rules (INVALID_THRESHOLD / SUM_MISMATCH) so the
    // UI blocks impossible saves before they reach the backend.
    const belowMin = topics.filter(t => getTopicThreshold(t, testMode as ConfigMode) < TOPIC_MIN_REQUIRED)
    if (belowMin.length > 0) {
      setSaveError({ message: `Every topic requires at least ${TOPIC_MIN_REQUIRED} question (${belowMin.length} topic${belowMin.length > 1 ? 's' : ''} below minimum)`, retryable: false })
      return false
    }

    if (topicSum !== modeTotal) {
      setSaveError({ message: `Topic requirements must sum to exactly ${modeTotal} questions`, retryable: false })
      return false
    }

    // M-04 fix: before persisting the active mode, require the OTHER two
    // subject-test configurations to be internally consistent too. The live
    // RPC only sum-checks the single mode being saved, so without this the
    // test_30/test_50 columns could stay broken and a 30-/50-question test
    // would silently come up short. Making all three sizes consistent up
    // front keeps the subject-test config publish-ready across every size.
    const otherModes: ConfigMode[] = ['20', '30', '50'].filter(m => m !== testMode) as ConfigMode[]
    for (const m of otherModes) {
      const mTotal = Number(m)
      if (getTopicThresholdSum(topics, m) !== mTotal) {
        setSaveError({ message: `Test ${mTotal}-question topic requirements must sum to exactly ${mTotal} before saving (currently ${getTopicThresholdSum(topics, m)})`, retryable: false })
        return false
      }
      const belowMinOther = topics.filter(t => getTopicThreshold(t, m) < TOPIC_MIN_REQUIRED)
      if (belowMinOther.length > 0) {
        setSaveError({ message: `Test ${mTotal} questions: every topic requires at least ${TOPIC_MIN_REQUIRED} question (${belowMinOther.length} topic${belowMinOther.length > 1 ? 's' : ''} below minimum)`, retryable: false })
        return false
      }
    }

    // H-1: Store a factory that reads CURRENT state at retry time via refs.
    // The authoritative server readback lives INSIDE the factory so both the
    // direct save and a retry re-pair the dual baselines from LIVE truth
    // (BUG-B parity with the Exams-mode atomic path).
    lastSaveFactoryRef.current = async () => {
      const curExamId = selectedExamRef.current
      const curPaperId = selectedPaperRef.current === 'all' ? subjectsRef.current[0]?.paper_id : selectedPaperRef.current
      const curSubject = selectedSubject
      const curTopics = draftTopicsRef.current[curSubject]
      if (!curExamId || !curPaperId || !curSubject || !curTopics || curTopics.length === 0) return

      await adminService.saveSubjectTestConfiguration(
        { user, requestId: generateRequestId('save_subject_test') },
        curExamId, curPaperId, curSubject, testMode,
        curTopics.map(t => {
          const key = testMode === '20' ? 'test_20_required' : testMode === '30' ? 'test_30_required' : 'test_50_required'
          return { topic_id: t.id, required_questions: t[key] }
        })
      )
      // Section 24: server readback — the UI must reflect authoritative LIVE
      // values after a successful save, never the submitted draft. This
      // refetch also re-establishes the dual baseline from server truth.
      await fetchTopicConfig(curSubject)
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await lastSaveFactoryRef.current()
      setSaveSuccess(true)
      if (saveSuccessTimeoutRef.current) clearTimeout(saveSuccessTimeoutRef.current)
      saveSuccessTimeoutRef.current = setTimeout(() => setSaveSuccess(false), 3000)
      return true
    } catch (err: unknown) {
      setSaveError(toSaveError(err))
      return false
    } finally {
      setIsSaving(false)
    }
  }, [selectedExam, selectedPaper, selectedSubject, testMode, topicConfigs, subjects, user, fetchTopicConfig])

  const handleSave = pageMode === 'exams' ? saveAll : saveSubjectTest

  /** Save Changes from the confirmation modal: run the EXISTING save path;
   *  only on success resolve the pending selection (§15). Failure keeps the
   *  modal open with the canonical inline error (§17). */
  const saveAndSwitch = useCallback(async () => {
    const action = pendingSelection
    if (!action || isSaving) return
    const ok = await handleSave()
    if (!ok) return
    setPendingSelection(null)
    if (action.kind === 'exam' || action.kind === 'paper') {
      // The URL-param switch refetches the entire exam tree authoritatively;
      // applying immediately avoids a redundant intermediate fetch cycle.
      applySelection(action)
    } else {
      // Stay in-context switches (subject/mode) benefit from a final
      // authoritative refresh of the saved data first (§30).
      if (pageMode === 'exams') await fetchData()
      applySelection(action)
    }
  }, [pendingSelection, isSaving, handleSave, applySelection, pageMode, fetchData])

  // H-1: Retry reads CURRENT state via factory ref, not stale closure
  const retrySave = useCallback(async () => {
    const factory = lastSaveFactoryRef.current
    if (!factory) return

    setIsSaving(true)
    setSaveError(null)
    try {
      await factory()
      setSaveSuccess(true)
      if (saveSuccessTimeoutRef.current) clearTimeout(saveSuccessTimeoutRef.current)
      saveSuccessTimeoutRef.current = setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: unknown) {
      setSaveError(toSaveError(err))
    } finally {
      setIsSaving(false)
    }
  }, [])

  const resetSaveStatus = useCallback(() => {
    setSaveError(null)
    setSaveSuccess(false)
  }, [])

  const handleTopicThresholdChange = useCallback((subjectName: string, topicId: string, value: number) => {
    resetSaveStatus()
    // Track the hand-edited draft so redistribution never clobbers it until
    // fresh server data arrives.
    userEditedKeysRef.current.add(draftKey(subjectName, pageMode === 'exams' ? 'exam' : testMode))
    const list = draftTopicsRef.current[subjectName]
    if (!list) return
    const key = pageMode === 'exams' ? 'required_questions' : testMode === '20' ? 'test_20_required' : testMode === '30' ? 'test_30_required' : 'test_50_required'
    const next = {
      ...draftTopicsRef.current,
      [subjectName]: list.map(t => t.id === topicId ? { ...t, [key]: value } : t),
    }
    draftTopicsRef.current = next
    setTopicConfigs(next)
  }, [pageMode, testMode, resetSaveStatus, draftKey])

  const handleQuestionCountChange = useCallback((index: number, value: number) => {
    resetSaveStatus()
    setSubjects(prev => {
      const next = [...prev]
      next[index] = { ...next[index], question_count: value }
      return next
    })
  }, [resetSaveStatus])

  const handleConfigChange = useCallback((newConfig: ExamConfig) => {
    resetSaveStatus()
    setConfig(newConfig)
  }, [resetSaveStatus])

  const handleParamsBlur = useCallback((field: keyof ParamsFieldErrors) => {
    if (!submittedRef.current || !config) return
    const { fieldErrors } = validateParams(config)
    setParamsFieldErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
  }, [config, validateParams])

  const handleSubjectBlur = useCallback(() => {
    if (!submittedRef.current || !config) return
    const totalQ = subjectsRef.current.reduce((sum, s) => sum + (Number(s.question_count) || 0), 0)
    setSubjectsError(totalQ !== Number(config.total_questions) ? EXAM_SUBJECTS_SUM_MESSAGE : undefined)
  }, [config])

  // Subject Test status for the active (subject, mode) pair — drives the
  // CONFIGURED summary and the Save button enable/disable state.
  const selectedSubjectTopics = selectedSubject && selectedSubject !== 'all'
    ? topicConfigs[selectedSubject] ?? null
    : null
  const subjectTestSum = selectedSubjectTopics
    ? getTopicThresholdSum(selectedSubjectTopics, testMode as ConfigMode)
    : 0
  const subjectTestTotal = Number(testMode)
  const hasMinViolation = !!selectedSubjectTopics && selectedSubjectTopics.some(
    t => getTopicThreshold(t, testMode as ConfigMode) < TOPIC_MIN_REQUIRED
  )
  const subjectTestValid = !!selectedSubjectTopics && selectedSubjectTopics.length > 0
    && subjectTestSum === subjectTestTotal && !hasMinViolation

  // Auto-default selection for Subject Test — PROGRAMMATIC (§27/§30): uses the
  // raw URL setter directly and must never route through the confirmation
  // guard nor mark the draft dirty.
  useEffect(() => {
    if (pageMode !== 'subject_test' || isLoading || subjects.length === 0) return
    const current = selectedSubject
    const stale = current === 'all' || !subjects.some(s => s.subject_name === current)
    if (stale) {
      const first = subjects[0].subject_name
      setSelectedSubjectRaw(first)
      const cached = draftTopicsRef.current[first]
      if (cached && cached.length > 0) ensureCachedDistribution(first, cached)
    }
  }, [pageMode, isLoading, subjects, selectedSubject, setSelectedSubjectRaw, ensureCachedDistribution])

  return {
    user, selectedExam, selectedPaper, selectedSubject,
    // Guarded user-facing setters: clean → immediate switch, dirty → modal.
    setSelectedExam: (value: string) => requestSelection({ kind: 'exam', value }),
    setSelectedPaper: (value: string) => requestSelection({ kind: 'paper', value }),
    setSelectedSubject: (value: string) => requestSelection({ kind: 'subject', value }),
    config, setConfig: handleConfigChange, subjects,
    isLoading, isSaving, isModalOpen, setIsModalOpen,
    tabsKey, setTabsKey,
    paramsFieldErrors, subjectsError,
    handleSave,
    handleParamsBlur, handleSubjectBlur,
    handleQuestionCountChange,
    pageMode, setPageMode: (value: PageMode) => requestSelection({ kind: 'page_mode', value }),
    testMode, setTestMode: (value: TestMode) => requestSelection({ kind: 'test_mode', value }),
    topicConfigs, topicLoading,
    /** BUG-C: message of the current save failure (null when none). */
    topicError: saveError?.message ?? null,
    /** BUG-C: true ONLY for transport/backend failures where a valid
     *  current-context retry factory exists. Validation rejections are never
     *  retryable. */
    saveRetryable: saveError?.retryable === true && lastSaveFactoryRef.current !== null,
    saveSuccess, isDirty, draftDivergesFromServer,
    subjectTestSum, subjectTestValid,
    handleTopicThresholdChange,
    pageError, retryLoad: fetchData, retrySave,
    pendingSelection, stayHere, discardForSwitch, saveAndSwitch,
  }
}

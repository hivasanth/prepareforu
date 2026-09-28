import type { Question } from '../types/exam.types'
import { resolveExamIds, resolveAdminExamId } from '../lib/examUtils'
import { generateQuestionHash } from '../utils/hashUtils'
import { retryWithBackoff } from '../utils/retryUtils'
import { getCache, setCache, invalidateCache } from './adminQueryCache'
import { logInfo, logError, logWarn, metric, sanitizeError } from '../utils/logger'
import { alertEval } from '../observability/alertEvaluator'
import { THRESHOLDS } from '../observability/thresholds'
import { ensureRole } from '../utils/authUtils'
import * as examRepo from '../lib/repositories/exam.repository'
import * as questionRepo from '../lib/repositories/question.repository'
import { normalizeVisualInput } from './questions/visualNormalizer'
import type { UserProfile, AuthError, ServiceResult } from '../types/auth.types'
import type { ExamTopicRecordRow, ExamTopicRow } from '../lib/repositories/exam.repository'

// ─── Phase 6 Contract (LOCKED) ────────────────────────────────────────────────
// _en fields are the ONLY source of truth for question content.
// Legacy fields (question_text, option_a/b/c/d, explanation) have been REMOVED
// from the database schema. DO NOT reintroduce them in SELECT, INSERT, or UPDATE.
// ─────────────────────────────────────────────────────────────────────────────

function asError(message: string): AuthError {
  return { source: 'db', code: 'UNKNOWN', message }
}

export interface ListQuestionsParams {
  selectedExam: string
  selectedPaper: string
  selectedSubject: string
  /** Canonical exam_topics id (or legacy id-less topic_en) — 'all'/'' = no topic filter. */
  selectedTopic: string
  difficultyFilter: string
  /** 'visuals' restricts to rows with a valid canonical visual; 'all' = no visual filter. */
  visualFilter: 'all' | 'visuals'
  searchQuery: string
  offset: number
  pageSize: number
}

/** Matches canonical UUID topic ids (exam_topics.id) — everything else is
 *  treated as a legacy id-less topic_en. */
function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}



export const adminQuestionService = {
  /**
   * Register a topic in exam_topics if it doesn't already exist
   */
  async registerTopicIfNeeded(
    examId: string,
    paperId: string | null,
    subjectName: string,
    topicEn: string | null,
    topicTe: string | null,
    ctx: { requestId?: string } = {}
  ): Promise<void> {
    if (!topicEn || !topicEn.trim()) return
    const resolvedExamId = resolveAdminExamId(examId)
    
    try {
      const payload = {
        exam_id: resolvedExamId,
        paper_id: paperId || null,
        subject_name: subjectName,
        topic_en: topicEn.trim(),
        topic_te: topicTe?.trim() || null
      }

      try {
        await examRepo.upsertTopic(payload)
      } catch (error: any) {
        logWarn('topics.register.error', { error, payload: { exam_id: payload.exam_id, paper_id: payload.paper_id, subject_name: payload.subject_name }, requestId: ctx.requestId })
      }
    } catch (err: any) {
      logError('topics.register.exception', { error: err.message, requestId: ctx.requestId })
    }
  },

  /**
   * List questions with standard admin filters
   */
  async listQuestions(params: ListQuestionsParams, ctx: { requestId?: string, user?: UserProfile | null } = {}): Promise<ServiceResult<Question[]>> {
    const start = performance.now()
    const { requestId } = ctx
    const cacheKey = `questions:${JSON.stringify(params)}`
    const cached = getCache<ServiceResult<Question[]>>(cacheKey)
    if (cached) {
      metric('questions.list.duration_ms', Math.round(performance.now() - start), { cached: true, requestId })
      return cached
    }

    try {
      const resolvedIds = resolveExamIds(params.selectedExam)

      /* Topic filter authority — the selected topic is resolved against the
       * LIVE exam_topics table only (never trusted from the URL). A UUID value
       * is resolved by canonical id and its segment (exam/paper/subject) checked
       * against the current selections. A legacy id-less topic_en passes
       * through ONLY after it is verified present in the live topic list for
       * this exact segment. Any failure returns a friendly error instead of
       * leaking rows from an unrelated segment identity. */
      let pTopicEn: string | null = null
      if (params.selectedTopic && params.selectedTopic !== 'all') {
        if (isUuidLike(params.selectedTopic)) {
          let canonical: ExamTopicRecordRow | null = null
          try {
            canonical = await retryWithBackoff<any>(() => examRepo.fetchTopicById(params.selectedTopic))
          } catch (err: any) {
            logError('questions.list.topic_fetch.error', { requestId, error: sanitizeError(err) })
            return { success: false, data: null, error: asError('Could not verify the selected topic. Please try again.') }
          }
          if (!canonical) {
            logWarn('questions.list.topic_not_found', { requestId, topic_id: params.selectedTopic })
            return { success: false, data: null, error: asError('The selected topic could not be found. Refresh topics and try again.') }
          }
          if (!resolvedIds.includes(canonical.exam_id) ||
              (params.selectedPaper !== 'all' && (canonical.paper_id ?? '') !== params.selectedPaper) ||
              (params.selectedSubject !== 'all' && canonical.subject_name !== params.selectedSubject)) {
            logWarn('questions.list.topic_segment_mismatch', { requestId, topic_id: params.selectedTopic })
            return { success: false, data: null, error: asError('Selected topic does not belong to this exam, paper and subject.') }
          }
          pTopicEn = canonical.topic_en
        } else {
          // Legacy id-less topic_en: verify membership in the segment's live
          // topic list before trusting the name. A 'all' subject cannot be
          // validated, so it is rejected rather than leaking unrelated rows.
          if (params.selectedSubject === 'all') {
            logWarn('questions.list.topic_name_unguarded', { requestId, topic_en: params.selectedTopic })
            return { success: false, data: null, error: asError('Selected topic does not belong to this exam, paper and subject.') }
          }
          let segmentTopics: ExamTopicRow[] | null = null
          try {
            segmentTopics = await retryWithBackoff<any>(() =>
              examRepo.fetchTopicsBySubject(
                resolvedIds,
                params.selectedSubject,
                params.selectedPaper === 'all' ? undefined : params.selectedPaper
              )
            )
          } catch (err: any) {
            logError('questions.list.topic_list.error', { requestId, error: sanitizeError(err) })
            return { success: false, data: null, error: asError('Could not verify the selected topic. Please try again.') }
          }
          const isMember = (segmentTopics ?? []).some(t => t.topic_en === params.selectedTopic)
          if (!isMember) {
            logWarn('questions.list.topic_name_unverified', { requestId, topic_en: params.selectedTopic })
            return { success: false, data: null, error: asError('The selected topic could not be found. Refresh topics and try again.') }
          }
          pTopicEn = params.selectedTopic
        }
      }

      // F-07: admin list reads through the role-gated SECURITY DEFINER RPC;
      // key/explanation columns are revoked from REST for the shared role.
      const { data, count } = await retryWithBackoff<any>(async () =>
        questionRepo.adminListQuestionsRpc({
          resolvedIds,
          selectedPaper: params.selectedPaper,
          selectedSubject: params.selectedSubject,
          selectedTopic: pTopicEn,
          difficultyFilter: params.difficultyFilter,
          visualOnly: params.visualFilter === 'visuals',
          searchQuery: params.searchQuery.trim(),
          offset: params.offset,
          pageSize: params.pageSize,
          sortColumn: 'updated_at',
          sortAscending: false,
        })
      )

      const response: ServiceResult<Question[]> = {
        success: true,
        data: (data as Question[]) || [],
        meta: { count: count || 0 }
      }
      
      const duration = Math.round(performance.now() - start)
      
      // Sampling for high-frequency successful operations (20%)
      if (Math.random() < 0.2) {
        logInfo('questions.list.success', { requestId,
          duration_ms: duration,
          count: (data as any[])?.length || 0,
          filters: { exam: params.selectedExam, paper: params.selectedPaper }
        })
      }

      metric('questions.list.duration_ms', duration, { cached: false, requestId })

      if (duration > THRESHOLDS.slowQueryMs) {
        logWarn('questions.list.slow', { requestId, duration_ms: duration })
        alertEval('slow_query', { requestId, duration_ms: duration, operation: 'listQuestions' })
      }

      setCache(cacheKey, response)
      return response
    } catch (err: any) {
      const duration = Math.round(performance.now() - start)
      const error = sanitizeError(err)
      logError('questions.list.error', { requestId,
        duration_ms: duration,
        error
      })
      metric('questions.list.error.count', 1, { requestId })
      
      if (error.is_server_error) {
        alertEval('api_error', { requestId, operation: 'listQuestions', error })
      }
      return { success: false, data: null, error: asError(err.message || 'Failed to list questions') }
    }
  },

  /**
   * Create a single question
   * DEF-1 fix: register topic BEFORE question insert so the DB trigger can validate it.
   * DEF-5 fix: return explicit duplicate status instead of silent success.
   * M2 fix: when a canonical topicId is provided (manual upload launched from a
   * LIVE topic card), that record is the ONLY topic authority — resolved via
   * fetchTopicById, segment-checked against the payload, and its canonical
   * topic_en/topic_te overwrite any UI-supplied strings. No silent topic
   * registration happens on this path; unresolvable/cross-segment topics are
   * rejected BEFORE the question write with friendly messages.
   */
  async createQuestion(
    payload: Partial<Question>,
    ctx: { requestId?: string, user?: UserProfile | null, topicId?: string | null } = {}
  ): Promise<ServiceResult<{ status: 'inserted' | 'duplicate' }>> {
    const start = performance.now()
    const { requestId, user, topicId } = ctx
    try {
      ensureRole({ user, allowedRoles: ['admin'], operation: 'createQuestion', requestId })

      // ── M2: canonical topic_id authority (same chain as bulk upload) ──────
      let effectivePayload = payload
      if (topicId) {
        let canonical: ExamTopicRecordRow | null = null
        try {
          canonical = await retryWithBackoff<any>(() => examRepo.fetchTopicById(topicId))
        } catch (err: any) {
          logError('questions.create.topic_fetch.error', { requestId, error: sanitizeError(err) })
          return { success: false, data: null, error: asError('Could not verify the selected topic. Please try again.') }
        }
        if (!canonical) {
          logWarn('questions.create.topic_not_found', { requestId, topic_id: topicId })
          return { success: false, data: null, error: asError('The selected topic could not be found. Refresh topics and try again.') }
        }
        if ((payload.exam_id || '') !== canonical.exam_id ||
            (payload.paper_id || '') !== (canonical.paper_id || '') ||
            (payload.subject_name || '') !== canonical.subject_name) {
          logWarn('questions.create.topic_segment_mismatch', { requestId, topic_id: topicId })
          return { success: false, data: null, error: asError('Selected topic does not belong to this exam, paper and subject.') }
        }
        // Identity comes from exam_topics — never from UI display strings.
        effectivePayload = {
          ...payload,
          topic_en: canonical.topic_en,
          topic_te: canonical.topic_te,
        }
      } else if (payload.topic_en) {
        // Legacy non-canonical path (no topicId — e.g. derived id-less topics):
        // DEF-1 registration retained ONLY here, never on the canonical path.
        await adminQuestionService.registerTopicIfNeeded(
          payload.exam_id || '',
          payload.paper_id || null,
          payload.subject_name || '',
          payload.topic_en,
          payload.topic_te || null,
          { requestId }
        )
      }

      // Single visual normalization authority: legacy visual_engine → canonical visual
      const normalizedPayload = { ...effectivePayload, visual: normalizeVisualInput(effectivePayload.visual) }

      const hashPayload = {
        ...normalizedPayload,
        content_hash: await generateQuestionHash(normalizedPayload as any)
      }
      const { inserted } = await retryWithBackoff<any>(async () =>
        questionRepo.upsertQuestion(hashPayload)
      )

      invalidateCache()
      
      logInfo('questions.create.success', { requestId,
        duration_ms: Math.round(performance.now() - start),
        status: inserted ? 'inserted' : 'duplicate',
        topic_id: topicId ?? undefined
      })

      return { success: true, data: { status: inserted ? 'inserted' : 'duplicate' } }
    } catch (err: any) {
      const duration = Math.round(performance.now() - start)
      const error = sanitizeError(err)
      logError('questions.create.error', { requestId,
        duration_ms: duration,
        error
      })
      metric('questions.create.error.count', 1, { requestId })

      if (error.is_server_error) {
        alertEval('api_error', { requestId, operation: 'createQuestion', error })
      }
      return { success: false, data: null, error: asError(err.message || 'Failed to create question') }
    }
  },

  /**
   * Update a single question
   * DEF-2 fix: register target topic BEFORE the update so the trigger can validate it.
   */
  async updateQuestion(id: string, payload: Partial<Question>, ctx: { requestId?: string, user?: UserProfile | null } = {}): Promise<ServiceResult<null>> {
    const start = performance.now()
    const { requestId, user } = ctx
    try {
      ensureRole({ user, allowedRoles: ['admin'], operation: 'updateQuestion', requestId })

      // DEF-2: Register target topic FIRST before the question update reaches the DB.
      // Use the payload's exam/paper/subject/topic (the target state), not the old record.
      if (payload.topic_en) {
        await adminQuestionService.registerTopicIfNeeded(
          payload.exam_id || '',
          payload.paper_id || null,
          payload.subject_name || '',
          payload.topic_en,
          payload.topic_te || null,
          { requestId }
        )
      }

      // Single visual normalization authority: legacy visual_engine → canonical visual
      const normalizedPayload = { ...payload, visual: normalizeVisualInput(payload.visual) }

      // Re-derive content_hash from the incoming hash inputs so edits stay
      // dedupable and the stored hash matches content (audit finding fix).
      const payloadWithHash = {
        ...normalizedPayload,
        content_hash: await generateQuestionHash(normalizedPayload as any)
      }

      await retryWithBackoff<any>(async () =>
        questionRepo.updateQuestion(id, payloadWithHash)
      )

      invalidateCache()

      logInfo('questions.update.success', { requestId,
        id,
        duration_ms: Math.round(performance.now() - start)
      })

      return { success: true, data: null }
    } catch (err: any) {
      const duration = Math.round(performance.now() - start)
      const error = sanitizeError(err)
      logError('questions.update.error', { requestId,
        id,
        duration_ms: duration,
        error
      })
      metric('questions.update.error.count', 1, { requestId, id })

      if (error.is_server_error) {
        alertEval('api_error', { requestId, operation: 'updateQuestion', id, error })
      }
      const isDuplicate = err?.code === '23505' || /duplicate key|unique constraint/i.test(err?.message || '')
      return { success: false, data: null, error: asError(isDuplicate ? 'Question already exists (duplicate detected).' : err.message || 'Failed to update question') }
    }
  },

  /**
   * Delete a single question
   */
  async deleteQuestion(id: string, ctx: { requestId?: string, user?: UserProfile | null } = {}): Promise<ServiceResult<null>> {
    const start = performance.now()
    const { requestId, user } = ctx
    try {
      ensureRole({ user, allowedRoles: ['admin'], operation: 'deleteQuestion', requestId })

      const referencedIds: string[] = await retryWithBackoff(async () =>
        questionRepo.findVelocityReferencedQuestionIds([id])
      )

      if (referencedIds.length > 0) {
        await retryWithBackoff<any>(async () =>
          questionRepo.deactivateQuestion(id)
        )
        invalidateCache()
        logInfo('questions.delete.archived', { requestId, id, reason: 'referenced_by_exam_velocity_logs' })
        return { success: true, data: null }
      }

      await retryWithBackoff<any>(async () =>
        questionRepo.deleteQuestion(id)
      )
      invalidateCache()

      logInfo('questions.delete.success', { requestId,
        id,
        duration_ms: Math.round(performance.now() - start)
      })

      return { success: true, data: null }
    } catch (err: any) {
      const duration = Math.round(performance.now() - start)
      const error = sanitizeError(err)
      logError('questions.delete.error', { requestId,
        id,
        duration_ms: duration,
        error
      })
      metric('questions.delete.error.count', 1, { requestId, id })

      if (error.is_server_error) {
        alertEval('api_error', { requestId, operation: 'deleteQuestion', id, error })
      }
      return { success: false, data: null, error: asError(err.message || 'Failed to delete question') }
    }
  },

  /**
   * Bulk delete questions
   */
  async bulkDeleteQuestions(ids: string[], ctx: { requestId?: string, user?: UserProfile | null } = {}): Promise<ServiceResult<null>> {
    const start = performance.now()
    const { requestId, user } = ctx
    try {
      ensureRole({ user, allowedRoles: ['admin'], operation: 'bulkDeleteQuestions', requestId })

      const referencedIds: string[] = await retryWithBackoff(async () =>
        questionRepo.findVelocityReferencedQuestionIds(ids)
      )
      const referencedSet = new Set(referencedIds)
      const hardDeleteIds = ids.filter(x => !referencedSet.has(x))

      if (hardDeleteIds.length > 0) {
        await retryWithBackoff<any>(async () =>
          questionRepo.bulkDeleteQuestions(hardDeleteIds)
        )
      }
      for (const archivedId of referencedSet) {
        await retryWithBackoff<any>(async () =>
          questionRepo.deactivateQuestion(archivedId)
        )
      }
      invalidateCache()

      logInfo('bulk.questions.delete.success', { requestId,
        count: hardDeleteIds.length,
        archived: referencedSet.size,
        duration_ms: Math.round(performance.now() - start)
      })

      return { success: true, data: null }
    } catch (err: any) {
      logError('bulk.questions.delete.error', { requestId,
        duration_ms: Math.round(performance.now() - start),
        error: sanitizeError(err)
      })
      return { success: false, data: null, error: asError(err.message || 'Failed to bulk delete questions') }
    }
  },

  /**
   * Bulk insert a chunk of questions.
   *
   * FINAL DATA ARCHITECTURE — STRICT REJECT ingestion policy:
   *  - ctx.topicId is REQUIRED. The caller's selected topic is the ONLY
   *    authority; unknown topics are never auto-registered (no catalog
   *    pollution, unlike the manual single-question flow).
   *  - The canonical topic row is fetched once via examRepo.fetchTopicById and
   *    EVERY row must belong to its segment (exam/paper/subject) and echo the
   *    canonical topic_en/topic_te byte-exactly (§42: a null canonical Telugu
   *    accepts absent/null/'', but rejects fabricated Telugu).
   *  - Violations surface as DEF-4 row failures with friendly messages; SQL or
   *    constraint internals never reach the UI.
   */
  async bulkInsertQuestions(
    payload: Partial<Question>[],
    ctx: { requestId?: string, user?: UserProfile | null, topicId: string }
  ): Promise<ServiceResult<{ inserted: number; duplicated: number; failed: number; failures: { index: number; error: string }[] }>> {
    const start = performance.now()
    const { requestId, user, topicId } = ctx
    logInfo('bulk.questions.start', { requestId, count: payload.length, topic_id: topicId ?? undefined })
    try {
      ensureRole({ user, allowedRoles: ['admin'], operation: 'bulkInsertQuestions', requestId })

      if (!topicId) {
        logWarn('bulk.questions.no_topic', { requestId })
        return { success: false, data: null, error: asError('Select a topic before syncing questions.') }
      }

      let topic: ExamTopicRecordRow | null = null
      try {
        topic = await retryWithBackoff<any>(() => examRepo.fetchTopicById(topicId))
      } catch (err: any) {
        logError('bulk.questions.topic_fetch.error', { requestId, error: sanitizeError(err) })
        return { success: false, data: null, error: asError('Could not verify the selected topic. Please try again.') }
      }
      if (!topic) {
        logWarn('bulk.questions.topic_not_found', { requestId, topic_id: topicId })
        return { success: false, data: null, error: asError('The selected topic could not be found. Refresh topics and try again.') }
      }
      // Narrowed canonical authority — closures below read it safely.
      const authority = topic

      // STRICT REJECT row validator — returns a friendly failure message or null.
      const validateRow = (q: Partial<Question>): string | null => {
        if ((q.exam_id || '') !== authority.exam_id ||
            (q.paper_id || '') !== (authority.paper_id || '') ||
            (q.subject_name || '') !== authority.subject_name) {
          return 'Selected topic does not belong to this exam, paper and subject.'
        }
        if (!q.topic_en || q.topic_en !== authority.topic_en) {
          return `Topic mismatch: questions in this upload must use "${authority.topic_en}" exactly.`
        }
        if (authority.topic_te == null) {
          // §42: no canonical Telugu → absent / empty accepted, fabricated rejected.
          if (q.topic_te != null && q.topic_te.trim() !== '') {
            return 'Telugu topic mismatch: this topic has no Telugu name, so topic_te must be omitted.'
          }
        } else if (q.topic_te !== authority.topic_te) {
          return `Telugu topic mismatch: questions must use "${authority.topic_te}" exactly.`
        }
        return null
      }

      const payloadWithHash = await Promise.all(
        payload.map(async (q) => ({
          ...q,
          visual: normalizeVisualInput(q.visual),
          content_hash: await generateQuestionHash(q as any)
        }))
      )

      if (payloadWithHash.length > 0) {
        logInfo('bulk.questions.payload_sample', { requestId, sampleSize: payloadWithHash.length, firstId: payloadWithHash[0].content_hash?.slice(0, 8) })
      }

      const failures: { index: number; error: string }[] = []
      let insertedCount = 0
      let duplicateCount = 0

      // Sequential bypass: Insert one by one to satisfy restrictive RLS policies
      for (let i = 0; i < payloadWithHash.length; i++) {
        const q = payloadWithHash[i]
        // STRICT REJECT: topic validation happens BEFORE any DB write attempt.
        const rejection = validateRow(q)
        if (rejection) {
          failures.push({ index: i, error: rejection })
          logWarn('bulkInsert.row_topic_rejected', {
            row: i,
            subject: q.subject_name,
            reason: rejection,
            requestId
          })
          continue
        }
        try {
          // DEF-5: capture whether insert was actual or duplicate
          const { inserted } = await questionRepo.upsertQuestionNoIgnore(q)
          if (inserted) {
            insertedCount++
          } else {
            duplicateCount++
          }
        } catch (err: any) {
          // DEF-4: collect failure and continue — do NOT throw
          failures.push({ index: i, error: err.message || 'Unknown error' })
          logError('bulkInsert.row_failure', {
            error: err.message,
            row: i,
            subject: q.subject_name,
            requestId
          })
        }
      }

      invalidateCache()
      
      const duration = performance.now() - start
      logInfo('bulk.questions.complete', { requestId, 
        duration_ms: Math.round(duration),
        inserted_count: insertedCount,
        duplicate_count: duplicateCount,
        failed_count: failures.length
      })

      return { 
        success: failures.length === 0, 
        data: { inserted: insertedCount, duplicated: duplicateCount, failed: failures.length, failures },
        error: failures.length > 0 ? asError(`${failures.length} of ${payload.length} questions failed`) : undefined
      }
    } catch (err: any) {
      const duration = Math.round(performance.now() - start)
      const error = sanitizeError(err)
      logError('bulk.questions.error', { requestId,
        duration_ms: duration,
        error
      })
      metric('bulk.questions.error.count', 1, { requestId })

      alertEval('bulk_failure_rate', { 
        requestId, 
        operation: 'bulkInsertQuestions', 
        failure_ratio: 1.0, 
        count: payload.length,
        error 
      })

      return { success: false, data: null, error: asError(err.message || 'Failed to insert question chunk') }
    }
  },

  /**
   * List prompt templates for a specific context. When topicId is provided the
   * collection is scoped DB-side to that single topic (topic_id identity).
   */
  async listPrompts(
    examId: string,
    paperId: string,
    subjectName: string,
    ctx: { requestId?: string, user?: UserProfile | null } = {},
    topicId: string | null = null
  ): Promise<ServiceResult<any[]>> {
    const start = performance.now()
    const { requestId } = ctx
    // Cache is isolated per topic so A → B → A never leaks another topic's prompts.
    const cacheKey = `prompts:${examId}:${paperId}:${subjectName}:${topicId ?? 'all'}`
    const cached = getCache<ServiceResult<any[]>>(cacheKey)
    if (cached) {
      metric('prompts.list.duration_ms', Math.round(performance.now() - start), { cached: true, requestId })
      return cached
    }

    try {
      const data = await retryWithBackoff<any>(async () =>
        examRepo.fetchPrompts(examId, paperId, subjectName, topicId)
      )
      const response: ServiceResult<any[]> = { success: true, data: data || [] }
      
      const duration = Math.round(performance.now() - start)
      logInfo('prompts.list.success', { requestId,
        duration_ms: duration,
        examId
      })
      metric('prompts.list.duration_ms', duration, { cached: false, requestId })

      setCache(cacheKey, response)
      return response
    } catch (err: any) {
      const duration = Math.round(performance.now() - start)
      const error = sanitizeError(err)
      logError('prompts.list.error', { requestId,
        duration_ms: duration,
        error
      })
      metric('prompts.list.error.count', 1, { requestId })

      if (error.is_server_error) {
        alertEval('api_error', { requestId, operation: 'listPrompts', error })
      }
      return { success: false, data: null, error: asError(err.message || 'Failed to list prompts') }
    }
  },

  /**
   * Upsert a prompt template
   */
  async upsertPrompt(payload: any, ctx: { requestId?: string, user?: UserProfile | null } = {}): Promise<ServiceResult<null>> {
    const start = performance.now()
    const { requestId, user } = ctx
    try {
      ensureRole({ user, allowedRoles: ['admin'], operation: 'upsertPrompt', requestId })
      await retryWithBackoff<any>(async () =>
        examRepo.upsertPrompt(payload)
      )
      invalidateCache()
      
      logInfo('prompts.upsert.success', { requestId,
        id: payload.id,
        duration_ms: Math.round(performance.now() - start)
      })

      return { success: true, data: null }
    } catch (err: any) {
      logError('prompts.upsert.error', { requestId,
        id: payload.id,
        duration_ms: Math.round(performance.now() - start),
        error: sanitizeError(err)
      })
      return { success: false, data: null, error: asError(err.message || 'Failed to save prompt') }
    }
  },

  /**
   * Delete a prompt template
   */
  async deletePrompt(id: string, ctx: { requestId?: string, user?: UserProfile | null } = {}): Promise<ServiceResult<null>> {
    const start = performance.now()
    const { requestId, user } = ctx
    try {
      ensureRole({ user, allowedRoles: ['admin'], operation: 'deletePrompt', requestId })
      await retryWithBackoff<any>(async () =>
        examRepo.deletePromptById(id)
      )
      invalidateCache()
      
      logInfo('prompts.delete.success', { requestId,
        id,
        duration_ms: Math.round(performance.now() - start)
      })

      return { success: true, data: null }
    } catch (err: any) {
      logError('prompts.delete.error', { requestId,
        id,
        duration_ms: Math.round(performance.now() - start),
        error: sanitizeError(err)
      })
      return { success: false, data: null, error: asError(err.message || 'Failed to delete prompt') }
    }
  },

  async countQuestions(params: {
    examId: string
    paperId: string
    subjectName: string
  }): Promise<number> {
    // H1 contract: a valid count of 0 and a FAILED request are different
    // states. This method must never swallow a failure into 0 — errors are
    // retried transiently, then PROPAGATED so the UI can render its error
    // state instead of a valid-looking "0 questions".
    try {
      const count = await retryWithBackoff(async () =>
        questionRepo.countQuestionsByFilter(params)
      )
      return count ?? 0
    } catch (error: any) {
      logError('adminQuestionService.countQuestions', { message: error?.message })
      throw error
    }
  }
}

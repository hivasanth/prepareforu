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
import type { UserProfile, AuthError, ServiceResult } from '../types/auth.types'

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
  difficultyFilter: string
  searchQuery: string
  offset: number
  pageSize: number
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
      const { data, count, error } = await retryWithBackoff<any>(async () =>
        questionRepo.listQuestions({
          resolvedIds,
          selectedPaper: params.selectedPaper,
          selectedSubject: params.selectedSubject,
          difficultyFilter: params.difficultyFilter,
          searchQuery: params.searchQuery.trim(),
          offset: params.offset,
          pageSize: params.pageSize,
          sortColumn: 'updated_at',
          sortAscending: false,
        })
      )
      if (error) throw error

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
   */
  async createQuestion(payload: Partial<Question>, ctx: { requestId?: string, user?: UserProfile | null } = {}): Promise<ServiceResult<null>> {
    const start = performance.now()
    const { requestId, user } = ctx
    try {
      ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'createQuestion', requestId })
      const hashPayload = {
        ...payload,
        content_hash: await generateQuestionHash(payload as any)
      }
      await retryWithBackoff<any>(async () =>
        questionRepo.upsertQuestion(hashPayload)
      )

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

      invalidateCache()
      
      logInfo('questions.create.success', { requestId,
        duration_ms: Math.round(performance.now() - start)
      })

      return { success: true, data: null }
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
   */
  async updateQuestion(id: string, payload: Partial<Question>, ctx: { requestId?: string, user?: UserProfile | null } = {}): Promise<ServiceResult<null>> {
    const start = performance.now()
    const { requestId, user } = ctx
    try {
      ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'updateQuestion', requestId })
      await retryWithBackoff<any>(async () =>
        questionRepo.updateQuestion(id, payload)
      )

      if (payload.topic_en) {
        const qData = await questionRepo.fetchQuestionMeta(id).catch(() => null)
          
        if (qData && (qData.topic_en as string)) {
          await adminQuestionService.registerTopicIfNeeded(
            qData.exam_id as string,
            qData.paper_id as string | null,
            qData.subject_name as string,
            qData.topic_en as string,
            qData.topic_te as string | null,
            { requestId }
          )
        }
      }

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
      return { success: false, data: null, error: asError(err.message || 'Failed to update question') }
    }
  },

  /**
   * Delete a single question
   */
  async deleteQuestion(id: string, ctx: { requestId?: string, user?: UserProfile | null } = {}): Promise<ServiceResult<null>> {
    const start = performance.now()
    const { requestId, user } = ctx
    try {
      ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'deleteQuestion', requestId })
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
      ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'bulkDeleteQuestions', requestId })
      await retryWithBackoff<any>(async () =>
        questionRepo.bulkDeleteQuestions(ids)
      )
      invalidateCache()

      logInfo('bulk.questions.delete.success', { requestId,
        count: ids.length,
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
   * Bulk insert a chunk of questions
   */
  async bulkInsertQuestions(payload: Partial<Question>[], ctx: { requestId?: string, user?: UserProfile | null } = {}): Promise<ServiceResult<null>> {
    const start = performance.now()
    const { requestId, user } = ctx
    logInfo('bulk.questions.start', { requestId, count: payload.length })
    try {
      ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'bulkInsertQuestions', requestId })
      const payloadWithHash = await Promise.all(
        payload.map(async (q) => ({
          ...q,
          content_hash: await generateQuestionHash(q as any)
        }))
      )
      
      if (payloadWithHash.length > 0) {
        logInfo('bulk.questions.payload_sample', { requestId, sampleSize: payloadWithHash.length, firstId: payloadWithHash[0].content_hash?.slice(0, 8) })
      }

      const errors: string[] = []
      let successCount = 0

      // Sequential bypass: Insert one by one to satisfy restrictive RLS policies
      // that might block bulk array inserts even for admins.
      for (const q of payloadWithHash) {
        try {
          await questionRepo.upsertQuestionNoIgnore(q)

          if (q.topic_en) {
            await adminQuestionService.registerTopicIfNeeded(
              q.exam_id || '',
              q.paper_id || null,
              q.subject_name || '',
              q.topic_en,
              q.topic_te || null,
              { requestId }
            )
          }

          successCount++
        } catch (err: any) {
          logError('bulkInsert.exception', { error: err.message, row: { subject: q.subject_name, id: q.content_hash?.slice(0, 8) }, requestId })
          throw err
        }
      }

      invalidateCache()
      
      const duration = performance.now() - start
      logInfo('bulk.questions.complete', { requestId, 
        duration_ms: Math.round(duration),
        success_count: successCount,
        error_count: errors.length
      })

      return { 
        success: errors.length === 0, 
        data: null, 
        error: errors.length > 0 ? asError(`Failed to insert ${errors.length} questions`) : undefined 
      }
    } catch (err: any) {
      const duration = Math.round(performance.now() - start)
      const error = sanitizeError(err)
      logError('bulk.questions.error', { requestId,
        duration_ms: duration,
        error
      })
      metric('bulk.questions.error.count', 1, { requestId })

      // Ratio-based alerting for bulk failures
      // Since this is a chunk level failure, we treat it as 100% failure for this chunk
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
   * List prompt templates for a specific context
   */
  async listPrompts(examId: string, paperId: string, subjectName: string, ctx: { requestId?: string, user?: UserProfile | null } = {}): Promise<ServiceResult<any[]>> {
    const start = performance.now()
    const { requestId } = ctx
    const cacheKey = `prompts:${examId}:${paperId}:${subjectName}`
    const cached = getCache<ServiceResult<any[]>>(cacheKey)
    if (cached) {
      metric('prompts.list.duration_ms', Math.round(performance.now() - start), { cached: true, requestId })
      return cached
    }

    try {
      const data = await retryWithBackoff<any>(async () =>
        examRepo.fetchPrompts(examId, paperId, subjectName)
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
      ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'upsertPrompt', requestId })
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
    try {
      return (await questionRepo.countQuestionsByFilter(params)) ?? 0
    } catch (error: any) {
      logError('adminQuestionService.countQuestions', { message: error.message })
      return 0
    }
  }
}

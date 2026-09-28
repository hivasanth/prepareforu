import { ensureRole } from '../utils/authUtils';
import type { UserProfile } from '../types/auth.types';
import type { ExamPaper, ExamSubject, ExamConfig } from '../types/exam.types';
import * as examRepo from '../lib/repositories/exam.repository';
import { logError } from '../utils/logger';
import { queryCache } from '../utils/queryCache';
import { normalizeHierarchyName, isBlankName } from '../utils/nameUtils';
import { errorFields } from '../utils/errorClassification';

/**
 * ADMIN SERVICE
 * Centralized service for global exam configurations and administrative tasks.
 */

export const adminService = {
  /**
   * Dynamically adds a new exam with its papers and subjects to the database.
   */
  async createNewExam(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    examData: {
      exam_id: string;
      name: string;
      exam_selection: string;
      total_questions: number;
      total_marks: number;
      duration_minutes: number;
      negative_marking: boolean;
      negative_mark_value: number;
      is_published: boolean;
      papers: {
        paper_name: string;
        stage?: 'PRELIMS' | 'MAINS' | 'SINGLE';
        total_questions: number;
        total_marks: number;
        duration_minutes: number;
        negative_marking: boolean;
        negative_mark_value: number;
      }[];
      subjects: {
        subject_name: string;
        question_count: number;
        marks_per_question: number;
      }[];
    }
  ): Promise<void> {
    const { user, requestId } = ctx;

    ensureRole({
      user,
      allowedRoles: ['admin'],
      operation: 'createNewExam',
      requestId
    });

    try {
      await examRepo.createNewExamRpc(examData);
    } catch (error) {
      const { message, code } = errorFields(error);
      logError('adminService.createNewExam (RPC)', { error: { message, code } });
      throw new Error(`Failed to create exam atomically: ${message}`);
    }
  },

  async fetchPapersByExam(examId: string): Promise<ExamPaper[]> {
    return (await examRepo.fetchPapersByExamId(examId)) ?? [];
  },

  async fetchSubjectsByPaper(paperId: string): Promise<ExamSubject[]> {
    return (await examRepo.fetchSubjectsByPaperId(paperId)) ?? [];
  },

  async fetchExamConfig(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    examId: string
  ): Promise<ExamConfig | null> {
    const { user, requestId } = ctx;

    ensureRole({
      user,
      allowedRoles: ['admin'],
      operation: 'fetchExamConfig',
      requestId
    });

    try {
      return await examRepo.findExamConfigById(examId);
    } catch (error) {
      const { message, code } = errorFields(error);
      logError('adminService.fetchExamConfig', { error: { message, code } });
      throw new Error('Failed to load exam configuration.');
    }
  },

  /**
   * BUG-A remediation: the ENTIRE Admin Settings EXAMS-mode save (paper or
   * config parameters + papers sync + subjects batch + per-subject topic
   * requirements) persists through ONE transactional RPC
   * (public.save_admin_settings_rpc). Any failure rolls back everything —
   * zero partial persistence. RPC validation codes (INVALID_*,
   * SUM_MISMATCH, UNAUTHORIZED_ACCESS, …) are preserved in the thrown
   * message so the caller can distinguish non-retryable validation failures
   * from retryable transport/backend ones.
   */
  async saveAdminSettingsAtomic(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    input: examRepo.AdminSettingsAtomicPayload
  ): Promise<examRepo.AdminSettingsSaveResult> {
    const { user, requestId } = ctx;
    ensureRole({ user, allowedRoles: ['admin'], operation: 'saveAdminSettingsAtomic', requestId });
    try {
      const result = await examRepo.saveAdminSettingsAtomic(input);
      // CT-4: config change must invalidate the user-facing caches that display
      // subjects/counts/topics, so a user's next view reflects the new settings.
      // save_admin_settings_rpc can mutate exam_configs (is_published,
      // allow_multiple_attempts, paper params) and exam_subjects.question_count,
      // so the paper list / exam list / prepare-write distribution caches that
      // surface those fields must be invalidated too — targeted prefixes only,
      // after the atomic DB write has succeeded (never before, no global reset,
      // never touching an in-flight attempt's questions_snapshot).
      queryCache.invalidateByPrefix('subjects_exam_');
      queryCache.invalidateByPrefix('subjects_paper_');
      queryCache.invalidateByPrefix('subject_counts_');
      queryCache.invalidateByPrefix('appsc_papers_');
      queryCache.invalidateByPrefix('topics_');
      queryCache.invalidateByPrefix('topic_counts_');
      queryCache.invalidateByPrefix('user_papers_');
      queryCache.invalidateByPrefix('papers_config_');
      queryCache.invalidateByPrefix('paper_dist_');
      queryCache.invalidateByPrefix('exams_config_');
      queryCache.invalidate('active_exams');
      return result;
    } catch (error) {
      const { message, code } = errorFields(error);
      logError('adminService.saveAdminSettingsAtomic (RPC)', { error: { message, code } });
      throw new Error(`Failed to save settings atomically: ${message}`);
    }
  },

  async fetchExamPapers(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    examId: string
  ): Promise<ExamPaper[]> {
    const { user, requestId } = ctx;

    ensureRole({
      user,
      allowedRoles: ['admin'],
      operation: 'fetchExamPapers',
      requestId
    });

    try {
      return await examRepo.fetchPapersByExamId(examId);
    } catch (error) {
      const { message, code } = errorFields(error);
      logError('adminService.fetchExamPapers', { error: { message, code } });
      throw new Error('Failed to load exam papers.');
    }
  },

  async fetchExamSubjects(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    examId: string,
    paperId?: string | null
  ): Promise<ExamSubject[]> {
    const { user, requestId } = ctx;

    ensureRole({
      user,
      allowedRoles: ['admin'],
      operation: 'fetchExamSubjects',
      requestId
    });

    try {
      return (await examRepo.fetchSubjectsByExamId(examId, paperId)) ?? [];
    } catch (error) {
      const { message, code } = errorFields(error);
      logError('adminService.fetchExamSubjects', { error: { message, code } });
      throw new Error('Failed to load exam subjects.');
    }
  },

  async fetchTopicConfiguration(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    examId: string,
    paperId: string,
    subjectName: string
  ): Promise<examRepo.TopicConfigRow[]> {
    const { user, requestId } = ctx;
    ensureRole({ user, allowedRoles: ['admin'], operation: 'fetchTopicConfiguration', requestId });
    try {
      return await examRepo.fetchTopicConfiguration(examId, paperId, subjectName);
    } catch (error) {
      const { message, code } = errorFields(error);
      logError('adminService.fetchTopicConfiguration', { error: { message, code } });
      throw new Error(`Failed to load topic configuration: ${message}`);
    }
  },

  async saveSubjectTestConfiguration(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    examId: string,
    paperId: string,
    subjectName: string,
    mode: '20' | '30' | '50',
    topics: { topic_id: string; required_questions: number }[]
  ): Promise<void> {
    const { user, requestId } = ctx;
    ensureRole({ user, allowedRoles: ['admin'], operation: 'saveSubjectTestConfiguration', requestId });
    try {
      await examRepo.saveSubjectTestConfiguration(examId, paperId, subjectName, mode, topics);
      // CT-4: subject-test topic thresholds changed → refresh user-facing topic counts.
      queryCache.invalidateByPrefix('topics_');
      queryCache.invalidateByPrefix('topic_counts_');
      queryCache.invalidateByPrefix('subject_counts_');
    } catch (error) {
      const { message, code } = errorFields(error);
      logError('adminService.saveSubjectTestConfiguration', { error: { message, code } });
      throw new Error(`Failed to save subject test configuration: ${message}`);
    }
  },

  // ─── Hierarchy management (LIVE exam/paper/subject/topic CRUD) ──────────────

  async createPaper(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    input: {
      exam_id: string;
      paper_name: string;
      stage: 'PRELIMS' | 'MAINS' | 'SINGLE';
      total_questions: number;
      total_marks: number;
      duration_minutes: number;
      negative_marking?: boolean;
      negative_mark_value?: number;
    }
  ): Promise<ExamPaper> {
    const { user, requestId } = ctx;
    ensureRole({ user, allowedRoles: ['admin'], operation: 'createPaper', requestId });

    const paper_name = normalizeHierarchyName(input.paper_name);
    if (isBlankName(paper_name)) throw new Error('Paper name is required.');
    if (!Number.isInteger(input.total_questions) || input.total_questions < 1) throw new Error('Total questions must be a positive whole number.');
    if (!Number.isInteger(input.total_marks) || input.total_marks < 1) throw new Error('Total marks must be a positive whole number.');
    if (!Number.isInteger(input.duration_minutes) || input.duration_minutes < 1) throw new Error('Duration must be a positive whole number of minutes.');

    try {
      const config = await examRepo.findExamConfigById(input.exam_id);
      if (!config) throw new Error(`Exam "${input.exam_id}" does not exist.`);

      const siblings = await examRepo.fetchPapersByExamId(input.exam_id);
      const dupPaper = siblings.find(
        p => p.stage === input.stage && normalizeHierarchyName(p.paper_name).toLowerCase() === paper_name.toLowerCase()
      );
      if (dupPaper) throw new Error(`DUPLICATE: A paper named "${dupPaper.paper_name}" already exists for this exam.`);

      const created = await examRepo.insertExamPaper({
        exam_id: input.exam_id,
        paper_name,
        stage: input.stage,
        total_questions: input.total_questions,
        total_marks: input.total_marks,
        duration_minutes: input.duration_minutes,
        negative_marking: input.negative_marking ?? false,
        negative_mark_value: input.negative_mark_value ?? 0,
        display_order: siblings.length + 1,
      });

      queryCache.invalidateByPrefix('appsc_papers_');
      queryCache.invalidateByPrefix('papers_config_');
      queryCache.invalidateByPrefix('user_papers_');
      return created;
    } catch (error) {
      const err = error as { message?: string; code?: string };
      logError('adminService.createPaper', { error: { message: err.message, code: err.code } });
      if (/^DUPLICATE:/.test(err.message ?? '')) throw error;
      if (err.code === '23505') {
        throw new Error(`DUPLICATE: A paper named "${paper_name}" already exists for this exam.`);
      }
      if (/does not exist/.test(err.message ?? '')) throw error;
      throw new Error(`Failed to create paper: ${err.message}`);
    }
  },

  async createSubject(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    input: {
      paper_id: string;
      subject_name: string;
      question_count: number;
      marks_per_question: number;
    }
  ): Promise<ExamSubject> {
    const { user, requestId } = ctx;
    ensureRole({ user, allowedRoles: ['admin'], operation: 'createSubject', requestId });

    const subject_name = normalizeHierarchyName(input.subject_name);
    if (isBlankName(subject_name)) throw new Error('Subject name is required.');
    if (!Number.isInteger(input.question_count) || input.question_count < 1) throw new Error('Question count must be a positive whole number.');
    if (!(input.marks_per_question > 0)) throw new Error('Marks per question must be greater than zero.');

    try {
      const paper = await examRepo.findPaperById(input.paper_id);
      if (!paper) throw new Error('Selected paper does not belong to the selected exam.');
      const config = await examRepo.findExamConfigById(paper.exam_id);
      if (!config) throw new Error('Selected paper does not belong to the selected exam.');

      const siblings = (await examRepo.fetchSubjectsByPaperId(input.paper_id)) ?? [];
      const dupSubject = siblings.find(s => normalizeHierarchyName(s.subject_name).toLowerCase() === subject_name.toLowerCase());
      if (dupSubject) throw new Error(`DUPLICATE: A subject named "${dupSubject.subject_name}" already exists in this paper.`);

      const created = await examRepo.insertExamSubject({
        exam_id: paper.exam_id,
        paper_id: input.paper_id,
        subject_name,
        question_count: input.question_count,
        marks_per_question: input.marks_per_question,
        display_order: siblings.length + 1,
      });

      queryCache.invalidateByPrefix('subjects_exam_');
      queryCache.invalidateByPrefix('subjects_paper_');
      queryCache.invalidateByPrefix('subject_counts_');
      return created;
    } catch (error) {
      const err = error as { message?: string; code?: string };
      logError('adminService.createSubject', { error: { message: err.message, code: err.code } });
      if (/^DUPLICATE:/.test(err.message ?? '')) throw error;
      if (err.code === '23505') {
        throw new Error(`DUPLICATE: A subject named "${subject_name}" already exists in this paper.`);
      }
      if (/does not belong|is required|must be/.test(err.message ?? '')) throw error;
      throw new Error(`Failed to create subject: ${err.message}`);
    }
  },

  async createTopic(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    input: {
      exam_id: string;
      paper_id: string;
      subject_name: string;
      topic_en: string;
      topic_te?: string | null;
      display_order?: number;
    }
  ): Promise<examRepo.CreatedTopicRow> {
    const { user, requestId } = ctx;
    ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'createTopic', requestId });

    const topic_en = normalizeHierarchyName(input.topic_en);
    const subject_name = normalizeHierarchyName(input.subject_name);
    if (isBlankName(topic_en)) throw new Error('English topic name is required.');

    try {
      // §17/§18 — never trust client context: verify exam → paper → subject chain.
      const paper = await examRepo.findPaperById(input.paper_id);
      if (!paper || paper.exam_id !== input.exam_id) {
        throw new Error('HIERARCHY: The selected paper does not belong to the selected exam.');
      }
      const config = await examRepo.findExamConfigById(input.exam_id);
      if (!config) throw new Error('HIERARCHY: The selected exam does not exist.');
      const siblings = (await examRepo.fetchSubjectsByPaperId(input.paper_id)) ?? [];
      if (!siblings.some(s => normalizeHierarchyName(s.subject_name).toLowerCase() === subject_name.toLowerCase())) {
        throw new Error('HIERARCHY: The selected subject does not belong to the selected paper.');
      }

      const segmentTopics = await examRepo.fetchTopicsBySubject([input.exam_id], subject_name, input.paper_id);
      const dupTopic = (segmentTopics ?? []).find(t => normalizeHierarchyName(t.topic_en).toLowerCase() === topic_en.toLowerCase());
      if (dupTopic) throw new Error(`DUPLICATE: A topic named "${dupTopic.topic_en}" already exists in this subject.`);

      const created = await examRepo.insertTopicStrict({
        exam_id: input.exam_id,
        paper_id: input.paper_id,
        subject_name,
        topic_en,
        topic_te: input.topic_te?.trim() ? input.topic_te.trim() : null,
        display_order:
          Number.isInteger(input.display_order) && (input.display_order as number) > 0
            ? (input.display_order as number)
            : (segmentTopics?.length ?? 0) + 1,
      });

      queryCache.invalidateByPrefix('topics_');
      queryCache.invalidateByPrefix('topic_counts_');
      return created;
    } catch (error) {
      const err = error as { message?: string; code?: string };
      logError('adminService.createTopic', { error: { message: err.message, code: err.code } });
      if (/^DUPLICATE:/.test(err.message ?? '')) throw error;
      if (err.code === '23505') {
        throw new Error(`DUPLICATE: A topic named "${normalizeHierarchyName(input.topic_en)}" already exists in this subject.`);
      }
      if (/HIERARCHY:|is required/.test(err.message ?? '')) throw error;
      throw new Error(`Failed to create topic: ${err.message}`);
    }
  },

  async fetchTopicRenameImpact(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    topicId: string
  ): Promise<{ questions: number; prompts: number }> {
    const { user, requestId } = ctx;
    ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'fetchTopicRenameImpact', requestId });
    try {
      const current = await examRepo.fetchTopicById(topicId);
      if (!current) throw new Error('Topic not found.');
      const [questions, prompts] = await Promise.all([
        examRepo.countActiveQuestionsForTopicSegment(current.exam_id, current.paper_id, current.subject_name, current.topic_en),
        examRepo.countPromptsForTopic(topicId),
      ]);
      return { questions, prompts };
    } catch (error) {
      const err = error as { message?: string; code?: string };
      logError('adminService.fetchTopicRenameImpact', { error: { message: err.message, code: err.code } });
      throw new Error(`Failed to assess rename impact: ${err.message}`);
    }
  },

  /**
   * Rename safety (§36/§37):
   *  - English rename touches IDENTITY-adjacent data (questions/prompts store
   *    topic_en as their segment predicate) → blocked whenever ANY dependent
   *    question or prompt exists; the error reports exact counts.
   *  - Telugu is display data. Renaming TE while prompts reference the topic is
   *    blocked (prompts embed the canonical Telugu inline as verified echo).
   *    With only questions depending on it, the rename synchronizes every
   *    dependent question's topic_te in the same operation.
   */
  async renameTopic(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    topicId: string,
    updates: { topic_en?: string; topic_te?: string | null }
  ): Promise<{ syncedQuestions: number }> {
    const { user, requestId } = ctx;
    ensureRole({ user, allowedRoles: ['admin', 'sub_admin'], operation: 'renameTopic', requestId });

    const nextEn = updates.topic_en !== undefined ? normalizeHierarchyName(updates.topic_en) : undefined;
    const nextTe = updates.topic_te !== undefined ? (updates.topic_te?.trim() ? updates.topic_te.trim() : null) : undefined;
    if (nextEn !== undefined && isBlankName(nextEn)) throw new Error('English topic name is required.');

    try {
      const current = await examRepo.fetchTopicById(topicId);
      if (!current) throw new Error('Topic not found.');

      const enChanged = nextEn !== undefined && nextEn !== current.topic_en;
      const teChanged = nextTe !== undefined && nextTe !== current.topic_te;

      if (!enChanged && !teChanged) return { syncedQuestions: 0 };

      const depQuestions = await examRepo.countActiveQuestionsForTopicSegment(
        current.exam_id, current.paper_id, current.subject_name, current.topic_en
      );
      const depPrompts = await examRepo.countPromptsForTopic(topicId);

      if (enChanged && (depQuestions > 0 || depPrompts > 0)) {
        throw new Error(
          `RENAME_BLOCKED: ${depQuestions} question(s) and ${depPrompts} prompt(s) depend on the current English name. ` +
          'Renaming it would break their stored context. Migrate or remove the dependent records first.'
        );
      }
      if (teChanged && depPrompts > 0) {
        throw new Error(
          `RENAME_BLOCKED: ${depPrompts} prompt(s) embed the current Telugu name. ` +
          'Edit those prompts through the Prompt Editor instead.'
        );
      }

      let syncedQuestions = 0;
      if (teChanged && depQuestions > 0) {
        syncedQuestions = await examRepo.syncQuestionTeluguForTopic(
          current.exam_id, current.paper_id, current.subject_name, current.topic_en, nextTe as string | null
        );
      }

      await examRepo.updateTopicNames(topicId, {
        ...(enChanged ? { topic_en: nextEn as string } : {}),
        ...(teChanged ? { topic_te: nextTe as string | null } : {}),
      });

      queryCache.invalidateByPrefix('topics_');
      queryCache.invalidateByPrefix('topic_counts_');
      queryCache.invalidate(`topic_record_${topicId}`);
      return { syncedQuestions };
    } catch (error) {
      const err = error as { message?: string; code?: string };
      logError('adminService.renameTopic', { error: { message: err.message, code: err.code } });
      if (/RENAME_BLOCKED:|not found|is required/.test(err.message ?? '')) throw error;
      if (err.code === '23505') {
        throw new Error(`DUPLICATE: A topic named "${nextEn}" already exists in this subject.`);
      }
      throw new Error(`Failed to rename topic: ${err.message}`);
    }
  },
};

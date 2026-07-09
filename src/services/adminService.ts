import { ensureRole } from '../utils/authUtils';
import type { UserProfile } from '../types/auth.types';
import type { ExamPaper, ExamSubject, ExamConfig } from '../types/exam.types';
import * as examRepo from '../lib/repositories/exam.repository';
import { logError } from '../utils/logger';

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
    } catch (error: any) {
      logError('adminService.createNewExam (RPC)', { error: { message: error.message, code: error.code } });
      throw new Error(`Failed to create exam atomically: ${error.message}`);
    }
  },

  async fetchPapersByExam(examId: string): Promise<ExamPaper[]> {
    try {
      return (await examRepo.fetchPapersByExamId(examId)) ?? [];
    } catch (error: any) {
      throw error;
    }
  },

  async fetchSubjectsByPaper(paperId: string): Promise<ExamSubject[]> {
    try {
      return (await examRepo.fetchSubjectsByPaperId(paperId)) ?? [];
    } catch (error: any) {
      throw error;
    }
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
    } catch (error: any) {
      logError('adminService.fetchExamConfig', { error: { message: error.message, code: error.code } });
      throw new Error('Failed to load exam configuration.');
    }
  },

  async updateExamConfig(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    examId: string,
    updates: Partial<ExamConfig>
  ): Promise<void> {
    const { user, requestId } = ctx;

    ensureRole({
      user,
      allowedRoles: ['admin'],
      operation: 'updateExamConfig',
      requestId
    });

    try {
      await examRepo.updateExamConfigById(examId, updates);
    } catch (error: any) {
      logError('adminService.updateExamConfig', { error: { message: error.message, code: error.code } });
      throw new Error('Failed to update exam configuration.');
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
    } catch (error: any) {
      logError('adminService.fetchExamPapers', { error: { message: error.message, code: error.code } });
      throw new Error('Failed to load exam papers.');
    }
  },

  async updateExamPaper(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    paperId: string,
    updates: Partial<ExamPaper>
  ): Promise<void> {
    const { user, requestId } = ctx;

    ensureRole({
      user,
      allowedRoles: ['admin'],
      operation: 'updateExamPaper',
      requestId
    });

    try {
      await examRepo.updatePaperById(paperId, updates);
    } catch (error: any) {
      logError('adminService.updateExamPaper', { error: { message: error.message, code: error.code } });
      throw new Error('Failed to update paper configuration.');
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
    } catch (error: any) {
      logError('adminService.fetchExamSubjects', { error: { message: error.message, code: error.code } });
      throw new Error('Failed to load exam subjects.');
    }
  },

  async syncExamPapersFromConfig(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    examId: string,
    updates: Pick<ExamConfig, 'total_questions' | 'total_marks' | 'duration_minutes' | 'negative_marking' | 'negative_mark_value'>
  ): Promise<void> {
    const { user, requestId } = ctx;

    ensureRole({
      user,
      allowedRoles: ['admin'],
      operation: 'syncExamPapersFromConfig',
      requestId
    });

    try {
      await examRepo.syncPapersFromConfig(examId, updates);
    } catch (error: any) {
      logError('adminService.syncExamPapersFromConfig', { error: { message: error.message, code: error.code } });
      throw new Error(`Failed to sync exam papers from config: ${error.message}`);
    }
  },

  async updateExamSubjects(
    ctx: { user: UserProfile | null | undefined; requestId?: string },
    subjects: { id: string; question_count: number; marks_per_question: number }[]
  ): Promise<void> {
    const { user, requestId } = ctx;

    ensureRole({
      user,
      allowedRoles: ['admin'],
      operation: 'updateExamSubjects',
      requestId
    });

    try {
      await examRepo.updateExamSubjectsBatchRpc(subjects);
    } catch (error: any) {
      logError('adminService.updateExamSubjects (RPC)', { error: { message: error.message, code: error.code } });
      throw new Error(`Failed to update subjects batch: ${error.message}`);
    }
  }
};

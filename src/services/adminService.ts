import { supabase } from '../lib/supabase';
import { ensureRole } from '../utils/authUtils';
import type { UserProfile } from '../types/auth.types';
import type { ExamPaper, ExamSubject, ExamConfig } from '../types/exam.types';
import { safeSupabaseCall } from '../utils/safeSupabase';
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

    // 1. Verify Admin Role
    ensureRole({
      user,
      allowedRoles: ['admin'],
      operation: 'createNewExam',
      requestId
    });

    // 2. Call the atomic database transaction RPC
    const { error } = await safeSupabaseCall(
      supabase.rpc('create_new_exam_rpc', { p_exam: examData })
    );

    if (error) {
      logError('adminService.createNewExam (RPC)', { error: { message: error.message, code: error.code } });
      throw new Error(`Failed to create exam atomically: ${error.message}`);
    }
  },
  /**
   * Fetches the global configuration for a specific exam ID.
   */
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

    const { data, error } = await safeSupabaseCall(
      supabase
        .from('exam_configs')
        .select('*')
        .eq('exam_id', examId)
        .maybeSingle()
    );

    if (error) {
      logError('adminService.fetchExamConfig', { error: { message: error.message, code: error.code } });
      throw new Error('Failed to load exam configuration.');
    }

    return data as ExamConfig;
  },

  /**
   * Updates the global configuration for an exam.
   */
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

    const { error } = await safeSupabaseCall(
      supabase
        .from('exam_configs')
        .update(updates)
        .eq('exam_id', examId)
    );

    if (error) {
      logError('adminService.updateExamConfig', { error: { message: error.message, code: error.code } });
      throw new Error('Failed to update exam configuration.');
    }
  },

  /**
   * Fetches all papers associated with an exam ID.
   */
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

    const { data, error } = await safeSupabaseCall(
      supabase
        .from('exam_papers')
        .select('*')
        .eq('exam_id', examId)
        .order('display_order', { ascending: true })
    );

    if (error) {
      logError('adminService.fetchExamPapers', { error: { message: error.message, code: error.code } });
      throw new Error('Failed to load exam papers.');
    }

    return data || [];
  },

  /**
   * Updates a specific exam paper's parameters.
   */
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

    const { error } = await safeSupabaseCall(
      supabase
        .from('exam_papers')
        .update(updates)
        .eq('id', paperId)
    );

    if (error) {
      logError('adminService.updateExamPaper', { error: { message: error.message, code: error.code } });
      throw new Error('Failed to update paper configuration.');
    }
  },

  /**
   * Fetches subjects for an exam, optionally filtered by paper.
   */
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

    let query = supabase
      .from('exam_subjects')
      .select('*')
      .eq('exam_id', examId);

    if (paperId) {
      query = query.eq('paper_id', paperId);
    }

    const { data, error } = await safeSupabaseCall(query.order('display_order', { ascending: true }));

    if (error) {
      logError('adminService.fetchExamSubjects', { error: { message: error.message, code: error.code } });
      throw new Error('Failed to load exam subjects.');
    }

    return data || [];
  },

  /**
   * Syncs all exam_papers for a given exam_id to match the provided config values.
   * Call this after updating exam_configs at the exam level to keep papers in sync.
   */
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

    const { error } = await safeSupabaseCall(
      supabase
        .from('exam_papers')
        .update({
          total_questions: updates.total_questions,
          total_marks: updates.total_marks,
          duration_minutes: updates.duration_minutes,
          negative_marking: updates.negative_marking,
          negative_mark_value: updates.negative_mark_value,
        })
        .eq('exam_id', examId)
    );

    if (error) {
      logError('adminService.syncExamPapersFromConfig', { error: { message: error.message, code: error.code } });
      throw new Error(`Failed to sync exam papers from config: ${error.message}`);
    }
  },

  /**
   * Updates multiple subjects in batch.
   */
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

    const { error } = await safeSupabaseCall(
      supabase.rpc('update_exam_subjects_batch', { p_subjects: subjects })
    );

    if (error) {
      logError('adminService.updateExamSubjects (RPC)', { error: { message: error.message, code: error.code } });
      throw new Error(`Failed to update subjects batch: ${error.message}`);
    }
  }
};

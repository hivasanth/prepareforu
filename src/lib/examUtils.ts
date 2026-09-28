/**
 * Exam-ID resolution helpers.
 *
 * `resolveExamIds` DELEGATES to `getAllowedExamIds` (src/utils/examUtils.ts) —
 * the single canonical source for selection → exam-id expansion (RE-1: the two
 * modules previously duplicated the APPSC group expansion).
 */
import { getAllowedExamIds } from '../utils/examUtils'

/** Source identifier for attempts originating from the exam-taking tab. */
export const ATTEMPT_SOURCE_EXAM_TAB = 'exam_tab'

export const KNOWN_EXAM_IDS: string[] = ['all', 'APPSC_GROUPS', 'BANK_EXAMS']

/**
 * Maps filter selection values (like APPSC_GROUPS) to their specific constituent
 * exam IDs. `'all'` resolves to `[]`, APPSC/APPSC_GROUPS expand to the four group
 * ids; any other selection matches exactly.
 */
export const resolveExamIds = (selection: string): string[] => getAllowedExamIds(selection)

/**
 * Maps admin panel UI exam selections to the canonical primary exam ID used for insertions.
 * Used primarily for Question creation/bulk uploads to ensure group topics fall under the correct parent.
 */
export const resolveAdminExamId = (selection: string): string => {
  if (selection === 'APPSC_GROUPS' || selection === 'all') {
    return 'APPSC_GROUP_1'
  }
  return selection
}

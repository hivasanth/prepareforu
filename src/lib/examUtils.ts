/** Source identifier for attempts originating from the exam-taking tab. */
export const ATTEMPT_SOURCE_EXAM_TAB = 'exam_tab'

export const KNOWN_EXAM_IDS: string[] = ['all', 'APPSC_GROUPS', 'BANK_EXAMS']

/**
 * Maps filter selection values (like APPSC_GROUPS) to their specific constituent exam IDs 
 * recognized by the database enum 'exam_id'.
 */
export const resolveExamIds = (selection: string): string[] => {
  if (selection === 'all') return []
  
  if (selection === 'APPSC_GROUPS') {
    return ['APPSC_GROUP_1', 'APPSC_GROUP_2', 'APPSC_GROUP_3', 'APPSC_GROUP_4']
  }
  
  // For most other exams (e.g. BANK_EXAMS), the selection matches the enum value exactly
  return [selection]
}

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

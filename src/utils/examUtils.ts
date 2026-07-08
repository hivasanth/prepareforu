/**
 * Mapping of top-level exam selections to internal exam IDs.
 * This ensures strict data isolation across the application.
 */
export function getAllowedExamIds(selection: string | undefined | null): string[] {
  if (!selection) return [];

  switch (selection) {
    case "APPSC":
    case "APPSC_GROUPS":
      return [
        "APPSC_GROUP_1",
        "APPSC_GROUP_2",
        "APPSC_GROUP_3",
        "APPSC_GROUP_4"
      ];
    case "BANK_EXAMS":
      return ["BANK_EXAMS"];
    default:
      // If it's a specific exam ID already, return it as a single-item array
      return [selection];
  }
}

/**
 * Checks if a specific exam_id is allowed for a given selection.
 */
export function isExamAllowed(selection: string | undefined | null, examId: string): boolean {
  const allowed = getAllowedExamIds(selection);
  return allowed.includes(examId);
}

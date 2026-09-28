/**
 * Mapping of a user's *declared preference* to exam IDs.
 *
 * P0-02 — THIS IS NOT A SECURITY CONTROL AND IT GRANTS NOTHING.
 *
 * This function used to be described as enforcing "strict data isolation".
 * That was never true and after P0-02 it is actively misleading: the only thing
 * that decides whether an account may read exam content is the server, in
 * `public.is_exam_allowed_for_user(text)` over the
 * `public.user_exam_entitlements` table, enforced by RLS on questions,
 * exam_papers, exam_subjects, exam_topics and study_topics and re-checked by
 * the exam RPCs.
 *
 * `users.exam_selection` is a validated *preference*. A user can only hold a
 * value that `set_preferred_exam` accepted, and a preference is not authority:
 * a user may legitimately state "APPSC_GROUPS" and still be refused every
 * APPSC question at the database.
 *
 * Use this only to decide what to *render* — which tabs to show, which label to
 * print. Never use it to decide what the user may *read*, and never treat an
 * `isExamAllowed() === true` result as permission to expect data back. Prefer
 * the server's `get_my_entitlements()` for anything a user actually acts on.
 *
 * `src/lib/examUtils.ts` re-exports this as `resolveExamIds` for back-compat.
 * The admin helpers (`resolveAdminExamId`, `KNOWN_EXAM_IDS`) intentionally stay
 * catalogue-wide: an admin configures every exam regardless of their own grants.
 */
export function getAllowedExamIds(selection: string | undefined | null): string[] {
  if (!selection) return [];

  switch (selection) {
    case "all":
      // Admin filter "all" resolves to no user-scoped exams.
      return [];
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

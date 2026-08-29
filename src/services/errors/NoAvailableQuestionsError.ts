/**
 * Shared typed domain error for the "business-empty" condition: the fetch
 * succeeded but there are no questions for the requested resource (subject,
 * paper, or topic).
 *
 * Shared by subjectTestService and topicTestService (and any future service
 * that legitimately needs the same domain condition) so neither service
 * depends on the other.
 *
 * Consumers MUST detect this via `instanceof NoAvailableQuestionsError` (or a
 * stable discriminator) — NEVER by matching the human-readable message.
 */
export class NoAvailableQuestionsError extends Error {
  constructor(resourceName: string) {
    super(`No questions available for ${resourceName}`);
    this.name = 'NoAvailableQuestionsError';
  }
}

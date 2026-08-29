/**
 * Fisher-Yates in-place shuffle. Returns a NEW array (does not mutate the input).
 * Reused across services that need randomized question ordering
 * (prepareWriteService, subjectTestService, etc.).
 */
export function shuffleArray<T>(input: readonly T[]): T[] {
  const result = input.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
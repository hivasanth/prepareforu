const activeGenerations = new Map<string, number>();
let globalCounter = 0;

export class StaleOperationError extends Error {
  constructor(key?: string) {
    super(key ? `Operation superseded for key: ${key}` : 'Operation superseded by newer request');
    this.name = 'StaleOperationError';
  }
}

export interface RetryOptions {
  /** Max retries after the initial attempt (default 2 = 3 total calls) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default 2000) */
  baseDelayMs?: number;
  /** External AbortSignal to cancel the entire retry chain */
  signal?: AbortSignal;
  /** Called before each retry with the attempt number and error */
  onRetry?: (attempt: number, error: unknown) => void;
}

interface InternalOptions extends Required<Omit<RetryOptions, 'signal' | 'onRetry'>> {
  signal: AbortSignal | undefined;
  onRetry: ((attempt: number, error: unknown) => void) | undefined;
}

const DEFAULT_OPTIONS: InternalOptions = {
  maxRetries: 2,
  baseDelayMs: 2000,
  signal: undefined,
  onRetry: undefined,
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Execute an async operation with automatic retry and generation-based dedup.
 *
 * When called with the same `key` while a previous call is still pending,
 * the previous call is marked stale — its retries silently stop and its
 * result is discarded. Only the latest call's chain runs to completion.
 *
 * @param key  Unique deduplication key (e.g. `"q5-answer"`)
 * @param fn   The async operation to execute
 * @param options  Retry configuration
 */
export async function executeWithRetry<T>(
  key: string,
  fn: (signal?: AbortSignal) => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const {
    maxRetries,
    baseDelayMs,
    signal: externalSignal,
    onRetry,
  } = { ...DEFAULT_OPTIONS, ...options };

  const generation = ++globalCounter;
  activeGenerations.set(key, generation);

  const combinedSignal = externalSignal ?? undefined;

  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (combinedSignal?.aborted) {
        throw new DOMException('Aborted by external signal', 'AbortError');
      }

      if (activeGenerations.get(key) !== generation) {
        throw new StaleOperationError(key);
      }

      try {
        const result = await fn(combinedSignal);
        clearGeneration(key, generation);
        return result;
      } catch (error) {
        if (error instanceof StaleOperationError) {
          throw error;
        }
        if (isAbortError(error)) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          onRetry?.(attempt + 1, error);
          await sleep(delay, combinedSignal);
        } else {
          clearGeneration(key, generation);
          throw error;
        }
      }
    }
  } finally {
    if (activeGenerations.get(key) === generation) {
      activeGenerations.delete(key);
    }
  }

  throw new Error('Unreachable');
}

function clearGeneration(key: string, generation: number): void {
  if (activeGenerations.get(key) === generation) {
    activeGenerations.delete(key);
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted by external signal', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = (): void => {
        clearTimeout(timer);
        reject(new DOMException('Aborted by external signal', 'AbortError'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

export function hasPendingOperation(key: string): boolean {
  return activeGenerations.has(key);
}

export function clearAllPendingOperations(): void {
  const count = activeGenerations.size;
  activeGenerations.clear();
  if (count > 0) {
    console.info(`[persistenceRetry] Cleared ${count} pending operation(s)`);
  }
}

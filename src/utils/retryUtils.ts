import { isServerError } from './logger';

/**
 * Classifies if an error is retryable (transient) or not (permanent).
 * 
 * Retryable:
 * - Network failures
 * - Timeouts
 * - 5xx Server Errors
 * 
 * Non-Retryable:
 * - Validation errors
 * - Unique constraint / Duplicate errors
 * - 4xx Client Errors (except 429)
 */
function isRetryableError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code;

  // Non-retryable: Unique constraint / Duplicates
  if (
    message.includes('duplicate') ||
    message.includes('unique constraint') ||
    code === '23505' // Postgres unique_violation
  ) {
    return false;
  }

  // Non-retryable: Validation
  if (message.includes('validation')) {
    return false;
  }

  // Retryable: Network/Timeout/5xx/RateLimit
  if (
    isServerError(error) ||
    message.includes('failed to fetch') ||
    code === '429'
  ) {
    return true;
  }

  return false;
}

export interface RetryOptions {
  retries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

/**
 * Executes a function with exponential backoff retries.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    baseDelay = 500,
    maxDelay = 3000,
  } = options;

  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error: any) {
      const isRetryable = isRetryableError(error);

      if (!isRetryable || attempt === retries) {
        throw error;
      }

      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );

      console.warn(`Retry attempt ${attempt + 1} after ${delay}ms due to: ${error.message}`);
      await new Promise(res => setTimeout(res, delay));
      attempt++;
    }
  }

  throw new Error('Retry limit reached'); // Should theoretically never be reached due to throw error above
}

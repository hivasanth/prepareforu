import { THRESHOLDS } from './thresholds';
import { notify } from './notifier';

interface EvaluatorState {
  apiErrors: number[];
}

const state: EvaluatorState = {
  apiErrors: [],
};

/**
 * Removes timestamps older than the window.
 */
function prune(arr: number[], windowMs: number): number[] {
  const now = Date.now();
  return arr.filter(ts => now - ts <= windowMs);
}

/**
 * Central evaluator for system-level alerts.
 */
export function alertEval(type: 'api_error' | 'slow_query' | 'bulk_failure_rate', payload: Record<string, any> = {}) {
  const now = Date.now();

  if (type === 'api_error') {
    state.apiErrors.push(now);
    state.apiErrors = prune(state.apiErrors, THRESHOLDS.apiErrorRate.windowMs);

    if (state.apiErrors.length >= THRESHOLDS.apiErrorRate.maxErrors) {
      notify('API_ERROR_RATE_HIGH', {
        count: state.apiErrors.length,
        window_ms: THRESHOLDS.apiErrorRate.windowMs,
        ...payload
      });
      state.apiErrors = []; // Reset after alert to prevent repeated noise in same window
    }
  }

  if (type === 'slow_query') {
    notify('SLOW_QUERY', payload);
  }

  if (type === 'bulk_failure_rate') {
    notify('BULK_FAILURE_RATE_HIGH', payload);
  }
}

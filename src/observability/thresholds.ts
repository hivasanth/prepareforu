/**
 * Centralized thresholds for alerting and monitoring.
 * Adjust these values based on production performance baselines.
 */
export const THRESHOLDS = {
  // Queries taking longer than this are flagged as 'slow'
  slowQueryMs: 1000,

  // Error rate tracking configuration
  apiErrorRate: {
    windowMs: 60000, // 1 minute window
    maxErrors: 10,   // Alert if 10+ errors occur in the window
  },

  // Bulk processing failure thresholds
  bulkFailure: {
    windowMs: 60000,
    maxFailureRatio: 0.3, // Alert if > 30% of items in a chunk/batch fail
  },

  // Alert cooldown to prevent spam (in milliseconds)
  alertCooldownMs: 30000, // 30 seconds
};

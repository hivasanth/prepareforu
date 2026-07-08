import { THRESHOLDS } from './thresholds';

const lastAlertTime: Record<string, number> = {};

/**
 * Checks if an alert should be emitted based on a cooldown.
 */
function shouldAlert(key: string, cooldown = THRESHOLDS.alertCooldownMs): boolean {
  const now = Date.now();
  if (!lastAlertTime[key] || now - lastAlertTime[key] > cooldown) {
    lastAlertTime[key] = now;
    return true;
  }
  return false;
}

/**
 * Pluggable notification engine.
 * Currently logs to console as a structured alert, but can be
 * wired to Slack, Sentry, or custom webhooks.
 */
export function notify(event: string, payload: Record<string, any> = {}) {
  if (!shouldAlert(event)) {
    return;
  }

  console.warn(JSON.stringify({
    type: 'alert',
    event,
    ts: new Date().toISOString(),
    ...payload
  }));

  // Future integrations:
  // if (process.env.SLACK_WEBHOOK) sendToSlack(event, payload);
  // if (process.env.SENTRY_DSN) Sentry.captureMessage(event, { extra: payload });
}

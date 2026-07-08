/**
 * Structured logger with runtime log-level filtering.
 * Emits logs in JSON format for easy parsing by log aggregators.
 *
 * Uses private dispatch so calls can never be stripped
 * by bundler dead-code elimination (e.g. esbuild.pure).
 *
 * Log levels (most → least verbose): debug, info, warn, error, silent
 * Defaults: 'info' in dev, 'warn' in production.
 * Call setLogLevel(moduleName, level) to override per module.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

const LEVEL_NUM: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 }

const log = console.log.bind(console)
const warn = console.warn.bind(console)
const err = console.error.bind(console)

/** Global minimum level */
let globalLevel: LogLevel = import.meta.env.DEV ? 'info' : 'warn'

/** Per-module overrides */
const moduleLevels = new Map<string, LogLevel>()

export function setLogLevel(module: string, level: LogLevel) {
  moduleLevels.set(module, level)
}

function shouldLog(level: LogLevel, module?: string): boolean {
  const effective = module ? (moduleLevels.get(module) ?? globalLevel) : globalLevel
  return LEVEL_NUM[level] >= LEVEL_NUM[effective]
}

export function generateRequestId(prefix = 'op'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isServerError(error: any): boolean {
  return (
    error?.status >= 500 ||
    (error?.code && String(error.code).startsWith('5')) ||
    error?.message?.toLowerCase().includes('timeout') ||
    error?.message?.toLowerCase().includes('network')
  );
}

export function sanitizeError(error: any) {
  return {
    message: error?.message || 'Unknown error',
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    is_server_error: isServerError(error)
  };
}

export function logDebug(event: string, payload: Record<string, any> = {}, module?: string) {
  if (!shouldLog('debug', module)) return
  log(JSON.stringify({ level: 'debug', ts: new Date().toISOString(), event, ...payload }))
}

export function logInfo(event: string, payload: Record<string, any> = {}, module?: string) {
  if (!shouldLog('info', module)) return
  log(JSON.stringify({ level: 'info', ts: new Date().toISOString(), event, ...payload }))
}

export function logWarn(event: string, payload: Record<string, any> = {}, module?: string) {
  if (!shouldLog('warn', module)) return
  warn(JSON.stringify({ level: 'warn', ts: new Date().toISOString(), event, ...payload }))
}

export function logError(event: string, payload: Record<string, any> = {}, module?: string) {
  if (!shouldLog('error', module)) return
  err(JSON.stringify({ level: 'error', ts: new Date().toISOString(), event, ...payload }))
}

/**
 * Lightweight metric emitter.
 * Always emits — metrics are used for dashboards, not debugging.
 */
export function metric(name: string, value: number = 1, tags: Record<string, any> = {}) {
  log(JSON.stringify({
    type: 'metric',
    ts: Date.now(),
    name,
    value,
    tags
  }));
}

/**
 * Future-proof error reporting hook.
 * Currently logs to console, but is fully wired to forward to Sentry if available.
 */
export function reportError(error: any, context: Record<string, any> = {}) {
  const sanitized = sanitizeError(error);
  
  logError('app.error', {
    ...context,
    error: sanitized
  });

  // Sentry integration (auto-detected)
  try {
    const globalSentry = (window as any).Sentry;
    if (globalSentry && typeof globalSentry.captureException === 'function') {
      globalSentry.captureException(error, {
        extra: context,
        tags: {
          is_server_error: String(sanitized.is_server_error),
          error_code: sanitized.code || 'unknown'
        }
      });
    }
  } catch {
    // Silently ignore — Sentry must never break the app
  }
}

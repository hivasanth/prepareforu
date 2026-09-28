export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDurationShort(seconds: number | null): string {
  if (seconds == null) return '\u2014';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function formatDurationMinutesSeconds(secs?: number): string {
  if (secs == null || secs < 0) return '--:--';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatNumber(n: number, dec = 1): string {
  return isNaN(n) ? '\u2014' : n.toFixed(dec);
}

/* ─── UTC day-boundary utilities (leaderboard "Today" contract) ──────────────
 * The daily leaderboard is keyed to UTC midnight — the same boundary the
 * `get_memory_game_leaderboard` RPC applies server-side via
 * `date_trunc('day', now())`. This ONE canonical mirror drives three clients:
 *   * the realtime subscription filter (only bump when a payload is in-today),
 *   * the dialog's "Today" label,
 *   * the UI state that decides when a live insert should trigger a refetch.
 *
 * No timezone library is used on purpose: the server is authoritative and the
 * client mirrors plain UTC (not browser-local, not Asia/Kolkata) so the query
 * window and the client's expectation can never drift apart.
 * --------------------------------------------------------------------------- */

export interface TodayBoundsUtc {
  /** ISO instant of UTC midnight at the start of today (inclusive). */
  start: string
  /** ISO instant of UTC midnight at the start of tomorrow (exclusive). */
  end: string
}

export function getTodayBoundsUtc(now: Date = new Date()): TodayBoundsUtc {
  const startMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return {
    start: new Date(startMs).toISOString(),
    end: new Date(startMs + 24 * 60 * 60 * 1000).toISOString(),
  }
}

export function isWithinToday(isoDate: string | null | undefined, now: Date = new Date()): boolean {
  if (!isoDate) return false
  const timestamp = Date.parse(isoDate)
  if (Number.isNaN(timestamp)) return false
  const { start, end } = getTodayBoundsUtc(now)
  return timestamp >= Date.parse(start) && timestamp < Date.parse(end)
}

/** Human-readable label for the daily leaderboard's "Today" scope (UTC day). */
export function formatTodayLabel(now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: '2-digit', year: 'numeric' }).format(now)
  } catch {
    return now.toISOString().slice(0, 10)
  }
}

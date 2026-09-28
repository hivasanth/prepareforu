export interface DistributionItem {
  name: string;
  value: number;
}

export interface SummaryStats {
  total: number;
  avg: number;
  hi: number;
  lo: number;
  avgTime: number;
}

export interface DistributionRange {
  label: string;
  min: number;
  max: number;
  count: number;
  pct: number;
}

export interface StudentStats {
  totalExams: number;
  avgPct: number;
  bestPct: number;
  lastActive: string | null;
}

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, curr) => acc + curr, 0) / values.length;
}

export function calculatePercentage(score: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((score / total) * 100);
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

export function computeDistribution(
  correct: number,
  wrong: number,
  skipped: number
): DistributionItem[] {
  return [
    { name: 'Correct', value: correct },
    { name: 'Wrong', value: wrong },
    { name: 'Skipped', value: skipped },
  ].filter(d => d.value > 0);
}

export function computeSummaryStats(
  attempts: { score?: number; accuracy?: number; duration_seconds?: number }[]
): SummaryStats | null {
  if (attempts.length === 0) return null;
  const scores = attempts.map(a => Number(a.score) || 0);
  const avg = calculateAverage(scores);
  const hi = Math.max(...scores);
  const lo = Math.min(...scores);
  const avgTime = calculateAverage(
    attempts.map(a => a.duration_seconds ?? 0)
  );
  return { total: attempts.length, avg, hi, lo, avgTime };
}

export function computeScoreDistribution(
  attempts: { score: number }[],
  totalMarks: number
): DistributionRange[] {
  if (attempts.length === 0 || totalMarks <= 0) return [];
  const ranges = [
    { label: '0 – 20%', min: 0, max: 20 },
    { label: '20 – 40%', min: 20, max: 40 },
    { label: '40 – 60%', min: 40, max: 60 },
    { label: '60 – 80%', min: 60, max: 80 },
    { label: '80 – 100%', min: 80, max: 101 },
  ];
  const total = attempts.length;
  return ranges.map(r => {
    const count = attempts.filter(a => {
      const pct = (Number(a.score) / totalMarks) * 100;
      return pct >= r.min && pct < r.max;
    }).length;
    return { ...r, count, pct: total > 0 ? (count / total) * 100 : 0 };
  });
}

// Aggregates the DISPLAY metric for the students page. Callers must pass
// per-attempt `percentage` (already derived from raw marks via
// `calculatePercentage`) — never raw marks. The names avgPct/bestPct make the
// percentage semantics explicit so raw marks can't silently leak through.
export function computeStudentStats(
  studentAttempts: { percentage: number; submitted_at: string }[]
): StudentStats {
  const totalExams = studentAttempts.length;
  if (totalExams === 0) {
    return { totalExams: 0, avgPct: 0, bestPct: 0, lastActive: null };
  }
  const avgPct = Math.round(
    studentAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / totalExams
  );
  const bestPct = Math.max(...studentAttempts.map(a => a.percentage));
  const lastActive = [...studentAttempts].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  )[0].submitted_at;
  return { totalExams, avgPct, bestPct, lastActive };
}

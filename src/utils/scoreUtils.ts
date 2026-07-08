export interface SubjectStat {
  subject: string;
  accuracy: number;
  correct: number;
  total: number;
  status: 'Strong' | 'Average' | 'Weak';
}

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
  avgScore: number;
  bestScore: number;
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

export function classifyPerformance(accuracy: number): 'Strong' | 'Average' | 'Weak' {
  if (accuracy >= 70) return 'Strong';
  if (accuracy <= 50) return 'Weak';
  return 'Average';
}

export function computeSubjectStats(
  answers: { subject_name: string; is_correct: boolean }[]
): SubjectStat[] {
  const subjects: Record<string, { correct: number; total: number }> = {};
  answers.forEach(ans => {
    if (!subjects[ans.subject_name]) subjects[ans.subject_name] = { correct: 0, total: 0 };
    subjects[ans.subject_name].total += 1;
    if (ans.is_correct) subjects[ans.subject_name].correct += 1;
  });
  return Object.entries(subjects)
    .map(([name, data]) => {
      const accuracy = calculateAccuracy(data.correct, data.total);
      return {
        subject: name,
        accuracy,
        correct: data.correct,
        total: data.total,
        status: classifyPerformance(accuracy),
      };
    })
    .sort((a, b) => b.accuracy - a.accuracy);
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

export function computeStudentStats(
  studentAttempts: { score: number; submitted_at: string; duration_seconds?: number }[]
): StudentStats {
  const totalExams = studentAttempts.length;
  if (totalExams === 0) {
    return { totalExams: 0, avgScore: 0, bestScore: 0, lastActive: null };
  }
  const avgScore = Math.round(
    studentAttempts.reduce((acc, curr) => acc + curr.score, 0) / totalExams
  );
  const bestScore = Math.max(...studentAttempts.map(a => a.score));
  const lastActive = [...studentAttempts].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  )[0].submitted_at;
  return { totalExams, avgScore, bestScore, lastActive };
}

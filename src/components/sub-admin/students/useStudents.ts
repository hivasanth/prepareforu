import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useStableFetch } from '../../../hooks/useStableFetch';
import { fetchSubAdminStudents, fetchSubAdminProfile, fetchAttemptsForSubAdminStudents } from '../../../services/userService';
import { generateRequestId } from '../../../utils/logger';
import { normalizeError } from '../../../utils/errorClassification';
import type { PageError } from '../../../types/error.types';
import { downloadCSV, sanitizeFilename } from '../../../utils/csvUtils';
import { calculatePercentage, computeStudentStats } from '../../../utils/scoreUtils';
import { getLocalMonthKey } from '../../../utils/dateUtils';
import { copyText } from '../../../utils/clipboardUtils';

interface AttemptWithExam {
  id: string;
  user_id: string;
  score: number;
  duration_seconds: number | null;
  submitted_at: string;
  teacher_exams: { title: string; total_questions: number; total_marks: number } | null;
}

interface StudentAttempt {
  id: string;
  exam_name: string;
  raw_score: number;
  total_questions: number;
  total_marks: number;
  percentage: number;
  time_taken: number;
  submitted_at: string;
}

interface StudentStats {
  totalExams: number;
  avgPct: number;
  bestPct: number;
  lastActive: string | null;
}

export interface Student {
  id: string;
  full_name: string;
  email: string;
  coupon_code: string | null;
  created_at: string;
  attempts: StudentAttempt[];
  stats: StudentStats;
}

interface MonthOption {
  id: string;
  name: string;
}

export function useStudents() {
  const { user } = useAuth();
  const { mountedRef, nextId, isStale } = useStableFetch();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  // Becomes true once ANY pipeline resolves successfully. The page only shows
  // the skeleton until then — after first load, all subsequent refreshes keep
  // the last-good content (table or empty-cohort card) on screen.
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<PageError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    // Request-ownership guard: a superseded request can never write state or
    // clear the loading flag owned by the newest pipeline (rapid-refresh race).
    const id = nextId();
    setLoading(true);
    // NOTE: `error` is deliberately NOT cleared here — the previous failure
    // stays visible with a busy RetryButton while the retry runs, and is
    // cleared only when this pipeline actually resolves successfully.

    try {
      const requestId = generateRequestId('fetch_students');
      // 1 & 2. Parallel — student roster + sub-admin identity.
      // Both services propagate technical failures (no swallowed defaults):
      // a thrown error lands in the canonical ERROR branch below; only a
      // successful query with no matching profile row yields `null`.
      const [usersData, profile] = await Promise.all([
        fetchSubAdminStudents({ user, requestId }, user.id),
        fetchSubAdminProfile({ user, requestId }, user.id),
      ]);

      if (!mountedRef.current || isStale(id)) return;

      if (!profile) {
        // Genuine no-row result — setup-required business state, not an error.
        setError(normalizeError(new Error('Educator profile not found'), {
          category: 'business',
          severity: 'medium',
          fallbackMessage: 'Educator profile not found. Please contact admin.',
        }));
        return;
      }

      if (!usersData || usersData.length === 0) {
        setStudents([]);
        setError(null);
        setHasLoaded(true);
        return;
      }

      const saId = profile.id;

      // 3. Attempts for exactly this roster, scoped to this sub-admin's exams.
      const attemptsData = await fetchAttemptsForSubAdminStudents({ user, requestId }, usersData.map(u => u.id), saId);

      if (!mountedRef.current || isStale(id)) return;

      const processed: Student[] = usersData.map(u => {
        const attempts = (attemptsData || []) as AttemptWithExam[];
        const studentAttempts: StudentAttempt[] = attempts
          .filter(a => a.user_id === u.id)
          .map(a => {
            // `score` is RAW MARKS as stored by submit_attempt. The displayed
            // metric is a percentage derived via the canonical calculatePercentage
            // (total_marks <= 0 ⇒ 0, never NaN). raw marks stay visible in the
            // detail view / CSV so nothing is masked.
            const rawScore = a.score ?? 0;
            const totalMarks = a.teacher_exams?.total_marks ?? 0;
            return {
              id: a.id,
              exam_name: a.teacher_exams?.title ?? 'Unknown',
              raw_score: rawScore,
              total_questions: a.teacher_exams?.total_questions ?? 0,
              total_marks: totalMarks,
              percentage: calculatePercentage(rawScore, totalMarks),
              time_taken: a.duration_seconds ?? 0,
              submitted_at: a.submitted_at,
            };
          });

        return {
          id: u.id,
          full_name: u.full_name ?? '',
          email: u.email ?? '',
          coupon_code: u.coupon_code,
          created_at: u.created_at,
          attempts: studentAttempts,
          stats: computeStudentStats(studentAttempts),
        };
      });

      setStudents(processed);
      setError(null);
      setHasLoaded(true);
    } catch (err: unknown) {
      if (!mountedRef.current || isStale(id)) return;
      setError(normalizeError(err));
    } finally {
      // A superseded request must never clear the loading flag owned by the
      // newest request (rapid-refresh race).
      if (mountedRef.current && !isStale(id)) setLoading(false);
    }
  }, [user, nextId, mountedRef, isStale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStudents = useMemo(
    () =>
      students.filter(s => {
        const matchesSearch =
          s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase());
        // Local-calendar domain for BOTH the picker labels and the created_at
        // key, so the filter never drifts from what "Joined <date>" shows.
        const matchesMonth = monthFilter === 'all' || getLocalMonthKey(s.created_at) === monthFilter;
        return matchesSearch && matchesMonth;
      }),
    [students, searchTerm, monthFilter],
  );

  const isFilterActive = searchTerm.trim() !== '' || monthFilter !== 'all';

  const monthOptions: MonthOption[] = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        id: getLocalMonthKey(d),
        name: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
      };
    });
  }, []);

  const handleCopyClick = useCallback(
    async (s: Student): Promise<boolean> => {
      const text = `Name: ${s.full_name}\nExams: ${s.stats.totalExams}\nAverage Score: ${s.stats.avgPct}%`;
      // LAN-ORIGIN FIX: resolves true only after the write succeeds; the modal
      // only flips to "Copied" on a true result.
      return copyText(text);
    },
    [],
  );

  const handleDownloadCSV = useCallback((s: Student): boolean => {
    try {
      downloadCSV({
        filename: `${sanitizeFilename(s.full_name)}_performance.csv`,
        headers: ['Exam Name', 'Raw Score', 'Total Marks', 'Percentage (%)', 'Time Taken (s)', 'Date'],
        rows: s.attempts.map(a => [
          a.exam_name,
          a.raw_score,
          a.total_marks,
          a.percentage,
          a.time_taken,
          new Date(a.submitted_at).toLocaleDateString(),
        ]),
      });
      return true;
    } catch {
      // User-facing error feedback is owned by the modal (inline, modal-local).
      return false;
    }
  }, []);

  const openDetail = useCallback((s: Student) => {
    setSelectedStudent(s);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedStudent(null);
  }, []);

  return {
    user,
    students,
    loading,
    hasLoaded,
    error,
    searchTerm,
    setSearchTerm,
    monthFilter,
    setMonthFilter,
    selectedStudent,
    filteredStudents,
    isFilterActive,
    monthOptions,
    fetchData,
    handleCopyClick,
    handleDownloadCSV,
    openDetail,
    closeDetail,
  };
}

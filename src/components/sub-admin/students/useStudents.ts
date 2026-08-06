import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useStableFetch } from '../../../hooks/useStableFetch';
import { useToast } from '../../../hooks/useToast';
import { fetchSubAdminStudents, fetchSubAdminProfile, fetchAttemptsForSubAdminStudents } from '../../../services/userService';
import { generateRequestId } from '../../../utils/logger';
import { downloadCSV, sanitizeFilename } from '../../../utils/csvUtils';
import { computeStudentStats } from '../../../utils/scoreUtils';

interface AttemptWithExam {
  id: string;
  user_id: string;
  score: number;
  duration_seconds: number;
  submitted_at: string;
  teacher_exams: { title: string; total_questions: number };
}

interface StudentAttempt {
  id: string;
  exam_name: string;
  score: number;
  total_questions: number;
  time_taken: number;
  submitted_at: string;
}

interface StudentStats {
  totalExams: number;
  avgScore: number;
  bestScore: number;
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
  _idx?: number;
}

interface MonthOption {
  id: string;
  name: string;
}

export function useStudents() {
  const { user } = useAuth();
  const { toasts, showSuccess } = useToast();
  const { mountedRef } = useStableFetch();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const requestId = generateRequestId('fetch_students');
      const usersData = await fetchSubAdminStudents({ user, requestId }, user.id);

      if (!usersData || usersData.length === 0) {
        if (mountedRef.current) setStudents([]);
        return;
      }

      const profile = await fetchSubAdminProfile({ user, requestId }, user.id);
      const saId = profile.id;

      const studentIds = usersData.map(u => u.id);
      const attemptsData = await fetchAttemptsForSubAdminStudents({ user, requestId }, studentIds, saId);

      const processed: Student[] = usersData.map(u => {
        const attempts = (attemptsData || []) as AttemptWithExam[];
        const studentAttempts: StudentAttempt[] = attempts
          .filter(a => a.user_id === u.id)
          .map(a => ({
            id: a.id,
            exam_name: a.teacher_exams?.title ?? 'Unknown',
            score: a.score || 0,
            total_questions: a.teacher_exams?.total_questions || 0,
            time_taken: a.duration_seconds || 0,
            submitted_at: a.submitted_at,
          }));

        return {
          ...u,
          attempts: studentAttempts,
          stats: computeStudentStats(studentAttempts),
        };
      });

      if (!mountedRef.current) return;
      setStudents(processed);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err.message || 'Unable to sync with your student registry.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStudents = useMemo(() => {
    return students
      .filter(s => {
        const matchesSearch =
          s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMonth = monthFilter === 'all' || s.created_at.startsWith(monthFilter);
        return matchesSearch && matchesMonth;
      })
      .map((s, idx) => ({ ...s, _idx: idx }));
  }, [students, searchTerm, monthFilter]);

  const monthOptions: MonthOption[] = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
          id: d.toISOString().slice(0, 7),
          name: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
        };
      }),
    [],
  );

  const handleCopyClick = useCallback(
    async (s: Student) => {
      const text = `Name: ${s.full_name}\nExams: ${s.stats.totalExams}\nAverage Score: ${s.stats.avgScore}%`;
      try {
        await navigator.clipboard.writeText(text);
        setActionError(null);
        showSuccess('Student data copied to clipboard!');
      } catch {
        setActionError('Could not copy automatically. Select and copy manually.');
      }
    },
    [],
  );

  const handleDownloadCSV = useCallback((s: Student) => {
    try {
      downloadCSV({
        filename: `${sanitizeFilename(s.full_name)}_performance.csv`,
        headers: ['Exam Name', 'Score', 'Time Taken (s)', 'Date'],
        rows: s.attempts.map(a => [
          a.exam_name,
          a.score,
          a.time_taken,
          new Date(a.submitted_at).toLocaleDateString(),
        ]),
      });
      setActionError(null);
      showSuccess('Performance report generated!');
    } catch {
      setActionError('Failed to generate report');
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
    error,
    searchTerm,
    setSearchTerm,
    monthFilter,
    setMonthFilter,
    selectedStudent,
    filteredStudents,
    monthOptions,
    toasts,
    actionError, clearActionError: () => setActionError(null),
    fetchData,
    handleCopyClick,
    handleDownloadCSV,
    openDetail,
    closeDetail,
  };
}

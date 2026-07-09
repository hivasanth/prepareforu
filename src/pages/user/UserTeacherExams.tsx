import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronRight,
  CheckCircle2,
  Lock,
  FileText,
  Trophy
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useStableFetch } from '../../hooks/useStableFetch';
import { useToast } from '../../hooks/useToast';
import { getCachedTeacherExams } from '../../services/teacherExamService';
import { fetchTeacherExams } from '../../services/teacherExamService';
import {
  LoadingSkeleton,
  ErrorState,
  EmptyState
} from '../../components/common/SharedComponents';
import {
  Card,
  Button,
  Tabs,
  Badge,
  PageContainer,
  Stack,
  FilterSelect,
  IconBadge
} from '../../components/common/AntigravityUI';
import {
  createAttempt,
  fetchTeacherExamQuestions
} from '../../services/examService';
import { ExamDetailRow } from '../../components/user/ExamDetailRow';
import { TeacherLeaderboardModal } from '../../components/user/TeacherLeaderboardModal';
import type { TeacherExamStatus, TeacherExamWithAttempt, Question, AttemptSource } from '../../types/exam.types';

interface TeacherExamNavigationState {
  attemptId: string;
  questions: Question[];
  examTitle: string;
  paperName: string;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarkValue: number;
  source: AttemptSource;
}
import type { UserProfile } from '../../types/auth.types';

function getTeacherId(user: UserProfile | null): string | null {
  return user?.sub_admin_id || user?.educator_id || null;
}

function buildCacheKey(teacherId: string, userId: string): string {
  return `teacher_exams_${teacherId}_${userId}`;
}

export default function UserTeacherExams() {

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { showError } = useToast();

  const [activeTab, setActiveTab] = useState<TeacherExamStatus>('live');
  const [isStarting, setIsStarting] = useState(false);
  const [selectedLeaderboardExam, setSelectedLeaderboardExam] = useState<TeacherExamWithAttempt | null>(null);

  const [now, setNow] = useState(new Date());

  const monthsList = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const current = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'long' });
      const year = d.getFullYear();
      const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      list.push({ id, name: `${monthName} ${year}` });
    }
    return list;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => monthsList[0].id);

  const teacherId = useMemo(() => getTeacherId(user), [user]);
  const userId = user?.id ?? '';
  const cacheKey = useMemo(() => {
    if (!teacherId || !userId) return '';
    return buildCacheKey(teacherId, userId);
  }, [teacherId, userId]);

  const [exams, setExams] = useState<TeacherExamWithAttempt[]>(() => {
    if (!cacheKey) return [];
    return getCachedTeacherExams({ user }, user?.id || '') || [];
  });
  const [loading, setLoading] = useState(() => {
    if (!cacheKey) return false;
    return !getCachedTeacherExams({ user }, user?.id || '');
  });
  const [error, setError] = useState<string | null>(null);

  const { nextId, isStale } = useStableFetch();

  const loadExams = useCallback(async (force = false) => {
    if (!teacherId) return;
    const id = nextId();

    const cached = getCachedTeacherExams({ user }, user?.id || '');
    if (!cached) setLoading(true);
    setError(null);

    try {
      const data = await fetchTeacherExams({ user }, teacherId, force);
      if (isStale(id)) return;
      setExams(data);
    } catch (err: any) {
      if (isStale(id)) return;
      setError(err.message || "Failed to load assigned exams.");
    } finally {
      if (!isStale(id)) setLoading(false);
    }
  }, [teacherId, user, cacheKey]);

  useEffect(() => {
    if (teacherId) {
      loadExams(true);
    }
  }, [teacherId, activeTab, loadExams]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const [isPageVisible, setIsPageVisible] = useState(true);
  useEffect(() => {
    const handleVisibility = () => {
      setIsPageVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (!teacherId || activeTab === 'ended' || !isPageVisible) return;
    const refreshTimer = setInterval(() => {
      loadExams(true);
    }, 30000);
    return () => clearInterval(refreshTimer);
  }, [teacherId, activeTab, isPageVisible, loadExams]);

  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      const start = new Date(e.start_time);
      const end = new Date(e.end_time);
      if (activeTab === 'live') return now >= start && now <= end;
      if (activeTab === 'upcoming') return now < start;
      if (activeTab === 'ended') {
        const isEnded = now > end;
        if (!isEnded) return false;

        const examYear = end.getFullYear();
        const examMonth = String(end.getMonth() + 1).padStart(2, '0');
        const examMonthVal = `${examYear}-${examMonth}`;
        return examMonthVal === selectedMonth;
      }
      return true;
    });
  }, [exams, activeTab, selectedMonth, now]);

  const handleStartTeacherExam = useCallback(async (exam: TeacherExamWithAttempt) => {
    if (!user || isStarting) return;
    const existingAttempt = exam.attempts?.[0];
    if (existingAttempt?.status === 'completed') {
      navigate(`/review/${existingAttempt.id}`);
      return;
    }
    setIsStarting(true);
    try {
      const questions = await fetchTeacherExamQuestions(exam.id);
      const { attemptId } = await createAttempt({
        userId: user.id,
        teacherExamId: exam.id,
        source: 'teacher_exam',
        totalMarks: exam.total_marks,
        questionsSnapshot: questions
      });

      const state: TeacherExamNavigationState = {
        attemptId,
        questions,
        examTitle: exam.title,
        paperName: 'Assigned Exam',
        durationMinutes: exam.duration_minutes ?? Math.floor(
          (new Date(exam.end_time).getTime() - new Date(exam.start_time).getTime()) / 60000
        ),
        marksPerQuestion: exam.marks_per_question,
        negativeMarkValue: exam.negative_mark_value,
        source: 'teacher_exam'
      };

      navigate(`/active-exam/teacher-${exam.id}`, { state });
    } catch (err: any) {
      showError("Failed to initialize exam. Please contact your administrator.");
      setIsStarting(false);
    }
  }, [user, isStarting, navigate, showError]);

  if (authLoading) {
    return (
    <PageContainer>
        <Stack gap={16}>
          <div className="flex justify-center w-full">
            <LoadingSkeleton height={48} width={320} borderRadius={12} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {[1, 2, 3].map(i => <LoadingSkeleton key={i} height={240} borderRadius={16} />)}
          </div>
        </Stack>
      </PageContainer>
    );
  }

  if (!user?.coupon_code_used) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
      >
        <Card className="p-8 lg:p-12 max-w-lg text-center rounded-[24px] shadow-2xl flex flex-col items-center">
          <IconBadge icon={Lock} size="5xl" shape="circle" className="mb-8 opacity-20" darkClassName="rounded-full bg-primary/5 mb-8 opacity-20" />
          <h2 className="text-[20px] lg:text-[24px] font-bold text-text-primary mb-2 uppercase tracking-tight m-0">Educator Portal Locked</h2>
          <p className="text-[13px] text-text-secondary font-medium mb-8 opacity-60 uppercase tracking-wide m-0 mt-2">Access restricted to students with valid educator codes.</p>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/dashboard')}
            className="h-14"
          >
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <PageContainer className="py-2 md:py-4">
      <Stack gap={16}>
        <div className="flex justify-center w-full">
          <Tabs
            options={[
              { id: 'live', label: 'Live Sessions' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'ended', label: 'History' },
            ]}
            activeId={activeTab}
            variant="primary"
            onChange={(id) => setActiveTab(id as TeacherExamStatus)}
          />
        </div>

        {activeTab === 'ended' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border-subtle/30 pb-4">
            <h3 className="m-0 text-sm font-black text-text-secondary uppercase tracking-wider">Exam Archive</h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-[10px] font-bold text-text-secondary opacity-50 uppercase tracking-widest leading-none">Select Month</span>
              <FilterSelect
                icon={Calendar}
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={monthsList}
                className="w-full sm:w-52"
              />
            </div>
          </div>
        )}

        <div className="w-full">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <LoadingSkeleton key={i} height={300} borderRadius={16} />)}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={() => loadExams(true)} />
          ) : filteredExams.length === 0 ? (
            <EmptyState
              title={activeTab === 'ended' ? 'No Completed Exams' : `No ${activeTab} Exams`}
              subtitle={activeTab === 'ended'
                ? `You don't have any completed assessments from your teacher in ${monthsList.find(m => m.id === selectedMonth)?.name || 'this month'}.`
                : `You don't have any ${activeTab} assessments from your teacher at the moment.`
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam) => {
                const attempt = exam.attempts?.[0];
                const isDone = attempt?.status === 'completed';

                return (
                  <Card
                    key={exam.id}
                    className="relative overflow-hidden p-4 shadow-lg flex flex-col min-h-[220px] transition-all lg:hover:border-primary/30 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <IconBadge icon={FileText} size="xl" shape="rounded" className="lg:group-hover:text-primary lg:group-hover:bg-primary/5 transition-all" darkClassName="rounded-xl bg-hover-bg border border-border-subtle text-text-secondary lg:group-hover:text-primary lg:group-hover:bg-primary/5 transition-all" />
                      {isDone ? (
                        <Badge variant="success" icon={CheckCircle2}>ATTEMPTED</Badge>
                      ) : activeTab === 'live' ? (
                        <Badge variant="danger" pulse>
                          <span className="w-1.5 h-1.5 rounded-full bg-danger" />LIVE NOW
                        </Badge>
                      ) : activeTab === 'ended' ? (
                        <Badge variant="default">ENDED</Badge>
                      ) : null}
                    </div>

                    <div className="space-y-1 mb-4">
                      <h3 className="m-0 text-[15px] font-bold text-text-primary uppercase tracking-tight truncate lg:group-hover:text-primary transition-colors">{exam.title}</h3>
                      <p className="m-0 text-[11px] text-text-secondary font-medium line-clamp-1 opacity-60">
                        {exam.instructions || 'Standard examination protocols applied.'}
                      </p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <ExamDetailRow icon={Calendar} label="DATED" value={new Date(exam.start_time).toLocaleDateString()} />
                      {isDone && (
                        <ExamDetailRow
                          icon={Trophy}
                          label="SCORE"
                          value={`${attempt.score}/${exam.total_marks}`}
                        />
                      )}
                    </div>

                    <div className="mt-auto flex flex-col gap-2">
                      {isDone ? null : (
                        <Button
                          fullWidth
                          disabled={activeTab === 'upcoming' || activeTab === 'ended' || isStarting}
                          onClick={() => handleStartTeacherExam(exam)}
                          variant="primary"
                          className={activeTab === 'upcoming' || activeTab === 'ended' ? 'opacity-40 cursor-not-allowed' : ''}
                          loading={isStarting}
                        >
                          {activeTab === 'upcoming' ? (
                            <>Locked <Lock size={14} /></>
                          ) : activeTab === 'ended' ? (
                            <>Missed Exam</>
                          ) : (
                            <>Start Attempt <ChevronRight size={16} /></>
                          )}
                        </Button>
                      )}

                      {activeTab === 'ended' && (
                        <Button
                          fullWidth
                          variant="secondary"
                          onClick={() => setSelectedLeaderboardExam(exam)}
                        >
                          <Trophy size={14} className="mr-2" /> Leaderboard
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {selectedLeaderboardExam && user && (
          <TeacherLeaderboardModal
            exam={selectedLeaderboardExam}
            user={user}
            onClose={() => setSelectedLeaderboardExam(null)}
          />
        )}

      </Stack>
    </PageContainer>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookMarked, RefreshCw, AlertCircle } from 'lucide-react'
import { UserSelectionTabs } from '../../components/user/UserSelectionTabs'
import {
  PageContainer, Stack, Card, Body, SectionReveal
} from '../../components/common/AntigravityUI'
import { fetchTopics } from '../../services/topicsService'
import type { StudyTopic } from '../../types/exam.types'
import { useAuth } from '../../context/AuthContext'
import { isExamAllowed, getAllowedExamIds } from '../../utils/examUtils'
import { useToast, ToastContainer } from '../../hooks/useToast'
import { TopicReader } from '../../components/user/TopicReader'
import { TopicListView } from '../../components/user/TopicListView'

export default function UserTopics() {
  const { user } = useAuth()
  const { toasts, showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedExam    = searchParams.get('exam')    || 'all'
  const selectedPaper   = searchParams.get('paper')   || 'all'
  const selectedSubject = searchParams.get('subject') || 'all'

  const [topics, setTopics]           = useState<StudyTopic[]>([])
  const [isLoading, setIsLoading]     = useState(false)
  const [activeTopic, setActiveTopic] = useState<StudyTopic | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const isContextValid =
    selectedExam !== 'all' && selectedExam !== 'APPSC_GROUPS' &&
    selectedPaper !== 'all' && selectedSubject !== 'all'

  const updateParams = useCallback((updates: Record<string, string>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      let changed = false
      Object.entries(updates).forEach(([key, value]) => {
        const current = prev.get(key) || 'all'
        if (current !== value) {
          changed = true
          if (value === 'all') next.delete(key)
          else next.set(key, value)
        }
      })
      return changed ? next : prev
    }, { replace: true })
  }, [setSearchParams])

  useEffect(() => {
    if (!user) return;
    const isUser = user.role === 'user';
    if (isUser) {
      const allowedExams = getAllowedExamIds(user.exam_selection);
      const isAllowed = isExamAllowed(user.exam_selection, selectedExam);
      if (!isAllowed || selectedExam === 'all') {
        const defaultExam = allowedExams[0] || 'APPSC_GROUP_1';
        updateParams({ exam: defaultExam, paper: 'all', subject: 'all' });
      }
    } else {
      if (selectedExam === 'all') {
        updateParams({ exam: 'APPSC_GROUP_1', paper: 'all', subject: 'all' });
      }
    }
  }, [selectedExam, user, updateParams])

  const setSelectedExam    = useCallback((v: string) => { updateParams({ exam: v, paper: 'all', subject: 'all' }); setActiveTopic(null) }, [updateParams])
  const setSelectedPaper   = useCallback((v: string) => { updateParams({ paper: v, subject: 'all' }); setActiveTopic(null) }, [updateParams])
  const setSelectedSubject = useCallback((v: string) => { updateParams({ subject: v }); setActiveTopic(null) }, [updateParams])

  const topicsLoadId = useRef(0)

  const loadTopics = useCallback(async () => {
    if (!isContextValid) { return }

    if (user && user.role === 'user') {
      const isAllowed = isExamAllowed(user.exam_selection, selectedExam);
      if (!isAllowed) {
        return;
      }
    }

    const id = ++topicsLoadId.current
    const isInitial = topics.length === 0 && !activeTopic
    if (isInitial) setIsLoading(true)
    try {
      const data = await fetchTopics(selectedExam, selectedPaper, selectedSubject)
      if (!isMounted.current || id !== topicsLoadId.current) return
      setTopics(data)
      setActiveTopic(null)
    } catch (err: any) {
      if (!isMounted.current || id !== topicsLoadId.current) return
      setTopics([])
      showToast(err?.message || "Failed to load topics", "error")
    } finally {
      if (isMounted.current && id === topicsLoadId.current) {
        setIsLoading(false)
      }
    }
  }, [selectedExam, selectedPaper, selectedSubject, isContextValid, user])

  useEffect(() => { loadTopics() }, [loadTopics])

  const openTopic = (topic: StudyTopic) => {
    const idx = topics.findIndex(t => t.id === topic.id)
    setActiveTopic(topic)
    setActiveIndex(idx)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goNext = () => {
    const next = activeIndex + 1
    if (next < topics.length) { setActiveTopic(topics[next]); setActiveIndex(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }
  const goPrev = () => {
    const prev = activeIndex - 1
    if (prev >= 0) { setActiveTopic(topics[prev]); setActiveIndex(prev); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  return (
    <PageContainer>
      <Stack gap="lg">
        <SectionReveal className="w-full">
          <UserSelectionTabs
            selectedExam={selectedExam}      setSelectedExam={setSelectedExam}
            selectedPaper={selectedPaper}    setSelectedPaper={setSelectedPaper}
            selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject}
            hideAll={true}
            flattenAppsc={true}
            className="bg-transparent border-none p-0 w-full"
          />
        </SectionReveal>

        {!isContextValid && topics.length === 0 && !activeTopic ? (
          <SectionReveal>
            <Card variant="subtle" className="py-8 text-center flex flex-col items-center gap-4">
              <BookMarked size={48} className="text-text-secondary opacity-20" />
              <Body secondary>Pick an Exam, Paper, and Subject above to start reading topics.</Body>
            </Card>
          </SectionReveal>
        ) : isLoading && topics.length === 0 && !activeTopic ? (
          <SectionReveal>
            <Card variant="subtle" className="py-8 flex flex-col items-center gap-4">
              <RefreshCw size={32} className="animate-spin text-primary opacity-30" />
              <p className="text-xs text-text-secondary uppercase tracking-widest">Loading topics...</p>
            </Card>
          </SectionReveal>
        ) : activeTopic ? (
          <SectionReveal>
            <TopicReader
              topic={activeTopic}
              topics={topics}
              currentIndex={activeIndex}
              onBack={() => setActiveTopic(null)}
              onNext={goNext}
              onPrev={goPrev}
            />
          </SectionReveal>
        ) : topics.length === 0 ? (
          <SectionReveal>
            <Card variant="subtle" className="py-8 text-center flex flex-col items-center gap-4">
              <AlertCircle size={40} className="text-text-secondary opacity-20" />
              <Body secondary>No topics found for this subject yet.</Body>
              <p className="text-xs text-text-secondary">Check back soon — the admin is still adding content.</p>
            </Card>
          </SectionReveal>
        ) : (
          <SectionReveal>
            <TopicListView
              selectedSubject={selectedSubject}
              topics={topics}
              onTopicClick={openTopic}
            />
          </SectionReveal>
        )}
      </Stack>

      <ToastContainer toasts={toasts} />
    </PageContainer>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSupabaseQuery } from './useSupabaseQuery'
import { fetchActiveExams } from '../services/examService'
import { adminService } from '../services/adminService'
import { fetchTopicsBySubject, type TopicItem } from '../services/topicTestService'
import type { ExamPaper, ExamSubject } from '../types/exam.types'
import { useAuth } from '../context/AuthContext'
import { isExamAllowed } from '../utils/examUtils'
import { logError } from '../utils/logger'
import { classifyError } from '../utils/errorClassification'

export const APPSC_SUB_TABS = [
  { label: 'GROUP 1', id: 'APPSC_GROUP_1' },
  { label: 'GROUP 2', id: 'APPSC_GROUP_2' },
  { label: 'GROUP 3', id: 'APPSC_GROUP_3' },
  { label: 'GROUP 4', id: 'APPSC_GROUP_4' },
]

export interface ExamPaperSubjectSelectionInput {
  selectedExam: string
  setSelectedExam: (val: string) => void
  selectedPaper?: string
  setSelectedPaper?: (val: string) => void
  selectedSubject?: string
  setSelectedSubject?: (val: string) => void
  /** Selected topic id (or topic_en for id-less topics) — URL-backed. */
  selectedTopic?: string
  setSelectedTopic?: (val: string) => void
  hideAll?: boolean
  showPapers?: boolean
  showSubjects?: boolean
  /** Opt-in Topic row (Exam -> Paper -> Subject -> Topic). */
  showTopics?: boolean
  onContextUpdate?: (labels: { exam: string; paper: string }) => void
  /** Flatten APPSC groups into individual tabs (no parent "APPSC" tab) */
  flattenAppsc?: boolean
  /** Pre-computed exam tab options (skip internal fetch) */
  customExamTabs?: { label: string; id: string }[]
  /** Pre-computed paper options (skip internal fetch) */
  customPapers?: { label: string; id: string }[]
  /** Pre-computed subject options (skip internal fetch) */
  customSubjects?: { label: string; id: string }[]
}

export interface ExamPaperSubjectSelectionResult {
  examTabs: { label: string; id: string }[]
  /** Canonical classified message when the exam-tab load fails (null otherwise). */
  examTabsError: string | null
  /** User-triggered re-run of the current exam-tab loader (no auto-retry). */
  retryExamTabs: () => void
  /** Canonical classified message when the paper list fails for the current
   *  exam (null otherwise). Custom paper data never reports errors. */
  papersError: string | null
  /** User-triggered re-run of the current paper loader (preserves the current
   *  exam/paper selection; no auto-retry). */
  refetchPapers: () => void
  isAppscActive: boolean
  displayPapers: ExamPaper[] | { label: string; id: string }[] | null
  displaySubjects: ExamSubject[] | { label: string; id: string }[] | null
  /** Live exam_topics topics for the current (exam, paper, subject) segment,
   *  retained across refetches (flicker prevention). Null when topics off. */
  displayTopics: TopicItem[] | null
  /** True while the current segment's topic list is being fetched. */
  topicsLoading: boolean
  /** Canonical classified message when the topic load fails for the current
   *  segment (null otherwise). */
  topicsError: string | null
  /** User-triggered re-run of the current topic loader (no auto-retry). */
  refetchTopics: () => void
  paperRowOpen: boolean
  subjectRowOpen: boolean
  topicsRowOpen: boolean
}

/**
 * Data + selection logic behind the cascading Exam -> Paper -> Subject container.
 * Keeps fetching, auto-selection, context-label sync and the flicker-prevention
 * retention state out of the view so the same logic is reusable anywhere.
 */
export function useExamPaperSubjectSelection(input: ExamPaperSubjectSelectionInput): ExamPaperSubjectSelectionResult {
  const {
    selectedExam, setSelectedExam,
    selectedPaper = 'all', setSelectedPaper = () => {},
    selectedSubject = 'all', setSelectedSubject,
    selectedTopic = '',
    setSelectedTopic,
    hideAll = false,
    showPapers = true,
    showSubjects = true,
    showTopics = false,
    onContextUpdate,
    customExamTabs,
    customPapers,
    customSubjects,
    flattenAppsc = false,
  } = input

  const { user } = useAuth();
  const lastLabelsRef = useRef({ exam: '', paper: '' })
  const isAppscActive = selectedExam === 'APPSC_GROUPS' || selectedExam.startsWith('APPSC_GROUP_')
  const hasCustomData = !!customExamTabs

  const isTabAllowed = (tabId: string) => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'sub_admin') return true;

    const selection = user.exam_selection;
    if (!selection) return false;

    if (selection === 'APPSC' || selection === 'APPSC_GROUPS') {
      return tabId === 'APPSC_GROUPS' || tabId.startsWith('APPSC_GROUP_');
    }

    return tabId === selection || isExamAllowed(selection, tabId);
  };

  const [examTabs, setExamTabs] = useState<{ label: string; id: string }[]>([])
  // BUG-002: an exam-tab load failure must surface as error + retry state,
  // never silently degrade to an empty tab strip. Existing valid tabs are
  // preserved on failure; the UI gates the error surface on empty tabs.
  const [examTabsError, setExamTabsError] = useState<string | null>(null)
  const [tabsRetrySeq, setTabsRetrySeq] = useState(0)

  const retryExamTabs = useCallback(() => {
    setExamTabsError(null)
    setTabsRetrySeq(seq => seq + 1)
  }, [])

  useEffect(() => {
    if (customExamTabs) return; // skip fetch when custom data provided
    const loadTabs = async () => {
      try {
        const activeExams = await fetchActiveExams();
        const mapped = activeExams.map(ex => {
          let label = ex.name.toUpperCase();
          if (label.includes('APPSC GROUP')) {
            label = flattenAppsc ? label.replace('APPSC ', '') : 'APPSC';
          } else if (label.includes('BANK EXAMS')) {
            label = 'BANK EXAMS';
          } else {
            if (label.length > 8) {
              label = label.substring(0, 8);
            }
          }
          return { label, id: ex.exam_id };
        });

        const uniqueTabs: { label: string; id: string }[] = [];

        // Hide the 'ALL' tab for standard users
        const isUserRole = user?.role === 'user';
        if (!hideAll && !isUserRole) {
          uniqueTabs.push({ label: 'ALL', id: 'all' });
        }

        mapped.forEach(item => {
          if (item.id.startsWith('APPSC_GROUP_') && !flattenAppsc) {
            if (!uniqueTabs.some(t => t.id === 'APPSC_GROUPS')) {
              if (isTabAllowed('APPSC_GROUPS')) {
                uniqueTabs.push({ label: 'APPSC', id: 'APPSC_GROUPS' });
              }
            }
          } else {
            if (!uniqueTabs.some(t => t.id === item.id)) {
              if (isTabAllowed(item.id)) {
                uniqueTabs.push(item);
              }
            }
          }
        });

        setExamTabs(uniqueTabs);
        setExamTabsError(null);
      } catch (err) {
        logError('tabs.load_error', { error: err instanceof Error ? err.message : err });
        // Canonical classified copy only — never raw PostgREST/database errors.
        const classified = classifyError(err instanceof Error ? err : String(err));
        setExamTabsError(classified.message);
      }
    };
    loadTabs();
  }, [hideAll, user, customExamTabs, tabsRetrySeq]);

  // BUG-003 remediation: the papers query error is captured (never discarded)
  // so a failed paper load surfaces as an explicit error + retry surface in
  // AdminSelectionTabs instead of a silent empty paper row.
  const { data: dbPapers, loading: papersLoading, error: dbPapersError, refetch: refetchDbPapers } = useSupabaseQuery<ExamPaper[]>(async () => {
    if (customPapers || !showPapers) return { data: [], error: null } // skip when custom data provided or paper row disabled
    if (selectedExam === 'all' || selectedExam === 'APPSC_GROUPS') return { data: [], error: null }
    const papers = await adminService.fetchPapersByExam(selectedExam)
    return { data: papers, error: null }
  }, [selectedExam, customPapers, showPapers], 'selection_papers')

  const { data: dbSubjects, loading: subjectsLoading } = useSupabaseQuery<ExamSubject[]>(async () => {
    if (customSubjects) return { data: [], error: null } // skip when custom data provided
    if (!selectedPaper || selectedPaper === 'all' || !showSubjects) return { data: [], error: null }
    const subjects = await adminService.fetchSubjectsByPaper(selectedPaper)
    return { data: subjects, error: null }
  }, [selectedPaper, showSubjects, customSubjects], 'selection_subjects')

  const { data: dbTopics, loading: topicsLoading, error: dbTopicsError, refetch: refetchDbTopics } = useSupabaseQuery<TopicItem[]>(async () => {
    if (!showTopics || !setSelectedTopic) return { data: [], error: null }
    if (selectedExam === 'all' || selectedPaper === 'all' || selectedSubject === 'all') return { data: [], error: null }
    const topics = await fetchTopicsBySubject(selectedExam, selectedPaper, selectedSubject)
    return { data: topics, error: null }
  }, [selectedExam, selectedPaper, selectedSubject, showTopics, setSelectedTopic], 'selection_topics')

  const papers = customPapers || dbPapers
  const subjects = customSubjects || dbSubjects

  useEffect(() => {
    if (customExamTabs) {
      setExamTabs(prev => (prev === customExamTabs ? prev : customExamTabs))
    }
  }, [customExamTabs])

  useEffect(() => {
    if (hasCustomData) return; // parent manages auto-selection when custom data
    if (selectedExam === 'APPSC_GROUPS' && hideAll) {
      setSelectedExam(APPSC_SUB_TABS[0].id)
    }
  }, [selectedExam, hideAll, setSelectedExam, hasCustomData])

  useEffect(() => {
    if (hasCustomData) return;
    if (papers === null || papersLoading) return

    if (papers.length > 0) {
      const exists = papers.find(p => p.id === selectedPaper)
      if (!exists) {
        if (hideAll) setSelectedPaper(papers[0].id)
        else if (selectedPaper !== 'all') setSelectedPaper('all')
      } else if (selectedPaper === 'all' && hideAll) {
        setSelectedPaper(papers[0].id)
      }
    } else if (papers.length === 0) {
      if (selectedPaper !== 'all') setSelectedPaper('all')
    }
  }, [papers, papersLoading, selectedPaper, setSelectedPaper, hideAll, hasCustomData])

  useEffect(() => {
    if (!onContextUpdate) return

    let examLabel = 'ALL EXAMS'
    const mainTab = examTabs.find(t => t.id === selectedExam)
    if (mainTab && mainTab.id !== 'all') {
      examLabel = mainTab.label.toUpperCase()
    } else {
      const appscTab = APPSC_SUB_TABS.find(t => t.id === selectedExam)
      if (appscTab) {
        examLabel = `APPSC ${appscTab.label}`.toUpperCase()
      } else if (selectedExam === 'APPSC_GROUPS') {
        examLabel = 'APPSC GROUPS'
      } else if (selectedExam !== 'all') {
        examLabel = selectedExam.toUpperCase()
      }
    }

    let paperLabel = 'ALL PAPERS'
    if (selectedPaper !== 'all' && papers && papers.length > 0) {
      const paperObj = papers.find(p => p.id === selectedPaper)
      if (paperObj) {
        paperLabel = ('paper_name' in paperObj ? paperObj.paper_name : paperObj.label).toUpperCase()
      }
    }

    if (lastLabelsRef.current.exam !== examLabel || lastLabelsRef.current.paper !== paperLabel) {
      lastLabelsRef.current = { exam: examLabel, paper: paperLabel }
      onContextUpdate({ exam: examLabel, paper: paperLabel })
    }
  }, [selectedExam, selectedPaper, papers, examTabs, onContextUpdate])

  useEffect(() => {
    if (hasCustomData) return;
    if (subjects === null || subjectsLoading || !setSelectedSubject || !showSubjects) return

    if (subjects.length > 0) {
      const exists = subjects.find(s => 'subject_name' in s ? s.subject_name === selectedSubject : s.label === selectedSubject)
      if (!exists) {
        if (hideAll) setSelectedSubject('subject_name' in subjects[0] ? subjects[0].subject_name : subjects[0].label)
        else if (selectedSubject !== 'all') setSelectedSubject('all')
      }
    } else if (subjects.length === 0) {
      if (selectedSubject !== 'all') setSelectedSubject('all')
    }
  }, [subjects, subjectsLoading, selectedSubject, setSelectedSubject, hideAll, showSubjects, hasCustomData])

  // Retain the last non-null papers/subjects so the sub-level rows stay mounted
  // (and keep rendering their tabs) while fresh data is being fetched. This is
  // what stops the container from collapsing-to-zero and re-expanding on every
  // exam/paper switch — the root cause of the flicker / visual flash.
  const [displayPapers, setDisplayPapers] = useState<ExamPaper[] | { label: string; id: string }[] | null>(null)
  const [displaySubjects, setDisplaySubjects] = useState<ExamSubject[] | { label: string; id: string }[] | null>(null)
  const [displayTopics, setDisplayTopics] = useState<TopicItem[] | null>(null)

  useEffect(() => {
    if (papers) setDisplayPapers(papers)
  }, [papers])

  useEffect(() => {
    if (subjects) setDisplaySubjects(subjects)
  }, [subjects])

  useEffect(() => {
    if (dbTopics) setDisplayTopics(dbTopics)
  }, [dbTopics])

  // Topic selection authority — the LIVE topics list of the current segment
  // is the only legitimiser of a topic selection. There is no 'all topics'
  // identity: 'all'/'' simply means "no topic chosen yet".
  //   - a selection that resolves against the live list is preserved as-is
  //     (an admin's explicit pick, or a VALID deep link, are never clobbered)
  //   - a topic_en-keyed deep link is normalised to the canonical id once
  //     the list resolves (URL identity becomes stable/canonical)
  //   - a MISSING ('') or UNKNOWN value auto-selects the FIRST live topic —
  //     the initial-load, ancestor-cascade and invalid-deep-link paths all
  //     converge here (guard on dbTopics identity keeps this one-shot per
  //     list, so no render/state loop can form)
  //   - an EMPTY resolved list clears the selection to '' so callers render
  //     the no-topics state instead of a permanent pending topic
  useEffect(() => {
    if (!showTopics || !setSelectedTopic) return
    if (dbTopics === null || dbTopics === undefined) return
    if (dbTopics.length === 0) {
      if (selectedTopic !== '') setSelectedTopic('')
      return
    }
    const liveId = (t: TopicItem) => t.id ?? t.topic_en
    if (dbTopics.some(t => liveId(t) === selectedTopic)) return
    const byName = dbTopics.find(t => t.topic_en === selectedTopic)
    if (byName) {
      setSelectedTopic(liveId(byName))
      return
    }
    setSelectedTopic(liveId(dbTopics[0]))
  }, [dbTopics, selectedTopic, setSelectedTopic, showTopics])

  // Custom paper data bypasses the query entirely — it can never fail here.
  const papersError = customPapers ? null : dbPapersError

  // Sub-level rows stay open whenever a fetch is in flight OR the current
  // fetch failed (BUG-003: the error/retry surface must be reachable) OR
  // valid data is present. Without the error branch a failed paper load would
  // collapse the row entirely and hide its retry surface.
  const paperRowOpen =
    showPapers &&
    selectedExam !== 'all' &&
    selectedExam !== 'APPSC_GROUPS' &&
    (papersLoading ||
      !!papersError ||
      (displayPapers !== null && displayPapers.length > 0))

  const subjectRowOpen =
    showSubjects &&
    !!setSelectedSubject &&
    selectedPaper !== 'all' &&
    (subjectsLoading || (displaySubjects !== null && displaySubjects.length > 0))

  // Topic row is opt-in and only exists below a concrete subject segment. It
  // stays open while a fetch is in flight OR after a failed load (so the
  // error + retry surface is reachable) OR whenever live topics have resolved
  // (including an empty list, so the "no topics" empty state can render).
  const topicsRowOpen =
    showTopics &&
    !!setSelectedTopic &&
    selectedPaper !== 'all' &&
    selectedSubject !== 'all' &&
    (topicsLoading || !!dbTopicsError || displayTopics !== null)

  return {
    examTabs,
    examTabsError,
    retryExamTabs,
    papersError,
    refetchPapers: refetchDbPapers,
    isAppscActive,
    displayPapers,
    displaySubjects,
    displayTopics,
    topicsLoading,
    topicsError: dbTopicsError,
    refetchTopics: refetchDbTopics,
    paperRowOpen,
    subjectRowOpen,
    topicsRowOpen,
  }
}

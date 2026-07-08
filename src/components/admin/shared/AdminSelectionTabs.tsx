import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useSupabaseQuery } from '../../../hooks/useSupabaseQuery'
import { fetchActiveExams } from '../../../services/examService'
import { adminService } from '../../../services/adminService'
import type { ExamPaper, ExamSubject } from '../../../types/exam.types'
import { Tabs, Stack } from '../../common/AntigravityUI'
import { useAuth } from '../../../context/AuthContext'
import { isExamAllowed } from '../../../utils/examUtils'
import { logError } from '../../../utils/logger'

const APPSC_SUB_TABS = [
  { label: 'GROUP 1', id: 'APPSC_GROUP_1' },
  { label: 'GROUP 2', id: 'APPSC_GROUP_2' },
  { label: 'GROUP 3', id: 'APPSC_GROUP_3' },
  { label: 'GROUP 4', id: 'APPSC_GROUP_4' },
]

interface AdminSelectionTabsProps {
  selectedExam: string
  setSelectedExam: (val: string) => void
  selectedPaper: string
  setSelectedPaper: (val: string) => void
  selectedSubject?: string
  setSelectedSubject?: (val: string) => void
  hideAll?: boolean
  showPapers?: boolean
  showSubjects?: boolean
  onContextUpdate?: (labels: { exam: string; paper: string }) => void
  className?: string
  /** Flatten APPSC groups into individual tabs (no parent "APPSC" tab) */
  flattenAppsc?: boolean
  /** Pre-computed exam tab options (skip internal fetch) */
  customExamTabs?: { label: string; id: string }[]
  /** Pre-computed paper options (skip internal fetch) */
  customPapers?: { label: string; id: string }[]
  /** Pre-computed subject options (skip internal fetch) */
  customSubjects?: { label: string; id: string }[]
}

export function AdminSelectionTabs({
  selectedExam, setSelectedExam,
  selectedPaper, setSelectedPaper,
  selectedSubject = 'all', setSelectedSubject,
  hideAll = false,
  showPapers = true,
  showSubjects = true,
  onContextUpdate,
  className = "",
  customExamTabs,
  customPapers,
  customSubjects,
  flattenAppsc = false,
}: AdminSelectionTabsProps) {
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
      } catch (err) {
        logError('tabs.load_error', { error: err instanceof Error ? err.message : err });
      }
    };
    loadTabs();
  }, [hideAll, user, customExamTabs]);

  const { data: dbPapers, loading: papersLoading } = useSupabaseQuery<ExamPaper[]>(async () => {
    if (customPapers) return { data: [], error: null } // skip when custom data provided
    if (selectedExam === 'all' || selectedExam === 'APPSC_GROUPS') return { data: [], error: null }
    const papers = await adminService.fetchPapersByExam(selectedExam)
    return { data: papers, error: null }
  }, [selectedExam, customPapers])

  const { data: dbSubjects, loading: subjectsLoading } = useSupabaseQuery<ExamSubject[]>(async () => {
    if (customSubjects) return { data: [], error: null } // skip when custom data provided
    if (!selectedPaper || selectedPaper === 'all' || !showSubjects) return { data: [], error: null }
    const subjects = await adminService.fetchSubjectsByPaper(selectedPaper)
    return { data: subjects, error: null }
  }, [selectedPaper, showSubjects, customSubjects])

  const papers = customPapers || dbPapers
  const subjects = customSubjects || dbSubjects

  useEffect(() => {
    if (customExamTabs) {
      setExamTabs(customExamTabs)
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
        paperLabel = paperObj.paper_name.toUpperCase()
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
      const exists = subjects.find(s => s.subject_name === selectedSubject)
      if (!exists) {
        if (hideAll) setSelectedSubject(subjects[0].subject_name)
        else if (selectedSubject !== 'all') setSelectedSubject('all')
      }
    } else if (subjects.length === 0) {
      if (selectedSubject !== 'all') setSelectedSubject('all')
    }
  }, [subjects, subjectsLoading, selectedSubject, setSelectedSubject, hideAll, showSubjects, hasCustomData])

  return (
    <div className={`w-full relative ${className}`}>
      <div className="w-full pt-2 p-2 rounded-[28px] bg-card-bg/50 border border-border-subtle transition-all duration-500">
        <Stack gap="sm" className="w-full">
          {/* LEVEL 1: Main exam tabs */}
          <div className="w-full flex justify-center lg:justify-start">
            <div className="w-full max-w-full overflow-x-auto custom-scrollbar">
                <Tabs 
                  options={examTabs}
                  activeId={customExamTabs ? selectedExam : (isAppscActive && !flattenAppsc ? 'APPSC_GROUPS' : selectedExam)}
                  onChange={setSelectedExam}
                  variant="primary"
                  className="w-full"
                />
            </div>
          </div>

          {/* Sub-level rows */}
          {(!customExamTabs || showPapers || showSubjects) && (
          <motion.div
            initial={false}
            animate={{ 
              height: (isAppscActive || (showPapers && papers && papers.length > 0) || (showSubjects && subjects && subjects.length > 0)) ? 'auto' : 0,
              opacity: (isAppscActive || (showPapers && papers && papers.length > 0) || (showSubjects && subjects && subjects.length > 0)) ? 1 : 0
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
            className="w-full flex flex-col overflow-hidden"
          >
            <div className="pt-3 flex flex-col gap-3">
              {/* Subtle Divider */}
              <div className="h-px w-full mx-auto opacity-30 bg-border-subtle" />

              <div>
                <Stack gap="sm">
                  {/* LEVEL 2: APPSC Specific Groups (skip when custom data or flattenAppsc — parent handles grouping) */}
                  {isAppscActive && !customExamTabs && !flattenAppsc && (
                    <div className="w-full flex justify-center lg:justify-start">
                      <div className="w-full max-w-full overflow-x-auto custom-scrollbar">
                        <Tabs 
                          options={[
                            ...(!hideAll ? [{ label: 'ALL GROUPS', id: 'APPSC_GROUPS' }] : []),
                            ...APPSC_SUB_TABS
                          ]}
                          activeId={selectedExam}
                          onChange={setSelectedExam}
                          variant="secondary"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* LEVEL 3: Papers */}
                  {showPapers && papers && papers.length > 0 && selectedExam !== 'all' && selectedExam !== 'APPSC_GROUPS' && (
                    <div className="w-full flex justify-center lg:justify-start">
                      <div className="w-full max-w-full overflow-x-auto custom-scrollbar">
                        <Tabs 
                          options={[
                            ...(!hideAll && !customPapers ? [{ label: 'ALL PAPERS', id: 'all' }] : []),
                            ...papers.map(p => ({
                              label: ('paper_name' in p ? (p as any).paper_name : (p as any).label).toUpperCase(),
                              id: p.id
                            }))
                          ]}
                          activeId={selectedPaper}
                          onChange={setSelectedPaper}
                          variant="secondary"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
  
                  {/* LEVEL 4: Subjects */}
                  {showSubjects && subjects && subjects.length > 0 && selectedPaper !== 'all' && setSelectedSubject && (
                    <div className="w-full flex justify-center lg:justify-start">
                      <div className="w-full max-w-full overflow-x-auto custom-scrollbar">
                        <Tabs 
                          options={[
                            ...(!hideAll && !customSubjects ? [{ label: 'ALL SUBJECTS', id: 'all' }] : []),
                            ...subjects.map(s => ({
                              label: ('subject_name' in s ? (s as any).subject_name : (s as any).label).toUpperCase(),
                              id: ('subject_name' in s ? (s as any).subject_name : (s as any).id)
                            }))
                          ]}
                          activeId={selectedSubject}
                          onChange={setSelectedSubject}
                          variant="secondary"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </Stack>
              </div>
            </div>
          </motion.div>
          )}
        </Stack>
      </div>
    </div>
  )
}

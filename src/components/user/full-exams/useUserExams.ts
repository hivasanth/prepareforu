import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useStableFetch } from '../../../hooks/useStableFetch'
import { usePageError } from '../../../hooks/usePageError'
import { batchCheckAvailability, fetchUserPapers } from '../../../services/examService'
import { getAllowedExamIds } from '../../../utils/examUtils'
import type { ExamPaper } from '../../../types/exam.types'

export function useUserExams() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const targetExamIds = useMemo(
    () => (user?.exam_selection ? getAllowedExamIds(user.exam_selection) : []),
    [user?.exam_selection]
  )

  const [papers, setPapers] = useState<ExamPaper[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState<string>(
    () => localStorage.getItem('selected_exam_group') || ''
  )
  const [isStarting, setIsStarting] = useState<string | null>(null)
  const [availabilityMap, setAvailabilityMap] = useState<
    Record<string, { valid: boolean; message?: string }>
  >({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { mountedRef, nextId, isStale } = useStableFetch()
  const {
    state: errorState,
    error: pageError,
    captureNetworkError,
    retry: retryError,
  } = usePageError()

  const isAppsc =
    user?.exam_selection === 'APPSC_GROUPS' || user?.exam_selection === 'APPSC'

  const groupOptions = useMemo(() => {
    const uniqueGroups = Array.from(new Set(papers.map((p) => p.exam_id))).sort()
    return uniqueGroups.map((id) => ({
      id,
      label: id.replace(/APPSC_/g, '').replace(/_/g, ' '),
    }))
  }, [papers])

  useEffect(() => {
    async function fetchData() {
      if (authLoading) return
      if (!user?.id || !user?.exam_selection) {
        if (mountedRef.current) setLoading(false)
        return
      }

      const id = nextId()
      try {
        const filteredPapers = await fetchUserPapers(targetExamIds, false)
        if (isStale(id)) return

        setPapers(filteredPapers)

        let targetGroup = 'DEFAULT'
        if (user.exam_selection === 'APPSC_GROUPS') {
          const saved = localStorage.getItem('selected_exam_group')
          const validGroups = Array.from(
            new Set(filteredPapers.map((p) => p.exam_id))
          )
          if (saved && validGroups.includes(saved)) {
            targetGroup = saved
          } else if (validGroups.length > 0) {
            targetGroup = validGroups.sort()[0]
            localStorage.setItem('selected_exam_group', targetGroup)
          }
        }
        setActiveGroup(targetGroup)

        if (filteredPapers.length > 0) {
          const results = await batchCheckAvailability(
            filteredPapers.map((p) => p.id)
          )
          if (isStale(id)) return
          setAvailabilityMap(results)
        }
      } catch (err: unknown) {
        if (isStale(id)) return
        captureNetworkError(err, {
          retryFn: () => fetchData(),
        })
      } finally {
        if (!isStale(id)) setLoading(false)
      }
    }

    fetchData()
  }, [user?.id, user?.exam_selection, authLoading])

  const handleGroupChange = useCallback((groupId: string) => {
    setActiveGroup(groupId)
    localStorage.setItem('selected_exam_group', groupId)
    setCurrentIndex(0)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0
    }
  }, [])

  const handleStartExam = useCallback(
    (paper: ExamPaper) => {
      if (!user || isStarting) return
      const availability = availabilityMap[paper.id]
      if (!availability || !availability.valid) return
      setIsStarting(paper.id)
      navigate(`/active-exam/${paper.id}`)
    },
    [user, isStarting, navigate, availabilityMap]
  )

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, clientWidth } = scrollContainerRef.current
    if (clientWidth === 0) return
    const index = Math.round(scrollLeft / clientWidth)
    setCurrentIndex((prev) => (prev === index ? prev : index))
  }, [])

  const scrollToCard = useCallback((index: number) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const scrollAmount = container.clientWidth
    container.scrollTo({ left: index * scrollAmount, behavior: 'smooth' })
    setCurrentIndex(index)
  }, [])

  const displayedPapers = isAppsc
    ? papers.filter((p) => p.exam_id === activeGroup)
    : papers

  return {
    user,
    authLoading,
    loading,
    errorState,
    pageError,
    retryError,
    isAppsc,
    groupOptions,
    activeGroup,
    handleGroupChange,
    displayedPapers,
    availabilityMap,
    isStarting,
    handleStartExam,
    currentIndex,
    handleScroll,
    scrollToCard,
    scrollContainerRef,
  }
}

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { toggleUserStatus, fetchUsersPaginated } from '../../../services/userService'
import { classifyError } from '../../../utils/errorClassification'
import { logError } from '../../../utils/logger'
import { EXAM_TABS } from '../shared/examPresets'
import type { UserRow } from '../../../types/user.types'

/** Authoritative page size — consumed by AdminUsers' range label so the UI can
 *  never drift from the query contract. */
export const USERS_PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

/** The tabs this page actually renders are THE authoritative exam-id set for
 *  this feature (AU-2). No second allowlist exists. */
const VALID_EXAM_IDS = EXAM_TABS.map((tab) => tab.id)

export function useAdminUsers() {
  const { user } = useAuth()
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('exam') || 'all'

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [page, setPage] = useState(1)
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, boolean>>({})
  const [confirmToggle, setConfirmToggle] = useState<UserRow | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const toggleInFlightRef = useRef(false)
  const [data, setData] = useState<{ rows: UserRow[]; total: number }>({ rows: [], total: 0 })
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  const totalPages = Math.ceil(data.total / USERS_PAGE_SIZE)

  const users = useMemo(() =>
    data.rows.map(u => ({
      ...u,
      is_active: u.id in optimisticStatus ? optimisticStatus[u.id] : u.is_active
    })),
    [data.rows, optimisticStatus]
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearchQuery(searchQuery), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const fetchData = useCallback(async () => {
    // AU-2: an unknown ?exam= URL value is normalized through the existing
    // filter system (reset to 'all' with replace semantics). The request is
    // held in LOADING until the normalized context refetches — an invalid
    // input can never resolve into a fabricated success-empty render.
    if (!VALID_EXAM_IDS.includes(activeTab)) {
      setIsUsersLoading(true)
      setUsersError(null)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('exam')
          return next
        },
        { replace: true },
      )
      return
    }
    const fetchId = ++fetchIdRef.current
    setIsUsersLoading(true)
    setUsersError(null)
    try {
      const result = await fetchUsersPaginated(
        { user, requestId: `users_fetch_${Date.now()}` },
        {
          activeTab,
          statusFilter,
          searchQuery: debouncedSearchQuery,
          page,
          pageSize: USERS_PAGE_SIZE,
        }
      )
      if (fetchId !== fetchIdRef.current) return
      setData({ rows: result.rows as unknown as UserRow[], total: result.total || 0 })
    } catch (error: unknown) {
      if (fetchId !== fetchIdRef.current) return
      // AU-5: canonical classified copy — network/auth/server distinctions come
      // from the shared classifier; raw backend text is never surfaced.
      logError('useAdminUsers.fetchData.error', { message: error instanceof Error ? error.message : String(error) })
      setUsersError(classifyError(error instanceof Error ? error : String(error)).message)
    } finally {
      if (fetchId === fetchIdRef.current) setIsUsersLoading(false)
    }
  }, [activeTab, statusFilter, debouncedSearchQuery, page, user, setSearchParams])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val)
    setPage(1)
  }, [])

  const handleStatusFilterChange = useCallback((val: string) => {
    setStatusFilter(val)
    setPage(1)
  }, [])

  const handleTabChange = useCallback((_val: string) => {
    void _val
    setPage(1)
  }, [])

  const handleToggleRequest = useCallback((target: UserRow) => {
    setConfirmToggle(target)
  }, [])

  const handleConfirmToggle = useCallback(async () => {
    const target = confirmToggle
    if (!target || toggleInFlightRef.current) return
    const { id, is_active: currentStatus } = target
    const newStatus = !currentStatus

    toggleInFlightRef.current = true
    setTogglingId(id)
    setActionSuccess(null)
    setOptimisticStatus(prev => ({ ...prev, [id]: newStatus }))

    try {
      const result = await toggleUserStatus(
        { user, requestId: `user_toggle_${Date.now()}` },
        id,
        newStatus
      )
      if (!result.success) throw new Error(result.error?.message)
      setActionError(null)
      setConfirmToggle(null)
      setActionSuccess(`User ${newStatus ? 'activated' : 'deactivated'} successfully.`)
      fetchData()
    } catch (err: unknown) {
      setOptimisticStatus(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      logError('useAdminUsers.toggleUserStatus.error', { message: err instanceof Error ? err.message : String(err) })
      setActionError('Failed to update user status. Please try again.')
      setConfirmToggle(null)
    } finally {
      toggleInFlightRef.current = false
      setTogglingId(null)
    }
  }, [confirmToggle, user, fetchData])

  return {
    actionError, actionSuccess, clearActionSuccess: () => setActionSuccess(null),
    activeTab, users, totalUsers: data.total, isUsersLoading, usersError,
    searchQuery, statusFilter, page, totalPages,
    togglingId, isToggling: togglingId !== null,
    handleSearchChange, handleStatusFilterChange, handleTabChange,
    handlePageChange: setPage,
    handleToggleRequest,
    handleConfirmToggle,
    handleRetry: fetchData,
    confirmToggle, setConfirmToggle,
  }
}

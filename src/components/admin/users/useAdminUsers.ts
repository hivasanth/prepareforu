import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KNOWN_EXAM_IDS } from '../../../lib/examUtils'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../hooks/useToast'
import { toggleUserStatus, fetchUsersPaginated } from '../../../services/userService'
import { logError } from '../../../utils/logger'
import type { UserRow } from '../../../types/user.types'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export function useAdminUsers() {
  const { user } = useAuth()
  const { toasts, showSuccess } = useToast()
  const [actionError, setActionError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
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

  const totalPages = Math.ceil(data.total / PAGE_SIZE)

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
    if (activeTab !== 'all' && !KNOWN_EXAM_IDS.includes(activeTab)) {
      setData({ rows: [], total: 0 })
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
          pageSize: PAGE_SIZE,
        }
      )
      if (fetchId !== fetchIdRef.current) return
      setData({ rows: result.rows as unknown as UserRow[], total: result.total || 0 })
    } catch (error: any) {
      if (fetchId !== fetchIdRef.current) return
      logError('useAdminUsers.fetchData.error', { message: error?.message || String(error) })
      setUsersError('Failed to load users. Please try again.')
    } finally {
      if (fetchId === fetchIdRef.current) setIsUsersLoading(false)
    }
  }, [activeTab, statusFilter, debouncedSearchQuery, page, user])

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
      showSuccess(`User ${newStatus ? 'activated' : 'deactivated'} successfully.`)
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
  }, [confirmToggle, user, showSuccess, fetchData])

  return {
    toasts, actionError, activeTab,
    users, totalUsers: data.total, isUsersLoading, usersError,
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

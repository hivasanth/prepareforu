import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotificationType = 'info' | 'success' | 'warning' | 'exam' | 'student' | 'system'

export interface AppNotification {
  id: string
  user_id: string
  title: string
  body: string | null
  type: NotificationType
  link: string | null
  is_read: boolean
  created_at: string
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  // ── Fetch latest 30 notifications ─────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      if (!error && data) {
        setNotifications(data as AppNotification[])
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return

    fetchNotifications()

    let isSubscribed = false
    let pendingCleanup = false

    const channelId = Math.random().toString(36).substring(7)
    const channel = supabase
      .channel(`notifications:${user.id}:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const incoming = payload.new as AppNotification
          setNotifications(prev => [incoming, ...prev].slice(0, 30))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as AppNotification
          setNotifications(prev =>
            prev.map(n => (n.id === updated.id ? updated : n))
          )
        }
      )

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribed = true
        if (pendingCleanup) {
          supabase.removeChannel(channel)
        }
      }
    })

    channelRef.current = channel

    return () => {
      if (isSubscribed) {
        supabase.removeChannel(channel)
      } else {
        pendingCleanup = true
      }
    }
  }, [user?.id, fetchNotifications])

  // ── Mark a single notification as read ────────────────────────────────────
  const markRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    )
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user?.id ?? '')
  }, [user?.id])

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    if (!user?.id) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
  }, [user?.id])

  // ── Delete a single notification ──────────────────────────────────────────
  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user?.id ?? '')
  }, [user?.id])

  // ── Clear all notifications ───────────────────────────────────────────────
  const clearAll = useCallback(async () => {
    if (!user?.id) return
    setNotifications([])
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
  }, [user?.id])

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    deleteNotification,
    clearAll,
    refresh: fetchNotifications,
  }
}

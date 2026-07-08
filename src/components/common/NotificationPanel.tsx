import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  BookOpen,
  Users,
  Info,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  RefreshCcw,
} from 'lucide-react'
import { useNotifications, type AppNotification, type NotificationType } from '../../hooks/useNotifications'
import { useTheme } from '../../context/ThemeContext'
import { IconBadge } from './AntigravityUI'

// ─── Icon resolver per type ────────────────────────────────────────────────────
function typeIconInfo(type: NotificationType): { icon: LucideIcon; color: string } {
  switch (type) {
    case 'exam':    return { icon: BookOpen,      color: 'text-blue-400' }
    case 'student': return { icon: Users,         color: 'text-green-400' }
    case 'success': return { icon: CheckCircle,   color: 'text-green-500' }
    case 'warning': return { icon: AlertTriangle, color: 'text-amber-400' }
    case 'system':  return { icon: ShieldCheck,   color: 'text-primary' }
    default:        return { icon: Info,          color: 'text-text-secondary' }
  }
}

function typeDot(type: NotificationType) {
  switch (type) {
    case 'exam':    return 'bg-blue-400'
    case 'student': return 'bg-green-400'
    case 'success': return 'bg-green-500'
    case 'warning': return 'bg-amber-400'
    case 'system':  return 'bg-primary'
    default:        return 'bg-text-secondary'
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// ─── Single notification row ───────────────────────────────────────────────────
function NotificationRow({
  notification,
  onRead,
  onDelete,
  onNavigate,
}: {
  notification: AppNotification
  onRead: (id: string) => void
  onDelete: (id: string) => void
  onNavigate: (link: string | null) => void
}) {
  const { isDark } = useTheme()
  const { icon: TypeIcon, color } = typeIconInfo(notification.type)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
        ${!notification.is_read
          ? isDark ? 'bg-primary/5 hover:bg-primary/10' : 'bg-primary/5 hover:bg-primary/8'
          : isDark ? 'hover:bg-hover-bg/60' : 'hover:bg-hover-bg/40'
        }`}
      onClick={() => {
        onRead(notification.id)
        onNavigate(notification.link)
      }}
    >
      {/* Unread dot */}
      {!notification.is_read && (
        <span className={`absolute left-2 top-4 w-1.5 h-1.5 rounded-full ${typeDot(notification.type)}`} />
      )}

      {/* Icon */}
      <IconBadge icon={TypeIcon} size="sm" className={`mt-0.5 ${color}`} darkClassName="rounded-lg bg-hover-bg" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-bold leading-snug truncate
          ${notification.is_read ? 'text-text-secondary' : 'text-text-primary'}`}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2 leading-snug">
            {notification.body}
          </p>
        )}
        <p className="text-[10px] text-text-secondary/50 font-bold mt-1 uppercase tracking-widest">
          {timeAgo(notification.created_at)}
        </p>
      </div>

      {/* Delete button (on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(notification.id)
        }}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center 
                   rounded-lg hover:bg-danger/10 text-text-secondary hover:text-danger 
                   transition-all flex-shrink-0 mt-0.5"
      >
        <X size={12} />
      </button>
    </motion.div>
  )
}

// ─── Main Exported Component ──────────────────────────────────────────────────
interface NotificationBellProps {
  /** Whether to show dropdown on the right side (default) or left side */
  align?: 'right' | 'left'
}

export function NotificationBell({ align = 'right' }: NotificationBellProps) {
  const { notifications, unreadCount, loading, markRead, markAllRead, deleteNotification, clearAll, refresh } = useNotifications()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleNavigate = (link: string | null) => {
    if (link) {
      navigate(link)
      setOpen(false)
    }
  }

  return (
    <div ref={panelRef} className="relative">

      {/* ── Bell button ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-all
          ${open
            ? isDark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
            : 'hover:bg-hover-bg text-text-secondary hover:text-text-primary'
          }`}
        title="Notifications"
      >
        <Bell size={18} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-danger rounded-full
                         text-white text-[9px] font-black flex items-center justify-center border-2 border-app-bg"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Dropdown panel ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`absolute top-12 z-[200] w-80 rounded-2xl shadow-2xl overflow-hidden
              border flex flex-col max-h-[420px]
              ${isDark
                ? 'bg-card-bg border-border-subtle'
                : 'bg-white border-stone-200 shadow-stone-200/60'
              }
              ${align === 'right' ? 'right-0' : 'left-0'}
            `}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b flex-shrink-0
              ${isDark ? 'border-border-subtle' : 'border-stone-100'}`}>
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-primary" />
                <span className="text-[13px] font-black text-text-primary uppercase tracking-widest">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={refresh}
                  title="Refresh"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-hover-bg text-text-secondary hover:text-text-primary transition-colors"
                >
                  <RefreshCcw size={13} />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    title="Mark all as read"
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-hover-bg text-text-secondary hover:text-primary transition-colors"
                  >
                    <CheckCheck size={13} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    title="Clear all"
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col gap-2 p-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-xl bg-hover-bg/40 animate-pulse" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 gap-3 opacity-40">
                  <Bell size={36} className="text-text-secondary" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-text-secondary text-center">
                    No notifications yet
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map(n => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      onRead={markRead}
                      onDelete={deleteNotification}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

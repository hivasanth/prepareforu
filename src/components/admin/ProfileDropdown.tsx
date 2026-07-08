import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { 
  LogOut, 
  Bell, 
  Shield, 
  Sun, 
  Moon,
  ChevronDown
} from 'lucide-react'
import { IconBadge } from '../common/AntigravityUI'
import { useSignOutConfirmation } from '../../hooks/useSignOutConfirmation'
import { ConfirmModal } from '../common/SharedComponents'

export function ProfileDropdown() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const { isOpen: isSignOutOpen, openDialog: openSignOut, closeDialog: closeSignOut, handleConfirm: confirmSignOut } = useSignOutConfirmation(logout)

  if (!user) return null
  const initials = (user.full_name ?? user.email ?? '?')[0].toUpperCase()

  return (
    <div 
      className="relative z-[100]"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Profile Menu"
        className={`flex items-center gap-1.5 p-1 rounded-2xl transition-all duration-300 border ${
          isOpen ? 'bg-primary/10 border-primary/20 scale-105' : 'bg-card-bg border-border-subtle hover:bg-hover-bg shadow-sm'
        }`}
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center text-white text-[10px] sm:text-xs font-black shadow-lg shadow-primary/20">
          {initials}
        </div>
        <ChevronDown size={14} className={`text-text-secondary pr-1 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full right-0 mt-3 w-64 bg-card-bg/80 backdrop-blur-xl border border-border-subtle rounded-[28px] shadow-2xl overflow-hidden p-2"
          >
            {/* Header info */}
            <div className="p-4 border-b border-border-subtle/50 mb-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black">
                   {initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black text-text-primary truncate">{user.full_name}</span>
                  <span className="text-[10px] text-text-secondary font-bold truncate opacity-60">{user.email}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-1">
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                aria-label="Toggle Display Mode"
                className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-hover-bg transition-colors text-text-primary group"
              >
                <div className="flex items-center gap-3">
                  <IconBadge
                    icon={isDark ? Sun : Moon}
                    size="md"
                    className={isDark ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}
                    darkClassName="rounded-lg bg-warning/10 text-warning"
                  />
                  <span className="text-xs font-black uppercase tracking-tight">Display Mode</span>
                </div>
                <div className="text-[10px] font-black text-text-secondary bg-border-subtle/30 px-2 py-0.5 rounded-full">
                  {isDark ? 'Light' : 'Dark'}
                </div>
              </button>

              {/* Notifications */}
              <button aria-label="Notifications" className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-hover-bg transition-colors text-text-primary group">
                 <div className="flex items-center gap-3">
                    <IconBadge
                      icon={Bell}
                      size="md"
                      className="bg-secondary/10 text-secondary"
                      darkClassName="rounded-lg bg-secondary/10 text-secondary"
                    />
                    <span className="text-xs font-black uppercase tracking-tight">Updates</span>
                 </div>
                 <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
              </button>

              {/* Roles / Badge */}
              <div className="p-3">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger">
                  <Shield size={16} className="fill-danger/20" />
                  <span className="text-[10px] font-black uppercase tracking-[0.1em]">Root Privileges</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-1 pt-1 border-t border-border-subtle/50">
               <button 
                 onClick={openSignOut}
                 aria-label="Terminate Session"
                 className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-danger/10 text-text-secondary hover:text-danger transition-all group"
               >
                 <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                 <span className="text-xs font-black uppercase tracking-tight text-inherit">Terminate Session</span>
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={isSignOutOpen}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to sign in again to continue."
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        onConfirm={confirmSignOut}
        onCancel={closeSignOut}
        danger
      />
    </div>
  )
}

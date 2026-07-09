import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { useCanHover } from '../../hooks/useCanHover'
import type { StudyTopic } from '../../types/exam.types'

interface TopicCardProps {
  topic: StudyTopic
  onClick: () => void
}

export function TopicCard({ topic, onClick }: TopicCardProps) {
  const { isDark } = useTheme()
  const canHover = useCanHover()

  return (
    <motion.div
      whileHover={canHover ? (!isDark ? { y: -2, x: -2, boxShadow: "6px 6px 0px #A87828" } : { scale: 1.01 }) : {}}
      whileTap={!isDark ? { y: 2, x: 2, boxShadow: "1px 1px 0px #A87828" } : { scale: 0.99 }}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className={`group flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
        !isDark
          ? 'bg-[#FFFDF9] border-[2px] border-[#A87828] shadow-[4px_4px_0px_#8B5A10] lg:hover:bg-[#FDF5E2]'
          : 'bg-card-bg/50 border-border-subtle/40 lg:hover:border-primary/30 lg:hover:bg-hover-bg/30'
      }`}
      role="button" tabIndex={0}
    >
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
        !isDark 
          ? 'bg-[#F5EAD4] border-[2px] border-[#A87828] shadow-[2px_2px_0px_#8B5A10] text-[#0E3326]' 
          : 'bg-primary/15 text-primary'
      }`}>
        {topic.display_order}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-black text-sm truncate ${!isDark ? 'text-[#3D1F08] font-cinzel' : 'text-text-primary'}`}>
          {topic.title_en}
        </p>
        {topic.title_te && (
          <p className="text-xs text-text-secondary truncate opacity-80 mt-0.5 font-medium">{topic.title_te}</p>
        )}
        <p className="text-[11px] text-text-secondary mt-1 font-semibold">
          {topic.content_en?.length ?? 0} sections
          {topic.youtube_url ? ' · 🎬 Video' : ''}
        </p>
      </div>

      <ChevronRight
        size={18}
        className={`flex-shrink-0 transition-transform lg:group-hover:translate-x-1 ${
          !isDark ? 'text-[#0E3326] stroke-[2.5]' : 'text-text-secondary'
        }`}
      />
    </motion.div>
  )
}

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Youtube } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useCanHover } from '../../../hooks/useCanHover'
import { BilingualToggle } from '../../common/BilingualToggle'
import { H1, Body, Label } from '../../common/AntigravityTypography'
import { EmptyState } from '../../common/SharedComponents'
import { TopicSectionRenderer } from './TopicSectionRenderer'
import type { StudyTopic } from '../../../types/exam.types'

interface TopicReaderProps {
  topic: StudyTopic
  topics: StudyTopic[]
  currentIndex: number
  onBack: () => void
  onNext: () => void
  onPrev: () => void
}

export function TopicReader({
  topic, topics, currentIndex,
  onBack, onNext, onPrev
}: TopicReaderProps) {
  const { isDark } = useTheme()
  const canHover = useCanHover()
  const [lang, setLang] = useState<'en' | 'te'>('en')

  const title   = lang === 'en' ? topic.title_en   : (topic.title_te   || topic.title_en)
  const summary = lang === 'en' ? topic.summary_en  : (topic.summary_te || topic.summary_en)
  const sections = lang === 'en' ? (topic.content_en ?? []) : (topic.content_te ?? [])

  return (
    <motion.div
      key={topic.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <motion.button
          whileHover={!isDark && canHover ? { y: -1, x: -1, boxShadow: "3px 3px 0px rgba(15, 23, 42, 0.12)" } : {}}
          whileTap={!isDark ? { y: 1, x: 1, boxShadow: "1px 1px 0px rgba(15, 23, 42, 0.12)" } : {}}
          onClick={onBack}
          aria-label="Back to all topics"
          className={`flex items-center gap-1.5 text-xs font-black px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
            !isDark
              ? 'bg-white border-2 border-border-default shadow-[2px_2px_0px_rgba(15,23,42,0.12)] text-text-primary lg:hover:bg-[var(--bg-hover)]'
              : 'border-border-subtle text-text-secondary lg:hover:text-text-primary'
          }`}
        >
          <ChevronLeft size={14} className="stroke-[3]" /> All Topics
        </motion.button>

        <BilingualToggle
          displayLang={lang}
          onChange={setLang}
        />
      </div>

      <div
        className={`p-6 sm:p-8 space-y-6 transition-all ${
          !isDark 
            ? 'bg-white border-[3px] border-border-default shadow-[8px_8px_0px_rgba(15,23,42,0.12)] rounded-3xl' 
            : 'bg-card-bg border border-border-subtle rounded-2xl shadow-xl'
        }`}
      >
        <div className="space-y-4 pb-6 border-b border-border-subtle/30">
          <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                !isDark 
                  ? 'bg-[var(--bg-elevated)] border-2 border-border-default shadow-[2.5px_2.5px_0px_rgba(15,23,42,0.12)] text-text-primary' 
                  : 'bg-primary/20 text-primary'
              }`}>
                {topic.display_order}
              </div>
              <div>
                <H1 className={`text-xl sm:text-2xl font-black leading-tight tracking-tight ${
                  !isDark ? 'font-cinzel text-text-title' : 'text-text-primary'
                }`}>
                  {title}
                </H1>
                {lang === 'te' && topic.title_en && (
                  <Body className="text-xs text-text-secondary mt-1">{topic.title_en}</Body>
                )}
              </div>
            </div>

            {topic.youtube_url && (
              <motion.a
                whileHover={!isDark && canHover ? { y: -1, x: -1, boxShadow: "4px 4px 0px rgba(15, 23, 42, 0.12)" } : {}}
                whileTap={!isDark ? { y: 1, x: 1, boxShadow: "1px 1px 0px rgba(15, 23, 42, 0.12)" } : {}}
                href={topic.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                  !isDark
                    ? 'bg-[var(--danger)] border-2 border-border-default text-white shadow-[2px_2px_0px_rgba(15,23,42,0.12)]'
                    : 'bg-red-600/90 text-white lg:hover:bg-red-500 shadow-md shadow-red-900/30'
                }`}
              >
                <Youtube size={14} className="stroke-[2.5]" />
                Watch Video
              </motion.a>
            )}
          </div>

          {summary && (
            <Body className={`text-sm leading-relaxed ${
              !isDark ? 'text-text-secondary font-medium font-sans' : 'text-text-secondary'
            }`}>
              {summary}
            </Body>
          )}
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={lang}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {sections.length > 0 ? (
                sections.map((sec, _idx) => (
                  <div key={sec.label_en + sec.type}>
                    <TopicSectionRenderer section={sec} lang={lang} />
                  </div>
                ))
              ) : (
                <EmptyState icon="📚" title="No content yet" subtitle="This topic has no content for the selected language." />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pb-4 pt-2">
        <motion.button
          whileHover={!isDark && canHover && currentIndex > 0 ? { y: -1, x: -1, boxShadow: "4px 4px 0px rgba(15, 23, 42, 0.12)" } : {}}
          whileTap={!isDark && currentIndex > 0 ? { y: 1, x: 1, boxShadow: "1px 1px 0px rgba(15, 23, 42, 0.12)" } : {}}
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border text-sm font-black transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            !isDark
              ? 'bg-white border-2 border-border-default shadow-[3px_3px_0px_rgba(15,23,42,0.12)] text-text-primary lg:hover:bg-[var(--bg-hover)]'
              : 'border-border-subtle text-text-secondary lg:hover:text-text-primary lg:hover:border-primary/30'
          }`}
          aria-label={currentIndex > 0 ? `Previous topic: ${topics[currentIndex - 1].title_en}` : 'Previous topic'}
        >
          <ChevronLeft size={16} className="stroke-[3]" />
          {currentIndex > 0 ? topics[currentIndex - 1].title_en : 'Previous'}
        </motion.button>

        <Label className="text-xs text-text-secondary font-black m-0">
          {currentIndex + 1} of {topics.length}
        </Label>

        <motion.button
          whileHover={!isDark && canHover && currentIndex < topics.length - 1 ? { y: -1, x: -1, boxShadow: "4px 4px 0px rgba(15, 23, 42, 0.12)" } : {}}
          whileTap={!isDark && currentIndex < topics.length - 1 ? { y: 1, x: 1, boxShadow: "1px 1px 0px rgba(15, 23, 42, 0.12)" } : {}}
          onClick={onNext}
          disabled={currentIndex === topics.length - 1}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border text-sm font-black transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            !isDark
              ? 'bg-primary text-white border-primary shadow-[3px_3px_0px_rgba(15,23,42,0.12)]'
              : 'bg-primary text-white border-primary lg:hover:bg-primary/90'
          }`}
          aria-label={currentIndex < topics.length - 1 ? `Next topic: ${topics[currentIndex + 1].title_en}` : 'Next topic'}
        >
          {currentIndex < topics.length - 1 ? topics[currentIndex + 1].title_en : 'Next'}
          <ChevronRight size={16} className="stroke-[3]" />
        </motion.button>
      </div>
    </motion.div>
  )
}

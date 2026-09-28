import { useState } from 'react'
import { ChevronLeft, ChevronRight, Youtube } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { BilingualToggle } from '../../common/BilingualToggle'
import { H1, Body, Label } from '../../common/AntigravityTypography'
import { EmptyState } from '../../common/SharedComponents'
import { TopicSectionRenderer, SHADOW_BRUTAL_MD, SHADOW_BRUTAL_LG, SHADOW_BRUTAL_HERO } from './TopicSectionRenderer'
import { PAGE_TRANSITION, BUTTON_HOVER, CARD_HOVER, FOCUS_RING, MOTION_DURATION, MOTION_EASE } from '../../common/AntigravityMotion'
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
      transition={PAGE_TRANSITION}
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <motion.button
          onClick={onBack}
          aria-label="Back to all topics"
          className={`flex items-center gap-1.5 text-xs font-black px-4 py-3 rounded-xl border ${BUTTON_HOVER} ${FOCUS_RING} cursor-pointer ${
            !isDark
              ? `light:stat-card-surface light:border-card-premium-border border-2 border-border-default shadow-[${SHADOW_BRUTAL_MD}] text-text-primary lg:hover:bg-[var(--bg-hover)]`
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
        className={`p-6 sm:p-8 space-y-6 ${CARD_HOVER} ${
          !isDark 
            ? `light:stat-card-surface light:shadow-premium-card light:border-card-premium-border border-[3px] border-border-default shadow-[${SHADOW_BRUTAL_HERO}] rounded-3xl` 
            : 'bg-card-bg border border-border-subtle rounded-2xl shadow-xl'
        }`}
      >
        <div className="space-y-4 pb-6 border-b border-border-subtle/30">
          <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                !isDark 
                  ? `bg-[var(--bg-elevated)] border-2 border-border-default shadow-[${SHADOW_BRUTAL_LG}] text-text-primary` 
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
                href={topic.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black ${BUTTON_HOVER} ${FOCUS_RING} cursor-pointer ${
                  !isDark
                    ? `bg-[var(--danger)] border-2 border-border-default text-white shadow-[${SHADOW_BRUTAL_MD}]`
                    : 'bg-[var(--danger)] text-white shadow-md shadow-red-900/30'
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
              transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard }}
              className="space-y-6"
            >
              {sections.length > 0 ? (
                sections.map((sec, idx) => (
                  <div key={`${sec.label_en}|${sec.label_te ?? ''}|${sec.type}|${idx}`}>
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
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border text-sm font-black ${BUTTON_HOVER} ${FOCUS_RING} cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            !isDark
              ? `light:stat-card-surface light:border-card-premium-border border-2 border-border-default shadow-[${SHADOW_BRUTAL_MD}] text-text-primary lg:hover:bg-[var(--bg-hover)]`
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
          onClick={onNext}
          disabled={currentIndex === topics.length - 1}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border text-sm font-black ${BUTTON_HOVER} ${FOCUS_RING} cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            !isDark
              ? `bg-primary text-white border-primary shadow-[${SHADOW_BRUTAL_MD}]`
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

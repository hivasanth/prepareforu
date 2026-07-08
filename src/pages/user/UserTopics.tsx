import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BookMarked, ChevronRight, ChevronLeft, Youtube,
  RefreshCw, AlertCircle
} from 'lucide-react'
import { BilingualToggle } from '../../components/common/BilingualToggle'
import { UserSelectionTabs } from '../../components/user/UserSelectionTabs'
import {
  PageContainer, Stack, Card, Body, SectionReveal, useTheme
} from '../../components/common/AntigravityUI'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchTopics } from '../../services/topicsService'
import type { StudyTopic, TopicSection } from '../../types/exam.types'
import { useAuth } from '../../context/AuthContext'
import { isExamAllowed, getAllowedExamIds } from '../../utils/examUtils'
import { useToast, ToastContainer } from '../../hooks/useToast'
import { FormattedBodyText } from '../../components/common/FormattedBodyText'
import { parseHeading } from '../../utils/parseOutlineText'
import { useCanHover } from '../../hooks/useCanHover'

// ─── Section Renderer ─────────────────────────────────────────────────────────
function renderSection(section: TopicSection, lang: 'en' | 'te', isDark: boolean, canHover: boolean) {
  const label = lang === 'en' ? section.label_en : section.label_te
  const items  = section.items ?? []

  const sectionHeader = label ? (
    <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${
      !isDark ? 'text-[#8B5A10] font-cinzel font-black' : 'text-primary'
    }`}>{label}</h3>
  ) : null

  switch (section.type) {

    // ── Icon Cards grid ──
    case 'key_features':
    case 'cards':
      return (
        <div key={section.label_en} className="space-y-2">
          {sectionHeader}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item, i) => {
              const headingRaw = lang === 'en' ? item.heading_en : item.heading_te
              const body    = lang === 'en' ? item.body_en    : item.body_te
              const isTableCard = headingRaw?.toLowerCase().includes('table') || headingRaw?.includes('పట్టిక')
              
              const parsed = parseHeading(headingRaw || '')

              return (
                <motion.div
                  key={i}
                  whileHover={!isDark && canHover ? { y: -2, x: -2, boxShadow: "4px 4px 0px #A87828" } : {}}
                  className={`flex flex-col sm:flex-row gap-2.5 sm:gap-3 p-4 rounded-2xl border transition-all ${
                    isTableCard ? 'col-span-1 sm:col-span-2' : ''
                  } ${
                    !isDark
                      ? 'bg-[#FFFDF9] border-[2px] border-[#A87828] shadow-[2.5px_2.5px_0px_#8B5A10]'
                      : 'bg-hover-bg/30 border-border-subtle/40 lg:hover:border-primary/30'
                  }`}
                >
                  {item.icon ? (
                    <span className={`text-2xl flex-shrink-0 leading-none w-fit ${
                      !isDark 
                        ? 'bg-[#F5EAD4] border-[1.5px] border-[#A87828] shadow-[1.5px_1.5px_0px_#8B5A10] w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0' 
                        : ''
                    }`}>{item.icon}</span>
                  ) : parsed.numberPrefix ? (
                    <span className={`flex-shrink-0 inline-flex items-center justify-center px-2 py-0.5 h-6 text-[10px] font-black tracking-wider rounded-lg border leading-none w-fit ${
                      !isDark 
                        ? 'bg-[#F5EAD4] border-[1.5px] border-[#A87828] shadow-[1.5px_1.5px_0px_#8B5A10] text-[#0E3326]' 
                        : 'bg-primary/20 border-primary/30 text-primary'
                    }`}>
                      {parsed.numberPrefix}
                    </span>
                  ) : parsed.bulletPrefix ? (
                    <span className={`flex-shrink-0 mt-2.5 w-1.5 h-1.5 rounded-full border ${
                      !isDark ? 'bg-primary border-[#A87828]' : 'bg-primary'
                    }`} />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    {parsed.text && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        {parsed.tag && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border leading-none ${
                            parsed.tag === 'IMP' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' :
                            parsed.tag === 'TIP' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' :
                            parsed.tag === 'ALERT' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30' :
                            parsed.tag === 'KEY' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30' :
                            'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30'
                          }`}>
                            {parsed.tag}
                          </span>
                        )}
                        <p className={`font-black text-sm leading-snug ${!isDark ? 'text-[#3D1F08] font-cinzel' : 'text-text-primary'}`}>
                          {parsed.text}
                        </p>
                      </div>
                    )}
                    {body && (
                      <FormattedBodyText
                        text={body}
                        className={`text-[13.5px] mt-1 leading-relaxed ${!isDark ? 'text-[#4A2E1A] font-medium' : 'text-text-secondary'}`}
                      />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )

    // ── Tags / sites ──
    case 'sites':
      return (
        <div key={section.label_en} className="space-y-2">
          {sectionHeader}
          <div className="flex flex-wrap gap-3">
            {items.map((item, i) => {
              const heading = lang === 'en' ? item.heading_en : item.heading_te
              return heading ? (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                    !isDark
                      ? 'bg-[#FDF5E2] border-[2px] border-[#A87828] shadow-[2px_2px_0px_#8B5A10] text-[#0E3326]'
                      : 'bg-primary/10 border-primary/20 text-primary'
                  }`}
                >
                  {item.icon && <span>{item.icon}</span>}
                  {heading}
                </span>
              ) : null
            })}
          </div>
        </div>
      )

    // ── Bullet list (generic list sections) ──
    case 'list':
      return (
        <div key={section.label_en} className="space-y-2">
          {sectionHeader}
          <ul className="space-y-3">
            {items.map((item, i) => {
              const headingRaw = lang === 'en' ? item.heading_en : item.heading_te
              const body       = lang === 'en' ? item.body_en    : item.body_te
              const parsed     = parseHeading(headingRaw || '')
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className={`flex-shrink-0 mt-2 w-2 h-2 rounded-full border ${
                    !isDark ? 'bg-primary border-[#A87828]' : 'bg-primary'
                  }`} />
                  <div>
                    {parsed.text && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {parsed.tag && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border leading-none ${
                            parsed.tag === 'IMP' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' :
                            parsed.tag === 'TIP' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' :
                            parsed.tag === 'ALERT' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30' :
                            parsed.tag === 'KEY' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30' :
                            'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30'
                          }`}>
                            {parsed.tag}
                          </span>
                        )}
                        <span className={`text-sm font-black ${!isDark ? 'text-[#3D1F08]' : 'text-text-primary'}`}>
                          {parsed.text}
                        </span>
                      </div>
                    )}
                    {body && (
                      <FormattedBodyText
                        text={body}
                        className={`text-sm ${!isDark ? 'text-[#4A2E1A] font-medium' : 'text-text-secondary'} mt-1`}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )

    // ── Quick Summary — badge sub-header + bullets rendered inline (no nested <li>) ──
    case 'quick_summary':
      return (
        <div key={section.label_en} className={`rounded-2xl p-5 border space-y-3 ${
          !isDark
            ? 'bg-[#FFFDF9] border-[2px] border-[#A87828] shadow-[4px_4px_0px_#8B5A10]'
            : 'bg-hover-bg/20 border-border-subtle/40'
        }`}>
          {sectionHeader}
          {items.map((item, i) => {
            const headingRaw = lang === 'en' ? item.heading_en : item.heading_te
            const body       = lang === 'en' ? item.body_en    : item.body_te
            const parsed     = parseHeading(headingRaw || '')
            return (
              <div key={i}>
                {parsed.text && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {parsed.tag && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border leading-none ${
                        parsed.tag === 'IMP' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' :
                        parsed.tag === 'TIP' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' :
                        parsed.tag === 'ALERT' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30' :
                        parsed.tag === 'KEY' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30' :
                        'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30'
                      }`}>
                        {parsed.tag}
                      </span>
                    )}
                    {parsed.numberPrefix && (
                      <span className={`text-[10px] font-black ${
                        !isDark ? 'text-[#8B5A10]' : 'text-primary opacity-60'
                      }`}>{parsed.numberPrefix}</span>
                    )}
                    <span className={`text-xs font-black uppercase tracking-wide ${
                      !isDark ? 'text-[#3D1F08]' : 'text-text-primary'
                    }`}>{parsed.text}</span>
                  </div>
                )}
                {body && (
                  <FormattedBodyText
                    text={body}
                    className={`text-sm leading-relaxed ${!isDark ? 'text-[#4A2E1A] font-medium' : 'text-text-secondary'}`}
                  />
                )}
              </div>
            )
          })}
        </div>
      )

    // ── Memory trick banner ──
    case 'memory_trick':
      return (
        <div key={section.label_en}>
          <div className={`rounded-2xl p-5 border-l-[6px] border ${
            !isDark
              ? 'bg-[#FFF8E7] border-[#A87828] border-l-[#8B5A10] shadow-[4px_4px_0px_#8B5A10] text-[#3D1F08]'
              : 'bg-primary/5 border-primary text-text-primary'
          }`}>
            {label && (
              <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${
                !isDark ? 'text-[#8B5A10]' : 'text-primary opacity-70'
              }`}>{label}</p>
            )}
            {items.map((item, i) => {
              const headingRaw = lang === 'en' ? item.heading_en : item.heading_te
              const body       = lang === 'en' ? item.body_en    : item.body_te
              const parsed     = parseHeading(headingRaw || '')
              return (
                <div key={i} className="space-y-2">
                  {parsed.text && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {parsed.tag && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border leading-none ${
                          parsed.tag === 'IMP' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
                          parsed.tag === 'TIP' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
                          parsed.tag === 'ALERT' ? 'bg-rose-500/15 text-rose-700 border-rose-500/30' :
                          parsed.tag === 'KEY' ? 'bg-purple-500/15 text-purple-700 border-purple-500/30' :
                          'bg-sky-500/15 text-sky-700 border-sky-500/30'
                        }`}>
                          {parsed.tag}
                        </span>
                      )}
                      <p className={`font-black text-sm ${!isDark ? 'font-cinzel text-[#3D1F08]' : 'text-text-primary'}`}>
                        {parsed.text}
                      </p>
                    </div>
                  )}
                  {body && (
                    <FormattedBodyText
                      text={body}
                      className="text-sm opacity-90 leading-relaxed font-medium"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )

    default:
      return null
  }
}

// ─── Topic Reader (full topic view) ──────────────────────────────────────────
function TopicReader({
  topic, topics, currentIndex,
  onBack, onNext, onPrev, isDark, canHover
}: {
  topic: StudyTopic
  topics: StudyTopic[]
  currentIndex: number
  onBack: () => void
  onNext: () => void
  onPrev: () => void
  isDark: boolean
  canHover: boolean
}) {
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
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <motion.button
          whileHover={!isDark && canHover ? { y: -1, x: -1, boxShadow: "3px 3px 0px #A87828" } : {}}
          whileTap={!isDark ? { y: 1, x: 1, boxShadow: "1px 1px 0px #A87828" } : {}}
          onClick={onBack}
          className={`flex items-center gap-1.5 text-xs font-black px-4 py-3 rounded-xl border transition-all cursor-pointer ${
            !isDark
              ? 'bg-[#FFFDF9] border-[2px] border-[#A87828] shadow-[2px_2px_0px_#8B5A10] text-[#0E3326] lg:hover:bg-[#F5EAD4]'
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

      {/* Topic card */}
      <div
        className={`p-6 sm:p-8 space-y-6 transition-all ${
          !isDark 
            ? 'bg-[#FFFDF9] border-[3px] border-[#A87828] shadow-[8px_8px_0px_#8B5A10] rounded-3xl' 
            : 'bg-card-bg border border-border-subtle rounded-2xl shadow-xl'
        }`}
      >
        {/* Header */}
        <div className="space-y-4 pb-6 border-b border-border-subtle/30">
          <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                !isDark 
                  ? 'bg-[#F5EAD4] border-[2.5px] border-[#A87828] shadow-[2.5px_2.5px_0px_#8B5A10] text-[#0E3326]' 
                  : 'bg-primary/20 text-primary'
              }`}>
                {topic.display_order}
              </div>
              <div>
                <h1 className={`text-xl sm:text-2xl font-black leading-tight tracking-tight ${
                  !isDark ? 'font-cinzel text-[#3D1F08]' : 'text-text-primary'
                }`}>
                  {title}
                </h1>
                {lang === 'te' && topic.title_en && (
                  <p className="text-xs text-text-secondary mt-1 font-medium">{topic.title_en}</p>
                )}
              </div>
            </div>

            {/* Watch video button */}
            {topic.youtube_url && (
              <motion.a
                whileHover={!isDark && canHover ? { y: -1, x: -1, boxShadow: "4px 4px 0px #A87828" } : {}}
                whileTap={!isDark ? { y: 1, x: 1, boxShadow: "1px 1px 0px #A87828" } : {}}
                href={topic.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-red-600 border-[2px] border-[#A87828] text-white shadow-[2px_2px_0px_#8B5A10]'
                    : 'bg-red-600/90 text-white lg:hover:bg-red-500 shadow-md shadow-red-900/30'
                }`}
              >
                <Youtube size={14} className="stroke-[2.5]" />
                Watch Video
              </motion.a>
            )}
          </div>

          {summary && (
            <p className={`text-sm leading-relaxed ${
              !isDark ? 'text-[#4A2E1A] font-medium font-sans' : 'text-text-secondary'
            }`}>
              {summary}
            </p>
          )}
        </div>

        {/* Sections */}
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
                sections.map((sec, i) => (
                  <div key={i}>{renderSection(sec, lang, isDark, canHover)}</div>
                ))
              ) : (
                <Body secondary className="text-center py-8">No content yet for this language.</Body>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Next / Prev navigation */}
      <div className="flex items-center justify-between gap-4 pb-4 pt-2">
        <motion.button
          whileHover={!isDark && canHover && currentIndex > 0 ? { y: -1, x: -1, boxShadow: "4px 4px 0px #A87828" } : {}}
          whileTap={!isDark && currentIndex > 0 ? { y: 1, x: 1, boxShadow: "1px 1px 0px #A87828" } : {}}
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border text-sm font-black transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            !isDark
              ? 'bg-[#FFFDF9] border-[2px] border-[#A87828] shadow-[3px_3px_0px_#8B5A10] text-[#0E3326] lg:hover:bg-[#F5EAD4]'
              : 'border-border-subtle text-text-secondary lg:hover:text-text-primary lg:hover:border-primary/30'
          }`}
          aria-label={currentIndex > 0 ? `Previous topic: ${topics[currentIndex - 1].title_en}` : 'Previous topic'}
        >
          <ChevronLeft size={16} className="stroke-[3]" />
          {currentIndex > 0 ? topics[currentIndex - 1].title_en : 'Previous'}
        </motion.button>

        <span className="text-xs text-text-secondary font-black">
          {currentIndex + 1} of {topics.length}
        </span>

        <motion.button
          whileHover={!isDark && canHover && currentIndex < topics.length - 1 ? { y: -1, x: -1, boxShadow: "4px 4px 0px #A87828" } : {}}
          whileTap={!isDark && currentIndex < topics.length - 1 ? { y: 1, x: 1, boxShadow: "1px 1px 0px #A87828" } : {}}
          onClick={onNext}
          disabled={currentIndex === topics.length - 1}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border text-sm font-black transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            !isDark
              ? 'bg-[#8B5A10] border-[2px] border-[#A87828] shadow-[3px_3px_0px_#8B5A10] text-white'
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

// ─── Topic List Card ──────────────────────────────────────────────────────────
function TopicCard({
  topic, onClick, isDark, canHover
}: {
  topic: StudyTopic; onClick: () => void; isDark: boolean; canHover: boolean
}) {
  return (
    <motion.div
      whileHover={canHover ? (!isDark ? { y: -2, x: -2, boxShadow: "6px 6px 0px #A87828" } : { scale: 1.01 }) : {}}
      whileTap={!isDark ? { y: 2, x: 2, boxShadow: "1px 1px 0px #A87828" } : { scale: 0.99 }}
      onClick={onClick}
      className={`group flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
        !isDark
          ? 'bg-[#FFFDF9] border-[2px] border-[#A87828] shadow-[4px_4px_0px_#8B5A10] lg:hover:bg-[#FDF5E2]'
          : 'bg-card-bg/50 border-border-subtle/40 lg:hover:border-primary/30 lg:hover:bg-hover-bg/30'
      }`}
      role="button" tabIndex={0}
    >
      {/* Number */}
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
        !isDark 
          ? 'bg-[#F5EAD4] border-[2px] border-[#A87828] shadow-[2px_2px_0px_#8B5A10] text-[#0E3326]' 
          : 'bg-primary/15 text-primary'
      }`}>
        {topic.display_order}
      </div>

      {/* Info */}
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

      {/* Arrow */}
      <ChevronRight
        size={18}
        className={`flex-shrink-0 transition-transform lg:group-hover:translate-x-1 ${
          !isDark ? 'text-[#0E3326] stroke-[2.5]' : 'text-text-secondary'
        }`}
      />
    </motion.div>
  )
}

// ─── Main User Topics Page ────────────────────────────────────────────────────
export default function UserTopics() {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const { toasts, showToast } = useToast()
  const canHover = useCanHover()
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedExam    = searchParams.get('exam')    || 'all'
  const selectedPaper   = searchParams.get('paper')   || 'all'
  const selectedSubject = searchParams.get('subject') || 'all'

  const [topics, setTopics]           = useState<StudyTopic[]>([])
  const [isLoading, setIsLoading]     = useState(false)
  const [activeTopic, setActiveTopic] = useState<StudyTopic | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const isContextValid =
    selectedExam !== 'all' && selectedExam !== 'APPSC_GROUPS' &&
    selectedPaper !== 'all' && selectedSubject !== 'all'

  const updateParams = useCallback((updates: Record<string, string>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      let changed = false
      Object.entries(updates).forEach(([key, value]) => {
        const current = prev.get(key) || 'all'
        if (current !== value) {
          changed = true
          if (value === 'all') next.delete(key)
          else next.set(key, value)
        }
      })
      return changed ? next : prev
    }, { replace: true })
  }, [setSearchParams])

  // Auto-redirect 'all' exam or unallowed exams to user's default exam pathway
  useEffect(() => {
    if (!user) return;
    const isUser = user.role === 'user';
    if (isUser) {
      const allowedExams = getAllowedExamIds(user.exam_selection);
      const isAllowed = isExamAllowed(user.exam_selection, selectedExam);
      if (!isAllowed || selectedExam === 'all') {
        const defaultExam = allowedExams[0] || 'APPSC_GROUP_1';
        updateParams({ exam: defaultExam, paper: 'all', subject: 'all' });
      }
    } else {
      if (selectedExam === 'all') {
        updateParams({ exam: 'APPSC_GROUP_1', paper: 'all', subject: 'all' });
      }
    }
  }, [selectedExam, user, updateParams])

  const setSelectedExam    = useCallback((v: string) => { updateParams({ exam: v, paper: 'all', subject: 'all' }); setActiveTopic(null) }, [updateParams])
  const setSelectedPaper   = useCallback((v: string) => { updateParams({ paper: v, subject: 'all' }); setActiveTopic(null) }, [updateParams])
  const setSelectedSubject = useCallback((v: string) => { updateParams({ subject: v }); setActiveTopic(null) }, [updateParams])

  // Load topics when context changes
  const topicsLoadId = useRef(0)

  const loadTopics = useCallback(async () => {
    if (!isContextValid) { return }

    // Safety check: standard users should not fetch topics for unallowed exams
    if (user && user.role === 'user') {
      const isAllowed = isExamAllowed(user.exam_selection, selectedExam);
      if (!isAllowed) {
        return;
      }
    }

    const id = ++topicsLoadId.current
    const isInitial = topics.length === 0 && !activeTopic
    if (isInitial) setIsLoading(true)
    try {
      const data = await fetchTopics(selectedExam, selectedPaper, selectedSubject)
      if (!isMounted.current || id !== topicsLoadId.current) return
      setTopics(data)
      setActiveTopic(null)
    } catch (err: any) {
      if (!isMounted.current || id !== topicsLoadId.current) return
      setTopics([])
      showToast(err?.message || "Failed to load topics", "error")
    } finally {
      if (isMounted.current && id === topicsLoadId.current) {
        setIsLoading(false)
      }
    }
  }, [selectedExam, selectedPaper, selectedSubject, isContextValid, user])

  useEffect(() => { loadTopics() }, [loadTopics])

  const openTopic = (topic: StudyTopic) => {
    const idx = topics.findIndex(t => t.id === topic.id)
    setActiveTopic(topic)
    setActiveIndex(idx)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goNext = () => {
    const next = activeIndex + 1
    if (next < topics.length) { setActiveTopic(topics[next]); setActiveIndex(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }
  const goPrev = () => {
    const prev = activeIndex - 1
    if (prev >= 0) { setActiveTopic(topics[prev]); setActiveIndex(prev); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  return (
    <PageContainer>
      <Stack gap="lg">

        {/* Selection Tabs */}
        <SectionReveal className="w-full">
          <UserSelectionTabs
            selectedExam={selectedExam}      setSelectedExam={setSelectedExam}
            selectedPaper={selectedPaper}    setSelectedPaper={setSelectedPaper}
            selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject}
            hideAll={true}
            flattenAppsc={true}
            className="bg-transparent border-none p-0 w-full"
          />
        </SectionReveal>

        {/* Content area */}
        {!isContextValid && topics.length === 0 && !activeTopic ? (
          <SectionReveal>
            <Card variant="subtle" className="py-8 text-center flex flex-col items-center gap-4">
              <BookMarked size={48} className="text-text-secondary opacity-20" />
              <Body secondary>Pick an Exam, Paper, and Subject above to start reading topics.</Body>
            </Card>
          </SectionReveal>
        ) : isLoading && topics.length === 0 && !activeTopic ? (
          <SectionReveal>
            <Card variant="subtle" className="py-8 flex flex-col items-center gap-4">
              <RefreshCw size={32} className="animate-spin text-primary opacity-30" />
              <p className="text-xs text-text-secondary uppercase tracking-widest">Loading topics...</p>
            </Card>
          </SectionReveal>
        ) : activeTopic ? (
          <SectionReveal>
            <TopicReader
              topic={activeTopic}
              topics={topics}
              currentIndex={activeIndex}
              onBack={() => setActiveTopic(null)}
              onNext={goNext}
              onPrev={goPrev}
              isDark={isDark}
              canHover={canHover}
            />
          </SectionReveal>
        ) : topics.length === 0 ? (
          <SectionReveal>
            <Card variant="subtle" className="py-8 text-center flex flex-col items-center gap-4">
              <AlertCircle size={40} className="text-text-secondary opacity-20" />
              <Body secondary>No topics found for this subject yet.</Body>
              <p className="text-xs text-text-secondary">Check back soon — the admin is still adding content.</p>
            </Card>
          </SectionReveal>
        ) : (
          <SectionReveal>
            <div className="mb-6">
              <h2 className={`font-black text-lg uppercase tracking-wider ${!isDark ? 'font-cinzel text-[#3D1F08]' : 'text-text-primary'}`}>
                {selectedSubject}
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                {topics.length} topic{topics.length !== 1 ? 's' : ''} · click any to start reading
              </p>
            </div>

            <div className="space-y-3">
              {topics.map(topic => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onClick={() => openTopic(topic)}
                  isDark={isDark}
                  canHover={canHover}
                />
              ))}
            </div>
          </SectionReveal>
        )}
      </Stack>

      <ToastContainer toasts={toasts} />
    </PageContainer>
  )
}

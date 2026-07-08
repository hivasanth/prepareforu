import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { Badge } from '../../common/AntigravityUI'
import type { TopicSection } from '../../../types/exam.types'

import { FormattedBodyText } from '../../common/FormattedBodyText'

interface ParsedPreviewProps {
  sections: TopicSection[]
  lang: 'en' | 'te'
  isDark?: boolean
}

export function ParsedPreview({ sections, lang }: ParsedPreviewProps) {
  if (sections.length === 0) return null

  const totalCards = sections.reduce((s, sec) => s + sec.items.length, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 size={16} className="text-success" />
        <span className="text-sm font-bold text-success">
          {sections.length} section{sections.length > 1 ? 's' : ''}, {totalCards} card{totalCards > 1 ? 's' : ''} ready
        </span>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 form-scrollbar">
        {sections.map((sec, si) => {
          const label = lang === 'en' ? sec.label_en : sec.label_te
          return (
            <div
              key={si}
              className="rounded-2xl border overflow-hidden border-border-subtle/40"
            >
              {/* Section header */}
              <div className="px-4 py-2.5 flex items-center gap-2 bg-primary/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {label || 'Section ' + (si + 1)}
                </span>
                <Badge variant="default" className="!text-[8px] !py-0 !px-1.5">
                  {sec.items.length} cards
                </Badge>
              </div>

              {/* Cards */}
              <div className="divide-y divide-border-subtle/30">
                {sec.items.map((item, ii) => {
                  const heading = lang === 'en' ? item.heading_en : item.heading_te
                  const body = lang === 'en' ? item.body_en : item.body_te
                  return (
                    <div key={ii} className="px-4 py-2.5 bg-hover-bg/20">
                      {heading && (
                        <p className="text-xs font-bold text-text-primary">
                          {heading}
                        </p>
                      )}
                      {body && (
                        <FormattedBodyText
                          text={body}
                          className="text-[11px] text-text-secondary mt-0.5 leading-relaxed"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

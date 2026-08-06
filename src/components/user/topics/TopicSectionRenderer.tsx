import { motion } from 'framer-motion'
import { useTheme } from '../../../context/ThemeContext'
import { useCanHover } from '../../../hooks/useCanHover'
import { FormattedBodyText } from '../../common/FormattedBodyText'
import { H3, Body, Label } from '../../common/AntigravityTypography'
import { TagBadge } from '../TagBadge'
import { parseHeading } from '../../../utils/parseOutlineText'
import type { TopicSection } from '../../../types/exam.types'

interface TopicSectionRendererProps {
  section: TopicSection
  lang: 'en' | 'te'
}

export function TopicSectionRenderer({ section, lang }: TopicSectionRendererProps) {
  const { isDark } = useTheme()
  const canHover = useCanHover()
  const label = lang === 'en' ? section.label_en : section.label_te
  const items = section.items ?? []

  const sectionHeader = label ? (
    <H3 className={`text-xs font-black uppercase tracking-widest mb-3 ${
      !isDark ? 'text-text-secondary font-cinzel font-black' : 'text-primary'
    }`}>{label}</H3>
  ) : null

  switch (section.type) {
    case 'key_features':
    case 'cards':
      return (
        <div key={section.label_en} className="space-y-2">
          {sectionHeader}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item, i) => {
              const headingRaw = lang === 'en' ? item.heading_en : item.heading_te
              const body = lang === 'en' ? item.body_en : item.body_te
              const isTableCard = headingRaw?.toLowerCase().includes('table') || headingRaw?.includes('పట్టిక')
              const parsed = parseHeading(headingRaw || '')

              return (
                <motion.div
                  key={item.heading_en ?? item.heading_te ?? i}
                  whileHover={!isDark && canHover ? { y: -2, x: -2, boxShadow: "4px 4px 0px rgba(15, 23, 42, 0.12)" } : {}}
                  className={`flex flex-col sm:flex-row gap-2.5 sm:gap-3 p-4 rounded-2xl border transition-colors ${
                    isTableCard ? 'col-span-1 sm:col-span-2' : ''
                  } ${
                    !isDark
                      ? 'bg-[var(--management-surface)] border-2 border-border-default shadow-[2.5px_2.5px_0px_rgba(15,23,42,0.12)]'
                      : 'bg-hover-bg/30 border-border-subtle/40 lg:hover:border-primary/30'
                  }`}
                >
                  {item.icon ? (
                    <span className={`text-2xl flex-shrink-0 leading-none w-fit ${
                      !isDark 
                        ? 'bg-[var(--bg-elevated)] border-[1.5px] border-border-default shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.12)] w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0' 
                        : ''
                    }`}>{item.icon}</span>
                  ) : parsed.numberPrefix ? (
                    <Label className={`flex-shrink-0 inline-flex items-center justify-center px-2 py-0.5 h-6 text-[10px] font-black tracking-wider rounded-lg border leading-none w-fit m-0 ${
                      !isDark 
                        ? 'bg-[var(--bg-elevated)] border-[1.5px] border-border-default shadow-[1.5px_1.5px_0px_rgba(15,23,42,0.12)] text-text-primary' 
                        : 'bg-primary/20 border-primary/30 text-primary'
                    }`}>
                      {parsed.numberPrefix}
                </Label>
                  ) : parsed.bulletPrefix ? (
                    <span className={`flex-shrink-0 mt-2.5 w-1.5 h-1.5 rounded-full border ${
                      !isDark ? 'bg-primary border-primary' : 'bg-primary'
                    }`} />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    {parsed.text && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        {parsed.tag && <TagBadge tag={parsed.tag} />}
                        <Body className={`font-black text-sm leading-snug ${!isDark ? 'text-text-title font-cinzel' : 'text-text-primary'}`}>
                          {parsed.text}
                        </Body>
                      </div>
                    )}
                    {body && (
                      <FormattedBodyText
                        text={body}
                        className={`text-[13.5px] mt-1 leading-relaxed ${!isDark ? 'text-text-secondary font-medium' : 'text-text-secondary'}`}
                      />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )

    case 'sites':
      return (
        <div key={section.label_en} className="space-y-2">
          {sectionHeader}
          <div className="flex flex-wrap gap-3">
            {items.map((item, i) => {
              const heading = lang === 'en' ? item.heading_en : item.heading_te
              return heading ? (
                <Label
                  key={item.heading_en ?? item.heading_te ?? i}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border transition-colors m-0 ${
                    !isDark
                      ? 'bg-[var(--management-surface)] border-2 border-border-default shadow-[2px_2px_0px_rgba(15,23,42,0.12)] text-text-primary'
                      : 'bg-primary/10 border-primary/20 text-primary'
                  }`}
                >
                  {item.icon && <span>{item.icon}</span>}
                  {heading}
                </Label>
              ) : null
            })}
          </div>
        </div>
      )

    case 'list':
      return (
        <div key={section.label_en} className="space-y-2">
          {sectionHeader}
          <ul className="space-y-3">
            {items.map((item, i) => {
              const headingRaw = lang === 'en' ? item.heading_en : item.heading_te
              const body = lang === 'en' ? item.body_en : item.body_te
              const parsed = parseHeading(headingRaw || '')
              return (
                <li key={item.heading_en ?? item.heading_te ?? i} className="flex items-start gap-3">
                  <span className={`flex-shrink-0 mt-2 w-2 h-2 rounded-full border ${
                    !isDark ? 'bg-primary border-primary' : 'bg-primary'
                  }`} />
                  <div>
                    {parsed.text && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {parsed.tag && <TagBadge tag={parsed.tag} />}
                        <Body className={`text-sm font-black m-0 ${!isDark ? 'text-text-title' : 'text-text-primary'}`}>
                          {parsed.text}
                        </Body>
                      </div>
                    )}
                    {body && (
                      <FormattedBodyText
                        text={body}
                        className={`text-sm ${!isDark ? 'text-text-secondary font-medium' : 'text-text-secondary'} mt-1`}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )

    case 'quick_summary':
      return (
        <div key={section.label_en} className={`rounded-2xl p-5 border space-y-3 ${
          !isDark
            ? 'bg-[var(--management-surface)] border-2 border-border-default shadow-[4px_4px_0px_rgba(15,23,42,0.12)]'
            : 'bg-hover-bg/20 border-border-subtle/40'
        }`}>
          {sectionHeader}
          {items.map((item, i) => {
            const headingRaw = lang === 'en' ? item.heading_en : item.heading_te
            const body = lang === 'en' ? item.body_en : item.body_te
            const parsed = parseHeading(headingRaw || '')
            return (
              <div key={item.heading_en ?? item.heading_te ?? i}>
                {parsed.text && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {parsed.tag && <TagBadge tag={parsed.tag} />}
                    {parsed.numberPrefix && (
                      <Label className={`text-[10px] font-black m-0 ${
                        !isDark ? 'text-text-secondary' : 'text-primary opacity-60'
                      }`}>{parsed.numberPrefix}</Label>
                    )}
                    <Label className={`text-xs font-black uppercase tracking-wide m-0 ${
                      !isDark ? 'text-text-title' : 'text-text-primary'
                    }`}>{parsed.text}</Label>
                  </div>
                )}
                {body && (
                  <FormattedBodyText
                    text={body}
                    className={`text-sm leading-relaxed ${!isDark ? 'text-text-secondary font-medium' : 'text-text-secondary'}`}
                  />
                )}
              </div>
            )
          })}
        </div>
      )

    case 'memory_trick':
      return (
        <div key={section.label_en}>
          <div className={`rounded-2xl p-5 border-l-[6px] border ${
            !isDark
              ? 'bg-[var(--bg-elevated)] border-border-default border-l-[var(--border-default)] shadow-[4px_4px_0px_rgba(15,23,42,0.12)] text-text-title'
              : 'bg-primary/5 border-primary text-text-primary'
          }`}>
            {label && (
              <Label className={`text-[10px] font-black uppercase tracking-widest mb-2 ${
                !isDark ? 'text-text-secondary' : 'text-primary opacity-70'
              }`}>{label}</Label>
            )}
            {items.map((item, i) => {
              const headingRaw = lang === 'en' ? item.heading_en : item.heading_te
              const body = lang === 'en' ? item.body_en : item.body_te
              const parsed = parseHeading(headingRaw || '')
              return (
                <div key={item.heading_en ?? item.heading_te ?? i} className="space-y-2">
                  {parsed.text && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {parsed.tag && <TagBadge tag={parsed.tag} />}
                      <Body className={`font-black text-sm ${!isDark ? 'font-cinzel text-text-title' : 'text-text-primary'}`}>
                        {parsed.text}
                      </Body>
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

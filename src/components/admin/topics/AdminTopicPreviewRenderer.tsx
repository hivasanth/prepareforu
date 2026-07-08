import { useState } from 'react'
import { Globe, Languages, Youtube } from 'lucide-react'
import type { StudyTopic } from '../../../types/exam.types'
import { FormattedBodyText } from '../../common/FormattedBodyText'
import { parseHeading } from '../../../utils/parseOutlineText'

interface AdminTopicPreviewRendererProps {
  topic: StudyTopic
  isDark?: boolean
}

function tagBadge(tag: string) {
  const colors: Record<string, string> = {
    IMP: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    TIP: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    ALERT: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    KEY: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  }
  const cls = colors[tag] || 'bg-sky-500/10 text-sky-500 border-sky-500/20'
  return `inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border leading-none ${cls}`
}

export function AdminTopicPreviewRenderer({ topic }: AdminTopicPreviewRendererProps) {
  const [lang, setLang] = useState<'en' | 'te'>('en')

  const title   = lang === 'en' ? topic.title_en   : (topic.title_te   || topic.title_en)
  const summary = lang === 'en' ? topic.summary_en  : (topic.summary_te || topic.summary_en)
  const sections = lang === 'en' ? (topic.content_en ?? []) : (topic.content_te ?? [])

  return (
    <div className="space-y-4 text-left">
      {/* Language toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-hover-bg/30">
          {(['en', 'te'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                lang === l
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {l === 'en' ? <Globe size={12} /> : <Languages size={12} />}
              {l === 'en' ? 'EN' : 'TE'}
            </button>
          ))}
        </div>

        {topic.youtube_url && (
          <a
            href={topic.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-750"
          >
            <Youtube size={12} />
            Watch Video
          </a>
        )}
      </div>

      <div className="p-6 rounded-[20px] border space-y-6 bg-card-bg border-border-subtle/40">
        <div className="pb-5 border-b border-border-subtle/30 space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black bg-primary/20 text-primary">
              {topic.display_order}
            </span>
            <h3 className="text-base font-black text-text-primary">
              {title}
            </h3>
          </div>
          {summary && (
            <p className="text-xs text-text-secondary leading-relaxed">
              {summary}
            </p>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.length > 0 ? (
            sections.map((sec, i) => (
              <div key={i} className="space-y-2">
                {sec.label_en || sec.label_te ? (
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">
                    {lang === 'en' ? sec.label_en : sec.label_te}
                  </h4>
                ) : null}

                {sec.type === 'key_features' || sec.type === 'cards' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sec.items?.map((item, ii) => {
                      const headingRaw = lang === 'en' ? item.heading_en : item.heading_te
                      const body    = lang === 'en' ? item.body_en    : item.body_te
                      const isTableCard = headingRaw?.toLowerCase().includes('table') || headingRaw?.includes('పట్టిక')
                      
                      const parsed = parseHeading(headingRaw || '')

                      return (
                        <div
                          key={ii}
                          className={`flex gap-3 p-4 rounded-2xl border ${
                            isTableCard ? 'col-span-1 sm:col-span-2' : ''
                          } bg-hover-bg/25 border-border-subtle/30`}
                        >
                          {item.icon ? (
                            <span className="text-xl flex-shrink-0 leading-none">{item.icon}</span>
                          ) : parsed.numberPrefix ? (
                            <span className={`flex-shrink-0 inline-flex items-center justify-center px-1.5 py-0.5 h-5 text-[9px] font-black tracking-wider rounded-md border leading-none bg-primary/10 border-primary/20 text-primary`}>
                              {parsed.numberPrefix}
                            </span>
                          ) : parsed.bulletPrefix ? (
                            <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                          ) : null}
                          <div className="min-w-0 flex-1">
                            {parsed.text && (
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                {parsed.tag && (
                                  <span className={tagBadge(parsed.tag)}>
                                    {parsed.tag}
                                  </span>
                                )}
                                <p className="font-bold text-xs text-text-primary leading-snug">
                                  {parsed.text}
                                </p>
                              </div>
                            )}
                            {body && (
                              <FormattedBodyText
                                text={body}
                                className="text-[13px] text-text-secondary mt-0.5 leading-relaxed"
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : sec.type === 'sites' ? (
                  <div className="flex flex-wrap gap-2">
                    {sec.items?.map((item, ii) => {
                      const heading = lang === 'en' ? item.heading_en : item.heading_te
                      return heading ? (
                        <span
                          key={ii}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-primary/10 border-primary/20 text-primary"
                        >
                          {item.icon && <span>{item.icon}</span>}
                          {heading}
                        </span>
                      ) : null
                    })}
                  </div>
                ) : sec.type === 'list' ? (
                  <ul className="space-y-1.5">
                    {sec.items?.map((item, ii) => {
                      const headingRaw = lang === 'en' ? item.heading_en : item.heading_te
                      const body       = lang === 'en' ? item.body_en    : item.body_te
                      const parsed     = parseHeading(headingRaw || '')
                      return (
                        <li key={ii} className="flex items-start gap-2 text-xs">
                          <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                          <div>
                            {parsed.text && (
                              <div className="flex flex-wrap items-center gap-1 mb-0.5">
                                {parsed.tag && (
                                  <span className={tagBadge(parsed.tag)}>
                                    {parsed.tag}
                                  </span>
                                )}
                                <span className="font-semibold text-text-primary">{parsed.text}</span>
                              </div>
                            )}
                            {body && (
                              <FormattedBodyText
                                text={body}
                                className="text-text-secondary mt-1 text-xs"
                              />
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : sec.type === 'quick_summary' ? (
                  <div className="rounded-xl p-3.5 border space-y-2 bg-hover-bg/20 border-border-subtle/30">
                    {sec.items?.map((item, ii) => {
                      const headingRaw = lang === 'en' ? item.heading_en : item.heading_te
                      const body       = lang === 'en' ? item.body_en    : item.body_te
                      const parsed     = parseHeading(headingRaw || '')
                      return (
                        <div key={ii}>
                          {parsed.text && (
                            <div className="flex flex-wrap items-center gap-1 mb-1.5">
                              {parsed.tag && (
                                <span className={tagBadge(parsed.tag)}>
                                  {parsed.tag}
                                </span>
                              )}
                              <span className="font-bold text-xs text-text-primary uppercase tracking-wide">{parsed.text}</span>
                            </div>
                          )}
                          {body && (
                            <FormattedBodyText
                              text={body}
                              className="text-text-secondary text-xs"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : sec.type === 'memory_trick' ? (
                  <div className="rounded-xl p-3.5 border-l-4 text-xs bg-primary/5 border-primary text-text-primary">
                    {sec.items?.map((item, ii) => {
                      const headingRaw = lang === 'en' ? item.heading_en : item.heading_te
                      const body       = lang === 'en' ? item.body_en    : item.body_te
                      const parsed     = parseHeading(headingRaw || '')
                      return (
                        <div key={ii} className="space-y-1">
                          {parsed.text && (
                            <div className="flex flex-wrap items-center gap-1 mb-0.5">
                              {parsed.tag && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border leading-none ${
                                  parsed.tag === 'IMP' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                  parsed.tag === 'TIP' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                  parsed.tag === 'ALERT' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                  parsed.tag === 'KEY' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                  'bg-sky-500/10 text-sky-500 border-sky-500/20'
                                }`}>
                                  {parsed.tag}
                                </span>
                              )}
                              <p className="font-bold text-xs">{parsed.text}</p>
                            </div>
                          )}
                          {body && (
                            <FormattedBodyText
                              text={body}
                              className="opacity-90 leading-relaxed"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-text-secondary py-4">No structured content added.</p>
          )}
        </div>
      </div>
    </div>
  )
}

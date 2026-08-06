import { useState } from 'react'
import { Globe, Languages, Youtube } from 'lucide-react'
import type { StudyTopic } from '../../../types/exam.types'
import { FormattedBodyText } from '../../common/FormattedBodyText'
import { parseHeading } from '../../../utils/parseOutlineText'
import { TagBadge } from '../../user/TagBadge'
import { Badge, Button } from '../../common/AntigravityUI'

interface AdminTopicPreviewRendererProps {
  topic: StudyTopic
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
            <Button
              key={l}
              size="xs"
              variant={lang === l ? 'primary' : 'ghost'}
              onClick={() => setLang(l)}
              className="!px-3"
            >
              {l === 'en' ? <Globe size={12} /> : <Languages size={12} />}
              {l === 'en' ? 'EN' : 'TE'}
            </Button>
          ))}
        </div>

        {topic.youtube_url && (
          <a
            href={topic.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-danger text-white hover:bg-danger/90"
          >
            <Youtube size={12} />
            Watch Video
          </a>
        )}
      </div>

      <div className="p-6 rounded-3xl border space-y-6 bg-card-bg border-border-subtle/40">
        <div className="pb-5 border-b border-border-subtle/30 space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-primary/20 text-primary">
              {topic.display_order}
            </span>
            <h3 className="text-base font-bold text-text-primary">
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
            sections.map((sec, _idx) => (
              <div key={sec.label_en + sec.type} className="space-y-2">
                {sec.label_en || sec.label_te ? (
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary">
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
                            <span className={`flex-shrink-0 inline-flex items-center justify-center px-1.5 py-0.5 h-5 text-[9px] font-bold tracking-wider rounded-md border leading-none bg-primary/10 border-primary/20 text-primary`}>
                              {parsed.numberPrefix}
                            </span>
                          ) : parsed.bulletPrefix ? (
                            <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                          ) : null}
                          <div className="min-w-0 flex-1">
                            {parsed.text && (
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                {parsed.tag && (
                                  <TagBadge tag={parsed.tag} />
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
                                  <TagBadge tag={parsed.tag} />
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
                                <TagBadge tag={parsed.tag} />
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
                            <Badge
                              variant={
                                parsed.tag === 'IMP' ? 'warning' :
                                parsed.tag === 'TIP' ? 'success' :
                                parsed.tag === 'ALERT' ? 'danger' :
                                parsed.tag === 'KEY' ? 'primary' : 'secondary'
                              }
                              size="sm"
                              className="!text-[8px] !px-1.5 !py-0.5"
                            >
                              {parsed.tag}
                            </Badge>
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
            <p className="text-center text-xs text-text-hint py-4">No structured content added.</p>
          )}
        </div>
      </div>
    </div>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { Wand2 } from 'lucide-react'
import { Alert, Button, Input, Label, Stack, TextArea } from '../../common/AntigravityUI'
import { FieldError } from '../../common/SharedComponents'
import { FORMAT_HINT, FORMAT_HINT_TE } from '../../../constants/topicFormatHints'
import { ParsedPreview } from './ParsedPreview'
import type { TopicSection } from '../../../types/exam.types'

interface LangInputPanelProps {
  lang: 'en' | 'te'
  title: string
  onTitleChange: (v: string) => void
  rawText: string
  onTextChange: (v: string) => void
  parsed: TopicSection[] | null
  onParse: () => void
  onCopyPrompt: () => void
  fieldErrors?: Partial<Record<'title_en' | 'content_en' | 'title_te' | 'content_te', string>>
  onFieldBlur?: (field: 'title_en' | 'content_en' | 'title_te' | 'content_te') => void
  /** D-3: mark the title input as the AdminModal initial-focus target (the
   * shared modal focuses [data-modal-initial-focus] on open). Should be set
   * for the English panel that is mounted when the Add/Edit modal opens. */
  initialFocusTitle?: boolean
}

export function LangInputPanel({
  lang,
  title,
  onTitleChange,
  rawText,
  onTextChange,
  parsed,
  onParse,
  onCopyPrompt,
  fieldErrors = {},
  onFieldBlur,
  initialFocusTitle = false,
}: LangInputPanelProps) {
  const isEn = lang === 'en'
  const titleError = isEn ? fieldErrors.title_en : fieldErrors.title_te
  const contentError = isEn ? fieldErrors.content_en : fieldErrors.content_te
  const titleField = (isEn ? 'title_en' : 'title_te') as 'title_en' | 'title_te'
  const contentField = (isEn ? 'content_en' : 'content_te') as 'content_en' | 'content_te'

  return (
    <div className="space-y-4">
      {/* Title field */}
      <Stack gap="sm">
        <Label htmlFor={`topic-title-${lang}`}>{isEn ? '🇬🇧 Topic Title (English)' : '🇮🇳 Topic Title (Telugu)'}</Label>
        <Input
          id={`topic-title-${lang}`}
          data-modal-initial-focus={initialFocusTitle || undefined}
          placeholder={isEn ? 'e.g. Indus Valley Civilization' : 'e.g. సింధు నాగరికత'}
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          onBlur={() => onFieldBlur?.(titleField)}
          aria-invalid={!!titleError}
          aria-describedby={titleError ? `topic-title-${lang}-error` : undefined}
        />
        {titleError && (
          <FieldError id={`topic-title-${lang}-error`}>{titleError}</FieldError>
        )}
      </Stack>

      {/* Content textarea */}
      <Stack gap="sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label htmlFor={`topic-content-${lang}`}>{isEn ? 'Content (Structured Outline)' : 'Content (నిర్మాణాత్మక రూపరేఖ)'}</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="soft"
              size="xs"
              onClick={onCopyPrompt}
              title="Copy the AI Structured Prompt Template to easily generate complete topics"
            >
              <Wand2 size={11} className="animate-pulse" />
              {isEn ? 'AI Prompt Helper' : 'AI ప్రాంప్ట్ సహాయకం'}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => { onTextChange(isEn ? FORMAT_HINT : FORMAT_HINT_TE); }}
            >
              {isEn ? 'Load Example' : 'ఉదాహరణను లోడ్ చేయి'}
            </Button>
          </div>
        </div>

        {/* Format hint box */}
        <div className="text-[11px] leading-relaxed px-3 py-2.5 rounded-xl border space-y-1.5 bg-primary/5 border-primary/20 text-text-secondary">
          <p>
            <span className="font-bold">{isEn ? 'Structure: ' : 'నిర్మాణం: '}</span>
            {isEn
              ? <><code className="font-mono">1.</code> headings · <code className="font-mono">1.1</code> <code className="font-mono">1.2</code> sub-headings (each = one card) · body text on next line</>
              : <><code className="font-mono">1.</code> శీర్షికలు · <code className="font-mono">1.1</code> ఉపశీర్షికలు (ఒక్కో కార్డ్) · తదుపరి లైన్‌లో కంటెంట్</>
            }
          </p>
          <p>
            <span className="font-bold">{isEn ? 'Rich content: ' : 'రిచ్ కంటెంట్: '}</span>
            {isEn
              ? <>Use <code className="font-mono">- bullet</code> lists · <code className="font-mono">| col | col |</code> tables · tags: <code className="font-mono">[IMP]</code> <code className="font-mono">[TIP]</code> <code className="font-mono">[ALERT]</code> <code className="font-mono">[KEY]</code> <code className="font-mono">[NOTE]</code> <code className="font-mono">[INFO]</code> before a heading title</>
              : <>బుల్లెట్లు: <code className="font-mono">- అంశం</code> · పట్టికలు: <code className="font-mono">| col | col |</code> · ట్యాగ్లు: <code className="font-mono">[IMP]</code> <code className="font-mono">[TIP]</code> <code className="font-mono">[ALERT]</code> <code className="font-mono">[KEY]</code> శీర్షిక ముందు</>
            }
          </p>
        </div>

        <TextArea
          id={`topic-content-${lang}`}
          rows={14}
          placeholder={isEn ? FORMAT_HINT : FORMAT_HINT_TE}
          value={rawText}
          onChange={e => { onTextChange(e.target.value) }}
          onBlur={() => onFieldBlur?.(contentField)}
          aria-invalid={!!contentError}
          aria-describedby={contentError ? `topic-content-${lang}-error` : undefined}
        />
        {contentError && (
          <FieldError id={`topic-content-${lang}-error`}>{contentError}</FieldError>
        )}
      </Stack>

      {/* Parse button */}
      <Button variant="primary" fullWidth onClick={onParse} disabled={!rawText.trim()}>
        <Wand2 size={15} className="mr-2" />
        {isEn ? 'Parse English Content' : 'Parse Telugu Content'}
      </Button>

      {/* Parsed preview */}
      <AnimatePresence>
        {parsed !== null && (
          parsed.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <Alert variant="error">
                {isEn ? (
                  <>Nothing parsed. Check your format — use <code>1.</code> for headings and <code>1.1</code> for sub-headings.</>
                ) : (
                  <>ఏమీ పార్స్ కాలేదు. మీ ఆకృతిని తనిఖీ చేయండి — శీర్షికల కోసం <code>1.</code> మరియు ఉపశీర్షికల కోసం <code>1.1</code> ఉపయోగించండి.</>
                )}
              </Alert>
            </motion.div>
          ) : (
            <ParsedPreview sections={parsed} lang={lang} />
          )
        )}
      </AnimatePresence>
    </div>
  )
}

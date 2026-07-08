import { AnimatePresence, motion } from 'framer-motion'
import { Wand2 } from 'lucide-react'
import { Button, Input, Label, Stack } from '../../common/AntigravityUI'
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
}: LangInputPanelProps) {
  const isEn = lang === 'en'

  const taClass = 'w-full text-sm rounded-2xl px-4 py-3 border resize-none outline-none transition-colors leading-relaxed bg-hover-bg border-border-subtle text-text-primary focus:border-primary placeholder-text-secondary'

  return (
    <div className="space-y-4">
      {/* Title field */}
      <Stack gap="sm">
        <Label>{isEn ? '🇬🇧 Topic Title (English)' : '🇮🇳 Topic Title (Telugu)'}</Label>
        <Input
          placeholder={isEn ? 'e.g. Indus Valley Civilization' : 'e.g. సింధు నాగరికత'}
          value={title}
          onChange={e => onTitleChange(e.target.value)}
        />
      </Stack>

      {/* Content textarea */}
      <Stack gap="sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label>{isEn ? 'Content (Structured Outline)' : 'Content (నిర్మాణాత్మక రూపరేఖ)'}</Label>
          <div className="flex items-center gap-2">
            <button
              onClick={onCopyPrompt}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all shadow-sm border-primary/30 text-primary hover:bg-primary/10 bg-hover-bg/30"
              title="Copy the AI Structured Prompt Template to easily generate complete topics"
            >
              <Wand2 size={11} className="animate-pulse" />
              {isEn ? 'AI Prompt Helper' : 'AI ప్రాంప్ట్ సహాయకం'}
            </button>
            <button
              onClick={() => { onTextChange(isEn ? FORMAT_HINT : FORMAT_HINT_TE); }}
              className="text-[10px] font-bold px-2 py-1 rounded-lg transition-colors text-primary hover:bg-primary/10"
            >
              {isEn ? 'Load Example' : 'ఉదాహరణను లోడ్ చేయి'}
            </button>
          </div>
        </div>

        {/* Format hint box */}
        <div className="text-[11px] leading-relaxed px-3 py-2.5 rounded-xl border space-y-1.5 bg-primary/5 border-primary/20 text-text-secondary">
          <p>
            <span className="font-black">{isEn ? 'Structure: ' : 'నిర్మాణం: '}</span>
            {isEn
              ? <><code className="font-mono">1.</code> headings · <code className="font-mono">1.1</code> <code className="font-mono">1.2</code> sub-headings (each = one card) · body text on next line</>
              : <><code className="font-mono">1.</code> శీర్షికలు · <code className="font-mono">1.1</code> ఉపశీర్షికలు (ఒక్కో కార్డ్) · తదుపరి లైన్‌లో కంటెంట్</>
            }
          </p>
          <p>
            <span className="font-black">{isEn ? 'Rich content: ' : 'రిచ్ కంటెంట్: '}</span>
            {isEn
              ? <>Use <code className="font-mono">- bullet</code> lists · <code className="font-mono">| col | col |</code> tables · tags: <code className="font-mono">[IMP]</code> <code className="font-mono">[TIP]</code> <code className="font-mono">[ALERT]</code> <code className="font-mono">[KEY]</code> <code className="font-mono">[NOTE]</code> <code className="font-mono">[INFO]</code> before a heading title</>
              : <>బుల్లెట్లు: <code className="font-mono">- అంశం</code> · పట్టికలు: <code className="font-mono">| col | col |</code> · ట్యాగ్లు: <code className="font-mono">[IMP]</code> <code className="font-mono">[TIP]</code> <code className="font-mono">[ALERT]</code> <code className="font-mono">[KEY]</code> శీర్షిక ముందు</>
            }
          </p>
        </div>

        <textarea
          className={taClass}
          rows={14}
          placeholder={isEn ? FORMAT_HINT : FORMAT_HINT_TE}
          value={rawText}
          onChange={e => { onTextChange(e.target.value) }}
        />
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
              className="p-4 rounded-2xl text-sm text-center border bg-danger/10 text-danger border-danger/20"
            >
              {isEn ? (
                <>Nothing parsed. Check your format — use <code>1.</code> for headings and <code>1.1</code> for sub-headings.</>
              ) : (
                <>ఏమీ పార్స్ కాలేదు. మీ ఆకృతిని తనిఖీ చేయండి — శీర్షికల కోసం <code>1.</code> మరియు ఉపశీర్షికల కోసం <code>1.1</code> ఉపయోగించండి.</>
              )}
            </motion.div>
          ) : (
            <ParsedPreview sections={parsed} lang={lang} />
          )
        )}
      </AnimatePresence>
    </div>
  )
}

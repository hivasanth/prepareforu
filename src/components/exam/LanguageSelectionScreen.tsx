import { motion } from 'framer-motion';
import { Globe, BookOpen, AlertCircle, ChevronRight, Languages } from 'lucide-react';
import { IconBadge } from '../common/AntigravityUI';
import { FocusTrap } from 'focus-trap-react';
import type { SupportedLanguage } from '../../utils/languageUtils';
import { MODAL_TRANSITION, CARD_HOVER, FOCUS_RING } from '../common/AntigravityMotion';
import { GOLD_LIGHT_MATERIAL } from '../common/AntigravityCard';

interface LanguageSelectionScreenProps {
  paperName: string;
  teluguAvailable: boolean;
  onSelect: (lang: SupportedLanguage) => void;
}

/**
 * Pre-exam language selection gate.
 * Shows before the exam starts — selection is LOCKED for the session.
 *
 * ⚠️ Telugu button is disabled if no Telugu translations exist in the question set.
 */
export function LanguageSelectionScreen({
  paperName,
  teluguAvailable,
  onSelect,
}: LanguageSelectionScreenProps) {
  const titleId = 'lang-selection-title';

  return (
    <FocusTrap focusTrapOptions={{ initialFocus: false, escapeDeactivates: false }}>
      <div className="fixed inset-0 bg-app-bg flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={MODAL_TRANSITION}
          className="w-full max-w-md"
        >
        {/* Card */}
        <div className={`bg-card-bg rounded-[28px] border border-border-subtle shadow-2xl overflow-hidden ancient-overlay ${GOLD_LIGHT_MATERIAL}`}>

          {/* Header */}
          <div className="bg-primary/5 border-b border-border-subtle/50 p-6 flex items-center gap-4">
            <IconBadge icon={Globe} size="2xl" className="rounded-2xl flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-wide mb-1">Choose Language</p>
              <h2 id={titleId} className="text-[13px] font-black text-text-primary uppercase tracking-tight truncate">{paperName}</h2>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <p className="text-[12px] text-text-secondary font-medium leading-relaxed">
              Select the language for this exam session. This{' '}
              <span className="text-text-primary font-black">cannot be changed</span>{' '}
              once the exam begins.
            </p>

            {/* Language Options */}
            <div className="flex flex-col gap-3">

              {/* English Option */}
              <motion.button
                onClick={() => onSelect('en')}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border-subtle bg-app-bg hover:border-primary hover:bg-primary/5 ${CARD_HOVER} ${FOCUS_RING} text-left group`}
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🇬🇧</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-text-primary uppercase tracking-widest">English</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Default — All questions available</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary transition-interaction duration-fast ease-standard flex-shrink-0" />
              </motion.button>

              {/* Telugu Option */}
              <motion.button
                onClick={() => teluguAvailable && onSelect('te')}
                disabled={!teluguAvailable}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left group ${CARD_HOVER} ${FOCUS_RING} ${
                  teluguAvailable
                    ? 'border-warning/30 bg-warning/5 hover:border-warning hover:bg-warning/10 cursor-pointer'
                    : 'border-border-subtle/30 bg-hover-bg/30 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <Languages size={22} className="text-warning" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-bold text-text-primary uppercase tracking-widest">తెలుగు</p>
                    {teluguAvailable && (
                      <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning text-[8px] font-bold uppercase tracking-widest border border-warning/30">
                        Available
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {teluguAvailable
                      ? 'Some questions may fallback to English'
                      : 'Not available for this paper'}
                  </p>
                </div>
                {teluguAvailable && (
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-warning transition-interaction duration-fast ease-standard flex-shrink-0" />
                )}
              </motion.button>
            </div>

            {/* Telugu Partial Info */}
            {teluguAvailable && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-warning/5 border border-warning/20">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-warning font-medium leading-relaxed">
                  Telugu is available for some questions. Questions without a Telugu translation will automatically show in English.
                </p>
              </div>
            )}

            {/* Lock Notice */}
            <div className="flex items-center gap-2 justify-center pt-1">
              <BookOpen className="w-3 h-3 text-text-muted" />
              <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">
                Language is locked for the entire session
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
    </FocusTrap>
  );
}

import { motion } from 'framer-motion';
import { Globe, BookOpen, AlertCircle, ChevronRight } from 'lucide-react';
import { IconBadge } from '../common/AntigravityUI';
import type { SupportedLanguage } from '../../utils/languageUtils';

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
  return (
    <div className="fixed inset-0 bg-app-bg flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-card-bg rounded-[28px] border border-border-subtle shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-primary/5 border-b border-border-subtle/50 p-6 flex items-center gap-4">
            <IconBadge icon={Globe} size="2xl" className="rounded-2xl flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Choose Language</p>
              <h2 className="text-[13px] font-black text-text-primary uppercase tracking-tight truncate">{paperName}</h2>
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
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect('en')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border-subtle bg-app-bg hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🇬🇧</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-text-primary uppercase tracking-widest">English</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Default — All questions available</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors flex-shrink-0" />
              </motion.button>

              {/* Telugu Option */}
              <motion.button
                whileHover={teluguAvailable ? { scale: 1.01 } : {}}
                whileTap={teluguAvailable ? { scale: 0.98 } : {}}
                onClick={() => teluguAvailable && onSelect('te')}
                disabled={!teluguAvailable}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left group transition-all ${
                  teluguAvailable
                    ? 'border-amber-400/30 bg-amber-400/5 hover:border-amber-400 hover:bg-amber-400/10 cursor-pointer'
                    : 'border-border-subtle/30 bg-hover-bg/30 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🇮🇳</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-black text-text-primary uppercase tracking-widest">తెలుగు</p>
                    {teluguAvailable && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-400/30">
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
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-amber-500 transition-colors flex-shrink-0" />
                )}
              </motion.button>
            </div>

            {/* Telugu Partial Info */}
            {teluguAvailable && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-400/5 border border-amber-400/20">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-relaxed">
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
  );
}

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { DEFAULT_LANGUAGE, type SupportedLanguage } from '../utils/languageUtils';

// ─── Storage Key ──────────────────────────────────────────────────────────────
const LANG_STORAGE_KEY = 'pfu_exam_language';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LanguageContextValue {
  /** Currently selected language ('en' | 'te') */
  language: SupportedLanguage;
  /** Set language preference */
  setLanguage: (lang: SupportedLanguage) => void;
  /** Whether Telugu is currently selected */
  isTelugu: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  isTelugu: false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<SupportedLanguage>(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    return (stored === 'te' || stored === 'en') ? stored : DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLang(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  }, []);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      isTelugu: language === 'te',
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLanguage() {
  return useContext(LanguageContext);
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANGUAGE,
  readStoredLanguage,
  storeLanguage,
  type Language,
} from "@/lib/i18n/language";
import { stringsFor, type Strings } from "@/lib/i18n/strings";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Strings;
}

/**
 * Cached on globalThis so hot-module-replacement (or a duplicated module
 * instance across route-split chunks) can never create two distinct contexts,
 * which would make consumers throw "must be used inside <LanguageProvider>".
 */
const CONTEXT_KEY = "__assyguide_language_context__";
const globalStore = globalThis as typeof globalThis & {
  [CONTEXT_KEY]?: React.Context<LanguageContextValue | null>;
};
const LanguageContext: React.Context<LanguageContextValue | null> =
  globalStore[CONTEXT_KEY] ??
  (globalStore[CONTEXT_KEY] = createContext<LanguageContextValue | null>(null));

/**
 * SSR and the first client paint always render DEFAULT_LANGUAGE (fi), then the
 * stored choice is applied in an effect. Reading localStorage during render
 * would hydration-mismatch.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = readStoredLanguage();
    if (stored !== DEFAULT_LANGUAGE) setLanguageState(stored);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    storeLanguage(next);
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, t: stringsFor(language) }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

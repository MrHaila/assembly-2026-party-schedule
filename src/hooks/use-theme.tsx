import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type Context,
} from "react";
import {
  DEFAULT_THEME,
  readStoredTheme,
  storeTheme,
  type Theme,
} from "@/lib/theme/theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/**
 * Cached on globalThis for the same reason as the language context: HMR or a
 * duplicated module instance must never produce two distinct contexts.
 */
const CONTEXT_KEY = "__assyguide_theme_context__";
const globalStore = globalThis as typeof globalThis & {
  [CONTEXT_KEY]?: Context<ThemeContextValue | null>;
};
const ThemeContext: Context<ThemeContextValue | null> =
  globalStore[CONTEXT_KEY] ??
  (globalStore[CONTEXT_KEY] = createContext<ThemeContextValue | null>(null));

/**
 * SSR and the first client paint always render DEFAULT_THEME (modern), then
 * the stored choice is applied in an effect — reading localStorage during
 * render would hydration-mismatch. The only DOM effect is the `data-theme`
 * attribute; all visuals come from CSS token overrides keyed off it.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const stored = readStoredTheme();
    if (stored !== DEFAULT_THEME) setThemeState(stored);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    storeTheme(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

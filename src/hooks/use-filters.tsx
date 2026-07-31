import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Context,
  type ReactNode,
} from "react";
import {
  readStoredHidden,
  storeHidden,
  toggleHidden,
  type HiddenCategories,
} from "@/lib/schedule/filters";

interface FiltersContextValue {
  hidden: HiddenCategories;
  isHidden: (category: string) => boolean;
  toggle: (category: string) => void;
  clear: () => void;
}

/** Cached on globalThis for the same reason as the language context. */
const CONTEXT_KEY = "__assyguide_filters_context__";
const globalStore = globalThis as typeof globalThis & {
  [CONTEXT_KEY]?: Context<FiltersContextValue | null>;
};
const FiltersContext: Context<FiltersContextValue | null> =
  globalStore[CONTEXT_KEY] ??
  (globalStore[CONTEXT_KEY] = createContext<FiltersContextValue | null>(null));

/**
 * SSR and the first client paint hide nothing; the stored set is applied in
 * an effect — reading localStorage during render would hydration-mismatch.
 */
export function FiltersProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  useEffect(() => {
    const stored = readStoredHidden();
    if (stored.size > 0) setHidden(stored);
  }, []);

  const toggle = useCallback((category: string) => {
    setHidden((current) => {
      const next = toggleHidden(current, category);
      storeHidden(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    const next = new Set<string>();
    storeHidden(next);
    setHidden(next);
  }, []);

  const value = useMemo<FiltersContextValue>(
    () => ({
      hidden,
      isHidden: (category: string) => hidden.has(category),
      toggle,
      clear,
    }),
    [hidden, toggle, clear],
  );

  return (
    <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
  );
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) {
    throw new Error("useFilters must be used inside <FiltersProvider>");
  }
  return ctx;
}

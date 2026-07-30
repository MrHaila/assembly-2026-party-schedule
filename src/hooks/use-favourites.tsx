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
  readStoredFavourites,
  storeFavourites,
  toggleFavourite,
  type FavouriteIds,
} from "@/lib/schedule/favourites";

interface FavouritesContextValue {
  favourites: FavouriteIds;
  isFavourite: (id: number) => boolean;
  toggle: (id: number) => void;
}

/** Cached on globalThis for the same reason as the language context. */
const CONTEXT_KEY = "__assyguide_favourites_context__";
const globalStore = globalThis as typeof globalThis & {
  [CONTEXT_KEY]?: Context<FavouritesContextValue | null>;
};
const FavouritesContext: Context<FavouritesContextValue | null> =
  globalStore[CONTEXT_KEY] ??
  (globalStore[CONTEXT_KEY] = createContext<FavouritesContextValue | null>(
    null,
  ));

/**
 * SSR and the first client paint render zero favourites, then the stored set
 * is applied in an effect — reading localStorage during render would
 * hydration-mismatch.
 */
export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [favourites, setFavourites] = useState<ReadonlySet<number>>(
    () => new Set<number>(),
  );

  useEffect(() => {
    const stored = readStoredFavourites();
    if (stored.size > 0) setFavourites(stored);
  }, []);

  const toggle = useCallback((id: number) => {
    setFavourites((current) => {
      const next = toggleFavourite(current, id);
      storeFavourites(next);
      return next;
    });
  }, []);

  const value = useMemo<FavouritesContextValue>(
    () => ({
      favourites,
      isFavourite: (id: number) => favourites.has(id),
      toggle,
    }),
    [favourites, toggle],
  );

  return (
    <FavouritesContext.Provider value={value}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites(): FavouritesContextValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx) {
    throw new Error("useFavourites must be used inside <FavouritesProvider>");
  }
  return ctx;
}

/**
 * Theme layer — pure, framework-free.
 *
 * A theme is a whole-page skin selected by the user and persisted locally.
 * The engine is deliberately dumb: the only runtime effect is a `data-theme`
 * attribute on <html>, and every visual difference lives in CSS token
 * overrides. That keeps MODERN (the default) byte-identical when no theme is
 * stored, and it keeps components free of theme branches.
 */

export const THEMES = ["modern", "kuake"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "modern";
/** localStorage key. Namespaced so it can never collide with host tooling. */
export const THEME_STORAGE_KEY = "assyguide.theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/** Never throws: private mode / disabled storage falls back to the default. */
export function readStoredTheme(storage?: Pick<Storage, "getItem">): Theme {
  try {
    const store = storage ?? globalThis.localStorage;
    const raw = store?.getItem(THEME_STORAGE_KEY);
    return isTheme(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function storeTheme(theme: Theme, storage?: Pick<Storage, "setItem">): void {
  try {
    const store = storage ?? globalThis.localStorage;
    store?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable — the choice simply does not persist */
  }
}

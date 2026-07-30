/**
 * Language layer — pure, framework-free.
 *
 * Two content languages exist in the source data (WordPress FI original +
 * optional EN translation), so the app exposes exactly those two and nothing
 * else. FI is the default: the event is Finnish, and the majority of the
 * on-site audience reads Finnish.
 *
 * Everything here is a pure function so tests never need a DOM.
 */

export const LANGUAGES = ["fi", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "fi";
/** localStorage key. Namespaced so it can never collide with host tooling. */
export const LANGUAGE_STORAGE_KEY = "assyguide.language";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

/** Never throws: private mode / disabled storage falls back to the default. */
export function readStoredLanguage(storage?: Pick<Storage, "getItem">): Language {
  try {
    const store = storage ?? globalThis.localStorage;
    const raw = store?.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(raw) ? raw : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function storeLanguage(
  language: Language,
  storage?: Pick<Storage, "setItem">,
): void {
  try {
    const store = storage ?? globalThis.localStorage;
    store?.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    /* storage unavailable — the choice simply does not persist */
  }
}

/**
 * Pick a localized value with a hard fallback to the other language.
 * Blank strings count as missing: WordPress ships "" for empty excerpts.
 */
export function pickLocalized(
  language: Language,
  values: { fi?: string; en?: string },
): string | undefined {
  const primary = language === "en" ? values.en : values.fi;
  const fallback = language === "en" ? values.fi : values.en;
  return primary?.trim() ? primary : fallback?.trim() ? fallback : undefined;
}

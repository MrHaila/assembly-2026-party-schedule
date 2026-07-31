import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  isTheme,
  readStoredTheme,
  storeTheme,
  THEME_STORAGE_KEY,
} from "@/lib/theme/theme";

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    read: (k: string) => map.get(k) ?? null,
  };
}

describe("theme storage", () => {
  it("defaults to modern with nothing stored", () => {
    expect(readStoredTheme(memoryStorage())).toBe("modern");
    expect(DEFAULT_THEME).toBe("modern");
  });

  it("reads a stored theme back", () => {
    const store = memoryStorage({ [THEME_STORAGE_KEY]: "kuake" });
    expect(readStoredTheme(store)).toBe("kuake");
  });

  it("falls back on unknown values", () => {
    const store = memoryStorage({ [THEME_STORAGE_KEY]: "doom" });
    expect(readStoredTheme(store)).toBe(DEFAULT_THEME);
  });

  it("writes the choice", () => {
    const store = memoryStorage();
    storeTheme("kuake", store);
    expect(store.read(THEME_STORAGE_KEY)).toBe("kuake");
  });

  it("never throws when storage is unavailable", () => {
    const hostile = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readStoredTheme(hostile)).toBe(DEFAULT_THEME);
    expect(() => storeTheme("kuake", hostile)).not.toThrow();
  });

  it("guards the theme type", () => {
    expect(isTheme("kuake")).toBe(true);
    expect(isTheme("quake")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});

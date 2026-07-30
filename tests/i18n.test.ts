import { describe, expect, it } from "vitest";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isLanguage,
  pickLocalized,
  readStoredLanguage,
  storeLanguage,
} from "@/lib/i18n/language";
import { dayLabel, dayShortLabel, formatRelativeTime, stringsFor } from "@/lib/i18n/strings";
import type { Day } from "@/lib/schedule/types";

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    read: (k: string) => map.get(k) ?? null,
  };
}

const FRIDAY: Day = { id: "fri", date: "2026-07-31", label: "", shortLabel: "" };

describe("language persistence", () => {
  it("defaults to Finnish", () => {
    expect(DEFAULT_LANGUAGE).toBe("fi");
    expect(readStoredLanguage(fakeStorage())).toBe("fi");
  });

  it("reads a stored choice and ignores garbage", () => {
    expect(readStoredLanguage(fakeStorage({ [LANGUAGE_STORAGE_KEY]: "en" }))).toBe("en");
    expect(readStoredLanguage(fakeStorage({ [LANGUAGE_STORAGE_KEY]: "de" }))).toBe("fi");
  });

  it("writes under the namespaced key", () => {
    const store = fakeStorage();
    storeLanguage("en", store);
    expect(store.read(LANGUAGE_STORAGE_KEY)).toBe("en");
  });

  it("survives a throwing storage", () => {
    const hostile = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    expect(readStoredLanguage(hostile)).toBe("fi");
    expect(() => storeLanguage("en", hostile)).not.toThrow();
  });

  it("guards the union", () => {
    expect(isLanguage("fi")).toBe(true);
    expect(isLanguage("sv")).toBe(false);
  });
});

describe("pickLocalized", () => {
  it("prefers the active language and falls back to the other", () => {
    expect(pickLocalized("fi", { fi: "Suomeksi", en: "In English" })).toBe("Suomeksi");
    expect(pickLocalized("en", { fi: "Suomeksi", en: "In English" })).toBe("In English");
    expect(pickLocalized("en", { fi: "Suomeksi" })).toBe("Suomeksi");
    expect(pickLocalized("fi", { en: "In English" })).toBe("In English");
  });

  it("treats blank strings as missing", () => {
    expect(pickLocalized("en", { fi: "Suomeksi", en: "   " })).toBe("Suomeksi");
    expect(pickLocalized("en", { fi: "", en: "" })).toBeUndefined();
  });
});

describe("day labels", () => {
  it("localizes the heading and tab labels", () => {
    expect(dayLabel(FRIDAY, "en")).toBe("FRIDAY 31st");
    expect(dayLabel(FRIDAY, "fi")).toBe("PERJANTAI 31.7.");
    expect(dayShortLabel(FRIDAY, "en")).toBe("FRI 31");
    expect(dayShortLabel(FRIDAY, "fi")).toBe("PE 31");
  });
});

describe("dictionaries", () => {
  it("both languages define every key with non-empty copy", () => {
    const fi = stringsFor("fi");
    const en = stringsFor("en");
    expect(Object.keys(fi).sort()).toEqual(Object.keys(en).sort());
    for (const value of [...Object.values(fi), ...Object.values(en)]) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});

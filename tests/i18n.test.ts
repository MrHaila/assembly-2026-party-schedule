import { describe, expect, it } from "vitest";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isLanguage,
  pickLocalized,
  readStoredLanguage,
  storeLanguage,
} from "@/lib/i18n/language";
import { dayLabel, formatRelativeTime, isoDayLabel, stringsFor } from "@/lib/i18n/strings";
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
    expect(isoDayLabel("2026-07-31T12:00:00+03:00", "en")).toBe("FRIDAY 31st");
    expect(isoDayLabel("2026-07-31T12:00:00+03:00", "fi")).toBe("PERJANTAI 31.7.");
  });
});

describe("relative time", () => {
  it("shows seconds, minutes, hours and days in both languages", () => {
    const now = new Date("2026-07-30T12:00:00+03:00");
    expect(formatRelativeTime("en", "2026-07-30T11:59:50+03:00", now)).toBe("10 seconds ago");
    expect(formatRelativeTime("fi", "2026-07-30T11:59:50+03:00", now)).toBe("10 sekuntia sitten");
    expect(formatRelativeTime("en", "2026-07-30T11:58:00+03:00", now)).toBe("2 minutes ago");
    expect(formatRelativeTime("fi", "2026-07-30T11:58:00+03:00", now)).toBe("2 minuuttia sitten");
    expect(formatRelativeTime("en", "2026-07-30T10:00:00+03:00", now)).toBe("2 hours ago");
    expect(formatRelativeTime("fi", "2026-07-30T10:00:00+03:00", now)).toBe("2 tuntia sitten");
    expect(formatRelativeTime("en", "2026-07-28T12:00:00+03:00", now)).toBe("2 days ago");
    expect(formatRelativeTime("fi", "2026-07-28T12:00:00+03:00", now)).toBe("2 päivää sitten");
  });

  it("uses singular forms and treats very recent times as just now", () => {
    const now = new Date("2026-07-30T12:00:00+03:00");
    expect(formatRelativeTime("en", "2026-07-30T11:59:59+03:00", now)).toBe("just now");
    expect(formatRelativeTime("fi", "2026-07-30T11:59:59+03:00", now)).toBe("juuri nyt");
    expect(formatRelativeTime("en", "2026-07-30T11:59:00+03:00", now)).toBe("1 minute ago");
    expect(formatRelativeTime("fi", "2026-07-30T11:59:00+03:00", now)).toBe("1 minuutti sitten");
  });
});

describe("dictionaries", () => {
  it("both languages define every key with non-empty copy", () => {
    const fi = stringsFor("fi");
    const en = stringsFor("en");
    expect(Object.keys(fi).sort()).toEqual(Object.keys(en).sort());
    // categoryLabels is a nested slug → label map; flatten it in.
    const flat = (s: typeof fi) =>
      Object.values(s).flatMap((v) =>
        typeof v === "string" ? [v] : Object.values(v),
      );
    for (const value of [...flat(fi), ...flat(en)]) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
    expect(Object.keys(fi.categoryLabels).sort()).toEqual(
      Object.keys(en.categoryLabels).sort(),
    );

  });
});

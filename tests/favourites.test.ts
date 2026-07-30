import { describe, expect, it } from "vitest";
import {
  nextUpFavourites,
  parseFavourites,
  storeFavourites,
  toggleFavourite,
} from "../src/lib/schedule/favourites";
import { formatCountdown } from "../src/lib/i18n/strings";
import type { EventItem } from "../src/lib/schedule/types";

function ev(id: number, start: string, end: string): EventItem {
  return {
    id,
    title: `Event ${id}`,
    slug: `e${id}`,
    start,
    end,
    kind: "session",
    venueId: "main",
    venueIdSecondary: null,
    estimated: false,
    streamUrls: [],
  } as unknown as EventItem;
}

describe("favourites storage", () => {
  it("parses only numeric ids and survives junk", () => {
    expect([...parseFavourites('[1,2,"x"]')]).toEqual([1, 2]);
    expect(parseFavourites("not json").size).toBe(0);
    expect(parseFavourites(null).size).toBe(0);
  });

  it("toggles immutably", () => {
    const a = new Set([1]);
    const b = toggleFavourite(a, 2);
    expect([...a]).toEqual([1]);
    expect([...b]).toEqual([1, 2]);
    expect([...toggleFavourite(b, 1)]).toEqual([2]);
  });

  it("never throws when storage is unavailable", () => {
    expect(() =>
      storeFavourites(new Set([1]), {
        setItem: () => {
          throw new Error("quota");
        },
      }),
    ).not.toThrow();
  });
});

describe("nextUpFavourites", () => {
  const events = [
    ev(1, "2026-07-31T10:00:00+03:00", "2026-07-31T11:00:00+03:00"),
    ev(2, "2026-07-31T12:00:00+03:00", "2026-07-31T13:00:00+03:00"),
    ev(3, "2026-08-01T12:00:00+03:00", "2026-08-01T13:00:00+03:00"),
  ];

  it("returns favourites in start order, skipping finished ones", () => {
    const now = new Date("2026-07-31T11:30:00+03:00");
    const out = nextUpFavourites(events, new Set([1, 2, 3]), now);
    expect(out.map((e) => e.event.id)).toEqual([2, 3]);
    expect(out[0].minutesUntil).toBe(30);
    expect(out[0].live).toBe(false);
  });

  it("keeps a running favourite and marks it live", () => {
    const now = new Date("2026-07-31T10:30:00+03:00");
    const [first] = nextUpFavourites(events, new Set([1]), now);
    expect(first.live).toBe(true);
  });

  it("ignores non-favourites", () => {
    const now = new Date("2026-07-31T09:00:00+03:00");
    expect(nextUpFavourites(events, new Set(), now)).toEqual([]);
  });
});

describe("formatCountdown", () => {
  it("formats minutes, hours and days per language", () => {
    expect(formatCountdown("en", 24)).toBe("in 24 min");
    expect(formatCountdown("en", 83)).toBe("in 1 h 23 min");
    expect(formatCountdown("en", 2 * 1440 + 180)).toBe("in 2 d 3 h");
    expect(formatCountdown("fi", 24)).toBe("24 min kuluttua");
    expect(formatCountdown("fi", 1500)).toBe("1 pv 1 h kuluttua");
    expect(formatCountdown("en", 0)).toBe("in <1 min");
  });
});

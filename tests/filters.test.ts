import { describe, expect, it } from "vitest";
import {
  categoryCounts,
  filterEvents,
  isEventVisible,
  parseHidden,
  toggleHidden,
  visibleCategories,
} from "@/lib/schedule/filters";
import type { EventItem } from "@/lib/schedule/types";

function event(id: number, categories: string[]): EventItem {
  return {
    id,
    title: `Event ${id}`,
    fiOnly: false,
    venueId: "main",
    start: "2026-07-30T10:00:00+03:00",
    end: "2026-07-30T11:00:00+03:00",
    durationMin: 60,
    estimated: false,
    kind: "session",
    categories,
    streamUrls: [],
    modified: "2026-07-01T00:00:00",
  };
}

describe("filters", () => {
  it("shows everything when nothing is hidden", () => {
    const events = [event(1, ["expo"]), event(2, ["gaming"])];
    expect(filterEvents(events, new Set())).toHaveLength(2);
  });

  it("hides an event only when every one of its types is hidden", () => {
    const multi = event(1, ["expo", "gaming"]);
    expect(isEventVisible(multi, new Set(["expo"]))).toBe(true);
    expect(isEventVisible(multi, new Set(["expo", "gaming"]))).toBe(false);
  });

  it("drops hidden types from the colour bar input", () => {
    expect(visibleCategories(["expo", "gaming"], new Set(["expo"]))).toEqual([
      "gaming",
    ]);
  });

  it("toggles immutably", () => {
    const first = new Set(["expo"]);
    const second = toggleHidden(first, "gaming");
    expect([...first]).toEqual(["expo"]);
    expect([...second].sort()).toEqual(["expo", "gaming"]);
    expect([...toggleHidden(second, "expo")]).toEqual(["gaming"]);
  });

  it("counts categories, most common first", () => {
    const events = [
      event(1, ["expo", "gaming"]),
      event(2, ["expo"]),
      event(3, ["gaming"]),
      event(4, ["expo"]),
    ];
    expect(categoryCounts(events)).toEqual([
      { category: "expo", count: 3 },
      { category: "gaming", count: 2 },
    ]);
  });

  it("survives junk in storage", () => {
    expect(parseHidden("not json").size).toBe(0);
    expect(parseHidden('{"a":1}').size).toBe(0);
    expect([...parseHidden('["expo", 3]')]).toEqual(["expo"]);
  });
});

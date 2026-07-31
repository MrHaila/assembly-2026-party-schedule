import { describe, expect, it } from "vitest";
import {
  NEWS_CATEGORY,
  NEWS_ID_BASE,
  NEWS_VENUE_SLUG,
  isNewsId,
  mergeNewsIntoSchedule,
  newsResponseSchema,
  newsItemId,
  normalizeNews,
  plainTextFromNews,
} from "@/lib/schedule/news";
import type { ScheduleData } from "@/lib/schedule/types";

const raw = {
  ungrouped: [
    {
      name: "Fast music theme is &#8220;Are we there yet?&#8221;",
      time: "2026-07-31T14:05:00Z",
      tags: [{ id: 1, name: "Main Stage", color: "success" }],
    },
    { name: "Before the party", time: "2026-07-14T14:40:00Z" },
  ],
  grouped: [],
};

const baseSchedule: ScheduleData = {
  events: [],
  venues: [
    {
      slug: "main-stage",
      name: "Main Stage",
      short: "MAIN",
      order: 1,
      priority: 1,
      tier: "grid",
      eventCount: 0,
    },
  ],
  days: [
    { id: "fri", date: "2026-07-31", label: "FRIDAY 31st", shortLabel: "FRI 31" },
  ],
  fetchedAt: "2026-07-31T09:00:00+03:00",
  eventTitle: "Assembly Summer 2026",
  eventLocation: "Messukeskus",
};

describe("demoscene news", () => {
  it("parses the live payload shape", () => {
    expect(newsResponseSchema.parse(raw).ungrouped).toHaveLength(2);
  });

  it("normalizes an item into a tagged moment at the news location", () => {
    const [item] = normalizeNews(raw);
    expect(item.id).toBe(newsItemId(raw.ungrouped[0]));
    expect(isNewsId(item.id)).toBe(true);
    expect(item.venueId).toBe(NEWS_VENUE_SLUG);
    expect(item.categories).toEqual([NEWS_CATEGORY]);
    expect(item.kind).toBe("moment");
    expect(item.durationMin).toBe(0);
    expect(item.end).toBe(item.start);
    expect(item.title).toBe('Fast music theme is “Are we there yet?”');
    expect(item.start).toBe("2026-07-31T17:05:00+03:00");
    expect(item.body).toBe("Main Stage");
  });

  it("strips markdown and html but keeps paragraph breaks", () => {
    expect(plainTextFromNews("a\r\n\r\n_b_")).toBe("a\n\nb");
  });

  it("merges only items inside the event days and adds the location", () => {
    const merged = mergeNewsIntoSchedule(baseSchedule, normalizeNews(raw));
    expect(merged.events).toHaveLength(1);
    expect(merged.events[0].id).toBe(newsItemId(raw.ungrouped[0]));
    expect(merged.venues.map((v) => v.slug)).toContain(NEWS_VENUE_SLUG);
  });

  it("leaves the schedule untouched when nothing is in range", () => {
    const merged = mergeNewsIntoSchedule(baseSchedule, normalizeNews([raw.ungrouped[1]]));
    expect(merged).toBe(baseSchedule);
  });
});

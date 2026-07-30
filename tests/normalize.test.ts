/**
 * Fixture-driven tests for the normalizer. The fixture is a real API
 * response captured 2026-07-30 — tests never hit the network.
 * One test per measured data rule (see docs/design/data-model.md).
 */
import { describe, expect, it } from "vitest";
import rawFixture from "./fixtures/summer26.raw.json";
import { scheduleResponseSchema } from "@/lib/schedule/schema";
import {
  GENERAL_CATEGORY,
  assignSubColumns,
  normalizeSchedule,
  stripHtml,
} from "@/lib/schedule/normalize";
import {
  DAY_START_MIN,
  SLOT_COUNT,
  addMinutesIso,
  formatTime,
  helsinkiNow,
  slotIndexFor,
  spanSlotsFor,
} from "@/lib/schedule/time";
import type { EventItem } from "@/lib/schedule/types";

const parsed = scheduleResponseSchema.parse(rawFixture.data);
const schedule = normalizeSchedule(parsed, "2026-07-30T09:00:00+03:00");

describe("schema boundary", () => {
  it("parses the real payload: 210 events, 14 venues, 34 categories", () => {
    expect(parsed.calendarEvents.nodes).toHaveLength(210);
    expect(parsed.locations.nodes).toHaveLength(14);
    expect(parsed.categories.nodes).toHaveLength(34);
  });

  it("rejects a payload missing a field we depend on", () => {
    const broken = structuredClone(rawFixture.data) as {
      calendarEvents: { nodes: { startTime?: string }[] };
    };
    delete broken.calendarEvents.nodes[0].startTime;
    expect(() => scheduleResponseSchema.parse(broken)).toThrow();
  });
});

describe("rule 1 — negative durations are clamped (the landmine)", () => {
  it("both measured cases become estimated 60-minute sessions", () => {
    const broken = rawFixture.data.calendarEvents.nodes.filter(
      (e) => e.endTime && e.endTime < e.startTime,
    );
    expect(broken.map((e) => e.title).sort()).toEqual([
      "Demoscene: realtime",
      "K-pop Kahoot quiz",
    ]);
    for (const raw of broken) {
      const item = schedule.events.find((e) => e.id === raw.databaseId);
      expect(item).toBeDefined();
      expect(item!.estimated).toBe(true);
      expect(item!.durationMin).toBe(60);
      expect(item!.kind).toBe("session");
      expect(item!.end > item!.start).toBe(true);
    }
  });

  it("no normalized event ever has a negative or NaN duration", () => {
    for (const e of schedule.events) {
      expect(e.durationMin).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(e.durationMin)).toBe(false);
      expect(e.end >= e.start).toBe(true);
    }
  });
});

describe("rule 2 — null/empty endTime defaults to 60 min, estimated", () => {
  it("all 5 esports tournaments are estimated", () => {
    const noEnd = rawFixture.data.calendarEvents.nodes.filter(
      (e) => !e.endTime,
    );
    expect(noEnd).toHaveLength(5);
    for (const raw of noEnd) {
      const item = schedule.events.find((e) => e.id === raw.databaseId)!;
      expect(item.estimated).toBe(true);
      expect(item.durationMin).toBe(60);
      expect(item.end).toBe(addMinutesIso(item.start, 60));
    }
  });
});

describe("rule 3 — zero duration becomes a moment", () => {
  it("exactly 10 moments with durationMin 0", () => {
    const moments = schedule.events.filter((e) => e.kind === "moment");
    expect(moments).toHaveLength(10);
    for (const m of moments) {
      expect(m.durationMin).toBe(0);
      expect(m.start).toBe(m.end);
    }
  });
});

describe("rule 4 — ≥6h becomes ongoing and never enters the grid", () => {
  it("18 ongoing events, all ≥360 minutes", () => {
    const ongoing = schedule.events.filter((e) => e.kind === "ongoing");
    expect(ongoing).toHaveLength(18);
    for (const o of ongoing) expect(o.durationMin).toBeGreaterThanOrEqual(360);
  });

  it("the single 30h cross-date event is caught by the ongoing rule", () => {
    const disketti = schedule.events.find(
      (e) => e.title === "Disketin viskaus rekisteröityminen" && e.durationMin > 1000,
    );
    expect(disketti).toBeDefined();
    expect(disketti!.kind).toBe("ongoing");
  });
});

describe("rule 6 — two-venue event renders in both columns", () => {
  it("Demoscene: Listening + Dance Music has a secondary venue", () => {
    const item = schedule.events.find(
      (e) => e.title === "Demoscene: Listening + Dance Music",
    )!;
    expect(item.venueId).toBe("scene-stage");
    expect(item.venueIdSecondary).toBe("main-stage");
  });
});

describe("rule 7 — programless events get a synthetic category and stay visible", () => {
  it("all 17 programless events land in the general bucket", () => {
    const programless = rawFixture.data.calendarEvents.nodes.filter(
      (e) => !e.program,
    );
    expect(programless).toHaveLength(17);
    for (const raw of programless) {
      const item = schedule.events.find((e) => e.id === raw.databaseId)!;
      expect(item.categories).toEqual([GENERAL_CATEGORY]);
    }
  });

  it("the two ceremonies are never uncategorized-away", () => {
    for (const title of ["Opening ceremony", "Closing ceremony + awards"]) {
      const item = schedule.events.find((e) => e.title === title);
      expect(item, title).toBeDefined();
      expect(item!.categories.length).toBeGreaterThan(0);
    }
  });
});

describe("rule 8 — events are sorted by startTime, not API order", () => {
  it("normalized output is monotonic in start", () => {
    for (let i = 1; i < schedule.events.length; i++) {
      expect(schedule.events[i].start >= schedule.events[i - 1].start).toBe(
        true,
      );
    }
  });

  it("the raw API order is NOT already sorted (test is meaningful)", () => {
    const starts = rawFixture.data.calendarEvents.nodes.map((e) => e.startTime);
    const sorted = [...starts].sort();
    expect(starts).not.toEqual(sorted);
  });
});

describe("rule 10/11 — language fallback and category de-suffixing", () => {
  it("20 programs without EN translation are tagged fiOnly", () => {
    const fiOnly = schedule.events.filter((e) => e.fiOnly);
    expect(fiOnly).toHaveLength(20);
    for (const e of fiOnly) expect(e.titleEn).toBeUndefined();
  });

  it("no category slug keeps its -en suffix; uncategorized is gone", () => {
    for (const e of schedule.events) {
      for (const c of e.categories) {
        expect(c.endsWith("-en")).toBe(false);
        expect(c).not.toBe("uncategorized");
      }
    }
  });

  it("EN excerpts are preferred over FI when a translation exists", () => {
    const withTranslation = schedule.events.find(
      (e) => e.programId && !e.fiOnly && e.excerpt,
    );
    expect(withTranslation).toBeDefined();
  });
});

describe("html entities", () => {
  it("decodes numeric and named entities in excerpts", () => {
    expect(
      stripHtml("<p>Experience k-Culture in all it&#8217;s aspects!</p>"),
    ).toBe("Experience k-Culture in all it\u2019s aspects!");
    expect(stripHtml("A &amp; B &ndash; C &#x27;quoted&#x27;")).toBe(
      "A & B \u2013 C 'quoted'",
    );
  });

  it("no raw entity survives in any normalized title or excerpt", () => {
    const offenders = schedule.events.filter(
      (e) => /&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/.test(e.title + (e.excerpt ?? "")),
    );
    expect(offenders.map((e) => e.title)).toEqual([]);
  });
});

describe("venues", () => {
  it("14 locations, ordered by event count (busiest first)", () => {
    expect(schedule.venues).toHaveLength(14);
    const counts = schedule.venues.map((v) => v.eventCount);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
    expect(schedule.venues.map((v) => v.order)).toEqual(
      schedule.venues.map((_, i) => i + 1),
    );
  });

  it("event counts sum to 210 (primary venue only)", () => {
    const total = schedule.venues.reduce((sum, v) => sum + v.eventCount, 0);
    expect(total).toBe(210);
  });
});

describe("days", () => {
  it("Thu 30 → Sun 2 derived from eventSettings", () => {
    expect(schedule.days.map((d) => d.id)).toEqual([
      "thu",
      "fri",
      "sat",
      "sun",
    ]);
    expect(schedule.days[0]).toMatchObject({ date: "2026-07-30", label: "THURSDAY 30th", shortLabel: "THU 30" });
    expect(schedule.days[3]).toMatchObject({ date: "2026-08-02", label: "SUNDAY 2nd", shortLabel: "SUN 2" });
  });
});

describe("grid slot math", () => {
  it("spanSlotsFor can never return < 1, even for negative input", () => {
    expect(spanSlotsFor("2026-07-30T14:00:00+03:00", "2026-07-30T13:00:00+03:00")).toBe(1);
    expect(spanSlotsFor("2026-07-30T14:00:00+03:00", "2026-07-30T14:00:00+03:00")).toBe(1);
    expect(spanSlotsFor("2026-07-30T14:00:00+03:00", "2026-07-30T15:00:00+03:00")).toBe(12);
  });

  it("slotIndexFor clamps out-of-window times into the grid", () => {
    expect(slotIndexFor("2026-07-30T08:00:00+03:00")).toBe(0);
    expect(slotIndexFor("2026-07-30T23:30:00+03:00")).toBe(SLOT_COUNT - 1);
    expect(slotIndexFor("2026-07-30T14:00:00+03:00")).toBe(
      (14 * 60 - DAY_START_MIN) / 5,
    );
  });

  it("formatTime reads the Helsinki local part", () => {
    expect(formatTime("2026-07-30T14:05:00+03:00")).toBe("14:05");
  });

  it("helsinkiNow returns a plausible wall clock", () => {
    const now = helsinkiNow(new Date("2026-07-30T11:30:00Z"));
    expect(now.date).toBe("2026-07-30");
    expect(now.minutes).toBe(14 * 60 + 30);
  });
});

describe("assignSubColumns", () => {
  const mk = (
    id: number,
    startMin: number,
    endMin: number,
  ): EventItem => ({
    id,
    title: `e${id}`,
    fiOnly: false,
    venueId: "main-stage",
    start: `2026-07-30T${String(Math.floor(startMin / 60)).padStart(2, "0")}:${String(startMin % 60).padStart(2, "0")}:00+03:00`,
    end: `2026-07-30T${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}:00+03:00`,
    durationMin: endMin - startMin,
    estimated: false,
    kind: "session",
    categories: [GENERAL_CATEGORY],
    streamUrls: [],
    modified: "2026-07-29T00:00:00",
  });

  it("non-overlapping events get a single lane", () => {
    const p = assignSubColumns([mk(1, 600, 660), mk(2, 660, 720)]);
    expect(p).toEqual([
      { id: 1, lane: 0, lanes: 1 },
      { id: 2, lane: 0, lanes: 1 },
    ]);
  });

  it("two overlapping events split into two lanes", () => {
    const p = assignSubColumns([mk(1, 600, 700), mk(2, 630, 720)]);
    expect(p.find((x) => x.id === 1)).toEqual({ id: 1, lane: 0, lanes: 2 });
    expect(p.find((x) => x.id === 2)).toEqual({ id: 2, lane: 1, lanes: 2 });
  });

  it("handles the measured maximum concurrency of 5", () => {
    const events = [
      mk(1, 600, 700),
      mk(2, 610, 650),
      mk(3, 620, 720),
      mk(4, 630, 660),
      mk(5, 640, 710),
    ];
    const p = assignSubColumns(events);
    expect(Math.max(...p.map((x) => x.lanes))).toBe(5);
    // No two events sharing a lane may overlap.
    for (const a of events) {
      for (const b of events) {
        if (a.id >= b.id) continue;
        const pa = p.find((x) => x.id === a.id)!;
        const pb = p.find((x) => x.id === b.id)!;
        if (pa.lane === pb.lane) {
          const overlap = a.start < b.end && b.start < a.end;
          expect(overlap).toBe(false);
        }
      }
    }
  });
});

describe("stripHtml", () => {
  it("removes tags, decodes entities, collapses whitespace", () => {
    expect(stripHtml("<p>Tule &amp; katso!</p>\n")).toBe("Tule & katso!");
    expect(stripHtml('<a href="x">Link</a>  text&nbsp;here')).toBe(
      "Link text here",
    );
    expect(stripHtml("")).toBe("");
  });
});

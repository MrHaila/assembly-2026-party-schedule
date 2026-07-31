/**
 * The demoscene news stream (scene.assembly.org) folded into the timeline as
 * its own location.
 *
 * The compo organisers publish party announcements — deadlines, compo themes,
 * "votekeys are live" — on a separate REST feed. They are moments in time, not
 * sessions, so each item normalizes to a zero-duration `moment` pinned to a
 * synthetic location (`demoscene-news`) and tagged with the `demoscene`
 * category so the existing colour + filter machinery treats it like any other
 * event.
 *
 * Two things this feed does NOT have: stable numeric ids in the calendar's
 * space (so ids are offset by NEWS_ID_BASE to guarantee no collision with
 * CalendarEvent.databaseId) and a per-language body (the text is authored once,
 * usually EN, so it rides along on the list item instead of the on-demand
 * detail fetch).
 */
import { z } from "zod";
import type { EventItem, ScheduleData, Venue } from "./types";
import { decodeEntities, rankVenues } from "./normalize";
import { venueConfigFor } from "./venues.config";
import { addMinutesIso } from "./time";

/** Synthetic location slug — never appears in the WordPress locations list. */
export const NEWS_VENUE_SLUG = "demoscene-news";
/** Display name for the synthetic location. */
export const NEWS_VENUE_NAME = "Demoscene News";
/** Every news item carries this category, so filters can hide the stream. */
export const NEWS_CATEGORY = "demoscene";
/** Offset keeping news ids out of the calendar's id space. */
export const NEWS_ID_BASE = 900_000_000;

export const newsTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().optional(),
});

export const newsItemSchema = z.object({
  name: z.string(),
  time: z.string(),
  tags: z.array(newsTagSchema).optional(),
});

/**
 * The timetable payload. `grouped` collapses simultaneous entries into one
 * bucket for the upstream site's own rendering; we want each entry on its own
 * row, so only `ungrouped` is read.
 */
export const newsResponseSchema = z.object({
  ungrouped: z.array(newsItemSchema),
  grouped: z.unknown().optional(),
});

export type RawNewsItem = z.infer<typeof newsItemSchema>;
export type RawNewsResponse = z.infer<typeof newsResponseSchema>;

/**
 * The feed has no ids, so one is minted from the item's identity (name +
 * time). Stable across fetches, and offset out of the calendar's id space.
 */
export function newsItemId(item: RawNewsItem): number {
  const key = `${item.time}|${item.name}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100_000_000;
  }
  return NEWS_ID_BASE + hash;
}

/**
 * Strip the light markdown/HTML the feed ships (`###`, `**`, `_`, `<u>`) while
 * keeping paragraph breaks.
 */
export function plainTextFromNews(text: string): string {
  return decodeEntities(text.replace(/<[^>]*>/g, ""))
    .replace(/\r\n?/g, "\n")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*|__|[*_`]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** One timetable entry → a zero-duration event at the demoscene location. */
export function normalizeNewsItem(item: RawNewsItem): EventItem {
  // Timetable times are UTC (`...Z`); the rest of the app assumes Helsinki
  // local ISO strings, so shift once here.
  const start = addMinutesIso(item.time, 0);
  const tags = (item.tags ?? []).map((tag) => plainTextFromNews(tag.name));
  return {
    id: newsItemId(item),
    title: plainTextFromNews(item.name),
    fiOnly: false,
    venueId: NEWS_VENUE_SLUG,
    start,
    end: start,
    durationMin: 0,
    estimated: false,
    kind: "moment",
    categories: [NEWS_CATEGORY],
    streamUrls: [],
    body: tags.length ? tags.join(" · ") : undefined,
    sourceUrl: "https://scene.assembly.org/",
  };
}

export function normalizeNews(
  payload: RawNewsResponse | readonly RawNewsItem[],
): EventItem[] {
  const items = Array.isArray(payload) ? payload : payload.ungrouped;
  return items.map(normalizeNewsItem);
}

/** True for ids minted by this module. */
export function isNewsId(id: number): boolean {
  return id >= NEWS_ID_BASE;
}

/**
 * Fold news events into an already-normalized schedule: add the synthetic
 * location, merge + re-sort the events, and re-rank the columns so the stream
 * takes its place by activity like every other location. Items outside the
 * event's day range are dropped — the feed carries pre-party announcements
 * that have no row to live on.
 */
export function mergeNewsIntoSchedule(
  schedule: ScheduleData,
  news: readonly EventItem[],
): ScheduleData {
  const dates = new Set(schedule.days.map((d) => d.date));
  const inRange = news.filter((e) => dates.has(e.start.slice(0, 10)));
  if (inRange.length === 0) return schedule;

  const config = venueConfigFor(NEWS_VENUE_SLUG);
  const venue: Venue = {
    slug: NEWS_VENUE_SLUG,
    name: NEWS_VENUE_NAME,
    short: config?.short ?? "SCENE",
    order: config?.order ?? 100,
    priority: config?.priority,
    tier: config?.tier ?? "other",
    eventCount: 0,
  };

  const events = [...schedule.events, ...inRange].sort((a, b) =>
    a.start !== b.start ? (a.start < b.start ? -1 : 1) : a.id - b.id,
  );

  return {
    ...schedule,
    events,
    venues: rankVenues([...schedule.venues, venue], events),
  };
}

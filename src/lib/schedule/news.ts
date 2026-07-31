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

/** Synthetic location slug — never appears in the WordPress locations list. */
export const NEWS_VENUE_SLUG = "demoscene-news";
/** Display name for the synthetic location. */
export const NEWS_VENUE_NAME = "Demoscene News";
/** Every news item carries this category, so filters can hide the stream. */
export const NEWS_CATEGORY = "demoscene";
/** Offset keeping news ids out of the calendar's id space. */
export const NEWS_ID_BASE = 900_000_000;

export const newsItemSchema = z.object({
  id: z.number(),
  headline: z.string(),
  text: z.string(),
  publish_datetime: z.string(),
});

export const newsResponseSchema = z.array(newsItemSchema);

export type RawNewsItem = z.infer<typeof newsItemSchema>;

/**
 * Strip the light markdown/HTML the feed ships (`###`, `**`, `_`, `<u>`) while
 * keeping paragraph breaks — unlike program excerpts, these bodies are
 * multi-paragraph and read badly as one run-on line.
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

/** One news item → a zero-duration event at the demoscene news location. */
export function normalizeNewsItem(item: RawNewsItem): EventItem {
  const start = item.publish_datetime;
  return {
    id: NEWS_ID_BASE + item.id,
    title: decodeEntities(item.headline),
    fiOnly: false,
    venueId: NEWS_VENUE_SLUG,
    start,
    end: start,
    durationMin: 0,
    estimated: false,
    kind: "moment",
    categories: [NEWS_CATEGORY],
    streamUrls: [],
    body: plainTextFromNews(item.text) || undefined,
    sourceUrl: "https://scene.assembly.org/",
  };
}

export function normalizeNews(items: readonly RawNewsItem[]): EventItem[] {
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

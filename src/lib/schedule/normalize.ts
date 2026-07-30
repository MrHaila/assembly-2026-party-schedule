/**
 * Raw WPGraphQL payload → normalized ScheduleData.
 *
 * Every rule here is driven by a measured quirk in the live summer26 data
 * (docs/design/data-model.md lists them with counts). When the data and this
 * file disagree, the data wins and this file changes — the fixture tests in
 * tests/normalize.test.ts are the tripwire.
 */
import type { RawEvent, RawScheduleData } from "./schema";
import type { Day, EventItem, EventKind, ScheduleData, Venue } from "./types";
import { VENUE_CONFIG, venueConfigFor } from "./venues.config";
import { addMinutesIso, isoDate, minutesBetween } from "./time";

/** Durations at or above this never enter the grid — they are the ongoing band. */
export const ONGOING_THRESHOLD_MIN = 6 * 60;
/** Default length for events with a missing/clamped end time. */
export const DEFAULT_DURATION_MIN = 60;
/** Synthetic category for programless events so filters can never hide them. */
export const GENERAL_CATEGORY = "general";

const SOURCE_BASE = "https://assembly.org";

const WEEKDAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function stripEnSuffix(slug: string): string {
  return slug.endsWith("-en") ? slug.slice(0, -3) : slug;
}

function normalizeCategories(event: RawEvent): string[] {
  const nodes = event.program?.categories?.nodes ?? [];
  const slugs = new Set<string>();
  for (const c of nodes) {
    const slug = stripEnSuffix(c.slug);
    if (slug === "uncategorized") continue;
    slugs.add(slug);
  }
  // Programless (17 events — incl. Opening/Closing ceremony) and
  // Uncategorized events share one visible bucket. They must never be
  // filterable away.
  return slugs.size > 0 ? [...slugs].sort() : [GENERAL_CATEGORY];
}

interface NormalizedTimes {
  end: string;
  durationMin: number;
  estimated: boolean;
  kind: EventKind;
}

function normalizeTimes(event: RawEvent): NormalizedTimes {
  const start = event.startTime;
  const rawEnd = event.endTime;

  // Zero duration → a moment (Doors Open, area opens/closes), rendered as a
  // labelled rule. Checked BEFORE the clamp because end == start is real data.
  if (rawEnd === start) {
    return { end: start, durationMin: 0, estimated: false, kind: "moment" };
  }

  // Missing (null or "") or BEFORE the start (2 measured cases) → no-end.
  // The negative-duration landmine: a naive end-start yields a negative CSS
  // grid span and silently corrupts the whole column. Clamp here AND guard
  // again at the render site (time.ts spanSlotsFor).
  if (!rawEnd || rawEnd < start) {
    const end = addMinutesIso(start, DEFAULT_DURATION_MIN);
    return {
      end,
      durationMin: DEFAULT_DURATION_MIN,
      estimated: true,
      kind: "session",
    };
  }

  const durationMin = minutesBetween(start, rawEnd);
  // ≥6h items (Free Play, K-Content, …) would turn three columns into solid
  // blocks. They live in the ongoing band instead. This also catches the one
  // 30h cross-date event, so no midnight-clipping machinery exists at all.
  const kind: EventKind =
    durationMin >= ONGOING_THRESHOLD_MIN ? "ongoing" : "session";
  return { end: rawEnd, durationMin, estimated: false, kind };
}

function normalizeEvent(event: RawEvent): EventItem {
  const times = normalizeTimes(event);
  const locations = event.locations.nodes;
  const program = event.program ?? undefined;
  const translation = program?.translation ?? undefined;
  const titleEn =
    translation?.title && translation.title !== event.title
      ? translation.title
      : undefined;

  return {
    id: event.databaseId,
    title: event.title,
    titleEn,
    fiOnly: !!program && !translation,
    venueId: locations[0]?.slug ?? "infodesk",
    venueIdSecondary: locations[1]?.slug,
    start: event.startTime,
    end: times.end,
    durationMin: times.durationMin,
    estimated: times.estimated,
    kind: times.kind,
    categories: normalizeCategories(event),
    streamUrls: event.streamUrls ?? [],
    programId: event.programId ?? undefined,
    excerpt: stripHtml(translation?.excerpt || program?.excerpt || "") || undefined,
    sourceUrl: program ? `${SOURCE_BASE}${program.uri}` : undefined,
    modified: event.modified,
  };
}

function normalizeDays(data: RawScheduleData): Day[] {
  const days: Day[] = [];
  const start = isoDate(data.eventSettings.eventStartDate);
  const end = isoDate(data.eventSettings.eventEndDate);
  const cursor = new Date(`${start}T12:00:00+03:00`);
  while (true) {
    const date = cursor.toISOString().slice(0, 10);
    if (date > end) break;
    const weekday = WEEKDAY_IDS[cursor.getUTCDay()];
    days.push({
      id: weekday,
      date,
      label: `${weekday.toUpperCase()} ${Number(date.slice(8, 10))}`,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function normalizeVenues(data: RawScheduleData, events: EventItem[]): Venue[] {
  const counts = new Map<string, number>();
  for (const e of events) {
    counts.set(e.venueId, (counts.get(e.venueId) ?? 0) + 1);
  }
  const venues: Venue[] = data.locations.nodes.map((loc) => {
    const config = venueConfigFor(loc.slug);
    return {
      slug: loc.slug,
      name: loc.name,
      short: config?.short ?? loc.name.toUpperCase().slice(0, 9),
      order: config?.order ?? 100,
      tier: config?.tier ?? "other",
      eventCount: counts.get(loc.slug) ?? 0,
    };
  });
  venues.sort((a, b) => a.order - b.order);
  return venues;
}

export function normalizeSchedule(
  data: RawScheduleData,
  fetchedAt: string,
): ScheduleData {
  const events = data.calendarEvents.nodes.map(normalizeEvent);
  // The API's own ordering is by WP post date and is NOT monotonic in
  // startTime — always sort here, once, so no view ever re-sorts.
  events.sort((a, b) => {
    if (a.start !== b.start) return a.start < b.start ? -1 : 1;
    const venueA = venueConfigFor(a.venueId)?.order ?? 100;
    const venueB = venueConfigFor(b.venueId)?.order ?? 100;
    return venueA - venueB || a.id - b.id;
  });
  return {
    events,
    venues: normalizeVenues(data, events),
    days: normalizeDays(data),
    fetchedAt,
    eventTitle: data.eventSettings.eventTitleShort || data.generalSettings.title,
    eventLocation: data.eventSettings.eventLocation ?? "",
  };
}

export { VENUE_CONFIG };

/** Strip HTML tags and decode the common entities (program excerpts ship HTML). */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export interface SubColumnPlacement {
  id: number;
  lane: number;
  lanes: number;
}

/**
 * Assign overlapping events to sub-column lanes within one venue column.
 * Newspaper pages never subdivided channel columns — but with concurrency
 * ≤ 2 (guaranteed in the grid tier for summer26) a two-lane split stays
 * readable. Pure function; unit-tested up to the measured maximum of 5.
 */
export function assignSubColumns(
  events: readonly EventItem[],
): SubColumnPlacement[] {
  const sorted = [...events].sort((a, b) =>
    a.start < b.start ? -1 : a.start > b.start ? 1 : a.id - b.id,
  );
  const placements: SubColumnPlacement[] = [];
  let cluster: EventItem[] = [];
  let clusterEnd = "";

  const flush = () => {
    if (cluster.length === 0) return;
    const laneEnds: string[] = [];
    const assigned = cluster.map((e) => {
      let lane = laneEnds.findIndex((end) => end <= e.start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(e.end);
      } else {
        laneEnds[lane] = e.end;
      }
      return { id: e.id, lane };
    });
    const lanes = laneEnds.length;
    for (const a of assigned) placements.push({ ...a, lanes });
    cluster = [];
    clusterEnd = "";
  };

  for (const e of sorted) {
    if (cluster.length > 0 && e.start >= clusterEnd) flush();
    cluster.push(e);
    if (e.end > clusterEnd) clusterEnd = e.end;
  }
  flush();
  return placements;
}

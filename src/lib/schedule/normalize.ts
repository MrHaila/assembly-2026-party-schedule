/**
 * Raw WPGraphQL payload → normalized ScheduleData.
 *
 * Every rule here is driven by a measured quirk in the live summer26 data
 * (docs/design/data-model.md lists them with counts). When the data and this
 * file disagree, the data wins and this file changes — the fixture tests in
 * tests/normalize.test.ts are the tripwire.
 */
import type { RawDetailEvent, RawEvent, RawScheduleData } from "./schema";
import type {
  Day,
  EventDetail,
  EventItem,
  EventKind,
  ScheduleData,
  Venue,
} from "./types";
import { VENUE_CONFIG, venueConfigFor } from "./venues.config";
import { addMinutesIso, isoDate, minutesBetween } from "./time";
import { programUrl } from "./event.config";
import { pickLocalized, type Language } from "@/lib/i18n/language";

/** Durations at or above this never enter the grid — they are the ongoing band. */
export const ONGOING_THRESHOLD_MIN = 6 * 60;
/** Default length for events with a missing/clamped end time. */
export const DEFAULT_DURATION_MIN = 60;
/** Synthetic category for programless events so filters can never hide them. */
export const GENERAL_CATEGORY = "general";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** 1 → "1st", 2 → "2nd", 11 → "11th". */
function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

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

  // The occurrence title is the specific one ("ARTtech Seminars: Pixel Art")
  // while program.title is the generic umbrella ("ARTtech Seminaarit ja
  // Workshop"), so the title is NOT localized — only the body copy is, and
  // the body copy is fetched on demand (see normalizeEventDetail).
  return {
    id: event.databaseId,
    title: decodeEntities(event.title),
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
    sourceUrl: program ? programUrl(program.uri) : undefined,
  };
}

/**
 * On-demand event body → the localized, HTML-stripped excerpt. FI reads
 * `program.excerpt`; EN prefers `program.translation.excerpt` and falls back
 * to the FI excerpt for `fiOnly` programs (via `pickLocalized`). A programless
 * or empty body yields `excerpt: undefined`.
 */
export function normalizeEventDetail(
  node: RawDetailEvent,
  language: Language,
): EventDetail {
  const program = node.program ?? undefined;
  const fi = stripHtml(program?.excerpt || "") || undefined;
  const en = stripHtml(program?.translation?.excerpt || "") || undefined;
  return { id: node.databaseId, excerpt: pickLocalized(language, { fi, en }) };
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
    const dayOfMonth = Number(date.slice(8, 10));
    days.push({
      id: weekday,
      date,
      label: `${WEEKDAY_NAMES[cursor.getUTCDay()].toUpperCase()} ${ordinal(dayOfMonth)}`,
      shortLabel: `${weekday.toUpperCase()} ${dayOfMonth}`,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/**
 * Locations, ordered by editorial priority first, then by how many events
 * they host across the whole weekend. Priority exists because the headline
 * stages (Main, Genelec) must never slide right just because a booth logged
 * more entries. Everything below priority is ranked by event COUNT, not total
 * duration, so an all-day booth cannot outrank a stage running ten sessions.
 */
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
      priority: config?.priority,
      tier: config?.tier ?? "other",
      eventCount: counts.get(loc.slug) ?? 0,
    };
  });
  venues.sort(
    (a, b) =>
      (a.priority ?? Number.MAX_SAFE_INTEGER) -
        (b.priority ?? Number.MAX_SAFE_INTEGER) ||
      b.eventCount - a.eventCount ||
      a.order - b.order,
  );
  venues.forEach((v, i) => {
    v.order = i + 1;
  });
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

/**
 * Strip HTML tags and decode entities. Program excerpts ship HTML *and*
 * numeric entities (WordPress smart quotes: `it&#8217;s`), so a named-entity
 * table alone is not enough — decode the numeric forms too.
 */
const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  rsquo: "\u2019",
  lsquo: "\u2018",
  rdquo: "\u201d",
  ldquo: "\u201c",
  hellip: "\u2026",
  ndash: "\u2013",
  mdash: "\u2014",
  eacute: "\u00e9",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0
        ? String.fromCodePoint(code)
        : match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

export function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
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

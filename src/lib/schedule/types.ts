/**
 * Normalized domain model for ASSYGUIDE.
 *
 * These are the ONLY types view components may consume. Raw GraphQL shapes
 * live in schema.ts and never cross this boundary.
 * See docs/design/data-model.md for the rationale behind every field.
 */

export type EventKind = "session" | "ongoing" | "moment" | "deadline" | "jury";

export type VenueTier = "grid" | "other";

export interface EventItem {
  /** CalendarEvent.databaseId — the stable identity (future favourites key). */
  id: number;
  /** Event occurrence title as shipped by the API (mixed FI/EN in practice). */
  title: string;
  /** EN program translation title, when present and different from `title`. */
  titleEn?: string;
  /** Program exists but has no EN translation — render an `FI` chip. */
  fiOnly: boolean;
  /** Location slug — stable key, never the display name. */
  venueId: string;
  /** Exactly one summer26 event has two venues; render in both columns. */
  venueIdSecondary?: string;
  /** ISO 8601 with +03:00 offset (Europe/Helsinki). */
  start: string;
  /**
   * ISO 8601 +03:00. Always set after normalization: negative or missing
   * ends are clamped/defaulted (see `estimated`).
   */
  end: string;
  durationMin: number;
  /** Duration was defaulted or clamped — render times with `≈`. */
  estimated: boolean;
  kind: EventKind;
  /** De-suffixed category slugs. Never empty: programless events get "general". */
  categories: string[];
  streamUrls: string[];
  /** WPGraphQL global ID (opaque base64 string — NOT numeric). */
  programId?: string;
  /** Program excerpt, EN preferred, HTML stripped. */
  excerpt?: string;
  /** Absolute link back to the official program page. */
  sourceUrl?: string;
  /** Helsinki-local timestamp without offset, as the API ships it. */
  modified: string;
}

export interface Venue {
  slug: string;
  name: string;
  /** Hand-authored short column header, e.g. "GENELEC". */
  short: string;
  /** Hand-authored column order (API `priority` is null on all venues). */
  order: number;
  tier: VenueTier;
  /** Events whose primary venue this is. */
  eventCount: number;
}

export interface Day {
  /** Lowercase weekday abbrev: "thu" | "fri" | "sat" | "sun". */
  id: string;
  /** YYYY-MM-DD (Helsinki). */
  date: string;
  /** Display label: "THU 30". */
  label: string;
}

export interface ScheduleData {
  events: EventItem[];
  venues: Venue[];
  days: Day[];
  /** When the payload was fetched (footer "data as of" stamp). */
  fetchedAt: string;
  eventTitle: string;
  eventLocation: string;
}

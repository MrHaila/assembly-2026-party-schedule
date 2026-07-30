/**
 * Favourites — pure, framework-free.
 *
 * Identity is `EventItem.id` (the CalendarEvent databaseId), which is the
 * stable key the data model reserved for exactly this. Storage never throws:
 * private mode simply means the choice does not persist.
 */
import type { EventItem } from "./types";

/** localStorage key. Namespaced like the language key. */
export const FAVOURITES_STORAGE_KEY = "assyguide.favourites";

export type FavouriteIds = ReadonlySet<number>;

export function parseFavourites(raw: string | null | undefined): Set<number> {
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is number => typeof v === "number"));
  } catch {
    return new Set();
  }
}

export function readStoredFavourites(
  storage?: Pick<Storage, "getItem">,
): Set<number> {
  try {
    const store = storage ?? globalThis.localStorage;
    return parseFavourites(store?.getItem(FAVOURITES_STORAGE_KEY));
  } catch {
    return new Set();
  }
}

export function storeFavourites(
  ids: FavouriteIds,
  storage?: Pick<Storage, "setItem">,
): void {
  try {
    const store = storage ?? globalThis.localStorage;
    store?.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage unavailable — the choice simply does not persist */
  }
}

/** Immutable toggle: never mutates the input set. */
export function toggleFavourite(ids: FavouriteIds, id: number): Set<number> {
  const next = new Set(ids);
  if (!next.delete(id)) next.add(id);
  return next;
}

export interface NextUpEntry {
  event: EventItem;
  /** Whole minutes until start. Negative once the event has begun. */
  minutesUntil: number;
  /** start <= now < end. */
  live: boolean;
}

/**
 * The next `count` favourites worth showing: anything still running or yet
 * to start, in start order. Cross-day is implicit — comparison is on the
 * absolute timestamp, not day minutes.
 */
export function nextUpFavourites(
  events: readonly EventItem[],
  favourites: FavouriteIds,
  now: Date,
  count = 2,
): NextUpEntry[] {
  const ms = now.getTime();
  return events
    .filter((e) => favourites.has(e.id) && new Date(e.end).getTime() > ms)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, count)
    .map((event) => {
      const startMs = new Date(event.start).getTime();
      return {
        event,
        minutesUntil: Math.floor((startMs - ms) / 60_000),
        live: startMs <= ms,
      };
    });
}

/**
 * Category filters — pure, framework-free.
 *
 * The model is deliberately subtractive: the visitor hides types, never
 * "selects" them, so an empty stored set means "show everything" and new
 * categories appearing in the feed are visible by default.
 *
 * An event only disappears when EVERY one of its categories is hidden — a
 * multi-category event stays as long as one of its types is still shown
 * (design-log #26).
 */
import type { EventItem } from "./types";

/** localStorage key. Namespaced like favourites and language. */
export const FILTERS_STORAGE_KEY = "assyguide.hiddenCategories";

export type HiddenCategories = ReadonlySet<string>;

export function parseHidden(raw: string | null | undefined): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

export function readStoredHidden(
  storage?: Pick<Storage, "getItem">,
): Set<string> {
  try {
    const store = storage ?? globalThis.localStorage;
    return parseHidden(store?.getItem(FILTERS_STORAGE_KEY));
  } catch {
    return new Set();
  }
}

export function storeHidden(
  hidden: HiddenCategories,
  storage?: Pick<Storage, "setItem">,
): void {
  try {
    const store = storage ?? globalThis.localStorage;
    store?.setItem(FILTERS_STORAGE_KEY, JSON.stringify([...hidden]));
  } catch {
    /* storage unavailable — the choice simply does not persist */
  }
}

/** Immutable toggle: never mutates the input set. */
export function toggleHidden(
  hidden: HiddenCategories,
  category: string,
): Set<string> {
  const next = new Set(hidden);
  if (!next.delete(category)) next.add(category);
  return next;
}

/** The event's categories minus the hidden ones, in the original order. */
export function visibleCategories(
  categories: readonly string[],
  hidden: HiddenCategories,
): string[] {
  return categories.filter((c) => !hidden.has(c));
}

/** Hidden only when every category of the event is hidden. */
export function isEventVisible(
  event: Pick<EventItem, "categories">,
  hidden: HiddenCategories,
): boolean {
  if (hidden.size === 0) return true;
  return visibleCategories(event.categories, hidden).length > 0;
}

export function filterEvents(
  events: readonly EventItem[],
  hidden: HiddenCategories,
): EventItem[] {
  return events.filter((e) => isEventVisible(e, hidden));
}

export interface CategoryCount {
  category: string;
  count: number;
}

/**
 * Every category present in the feed with its event count, most common
 * first. Ties break alphabetically so the badge order is stable across
 * refetches.
 */
export function categoryCounts(events: readonly EventItem[]): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    for (const category of event.categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

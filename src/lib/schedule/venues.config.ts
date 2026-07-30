/**
 * Editorial venue configuration — hand-owned, never derived from the API.
 *
 * The API ships no usable presentation data: `locations[].priority` is null
 * on all 14 venues, one venue colour is the string "red", three are null.
 * Rule of thumb (docs/design/data-model.md): trust the API for facts,
 * never for presentation. Order, short names and grid/other tiering are
 * editorial decisions and live here.
 *
 * `scene-stage` is the demoscene/seminar stage, sponsor-renamed
 * "Genelec Stage" — the slug is the stable key, the name is not.
 */
import type { VenueTier } from "./types";

export interface VenueConfigEntry {
  slug: string;
  short: string;
  order: number;
  tier: VenueTier;
}

export const VENUE_CONFIG: readonly VenueConfigEntry[] = [
  { slug: "main-stage", short: "MAIN", order: 1, tier: "grid" },
  { slug: "scene-stage", short: "GENELEC", order: 2, tier: "grid" },
  { slug: "expo-stage", short: "EXPO ST", order: 3, tier: "grid" },
  { slug: "red-bull-gaming-sphere", short: "RED BULL", order: 4, tier: "grid" },
  { slug: "assygames", short: "ASSYGAMES", order: 5, tier: "grid" },
  { slug: "assymylly", short: "ASSYMYLLY", order: 6, tier: "grid" },
  { slug: "casual-tournaments", short: "CASUAL", order: 7, tier: "other" },
  { slug: "content-corner-seats", short: "CONTENT", order: 8, tier: "other" },
  { slug: "kotra-k-week-x-assembly-booth", short: "K-WEEK", order: 9, tier: "other" },
  { slug: "elisa", short: "ELISA", order: 10, tier: "other" },
  { slug: "expo", short: "EXPO", order: 11, tier: "other" },
  { slug: "kids-active-zone", short: "KIDS", order: 12, tier: "other" },
  { slug: "lan", short: "LAN", order: 13, tier: "other" },
  { slug: "infodesk", short: "INFO", order: 14, tier: "other" },
] as const;

export function venueConfigFor(slug: string): VenueConfigEntry | undefined {
  return VENUE_CONFIG.find((v) => v.slug === slug);
}

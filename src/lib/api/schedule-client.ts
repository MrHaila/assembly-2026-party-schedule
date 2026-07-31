/**
 * The only network code in the app.
 *
 * Strategy (see docs/design/design-log.md #24):
 * - Nothing is bundled. The page opens on a loading state and fetches a lean,
 *   language-agnostic LIST once, then polls it (React Query, 60 s).
 * - Event bodies (the per-language excerpt) load ON DEMAND, batched by id
 *   through a coalescing loader so warming a whole day of details is one round
 *   trip. React Query caches each (id, language) for an hour.
 * - We identify ourselves to the origin two CORS-safe ways: a `?client=` query
 *   param (shows in access logs) and named GraphQL operations. A custom request
 *   HEADER is NOT possible — the endpoint's Access-Control-Allow-Headers lists
 *   only Authorization/Content-Type/X-JWT-*, so any other header fails the
 *   browser preflight. (User-Agent is a forbidden header regardless.)
 */
import {
  eventDetailResponseSchema,
  scheduleListResponseSchema,
} from "@/lib/schedule/schema";
import { normalizeEventDetail, normalizeSchedule } from "@/lib/schedule/normalize";
import { nowHelsinkiIso } from "@/lib/schedule/time";
import type { EventDetail, ScheduleData } from "@/lib/schedule/types";
import type { Language } from "@/lib/i18n/language";
import { createBatchLoader, type BatchLoader } from "./batch-loader";

export const GRAPHQL_ENDPOINT = "https://wp.assembly.org/summer26/graphql";

/** Identifies this client in the origin's request logs (see file header). */
export const CLIENT_ID = "assyguide/1.0";

/** Endpoint with the CORS-safe identifying query param. */
const REQUEST_URL = `${GRAPHQL_ENDPOINT}?client=${encodeURIComponent(CLIENT_ID)}`;

/** The lean timeline query — everything the grid needs, no event bodies. */
export const SCHEDULE_LIST_QUERY = `query AssyguideSchedule {
  calendarEvents(first: 1000) {
    nodes {
      databaseId title slug startTime endTime streamUrls programId modified
      locations { nodes { name slug color } }
      program {
        title slug uri streams
        translation(language: EN) { title }
        categories { nodes { name slug color } }
      }
    }
  }
  locations(first: 100) { nodes { name slug color count } }
  categories(first: 100) { nodes { name slug color language { code } } }
  generalSettings { title timezone }
  eventSettings { eventStartDate eventEndDate eventLocation eventTitleShort
                  eventCompoArchiveLink eventPhotoGalleryLink }
}`;

/**
 * The per-language detail query for a batch of ids. FI needs only
 * `program.excerpt`; EN also pulls `translation.excerpt` (preferred) and keeps
 * the FI excerpt as a fallback for fiOnly programs.
 */
export function detailQuery(ids: readonly number[], language: Language): string {
  const body =
    language === "en"
      ? "excerpt translation(language: EN) { excerpt }"
      : "excerpt";
  return `query AssyguideDetail {
    calendarEvents(where: { in: [${ids.join(",")}] }, first: ${ids.length}) {
      nodes { databaseId program { ${body} } }
    }
  }`;
}

/** POST a GraphQL query. Throws on network, HTTP, or GraphQL errors. */
export async function graphqlFetch(
  query: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const res = await fetch(REQUEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal,
  });
  if (!res.ok) throw new Error(`Schedule fetch failed: HTTP ${res.status}`);
  const json = (await res.json()) as { data?: unknown; errors?: unknown };
  if (json.errors) throw new Error("Schedule fetch failed: GraphQL errors");
  return json.data;
}

/** Fetch + normalize the timeline. `fetchedAt` stamps the footer. */
export async function fetchScheduleList(
  signal?: AbortSignal,
): Promise<ScheduleData> {
  const data = await graphqlFetch(SCHEDULE_LIST_QUERY, signal);
  const parsed = scheduleListResponseSchema.parse(data);
  return normalizeSchedule(parsed, nowHelsinkiIso());
}

// ── Server-held cache ──────────────────────────────────────────────────────
// The upstream WPGraphQL resolver takes ~1.5 s. We hold the timeline server-
// side so visitors never pay that: the SSR loader reads this and ships the
// data in the HTML (no skeleton). Two tiers, both best-effort:
//   L1 — an in-isolate memo (survives across requests on a warm Worker/Node).
//   L2 — Cloudflare's per-colo Cache API (shared across isolates in a colo;
//        absent in Node dev, where edgeCache() returns null and we skip it).
// FRESH: serve without touching upstream. STALE: serve immediately but kick a
// background refresh. Beyond STALE (or cold): block on a fresh fetch, and if
// upstream is down, serve whatever stale copy we still hold rather than error.

const CACHE_FRESH_MS = 60_000;
const CACHE_STALE_MS = 10 * 60_000;
const EDGE_CACHE_KEY = "https://assyguide.internal/schedule/summer26";

interface CacheEntry {
  data: ScheduleData;
  at: number;
}

/** Minimal shape of Cloudflare's `caches.default`; null anywhere it is absent. */
interface EdgeCache {
  match(request: string): Promise<Response | undefined>;
  put(request: string, response: Response): Promise<void>;
}
function edgeCache(): EdgeCache | null {
  const store = (globalThis as { caches?: { default?: EdgeCache } }).caches;
  return store?.default ?? null;
}

let memo: CacheEntry | null = null;
let refreshing: Promise<void> | null = null;

function entryFrom(data: ScheduleData): CacheEntry {
  return { data, at: Date.parse(data.fetchedAt) || Date.now() };
}

async function readEdge(): Promise<CacheEntry | null> {
  const cache = edgeCache();
  if (!cache) return null;
  try {
    const res = await cache.match(EDGE_CACHE_KEY);
    if (!res) return null;
    return entryFrom((await res.json()) as ScheduleData);
  } catch {
    return null;
  }
}

async function writeEdge(data: ScheduleData): Promise<void> {
  const cache = edgeCache();
  if (!cache) return;
  try {
    await cache.put(
      EDGE_CACHE_KEY,
      new Response(JSON.stringify(data), {
        headers: {
          "content-type": "application/json",
          "cache-control": "max-age=600",
        },
      }),
    );
  } catch {
    /* best effort — a cache write failure must never break a request */
  }
}

/** Fetch fresh, update both tiers. Shared by the blocking + background paths. */
async function refreshCache(): Promise<CacheEntry> {
  const entry = entryFrom(await fetchScheduleList());
  memo = entry;
  await writeEdge(entry.data);
  return entry;
}

function kickBackgroundRefresh(): void {
  if (refreshing) return;
  refreshing = refreshCache()
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      refreshing = null;
    });
}

/**
 * The timeline for SSR — served from the server-held cache when possible.
 * Never returns a skeleton: the caller always gets data (or the error from a
 * cold-cache upstream failure, which the route surfaces as retry).
 */
export async function getCachedScheduleList(): Promise<ScheduleData> {
  const now = Date.now();

  if (memo && now - memo.at < CACHE_FRESH_MS) return memo.data;
  if (memo && now - memo.at < CACHE_STALE_MS) {
    kickBackgroundRefresh();
    return memo.data;
  }

  const edge = await readEdge();
  if (edge) {
    memo = edge;
    if (now - edge.at >= CACHE_FRESH_MS) kickBackgroundRefresh();
    if (now - edge.at < CACHE_STALE_MS) return edge.data;
  }

  try {
    return (await refreshCache()).data;
  } catch (error) {
    // Upstream down: a stale copy beats an error page.
    if (memo) return memo.data;
    if (edge) return edge.data;
    throw error;
  }
}

/** Batch-fetch details for a set of ids in one language → keyed by id. */
export async function fetchEventDetails(
  ids: readonly number[],
  language: Language,
): Promise<ReadonlyMap<number, EventDetail>> {
  const data = await graphqlFetch(detailQuery(ids, language));
  const parsed = eventDetailResponseSchema.parse(data);
  const map = new Map<number, EventDetail>();
  for (const node of parsed.calendarEvents.nodes) {
    map.set(node.databaseId, normalizeEventDetail(node, language));
  }
  return map;
}

/**
 * One coalescing loader per language: concurrent `loadEventDetail` calls (a
 * click plus a whole-day prefetch) collapse into a single batched request.
 */
const detailLoaders: Record<Language, BatchLoader<number, EventDetail>> = {
  fi: createBatchLoader({ batchFn: (ids) => fetchEventDetails(ids, "fi") }),
  en: createBatchLoader({ batchFn: (ids) => fetchEventDetails(ids, "en") }),
};

/** On-demand event body. Always resolves an EventDetail (empty if none). */
export function loadEventDetail(
  id: number,
  language: Language,
): Promise<EventDetail> {
  return detailLoaders[language].load(id).then((detail) => detail ?? { id });
}

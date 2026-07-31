/**
 * The demoscene news feed (scene.assembly.org).
 *
 * The upstream endpoint sends NO `Access-Control-Allow-Origin`, so the browser
 * cannot call it directly. On the server (SSR / the cached loader) we hit the
 * origin; in the browser we go through our own same-origin proxy route
 * (`/api/public/scene-news`), which is a thin pass-through.
 *
 * A news failure must never take the timeline down: every path resolves to an
 * empty list on error.
 */
import { newsResponseSchema, normalizeNews } from "@/lib/schedule/news";
import type { EventItem } from "@/lib/schedule/types";

export const NEWS_ENDPOINT = "https://scene.assembly.org/api/v1/timetable/";
export const NEWS_PROXY_PATH = "/api/public/scene-news";

function newsUrl(): string {
  return typeof window === "undefined" ? NEWS_ENDPOINT : NEWS_PROXY_PATH;
}

/** Fetch + normalize the news stream. Returns [] on any failure. */
export async function fetchSceneNews(
  signal?: AbortSignal,
): Promise<EventItem[]> {
  try {
    const res = await fetch(newsUrl(), {
      headers: { accept: "application/json" },
      signal,
    });
    if (!res.ok) return [];
    const parsed = newsResponseSchema.safeParse(await res.json());
    return parsed.success ? normalizeNews(parsed.data) : [];
  } catch {
    return [];
  }
}

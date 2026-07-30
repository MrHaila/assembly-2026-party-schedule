/**
 * The only network code in the app.
 *
 * Strategy (docs/design/design-log.md #2):
 * 1. A committed snapshot ships with the bundle — instant first paint,
 *    works on venue wifi, works offline.
 * 2. On load the client refreshes stale-while-revalidate against the live
 *    endpoint (CORS is permissive, verified). On any failure — network,
 *    HTTP, or schema drift — the caller keeps the snapshot.
 */
import snapshotJson from "@/data/schedule-summer26.snapshot.json";
import { normalizeSchedule } from "@/lib/schedule/normalize";
import { nowHelsinkiIso } from "@/lib/schedule/time";
import { scheduleResponseSchema, snapshotSchema } from "@/lib/schedule/schema";
import type { ScheduleData } from "@/lib/schedule/types";

export const GRAPHQL_ENDPOINT = "https://wp.assembly.org/summer26/graphql";

/** The reference query — everything the app needs, one round trip. */
export const SCHEDULE_QUERY = `{
  calendarEvents(first: 1000) {
    nodes {
      databaseId title slug startTime endTime streamUrls programId modified
      locations { nodes { name slug color } }
      program {
        title slug uri excerpt content streams
        translation(language: EN) { title excerpt }
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

const snapshot = snapshotSchema.parse(snapshotJson);
const snapshotSchedule = normalizeSchedule(snapshot.data, snapshot.fetchedAt);

/** Synchronous — the snapshot is bundled. Never throws. */
export function getSnapshotSchedule(): ScheduleData {
  return snapshotSchedule;
}

/** Live refresh. Throws on network/HTTP/schema failure — caller falls back. */
export async function fetchLiveSchedule(
  signal?: AbortSignal,
): Promise<ScheduleData> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: SCHEDULE_QUERY }),
    signal,
  });
  if (!res.ok) throw new Error(`Schedule fetch failed: HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error("Schedule fetch failed: GraphQL errors");
  const parsed = scheduleResponseSchema.parse(json.data);
  return normalizeSchedule(parsed, nowHelsinkiIso());
}

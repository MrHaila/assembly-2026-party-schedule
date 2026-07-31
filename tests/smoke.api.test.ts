/**
 * Live schema-shape smoke test. The endpoint is undocumented and can change
 * without notice — this test fails loudly when it does, instead of letting
 * the app degrade silently. Covers BOTH payloads: the polled list and the
 * on-demand detail batch.
 *
 * Opt-in (never runs in the normal suite, never in CI unless wired):
 *   RUN_API_SMOKE=1 bun run test:smoke
 */
import { describe, expect, it } from "vitest";
import {
  SCHEDULE_LIST_QUERY,
  detailQuery,
  graphqlFetch,
} from "@/lib/api/schedule-client";
import {
  eventDetailResponseSchema,
  scheduleListResponseSchema,
} from "@/lib/schedule/schema";

const RUN = process.env.RUN_API_SMOKE === "1";

describe.skipIf(!RUN)("live Assembly API smoke test", () => {
  it("keeps the list shape the timeline depends on", async () => {
    // graphqlFetch is the real client path (query param, no forbidden header),
    // so this also proves the request survives the browser's CORS preflight.
    const data = await graphqlFetch(
      SCHEDULE_LIST_QUERY,
      AbortSignal.timeout(20_000),
    );
    const parsed = scheduleListResponseSchema.parse(data);
    expect(parsed.calendarEvents.nodes.length).toBeGreaterThan(150);
    expect(parsed.locations.nodes.length).toBeGreaterThanOrEqual(10);
    expect(parsed.generalSettings.timezone).toBe("Europe/Helsinki");
  }, 30_000);

  it("keeps the detail batch shape (both languages)", async () => {
    const list = scheduleListResponseSchema.parse(
      await graphqlFetch(SCHEDULE_LIST_QUERY, AbortSignal.timeout(20_000)),
    );
    const ids = list.calendarEvents.nodes.slice(0, 5).map((n) => n.databaseId);

    for (const lang of ["fi", "en"] as const) {
      const data = await graphqlFetch(detailQuery(ids, lang));
      const parsed = eventDetailResponseSchema.parse(data);
      expect(parsed.calendarEvents.nodes.length).toBeGreaterThan(0);
    }
  }, 45_000);
});

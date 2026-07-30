/**
 * Live schema-shape smoke test. The endpoint is undocumented and can change
 * without notice — this test fails loudly when it does, instead of letting
 * the app degrade silently.
 *
 * Opt-in (never runs in the normal suite, never in CI unless wired):
 *   RUN_API_SMOKE=1 bun run test:smoke
 */
import { describe, expect, it } from "vitest";
import { GRAPHQL_ENDPOINT, SCHEDULE_QUERY } from "@/lib/api/assembly-graphql";
import { scheduleResponseSchema } from "@/lib/schedule/schema";

const RUN = process.env.RUN_API_SMOKE === "1";

describe.skipIf(!RUN)("live Assembly API smoke test", () => {
  it("keeps the shape the app depends on", async () => {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: SCHEDULE_QUERY }),
      signal: AbortSignal.timeout(20_000),
    });
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json.errors).toBeUndefined();

    // zod parse IS the 12-field assertion: startTime/endTime/streamUrls/
    // programId/modified/locations/program(+translation,categories)/eventSettings
    // are all required by the schema and absent fields throw here.
    const parsed = scheduleResponseSchema.parse(json.data);
    expect(parsed.calendarEvents.nodes.length).toBeGreaterThan(150);
    expect(parsed.locations.nodes.length).toBeGreaterThanOrEqual(10);
    expect(parsed.generalSettings.timezone).toBe("Europe/Helsinki");
  }, 30_000);
});

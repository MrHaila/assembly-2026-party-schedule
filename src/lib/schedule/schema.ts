/**
 * zod schemas for the raw WPGraphQL payload — the single typed API boundary.
 *
 * The endpoint is undocumented and introspection is off, so these schemas are
 * the contract. tests/smoke.api.test.ts runs them against the live endpoint;
 * everything else tests against tests/fixtures/summer26.raw.json.
 *
 * Two payloads exist because the timeline is language-agnostic but event
 * bodies are not: the LIST (scheduleListResponseSchema) carries everything the
 * grid needs and is fetched once and polled; the DETAIL
 * (eventDetailResponseSchema) carries the per-language excerpt only and is
 * fetched on demand, batched by id. zod strips unknown keys, so the lean list
 * schema happily parses a fuller fixture.
 *
 * Measured quirks encoded here (summer26, verified 2026-07-30):
 * - `endTime` may be null OR the empty string (GraphQL null vs site JSON "").
 * - `programId` is a WPGraphQL global ID ("cG9zdDo2NDE="), not a number.
 * - `modified` is Helsinki-local with NO timezone offset.
 * - `program.translation` is null for ~20 programs (FI-only).
 */
import { z } from "zod";

// Only slug is read per event (colors/names are never rendered — the venue
// display name comes once from the top-level locations block).
const gqlSlugNodeSchema = z.object({ slug: z.string() });

/**
 * List program: no excerpt/content (the heavy, language-dependent body lives
 * in the detail payload) and no title/slug/streams (unused). `translation`
 * carries only its id — its mere presence drives the `fiOnly` chip.
 */
const gqlListProgramSchema = z
  .object({
    uri: z.string(),
    // Presence only → the FI chip. The query selects a scalar (databaseId) to
    // form a valid selection set, but any shape counts; we never read a field.
    translation: z.object({}).nullish(),
    categories: z.object({ nodes: z.array(gqlSlugNodeSchema) }).nullish(),
  })
  .nullable();

const gqlListEventSchema = z.object({
  databaseId: z.number(),
  title: z.string(),
  startTime: z.string(),
  endTime: z.string().nullish(),
  streamUrls: z.array(z.string()).nullish(),
  locations: z.object({ nodes: z.array(gqlSlugNodeSchema) }),
  program: gqlListProgramSchema,
});

export const scheduleListResponseSchema = z.object({
  calendarEvents: z.object({ nodes: z.array(gqlListEventSchema) }),
  // Venue display name + slug, once. Colours/counts are not fetched (unused).
  locations: z.object({
    nodes: z.array(z.object({ name: z.string(), slug: z.string() })),
  }),
  generalSettings: z.object({ title: z.string(), timezone: z.string() }),
  eventSettings: z.object({
    eventStartDate: z.string(),
    eventEndDate: z.string(),
    eventLocation: z.string().nullish(),
    eventTitleShort: z.string().nullish(),
  }),
});

/**
 * Detail payload: the per-language excerpt for a batch of event ids. The FI
 * excerpt lives on `program.excerpt`; the EN excerpt on
 * `program.translation.excerpt` (only requested for the EN language, and kept
 * alongside FI so a fiOnly event can fall back). Both are nullable — a
 * programless event has `program: null`.
 */
const gqlDetailEventSchema = z.object({
  databaseId: z.number(),
  program: z
    .object({
      excerpt: z.string().nullish(),
      translation: z.object({ excerpt: z.string().nullish() }).nullish(),
    })
    .nullable(),
});

export const eventDetailResponseSchema = z.object({
  calendarEvents: z.object({ nodes: z.array(gqlDetailEventSchema) }),
});

export type RawScheduleData = z.infer<typeof scheduleListResponseSchema>;
export type RawEvent = z.infer<typeof gqlListEventSchema>;
export type RawDetailEvent = z.infer<typeof gqlDetailEventSchema>;

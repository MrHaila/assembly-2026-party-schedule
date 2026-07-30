/**
 * zod schemas for the raw WPGraphQL payload — the single typed API boundary.
 *
 * The endpoint is undocumented and introspection is off, so these schemas are
 * the contract. tests/smoke.api.test.ts runs them against the live endpoint;
 * everything else tests against tests/fixtures/summer26.raw.json.
 *
 * Measured quirks encoded here (summer26, verified 2026-07-30):
 * - `endTime` may be null OR the empty string (GraphQL null vs site JSON "").
 * - `programId` is a WPGraphQL global ID ("cG9zdDo2NDE="), not a number.
 * - `modified` is Helsinki-local with NO timezone offset.
 * - `program.translation` is null for ~20 programs (FI-only).
 */
import { z } from "zod";

const gqlLocationSchema = z.object({
  name: z.string(),
  slug: z.string(),
  color: z.string().nullish(),
});

const gqlProgramCategorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  color: z.string().nullish(),
});

const gqlProgramSchema = z
  .object({
    title: z.string(),
    slug: z.string(),
    uri: z.string(),
    excerpt: z.string().nullish(),
    content: z.string().nullish(),
    streams: z.array(z.string()).nullish(),
    translation: z
      .object({
        title: z.string(),
        excerpt: z.string().nullish(),
      })
      .nullish(),
    categories: z
      .object({ nodes: z.array(gqlProgramCategorySchema) })
      .nullish(),
  })
  .nullable();

const gqlEventSchema = z.object({
  databaseId: z.number(),
  title: z.string(),
  slug: z.string(),
  startTime: z.string(),
  endTime: z.string().nullish(),
  streamUrls: z.array(z.string()).nullish(),
  programId: z.string().nullish(),
  modified: z.string(),
  locations: z.object({ nodes: z.array(gqlLocationSchema) }),
  program: gqlProgramSchema,
});

export const scheduleResponseSchema = z.object({
  calendarEvents: z.object({ nodes: z.array(gqlEventSchema) }),
  locations: z.object({
    nodes: z.array(gqlLocationSchema.extend({ count: z.number().nullish() })),
  }),
  categories: z.object({
    nodes: z.array(
      gqlProgramCategorySchema.extend({
        language: z.object({ code: z.string() }).nullish(),
      }),
    ),
  }),
  generalSettings: z.object({ title: z.string(), timezone: z.string() }),
  eventSettings: z.object({
    eventStartDate: z.string(),
    eventEndDate: z.string(),
    eventLocation: z.string().nullish(),
    eventTitleShort: z.string().nullish(),
    eventCompoArchiveLink: z.string().nullish(),
    eventPhotoGalleryLink: z.string().nullish(),
  }),
});

export const snapshotSchema = z.object({
  fetchedAt: z.string(),
  source: z.string().optional(),
  data: scheduleResponseSchema,
});

export type RawScheduleData = z.infer<typeof scheduleResponseSchema>;
export type RawEvent = z.infer<typeof gqlEventSchema>;
export type ScheduleSnapshot = z.infer<typeof snapshotSchema>;

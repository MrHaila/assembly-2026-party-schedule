# ASSYGUIDE data model

The normalized model (`src/lib/schedule/types.ts`) is the only shape view
components may consume. Raw WPGraphQL shapes are parsed by zod at the
boundary (`src/lib/schedule/schema.ts`) and transformed by
`src/lib/schedule/normalize.ts`. Every rule below is driven by a measured
quirk in the live summer26 payload (verified 2026-07-30, 210 events) and
pinned by a fixture test in `tests/normalize.test.ts`.

## Core principle

**Trust the API for facts, never for presentation.** Every ordering /
presentation field in the API is unpopulated: `locations[].priority` is null
on all 14 venues, `categories[].icon` null on all 34, `program.order` is
999999 on everything, one venue colour is the string `"red"`. Order, short
names, tiering and icons are editorial and live in
`src/lib/schedule/venues.config.ts`.

## Normalization rules

| # | Measured case | Count | Rule |
|---|---|---|---|
| 1 | `endTime` **before** `startTime` | 2 | Clamp to no-end → default 60 min, `estimated: true`. A naive `end - start` yields a negative CSS grid span and silently corrupts a whole column. Guarded twice: here and `spanSlotsFor` (`Math.max(1, …)`) at the render site. |
| 2 | `endTime` null or `""` | 5 | Same default: 60 min, `estimated: true`, rendered `≈`. All 5 are esports tournaments. |
| 3 | `endTime == startTime` | 10 | `kind: "moment"` → labelled rule, not a block. Doors Open, EXPO opens/closes, Premium doors. |
| 4 | Duration ≥ 6h | 18 | `kind: "ongoing"` → ongoing band, never the grid. Also catches the one 30h cross-date event, so **no midnight-clipping machinery exists at all**. Threshold: `ONGOING_THRESHOLD_MIN`. |
| 5 | Two locations | 1 | `venueIdSecondary` — render in both columns (`⇄`), one identity. |
| 6 | No linked program | 17 | Synthetic `general` category, exempt from any future filtering. **Includes Opening and Closing ceremony** — getting this wrong hides the two most important events of the weekend. |
| 7 | API ordering | all | `orderby: DATE` sorts by WP post date and is not monotonic in `startTime`. Events are sorted once in the normalizer; views never re-sort. |
| 8 | Filtering | — | No server-side filtering exists. All filtering is client-side; the whole dataset is one small payload. |
| 9 | Language | 193 w/ program | All programs are FI; 173 have an EN translation, 20 don't (`fiOnly: true` → `FI` chip). Event titles are mixed FI/EN. |
| 10 | Category duplication | 34 terms | Each category exists in FI and EN (`byoc` / `byoc-en`). De-suffix `-en`, drop `uncategorized` into rule 6's bucket. |
| 11 | Venue colours | 11/14 | Ignored. Validated but unused — venues are distinguished by position and rule weight, not 14 pastels. |
| 12 | Concurrency | max 4–5 | Only in `content-corner-seats` / `casual-tournaments`, both `other` tier. Grid-tier concurrency ≤ 2 → two-lane sub-columns (`assignSubColumns`). |

## Types that surprised the PRD (caught by the fixture)

- `programId` is a WPGraphQL global ID (`"cG9zdDo2NDE="`), **not** a number.
- `modified` is Helsinki-local with **no** timezone offset.
- `excerpt`/`content` are HTML — stripped to text for display (`stripHtml`).

## Model

```ts
EventItem = {
  id: number                    // databaseId — stable identity
  title: string                 // occurrence title (mixed FI/EN)
  titleEn?: string              // EN translation title when it differs
  fiOnly: boolean               // program exists, EN translation missing
  venueId: string               // location slug — stable key, never the name
  venueIdSecondary?: string
  start: string                 // ISO 8601 +03:00
  end: string                   // always set after normalization
  durationMin: number           // ≥ 0, guaranteed
  estimated: boolean            // render times with ≈
  kind: "session" | "ongoing" | "moment" | "deadline" | "jury"
  categories: string[]          // de-suffixed, never empty
  streamUrls: string[]          // presence drives the grid "●" marker
  programId?: string
  sourceUrl?: string
  modified: string
}

// Fetched on demand per (id, language), NOT part of the list item — the body
// is the only language-dependent thing the UI shows (see Freshness).
EventDetail = { id: number, excerpt?: string }   // HTML-stripped, EN preferred

Venue = { slug, name, short, order, tier: "grid" | "other", eventCount }
Day   = { id: "thu"|"fri"|"sat"|"sun", date, label }  // derived from eventSettings
```

## Time

Europe/Helsinki is hardcoded (`src/lib/schedule/time.ts`) — never the device
timezone; attendees arrive from abroad. The verified day window is
**10:00–23:00** (780 min). Grid rows are 5-minute units (156 rows).
`kind: "deadline" | "jury"` exist for the future hand-authored compo overlay
(Partyman data is not in the API).

## Freshness

Nothing is bundled — the page opens on a loading skeleton and fetches live
(`src/lib/api/schedule-client.ts`). Two payloads, because the timeline is
language-agnostic but bodies are not:

- **List** — the lean, language-independent timeline (`SCHEDULE_LIST_QUERY`).
  Fetched once and polled every 60 s while the tab is focused (React Query
  `staleTime`/`refetchInterval` in `use-schedule.ts`). Footer stamp is
  `fetchedAt`. On failure there is no snapshot to fall back on, so the route
  shows an error + retry.
- **Detail** — the per-`(id, language)` excerpt, fetched on demand when a sheet
  opens and prefetched for the visible range 1 s after scrolling settles
  (`use-event-detail.ts`). Cached for 1 h. Concurrent fetches (a click plus a
  whole-day warm) collapse into a single batched `calendarEvents(where:{in:…})`
  request via the coalescing loader (`batch-loader.ts`, unit-tested).

Occurrence titles are **not** localized, so swapping language refetches details
only, never the list. We identify ourselves CORS-safely — a `?client=` query
param plus named GraphQL operations; a custom request header is impossible
because the endpoint's `Access-Control-Allow-Headers` allows only
Authorization/Content-Type/X-JWT-*. Schema drift in either payload is caught by
`bun run test:smoke` against the live endpoint.

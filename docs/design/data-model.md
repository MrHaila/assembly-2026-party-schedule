# ASSYGUIDE data model

Normalized model (`types.ts`) = the only shape views consume. Raw WPGraphQL
parsed by zod at the boundary (`schema.ts`), transformed by `normalize.ts`.
Every rule below is driven by a measured quirk in the live summer26 payload
(verified 2026-07-30, 210 events), pinned by `tests/normalize.test.ts`.

## Core principle

**Trust the API for facts, never presentation.** Every ordering/presentation
field is unpopulated: `locations[].priority` null on all 14 venues,
`categories[].icon` null on all 34, `program.order` 999999 on everything, one
venue colour is the string `"red"`. Order, short names, tiering, icons are
editorial in `venues.config.ts`.

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
| 11 | Venue colours | 11/14 | Not fetched. Nothing renders colour — venues are distinguished by position and rule weight, not 14 pastels. The list query also drops all category/location names and the top-level categories block for the same reason (unused), for a ~25% faster resolve. |
| 12 | Concurrency | max 4–5 | Only in `content-corner-seats` / `casual-tournaments`, both `other` tier. Grid-tier concurrency ≤ 2 → two-lane sub-columns (`assignSubColumns`). |

## Type gotchas (caught by the fixture)

- `programId` is a WPGraphQL global ID (`"cG9zdDo2NDE="`), not a number (unused, not fetched).
- `modified` is Helsinki-local with no timezone offset (unused, not fetched).
- `excerpt`/`content` are HTML — stripped to text (`stripHtml`).

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
  sourceUrl?: string
}

// Fetched on demand per (id, language), NOT part of the list item — the body
// is the only language-dependent thing the UI shows (see Freshness).
EventDetail = { id: number, excerpt?: string }   // HTML-stripped, EN preferred

Venue = { slug, name, short, order, tier: "grid" | "other", eventCount }
Day   = { id: "thu"|"fri"|"sat"|"sun", date, label }  // derived from eventSettings
```

## Time

Europe/Helsinki hardcoded (`time.ts`) — never device timezone; attendees arrive
from abroad. Grid rows are 5-min units; each day's window is data-driven
(`computeDayWindow`), 10:00–23:00 / 156 rows only as the empty-day fallback.
`kind: "deadline" | "jury"` reserved for the future hand-authored compo overlay
(Partyman data not in the API).

## Freshness

Nothing bundled. Two payloads — timeline is language-agnostic, bodies aren't
(`schedule-client.ts`):

- **List** — lean, language-independent (`SCHEDULE_LIST_QUERY`). SSR'd in the
  route loader from a two-tier server cache (in-isolate memo + Cloudflare
  per-colo Cache API, stale-while-revalidate), so the HTML ships data — no
  skeleton. `use-schedule.ts` seeds React Query, polls 60 s while focused.
  Footer stamp `fetchedAt`. No snapshot fallback → error + retry on failure.
- **Detail** — per-`(id, language)` excerpt, fetched when a sheet opens,
  prefetched for the visible range 1 s after scroll settles
  (`use-event-detail.ts`). Cached 1 h. Concurrent fetches collapse into one
  batched `calendarEvents(where:{in:…})` via the coalescing loader
  (`batch-loader.ts`, unit-tested).

Titles not localized → swapping language refetches details only, never the list.
CORS-safe identity: `?client=` query param + named operations; a custom header
is impossible (`Access-Control-Allow-Headers` allows only
Authorization/Content-Type/X-JWT-*). Schema drift caught by `bun run test:smoke`.

# ASSYGUIDE — Milestone 1: data layer + minimal working schedule

A single-page app showing the Assembly Summer 2026 schedule (Thu 30 Jul – Sun 2 Aug, live event starting today) as a dense TV-listings page. This milestone delivers the **data layer, information architecture, and a working responsive presentation** — no favourites, filters, or themes yet (those are deliberate follow-ups).

## Stack — one change from your preference

Lovable projects are fixed to **React 19 + TanStack Start + Vite** — Vue is not available on this platform. Everything else you asked for carries over:

| Your preference | Here |
|---|---|
| Strict TS | `tsconfig` strict, no casts on inferred router/query values |
| Vite | Already the build tool (Vite 8) |
| Vitest | **Added** — unit tests + live API smoke test |
| OXC linter | **Added** (`oxlint`) — works on React/TS the same as Vue |
| Tailwind | Tailwind v4, tokens in `src/styles.css` |

TanStack Start is SSR-capable, but the schedule UI is fully client-rendered against a committed JSON snapshot + runtime refresh, so it behaves as the SPA you described. React Server Functions replace the "static build artifact" role: a snapshot is committed to the repo, runtime refresh happens in the browser (the API's CORS is permissive — verified live this session: 210 events, dates match the PRD).

## Architecture — separation of concerns

```text
src/lib/schedule/            Pure domain library. No React, no fetch. Fully unit-tested.
  types.ts                   EventItem, Venue, Day, EventKind (PRD §5.3)
  schema.ts                  zod schemas for the raw GraphQL payload = the typed API boundary
  normalize.ts               Raw payload -> EventItem[], Venue[], Day[] (all 12 rules of §5.5)
  time.ts                    Europe/Helsinki helpers, 5-min slot math (never device timezone)
  venues.config.ts           Editorial config: order, short names, grid/other tier (hand-owned)
src/lib/api/
  assembly-graphql.ts        fetch + zod-parse + snapshot fallback. The only network code.
src/components/schedule/     View components. Props accept ONLY normalized domain types —
                             no raw API shapes, no style passthrough props (guards style drift).
  ScheduleGrid / VenueColumn / EventBlock / OngoingBand / MomentMarker / NowBar
  ScheduleLog (mobile) / DayTabs / DetailSheet / OtherVenues
src/data/
  schedule-summer26.snapshot.json   Committed snapshot = instant first paint + offline fallback
docs/design/
  data-model.md              The normalized model + every normalization rule, with rationale
  design-log.md              ADR-style dated log. Rule: every visual/IA change gets an entry.
tests/
  fixtures/summer26.raw.json Real API response captured today — tests never hit the network
  normalize.test.ts          One test per rule, incl. the landmines below
  smoke.api.test.ts          Live schema-shape test (opt-in: RUN_API_SMOKE=1), fails loudly
```

## Test-driven workflow (built first, in this order)

1. Capture the live payload into `tests/fixtures/summer26.raw.json` + `src/data/…snapshot.json`.
2. Write failing tests for each normalization rule, then implement `normalize.ts`:
   - **Negative duration** (`endTime < startTime`, 2 events) → clamp to no-end. *The landmine — tested first.*
   - `endTime` null/empty (5) → default 60 min, `estimated: true`, rendered `≈`.
   - Zero duration (10) → `kind: 'moment'` (labelled rule, not a block).
   - Duration ≥ 6h (18) → `kind: 'ongoing'` (ongoing band, never the grid).
   - Two venues (1 event) → renders in both columns.
   - No linked program (17 — **includes Opening/Closing ceremony**) → synthetic category, exempt from any future filtering. Tested explicitly.
   - Sort by `startTime` client-side (API order is not monotonic).
   - FI/EN category de-suffixing; EN title fallback tagged `FI`; venue colour validation.
   - Slot math: `Math.max(1, span)` guard so a bad span can never produce a negative CSS grid row.
3. Live smoke test asserts the 12 fields we depend on + a sane row count — run on demand, not every test run.
4. `bun run check` = oxlint + `tsc` + `vitest run`.

## Milestone 1 UI (the minimal thing that must work)

- **Route `/`** with day tabs (Thu 30 / Fri 31 / Sat 1 / Sun 2, derived from `eventSettings`), defaulting to the current day when inside the event window.
- **Desktop ≥768px — proportional grid:** CSS Grid with 5-minute row units (PRD §8 — no absolute positioning), 6 grid-tier venue columns, sticky time gutter + sticky venue headers, hour rules, ongoing band above, moment markers, "other venues" run-on block below, **now bar** with auto-scroll to now.
- **Mobile <768px — log view:** time-ordered list, venue as bold prefix, hour separators, now marker. Same data, second projection (PRD §3.1).
- **Detail sheet:** tap/click an event → full time, venue, category, program excerpt (EN with FI fallback + `FI` chip), stream link, source link back to assembly.org.
- **Styling stance:** functional and deliberately not final — one light newsprint-adjacent theme via semantic tokens, condensed sans, `tabular-nums` times, hairline rules instead of cards/shadows. We dog-food this, then iterate styling as its own effort, logged in `docs/design/design-log.md`.

## Explicitly out of scope (later milestones, in rough order)

Favourites (localStorage + URL bitmask) → category filter + "mine only" → conflict detection + search → newsprint/teksti themes → compo `overlay.json` (hand-authored Partyman deadlines) → change tracking on `modified` → print stylesheet, .ics export, now/next route, event-slug routing (`/winter26`), 14-column wide view.

## Verification before done

- All vitest tests green, oxlint + strict `tsc` clean, production build passes.
- Live-preview check (headless browser): grid renders all 6 venues with the real 210 events, now bar sits at the correct Helsinki time, log view appears at mobile width, detail sheet opens, no console errors.
- `docs/design/` files written alongside the code.

## Technical notes

- Time handling: `date-fns` (already installed), hardcoded `Europe/Helsinki`.
- Fetch strategy: committed snapshot first paint; runtime refresh stale-while-revalidate on load; on fetch/parse failure the UI silently keeps the snapshot (footer shows "data as of …").
- No backend, no accounts, no Lovable Cloud — nothing in this milestone needs persistence beyond `localStorage`, and favourites are explicitly deferred.

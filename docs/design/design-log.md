# ASSYGUIDE design log

Every visual and information-architecture decision gets a dated entry here.
Change the design → update this file in the same commit. Style decisions
must never become implicit.

---

## #1 — 2026-07-30 — Milestone 1 theme: functional newsprint

**Decision.** One light theme, newsprint-adjacent but deliberately not the
final design. Tokens in `src/styles.css`: `--paper #E9E7DE` (newsprint
grey-tan, not luxury cream), `--ink`, `--ink-mid`, `--rule`, `--spot
#E4002B` (one spot ink, like 2-colour print — now bar only), `--marker
#FFE800` (reserved for favourites). Type: IBM Plex Sans Condensed,
`tabular-nums` on all times (`.tnum`). Density comes from hairline rules and
tight leading — **no cards, radii, or shadows anywhere**, which the printed
page did not have either.

**Why.** Ship something real and dog-food it at the event before locking a
visual identity. The PRD's teletext (`teksti`) dark theme is a later,
separate effort.

**Guardrails.** Components take domain-typed props only — no `className` or
style passthrough — so styling can only drift in one file at a time.

## #2 — 2026-07-30 — Fetch strategy: snapshot + live refresh

**Decision.** A committed JSON snapshot (`src/data/schedule-summer26.
snapshot.json`, captured 2026-07-30) is bundled and paints instantly; the
client refreshes stale-while-revalidate (5 min stale time) against
`https://wp.assembly.org/summer26/graphql`. Any failure keeps the snapshot.

**Why.** Venue wifi is terrible; the API's CORS is permissive (verified);
the whole dataset is one small payload.

## #3 — 2026-07-30 — Grid technique: 5-minute CSS grid rows

**Decision.** The desktop grid is CSS Grid with 5-minute row units
(156 rows for the 780-minute day). Blocks place by `grid-row: start / span
n`; the span is guarded by `Math.max(1, …)`. No absolute positioning, no
collision math. Overlaps become sub-column lanes (`assignSubColumns`), max 2
in practice for grid-tier venues. A future zoom control is just changing
`--slot-h` (currently 7.5px = 1.5px/min).

**Deferred deliberately.** Alternate-hour tint bands, the minute scanline
tick on the now bar, zoom presets, the 14-column wide view, `role="grid"`
keyboard navigation, `prefers-reduced-motion` audit.

## #4 — 2026-07-30 — Titles: occurrence title primary, EN as secondary

**Decision.** Grid, log and sheet show the **event occurrence title**
(`CalendarEvent.title`). The EN program translation title appears in the
detail sheet as a secondary line when it differs. FI-only programs get an
`FI` chip.

**Why.** The PRD suggested leading with the EN program title, but 58
programs back 210 events: streamer slots ("aitopr1") share the program
"Content Corner Seats", so leading with program titles would erase
occurrence identity — the opposite of what a schedule is for.

## #5 — 2026-07-30 — Milestone 1 deferrals (do not re-add without an entry)

Favourites (localStorage + URL bitmask), category filter (dims, never
removes; programless events exempt), "mine only", conflict detection,
search, the `teksti` dark theme, compo `overlay.json` (Partyman deadlines,
hand-authored), change tracking on `modified`, print stylesheet, .ics
export, now/next route, event-slug routing (`/winter26`), 14-column wide
view, landscape mobile mini-grid.

**Why.** The minimal thing has to work in a real setting first. Each of
these is its own effort with its own log entry when it lands.

## #6 — 2026-07-30 — Continuous timeline, "location", count ordering, CSS overflow

**Decision.** Four changes from the first dog-fooding pass:

1. **One continuous timeline.** All four days render in a single scroll
   container as `<section data-day-id>` blocks with an inline `DayHeading`
   band. The day tabs are no longer pages — they are scroll shortcuts, and
   an `IntersectionObserver` moves the highlight to whichever day is in
   focus. `?day=` still deep-links; it now sets the initial scroll offset.
2. **All-day is part of the timeline.** The ≥6h ongoing items moved from a
   floating band above the grid onto the day heading itself
   (`OngoingBand` deleted, `DayHeading` owns the run-on line).
3. **"Venue" → "location"** in every user-facing string. Type and prop
   names still say `venue` — renaming the domain model is a separate,
   mechanical change and not worth mixing into a UI pass.
4. **Locations order by event COUNT, descending** (`normalizeVenues`),
   with the editorial config kept only for short names and a deterministic
   tie-break. Count, not total duration, so an all-day booth cannot outrank
   a stage running ten sessions.
5. **Grid/list split is now responsive, not editorial.** The scroll
   container is a size container; `.schedule-cols` steps `--cols` 2→8 at
   `48px + n × 150px`. Columns that do not fit are `display: none` via
   `[data-col]`, and the same location's run-on paragraph in "Other
   locations" carries `[data-overflow-col]` and is hidden exactly when its
   column is visible. Zero JS measurement, no horizontal overflow ever.
   Ultrawide guard: `max-width: calc(48px + var(--cols) * 280px)`.

**Also fixed.** The now-bar time chip was absolutely positioned against
the grid (it pinned to the top); its wrapper is now the positioning
context, so the chip rides the rule. And `stripHtml` now decodes numeric
entities (`it&#8217;s`) as well as the named ones — WordPress excerpts
ship both, and titles are decoded too.

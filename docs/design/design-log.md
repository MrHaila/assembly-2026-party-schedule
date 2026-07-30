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

## 7. Interaction states, sticky day band, priority locations (2026-07-30)

1. **Every affordance is pointer-cursored and has both states.** Base layer
   sets `cursor: pointer` on `button`, `summary`, `a[href]`, `[role=tab]`
   and `[role=button]` (disabled controls keep the arrow). Hover is
   *brighter* than default, active is *darker* — no exceptions. Two
   utilities own the colours so components cannot drift: `.press` on paper,
   `.press-invert` on the ink band. Event blocks use the `--event*` token
   trio for the same contract.
2. **Event surfaces are lighter than the page and translucent.** Blocks now
   read as tiles against newsprint instead of vanishing into it, and the
   hour rules stay faintly visible *through* them, so the timeline no longer
   looks like half-drawn lines between opaque boxes.
3. **The day heading is sticky.** It is exactly one line tall
   (`--day-head-h`) on purpose: the location header row parks at
   `top: var(--day-head-h)`, and a wrapping heading would desync that
   offset. Long all-day runs scroll sideways inside the band. Full label
   too — "THURSDAY 30th" on the band, compact "THU 30" on the tabs
   (`Day.label` vs `Day.shortLabel`).
4. **Grid block text is top-aligned**, so a title always sits next to its
   start time — the whole point of a proportional axis.
5. **Locations gained an editorial `priority`.** Main and Genelec are
   pinned to columns 1–2; everything without a priority is still ranked by
   event count. Promoting another location is a one-line config change.
6. **Official program links are edition-scoped and configurable.** The API's
   `program.uri` is edition-relative, so `event.config.ts` supplies
   `EVENT_EDITION` (same slug as the GraphQL endpoint) and builds
   `https://assembly.org/events/summer26/program/…`. Covered by a test.

## 8 — Day band split, edge-to-edge hour rules, absolute block labels

- The day heading is two bands: a sticky one-line day name (`--day-head-h`,
  the anchor for the location header row) and a non-sticky all-day run-on
  below it that wraps freely instead of hiding rows in a side scroller.
- Hour hairlines span `grid-column: 1 / -1`, so the rule crosses the time
  gutter to the page edge. Hour labels are `HH:MM` and sit just below their
  own rule, so the first hour is never clipped.
- Event block labels are absolutely positioned at the block's top edge:
  buttons vertically centre their content in every engine, and neither
  flex nor `align-content` reliably beats that UA behaviour.

## 9 — Hour rules behind the glass

Hour hairlines over the location columns render at `z-0`, under the event
blocks; the block's translucent surface (`--event`, alpha 0.84) mutes the
line instead of the line cutting across the block. The sticky time gutter
   draws its own hour ticks so the hairline still reaches the page edge.

## 10 — Vertical column borders

**Decision.** The location columns in the grid body now have faint vertical
borders drawn with a repeating CSS background, aligned to the same positions
as the sticky header's `border-r` cells. The rule sits behind the translucent
event blocks, so it reads through the frosted surface rather than sitting on
top of events.

**Why.** The header columns were easy to read because each had a clear
separator; the body columns ran together without one, making it harder to
trace an event up to its location header.

**Technical note.** The grid background uses `background-size:
calc((100% - 48px) / var(--cols))` and `background-position: 48px 0`, so
it stays in sync with the responsive column count and the time gutter width.
No extra DOM elements or JS measurement required.

## 11 — FI/EN language switch (FI default)

**Decision.** A two-state FI/EN switch sits in the header, right of the day
tabs. FI is the default for first-time visitors; the choice persists in
`localStorage` under `assyguide.language`. The detail sheet no longer shows a
separate "EN: …" title line.

**Why.** The event is Finnish and most on-site visitors read Finnish, but the
site copy was English-only. With a real switch, the EN title line in the modal
became redundant duplication of the same information.

**Technical note.** `src/lib/i18n/language.ts` holds the pure persistence and
`pickLocalized` fallback logic (unit tested, no DOM). `src/lib/i18n/strings.ts`
holds one dictionary per language behind a `Strings` interface, so an
untranslated key is a type error, plus localized day labels
("PERJANTAI 31.7." / "FRIDAY 31st"). `useLanguage()` (provider in `__root`)
is the only way components read the choice; SSR and first paint always render
FI and the stored value is applied in an effect to avoid hydration mismatch.
Event *titles* are not localized — the API's occurrence title is the specific
one, while the program title is a generic umbrella; only excerpts have real
FI/EN variants (`excerptFi` / `excerptEn`).

### 11b. Event blocks get a full border
Event blocks now use a 1px border on all four sides (`border-ink/45`) instead of only a top rule, so adjacent/side-by-side events in the same location read as distinct cards.

### 13. One segmented toggle
Day shortcuts and the FI/EN switch both render through `src/components/ui/SegmentedToggle.tsx` (closed API: options, activeId, onSelect, label, semantics). Active segments never react to hover; inactive ones use `.press`.

### 14. Landing scroll anchors on "now"
On first paint (no `?day=` deep link) the timeline scrolls so the now-bar sits
~20% down the scroll viewport: a little past for context, most of the screen
for upcoming events. Both the grid now-bar and the log now-marker carry
`data-now-marker` so the route needs one selector. Without a now marker
(outside event dates) it falls back to the today/first-day heading.

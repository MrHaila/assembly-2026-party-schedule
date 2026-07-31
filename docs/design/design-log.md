# ASSYGUIDE design decisions

Live decisions only — superseded ones folded in. Change the design → update
this file in the same commit. No implicit style.

Related: [data-model.md](data-model.md) (API quirks), [pwa.md](pwa.md).

## Theme

- Dark-only. No light mode, no `.dark` toggle — `:root` tokens *are* the theme.
  Used in a dark hall.
- **Brightness = importance.** Four surfaces in `styles.css`: `--paper`
  (page, darkest), `--band` (sticky chrome, opaque), `--event` (tiles, opaque
  `color-mix` over paper — covers the hour rule behind it), `--surface` (detail
  sheet, brightest, over `--scrim`).
- `--ink`/`--ink-mid`/`--rule` inverted, not re-invented, so components keep
  semantics. Structural lines use `--strong` (muted near-white); no pure-white
  hairlines. Gold (favourites), red spot (now), 12-swatch category palette
  re-tuned lighter for near-black.
- Type: IBM Plex Sans Condensed, `tabular-nums` on times (`.tnum`). Density from
  hairline rules + tight leading. No cards, radii, or shadows.
- **Styling discipline.** Components take domain-typed props only — no
  `className`/style passthrough. Style drifts in one file at a time.
- Single visual identity. Theme engine + KUAKE skin prototyped, cut — needless
  scope.

## Interaction

- Every affordance pointer-cursored, hover *brighter* / active *darker*. Two
  utilities own colours: `.press` on paper, `.press-invert` on ink band. Blocks
  use the `--event*` trio.
- One `SegmentedToggle` component for day shortcuts and the FI/EN switch. Active
  segments never react to hover.

## Grid

- CSS Grid, 5-min rows. `--slots` per day. Blocks place `grid-row: start /
  span n`, guarded `Math.max(1, …)`. Overlaps → sub-column lanes
  (`assignSubColumns`), ≤2 grid-tier. Zoom = change `--slot-h`. No absolute
  positioning, no collision math.
- **Responsive columns, zero JS.** Scroll container is a size container;
  `--cols` steps 2→8 at `48px + n×150px`. Non-fitting columns `display:none` via
  `[data-col]`; the same location's "Other locations" run-on carries
  `[data-overflow-col]`, hidden exactly when its column shows. No horizontal
  overflow. Ultrawide guard `max-width: calc(48px + var(--cols) * 280px)`.
- Hour hairlines span `grid-column: 1 / -1` to the page edge; labels `HH:MM`
  below their own rule. Gutter (`relative`) draws its own ticks. Rules structure
  the *empty* grid; an opaque tile owns its pixels.
- Vertical column borders: repeating CSS background, one per column start, synced
  to `--cols` and the 48px gutter. No extra DOM.
- Block labels absolutely positioned at the block top (buttons vertically centre
  content otherwise). Text top-aligned to its start time.
- **Day windows data-driven, 05:00 rollover** (`time.ts`). A 01:30 set stays on
  Friday (minute 1530). `computeDayWindow()` derives each day's range from its
  timed events (ongoing/all-day excluded), snapped to whole hours, +30 min pad
  each side, fallback 10:00–23:00. `formatDayMinutes()` wraps 24h+ to 00–04.
- Live blocks (`start ≤ now < end`): `.live-stripes`, 45° animated field on a
  `::before` at `z-1`, seamless 1.6s loop, frozen under
  `prefers-reduced-motion`. Neutral grey (`--ink` 12%); gold via `--stripe-color`
  if favourited (red reads as error).
- Zero-duration moments render as a labelled tick *inside their own column*, not
  a band across the grid.

## Timeline / IA

- One continuous timeline — all days in a single scroll container as
  `<section data-day-id>`. Day tabs are scroll shortcuts; `IntersectionObserver`
  moves the highlight; `?day=` sets initial scroll offset.
- Day heading = sticky one-line day name (`--day-head-h`, the anchor for the
  location header row at `top: var(--day-head-h)`) + non-sticky all-day run-on
  below (wraps). Full label "THURSDAY 30th" on the band, "THU 30" on tabs
  (`Day.label`/`shortLabel`). All-day (≥6h ongoing) lives on the run-on.
- Locations order by event COUNT desc (`normalizeVenues`), editorial `priority`
  pins Main + Genelec to cols 1–2. Re-ranked from *visible* events after
  filtering (`rankVenues`), so filtering reshapes which earn columns.
- "venue" → "location" in user-facing strings; type/prop names still `venue`.
- `px-3` aligns header, day heading, all-day, Other locations, Next up, About.
- z-order: blocks `z-10`, gutter `z-20`, now bar `z-25`, location header `z-30`,
  day heading `z-40`.

## Now indicator

- Unconditional — never disappears. `resolveNowPlacement()`
  (`now-placement.ts`) picks one home per render: `inside` (red rule in grid /
  between log rows), `before` (`NowRail` band above the day heading, incl. gaps
  between days), `after` (band at the bottom of the last day). Exactly one
  element carries `data-now-marker`.
- Landing scrolls the now-bar ~20% down the viewport; fallback today/first-day
  heading. Copy in i18n (`nowBeforeDay`, `nowAfterEvent`).

## Titles

- Show the occurrence title (`CalendarEvent.title`), not the program title —
  streamer slots share one program, so program titles erase occurrence identity.
  EN program title is a secondary line in the detail sheet when it differs.
  FI-only program → `FI` chip.

## Favourites

- Gold (`--gold`) = "mine", kept apart from red = "now". One control,
  `FavouriteStar` (sizes `grid`/`inline`/`action`) — no surface draws its own
  star or gold. State in `FavouritesProvider` over `favourites.ts`, localStorage
  `assyguide.favourites`, never throws in private mode; SSR renders zero, applied
  post-hydration.
- Starred grid block: `event-favourite` owns the whole surface (gold wash
  `--event-favourite-grid` 34%, gold border, own hover/active — neutral
  `bg-event` not applied, no ordering race), 3px gold left rule, and a big muted
  gold star clipped into the bottom-right (55% width, rot 22°, `right:-6%`). List
  / run-on: ★ glyph + gold wash `--event-favourite` 20% + gold left rule.
- **Next up** — departure board (event · countdown · location), one presentation
  at every width under the header, styled as a favourite. `formatCountdown()`
  (min / h min / d h). Mobile keeps a persistent strip.

## Category colour / filters

- `<CategoryBar />` — 3px left bar, the only component that draws an event edge.
  12 fixed Okabe-Ito swatches (`--cat-*`), lightness-staggered for
  protan/deutan/tritan. Assignment in `categories.ts`: near-synonyms share a
  swatch, unknown slugs hash deterministically. Stacks ≤4 segments. Favourite
  collapses it to one gold segment.
- **Filters** — `FILTERS` drawer, `SHOWING`/`HIDING` rows, click moves a badge.
  Subtractive: hide types, never select; empty set = show all (new feed
  categories visible by default). localStorage `assyguide.hiddenCategories`,
  post-hydration. An event hides only when *every* category is hidden.
  `CategoryBar` draws only visible swatches. All views read the one filtered set.

## i18n

- FI/EN switch in header, FI default, localStorage `assyguide.language`.
  `i18n/language.ts` = pure persistence + `pickLocalized` (tested).
  `strings.ts` = one dict per language behind a `Strings` interface (untranslated
  key = type error) + localized day labels. `useLanguage()` provider in
  `__root`; SSR/first paint always FI, stored value applied in an effect (no
  hydration mismatch). Titles not localized — only excerpts have FI/EN, fetched
  on demand.

## Data loading

Two payloads — the timeline is language-agnostic, bodies aren't. Details in
[data-model.md § Freshness](data-model.md#freshness) and `use-schedule.ts` /
`use-event-detail.ts`. Nothing bundled (the old 2 MB snapshot's refresh was dead
on load). Category colour is editorial (`categories.ts`), never from the API.

## Footer

- "Last updated N ago · N events", ticks 1s, dash placeholder on first render,
  idiomatic FI/EN plurals.
- About band is the last element *inside* the scrollable timeline (shows after
  the last day); the "last updated" stats strip stays sticky. Muted, small.
- Footer links external: `target=_blank rel=noopener noreferrer` + ↗, via one
  `ExternalLink` component. `GITHUB_REPO_URL` in `site.config.ts`.

## Deferred

Conflict detection, search, compo `overlay.json` (Partyman deadlines,
hand-authored), change tracking on `modified`, print stylesheet, `.ics` export,
now/next route, event-slug routing (`/winter26`), 14-column wide view, landscape
mobile mini-grid, zoom presets, `role="grid"` keyboard nav, alternate-hour tint
bands, minute scanline tick on the now bar. Each lands with its own entry.

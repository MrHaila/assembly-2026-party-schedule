# Event type filters

A "FILTERS" button in the header opens a filter panel where every event type is a coloured badge you can move between SHOWING and HIDING. The choice persists, dims the timeline accordingly, and re-ranks the grid columns.

## Header

- New `FILTERS` button immediately left of the language toggle, styled like the existing header controls (same borders, type scale, hover/active states).
- When any type is hidden, the button shows a count badge (e.g. `FILTERS 3`).
- Clicking toggles a panel that expands inside the sticky header area, so it pushes the timeline down instead of floating over it. State of open/closed is session-only (not persisted); the filter selection itself is persisted.

## Filter panel

Two labelled rows, both wrapping (never horizontally scrolling):

```text
SHOWING   [ EXPO ] [ GAMING ] [ ESPORTS ] [ MUSIIKKI ] ...
HIDING    [ DEMOSCENE ] [ COSPLAY ]
```

- One badge per event type found in the loaded schedule, sorted by event count (most common first) so the list order is stable and useful.
- Each badge carries its assigned category colour as a left bar / swatch matching the colours already used on events, plus the localized type label and its event count.
- Badges are real buttons with the project's standard hover (brighter) and active (darker) states and pointer cursor.
- Clicking a badge in SHOWING moves it to HIDING; clicking one in HIDING moves it back.
- HIDING row renders muted (greyed swatch) so the two groups read differently at a glance.
- When nothing is hidden, the HIDING row shows an empty-state line rather than disappearing, so the layout does not jump.

## Effect on the timeline

- **Colour bars:** an event's left bar only draws swatches for its *visible* types. If all of an event's types are hidden the bar falls back to the neutral slate swatch (favourites still override everything with gold).
- **Hiding events:** an event disappears from the timeline only when *every* one of its types is hidden. Events with at least one visible type stay.
- **Column re-ranking:** grid columns are re-ordered by the count of *visible* events per location, keeping the existing editorial priority (Main Stage, Genelec first). Locations that drop out of the top slots move into "Other locations", and vice versa — so filtering genuinely reshapes the grid.
- Everything downstream (all-day band, mobile list, "Next up", the footer event count) uses the same filtered event set, so the numbers stay consistent.
- Note: the synthetic `general` type (programless events such as the ceremonies) appears as a normal badge like any other, so it can be hidden too.

## Persistence

- Hidden type slugs stored in `localStorage` under `assyguide.hiddenCategories`, using the same defensive read/write pattern as favourites (never throws in private mode).
- SSR and first paint render "nothing hidden"; the stored set is applied in an effect to avoid hydration mismatch.

## Technical notes

- New pure module `src/lib/schedule/filters.ts`: parse/store hidden slugs, `visibleCategories(event, hidden)`, `isEventVisible(event, hidden)`, and `categoryCounts(events)` — unit tested in `tests/filters.test.ts`.
- New `src/hooks/use-filters.tsx` context provider mirroring `use-favourites.tsx` (globalThis-cached context for HMR), mounted alongside the existing providers.
- Location re-ranking moves out of `normalize.ts` into a pure `rankVenues(venues, events)` helper so it can be re-run with a filtered event list; `normalize.ts` calls the same helper for its initial ordering. Tested.
- `CategoryBar` gains an optional hidden-set-aware input so the swatch filtering lives in one place, keeping the component the only place category colour is drawn.
- New closed components: `src/components/filters/FilterPanel.tsx` and `FilterBadge.tsx` (no className/style props), plus a header button reusing the existing control styling.
- New i18n keys for `filters`, `showing`, `hiding`, `noneHidden`, and per-type display labels (FI/EN) with a fallback to the slug uppercased.
- `docs/design/design-log.md` gets entry #26 recording the filter model (hide only when all types hidden, colour bar reflects visible types only, gold still wins).

# Favourites + "Next up"

Star events you care about, and always see the next starred thing at a glance.

## Behaviour

**Starring**
- Grid (desktop): a muted star button appears in the top-right of an event block on hover/focus. Click toggles favourite.
- Favourited events: gold outline on the block, star always visible and solid gold, with gold-tuned hover/active states.
- List (mobile): no hover, so starring happens in the event detail sheet via a clear "Add to favourites / Favourited" button. Favourited rows in the list still show a solid gold star and gold accent.
- Choices persist in localStorage under `assyguide.favourites` and survive reload.

**Next up panel** (tracks favourites only)
- Desktop: sits in the middle of the header, always visible. Shows event name, countdown ("in 24 min" / "in 1h 23min"), and location.
- Mobile: fixed strip directly under the page header, above the timeline. Same primary row, plus a one-line preview of the favourite after that (train-departure-board style).
- Counts down across days when the next favourite is far off ("in 2d 3h").
- While a favourite is running, it reads as live/now rather than a countdown.
- No favourites yet: a quiet prompt to star an event.
- Both languages (FI/EN).

## Technical notes

- `src/lib/schedule/favourites.ts` — pure, framework-free: storage key, read/write/toggle with try/catch, and `nextUpFavourites(events, now, count)` returning the next 1–2 upcoming favourites using existing schedule-time helpers. Unit-tested in `tests/favourites.test.ts` (ordering, live event, cross-day, empty).
- `src/hooks/use-favourites.tsx` — provider mirroring `use-language`: `globalThis`-cached context, default empty set on SSR/first paint, hydrate from storage in an effect (no hydration mismatch), exposes `isFavourite`, `toggle`. Mounted in `__root.tsx`.
- `src/components/schedule/FavouriteStar.tsx` — the one and only star control, strictly typed (`favourite`, `onToggle`, `size` variant). Both grid and detail sheet use it; no ad-hoc stars.
- `src/components/schedule/NextUp.tsx` — presentational, receives resolved entries; a `variant` prop for header vs mobile strip.
- `EventBlock.tsx` / `ScheduleLog.tsx`: add favourite styling via existing token classes; new `--color-gold*` tokens in `src/styles.css` plus a `.press-gold` utility so no gold hex lands in components.
- New strings added to the `Strings` union in `src/lib/i18n/strings.ts` (typed, both languages) with a `formatCountdown` helper next to `formatRelativeTime`, unit-tested.
- Design log entry #17 in `docs/design/design-log.md`.

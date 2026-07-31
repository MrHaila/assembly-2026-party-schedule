# Dark mode for the schedule

Turn the whole app into a dark, LAN-party-friendly theme. Because every component
already draws from semantic tokens (`paper`, `ink`, `ink-mid`, `rule`, `event`,
`spot`, `gold`, category swatches), this is almost entirely a token change in
`src/styles.css` — no component rewrites, no inline colours.

## Visual hierarchy rule

Unlike the reference screenshot, brightness maps strictly to importance:

```text
darkest  page background (chrome, empty grid area)
   |     sticky header / footer bands, "other locations" boxes
   |     hour rules and column hairlines (faint)
   |     event blocks  (clearly lifted off the background)
brightest detail sheet / modal surface, hovered event
```

So: background is the darkest thing on screen, event tiles are a distinctly
lighter surface, and the open detail sheet is lighter still. Nothing decorative
is brighter than content.

## Token changes (src/styles.css)

- `--paper` becomes a near-black neutral with a slight cool cast; `--ink`
  becomes an off-white; `--ink-mid` a mid grey that still passes contrast on the
  new background. Every `bg-paper` / `text-ink` usage flips automatically.
- `--rule` becomes a low-contrast light-on-dark hairline (subtle, not glowing).
- Event surfaces invert their logic: `--event` is a translucent *lighter* layer
  over the page, `--event-hover` lighter again, `--event-active` slightly darker
  — hover brighter / active darker is preserved. Translucency stays so hour
  rules still ghost through the tiles.
- Popover/card/sheet tokens get their own surface one step lighter than the
  event tiles, so `DetailSheet` and the filter drawer read as the top layer.
- `--spot` (now marker) and `--marker` (hover wash) retuned so they stay
  legible and don't bloom on black.
- Gold favourite tokens and `--event-favourite*` washes recomputed against the
  dark base so favourites stay warm without glare.
- The 12 category swatches get a dark-background variant: same hues and same
  CVD-safe ordering, raised lightness/lowered chroma where needed so each bar
  reads against the dark tile. The palette stays 12 distinct entries.
- `press`, `press-gold`, `press-invert`, `live-stripes` mixes re-based on the
  dark tokens so hover/active feedback keeps the same direction.
- Past-event muting and the reverse-video (ink band) elements are re-checked so
  "muted" doesn't become invisible and inverted bands don't turn white.

## Scope notes

- Dark is the only theme — no toggle is added. The existing `.dark` block (the
  unused shadcn slate palette) is dropped so there is a single source of truth.
- Header, footer, `NextUp` strip, filter panel, `NowRail`, `OtherVenues`,
  `ScheduleLog` need no code changes; any place currently relying on a hardcoded
  light assumption gets moved onto a token instead.
- `docs/design/design-log.md` gets a new entry recording the dark palette and
  the brightness-equals-importance hierarchy rule.

## Verification

- Screenshot the grid, a hovered event, an open detail sheet, the filter drawer,
  and the mobile list via Playwright to confirm layering and contrast.
- Existing Vitest suites should stay green (logic untouched).

# KUAKE theme — a 90s id-Software skin for the schedule

Goal: make the existing app switchable into a DOS/Quake-era pixel skin, without changing a single
label, button, position, or behaviour — and without touching how MODERN renders today.

## The approach in one line

Add a real theme engine (a `data-theme` attribute on `<html>` + a persisted choice), keep every
current style value as the untouched default, and express KUAKE purely as an additive override
layer of design tokens, textures and a pixel font.

## What the user sees

- THEMES modal: both tiles become selectable. Clicking a tile applies the theme instantly and
  remembers it (same persistence style as the language toggle). MODERN stays the default.
- Choosing KUAKE repaints the whole page: dark metal/stone panel chrome, bevelled 3D borders,
  amber-olive event tiles, green terminal text for times and day headings, red spot for the
  "now" line and footer, gold star favourites, and a pixel typeface throughout.
- The Assembly mark in the top-left stays — rendered pixelated (nearest-neighbour, no smoothing)
  so it reads as 90s sprite art. No id logo.
- Everything else — every string, every button, "Next up", filters, day headings, other
  locations, detail sheet, footer — keeps identical structure, wording and position.

## Guarantee: MODERN cannot regress

- All current token values stay exactly where they are, in `:root`, unchanged.
- KUAKE lives in a `[data-theme="kuake"]` block appended after them. With no attribute, or with
  `modern`, not one declaration applies — so MODERN output is byte-identical to today.
- No existing component's class list is rewritten for KUAKE's benefit. Where KUAKE needs
  something structural that CSS can't reach (e.g. bevel edges, texture layers), it is added as a
  theme-scoped CSS rule targeting existing selectors/data attributes, not as new markup.
- The two small exceptions where markup does change are additive and inert under MODERN:
  a `data-theme` attribute on the root element, and a theme-scoped wrapper class on the app
  shell. Both render nothing by themselves.

## Technical plan

### 1. Theme engine
- `src/lib/theme/theme.ts` — `Theme` type, `DEFAULT_THEME`, `readStoredTheme`, `storeTheme`
  (localStorage, SSR-safe), mirroring `src/lib/i18n/language.ts`.
- `src/hooks/use-theme.tsx` — provider + hook, same globalThis-cached context pattern as
  `use-language.tsx`; SSR/first paint render the default and an effect applies the stored value,
  writing `document.documentElement.dataset.theme`.
- Mount the provider in `src/routes/__root.tsx` alongside the existing providers.
- Tests: `tests/theme.test.ts` for storage read/write/fallback on unknown values.

### 2. Themes config + dialog
- `themes.config.ts`: mark `kuake` available, add a preview image, keep the catalogue shape.
- `ThemesDialog.tsx`: tiles become buttons that call `setTheme`; the ACTIVE/COMING SOON chip now
  reflects the live selection. Layout, copy and translations unchanged.

### 3. Token layer for KUAKE (`src/styles.css`)
A `[data-theme="kuake"]` block re-points existing semantic tokens — no new component code:
- surfaces: near-black stone/metal panels; `--event` olive-amber; `--surface` lighter panel.
- ink: pale bone body text, phosphor green for times/day labels, blood red for the spot colour.
- rules/strong: bevel light and shadow colours.
- `--font-listings` swapped to the pixel stack.
- gold favourites retuned to the brighter 8-bit gold seen in the reference.

### 4. Theme-scoped chrome
Additive rules under `[data-theme="kuake"]` only:
- Bevelled 3D edges (light top/left, dark bottom/right) on header bands, event tiles, buttons,
  location headers and the modal — implemented with box-shadow insets so no borders move.
- Texture backgrounds applied to the page, chrome bands and event tiles.
- `image-rendering: pixelated` on the Assembly mark and previews; crisp 1px rules; no radii.
- Live stripes keep their existing animation but pick up the retro stripe colour.
- Optional faint scanline overlay on the page background, disabled under reduced-motion-safe
  concerns (static, so it stays on).

### 5. Assets
Generated through the Diffui build endpoints in the design brief and stored as CDN assets
(`.asset.json` pointers, matching how `theme-modern.jpg` is handled):
- seamless dark stone/metal panel texture (page + chrome bands)
- seamless subtler dark texture for event tiles
- KUAKE theme preview screenshot, captured from the running app once the theme is in

Fonts: a pixel/VGA-style webfont pair loaded via a `<link>` in the root head (the project's
required way to load remote fonts), scoped to KUAKE through `--font-listings`. Body/grid text
uses the more legible pixel mono; headings use the chunkier display face. If legibility at the
grid's 10.5–13px sizes suffers, sizes stay put and only the face changes.

### 6. Verification
- Playwright pass over both themes at desktop and mobile widths: screenshots of grid, other
  locations, filters panel, themes modal and detail sheet.
- A MODERN before/after screenshot diff to prove no visual regression.
- Existing vitest suite plus the new theme storage test.
- `docs/design/design-log.md` gets a new entry documenting the theme engine and KUAKE's token
  contract, per the project's design-docs rule.

### 7. Secrets hygiene
The asset-generation service URLs, auth tokens and request details stay out of the repository
entirely — no design-log entries, no comments, no scripts, no committed fetch commands. Design
docs describe only the resulting assets and their design intent. Generation happens in the
sandbox scratch space; only the finished asset pointers land in git.

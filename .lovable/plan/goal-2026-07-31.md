Plan: iOS Progressive Web App support

## Goal
Make the Assembly Schedule viewer feel like a native iOS app when added to the home screen, with offline support and safe-area-aware layout.

## Scope decisions
- **Home screen metadata + offline support** using `vite-plugin-pwa` with `generateSW`.
- **App icon**: reuse the Assembly "A" mark rendered from `src/components/AssemblyMark.tsx`.
- **iOS status bar**: `black-translucent` to blend with the dark theme.

## Current state
- No `manifest.json` / `manifest.webmanifest` exists in `public/`.
- No service worker or PWA plugin is installed.
- `src/routes/__root.tsx` already defines `head()` and is the right place for iOS meta tags.
- The app is dark-only (`--paper` oklch(0.165 ...)) and uses a fixed header/footer.
- `AssemblyMark.tsx` is an SVG whose path can be reused for icon generation.

## Plan

1. **Generate the app icon set from the Assembly mark**
   - Create `public/assembly-mark-source.svg` from the existing path in `AssemblyMark.tsx`.
   - Render square PNGs with the dark background color (`#140f1a` or the `--paper` hex) and the mark centered:
     - `public/icon-192x192.png`
     - `public/icon-512x512.png`
     - `public/apple-touch-icon.png` (180x180, iOS applies rounding automatically)
   - Keep transparent padding inside the safe icon area so the "A" does not touch the edges.

2. **Add a web app manifest**
   - Create `public/manifest.webmanifest` (or let `vite-plugin-pwa` generate it):
     - `name`: "Assembly Schedule"
     - `short_name`: "ASSYguide"
     - `start_url`: "/"
     - `display`: "standalone"
     - `background_color`: matches `--paper`
     - `theme_color`: matches `--band`
     - `icons`: 192x192 and 512x512 PNGs

3. **Add iOS-specific head tags in `src/routes/__root.tsx`**
   - `<meta name="theme-color" content="{paper-hex}" />` (already present via theme-color; confirm it matches standalone chrome).
   - `<meta name="apple-mobile-web-app-capable" content="yes" />`.
   - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`.
   - `<meta name="apple-mobile-web-app-title" content="Assembly Schedule" />`.
   - `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`.
   - Optionally add `apple-touch-startup-image` for a splash screen during launch.

4. **Add safe-area insets for the iOS notch / home indicator**
   - Update the viewport meta in `__root.tsx` to include `viewport-fit=cover`:
     - `width=device-width, initial-scale=1, viewport-fit=cover`
   - Add `padding-top: env(safe-area-inset-top)` to the fixed header so status bar text does not overlap the title.
   - Add `padding-bottom: env(safe-area-inset-bottom)` to the fixed footer so the home indicator does not obscure the last-updated text.
   - Ensure the main scroll area accounts for any increased header/footer height.

5. **Set up offline support with `vite-plugin-pwa`**
   - Install `vite-plugin-pwa`.
   - Configure `vite.config.ts` with `generateSW`:
     - `registerType: "autoUpdate"`
     - `filename: "/sw.js"`
     - `injectRegister: null` (we register manually from a guarded wrapper)
     - `devOptions: { enabled: false }` so no SW is generated in dev
     - Workbox runtime caching for:
       - static build assets (CacheFirst, hashed)
       - HTML navigations (NetworkFirst)
       - the schedule API (network-first with a cache fallback, short max-age)
   - Create a guarded registration module at `src/lib/pwa-register.ts` that:
     - Only registers in production (`import.meta.env.PROD`).
     - Refuses to register inside Lovable preview, iframe, or `?sw=off`.
     - Unregisters any existing `/sw.js` in dev/preview contexts.
   - Import and call the guarded registration once in `src/routes/__root.tsx` behind `useEffect`.
   - Exclude `/~oauth` from navigation fallback.

6. **iOS UX polish**
   - Review touch targets (minimum 44x44 CSS px) on header buttons, filter toggles, event tiles, and the star.
   - Ensure the bottom sheet / detail modal does not conflict with the home indicator.
   - Disable text selection on chrome UI if it feels native, but keep it on event descriptions.

7. **Testing**
   - Add a test that verifies the manifest responds at `/manifest.webmanifest` and has the expected fields.
   - Add a test that verifies the iOS meta tags exist in the rendered HTML.
   - Add a Playwright check that the app installs as a standalone PWA in a simulated iOS viewport and that the SW is registered in a production preview.
   - Verify the offline page still loads after a first visit in a simulated flaky network.

## Out of scope
- Push notifications (no user request).
- App Store / native packaging.
- New theme visual direction (only PWA/iOS chrome and layout insets).

## Files to change
- `public/assembly-mark-source.svg` (new)
- `public/icon-192x192.png` (new)
- `public/icon-512x512.png` (new)
- `public/apple-touch-icon.png` (new)
- `public/manifest.webmanifest` (new)
- `src/routes/__root.tsx` (iOS meta tags, viewport, safe-area classes, PWA registration)
- `src/styles.css` (safe-area utility classes, touch-target helpers if needed)
- `src/lib/pwa-register.ts` (new)
- `vite.config.ts` (PWA plugin configuration)
- `package.json` (new dependency)
- `tests/pwa.test.ts` (new)

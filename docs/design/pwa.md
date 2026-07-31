# Progressive Web App support

ASSYguide is built to work as a standalone app on iOS when added to the home screen.

## Scope

- Home-screen installability (icons, manifest, iOS meta tags).
- Offline use: the app shell is served by the service worker even when the network is unavailable, so the schedule still loads once it has been visited at least once.
- Safe-area insets so the fixed header and footer avoid the notch and home indicator.

No push notifications, no background sync, and no custom "native" app features. Keep it simple and safe.

## Service worker

- `vite-plugin-pwa` generates `/sw.js` at build time from `vite.config.ts`.
- The wrapper in `src/lib/pwa-register.ts` is the only place the service worker is registered.
- It refuses to register in:
  - development builds
  - the Lovable editor preview
  - iframes
  - URLs containing `?sw=off`
- In refused contexts the wrapper unregisters any existing `/sw.js` so stale caches do not survive.

## Offline app shell

TanStack Start is SSR-first, so the client build does not produce a static `index.html`. A build plugin (`generateFallbackHTML` in `vite.config.ts`) writes `dist/client/index.html` after the hashed assets are emitted. VitePWA precaches that file and Workbox serves it as the navigation fallback for `/` (with `/api/*` and `/~oauth` excluded). The first offline visit after the app has been online therefore loads the shell and client assets from the cache, even though the root is normally rendered server-side.

## Caching strategy

- Static hashed assets (JS, CSS, fonts, icons): `CacheFirst`.
- HTML navigations to `/`: precached `client/index.html` fallback via Workbox `NavigationRoute`.
- Demoscene timetable and Assembly GraphQL: `NetworkFirst` with a short cache as a fallback only.

## Manifest and icons

- `public/manifest.webmanifest` is maintained manually.
- Icons are generated from `public/assembly-mark.svg` and live as PNG files in `public/`.
- `public/favicon.png` is the site favicon.
- iOS-specific tags live in `src/routes/__root.tsx` head.

## Safe areas

- `src/styles.css` defines `safe-area-top` and `safe-area-bottom` utilities.
- The fixed header and footer in `src/routes/index.tsx` apply those utilities.
- `viewport-fit=cover` is set in the root viewport meta tag so the app fills the screen.


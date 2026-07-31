# Progressive Web App support

ASSYguide is built to work as a standalone app on iOS when added to the home screen.

## Scope

- Home-screen installability (icons, manifest, iOS meta tags).
- Offline caching of the app shell and static assets so the schedule can still be viewed when connectivity is poor.
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

## Caching strategy

- Static hashed assets (JS, CSS, fonts, icons): `CacheFirst`.
- HTML navigations: `NetworkFirst` fallback to `/`, except `/api/*` and `/~oauth`.
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

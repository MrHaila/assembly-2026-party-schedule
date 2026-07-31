// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import type { Plugin } from "vite";

/**
 * VitePWA should only run in the client build. TanStack Start builds multiple
 * environments (client, SSR, nitro); the service worker must be generated from
 * the client assets and not overwritten by server-side entries.
 */
function clientOnlyPWA(): Plugin[] {
  const raw = VitePWA({
    // Manifest is maintained manually in public/manifest.webmanifest so the
    // iOS tags and icon set stay visible in the repo.
    manifest: false,
    // Generate the service worker; no hand-written SW.
    strategies: "generateSW",
    filename: "sw.js",
    registerType: "autoUpdate",
    // We register manually from a guarded wrapper so dev/preview never
    // get a service worker.
    injectRegister: null,
    devOptions: { enabled: false },
    workbox: {
      // Serve the app shell even when offline, but never cache OAuth or
      // API routes in the app-shell fallback.
      navigateFallback: "/",
      navigateFallbackDenylist: [/^\/api\//, /^\/~oauth/],
      // Cache the static build assets aggressively (hashed filenames).
      globPatterns: ["**/*.{js,css,html,woff2,woff,png,svg,ico,webmanifest}"],
      // Runtime caches for external fonts and the demoscene proxy.
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
          },
        },
        {
          urlPattern: /^https:\/\/scene\.assembly\.org\/api\/v1\/timetable\//i,
          handler: "NetworkFirst",
          options: {
            cacheName: "scene-timetable",
            expiration: {
              maxEntries: 1,
              maxAgeSeconds: 60 * 15,
            },
          },
        },
        {
          urlPattern: /^https:\/\/api\.assembly\.org\/v1\/graphql/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "assembly-graphql",
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 60 * 60,
            },
          },
        },
      ],
    },
  });

  const plugins = Array.isArray(raw) ? raw : [raw];
  return plugins.map((plugin) => ({
    ...plugin,
    apply: (config, env) => {
      if (env.isSsrBuild || config?.build?.ssr) return false;
      return true;
    },
  })) as Plugin[];
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [clientOnlyPWA()],
  },
});

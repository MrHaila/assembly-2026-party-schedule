// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const SW_FALLBACK = "client/index.html";

/**
 * VitePWA only needs to run in the client environment. TanStack Start builds
 * multiple environments (client, SSR, nitro); we use the Vite 7
 * configEnvironment hook to attach the plugin only to the client environment.
 */
function pwaClientPlugin(): Plugin {
  return {
    name: "pwa-client-only",
    configEnvironment(name) {
      if (name !== "client") return;
      return {
        plugins: [
          VitePWA({
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
              globPatterns: [
                "**/*.{js,css,html,woff2,woff,png,svg,ico,webmanifest}",
              ],
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
          }) as Plugin,
        ],
      };
    },
  };
}

/**
 * TanStack Start is an SSR framework, so the root route does not produce a
 * static index.html in the client build. Workbox needs a precached HTML shell
 * to serve as the offline navigation fallback. This plugin writes a minimal
 * HTML file into the client output directory after the client assets are
 * hashed, so VitePWA can precache it and the service worker can serve it for
 * navigations to "/".
 */
function generateFallbackHTML(): Plugin {
  return {
    name: "generate-fallback-html",
    apply: "build",
    configEnvironment(name) {
      if (name !== "client") return;
    },
    closeBundle() {
      const clientDir = path.resolve("dist/client");
      if (!fs.existsSync(clientDir)) return;

      const assetsDir = path.join(clientDir, "assets");
      const files = fs.readdirSync(assetsDir);
      const js = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
      const css = files.find(
        (f) => f.startsWith("styles-") && f.endsWith(".css"),
      );
      if (!js || !css) {
        console.warn("[fallback-html] Could not find hashed client assets");
        return;
      }

      const html = `<!DOCTYPE html>
<html lang="fi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Assembly Schedule</title>
  <meta name="description" content="The better party schedule viewer for Assembly Summer 2026.">
  <meta name="theme-color" content="#0a1112">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Assembly Schedule">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="/client/assets/${css}">
</head>
<body>
  <script type="module" src="/client/assets/${js}"></script>
</body>
</html>
`;
      fs.writeFileSync(path.join(clientDir, "index.html"), html);
      console.log("[fallback-html] Generated client/index.html");
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [pwaClientPlugin(), generateFallbackHTML()],
  },
});

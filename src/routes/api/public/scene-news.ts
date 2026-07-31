/**
 * Same-origin proxy for the demoscene news feed.
 *
 * scene.assembly.org sends no CORS headers, so the browser cannot poll it
 * directly. This route forwards the request server-side and returns the raw
 * JSON with a short cache window. Read-only, no credentials, no PII.
 */
import { createFileRoute } from "@tanstack/react-router";

const NEWS_ENDPOINT = "https://scene.assembly.org/api/v1/news/";

export const Route = createFileRoute("/api/public/scene-news")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const upstream = await fetch(NEWS_ENDPOINT, {
            headers: { accept: "application/json" },
          });
          if (!upstream.ok) {
            return new Response("[]", {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }
          return new Response(await upstream.text(), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "cache-control": "public, max-age=60",
            },
          });
        } catch {
          return new Response("[]", {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});

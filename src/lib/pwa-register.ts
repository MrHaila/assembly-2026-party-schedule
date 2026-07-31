/**
 * Guarded PWA service-worker registration.
 *
 * Rules (docs/design/pwa.md):
 * - Register only in production builds.
 * - Never register inside the Lovable editor preview, an iframe, or when
 *   `?sw=off` is present.
 * - In refused contexts, unregister any existing app SW so stale caches do not
 *   survive.
 */

const SW_PATH = "/sw.js";

export function isRefusedHost(hostname: string): boolean {
  if (hostname === "localhost") return false;
  if (hostname.startsWith("id-preview--")) return true;
  if (hostname.startsWith("preview--")) return true;
  if (hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com"))
    return true;
  if (hostname === "lovableproject-dev.com" || hostname.endsWith(".lovableproject-dev.com"))
    return true;
  if (hostname === "beta.lovable.dev" || hostname.endsWith(".beta.lovable.dev")) return true;
  return false;
}

export function shouldRegister(): boolean {

  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  if (window.self !== window.top) return false;
  if (isRefusedHost(window.location.hostname)) return false;
  if (window.location.search.includes("sw=off")) return false;
  return true;
}

async function unregisterMatching(scope: string): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((r) => r.scope.includes(scope))
      .map((r) => r.unregister()),
  );
}

export async function registerPWA(): Promise<void> {
  if (!shouldRegister()) {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      await unregisterMatching("/");
    }
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: "/",
    });
    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (installing) {
        installing.addEventListener("statechange", () => {
          if (installing.state === "activated") {
            window.location.reload();
          }
        });
      }
    });
  } catch (error) {
    console.error("[pwa] service worker registration failed", error);
  }
}

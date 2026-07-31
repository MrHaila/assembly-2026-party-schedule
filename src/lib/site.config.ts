/**
 * Site-level meta configuration.
 *
 * These are hand-owned constants that do not come from the event API.
 * The GitHub repo URL points at the public source repository.
 */
export const GITHUB_REPO_URL = "https://github.com/MrHaila/assembly-2026-party-schedule";

/**
 * Feature flags for work-in-progress surfaces.
 *
 * Off by default so nothing half-built reaches production. Flip a flag to
 * `true` locally (or gate it on `import.meta.env.DEV`) while developing.
 */
export const FEATURE_FLAGS = {
  /** Header "Themes" button + picker dialog. Ships once a second theme exists. */
  themeSwitcher: false,
} as const;

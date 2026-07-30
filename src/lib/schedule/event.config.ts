/**
 * Per-edition configuration.
 *
 * The WPGraphQL endpoint is edition-scoped
 * (`https://wp.assembly.org/<edition>/graphql`) but the public site nests the
 * same content under `/events/<edition>/…`. The API's `program.uri` is
 * edition-relative ("/program/asm-game-jam-2026/"), so the public URL can NOT
 * be built from `uri` alone — it needs this prefix. One constant, derived from
 * the same edition slug as the endpoint, instead of hardcoded links.
 */
export const EVENT_EDITION = "summer26";

export const SITE_BASE = "https://assembly.org";

/** Absolute base for edition-relative program URIs. */
export const PROGRAM_BASE = `${SITE_BASE}/events/${EVENT_EDITION}`;

/** `/program/x/` → `https://assembly.org/events/summer26/program/x/` */
export function programUrl(uri: string): string {
  return `${PROGRAM_BASE}${uri.startsWith("/") ? uri : `/${uri}`}`;
}
